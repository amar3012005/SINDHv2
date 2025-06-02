import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

export const employerService = {
  // Register new employer
  register: async (employerData) => {
    try {
      console.log('Registering employer with data:', employerData);
      
      // Format the employer data for MongoDB
      const formattedData = {
        name: employerData.name,
        phone: employerData.phone,
        email: employerData.email,
        company: {
          name: employerData.company.name,
          type: employerData.company.type,
          industry: employerData.company.industry
        },
        location: {
          village: employerData.location.village,
          district: employerData.location.district,
          state: employerData.location.state,
          pincode: employerData.location.pincode,
          coordinates: employerData.location.coordinates
        },
        businessDescription: employerData.businessDescription,
        verificationDocuments: {
          aadharNumber: employerData.verificationDocuments.aadharNumber,
          panNumber: employerData.verificationDocuments.panNumber,
          businessLicense: employerData.verificationDocuments.businessLicense
        },
        documents: [],
        preferredLanguages: [],
        rating: {
          average: 0,
          count: 0
        },
        reviews: [],
        otp: {
          code: null,
          expiresAt: null
        },
        verificationStatus: 'pending',
        isLoggedIn: employerData.isLoggedIn,
        registrationDate: employerData.registrationDate,
        lastLogin: employerData.lastLogin
      };

      console.log('Formatted employer data:', formattedData);
      
      const response = await api.post('/employers/register', formattedData);
      console.log('Registration response:', response.data);
      
      // Return the employer data from the response
      return response.data.employer || response.data;
    } catch (error) {
      console.error('Employer registration error:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error('Error setting up the request: ' + error.message);
      }
    }
  },

  // Get all employers
  getAllEmployers: async () => {
    try {
      const response = await api.get('/employers');
      return response.data;
    } catch (error) {
      console.error('Error fetching employers:', error);
      throw error;
    }
  },

  // Get employer by ID
  getEmployerById: async (id) => {
    try {
      const response = await api.get(`/employers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employer:', error);
      throw error;
    }
  },

  // Update employer
  updateEmployer: async (id, employerData) => {
    try {
      const response = await api.put(`/employers/${id}`, employerData);
      return response.data;
    } catch (error) {
      console.error('Error updating employer:', error);
      throw error;
    }
  },

  // Delete employer
  deleteEmployer: async (id) => {
    try {
      const response = await api.delete(`/employers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting employer:', error);
      throw error;
    }
  },

  // Get employer profile
  getProfile: async () => {
    try {
      const employerData = localStorage.getItem('employer');
      if (employerData) {
        return JSON.parse(employerData);
      }
      const response = await api.get('/employers/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching employer profile:', error);
      throw error;
    }
  },

  // Update employer profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/employers/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating employer profile:', error);
      throw error;
    }
  },

  // Upload profile image
  uploadProfileImage: async (formData) => {
    try {
      console.log('Uploading profile image:', formData);
      const response = await api.post('/employers/upload-profile', formData, {
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

  // Post a new job
  postJob: async (jobData) => {
    try {
      const response = await api.post('/employers/jobs', jobData);
      return response.data;
    } catch (error) {
      console.error('Error posting job:', error);
      throw error;
    }
  },

  // Get all jobs posted by employer
  getPostedJobs: async () => {
    try {
      const response = await api.get('/employers/jobs');
      return response.data;
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
      throw error;
    }
  },

  // Update a job
  updateJob: async (jobId, jobData) => {
    try {
      const response = await api.put(`/employers/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  // Delete a job
  deleteJob: async (jobId) => {
    try {
      const response = await api.delete(`/employers/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  requestOTP: async (phone) => {
    const response = await api.post('/employer/request-otp', { phone });
    return response.data;
  },

  verifyOTP: async (phone, otp) => {
    const response = await api.post('/employer/verify-otp', { phone, otp });
    return response.data;
  },

  getJobApplications: async (jobId) => {
    const response = await api.get(`/employer/jobs/${jobId}/applications`);
    return response.data;
  },

  updateJobStatus: async (jobId, status) => {
    const response = await api.put(`/employer/jobs/${jobId}/status`, { status });
    return response.data;
  }
};