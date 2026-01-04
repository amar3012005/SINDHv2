import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { getCurrentUser, logout } from '../utils/authUtils';
import { Briefcase, ArrowRight, X, Phone, Loader2, RefreshCw } from 'lucide-react';
import { buildApiUrl, getApiUrl } from '../utils/apiUtils';
import axios from 'axios';
import { db, auth } from '../config/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import NotificationBell from './NotificationBell';
import '../styles/homepage-light.css';



function Homepage() {
  // Main Homepage Component
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [shaktiScore, setShaktiScore] = useState(null);

  // Pull to refresh state
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const refreshThreshold = 80;

  // Refresh handler
  const handleRefresh = async () => {
    // Haptic feedback if available (native feel)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setIsRefreshing(true);
    const toastId = toast.loading('Refreshing...');

    try {
      // Refresh connection (other data like counts and profile are real-time)
      await detectAndShowBackendConnection();

      toast.update(toastId, { render: 'Updated!', type: 'success', isLoading: false, autoClose: 1000 });
    } catch (error) {
      console.error("Refresh failed", error);
      toast.update(toastId, { render: 'Refresh failed', type: 'error', isLoading: false, autoClose: 2000 });
    } finally {
      setIsRefreshing(false);
      setPullY(0);
    }
  };

  // Pull to refresh gesture logic
  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only enable if we are at the very top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      // Only handle pull down if we started at top and are pulling down
      if (window.scrollY === 0 && currentY > startY.current) {
        // Calculate pull distance with resistance
        const diff = (currentY - startY.current) * 0.4;
        if (diff > 0) {
          // Prevent default to disable native browser reload behaviors if implemented
          if (e.cancelable && diff < 200) e.preventDefault();
          setPullY(diff);
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullY > refreshThreshold) {
        handleRefresh();
      } else {
        setPullY(0); // Snap back
      }
      startY.current = 0;
    };

    // Attach listeners to window for broad capture
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // non-passive to allow preventDefault
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullY]);

  // Job notification states
  const [jobCount, setJobCount] = useState(0);
  const [jobCountLoading, setJobCountLoading] = useState(false);
  const [showJobNotification, setShowJobNotification] = useState(false);
  const [showInProgressNotification, setShowInProgressNotification] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [workerProfile, setWorkerProfile] = useState(null);

  // Menu refs for focus management - Comment 5
  const homeMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const homeMenuTriggerRef = useRef(null);
  const userMenuTriggerRef = useRef(null);

  // Logo asset centralization - Comment 7
  const logoSrc = '/sindh.svg';

  // Worker financial states
  const [workerBalance, setWorkerBalance] = useState(0);
  const [recentEarnings, setRecentEarnings] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHomeMenu, setShowHomeMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [homeLang, setHomeLang] = useState(localStorage.getItem('homeLang') || 'EN');
  const isHindi = homeLang === 'HI';
  const loadCsvResources = async (langCode) => {
    try {
      const code = langCode.toLowerCase();
      const res = await fetch(`/languages/${code}.csv`, { cache: 'no-cache' });
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      const bundle = {};
      for (const line of lines) {
        const [key, ...rest] = line.split(',');
        const value = rest.join(',').replace(/^"|"$/g, '');
        if (key) bundle[key.trim()] = value.trim();
      }
      if (Object.keys(bundle).length) {
        i18n.addResourceBundle(code, 'home', bundle, true, true);
      }
    } catch (_) {
      // fail silently
    }
  };
  const toggleHomeLang = async () => {
    const next = isHindi ? 'EN' : 'HI';
    setHomeLang(next);
    localStorage.setItem('homeLang', next);
    const code = next.toLowerCase();
    await loadCsvResources(next);
    i18n.changeLanguage(code);
  };

  useEffect(() => {
    // Initial load
    (async () => {
      await loadCsvResources(homeLang);
      i18n.changeLanguage(homeLang.toLowerCase());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState(null);
  const [hasShownConnectionStatus, setHasShownConnectionStatus] = useState(false);

  // Work reminder states
  const [workReminders, setWorkReminders] = useState([]);
  const [showWorkReminders, setShowWorkReminders] = useState(false);

  // Get user from context and fallback to localStorage if needed
  const { user: contextUser, isLoadingUser, logoutUser, fetchUserProfile } = useUser();
  const user = contextUser || getCurrentUser();

  // Backend connection detection function
  const detectAndShowBackendConnection = useCallback(async () => {
    try {
      if (hasShownConnectionStatus || sessionStorage.getItem('connectionToastShown') === '1') return;
      const apiBase = (getApiUrl() || '').replace(/\/$/, '');
      const healthUrl = `${apiBase}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      let response;
      try {
        response = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
      } catch (e) {
        // fallback to base URL if /health not available
        try {
          response = await fetch(apiBase || '/', { method: 'HEAD', signal: controller.signal });
        } catch (e2) {
          response = null;
        }
      } finally {
        clearTimeout(timeoutId);
      }
      if (response && response.ok) {
        const isLocalBackend = apiBase.includes('localhost');
        const backendType = isLocalBackend ? 'Local' : 'Remote';
        setBackendStatus(backendType);
        const toastMessage = isLocalBackend ? '🔗 Connected to Local Backend' : '🔗 Connected to Backend';
        toast.success(toastMessage, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: 'linear-gradient(135deg, #FF7124 0%, #e66420 100%)',
            color: '#fff',
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(255, 113, 36, 0.3)'
          }
        });
        setHasShownConnectionStatus(true);
        sessionStorage.setItem('connectionToastShown', '1');
        console.log(`📡 Backend reachable at: ${apiBase}`);
      } else {
        console.log('⚠️ Backend not reachable; suppressing connection toast');
      }
    } catch (error) {
      console.log('⚠️ Backend ping failed; suppressing connection toast');
    }
  }, [hasShownConnectionStatus]);

  // Backend connection detection on homepage load
  useEffect(() => {
    // Small delay to ensure API configuration is initialized
    const timer = setTimeout(() => {
      detectAndShowBackendConnection();
    }, 1000);

    return () => clearTimeout(timer);
  }, [detectAndShowBackendConnection]);

  // Real-time listeners for profile and job counts (auth-gated to avoid permission-denied)
  useEffect(() => {
    if (!user?.id) return;

    let unsubscribeProfile = () => {};
    let unsubscribeJobs = () => {};
    let unsubscribeApps = () => {};
    let unsubscribeEmployerJobs = () => {};

    const stopAuth = onAuthStateChanged(auth, (authUser) => {
      if (!authUser) {
        console.warn('⚠️ Auth not ready; waiting to attach homepage listeners');
        return;
      }

      const collectionName = user.type === 'employer' ? 'employers' : 'workers';
      const profileRef = doc(db, collectionName, user.id);

      console.log(`📡 Setting up real-time listener for ${collectionName}/${user.id}`);
      unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('👤 Profile updated:', data);
          setWorkerProfile(data);
          if (user.type === 'worker') {
            setWorkerBalance(data.wallet?.totalBalance || data.balance || 0);
            setRecentEarnings(data.wallet?.transactionHistory?.slice(-5) || []);
          }
        }
      }, (error) => {
        console.error('❌ Profile listener error:', error);
      });

      // 1. Worker Listeners
      if (user.type === 'worker') {
        // Job count listener (Available jobs)
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('status', 'in', ['POSTED', 'active', 'APPLIED'])
        );

        console.log('📡 Setting up real-time job count listener');
        unsubscribeJobs = onSnapshot(jobsQuery, (querySnapshot) => {
          let activeJobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          if (user.location?.district || user.location?.state) {
            activeJobs = activeJobs.filter(job => {
              const jobLoc = job.location || {};
              const userLoc = user.location || {};
              if (userLoc.district && jobLoc.district) {
                return jobLoc.district.toLowerCase() === userLoc.district.toLowerCase();
              }
              if (userLoc.state && jobLoc.state) {
                return jobLoc.state.toLowerCase() === userLoc.state.toLowerCase();
              }
              return true;
            });
          }

          const count = activeJobs.length;
          console.log('🎯 Real-time job count:', count);
          setJobCount(count);

          if (count > 0 && !hasShownNotification) {
            setTimeout(() => {
              setShowJobNotification(true);
              setHasShownNotification(true);
            }, 1500);
          }
        }, (error) => {
          console.error('❌ Job count listener error:', error);
        });

        // Application listener (Completed count)
        const appsQuery = query(
          collection(db, 'applications'),
          where('worker', '==', user.id)
        );
        unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
          const apps = snapshot.docs.map(d => d.data());
          const completedCount = apps.filter(a => ['completed', 'paid', 'finished'].includes(a.status?.toLowerCase())).length;
          setWorkerProfile(prev => ({ ...prev, completedJobsCount: completedCount }));
        });
      }

      // 2. Employer Listeners
      if (user.type === 'employer') {
        // Posted jobs count
        const employerJobsQuery = query(
          collection(db, 'jobs'),
          where('employer', '==', user.id)
        );
        unsubscribeEmployerJobs = onSnapshot(employerJobsQuery, (snapshot) => {
          const jobDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setWorkerProfile(prev => ({
            ...prev,
            postedJobsCount: jobDocs.length,
            activeJobsCount: jobDocs.filter(j => ['POSTED', 'active', 'APPLIED', 'accepted', 'working'].includes(j.status)).length,
            completedJobsCount: jobDocs.filter(j => j.status === 'completed').length
          }));
        });
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeJobs();
      unsubscribeApps();
      unsubscribeEmployerJobs();
      stopAuth && stopAuth();
    };
  }, [user?.id, user?.type, user?.location?.state, hasShownNotification]);

  // Work reminders functionality
  useEffect(() => {
    const loadWorkReminders = () => {
      if (!user?.id) return;

      const storageKey = user.type === 'employer' ? 'employerWorkReminders' : 'workerWorkReminders';
      const reminders = JSON.parse(localStorage.getItem(storageKey) || '[]');

      // Filter active reminders (not dismissed and within last 7 days)
      const activeReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.startedAt);
        const daysDiff = (new Date() - reminderDate) / (1000 * 60 * 60 * 24);
        return reminder.status === 'active' && daysDiff <= 7;
      });

      setWorkReminders(activeReminders);
      setShowWorkReminders(activeReminders.length > 0);

      console.log(`📋 Loaded ${activeReminders.length} work reminders for ${user.type}`);
    };

    // Load reminders on component mount
    loadWorkReminders();

    // Listen for new work reminders
    const handleWorkReminderAdded = (event) => {
      console.log('🔔 New work reminder added:', event.detail);
      loadWorkReminders();
    };

    window.addEventListener('workReminderAdded', handleWorkReminderAdded);

    // Refresh reminders every 30 seconds
    const reminderInterval = setInterval(loadWorkReminders, 30000);

    return () => {
      window.removeEventListener('workReminderAdded', handleWorkReminderAdded);
      clearInterval(reminderInterval);
    };
  }, [user?.id, user?.type]);

  // Dismiss work reminder
  const dismissWorkReminder = (reminderId) => {
    const storageKey = user.type === 'employer' ? 'employerWorkReminders' : 'workerWorkReminders';
    const reminders = JSON.parse(localStorage.getItem(storageKey) || '[]');

    const updatedReminders = reminders.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, status: 'dismissed', dismissedAt: new Date().toISOString() }
        : reminder
    );

    localStorage.setItem(storageKey, JSON.stringify(updatedReminders));

    // Update local state
    setWorkReminders(prev => prev.filter(r => r.id !== reminderId));

    if (workReminders.length <= 1) {
      setShowWorkReminders(false);
    }

    console.log(`✅ Work reminder ${reminderId} dismissed`);
  };

  // Keyboard handlers for logout confirmation modal - Comment 2
  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLogoutConfirm(false);
      } else if (e.key === 'Enter') {
        handleLogout();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLogoutConfirm]);

  // Focus management for home menu - Comment 5
  useEffect(() => {
    if (!showHomeMenu) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowHomeMenu(false);
        // Return focus to trigger button
        homeMenuTriggerRef.current?.focus();
      }
    };

    const handleOutsideClick = (e) => {
      if (homeMenuRef.current && !homeMenuRef.current.contains(e.target) &&
        homeMenuTriggerRef.current && !homeMenuTriggerRef.current.contains(e.target)) {
        setShowHomeMenu(false);
      }
    };

    // Focus first button in menu
    const firstButton = homeMenuRef.current?.querySelector('button');
    firstButton?.focus();

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showHomeMenu]);

  // Focus management for user menu - Comment 5
  useEffect(() => {
    if (!showUserMenu) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        // Return focus to trigger button
        userMenuTriggerRef.current?.focus();
      }
    };

    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target) &&
        userMenuTriggerRef.current && !userMenuTriggerRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    // Focus first button in menu
    const firstButton = userMenuRef.current?.querySelector('button');
    firstButton?.focus();

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showUserMenu]);

  // Logout function
  const handleLogout = () => {
    // Use the authUtils logout function
    logout();

    // Use the context logout function to update state
    logoutUser();

    // Clear any other auth-related data
    sessionStorage.clear();

    // Show logout message
    toast.success('Successfully logged out!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        background: 'linear-gradient(135deg, #3B4883 0%, #272D4E 100%)',
        color: '#fff',
        fontWeight: 600,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(59, 72, 131, 0.3)'
      }
    });

    // Navigate to homepage and refresh
    navigate('/', { replace: true });
    window.location.reload();
  };

  // Removed stats/category/latest jobs fetching for simplified homepage

  useEffect(() => {
    console.log('Homepage useEffect - user changed:', user);

    if (location.state?.showWelcome && user) {
      toast.success(`${t('home.welcomeBack')}, ${user.name}!`);
      navigate('/', { replace: true, state: {} });
    }
  }, [location, user, navigate, t]);

  const fetchShaktiScore = async (workerId) => {
    try {
      const response = await fetch(buildApiUrl(`/workers/${workerId}/shakti-score`));
      if (!response.ok) {
        throw new Error('Failed to fetch Shakti score');
      }
      const data = await response.json();
      setShaktiScore(data.score);
    } catch (error) {
      console.error('Error fetching Shakti score:', error);
      setShaktiScore(null);
    }
  };

  // Removed public recent jobs fetch for simplified homepage

  useEffect(() => {
    // Only fetch Shakti score from backend if not present in real-time profile
    if (!isLoadingUser && user && user.type === 'worker' && !workerProfile?.shaktiScore) {
      fetchShaktiScore(user.id);
    }
  }, [user, isLoadingUser, workerProfile?.shaktiScore]);

  const isAuthenticated = user && contextUser;

  const handleFindWork = () => {
    if (!isAuthenticated) {
      toast.info(t('home.loginFirst'));
      navigate('/login?type=worker');
      return;
    }
    navigate('/jobs');
  };

  const handlePostJob = () => {
    if (!isAuthenticated) {
      toast.info(t('home.loginAsEmployer'));
      navigate('/login?type=employer');
      return;
    }

    if (user.type !== 'employer') {
      toast.error(t('home.onlyEmployers'));
      return;
    }

    navigate('/employer/post-job');
  };

  const handleMyJobs = () => {
    if (!isAuthenticated) {
      toast.info(t('home.loginFirst'));
      navigate('/login?type=worker');
      return;
    }
    navigate('/worker/applications');
  };

  const handleViewJobs = () => {
    navigate('/jobs');
    setShowJobNotification(false);
  };

  const handleCloseJobNotification = () => {
    setShowJobNotification(false);
  };

  // Removed old boxed user profile component
  const renderUserProfile = () => null;

  return (
    <div className="min-h-screen bg-white text-[#202124] relative overflow-hidden devanagari">
      {/* Light background with subtle gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)',
          }}
        />
        {/* Subtle blue accent */}
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background:
              'radial-gradient(1200px 600px at 50% 0%, rgba(59, 72, 131, 0.08), transparent 70%)',
          }}
        />
        {/* Decorative circles */}
        <div
          className="absolute top-20 right-10 w-[300px] h-[300px] rounded-full opacity-30"
          style={{
            background: '#E8DFD5',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-40 left-20 w-[200px] h-[200px] rounded-full opacity-40"
          style={{
            background: '#DBBBA7',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-[150px] h-[150px] rounded-full opacity-50"
          style={{
            background: '#DBBBA7',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Top-left Brand - Fixed Position */}
        <div className="fixed top-4 left-4 md:top-6 md:left-6 z-[100] cursor-pointer" onClick={() => window.location.reload()}>
          <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#3B4883] drop-shadow-sm hover:text-[#FF7124] transition-colors">
            SINDH
          </span>
        </div>

        {/* Top-right controls: language + menu (no navbar) - Fixed Position */}
        <div className="fixed top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-[100]">
          <div className="bg-white/90 rounded-full shadow-sm backdrop-blur-md">
            <NotificationBell />
          </div>
          <button onClick={toggleHomeLang} className="px-3 py-2 rounded-lg text-xs md:text-sm bg-white/90 border border-[#3B4883]/20 text-[#202124] hover:border-[#FF7124] hover:bg-[#FF7124]/10 transition-all shadow-sm font-medium backdrop-blur-md min-w-[44px] min-h-[44px] p-3.5" aria-label="Toggle language">
            {isHindi ? 'HI' : 'EN'}
          </button>
          <button ref={homeMenuTriggerRef} onClick={() => setShowHomeMenu(v => !v)} className={`rounded-full transition-all shadow-sm group backdrop-blur-md ${user ? 'p-0 border-2 border-[#FF7124]/20 hover:border-[#FF7124] hover:shadow-md' : 'p-2.5 md:p-3 bg-white/90 border border-[#3B4883]/20 hover:bg-[#FF7124]/10'}`} aria-label="Open menu" aria-expanded={showHomeMenu} aria-controls="home-menu">
            {user ? (
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-[#FF7124] to-[#e66420] text-white flex items-center justify-center font-bold text-lg">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            ) : (
              <>
                <span className="block w-4 md:w-5 h-0.5 bg-[#202124] group-hover:bg-[#FF7124] mb-1 transition-colors"></span>
                <span className="block w-3 md:w-4 h-0.5 bg-[#202124] group-hover:bg-[#FF7124] mb-1 transition-colors"></span>
                <span className="block w-5 md:w-6 h-0.5 bg-[#202124] group-hover:bg-[#FF7124] transition-colors"></span>
              </>
            )}
          </button>
        </div>
        <AnimatePresence>
          {showHomeMenu && (
            <motion.div ref={homeMenuRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-14 sm:top-16 right-4 md:right-6 w-56 bg-white border border-[#3B4883]/10 rounded-xl p-3 text-sm text-[#202124] z-[70] shadow-xl backdrop-blur-xl" id="home-menu">
              <button onClick={() => navigate(`/${user?.type || 'worker'}/profile`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FF7124]/10 hover:text-[#FF7124] transition-all">{t('menu.profile', { ns: 'home' })}</button>
              <button onClick={handleViewJobs} className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FF7124]/10 hover:text-[#FF7124] transition-all">{t('menu.jobs', { ns: 'home' })}</button>
              <button onClick={() => setShowLogoutConfirm(true)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FF7124]/10 hover:text-[#FF7124] transition-all">{t('menu.logout', { ns: 'home' })}</button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mobile-Optimized Job Notification */}
        <AnimatePresence>
          {showJobNotification && user?.type === 'worker' && jobCount > 0 && !jobCountLoading && !showHomeMenu && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed bottom-6 right-4 md:right-8 z-[50] max-w-xs md:max-w-sm touch-manipulation"
            >
              <div className="bg-white border-2 border-[#3B4883]/20 text-gray-900 p-4 md:p-6 relative mx-2 md:mx-0 rounded-2xl shadow-2xl">
                <button
                  onClick={handleCloseJobNotification}
                  className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 touch-manipulation"
                  aria-label="Close job notification"
                >
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="pr-8 md:pr-8">
                  <h4 className="font-semibold text-base md:text-lg mb-2 text-gray-900">New Jobs Available</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {jobCount} job{jobCount !== 1 ? 's' : ''} available
                    {user.location?.state && ` in ${user.location.state}`}
                  </p>

                  <div className="flex gap-2 md:gap-3">
                    <button
                      onClick={handleViewJobs}
                      className="flex-1 bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white px-3 py-3 md:px-4 md:py-2 text-sm font-semibold hover:from-[#e66420] hover:to-[#d55a1c] transition-all touch-manipulation rounded-lg shadow-md"
                    >
                      VIEW ALL
                    </button>
                    <button
                      onClick={handleCloseJobNotification}
                      className="px-3 py-3 md:px-4 md:py-2 border border-gray-300 text-gray-600 text-sm font-medium hover:border-[#FF7124] hover:bg-[#FF7124]/10 hover:text-[#FF7124] transition-all touch-manipulation rounded-lg"
                    >
                      LATER
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative" style={{ transform: `translateY(${pullY}px)`, transition: isRefreshing ? 'transform 0.2s ease-out' : 'none' }}>

          {/* Pull to Refresh Indicator */}
          <div
            className="absolute -top-12 left-0 right-0 z-0 flex justify-center pointer-events-none"
            style={{
              opacity: pullY > 10 ? (pullY / 80) : 0,
              transform: `scale(${Math.min(1, pullY / 80)})`
            }}
          >
            <div className="bg-white/90 backdrop-blur-md rounded-full p-2 shadow-lg border border-[#FF7124]/20 text-[#FF7124]">
              {isRefreshing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <RefreshCw className="w-6 h-6" style={{ transform: `rotate(${pullY * 3}deg)` }} />
              )}
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-40 md:py-56">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >

              {/* Hero Logo - Comment 3: Responsive sizing + Comment 7: Centralized asset */}
              <div className="relative inline-block">
                <div className="relative flex items-center justify-center">
                  <div className="relative" style={{ width: 'clamp(12rem, 30vw, 28rem)' }}>
                    <img
                      src={logoSrc}
                      alt="SINDH - सिंधु"
                      className="w-full h-auto drop-shadow-[0_4px_12px_rgba(59,72,131,0.15)]"
                      style={{ aspectRatio: '4/3' }}
                      decoding="async"
                      loading="eager"
                    />
                  </div>
                </div>
              </div>

              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="relative mt-6 flex flex-wrap items-center justify-center gap-4 text-[#202124]"
                >
                  <button
                    ref={userMenuTriggerRef}
                    onClick={() => setShowUserMenu(v => !v)}
                    className="relative inline-flex items-center gap-4 px-5 py-3 rounded-2xl bg-white border-2 border-[#3B4883]/20 hover:border-[#FF7124] hover:shadow-lg backdrop-blur-md transition-all shadow-md"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#FF7124] to-[#e66420] border border-[#FF7124]/30 flex items-center justify-center font-bold tracking-wide text-lg text-white shadow-sm">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-base sm:text-lg font-semibold leading-tight text-[#202124]">{user?.name}</div>
                      <div className="text-xs sm:text-sm uppercase tracking-widest text-[#202124]/60 font-medium">{user?.type}</div>
                    </div>
                    <svg className={`w-5 h-5 text-[#202124]/60 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        ref={userMenuRef}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="absolute top-full mt-4 w-[92vw] left-1/2 -translate-x-1/2"
                      >
                        <div className="relative px-4">
                          <div className="absolute inset-x-6 -top-2 h-8 bg-gradient-to-b from-[#FF7124]/10 to-transparent blur-2xl opacity-60 pointer-events-none" />
                        </div>
                        {/* Comment 8: Overflow handling */}
                        <div className="max-h-[60vh] overflow-auto overscroll-contain scroll-py-2">
                          <div className="mx-auto max-w-3xl grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            <button onClick={() => navigate(`/${user.type}/profile`)} className="group flex items-center justify-between p-4 sm:p-5 rounded-xl bg-white hover:bg-[#FF7124]/10 border border-[#3B4883]/10 hover:border-[#FF7124] transition-all shadow-md hover:shadow-lg backdrop-blur-md">
                              <span className="text-sm sm:text-base font-semibold tracking-wide text-[#202124] group-hover:text-[#FF7124]">Profile</span>
                              <span className="text-xs sm:text-sm text-[#202124]/60 group-hover:text-[#FF7124]">→</span>
                            </button>
                            <button onClick={() => setShowLogoutConfirm(true)} className="group flex items-center justify-between p-4 sm:p-5 rounded-xl bg-white hover:bg-[#FF7124]/10 border border-[#3B4883]/10 hover:border-[#FF7124] transition-all shadow-md hover:shadow-lg backdrop-blur-md">
                              <span className="text-sm sm:text-base font-semibold tracking-wide text-[#202124] group-hover:text-[#FF7124]">Logout</span>
                              <span className="text-xs sm:text-sm text-[#202124]/60 group-hover:text-[#FF7124]">↘</span>
                            </button>
                            {user?.type === 'worker' && (
                              <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#FF7124]/10 to-[#FF7124]/20 border border-[#FF7124]/30 shadow-md backdrop-blur-md">
                                <span className="text-sm sm:text-base font-semibold tracking-wide text-[#FF7124]">Wallet</span>
                                <span className="text-sm sm:text-base font-bold text-[#e66420]">₹{workerBalance.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
              <p className="mt-6 text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto">

              </p>
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={!user ? () => navigate('/login?type=worker') : (user?.type === 'employer' ? () => navigate('/employer/posted-jobs') : handleFindWork)}
                  className="px-10 py-4 rounded-xl bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white font-semibold inline-flex items-center justify-center hover:from-[#e66420] hover:to-[#d55a1c] hover:shadow-[0_6px_24px_rgba(255,113,36,0.3)] transition-all text-lg shadow-lg"
                >
                  {!user
                    ? t('home.ctaPrimary', { ns: 'home' })
                    : user?.type === 'employer'
                      ? t('home.ctaPrimaryEmployer', { ns: 'home' })
                      : t('home.ctaPrimaryWorker', { ns: 'home' })}
                  <ArrowRight className="w-6 h-6 ml-3" />
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={!user ? () => navigate('/login?type=employer') : (user?.type === 'employer' ? handlePostJob : handleMyJobs)}
                  className="px-10 py-4 rounded-xl bg-[#3B4883] text-white border-2 border-[#3B4883] hover:border-[#272D4E] hover:bg-[#272D4E] font-semibold text-lg shadow-[0_6px_24px_rgba(59,72,131,0.25)] hover:shadow-[0_8px_32px_rgba(59,72,131,0.35)] transition-all backdrop-blur-md"
                >
                  {!user
                    ? t('home.ctaSecondary', { ns: 'home' })
                    : user?.type === 'employer'
                      ? t('home.ctaSecondaryEmployer', { ns: 'home' })
                      : 'My Jobs'}
                </motion.button>
              </div>
            </motion.div>

            {/* Adaptive layout for worker/employer */}
            {user?.type === 'employer' ? (
              <div className="mt-14 max-w-2xl mx-auto">
                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-xl bg-white border border-[#3B4883]/10 p-4 shadow-md hover:shadow-lg transition-all backdrop-blur-md">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#3B4883] mb-1 font-medium">Posted Jobs</div>
                    <div className="text-2xl md:text-3xl font-bold text-[#272D4E]">
                      {workerProfile?.postedJobsCount ?? (Array.isArray(workerProfile?.postedJobs) ? workerProfile.postedJobs.length : (workerProfile?.postedJobs || 0))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-[#3B4883]/10 p-4 shadow-md hover:shadow-lg transition-all backdrop-blur-md">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#3B4883] mb-1 font-medium">Active Jobs</div>
                    <div className="text-2xl md:text-3xl font-bold text-[#272D4E]">
                      {workerProfile?.activeJobsCount ?? (Array.isArray(workerProfile?.activeHires) ? workerProfile.activeHires.length : (workerProfile?.activeHires || 0))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-[#3B4883]/10 p-4 shadow-md hover:shadow-lg transition-all backdrop-blur-md">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#3B4883] mb-1 font-medium">Completed</div>
                    <div className="text-2xl md:text-3xl font-bold text-[#272D4E]">
                      {workerProfile?.completedJobsCount ?? (Array.isArray(workerProfile?.completedHires) ? workerProfile.completedHires.length : (workerProfile?.completedHires || 0))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-[#FF7124]/10 to-[#FF7124]/20 border border-[#FF7124]/30 p-4 shadow-md hover:shadow-lg transition-all backdrop-blur-md">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#FF7124] mb-1 font-medium">Budget</div>
                    <div className="text-2xl md:text-3xl font-bold text-[#e66420]">₹{(workerProfile?.budget ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-stretch">
                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-xl bg-white border border-[#3B4883]/10 p-4 shadow-md hover:shadow-lg transition-all backdrop-blur-md">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#3B4883] mb-1 font-medium">Active Jobs</div>
                    <div className="text-2xl md:text-3xl font-bold text-[#272D4E]">{jobCountLoading ? '…' : jobCount}</div>
                    {user?.location?.state && (<div className="text-[10px] md:text-xs text-[#202124]/40 mt-1">in {user.location.state}</div>)}
                  </div>
                  <div className="rounded-xl bg-white border border-[#3B4883]/10 p-4 shadow-md hover:shadow-lg transition-all backdrop-blur-md">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#3B4883] mb-1 font-medium">Completed</div>
                    <div className="text-2xl md:text-3xl font-bold text-[#272D4E]">
                      {workerProfile?.completedJobsCount ?? (Array.isArray(workerProfile?.completedJobs) ? workerProfile.completedJobs.length : (workerProfile?.completedJobs || 0))}
                    </div>
                    <div className="text-[10px] md:text-xs text-[#202124]/40 mt-1">All time</div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-[#FF7124]/10 to-[#FF7124]/20 border border-[#FF7124]/30 p-4 shadow-md hover:shadow-lg transition-all backdrop-blur-md">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#FF7124] mb-1 font-medium">Wallet</div>
                    <div className="text-2xl md:text-3xl font-bold text-[#e66420]">₹{workerBalance.toLocaleString()}</div>
                    <div className="text-[10px] md:text-xs text-[#FF7124]/70 mt-1">Available</div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-[#E8DFD5] to-[#DBBBA7] border-2 border-[#FF7124]/30 p-4 shadow-md hover:shadow-lg transition-all">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#FF7124] mb-1 font-medium">Trust</div>
                    <div className="text-2xl md:text-3xl font-bold text-[#e66420]">
                      {workerProfile?.shaktiScore || shaktiScore || (workerProfile?.rating?.average ? (workerProfile.rating.average * 20).toFixed(0) : '35')}
                    </div>
                    <div className="text-[10px] md:text-xs text-[#FF7124] mt-1">Score</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Removed old boxed user profile */}

        {/* Work Reminders Section */}
        <AnimatePresence>
          {showWorkReminders && workReminders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-4 md:py-6"
            >
              <div className="max-w-4xl mx-auto px-4 md:px-6">
                <div className="bg-white border-2 border-[#3B4883]/10 rounded-xl p-4 md:p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#FF7124] rounded-full flex items-center justify-center mr-3">
                        <Briefcase className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-[#202124]">
                          {user?.type === 'employer' ? 'Active Work Assignments' : 'Work Reminders'}
                        </h3>
                        <p className="text-sm text-[#202124]/60">
                          {user?.type === 'employer'
                            ? 'Workers currently working on your jobs'
                            : 'Your active work assignments'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWorkReminders(false)}
                      className="p-2 hover:bg-[#3B4883]/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-[#202124]/50" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {workReminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#E8DFD5]/50 rounded-lg p-4 border border-[#3B4883]/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-2 h-2 bg-[#FF7124] rounded-full mr-2 animate-pulse"></div>
                              <h4 className="font-medium text-[#202124]">
                                {reminder.jobTitle}
                              </h4>
                            </div>
                            <div className="text-sm text-[#202124]/70 space-y-1">
                              {user?.type === 'employer' ? (
                                <>
                                  <p>Worker: <span className="font-medium text-[#202124]">{reminder.workerName}</span></p>
                                  <p>Phone: <span className="font-medium text-[#202124]">{reminder.workerPhone}</span></p>
                                </>
                              ) : (
                                <p>{reminder.message}</p>
                              )}
                              <p>Started: <span className="font-medium text-[#202124]">
                                {new Date(reminder.startedAt).toLocaleDateString()} at {new Date(reminder.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span></p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {user?.type === 'employer' && reminder.workerPhone && (
                              <button
                                onClick={() => window.open(`tel:${reminder.workerPhone}`)}
                                className="p-2 bg-[#FF7124]/20 text-[#FF7124] rounded-lg hover:bg-[#FF7124]/30 transition-colors"
                                title="Call Worker"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => dismissWorkReminder(reminder.id)}
                              className="p-2 bg-[#3B4883]/10 text-[#202124]/60 rounded-lg hover:bg-[#3B4883]/20 transition-colors"
                              title="Dismiss Reminder"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">
                        {workReminders.length} active reminder{workReminders.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => {
                          if (user?.type === 'employer') {
                            navigate('/employer/posted-jobs');
                          } else {
                            navigate('/worker/my-applications');
                          }
                        }}
                        className="text-orange-400 hover:text-orange-300 font-medium flex items-center"
                      >
                        View All
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal - Comment 2 */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-modal-title"
              >
                <h2 id="logout-modal-title" className="text-xl font-semibold text-[#202124] mb-2">
                  Confirm Logout
                </h2>
                <p className="text-[#202124]/70 mb-6">
                  Are you sure you want to logout?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-[#ff6b35] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#ff6b35]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/50"
                    autoFocus
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 bg-gray-100 text-[#202124] px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Add global styles for animations */}
      <style>{`
        /* Devanagari font stack for Hindi */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap');
        .devanagari {
          font-family: 'Noto Sans Devanagari', 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
        }

        @keyframes blob {
          0% { 
            transform: translate(0px, 0px) scale(1) rotate(0deg); 
            opacity: 0.4;
          }
          25% { 
            transform: translate(30px, -40px) scale(1.1) rotate(90deg); 
            opacity: 0.6;
          }
          50% { 
            transform: translate(-20px, 30px) scale(0.9) rotate(180deg); 
            opacity: 0.3;
          }
          75% { 
            transform: translate(40px, 15px) scale(1.05) rotate(270deg); 
            opacity: 0.5;
          }
          100% { 
            transform: translate(0px, 0px) scale(1) rotate(360deg); 
            opacity: 0.4;
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(3deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-12px) rotate(2deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.2;
            filter: blur(0.8rem);
          }
          50% { 
            opacity: 0.4;
            filter: blur(1.2rem);
          }
        }
        
        @keyframes drift {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(3vmax, -2vmax, 0) rotate(15deg); }
        }
        
        .animate-blob {
          animation: blob 10s infinite ease-in-out;
        }
        
        .animate-float {
          animation: float 8s infinite ease-in-out;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 6s infinite ease-in-out;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Orange Aurora effect for modern theme */
        .orange-aurora-blob {
          position: absolute;
          width: 50vmax;
          height: 50vmax;
          filter: blur(40px);
          opacity: 0.06;
        }
        .orange-aurora-a { 
          background: radial-gradient(circle at 30% 30%, rgba(251,146,60,0.3), transparent 60%); 
          left: -15vmax; 
          top: -8vmax; 
          animation: drift 20s ease-in-out infinite; 
        }
        .orange-aurora-b { 
          background: radial-gradient(circle at 70% 40%, rgba(249,115,22,0.25), transparent 60%); 
          right: -20vmax; 
          top: -5vmax; 
          animation: drift 25s ease-in-out infinite reverse; 
        }
        .orange-aurora-c { 
          background: radial-gradient(circle at 40% 70%, rgba(251,146,60,0.28), transparent 60%); 
          left: 8vmax; 
          bottom: -15vmax; 
          animation: drift 30s ease-in-out infinite; 
        }
        
        /* Enhanced blur effects */
        .blur-3xl {
          filter: blur(3rem);
        }
        
        .blur-2xl {
          filter: blur(2rem);
        }
        
        /* Glass morphism effect for modern theme */
        .glass-effect {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        /* Enhanced card shadows for portfolio style */
        .card-shadow {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .card-shadow-hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        /* Modern gradient backgrounds */
        .gradient-orange {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        }
        
        .gradient-orange-light {
          background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
        }
      `}</style>
    </div>
  );
}

export default Homepage;