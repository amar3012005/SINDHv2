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

    // Auto-retry configuration
    // Only retry GET requests by default (idempotent)
    const isIdempotent = config.method === 'get';
    
    // Retry for network errors or 5xx server errors
    const shouldRetry = config && 
      (error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500)) &&
      isIdempotent;

    if (shouldRetry) {
      // Initialize retry count if not present
      config.retryCount = config.retryCount || 0;

      if (config.retryCount < MAX_RETRIES) {
        config.retryCount += 1;

        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, config.retryCount - 1) * RETRY_DELAY;
        const backoff = new Promise(resolve => {
          setTimeout(resolve, delay);
        });

        console.log(`📡 [Network] Retrying ${config.url}... Attempt ${config.retryCount}/${MAX_RETRIES} (Delay: ${delay}ms)`);
        await backoff;
        return api(config);
      }
    }

    // Handle specific auth errors
    if (error.response && error.response.status === 401) {
      console.warn('🔑 [Auth] Session expired or unauthorized');
      window.dispatchEvent(new Event('auth:expired'));
    }

    // Global error logging for production monitoring
    if (!error.response) {
      console.error('🌐 [Network] No response received. Check internet connection.');
    } else if (error.response.status >= 500) {
      console.error(`⚙️ [Server] Error ${error.response.status}: ${error.response.data?.message || 'Unknown server error'}`);
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
