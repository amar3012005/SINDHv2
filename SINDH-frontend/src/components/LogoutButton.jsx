import React from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * A reusable logout button component that handles logout consistently
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.label - Button label text
 * @param {Function} props.onLogoutComplete - Optional callback after logout completes
 * @returns {JSX.Element} - Logout button component
 */
const LogoutButton = ({ 
  className = '', 
  label = 'Logout', 
  onLogoutComplete = null,
  variant = 'default' // 'default', 'text', 'icon'
}) => {
  const { logoutUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Clear all local storage
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      localStorage.removeItem('lastUserSync');
      localStorage.removeItem('employerId');
      localStorage.removeItem('worker');
      localStorage.removeItem('employer');
      
      // Call context logout
      await logoutUser();
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Navigate to home
      navigate('/', { replace: true });
      
      // Call completion callback if provided
      if (onLogoutComplete) {
        onLogoutComplete();
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  // Button styling based on variant
  let buttonStyle = '';
  
  switch (variant) {
    case 'text':
      buttonStyle = 'text-red-600 hover:text-red-800 hover:underline';
      break;
    case 'icon':
      buttonStyle = 'text-red-600 hover:text-red-800';
      break;
    default:
      buttonStyle = 'px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500';
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleLogout}
      className={`${buttonStyle} ${className}`}
    >
      {variant === 'icon' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-2-2V14H4V4h9.586l-2-2H3zm14.586 2l-2-2H16a1 1 0 011 1v2.586z" clipRule="evenodd" />
          <path d="M10 7a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 10.414V15a1 1 0 11-2 0v-4.586l-1.293 1.293a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 7z" />
        </svg>
      ) : (
        label
      )}
    </motion.button>
  );
};

export default LogoutButton;
