import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import jobService from '../../services/jobService';

export default function PostJob() {
  const { translations } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Construction',
    employmentType: 'full-time',
    location: {
      type: 'onsite',
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    salary: '',
    duration: '',
    description: '',
    requirements: '',
    status: 'active'
  });

  useEffect(() => {
    // Check if user is logged in and is an employer
    const user = JSON.parse(localStorage.getItem('user'));
    // Get employer data from user object
    const employerData = user?.employer || user; // Fallback to user if employer data is not nested
    
    if (!user || user.type !== 'employer') {
      toast.error('Please login as an employer to post jobs');
      navigate('/login');
      return;
    }

    // Store employer data for later use
    localStorage.setItem('employer', JSON.stringify(employerData));

    // If we have saved form data, restore it
    const savedFormData = localStorage.getItem('jobFormData');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
      localStorage.removeItem('jobFormData');
    }
  }, [navigate]);

  // Kept for future use, but commented out to avoid eslint warning
  // eslint-disable-next-line no-unused-vars
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a job title');
      return false;
    }
    if (!formData.employmentType) {
      toast.error('Please select an employment type');
      return false;
    }
    if (!formData.location.street.trim()) {
      toast.error('Please enter a street address');
      return false;
    }
    if (!formData.location.city.trim()) {
      toast.error('Please enter a city');
      return false;
    }
    if (!formData.location.state.trim()) {
      toast.error('Please enter a state');
      return false;
    }
    if (!formData.location.pincode.trim()) {
      toast.error('Please enter a pincode');
      return false;
    }
    if (!formData.salary) {
      toast.error('Please enter a salary amount');
      return false;
    }
    if (!formData.duration.trim()) {
      toast.error('Please enter the job duration');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a job description');
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.title || !formData.category || !formData.location.street || 
        !formData.location.city || !formData.location.state || !formData.location.pincode ||
        !formData.salary || !formData.duration || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Get user data instead of separate employer data
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        toast.error('User data not found. Please log in again.');
        return;
      }

      // Prepare job data with user info
      const jobData = {
        ...formData,
        employer: user.id,
        employerName: user.name,
        companyName: user.company?.name || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Submitting job data:', jobData);

      // Post the job
      const response = await jobService.postJob(jobData);
      console.log('Job posting response:', response);
      
      toast.success('Job posted successfully!');
      
      // Navigate to employer profile after successful posting
      setTimeout(() => {
        navigate('/employer/profile');
      }, 2000);

    } catch (error) {
      console.error('Error posting job:', error);
      toast.error(error.message || 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {translations.postJob || 'Post a Job'}
          </h1>
          <p className="text-xl text-gray-600">
            {translations.postJobDescription || 'Find skilled workers by posting your job requirements'}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-lg p-8"
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                {translations.jobTitle || 'Job Title'}
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  {translations.category || 'Category'}
                </label>
                <select
                  name="category"
                  id="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="Construction">Construction</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Household">Household</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>

              <div>
                <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                  {translations.employmentType || 'Employment Type'}
                </label>
                <select
                  name="employmentType"
                  id="employmentType"
                  required
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location.type" className="block text-sm font-medium text-gray-700">
                    Work Location Type
                  </label>
                  <select
                    name="location.type"
                    id="location.type"
                    required
                    value={formData.location.type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="location.street" className="block text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="location.street"
                    id="location.street"
                    required
                    value={formData.location.street}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="location.city"
                    id="location.city"
                    required
                    value={formData.location.city}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="location.state"
                    id="location.state"
                    required
                    value={formData.location.state}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="location.pincode" className="block text-sm font-medium text-gray-700">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="location.pincode"
                    id="location.pincode"
                    required
                    value={formData.location.pincode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                  {translations.salary || 'Daily Salary (₹)'}
                </label>
                <input
                  type="number"
                  name="salary"
                  id="salary"
                  required
                  value={formData.salary}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  {translations.duration || 'Duration'}
                </label>
                <input
                  type="text"
                  name="duration"
                  id="duration"
                  required
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 3 days, 1 week"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                {translations.description || 'Job Description'}
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                {translations.requirements || 'Requirements'}
              </label>
              <textarea
                name="requirements"
                id="requirements"
                rows={3}
                value={formData.requirements}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting Job...
                </div>
              ) : (
                translations.postJob || 'Post Job'
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}