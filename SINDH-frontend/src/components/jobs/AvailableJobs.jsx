import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  MapPin,
  Users,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Navigation,
  ChevronRight,
  Clock
} from 'lucide-react';

const AvailableJobs = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  // State
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  // Real-time jobs listener
  useEffect(() => {
    if (user === undefined) return;

    console.log('📡 Setting up real-time jobs listener');
    setLoading(true);

    // 1. Listen to jobs collection (status-based to match backend writes)
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('status', 'in', ['POSTED', 'active', 'APPLIED'])
    );

    const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
      const jobsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          _id: doc.id,
          ...data,
          // Robust location handling
          displayLocation: data.location?.village || data.location?.district || data.location?.city || 'Location'
        };
      });
      console.log(`✅ Received ${jobsList.length} jobs from Firestore`);
      setJobs(jobsList);
      setLoading(false);
    }, (error) => {
      console.error('❌ Jobs listener error:', error);
      toast.error('Could not load jobs');
      setLoading(false);
    });

    // 2. Listen to worker's applications to track 'hasApplied'
    let unsubscribeApps = () => { };
    if (user?.id && user?.type === 'worker') {
      console.log('📡 Setting up real-time applications listener for worker:', user.id);
      const appsQuery = query(
        collection(db, 'applications'),
        where('worker', '==', user.id)
      );

      unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
        const appJobIds = new Set(snapshot.docs.map(doc => {
          const jobId = doc.data().job;
          return typeof jobId === 'string' ? jobId : (jobId?.id || String(jobId));
        }));
        console.log(`📝 Worker has applied to ${appJobIds.size} jobs`);
        setAppliedJobIds(appJobIds);
      });
    }

    return () => {
      unsubscribeJobs();
      unsubscribeApps();
    };
  }, [user?.id, user?.type]);

  // Update hasApplied flag when jobs or appliedJobIds change
  useEffect(() => {
    const updatedJobs = jobs.map(job => ({
      ...job,
      hasApplied: appliedJobIds.has(job.id) || appliedJobIds.has(job._id)
    }));
    setFilteredJobs(updatedJobs);
  }, [jobs, appliedJobIds]);

  // Filters matching the reference layout
  const filters = [
    { id: 'all', label: 'ALL WORKS' },
    { id: 'trending', label: 'TRENDING' },
    { id: 'best', label: 'BEST OF' },
    { id: 'pricy', label: 'PRICY' },
    { id: 'nearest', label: 'NEAREST' }
  ];

  // Filters matching the reference layout

  // Apply for job
  const handleApply = async (job) => {
    if (!user || user.type !== 'worker') {
      toast.error('Please login as a worker to apply');
      navigate('/login');
      return;
    }

    setApplyingJobId(job._id);
    try {
      const response = await fetch(buildApiUrl('/job-applications/apply'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Type': user?.type || 'guest',
          'User-ID': user?.id || ''
        },
        body: JSON.stringify({
          jobId: job._id,
          workerId: user.id,
          workerDetails: {
            name: user.name,
            phone: user.phone,
            skills: user.skills || [],
            experience: user.experience_years || 0
          }
        })
      });

      if (response.ok) {
        const result = await response.json();

        // Show success animation  
        setShowSuccessAnimation(true);

        // Save application ID to localStorage
        try {
          const appliedJobs = JSON.parse(localStorage.getItem('appliedJobIds') || '[]');
          const applicationId = result.data?._id || result.application?._id;
          if (applicationId && !appliedJobs.includes(applicationId)) {
            appliedJobs.push(applicationId);
            localStorage.setItem('appliedJobIds', JSON.stringify(appliedJobs));
            console.log('✅ Saved application to localStorage:', applicationId);
          }
        } catch (e) {
          console.warn('⚠️ Could not save to localStorage:', e);
        }

        // Freeze the applied job (mark as applied, don't remove)
        setTimeout(() => {
          const updatedJobs = jobs.map(j =>
            j._id === job._id ? { ...j, hasApplied: true } : j
          );
          setJobs(updatedJobs);
          setFilteredJobs(updatedJobs);
          setShowSuccessAnimation(false);
          toast.success("Applied successfully!");
        }, 2000);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to apply");
      }
    } catch (e) {
      toast.error("Application failed");
    } finally {
      setApplyingJobId(null);
    }
  };



  // Distance calculation (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Filter and sort jobs based on user profile and distance
  useEffect(() => {
    if (!jobs.length) {
      setFilteredJobs([]);
      return;
    }

    let result = [...jobs];

    // Calculate distances if user location is available
    if (user?.location?.coordinates?.coordinates) {
      const [userLon, userLat] = user.location.coordinates.coordinates;

      result = result.map(job => {
        let distance = null;
        if (job.location?.coordinates?.coordinates) {
          const [jobLon, jobLat] = job.location.coordinates.coordinates;
          distance = calculateDistance(userLat, userLon, jobLat, jobLon);
        }
        return { ...job, calculatedDistance: distance };
      });
    }

    // Default Filtering Logic (when 'trending' / default tab is active or just broadly)
    // The user requested: show jobs matching (category + district), sorted by distance
    // We'll prioritize this logic but keep the other filters available

    // Always sort by distance ascending first (nearest first)
    result.sort((a, b) => {
      // If distance is available for both, sort by it
      if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
        return a.calculatedDistance - b.calculatedDistance;
      }
      // Put jobs with distance known before those without
      if (a.calculatedDistance !== null) return -1;
      if (b.calculatedDistance !== null) return 1;
      return 0;
    });

    if (user?.type === 'worker' && selectedFilter !== 'all') {
      // Filter by District (if user has it)
      if (user.location?.district) {
        // Prioritize district matches.
        // The prompt says "show... in the district". Let's filter.
        const districtJobs = result.filter(job =>
          job.location?.district?.toLowerCase() === user.location.district.toLowerCase()
        );
        // If we have district matches, use them.
        if (districtJobs.length > 0) {
          result = districtJobs;
        }
      }

      // Filter by Category (if user has it)
      if (user.preferredCategory) {
        const categoryJobs = result.filter(job =>
          job.category?.toLowerCase() === user.preferredCategory.toLowerCase()
        );
        // Same logic: strict filter if matches found
        if (categoryJobs.length > 0) {
          result = categoryJobs;
        }
      }
    }

    // Handle filter tabs (optional additional filtering)
    if (selectedFilter === 'nearest') {
      // Already sorted by distance
    } else if (selectedFilter === 'pricy') {
      result.sort((a, b) => (b.baseAmount || 0) - (a.baseAmount || 0));
    }

    setFilteredJobs(result);
  }, [jobs, user, selectedFilter]);

  // Render Loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-[#3B4883]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF7124] rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#202124] relative overflow-hidden">
      {/* Background matching homepage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background: 'radial-gradient(1200px 600px at 50% 0%, rgba(59, 72, 131, 0.08), transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header Section - Like "HIMALAYAN_CAFE" */}
        <div className="px-6 pt-8 pb-6 border-b-2 border-[#3B4883]/10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl md:text-4xl font-black text-[#3B4883] tracking-tight uppercase">
              |AVAILABLE_JOBS
            </h1>
          </div>

          {/* Filter Tabs - Like "TRENDING | STARTERS | PASTA" */}
          <div className="flex gap-0 border-2 border-[#3B4883]/20 bg-[#3B4883]/5">
            {filters.map((filter, index) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex-1 px-2 py-3 text-[10px] md:text-sm font-bold uppercase tracking-wider transition-all truncate ${selectedFilter === filter.id
                  ? 'bg-white text-[#3B4883] border-b-4 border-[#FF7124]'
                  : 'text-[#202124]/60 hover:bg-white hover:text-[#3B4883]'
                  } ${index !== 0 ? 'border-l-2 border-[#3B4883]/20' : ''}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job List - Like food items */}
        <div className="px-6 py-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-20 opacity-60">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[#3B4883] font-bold">No jobs found</p>
              <p className="text-sm text-slate-400">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b-2 border-[#3B4883]/10 py-6 transition-all cursor-pointer group relative ${job.hasApplied
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-[#E8DFD5]/30'
                    }`}
                  onClick={() => !job.hasApplied && navigate(`/jobs/${job._id}`)}
                >
                  {/* Applied Badge */}
                  {job.hasApplied && (
                    <div className="absolute top-6 right-0 bg-[#10b981] text-white px-4 py-1 rounded-l-full text-xs font-black uppercase tracking-wider">
                      ✓ Applied
                    </div>
                  )}

                  {/* Job Title & Price Row */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`text-xl font-bold uppercase tracking-wide transition-colors ${job.hasApplied ? 'text-[#272D4E]/50' : 'text-[#272D4E] group-hover:text-[#FF7124]'
                      }`}>
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {job.urgency && job.urgency !== 'Normal' && (
                        <span className="px-3 py-1 bg-[#FF7124]/10 text-[#FF7124] text-xs font-black uppercase tracking-wider border border-[#FF7124]/30">
                          {job.urgency}
                        </span>
                      )}
                      <span className="text-2xl font-black text-[#FF7124]">
                        ₹{job.baseAmount || job.salary}
                      </span>
                    </div>
                  </div>

                  {/* Job Description */}
                  <p className="text-sm text-[#202124]/70 mb-4 line-clamp-2 font-medium">
                    {job.description || 'No description available'}
                  </p>

                  {/* Bottom Row: Location, Applicants, Apply */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-[#3B4883] font-semibold">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {job.displayLocation}
                          <span className="text-[#202124]/40 ml-1">(~{job.calculatedDistance ? job.calculatedDistance.toFixed(1) : '?'}km)</span>
                        </span>
                      </div>

                      {/* Timing */}
                      {(job.startDate || job.startTime) && (
                        <div className="flex items-center gap-2 text-sm text-[#FF7124] font-semibold">
                          <Clock className="w-4 h-4" />
                          <span>
                            {job.startDate ? (() => {
                              try {
                                const d = job.startDate?.toDate ? job.startDate.toDate() : new Date(job.startDate);
                                return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                              } catch (e) {
                                return 'Upcoming';
                              }
                            })() : ''}
                            {job.startTime ? ` @ ${job.startTime}` : ''}
                            {job.endTime ? ` - ${job.endTime}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Applicants */}
                      <div className="flex items-center gap-2 text-sm text-[#202124]/60 font-semibold">
                        <Users className="w-4 h-4" />
                        <span>{job.applicantCount || 0} applied</span>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(job);
                      }}
                      disabled={job.hasApplied || applyingJobId === job._id}
                      className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all border-2 ${job.hasApplied
                        ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                        : 'bg-white text-[#3B4883] border-[#3B4883] hover:bg-[#3B4883] hover:text-white active:scale-95'
                        }`}
                    >
                      {applyingJobId === job._id ? (
                        <div className="w-4 h-4 border-2 border-[#3B4883]/30 border-t-[#3B4883] rounded-full animate-spin mx-auto" />
                      ) : job.hasApplied ? (
                        'APPLIED'
                      ) : (
                        'APPLY'
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm mx-6"
            >
              {/* Success Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF7124] to-[#e66420] flex items-center justify-center shadow-lg"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="w-16 h-16 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path d="M20 6L9 17l-5-5" />
                </motion.svg>
              </motion.div>

              {/* Success Text */}
              <div className="text-center">
                <h3 className="text-2xl font-black text-[#3B4883] uppercase tracking-wide mb-2">
                  Application Successful!
                </h3>
                <p className="text-sm text-[#202124]/60 font-medium">
                  The employer will be notified shortly
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvailableJobs;