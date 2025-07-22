import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  X,
  Star,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Phone,
  Mail,
  Download,
  Filter,
  Search,
  Award,
  Target,
  Zap,
  Shield,
  Heart
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUtils.js';

const PostedJobs = () => {
  const { jobId } = useParams?.() || {};
  const location = useLocation?.() || {};
  const navigate = useNavigate();
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
  
  // New state for enhanced features
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedJobForAnalytics, setSelectedJobForAnalytics] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedWorkerForRating, setSelectedWorkerForRating] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedJobForQuickActions, setSelectedJobForQuickActions] = useState(null);


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
        
        // Fetch applications for all jobs after jobs are loaded
        if (jobsData.length > 0) {
          // Use a slight delay to ensure jobs state is updated
          setTimeout(() => {
            fetchApplicationsForAllJobs(jobsData);
          }, 100);
        }
        
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

  // Fetch applications for all jobs
  const fetchApplicationsForAllJobs = async (jobsData = jobs) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id || user.type !== 'employer') {
        console.log('User not authenticated or not an employer');
        return;
      }

      // Fetch all applications for the employer's jobs in a single request
      const response = await fetch(`${getApiUrl()}/job-applications/employer/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch applications:', await response.text());
        return;
      }
      
      const data = await response.json();
      console.log('Fetched applications:', data);
      
      if (data.success && Array.isArray(data.data)) {
        // Transform the data into a map of jobId to applications
        const applicationsMap = {};
        data.data.forEach(app => {
          if (app.job) {
            if (!applicationsMap[app.job._id]) {
              applicationsMap[app.job._id] = [];
            }
            applicationsMap[app.job._id].push(app);
          }
        });
        
        console.log('Applications map:', applicationsMap);
        setJobApplications(applicationsMap);
      } else {
        console.error('Invalid response format:', data);
        // Initialize empty applications for all jobs
        const emptyMap = {};
        jobsData.forEach(job => {
          emptyMap[job._id] = [];
        });
        setJobApplications(emptyMap);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Initialize empty applications for all jobs on error
      const emptyMap = {};
      jobsData.forEach(job => {
        emptyMap[job._id] = [];
      });
      setJobApplications(emptyMap);
    }
  };

  // Fetch applications for a specific job
  const fetchApplicationsForJob = async (jobId) => {
    try {
      setLoadingApplications(true);
      const response = await fetch(`${getApiUrl()}/job/${jobId}/applications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const applications = await response.json();
        const job = jobs.find(j => j._id === jobId);
        setSelectedJobApplications({
          job,
          applications: Array.isArray(applications) ? applications : []
        });
        setShowApplicationsModal(true);
      } else {
        throw new Error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Failed to load applications: ' + error.message);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing jobs list and applications...');
    setRefreshing(true);
    fetchJobs();
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Remove the job from the local state
        setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
        // Show success message
        toast.success('Job deleted successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(error.message || 'Failed to delete job');
    }
  };

  const handleEditJob = (job) => {
    // Navigate to the edit job page with the job data
    navigate(`/employer/jobs/edit/${job._id}`, { state: { job } });
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

  // Enhanced functions for new features
  const handleShowAnalytics = (job) => {
    setSelectedJobForAnalytics(job);
    setShowAnalyticsModal(true);
  };

  const handleRateWorker = (worker, job) => {
    setSelectedWorkerForRating({ worker, job });
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (ratingData) => {
    try {
      const response = await fetch(`${getApiUrl()}/ratings/worker/${ratingData.worker._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: ratingData.score,
          comment: ratingData.comment,
          jobId: ratingData.job._id
        })
      });

      if (response.ok) {
        alert('Rating submitted successfully!');
        setShowRatingModal(false);
        setSelectedWorkerForRating(null);
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating: ' + error.message);
    }
  };

  const handleQuickAction = async (action, job) => {
    try {
      console.log(`🔄 Performing quick action: ${action} on job: ${job._id}`);
      
      switch (action) {
        case 'duplicate':
          // Clone job with new title
          const jobData = { ...job };
          delete jobData._id;
          jobData.title = `${job.title} (Copy)`;
          jobData.status = 'active';
          
          const response = await fetch(`${getApiUrl()}/jobs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jobData)
          });

          if (response.ok) {
            console.log('✅ Job duplicated successfully');
            alert('Job duplicated successfully!');
            await fetchJobs();
          } else {
            throw new Error('Failed to duplicate job');
          }
          break;
          
        case 'pause':
          await updateJobStatus(job._id, 'paused');
          break;
          
        case 'activate':
          await updateJobStatus(job._id, 'active');
          break;
          
        case 'close':
          await updateJobStatus(job._id, 'closed');
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('❌ Error performing quick action:', error);
      alert('Failed to perform action: ' + error.message);
    }
  };

  // Enhanced job status update with validation and logging
  const updateJobStatus = async (jobId, newStatus, reason = 'System update') => {
    try {
      console.log(`🔄 Updating job ${jobId} status to: ${newStatus}`);
      
      const response = await fetch(`${getApiUrl()}/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: JSON.parse(localStorage.getItem('user') || '{}').id,
          timestamp: new Date().toISOString(),
          reason: reason
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Job status updated successfully:`, result);
        
        // Update local jobs state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job._id === jobId 
              ? { ...job, status: newStatus, updatedAt: new Date().toISOString() }
              : job
          )
        );
        
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update job status');
      }
    } catch (error) {
      console.error('❌ Error updating job status:', error);
      throw error;
    }
  };

  const handleViewApplications = async (job) => {
    console.log('🔍 Fetching applications for job:', job.title, job._id);
    
    setLoadingApplications(true);
    
    try {
      // Fetch applications only when user requests to view them
      const response = await fetch(`${getApiUrl()}/job/${job._id}/applications`);
      
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

  // Enhanced application status update with comprehensive validation and flow management
  const updateApplicationStatus = async (applicationId, newStatus, additionalData = {}) => {
    try {
      console.log('🔄 Updating application status:', applicationId, 'to:', newStatus);
      
      // Validate status transition
      const validTransitions = {
        'pending': ['accepted', 'rejected'],
        'accepted': ['in-progress', 'cancelled'],
        'in-progress': ['completed', 'cancelled'],
        'completed': [], // Terminal state
        'rejected': [], // Terminal state
        'cancelled': [] // Terminal state
      };
      
      // Get current application to check current status
      const currentApp = selectedJobApplications?.applications?.find(app => app._id === applicationId);
      if (currentApp && validTransitions[currentApp.status] && !validTransitions[currentApp.status].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentApp.status} to ${newStatus}`);
      }
      
      // Prepare request body with additional data
      const requestBody = {
        status: newStatus,
        ...additionalData,
        timestamp: new Date().toISOString(),
        updatedBy: JSON.parse(localStorage.getItem('user') || '{}').id
      };
      
      const response = await fetch(`${getApiUrl()}/job-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Application status updated successfully:', result);
        
        // Handle specific status transitions
        await handleStatusTransitionEffects(newStatus, result.data, currentApp);
        
        // Refresh jobs data to show updated status
        await fetchJobs();
        
        // Show success message with context
        const statusMessages = {
          'accepted': 'Application accepted! Worker has been notified.',
          'rejected': 'Application rejected. Worker has been notified.',
          'in-progress': 'Job started! Worker has been notified.',
          'completed': 'Job completed! Payment processing initiated.',
          'cancelled': 'Job cancelled. All parties have been notified.'
        };
        
        alert(statusMessages[newStatus] || `Application ${newStatus} successfully!`);
        
        // If modal is open, refresh the applications data
        if (showApplicationsModal && selectedJobApplications) {
          setTimeout(() => {
            handleViewApplications(selectedJobApplications.job);
          }, 1000);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update application status');
      }
    } catch (error) {
      console.error('❌ Error updating application status:', error);
      alert('Failed to update application status: ' + error.message);
    }
  };
  
  // Handle effects of status transitions
  const handleStatusTransitionEffects = async (newStatus, applicationData, currentApp) => {
    try {
      switch (newStatus) {
        case 'accepted':
          // Update job status to in-progress if not already
          if (applicationData.job && applicationData.job.status === 'active') {
            await updateJobStatus(applicationData.job._id, 'in-progress');
          }
          break;
          
        case 'completed':
          // Trigger payment processing
          await initiatePaymentProcess(applicationData);
          break;
          
        case 'cancelled':
          // Check if all applications are cancelled/rejected, then revert job to active
          await checkAndUpdateJobStatusAfterCancellation(applicationData.job._id);
          break;
      }
    } catch (error) {
      console.error('Error handling status transition effects:', error);
    }
  };
  

  
  // Initiate payment process for completed jobs
  const initiatePaymentProcess = async (applicationData) => {
    try {
      const response = await fetch(`${getApiUrl()}/job-applications/${applicationData._id}/process-payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentAmount: applicationData.job?.salary || applicationData.paymentAmount,
          completedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log('✅ Payment processing initiated');
      }
    } catch (error) {
      console.error('Error initiating payment process:', error);
    }
  };
  
  // Check and update job status after cancellation
  const checkAndUpdateJobStatusAfterCancellation = async (jobId) => {
    try {
      const response = await fetch(`${getApiUrl()}/job/${jobId}/applications`);
      if (response.ok) {
        const data = await response.json();
        const applications = data.data || [];
        
        // If all applications are cancelled/rejected, revert job to active
        const activeApplications = applications.filter(app => 
          !['cancelled', 'rejected'].includes(app.status)
        );
        
        if (activeApplications.length === 0) {
          await updateJobStatus(jobId, 'active', 'All applications cancelled/rejected');
        }
      }
    } catch (error) {
      console.error('Error checking job status after cancellation:', error);
    }
  };

  // Enhanced status color coding for jobs
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      case 'paused':
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'cancelled':
        return <X className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };
  
  // Enhanced application status color coding
  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'accepted':
        return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'rejected':
        return <X className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'in-progress':
        return <Zap className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'completed':
        return <Award className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };
  
  // Get available actions for application status
  const getAvailableActions = (currentStatus) => {
    const actionMap = {
      'pending': [
        { action: 'accepted', label: 'Accept', color: 'bg-green-600 hover:bg-green-700', icon: CheckCircle },
        { action: 'rejected', label: 'Reject', color: 'bg-red-600 hover:bg-red-700', icon: X }
      ],
      'accepted': [
        { action: 'in-progress', label: 'Start Job', color: 'bg-blue-600 hover:bg-blue-700', icon: Zap },
        { action: 'cancelled', label: 'Cancel', color: 'bg-gray-600 hover:bg-gray-700', icon: X }
      ],
      'in-progress': [
        { action: 'completed', label: 'Mark Complete', color: 'bg-purple-600 hover:bg-purple-700', icon: Award },
        { action: 'cancelled', label: 'Cancel', color: 'bg-gray-600 hover:bg-gray-700', icon: X }
      ],
      'completed': [],
      'rejected': [],
      'cancelled': []
    };
    
    return actionMap[currentStatus] || [];
  };
  
  // Enhanced status transition with confirmation
  const handleStatusTransition = async (applicationId, newStatus, currentStatus) => {
    const confirmationMessages = {
      'accepted': 'Are you sure you want to accept this application? The worker will be notified.',
      'rejected': 'Are you sure you want to reject this application? This action cannot be undone.',
      'in-progress': 'Are you sure you want to start this job? The worker will be notified to begin work.',
      'completed': 'Are you sure you want to mark this job as completed? Payment will be processed.',
      'cancelled': 'Are you sure you want to cancel this job? All parties will be notified.'
    };
    
    const message = confirmationMessages[newStatus] || `Are you sure you want to change status to ${newStatus}?`;
    
    if (window.confirm(message)) {
      await updateApplicationStatus(applicationId, newStatus, {
        previousStatus: currentStatus,
        transitionReason: 'Employer action',
        transitionTimestamp: new Date().toISOString()
      });
    }
  };

  // Enhanced filtering and sorting
  const filteredAndSortedJobs = jobs
    .filter(job => {
      // Status filter
      if (filterStatus !== 'all' && job.status !== filterStatus) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower) ||
          job.category?.toLowerCase().includes(searchLower) ||
          job.location?.city?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'salary':
          return (b.salary || 0) - (a.salary || 0);
        case 'applications':
          const aApps = jobApplications[a._id]?.length || 0;
          const bApps = jobApplications[b._id]?.length || 0;
          return bApps - aApps;
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const filteredJobs = filteredAndSortedJobs;

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

        {/* Enhanced Search and Filter Section - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          {/* Search Bar */}
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title, description, category, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Status Filter Tabs */}
            <div className="flex space-x-1 overflow-x-auto flex-1">
              {[
                { value: 'all', label: 'All Jobs' },
                { value: 'active', label: 'Active' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'paused', label: 'Paused' },
                { value: 'closed', label: 'Closed' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`flex-1 min-w-0 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap touch-manipulation ${
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

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="createdAt">Latest First</option>
                <option value="title">Title A-Z</option>
                <option value="salary">Salary High-Low</option>
                <option value="applications">Most Applications</option>
                <option value="status">Status</option>
              </select>
            </div>
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
                      {/* Job Header with Status Badge */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                            {job.title}
                          </h3>
                          <div className="flex items-center">
                            <span className="text-xs px-2 py-0.5 rounded-full mr-2 capitalize"
                              style={{
                                backgroundColor: job.status === 'active' ? '#dbeafe' : 
                                              job.status === 'in-progress' ? '#dbeafe' : 
                                              job.status === 'completed' ? '#dcfce7' : '#f3f4f6',
                                color: job.status === 'active' ? '#1e40af' : 
                                       job.status === 'in-progress' ? '#1e40af' : 
                                       job.status === 'completed' ? '#166534' : '#6b7280'
                              }}>
                              {job.status.replace('-', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {applications.length} application{applications.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        {/* Quick Actions Dropdown */}
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobForQuickActions(selectedJobForQuickActions === job._id ? null : job._id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </button>
                          
                          {selectedJobForQuickActions === job._id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewApplications(job);
                                  setSelectedJobForQuickActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-2" /> View Applications
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditJob(job);
                                  setSelectedJobForQuickActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-2" /> Edit Job
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteJob(job._id);
                                  setSelectedJobForQuickActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Job
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Job Details - Mobile Grid */}
                      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-blue-500" />
                          <span className="truncate">{job.location?.city || 'Location'}, {job.location?.state || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-green-500" />
                          <span className="font-medium text-green-600">
                            ₹{job.salary?.toLocaleString() || 'Negotiable'}
                            <span className="text-gray-500 text-xs ml-1">/ {job.employmentType || 'Job'}</span>
                          </span>
                        </div>

                        {job.startDate && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400" />
                            <span className="truncate">Starts: {formatDate(job.startDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Application Status Quick Actions */}
                      {job.status === 'active' && applications.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          {/* Pending Applications Alert */}
                          {applications.filter(app => app.status === 'pending').length > 0 && (
                            <div className="mb-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <p className="text-xs font-medium text-amber-800">
                                    {applications.filter(app => app.status === 'pending').length} pending application{applications.filter(app => app.status === 'pending').length !== 1 ? 's' : ''}
                                  </p>
                                  <button
                                    onClick={() => handleViewApplications(job)}
                                    className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    Review now →
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Status Summary Bar */}
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                              <span>Applications</span>
                              <span className="font-medium">{applications.length}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                              <div 
                                className="h-1.5 rounded-full bg-blue-500" 
                                style={{ 
                                  width: `${(applications.length / Math.max(applications.length, 1)) * 100}%` 
                                }}
                              ></div>
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-center text-[10px] sm:text-xs">
                              <div className="flex flex-col items-center">
                                <span className="font-medium text-blue-700">
                                  {applications.filter(app => app.status === 'pending').length}
                                </span>
                                <span className="text-gray-500">Pending</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-medium text-green-700">
                                  {applications.filter(app => app.status === 'accepted').length}
                                </span>
                                <span className="text-gray-500">Accepted</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-medium text-indigo-700">
                                  {applications.filter(app => app.status === 'in-progress').length}
                                </span>
                                <span className="text-gray-500">Working</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="font-medium text-purple-700">
                                  {applications.filter(app => app.status === 'completed').length}
                                </span>
                                <span className="text-gray-500">Done</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* In-Progress Work Status - Enhanced */}
                      {job.status === 'in-progress' && applications.length > 0 && (
                        <div className="mb-3 sm:mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs sm:text-sm font-medium text-blue-900 flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Work in Progress
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {applications.filter(app => app.status === 'in-progress').length} active
                            </span>
                          </div>
                          
                          {applications
                            .filter(app => app.status === 'in-progress')
                            .slice(0, 2) // Show max 2 workers
                            .map((application) => (
                              <div key={application._id} className="flex items-center justify-between py-2 border-t border-blue-100 first:border-t-0">
                                <div className="flex items-center min-w-0">
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                    {application.worker?.name?.charAt(0) || 'W'}
                                  </div>
                                  <div className="ml-3 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {application.worker?.name || 'Worker'}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      <span>Started {new Date(application.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2
                                ">
                                  <button
                                    onClick={() => {
                                      // Implement chat functionality
                                      console.log('Chat with worker', application.worker?._id);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                                    title="Message"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'completed')}
                                    className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                                  >
                                    <span className="hidden sm:inline">Complete</span>
                                    <span className="sm:hidden">✓</span>
                                  </button>
                                </div>
                              </div>
                          ))}
                          
                          {applications.filter(app => app.status === 'in-progress').length > 2 && (
                            <button
                              onClick={() => handleViewApplications(job)}
                              className="mt-2 w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              + {applications.filter(app => app.status === 'in-progress').length - 2} more workers
                            </button>
                          )}
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

                      {/* After the job details and before the action buttons, add: */}
                      {applications.length > 0 && (
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Applicants</h4>
                          <div className="space-y-2">
                            {applications.map((application) => (
                              <div key={application._id} className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="truncate font-medium">
                                  {application.worker?.name || application.workerDetails?.name}
                                </span>
                                                                 {application.status === 'pending' ? (
                                   <button
                                     onClick={() => handleStatusTransition(application._id, 'accepted', application.status)}
                                     className="ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 touch-manipulation"
                                   >
                                     Accept
                                   </button>
                                 ) : (
                                   <span className={`ml-2 px-2 py-1 rounded-full ${getApplicationStatusColor(application.status)}`}>
                                     {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                   </span>
                                 )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enhanced Action Buttons - Mobile Responsive */}
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
                            onClick={() => fetchApplicationsForJob(job._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                            title="View Applications"
                          >
                            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => window.location.href = `/employer/edit-job/${job._id}`}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors touch-manipulation"
                            title="Edit Job"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleShowAnalytics(job)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                            title="View Analytics"
                          >
                            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJobForQuickActions(job);
                              setShowQuickActions(true);
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors touch-manipulation"
                            title="Quick Actions"
                          >
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
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

                              {/* Rate Worker Button for Completed Jobs */}
                              {application.status === 'completed' && (
                                <button
                                  onClick={() => handleRateWorker(application.worker || application.workerDetails, selectedJobApplications.job)}
                                  className="px-2 sm:px-3 py-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors touch-manipulation"
                                  title="Rate Worker"
                                >
                                  ⭐
                                </button>
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

        {/* Analytics Modal */}
        <AnimatePresence>
          {showAnalyticsModal && selectedJobForAnalytics && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              >
                <div className="p-4 sm:p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Job Analytics: {selectedJobForAnalytics.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Performance metrics and insights
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAnalyticsModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Views</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {Math.floor(Math.random() * 100) + 50}
                          </p>
                        </div>
                        <Eye className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Applications</p>
                          <p className="text-2xl font-bold text-green-900">
                            {jobApplications[selectedJobForAnalytics._id]?.length || 0}
                          </p>
                        </div>
                        <Users className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Completion Rate</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {selectedJobForAnalytics.status === 'completed' ? '100%' : '75%'}
                          </p>
                        </div>
                        <Target className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Avg. Rating</p>
                          <p className="text-2xl font-bold text-orange-900">4.2⭐</p>
                        </div>
                        <Star className="w-6 h-6 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Application Timeline</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>First 24 hours</span>
                          <span className="font-medium">12 applications</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>First week</span>
                          <span className="font-medium">28 applications</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total period</span>
                          <span className="font-medium">{jobApplications[selectedJobForAnalytics._id]?.length || 0} applications</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Worker Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Average completion time</span>
                          <span className="font-medium">3.2 days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Quality score</span>
                          <span className="font-medium">4.5/5</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Rehire rate</span>
                          <span className="font-medium">85%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating Modal */}
        <AnimatePresence>
          {showRatingModal && selectedWorkerForRating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Rate Worker
                  </h3>
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Rate {selectedWorkerForRating.worker.name || 'Worker'} for their work on
                    </p>
                    <p className="font-medium text-gray-900">
                      {selectedWorkerForRating.job.title}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating (1-5 stars)
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className="text-2xl hover:scale-110 transition-transform"
                            onClick={() => {
                              // Handle star rating
                            }}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comment
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Share your experience with this worker..."
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowRatingModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Handle rating submission
                        alert('Rating submitted successfully!');
                        setShowRatingModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Submit Rating
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Modal */}
        <AnimatePresence>
          {showQuickActions && selectedJobForQuickActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                  <button
                    onClick={() => setShowQuickActions(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedJobForQuickActions.title}
                  </p>

                  <button
                    onClick={() => {
                      handleQuickAction('duplicate', selectedJobForQuickActions);
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Duplicate Job</p>
                      <p className="text-sm text-gray-600">Create a copy with same details</p>
                    </div>
                  </button>

                  {selectedJobForQuickActions.status === 'active' && (
                    <button
                      onClick={() => {
                        handleQuickAction('pause', selectedJobForQuickActions);
                        setShowQuickActions(false);
                      }}
                      className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Clock className="w-5 h-5 mr-3 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">Pause Job</p>
                        <p className="text-sm text-gray-600">Temporarily stop accepting applications</p>
                      </div>
                    </button>
                  )}

                  {selectedJobForQuickActions.status === 'paused' && (
                    <button
                      onClick={() => {
                        handleQuickAction('activate', selectedJobForQuickActions);
                        setShowQuickActions(false);
                      }}
                      className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Zap className="w-5 h-5 mr-3 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Activate Job</p>
                        <p className="text-sm text-gray-600">Resume accepting applications</p>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleQuickAction('close', selectedJobForQuickActions);
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Shield className="w-5 h-5 mr-3 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">Close Job</p>
                      <p className="text-sm text-gray-600">Permanently close this job posting</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      handleViewApplications(selectedJobForQuickActions);
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Users className="w-5 h-5 mr-3 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">View Applications</p>
                      <p className="text-sm text-gray-600">See all worker applications</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      window.location.href = `/employer/edit-job/${selectedJobForQuickActions._id}`;
                      setShowQuickActions(false);
                    }}
                    className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 mr-3 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">Edit Job</p>
                      <p className="text-sm text-gray-600">Modify job details and requirements</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PostedJobs;