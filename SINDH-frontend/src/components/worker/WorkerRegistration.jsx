import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, User, Award, MapPin, FileText, Phone, Mail, Briefcase, Languages, Smile, Sparkles, Rocket, Handshake, Lightbulb, ShieldCheck, Wallet } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../../utils/apiUtils.js';
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

const EnhancedWorkerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();
  const { t } = useTranslation();
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
    age: '',
    phone: '',
    email: '',
    gender: '',
    aadharNumber: '',
    skills: [],
    experience: '',
    expectedSalary: '',
    preferredCategory: '',
    languages: [],
    location: {
      address: '',
      village: '',
      district: '',
      state: '',
      pincode: '',
      coordinates: {
        type: "Point",
        coordinates: [0, 0]
      }
    },
    preferredWorkType: '',
    availability: '',
    bio: '',
    workRadius: 10,
    otp: {
      code: '',
      expiresAt: null
    }
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const skillOptions = [
    'Construction', 'Carpentry', 'Masonry', 'Plumbing', 'Electrical', 'Painting', 
    'Welding', 'Farming', 'Agriculture', 'Landscaping', 'Cleaning', 'Cooking',
    'Household Help', 'Child Care', 'Elder Care', 'Driving', 'Delivery',
    'Manufacturing', 'Packaging', 'Loading/Unloading', 'Security', 'Other'
  ];

  const languageOptions = [
    'Hindi', 'English', 'Marathi', 'Gujarati', 'Punjabi', 'Bengali', 
    'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Odia', 'Urdu'
  ];

  // Function to fetch location details from pincode
  const fetchLocationFromPincode = async (pincode) => {
    try {
      addBotMessage('🔍 Fetching location details for your pincode...', [], 500);
      
      // Using Indian Postal Pincode API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        const district = postOffice.District;
        const state = postOffice.State;
        
        // Update form data with fetched location
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            pincode: pincode,
            district: district,
            state: state
          }
        }));
        
        // Show success message with fetched details
        setTimeout(() => {
          addBotMessage(`✅ Great! I found your location: ${district}, ${state}. Now I'll ask for your village/area name.`, [], 800);
        }, 1000);
        
        return { district, state };
      } else {
        throw new Error('Invalid pincode or location not found');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setTimeout(() => {
        addBotMessage('❌ Sorry, I couldn\'t fetch location details for this pincode. Please make sure it\'s a valid 6-digit Indian pincode and try again.', [], 800);
      }, 500);
      return null;
    }
  };

  // Convert the original steps to chat-style questions
  const chatQuestions = [
    {
      id: 'welcome',
      type: 'system',
      text: "👋 Welcome to SINDH! I'm here to help you create your worker profile so you can start finding jobs and earning. Ready to get started?",
      field: null,
      suggestions: ['Yes, let\'s start!']
    },
    {
      id: 'name',
      type: 'question',
      text: "Great! Let's start with your full name?",
      field: 'name',
      validation: (value) => value.trim().length >= 2 ? null : "Please enter your full name"
    },
    {
      id: 'age',
      type: 'question',
      text: "What's your age? (Must be between 18-70 years)",
      field: 'age',
      validation: (value) => {
        const age = parseInt(value);
        return age >= 18 && age <= 70 ? null : "Please enter a valid age between 18-70 years";
      }
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
      id: 'pincode',
      type: 'question',
      text: "What's your pincode? Please enter your 6-digit postal code (e.g., 400001)",
      field: 'pincode',
      validation: (value) => {
        const cleaned = value.replace(/[^\d]/g, '');
        return cleaned.length === 6 ? null : "Please enter a valid 6-digit pincode";
      },
      autoFetch: true // Special flag to trigger location fetch
    },
    {
      id: 'village',
      type: 'question',
      text: () => {
        const district = formData.location?.district || 'District';
        const state = formData.location?.state || 'State';
        const pincode = formData.location?.pincode || 'Pincode';
        return `Great! I found your location details:\n\n📍 District: ${district}\n🏛️ State: ${state}\n📮 Pincode: ${pincode}\n\nNow, what's your village or area name within ${district}?`;
      },
      field: 'village',
      validation: (value) => {
        const trimmed = value.trim();
        return trimmed.length >= 2 ? null : "Please enter your village or area name";
      }
    },
    {
      id: 'email',
      type: 'question',
      text: "Would you like to provide your email address for job notifications? (This is completely optional)",
      field: 'email',
      suggestions: ['Skip this step', 'Enter email address'],
      validation: (value) => {
        if (!value.trim() || value === 'Skip this step') return null; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : "Please enter a valid email address";
      }
    },
    {
      id: 'gender',
      type: 'question',
      text: "What's your gender?",
      field: 'gender',
      suggestions: ['Male', 'Female', 'Other'],
      validation: (value) => value.trim() ? null : "Please select your gender"
    },
    {
      id: 'aadhar',
      type: 'question',
      text: "For verification, would you like to provide your 12-digit Aadhar number now or verify it later?\n\n💡 Note: If you choose 'Verify later', you'll be asked to verify your Aadhar when you apply for your first job.",
      field: 'aadharNumber',
      suggestions: ['Verify later', 'Enter Aadhar number now'],
      validation: (value) => {
        if (value === 'Verify later') return null; // Allow skip
        const cleaned = value.replace(/[^\d]/g, '');
        return cleaned.length === 12 ? null : "Please enter a valid 12-digit Aadhar number";
      }
    },
    {
      id: 'preferredCategory',
      type: 'question',
      text: "What type of work do you prefer?",
      field: 'preferredCategory',
      suggestions: [
        'Construction',
        'Agriculture',
        'Household',
        'Transportation',
        'Manufacturing',
        'Services',
        'Other'
      ],
      validation: (value) => value.trim() ? null : "Please select your preferred work category"
    },
    {
      id: 'skills',
      type: 'question',
      text: "What skills do you have? Select all that apply:",
      field: 'skills',
      suggestions: skillOptions,
      validation: (value) => value && value.length > 0 ? null : "Please select at least one skill"
    },
    {
      id: 'experience',
      type: 'question',
      text: "How much work experience do you have?",
      field: 'experience',
      suggestions: [
        'Less than 1 year',
        '1-2 years',
        '2-5 years',
        '5-10 years',
        'More than 10 years'
      ],
      validation: (value) => value.trim() ? null : "Please select your experience level"
    },
    
    {
      id: 'expectedSalary',
      type: 'question',
      text: "What's your expected daily salary? (e.g., ₹500 per day)",
      field: 'expectedSalary',
      validation: (value) => value.trim() ? null : "Please enter your expected salary"
    },
    {
      id: 'languages',
      type: 'question',
      text: "What languages do you speak? Select all that apply:",
      field: 'languages',
      suggestions: languageOptions,
      validation: (value) => value && value.length > 0 ? null : "Please select at least one language"
    },
 
    {
      id: 'workRadius',
      type: 'question',
      text: "How far are you willing to travel for work?",
      field: 'workRadius',
      suggestions: ['5', '10', '15', '20', '25', '50+'],
      validation: (value) => value.trim() ? null : "Please select your work radius"
    },
    {
      id: 'bio',
      type: 'question',
      text: "Tell me about yourself and your work experience. This helps employers understand you better!",
      field: 'bio',
      validation: (value) => value.trim().length >= 10 ? null : "Please provide a brief description about yourself"
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
      text: "🎉 Excellent! Your worker profile has been created successfully!",
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
          `👋 Welcome back! I see you're registering with ${location.state.phoneNumber}. Let's create your worker profile together!`,
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

  const handleSuggestionClick = async (suggestion) => {
    const currentQ = chatQuestions[currentQuestion];
    
    // Special handling for email field
    if (currentQ.field === 'email') {
      if (suggestion === 'Skip this step') {
        addUserMessage(suggestion);
        await processUserResponse(suggestion);
        return;
      } else if (suggestion === 'Enter email address') {
        addUserMessage('I want to enter my email address');
        // Clear suggestions to show input field
        setShowSuggestions(false);
        setIsWaitingForInput(true);
        addBotMessage('Please enter your email address:', [], 500);
        return;
      }
    }
    
    // Special handling for Aadhar field
    if (currentQ.field === 'aadharNumber') {
      if (suggestion === 'Verify later') {
        addUserMessage(suggestion);
        // Add confirmation message for verify later
        setTimeout(() => {
          addBotMessage('✅ No problem! You can verify your Aadhar number when you apply for your first job. This helps you get started quickly while maintaining security.', [], 800);
        }, 500);
        await processUserResponse(suggestion);
        return;
      } else if (suggestion === 'Enter Aadhar number now') {
        addUserMessage('I want to enter my Aadhar number now');
        // Clear suggestions to show input field
        setShowSuggestions(false);
        setIsWaitingForInput(true);
        addBotMessage('Please enter your 12-digit Aadhar number:', [], 500);
        return;
      }
    }
    
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
        console.log("🎉 Worker registration initiated!");
        console.log("Calling API:", `${getApiUrl()}/api/workers/initiate-registration`);
        
        // Call backend to log registration initiated
        const apiResponse = await fetch(`${getApiUrl()}/api/workers/initiate-registration`, {
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
            addBotMessage("🎉 Worker registration initiated! Backend is responding. Let's gather your information...", null, 800);
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
        // Auto-fetch location details for pincode
        if (processedResponse.length === 6) {
          await fetchLocationFromPincode(processedResponse);
        }
      } else if (question.field === 'age') {
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
      } else if (question.field === 'age') {
        setFormData(prev => ({ ...prev, age: processedResponse }));
      } else if (question.field === 'phone') {
        setFormData(prev => ({ ...prev, phone: processedResponse }));
      } else if (question.field === 'email') {
        // Handle email skip option - send empty string for skip
        let emailValue = '';
        if (processedResponse !== 'Skip this step' && processedResponse.trim()) {
          emailValue = processedResponse.trim();
        }
        setFormData(prev => ({ ...prev, email: emailValue }));
      } else if (question.field === 'gender') {
        setFormData(prev => ({ ...prev, gender: processedResponse }));
      } else if (question.field === 'aadharNumber') {
        // Handle Aadhar verify later option
        const aadharValue = processedResponse === 'Verify later' ? 'not provided' : processedResponse;
        setFormData(prev => ({ ...prev, aadharNumber: aadharValue }));
      } else if (question.field === 'skills') {
        setFormData(prev => ({ ...prev, skills: [processedResponse] }));
      } else if (question.field === 'experience') {
        setFormData(prev => ({ ...prev, experience: processedResponse }));
      } else if (question.field === 'preferredCategory') {
        setFormData(prev => ({ ...prev, preferredCategory: processedResponse }));
      } else if (question.field === 'expectedSalary') {
        setFormData(prev => ({ ...prev, expectedSalary: processedResponse }));
      } else if (question.field === 'languages') {
        setFormData(prev => ({ ...prev, languages: [processedResponse] }));
      } else if (question.field === 'pincode') {
        setFormData(prev => ({ 
          ...prev, 
          location: { 
            ...prev.location, 
            pincode: processedResponse 
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
      } else if (question.field === 'preferredWorkType') {
        setFormData(prev => ({ ...prev, preferredWorkType: processedResponse }));
      } else if (question.field === 'availability') {
        setFormData(prev => ({ ...prev, availability: processedResponse }));
      } else if (question.field === 'workRadius') {
        setFormData(prev => ({ ...prev, workRadius: parseInt(processedResponse) }));
      } else if (question.field === 'bio') {
        setFormData(prev => ({ ...prev, bio: processedResponse }));
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
    console.log('🚀 Submit registration called');
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
        age: parseInt(formData.age || userResponses.age) || 25,
        phone: phoneNumber,
        email: (() => {
          const emailFromForm = formData.email || '';
          const emailFromResponses = userResponses.email || '';
          // Filter out 'Skip this step' and return empty string
          if (emailFromForm && emailFromForm !== 'Skip this step') return emailFromForm;
          if (emailFromResponses && emailFromResponses !== 'Skip this step') return emailFromResponses;
          return '';
        })(),
        gender: formData.gender || userResponses.gender || 'Male',
        aadharNumber: (() => {
          const aadharFromForm = formData.aadharNumber || '';
          const aadharFromResponses = userResponses.aadharNumber || '';
          // Handle 'Verify later' option
          if (aadharFromForm === 'Verify later') return 'not provided';
          if (aadharFromResponses === 'Verify later') return 'not provided';
          if (aadharFromForm && aadharFromForm !== 'Verify later') return aadharFromForm;
          if (aadharFromResponses && aadharFromResponses !== 'Verify later') return aadharFromResponses;
          return 'not provided';
        })(),
        skills: formData.skills || [userResponses.skills] || ['Construction'],
        experience: formData.experience || userResponses.experience || 'Less than 1 year',
        preferredCategory: formData.preferredCategory || userResponses.preferredCategory || 'Construction',
        expectedSalary: formData.expectedSalary || userResponses.expectedSalary || '₹500 per day',
        languages: formData.languages || [userResponses.languages] || ['Hindi'],
        location: {
          address: (() => {
            const village = formData.location?.village || userResponses.village || '';
            const district = formData.location?.district || userResponses.district || '';
            const state = formData.location?.state || userResponses.state || '';
            const pincode = formData.location?.pincode || userResponses.pincode || '';
            
            // Construct complete address
            const addressParts = [village, district, state, pincode].filter(part => part && part.trim());
            return addressParts.length > 0 ? addressParts.join(', ') : '';
          })(),
          village: formData.location?.village || userResponses.village || '',
          district: formData.location?.district || userResponses.district || '',
          state: formData.location?.state || userResponses.state || '',
          pincode: formData.location?.pincode || userResponses.pincode || '',
          coordinates: {
            type: "Point",
            coordinates: [0, 0]
          }
        },
        preferredWorkType: formData.preferredWorkType || userResponses.preferredWorkType || 'Full-time daily work',
        availability: formData.availability || userResponses.availability || 'Available immediately',
        workRadius: parseInt(formData.workRadius || userResponses.workRadius) || 10,
        bio: formData.bio || userResponses.bio || '',
        verificationStatus: 'pending',
        isAvailable: true,
        shaktiScore: calculateShaktiScore(formData),
        rating: { average: 0, count: 0, reviews: [] },
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isLoggedIn: 1,
        profileCompletionPercentage: calculateProfileCompletion(formData),
        documents: [],
        workHistory: [],
        activeJobs: 0,
        completedJobs: 0,
        emailNotifications: true,
        smsNotifications: true,
        profilePicture: '',
        bankDetails: {
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          accountHolderName: ''
        },
        emergencyContact: {
          name: '',
          phone: '',
          relation: ''
        },
        type: 'worker'
      };

      console.log('🚀 Sending worker registration data:', JSON.stringify(registrationData, null, 2));
      const apiUrl = `${getApiUrl()}/workers/register`;
      console.log('🔗 API URL:', apiUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
          const errorData = await response.json();
          console.log('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('✅ Success response:', result);
      const worker = result.worker || result;

      // Store worker data in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: worker._id,
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        location: worker.location,
        type: 'worker',
        isLoggedIn: 1
      }));
      localStorage.setItem('worker', JSON.stringify(worker));
      localStorage.setItem('workerProfile', JSON.stringify(worker));
      localStorage.setItem('workerId', worker._id);
      localStorage.setItem('userType', 'worker');

      if (loginUser) {
        loginUser({
          id: worker._id,
          _id: worker._id,
          name: worker.name,
          email: worker.email,
          phone: worker.phone,
        type: 'worker',
          isLoggedIn: 1
        });
      }

      // Move to complete step
      setCurrentQuestion(chatQuestions.length - 1);
      setShowSuccessMsg(true);
      setIsCompleted(true);
      
      setTimeout(() => {
        window.location.href = '/worker/profile';
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addBotMessage(`❌ ${errorMessage}`, ['Try Again'], 1000);
    } finally {
      setIsSubmitting(false);
      setIsWaitingForInput(false);
    }
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

  // Helper functions from original component
  const calculateShaktiScore = (data) => {
    let score = 0;
    
    // Basic Information (25 points)
    if (data.name) score += 5;
    if (data.phone) score += 5;
    if (data.email) score += 3;
    if (data.age >= 18 && data.age <= 65) score += 7;
    if (data.gender) score += 5;

    // Skills & Experience (30 points)
    if (data.skills?.length > 0) score += 10;
    if (data.skills?.length >= 3) score += 5; // Bonus for multiple skills
    if (data.experience) score += 8;
    if (data.expectedSalary) score += 4;
    if (data.preferredCategory) score += 3;

    // Languages (15 points)
    if (data.languages?.length > 0) score += 8;
    if (data.languages?.length >= 2) score += 4; // Bonus for multilingual
    if (data.languages?.includes('English')) score += 3; // English bonus

    // Location (15 points)
    if (data.location?.village) score += 4;
    if (data.location?.district) score += 4;
    if (data.location?.state) score += 4;
    if (data.location?.pincode) score += 3;

    // Work Preferences (10 points)
    if (data.availability) score += 3;
    if (data.preferredWorkType) score += 3;
    if (data.workRadius) score += 2;
    if (data.bio && data.bio.length > 50) score += 2;

    // Verification (5 points)
    if (data.aadharNumber && data.aadharNumber.length === 12) score += 5;

    return Math.min(score, 100); // Cap at 100
  };

  const calculateProfileCompletion = (data) => {
    const requiredFields = [
      'name', 'age', 'phone', 'gender', 'aadharNumber',
      'skills', 'experience', 'preferredCategory', 'expectedSalary',
      'languages', 'location.village', 'location.district', 'location.state',
      'preferredWorkType', 'availability'
    ];
    
    let completedFields = 0;
    
    requiredFields.forEach(field => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (data[parent] && data[parent][child]) completedFields++;
      } else {
        if (field === 'skills' || field === 'languages') {
          if (data[field] && data[field].length > 0) completedFields++;
        } else if (data[field]) {
          completedFields++;
        }
      }
    });
    
    return Math.round((completedFields / requiredFields.length) * 100);
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
        <span className="text-base font-semibold text-[#ff6b35] mt-1">Worker Registration</span>
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
            {(() => {
              const questionText = typeof currentQ.text === 'function' ? currentQ.text() : currentQ.text;
              const textParts = questionText.split(/[.!?]/);
              return (
                <>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-[#222] mb-3 leading-tight" style={{ letterSpacing: '-0.5px' }}>
                    {textParts[0].toUpperCase()}
                  </h2>
                  {textParts[1] && (
                    <p className="text-lg md:text-xl text-[#222]/70 mt-2 whitespace-pre-line">{textParts.slice(1).join('.')}</p>
                  )}
                </>
              );
            })()}
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
                <p className="text-lg text-[#666]">Ready to create your worker profile</p>
              </div>
              
              {/* Submit Button */}
                <motion.button
                onClick={submitRegistration}
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
          ) : (
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
              )}
            </motion.div>
                </div>
      {/* Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
          <div className="font-bold mb-2">Debug Info:</div>
          <div>Current Question: {currentQuestion}</div>
          <div>Is Submitting: {isSubmitting ? 'Yes' : 'No'}</div>
          <div>Is Waiting: {isWaitingForInput ? 'Yes' : 'No'}</div>
          <div>Is Completed: {isCompleted ? 'Yes' : 'No'}</div>
          <div>Form Data Keys: {Object.keys(formData).join(', ')}</div>
          <div>User Responses Keys: {Object.keys(userResponses).join(', ')}</div>
          <div>API URL: {getApiUrl()}</div>
                </div>
      )}
      
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
          🎉 Worker registration successful!
            </motion.div>
          )}
    </div>
  );
};

export default EnhancedWorkerRegistration;