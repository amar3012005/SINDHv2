import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api'; // Assuming you have an api config
import { synchronizeUserData, clearAllUserData } from '../utils/authSyncUtils';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds the full user profile (worker/employer)
  const [acceptedJobs, setAcceptedJobs] = useState([]); // For workers
  const [postedJobs, setPostedJobs] = useState([]); // For employers
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Loading state for initial user fetch
  const [isUpdatingUser, setIsUpdatingUser] = useState(false); // Loading state for profile updates

  // Function to load basic user data from localStorage
  const loadBasicUserFromStorage = useCallback(() => {
    // Use our synchronization utility to get consistent user data
    const user = synchronizeUserData();
    
    if (user) {
      console.log("loadBasicUserFromStorage: Found synchronized user data:", user);
      return user;
    }
    
    console.log("loadBasicUserFromStorage: No valid user data in localStorage.");
    return null;
  }, []);

  // Function to fetch full user profile and related data
  const fetchUserProfile = useCallback(async () => {
    const localUser = loadBasicUserFromStorage(); // Attempt to load full user from storage
    if (localUser) {
      // Ensure user object has proper type field for component conditional rendering
      const validatedUser = {
        ...localUser,
        type: localUser.type
      };
      
      if (!validatedUser.type) {
        console.error("User missing required type field");
        setUser(null);
        setIsLoadingUser(false);
        return;
      }
      
      console.log("fetchUserProfile: Found valid user data in localStorage", validatedUser);
      setUser(validatedUser); // Set user state immediately from local storage
      setIsLoadingUser(false);

      // **Optional:** Fetch latest profile data from backend in background
      // This helps keep data fresh but doesn't block initial load
      // You can uncomment and refine this section if needed.
      /*
      try {
          let profileResponse;
          if (localUser.type === 'worker') {
              profileResponse = await api.get(`/workers/${localUser.id}`);
          } else if (localUser.type === 'employer') {
              profileResponse = await api.get(`/employers/${localUser.id}`);
          }
          if (profileResponse?.data) {
               // Only update if fetched data is different or more complete
               // Avoid unnecessary renders
              if (JSON.stringify(localUser) !== JSON.stringify({ ...localUser, ...profileResponse.data })){
                 setUser(prevUser => ({ ...prevUser, ...profileResponse.data }));
                 console.log("fetchUserProfile: Updated user profile from backend.", { ...localUser, ...profileResponse.data });
              }
          }
      } catch (error) {
          console.warn('Background fetch of user profile failed:', error);
          // User remains in state from localStorage, just show a warning
      }
      */

      // Still fetch related jobs data if user is logged in
      try {
        if (localUser.type === 'worker') {
          const jobsResponse = await api.get(`/jobs/worker/${localUser.id}/accepted-jobs`);
          setAcceptedJobs(jobsResponse.data);
          setPostedJobs([]);
        } else if (localUser.type === 'employer') {
          const jobsResponse = await api.get(`/jobs/employer/${localUser.id}/applications`);
          setPostedJobs(jobsResponse.data);
          setAcceptedJobs([]);
        }
      } catch (error) {
         console.warn('Background fetch of user jobs/applications failed:', error);
         // Clear jobs/applications on fetch error, but user profile from localStorage remains
         setAcceptedJobs([]);
         setPostedJobs([]);
      }

      return; // Exit after loading from local storage and triggering background fetches
    }

    // If no user data in localStorage, set initial state to null and loading to false
    console.log("fetchUserProfile: No user data in storage, setting user to null.");
    setUser(null);
    setIsLoadingUser(false);
    return;
  }, [loadBasicUserFromStorage]); // fetchUserProfile depends on loadBasicUserFromStorage

  // Initial load of user data when the provider mounts
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]); // Effect depends on fetchUserProfile

  // Function to update user profile (e.g., after registration/editing)
  const updateProfile = useCallback(async (userId, userType, profileData) => {
    setIsUpdatingUser(true);
    try {
      let response;
      if (userType === 'worker') {
        response = await api.patch(`/workers/${userId}`, profileData);
      } else if (userType === 'employer') {
        response = await api.patch(`/employers/${userId}`, profileData);
      }
      if (response.data) {
        // Update the user state in context with the new data
        setUser(prevUser => ({ ...prevUser, ...response.data }));
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsUpdatingUser(false);
    }
  }, []);

  // Function to handle user login and set basic data in localStorage
  const loginUser = useCallback((userData) => {
    // Ensure we store the complete user data
    const completeUserData = {
      ...userData,
      id: userData._id || userData.id,
      type: userData.type,
      rating: userData.rating || 0,
      skills: userData.skills || [],
      location: userData.location || {},
      language: userData.language || [],
      experience_years: userData.experience_years,
      aadharNumber: userData.aadharNumber,
      age: userData.age
    };

    setUser(completeUserData);
    localStorage.setItem('user', JSON.stringify(completeUserData));
  }, []);

  // Function to handle user logout
  const logoutUser = useCallback(() => {
    // Use our synchronization utility to clear all user data
    clearAllUserData();
    
    // Reset all state
    setUser(null);
    setAcceptedJobs([]);
    setPostedJobs([]);
    
    // Clear any other storage that might contain user data
    sessionStorage.clear();
    
    // Ensure the cookie is also cleared if using cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    
    console.log("User logged out, all data cleared.");
  }, []);

  return (
    <UserContext.Provider value={{ user, acceptedJobs, postedJobs, isLoadingUser, isUpdatingUser, fetchUserProfile, updateProfile, loginUser, logoutUser, setAcceptedJobs, setPostedJobs }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  console.log('useUser hook returning context:', context);
  return context;
};
