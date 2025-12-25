// Simple Worker Profile component with minimal functionality
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { getCurrentUser } from '../../utils/authUtils';

const WorkerProfileSimple = () => {
  const navigate = useNavigate();
  const { user, isLoadingUser } = useUser();
  
  // Get user from context or localStorage
  const localStorageUser = getCurrentUser();

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: ''
  });

  useEffect(() => {
    const effectiveUser = user || localStorageUser;
    
    if (effectiveUser) {
      setProfileData({
        name: effectiveUser.name || '',
        email: effectiveUser.email || '',
        phone: effectiveUser.phone || effectiveUser.phoneNumber || '',
        userType: effectiveUser.type || ''
      });
    } else if (!isLoadingUser) {
      toast.error('Please login to view your profile');
      navigate('/login');
    }
  }, [user, localStorageUser, isLoadingUser, navigate]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Worker Profile</h2>
                  
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{profileData.name || 'Not provided'}</dd>
                      </div>
                      
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">{profileData.email || 'Not provided'}</dd>
                      </div>
                      
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                        <dd className="mt-1 text-sm text-gray-900">{profileData.phone || 'Not provided'}</dd>
                      </div>
                      
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">User Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">{profileData.userType || 'Not provided'}</dd>
                      </div>
                    </dl>

                    <div className="mt-6 flex justify-center space-x-4">
                      <button
                        onClick={() => navigate('/worker/profile')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        View Full Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfileSimple;
