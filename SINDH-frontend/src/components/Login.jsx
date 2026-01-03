
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, ArrowRight, Loader, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { api } from '../config/api';
import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();

  const searchParams = new URLSearchParams(location.search);
  const initialType = searchParams.get('type') || 'worker';

  const [userType, setUserType] = useState(initialType);
  const [countryCode, setCountryCode] = useState('+49'); // Default to Germany
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [listeners, setListeners] = useState([]);

  // Initialize reCAPTCHA for web
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      if (!window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
              // reCAPTCHA solved
            },
            'expired-callback': () => {
              // Response expired
              toast.warn('reCAPTCHA expired. Please try again.');
            }
          });
        } catch (error) {
          console.error('Recaptcha init error:', error);
        }
      }
    }
  }, []);

  // Setup Native OTP Listeners
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setupNativeListeners();
    }
    return () => {
      // Cleanup listeners on unmount
      listeners.forEach(l => l?.remove());
    };
  }, []);

  const setupNativeListeners = async () => {
    try {
      // 1. Code Sent Listener
      const codeSentListener = await FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
        console.log('📱 Native OTP sent, ID:', event.verificationId);
        setVerificationId(event.verificationId);
        setOtpSent(true);
        setIsLoading(false);
        toast.success('OTP sent successfully!');
      });

      // 2. Auto-Verification Listener (Android only)
      const autoVerifiedListener = await FirebaseAuthentication.addListener('phoneVerificationCompleted', async (event) => {
        console.log('⚡ Phone verified automatically!', event.result.user);
        setIsLoading(true);
        await proceedWithAuth(event.result.user);
      });

      // 3. Verification Failed Listener
      const failedListener = await FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
        console.error('❌ Native verification failed:', event.message);
        setOtpError(event.message || 'Verification failed. Please try again.');
        setIsLoading(false);
        toast.error(event.message || 'Verification failed.');
      });

      setListeners([codeSentListener, autoVerifiedListener, failedListener]);
    } catch (error) {
      console.error('Error setting up native listeners:', error);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setPhoneError('');

    // Validate phone number length (flexible for international numbers)
    if (!phoneNumber || phoneNumber.length < 6 || phoneNumber.length > 15) {
      setPhoneError('Please enter a valid mobile number (6-15 digits)');
      return;
    }

    // Validate country code
    if (!countryCode || !countryCode.startsWith('+')) {
      setPhoneError('Please enter a valid country code (e.g., +49, +91)');
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhoneNumber = `${countryCode}${phoneNumber}`;
      console.log('📱 Attempting to send OTP to:', formattedPhoneNumber);

      if (Capacitor.isNativePlatform()) {
        console.log('📱 Using Native Platform OTP flow');
        // Native Android/iOS implementation - Listeners will handle the rest
        const result = await FirebaseAuthentication.signInWithPhoneNumber({
          phoneNumber: formattedPhoneNumber,
        });
        console.log('📱 Native signInWithPhoneNumber result:', result);
      } else {
        // Web implementation
        if (!window.recaptchaVerifier) {
          // Attempt re-init if missing
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
          });
        }
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        setVerificationId(confirmationResult.verificationId);
        setOtpSent(true);
        setIsLoading(false);
        toast.success('OTP sent successfully!');
      }

    } catch (error) {
      console.error('Error sending OTP:', error);
      if (!Capacitor.isNativePlatform() && window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) { /* ignore */ }
      }
      toast.error('Failed to send OTP. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      let user;

      if (Capacitor.isNativePlatform()) {
        // Use the plugin to confirm the code manually
        const result = await FirebaseAuthentication.confirmVerificationCode({
          verificationId: verificationId,
          verificationCode: otp,
        });
        user = result.user;
      } else {
        // Web verification
        const confirmationResult = window.confirmationResult;
        if (!confirmationResult) throw new Error('No verification session found');
        const result = await confirmationResult.confirm(otp);
        user = result.user;
      }

      await proceedWithAuth(user);
    } catch (error) {
      console.error('OTP verification error detail:', error);

      let errorMessage = 'Error verifying OTP. Please try again.';

      if (error.code) {
        // Firebase Auth error codes
        switch (error.code) {
          case 'auth/invalid-verification-code':
            errorMessage = 'Invalid verification code. Please check and try again.';
            break;
          case 'auth/code-expired':
            errorMessage = 'Verification code has expired. Please request a new one.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage = 'Recaptcha check failed. Please try again.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setOtpError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const proceedWithAuth = async (user) => {
    try {
      // Get ID token using Firebase Authentication plugin's method or Web SDK
      let idToken;
      if (Capacitor.isNativePlatform()) {
        const tokenResult = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
        idToken = tokenResult.token;
      } else {
        idToken = await user.getIdToken(true);
      }

      if (!idToken) throw new Error("Failed to retrieve ID Token");

      // Send idToken to your backend for verification and session creation
      const endpoint = '/auth/firebase-login';
      const response = await api.post(endpoint, {
        token: idToken,
        userType: userType
      });

      const data = response.data;

      if (data.isNewUser || data.requiresRegistration) {
        // Use phone number from backend response if available, otherwise use local state
        const verifiedPhone = data.phoneNumber || phoneNumber;
        console.log(`🆕 New user detected - redirecting to registration with phone: ${verifiedPhone}`);
        toast.info('Welcome! Please complete your registration.', { autoClose: 4000 });
        navigate(`/${userType}/form-register`, {
          state: { phoneNumber: verifiedPhone },
          replace: true
        });
        return;
      }

      if (data.success) {
        const userData = {
          ...data.data,
          type: userType,
          isLoggedIn: 1,
          lastLogin: new Date().toISOString()
        };

        localStorage.setItem('userType', userType);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        localStorage.setItem('authToken', data.token);

        if (userType === 'employer') {
          localStorage.setItem('employerProfile', JSON.stringify(userData));
          localStorage.setItem('employerId', userData.id || userData._id);
        }

        loginUser(userData);

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
      const errorMessage = error.response?.data?.message || error.message || 'Error verifying OTP. Please try again.';
      setOtpError(errorMessage);
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
            Connecting workers and employers worldwide
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-[#3B4883]/10 rounded-3xl p-8 shadow-2xl">
          {/* Invisible reCAPTCHA container for Web */}
          <div id="recaptcha-container"></div>

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
                <div className="flex gap-2">
                  {/* Country Code Selector */}
                  <div className="relative w-32">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        setPhoneError('');
                      }}
                      className="w-full px-3 py-4 bg-white border-2 border-[#3B4883]/10 rounded-2xl text-lg font-semibold focus:outline-none focus:border-[#FF7124] focus:ring-4 focus:ring-[#FF7124]/10 appearance-none cursor-pointer"
                    >
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+7">🇷🇺 +7</option>
                      <option value="+27">🇿🇦 +27</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+82">🇰🇷 +82</option>
                    </select>
                  </div>
                  {/* Phone Number Input */}
                  <div className="relative flex-1">
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
                      placeholder="Mobile number"
                      className={`w-full pl-12 pr-4 py-4 bg-white border-2 rounded-2xl text-lg font-semibold placeholder:text-gray-300 focus:outline-none transition-all ${phoneError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[#3B4883]/10 focus:border-[#FF7124] focus:ring-4 focus:ring-[#FF7124]/10'
                        }`}
                      maxLength="15"
                      required
                    />
                  </div>
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
