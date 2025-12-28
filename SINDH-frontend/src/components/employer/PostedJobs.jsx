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

  // Fetch posted jobs... (rest of the state and useEffect remains same)

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(`/jobs/employer/${user.id}`));
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  // Fetch applications when job is selected
  useEffect(() => {
    const fetchApplications = async () => {
      if (!selectedJob) {
        setApplications([]);
        return;
      }

      try {
        setLoadingApplications(true);
        const response = await fetch(buildApiUrl(`/jobs/${selectedJob._id}/applications`));
        if (response.ok) {
          const data = await response.json();

          // Normalize response - ensure it's always an array
          let applicationsArray = [];
          if (Array.isArray(data)) {
            applicationsArray = data;
          } else if (data.applications && Array.isArray(data.applications)) {
            applicationsArray = data.applications;
          } else if (data.data && Array.isArray(data.data)) {
            applicationsArray = data.data;
          }

          console.log('📋 Applications loaded:', applicationsArray.length);
          setApplications(applicationsArray);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications');
        setApplications([]);
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [selectedJob]);

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
  const activeJobs = jobs.filter(j => j.status === 'POSTED' || j.status === 'APPLIED').length;

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
        <div className="px-6 pt-8 pb-4">
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
                        <div className="flex items-center gap-1.5 font-medium text-[#3B4883]/60 text-xs">
                          <MapPin className="w-3 h-3 text-[#3B4883]/40" />
                          <span>{job.location?.village}, {job.location?.district}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium text-[#3B4883]/60 text-xs">
                          <Users className="w-3 h-3 text-[#3B4883]/40" />
                          <span>{job.applicantCount || 0} applicants</span>
                        </div>
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
                        <span>Posted on {new Date(job.createdAt).toLocaleDateString()}</span>
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
              {/* Modal Header Card */}
              <div className="relative bg-gradient-to-br from-[#E8DFD5] to-[#DBBBA7] p-6 pb-8 shrink-0">
                <div className="flex justify-between items-start mb-4">
                  {/* Price Card */}
                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
                    <p className="text-xs text-[#3B4883]/60 font-bold uppercase mb-0.5">Budget</p>
                    <p className="text-2xl font-black text-[#FF7124]">
                      ₹{selectedJob.salary || selectedJob.baseAmount}
                    </p>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="p-2 hover:bg-white/50 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-[#3B4883]" />
                    </button>
                    {getStatusBadge(selectedJob.status)}
                  </div>
                </div>

                <h2 className="text-xl font-black text-[#3B4883] mb-2 uppercase tracking-tight leading-tight">
                  {selectedJob.title}
                </h2>

                <div className="flex items-start gap-4 text-sm flex-wrap pb-2">
                  <div className="flex items-center gap-1.5 text-[#3B4883]/70 font-bold">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{selectedJob.location?.village}, {selectedJob.location?.district}</span>
                  </div>
                  {(selectedJob.startDate || selectedJob.startTime) && (
                    <div className="flex items-center gap-1.5 text-[#FF7124] font-bold">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        {selectedJob.startDate ? new Date(selectedJob.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        {selectedJob.startTime ? ` @ ${selectedJob.startTime}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {selectedJob.category && (
                  <div className="absolute -bottom-3 left-6 z-10">
                    <span className="inline-block px-4 py-1.5 bg-[#3B4883] text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg border-2 border-white">
                      {selectedJob.category}
                    </span>
                  </div>
                )}
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
                      className="absolute inset-0 z-[40] bg-[#3B4883]/60 backdrop-blur-md p-8 flex flex-col items-center justify-center text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border-4 border-white/20"
                      >
                        <div className="w-20 h-20 bg-[#FF7124]/10 rounded-3xl flex items-center justify-center mb-6 text-[#FF7124] mx-auto rotate-3">
                          <CreditCard className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-[#3B4883] uppercase mb-2">Secure Payment</h3>
                        <p className="text-[#3B4883]/60 font-bold mb-8">
                          Confirm payment for <span className="text-[#FF7124]">{pendingPaymentApp.worker?.name || pendingPaymentApp.workerDetails?.name}</span>
                        </p>

                        <div className="space-y-3">
                          <button
                            onClick={handleConfirmPayment}
                            disabled={isPaying}
                            className="w-full py-4 bg-[#FF7124] text-white rounded-2xl font-black uppercase tracking-wider hover:bg-[#e66420] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-[#FF7124]/20"
                          >
                            {isPaying ? (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                PROCESSING...
                              </div>
                            ) : (
                              `PAY ₹${selectedJob.salary || selectedJob.baseAmount}`
                            )}
                          </button>
                          <button
                            onClick={() => setPendingPaymentApp(null)}
                            disabled={isPaying}
                            className="w-full py-4 border-2 border-[#3B4883]/10 text-[#3B4883]/60 rounded-2xl font-black uppercase tracking-wider hover:bg-[#3B4883]/5 transition-all"
                          >
                            CANCEL
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Job Description */}
                {selectedJob.description && (
                  <div className="mb-6">
                    <p className="text-xs font-black text-[#3B4883]/50 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-[#202124]/80 leading-relaxed font-medium">
                      {selectedJob.description}
                    </p>
                  </div>
                )}

                {/* Job Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-[#F8F5F2] p-4 rounded-2xl border border-[#3B4883]/5">
                    <p className="text-[10px] font-bold text-[#3B4883]/50 uppercase mb-1">Work Timing</p>
                    <p className="text-xs font-black text-[#3B4883]">
                      {selectedJob.startDate ? new Date(selectedJob.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible'}
                      {selectedJob.startTime ? ` @ ${selectedJob.startTime}` : ''}
                    </p>
                  </div>
                  <div className="bg-[#F8F5F2] p-4 rounded-2xl border border-[#3B4883]/5">
                    <p className="text-[10px] font-bold text-[#3B4883]/50 uppercase mb-1">Location Type</p>
                    <p className="text-xs font-black text-[#3B4883] uppercase">
                      {selectedJob.location?.type || 'On-site'}
                    </p>
                  </div>
                  <div className="bg-[#F8F5F2] p-4 rounded-2xl border border-[#3B4883]/5">
                    <p className="text-[10px] font-bold text-[#3B4883]/50 uppercase mb-1">Posted On</p>
                    <p className="text-xs font-black text-[#3B4883]">
                      {selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                    </p>
                  </div>
                  <div className="bg-[#F8F5F2] p-4 rounded-2xl border border-[#3B4883]/5">
                    <p className="text-[10px] font-bold text-[#3B4883]/50 uppercase mb-1">Urgency</p>
                    <p className={`text-xs font-black uppercase ${selectedJob.urgency === 'High' || selectedJob.urgency === 'Urgent' ? 'text-[#FF7124]' : 'text-[#3B4883]'}`}>
                      {selectedJob.urgency || 'Normal'}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-black text-[#3B4883]/50 uppercase tracking-wider">Applicants & Management</p>
                    {applications.length > 0 && !applications.some(a => ['accepted', 'working', 'in-progress', 'payment_pending', 'completed'].includes(a.status?.toLowerCase())) && (
                      <span className="bg-[#FF7124]/10 text-[#FF7124] px-2 py-0.5 rounded text-[10px] font-black uppercase">
                        {applications.length} APPLIED
                      </span>
                    )}
                  </div>

                  {loadingApplications ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-[#3B4883]/20 border-t-[#FF7124] rounded-full animate-spin" />
                    </div>
                  ) : applications.some(a => ['accepted', 'working', 'in-progress', 'payment_pending', 'completed'].includes(a.status?.toLowerCase())) ? (
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
                                    <p className="text-xs font-bold text-white/60">{app.worker?.phone || app.workerDetails?.phone}</p>
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
                    <div className="space-y-3">
                      {applications.map((app) => {
                        const status = app.status?.toLowerCase();
                        const isAccepted = ['accepted', 'working', 'in-progress', 'payment_pending', 'completed'].includes(status);

                        return (
                          <div
                            key={app._id}
                            className={`p-4 bg-white border-2 rounded-2xl transition-all cursor-pointer shadow-sm group ${isAccepted
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : 'border-[#3B4883]/5 hover:border-[#FF7124]/30'
                              }`}
                            onClick={() => {
                              // Only show payment modal for 'applied' status
                              if (status === 'applied' || status === 'pending') {
                                handleAcceptClick(app);
                              }
                              // For accepted/working, the workflow view is already shown above
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl transition-colors ${isAccepted
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-[#F8F5F2] text-[#FF7124] group-hover:bg-[#FF7124] group-hover:text-white'
                                  }`}>
                                  {app.worker?.name?.charAt(0) || 'W'}
                                </div>
                                <div>
                                  <p className="font-black text-[#3B4883] uppercase">{app.worker?.name || app.workerDetails?.name}</p>
                                  <div className="flex items-center gap-2 text-xs font-bold text-[#3B4883]/40">
                                    <span className="flex items-center gap-1 text-green-600">
                                      <MapPin className="w-3 h-3" /> ~{app.distanceFromWork ? app.distanceFromWork.toFixed(1) : 10}km
                                    </span>
                                    <span>• Shakti: {app.worker?.shaktiScore || 85}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAccepted && (
                                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${status === 'working' || status === 'in-progress'
                                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                    : status === 'payment_pending'
                                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                      : status === 'completed'
                                        ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    }`}>
                                    {status === 'in-progress' ? 'Working' : (status === 'payment_pending' ? 'Payment Pending' : status)}
                                  </span>
                                )}
                                {!isAccepted && (
                                  <ChevronRight className="w-5 h-5 text-[#3B4883]/20 group-hover:text-[#FF7124] transition-colors" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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