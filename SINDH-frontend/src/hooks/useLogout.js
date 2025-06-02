/**
 * Custom hook for handling logout consistently across components
 */
import { useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { clearAllUserData } from '../utils/authSyncUtils';
import { toast } from 'react-toastify';

/**
 * Custom hook that provides methods for consistent logout behavior
 * @returns {Object} - Logout methods
 */
export const useLogout = () => {
  const { logoutUser: contextLogoutUser } = useUser();

  /**
   * Performs a complete logout with UI updates
   */
  const logout = useCallback(() => {
    // Update context state
    contextLogoutUser();
    
    // Show success message
    toast.success('Logged out successfully');
  }, [contextLogoutUser]);

  /**
   * Performs a complete logout with page refresh
   * This ensures the app starts completely fresh with no remnants of user data
   */
  const logoutAndRefresh = useCallback(() => {
    // First perform regular logout
    logout();
    
    // Then force page refresh for a completely clean state
    window.location.href = '/';
  }, [logout]);

  /**
   * Silent logout without UI feedback
   * Useful for error handling scenarios
   */
  const silentLogout = useCallback(() => {
    // Just clear data without any UI feedback
    clearAllUserData();
    contextLogoutUser();
  }, [contextLogoutUser]);

  return {
    logout,
    logoutAndRefresh,
    silentLogout
  };
};

export default useLogout;
