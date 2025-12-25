/**
 * Authentication Synchronization Utilities
 * 
 * This file provides utilities to ensure consistent authentication state across the application.
 * It helps synchronize auth data between different storage mechanisms and formats.
 */

import { toast } from 'react-toastify';

/**
 * Synchronizes user data from various storage keys to ensure consistency
 * @returns {Object|null} The synchronized user object or null if no user found
 */
export const synchronizeUserData = () => {
  try {
    // Possible storage keys
    const userKeys = ['user', 'worker', 'employer', 'INDUSUser', 'currentUser'];
    let userData = null;
    let storageKey = null;
    
    // Find the first valid user data
    for (const key of userKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed && (parsed.id || parsed._id)) {
            userData = parsed;
            storageKey = key;
            console.log(`Found user data in localStorage key: ${key}`, parsed);
            break;
          }
        } catch (e) {
          console.warn(`Error parsing data from ${key}:`, e);
        }
      }
    }
    
    if (!userData) {
      // No valid user data found
      clearAllUserData();
      return null;
    }
    
    // Ensure consistent data structure
    const standardizedUser = {
      ...userData,
      id: userData.id || userData._id,
      type: userData.type || localStorage.getItem('userType') || 
            (storageKey === 'worker' ? 'worker' : 
             storageKey === 'employer' ? 'employer' : 'worker')
    };
    
    // Store the standardized user in the main 'user' key
    localStorage.setItem('user', JSON.stringify(standardizedUser));
    localStorage.setItem('userType', standardizedUser.type);
    
    return standardizedUser;
  } catch (e) {
    console.error('Error synchronizing user data:', e);
    return null;
  }
};

/**
 * Clear all user-related data from localStorage
 */
export const clearAllUserData = () => {
  // List of all possible user data keys
  const userKeys = [
    'user', 
    'userType', 
    'token', 
    'worker', 
    'workerId', 
    'employer', 
    'employerId',
    'INDUSUser',
    'currentUser',
    'auth',
    'authToken',
    'jwt',
    'profile',
    'userData',
    'credentials',
    'session'
  ];
  
  // Remove all keys
  userKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Also clear any user-related cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });
  
  console.log('All user data cleared from browser storage');
};

/**
 * Performs a complete logout across all storage mechanisms
 */
export const performCompleteLogout = () => {
  clearAllUserData();
  toast.info('Logged out successfully');
  
  // Reload the page to ensure a completely fresh state
  window.location.href = '/';
};

/**
 * Update the userType in all relevant storage locations
 * @param {string} type - The user type ('worker' or 'employer')
 */
export const updateUserType = (type) => {
  if (type !== 'worker' && type !== 'employer') {
    console.error('Invalid user type:', type);
    return;
  }
  
  try {
    // Update the separate userType
    localStorage.setItem('userType', type);
    
    // Update the type in the user object
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.type = type;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    console.log(`User type updated to: ${type}`);
  } catch (e) {
    console.error('Error updating user type:', e);
  }
};

export default {
  synchronizeUserData,
  clearAllUserData,
  performCompleteLogout,
  updateUserType
};
