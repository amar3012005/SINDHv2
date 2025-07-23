// Dynamic backend detection utility
const detectBackend = async () => {
  // Check if we're in a mobile app environment (can't access localhost)
  const isMobileApp = window.Capacitor || window.cordova;
  
  if (isMobileApp) {
    return 'http://localhost:10000';
  }
  
  // Try to connect to local backend first
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
    console.log('🌐 Local backend not available, using Render backend');
  }
  
  return 'http://localhost:10000';
};

// Configuration for different environments with dynamic detection
const config = {
  development: {
    API_BASE_URL: "http://localhost:10000", // Default fallback
  },
  production: {
    API_BASE_URL: "http://localhost:10000",
  }
};

// Determine current environment
const environment = process.env.NODE_ENV || 'development';

// Initialize with default config
let currentConfig = config[environment] || config.development;
let API_BASE_URL = currentConfig.API_BASE_URL;

// Detect and update backend URL for development
if (environment === 'development') {
  detectBackend().then(detectedUrl => {
    API_BASE_URL = detectedUrl;
    currentConfig.API_BASE_URL = detectedUrl;
    console.log('📡 Backend detection complete:', detectedUrl);
  }).catch(error => {
    console.warn('⚠️ Backend detection failed:', error.message);
  });
}

// Export dynamic API_BASE_URL getter and config
export const getApiBaseUrl = () => API_BASE_URL;
export { API_BASE_URL };
export default currentConfig;
