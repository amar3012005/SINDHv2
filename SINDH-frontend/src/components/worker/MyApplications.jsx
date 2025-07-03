import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { getApiUrl } from '../../utils/apiUtils';
import { toast } from 'react-toastify';
import { 
  CheckCircle, Calendar, MapPin, DollarSign, Building, Clock, 
  Briefcase, Eye, Phone, Mail, RefreshCw,
  AlertCircle, Award, Star
} from 'lucide-react';

const MyApplications = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('current');
  const [currentApplications, setCurrentApplications] = useState([]);
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingIds, setCancellingIds] = useState(new Set());

  const fetchApplications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch current applications (pending, accepted, in-progress)
      const currentResponse = await fetch(getApiUrl(`/api/job-applications/worker/${user.id}/current`));
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        setCurrentApplications(currentData.data || currentData || []);
      }

      // Fetch completed jobs
      const pastResponse = await fetch(getApiUrl(`/api/jobs/worker/${user.id}/completed`));
      if (pastResponse.ok) {
        const pastData = await pastResponse.json();
        setPastJobs(pastData.data || pastData || []);
      }

    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleCancelApplication = async (applicationId, jobId) => {
    try {
      setCancellingIds(prev => new Set([...prev, applicationId]));
      
      const response = await fetch(getApiUrl(`/api/job-applications/${applicationId}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success('Application cancelled successfully');
        fetchApplications(); // Refresh data
      } else {
        throw new Error('Failed to cancel application');
      }
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast.error(error.message || 'Failed to cancel application');
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCurrentApplicationCard = (application) => (
    <motion.div
      key={application._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden border"
    >
      {/* Status Banner */}
      <div className={`px-4 py-2 ${getStatusColor(application.status)}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Status: {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
          </span>
          <span className="text-xs">
            Applied: {formatDate(application.appliedAt || application.createdAt)}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Job Title and Company */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {application.job?.title || 'Job Title Not Available'}
        </h3>
        <div className="flex items-center mb-3">
          <Building className="w-4 h-4 text-gray-500 mr-1" />
          <span className="text-sm text-gray-600">
            {application.job?.companyName || 'Company Not Available'}
          </span>
        </div>

        {/* Job Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {application.job?.location?.city}, {application.job?.location?.state}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium text-green-600">
              ₹{application.job?.salary?.toLocaleString() || 'Not specified'}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
            <span>{application.job?.category || 'General'}</span>
          </div>
        </div>

        {/* Description */}
        {application.job?.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {application.job.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`tel:${application.employer?.phone || ''}`)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Call Employer"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.open(`mailto:${application.employer?.email || ''}`)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Email Employer"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>

          {application.status === 'pending' && (
            <button
              onClick={() => handleCancelApplication(application._id, application.job?._id)}
              disabled={cancellingIds.has(application._id)}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {cancellingIds.has(application._id) ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderPastJobCard = (item) => (
    <motion.div
      key={item._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden border border-green-200"
    >
      {/* Completed Status Banner */}
      <div className="bg-green-100 px-4 py-2 border-b border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Completed</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(item.application?.paymentStatus)}`}>
            {item.application?.paymentStatus === 'paid' ? '💰 Paid' : '⏳ Payment Pending'}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Job Title and Company */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {item.job?.title}
        </h3>
        <div className="flex items-center mb-3">
          <Building className="w-4 h-4 text-gray-500 mr-1" />
          <span className="text-sm text-gray-600">{item.job?.companyName}</span>
        </div>

        {/* Job Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span>{item.job?.location?.city}, {item.job?.location?.state}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium text-green-600">
              ₹{item.application?.paymentAmount?.toLocaleString() || item.job?.salary?.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>Completed: {formatDate(item.application?.completedAt)}</span>
          </div>

          {item.application?.paymentDate && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span>Paid: {formatDate(item.application.paymentDate)}</span>
            </div>
          )}
        </div>

        {/* Job Description */}
        {item.job?.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {item.job.description}
            </p>
          </div>
        )}

        {/* Category and Earnings */}
        <div className="flex justify-between items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {item.job?.category}
          </span>
          
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              +₹{item.application?.paymentAmount?.toLocaleString() || item.job?.salary?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Earned</div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your applications...</p>
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
              My Applications
            </h1>
            <p className="mt-3 max-w-2xl text-xl text-gray-500">
              Track your job applications and work history
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-8">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'current'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Current Applications ({currentApplications.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'past'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Past Jobs ({pastJobs.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'current' && (
            <motion.div
              key="current"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {currentApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Current Applications</h3>
                  <p className="text-gray-500 mb-6">You haven't applied for any jobs yet.</p>
                  <button
                    onClick={() => window.location.href = '/jobs'}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Find Jobs
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {currentApplications.map(renderCurrentApplicationCard)}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'past' && (
            <motion.div
              key="past"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {pastJobs.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Jobs Yet</h3>
                  <p className="text-gray-500">Complete some jobs to see your work history here.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    {pastJobs.map(renderPastJobCard)}
                  </div>

                  {/* Summary Section */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold text-green-600">{pastJobs.length}</div>
                        <div className="text-sm text-gray-600">Jobs Completed</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold text-blue-600">
                          ₹{pastJobs.reduce((sum, job) => sum + (job.application?.paymentAmount || job.job?.salary || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Earned</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold text-purple-600">
                          {pastJobs.filter(job => job.application?.paymentStatus === 'paid').length}
                        </div>
                        <div className="text-sm text-gray-600">Payments Received</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <Star className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                        <div className="text-2xl font-bold text-yellow-600">
                          {pastJobs.length > 0 ? (4.5).toFixed(1) : '0.0'}
                        </div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyApplications;
