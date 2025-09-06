import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../../utils/apiUtils';
import { 
  MapPin, 
  Briefcase, 
  CheckCircle,
  Search,
  ArrowLeft,
  Menu
} from 'lucide-react';
import JobApplicationProgress from '../worker/JobApplicationProgress';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const AvailableJobs = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  
  // Core state management
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  
  // Application states
  const [applyingJobs, setApplyingJobs] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [myApplicationsCount, setMyApplicationsCount] = useState(0);
  const [appliedJobsCount, setAppliedJobsCount] = useState(0);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    minSalary: '',
    employmentType: ''
  });

  // Location-based job grouping
  const [locationBasedJobs, setLocationBasedJobs] = useState([]);
  const [otherLocationJobs, setOtherLocationJobs] = useState([]);

  // Language and menu controls
  const [isHindi, setIsHindi] = useState(localStorage.getItem('language') === 'hi');
  const [showPageMenu, setShowPageMenu] = useState(false);

  const toggleLang = () => {
    const newLang = isHindi ? 'en' : 'hi';
    setIsHindi(!isHindi);
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const navigateToPage = (path) => {
    navigate(path);
  };

  // Fetch applications count for stats card
  const fetchApplicationsCount = useCallback(async () => {
    if (!user?.id || user.type !== 'worker') return;
    
    try {
      const response = await fetch(buildApiUrl(`/job-applications/worker/${user.id}/count`), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Type': user?.type || 'guest',
          'User-ID': user?.id || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyApplicationsCount(data.totalApplications || 0);
        setAppliedJobsCount(data.appliedJobs || 0);
      }
    } catch (error) {
      console.error('Error fetching applications count:', error);
    }
  }, [user]);

  // Progress ring component for stats
  const ProgressRing = ({ size = 28, strokeWidth = 3, progress = 0 }) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clamped);
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(163, 230, 53)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
    );
  };

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    try {
      console.log('🚀 Starting to fetch jobs...');
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      // Add user-specific parameter for application status
      if (user?.id && user?.type === 'worker') {
        queryParams.append('workerId', user.id);
        console.log('👤 Adding workerId to query:', user.id);
      }
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          queryParams.append(key, value.trim());
          console.log(`🔍 Adding filter ${key}:`, value.trim());
        }
      });
      
      // Use dual status endpoint for better job filtering
      const apiUrl = buildApiUrl(`/jobs/dual-status?${queryParams.toString()}`);
      console.log('🌐 Fetching from API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Type': user?.type || 'guest',
          'User-ID': user?.id || ''
        }
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Jobs not found');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please log in again.');
        } else {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
        }
      }
      
      const jobsData = await response.json();
      console.log('📦 Raw jobs data:', jobsData);
      
      // Handle different response formats - same pattern as profile fetching
      let jobsArray = [];
      if (Array.isArray(jobsData)) {
        jobsArray = jobsData;
        console.log('📋 Jobs data is direct array');
      } else if (jobsData.data && Array.isArray(jobsData.data)) {
        jobsArray = jobsData.data;
        console.log('📋 Jobs data found in response.data');
      } else if (jobsData.jobs && Array.isArray(jobsData.jobs)) {
        jobsArray = jobsData.jobs;
        console.log('📋 Jobs data found in response.jobs');
      } else if (jobsData.success && jobsData.data && Array.isArray(jobsData.data)) {
        jobsArray = jobsData.data;
        console.log('📋 Jobs data found in response.data (success format)');
      } else {
        console.warn('⚠️ Unexpected jobs data format:', jobsData);
        jobsArray = [];
      }
      
      console.log('📋 Processed jobs array length:', jobsArray.length);
      
      // Apply dual status filtering for Available Jobs page
      // Show jobs where:
      // 1. Worker status is 'active' (available for application) OR 'applied' (already applied)
      // 2. Employer status is 'active' (still accepting applications)
      const availableJobs = jobsArray.filter(job => {
        const workerStatusValid = ['active', 'applied'].includes(job.workerStatus);
        const employerStatusValid = job.employerStatus === 'active';
        
        return workerStatusValid && employerStatusValid;
      });
      
      console.log('📊 Dual status filtering results:');
      console.log('  Total jobs from API:', jobsArray.length);
      console.log('  Available jobs after filtering:', availableJobs.length);
      console.log('  Filter criteria: workerStatus in ["active", "applied"] AND employerStatus === "active"');
      
      // Use filtered jobs for further processing
      jobsArray = availableJobs;
      
      // Validate jobs data structure
      if (jobsArray.length > 0) {
        const sampleJob = jobsArray[0];
        console.log('📋 Sample job structure:', {
          id: sampleJob._id || sampleJob.id,
          title: sampleJob.title,
          companyName: sampleJob.companyName,
          location: sampleJob.location,
          salary: sampleJob.salary,
          workerStatus: sampleJob.workerStatus,
          employerStatus: sampleJob.employerStatus,
          hasApplied: sampleJob.hasApplied
        });
        
        // Optional verbose logging removed for production
      }
      
      // Deduplicate jobs by ID
      const uniqueJobs = deduplicateJobs(jobsArray);
      console.log('✅ Final unique jobs count:', uniqueJobs.length);
      
      setJobs(uniqueJobs);
      setFilteredJobs(uniqueJobs);
      
      // Group jobs by location if user has location preference
      if (user?.location?.state) {
        const userState = user.location.state.toLowerCase();
        console.log(`📍 User location state: ${userState}`);
        console.log(`📍 User location data:`, user.location);
        
        const locationBased = uniqueJobs.filter(job => {
          const jobState = job.location?.state?.toLowerCase();
          const matches = jobState === userState;
          console.log(`📍 Job "${job.title}" state: ${jobState}, matches: ${matches}`);
          return matches;
        });
        const otherLocation = uniqueJobs.filter(job => 
          job.location?.state?.toLowerCase() !== userState
        );
        
        console.log(`📍 Location-based jobs: ${locationBased.length} in ${userState}`);
        console.log(`📍 Other location jobs: ${otherLocation.length}`);
        
        setLocationBasedJobs(locationBased);
        setOtherLocationJobs(otherLocation);
      } else {
        console.log('📍 No user location preference, showing all jobs');
        setLocationBasedJobs([]);
        setOtherLocationJobs(uniqueJobs);
      }
      
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Try fallback approach - same as profile components
      try {
        console.log('🔄 Trying fallback approach...');
        
        // Try without user headers
        const fallbackResponse = await fetch(buildApiUrl('/jobs'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('✅ Fallback successful, found jobs:', fallbackData.length);
          
          let fallbackJobs = [];
          if (Array.isArray(fallbackData)) {
            fallbackJobs = fallbackData;
          } else if (fallbackData.data && Array.isArray(fallbackData.data)) {
            fallbackJobs = fallbackData.data;
          } else if (fallbackData.jobs && Array.isArray(fallbackData.jobs)) {
            fallbackJobs = fallbackData.jobs;
          }
          
          const uniqueFallbackJobs = deduplicateJobs(fallbackJobs);
          setJobs(uniqueFallbackJobs);
          setFilteredJobs(uniqueFallbackJobs);
          setLocationBasedJobs([]);
          setOtherLocationJobs(uniqueFallbackJobs);
          setError(null);
          
          console.log('✅ Fallback jobs loaded successfully');
          return;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      setError(error.message);
      setJobs([]);
      setFilteredJobs([]);
      setLocationBasedJobs([]);
      setOtherLocationJobs([]);
      
      // Show user-friendly error message
      toast.error('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
      console.log('🏁 Fetch jobs process finished');
    }
  }, [user, filters]);

  // Enhanced deduplication function with better logging
  const deduplicateJobs = (jobs) => {
    const uniqueJobsMap = new Map();
    
    jobs.forEach((job, index) => {
      const jobId = job._id || job.id;
      if (jobId && !uniqueJobsMap.has(jobId)) {
        uniqueJobsMap.set(jobId, job);
      } else if (!jobId) {
        console.warn(`⚠️ Job at index ${index} has no ID:`, job);
      } else {
        console.log(`🔄 Duplicate job found: ${jobId}`);
      }
    });
    
    const uniqueJobs = Array.from(uniqueJobsMap.values());
    console.log(`🔄 Deduplicated ${jobs.length} jobs to ${uniqueJobs.length} unique jobs`);
    
    return uniqueJobs;
  };

  // Apply search and filters with enhanced logic
  useEffect(() => {
    console.log('🔍 Applying search and filters...');
    console.log('🔍 Search term:', searchTerm);
    console.log('🔍 Current jobs:', jobs.length);
    
    let filtered = [...jobs];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length);
    }

    // Deduplicate filtered results as well
    const uniqueFiltered = deduplicateJobs(filtered);
    setFilteredJobs(uniqueFiltered);
    console.log('✅ Final filtered jobs:', uniqueFiltered.length);
  }, [searchTerm, jobs]);

  // Enhanced job application handler
  const handleApplyForJob = async (job) => {
    if (!user || user.type !== 'worker') {
      toast.error('Please login as a worker to apply for jobs');
      navigate('/login');
      return;
    }

    if (job.hasApplied) {
      toast.error('You have already applied for this job');
      return;
    }

    setApplyingJobs(prev => new Set([...prev, job._id]));

    try {
      console.log('📝 Applying for job:', job._id);
      
      // First fetch the job details to get the employer ID
      const jobResponse = await fetch(buildApiUrl(`/jobs/${job._id}`), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Type': user?.type || 'guest',
          'User-ID': user?.id || ''
        }
      });
      
      if (!jobResponse.ok) {
        if (jobResponse.status === 404) {
          throw new Error('Job not found');
        } else {
          const errorText = await jobResponse.text();
          throw new Error(`Failed to fetch job details: ${jobResponse.status} ${errorText}`);
        }
      }
      const jobData = await jobResponse.json();

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
        const successMessage = result.jobStatusUpdated 
          ? 'Application submitted successfully! Job status updated to in-progress.'
          : 'Application submitted successfully!';
        
        toast.success(successMessage);
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
        fetchJobs(); // Refresh jobs to update application status
        fetchApplicationsCount(); // Refresh applications count for stats card
        
        // Save application ID to localStorage for MyApplications tracking
        if (result.data && result.data._id) {
          let applicationIds = JSON.parse(localStorage.getItem('myApplicationIds') || '[]');
          if (!applicationIds.includes(result.data._id)) {
            applicationIds.push(result.data._id);
            localStorage.setItem('myApplicationIds', JSON.stringify(applicationIds));
            console.log('💾 Saved application ID to localStorage:', result.data._id);
            console.log('📋 All application IDs:', applicationIds);
          }
        }
        
        // Trigger refresh of MyApplications page using localStorage
        localStorage.setItem('refreshApplications', 'true');
        
        // Also dispatch a custom event for immediate refresh if on same page
        window.dispatchEvent(new CustomEvent('applicationSubmitted', {
          detail: { jobId: job._id, workerId: user.id, applicationId: result.data?._id }
        }));
        
        // Show success message with option to view applications
        toast.success(
          <div>
            <div>{successMessage}</div>
            <button 
              onClick={() => navigate('/worker/applications')}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              View My Applications
            </button>
          </div>,
          { autoClose: 5000 }
        );

        // Automatically redirect to applications page after successful application
        setTimeout(() => {
          toast.success('🎉 Redirecting to your applications page...', {
            autoClose: 2000
          });
          navigate('/worker/applications');
        }, 1500); // Reduced from 2000ms to 1500ms for faster redirect
        
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplyingJobs(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(job._id);
        return newSet;
      });
    }
  };

  // Enhanced filter change handlers
  const handleFilterChange = (filterType, value) => {
    console.log(`🔧 Filter change: ${filterType} = ${value}`);
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
  };

  const handleApplyFilter = () => {
    console.log('🔧 Applying filters:', filters);
    fetchJobs();
  };

  // Enhanced render job card with MyApplications styling
  const renderJobCard = (job) => {
    const applicationStatus = job.applicationStatus;
    const hasApplied = job.hasApplied;
    const userApplication = applications.find(app => app.job?._id === job._id);
    
    // Don't show in-progress or completed jobs
    if (job.status === 'in-progress' || job.status === 'completed') {
      return null;
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'bg-white/10 text-yellow-300 border-white/10';
        case 'accepted': return 'bg-white/10 text-green-300 border-white/10';
        case 'in-progress': return 'bg-white/10 text-blue-300 border-white/10';
        case 'completed': return 'bg-white/10 text-purple-300 border-white/10';
        default: return 'bg-white/10 text-white/80 border-white/10';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'pending': return '⏳';
        case 'accepted': return '✅';
        case 'in-progress': return '🔄';
        case 'completed': return '✅';
        default: return '❌';
      }
    };

    return (
      <motion.div
        key={job._id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -5 }}
        className="bg-white/5 border border-white/10 text-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 mx-1 backdrop-blur-md"
      >
        {/* Status Banner - Only show if user has applied */}
        {hasApplied && (
          <div className={`px-3 sm:px-4 py-2 ${getStatusColor(applicationStatus)} border-b`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">{getStatusIcon(applicationStatus)}</span>
                <span className="ml-2 text-xs sm:text-sm font-medium">
                  {applicationStatus === 'pending' ? 'Applied' :
                   applicationStatus === 'accepted' ? 'Accepted' :
                   applicationStatus === 'in-progress' ? 'In Progress' :
                   applicationStatus === 'completed' ? 'Completed' :
                   'Applied'}
                </span>
              </div>
              <span className="text-xs text-white/70">
                {new Date(job.application?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Job Details */}
        <div className="p-4 sm:p-6">
          {/* Salary Display */}
          <div className="mb-4">
            <div className="relative">
              <div className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                ₹{job.salary?.toLocaleString() || '0'}
              </div>
              <div className="absolute -bottom-1 left-0 w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
            </div>
            <div className="text-xs text-white/60 mt-2">
              {job.employmentType === 'Full-time' ? 'Per Month' : 'Per Day'}
            </div>
          </div>

          {/* Job Title and Company */}
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 line-clamp-2">
              {job.title || 'Untitled Job'}
            </h3>
            <div className="flex items-center text-white/70 mb-2">
              <Briefcase className="w-4 h-4 mr-1" />
              <span className="text-sm">{job.companyName || 'Unknown Company'}</span>
            </div>
            <div className="flex items-center text-white/70">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {job.location?.city || 'Location not specified'}, {job.location?.state || 'State not specified'}
              </span>
            </div>
          </div>

          {/* Application Progress - Show if user has applied */}
          {userApplication && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white/80">Application Progress</span>
                <span className="text-sm font-bold text-white">
                  {userApplication.status === 'pending' ? '25%' :
                   userApplication.status === 'accepted' ? '50%' :
                   userApplication.status === 'in-progress' ? '75%' :
                   '100%'}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    userApplication.status === 'accepted' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                    userApplication.status === 'in-progress' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                    userApplication.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                    'bg-gradient-to-r from-yellow-500 to-orange-600'
                  }`}
                  style={{
                    width: 
                      userApplication.status === 'pending' ? '25%' :
                      userApplication.status === 'accepted' ? '50%' :
                      userApplication.status === 'in-progress' ? '75%' :
                      '100%'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                    ['pending', 'accepted', 'in-progress', 'completed'].includes(userApplication.status) ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'
                  }`}>
                    ⏳
                  </div>
                  <span>Applied</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                    ['accepted', 'in-progress', 'completed'].includes(userApplication.status) ? 'bg-green-500 text-white' : 'bg-white/10 text-white/40'
                  }`}>
                    ✅
                  </div>
                  <span>Accepted</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                    ['in-progress', 'completed'].includes(userApplication.status) ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/40'
                  }`}>
                    🔄
                  </div>
                  <span>Working</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                    userApplication.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'
                  }`}>
                    🏆
                  </div>
                  <span>Completed</span>
                </div>
              </div>
            </div>
          )}

          {/* Job Description */}
          <div className="mb-4">
            <p className="text-white/80 text-sm line-clamp-3">
              {job.description || 'No description available'}
            </p>
          </div>

          {/* Job Category Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/15">
              <Briefcase className="w-3 h-3 mr-1" />
              {job.category || 'General Work'}
            </span>
          </div>

          {/* Application Status for Applied Jobs */}
          {hasApplied && (
            <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-white/90">
                  <span className="mr-2">{getStatusIcon(applicationStatus)}</span>
                  <span className="text-sm font-medium">
                    {applicationStatus === 'pending' ? 'Application Submitted' :
                     applicationStatus === 'accepted' ? 'Application Accepted' :
                     applicationStatus === 'in-progress' ? 'Work in Progress' :
                     applicationStatus === 'completed' ? 'Job Completed' :
                     'Application Status'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/70">
                    Applied: {new Date(job.application?.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-white/70">
                {applicationStatus === 'pending' ? 'Waiting for employer response...' :
                 applicationStatus === 'accepted' ? 'Great! Employer has accepted your application.' :
                 applicationStatus === 'in-progress' ? 'Keep working! Payment on completion.' :
                 applicationStatus === 'completed' ? '🎉 Congratulations on completing this job!' :
                 'Track your application progress here.'}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {!hasApplied ? (
              <>
                <button
                  onClick={() => handleApplyForJob(job)}
                  disabled={applyingJobs.has(job._id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-white text-black rounded-lg hover:opacity-95 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applyingJobs.has(job._id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Apply Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className="flex items-center justify-center px-3 py-2 bg-white/10 text-white rounded-lg border border-white/10 hover:bg-white/15 transition-colors text-sm"
                >
                  👁️
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/worker/applications')}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-white text-black rounded-lg hover:opacity-95 transition-colors text-sm font-medium"
              >
                <span className="mr-1">📊</span>
                View Applications
              </button>
            )}
          </div>

          {/* Requirements */}
          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/60 mb-2">Required Skills:</p>
              <div className="flex flex-wrap gap-1">
                {job.skillsRequired.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/10 text-white/80 rounded-full text-xs border border-white/15"
                  >
                    {skill}
                  </span>
                ))}
                {job.skillsRequired.length > 3 && (
                  <span className="px-2 py-1 bg-white/10 text-white/80 rounded-full text-xs border border-white/15">
                    +{job.skillsRequired.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Effects
  useEffect(() => {
    console.log('🔄 AvailableJobs component mounted, fetching jobs...');
    console.log('👤 Current user:', user);
    console.log('🔧 Current filters:', filters);
    
    // Add a small delay to ensure user context is loaded
    const timer = setTimeout(() => {
      fetchJobs();
      fetchApplicationsCount(); // Fetch applications count for stats card
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchJobs, fetchApplicationsCount]);

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden devanagari">
      {/* Background aesthetics (mirror homepage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft radial vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)' }} />
        {/* Star trails effect */}
        <div className="startrails absolute inset-0" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
        {/* Aurora animated background */}
        <div className="aurora absolute inset-0">
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
      </div>

      {/* Top navigation controls */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-30">
        <button 
          onClick={() => navigateToPage('/')}
          className="p-2 md:p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
        >
          <ArrowLeft className="w-5 md:w-6 h-5 md:h-6 text-white" />
        </button>
      </div>
      
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-30">
        <button 
          onClick={toggleLang} 
          className="px-2.5 py-1 rounded-full text-xs md:text-sm bg-white/10 border border-white/15 text-white/90 hover:bg-white/15"
        >
          {isHindi ? 'HI' : 'EN'}
        </button>
        <button 
          onClick={() => setShowPageMenu(v=>!v)} 
          className="p-2 md:p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
        >
          <Menu className="w-5 md:w-6 h-5 md:h-6 text-white" />
        </button>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Available Jobs</h1>
                {loading && (
                  <p className="text-sm text-white/70 mt-1">Loading jobs...</p>
                )}
                {error && (
                  <p className="text-sm text-red-400 mt-1">Error: {error}</p>
                )}
                {!loading && !error && (
                  <p className="text-sm text-white/70 mt-1">
                    Found {filteredJobs.length} jobs
                    {user?.location?.state && (
                      <span className="ml-2">
                        ({locationBasedJobs.length} in {user.location.state}, {otherLocationJobs.length} other)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white/10 border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/15 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="">All Categories</option>
                <option value="construction">Construction</option>
                <option value="agriculture">Agriculture</option>
                <option value="household">Household</option>
                <option value="transportation">Transportation</option>
                <option value="manufacturing">Manufacturing</option>
              </select>

              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/15 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/20"
              />

              <select
                value={filters.employmentType}
                onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/15 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card - Similar to MyApplications */}
      {user?.type === 'worker' && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="relative rounded-2xl p-4 sm:p-6 text-white bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden">
            <div className="absolute -inset-10 opacity-20 blur-3xl bg-gradient-to-br from-lime-300/30 to-emerald-300/20 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/70">Available Jobs</div>
                  <div className="mt-1 text-3xl font-extrabold tracking-tight">{filteredJobs.length}</div>
                </div>
                <div className="px-2 py-1 text-[10px] rounded-full bg-white/10 border border-white/15 text-white/80">LIVE</div>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/80">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>My Applications · </span>
                  <span className="text-white">{myApplicationsCount}</span>
                </div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/80">
                  <ProgressRing progress={myApplicationsCount / Math.max(1, filteredJobs.length)} />
                  <span>Application Rate · </span>
                  <span className="text-white">{Math.round((myApplicationsCount / Math.max(1, filteredJobs.length)) * 100)}%</span>
                </div>
                <button
                  onClick={() => navigate('/worker/applications')}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/80 hover:bg-white/15 transition-colors"
                >
                  📊
                  <span>View Applications</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Only render location-based sections if we have location preference and jobs */}
        {user?.location?.state && locationBasedJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Jobs in {user.location.state}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {locationBasedJobs.map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Other locations section - only if we have location preference */}
        {user?.location?.state && otherLocationJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Other Locations
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherLocationJobs.map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Debug section removed for production */}

        {/* Main Jobs Grid - always show all jobs */}
        {filteredJobs.length > 0 && (
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-12"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <h3 className="text-lg font-medium text-white mb-2">Error loading jobs</h3>
                <p className="text-white/70 mb-6">{error}</p>
                <button
                  onClick={fetchJobs}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:opacity-95 transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            ) : filteredJobs.length === 0 ? (
              <motion.div
                key="no-jobs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <Briefcase className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No jobs available</h3>
                <p className="text-white/70 mb-6">
                  {searchTerm || filters.category || filters.location || filters.employmentType
                    ? "Try adjusting your filters to see more results."
                    : "Check back later for new opportunities."}
                </p>
                {(searchTerm || filters.category || filters.location || filters.employmentType) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({
                        location: '',
                        category: '',
                        minSalary: '',
                        employmentType: ''
                      });
                    }}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:opacity-95 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="jobs-carousel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <Swiper
                  spaceBetween={16}
                  slidesPerView={1.1}
                  breakpoints={{
                    640: { slidesPerView: 1.5 },
                    768: { slidesPerView: 2.2 },
                    1024: { slidesPerView: 3.2 },
                  }}
                  style={{ paddingBottom: '2rem' }}
                >
                  {filteredJobs.map((job) => (
                    <SwiperSlide key={job._id || job.id}>
                      {renderJobCard(job)}
                    </SwiperSlide>
                  ))}
                </Swiper>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccessAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 max-w-sm mx-4 text-center shadow-xl text-white"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  🎉 Application Submitted!
                </h3>
                <p className="text-white/80 mb-6">
                  Your application has been sent successfully. Redirecting to your applications page...
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowSuccessAnimation(false);
                      navigate('/worker/applications');
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold"
                  >
                    View My Applications →
                  </button>
                  <button
                    onClick={() => setShowSuccessAnimation(false)}
                    className="w-full px-6 py-3 bg-white/10 border border-white/20 text-white/90 rounded-2xl hover:bg-white/20 transition-all duration-200 font-medium"
                  >
                    Continue Browsing
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Background styles shared with homepage */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
        .devanagari { font-family: 'Noto Sans Devanagari','Poppins',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial; }
        .noise-bg { background-image: url('data:image/svg+xml;utf8,\
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
            <filter id="noise">\
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>\
              <feColorMatrix type="saturate" values="0"/>\
              <feComponentTransfer>\
                <feFuncA type="table" tableValues="0 0.2"/>\
              </feComponentTransfer>\
            </filter>\
            <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/>\
          </svg>'); }
        .aurora-blob { position:absolute; width:60vmax; height:60vmax; filter:blur(60px); opacity:.2; }
        .aurora-a { background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%); left:-20vmax; top:-10vmax; animation: drift 18s ease-in-out infinite; }
        .aurora-b { background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%); right:-25vmax; top:-5vmax; animation: drift 22s ease-in-out infinite reverse; }
        .aurora-c { background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%); left:10vmax; bottom:-20vmax; animation: drift 26s ease-in-out infinite; }
        @keyframes drift { 0%,100% { transform: translate3d(0,0,0) rotate(0deg);} 50% { transform: translate3d(5vmax,-3vmax,0) rotate(20deg);} }
        .startrails { position:absolute; inset:0; background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%); overflow:hidden; }
        .startrails::before, .startrails::after { content:""; position:absolute; inset:-20%; background-repeat:repeat; background-size:300px 300px; mix-blend-mode:screen; opacity:.25; border-radius:50%; filter:blur(.2px); }
        .startrails::before { background-image: radial-gradient(2px 120px at 50% 0%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 60%), radial-gradient(1.5px 100px at 80% 10%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%), radial-gradient(1.2px 90px at 20% 30%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%), radial-gradient(1.8px 110px at 70% 60%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 60%); animation: trails-rotate 140s linear infinite; }
        .startrails::after { background-image: radial-gradient(1px 60px at 30% 10%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 60%), radial-gradient(1px 70px at 60% 40%, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 60%), radial-gradient(1px 50px at 10% 80%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%); animation: trails-rotate-rev 200s linear infinite; opacity:.18; }
        @keyframes trails-rotate { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes trails-rotate-rev { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
      `}</style>
    </div>
  );
};

export default AvailableJobs;