import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const PostedJobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(null);
  
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch job details
        const jobResponse = await fetch(`https://sindh-backend.onrender.comapi/jobs/${jobId}`);
        
        if (!jobResponse.ok) {
          throw new Error('Failed to fetch job details');
        }
        
        const jobData = await jobResponse.json();
        setJob(jobData);
        
        // Fetch applications for this job
        const applicationsResponse = await fetch(`https://sindh-backend.onrender.comapi/jobs/${jobId}/applications`);
        
        if (!applicationsResponse.ok) {
          throw new Error('Failed to fetch applications');
        }
        
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData);
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [jobId]);
  
  const handleFinalSelection = async (applicationId) => {
    try {
      setProcessingAction(applicationId);
      
      const response = await fetch(`https://sindh-backend.onrender.comapi/job-applications/${applicationId}/final-selection`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to make final selection');
      }
      
      // Update local state to reflect the change
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: 'selected', isFinalSelection: true } 
            : app
        )
      );
      
      toast.success('Worker has been selected for the job');
    } catch (error) {
      console.error('Error making final selection:', error);
      toast.error('Failed to select worker');
    } finally {
      setProcessingAction(null);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-red-600">Job not found</h1>
          <button
            onClick={() => navigate('/employer/posted-jobs')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Back to Posted Jobs
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Job Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-lg text-blue-600">{job.company}</p>
            </div>
            <span className={`px-3 py-1 text-sm rounded-full ${
              job.status === 'active' ? 'bg-green-100 text-green-800' : 
              job.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-gray-500">Location</span>
              <p className="text-gray-900">{job.location.city}, {job.location.state}</p>
            </div>
            <div>
              <span className="text-gray-500">Salary</span>
              <p className="text-gray-900">₹{job.salary}</p>
            </div>
            <div>
              <span className="text-gray-500">Posted On</span>
              <p className="text-gray-900">{new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-gray-500">Category</span>
              <p className="text-gray-900">{job.category}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h2>
            <p className="text-gray-700">{job.description}</p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/employer/posted-jobs')}
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              Back to Posted Jobs
            </button>
          </div>
        </motion.div>
        
        {/* Applications Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Applications ({applications.length})
          </h2>
          
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No applications received yet for this job
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map(application => (
                <motion.div
                  key={application._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border rounded-lg p-4 ${
                    application.isFinalSelection 
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  {application.isFinalSelection && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                      Final Selection
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {application.worker?.name || 'Worker'}
                      </h3>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {application.worker?.location?.village}, {application.worker?.location?.district}
                        </div>
                        
                        {application.worker?.phone && (
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {application.worker?.phone}
                          </div>
                        )}
                        
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {application.worker?.skills && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-500">Skills:</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {application.worker.skills.map((skill, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                        application.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => navigate(`/workers/${application.worker?._id}`)}
                      className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Profile
                    </button>
                    
                    {/* Show the Final Selection button only for accepted applications that aren't already selected */}
                    {application.status === 'accepted' && !application.isFinalSelection && (
                      <button
                        onClick={() => handleFinalSelection(application._id)}
                        disabled={processingAction === application._id}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 text-sm"
                      >
                        {processingAction === application._id ? 'Processing...' : 'Make Final Selection'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostedJobDetails;
