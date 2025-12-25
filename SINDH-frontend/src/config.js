// Dynamic backend detection utility
const detectBackend = async () => {
  // Check if we're in production environment - primarily rely on environment variables
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REACT_APP_ENVIRONMENT === 'production';
  
  // Use strict mobile detection
  const isMobileApp = window.Capacitor?.isNativePlatform?.() || 
                      !!(window.Capacitor || window.cordova);
  
  // Development mode override: Allow mobile apps to connect to local backend
  if (isMobileApp && !isProduction && process.env.REACT_APP_FORCE_LOCAL_BACKEND === 'true') {
    const localBackendUrl = (process.env.REACT_APP_LOCAL_BACKEND_URL || 'http://10.0.2.2:10000').replace('/api', '');
    console.log(`📱 Mobile dev mode: using Android emulator localhost at ${localBackendUrl}`);
    return localBackendUrl;
  }
  
  // For production mobile apps, use Render backend
  if (isProduction) {
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
