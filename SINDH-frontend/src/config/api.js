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
    return 'http://localhost:10000/api';
  }
  
  // Use cached result if recent
  const now = Date.now();
  if (cachedApiUrl && (now - lastCheckTime) < CHECK_INTERVAL) {
    return cachedApiUrl;
  }
  
  // Try to detect local backend - check multiple ports
  const possibleUrls = [
    'http://localhost:10000/api',  // Primary backend port
    'http://localhost:3001/api',   // Alternative frontend port
    'http://localhost:3000/api'    // Common React dev port
  ];
  
  // Try each URL to find working backend
  for (const testUrl of possibleUrls) {
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
        console.log(`✅ Backend found at: ${testUrl}`);
        cachedApiUrl = testUrl;
        lastCheckTime = now;
        return testUrl;
      }
    } catch (error) {
      console.log(`❌ Backend not available at: ${testUrl}`);
      continue;
    }
  }
  
  // If no local backend found, use default
  const fallbackUrl = 'http://localhost:10000/api';
  console.log(`⚠️ No backend detected, using fallback: ${fallbackUrl}`);
  cachedApiUrl = fallbackUrl;
  lastCheckTime = now;
  return fallbackUrl;
};

// Synchronous version for immediate use with detection
const getApiUrlSync = () => {
  // If API_URL is still default, try detection once more
  if (API_URL === 'http://localhost:10000/api' && !isDetecting) {
    detectBackendSync();
  }
  return API_URL;
};

// Initialize API URL with immediate detection
let API_URL = 'http://localhost:10000/api'; // Default fallback
let isDetecting = false;

// Synchronous backend detection with immediate update
const detectBackendSync = () => {
  if (isDetecting) return API_URL;
  
  // Check if we're in a mobile app environment (can't access localhost)
  const isMobileApp = window.Capacitor || window.cordova;
  if (isMobileApp) {
    API_URL = 'http://localhost:10000/api';
    return API_URL;
  }
  
  isDetecting = true;
  
  // Try to detect local backend immediately - check multiple ports
  const possibleUrls = [
    'http://localhost:10000/api',  // Primary backend port
    'http://localhost:3001/api',   // Alternative frontend port
    'http://localhost:3000/api'    // Common React dev port
  ];
  
  // Try each URL synchronously
  let backendFound = false;
  for (const testUrl of possibleUrls) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${testUrl}/health`, false); // false = synchronous
      xhr.timeout = 1000; // 1 second timeout
      xhr.send();
      
      if (xhr.status === 200) {
        API_URL = testUrl;
        console.log('✅ Backend detected at:', testUrl);
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
  
  // If no backend found, use default
  if (!backendFound) {
    API_URL = 'http://localhost:10000/api';
    console.log('⚠️ No backend detected, using default:', API_URL);
    cachedApiUrl = API_URL;
    lastCheckTime = Date.now();
  }
  
  isDetecting = false;
  return API_URL;
};

// Detect backend immediately on load
detectBackendSync();

// Re-check periodically with async method
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

// Export the axios instance, API URL functions, and API_URL as default
export { api, getApiUrl, getApiUrlSync };
export default API_URL;
