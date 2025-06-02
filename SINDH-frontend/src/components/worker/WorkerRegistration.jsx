import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../context/TranslationContext';
import { useUser } from '../../context/UserContext';
import { synchronizeUserData } from '../../utils/authSyncUtils';
import { registerWorker } from '../../services/workerService';

const skills = ['Construction', 'Farming', 'Masonry', 'Carpentry', 'Plumbing', 'Electrical', 'Painting', 'Welding'];
const languages = ['Hindi', 'English', 'Marathi', 'Gujarati'];

const WorkerRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    aadharNumber: '',
    phone: '',
    skills: [],
    location: {
      address: '',
      village: '',
      district: '',
      state: '',
      pincode: ''
    },
    language: [],
    experience_years: ''
  });

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = 'Name is required';
        }
        if (!formData.age) {
          newErrors.age = 'Age is required';
        } else if (formData.age < 18 || formData.age > 70) {
          newErrors.age = 'Age must be between 18 and 70';
        }
        if (!formData.aadharNumber) {
          newErrors.aadharNumber = 'Aadhar number is required';
        } else if (!/^\d{12}$/.test(formData.aadharNumber)) {
          newErrors.aadharNumber = 'Aadhar number must be 12 digits';
        }
        if (!formData.phone) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone)) {
          newErrors.phone = 'Phone number must be 10 digits';
        }
        break;
      case 2:
        if (formData.skills.length === 0) {
          newErrors.skills = 'Please select at least one skill';
        }
        if (formData.language.length === 0) {
          newErrors.language = 'Please select at least one language';
        }
        if (!formData.experience_years) {
          newErrors.experience_years = 'Experience is required';
        } else if (formData.experience_years < 0) {
          newErrors.experience_years = 'Experience cannot be negative';
        }
        break;
      case 3:
        if (!formData.location.village.trim()) {
          newErrors.village = 'Village is required';
        }
        if (!formData.location.district.trim()) {
          newErrors.district = 'District is required';
        }
        if (!formData.location.state.trim()) {
          newErrors.state = 'State is required';
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Form field changed:', { name, value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
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

  const handleSkillToggle = (skill) => {
    console.log('Toggling skill:', skill);
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
    if (errors.skills) {
      setErrors(prev => ({ ...prev, skills: null }));
    }
  };

  const handleLanguageToggle = (language) => {
    console.log('Toggling language:', language);
    setFormData(prev => ({
      ...prev,
      language: prev.language.includes(language)
        ? prev.language.filter(l => l !== language)
        : [...prev.language, language]
    }));
    if (errors.language) {
      setErrors(prev => ({ ...prev, language: null }));
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      console.log('Moving to next step');
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    console.log('Moving to previous step');
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit button clicked');
    
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting worker registration:', formData);
      const response = await registerWorker(formData);
      console.log('Registration successful:', response);
      
      // Show success animation
      toast.success('Registration successful! Redirecting to profile...', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Store worker data in localStorage for persistence
      const workerData = {
        ...formData,
        rating: response.worker.rating,
        id: response.worker.id
      };
      localStorage.setItem('worker', JSON.stringify(workerData));

      // Add a small delay to show the success message
      setTimeout(() => {
        // Navigate to profile page with worker data
        navigate('/worker/profile', { 
          state: { worker: workerData }
        });
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h3 className="text-xl font-semibold mb-6 text-gray-800">Personal Information</h3>
            <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
                required
              />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
            </div>
            <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
          onChange={handleChange}
          min="18"
          max="70"
          className={`mt-1 block w-full rounded-lg border ${
            errors.age ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
                required
              />
        {errors.age && (
          <p className="mt-1 text-sm text-red-600">{errors.age}</p>
        )}
            </div>
            <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
              <input
                type="text"
          name="aadharNumber"
          value={formData.aadharNumber}
          onChange={handleChange}
          pattern="\d{12}"
          maxLength="12"
          className={`mt-1 block w-full rounded-lg border ${
            errors.aadharNumber ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
                required
              />
        {errors.aadharNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.aadharNumber}</p>
        )}
            </div>
            <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          pattern="\d{10}"
          maxLength="10"
          className={`mt-1 block w-full rounded-lg border ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
                required
              />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
            </div>
    </motion.div>
        );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold mb-6 text-gray-800">Skills & Languages</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
        <div className="grid grid-cols-2 gap-2">
              {skills.map(skill => (
            <motion.button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    formData.skills.includes(skill)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {skill}
            </motion.button>
          ))}
        </div>
        {errors.skills && (
          <p className="mt-2 text-sm text-red-600">{errors.skills}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
        <div className="grid grid-cols-2 gap-2">
          {languages.map(language => (
            <motion.button
              key={language}
              type="button"
              onClick={() => handleLanguageToggle(language)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                formData.language.includes(language)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {language}
            </motion.button>
              ))}
            </div>
        {errors.language && (
          <p className="mt-2 text-sm text-red-600">{errors.language}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
        <input
          type="number"
          name="experience_years"
          value={formData.experience_years}
          onChange={handleChange}
          min="0"
          className={`mt-1 block w-full rounded-lg border ${
            errors.experience_years ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
          required
        />
        {errors.experience_years && (
          <p className="mt-1 text-sm text-red-600">{errors.experience_years}</p>
        )}
          </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h3 className="text-xl font-semibold mb-6 text-gray-800">Location Details</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          name="location.address"
          value={formData.location.address}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
          required
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
        <input
          type="text"
          name="location.village"
          value={formData.location.village}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border ${
            errors.village ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
          required
        />
        {errors.village && (
          <p className="mt-1 text-sm text-red-600">{errors.village}</p>
        )}
      </div>
            <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
        <input
          type="text"
          name="location.district"
          value={formData.location.district}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border ${
            errors.district ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
                required
              />
        {errors.district && (
          <p className="mt-1 text-sm text-red-600">{errors.district}</p>
        )}
            </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <input
          type="text"
          name="location.state"
          value={formData.location.state}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border ${
            errors.state ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
          required
        />
        {errors.state && (
          <p className="mt-1 text-sm text-red-600">{errors.state}</p>
        )}
          </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
        <input
          type="text"
          name="location.pincode"
          value={formData.location.pincode}
          onChange={handleChange}
          pattern="\d{6}"
          maxLength="6"
          className={`mt-1 block w-full rounded-lg border ${
            errors.pincode ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors`}
          required
        />
        {errors.pincode && (
          <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
        )}
      </div>
    </motion.div>
  );

  const renderJSONPreview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 bg-gray-50 rounded-xl shadow-inner"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Registration Data Preview</h3>
      <pre className="bg-white p-4 rounded-lg overflow-auto text-sm">
        {JSON.stringify(formData, null, 2)}
      </pre>
    </motion.div>
        );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Worker Registration
        </h2>
        
          <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 text-center ${
                  step <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-all duration-200 ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-200'
                }`}>
                  {step}
                    </div>
                <div className="text-sm mt-2 font-medium">
                  {step === 1 ? 'Personal' : step === 2 ? 'Skills' : 'Location'}
                </div>
              </div>
            ))}
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
            
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <motion.button
                  type="button"
                onClick={prevStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Previous
              </motion.button>
              )}
            {currentStep < 3 ? (
              <motion.button
                type="button"
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </motion.button>
            )}
            </div>
          </form>

        {currentStep === 3 && renderJSONPreview()}
      </div>
    </div>
  );
};

export default WorkerRegistration; 