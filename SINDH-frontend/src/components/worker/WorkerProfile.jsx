import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  User, Award, MapPin, FileText, Phone, Mail, Calendar,
  Edit, Settings, Briefcase, TrendingUp,
  CheckCircle, AlertCircle, Eye, Clock, Star,
  Loader, RefreshCw, ArrowLeft, Languages, DollarSign, Shield
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiUtils';
import { useUser } from '../../context/UserContext';

const WorkerProfile = ({ workerId, workerData: propWorkerData }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const location = useLocation();

  // Add useUser hook
  const { user } = useUser();

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

  const [balance, setBalance] = useState(0); // Total Balance
  const [withdrawable, setWithdrawable] = useState(0); // Available to withdraw
  const [earnings, setEarnings] = useState([]);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [completedJobs, setCompletedJobs] = useState([]); // Add completed jobs state
  const [applications, setApplications] = useState([]); // Add applications state
  const [loadingApplications, setLoadingApplications] = useState(false); // Add loading state for applications

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
      {
        name: 'localStorage.user', data: (() => {
          try { return JSON.parse(localStorage.getItem('user')); }
          catch (e) { return null; }
        })()
      },
      {
        name: 'localStorage.worker', data: (() => {
          try { return JSON.parse(localStorage.getItem('worker')); }
          catch (e) { return null; }
        })()
      }
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

      const response = await fetch(`${getApiUrl()}/workers/${workerId}`, {
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
      await fetchWorkerApplications(workerId); // Fetch applications here

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
      const response = await fetch(`${getApiUrl()}/workers/${workerId}/stats`, {
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

  // Fetch worker applications
  const fetchWorkerApplications = async (workerId) => {
    if (!workerId) return;

    setLoadingApplications(true);
    try {
      const response = await fetch(`${getApiUrl()}/jobs/worker/${workerId}/accepted-jobs`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'worker',
          'User-ID': workerId
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
        console.log('Fetched applications:', data);
      } else {
        console.error('Failed to fetch applications:', response.status);
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  // Fetch financial data and completed jobs
  const fetchFinancials = useCallback(async () => {
    const currentUser = user || getUserData();
    if (!currentUser?.id) return;

    setLoadingFinancials(true);
    try {
      console.log('Fetching wallet data for worker:', currentUser.id);

      // Fetch wallet data using the updated API
      const walletResponse = await fetch(getApiUrl(`/api/workers/${currentUser.id}/wallet`));
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        console.log('Wallet data received:', walletData);

        setBalance(walletData.balance || 0); // Maps to totalBalance from backend
        setWithdrawable(walletData.withdrawableBalance || 0);
        setEarnings(walletData.transactions?.filter(t => t.type === 'earning') || []);
      }

      // Fetch completed jobs for detailed view
      const completedResponse = await fetch(getApiUrl(`/api/jobs/worker/${currentUser.id}/completed`));
      if (completedResponse.ok) {
        const completedData = await completedResponse.json();
        setCompletedJobs(completedData.data || []);
      }
    } catch (error) {
      console.error('Error fetching financials:', error);
    } finally {
      setLoadingFinancials(false);
    }
  }, [user, getUserData]);

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
        fetchFinancials();
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
          fetchFinancials();
          fetchWorkerStats(workerId);
          fetchWorkerApplications(workerId);
        }
      } catch (error) {
        setError(error.message);

        const userData = getUserData();
        if (userData && userData.name) {
          console.log('Using cached data as fallback');
          populateFormData(userData);
          fetchFinancials();
          fetchWorkerStats(workerId);
          fetchWorkerApplications(workerId);
        }
      }
    };

    initializeProfile();
  }, [workerId, propWorkerData, fetchWorkerProfile, getWorkerId, populateFormData, getUserData, fetchFinancials]);

  // Listen for application submission events
  useEffect(() => {
    const handleApplicationSubmitted = (event) => {
      console.log('🔄 Application submitted event received in WorkerProfile:', event.detail);
      const workerId = getWorkerId();
      if (workerId) {
        fetchWorkerApplications(workerId);
        fetchWorkerStats(workerId);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'refreshApplications' && e.newValue === 'true') {
        console.log('🔄 Storage event triggered in WorkerProfile - refreshing applications');
        localStorage.removeItem('refreshApplications');
        const workerId = getWorkerId();
        if (workerId) {
          fetchWorkerApplications(workerId);
          fetchWorkerStats(workerId);
        }
      }
    };

    window.addEventListener('applicationSubmitted', handleApplicationSubmitted);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('applicationSubmitted', handleApplicationSubmitted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [getWorkerId, fetchWorkerApplications, fetchWorkerStats]);

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

  // Unused functions removed to fix linting warnings
  /*
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
          const response = await fetch(`${getApiUrl()}/workers/${userId}`, {
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
  */

  // Helper functions
  const getInitials = (name) => {
    if (!name) return 'WR';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  /*
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
  */

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

  // Shared top-right controls like Homepage
  const TopRightControls = ({ i18n, navigate }) => {
    const [lang, setLang] = useState(() => localStorage.getItem('homeLang') || 'EN');
    const isHindi = lang === 'HI';
    const toggleLang = () => {
      const next = isHindi ? 'EN' : 'HI';
      setLang(next);
      localStorage.setItem('homeLang', next);
      i18n.changeLanguage(next.toLowerCase());
    };
    return (
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-3 z-30">
        <button
          onClick={toggleLang}
          className="px-3 py-1.5 rounded-xl text-sm font-black bg-white/50 backdrop-blur-md border border-[#3B4883]/10 text-[#3B4883] hover:bg-[#3B4883]/5 shadow-sm transition-all"
        >
          {isHindi ? 'HI' : 'EN'}
        </button>
        <button
          onClick={() => navigate('/home')}
          className="p-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-[#3B4883]/10 text-[#3B4883] hover:bg-[#3B4883]/5 shadow-sm transition-all"
        >
          <User className="w-5 h-5" />
        </button>
      </div>
    );
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
    <div className="min-h-screen bg-white relative overflow-hidden py-12 px-4 devanagari">
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)',
          }}
        />
        <div
          className="absolute top-20 right-10 w-[300px] h-[300px] rounded-full opacity-20"
          style={{ background: '#E8DFD5', filter: 'blur(80px)' }}
        />
        <div
          className="absolute bottom-40 left-20 w-[200px] h-[200px] rounded-full opacity-30"
          style={{ background: '#DBBBA7', filter: 'blur(80px)' }}
        />
      </div>
      {/* Top-right controls: language + hamburger */}
      <TopRightControls i18n={i18n} navigate={navigate} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-10">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-white/50 backdrop-blur-md border border-[#3B4883]/10 rounded-xl font-bold text-[#3B4883] hover:bg-[#3B4883]/5 transition-all flex items-center shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-6 py-2.5 bg-[#3B4883] text-white rounded-xl hover:bg-[#272D4E] transition-all shadow-lg disabled:opacity-50 text-sm font-bold"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Profile'}
              </button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-6xl font-extrabold text-[#3B4883] mb-4 tracking-tight">SINDH</h1>
            <h2 className="text-3xl font-bold text-[#202124] mb-2 uppercase tracking-wide">Worker Profile</h2>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-10 h-1.5 bg-[#FF7124] rounded-full"></div>
              <span className="text-[#202124]/60 font-bold uppercase tracking-widest text-xs">Verify your information</span>
            </div>
          </div>
        </motion.div>

        {/* Profile Header Card - glass theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="rounded-3xl overflow-hidden bg-white border border-[#3B4883]/10 shadow-2xl relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <User className="w-48 h-48 text-[#3B4883]" />
            </div>

            <div className="p-8 sm:p-10 relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-10">
                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#FF7124] to-[#e66420] rounded-3xl flex items-center justify-center text-white text-5xl font-black shadow-2xl p-6 rotate-3">
                    {getInitials(formData?.name)}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-[#3B4883] mb-2">{formData?.name}</h2>
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                      <p className="px-4 py-1 bg-[#3B4883]/5 text-[#3B4883] text-sm font-black rounded-lg border border-[#3B4883]/10">{formData?.preferredCategory} Expert</p>
                      <div className="flex items-center text-[#202124]/60 font-bold text-sm">
                        <MapPin className="w-4 h-4 mr-1 text-[#FF7124]" />
                        {formatLocation(formData?.location)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#3B4883]/5 border border-[#3B4883]/10 rounded-3xl p-6 text-center min-w-[180px]">
                  <div className="text-4xl font-black text-[#FF7124] mb-1">{shaktiScore}</div>
                  <div className="text-[#3B4883]/60 text-[10px] font-black uppercase tracking-widest">Shakti Score</div>
                  <div className="mt-2 text-[10px] text-green-600 font-bold">Top 5% in your area</div>
                </div>
              </div>

              {/* Eligibility Indicators - Mobile responsive grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {[
                  { label: 'Identity', val: formData?.verificationStatus === 'verified' ? 'Verified' : 'Pending', icon: Shield, status: formData?.verificationStatus === 'verified' ? 'success' : 'warning' },
                  { label: 'Skills', val: `${formData?.skills?.length || 0} Listed`, icon: Award, status: 'info' },
                  { label: 'Status', val: formData?.isAvailable ? 'Available' : 'Busy', icon: Clock, status: formData?.isAvailable ? 'success' : 'error' },
                  { label: 'Rating', val: `${formData?.rating?.average?.toFixed(1) || '5.0'} ⭐`, icon: Star, status: 'info' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#3B4883]/5 border border-[#3B4883]/10 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-xl group">
                    <div className="flex items-center justify-between mb-3">
                      <item.icon className="w-6 h-6 text-[#FF7124] group-hover:scale-110 transition-transform" />
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${item.status === 'success' ? 'bg-green-100 text-green-700' :
                        item.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                          item.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {item.val}
                      </span>
                    </div>
                    <p className="text-[#3B4883]/40 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{item.label}</p>
                    <p className="text-[#3B4883] font-bold text-sm truncate">{item.val}</p>
                  </div>
                ))}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 p-1.5 bg-[#3B4883]/5 rounded-3xl border border-[#3B4883]/10">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-[#3B4883] text-white shadow-xl translate-y-[-2px]'
                    : 'text-[#3B4883]/40 hover:text-[#3B4883] hover:bg-white'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#FF7124]' : ''}`} />
                  <span className="hidden md:inline">{tab.label}</span>
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
                  <div className="bg-white rounded-3xl border border-[#3B4883]/10 p-8 shadow-xl">
                    <h3 className="text-xl font-extrabold text-[#3B4883] mb-6 flex items-center">
                      <div className="w-10 h-10 bg-[#FF7124]/10 rounded-xl flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-[#FF7124]" />
                      </div>
                      About Me
                    </h3>
                    <p className="text-[#202124]/70 leading-relaxed mb-8 font-medium">
                      {formData?.bio || 'No bio provided yet. Update your profile to tell employers about your experience.'}
                    </p>

                    {/* Profile Completion */}
                    <div className="bg-[#3B4883]/5 rounded-2xl p-6 border border-[#3B4883]/5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-[#3B4883] uppercase tracking-widest leading-none">Profile Completion</span>
                        <span className="text-lg font-black text-[#FF7124]">{formData?.profileCompletionPercentage || 85}%</span>
                      </div>
                      <div className="w-full bg-[#3B4883]/10 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${formData?.profileCompletionPercentage || 85}%` }}
                          className="bg-gradient-to-r from-[#FF7124] to-[#e66420] h-3 rounded-full shadow-lg"
                        ></motion.div>
                      </div>
                      <p className="text-[10px] text-[#202124]/40 font-bold mt-3 uppercase tracking-widest">Complete your profile to get more job opportunities</p>
                    </div>
                  </div>

                  {/* Professional Details */}
                  <div className="bg-white rounded-3xl border border-[#3B4883]/10 p-8 shadow-xl">
                    <h3 className="text-xl font-extrabold text-[#3B4883] mb-6 flex items-center">
                      <div className="w-10 h-10 bg-[#3B4883]/5 rounded-xl flex items-center justify-center mr-3">
                        <Award className="w-5 h-5 text-[#3B4883]" />
                      </div>
                      Professional Details
                    </h3>
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-[#202124]/40 mb-3 uppercase tracking-widest">Skills & Expertise</h4>
                        <div className="flex flex-wrap gap-2">
                          {formData?.skills?.map(skill => (
                            <span key={skill} className="px-4 py-2 bg-white border-2 border-[#3B4883]/5 text-[#3B4883] text-xs font-black uppercase tracking-widest rounded-xl hover:border-[#FF7124]/30 transition-colors cursor-default">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="bg-[#3B4883]/5 p-5 rounded-2xl border border-[#3B4883]/5">
                          <h4 className="text-[10px] font-black text-[#202124]/40 mb-2 uppercase tracking-widest">Experience Level</h4>
                          <p className="text-[#3B4883] font-black text-lg">{formData?.experience}</p>
                        </div>
                        <div className="bg-[#3B4883]/5 p-5 rounded-2xl border border-[#3B4883]/5">
                          <h4 className="text-[10px] font-black text-[#202124]/40 mb-2 uppercase tracking-widest">Expected Salary</h4>
                          <p className="text-[#FF7124] font-black text-lg">{formData?.expectedSalary}</p>
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
                        <span className="text-green-600 font-bold">{applications.length || stats.totalApplications}</span>
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

                  {/* Enhanced Financial Summary Section */}
                  <div className="bg-white rounded-3xl border border-[#3B4883]/10 overflow-hidden shadow-xl">
                    <div className="bg-[#3B4883] p-8 text-white relative">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <DollarSign className="w-20 h-20" />
                      </div>
                      <div className="relative z-10 text-center">
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Projected Total Balance</p>
                        <p className="text-5xl font-black mb-3">₹{balance.toLocaleString()}</p>

                        <div className="flex flex-col items-center gap-2">
                          <div className="inline-flex items-center px-4 py-1.5 bg-white/20 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                            <CheckCircle className="w-3 h-3 mr-2 text-white" />
                            Available: ₹{withdrawable.toLocaleString()}
                          </div>

                          {balance > withdrawable && (
                            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                              (₹{(balance - withdrawable).toLocaleString()} Pending Completion)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{completedJobs.length}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Jobs Completed</div>
                      </div>

                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                          ₹{completedJobs.reduce((sum, job) => sum + (job.application?.paymentAmount || job.job?.salary || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Total Earned</div>
                      </div>

                      <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                        <Award className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-600" />
                        <div className="text-lg sm:text-2xl font-bold text-purple-600">
                          {completedJobs.filter(job => job.application?.paymentStatus === 'paid').length}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Payments Received</div>
                      </div>

                      <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg">
                        <Star className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-yellow-600" />
                        <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                          {completedJobs.length > 0 ? (4.5).toFixed(1) : '0.0'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Average Rating</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Completed Jobs */}
                  {completedJobs.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                          Recent Completed Jobs
                        </span>
                        <button
                          onClick={() => navigate('/my-applications')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View All
                        </button>
                      </h3>

                      <div className="space-y-3 sm:space-y-4">
                        {completedJobs.slice(0, 3).map((item) => (
                          <div key={item._id} className="border border-green-200 rounded-lg p-3 sm:p-4 bg-green-50">
                            {/* Job Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                  {item.job?.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">
                                  {item.job?.companyName}
                                </p>
                              </div>
                              <div className="flex items-center ml-2">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Completed
                                </span>
                                <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-200 text-green-800">
                                  {item.application?.paymentStatus === 'paid' ? '💰 Paid' : '⏳ Pending'}
                                </span>
                              </div>
                            </div>

                            {/* Job Details */}
                            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                <span className="truncate">
                                  {item.job?.location?.city}, {item.job?.location?.state}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                <span>Completed: {new Date(item.application?.completedAt || item.application?.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Payment Info */}
                            <div className="flex justify-between items-center pt-2 border-t border-green-200">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.job?.category}
                              </span>
                              <div className="text-right">
                                <div className="text-base sm:text-lg font-bold text-green-600">
                                  +₹{(item.application?.paymentAmount || item.job?.salary || 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">Earned</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Earnings History Table - Condensed Version */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                      <span>Earnings History</span>
                      {earnings.length > 5 && (
                        <button
                          onClick={() => navigate('/my-applications')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View All
                        </button>
                      )}
                    </h3>

                    {loadingFinancials ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : earnings.length > 0 ? (
                      <div className="space-y-2">
                        {earnings.slice(-5).reverse().map((earning, index) => (
                          <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {earning.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(earning.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-sm font-semibold text-green-600 ml-2">
                              +₹{earning.amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">No earnings yet. Complete jobs to start earning!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="bg-white rounded-3xl border border-[#3B4883]/10 p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-[#3B4883] uppercase tracking-wide">My Applications</h3>
                  <button
                    onClick={() => navigate('/my-applications')}
                    className="text-sm font-black text-[#FF7124] hover:text-[#e66420] uppercase tracking-widest"
                  >
                    View All
                  </button>
                </div>

                {loadingApplications ? (
                  <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-[#FF7124]/20 border-t-[#FF7124] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#3B4883]/60 font-medium">Loading applications...</p>
                  </div>
                ) : applications.length > 0 ? (
                  <div className="space-y-6">
                    {applications.slice(0, 5).map((application) => (
                      <div key={application._id} className="bg-white border-2 border-[#3B4883]/5 rounded-3xl p-6 hover:border-[#FF7124]/30 transition-all shadow-md group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <h4 className="text-xl font-black text-[#3B4883] mb-1 group-hover:text-[#FF7124] transition-colors">
                              {application.job?.title || 'Job Title Not Available'}
                            </h4>
                            <p className="text-[#202124]/60 font-bold uppercase tracking-wider text-xs">
                              {application.job?.companyName || application.employer?.name || 'Company Not Available'}
                            </p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${application.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              application.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                application.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                                  application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                            }`}>
                            {application.status === 'pending' ? '⏳ Pending' :
                              application.status === 'accepted' ? '✅ Accepted' :
                                application.status === 'in-progress' ? '🔄 In Progress' :
                                  application.status === 'completed' ? '✅ Completed' :
                                    application.status === 'rejected' ? '❌ Rejected' :
                                      '❓ Unknown'}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#3B4883]/5 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-[#FF7124]" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-[#202124]/40 uppercase tracking-widest leading-none">Salary</p>
                              <p className="text-[#3B4883] font-bold text-sm">
                                ₹{application.job?.salary?.toLocaleString() || '0'}
                                <span className="text-[10px] opacity-60">/{application.job?.employmentType === 'Full-time' ? 'mo' : 'day'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#3B4883]/5 rounded-lg flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-[#3B4883]" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-[#202124]/40 uppercase tracking-widest leading-none">Location</p>
                              <p className="text-[#3B4883] font-bold text-sm truncate max-w-[120px]">
                                {application.job?.location?.city || 'Remote'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#3B4883]/5 rounded-lg flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-[#3B4883]" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-[#202124]/40 uppercase tracking-widest leading-none">Category</p>
                              <p className="text-[#3B4883] font-bold text-sm">
                                {application.job?.category || 'General'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#3B4883]/5 rounded-lg flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-[#3B4883]" />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-[#202124]/40 uppercase tracking-widest leading-none">Applied Date</p>
                              <p className="text-[#3B4883] font-bold text-sm">
                                {new Date(application.createdAt || application.appliedAt || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-[#3B4883]/5">
                          <button
                            onClick={() => window.location.href = `/jobs/${application.job?._id}`}
                            className="flex-1 px-6 py-3 bg-[#3B4883]/5 text-[#3B4883] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3B4883]/10 transition-all"
                          >
                            View Details
                          </button>

                          {application.status === 'accepted' && (
                            <button
                              onClick={() => window.location.href = `/chat/${application._id}`}
                              className="flex-1 px-6 py-3 bg-[#FF7124] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#e66420] shadow-lg transition-all"
                            >
                              Chat with Employer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {applications.length > 5 && (
                      <div className="text-center pt-8">
                        <button
                          onClick={() => navigate('/my-applications')}
                          className="px-8 py-3 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                        >
                          View All {applications.length} Applications &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-24">
                    <div className="w-24 h-24 bg-[#3B4883]/5 rounded-full flex items-center justify-center mx-auto mb-8">
                      <Briefcase className="w-10 h-10 text-[#3B4883]/20" />
                    </div>
                    <h3 className="text-2xl font-black text-[#3B4883] mb-2 uppercase">No Applications Yet</h3>
                    <p className="text-[#202124]/60 font-medium mb-10 max-w-sm mx-auto">
                      You haven't applied for any jobs yet. Start your journey by finding a job that fits your skills.
                    </p>
                    <button
                      onClick={() => navigate('/worker/find-work')}
                      className="px-12 py-4 bg-[#FF7124] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#e66420] transition-all"
                    >
                      Search for Work
                    </button>
                  </div>
                )}
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
      <style>{`
        .devanagari { font-family: 'Noto Sans Devanagari', 'Inter', sans-serif; }
        .form-input-custom {
          width: 100%;
          padding: 1rem 1.25rem;
          background-color: white;
          border: 2px solid rgba(59, 72, 131, 0.1);
          border-radius: 1.25rem;
          font-weight: 600;
          transition: all 0.2s;
          outline: none;
          color: #202124;
        }
      `}</style>
    </div>
  );
};

export default WorkerProfile;
