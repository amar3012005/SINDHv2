/**
 * Authentication utility functions for managing user sessions
 */

// Key for storing the current user in localStorage
const USER_KEY = 'user';
const LAST_LOGIN_KEY = 'lastLogin';

/**
 * Save user data to localStorage, ensuring only one user at a time
 * @param {Object} userData - The user data to save
 */
export const saveUserData = (userData) => {
  if (!userData) return;
  
  try {
    // Clear any existing user data first to ensure only one user at a time
    clearUserData();
    
    // Save new user data
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString());
    
    console.log(`User saved to localStorage: ${userData.name} (${userData.type})`);
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Get the current logged-in user
 * @returns {Object|null} The user data or null if not logged in
 */
export const getCurrentUser = () => {
  try {
    const userString = localStorage.getItem(USER_KEY);
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get the user type (worker or employer)
 * @returns {string|null} The user type or null if not logged in
 */
export const getUserType = () => {
  const user = getCurrentUser();
  return user?.type || null;
};

/**
 * Clear all user data from localStorage
 */
export const clearUserData = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_LOGIN_KEY);
};

/**
 * Check if a user is logged in
 * @returns {boolean} True if a user is logged in
 */
export const isLoggedIn = () => {
  return !!getCurrentUser();
};

/**
 * Login handler with phone number
 * @param {string} phoneNumber - The phone number to login with
 * @param {string} userType - The user type (worker or employer)
 * @returns {Promise<Object>} The user data
 */
export const loginWithPhone = async (phoneNumber, userType) => {
  try {
    // Validate phone number format
    if (!phoneNumber || phoneNumber.length !== 10) {
      throw new Error('Please provide a valid 10-digit phone number');
    }

    // Ensure user type is valid
    if (!['worker', 'employer'].includes(userType)) {
      throw new Error('Invalid user type');
    }

    // Determine the login endpoint based on user type
    const endpoint = userType === 'worker' ? 'workers' : 'employers';
    
    // Make the login request
    const response = await fetch(`https://sindh-backend.onrender.comapi/auth/${endpoint}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    
    // Format user data consistently regardless of user type
    const userData = {
      ...data.data,
      type: userType,
      id: data.data.id || data.data._id,
      isLoggedIn: true,
      lastLogin: new Date().toISOString()
    };

    // Save the user data
    saveUserData(userData);
    
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Handle user logout
 */
export const logout = () => {
  try {
    // Get current user for logging
    const user = getCurrentUser();
    
    if (user) {
      console.log(`Logging out user: ${user.name} (${user.type})`);
    }
    
    // Clear all user data
    clearUserData();
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

/**
 * Check if current user is a worker
 * @returns {boolean} True if the current user is a worker
 */
export const isWorker = () => {
  const userType = getUserType();
  return userType === 'worker';
};

/**
 * Check if current user is an employer
 * @returns {boolean} True if the current user is an employer
 */
export const isEmployer = () => {
  const userType = getUserType();
  return userType === 'employer';
};

/**
 * Get common request headers with authentication info
 * @returns {Object} Headers object with auth info
 */
export const getAuthHeaders = () => {
  const user = getCurrentUser();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Type': user?.type || 'guest',
    'User-ID': user?.id || ''
  };
};

/**
 * Make an authenticated API request
 * @param {string} url - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export const authFetch = async (url, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  
  return fetch(url, {
    ...options,
    headers
  });
};
