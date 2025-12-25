import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, ArrowRight, Loader, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { api } from '../config/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();

  // Get user type from URL params or default to worker
  const searchParams = new URLSearchParams(location.search);
  const initialType = searchParams.get('type') || 'worker';

  const [userType, setUserType] = useState(initialType);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');

  // Handle sending OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setPhoneError('');

    // Validate phone number
    if (!phoneNumber || phoneNumber.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = userType === 'worker'
        ? '/auth/worker/request-otp'
        : '/auth/employer/request-otp';

      const response = await api.post(endpoint, { phone: phoneNumber });

      if (response.data.success) {
        toast.success('OTP sent successfully! Use 0000 for testing.');
        setOtpSent(true);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError('');

    // Validate OTP
    if (!otp || otp.length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP');
      return;
    }

    // Check if OTP is the test code
    if (otp !== '0000') {
      setOtpError('Invalid OTP. Use 0000 for testing.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = userType === 'worker'
        ? '/auth/worker/verify-otp'
        : '/auth/employer/verify-otp';

      const response = await api.post(endpoint, {
        phone: phoneNumber,
        otp
      });

      const data = response.data;

      // If user is new or requires registration, redirect to registration
      if (data.isNewUser || data.requiresRegistration) {
        toast.info('Welcome! Please complete your registration to get started.', {
          autoClose: 4000
        });

        navigate(`/${userType}/form-register`, {
          state: { phoneNumber },
          replace: true
        });
        return;
      }

      // Successful login - existing user with complete profile
      if (data.success) {
        const userData = {
          ...data.data.employer || data.data.worker || data.data,
          type: userType,
          isLoggedIn: 1,
          lastLogin: new Date().toISOString()
        };

        // Clear any existing data
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');

        // Set new user data and token
        localStorage.setItem('userType', userType);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        localStorage.setItem('authToken', data.token);

        // Store employer profile separately if employer
        if (userType === 'employer') {
          localStorage.setItem('employerProfile', JSON.stringify(userData));
          localStorage.setItem('employerId', userData.id || userData._id);
        }

        // Update context
        loginUser(userData);

        // Create welcome notification
        import('../services/notificationService').then(({ createNotification, NOTIFICATION_TYPES }) => {
          createNotification({
            type: NOTIFICATION_TYPES.WELCOME,
            title: `Welcome back, ${userData.fullName || userData.name || 'User'}!`,
            message: userType === 'employer'
              ? 'Ready to find great workers for your jobs?'
              : 'Ready to find work opportunities?',
            timestamp: new Date().toISOString()
          });
        });

        toast.success('Login successful!');

        // Smart redirect based on user type
        if (userType === 'employer') {
          navigate('/employer/posted-jobs');
        } else {
          navigate('/jobs');
        }
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);

      // Handle 404 - new user needs registration
      if (error.response?.status === 404) {
        toast.info('Welcome! Please complete your registration to get started.', {
          autoClose: 4000
        });
        navigate(`/${userType}/form-register`, {
          state: { phoneNumber }
        });
        return;
      }

      // Handle 400 - bad request (invalid OTP, etc.)
      if (error.response?.status === 400) {
        const errorMsg = error.response.data?.message || 'Invalid request. Please check your input.';
        setOtpError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Handle network errors
      if (!error.response) {
        toast.error('Network error. Please check your connection and try again.');
        return;
      }

      const errorMessage = error.response?.data?.message || error.message || 'Error verifying OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-12 devanagari">
      {/* Background with subtle gradient matching homepage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)',
          }}
        />
        {/* Subtle decorative circles */}
        <div
          className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: '#E8DFD5', filter: 'blur(80px)' }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full opacity-30"
          style={{ background: '#DBBBA7', filter: 'blur(80px)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand/Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-extrabold text-[#3B4883] mb-4 tracking-tight drop-shadow-sm">
            SINDH
          </h1>
          <h2 className="text-3xl font-bold text-[#202124] mb-2">
            Welcome Back
          </h2>
          <p className="text-[#202124]/60 font-medium">
            Join the community built for India's growth
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-[#3B4883]/10 rounded-3xl p-8 shadow-2xl">
          {/* User Type Selection */}
          <div className="flex p-1 bg-[#3B4883]/5 rounded-2xl mb-8">
            <button
              type="button"
              className={`flex-1 py-3.5 px-4 rounded-xl font-bold transition-all duration-300 ${userType === 'worker'
                ? 'bg-[#FF7124] text-white shadow-lg scale-100'
                : 'text-[#3B4883]/60 hover:text-[#3B4883]'
                }`}
              onClick={() => setUserType('worker')}
            >
              I'm a Worker
            </button>
            <button
              type="button"
              className={`flex-1 py-3.5 px-4 rounded-xl font-bold transition-all duration-300 ${userType === 'employer'
                ? 'bg-[#FF7124] text-white shadow-lg scale-100'
                : 'text-[#3B4883]/60 hover:text-[#3B4883]'
                }`}
              onClick={() => setUserType('employer')}
            >
              I'm an Employer
            </button>
          </div>

          {/* Form Content */}
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#202124] mb-2 px-1 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-[#3B4883]/40" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/\D/g, ''));
                      setPhoneError('');
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-2xl text-lg font-semibold placeholder:text-gray-300 focus:outline-none transition-all ${phoneError
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#3B4883]/10 focus:border-[#FF7124] focus:ring-4 focus:ring-[#FF7124]/10'
                      }`}
                    maxLength="10"
                    required
                  />
                </div>
                {phoneError && (
                  <p className="mt-2 text-red-500 text-sm font-medium animate-fadeIn pl-1">
                    {phoneError}
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#3B4883] text-white rounded-2xl font-bold text-lg hover:bg-[#272D4E] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#202124] mb-2 px-1 uppercase tracking-wider">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="w-5 h-5 text-[#3B4883]/40" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setOtpError('');
                    }}
                    placeholder="Enter 6-digit code"
                    className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-2xl text-lg font-semibold placeholder:text-gray-300 focus:outline-none transition-all ${otpError
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#3B4883]/10 focus:border-[#FF7124] focus:ring-4 focus:ring-[#FF7124]/10'
                      }`}
                    maxLength="6"
                    required
                  />
                </div>
                {otpError && (
                  <p className="mt-2 text-red-500 text-sm font-medium animate-fadeIn pl-1">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="flex flex-col space-y-4">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#FF7124] text-white rounded-2xl font-bold text-lg hover:bg-[#e66420] transition-all shadow-xl disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setOtpError('');
                  }}
                  className="text-[#3B4883] font-bold text-sm hover:underline"
                >
                  Change phone number
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-[#3B4883]/5 text-center">
            <p className="text-sm text-[#202124]/40 font-medium">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-[#3B4883] hover:underline">Terms</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-[#3B4883] hover:underline">Privacy</Link>
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Link
            to="/home"
            className="inline-flex items-center text-[#3B4883] font-bold hover:text-[#FF7124] transition-colors"
          >
            <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
            Back to Homepage
          </Link>
        </motion.div>
      </motion.div>

      <style>{`
        .devanagari { font-family: 'Noto Sans Devanagari', 'Inter', sans-serif; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Login;