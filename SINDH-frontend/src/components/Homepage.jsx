import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { getCurrentUser, logout } from '../utils/authUtils';
import { Briefcase, Wallet, ArrowRight, LogOut, X, Phone, MapPin, ClipboardList } from 'lucide-react';
import { buildApiUrl, getApiUrl } from '../utils/apiUtils';
import axios from 'axios';
import LogoSVG from '../assets/logo.svg';



function Homepage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [shaktiScore, setShaktiScore] = useState(null);

  // Job notification states
  const [jobCount, setJobCount] = useState(0);
  const [jobCountLoading, setJobCountLoading] = useState(false);
  const [showJobNotification, setShowJobNotification] = useState(false);
  const [showInProgressNotification, setShowInProgressNotification] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);
  const [workerProfile, setWorkerProfile] = useState(null);
  const profileRefreshInterval = useRef(null);

  // Worker financial states
  const [workerBalance, setWorkerBalance] = useState(0);
  const [recentEarnings, setRecentEarnings] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHomeMenu, setShowHomeMenu] = useState(false);
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
            backgroundColor: '#111',
            color: '#fff',
            fontWeight: 600
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

  // Continuously update worker profile
  useEffect(() => {
    const updateWorkerProfile = async () => {
      if (!user?.id || user?.type !== 'worker') return;
      
      try {
        console.log('Updating worker profile data...');
        const response = await axios.get(buildApiUrl(`/workers/${user.id}`), {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data) {
          console.log('Updated worker profile:', response.data);
          setWorkerProfile(response.data);
          
          // Location is part of worker profile; no homepage stats update needed
        }
      } catch (error) {
        console.error('Error updating worker profile:', error);
      }
    };

    // Initial fetch
    updateWorkerProfile();
    
    // Set up interval for continuous updates (every 30 seconds)
    profileRefreshInterval.current = setInterval(updateWorkerProfile, 30000);
    
    // Clean up interval on unmount
    return () => {
      if (profileRefreshInterval.current) {
        clearInterval(profileRefreshInterval.current);
      }
    };
  }, [user?.id, user?.type]);

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
    });
    
    // Navigate to homepage and refresh
    navigate('/', { replace: true });
    window.location.reload();
  };

  // Fetch job count for notifications - wrapped in useCallback
  const fetchJobCount = useCallback(async () => {
    setJobCountLoading(true);
    try {
      console.log('Fetching job count for user:', user);
      
      const queryParams = new URLSearchParams();
      
      // Add user-specific parameter for application status (same as AvailableJobs)
      if (user?.id && user?.type === 'worker') {
        queryParams.append('workerId', user.id);
      }
      
      // Use dual status system - only count jobs where both worker and employer status are 'active'
      // This ensures we only show truly available jobs
      
      // Add location filter if user has location
      if (user?.location?.state) {
        queryParams.append('location', user.location.state);
        console.log('Adding location filter:', user.location.state);
      }

      // Use the new dual-status endpoint for accurate job counting
      const url = buildApiUrl(`/jobs/dual-status?${queryParams.toString()}`);
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dual status response:', data);
        
        // Filter jobs where both worker and employer status are 'active'
        const activeJobs = data.jobs?.filter(job => 
          job.workerStatus === 'active' && job.employerStatus === 'active'
        ) || [];
        
        const count = activeJobs.length;
        console.log('🎯 Setting active job count to:', count, '(filtered from', data.jobs?.length || 0, 'total jobs)');
        setJobCount(count);
        
        // If no active jobs, check for in-progress jobs
        if (count === 0 && user?.type === 'worker') {
          try {
            const inProgressResponse = await fetch(buildApiUrl(`/jobs/count?status=in-progress${user?.id ? `&workerId=${user.id}` : ''}`));
            if (inProgressResponse.ok) {
              const inProgressData = await inProgressResponse.json();
              const inProgressCount = inProgressData.count || 0;
              
              if (inProgressCount > 0 && !hasShownNotification) {
                console.log(`Found ${inProgressCount} in-progress jobs`);
                setTimeout(() => {
                  setShowInProgressNotification(true);
                  setHasShownNotification(true);
                }, 1500);
              }
            }
          } catch (err) {
            console.error('Error checking in-progress jobs:', err);
          }
        }
        // Show active jobs notification if available
        else if (user?.type === 'worker' && count > 0 && !hasShownNotification) {
          console.log('Showing active jobs notification popup for worker with', count, 'jobs');
          
          // Show the job notification popup directly without duplicate toast
          setTimeout(() => {
            setShowJobNotification(true);
            setHasShownNotification(true);
          }, 1500); // Reduced delay for better UX
        }
        
        return count;
      }
    } catch (error) {
      console.error('Error fetching job count:', error);
      console.log('⚠️ Setting job count to 0 due to error');
      setJobCount(0);
      return 0;
    } finally {
      setJobCountLoading(false);
    }
  }, [user, hasShownNotification]);

  // Fetch worker balance and earnings - wrapped in useCallback
  const fetchWorkerFinancials = useCallback(async () => {
    if (user?.type === 'worker' && user?.id) {
      try {
        const response = await fetch(buildApiUrl(`/workers/${user.id}/balance`));
        if (response.ok) {
          const data = await response.json();
          setWorkerBalance(data.balance || 0);
          setRecentEarnings(data.earnings?.slice(-5) || []);
        }
      } catch (error) {
        console.error('Error fetching worker financials:', error);
      }
    }
  }, [user]);

  // Removed stats/category/latest jobs fetching for simplified homepage

  useEffect(() => {
    console.log('Homepage useEffect - user changed:', user);
    
    if (location.state?.showWelcome && user) {
      toast.success(`${t('home.welcomeBack')}, ${user.name}!`);
      navigate('/', { replace: true, state: {} });
    }
  }, [location, user, navigate, t]);

  useEffect(() => {
    console.log('Homepage useEffect - fetching data');
    
    if (user?.type === 'worker') {
      console.log('User is worker, fetching worker-specific data');
      fetchJobCount();
      fetchWorkerFinancials();
    }
  }, [user, fetchJobCount, fetchWorkerFinancials]);

  const fetchShaktiScore = async (workerId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/workers/${workerId}/shakti-score`));
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
    if (!isLoadingUser && user && user.type === 'worker') {
      fetchShaktiScore(user.id);
    } else if (!isLoadingUser && (!user || user.type !== 'worker')) {
      setShaktiScore(null);
    }
  }, [user, isLoadingUser]);

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

  const handleContactSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name');
    toast.success(`Thanks${name ? `, ${name}` : ''}! We'll get back to you shortly.`);
    event.currentTarget.reset();
  };

  // Removed old boxed user profile component
  const renderUserProfile = () => null;

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden devanagari">
      {/* Dark patterns and subtle motion */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)',
          }}
        />
        {/* Star trails effect */}
        <div className="startrails absolute inset-0"></div>
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Grain */}
        <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
        {/* Aurora animated background */}
        <div className="aurora absolute inset-0">
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
      </div>

      <div className="relative z-10">
        {/* Top-right controls: language + menu (no navbar) */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-30">
          <button onClick={toggleHomeLang} className="px-2.5 py-1 rounded-full text-xs md:text-sm bg-white/10 border border-white/15 text-white/90 hover:bg-white/15">
            {isHindi ? 'HI' : 'EN'}
          </button>
          <button onClick={() => setShowHomeMenu(v=>!v)} className="p-2 md:p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors">
            <span className="block w-5 md:w-6 h-0.5 bg-white mb-1"></span>
            <span className="block w-4 md:w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-6 md:w-7 h-0.5 bg-white"></span>
          </button>
        </div>
        <AnimatePresence>
          {showHomeMenu && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-16 right-4 md:right-6 w-56 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-sm text-white z-40">
              <button onClick={() => navigate(`/${user?.type || 'worker'}/profile`)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">{t('menu.profile', { ns: 'home' })}</button>
              <button onClick={handleViewJobs} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">{t('menu.jobs', { ns: 'home' })}</button>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">{t('menu.logout', { ns: 'home' })}</button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mobile-Optimized Job Notification */}
      <AnimatePresence>
          {showJobNotification && user?.type === 'worker' && jobCount > 0 && !jobCountLoading && (
          <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-20 right-2 md:right-6 z-50 max-w-xs md:max-w-sm touch-manipulation"
            >
              <div className="bg-black/95 backdrop-blur-md text-white p-4 md:p-6 shadow-2xl relative mx-2 md:mx-0 rounded-2xl border border-white/10">
                  <button
                    onClick={handleCloseJobNotification}
                  className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-400 hover:text-white transition-colors p-2 touch-manipulation"
                  >
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
              
                <div className="pr-8 md:pr-8">
                  <h4 className="font-medium text-base md:text-lg mb-2">New Jobs</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    {jobCount} available
                    {user.location?.state && ` in ${user.location.state}`}
                  </p>
                  
                  <div className="flex gap-2 md:gap-3">
                  <button
                    onClick={handleViewJobs}
                      className="flex-1 bg-white text-black px-3 py-3 md:px-4 md:py-2 text-sm font-medium hover:bg-gray-100 transition-colors touch-manipulation rounded-xl"
                  >
                      VIEW ALL
                  </button>
                  <button
                    onClick={handleCloseJobNotification}
                      className="px-3 py-3 md:px-4 md:py-2 border border-gray-600 text-gray-300 text-sm font-medium hover:border-gray-400 transition-colors touch-manipulation rounded-xl"
                  >
                      LATER
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

          <div className="relative">
            <div className="relative max-w-7xl mx-auto px-6 md:px-8 py-32 md:py-48">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
               
                <div className="relative inline-block">
            <div
              className="absolute -inset-12 rounded-full blur-3xl opacity-30"
              style={{
                background:
                  'radial-gradient(400px 160px at 50% 50%, rgba(120,120,255,0.2), transparent 70%)',
              }}
            />
            <div className="relative flex items-center justify-center gap-4 md:gap-6">
             
              {isHindi ? (
                <img 
                  src="/sindh.svg" 
                  alt="सिंधु" 
                  className="relative w-40 h-30 sm:w-48 sm:h-36 md:w-56 md:h-42 filter invert brightness-0 drop-shadow-lg" 
                />
              ) : (
                <img 
                  src="/sindh.svg" 
                  alt="सिंधु" 
                  className="relative w-40 h-30 sm:w-48 sm:h-36 md:w-56 md:h-42 filter invert brightness-0 drop-shadow-lg" 
                />
              )}
            </div>
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative mt-6 flex flex-wrap items-center justify-center gap-4 text-white/90"
              >
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  className="relative inline-flex items-center gap-4 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm transition-colors"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold tracking-wide text-lg">
              {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                  <div className="text-left">
              <div className="text-base sm:text-lg font-semibold leading-tight">{user?.name}</div>
              <div className="text-xs sm:text-sm uppercase tracking-widest text-white/70">{user?.type}</div>
              </div>
                  <svg className={`w-5 h-5 text-white/70 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="absolute top-full mt-4 w-[min(92vw,580px)] left-1/2 -translate-x-1/2"
              >
                <div className="relative px-4">
                  <div className="absolute inset-x-6 -top-2 h-8 bg-gradient-to-b from-white/10 to-transparent blur-2xl opacity-60 pointer-events-none" />
                    </div>
                <div className="mx-auto max-w-3xl grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <button onClick={() => navigate(`/${user.type}/profile`)} className="group flex items-center justify-between p-4 sm:p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <span className="text-sm sm:text-base font-semibold tracking-wide">Profile</span>
                    <span className="text-xs sm:text-sm text-white/60 group-hover:text-white/80">→</span>
                  </button>
                  <button onClick={handleLogout} className="group flex items-center justify-between p-4 sm:p-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <span className="text-sm sm:text-base font-semibold tracking-wide">Logout</span>
                    <span className="text-xs sm:text-sm text-white/60 group-hover:text-white/80">↘</span>
                  </button>
                  {user?.type === 'worker' && (
                    <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-sm sm:text-base font-semibold tracking-wide">Wallet</span>
                <span className="text-sm sm:text-base">₹{workerBalance.toLocaleString()}</span>
                  </div>
                  )}
                </div>
                </motion.div>
              )}
                </AnimatePresence>
              </motion.div>
            )}
                </div>
                <p className="mt-6 text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
           
                </p>
                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              onClick={!user ? () => navigate('/login?type=worker') : (user?.type === 'employer' ? () => navigate('/employer/posted-jobs') : handleFindWork)}
              className="px-10 py-4 rounded-xl bg-white text-black font-medium inline-flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] text-lg"
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
              className="px-10 py-4 rounded-xl bg-neutral-900 text-white border border-white/10 hover:border-white/20 font-medium text-lg"
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
              <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
                {/* Big CTA card */}
                <motion.div whileHover={{ y: -2 }} className="md:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 md:p-10 flex flex-col justify-between">
                  <div>
                   
                    <h3 className="mt-2 text-2xl md:text-4xl font-extrabold text-white">{t('home.employer.hero.title', { ns: 'home' })}</h3>
                    <p className="mt-2 text-sm md:text-base text-white/70">{t('home.employer.hero.body', { ns: 'home' })}</p>
                    </div>
                  <div className="mt-6">
                    <button onClick={handlePostJob} className="px-6 md:px-8 py-3 md:py-4 rounded-xl bg-white text-black font-semibold hover:opacity-95">{t('home.employer.hero.button', { ns: 'home' })}</button>
                  </div>
                </motion.div>
                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mb-1">Posted Jobs</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{workerProfile?.postedJobs ?? 0}</div>
                </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mb-1">Active Hires</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{workerProfile?.activeHires ?? 0}</div>
              </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mb-1">Completed</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{workerProfile?.completedHires ?? 0}</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mb-1">Budget</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">₹{(workerProfile?.budget ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
                {/* Big CTA card */}
                <motion.div whileHover={{ y: -2 }} className="md:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 md:p-10 flex flex-col justify-between">
                  <div>
                    
                    <h3 className="mt-2 text-2xl md:text-4xl font-extrabold text-white">{t('home.worker.hero.title', { ns: 'home' })}</h3>
                    <p className="mt-2 text-sm md:text-base text-white/70">{t('home.worker.hero.body', { ns: 'home' })}</p>
                        </div>
                  <div className="mt-6">
                    <button onClick={handleViewJobs} className="px-6 md:px-8 py-3 md:py-4 rounded-xl bg-white text-black font-semibold hover:opacity-95">{t('home.worker.hero.button', { ns: 'home' })}</button>
                        </div>
                </motion.div>
                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mb-1">Active Jobs</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{jobCountLoading ? '…' : jobCount}</div>
                    {user?.location?.state && (<div className="text-[10px] md:text-xs text-white/50 mt-1">in {user.location.state}</div>)}
                      </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mb-1">Completed</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{workerProfile?.completedJobs ?? 0}</div>
                    <div className="text-[10px] md:text-xs text-white/50 mt-1">All time</div>
                    </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mb-1">Wallet</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">₹{workerBalance.toLocaleString()}</div>
                    <div className="text-[10px] md:text-xs text-white/50 mt-1">Available</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 mb-1">Trust</div>
                    <div className="text-2xl md:text-3xl font-bold text-white">{(user?.type === 'worker' && shaktiScore !== null) ? shaktiScore : (workerProfile?.rating?.average ?? '—')}</div>
                    <div className="text-[10px] md:text-xs text-white/50 mt-1">Score</div>
                </div>
              </div>
              </div>
          )}
                      </div>
                    </div>

        {/* Contact + Contact Form (Hindi) */}
        <section className="relative max-w-7xl mx-auto px-6 md:px-8 pb-24">
          <div className="grid md:grid-cols-2 gap-8">
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-neutral-900/60 border border-white/10 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <h4 className="text-white text-2xl font-semibold tracking-wide mb-4">संपर्क</h4>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">Have a question or want to work with us? Send a message and we’ll reply within 1–2 business days.</p>
              <div className="space-y-2 text-sm">
                <div className="text-gray-400">Address</div>
                <div className="text-white/90">SINDH Platform, India</div>
                <div className="text-gray-400 mt-4">Phone</div>
                <div className="text-white/90">+91-00000-00000</div>
                <div className="text-gray-400 mt-4">Email</div>
                <div className="text-white/90">hello@SINDH.app</div>
                </div>
              </motion.div>

            <motion.form
              onSubmit={handleContactSubmit}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-neutral-900/60 border border-white/10 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <h4 className="text-white text-2xl font-semibold tracking-wide mb-4">Contact Form</h4>
              <div className="grid grid-cols-1 gap-4">
                <input name="name" placeholder="Name" className="bg-neutral-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20" />
                <input name="email" type="email" placeholder="Email" className="bg-neutral-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20" />
                <textarea name="message" placeholder="Message" rows={5} className="bg-neutral-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20" />
                <button type="submit" className="mt-2 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-black font-medium hover:opacity-95">Send Message</button>
            </div>
            </motion.form>
          </div>
        </section>

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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3">
                        <Briefcase className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user?.type === 'employer' ? 'Active Work Assignments' : 'Work Reminders'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {user?.type === 'employer' 
                            ? 'Workers currently working on your jobs' 
                            : 'Your active work assignments'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowWorkReminders(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {workReminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                              <h4 className="font-medium text-gray-900">
                                {reminder.jobTitle}
                              </h4>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {user?.type === 'employer' ? (
                                <>
                                  <p>Worker: <span className="font-medium">{reminder.workerName}</span></p>
                                  <p>Phone: <span className="font-medium">{reminder.workerPhone}</span></p>
                                </>
                              ) : (
                                <p>{reminder.message}</p>
                              )}
                              <p>Started: <span className="font-medium">
                                {new Date(reminder.startedAt).toLocaleDateString()} at {new Date(reminder.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span></p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {user?.type === 'employer' && reminder.workerPhone && (
                              <button
                                onClick={() => window.open(`tel:${reminder.workerPhone}`)}
                                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Call Worker"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => dismissWorkReminder(reminder.id)}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Dismiss Reminder"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
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
                        className="text-gray-900 hover:text-black font-medium flex items-center"
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


        {/* Motivational Quote Section */}
        <div className="py-8 md:py-12 bg-gradient-to-br from-indigo-50/20 via-blue-50/20 to-purple-50/20 backdrop-blur-sm relative overflow-hidden">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
            className="max-w-2xl md:max-w-4xl mx-auto text-center px-4 md:px-0 relative z-10"
          >
            <div className="p-6 md:p-8 border border-gray-200/30 bg-white/40 backdrop-blur-md relative overflow-hidden rounded-2xl shadow-lg">
              {/* Inner pattern overlay */}
              <div className="absolute inset-0 opacity-5">
                <motion.div
                  className="absolute top-2 right-2 w-8 h-8"
                  animate={{
                    rotate: [0, 180, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <polygon points="50,10 90,50 50,90 10,50" fill="black" />
                  </svg>
                </motion.div>
                  </div>

              
          </div>
          </motion.div>
      </div>

      </div>

      {/* Add global styles for animations */}
      <style jsx global>{`
        /* Devanagari font stack for Hindi */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
        .devanagari {
          font-family: 'Noto Sans Devanagari', 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
        }

        /* Subtle film grain */
        .noise-bg {
          background-image: url('data:image/svg+xml;utf8,\
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
              <filter id="noise">\
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>\
                <feColorMatrix type="saturate" values="0"/>\
                <feComponentTransfer>\
                  <feFuncA type="table" tableValues="0 0.2"/>\
                </feComponentTransfer>\
              </filter>\
              <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/>\
            </svg>');
        }
        /* Subtle film grain */
        .noise-bg {
          background-image: url('data:image/svg+xml;utf8,\
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
              <filter id="noise">\
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>\
                <feColorMatrix type="saturate" values="0"/>\
                <feComponentTransfer>\
                  <feFuncA type="table" tableValues="0 0.2"/>\
                </feComponentTransfer>\
              </filter>\
              <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/>\
            </svg>');
        }

        @keyframes blob {
          0% { 
            transform: translate(0px, 0px) scale(1) rotate(0deg); 
            opacity: 0.6;
          }
          25% { 
            transform: translate(40px, -60px) scale(1.2) rotate(90deg); 
            opacity: 0.8;
          }
          50% { 
            transform: translate(-30px, 40px) scale(0.8) rotate(180deg); 
            opacity: 0.4;
          }
          75% { 
            transform: translate(60px, 20px) scale(1.1) rotate(270deg); 
            opacity: 0.7;
          }
          100% { 
            transform: translate(0px, 0px) scale(1) rotate(360deg); 
            opacity: 0.6;
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(-5deg); }
          75% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.3;
            filter: blur(1rem);
          }
          50% { 
            opacity: 0.6;
            filter: blur(1.5rem);
          }
        }
        
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        
        .animate-float {
          animation: float 6s infinite ease-in-out;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 4s infinite ease-in-out;
        }
        
        .animate-grid {
          animation: grid-move 20s infinite linear;
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
        
        .bg-radial-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
        }
        
        /* Enhanced blur effects */
        .blur-3xl {
          filter: blur(3rem);
        }
        
        .blur-2xl {
          filter: blur(2rem);
        }
        
        /* Glass morphism effect */
        .glass-effect {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Aurora effect */
        .aurora-blob {
          position: absolute;
          width: 60vmax;
          height: 60vmax;
          filter: blur(60px);
          opacity: 0.2;
        }
        .aurora-a { background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%); left: -20vmax; top: -10vmax; animation: drift 18s ease-in-out infinite; }
        .aurora-b { background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%); right: -25vmax; top: -5vmax; animation: drift 22s ease-in-out infinite reverse; }
        .aurora-c { background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%); left: 10vmax; bottom: -20vmax; animation: drift 26s ease-in-out infinite; }
        @keyframes drift {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(5vmax, -3vmax, 0) rotate(20deg); }
        }

        /* Star trails background - radial streaks rotating subtly */
        .startrails { position:absolute; inset:0; background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%); overflow:hidden; }
        .startrails::before, .startrails::after { content:""; position:absolute; inset:-20%; background-repeat:repeat; background-size: 300px 300px; mix-blend-mode: screen; opacity:.25; border-radius:50%; filter: blur(0.2px); }
        /* Layer 1 - long streaks */
        .startrails::before { background-image:
            radial-gradient(2px 120px at 50% 0%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1.5px 100px at 80% 10%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1.2px 90px at 20% 30%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1.8px 110px at 70% 60%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 60%);
          animation: trails-rotate 140s linear infinite; }
        /* Layer 2 - shorter streaks */
        .startrails::after { background-image:
            radial-gradient(1px 60px at 30% 10%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1px 70px at 60% 40%, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1px 50px at 10% 80%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1px 65px at 90% 50%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%);
          animation: trails-rotate-rev 200s linear infinite; opacity:.18; }
        @keyframes trails-rotate { from{ transform: rotate(0deg); } to{ transform: rotate(360deg);} }
        @keyframes trails-rotate-rev { from{ transform: rotate(360deg);} to{ transform: rotate(0deg);} }
      `}</style>
    </div>
  );
}

export default Homepage;