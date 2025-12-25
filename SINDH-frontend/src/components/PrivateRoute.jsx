import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import AuthenticationPrompt from './AuthenticationPrompt'; // Import the AuthenticationPrompt component

const PrivateRoute = ({ allowedRoles }) => {
  const { user, isLoadingUser, fetchUserProfile } = useUser();
  const location = useLocation();

  // Fetch user profile if it's null or hasn't been fetched yet
  useEffect(() => {
    if (!user && !isLoadingUser) {
      console.log("PrivateRoute: User is null or not loading, attempting to fetch profile.");
      fetchUserProfile();
    }
  }, [user, isLoadingUser, fetchUserProfile]); // Added fetchUserProfile to dependencies

  if (isLoadingUser) {
    console.log("PrivateRoute: Loading user...");
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    ); // Or a loading spinner/component
  }

  console.log("PrivateRoute: User state:", user);

  // If user is null after loading, show authentication prompt
  if (!user) {
    console.log("PrivateRoute: User is not authenticated, showing prompt.");
    // Pass the current location to the AuthenticationPrompt to redirect back after login
    return <AuthenticationPrompt from={location} />;
  }

  // If user exists, check roles
  console.log("PrivateRoute: User authenticated.");
  if (allowedRoles && allowedRoles.length > 0) {
    console.log("PrivateRoute: Checking roles.");
    if (!allowedRoles.includes(user.type)) {
      console.log("PrivateRoute: User role not allowed, redirecting.");
      // Redirect to a forbidden page or homepage if role is not allowed
      return <Navigate to="/" state={{ from: location }} replace />;
    }
    console.log("PrivateRoute: User role allowed.");
  }

  // If user is authenticated and role is allowed, render the private route content
  console.log("PrivateRoute: Rendering private route content.");
  return <Outlet />;
};

export default PrivateRoute;