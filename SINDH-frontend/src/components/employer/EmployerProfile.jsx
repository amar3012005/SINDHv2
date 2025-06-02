import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { employerService } from '../../services/employerService';
import ProfileImageUpload from '../ProfileImageUpload';
import { useLanguage } from '../../context/LanguageContext';

const EmployerProfile = () => {
  // const location = useLocation(); // Commenting out unused variable
  const navigate = useNavigate();
  // const { translations } = useLanguage(); // Commenting out unused variable
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchEmployerData = async (id) => {
    try {
      setLoading(true);
      // Fetch employer data from backend using the ID
      const data = await employerService.getEmployerById(id);
      console.log('Fetched employer data:', data);
      
      if (data) {
        // Ensure all required fields are present
        const formattedData = {
          ...data,
          company: {
            name: data.company?.name || '',
            type: data.company?.type || '',
            industry: data.company?.industry || '',
            description: data.company?.description || '',
            registrationNumber: data.company?.registrationNumber || ''
          },
          location: {
            village: data.location?.village || '',
            district: data.location?.district || '',
            state: data.location?.state || '',
            pincode: data.location?.pincode || '',
            address: data.location?.address || ''
          },
          verificationDocuments: {
            aadharNumber: data.verificationDocuments?.aadharNumber || '',
            panNumber: data.verificationDocuments?.panNumber || '',
            businessLicense: data.verificationDocuments?.businessLicense || ''
          },
          documents: data.documents || [],
          preferredLanguages: data.preferredLanguages || [],
          rating: data.rating || { average: 0, count: 0 },
          reviews: data.reviews || [],
          verificationStatus: data.verificationStatus || 'pending',
          isLoggedIn: data.isLoggedIn || 0,
          registrationDate: data.registrationDate || new Date().toISOString(),
          lastLogin: data.lastLogin || new Date().toISOString()
        };

        // Update both localStorage and state
        localStorage.setItem('employer', JSON.stringify(formattedData));
        setEmployer(formattedData);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        // If data not found, clear local storage and redirect to registration
        localStorage.removeItem('employerId');
        localStorage.removeItem('employer');
        toast.error('Employer profile not found.');
        navigate('/employer/register');
      }
    } catch (error) {
      console.error('Error fetching employer data:', error);
      localStorage.removeItem('employerId');
      localStorage.removeItem('employer');
      toast.error('Failed to load employer profile. Please login again.');
      navigate('/employer/register');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for employer ID in localStorage
    const employerId = JSON.parse(localStorage.getItem('employerId'));
    if (employerId) {
      fetchEmployerData(employerId);
    } else {
      // If no ID found, redirect to registration
      navigate('/employer/register');
    }
  }, [navigate, fetchEmployerData]); // Added fetchEmployerData to dependency array

  const handleLogout = () => {
    if (employer) {
      // Update login status in localStorage
      const updatedData = {
        ...employer,
        isLoggedIn: 0,
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem('employer', JSON.stringify(updatedData));
      
      // Try to update server
      employerService.updateProfile(updatedData).catch(error => {
        console.error('Failed to update server:', error);
      });
    }
    
    // Clear employer data
    localStorage.removeItem('employer');
    navigate('/');
  };

  const handleImageUploadComplete = async (imageUrl) => {
    if (imageUrl) {
      try {
        // Update profile with new image
        const updatedData = {
          ...employer,
          profileImage: imageUrl
        };
        
        // Update localStorage
        localStorage.setItem('employer', JSON.stringify(updatedData));
        
        // Try to update server
        await employerService.updateProfile(updatedData);
        
        setEmployer(updatedData);
        toast.success('Profile image updated successfully');
      } catch (error) {
        console.error('Error updating profile image:', error);
        toast.error('Failed to update profile image');
      }
    }
    setShowImageUpload(false);
  };

  const handlePostJob = () => {
    navigate('/employer/post-job');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
          <p className="text-gray-600 mt-2">Please try logging in again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
            >
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> Your registration is complete.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {showImageUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <ProfileImageUpload onUploadComplete={handleImageUploadComplete} />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative h-48 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100">
                  {employer.profileImage ? (
                    <img
                      src={employer.profileImage}
                      alt={employer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                {!employer.profileImage && (
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="pt-20 pb-8 px-8">
            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>
                  <p className="text-gray-900 text-lg font-medium">{employer.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="text-gray-900 text-lg">{employer.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="text-gray-900 text-lg">{employer.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Registration Date</label>
                  <p className="text-gray-900 text-lg">
                    {new Date(employer.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500">Business Name</label>
                  <p className="text-gray-900 text-lg font-medium">{employer.company?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Business Type</label>
                  <p className="text-gray-900 text-lg">{employer.company?.type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Industry</label>
                  <p className="text-gray-900 text-lg">{employer.company?.industry}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Business Description</label>
                  <p className="text-gray-900 text-lg">{employer.company?.description}</p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Location Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500">Village/Town</label>
                  <p className="text-gray-900 text-lg">{employer.location?.village}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">District</label>
                  <p className="text-gray-900 text-lg">{employer.location?.district}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">State</label>
                  <p className="text-gray-900 text-lg">{employer.location?.state}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Pincode</label>
                  <p className="text-gray-900 text-lg">{employer.location?.pincode}</p>
                </div>
              </div>
            </div>

            {/* Verification Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500">Aadhar Number</label>
                  <p className="text-gray-900 text-lg">{employer.verificationDocuments?.aadharNumber}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    Verified
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Verification Status</label>
                  <p className="text-gray-900 text-lg capitalize">{employer.verificationStatus}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last Login</label>
                  <p className="text-gray-900 text-lg">
                    {new Date(employer.lastLogin).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePostJob}
                className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Post a Job
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployerProfile; 