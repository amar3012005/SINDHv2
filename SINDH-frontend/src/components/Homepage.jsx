import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { getCurrentUser, logout } from '../utils/authUtils';
import { Star, Users, Briefcase, TrendingUp, Wallet, MessageCircle, ArrowRight, MapPin, LogOut } from 'lucide-react';
import { buildApiUrl } from '../utils/apiUtils';
import axios from 'axios';



function Homepage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shaktiScore, setShaktiScore] = useState(null);
  const [stats, setStats] = useState({
    totalJobs: 1250,
    activeWorkers: 3400,
    successfulMatches: 890,
    averageRating: 4.6
  });

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

  // Get user from context and fallback to localStorage if needed
  const { user: contextUser, isLoadingUser, logoutUser, fetchUserProfile } = useUser();
  const user = contextUser || getCurrentUser();

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
          
          // Update location stats if available
          if (response.data.location) {
            setStats(prev => ({
              ...prev,
              location: response.data.location.state || 'Unknown',
              city: response.data.location.city || ''
            }));
          }
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
      
      // Show only active jobs (not in-progress) for the count
      queryParams.append('status', 'active');
      
      // Add location filter if user has location
      if (user?.location?.state) {
        queryParams.append('location', user.location.state);
        console.log('Adding location filter:', user.location.state);
      }

              const url = buildApiUrl(`/jobs/count?${queryParams.toString()}`);
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
        console.log('Job count response:', data);
        
        const count = data.count || 0;
        console.log('🎯 Setting active job count to:', count);
        setJobCount(count);
        setStats(prev => ({ ...prev, totalJobs: count }));
        
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

  // Fetch job statistics with same filtering as AvailableJobs
  const fetchJobStats = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const queryParams = new URLSearchParams();
      
      // Add user-specific parameter for application status (same as AvailableJobs)
      if (user.id && user.type === 'worker') {
        queryParams.append('workerId', user.id);
      }
      
      // Use the same filtering logic as AvailableJobs - only active and in-progress jobs
      queryParams.append('status', 'active');
      
      console.log('Fetching job count with params:', queryParams.toString());
      
              const response = await fetch(buildApiUrl(`/jobs/count?${queryParams.toString()}`));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Job count response:', data);
        console.log('📊 Setting stats totalJobs to:', data.count || 0);
        setStats(prev => ({
          ...prev,
          totalJobs: data.count || 0
        }));
      } else {
        console.warn('Failed to fetch job count:', response.status);
      }
    } catch (error) {
      console.error('Error fetching job stats:', error);
    }
  }, []);

  // Fetch category-wise job counts (excluding completed jobs for workers)
  const fetchCategoryStats = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const categories = ['Construction', 'Agriculture', 'Household', 'Transportation', 'Manufacturing'];
      const categoryPromises = categories.map(async (category) => {
        const queryParams = new URLSearchParams();
        queryParams.append('category', category);
        queryParams.append('status', 'active'); // Same filtering as AvailableJobs
        
        // Add worker-specific filtering
        if (user.id && user.type === 'worker') {
          queryParams.append('workerId', user.id);
        }
        
        const response = await fetch(buildApiUrl(`/jobs/count?${queryParams.toString()}`));
        if (response.ok) {
          const data = await response.json();
          return { category, count: data.count || 0 };
        }
        return { category, count: 0 };
      });
      
      const categoryResults = await Promise.all(categoryPromises);
      const categoryData = {};
      categoryResults.forEach(({ category, count }) => {
        categoryData[category] = count;
      });
      
      setStats(prev => ({
        ...prev,
        categories: categoryData
      }));
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  }, []);

  // Fetch latest jobs with same filtering as AvailableJobs
  const fetchLatestJobs = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const queryParams = new URLSearchParams();
      
      // Add user-specific parameter (same as AvailableJobs)
      if (user.id && user.type === 'worker') {
        queryParams.append('workerId', user.id);
      }
      
      // Only show active and in-progress jobs (same as AvailableJobs)
      queryParams.append('status', 'active,in-progres');
      
      const response = await fetch(buildApiUrl(`/api/jobs?${queryParams.toString()}`));
      
      if (response.ok) {
        const jobsData = await response.json();
        const jobsArray = Array.isArray(jobsData) ? jobsData : [];
        
        // Show only the latest 6 jobs for homepage
        setRecentJobs(jobsArray.slice(0, 6));
        
        console.log(`Homepage: Showing ${jobsArray.slice(0, 6).length} latest jobs (filtered same as AvailableJobs)`);
      }
    } catch (error) {
      console.error('Error fetching latest jobs:', error);
      setRecentJobs([]);
    }
  }, []);

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
      fetchLatestJobs(); // This includes workerId for filtering
      fetchJobCount();
      fetchWorkerFinancials();
      fetchJobStats();
      fetchCategoryStats();
    } else if (user?.type === 'employer') {
      console.log('User is employer, fetching general job data');
      fetchRecentJobs(); // General public job display
    } else {
      console.log('No user or guest user, fetching minimal public data');
      fetchRecentJobs(); // Just public job display for homepage
    }
  }, [user, fetchJobCount, fetchWorkerFinancials, fetchJobStats, fetchCategoryStats, fetchLatestJobs]);

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

  const fetchRecentJobs = async () => {
    try {
              const response = await fetch(buildApiUrl('/jobs/recent'));
      if (!response.ok) {
        throw new Error('Failed to fetch recent jobs');
      }
      const data = await response.json();
      setRecentJobs(data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      setRecentJobs([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleViewJobs = () => {
    navigate('/jobs');
    setShowJobNotification(false);
  };

  const handleCloseJobNotification = () => {
    setShowJobNotification(false);
  };

  const renderUserProfile = () => {
    if (!isAuthenticated) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl md:max-w-5xl mx-auto my-12 md:my-16 px-3 md:px-4"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-md overflow-hidden border border-gray-200/50">
          <div className="relative p-4 md:p-8">
            {/* Geometric Background Pattern - Enhanced for Mobile */}
            <div className="absolute top-0 right-0 w-24 h-24 md:w-64 md:h-64 opacity-5">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="50,0 100,50 50,100 0,50" fill="currentColor"/>
              </svg>
            </div>
            
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4 md:space-x-6">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xl md:text-2xl font-bold text-white">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-light text-gray-900 tracking-wide">{user?.name}</h3>
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide md:tracking-widest font-medium">{user?.type}</p>
                  
                  {user?.type === 'worker' && (
                    <div className="mt-3 md:mt-4 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 md:space-x-6">
                      <div className="flex items-center">
                        <Wallet className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-700 font-medium">₹{workerBalance.toLocaleString()}</span>
                      </div>
                      
                      {jobCountLoading ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-sm text-gray-500">Loading jobs...</span>
                        </div>
                      ) : jobCount > 0 ? (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-sm text-gray-700">
                            {jobCount} jobs
                          {user.location?.state && ` in ${user.location.state}`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-500">No jobs available</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {user?.type === 'worker' && shaktiScore !== null && (
                    <div className="mt-2 inline-flex items-center">
                      <span className="text-xs text-gray-500 uppercase tracking-wide md:tracking-widest mr-2">Trust Score</span>
                      <span className="text-base md:text-lg font-light text-gray-900">{shaktiScore}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/${user.type}/profile`)}
                  className="flex-1 px-4 py-3 md:px-6 bg-black text-white text-xs md:text-sm font-medium tracking-wide hover:bg-gray-800 transition-all duration-300 touch-manipulation rounded-2xl shadow-sm hover:shadow-md"
                >
                  PROFILE
                </motion.button>
                
                {user.type === 'worker' && (jobCount > 0 || jobCountLoading) && (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleViewJobs}
                    disabled={jobCountLoading}
                    className="flex-1 px-4 py-3 md:px-6 border border-black text-black text-xs md:text-sm font-medium tracking-wide hover:bg-black hover:text-white transition-all duration-300 touch-manipulation rounded-2xl shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {jobCountLoading ? 'LOADING...' : `JOBS (${jobCount})`}
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 md:px-6 bg-gradient-to-r from-red-500/5 to-red-600/5 border border-red-400/40 text-red-600 text-xs md:text-sm font-medium tracking-wide hover:from-red-500/15 hover:to-red-600/15 hover:border-red-500/60 hover:text-red-700 transition-all duration-300 touch-manipulation rounded-2xl backdrop-blur-sm shadow-sm hover:shadow-lg group"
                >
                  <LogOut className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  LOGOUT
                </motion.button>
              </div>
            </div>
          </div>
          
          {user?.type === 'worker' && recentEarnings.length > 0 && (
            <div className="px-4 py-4 md:px-8 md:py-6 bg-gray-50 border-t">
              <h4 className="text-xs md:text-sm font-medium text-gray-700 uppercase tracking-wide md:tracking-widest mb-3 md:mb-4">Recent Activity</h4>
              <div className="space-y-2 md:space-y-3">
                {recentEarnings.map((earning, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-gray-600 truncate pr-2">{earning.description}</span>
                    <span className="text-xs md:text-sm font-medium text-gray-900 flex-shrink-0">+₹{earning.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 relative overflow-hidden" style={{
      background: `
        linear-gradient(135deg, 
          rgba(99, 102, 241, 0.1) 0%, 
          rgba(59, 130, 246, 0.1) 25%, 
          rgba(147, 51, 234, 0.1) 50%, 
          rgba(236, 72, 153, 0.1) 75%, 
          rgba(99, 102, 241, 0.1) 100%
        ),
        linear-gradient(45deg, 
          rgba(99, 102, 241, 0.05) 0%, 
          rgba(147, 51, 234, 0.05) 50%, 
          rgba(59, 130, 246, 0.05) 100%
        )
      `
    }}>
      {/* Enhanced Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary animated blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute -bottom-20 left-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
        
        {/* Secondary floating elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-green-200 to-teal-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000"></div>
        
        {/* Additional floating orbs */}
        <div className="absolute top-1/6 right-1/6 w-16 h-16 bg-gradient-to-br from-pink-200 to-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float animation-delay-1500"></div>
        <div className="absolute bottom-1/6 left-1/6 w-20 h-20 bg-gradient-to-br from-emerald-200 to-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-35 animate-float animation-delay-2500"></div>
        
        {/* Geometric shapes with enhanced animations */}
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-gradient-to-br from-red-200 to-pink-300 transform rotate-45 mix-blend-multiply filter blur-xl opacity-30 animate-pulse-glow"></div>
        <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-gradient-to-br from-cyan-200 to-blue-300 transform -rotate-45 mix-blend-multiply filter blur-xl opacity-30 animate-pulse-glow animation-delay-2000"></div>
        
        {/* Floating particles with enhanced effects */}
        <div className="absolute top-1/6 left-1/6 w-2 h-2 bg-white rounded-full opacity-20 animate-bounce shadow-lg"></div>
        <div className="absolute top-1/3 right-1/6 w-1 h-1 bg-white rounded-full opacity-30 animate-bounce animation-delay-1000 shadow-lg"></div>
        <div className="absolute bottom-1/3 left-1/6 w-1.5 h-1.5 bg-white rounded-full opacity-25 animate-bounce animation-delay-2000 shadow-lg"></div>
        <div className="absolute bottom-1/6 right-1/3 w-1 h-1 bg-white rounded-full opacity-20 animate-bounce animation-delay-3000 shadow-lg"></div>
        <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-white rounded-full opacity-40 animate-bounce animation-delay-1500 shadow-lg"></div>
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full opacity-25 animate-bounce animation-delay-3500 shadow-lg"></div>
        
        {/* Animated grid overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 animate-grid" style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-radial-gradient opacity-20"></div>
        
        {/* Light rays effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-300 to-transparent animate-pulse"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-300 to-transparent animate-pulse animation-delay-2000"></div>
          <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-blue-300 to-transparent animate-pulse animation-delay-4000"></div>
        </div>
        
        {/* Floating geometric patterns */}
        <div className="absolute top-1/4 right-1/4 w-12 h-12 border-2 border-indigo-300/30 rounded-full animate-spin"></div>
        <div className="absolute bottom-1/4 left-1/4 w-8 h-8 border-2 border-purple-300/30 rounded-full animate-spin animation-delay-2000"></div>
        <div className="absolute top-3/4 right-1/6 w-6 h-6 border-2 border-blue-300/30 rounded-full animate-spin animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
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

                {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-blue-50/50 to-purple-50/50 backdrop-blur-sm">
          {/* Hero Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Hero-specific animated elements */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-200/40 to-purple-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-blue-200/40 to-cyan-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float"></div>
            
            {/* Floating particles for hero */}
            <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-white rounded-full opacity-30 animate-bounce shadow-lg"></div>
            <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white rounded-full opacity-25 animate-bounce animation-delay-1000 shadow-lg"></div>
            <div className="absolute bottom-1/3 left-2/3 w-1.5 h-1.5 bg-white rounded-full opacity-20 animate-bounce animation-delay-2000 shadow-lg"></div>
            
            {/* Light rays for hero */}
            <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-indigo-300/30 to-transparent animate-pulse"></div>
            <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-300/30 to-transparent animate-pulse animation-delay-2000"></div>
            
            {/* Geometric patterns for hero */}
            <div className="absolute top-1/4 right-1/6 w-16 h-16 border-2 border-indigo-300/20 rounded-full animate-spin"></div>
            <div className="absolute bottom-1/4 left-1/6 w-12 h-12 border-2 border-purple-300/20 rounded-full animate-spin animation-delay-2000"></div>
          </div>
          
            <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="pt-16 pb-16 md:pt-24 md:pb-24">

                      {/* Compact Mobile-Friendly Welcome Header */}
        <AnimatePresence>
          {isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 md:mb-8"
            >
              <div className="relative mx-2 sm:mx-0">
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
                  <div className="px-4 py-3 md:px-6 md:py-4">
                    <div className="flex items-center justify-between">
                      {/* Compact User Info */}
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm md:text-base shadow-md">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border border-white animate-pulse"></div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm md:text-base font-medium text-gray-900 leading-tight">
                            {user?.name 
                              ? `Welcome back, ${user.name.split(' ')[0]}!` 
                              : 'Welcome to SINDH Platform!'}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500 capitalize">
                            {user.type} • Online
                            {workerProfile?.location 
                              ? ` • ${workerProfile.location.city ? `${workerProfile.location.city}, ` : ''}${workerProfile.location.state || ''}` 
                              : ` • ${user?.location?.state || 'Update your location in profile'}`}
                          </p>
                        </div>
                      </div>
                      
                      {/* Compact Actions */}
                      <div className="flex items-center space-x-2 md:space-x-3">
                        {user?.type === 'worker' && jobCount > 0 && !jobCountLoading && (
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="relative"
                          >
                            <div className="px-2 py-1 md:px-3 md:py-1.5 bg-green-500 text-white text-xs md:text-sm font-medium rounded-lg shadow-sm">
                              <div className="flex items-center">
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full mr-1.5 animate-pulse"></div>
                                {jobCount} jobs
                                {user.location?.state && (
                                  <span className="hidden sm:inline"> in {user.location.state}</span>
                                )}
                              </div>
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                          </motion.div>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLogout}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 text-gray-700 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center shadow-sm"
                        >
                          <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1.5" />
                          <span className="hidden sm:inline">Logout</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 md:mb-8"
            >
              <div className="relative mx-2 sm:mx-0">
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
                  <div className="px-4 py-3 md:px-6 md:py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm md:text-base shadow-md">
                          <span className="text-lg md:text-xl">🚀</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm md:text-base font-medium text-gray-900">
                            Welcome to INDUS
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500">
                            Your digital employment platform
                          </p>
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 md:px-6 md:py-2.5 bg-black text-white text-xs md:text-sm font-medium rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center shadow-sm"
                      >
                        <span className="mr-1.5">Get Started</span>
                        <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

              {/* Clean Main Title */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12 md:mb-16"
              >
                <div className="relative mb-8 md:mb-10">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 tracking-tight">
                    INDUS
                  </h1>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
                </div>

                <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-gray-600 tracking-wide mb-8 md:mb-10 px-4 md:px-0">
                  Digital Employment Platform
                </h2>
              </motion.div>

              {/* Clean Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-4 md:gap-6 justify-center items-center max-w-lg md:max-w-4xl mx-auto mb-12 md:mb-16 px-4 md:px-0"
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={!user ? () => navigate('/login?type=worker') : (user?.type === 'employer' ? () => navigate('/employer/posted-jobs') : handleFindWork)}
                  className="w-full md:w-auto px-8 py-4 bg-black text-white font-medium rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <span className="text-base">
                    {!user ? 'Find Job' : (user?.type === 'employer' ? 'Posted Jobs' : (user?.type === 'worker' ? 'Find Work' : 'Find Workers'))}
                  </span>
                  <ArrowRight className="w-5 h-5 ml-3" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={!user ? () => navigate('/login?type=employer') : handlePostJob}
                  className="w-full md:w-auto px-8 py-4 border-2 border-black text-black font-medium rounded-2xl hover:bg-black hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <span className="text-base">
                    {!user ? 'Post Job' : (user?.type === 'employer' ? 'Post New Job' : 'Hire Workers')}
                  </span>
                  <ArrowRight className="w-5 h-5 ml-3" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/chat-mode')}
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <MessageCircle className="w-5 h-5 mr-3" />
                  <span className="text-base">AI Assistant</span>
                  <span className="ml-3 px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                    New
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        {renderUserProfile()}

        {/* Mobile-Optimized AI Assistant Highlight with Glass Effect */}
        <div className="py-8 md:py-12 bg-gradient-to-br from-indigo-50/30 via-blue-50/30 to-purple-50/30 backdrop-blur-sm relative overflow-hidden">

              <motion.div
            initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            className="max-w-md md:max-w-2xl mx-auto text-center px-4 md:px-0 relative z-10"
          >
            <div className="p-6 md:p-8 border border-gray-200/30 bg-white/30 backdrop-blur-md relative overflow-hidden rounded-2xl">
              {/* Inner pattern overlay */}
              <div className="absolute inset-0 opacity-5">
                <motion.div
                  className="absolute top-2 right-2 w-8 h-8"
                  animate={{
                    rotate: [0, 180, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <polygon points="50,10 90,50 50,90 10,50" fill="black" />
                  </svg>
                </motion.div>
                  </div>

              <div className="relative z-10">
                <motion.div
                  className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mx-auto mb-4 md:mb-6 flex items-center justify-center rounded-2xl"
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </motion.div>
                <h3 className="text-lg md:text-xl font-light text-gray-900 mb-3 md:mb-4 tracking-wide">AI ASSISTANT</h3>
                <p className="text-sm md:text-base text-gray-600 font-light leading-relaxed mb-4 md:mb-6">
                  Instant help with jobs and platform guidance.
                  </p>
                  <button
                    onClick={() => navigate('/chat-mode')}
                  className="inline-flex items-center px-4 py-3 md:px-6 bg-black/90 backdrop-blur-md text-white text-sm font-medium tracking-wide md:tracking-widest hover:bg-gray-800 transition-colors touch-manipulation rounded-2xl"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                  TRY AI ASSISTANT
                  </button>
              </div>
                </div>
              </motion.div>
        </div>

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

              <div className="relative z-10">
                <motion.div
                  className="w-12 h-12 md:w-16 md:h-16 bg-black/90 backdrop-blur-sm mx-auto mb-4 md:mb-6 flex items-center justify-center rounded-2xl"
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <span className="text-white text-lg md:text-2xl font-bold">💪</span>
                </motion.div>
                <blockquote className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 leading-tight">
                  "Work! As if you were chased by a dawgg!!"
                </blockquote>
                <cite className="text-sm md:text-base text-gray-600 font-medium">
                  — Amar
                </cite>
            </div>
          </div>
          </motion.div>
      </div>

        {/* Mobile-Optimized Stats Grid with Glass Effect */}
        <div className="py-8 md:py-12 bg-gradient-to-br from-indigo-50/25 via-blue-50/25 to-purple-50/25 backdrop-blur-sm relative overflow-hidden">

          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center mb-10 md:mb-16"
            >
              <h2 className="text-2xl md:text-4xl font-light text-gray-900 tracking-wide mb-3 md:mb-4">
                Platform Stats
            </h2>
              <div className="w-12 md:w-16 h-px bg-black mx-auto mb-4 md:mb-8"></div>
              <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto font-light px-4 md:px-0">
                Connecting communities across India
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <motion.div
                whileHover={{ y: -2 }}
                className="bg-white/60 backdrop-blur-md p-4 md:p-8 border border-gray-100/50 group touch-manipulation rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3 tracking-wide">{stats.totalJobs}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-light uppercase tracking-wider">Active Jobs</p>
            </motion.div>

            <motion.div
                whileHover={{ y: -2 }}
                className="bg-white/60 backdrop-blur-md p-4 md:p-8 border border-gray-100/50 group touch-manipulation rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3 tracking-wide">{stats.activeWorkers}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-light uppercase tracking-wider">Active Workers</p>
            </motion.div>

            <motion.div
                whileHover={{ y: -2 }}
                className="bg-white/60 backdrop-blur-md p-4 md:p-8 border border-gray-100/50 group touch-manipulation rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                  <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3 tracking-wide">{stats.successfulMatches}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-light uppercase tracking-wider">Successful Matches</p>
            </motion.div>

            <motion.div
                whileHover={{ y: -2 }}
                className="bg-white/60 backdrop-blur-md p-4 md:p-8 border border-gray-100/50 group touch-manipulation rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                  <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3 tracking-wide">{stats.averageRating}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-light uppercase tracking-wider">Average Rating</p>
            </motion.div>
          </div>
        </div>
        </div>
      </div>

      {/* Local Matching Section with Glass Effect */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-indigo-50/35 via-blue-50/35 to-purple-50/35 backdrop-blur-sm relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-light text-gray-900 tracking-wide mb-3 md:mb-4">
              Local Matching
            </h2>
            <div className="w-12 md:w-16 h-px bg-black mx-auto mb-4 md:mb-8"></div>
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto font-light px-4 md:px-0">
              Connecting communities efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/60 backdrop-blur-md p-4 md:p-8 border border-gray-100/50 group touch-manipulation rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                <div className="text-white text-lg md:text-xl">🏘️</div>
              </div>
              <h3 className="text-sm md:text-lg font-medium mb-2 md:mb-3 tracking-wide">Hyperlocal</h3>
              <p className="text-xs md:text-base text-gray-600 font-light hidden md:block">Village-level job matching</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/60 backdrop-blur-md p-4 md:p-8 border border-gray-100/50 group touch-manipulation rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                <div className="text-white text-lg md:text-xl">🤝</div>
              </div>
              <h3 className="text-sm md:text-lg font-medium mb-2 md:mb-3 tracking-wide">Direct Connect</h3>
              <p className="text-xs md:text-base text-gray-600 font-light hidden md:block">No middleman approach</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/60 backdrop-blur-md p-4 md:p-8 border border-gray-100/50 group touch-manipulation rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                <div className="text-white text-lg md:text-xl">💼</div>
              </div>
              <h3 className="text-sm md:text-lg font-medium mb-2 md:mb-3 tracking-wide">Local Hiring</h3>
              <p className="text-xs md:text-base text-gray-600 font-light hidden md:block">Community-based recruitment</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/60 backdrop-blur-md p-4 md:p-8 border border-gray-100/50 group touch-manipulation rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                <div className="text-white text-lg md:text-xl">🌱</div>
              </div>
              <h3 className="text-sm md:text-lg font-medium mb-2 md:mb-3 tracking-wide">Growth</h3>
              <p className="text-xs md:text-base text-gray-600 font-light hidden md:block">Economic development focus</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Recent Jobs Section with Glass Effect */}
      <div className="py-12 md:py-20 bg-gradient-to-br from-indigo-50/30 via-blue-50/30 to-purple-50/30 backdrop-blur-sm relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-light text-gray-900 tracking-wide mb-3 md:mb-4">
              Recent Jobs
            </h2>
            <div className="w-12 md:w-16 h-px bg-black mx-auto mb-4 md:mb-8"></div>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto font-light px-4 md:px-0">
              Latest opportunities from trusted employers
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="w-6 h-6 md:w-8 md:h-8 border border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : recentJobs.length > 0 ? (
            <div className="grid gap-4 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {recentJobs.map((job) => (
                <motion.div
                  key={job._id}
                  whileHover={{ y: -2 }}
                  className="bg-white/70 backdrop-blur-md border border-gray-100/50 shadow-sm hover:shadow-lg group touch-manipulation rounded-2xl transition-all duration-300"
                >
                  <div className="p-4 md:p-8">
                    <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-1 md:mb-2 tracking-wide line-clamp-2">{job.title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide md:tracking-widest mb-4 md:mb-6 truncate">{job.companyName || job.company}</p>
                    
                    <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                      <div className="flex items-center text-xs md:text-sm text-gray-600">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{job.location?.city ? `${job.location.city}, ${job.location.state}` : 'Remote'}</span>
                    </div>
                      <div className="flex items-center text-xs md:text-sm text-gray-600">
                        <Wallet className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" />
                        <span>₹{job.salary?.toLocaleString() || 'Negotiable'}</span>
                      </div>
                    </div>
                    
                      <button
                      onClick={() => navigate(`/jobs/${job._id}`)}
                      className="w-full bg-black/90 backdrop-blur-sm text-white py-3 md:py-3 text-xs md:text-sm font-medium tracking-wide md:tracking-widest hover:bg-gray-800 transition-colors group-hover:bg-gray-800 touch-manipulation rounded-2xl"
                    >
                      VIEW DETAILS
                      </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center px-4 md:px-0">
              <p className="text-sm md:text-base text-gray-500 font-light">No jobs available at the moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Add global styles for animations */}
      <style jsx global>{`
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
      `}</style>
    </div>
  );
}

export default Homepage;