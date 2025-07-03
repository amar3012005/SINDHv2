import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  DollarSign, 
  MapPin, 
  Calendar,
  User,
  Phone
} from 'lucide-react';

const WorkerApplicationStatus = ({ applicationId }) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicationStatus();
  }, [applicationId]);

  const fetchApplicationStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/job-applications/${applicationId}`);
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      }
    } catch (error) {
      console.error('Error fetching application status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'yellow',
          icon: Clock,
          text: 'Application Submitted',
          description: 'Waiting for employer response'
        };
      case 'accepted':
        return {
          color: 'blue',
          icon: CheckCircle,
          text: 'Application Accepted',
          description: 'You can start working'
        };
      case 'in-progress':
        return {
          color: 'purple',
          icon: User,
          text: 'Work In Progress',
          description: 'Currently working on this job'
        };
      case 'completed':
        return {
          color: 'green',
          icon: CheckCircle,
          text: 'Job Completed',
          description: 'Work finished successfully'
        };
      default:
        return {
          color: 'gray',
          icon: Clock,
          text: 'Unknown Status',
          description: ''
        };
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!application) {
    return <div className="text-red-500">Application not found</div>;
  }

  const statusConfig = getStatusConfig(application.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
    >
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full bg-${statusConfig.color}-100 flex items-center justify-center`}>
            <StatusIcon className={`w-5 h-5 text-${statusConfig.color}-600`} />
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">{statusConfig.text}</h3>
            <p className="text-sm text-gray-500">{statusConfig.description}</p>
          </div>
        </div>
        
        {application.status === 'completed' && application.paymentStatus === 'paid' && (
          <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
            <DollarSign className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-sm font-medium text-green-800">Paid</span>
          </div>
        )}
      </div>

      {/* Job Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{application.job?.location?.city}, {application.job?.location?.state}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Applied: {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}</span>
        </div>
        
        {application.status === 'completed' && application.paymentDate && (
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            <span>Paid: {new Date(application.paymentDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Payment Information */}
      {application.status === 'completed' && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Payment Amount:</span>
            <span className="font-bold text-green-600">
              ₹{(application.paymentAmount || application.job?.salary || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600">Payment Status:</span>
            <span className={`text-sm font-medium ${
              application.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {application.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>
      )}

      {/* Contact Information */}
      {(application.status === 'accepted' || application.status === 'in-progress') && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Employer Contact:</h4>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span>{application.employer?.phone || 'Not provided'}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WorkerApplicationStatus;
