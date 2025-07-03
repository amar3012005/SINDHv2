import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  User, 
  Phone, 
  MapPin,
  Star,
  XCircle
} from 'lucide-react';
import PaymentModal from './PaymentModal';

const JobApplicationManager = ({ jobId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/job-applications/job/${jobId}`);
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
      const response = await fetch(`http://localhost:5000/api/job-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchApplications(); // Refresh applications
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handlePayWorker = (application) => {
    setSelectedApplication(application);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    fetchApplications(); // Refresh to show updated payment status
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
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Job Applications ({applications.length})
      </h3>

      {applications.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <motion.div
              key={application._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Application Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {application.worker?.name || application.workerDetails?.name}
                    </h4>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="w-4 h-4 mr-1" />
                      {application.worker?.phone || application.workerDetails?.phone}
                    </div>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                  {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                </span>
              </div>

              {/* Worker Details */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Skills:</span>
                  <p className="font-medium">
                    {application.worker?.skills?.join(', ') || application.workerDetails?.skills?.join(', ') || 'Not specified'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Experience:</span>
                  <p className="font-medium">
                    {application.worker?.experience || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Payment Status */}
              {application.status === 'completed' && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
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
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application._id, 'rejected')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </>
                )}

                {application.status === 'accepted' && (
                  <button
                    onClick={() => updateApplicationStatus(application._id, 'in-progress')}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Start Work
                  </button>
                )}

                {application.status === 'in-progress' && (
                  <button
                    onClick={() => updateApplicationStatus(application._id, 'completed')}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Complete
                  </button>
                )}

                {application.status === 'completed' && application.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => handlePayWorker(application)}
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
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        application={selectedApplication}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
};

export default JobApplicationManager;
