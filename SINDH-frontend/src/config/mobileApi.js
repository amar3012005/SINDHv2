/**
 * Mobile-specific API Configuration for Android Emulator
 * 
 * This file handles the special networking requirements for Android emulators
 * and provides proper URL resolution for mobile apps.
 */

import axios from 'axios';

// Enhanced API URL configuration for mobile
const getMobileApiUrl = () => {
  // Check if we're in a mobile app environment
  const isMobileApp = window.Capacitor || window.cordova;
  
  if (!isMobileApp) {
    // Not in mobile app, use regular API config
    return null;
  }
  
  // For mobile app, try multiple ports to find available backend
  const possibleUrls = [
    'http://localhost:10000/api',  // Primary backend port
    'http://localhost:3001/api',   // Alternative frontend port
    'http://localhost:3000/api'    // Common React dev port
  ];
  
  // Try to detect which backend is available (synchronous for mobile)
  for (const testUrl of possibleUrls) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${testUrl}/health`, false); // synchronous
      xhr.timeout = 1000;
      xhr.send();
      
      if (xhr.status === 200) {
        console.log(`📱 Mobile backend found at: ${testUrl}`);
        return testUrl;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Fallback to default
  console.log('📱 Using default mobile backend port');
  return 'http://localhost:10000/api';
};

const MOBILE_API_URL = getMobileApiUrl();

// Create mobile-specific axios instance
const mobileApi = axios.create({
  baseURL: MOBILE_API_URL,
  timeout: 20000, // Longer timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'SINDH-Mobile-App'
  }
});

// Enhanced connection testing for mobile
const testMobileConnection = async () => {
  if (!MOBILE_API_URL) {
    console.log('📱 Not in mobile environment, skipping mobile API test');
    return false;
  }
  
  try {
    const response = await mobileApi.get('/health');
    console.log('📱 Mobile backend connected successfully:', {
      url: MOBILE_API_URL,
      status: response.data.status,
      environment: response.data.environment,
      userAgent: navigator.userAgent
    });
    return true;
  } catch (error) {
    console.error('📱 Mobile backend connection failed:', {
      url: MOBILE_API_URL,
      error: error.message,
      code: error.code,
      isNetworkError: !error.response,
      suggestion: 'Check internet connection and backend availability'
    });
    return false;
  }
};

// Mobile-specific request logging
mobileApi.interceptors.request.use(request => {
  console.log('📱 Mobile request:', {
    url: `${request.baseURL}${request.url}`,
    method: request.method?.toUpperCase(),
    userAgent: navigator.userAgent,
    isMobile: !!(window.Capacitor || window.cordova)
  });
  return request;
});

mobileApi.interceptors.response.use(
  response => {
    console.log('📱 Mobile response:', {
      url: response.config.url,
      status: response.status,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  error => {
    console.error('📱 Mobile API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      isNetworkError: !error.response,
      code: error.code
    });
    return Promise.reject(error);
  }
);

// Test connection on init
testMobileConnection();

export { mobileApi, testMobileConnection };
export default MOBILE_API_URL; 