/**
 * Centralized API Configuration for SINDH Platform
 * 
 * This file provides consistent API URL handling across the entire application.
 * It automatically detects the environment and provides the appropriate backend URL.
 * 
 * Features:
 * - Environment-aware URL selection (development vs production)
 * - Mobile app support (Capacitor/Cordova detection)
 * - Enhanced error handling and logging
 * - Connection status monitoring
 * - Request/response interceptors for debugging
 * 
 * Usage:
 * import { getApiUrl } from '../utils/apiUtils.js';
 * const response = await fetch(`${getApiUrl()}/endpoint`);
 */

import axios from 'axios';

// Enhanced API URL configuration
const getApiUrl = () => {
  // Check if we're in a mobile app environment (Capacitor)
  const isMobileApp = window.Capacitor || window.cordova;
  
  // Always use localhost for development and testing
  // Comment out the production check to force localhost usage
  // if (process.env.NODE_ENV === 'production') {
  //   return 'https://sindh-backend.onrender.com/api';
  // }
  
  // For local development (including mobile app development), use localhost
  return 'http://localhost:10000/api';
};

const API_URL = getApiUrl();

console.log('🌐 API Configuration:', {
  environment: process.env.NODE_ENV,
  apiUrl: API_URL,
  mode: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT',
  host: window.location.host,
  isMobileApp: !!(window.Capacitor || window.cordova),
  userAgent: navigator.userAgent,
  platform: window.Capacitor?.getPlatform?.() || 'web'
});

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for mobile networks
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add connection status check
const checkConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('🟢 Backend connected successfully:', {
      url: API_URL,
      status: response.data.status,
      services: response.data.services,
      environment: response.data.environment
    });
    return true;
  } catch (error) {
    console.error('🔴 Backend connection failed:', {
      url: API_URL,
      error: error.message,
      suggestion: process.env.NODE_ENV === 'production' 
        ? 'Check if backend is deployed on Render'
        : 'Make sure backend server is running on http://localhost:10000'
    });
    return false;
  }
};

// Check connection on init
checkConnection();

// Add request logging for debugging
api.interceptors.request.use(request => {
  console.log('📤 Making request to:', {
    url: `${request.baseURL}${request.url}`,
    method: request.method?.toUpperCase(),
    environment: process.env.NODE_ENV,
    origin: window.location.origin,
    isMobileApp: !!(window.Capacitor || window.cordova)
  });
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('📥 Response Received:', {
      url: response.config.url,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      isNetworkError: !error.response
    });
    return Promise.reject(error);
  }
);

// Export the axios instance as a named export and API_URL as default
export { api };
export default API_URL;
