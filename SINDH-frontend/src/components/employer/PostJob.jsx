import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Users, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Clock,
  Building
} from 'lucide-react';

const PostJob = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [employerProfile, setEmployerProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    } else {
      window.location.href = path;
    }
  };
  const [formData, setFormData] = useState({
    // Basic Job Information
    title: '',
    category: '',
    employmentType: 'full-time', // Changed to match backend enum
    description: '',
    requirements: '',
    
    // Compensation
    salary: '',
    duration: '' , // Added required duration field
    
    // Location (matching backend schema)
    location: {
      type: 'onsite', // Added required location type
      street: '', // Added required street field
      city: '',
      state: '',
      pincode: ''
    },
    
    // Job Details
    workingHours: '',
    startDate: '',
    endDate: '',
    urgency: 'normal',
    workersNeeded: 1,
    
    // Contact & Additional Info
    contactPerson: '',
    contactPhone: '',
    additionalInstructions: '',
    
    // Metadata
    status: 'active',
    visibility: 'public'
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
            contactPerson: profile.name || '',
            contactPhone: profile.phone || '',
            location: {
              ...prev.location,
              village: profile.location?.village || '',
              city: profile.location?.city || '',
              district: profile.location?.district || '',
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
              contactPerson: user.name || '',
              contactPhone: user.phone || ''
            }));
          }
        }
        
        // Try to fetch fresh data from backend
        const user = JSON.parse(localUser || '{}');
        if (user.id && user.type === 'employer') {
          try {
            const response = await fetch(`http://localhost:5000/api/employers/${user.id}`);
            if (response.ok) {
              const profile = await response.json();
              setEmployerProfile(profile);
              localStorage.setItem('employerProfile', JSON.stringify(profile));
              
              // Update form data with fresh profile
              setFormData(prev => ({
                ...prev,
                contactPerson: profile.name || prev.contactPerson,
                contactPhone: profile.phone || prev.contactPhone,
                location: {
                  ...prev.location,
                  village: profile.location?.village || prev.location.village,
                  city: profile.location?.city || prev.location.city,
                  district: profile.location?.district || prev.location.district,
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
  const steps = [
    {
      title: 'Job Information',
      icon: Briefcase,
      description: 'Basic details about the job',
      fields: ['title', 'category', 'employmentType', 'description']
    },
    {
      title: 'Requirements & Compensation',
      icon: DollarSign,
      description: 'Skills needed and payment details',
      fields: ['requirements', 'salary', 'duration', 'workingHours']
    },
    {
      title: 'Location & Schedule',
      icon: MapPin,
      description: 'Where and when the work will happen',
      fields: ['location.type', 'location.street', 'location.city', 'location.state', 'location.pincode', 'startDate', 'workersNeeded']
    },
    {
      title: 'Contact & Final Details',
      icon: Users,
      description: 'How workers can reach you',
      fields: ['contactPerson', 'contactPhone', 'urgency', 'additionalInstructions']
    }
  ];

  // Job categories with icons
  const jobCategories = [
    { value: 'Construction', label: 'Construction', icon: '🏗️' },
    { value: 'Agriculture', label: 'Agriculture', icon: '🌾' },
    { value: 'Household', label: 'Household', icon: '🏠' },
    { value: 'Transportation', label: 'Transportation', icon: '🚚' },
    { value: 'Manufacturing', label: 'Manufacturing', icon: '🏭' },
    { value: 'Retail', label: 'Retail', icon: '🛍️' },
    { value: 'Food Service', label: 'Food Service', icon: '🍽️' },
    { value: 'Cleaning', label: 'Cleaning', icon: '🧹' },
    { value: 'Security', label: 'Security', icon: '🛡️' },
    { value: 'Other', label: 'Other', icon: '⚡' }
  ];

  // Employment types (matching backend schema)
  const employmentTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' }
  ];

  // Urgency levels
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

      if (field === 'contactPhone' && value && !/^[+]?[\d\s-()]{10,15}$/.test(value)) {
        newErrors[field] = 'Please enter a valid phone number';
        isValid = false;
      }

      if (field === 'workersNeeded' && value && (isNaN(value) || Number(value) < 1)) {
        newErrors[field] = 'Number of workers must be at least 1';
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
    
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get employer ID and profile
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerProfile = JSON.parse(localStorage.getItem('employerProfile') || '{}');
      
      if (!user.id || user.type !== 'employer') {
        throw new Error('You must be logged in as an employer to post jobs');
      }

      // Prepare job data for API (matching backend schema)
      const jobData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        salary: Number(formData.salary),
        duration: formData.duration,
        location: {
          type: formData.location.type,
          street: formData.location.street,
          city: formData.location.city,
          state: formData.location.state,
          pincode: formData.location.pincode
        },
        category: formData.category,
        employmentType: formData.employmentType,
        workingHours: formData.workingHours,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        workersNeeded: Number(formData.workersNeeded),
        urgency: formData.urgency,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        additionalInstructions: formData.additionalInstructions || '',
        employer: user.id, // Backend expects 'employer' field with ObjectId
        
        // Add required fields based on backend schema
        employerName: employerProfile.name || formData.contactPerson || user.name || 'Unknown Employer',
        companyName: employerProfile.company?.name || employerProfile.companyName || 'Not Specified',
        
        status: 'active',
        visibility: 'public'
      };

      console.log('Submitting job data:', jobData);

      // Submit to backend
      const response = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const savedJob = await response.json();
      console.log('Job saved successfully:', savedJob);

      // Update local storage and employer profile
      try {
        const currentProfile = JSON.parse(localStorage.getItem('employerProfile') || '{}');
        const updatedProfile = {
          ...currentProfile,
          postedJobs: [...(currentProfile.postedJobs || []), savedJob._id || savedJob.id]
        };
        localStorage.setItem('employerProfile', JSON.stringify(updatedProfile));
      } catch (storageError) {
        console.warn('Could not update local profile:', storageError);
      }

      // Show success message
      showNotification('Job posted successfully!', 'success');
      
      // Mark completion
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setShowSuccessModal(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigateToPage('/employer/posted-jobs');
      }, 3000);

    } catch (error) {
      console.error('Error posting job:', error);
      showNotification(error.message || 'Failed to post job. Please try again.', 'error');
    } finally {
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

    const baseClasses = `w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
      errors[field] 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
    }`;

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
            <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-xl">
              ₹
            </span>
            <input
              type="number"
              name={field}
              value={getFieldValue(field)}
              onChange={handleInputChange}
              placeholder="Enter amount"
              className={`${baseClasses} rounded-l-none`}
              min="1"
              required
            />
          </div>
        );

      case 'salaryType':
        return (
          <select
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            className={baseClasses}
          >
            <option value="daily">Per Day</option>
            <option value="weekly">Per Week</option>
            <option value="monthly">Per Month</option>
            <option value="hourly">Per Hour</option>
            <option value="project">Per Project</option>
          </select>
        );

      case 'workingHours':
        return (
          <input
            type="text"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="e.g., 8 AM - 6 PM, 8 hours/day, Flexible"
            className={baseClasses}
            required
          />
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

      case 'workersNeeded':
        return (
          <input
            type="number"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="Number of workers needed"
            className={baseClasses}
            min="1"
            max="50"
            required
          />
        );

      case 'urgency':
        return (
          <div className="space-y-2">
            {urgencyLevels.map(level => (
              <label key={level.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={field}
                  value={level.value}
                  checked={getFieldValue(field) === level.value}
                  onChange={handleInputChange}
                  className="text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${level.color}-500`}></div>
                  <span className="text-sm font-medium">{level.label}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'additionalInstructions':
        return (
          <textarea
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="Any additional instructions for workers (optional)"
            className={`${baseClasses} min-h-[80px] resize-vertical`}
            rows="3"
          />
        );

      case 'duration':
        return (
          <input
            type="text"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder="e.g., 1 week, 2 months, 6 months, Permanent"
            className={baseClasses}
            required
          />
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
        return (
          <input
            type="text"
            name={field}
            value={getFieldValue(field)}
            onChange={handleInputChange}
            placeholder={`Enter ${field.split('.').pop()}`}
            className={baseClasses}
            required={steps[stepIndex].fields.includes(field)}
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
      'requirements': 'Requirements & Skills',
      'salary': 'Salary Amount',
      'salaryType': 'Payment Frequency',
      'duration': 'Job Duration',
      'workingHours': 'Working Hours',
      'startDate': 'Start Date',
      'endDate': 'End Date (Optional)',
      'workersNeeded': 'Number of Workers Needed',
      'urgency': 'How urgent is this job?',
      'location.type': 'Work Location Type',
      'location.street': 'Street Address',
      'location.village': 'Village/Town',
      'location.city': 'City',
      'location.district': 'District',
      'location.state': 'State',
      'location.pincode': 'PIN Code',
      'contactPerson': 'Contact Person',
      'contactPhone': 'Contact Phone',
      'additionalInstructions': 'Additional Instructions'
    };
    return labels[field] || field;
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Notification System */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-4 left-1/2 transform z-50 px-6 py-4 rounded-lg shadow-lg max-w-md ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {notification.type === 'info' && <Clock className="w-5 h-5" />}
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Post a New Job
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
                    index + 1 <= currentStep ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                />
              ))}
            </div>
          </div>

          {/* Form Content */}
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
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {steps[currentStep - 1].title}
                  </h2>
                  <p className="text-gray-600">
                    {steps[currentStep - 1].description}
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {steps[currentStep - 1].fields.map((field, index) => (
                    <motion.div
                      key={field}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={field === 'description' || field === 'requirements' || field === 'urgency' || field === 'additionalInstructions' ? 'md:col-span-2' : ''}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getFieldLabel(field)}
                        {steps[currentStep - 1].fields.includes(field) && field !== 'endDate' && field !== 'additionalInstructions' && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {renderField(field, currentStep - 1)}
                      {errors[field] && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-600 flex items-center"
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[field]}
                        </motion.p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
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
                  className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg"
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className={`ml-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  {isSubmitting ? (
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
                      Posting Job...
                    </motion.div>
                  ) : (
                    'Post Job'
                  )}
                </motion.button>
              )}
            </motion.div>
          </form>

          {/* Success Animation */}
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
                  className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Job Posted Successfully!</h3>
                  <p className="text-gray-600 mb-4">
                    Your job has been published and workers can now apply.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => navigateToPage('/employer/jobs')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View Posted Jobs
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Post Another
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Job Preview (Optional - can be shown in last step) */}
          {currentStep === steps.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-gray-50 rounded-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Job Preview
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Title:</span>
                  <span>{formData.title || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Category:</span>
                  <span>{formData.category || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Salary:</span>
                  <span>₹{formData.salary} {formData.salaryType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Location:</span>
                  <span>{formData.location.city}, {formData.location.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Workers Needed:</span>
                  <span>{formData.workersNeeded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Urgency:</span>
                  <span className="capitalize">{formData.urgency}</span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Tips for Better Job Posts
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Be specific about the work required and skills needed
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Set fair wages based on local market rates
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Provide clear working hours and location details
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Include your contact information for worker inquiries
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default PostJob;