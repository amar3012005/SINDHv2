import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MapPin, 
  DollarSign, 
  Users, 
  Eye,
  RefreshCw,
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  Award,
  ArrowLeft,
  Menu,
  Building
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useTranslation } from 'react-i18next';
import 'swiper/css';

const PostedJobs = () => {
  const { t, i18n } = useTranslation();
  
  // State management
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJobApplications, setSelectedJobApplications] = useState(null);
  const [showPageMenu, setShowPageMenu] = useState(false);

  // Language controls
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('homeLang');
    if (stored === 'HI' || stored === 'EN') return stored;
    return (i18n.language && i18n.language.toLowerCase() === 'hi') ? 'HI' : 'EN';
  });
  const isHindi = lang === 'HI';

  const toggleLang = () => {
    const next = isHindi ? 'EN' : 'HI';
    setLang(next);
    localStorage.setItem('homeLang', next);
    i18n.changeLanguage(next.toLowerCase());
  };

  // API URL function
  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_API_URL || 'https://sindh-backend.onrender.com/api';
    }
    return 'http://localhost:10000/api';
  };

  // Optimized job statistics calculation with memoization
  const jobStatsWithApplications = useMemo(() => {
    if (!jobs.length) return { jobs: [], stats: { total: 0, active: 0, completed: 0, pending: 0 } };

    const jobsWithStats = jobs.map(job => {
      const jobApplications = applications[job._id] || [];
      
      // Pre-calculate all stats for this job to avoid repeated calculations
      const stats = {
        applications: jobApplications,
        totalApplications: jobApplications.length,
        pendingApplications: jobApplications.filter(app => app.status === 'pending').length,
        acceptedApplications: jobApplications.filter(app => app.status === 'accepted').length,
        inProgressApplications: jobApplications.filter(app => app.status === 'in-progress').length,
        completedApplications: jobApplications.filter(app => app.status === 'completed').length,
        unpaidApplications: jobApplications.filter(app => app.status === 'completed' && !app.paid).length
      };

      // Calculate progress percentage based on stage
      let progressPercentage = 0;
      if (stats.completedApplications > 0) {
        progressPercentage = 100;
      } else if (stats.inProgressApplications > 0) {
        progressPercentage = 75;
      } else if (stats.acceptedApplications > 0) {
        progressPercentage = 50;
      } else if (stats.pendingApplications > 0) {
        progressPercentage = 25;
      }

      // Create non-zero stats array for rendering
      const nonZeroStats = [
        { status: 'pending', count: stats.pendingApplications, color: 'yellow-400', label: 'Pending' },
        { status: 'accepted', count: stats.acceptedApplications, color: 'green-400', label: 'Accepted' },
        { status: 'in-progress', count: stats.inProgressApplications, color: 'blue-400', label: 'Active' },
        { status: 'completed', count: stats.completedApplications, color: 'purple-400', label: 'Done' }
      ].filter(stat => stat.count > 0);

      return {
        ...job,
        stats: {
          ...stats,
          progressPercentage,
          nonZeroStats
        }
      };
    });

    const overallStats = {
      total: jobs.length,
      active: jobs.filter(job => ['active', 'in-progress'].includes(job.status)).length,
      completed: jobs.filter(job => job.status === 'completed').length,
      pending: jobs.filter(job => job.status === 'pending').length
    };

    return { jobs: jobsWithStats, stats: overallStats };
  }, [jobs, applications]);

  // Optimized data fetching
  const fetchJobsAndApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id || user.type !== 'employer') {
        throw new Error('Authentication required');
      }

      // Fetch jobs
      const jobsResponse = await fetch(`${getApiUrl()}/jobs/employer/${user.id}`);
      if (!jobsResponse.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const jobsData = await jobsResponse.json();
      setJobs(jobsData);

      // Fetch applications in parallel for better performance
      if (jobsData.length > 0) {
        const applicationPromises = jobsData.map(job => 
          fetch(`${getApiUrl()}/applications/job/${job._id}`)
            .then(res => res.ok ? res.json() : [])
            .then(apps => ({ jobId: job._id, applications: apps }))
            .catch(() => ({ jobId: job._id, applications: [] }))
        );

        const applicationResults = await Promise.all(applicationPromises);
        const applicationsMap = {};
        applicationResults.forEach(({ jobId, applications: apps }) => {
          applicationsMap[jobId] = apps;
        });
        setApplications(applicationsMap);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount and handle success message from URL
  useEffect(() => {
    fetchJobsAndApplications();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchJobsAndApplications]);

  // Refresh functionality
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobsAndApplications();
    setRefreshing(false);
  }, [fetchJobsAndApplications]);

  // Memoized job card component for optimal performance
  const JobCard = React.memo(({ job }) => {
    const stats = job.stats;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 text-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 mx-1 backdrop-blur-md"
      >
        {/* Status Banner */}
        <div className="px-4 py-2 bg-white/10 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="ml-2 text-sm font-medium text-white/90">
                {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-white/70">
                {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {stats.unpaidApplications > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  Payment Due
                </span>
              )}
            </div>
          </div>
          
          {/* Color indicators */}
          <div className="mt-3 flex items-center justify-center gap-4 px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"></div>
              <span className="text-xs text-white/60">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-green-500"></div>
              <span className="text-xs text-white/60">Accepted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
              <span className="text-xs text-white/60">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-violet-500"></div>
              <span className="text-xs text-white/60">Done</span>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="p-6">
          {/* Salary */}
          <div className="mb-4">
            <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
              ₹{job.salary?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-white/60">{job.employmentType}</div>
          </div>

          {/* Title and Company */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
              {job.title}
            </h3>
            <div className="flex items-center text-white/70 text-sm mb-2">
              <Building className="w-4 h-4 mr-2" />
              <span>{job.companyName || 'Company'}</span>
            </div>
            <div className="flex items-center text-white/70 text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{job.location?.city}, {job.location?.state}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/80">Progress</span>
              <span className="text-white/60">{stats.progressPercentage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              {stats.progressPercentage > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full"
                />
              )}
            </div>
          </div>

          {/* Application Stats */}
          {stats.nonZeroStats.length > 0 && (
            <div className="flex gap-3 text-xs justify-center mb-4">
              {stats.nonZeroStats.map(stat => (
                <div key={stat.status} className="flex items-center">
                  <div className={`w-2 h-2 bg-${stat.color} rounded-full mr-1.5`}></div>
                  <span className="text-white/70">{stat.count} {stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Payment Status */}
          {stats.completedApplications > 0 && (
            <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-white/90">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Payment Status</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/70">
                    {stats.unpaidApplications > 0 ? 'Payments Pending' : 'All Paid'}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {stats.unpaidApplications} pending
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={() => handleViewApplications(job)}
              className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-medium shadow-lg hover:shadow-xl"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage ({stats.totalApplications})
            </button>
            
            <button
              onClick={() => window.location.href = `/job/${job._id}`}
              className="flex items-center justify-center px-3 py-2.5 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/15 transition-all text-sm"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  });

  const handleViewApplications = useCallback((job) => {
    setSelectedJobApplications({
      job,
      applications: applications[job._id] || []
    });
    setShowApplicationsModal(true);
  }, [applications]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
        </div>
        <div className="text-center relative z-10">
          <RefreshCw className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Loading your posted jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
        <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
        <div className="aurora absolute inset-0">
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-30">
        <button 
          onClick={toggleLang} 
          className="px-2.5 py-1 rounded-full text-sm bg-white/10 border border-white/15 text-white/90 hover:bg-white/15"
        >
          {isHindi ? 'HI' : 'EN'}
        </button>
        <button 
          onClick={() => setShowPageMenu(v => !v)} 
          className="p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-12 pb-8">
        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-green-400/30 rounded-lg p-4 mb-6 text-green-200"
          >
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <p>Job posted successfully! Your job is now live and visible to workers.</p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">
              My Posted Jobs
            </h1>
            <p className="text-xl text-white/70">
              Manage your job postings and track applications
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`w-11 h-11 rounded-full transition-all duration-300 flex items-center justify-center ${
                refreshing 
                  ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 cursor-not-allowed' 
                  : 'bg-gradient-to-br from-slate-600 via-slate-700 to-gray-800 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 hover:scale-105'
              }`}
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => window.location.href = '/employer/post-job'}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white/5 border border-red-400/30 rounded-lg p-4 mb-6 text-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Stats Card */}
        <div className="relative rounded-2xl p-6 mb-8 text-white bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden">
          <div className="absolute -inset-10 opacity-20 blur-3xl bg-gradient-to-br from-blue-300/30 to-purple-300/20 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/70">Total Jobs Posted</div>
                <div className="mt-1 text-3xl font-extrabold tracking-tight">{jobStatsWithApplications.stats.total}</div>
              </div>
              <div className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/15 text-white/80">ACTIVE</div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/80">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Active · </span>
                <span className="text-white">{jobStatsWithApplications.stats.active}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/80">
                <Award className="w-3.5 h-3.5" />
                <span>Completed · </span>
                <span className="text-white">{jobStatsWithApplications.stats.completed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        {jobStatsWithApplications.jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-white mb-2">No Jobs Posted Yet</h3>
            <p className="text-white/70 mb-6">Start by posting your first job to find workers</p>
            <button
              onClick={() => window.location.href = '/employer/post-job'}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="px-2">
            <Swiper
              spaceBetween={12}
              slidesPerView={1.2}
              breakpoints={{
                640: { slidesPerView: 1.5 },
                768: { slidesPerView: 2.2 },
                1024: { slidesPerView: 2.5 },
                1280: { slidesPerView: 3 }
              }}
              className="!overflow-visible"
            >
              {jobStatsWithApplications.jobs.map((job) => (
                <SwiperSlide key={job._id}>
                  <JobCard job={job} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>

      {/* Applications Modal */}
      <AnimatePresence>
        {showApplicationsModal && selectedJobApplications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Applications for {selectedJobApplications.job.title}
                </h3>
                <button
                  onClick={() => setShowApplicationsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {selectedJobApplications.applications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium text-white mb-2">No Applications Yet</h4>
                  <p className="text-white/70">Applications will appear here once workers apply</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedJobApplications.applications.map((application) => (
                    <div key={application._id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{application.worker?.name || 'Worker'}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          application.status === 'completed' ? 'bg-green-100 text-green-800' :
                          application.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm mb-2">{application.message || 'No message provided'}</p>
                      <div className="text-xs text-white/60">
                        Applied: {new Date(application.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Styles */}
      <style jsx global>{`
        .noise-bg {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.2"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/></svg>');
        }
        .aurora-blob {
          position: absolute;
          width: 60vmax;
          height: 60vmax;
          filter: blur(60px);
          opacity: 0.2;
        }
        .aurora-a {
          background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%);
          left: -20vmax;
          top: -10vmax;
          animation: drift 18s ease-in-out infinite;
        }
        .aurora-b {
          background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%);
          right: -25vmax;
          top: -5vmax;
          animation: drift 22s ease-in-out infinite reverse;
        }
        .aurora-c {
          background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%);
          left: 10vmax;
          bottom: -20vmax;
          animation: drift 26s ease-in-out infinite;
        }
        @keyframes drift {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(5vmax, -3vmax, 0) rotate(20deg); }
        }
      `}</style>
    </div>
  );
};

export default PostedJobs;
