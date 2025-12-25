import React from 'react';
import { MapPin, Briefcase } from 'lucide-react';

/**
 * JobCard Component
 * 
 * Reusable job card component with light theme styling.
 * Displays job information in a consistent format.
 */
const JobCard = ({ job, onViewDetails }) => {
  if (!job) return null;

  return (
    <div className="bg-white border border-[#3B4883]/10 shadow-soft hover:shadow-blue hover:border-[#FF7124]/30 overflow-hidden rounded-lg transition-all duration-300">
      <div className="p-6">
        {/* Title */}
        <h3 className="text-[#272D4E] font-semibold text-lg mb-1">
          {job.title}
        </h3>

        {/* Company */}
        <p className="text-[#202124]/70 text-sm mb-3">
          {job.company}
        </p>

        {/* Location Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-[#E8DFD5] text-[#3B4883] border border-[#3B4883]/20">
            <MapPin className="w-3 h-3 mr-1" />
            {job.location?.city || job.location?.state || 'Location not specified'}
          </span>
        </div>

        {/* Salary Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-[#FF7124]/10 text-[#FF7124] border border-[#FF7124]/30 font-semibold">
            ₹{job.salaryRange?.min || job.salary || 'Negotiable'}
            {job.salaryRange?.max && ` - ₹${job.salaryRange.max}`}
            {job.salaryPeriod && `/${job.salaryPeriod}`}
          </span>
        </div>

        {/* Description */}
        {job.description && (
          <p className="text-[#202124]/70 text-sm line-clamp-2 mb-4">
            {job.description}
          </p>
        )}

        {/* Employment Type */}
        {job.employmentType && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-[#E8DFD5] text-[#3B4883] border border-[#3B4883]/20">
              <Briefcase className="w-3 h-3 mr-1" />
              {job.employmentType}
            </span>
          </div>
        )}

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails && onViewDetails(job)}
          className="w-full px-4 py-2.5 bg-[#3B4883] text-white border border-[#3B4883] hover:bg-[#272D4E] shadow-blue rounded-lg transition-all duration-200 font-medium text-sm"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default JobCard;
