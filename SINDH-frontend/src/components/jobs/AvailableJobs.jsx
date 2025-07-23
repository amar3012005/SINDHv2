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
  Search
} from 'lucide-react';
import JobApplicationProgress from '../worker/JobApplicationProgress';

const AvailableJobs = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
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

  // Enhanced fetch jobs function with proper debugging
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
        
        // Log all jobs for debugging
        console.log('📋 All received jobs:');
        jobsArray.forEach((job, index) => {
          console.log(`   ${index + 1}. ${job.title} - ${job.companyName} - ${job.location?.city}, ${job.location?.state} - ₹${job.salary}`);
        });
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

  // Enhanced render job card with better error handling
  const renderJobCard = (job) => {
    const applicationStatus = job.applicationStatus;
    const hasApplied = job.hasApplied;
    const userApplication = applications.find(app => app.job?._id === job._id);
    
    // Don't show in-progress or completed jobs
    if (job.status === 'in-progress' || job.status === 'completed') {
      return null;
    }

    return (
      <motion.div
        key={job._id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
      >
        <div className="p-6">
          {/* Job Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {job.title || 'Untitled Job'}
              </h3>
              <p className="text-gray-600 font-medium">
                {job.companyName || 'Unknown Company'}
              </p>
            </div>
            
            {/* Application Status Badge */}
            {hasApplied && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                applicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                applicationStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                applicationStatus === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                applicationStatus === 'completed' ? 'bg-purple-100 text-purple-800' :
                'bg-red-100 text-red-800'
              }`}>
                {applicationStatus === 'pending' ? '⏳ Pending' :
                 applicationStatus === 'accepted' ? '✅ Accepted' :
                 applicationStatus === 'in-progress' ? '🔄 In Progress' :
                 applicationStatus === 'completed' ? '✅ Completed' :
                 '❌ Rejected'}
              </div>
            )}
          </div>

          {/* Application Progress - Show if user has applied */}
          {userApplication && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Application Status</h4>
                <span className="text-xs text-gray-500">
                  Last updated: {new Date(userApplication.updatedAt || Date.now()).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${
                    userApplication.status === 'accepted' ? 'bg-green-500' :
                    userApplication.status === 'in-progress' ? 'bg-blue-500' :
                    userApplication.status === 'completed' ? 'bg-purple-500' :
                    'bg-yellow-500'
                  }`}
                  style={{
                    width: 
                      userApplication.status === 'pending' ? '25%' :
                      userApplication.status === 'accepted' ? '50%' :
                      userApplication.status === 'in-progress' ? '75%' :
                      '100%'
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className={userApplication.status === 'pending' ? 'font-bold text-blue-600' : ''}>Applied</span>
                <span className={userApplication.status === 'accepted' ? 'font-bold text-green-600' : ''}>Accepted</span>
                <span className={userApplication.status === 'in-progress' ? 'font-bold text-blue-600' : ''}>In Progress</span>
                <span className={userApplication.status === 'completed' ? 'font-bold text-purple-600' : ''}>Completed</span>
              </div>
            </div>
          )}

          {/* Job Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm">
                {job.location?.city || 'Location not specified'}, {job.location?.state || 'State not specified'}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <span className="text-green-600 font-semibold">₹</span>
              <span className="text-sm font-medium ml-1">
                {job.salary?.toLocaleString() || '0'} {job.employmentType === 'Full-time' ? '/month' : '/day'}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
              <span className="text-sm">{job.category || 'General Work'}</span>
            </div>
          </div>

          {/* Job Description */}
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {job.description || 'No description available'}
          </p>

          {/* Action Buttons - Always visible */}
          <div className="flex gap-2 mt-4">
            {!hasApplied ? (
              <>
                <button
                  onClick={() => handleApplyForJob(job)}
                  disabled={applyingJobs.has(job._id)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {applyingJobs.has(job._id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </button>
                <button
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
              </>
            ) : (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">
                    Applied on {new Date(job.application?.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {applicationStatus === 'pending' ? '⏳ Pending' : '✅ ' + applicationStatus}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className="w-full mt-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Track Application
                </button>
              </div>
            )}
          </div>

          {/* Requirements */}
          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Required Skills:</p>
              <div className="flex flex-wrap gap-1">
                {job.skillsRequired.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {job.skillsRequired.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
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
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/90 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Available Jobs
              </h1>
              {loading && (
                <p className="text-sm text-gray-600 mt-1">
                  Loading jobs...
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {error}
                </p>
              )}
              {!loading && !error && (
                <p className="text-sm text-gray-600 mt-1">
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
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.employmentType}
              onChange={(e) => handleFilterChange('employmentType', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Only render location-based sections if we have location preference and jobs */}
        {user?.location?.state && locationBasedJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Other Locations
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherLocationJobs.map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Debug: Show all jobs for troubleshooting */}
        {process.env.NODE_ENV === 'development' && filteredJobs.length > 0 && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Debug: All Jobs ({filteredJobs.length})</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map(renderJobCard)}
            </div>
          </div>
        )}

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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading jobs</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button
                  onClick={fetchJobs}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
                <p className="text-gray-500 mb-6">
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="jobs-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredJobs.map(renderJobCard)}
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
              className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            >
              <div className="bg-white rounded-lg p-8 max-w-sm mx-4">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Application Submitted!
                  </h3>
                  <p className="text-gray-600">
                    Your application has been sent to the employer successfully.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AvailableJobs;