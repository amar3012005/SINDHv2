import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { getCurrentUser } from '../utils/authUtils';
import { Phone, Star, Users, Briefcase, TrendingUp, Wallet, MessageCircle, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { getApiUrl } from '../utils/apiUtils';

// Animated Pattern Components
const FloatingGeometry = ({ delay = 0 }) => {
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 20 + 10;
  const duration = Math.random() * 10 + 15;
  
  const initialX = Math.random() * window.innerWidth;
  const initialY = Math.random() * window.innerHeight;
  
  return (
    <motion.div
      className="absolute pointer-events-none opacity-5"
      style={{
        width: size,
        height: size,
        left: initialX,
        top: initialY,
      }}
      animate={{
        x: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
        y: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.2, 0.8, 1]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
    >
      {shape === 'square' && <div className="w-full h-full bg-black" />}
      {shape === 'circle' && <div className="w-full h-full bg-black rounded-full" />}
      {shape === 'triangle' && (
        <div 
          className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[17px] border-l-transparent border-r-transparent border-b-black"
          style={{ borderBottomWidth: size * 0.866 }}
        />
      )}
    </motion.div>
  );
};

const AnimatedGrid = ({ opacity = 0.05 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, black 1px, transparent 1px),
            linear-gradient(black 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 50, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

const ParticleField = ({ count = 30 }) => {
  const particles = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-black rounded-full opacity-20"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.2, 0.5, 0.2],
        scale: [1, 1.5, 1]
      }}
      transition={{
        duration: Math.random() * 3 + 2,
        repeat: Infinity,
        delay: Math.random() * 2,
        ease: "easeInOut"
      }}
    />
  ));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles}
    </div>
  );
};

const WavePattern = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
      <motion.svg
        className="absolute w-full h-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <defs>
          <pattern id="wave" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M0,50 Q25,25 50,50 T100,50" stroke="black" strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wave)" />
      </motion.svg>
    </div>
  );
};

const GeometricOverlay = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated triangles */}
      <motion.div
        className="absolute top-10 right-10 w-16 h-16 opacity-10"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,10 90,80 10,80" fill="black" />
        </svg>
      </motion.div>

      {/* Animated squares */}
      <motion.div
        className="absolute top-1/4 left-10 w-12 h-12 opacity-10"
        animate={{
          rotate: [0, 45, 0],
          x: [0, 20, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-black transform rotate-45" />
      </motion.div>

      {/* Animated circles */}
      <motion.div
        className="absolute bottom-1/4 right-20 opacity-10"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-8 h-8 border-2 border-black rounded-full" />
      </motion.div>

      {/* Animated lines */}
      <motion.div
        className="absolute top-1/2 left-1/4 opacity-10"
        animate={{
          scaleX: [1, 1.5, 1],
          rotate: [0, 10, 0]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-24 h-px bg-black" />
      </motion.div>
    </div>
  );
};

const NetworkLines = () => {
  const nodes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((node, i) => (
          <g key={node.id}>
            {/* Node */}
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="0.5"
              fill="black"
              animate={{
                r: [0.3, 0.7, 0.3],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
            
            {/* Connection lines */}
            {nodes.slice(i + 1).map((nextNode, j) => (
              <motion.line
                key={`${i}-${j}`}
                x1={node.x}
                y1={node.y}
                x2={nextNode.x}
                y2={nextNode.y}
                stroke="black"
                strokeWidth="0.1"
                animate={{
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: (i + j) * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
};

const MorphingPattern = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
      <motion.svg
        className="absolute top-1/3 left-1/3 w-32 h-32"
        viewBox="0 0 100 100"
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <motion.path
          d="M50,10 L90,35 L75,85 L25,85 L10,35 Z"
          fill="black"
          animate={{
            d: [
              "M50,10 L90,35 L75,85 L25,85 L10,35 Z",
              "M50,5 L95,30 L80,90 L20,90 L5,30 Z",
              "M50,15 L85,40 L70,80 L30,80 L15,40 Z",
              "M50,10 L90,35 L75,85 L25,85 L10,35 Z"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.svg>
    </div>
  );
};

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

  const renderUserProfile = () => {
    if (!isAuthenticated) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl md:max-w-5xl mx-auto my-12 md:my-16 px-3 md:px-4"
      >
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl overflow-hidden border border-gray-100">
          <div className="relative p-4 md:p-8">
            {/* Geometric Background Pattern - Hidden on Mobile */}
            <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 opacity-5 hidden md:block">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="50,0 100,50 50,100 0,50" fill="currentColor"/>
              </svg>
            </div>
            
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4 md:space-x-6">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-full flex items-center justify-center">
                    <span className="text-xl md:text-2xl font-bold text-white">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-gray-900 rounded-full border-2 border-white"></div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-light text-gray-900 tracking-wide">{user?.name}</h3>
                  <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide md:tracking-widest font-medium">{user?.type}</p>
                  
                  {user?.type === 'worker' && (
                    <div className="mt-3 md:mt-4 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-6">
                      <div className="flex items-center">
                        <Wallet className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-700 font-medium">₹{workerBalance.toLocaleString()}</span>
                      </div>
                      
                      {jobCount > 0 && (
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-black rounded-full mr-2"></div>
                          <span className="text-sm text-gray-700">
                            {jobCount} jobs
                          {user.location?.state && ` in ${user.location.state}`}
                          </span>
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
              
              <div className="flex flex-row md:flex-col gap-2 md:gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/${user.type}/profile`)}
                  className="flex-1 md:flex-none px-4 py-3 md:px-6 bg-black text-white text-xs md:text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors duration-200 touch-manipulation"
                >
                  PROFILE
                </motion.button>
                
                {user.type === 'worker' && jobCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleViewJobs}
                    className="flex-1 md:flex-none px-4 py-3 md:px-6 border border-black text-black text-xs md:text-sm font-medium tracking-wide hover:bg-black hover:text-white transition-all duration-200 touch-manipulation"
                  >
                    JOBS ({jobCount})
                  </motion.button>
                )}
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
    <div className="min-h-screen relative">
      {/* Multi-layer Background with sophisticated glass-morphism */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 -z-10"></div>
      
      {/* Animated Pattern Overlay */}
      <div className="fixed inset-0 -z-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.02)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.01)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(0,0,0,0.01)_49%,rgba(0,0,0,0.01)_51%,transparent_52%)]"></div>
        <AnimatedGrid opacity={0.02} />
        <ParticleField count={25} />
        <NetworkLines />
        <GeometricOverlay />
      </div>

      {/* Glass-morphism overlay sections */}
      <div className="relative z-10 backdrop-blur-sm">
        {/* Mobile-Optimized Job Notification */}
        <AnimatePresence>
          {showJobNotification && user?.type === 'worker' && jobCount > 0 && (
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
                    {stats.totalJobs} available
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

        {/* Hero Section with Glass-morphism */}
        <div className="relative overflow-hidden bg-white/30 backdrop-blur-sm">
          {/* Floating geometric shapes */}
          {Array.from({ length: 12 }, (_, i) => (
            <FloatingGeometry key={i} delay={i * 0.5} />
          ))}
          
          {/* Enhanced geometric background with glass effect */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="stairs" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0,0 L20,0 L20,20 L40,20 L40,40 L60,40 L60,60 L80,60 L80,80 L100,80 L100,100 L0,100 Z" fill="black" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#stairs)" />
            </svg>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="pt-16 pb-16 md:pt-24 md:pb-24">
              
              {/* Mobile-Optimized Welcome Badge with Glass Effect */}
              <AnimatePresence>
                {isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 md:mb-12"
                  >
                    <div className="flex flex-col sm:inline-flex sm:flex-row items-center px-4 py-3 md:px-6 bg-black/90 backdrop-blur-md text-white mx-2 sm:mx-0 rounded-2xl border border-white/10">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 md:mr-3"></div>
                        <span className="text-xs md:text-sm font-medium tracking-wide uppercase">
                          Welcome, {user.name?.split(' ')[0] || user.company?.name}
                        </span>
                      </div>
                      {user?.type === 'worker' && stats.totalJobs > 0 && (
                        <div className="mt-2 sm:mt-0 sm:ml-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-black text-xs font-medium tracking-wide rounded-xl">
                          {stats.totalJobs} JOBS
                          {user.location?.state && ` IN ${user.location.state.toUpperCase()}`}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 md:mb-12"
                  >
                    <div className="flex flex-col sm:inline-flex sm:flex-row items-center px-4 py-3 md:px-6 border border-gray-300/50 mx-2 sm:mx-0 rounded-2xl bg-white/40 backdrop-blur-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 md:mr-3"></div>
                        <span className="text-xs md:text-sm font-medium tracking-wide uppercase text-gray-700">
                          Welcome to INDUS
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/login')}
                        className="mt-2 sm:mt-0 sm:ml-4 px-4 py-2 md:px-3 md:py-1 bg-black/90 backdrop-blur-sm text-white text-xs font-medium tracking-wide hover:bg-gray-800 transition-colors touch-manipulation rounded-xl"
                      >
                        GET STARTED
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile-Optimized Main Title */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12 md:mb-16"
              >
                              <div className="relative mb-6 md:mb-8">
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-gray-900 tracking-wide md:tracking-wider">
                  INDUS
                </h1>
                <div className="absolute -bottom-1 md:-bottom-2 left-1/2 transform -translate-x-1/2 w-16 md:w-24 h-px bg-black"></div>
              </div>

                <h2 className="text-lg md:text-xl lg:text-2xl font-light text-gray-600 tracking-wide mb-6 md:mb-8 px-4 md:px-0">
                  Digital Employment Platform
                </h2>
              </motion.div>

              {/* Mobile-Optimized Action Buttons with Glass Effect */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-4 md:gap-6 justify-center items-center max-w-lg md:max-w-4xl mx-auto mb-12 md:mb-16 px-4 md:px-0"
              >
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleFindWork}
                  className="group relative w-full md:w-auto px-8 py-4 md:px-12 bg-black/90 backdrop-blur-md text-white font-medium tracking-wide md:tracking-widest overflow-hidden touch-manipulation rounded-2xl border border-white/10"
                >
                  <div className="absolute inset-0 bg-gray-800 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <div className="relative flex items-center justify-center space-x-2 md:space-x-3">
                    <span className="text-sm md:text-base">
                      {user?.type === 'worker' ? 'FIND WORK' : 'FIND WORKERS'}
                    </span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    {user?.type === 'worker' && stats.totalJobs > 0 && (
                      <span className="ml-1 md:ml-2 px-2 py-1 bg-white/90 backdrop-blur-sm text-black text-xs font-medium rounded-lg">
                        {stats.totalJobs}
                      </span>
                    )}
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePostJob}
                  className="group relative w-full md:w-auto px-8 py-4 md:px-12 border border-black/30 text-black font-medium tracking-wide md:tracking-widest overflow-hidden touch-manipulation rounded-2xl bg-white/40 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <div className="relative flex items-center justify-center space-x-2 md:space-x-3 group-hover:text-white transition-colors duration-300">
                    <span className="text-sm md:text-base">
                      {user?.type === 'employer' ? 'POST JOB' : 'HIRE WORKERS'}
                    </span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/chat-mode')}
                  className="group relative w-full md:w-auto px-8 py-4 md:px-12 bg-gray-900/90 backdrop-blur-md text-white font-medium tracking-wide md:tracking-widest overflow-hidden touch-manipulation rounded-2xl border border-white/10"
                >
                  <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <div className="relative flex items-center justify-center space-x-2 md:space-x-3">
                    <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">AI ASSISTANT</span>
                    <span className="ml-1 md:ml-2 px-2 py-1 bg-white/90 backdrop-blur-sm text-black text-xs font-medium tracking-normal rounded-lg">
                      NEW
                    </span>
                  </div>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        {renderUserProfile()}

        {/* Mobile-Optimized AI Assistant Highlight with Glass Effect */}
        <div className="py-8 md:py-12 bg-white/20 backdrop-blur-sm relative overflow-hidden">
          {/* AI Assistant Background Patterns */}
          <div className="absolute inset-0 opacity-5">
            <motion.div
              className="absolute top-1/4 right-1/4 w-24 h-24"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="30" fill="none" stroke="black" strokeWidth="1" />
                <circle cx="50" cy="50" r="15" fill="none" stroke="black" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="5" fill="black" />
              </svg>
            </motion.div>

            <motion.div
              className="absolute bottom-1/4 left-1/4 w-20 h-20"
              animate={{
                rotate: [360, 0],
                x: [0, 15, 0]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="25" y="25" width="50" height="50" fill="none" stroke="black" strokeWidth="1" transform="rotate(45 50 50)" />
                <rect x="35" y="35" width="30" height="30" fill="none" stroke="black" strokeWidth="0.5" transform="rotate(45 50 50)" />
              </svg>
            </motion.div>
            
            {/* Floating AI particles */}
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-black rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: Math.random() * 5 + 4,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
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

        {/* Mobile-Optimized Stats Grid with Glass Effect */}
        <div className="py-8 md:py-12 bg-white/10 backdrop-blur-sm relative overflow-hidden">
          {/* Stats Section Background Patterns */}
          <div className="absolute inset-0 opacity-5">
            <AnimatedGrid opacity={0.03} />
            
            <motion.div
              className="absolute top-1/4 left-1/4 w-16 h-16"
              animate={{
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" strokeWidth="1" />
                <rect x="25" y="25" width="50" height="50" fill="none" stroke="black" strokeWidth="0.5" />
                <rect x="40" y="40" width="20" height="20" fill="black" />
              </svg>
            </motion.div>

            <motion.div
              className="absolute bottom-1/4 right-1/4 w-20 h-20"
              animate={{
                rotate: [360, 0],
                y: [0, -10, 0]
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="black" strokeWidth="1" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="black" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="10" fill="black" />
              </svg>
            </motion.div>
          </div>

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
                className="bg-white/30 backdrop-blur-sm p-4 md:p-8 border border-gray-100/30 group touch-manipulation rounded-2xl"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3 tracking-wide">{stats.totalJobs}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-light uppercase tracking-wider">Active Jobs</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white/30 backdrop-blur-sm p-4 md:p-8 border border-gray-100/30 group touch-manipulation rounded-2xl"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3 tracking-wide">{stats.activeWorkers}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-light uppercase tracking-wider">Active Workers</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white/30 backdrop-blur-sm p-4 md:p-8 border border-gray-100/30 group touch-manipulation rounded-2xl"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                  <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-3 tracking-wide">{stats.successfulMatches}</h3>
                <p className="text-xs md:text-sm text-gray-600 font-light uppercase tracking-wider">Successful Matches</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white/30 backdrop-blur-sm p-4 md:p-8 border border-gray-100/30 group touch-manipulation rounded-2xl"
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
      <section className="py-12 md:py-20 bg-white/15 backdrop-blur-sm relative overflow-hidden">
        {/* Local Matching Background Patterns */}
        <div className="absolute inset-0 opacity-5">
          <MorphingPattern />
          
          <motion.svg
            className="absolute top-1/4 left-1/4 w-32 h-32"
            viewBox="0 0 100 100"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <motion.path
              d="M50,10 L90,30 L80,70 L50,90 L20,70 L10,30 Z"
              fill="none"
              stroke="black"
              strokeWidth="1"
              animate={{
                strokeDasharray: ["0,200", "100,200", "200,200"],
                strokeDashoffset: [0, -50, -100]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: 1.5,
                ease: "easeInOut"
              }}
            />
          </motion.svg>
        </div>
        
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
              className="bg-white/30 backdrop-blur-sm p-4 md:p-8 border border-gray-100/30 group touch-manipulation rounded-2xl"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                <div className="text-white text-lg md:text-xl">🏘️</div>
              </div>
              <h3 className="text-sm md:text-lg font-medium mb-2 md:mb-3 tracking-wide">Hyperlocal</h3>
              <p className="text-xs md:text-base text-gray-600 font-light hidden md:block">Village-level job matching</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/30 backdrop-blur-sm p-4 md:p-8 border border-gray-100/30 group touch-manipulation rounded-2xl"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                <div className="text-white text-lg md:text-xl">🤝</div>
              </div>
              <h3 className="text-sm md:text-lg font-medium mb-2 md:mb-3 tracking-wide">Direct Connect</h3>
              <p className="text-xs md:text-base text-gray-600 font-light hidden md:block">No middleman approach</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/30 backdrop-blur-sm p-4 md:p-8 border border-gray-100/30 group touch-manipulation rounded-2xl"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-black/90 backdrop-blur-sm mb-4 md:mb-6 flex items-center justify-center group-hover:bg-gray-800 transition-colors rounded-2xl">
                <div className="text-white text-lg md:text-xl">💼</div>
              </div>
              <h3 className="text-sm md:text-lg font-medium mb-2 md:mb-3 tracking-wide">Local Hiring</h3>
              <p className="text-xs md:text-base text-gray-600 font-light hidden md:block">Community-based recruitment</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white/30 backdrop-blur-sm p-4 md:p-8 border border-gray-100/30 group touch-manipulation rounded-2xl"
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
      <div className="py-12 md:py-20 bg-white/10 backdrop-blur-sm relative overflow-hidden">
        {/* Recent Jobs Background Patterns */}
        <div className="absolute inset-0 opacity-5">
          <WavePattern />
          
          <motion.div
            className="absolute top-1/4 right-1/4 w-28 h-28"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
              x: [0, 10, 0]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="15" y="15" width="70" height="70" fill="none" stroke="black" strokeWidth="1" />
              <rect x="25" y="25" width="50" height="50" fill="none" stroke="black" strokeWidth="0.5" />
              <rect x="35" y="35" width="30" height="30" fill="none" stroke="black" strokeWidth="0.5" />
              <rect x="42" y="42" width="16" height="16" fill="black" />
            </svg>
          </motion.div>
          
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-24 h-24"
            animate={{
              rotate: [360, 0],
              y: [0, -15, 0],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="45" fill="none" stroke="black" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="black" strokeWidth="1" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="black" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="5" fill="black" />
              <rect x="47" y="5" width="6" height="90" fill="none" stroke="black" strokeWidth="0.5" />
              <rect x="5" y="47" width="90" height="6" fill="none" stroke="black" strokeWidth="0.5" />
            </svg>
          </motion.div>
          
          {/* Job cards floating pattern */}
          {Array.from({ length: 6 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-3 bg-black opacity-20"
              style={{
                left: `${20 + (i * 12)}%`,
                top: `${30 + Math.sin(i) * 20}%`,
              }}
              animate={{
                y: [0, -10, 0],
                x: [0, 5, 0],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
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
                  className="bg-white/40 backdrop-blur-sm border border-gray-100/30 shadow-sm group touch-manipulation rounded-2xl"
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
    </div>
  );
}

export default Homepage;