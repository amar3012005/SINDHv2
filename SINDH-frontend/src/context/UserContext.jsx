import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api'; // Assuming you have an api config
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
        const userData = getCurrentUser();
        if (userData) {
          setUser(userData);
          console.log('User loaded from localStorage:', userData.type);
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
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
    
    // Update state
    setUser(userData);
  };
  
  // Logout function
  const logoutUser = () => {
    // Clear localStorage using utility
    clearUserData();
    
    // Update state
    setUser(null);
  };
  
  return (
    <UserContext.Provider 
      value={{ 
        user, 
        isLoadingUser, 
        loginUser, 
        logoutUser 
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
