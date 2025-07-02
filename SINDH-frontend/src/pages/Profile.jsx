import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingOtherProfile, setIsViewingOtherProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    skills: [],
    experience: '',
    preferredCategory: '',
    expectedSalary: '',
    education: '',
    languages: [],
    documents: [],
    availability: '',
    preferredWorkType: '',
    preferredWorkTiming: '',
    preferredWorkLocation: '',
    bio: ''
  });

  useEffect(() => {
    const workerId = new URLSearchParams(location.search).get('id');
    if (workerId) {
      setIsViewingOtherProfile(true);
      fetchWorkerDetails(workerId);
    } else {
      fetchWorkerDetails();
    }
  }, [location.search]);

  const fetchWorkerDetails = async (workerId = null) => {
    try {
      if (!workerId) {
        const workerData = localStorage.getItem('worker');
        if (!workerData) {
          navigate('/login');
          return;
        }
        workerId = JSON.parse(workerData).id;
      }

      const response = await fetch(`https://sindh-backend.onrender.comapi/workers/${workerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch worker details');
      }

      const data = await response.json();
      setWorker(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location?.city || data.location || '',
        skills: data.skills || [],
        experience: data.experience || '',
        preferredCategory: data.preferredCategory || '',
        expectedSalary: data.expectedSalary || '',
        education: data.education || '',
        languages: data.languages || [],
        documents: data.documents || [],
        availability: data.availability || '',
        preferredWorkType: data.preferredWorkType || '',
        preferredWorkTiming: data.preferredWorkTiming || '',
        preferredWorkLocation: data.preferredWorkLocation || '',
        bio: data.bio || ''
      });
    } catch (error) {
      console.error('Error fetching worker details:', error);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setFormData(prev => ({
      ...prev,
      skills
    }));
  };

  const handleLanguagesChange = (e) => {
    const languages = e.target.value.split(',').map(lang => lang.trim());
    setFormData(prev => ({
      ...prev,
      languages
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://sindh-backend.onrender.comapi/workers/${worker._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedData = await response.json();
      setWorker(updatedData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Profile Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isViewingOtherProfile ? `${worker.name}'s Profile` : 'My Profile'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isViewingOtherProfile ? 'Worker Profile Information' : 'Manage your profile information'}
                </p>
              </div>
              {!isViewingOtherProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              )}
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
                        disabled={!isEditing || isViewingOtherProfile}
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
                        disabled={!isEditing || isViewingOtherProfile}
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
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
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
                      <label className="block text-sm font-medium text-gray-700">Skills</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                      <input
                        type="number"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preferred Category</label>
                      <select
                        name="preferredCategory"
                        value={formData.preferredCategory}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Category</option>
                        <option value="construction">Construction</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="services">Services</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Salary</label>
                      <input
                        type="number"
                        name="expectedSalary"
                        value={formData.expectedSalary}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Education</label>
                      <input
                        type="text"
                        name="education"
                        value={formData.education}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Languages</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Availability</label>
                      <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Availability</option>
                        <option value="immediate">Immediate</option>
                        <option value="one_week">Within a Week</option>
                        <option value="two_weeks">Within Two Weeks</option>
                        <option value="one_month">Within a Month</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preferred Work Type</label>
                      <select
                        name="preferredWorkType"
                        value={formData.preferredWorkType}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Work Type</option>
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="temporary">Temporary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preferred Work Timing</label>
                      <select
                        name="preferredWorkTiming"
                        value={formData.preferredWorkTiming}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Work Timing</option>
                        <option value="day">Day Shift</option>
                        <option value="night">Night Shift</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preferred Work Location</label>
                      <input
                        type="text"
                        name="preferredWorkLocation"
                        value={formData.preferredWorkLocation}
                        onChange={handleInputChange}
                        disabled={!isEditing || isViewingOtherProfile}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing || isViewingOtherProfile}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Documents Section */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Documents</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {worker?.documents?.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.type}</p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              {isEditing && !isViewingOtherProfile && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

export default Profile; 