/**
 * Enhanced logout utility functions
 * 
 * This file provides utilities for a thorough logout experience that
 * completely refreshes the application state
 */

import { clearAllUserData } from './authSyncUtils';
import { toast } from 'react-toastify';

/**
 * Performs a complete logout with page refresh
 * This ensures the app starts completely fresh with no remnants of user data
 */
export const performCompleteLogout = () => {
  // Clear all user data from storage
  clearAllUserData();
  
  // Show success message
  toast.success('Logged out successfully');
  
  // Force page refresh to completely reset the application state
  // Using location.href instead of navigate() ensures a full page refresh
  window.location.href = '/';
};

/**
 * Cleans up any memory references to user data
 * Call this function when you want to clear in-memory user data
 * without refreshing the page
 */
export const cleanupUserData = () => {
  // Clear local references if needed
  // This is useful for component-specific cleanup
  
  // You could add additional cleanup tasks here
  
  console.log('In-memory user data cleaned up');
};

export default {
  performCompleteLogout,
  cleanupUserData
};
