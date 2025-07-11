import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building, MapPin, FileText, Phone, Mail, Award, Calendar, 
  Edit, Settings, Briefcase, Star, ChevronRight, TrendingUp, Users,
  Clock, CheckCircle, AlertCircle, Plus, Eye, MoreHorizontal, Globe,
  Loader, RefreshCw, ArrowLeft
} from 'lucide-react';
import { employerService } from '../../services/employerService';
import { UserContext } from '../../context/UserContext';
import toast from 'react-hot-toast';
import Logo from '../../assets/logo.svg';

const EmployerProfilePage = () => {
  const { user } = useContext(UserContext);
  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [postedJobs, setPostedJobs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    website: '',
    businessType: '',
    industry: '',
    village: '',
    district: '',
    state: '',
    pincode: ''
  });
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalApplications: 0
  });

  // API URL helper function
  const getApiUrl = (endpoint) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'https://sindh-backend.onrender.com';
    return `${baseUrl}${endpoint}`;
  };

  // Get employer ID from various sources
  const getEmployerId = () => {
    // Try to get from localStorage
    const storedUser = localStorage.getItem('user');
    const storedEmployer = localStorage.getItem('employer');
    const storedEmployerId = localStorage.getItem('employerId');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.type === 'employer' && (user.id || user._id)) {
          return user.id || user._id;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    if (storedEmployer) {
      try {
        const employer = JSON.parse(storedEmployer);
        if (employer._id || employer.id) {
          return employer._id || employer.id;
        }
      } catch (e) {
        console.error('Error parsing stored employer:', e);
      }
    }
    
    if (storedEmployerId) {
      return storedEmployerId;
    }
    
    return null;
  };

  // Fetch employer profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      const employerId = getEmployerId();
      
      // Check if employer ID exists
      if (!employerId) {
        console.error('Employer ID is not available');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Fetching profile for employer ID:', employerId);
      console.log('🌐 API URL:', getApiUrl(`/api/employers/${employerId}`));
      
      const response = await fetch(getApiUrl(`/api/employers/${employerId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-type': 'employer', // Important: Backend checks this header
          'User-Type': 'employer'
        }
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`Failed to fetch profile: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Profile data received:', data);
      
      setEmployerData(data);
      setFormData({
        name: data.name || '',
        companyName: data.company?.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.location?.address || `${data.location?.village || ''}, ${data.location?.district || ''}, ${data.location?.state || ''} - ${data.location?.pincode || ''}`.trim(),
        description: data.businessDescription || '',
        website: data.website || '',
        businessType: data.company?.type || '',
        industry: data.company?.industry || '',
        village: data.location?.village || '',
        district: data.location?.district || '',
        state: data.location?.state || '',
        pincode: data.location?.pincode || ''
      });
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      toast.error(`Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch posted jobs
  const fetchPostedJobs = async (employerId) => {
    try {
      console.log('🔍 Fetching posted jobs for employer ID:', employerId);
      console.log('🌐 API URL:', getApiUrl(`/api/jobs/employer/${employerId}`));
      
      const response = await fetch(getApiUrl(`/api/jobs/employer/${employerId}`), {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'employer',
          'User-ID': employerId
        }
      });
      
      console.log('📡 Posted jobs response status:', response.status);
      
      if (response.ok) {
        const jobs = await response.json();
        console.log('✅ Posted jobs received:', jobs);
        console.log('📊 Jobs count:', jobs.length);
        console.log('📊 Jobs with applications:', jobs.filter(job => job.applications?.length > 0).length);
        
        setPostedJobs(jobs);
        
        // Log each job's details for debugging
        jobs.forEach((job, index) => {
          console.log(`Job ${index + 1}:`, {
            title: job.title,
            status: job.status,
            applications: job.applications?.length || 0
          });
        });
      } else {
        console.error('❌ Failed to fetch posted jobs:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching posted jobs:', error);
    }
  };

  // Fetch employer statistics
  const fetchEmployerStats = async (employerId) => {
    try {
      // First try to get stats from the API
      const response = await fetch(getApiUrl(`/api/employers/${employerId}/stats`), {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'employer',
          'User-ID': employerId
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
        console.log('Employer stats from API:', statsData);
      } else {
        // If API fails, calculate stats from posted jobs
        console.log('API stats failed, calculating from posted jobs...');
        calculateStatsFromJobs();
      }
    } catch (error) {
      console.error('Error fetching employer stats:', error);
      // Fallback to calculating from posted jobs
      calculateStatsFromJobs();
    }
  };

  // Calculate stats from posted jobs as fallback
  const calculateStatsFromJobs = () => {
    console.log('🔄 Calculating stats from posted jobs...');
    console.log('📊 Posted jobs array:', postedJobs);
    
    if (postedJobs.length > 0) {
      const totalJobs = postedJobs.length;
      const activeJobs = postedJobs.filter(job => job.status === 'active').length;
      const completedJobs = postedJobs.filter(job => job.status === 'completed').length;
      const totalApplications = postedJobs.reduce((total, job) => {
        const jobApplications = job.applications?.length || 0;
        console.log(`Job "${job.title}" has ${jobApplications} applications`);
        return total + jobApplications;
      }, 0);

      const calculatedStats = {
        totalJobs,
        activeJobs,
        completedJobs,
        totalApplications
      };

      console.log('✅ Calculated stats from jobs:', calculatedStats);
      console.log('📊 Breakdown:');
      console.log(`  - Total jobs: ${totalJobs}`);
      console.log(`  - Active jobs: ${activeJobs}`);
      console.log(`  - Completed jobs: ${completedJobs}`);
      console.log(`  - Total applications: ${totalApplications}`);
      
      setStats(calculatedStats);
    } else {
      console.log('⚠️ No posted jobs available for stats calculation');
    }
  };

  // Main fetch function that combines all data fetching
  const fetchEmployerProfile = async (employerId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profile data
      await fetchProfile();
      
      // Fetch posted jobs first
      await fetchPostedJobs(employerId);
      
      // Then fetch stats (which will fallback to calculating from jobs if needed)
      await fetchEmployerStats(employerId);
      
    } catch (error) {
      console.error('Error fetching employer profile:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    const employerId = getEmployerId();
    if (!employerId) {
      setError('No employer ID found. Please log in again.');
      return;
    }
    
    setRefreshing(true);
    await fetchEmployerProfile(employerId);
    setRefreshing(false);
    toast.success('Profile refreshed!');
  };

  // Initialize component
  useEffect(() => {
    const employerId = getEmployerId();
    
    if (!employerId) {
      setError('No employer ID found. Please log in again.');
      setLoading(false);
      return;
    }
    
    fetchEmployerProfile(employerId);
  }, []);

  // Recalculate stats when postedJobs changes
  useEffect(() => {
    if (postedJobs.length > 0 && stats.totalJobs === 0) {
      console.log('Recalculating stats from posted jobs...');
      calculateStatsFromJobs();
    }
  }, [postedJobs]);

  // Helper functions
  const getInitials = (name) => {
    if (!name) return 'ER';
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
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center p-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center max-w-sm sm:max-w-md w-full"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-[#ff6b35] border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg sm:text-xl font-semibold text-[#222] mb-2">Loading Profile</h3>
          <p className="text-sm sm:text-base text-[#666]">Fetching your employer profile data...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center p-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center max-w-sm sm:max-w-md w-full"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#222] mb-2">Profile Error</h3>
          <p className="text-sm sm:text-base text-[#666] mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full px-6 py-3 bg-[#ff6b35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium disabled:opacity-50 text-sm sm:text-base touch-manipulation"
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
              onClick={() => window.location.href = '/employer/register'}
              className="w-full px-6 py-3 bg-[#222] text-white rounded-lg hover:bg-[#333] transition-colors font-medium text-sm sm:text-base touch-manipulation"
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
    { id: 'jobs', label: 'Job Posts', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fa]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header with Logo and refresh button - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 sm:mb-8"
        >
          <div className="flex items-center">
            <button 
              onClick={() => window.history.back()}
              className="mr-2 sm:mr-4 p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200 touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#666]" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              {Logo ? (
                <img src={Logo} alt="Logo" className="h-6 sm:h-8 md:h-10" style={{ maxWidth: 80 }} />
              ) : (
                <span className="text-lg sm:text-xl font-bold tracking-wide text-[#222]">LOGO</span>
              )}
              <span className="text-sm sm:text-lg md:text-xl font-extrabold tracking-widest text-[#222]">I N D U S</span>
            </div>
            <span className="text-sm sm:text-lg font-semibold text-[#ff6b35] ml-2 sm:ml-4 hidden sm:inline">Employer Profile</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 sm:px-4 py-2 bg-white text-[#222] rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 text-sm sm:text-base touch-manipulation"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </motion.div>

        {/* Profile Header Card - Mobile Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-6 sm:mb-8"
        >
          {/* Cover Photo */}
          <div className="h-20 sm:h-32 bg-gradient-to-r from-[#ff6b35] via-[#e55a2b] to-[#d4491f] relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>

          {/* Profile Content */}
          <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Profile Picture - Responsive sizing */}
            <div className="absolute -top-8 sm:-top-12 left-4 sm:left-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-xl">
                    {getInitials(employerData?.name)}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Badge - Mobile friendly */}
            <div className="absolute -top-4 sm:-top-6 right-4 sm:right-6 bg-[#ff6b35] text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center shadow-lg">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {employerData?.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
            </div>

            {/* Profile Info - Mobile optimized layout */}
            <div className="pt-10 sm:pt-16">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-1 sm:mb-2">
                    {employerData?.name}
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-[#ff6b35] font-medium mb-2 sm:mb-3">
                    {employerData?.company?.name}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                    <span className="px-2 sm:px-4 py-1 sm:py-2 bg-[#ff6b35]/10 text-[#ff6b35] rounded-lg text-xs sm:text-sm font-medium">
                      {employerData?.company?.type}
                    </span>
                    <span className="px-2 sm:px-4 py-1 sm:py-2 bg-[#222]/10 text-[#222] rounded-lg text-xs sm:text-sm font-medium">
                      {employerData?.company?.industry}
                    </span>
                    <span className="px-2 sm:px-4 py-1 sm:py-2 bg-[#ff6b35]/10 text-[#ff6b35] rounded-lg text-xs sm:text-sm font-medium flex items-center">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Employer
                    </span>
                  </div>
                  
                  <div className="flex items-center text-[#666] mb-3 sm:mb-4 text-sm sm:text-base">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="truncate">{formatLocation(employerData?.location)}</span>
                  </div>
                  
                  <div className="flex items-center text-[#666] text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Member since {formatDate(employerData?.registrationDate)}
                  </div>
                </div>
                
                <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-[#ff6b35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium flex items-center justify-center text-sm sm:text-base touch-manipulation">
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Edit Profile
                </button>
              </div>

              {/* Stats Row - Mobile responsive grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 py-4 sm:py-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-[#222]">{stats.totalJobs}</div>
                  <div className="text-xs sm:text-sm text-[#666]">Total Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-[#222]">{stats.activeJobs}</div>
                  <div className="text-xs sm:text-sm text-[#666]">Active Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-[#222]">{stats.totalApplications}</div>
                  <div className="text-xs sm:text-sm text-[#666]">Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-[#222]">
                    {employerData?.rating?.average ? `⭐ ${employerData.rating.average.toFixed(1)}` : '⭐ New'}
                  </div>
                  <div className="text-xs sm:text-sm text-[#666]">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs - Mobile optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 flex items-center justify-center px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#ff6b35] text-white shadow-sm'
                      : 'text-[#666] hover:text-[#222] hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
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
              <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                  {/* About Section */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 sm:mb-4 flex items-center">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#ff6b35]" />
                      About Business
                    </h3>
                    <p className="text-[#666] leading-relaxed text-sm sm:text-base">
                      {employerData?.businessDescription || 'No business description provided yet.'}
                    </p>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 sm:mb-4 flex items-center">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#ff6b35]" />
                      Recent Job Posts
                    </h3>
                    {postedJobs.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {postedJobs.slice(0, 3).map((job, index) => (
                          <motion.div
                            key={job._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-[#ff6b35] transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-[#222] text-sm sm:text-base truncate">{job.title}</h4>
                                <p className="text-xs sm:text-sm text-[#666] mt-1 line-clamp-2">{job.description?.substring(0, 100)}...</p>
                                <div className="flex items-center mt-2 text-xs text-[#666]">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(job.createdAt)}
                                </div>
                              </div>
                              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                job.status === 'active' 
                                  ? 'bg-[#ff6b35]/10 text-[#ff6b35]'
                                  : job.status === 'closed'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        {postedJobs.length > 3 && (
                          <button
                            onClick={() => setActiveTab('jobs')}
                            className="w-full text-center py-3 text-[#ff6b35] hover:text-[#e55a2b] font-medium text-sm sm:text-base touch-manipulation"
                          >
                            View all {postedJobs.length} job posts
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                        <h4 className="text-base sm:text-lg font-medium text-[#222] mb-2">No job posts yet</h4>
                        <p className="text-[#666] mb-4 sm:mb-6 text-sm sm:text-base px-4">Start by posting your first job to attract skilled workers</p>
                        <button 
                          onClick={() => window.location.href = '/employer/post-job'}
                          className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-[#ff6b35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium text-sm sm:text-base touch-manipulation"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Post Your First Job
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Contact Information */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 sm:mb-4 flex items-center">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#ff6b35]" />
                      Contact Information
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-[#666]" />
                        <span className="text-[#222] text-sm sm:text-base truncate">{employerData?.phone}</span>
                      </div>
                      <div className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-[#666]" />
                        <span className="text-[#222] text-sm sm:text-base truncate">{employerData?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 sm:mb-4">Verification Status</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#666] text-sm sm:text-base">Email Verified</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666] text-sm sm:text-base">Phone Verified</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666] text-sm sm:text-base">Aadhar Verified</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666] text-sm sm:text-base">Profile Complete</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff6b35]" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 sm:mb-4">Quick Actions</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <button 
                        onClick={() => window.location.href = '/employer/post-job'}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
                      >
                        <div className="flex items-center">
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-[#ff6b35]" />
                          <span className="text-sm sm:text-base">Post New Job</span>
                        </div>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors touch-manipulation">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-[#ff6b35]" />
                          <span className="text-sm sm:text-base">View Applications</span>
                        </div>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors touch-manipulation">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-[#ff6b35]" />
                          <span className="text-sm sm:text-base">Find Workers</span>
                        </div>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
                
            {activeTab === 'jobs' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
                {postedJobs.length > 0 ? (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
                      <h2 className="text-xl sm:text-2xl font-semibold text-[#222]">Posted Jobs</h2>
                      <button 
                        onClick={() => window.location.href = '/employer/post-job'}
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#ff6b35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium text-sm sm:text-base touch-manipulation"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Post New Job
                      </button>
                    </div>
                    <div className="grid gap-4 sm:gap-6">
                      {postedJobs.map((job, index) => (
                        <motion.div
                          key={job._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-[#ff6b35] transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-2">{job.title}</h3>
                              <p className="text-[#666] text-sm sm:text-base line-clamp-3">{job.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap ${
                                job.status === 'active' 
                                  ? 'bg-[#ff6b35]/10 text-[#ff6b35]'
                                  : job.status === 'closed'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {job.status}
                              </span>
                              <button className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation">
                                <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-[#666] gap-2">
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="truncate">{formatLocation(job.location)}</span>
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                {job.applications?.length || 0} applications
                              </span>
                            </div>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {formatDate(job.createdAt)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16">
                    <Briefcase className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#222] mb-3 sm:mb-4">No Job Posts Yet</h3>
                    <p className="text-[#666] mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
                      Start connecting with skilled workers by posting your first job. It's quick and easy!
                    </p>
                    <button 
                      onClick={() => window.location.href = '/employer/post-job'}
                      className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-[#ff6b35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium text-sm sm:text-base touch-manipulation"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Create Your First Job Post
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
                <div className="text-center py-12 sm:py-16">
                  <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#222] mb-3 sm:mb-4">Analytics Coming Soon</h3>
                  <p className="text-[#666] mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
                    Get insights into your job posts, applications, and worker engagement.
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto">
                    <div className="bg-[#ff6b35]/10 p-3 sm:p-6 rounded-lg">
                      <h4 className="text-lg sm:text-2xl font-bold text-[#ff6b35]">{stats.totalJobs}</h4>
                      <p className="text-[#ff6b35] text-xs sm:text-base">Total Jobs</p>
                    </div>
                    <div className="bg-[#222]/10 p-3 sm:p-6 rounded-lg">
                      <h4 className="text-lg sm:text-2xl font-bold text-[#222]">{stats.activeJobs}</h4>
                      <p className="text-[#222] text-xs sm:text-base">Active Jobs</p>
                    </div>
                    <div className="bg-[#ff6b35]/10 p-3 sm:p-6 rounded-lg">
                      <h4 className="text-lg sm:text-2xl font-bold text-[#ff6b35]">{stats.totalApplications}</h4>
                      <p className="text-[#ff6b35] text-xs sm:text-base">Applications</p>
                    </div>
                    <div className="bg-[#222]/10 p-3 sm:p-6 rounded-lg">
                      <h4 className="text-lg sm:text-2xl font-bold text-[#222]">{stats.completedJobs}</h4>
                      <p className="text-[#222] text-xs sm:text-base">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#222] mb-4 sm:mb-6">Profile Settings</h2>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-medium text-[#222] mb-3 sm:mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#222] mb-2">Full Name</label>
                          <input
                            type="text"
                            value={employerData?.name || ''}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35] text-sm sm:text-base"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#222] mb-2">Email</label>
                          <input
                            type="email"
                            value={employerData?.email || ''}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35] text-sm sm:text-base"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-medium text-[#222] mb-3 sm:mb-4">Business Information</h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#222] mb-2">Business Name</label>
                          <input
                            type="text"
                            value={employerData?.company?.name || ''}
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35] text-sm sm:text-base"
                            readOnly
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#222] mb-2">Business Type</label>
                            <input
                              type="text"
                              value={employerData?.company?.type || ''}
                              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35] text-sm sm:text-base"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#222] mb-2">Industry</label>
                            <input
                              type="text"
                              value={employerData?.company?.industry || ''}
                              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6b35] focus:border-[#ff6b35] text-sm sm:text-base"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-[#ff6b35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors font-medium text-sm sm:text-base touch-manipulation">
                        Enable Editing
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

export default EmployerProfilePage;
