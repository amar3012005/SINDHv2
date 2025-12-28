import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';
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

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      // Fetch Wallet/Worker info
      const workerRes = await fetch(buildApiUrl(`/workers/${user.id}`));
      if (workerRes.ok) {
        const workerData = await workerRes.json();
        const worker = workerData.data || workerData;
        setWalletBalance(worker.balance || 0);
      }

      // Fetch Applications
      const currentUrl = buildApiUrl(`/job-applications/worker/${user.id}/current`);
      const completedUrl = buildApiUrl(`/job-applications/worker/${user.id}/completed`);

      const [currentRes, completedRes] = await Promise.all([
        fetch(currentUrl),
        fetch(completedUrl)
      ]);

      if (currentRes.ok && completedRes.ok) {
        const [currentData, completedData] = await Promise.all([
          currentRes.json(),
          completedRes.json()
        ]);

        const currentApps = (currentData.data || []).map(app => ({ ...app, type: 'current' }));
        const completedApps = (completedData.data || []).map(app => ({ ...app, type: 'completed' }));

        const allApps = [...currentApps, ...completedApps];
        // Deduplicate
        const uniqueApps = Array.from(new Map(allApps.map(app => [app._id, app])).values());

        setApplications(uniqueApps);
        setFilteredApps(uniqueApps);

        // Sync appliedJobIds to localStorage
        try {
          const applicationIds = uniqueApps.map(app => app._id).filter(Boolean);
          localStorage.setItem('appliedJobIds', JSON.stringify(applicationIds));
          console.log(`✅ Synced ${applicationIds.length} application IDs to localStorage`);
        } catch (e) {
          console.warn('⚠️ Could not sync to localStorage:', e);
        }

        // Calc total earnings (paid ones)
        const total = allApps
          .filter(a => a.paymentStatus === 'paid' || a.status === 'PAID')
          .reduce((sum, a) => sum + (a.paymentAmount || a.job?.baseAmount || a.job?.salary || 0), 0);
        setTotalEarnings(total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Could not load applications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Filtering
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredApps(applications);
    } else if (selectedFilter === 'applied') {
      setFilteredApps(applications.filter(app =>
        ['applied', 'accepted', 'working', 'in-progress', 'payment_pending'].includes(app.status?.toLowerCase())
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

  const handleStartWork = async (e, applicationId) => {
    e.stopPropagation(); // Prevent opening modal
    try {
      const response = await fetch(buildApiUrl(`/job-applications/${applicationId}/start-work`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('🚀 Work started!');
        fetchData(); // Refresh data
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
    <div className="min-h-screen bg-white text-[#202124] relative overflow-hidden pb-20">
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
        <div className="px-6 pt-8 pb-4">
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
                        {app.job?.title || 'Job Title'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="w-3 h-3 text-[#3B4883]/40" />
                        <span className="text-xs font-medium text-[#3B4883]/60">
                          {app.job?.companyName || 'Unknown Company'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[#FF7124] block">
                        ₹{app.paymentAmount || app.job?.baseAmount || app.job?.salary || 0}
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
                        <span>{new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</span>
                      </div>
                      {app.job?.location?.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-green-600" />
                          <span className="text-green-600 font-bold">~{app.distanceFromWork ? app.distanceFromWork.toFixed(1) : 10}km</span>
                        </div>
                      )}
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
      < AnimatePresence >
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
              className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[1.5rem] shadow-2xl relative overflow-hidden"
            >
              {/* Compact Header Card */}
              <div className="relative bg-gradient-to-br from-[#E8DFD5] to-[#DBBBA7] p-6 pb-8">
                {/* Top Row: Price & Urgency */}
                <div className="flex justify-between items-start mb-4">
                  {/* Base Price - Top Left */}
                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
                    <p className="text-xs text-[#3B4883]/60 font-bold uppercase mb-0.5">Base Price</p>
                    <p className="text-2xl font-black text-[#FF7124]">
                      ₹{selectedApp.paymentAmount || selectedApp.job?.baseAmount || selectedApp.job?.salary}
                    </p>
                  </div>

                  {/* Urgency Badge - Top Right */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => setSelectedApp(null)}
                      className="p-2 hover:bg-white/50 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-[#3B4883]" />
                    </button>
                    <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${selectedApp.job?.urgency && selectedApp.job.urgency !== 'Normal'
                      ? 'bg-[#FF7124] text-white'
                      : 'bg-[#3B4883] text-white'
                      }`}>
                      {selectedApp.job?.urgency && selectedApp.job.urgency !== 'Normal'
                        ? selectedApp.job.urgency
                        : 'General'}
                    </div>
                  </div>
                </div>

                {/* Job Title */}
                <h2 className="text-xl font-black text-[#3B4883] mb-2 uppercase tracking-tight leading-tight">
                  {selectedApp.job?.title}
                </h2>

                {/* Distance, Company & Location */}
                <div className="flex items-start gap-3 text-sm flex-wrap pb-2">
                  <div className="flex items-center gap-1.5 text-green-600">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="font-bold">~{selectedApp.distanceFromWork ? selectedApp.distanceFromWork.toFixed(1) : 10}km</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#3B4883]/70">
                    <Building className="w-4 h-4 shrink-0" />
                    <span className="font-bold">{selectedApp.job?.companyName || 'Company'}</span>
                  </div>
                  {selectedApp.job?.location && (
                    <div className="flex items-center gap-1.5 text-[#3B4883]/50 text-xs">
                      <span className="font-medium">
                        {[selectedApp.job.location.village, selectedApp.job.location.district, selectedApp.job.location.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Category Badge */}
                {selectedApp.job?.category && (
                  <div className="absolute -bottom-3 left-6 z-10">
                    <span className="inline-block px-4 py-1.5 bg-[#3B4883] text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg border-2 border-white">
                      {selectedApp.job.category}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 pt-8 space-y-5">
                {/* Job Description */}
                {selectedApp.job?.description && (
                  <div>
                    <p className="text-xs font-black text-[#3B4883]/50 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-[#202124]/80 leading-relaxed line-clamp-3">
                      {selectedApp.job.description}
                    </p>
                  </div>
                )}

                {/* Progress Bar - Application Status */}
                <div>
                  <p className="text-xs font-black text-[#3B4883]/50 uppercase tracking-wider mb-3">Application Status</p>
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#3B4883]/10" />

                    {/* Status Steps */}
                    <div className="relative flex justify-between">
                      {['Applied', 'Accepted', 'Working', 'Completed'].map((step, idx) => {
                        const statusMap = {
                          'Applied': ['applied', 'APPLIED'],
                          'Accepted': ['accepted', 'ACCEPTED'],
                          'Working': ['working', 'WORKING'],
                          'Completed': ['payment_pending', 'PAYMENT_PENDING', 'completed', 'COMPLETED', 'paid', 'PAID']
                        };

                        const isActive = statusMap[step].includes(selectedApp.status);
                        const isPast = idx < (
                          ['applied', 'APPLIED'].includes(selectedApp.status) ? 0 :
                            ['accepted', 'ACCEPTED'].includes(selectedApp.status) ? 1 :
                              ['working', 'WORKING'].includes(selectedApp.status) ? 2 : 3
                        );

                        return (
                          <div key={step} className="flex flex-col items-center gap-1 z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isActive
                              ? 'bg-[#FF7124] text-white shadow-md scale-110'
                              : isPast
                                ? 'bg-[#10b981] text-white'
                                : 'bg-white border-2 border-[#3B4883]/20 text-[#3B4883]/40'
                              }`}>
                              {isActive || isPast ? '✓' : idx + 1}
                            </div>
                            <p className={`text-[9px] font-bold uppercase mt-1 ${isActive ? 'text-[#FF7124]' : isPast ? 'text-[#10b981]' : 'text-[#3B4883]/40'
                              }`}>
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Timing & Location Info Row */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#F8F5F2] p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-[#3B4883]/50 uppercase mb-1">Work Timing</p>
                    <p className="text-xs font-black text-[#3B4883]">
                      {(selectedApp.job?.startDate || selectedApp.job?.startTime) ? (
                        <>
                          {selectedApp.job.startDate ? new Date(selectedApp.job.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                          {selectedApp.job.startTime ? ` @ ${selectedApp.job.startTime}` : ' - Full day'}
                        </>
                      ) : 'Check description'}
                    </p>
                  </div>
                  <div className="bg-[#F8F5F2] p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-[#3B4883]/50 uppercase mb-1">Location</p>
                    <p className="text-xs font-black text-[#3B4883] truncate">
                      {selectedApp.job?.location?.village || selectedApp.job?.location?.district || 'On-site'}
                    </p>
                  </div>
                </div>

                {/* Status Info Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F8F5F2] p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-[#3B4883]/50 uppercase mb-1">Applied On</p>
                    <p className="text-xs font-black text-[#3B4883]">
                      {selectedApp.appliedAt ? new Date(selectedApp.appliedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      }) : 'Recently'}
                    </p>
                  </div>
                  <div className="bg-[#F8F5F2] p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-[#3B4883]/50 uppercase mb-1">Payment Status</p>
                    <p className={`text-xs font-black uppercase ${selectedApp.paymentStatus === 'paid' ? 'text-[#10b981]' : 'text-[#FF7124]'
                      }`}>
                      {selectedApp.paymentStatus || 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Withdraw Button - only for applied/accepted */}
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
                          setFilteredApps(prev => prev.filter(app => app._id !== selectedApp._id));
                          setSelectedApp(null);
                          toast.success('Application withdrawn successfully!');
                        } else {
                          const error = await response.json();
                          toast.error(error.message || 'Failed to withdraw');
                        }
                      } catch (error) {
                        console.error(error);
                        toast.error('Failed to withdraw application');
                      }
                    }}
                    className="w-full py-3 border-2 border-[#FF7124] text-[#FF7124] rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-[#FF7124] hover:text-white transition-all active:scale-95"
                  >
                    Withdraw Application
                  </button>
                )}

                {/* Start Work Button - shows when accepted AND startDate reached */}
                {['accepted'].includes(selectedApp.status?.toLowerCase()) &&
                  new Date(selectedApp.job?.startDate) <= new Date() && (
                    <button
                      onClick={(e) => handleStartWork(e, selectedApp._id)}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-green-700 transition-all active:scale-95"
                    >
                      🚀 START WORK
                    </button>
                  )}

                {/* Waiting for start date */}
                {['accepted'].includes(selectedApp.status?.toLowerCase()) &&
                  new Date(selectedApp.job?.startDate) > new Date() && (
                    <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase text-xs tracking-wider text-center">
                      ⏳ Work starts on {new Date(selectedApp.job?.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  )}

                {/* WORK DONE Button - shows when working AND not yet confirmed */}
                {['working', 'in-progress'].includes(selectedApp.status?.toLowerCase()) &&
                  !selectedApp.workerConfirmedFinish && (
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
                            fetchData(); // Refresh data
                          } else {
                            const error = await response.json();
                            toast.error(error.message || 'Failed to mark work finished');
                          }
                        } catch (error) {
                          console.error(error);
                          toast.error('Failed to mark work finished');
                        }
                      }}
                      className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                    >
                      ✅ WORK DONE
                    </button>
                  )}

                {/* Waiting for employer confirmation */}
                {((['working', 'in-progress'].includes(selectedApp.status?.toLowerCase()) && selectedApp.workerConfirmedFinish) ||
                  ['payment_pending'].includes(selectedApp.status?.toLowerCase())) && (
                    <div className="w-full py-4 bg-yellow-50 border-2 border-yellow-200 text-yellow-700 rounded-2xl font-black uppercase text-xs tracking-widest text-center">
                      ⏳ Waiting for employer to confirm & pay additional...
                    </div>
                  )}

                {/* Completed */}
                {['completed', 'paid', 'finished'].includes(selectedApp.status?.toLowerCase()) && (
                  <div className="w-full py-3 bg-green-100 text-green-700 rounded-xl font-bold uppercase text-xs tracking-wider text-center">
                    🎉 Job Completed!
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence >
    </div >
  );
};

export default MyApplications;
