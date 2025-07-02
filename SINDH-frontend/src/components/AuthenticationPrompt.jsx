import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { synchronizeUserData } from '../utils/authSyncUtils';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const AuthenticationPrompt = ({ isOpen, onClose, onAuthenticationSuccess, from }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userType, setUserType] = useState('worker');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useUser();

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowOtpInput(true);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, we'll use a hardcoded OTP
      if (otp === '0000') {
        // Make API call to verify phone number
        const endpoint = userType === 'worker' ? '/auth/workers/login' : '/auth/employers/login';
        console.log('Attempting login with:', {
          url: `${API_BASE_URL}${endpoint}`,
          phoneNumber,
          userType
        });

        const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
          phoneNumber
        });

        console.log('Login response:', response.data);

        if (response.data.success) {
          // Store only essential data in localStorage
          const userData = {
            id: response.data.data.id,
            type: userType,
            phoneNumber: response.data.data.phoneNumber
          };
          
          console.log('Storing user data:', userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Call success callback and close modal
          onAuthenticationSuccess?.();
          onClose?.();
          
          toast.success('Login successful!');
          
          // Redirect based on user type
          if (userType === 'worker') {
            navigate('/jobs');
          } else {
            navigate('/employer/post-job');
          }
        } else {
          console.error('Login failed:', response.data.message);
          toast.error(response.data.message || 'Login failed');
        }
      } else {
        toast.error('Invalid OTP');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Server error response:', error.response.data);
        // Check if the user is new and redirect to registration
        if (error.response.status === 404 && error.response.data.newUser) {
          toast.info('Phone number not found. Please register.');
          onClose?.(); // Close modal before navigating
          if (userType === 'worker') {
            navigate('/worker/register');
          } else {
            navigate('/employer/register');
          }
        } else {
          toast.error(error.response.data.message || 'Login failed');
        }
      } else if (error.request) {
        // No response received
        console.error('No response received from server');
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else {
        // Other errors
        console.error('Other error:', error.message);
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose} // Close modal when clicking outside
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md m-4"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Verify Your Identity</h2>
              <p className="mt-2 text-gray-600">Enter your phone number to continue</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setUserType('worker')}
                  className={`px-4 py-2 rounded-md ${userType === 'worker' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  disabled={loading}
                >
                  Worker
                </button>
                <button
                  onClick={() => setUserType('employer')}
                  className={`px-4 py-2 rounded-md ${userType === 'employer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  disabled={loading}
                >
                  Employer
                </button>
              </div>

              {!showOtpInput ? (
                <div>
                  <label htmlFor="phone-number" className="sr-only">Phone Number</label>
                  <input
                    id="phone-number"
                    name="phone"
                    type="tel"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="otp" className="sr-only">OTP</label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <button
                  onClick={showOtpInput ? handleVerifyOtp : handleSendOtp}
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  ) : null}
                  {showOtpInput ? 'Verify OTP' : 'Send OTP'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthenticationPrompt; 