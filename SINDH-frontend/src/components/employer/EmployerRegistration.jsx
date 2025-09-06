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

  // Keep the same form data structure as original with new fields
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    company: {
      name: '',
      type: '',
      industry: [],
      primaryIndustry: ''
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
    workerType: '',
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
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [showPrimaryIndustrySelection, setShowPrimaryIndustrySelection] = useState(false);

  // Enhanced location fetching function (same as WorkerRegistration)
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
          addBotMessage(`✅ Great! I found your business location: ${district}, ${state}. Now I'll ask for your village/area name.`, [], 800);
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
      id: 'age',
      type: 'question',
      text: "What's your age? Please enter your age in years.",
      field: 'age',
      validation: (value) => {
        const age = parseInt(value);
        return (age >= 18 && age <= 100) ? null : "Please enter a valid age between 18 and 100";
      }
    },
    {
      id: 'pincode',
      type: 'question',
      text: "What's your business pincode? Please enter your 6-digit postal code (e.g., 400001)",
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
        return `Great! I found your business location details:\n\n📍 District: ${district}\n🏢 State: ${state}\n📦 Pincode: ${pincode}\n\nNow, what's your village or area name within ${district} where your business is located?`;
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
      text: "What's your email address? This will be used for important notifications.",
      field: 'email',
      validation: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : "Please enter a valid email address";
      }
    },
    {
      id: 'industry',
      type: 'question',
      text: "What is your primary business industry? Choose the one that best describes your main business activity.",
      field: 'industry',
      suggestions: industryOptions,
      validation: (value) => value.trim() ? null : "Please select your primary industry"
    },
    {
      id: 'businessName',
      type: 'question',
      text: () => {
        const primaryIndustry = formData.company?.primaryIndustry || userResponses.primaryIndustry || 'business';
        return `What's the name of your ${primaryIndustry.toLowerCase()} business?`;
      },
      field: 'businessName',
      suggestions: () => {
        const industry = formData.company?.primaryIndustry || userResponses.primaryIndustry || '';
        const suggestions = {
          'Agriculture': ['Green Valley Farm', 'Sunrise Agriculture', 'Golden Harvest Farm', 'Nature\'s Bounty Farm'],
          'Construction': ['Strong Build Construction', 'Prime Builders', 'Reliable Construction Co.', 'Elite Contractors'],
          'Manufacturing': ['Quality Manufacturing', 'Precision Industries', 'Modern Manufacturing', 'Excellence Products'],
          'Retail': ['Local Market Store', 'Community Shop', 'Daily Needs Store', 'Neighborhood Mart'],
          'Services': ['Professional Services', 'Quality Solutions', 'Expert Services', 'Reliable Support'],
          'Food Processing': ['Fresh Food Processing', 'Quality Foods', 'Healthy Processing Co.', 'Pure Foods Ltd'],
          'Handicrafts': ['Traditional Crafts', 'Artisan Creations', 'Heritage Handicrafts', 'Skilled Crafts'],
          'Local Trade': ['Local Trading Co.', 'Community Trade', 'Regional Commerce', 'Local Business Hub']
        };
        return suggestions[industry] || ['My Business', 'Local Enterprise', 'Quality Services', 'Professional Solutions'];
      },
      validation: (value) => value.trim().length >= 2 ? null : "Please enter your business name"
    },
    {
      id: 'aadhar',
      type: 'question',
      text: "For verification purposes, we need your Aadhar number. You can verify it now or later when posting your first job. What would you prefer?",
      field: 'aadharNumber',
      suggestions: ['Verify later', 'Enter Aadhar number now'],
      validation: (value) => {
        if (value === 'Verify later') return null;
        const cleaned = value.replace(/[^\d]/g, '');
        return cleaned.length === 12 ? null : "Please enter a valid 12-digit Aadhar number";
      }
    },
    {
      id: 'workerType',
      type: 'question',
      text: "What kind of workers do you typically need for your business?",
      field: 'workerType',
      suggestions: ['Full-time workers', 'Part-time workers', 'Daily wage workers', 'Seasonal workers', 'Contract workers', 'Skilled craftsmen', 'General laborers'],
      validation: (value) => value.trim() ? null : "Please select the type of workers you need"
    },
    {
      id: 'businessDescription',
      type: 'question',
      text: "Tell me briefly about your business and what kind of work you offer. This helps workers understand what you do!",
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
      } else if (question.field === 'age') {
        setFormData(prev => ({ ...prev, age: processedResponse }));
      } else if (question.field === 'phone') {
        setFormData(prev => ({ ...prev, phone: processedResponse }));
      } else if (question.field === 'email') {
        setFormData(prev => ({ ...prev, email: processedResponse }));
      } else if (question.field === 'aadharNumber') {
        // Handle "Verify later" option
        let aadharValue = processedResponse;
        if (processedResponse === 'Verify later') {
          aadharValue = 'not provided';
          addBotMessage('✅ No problem! You can verify your Aadhar later when posting your first job. This helps maintain security while letting you get started quickly.', [], 1000);
        }
        setFormData(prev => ({ 
          ...prev, 
          verificationDocuments: { 
            ...prev.verificationDocuments, 
            aadharNumber: aadharValue 
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
      } else if (question.field === 'workerType') {
        setFormData(prev => ({ ...prev, workerType: processedResponse }));
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
        
        // Auto-fetch location details when pincode is entered
        if (question.autoFetch && processedResponse.length === 6) {
          const locationData = await fetchLocationFromPincode(processedResponse);
          if (locationData) {
            // Location data is already updated in fetchLocationFromPincode
            // Continue to next question after a brief delay
            setTimeout(() => {
              // The next question (village) will show the fetched location details
            }, 1500);
          } else {
            // If location fetch failed, don't proceed to next question
            // User needs to re-enter pincode
            return;
          }
        }
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
      console.log('🔍 Age from formData:', formData.age);
      console.log('🔍 Age from userResponses:', userResponses.age);
      console.log('🔍 WorkerType from formData:', formData.workerType);
      console.log('🔍 WorkerType from userResponses:', userResponses.workerType);
      console.log('🔍 Aadhar from formData:', formData.verificationDocuments?.aadharNumber);
      console.log('🔍 Aadhar from userResponses:', userResponses.aadharNumber);
      
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
      // Prepare aadharNumber - use 'not provided' if empty
      const aadharNumber = formData.verificationDocuments?.aadharNumber || userResponses.aadharNumber || 'not provided';
      const finalAadharNumber = (!aadharNumber || aadharNumber.trim() === '') ? 'not provided' : aadharNumber;
      
      const registrationData = {
        name: formData.name || userResponses.name,
        age: parseInt(formData.age || userResponses.age),
        phone: phoneNumber,
        email: formData.email || userResponses.email || '',
        company: {
          name: formData.company?.name || userResponses.businessName,
          type: formData.company?.type || userResponses.businessType || '',
          industry: Array.isArray(formData.company?.industry || userResponses.industry) 
            ? (formData.company?.industry || userResponses.industry)
            : [(formData.company?.industry || userResponses.industry)].filter(Boolean),
          primaryIndustry: formData.company?.primaryIndustry || userResponses.primaryIndustry || '',
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
        workerType: formData.workerType || userResponses.workerType || 'Daily wage workers',
        verificationDocuments: {
          aadharNumber: finalAadharNumber,
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

      console.log('🚀 Final registration data with all fields:', JSON.stringify(registrationData, null, 2));
      console.log('🔍 Validation check - Age:', registrationData.age, typeof registrationData.age);
      console.log('🔍 Validation check - WorkerType:', registrationData.workerType);
      console.log('🔍 Validation check - Aadhar:', registrationData.verificationDocuments.aadharNumber);
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

  // --- Minimal, mobile-first, conversational stepper UI matching WorkerRegistration ---
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-950 text-gray-300 px-2 sm:px-4 relative overflow-hidden devanagari">
      {/* Mobile-first background aesthetics matching WorkerRegistration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)',
          }}
        />
        <div className="startrails absolute inset-0" />
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
      
      {/* Logo and header matching WorkerRegistration */}
      <div className="w-full flex flex-col items-center justify-center pt-6 pb-2">
        <div className="flex items-center gap-2">
          {Logo ? (
            <img src={Logo} alt="SINDH Logo" className="h-8 sm:h-10 mb-1 filter invert brightness-0" style={{ maxWidth: 90 }} />
          ) : (
            <span className="text-xl font-bold tracking-wide text-white mb-1">LOGO</span>
          )}
          <span className="text-xl sm:text-2xl font-extrabold tracking-widest text-white mb-1">S I N D H</span>
        </div>
        <span className="text-sm font-semibold text-orange-400 mt-1">Employer Registration</span>
      </div>
      
      <div className="w-full max-w-xs sm:max-w-sm mx-auto flex flex-col justify-center min-h-screen relative z-10">
        {/* Progress Bar matching WorkerRegistration */}
        <StepProgress current={currentQuestion} total={chatQuestions.length - 1} />
        
        {/* Step Content */}
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="flex flex-col gap-8"
        >
          {/* Question/Prompt matching WorkerRegistration style */}
          <div className="text-left">
            {(() => {
              const questionText = typeof currentQ.text === 'function' ? currentQ.text() : currentQ.text;
              const textParts = questionText.split(/[.!?]/);
              return (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight" style={{ letterSpacing: '-0.5px' }}>
                    {textParts[0].toUpperCase()}
                  </h2>
                  {textParts[1] && (
                    <p className="text-base sm:text-lg text-gray-400 mt-1 whitespace-pre-line">{textParts.slice(1).join('.')}</p>
                  )}
                  {/* Handle multi-line text for location display */}
                  {questionText.includes('\n') && (
                    <div className="text-base sm:text-lg text-gray-400 mt-2 whitespace-pre-line">
                      {questionText.split('\n').slice(1).join('\n')}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          {/* Input or Suggestions matching WorkerRegistration */}
          {currentQ.suggestions && currentQ.suggestions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {currentQ.suggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full py-3 px-4 bg-white/10 border border-white/10 text-white rounded-lg text-base font-semibold flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
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
            <div className="flex flex-col gap-6">
              {/* Simple "All set!" message matching WorkerRegistration */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-3xl">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white mb-1">All set!</h3>
                <p className="text-base text-gray-400">Ready to create your employer profile</p>
              </div>
              {/* Submit Button */}
              <motion.button
                onClick={submitRegistration}
                disabled={isSubmitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 px-4 bg-white text-black rounded-lg text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 disabled:bg-white/40 disabled:text-black/50"
                aria-label="Submit Registration"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
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
          ) : currentQ.id === 'complete' ? (
            <div className="flex flex-col gap-6 items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-4xl mb-4"
                aria-label="Success"
              >
                🎉
              </motion.div>
              <p className="text-xl text-white font-semibold text-center">Welcome to SINDH! Your employer profile has been created successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleInputSubmit} className="flex flex-col gap-6">
              <div className="relative">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder=" "
                  disabled={!isWaitingForInput || isSubmitting}
                  className={`w-full py-3 px-3 text-base bg-transparent border-b-2 border-white/15 text-white focus:outline-none focus:border-white/40 transition-all duration-300 peer rounded-none ${inputError ? 'animate-shake border-red-500' : ''}`}
                  aria-label="Type your response"
                  autoFocus
                />
                <label className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-base pointer-events-none transition-all duration-300 peer-focus:top-0 peer-focus:text-xs peer-focus:text-orange-400 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/50">
                  {isWaitingForInput ? "Type your response..." : ""}
                </label>
              </div>
              <motion.button
                type="submit"
                disabled={!currentInput.trim() || !isWaitingForInput || isSubmitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 px-4 bg-white/10 border border-white/10 text-white rounded-lg text-base font-semibold flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 disabled:bg-white/5 disabled:text-white/40"
                aria-label="Continue"
              >
                CONTINUE <span className="ml-2">→</span>
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
      
      {/* Slide-in success message matching WorkerRegistration */}
      {showSuccessMsg && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-base font-semibold"
          style={{ minWidth: 220, textAlign: 'center' }}
        >
          🎉 Employer registration successful!
        </motion.div>
      )}

      {/* Shared styles for font + effects (matched to WorkerRegistration) */}
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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(-5deg); }
          75% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 0.3;
            filter: blur(1rem);
          }
          50% { 
            opacity: 0.6;
            filter: blur(1.5rem);
          }
        }
        
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
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
        .aurora-a { background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%); left: -20vmax; top: -10vmax; animation: drift 18s ease-in-out infinite; }
        .aurora-b { background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%); right: -25vmax; top: -5vmax; animation: drift 22s ease-in-out infinite reverse; }
        .aurora-c { background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%); left: 10vmax; bottom: -20vmax; animation: drift 26s ease-in-out infinite; }
        @keyframes drift { 0%, 100% { transform: translate3d(0,0,0) rotate(0deg); } 50% { transform: translate3d(5vmax, -3vmax, 0) rotate(20deg); } }

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

        /* Keep local input error shake animation used by this page */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default EnhancedEmployerRegistration;