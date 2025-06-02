/**
 * Utility functions for handling authentication state
 */

import { synchronizeUserData } from './authSyncUtils';

/**
 * Check if user is authenticated
 * @returns {boolean} Whether the user is authenticated
 */
export const isAuthenticated = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return !!user && !!user.id;
  } catch (e) {
    console.error('Error checking authentication status:', e);
    return false;
  }
};

/**
 * Get user type from localStorage
 * @returns {string|null} User type ('worker' or 'employer') or null if not found
 */
export const getUserType = () => {
  try {
    // Try to get from user object first
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.type) {
      return user.type;
    }
    
    // Fall back to separate userType in localStorage
    return localStorage.getItem('userType');
  } catch (e) {
    console.error('Error getting user type:', e);
    return null;
  }
};

/**
 * Get current user data from localStorage - uses synchronization utility for consistency
 * @returns {object|null} User data or null if not found/invalid
 */
export const getCurrentUser = () => {
  try {
    // Use our synchronization utility to get consistent user data
    return synchronizeUserData();
  } catch (e) {
    console.error('Error getting current user:', e);
    return null;
  }
};

/**
 * Check if the current user is a worker
 * @returns {boolean} Whether the current user is a worker
 */
export const isWorker = () => {
  return getUserType() === 'worker';
};

/**
 * Check if the current user is an employer
 * @returns {boolean} Whether the current user is an employer
 */
export const isEmployer = () => {
  return getUserType() === 'employer';
};
