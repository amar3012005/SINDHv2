import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { clearAllJobApplications } from '../utils/jobApplicationUtils';

const API_BASE_URL = 'http://localhost:5000/api';

const Login = () => {
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
      if (otp === '0000') { // Demo OTP check
        const endpoint = userType === 'worker' ? '/auth/workers/login' : '/auth/employers/login';
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
          phoneNumber
        });

        if (response.data && response.data.success) {
          // Clear any existing job application data before setting new user
          clearAllJobApplications();
          
          let userData = {
            ...response.data.data,
            id: response.data.data?._id,
            type: userType,
            phoneNumber: response.data.data?.phone,
            rating: response.data.worker?.rating || response.data.data?.rating || 0,
            // Save all profile data received from backend
            skills: response.data.data?.skills || [],
            location: response.data.data?.location || {},
            language: response.data.data?.language || [],
            experience_years: response.data.data?.experience_years,
            aadharNumber: response.data.data?.aadharNumber,
            age: response.data.data?.age
          };
          
          localStorage.setItem('userType', userType);
          localStorage.setItem('user', JSON.stringify(userData));
          loginUser(userData);
          
          // Navigate based on user type with state
          navigate('/', { 
            state: { showWelcome: true },
            replace: true  // Replace current route to prevent back navigation to login
          });
          
          toast.success('Login successful!');
        } else {
          toast.error(response.data.message || 'Login failed');
        }
      } else {
        toast.error('Invalid OTP');
      }
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.newUser) {
        toast.info('Phone number not registered. Please sign up.');
        navigate(userType === 'worker' ? '/worker/register' : '/employer/register');
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to S I N D H
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your phone number to continue
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setUserType('worker')}
              className={`px-4 py-2 rounded-md ${
                userType === 'worker'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Worker
            </button>
            <button
              onClick={() => setUserType('employer')}
              className={`px-4 py-2 rounded-md ${
                userType === 'employer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Employer
            </button>
          </div>

          {!showOtpInput ? (
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="phone-number" className="sr-only">
                  Phone Number
                </label>
                <input
                  id="phone-number"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="otp" className="sr-only">
                  OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                />
              </div>
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
    </div>
  );
};

export default Login;