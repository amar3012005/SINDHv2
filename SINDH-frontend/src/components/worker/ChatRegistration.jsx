import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, User, MessageCircle, Phone, Star, MapPin, Briefcase } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config';

const ChatRegistration = () => {
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
  const [createdWorkerId, setCreatedWorkerId] = useState(null);
  const [isWorkerCreated, setIsWorkerCreated] = useState(false);

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

  const chatQuestions = [
    {
      id: 'welcome',
      type: 'system',
      text: "👋 Hi there! Welcome to SINDH! I'm here to help you create your worker profile. It'll just take a few minutes and I'll ask you some simple questions. Ready to get started?",
      field: null,
      suggestions: ['Yes, let\'s start!', 'I\'m ready']
    },
    {
      id: 'name',
      type: 'question',
      text: "Great! Let's start with the basics. What's your full name? Please enter it exactly as it appears on your ID card.",
      field: 'name',
      validation: (value) => value.trim().length >= 2 ? null : "Please enter your full name"
    },
    {
      id: 'age',
      type: 'question',
      text: "Nice to meet you! How old are you? (You must be between 18-70 years old to register)",
      field: 'age',
      validation: (value) => {
        const age = parseInt(value);
        if (isNaN(age) || age < 18 || age > 70) return "Please enter a valid age between 18-70";
        return null;
      }
    },
    {
      id: 'gender',
      type: 'question',
      text: "What's your gender?",
      field: 'gender',
      suggestions: ['Male', 'Female', 'Other'],
      validation: (value) => ['Male', 'Female', 'Other'].includes(value) ? null : "Please select from the options"
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
      text: "Do you have an email address? (This is optional, you can type 'skip' if you don't have one)",
      field: 'email',
      optional: true,
      validation: (value) => {
        if (value.toLowerCase() === 'skip' || value.trim() === '') return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : "Please enter a valid email or type 'skip'";
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
      id: 'skills',
      type: 'question',
      text: "What skills do you have? You can select multiple skills. Type them separated by commas or choose from suggestions:",
      field: 'skills',
      suggestions: skillOptions,
      isMultiSelect: true,
      validation: (value) => {
        if (Array.isArray(value) && value.length > 0) return null;
        if (typeof value === 'string' && value.trim()) return null;
        return "Please select at least one skill";
      }
    },
    {
      id: 'experience',
      type: 'question',
      text: "How much work experience do you have?",
      field: 'experience',
      suggestions: ['Less than 1 year', '1-2 years', '3-5 years', '6-10 years', 'More than 10 years'],
      validation: (value) => value.trim() ? null : "Please select your experience level"
    },
    {
      id: 'expectedSalary',
      type: 'question',
      text: "What's your expected daily wage? (For example: ₹500 per day, ₹15000 per month, etc.)",
      field: 'expectedSalary',
      validation: (value) => value.trim() ? null : "Please enter your expected salary"
    },
    {
      id: 'preferredCategory',
      type: 'question',
      text: "Which type of work category do you prefer?",
      field: 'preferredCategory',
      suggestions: ['Construction', 'Agriculture', 'Household', 'Transportation', 'Manufacturing', 'Retail', 'Other'],
      validation: (value) => value.trim() ? null : "Please select your preferred work category"
    },
    {
      id: 'languages',
      type: 'question',
      text: "Which languages can you speak? You can select multiple:",
      field: 'languages',
      suggestions: languageOptions,
      isMultiSelect: true,
      validation: (value) => {
        if (Array.isArray(value) && value.length > 0) return null;
        if (typeof value === 'string' && value.trim()) return null;
        return "Please select at least one language";
      }
    },
    {
      id: 'village',
      type: 'question',
      text: "Which village or town are you from?",
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
      id: 'workType',
      type: 'question',
      text: "What type of work do you prefer?",
      field: 'preferredWorkType',
      suggestions: ['Full-time daily work', 'Part-time work', 'Contract work', 'Seasonal work', 'Flexible hours'],
      validation: (value) => value.trim() ? null : "Please select your preferred work type"
    },
    {
      id: 'availability',
      type: 'question',
      text: "When are you available to work?",
      field: 'availability',
      suggestions: ['Available immediately', 'Available within a week', 'Available within a month', 'Seasonal availability'],
      validation: (value) => value.trim() ? null : "Please select your availability"
    },
    {
      id: 'workRadius',
      type: 'question',
      text: "How far are you willing to travel for work? (in kilometers)",
      field: 'workRadius',
      suggestions: ['5 km', '10 km', '15 km', '20 km', '25 km', '50+ km'],
      validation: (value) => value.trim() ? null : "Please select your work radius"
    },
    {
      id: 'bio',
      type: 'question',
      text: "Tell me a bit about yourself and your work experience. This will help employers know you better! (Optional - you can type 'skip' if you want)",
      field: 'bio',
      optional: true,
      validation: () => null // Always valid since it's optional
    },
    {
      id: 'complete',
      type: 'system',
      text: "🎉 Awesome! I have all the information I need. Let me create your profile now...",
      field: null
    }
  ];

  useEffect(() => {
    // Pre-fill phone number from login if available
    if (location.state?.phoneNumber) {
      setUserResponses(prev => ({
        ...prev,
        phone: location.state.phoneNumber
      }));
    }
  }, [location.state]);

  useEffect(() => {
    // Start the conversation with personalized message if phone is available
    setTimeout(() => {
      const welcomeText = location.state?.phoneNumber 
        ? `👋 Hi there! Welcome to SINDH! I see you're registering with ${location.state.phoneNumber}. I'm here to help you create your worker profile. It'll just take a few minutes and I'll ask you some simple questions. Ready to get started?`
        : chatQuestions[0].text;
      
      addBotMessage(welcomeText, chatQuestions[0].suggestions);
    }, 1000);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (text, suggestions = null, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text,
        sender: 'bot',
        timestamp: new Date()
      }]);
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
    const question = chatQuestions[currentQuestion];
    
    // Just log worker registration initiated when user starts (after welcome message)
    if (question.id === 'welcome' && !isWorkerCreated) {
      console.log("🎉 Worker registration initiated!");
      addBotMessage(
        "🎉 Worker registration initiated! Let's gather your information...",
        [],
        500
      );
      setIsWorkerCreated(true); // Mark as initiated
    }
    
    if (question.field) {
      let processedResponse = response;
      
      // Handle multi-select fields
      if (question.isMultiSelect) {
        if (Array.isArray(userResponses[question.field])) {
          // Add to existing array
          const existing = userResponses[question.field];
          if (question.suggestions && question.suggestions.includes(response)) {
            processedResponse = existing.includes(response) 
              ? existing.filter(item => item !== response)
              : [...existing, response];
          } else {
            // Handle comma-separated input
            const newItems = response.split(',').map(item => item.trim()).filter(item => item);
            processedResponse = [...existing, ...newItems];
          }
        } else {
          // First selection
          if (question.suggestions && question.suggestions.includes(response)) {
            processedResponse = [response];
          } else {
            processedResponse = response.split(',').map(item => item.trim()).filter(item => item);
          }
        }
      }
      
      // Handle optional fields
      if (question.optional && (response.toLowerCase() === 'skip' || response.trim() === '')) {
        processedResponse = '';
      }

      // Special handling for specific fields
      if (question.field === 'phone') {
        processedResponse = response.replace(/[^\d]/g, '');
      }
      
      if (question.field === 'workRadius') {
        processedResponse = parseInt(response.replace(/[^\d]/g, '')) || 10;
      }

      setUserResponses(prev => ({
        ...prev,
        [question.field]: processedResponse
      }));
    }

    // Move to next question
    let nextQuestionIndex = currentQuestion + 1;
    
    // Skip phone question if phone is already available from login
    if (nextQuestionIndex < chatQuestions.length && chatQuestions[nextQuestionIndex].field === 'phone' && location.state?.phoneNumber) {
      nextQuestionIndex++;
    }
    
    if (nextQuestionIndex < chatQuestions.length) {
      setTimeout(() => {
        setCurrentQuestion(nextQuestionIndex);
        const nextQuestion = chatQuestions[nextQuestionIndex];
        
        if (nextQuestion.id === 'complete') {
          setIsCompleted(true);
          addBotMessage(nextQuestion.text, null, 500);
          setTimeout(() => {
            submitRegistration();
          }, 2000);
        } else {
          addBotMessage(nextQuestion.text, nextQuestion.suggestions, 800);
        }
      }, 500);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    addUserMessage(suggestion);
    
    const question = chatQuestions[currentQuestion];
    
    // Special handling for the welcome question - call backend to log registration initiated
    if (question.id === 'welcome' && (suggestion === "Yes, let's start!" || suggestion === "I'm ready")) {
      try {
        console.log("🎉 Worker registration initiated!");
        console.log("Calling API:", `${API_BASE_URL}/api/workers/initiate-registration`);
        
        // Call backend to log registration initiated
        const response = await fetch(`${API_BASE_URL}/api/workers/initiate-registration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'initiate' })
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (response.ok) {
          const result = await response.json();
          console.log('Backend response:', result);
          
          // Show success message
          setTimeout(() => {
            addBotMessage("🎉 Worker registration initiated! Backend is responding. Let's gather your information...", null, 800);
          }, 500);
        } else {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Backend responded with status: ${response.status}`);
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
    
    // Handle "Try Again" option
    if (suggestion === 'Try Again') {
      // Reset and restart profile creation
      setCurrentQuestion(0);
      setUserResponses({});
      setMessages([]);
      setIsCompleted(false);
      setCreatedWorkerId(null);
      setIsWorkerCreated(false);
      setTimeout(() => {
        addBotMessage(chatQuestions[0].text, chatQuestions[0].suggestions);
      }, 1000);
      return;
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
    
    processUserResponse(suggestion);
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!currentInput.trim() || !isWaitingForInput) return;
    
    const question = chatQuestions[currentQuestion];
    
    // For welcome message, just move to next
    if (question.id === 'welcome') {
      addUserMessage(currentInput);
      processUserResponse(currentInput);
      return;
    }
    
    // Validate the response
    if (question.validation) {
      const error = question.validation(currentInput);
      if (error) {
        addUserMessage(currentInput);
        setTimeout(() => {
          addBotMessage(`❌ ${error}. Please try again:`, question.suggestions, 500);
        }, 300);
        return;
      }
    }
    
    addUserMessage(currentInput);
    processUserResponse(currentInput);
  };

  const calculateShaktiScore = (data) => {
    let score = 0;
    
    // Basic Information (25 points)
    if (data.name) score += 5;
    if (data.phone) score += 5;
    if (data.email && data.email !== '') score += 3;
    if (data.age >= 18 && data.age <= 65) score += 7;
    if (data.gender) score += 5;

    // Skills & Experience (30 points)
    const skills = Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',') : []);
    if (skills.length > 0) score += 10;
    if (skills.length >= 3) score += 5;
    if (data.experience) score += 8;
    if (data.expectedSalary) score += 4;
    if (data.preferredWorkType) score += 3;

    // Languages (15 points)
    const languages = Array.isArray(data.languages) ? data.languages : (data.languages ? data.languages.split(',') : []);
    if (languages.length > 0) score += 8;
    if (languages.length >= 2) score += 4;
    if (languages.includes('English')) score += 3;

    // Location (15 points)
    if (data.village) score += 4;
    if (data.district) score += 4;
    if (data.state) score += 4;
    if (data.pincode) score += 3;

    // Work Preferences (10 points)
    if (data.availability) score += 3;
    if (data.preferredWorkType) score += 3;
    if (data.workRadius) score += 2;
    if (data.bio && data.bio.length > 50) score += 2;

    // Verification (5 points)
    if (data.aadharNumber && data.aadharNumber.length === 12) score += 5;

    return Math.min(score, 100);
  };

  const submitRegistration = async () => {
    setIsSubmitting(true);
    
    try {
      const shaktiScore = calculateShaktiScore(userResponses);
      
      // Ensure phone number is properly formatted (remove spaces and ensure it starts with 6-9)
      let phoneNumber = userResponses.phone || location.state?.phoneNumber;
      phoneNumber = phoneNumber.replace(/\s+/g, ''); // Remove spaces
      
      // If phone doesn't start with 6-9, add a valid prefix
      if (phoneNumber && !/^[6-9]/.test(phoneNumber)) {
        phoneNumber = '9' + phoneNumber.slice(-9); // Ensure it starts with 9
      }
      
      const workerData = {
        name: userResponses.name,
        age: parseInt(userResponses.age) || 25,
        phone: phoneNumber,
        email: userResponses.email === 'skip' ? '' : userResponses.email || '',
        gender: userResponses.gender || 'Male',
        aadharNumber: userResponses.aadharNumber || '123456789012',
        skills: Array.isArray(userResponses.skills) ? userResponses.skills : (userResponses.skills ? userResponses.skills.split(',').map(s => s.trim()) : ['Construction']),
        experience: userResponses.experience || 'Less than 1 year',
        preferredCategory: userResponses.preferredCategory || 'Construction',
        expectedSalary: userResponses.expectedSalary || '₹500 per day',
        languages: Array.isArray(userResponses.languages) ? userResponses.languages : (userResponses.languages ? userResponses.languages.split(',').map(s => s.trim()) : ['Hindi']),
        location: {
          address: '',
          village: userResponses.village || 'Village',
          district: userResponses.district || 'District',
          state: userResponses.state || 'State',
          pincode: userResponses.pincode || '000000',
          coordinates: {
            type: "Point",
            coordinates: [0, 0]
          }
        },
        preferredWorkType: userResponses.preferredWorkType || 'Full-time daily work',
        availability: userResponses.availability || 'Available immediately',
        workRadius: parseInt(userResponses.workRadius) || 10,
        bio: userResponses.bio === 'skip' ? '' : userResponses.bio || '',
        verificationStatus: 'pending',
        isAvailable: true,
        shaktiScore: shaktiScore,
        rating: { average: 0, count: 0, reviews: [] },
        registrationDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isLoggedIn: 1,
        profileCompletionPercentage: 95,
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

      console.log('🚀 Sending worker registration data:', JSON.stringify(workerData, null, 2));

      const response = await fetch(`${API_BASE_URL}/api/workers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerData)
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Registration failed');
      }

      const savedWorker = await response.json();
      console.log('✅ Success response:', savedWorker);
      
      // Login the user
      await loginUser({
        id: savedWorker.worker?.id || savedWorker.worker?._id,
        type: 'worker',
        phone: phoneNumber
      });
      
      // Show success message
      setTimeout(() => {
        addBotMessage(
          `🎉 Welcome to SINDH, ${userResponses.name}! Your profile has been created successfully with a Shakti Score of ${shaktiScore}! You can now start applying for jobs. Good luck! 🚀`,
          ['View My Profile', 'Find Jobs'],
          1000
        );
      }, 1000);
      
    } catch (error) {
      console.error('Registration error:', error);
      addBotMessage(
        `❌ Sorry, there was an error creating your profile: ${error.message}. Please try again or contact support.`,
        ['Try Again'],
        1000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalAction = (action) => {
    if (action === 'View My Profile') {
      navigate('/profile');
    } else if (action === 'Find Jobs') {
      navigate('/jobs');
    }
  };

  // Helper function to create initial worker profile
  const createInitialWorkerProfile = async () => {
    try {
      const phoneNumber = location.state?.phoneNumber;
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      // Create minimal worker profile with all required fields
      const initialWorkerData = {
        name: 'Worker Profile in Progress',
        age: 25, // Default age
        phone: phoneNumber,
        gender: 'Male', // Default, will be updated
        aadharNumber: '123456789012', // Temporary, will be updated
        skills: ['Construction'], // Default skill
        experience: 'Less than 1 year', // Default experience
        preferredCategory: 'Construction', // Default category
        expectedSalary: '₹500 per day', // Default salary
        languages: ['Hindi'], // Default language
        location: {
          village: 'Location to be specified',
          district: 'District',
          state: 'State',
          pincode: '000000'
        },
        preferredWorkType: 'Full-time daily work', // Default work type
        availability: 'Available immediately', // Default availability
        workRadius: 10,
        bio: 'Profile being created via chat',
        available: true,
        hourlyRate: 50,
        rating: { average: 0, count: 0 },
        completedJobs: 0,
        profileCompletionPercentage: 20
      };

      console.log('Creating initial worker profile:', initialWorkerData);

      const response = await fetch(`${API_BASE_URL}/api/workers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialWorkerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create worker profile');
      }

      const result = await response.json();
      const worker = result.worker || result;

      // Generate JWT token
      const tokenResponse = await fetch(`${API_BASE_URL}/api/auth/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: worker._id,
          role: 'worker'
        })
      });

      let token = null;
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        token = tokenData.token;
      }

      // Store worker data in localStorage
      const userData = {
        id: worker._id,
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        type: 'worker',
        isLoggedIn: 1
      };

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('worker', JSON.stringify(worker));
      localStorage.setItem('workerProfile', JSON.stringify(worker));
      localStorage.setItem('workerId', worker._id);
      localStorage.setItem('userType', 'worker');
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
      }

      setCreatedWorkerId(worker._id);
      setIsWorkerCreated(true);

      console.log('Initial worker profile created successfully:', worker._id);
      return worker._id;
    } catch (error) {
      console.error('Error creating initial worker profile:', error);
      throw error;
    }
  };

  // Helper function to update worker field
  const updateWorkerField = async (fieldName, value, workerId = createdWorkerId) => {
    if (!workerId) {
      console.warn('No worker ID available for update');
      return false;
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        console.warn('No authentication token found');
        return false;
      }

      let updateData = {};
      updateData[fieldName] = value;

      console.log(`Updating worker ${workerId} field ${fieldName}:`, updateData);

      const response = await fetch(`${API_BASE_URL}/api/workers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Worker update failed:', errorData);
        return false;
      }

      const result = await response.json();
      console.log(`Worker field ${fieldName} updated successfully:`, result);
      return true;
    } catch (error) {
      console.error(`Error updating worker field ${fieldName}:`, error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SINDH Registration Assistant</h1>
            <p className="text-sm text-gray-500">Let's create your worker profile together!</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        <div className="bg-white rounded-2xl shadow-xl h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Suggestions */}
            {showSuggestions && currentSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 justify-start"
              >
                {currentSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isCompleted) {
                        handleFinalAction(suggestion);
                      } else {
                        handleSuggestionClick(suggestion);
                      }
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isCompleted && (
            <div className="p-4 border-t bg-gray-50">
              <form onSubmit={handleInputSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={isWaitingForInput ? "Type your response..." : "Please wait..."}
                  disabled={!isWaitingForInput || isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <motion.button
                  type="submit"
                  disabled={!currentInput.trim() || !isWaitingForInput || isSubmitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {!isCompleted && (
        <div className="bg-white border-t p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round((currentQuestion / (chatQuestions.length - 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentQuestion / (chatQuestions.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRegistration;
