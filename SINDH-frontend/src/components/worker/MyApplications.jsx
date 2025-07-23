import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { getApiUrl } from '../../utils/apiUtils';
import { toast } from 'react-toastify';
import { 
  CheckCircle, MapPin, DollarSign, Building, Clock, 
  Briefcase, Eye, Phone, Mail, RefreshCw, Award, Search,
  Calendar, User, Star, TrendingUp, AlertCircle, Filter,
  X, Plus, BarChart3, Target, Zap, PlayCircle, PauseCircle
} from 'lucide-react';

const MyApplications = () => {
  const { user } = useUser();
  const applicationRefs = useRef({});
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('appliedAt');

  useEffect(() => {
    fetchApplications();
  }, []);

  // Fetch applications from database using correct API format
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching applications for worker:', user?.id);
      console.log('👤 User data:', { id: user?.id, type: user?.type, name: user?.name });
      
      if (!user?.id || user?.type !== 'worker') {
        setError('You must be logged in as a worker to view applications');
        return;
      }

      // Use the correct API endpoint format from backend
      const apiUrl = `${getApiUrl()}/job-applications/worker/${user.id}/current`;
      console.log('🌐 Fetching from:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response:', JSON.stringify(data, null, 2));
        
        // Handle the response format: { success: true, data: [...], count: number }
        const apps = data.data || [];
        console.log('📋 Applications found:', apps.length);
        
        // Transform to match our expected format - data is already properly formatted from backend
        const transformedApps = apps.map(app => {
          console.log('🔄 Processing app:', {
            id: app._id,
            status: app.status,
            jobTitle: app.job?.title,
            jobCompany: app.job?.companyName
          });
          
          return {
            _id: app._id,
            status: app.status,
            appliedAt: app.appliedAt,
            paymentStatus: app.paymentStatus,
            paymentAmount: app.paymentAmount,
            // Job details are already properly formatted from backend
            job: {
              _id: app.job._id,
              title: app.job.title,
              companyName: app.job.companyName,
              location: app.job.location,
              salary: app.job.salary,
              category: app.job.category,
              employmentType: app.job.employmentType,
              description: app.job.description
            },
            // Worker and employer details
            worker: app.worker,
            employer: app.employer,
            statusHistory: app.statusHistory || []
          };
        });
        
        console.log('✅ Transformed applications:', transformedApps);
        setApplications(transformedApps);
        
      } else {
        const errorText = await response.text();
        console.error('❌ API request failed:', response.status, errorText);
        setError(`Failed to fetch applications: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      setError(`Failed to connect to server: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper functions
  const handleRefresh = () => {
    console.log('🔄 Refreshing applications list...');
    setRefreshing(true);
    fetchApplications();
  };

  // Progress calculation function based on status
  const getProgressStep = (app) => {
    switch (app.status) {
      case 'pending': return 1;
      case 'accepted': return 2;
      case 'in-progress': return 3;
      case 'completed': return 4;
      case 'paid': return 5;
      default: return 1;
    }
  };

  const getProgressColor = (step) => {
    if (step >= 4) return 'from-green-500 to-emerald-600';
    if (step >= 3) return 'from-blue-500 to-indigo-600';
    if (step >= 2) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-50 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'in-progress': return <PlayCircle className="w-4 h-4 text-blue-600" />;
      case 'completed': return <Award className="w-4 h-4 text-purple-600" />;
      case 'paid': return <DollarSign className="w-4 h-4 text-emerald-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           app.job?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && app.status === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'appliedAt':
          return new Date(b.appliedAt) - new Date(a.appliedAt);
        case 'title':
          return a.job?.title?.localeCompare(b.job?.title) || 0;
        case 'salary':
          return (b.job?.salary || 0) - (a.job?.salary || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  // Progress bar component
  const ProgressBar = ({ app }) => {
    const step = getProgressStep(app);
    const steps = ['Applied', 'Accepted', 'In Progress', 'Completed', 'Paid'];
    
    return (
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Progress</span>
          <span>{steps[step - 1]} ({step}/5)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(step)}`}
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {steps.map((stepName, index) => (
            <div key={index} className={`text-xs ${index < step ? 'text-blue-600' : 'text-gray-400'}`}>
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - Similar to PostedJobs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              My Applications
            </h1>
            <p className="mt-2 sm:mt-3 max-w-2xl text-base sm:text-xl text-gray-500">
              Track your job applications and progress
            </p>
          </div>
        </div>

        {/* Compact Refresh Button - Below Navbar */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`fixed top-20 right-4 z-40 group w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-300 touch-manipulation flex items-center justify-center overflow-hidden ${
            refreshing 
              ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 cursor-not-allowed shadow-lg shadow-blue-300/30' 
              : 'bg-gradient-to-br from-slate-600 via-slate-700 to-gray-800 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg hover:shadow-blue-200/40 hover:scale-105 active:scale-95'
          }`}
          title={refreshing ? 'Refreshing Applications...' : 'Refresh Applications'}
        >
          <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10 transition-all duration-300 ${
            refreshing 
              ? 'animate-spin' 
              : 'group-hover:rotate-180 group-hover:scale-105'
          }`} />
        </button>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2" />
              <p className="text-red-600 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          {/* Search Bar */}
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications by job title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Status Filter Tabs */}
            <div className="flex space-x-1 overflow-x-auto flex-1">
              {[
                { value: 'all', label: 'All Applications' },
                { value: 'pending', label: 'Pending' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'paid', label: 'Paid' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`flex-1 min-w-0 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap touch-manipulation ${
                    filterStatus === filter.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="hidden sm:inline">{filter.label}</span>
                  <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
                  <span className="ml-1">({applications.filter(app => filter.value === 'all' || app.status === filter.value).length})</span>
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="appliedAt">Latest First</option>
                <option value="title">Job Title A-Z</option>
                <option value="salary">Salary High-Low</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No Applications Yet' : `No ${filterStatus} Applications`}
            </h3>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base px-4">
              {filterStatus === 'all' 
                ? 'Start applying to jobs to see your applications here' 
                : `You don't have any ${filterStatus} applications at the moment`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredApplications.map((app) => (
                <motion.div
                  key={app._id}
                  ref={el => applicationRefs.current[app._id] = el}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Status Banner */}
                  <div className={`px-3 sm:px-4 py-2 ${getStatusColor(app.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(app.status)}
                        <span className="ml-2 text-xs sm:text-sm font-medium">
                          {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="p-4 sm:p-6">
                    {/* Salary Display */}
                    <div className="mb-4">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                        ₹{app.job?.salary || 0}
                      </div>
                      <div className="text-xs text-gray-500">per month</div>
                    </div>

                    {/* Job Title and Company */}
                    <div className="mb-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                        {app.job?.title || 'Job Title'}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building className="w-4 h-4 mr-1" />
                        <span className="text-sm">{app.job?.companyName || 'Company'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          {app.job?.location?.city || 'City'}, {app.job?.location?.state || 'State'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <ProgressBar app={app} />

                    {/* Payment Status */}
                    {app.paymentStatus === 'paid' && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center text-green-700">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">
                            Paid: ₹{app.paymentAmount || app.job?.salary || 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                      {app.status === 'accepted' && (
                        <button className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Summary Stats */}
        {applications.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status === 'accepted').length}
              </div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {applications.filter(app => app.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-emerald-600">
                ₹{applications.filter(app => app.paymentStatus === 'paid').reduce((sum, app) => sum + (app.paymentAmount || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
