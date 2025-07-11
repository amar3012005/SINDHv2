import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Users, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useSpring, animated as a } from '@react-spring/web';
import { getApiUrl } from '../../utils/apiUtils.js';

// Note: Removed unused components to fix ESLint warnings

const PostJob = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [employerProfile, setEmployerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  // Notification system to replace react-toastify
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Navigation function to replace useNavigate
  const navigateToPage = (path) => {
    // Using window.location for navigation since react-router-dom is not available
    if (path === '/employer/posted-jobs') {
      window.location.href = '/employer/posted-jobs';
    } else if (path === '/employer/post-job/chat') {
      window.location.href = '/employer/post-job/chat';
    } else {
      window.location.href = path;
    }
  };

  const handleChatMode = async () => {
    try {
      // Log job creation initiation for chat mode
      console.log('🎉 Chat Mode Job Posting initiated!');
      
      // Call backend to log the initiation
      await fetch(`${getApiUrl()}/jobs/initiate-creation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'chat',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      
      showNotification('Chat mode initiated! Redirecting...', 'success');
      
      // Navigate to chat mode
      navigateToPage('/employer/post-job/chat');
    } catch (error) {
      console.error('Error initiating chat mode:', error);
      showNotification('Could not initiate chat mode. Please try again.', 'error');
    }
  };

  const handleTraditionalForm = async () => {
    try {
      // Log job creation initiation for traditional form
      console.log('🎉 Traditional Form Job Posting initiated!');
      
      // Call backend to log the initiation
      await fetch(`${getApiUrl()}/jobs/initiate-creation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'traditional',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      
      showNotification('Traditional form mode initiated!', 'success');
      
      // Show the traditional form
      setShowDashboard(false);
    } catch (error) {
      console.error('Error initiating traditional form:', error);
      showNotification('Could not initiate traditional form. Please try again.', 'error');
    }
  };

  const [formData, setFormData] = useState({
    // Basic Job Information
    title: '',
    category: '',
    employmentType: 'full-time',
    description: '',
    requirements: '',
    
    // Company Information
    companyName: '',
    
    // Compensation
    salary: '',
    
    // Location (matching backend schema)
    location: {
      type: 'onsite',
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    
    // Job Details
    startDate: '',
    endDate: '',
    urgency: 'normal'
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Load employer profile on component mount
  useEffect(() => {
    const loadEmployerProfile = async () => {
      try {
        setLoadingProfile(true);
        
        // First try to get from localStorage
        const localProfile = localStorage.getItem('employerProfile');
        const localUser = localStorage.getItem('user');
        
        if (localProfile) {
          const profile = JSON.parse(localProfile);
          setEmployerProfile(profile);
          
          // Pre-fill form with employer data
          setFormData(prev => ({
            ...prev,
            companyName: profile.companyName || profile.name || '',
            location: {
              ...prev.location,
              city: profile.location?.city || '',
              state: profile.location?.state || '',
              pincode: profile.location?.pincode || ''
            }
          }));
        } else if (localUser) {
          // Fallback to user data
          const user = JSON.parse(localUser);
          if (user.type === 'employer') {
            setEmployerProfile(user);
            setFormData(prev => ({
              ...prev,
              companyName: user.name || ''
            }));
          }
        }
        
        // Try to fetch fresh data from backend
        const user = JSON.parse(localUser || '{}');
        if (user.id && user.type === 'employer') {
          try {
            const response = await fetch(`${getApiUrl()}/employers/${user.id}`);
            if (response.ok) {
              const profile = await response.json();
              setEmployerProfile(profile);
              localStorage.setItem('employerProfile', JSON.stringify(profile));
              
              // Update form data with fresh profile
              setFormData(prev => ({
                ...prev,
                companyName: profile.companyName || profile.name || prev.companyName,
                location: {
                  ...prev.location,
                  city: profile.location?.city || prev.location.city,
                  state: profile.location?.state || prev.location.state,
                  pincode: profile.location?.pincode || prev.location.pincode
                }
              }));
            }
          } catch (fetchError) {
            console.warn('Could not fetch fresh employer profile:', fetchError);
          }
        }
      } catch (error) {
        console.error('Error loading employer profile:', error);
        showNotification('Could not load your profile. Some fields may need to be filled manually.', 'error');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadEmployerProfile();
  }, []);

  // Form steps configuration
  const steps = useMemo(() => [
    {
      title: 'Job Information',
      icon: Briefcase,
      description: 'Basic details about the job',
      fields: ['title', 'category', 'employmentType', 'description']
    },
    {
      title: 'Company & Requirements',
      icon: DollarSign,
      description: 'Company details and skills needed',
      fields: ['companyName', 'requirements', 'salary']
    },
    {
      title: 'Location & Schedule',
      icon: MapPin,
      description: 'Where and when the work will happen',
      fields: ['location.type', 'location.street', 'location.city', 'location.state', 'location.pincode', 'startDate']
    },
    {
      title: 'Final Details',
      icon: Users,
      description: 'Job urgency and completion',
      fields: ['urgency']
    }
  ], []);

  // Job categories with icons (matching backend enum)
  const jobCategories = [
    { value: 'Agriculture', label: 'Agriculture', icon: '🌾' },
    { value: 'Construction', label: 'Construction', icon: '🏗️' },
    { value: 'Domestic', label: 'Domestic', icon: '🏠' },
    { value: 'Manufacturing', label: 'Manufacturing', icon: '🏭' },
    { value: 'Transportation', label: 'Transportation', icon: '🚚' },
    { value: 'Retail', label: 'Retail', icon: '🛍️' },
    { value: 'Food Service', label: 'Food Service', icon: '🍽️' },
    { value: 'General', label: 'General', icon: '⚡' }
  ];

  // Employment types (matching backend enum)
  const employmentTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'daily-wage', label: 'Daily Wage' }
  ];

  // Urgency levels (matching backend enum)
  const urgencyLevels = [
    { value: 'low', label: 'Low - Can wait a few days', color: 'green' },
    { value: 'normal', label: 'Normal - Within 2-3 days', color: 'blue' },
    { value: 'high', label: 'High - Need within 24 hours', color: 'yellow' },
    { value: 'urgent', label: 'Urgent - Need immediately', color: 'red' }
  ];

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear validation error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Validation functions
  const validateStep = useCallback((step) => {
    const stepFields = steps[step - 1].fields;
    const newErrors = {};
    let isValid = true;

    stepFields.forEach(field => {
      let value;
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        value = formData[parent]?.[child];
      } else {
        value = formData[field];
      }

      // Required field validation
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        const fieldName = field.split('.').pop();
        newErrors[field] = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
        isValid = false;
      }

      // Specific validations
      if (field === 'salary' && value && (isNaN(value) || Number(value) <= 0)) {
        newErrors[field] = 'Please enter a valid salary amount';
        isValid = false;
      }

      // Validate city field specifically
      if (field === 'location.city' && (!value || value.trim() === '')) {
        newErrors[field] = 'City is required';
        isValid = false;
      }

      // Validate state field specifically
      if (field === 'location.state' && (!value || value.trim() === '')) {
        newErrors[field] = 'State is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, steps]);

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => prev - 1);
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Job posting process initiated!');
    console.log('📋 Current form data:', formData);
    console.log('🔍 Validating current step...');
    
    if (!validateStep(currentStep)) {
      console.log('❌ Validation failed for step', currentStep);
      return;
    }

    console.log('✅ Validation passed for step', currentStep);
    setIsSubmitting(true);

    try {
      // Get employer ID and profile
      console.log('🔐 Checking user authentication...');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerProfile = JSON.parse(localStorage.getItem('employerProfile') || '{}');
      
      console.log('👤 User data:', { id: user.id, type: user.type, name: user.name });
      console.log('🏢 Employer profile:', { 
        name: employerProfile.name, 
        companyName: employerProfile.companyName,
        fullProfile: employerProfile 
      });
      
      if (!user.id || user.type !== 'employer') {
        console.error('❌ Authentication failed: User is not an employer');
        throw new Error('You must be logged in as an employer to post jobs');
      }
      
      console.log('✅ Authentication successful: User is an employer');

      // Map employment type to backend format
      const mapEmploymentType = (type) => {
        const mapping = {
          'full-time': 'Full-time',
          'part-time': 'Part-time',
          'contract': 'Contract',
          'temporary': 'Temporary',
          'daily-wage': 'Daily wage'
        };
        return mapping[type] || 'Full-time';
      };

      // Map urgency to backend format
      const mapUrgency = (urgency) => {
        const mapping = {
          'low': 'Low',
          'normal': 'Normal',
          'high': 'High',
          'urgent': 'Urgent'
        };
        return mapping[urgency] || 'Normal';
      };

      // Validate required location fields before submission
      if (!formData.location.city || formData.location.city.trim() === '') {
        throw new Error('City is required. Please fill in the city field.');
      }
      
      if (!formData.location.state || formData.location.state.trim() === '') {
        throw new Error('State is required. Please fill in the state field.');
      }

      // Get consistent company name
      const getCompanyName = () => {
        // Priority order: formData.companyName > employerProfile.companyName > employerProfile.name > user.name > fallback
        const companyName = formData.companyName || employerProfile.companyName || employerProfile.name || user.name;
        
        if (!companyName || companyName.trim() === '') {
          return 'Not Specified';
        }
        
        return companyName.trim();
      };

      // Prepare job data for API (matching backend schema exactly)
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        salary: Number(formData.salary),
        category: formData.category,
        employmentType: mapEmploymentType(formData.employmentType),
        location: {
          type: formData.location.type,
          street: formData.location.street,
          city: formData.location.city.trim(),
          state: formData.location.state.trim(),
          pincode: formData.location.pincode
        },
        urgency: mapUrgency(formData.urgency),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        employer: user.id,
        companyName: getCompanyName(),
        skillsRequired: [], // Backend expects this array
        status: 'active' // Backend expects this field
      };

      // Log the company name determination process
      console.log('🏢 Company name determination:', {
        formCompanyName: formData.companyName,
        employerProfileCompanyName: employerProfile.companyName,
        employerProfileName: employerProfile.name,
        userName: user.name,
        finalCompanyName: getCompanyName()
      });

      console.log('📝 Step 1: Preparing job data in correct schema format...');
      console.log('📋 Job data structure:', {
        title: jobData.title,
        description: jobData.description,
        category: jobData.category,
        salary: jobData.salary,
        employmentType: jobData.employmentType,
        location: jobData.location,
        urgency: jobData.urgency,
        employer: jobData.employer,
        companyName: jobData.companyName,
        skillsRequired: jobData.skillsRequired,
        status: jobData.status
      });

      console.log('📝 Step 2: Submitting job data to backend API...');
      console.log('🌐 API Endpoint: http://localhost:10000/api/jobs');
      console.log('📤 Request Method: POST');
      console.log('📦 Request Body:', JSON.stringify(jobData, null, 2));

      // Submit to backend
              const response = await fetch(`${getApiUrl()}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
      });

      console.log('📝 Step 3: Backend response received...');
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Backend error response:', errorData);
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const savedJob = await response.json();
      console.log('✅ Job saved successfully!');
      console.log('📋 Saved job details:', {
        id: savedJob._id || savedJob.id,
        title: savedJob.title,
        category: savedJob.category,
        salary: savedJob.salary,
        employer: savedJob.employer,
        status: savedJob.status,
        createdAt: savedJob.createdAt
      });
      console.log('🎉 Complete job object:', savedJob);

      // Update local storage and employer profile
      console.log('📝 Step 4: Updating local storage with new job...');
      try {
        const currentProfile = JSON.parse(localStorage.getItem('employerProfile') || '{}');
        const updatedProfile = {
          ...currentProfile,
          postedJobs: [...(currentProfile.postedJobs || []), savedJob._id || savedJob.id]
        };
        localStorage.setItem('employerProfile', JSON.stringify(updatedProfile));
        console.log('✅ Local storage updated successfully');
        console.log('📋 Updated profile posted jobs:', updatedProfile.postedJobs);
      } catch (storageError) {
        console.warn('⚠️ Could not update local profile:', storageError);
      }

      // Show success message
      console.log('📝 Step 5: Job posting process completed successfully!');
      console.log('🎯 Redirecting to posted jobs page in 3 seconds...');
      
      showNotification('Job posted successfully!', 'success');
      
      // Mark completion
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setShowSuccessModal(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        console.log('🔄 Redirecting to: /employer/posted-jobs');
        navigateToPage('/employer/posted-jobs');
      }, 3000);

    } catch (error) {
      console.error('❌ Error posting job:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showNotification(error.message || 'Failed to post job. Please try again.', 'error');
    } finally {
      console.log('🏁 Job posting process finished (success or error)');
      setIsSubmitting(false);
    }
  };

  // Render form field based on type
  const renderField = (field, stepIndex) => {
    const getFieldValue = (fieldName) => {
      if (fieldName.includes('.')) {
        const [parent, child] = fieldName.split('.');
        return formData[parent]?.[child] || '';
      }
      return formData[fieldName] || '';
    };

    const baseClasses = `w-full px-3 py-2.5 border border-gray-300 rounded-xl transition-all duration-200 shadow-sm text-sm ${
      errors[field] 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-200 focus:border-[#ff6b35] focus:ring-[#ff6b35]'
    } focus:outline-none focus:ring-1 focus:ring-opacity-20 bg-white`;

    switch (field) {
      case 'title':
        return (
          <input
            type="text"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="e.g., Construction Helper, Farm Worker, House Cleaner"
            className={baseClasses}
            required
          />
        );

      case 'category':
        return (
          <select
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            className={baseClasses}
            required
          >
            <option value="">Select job category</option>
            {jobCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        );

      case 'employmentType':
        return (
          <select
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            className={baseClasses}
            required
          >
            {employmentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        );

      case 'description':
        return (
          <textarea
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="Describe the work that needs to be done, working conditions, and any important details..."
            className={`${baseClasses} min-h-[120px] resize-vertical`}
            rows="4"
            required
          />
        );

      case 'companyName':
        return (
          <input
            type="text"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="Enter your company name (optional - will use profile if left empty)"
            className={baseClasses}
          />
        );

      case 'requirements':
        return (
          <textarea
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="List skills, experience, or qualifications needed (e.g., 'Physical strength required', 'Experience with tools preferred', 'Must be able to work in heat')"
            className={`${baseClasses} min-h-[100px] resize-vertical`}
            rows="3"
            required
          />
        );

      case 'salary':
        return (
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-2xl">
              ₹
            </span>
            <input
              type="number"
              name={field}
              value={getFieldValue(field)}
              onChange={handleInputChange}
              placeholder="Enter amount"
              className={`${baseClasses} rounded-l-none rounded-r-2xl`}
              min="1"
              required
            />
          </div>
        );



      case 'startDate':
        return (
          <input
            type="date"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            className={baseClasses}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        );

      case 'endDate':
        return (
          <input
            type="date"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            className={baseClasses}
            min={formData.startDate || new Date().toISOString().split('T')[0]}
          />
        );



      case 'urgency':
        return (
          <div className="space-y-2">
            {urgencyLevels.map(level => (
              <label key={level.value} className="flex items-center space-x-3 p-3 border rounded-2xl hover:bg-gray-50 cursor-pointer transition-all duration-200 shadow-sm">
                <input
                  type="radio"
                  name={field}
                  value={level.value}
                  checked={getFieldValue(field) === level.value}
                  onChange={handleInputChange}
                  className="text-[#ff6b35]"
                />
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${level.color}-500`}></div>
                  <span className="text-sm font-medium">{level.label}</span>
                </div>
              </label>
            ))}
          </div>
        );



      case 'location.type':
        return (
          <select
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            className={baseClasses}
            required
          >
            <option value="">Select work location type</option>
            <option value="onsite">On-site (At specific location)</option>
            <option value="remote">Remote (Work from home)</option>
            <option value="hybrid">Hybrid (Mix of both)</option>
          </select>
        );

      case 'location.street':
        return (
          <input
            type="text"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="Enter street address or location details"
            className={baseClasses}
            required
          />
        );

      default:
        // Handle location fields and other inputs
        const getPlaceholder = (fieldName) => {
          if (fieldName === 'location.city') return 'Enter city name (required)';
          if (fieldName === 'location.state') return 'Enter state name (required)';
          if (fieldName === 'location.street') return 'Enter street address';
          if (fieldName === 'location.pincode') return 'Enter 6-digit PIN code';
          return `Enter ${fieldName.split('.').pop()}`;
        };

        const isRequired = (fieldName) => {
          return fieldName === 'location.city' || fieldName === 'location.state' || steps[stepIndex].fields.includes(fieldName);
        };

        return (
          <input
            type="text"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder={getPlaceholder(field)}
            className={baseClasses}
            required={isRequired(field)}
          />
        );
    }
  };

  // Get field label
  const getFieldLabel = (field) => {
    const labels = {
      'title': 'Job Title',
      'category': 'Job Category',
      'employmentType': 'Employment Type',
      'description': 'Job Description',
      'companyName': 'Company Name',
      'requirements': 'Requirements & Skills',
      'salary': 'Salary Amount',
      'startDate': 'Start Date',
      'endDate': 'End Date (Optional)',
      'urgency': 'How urgent is this job?',
      'location.type': 'Work Location Type',
      'location.street': 'Street Address',
      'location.city': 'City *',
      'location.state': 'State *',
      'location.pincode': 'PIN Code'
    };
    return labels[field] || field;
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ff6b35] mx-auto mb-4"></div>
          <p className="text-[#666]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show dashboard first
  if (showDashboard) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f5f6fa] px-4 pt-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-[calc(100vh-4rem)]">
          {/* Progress Bar */}
          <div className="w-full h-0.5 bg-[#e0e0e0] rounded-full overflow-hidden mb-6">
            <motion.div
              className="h-0.5 bg-[#222] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.4 }}
              aria-label="Progress"
            />
          </div>
          
          {/* Step Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="flex flex-col gap-8"
          >
            {/* Question/Prompt */}
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-[#222] mb-2 leading-tight" style={{ letterSpacing: '-0.3px' }}>
                Choose Your Method
              </h2>
              <p className="text-sm md:text-base text-[#222]/60 mt-1">Select how you'd like to post your job</p>
            </div>
            
            {/* Options */}
            <div className="flex flex-col gap-4">
              <motion.button
                onClick={handleChatMode}
                className="w-full py-4 px-5 bg-[#222] text-white rounded-xl text-base font-medium flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#ff6b35] transition-all duration-200 shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Chat Mode"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">💬</span>
                  <span>Chat Mode</span>
                </div>
                <span className="text-sm opacity-80">→</span>
              </motion.button>
              
              <motion.button
                onClick={handleTraditionalForm}
                className="w-full py-4 px-5 bg-[#ff6b35] text-white rounded-xl text-base font-medium flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#ff6b35] transition-all duration-200 shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Traditional Form"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📝</span>
                  <span>Traditional Form</span>
                </div>
                <span className="text-sm opacity-80">→</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f5f6fa] px-4 pt-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Step Indicator */}
      <div className="w-full flex flex-col items-center justify-center pb-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2"
        >
          <span className="text-xs font-medium text-[#ff6b35] tracking-wider">
            STEP {currentStep} OF {steps.length}
          </span>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-1 h-1 bg-[#ff6b35] rounded-full"
          />
        </motion.div>
      </div>
      
      <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-[calc(100vh-6rem)]">
        {/* Progress Bar */}
        <div className="w-full h-0.5 bg-[#e0e0e0] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-0.5 bg-[#222] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            aria-label="Progress"
          />
        </div>
        
        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="flex flex-col gap-6"
        >
          {/* Question/Prompt */}
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-[#222] mb-2 leading-tight" style={{ letterSpacing: '-0.3px' }}>
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm md:text-base text-[#222]/60 mt-1">{steps[currentStep - 1].description}</p>
            {currentStep === 3 && (
              <p className="text-xs text-[#ff6b35] mt-2">⚠️ City and State are required</p>
            )}
          </div>
          
          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-4">
              {steps[currentStep - 1].fields.map((field, index) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <label className="block text-xs font-medium text-[#222] mb-1.5">
                    {getFieldLabel(field)}
                    {(field === 'location.city' || field === 'location.state' || 
                      (steps[currentStep - 1].fields.includes(field) && field !== 'endDate' && field !== 'additionalInstructions')) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {renderField(field, currentStep - 1)}
                  {errors[field] && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-600 flex items-center"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors[field]}
                    </motion.p>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Navigation Buttons */}
            <motion.div
              className="flex justify-between mt-6"
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
                  className="px-4 py-2.5 bg-[#222] text-white rounded-xl hover:bg-[#333] transition-all duration-200 font-medium shadow-sm text-sm"
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
                  className="ml-auto px-4 py-2.5 bg-[#ff6b35] text-white rounded-xl hover:bg-[#e55a2b] transition-all duration-200 font-medium shadow-sm text-sm"
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className={`ml-auto px-4 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm text-sm ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-[#ff6b35] text-white hover:bg-[#e55a2b]'
                  }`}
                >
                  {isSubmitting ? (
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="text-xs">Posting...</span>
                    </motion.div>
                  ) : (
                    'Post Job'
                  )}
                </motion.button>
              )}
            </motion.div>
          </form>
        </motion.div>
      </div>

      {/* Notification System */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#222] text-white px-4 py-2.5 rounded-2xl shadow-lg z-50 text-sm font-medium"
            style={{ minWidth: 200, textAlign: 'center' }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-[#ff6b35] rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-[#222] mb-2">Job Posted Successfully!</h3>
              <p className="text-[#666] mb-4">
                Your job has been published and workers can now apply.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigateToPage('/employer/posted-jobs')}
                  className="flex-1 px-4 py-2 bg-[#ff6b35] text-white rounded-2xl hover:bg-[#e55a2b] shadow-sm"
                >
                  View Posted Jobs
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-[#222] text-white rounded-2xl hover:bg-[#333] shadow-sm"
                >
                  Post Another
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostJob;