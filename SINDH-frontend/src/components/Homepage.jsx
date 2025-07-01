import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { getCurrentUser, getUserType } from '../utils/authUtils';
import { Phone, MapPin, Star, Users, Briefcase, TrendingUp } from 'lucide-react';

function Homepage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shaktiScore, setShaktiScore] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 1250,
    activeWorkers: 3400,
    successfulMatches: 890,
    averageRating: 4.6
  });

  // Get user from context and fallback to localStorage if needed
  const { user: contextUser, isLoadingUser, logoutUser } = useUser();
  const user = contextUser || getCurrentUser();

  useEffect(() => {
    // Show welcome toast if coming from login
    if (location.state?.showWelcome && user) {
      toast.success(`${t('home.welcomeBack')}, ${user.name}!`);
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
                  {user?.type === 'worker' && shaktiScore !== null && (
                    <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('home.shaktiScore')}: {shaktiScore}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/${user.type}/profile`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('home.viewProfile')}
              </button>
            </div>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Interactive Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-10 pb-16 md:pt-16 md:pb-20 lg:pt-20 lg:pb-28">
            <div className="text-center">
              <AnimatePresence>
                {isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="font-semibold">
                        {t('home.welcomeBack')}, {user.name || user.company?.name}!
                      </span>
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

              {/* Main Title with Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4">
                  <span className="bg-gradient-to-r from-orange-600 to-orange-600 bg-clip-text text-transparent">
                    
                    I N D U S
                  </span>
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
                  {t('home.tagline')}
                </h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  {t('home.description')}
                </p>
              </motion.div>

              {/* Interactive Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Briefcase className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalJobs.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{t('stats.activeJobs')}</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.activeWorkers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{t('stats.activeWorkers')}</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                >
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.successfulMatches.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">{t('stats.successfulMatches')}</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.averageRating}</div>
                  <div className="text-sm text-gray-600">{t('stats.averageRating')}</div>
                </motion.div>
              </motion.div>

              {/* Large Interactive Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-2xl mx-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFindWork}
                  className="group relative w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-xl font-bold text-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-3">
                    <Briefcase className="w-6 h-6" />
                    <span>{user?.type === 'worker' ? t('home.findJobs') : t('home.findWork')}</span>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" }}
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
                  className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 max-w-md mx-auto"
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

      {/* Shakti Score Section (for workers) */}
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