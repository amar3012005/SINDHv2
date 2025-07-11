import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, User, Building, MapPin, FileText, Phone, Mail, Award, Calendar, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { API_BASE_URL } from '../../config';
import { useSpring, animated as a } from '@react-spring/web';
import Logo from '../../assets/logo.svg';

// --- Animated Organic Blob Background (React Spring) ---
const AnimatedBlob = ({ style, className }) => {
  const blobSpring = useSpring({
    from: { x: 0, y: 0 },
    to: async (next) => {
      while (1) {
        await next({ x: Math.random() * 40 - 20, y: Math.random() * 40 - 20 });
      }
    },
    config: { mass: 2, tension: 60, friction: 30 },
  });
  return (
    <a.svg
      style={{ ...blobSpring, ...style, position: 'absolute', zIndex: 0 }}
      className={className}
      aria-hidden="true"
      viewBox="0 0 200 200"
      width="320"
      height="320"
      fill="currentColor"
    >
      <path d="M44.8,-70.2C57.2,-62.2,65.7,-47.2,72.2,-32.1C78.7,-17,83.2,-1.8,80.2,11.7C77.2,25.2,66.7,36.9,55.1,47.2C43.5,57.5,30.8,66.3,16.2,71.2C1.6,76.1,-14.9,77.1,-29.2,71.2C-43.5,65.3,-55.6,52.5,-65.2,38.2C-74.8,23.9,-81.9,8.1,-80.2,-7.7C-78.5,-23.5,-68,-39.2,-55.2,-47.7C-42.4,-56.2,-27.2,-57.5,-12.2,-63.2C2.8,-68.9,17.6,-79.1,32.2,-78.2C46.8,-77.3,61.2,-65.2,44.8,-70.2Z" transform="translate(100 100)" />
    </a.svg>
  );
};

// --- Animated Progress Dots ---
const ProgressDots = ({ current, total }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {[...Array(total)].map((_, i) => (
        <motion.div
          key={i}
          className={`w-3 h-3 rounded-full ${i <= current ? 'bg-orange-400' : 'bg-white/30'} shadow transition-colors`}
          initial={{ scale: 0.7, opacity: 0.5 }}
          animate={{ scale: i === current ? 1.2 : 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      ))}
      <div className="absolute w-full h-1 top-1/2 left-0 -z-10 flex items-center">
        <div className="w-full h-1 bg-gradient-to-r from-orange-400 to-orange-200 opacity-30 rounded-full" />
      </div>
    </div>
  );
};

// --- Glassmorphic Card Wrapper ---
const GlassCard = ({ children, className }) => (
  <div className={`backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-4 md:p-8 ${className}`} style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
    {children}
  </div>
);

// --- Animated Emoji/Blob Avatar ---
const BotAvatar = ({ animate = false }) => (
  <motion.span
    className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-300 text-3xl shadow-lg border-4 border-white/20"
    initial={{ scale: 0.9 }}
    animate={{ scale: animate ? [1, 1.15, 1] : 1, rotate: animate ? [0, 8, -8, 0] : 0 }}
    transition={{ duration: 1, repeat: animate ? Infinity : 0, repeatType: 'loop' }}
    aria-label="Bot"
  >
    🟠
  </motion.span>
);

const EnhancedEmployerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [userResponses, setUserResponses] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Keep the same form data structure as original
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: {
      name: '',
      type: '',
      industry: ''
    },
    location: {
      village: '',
      district: '',
      state: '',
      pincode: '',
      coordinates: {
        type: "Point",
        coordinates: [0, 0]
      }
    },
    businessDescription: '',
    verificationDocuments: {
      aadharNumber: '',
      panNumber: '',
      businessLicense: ''
    },
    documents: [],
    preferredLanguages: [],
    rating: {
      average: 0,
      count: 0
    },
    reviews: [],
    otp: {
      code: null,
      expiresAt: null
    },
    verificationStatus: 'pending'
  });

  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const businessTypeOptions = [
    'Agricultural Farm',
    'Small Scale Industry',
    'Local Shop/Business',
    'Construction Company',
    'Food Processing Unit',
    'Handicraft Unit',
    'Dairy Farm',
    'Poultry Farm',
    'Other'
  ];

  const industryOptions = [
    'Agriculture',
    'Dairy Farming',
    'Poultry',
    'Handicrafts',
    'Food Processing',
    'Construction',
    'Local Trade',
    'Small Manufacturing',
    'Other'
  ];

  // Convert the original steps to chat-style questions
  const chatQuestions = [
    {
      id: 'welcome',
      type: 'system',
      text: "👋 Welcome to SINDH! I'm here to help you create your employer profile so you can start posting jobs and finding skilled workers. Ready to get started?",
      field: null,
      suggestions: ['Yes, let\'s start!', 'I\'m ready to begin']
    },
    {
      id: 'name',
      type: 'question',
      text: "Great! Let's start with your full name?",
      field: 'name',
      validation: (value) => value.trim().length >= 2 ? null : "Please enter your full name"
    },
    {
      id: 'phone',
      type: 'question',
      text: "What's your mobile number? Please enter 10 digits without country code (like 9876543210)",
      field: 'phone',
      validation: (value) => {
        const cleaned = value.replace(/[^\d]/g, '');
        return cleaned.length === 10 ? null : "Please enter a valid 10-digit mobile number";
      }
    },
    {
      id: 'email',
      type: 'question',
      text: "What's your email address? This will be used for important notifications.",
      field: 'email',
      validation: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : "Please enter a valid email address";
      }
    },
    {
      id: 'aadhar',
      type: 'question',
      text: "For verification, please enter your 12-digit Aadhar number:",
      field: 'aadharNumber',
      validation: (value) => {
        const cleaned = value.replace(/[^\d]/g, '');
        return cleaned.length === 12 ? null : "Please enter a valid 12-digit Aadhar number";
      }
    },
    {
      id: 'businessName',
      type: 'question',
      text: "What's the name of your business or farm?",
      field: 'businessName',
      validation: (value) => value.trim().length >= 2 ? null : "Please enter your business name"
    },
    {
      id: 'businessType',
      type: 'question',
      text: "What type of business do you run?",
      field: 'businessType',
      suggestions: businessTypeOptions,
      validation: (value) => value.trim() ? null : "Please select your business type"
    },
    {
      id: 'industry',
      type: 'question',
      text: "What's your primary industry or activity?",
      field: 'industry',
      suggestions: industryOptions,
      validation: (value) => value.trim() ? null : "Please select your primary industry"
    },
    {
      id: 'village',
      type: 'question',
      text: "Which village or town is your business located in?",
      field: 'village',
      validation: (value) => value.trim() ? null : "Please enter your village/town"
    },
    {
      id: 'district',
      type: 'question',
      text: "Which district?",
      field: 'district',
      validation: (value) => value.trim() ? null : "Please enter your district"
    },
    {
      id: 'state',
      type: 'question',
      text: "Which state?",
      field: 'state',
      validation: (value) => value.trim() ? null : "Please enter your state"
    },
    {
      id: 'pincode',
      type: 'question',
      text: "What's your area pincode?",
      field: 'pincode',
      validation: (value) => {
        const cleaned = value.replace(/[^\d]/g, '');
        return cleaned.length === 6 ? null : "Please enter a valid 6-digit pincode";
      }
    },
    {
      id: 'businessDescription',
      type: 'question',
      text: "Tell me about your business and what kind of workers you typically need. This helps workers understand what you do!",
      field: 'businessDescription',
      validation: (value) => value.trim().length >= 10 ? null : "Please provide a brief description of your business"
    },
    {
      id: 'summary',
      type: 'summary',
      text: "📋 Here's a summary of your registration details. Please review and submit:",
      field: null
    },
    {
      id: 'complete',
      type: 'system',
      text: "🎉 Excellent! Your employer profile has been created successfully!",
      field: null
    }
  ];

  // Pre-fill phone number from login if available
  useEffect(() => {
    if (location.state?.phoneNumber) {
      setUserResponses(prev => ({
        ...prev,
        phone: location.state.phoneNumber
      }));
      
      // Find the phone question and skip it
      const phoneQuestionIndex = chatQuestions.findIndex(q => q.field === 'phone');
      if (phoneQuestionIndex > 0) {
        // Start with welcome, then skip to after phone
        addBotMessage(
          `👋 Welcome back! I see you're registering with ${location.state.phoneNumber}. Let's create your employer profile together!`,
          ['Yes, let\'s start!']
        );
        return;
      }
    }

    // Start normal conversation
    addBotMessage(chatQuestions[0].text, chatQuestions[0].suggestions);
  }, [location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (text, suggestions = null, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].text === text && prev[prev.length - 1].sender === 'bot') {
          setIsTyping(false);
          if (suggestions) {
            setCurrentSuggestions(suggestions);
            setShowSuggestions(true);
          }
          setIsWaitingForInput(true);
          return prev;
        }
        return [
          ...prev,
          {
            id: Date.now(),
            text,
            sender: 'bot',
            timestamp: new Date()
          }
        ];
      });
      setIsTyping(false);
      if (suggestions) {
        setCurrentSuggestions(suggestions);
        setShowSuggestions(true);
      }
      setIsWaitingForInput(true);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
    setCurrentInput('');
    setShowSuggestions(false);
    setIsWaitingForInput(false);
  };

  const processUserResponse = async (response) => {
    let question = chatQuestions[currentQuestion];
    
    // Handle submit button click
    if (response === 'Submit Registration') {
      await submitRegistration();
      return;
    }
    
    // Call backend when user starts (after welcome message)
    if (question.id === 'welcome' && (response === "Yes, let's start!" || response === "I'm ready to begin")) {
      try {
        console.log("🎉 Employer registration initiated!");
        console.log("Calling API:", `${API_BASE_URL}/api/employers/initiate-registration`);
        
        // Call backend to log registration initiated
        const apiResponse = await fetch(`${API_BASE_URL}/api/employers/initiate-registration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'initiate' })
        });

        console.log("Response status:", apiResponse.status);
        console.log("Response ok:", apiResponse.ok);

        if (apiResponse.ok) {
          const result = await apiResponse.json();
          console.log('Backend response:', result);
          
          // Show success message
          setTimeout(() => {
            addBotMessage("🎉 Employer registration initiated! Backend is responding. Let's gather your information...", null, 800);
          }, 500);
        } else {
          const errorText = await apiResponse.text();
          console.error('Response error:', errorText);
          throw new Error(`Backend responded with status: ${apiResponse.status}`);
        }
      } catch (error) {
        console.error('Error calling backend:', error);
        console.error('Error details:', error.message);
        setTimeout(() => {
          addBotMessage(`❌ Backend connection failed: ${error.message}. Please check if the server is running.`, ['Try Again'], 800);
        }, 500);
        return;
      }
    }
    
    // Handle phone number pre-fill case
    if (location.state?.phoneNumber && currentQuestion === 0) {
      // Skip to name question after welcome
      const nameQuestionIndex = chatQuestions.findIndex(q => q.field === 'name');
      if (nameQuestionIndex > 0) {
        setCurrentQuestion(nameQuestionIndex);
        question = chatQuestions[nameQuestionIndex];
      }
    }
    
    if (question.field) {
      let processedResponse = response;
      
      // Handle special field processing
      if (question.field === 'phone') {
        processedResponse = response.replace(/[^\d]/g, '');
      } else if (question.field === 'aadharNumber') {
        processedResponse = response.replace(/[^\d]/g, '');
      } else if (question.field === 'pincode') {
        processedResponse = response.replace(/[^\d]/g, '');
      }
      
      // Update both userResponses and formData
      setUserResponses(prev => ({
        ...prev,
        [question.field]: processedResponse
      }));
      
      // Update formData with the same structure as original
      if (question.field === 'name') {
        setFormData(prev => ({ ...prev, name: processedResponse }));
      } else if (question.field === 'phone') {
        setFormData(prev => ({ ...prev, phone: processedResponse }));
      } else if (question.field === 'email') {
        setFormData(prev => ({ ...prev, email: processedResponse }));
      } else if (question.field === 'aadharNumber') {
        setFormData(prev => ({ 
          ...prev, 
          verificationDocuments: { 
            ...prev.verificationDocuments, 
            aadharNumber: processedResponse 
          } 
        }));
      } else if (question.field === 'businessName') {
        setFormData(prev => ({ 
          ...prev, 
          company: { 
            ...prev.company, 
            name: processedResponse 
          } 
        }));
      } else if (question.field === 'businessType') {
        setFormData(prev => ({ 
          ...prev, 
          company: { 
            ...prev.company, 
            type: processedResponse 
          } 
        }));
      } else if (question.field === 'industry') {
        setFormData(prev => ({ 
          ...prev, 
          company: { 
            ...prev.company, 
            industry: processedResponse 
          } 
        }));
      } else if (question.field === 'village') {
        setFormData(prev => ({ 
          ...prev, 
          location: { 
            ...prev.location, 
            village: processedResponse 
          } 
        }));
      } else if (question.field === 'district') {
        setFormData(prev => ({ 
          ...prev, 
          location: { 
            ...prev.location, 
            district: processedResponse 
          } 
        }));
      } else if (question.field === 'state') {
        setFormData(prev => ({ 
          ...prev, 
          location: { 
            ...prev.location, 
            state: processedResponse 
          } 
        }));
      } else if (question.field === 'pincode') {
        setFormData(prev => ({ 
          ...prev, 
          location: { 
            ...prev.location, 
            pincode: processedResponse 
          } 
        }));
      } else if (question.field === 'businessDescription') {
        setFormData(prev => ({ ...prev, businessDescription: processedResponse }));
      }
    }

    // Move to next question
    let nextQuestionIndex = currentQuestion + 1;
    
    // Skip phone question if we already have it
    if (location.state?.phoneNumber && chatQuestions[nextQuestionIndex]?.field === 'phone') {
      nextQuestionIndex += 1;
    }
    
    if (nextQuestionIndex < chatQuestions.length && nextQuestionIndex !== currentQuestion) {
      setCurrentQuestion(nextQuestionIndex);
      
      // Check if we're moving to the summary step
      const nextQ = chatQuestions[nextQuestionIndex];
      if (nextQ.id === 'summary') {
        // Just move to summary step, UI will handle the display
        setIsWaitingForInput(false);
      } else {
        // Enable input for the next question if it requires input
        setIsWaitingForInput(!!nextQ.field);
      }
    }
  };

  // Function to submit registration
  const submitRegistration = async () => {
    setIsSubmitting(true);
    try {
      // Debug: Log current form data
      console.log('🔍 Current formData:', formData);
      console.log('🔍 Current userResponses:', userResponses);
      
      // Ensure phone number is properly formatted (remove spaces and ensure it starts with 6-9)
      let phoneNumber = formData.phone || userResponses.phone;
      console.log('🔍 Raw phone number:', phoneNumber);
      
      if (!phoneNumber) {
        throw new Error('Phone number is missing. Please go back and provide your phone number.');
      }
      
      phoneNumber = phoneNumber ? phoneNumber.replace(/\s+/g, '') : '';
      if (phoneNumber && !/^[6-9]/.test(phoneNumber)) {
        phoneNumber = '9' + phoneNumber.slice(-9);
      }
      
      console.log('🔍 Processed phone number:', phoneNumber);

      // Build the exact schema expected by backend
      const registrationData = {
        name: formData.name || userResponses.name,
        phone: phoneNumber,
        email: formData.email || userResponses.email,
        company: {
          name: formData.company?.name || userResponses.businessName,
          type: formData.company?.type || userResponses.businessType || '',
          industry: formData.company?.industry || userResponses.industry || '',
          description: formData.company?.description || '',
          registrationNumber: formData.company?.registrationNumber || ''
        },
        location: {
          village: formData.location?.village || userResponses.village || '',
          district: formData.location?.district || userResponses.district || '',
          state: formData.location?.state || userResponses.state || '',
          pincode: formData.location?.pincode || userResponses.pincode || '',
          address: formData.location?.address || ''
        },
        businessDescription: formData.businessDescription || userResponses.businessDescription || '',
        verificationDocuments: {
          aadharNumber: formData.verificationDocuments?.aadharNumber || userResponses.aadharNumber || '',
          panNumber: formData.verificationDocuments?.panNumber || '',
          businessLicense: formData.verificationDocuments?.businessLicense || ''
        },
        documents: formData.documents || [],
        preferredLanguages: formData.preferredLanguages || [],
        rating: {
          average: 0,
          count: 0
        },
        reviews: [],
        verificationStatus: 'pending',
        isLoggedIn: 1,
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      console.log('🚀 Sending registration data:', JSON.stringify(registrationData, null, 2));
      console.log('🔗 API URL:', `${API_BASE_URL}/api/employers/register`);

      const response = await fetch(`${API_BASE_URL}/api/employers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('✅ Success response:', result);
      const employer = result.employer || result;

      // Store employer data in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: employer._id,
        _id: employer._id,
        name: employer.name,
        email: employer.email,
        phone: employer.phone,
        company: employer.company,
        location: employer.location,
        type: 'employer',
        isLoggedIn: 1
      }));
      localStorage.setItem('employer', JSON.stringify(employer));
      localStorage.setItem('employerProfile', JSON.stringify(employer));
      localStorage.setItem('employerId', employer._id);
      localStorage.setItem('userType', 'employer');

      if (loginUser) {
        loginUser({
          id: employer._id,
          _id: employer._id,
          name: employer.name,
          email: employer.email,
          phone: employer.phone,
          type: 'employer',
          isLoggedIn: 1
        });
      }

      // Move to complete step
      setCurrentQuestion(chatQuestions.length - 1);
      setShowSuccessMsg(true);
      setIsCompleted(true);
      
      setTimeout(() => {
        window.location.href = '/employer/profile';
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      addBotMessage(`❌ Registration failed: ${error.message}. Please try again.`, ['Try Again'], 1000);
    } finally {
      setIsSubmitting(false);
      setIsWaitingForInput(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    addUserMessage(suggestion);
    
    let question = chatQuestions[currentQuestion];
    
    // Handle phone number pre-fill case
    if (location.state?.phoneNumber && currentQuestion === 0) {
      // Skip to name question after welcome
      const nameQuestionIndex = chatQuestions.findIndex(q => q.field === 'name');
      if (nameQuestionIndex > 0) {
        setCurrentQuestion(nameQuestionIndex);
        question = chatQuestions[nameQuestionIndex];
      }
    }
    
    // Validate the response
    if (question.validation) {
      const error = question.validation(suggestion);
      if (error) {
        setTimeout(() => {
          addBotMessage(`❌ ${error}. Please try again:`, question.suggestions, 500);
        }, 300);
        return;
      }
    }
    
    await processUserResponse(suggestion);
  };

  // --- Step Progress Bar ---
  const StepProgress = ({ current, total }) => (
    <div className="w-full h-1 bg-[#e0e0e0] rounded-full overflow-hidden mb-8">
      <motion.div
        className="h-1 bg-[#222] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${(current / total) * 100}%` }}
        transition={{ duration: 0.4 }}
        aria-label="Progress"
      />
    </div>
  );

  // --- Main Stepper UI ---
  const currentQ = chatQuestions[currentQuestion];
  const isLastStep = currentQ.id === 'complete';

  // --- Input error state for shake animation ---
  const [inputError, setInputError] = useState(false);
  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() || !isWaitingForInput) return;
    if (currentQ.validation) {
      const error = currentQ.validation(currentInput);
      if (error) {
        setInputError(true);
        setTimeout(() => setInputError(false), 500);
        return;
      }
    }
    addUserMessage(currentInput);
    await processUserResponse(currentInput);
  };

  // --- Minimal, mobile-first, conversational stepper UI ---
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f5f6fa] px-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
      {/* Logo at the top */}
      <div className="w-full flex flex-col items-center justify-center pt-8 pb-2">
        <div className="flex items-center gap-3">
          {Logo ? (
            <img src={Logo} alt="Logo" className="h-10 md:h-12 mb-2" style={{ maxWidth: 120 }} />
          ) : (
            <span className="text-2xl font-bold tracking-wide text-[#222] mb-2">LOGO</span>
          )}
          <span className="text-2xl font-extrabold tracking-widest text-[#222] mb-2">I N D U S</span>
        </div>
        <span className="text-base font-semibold text-[#ff6b35] mt-1">Employer Registration</span>
      </div>
      <div className="w-full max-w-md mx-auto flex flex-col justify-center min-h-screen">
        {/* Progress Bar */}
        <StepProgress current={currentQuestion} total={chatQuestions.length - 1} />
        {/* Step Content */}
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="flex flex-col gap-10 md:gap-12"
        >
          {/* Question/Prompt */}
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#222] mb-3 leading-tight" style={{ letterSpacing: '-0.5px' }}>
              {currentQ.text.split(/[.!?]/)[0].toUpperCase()}
            </h2>
            {currentQ.text.split(/[.!?]/)[1] && (
              <p className="text-lg md:text-xl text-[#222]/70 mt-2">{currentQ.text.split(/[.!?]/)[1]}</p>
            )}
          </div>
          {/* Input or Suggestions */}
          {currentQ.suggestions && currentQ.suggestions.length > 0 ? (
            <div className="flex flex-col gap-6">
              {currentQ.suggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full py-5 px-6 bg-[#222] text-white rounded-xl text-xl font-semibold flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#ff6b35] transition-all duration-200"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label={suggestion}
                >
                  {suggestion}
                  <span className="ml-2">→</span>
                </motion.button>
              ))}
            </div>
          ) : currentQ.id === 'summary' ? (
            <div className="flex flex-col gap-8">
              {/* Simple "All set!" message */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#ff6b35] flex items-center justify-center text-white text-4xl">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-[#222] mb-2">All set!</h3>
                <p className="text-lg text-[#666]">Ready to create your employer profile</p>
              </div>
              
              {/* Submit Button */}
              <motion.button
                onClick={() => handleSuggestionClick('Submit Registration')}
                disabled={isSubmitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-5 px-6 bg-[#ff6b35] text-white rounded-xl text-xl font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#ff6b35] transition-all duration-200 disabled:bg-[#e0e0e0] disabled:text-[#aaa]"
                aria-label="Submit Registration"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    SUBMITTING...
                  </>
                ) : (
                  <>
                    SUBMIT REGISTRATION
                    <span className="ml-2">🚀</span>
                  </>
                )}
              </motion.button>
            </div>
          ) : !isLastStep ? (
            <form onSubmit={handleInputSubmit} className="flex flex-col gap-8">
              <div className="relative">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder=" "
                  disabled={!isWaitingForInput || isSubmitting}
                  className={`w-full py-5 px-4 text-xl bg-transparent border-b-2 border-[#e0e0e0] text-[#222] focus:outline-none focus:border-[#ff6b35] transition-all duration-300 peer rounded-none ${inputError ? 'animate-shake border-red-500' : ''}`}
                  aria-label="Type your response"
                  autoFocus
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-[#222]/60 text-xl pointer-events-none transition-all duration-300 peer-focus:top-0 peer-focus:text-sm peer-focus:text-[#ff6b35] peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-xl peer-placeholder-shown:text-[#222]/60">
                  {isWaitingForInput ? "Type your response..." : ""}
                </label>
              </div>
              <motion.button
                type="submit"
                disabled={!currentInput.trim() || !isWaitingForInput || isSubmitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-5 px-6 bg-[#222] text-white rounded-xl text-xl font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#ff6b35] transition-all duration-200 disabled:bg-[#e0e0e0] disabled:text-[#aaa]"
                aria-label="Continue"
              >
                CONTINUE <span className="ml-2">→</span>
              </motion.button>
            </form>
          ) : (
            <div className="flex flex-col gap-8 items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-[#ff6b35] flex items-center justify-center text-white text-4xl mb-4"
                aria-label="Success"
              >
                ✓
              </motion.div>
              <p className="text-xl text-[#222] font-semibold text-center">Your employer profile has been created successfully!</p>
            </div>
          )}
        </motion.div>
      </div>
      {/* Slide-in success message (Framer Motion) */}
      {showSuccessMsg && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#222] text-white px-6 py-4 rounded-2xl shadow-lg z-50 text-lg font-semibold"
          style={{ minWidth: 280, textAlign: 'center' }}
        >
          🎉 Employer registration successful!
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedEmployerRegistration;