import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { getApiUrl } from '../../utils/apiUtils';
import { toast } from 'react-toastify';
import { 
  CheckCircle, MapPin, DollarSign, Building, Clock, 
  Briefcase, Eye, Phone, Mail, RefreshCw, Award, Search,
  Calendar, User, Star, TrendingUp, AlertCircle, Filter,
  X, Plus, BarChart3, Target, Zap, PlayCircle, PauseCircle
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const MyApplications = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const applicationRefs = useRef({});
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('appliedAt');
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  // UI controls like Homepage
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('homeLang');
    if (stored === 'HI' || stored === 'EN') return stored;
    return (i18n.language && i18n.language.toLowerCase() === 'hi') ? 'HI' : 'EN';
  });
  const isHindi = lang === 'HI';
  const [showPageMenu, setShowPageMenu] = useState(false);
  const toggleLang = () => {
    const next = isHindi ? 'EN' : 'HI';
    setLang(next);
    localStorage.setItem('homeLang', next);
    i18n.changeLanguage(next.toLowerCase());
  };

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
      fetchWalletInfo();
    }
  }, [user]);

  // Fetch wallet information
  const fetchWalletInfo = async (appsData = null) => {
    try {
      if (!user?.id) return;
      
      const response = await fetch(`${getApiUrl()}/workers/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const worker = data.data || data;
        setWalletBalance(worker.balance || 0);
        
        // Calculate total earnings from paid applications
        // Use passed applications data or current state
        const appsToUse = appsData || applications;
        const totalPaid = appsToUse
          .filter(app => app.paymentStatus === 'paid')
          .reduce((sum, app) => sum + (app.paymentAmount || app.job?.salary || 0), 0);
        setTotalEarnings(totalPaid);
        
        console.log('💰 Wallet updated - Balance:', worker.balance || 0, 'Total Earnings:', totalPaid);
      }
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    }
  };

  // Real-time updates - listen for status changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'applicationStatusUpdate') {
        console.log('🔄 Application status updated, refreshing...');
        fetchApplications();
        // Also refresh wallet info after a short delay
        setTimeout(() => fetchWalletInfo(), 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events
    const handleCustomUpdate = () => {
      console.log('🔄 Custom application update event, refreshing...');
      fetchApplications();
      // Also refresh wallet info after a short delay
      setTimeout(() => fetchWalletInfo(), 1000);
    };
    
    window.addEventListener('applicationUpdated', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('applicationUpdated', handleCustomUpdate);
    };
  }, []);

  // Fetch applications from database using correct API format
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching applications for worker:', user?.id);
      console.log('👤 User data:', { id: user?.id, type: user?.type, name: user?.name });
      
      if (!user?.id || user?.type !== 'worker') {
        setError('You must be logged in as a worker to view applications');
        return;
      }

      // Fetch both current and completed applications
      const currentApiUrl = `${getApiUrl()}/job-applications/worker/${user.id}/current`;
      const completedApiUrl = `${getApiUrl()}/job-applications/worker/${user.id}/completed`;
      
      console.log('🌐 Fetching current from:', currentApiUrl);
      console.log('🌐 Fetching completed from:', completedApiUrl);
      
      const [currentResponse, completedResponse] = await Promise.all([
        fetch(currentApiUrl),
        fetch(completedApiUrl)
      ]);
      
      console.log('📊 Current Response status:', currentResponse.status);
      console.log('📊 Completed Response status:', completedResponse.status);
      
      if (currentResponse.ok && completedResponse.ok) {
        const [currentData, completedData] = await Promise.all([
          currentResponse.json(),
          completedResponse.json()
        ]);
        
        console.log('📊 Current API Response:', JSON.stringify(currentData, null, 2));
        console.log('📊 Completed API Response:', JSON.stringify(completedData, null, 2));
        
        // Handle the response format: { success: true, data: [...], count: number }
        const currentApps = currentData.data || [];
        const completedApps = completedData.data || [];
        
        console.log('📋 Current applications found:', currentApps.length);
        console.log('📋 Completed applications found:', completedApps.length);
        
        // Transform current applications
        const transformedCurrentApps = currentApps.map(app => {
          console.log('🔄 Processing current app:', {
            id: app._id,
            status: app.status,
            jobTitle: app.job?.title,
            jobCompany: app.job?.companyName
          });
          
          return {
            _id: app._id,
            status: app.status,
            appliedAt: app.appliedAt,
            paymentStatus: app.paymentStatus || 'pending',
            paymentAmount: app.paymentAmount,
            // Job details are already properly formatted from backend
            job: {
              _id: app.job._id,
              title: app.job.title,
              companyName: app.job.companyName,
              location: app.job.location,
              salary: app.job.salary,
              category: app.job.category,
              employmentType: app.job.employmentType,
              description: app.job.description
            },
            // Worker and employer details
            worker: app.worker,
            employer: app.employer,
            statusHistory: app.statusHistory || []
          };
        });
        
        // Transform completed applications
        const transformedCompletedApps = completedApps.map(app => {
          console.log('🔄 Processing completed app:', {
            id: app._id,
            status: app.application?.status,
            jobTitle: app.job?.title,
            jobCompany: app.job?.companyName
          });
          
          return {
            _id: app._id,
            status: 'completed',
            appliedAt: app.application?.appliedAt,
            completedAt: app.application?.completedAt,
            paymentStatus: app.application?.paymentStatus || 'pending',
            paymentAmount: app.application?.paymentAmount,
            paymentDate: app.application?.paymentDate,
            // Job details from completed endpoint format
            job: {
              _id: app.job._id,
              title: app.job.title,
              companyName: app.job.companyName,
              location: app.job.location,
              salary: app.job.salary,
              category: app.job.category,
              description: app.job.description
            },
            // Employer details
            employer: app.employer,
            statusHistory: []
          };
        });
        
        // Combine both current and completed applications
        const allApplications = [...transformedCurrentApps, ...transformedCompletedApps];
        
        console.log('✅ Total transformed applications:', allApplications.length);
        console.log('✅ Current apps:', transformedCurrentApps.length);
        console.log('✅ Completed apps:', transformedCompletedApps.length);
        
        setApplications(allApplications);
        
        // Refresh wallet info after applications are updated with fresh data
        setTimeout(() => fetchWalletInfo(allApplications), 500);
        
      } else {
        // Handle errors from either endpoint
        let errorMessage = 'Failed to fetch applications';
        
        if (!currentResponse.ok) {
          const currentErrorText = await currentResponse.text();
          console.error('❌ Current applications API failed:', currentResponse.status, currentErrorText);
          errorMessage += ` (Current: ${currentResponse.status})`;
        }
        
        if (!completedResponse.ok) {
          const completedErrorText = await completedResponse.text();
          console.error('❌ Completed applications API failed:', completedResponse.status, completedErrorText);
          errorMessage += ` (Completed: ${completedResponse.status})`;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      setError(`Failed to connect to server: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle starting work on an accepted job
  const handleStartWork = async (applicationId) => {
    if (!window.confirm('Are you sure you want to start working on this job?')) {
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/job-applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'in-progress',
          paymentStatus: 'pending'
        })
      });

      if (response.ok) {
        // Update local state
        setApplications(prev => prev.map(app => 
          app._id === applicationId 
            ? { 
                ...app, 
                status: 'in-progress',
                statusHistory: [
                  ...(app.statusHistory || []),
                  { status: 'in-progress', timestamp: new Date().toISOString() }
                ]
              } 
            : app
        ));

        // Show success message
        toast.success('Work started successfully!', {
          position: 'bottom-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });

        // Trigger real-time updates
        window.dispatchEvent(new CustomEvent('applicationUpdated'));
        localStorage.setItem('applicationStatusUpdate', Date.now().toString());
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start work');
      }
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error(error.message || 'Failed to start work. Please try again.', {
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };

  // Helper functions
  const handleRefresh = () => {
    console.log('🔄 Refreshing applications list...');
    setRefreshing(true);
    fetchApplications();
  };

  // Progress calculation function based on status and payment
  const getProgressStep = (app) => {
    switch (app.status) {
      case 'pending': return 1;
      case 'accepted': return 2;
      case 'in-progress': 
        // In progress can be step 3 (working) or step 4 (paid, ready to complete)
        return app.paymentStatus === 'paid' ? 4 : 3;
      case 'completed': return 5; // Final step after payment
      default: return 1;
    }
  };

  const getProgressColor = (step) => {
    if (step >= 4) return 'from-green-500 to-emerald-600';
    if (step >= 3) return 'from-blue-500 to-indigo-600';
    if (step >= 2) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-white/10 text-green-300 border-white/10';
      case 'pending': return 'bg-white/10 text-yellow-300 border-white/10';
      case 'in-progress': return 'bg-white/10 text-blue-300 border-white/10';
      case 'completed': return 'bg-white/10 text-purple-300 border-white/10';
      case 'paid': return 'bg-white/10 text-emerald-300 border-white/10';
      default: return 'bg-white/10 text-white/80 border-white/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'in-progress': return <PlayCircle className="w-4 h-4 text-blue-600" />;
      case 'completed': return <Award className="w-4 h-4 text-purple-600" />;
      case 'paid': return <DollarSign className="w-4 h-4 text-emerald-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return t('applications.steps.applied');
      case 'accepted': return t('applications.steps.accepted');
      case 'in-progress': return t('applications.steps.working');
      case 'completed': return t('applications.steps.completed');
      case 'paid': return t('applications.steps.paid');
      default: return status?.charAt(0).toUpperCase() + status?.slice(1);
    }
  };

  // Minimal progress ring for jobs completed ratio
  const ProgressRing = ({ size = 28, strokeWidth = 3, progress = 0 }) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clamped);
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(163, 230, 53)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
    );
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           app.job?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && app.status === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'appliedAt':
          return new Date(b.appliedAt) - new Date(a.appliedAt);
        case 'title':
          return a.job?.title?.localeCompare(b.job?.title) || 0;
        case 'salary':
          return (b.job?.salary || 0) - (a.job?.salary || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  // Progress bar component
  const ProgressBar = ({ app }) => {
    const step = getProgressStep(app);
    const steps = ['Applied', 'Accepted', 'Working', 'Paid', 'Completed'];
    
    return (
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Progress</span>
          <span>{steps[step - 1]} ({step}/5)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(step)}`}
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {steps.map((stepName, index) => (
            <div key={index} className={`text-xs ${index < step ? 'text-blue-600' : 'text-gray-400'}`}>
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
          <div className="startrails absolute inset-0" />
        </div>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">{t('applications.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden devanagari">
      {/* Background aesthetics (mirror homepage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
        <div className="startrails absolute inset-0" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
        <div className="aurora absolute inset-0"><span className="aurora-blob aurora-a" /><span className="aurora-blob aurora-b" /><span className="aurora-blob aurora-c" /></div>
      </div>
      {/* Top-right controls: language + menu */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-30">
        <button onClick={toggleLang} className="px-2.5 py-1 rounded-full text-xs md:text-sm bg-white/10 border border-white/15 text-white/90 hover:bg-white/15">{isHindi ? 'HI' : 'EN'}</button>
        <button onClick={() => setShowPageMenu(v=>!v)} className="p-2 md:p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors">
          <span className="block w-5 md:w-6 h-0.5 bg-white mb-1"></span>
          <span className="block w-4 md:w-5 h-0.5 bg-white mb-1"></span>
          <span className="block w-6 md:w-7 h-0.5 bg-white"></span>
        </button>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-12 pb-4 md:pb-8">
        {/* Header Section - Similar to PostedJobs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2">
              {t('applications.title')}
            </h1>
            <p className="mt-2 sm:mt-3 max-w-2xl text-base sm:text-xl text-white/70">
              {t('applications.subtitle')}
            </p>
          </div>
        </div>

        {/* Compact Refresh Button - Below Navbar */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`fixed top-20 right-4 z-40 group w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-300 touch-manipulation flex items-center justify-center overflow-hidden ${
            refreshing 
              ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 cursor-not-allowed shadow-lg shadow-blue-300/30' 
              : 'bg-gradient-to-br from-slate-600 via-slate-700 to-gray-800 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg hover:shadow-blue-200/40 hover:scale-105 active:scale-95'
          }`}
          title={refreshing ? t('applications.refreshing') : t('applications.refreshTitle')}
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10 transition-all duration-300 ${
            refreshing 
              ? 'animate-spin' 
              : 'group-hover:rotate-180 group-hover:scale-105'
          }`} />
        </button>

        {/* Error State */}
        {error && (
          <div className="bg-white/5 border border-red-400/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <p className="text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {/* Neon Wallet Card + compact chips (Total Earned primary) */}
        <div className="relative rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden">
          <div className="absolute -inset-10 opacity-20 blur-3xl bg-gradient-to-br from-lime-300/30 to-emerald-300/20 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/70">{t('applications.totalEarned')}</div>
                <div className="mt-1 text-3xl font-extrabold tracking-tight">₹{totalEarnings.toLocaleString()}</div>
              </div>
              <div className="px-2 py-1 text-[10px] rounded-full bg-white/10 border border-white/15 text-white/80">INR</div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/80">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{t('applications.currentBalance')} · </span>
                <span className="text-white">₹{walletBalance.toLocaleString()}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/80">
                <ProgressRing progress={(applications.filter(a => a.paymentStatus === 'paid').length) / Math.max(1, applications.length)} />
                <span>{t('applications.jobsCompleted')} · </span>
                <span className="text-white">{applications.filter(a => a.paymentStatus === 'paid').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section removed for minimal UI */}

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? t('applications.emptyTitle') : `No ${getStatusLabel(filterStatus)} Applications`}
            </h3>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base px-4">
              {filterStatus === 'all' 
                ? t('applications.emptySubtitle') 
                : `You don't have any ${getStatusLabel(filterStatus).toLowerCase()} applications at the moment`}
            </p>
          </div>
        ) : (
          <div className="w-full">
            <Swiper
              spaceBetween={16}
              slidesPerView={1.1}
              breakpoints={{
                640: { slidesPerView: 1.5 },
                768: { slidesPerView: 2.2 },
                1024: { slidesPerView: 3.2 },
              }}
              style={{ paddingBottom: '2rem' }}
            >
              {filteredApplications.map((app) => (
                <SwiperSlide key={app._id}>
                  {/* Job Card */}
                  <motion.div
                    ref={el => applicationRefs.current[app._id] = el}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white/5 border border-white/10 text-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 mx-1 backdrop-blur-md"
                  >
                    {/* Status Banner */}
                    <div className={`px-3 sm:px-4 py-2 ${getStatusColor(app.status)} border-b` }>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getStatusIcon(app.status)}
                          <span className="ml-2 text-xs sm:text-sm font-medium">
                            {getStatusLabel(app.status)}
                          </span>
                        </div>
                        <span className="text-xs text-white/70">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="p-4 sm:p-6">
                      {/* Salary Display */}
                      <div className="mb-4">
                        <div className="relative">
                          <div className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                            ₹{app.job?.salary || 0}
                          </div>
                          <div className="absolute -bottom-1 left-0 w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
                        </div>
                        <div className="text-xs text-white/60 mt-2">{t('jobs.perMonth')}</div>
                      </div>

                      {/* Job Title and Company */}
                      <div className="mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
                          {app.job?.title || 'Job Title'}
                        </h3>
                        <div className="flex items-center text-white/70 mb-2">
                          <Building className="w-4 h-4 mr-1" />
                          <span className="text-sm">{app.job?.companyName || 'Company'}</span>
                        </div>
                        <div className="flex items-center text-white/70">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {app.job?.location?.city || 'City'}, {app.job?.location?.state || 'State'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-white/80">{t('applications.progress')}</span>
                          <span className="text-sm font-bold text-white">{getProgressStep(app) * 20}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 bg-gradient-to-r ${getProgressColor(getProgressStep(app))}`}
                            style={{ width: `${getProgressStep(app) * 20}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-white/60">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                              getProgressStep(app) >= 1 ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'
                            }`}>
                              <Clock className="w-3 h-3" />
                            </div>
                            <span>{t('applications.steps.applied')}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                              getProgressStep(app) >= 2 ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'
                            }`}>
                              <CheckCircle className="w-3 h-3" />
                            </div>
                            <span>{t('applications.steps.accepted')}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                              getProgressStep(app) >= 3 ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/40'
                            }`}>
                              <PlayCircle className="w-3 h-3" />
                            </div>
                            <span>{t('applications.steps.working')}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                              getProgressStep(app) >= 4 ? 'bg-green-600 text-white' : 'bg-white/10 text-white/40'
                            }`}>
                              <DollarSign className="w-3 h-3" />
                            </div>
                            <span>{t('applications.steps.paid')}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                              getProgressStep(app) >= 5 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'
                            }`}>
                              <Award className="w-3 h-3" />
                            </div>
                            <span>{t('applications.steps.completed')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Work & Payment Status */}
                      {app.status === 'in-progress' && app.paymentStatus !== 'paid' && (
                        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-white/90">
                              <PlayCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">{t('applications.status.workInProgress')}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-white/70">{t('applications.status.paymentPending')}</div>
                              <div className="text-sm font-bold text-white">
                                ₹{app.paymentAmount || app.job?.salary || 0}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-white/70">
                            {t('applications.status.keepWorking')}
                          </div>
                        </div>
                      )}
                      
                      {app.status === 'in-progress' && app.paymentStatus === 'paid' && (
                        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-white/90">
                              <DollarSign className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">{t('applications.status.paymentReceived')}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-white/70">{t('applications.status.paymentCredited')}</div>
                              <div className="text-sm font-bold text-white">
                                ₹{app.paymentAmount || app.job?.salary || 0}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-white/70">
                            {t('applications.status.afterPaid')}
                          </div>
                        </div>
                      )}
                      
                      {app.status === 'completed' && (
                        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-white/90">
                              <Award className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">{t('applications.status.jobCompleted')}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-white/70">Final Status</div>
                              <div className="text-sm font-bold text-white">
                                ₹{app.paymentAmount || app.job?.salary || 0}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-white/70">
                            🎉 {t('applications.status.congrats')}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => {
                            // Navigate to job details or show modal
                            console.log('View details for job:', app.job?._id);
                          }}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-white text-black rounded-lg hover:opacity-95 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('jobs.details')}
                        </button>
                        
                        {app.status === 'accepted' && (
                          <>
                            <a 
                              href={`tel:${app.employer?.phone || ''}`}
                              className="flex items-center justify-center px-3 py-2 bg-white text-black rounded-lg hover:opacity-95 transition-colors text-sm"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          </>
                        )}
                        
                        {app.status === 'in-progress' && (
                          <button 
                            className="flex-1 flex items-center justify-center px-3 py-2 bg-white/10 text-white rounded-lg border border-white/10 transition-colors text-sm"
                            disabled
                          >
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Work in Progress
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Summary Stats removed for minimal mobile UI */}
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
        .startrails::after { background-image: radial-gradient(1px 60px at 30% 10%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 60%), radial-gradient(1px 70px at 60% 40%, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 60%), radial-gradient(1px 50px at 10% 80%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%); animation: trails-rotate-rev 200s linear infinite; opacity:.18; }
        @keyframes trails-rotate { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes trails-rotate-rev { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
      `}</style>
    </div>
  );
};

export default MyApplications;
