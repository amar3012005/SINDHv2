import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';
import { 
  MapPin, 
  DollarSign, 
  Calendar,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  Briefcase,
  Building,
  FileText,
  Clock,
  CheckCircle,
  User,
  Phone,
  Star,
  TrendingUp,
  Award,
  Zap,
  ChevronRight,
  ChevronLeft,
  Home,
  Filter,
  Search,
  Wifi,
  WifiOff
} from 'lucide-react';
import JobApplicationProgress from '../worker/JobApplicationProgress';

// Mobile-optimized animated patterns
const MobileParticleField = ({ count = 6 }) => {
  const particles = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-black rounded-full opacity-8"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -25, 0],
        opacity: [0.08, 0.25, 0.08],
        scale: [1, 1.6, 1]
      }}
      transition={{
        duration: Math.random() * 3 + 2,
        repeat: Infinity,
        delay: Math.random() * 1.5,
        ease: "easeInOut"
      }}
    />
  ));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles}
    </div>
  );
};

const MobileFloatingGeometry = ({ delay = 0 }) => {
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 12 + 6;
  const duration = Math.random() * 6 + 8;
  
  const initialX = Math.random() * window.innerWidth;
  const initialY = Math.random() * window.innerHeight;
  
  return (
    <motion.div
      className="absolute pointer-events-none opacity-2"
      style={{
        width: size,
        height: size,
        left: initialX,
        top: initialY,
      }}
      animate={{
        x: [0, Math.random() * 120 - 60, Math.random() * 120 - 60, 0],
        y: [0, Math.random() * 120 - 60, Math.random() * 120 - 60, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.05, 0.95, 1]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
    >
      {shape === 'square' && <div className="w-full h-full bg-black" />}
      {shape === 'circle' && <div className="w-full h-full bg-black rounded-full" />}
      {shape === 'triangle' && (
        <div 
          className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-black"
          style={{ borderBottomWidth: size * 0.866 }}
        />
      )}
    </motion.div>
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [cancellingJobIds, setCancellingJobIds] = useState(new Set());
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [offlineData, setOfflineData] = useState([]);
  const navigate = useNavigate();
  const { user } = useUser();

  // Check backend connection
  const checkBackendConnection = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/health'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('disconnected');
        return false;
      }
    } catch (error) {
      console.log('Backend connection failed:', error.message);
      setConnectionStatus('disconnected');
      return false;
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const workerId = user?.id || JSON.parse(localStorage.getItem('user'))?.id || '686aeaf364b3b9998c014724';
      if (!workerId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log(`🔄 Fetching applications for worker ID: ${workerId}`);
      
      // Check backend connection first
      const isConnected = await checkBackendConnection();
      
      if (isConnected) {
        console.log('✅ Backend connected, fetching from API...');
        
        // Fetch current applications
        const currentResponse = await fetch(buildApiUrl(`/job-applications/worker/${workerId}/current`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          console.log('📋 Current applications API response:', currentData);
          
          let currentApplications = [];
          if (currentData.success && Array.isArray(currentData.data)) {
            currentApplications = currentData.data;
          } else if (Array.isArray(currentData)) {
            currentApplications = currentData;
          } else if (currentData.data && Array.isArray(currentData.data)) {
            currentApplications = currentData.data;
          }
          
          console.log('✅ Current applications fetched from backend:', currentApplications.length);
          
          // Ensure all job fields are properly populated
          const enrichedCurrentApplications = currentApplications.map(app => ({
            ...app,
            job: {
              _id: app.job?._id || 'unknown',
              title: app.job?.title || 'Job Title Not Available',
              companyName: app.job?.companyName || 'Company Not Available',
              location: app.job?.location || { city: 'Not Available', state: 'Not Available' },
              salary: app.job?.salary || 0,
              category: app.job?.category || 'General',
              employmentType: app.job?.employmentType || 'Full-time',
              description: app.job?.description || 'No description available',
              skillsRequired: app.job?.skillsRequired || [],
              requirements: app.job?.requirements || 'Basic requirements apply',
              urgency: app.job?.urgency || 'Normal',
              startDate: app.job?.startDate || null,
              endDate: app.job?.endDate || null
            },
            paymentAmount: app.paymentAmount || 0,
            paymentStatus: app.paymentStatus || 'pending',
            statusHistory: app.statusHistory || []
          }));
          
          // Fetch completed applications
          const completedResponse = await fetch(buildApiUrl(`/job-applications/worker/${workerId}/completed`), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          let completedApplications = [];
          if (completedResponse.ok) {
            const completedData = await completedResponse.json();
            console.log('📋 Completed applications API response:', completedData);
            
            if (completedData.success && Array.isArray(completedData.data)) {
              completedApplications = completedData.data;
            } else if (Array.isArray(completedData)) {
              completedApplications = completedData;
            } else if (completedData.data && Array.isArray(completedData.data)) {
              completedApplications = completedData.data;
            }
            
            console.log('✅ Completed applications fetched from backend:', completedApplications.length);
          }
          
          // Ensure all completed application fields are properly populated
          const enrichedCompletedApplications = completedApplications.map(app => ({
            ...app,
            job: {
              _id: app.job?._id || 'unknown',
              title: app.job?.title || 'Job Title Not Available',
              companyName: app.job?.companyName || 'Company Not Available',
              location: app.job?.location || { city: 'Not Available', state: 'Not Available' },
              salary: app.job?.salary || 0,
              category: app.job?.category || 'General',
              employmentType: app.job?.employmentType || 'Full-time',
              description: app.job?.description || 'No description available',
              skillsRequired: app.job?.skillsRequired || [],
              requirements: app.job?.requirements || 'Basic requirements apply',
              urgency: app.job?.urgency || 'Normal',
              startDate: app.job?.startDate || null,
              endDate: app.job?.endDate || null
            },
            paymentAmount: app.paymentAmount || 0,
            paymentStatus: app.paymentStatus || 'pending',
            statusHistory: app.statusHistory || []
          }));
          
          setApplications(enrichedCurrentApplications);
          setPastJobs(enrichedCompletedApplications);
          
          // Update localStorage with fresh data
          const allApplications = [...enrichedCurrentApplications, ...enrichedCompletedApplications];
          localStorage.setItem('myApplicationData', JSON.stringify(allApplications));
          
          const allApplicationIds = allApplications.map(app => app._id).filter(Boolean);
          localStorage.setItem('myApplicationIds', JSON.stringify(allApplicationIds));
          
          console.log('💾 Updated localStorage with fresh application data:', allApplications.length, 'applications');
          
        } else {
          console.warn('⚠️ Backend API failed, falling back to localStorage');
          throw new Error(`Backend returned ${currentResponse.status}`);
        }
      } else {
        console.log('⚠️ Backend disconnected, using localStorage data');
        throw new Error('Backend not available');
      }
      
      setLastUpdated(new Date());
      setError(null);
      
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      
      // Load from localStorage as fallback
      try {
        const applicationData = JSON.parse(localStorage.getItem('myApplicationData') || '[]');
        const applicationIds = JSON.parse(localStorage.getItem('myApplicationIds') || '[]');
        
        console.log('📋 Loading from localStorage:', {
          applicationData: applicationData.length,
          applicationIds: applicationIds.length
        });
        
        if (applicationData.length > 0) {
          // Ensure all job fields are properly populated for localStorage data
          const enrichApplicationData = (apps) => apps.map(app => ({
            ...app,
            job: {
              _id: app.job?._id || 'unknown',
              title: app.job?.title || 'Job Title Not Available',
              companyName: app.job?.companyName || 'Company Not Available',
              location: app.job?.location || { city: 'Not Available', state: 'Not Available' },
              salary: app.job?.salary || 0,
              category: app.job?.category || 'General',
              employmentType: app.job?.employmentType || 'Full-time',
              description: app.job?.description || 'No description available',
              skillsRequired: app.job?.skillsRequired || [],
              requirements: app.job?.requirements || 'Basic requirements apply',
              urgency: app.job?.urgency || 'Normal',
              startDate: app.job?.startDate || null,
              endDate: app.job?.endDate || null
            },
            paymentAmount: app.paymentAmount || 0,
            paymentStatus: app.paymentStatus || 'pending',
            statusHistory: app.statusHistory || [],
            appliedAt: app.appliedAt || app.createdAt || new Date().toISOString()
          }));

          const currentApps = enrichApplicationData(applicationData.filter(app => 
            !['completed', 'rejected', 'cancelled'].includes(app.status?.toLowerCase())
          ));
          const completedApps = enrichApplicationData(applicationData.filter(app => 
            ['completed', 'rejected', 'cancelled'].includes(app.status?.toLowerCase())
          ));
          
          setApplications(currentApps);
          setPastJobs(completedApps);
          setOfflineData(applicationData);
          
          console.log('✅ Loaded from localStorage:', {
            current: currentApps.length,
            completed: completedApps.length
          });
          
          setError(null);
        } else if (applicationIds.length > 0) {
          // Create mock applications from IDs
          const workerId = user?.id || JSON.parse(localStorage.getItem('user'))?.id || '686aeaf364b3b9998c014724';
          const mockApplications = applicationIds.map((appId, index) => ({
            _id: appId,
            status: 'pending',
            appliedAt: new Date(Date.now() - index * 86400000).toISOString(),
            job: {
              _id: `job-${appId}`,
              title: `Job ${index + 1}`,
              companyName: 'Company Name',
              location: {
                city: 'City',
                state: 'State'
              },
              salary: 5000 + (index * 1000),
              category: 'General',
              employmentType: 'Full-time',
              description: 'Job description here with detailed information about the role and responsibilities.',
              skillsRequired: ['Skill 1', 'Skill 2', 'Skill 3'],
              requirements: 'Basic requirements apply. Experience preferred but not mandatory.',
              urgency: 'Normal',
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            worker: {
              _id: workerId,
              name: 'Worker Name',
              phone: '9876543210',
              skills: ['Skill 1', 'Skill 2']
            },
            employer: {
              _id: 'employer-id',
              name: 'Employer Name',
              companyName: 'Company Name'
            },
            paymentStatus: 'pending',
            paymentAmount: 5000 + (index * 1000),
            statusHistory: [
              {
                status: 'pending',
                changedAt: new Date(Date.now() - index * 86400000),
                note: 'Application submitted'
              }
            ]
          }));
          
          setApplications(mockApplications);
          setOfflineData(mockApplications);
          
          console.log('✅ Created mock applications from localStorage IDs:', mockApplications.length);
          setError(null);
        } else {
          setError('No applications found. Please apply for jobs first.');
        }
      } catch (localStorageError) {
        console.error('❌ Error loading from localStorage:', localStorageError);
        setError('Failed to load applications. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [user, checkBackendConnection]);

  useEffect(() => {
    fetchApplications();
    
    const interval = setInterval(fetchApplications, 30000);
    
    const handleApplicationSubmitted = (event) => {
      console.log('🔄 Application submitted event received:', event.detail);
      fetchApplications();
    };

    const handleStorageChange = (event) => {
      if (event.key === 'refreshApplications') {
        console.log('🔄 Refresh applications triggered via localStorage');
        fetchApplications();
      }
    };

    window.addEventListener('applicationSubmitted', handleApplicationSubmitted);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('applicationSubmitted', handleApplicationSubmitted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchApplications]);

  const updateLocalStorageApplications = (applicationId, updatedApp) => {
    try {
      const existingData = JSON.parse(localStorage.getItem('myApplicationData') || '[]');
      const updatedData = existingData.map(app => 
        app._id === applicationId ? updatedApp : app
      );
      localStorage.setItem('myApplicationData', JSON.stringify(updatedData));
      console.log('💾 Updated localStorage with application status change:', applicationId, updatedApp.status);
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    fetchApplications();
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      console.log('Updating application status:', { applicationId, newStatus });
      
      const response = await fetch(buildApiUrl(`/job-applications/${applicationId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      const result = await response.json();
      console.log('Status update result:', result);

      if (newStatus === 'completed') {
        const completedApp = applications.find(app => app._id === applicationId);
        if (completedApp) {
          const updatedApp = {
            ...completedApp,
            status: 'completed',
            completedAt: new Date().toISOString()
          };
          
          setApplications(prev => prev.filter(app => app._id !== applicationId));
          setPastJobs(prev => [...prev, updatedApp]);
          
          updateLocalStorageApplications(applicationId, updatedApp);
        }
      } else {
        const updatedApp = applications.find(app => app._id === applicationId);
        if (updatedApp) {
          const newApp = { ...updatedApp, status: newStatus };
          setApplications(prev => prev.map(app => 
            app._id === applicationId ? newApp : app
          ));
          
          updateLocalStorageApplications(applicationId, newApp);
        }
      }

      toast.success(`Application status updated to ${newStatus}`);
      
      setTimeout(fetchApplications, 1000);
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update application status');
    }
  };

  const handleCancelApplication = async (application) => {
    try {
      const applicationId = application._id;
      const jobId = application.job._id;
      
      setCancellingJobIds(prev => new Set([...prev, jobId]));
      
      console.log('Cancelling application:', applicationId);
      
      const response = await fetch(buildApiUrl(`/job-applications/${applicationId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel application');
      }

      setApplications(prev => prev.filter(app => app._id !== applicationId));
      
      let applicationIds = JSON.parse(localStorage.getItem('myApplicationIds') || '[]');
      applicationIds = applicationIds.filter(id => id !== applicationId);
      localStorage.setItem('myApplicationIds', JSON.stringify(applicationIds));
      console.log('🗑️ Removed cancelled application from localStorage:', applicationId);
      
      toast.success('Application cancelled successfully');
      
      setTimeout(fetchApplications, 1000);
      
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast.error(error.message || 'Failed to cancel application');
    } finally {
      setCancellingJobIds(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(application.job._id);
        return newSet;
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '⏳ Pending';
      case 'accepted':
        return '✅ Accepted';
      case 'in-progress':
        return '🔄 In Progress';
      case 'completed':
        return '✅ Completed';
      case 'rejected':
        return '❌ Rejected';
      default:
        return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleViewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleViewApplicationDetails = (application) => {
    setSelectedApplication(application);
  };

  const filteredApplications = applications.filter(app => 
    app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPastJobs = pastJobs.filter(job => 
    job.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !applications.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
        <div className="fixed inset-0 -z-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.02)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.01)_0%,transparent_50%)]"></div>
          <MobileParticleField count={6} />
          {Array.from({ length: 4 }, (_, i) => (
            <MobileFloatingGeometry key={i} delay={i * 0.5} />
          ))}
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-100/50"
          >
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full"
              />
              <p className="text-gray-600 font-medium">Loading your applications...</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      {/* Mobile Background Patterns */}
      <div className="fixed inset-0 -z-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.02)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.01)_0%,transparent_50%)]"></div>
        <MobileParticleField count={6} />
        {Array.from({ length: 4 }, (_, i) => (
          <MobileFloatingGeometry key={i} delay={i * 0.5} />
        ))}
      </div>

      <div className="relative z-10 backdrop-blur-sm">
        {/* Mobile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/40 backdrop-blur-md border-b border-gray-200/30 sticky top-0 z-20"
        >
          <div className="px-3 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 bg-black/90 backdrop-blur-sm text-white rounded-lg flex items-center justify-center cursor-pointer shadow-md"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </motion.div>
                
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-wide">
                    My Applications
                  </h1>
                  <p className="text-xs text-gray-600">
                    Track your job applications
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* Connection Status */}
                <div className="flex items-center">
                  {connectionStatus === 'connected' ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500" />
                  )}
                </div>
                
                {lastUpdated && (
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-8 h-8 bg-black/90 backdrop-blur-sm text-white rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="mt-3 relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black/30"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connection Status Banner */}
        {connectionStatus === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3"
          >
            <div className="flex items-center">
              <WifiOff className="w-4 h-4 text-yellow-600 mr-2" />
              <p className="text-yellow-700 text-xs">Offline mode - showing cached data</p>
            </div>
          </motion.div>
        )}

        {/* Mobile Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-3 py-3"
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg p-2 shadow-md border border-gray-100">
              <div className="text-center">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mx-auto mb-1">
                  <Briefcase className="w-3 h-3 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">Active</p>
                <p className="text-sm font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 shadow-md border border-gray-100">
              <div className="text-center">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center mx-auto mb-1">
                  <Award className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-sm font-bold text-gray-900">{pastJobs.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 shadow-md border border-gray-100">
              <div className="text-center">
                <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center mx-auto mb-1">
                  <FileText className="w-3 h-3 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-sm font-bold text-gray-900">{applications.length + pastJobs.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Mobile Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-3 mb-3"
        >
          <div className="bg-white rounded-lg p-1 shadow-md border border-gray-100">
            <div className="flex">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('current')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-300 ${
                  activeTab === 'current'
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active ({applications.length})
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-300 ${
                  activeTab === 'completed'
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({pastJobs.length})
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Mobile Content */}
        <div className="px-3 pb-16">
          <AnimatePresence mode="wait">
            {activeTab === 'current' ? (
              <motion.div
                key="current"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {filteredApplications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl p-6 text-center shadow-md border border-gray-100"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">No Active Applications</h3>
                    <p className="text-gray-600 mb-4 text-xs">You haven't applied for any jobs yet.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/jobs')}
                      className="px-4 py-2 bg-black text-white text-xs font-medium rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300"
                    >
                      Browse Available Jobs
                    </motion.button>
                  </motion.div>
                ) : (
                  filteredApplications.map((application, index) => (
                    <motion.div
                      key={application._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      whileHover={{ y: -5 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                      <div className="p-6">
                        {/* Job Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                              {application.job?.title || 'Untitled Job'}
                            </h3>
                            <p className="text-gray-600 font-medium">
                              {application.job?.companyName || 'Unknown Company'}
                            </p>
                          </div>
                          
                          {/* Application Status Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            application.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {application.status === 'pending' ? '⏳ Pending' :
                             application.status === 'accepted' ? '✅ Accepted' :
                             application.status === 'in-progress' ? '🔄 In Progress' :
                             application.status === 'completed' ? '✅ Completed' :
                             '❌ Rejected'}
                          </div>
                        </div>

                        {/* Application Progress - Show if user has applied */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Application Progress</h4>
                          <JobApplicationProgress 
                            applicationId={application._id}
                            onStatusChange={(status) => {
                              setApplications(prev => 
                                prev.map(app => 
                                  app._id === application._id 
                                    ? { ...app, status } 
                                    : app
                                )
                              );
                            }}
                          />
                        </div>

                        {/* Job Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="text-sm">
                              {application.job?.location?.city && application.job.location.city !== 'Not Available' 
                                ? `${application.job.location.city}, ${application.job.location.state || 'State not specified'}`
                                : 'Location not specified'
                              }
                            </span>
                          </div>
                          
                          {application.job?.salary && application.job.salary > 0 && (
                            <div className="flex items-center text-gray-600">
                              <span className="text-green-600 font-semibold">₹</span>
                              <span className="text-sm font-medium ml-1">
                                {typeof application.job.salary === 'number' 
                                  ? application.job.salary.toLocaleString() 
                                  : application.job.salary
                                } {application.job?.employmentType === 'Full-time' ? '/month' : '/day'}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-gray-600">
                            <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                            <span className="text-sm">{application.job?.category || 'General Work'}</span>
                          </div>
                        </div>

                        {/* Job Description */}
                        {application.job?.description && application.job.description !== 'No description available' && (
                          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                            {application.job.description}
                          </p>
                        )}

                        {/* Requirements */}
                        {application.job?.skillsRequired && application.job.skillsRequired.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Required Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {application.job.skillsRequired.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                              {application.job.skillsRequired.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{application.job.skillsRequired.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleViewApplicationDetails(application)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center"
                          >
                            View Details
                          </button>
                          
                          <button
                            onClick={() => handleCancelApplication(application)}
                            disabled={cancellingJobIds.has(application.job._id)}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {cancellingJobIds.has(application.job._id) ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="completed"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {filteredPastJobs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-8 text-center shadow-xl border border-gray-100"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Jobs</h3>
                    <p className="text-gray-600 text-sm">You haven't completed any jobs yet.</p>
                  </motion.div>
                ) : (
                  filteredPastJobs.map((job, index) => (
                    <motion.div
                      key={job._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      whileHover={{ y: -5 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                    >
                      <div className="p-6">
                        {/* Job Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                              {job.job?.title || 'Completed Job'}
                            </h3>
                            <p className="text-gray-600 font-medium">
                              {job.job?.companyName || 'Unknown Company'}
                            </p>
                          </div>
                          
                          {/* Completion Status Badge */}
                          <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            ✅ Completed
                          </div>
                        </div>

                        {/* Job Details */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="text-sm">
                              {job.job?.location?.city || 'Location not specified'}, {job.job?.location?.state || 'State not specified'}
                            </span>
                          </div>
                          
                          {job.job?.salary && job.job.salary > 0 && (
                            <div className="flex items-center text-gray-600">
                              <span className="text-green-600 font-semibold">₹</span>
                              <span className="text-sm font-medium ml-1">
                                {job.job.salary.toLocaleString()} {job.job?.employmentType === 'Full-time' ? '/month' : '/day'}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-gray-600">
                            <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                            <span className="text-sm">{job.job?.category || 'General Work'}</span>
                          </div>
                        </div>

                        {/* Job Description */}
                        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                          {job.job?.description || 'No description available'}
                        </p>

                        {/* Payment Information for Completed Jobs */}
                        {job.paymentAmount && job.paymentAmount > 0 && (
                          <div className="mb-4 p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                                <span className="text-sm font-medium text-green-800">
                                  Payment: ₹{job.paymentAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                job.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {job.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Requirements */}
                        {job.job?.skillsRequired && job.job.skillsRequired.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Required Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {job.job.skillsRequired.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.job.skillsRequired.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{job.job.skillsRequired.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="mt-4">
                          <button
                            onClick={() => handleViewJobDetails(job.job._id)}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center"
                          >
                            View Job Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Application Details Modal */}
        <AnimatePresence>
          {selectedApplication && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedApplication(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Application Details</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedApplication(null)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Job Information</h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-base font-semibold text-gray-900 mb-2">
                        {selectedApplication.job?.title}
                      </p>
                      <p className="text-gray-600 mb-2 text-sm">{selectedApplication.job?.companyName}</p>
                      <p className="text-gray-600 text-sm">
                        {selectedApplication.job?.location?.city}, {selectedApplication.job?.location?.state}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Application Status</h4>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedApplication.status)}`}>
                      {getStatusDisplay(selectedApplication.status)}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Applied Date</h4>
                    <p className="text-gray-600 text-sm">
                      {new Date(selectedApplication.appliedAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedApplication.job?.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                      <p className="text-gray-600 text-sm">
                        {selectedApplication.job.description}
                      </p>
                    </div>
                  )}

                  {selectedApplication.job?.requirements && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                      <p className="text-gray-600 text-sm">
                        {selectedApplication.job.requirements}
                      </p>
                    </div>
                  )}

                  {selectedApplication.job?.skillsRequired && selectedApplication.job.skillsRequired.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedApplication.job.skillsRequired.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplication.job?.startDate && !isNaN(new Date(selectedApplication.job.startDate).getTime()) && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Job Duration</h4>
                      <p className="text-gray-600 text-sm">
                        Start: {new Date(selectedApplication.job.startDate).toLocaleDateString()}
                        {selectedApplication.job.endDate && !isNaN(new Date(selectedApplication.job.endDate).getTime()) && (
                          <span> - End: {new Date(selectedApplication.job.endDate).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  )}

                  {selectedApplication.paymentAmount && selectedApplication.paymentAmount > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                      <p className="text-gray-600 text-sm">
                        Amount: ₹{selectedApplication.paymentAmount.toLocaleString()}
                      </p>
                      {selectedApplication.paymentStatus && selectedApplication.paymentStatus !== 'pending' && selectedApplication.paymentStatus !== 'undefined' && (
                        <p className="text-gray-600 text-sm">
                          Status: <span className="capitalize">{selectedApplication.paymentStatus}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Status History</h4>
                      <div className="space-y-2">
                        {selectedApplication.statusHistory.slice(-3).map((history, index) => (
                          <div key={index} className="flex items-center text-xs">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              history.status === 'completed' ? 'bg-green-500' :
                              history.status === 'accepted' ? 'bg-blue-500' :
                              history.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <span className="text-gray-600 capitalize">{history.status}</span>
                            <span className="text-gray-400 ml-auto">
                              {history.changedAt && !isNaN(new Date(history.changedAt).getTime())
                                ? new Date(history.changedAt).toLocaleDateString()
                                : 'Recently'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyApplications;