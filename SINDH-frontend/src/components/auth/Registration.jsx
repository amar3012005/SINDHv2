import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../../utils/apiUtils';

function Registration() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginUser } = useUser();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'worker',
    // Worker specific fields
    skills: '',
    experience: '',
    // Employer specific fields
    companyName: '',
    companyDescription: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        type: formData.userType
      };

      // Add type-specific fields
      if (formData.userType === 'worker') {
        submitData.skills = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
        submitData.experience = formData.experience;
      } else {
        submitData.companyName = formData.companyName;
        submitData.companyDescription = formData.companyDescription;
      }

      const endpoint = formData.userType === 'worker' ? '/api/workers/register' : '/api/employers/register';
      
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        loginUser(data.user || data.worker || data.employer);
        toast.success('Registration successful!');
        
        // Navigate based on user type
        if (formData.userType === 'employer') {
          navigate('/employer/dashboard');
        } else {
          navigate('/', { state: { showWelcome: true } });
        }
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.createNewAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.registerAs')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  name="userType"
                  value="worker"
                  checked={formData.userType === 'worker'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className={`p-3 text-center border rounded-md cursor-pointer transition-colors ${
                  formData.userType === 'worker'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  {t('auth.worker')}
                </div>
              </label>
              
              <label className="relative">
                <input
                  type="radio"
                  name="userType"
                  value="employer"
                  checked={formData.userType === 'employer'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className={`p-3 text-center border rounded-md cursor-pointer transition-colors ${
                  formData.userType === 'employer'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  {t('auth.employer')}
                </div>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {formData.userType === 'employer' ? t('auth.contactPersonName') : t('auth.fullName')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={formData.userType === 'employer' ? t('auth.contactPersonName') : t('auth.fullName')}
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t('auth.phoneNumber')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('auth.phoneNumber')}
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t('auth.confirmPassword')}
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Type-specific fields */}
          {formData.userType === 'worker' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                  {t('auth.skills')}
                </label>
                <input
                  id="skills"
                  name="skills"
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('auth.skillsPlaceholder')}
                  value={formData.skills}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                  {t('auth.experience')}
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  rows={3}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('auth.experiencePlaceholder')}
                  value={formData.experience}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  {t('auth.companyName')}
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('auth.companyName')}
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700">
                  {t('auth.companyDescription')}
                </label>
                <textarea
                  id="companyDescription"
                  name="companyDescription"
                  rows={3}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={t('auth.companyDescriptionPlaceholder')}
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registration;