import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, DollarSign, Clock, Users, Building, Search, Filter, ArrowRight } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { getApiUrlSync } from '../../config/api.js';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const jobCategories = [
  { id: 'all', name: 'All', icon: '🔍', nameHi: 'सभी' },
  { id: 'Construction', name: 'Construction', icon: '🏗️', nameHi: 'निर्माण' },
  { id: 'Agriculture', name: 'Agriculture', icon: '🌾', nameHi: 'कृषि' },
  { id: 'Domestic', name: 'Domestic', icon: '🏠', nameHi: 'घरेलू' },
  { id: 'Transportation', name: 'Transportation', icon: '🚚', nameHi: 'परिवहन' },
  { id: 'Manufacturing', name: 'Manufacturing', icon: '🏭', nameHi: 'विनिर्माण' },
  { id: 'Retail', name: 'Retail', icon: '🛍️', nameHi: 'खुदरा' },
];

export default function FindWork() {
  const navigate = useNavigate();
  const { user, isPhase1Worker } = useUser();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPhase2Modal, setShowPhase2Modal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Real-time Jobs Listener (Phase 4)
  useEffect(() => {
    setLoading(true);
    setError(null);
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef);

    console.log("📡 Setting up real-time jobs listener in FindWork...");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const activeJobs = allJobs.filter(job => ['active', 'POSTED', 'APPLIED'].includes(job.status));

      console.log("🔥 Real-time jobs update:", activeJobs.length);
      setJobs(activeJobs);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("❌ Jobs listener error:", err);
      setError("Failed to load real-time jobs");
      setLoading(false);
      toast.error('कनक्शॅन एरर (Connection Error)');
    });

    return () => unsubscribe();
  }, [retryTrigger]);


  const handleApplyNow = async (job) => {
    if (!user) {
      toast.error('कृपया पहले लॉगिन करें');
      navigate('/worker/login');
      return;
    }

    // Check if Phase-1 worker (show stub for now)
    if (isPhase1Worker && isPhase1Worker()) {
      setSelectedJob(job);
      setShowPhase2Modal(true);
      return;
    }

    // TODO: Implement actual job application
    toast.success('जल्द ही उपलब्ध होगा!');
  };

  const handlePhase2Redirect = () => {
    setShowPhase2Modal(false);
    navigate('/worker/phase-2');
  };

  const filteredJobs = jobs.filter(job => {
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesSearch =
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.state?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white relative overflow-hidden devanagari">
      {/* Background aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)' }}
        />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-[#E8DFD5] rounded-full blur-[80px] opacity-40" />
        <div className="absolute bottom-40 left-20 w-[200px] h-[200px] bg-[#DBBBA7] rounded-full blur-[80px] opacity-30" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#3B4883]/10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1
              onClick={() => navigate('/home')}
              className="text-4xl font-extrabold text-[#3B4883] cursor-pointer hover:opacity-80 transition-all tracking-tight"
            >
              SINDH
            </h1>
            <div className="h-8 w-px bg-[#3B4883]/10 hidden md:block"></div>
            <div className="hidden md:block">
              <h2 className="text-sm font-black text-[#202124] uppercase tracking-widest">नौकरी खोजें</h2>
              <p className="text-[10px] text-[#202124]/40 font-bold uppercase tracking-widest">Find your next opportunity</p>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-[#202124]/40 uppercase tracking-widest leading-none mb-1">Worker Access</p>
                <p className="text-sm font-bold text-[#3B4883]">{user.name}</p>
              </div>
              <div className="w-10 h-10 bg-[#FF7124] rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                {user.name?.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-[#3B4883]/10 p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF7124]" />
                <input
                  type="text"
                  placeholder="पद का नाम, कौशल या स्थान खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-[#3B4883]/5 border-2 border-[#3B4883]/5 rounded-2xl text-[#202124] font-bold placeholder-[#202124]/30 focus:outline-none focus:border-[#FF7124]/30 focus:bg-white transition-all shadow-inner"
                />
              </div>
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3B4883]" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-14 pr-10 py-4 bg-[#3B4883]/5 border-2 border-[#3B4883]/5 rounded-2xl text-[#3B4883] font-black uppercase tracking-widest text-xs focus:outline-none focus:border-[#FF7124]/30 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner"
                >
                  {jobCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.nameHi} ({category.name})
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#3B4883]/30">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-1.5 bg-[#FF7124] rounded-full"></div>
            <h2 className="text-2xl font-black text-[#3B4883] uppercase tracking-wide">लोकप्रिय श्रेणियाँ</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {jobCategories.map(category => (
              <motion.button
                key={category.id}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-6 rounded-3xl text-center transition-all duration-300 border-2 ${selectedCategory === category.id
                  ? 'bg-[#3B4883] border-[#3B4883] text-white shadow-2xl translate-y-[-4px]'
                  : 'bg-white border-[#3B4883]/5 text-[#3B4883] hover:border-[#FF7124]/30 hover:shadow-xl'
                  }`}
              >
                <div className={`text-3xl mb-3 ${selectedCategory === category.id ? 'scale-110' : ''} transition-transform`}>{category.icon}</div>
                <div className={`font-black text-[10px] uppercase tracking-widest ${selectedCategory === category.id ? 'text-white' : 'text-[#3B4883]/60'}`}>{category.nameHi}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#FF7124] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
          >
            <p className="text-red-600 font-medium">❌ {error}</p>
            <button
              onClick={() => setRetryTrigger(prev => prev + 1)}
              className="mt-4 px-6 py-2 bg-[#FF7124] text-white rounded-lg hover:bg-[#e66420] transition-colors"
            >
              फिर से प्रयास करें
            </button>
          </motion.div>
        )}

        {/* Job Listings */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-1.5 bg-[#FF7124] rounded-full"></div>
                <h2 className="text-2xl font-black text-[#3B4883] uppercase tracking-wide">
                  उपलब्ध नौकरियां <span className="text-[#FF7124] ml-2">({filteredJobs.length})</span>
                </h2>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#3B4883]/10 p-12 text-center">
                <Briefcase className="w-16 h-16 text-[#202124]/20 mx-auto mb-4" />
                <p className="text-[#202124]/60 text-lg">कोई नौकरी नहीं मिली</p>
                <p className="text-[#202124]/40 text-sm mt-2">अलग श्रेणी या खोज शब्द आज़माएं</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AnimatePresence>
                  {filteredJobs.map((job, index) => (
                    <motion.div
                      key={job._id || job.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-[2rem] border border-[#3B4883]/10 overflow-hidden shadow-xl hover:shadow-2xl hover:border-[#FF7124]/30 transition-all duration-500 group flex flex-col"
                    >
                      <div className="p-8 flex-1">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#3B4883] to-[#272D4E] rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                            <Briefcase className="w-8 h-8 text-[#FF7124]" />
                          </div>
                          <div className="px-4 py-1.5 bg-[#3B4883]/5 rounded-xl border border-[#3B4883]/10 text-[#3B4883] text-[10px] font-black uppercase tracking-widest">
                            {job.category || 'General'} Expert
                          </div>
                        </div>

                        <h3 className="text-2xl font-black text-[#3B4883] mb-2 group-hover:text-[#FF7124] transition-colors leading-tight">
                          {job.title}
                        </h3>
                        <p className="text-[#202124]/40 text-xs font-black uppercase tracking-widest mb-6">
                          {job.companyName || 'Verified Employer'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-[#3B4883]/5 p-4 rounded-2xl border border-[#3B4883]/5">
                            <p className="text-[8px] font-black text-[#202124]/30 uppercase tracking-widest mb-1">Salary</p>
                            <p className="text-[#3B4883] font-black text-lg">₹{job.salary?.toLocaleString('en-IN')}</p>
                            <p className="text-[8px] font-black text-[#FF7124] uppercase tracking-tighter">Per Month</p>
                          </div>
                          <div className="bg-[#3B4883]/5 p-4 rounded-2xl border border-[#3B4883]/5">
                            <p className="text-[8px] font-black text-[#202124]/30 uppercase tracking-widest mb-1">Location</p>
                            <p className="text-[#3B4883] font-black text-lg truncate">{job.location?.city}</p>
                            <p className="text-[8px] font-black text-[#FF7124] uppercase tracking-tighter">{job.location?.state}</p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-8">
                          <div className="flex items-center gap-3 text-[#202124]/60">
                            <Clock className="w-4 h-4 text-[#FF7124]" />
                            <span className="text-xs font-bold uppercase tracking-wider">{job.employmentType || 'Full-time daily work'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[#202124]/60">
                            <MapPin className="w-4 h-4 text-[#3B4883]" />
                            <span className="text-xs font-bold uppercase tracking-wider">{job.location?.city}, {job.location?.state}</span>
                          </div>
                        </div>

                        <div className="bg-[#E8DFD5]/30 p-5 rounded-2xl border border-[#3B4883]/5 min-h-[100px]">
                          <p className="text-[#202124]/70 text-sm font-medium leading-relaxed italic">
                            "{job.description}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyNow(job)}
                        className="w-full py-6 bg-[#3B4883] text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-[#272D4E] transition-all flex items-center justify-center gap-3 group/btn"
                      >
                        आवेदन करें
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform text-[#FF7124]" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Phase-2 Modal (Stub) */}
      <AnimatePresence>
        {showPhase2Modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPhase2Modal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[#3B4883]/20"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#FF7124] to-[#e66420] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-[#202124] mb-3">
                  अपनी प्रोफ़ाइल पूरी करें
                </h3>
                <p className="text-[#202124]/70 mb-6">
                  नौकरी के लिए आवेदन करने से पहले, कृपया अपनी प्रोफ़ाइल को Phase-2 में पूरा करें।
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handlePhase2Redirect}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    प्रोफ़ाइल पूरी करें
                  </button>
                  <button
                    onClick={() => setShowPhase2Modal(false)}
                    className="flex-1 px-6 py-3 bg-white border-2 border-[#3B4883]/20 text-[#202124] rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    बाद में
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .devanagari { font-family: 'Noto Sans Devanagari', 'Inter', sans-serif; }
      `}</style>
    </div>
  );
} 