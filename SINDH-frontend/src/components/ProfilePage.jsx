import React, { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { currentUser, updateProfile, logoutUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(currentUser || {});

  // Redirect if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-lg p-6 bg-zinc-900 border border-white/10">
          <h1 className="text-xl font-mono mb-6">Profile Not Found</h1>
          <p className="text-white/70 mb-6">You need to register or log in to view your profile.</p>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-2 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 font-mono text-sm hover:border-white/40 transition-all duration-300 w-full"
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  // Calculate days since registration
  const daysSinceRegistration = () => {
    if (!currentUser.registeredAt) return 0;
    const registrationDate = new Date(currentUser.registeredAt);
    const currentDate = new Date();
    const diffTime = currentDate - registrationDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#333_1px,transparent_1px),linear-gradient(-45deg,#222_1px,transparent_1px)] bg-[size:22px_22px]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#333_1px,transparent_1px),linear-gradient(90deg,#222_1px,transparent_1px)] bg-[size:50px_50px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto pt-20 px-4 pb-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-white/20 font-mono text-xs"
          >
            &lt; Back to Home
          </button>
          
          <button
            onClick={logoutUser}
            className="px-4 py-2 border border-red-500/30 font-mono text-xs text-red-400"
          >
            Sign Out
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-mono mb-2">GrameenLink Profile</h1>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-blue-500"></div>
            <span className="text-white/70 text-sm font-mono">
              Your Professional Digital Identity
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Profile Info */}
          <div className="md:col-span-2 bg-zinc-900 border border-white/10 p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <h2 className="text-lg font-mono mb-4 border-b border-white/10 pb-2">Edit Profile</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">Mobile Number</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">Location (Village/District)</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">ID Type</label>
                    <select
                      name="idType"
                      value={formData.idType || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    >
                      <option value="">Select ID Type</option>
                      <option value="aadhaar">Aadhaar</option>
                      <option value="shg">SHG Linkage</option>
                      <option value="voter">Voter ID</option>
                    </select>
                  </div>
                </div>
                
                <h3 className="text-sm font-mono mb-3 mt-6 border-b border-white/10 pb-2">Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">Primary Skill</label>
                    <select
                      name="primarySkill"
                      value={formData.primarySkill || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    >
                      <option value="">Select Primary Skill</option>
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
                    <label className="block text-xs text-white/60 mb-1 font-mono">Secondary Skill</label>
                    <select
                      name="secondarySkill"
                      value={formData.secondarySkill || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    >
                      <option value="">Select Secondary Skill</option>
                      <option value="construction">Construction</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="carpentry">Carpentry</option>
                      <option value="housekeeping">Housekeeping</option>
                      <option value="driving">Driving</option>
                    </select>
                  </div>
                </div>
                
                <h3 className="text-sm font-mono mb-3 mt-6 border-b border-white/10 pb-2">Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">Available For Work</label>
                    <select
                      name="availability"
                      value={formData.availability || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    >
                      <option value="fulltime">Full Time</option>
                      <option value="parttime">Part Time</option>
                      <option value="weekends">Weekends Only</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">Preferred Work Type</label>
                    <select
                      name="preferredWork"
                      value={formData.preferredWork || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    >
                      <option value="daily">Daily Wage</option>
                      <option value="contract">Contract Based</option>
                      <option value="monthly">Monthly Salary</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-sm font-mono mb-3 mt-6 border-b border-white/10 pb-2">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-mono">UPI ID (Optional)</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId || ''}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-white/20 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-white/20 font-mono text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-900 border border-blue-500/30 font-mono text-xs"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                  <h2 className="text-lg font-mono">Personal Information</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 border border-white/20 font-mono text-xs"
                  >
                    Edit Profile
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <div className="text-xs text-white/60 font-mono">Full Name</div>
                    <div className="text-sm mt-1">{currentUser.fullName || 'Not provided'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-white/60 font-mono">Age / Gender</div>
                    <div className="text-sm mt-1">
                      {currentUser.age ? `${currentUser.age} years` : 'Age not provided'} / 
                      {currentUser.gender ? ` ${currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1)}` : ' Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-white/60 font-mono">Mobile Number</div>
                    <div className="text-sm mt-1">{currentUser.mobileNumber || 'Not provided'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-white/60 font-mono">Location</div>
                    <div className="text-sm mt-1">{currentUser.location || 'Not provided'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-white/60 font-mono">ID Type</div>
                    <div className="text-sm mt-1">
                      {currentUser.idType ? currentUser.idType.toUpperCase() : 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-white/60 font-mono">Member Since</div>
                    <div className="text-sm mt-1">
                      {currentUser.registeredAt ? new Date(currentUser.registeredAt).toLocaleDateString() : 'Unknown'} 
                      ({daysSinceRegistration()} days)
                    </div>
                  </div>
                </div>
                
                <h3 className="text-sm font-mono mt-8 mb-3 border-b border-white/10 pb-2">Skills & Expertise</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <div className="text-xs text-white/60 font-mono">Primary Skill</div>
                    <div className="text-sm mt-1 capitalize">{currentUser.primarySkill || 'Not provided'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-white/60 font-mono">Secondary Skill</div>
                    <div className="text-sm mt-1 capitalize">{currentUser.secondarySkill || 'Not provided'}</div>
                  </div>
                </div>
                
                <h3 className="text-sm font-mono mt-8 mb-3 border-b border-white/10 pb-2">Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <div className="text-xs text-white/60 font-mono">Available For Work</div>
                    <div className="text-sm mt-1 capitalize">{currentUser.availability || 'Full Time'}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-white/60 font-mono">Preferred Work Type</div>
                    <div className="text-sm mt-1 capitalize">{currentUser.preferredWork || 'Daily Wage'}</div>
                  </div>
                </div>
                
                <h3 className="text-sm font-mono mt-8 mb-3 border-b border-white/10 pb-2">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <div className="text-xs text-white/60 font-mono">UPI ID</div>
                    <div className="text-sm mt-1">{currentUser.upiId || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ShaktiScore Panel */}
          <div className="bg-zinc-900 border border-white/10 p-6">
            <h2 className="text-lg font-mono mb-4 border-b border-white/10 pb-2">ShaktiScore™</h2>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-mono">Your Score</span>
                <span className="text-lg font-bold">{currentUser.shaktiScore || 35}/100</span>
              </div>
              
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${currentUser.shaktiScore || 35}%` }}
                ></div>
              </div>
              
              <div className="mt-2 text-xs text-white/60">
                {currentUser.shaktiScore < 40 && "Complete your profile and get your first job to improve your score."}
                {currentUser.shaktiScore >= 40 && currentUser.shaktiScore < 70 && "Your score is growing! Complete more jobs for higher ratings."}
                {currentUser.shaktiScore >= 70 && "Excellent score! You're eligible for micro-loans and premium job offers."}
              </div>
            </div>
            
            <div className="mb-4 border-b border-white/10 pb-2">
              <h3 className="text-sm font-mono">Benefits Unlocked</h3>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Job Application Priority</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full ${currentUser.shaktiScore >= 50 ? 'bg-blue-500/20' : 'bg-white/10'} flex items-center justify-center mt-0.5`}>
                  {currentUser.shaktiScore >= 50 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/30" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${currentUser.shaktiScore >= 50 ? 'text-white' : 'text-white/40'}`}>Tool Financing (50+)</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full ${currentUser.shaktiScore >= 70 ? 'bg-blue-500/20' : 'bg-white/10'} flex items-center justify-center mt-0.5`}>
                  {currentUser.shaktiScore >= 70 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/30" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${currentUser.shaktiScore >= 70 ? 'text-white' : 'text-white/40'}`}>Micro Loans (₹5,000) (70+)</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full ${currentUser.shaktiScore >= 85 ? 'bg-blue-500/20' : 'bg-white/10'} flex items-center justify-center mt-0.5`}>
                  {currentUser.shaktiScore >= 85 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/30" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${currentUser.shaktiScore >= 85 ? 'text-white' : 'text-white/40'}`}>Premium Job Access (85+)</span>
              </li>
            </ul>
            
            <div className="mb-4 border-b border-white/10 pb-2">
              <h3 className="text-sm font-mono">Recent Work History</h3>
            </div>
            
            {currentUser.workHistory && currentUser.workHistory.length > 0 ? (
              <div className="space-y-3">
                {currentUser.workHistory.slice(0, 3).map((work, index) => (
                  <div key={index} className="border-l-2 border-blue-500/30 pl-3 py-1">
                    <div className="text-sm">{work.title}</div>
                    <div className="text-xs text-white/60 mt-1">
                      {work.employer} • {new Date(work.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-white/60">No work history yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;