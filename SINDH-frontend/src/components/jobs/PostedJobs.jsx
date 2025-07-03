import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import JobCard from './JobCard';

function PostedJobs() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    // Fetch posted jobs from the API or context
    const fetchPostedJobs = async () => {
      // ...existing code to fetch jobs...
    };

    fetchPostedJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t('jobs.postedJobs')}
        </h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PostedJobs;