import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, User, Building, MapPin, FileText, Phone, Mail, Award, Calendar, Globe } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const EnhancedEmployerRegistration = () => {
  const { loginUser } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [showProfile, setShowProfile] = useState(false);
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
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const steps = [
    {
      title: 'Personal Information',
      icon: User,
      description: 'Tell us about yourself',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX' },
        { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' }
      ]
    },
    {
      title: 'Aadhar Verification',
      icon: CheckCircle,
      description: 'Verify your identity',
      fields: [
        { name: 'verificationDocuments.aadharNumber', label: 'Aadhar Number', type: 'text', required: true, placeholder: 'XXXX XXXX XXXX' }
      ]
    },
    {
      title: 'Business Details',
      icon: Building,
      description: 'About your business',
      fields: [
        { name: 'company.name', label: 'Business/Farm Name', type: 'text', required: true, placeholder: 'Your business name' },
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
      icon: MapPin,
      description: 'Where are you located?',
      fields: [
        { name: 'location.village', label: 'Village/Town', type: 'text', required: true, placeholder: 'Your village or town' },
        { name: 'location.district', label: 'District', type: 'text', required: true, placeholder: 'Your district' },
        { name: 'location.state', label: 'State', type: 'text', required: true, placeholder: 'Your state' },
        { name: 'location.pincode', label: 'Pincode', type: 'text', required: true, placeholder: '123456' }
      ]
    },
    {
      title: 'Business Information',
      icon: FileText,
      description: 'Tell us more about your work',
      fields: [
        { name: 'businessDescription', label: 'Describe your business and work requirements', type: 'textarea', required: true, placeholder: 'Tell us about your business, what kind of work you offer, and what skills you typically look for in workers...' }
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
          return false;
        }
      }
    }
    return true;
  };

  const handleSendOTP = () => {
    if (!formData.verificationDocuments.aadharNumber || formData.verificationDocuments.aadharNumber.length !== 12) {
      return;
    }
    setOtpSent(true);
  };

  const handleVerifyOTP = () => {
    if (!formData.otp.code) {
      return;
    }

    if (formData.otp.code === '0000') {
      setOtpVerified(true);
      setCompletedSteps(prev => new Set([...prev, 2]));
      setTimeout(() => handleNext(), 1000);
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && !otpVerified) {
      return;
    }

    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    if (!otpVerified) {
      setCurrentStep(2);
      return;
    }

    try {
      setSubmitting(true);
      
      // Make actual API call to register employer
      const response = await fetch('https://sindh-backend.onrender.comapi/employers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isLoggedIn: 1,
          registrationDate: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      const employer = result.employer || result;

      // Store employer data in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: employer._id,
        _id: employer._id,
        name: employer.name,
        email: employer.email,
        phone: employer.phone,
        type: 'employer',
        isLoggedIn: 1
      }));
      localStorage.setItem('employer', JSON.stringify(employer));
      localStorage.setItem('employerId', employer._id);
      loginUser({
        id: employer._id,
        _id: employer._id,
        name: employer.name,
        email: employer.email,
        phone: employer.phone,
        type: 'employer',
        isLoggedIn: 1
      });

      // Mark registration as completed
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      // Show success message and redirect to profile page
      setTimeout(() => {
        window.location.href = '/employer/profile';
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed: ' + error.message);
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

    const baseClasses = "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white";

    switch (field.type) {
      case 'select':
        return (
          <motion.select
            name={field.name}
            value={getFieldValue(field.name)}
            onChange={handleInputChange}
            className={baseClasses}
            required={field.required}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </motion.select>
        );
      case 'textarea':
        return (
          <motion.textarea
            name={field.name}
            value={getFieldValue(field.name)}
            onChange={handleInputChange}
            className={baseClasses}
            rows="4"
            required={field.required}
            placeholder={field.placeholder}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          />
        );
      default:
        return (
          <motion.input
            type={field.type}
            name={field.name}
            value={getFieldValue(field.name)}
            onChange={handleInputChange}
            className={baseClasses}
            required={field.required}
            placeholder={field.placeholder}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          />
        );
    }
  };

  const renderAadharVerification = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Aadhar Number
        </label>
        <input
          type="text"
          name="verificationDocuments.aadharNumber"
          value={formData.verificationDocuments.aadharNumber}
          onChange={handleInputChange}
          maxLength="12"
          placeholder="XXXX XXXX XXXX"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          required
        />
      </motion.div>

      {!otpSent ? (
        <motion.button
          type="button"
          onClick={handleSendOTP}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Send OTP
        </motion.button>
      ) : (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP (Use 0000)
            </label>
            <input
              type="text"
              name="otp.code"
              value={formData.otp.code || ''}
              onChange={handleInputChange}
              maxLength="4"
              placeholder="0000"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-center text-lg font-mono"
              required
            />
          </div>
          <motion.button
            type="button"
            onClick={handleVerifyOTP}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg"
          >
            {otpVerified ? (
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Verified!
              </div>
            ) : (
              'Verify OTP'
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );

  const LinkedInStyleProfile = () => {
    const getInitials = (name) => {
      return name.split(' ').map(word => word[0]).join('').toUpperCase();
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            Registration Successful!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600"
          >
            Welcome to SINDH Platform - Your profile is now live
          </motion.p>
        </motion.div>

        {/* LinkedIn-style Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>

          {/* Profile Section */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              className="absolute -top-12 left-6"
            >
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {getInitials(formData.name)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Verification Badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="absolute -top-6 right-6 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-lg"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Verified
            </motion.div>

            {/* Profile Info */}
            <div className="pt-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mb-6"
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {formData.name}
                </h1>
                <p className="text-lg text-blue-600 font-medium mb-2">
                  {formData.company.name}
                </p>
                <p className="text-gray-600 mb-2">
                  {formData.company.type} • {formData.company.industry}
                </p>
                <div className="flex items-center text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  {formData.location.village}, {formData.location.district}, {formData.location.state}
                </div>
              </motion.div>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200"
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">Jobs Posted</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">Active Hires</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">⭐ New</div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
              </motion.div>

              {/* About Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="py-4 border-t border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-600" />
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {formData.businessDescription}
                </p>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="py-4 border-t border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3 text-gray-500" />
                    <span className="text-gray-700">{formData.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-gray-500" />
                    <span className="text-gray-700">{formData.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Building className="w-5 h-5 mr-3 text-gray-500" />
                    <span className="text-gray-700">
                      {formData.location.village}, {formData.location.district}, {formData.location.state} - {formData.location.pincode}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Business Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="py-4 border-t border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Business Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Business Type</div>
                    <div className="font-medium text-gray-900">{formData.company.type}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Primary Activity</div>
                    <div className="font-medium text-gray-900">{formData.company.industry}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Member Since</div>
                    <div className="font-medium text-gray-900">
                      {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Verification Status</div>
                    <div className="font-medium text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verified
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="pt-6 border-t border-gray-200"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Post Your First Job
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:border-gray-400 transition-all duration-200"
                  >
                    View Dashboard
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Edit Profile
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Additional Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="mt-6 grid md:grid-cols-2 gap-6"
        >
          {/* Getting Started Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-orange-500" />
              Getting Started
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-700">Profile Created</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-700">Identity Verified</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs text-gray-600">1</span>
                </div>
                <span className="text-sm text-gray-500">Post Your First Job</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs text-gray-600">2</span>
                </div>
                <span className="text-sm text-gray-500">Receive Applications</span>
              </div>
            </div>
          </div>

          {/* Platform Benefits Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-500" />
              Platform Benefits
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>• Connect with skilled local workers</div>
              <div>• Post jobs quickly and easily</div>
              <div>• Verified worker profiles</div>
              <div>• Secure payment system</div>
              <div>• Rating and review system</div>
              <div>• 24/7 platform support</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <LinkedInStyleProfile />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Employer Registration
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-gray-600"
            >
              Step {currentStep} of {steps.length}
            </motion.p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = completedSteps.has(index + 1);
                const isCurrent = index + 1 === currentStep;
                
                return (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-500 text-white shadow-lg'
                          : isCurrent
                          ? 'bg-blue-500 text-white shadow-lg ring-4 ring-blue-200'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium text-center ${
                      isCurrent ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`flex-1 h-2 mx-1 rounded-full transition-all duration-500 ${
                    index + 1 <= currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {steps[currentStep - 1].title}
                  </h3>
                  <p className="text-gray-600">
                    {steps[currentStep - 1].description}
                  </p>
                </div>

                {currentStep === 2 ? (
                  renderAadharVerification()
                ) : (
                  <div className="space-y-6">
                    {steps[currentStep - 1].fields.map((field, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        {renderField(field)}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="mt-8 flex justify-between"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
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
                  disabled={!validateStep(currentStep) || (currentStep === 2 && !otpVerified)}
                  className={`ml-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    validateStep(currentStep) && (currentStep !== 2 || otpVerified)
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={submitting || !validateStep(currentStep)}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  className={`ml-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg'
                  }`}
                >
                  {submitting ? (
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Creating Profile...
                    </motion.div>
                  ) : (
                    'Complete Registration'
                  )}
                </motion.button>
              )}
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedEmployerRegistration;