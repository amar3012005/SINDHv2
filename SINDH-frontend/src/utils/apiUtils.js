import axios from 'axios';

// Production API URL - Hardcoded for stability
const API_URL = 'https://sindh-backend.onrender.com/api';

// Create axios instance with robust configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Request interceptor for token injection
api.interceptors.request.use(
  (config) => {
    // Check for token in localStorage (standard JWT) or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for retries and global error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Auto-retry for network errors or 5xx server errors
    if (config && (error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500))) {
      // Initialize retry count if not present
      if (!config.retryCount) {
        config.retryCount = 0;
      }

      if (config.retryCount < MAX_RETRIES) {
        config.retryCount += 1;

        // Exponential backoff
        const backoff = new Promise(resolve => {
          setTimeout(resolve, RETRY_DELAY * config.retryCount);
        });

        console.log(`📡 Retrying request... Attempt ${config.retryCount}/${MAX_RETRIES}`);
        await backoff;
        return api(config);
      }
    }

    // Handle specific auth errors
    if (error.response && error.response.status === 401) {
      // Dispatch event for auth expiration handling if needed
      window.dispatchEvent(new Event('auth:expired'));
    }

    return Promise.reject(error);
  }
);

// Helper functions for backward compatibility with existing code
export const getApiUrl = () => API_URL;

export const buildApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

export default api;
