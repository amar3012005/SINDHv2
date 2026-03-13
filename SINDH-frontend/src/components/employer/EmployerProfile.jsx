import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Building, MapPin, FileText, Phone, Mail, Award, Calendar,
  Edit, Settings, Briefcase, Star, ChevronRight, TrendingUp, Users,
  Clock, CheckCircle, AlertCircle, Plus, Eye, MoreHorizontal, Globe,
  Loader, ArrowLeft, Sparkles, DollarSign, ShieldCheck, Share2, Languages
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

  // Calculate SINDH-DAYS
  const joinDate = new Date(employerData?.registrationDate || employerData?.createdAt?.toDate?.() || employerData?.createdAt || Date.now());
  const today = new Date();
  const sindhDays = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));

  // Deterministic Barcode Widths based on Employer ID
  const barcodePattern = (employerData?.id || 'SINDH-ENT').split('').map(char => {
    const code = char.charCodeAt(0);
    if (code % 4 === 0) return 'w-[1.5px]';
    if (code % 4 === 1) return 'w-[3px]';
    if (code % 4 === 2) return 'w-[5px]';
    return 'w-[2px]';
  }).slice(0, 40);

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-50 pb-32">
      {/* Top Header - System Navigation */}
      <div className="w-full max-w-4xl flex items-center justify-between p-6 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-2xl shadow-sm text-[#3B4883] hover:bg-slate-50 transition-all border border-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-[#3B4883]/30 uppercase tracking-[0.2em] leading-none mb-1">Corporate Protocol</p>
            <p className="text-[9px] font-black text-[#3B4883]/60 uppercase tracking-widest leading-none">Access Node: 29.4-S</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#3B4883]/5 flex items-center justify-center">
            <Building size={18} className="text-[#3B4883]/30" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm px-4">
        {/* The Verified Recruiter ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[10px] border-white mb-10"
        >
          {/* Lanyard Slot Visual */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
            <div className="w-10 h-full bg-slate-200 blur-[1px]"></div>
          </div>

          {/* Authority Header */}
          <div className="bg-[#2D3663] pt-14 pb-8 px-8 text-center text-white relative overflow-hidden">
            {/* Architectural grid overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            </div>

            <h2 className="text-2xl font-black tracking-tighter uppercase mb-0.5">SINDH RECRUITER</h2>
            <div className="flex items-center justify-center gap-1.5 opacity-80 uppercase text-[9px] tracking-[0.25em] font-black">
              <ShieldCheck size={12} className="text-[#FF7124]" />
              <span>Industrial Authority System</span>
            </div>
          </div>

          {/* Identity Core */}
          <div className="relative flex flex-col items-center px-10 -mt-16 mb-8 text-center">
            {/* Company Logo / Recruiter Photo */}
            <div className="relative p-1.5 bg-gradient-to-tr from-[#3B4883] to-slate-400 rounded-[2.8rem] shadow-2xl ring-4 ring-white">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white bg-slate-50 flex items-center justify-center">
                {employerData?.logoURL ? (
                  <img src={employerData.logoURL} alt="Company" className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-14 h-14 text-[#3B4883]/10" />
                )}
              </div>
              {/* Status Verification Badge */}
              <div className="absolute -bottom-1.5 -right-1.5 bg-white p-2 rounded-2xl shadow-xl border-2 border-slate-50">
                <CheckCircle size={20} className="text-green-500" />
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-2xl font-black text-[#3B4883] mb-1 uppercase tracking-tight leading-none">
                {employerData?.name || "Premium Recruiter"}
              </h1>
              <p className="text-[#FF7124] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                {employerData?.company?.name || "SINDH PARTNER"}
              </p>

              <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-[#3B4883]/60 uppercase tracking-widest">
                  {employerData?.company?.industry || "Industrial Sector"}
                </span>
              </div>
            </div>
          </div>

          {/* Authorization Merits */}
          <div className="grid grid-cols-2 divide-x divide-slate-50 border-t border-b border-slate-50 py-8 mb-4">
            <div className="px-6 text-center space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Hiring Power</p>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#3B4883] leading-none mb-1">{stats.totalJobs || 0}</span>
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Job Contracts</span>
              </div>
            </div>
            <div className="px-6 text-center space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Platform Age</p>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[#3B4883] leading-none mb-1">{sindhDays || 0}</span>
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Active Days</span>
              </div>
            </div>
          </div>

          {/* Deterministic Corporate Barcode */}
          <div className="bg-slate-50/50 px-10 py-10 flex flex-col items-center relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>

            <div className="w-full bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="flex items-center justify-center gap-0.5 opacity-[0.2] h-10 w-full overflow-hidden">
                {barcodePattern.map((width, i) => (
                  <div key={i} className={`${width} h-full bg-[#2D3663]`} />
                ))}
                {barcodePattern.map((width, i) => (
                  <div key={`dup-${i}`} className={`${width} h-full bg-[#2D3663]`} />
                ))}
              </div>
              <p className="mt-3 text-[9px] text-[#2D3663]/40 font-mono tracking-[0.5em] font-black">
                {employerData?.id?.toUpperCase() || "AUTH-XXXX-XXXX"}
              </p>
            </div>
            <p className="mt-4 text-[7px] text-slate-300 font-black uppercase tracking-[0.4em]">Official SINDH Recruiter ID</p>
          </div>
        </motion.div>

        {/* Dashboard Tabbed Interface */}
        <div className="flex gap-2 p-1.5 bg-[#3B4883]/5 rounded-3xl mb-8 border-2 border-white shadow-sm">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[22px] transition-all relative ${activeTab === tab.id
                  ? 'bg-white text-[#3B4883] shadow-md -translate-y-[1px]'
                  : 'text-[#3B4883]/30 hover:text-[#3B4883]/50'
                  }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#FF7124]' : ''}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-underline-er" className="absolute -bottom-1 w-1 h-1 bg-[#FF7124] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tabbed Content Areas */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Active Now</p>
                    <p className="text-2xl font-black text-[#FF7124]">{stats.activeJobs || 0}</p>
                  </div>
                  <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Hits</p>
                    <p className="text-2xl font-black text-[#3B4883]">{stats.totalApplications || 0}</p>
                  </div>
                </div>

                {/* Corporate Bio */}
                <div className="bg-white p-8 rounded-[2.8rem] border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-200 uppercase tracking-[0.3em] mb-4 flex items-center justify-between">
                    Strategic Mission <Globe size={14} />
                  </h3>
                  <p className="text-sm font-bold text-[#3B4883]/60 leading-relaxed italic">
                    "{employerData?.businessDescription || 'We are building the future of industrial recruitment with SINDH. Our mission is to empower professionals.'}"
                  </p>
                  <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-50">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#3B4883]/40">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Primary Base</p>
                      <p className="text-xs font-black text-[#3B4883] uppercase">{formatLocation(employerData?.location)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {postedJobs.slice(0, 5).map(job => (
                  <div key={job.id} className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm group hover:border-[#3B4883]/10 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-base font-black text-[#3B4883] uppercase leading-tight">{job.title || 'Untitled Role'}</h4>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                          {job.category} • {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-slate-50 px-3 py-1 rounded-full text-[8px] font-black uppercase text-[#3B4883]/40 tracking-widest border border-slate-100">
                        {job.status || 'Active'}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/employer/jobs/${job.id}`)}
                      className="w-full py-3.5 bg-slate-50 text-[#3B4883] rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 group-hover:bg-[#3B4883] group-hover:text-white transition-all shadow-sm"
                    >
                      Recruitment Hub <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
                {postedJobs.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 space-y-4">
                    <Briefcase className="w-12 h-12 text-slate-100 mx-auto" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No active vacancy records</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2.8rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><TrendingUp size={100} /></div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Performance Metrics</h3>
                  <div className="space-y-8">
                    {[
                      { label: 'Hiring Efficiency', value: '94%', color: 'bg-green-500' },
                      { label: 'Market Visibility', value: '78%', color: 'bg-[#FF7124]' },
                      { label: 'Candidate Pulse', value: '82%', color: 'bg-[#3B4883]' }
                    ].map((stat, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-[#3B4883]/60 uppercase tracking-widest">{stat.label}</span>
                          <span className="text-[10px] font-black text-[#3B4883]">{stat.value}</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: stat.value }}
                            transition={{ delay: 0.3 + (i * 0.1), duration: 0.8 }}
                            className={`h-full ${stat.color} rounded-full shadow-sm`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white p-8 rounded-[2.8rem] border border-slate-100 shadow-sm space-y-8">
                <div>
                  <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mb-6">Security & Node Control</p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={toggleLang}
                      className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <Languages size={18} className="text-[#3B4883]/60" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3B4883]">Portal Language</span>
                      </div>
                      <span className="px-3 py-1 bg-[#3B4883] text-white text-[10px] font-black rounded-lg">{isHindi ? 'HI' : 'EN'}</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-5 bg-red-50/50 rounded-2xl text-red-500 hover:bg-red-50 transition-all border border-red-100/30"
                    >
                      <AlertCircle size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest mb-6">Enterprise Credentials</p>
                  <div className="space-y-4 px-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Ref</span>
                      <span className="text-[10px] font-black text-[#3B4883]">{employerData?.phone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Node</span>
                      <span className="text-[10px] font-black text-[#3B4883] lowercase truncate max-w-[150px]">{employerData?.email || "N/A"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/employer/profile/edit')}
                    className="w-full mt-8 h-14 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-[#3B4883]/20 transition-all active:scale-95 border border-white/10"
                  >
                    Modify Enterprise Profile
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Trigger */}
      <div className="fixed bottom-8 z-50 w-full max-w-xs px-4">
        <button
          onClick={() => navigate('/employer/post-job')}
          className="w-full h-16 bg-[#3B4883] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-4 border-4 border-white active:scale-95 transition-all"
        >
          Post Vacancy <Sparkles size={18} className="text-[#FF7124]" />
        </button>
      </div>
    </div>
  );
};

export default EmployerProfile;
