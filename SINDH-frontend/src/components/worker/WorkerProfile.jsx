import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  User, Award, MapPin, FileText, Phone, Mail, Calendar, 
  Edit, Settings, Briefcase, ChevronRight, TrendingUp,
  CheckCircle, AlertCircle, Eye, Clock, Star,
  Loader, RefreshCw, ArrowLeft, Languages, DollarSign
} from 'lucide-react';

const WorkerProfile = ({ workerId, workerData: propWorkerData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [shaktiScore, setShaktiScore] = useState(0);
  const [isLoading, setIsLoading] = useState(!propWorkerData);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeJobs: 0,
    completedJobs: 0,
    averageRating: 0
  });

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    age: '',
    phone: '',
    email: '',
    gender: '',
    
    // Identity
    aadharNumber: '',
    
    // Professional Information
    skills: [],
    experience: '',
    preferredCategory: '',
    expectedSalary: '',
    languages: [],
    
    // Location
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
    
    // Work Preferences
    preferredWorkType: '',
    availability: '',
    workRadius: 10,
    bio: '',
    
    // System fields
    verificationStatus: 'pending',
    isAvailable: true,
    shaktiScore: 0,
    rating: {
      average: 0,
      count: 0,
      reviews: []
    },
    
    // Timestamps
    registrationDate: '',
    lastLogin: '',
    profileCompletionPercentage: 0,
    
    // Work tracking
    activeJobs: 0,
    completedJobs: 0,
    workHistory: [],
    
    // Additional fields
    profilePicture: '',
    documents: [],
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: ''
    },
    
    // Contact preferences
    emailNotifications: true,
    smsNotifications: true,
    
    // Emergency contact
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });

  // Helper function to extract ID from various formats
  const extractWorkerId = (id) => {
    if (!id) return null;
    
    if (typeof id === 'string' && id !== '[object Object]' && id !== 'undefined' && id !== 'null') {
      return id;
    }
    
    if (typeof id === 'object' && id !== null) {
      return id._id || id.id || null;
    }
    
    return null;
  };

  // Get worker data from various sources
  const getUserData = useCallback(() => {
    // If we have prop data, use it first
    if (propWorkerData) {
      return propWorkerData;
    }

    const sources = [
      { name: 'localStorage.user', data: (() => {
        try { return JSON.parse(localStorage.getItem('user')); } 
        catch(e) { return null; }
      })() },
      { name: 'localStorage.worker', data: (() => {
        try { return JSON.parse(localStorage.getItem('worker')); } 
        catch(e) { return null; }
      })() }
    ];

    for (const source of sources) {
      if (source.data && source.data.type === 'worker' && (source.data.id || source.data._id)) {
        console.log(`Found user data from ${source.name}:`, source.data);
        return source.data;
      }
    }
    return null;
  }, [propWorkerData]);

  // Get worker ID from various sources
  const getWorkerId = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    const storedWorker = localStorage.getItem('worker');
    const storedWorkerId = localStorage.getItem('workerId');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.type === 'worker' && (user.id || user._id)) {
          return user.id || user._id;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    if (storedWorker) {
      try {
        const worker = JSON.parse(storedWorker);
        if (worker._id || worker.id) {
          return worker._id || worker.id;
        }
      } catch (e) {
        console.error('Error parsing stored worker:', e);
      }
    }
    
    if (storedWorkerId) {
      return storedWorkerId;
    }
    
    return extractWorkerId(workerId);
  }, [workerId]);

  // Fetch worker profile data
  const fetchWorkerProfile = useCallback(async (workerId) => {
    if (!workerId || workerId === 'undefined' || workerId === 'null') {
      throw new Error('Invalid worker ID provided');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching worker profile for ID:', workerId);
      
      const response = await fetch(`https://sindh-backend.onrender.comapi/workers/${workerId}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'worker',
          'User-ID': workerId
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Worker profile not found');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please log in as a worker.');
        } else {
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Fetched profile data:', data);
      
      localStorage.setItem('workerId', data._id || data.id);
      localStorage.setItem('worker', JSON.stringify(data));
      
      // Fetch additional data
      await fetchWorkerStats(workerId);
      
      return data;
    } catch (error) {
      console.error('Error fetching worker profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch worker statistics
  const fetchWorkerStats = async (workerId) => {
    try {
      const response = await fetch(`https://sindh-backend.onrender.comapi/workers/${workerId}/stats`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'worker',
          'User-ID': workerId
        }
      });
      
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
        console.log('Worker stats:', statsData);
      }
    } catch (error) {
      console.error('Error fetching worker stats:', error);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    const workerId = getWorkerId();
    if (!workerId) {
      setError('No worker ID found. Please log in again.');
      return;
    }
    
    setRefreshing(true);
    try {
      await fetchWorkerProfile(workerId);
      toast.success('Profile refreshed!');
    } catch (error) {
      setError(error.message);
    }
    setRefreshing(false);
  };

  // Check if coming from registration
  useEffect(() => {
    if (location.state?.fromRegistration) {
      toast.success('Registration successful! Please complete your profile.');
      // Note: Editing functionality removed - user can edit via settings tab
    }
  }, [location.state]);

  // Populate form data from user data
  const populateFormData = useCallback((userData) => {
    console.log('Populating form data with:', userData);
    
    const newFormData = {
      // Personal Information
      name: userData.name || '',
      age: userData.age || '',
      phone: userData.phone || userData.phoneNumber || '',
      email: userData.email || '',
      gender: userData.gender || '',
      
      // Identity
      aadharNumber: userData.aadharNumber || '',
      
      // Professional Information
      skills: userData.skills || [],
      experience: userData.experience || userData.experience_years || '',
      preferredCategory: userData.preferredCategory || '',
      expectedSalary: userData.expectedSalary || '',
      languages: userData.languages || userData.language || [],
      
      // Location
      location: userData.location || {
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
      
      // Work Preferences
      preferredWorkType: userData.preferredWorkType || '',
      availability: userData.availability || '',
      workRadius: userData.workRadius || 10,
      bio: userData.bio || '',
      
      // System fields
      verificationStatus: userData.verificationStatus || 'pending',
      isAvailable: userData.isAvailable !== undefined ? userData.isAvailable : true,
      shaktiScore: userData.shaktiScore || 0,
      rating: userData.rating || {
        average: 0,
        count: 0,
        reviews: []
      },
      
      // Timestamps
      registrationDate: userData.registrationDate || userData.createdAt || '',
      lastLogin: userData.lastLogin || '',
      profileCompletionPercentage: userData.profileCompletionPercentage || 0,
      
      // Work tracking
      activeJobs: userData.activeJobs || 0,
      completedJobs: userData.completedJobs || 0,
      workHistory: userData.workHistory || [],
      
      // Additional fields
      profilePicture: userData.profilePicture || '',
      documents: userData.documents || [],
      bankDetails: userData.bankDetails || {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: ''
      },
      
      // Contact preferences
      emailNotifications: userData.emailNotifications !== undefined ? userData.emailNotifications : true,
      smsNotifications: userData.smsNotifications !== undefined ? userData.smsNotifications : true,
      
      // Emergency contact
      emergencyContact: userData.emergencyContact || {
        name: '',
        phone: '',
        relation: ''
      }
    };

    setFormData(newFormData);
    
    // Calculate and set Shakti score
    const calculatedScore = calculateShaktiScore(newFormData);
    setShaktiScore(calculatedScore);
  }, []);

  // Initialize component data
  useEffect(() => {
    const initializeProfile = async () => {
      console.log('Initializing worker profile...');
      
      if (propWorkerData) {
        console.log('Using prop data, no fetch needed');
        populateFormData(propWorkerData);
        setIsLoading(false);
        return;
      }

      const workerId = getWorkerId();
      if (!workerId) {
        setError('No worker ID found. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      try {
        const data = await fetchWorkerProfile(workerId);
        if (data) {
          populateFormData(data);
        }
      } catch (error) {
        setError(error.message);
        
        // Try to use cached data as fallback
        const userData = getUserData();
        if (userData && userData.name) {
          console.log('Using cached data as fallback');
          populateFormData(userData);
        }
      }
    };

    initializeProfile();
  }, [workerId, propWorkerData, fetchWorkerProfile, getWorkerId, populateFormData, getUserData]);

  const calculateShaktiScore = (workerData) => {
    let score = 0;
    
    // Basic Information (20 points)
    if (workerData.name) score += 5;
    if (workerData.email) score += 5;
    if (workerData.phone) score += 5;
    if (workerData.location?.state) score += 5;

    // Professional Information (30 points)
    if (workerData.skills?.length > 0) score += 10;
    if (workerData.experience) score += 5;
    if (workerData.preferredCategory) score += 5;
    if (workerData.expectedSalary) score += 5;
    if (workerData.education) score += 5;

    // Additional Information (20 points)
    if (workerData.languages?.length > 0) score += 5;
    if (workerData.documents?.length > 0) score += 10;
    if (workerData.bio) score += 5;

    // Work Preferences (15 points)
    if (workerData.availability) score += 5;
    if (workerData.preferredWorkType) score += 5;
    if (workerData.preferredWorkTiming) score += 5;

    // Performance (15 points)
    if (workerData.rating?.average && workerData.rating.average > 0) score += 5;
    if (workerData.completedJobs > 0) score += 5;
    if (workerData.verificationStatus === 'verified') score += 5;

    return Math.min(score, 100); // Cap at 100
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value
        }
      }));
    } else if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: array }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Calculate updated Shakti score
      const updatedScore = calculateShaktiScore(formData);
      const updatedFormData = { ...formData, shaktiScore: updatedScore };
      
      const userData = getUserData();
      const userId = userData?.id || userData?._id;
      
      // Update localStorage immediately
      const updatedUser = { 
        ...userData, 
        ...updatedFormData, 
        type: 'worker',
        id: userId
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('worker', JSON.stringify(updatedUser));
      
      setFormData(updatedFormData);
      setShaktiScore(updatedScore);
      
      // Try to update via API
      if (userId) {
        try {
          const response = await fetch(`https://sindh-backend.onrender.comapi/workers/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedFormData)
          });
          
          if (response.ok) {
            console.log('Profile updated successfully via API');
          } else {
            console.warn('API update failed, but localStorage was updated');
          }
        } catch (apiError) {
          console.warn('API update failed, but localStorage was updated:', apiError);
        }
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getInitials = (name) => {
    if (!name) return 'WR';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    
    if (typeof location === 'string') return location;
    
    const parts = [
      location.village,
      location.district,
      location.state,
      location.pincode
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Profile</h3>
          <p className="text-gray-600">Fetching your worker profile data...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {refreshing ? (
                <span className="flex items-center justify-center">
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/worker/register')}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Register New Account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main profile render
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header with refresh button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 sm:mb-8"
        >
          <div className="flex items-center">
            <button 
              onClick={() => window.history.back()}
              className="mr-3 sm:mr-4 p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Worker Profile</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </motion.div>

        {/* Professional Eligibility Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-black bg-opacity-10 p-4 sm:p-6 lg:p-8">
              {/* Mobile-first layout */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-white rounded-full p-1 shadow-lg mr-4 sm:mr-6 flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">
                        {getInitials(formData?.name)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 truncate">{formData?.name}</h2>
                    <p className="text-green-100 text-sm sm:text-base lg:text-lg font-medium truncate">{formData?.preferredCategory} Professional</p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-200 mr-1 flex-shrink-0" />
                      <span className="text-green-100 text-xs sm:text-sm truncate">{formatLocation(formData?.location)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full sm:w-auto">
                  <div className="bg-white bg-opacity-20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-white">{shaktiScore}</div>
                    <div className="text-green-100 text-xs sm:text-sm">Shakti Score</div>
                  </div>
                </div>
              </div>

              {/* Eligibility Indicators - Mobile responsive grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                <div className="bg-white bg-opacity-15 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${formData?.verificationStatus === 'verified' ? 'text-green-300' : 'text-yellow-300'}`} />
                    <span className={`text-xs font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                      formData?.verificationStatus === 'verified' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {formData?.verificationStatus === 'verified' ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-white text-xs sm:text-sm font-medium">Identity</p>
                  <p className="text-green-100 text-xs">Verified</p>
                </div>

                <div className="bg-white bg-opacity-15 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-300" />
                    <span className="text-xs font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-full bg-blue-500 text-white">
                      {formData?.skills?.length || 0}
                    </span>
                  </div>
                  <p className="text-white text-xs sm:text-sm font-medium">Skills</p>
                  <p className="text-blue-100 text-xs">{formData?.experience}</p>
                </div>

                <div className="bg-white bg-opacity-15 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <Clock className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${formData?.isAvailable ? 'text-green-300' : 'text-red-300'}`} />
                    <span className={`text-xs font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                      formData?.isAvailable 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {formData?.isAvailable ? 'OPEN' : 'BUSY'}
                    </span>
                  </div>
                  <p className="text-white text-xs sm:text-sm font-medium">Status</p>
                  <p className="text-green-100 text-xs">{formData?.availability}</p>
                </div>

                <div className="bg-white bg-opacity-15 rounded-lg p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-300" />
                    <span className="text-xs font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded-full bg-yellow-500 text-white">
                      {formData?.rating?.average ? formData.rating.average.toFixed(1) : '0.0'} ⭐
                    </span>
                  </div>
                  <p className="text-white text-xs sm:text-sm font-medium">Rating</p>
                  <p className="text-yellow-100 text-xs">{formData?.completedJobs || 0} Jobs</p>
                </div>
              </div>

              {/* Key Skills Tags - Mobile responsive */}
              <div className="mb-4 sm:mb-6">
                <p className="text-green-100 text-sm mb-2 sm:mb-3 font-medium">Core Skills:</p>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {formData?.skills?.slice(0, 6).map(skill => (
                    <span key={skill} className="px-2 sm:px-3 py-1 bg-white bg-opacity-20 text-white text-xs sm:text-sm rounded-full backdrop-blur-sm">
                      {skill}
                    </span>
                  ))}
                  {formData?.skills?.length > 6 && (
                    <span className="px-2 sm:px-3 py-1 bg-white bg-opacity-20 text-white text-xs sm:text-sm rounded-full backdrop-blur-sm">
                      +{formData.skills.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Contact & Actions - Mobile stacked layout */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                  <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 backdrop-blur-sm text-xs sm:text-sm">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-green-200 mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="text-white truncate">{formData?.phone}</span>
                  </div>
                  {formData?.email && (
                    <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 backdrop-blur-sm text-xs sm:text-sm">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="text-white truncate">{formData?.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <button 
                    onClick={() => navigate('/worker/profile/edit')}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center justify-center text-sm"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => navigate('/worker/find-work')}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center text-sm"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Find Work
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs - Mobile responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="flex space-x-0.5 sm:space-x-1 bg-gray-100 p-0.5 sm:p-1 rounded-lg overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 flex items-center justify-center px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
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
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
                  {/* About Section */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                      About Me
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
                      {formData?.bio || 'No bio provided yet.'}
                    </p>
                    
                    {/* Profile Completion */}
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex justify-between items-center mb-2 sm:mb-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Profile Completion</span>
                        <span className="text-xs sm:text-sm text-gray-600">{formData?.profileCompletionPercentage || 85}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-green-600 h-1.5 sm:h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${formData?.profileCompletionPercentage || 85}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Complete your profile to get more job opportunities</p>
                    </div>
                  </div>

                  {/* Professional Details */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                      Professional Details
                    </h3>
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Skills & Expertise</h4>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {formData?.skills?.map(skill => (
                            <span key={skill} className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-xs sm:text-sm rounded-full border border-green-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Experience Level</h4>
                          <p className="text-gray-700 bg-gray-50 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">{formData?.experience}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Expected Salary</h4>
                          <p className="text-gray-700 bg-gray-50 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">{formData?.expectedSalary}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Languages & Work Preferences */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Languages className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                      Communication & Preferences
                    </h3>
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Languages Spoken</h4>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {formData?.languages?.map(lang => (
                            <span key={lang} className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 text-xs sm:text-sm rounded-full border border-blue-200">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Work Preferences</h4>
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between p-1.5 sm:p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Work Type:</span>
                            <span className="text-gray-900 text-right truncate ml-2">{formData?.preferredWorkType}</span>
                          </div>
                          <div className="flex justify-between p-1.5 sm:p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Availability:</span>
                            <span className="text-gray-900 text-right truncate ml-2">{formData?.availability}</span>
                          </div>
                          <div className="flex justify-between p-1.5 sm:p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">Work Radius:</span>
                            <span className="text-gray-900">{formData?.workRadius} km</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Sidebar - Mobile full width, desktop sidebar */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Stats</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-600 text-sm">Applications</span>
                        <span className="text-green-600 font-bold">{stats.totalApplications}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <span className="text-gray-600 text-sm">Active Jobs</span>
                        <span className="text-blue-600 font-bold">{stats.activeJobs}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                        <span className="text-gray-600 text-sm">Completed</span>
                        <span className="text-purple-600 font-bold">{stats.completedJobs}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                      Contact Information
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm truncate">{formData?.phone}</span>
                      </div>
                      {formData?.email && (
                        <div className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700 text-sm truncate">{formData?.email}</span>
                        </div>
                      )}
                      <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center mb-1 sm:mb-2">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-600 font-medium text-sm">Location</span>
                        </div>
                        <p className="text-gray-700 text-xs sm:text-sm ml-6 sm:ml-7">{formatLocation(formData?.location)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <button 
                        onClick={() => navigate('/worker/find-work')}
                        className="w-full flex items-center justify-between p-2 sm:p-3 text-left hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                      >
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-green-600" />
                          <span className="text-sm">Find Work</span>
                        </div>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </button>
                      <button 
                        onClick={() => navigate('/worker/applications')}
                        className="w-full flex items-center justify-between p-2 sm:p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                      >
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-600" />
                          <span className="text-sm">My Applications</span>
                        </div>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </button>
                      <button className="w-full flex items-center justify-between p-2 sm:p-3 text-left hover:bg-purple-50 rounded-lg transition-colors border border-purple-200">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-purple-600" />
                          <span className="text-sm">Earnings</span>
                        </div>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Verification Status</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-1.5 sm:p-2">
                        <span className="text-gray-600 text-sm">Phone Verified</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between p-1.5 sm:p-2">
                        <span className="text-gray-600 text-sm">Aadhar Verified</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between p-1.5 sm:p-2">
                        <span className="text-gray-600 text-sm">Profile Complete</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-6 sm:p-8">
                <div className="text-center py-12 sm:py-16">
                  <Briefcase className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">No Applications Yet</h3>
                  <p className="text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                    Start applying for jobs to see your applications here.
                  </p>
                  <button 
                    onClick={() => navigate('/worker/find-work')}
                    className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Find Jobs
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-6 sm:p-8">
                <div className="text-center py-12 sm:py-16">
                  <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Analytics Coming Soon</h3>
                  <p className="text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
                    Track your application success rate, earnings, and work performance.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Profile Settings</h2>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Account Information</h3>
                      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Full Name</label>
                          <input
                            type="text"
                            value={formData?.name || ''}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Email</label>
                          <input
                            type="email"
                            value={formData?.email || ''}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Personal Information</h3>
                      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Age</label>
                          <input
                            type="number"
                            value={formData?.age || ''}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Gender</label>
                          <input
                            type="text"
                            value={formData?.gender || ''}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Work Radius</label>
                          <input
                            type="text"
                            value={`${formData?.workRadius || 10} km`}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Availability Status</label>
                          <input
                            type="text"
                            value={formData?.isAvailable ? 'Available for Work' : 'Not Available'}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={() => navigate('/worker/profile/edit')}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkerProfile;
