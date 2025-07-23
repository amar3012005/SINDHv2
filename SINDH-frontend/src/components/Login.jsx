import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import { Phone, Shield, User, ArrowRight, ArrowLeft, Loader2, ChevronDown, Briefcase, HardHat } from 'lucide-react';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userType, setUserType] = useState('worker');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showUserTypeSelector, setShowUserTypeSelector] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();
  const { t } = useTranslation();

  // Set user type from URL if provided
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type');
    if (type && ['worker', 'employer'].includes(type)) {
      setUserType(type);
    }
  }, [location]);

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
      const response = await fetch(`${API_BASE_URL}/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      // If user doesn't exist, redirect to registration
      if (data.newUser) {
        console.log('New user detected, redirecting to registration');
        navigate(`/${userType}/register`, { 
          state: { phoneNumber },
          replace: true 
        });
        return;
      }

      // If user has incomplete profile, redirect to complete registration
      if (data.incompleteProfile) {
        console.log('Incomplete profile detected, redirecting to complete registration');
        toast.warning(data.message || 'Please complete your profile');
        navigate(`/${userType}/register`, { 
          state: { 
            phoneNumber,
            incompleteProfile: true,
            missingFields: data.missingFields || []
          },
          replace: true 
        });
        return;
      }

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
          localStorage.setItem('employerId', userData.id);
        }

        // Update context
        loginUser(userData);

        toast.success(t('login.success'));

        // Redirect existing users to homepage
        navigate('/home');
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
      
      // Handle any unexpected errors
      const errorMessage = error.message || 'Error verifying OTP. Please try again.';
      toast.error(errorMessage);
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

  // Get user type display name
  const getUserTypeDisplay = (type) => {
    return type === 'worker' ? 'Worker' : 'Employer';
  };

  // Get user type icon
  const getUserTypeIcon = (type) => {
    return type === 'worker' ? (
      <HardHat className="w-5 h-5 mr-2" />
    ) : (
      <Briefcase className="w-5 h-5 mr-2" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={showOtpInput ? 'otp' : 'phone'}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/20"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                {getUserTypeIcon(userType)}
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {showOtpInput ? 'Verify OTP' : `Login as ${getUserTypeDisplay(userType)}`}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {showOtpInput 
                ? `We've sent a 4-digit code to ${phoneNumber}`
                : 'Enter your phone number to continue'}
            </p>
          </div>

          {/* Main Content */}
          <div className="px-8 pb-8">
            {!showOtpInput ? (
              // Phone Number Form
              <div className="space-y-6">
                {/* User Type Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserTypeSelector(!showUserTypeSelector)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <div className="flex items-center">
                      {getUserTypeIcon(userType)}
                      <span>{getUserTypeDisplay(userType)}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showUserTypeSelector ? 'transform rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showUserTypeSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                      >
                        {['worker', 'employer'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setUserType(type);
                              setShowUserTypeSelector(false);
                            }}
                            className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                              userType === type ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                            }`}
                          >
                            {getUserTypeIcon(type)}
                            <span>{getUserTypeDisplay(type)}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter phone number"
                    className="block w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    maxLength="10"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading || phoneNumber.length !== 10}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                    loading || phoneNumber.length !== 10
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Continue with OTP
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              // OTP input form
              <div className="space-y-6">
              <div>
                <div className="relative flex items-center justify-center space-x-3">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(-1);
                        const newOtp = otp.split('');
                        newOtp[index] = value;
                        const updatedOtp = newOtp.join('');
                        setOtp(updatedOtp);
                        
                        // Auto-focus next input if value entered
                        if (value && index < 3) {
                          const nextInput = e.target.parentNode.children[index + 1];
                          if (nextInput) {
                            nextInput.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace to go to previous input
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          const prevInput = e.target.parentNode.children[index - 1];
                          if (prevInput) {
                            prevInput.focus();
                          }
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                        if (pastedData.length === 4) {
                          setOtp(pastedData);
                          // Focus the last input
                          const lastInput = e.target.parentNode.children[3];
                          if (lastInput) {
                            lastInput.focus();
                          }
                        }
                      }}
                      className={`w-16 h-16 text-2xl font-bold text-center border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${
                        otp[index] 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${otpError ? 'border-red-300 bg-red-50' : ''}`}
                      autoFocus={index === 0}
                      placeholder="•"
                    />
                  ))}
                </div>
                
                {/* OTP Progress Indicator */}
                <div className="flex justify-center mt-4 space-x-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index < otp.length 
                          ? 'bg-green-500 scale-110' 
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                
                {/* OTP Completion Status */}
                {otp.length === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mt-2"
                  >
                    <span className="text-xs text-green-600 font-medium flex items-center">
                      <span className="mr-1">✓</span>
                      OTP Complete
                    </span>
                  </motion.div>
                )}
                
                {otpError && (
                  <p className="mt-3 text-sm text-red-600 text-center flex items-center justify-center">
                    <span className="mr-1">⚠️</span>
                    {otpError}
                  </p>
                )}
                
                {/* Test OTP Hint */}
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    💡 Use <span className="font-mono font-bold text-indigo-600">0000</span> for testing
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors hover:bg-indigo-50 px-3 py-2 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to phone
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className={`text-sm font-medium flex items-center px-3 py-2 rounded-lg transition-all ${
                    countdown > 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50'
                  }`}
                >
                  {countdown > 0 ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                      Resend in {countdown}s
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Resend OTP
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 4}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-white font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                  isVerifying || otp.length !== 4
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : otp.length === 4
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Verifying...
                  </>
                ) : otp.length === 4 ? (
                  <>
                    <span className="mr-2">✅</span>
                    Verify and Continue
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔒</span>
                    Enter 4-digit OTP
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
    
    {/* Background elements */}
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
    </div>
  </div>
  );
};

export default Login;