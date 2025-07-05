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
      } else {
        console.error('Failed to fetch current applications:', currentResponse.status);
      }

      // Fetch completed jobs - try multiple endpoints
      try {
        console.log('Fetching completed jobs for worker:', user.id);
        
        // First try the job-applications endpoint for completed applications
        const completedAppsResponse = await fetch(getApiUrl(`/api/job-applications/worker/${user.id}/completed`));
        if (completedAppsResponse.ok) {
          const completedAppsData = await completedAppsResponse.json();
          console.log('Completed applications data:', completedAppsData);
          
          if (completedAppsData.data && completedAppsData.data.length > 0) {
            setPastJobs(completedAppsData.data);
          } else {
            // Fallback to jobs endpoint
            const pastResponse = await fetch(getApiUrl(`/api/jobs/worker/${user.id}/completed`));
            if (pastResponse.ok) {
              const pastData = await pastResponse.json();
              console.log('Past jobs data:', pastData);
              setPastJobs(pastData.data || pastData || []);
            }
          }
        } else {
          console.error('Failed to fetch completed applications:', completedAppsResponse.status);
          // Fallback to jobs endpoint
          const pastResponse = await fetch(getApiUrl(`/api/jobs/worker/${user.id}/completed`));
          if (pastResponse.ok) {
            const pastData = await pastResponse.json();
            console.log('Past jobs data (fallback):', pastData);
            setPastJobs(pastData.data || pastData || []);
          }
        }
      } catch (pastError) {
        console.error('Error fetching completed jobs:', pastError);
        setPastJobs([]);
      }

    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(`Failed to connect to server: ${error.message}`);
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-progress':
        return <RefreshCw className="w-4 h-4" />;
      case 'completed':
        return <Award className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const renderCurrentApplicationCard = (application) => (
    <motion.div
      key={application._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      {/* Enhanced Status Banner */}
      <div className={`px-4 py-3 border-b ${getStatusColor(application.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(application.status)}
            <span className="text-sm font-semibold">
              {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium">Applied</div>
            <div className="text-xs">
              {formatDate(application.appliedAt || application.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Job Title and Company */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {application.job?.title || 'Job Title Not Available'}
          </h3>
          <div className="flex items-center text-gray-600">
            <Building className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              {application.job?.companyName || 'Company Not Available'}
            </span>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">Location</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {application.job?.location?.city}, {application.job?.location?.state}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-gray-700">Salary</span>
            </div>
            <span className="text-sm font-bold text-green-600">
              ₹{application.job?.salary?.toLocaleString() || 'Not specified'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Briefcase className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">Category</span>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {application.job?.category || 'General'}
            </span>
          </div>
        </div>

        {/* Description */}
        {application.job?.description && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 line-clamp-3">
              {application.job.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`tel:${application.employer?.phone || ''}`)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              title="Call Employer"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.open(`mailto:${application.employer?.email || ''}`)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
              title="Email Employer"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>

          {application.status === 'pending' && (
            <button
              onClick={() => handleCancelApplication(application._id, application.job?._id)}
              disabled={cancellingIds.has(application._id)}
              className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
            >
              {cancellingIds.has(application._id) ? 'Cancelling...' : 'Cancel Application'}
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
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100 hover:shadow-xl transition-all duration-300"
    >
      {/* Enhanced Completed Status Banner */}
      <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-3 border-b border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-800">Job Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getPaymentStatusColor(item.application?.paymentStatus || 'pending')}`}>
              {item.application?.paymentStatus === 'paid' ? '✅ Payment Received' : '⏳ Payment Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Job Title and Company */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {item.job?.title}
          </h3>
          <div className="flex items-center text-gray-600">
            <Building className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{item.job?.companyName}</span>
          </div>
        </div>

        {/* Enhanced Job Details Grid */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">Location</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {item.job?.location?.city}, {item.job?.location?.state}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-gray-700">Payment Amount</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              ₹{(item.application?.paymentAmount || item.job?.salary)?.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700">Completed Date</span>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {formatDate(item.application?.completedAt)}
            </span>
          </div>

          {item.application?.paymentDate && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-purple-600 mr-2" />
                <span className="text-sm text-gray-700">Payment Date</span>
              </div>
              <span className="text-sm font-medium text-purple-600">
                {formatDate(item.application.paymentDate)}
              </span>
            </div>
          )}
        </div>

        {/* Job Description */}
        {item.job?.description && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 line-clamp-3">
              {item.job.description}
            </p>
          </div>
        )}

        {/* Enhanced Category and Earnings Section */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Briefcase className="w-3 h-3 mr-1" />
            {item.job?.category}
          </span>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              +₹{(item.application?.paymentAmount || item.job?.salary)?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 font-medium">Total Earned</div>
          </div>
        </div>

        {/* Payment Status Indicator */}
        <div className="mt-4 p-3 rounded-lg border-2 border-dashed border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Payment Status:</span>
            <div className="flex items-center space-x-2">
              {item.application?.paymentStatus === 'paid' ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-green-600">Payment Complete</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-yellow-600">Awaiting Payment</span>
                </>
              )}
            </div>
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
        <div className="bg-white rounded-xl shadow-sm p-2 mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'current'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Current Applications
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                activeTab === 'current' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
              }`}>
                {currentApplications.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'past'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Completed Jobs
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                activeTab === 'past' ? 'bg-white/20' : 'bg-green-100 text-green-600'
              }`}>
                {pastJobs.length}
              </span>
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

                  {/* Enhanced Summary Section */}
                  <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Work Performance Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                        <div className="text-3xl font-bold text-green-600 mb-1">{pastJobs.length}</div>
                        <div className="text-sm font-medium text-gray-600">Jobs Completed</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          ₹{pastJobs.reduce((sum, job) => sum + (job.application?.paymentAmount || job.job?.salary || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm font-medium text-gray-600">Total Earned</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                        <Award className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {pastJobs.filter(job => job.application?.paymentStatus === 'paid').length}
                        </div>
                        <div className="text-sm font-medium text-gray-600">Payments Received</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                        <Star className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                        <div className="text-3xl font-bold text-yellow-600 mb-1">
                          {pastJobs.length > 0 ? (4.5).toFixed(1) : '0.0'}
                        </div>
                        <div className="text-sm font-medium text-gray-600">Average Rating</div>
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
