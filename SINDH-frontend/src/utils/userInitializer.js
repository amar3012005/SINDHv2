// This file contains helper functions to ensure consistent user state

/**
 * Initialize user state on app load
 * @returns {Object|null} The initialized user object or null
 */
import { auth } from '../config/firebase';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

/**
 * Initialize user state on app load
 * Also ensures Firebase Web SDK is authenticated using a stored custom token
 * @returns {Promise<Object|null>} The initialized user object or null
 */
export const initializeUserState = async () => {
  try {
    const userStr = localStorage.getItem('user');
    const customToken = localStorage.getItem('firebaseCustomToken');

    // Early return if no user
    if (!userStr) {
      return null;
    }

    const user = JSON.parse(userStr);
    if (!user) {
      return null;
    }

    // Ensure we have an id field
    if (!user.id && user._id) {
      user.id = user._id;
      localStorage.setItem('user', JSON.stringify(user));
    }

    // If already signed in, skip re-auth
    const current = auth.currentUser;
    if (!current && customToken) {
      try {
        console.log('🔐 Re-authenticating Web SDK with stored custom token...');
        await signInWithCustomToken(auth, customToken);
        console.log('✅ Web SDK re-authenticated');
      } catch (err) {
        console.warn('⚠️ Failed to re-authenticate Web SDK with stored token:', err.message);
      }
    }

    return user;
  } catch (error) {
    console.error('Error initializing user state:', error);
    return null;
  }
};

/**
 * Get user type from localStorage
 * @returns {string|null} The user type or null
 */
export const getEffectiveUserType = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.type) {
        return user.type;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
};

/**
 * Clear all user related data from localStorage
 */
export const clearUserState = () => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Add any other user-related items that need to be cleared
  } catch (error) {
    console.error('Error clearing user state:', error);
  }
};
