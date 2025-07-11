import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MapPin, 
  DollarSign, 
  Users, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUtils.js';

const PostedJobs = () => {
  const { jobId } = useParams?.() || {};
  const location = useLocation?.() || {};
  const [showSuccess, setShowSuccess] = useState(false);
  const jobRefs = useRef({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState(null);
  const [jobApplications, setJobApplications] = useState({});
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJobApplications, setSelectedJobApplications] = useState(null);
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState('all');
  const [loadingApplications, setLoadingApplications] = useState(false);


  useEffect(() => {
    fetchJobs();
    // Show success message if redirected from chat-based posting
    if (location?.state?.jobPosted || location?.search?.includes('success=1')) {
      setShowSuccess(true);
      // Optionally clear the state after showing
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('🔍 Fetching jobs for employer:', user.id);
      console.log('👤 User data:', { id: user.id, type: user.type, name: user.name });
      
      if (!user.id || user.type !== 'employer') {
        setError('You must be logged in as an employer to view posted jobs');
        return;
      }

      const apiUrl = `${getApiUrl()}/jobs/employer/${user.id}`;
      console.log('🌐 Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        let jobsData = await response.json();
        console.log('📦 Raw jobs data:', jobsData);
        
        jobsData = Array.isArray(jobsData) ? jobsData : [];
        console.log('📋 Processed jobs data:', jobsData);
        console.log('📊 Number of jobs found:', jobsData.length);
        
        // Sort jobs by createdAt descending (latest first)
        jobsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log('📋 Sorted jobs:', jobsData.map(job => ({ id: job._id, title: job.title, createdAt: job.createdAt })));
        
        setJobs(jobsData);
        // Don't fetch applications automatically - only fetch when user requests to view them
        // If jobId is present, scroll to or highlight it after jobs load
        setTimeout(() => {
          if (jobId && jobRefs.current[jobId]) {
            jobRefs.current[jobId].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error.message);
      setJobs([]);
    } finally {
      console.log('🏁 Fetch jobs process finished');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // PERFORMANCE OPTIMIZATION: Applications are now fetched on-demand only when user clicks "View Applications"
  // This prevents unnecessary API calls and improves page load performance

  const handleRefresh = () => {
    console.log('🔄 Refreshing jobs list (without fetching applications)...');
    setRefreshing(true);
    fetchJobs();
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJobs(jobs.filter(job => job._id !== jobId));
        alert('Job deleted successfully');
      } else {
        throw new Error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job: ' + error.message);
    }
  };

  const handlePayWorker = (job, application) => {
    // Set the selected job and application for payment
    setSelectedJobForPayment({ job, application });
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setSelectedJobForPayment(null);
    fetchJobs(); // Refresh to show updated payment status
  };

  const handleViewApplications = async (job) => {
    console.log('🔍 Fetching applications for job:', job.title, job._id);
    
    setLoadingApplications(true);
    
    try {
      // Fetch applications only when user requests to view them
      const response = await fetch(`${getApiUrl()}/job-applications/job/${job._id}`);
      
      if (response.ok) {
        const data = await response.json();
        const applications = data.data || [];
        
        console.log('📋 Applications fetched:', applications.length);
        
        // Update the applications map for this specific job
        setJobApplications(prev => ({
          ...prev,
          [job._id]: applications
        }));
        
        setSelectedJobApplications({ job, applications });
        setShowApplicationsModal(true);
      } else {
        console.error('❌ Failed to fetch applications for job:', job._id);
        setSelectedJobApplications({ job, applications: [] });
        setShowApplicationsModal(true);
      }
    } catch (error) {
      console.error('❌ Error fetching applications for job:', job._id, error);
      setSelectedJobApplications({ job, applications: [] });
      setShowApplicationsModal(true);
    } finally {
      setLoadingApplications(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      console.log('Updating application status:', applicationId, 'to:', newStatus);
      
      const response = await fetch(`${getApiUrl()}/job-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Application status updated successfully:', result);
        
        // Refresh jobs data to show updated status
        fetchJobs();
        
        // Show success message
        alert(`Application ${newStatus} successfully!`);
        
        // If modal is open, close and reopen to refresh data
        if (showApplicationsModal && selectedJobApplications) {
          setShowApplicationsModal(false);
          setTimeout(() => {
            handleViewApplications(selectedJobApplications.job);
          }, 500);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Eye className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'in-progress':
        return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filterStatus === 'all') return true;
    return job.status === filterStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading your posted jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Success Message for new job posting - Mobile Responsive */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
              <p className="text-green-700 font-medium text-sm sm:text-base">Job posted successfully! Your job is now live and visible to workers.</p>
            </div>
          </div>
        )}
        
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
              My Posted Jobs
            </h1>
            <p className="mt-2 sm:mt-3 max-w-2xl text-base sm:text-xl text-gray-500">
              Manage your job postings and track applications
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => window.location.href = '/employer/post-job'}
              className="group relative flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 text-sm sm:text-base touch-manipulation font-medium shadow-lg hover:shadow-xl hover:shadow-blue-200/40 hover:scale-105 active:scale-95 overflow-hidden"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-xl"></div>
              
              {/* Icon with enhanced animations */}
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 relative z-10 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
              
              {/* Text with enhanced styling */}
              <span className="hidden sm:inline relative z-10 transition-all duration-300 group-hover:text-blue-100">
                Post New Job
              </span>
              <span className="sm:hidden relative z-10 transition-all duration-300 group-hover:text-blue-100">
                Post Job
              </span>
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
              
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* Compact Refresh Button - Below Navbar */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`fixed top-20 right-4 z-40 group w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-300 touch-manipulation flex items-center justify-center overflow-hidden ${
            refreshing 
              ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 cursor-not-allowed shadow-lg shadow-blue-300/30' 
              : 'bg-gradient-to-br from-slate-600 via-slate-700 to-gray-800 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg hover:shadow-blue-200/40 hover:scale-105 active:scale-95'
          }`}
          title={refreshing ? 'Refreshing Jobs...' : 'Refresh Jobs'}
        >
          {/* Animated background glow */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-all duration-300 ${refreshing ? 'opacity-25 animate-pulse' : ''}`}></div>
          
          {/* Outer ring effect */}
          <div className={`absolute inset-0 rounded-full border transition-all duration-300 ${
            refreshing 
              ? 'border-blue-300/50 animate-pulse' 
              : 'border-transparent group-hover:border-blue-300/30'
          }`}></div>
          
          {/* Refresh Icon */}
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10 transition-all duration-300 ${
            refreshing 
              ? 'animate-spin' 
              : 'group-hover:rotate-180 group-hover:scale-105'
          }`} />
          
          {/* Ripple effect when refreshing */}
          {refreshing && (
            <>
              <div className="absolute inset-0 rounded-full bg-blue-400/25 animate-ping"></div>
              <div className="absolute inset-1 rounded-full bg-indigo-400/15 animate-ping" style={{ animationDelay: '0.4s' }}></div>
            </>
          )}
          
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-600 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </button>

        {/* Error State - Mobile Responsive */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2" />
              <p className="text-red-600 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs - Mobile Scrollable */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-4 sm:mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { value: 'all', label: 'All Jobs' },
              { value: 'active', label: 'Active' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`flex-1 min-w-0 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap touch-manipulation ${
                  filterStatus === filter.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
                <span className="ml-1">({jobs.filter(job => filter.value === 'all' || job.status === filter.value).length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid - Responsive */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No Jobs Posted Yet' : `No ${filterStatus} Jobs`}
            </h3>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base px-4">
              {filterStatus === 'all' 
                ? 'Start by posting your first job to find workers' 
                : `You don't have any ${filterStatus} jobs at the moment`
              }
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => window.location.href = '/employer/post-job'}
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base touch-manipulation"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredJobs.map((job) => {
                const applications = jobApplications[job._id] || [];
                const completedApplications = applications.filter(app => app.status === 'completed');
                const unpaidApplications = completedApplications.filter(app => app.paymentStatus !== 'paid');
                
                const isNewlyPosted = jobId && job._id === jobId;
                return (
                  <motion.div
                    key={job._id}
                    ref={el => jobRefs.current[job._id] = el}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow duration-300 ${isNewlyPosted ? 'ring-4 ring-green-400 ring-opacity-60' : ''}`}
                  >
                    {/* Status Banner - Mobile Responsive */}
                    <div className={`px-3 sm:px-4 py-2 ${getStatusColor(job.status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(job.status)}
                          <span className="ml-2 text-xs sm:text-sm font-medium">
                            {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs hidden sm:inline">
                            Posted: {formatDate(job.createdAt)}
                          </span>
                          <span className="text-xs sm:hidden">
                            {formatDate(job.createdAt)}
                          </span>
                          {unpaidApplications.length > 0 && (
                            <span className="bg-yellow-500 text-white text-xs px-1 sm:px-2 py-1 rounded-full">
                              <span className="hidden sm:inline">Payment Due</span>
                              <span className="sm:hidden">Pay!</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4">
                      {/* Job Title and Category - Mobile Responsive */}
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {job.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 truncate">{job.category}</p>

                      {/* Job Details - Mobile Grid */}
                      <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400" />
                          <span className="truncate">{job.location?.city}, {job.location?.state}</span>
                        </div>
                        
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400" />
                          <span className="font-medium text-green-600">
                            ₹{job.salary?.toLocaleString() || 'Not specified'}
                          </span>
                        </div>

                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400" />
                          <span>{applications.length} application{applications.length !== 1 ? 's' : ''}</span>
                        </div>

                        {job.startDate && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400" />
                            <span className="truncate">Starts: {formatDate(job.startDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Applications Summary for Active Jobs - Mobile Optimized */}
                      {job.status === 'active' && applications.length > 0 && (
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">
                            Applications Summary
                          </h4>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Pending:</span>
                              <span className="font-medium">
                                {applications.filter(app => app.status === 'pending').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Accepted:</span>
                              <span className="font-medium">
                                {applications.filter(app => app.status === 'accepted').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">In Progress:</span>
                              <span className="font-medium">
                                {applications.filter(app => app.status === 'in-progress').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Completed:</span>
                              <span className="font-medium">
                                {applications.filter(app => app.status === 'completed').length}
                              </span>
                            </div>
                          </div>
                          {applications.filter(app => app.status === 'pending').length > 0 && (
                            <div className="mt-2 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                              ⏳ {applications.filter(app => app.status === 'pending').length} application{applications.filter(app => app.status === 'pending').length !== 1 ? 's' : ''} waiting for your response
                            </div>
                          )}
                        </div>
                      )}

                      {/* In-Progress Work Status - Mobile Responsive */}
                      {job.status === 'in-progress' && applications.length > 0 && (
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">
                            Work in Progress
                          </h4>
                          {applications.filter(app => app.status === 'in-progress').map((application) => (
                            <div key={application._id} className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-blue-700 truncate flex-1 mr-2">
                                {application.worker?.name || application.workerDetails?.name}
                              </span>
                              <button
                                onClick={() => updateApplicationStatus(application._id, 'completed')}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 touch-manipulation whitespace-nowrap"
                              >
                                <span className="hidden sm:inline">Mark Complete</span>
                                <span className="sm:hidden">✓</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Payment Status for Completed Jobs - Mobile Optimized */}
                      {completedApplications.length > 0 && (
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">
                            Completed Applications ({completedApplications.length})
                          </h4>
                          <div className="space-y-2">
                            {completedApplications.map((application) => (
                              <div key={application._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs sm:text-sm font-medium block truncate">
                                    {application.worker?.name || application.workerDetails?.name}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    Completed: {formatDate(application.jobCompletedDate || application.updatedAt)}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                    application.paymentStatus === 'paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {application.paymentStatus === 'paid' ? 'Paid' : 'Payment Due'}
                                  </span>
                                  {application.paymentStatus !== 'paid' && (
                                    <button
                                      onClick={() => handlePayWorker(job, application)}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 sm:px-3 py-1 rounded-lg transition-colors touch-manipulation whitespace-nowrap"
                                    >
                                      <span className="hidden sm:inline">Pay Now</span>
                                      <span className="sm:hidden">Pay</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Actions for Active Jobs - Mobile Responsive */}
                      {job.status === 'active' && applications.length > 0 && (
                        <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
                          {applications.map((application) => (
                            <div key={application._id} className="border border-gray-200 rounded-lg p-2 sm:p-3 bg-gray-50">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs sm:text-sm font-medium text-gray-900 block truncate">
                                      {application.worker?.name || application.workerDetails?.name}
                                    </span>
                                    <div className="text-xs text-gray-500 truncate">
                                      {application.worker?.phone || application.workerDetails?.phone}
                                    </div>
                                  </div>
                                </div>
                                
                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  application.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  application.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                                </span>
                              </div>

                              {/* Application Actions - Mobile Responsive */}
                              <div className="flex space-x-1 sm:space-x-2">
                                {application.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateApplicationStatus(application._id, 'accepted');
                                      }}
                                      className="flex-1 px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors touch-manipulation"
                                    >
                                      <span className="hidden sm:inline">Accept</span>
                                      <span className="sm:hidden">✓</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateApplicationStatus(application._id, 'rejected');
                                      }}
                                      className="flex-1 px-2 sm:px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors touch-manipulation"
                                    >
                                      <span className="hidden sm:inline">Reject</span>
                                      <span className="sm:hidden">✗</span>
                                    </button>
                                  </>
                                )}

                                {application.status === 'accepted' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateApplicationStatus(application._id, 'in-progress');
                                    }}
                                    className="flex-1 px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors touch-manipulation"
                                  >
                                    <span className="hidden sm:inline">Start Work</span>
                                    <span className="sm:hidden">Start</span>
                                  </button>
                                )}

                                {application.status === 'in-progress' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateApplicationStatus(application._id, 'completed');
                                    }}
                                    className="flex-1 px-2 sm:px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors touch-manipulation"
                                  >
                                    <span className="hidden sm:inline">Mark Complete</span>
                                    <span className="sm:hidden">Done</span>
                                  </button>
                                )}

                                {application.status === 'completed' && application.paymentStatus !== 'paid' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePayWorker(job, application);
                                    }}
                                    className="flex-1 px-2 sm:px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors touch-manipulation"
                                  >
                                    <span className="hidden sm:inline">Pay ₹{application.paymentAmount || job.salary}</span>
                                    <span className="sm:hidden">Pay</span>
                                  </button>
                                )}

                                {application.status === 'completed' && application.paymentStatus === 'paid' && (
                                  <div className="flex-1 px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded text-xs text-center">
                                    ✅ <span className="hidden sm:inline">Paid</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Description - Mobile Responsive */}
                      {job.description && (
                        <div className="mb-3 sm:mb-4">
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                            {job.description}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons - Mobile Responsive */}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => window.location.href = `/job/${job._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => window.location.href = `/employer/edit-job/${job._id}`}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors touch-manipulation"
                            title="Edit Job"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          {applications.length === 0 ? (
                            <span className="text-xs text-gray-500 hidden sm:inline">No applications yet</span>
                          ) : (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                              {applications.length}
                              <span className="hidden sm:inline"> applicant{applications.length !== 1 ? 's' : ''}</span>
                            </span>
                          )}
                          
                          <button
                            onClick={() => handleDeleteJob(job._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                            title="Delete Job"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Applications Modal - Enhanced with Mobile Responsiveness */}
        <AnimatePresence>
          {showApplicationsModal && selectedJobApplications && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
              >
                <div className="p-4 sm:p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2">
                        Manage Applications: {selectedJobApplications.job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                        <span>📍 {selectedJobApplications.job.location?.city}, {selectedJobApplications.job.location?.state}</span>
                        <span>💰 ₹{selectedJobApplications.job.salary?.toLocaleString()}</span>
                        <span>👥 {selectedJobApplications.applications.length} applications</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowApplicationsModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  
                  {/* Application Status Summary - Mobile Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    {[
                      { status: 'pending', label: 'Pending', color: 'yellow' },
                      { status: 'accepted', label: 'Accepted', color: 'green' },
                      { status: 'in-progress', label: 'In Progress', color: 'blue' },
                      { status: 'completed', label: 'Completed', color: 'purple' }
                    ].map(({ status, label, color }) => {
                      const count = selectedJobApplications.applications.filter(app => app.status === status).length;
                      return (
                        <div key={status} className={`text-center p-2 sm:p-3 bg-${color}-50 rounded-lg`}>
                          <div className={`text-lg sm:text-2xl font-bold text-${color}-600`}>{count}</div>
                          <div className={`text-xs sm:text-sm text-${color}-800`}>
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sm:hidden">{label.split(' ')[0]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Application Status Tabs - Mobile Scrollable */}
                  <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                    {['all', 'pending', 'accepted', 'in-progress', 'completed'].map((status) => {
                      const count = status === 'all' 
                        ? selectedJobApplications.applications.length
                        : selectedJobApplications.applications.filter(app => app.status === status).length;
                      
                      return (
                        <button
                          key={status}
                          onClick={() => setSelectedApplicationStatus(status)}
                          className={`flex-1 min-w-0 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap touch-manipulation ${
                            selectedApplicationStatus === status
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <span className="hidden sm:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                          <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
                          <span className="ml-1">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                  {(() => {
                    const filteredApplications = selectedApplicationStatus === 'all' 
                      ? selectedJobApplications.applications
                      : selectedJobApplications.applications.filter(app => app.status === selectedApplicationStatus);
                    
                    if (filteredApplications.length === 0) {
                      return (
                        <div className="text-center py-6 sm:py-8">
                          <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                            No {selectedApplicationStatus === 'all' ? '' : selectedApplicationStatus} applications
                          </h4>
                          <p className="text-gray-500 text-sm sm:text-base">
                            {selectedApplicationStatus === 'all' 
                              ? 'Workers haven\'t applied for this job yet.'
                              : `No applications in ${selectedApplicationStatus} status.`
                            }
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                        {filteredApplications.map((application) => (
                          <motion.div
                            key={application._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                          >
                            {/* Application Header - Mobile Responsive */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                                  {(application.worker?.name || application.workerDetails?.name)?.charAt(0) || 'W'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                    {application.worker?.name || application.workerDetails?.name}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                                    📞 {application.worker?.phone || application.workerDetails?.phone}
                                  </p>
                                </div>
                              </div>
                              
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                application.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                application.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                <span className="hidden sm:inline">{application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}</span>
                                <span className="sm:hidden">{application.status?.charAt(0).toUpperCase()}</span>
                              </span>
                            </div>

                            {/* Worker Details Grid - Mobile Responsive */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm">
                              <div>
                                <span className="text-gray-500">Skills:</span>
                                <p className="font-medium text-xs line-clamp-2">
                                  {(application.worker?.skills || application.workerDetails?.skills || []).join(', ') || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Experience:</span>
                                <p className="font-medium text-xs truncate">
                                  {application.worker?.experience || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Applied:</span>
                                <p className="font-medium text-xs">
                                  {new Date(application.applicationDetails?.appliedAt || application.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Rating:</span>
                                <p className="font-medium text-xs">
                                  ⭐ {application.worker?.rating?.average || application.workerDetails?.rating || 0}/5
                                </p>
                              </div>
                            </div>

                            {/* Payment Info for Completed Jobs - Mobile Responsive */}
                            {application.status === 'completed' && (
                              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-xs sm:text-sm text-gray-500">Payment Status:</span>
                                    <p className={`font-medium text-sm sm:text-base ${
                                      application.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                      {application.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs sm:text-sm text-gray-500">Amount:</span>
                                    <p className="font-bold text-base sm:text-lg">₹{application.paymentAmount || selectedJobApplications.job.salary}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Quick Action Buttons - Mobile Responsive */}
                            <div className="flex space-x-1 sm:space-x-2">
                              {application.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'accepted')}
                                    className="flex-1 px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                                  >
                                    <span className="hidden sm:inline">✓ Accept</span>
                                    <span className="sm:hidden">✓</span>
                                  </button>
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'rejected')}
                                    className="flex-1 px-2 sm:px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                                  >
                                    <span className="hidden sm:inline">✗ Reject</span>
                                    <span className="sm:hidden">✗</span>
                                  </button>
                                </>
                              )}

                              {application.status === 'accepted' && (
                                <button
                                  onClick={() => updateApplicationStatus(application._id, 'in-progress')}
                                  className="flex-1 px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                                >
                                  <span className="hidden sm:inline">🚀 Start Work</span>
                                  <span className="sm:hidden">🚀</span>
                                </button>
                              )}

                              {application.status === 'in-progress' && (
                                <button
                                  onClick={() => updateApplicationStatus(application._id, 'completed')}
                                  className="flex-1 px-2 sm:px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                                >
                                  <span className="hidden sm:inline">✅ Mark Complete</span>
                                  <span className="sm:hidden">✅</span>
                                </button>
                              )}

                              {application.status === 'completed' && application.paymentStatus !== 'paid' && (
                                <button
                                  onClick={() => {
                                    setSelectedJobForPayment({ job: selectedJobApplications.job, application });
                                    setShowPaymentModal(true);
                                    setShowApplicationsModal(false);
                                  }}
                                  className="flex-1 px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium touch-manipulation"
                                >
                                  <span className="hidden sm:inline">💰 Pay Worker</span>
                                  <span className="sm:hidden">💰</span>
                                </button>
                              )}

                              {application.status === 'completed' && application.paymentStatus === 'paid' && (
                                <div className="flex-1 px-2 sm:px-3 py-2 bg-green-100 text-green-800 rounded-lg text-center text-xs sm:text-sm font-medium">
                                  <span className="hidden sm:inline">✅ Payment Complete</span>
                                  <span className="sm:hidden">✅ Paid</span>
                                </div>
                              )}

                              {application.status === 'rejected' && (
                                <div className="flex-1 px-2 sm:px-3 py-2 bg-red-100 text-red-800 rounded-lg text-center text-xs sm:text-sm font-medium">
                                  <span className="hidden sm:inline">❌ Rejected</span>
                                  <span className="sm:hidden">❌</span>
                                </div>
                              )}

                              {/* Contact Worker Button */}
                              <button
                                onClick={() => window.open(`tel:${application.worker?.phone || application.workerDetails?.phone}`)}
                                className="px-2 sm:px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors touch-manipulation"
                                title="Call Worker"
                              >
                                📞
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simplified Payment Modal - Mobile Responsive */}
        {showPaymentModal && selectedJobForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-6"
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Process Payment
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Worker:</span>
                    <span className="font-medium text-sm sm:text-base truncate ml-2">
                      {selectedJobForPayment.application.worker?.name || 
                       selectedJobForPayment.application.workerDetails?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Job:</span>
                    <span className="font-medium text-sm sm:text-base truncate ml-2">{selectedJobForPayment.job.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Amount:</span>
                    <span className="font-bold text-green-600 text-sm sm:text-base">
                      ₹{selectedJobForPayment.application.paymentAmount || selectedJobForPayment.job.salary}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('Processing payment for application:', selectedJobForPayment.application._id);
                      
                      const response = await fetch(`${getApiUrl()}/job-applications/${selectedJobForPayment.application._id}/process-payment`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          paymentAmount: selectedJobForPayment.application.paymentAmount || selectedJobForPayment.job.salary
                        })
                      });

                      const result = await response.json();
                      
                      if (response.ok) {
                        console.log('Payment processed successfully:', result);
                        alert(`✅ Payment Processed Successfully!\n\nWorker: ${result.workerUpdated}\nAmount: ₹${selectedJobForPayment.application.paymentAmount || selectedJobForPayment.job.salary}\nNew Worker Balance: ₹${result.newWorkerBalance}\n\nThe worker's balance has been updated immediately.`);
                        handlePaymentComplete();
                      } else {
                        console.error('Payment processing failed:', result);
                        alert(`❌ Payment Failed: ${result.message}`);
                      }
                    } catch (error) {
                      console.error('Payment error:', error);
                      alert('❌ Payment processing failed: ' + error.message);
                    }
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base touch-manipulation"
                >
                  <span className="hidden sm:inline">Process Payment</span>
                  <span className="sm:hidden">Pay</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostedJobs;