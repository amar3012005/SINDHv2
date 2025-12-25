import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Briefcase, Users } from 'lucide-react';
import logo from '../assets/logo.svg';

// Gemini API integration for multilingual content
const generateMultilingualWalkthroughContent = async (userType, language, apiKey) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate walkthrough steps for a ${userType} on SINDH job platform in ${language}. Return only JSON in this format:
            {
              "intentTitle": "How would you like to use SINDH?",
              "intentSubtitle": "Choose your path to get started",
              "workerIntent": "I want to find work",
              "workerIntentDesc": "Browse and apply for available jobs",
              "employerIntent": "I want to post work", 
              "employerIntentDesc": "Find and hire skilled workers",
              "steps": [
                {"title": "Step Title", "description": "Step description", "icon": "🔍"},
                {"title": "Next Step", "description": "Next description", "icon": "⚡"}
              ]
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
    console.error('Error fetching multilingual walkthrough content:', error);
    // Fallback content
    const defaultSteps = userType === 'worker' ? WORKER_STEPS : EMPLOYER_STEPS;
    return {
      intentTitle: "How would you like to use SINDH?",
      intentSubtitle: "Choose your path to get started",
      workerIntent: "I want to find work",
      workerIntentDesc: "Browse and apply for available jobs",
      employerIntent: "I want to post work",
      employerIntentDesc: "Find and hire skilled workers",
      steps: defaultSteps
    };
  }
};

const WORKER_STEPS = [
  {
    title: 'Find Jobs',
    description: 'Browse available jobs in your area',
    icon: '🔍'
  },
  {
    title: 'Apply with One Click',
    description: 'Submit your application in seconds',
    icon: '⚡'
  },
  {
    title: 'Get Hired',
    description: 'Employers will review and accept your application',
    icon: '✅'
  },
  {
    title: 'Start Working',
    description: 'Begin your job and track your progress',
    icon: '👷'
  },
  {
    title: 'Get Paid',
    description: 'Receive secure payments upon job completion',
    icon: '💰'
  }
];

const EMPLOYER_STEPS = [
  {
    title: 'Post a Job',
    description: 'Create a detailed job listing',
    icon: '📝'
  },
  {
    title: 'Review Applications',
    description: 'View and manage worker applications',
    icon: '📋'
  },
  {
    title: 'Hire Workers',
    description: 'Select the best candidates for your job',
    icon: '🤝'
  },
  {
    title: 'Track Progress',
    description: 'Monitor work progress in real-time',
    icon: '📊'
  },
  {
    title: 'Make Payment',
    description: 'Release secure payments upon completion',
    icon: '💳'
  }
];

// Logo component with fallback
const LogoWithFallback = ({ className }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div className={`${className} bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center`}>
        <span className="text-indigo-600 font-bold text-2xl">I</span>
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

// Enhanced button component
const AnimatedButton = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseClasses = "relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-white text-black shadow-lg hover:shadow-xl hover:bg-gray-100",
    secondary: "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:shadow-lg",
    outline: "border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/40"
  };

  return (
    <motion.button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

const Walkthrough = () => {
  const [currentStep, setCurrentStep] = useState('intent');
  const [userType, setUserType] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [content, setContent] = useState({
    intentTitle: "How would you like to use SINDH?",
    intentSubtitle: "Choose your path to get started",
    workerIntent: "I want to find work",
    workerIntentDesc: "Browse and apply for available jobs",
    employerIntent: "I want to post work",
    employerIntentDesc: "Find and hire skilled workers",
    steps: WORKER_STEPS
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const steps = content.steps;

  // Fetch content based on user type and language
  useEffect(() => {
    const fetchContent = async () => {
      if (!userType) return;
      
      const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
      const preferredLanguage = localStorage.getItem('user_preferred_language') || 'en';
      const languageName = preferredLanguage === 'en' ? 'English' : 
                          preferredLanguage === 'hi' ? 'Hindi' :
                          preferredLanguage === 'te' ? 'Telugu' :
                          preferredLanguage === 'ta' ? 'Tamil' :
                          preferredLanguage === 'kn' ? 'Kannada' :
                          preferredLanguage === 'ml' ? 'Malayalam' :
                          preferredLanguage === 'bn' ? 'Bengali' :
                          preferredLanguage === 'gu' ? 'Gujarati' :
                          preferredLanguage === 'mr' ? 'Marathi' :
                          preferredLanguage === 'pa' ? 'Punjabi' : 'English';

      if (!geminiApiKey) {
        console.warn('Gemini API key not found, using fallback content');
        return;
      }

      setIsLoading(true);
      const newContent = await generateMultilingualWalkthroughContent(userType, languageName, geminiApiKey);
      setContent(newContent);
      setIsLoading(false);
    };

    fetchContent();
  }, [userType]);

  const handleIntentSelect = (type) => {
    setUserType(type);
    localStorage.setItem('userType', type);
    setCurrentStep('steps');
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else {
      setCurrentStep('intent');
      setStepIndex(0);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasCompletedWalkthrough', 'true');
    navigate('/');
  };

  const handleSkip = () => {
    localStorage.setItem('hasCompletedWalkthrough', 'true');
    navigate('/');
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

      {/* Skip button */}
      <motion.button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 px-4 py-2 text-sm text-white/70 hover:text-white bg-white/10 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-200 border border-white/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Skip
      </motion.button>

      <AnimatePresence mode="wait">
        {currentStep === 'intent' ? (
          <motion.div
            key="intent-selection"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -30 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-lg relative z-10"
          >
            {/* Logo */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <div className="relative">
                <LogoWithFallback className="w-16 h-16 mx-auto drop-shadow-lg filter invert brightness-0" />
                <motion.div 
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 opacity-0 -z-10"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                />
              </div>
            </motion.div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10">
              {isLoading ? (
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <>
                  <motion.h1 
                    className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {content.intentTitle}
                  </motion.h1>
                  <motion.p 
                    className="text-gray-300 text-center mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {content.intentSubtitle}
                  </motion.p>
                </>
              )}
              
              <div className="space-y-4">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  whileHover={{ scale: 1.02, boxShadow: '0 15px 35px -5px rgba(99, 102, 241, 0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleIntentSelect('worker')}
                  className="w-full flex items-center justify-between p-6 bg-white/10 border-2 border-white/20 rounded-2xl hover:border-white/40 transition-all duration-300 shadow-sm group relative overflow-hidden"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="text-left relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <Briefcase className="w-5 h-5 text-white" />
                      <h2 className="text-xl font-semibold text-white group-hover:text-gray-200 transition-colors">{content.workerIntent}</h2>
                    </div>
                    <p className="text-gray-300 ml-8">{content.workerIntentDesc}</p>
                  </div>
                  <div className="text-4xl relative z-10">👷‍♂️</div>
                </motion.button>
                
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  whileHover={{ scale: 1.02, boxShadow: '0 15px 35px -5px rgba(99, 102, 241, 0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleIntentSelect('employer')}
                  className="w-full flex items-center justify-between p-6 bg-white/10 border-2 border-white/20 rounded-2xl hover:border-white/40 transition-all duration-300 shadow-sm group relative overflow-hidden"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="text-left relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <Users className="w-5 h-5 text-white" />
                      <h2 className="text-xl font-semibold text-white group-hover:text-gray-200 transition-colors">{content.employerIntent}</h2>
                    </div>
                    <p className="text-gray-300 ml-8">{content.employerIntentDesc}</p>
                  </div>
                  <div className="text-4xl relative z-10">💼</div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`step-${stepIndex}`}
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -30 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-lg relative z-10"
          >
            {/* Logo */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <LogoWithFallback className="w-12 h-12 mx-auto drop-shadow-lg filter invert brightness-0" />
            </motion.div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10">
              {/* Progress indicator */}
              <div className="flex justify-center mb-6">
                <div className="flex space-x-2">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index <= stepIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    />
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2 mb-8 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-white to-gray-200 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              
              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="text-center"
                >
                  <motion.div 
                    className="text-8xl mb-6 drop-shadow-lg"
                    initial={{ scale: 0.5, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    {steps[stepIndex].icon}
                  </motion.div>
                  
                  <motion.h2 
                    className="text-3xl font-bold text-white mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {steps[stepIndex].title}
                  </motion.h2>
                  
                  <motion.p 
                    className="text-gray-300 mb-8 text-lg leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {steps[stepIndex].description}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
              
              {/* Navigation Buttons */}
              <motion.div 
                className="flex justify-between items-center mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatedButton
                  onClick={handleBack}
                  variant="secondary"
                  disabled={stepIndex === 0}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </AnimatedButton>
                
                <AnimatedButton
                  onClick={handleNext}
                  variant="primary"
                  className="flex items-center"
                >
                  {stepIndex === steps.length - 1 ? (
                    <>
                      Get Started
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </AnimatedButton>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add global styles for animations (matching Homepage) */}
      <style jsx global>{`
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

export default Walkthrough;
