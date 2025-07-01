import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building, MapPin, FileText, Phone, Mail, Award, Calendar, 
  Edit, Settings, Briefcase, Star, ChevronRight, TrendingUp, Users,
  Clock, CheckCircle, AlertCircle, Plus, Eye, MoreHorizontal, Globe,
  Loader, RefreshCw, ArrowLeft
} from 'lucide-react';
import { employerService } from '../../services/employerService';
import toast from 'react-hot-toast';

const EmployerProfilePage = () => {
  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [postedJobs, setPostedJobs] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalApplications: 0
  });

  // Get employer ID from various sources
  const getEmployerId = () => {
    // Try to get from localStorage
    const storedUser = localStorage.getItem('user');
    const storedEmployer = localStorage.getItem('employer');
    const storedEmployerId = localStorage.getItem('employerId');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.type === 'employer' && (user.id || user._id)) {
          return user.id || user._id;
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    if (storedEmployer) {
      try {
        const employer = JSON.parse(storedEmployer);
        if (employer._id || employer.id) {
          return employer._id || employer.id;
        }
      } catch (e) {
        console.error('Error parsing stored employer:', e);
      }
    }
    
    if (storedEmployerId) {
      return storedEmployerId;
    }
    
    return null;
  };

  // Fetch employer profile data
  const fetchEmployerProfile = async (employerId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching employer profile for ID:', employerId);
      
      // Add user type headers for proper authentication
      const response = await fetch(`http://localhost:5000/api/employers/${employerId}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'employer',
          'User-ID': employerId
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Employer profile not found');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please log in as an employer.');
        } else {
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('Employer profile data:', data);
      
      setEmployerData(data);
      
      // Update localStorage with fresh data
      localStorage.setItem('employer', JSON.stringify(data));
      localStorage.setItem('employerId', data._id || data.id);
      
      // Fetch additional data
      await Promise.all([
        fetchPostedJobs(employerId),
        fetchEmployerStats(employerId)
      ]);
      
    } catch (error) {
      console.error('Error fetching employer profile:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posted jobs
  const fetchPostedJobs = async (employerId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/jobs/employer/${employerId}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'employer',
          'User-ID': employerId
        }
      });
      
      if (response.ok) {
        const jobs = await response.json();
        setPostedJobs(jobs);
        console.log('Posted jobs:', jobs);
      }
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
    }
  };

  // Fetch employer statistics
  const fetchEmployerStats = async (employerId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employers/${employerId}/stats`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'employer',
          'User-ID': employerId
        }
      });
      
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
        console.log('Employer stats:', statsData);
      }
    } catch (error) {
      console.error('Error fetching employer stats:', error);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    const employerId = getEmployerId();
    if (!employerId) {
      setError('No employer ID found. Please log in again.');
      return;
    }
    
    setRefreshing(true);
    await fetchEmployerProfile(employerId);
    setRefreshing(false);
    toast.success('Profile refreshed!');
  };

  // Initialize component
  useEffect(() => {
    const employerId = getEmployerId();
    
    if (!employerId) {
      setError('No employer ID found. Please log in again.');
      setLoading(false);
      return;
    }
    
    fetchEmployerProfile(employerId);
  }, []);

  // Helper functions
  const getInitials = (name) => {
    if (!name) return 'ER';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    
    if (typeof location === 'string') return location;
    
    const parts = [
      location.village,
      location.district,
      location.state,
      location.pincode
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Profile</h3>
          <p className="text-gray-600">Fetching your employer profile data...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {refreshing ? (
                <span className="flex items-center justify-center">
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </span>
              )}
            </button>
            <button 
              onClick={() => window.location.href = '/employer/register'}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Register New Account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main profile render
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'jobs', label: 'Job Posts', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with refresh button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <button 
              onClick={() => window.history.back()}
              className="mr-4 p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Employer Profile</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
        >
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>

          {/* Profile Content */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {getInitials(employerData?.name)}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="absolute -top-6 right-6 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-lg">
              <CheckCircle className="w-4 h-4 mr-1" />
              {employerData?.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
            </div>

            {/* Profile Info */}
            <div className="pt-16">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {employerData?.name}
                  </h1>
                  <p className="text-xl text-blue-600 font-medium mb-3">
                    {employerData?.company?.name}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      {employerData?.company?.type}
                    </span>
                    <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      {employerData?.company?.industry}
                    </span>
                    <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Employer
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    {formatLocation(employerData?.location)}
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Member since {formatDate(employerData?.registrationDate)}
                  </div>
                </div>
                
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalJobs}</div>
                  <div className="text-sm text-gray-500">Total Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.activeJobs}</div>
                  <div className="text-sm text-gray-500">Active Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalApplications}</div>
                  <div className="text-sm text-gray-500">Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {employerData?.rating?.average ? `⭐ ${employerData.rating.average.toFixed(1)}` : '⭐ New'}
                  </div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-8"
        >
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* About Section */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-gray-600" />
                      About Business
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {employerData?.businessDescription || 'No business description provided yet.'}
                    </p>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-gray-600" />
                      Recent Job Posts
                    </h3>
                    {postedJobs.length > 0 ? (
                      <div className="space-y-4">
                        {postedJobs.slice(0, 3).map((job, index) => (
                          <motion.div
                            key={job._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{job.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{job.description?.substring(0, 100)}...</p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(job.createdAt)}
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                job.status === 'active' 
                                  ? 'bg-green-100 text-green-700'
                                  : job.status === 'closed'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        {postedJobs.length > 3 && (
                          <button
                            onClick={() => setActiveTab('jobs')}
                            className="w-full text-center py-3 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View all {postedJobs.length} job posts
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No job posts yet</h4>
                        <p className="text-gray-500 mb-6">Start by posting your first job to attract skilled workers</p>
                        <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          <Plus className="w-5 h-5 mr-2" />
                          Post Your First Job
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 mr-3 text-gray-500" />
                        <span className="text-gray-700">{employerData?.phone}</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 mr-3 text-gray-500" />
                        <span className="text-gray-700">{employerData?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Email Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Phone Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Aadhar Verified</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Profile Complete</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center">
                          <Plus className="w-5 h-5 mr-3 text-blue-600" />
                          <span>Post New Job</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center">
                          <Eye className="w-5 h-5 mr-3 text-green-600" />
                          <span>View Applications</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 mr-3 text-purple-600" />
                          <span>Find Workers</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                {postedJobs.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900">Posted Jobs</h2>
                      <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <Plus className="w-4 h-4 mr-2" />
                        Post New Job
                      </button>
                    </div>
                    <div className="grid gap-6">
                      {postedJobs.map((job, index) => (
                        <motion.div
                          key={job._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                              <p className="text-gray-600 mt-2">{job.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                job.status === 'active' 
                                  ? 'bg-green-100 text-green-700'
                                  : job.status === 'closed'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {job.status}
                              </span>
                              <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {formatLocation(job.location)}
                              </span>
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {job.applications?.length || 0} applications
                              </span>
                            </div>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(job.createdAt)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Briefcase className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Job Posts Yet</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                      Start connecting with skilled workers by posting your first job. It's quick and easy!
                    </p>
                    <button className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Job Post
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="text-center py-16">
                  <TrendingUp className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Analytics Coming Soon</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Get insights into your job posts, applications, and worker engagement.
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h4 className="text-2xl font-bold text-blue-600">{stats.totalJobs}</h4>
                      <p className="text-blue-700">Total Jobs</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h4 className="text-2xl font-bold text-green-600">{stats.activeJobs}</h4>
                      <p className="text-green-700">Active Jobs</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h4 className="text-2xl font-bold text-purple-600">{stats.totalApplications}</h4>
                      <p className="text-purple-700">Applications</p>
                    </div>
                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <h4 className="text-2xl font-bold text-yellow-600">{stats.completedJobs}</h4>
                      <p className="text-yellow-700">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={employerData?.name || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={employerData?.email || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                          <input
                            type="text"
                            value={employerData?.company?.name || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            readOnly
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                            <input
                              type="text"
                              value={employerData?.company?.type || ''}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                            <input
                              type="text"
                              value={employerData?.company?.industry || ''}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Enable Editing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmployerProfilePage;
