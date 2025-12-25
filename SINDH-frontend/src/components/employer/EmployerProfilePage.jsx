import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building, MapPin, FileText, Phone, Mail, Award, Calendar, 
  Edit, Settings, Briefcase, Star, ChevronRight, TrendingUp, Users,
  Clock, CheckCircle, AlertCircle, Plus, Eye, MoreHorizontal, Globe,
  Loader, RefreshCw, ArrowLeft
} from 'lucide-react';
import { employerService } from '../../services/employerService';
import { getApiUrl } from '../../utils/apiUtils';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LogoSVG from '../../assets/logo.svg';
import { logout as authLogout } from '../../utils/authUtils';

const EmployerProfilePage = () => {
  const { user, isLoadingUser, logoutUser } = useUser();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  
  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [postedJobs, setPostedJobs] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalApplications: 0
  });

  // Local language state (reuse homepage CSV approach)
  const [lang, setLang] = useState(() => (localStorage.getItem('homeLang') || 'EN'));
  const isHindi = lang === 'HI';
  const loadCsvResources = async (langCode) => {
    try {
      const code = (langCode || lang).toLowerCase();
      const res = await fetch(`/languages/${code}.csv`, { cache: 'no-cache' });
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      const bundle = {};
      for (const line of lines) {
        const [key, ...rest] = line.split(',');
        const value = rest.join(',').replace(/^"|"$/g, '');
        if (key) bundle[key.trim()] = value.trim();
      }
      if (Object.keys(bundle).length) {
        i18n.addResourceBundle(code, 'home', bundle, true, true);
      }
    } catch (_) {}
  };
  useEffect(() => {
    (async () => {
      await loadCsvResources(lang);
      i18n.changeLanguage(lang.toLowerCase());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggleLang = async () => {
    const next = isHindi ? 'EN' : 'HI';
    setLang(next);
    localStorage.setItem('homeLang', next);
    await loadCsvResources(next);
    i18n.changeLanguage(next.toLowerCase());
  };

  // Top-right menu
  const [showMenu, setShowMenu] = useState(false);

  // Fetch employer profile data
  const fetchEmployerProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user and user.id exist
      if (!user || !user.id) {
        console.error('User or user.id is not available');
        setError('No user logged in. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Fetching profile for employer ID:', user.id);
      console.log('🌐 API URL:', getApiUrl(`/api/employers/${user.id}`));
      
      const response = await fetch(getApiUrl(`/api/employers/${user.id}`), {
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
        if (response.status === 404) {
          throw new Error('Employer profile not found');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please log in as an employer.');
        } else {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          throw new Error(`Failed to fetch profile: ${response.status} ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log('✅ Profile data received:', data);
      
      setEmployerData(data);
      
      // Update localStorage with fresh data
      localStorage.setItem('employer', JSON.stringify(data));
      localStorage.setItem('employerId', data._id || data.id);
      
      // Fetch additional data only if user.id is available
      if (user?.id) {
      await Promise.all([
          fetchPostedJobs(user.id),
          fetchEmployerStats(user.id)
      ]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching employer profile:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch posted jobs
  const fetchPostedJobs = async (employerId) => {
    try {
      console.log('🔍 Fetching posted jobs for employer:', employerId);
      const response = await fetch(getApiUrl(`/api/employers/${employerId}/jobs`), {
        headers: {
          'Content-Type': 'application/json',
          'user-type': 'employer',
          'User-Type': 'employer'
        }
      });
      
      if (response.ok) {
        const jobs = await response.json();
        setPostedJobs(jobs);
        console.log('✅ Posted jobs fetched:', jobs);
        
        // Calculate stats from jobs
        const totalJobs = jobs.length;
        const activeJobs = jobs.filter(job => job.status === 'active' || job.status === 'open').length;
        const completedJobs = jobs.filter(job => job.status === 'completed').length;
        const totalApplications = jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
        
        setStats({
          totalJobs,
          activeJobs,
          completedJobs,
          totalApplications
        });
      } else {
        console.error('❌ Failed to fetch posted jobs:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching posted jobs:', error);
    }
  };

  // Fetch employer statistics (if available)
  const fetchEmployerStats = async (employerId) => {
    try {
      console.log('🔍 Fetching employer stats for:', employerId);
      // Note: This endpoint might not exist in backend, so we handle it gracefully
      const response = await fetch(getApiUrl(`/api/employers/${employerId}/stats`), {
        headers: {
          'Content-Type': 'application/json',
          'user-type': 'employer',
          'User-Type': 'employer'
        }
      });
      
      if (response.ok) {
        const statsData = await response.json();
        setStats(prevStats => ({ ...prevStats, ...statsData }));
        console.log('✅ Employer stats fetched:', statsData);
      } else {
        console.log('ℹ️ Stats endpoint not available, using calculated stats from jobs');
      }
    } catch (error) {
      console.log('ℹ️ Stats endpoint not available, using calculated stats from jobs');
      // This is not critical, so we don't show error to user
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!user || !user.id) {
      setError('No user logged in. Please log in again.');
      navigate('/login');
      return;
    }
    
    setRefreshing(true);
    await fetchEmployerProfile();
    setRefreshing(false);
    toast.success('Profile refreshed!');
  };

  // Initialize component
  useEffect(() => {
    console.log('🔍 EmployerProfilePage useEffect triggered');
    console.log('🔍 isLoadingUser:', isLoadingUser);
    console.log('🔍 user:', user);
    console.log('🔍 localStorage user:', localStorage.getItem('user'));
    console.log('🔍 localStorage employer:', localStorage.getItem('employer'));
    console.log('🔍 localStorage employerId:', localStorage.getItem('employerId'));
    
    // If user is not loaded yet, wait
    if (isLoadingUser) {
      console.log('⏳ User is still loading, waiting...');
      return;
    }
    
    // If user is null or not an employer, redirect to login
    if (!user || user.type !== 'employer') {
      console.log('❌ User is null or not employer, redirecting to login');
      console.log('❌ User data:', user);
      navigate('/login');
      return;
    }
    
    // If user exists but doesn't have an id, redirect to login
    if (!user.id) {
      console.error('❌ User exists but has no id:', user);
      navigate('/login');
      return;
    }
    
    console.log('✅ User validated, fetching employer profile for:', user);
    fetchEmployerProfile();
  }, [user, isLoadingUser, navigate, fetchEmployerProfile]);

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

  // User loading state (while UserContext loads user data)
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
          <div className="absolute inset-0 startrails" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-white/30 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-white mb-2">Loading User</h3>
          <p className="text-white/70">Checking your authentication...</p>
        </motion.div>
      </div>
  );
  }

  // Profile loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
          <div className="absolute inset-0 startrails" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-white/30 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-white mb-2">Loading Profile</h3>
          <p className="text-white/70">Fetching your employer profile data...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
          <div className="absolute inset-0 startrails" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Profile Error</h3>
          <p className="text-white/70 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full px-6 py-3 bg-white text-black rounded-lg hover:opacity-95 transition-colors font-medium disabled:opacity-50"
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
              className="w-full px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/15 transition-colors font-medium"
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
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
        <div className="absolute inset-0 startrails" />
      </div>

      {/* Top-right controls: language chip + menu */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-30">
        <button onClick={toggleLang} className="px-2.5 py-1 rounded-full text-xs md:text-sm bg-white/10 border border-white/15 text-white/90 hover:bg-white/15">{isHindi ? 'HI' : 'EN'}</button>
        <button onClick={() => setShowMenu(v=>!v)} className="p-2 md:p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors">
          <span className="block w-5 md:w-6 h-0.5 bg-white mb-1"></span>
          <span className="block w-4 md:w-5 h-0.5 bg-white mb-1"></span>
          <span className="block w-6 md:w-7 h-0.5 bg-white"></span>
        </button>
      </div>
      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-16 right-4 md:right-6 w-56 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-sm text-white z-40">
            <button onClick={() => navigate('/employer/profile')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">Profile</button>
            <button onClick={() => navigate('/employer/posted-jobs')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">Jobs</button>
            <button onClick={() => { authLogout(); logoutUser(); navigate('/'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">Logout</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header with refresh button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <img src={LogoSVG} alt="Logo" className="hidden sm:block w-10 h-10 md:w-12 md:h-12 filter invert brightness-0 drop-shadow" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-white">EMPLOYER PROFILE</h1>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 transition-colors shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </motion.div>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden mb-8 bg-white/5 border border-white/10 backdrop-blur-md"
        >
          {/* Cover Photo */}
          <div className="h-32 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-blue-500/40"></div>
          </div>

          {/* Profile Content */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 rounded-full p-1 shadow-lg bg-white/10 border border-white/20 backdrop-blur">
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {getInitials(employerData?.name)}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="absolute -top-6 right-6 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-lg">
              <CheckCircle className="w-4 h-4 mr-1" />
              {employerData?.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
            </div>

            {/* Profile Info */}
            <div className="pt-16">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {employerData?.name}
                  </h1>
                  <p className="text-xl text-white/80 font-medium mb-3">
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
                      Employer
                    </span>
                  </div>
                  
                  <div className="flex items-center text-white/70 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    {formatLocation(employerData?.location)}
                  </div>
                  
                  <div className="flex items-center text-white/60 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Member since {formatDate(employerData?.registrationDate)}
                  </div>
                </div>
                
                <button className="px-6 py-3 bg-white text-black rounded-lg hover:opacity-90 transition-colors font-medium flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-6 border-t border-white/10">
                {[{label:'Total Jobs', value: stats.totalJobs}, {label:'Active Jobs', value: stats.activeJobs}, {label:'Applications', value: stats.totalApplications}, {label:'Rating', value: employerData?.rating?.average ? `⭐ ${employerData.rating.average.toFixed(1)}` : '⭐ New'}].map((s) => (
                  <motion.div key={s.label} whileHover={{ y: -2 }} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-xs uppercase tracking-widest text-white/60">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 mb-8 bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
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
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* About Section */}
                  <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      About Business
                    </h3>
                    <p className="text-white/80 leading-relaxed">{employerData?.businessDescription || 'No business description provided yet.'}</p>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Recent Job Posts
                    </h3>
                    {postedJobs.length > 0 ? (
                      <div className="space-y-4">
                        {postedJobs.slice(0, 3).map((job, index) => (
                          <motion.div key={job._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="rounded-lg p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-white">{job.title}</h4>
                                <p className="text-sm text-white/70 mt-1">{job.description?.substring(0, 100)}...</p>
                                <div className="flex items-center mt-2 text-xs text-white/60">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(job.createdAt)}
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${job.status === 'active' ? 'bg-green-500/20 text-green-300' : job.status === 'closed' ? 'bg-white/10 text-white/70' : 'bg-blue-500/20 text-blue-300'}`}>
                                {job.status}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        {postedJobs.length > 3 && (
                          <button onClick={() => setActiveTab('jobs')} className="w-full text-center py-3 text-white/80 hover:text-white font-medium">
                            View all {postedJobs.length} job posts
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-white/30" />
                        <h4 className="text-lg font-medium text-white mb-2">No job posts yet</h4>
                        <p className="text-white/60 mb-6">Start by posting your first job to attract skilled workers</p>
                        <button className="inline-flex items-center px-6 py-3 bg-white text-black rounded-lg hover:opacity-95 transition-colors font-medium">
                          <Plus className="w-5 h-5 mr-2" />
                          Post Your First Job
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <Phone className="w-5 h-5 mr-3 text-white/70" />
                        <span className="text-white/90">{employerData?.phone}</span>
                      </div>
                      <div className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <Mail className="w-5 h-5 mr-3 text-white/70" />
                        <span className="text-white/90">{employerData?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-white mb-4">Verification Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Email Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Phone Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Aadhar Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Profile Complete</span>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 rounded-lg transition-colors">
                        <div className="flex items-center">
                          <Plus className="w-5 h-5 mr-3 text-white" />
                          <span className="text-white">Post New Job</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 rounded-lg transition-colors">
                        <div className="flex items-center">
                          <Eye className="w-5 h-5 mr-3 text-white" />
                          <span className="text-white">View Applications</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 rounded-lg transition-colors">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 mr-3 text-white" />
                          <span className="text-white">Find Workers</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="rounded-2xl p-8 bg-white/5 border border-white/10 backdrop-blur-md">
                {postedJobs.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-white">Posted Jobs</h2>
                      <button className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:opacity-95 transition-colors font-medium">
                        <Plus className="w-4 h-4 mr-2" />
                        Post New Job
                      </button>
                    </div>
                    <div className="grid gap-6">
                      {postedJobs.map((job, index) => (
                        <motion.div
                          key={job._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="rounded-lg p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                              <p className="text-white/80 mt-2">{job.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${job.status === 'active' ? 'bg-green-500/20 text-green-300' : job.status === 'closed' ? 'bg-white/10 text-white/70' : 'bg-blue-500/20 text-blue-300'}`}>
                                {job.status}
                              </span>
                              <button className="p-2 hover:bg-white/10 rounded-lg">
                                <MoreHorizontal className="w-4 h-4 text-white/60" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-white/60">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {formatLocation(job.location)}
                              </span>
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {job.applications?.length || 0} applications
                              </span>
                            </div>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(job.createdAt)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Briefcase className="w-20 h-20 mx-auto mb-6 text-white/30" />
                    <h3 className="text-2xl font-semibold text-white mb-4">No Job Posts Yet</h3>
                    <p className="text-white/60 mb-8 max-w-md mx-auto">Start connecting with skilled workers by posting your first job. It's quick and easy!</p>
                    <button className="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg hover:opacity-95 transition-colors font-medium">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Job Post
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="rounded-2xl shadow-sm p-8 bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-center py-16">
                  <TrendingUp className="w-20 h-20 mx-auto mb-6 text-white/30" />
                  <h3 className="text-2xl font-semibold text-white mb-4">Analytics Coming Soon</h3>
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    Get insights into your job posts, applications, and worker engagement.
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    {[{label:'Total Jobs', val: stats.totalJobs}, {label:'Active Jobs', val: stats.activeJobs}, {label:'Applications', val: stats.totalApplications}, {label:'Completed', val: stats.completedJobs}].map((b) => (
                      <div key={b.label} className="p-6 rounded-lg bg-white/5 border border-white/10">
                        <h4 className="text-2xl font-bold text-white">{b.val}</h4>
                        <p className="text-white/70">{b.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="rounded-2xl shadow-sm p-8 bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-semibold text-white mb-6">Profile Settings</h2>
                  <div className="space-y-6">
                    <div className="border border-white/10 rounded-lg p-6 bg-white/5">
                      <h3 className="text-lg font-medium text-white mb-4">Account Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={employerData?.name || ''}
                            className="w-full px-4 py-2 border border-white/15 bg-transparent text-white rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/20"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                          <input
                            type="email"
                            value={employerData?.email || ''}
                            className="w-full px-4 py-2 border border-white/15 bg-transparent text-white rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/20"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-white/10 rounded-lg p-6 bg-white/5">
                      <h3 className="text-lg font-medium text-white mb-4">Business Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Business Name</label>
                          <input
                            type="text"
                            value={employerData?.company?.name || ''}
                            className="w-full px-4 py-2 border border-white/15 bg-transparent text-white rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/20"
                            readOnly
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Business Type</label>
                            <input
                              type="text"
                              value={employerData?.company?.type || ''}
                              className="w-full px-4 py-2 border border-white/15 bg-transparent text-white rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/20"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">Industry</label>
                            <input
                              type="text"
                              value={employerData?.company?.industry || ''}
                              className="w-full px-4 py-2 border border-white/15 bg-transparent text-white rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/20"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="px-6 py-3 bg-white text-black rounded-lg hover:opacity-95 transition-colors font-medium">
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
