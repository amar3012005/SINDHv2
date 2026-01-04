import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building, MapPin, FileText, Phone, Mail, Award, Calendar, 
  Edit, Settings, Briefcase, Star, ChevronRight, TrendingUp, Users,
  Clock, CheckCircle, AlertCircle, Plus, Eye, MoreHorizontal, Globe,
  Loader, ArrowLeft, Sparkles, DollarSign, ShieldCheck
} from 'lucide-react';
import { UserContext } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { logout as authLogout } from '../../utils/authUtils';
import { db } from '../../config/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

const EmployerProfile = () => {
  const { user, logoutUser } = useContext(UserContext);
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMenu, setShowMenu] = useState(false);
  const [postedJobs, setPostedJobs] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalApplications: 0
  });

  // Language state
  const [lang, setLang] = useState(() => (localStorage.getItem('homeLang') || 'EN'));
  const isHindi = lang === 'HI';

  useEffect(() => {
    i18n.changeLanguage(lang.toLowerCase());
  }, [lang, i18n]);

  const toggleLang = () => {
    const next = isHindi ? 'EN' : 'HI';
    setLang(next);
    localStorage.setItem('homeLang', next);
  };

  // Get employer ID from various sources
  const getEmployerId = useCallback(() => {
    if (user?.type === 'employer' && (user.id || user._id)) return user.id || user._id;
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.type === 'employer' && (parsed.id || parsed._id)) {
          return parsed.id || parsed._id;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return localStorage.getItem('employerId');
  }, [user]);

  // Real-time listeners
  useEffect(() => {
    const employerId = getEmployerId();
    if (!employerId) {
      setError('No employer ID found. Please log in again.');
      setLoading(false);
      return;
    }

    console.log('📡 Setting up real-time listeners for EmployerProfile:', employerId);
    setLoading(true);

    // 1. Employer Profile Listener
    const employerRef = doc(db, 'employers', employerId);
    const unsubscribeProfile = onSnapshot(employerRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('👤 Employer profile updated:', data);
        setEmployerData({
          ...data,
          id: docSnap.id,
          _id: docSnap.id
        });
        setLoading(false);
      } else {
        console.warn('⚠️ Employer profile not found in Firestore');
        setError('Employer profile not found');
        setLoading(false);
      }
    }, (err) => {
      console.error('❌ Employer profile listener error:', err);
      setError(err.message);
      setLoading(false);
    });

    // 2. Posted Jobs Listener
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('employer', '==', employerId)
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsList = snapshot.docs.map(doc => ({
        ...doc.data(),
        _id: doc.id,
        id: doc.id
      }));
      console.log(`📋 Posted jobs updated: ${jobsList.length} total`);
      setPostedJobs(jobsList);
      
      const totalJobs = jobsList.length;
      const activeJobs = jobsList.filter(job => ['POSTED', 'active', 'APPLIED'].includes(job.status)).length;
      const completedJobs = jobsList.filter(job => job.status === 'completed').length;
      const totalApplications = jobsList.reduce((total, job) => total + (job.applicantCount || 0), 0);

      setStats({ totalJobs, activeJobs, completedJobs, totalApplications });
    }, (err) => {
      console.error('❌ Posted jobs listener error:', err);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeJobs();
    };
  }, [getEmployerId]);

  const handleLogout = () => {
    authLogout();
    logoutUser();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'ER';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const formatLocation = (loc) => {
    if (!loc) return 'Location not specified';
    if (typeof loc === 'string') return loc;
    const parts = [loc.village, loc.district, loc.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#FF7124] animate-spin mx-auto mb-4" />
          <p className="text-[#3B4883] font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-[#3B4883] mb-2 uppercase">Profile Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/login')} className="w-full py-4 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">Login Again</button>
        </div>
      </div>
    );
  }

  const profileCompletion = (() => {
    const checkpoints = [
      employerData?.name,
      employerData?.email,
      employerData?.company?.name,
      employerData?.location?.state,
      employerData?.businessDescription,
    ];
    const score = checkpoints.filter(Boolean).length;
    return Math.round((score / checkpoints.length) * 100);
  })();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'jobs', label: 'My Jobs', icon: Briefcase },
    { id: 'analytics', label: 'Stats', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans select-none pb-20">
      {/* Theme Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% 0%, rgba(59, 72, 131, 0.08), transparent 70%)' }} />
        <div className="absolute top-20 right-[10%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 bg-[#E8DFD5]" />
        <div className="absolute bottom-40 left-[10%] w-[250px] h-[250px] rounded-full blur-[100px] opacity-30 bg-[#DBBBA7]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white border-2 border-[#3B4883]/10 rounded-2xl flex items-center justify-center text-[#3B4883] hover:bg-[#3B4883]/5 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-3">
            <button onClick={toggleLang} className="px-4 py-2 bg-white/80 backdrop-blur-md border-2 border-[#3B4883]/10 rounded-xl text-xs font-black text-[#3B4883] uppercase tracking-widest shadow-sm">
              {isHindi ? 'HI' : 'EN'}
            </button>
            <button onClick={() => setShowMenu(!showMenu)} className="w-12 h-12 bg-[#3B4883] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#3B4883]/20">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Floating Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-24 right-6 w-48 bg-white/90 backdrop-blur-xl border-2 border-[#3B4883]/10 rounded-3xl p-2 shadow-2xl z-50">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-50 rounded-2xl transition-all">
                <AlertCircle className="w-4 h-4" /> Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-[#3B4883]/5 rounded-[40px] p-8 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF7124]/5 rounded-full blur-3xl" />
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-[#FF7124] to-[#e66420] rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-[#FF7124]/20 rotate-3">
                {getInitials(employerData?.name)}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-black text-[#272D4E] uppercase tracking-tight">{employerData?.name}</h1>
                <span className="px-3 py-1 bg-[#3B4883]/5 text-[#3B4883] text-[10px] font-black rounded-full border border-[#3B4883]/10 uppercase tracking-widest">
                  {employerData?.company?.industry || 'Employer'}
                </span>
              </div>
              <p className="text-sm font-bold text-[#3B4883]/60 uppercase tracking-widest mb-4">
                {employerData?.company?.name || 'Private Employer'}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-[#272D4E]/40 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#FF7124]" /> {formatLocation(employerData?.location)}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-[#FF7124]" /> Joined {new Date(employerData?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="bg-[#3B4883]/5 border-2 border-[#3B4883]/5 rounded-[32px] p-6 text-center min-w-[160px]">
              <p className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest mb-1">Employer Rating</p>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-3xl font-black text-[#272D4E]">{employerData?.rating?.average?.toFixed(1) || '5.0'}</span>
                <Star className="w-6 h-6 text-[#FF7124] fill-[#FF7124]" />
              </div>
              <p className="text-[9px] font-bold text-green-600 uppercase">Trusted Hire</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t-2 border-[#3B4883]/5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Posts', value: stats.totalJobs, icon: Briefcase },
              { label: 'Active Jobs', value: stats.activeJobs, icon: Sparkles },
              { label: 'Applicants', value: stats.totalApplications, icon: Users },
              { label: 'Completed', value: stats.completedJobs, icon: ShieldCheck }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-black text-[#272D4E]">{s.value}</p>
                <p className="text-[9px] font-black text-[#3B4883]/40 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-[#3B4883]/5 rounded-3xl mb-8 border-2 border-[#3B4883]/5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[20px] transition-all ${activeTab === tab.id ? 'bg-white text-[#3B4883] shadow-xl translate-y-[-2px]' : 'text-[#3B4883]/40 hover:text-[#3B4883]'}`}>
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#FF7124]' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-white border-2 border-[#3B4883]/5 rounded-[32px] p-8 shadow-xl">
                    <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#FF7124]/10 rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 text-[#FF7124]" /></div>
                      About the Business
                    </h3>
                    <p className="text-sm font-bold text-[#272D4E]/70 leading-relaxed">
                      {employerData?.businessDescription || 'No business description provided yet.'}
                    </p>
                  </div>

                  <div className="bg-white border-2 border-[#3B4883]/5 rounded-[32px] p-8 shadow-xl">
                    <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#3B4883]/5 rounded-xl flex items-center justify-center"><Sparkles className="w-4 h-4 text-[#3B4883]" /></div>
                      Recent Activity
                    </h3>
                    <div className="space-y-4">
                      {postedJobs.slice(0, 3).map(job => (
                        <div key={job.id} className="flex items-center justify-between p-4 bg-[#3B4883]/5 rounded-2xl border-2 border-transparent hover:border-[#FF7124]/30 transition-all cursor-pointer group">
                          <div>
                            <p className="text-sm font-black text-[#272D4E] uppercase group-hover:text-[#FF7124] transition-colors">{job.title}</p>
                            <p className="text-[10px] font-bold text-[#3B4883]/40 uppercase tracking-widest">{job.status} • {job.applicantCount || 0} applied</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#3B4883]/20 group-hover:text-[#FF7124]" />
                        </div>
                      ))}
                      {postedJobs.length === 0 && <p className="text-center py-8 text-[10px] font-black text-[#3B4883]/30 uppercase tracking-[0.2em]">No job posts yet</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white border-2 border-[#3B4883]/5 rounded-[32px] p-8 shadow-xl">
                    <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-6">Profile Health</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-[#3B4883]/40 uppercase">Completion</span>
                      <span className="text-sm font-black text-[#FF7124]">{profileCompletion}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#3B4883]/5 rounded-full overflow-hidden mb-6">
                      <div className="h-full bg-gradient-to-r from-[#FF7124] to-[#e66420]" style={{ width: `${profileCompletion}%` }} />
                    </div>
                    <div className="space-y-3">
                      {['Phone Verified', 'GST Registered', 'Address Set'].map((check, i) => (
                        <div key={i} className="flex items-center gap-3 text-[10px] font-black text-[#272D4E]/60 uppercase tracking-widest">
                          <CheckCircle className="w-4 h-4 text-green-500" /> {check}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => navigate('/employer/post-job')} className="w-full h-20 bg-[#FF7124] hover:bg-[#e66420] text-white rounded-[32px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-[#FF7124]/20 transition-all active:scale-95">
                    <Plus className="w-5 h-5" /> Post A New Job
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-6">
                {postedJobs.map(job => (
                  <div key={job.id} className="bg-white border-2 border-[#3B4883]/5 rounded-[32px] p-8 shadow-xl hover:border-[#FF7124]/30 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-black text-[#272D4E] uppercase group-hover:text-[#FF7124] transition-colors">{job.title}</h4>
                        <p className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest">{job.category} • Posted on {new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${job.status === 'POSTED' || job.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-400'}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-[#3B4883]/5 p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-[#3B4883]/40 uppercase tracking-[0.2em] mb-1">Wage</p>
                        <p className="text-sm font-black text-[#272D4E]">₹{job.salary || job.baseAmount}</p>
                      </div>
                      <div className="bg-[#3B4883]/5 p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-[#3B4883]/40 uppercase tracking-[0.2em] mb-1">Workers</p>
                        <p className="text-sm font-black text-[#272D4E]">{job.vacancies || 1}</p>
                      </div>
                      <div className="bg-[#3B4883]/5 p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-[#3B4883]/40 uppercase tracking-[0.2em] mb-1">Applied</p>
                        <p className="text-sm font-black text-[#272D4E]">{job.applicantCount || 0}</p>
                      </div>
                      <div className="bg-[#3B4883]/5 p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-[#3B4883]/40 uppercase tracking-[0.2em] mb-1">Status</p>
                        <p className="text-sm font-black text-green-600">ACTIVE</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => navigate(`/employer/job/${job.id}`)} className="flex-1 h-14 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#3B4883]/10">Manage Applicants</button>
                      <button className="px-6 h-14 bg-white border-2 border-[#3B4883]/10 text-[#3B4883] rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors"><Settings className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                {postedJobs.length === 0 && (
                  <div className="text-center py-20 bg-white border-2 border-dashed border-[#3B4883]/10 rounded-[40px]">
                    <Briefcase className="w-16 h-16 text-[#3B4883]/10 mx-auto mb-4" />
                    <p className="text-sm font-black text-[#3B4883]/30 uppercase tracking-[0.2em]">No jobs posted yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white border-2 border-[#3B4883]/5 rounded-[40px] p-12 text-center shadow-xl">
                <TrendingUp className="w-20 h-20 text-[#FF7124]/20 mx-auto mb-6" />
                <h3 className="text-xl font-black text-[#3B4883] uppercase tracking-widest mb-4">Analytics Dashboard</h3>
                <p className="text-[#3B4883]/60 font-bold max-w-sm mx-auto mb-10 leading-relaxed uppercase text-[10px]">Track hiring performance, worker retention, and cost-per-hire insights in real-time.</p>
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                  <div className="p-6 bg-[#3B4883]/5 rounded-[32px] border-2 border-transparent hover:border-[#3B4883]/10 transition-all">
                    <p className="text-3xl font-black text-[#272D4E] mb-1">0%</p>
                    <p className="text-[8px] font-black text-[#3B4883]/40 uppercase tracking-[0.2em]">Fill Rate</p>
                  </div>
                  <div className="p-6 bg-[#3B4883]/5 rounded-[32px] border-2 border-transparent hover:border-[#3B4883]/10 transition-all">
                    <p className="text-3xl font-black text-[#272D4E] mb-1">0.0</p>
                    <p className="text-[8px] font-black text-[#3B4883]/40 uppercase tracking-[0.2em]">Response Time</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white border-2 border-[#3B4883]/5 rounded-[40px] p-8 shadow-xl">
                <div className="max-w-2xl mx-auto space-y-8">
                  <div>
                    <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-6">Business Profile</h3>
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#3B4883]/60 uppercase tracking-widest px-4">Contact Name</label>
                        <div className="w-full h-16 bg-[#3B4883]/5 rounded-2xl flex items-center px-6 text-sm font-bold text-[#272D4E] border-2 border-transparent">{employerData?.name}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#3B4883]/60 uppercase tracking-widest px-4">Phone Number</label>
                        <div className="w-full h-16 bg-[#3B4883]/5 rounded-2xl flex items-center px-6 text-sm font-bold text-[#272D4E] border-2 border-transparent">{employerData?.phone}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#3B4883]/60 uppercase tracking-widest px-4">Email Address</label>
                        <div className="w-full h-16 bg-[#3B4883]/5 rounded-2xl flex items-center px-6 text-sm font-bold text-[#272D4E] border-2 border-transparent">{employerData?.email || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full h-16 bg-[#3B4883]/5 text-[#3B4883] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#3B4883]/10 transition-all">Edit All Settings</button>
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
