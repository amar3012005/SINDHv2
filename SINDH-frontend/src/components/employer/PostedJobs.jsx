import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { employerService } from '../../services/employerService';

const PostedJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostedJobs();
  }, []);

  const fetchPostedJobs = async () => {
    try {
      const employerId = JSON.parse(localStorage.getItem('employerId'));
      if (!employerId) {
        toast.error('Please login as an employer');
        navigate('/employer/register');
        return;
      }

      const response = await employerService.getPostedJobs();
      setJobs(response);
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
      toast.error('Failed to fetch posted jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplications = (jobId) => {
    navigate(`/employer/jobs/${jobId}/applications`);
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      await employerService.updateJobStatus(jobId, newStatus);
      toast.success('Job status updated successfully');
      fetchPostedJobs(); // Refresh the jobs list
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Posted Jobs</h1>
          <button
            onClick={() => navigate('/employer/post-job')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Post New Job
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-600">No jobs posted yet</h2>
            <p className="text-gray-500 mt-2">Start by posting your first job!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                    <p className="text-gray-600 mt-1">{job.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Location:</span>
                        <p className="text-gray-900">{job.location.city}, {job.location.state}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Salary:</span>
                        <p className="text-gray-900">₹{job.salary} per day</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Duration:</span>
                        <p className="text-gray-900">{job.duration}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <p className="text-gray-900 capitalize">{job.status}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewApplications(job._id)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      View Applications
                    </button>
                    {job.status === 'open' && (
                      <button
                        onClick={() => handleUpdateStatus(job._id, 'closed')}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Close Job
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostedJobs; 