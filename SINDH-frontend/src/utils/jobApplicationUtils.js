/**
 * Job Applications utility to track applied jobs in localStorage
 */

// Add user-specific prefix to storage keys
const getUserPrefix = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  return user.id ? `${user.id}_` : '';
};

const getStorageKey = (baseKey) => `${getUserPrefix()}${baseKey}`;

// Update storage keys to be user-specific
const JOB_APPLICATIONS_KEY = 'indus_job_applications';
const PAST_JOBS_KEY = 'indus_past_jobs';
const CURRENT_APPLICATIONS_KEY = 'indus_current_applications';

/**
 * Get all job applications from localStorage
 * @returns {Object} Map of job IDs to application timestamps
 */
export const getJobApplications = () => {
  try {
    const key = getStorageKey(JOB_APPLICATIONS_KEY);
    const storedApplications = localStorage.getItem(key);
    return storedApplications ? JSON.parse(storedApplications) : {};
  } catch (e) {
    console.error('Error getting job applications from localStorage:', e);
    return {};
  }
};

/**
 * Check if a job has already been applied for
 * @param {string} jobId - The ID of the job to check
 * @returns {boolean} True if the job has been applied for
 */
export const hasAppliedForJob = (jobId) => {
  if (!jobId) return false;
  
  const applications = getJobApplications();
  return !!applications[jobId];
};

/**
 * Save a job application to localStorage
 * @param {string} jobId - The ID of the job applied for
 * @param {Object} jobData - Optional additional job data to store
 */
export const saveJobApplication = (jobId, jobData = {}) => {
  try {
    if (!jobId) return;
    
    // Get both storage locations
    const applications = getJobApplications();
    const currentApps = getCurrentApplications();
    
    // Prepare application data with timestamp
    const applicationData = {
      appliedAt: new Date().toISOString(),
      status: jobData.status || 'pending',
      employer: jobData.employer || null,
      job: jobData.job || null,
      acceptedAt: jobData.status === 'accepted' ? new Date().toISOString() : null,
      completedAt: jobData.status === 'completed' ? new Date().toISOString() : null,
      ...jobData
    };
    
    // Store in appropriate locations based on status
    if (applicationData.status === 'completed') {
      const pastJobs = getPastJobs();
      pastJobs[jobId] = applicationData;
      localStorage.setItem(PAST_JOBS_KEY, JSON.stringify(pastJobs));
      
      // Remove from current applications if it exists
      if (currentApps[jobId]) {
        delete currentApps[jobId];
        localStorage.setItem(CURRENT_APPLICATIONS_KEY, JSON.stringify(currentApps));
      }
    } else {
      // Store in both active locations
      applications[jobId] = applicationData;
      currentApps[jobId] = applicationData;
      
      // Save to localStorage
      localStorage.setItem(JOB_APPLICATIONS_KEY, JSON.stringify(applications));
      localStorage.setItem(CURRENT_APPLICATIONS_KEY, JSON.stringify(currentApps));
    }
    
    console.log(`Job application for ${jobId} saved to localStorage with status: ${applicationData.status}`);
    
    // Update user's job history in localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      if (!user.jobHistory) {
        user.jobHistory = { current: [], past: [] };
      }
      
      // Update job history based on status
      if (applicationData.status === 'completed') {
        user.jobHistory.past = user.jobHistory.past.filter(job => job._id !== jobId);
        user.jobHistory.past.push(applicationData);
      } else {
        user.jobHistory.current = user.jobHistory.current.filter(job => job._id !== jobId);
        user.jobHistory.current.push(applicationData);
      }
      
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch (e) {
    console.error('Error saving job application to localStorage:', e);
  }
};

/**
 * Remove a job application from localStorage
 * @param {string} jobId - The ID of the job to remove
 */
export const removeJobApplication = (jobId) => {
  try {
    if (!jobId) return;
    
    // Remove from all storage locations
    const applications = getJobApplications();
    const currentApps = getCurrentApplications();
    const pastJobs = getPastJobs();
    
    // Remove from each storage if it exists
    if (applications[jobId]) {
      delete applications[jobId];
      localStorage.setItem(JOB_APPLICATIONS_KEY, JSON.stringify(applications));
    }
    
    if (currentApps[jobId]) {
      delete currentApps[jobId];
      localStorage.setItem(CURRENT_APPLICATIONS_KEY, JSON.stringify(currentApps));
    }
    
    if (pastJobs[jobId]) {
      delete pastJobs[jobId];
      localStorage.setItem(PAST_JOBS_KEY, JSON.stringify(pastJobs));
    }
    
    console.log(`Job application for ${jobId} removed from all storage locations`);
  } catch (e) {
    console.error('Error removing job application from localStorage:', e);
  }
};

/**
 * Clear all job applications from localStorage
 */
export const clearAllJobApplications = () => {
  try {
    const prefix = getUserPrefix();
    // Remove all user-specific job application data
    localStorage.removeItem(getStorageKey(JOB_APPLICATIONS_KEY));
    localStorage.removeItem(getStorageKey(CURRENT_APPLICATIONS_KEY));
    localStorage.removeItem(getStorageKey(PAST_JOBS_KEY));
    console.log('All job applications cleared for current user');
  } catch (e) {
    console.error('Error clearing job applications from localStorage:', e);
  }
};

/**
 * Get all current job applications
 * @returns {Object} Map of job IDs to current application details
 */
export const getCurrentApplications = () => {
  try {
    const storedApplications = localStorage.getItem(CURRENT_APPLICATIONS_KEY);
    return storedApplications ? JSON.parse(storedApplications) : {};
  } catch (e) {
    console.error('Error getting current job applications:', e);
    return {};
  }
};

/**
 * Get all past jobs
 * @returns {Object} Map of job IDs to past job details
 */
export const getPastJobs = () => {
  try {
    const storedJobs = localStorage.getItem(PAST_JOBS_KEY);
    return storedJobs ? JSON.parse(storedJobs) : {};
  } catch (e) {
    console.error('Error getting past jobs:', e);
    return {};
  }
};

/**
 * Move a job application from current to past jobs
 * @param {string} jobId - The ID of the job to move
 * @param {Object} jobData - Optional additional job data to store
 */
export const moveToPastJobs = (jobId, jobData = {}) => {
  try {
    if (!jobId) return;
    
    // Get current applications and past jobs
    const currentApps = getCurrentApplications();
    const pastJobs = getPastJobs();
    
    // If the job exists in current applications, move it to past jobs
    if (currentApps[jobId]) {
      pastJobs[jobId] = {
        ...currentApps[jobId],
        ...jobData,
        completedAt: new Date().toISOString()
      };
      delete currentApps[jobId];
      
      // Save updated data
      localStorage.setItem(CURRENT_APPLICATIONS_KEY, JSON.stringify(currentApps));
      localStorage.setItem(PAST_JOBS_KEY, JSON.stringify(pastJobs));
      
      console.log(`Job ${jobId} moved to past jobs`);
    }
  } catch (e) {
    console.error('Error moving job to past jobs:', e);
  }
};

/**
 * Update the status of a job application
 * @param {string} jobId - The ID of the job to update
 * @param {string} status - The new status ('pending', 'accepted', 'rejected', 'completed', 'failed')
 * @param {Object} additionalData - Optional additional data to store with the status update
 */
export const updateApplicationStatus = async (jobId, status, additionalData = {}) => {
  try {
    if (!jobId) return;
    
    const currentApps = getCurrentApplications();
    const applications = getJobApplications();
    
    // First update status in backend
    try {
      const response = await fetch(`https://sindh-backend.onrender.comapi/job-applications/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update status in backend');
      }

      // If it's a completion request, use the complete endpoint
      if (status === 'completed') {
        const completeResponse = await fetch(`https://sindh-backend.onrender.comapi/job-applications/${jobId}/complete`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!completeResponse.ok) {
          throw new Error('Failed to mark job as completed in backend');
        }
      }
    } catch (error) {
      console.error('Error updating status in backend:', error);
      throw error;
    }
    
    // Then update local storage
    switch (status) {
      case 'completed':
        // Move to past jobs if marked as completed
        moveToPastJobs(jobId, { ...additionalData, status });
        break;
        
      case 'failed':
        // Remove failed applications
        removeJobApplication(jobId);
        delete currentApps[jobId];
        break;
        
      default:
        // Update status in both storage locations
        if (applications[jobId]) {
          applications[jobId] = {
            ...applications[jobId],
            ...additionalData,
            status,
            updatedAt: new Date().toISOString()
          };
        }
        
        if (currentApps[jobId]) {
          currentApps[jobId] = {
            ...currentApps[jobId],
            ...additionalData,
            status,
            updatedAt: new Date().toISOString()
          };
        }
        break;
    }
    
    // Save updates to localStorage
    localStorage.setItem(JOB_APPLICATIONS_KEY, JSON.stringify(applications));
    localStorage.setItem(CURRENT_APPLICATIONS_KEY, JSON.stringify(currentApps));
    
    console.log(`Job ${jobId} status updated to ${status}`);
  } catch (e) {
    console.error('Error updating job application status:', e);
  }
};

// Add new utility function to clear all data for a specific user
export const clearUserJobData = (userId) => {
  try {
    const prefix = `${userId}_`;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('Error clearing user job data:', e);
  }
};

/**
 * Fetch current jobs from backend and update local storage
 * @param {string} workerId - The ID of the worker
 * @returns {Promise<Array>} Array of current job applications
 */
export const fetchCurrentJobs = async (workerId) => {
  try {
    const response = await fetch(`https://sindh-backend.onrender.comapi/job-applications/worker/${workerId}/current`);
    if (!response.ok) {
      throw new Error('Failed to fetch current jobs');
    }

    const currentJobs = await response.json();
    const currentJobsMap = {};

    // Convert array to map for local storage
    currentJobs.forEach(job => {
      currentJobsMap[job.job._id] = {
        status: job.status,
        appliedAt: job.appliedAt,
        updatedAt: job.updatedAt,
        ...job.job
      };
    });

    // Update local storage
    localStorage.setItem(
      getStorageKey(CURRENT_APPLICATIONS_KEY), 
      JSON.stringify(currentJobsMap)
    );

    return currentJobs;
  } catch (error) {
    console.error('Error fetching current jobs:', error);
    throw error;
  }
};

/**
 * Fetch past jobs from backend and update local storage
 * @param {string} workerId - The ID of the worker
 * @returns {Promise<Array>} Array of past job applications
 */
export const fetchPastJobs = async (workerId) => {
  try {
    const response = await fetch(`https://sindh-backend.onrender.comapi/job-applications/worker/${workerId}/past`);
    if (!response.ok) {
      throw new Error('Failed to fetch past jobs');
    }

    const pastJobs = await response.json();
    const pastJobsMap = {};

    // Convert array to map for local storage
    pastJobs.forEach(job => {
      pastJobsMap[job.job._id] = {
        status: job.status,
        appliedAt: job.appliedAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt,
        ...job.job
      };
    });

    // Update local storage
    localStorage.setItem(
      getStorageKey(PAST_JOBS_KEY), 
      JSON.stringify(pastJobsMap)
    );

    return pastJobs;
  } catch (error) {
    console.error('Error fetching past jobs:', error);
    throw error;
  }
};
