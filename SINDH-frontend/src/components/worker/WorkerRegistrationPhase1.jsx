import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, User, MapPin, Phone, Briefcase, DollarSign, Calendar, MapPinned } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { getApiUrlSync } from '../../config/api.js';
import Logo from '../../assets/logo.svg';
import { requestAndGetLocation, lookupPincode } from '../../services/locationService';
import LocationPermissionDialog from '../common/LocationPermissionDialog';

const WorkerRegistrationPhase1 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location state
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Phase-1 Minimal Form Data (9 steps)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: location.state?.phoneNumber || '',
    preferredCategory: '',
    expectedSalary: '',
    location: {
      village: '',
      district: '',
      state: '',
      pincode: '',
      coordinates: {
        type: "Point",
        coordinates: [0, 0]
      }
    }
  });

  // Phase-1 Questions (9 steps total)
  const chatQuestions = [
    {
      id: 'welcome',
      type: 'system',
      text: "👋 नमस्ते! SINDH में आपका स्वागत है। मैं आपकी प्रोफ़ाइल बनाने में मदद करूंगा। तैयार हैं?",
      field: null,
      suggestions: ['हाँ, शुरू करें!', 'Yes, let\'s start!']
    },
    {
      id: 'name',
      type: 'question',
      text: "आपका पूरा नाम क्या है?",
      field: 'name',
      icon: User,
      validation: (value) => value.trim().length >= 2 ? null : "कृपया अपना पूरा नाम दर्ज करें"
    },
    {
      id: 'age',
      type: 'question',
      text: "आपकी उम्र क्या है? (18-70 वर्ष)",
      field: 'age',
      icon: Calendar,
      validation: (value) => {
        const age = parseInt(value);
        return age >= 18 && age <= 70 ? null : "कृपया 18-70 के बीच मान्य आयु दर्ज करें";
      }
    },
    {
      id: 'phone',
      type: 'question',
      text: "आपका मोबाइल नंबर क्या है? (10 अंक)",
      field: 'phone',
      icon: Phone,
      skip: !!location.state?.phoneNumber, // Skip if phone already provided
      validation: (value) => {
        const cleaned = value.replace(/[^\d]/g, '');
        return cleaned.length === 10 ? null : "कृपया 10 अंकों का मोबाइल नंबर दर्ज करें";
      }
    },
    {
      id: 'location',
      type: 'gps',
      text: "अब मुझे आपका स्थान चाहिए। मैं आपकी GPS लोकेशन लूंगा, ठीक है?",
      field: 'location',
      icon: MapPinned,
      suggestions: ['📍 GPS से लोकेशन लें', '✍️ पिनकोड दर्ज करें'],
      validation: (value) => value?.pincode ? null : "कृपया अपना स्थान साझा करें"
    },
    {
      id: 'manual-pincode',
      type: 'question',
      text: "कृपया अपना 6 अंकों का पिनकोड दर्ज करें:",
      field: 'pincode',
      icon: MapPin,
      skip: true, // Only shown if user chooses manual pincode
      validation: (value) => {
        const cleaned = value.replace(/[^\d]/g, '');
        return cleaned.length === 6 ? null : "कृपया 6 अंकों का मान्य पिनकोड दर्ज करें";
      }
    },
    {
      id: 'village',
      type: 'question',
      text: () => {
        const district = formData.location?.district || 'जिला';
        const state = formData.location?.state || 'राज्य';
        return `बढ़िया! आपका स्थान:\n\n📍 जिला: ${district}\n🏛️ राज्य: ${state}\n\nअब ${district} में आपका गांव या इलाका कौन सा है?`;
      },
      field: 'village',
      icon: MapPin,
      validation: (value) => value.trim().length >= 2 ? null : "कृपया अपना गांव या इलाका दर्ज करें"
    },
    {
      id: 'preferredCategory',
      type: 'question',
      text: "आप किस तरह का काम करना चाहते हैं?",
      field: 'preferredCategory',
      icon: Briefcase,
      suggestions: [
        'निर्माण (Construction)',
        'कृषि (Agriculture)',
        'घरेलू कार्य (Household)',
        'परिवहन (Transportation)',
        'विनिर्माण (Manufacturing)',
        'खुदरा (Retail)',
        'अन्य (Other)'
      ],
      validation: (value) => value.trim() ? null : "कृपया अपनी पसंदीदा श्रेणी चुनें"
    },
    {
      id: 'expectedSalary',
      type: 'question',
      text: "आपकी अपेक्षित दैनिक मजदूरी क्या है? (जैसे: ₹500 प्रति दिन)",
      field: 'expectedSalary',
      icon: DollarSign,
      suggestions: ['₹300-400', '₹400-500', '₹500-700', '₹700-1000', '₹1000+'],
      validation: (value) => value.trim() ? null : "कृपया अपनी अपेक्षित मजदूरी दर्ज करें"
    },
    {
      id: 'summary',
      type: 'summary',
      text: "📋 यह आपकी जानकारी है। कृपया जांचें और सबमिट करें:",
      field: null
    },
    {
      id: 'complete',
      type: 'system',
      text: "🎉 बधाई हो! आपकी प्रोफ़ाइल बन गई है। अब आप नौकरियां खोज सकते हैं!",
      field: null
    }
  ];

  // Start conversation on mount
  useEffect(() => {
    if (location.state?.phoneNumber) {
      addBotMessage(
        `👋 नमस्ते! मैं देख रहा हूं कि आप ${location.state.phoneNumber} से रजिस्टर कर रहे हैं। चलिए शुरू करें!`,
        ['हाँ, शुरू करें!']
      );
    } else {
      addBotMessage(chatQuestions[0].text, chatQuestions[0].suggestions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (text, suggestions = null, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
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

  const handleGPSLocationCapture = async () => {
    setLocationLoading(true);
    setShowLocationDialog(true);

    try {
      const locationResult = await requestAndGetLocation();

      if (!locationResult.success) {
        throw new Error(locationResult.message || 'स्थान प्राप्त करने में विफल');
      }

      const { latitude, longitude, pincode, district, state } = locationResult;

      // Update form data
      setFormData(prev => ({
        ...prev,
        location: {
          village: '',
          district: district || '',
          state: state || '',
          pincode: pincode || '',
          coordinates: {
            type: "Point",
            coordinates: [longitude, latitude]
          }
        }
      }));

      setLocationLoading(false);
      setShowLocationDialog(false);

      // Add user message
      addUserMessage(`📍 GPS स्थान प्राप्त किया`);

      // Move to next question
      setTimeout(() => {
        moveToNextQuestion();
      }, 500);

      toast.success('स्थान सफलतापूर्वक प्राप्त किया गया!');
    } catch (error) {
      console.error('GPS location error:', error);
      setLocationLoading(false);
      setShowLocationDialog(false);
      toast.error(error.message || 'स्थान प्राप्त करने में त्रुटि');
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    const currentQ = chatQuestions[currentQuestion];

    // Handle GPS location request
    if (currentQ.type === 'gps' && suggestion.includes('GPS')) {
      await handleGPSLocationCapture();
      return;
    }

    // Handle manual pincode entry
    if (currentQ.type === 'gps' && suggestion.includes('पिनकोड')) {
      addUserMessage(suggestion);
      // Move to manual pincode question (skip GPS)
      setCurrentQuestion(currentQuestion + 1);
      const manualPincodeQ = chatQuestions[currentQuestion + 1];
      addBotMessage(manualPincodeQ.text, null);
      return;
    }

    // Handle normal suggestions
    addUserMessage(suggestion);

    if (currentQ.field) {
      const cleanValue = suggestion.replace(/\(.*?\)/g, '').trim(); // Remove (English) translations
      handleFieldUpdate(currentQ.field, cleanValue);
    }

    setTimeout(() => {
      moveToNextQuestion();
    }, 500);
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() || !isWaitingForInput) return;

    const currentQ = chatQuestions[currentQuestion];

    // Validate input
    if (currentQ.validation) {
      const error = currentQ.validation(currentInput);
      if (error) {
        toast.error(error);
        return;
      }
    }

    addUserMessage(currentInput);

    // Handle pincode lookup
    if (currentQ.field === 'pincode') {
      const pincodeResult = await lookupPincode(currentInput);

      if (!pincodeResult.success) {
        toast.error(pincodeResult.message);
        return;
      }

      // Update form data with pincode lookup results
      setFormData(prev => ({
        ...prev,
        location: {
          village: '',
          district: pincodeResult.district || '',
          state: pincodeResult.state || '',
          pincode: pincodeResult.pincode || '',
          coordinates: {
            type: "Point",
            coordinates: [0, 0] // No GPS coordinates for manual pincode
          }
        }
      }));

      toast.success('पिनकोड सफलतापूर्वक जांचा गया!');
    } else if (currentQ.field) {
      handleFieldUpdate(currentQ.field, currentInput);
    }

    setTimeout(() => {
      moveToNextQuestion();
    }, 500);
  };

  const handleFieldUpdate = (field, value) => {
    if (field === 'village') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          village: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const moveToNextQuestion = () => {
    let nextIndex = currentQuestion + 1;

    // Skip phone question if already provided
    while (nextIndex < chatQuestions.length && chatQuestions[nextIndex].skip) {
      nextIndex++;
    }

    if (nextIndex < chatQuestions.length) {
      setCurrentQuestion(nextIndex);
      const nextQ = chatQuestions[nextIndex];

      if (nextQ.type === 'summary') {
        showSummary();
      } else if (nextQ.type === 'system' || nextQ.type === 'complete') {
        addBotMessage(nextQ.text, nextQ.suggestions);
        // Complete state handling removed - navigation handles completion
      } else {
        const questionText = typeof nextQ.text === 'function' ? nextQ.text() : nextQ.text;
        addBotMessage(questionText, nextQ.suggestions);
      }
    }
  };

  const showSummary = () => {
    const summaryText = `
📋 **आपकी जानकारी:**

👤 नाम: ${formData.name}
📅 उम्र: ${formData.age} वर्ष
📱 मोबाइल: ${formData.phone}
📍 स्थान: ${formData.location.village}, ${formData.location.district}, ${formData.location.state} - ${formData.location.pincode}
💼 काम की श्रेणी: ${formData.preferredCategory}
💰 अपेक्षित मजदूरी: ${formData.expectedSalary}

क्या यह जानकारी सही है?
    `;

    addBotMessage(summaryText, ['✅ सबमिट करें', '✅ Submit', '❌ फिर से भरें']);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const apiUrl = getApiUrlSync();

      const payload = {
        name: formData.name,
        age: parseInt(formData.age),
        phone: formData.phone,
        preferredCategory: formData.preferredCategory.replace(/\(.*?\)/g, '').trim(),
        expectedSalary: formData.expectedSalary,
        location: formData.location,
        phase: 1, // Phase-1 registration
        gender: 'Male', // Default
        skills: [], // Empty for Phase-1
        experience: 'Less than 1 year', // Default
        languages: ['Hindi'], // Default
        preferredWorkType: 'Full-time daily work', // Default
        availability: 'Available immediately' // Default
      };

      console.log('Submitting Phase-1 worker registration:', payload);

      const response = await fetch(`${apiUrl}/workers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      console.log('Registration successful:', data);

      // Login user
      loginUser(data.worker);

      // Show success message
      addBotMessage("🎉 बधाई हो! आपकी प्रोफ़ाइल बन गई है। अब आप नौकरियां खोज सकते हैं!");

      toast.success('पंजीकरण सफल!');

      // Navigate to worker dashboard after 2 seconds
      setTimeout(() => {
        navigate('/jobs');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'पंजीकरण में त्रुटि हुई');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#E8DFD5] to-[#DBBBA7] relative overflow-hidden">
      {/* Blur Circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#E8DFD5] rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#DBBBA7] rounded-full blur-3xl opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF7124]/10 rounded-full blur-3xl opacity-40" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6 bg-white/80 backdrop-blur-md border-b border-[#3B4883]/10">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="SINDH Logo" className="w-10 h-10" />
          <div>
            <h1 className="text-xl font-bold text-[#202124]">SINDH Worker</h1>
            <p className="text-xs text-[#202124]/60">प्रोफ़ाइल बनाएं</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#202124]/70">चरण {currentQuestion + 1}/{chatQuestions.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 w-full h-2 bg-[#3B4883]/10">
        <motion.div
          className="h-full bg-gradient-to-r from-[#FF7124] to-[#e66420]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestion + 1) / chatQuestions.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Chat Container */}
      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-6 pt-8 pb-32">
        <div className="space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-6 py-4 rounded-2xl shadow-lg ${msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white'
                    : 'bg-white/90 border border-[#3B4883]/10 text-[#202124]'
                  }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/90 border border-[#3B4883]/10 px-6 py-4 rounded-2xl shadow-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-[#FF7124] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#FF7124] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-[#FF7124] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {showSuggestions && currentSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {currentSuggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 bg-white/90 hover:bg-[#FF7124] hover:text-white border border-[#3B4883]/20 rounded-full text-sm font-medium text-[#202124] transition-all duration-200 shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        {chatQuestions[currentQuestion]?.type === 'summary' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-4 bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  सबमिट हो रहा है...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  प्रोफ़ाइल बनाएं
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>

      {/* Input Field */}
      {isWaitingForInput && !showSuggestions && chatQuestions[currentQuestion]?.type !== 'gps' && chatQuestions[currentQuestion]?.type !== 'summary' && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-[#3B4883]/10 p-4 shadow-lg"
        >
          <form onSubmit={handleInputSubmit} className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="यहाँ टाइप करें..."
              className="flex-1 px-6 py-4 bg-white border border-[#3B4883]/20 rounded-full text-[#202124] placeholder-[#202124]/40 focus:outline-none focus:border-[#FF7124] focus:ring-2 focus:ring-[#FF7124]/20 transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={!currentInput.trim()}
              className="px-8 py-4 bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              भेजें
            </button>
          </form>
        </motion.div>
      )}

      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        isOpen={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        loading={locationLoading}
      />
    </div>
  );
};

export default WorkerRegistrationPhase1;
