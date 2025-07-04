import axios from 'axios';

const API_URL = 'https://sindh-backend.onrender.comapi';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const registerWorker = async (workerData) => {
  try {
    console.log('Registering worker with data:', workerData);
    
    // Format the worker data for MongoDB
    const formattedData = {
      name: workerData.name,
      age: parseInt(workerData.age),
      aadharNumber: workerData.aadharNumber,
      phone: workerData.phone,
      skills: workerData.skills,
      location: {
        village: workerData.location.village,
        district: workerData.location.district,
        state: workerData.location.state
      },
      language: workerData.language,
      experience_years: parseInt(workerData.experience_years)
    };

    console.log('Formatted worker data:', formattedData);
    
    const response = await api.post('/workers/register', formattedData);
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Worker registration error:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Registration failed');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error('Error setting up the request: ' + error.message);
    }
  }
};

const workerService = {
  // Get all workers
  getAllWorkers: async () => {
    try {
      const response = await api.get('/workers');
      return response.data;
    } catch (error) {
      console.error('Error fetching workers:', error);
      throw error;
    }
  },

  // Get worker by ID
  getWorkerById: async (id) => {
    try {
      const response = await api.get(`/workers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching worker:', error);
      throw error;
    }
  },

  // Update worker
  updateWorker: async (id, workerData) => {
    try {
      const response = await api.put(`/workers/${id}`, workerData);
      return response.data;
    } catch (error) {
      console.error('Error updating worker:', error);
      throw error;
    }
  },

  // Delete worker
  deleteWorker: async (id) => {
    try {
      const response = await api.delete(`/workers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting worker:', error);
      throw error;
    }
  },

  // Get worker profile
  getProfile: async (workerId) => {
    try {
      const response = await api.get(`/workers/${workerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update worker profile
  updateProfile: async (workerId, profileData) => {
    try {
      const response = await api.put(`/workers/${workerId}`, profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login worker
  login: async (phone) => {
    try {
      const response = await api.post('/workers/login', { phone });
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Upload profile image
  uploadProfileImage: async (formData) => {
    try {
      console.log('Uploading profile image:', formData);
      const response = await api.post('/workers/upload-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error.response?.data || { message: 'Failed to upload image' };
    }
  },
};

export { workerService };
export default workerService; 