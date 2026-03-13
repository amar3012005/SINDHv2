import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';
import { db } from '../../config/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import {
  MapPin,
  Building,
  AlertCircle,
  ChevronRight,
  Wallet,
  Clock,
  CheckCircle2,
  X,
  CreditCard,
  DollarSign
} from 'lucide-react';

const MyApplications = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  // State
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [selectedApp, setSelectedApp] = useState(null);

  const filters = [
    { id: 'all', label: 'ALL' },
    { id: 'applied', label: 'ACTIVE' },
    { id: 'completed', label: 'COMPLETED' }
  ];

  // Real-time Listeners
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);

    // 1. Listen to worker document for balance changes
    const workerDocRef = doc(db, 'workers', user.id);
    const unsubscribeWorker = onSnapshot(workerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const workerData = docSnap.data();
        setWalletBalance(workerData.wallet?.totalBalance || workerData.balance || 0);
      }
    }, (err) => {
      console.error("Error listening to worker doc:", err);
    });

    // 2. Listen to applications collection
    const appsQuery = query(
      collection(db, 'applications'),
      where('worker', '==', user.id)
    );

    const unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
      const allApps = snapshot.docs.map(doc => {
        const data = doc.data();
        const jobInfo = data.jobSnippet || data.job || {};
        return {
          ...data,
          _id: doc.id,
          id: doc.id,
          // Robust display fields
          displayTitle: jobInfo.title || 'Job Title',
          displayCompany: jobInfo.companyName || 'Unknown Company',
          displaySalary: data.paymentAmount || jobInfo.salary || jobInfo.baseAmount || 0,
          displayLocation: jobInfo.location?.village || jobInfo.location?.district || jobInfo.location?.city || 'On-site'
        };
      });

      setApplications(allApps);

      // Sync appliedJobIds to localStorage
      try {
        const applicationIds = allApps.map(app => app._id).filter(Boolean);
        localStorage.setItem('appliedJobIds', JSON.stringify(applicationIds));
      } catch (e) {
        console.warn('⚠️ Could not sync to localStorage:', e);
      }

      // Calc total earnings (paid ones)
      const total = allApps
        .filter(a => a.paymentStatus === 'paid' || a.status?.toUpperCase() === 'PAID')
        .reduce((sum, a) => sum + (a.paymentAmount || a.jobSnippet?.salary || a.job?.salary || a.job?.baseAmount || 0), 0);
      setTotalEarnings(total);

      setLoading(false);
    }, (error) => {
      console.error('Error listening to applications:', error);
      toast.error('Could not load applications in real-time');
      setLoading(false);
    });

    return () => {
      unsubscribeWorker();
      unsubscribeApps();
    };
  }, [user]);

  // Handle Filtering
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredApps(applications);
    } else if (selectedFilter === 'applied') {
      setFilteredApps(applications.filter(app =>
        ['applied', 'accepted', 'working', 'in-progress', 'payment_pending', 'pending'].includes(app.status?.toLowerCase())
      ));
    } else if (selectedFilter === 'completed') {
      setFilteredApps(applications.filter(app =>
        ['completed', 'paid', 'finished'].includes(app.status?.toLowerCase())
      ));
    }
  }, [selectedFilter, applications]);

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    let config = { label: status, color: 'bg-slate-100 text-slate-600' };

    if (s === 'POSTED' || s === 'APPLIED') {
      config = { label: 'Applied', color: 'bg-blue-50 text-blue-600 border-blue-100' };
    } else if (s === 'ACCEPTED') {
      config = { label: 'Accepted', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    } else if (s === 'WORKING') {
      config = { label: 'Working', color: 'bg-orange-50 text-orange-600 border-orange-100' };
    } else if (s === 'PAYMENT_PENDING') {
      config = { label: 'Payment Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    } else if (s === 'COMPLETED' || s === 'FINISHED') {
      config = { label: 'Completed', color: 'bg-purple-50 text-purple-600 border-purple-100' };
    } else if (s === 'PAID') {
      config = { label: 'Paid', color: 'bg-green-50 text-green-600 border-green-100' };
    }

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Distance calculation (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleStartWork = async (e, applicationId) => {
    e.stopPropagation(); // Prevent opening modal
    try {
      const response = await fetch(buildApiUrl(`/job-applications/${applicationId}/start-work`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('🚀 Work started!');
        if (selectedApp && selectedApp._id === applicationId) {
          setSelectedApp({ ...selectedApp, status: 'working' });
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to start work');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to start work');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-[#3B4883]/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF7124] rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#202124] relative pb-28">
      {/* Background matching AvailableJobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-100"
          style={{ background: 'radial-gradient(1200px 600px at 50% 0%, rgba(59, 72, 131, 0.08), transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Compact Wallet Header */}
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-black text-[#3B4883] tracking-tight uppercase">
              |MY_APPLICATIONS
            </h1>
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border-2 border-[#3B4883]/10 rounded-2xl px-4 py-2 shadow-sm">
              <Wallet className="w-4 h-4 text-[#FF7124]" />
              <div>
                <p className="text-[10px] font-bold text-[#3B4883]/60 uppercase leading-none mb-1">Balance</p>
                <p className="text-sm font-black text-[#3B4883]">₹{walletBalance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 mb-4">
          <div className="flex gap-0 border-2 border-[#3B4883]/20 bg-[#3B4883]/5 rounded-sm overflow-hidden">
            {filters.map((filter, index) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex-1 px-2 py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${selectedFilter === filter.id
                  ? 'bg-white text-[#3B4883] border-b-4 border-[#FF7124]'
                  : 'text-[#202124]/60 hover:bg-white hover:text-[#3B4883]'
                  } ${index !== 0 ? 'border-l-2 border-[#3B4883]/20' : ''}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Section */}
        <div className="px-6">
          {filteredApps.length === 0 ? (
            <div className="text-center py-20 opacity-60">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[#3B4883] font-bold">No applications found</p>
              <button
                onClick={() => navigate('/jobs')}
                className="mt-4 text-sm font-bold text-[#FF7124] hover:underline"
              >
                Browse Available Jobs
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredApps.map((app, index) => (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-[#3B4883]/10 py-5 hover:bg-[#E8DFD5]/20 transition-all cursor-pointer group"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-4">
                      <h3 className="text-base font-bold text-[#272D4E] uppercase tracking-wide group-hover:text-[#FF7124] transition-colors line-clamp-1">
                        {app.displayTitle}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 font-medium text-[#3B4883]/60 text-xs text-green-600">
                          <MapPin className="w-3 h-3" />
                          <span>{app.displayLocation}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-[#3B4883]/60 text-xs">
                          <Building className="w-3 h-3 text-[#3B4883]/40" />
                          <span>{app.displayCompany}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[#FF7124] block">
                        ₹{app.displaySalary}
                      </span>
                      <div className="mt-1 flex justify-end">
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-[#202124]/40 uppercase tracking-widest mt-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{(() => {
                          try {
                            const d = app.appliedAt?.toDate ? app.appliedAt.toDate() : (app.createdAt?.toDate ? app.createdAt.toDate() : new Date(app.appliedAt || app.createdAt || Date.now()));
                            return d.toLocaleDateString();
                          } catch (e) {
                            return 'Recently';
                          }
                        })()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#FF7124]">
                        <span className="font-bold">
                          {(() => {
                            const workerCoords = user?.location?.coordinates?.coordinates || user?.location?.coordinates;
                            const jobJob = app.jobSnippet || app.job || {};
                            const jobCoords = jobJob.location?.coordinates?.coordinates || jobJob.location?.coordinates;

                            if (workerCoords && jobCoords) {
                              const [wLon, wLat] = workerCoords;
                              const [jLon, jLat] = Array.isArray(jobCoords.coordinates) ? jobCoords.coordinates : (jobCoords.lat ? [jobCoords.lon, jobCoords.lat] : jobCoords);
                              const dist = calculateDistance(wLat, wLon, jLat, jLon);
                              return dist !== null ? `📍 ${dist.toFixed(1)} km away` : null;
                            }
                            return null;
                          })()}
                        </span>
                      </div>
                    </div>
                    {['accepted'].includes(app.status?.toLowerCase()) &&
                      new Date(app.job?.startDate) <= new Date() ? (
                      <button
                        onClick={(e) => handleStartWork(e, app._id)}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-bold uppercase text-[10px] tracking-wider hover:bg-green-700 transition-all active:scale-95 shadow-sm"
                      >
                        🚀 START WORK
                      </button>
                    ) : (
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aesthetic Modal Template to match style */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              className="absolute inset-0 bg-[#3B4883]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl relative overflow-hidden"
            >
              {/* Refined Header Card */}
              <div className="relative bg-gradient-to-br from-[#E8DFD5] to-[#DBBBA7] p-8 pb-10">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors z-20"
                >
                  <X className="w-5 h-5 text-[#3B4883]" />
                </button>

                <div className="flex justify-between items-start mb-6">
                  {/* Price Tag */}
                  <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-[#3B4883]/5">
                    <p className="text-[10px] text-[#3B4883]/50 font-black uppercase mb-1 tracking-widest">Expected Pay</p>
                    <p className="text-3xl font-black text-[#FF7124]">
                      ₹{selectedApp.displaySalary}
                    </p>
                  </div>

                  {/* Urgency Badge */}
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${(selectedApp.jobSnippet?.urgency || selectedApp.job?.urgency) && (selectedApp.jobSnippet?.urgency !== 'Normal' && selectedApp.job?.urgency !== 'Normal')
                    ? 'bg-[#FF7124] text-white'
                    : 'bg-[#3B4883] text-white'
                    }`}>
                    {selectedApp.jobSnippet?.urgency || selectedApp.job?.urgency || 'General'}
                  </div>
                </div>

                {/* Job Title & Company */}
                <h2 className="text-2xl font-black text-[#3B4883] mb-3 uppercase tracking-tight leading-tight pr-10">
                  {selectedApp.displayTitle}
                </h2>

                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-[#3B4883]/10 px-3 py-1 rounded-lg flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#3B4883]/60" />
                    <span className="text-xs font-bold text-[#3B4883]">{selectedApp.displayCompany}</span>
                  </div>
                </div>

                {/* Distance & Location */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-green-700 font-bold">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedApp.displayLocation}</span>
                  </div>
                  {(() => {
                    const workerCoords = user?.location?.coordinates?.coordinates || user?.location?.coordinates;
                    const jobJob = selectedApp.jobSnippet || selectedApp.job || {};
                    const jobCoords = jobJob.location?.coordinates?.coordinates || jobJob.location?.coordinates;

                    if (workerCoords && jobCoords) {
                      const [wLon, wLat] = workerCoords;
                      const [jLon, jLat] = Array.isArray(jobCoords.coordinates) ? jobCoords.coordinates : (jobCoords.lat ? [jobCoords.lon, jobCoords.lat] : jobCoords);
                      const dist = calculateDistance(wLat, wLon, jLon, jLat);
                      if (dist !== null) {
                        return (
                          <div className="px-3 py-1 bg-[#FF7124]/10 rounded-lg text-[#FF7124] font-black uppercase tracking-widest text-[9px]">
                            📍 {dist.toFixed(1)} km away
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>

                {/* Category Badge - Overhanging */}
                {(selectedApp.jobSnippet?.category || selectedApp.job?.category) && (
                  <div className="absolute -bottom-4 left-8">
                    <span className="inline-block px-5 py-2 bg-[#3B4883] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg border-2 border-white">
                      {selectedApp.jobSnippet?.category || selectedApp.job?.category}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-8 pt-10 space-y-8 overflow-y-auto max-h-[60vh]">
                {/* Description */}
                {(selectedApp.jobSnippet?.description || selectedApp.job?.description || selectedApp.notes) && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest">Job Details</h4>
                    <p className="text-sm text-[#3B4883]/80 leading-relaxed">
                      {selectedApp.jobSnippet?.description || selectedApp.job?.description || selectedApp.notes}
                    </p>
                  </div>
                )}

                {/* Progress Tracking */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-[#3B4883]/40 uppercase tracking-widest">Application Progress</h4>
                  <div className="relative px-2">
                    {/* Background Line */}
                    <div className="absolute top-5 left-0 right-0 h-1 bg-[#3B4883]/5 rounded-full" />

                    <div className="relative flex justify-between">
                      {['Applied', 'Accepted', 'Working', 'Paid'].map((step, idx) => {
                        const statusMap = {
                          'Applied': ['applied', 'pending', 'APPLIED'],
                          'Accepted': ['accepted', 'ACCEPTED'],
                          'Working': ['working', 'WORKING', 'in-progress'],
                          'Paid': ['payment_pending', 'completed', 'paid', 'finished', 'PAID', 'FINISHED']
                        };

                        const currentStatus = selectedApp.status?.toLowerCase();
                        const isActive = statusMap[step].some(s => s.toLowerCase() === currentStatus);

                        const statusOrder = ['applied', 'accepted', 'working', 'payment_pending', 'completed', 'paid', 'finished'];
                        const currentIdx = statusOrder.indexOf(currentStatus === 'in-progress' ? 'working' : currentStatus);
                        const stepOrder = ['applied', 'accepted', 'working', 'paid'];
                        const isPast = idx < stepOrder.findIndex(s => statusMap[step].includes(s)) || (currentIdx > statusOrder.indexOf(step.toLowerCase()));

                        // Simple logic for isPast based on status
                        const isCompleted = (step === 'Applied') ||
                          (step === 'Accepted' && ['accepted', 'working', 'payment_pending', 'completed', 'paid', 'finished'].includes(currentStatus)) ||
                          (step === 'Working' && ['working', 'payment_pending', 'completed', 'paid', 'finished'].includes(currentStatus)) ||
                          (step === 'Paid' && ['paid', 'finished'].includes(currentStatus));

                        return (
                          <div key={step} className="flex flex-col items-center gap-2 z-10">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 ${isActive
                              ? 'bg-[#FF7124] text-white shadow-lg shadow-[#FF7124]/30 scale-110'
                              : isCompleted
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white border-2 border-[#3B4883]/10 text-[#3B4883]/30'
                              }`}>
                              {isCompleted && !isActive ? '✓' : idx + 1}
                            </div>
                            <p className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-[#FF7124]' : isCompleted ? 'text-emerald-500' : 'text-[#3B4883]/30'
                              }`}>
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F8F5F2] p-4 rounded-2xl border border-[#3B4883]/5">
                    <p className="text-[9px] font-black text-[#3B4883]/40 uppercase mb-1 tracking-widest">Timing</p>
                    <p className="text-xs font-black text-[#3B4883]">
                      {(() => {
                        const job = selectedApp.jobSnippet || selectedApp.job || {};
                        if (job.startDate) {
                          try {
                            const d = job.startDate?.toDate ? job.startDate.toDate() : new Date(job.startDate);
                            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                          } catch (e) { return 'Flexible'; }
                        }
                        return 'TBD';
                      })()}
                    </p>
                  </div>
                  <div className="bg-[#F8F5F2] p-4 rounded-2xl border border-[#3B4883]/5">
                    <p className="text-[9px] font-black text-[#3B4883]/40 uppercase mb-1 tracking-widest">Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${selectedApp.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-[#FF7124]'}`} />
                      <p className="text-xs font-black text-[#3B4883] uppercase tracking-wide">
                        {selectedApp.status || 'Applied'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2">
                  {['applied'].includes(selectedApp.status?.toLowerCase()) && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(buildApiUrl(`/job-applications/${selectedApp._id}`), {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          if (response.ok) {
                            try {
                              const appliedJobs = JSON.parse(localStorage.getItem('appliedJobIds') || '[]');
                              localStorage.setItem('appliedJobIds', JSON.stringify(appliedJobs.filter(id => id !== selectedApp._id)));
                            } catch (e) { console.warn(e); }
                            setApplications(prev => prev.filter(app => app._id !== selectedApp._id));
                            setSelectedApp(null);
                            toast.success('Application withdrawn');
                          }
                        } catch (error) { toast.error('Failed to withdraw'); }
                      }}
                      className="w-full py-4 border-2 border-[#FF7124] text-[#FF7124] rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#FF7124] hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      Withdraw Application
                    </button>
                  )}

                  {['accepted'].includes(selectedApp.status?.toLowerCase()) && (
                    <button
                      onClick={(e) => handleStartWork(e, selectedApp._id)}
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-200 flex items-center justify-center gap-3"
                    >
                      🚀 START WORK NOW
                    </button>
                  )}

                  {['working', 'in-progress'].includes(selectedApp.status?.toLowerCase()) && !selectedApp.workerConfirmedFinish && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(buildApiUrl(`/job-applications/${selectedApp._id}/worker-finish`), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          if (response.ok) {
                            toast.success('✅ Work marked as complete!');
                            setSelectedApp({ ...selectedApp, workerConfirmedFinish: true, status: 'PAYMENT_PENDING' });
                          }
                        } catch (error) { toast.error('Failed to mark finished'); }
                      }}
                      className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-xl shadow-orange-200 flex items-center justify-center gap-3"
                    >
                      ✅ FINISH WORK
                    </button>
                  )}

                  {['payment_pending'].includes(selectedApp.status?.toLowerCase()) && (
                    <div className="w-full py-5 bg-yellow-50 border-2 border-yellow-200 text-yellow-700 rounded-2xl font-black uppercase text-xs tracking-widest text-center shadow-inner">
                      ⏳ Waiting for payment confirmation...
                    </div>
                  )}

                  {['paid', 'finished'].includes(selectedApp.status?.toLowerCase()) && (
                    <div className="w-full py-5 bg-emerald-50 text-emerald-700 rounded-2xl font-black uppercase text-xs tracking-widest text-center shadow-inner">
                      🎉 Payment Received & Job Finished!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default MyApplications;
