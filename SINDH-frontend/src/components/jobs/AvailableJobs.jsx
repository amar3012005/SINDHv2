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
  
  // State variables for controlling the component
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [applyingToJobId, setApplyingToJobId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [jobApplications, setJobApplications] = useState({});
  const [applications, setApplications] = useState([]);
  const [applicationId, setApplicationId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Add missing state variables
  const [acceptedJobIds, setAcceptedJobIds] = useState(new Set());
  const [acceptingJobIds, setAcceptingJobIds] = useState(new Set());
  const [cancellingJobIds, setCancellingJobIds] = useState(new Set());
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

  // DEBUGGING: Set initial test jobs
  const [testMode, setTestMode] = useState(false);

  // State for editing jobs
  const [editingJobId, setEditingJobId] = useState(null);
  const [editJobData, setEditJobData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Add new state for job details modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Enhanced fetchJobs function that integrates with job application database
  const fetchJobs = useCallback(async () => {
    try {
      // First try to load jobs from localStorage to show immediately
      const localJobs = JSON.parse(localStorage.getItem('availableJobs') || '[]');
      if (Array.isArray(localJobs) && localJobs.length > 0) {
        console.log('Loaded jobs from localStorage:', localJobs.length);
        setJobs(localJobs);
        
        // Apply local filtering
        if (user?.type === 'worker' && user?.location?.state) {
          const userLocation = user.location.state.toLowerCase();
          const locationJobs = localJobs.filter(job =>
            job.location?.state?.toLowerCase().includes(userLocation)
          );
          const otherJobs = localJobs.filter(job =>
            !job.location?.state?.toLowerCase().includes(userLocation)
          );
          setLocationBasedJobs(locationJobs);
          setOtherLocationJobs(otherJobs);
        } else {
          setLocationBasedJobs(localJobs);
          setOtherLocationJobs([]);
        }
        
        // Continue with network fetch in the background
        setLoading(false);
      } else {
        setLoading(true);
      }
      
      // Prepare for database fetches
      const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
      
      // Fetch jobs and applications in parallel for better performance
      const [jobResponse, applicationResponse] = await Promise.all([
        // Fetch available jobs
        fetch(`${getApiUrl('/api/jobs')}?${new URLSearchParams(filters).toString()}`),
        
        // Fetch user's current applications if user is logged in
        userId ? fetch(getApiUrl(`/api/job-applications/worker/${userId}/current`)) : Promise.resolve(null)
      ]);

      if (!jobResponse.ok) {
        console.error('Server response not ok:', jobResponse.status, jobResponse.statusText);
        throw new Error(`Server error: ${jobResponse.status}`);
      }

      // Process job data
      const jobData = await jobResponse.json();
      console.log('Fetched jobs with filters:', jobData.length);
      console.log('Raw job data:', jobData);

      // Process application data if available
      let applications = [];
      if (applicationResponse && applicationResponse.ok) {
        applications = await applicationResponse.json();
        console.log('Fetched current applications:', applications.length);
        
        // Update job applications state with fetched data
        const formattedApplications = applications.reduce((acc, app) => {
          if (app.job && app.job._id) {
            acc[app.job._id] = app;
          }
          return acc;
        }, {});
        
        setJobApplications(formattedApplications);
        
        // Update accepted jobs with fetched applications
        if (applications.length > 0) {
          setAcceptedJobs(applications.map(app => ({
            _id: app._id,
            job: app.job,
            status: app.status,
            applicationId: app._id,
            appliedAt: app.appliedAt || app.createdAt
          })));
          
          // Update accepted job IDs set
          const jobIds = new Set(applications.map(app => app.job?._id).filter(Boolean));
          setAcceptedJobIds(jobIds);
        }
      }

      // Filter and enrich jobs with application status
      let filteredJobs = jobData.filter(job => ['active', 'in-progress'].includes(job.status));
      console.log('Filtered jobs after status filter:', filteredJobs.length);
      console.log('Filtered jobs data:', filteredJobs);
      
      // Enrich jobs with application data
      filteredJobs = filteredJobs.map(job => {
        const matchingApp = applications.find(app => app.job?._id === job._id);
        if (matchingApp) {
          return {
            ...job,
            application: matchingApp,
            applicationStatus: matchingApp.status,
            hasApplied: true
          };
        }
        return job;
      });
      
      // Deduplicate jobs before setting state
      filteredJobs = deduplicateJobs(filteredJobs);
      console.log('Jobs after deduplication:', filteredJobs.length);
      setJobs(filteredJobs);
      console.log('Jobs set in state:', filteredJobs);
      
      // Save to localStorage for offline access
      localStorage.setItem('availableJobs', JSON.stringify(filteredJobs));

      if (user?.type === 'worker' && user?.location?.state) {
        const userLocation = user.location.state.toLowerCase();
        const locationJobs = filteredJobs.filter(job =>
          job.location?.state?.toLowerCase().includes(userLocation)
        );
        
        const otherJobs = filteredJobs.filter(job =>
          !job.location?.state?.toLowerCase().includes(userLocation)
        );
        
        // Set deduplicated job lists
        setLocationBasedJobs(deduplicateJobs(locationJobs));
        setOtherLocationJobs(deduplicateJobs(otherJobs));
      } else {
        setLocationBasedJobs(deduplicateJobs(filteredJobs));
        setOtherLocationJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs. Please try again.');
      setJobs([]);
      setLocationBasedJobs([]);
      setOtherLocationJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

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

  // Set up polling with integrated fetch approach
  useEffect(() => {
    // Initial fetch
    fetchJobs();
    
    // Set up polling with longer intervals (10 seconds) to reduce chances of race conditions
    const jobsInterval = setInterval(() => {
      console.log('Running scheduled job fetch with application integration');
      fetchJobs();
    }, 10000);
    
    setPollingInterval(jobsInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(jobsInterval);
    };
  }, [fetchJobs]);

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
  console.log('AvailableJobs: Current jobs state =', jobs);
  console.log('AvailableJobs: Jobs length =', jobs.length);
  console.log('AvailableJobs: Loading state =', loading);
  console.log('AvailableJobs: Error state =', error);

  // Add an alert for debugging
  if (jobs.length > 0) {
    console.log('JOBS FOUND:', jobs.length);
  }
  console.log('AvailableJobs: Should show Accept button =', Boolean(user && user.type === 'worker'));

  // fetchJobs already has filters in its closure via useCallback
  useEffect(() => {
    console.log('AvailableJobs useEffect: user changed, fetching jobs.', { user, isLoadingUser });
    fetchJobs();
    
    // Add a simple test to set jobs directly
    setTimeout(() => {
      console.log('Setting test job after 2 seconds...');
      setJobs([{
        _id: 'test-job-1',
        title: 'Test Job',
        companyName: 'Test Company',
        status: 'active',
        salary: 1000,
        location: { city: 'Test City', state: 'Test State' },
        description: 'This is a test job to verify the UI is working'
      }]);
    }, 2000);
  }, [fetchJobs]);
  
  // Helper function to save job application to local storage
  const saveJobApplication = (jobId, application) => {
    try {
      const existingApplications = JSON.parse(localStorage.getItem('jobApplications') || '{}');
      existingApplications[jobId] = application;
      localStorage.setItem('jobApplications', JSON.stringify(existingApplications));
      console.log('Saved job application to local storage:', { jobId, application });
    } catch (error) {
      console.error('Error saving job application to local storage:', error);
    }
  };
  
  // Helper function to get job application from local storage
  const getJobApplication = (jobId) => {
    try {
      const existingApplications = JSON.parse(localStorage.getItem('jobApplications') || '{}');
      return existingApplications[jobId];
    } catch (error) {
      console.error('Error getting job application from local storage:', error);
      return null;
    }
  };
  
  // Helper function to remove job application from local storage
  const removeJobApplication = (jobId) => {
    try {
      const existingApplications = JSON.parse(localStorage.getItem('jobApplications') || '{}');
      if (existingApplications[jobId]) {
        delete existingApplications[jobId];
        localStorage.setItem('jobApplications', JSON.stringify(existingApplications));
        console.log('Removed job application from local storage:', jobId);
      }
    } catch (error) {
      console.error('Error removing job application from local storage:', error);
    }
  };

  // Load local job applications from localStorage
  useEffect(() => {
    try {
      // Load job applications from localStorage
      const localApplications = getJobApplications();
      console.log('Loaded local job applications:', localApplications);
      
      // If we already have backend data, don't override it
      if (!acceptedJobsFromContext || Object.keys(acceptedJobsFromContext).length === 0) {
        const formattedApplications = {};
        
        // Convert to the format expected by components
        Object.keys(localApplications).forEach(jobId => {
          formattedApplications[jobId] = true;
        });
        
        // Only set if we have data to avoid overriding backend data
        if (Object.keys(formattedApplications).length > 0) {
          setAcceptedJobs(prev => {
            // If previous is an array, merge with array structure
            if (Array.isArray(prev)) {
              const newApps = Object.keys(formattedApplications).map(jobId => ({
                job: { _id: jobId },
                status: 'pending',
                appliedLocally: true
              }));
              
              // Filter out duplicates
              const existingIds = prev.map(app => app.job?._id);
              const uniqueNewApps = newApps.filter(app => !existingIds.includes(app.job._id));
              
              return [...prev, ...uniqueNewApps];
            }
            
            // Otherwise merge as object
            return { ...prev, ...formattedApplications };
          });
        }
      }
    } catch (error) {
      console.error('Error loading localStorage job applications:', error);
    }
  }, []);

  // Function to cancel a job application
  const handleCancelApplication = async (job) => {
    setCancellingJobIds(prev => new Set([...prev, job._id]));
    
    try {
      console.log('Attempting to cancel application for job:', job);
      
      // First, check if job has the application ID directly
      let applicationId = job.applicationId;
      
      // If not, check fetched applications from database
      if (!applicationId) {
        const applicationFromState = jobApplications[job._id];
        applicationId = applicationFromState?._id;
        console.log('Found application ID in database data:', applicationId);
      }
      
      // If still not found, try localStorage (fallback)
      if (!applicationId) {
        const applications = JSON.parse(localStorage.getItem('jobApplications') || '{}');
        const application = applications[job._id];
        applicationId = application?.applicationId;
        console.log('Fallback - found application in localStorage:', applicationId);
      }

      if (!applicationId) {
        console.error('Application ID not found for job:', job._id);
        toast.error('Unable to find application details');
        setCancellingJobIds(prev => {
          const newSet = new Set([...prev]);
          newSet.delete(job._id);
          return newSet;
        });
        return;
      }

      console.log('Cancelling application with ID:', applicationId);
      const response = await fetch(getApiUrl(`/api/job-applications/${applicationId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Check for errors in the response
      if (!response.ok) {
        let errorMessage = 'Failed to cancel application';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If the response isn't JSON, just use the default message
        }
        throw new Error(errorMessage);
      }

      // Parse the successful response
      const responseData = await response.json();
      console.log('Cancel response data:', responseData);

      // COMPREHENSIVE RESET OF APPLICATION STATE
      // 1. Remove from local storage
      removeJobApplication(job._id);
      
      // 2. Remove from acceptedJobs context state
      setAcceptedJobs(prev => 
        Array.isArray(prev) 
          ? prev.filter(app => app.job?._id !== job._id) 
          : prev
      );
      
      // 3. Remove from acceptedJobIds set
      setAcceptedJobIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(job._id);
        return newSet;
      });
      
      // 4. Update all local job state collections
      const resetJobState = (jobObj) => ({
        ...jobObj,
        status: 'active',
        isPending: false,
        isInProgress: false,
        isApplied: false,
        hasApplied: false,
        applicationId: null,
        application: null
      });
      
      // Update main jobs list
      setJobs(prevJobs => prevJobs.map(j => 
        j._id === job._id ? resetJobState(j) : j
      ));
      
      // Update location-based job lists
      setLocationBasedJobs(prev => prev.map(j => 
        j._id === job._id ? resetJobState(j) : j
      ));
      
      setOtherLocationJobs(prev => prev.map(j => 
        j._id === job._id ? resetJobState(j) : j
      ));
      
      // 5. Clean up any pending job records
      setPendingJobs(prev => {
        const updated = { ...prev };
        delete updated[job._id];
        localStorage.setItem('pendingJobs', JSON.stringify(updated));
        return updated;
      });

      // 6. Remove from job applications state
      setJobApplications(prev => {
        const newJobApps = { ...prev };
        delete newJobApps[job._id];
        return newJobApps;
      });
      
      toast.success('Application cancelled successfully');
      
      // 7. Fetch updated job list to ensure UI reflects server state
      setTimeout(() => {
        fetchJobs();
        fetchJobApplications();
      }, 500);
      
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast.error(error.message || 'Failed to cancel application');
    } finally {
      setCancellingJobIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(job._id);
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

  // Update the handleApplyForJob function - fix server communication
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

      // Prepare data for server first
      const applicationData = {
        jobId: job._id,
        workerId: userData.id,
        status: 'pending', // Start with pending status
        workerDetails: {
          name: userData.name,
          phone: userData.phone,
          skills: userData.skills || [],
          experience: userData.experience || '',
          location: userData.location || {},
          rating: userData.rating?.average || 0
        }
      };

      console.log('Sending job application to server:', applicationData);
      
      // Send to server FIRST before updating UI
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
      
      // Save to local storage
      saveJobApplication(job._id, localApplication);
      
      // Update UI state with server data
      setAcceptedJobs(prev => {
        const newApplication = {
          _id: applicationId,
          job: { _id: job._id, ...job },
          status: serverApplication.status || 'pending',
          appliedAt: serverApplication.appliedAt || new Date().toISOString(),
          applicationId: applicationId
        };
        return Array.isArray(prev) ? [...prev, newApplication] : [newApplication];
      });
      
      // Add to job applications state
      setJobApplications(prev => ({
        ...prev,
        [job._id]: localApplication
      }));
      
      // Add job ID to accepted jobs set
      setAcceptedJobIds(prev => new Set([...prev, job._id]));
      
      // Update the specific job in jobs list
      setJobs(prevJobs => prevJobs.map(j => {
        if (j._id === job._id) {
          return { 
            ...j, 
            hasApplied: true,
            application: localApplication,
            applicationStatus: serverApplication.status || 'pending'
          };
        }
        return j;
      }));
      
      // Update location-based jobs
      setLocationBasedJobs(prev => prev.map(j => 
        j._id === job._id 
          ? { ...j, hasApplied: true, application: localApplication } 
          : j
      ));
      
      setOtherLocationJobs(prev => prev.map(j => 
        j._id === job._id 
          ? { ...j, hasApplied: true, application: localApplication } 
          : j
      ));
      
      toast.success('Application submitted successfully! The employer will review your application.');
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchJobs();
        fetchJobApplications();
      }, 1000);

    } catch (error) {
      console.error('Application error:', error);
      
      // Remove from local storage if it was saved
      removeJobApplication(job._id);
      
      // Reset UI state
      setAcceptedJobs(prev => 
        Array.isArray(prev) 
          ? prev.filter(app => app.job?._id !== job._id) 
          : prev
      );
      
      setAcceptedJobIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(job._id);
        return newSet;
      });
      
      // Show appropriate error message
      if (error.message.includes('already applied')) {
        toast.error('You have already applied for this job');
      } else if (error.message.includes('not found')) {
        toast.error('Job not found or no longer available');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
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

  // Handler for edit form changes
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

  // Function to open job details modal
  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  // Function to close job details modal
  const closeJobDetails = () => {
    setSelectedJob(null);
    setShowJobDetails(false);
  };

  // Job Details Modal Component
  const JobDetailsModal = ({ job, isOpen, onClose }) => {
    if (!isOpen || !job) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
                  <p className="text-blue-100 text-lg">{job.companyName}</p>
                  <div className="flex items-center mt-2">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-100">{job.location?.city}, {job.location?.state}</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Job Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">₹{job.salary || 'Negotiable'}</div>
                  <div className="text-sm text-blue-700">Salary</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">{job.employmentType}</div>
                  <div className="text-sm text-green-700">Type</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">{job.category}</div>
                  <div className="text-sm text-purple-700">Category</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-lg font-semibold text-yellow-600">{job.urgency || 'Normal'}</div>
                  <div className="text-sm text-yellow-700">Priority</div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {job.description || 'No detailed description provided for this position.'}
                </p>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{job.requirements}</p>
                  </div>
                </div>
              )}

              {/* Skills Required */}
              {job.skillsRequired && job.skillsRequired.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skillsRequired.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{job.duration || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{job.startDate ? formatDate(job.startDate) : 'Immediate'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Working Hours:</span>
                      <span className="font-medium">{job.workingHours || '8 hours/day'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience Level:</span>
                      <span className="font-medium">{job.experienceLevel || 'Entry Level'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Employer Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{job.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Industry:</span>
                      <span className="font-medium">{job.industry || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium">{job.contactPhone || 'Via platform'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posted:</span>
                      <span className="font-medium">{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits & Perks</h3>
                  <div className="grid md:grid-cols-2 gap-2">
                    {job.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Instructions */}
              {job.applicationInstructions && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Instructions</h3>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800">{job.applicationInstructions}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Job ID: #{job._id?.substring(0, 8) || 'N/A'}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  {user && user.type === 'worker' && !isJobAccepted(job._id) && (
                    <button
                      onClick={() => {
                        onClose();
                        handleApplyForJob(job);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

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
        className={`bg-white rounded-xl shadow-md overflow-hidden border 
          ${hasApplied ? 'border-green-300' : 'border-gray-200'} 
          ${jobIsInProgress ? 'bg-blue-50' : isApplicationAccepted ? 'bg-green-50' : ''}
          hover:shadow-lg transition-all duration-300`}
        whileHover={{ scale: 1.02 }}
      >
        {/* Status Banner */}
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
              {jobIsInProgress ? 'Job In Progress' : 
               isApplicationAccepted ? 'Application Accepted' : 
               'Application Submitted'}
            </div>
          </div>
        )}
        
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{job.title}</h3>
              <p className="text-lg font-medium text-blue-600 mb-2">{job.companyName}</p>
              
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center text-gray-600 text-sm">
                  <svg className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="truncate">{job.location?.city}, {job.location?.state}</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <svg className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>₹{job.salary || 'Negotiable'}</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <svg className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{job.employmentType}</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <svg className="flex-shrink-0 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>{job.category}</span>
                </div>
              </div>
            </div>
            
            {/* Urgency Badge */}
            {job.urgency && job.urgency !== 'Normal' && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                job.urgency === 'Urgent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {job.urgency}
              </span>
            )}
          </div>
          
          {/* Job Preview */}
          {job.description && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 line-clamp-2">
                {job.description.length > 100 
                  ? `${job.description.substring(0, 100)}...` 
                  : job.description}
              </p>
            </div>
          )}

          {/* Skills Required Preview */}
          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Skills Required:</p>
              <div className="flex flex-wrap gap-1">
                {job.skillsRequired.slice(0, 3).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
                {job.skillsRequired.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{job.skillsRequired.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Application Info */}
          {application && (
            <div className="mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              Applied: {formatDate(application.appliedAt || application.createdAt)}
              {application.applicationId && <span className="ml-2">ID: #{application.applicationId.substring(0, 6)}</span>}
            </div>
          )}
          
          {/* Action Area */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              {/* Status Display */}
              <div className="flex flex-col">
                {hasApplied ? (
                  <>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isPending(application?.status) ? 'bg-yellow-100 text-yellow-800' : 
                      isInProgress(application?.status) ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {application?.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Applied'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {isPending(application?.status) ? 'Waiting for employer response' : 
                       isAccepted(application?.status) ? 'Ready to start work' : 
                       'Work in progress'}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center text-gray-500 text-sm">
                    <span>Ready to apply</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                {/* View Details Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewJobDetails(job);
                  }}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Details
                </button>
                
                {/* Main Action Button */}
                {hasApplied ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelApplication(application?.applicationId ? {...job, applicationId: application.applicationId} : job);
                    }}
                    disabled={cancellingJobIds.has(job._id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      cancellingJobIds.has(job._id) 
                        ? 'bg-gray-300 text-gray-500 cursor-wait' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    } transition-colors`}
                  >
                    {cancellingJobIds.has(job._id) ? 'Cancelling...' : 'Cancel'}
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyForJob(job);
                    }}
                    disabled={acceptingJobIds.has(job._id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      acceptingJobIds.has(job._id) 
                        ? 'bg-green-500 text-white cursor-wait' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } transition-colors`}
                  >
                    {acceptingJobIds.has(job._id) ? 'Applying...' : 'Apply Now'}
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
        <button
          className="px-4 py-2 bg-green-500 text-white rounded ml-2"
          onClick={() => {
            console.log('Test mode button clicked');
            setTestMode(true);
            setJobs([
              {
                _id: 'test-job-1',
                title: 'Test Job 1',
                companyName: 'Test Company 1',
                status: 'active',
                salary: 1000,
                location: { city: 'Test City', state: 'Test State' },
                description: 'This is a test job to verify the UI is working',
                category: 'Test',
                employmentType: 'full-time'
              },
              {
                _id: 'test-job-2',
                title: 'Test Job 2 (In Progress)',
                companyName: 'Test Company 2',
                status: 'in-progress',
                salary: 1500,
                location: { city: 'Test City 2', state: 'Test State 2' },
                description: 'This is another test job',
                category: 'Test',
                employmentType: 'part-time'
              }
            ]);
            setLoading(false);
          }}
        >
          Test Mode: Set Test Jobs
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {t('jobs.title')}
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            {user && user.type === 'worker' && user.location?.state
              ? `${t('jobs.findInLocation')} ${user.location.state}`
              : t('jobs.findPerfectJob')}
          </p>
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-6">
              <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4zm16 0a8 8 0 01-8 8v-4a4 4 0 004-4h4z"></path>
              </svg>
              <p className="mt-2 text-gray-500">{t('jobs.loading')}</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-6">
              <p className="text-red-500 font-semibold">{t('jobs.errorLoading')}</p>
              <button
                onClick={fetchJobs}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('jobs.retry')}
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="col-span-full text-center py-6">
              <p className="text-gray-500">{t('jobs.noResults')}</p>
              <div className="mt-2 text-xs text-gray-400">
                Debug: jobs.length = {jobs.length}, loading = {loading.toString()}
              </div>
            </div>
          ) : (
            <>
              <div className="col-span-full text-xs text-gray-400 mb-4">
                Debug: Rendering {jobs.length} jobs
              </div>
              {jobs.map(job => renderJobCard(job))}
            </>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal 
        job={selectedJob} 
        isOpen={showJobDetails} 
        onClose={closeJobDetails} 
      />
    </div>
  );
};

export default AvailableJobs;