import { API_BASE_URL } from '../config';

/**
 * Creates a full API URL by combining the base URL with the endpoint
 * @param {string} endpoint - API endpoint (should start with '/')
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint) => {
  // Make sure endpoint starts with '/'
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${formattedEndpoint}`;
};

/**
 * Makes an API request with appropriate headers and error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = getApiUrl(endpoint);
    
    // Set default headers if not provided
    if (!options.headers) {
      options.headers = {
        'Content-Type': 'application/json',
      };
    }
    
    const response = await fetch(url, options);
    
    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText
      }));
      throw new Error(errorData.message || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Common API methods
export const get = (endpoint) => apiRequest(endpoint);

export const post = (endpoint, data) => apiRequest(endpoint, {
  method: 'POST',
  body: JSON.stringify(data)
});

export const put = (endpoint, data) => apiRequest(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const patch = (endpoint, data) => apiRequest(endpoint, {
  method: 'PATCH',
  body: JSON.stringify(data)
});

export const del = (endpoint) => apiRequest(endpoint, {
  method: 'DELETE'
});

export default {
  getApiUrl,
  apiRequest,
  get,
  post,
  put,
  patch,
  del
};
