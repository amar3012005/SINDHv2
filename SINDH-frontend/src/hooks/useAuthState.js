/**
 * Custom hook for accessing synchronized authentication state
 */
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { getCurrentUser, getUserType } from '../utils/authUtils';
import { synchronizeUserData } from '../utils/authSyncUtils';

/**
 * Custom hook that provides a synchronized user state across the app
 * @returns {Object} Object containing user data and authentication state
 */
export const useAuthState = () => {
  const { user: contextUser, logoutUser, isLoadingUser } = useUser();
  const [localUser, setLocalUser] = useState(null);

  // On mount and when context user changes, sync with localStorage
  useEffect(() => {
    const syncUser = async () => {
      // If context has a user, use that
      if (contextUser) {
        setLocalUser(contextUser);
        return;
      }
      
      // Otherwise try to get from localStorage
      const storedUser = getCurrentUser();
      if (storedUser) {
        setLocalUser(storedUser);
      } else {
        setLocalUser(null);
      }
    };
    
    syncUser();
  }, [contextUser]);

  return {
    user: contextUser || localUser,
    userType: (contextUser || localUser)?.type || getUserType(),
    isAuthenticated: !!(contextUser || localUser),
    isLoadingUser,
    logoutUser,
    syncUser: synchronizeUserData
  };
};

export default useAuthState;
