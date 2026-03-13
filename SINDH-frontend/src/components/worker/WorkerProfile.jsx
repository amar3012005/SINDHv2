import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Award, MapPin, FileText, Phone, Mail, Calendar,
  Edit, Settings, Briefcase, TrendingUp, Star,
  CheckCircle, AlertCircle, Eye, Clock,
  Loader, RefreshCw, ArrowLeft, Languages, DollarSign, ShieldCheck,
  MoreHorizontal, Sparkles, ChevronRight
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

  // Calculate SINDH-DAYS
  const joinDate = new Date(formData?.registrationDate || formData?.createdAt?.toDate?.() || formData?.createdAt || Date.now());
  const today = new Date();
  const sindhDays = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));

  // Deterministic Barcode Widths based on Worker ID
  const barcodePattern = (formData?.id || 'SINDH-DEFAULT').split('').map(char => {
    const code = char.charCodeAt(0);
    if (code % 4 === 0) return 'w-[1px]';
    if (code % 4 === 1) return 'w-[2px]';
    if (code % 4 === 2) return 'w-[4px]';
    return 'w-[1.5px]';
  }).slice(0, 40);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pb-24">
      {/* Top Navigation Bar - Clean and Professional */}
      <div className="w-full max-w-4xl flex items-center justify-between p-6 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-2xl shadow-sm text-[#3B4883] hover:bg-gray-50 transition-all border border-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3B4883]/30 mr-2">Official Portal</h2>
          <div className="w-10 h-10 rounded-2xl bg-[#3B4883]/5 flex items-center justify-center">
            <ShieldCheck size={20} className="text-[#3B4883]/20" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm px-4">
        {/* The Professional ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white mb-8"
        >
          {/* Lanyard Punch Hole Visual */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            <div className="w-6 h-full bg-black/5 blur-[1px]"></div>
          </div>

          {/* Top Header - Branding */}
          <div className="bg-[#3B4883] pt-10 pb-6 px-6 text-center text-white relative overflow-hidden">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full rotate-12"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full -rotate-12"></div>
            </div>

            <h2 className="text-2xl font-black tracking-tighter uppercase mb-0.5">SINDH PROFESSIONAL</h2>
            <div className="flex items-center justify-center gap-1.5 opacity-90 uppercase text-[9px] tracking-[0.2em] font-black">
              <ShieldCheck size={12} className="text-green-400" />
              <span>Verified Identity System</span>
            </div>
          </div>

          {/* Profile Identity Section */}
          <div className="relative flex flex-col items-center px-8 -mt-12 mb-6">
            {/* Avatar with ShaktiScore Merit Badge */}
            <div className="relative p-1.5 bg-gradient-to-tr from-[#FF7124] to-yellow-400 rounded-full shadow-2xl ring-4 ring-white">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-100 flex items-center justify-center text-[#3B4883]/20">
                {formData?.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt="Worker"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={64} strokeWidth={1.5} />
                )}
              </div>
              {/* Floating Merit Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="absolute -bottom-1 -right-1 bg-white px-3 py-1.5 rounded-2xl shadow-xl border-2 border-[#FF7124]/10 flex items-center gap-1.5 min-w-[70px] justify-center"
              >
                <Award size={14} className="text-[#FF7124]" />
                <span className="text-lg font-black text-[#3B4883] leading-none">{shaktiScore || 0}</span>
              </motion.div>
            </div>

            <div className="text-center mt-6">
              <h1 className="text-2xl font-black text-[#3B4883] uppercase tracking-tight">{formData?.name || "Worker Name"}</h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-4 py-1.5 bg-[#FF7124] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-[#FF7124]/20">
                  {formData?.preferredCategory || "General Labor"}
                </span>
                {formData?.verificationStatus === 'verified' && (
                  <div className="bg-green-500 p-1 rounded-full text-white shadow-md">
                    <CheckCircle size={14} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Identity Details Grid */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-b border-gray-100 py-6 mb-2">
            <div className="px-6 space-y-1">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">SINDH-DAYS</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-[#FF7124]">
                  <Calendar size={16} />
                </div>
                <span className="text-lg font-black text-[#3B4883]">{sindhDays || 0} Days</span>
              </div>
            </div>

            <div className="px-6 space-y-1">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">Origin</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-[#3B4883]">
                  <MapPin size={16} />
                </div>
                <span className="text-sm font-black text-[#3B4883] truncate pr-2">
                  {formData?.location?.city || formData?.location?.district || "Sindh, IN"}
                </span>
              </div>
            </div>
          </div>

          {/* The Verification Barcode - Encoded with Worker ID */}
          <div className="bg-gray-50/80 px-8 py-8 flex flex-col items-center relative">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            <div className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="flex items-center justify-center gap-0.5 overflow-hidden opacity-50 h-10 w-full">
                {barcodePattern.map((width, i) => (
                  <div key={i} className={`${width} h-full bg-[#3B4883]`} />
                ))}
                {/* Repeat for full width if needed */}
                {barcodePattern.map((width, i) => (
                  <div key={`dup-${i}`} className={`${width} h-full bg-[#3B4883]`} />
                ))}
              </div>
              <p className="mt-2 text-[9px] text-[#3B4883]/40 font-mono tracking-[0.5em] font-bold uppercase">
                {formData?.id?.toUpperCase() || "SINDH-XXXX-XXXX"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex gap-2 p-1.5 bg-[#3B4883]/5 rounded-3xl mb-8 border-2 border-white shadow-sm">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[20px] transition-all relative ${activeTab === tab.id
                  ? 'bg-white text-[#3B4883] shadow-md -translate-y-[1px]'
                  : 'text-[#3B4883]/30 hover:text-[#3B4883]/50'
                  }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#FF7124]' : ''}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-underline" className="absolute -bottom-1.5 w-1 h-1 bg-[#FF7124] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Dashboard Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 gap-6">
                {/* Highlights Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest mb-1">Total Jobs</p>
                    <p className="text-2xl font-black text-[#3B4883]">{stats.completedJobs || 0}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest mb-1">Active Now</p>
                    <p className="text-2xl font-black text-[#FF7124]">{stats.activeJobs || 0}</p>
                  </div>
                </div>

                {/* About Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center"><FileText size={16} className="text-[#FF7124]" /></div>
                    Professional Bio
                  </h3>
                  <p className="text-sm font-bold text-[#3B4883]/60 leading-relaxed italic">
                    "{formData?.bio || 'Passionate about quality work and contributing to India\'s progress through SINDH.'}"
                  </p>

                  <div className="h-px bg-gray-50 my-6"></div>

                  <h3 className="text-xs font-black text-[#3B4883] uppercase tracking-[0.2em] mb-4">Core Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(formData?.skills || ['General Labor', 'Willing to Learn']).map((skill, i) => (
                      <span key={i} className="px-4 py-1.5 bg-gray-50 text-[10px] font-black uppercase text-[#3B4883]/70 rounded-xl border border-gray-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-white p-6 rounded-[2.2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-base font-black text-[#3B4883] uppercase">{app.jobSnippet?.title || 'Employment Record'}</h4>
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">{app.jobSnippet?.category} • ID: {app.id?.slice(-8).toUpperCase()}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${app.status === 'accepted' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-[#FF7124]'
                        }`}>
                        {app.status || 'Applied'}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/worker/applications`)}
                      className="w-full py-3.5 bg-gray-50 text-[#3B4883] rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 group-hover:bg-[#3B4883] group-hover:text-white transition-all"
                    >
                      Manage Details <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
                    <Briefcase className="w-12 h-12 text-[#3B4883]/10 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-[#3B4883]/30 uppercase tracking-widest">No active applications</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="bg-[#3B4883] p-10 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-[#3B4883]/10">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={80} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Available Funds</p>
                  <p className="text-4xl font-black mb-8">₹{formData?.wallet?.withdrawableBalance || 0}</p>
                  <button
                    onClick={() => navigate('/worker/wallet')}
                    className="w-full h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    <TrendingUp size={16} /> Withdraw To Bank
                  </button>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest mb-6">Security Checkpoints</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'KYC Verified', status: formData?.verificationStatus === 'verified' },
                      { label: 'Bank Linked', status: !!formData?.bankDetails },
                      { label: 'Mobile Secure', status: true }
                    ].map((step, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#3B4883]/70 uppercase">{step.label}</span>
                        {step.status ? (
                          <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                            <CheckCircle size={14} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                            <AlertCircle size={14} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                <div>
                  <p className="text-[10px] font-black text-[#3B4883]/20 uppercase tracking-widest mb-6">Account Control</p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={toggleLang}
                      className="w-full flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <Languages size={18} className="text-[#3B4883]/60" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3B4883]">Preferred Language</span>
                      </div>
                      <span className="px-3 py-1 bg-[#3B4883] text-white text-[10px] font-black rounded-lg">{isHindi ? 'HINDI' : 'ENGLISH'}</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-5 bg-red-50/50 rounded-2xl text-red-500 hover:bg-red-50 transition-all border border-red-100/30"
                    >
                      <AlertCircle size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Secure Sign Out</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-black text-[#3B4883]/20 uppercase tracking-widest mb-6">Professional Info</p>
                  <div className="space-y-4">
                    <div className="space-y-1.5 px-2">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Official Email</p>
                      <p className="text-xs font-bold text-[#3B4883]">{formData?.email || 'Not verified'}</p>
                    </div>
                    <div className="space-y-1.5 px-2">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Verified Phone</p>
                      <p className="text-xs font-bold text-[#3B4883]">{formData?.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/worker/profile/edit')}
                    className="w-full mt-8 py-4 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-[#3B4883]/20 transition-all active:scale-95"
                  >
                    Edit Professional Details
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Persistent Action Bar for Work */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs z-50">
        <button
          onClick={() => navigate('/jobs')}
          className="w-full h-16 bg-[#3B4883] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-4 border-4 border-white active:scale-95 transition-all"
        >
          Browse Work <Sparkles size={18} className="text-[#FF7124]" />
        </button>
      </div>
    </div>
  );
};

export default WorkerProfile;
