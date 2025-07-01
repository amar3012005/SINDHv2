import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { 
  updateApplicationStatus, 
  getCurrentApplications, 
  getPastJobs, 
  moveToPastJobs 
} from '../../utils/jobApplicationUtils';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [cancellingJobIds, setCancellingJobIds] = useState(new Set());
  const navigate = useNavigate();
  const { user } = useUser();

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const workerId = user?.id;
      if (!workerId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Fetch current applications from backend
      console.log(`Fetching applications for worker ID: ${workerId}`);
      
      // Split into two requests to improve error handling
      const [currentResponse, pastResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/job-applications/worker/${workerId}/current`),
        fetch(`http://localhost:5000/api/job-applications/worker/${workerId}/past`)
      ]);
      
      if (!currentResponse.ok) {
        const errorText = await currentResponse.text();
        console.error('Error response from current applications:', errorText);
        throw new Error('Failed to fetch current applications');
      }
      
      if (!pastResponse.ok) {
        const errorText = await pastResponse.text();
        console.error('Error response from past applications:', errorText);
        throw new Error('Failed to fetch past applications');
      }
      
      // Parse the responses
      const currentData = await currentResponse.json();
      const pastData = await pastResponse.json();
      
      console.log('Current applications fetched:', currentData.length);
      console.log('Past applications fetched:', pastData.length);

      // Get local applications data for merging
      const localCurrentApps = getCurrentApplications();
      const localPastJobs = getPastJobs();

      // Merge backend data with local data for better offline support
      const mergedCurrentApps = currentData.map(app => {
        const localApp = localCurrentApps[app.job?._id];
        if (localApp) {
          return { ...app, localData: localApp };
        }
        return app;
      });

      // Add any local past jobs not in the backend data
      const mergedPastJobs = [...pastData];
      Object.entries(localPastJobs).forEach(([jobId, jobData]) => {
        if (!mergedPastJobs.some(app => app.job?._id === jobId)) {
          mergedPastJobs.push({
            job: { _id: jobId, ...jobData },
            status: 'completed',
            completedAt: jobData.completedAt
          });
        }
      });

      setApplications(mergedCurrentApps);
      setPastJobs(mergedPastJobs);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message || 'Failed to load your applications. Please try again later.');
      // Don't clear existing data on error to maintain last known good state
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchApplications();
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      // Update in backend
      const response = await fetch(`http://localhost:5000/api/job-applications/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Update local storage and state
      if (newStatus === 'completed') {
        moveToPastJobs(jobId);
        setApplications(prev => prev.filter(app => app.job._id !== jobId));
        setPastJobs(prev => [...prev, {
          ...applications.find(app => app.job._id === jobId),
          status: 'completed',
          completedAt: new Date().toISOString()
        }]);
      } else {
        updateApplicationStatus(jobId, newStatus);
        setApplications(prev => prev.map(app => 
          app.job._id === jobId ? { ...app, status: newStatus } : app
        ));
      }

      toast.success(`Job status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update job status');
    }
  };

  const handleCancelApplication = async (application) => {
    try {
      const jobId = application.job._id;
      const applicationId = application._id;
      
      setCancellingJobIds(prev => new Set([...prev, jobId]));
      
      console.log('Cancelling application:', applicationId);
      
      const response = await fetch(`http://localhost:5000/api/job-applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel application');
      }

      // Update UI by removing the cancelled application
      setApplications(prev => prev.filter(app => app._id !== applicationId));
      
      toast.success('Application cancelled successfully');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleViewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  if (loading && !applications.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Current Applications Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Applications</h2>
          {applications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 text-center"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Current Applications</h3>
                <p className="mt-1 text-gray-500">Start by applying to available jobs</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/jobs')}
                  className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Browse Available Jobs
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((application) => (
                <motion.div
                  key={application._id || application.job?._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{application.job.title}</h3>
                        <p className="text-sm text-gray-500">{application.job.company}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-sm font-medium">{application.job.location?.city}, {application.job.location?.state}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Salary</p>
                        <p className="text-sm font-medium">₹{application.job.salary}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Applied on</p>
                      <p className="text-sm font-medium">
                        {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Add status message for pending applications */}
                    {application.status === 'pending' && (
                      <div className="mt-2">
                        <p className="text-sm text-yellow-600 italic">
                          Request sent to employer
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Conditional buttons based on status */}
                  <div className="px-6 pb-6">
                    {application.status === 'accepted' ? (
                      <button
                        onClick={() => handleStatusUpdate(application.job._id, 'completed')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Mark as Completed
                      </button>
                    ) : application.status === 'pending' && (
                      <button
                        onClick={() => handleCancelApplication(application)}
                        disabled={cancellingJobIds.has(application.job._id)}
                        className={`w-full px-4 py-2 rounded-md text-white ${
                          cancellingJobIds.has(application.job._id) 
                            ? 'bg-gray-400 cursor-wait' 
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {cancellingJobIds.has(application.job._id) ? 'Cancelling...' : 'Cancel Application'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Past Jobs Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Jobs</h2>
          {pastJobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500">No past jobs to show</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastJobs.map((job) => (
                <motion.div
                  key={job.job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900">{job.job.title}</h3>
                    <p className="text-sm text-gray-500">{job.job.company}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-sm font-medium">{job.job.location?.city}, {job.job.location?.state}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Salary</p>
                        <p className="text-sm font-medium">₹{job.job.salary}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Completed on</p>
                      <p className="text-sm font-medium">
                        {new Date(job.completedAt || job.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplications;