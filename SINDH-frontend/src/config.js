// Dynamic backend detection utility
const detectBackend = async () => {
  // Check if we're in production environment
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REACT_APP_ENVIRONMENT === 'production' ||
                      window.location.hostname !== 'localhost';
  
  // Check if we're in a mobile app environment (can't access localhost)
  const isMobileApp = window.Capacitor || window.cordova;
  
  // For production or mobile apps, use Render backend
  if (isProduction || isMobileApp) {
    console.log('🚀 Using production backend: https://sindh-backend.onrender.com');
    return 'https://sindh-backend.onrender.com';
  }
  
  // Try to connect to local backend first in development
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('http://localhost:10000/api/health', {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('🔗 Using local backend: http://localhost:10000');
      return 'http://localhost:10000';
    }
  } catch (error) {
    console.log('🌐 Local backend not available, using production backend');
  }
  
  // Fallback to production backend
  console.log('⚠️ Falling back to production backend: https://sindh-backend.onrender.com');
  return 'https://sindh-backend.onrender.com';
};

// Configuration for different environments with dynamic detection
const config = {
  development: {
    API_BASE_URL: "http://localhost:10000", // Default fallback for development
  },
  production: {
    API_BASE_URL: "https://sindh-backend.onrender.com", // Production backend
  }
};

// Determine current environment
const environment = process.env.NODE_ENV || 'development';

// Initialize with default config
let currentConfig = config[environment] || config.development;
let API_BASE_URL = currentConfig.API_BASE_URL;

// Detect and update backend URL
detectBackend().then(detectedUrl => {
  API_BASE_URL = detectedUrl;
  currentConfig.API_BASE_URL = detectedUrl;
  console.log('📡 Backend detection complete:', {
    detectedUrl,
    environment,
    hostname: window.location.hostname,
    isProduction: environment === 'production'
  });
}).catch(error => {
  console.warn('⚠️ Backend detection failed:', error.message);
  // Keep the default API_BASE_URL
});

// Export dynamic API_BASE_URL getter and config
export const getApiBaseUrl = () => API_BASE_URL;
export { API_BASE_URL };
export default currentConfig;
