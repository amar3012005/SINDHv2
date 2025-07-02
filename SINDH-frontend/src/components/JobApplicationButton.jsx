import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const JobApplicationButton = ({ jobId, workerId, onApplicationSubmit }) => {
  const [isApplied, setIsApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://sindh-backend.onrender.comapi/job-applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, workerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply for job');
      }

      setIsApplied(true);
      toast.success('Application submitted successfully!');
      
      // Show success animation
      const successAnimation = document.createElement('div');
      successAnimation.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50';
      successAnimation.innerHTML = `
        <div class="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Application Submitted!
        </div>
      `;
      document.body.appendChild(successAnimation);
      
      // Remove animation after 2 seconds
      setTimeout(() => {
        document.body.removeChild(successAnimation);
      }, 2000);

      if (onApplicationSubmit) {
        onApplicationSubmit();
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to apply for job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {!isApplied ? (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleApply}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-md text-white font-medium ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Applying...' : 'Apply Now'}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-4 py-2 rounded-md bg-green-100 text-green-700 font-medium text-center"
          >
            Application Sent ✓
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => window.location.href = `/jobs/${jobId}`}
        className="w-full px-4 py-2 rounded-md text-blue-600 border-2 border-blue-600 font-medium hover:bg-blue-50"
      >
        View Details
      </motion.button>
    </div>
  );
};

export default JobApplicationButton; 