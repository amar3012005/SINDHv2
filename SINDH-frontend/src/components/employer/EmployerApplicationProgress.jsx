import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  DollarSign, 
  User, 
  Phone, 
  MapPin,
  Calendar,
  AlertCircle,
  Star,
  TrendingUp,
  Award,
  Users,
  Briefcase
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUtils.js';

const EmployerApplicationProgress = ({ jobId, onStatusChange }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    fetchApplications();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/job/${jobId}/applications`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      setProcessingAction(applicationId);
      const response = await fetch(`${getApiUrl()}/job-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchApplications(); // Refresh applications
        if (onStatusChange) {
          onStatusChange(applicationId, status);
        }
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setProcessingAction(null);
    }
  };

  const getApplicationStats = () => {
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      inProgress: applications.filter(app => app.status === 'in-progress').length,
      completed: applications.filter(app => app.status === 'completed').length,
      paid: applications.filter(app => app.paymentStatus === 'paid').length
    };
    return stats;
  };

  const getProgressPercentage = (application) => {
    const stepMap = {
      'pending': 20,
      'accepted': 40,
      'in-progress': 60,
      'completed': 80,
      'paid': 100
    };
    return stepMap[application.status] || 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'accepted':
        return 'green';
      case 'in-progress':
        return 'blue';
      case 'completed':
        return 'purple';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const stats = getApplicationStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Application Management</h3>
            <p className="text-sm text-gray-600">Track and manage job applications</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Applications</div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-yellow-700">Pending</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          <div className="text-xs text-green-700">Accepted</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-blue-700">Working</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
          <div className="text-xs text-purple-700">Completed</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
          <div className="text-xs text-emerald-700">Paid</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 mb-3">Worker Applications</h4>
        
        {applications.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No applications yet</p>
          </div>
        ) : (
          applications.map((application) => {
            const progressPercentage = getProgressPercentage(application);
            const statusColor = getStatusColor(application.status);
            
            return (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                {/* Application Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-${statusColor}-100 rounded-full flex items-center justify-center`}>
                      <User className={`w-5 h-5 text-${statusColor}-600`} />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {application.worker?.name || application.workerDetails?.name}
                      </h5>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="w-4 h-4 mr-1" />
                        {application.worker?.phone || application.workerDetails?.phone}
                      </div>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                    {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Application Progress</span>
                    <span className="text-sm font-bold text-blue-600">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`bg-${statusColor}-500 h-2 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Applied</span>
                    <span>Accepted</span>
                    <span>Working</span>
                    <span>Completed</span>
                    <span>Paid</span>
                  </div>
                </div>

                {/* Worker Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">
                      Skills: {application.worker?.skills?.join(', ') || application.workerDetails?.skills?.join(', ') || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">
                      Experience: {application.worker?.experience || 'Not specified'}
                    </span>
                  </div>
                </div>

                {/* Payment Information */}
                {application.status === 'completed' && (
                  <div className="bg-white rounded-lg p-3 mb-4 border">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-500">Payment Status:</span>
                        <p className={`font-medium ${
                          application.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {application.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Amount:</span>
                        <p className="font-bold text-lg">₹{application.paymentAmount || application.job?.salary}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {application.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateApplicationStatus(application._id, 'accepted')}
                        disabled={processingAction === application._id}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {processingAction === application._id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application._id, 'rejected')}
                        disabled={processingAction === application._id}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {application.status === 'accepted' && (
                    <button
                      onClick={() => updateApplicationStatus(application._id, 'in-progress')}
                      disabled={processingAction === application._id}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Start Work
                    </button>
                  )}

                  {application.status === 'in-progress' && (
                    <button
                      onClick={() => updateApplicationStatus(application._id, 'completed')}
                      disabled={processingAction === application._id}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </button>
                  )}

                  {application.status === 'completed' && application.paymentStatus !== 'paid' && (
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay Worker
                    </button>
                  )}

                  {application.status === 'completed' && application.paymentStatus === 'paid' && (
                    <div className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-center flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Payment Complete
                    </div>
                  )}
                </div>

                {/* Application Timeline */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h6 className="text-sm font-medium text-gray-900 mb-2">Status Timeline</h6>
                  <div className="space-y-2">
                    {application.statusHistory?.map((status, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-gray-700">
                          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                        </span>
                        <span className="text-gray-500 ml-auto">
                          {new Date(status.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-500">Total Applications</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-500">Jobs Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">{stats.paid}</div>
            <div className="text-xs text-gray-500">Payments Made</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              ₹{applications.reduce((sum, app) => sum + (app.paymentAmount || app.job?.salary || 0), 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Paid</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployerApplicationProgress; 