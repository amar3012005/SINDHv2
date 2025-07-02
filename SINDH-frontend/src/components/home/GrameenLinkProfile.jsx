import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { getApiUrl } from '../../utils/apiUtils';

const GrameenLinkProfile = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [jobCount, setJobCount] = useState(0);
  const [showJobNotification, setShowJobNotification] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  // Fetch job count from backend
  const fetchJobCount = async () => {
    try {
      const response = await fetch(getApiUrl('/api/jobs'), {
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
        
        // Show notification if user is a worker and hasn't seen it in this session
        if (user?.type === 'worker' && activeJobs.length > 0 && !hasShownNotification) {
          setShowJobNotification(true);
          setHasShownNotification(true);
          
          // Also show as toast notification
          toast.info(`🎯 ${activeJobs.length} job${activeJobs.length !== 1 ? 's' : ''} available for you!`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching job count:', error);
    }
  };

  // Fetch job count when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchJobCount();
    }
  }, [user]);

  // Show notification after a delay when component mounts
  useEffect(() => {
    if (user?.type === 'worker' && jobCount > 0 && !hasShownNotification) {
      const timer = setTimeout(() => {
        setShowJobNotification(true);
        setHasShownNotification(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [jobCount, user, hasShownNotification]);

  if (!user) return null;

  const handleProfileClick = () => {
    const profilePath = user.type === 'worker' ? '/worker/profile' : '/employer/profile';
    navigate(profilePath);
  };

  const handleViewJobs = () => {
    navigate('/jobs');
    setShowJobNotification(false);
  };

  const handleCloseNotification = () => {
    setShowJobNotification(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-lg shadow-lg border border-blue-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {user.name?.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">GrameenLink Profile</h3>
              <p className="text-sm text-gray-600 capitalize">{user.type}</p>
              {user.type === 'worker' && jobCount > 0 && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  {jobCount} job{jobCount !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleProfileClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Profile
            </button>
            {user.type === 'worker' && jobCount > 0 && (
              <button
                onClick={handleViewJobs}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                View Jobs ({jobCount})
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Job Count Popup Notification */}
      <AnimatePresence>
        {showJobNotification && user?.type === 'worker' && jobCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-6 rounded-lg shadow-2xl border border-white/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Jobs Available!</h4>
                    <p className="text-sm text-white/90">
                      {jobCount} job{jobCount !== 1 ? 's' : ''} waiting for you
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseNotification}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleViewJobs}
                  className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  View Jobs
                </button>
                <button
                  onClick={handleCloseNotification}
                  className="px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GrameenLinkProfile;
