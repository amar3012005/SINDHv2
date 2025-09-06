import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  DollarSign, 
  User, 
  Phone, 
  MapPin,
  Calendar,
  AlertCircle,
  Award
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUtils.js';

const JobApplicationProgress = ({ applicationId, workerStatus, employerStatus, applicationStatus, jobData, onStatusChange }) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const fetchApplicationStatus = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/job-applications/${applicationId}`);
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
        updateCurrentStep(data.workerStatus, data.employerStatus);
        // Notify parent component of status change
        if (onStatusChange) {
          onStatusChange({ workerStatus: data.workerStatus, employerStatus: data.employerStatus });
        }
      }
    } catch (error) {
      console.error('Error fetching application status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 JobApplicationProgress props:', { 
      applicationId, 
      workerStatus, 
      employerStatus, 
      applicationStatus,
      jobData: jobData ? { title: jobData.title, salary: jobData.salary } : null
    });
    
    // If we have status props, use them directly instead of fetching
    if (workerStatus && employerStatus) {
      console.log('✅ Using provided dual status props');
      const appData = {
        workerStatus,
        employerStatus,
        applicationStatus,
        job: jobData
      };
      setApplication(appData);
      updateCurrentStep(workerStatus, employerStatus);
      setLoading(false);
    } else if (applicationStatus) {
      console.log('🔄 Using legacy application status:', applicationStatus);
      // Map legacy status to dual status
      const mappedStatus = mapLegacyStatusToDualStatus(applicationStatus);
      const appData = {
        workerStatus: mappedStatus.workerStatus,
        employerStatus: mappedStatus.employerStatus,
        applicationStatus,
        job: jobData
      };
      setApplication(appData);
      updateCurrentStep(mappedStatus.workerStatus, mappedStatus.employerStatus);
      setLoading(false);
    } else if (applicationId) {
      console.log('🔍 Fetching application status for ID:', applicationId);
      fetchApplicationStatus();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchApplicationStatus, 30000);
      return () => clearInterval(interval);
    } else {
      console.log('⚠️ No status props or applicationId provided');
      setLoading(false);
    }
  }, [applicationId, workerStatus, employerStatus, applicationStatus, jobData, fetchApplicationStatus]);

  const mapLegacyStatusToDualStatus = (applicationStatus) => {
    console.log('🔄 Mapping legacy status:', applicationStatus);
    
    switch (applicationStatus) {
      case 'pending':
        return { workerStatus: 'applied', employerStatus: 'active' };
      case 'accepted':
        return { workerStatus: 'applied', employerStatus: 'accepted' };
      case 'in-progress':
        return { workerStatus: 'applied', employerStatus: 'paid' };
      case 'completed':
        return { workerStatus: 'accepted', employerStatus: 'accepted' };
      case 'rejected':
      case 'cancelled':
        return { workerStatus: 'applied', employerStatus: 'active' };
      default:
        return { workerStatus: 'applied', employerStatus: 'active' };
    }
  };

  const updateCurrentStep = (workerStatus, employerStatus) => {
    console.log('📊 Updating progress step:', { workerStatus, employerStatus });
    
    // Map dual status to progress steps
    let step = 1; // Default to first step
    
    if (workerStatus === 'applied') {
      switch (employerStatus) {
        case 'active':
          step = 1; // Application submitted, under review
          break;
        case 'accepted':
          step = 2; // Application accepted by employer
          break;
        case 'paid':
          step = 3; // Work in progress
          break;
        default:
          step = 1;
      }
    } else if (workerStatus === 'accepted') {
      step = 4; // Job completed
    } else if (workerStatus === 'got paid') {
      step = 5; // Payment received
    }
    
    console.log('📊 Setting current step to:', step);
    setCurrentStep(step);
  };

  const getStepConfig = (step) => {
    const steps = [
      {
        id: 1,
        title: 'Application Under Review',
        description: 'Your application is being reviewed by the employer',
        icon: Clock,
        color: 'yellow',
        status: 'under-review'
      },
      {
        id: 2,
        title: 'Application Accepted',
        description: 'Congratulations! Employer has accepted your application',
        icon: CheckCircle,
        color: 'green',
        status: 'accepted'
      },
      {
        id: 3,
        title: 'Work In Progress',
        description: 'You are currently working on this job',
        icon: User,
        color: 'blue',
        status: 'in-progress'
      },
      {
        id: 4,
        title: 'Job Completed',
        description: 'Work has been completed successfully',
        icon: Award,
        color: 'purple',
        status: 'completed'
      },
      {
        id: 5,
        title: 'Payment Received',
        description: 'Payment has been processed and received',
        icon: DollarSign,
        color: 'green',
        status: 'paid'
      }
    ];
    return steps[step - 1] || steps[0];
  };

  const getProgressPercentage = () => {
    if (!application) return 0;
    const totalSteps = 5;
    return (currentStep / totalSteps) * 100;
  };

  const getDualStatusText = () => {
    if (!application) return 'Loading...';
    
    const { workerStatus, employerStatus } = application;
    
    if (workerStatus === 'applied') {
      switch (employerStatus) {
        case 'active':
          return 'Application submitted and under review';
        case 'accepted':
          return 'Application accepted - Ready to start work';
        case 'paid':
          return 'Work is in progress';
        default:
          return 'Application status unknown';
      }
    } else if (workerStatus === 'accepted') {
      return 'Job completed successfully';
    } else if (workerStatus === 'got paid') {
      return 'Payment received - Job fully completed';
    }
    
    return 'Status unknown';
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

  if (!application) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Application not found</p>
        </div>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage();
  const currentStepConfig = getStepConfig(currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full bg-${currentStepConfig.color}-100 flex items-center justify-center`}>
            <currentStepConfig.icon className={`w-6 h-6 text-${currentStepConfig.color}-600`} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-bold text-gray-900">{currentStepConfig.title}</h3>
            <p className="text-sm text-gray-600">{currentStepConfig.description}</p>
          </div>
        </div>
        
        {application.paymentStatus === 'paid' && (
          <div className="flex items-center bg-green-100 px-4 py-2 rounded-full">
            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-bold text-green-800">Payment Complete</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Application Progress</span>
          <span className="text-sm font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 h-3 rounded-full shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Applied</span>
          <span>Accepted</span>
          <span>Working</span>
          <span>Completed</span>
          <span>Paid</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4, 5].map((step) => {
            const stepConfig = getStepConfig(step);
            const isCompleted = step <= currentStep;
            const isCurrent = step === currentStep;
            
            return (
              <div key={step} className="flex flex-col items-center">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? `bg-${stepConfig.color}-500 text-white` 
                      : 'bg-gray-200 text-gray-400'
                  }`}
                  animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <stepConfig.icon className="w-4 h-4" />
                  )}
                </motion.div>
                <span className={`text-xs mt-1 text-center ${
                  isCompleted ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}>
                  {stepConfig.title.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-gray-900 mb-3">Job Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {application.job?.location?.city && application.job.location.city !== 'Not Available' && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">
                {application.job.location.city}, {application.job.location.state || 'State not specified'}
              </span>
            </div>
          )}
          {(application.paymentAmount && application.paymentAmount > 0) || (application.job?.salary && application.job.salary > 0) ? (
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm font-bold text-green-600">
                ₹{(application.paymentAmount || application.job?.salary || 0).toLocaleString()}
              </span>
            </div>
          ) : null}
          {application.appliedAt && !isNaN(new Date(application.appliedAt).getTime()) && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">
                Applied: {new Date(application.appliedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {application.status === 'completed' && application.paymentDate && !isNaN(new Date(application.paymentDate).getTime()) && (
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm text-gray-700">
                Paid: {new Date(application.paymentDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline - Only show if valid data exists */}
      {application.statusHistory && application.statusHistory.length > 0 && application.statusHistory.some(status => 
        status.status && status.timestamp && !isNaN(new Date(status.timestamp).getTime())
      ) && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">Status Timeline</h4>
          <div className="space-y-3">
            {application.statusHistory
              .filter(status => status.status && status.timestamp && !isNaN(new Date(status.timestamp).getTime()))
              .map((status, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center"
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {status.status?.charAt(0).toUpperCase() + status.status?.slice(1) || 'Status Updated'}
                  </span>
                  <p className="text-xs text-gray-500">
                    {new Date(status.timestamp).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Information */}
      {(application.status === 'accepted' || application.status === 'in-progress') && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Employer Contact</h4>
          <div className="flex items-center">
            <Phone className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm text-gray-700">
              {application.employer?.phone || 'Not provided'}
            </span>
          </div>
        </div>
      )}

      {/* Earnings Summary */}
      {application.status === 'completed' && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Earnings Summary</h4>
              <p className="text-sm text-gray-600">Total earned from this job</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ₹{(application.paymentAmount || application.job?.salary || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                {application.paymentStatus === 'paid' ? 'Payment Received' : 'Payment Pending'}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default JobApplicationProgress; 