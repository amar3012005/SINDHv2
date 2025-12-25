import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building, MapPin, FileText, Phone, Mail, Award, Calendar, 
  Edit, Settings, Briefcase, Star, ChevronRight, TrendingUp, Users,
  Clock, CheckCircle, AlertCircle, Plus, Eye, MoreHorizontal, Globe,
  Loader, ArrowLeft, Sparkles
} from 'lucide-react';
import { employerService } from '../../services/employerService';
import { UserContext } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';
import toast from 'react-hot-toast';
import Logo from '../../assets/logo.svg';
import { useNavigate } from 'react-router-dom';
import { logout as authLogout } from '../../utils/authUtils';

const EmployerProfilePage = () => {
  const { user } = useContext(UserContext);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
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

  // Language and menu state (shared behavior with homepage)
  const [lang, setLang] = useState(() => (localStorage.getItem('homeLang') || 'EN'));
  const isHindi = lang === 'HI';
  const [showMenu, setShowMenu] = useState(false);
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
      console.log('🌐 API URL:', buildApiUrl(`/employers/${employerId}`));
      
      const response = await fetch(buildApiUrl(`/employers/${employerId}`), {
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
      console.log('🌐 API URL:', buildApiUrl(`/jobs/employer/${employerId}`));
      
      const response = await fetch(buildApiUrl(`/jobs/employer/${employerId}`), {
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
      const response = await fetch(buildApiUrl(`/employers/${employerId}/stats`), {
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

  // Removed manual refresh feature

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

  const handleName = (name) => {
    if (!name) return '@employer';
    return '@' + String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '');
  };

  // Derived presentation data
  const nameInitials = getInitials(employerData?.name);
  const isVerified = employerData?.verificationStatus === 'verified';
  const profileCompletion = (() => {
    const checkpoints = [
      employerData?.name,
      employerData?.email,
      employerData?.phone,
      employerData?.company?.industry,
      employerData?.location?.state,
      employerData?.businessDescription,
    ];
    const score = checkpoints.filter(Boolean).length;
    return Math.max(10, Math.min(100, Math.round((score / checkpoints.length) * 100)));
  })();

  // Loading state
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
    { id: 'jobs', label: 'Job', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden devanagari">
      {/* Background aesthetics (mirror homepage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft radial vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
        {/* Star trails effect */}
        <div className="startrails absolute inset-0" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
        {/* Aurora animated background */}
        <div className="aurora absolute inset-0">
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
      </div>

      {/* Top-right controls: language chip + menu */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-30">
        <button onClick={toggleLang} className="px-2.5 py-1 rounded-full text-xs md:text-sm bg-white/10 border border-white/15 text-white/90 hover:bg-white/15">{isHindi ? 'HI' : 'EN'}</button>
        <button onClick={() => setShowMenu(v=>!v)} className="p-2 md:p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors" aria-label="Open Menu">
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
            <button onClick={() => { authLogout(); window.location.href = '/'; }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">Logout</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-10 md:pt-12 pb-6 lg:pb-8 relative z-10">
        {/* Header with Logo and refresh button - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 sm:mb-8"
        >
          <div className="flex items-center">
            <button 
              onClick={() => window.history.back()}
              className="mr-2 sm:mr-4 p-2 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200 touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
            </button>
          <div className="flex items-center gap-2 sm:gap-3 relative">
              {Logo ? (
                <img src={Logo} alt="Logo" className="h-6 sm:h-8 md:h-10 invert brightness-0" style={{ maxWidth: 80 }} />
              ) : (
                <span className="text-lg sm:text-xl font-bold tracking-wide text-white">LOGO</span>
              )}
              <span className="text-sm sm:text-lg md:text-xl font-extrabold tracking-widest text-white">S I N D H U</span>
            <span className="absolute -left-6 -top-3 w-10 h-10 rounded-full bg-white/10 blur-2xl" />
            </div>
            <span className="text-sm sm:text-lg font-semibold text-white/80 ml-2 sm:ml-4 hidden sm:inline">Employer Profile</span>
          </div>
          <div className="flex items-center gap-2" />
        </motion.div>

        {/* Profile Header Card - Mobile Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8 bg-white/5 border border-white/10 backdrop-blur-md"
        >
          {/* Cover Photo with subtle blurred overlay like inspiration */}
          <div className="h-28 sm:h-36 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-white/0" />
            <div className="absolute -inset-16 opacity-30 blur-3xl"
                 style={{ background: 'radial-gradient(600px 200px at 30% 30%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(500px 180px at 70% 20%, rgba(255,255,255,0.18), transparent 70%)' }} />
          </div>

          {/* Profile Content */}
          <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Profile Picture - Responsive sizing with animated ring */}
            <div className="absolute -top-8 sm:-top-12 left-4 sm:left-6">
              <div className="relative w-16 h-16 sm:w-24 sm:h-24">
                <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(99,102,241,.8), rgba(236,72,153,.8), rgba(34,197,94,.8), rgba(99,102,241,.8))', filter: 'blur(6px)', opacity: .35 }} />
                <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 90deg, rgba(255,255,255,.35), transparent 60%)', animation: 'spin 10s linear infinite' }} />
                <div className="relative w-full h-full rounded-full p-1 shadow-lg bg-white/10 border border-white/20 backdrop-blur">
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm sm:text-xl">{getInitials(employerData?.name)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Badge - Mobile friendly */}
            {/* Status pill top-right */}
            <div className={`absolute -top-4 sm:-top-6 right-4 sm:right-6 ${isVerified ? 'bg-green-500/90' : 'bg-yellow-500/90'} text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center shadow-lg`}>
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {isVerified ? 'Verified' : 'Pending'}
            </div>
            

            {/* Profile Info - Mobile optimized layout */}
            <div className="pt-10 sm:pt-16">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-1 sm:mb-2">
                    {employerData?.name}
                  </h1>
                  <div className="text-sm sm:text-base text-white/70 mb-2 sm:mb-3">{handleName(employerData?.name)}</div>
                  <div className="inline-flex flex-wrap items-center gap-2 text-[10px] sm:text-xs mb-3">
                    <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/80">Employer</span>
                    <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/80">{employerData?.company?.industry || 'Agriculture'}</span>
                    <span className="px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/80">QWERTY</span>
                  </div>
                  <p className="text-base sm:text-lg lg:text-xl text-white/80 font-medium mb-2 sm:mb-3">{employerData?.company?.name}</p>
                  
                  {/* Age display */}
                  {employerData?.age && (
                    <p className="text-sm sm:text-base text-white/70 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      {employerData.age} years old
                    </p>
                  )}
                  
                  {/* Removed duplicate chip row for a cleaner header */}
                  
                  <div className="flex items-center text-white/70 mb-3 sm:mb-4 text-sm sm:text-base">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="truncate">{formatLocation(employerData?.location)}</span>
                  </div>
                  
                  <div className="flex items-center text-white/60 text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Member since {formatDate(employerData?.registrationDate)}
                  </div>
                </div>
                
                <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white text-black rounded-lg hover:opacity-95 transition-colors font-medium flex items-center justify-center text-sm sm:text-base touch-manipulation">
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Edit Profile
                </button>
              </div>

              {/* Progress bar like gaming UI */}
              <div className="mt-2">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400" style={{ width: `${profileCompletion}%` }} />
                </div>
                <div className="mt-2 text-[10px] sm:text-xs text-white/60">Profile {profileCompletion}% complete</div>
              </div>

              {/* Stats Row & tags like inspiration */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 py-4 sm:py-6 border-t border-white/10">
                {[{label:'Posts', value: stats.totalJobs}, {label:'Active', value: stats.activeJobs}, {label:'Applicants', value: stats.totalApplications}, {label:'Rating', value: employerData?.rating?.average ? employerData.rating.average.toFixed(1) : '—'}].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-widest text-white/60">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {['#localhiring','#community','#verified'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10 text-white/80 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs - Mobile optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl sm:rounded-2xl p-3 sm:p-6 mb-6 sm:mb-8 bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <div className="flex space-x-1 bg-white/10 p-1 rounded-lg overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 flex items-center justify-center px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 touch-manipulation whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
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

                  {/* Business Details Section */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 sm:mb-4 flex items-center">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#ff6b35]" />
                      Business Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Business Type */}
                      {employerData?.company?.type && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-[#ff6b35]/10 rounded-lg flex items-center justify-center mr-3 mt-1">
                            <Briefcase className="w-4 h-4 text-[#ff6b35]" />
                          </div>
                          <div>
                            <h4 className="font-medium text-[#222] text-sm sm:text-base mb-1">Business Type</h4>
                            <p className="text-[#666] text-sm">{employerData.company.type}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Industry */}
                      {employerData?.company?.industry && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-[#ff6b35]/10 rounded-lg flex items-center justify-center mr-3 mt-1">
                            <Globe className="w-4 h-4 text-[#ff6b35]" />
                          </div>
                          <div>
                            <h4 className="font-medium text-[#222] text-sm sm:text-base mb-1">Industry</h4>
                            <p className="text-[#666] text-sm">{employerData.company.industry}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Worker Type Preference */}
                      {employerData?.workerType && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-[#ff6b35]/10 rounded-lg flex items-center justify-center mr-3 mt-1">
                            <Users className="w-4 h-4 text-[#ff6b35]" />
                          </div>
                          <div>
                            <h4 className="font-medium text-[#222] text-sm sm:text-base mb-1">Preferred Workers</h4>
                            <p className="text-[#666] text-sm">{employerData.workerType}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Age */}
                      {employerData?.age && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-[#ff6b35]/10 rounded-lg flex items-center justify-center mr-3 mt-1">
                            <User className="w-4 h-4 text-[#ff6b35]" />
                          </div>
                          <div>
                            <h4 className="font-medium text-[#222] text-sm sm:text-base mb-1">Age</h4>
                            <p className="text-[#666] text-sm">{employerData.age} years old</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Recent Activity */}
                  <div className="rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 sm:mb-4 flex items-center">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-white" />
                      <span className="text-white">Recent Job Posts</span>
                    </h3>
                    {postedJobs.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {postedJobs.slice(0, 3).map((job, index) => (
                          <motion.div
                            key={job._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-lg p-3 sm:p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white text-sm sm:text-base truncate">{job.title}</h4>
                                <p className="text-xs sm:text-sm text-white/70 mt-1 line-clamp-2">{job.description?.substring(0, 100)}...</p>
                                <div className="flex items-center mt-2 text-xs text-white/60">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(job.createdAt)}
                                </div>
                              </div>
                              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${job.status === 'active' ? 'bg-green-500/20 text-green-300' : job.status === 'closed' ? 'bg-white/10 text-white/70' : 'bg-blue-500/20 text-blue-300'}`}>
                                {job.status}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        {postedJobs.length > 3 && (
                          <button
                            onClick={() => setActiveTab('jobs')}
                            className="w-full text-center py-3 text-white/80 hover:text-white font-medium text-sm sm:text-base touch-manipulation"
                          >
                            View all {postedJobs.length} job posts
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-white/30" />
                        <h4 className="text-base sm:text-lg font-medium text-white mb-2">No job posts yet</h4>
                        <p className="text-white/60 mb-4 sm:mb-6 text-sm sm:text-base px-4">Start by posting your first job to attract skilled workers</p>
                        <button onClick={() => window.location.href = '/employer/post-job'} className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white text-black rounded-lg hover:opacity-95 transition-colors font-medium text-sm sm:text-base touch-manipulation">
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
                  <div className="rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-base sm:text-lg font-semibold text-[#222] mb-3 sm:mb-4 flex items-center">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-white" />
                      <span className="text-white">Contact Information</span>
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-white/70" />
                        <span className="text-white text-sm sm:text-base truncate">{employerData?.phone}</span>
                      </div>
                      <div className="flex items-center p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-white/70" />
                        <span className="text-white text-sm sm:text-base truncate">{employerData?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Verification Status</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm sm:text-base">Email Verified</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm sm:text-base">Phone Verified</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm sm:text-base">Aadhar Verified</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm sm:text-base">Profile Complete</span>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
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
              <div className="rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-center py-12 sm:py-16">
                  <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-white/30" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4">Analytics Coming Soon</h3>
                  <p className="text-white/60 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
                    Get insights into your job posts, applications, and worker engagement.
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto">
                    {[{label:'Total Jobs', val: stats.totalJobs}, {label:'Active Jobs', val: stats.activeJobs}, {label:'Applications', val: stats.totalApplications}, {label:'Completed', val: stats.completedJobs}].map((b) => (
                      <div key={b.label} className="p-3 sm:p-6 rounded-lg bg-white/5 border border-white/10">
                        <h4 className="text-lg sm:text-2xl font-bold text-white">{b.val}</h4>
                        <p className="text-white/70 text-xs sm:text-base">{b.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-4">
                    {[1,2,3,4].map((i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-white/20"></span>
                    ))}
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

      {/* Background styles shared with homepage */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
        .devanagari { font-family: 'Noto Sans Devanagari','Poppins',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial; }
        .noise-bg { background-image: url('data:image/svg+xml;utf8,\
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
            <filter id="noise">\
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>\
              <feColorMatrix type="saturate" values="0"/>\
              <feComponentTransfer>\
                <feFuncA type="table" tableValues="0 0.2"/>\
              </feComponentTransfer>\
            </filter>\
            <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/>\
          </svg>'); }
        .aurora-blob { position:absolute; width:60vmax; height:60vmax; filter:blur(60px); opacity:.2; }
        .aurora-a { background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%); left:-20vmax; top:-10vmax; animation: drift 18s ease-in-out infinite; }
        .aurora-b { background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%); right:-25vmax; top:-5vmax; animation: drift 22s ease-in-out infinite reverse; }
        .aurora-c { background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%); left:10vmax; bottom:-20vmax; animation: drift 26s ease-in-out infinite; }
        @keyframes drift { 0%,100% { transform: translate3d(0,0,0) rotate(0deg);} 50% { transform: translate3d(5vmax,-3vmax,0) rotate(20deg);} }
        .startrails { position:absolute; inset:0; background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%); overflow:hidden; }
        .startrails::before, .startrails::after { content:""; position:absolute; inset:-20%; background-repeat:repeat; background-size:300px 300px; mix-blend-mode:screen; opacity:.25; border-radius:50%; filter:blur(.2px); }
        .startrails::before { background-image: radial-gradient(2px 120px at 50% 0%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 60%), radial-gradient(1.5px 100px at 80% 10%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%), radial-gradient(1.2px 90px at 20% 30%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%), radial-gradient(1.8px 110px at 70% 60%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 60%); animation: trails-rotate 140s linear infinite; }
        .startrails::after { background-image: radial-gradient(1px 60px at 30% 10%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 60%), radial-gradient(1px 70px at 60% 40%, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 60%), radial-gradient(1px 50px at 10% 80%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%), radial-gradient(1px 65px at 90% 50%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%); animation: trails-rotate-rev 200s linear infinite; opacity:.18; }
        @keyframes trails-rotate { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes trails-rotate-rev { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
      `}</style>
    </div>
  );
};

export default EmployerProfilePage;
