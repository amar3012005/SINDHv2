import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { synchronizeUserData, clearAllUserData } from '../utils/authSyncUtils';
import { getCurrentUser, saveUserData, clearUserData } from '../utils/authUtils';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Load user data on initial mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        console.log('🔍 UserContext: Loading user data from localStorage');
        const userData = getCurrentUser();
        console.log('🔍 UserContext: Retrieved user data:', userData);

        if (userData) {
          setUser(userData);
          console.log('✅ UserContext: User loaded successfully:', userData.type, userData.name);
        } else {
          console.log('ℹ️ UserContext: No user data found in localStorage');
        }
      } catch (error) {
        console.error('❌ UserContext: Failed to load user from localStorage:', error);
      } finally {
        setIsLoadingUser(false);
        console.log('✅ UserContext: Finished loading user, isLoadingUser set to false');
      }
    };

    loadUserData();
  }, []);

  // Login function
  const loginUser = (userData) => {
    if (!userData) return;

    // Save to localStorage using utility
    saveUserData(userData);

    // Update state
    setUser(userData);

    // Check for pending notifications
    if (userData._id || userData.id) {
      import('../services/notificationService').then(({ checkPendingNotifications }) => {
        checkPendingNotifications(userData._id || userData.id);
      });
    }
  };

  // Logout function
  const logoutUser = () => {
    // Clear localStorage using utility
    clearUserData();

    // Update state
    setUser(null);
  };

  // Helper to check if user is Phase-1 employer
  const isPhase1Employer = () => {
    return user?.type === 'employer' && user?.phase === 1;
  };

  // Helper to check if user is Phase-1 worker
  const isPhase1Worker = () => {
    return user?.type === 'worker' && user?.phase === 1;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoadingUser,
        loginUser,
        logoutUser,
        isPhase1Employer,
        isPhase1Worker
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  console.log('useUser hook returning context:', context);
  return context;
};
