// Configuration for different environments
const config = {
  development: {
    API_BASE_URL: "https://sindh-backend.onrender.com",
  },
  production: {
    API_BASE_URL: "https://sindh-backend.onrender.com",
  }
};

// Determine current environment
const environment = process.env.NODE_ENV || 'development';

// Export configuration for current environment
const currentConfig = config[environment] || config.development;

export const API_BASE_URL = currentConfig.API_BASE_URL;
export default currentConfig;
