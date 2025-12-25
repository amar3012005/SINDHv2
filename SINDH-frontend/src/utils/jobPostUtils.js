/**
 * Utility functions for job post management
 */

// Save a new job post to localStorage
export const saveJobPost = (job) => {
  try {
    // Get existing posted jobs
    const existingJobs = getPostedJobs();
    
    // Check if job already exists, if so update it
    const jobIndex = existingJobs.findIndex(j => j._id === job._id);
    
    if (jobIndex >= 0) {
      // Update existing job
      existingJobs[jobIndex] = { ...existingJobs[jobIndex], ...job };
    } else {
      // Add new job
      existingJobs.push(job);
    }
    
    // Save back to localStorage
    localStorage.setItem('postedJobs', JSON.stringify(existingJobs));
    console.log(`Job ${job._id} saved to localStorage`);
    
    return true;
  } catch (error) {
    console.error('Error saving job to localStorage:', error);
    return false;
  }
};

// Get all posted jobs from localStorage
export const getPostedJobs = () => {
  try {
    const storedJobs = localStorage.getItem('postedJobs');
    return storedJobs ? JSON.parse(storedJobs) : [];
  } catch (error) {
    console.error('Error getting posted jobs from localStorage:', error);
    return [];
  }
};

// Get a specific job by ID from localStorage
export const getJobById = (jobId) => {
  try {
    const jobs = getPostedJobs();
    return jobs.find(job => job._id === jobId) || null;
  } catch (error) {
    console.error('Error getting job by ID from localStorage:', error);
    return null;
  }
};

// Remove a job from localStorage
export const removeJobPost = (jobId) => {
  try {
    const jobs = getPostedJobs();
    const filteredJobs = jobs.filter(job => job._id !== jobId);
    localStorage.setItem('postedJobs', JSON.stringify(filteredJobs));
    console.log(`Job ${jobId} removed from localStorage`);
    return true;
  } catch (error) {
    console.error('Error removing job from localStorage:', error);
    return false;
  }
};

// Update job applications count in localStorage
export const updateJobApplicationsCount = (jobId, count) => {
  try {
    const jobs = getPostedJobs();
    const jobIndex = jobs.findIndex(job => job._id === jobId);
    
    if (jobIndex >= 0) {
      jobs[jobIndex].applicationsCount = count;
      localStorage.setItem('postedJobs', JSON.stringify(jobs));
      console.log(`Updated applications count for job ${jobId} to ${count}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating job applications count:', error);
    return false;
  }
};
