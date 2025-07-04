// Get the base API URL based on environment
export const getApiBaseUrl = () => {
  // In production (deployed), use your deployed backend
  if (process.env.NODE_ENV === 'production') {
    return 'https://sindh-backend.onrender.com';
  }
  
  // In development, use localhost
  return 'http://localhost:5000';
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  // Use environment variable for API base URL, fallback to production URL
  const baseUrl = process.env.REACT_APP_API_URL || 'https://sindh-backend.onrender.com';
  
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${cleanEndpoint}`;
};

// Alternative: Use environment variable (recommended)
export const getApiUrlFromEnv = (endpoint) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};
