import React from 'react';
import { motion } from 'framer-motion';
import JobApplicationButton from './JobApplicationButton';

const JobCard = ({ job, userType, userId }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white overflow-hidden shadow rounded-lg"
    >
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{job.company}</p>
        <div className="mt-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {job.location}
          </span>
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ₹{job.salary}
          </span>
        </div>
        <div className="mt-4">
          {userType === 'worker' ? (
            <JobApplicationButton
              jobId={job._id}
              workerId={userId}
              onApplicationSubmit={() => {
                // You can add any additional logic here
                console.log('Application submitted for job:', job._id);
              }}
            />
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = `/jobs/${job._id}`}
              className="w-full px-4 py-2 rounded-md text-blue-600 border-2 border-blue-600 font-medium hover:bg-blue-50"
            >
              View Details
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard; 