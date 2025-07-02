import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building, MapPin, FileText, Phone, Mail, Award, Calendar, 
  Edit, Settings, Briefcase, Star, ChevronRight, TrendingUp, Users,
  Clock, CheckCircle, AlertCircle, Plus, Eye, MoreHorizontal, Globe
} from 'lucide-react';

const EmployerProfile = ({ employerId, employerData: propEmployerData }) => {
  const [employerData, setEmployerData] = useState(propEmployerData || null);
  const [loading, setLoading] = useState(!propEmployerData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Helper function to extract ID from various formats
  const extractEmployerId = (id) => {
    if (!id) return null;
    
    // If it's already a string and looks like a valid ID, return it
    if (typeof id === 'string' && id !== '[object Object]' && id !== 'undefined' && id !== 'null') {
      return id;
    }
    
    // If it's an object, try to get the _id or id property
    if (typeof id === 'object' && id !== null) {
      return id._id || id.id || null;
    }
    
    return null;
  };

  useEffect(() => {
    // If we have prop data, use it and don't fetch
    if (propEmployerData) {
      setEmployerData(propEmployerData);
      setLoading(false);
      return;
    }

    // Try to get employer ID from various sources
    let idToUse = extractEmployerId(employerId);
    
    if (!idToUse) {
      // Try localStorage - could be stored as object or string
      const storedId = localStorage.getItem('employerId');
      const storedEmployer = localStorage.getItem('employer');
      
      if (storedId) {
        try {
          // Try to parse as JSON in case it's an object
          const parsedId = JSON.parse(storedId);
          idToUse = extractEmployerId(parsedId);
        } catch {
          // If parsing fails, use as string
          idToUse = extractEmployerId(storedId);
        }
      }
      
      if (!idToUse && storedEmployer) {
        try {
          const parsedEmployer = JSON.parse(storedEmployer);
          idToUse = extractEmployerId(parsedEmployer);
        } catch {
          // Ignore parsing errors
        }
      }
    }
    
    if (!idToUse) {
      // Try URL params as last resort
      const urlParams = new URLSearchParams(window.location.search);
      idToUse = extractEmployerId(urlParams.get('id'));
    }

    console.log('Extracted employer ID:', idToUse);

    if (idToUse) {
      fetchEmployerProfile(idToUse);
    } else {
      setError('No valid employer ID found. Please log in again.');
      setLoading(false);
    }
  }, [employerId, propEmployerData]);

  const fetchEmployerProfile = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== Fetching Employer Profile ===');
      console.log('Employer ID:', id);
      console.log('User Type: employer');
      
      // Get user type from localStorage to determine access level
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userType = user.type || 'guest';
      
      const response = await fetch(`https://sindh-backend.onrender.comapi/employers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-type': userType, // Send user type header for proper data access
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch employer profile: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Employer profile fetched successfully:', {
        id: data._id,
        name: data.name,
        hasFullData: !!data.phone // Check if we got full data
      });
      
      setEmployerData(data);
      
      // Store the correct ID format in localStorage
      localStorage.setItem('employerId', data._id || data.id);
      localStorage.setItem('employer', JSON.stringify(data));
      
    } catch (error) {
      console.error('❌ Error fetching employer profile:', error);
      setError(`Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ER';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header skeleton */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded-full w-24 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-4"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => {
                const id = extractEmployerId(employerId) || 
                           extractEmployerId(localStorage.getItem('employerId'));
                if (id) fetchEmployerProfile(id);
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/employer/register'}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Register New Account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'jobs', label: 'Job Posts', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-8 mb-6 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full transform translate-x-32 -translate-y-32"></div>
          
          <div className="relative">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Profile Picture */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-3xl">
                    {getInitials(employerData?.name)}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </motion.div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {employerData?.name}
                  </h1>
                  <p className="text-xl text-blue-600 font-medium mb-3">
                    {employerData?.company?.name}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      {employerData?.company?.type}
                    </span>
                    <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      {employerData?.company?.industry}
                    </span>
                    <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verified
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>
                      {employerData?.location?.village}, {employerData?.location?.district}, {employerData?.location?.state}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Member since {formatDate(employerData?.registrationDate)}</span>
                  </div>
                </motion.div>
              </div>
              
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3"
              >
                <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Edit className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>
              </motion.div>
            </div>
            
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-100"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-500">Jobs Posted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-500">Active Hires</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {employerData?.rating?.average || 'New'}
                </div>
                <div className="text-sm text-gray-500">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {employerData?.rating?.count || 0}
                </div>
                <div className="text-sm text-gray-500">Reviews</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-sm mb-6"
        >
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Business Information */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Building className="w-6 h-6 mr-3 text-blue-600" />
                      Business Information
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {employerData?.businessDescription || 'No business description provided yet.'}
                    </p>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-6 h-6 mr-3 text-green-600" />
                      Recent Activity
                    </h2>
                    <div className="text-center py-12">
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                      <p className="text-gray-500 mb-6">Start by posting your first job to see activity here</p>
                      <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <Plus className="w-5 h-5 mr-2" />
                        Post Your First Job
                      </button>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-6 h-6 mr-3 text-purple-600" />
                      Location & Coverage Area
                    </h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="font-medium text-gray-900 mb-1">Primary Location</div>
                        <div className="text-gray-600">
                          {employerData?.location?.village}, {employerData?.location?.district}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {employerData?.location?.state} - {employerData?.location?.pincode}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 mr-3 text-gray-500" />
                        <span className="text-gray-700">{employerData?.phone}</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 mr-3 text-gray-500" />
                        <span className="text-gray-700">{employerData?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span className="flex items-center">
                          <Plus className="w-5 h-5 mr-2" />
                          Post New Job
                        </span>
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <span className="flex items-center">
                          <Eye className="w-5 h-5 mr-2" />
                          View Applications
                        </span>
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-between px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <span className="flex items-center">
                          <Briefcase className="w-5 h-5 mr-2" />
                          Manage Jobs
                        </span>
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-orange-600" />
                      Account Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Email Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Phone Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Aadhar Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Profile Complete</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="text-center py-16">
                  <Briefcase className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Job Posts Yet</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Start connecting with skilled workers by posting your first job. It's quick and easy!
                  </p>
                  <button className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Job Post
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="text-center py-16">
                  <TrendingUp className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Analytics Coming Soon</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Track your hiring performance, view application analytics, and optimize your job posts.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="text-center py-16">
                  <Settings className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Settings</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Manage your account preferences, notification settings, and privacy options.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmployerProfile;