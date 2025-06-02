import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { isWorker, getCurrentUser } from '../../utils/authUtils';
import { saveJobApplication, getJobApplications, hasAppliedForJob, updateApplicationStatus } from '../../utils/jobApplicationUtils';
import AuthDebugger from '../AuthDebugger';
import JobActionButtons from './JobActionButtons';
import JobApplicationStatus from './JobApplicationStatus';

const AvailableJobs = () => {
  const { user, acceptedJobs, setAcceptedJobs, isLoadingUser, fetchUserProfile } = useUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    salary: '',
    employmentType: ''
  });
  const [locationBasedJobs, setLocationBasedJobs] = useState([]);
  const [otherLocationJobs, setOtherLocationJobs] = useState([]);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`http://localhost:5000/api/jobs?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched jobs with filters:', data);

      let filteredJobs = data.filter(job => job.status === 'active');

      setJobs(filteredJobs);

      if (user && user.type === 'worker' && user.location?.state) {
        const userLocation = user.location.state.toLowerCase();
        const locationJobs = filteredJobs.filter(job =>
          job.location?.state?.toLowerCase().includes(userLocation)
        );
        const otherJobs = filteredJobs.filter(job =>
          !job.location?.state?.toLowerCase().includes(userLocation)
        );
        setLocationBasedJobs(locationJobs);
        setOtherLocationJobs(otherJobs);
      } else {
        setLocationBasedJobs(filteredJobs);
        setOtherLocationJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Unable to connect to the server or fetch jobs. Please try again later.');
      setJobs([]);
      setLocationBasedJobs([]);
      setOtherLocationJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    if (user && !isLoadingUser) {
      console.log('AvailableJobs useEffect: User data available, attempting to set default filters.', user);
      if (user.type === 'worker') {
        const defaultFilters = {
          location: user.location?.state || '',
          category: user.preferredCategory || '',
          salary: user.expectedSalary || '' // Assuming expectedSalary might be used as a min salary filter
        };
        console.log('AvailableJobs useEffect: Setting default worker filters:', defaultFilters);
        setFilters(prev => ({
          ...prev,
          ...defaultFilters
        }));
      }
    }
    console.log('AvailableJobs useEffect: Current filters state after potential update:', filters);
  }, [user, isLoadingUser, setFilters]);

  console.log('AvailableJobs: Rendering with user:', user, 'isLoadingUser:', isLoadingUser);
  console.log('AvailableJobs: user type =', user?.type);
  console.log('AvailableJobs: localStorage user =', JSON.parse(localStorage.getItem('user') || '{}'));
  console.log('AvailableJobs: Should show Accept button =', Boolean(user && user.type === 'worker'));

  // fetchJobs already has filters in its closure via useCallback
  useEffect(() => {
    console.log('AvailableJobs useEffect: user changed, fetching jobs.', { user, isLoadingUser });
    fetchJobs();
  }, [fetchJobs]);
  
  // Load local job applications from localStorage
  useEffect(() => {
    try {
      // Load job applications from localStorage
      const localApplications = getJobApplications();
      console.log('Loaded local job applications:', localApplications);
      
      // If we already have backend data, don't override it
      if (!acceptedJobs || Object.keys(acceptedJobs).length === 0) {
        const formattedApplications = {};
        
        // Convert to the format expected by components
        Object.keys(localApplications).forEach(jobId => {
          formattedApplications[jobId] = true;
        });
        
        // Only set if we have data to avoid overriding backend data
        if (Object.keys(formattedApplications).length > 0) {
          setAcceptedJobs(prev => {
            // If previous is an array, merge with array structure
            if (Array.isArray(prev)) {
              const newApps = Object.keys(formattedApplications).map(jobId => ({
                job: { _id: jobId },
                status: 'pending',
                appliedLocally: true
              }));
              
              // Filter out duplicates
              const existingIds = prev.map(app => app.job?._id);
              const uniqueNewApps = newApps.filter(app => !existingIds.includes(app.job._id));
              
              return [...prev, ...uniqueNewApps];
            }
            
            // Otherwise merge as object
            return { ...prev, ...formattedApplications };
          });
        }
      }
    } catch (error) {
      console.error('Error loading localStorage job applications:', error);
    }
  }, []);

  const handleAcceptJob = async (jobId) => {
    // Check if user is a worker and authenticated
    if ((!user || user.type !== 'worker') && !isWorker()) {
      toast.error('Please login as a worker to accept jobs');
      return;
    }
    
    // Check if job has already been applied for
    if (hasAppliedForJob(jobId)) {
      toast.info('You have already applied for this job');
      return;
    }
    
    // Get current user from localStorage if context is not available
    const currentUser = user || getCurrentUser();
    
    // Find the job details to save
    const jobToAccept = jobs.find(j => j._id === jobId);
    
    try {
      // Save to localStorage first
      saveJobApplication(jobId, {
        title: jobToAccept?.title || 'Unknown Job',
        company: jobToAccept?.company || jobToAccept?.companyName || 'Unknown Company',
        salary: jobToAccept?.salary || '',
        location: jobToAccept?.location || {},
        category: jobToAccept?.category || '',
        employmentType: jobToAccept?.employmentType || '',
        appliedAt: new Date().toISOString()
      });

      // Send to backend
      const response = await fetch('http://localhost:5000/api/job-applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          workerId: currentUser?.id,
          status: 'pending',
          applicationDate: new Date().toISOString()
        }),
      });

      if (response.ok) {
        // Update accepted jobs in context
        setAcceptedJobs(prev => {
          const isAlreadyAccepted = Array.isArray(prev) 
            ? prev.some(app => app.job?._id === jobId) 
            : !!prev[jobId];
             
          if (isAlreadyAccepted) return prev;

          const newApplication = {
            job: { _id: jobId },
            status: 'pending',
            appliedAt: new Date().toISOString()
          };

          if (Array.isArray(prev)) {
            return [...prev, newApplication];
          } else {
            return { ...prev, [jobId]: true };
          }
        });

        // Show success animation
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);
        
        toast.success('Job application sent successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to send job application');
        
        // Remove from localStorage if backend fails
        updateApplicationStatus(jobId, 'failed');
      }
    } catch (error) {
      console.error('Error accepting job:', error);
      toast.error('Failed to send job application to server, but your application has been saved locally');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const renderJobCard = (job) => (
    <motion.div
      key={job._id}
      whileHover={{ scale: 1.02 }}
      className="bg-white overflow-hidden shadow rounded-lg relative"
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ₹{job.salary}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">{job.companyName}</p>
        {/* Add the JobApplicationStatus component */}
        <JobApplicationStatus jobId={job._id} acceptedJobs={acceptedJobs} />
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job.location.city}, {job.location.state}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {job.employmentType}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {job.category}
          </div>
          {job.requirements && (
            <div className="mt-2 text-sm text-gray-500">
              <strong>Requirements:</strong> {job.requirements}
            </div>
          )}
        </div>
        
        {/* Use our new JobActionButtons component */}
        <JobActionButtons 
          job={job}
          onAccept={handleAcceptJob}
          onViewDetails={handleJobClick}
          acceptedJobs={acceptedJobs}
        />
      </div>
    </motion.div>
  );

  console.log('Debug before render:', {
    user,
    userType: user?.type,
    isWorker: isWorker(),
    localStorage: localStorage.getItem('user'),
    acceptedJobs,
    isLoadingUser
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Development-only auth debugger */}
      {process.env.NODE_ENV === 'development' && <AuthDebugger />}
      
      {/* Force display debug button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={() => {
            console.log('Debug button clicked');
            
            // This will force the component to update
            const userObj = JSON.parse(localStorage.getItem('user') || '{}');
            if (userObj) {
              userObj.type = 'worker';
              localStorage.setItem('user', JSON.stringify(userObj));
              localStorage.setItem('userType', 'worker');
            }
            
            // Reload page
            window.location.reload();
          }}
        >
          Debug: Force Worker Type & Reload
        </button>
      </div>
      
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Job request sent successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Available Jobs
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            {user && user.type === 'worker' && user.location?.state
              ? `Find jobs in ${user.location.state}`
              : 'Find the perfect job opportunity for you'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter state"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                id="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Construction">Construction</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Household">Household</option>
                <option value="Transportation">Transportation</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
              </select>
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                Minimum Salary
              </label>
              <input
                type="number"
                name="salary"
                id="salary"
                value={filters.salary}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                Employment Type
              </label>
              <select
                name="employmentType"
                id="employmentType"
                value={filters.employmentType}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {loading || isLoadingUser ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {filters.location && locationBasedJobs.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Jobs in {filters.location}
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {locationBasedJobs.map(renderJobCard)}
                </div>
              </div>
            )}

            {otherLocationJobs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Jobs in Other Locations
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {otherLocationJobs.map(renderJobCard)}
                </div>
              </div>
            )}

            {filters.location === '' && jobs.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map(renderJobCard)}
                </div>
             )}

            {jobs.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters to find more jobs.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AvailableJobs;