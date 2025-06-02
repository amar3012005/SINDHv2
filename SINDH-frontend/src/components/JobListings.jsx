import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const JobListings = () => {
  const { currentUser, addWorkEntry } = useContext(UserContext);
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    skill: '',
    location: '',
    workType: ''
  });

  // Generate sample jobs data
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      const sampleJobs = [
        {
          id: 1,
          title: 'Construction Helper',
          employer: 'JK Builders',
          location: 'Delhi',
          wage: '₹550 per day',
          skills: ['construction'],
          description: 'Need 5 workers for building construction. 7 days of work.',
          workType: 'daily',
          postedOn: '2025-04-23T10:30:00'
        },
        {
          id: 2,
          title: 'Farm Worker',
          employer: 'Green Fields Agriculture',
          location: 'Jaipur',
          wage: '₹450 per day',
          skills: ['agriculture'],
          description: 'Harvesting work available for 10 days. Food and accommodation provided.',
          workType: 'daily',
          postedOn: '2025-04-22T14:15:00'
        },
        {
          id: 3,
          title: 'Electrician for Factory Setup',
          employer: 'Metro Industries',
          location: 'Mumbai',
          wage: '₹18,000 per month',
          skills: ['electrical'],
          description: 'Looking for experienced electrician for factory maintenance.',
          workType: 'monthly',
          postedOn: '2025-04-22T09:45:00'
        },
        {
          id: 4,
          title: 'Plumber for Housing Society',
          employer: 'Sunshine Apartments',
          location: 'Bangalore',
          wage: '₹700 per day',
          skills: ['plumbing'],
          description: 'Urgent requirement for maintenance plumber. 3 days work.',
          workType: 'daily',
          postedOn: '2025-04-21T16:20:00'
        },
        {
          id: 5,
          title: 'Harvest Season Workers',
          employer: 'Punjab Farms',
          location: 'Amritsar',
          wage: '₹15,000 for season',
          skills: ['agriculture'],
          description: 'Wheat harvesting season workers needed. 3 week contract.',
          workType: 'contract',
          postedOn: '2025-04-20T11:10:00'
        },
        {
          id: 6,
          title: 'Carpenter for Furniture Workshop',
          employer: 'Wooden Creations',
          location: 'Jaipur',
          wage: '₹650 per day',
          skills: ['carpentry'],
          description: 'Need skilled carpenter for custom furniture making.',
          workType: 'daily',
          postedOn: '2025-04-19T13:30:00'
        },
        {
          id: 7,
          title: 'Driver for Company Executive',
          employer: 'Tech Solutions Ltd.',
          location: 'Delhi',
          wage: '₹22,000 per month',
          skills: ['driving'],
          description: 'Looking for experienced driver with clean record. Must know English basics.',
          workType: 'monthly',
          postedOn: '2025-04-18T10:00:00'
        }
      ];

      setJobs(sampleJobs);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter jobs based on user selection
  const filteredJobs = jobs.filter(job => {
    return (
      (filter.skill === '' || job.skills.includes(filter.skill)) &&
      (filter.location === '' || job.location.toLowerCase().includes(filter.location.toLowerCase())) &&
      (filter.workType === '' || job.workType === filter.workType)
    );
  });

  // Apply for a job
  const handleApply = (job) => {
    if (!currentUser) {
      navigate('/register');
      return;
    }
    
    // Add to work history
    addWorkEntry({
      title: job.title,
      employer: job.employer,
      location: job.location,
      status: 'applied',
      appliedOn: new Date().toISOString()
    });
    
    alert(`Applied successfully for ${job.title}! The employer will contact you on your registered mobile number.`);
  };

  // Format date to relative time
  const formatRelativeTime = (dateString) => {
    const jobDate = new Date(dateString);
    const now = new Date();
    const diffMs = now - jobDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#333_1px,transparent_1px),linear-gradient(-45deg,#222_1px,transparent_1px)] bg-[size:22px_22px]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#333_1px,transparent_1px),linear-gradient(90deg,#222_1px,transparent_1px)] bg-[size:50px_50px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto pt-20 px-4 pb-10">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-8 px-4 py-2 border border-white/20 font-mono text-xs flex items-center"
          >
            <span>&#8592;</span>
            <span className="ml-2">Back to Home</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <h1 className="text-3xl font-mono mb-2">Shram Saathi</h1>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span className="text-white/70 text-sm font-mono">
                  Available Jobs In Your Area
                </span>
              </div>
            </div>
            {currentUser && (
              <div className="mt-4 md:mt-0 px-4 py-2 bg-zinc-900 border border-white/10 flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-3"></div>
                <div className="text-xs font-mono">
                  <span className="text-white/60">ShaktiScore:</span> 
                  <span className="ml-2">{currentUser.shaktiScore || 35}/100</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-zinc-900 border border-white/10 p-4">
          <h2 className="text-lg font-mono mb-4 border-b border-white/10 pb-2">Find Jobs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1 font-mono">Skill</label>
              <select
                value={filter.skill}
                onChange={(e) => setFilter({...filter, skill: e.target.value})}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              >
                <option value="">All Skills</option>
                <option value="construction">Construction</option>
                <option value="agriculture">Agriculture</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="carpentry">Carpentry</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="driving">Driving</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-white/60 mb-1 font-mono">Location</label>
              <input
                type="text"
                value={filter.location}
                onChange={(e) => setFilter({...filter, location: e.target.value})}
                placeholder="Enter city or district"
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-white/60 mb-1 font-mono">Work Type</label>
              <select
                value={filter.workType}
                onChange={(e) => setFilter({...filter, workType: e.target.value})}
                className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="daily">Daily Wage</option>
                <option value="monthly">Monthly Salary</option>
                <option value="contract">Contract Based</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
            <p className="text-white/60 text-sm font-mono">Loading available jobs...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-zinc-900 border border-white/10 overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-mono">{job.title}</h3>
                    <span className="text-xs text-white/40 font-mono">{formatRelativeTime(job.postedOn)}</span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-white/60 font-mono">Employer</div>
                      <div>{job.employer}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60 font-mono">Location</div>
                      <div>{job.location}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60 font-mono">Payment</div>
                      <div>{job.wage}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60 font-mono">Work Type</div>
                      <div className="capitalize">{job.workType}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-xs text-white/60 font-mono mb-1">Description</div>
                    <div className="text-sm">{job.description}</div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    {job.skills.map((skill, index) => (
                      <div key={index} className="px-2 py-1 bg-blue-900/20 border border-blue-500/20 text-xs font-mono capitalize">
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="px-5 pb-5 pt-2 border-t border-white/5 mt-4">
                  <button
                    onClick={() => handleApply(job)}
                    className="w-full px-4 py-2 bg-blue-900/30 border border-blue-500/30 font-mono text-sm hover:bg-blue-900/50 transition-all duration-300"
                  >
                    {currentUser ? 'Apply Now' : 'Register to Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-2xl font-mono mb-4">No jobs found</div>
            <p className="text-white/60">Try adjusting your filters to see more jobs</p>
          </div>
        )}

        <div className="mt-8 bg-zinc-900 border border-white/10 p-4">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-mono mb-2">Not seeing jobs in your skill area?</h3>
              <p className="text-white/70 text-sm mb-2">Complete your GrameenLink profile to get personalized job matches based on your skills and location.</p>
              {!currentUser && (
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-1 border border-white/20 font-mono text-xs"
                >
                  Create Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListings;