import React from 'react';
import PropTypes from 'prop-types';
import { getJobApplications } from '../../utils/jobApplicationUtils';

/**
 * Component to display application status badge for a job
 * @param {Object} props - Component props
 * @param {string} props.jobId - ID of the job to check
 * @param {boolean} props.isApplied - Flag indicating if the job has been applied for
 * @param {Function} props.onUpdateStatus - Callback to update the application status
 * @returns {JSX.Element} - Application status badge or null
 */
const JobApplicationStatus = ({ jobId, isApplied, acceptedJobs }) => {
  const getStatusBadge = () => {
    if (!isApplied) return null;

    const applications = getJobApplications();
    const jobApplication = applications[jobId];
    
    if (!jobApplication) return null;

    const status = jobApplication.status;
    let badgeClass = '';
    
    switch (status) {
      case 'pending':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        break;
      case 'accepted':
        badgeClass = 'bg-green-100 text-green-800';
        break;
      case 'completed':
        badgeClass = 'bg-blue-100 text-blue-800';
        break;
      case 'rejected':
        badgeClass = 'bg-red-100 text-red-800';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
    }

    return (
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  return (
    <div className="mb-2">
      {getStatusBadge()}
    </div>
  );
};

JobApplicationStatus.propTypes = {
  jobId: PropTypes.string.isRequired,
  isApplied: PropTypes.bool.isRequired,
  acceptedJobs: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.shape({
      job: PropTypes.shape({
        _id: PropTypes.string.isRequired
      })
    })),
    PropTypes.object
  ]).isRequired
};

export default JobApplicationStatus;
