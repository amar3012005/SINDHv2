// Configuration for different environments
const config = {
  development: {
    API_BASE_URL: "http://localhost:10000",
  },
  production: {
    // Your Render backend URL - replace with your actual Render URL
    API_BASE_URL: process.env.NODE_ENV === 'production' 
  ? "https://sindh-backend.onrender.com" 
  : "http://localhost:10000", // Development uses local backend
  }
};

// Determine current environment
const environment = process.env.NODE_ENV || 'development';

// Export configuration for current environment
const currentConfig = config[environment] || config.development;

export const API_BASE_URL = currentConfig.API_BASE_URL;
export default currentConfig;
