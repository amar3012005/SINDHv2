import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const MyApplications = () => {
  const { user, isLoadingUser, acceptedJobs, setAcceptedJobs } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    if (!user || user.type !== 'worker') {
      setLoading(false);
      // setError('Please log in as a worker to view applications.');
      setAcceptedJobs([]);
      return;
    }

    console.log('Fetching applications for worker:', user.id);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/jobs/worker/${user.id}/accepted-jobs`);

      if (!response.ok) {
        if (response.status === 404) {
           console.log('No applications found for this worker.');
           setAcceptedJobs([]);
           return; // No error if no applications
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched applications:', data);
      setAcceptedJobs(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to fetch applications.');
      toast.error('Failed to load your job applications.');
      setAcceptedJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user, setAcceptedJobs]); // Depend on user and setAcceptedJobs

  useEffect(() => {
    // Only fetch if user is loaded and is a worker
    if (!isLoadingUser && user && user.type === 'worker') {
       fetchApplications();
    }
    // If user is loaded but not a worker, clear applications
    if (!isLoadingUser && (!user || user.type !== 'worker')){
        setAcceptedJobs([]);
    }
  }, [user, isLoadingUser, fetchApplications, setAcceptedJobs]);

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.type !== 'worker') {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                  <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Access Denied</h2>
                  <p className="mt-2 text-sm text-gray-600">Please log in as a worker to view your applications.</p>
              </div>
          </div>
      );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            My Job Applications
          </h1>
          <p className="text-xl text-gray-600">
            Review the status of your job applications
          </p>
        </motion.div>

        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && <div className="text-center text-red-600 mb-6">{error}</div>}

        {!loading && !error && acceptedJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No job applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven\'t applied for any jobs yet.
            </p>
          </motion.div>
        )}

        {!loading && !error && acceptedJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {acceptedJobs.map(application => (
              <motion.div
                key={application._id} // Use application ID as key
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">{application.job?.title || 'Job Title'}</h3>
                  <p className="mt-1 text-sm text-gray-500">Employer: {application.employer?.name || 'N/A'}</p>
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <span className="mr-2">Status:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : application.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {application.status}
                    </span>
                  </div>
                  {/* You can add more job details or application details here */}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyApplications; 