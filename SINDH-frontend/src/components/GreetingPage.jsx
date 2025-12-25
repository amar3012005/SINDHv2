import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.svg';
import { motion, AnimatePresence } from 'framer-motion';

// Gemini API integration for multilingual content
const generateMultilingualContent = async (language, apiKey) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate welcome message and description text for a job platform called SINDH in ${language}. Return only the translations in this format:
            {
              "welcome": "Welcome message (like Namaste/Hello)",
              "platform": "Platform name description (Welcome to SINDH)",
              "description": "Brief description (Connecting India's Workforce)"
            }`
          }]
        }]
      })
    });
    
    if (!response.ok) throw new Error('Failed to fetch from Gemini API');
    
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error fetching multilingual content:', error);
    // Fallback content
    return {
      welcome: "Namaste!",
      platform: "Welcome to SINDH",
      description: "Connecting India's Workforce"
    };
  }
};

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
      alt="SINDH Logo" 
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

const GreetingPage = () => {
  const [content, setContent] = useState({
    welcome: "Namaste!",
    platform: "Welcome to SINDH",
    description: "Connecting India's Workforce"
  });
  const [selectedLang, setSelectedLang] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  
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
  const navigate = useNavigate();

  // Fetch content for selected language using Gemini API
  useEffect(() => {
    const fetchContent = async () => {
      const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!geminiApiKey) {
        console.warn('Gemini API key not found, using fallback content');
        return;
      }

      setIsLoading(true);
      const selectedLanguage = languages.find(l => l.code === selectedLang);
      if (selectedLanguage) {
        const newContent = await generateMultilingualContent(selectedLanguage.name, geminiApiKey);
        setContent(newContent);
      }
      setIsLoading(false);
    };

    fetchContent();
  }, [selectedLang]);
  
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

  // Handle language preview (hover to see content in that language)
  const handleLanguagePreview = async (langCode) => {
    setSelectedLang(langCode);
  };

  const handleResetGreeting = () => {
    localStorage.removeItem('hasSeenGreeting');
    localStorage.removeItem('selectedLanguage');
    console.log('Greeting and language preferences reset.');
    alert('Greeting and language preferences have been reset. The page will now reload.');
    window.location.reload();
  };



  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 flex items-center justify-center p-4 relative overflow-hidden devanagari">
      {/* Dark aurora background (matching Homepage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft radial vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)',
          }}
        />
        {/* Star trails effect */}
        <div className="startrails absolute inset-0"></div>
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Grain */}
        <div className="absolute inset-0 opacity-10 noise-bg mix-blend-overlay" />
        {/* Aurora animated background */}
        <div className="aurora absolute inset-0">
          <span className="aurora-blob aurora-a" />
          <span className="aurora-blob aurora-b" />
          <span className="aurora-blob aurora-c" />
        </div>
      </div>

      {/* Debug buttons - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={resetAllFlags}
            className="p-2 bg-white/10 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-200 border border-white/20"
            title="Reset all flags (debug)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          {/* Logo and Title */}
          <motion.div 
            className="flex flex-col items-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <div className="relative mb-4">
              <LogoWithFallback className="w-24 h-24 sm:w-28 sm:h-28 mx-auto drop-shadow-lg filter invert brightness-0" />
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 opacity-0 -z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 0.3 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
              />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight text-white">
                S I N D H
              </h1>
            </div>
          </motion.div>

          {/* Greeting */}
          <motion.div 
            className="text-center mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <>
                <motion.h2 
                  className="text-4xl sm:text-5xl font-bold text-white mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {content.welcome}
                </motion.h2>
                <motion.p 
                  className="text-gray-300 text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {content.platform}
                </motion.p>
                <motion.p 
                  className="text-sm text-gray-400 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {content.description}
                </motion.p>
              </>
            )}
          </motion.div>

          {/* Language Selection */}
          <motion.div 
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/10"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
          >
            <motion.h3 
              className="text-lg font-semibold text-white mb-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Choose your language
            </motion.h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {languages.map((lang, index) => (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (0.8 + (index * 0.1)), type: 'spring', stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.03, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLanguageSelect(lang.code)}
                  onMouseEnter={() => handleLanguagePreview(lang.code)}
                  className="relative p-2 bg-white/10 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-white/20 hover:border-white/40 overflow-hidden group"
                >
                  <div className="relative z-10">
                    <div className="font-medium text-white text-sm sm:text-base">{lang.native}</div>
                    <div className="text-xs text-gray-300">{lang.name}</div>
                  </div>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ opacity: 0 }}
                  />
                </motion.button>
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
            <p className="text-xs text-gray-400">
              Select your preferred language to continue
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Add global styles for animations (matching Homepage) */}
      <style>{`
        /* Devanagari font stack for Hindi */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
        .devanagari {
          font-family: 'Noto Sans Devanagari', 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
        }

        /* Subtle film grain */
        .noise-bg {
          background-image: url('data:image/svg+xml;utf8,\\
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\\
              <filter id="noise">\\
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>\\
                <feColorMatrix type="saturate" values="0"/>\\
                <feComponentTransfer>\\
                  <feFuncA type="table" tableValues="0 0.2"/>\\
                </feComponentTransfer>\\
              </filter>\\
              <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/>\\
            </svg>');
        }

        /* Aurora effect */
        .aurora-blob {
          position: absolute;
          width: 60vmax;
          height: 60vmax;
          filter: blur(60px);
          opacity: 0.2;
        }
        .aurora-a { background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%); left: -20vmax; top: -10vmax; animation: drift 18s ease-in-out infinite; }
        .aurora-b { background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%); right: -25vmax; top: -5vmax; animation: drift 22s ease-in-out infinite reverse; }
        .aurora-c { background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%); left: 10vmax; bottom: -20vmax; animation: drift 26s ease-in-out infinite; }
        @keyframes drift {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(5vmax, -3vmax, 0) rotate(20deg); }
        }

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

export default GreetingPage; 