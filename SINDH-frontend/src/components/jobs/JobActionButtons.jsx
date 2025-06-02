// Standalone component for job action buttons
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { isWorker, getCurrentUser } from '../../utils/authUtils';
import { hasAppliedForJob, saveJobApplication } from '../../utils/jobApplicationUtils';

const JobActionButtons = ({ job, onAccept, onViewDetails, acceptedJobs }) => {
  // Get both sources of user info
  const { user } = useUser();
  const localStorageUserType = localStorage.getItem('userType');
  const localUser = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Local state to track if job is applied for
  const [jobApplied, setJobApplied] = useState(false);
  
  // Check if job is already accepted from the backend data
  const isJobAcceptedFromBackend = Array.isArray(acceptedJobs) 
    ? acceptedJobs.some(app => app.job?._id === job._id) 
    : acceptedJobs[job._id];
    
  // Combined check - job is accepted if it's in backend data OR localStorage
  const isJobAccepted = isJobAcceptedFromBackend || jobApplied;
  
  // Check localStorage on component mount
  useEffect(() => {
    // Check if this job has been applied for in localStorage
    const applied = hasAppliedForJob(job._id);
    setJobApplied(applied);
  }, [job._id]);
  
  // Debug output
  console.log('JobActionButtons rendering:', {
    'user from context': user,
    'user from localStorage': localUser,
    'userType from localStorage': localStorageUserType,
    'isWorker() result': isWorker(),
    'job accepted from backend': isJobAcceptedFromBackend,
    'job applied locally': jobApplied,
    'combined job accepted': isJobAccepted
  });
  
  // Check if we should show worker actions
  const showWorkerActions = (user && user.type === 'worker') || 
                           (localUser && localUser.type === 'worker') || 
                           localStorageUserType === 'worker' || 
                           isWorker();
  
  // Determine button label
  const acceptButtonLabel = isJobAccepted ? 'You have already applied for this job ✓' : 'Accept Job';
  
  // Button style - make it visually clear when already applied
  const acceptButtonStyle = isJobAccepted
    ? 'bg-green-500 opacity-90 cursor-not-allowed'
    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800';
    
  // Extra class to add checkmark icon when already applied
  const iconClass = isJobAccepted ? 'flex items-center justify-center' : '';
    
  // Handle clicks
  const handleAcceptClick = () => {
    // If already applied, don't do anything
    if (isJobAccepted) {
      toast.info('You have already applied for this job');
      return;
    }
    
    if (!user && !getCurrentUser()) {
      toast.error('Please login as a worker to accept jobs');
      return;
    }
    
    // Save to localStorage immediately
    saveJobApplication(job._id, {
      title: job.title,
      company: job.company || job.companyName,
      salary: job.salary,
      location: job.location,
      category: job.category,
      employmentType: job.employmentType,
      appliedAt: new Date().toISOString()
    });
    
    // Update local state immediately to prevent multiple clicks
    setJobApplied(true);
    
    // Call the passed-in accept handler that will talk to the backend
    onAccept(job._id);
  };
  
  return (
    <div className="mt-4 space-y-3">
      {/* Debug info */}
      <div className="text-xs text-gray-500">
        User: {user ? `${user.name || 'Unknown'} (${user.type || 'No type'})` : 'Not logged in'}
        | isWorker: {isWorker() ? 'Yes' : 'No'}
      </div>
      
      {showWorkerActions && (
        <motion.button
          whileHover={isJobAccepted ? {} : { scale: 1.05 }}
          whileTap={isJobAccepted ? {} : { scale: 0.95 }}
          onClick={handleAcceptClick}
          disabled={isJobAccepted}
          className={`w-full px-4 py-2 rounded-md text-white font-medium ${acceptButtonStyle} ${iconClass}`}
          aria-disabled={isJobAccepted}
        >
          {isJobAccepted ? (
            <>
              <span>You have already applied for this job</span>
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          ) : (
            'Accept Job'
          )}
        </motion.button>
      )}
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewDetails(job._id)}
        className="w-full px-4 py-2 rounded-md text-blue-600 border-2 border-blue-600 font-medium hover:bg-blue-50"
      >
        View Details
      </motion.button>
    </div>
  );
};

export default JobActionButtons;
