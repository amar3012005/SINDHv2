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

// Enhanced API URL configuration with dynamic backend detection
let cachedApiUrl = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

const getApiUrl = async () => {
  // Check if we're in a mobile app environment (Capacitor)
  const isMobileApp = window.Capacitor || window.cordova;
  
  // For mobile apps, always use Render backend (can't access localhost)
  if (isMobileApp) {
    return 'https://sindh-backend.onrender.com/api';
  }
  
  // Use cached result if recent
  const now = Date.now();
  if (cachedApiUrl && (now - lastCheckTime) < CHECK_INTERVAL) {
    return cachedApiUrl;
  }
  
  // Try to detect local backend
  const localUrl = 'http://localhost:10000/api';
  const renderUrl = 'https://sindh-backend.onrender.com/api';
  
  try {
    // Quick health check to local backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(`${localUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('🔗 Local backend detected - using localhost');
      cachedApiUrl = localUrl;
      lastCheckTime = now;
      return localUrl;
    }
  } catch (error) {
    // Local backend not available, use Render
    console.log('🌐 Local backend not available - using Render backend');
  }
  
  cachedApiUrl = renderUrl;
  lastCheckTime = now;
  return renderUrl;
};

// Synchronous version for immediate use (uses cached or default)
const getApiUrlSync = () => {
  const isMobileApp = window.Capacitor || window.cordova;
  
  if (isMobileApp) {
    return 'https://sindh-backend.onrender.com/api';
  }
  
  return cachedApiUrl || 'https://sindh-backend.onrender.com/api';
};

// Initialize API URL detection on startup
let API_URL = 'https://sindh-backend.onrender.com/api'; // Default fallback

// Initialize backend detection
const initializeApiUrl = async () => {
  try {
    API_URL = await getApiUrl();
    console.log('🌐 API Configuration Initialized:', {
      environment: process.env.NODE_ENV,
      apiUrl: API_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('⚠️ API URL detection failed, using default:', error.message);
  }
};

// Start detection immediately
initializeApiUrl();

// Re-check periodically
setInterval(async () => {
  try {
    const newUrl = await getApiUrl();
    if (newUrl !== API_URL) {
      API_URL = newUrl;
      console.log('🔄 API URL updated:', API_URL);
    }
  } catch (error) {
    console.warn('⚠️ Periodic API check failed:', error.message);
  }
}, CHECK_INTERVAL);

console.log('🌐 API Configuration:', {
  environment: process.env.NODE_ENV,
  initialApiUrl: API_URL,
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
        : 'Make sure backend server is running on https://sindh-backend.onrender.com'
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

// Export the axios instance, API URL functions, and API_URL as default
export { api, getApiUrl, getApiUrlSync };
export default API_URL;
