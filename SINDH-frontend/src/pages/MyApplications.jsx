import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { 
  updateApplicationStatus, 
  getCurrentApplications, 
  getPastJobs, 
  moveToPastJobs 
} from '../utils/jobApplicationUtils';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useUser();

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const workerId = user?.id;
      if (!workerId) {
        throw new Error('User not found');
      }

      // Fetch current applications
      const response = await fetch(`http://localhost:5000/api/job-applications/worker/${workerId}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();

      // Get local applications data
      const localCurrentApps = getCurrentApplications();
      const localPastJobs = getPastJobs();

      // Merge backend data with local data
      const mergedApplications = data.map(app => {
        const localApp = localCurrentApps[app.job._id];
        if (localApp) {
          return {
            ...app,
            localData: localApp
          };
        }
        return app;
      });

      // Filter applications based on status
      const current = mergedApplications.filter(app => app.status !== 'completed');
      const past = mergedApplications.filter(app => app.status === 'completed');

      // Add local past jobs
      Object.entries(localPastJobs).forEach(([jobId, jobData]) => {
        if (!past.some(app => app.job._id === jobId)) {
          past.push({
            job: { _id: jobId, ...jobData },
            status: 'completed',
            completedAt: jobData.completedAt
          });
        }
      });

      setApplications(current);
      setPastJobs(past);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load your applications. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleViewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Retry
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Applications</h1>
          <p className="text-lg text-gray-600">Track all your job applications and work history</p>
        </div>

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
                  key={application.job._id}
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
                  </div>
                  {application.status === 'accepted' && (
                    <div className="px-6 pb-6">
                      <button
                        onClick={() => handleStatusUpdate(application.job._id, 'completed')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  )}
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