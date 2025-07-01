import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, MapPin, Calendar, Clock, Users, IndianRupee, 
  RefreshCw, Plus, Bell, Building2, Wheat,
  ShoppingBag, Eye, CheckCircle2, Loader2,
  FileText, Timer, UserCheck, Star, ArrowRight, User, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const PostedJobs = () => {
  const [postedJobs, setPostedJobs] = useState([]);
  const [jobApplications, setJobApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState(new Set());
  const [newApplications, setNewApplications] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  // Get employer ID from localStorage
  const getEmployerId = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user.id || user._id;
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return null;
  }, []);

  // Mock navigation function
  const navigate = useCallback((path) => {
    console.log('Navigate to:', path);
    // In real app, this would use react-router-dom
  }, []);

  // Mock user context - get from localStorage
  const getCurrentUser = useCallback(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : { id: '123', type: 'employer' };
    } catch (e) {
      return { id: '123', type: 'employer' };
    }
  }, []);

  const user = getCurrentUser();

  // Toast notification helper
  const showToastNotification = useCallback((message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // Category icons mapping
  const categoryIcons = {
    'Construction': Building2,
    'Agriculture': Wheat,
    'Retail': ShoppingBag,
    'default': Briefcase
  };

  // Status configurations
  const statusConfig = {
    'active': { 
      color: 'emerald', 
      bgColor: 'bg-emerald-500', 
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      icon: CheckCircle2 
    },
    'in-progress': { 
      color: 'blue', 
      bgColor: 'bg-blue-500', 
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: Timer 
    },
    'completed': { 
      color: 'purple', 
      bgColor: 'bg-purple-500', 
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      icon: UserCheck 
    }
  };

  // FIX: Remove circular dependency by memoizing the fetch function properly
  const fetchPostedJobs = useCallback(async () => {
    try {
      const employerId = getEmployerId();
      
      if (!employerId) {
        console.error('No employer ID found');
        toast.error('Please log in as an employer');
        setLoading(false);
        return;
      }
      
      console.log('Fetching posted jobs for employer ID:', employerId);
      
      // Fetch jobs from API
      const response = await fetch(`http://localhost:5000/api/jobs/employer/${employerId}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'employer',
          'User-ID': employerId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }
      
      const jobsData = await response.json();
      console.log('Fetched jobs data:', jobsData);
      
      // Ensure jobsData is an array
      const jobs = Array.isArray(jobsData) ? jobsData : [];
      
      // Fetch applications for each job
      const applicationsPromises = jobs.map(async (job) => {
        try {
          const appResponse = await fetch(`http://localhost:5000/api/job-applications/job/${job._id}`, {
            headers: {
              'Content-Type': 'application/json',
              'User-Type': 'employer',
              'User-ID': employerId
            }
          });
          
          if (appResponse.ok) {
            const appData = await appResponse.json();
            const applications = appData.data || appData || [];
            return { jobId: job._id, applications: Array.isArray(applications) ? applications : [] };
          }
          return { jobId: job._id, applications: [] };
        } catch (err) {
          console.error(`Error fetching applications for job ${job._id}:`, err);
          return { jobId: job._id, applications: [] };
        }
      });
      
      const applicationsResults = await Promise.all(applicationsPromises);
      const applicationsMap = {};
      
      applicationsResults.forEach(({ jobId, applications }) => {
        applicationsMap[jobId] = applications;
      });
      
      // FIX: Only update state if data has actually changed
      setPostedJobs(prevJobs => {
        if (JSON.stringify(prevJobs) !== JSON.stringify(jobs)) {
          return jobs;
        }
        return prevJobs;
      });
      
      setJobApplications(prevApps => {
        if (JSON.stringify(prevApps) !== JSON.stringify(applicationsMap)) {
          return applicationsMap;
        }
        return prevApps;
      });
      
      setLastRefreshed(new Date());
      
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
      toast.error('Failed to load your posted jobs');
      setPostedJobs([]);
      setJobApplications({});
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getEmployerId]); // Remove dependencies that cause circular updates

  // FIX: Initial load with proper dependency array
  useEffect(() => {
    fetchPostedJobs();
  }, []); // Empty dependency array for initial load only

  // FIX: Simplified polling with cleanup
  useEffect(() => {
    if (!user || user.type !== 'employer') {
      console.log('User is not an employer, skipping polling');
      return;
    }

    // Only start polling after initial load is complete
    if (loading) {
      return;
    }

    const timer = setInterval(() => {
      if (!isRefreshing) {
        console.log('Polling for job updates...');
        fetchPostedJobs();
      }
    }, 30000); // Increased interval to 30 seconds to reduce load
    
    return () => {
      clearInterval(timer);
    };
  }, [loading, isRefreshing, user]); // Removed fetchPostedJobs from dependencies

  const handlePostJob = useCallback(() => {
    navigate('/employer/post-job');
  }, [navigate]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPostedJobs();
    showToastNotification('Refreshing job listings...', 'info');
  }, [fetchPostedJobs, showToastNotification]);

  // FIX: Memoize the job details modal to prevent re-renders
  const JobDetailsModal = useCallback(({ job, applications, isOpen, onClose }) => {
    if (!isOpen || !job) return null;

    const handleModalClick = (e) => {
      e.stopPropagation();
    };

    const handleBackdropClick = (e) => {
      e.stopPropagation();
      onClose();
    };

    const handleCloseClick = (e) => {
      e.stopPropagation();
      onClose();
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={handleModalClick}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
                  <p className="text-blue-100 text-lg">{job.companyName}</p>
                  <div className="flex items-center mt-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-blue-100">{job.location?.city}, {job.location?.state}</span>
                  </div>
                </div>
                <button
                  onClick={handleCloseClick}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Job Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700 text-sm">{job.description || 'No description provided'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">₹{job.salary || 'Negotiable'}</div>
                        <div className="text-sm text-blue-700">Salary</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-green-600">{job.employmentType}</div>
                        <div className="text-sm text-green-700">Type</div>
                      </div>
                    </div>

                    {job.requirements && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                        <p className="text-gray-700 text-sm">{job.requirements}</p>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Job Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="text-gray-900">{job.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Posted:</span>
                          <span className="text-gray-900">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            job.status === 'active' ? 'bg-green-100 text-green-700' :
                            job.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applications */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Applications ({applications?.length || 0})
                    </h3>
                  </div>

                  {applications && applications.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {applications.map((application) => (
                        <motion.div
                          key={application._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {application.workerDetails?.name || application.worker?.name || 'Unknown Worker'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {application.workerDetails?.phone || application.worker?.phone}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Applied: {new Date(application.appliedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              application.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {application.status}
                            </span>
                          </div>

                          {/* Worker Skills */}
                          {application.workerDetails?.skills && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {application.workerDetails.skills.slice(0, 3).map((skill, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {skill}
                                  </span>
                                ))}
                                {application.workerDetails.skills.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{application.workerDetails.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Worker Experience & Rating */}
                          <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                            <span>Experience: {application.workerDetails?.experience || 'Not specified'}</span>
                            {application.workerDetails?.rating > 0 && (
                              <span className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                {application.workerDetails.rating.toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {application.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplicationStatusUpdate(application._id, 'accepted');
                                }}
                                className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplicationStatusUpdate(application._id, 'rejected');
                                }}
                                className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {application.status === 'accepted' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplicationStatusUpdate(application._id, 'in-progress');
                                }}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Start Work
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplicationStatusUpdate(application._id, 'rejected');
                                }}
                                className="px-3 py-2 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {application.status === 'in-progress' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplicationStatusUpdate(application._id, 'completed');
                                }}
                                className="flex-1 px-3 py-2 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                              >
                                Mark Complete
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">No applications yet</p>
                      <p className="text-sm text-gray-400">Applications will appear here when workers apply</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Job ID: #{job._id?.substring(0, 8) || 'N/A'}
                </div>
                <button
                  onClick={handleCloseClick}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }, []);

  // FIX: Simplified job card render function
  const renderJobCard = useCallback((job) => {
    const applications = jobApplications[job._id] || [];
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
    const daysActive = Math.ceil((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
    
    // Define missing variables
    const isRecentlyUpdated = recentlyUpdated.has(job._id);
    const newAppCount = newApplications[job._id] || 0;
    
    const statusInfo = statusConfig[job.status] || statusConfig['active'];
    const CategoryIcon = categoryIcons[job.category] || categoryIcons['default'];
    const StatusIcon = statusInfo.icon;
    
    const handleViewDetailsClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('Opening job details for:', job.title);
      setSelectedJob(job);
      setShowJobModal(true);
    };

    const handleApplicationsClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('Opening applications for:', job.title);
      setSelectedJob(job);
      setShowJobModal(true);
    };

    return (
      <motion.div 
        key={job._id} 
        className={`bg-white rounded-2xl shadow-lg overflow-hidden relative group
          ${isRecentlyUpdated ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
          hover:shadow-2xl transition-all duration-300 cursor-default`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isRecentlyUpdated ? [1, 1.02, 1] : 1
        }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {/* Gradient Header */}
        <div className={`h-2 bg-gradient-to-r ${
          job.status === 'active' ? 'from-emerald-400 to-green-500' : 
          job.status === 'in-progress' ? 'from-blue-400 to-indigo-500' : 
          job.status === 'completed' ? 'from-purple-400 to-pink-500' : 
          'from-gray-300 to-gray-400'
        }`}></div>
        
        {/* Update Indicator */}
        {isRecentlyUpdated && (
          <motion.div 
            className="absolute top-4 right-4 z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          </motion.div>
        )}
        
        <div className="p-6">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl ${statusInfo.lightBg} ${statusInfo.textColor}`}>
                <CategoryIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-sm text-gray-600 font-medium">{job.companyName}</p>
              </div>
            </div>
          </div>
          
          {/* Salary Badge */}
          <div className="inline-flex items-center bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full mb-4">
            <IndianRupee className="w-4 h-4 text-green-700 mr-1" />
            <span className="font-bold text-green-800">₹{job.salary?.toLocaleString('en-IN')}</span>
            <span className="text-green-600 text-sm ml-1">/{job.duration || 'month'}</span>
          </div>
          
          {/* Application Statistics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-600">{totalApplications}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-yellow-600">{pendingApplications}</div>
              <div className="text-xs text-yellow-700">Pending</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-green-600">{acceptedApplications}</div>
              <div className="text-xs text-green-700">Accepted</div>
            </div>
          </div>

          {/* Recent Applicants Preview */}
          {applications.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Applicants:</h4>
              <div className="space-y-2">
                {applications.slice(0, 3).map((application) => (
                  <div key={application._id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {application.workerDetails?.name || 'Unknown Worker'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Applied {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      application.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {application.status}
                    </span>
                  </div>
                ))}
                {applications.length > 3 && (
                  <button
                    onClick={handleApplicationsClick}
                    className="w-full text-center py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-sm rounded-lg transition-colors"
                  >
                    View all {applications.length} applications
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Job Details Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{job.location?.city}, {job.location?.state}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{new Date(job.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{daysActive} {daysActive === 1 ? 'day' : 'days'} ago</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              <span className={newAppCount > 0 ? 'font-medium text-gray-900' : ''}>
                {totalApplications} applicants
              </span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.lightBg} ${statusInfo.textColor} ${statusInfo.borderColor} border`}>
              <StatusIcon className="w-4 h-4 mr-1.5" />
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </div>
            
            {newAppCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
              >
                <Bell className="w-3 h-3 mr-1" />
                +{newAppCount} New
              </motion.div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <motion.button
              onClick={handleViewDetailsClick}
              className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all duration-200 flex items-center justify-center group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              View Details
            </motion.button>
            <motion.button
              onClick={handleApplicationsClick}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center relative group ${
                totalApplications > 0
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700' 
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Applications
              {newAppCount > 0 && (
                <motion.span 
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {newAppCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }, [jobApplications, recentlyUpdated, newApplications, statusConfig, categoryIcons]);

  // FIX: Enhanced handleApplicationStatusUpdate with better error handling
  const handleApplicationStatusUpdate = useCallback(async (applicationId, newStatus) => {
    try {
      console.log('Updating application status:', { applicationId, newStatus });
      
      const employerId = getEmployerId();
      if (!employerId) {
        toast.error('Please log in as an employer');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/job-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'employer',
          'User-ID': employerId
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update application: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Application status updated successfully:', responseData);
      
      toast.success(`Application ${newStatus} successfully`);
      
      // Refresh applications after a delay
      setTimeout(() => {
        fetchPostedJobs();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error(error.message || 'Failed to update application status');
    }
  }, [getEmployerId, fetchPostedJobs]);

  // Filter jobs based on selected filter
  const filteredJobs = postedJobs.filter(job => {
    if (selectedFilter === 'all') return true;
    return job.status === selectedFilter;
  });

  // Calculate stats with real data
  const stats = {
    total: postedJobs.length,
    active: postedJobs.filter(j => j.status === 'active').length,
    inProgress: postedJobs.filter(j => j.status === 'in-progress').length,
    completed: postedJobs.filter(j => j.status === 'completed').length,
    totalApplications: Object.values(jobApplications).reduce((sum, apps) => sum + apps.length, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Custom Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
              toastType === 'error' ? 'bg-red-500 text-white' : 
              toastType === 'success' ? 'bg-green-500 text-white' : 
              'bg-blue-500 text-white'
            }`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 50 }}
            className="fixed top-20 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm"
          >
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-3 animate-bounce" />
              <span className="font-medium">{notificationMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Posted Jobs</h1>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Last updated: {lastRefreshed ? lastRefreshed.toLocaleTimeString('en-IN') : 'Never'}
                  </span>
                  {loading && (
                    <span className="flex items-center text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      <span className="animate-pulse">Updating...</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <motion.button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </motion.button>
                <motion.button 
                  onClick={handlePostJob}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center font-medium shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Briefcase className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Active</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.active}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{stats.inProgress}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Timer className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Completed</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{stats.completed}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Applicants</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">{stats.totalApplications}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {['all', 'active', 'in-progress', 'completed'].map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedFilter === filter
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {filter === 'all' ? 'All Jobs' : filter.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
                {filter !== 'all' && (
                  <span className="ml-2 text-sm opacity-80">
                    ({stats[filter === 'in-progress' ? 'inProgress' : filter]})
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Jobs Grid */}
          {loading && postedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading your posted jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <div className="flex flex-col items-center">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-6">
                  <FileText className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {postedJobs.length === 0 ? 'No Jobs Posted Yet' : 'No Jobs Found'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {postedJobs.length === 0 
                    ? 'Start by posting your first job requirement' 
                    : `No ${selectedFilter.replace('-', ' ')} jobs found`}
                </p>
                <motion.button
                  onClick={postedJobs.length === 0 ? handlePostJob : () => setSelectedFilter('all')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {postedJobs.length === 0 ? (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Post Your First Job
                    </>
                  ) : (
                    <>
                      View All Jobs
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {renderJobCard(job)}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal 
        job={selectedJob} 
        applications={selectedJob ? jobApplications[selectedJob._id] || [] : []}
        isOpen={showJobModal} 
        onClose={() => {
          console.log('Closing job modal');
          setShowJobModal(false);
          setSelectedJob(null);
        }} 
      />
    </div>
  );
};

export default PostedJobs;