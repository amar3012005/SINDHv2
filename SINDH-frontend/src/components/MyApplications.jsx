import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MapPin, 
  Briefcase,
  ArrowRight,
  Calendar,
  Clock as ClockIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getApiUrl } from '../utils/apiUtils';
import { getCurrentUser } from '../utils/authUtils';

function MyApplications() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const currentUser = getCurrentUser();

  // Fetch applications on component mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchMyApplications();
    } else {
      setError('Please login to view your applications');
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiUrl()}/job-applications/worker/${currentUser.id}/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'completed':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 mr-1" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return <CheckCircle className="w-4 h-4 mr-1" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const handleViewDetails = (app) => {
    setSelectedApplication(app);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedApplication(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-medium text-gray-900 mb-1">Error Loading Applications</h2>
          <p className="text-sm text-gray-600 mb-3">{error}</p>
          <button
            onClick={fetchMyApplications}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 sm:px-4 lg:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {t('myApplications.title', 'My Applications')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('myApplications.subtitle', 'Track the status of your job applications')}
          </p>
        </div>

        {/* Status Filter - Horizontal Scrollable */}
        <div className="mb-6 px-2">
          <div className="flex space-x-2 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm rounded-full whitespace-nowrap ${
                filterStatus === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('common.all', 'All')} ({applications.length})
            </button>
            
            {['pending', 'accepted', 'rejected', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm rounded-full flex items-center whitespace-nowrap ${
                  filterStatus === status 
                    ? `${
                        status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        status === 'accepted' ? 'bg-green-100 text-green-800' :
                        status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {getStatusIcon(status)}
                <span className="hidden sm:inline">
                  {t(`status.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
                </span>
                <span className="sm:ml-1">
                  ({applications.filter(app => app.status === status).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Applications Grid */}
        <div className="px-2">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1 sm:text-lg">
                {filterStatus === 'all' 
                  ? t('myApplications.noApplications', 'No applications yet')
                  : t('myApplications.noFilteredApplications', `No ${filterStatus} applications`)}
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm">
                {filterStatus === 'all'
                  ? t('myApplications.startApplying', 'Start applying to jobs to see your applications here')
                  : t('myApplications.noMatchingStatus', `You don't have any ${filterStatus} applications at the moment`)}
              </p>
              {filterStatus !== 'all' && (
                <button
                  onClick={() => setFilterStatus('all')}
                  className="mt-3 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                >
                  {t('common.viewAll', 'View all applications')} <ArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
                  onClick={() => handleViewDetails(app)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 pr-2">
                        {app.job?.title || t('common.untitled', 'Untitled Job')}
                      </h3>
                      <span className={`${getStatusBadge(app.status)} text-xs flex-shrink-0`}>
                        {t(`status.${app.status}`, app.status.charAt(0).toUpperCase() + app.status.slice(1))}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Briefcase className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">
                        {app.employer?.companyName || t('common.notSpecified', 'Not specified')}
                      </span>
                    </div>
                    
                    <div className="mt-1.5 flex items-center text-xs text-gray-500">
                      <MapPin className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate">
                        {app.job?.location?.city || t('common.remote', 'Remote')}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDate(app.createdAt)}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(app);
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {t('common.details', 'Details')} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {selectedApplication.job?.title || t('common.jobDetails', 'Job Details')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedApplication.employer?.companyName || ''}
                    </p>
                  </div>
                  <span className={getStatusBadge(selectedApplication.status)}>
                    {t(`status.${selectedApplication.status}`, 
                       selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1))}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900">
                      {t('common.jobDescription', 'Job Description')}
                    </h4>
                    <p className="mt-1 text-sm text-gray-700">
                      {selectedApplication.job?.description || t('common.noDescription', 'No description available')}
                    </p>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {t('common.location', 'Location')}
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedApplication.job?.location?.city || t('common.remote', 'Remote')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {t('common.salary', 'Salary')}
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedApplication.job?.salary || t('common.notSpecified', 'Not specified')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {t('common.appliedOn', 'Applied on')}
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedApplication.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {t('common.lastUpdated', 'Last updated')}
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedApplication.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  {t('common.close', 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyApplications;
