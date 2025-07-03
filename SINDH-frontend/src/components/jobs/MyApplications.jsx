import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { getApiUrl } from '../../utils/apiUtils';

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
      
      const workerId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
      if (!workerId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log(`Fetching applications for worker ID: ${workerId}`);
      
      // Fetch current applications from the correct backend endpoint
      const currentResponse = await fetch(getApiUrl(`/api/job-applications/worker/${workerId}/current`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!currentResponse.ok) {
        const errorText = await currentResponse.text();
        console.error('Error response from current applications:', errorText);
        throw new Error('Failed to fetch current applications');
      }
      
      // Parse the response
      const currentData = await currentResponse.json();
      console.log('Raw response from backend:', currentData);
      
      // Handle both direct array and wrapped response formats
      let applicationsArray = [];
      if (currentData.success && Array.isArray(currentData.data)) {
        applicationsArray = currentData.data;
      } else if (Array.isArray(currentData)) {
        applicationsArray = currentData;
      } else if (currentData.data && Array.isArray(currentData.data)) {
        applicationsArray = currentData.data;
      }
      
      console.log('Processed applications:', applicationsArray);
      console.log('Number of current applications:', applicationsArray.length);

      // Process applications to ensure all required fields exist
      const processedApplications = applicationsArray.map((app, index) => {
        console.log(`Processing application ${index + 1}:`, app);
        
        return {
          _id: app._id || `app-${index}`,
          status: app.status || 'pending',
          appliedAt: app.appliedAt || app.createdAt || new Date().toISOString(),
          job: {
            _id: app.job?._id || `job-${index}`,
            title: app.job?.title || 'Job Title Not Available',
            companyName: app.job?.companyName || app.job?.company || 'Company Not Available',
            location: {
              city: app.job?.location?.city || 'City Not Available',
              state: app.job?.location?.state || 'State Not Available'
            },
            salary: app.job?.salary || 'Salary Not Specified',
            category: app.job?.category || 'General',
            employmentType: app.job?.employmentType || 'Full-time'
          },
          worker: app.worker || null,
          employer: app.employer || null
        };
      });

      console.log('Final processed applications:', processedApplications);

      setApplications(processedApplications);
      
      // For now, set past jobs as empty array since we don't have a separate endpoint
      // You can add a separate endpoint later for completed/rejected applications
      setPastJobs([]);
      
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
    
    // Set up polling to refresh applications every 30 seconds
    const interval = setInterval(fetchApplications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchApplications]);

  const handleRetry = () => {
    setIsRetrying(true);
    fetchApplications();
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      console.log('Updating application status:', { applicationId, newStatus });
      
      const response = await fetch(getApiUrl(`/api/job-applications/${applicationId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      const result = await response.json();
      console.log('Status update result:', result);

      // Update local state
      if (newStatus === 'completed') {
        // Move to past jobs
        const completedApp = applications.find(app => app._id === applicationId);
        if (completedApp) {
          setApplications(prev => prev.filter(app => app._id !== applicationId));
          setPastJobs(prev => [...prev, {
            ...completedApp,
            status: 'completed',
            completedAt: new Date().toISOString()
          }]);
        }
      } else {
        // Update status in current applications
        setApplications(prev => prev.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));
      }

      toast.success(`Application status updated to ${newStatus}`);
      
      // Refresh data after a short delay
      setTimeout(fetchApplications, 1000);
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update application status');
    }
  };

  const handleCancelApplication = async (application) => {
    try {
      const applicationId = application._id;
      const jobId = application.job._id;
      
      setCancellingJobIds(prev => new Set([...prev, jobId]));
      
      console.log('Cancelling application:', applicationId);
      
      const response = await fetch(getApiUrl(`/api/job-applications/${applicationId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel application');
      }

      // Update UI by removing the cancelled application
      setApplications(prev => prev.filter(app => app._id !== applicationId));
      
      toast.success('Application cancelled successfully');
      
      // Refresh data after a short delay
      setTimeout(fetchApplications, 1000);
      
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
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          My Applications
        </h1>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                    key={application._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{application.job.title}</h3>
                          <p className="text-sm text-gray-500">{application.job.companyName}</p>
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
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Add status message for pending applications */}
                      {application.status === 'pending' && (
                        <div className="mt-2">
                          <p className="text-sm text-yellow-600 italic">
                            Waiting for employer response
                          </p>
                        </div>
                      )}
                      
                      {application.status === 'accepted' && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600 italic">
                            Application accepted! Ready to start work.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Conditional buttons based on status */}
                    <div className="px-6 pb-6 space-y-2">
                      <button
                        onClick={() => handleViewJobDetails(application.job._id)}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        View Job Details
                      </button>
                      
                      {application.status === 'accepted' && (
                        <button
                          onClick={() => handleStatusUpdate(application._id, 'completed')}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Mark as Completed
                        </button>
                      )}
                      
                      {application.status === 'pending' && (
                        <button
                          onClick={() => handleCancelApplication(application)}
                          disabled={cancellingJobIds.has(application.job._id)}
                          className={`w-full px-4 py-2 rounded-md text-white transition-colors ${
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
    </div>
  );
};

export default MyApplications;