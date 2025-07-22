import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.svg';
import { motion, AnimatePresence } from 'framer-motion';

// Custom language button component
const LanguageButton = ({ lang, onSelect, delay }) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
    whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(lang.code)}
    className="relative p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-200 overflow-hidden group"
  >
    <div className="relative z-10">
      <div className="font-medium text-gray-800 text-sm sm:text-base">{lang.native}</div>
      <div className="text-xs text-gray-500">{lang.name}</div>
    </div>
    <motion.div 
      className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      initial={{ opacity: 0 }}
    />
  </motion.button>
);

// Error boundary for logo loading
const LogoWithFallback = ({ className }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div className={`${className} bg-gray-200 rounded-full flex items-center justify-center`}>
        <span className="text-gray-600 font-bold text-2xl">I</span>
      </div>
    );
  }
  
  return (
    <img 
      src={logo} 
      alt="INDUS Logo" 
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

const GreetingPage = () => {
  // Debug function to reset all local storage flags
  const resetAllFlags = () => {
    localStorage.removeItem('hasSeenGreeting');
    localStorage.removeItem('selectedLanguage');
    console.log('All flags reset. hasSeenGreeting:', localStorage.getItem('hasSeenGreeting'));
    window.location.reload();
  };
  
  // Language data with flags (using emoji for simplicity)
  const languages = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
  ].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  // const [animationComplete, setAnimationComplete] = useState(false); // Unused for now
  // const { setLanguage } = useLanguage(); // Not setting language at greeting time
  const navigate = useNavigate();
  
  // Animation sequence control - commented out since animationComplete is unused
  // useEffect(() => {
  //   const timer = setTimeout(() => setAnimationComplete(true), 500);
  //   return () => clearTimeout(timer);
  // }, []);



  const handleLanguageSelect = (selectedLanguage) => {
    try {
      // Only save user_preferred state, do NOT setLanguage context yet
      localStorage.setItem('user_preferred_language', selectedLanguage);
      localStorage.setItem('hasSeenGreeting', 'true');
      
      // Navigate to walkthrough after language selection
      navigate('/walkthrough');
      
    } catch (error) {
      console.error('Error saving preferred language:', error);
    }
  };

  const handleResetGreeting = () => {
    localStorage.removeItem('hasSeenGreeting');
    localStorage.removeItem('selectedLanguage');
    console.log('Greeting and language preferences reset.');
    alert('Greeting and language preferences have been reset. The page will now reload.');
    window.location.reload();
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-20 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Debug buttons - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={resetAllFlags}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-200"
            title="Reset all flags (debug)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
      
      <AnimatePresence>
        <motion.div 
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <div className="relative">
              <LogoWithFallback className="w-24 h-24 sm:w-28 sm:h-28 mx-auto drop-shadow-lg" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 opacity-0 group-hover:opacity-100 -z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 0.3 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
              />
            </div>
          </motion.div>

          {/* Greeting */}
          <motion.div 
            className="text-center mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Namaste!
            </motion.h1>
            <motion.p 
              className="text-gray-600 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Welcome to INDUS
            </motion.p>
            <motion.p 
              className="text-sm text-gray-500 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Connecting India's Workforce
            </motion.p>
          </motion.div>

          {/* Language Selection */}
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
          >
            <motion.h3 
              className="text-lg font-semibold text-gray-800 mb-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Choose your language
            </motion.h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {languages.map((lang, index) => (
                <LanguageButton 
                  key={lang.code} 
                  lang={lang} 
                  onSelect={handleLanguageSelect}
                  delay={0.8 + (index * 0.1)}
                />
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1.2 }}
          >
            <p className="text-xs text-gray-500">
              Select your preferred language to continue
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default GreetingPage; 