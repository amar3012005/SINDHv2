import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Briefcase, Users } from 'lucide-react';
import logo from '../assets/logo.svg';

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
      alt="INDUS Logo" 
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

// Enhanced button component
const AnimatedButton = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseClasses = "relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-700",
    secondary: "bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-lg",
    outline: "border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400"
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
  const navigate = useNavigate();

  const steps = userType === 'worker' ? WORKER_STEPS : EMPLOYER_STEPS;

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements - matching GreetingPage */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-20 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Skip button */}
      <motion.button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-200"
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
                <LogoWithFallback className="w-16 h-16 mx-auto drop-shadow-lg" />
                <motion.div 
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 opacity-0 -z-10"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                />
              </div>
            </motion.div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100">
              <motion.h1 
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                How would you like to use INDUS?
              </motion.h1>
              <motion.p 
                className="text-gray-600 text-center mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Choose your path to get started
              </motion.p>
              
              <div className="space-y-4">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  whileHover={{ scale: 1.02, boxShadow: '0 15px 35px -5px rgba(99, 102, 241, 0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleIntentSelect('worker')}
                  className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-white to-blue-50 border-2 border-indigo-100 rounded-2xl hover:border-indigo-300 transition-all duration-300 shadow-sm group relative overflow-hidden"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="text-left relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">I want to find work</h2>
                    </div>
                    <p className="text-gray-600 ml-8">Browse and apply for available jobs</p>
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
                  className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-white to-purple-50 border-2 border-indigo-100 rounded-2xl hover:border-indigo-300 transition-all duration-300 shadow-sm group relative overflow-hidden"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="text-left relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">I want to post work</h2>
                    </div>
                    <p className="text-gray-600 ml-8">Find and hire skilled workers</p>
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
              <LogoWithFallback className="w-12 h-12 mx-auto drop-shadow-lg" />
            </motion.div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100">
              {/* Progress indicator */}
              <div className="flex justify-center mb-6">
                <div className="flex space-x-2">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index <= stepIndex ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    />
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-8 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2 rounded-full"
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
                    className="text-3xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {steps[stepIndex].title}
                  </motion.h2>
                  
                  <motion.p 
                    className="text-gray-600 mb-8 text-lg leading-relaxed"
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
    </div>
  );
};

export default Walkthrough;
