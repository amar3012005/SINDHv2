import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  MapPin, 
  DollarSign, 
  Calendar,
  TrendingUp,
  User,
  Briefcase,
  Star
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getApiUrl } from '../utils/apiUtils';
import { getCurrentUser } from '../utils/authUtils';

function MyApplications() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Get current user
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyApplications();
    } else {
      setError('Please login to view your applications');
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching applications for user:', currentUser.id);

      const response = await fetch(`${getApiUrl()}/job-applications/worker/${currentUser.id}/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.status}`);
      }

      const data = await response.json();
      console.log('Applications fetched:', data);

      // Process and enrich the applications data
      const enrichedApplications = data.data || data || [];
      const processedApplications = enrichedApplications.map(app => ({
        ...app,
        job: app.job || {},
        employer: app.employer || {},
        status: app.status || 'pending',
        appliedDate: app.createdAt || app.appliedDate || new Date().toISOString(),
        lastUpdated: app.updatedAt || app.lastUpdated || new Date().toISOString()
      }));

      setApplications(processedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message);
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatSalary = (salary) => {
    if (!salary || salary === '₹0') return 'Salary not specified';
    return salary;
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedApplication(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Applications</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchMyApplications}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Job Applications
          </h1>
          <p className="text-gray-600">
            Track your job applications and their current status
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-lg font-semibold">
                  {applications.filter(app => app.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-lg font-semibold">
                  {applications.filter(app => app.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 text-purple-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-semibold">{applications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { value: 'all', label: 'All Applications' },
              { value: 'pending', label: 'Pending' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'completed', label: 'Completed' },
              { value: 'rejected', label: 'Rejected' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`flex-1 min-w-0 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                  filterStatus === filter.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No applications yet' : `No ${filterStatus} applications`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filterStatus === 'all' 
                ? 'Start applying to jobs to see your applications here'
                : `You don't have any ${filterStatus} applications at the moment`
              }
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => {
                  const user = getCurrentUser();
                  if (!user) {
                    window.location.href = '/login?type=worker';
                  } else {
                    window.location.href = '/jobs';
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Available Jobs
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredApplications.map((application, index) => (
                <motion.div
                  key={application._id || application.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Job Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {application.job?.title || 'Job Title Not Available'}
                      </h3>
                      <div className="flex items-center ml-2">
                        {getStatusIcon(application.status)}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Applied: {formatDate(application.appliedDate)}
                      </span>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-2 text-sm">
                      {application.job?.location?.city && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{application.job.location.city}</span>
                        </div>
                      )}
                      
                      {application.job?.salary && (
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span>{formatSalary(application.job.salary)}</span>
                        </div>
                      )}

                      {application.employer?.name && (
                        <div className="flex items-center text-gray-600">
                          <User className="w-4 h-4 mr-1" />
                          <span>{application.employer.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 pt-3">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedApplication.job?.title || 'Job Details'}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Applied: {formatDate(selectedApplication.appliedDate)}</span>
                      <span>Last Updated: {formatDate(selectedApplication.lastUpdated)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Section */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Application Status</h3>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(selectedApplication.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Job Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Job Details</h3>
                  <div className="space-y-3">
                    {selectedApplication.job?.description && (
                      <div>
                        <p className="text-sm text-gray-600">{selectedApplication.job.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedApplication.job?.location?.city && (
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{selectedApplication.job.location.city}</span>
                        </div>
                      )}
                      
                      {selectedApplication.job?.salary && (
                        <div className="flex items-center text-sm">
                          <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{formatSalary(selectedApplication.job.salary)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Employer Details */}
                {selectedApplication.employer?.name && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Employer</h3>
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">{selectedApplication.employer.name}</span>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Application Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Application Submitted</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedApplication.appliedDate)}</p>
                      </div>
                    </div>
                    
                    {selectedApplication.status !== 'pending' && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Status Updated</p>
                          <p className="text-xs text-gray-500">{formatDate(selectedApplication.lastUpdated)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCloseModal();
                      const user = getCurrentUser();
                      if (!user) {
                        window.location.href = '/login?type=worker';
                      } else {
                        window.location.href = `/jobs/${selectedApplication.job?._id || selectedApplication.jobId}`;
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Job
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MyApplications;