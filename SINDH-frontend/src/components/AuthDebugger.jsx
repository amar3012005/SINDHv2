import React from 'react';
import { useUser } from '../context/UserContext';
import { getCurrentUser, getUserType, isWorker, isEmployer } from '../utils/authUtils';

const AuthDebugger = () => {
  const { user, isLoadingUser } = useUser();
  const localUser = getCurrentUser();

  const debugInfo = {
    'Context User': `ID: ${user?.id || user?._id || 'undefined'}, Type: ${user?.type || 'undefined'}`,
    'isLoadingUser': isLoadingUser.toString(),
    'localStorage[user]': `ID: ${localUser?.id || localUser?._id || 'undefined'}, Type: ${localUser?.type || 'undefined'}`,
    'localStorage[userType]': localStorage.getItem('userType') || 'undefined',
    'isAuthenticated()': Boolean(user || localUser).toString(),
    'getUserType()': getUserType() || 'undefined',
    'isWorker()': isWorker().toString(),
    'isEmployer()': isEmployer().toString()
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg text-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      {Object.entries(debugInfo).map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="font-medium">{key}: </span>
          <span className="text-gray-600">{value}</span>
        </div>
      ))}
    </div>
  );
};

export default AuthDebugger;
