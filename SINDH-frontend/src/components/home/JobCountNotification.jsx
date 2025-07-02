import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { getApiUrl } from '../../utils/apiUtils';
import { useUser } from '../../context/UserContext';

const JobCountNotification = ({ 
  showOnMount = true, 
  delay = 2000,
  showToast = true 
}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [jobCount, setJobCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Fetch job count from backend
  const fetchJobCount = async () => {
    try {
      let url = getApiUrl('/api/jobs');
      
      // Add location filter if user has location
      if (user?.location?.state) {
        url += `?location=${encodeURIComponent(user.location.state)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const jobs = await response.json();
        const activeJobs = Array.isArray(jobs) ? jobs.filter(job => job.status === 'active') : [];
        setJobCount(activeJobs.length);
        
        // Show toast notification if enabled
        if (showToast && user?.type === 'worker' && activeJobs.length > 0 && !hasShownNotification) {
          const locationText = user.location?.state ? ` in ${user.location.state}` : '';
          toast.success(`🎯 ${activeJobs.length} job${activeJobs.length !== 1 ? 's' : ''} available${locationText}!`, {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
        
        return activeJobs.length;
      }
    } catch (error) {
      console.error('Error fetching job count:', error);
      return 0;
    }
  };

  // Fetch job count when component mounts or user changes
  useEffect(() => {
    if (user?.type === 'worker') {
      fetchJobCount();
    }
  }, [user]);

  // Show popup notification after delay
  useEffect(() => {
    if (showOnMount && user?.type === 'worker' && jobCount > 0 && !hasShownNotification) {
      const timer = setTimeout(() => {
        setShowNotification(true);
        setHasShownNotification(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [jobCount, user, hasShownNotification, showOnMount, delay]);

  const handleViewJobs = () => {
    navigate('/jobs');
    setShowNotification(false);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // Function to manually trigger notification
  const triggerNotification = async () => {
    const count = await fetchJobCount();
    if (count > 0) {
      setShowNotification(true);
    }
  };

  // Don't render anything if user is not a worker or no jobs
  if (!user || user.type !== 'worker' || jobCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 100 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-green-500 text-white p-6 rounded-xl shadow-2xl border border-white/20 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-lg">New Jobs Available!</h4>
                  <p className="text-sm text-white/90">
                    {jobCount} job{jobCount !== 1 ? 's' : ''} {user.location?.state ? `in ${user.location.state}` : 'waiting for you'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseNotification}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleViewJobs}
                className="flex-1 bg-white text-blue-600 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-md"
              >
                View All Jobs
              </button>
              <button
                onClick={handleCloseNotification}
                className="px-4 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JobCountNotification;
