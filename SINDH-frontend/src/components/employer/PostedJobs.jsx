import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MapPin,
  Users,
  Clock,
  Briefcase,
  AlertCircle,
  X,
  Building,
  CheckCircle,
  CreditCard,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';
import { toast } from 'react-toastify';
import { db, auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const PostedJobs = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [pendingPaymentApp, setPendingPaymentApp] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  // Additional charges modal state
  const [showAdditionalChargesModal, setShowAdditionalChargesModal] = useState(false);
  const [additionalAmount, setAdditionalAmount] = useState(0);
  const [selectedAppForPayment, setSelectedAppForPayment] = useState(null);
  const [isProcessingFinish, setIsProcessingFinish] = useState(false);

  // Real-time jobs listener
  useEffect(() => {
    let unsubscribeJobs = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (!authUser) {
        console.warn('⚠️ Auth not ready; waiting to attach jobs listener');
        return;
      }

      const employerId =
        user?.id ||
        localStorage.getItem('employerId') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.id;

      if (!employerId) {
        console.warn('⚠️ No employerId found for jobs listener');
        return;
      }

      console.log('📡 Setting up real-time jobs listener for employer:', employerId);
      setLoading(true);

      const jobsQuery = query(collection(db, 'jobs'), where('employer', '==', employerId));

      // Clean previous
      if (unsubscribeJobs) {
        unsubscribeJobs();
      }

      unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
        console.log(`📥 Snapshot received with ${snapshot.docs.length} documents`);

        const jobsList = snapshot.docs
          .map(doc => {
            const data = doc.data();
            // Log each job for debugging
            console.log(`Job Doc: ${doc.id}, Status: ${data.status}, Employer: ${data.employer}`);

            let createdAtDate;
            if (data.createdAt?.toDate) {
              createdAtDate = data.createdAt.toDate();
            } else if (data.createdAt && typeof data.createdAt === 'object' && Object.keys(data.createdAt).length === 0) {
              // Handle { } from serverTimestamp in local snapshot
              createdAtDate = new Date();
            } else if (data.createdAt) {
              createdAtDate = new Date(data.createdAt);
            } else {
              createdAtDate = new Date(0);
            }

            const rawStatus = data.status || 'POSTED';
            const status = rawStatus.toLowerCase();

            return {
              ...data,
              id: doc.id,
              _id: doc.id,
              createdAt: createdAtDate,
              status
            };
          })
          .filter(j => {
            // Be very inclusive for debugging
            const validStatuses = ['posted', 'applied', 'accepted', 'active', 'in-progress', 'working', 'completed', 'payment_pending', 'paid', 'finished', 'cancelled', 'expired'];
            const keep = validStatuses.includes(j.status);
            if (!keep) console.log(`🚫 Filtering out job ${j.id} with status ${j.status}`);
            return keep;
          });

        // Robust sort
        jobsList.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });

        console.log(`✅ Final jobsList after filtering and sorting: ${jobsList.length} jobs`);
        setJobs(jobsList);
        setLoading(false);

        if (selectedJob) {
          const updatedSelectedJob = jobsList.find(j => j._id === selectedJob._id);
          if (updatedSelectedJob) {
            setSelectedJob(updatedSelectedJob);
          }
        }
      }, (error) => {
        console.error('❌ Jobs listener error:', error);
        toast.error('Failed to load jobs');
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribeJobs) unsubscribeJobs();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [user?.id]); // Removed selectedJob from dependencies to prevent unnecessary re-subscribes

  // Real-time applications listener when job is selected
  useEffect(() => {
    if (!selectedJob?._id) {
      setApplications([]);
      return;
    }

    console.log('📡 Setting up real-time applications listener for job:', selectedJob._id);
    setLoadingApplications(true);

    const appsQuery = query(
      collection(db, 'applications'),
      where('job', '==', selectedJob._id)
    );

    const unsubscribe = onSnapshot(appsQuery, (snapshot) => {
      const appsList = snapshot.docs.map(doc => ({
        id: doc.id,
        _id: doc.id,
        ...doc.data()
      }));
      console.log(`📋 Received ${appsList.length} applications for job ${selectedJob._id}`);
      setApplications(appsList);
      setLoadingApplications(false);
    }, (error) => {
      console.error('❌ Applications listener error:', error);
      toast.error('Failed to load applications');
      setLoadingApplications(false);
    });

    return () => unsubscribe();
  }, [selectedJob?._id]);

  // Handle accept click - shows payment simulation first
  const handleAcceptClick = (application) => {
    setPendingPaymentApp(application);
  };

  // Handle actual acceptance after payment simulation
  const handleConfirmPayment = async () => {
    if (!pendingPaymentApp) return;

    try {
      setIsPaying(true);
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(buildApiUrl(`/job-applications/${pendingPaymentApp._id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      });

      if (response.ok) {
        toast.success('Payment successful & Applicant accepted!');
        const updatedApps = applications.map(app =>
          app._id === pendingPaymentApp._id ? { ...app, status: 'accepted' } : app
        );
        setApplications(updatedApps);
        setPendingPaymentApp(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to accept applicant');
      }
    } catch (error) {
      console.error('Error accepting applicant:', error);
      toast.error('Failed to accept applicant');
    } finally {
      setIsPaying(false);
    }
  };

  // Handle revoke applicant (undo acceptance)

  const handleRevokeApplicant = async (applicationId) => {
    try {
      const response = await fetch(buildApiUrl(`/job-applications/${applicationId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'applied' })
      });

      if (response.ok) {
        toast.success('Acceptance revoked');
        const updatedApps = applications.map(app =>
          app._id === applicationId ? { ...app, status: 'applied' } : app
        );
        setApplications(updatedApps);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to revoke');
      }
    } catch (error) {
      console.error('Error revoking applicant:', error);
      toast.error('Failed to revoke');
    }
  };

  // Handle Start Work (employer triggers)
  const handleStartWork = async (e, applicationId) => {
    if (e) e.stopPropagation(); // Prevent opening modal
    try {
      const response = await fetch(buildApiUrl(`/job-applications/${applicationId}/start-work`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success('🚀 Work started!');
        // Update applications locally if any
        const updatedApps = applications.map(app =>
          app._id === applicationId ? { ...app, status: 'working' } : app
        );
        setApplications(updatedApps);

        // Update jobs locally to reflect 'WORKING' status
        setJobs(prevJobs => prevJobs.map(job => {
          if (job.acceptedApplicationId === applicationId) {
            return { ...job, status: 'WORKING' };
          }
          return job;
        }));

        if (selectedJob && selectedJob.acceptedApplicationId === applicationId) {
          setSelectedJob({ ...selectedJob, status: 'WORKING' });
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to start work');
      }
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error('Failed to start work');
    }
  };

  // Handle employer finish with additional charges
  const handleEmployerFinish = async () => {
    if (!selectedAppForPayment) return;

    setIsProcessingFinish(true);
    try {
      const response = await fetch(buildApiUrl(`/job-applications/${selectedAppForPayment._id}/employer-finish`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalCharges: additionalAmount })
      });

      if (response.ok) {
        toast.success(`🎉 Job completed! ${additionalAmount > 0 ? `₹${additionalAmount} paid to worker.` : ''}`);
        const updatedApps = applications.map(app =>
          app._id === selectedAppForPayment._id ? { ...app, status: 'completed' } : app
        );
        setApplications(updatedApps);
        setShowAdditionalChargesModal(false);
        setSelectedAppForPayment(null);
        setAdditionalAmount(0);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to complete job');
      }
    } catch (error) {
      console.error('Error completing job:', error);
      toast.error('Failed to complete job');
    } finally {
      setIsProcessingFinish(false);
    }
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => ['posted', 'applied', 'accepted', 'working', 'in-progress', 'active'].includes(j.status)).length;

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    let config = { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };

    if (s === 'POSTED' || s === 'APPLIED') {
      config = { label: 'Active', color: 'bg-blue-50 text-blue-600 border-blue-100' };
    } else if (s === 'ACCEPTED' || s === 'accepted') {
      config = { label: 'Accepted', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    } else if (s === 'WORKING' || s === 'IN-PROGRESS') {
      config = { label: 'Working', color: 'bg-orange-50 text-orange-600 border-orange-100' };
    } else if (s === 'PAYMENT_PENDING' || s === 'PAYMENT-PENDING') {
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
      {/* Background matching MyApplications */}
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
        {/* Header Section */}
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-black text-[#3B4883] tracking-tight uppercase">
              |MY_POSTED_JOBS
            </h1>
            <div className="flex items-center gap-3">
              <div className="bg-white/80 backdrop-blur-sm border-2 border-[#3B4883]/10 rounded-2xl px-4 py-2 shadow-sm text-right">
                <p className="text-[10px] font-bold text-[#3B4883]/60 uppercase leading-none mb-1">Active Jobs</p>
                <p className="text-sm font-black text-[#3B4883]">{activeJobs} / {totalJobs}</p>
              </div>
              <button
                onClick={() => navigate('/employer/post-job')}
                className="w-12 h-12 bg-[#FF7124] text-white rounded-2xl flex items-center justify-center hover:bg-[#e66420] transition-all active:scale-95 shadow-lg shadow-[#FF7124]/20"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="px-6">
          {jobs.length === 0 ? (
            <div className="text-center py-20 opacity-60">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[#3B4883] font-bold">No jobs posted yet</p>

              {/* Debug Info for User */}
              <div className="mt-8 p-4 bg-[#3B4883]/5 rounded-xl text-[10px] text-[#3B4883]/40 font-mono break-all">
                DEBUG: Employer ID: {user?.id || localStorage.getItem('employerId') || 'Not found'}<br />
                TYPE: {user?.type || 'Not found'}
              </div>

              <button
                onClick={() => navigate('/employer/post-job')}
                className="mt-4 text-sm font-bold text-[#FF7124] hover:underline"
              >
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              {jobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-[#3B4883]/10 py-5 hover:bg-[#E8DFD5]/20 transition-all cursor-pointer group"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-4">
                      <h3 className="text-base font-bold text-[#272D4E] uppercase tracking-wide group-hover:text-[#FF7124] transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 font-medium text-[#3B4883]/60 text-xs text-green-600">
                          <MapPin className="w-3 h-3" />
                          <span>{job.location?.village}</span>
                        </div>
                        {(() => {
                          const acceptedApp = applications.find(app => (app.jobId === job._id || app.job?._id === job._id) && ['accepted', 'working', 'in-progress', 'payment_pending', 'completed', 'paid', 'finished'].includes(app.status?.toLowerCase()));
                          if (acceptedApp) {
                            const jobCoords = job.location?.coordinates?.coordinates || job.location?.coordinates;
                            const workerCoords = acceptedApp.applicationLocation?.coordinates || acceptedApp.workerSnippet?.registrationLocation?.coordinates || acceptedApp.worker?.registrationLocation?.coordinates;
                            if (jobCoords && workerCoords) {
                              const [jLon, jLat] = jobCoords;
                              const [wLon, wLat] = Array.isArray(workerCoords.coordinates) ? workerCoords.coordinates : (workerCoords.lat ? [workerCoords.lon, workerCoords.lat] : workerCoords);
                              const dist = calculateDistance(jLat, jLon, wLat, wLon);
                              return (
                                <div className="flex items-center gap-1.5 text-[#FF7124] font-bold text-xs">
                                  <span>📍 {dist !== null ? `${dist.toFixed(1)}km matched` : 'Matched'}</span>
                                </div>
                              );
                            }
                            return <span className="text-xs font-bold text-emerald-600">Matched</span>;
                          }
                          return (
                            <div className="flex items-center gap-1.5 font-medium text-[#3B4883]/60 text-xs">
                              <Users className="w-3 h-3 text-[#3B4883]/40" />
                              <span>{job.applicantCount || 0} applicants</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-[#FF7124] block">
                        ₹{job.salary || job.baseAmount}
                      </span>
                      <div className="mt-1 flex justify-end">
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-[#202124]/40 uppercase tracking-widest mt-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[#3B4883]/40">
                        <Clock className="w-3 h-3" />
                        <span>Posted on {(() => {
                          try {
                            const d = job.createdAt?.toDate ? job.createdAt.toDate() : new Date(job.createdAt || Date.now());
                            return d.toLocaleDateString();
                          } catch (e) { return 'Recently'; }
                        })()}</span>
                      </div>
                      {job.category && (
                        <div className="bg-[#3B4883]/5 px-2 py-0.5 rounded text-[#3B4883]/60 border border-[#3B4883]/10">
                          {job.category}
                        </div>
                      )}
                    </div>
                    {['accepted'].includes(job.status?.toLowerCase()) &&
                      job.acceptedApplicationId &&
                      new Date(job.startDate) <= new Date() ? (
                      <button
                        onClick={(e) => handleStartWork(e, job.acceptedApplicationId)}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-bold uppercase text-[10px] tracking-wider hover:bg-green-700 transition-all active:scale-95 shadow-sm"
                      >
                        🚀 START WORK
                      </button>
                    ) : (
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#3B4883]/20" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Applicants Sheet */}
      < AnimatePresence >
        {selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-[#3B4883]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-[1.5rem] shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header Card - Compact Redesign */}
              <div className="relative bg-white border-b border-[#3B4883]/10 p-4 shrink-0 flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(selectedJob.status)}
                    <span className="text-xs font-bold text-[#3B4883]/60">#{selectedJob._id.slice(-4)}</span>
                  </div>
                  <h2 className="text-lg font-black text-[#3B4883] uppercase tracking-tight leading-tight truncate">
                    {selectedJob.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-10 h-10 bg-[#F8F5F2] rounded-full flex items-center justify-center hover:bg-[#E8DFD5] transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-[#3B4883]" />
                </button>
              </div>

              {/* Modal Body / Applicants List */}
              <div className="flex-1 overflow-y-auto p-6 pt-8 relative bg-[#FFFFFF]">
                {/* Payment Simulation Overlay */}
                <AnimatePresence>
                  {pendingPaymentApp && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[110] bg-[#3B4883]/40 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 30 }}
                        className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-[340px] w-full border border-[#3B4883]/5 relative overflow-hidden"
                      >
                        {/* Decorative background circle */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF7124]/5 rounded-full" />

                        <div className="relative z-10 text-center">
                          <div className="w-16 h-16 bg-[#FF7124]/10 rounded-2xl flex items-center justify-center mb-5 mx-auto -rotate-6">
                            <CreditCard className="w-8 h-8 text-[#FF7124]" />
                          </div>

                          <h3 className="text-xl font-black text-[#3B4883] uppercase tracking-tight mb-2">Secure Acceptance</h3>
                          <p className="text-xs font-bold text-[#3B4883]/40 uppercase tracking-widest mb-6 leading-relaxed">
                            Paying base amount for <br />
                            <span className="text-[#FF7124]">{pendingPaymentApp.worker?.name || pendingPaymentApp.workerDetails?.name}</span>
                          </p>

                          <div className="bg-[#F8F5F2] rounded-2xl p-4 mb-6 border border-[#3B4883]/5">
                            <p className="text-[10px] font-black text-[#3B4883]/40 uppercase mb-1">Base Amount to Pay</p>
                            <p className="text-2xl font-black text-[#3B4883]">₹{selectedJob.salary || selectedJob.baseAmount}</p>
                          </div>

                          <div className="space-y-3">
                            <button
                              onClick={handleConfirmPayment}
                              disabled={isPaying}
                              className="w-full py-4 bg-[#FF7124] text-white rounded-xl font-black uppercase tracking-wider hover:bg-[#e66420] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-[#FF7124]/20"
                            >
                              {isPaying ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>PROCESSING...</span>
                                </>
                              ) : (
                                <span>CONFIRM & PAY</span>
                              )}
                            </button>
                            <button
                              onClick={() => setPendingPaymentApp(null)}
                              disabled={isPaying}
                              className="w-full py-3 text-[10px] font-black text-[#3B4883]/30 uppercase tracking-widest hover:text-[#FF7124] transition-colors"
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>



                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-black text-[#3B4883] uppercase tracking-wider">Management & Applicants</h3>
                      <p className="text-[10px] text-[#3B4883]/50 font-bold uppercase mt-0.5">Track and manage your chosen worker</p>
                    </div>
                    {applications.length > 0 && !applications.some(a => ['accepted', 'working', 'in-progress', 'payment_pending', 'completed', 'paid', 'finished'].includes(a.status?.toLowerCase())) && (
                      <div className="flex flex-col items-end">
                        <span className="bg-[#FF7124]/10 text-[#FF7124] px-3 py-1 rounded-full text-[10px] font-black uppercase border border-[#FF7124]/20 shadow-sm">
                          {applications.length} APPLIED
                        </span>
                      </div>
                    )}
                  </div>

                  {loadingApplications ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 border-4 border-[#3B4883]/5 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#FF7124] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                    </div>
                  ) : applications.some(a => ['accepted', 'working', 'in-progress', 'payment_pending', 'completed', 'paid', 'finished'].includes(a.status?.toLowerCase())) ? (
                    // Workflow Progress View
                    <div className="space-y-6">
                      {(() => {
                        const app = applications.find(a => ['accepted', 'working', 'in-progress', 'payment_pending', 'completed'].includes(a.status?.toLowerCase()));
                        const status = app.status?.toLowerCase();

                        const statusSteps = [
                          { label: 'Applied', done: true },
                          { label: 'Accepted', done: ['accepted', 'working', 'in-progress', 'payment_pending', 'completed'].includes(status) },
                          { label: 'Working', done: ['working', 'in-progress', 'payment_pending', 'completed'].includes(status) },
                          { label: 'Completed', done: status === 'completed' }
                        ];

                        return (
                          <>
                            <div className="bg-[#3B4883]/5 border-2 border-[#3B4883]/5 rounded-3xl p-6 mb-2">
                              {/* Progress Track */}
                              <div className="relative">
                                <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#3B4883]/10" />
                                <div className="relative flex justify-between">
                                  {statusSteps.map((step, idx) => {
                                    const isActive = (status === 'applied' && idx === 0) ||
                                      (status === 'accepted' && idx === 1) ||
                                      ((status === 'working' || status === 'in-progress' || status === 'payment_pending') && idx === 2) ||
                                      (status === 'completed' && idx === 3);

                                    return (
                                      <div key={idx} className="flex flex-col items-center gap-1 z-10 w-1/4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 ${step.done
                                          ? idx === 3 ? 'bg-purple-600 text-white shadow-lg' : 'bg-emerald-500 text-white shadow-lg'
                                          : 'bg-white border-2 border-[#3B4883]/10 text-[#3B4883]/30'
                                          } ${isActive ? 'scale-125 ring-4 ring-[#FF7124]/20' : ''}`}>
                                          {step.done ? '✓' : idx + 1}
                                        </div>
                                        <p className={`text-[9px] font-black uppercase mt-1 tracking-wider ${isActive ? 'text-[#FF7124]' : step.done ? 'text-emerald-600' : 'text-[#3B4883]/30'
                                          }`}>
                                          {step.label}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#3B4883] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                              <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-[#FF7124] text-2xl border border-white/20">
                                    {app.worker?.name?.charAt(0) || 'W'}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Assigned Worker</p>
                                    <h4 className="text-xl font-black uppercase leading-tight">{app.worker?.name || app.workerDetails?.name}</h4>
                                    <p className="text-xs font-bold text-white/60 mb-2">{app.worker?.phone || app.workerDetails?.phone}</p>

                                    {/* Minimalistic Timing Info */}
                                    <div className="flex flex-col gap-0.5">
                                      {app.startedAt && (
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                                          <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                                            Start: <span className="text-white/70">{new Date(app.startedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                          </p>
                                        </div>
                                      )}
                                      {app.completedAt && (
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                                          <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                                            End: <span className="text-white/70">{new Date(app.completedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${status === 'working' || status === 'in-progress'
                                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                    : status === 'completed'
                                    }`}>
                                    {status === 'in-progress' ? 'Working' : (status === 'payment_pending' ? 'Payment Pending' : status)}
                                  </span>
                                  {app.paymentStatus === 'paid' || app.paymentStatus === 'base_paid' ? (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      {app.paymentStatus === 'base_paid' ? 'Base Paid' : 'Fully Paid'}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              {/* Actions */}
                              {status === 'accepted' && (
                                <>
                                  {new Date(selectedJob?.startDate) <= new Date() ? (
                                    <button
                                      onClick={(e) => handleStartWork(e, app._id)}
                                      className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                                    >
                                      🚀 START WORK
                                    </button>
                                  ) : (
                                    <div className="w-full py-4 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-wider text-center text-xs">
                                      ⏳ Work starts on {new Date(selectedJob?.startDate).toLocaleDateString()}
                                    </div>
                                  )}
                                  <button onClick={() => handleRevokeApplicant(app._id)} className="w-full py-4 border-2 border-[#FF7124]/20 text-[#FF7124] rounded-2xl font-black uppercase tracking-wider hover:bg-[#FF7124] hover:text-white transition-all text-xs">
                                    Revoke Acceptance
                                  </button>
                                </>
                              )}

                              {(status === 'working' || status === 'in-progress' || status === 'payment_pending') && (
                                <div className="space-y-3">
                                  {status === 'payment_pending' || app.workerConfirmedFinish ? (
                                    <button
                                      onClick={() => {
                                        setSelectedAppForPayment(app);
                                        setShowAdditionalChargesModal(true);
                                      }}
                                      className="w-full py-4 bg-[#FF7124] text-white rounded-2xl font-black uppercase tracking-wider hover:bg-[#e66420] transition-all active:scale-95 shadow-lg shadow-[#FF7124]/20 flex items-center justify-center gap-2"
                                    >
                                      ✅ Complete & Finalize Pay
                                    </button>
                                  ) : (
                                    <div className="w-full py-4 bg-orange-50 text-orange-600 border-2 border-orange-100 rounded-2xl font-black uppercase tracking-wider text-center text-xs flex items-center justify-center gap-2">
                                      🔨 Work in Progress...
                                    </div>
                                  )}
                                </div>
                              )}

                              {status === 'completed' && (
                                <div className="w-full py-6 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 rounded-3xl font-black uppercase tracking-wider text-center flex items-center justify-center gap-3 shadow-sm">
                                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6" />
                                  </div>
                                  <div className="text-left">
                                    <p className="leading-none">Job Completed</p>
                                    <p className="text-[10px] opacity-60 normal-case font-bold mt-1">Worker has been fully paid</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-16 bg-[#3B4883]/5 rounded-3xl border-2 border-dashed border-[#3B4883]/10">
                      <Users className="w-12 h-12 mx-auto mb-3 text-[#3B4883]/20" />
                      <p className="font-bold text-[#3B4883]/40 uppercase text-xs tracking-widest">No applications yet</p>
                    </div>
                  ) : (
                    // Multiple Applicants Selection List
                    <div className="space-y-4">
                      {applications.map((app) => {
                        const status = app.status?.toLowerCase();
                        const isAccepted = ['accepted', 'working', 'in-progress', 'payment_pending', 'completed', 'paid', 'finished'].includes(status);

                        return (
                          <div
                            key={app._id}
                            className={`p-5 bg-white border-2 rounded-3xl transition-all cursor-pointer shadow-sm group relative overflow-hidden ${isAccepted
                              ? 'border-emerald-100 bg-emerald-50/20'
                              : 'border-[#3B4883]/5 hover:border-[#FF7124]/30 hover:shadow-md'
                              }`}
                            onClick={() => {
                              if (status === 'applied' || status === 'pending') {
                                handleAcceptClick(app);
                              }
                            }}
                          >
                            <div className="flex justify-between items-center relative z-10">
                              <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-300 ${isAccepted
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-[#F8F5F2] text-[#FF7124] group-hover:bg-[#FF7124] group-hover:text-white group-hover:rotate-3'
                                  }`}>
                                  {app.worker?.name?.charAt(0) || 'W'}
                                </div>
                                <div>
                                  <h4 className="font-black text-[#3B4883] uppercase text-sm tracking-tight mb-0.5">
                                    {app.worker?.name || app.workerDetails?.name}
                                  </h4>
                                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#3B4883]/40">
                                    <span className="flex items-center gap-1.5 text-green-600">
                                      <MapPin className="w-3 h-3" />
                                      {(() => {
                                        const jobCoords = selectedJob?.location?.coordinates?.coordinates || selectedJob?.location?.coordinates;
                                        const workerCoords = app.applicationLocation?.coordinates || app.workerSnippet?.registrationLocation?.coordinates || app.worker?.registrationLocation?.coordinates;

                                        if (jobCoords && workerCoords) {
                                          const [jLon, jLat] = jobCoords;
                                          const [wLon, wLat] = Array.isArray(workerCoords.coordinates) ? workerCoords.coordinates : (workerCoords.lat ? [workerCoords.lon, workerCoords.lat] : workerCoords);
                                          const dist = calculateDistance(jLat, jLon, wLat, wLon);
                                          return dist !== null ? `${dist.toFixed(1)}km` : 'N/A';
                                        }
                                        return 'N/A';
                                      })()}
                                    </span>
                                    <span className="opacity-40">•</span>
                                    <span>Shakti: {app.worker?.shaktiScore || 85}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {isAccepted ? (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${['paid', 'finished', 'completed'].includes(status)
                                      ? 'bg-purple-100 text-purple-600 border-purple-200'
                                      : status === 'payment_pending'
                                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                                      }`}>
                                      {status === 'in-progress' || status === 'working' ? 'WORKING' : (status === 'payment_pending' ? 'PAYMENT PENDING' : status)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-white border-2 border-[#3B4883]/5 flex items-center justify-center group-hover:border-[#FF7124]/30 group-hover:bg-[#FF7124]/5 transition-all">
                                    <ChevronRight className="w-5 h-5 text-[#3B4883]/20 group-hover:text-[#FF7124] transition-colors" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Visual indicator for accepted worker */}
                            {isAccepted && (
                              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Job Info Grid (Moved to Bottom) */}
                <div className="border-t-2 border-[#3B4883]/5 pt-6 mt-2">
                  <p className="text-xs font-black text-[#3B4883]/50 uppercase tracking-wider mb-3">Job Details</p>

                  {/* Compact Info Row */}
                  <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                    <div className="bg-[#F8F5F2] px-3 py-2 rounded-xl flex items-center gap-2 border border-[#3B4883]/5 min-w-max">
                      <DollarSign className="w-3 h-3 text-[#FF7124]" />
                      <span className="text-xs font-black text-[#3B4883]">₹{selectedJob.salary || selectedJob.baseAmount}</span>
                    </div>
                    <div className="bg-[#F8F5F2] px-3 py-2 rounded-xl flex items-center gap-2 border border-[#3B4883]/5 min-w-max">
                      <MapPin className="w-3 h-3 text-[#3B4883]/60" />
                      <span className="text-xs font-black text-[#3B4883]">{selectedJob.location?.village || 'On-site'}</span>
                    </div>
                    <div className="bg-[#F8F5F2] px-3 py-2 rounded-xl flex items-center gap-2 border border-[#3B4883]/5 min-w-max">
                      <Clock className="w-3 h-3 text-[#3B4883]/60" />
                      <span className="text-xs font-black text-[#3B4883]">
                        {(() => {
                          if (selectedJob.startDate) {
                            try {
                              const d = selectedJob.startDate?.toDate ? selectedJob.startDate.toDate() : new Date(selectedJob.startDate);
                              return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            } catch (e) { return 'Flexible'; }
                          }
                          return 'Flexible';
                        })()}
                      </span>
                    </div>
                  </div>

                  {selectedJob.description && (
                    <div className="bg-[#F8F5F2]/50 p-3 rounded-xl border border-[#3B4883]/5">
                      <p className="text-xs text-[#202124]/70 leading-relaxed font-medium line-clamp-3">
                        {selectedJob.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence >

      {/* Additional Charges - Re-styled */}
      < AnimatePresence >
        {showAdditionalChargesModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAdditionalChargesModal(false);
                setSelectedAppForPayment(null);
                setAdditionalAmount(0);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-[#FF7124]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-[#FF7124]" />
                </div>
                <h3 className="text-2xl font-black text-[#3B4883] uppercase tracking-tight mb-2">Final Payment</h3>
                <p className="text-sm font-bold text-[#3B4883]/40">Add extra amount for good work or materials:</p>
              </div>

              <div className="mb-8">
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#3B4883]/20 transition-colors group-focus-within:text-[#FF7124]">₹</span>
                  <input
                    type="number"
                    value={additionalAmount}
                    onChange={(e) => setAdditionalAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#F8F5F2] border-2 border-transparent focus:border-[#FF7124] focus:bg-white rounded-2xl py-5 pl-12 pr-6 text-3xl font-black text-[#3B4883] outline-none transition-all text-center"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleEmployerFinish}
                  disabled={isProcessingFinish}
                  className="w-full py-5 bg-[#FF7124] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#e66420] transition-all active:scale-95 disabled:grayscale flex items-center justify-center gap-3"
                >
                  {isProcessingFinish ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Finalize & Pay'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAdditionalChargesModal(false);
                    setSelectedAppForPayment(null);
                    setAdditionalAmount(0);
                  }}
                  className="w-full py-3 text-[10px] font-black text-[#3B4883]/30 uppercase tracking-widest hover:text-[#FF7124] transition-colors"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence >
    </div >
  );
};

export default PostedJobs;