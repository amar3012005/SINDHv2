import API_URL from '../config/api.js';

// Centralized API URL utility
export const getApiUrl = () => API_URL;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${cleanEndpoint}`;
};

// Enhanced fetch wrapper with consistent error handling
export const apiFetch = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Fetch Error:', {
      url,
      error: error.message,
      endpoint
    });
    throw error;
  }
};

// Common API methods
export const apiGet = (endpoint) => apiFetch(endpoint);
export const apiPost = (endpoint, data) => apiFetch(endpoint, {
  method: 'POST',
  body: JSON.stringify(data)
});
export const apiPut = (endpoint, data) => apiFetch(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const apiDelete = (endpoint) => apiFetch(endpoint, {
  method: 'DELETE'
});

// Auth-specific helpers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Enhanced fetch with auth
export const authenticatedFetch = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  return apiFetch(endpoint, {
    ...options,
    headers
  });
};

// Connection status checker
export const checkApiConnection = async () => {
  try {
    const response = await apiGet('health');
    return {
      connected: true,
      data: response
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

// Environment detection
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isMobileApp = () => !!(window.Capacitor || window.cordova);

// Log current API configuration
console.log('🔧 API Utils initialized:', {
  apiUrl: API_URL,
  environment: process.env.NODE_ENV,
  isMobileApp: isMobileApp(),
  isProduction: isProduction()
});
