import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://sindh-backend.onrender.comapi';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptedJobs, setAcceptedJobs] = useState([]);

  // Load user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem('INDUSUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
      }
    }
    
    // Load accepted jobs from localStorage
    const savedJobs = localStorage.getItem('acceptedJobs');
    if (savedJobs) {
      try {
        setAcceptedJobs(JSON.parse(savedJobs));
      } catch (error) {
        console.error("Error parsing saved jobs:", error);
      }
    }
    
    setLoading(false);
  }, []);

  // Register a new user
  const registerUser = (userData) => {
    // Add registration timestamp
    const user = {
      ...userData,
      registeredAt: new Date().toISOString(),
      shaktiScore: userData.shaktiScore || 35, // Default initial score
      workHistory: userData.workHistory || []
    };
    
    // Save user to localStorage
    localStorage.setItem('INDUSUser', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  };

  // Update user profile
  const updateProfile = (updates) => {
    if (!currentUser) return null;
    
    const updatedUser = {
      ...currentUser,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('INDUSUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  // Add work history entry
  const addWorkEntry = (entry) => {
    if (!currentUser) return null;
    
    const workHistory = [...(currentUser.workHistory || []), {
      ...entry,
      date: new Date().toISOString()
    }];
    
    const updatedUser = {
      ...currentUser,
      workHistory,
      shaktiScore: Math.min(100, (currentUser.shaktiScore || 35) + 5) // Increase ShaktiScore
    };
    
    localStorage.setItem('INDUSUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  // Login user and save to localStorage
  const loginUser = async (userData) => {
    console.log('Logging in user with data:', userData);
    
    // First save basic user data
    setCurrentUser(userData);
    localStorage.setItem('INDUSUser', JSON.stringify(userData));
    
    // Then try to fetch complete profile data if we have an ID
    if (userData.id) {
      try {
        console.log(`Fetching complete profile data for ${userData.type} with ID: ${userData.id}`);
        const endpoint = userData.type === 'worker' ? `/workers/${userData.id}` : `/employers/${userData.id}`;
        
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        console.log('Complete profile data received:', response.data);
        
        // Extract profile data from response
        const profileData = response.data.data || response.data;
        
        // Merge with existing user data
        const completeUserData = {
          ...userData,
          ...profileData,
          // Ensure ID is consistent
          id: userData.id || profileData._id || profileData.id
        };
        
        // Update state and localStorage with complete data
        console.log('Saving complete user data:', completeUserData);
        setCurrentUser(completeUserData);
        localStorage.setItem('INDUSUser', JSON.stringify(completeUserData));
        
        return completeUserData;
      } catch (error) {
        console.error('Error fetching complete profile data:', error);
        // Continue with basic user data if profile fetch fails
        return userData;
      }
    } else {
      console.log('No user ID available, skipping profile fetch');
      return userData;
    }
  };

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    if (!currentUser) {
      console.log('No current user to fetch profile for');
      return null;
    }
    
    try {
      const { id, type } = currentUser;
      const endpoint = type === 'worker' ? `/workers/${id}` : `/employers/${id}`;
      
      console.log(`Fetching user profile from ${API_BASE_URL}${endpoint}`);
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      console.log('API response:', response.data);
      
      // Handle different response structures
      let profileData;
      if (response.data.data) {
        // If response has a data property
        profileData = response.data.data;
        console.log('Found profile data in response.data.data:', profileData);
      } else if (response.data._id || response.data.id) {
        // If response has direct user properties
        profileData = response.data;
        console.log('Found profile data directly in response.data:', profileData);
      } else {
        console.warn('Unexpected API response structure:', response.data);
        return currentUser; // Return existing user if response structure is unknown
      }
      
      // Update current user with additional details from profile
      const updatedUser = {
        ...currentUser,
        ...profileData,
        // Ensure ID is properly set regardless of _id or id format
        id: profileData._id || profileData.id || currentUser.id
      };
      
      console.log('Updated user with profile data:', updatedUser);
      setCurrentUser(updatedUser);
      localStorage.setItem('INDUSUser', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return currentUser; // Return existing user on error
    }
  };

  // Log out user
  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('INDUSUser');
  };

  return (
    <UserContext.Provider 
      value={{ 
        user: currentUser, 
        isLoadingUser: loading, 
        registerUser, 
        updateProfile, 
        addWorkEntry,
        loginUser,
        logoutUser,
        fetchUserProfile,
        acceptedJobs,
        setAcceptedJobs: (jobs) => {
          setAcceptedJobs(jobs);
          localStorage.setItem('acceptedJobs', JSON.stringify(jobs));
        }
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};