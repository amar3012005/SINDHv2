import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../../utils/apiUtils';
import { 
  MapPin, 
  Briefcase, 
  CheckCircle,
  Search
} from 'lucide-react';

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

  // Fetch jobs function
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      // Add user-specific parameter for application status
      if (user?.id && user?.type === 'worker') {
        queryParams.append('workerId', user.id);
      }
      
      // Use the same filtering logic - only active and in-progress jobs
      queryParams.append('status', 'active,in-progress');
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          queryParams.append(key, value.trim());
        }
      });
      
      const response = await fetch(getApiUrl(`/api/jobs?${queryParams.toString()}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const jobsData = await response.json();
      const jobsArray = Array.isArray(jobsData) ? jobsData : [];
      
      setJobs(jobsArray);
      setFilteredJobs(jobsArray);
      
      // Group jobs by location if user has location preference
      if (user?.location?.state) {
        const userState = user.location.state.toLowerCase();
        const locationBased = jobsArray.filter(job => 
          job.location?.state?.toLowerCase() === userState
        );
        const otherLocation = jobsArray.filter(job => 
          job.location?.state?.toLowerCase() !== userState
        );
        
        setLocationBasedJobs(locationBased);
        setOtherLocationJobs(otherLocation);
      }
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.message);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...jobs];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [searchTerm, jobs]);

  // Job application handler
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
      // First fetch the job details to get the employer ID
      const jobResponse = await fetch(getApiUrl(`/api/jobs/${job._id}`));
      if (!jobResponse.ok) {
        throw new Error('Failed to fetch job details');
      }
      const jobData = await jobResponse.json();

      const response = await fetch(getApiUrl('/api/job-applications'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job: job._id,
          worker: user.id,
          employer: jobData.employer._id || jobData.employer,
          workerDetails: {
            name: user.name,
            phone: user.phone,
            skills: user.skills || [],
            experience: user.experience_years || 0
          }
        })
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
        fetchJobs(); // Refresh jobs to update application status
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

  // Filter change handlers
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
  };

  const handleApplyFilter = () => {
    fetchJobs();
  };

  // Render job card
  const renderJobCard = (job) => {
    const applicationStatus = job.applicationStatus;
    const hasApplied = job.hasApplied;

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
                {job.title}
              </h3>
              <p className="text-gray-600 font-medium">
                {job.companyName}
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

          {/* Job Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm">
                {job.location?.city}, {job.location?.state}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <span className="text-green-600 font-semibold">₹</span>
              <span className="text-sm font-medium ml-1">
                {job.salary?.toLocaleString()} {job.employmentType === 'Full-time' ? '/month' : '/day'}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
              <span className="text-sm">{job.category}</span>
            </div>
          </div>

          {/* Job Description */}
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {job.description}
          </p>

          {/* Action Button */}
          <div className="flex gap-2">
            {!hasApplied ? (
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
            ) : (
              <div className="flex-1 text-center py-2">
                <span className="text-sm text-gray-600">
                  Applied on {new Date(job.application?.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            
            <button
              onClick={() => navigate(`/jobs/${job._id}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Details
            </button>
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
    fetchJobs();
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
        {/* Location-based job sections */}
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

        {otherLocationJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Other Locations
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherLocationJobs.map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Jobs Grid */}
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