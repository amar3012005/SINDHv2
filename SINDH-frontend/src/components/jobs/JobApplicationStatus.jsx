import React from 'react';
import { hasAppliedForJob, getJobApplications } from '../../utils/jobApplicationUtils';

/**
 * Component to display application status badge for a job
 * @param {Object} props - Component props
 * @param {string} props.jobId - ID of the job to check
 * @param {Object} props.acceptedJobs - Backend job application data
 * @returns {JSX.Element} - Application status badge or null
 */
const JobApplicationStatus = ({ jobId, acceptedJobs = {} }) => {
  // Check if job is accepted from backend data
  const isAcceptedFromBackend = Array.isArray(acceptedJobs) 
    ? acceptedJobs.some(app => app.job?._id === jobId) 
    : acceptedJobs[jobId];
  
  // Check if job has been applied for in localStorage
  const isAppliedLocally = hasAppliedForJob(jobId);

  // If no application exists, don't render anything
  if (!isAcceptedFromBackend && !isAppliedLocally) {
    return null;
  }
  
  // Get application details from localStorage
  const applications = getJobApplications();
  const localDetails = applications[jobId] || {};
  
  // Format the date if available
  let formattedDate = '';
  if (localDetails.appliedAt) {
    try {
      const date = new Date(localDetails.appliedAt);
      formattedDate = date.toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
    }
  }

  return (
    <div className="mt-2">
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
        <svg className="mr-1.5 h-2 w-2 text-green-600" fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
        You applied for this job {formattedDate ? `on ${formattedDate}` : ''}
      </span>
    </div>
  );
};

export default JobApplicationStatus;
