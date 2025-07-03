import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { getApiUrl } from '../../utils/apiUtils';
import { 
  MapPin, 
  Briefcase, 
  Building,
  Clock,
  DollarSign,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/jobs/${id}`));
      
      if (!response.ok) {
        throw new Error('Job not found');
      }
      
      const data = await response.json();
      setJob(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user || user.type !== 'worker') {
      toast.error('Please login as a worker to apply');
      navigate('/login');
      return;
    }

    setApplying(true);

    try {
      const response = await fetch(getApiUrl('/api/job-applications'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job: job._id,
          worker: user.id,
          employer: job.employer._id || job.employer,
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
        fetchJobDetails(); // Refresh to update application status
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/jobs')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Jobs
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 rounded-2xl shadow-xl border-2 border-orange-100 overflow-hidden"
        >
          {/* Job Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
                <div className="flex items-center text-blue-100 mb-4">
                  <Building className="w-5 h-5 mr-2" />
                  <span className="text-lg">{job.companyName}</span>
                </div>
                
                {job.hasApplied && (
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Applied
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-white">₹{job.salary?.toLocaleString()}</div>
                <div className="text-blue-100">{job.employmentType === 'Full-time' ? 'per month' : 'per day'}</div>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Location</div>
                  <div className="font-medium">{job.location?.city}, {job.location?.state}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-medium">{job.category}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm text-gray-500">Employment Type</div>
                  <div className="font-medium">{job.employmentType}</div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
              <p className="text-gray-700 leading-relaxed">{job.description}</p>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                <p className="text-gray-700 leading-relaxed">{job.requirements}</p>
              </div>
            )}

            {/* Skills Required */}
            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button */}
            {user?.type === 'worker' && !job.hasApplied && (
              <div className="flex justify-center">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {applying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    'Apply for This Job'
                  )}
                </button>
              </div>
            )}

            {/* Login Prompt */}
            {!user && (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Please login to apply for this job</p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JobDetails;
