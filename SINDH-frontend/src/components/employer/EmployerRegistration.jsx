import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { employerService } from '../../services/employerService';

const EmployerRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: {
      name: '',
      type: '',
      industry: ''
    },
    location: {
      village: '',
      district: '',
      state: '',
      pincode: '',
      coordinates: {
        type: "Point",
        coordinates: [0, 0]
      }
    },
    businessDescription: '',
    verificationDocuments: {
      aadharNumber: '',
      panNumber: '',
      businessLicense: ''
    },
    documents: [],
    preferredLanguages: [],
    rating: {
      average: 0,
      count: 0
    },
    reviews: [],
    otp: {
      code: null,
      expiresAt: null
    },
    verificationStatus: 'pending'
  });
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const steps = [
    {
      title: 'Personal Information',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true }
      ]
    },
    {
      title: 'Aadhar Verification',
      fields: [
        { name: 'verificationDocuments.aadharNumber', label: 'Aadhar Number', type: 'text', required: true }
      ]
    },
    {
      title: 'Business Details',
      fields: [
        { name: 'company.name', label: 'Business/Farm Name', type: 'text', required: true },
        { name: 'company.type', label: 'Business Type', type: 'select', required: true, options: [
          'Agricultural Farm',
          'Small Scale Industry',
          'Local Shop/Business',
          'Construction Company',
          'Food Processing Unit',
          'Handicraft Unit',
          'Dairy Farm',
          'Poultry Farm',
          'Other'
        ]},
        { name: 'company.industry', label: 'Primary Activity', type: 'select', required: true, options: [
          'Agriculture',
          'Dairy Farming',
          'Poultry',
          'Handicrafts',
          'Food Processing',
          'Construction',
          'Local Trade',
          'Small Manufacturing',
          'Other'
        ]}
      ]
    },
    {
      title: 'Location Details',
      fields: [
        { name: 'location.village', label: 'Village/Town', type: 'text', required: true },
        { name: 'location.district', label: 'District', type: 'text', required: true },
        { name: 'location.state', label: 'State', type: 'text', required: true },
        { name: 'location.pincode', label: 'Pincode', type: 'text', required: true }
      ]
    },
    {
      title: 'Business Information',
      fields: [
        { name: 'businessDescription', label: 'Describe your business and work requirements', type: 'textarea', required: true }
      ]
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateStep = (step) => {
    const currentFields = steps[step - 1].fields;
    for (const field of currentFields) {
      if (field.required) {
        let value;
        if (field.name.includes('.')) {
          const [parent, child] = field.name.split('.');
          value = formData[parent]?.[child];
        } else {
          value = formData[field.name];
        }

        if (!value || value.trim() === '') {
          toast.error(`Please fill in ${field.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSendOTP = () => {
    if (!formData.verificationDocuments.aadharNumber || formData.verificationDocuments.aadharNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhar number');
      return;
    }

    setOtpSent(true);
    toast.success('OTP sent successfully. Use 0000 as OTP');
  };

  const handleVerifyOTP = () => {
    if (!formData.otp.code) {
      toast.error('Please enter the OTP');
      return;
    }

    if (formData.otp.code === '0000') {
      setOtpVerified(true);
      toast.success('Aadhar verification successful');
      handleNext();
    } else {
      toast.error('Invalid OTP. Please use 0000');
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && !otpVerified) {
      toast.error('Please complete Aadhar verification first');
      return;
    }

    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateAllSteps = () => {
    for (let step = 1; step <= steps.length; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps before submitting
    if (!validateAllSteps()) {
      toast.error('Please complete all required fields in all steps');
      return;
    }

    // Validate Aadhar verification
    if (!otpVerified) {
      setCurrentStep(2);
      toast.error('Please complete Aadhar verification');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare employer data with login status
      const employerData = {
        ...formData,
        isLoggedIn: 1,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log('Submitting employer data:', employerData);

      // Save employer to database
      const response = await employerService.register(employerData);
      console.log('Registration response:', response);
      
      // Check if we have a valid response with an _id
      if (response && response._id) {
        // Save the employer ID to localStorage
        localStorage.setItem('employerId', JSON.stringify(response._id));
        
        // Also save the full employer data for immediate use
        localStorage.setItem('employer', JSON.stringify(response));
        
        toast.success('Registration successful! Redirecting to profile...');
        
        // Navigate to employer profile after successful registration
        setTimeout(() => {
          navigate('/employer/profile');
        }, 2000);
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Registration successful but received invalid data from server');
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const getFieldValue = (fieldName) => {
      if (fieldName.includes('.')) {
        const [parent, child] = fieldName.split('.');
        return formData[parent]?.[child] || '';
      }
      return formData[fieldName] || '';
    };

    switch (field.type) {
      case 'select':
        return (
          <select
            name={field.name}
            value={getFieldValue(field.name)}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={getFieldValue(field.name)}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="4"
            required={field.required}
          />
        );
      default:
        return (
          <input
            type={field.type}
            name={field.name}
            value={getFieldValue(field.name)}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={field.required}
          />
        );
    }
  };

  const renderAadharVerification = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aadhar Number
        </label>
        <input
          type="text"
          name="verificationDocuments.aadharNumber"
          value={formData.verificationDocuments.aadharNumber}
          onChange={handleInputChange}
          maxLength="12"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {!otpSent ? (
        <button
          type="button"
          onClick={handleSendOTP}
          className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Send OTP
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP (Use 0000)
            </label>
            <input
              type="text"
              name="otp.code"
              value={formData.otp.code || ''}
              onChange={handleInputChange}
              maxLength="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="button"
            onClick={handleVerifyOTP}
            className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Verify OTP
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Employer Registration</h2>
            <p className="mt-2 text-gray-600">Step {currentStep} of {steps.length}</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 mx-1 rounded-full ${
                    index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {steps[currentStep - 1].title}
                </h3>

                {currentStep === 2 ? (
                  renderAadharVerification()
                ) : (
                  steps[currentStep - 1].fields.map((field, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {renderField(field)}
                    </div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </motion.button>
              )}
              
              {currentStep < steps.length ? (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`ml-auto px-6 py-2 text-white rounded-lg transition-colors ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployerRegistration; 