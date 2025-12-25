import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MapPin,
  Users,
  Clock,
  Briefcase,
  X,
  Building,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { getApiUrlSync } from '../../config/api.js';
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

  // Fetch posted jobs... (rest of the state and useEffect remains same)

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const apiUrl = getApiUrlSync();
        const response = await fetch(`${apiUrl}/jobs/employer/${user.id}`);
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
        const apiUrl = getApiUrlSync();
        const response = await fetch(`${apiUrl}/jobs/${selectedJob._id}/applications`);
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

      const apiUrl = getApiUrlSync();
      const response = await fetch(`${apiUrl}/job-applications/${pendingPaymentApp._id}/status`, {
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
      const apiUrl = getApiUrlSync();
      const response = await fetch(`${apiUrl}/job-applications/${applicationId}/status`, {
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

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.status === 'POSTED' || j.status === 'APPLIED').length;

  const getStatusBadge = (status) => {
    const statusMap = {
      'POSTED': { bg: 'bg-[#10b981]', text: 'NEW' },
      'APPLIED': { bg: 'bg-[#FF7124]', text: 'ACTIVE' },
      'accepted': { bg: 'bg-[#3B4883]', text: 'ACCEPTED' },
      'in-progress': { bg: 'bg-[#8b5cf6]', text: 'WORKING' },
      'COMPLETED': { bg: 'bg-gray-500', text: 'COMPLETE' },
      'default': { bg: 'bg-gray-400', text: status }
    };

    const config = statusMap[status] || statusMap.default;
    return (
      <span className={`${config.bg} text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider`}>
        {config.text || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-[#3B4883]/20 border-t-[#FF7124] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#202124]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b-2 border-[#3B4883]/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#3B4883] uppercase tracking-tight">
                My Posted Jobs
              </h1>
              <p className="text-xs text-[#202124]/50 mt-1">{totalJobs} jobs · {activeJobs} active</p>
            </div>
            <button
              onClick={() => navigate('/employer/post-job')}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF7124] text-white rounded-xl font-bold text-sm hover:bg-[#e66420] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              POST
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-[#3B4883]/30" />
            <p className="text-[#202124]/60 font-bold mb-4">No jobs posted yet</p>
            <button
              onClick={() => navigate('/employer/post-job')}
              className="px-6 py-3 bg-[#FF7124] text-white rounded-xl font-bold hover:bg-[#e66420]"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {jobs.map((job) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b-2 border-[#3B4883]/10 py-6 cursor-pointer hover:bg-[#E8DFD5]/30 transition-all px-4 -mx-4"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#272D4E] uppercase tracking-wide mb-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-[#202124]/60">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location?.village}, {job.location?.district}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#FF7124]">₹{job.salary || job.baseAmount}</p>
                    {getStatusBadge(job.status)}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-[#3B4883]">
                    <Users className="w-4 h-4" />
                    <span className="font-bold">{job.applicantCount || 0} applied</span>
                  </span>
                  {job.category && (
                    <span className="px-3 py-1 bg-[#3B4883] text-white rounded-full font-bold uppercase">
                      {job.category}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Applicants Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
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
              className="bg-white w-full max-w-2xl rounded-t-[2rem] sm:rounded-[1.5rem] shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-[#E8DFD5] to-[#DBBBA7] p-6 pb-8 shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
                    <p className="text-xs text-[#3B4883]/60 font-bold uppercase mb-0.5">Payment</p>
                    <p className="text-2xl font-black text-[#FF7124]">
                      ₹{selectedJob.salary || selectedJob.baseAmount}
                    </p>
                  </div>

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

                <h2 className="text-xl font-black text-[#3B4883] mb-3 uppercase tracking-tight">
                  {selectedJob.title}
                </h2>

                <div className="flex items-start gap-3 text-sm flex-wrap">
                  <div className="flex items-center gap-1.5 text-[#3B4883]/70">
                    <Users className="w-4 h-4 shrink-0" />
                    <span className="font-bold">{selectedJob.applicantCount || 0} applied</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#3B4883]/70">
                    <Building className="w-4 h-4 shrink-0" />
                    <span className="font-bold">{selectedJob.companyName || 'Company'}</span>
                  </div>
                </div>

                {selectedJob.category && (
                  <div className="absolute -bottom-3 left-6">
                    <span className="inline-block px-4 py-1.5 bg-[#3B4883] text-white text-xs font-black uppercase tracking-wider rounded-full shadow-md">
                      {selectedJob.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 relative">
                {/* Payment Simulation Overlay */}
                <AnimatePresence>
                  {pendingPaymentApp && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 z-30 bg-white p-8 flex flex-col items-center justify-center text-center"
                    >
                      <div className="w-20 h-20 bg-[#FF7124]/10 rounded-full flex items-center justify-center mb-6 text-[#FF7124]">
                        <CreditCard className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-black text-[#3B4883] uppercase mb-2">Secure Payment</h3>
                      <p className="text-[#3B4883]/60 font-bold mb-8">
                        Confirm payment of <span className="text-[#FF7124]">₹{selectedJob.salary || selectedJob.baseAmount}</span> to accept <span className="text-[#FF7124]">{pendingPaymentApp.worker?.name || pendingPaymentApp.workerDetails?.name}</span>
                      </p>

                      <div className="w-full space-y-3">
                        <button
                          onClick={handleConfirmPayment}
                          disabled={isPaying}
                          className="w-full py-4 bg-[#FF7124] text-white rounded-2xl font-black uppercase tracking-wider hover:bg-[#e66420] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-[#FF7124]/20"
                        >
                          {isPaying ? (
                            <>
                              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                              PROCESSING...
                            </>
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

                      <p className="mt-8 text-[10px] text-[#3B4883]/40 font-black uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.9L10 .3l7.834 4.6a1 1 0 01.5.866v7.468a1 1 0 01-.5.866L10 18.7l-7.834-4.6a1 1 0 01-.5-.866V5.766a1 1 0 01.5-.866zM9 11V7a1 1 0 112 0v4a1 1 0 11-2 0zm1 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        SSL SECURE TRANSACTION
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-xs font-black text-[#3B4883]/50 uppercase tracking-wider mb-4">Choose Applicant</p>

                {loadingApplications ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#3B4883]/20 border-t-[#FF7124] rounded-full animate-spin" />
                  </div>
                ) : applications.some(a => ['accepted', 'in-progress', 'completed'].includes(a.status)) ? (
                  // Show Application Status View for the accepted worker
                  <div className="space-y-6">
                    {(() => {
                      const acceptedApp = applications.find(a => ['accepted', 'in-progress', 'completed'].includes(a.status));
                      const statusSteps = [
                        { label: 'APPLIED', completed: true, active: acceptedApp.status === 'applied' },
                        { label: 'ACCEPTED', completed: ['accepted', 'in-progress', 'completed'].includes(acceptedApp.status), active: acceptedApp.status === 'accepted' },
                        { label: 'WORKING', completed: ['in-progress', 'completed'].includes(acceptedApp.status), active: acceptedApp.status === 'in-progress' },
                        { label: 'COMPLETED', completed: acceptedApp.status === 'completed', active: acceptedApp.status === 'completed' }
                      ];

                      return (
                        <>
                          <div className="bg-[#3B4883]/10 rounded-2xl p-6">
                            <p className="text-xs font-black text-[#3B4883]/50 uppercase tracking-wider mb-6 text-center">Application Progress</p>
                            <div className="flex items-center justify-between relative px-2">
                              {/* Connector Lines */}
                              <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-[#3B4883]/10 -z-0" />
                              <div
                                className="absolute top-[18px] left-[10%] h-0.5 bg-[#FF7124] transition-all duration-500 -z-0"
                                style={{ width: `${(statusSteps.filter(s => s.completed).length - 1) * 26.6}%` }}
                              />

                              {statusSteps.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 relative z-10 w-1/4">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step.completed ? 'bg-[#FF7124] border-[#FF7124] text-white' :
                                    step.active ? 'bg-white border-[#FF7124] text-[#FF7124]' :
                                      'bg-white border-[#3B4883]/10 text-[#3B4883]/30'
                                    }`}>
                                    {step.completed && !step.active && idx < statusSteps.length - 1 ? (
                                      <CheckCircle className="w-5 h-5" />
                                    ) : (
                                      <span className="font-black text-sm">{idx + 1}</span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-black uppercase tracking-tighter ${step.completed || step.active ? 'text-[#FF7124]' : 'text-[#3B4883]/30'
                                    }`}>
                                    {step.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#E8DFD5]/30 rounded-2xl p-4">
                              <p className="text-[10px] font-black text-[#3B4883]/50 uppercase mb-1">Worker</p>
                              <p className="font-black text-[#3B4883] uppercase">{acceptedApp.worker?.name || acceptedApp.workerDetails?.name}</p>
                              <p className="text-xs font-bold text-[#3B4883]/60">{acceptedApp.worker?.phone || acceptedApp.workerDetails?.phone}</p>
                            </div>
                            <div className="bg-[#E8DFD5]/30 rounded-2xl p-4 text-right">
                              <p className="text-[10px] font-black text-[#3B4883]/50 uppercase mb-1">Status</p>
                              <p className="font-black text-[#FF7124] uppercase">{acceptedApp.status}</p>
                              <p className="text-xs font-bold text-[#3B4883]/60">Payment: Pending</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 pt-4">
                            {acceptedApp.status === 'accepted' && (
                              <button
                                onClick={() => handleRevokeApplicant(acceptedApp._id)}
                                className="w-full py-4 border-2 border-[#FF7124] text-[#FF7124] rounded-2xl font-black uppercase tracking-wider hover:bg-[#FF7124] hover:text-white transition-all active:scale-95"
                              >
                                Revoke Acceptance
                              </button>
                            )}
                            <button
                              className="w-full py-4 bg-[#3B4883] text-white rounded-2xl font-black uppercase tracking-wider opacity-50 cursor-not-allowed"
                              disabled
                            >
                              More Actions Coming Soon
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-3 text-[#3B4883]/30" />
                    <p className="text-[#202124]/50 text-sm">No applications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div
                        key={app._id}
                        className="bg-gradient-to-br from-white to-[#F8F5F2] border-2 border-[#3B4883]/10 rounded-xl p-4 hover:border-[#FF7124]/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-black text-[#3B4883] text-lg uppercase tracking-tight">
                              {app.worker?.name || app.workerDetails?.name || 'Worker'}
                            </h4>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <div className="flex items-center gap-1.5 bg-[#10b981]/10 px-3 py-1.5 rounded-full border border-[#10b981]/20">
                                <svg className="w-4 h-4 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-black text-[#10b981]">
                                  Shakti: {app.worker?.shaktiScore || app.workerDetails?.shaktiScore || 85}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-[#3B4883]/60">
                                <MapPin className="w-3 h-3" />
                                <span className="font-bold">~{app.distanceFromWork ? app.distanceFromWork.toFixed(1) : Math.floor(Math.random() * 10 + 1)}km</span>
                              </div>
                            </div>
                          </div>

                          {app.status === 'applied' || app.status === 'APPLIED' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptClick(app);
                              }}
                              className="px-6 py-2 bg-[#FF7124] text-white rounded-xl font-bold uppercase text-xs hover:bg-[#e66420] transition-all active:scale-95 whitespace-nowrap self-end"
                            >
                              Accept
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2 items-end">
                              <div className="px-4 py-2 bg-[#10b981] text-white rounded-xl font-bold uppercase text-xs">
                                ✓ Accepted
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRevokeApplicant(app._id);
                                }}
                                className="px-4 py-2 border-2 border-[#FF7124] text-[#FF7124] rounded-xl font-bold uppercase text-xs hover:bg-[#FF7124] hover:text-white transition-all active:scale-95 whitespace-nowrap"
                              >
                                Revoke
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#202124]/50">
                          <span>Applied: {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          {(app.worker?.phone || app.workerDetails?.phone) && (
                            <>
                              <span>•</span>
                              <span>{app.worker?.phone || app.workerDetails?.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostedJobs;