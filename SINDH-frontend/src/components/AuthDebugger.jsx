import React from 'react';
import { useUser } from '../context/UserContext';
import { isAuthenticated, getUserType, isWorker, isEmployer } from '../utils/authUtils';

/**
 * A debugging component to show current authentication state
 * Use this component in development to debug user context issues
 */
const AuthDebugger = () => {
  const { user, isLoadingUser } = useUser();
  
  // Get data from localStorage
  const localStorageUser = JSON.parse(localStorage.getItem('user') || 'null');
  const localStorageUserType = localStorage.getItem('userType');
  
  // Get data from utility functions
  const authenticated = isAuthenticated();
  const userType = getUserType();
  const worker = isWorker();
  const employer = isEmployer();

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development mode
  }

  return (
    <div className="bg-yellow-100 p-4 mt-4 rounded border border-yellow-400 text-xs">
      <h3 className="font-bold text-sm">Auth Debugger</h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <strong>Context User:</strong> {user ? `ID: ${user.id}, Type: ${user.type}` : 'null'}
        </div>
        <div>
          <strong>isLoadingUser:</strong> {isLoadingUser.toString()}
        </div>
        <div>
          <strong>localStorage[user]:</strong> {localStorageUser ? `ID: ${localStorageUser.id}, Type: ${localStorageUser.type}` : 'null'}
        </div>
        <div>
          <strong>localStorage[userType]:</strong> {localStorageUserType || 'null'}
        </div>
        <div>
          <strong>isAuthenticated():</strong> {authenticated.toString()}
        </div>
        <div>
          <strong>getUserType():</strong> {userType || 'null'}
        </div>
        <div>
          <strong>isWorker():</strong> {worker.toString()}
        </div>
        <div>
          <strong>isEmployer():</strong> {employer.toString()}
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;
