import axios from 'axios';
import API_URL from '../config/api';

const jobService = {
  async postJob(jobData) {
    try {
      const response = await axios.post(`${API_URL}/jobs`, jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getJobs() {
    try {
      const response = await axios.get(`${API_URL}/jobs`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getJobById(id) {
    try {
      const response = await axios.get(`${API_URL}/jobs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async getEmployerJobs(employerId) {
    try {
      const response = await axios.get(`${API_URL}/jobs/employer/${employerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async updateJobStatus(jobId, status) {
    try {
      const response = await axios.patch(`${API_URL}/jobs/${jobId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default jobService; 