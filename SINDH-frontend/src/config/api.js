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
import { getDeviceId, getAppInfo } from '../utils/device';

// Debug flag - only log in development to prevent information leakage
const debug = process.env.NODE_ENV !== 'production';

// Production backend URL (Render deployment)
const PRODUCTION_API_URL = process.env.REACT_APP_API_URL || 'https://sindh-backend.onrender.com/api';

// Development backend URLs to try (reduced list for better performance)
const DEVELOPMENT_API_URLS = [
  'http://localhost:10000/api'  // Primary backend port only
];

// Helper function for strict mobile detection
const isMobileEnvironment = () => {
  // Prefer Capacitor's native platform check if available
  if (window.Capacitor?.isNativePlatform) {
    return window.Capacitor.isNativePlatform();
  }
  // Fall back to checking for Capacitor or Cordova objects
  return !!(window.Capacitor || window.cordova);
};

// Enhanced API URL configuration with environment detection
let cachedApiUrl = null;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

const getApiUrl = async () => {
  // Check if we're in production environment - primarily rely on environment variables
  const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.REACT_APP_ENVIRONMENT === 'production';

  // PRIORITY 1: If FORCE_LOCAL_BACKEND is enabled, ALWAYS use local URL
  // This works even before Capacitor is initialized
  if (process.env.REACT_APP_FORCE_LOCAL_BACKEND === 'true') {
    const localBackendUrl = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://10.0.2.2:10000/api';
    if (debug) console.log(`📱 FORCE_LOCAL_BACKEND enabled - using: ${localBackendUrl}`);
    return localBackendUrl;
  }

  // Use strict mobile detection
  const isMobileApp = isMobileEnvironment();

  // For production mobile apps (without local override), use Render backend
  if (isProduction) {
    if (debug) console.log(`🚀 Using production backend: ${PRODUCTION_API_URL}`);
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
      const timeoutId = setTimeout(() => controller.abort(), 800); // Reduced timeout

      const response = await fetch(`${testUrl}/health`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        if (debug) console.log(`✅ Local backend found at: ${testUrl}`);
        cachedApiUrl = testUrl;
        lastCheckTime = now;
        return testUrl;
      }
    } catch (error) {
      if (debug) console.log(`❌ Backend not available at: ${testUrl}`);
      continue;
    }
  }

  // If no local backend found in development, fallback to production
  if (debug) console.log(`⚠️ No local backend detected, using production: ${PRODUCTION_API_URL}`);
  cachedApiUrl = PRODUCTION_API_URL;
  lastCheckTime = now;
  return PRODUCTION_API_URL;
};

// Synchronous version for immediate use
const getApiUrlSync = () => {
  // PRIORITY 1: If FORCE_LOCAL_BACKEND is enabled, use local URL
  // BUT: If we are in a browser on localhost, override this to use localhost to avoid CORS issues
  if (process.env.REACT_APP_FORCE_LOCAL_BACKEND === 'true') {
    // Check if we are in a browser environment on localhost
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      const localhostUrl = 'http://localhost:10000/api';
      if (debug) console.log(`💻 Browser on localhost detected - overriding FORCE_LOCAL_BACKEND to: ${localhostUrl}`);
      return localhostUrl;
    }

    const localBackendUrl = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://10.0.2.2:10000/api';
    if (debug) console.log(`📱 FORCE_LOCAL_BACKEND (sync) - using: ${localBackendUrl}`);
    return localBackendUrl;
  }

  // Check environment - primarily rely on environment variables
  const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.REACT_APP_ENVIRONMENT === 'production';

  // For production, use Render backend
  if (isProduction) {
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

// Non-blocking backend detection for development
const detectBackendSync = () => {
  if (isDetecting) return API_URL;

  // PRIORITY 1: If FORCE_LOCAL_BACKEND is enabled, use local URL
  // BUT: If we are in a browser on localhost, override this to use localhost to avoid CORS issues
  if (process.env.REACT_APP_FORCE_LOCAL_BACKEND === 'true') {
    // Check if we are in a browser environment on localhost
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      const localhostUrl = 'http://localhost:10000/api';
      API_URL = localhostUrl;
      if (debug) console.log(`💻 Browser on localhost detected - overriding FORCE_LOCAL_BACKEND to: ${localhostUrl}`);
      return API_URL;
    }

    const localBackendUrl = process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://10.0.2.2:10000/api';
    API_URL = localBackendUrl;
    if (debug) console.log(`📱 FORCE_LOCAL_BACKEND (detect) - using: ${localBackendUrl}`);
    return API_URL;
  }

  // Check environment - primarily rely on environment variables
  const isProduction = process.env.NODE_ENV === 'production' ||
    process.env.REACT_APP_ENVIRONMENT === 'production';

  // For development on localhost, use local backend
  if (!isProduction && window.location.hostname === 'localhost') {
    API_URL = 'http://localhost:10000/api';
    if (debug) console.log('💻 Web Localhost detected: Forcing local API URL:', API_URL);
    return API_URL;
  }

  // Use production backend for production
  if (isProduction) {
    API_URL = PRODUCTION_API_URL;
    return API_URL;
  }

  isDetecting = true;

  // Return default immediately, then update async
  API_URL = PRODUCTION_API_URL; // Sensible default

  // Trigger async detection without blocking
  (async () => {
    for (const testUrl of DEVELOPMENT_API_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500); // Reduced timeout

        const response = await fetch(`${testUrl}/health`, {
          signal: controller.signal,
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          API_URL = testUrl;
          if (debug) console.log('✅ Local backend detected at:', testUrl);
          cachedApiUrl = testUrl;
          lastCheckTime = Date.now();
          isDetecting = false;
          return;
        }
      } catch (error) {
        if (debug) console.log(`❌ Backend not available at: ${testUrl}`);
        continue;
      }
    }

    // If no local backend found, keep production URL
    if (debug) console.log('⚠️ No local backend detected, using production:', API_URL);
    cachedApiUrl = API_URL;
    isDetecting = false;
  })();

  return API_URL;
};

// Detect backend immediately on load
detectBackendSync();

if (debug && typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  console.log('🌐 API Configuration:', {
    environment: process.env.NODE_ENV,
    reactAppEnv: process.env.REACT_APP_ENVIRONMENT,
    hostname: window.location.hostname,
    apiUrl: API_URL,
    mode: API_URL.includes('onrender.com') ? 'PRODUCTION (Render)' : 'DEVELOPMENT (Local)',
    isMobileApp: !!(window.Capacitor || window.cordova),
    userAgent: navigator.userAgent.substring(0, 50) + '...'
  });
}

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
    if (debug) {
      console.log('🟢 Backend connected successfully:', {
        url: API_URL,
        status: response.data.status || 'OK',
        environment: API_URL.includes('onrender.com') ? 'Production' : 'Development'
      });
    }
    return true;
  } catch (error) {
    if (debug) {
      console.error('🔴 Backend connection failed:', {
        url: API_URL,
        error: error.message,
        suggestion: API_URL.includes('onrender.com')
          ? 'Check if Render backend is running at https://sindh-backend.onrender.com'
          : 'Make sure backend server is running locally'
      });
    }
    return false;
  }
};

// Check connection on init
checkConnection();

// Add request logging for debugging
api.interceptors.request.use(async request => {
  // Update baseURL to reflect latest API_URL changes from async detection or mobile dev override
  request.baseURL = API_URL;

  // Add Device Headers
  try {
    const deviceId = await getDeviceId();
    if (deviceId) {
      request.headers['X-Device-Id'] = deviceId;
    }

    const appInfo = await getAppInfo();
    if (appInfo) {
      request.headers['X-App-Version'] = appInfo.version;
      request.headers['X-App-Build'] = appInfo.build;
    }

    // Add Platform header if not already present (axios usually adds User-Agent, but explicit Platform helps)
    if (window.Capacitor) {
      request.headers['X-Platform'] = window.Capacitor.getPlatform();
    }
  } catch (error) {
    // Fail silently, don't block the request if device info fails
    if (debug) console.warn('Failed to attach device headers:', error);
  }

  if (debug) {
    console.log('📤 Making request to:', {
      url: `${request.baseURL}${request.url}`,
      method: request.method?.toUpperCase(),
      environment: API_URL.includes('onrender.com') ? 'Production' : 'Development',
      origin: window.location.origin
    });
  }
  return request;
});

api.interceptors.response.use(
  response => {
    if (debug) {
      console.log('📥 Response received:', {
        url: response.config.url,
        status: response.status,
        timestamp: new Date().toISOString()
      });
    }
    return response;
  },
  error => {
    if (debug) {
      console.error('🚨 API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        isNetworkError: !error.response,
        backend: API_URL.includes('onrender.com') ? 'Render Production' : 'Local Development'
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Test mobile detection and environment configuration
 * Useful for debugging and verification in Android Studio
 * 
 * @returns {Object} Test results with all detection values
 */
export const testMobileDetection = () => {
  // Use the strict mobile detection function
  const strictMobileCheck = isMobileEnvironment();

  const results = {
    environment: process.env.NODE_ENV,
    reactAppEnv: process.env.REACT_APP_ENVIRONMENT,
    forceLocalBackend: process.env.REACT_APP_FORCE_LOCAL_BACKEND,
    localBackendUrl: process.env.REACT_APP_LOCAL_BACKEND_URL,
    hasCapacitor: !!window.Capacitor,
    hasCapacitorIsNativePlatform: !!window.Capacitor?.isNativePlatform,
    capacitorIsNativePlatform: window.Capacitor?.isNativePlatform?.(),
    hasCordova: !!window.cordova,
    isMobileApp: strictMobileCheck,
    detectionMethod: window.Capacitor?.isNativePlatform ? 'Capacitor.isNativePlatform()' : 'window.Capacitor || window.cordova',
    platform: window.Capacitor?.getPlatform?.(),
    selectedApiUrl: API_URL,
    isProduction: API_URL.includes('onrender.com'),
    isLocalDevelopment: API_URL.includes('10.0.2.2') || API_URL.includes('localhost'),
    userAgent: navigator.userAgent,
    windowLocation: window.location.href,
    timestamp: new Date().toISOString()
  };

  console.log('🧪 Mobile Detection Test Results:', results);
  console.table(results);

  // Provide helpful feedback
  if (results.isMobileApp && results.forceLocalBackend === 'true') {
    console.log('✅ Mobile app in development mode - using local backend');
    console.log(`📱 Backend URL: ${results.selectedApiUrl}`);
  } else if (results.isMobileApp && !results.isProduction) {
    console.warn('⚠️  Mobile app detected but not using production backend!');
  } else if (results.isMobileApp && results.isProduction) {
    console.log('✅ Mobile app correctly configured with production backend');
    console.log(`✅ Detection method: ${results.detectionMethod}`);
  } else if (!results.isMobileApp && results.isProduction) {
    console.log('🌐 Web app using production backend');
  } else {
    console.log('💻 Web app using local development backend');
  }

  return results;
};

// Make testMobileDetection available globally for Chrome DevTools debugging
if (typeof window !== 'undefined') {
  window.testMobileDetection = testMobileDetection;
}

// Export the axios instance, API URL functions, and API_URL as default
export { api, getApiUrl, getApiUrlSync };
export default API_URL;
