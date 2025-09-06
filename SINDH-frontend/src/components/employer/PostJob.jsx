import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Users, 
  CheckCircle,
  AlertCircle,
  ClipboardList,
  ArrowLeft,
  Menu
} from 'lucide-react';
import { useSpring, animated as a } from '@react-spring/web';
import { getApiUrl } from '../../utils/apiUtils.js';
import { useTranslation } from 'react-i18next';

// Note: Removed unused components to fix ESLint warnings

const PostJob = () => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [employerProfile, setEmployerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  // Language and menu controls
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('homeLang');
    if (stored === 'HI' || stored === 'EN') return stored;
    return (i18n.language && i18n.language.toLowerCase() === 'hi') ? 'HI' : 'EN';
  });
  const [showPageMenu, setShowPageMenu] = useState(false);
  const isHindi = lang === 'HI';
  
  const toggleLang = () => {
    const next = isHindi ? 'EN' : 'HI';
    setLang(next);
    localStorage.setItem('homeLang', next);
    i18n.changeLanguage(next.toLowerCase());
  };

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
    salary: {
      min: '',
      max: ''
    },
    
    // Location (matching backend schema)
    location: {
      type: 'onsite',
      street: '',
      city: 'salgi',
      state: 'Himachal pradesh',
      pincode: '509001'
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
            companyName: profile.company?.name || profile.name || '',
            location: {
              ...prev.location,
              city: profile.location?.village || profile.location?.city || '',
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
              companyName: user.company?.name || user.name || ''
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
                companyName: profile.company?.name || profile.name || prev.companyName,
                location: {
                  ...prev.location,
                  city: profile.location?.village || profile.location?.city || prev.location.city,
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
      title: 'Employer Details',
      icon: DollarSign,
      description: 'Company information and salary',
      fields: ['companyName', 'salary.min', 'salary.max']
    },
    {
      title: 'Requirements & Skills',
      icon: ClipboardList,
      description: 'Skills and qualifications needed',
      fields: ['requirements']
    },
    {
      title: 'Location & Schedule',
      icon: MapPin,
      description: 'Work location and start date',
      fields: ['location.street', 'startDate']
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

      // Specific validations for salary range
      if (field === 'salary.min' && value && (isNaN(value) || Number(value) <= 0)) {
        newErrors[field] = 'Please enter a valid minimum salary amount';
        isValid = false;
      }

      if (field === 'salary.max' && value && (isNaN(value) || Number(value) <= 0)) {
        newErrors[field] = 'Please enter a valid maximum salary amount';
        isValid = false;
      }

      // Check if max salary is greater than min salary
      if (field === 'salary.max' && value && formData.salary.min && Number(value) <= Number(formData.salary.min)) {
        newErrors[field] = 'Maximum salary must be greater than minimum salary';
        isValid = false;
      }

      if (field === 'salary.min' && value && formData.salary.max && Number(value) >= Number(formData.salary.max)) {
        newErrors[field] = 'Minimum salary must be less than maximum salary';
        isValid = false;
      }

      // Cross-field validation removed for location since city/state/pincode are pre-filled
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

      // Location validation removed since city/state are pre-filled

      // Get consistent company name
      const getCompanyName = () => {
        // Priority order: formData.companyName > employerProfile.company.name > employerProfile.name > user.name > fallback
        const companyName = formData.companyName || employerProfile?.company?.name || employerProfile?.name || user?.name;
        
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
        salary: Number(formData.salary.max), // Backend expects single number, using max value
        salaryRange: { // Additional field for frontend display
          min: Number(formData.salary.min),
          max: Number(formData.salary.max)
        },
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
        employerProfileCompanyName: employerProfile?.company?.name,
        employerProfileName: employerProfile?.name,
        userName: user?.name,
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
      
      // Redirect after a short delay (reduced from 3000ms to 1500ms for faster experience)
      setTimeout(() => {
        console.log('🔄 Redirecting to: /employer/posted-jobs');
        navigateToPage('/employer/posted-jobs');
      }, 1500);

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

    const baseClasses = `w-full px-3 py-2.5 border border-gray-300 rounded-xl transition-all duration-200 shadow-sm text-sm text-gray-900 ${
      errors[field] 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-200 focus:border-[#ff6b35] focus:ring-[#ff6b35]'
    } focus:outline-none focus:ring-1 focus:ring-opacity-20 bg-white placeholder-gray-500`;

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
            className={`${baseClasses} text-gray-900`}
            required
          >
            <option value="" className="text-gray-500">Select job category</option>
            {jobCategories.map(cat => (
              <option key={cat.value} value={cat.value} className="text-gray-900">
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
            className={`${baseClasses} text-gray-900`}
            required
          >
            {employmentTypes.map(type => (
              <option key={type.value} value={type.value} className="text-gray-900">
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
            placeholder={`Enter company name (optional - will use "${employerProfile?.company?.name || employerProfile?.name || 'profile name'}" if left empty)`}
            className={baseClasses}
          />
        );

      case 'requirements':
        const commonRequirements = [
          // Physical Requirements
          'Physical strength required',
   
          
          // Experience & Skills
          'Experience with tools preferred',
      
          
          // Safety & Compliance
          'Safety training required',
    
          
          // Education & Certification
          'Basic education preferred',
         
        ];
        
        const addRequirement = (requirement) => {
          const currentValue = getFieldValue(field);
          const newValue = currentValue ? `${currentValue}\n• ${requirement}` : `• ${requirement}`;
          
          // Create a synthetic event to trigger handleInputChange
          const syntheticEvent = {
            target: {
              name: field,
              value: newValue
            }
          };
          handleInputChange(syntheticEvent);
        };
        
        return (
          <div className="space-y-4">
            {/* Requirements Textarea */}
            <div className="relative">
              <textarea
                name={field}
                value={getFieldValue(field)}
                onChange={handleInputChange}
                placeholder="List your job requirements here... (e.g., Physical strength required • Experience with tools preferred • Must work in all weather conditions)"
                className={`w-full px-3 py-2.5 border border-white/20 rounded-xl transition-all duration-200 shadow-sm text-sm text-white placeholder-white/50 bg-white/10 backdrop-blur-sm min-h-[120px] resize-vertical leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400/50`}
                rows="4"
                required
              />
              <div className="absolute bottom-3 right-3 text-xs text-white/60 pointer-events-none font-medium">
                {getFieldValue(field)?.length || 0} characters
              </div>
            </div>
            
            {/* Quick Add Requirements */}
            <div className="bg-gradient-to-br from-white/15 to-white/8 backdrop-blur-lg rounded-2xl p-5 border border-white/30 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-base font-bold text-white flex items-center">
                  <span className="mr-3 text-xl">💡</span>
                  Quick Add Suggestions
                </h4>
                <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded-full hidden sm:block">Tap to add</span>
              </div>
              
              {/* Mobile-First: Single Column with Enhanced Responsive Design */}
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                {commonRequirements.map((requirement, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => addRequirement(requirement)}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative w-full px-4 py-4 text-sm font-semibold text-white bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-sm border border-white/25 rounded-xl hover:from-orange-500/80 hover:to-pink-500/80 hover:border-orange-300/60 transition-all duration-300 shadow-lg hover:shadow-xl text-left flex items-center justify-between"
                  >
                    <span className="block flex-1 leading-relaxed">
                      {requirement}
                    </span>
                    <motion.span 
                      className="ml-3 w-7 h-7 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full text-xs flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all duration-200 font-black shadow-md"
                      whileHover={{ rotate: 180, scale: 1.1 }}
                    >
                      +
                    </motion.span>
                  </motion.button>
                ))}
              </div>
              
              <div className="mt-5 pt-4 border-t border-white/20">
                
              </div>
            </div>
          </div>
        );

      case 'salary':
        return (
          <div className="space-y-3">
            {/* Minimum Salary */}
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Minimum Salary *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-2xl">
                  ₹
                </span>
                <input
                  type="number"
                  name="salary.min"
                  value={getFieldValue('salary.min')}
                  onChange={handleInputChange}
                  placeholder="Minimum amount"
                  className={`${baseClasses} rounded-l-none rounded-r-2xl text-gray-900`}
                  min="1"
                  required
                />
              </div>
            </div>
            
            {/* Maximum Salary */}
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Maximum Salary *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-2xl">
                  ₹
                </span>
                <input
                  type="number"
                  name="salary.max"
                  value={getFieldValue('salary.max')}
                  onChange={handleInputChange}
                  placeholder="Maximum amount"
                  className={`${baseClasses} rounded-l-none rounded-r-2xl text-gray-900`}
                  min={getFieldValue('salary.min') || 1}
                  required
                />
              </div>
            </div>
            
            {/* Salary Range Preview */}
            {getFieldValue('salary.min') && getFieldValue('salary.max') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl"
              >
                <p className="text-sm text-white/90 font-medium">
                  Salary Range: ₹{parseInt(getFieldValue('salary.min')).toLocaleString()} - ₹{parseInt(getFieldValue('salary.max')).toLocaleString()}
                </p>
              </motion.div>
            )}
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
              <label key={level.value} className="flex items-center space-x-3 p-3 border rounded-2xl hover:bg-gray-50 cursor-pointer transition-all duration-200 shadow-sm bg-white">
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
                  <span className="text-sm font-medium text-gray-900">{level.label}</span>
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
            className={`${baseClasses} text-gray-900`}
            required
          >
            <option value="" className="text-gray-500">Select work location type</option>
            <option value="onsite" className="text-gray-900">On-site (At specific location)</option>
            <option value="remote" className="text-gray-900">Remote (Work from home)</option>
            <option value="hybrid" className="text-gray-900">Hybrid (Mix of both)</option>
          </select>
        );

      case 'location.street':
        return (
          <div className="space-y-3">
            <input
              type="text"
              name={field}
              value={getFieldValue(field)}
              onChange={handleInputChange}
              placeholder="Enter specific street address or location details"
              className={baseClasses}
              required
            />
            
            {/* Pre-filled Location Info */}
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <h4 className="text-xs font-semibold text-white/90 mb-2 flex items-center">
                <span className="mr-2">📍</span>
                Default Location (Pre-filled)
              </h4>
              <div className="text-xs text-white/70 space-y-1">
                <p><span className="text-white/90">City:</span> {formData.location.city}</p>
                <p><span className="text-white/90">State:</span> {formData.location.state}</p>
                <p><span className="text-white/90">PIN Code:</span> {formData.location.pincode}</p>
              </div>
            </div>
          </div>
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
      'salary': 'Salary Range',
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

  

  // Show dashboard first
  if (showDashboard) {
    return (
      <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden">
        {/* Background layers (match Homepage) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)'
          }} />
          <div className="startrails absolute inset-0" />
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
          <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
          <div className="aurora absolute inset-0">
            <span className="aurora-blob aurora-a" />
            <span className="aurora-blob aurora-b" />
            <span className="aurora-blob aurora-c" />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col justify-center min-h-[100vh] px-4 pt-10 pb-12">
          {/* Progress Bar */}
          <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden mb-6">
            <motion.div
              className="h-0.5 bg-white rounded-full"
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
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight" style={{ letterSpacing: '-0.3px' }}>
        
              </h2>
              <p className="text-sm md:text-base text-white/70 mt-1"></p>
            </div>
            
            {/* Options */}
            <div className="space-y-4">
              
              <motion.button
                onClick={handleTraditionalForm}
                className="w-full py-4 px-5 bg-white text-black rounded-xl text-base font-semibold flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 shadow-md hover:opacity-95"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Traditional Form"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📝</span>
                  <span>POST NEW WORK</span>
                </div>
                <span className="text-sm opacity-80">→</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Copy of homepage global styles used for background */}
        <style>{`
          .noise-bg { background-image: url('data:image/svg+xml;utf8,\
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
              <filter id="noise">\
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>\
                <feColorMatrix type="saturate" values="0"/>\
                <feComponentTransfer>\
                  <feFuncA type="table" tableValues="0 0.2"/>\
                </feComponentTransfer>\
              </filter>\
              <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/>\
            </svg>'); }
          .aurora-blob { position: absolute; width: 60vmax; height: 60vmax; filter: blur(60px); opacity: 0.2; }
          .aurora-a { background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%); left: -20vmax; top: -10vmax; animation: drift 18s ease-in-out infinite; }
          .aurora-b { background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%); right: -25vmax; top: -5vmax; animation: drift 22s ease-in-out infinite reverse; }
          .aurora-c { background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%); left: 10vmax; bottom: -20vmax; animation: drift 26s ease-in-out infinite; }
          @keyframes drift { 0%,100%{ transform: translate3d(0,0,0) rotate(0deg);} 50%{ transform: translate3d(5vmax, -3vmax, 0) rotate(20deg);} }
          .startrails { position:absolute; inset:0; background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%); overflow:hidden; }
          .startrails::before, .startrails::after { content:""; position:absolute; inset:-20%; background-repeat:repeat; background-size: 300px 300px; mix-blend-mode: screen; opacity:.25; border-radius:50%; filter: blur(0.2px); }
          .startrails::before { background-image:
            radial-gradient(2px 120px at 50% 0%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1.5px 100px at 80% 10%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1.2px 90px at 20% 30%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1.8px 110px at 70% 60%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 60%);
            animation: trails-rotate 140s linear infinite; }
          .startrails::after { background-image:
            radial-gradient(1px 60px at 30% 10%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1px 70px at 60% 40%, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 60%),
            radial-gradient(1px 50px at 10% 80%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%);
            animation: trails-rotate-rev 200s linear infinite; opacity:.18; }
          @keyframes trails-rotate { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
          @keyframes trails-rotate-rev { from{ transform: rotate(360deg);} to{ transform: rotate(0deg);} }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden flex flex-col">
      {/* Background layers (match Homepage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)'
        }} />
        <div className="startrails absolute inset-0" />
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
        <div className="aurora absolute inset-0">
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
      </div>

      {/* Fixed Status Bar - Top */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center py-4 px-4 bg-neutral-950/80 backdrop-blur-sm border-b border-white/10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2"
        >
          <span className="text-xs font-medium text-white/80 tracking-wider">
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
            className="w-1 h-1 bg-white/70 rounded-full"
          />
        </motion.div>
        
        {/* Progress Bar */}
        <div className="w-full max-w-sm h-0.5 bg-white/10 rounded-full overflow-hidden mt-3">
          <motion.div
            className="h-0.5 bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
            aria-label="Progress"
          />
        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-sm mx-auto">
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
              <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2 leading-tight" style={{ letterSpacing: '-0.3px' }}>
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-sm md:text-base text-white/70 mt-1">{steps[currentStep - 1].description}</p>
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
                    <label className="block text-xs font-medium text-white mb-1.5">
                      {getFieldLabel(field)}
                      {(field === 'location.city' || field === 'location.state' || 
                        (steps[currentStep - 1].fields.includes(field) && field !== 'endDate' && field !== 'additionalInstructions')) && (
                        <span className="text-white/70 ml-1">*</span>
                      )}
                    </label>
                    {renderField(field, currentStep - 1)}
                    {errors[field] && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-400 flex items-center"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors[field]}
                      </motion.p>
                    )}
                  </motion.div>
                ))}
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Fixed Navigation Buttons - Bottom */}
      <div className="relative z-10 w-full p-4 bg-neutral-950/80 backdrop-blur-sm border-t border-white/10">
        <motion.div
          className="flex justify-between max-w-sm mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {currentStep > 1 ? (
            <motion.button
              type="button"
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2.5 bg-white/10 border border-white/15 text-white rounded-xl hover:bg-white/15 transition-all duration-200 font-medium shadow-sm text-sm"
            >
              Back
            </motion.button>
          ) : (
            <div></div> // Placeholder for alignment
          )}
          
          {currentStep < steps.length ? (
            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2.5 bg-white text-black rounded-xl hover:opacity-95 transition-all duration-200 font-semibold shadow-sm text-sm"
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm text-sm ${
                isSubmitting
                  ? 'bg-white/30 cursor-not-allowed text-white'
                  : 'bg-white text-black hover:opacity-95'
              }`}
            >
              {isSubmitting ? (
                <motion.div
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div className="w-4 h-4 mr-2" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <span className="block w-full h-full border-2 border-black border-t-transparent rounded-full"></span>
                  </motion.div>
                  <span className="text-xs">Posting...</span>
                </motion.div>
              ) : (
                'Post Job'
              )}
            </motion.button>
          )}
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
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 border border-white/15 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-lg z-50 text-sm font-medium"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/20"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative mx-auto mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="absolute -inset-2 bg-green-400/20 rounded-full"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="absolute -inset-4 bg-green-400/10 rounded-full"
                />
              </motion.div>

              {/* Success Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  🎉 Job Posted Successfully!
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your job posting is now live and workers can start applying. 
                  You'll be redirected to manage your posted jobs.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <button
                  onClick={() => navigateToPage('/employer/posted-jobs')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View Posted Jobs →
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                >
                  Post Another Job
                </button>
              </motion.div>

              {/* Loading indicator for redirect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-4 flex items-center justify-center text-xs text-gray-500"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full mr-2"
                />
                Redirecting in a moment...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostJob;