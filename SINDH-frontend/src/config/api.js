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
 * import { getApiUrl } from '../config/api.js';
 * const response = await fetch(`${getApiUrl()}/endpoint`);
 */

import axios from 'axios';

// Production backend URL (Render deployment)
const PRODUCTION_API_URL = 'https://sindh-backend.onrender.com/api';

// Development backend URLs to try
const DEVELOPMENT_API_URLS = [
  'http://localhost:10000/api',  // Primary backend port
  'http://localhost:3001/api',   // Alternative backend port
  'http://localhost:8000/api'    // Alternative backend port
];

// Enhanced API URL configuration with environment detection
let cachedApiUrl = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

const getApiUrl = async () => {
  // Check if we're in production environment
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REACT_APP_ENVIRONMENT === 'production' ||
                      window.location.hostname !== 'localhost';
  
  // Check if we're in a mobile app environment (Capacitor)
  const isMobileApp = window.Capacitor || window.cordova;
  
  // For production or mobile apps, always use Render backend
  if (isProduction || isMobileApp) {
    console.log(`🚀 Using production backend: ${PRODUCTION_API_URL}`);
    return PRODUCTION_API_URL;
  }
  
  // Use cached result if recent (for development)
  const now = Date.now();
  if (cachedApiUrl && (now - lastCheckTime) < CHECK_INTERVAL) {
    return cachedApiUrl;
  }
  
  // Try to detect local backend in development
  for (const testUrl of DEVELOPMENT_API_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      
      const response = await fetch(`${testUrl}/health`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Local backend found at: ${testUrl}`);
        cachedApiUrl = testUrl;
        lastCheckTime = now;
        return testUrl;
      }
    } catch (error) {
      console.log(`❌ Backend not available at: ${testUrl}`);
      continue;
    }
  }
  
  // If no local backend found in development, fallback to production
  console.log(`⚠️ No local backend detected, using production: ${PRODUCTION_API_URL}`);
  cachedApiUrl = PRODUCTION_API_URL;
  lastCheckTime = now;
  return PRODUCTION_API_URL;
};

// Synchronous version for immediate use
const getApiUrlSync = () => {
  // Check environment
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REACT_APP_ENVIRONMENT === 'production' ||
                      window.location.hostname !== 'localhost';
                      
  const isMobileApp = window.Capacitor || window.cordova;
  
  // For production or mobile apps, use Render backend
  if (isProduction || isMobileApp) {
    return PRODUCTION_API_URL;
  }
  
  // For development, try to detect local backend
  if (!isDetecting) {
    detectBackendSync();
  }
  return API_URL;
};

// Initialize API URL with environment detection
let API_URL = process.env.REACT_APP_API_URL || PRODUCTION_API_URL;
let isDetecting = false;

// Synchronous backend detection for development
const detectBackendSync = () => {
  if (isDetecting) return API_URL;
  
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REACT_APP_ENVIRONMENT === 'production' ||
                      window.location.hostname !== 'localhost';
                      
  const isMobileApp = window.Capacitor || window.cordova;
  
  // Use production backend for production/mobile
  if (isProduction || isMobileApp) {
    API_URL = PRODUCTION_API_URL;
    return API_URL;
  }
  
  isDetecting = true;
  
  // Try to detect local backend in development
  let backendFound = false;
  for (const testUrl of DEVELOPMENT_API_URLS) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${testUrl}/health`, false); // false = synchronous
      xhr.timeout = 1000; // 1 second timeout
      xhr.send();
      
      if (xhr.status === 200) {
        API_URL = testUrl;
        console.log('✅ Local backend detected at:', testUrl);
        cachedApiUrl = testUrl;
        lastCheckTime = Date.now();
        backendFound = true;
        break;
      }
    } catch (error) {
      console.log(`❌ Backend not available at: ${testUrl}`);
      continue;
    }
  }
  
  // If no local backend found, use production
  if (!backendFound) {
    API_URL = PRODUCTION_API_URL;
    console.log('⚠️ No local backend detected, using production:', API_URL);
    cachedApiUrl = API_URL;
    lastCheckTime = Date.now();
  }
  
  isDetecting = false;
  return API_URL;
};

// Detect backend immediately on load
detectBackendSync();

console.log('🌐 API Configuration:', {
  environment: process.env.NODE_ENV,
  reactAppEnv: process.env.REACT_APP_ENVIRONMENT,
  hostname: window.location.hostname,
  apiUrl: API_URL,
  mode: API_URL.includes('onrender.com') ? 'PRODUCTION (Render)' : 'DEVELOPMENT (Local)',
  isMobileApp: !!(window.Capacitor || window.cordova),
  userAgent: navigator.userAgent.substring(0, 50) + '...'
});

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for production networks
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
      status: response.data.status || 'OK',
      environment: API_URL.includes('onrender.com') ? 'Production' : 'Development'
    });
    return true;
  } catch (error) {
    console.error('🔴 Backend connection failed:', {
      url: API_URL,
      error: error.message,
      suggestion: API_URL.includes('onrender.com')
        ? 'Check if Render backend is running at https://sindh-backend.onrender.com'
        : 'Make sure backend server is running locally'
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
    environment: API_URL.includes('onrender.com') ? 'Production' : 'Development',
    origin: window.location.origin
  });
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('📥 Response received:', {
      url: response.config.url,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  error => {
    console.error('🚨 API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      isNetworkError: !error.response,
      backend: API_URL.includes('onrender.com') ? 'Render Production' : 'Local Development'
    });
    return Promise.reject(error);
  }
);

// Export the axios instance, API URL functions, and API_URL as default
export { api, getApiUrl, getApiUrlSync };
export default API_URL;
