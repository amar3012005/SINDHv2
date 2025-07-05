// Get the base API URL based on environment
export const getApiBaseUrl = () => {
  // In production (deployed), use your deployed backend
  if (process.env.NODE_ENV === 'production') {
    return 'https://sindh-backend.onrender.com';
  }
  
  // In development, use localhost with correct port
  return 'http://localhost:10000';
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  let baseUrl;
  
  if (process.env.NODE_ENV === 'production') {
    // Production: Use deployed backend (accessible from any device)
    baseUrl = process.env.REACT_APP_API_URL || 'https://sindh-backend.onrender.com';
  } else {
    // Development: Use local backend on port 10000
    baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:10000';
  }
  
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const fullUrl = `${baseUrl}${cleanEndpoint}`;
  
  // Log API calls in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 API Call:', fullUrl);
  }
  
  return fullUrl;
};

// Alternative: Use environment variable (recommended)
export const getApiUrlFromEnv = (endpoint) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:10000';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};
