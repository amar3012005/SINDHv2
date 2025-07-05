import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState('worker');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { loginUser } = useUser();
  const { t } = useTranslation();

  // Handle phone number submission and OTP request
  const handleLogin = async () => {
    try {
      if (!phoneNumber || phoneNumber.length !== 10) {
        toast.error(t('login.validPhoneRequired'));
        return;
      }

      setLoading(true);

      // Simulate OTP sending (in real app, this would call backend)
      toast.info(`OTP sent to ${phoneNumber}. Use 0000 for testing.`);
      setShowOtpInput(true);

      // Start countdown for resend OTP
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error requesting OTP:', error);
      toast.error('Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    try {
      if (!otp || otp.length !== 4) {
        setOtpError(t('login.otpRequired'));
        return;
      }

      // Check if OTP is the test code
      if (otp !== '0000') {
        setOtpError(t('login.invalidOtp'));
        return;
      }

      setIsVerifying(true);
      setOtpError('');

      // Make API call to verify OTP and login
      const endpoint = userType === 'worker' ? '/workers/login' : '/employers/login';
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://sindh-backend.onrender.com'}/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      // Successful login - existing user
      if (response.ok && data.success) {
        const userData = {
          ...data.data,
          type: userType,
          isLoggedIn: 1,
          lastLogin: new Date().toISOString()
        };

        // Clear any existing data
        localStorage.removeItem('user');
        localStorage.removeItem('userType');

        // Set new user data
        localStorage.setItem('userType', userType);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update context
        loginUser(userData);

        toast.success(t('login.success'));

        // Redirect existing users to homepage
        navigate('/');
      }
      // User doesn't exist - redirect to registration
      else if (response.status === 404 || data.newUser) {
        toast.info('Please complete your registration');
        navigate(`/${userType}/register`, {
          state: { phoneNumber }
        });
      }
      // Other errors
      else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Error verifying OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = () => {
    if (countdown > 0) return;

    toast.info(`OTP resent to ${phoneNumber}. Use 0000 for testing.`);
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle back to phone number input
  const handleBackToPhone = () => {
    setShowOtpInput(false);
    setOtp('');
    setOtpError('');
    setCountdown(0);
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
            {t('login.welcome')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showOtpInput ? t('login.enterOtp') : t('login.enterPhone')}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {!showOtpInput ? (
            // Phone number input form
            <>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setUserType('worker')}
                  className={`px-4 py-2 rounded-md ${
                    userType === 'worker'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t('login.worker')}
                </button>
                <button
                  onClick={() => setUserType('employer')}
                  className={`px-4 py-2 rounded-md ${
                    userType === 'employer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {t('login.employer')}
                </button>
              </div>

              <div className="rounded-md shadow-sm -space-y-px">
                <input
                  id="phone-number"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('login.phonePlaceholder')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleLogin}
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
                {t('login.sendOtp')}
              </button>
            </>
          ) : (
            // OTP verification form
            <>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {t('login.otpSentTo')} {phoneNumber}
                </p>
                <button
                  onClick={handleBackToPhone}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {t('login.changePhone')}
                </button>
              </div>

              <div className="rounded-md shadow-sm -space-y-px">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  pattern="[0-9]{4}"
                  maxLength="4"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest"
                  placeholder={t('login.otpPlaceholder')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  disabled={isVerifying}
                />
              </div>

              {otpError && (
                <div className="text-red-600 text-sm text-center">
                  {otpError}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 4}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isVerifying ? (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : null}
                {t('login.verifyOtp')}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
                >
                  {countdown > 0 ? `${t('login.resendOtpIn')} ${countdown}s` : t('login.resendOtp')}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;