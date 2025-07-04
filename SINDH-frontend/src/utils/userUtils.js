import axios from 'axios';

const API_BASE_URL = 'https://sindh-backend.onrender.comapi';

export const fetchUserProfile = async (userId, userType) => {
  try {
    const endpoint = userType === 'worker' ? `/workers/${userId}` : `/employers/${userId}`;
    const response = await axios.get(`${API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const fetchUserJobs = async (userId, userType) => {
  try {
    const endpoint = userType === 'worker' 
      ? `/jobs/worker/${userId}/accepted-jobs`
      : `/jobs/employer/${userId}/posted-jobs`;
    const response = await axios.get(`${API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    throw error;
  }
};

export const getUserData = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const isAuthenticated = () => {
  return !!getUserData();
};

export const getUserType = () => {
  const userData = getUserData();
  return userData ? userData.type : null;
};

export const getUserId = () => {
  const userData = getUserData();
  return userData ? userData.id : null;
}; 