import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, User, Award, MapPin, FileText, Phone, Mail, Briefcase, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';

const EnhancedWorkerRegistration = () => {
  const navigate = useNavigate();
  const { loginUser } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [showProfile, setShowProfile] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information (Step 1)
    name: '',
    age: '',
    phone: '',
    email: '',
    gender: '',
    
    // Identity Verification (Step 2)
    aadharNumber: '',
    
    // Skills & Experience (Step 3)
    skills: [],
    experience: '',
    expectedSalary: '',
    preferredCategory: '',
    
    // Languages (Step 4)
    languages: [],
    
    // Location Details (Step 5)
    location: {
      address: '',
      village: '',
      district: '',
      state: '',
      pincode: '',
      coordinates: {
        type: "Point",
        coordinates: [0, 0]
      }
    },
    
    // Work Preferences (Step 6)
    preferredWorkType: '',
    availability: '',
    bio: '',
    
    // System fields
    verificationStatus: 'pending',
    isAvailable: true,
    workRadius: 10,
    shaktiScore: 0,
    rating: {
      average: 0,
      count: 0,
      reviews: []
    },
    
    // Timestamps
    registrationDate: '',
    lastLogin: '',
    isLoggedIn: 0,
    
    // Profile completion tracking
    profileCompletionPercentage: 0,
    
    // Additional optional fields
    profilePicture: '',
    documents: [],
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: ''
    },
    
    // Work history
    workHistory: [],
    activeJobs: 0,
    completedJobs: 0,
    
    // Contact preferences
    emailNotifications: true,
    smsNotifications: true,
    
    // Emergency contact
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },
    
    // OTP
    otp: {
      code: '',
      expiresAt: null
    }
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const skillOptions = [
    'Construction', 'Carpentry', 'Masonry', 'Plumbing', 'Electrical', 'Painting', 
    'Welding', 'Farming', 'Agriculture', 'Landscaping', 'Cleaning', 'Cooking',
    'Household Help', 'Child Care', 'Elder Care', 'Driving', 'Delivery',
    'Manufacturing', 'Packaging', 'Loading/Unloading', 'Security', 'Other'
  ];

  const languageOptions = [
    'Hindi', 'English', 'Marathi', 'Gujarati', 'Punjabi', 'Bengali', 
    'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Odia', 'Urdu'
  ];

  const steps = [
    {
      title: 'Personal Information',
      icon: User,
      description: 'Tell us about yourself',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
        { name: 'age', label: 'Age', type: 'number', required: true, placeholder: 'Your age', min: 18, max: 70 },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+91 XXXXX XXXXX' },
        { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'your@email.com (optional)' },
        { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] }
      ]
    },
    {
      title: 'Aadhar Verification',
      icon: CheckCircle,
      description: 'Verify your identity',
      fields: [
        { name: 'aadharNumber', label: 'Aadhar Number', type: 'text', required: true, placeholder: 'XXXX XXXX XXXX', maxLength: 12 }
      ]
    },
    {
      title: 'Skills & Experience',
      icon: Award,
      description: 'What can you do?',
      fields: [
        { name: 'skills', label: 'Skills', type: 'multiselect', required: true, options: skillOptions },
        { name: 'experience', label: 'Years of Experience', type: 'select', required: true, options: [
          'Less than 1 year', '1-2 years', '3-5 years', '6-10 years', 'More than 10 years'
        ]},
        { name: 'preferredCategory', label: 'Preferred Work Category', type: 'select', required: true, options: [
          'Construction', 'Agriculture', 'Household', 'Transportation', 'Manufacturing', 'Retail', 'Other'
        ]},
        { name: 'expectedSalary', label: 'Expected Daily Wage', type: 'text', required: true, placeholder: 'e.g., ₹500/day' }
      ]
    },
    {
      title: 'Languages',
      icon: Languages,
      description: 'Languages you can speak',
      fields: [
        { name: 'languages', label: 'Languages', type: 'multiselect', required: true, options: languageOptions }
      ]
    },
    {
      title: 'Location Details',
      icon: MapPin,
      description: 'Where are you located?',
      fields: [
        { name: 'location.address', label: 'Full Address', type: 'textarea', required: false, placeholder: 'Your complete address' },
        { name: 'location.village', label: 'Village/Town', type: 'text', required: true, placeholder: 'Your village or town' },
        { name: 'location.district', label: 'District', type: 'text', required: true, placeholder: 'Your district' },
        { name: 'location.state', label: 'State', type: 'text', required: true, placeholder: 'Your state' },
        { name: 'location.pincode', label: 'Pincode', type: 'text', required: true, placeholder: '123456', maxLength: 6 }
      ]
    },
    {
      title: 'Work Preferences',
      icon: Briefcase,
      description: 'Your work preferences',
      fields: [
        { name: 'preferredWorkType', label: 'Preferred Work Type', type: 'select', required: true, options: [
          'Full-time daily work', 'Part-time work', 'Contract work', 'Seasonal work', 'Flexible hours'
        ]},
        { name: 'availability', label: 'Availability', type: 'select', required: true, options: [
          'Available immediately', 'Available within a week', 'Available within a month', 'Seasonal availability'
        ]},
        { name: 'workRadius', label: 'Willing to work within (km)', type: 'select', required: true, options: [
          '5', '10', '15', '20', '25', '50+'
        ]},
        { name: 'bio', label: 'Tell us about yourself', type: 'textarea', required: false, placeholder: 'Describe your work experience, strengths, and what makes you a good worker...' }
      ]
    }
  ];

  const calculateShaktiScore = (data) => {
    let score = 0;
    
    // Basic Information (25 points)
    if (data.name) score += 5;
    if (data.phone) score += 5;
    if (data.email) score += 3;
    if (data.age >= 18 && data.age <= 65) score += 7;
    if (data.gender) score += 5;

    // Skills & Experience (30 points)
    if (data.skills?.length > 0) score += 10;
    if (data.skills?.length >= 3) score += 5; // Bonus for multiple skills
    if (data.experience) score += 8;
    if (data.expectedSalary) score += 4;
    if (data.preferredCategory) score += 3;

    // Languages (15 points)
    if (data.languages?.length > 0) score += 8;
    if (data.languages?.length >= 2) score += 4; // Bonus for multilingual
    if (data.languages?.includes('English')) score += 3; // English bonus

    // Location (15 points)
    if (data.location?.village) score += 4;
    if (data.location?.district) score += 4;
    if (data.location?.state) score += 4;
    if (data.location?.pincode) score += 3;

    // Work Preferences (10 points)
    if (data.availability) score += 3;
    if (data.preferredWorkType) score += 3;
    if (data.workRadius) score += 2;
    if (data.bio && data.bio.length > 50) score += 2;

    // Verification (5 points)
    if (data.aadharNumber && data.aadharNumber.length === 12) score += 5;

    return Math.min(score, 100); // Cap at 100
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      // Clean phone number - remove spaces and non-numeric characters except +
      const cleanPhone = value.replace(/[^\d+]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleanPhone
      }));
      return;
    }
    
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

  const handleMultiSelect = (name, option) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(option)
        ? prev[name].filter(item => item !== option)
        : [...prev[name], option]
    }));
  };

  const validateStep = (step) => {
    const currentFields = steps[step - 1].fields;
    let isValid = true;
    
    for (const field of currentFields) {
      if (field.required) {
        let value;
        if (field.name.includes('.')) {
          const [parent, child] = field.name.split('.');
          value = formData[parent]?.[child];
        } else {
          value = formData[field.name];
        }

        if (field.type === 'multiselect') {
          if (!value || !Array.isArray(value) || value.length === 0) {
            console.log(`Validation failed for ${field.name}: empty array`);
            isValid = false;
          }
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          console.log(`Validation failed for ${field.name}: empty value`);
          isValid = false;
        }
      }
    }
    
    // Additional validation for specific fields
    if (step === 1) {
      if (formData.age && (formData.age < 18 || formData.age > 70)) {
        console.log('Age validation failed');
        isValid = false;
      }
    }
    
    console.log(`Step ${step} validation result:`, isValid);
    return isValid;
  };

  const handleSendOTP = () => {
    if (!formData.aadharNumber || formData.aadharNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhar number');
      return;
    }
    setOtpSent(true);
    toast.success('OTP sent to your registered mobile number');
  };

  const handleVerifyOTP = () => {
    if (!formData.otp?.code) {
      toast.error('Please enter the OTP');
      return;
    }

    if (formData.otp.code === '0000') {
      setOtpVerified(true);
      setCompletedSteps(prev => new Set([...prev, 2]));
      toast.success('OTP verified successfully!');
      setTimeout(() => handleNext(), 1000);
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && !otpVerified) {
      toast.error('Please verify your OTP first');
      return;
    }

    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!otpVerified) {
      setCurrentStep(2);
      toast.error('Please verify your Aadhar first');
      return;
    }

    try {
      setSubmitting(true);
      
      // Calculate Shakti Score
      const shaktiScore = calculateShaktiScore(formData);
      
      // Prepare worker data for API - fix data structure to match backend schema
      const workerData = {
        // Personal Information
        name: formData.name,
        age: parseInt(formData.age),
        phone: formData.phone.replace(/\s+/g, ''), // Remove spaces
        email: formData.email,
        gender: formData.gender,
        
        // Identity
        aadharNumber: formData.aadharNumber,
        
        // Professional Information
        skills: formData.skills,
        experience: formData.experience,
        preferredCategory: formData.preferredCategory,
        expectedSalary: formData.expectedSalary,
        languages: formData.languages,
        
        // Location
        location: {
          address: formData.location.address,
          village: formData.location.village,
          district: formData.location.district,
          state: formData.location.state,
          pincode: formData.location.pincode,
          coordinates: {
            type: "Point",
            coordinates: [0, 0] // Can be updated later with actual GPS coordinates
          }
        },
        
        // Work Preferences
        preferredWorkType: formData.preferredWorkType,
        availability: formData.availability,
        workRadius: parseInt(formData.workRadius) || 10,
        bio: formData.bio,
        
        // System fields
        verificationStatus: 'pending',
        isAvailable: true,
        shaktiScore: shaktiScore,
        rating: {
          average: 0,
          count: 0,
          reviews: []
        },
        
        // Timestamps
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isLoggedIn: 1,
        
        // Profile tracking
        profileCompletionPercentage: calculateProfileCompletion(formData),
        
        // Initialize empty arrays/objects
        documents: [],
        workHistory: [],
        activeJobs: 0,
        completedJobs: 0,
        
        // Contact preferences
        emailNotifications: true,
        smsNotifications: true,
        
        // Additional fields
        profilePicture: '',
        bankDetails: {
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          accountHolderName: ''
        },
        emergencyContact: {
          name: '',
          phone: '',
          relation: ''
        },
        
        // User type for the system
        type: 'worker'
      };

      // Remove fields that might cause issues
      delete workerData.rating;
      delete workerData.reviews;
      
      console.log('Submitting worker data:', workerData);

      // Make API call to save worker data
      const response = await fetch('https://sindh-backend.onrender.comapi/workers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerData)
      });

      let savedWorker;
      
      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      try {
        savedWorker = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response format from server');
      }
      
      // Update form data with saved worker ID
      setFormData(prev => ({
        ...prev,
        id: savedWorker.worker?.id || savedWorker.worker?._id || prev.id,
        shaktiScore
      }));
      
      // Store in localStorage for persistence
      const completeWorkerData = {
        ...workerData,
        id: savedWorker.worker?.id || savedWorker.worker?._id || workerData.id,
        type: 'worker',
        rating: { average: 0, count: 0 }, // Restore for frontend use
        reviews: []
      };
      localStorage.setItem('user', JSON.stringify(completeWorkerData));
      localStorage.setItem('worker', JSON.stringify(completeWorkerData));
      localStorage.setItem('userType', 'worker');
      loginUser(completeWorkerData);
      
      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      toast.success('Registration successful!');
      
      // Show success animation then profile
      setTimeout(() => {
        setShowProfile(true);
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(`Registration failed: ${error.message}`);
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
      case 'multiselect':
        return (
          <motion.div
            className="grid grid-cols-2 gap-2"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {field.options.map(option => (
              <motion.button
                key={option}
                type="button"
                onClick={() => handleMultiSelect(field.name, option)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  getFieldValue(field.name).includes(option)
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </motion.button>
            ))}
          </motion.div>
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
            min={field.min}
            max={field.max}
            maxLength={field.maxLength}
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
          name="aadharNumber"
          value={formData.aadharNumber}
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
              Enter OTP (Use 0000 for demo)
            </label>
            <input
              type="text"
              name="otp.code"
              value={formData.otp?.code || ''}
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

  const WorkerProfile = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Award className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900"
        >
          Welcome, {formData.name}!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mt-2"
        >
          Your worker profile has been created successfully
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <div className="text-4xl font-bold text-blue-600">{formData.shaktiScore}</div>
          <div className="text-sm text-gray-500">Shakti Score</div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Personal Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-3 text-gray-500" />
              <span className="text-gray-700">{formData.phone}</span>
            </div>
            {formData.email && (
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-gray-500" />
                <span className="text-gray-700">{formData.email}</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              Age: {formData.age} • Gender: {formData.gender}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-green-600" />
            Skills & Experience
          </h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {formData.skills.slice(0, 3).map(skill => (
                <span key={skill} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  {skill}
                </span>
              ))}
              {formData.skills.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{formData.skills.length - 3} more
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Experience: {formData.experience}
            </div>
            <div className="text-sm text-gray-600">
              Expected: {formData.expectedSalary}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-purple-600" />
            Location
          </h3>
          <div className="space-y-2">
            <div className="text-gray-700">
              {formData.location.village}, {formData.location.district}
            </div>
            <div className="text-sm text-gray-600">
              {formData.location.state} - {formData.location.pincode}
            </div>
            <div className="text-sm text-gray-600">
              Work radius: {formData.workRadius} km
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Languages className="w-5 h-5 mr-2 text-orange-600" />
            Languages & Availability
          </h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {formData.languages.map(lang => (
                <span key={lang} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {lang}
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {formData.availability}
            </div>
            <div className="text-sm text-gray-600">
              {formData.preferredWorkType}
            </div>
          </div>
        </motion.div>
      </div>

      {formData.bio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-600" />
            About Me
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {formData.bio}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mt-8 flex justify-center space-x-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/worker/find-work')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Find Work Now
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/worker/profile')}
          className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          View Profile
        </motion.button>
      </motion.div>
    </motion.div>
  );

  const calculateProfileCompletion = (data) => {
    const requiredFields = [
      'name', 'age', 'phone', 'gender', 'aadharNumber',
      'skills', 'experience', 'preferredCategory', 'expectedSalary',
      'languages', 'location.village', 'location.district', 'location.state',
      'preferredWorkType', 'availability'
    ];
    
    let completedFields = 0;
    
    requiredFields.forEach(field => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (data[parent] && data[parent][child]) completedFields++;
      } else {
        if (field === 'skills' || field === 'languages') {
          if (data[field] && data[field].length > 0) completedFields++;
        } else if (data[field]) {
          completedFields++;
        }
      }
    });
    
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <WorkerProfile workerData={formData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
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
              className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
            >
              Worker Registration
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
                    <span className={`mt-2 text-xs font-medium text-center max-w-20 ${
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
                    index + 1 <= currentStep ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gray-200'
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
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderField(field)}
                        {field.name === 'skills' && formData.skills.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: {formData.skills.join(', ')}
                          </div>
                        )}
                        {field.name === 'languages' && formData.languages.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: {formData.languages.join(', ')}
                          </div>
                        )}
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
                  onClick={(e) => {
                    console.log('Submit button clicked');
                    console.log('Current validation state:', validateStep(currentStep));
                    console.log('OTP verified:', otpVerified);
                    console.log('Submitting state:', submitting);
                    handleSubmit(e);
                  }}
                  disabled={submitting || !validateStep(currentStep) || !otpVerified}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  className={`ml-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    submitting || !validateStep(currentStep) || !otpVerified
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

          {/* Progress Summary */}
          {currentStep === steps.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200"
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Registration Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {formData.name}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {formData.phone}
                </div>
                <div>
                  <span className="font-medium">Skills:</span> {formData.skills.length} selected
                </div>
                <div>
                  <span className="font-medium">Languages:</span> {formData.languages.length} selected
                </div>
                <div>
                  <span className="font-medium">Experience:</span> {formData.experience}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {formData.location.village}, {formData.location.district}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Estimated Shakti Score:</span>
                  <span className="text-2xl font-bold text-blue-600">{calculateShaktiScore(formData)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Your Shakti Score reflects your profile completeness and will help employers find you.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedWorkerRegistration;