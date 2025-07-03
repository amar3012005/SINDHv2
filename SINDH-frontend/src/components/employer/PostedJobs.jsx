import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MapPin, 
  DollarSign, 
  Users, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

const PostedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState(null);
  const [jobApplications, setJobApplications] = useState({});
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJobApplications, setSelectedJobApplications] = useState(null);
  const [selectedApplicationStatus, setSelectedApplicationStatus] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.id || user.type !== 'employer') {
        setError('You must be logged in as an employer to view posted jobs');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/jobs/employer/${user.id}`);
      
      if (response.ok) {
        const jobsData = await response.json();
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        
        // Fetch applications for each job
        await fetchJobApplications(jobsData);
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.message);
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchJobApplications = async (jobs) => {
    const applicationsMap = {};
    
    for (const job of jobs) {
      try {
        const response = await fetch(`http://localhost:5000/api/job-applications/job/${job._id}`);
        if (response.ok) {
          const data = await response.json();
          applicationsMap[job._id] = data.data || [];
        }
      } catch (error) {
        console.error(`Error fetching applications for job ${job._id}:`, error);
        applicationsMap[job._id] = [];
      }
    }
    
    setJobApplications(applicationsMap);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJobs(jobs.filter(job => job._id !== jobId));
        alert('Job deleted successfully');
      } else {
        throw new Error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job: ' + error.message);
    }
  };

  const handlePayWorker = (job, application) => {
    // Set the selected job and application for payment
    setSelectedJobForPayment({ job, application });
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setSelectedJobForPayment(null);
    fetchJobs(); // Refresh to show updated payment status
  };

  const handleViewApplications = (job) => {
    const applications = jobApplications[job._id] || [];
    console.log('Opening applications modal for job:', job.title, 'Applications:', applications.length);
    setSelectedJobApplications({ job, applications });
    setShowApplicationsModal(true);
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      console.log('Updating application status:', applicationId, 'to:', newStatus);
      
      const response = await fetch(`http://localhost:5000/api/job-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Application status updated successfully:', result);
        
        // Refresh jobs data to show updated status
        fetchJobs();
        
        // Show success message
        alert(`Application ${newStatus} successfully!`);
        
        // If modal is open, close and reopen to refresh data
        if (showApplicationsModal && selectedJobApplications) {
          setShowApplicationsModal(false);
          setTimeout(() => {
            handleViewApplications(selectedJobApplications.job);
          }, 500);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Eye className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filterStatus === 'all') return true;
    return job.status === filterStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your posted jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              My Posted Jobs
            </h1>
            <p className="mt-3 max-w-2xl text-xl text-gray-500">
              Manage your job postings and track applications
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => window.location.href = '/employer/post-job'}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex space-x-1">
            {[
              { value: 'all', label: 'All Jobs' },
              { value: 'active', label: 'Active' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  filterStatus === filter.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {filter.label} ({jobs.filter(job => filter.value === 'all' || job.status === filter.value).length})
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No Jobs Posted Yet' : `No ${filterStatus} Jobs`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filterStatus === 'all' 
                ? 'Start by posting your first job to find workers' 
                : `You don't have any ${filterStatus} jobs at the moment`
              }
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => window.location.href = '/employer/post-job'}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredJobs.map((job) => {
                const applications = jobApplications[job._id] || [];
                const completedApplications = applications.filter(app => app.status === 'completed');
                const unpaidApplications = completedApplications.filter(app => app.paymentStatus !== 'paid');
                
                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Status Banner */}
                    <div className={`px-4 py-2 ${getStatusColor(job.status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(job.status)}
                          <span className="ml-2 text-sm font-medium">
                            {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs">
                            Posted: {formatDate(job.createdAt)}
                          </span>
                          {unpaidApplications.length > 0 && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                              Payment Due
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Job Title and Category */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{job.category}</p>

                      {/* Job Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{job.location?.city}, {job.location?.state}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium text-green-600">
                            ₹{job.salary?.toLocaleString() || 'Not specified'}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{applications.length} application{applications.length !== 1 ? 's' : ''}</span>
                        </div>

                        {job.startDate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span>Starts: {formatDate(job.startDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Applications Summary for Active Jobs */}
                      {job.status === 'active' && applications.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">
                            Applications Summary
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Pending:</span>
                              <span className="font-medium">
                                {applications.filter(app => app.status === 'pending').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Accepted:</span>
                              <span className="font-medium">
                                {applications.filter(app => app.status === 'accepted').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">In Progress:</span>
                              <span className="font-medium">
                                {applications.filter(app => app.status === 'in-progress').length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Completed:</span>
                              <span className="font-medium">
                                {applications.filter(app => app.status === 'completed').length}
                              </span>
                            </div>
                          </div>
                          {applications.filter(app => app.status === 'pending').length > 0 && (
                            <div className="mt-2 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                              ⏳ {applications.filter(app => app.status === 'pending').length} application{applications.filter(app => app.status === 'pending').length !== 1 ? 's' : ''} waiting for your response
                            </div>
                          )}
                        </div>
                      )}

                      {/* In-Progress Work Status */}
                      {job.status === 'in-progress' && applications.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">
                            Work in Progress
                          </h4>
                          {applications.filter(app => app.status === 'in-progress').map((application) => (
                            <div key={application._id} className="flex justify-between items-center text-sm">
                              <span className="text-blue-700">
                                {application.worker?.name || application.workerDetails?.name}
                              </span>
                              <button
                                onClick={() => updateApplicationStatus(application._id, 'completed')}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                              >
                                Mark Complete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Payment Status for Completed Jobs */}
                      {completedApplications.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Completed Applications ({completedApplications.length})
                          </h4>
                          <div className="space-y-2">
                            {completedApplications.map((application) => (
                              <div key={application._id} className="flex justify-between items-center">
                                <div>
                                  <span className="text-sm font-medium">
                                    {application.worker?.name || application.workerDetails?.name}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    Completed: {formatDate(application.jobCompletedDate || application.updatedAt)}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    application.paymentStatus === 'paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {application.paymentStatus === 'paid' ? 'Paid' : 'Payment Due'}
                                  </span>
                                  {application.paymentStatus !== 'paid' && (
                                    <button
                                      onClick={() => handlePayWorker(job, application)}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                                    >
                                      Pay Now
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Actions for Active Jobs */}
                      {job.status === 'active' && applications.length > 0 && (
                        <div className="mb-4 space-y-3">
                          {applications.map((application) => (
                            <div key={application._id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {application.worker?.name || application.workerDetails?.name}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      {application.worker?.phone || application.workerDetails?.phone}
                                    </div>
                                  </div>
                                </div>
                                
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  application.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  application.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                                </span>
                              </div>

                              {/* Application Actions */}
                              <div className="flex space-x-2">
                                {application.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateApplicationStatus(application._id, 'accepted');
                                      }}
                                      className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateApplicationStatus(application._id, 'rejected');
                                      }}
                                      className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {application.status === 'accepted' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateApplicationStatus(application._id, 'in-progress');
                                    }}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                  >
                                    Start Work
                                  </button>
                                )}

                                {application.status === 'in-progress' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateApplicationStatus(application._id, 'completed');
                                    }}
                                    className="flex-1 px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors"
                                  >
                                    Mark Complete
                                  </button>
                                )}

                                {application.status === 'completed' && application.paymentStatus !== 'paid' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePayWorker(job, application);
                                    }}
                                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                  >
                                    Pay ₹{application.paymentAmount || job.salary}
                                  </button>
                                )}

                                {application.status === 'completed' && application.paymentStatus === 'paid' && (
                                  <div className="flex-1 px-3 py-1 bg-green-100 text-green-800 rounded text-xs text-center">
                                    ✅ Paid
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {job.description && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {job.description}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => window.location.href = `/job/${job._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.location.href = `/employer/edit-job/${job._id}`}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit Job"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          {applications.length === 0 ? (
                            <span className="text-xs text-gray-500">No applications yet</span>
                          ) : (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                              {applications.length} applicant{applications.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          
                          <button
                            onClick={() => handleDeleteJob(job._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Applications Modal - Enhanced */}
        <AnimatePresence>
          {showApplicationsModal && selectedJobApplications && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              >
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Manage Applications: {selectedJobApplications.job.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>📍 {selectedJobApplications.job.location?.city}, {selectedJobApplications.job.location?.state}</span>
                        <span>💰 ₹{selectedJobApplications.job.salary?.toLocaleString()}</span>
                        <span>👥 {selectedJobApplications.applications.length} applications</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowApplicationsModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Application Status Summary */}
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {[
                      { status: 'pending', label: 'Pending', color: 'yellow' },
                      { status: 'accepted', label: 'Accepted', color: 'green' },
                      { status: 'in-progress', label: 'In Progress', color: 'blue' },
                      { status: 'completed', label: 'Completed', color: 'purple' }
                    ].map(({ status, label, color }) => {
                      const count = selectedJobApplications.applications.filter(app => app.status === status).length;
                      return (
                        <div key={status} className={`text-center p-3 bg-${color}-50 rounded-lg`}>
                          <div className={`text-2xl font-bold text-${color}-600`}>{count}</div>
                          <div className={`text-sm text-${color}-800`}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Application Status Tabs */}
                  <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg">
                    {['all', 'pending', 'accepted', 'in-progress', 'completed'].map((status) => {
                      const count = status === 'all' 
                        ? selectedJobApplications.applications.length
                        : selectedJobApplications.applications.filter(app => app.status === status).length;
                      
                      return (
                        <button
                          key={status}
                          onClick={() => setSelectedApplicationStatus(status)}
                          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            selectedApplicationStatus === status
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {(() => {
                    const filteredApplications = selectedApplicationStatus === 'all' 
                      ? selectedJobApplications.applications
                      : selectedJobApplications.applications.filter(app => app.status === selectedApplicationStatus);
                    
                    if (filteredApplications.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            No {selectedApplicationStatus === 'all' ? '' : selectedApplicationStatus} applications
                          </h4>
                          <p className="text-gray-500">
                            {selectedApplicationStatus === 'all' 
                              ? 'Workers haven\'t applied for this job yet.'
                              : `No applications in ${selectedApplicationStatus} status.`
                            }
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-4 md:grid-cols-2">
                        {filteredApplications.map((application) => (
                          <motion.div
                            key={application._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            {/* Application Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {(application.worker?.name || application.workerDetails?.name)?.charAt(0) || 'W'}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {application.worker?.name || application.workerDetails?.name}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    📞 {application.worker?.phone || application.workerDetails?.phone}
                                  </p>
                                </div>
                              </div>
                              
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                application.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                application.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                              </span>
                            </div>

                            {/* Worker Details Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                              <div>
                                <span className="text-gray-500">Skills:</span>
                                <p className="font-medium text-xs">
                                  {(application.worker?.skills || application.workerDetails?.skills || []).join(', ') || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Experience:</span>
                                <p className="font-medium text-xs">
                                  {application.worker?.experience || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Applied:</span>
                                <p className="font-medium text-xs">
                                  {new Date(application.applicationDetails?.appliedAt || application.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Rating:</span>
                                <p className="font-medium text-xs">
                                  ⭐ {application.worker?.rating?.average || application.workerDetails?.rating || 0}/5
                                </p>
                              </div>
                            </div>

                            {/* Payment Info for Completed Jobs */}
                            {application.status === 'completed' && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-sm text-gray-500">Payment Status:</span>
                                    <p className={`font-medium ${
                                      application.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                      {application.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Payment Pending'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm text-gray-500">Amount:</span>
                                    <p className="font-bold text-lg">₹{application.paymentAmount || selectedJobApplications.job.salary}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Quick Action Buttons */}
                            <div className="flex space-x-2">
                              {application.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'accepted')}
                                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                  >
                                    ✓ Accept
                                  </button>
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'rejected')}
                                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                  >
                                    ✗ Reject
                                  </button>
                                </>
                              )}

                              {application.status === 'accepted' && (
                                <button
                                  onClick={() => updateApplicationStatus(application._id, 'in-progress')}
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  🚀 Start Work
                                </button>
                              )}

                              {application.status === 'in-progress' && (
                                <button
                                  onClick={() => updateApplicationStatus(application._id, 'completed')}
                                  className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                  ✅ Mark Complete
                                </button>
                              )}

                              {application.status === 'completed' && application.paymentStatus !== 'paid' && (
                                <button
                                  onClick={() => {
                                    setSelectedJobForPayment({ job: selectedJobApplications.job, application });
                                    setShowPaymentModal(true);
                                    setShowApplicationsModal(false);
                                  }}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                  💰 Pay Worker
                                </button>
                              )}

                              {application.status === 'completed' && application.paymentStatus === 'paid' && (
                                <div className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-center text-sm font-medium">
                                  ✅ Payment Complete
                                </div>
                              )}

                              {application.status === 'rejected' && (
                                <div className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-center text-sm font-medium">
                                  ❌ Rejected
                                </div>
                              )}

                              {/* Contact Worker Button */}
                              <button
                                onClick={() => window.open(`tel:${application.worker?.phone || application.workerDetails?.phone}`)}
                                className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Call Worker"
                              >
                                📞
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simplified Payment Modal */}
        {showPaymentModal && selectedJobForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Process Payment
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Worker:</span>
                    <span className="font-medium">
                      {selectedJobForPayment.application.worker?.name || 
                       selectedJobForPayment.application.workerDetails?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job:</span>
                    <span className="font-medium">{selectedJobForPayment.job.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-600">
                      ₹{selectedJobForPayment.application.paymentAmount || selectedJobForPayment.job.salary}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('Processing payment for application:', selectedJobForPayment.application._id);
                      
                      const response = await fetch(`http://localhost:5000/api/job-applications/${selectedJobForPayment.application._id}/process-payment`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          paymentAmount: selectedJobForPayment.application.paymentAmount || selectedJobForPayment.job.salary
                        })
                      });

                      const result = await response.json();
                      
                      if (response.ok) {
                        console.log('Payment processed successfully:', result);
                        alert(`✅ Payment Processed Successfully!\n\nWorker: ${result.workerUpdated}\nAmount: ₹${selectedJobForPayment.application.paymentAmount || selectedJobForPayment.job.salary}\nNew Worker Balance: ₹${result.newWorkerBalance}\n\nThe worker's balance has been updated immediately.`);
                        handlePaymentComplete();
                      } else {
                        console.error('Payment processing failed:', result);
                        alert(`❌ Payment Failed: ${result.message}`);
                      }
                    } catch (error) {
                      console.error('Payment error:', error);
                      alert('❌ Payment processing failed: ' + error.message);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Process Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostedJobs;