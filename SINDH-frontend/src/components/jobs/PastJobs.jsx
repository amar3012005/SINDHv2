import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { getApiUrl } from '../../utils/apiUtils';
import { CheckCircle, Calendar, MapPin, DollarSign, Building, Clock } from 'lucide-react';

const PastJobs = () => {
  const { user } = useUser();
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompletedJobs();
  }, [user]);

  const fetchCompletedJobs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/jobs/worker/${user.id}/completed`));
      
      if (response.ok) {
        const data = await response.json();
        setCompletedJobs(data.data || []);
      } else {
        throw new Error('Failed to fetch completed jobs');
      }
    } catch (error) {
      console.error('Error fetching completed jobs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your completed jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Past Jobs
          </h1>
          <p className="mt-3 max-w-2xl text-xl text-gray-500">
            Your completed work history and earnings
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {completedJobs.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Jobs Yet</h3>
            <p className="text-gray-500">Complete some jobs to see your work history here.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedJobs.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-green-200"
              >
                {/* Completed Status Banner */}
                <div className="bg-green-100 px-4 py-2 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Completed</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(item.application.paymentStatus)}`}>
                      {item.application.paymentStatus === 'paid' ? '💰 Paid' : '⏳ Payment Pending'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Job Title and Company */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.job.title}
                  </h3>
                  <div className="flex items-center mb-3">
                    <Building className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">{item.job.companyName}</span>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{item.job.location.city}, {item.job.location.state}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium text-green-600">
                        ₹{item.application.paymentAmount?.toLocaleString() || item.job.salary?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Completed: {formatDate(item.application.completedAt)}</span>
                    </div>

                    {item.application.paymentDate && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Paid: {formatDate(item.application.paymentDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Job Description */}
                  {item.job.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.job.description}
                      </p>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.job.category}
                    </span>
                    
                    {/* Payment Amount */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        +₹{item.application.paymentAmount?.toLocaleString() || item.job.salary?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Earned</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary Section */}
        {completedJobs.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedJobs.length}</div>
                <div className="text-sm text-gray-600">Jobs Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{completedJobs.reduce((sum, job) => sum + (job.application.paymentAmount || job.job.salary || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Earned</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {completedJobs.filter(job => job.application.paymentStatus === 'paid').length}
                </div>
                <div className="text-sm text-gray-600">Payments Received</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastJobs;
