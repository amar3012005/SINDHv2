import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Award, MapPin, FileText, Phone, Mail, Calendar,
  Edit, Settings, Briefcase, TrendingUp, Star,
  CheckCircle, AlertCircle, Eye, Clock,
  Loader, RefreshCw, ArrowLeft, Languages, DollarSign, Shield,
  MoreHorizontal, Sparkles
} from 'lucide-react';
import { UserContext } from '../../context/UserContext';
import { db } from '../../config/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { logout as authLogout } from '../../utils/authUtils';

const WorkerProfile = () => {
  const { user, logoutUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  const [shaktiScore, setShaktiScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeJobs: 0,
    completedJobs: 0,
    averageRating: 0
  });

  const [formData, setFormData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);

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

  const getWorkerId = useCallback(() => {
    if (user?.type === 'worker' && (user.id || user._id)) return user.id || user._id;
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.type === 'worker') return parsed.id || parsed._id;
      } catch (e) { }
    }
    return localStorage.getItem('workerId');
  }, [user]);

  useEffect(() => {
    const workerId = getWorkerId();
    if (!workerId) {
      setError('Worker ID not found. Please login again.');
      setIsLoading(false);
      return;
    }

    console.log('📡 Setting up real-time listeners for WorkerProfile:', workerId);
    setIsLoading(true);

    // 1. Worker Profile Listener
    const workerRef = doc(db, 'workers', workerId);
    const unsubscribeProfile = onSnapshot(workerRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('👤 Worker profile updated:', data);
        setFormData({ ...data, id: docSnap.id, _id: docSnap.id });
        setShaktiScore(calculateShaktiScore(data));
        setIsLoading(false);
      } else {
        setError('Profile not found in Firestore.');
        setIsLoading(false);
      }
    }, (err) => {
      console.error('❌ Profile listener error:', err);
      setError(err.message);
      setIsLoading(false);
    });

    // 2. Applications Listener
    const appsQuery = query(collection(db, 'applications'), where('worker', '==', workerId));
    const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
      const allApps = snapshot.docs.map(d => ({ ...d.data(), id: d.id, _id: d.id }));
      setApplications(allApps);

      const completed = allApps.filter(a => ['completed', 'paid', 'finished'].includes(a.status?.toLowerCase()));
      setCompletedJobs(completed);

      setStats(prev => ({
        ...prev,
        totalApplications: allApps.length,
        activeJobs: allApps.filter(a => ['accepted', 'working', 'applied'].includes(a.status?.toLowerCase())).length,
        completedJobs: completed.length
      }));
    }, (err) => {
      console.error('❌ Applications listener error:', err);
    });

    // 3. Reviews Listener (Phase 4)
    const reviewsRef = collection(db, 'workers', workerId, 'reviews');
    const unsubscribeReviews = onSnapshot(reviewsRef, (snapshot) => {
      const reviews = snapshot.docs.map(d => d.data());
      console.log('🌟 Reviews updated:', reviews.length);
      // Calculate average if needed, or rely on the aggregated 'rating.average' from the main profile doc
      // But if we want instant feedback from a new review before aggregation runs:
      if (reviews.length > 0) {
        const avg = reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length;
        setStats(prev => ({
          ...prev,
          averageRating: avg,
          reviewCount: reviews.length
        }));
      }
    }, (err) => console.error("❌ Reviews listener error:", err));

    return () => {
      unsubscribeProfile();
      unsubscribeApps();
      unsubscribeReviews();
    };
  }, [getWorkerId]);

  const calculateShaktiScore = (data) => {
    let score = 30; // Base score
    if (data.name) score += 10;
    if (data.skills?.length > 0) score += 20;
    if (data.verificationStatus === 'verified') score += 20;
    if (data.completedJobs > 0) score += 20;
    return Math.min(score, 100);
  };

  const handleLogout = () => {
    authLogout();
    logoutUser();
    navigate('/');
  };

  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase() : 'WR';

  const formatLocation = (loc) => {
    if (!loc) return 'Location not specified';
    if (typeof loc === 'string') return loc;
    return [loc.village, loc.district, loc.state].filter(Boolean).join(', ') || 'Location not specified';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-12 h-12 text-[#FF7124] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-[#3B4883] mb-2 uppercase tracking-tighter">Profile Error</h3>
          <p className="text-sm font-bold text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/login')} className="w-full h-14 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">Login Again</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'applications', label: 'Work', icon: Briefcase },
    { id: 'wallet', label: 'Wallet', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans pb-20 select-none">
      {/* Background Aesthetics */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% 0%, rgba(59, 72, 131, 0.08), transparent 70%)' }} />
        <div className="absolute top-20 right-[10%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 bg-[#E8DFD5]" />
        <div className="absolute bottom-40 left-[10%] w-[250px] h-[250px] rounded-full blur-[100px] opacity-30 bg-[#DBBBA7]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-10">
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

        {/* Profile Identity Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-2 border-[#3B4883]/5 rounded-[40px] p-8 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <User className="w-48 h-48 text-[#3B4883]" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-[#FF7124] to-[#e66420] rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-[#FF7124]/20 rotate-3">
                {getInitials(formData?.name)}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-black text-[#272D4E] uppercase tracking-tight">{formData?.name}</h1>
                <span className="px-3 py-1 bg-[#FF7124]/10 text-[#FF7124] text-[10px] font-black rounded-full border border-[#FF7124]/20 uppercase tracking-widest">
                  {formData?.preferredCategory} Expert
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-[#272D4E]/40 uppercase tracking-widest mb-6">
                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#FF7124]" /> {formatLocation(formData?.location)}</span>
                <span className="flex items-center gap-1.5"><Star className="w-3 h-3 text-[#FF7124] fill-[#FF7124]" /> {formData?.rating?.average?.toFixed(1) || '5.0'} Rating</span>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <button onClick={() => navigate('/worker/profile/edit')} className="h-12 px-6 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-[#3B4883]/20 transition-all active:scale-95">
                  <Edit className="w-4 h-4" /> Edit Profile
                </button>
                <button onClick={() => navigate('/jobs')} className="h-12 px-6 bg-white border-2 border-[#3B4883]/10 text-[#3B4883] rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all active:scale-95">
                  <Briefcase className="w-4 h-4" /> Find Work
                </button>
              </div>
            </div>

            <div className="bg-[#3B4883]/5 border-2 border-[#3B4883]/5 rounded-[32px] p-6 text-center min-w-[160px]">
              <p className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest mb-1">Shakti Score</p>
              <span className="text-4xl font-black text-[#FF7124]">{shaktiScore}</span>
              <p className="text-[9px] font-bold text-green-600 uppercase mt-2">Verified Professional</p>
            </div>
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
                      About Me
                    </h3>
                    <p className="text-sm font-bold text-[#272D4E]/70 leading-relaxed">
                      {formData?.bio || 'No bio provided yet. Add a professional summary to attract better employers.'}
                    </p>
                  </div>

                  <div className="bg-white border-2 border-[#3B4883]/5 rounded-[32px] p-8 shadow-xl">
                    <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#3B4883]/5 rounded-xl flex items-center justify-center"><Award className="w-4 h-4 text-[#3B4883]" /></div>
                      Skills & Experience
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {formData?.skills?.map((skill, i) => (
                        <span key={i} className="px-4 py-2 bg-white border-2 border-[#3B4883]/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#3B4883] hover:border-[#FF7124]/30 transition-all">{skill}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-[#3B4883]/5 rounded-2xl">
                        <p className="text-[8px] font-black text-[#3B4883]/40 uppercase tracking-widest mb-1">Experience</p>
                        <p className="text-sm font-black text-[#272D4E] uppercase">{formData?.experience || 'Beginner'}</p>
                      </div>
                      <div className="p-5 bg-[#3B4883]/5 rounded-2xl">
                        <p className="text-[8px] font-black text-[#3B4883]/40 uppercase tracking-widest mb-1">Daily Wage</p>
                        <p className="text-sm font-black text-[#FF7124]">{formData?.expectedSalary || 'Negotiable'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white border-2 border-[#3B4883]/5 rounded-[32px] p-8 shadow-xl">
                    <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-6">Profile Health</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-[#3B4883]/40 uppercase">Completion</span>
                      <span className="text-sm font-black text-[#FF7124]">85%</span>
                    </div>
                    <div className="h-2 w-full bg-[#3B4883]/5 rounded-full overflow-hidden mb-6">
                      <div className="h-full bg-gradient-to-r from-[#FF7124] to-[#e66420]" style={{ width: '85%' }} />
                    </div>
                    <div className="space-y-3">
                      {['Identity Verified', 'Phone Active', 'Location Set'].map((c, i) => (
                        <div key={i} className="flex items-center gap-3 text-[10px] font-black text-[#272D4E]/60 uppercase tracking-widest">
                          <CheckCircle className="w-4 h-4 text-green-500" /> {c}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#3B4883] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-[#3B4883]/20">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign className="w-20 h-20" /></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Available Balance</p>
                    <p className="text-4xl font-black mb-6">₹{formData?.wallet?.withdrawableBalance || 0}</p>
                    <button onClick={() => navigate('/worker/wallet')} className="w-full h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Go to Wallet</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-6">
                {applications.map(app => (
                  <div key={app.id} className="bg-white border-2 border-[#3B4883]/5 rounded-[32px] p-8 shadow-xl hover:border-[#FF7124]/30 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-black text-[#272D4E] uppercase group-hover:text-[#FF7124] transition-colors">{app.jobSnippet?.title || 'Job Post'}</h4>
                        <p className="text-[10px] font-bold text-[#3B4883]/40 uppercase tracking-widest">{app.jobSnippet?.category} • Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${app.status === 'accepted' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => navigate(`/worker/applications`)} className="flex-1 h-14 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#3B4883]/10">View Details</button>
                      <button className="px-6 h-14 bg-white border-2 border-[#3B4883]/10 text-[#3B4883] rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors"><Mail className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="text-center py-20 bg-white border-2 border-dashed border-[#3B4883]/10 rounded-[40px]">
                    <Briefcase className="w-16 h-16 text-[#3B4883]/10 mx-auto mb-4" />
                    <p className="text-sm font-black text-[#3B4883]/30 uppercase tracking-[0.2em]">No applications yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="bg-white border-2 border-[#3B4883]/5 rounded-[40px] p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest mb-1">Total Earnings</p>
                    <p className="text-5xl font-black text-[#272D4E]">₹{formData?.wallet?.totalEarnings || 0}</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => navigate('/worker/wallet')} className="h-16 px-10 bg-[#FF7124] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#FF7124]/20 transition-all active:scale-95">Withdraw Cash</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest px-4">Recent Transactions</h4>
                  <div className="text-center py-12 text-[10px] font-black text-[#3B4883]/20 uppercase tracking-widest">Transaction history shown in Wallet tab</div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white border-2 border-[#3B4883]/5 rounded-[40px] p-8 shadow-xl">
                <div className="max-w-2xl mx-auto space-y-8">
                  <div>
                    <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-6">Account Settings</h3>
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#3B4883]/60 uppercase tracking-widest px-4">Full Name</label>
                        <div className="w-full h-16 bg-[#3B4883]/5 rounded-2xl flex items-center px-6 text-sm font-bold text-[#272D4E] border-2 border-transparent">{formData?.name}</div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#3B4883]/60 uppercase tracking-widest px-4">Verified Phone</label>
                        <div className="w-full h-16 bg-[#3B4883]/5 rounded-2xl flex items-center px-6 text-sm font-bold text-[#272D4E] border-2 border-transparent">{formData?.phone}</div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full h-16 bg-[#3B4883]/5 text-[#3B4883] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#3B4883]/10 transition-all">Edit Professional Details</button>
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
