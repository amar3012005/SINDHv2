import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslationContext } from '../context/TranslationContext';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { getCurrentUser, getUserType } from '../utils/authUtils';

function Homepage() {
  const { translate } = useContext(TranslationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shaktiScore, setShaktiScore] = useState(null);

  // Get user from context and fallback to localStorage if needed
  const { user: contextUser, isLoadingUser, logoutUser } = useUser();
  const user = contextUser || getCurrentUser();

  useEffect(() => {
    // Show welcome toast if coming from login
    if (location.state?.showWelcome && user) {
      toast.success(`Welcome back, ${user.name}!`);
      // Clear the state after showing toast
      navigate('/', { replace: true, state: {} });
    }
  }, [location, user, navigate]);

  useEffect(() => {
    // Fetch recent jobs
    fetchRecentJobs();
  }, []);

  useEffect(() => {
    // Fetch Shakti score if user is a worker and is loaded
    if (!isLoadingUser && user && user.type === 'worker') {
      fetchShaktiScore(user.id);
    } else if (!isLoadingUser && (!user || user.type !== 'worker')) {
      setShaktiScore(null);
    }
  }, [user, isLoadingUser]);

  const fetchShaktiScore = async (workerId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/workers/${workerId}/shakti-score`);
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
      const response = await fetch('http://localhost:5000/api/jobs/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch recent jobs');
      }
      const data = await response.json();
      setRecentJobs(data.slice(0, 3)); // Get only 3 most recent jobs
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      setRecentJobs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    localStorage.clear(); // Clear all localStorage items
    navigate('/login');
  };

  const isAuthenticated = user && contextUser;

  const handleFindWork = () => {
    if (!isAuthenticated) {
      toast.info('Please login first to continue');
      navigate('/login');
      return;
    }
    navigate('/jobs');
  };

  const handlePostJob = () => {
    if (!isAuthenticated) {
      toast.info('Please login as an employer to post jobs');
      navigate('/login');
      return;
    }
    
    if (user.type !== 'employer') {
      toast.error('Only employers can post jobs');
      return;
    }
    
    navigate('/employer/post-job');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4">
              <div className="sm:text-center lg:text-left">
                <AnimatePresence>
                  {isAuthenticated ? (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                    >
                      <div className="flex justify-between items-center">
                        <strong className="font-bold">
                          {user.name || user.company?.name}
                        </strong>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative"
                    >
                      <div className="flex justify-between items-center">
                        <strong className="font-bold">Welcome to S I N D H!</strong>
                        <button
                          onClick={() => navigate('/login')}
                          className="text-sm text-blue-700 hover:text-blue-900 underline"
                        >
                          Login / Register
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">S I N D H</span>{' '}
                  <span className="block text-blue-600 xl:inline">Empowering Rural Workforce</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Connect with employers and find daily wage work opportunities in your area. Building a stronger rural economy, one job at a time.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start space-x-4">
                  {!isAuthenticated && (
                    <>
                      
                      <div className="rounded-md shadow">
                        <button
                          onClick={handleFindWork}
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                        >
                          Find Work
                        </button>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <button
                          onClick={handlePostJob}
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                        >
                          Post Job
                        </button>
                      </div>
                    </>
                  )}

                  {isAuthenticated && (
                    <>
                      <div className="rounded-md shadow">
                        <button
                          onClick={handleFindWork}
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                        >
                          {user?.type === 'worker' ? 'Find Jobs' : 'Find Work'}
                        </button>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-3">
                        <button
                          onClick={handlePostJob}
                          className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                        >
                          {user?.type === 'employer' ? 'Post Job' : 'Hire Workers'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Shakti Score Section (for workers) */}
      {user?.type === 'worker' && shaktiScore !== null && (
        <div className="py-12 bg-gradient-to-r from-purple-500 to-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Your Shakti Score
              </h2>
              <div className="mt-8 flex justify-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="bg-white rounded-full p-8 shadow-xl transform hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-6xl font-bold text-purple-600">{shaktiScore}</div>
                  <p className="mt-2 text-gray-600">Your Trust Score</p>
                </motion.div>
              </div>
              <p className="mt-4 text-xl text-white">
                Higher score means better job opportunities!
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white">Job Priority</h3>
                  <p className="text-white/80">Get priority access to new job postings</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white">Trust Badge</h3>
                  <p className="text-white/80">Earn employer trust with your score</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white">Better Pay</h3>
                  <p className="text-white/80">Access to higher-paying opportunities</p>
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
              <span>🧑‍🌾</span> GrameenLink
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto my-4"></div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              Digital Identity for India's Working Hands
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-green-100"
            >
              <div className="text-green-600 mb-4 text-3xl">🎤</div>
              <h3 className="text-xl font-semibold mb-2">Voice-First Resumes</h3>
              <p className="text-gray-600">Record your skills in local dialects, making it accessible to everyone regardless of literacy.</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-green-100"
            >
              <div className="text-green-600 mb-4 text-3xl">🏷️</div>
              <h3 className="text-xl font-semibold mb-2">Skill Tagging</h3>
              <p className="text-gray-600">Simple skill identification without the need for formal education or documentation.</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-green-100"
            >
              <div className="text-green-600 mb-4 text-3xl">✅</div>
              <h3 className="text-xl font-semibold mb-2">Local Verification</h3>
              <p className="text-gray-600">Verified by trusted Panchayats and Self-Help Groups in your community.</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-green-100"
            >
              <div className="text-green-600 mb-4 text-3xl">🌟</div>
              <h3 className="text-xl font-semibold mb-2">Local Pride</h3>
              <p className="text-gray-600">Celebrate and showcase your local skills and traditional knowledge.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ShramSaathi Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <span>📢</span> ShramSaathi
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto my-4"></div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
              Local Work, Locally Found
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100"
            >
              <div className="text-blue-600 mb-4 text-3xl">🏘️</div>
              <h3 className="text-xl font-semibold mb-2">Hyperlocal Matching</h3>
              <p className="text-gray-600">Find work opportunities right in your village or block, no need to travel far.</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100"
            >
              <div className="text-blue-600 mb-4 text-3xl">🤝</div>
              <h3 className="text-xl font-semibold mb-2">Direct Connection</h3>
              <p className="text-gray-600">Connect directly with employers, eliminating the need for middlemen.</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100"
            >
              <div className="text-blue-600 mb-4 text-3xl">💼</div>
              <h3 className="text-xl font-semibold mb-2">Local Hiring</h3>
              <p className="text-gray-600">Employers can easily find and hire workers from their own community.</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-lg shadow-sm border border-blue-100"
            >
              <div className="text-blue-600 mb-4 text-3xl">🌱</div>
              <h3 className="text-xl font-semibold mb-2">Community Growth</h3>
              <p className="text-gray-600">Strengthen your local economy by keeping work within the community.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recent Jobs Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {translate('Recent Job Opportunities')}
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {translate('Check out the latest job postings in your area')}
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
                    <p className="mt-1 text-sm text-gray-500">{job.company}</p>
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {job.location}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ₹{job.salary}
                      </span>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          navigate(`/jobs/${job._id}`);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="mt-10 text-center">
              <p className="text-gray-500">No recent jobs available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;