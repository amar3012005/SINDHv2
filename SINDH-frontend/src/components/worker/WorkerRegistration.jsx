import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, User, Award, MapPin, FileText, Phone, Mail, Briefcase, Languages, Smile, Sparkles, Rocket, Handshake, Lightbulb, ShieldCheck, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

const WorkerRegistration = () => {
  const navigate = useNavigate();
  const { loginUser } = useUser();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [showProfile, setShowProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    gender: '',
    aadharNumber: '',
    skills: [],
    experience: '',
    expectedSalary: '',
    preferredCategory: '',
    languages: [],
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
    preferredWorkType: '',
    availability: '',
    bio: '',
    workRadius: 10,
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
      title: t('register.step1Title'),
      icon: User,
      description: t('register.personalInfoDesc'),
      fields: [
        { name: 'name', label: t('register.name'), type: 'text', required: true, placeholder: t('register.nameHint') },
        { name: 'age', label: t('register.age'), type: 'number', required: true, placeholder: t('register.ageHint'), min: 18, max: 70 },
        { name: 'phone', label: t('register.mobile'), type: 'tel', required: true, placeholder: t('register.mobileHint') },
        { name: 'email', label: t('register.email'), type: 'email', required: false, placeholder: t('register.emailHint') },
        { name: 'gender', label: t('register.gender'), type: 'select', required: true, options: [t('register.male'), t('register.female'), t('register.other')] }
      ]
    },
    {
      title: t('register.step2Title'),
      icon: ShieldCheck,
      description: t('register.aadharVerificationDesc'),
      fields: [
        { name: 'aadharNumber', label: t('register.aadharNumber'), type: 'text', required: true, placeholder: t('register.aadharHint'), maxLength: 12 }
      ]
    },
    {
      title: t('register.step3Title'),
      icon: Award,
      description: t('register.skillsExperienceDesc'),
      fields: [
        { name: 'skills', label: t('register.skills'), type: 'multiselect', required: true, options: skillOptions },
        { name: 'experience', label: t('register.experience'), type: 'select', required: true, options: [
          t('register.exp1'), t('register.exp2'), t('register.exp3'), t('register.exp4'), t('register.exp5')
        ]},
        { name: 'preferredCategory', label: t('register.preferredCategory'), type: 'select', required: true, options: [
          t('register.cat1'), t('register.cat2'), t('register.cat3'), t('register.cat4'), t('register.cat5'), t('register.cat6'), t('register.cat7')
        ]},
        { name: 'expectedSalary', label: t('register.expectedSalary'), type: 'text', required: true, placeholder: t('register.expectedSalaryHint') }
      ]
    },
    {
      title: t('register.step4Title'),
      icon: Languages,
      description: t('register.languagesDesc'),
      fields: [
        { name: 'languages', label: t('register.languages'), type: 'multiselect', required: true, options: languageOptions }
      ]
    },
    {
      title: t('register.step5Title'),
      icon: MapPin,
      description: t('register.locationDesc'),
      fields: [
        { name: 'location.address', label: t('register.fullAddress'), type: 'textarea', required: false, placeholder: t('register.fullAddressHint') },
        { name: 'location.village', label: t('register.villageTown'), type: 'text', required: true, placeholder: t('register.villageTownHint') },
        { name: 'location.district', label: t('register.district'), type: 'text', required: true, placeholder: t('register.districtHint') },
        { name: 'location.state', label: t('register.state'), type: 'text', required: true, placeholder: t('register.stateHint') },
        { name: 'location.pincode', label: t('register.pincode'), type: 'text', required: true, placeholder: t('register.pincodeHint'), maxLength: 6 }
      ]
    },
    {
      title: t('register.step6Title'),
      icon: Briefcase,
      description: t('register.workPreferencesDesc'),
      fields: [
        { name: 'preferredWorkType', label: t('register.preferredWorkType'), type: 'select', required: true, options: [
          t('register.workType1'), t('register.workType2'), t('register.workType3'), t('register.workType4'), t('register.workType5')
        ]},
        { name: 'availability', label: t('register.availability'), type: 'select', required: true, options: [
          t('register.avail1'), t('register.avail2'), t('register.avail3'), t('register.avail4')
        ]},
        { name: 'workRadius', label: t('register.workRadius'), type: 'select', required: true, options: [
          '5', '10', '15', '20', '25', '50+'
        ]},
        { name: 'bio', label: t('register.bio'), type: 'textarea', required: false, placeholder: t('register.bioHint') }
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
    
    if (name === 'phone') {
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
            isValid = false;
          }
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          isValid = false;
        }
      }
    }
    
    if (step === 1) {
      if (formData.age && (formData.age < 18 || formData.age > 70)) {
        isValid = false;
        toast.error(t('register.ageError'));
      }
      if (formData.phone && formData.phone.length !== 10) {
        isValid = false;
        toast.error(t('register.mobileError'));
      }
    }
    
    return isValid;
  };

  const handleSendOTP = () => {
    if (!formData.aadharNumber || formData.aadharNumber.length !== 12) {
      toast.error(t('register.aadharError'));
      return;
    }
    setOtpSent(true);
    toast.success(t('register.otpSent'));
  };

  const handleVerifyOTP = () => {
    if (!formData.otp?.code) {
      toast.error(t('register.otpRequired'));
      return;
    }

    if (formData.otp.code === '0000') { // For demo purposes
      setOtpVerified(true);
      setCompletedSteps(prev => new Set([...prev, 2]));
      toast.success(t('register.otpVerified'));
      setTimeout(() => handleNext(), 1000);
    } else {
      toast.error(t('register.invalidOtp'));
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && !otpVerified) {
      toast.error(t('register.verifyOtpFirst'));
      return;
    }

    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error(t('register.fillRequired'));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      toast.error(t('register.fillRequired'));
      return;
    }

    if (!otpVerified) {
      setCurrentStep(2);
      toast.error(t('register.verifyAadharFirst'));
      return;
    }

    try {
      setSubmitting(true);
      
      const shaktiScore = calculateShaktiScore(formData);
      
      const workerData = {
        name: formData.name,
        age: parseInt(formData.age),
        phone: formData.phone.replace(/\s+/g, ''),
        email: formData.email,
        gender: formData.gender,
        aadharNumber: formData.aadharNumber,
        skills: formData.skills,
        experience: formData.experience,
        preferredCategory: formData.preferredCategory,
        expectedSalary: formData.expectedSalary,
        languages: formData.languages,
        location: {
          address: formData.location.address,
          village: formData.location.village,
          district: formData.location.district,
          state: formData.location.state,
          pincode: formData.location.pincode,
          coordinates: {
            type: "Point",
            coordinates: [0, 0]
          }
        },
        preferredWorkType: formData.preferredWorkType,
        availability: formData.availability,
        workRadius: parseInt(formData.workRadius) || 10,
        bio: formData.bio,
        verificationStatus: 'pending',
        isAvailable: true,
        shaktiScore: shaktiScore,
        rating: { average: 0, count: 0, reviews: [] },
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isLoggedIn: 1,
        profileCompletionPercentage: calculateProfileCompletion(formData),
        documents: [],
        workHistory: [],
        activeJobs: 0,
        completedJobs: 0,
        emailNotifications: true,
        smsNotifications: true,
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
        type: 'worker'
      };

      const response = await fetch('http://localhost:5000/api/workers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerData)
      });

      let savedWorker;
      
      if (!response.ok) {
        let errorMessage = t('register.failed');
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `${t('common.serverError')}: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      try {
        savedWorker = await response.json();
      } catch (parseError) {
        throw new Error(t('common.invalidResponse'));
      }
      
      // Update form data with saved worker ID and shaktiScore
      setFormData(prev => ({
        ...prev,
        id: savedWorker.worker?.id || savedWorker.worker?._id || prev.id,
        shaktiScore
      }));
      
      // Let UserContext handle login state and localStorage persistence
      // Pass the essential data needed for loginUser to fetch the full profile
      await loginUser({
        id: savedWorker.worker?.id || savedWorker.worker?._id,
        type: 'worker',
        phone: formData.phone.replace(/\s+/g, '') // Ensure phone is clean for login
      });
      
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      toast.success(t('register.success'));
      
      setTimeout(() => {
        setShowProfile(true);
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(`${t('register.failed')}: ${error.message}`);
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
            <option value="">{t('common.select')} {field.label}</option>
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
          {t('register.aadharNumber')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="aadharNumber"
          value={formData.aadharNumber}
          onChange={handleInputChange}
          maxLength="12"
          placeholder={t('register.aadharHint')}
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
          {t('register.sendOtp')} 🚀
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
              {t('register.enterOtp')} (0000 {t('register.forDemo')})
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
                {t('register.verified')} 🎉
              </div>
            ) : (
              t('register.verifyOtp')
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );

  const WorkerProfileDisplay = ({ workerData }) => (
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
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900"
        >
          {t('register.welcome')}, {workerData.name}! 👋
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mt-2"
        >
          {t('register.profileCreated')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <div className="text-4xl font-bold text-blue-600">{workerData.shaktiScore}</div>
          <div className="text-sm text-gray-500">{t('home.shaktiScore')}</div>
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
            {t('register.personalInfo')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-3 text-gray-500" />
              <span className="text-gray-700">{workerData.phone}</span>
            </div>
            {workerData.email && (
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-gray-500" />
                <span className="text-gray-700">{workerData.email}</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              {t('register.age')}: {workerData.age} • {t('register.gender')}: {workerData.gender}
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
            {t('register.skillsExperience')}
          </h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {workerData.skills.slice(0, 3).map(skill => (
                <span key={skill} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  {skill}
                </span>
              ))}
              {workerData.skills.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{workerData.skills.length - 3} {t('common.more')}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {t('register.experience')}: {workerData.experience}
            </div>
            <div className="text-sm text-gray-600">
              {t('register.expected')}: {workerData.expectedSalary}
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
            {t('register.location')}
          </h3>
          <div className="space-y-2">
            <div className="text-gray-700">
              {workerData.location.village}, {workerData.location.district}
            </div>
            <div className="text-sm text-gray-600">
              {workerData.location.state} - {workerData.location.pincode}
            </div>
            <div className="text-sm text-gray-600">
              {t('register.workRadius')}: {workerData.workRadius} km
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
            {t('register.languages')} & {t('register.availability')}
          </h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {workerData.languages.map(lang => (
                <span key={lang} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  {lang}
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {workerData.availability}
            </div>
            <div className="text-sm text-gray-600">
              {workerData.preferredWorkType}
            </div>
          </div>
        </motion.div>
      </div>

      {workerData.bio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-600" />
            {t('register.aboutMe')}
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {workerData.bio}
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
          onClick={() => navigate('/jobs')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {t('home.findJobs')} 🚀
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/worker/wallet')}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {t('common.view')} {t('common.wallet')} 💰
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
          <WorkerProfileDisplay workerData={formData} />
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
              {t('register.title')} ✨
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-gray-600"
            >
              {t('register.step')} {currentStep} {t('register.of')} {steps.length} - {steps[currentStep - 1].description}
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
                    {steps[currentStep - 1].title} {currentStep === 1 ? '👋' : currentStep === 2 ? '🛡️' : currentStep === 3 ? '💪' : currentStep === 4 ? '🗣️' : currentStep === 5 ? '📍' : '💼'}
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
                            {t('common.selected')}: {formData.skills.join(', ')}
                          </div>
                        )}
                        {field.name === 'languages' && formData.languages.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            {t('common.selected')}: {formData.languages.join(', ')}
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
                  {t('common.back')}
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
                  {t('common.next')} {currentStep === 1 ? '➡️' : currentStep === 2 ? '➡️' : currentStep === 3 ? '➡️' : currentStep === 4 ? '➡️' : currentStep === 5 ? '➡️' : ''}
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
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
                      {t('register.creatingProfile')}...
                    </motion.div>
                  ) : (
                    t('register.completeRegistration') + ' 🎉'
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
              <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('register.summary')}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">{t('register.name')}:</span> {formData.name}
                </div>
                <div>
                  <span className="font-medium">{t}('register.phone'):</span> {formData.phone}
                </div>
                <div>
                  <span className="font-medium">{t('register.skills')}:</span> {formData.skills.length} {t('common.selected')}
                </div>
                <div>
                  <span className="font-medium">{t('register.languages')}:</span> {formData.languages.length} {t('common.selected')}
                </div>
                <div>
                  <span className="font-medium">{t('register.experience')}:</span> {formData.experience}
                </div>
                <div>
                  <span className="font-medium">{t('register.location')}:</span> {formData.location.village}, {formData.location.district}
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 150 }}
                className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium">{t('register.estimatedShaktiScore')}:</span>
                  <div className="text-3xl font-bold text-blue-600">{calculateShaktiScore(formData)} <Sparkles className="inline-block w-6 h-6 text-yellow-500" /></div>
                </div>
                <p className="text-xs text-gray-600 mt-1 max-w-[50%]">
                  {t('register.shaktiScoreDesc')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WorkerRegistration;