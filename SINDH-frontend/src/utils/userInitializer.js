// This file contains helper functions to ensure consistent user state

/**
 * Initialize user state on app load
 * @returns {Object|null} The initialized user object or null
 */
export const initializeUserState = () => {
  try {
    const userStr = localStorage.getItem('user');
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
