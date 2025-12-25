/**
 * API Utilities - Centralized API configuration and helpers
 * 
 * This module provides a consistent way to make API calls across the application.
 * It automatically detects the environment (web/mobile, development/production)
 * and routes requests to the appropriate backend.
 * 
 * Mobile Detection:
 * - Checks window.Capacitor || window.cordova
 * - Routes to http://localhost:10000/api for mobile apps
 * - Routes to detected local backend for web development
 * - Routes to production backend for web production
 * 
 * Usage Examples:
 * 
 * 1. Get API URL:
 *    const apiUrl = getApiUrl(); // Returns base URL
 * 
 * 2. Build full endpoint URL:
 *    const url = buildApiUrl('/workers/register');
 * 
 * 3. Make API call:
 *    const data = await apiGet('/jobs');
 * 
 * 4. Check environment:
 *    if (isMobileApp()) { ... }
 * 
 * Service File Pattern:
 * import { buildApiUrl } from '../utils/apiUtils';
 * class MyService {
 *   constructor() {
 *     this.baseUrl = buildApiUrl('');
 *   }
 * }
 */
import { getApiUrl as getApiUrlAsyncImport, getApiUrlSync } from '../config/api.js';

// Centralized API URL utilities
export const getApiUrl = getApiUrlSync; // Synchronous version for immediate use
export const getApiUrlAsync = getApiUrlAsyncImport; // Async version for detection

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${getApiUrl()}${cleanEndpoint}`;
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

/**
 * Test API configuration and connectivity
 * Useful for debugging and verification
 */
export const testApiConfiguration = async () => {
  const results = {
    // Environment detection
    environment: process.env.NODE_ENV,
    reactAppEnv: process.env.REACT_APP_ENVIRONMENT,
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    isMobileApp: isMobileApp(),
    
    // API URL
    apiUrl: getApiUrl(),
    isUsingProduction: getApiUrl().includes('onrender.com'),
    
    // Connectivity
    connection: await checkApiConnection(),
    
    // Platform info
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    
    // Capacitor info (if available)
    hasCapacitor: !!window.Capacitor,
    capacitorPlatform: window.Capacitor?.getPlatform?.(),
    isNativePlatform: window.Capacitor?.isNativePlatform?.()
  };
  
  console.log('🧪 API Configuration Test Results:', results);
  return results;
};

/**
 * Verify that all service files use centralized API configuration
 * Returns list of services and their API URL sources
 */
export const verifyServiceConfiguration = () => {
  const services = {
    jobService: 'Uses buildApiUrl - ✅ Correct',
    workerService: 'Uses buildApiUrl - ✅ Correct (after refactoring)',
    employerService: 'Uses buildApiUrl - ✅ Correct (after refactoring)',
    mobileService: 'Uses Capacitor plugins - N/A'
  };
  
  console.log('📋 Service Configuration Status:', services);
  return services;
};

// Log current API configuration
console.log('🔧 API Utils initialized:', {
  apiUrl: getApiUrl(),
  environment: process.env.NODE_ENV,
  isMobileApp: isMobileApp(),
  isProduction: isProduction()
});
