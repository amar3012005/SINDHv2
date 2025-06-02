// Enhanced Worker Profile component with better localStorage handling
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { getCurrentUser, isWorker } from '../../utils/authUtils';

const WorkerProfile = () => {
  console.log('WorkerProfile component rendered');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoadingUser, updateProfile } = useUser();
  
  // Get user from multiple sources
  const localStorageUser = getCurrentUser();
  const effectiveUser = user || localStorageUser;
  
  console.log('User from context:', user);
  console.log('User from localStorage:', localStorageUser);
  console.log('Effective user:', effectiveUser);

  const [isEditing, setIsEditing] = useState(false);
  const [shaktiScore, setShaktiScore] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: {
      address: '',
      village: '',
      district: '',
      state: '',
      pincode: ''
    },
    gender: '',
    dateOfBirth: '',
    education: '',
    skills: [],
    experience: '',
    preferredCategory: '',
    expectedSalary: '',
    languages: [],
    documents: [],
    availability: '',
    preferredWorkType: '',
    preferredWorkTiming: '',
    preferredWorkLocation: '',
    bio: '',
    shaktiScore: 0,
    verificationStatus: '',
    rating: 0,
    completedJobs: 0,
    activeJobs: 0,
    aadharNumber: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: ''
    }
  });

  // Initialize form data from effective user (context or localStorage)
  useEffect(() => {
    console.log('WorkerProfile useEffect: initializing with effectiveUser', effectiveUser);
    
    if (effectiveUser && (effectiveUser.type === 'worker' || isWorker())) {
      console.log('Setting form data from effective user');
      
      setFormData({
        name: effectiveUser.name || '',
        email: effectiveUser.email || '',
        phone: effectiveUser.phone || effectiveUser.phoneNumber || '',
        location: effectiveUser.location || {
          address: '',
          village: '',
          district: '',
          state: '',
          pincode: ''
        },
        gender: effectiveUser.gender || '',
        dateOfBirth: effectiveUser.dateOfBirth || '',
        education: effectiveUser.education || '',
        skills: effectiveUser.skills || [],
        experience: effectiveUser.experience || effectiveUser.experience_years || '',
        preferredCategory: effectiveUser.preferredCategory || '',
        expectedSalary: effectiveUser.expectedSalary || '',
        languages: effectiveUser.languages || effectiveUser.language || [],
        documents: effectiveUser.documents || [],
        availability: effectiveUser.availability || '',
        preferredWorkType: effectiveUser.preferredWorkType || '',
        preferredWorkTiming: effectiveUser.preferredWorkTiming || '',
        preferredWorkLocation: effectiveUser.preferredWorkLocation || '',
        bio: effectiveUser.bio || '',
        shaktiScore: effectiveUser.shaktiScore || 0,
        verificationStatus: effectiveUser.verificationStatus || 'pending',
        rating: effectiveUser.rating || 0,
        completedJobs: effectiveUser.completedJobs || 0,
        activeJobs: effectiveUser.activeJobs || 0,
        aadharNumber: effectiveUser.aadharNumber || '',
        bankDetails: effectiveUser.bankDetails || {
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          accountHolderName: ''
        }
      });
      
      // Calculate and set Shakti score
      const calculatedScore = calculateShaktiScore(effectiveUser);
      setShaktiScore(calculatedScore);
      
    } else if (!isLoadingUser) {
      // Only redirect if we're sure there's no user
      console.log('No valid user found, redirecting to login');
      toast.error('Please login to view your profile');
      navigate('/login');
    }
  }, [effectiveUser, isLoadingUser, navigate]);

  // Check if coming from registration
  useEffect(() => {
    const fromRegistration = location.state?.fromRegistration;
    if (fromRegistration) {
      toast.success('Registration successful! Please complete your profile.');
      setIsEditing(true);
    }
  }, [location.state]);

  const calculateShaktiScore = (workerData) => {
    let score = 0;
    
    // Basic Information (20 points)
    if (workerData.name) score += 5;
    if (workerData.email) score += 5;
    if (workerData.phone || workerData.phoneNumber) score += 5;
    if (workerData.location?.address || workerData.location?.state) score += 5;

    // Professional Information (30 points)
    if (workerData.skills?.length > 0) score += 10;
    if (workerData.experience || workerData.experience_years) score += 5;
    if (workerData.preferredCategory) score += 5;
    if (workerData.expectedSalary) score += 5;
    if (workerData.education) score += 5;

    // Additional Information (20 points)
    if (workerData.languages?.length > 0 || workerData.language?.length > 0) score += 5;
    if (workerData.documents?.length > 0) score += 10;
    if (workerData.bio) score += 5;

    // Work Preferences (15 points)
    if (workerData.availability) score += 5;
    if (workerData.preferredWorkType) score += 5;
    if (workerData.preferredWorkTiming) score += 5;

    // Performance (15 points)
    if (workerData.rating) score += 5;
    if (workerData.completedJobs > 0) score += 5;
    if (workerData.verificationStatus === 'verified') score += 5;

    return score;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank.')) {
      const bankField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value
        }
      }));
    } else if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({ ...prev, skills }));
  };

  const handleLanguagesChange = (e) => {
    const languages = e.target.value.split(',').map(lang => lang.trim()).filter(lang => lang);
    setFormData(prev => ({ ...prev, languages }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Calculate updated Shakti score
      const updatedScore = calculateShaktiScore(formData);
      const updatedFormData = { ...formData, shaktiScore: updatedScore };
      
      // Update localStorage immediately
      const updatedUser = { ...effectiveUser, ...updatedFormData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setFormData(updatedFormData);
      setShaktiScore(updatedScore);
      setIsEditing(false);
      
      // Try to update via API if available
      if (updateProfile && effectiveUser.id) {
        try {
          await updateProfile(effectiveUser.id, 'worker', updatedFormData);
        } catch (apiError) {
          console.warn('API update failed, but localStorage was updated:', apiError);
        }
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  console.log('Render state:', { effectiveUser, isLoadingUser, formData });
  
  // Show loading only if we're actually loading and have no user data
  if (isLoadingUser && !effectiveUser) {
    console.log('Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  // If we have no effective user and we're not loading, show error
  if (!effectiveUser && !isLoadingUser) {
    console.log('No profile data available');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-lg text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Profile Data Not Found</h2>
          <p className="text-gray-700 mb-4">We couldn't load your profile information.</p>
          <p className="text-gray-600 mb-6">Please try logging in again.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Debug component for development
  const DebugInfo = () => (
    <div className="bg-yellow-100 p-4 mb-6 rounded-lg border border-yellow-300">
      <h4 className="font-bold text-sm mb-2">Debug Info (Development Only)</h4>
      <div className="text-xs space-y-1">
        <div><strong>User from Context:</strong> {user ? `${user.name} (${user.type})` : 'null'}</div>
        <div><strong>User from localStorage:</strong> {localStorageUser ? `${localStorageUser.name} (${localStorageUser.type})` : 'null'}</div>
        <div><strong>Effective User:</strong> {effectiveUser ? `${effectiveUser.name} (${effectiveUser.type})` : 'null'}</div>
        <div><strong>isLoadingUser:</strong> {isLoadingUser.toString()}</div>
        <div><strong>Form Data Name:</strong> {formData.name}</div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && <DebugInfo />}
        
        <div className="bg-white shadow rounded-lg">
          {/* Profile Header with Shakti Score */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">My Profile</h3>
                <p className="mt-1 text-sm text-gray-500">Manage your worker profile information</p>
                <p className="mt-1 text-xs text-blue-500">
                  User ID: {effectiveUser?.id || effectiveUser?._id || 'Unknown'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{shaktiScore}</div>
                  <div className="text-sm text-gray-500">Shakti Score</div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Basic Information */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Location</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        name="location.state"
                        value={formData.location?.state || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">District</label>
                      <input
                        type="text"
                        name="location.district"
                        value={formData.location?.district || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Village</label>
                      <input
                        type="text"
                        name="location.village"
                        value={formData.location?.village || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pincode</label>
                      <input
                        type="text"
                        name="location.pincode"
                        value={formData.location?.pincode || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
                      <input
                        type="text"
                        value={formData.skills?.join(', ') || ''}
                        onChange={handleSkillsChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                        placeholder="e.g., Construction, Plumbing, Electrical"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <input
                        type="text"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preferred Category</label>
                      <select
                        name="preferredCategory"
                        value={formData.preferredCategory}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Category</option>
                        <option value="Construction">Construction</option>
                        <option value="Agriculture">Agriculture</option>
                        <option value="Household">Household</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Salary</label>
                      <input
                        type="text"
                        name="expectedSalary"
                        value={formData.expectedSalary}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Languages (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.languages?.join(', ') || ''}
                    onChange={handleLanguagesChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="e.g., Hindi, English, Punjabi"
                  />
                </div>

                {/* Bio */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Tell us about yourself and your work experience..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              {isEditing && (
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
