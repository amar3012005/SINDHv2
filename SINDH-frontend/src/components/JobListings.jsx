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
    <div className="min-h-screen bg-white relative overflow-hidden py-12 px-4 devanagari">
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)',
          }}
        />
        <div
          className="absolute top-20 right-10 w-[300px] h-[300px] rounded-full opacity-20"
          style={{ background: '#E8DFD5', filter: 'blur(80px)' }}
        />
        <div
          className="absolute bottom-40 left-20 w-[200px] h-[200px] rounded-full opacity-30"
          style={{ background: '#DBBBA7', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-10">
          <button
            onClick={() => navigate('/home')}
            className="mb-8 px-6 py-2 bg-white/50 backdrop-blur-md border border-[#3B4883]/10 rounded-xl font-bold text-[#3B4883] hover:bg-[#3B4883]/5 transition-all flex items-center inline-flex"
          >
            <span className="mr-2">&larr;</span>
            Back to Home
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-6xl font-extrabold text-[#3B4883] mb-2 tracking-tight">SINDH</h1>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-1.5 bg-[#FF7124] rounded-full"></div>
                <span className="text-[#202124]/60 text-lg font-bold uppercase tracking-wider">
                  Available Jobs in your area
                </span>
              </div>
            </div>
            {currentUser && (
              <div className="px-6 py-4 bg-white/70 backdrop-blur-md border border-[#FF7124]/10 rounded-2xl flex items-center shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                <div>
                  <div className="text-[10px] font-black text-[#FF7124] uppercase tracking-widest leading-none mb-1">Worker Ranking</div>
                  <div className="text-xl font-black text-[#3B4883]">
                    ShaktiScore: <span className="text-[#FF7124]">{currentUser.shaktiScore || 35}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 bg-white/80 backdrop-blur-xl border border-[#3B4883]/10 p-8 rounded-3xl shadow-xl">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-[#3B4883]/5 rounded-xl flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#3B4883]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-[#3B4883] uppercase">Filter Results</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-[#202124]/40 mb-2 uppercase tracking-widest px-1">Profession</label>
              <select
                value={filter.skill}
                onChange={(e) => setFilter({ ...filter, skill: e.target.value })}
                className="form-input-custom"
              >
                <option value="">All Types of Work</option>
                <option value="construction">Construction (निर्माण)</option>
                <option value="agriculture">Agriculture (कृषि)</option>
                <option value="plumbing">Plumbing (नलसाजी)</option>
                <option value="electrical">Electrical (बिजली)</option>
                <option value="carpentry">Carpentry (बढ़ईगिरी)</option>
                <option value="housekeeping">Housekeeping (स्वच्छता)</option>
                <option value="driving">Driving (ड्राइविंग)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#202124]/40 mb-2 uppercase tracking-widest px-1">City / Village</label>
              <div className="relative">
                <input
                  type="text"
                  value={filter.location}
                  onChange={(e) => setFilter({ ...filter, location: e.target.value })}
                  placeholder="Where do you want to work?"
                  className="form-input-custom pl-12"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#3B4883]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#202124]/40 mb-2 uppercase tracking-widest px-1">Duty Type</label>
              <select
                value={filter.workType}
                onChange={(e) => setFilter({ ...filter, workType: e.target.value })}
                className="form-input-custom"
              >
                <option value="">Any Payment Type</option>
                <option value="daily">Daily Wage (दैनिक वेतन)</option>
                <option value="monthly">Monthly (मासिक)</option>
                <option value="contract">By Contract (ठेके पर)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-[#FF7124]/20 border-t-[#FF7124] rounded-full animate-spin mb-6"></div>
            <p className="text-[#3B4883] font-bold text-xl">Loading jobs for you...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white/90 backdrop-blur-sm border border-[#3B4883]/10 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-extrabold text-[#3B4883] group-hover:text-[#FF7124] transition-colors">{job.title}</h3>
                    <div className="px-3 py-1 bg-[#3B4883]/5 text-[#3B4883]/60 text-[10px] font-black uppercase tracking-widest rounded-full">{formatRelativeTime(job.postedOn)}</div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[#FF7124]/10 rounded-lg flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FF7124]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#202124]/40 font-black uppercase tracking-widest">Employer</div>
                        <div className="text-[#3B4883] font-bold">{job.employer}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#3B4883]/5 rounded-lg flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#3B4883]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#202124]/40 font-black uppercase tracking-widest">Location</div>
                          <div className="text-[#3B4883] font-bold">{job.location}</div>
                        </div>
                      </div>
                      <div className="flex items-center text-right">
                        <div className="ml-auto">
                          <div className="text-[10px] text-[#202124]/40 font-black uppercase tracking-widest">Payment</div>
                          <div className="text-[#FF7124] font-black">{job.wage}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#E8DFD5]/30 rounded-2xl mb-6">
                    <p className="text-sm text-[#202124]/80 font-medium ">{job.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <div key={index} className="px-3 py-1.5 bg-white border-2 border-[#3B4883]/10 text-[#3B4883] text-xs font-black uppercase tracking-widest rounded-xl">
                        {skill}
                      </div>
                    ))}
                    <div className="px-3 py-1.5 bg-[#FF7124]/5 text-[#FF7124] text-xs font-black uppercase tracking-widest rounded-xl">
                      {job.workType}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#3B4883]/5 mt-auto">
                  <button
                    onClick={() => handleApply(job)}
                    className="w-full flex items-center justify-center px-6 py-4 bg-[#3B4883] text-white rounded-2xl font-bold hover:bg-[#272D4E] transition-all shadow-lg hover:shadow-[#3B4883]/20"
                  >
                    {currentUser ? 'Apply for Job' : 'Register to Apply'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/50 backdrop-blur-md rounded-3xl border border-[#3B4883]/10">
            <div className="text-4xl font-extrabold text-[#3B4883] mb-4">No jobs found</div>
            <p className="text-[#202124]/60 text-lg">Try adjusting your filters to see more opportunities</p>
          </div>
        )}

        <div className="mt-12 bg-[#3B4883] rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-3xl font-extrabold mb-4">Not finding the right work?</h3>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">Complete your full SINDH profile to get access to priority job matches based on your specific skills and preferred location.</p>
            {!currentUser && (
              <button
                onClick={() => navigate('/register')}
                className="px-10 py-4 bg-[#FF7124] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#e66420] transition-all shadow-xl"
              >
                Create Worker Profile
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .devanagari { font-family: 'Noto Sans Devanagari', 'Inter', sans-serif; }
        .form-input-custom {
          width: 100%;
          padding: 1rem 1.25rem;
          background-color: white;
          border: 2px solid rgba(59, 72, 131, 0.1);
          border-radius: 1.25rem;
          font-weight: 600;
          transition: all 0.2s;
          outline: none;
          color: #202124;
        }
        .form-input-custom:focus {
          border-color: #FF7124;
          box-shadow: 0 0 0 4px rgba(255, 113, 36, 0.1);
          background-color: white;
        }
      `}</style>
    </div>
  );
};

export default JobListings;