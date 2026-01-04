import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { synchronizeUserData, clearAllUserData } from '../utils/authSyncUtils';
import { getCurrentUser, saveUserData, clearUserData } from '../utils/authUtils';
import { offlineStorage } from '../utils/offlineStorage';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load user data on initial mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('🔍 UserContext: Loading user data');
        let userData = getCurrentUser();
        
        // If not in localStorage, check IndexedDB (Offline cache)
        if (!userData && !navigator.onLine) {
          const cachedProfile = await offlineStorage.getProfile('last_logged_in_user');
          if (cachedProfile) {
            userData = cachedProfile;
            console.log('📦 UserContext: Loaded profile from IndexedDB cache');
          }
        }

        if (userData) {
          setUser(userData);
          console.log('✅ UserContext: User loaded successfully:', userData.type, userData.name);
          
          // Cache for offline use
          if (navigator.onLine) {
            offlineStorage.saveProfile('last_logged_in_user', userData);
          }
        }
      } catch (error) {
        console.error('❌ UserContext: Failed to load user:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUserData();
  }, []);

  // Login function
  const loginUser = (userData) => {
    if (!userData) return;

    // Save to localStorage using utility
    saveUserData(userData);
    
    // Cache for offline use
    offlineStorage.saveProfile('last_logged_in_user', userData);

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
        isOffline,
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
