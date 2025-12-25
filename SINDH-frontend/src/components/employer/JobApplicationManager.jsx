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
  XCircle,
  TrendingUp
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import { getApiUrl } from '../../utils/apiUtils.js';
import EmployerApplicationProgress from './EmployerApplicationProgress';

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
      const response = await fetch(`${getApiUrl()}/job-applications/${applicationId}/status`, {
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

      {/* Progress Tracking Component */}
      {applications.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <div key={application._id} className="space-y-4">
              <EmployerApplicationProgress 
                jobId={jobId}
                application={application}
                onStatusChange={(status) => {
                  setApplications(prev => 
                    prev.map(app => 
                      app._id === application._id 
                        ? { ...app, status } 
                        : app
                    )
                  );
                }}
              />
            </div>
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
