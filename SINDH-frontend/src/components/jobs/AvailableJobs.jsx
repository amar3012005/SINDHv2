import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { isWorker, getCurrentUser } from '../../utils/authUtils';
import { saveJobApplication, getJobApplications, hasAppliedForJob, updateApplicationStatus, removeJobApplication } from '../../utils/jobApplicationUtils';
import { getJobById, saveJobPost } from '../../utils/jobPostUtils';
import { getApiUrl } from '../../utils/apiUtils';
import AuthDebugger from '../AuthDebugger';
import JobActionButtons from './JobActionButtons';
import JobApplicationStatus from './JobApplicationStatus';
import { useGlobalState } from '../../context/GlobalStateContext';

const AvailableJobs = () => {
  const navigate = useNavigate();
  const { user, acceptedJobs: acceptedJobsFromContext, setAcceptedJobs, isLoadingUser } = useUser();
  const { t } = useTranslation();
  const { userType, isLoggedIn, employerId, jobCounts, setJobCounts, activeJobs, setActiveJobs, updateJobStats } = useGlobalState();
  // Backend-first state management - similar to MyApplications.jsx
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [cancellingJobIds, setCancellingJobIds] = useState(new Set());
  const [acceptingJobIds, setAcceptingJobIds] = useState(new Set());
  
  // Legacy state variables for compatibility
  const [applyingToJobId, setApplyingToJobId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [jobApplications, setJobApplications] = useState({});
  const [applicationId, setApplicationId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [acceptedJobIds, setAcceptedJobIds] = useState(new Set());
  const [filters, setFilters] = useState(() => {
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    // Only set location filter from user profile, leave others empty
    return {
      location: userProfile?.location?.state || '',
      category: '',
      salary: '',
      employmentType: ''
    };
  });
  const [locationBasedJobs, setLocationBasedJobs] = useState([]);
  const [otherLocationJobs, setOtherLocationJobs] = useState([]);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [pendingJobs, setPendingJobs] = useState(() => {
    const saved = localStorage.getItem('pendingJobs');
    return saved ? JSON.parse(saved) : {};
  });

  // State for editing jobs
  const [editingJobId, setEditingJobId] = useState(null);
  const [editJobData, setEditJobData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Backend-first fetchJobs function with location-based filtering
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const workerId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
      const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('=== FRONTEND: Starting backend-first job fetch ===');
      console.log('FRONTEND: User ID:', workerId);
      console.log('FRONTEND: User location:', userProfile?.location);
      
      // Build URL with query parameters including location filter
      let jobsUrl = getApiUrl('/api/jobs');
      const queryParams = new URLSearchParams();
      
      if (workerId) {
        queryParams.append('workerId', workerId);
      }
      
      // Add location filter from user profile or filters
      const userLocation = filters.location || userProfile?.location?.state;
      if (userLocation) {
        queryParams.append('location', userLocation);
      }
      
      // Add other filters
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.salary) queryParams.append('minSalary', filters.salary);
      if (filters.employmentType) queryParams.append('employmentType', filters.employmentType);
      
      if (queryParams.toString()) {
        jobsUrl += `?${queryParams.toString()}`;
      }
      
      console.log('FRONTEND: Fetching jobs from URL:', jobsUrl);
      
      // Fetch jobs from backend
      const jobsResponse = await fetch(jobsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!jobsResponse.ok) {
        const errorText = await jobsResponse.text();
        console.error('FRONTEND: Jobs fetch error:', errorText);
        throw new Error(`Failed to fetch jobs: ${jobsResponse.status}`);
      }

      const jobsData = await jobsResponse.json();
      console.log('FRONTEND: Raw jobs response:', jobsData);
      
      // Handle different response formats
      let jobsArray = [];
      if (jobsData.success && Array.isArray(jobsData.data)) {
        jobsArray = jobsData.data;
      } else if (Array.isArray(jobsData)) {
        jobsArray = jobsData;
      } else if (jobsData.data && Array.isArray(jobsData.data)) {
        jobsArray = jobsData.data;
      }
      
      console.log('FRONTEND: Processed jobs array:', jobsArray.length);

      // Fetch current applications if user is authenticated
      let applicationsArray = [];
      if (workerId) {
        try {
          console.log('FRONTEND: Fetching applications for worker:', workerId);
          
          const applicationsResponse = await fetch(getApiUrl(`/api/job-applications/worker/${workerId}/current`), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (applicationsResponse.ok) {
            const applicationsData = await applicationsResponse.json();
            console.log('FRONTEND: Raw applications response:', applicationsData);
            
            // Handle different response formats
            if (applicationsData.success && Array.isArray(applicationsData.data)) {
              applicationsArray = applicationsData.data;
            } else if (Array.isArray(applicationsData)) {
              applicationsArray = applicationsData;
            } else if (applicationsData.data && Array.isArray(applicationsData.data)) {
              applicationsArray = applicationsData.data;
            }
            
            console.log('FRONTEND: Processed applications array:', applicationsArray.length);
          } else {
            console.warn('FRONTEND: Failed to fetch applications:', applicationsResponse.status);
          }
        } catch (error) {
          console.error('FRONTEND: Error fetching applications:', error);
          // Continue without applications data
        }
      }

      // Process applications
      const processedApplications = applicationsArray.map((app, index) => {
        return {
          _id: app._id || `app-${index}`,
          status: app.status || 'pending',
          appliedAt: app.appliedAt || app.createdAt || new Date().toISOString(),
          job: {
            _id: app.job?._id || `job-${index}`,
            title: app.job?.title || 'Job Title Not Available',
            companyName: app.job?.companyName || app.job?.company || 'Company Not Available',
            location: {
              city: app.job?.location?.city || 'City Not Available',
              state: app.job?.location?.state || 'State Not Available'
            },
            salary: app.job?.salary || 'Salary Not Specified',
            category: app.job?.category || 'General',
            employmentType: app.job?.employmentType || 'Full-time'
          },
          worker: app.worker || null,
          employer: app.employer || null
        };
      });

      // Update applications state
      setApplications(processedApplications);
      setAcceptedJobs(processedApplications);
      
      // Create applications map for quick lookup
      const applicationsMap = processedApplications.reduce((acc, app) => {
        if (app.job && app.job._id) {
          acc[app.job._id] = app;
        }
        return acc;
      }, {});
      setJobApplications(applicationsMap);
      
      // Update accepted job IDs
      const acceptedJobIds = new Set(processedApplications.map(app => app.job?._id).filter(Boolean));
      setAcceptedJobIds(acceptedJobIds);

      // Process jobs data
      const processedJobs = jobsArray.map((job, index) => {
        // Find matching application
        const matchingApp = processedApplications.find(app => app.job?._id === job._id);
        
        return {
          _id: job._id || `job-${index}`,
          title: job.title || 'Job Title Not Available',
          companyName: job.companyName || job.company || 'Company Not Available',
          location: {
            city: job.location?.city || 'City Not Available',
            state: job.location?.state || 'State Not Available',
            street: job.location?.street || '',
            pincode: job.location?.pincode || '',
            type: job.location?.type || 'onsite'
          },
          salary: job.salary || 'Salary Not Specified',
          category: job.category || 'General',
          employmentType: job.employmentType || 'Full-time',
          status: job.status || 'active',
          description: job.description || 'No description available',
          requirements: job.requirements || '',
          skillsRequired: job.skillsRequired || [],
          createdAt: job.createdAt || new Date().toISOString(),
          urgency: job.urgency || 'Normal',
          // Include application data if exists
          application: matchingApp || null,
          applicationStatus: matchingApp?.status || null,
          hasApplied: !!matchingApp,
          applicationId: matchingApp?._id || null
        };
      });

      console.log('FRONTEND: Final processed jobs:', processedJobs);

      // Filter only active jobs
      const activeJobs = processedJobs.filter(job => job.status === 'active');
      console.log('FRONTEND: Active jobs:', activeJobs.length);

      // Location-based job categorization
      if (user?.type === 'worker' && userProfile?.location?.state) {
        const userState = userProfile.location.state.toLowerCase();
        const userCity = userProfile.location.city?.toLowerCase();
        
        console.log('FRONTEND: User location for filtering:', { state: userState, city: userCity });
        
        // Categorize jobs by location proximity
        const sameStateJobs = [];
        const sameCityJobs = [];
        const otherLocationJobs = [];
        
        activeJobs.forEach(job => {
          const jobState = job.location?.state?.toLowerCase() || '';
          const jobCity = job.location?.city?.toLowerCase() || '';
          
          if (userCity && jobCity === userCity && jobState === userState) {
            // Same city jobs (highest priority)
            sameCityJobs.push(job);
          } else if (jobState === userState) {
            // Same state but different city
            sameStateJobs.push(job);
          } else {
            // Different state
            otherLocationJobs.push(job);
          }
        });
        
        console.log('FRONTEND: Location-based job categorization:', {
          sameCity: sameCityJobs.length,
          sameState: sameStateJobs.length,
          otherLocations: otherLocationJobs.length
        });
        
        // Combine prioritized jobs: same city first, then same state, then others
        const prioritizedJobs = [
          ...sameCityJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
          ...sameStateJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
          ...otherLocationJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        ];
        
        // Set location-based job lists
        setLocationBasedJobs([...sameCityJobs, ...sameStateJobs]);
        setOtherLocationJobs(otherLocationJobs);
        setJobs(prioritizedJobs);
        
      } else {
        // For non-workers or users without location, show all jobs
        const sortedJobs = activeJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLocationBasedJobs(sortedJobs);
        setOtherLocationJobs([]);
        setJobs(sortedJobs);
      }

      setError(null);
      setLastUpdated(new Date());
      
      console.log('FRONTEND: Jobs state updated successfully');
      
    } catch (error) {
      console.error('FRONTEND: Error fetching jobs:', error);
      setError(error.message || 'Failed to load jobs. Please try again later.');
      // Don't clear existing data on error to maintain last known good state
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [user, filters]);

  // We no longer need a separate fetchJobApplications function as it's integrated in fetchJobs
  const fetchJobApplications = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('Fetching job applications from database for worker:', user.id);
      const response = await fetch(getApiUrl(`/api/job-applications/worker/${user.id}/current`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      console.log('Fetched applications from database:', data.length);
      
      // Convert array to object with jobId as key for easier lookup
      const applications = data.reduce((acc, app) => {
        if (app.job && app.job._id) {
          acc[app.job._id] = app;
        }
        return acc;
      }, {});
      
      setJobApplications(applications);
      setApplications(data);
      
      // Update accepted jobs state with the backend data
      if (data.length > 0) {
        // Format applications for acceptedJobs state
        const formattedApps = data.map(app => ({
          _id: app._id,
          job: app.job,
          status: app.status,
          applicationId: app._id,
          appliedAt: app.appliedAt || app.createdAt
        }));
        
        setAcceptedJobs(formattedApps);
        
        // Update accepted job IDs
        const jobIds = new Set(data.map(app => app.job?._id).filter(Boolean));
        setAcceptedJobIds(jobIds);
      }
      
      // Refresh jobs to integrate application status
      fetchJobs();
    } catch (error) {
      console.error('Error fetching job applications from database:', error);
    }
  }, [user?.id, fetchJobs]);

  // Backend-first polling setup similar to MyApplications.jsx
  useEffect(() => {
    fetchJobs();
    
    // Set up polling to refresh jobs every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchJobs();
  };

  // Replace the existing useEffect for setting default filters with this simpler version
  useEffect(() => {
    if (!isLoadingUser) {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser?.location?.state) {
        setFilters(prev => ({
          ...prev,
          location: storedUser.location.state
        }));
        
        // Immediately fetch jobs with location filter
        const queryParams = new URLSearchParams({ location: storedUser.location.state }).toString();
        fetch(`${getApiUrl('/api/jobs')}?${queryParams}`)
          .then(response => response.json())
          .then(data => {
            setJobs(data.filter(job => job.status === 'active'));
          })
          .catch(error => console.error('Error fetching initial jobs:', error));
      }
    }
  }, [isLoadingUser]);

  console.log('AvailableJobs: Rendering with user:', user, 'isLoadingUser:', isLoadingUser);
  console.log('AvailableJobs: user type =', user?.type);
  console.log('AvailableJobs: localStorage user =', JSON.parse(localStorage.getItem('user') || '{}'));
  console.log('AvailableJobs: Should show Accept button =', Boolean(user && user.type === 'worker'));

  // fetchJobs already has filters in its closure via useCallback
  useEffect(() => {
    console.log('AvailableJobs useEffect: user changed, fetching jobs.', { user, isLoadingUser });
    fetchJobs();
  }, [fetchJobs]);
  
  

  

  // Backend-first cancel application function similar to MyApplications.jsx
  const handleCancelApplication = async (application) => {
    try {
      const applicationId = application._id;
      const jobId = application.job._id;
      
      setCancellingJobIds(prev => new Set([...prev, jobId]));
      
      console.log('Cancelling application:', applicationId);
      
      const response = await fetch(getApiUrl(`/api/job-applications/${applicationId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel application');
      }

      toast.success('Application cancelled successfully');
      
      // Refresh data after a short delay similar to MyApplications.jsx
      setTimeout(fetchJobs, 1000);
      
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast.error(error.message || 'Failed to cancel application');
    } finally {
      setCancellingJobIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(application.job._id);
        return newSet;
      });
    }
  };

  // Function to check job status
  const isPending = (status) => status === 'pending';
  const isAccepted = (status) => status === 'accepted';
  const isInProgress = (status) => status === 'in-progress';

  // Function to check if a job has been accepted
  const isJobAccepted = (jobId) => {
    // Check if in acceptedJobIds Set
    if (acceptedJobIds.has(jobId)) return true;
    
    // Check if in acceptedJobsFromContext array
    if (Array.isArray(acceptedJobsFromContext)) {
      return acceptedJobsFromContext.some(app => app.job?._id === jobId);
    }
    
    // Check if in jobApplications object
    return !!jobApplications[jobId];
  };

  // Function to get the application for a job
  const getApplicationForJob = (jobId) => {
    return applications.find(app => app.job?._id === jobId);
  };

  // Update the handleApplyForJob function - fix acceptedJobs references
  const handleApplyForJob = async (job) => {
    // Add job to accepting state
    setAcceptingJobIds(prev => new Set([...prev, job._id]));
    
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      console.log('Applying for job:', job._id);

      if (!userData?.id) {
        toast.error('Please login to apply for jobs');
        navigate('/login');
        return;
      }

      // Prepare data for server with proper structure
      const applicationData = {
        jobId: job._id,
        workerId: userData.id,
        status: 'pending', // Start with pending status
        workerDetails: {
          name: userData.name,
          phone: userData.phone,
          email: userData.email || '',
          skills: userData.skills || [],
          experience: userData.experience || '',
          location: userData.location || {},
          // Fix rating - send only the number, not the object
          rating: userData.rating?.average || 0
        }
      };

      console.log('Sending job application to server:', applicationData);
      
      // Send to server FIRST and wait for response before updating UI
      const response = await fetch(getApiUrl('/api/job-applications/apply'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      });
      
      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        // Try to parse error message
        let errorMessage = 'Failed to submit application';
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      const responseData = await response.json();
      console.log('Server response data:', responseData);
      
      // Extract application data from response
      const serverApplication = responseData.data || responseData.application || responseData;
      const applicationId = serverApplication._id || serverApplication.applicationId;
      
      if (!applicationId) {
        throw new Error('Server did not return application ID');
      }

      // Only update UI state AFTER successful server response
      console.log('Application created successfully, updating UI state');
      
      // Create local application record with server data
      const localApplication = {
        _id: applicationId,
        jobId: job._id,
        workerId: userData.id,
        status: serverApplication.status || 'pending',
        appliedAt: serverApplication.appliedAt || new Date().toISOString(),
        job: job,
        applicationId: applicationId
      };
      
      toast.success('Application submitted successfully! The employer will review your application.');
      
      // Refresh data after a short delay to sync with backend
      setTimeout(() => {
        fetchJobs();
        fetchJobApplications();
      }, 1000);

    } catch (error) {
      console.error('Application error:', error);
      
      // Show appropriate error message
      if (error.message.includes('already applied')) {
        toast.error('You have already applied for this job');
      } else if (error.message.includes('not found')) {
        toast.error('Job not found or no longer available');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.message.includes('validation failed')) {
        toast.error('Application data is invalid. Please try again.');
      } else {
        toast.error(error.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      // Remove from accepting state
      setAcceptingJobIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(job._id);
        return newSet;
      });
    }
  };

  // Function to update application status
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      // Make API call to update status
      const response = await fetch(getApiUrl(`/api/job-applications/${applicationId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      // Update application in state
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    console.log('Applying filters:', filters);
    // Trigger fetchJobs with new filters
    fetchJobs();
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  // Handler to open edit mode
  const handleEditJob = (job) => {
    setEditingJobId(job._id);
    setEditJobData({
      title: job.title || '',
      salary: job.salary || '',
      category: job.category || '',
      employmentType: job.employmentType || '',
      requirements: job.requirements || '',
    });
  };

  // Handler for editing jobs
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditJobData(prev => ({ ...prev, [name]: value }));
  };

  // Handler to save edited job
  const handleSaveEdit = async (jobId) => {
    setSavingEdit(true);
    try {
      const response = await fetch(getApiUrl(`/api/jobs/${jobId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editJobData),
      });
      if (!response.ok) throw new Error('Failed to update job');
      toast.success('Job updated successfully');
      setEditingJobId(null);
      setEditJobData({});
      fetchJobs(); // Refresh jobs
    } catch (error) {
      toast.error(error.message || 'Failed to update job');
    } finally {
      setSavingEdit(false);
    }
  };

  // Enhanced date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return t('jobs.recently');
    
    // Try to create a valid date object
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return t('jobs.recently');
    }
    
    // Return formatted date
    return date.toLocaleDateString();
  };

  // Enhance the deduplication function to be more thorough
  const deduplicateJobs = (jobs) => {
    const uniqueJobs = [];
    const seenJobIds = new Set();
    
    if (!Array.isArray(jobs)) {
      console.warn('deduplicateJobs called with non-array:', jobs);
      return [];
    }
    
    jobs.forEach(job => {
      if (!job) return;
      
      const jobId = job._id || job.id;
      if (jobId && !seenJobIds.has(jobId)) {
        seenJobIds.add(jobId);
        uniqueJobs.push(job);
      } else if (jobId) {
        console.log(`Duplicate job filtered out: ${jobId}`);
      } else {
        console.warn('Job without ID found:', job);
      }
    });
    
    console.log(`Deduplicated ${jobs.length} jobs to ${uniqueJobs.length} unique jobs`);
    return uniqueJobs;
  };

  // Set up polling when component mounts
  useEffect(() => {
    // Initial fetch
    fetchJobs();
    fetchJobApplications();

    // Set up polling with longer intervals (10 seconds) to reduce chances of race conditions
    const jobsInterval = setInterval(() => {
      console.log('Running scheduled job fetch');
      fetchJobs();
    }, 10000);
    
    const applicationsInterval = setInterval(() => {
      console.log('Running scheduled applications fetch');
      fetchJobApplications();
    }, 10000);
    
    setPollingInterval(jobsInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(jobsInterval);
      clearInterval(applicationsInterval);
    };
  }, [fetchJobs, fetchJobApplications]);

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } else {
        // Resume polling when tab becomes visible
        fetchJobs();
        const interval = setInterval(fetchJobs, 5000);
        setPollingInterval(interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchJobs, pollingInterval]);

  const renderJobCard = (job) => {
    const application = jobApplications[job._id] || getApplicationForJob(job._id);
    const hasApplied = isJobAccepted(job._id) || !!application;
    const jobIsInProgress = job.status === 'in-progress' || application?.status === 'in-progress';
    const isApplicationAccepted = application?.status === 'accepted' || jobIsInProgress;
    
    return (
      <motion.div
        key={job._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full h-auto min-h-[400px] bg-white rounded-lg shadow-md overflow-hidden border 
          ${hasApplied ? 'border-green-300' : 'border-gray-100'} 
          ${jobIsInProgress ? 'bg-blue-50' : isApplicationAccepted ? 'bg-green-50' : ''}
          hover:shadow-lg transition-shadow duration-300 flex flex-col`}
        whileHover={{ scale: 1.02 }}
      >
        {/* Status banner */}
        {hasApplied && (
          <div className={`px-4 py-2 text-sm font-medium ${
            jobIsInProgress ? 'bg-blue-100 text-blue-800' : 
            isApplicationAccepted ? 'bg-green-100 text-green-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs">
                {jobIsInProgress ? 'Job In Progress' : 
                 isApplicationAccepted ? 'Application Accepted' : 
                 'Application Submitted'}
              </span>
            </div>
          </div>
        )}
        
        <div className="p-4 flex-1 flex flex-col">
          {/* Header section */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">{job.title}</h3>
            <p className="text-sm font-medium text-blue-600 mb-3 line-clamp-1">{job.companyName}</p>
            
            {/* Job details grid - compact layout */}
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
              <div className="flex items-center">
                <svg className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{job.location.city}, {job.location.state}</span>
              </div>
              
              <div className="flex items-center">
                <svg className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-green-600">₹{job.salary || 'Negotiable'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="truncate">{job.category}</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="flex-shrink-0 mr-1.5 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">{job.employmentType}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Requirements section - collapsible */}
          {job.requirements && (
            <div className="mb-3 flex-1">
              <div className="text-xs text-gray-600 border-t pt-2">
                <span className="font-semibold">Requirements:</span>
                <p className="mt-1 line-clamp-2">{job.requirements}</p>
              </div>
            </div>
          )}
          
          {/* Application info */}
          {application && (
            <div className="mb-3 text-xs text-gray-500">
              <div className="bg-gray-50 rounded p-2">
                <div>Applied: {formatDate(application.appliedAt || application.createdAt)}</div>
                {application._id && (
                  <div className="mt-1">ID: #{application._id.substring(0, 8)}</div>
                )}
              </div>
            </div>
          )}
          
          {/* Edit form - compact */}
          {editingJobId === job._id && (
            <div className="mb-3 bg-gray-50 p-3 rounded border border-blue-200">
              <div className="space-y-2">
                <input 
                  name="title" 
                  value={editJobData.title} 
                  onChange={handleEditChange} 
                  className="w-full text-xs border rounded p-1" 
                  placeholder="Title" 
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    name="salary" 
                    value={editJobData.salary} 
                    onChange={handleEditChange} 
                    className="text-xs border rounded p-1" 
                    placeholder="Salary" 
                    type="number" 
                  />
                  <input 
                    name="category" 
                    value={editJobData.category} 
                    onChange={handleEditChange} 
                    className="text-xs border rounded p-1" 
                    placeholder="Category" 
                  />
                </div>
                <input 
                  name="requirements" 
                  value={editJobData.requirements} 
                  onChange={handleEditChange} 
                  className="w-full text-xs border rounded p-1" 
                  placeholder="Requirements" 
                />
              </div>
              <div className="mt-2 flex gap-1">
                <button 
                  onClick={() => handleSaveEdit(job._id)} 
                  disabled={savingEdit} 
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={() => setEditingJobId(null)} 
                  className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Status and Action Area - fixed at bottom */}
          <div className="mt-auto border-t pt-3">
            <div className="flex justify-between items-center">
              {/* Status Display */}
              <div className="flex flex-col flex-1">
                {isPending(application?.status) || isAccepted(application?.status) || isInProgress(application?.status) ? (
                  <>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isPending(application?.status) ? 'bg-yellow-100 text-yellow-800' : 
                      isInProgress(application?.status) ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {application?.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Pending'}
                    </span>
                    
                    <span className="text-xs text-gray-500 mt-1">
                      {isPending(application?.status) ? 'Awaiting response' : 
                       isAccepted(application?.status) ? 'Ready to start' : 
                       'Work in progress'}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center text-gray-500 text-xs">
                    <span>Ready to apply</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-1 ml-2">
                {hasApplied ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelApplication(application || job);
                    }}
                    disabled={cancellingJobIds.has(job._id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                      cancellingJobIds.has(job._id) 
                        ? 'bg-gray-300 text-gray-500 cursor-wait' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    } transition-colors`}
                  >
                    {cancellingJobIds.has(job._id) ? 'Cancelling...' : 'Cancel'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleApplyForJob(job)}
                    disabled={acceptingJobIds.has(job._id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                      acceptingJobIds.has(job._id) 
                        ? 'bg-green-500 text-white cursor-wait' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } transition-colors`}
                  >
                    {acceptingJobIds.has(job._id) ? 'Applying...' : 'Apply Now'}
                  </button>
                )}
                
                {/* Edit button for employers */}
                {user && (user.type === 'employer' || user.type === 'admin') && editingJobId !== job._id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditJob(job); }}
                    className="px-2 py-1 rounded text-xs font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Fetch employer profile in real time and save to localStorage
  useEffect(() => {
    let employerProfileInterval;
    const fetchEmployerProfile = async () => {
      try {
        if (!user || user.type !== 'employer') return;
        const response = await fetch(getApiUrl(`/api/employers/${user.id}`));
        if (!response.ok) throw new Error('Failed to fetch employer profile');
        const profile = await response.json();
        localStorage.setItem('employerProfile', JSON.stringify(profile));
      } catch (err) {
        // Optionally handle error
        console.error('Error fetching employer profile:', err);
      }
    };
    fetchEmployerProfile();
    employerProfileInterval = setInterval(fetchEmployerProfile, 10000); // Poll every 10s
    return () => clearInterval(employerProfileInterval);
  }, [user]);

  // Fetch full employer profile from backend using employerId or phone number, and update global state
  const [fullEmployerProfile, setFullEmployerProfile] = useState(null);
  useEffect(() => {
    let interval;
    const fetchFullEmployerProfile = async () => {
      try {
        if (userType !== 'employer' || !employerId) return;
        let url = getApiUrl(`/api/employers/${employerId}`);
        let response = await fetch(url);
        let profile = null;
        if (response.ok) {
          profile = await response.json();
        } else {
          // fallback: try by phone if available
          const userObj = JSON.parse(localStorage.getItem('user') || '{}');
          if (userObj.phone) {
            url = getApiUrl(`/api/employers/phone/${userObj.phone}`);
            response = await fetch(url);
            if (response.ok) profile = await response.json();
          }
        }
        if (profile) {
          setFullEmployerProfile(profile);
          localStorage.setItem('employerProfile', JSON.stringify(profile));
          // Optionally update job counts and active jobs in global state
          if (profile.postedJobs) {
            setJobCounts(prev => ({ ...prev, total: profile.postedJobs.length }));
          }
        }
      } catch (err) {
        console.error('Error fetching full employer profile:', err);
      }
    };
    fetchFullEmployerProfile();
    interval = setInterval(fetchFullEmployerProfile, 10000);
    return () => clearInterval(interval);
  }, [userType, employerId, setJobCounts]);

  // Get employer profile from localStorage if user is employer
  let employerProfile = null;
  if (user && user.type === 'employer') {
    try {
      employerProfile = JSON.parse(localStorage.getItem('employerProfile'));
    } catch (e) {
      employerProfile = null;
    }
  }

  const [testEmployerData, setTestEmployerData] = useState(null);

  const testFetchEmployerByPhone = async (phone) => {
    try {
      const url = getApiUrl(`/api/employers/phone/${phone}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch employer by phone');
      const data = await response.json();
      setTestEmployerData(data);
      console.log('Fetched employer by phone:', data);
    } catch (err) {
      setTestEmployerData({ error: err.message });
      console.error('Error fetching employer by phone:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Development-only auth debugger */}
      {process.env.NODE_ENV === 'development' && <AuthDebugger />}
      {/* Force display debug button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={() => {
            console.log('Debug button clicked');
            const userObj = JSON.parse(localStorage.getItem('user') || '{}');
            if (userObj) {
              userObj.type = 'worker';
              localStorage.setItem('user', JSON.stringify(userObj));
              localStorage.setItem('userType', 'worker');
            }
            window.location.reload();
          }}
        >
          Debug: Force Worker Type & Reload
        </button>
      </div>
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{t('jobs.requestSuccess')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('jobs.title')}
            </h1>
            <p className="mt-3 max-w-2xl text-xl text-gray-500">
              {user && user.type === 'worker' && user.location?.state
                ? `Find jobs in ${user.location.state} and nearby areas`
                : 'Find your perfect job opportunity'}
            </p>
          </div>
          
          {/* Refresh button similar to MyApplications */}
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={handleRetry}
              disabled={loading || isRetrying}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {(loading || isRetrying) ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter section - now with improved layout and instant apply */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                {t('jobs.location')}
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter state"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                {t('jobs.category')}
              </label>
              <select
                name="category"
                id="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Construction">Construction</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Household">Household</option>
                <option value="Transportation">Transportation</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                Minimum Salary
              </label>
              <input
                type="number"
                name="salary"
                id="salary"
                value={filters.salary}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                Employment Type
              </label>
              <select
                name="employmentType"
                id="employmentType"
                value={filters.employmentType}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* Job listings section with proper grid structure */}
        {/* Location-based job sections for workers */}
        {user?.type === 'worker' && locationBasedJobs.length > 0 ? (
          <>
            {/* Jobs in your area section */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900">
                  Jobs in Your Area ({locationBasedJobs.length})
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {locationBasedJobs.map(job => renderJobCard(job))}
              </div>
            </div>

            {/* Jobs in other locations section */}
            {otherLocationJobs.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center mb-6">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Jobs in Other Locations ({otherLocationJobs.length})
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherLocationJobs.map(job => renderJobCard(job))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Default job grid for non-workers or when no location-based categorization */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-6">
                <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4zm16 0a8 8 0 01-8 8v-4a4 4 0 004-4h4z"></path>
                </svg>
                <p className="mt-2 text-gray-500">Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-500 font-semibold mb-2">Error loading jobs:</p>
                  <p className="text-red-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="col-span-full text-center py-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
                  <div className="text-gray-500 space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium">No jobs available</p>
                    <p className="text-sm">Check back later for new opportunities</p>
                    <button
                      onClick={handleRetry}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Refresh Jobs
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="col-span-full mb-4">
                  <p className="text-sm text-gray-600">
                    Found {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                {jobs.map(job => renderJobCard(job))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableJobs;
