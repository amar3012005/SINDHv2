import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { motion } from 'framer-motion';

const GrameenLinkProfile = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  if (!user) return null;

  const handleProfileClick = () => {
    const profilePath = user.type === 'worker' ? '/worker/profile' : '/employer/profile';
    navigate(profilePath);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-lg shadow-lg border border-blue-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {user.name?.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">GrameenLink Profile</h3>
            <p className="text-sm text-gray-600 capitalize">{user.type}</p>
          </div>
        </div>
        <button
          onClick={handleProfileClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Profile
        </button>
      </div>
    </motion.div>
  );
};

export default GrameenLinkProfile;
