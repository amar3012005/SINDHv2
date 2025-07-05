// Standalone component for job action buttons
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowRight, Check, Clock, X } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const JobActionButtons = ({ job = {}, onStatusChange }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [acceptedJobs, setAcceptedJobs] = useState([]);

  useEffect(() => {
    const fetchAcceptedJobs = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`https://sindh-backend.onrender.comapi/job-applications/worker/${user.id}/current`);
        const data = await response.json();
        setAcceptedJobs(data.filter(app => app.status === 'accepted'));
      } catch (error) {
        console.error('Error fetching accepted jobs:', error);
      }
    };

    fetchAcceptedJobs();
  }, [user?.id]);

  // Guard against undefined job
  if (!job || !job._id) {
    return null; // Or return a loading state/placeholder
  }

  const hasAcceptedJob = acceptedJobs.length > 0;
  const isCurrentJobAccepted = acceptedJobs.some(j => j.job._id === job._id);

  const handleApply = async () => {
    if (!user) {
      toast.info('Please login to apply for jobs');
      navigate('/login');
      return;
    }

    if (hasAcceptedJob && !isCurrentJobAccepted) {
      toast.warn('You already have an accepted job. Complete it before applying to new ones.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://sindh-backend.onrender.comapi/job-applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job._id,
          workerId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Application submitted successfully!');
        onStatusChange && onStatusChange('pending');
      } else {
        toast.error(data.message || 'Error submitting application');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    switch (job.status) {
      case 'pending':
        return (
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md"
            disabled
          >
            <Clock className="w-4 h-4" />
            <span>Application Pending</span>
          </button>
        );
      case 'accepted':
        return (
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-md"
            disabled
          >
            <Check className="w-4 h-4" />
            <span>Accepted</span>
          </button>
        );
      case 'rejected':
        return (
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-md"
            disabled
          >
            <X className="w-4 h-4" />
            <span>Not Selected</span>
          </button>
        );
      default:
        return (
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{loading ? 'Applying...' : 'Apply Now'}</span>
          </button>
        );
    }
  };

  return <div className="flex justify-end">{renderButton()}</div>;
};

JobActionButtons.propTypes = {
  job: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    status: PropTypes.string,
    title: PropTypes.string,
  }),
  onStatusChange: PropTypes.func,
};

JobActionButtons.defaultProps = {
  job: {},
  onStatusChange: () => {},
};

export default JobActionButtons;
