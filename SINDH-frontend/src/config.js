// Configuration for different environments
const config = {
  development: {
    API_BASE_URL: "http://localhost:5000",
  },
  production: {
    // Your actual backend URL
    API_BASE_URL: "http://localhost:5000", // For now, still using localhost - you'll need to deploy the backend
  }
};

// Determine current environment
const environment = process.env.NODE_ENV || 'development';

// Export configuration for current environment
const currentConfig = config[environment] || config.development;

export const API_BASE_URL = currentConfig.API_BASE_URL;
export default currentConfig;
