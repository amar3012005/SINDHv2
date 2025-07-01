import React, { createContext, useContext, useState, useEffect } from 'react';

const GlobalStateContext = createContext();

export const GlobalStateProvider = ({ children }) => {
  // User-related globals
  const [userType, setUserType] = useState(() => localStorage.getItem('userType') || 'guest');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('user'));
  const [employerId, setEmployerId] = useState(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.type === 'employer' ? user.id : null;
  });

  // Job-related globals
  const [jobCounts, setJobCounts] = useState({ total: 0, active: 0, inProgress: 0 });
  const [activeJobs, setActiveJobs] = useState([]);

  // Sync with localStorage/user changes
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserType(user?.type || 'guest');
    setIsLoggedIn(!!user?.id);
    setEmployerId(user?.type === 'employer' ? user.id : null);
  }, []);

  // Helper to update job counts and active jobs
  const updateJobStats = (jobs = []) => {
    const active = jobs.filter(j => j.status === 'active');
    const inProgress = jobs.filter(j => j.status === 'in-progress');
    setJobCounts({
      total: jobs.length,
      active: active.length,
      inProgress: inProgress.length
    });
    setActiveJobs(active);
  };

  return (
    <GlobalStateContext.Provider value={{
      userType,
      setUserType,
      isLoggedIn,
      setIsLoggedIn,
      employerId,
      setEmployerId,
      jobCounts,
      setJobCounts,
      activeJobs,
      setActiveJobs,
      updateJobStats
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);
