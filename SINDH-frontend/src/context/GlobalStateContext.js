import React, { createContext, useContext, useState } from 'react';

const GlobalStateContext = createContext();

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

export const GlobalStateProvider = ({ children }) => {
  const [userType, setUserType] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employerId, setEmployerId] = useState(null);
  const [jobCounts, setJobCounts] = useState({ total: 0 });
  const [activeJobs, setActiveJobs] = useState([]);

  const updateJobStats = () => {
    // Implementation for updating job stats
  };

  const value = {
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
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};
