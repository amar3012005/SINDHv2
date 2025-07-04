import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { getCurrentUser } from '../utils/authUtils';
import { Phone, Star, Users, Briefcase, TrendingUp, Wallet } from 'lucide-react';
import { getApiUrl } from '../utils/apiUtils';

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
  const [showJobNotification, setShowJobNotification] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Add missing worker financial states
  const [workerBalance, setWorkerBalance] = useState(0);
  const [recentEarnings, setRecentEarnings] = useState([]);

  // Get user from context and fallback to localStorage if needed
  const { user: contextUser, isLoadingUser } = useUser();
  const user = contextUser || getCurrentUser();

  // Fetch job count for notifications - wrapped in useCallback
  const fetchJobCount = useCallback(async () => {
    try {
      console.log('Fetching job count for user:', user);
      
      const queryParams = new URLSearchParams();
      
      // Add user-specific parameter for application status (same as AvailableJobs)
      if (user?.id && user?.type === 'worker') {
        queryParams.append('workerId', user.id);
      }
      
      // Use the same filtering logic as AvailableJobs - only active and in-progress jobs
      queryParams.append('status', 'active,in-progress');
      
      // Add location filter if user has location
      if (user?.location?.state) {
        queryParams.append('location', user.location.state);
        console.log('Adding location filter:', user.location.state);
      }

      const url = getApiUrl(`/api/jobs/count?${queryParams.toString()}`);
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
        setJobCount(count);
        setStats(prev => ({ ...prev, totalJobs: count }));
        
        if (user?.type === 'worker' && count > 0 && !hasShownNotification) {
          console.log('Showing notifications for worker with', count, 'jobs');
          
          const locationText = user.location?.state ? ` in ${user.location.state}` : '';
          
          toast.success(`🎯 ${count} job${count !== 1 ? 's' : ''} available${locationText}!`, {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
          setTimeout(() => {
            setShowJobNotification(true);
            setHasShownNotification(true);
          }, 3000);
        }
        
        return count;
      }
    } catch (error) {
      console.error('Error fetching job count:', error);
      return 0;
    }
  }, [user, hasShownNotification]);

  // Fetch worker balance and earnings - wrapped in useCallback
  const fetchWorkerFinancials = useCallback(async () => {
    if (user?.type === 'worker' && user?.id) {
      try {
        const response = await fetch(getApiUrl(`/api/workers/${user.id}/balance`));
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
      queryParams.append('status', 'active,in-progress');
      
      console.log('Fetching job count with params:', queryParams.toString());
      
      const response = await fetch(getApiUrl(`/api/jobs/count?${queryParams.toString()}`));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Job count response:', data);
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
        queryParams.append('status', 'active,in-progress'); // Same filtering as AvailableJobs
        
        // Add worker-specific filtering
        if (user.id && user.type === 'worker') {
          queryParams.append('workerId', user.id);
        }
        
        const response = await fetch(getApiUrl(`/api/jobs/count?${queryParams.toString()}`));
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
      queryParams.append('status', 'active,in-progress');
      
      const response = await fetch(getApiUrl(`/api/jobs?${queryParams.toString()}`));
      
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
    
    fetchRecentJobs();
    fetchLatestJobs();
    
    if (user?.type === 'worker') {
      console.log('User is worker, fetching job count');
      fetchJobCount();
      fetchWorkerFinancials();
      fetchJobStats();
      fetchCategoryStats();
    } else {
      console.log('User is not worker or no user:', user?.type);
    }
  }, [user, fetchJobCount, fetchWorkerFinancials, fetchJobStats, fetchCategoryStats, fetchLatestJobs]);

  const fetchShaktiScore = async (workerId) => {
    try {
      const response = await fetch(getApiUrl(`/api/workers/${workerId}/shakti-score`));
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
      const response = await fetch(getApiUrl('/api/jobs/recent'));
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
      navigate('/login');
      return;
    }
    navigate('/jobs');
  };

  const handlePostJob = () => {
    if (!isAuthenticated) {
      toast.info(t('home.loginAsEmployer'));
      navigate('/login');
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

  const renderGrameenLinkProfile = () => {
    if (!isAuthenticated) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto my-12 px-4"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{user?.type}</p>
                  
                  {user?.type === 'worker' && (
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <Wallet className="w-4 h-4 mr-1" />
                        {t('common.wallet')}: ₹{workerBalance.toLocaleString()}
                      </div>
                      
                      {jobCount > 0 && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          🎯 {jobCount} job{jobCount !== 1 ? 's' : ''} 
                          {user.location?.state && ` in ${user.location.state}`}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {user?.type === 'worker' && shaktiScore !== null && (
                    <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('home.shaktiScore')}: {shaktiScore}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/${user.type}/profile`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('home.viewProfile')}
                </button>
                {user.type === 'worker' && jobCount > 0 && (
                  <button
                    onClick={handleViewJobs}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    🎯 View Jobs ({jobCount})
                    {user.location?.state && (
                      <span className="ml-1 text-xs opacity-90">in {user.location.state}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {user?.type === 'worker' && recentEarnings.length > 0 && (
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('home.recentEarnings')}</h4>
              <div className="space-y-1">
                {recentEarnings.map((earning, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 truncate">{earning.description}</span>
                    <span className="font-semibold text-green-600">+₹{earning.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <p className="text-sm text-gray-600">
              {user?.type === 'worker'
                ? t('home.workerMessage')
                : t('home.employerMessage')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Enhanced Job Count Popup with Indian Design */}
      <AnimatePresence>
        {showJobNotification && user?.type === 'worker' && jobCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 100 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white p-6 rounded-2xl shadow-2xl border-2 border-yellow-400 backdrop-blur-sm relative overflow-hidden">
              {/* Traditional Border Pattern */}
              <div className="absolute inset-0 border-4 border-yellow-300 rounded-2xl opacity-30"></div>
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full"></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse border-2 border-yellow-300">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg flex items-center">
                        🌟 New Jobs Available!
                      </h4>
                      <p className="text-sm text-white/90">
                        🎯 {stats.totalJobs} job{stats.totalJobs !== 1 ? 's' : ''} 
                        {user.location?.state ? ` available in ${user.location.state}` : ' waiting for you'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseJobNotification}
                    className="text-white/70 hover:text-white transition-colors p-1 bg-black/20 rounded-full"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleViewJobs}
                    className="flex-1 bg-white text-orange-600 px-4 py-2.5 rounded-lg font-bold hover:bg-yellow-50 transition-colors shadow-md border-2 border-yellow-300"
                  >
                    View All Jobs
                  </button>
                  <button
                    onClick={handleCloseJobNotification}
                    className="px-4 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm border border-yellow-300"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Hero Section with Indian Cultural Elements */}
      <div className="relative overflow-hidden">
        {/* Traditional Pattern Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-green-600/5"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF6B35' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="absolute bottom-20 right-10 w-20 h-20 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-red-500 transform rotate-45"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-10 pb-16 md:pt-16 md:pb-20 lg:pt-20 lg:pb-28">
            <div className="text-center">
              <AnimatePresence>
                {isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-2xl border-2 border-yellow-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
                      <span className="font-bold text-lg">
                        🙏 Welcome back, {user.name || user.company?.name}!
                      </span>
                      {user?.type === 'worker' && stats.totalJobs > 0 && (
                        <div className="ml-3 px-4 py-2 bg-white/20 rounded-full text-sm border border-yellow-300">
                          🎯 {stats.totalJobs} job{stats.totalJobs !== 1 ? 's' : ''} 
                          {user.location?.state && ` in ${user.location.state}`}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="font-semibold">{t('home.welcome')}</span>
                      <button
                        onClick={() => navigate('/login')}
                        className="ml-4 px-4 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
                      >
                        {t('home.loginRegister')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Main Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 relative"
              >
                {/* Decorative Elements */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                    <div className="w-4 h-4 bg-yellow-400 transform rotate-45"></div>
                    <div className="w-8 h-1 bg-gradient-to-r from-red-500 to-orange-400"></div>
                  </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4">
                  <span className="bg-gradient-to-r from-orange-600 to-orange-600 bg-clip-text text-transparent">
                    I N D U S
                  </span>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
                  🌾 {t('home.tagline')} 🌾
                </h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  {t('home.description')}
                </p>
              </motion.div>

              {/* Enhanced Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto"
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-orange-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalJobs}</div>
                  <div className="text-sm text-gray-700 font-medium">{t('stats.activeJobs')}</div>
                  {user?.type === 'worker' && stats.totalJobs > 0 && (
                    <div className="mt-2 text-xs text-green-700 font-bold bg-green-100 rounded-full px-3 py-1">
                      🎯 {user.location?.state ? `Available in ${user.location.state}` : 'Available now!'}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-green-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.activeWorkers.toLocaleString()}</div>
                  <div className="text-sm text-gray-700 font-medium">{t('stats.activeWorkers')}</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-purple-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.successfulMatches.toLocaleString()}</div>
                  <div className="text-sm text-gray-700 font-medium">{t('stats.successfulMatches')}</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-yellow-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.averageRating}</div>
                  <div className="text-sm text-gray-700 font-medium">{t('stats.averageRating')}</div>
                </motion.div>
              </motion.div>

              {/* Enhanced Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-8 justify-center items-center max-w-3xl mx-auto"
              >
                <motion.button
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFindWork}
                  className="group relative w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl font-bold text-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <Briefcase className="w-6 h-6" />
                    <span>{user?.type === 'worker' ? t('home.findJobs') : t('home.findWork')}</span>
                    {user?.type === 'worker' && stats.totalJobs > 0 && (
                      <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">
                        🎯 {stats.totalJobs}
                      </span>
                    )}
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 25px 50px rgba(34, 197, 94, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePostJob}
                  className="group relative w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-xl font-bold text-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <Users className="w-6 h-6" />
                    <span>{user?.type === 'employer' ? t('home.postJob') : t('home.hireWorkers')}</span>
                  </div>
                </motion.button>
              </motion.div>

              {/* Quick Contact for Rural Users */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 max-w-md mx-auto shadow-lg"
                >
                  <div className="text-center">
                    <Phone className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">{t('support.needHelp')}</h3>
                    <p className="text-sm text-gray-600 mb-4">{t('support.callSupport')}</p>
                    <a
                      href="tel:+911800123456"
                      className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {t('support.phoneNumber')}
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GrameenLink Profile */}
      {renderGrameenLinkProfile()}

      {/* Shakti Score Section */}
      {user?.type === 'worker' && shaktiScore !== null && (
        <div className="py-12 bg-gradient-to-r from-purple-500 to-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                {t('home.yourShaktiScore')}
              </h2>
              <div className="mt-8 flex justify-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="bg-white rounded-full p-8 shadow-xl transform hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-6xl font-bold text-purple-600">{shaktiScore}</div>
                  <p className="mt-2 text-gray-600">{t('home.yourTrustScore')}</p>
                </motion.div>
              </div>
              <p className="mt-4 text-xl text-white">
                {t('home.higherScoreMessage')}
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white">{t('home.jobPriority')}</h3>
                  <p className="text-white/80">{t('home.jobPriorityDesc')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white">{t('home.trustBadge')}</h3>
                  <p className="text-white/80">{t('home.trustBadgeDesc')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white">{t('home.betterPay')}</h3>
                  <p className="text-white/80">{t('home.betterPayDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GrameenLink Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <span>🧑‍🌾</span> {t('grameenlink.title')}
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto my-4"></div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              {t('grameenlink.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-green-100"
            >
              <div className="text-green-600 mb-4 text-3xl">🎤</div>
              <h3 className="text-xl font-semibold mb-2">{t('grameenlink.voiceResumes')}</h3>
              <p className="text-gray-600">{t('grameenlink.voiceResumesDesc')}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-green-100"
            >
              <div className="text-green-600 mb-4 text-3xl">🏷️</div>
              <h3 className="text-xl font-semibold mb-2">{t('grameenlink.skillTagging')}</h3>
              <p className="text-gray-600">{t('grameenlink.skillTaggingDesc')}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-green-100"
            >
              <div className="text-green-600 mb-4 text-3xl">✅</div>
              <h3 className="text-xl font-semibold mb-2">{t('grameenlink.localVerification')}</h3>
              <p className="text-gray-600">{t('grameenlink.localVerificationDesc')}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-green-100"
            >
              <div className="text-green-600 mb-4 text-3xl">🌟</div>
              <h3 className="text-xl font-semibold mb-2">{t('grameenlink.localPride')}</h3>
              <p className="text-gray-600">{t('grameenlink.localPrideDesc')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ShramSaathi Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <span>📢</span> {t('shramSaathi.title')}
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto my-4"></div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              {t('shramSaathi.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100"
            >
              <div className="text-blue-600 mb-4 text-3xl">🏘️</div>
              <h3 className="text-xl font-semibold mb-2">{t('shramSaathi.hyperlocalMatching')}</h3>
              <p className="text-gray-600">{t('shramSaathi.hyperlocalMatchingDesc')}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100"
            >
              <div className="text-blue-600 mb-4 text-3xl">🤝</div>
              <h3 className="text-xl font-semibold mb-2">{t('shramSaathi.directConnection')}</h3>
              <p className="text-gray-600">{t('shramSaathi.directConnectionDesc')}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100"
            >
              <div className="text-blue-600 mb-4 text-3xl">💼</div>
              <h3 className="text-xl font-semibold mb-2">{t('shramSaathi.localHiring')}</h3>
              <p className="text-gray-600">{t('shramSaathi.localHiringDesc')}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100"
            >
              <div className="text-blue-600 mb-4 text-3xl">🌱</div>
              <h3 className="text-xl font-semibold mb-2">{t('shramSaathi.communityGrowth')}</h3>
              <p className="text-gray-600">{t('shramSaathi.communityGrowthDesc')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recent Jobs Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('recentJobs.title')}
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {t('recentJobs.subtitle')}
            </p>
          </div>

          {loading ? (
            <div className="mt-10 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : recentJobs.length > 0 ? (
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {recentJobs.map((job) => (
                <motion.div
                  key={job._id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{job.companyName || job.company}</p>
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {job.location?.city ? `${job.location.city}, ${job.location.state}` : 'Location not specified'}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ₹{job.salary?.toLocaleString() || 'Salary not specified'}
                      </span>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          navigate(`/jobs/${job._id}`);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        {t('recentJobs.viewDetails')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mt-10 text-center">
              <p className="text-gray-500">{t('recentJobs.noJobs')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;