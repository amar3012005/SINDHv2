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
        navigate(`/${userType}/form-register`, { 
          state: { phoneNumber },
          replace: true 
        });
        return;
      }

      // If user has incomplete profile, redirect to complete registration
      if (data.incompleteProfile) {
        console.log('Incomplete profile detected, redirecting to complete registration');
        toast.warning(data.message || 'Please complete your profile');
        navigate(`/${userType}/form-register`, { 
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
        navigate(`/${userType}/form-register`, {
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
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 devanagari">
      {/* Background patterns and aurora (matched to Homepage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)',
          }}
        />
        <div className="startrails absolute inset-0"></div>
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
        <div className="aurora absolute inset-0">
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={showOtpInput ? 'otp' : 'phone'}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xs sm:max-w-sm bg-neutral-900/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/10 z-10"
        >
          {/* Header */}
          <div className="px-4 pt-6 pb-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                {getUserTypeIcon(userType)}
              </div>
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">
              {showOtpInput ? 'Verify OTP' : `Login as ${getUserTypeDisplay(userType)}`}
            </h2>
            <p className="mt-1 text-xs text-gray-300">
              {showOtpInput 
                ? `We've sent a 4-digit code to ${phoneNumber}`
                : 'Enter your phone number to continue'}
            </p>
          </div>

          {/* Main Content */}
          <div className="px-4 pb-6">
            {!showOtpInput ? (
              // Phone Number Form
              <div className="space-y-5">
                {/* User Type Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserTypeSelector(!showUserTypeSelector)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white/10 border border-white/15 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent text-sm"
                  >
                    <div className="flex items-center">
                      {getUserTypeIcon(userType)}
                      <span className="text-white/90">{getUserTypeDisplay(userType)}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/70 transition-transform duration-200 ${showUserTypeSelector ? 'transform rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showUserTypeSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-1 w-full bg-white/10 rounded-lg shadow-lg border border-white/15 overflow-hidden backdrop-blur-md"
                      >
                        {['worker', 'employer'].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setUserType(type);
                              setShowUserTypeSelector(false);
                            }}
                            className={`w-full flex items-center px-3 py-2 text-left transition-colors text-sm ${
                              userType === type ? 'bg-white/15 text-white' : 'text-white/90 hover:bg-white/10'
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
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xs">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter phone number"
                    className="block w-full pl-10 pr-3 py-2 bg-neutral-800/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm"
                    maxLength="10"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                 <button
                  onClick={handleLogin}
                  disabled={loading || phoneNumber.length !== 10}
                  className={`w-full flex justify-center items-center py-2 px-3 rounded-lg text-black font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm ${
                    loading || phoneNumber.length !== 10
                      ? 'bg-white/50 cursor-not-allowed'
                      : 'bg-white hover:opacity-95'
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
              <div className="space-y-5">
              <div>
                <div className="relative flex items-center justify-center space-x-2">
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
                        if (value && index < 3) {
                          const nextInput = e.target.parentNode.children[index + 1];
                          if (nextInput) {
                            nextInput.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
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
                          const lastInput = e.target.parentNode.children[3];
                          if (lastInput) {
                            lastInput.focus();
                          }
                        }
                      }}
                      className={`w-10 h-10 text-xl font-bold text-center border-2 rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/20 bg-neutral-900/60 text-white outline-none transition-all ${
                        otp[index] 
                          ? 'border-green-500 bg-green-900/30 text-green-300' 
                          : 'border-white/10 hover:border-white/20'
                      } ${otpError ? 'border-red-400 bg-red-900/20' : ''}`}
                      autoFocus={index === 0}
                      placeholder="•"
                    />
                  ))}
                </div>
                <div className="flex justify-center mt-2 space-x-1">
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
                {otp.length === 4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mt-1"
                  >
                    <span className="text-xs text-green-600 font-medium flex items-center">
                      <span className="mr-1">✓</span>
                      OTP Complete
                    </span>
                  </motion.div>
                )}
                {otpError && (
                  <p className="mt-2 text-xs text-red-600 text-center flex items-center justify-center">
                    <span className="mr-1">⚠️</span>
                    {otpError}
                  </p>
                )}
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    💡 Use <span className="font-mono font-bold text-indigo-600">0000</span> for testing
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors hover:bg-indigo-50 px-2 py-1 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className={`text-xs font-medium flex items-center px-2 py-1 rounded-lg transition-all ${
                    countdown > 0 
                      ? 'text-gray-500 cursor-not-allowed' 
                      : 'text-white hover:text-white/90 hover:bg-white/10'
                  }`}
                >
                  {countdown > 0 ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                className={`w-full flex justify-center items-center py-2 px-3 rounded-lg text-black font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-sm ${
                  isVerifying || otp.length !== 4
                    ? 'bg-white/50 cursor-not-allowed'
                    : 'bg-white hover:opacity-95'
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
                    Enter OTP
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="px-4 py-3 bg-white/5 border-t border-white/10 text-center">
          <p className="text-xs text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
    {/* Global styles to match Homepage theme exactly */}
    <style jsx global>{`
      /* Devanagari font stack for Hindi */
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
      .devanagari {
        font-family: 'Noto Sans Devanagari', 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
      }

      /* Subtle film grain */
      .noise-bg {
        background-image: url('data:image/svg+xml;utf8,\
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
            <filter id="noise">\
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>\
              <feColorMatrix type="saturate" values="0"/>\
              <feComponentTransfer>\
                <feFuncA type="table" tableValues="0 0.2"/>\
              </feComponentTransfer>\
            </filter>\
            <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/>\
          </svg>');
      }
      
      @keyframes blob {
        0% { 
          transform: translate(0px, 0px) scale(1) rotate(0deg); 
          opacity: 0.6;
        }
        25% { 
          transform: translate(40px, -60px) scale(1.2) rotate(90deg); 
          opacity: 0.8;
        }
        50% { 
          transform: translate(-30px, 40px) scale(0.8) rotate(180deg); 
          opacity: 0.4;
        }
        75% { 
          transform: translate(60px, 20px) scale(1.1) rotate(270deg); 
          opacity: 0.7;
        }
        100% { 
          transform: translate(0px, 0px) scale(1) rotate(360deg); 
          opacity: 0.6;
        }
      }

      @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 25% { transform: translateY(-20px) rotate(5deg); } 50% { transform: translateY(-10px) rotate(-5deg); } 75% { transform: translateY(-15px) rotate(3deg); } }
      @keyframes pulse-glow { 0%, 100% { opacity: 0.3; filter: blur(1rem); } 50% { opacity: 0.6; filter: blur(1.5rem); } }
      @keyframes grid-move { 0% { transform: translate(0, 0); } 100% { transform: translate(50px, 50px); } }
      .animate-blob { animation: blob 8s infinite ease-in-out; }
      .animate-float { animation: float 6s infinite ease-in-out; }
      .animate-pulse-glow { animation: pulse-glow 4s infinite ease-in-out; }
      .animate-grid { animation: grid-move 20s infinite linear; }
      .animation-delay-1000 { animation-delay: 1s; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-3000 { animation-delay: 3s; }
      .animation-delay-4000 { animation-delay: 4s; }
      .bg-radial-gradient { background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 70%); }
      .blur-3xl { filter: blur(3rem); }
      .blur-2xl { filter: blur(2rem); }
      .glass-effect { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }

      /* Aurora effect */
      .aurora-blob { position: absolute; width: 60vmax; height: 60vmax; filter: blur(60px); opacity: 0.2; }
      .aurora-a { background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%); left: -20vmax; top: -10vmax; animation: blob 18s ease-in-out infinite; }
      .aurora-b { background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%); right: -25vmax; top: -5vmax; animation: blob 22s ease-in-out infinite reverse; }
      .aurora-c { background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%); left: 10vmax; bottom: -20vmax; animation: blob 26s ease-in-out infinite; }

      /* Star trails background - radial streaks rotating subtly */
      .startrails { position:absolute; inset:0; background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%); overflow:hidden; }
      .startrails::before, .startrails::after { content:""; position:absolute; inset:-20%; background-repeat:repeat; background-size: 300px 300px; mix-blend-mode: screen; opacity:.25; border-radius:50%; filter: blur(0.2px); }
      /* Layer 1 - long streaks */
      .startrails::before { background-image:
          radial-gradient(2px 120px at 50% 0%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1.5px 100px at 80% 10%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1.2px 90px at 20% 30%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1.8px 110px at 70% 60%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 60%);
        animation: trails-rotate 140s linear infinite; }
      /* Layer 2 - shorter streaks */
      .startrails::after { background-image:
          radial-gradient(1px 60px at 30% 10%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1px 70px at 60% 40%, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1px 50px at 10% 80%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1px 65px at 90% 50%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%);
        animation: trails-rotate-rev 200s linear infinite; opacity:.18; }
      @keyframes trails-rotate { from{ transform: rotate(0deg); } to{ transform: rotate(360deg);} }
      @keyframes trails-rotate-rev { from{ transform: rotate(360deg);} to{ transform: rotate(0deg);} }
    `}</style>
  </div>
  );
};

export default Login;
