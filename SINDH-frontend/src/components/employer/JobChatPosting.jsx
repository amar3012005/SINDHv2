import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Building, MapPin, Briefcase, DollarSign, Clock, Users, CheckCircle, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';

const JobChatPosting = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [jobData, setJobData] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelpTip, setShowHelpTip] = useState(false);
  const [createdJobId, setCreatedJobId] = useState(null);
  const [isJobCreated, setIsJobCreated] = useState(false);

  // Helper function to ensure employer profile exists
  const ensureEmployerProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!user.id || user.type !== 'employer') {
        throw new Error('You must be logged in as an employer to post jobs');
      }

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Check if employer profile exists
      console.log('Checking employer profile for user:', user.id);
      
      const checkResponse = await fetch(buildApiUrl(`/employers/${user.id}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'user-type': 'employer'
        }
      });

      if (checkResponse.ok) {
        console.log('Employer profile exists');
        return user.id;
      }

      // If profile doesn't exist, create it
      console.log('Creating employer profile...');
      
      const employerData = {
        name: user.name || 'Employer Name',
        phone: user.phone || user.phoneNumber || '0000000000',
        email: user.email || 'employer@example.com',
        company: {
          name: user.company?.name || user.companyName || 'Company Name',
          type: 'Business',
          industry: 'General'
        },
        location: {
          village: user.location?.city || 'City',
          district: user.location?.district || user.location?.city || 'District',
          state: user.location?.state || 'State',
          pincode: user.location?.pincode || '000000',
          address: user.location?.address || 'Address'
        },
        businessDescription: 'Business description',
        verificationDocuments: {
          aadharNumber: '000000000000',
          panNumber: 'ABCDE1234F',
          businessLicense: 'BL123456'
        },
        verificationStatus: 'pending'
      };

      const createResponse = await fetch(buildApiUrl('/employers/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employerData)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        console.error('Failed to create employer profile:', errorData);
        throw new Error(errorData.message || 'Failed to create employer profile');
      }

      const result = await createResponse.json();
      const employerId = result.employer?._id || result._id;
      console.log('Employer profile created successfully:', employerId);
      
      // Update localStorage with new employer data
      const updatedUser = { ...user, id: employerId, _id: employerId };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('employerProfile', JSON.stringify(result.employer || result));
      
      return employerId;
    } catch (error) {
      console.error('Error ensuring employer profile:', error);
      throw error;
    }
  };


  // Helper function to update existing job
  const updateJobField = async (fieldName, value, jobId = createdJobId) => {
    if (!jobId) {
      console.warn('No job ID available for update');
      return false;
    }

    try {
      // Get employer data (same as PostJob.jsx)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.id || user.type !== 'employer') {
        throw new Error('You must be logged in as an employer to update jobs');
      }

      // Map frontend values to backend format
      let updateData = {};
      
      if (fieldName === 'category') {
        const categoryMapping = {
          'Agriculture & Farming': 'Agriculture',
          'Construction & Building': 'Construction',
          'Food Service & Hospitality': 'Retail',
          'Manufacturing & Production': 'Manufacturing',
          'Domestic Help & Cleaning': 'Household',
          'Transportation & Delivery': 'Transportation',
          'Retail & Sales': 'Retail',
          'Security & Safety': 'Retail',
          'Handicrafts & Arts': 'Manufacturing',
          'General Labor': 'Construction'
        };
        updateData[fieldName] = categoryMapping[value] || 'Construction';
      } else if (fieldName === 'employmentType') {
        const employmentMapping = {
          'Full-time (Permanent)': 'full-time',
          'Part-time': 'part-time',
          'Contract (Fixed duration)': 'contract',
          'Temporary (Short-term)': 'contract',
          'Seasonal Work': 'contract',
          'Daily Wage': 'part-time',
          'Project-based': 'contract'
        };
        updateData[fieldName] = employmentMapping[value] || 'full-time';
      } else if (fieldName === 'salary') {
        const extractSalary = (salaryString) => {
          if (!salaryString) return 500;
          const matches = salaryString.match(/₹?(\d+)/);
          return matches ? parseInt(matches[1]) : 500;
        };
        updateData[fieldName] = extractSalary(value);
      } else if (fieldName === 'location') {
        const parseLocation = (locationString) => {
          const parts = locationString.split(',').map(s => s.trim());
          return {
            type: 'onsite', // Default to onsite
            street: parts[0] || 'Work location',
            city: parts[1] || user?.location?.city || 'City',
            state: user?.location?.state || 'State',
            pincode: user?.location?.pincode || '000000'
          };
        };
        updateData[fieldName] = parseLocation(value);
      } else {
        updateData[fieldName] = value;
      }

      console.log(`Updating job ${jobId} field ${fieldName}:`, updateData);

      // Get token for authentication
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Send request with Authorization header
      const response = await fetch(buildApiUrl(`/jobs/${jobId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Job update failed:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Job field ${fieldName} updated successfully:`, result);
      
      return true;
    } catch (error) {
      console.error(`Error updating job field ${fieldName}:`, error);
      // Don't show toast for individual field updates to avoid spam
      console.warn('Failed to update job field: ' + error.message);
      return false;
    }
  };

  // Helper function to finalize the job (change status from draft to active)
  const finalizeJob = async (jobId = createdJobId) => {
    // At the end, create the job in the database with all collected data
    try {
      // Ensure employer profile exists
      const employerId = await ensureEmployerProfile();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerProfile = JSON.parse(localStorage.getItem('employerProfile') || '{}');

      // Prepare job data
      const categoryMapping = {
        'Agriculture & Farming': 'Agriculture',
        'Construction & Building': 'Construction',
        'Food Service & Hospitality': 'Retail',
        'Manufacturing & Production': 'Manufacturing',
        'Domestic Help & Cleaning': 'Household',
        'Transportation & Delivery': 'Transportation',
        'Retail & Sales': 'Retail',
        'Security & Safety': 'Retail',
        'Handicrafts & Arts': 'Manufacturing',
        'General Labor': 'Construction'
      };
      const employmentMapping = {
        'Full-time (Permanent)': 'Full-time',
        'Part-time': 'Part-time',
        'Contract (Fixed duration)': 'Contract',
        'Temporary (Short-term)': 'Temporary',
        'Seasonal Work': 'Temporary',
        'Daily Wage': 'Daily wage',
        'Project-based': 'Contract'
      };
      const extractSalary = (salaryString) => {
        if (!salaryString) return 500;
        const matches = salaryString.match(/₹?(\d+)/);
        return matches ? parseInt(matches[1]) : 500;
      };
      const parseLocation = (locationString) => {
        const parts = locationString.split(',').map(s => s.trim());
        return {
          type: 'onsite',
          street: parts[0] || 'Work location',
          city: parts[1] || user?.location?.city || 'City',
          state: user?.location?.state || 'State',
          pincode: user?.location?.pincode || '000000'
        };
      };
      const jobPostingData = {
        title: jobData.title,
        description: jobData.description,
        category: categoryMapping[jobData.category] || 'Construction',
        location: parseLocation(jobData.location),
        employmentType: employmentMapping[jobData.employmentType] || 'Full-time',
        salary: extractSalary(jobData.salary),
        duration: jobData.duration,
        requirements: jobData.requirements || 'Basic requirements',
        employer: employerId,
        employerName: employerProfile.name || user.name || 'Employer',
        companyName: employerProfile.company?.name || employerProfile.companyName || 'Company',
        status: 'active'
      };

      // Get token for authentication
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Create the job in the backend
      const response = await fetch(buildApiUrl('/jobs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobPostingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Job posting failed:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setCreatedJobId(result.job._id || result._id);
      setIsJobCreated(true);
      console.log('Job posted successfully:', result);
      toast.success('🎉 Job posted successfully!');
      return true;
    } catch (error) {
      console.error('Error finalizing job:', error);
      toast.error('Failed to publish job: ' + error.message);
      return false;
    }
  };

  // Helper function to log job creation initiation (no DB write)
  const logJobInitiation = async () => {
    try {
      // Just log initiation to backend, do not create job in DB
      const response = await fetch(buildApiUrl('/jobs/initiate-creation'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'initiate' })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend responded with status: ${response.status}`);
      }
      const result = await response.json();
      console.log('🎉 Job creation initiated!', result);
    } catch (error) {
      console.error('Error logging job initiation:', error);
      throw error;
    }
  };

  const jobQuestions = [
    {
      id: 'welcome',
      type: 'system',
      text: "👋 Hi! I'm your SINDH Job Assistant! I'll help you create an amazing job posting that attracts the best workers. This will take just 2-3 minutes. Ready to find your perfect worker? 🚀",
      field: null,
      suggestions: ['Yes, let\'s create a job!', 'I\'m ready to start', 'Help me post a job'],
      icon: '💼'
    },
    {
      id: 'title',
      type: 'question',
      text: "Perfect! Let's start with a catchy job title. What position are you looking to fill?",
      field: 'title',
      suggestions: [
        'Farm Worker for Wheat Harvesting',
        'Construction Helper',
        'Kitchen Assistant',
        'Factory Worker',
        'Shop Assistant',
        'Delivery Driver',
        'Cleaning Staff',
        'Security Guard',
        'Let me type my own'
      ],
      helpText: "💡 Tip: Be specific! Include the main task or skill needed.",
      validation: (value) => value.trim().length >= 5 ? null : "Please enter a descriptive job title (at least 5 characters)",
      icon: '🎯'
    },
    {
      id: 'description',
      type: 'question',
      text: "Great choice! Now tell me what the worker will actually do. What are the main responsibilities?",
      field: 'description',
      suggestions: [
        'Physical farm work including planting and harvesting',
        'Assisting with construction and manual labor',
        'Cooking and food preparation tasks',
        'Operating machinery and equipment',
        'Customer service and sales support',
        'Cleaning and maintenance work',
        'Let me write a custom description'
      ],
      helpText: "💡 Be detailed! Workers want to know exactly what they'll be doing.",
      validation: (value) => value.trim().length >= 20 ? null : "Please provide a detailed description (at least 20 characters)",
      icon: '📝'
    },
    {
      id: 'category',
      type: 'question',
      text: "Which category best describes this job? This helps workers find it easily! 🔍",
      field: 'category',
      suggestions: [
        'Agriculture & Farming',
        'Construction & Building',
        'Food Service & Hospitality',
        'Manufacturing & Production',
        'Domestic Help & Cleaning',
        'Transportation & Delivery',
        'Retail & Sales',
        'Security & Safety',
        'Handicrafts & Arts',
        'General Labor'
      ],
      validation: (value) => value.trim() ? null : "Please select a job category",
      icon: '📂'
    },
    {
      id: 'salary',
      type: 'question',
      text: "Now for the important part - compensation! What's your budget for this position? 💰",
      field: 'salary',
      suggestions: [
        '₹300-500 per day',
        '₹500-800 per day',
        '₹800-1200 per day',
        '₹10,000-15,000 per month',
        '₹15,000-25,000 per month',
        '₹25,000+ per month',
        'Negotiable based on experience',
        'Let me specify exact amount'
      ],
      helpText: "💡 Fair wages attract better workers! Be competitive in your area.",
      validation: (value) => value.trim() ? null : "Please specify the salary/wage",
      icon: '💵'
    },
    {
      id: 'location',
      type: 'question',
      text: "Where will the work take place? Please specify the location 📍",
      field: 'location',
      suggestions: [
        `${user?.location?.village || 'My Village'}, ${user?.location?.district || 'My District'}`,
        'At my farm/business location',
        'Multiple locations in my area',
        'Worker can work from home',
        'Let me specify exact location'
      ],
      validation: (value) => value.trim() ? null : "Please specify the job location",
      icon: '📍'
    },
    {
      id: 'workingHours',
      type: 'question',
      text: "What are the working hours? Be clear about timing expectations ⏰",
      field: 'workingHours',
      suggestions: [
        '6 AM to 2 PM (8 hours)',
        '8 AM to 5 PM (9 hours)',
        '9 AM to 6 PM (9 hours)',
        'Flexible hours',
        'Part-time (4-6 hours)',
        'Shift work',
        'Seasonal hours',
        'Let me specify custom hours'
      ],
      validation: (value) => value.trim() ? null : "Please specify working hours",
      icon: '⏰'
    },
    {
      id: 'requirements',
      type: 'question',
      text: "What skills or requirements do you need? Don't worry if you need fresh talent! 🎯",
      field: 'requirements',
      suggestions: [
        'No experience needed - will train',
        'Basic farming knowledge required',
        'Physical fitness required',
        'Previous experience preferred',
        'Must be reliable and punctual',
        'Should understand local language',
        'Own transportation preferred',
        'Let me specify custom requirements'
      ],
      validation: (value) => value.trim() ? null : "Please specify requirements",
      icon: '✅'
    },
    {
      id: 'employmentType',
      type: 'question',
      text: "What type of employment is this? This helps set proper expectations 📋",
      field: 'employmentType',
      suggestions: [
        'Full-time (Permanent)',
        'Part-time',
        'Contract (Fixed duration)',
        'Temporary (Short-term)',
        'Seasonal Work',
        'Daily Wage',
        'Project-based'
      ],
      validation: (value) => value.trim() ? null : "Please select employment type",
      icon: '📋'
    },
    {
      id: 'duration',
      type: 'question',
      text: "How long will this job last? This helps workers plan ahead 📅",
      field: 'duration',
      suggestions: [
        '1-2 weeks',
        '1 month',
        '2-3 months',
        '6 months',
        'Ongoing/Permanent',
        'Until harvest season',
        'Project completion',
        'Let me specify custom duration'
      ],
      validation: (value) => value.trim() ? null : "Please specify job duration",
      icon: '📅'
    },
    {
      id: 'urgency',
      type: 'question',
      text: "When do you need the worker to start? ⚡",
      field: 'startDate',
      suggestions: [
        'Immediately',
        'Within a week',
        'Within 2 weeks',
        'Next month',
        'Flexible start date'
      ],
      validation: (value) => value.trim() ? null : "Please specify when you need the worker to start",
      icon: '⚡'
    },
    {
      id: 'complete',
      type: 'system',
      text: "🎉 Fantastic! I have all the details needed to create your job posting. Let me prepare an attractive listing that will find you the perfect worker...",
      field: null,
      icon: '🚀'
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      addBotMessage(jobQuestions[0].text, jobQuestions[0].suggestions, jobQuestions[0].icon);
    }, 1000);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (text, suggestions = null, icon = null, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text,
        sender: 'bot',
        timestamp: new Date(),
        icon
      }]);
      setIsTyping(false);
      
      if (suggestions) {
        setCurrentSuggestions(suggestions);
        setShowSuggestions(true);
        
        // Show help tip for first few questions
        if (currentStep < 3) {
          setTimeout(() => setShowHelpTip(true), 500);
          setTimeout(() => setShowHelpTip(false), 3000);
        }
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
    setShowHelpTip(false);
  };

  const processUserResponse = async (response) => {
    const question = jobQuestions[currentStep];
    // If this is the welcome step, just log initiation (no DB write)
    if (question.id === 'welcome') {
      try {
        await logJobInitiation();
        setTimeout(() => {
          addBotMessage(
            "✅ Great! I've started creating your job posting. Let's gather the details...",
            null,
            '✅',
            300
          );
        }, 500);
      } catch (error) {
        console.error('Error logging job initiation:', error);
        setTimeout(() => {
          addBotMessage(
            `❌ Failed to start job creation: ${error.message}. Please make sure you're logged in as an employer.`,
            ['Try again', 'Go back to dashboard'],
            '❌'
          );
        }, 500);
        return;
      }
    }
    
    // Update job data locally
    if (question.field) {
      setJobData(prev => ({
        ...prev,
        [question.field]: response
      }));
      
      // Update the job in the backend immediately if we have a job created
      if (isJobCreated && createdJobId) {
        await updateJobField(question.field, response);
      }
    }

    // Move to next question
    const nextQuestionIndex = currentStep + 1;
    
    if (nextQuestionIndex < jobQuestions.length) {
      setTimeout(() => {
        setCurrentStep(nextQuestionIndex);
        const nextQuestion = jobQuestions[nextQuestionIndex];
        
        if (nextQuestion.id === 'complete') {
          setIsCompleted(true);
          addBotMessage(nextQuestion.text, null, nextQuestion.icon, 500);
          setTimeout(() => {
            addBotMessage(
              "🎉 Fantastic! I have all the details needed to create your job posting. Let me prepare an attractive listing that will find you the perfect worker...",
              null,
              '🚀',
              1200
            );
          }, 1200);
          setTimeout(() => {
            finalizeJob(); // Finalize the job (change status to active)
          }, 3200);
        } else {
          addBotMessage(
            nextQuestion.text, 
            nextQuestion.suggestions, 
            nextQuestion.icon, 
            800
          );
        }
      }, 500);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    // Handle "Try Again" for backend connectivity issues
    if (suggestion === 'Try Again') {
      setCurrentStep(0);
      setJobData({});
      setMessages([]);
      setIsCompleted(false);
      setIsSubmitting(false);
      setTimeout(() => {
        addBotMessage(jobQuestions[0].text, jobQuestions[0].suggestions, jobQuestions[0].icon);
      }, 1000);
      return;
    }

    // Handle welcome message - initiate job creation (same logic as worker/employer chat registration)
    const question = jobQuestions[currentStep];
    if (question.id === 'welcome' && !isJobCreated && (suggestion.includes('create a job') || suggestion.includes('ready to start') || suggestion.includes('Help me post'))) {
      try {
        await logJobInitiation();
        addUserMessage(suggestion);
        setTimeout(() => {
          addBotMessage("🎉 Job creation initiated! Let's gather your job details...", null, null, 800);
        }, 500);
        setIsJobCreated(true); // Mark as initiated
        setTimeout(async () => {
          await processUserResponse(suggestion);
        }, 300);
        return;
      } catch (error) {
        addUserMessage(suggestion);
        setTimeout(() => {
          addBotMessage(`❌ Backend connection failed: ${error.message}. Please check if the server is running.`, ['Try Again'], null, 800);
        }, 500);
        return;
      }
    }
    
    // Handle "Let me type/write" options
    if (suggestion.includes('Let me') || suggestion.includes('custom')) {
      setShowSuggestions(false);
      setIsWaitingForInput(true);
      
      addBotMessage(
        `Great! Please type your ${question.field} below:`,
        null,
        null,
        300
      );
      return;
    }
    
    addUserMessage(suggestion);
    
    // Validate the response
    if (question.validation) {
      const error = question.validation(suggestion);
      if (error) {
        setTimeout(() => {
          addBotMessage(
            `❌ ${error}. Please try again:`, 
            question.suggestions, 
            null, 
            500
          );
        }, 300);
        return;
      }
    }
    
    // Add confirmation message for important selections
    if (['salary', 'workingHours', 'duration'].includes(question.field)) {
      setTimeout(() => {
        addBotMessage(
          `Perfect! ✅ I've noted: ${suggestion}`,
          null,
          '✅',
          300
        );
      }, 100);
    }
    
    setTimeout(async () => {
      await processUserResponse(suggestion);
    }, ['salary', 'workingHours', 'duration'].includes(question.field) ? 1000 : 300);
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() || !isWaitingForInput) return;
    
    const question = jobQuestions[currentStep];
    
    // For welcome message, just move to next
    if (question.id === 'welcome') {
      addUserMessage(currentInput);
      await processUserResponse(currentInput);
      return;
    }
    
    // Validate the response
    if (question.validation) {
      const error = question.validation(currentInput);
      if (error) {
        addUserMessage(currentInput);
        setTimeout(() => {
          addBotMessage(
            `❌ ${error}. Please try again:`, 
            question.suggestions, 
            null, 
            500
          );
        }, 300);
        return;
      }
    }
    
    addUserMessage(currentInput);
    
    // Add confirmation for typed responses
    setTimeout(() => {
      addBotMessage(
        `Great! ✅ I've saved that information.`,
        null,
        '✅',
        300
      );
    }, 100);
    
    setTimeout(async () => {
      await processUserResponse(currentInput);
    }, 800);
  };

  const submitJobPosting = async () => {
    setIsSubmitting(true);
    
    try {
      // If job was already created progressively, just finalize it
      if (isJobCreated && createdJobId) {
        const finalized = await finalizeJob();
        if (finalized) {
          setTimeout(() => {
            addBotMessage(
              "🎉 Perfect! Your job posting is now live and visible to workers. You'll start receiving applications soon!",
              null,
              '🚀',
              1000
            );
          }, 500);
          
          setTimeout(() => {
            addBotMessage(
              "You can view and manage your job posting from your dashboard. Would you like to:",
              ['View my job posting', 'Post another job', 'Go to dashboard'],
              '💼',
              1500
            );
          }, 2500);
        } else {
          throw new Error('Failed to finalize job posting');
        }
        setIsSubmitting(false);
        return;
      }

      // Fallback: create job with all data if not created progressively
      // (This should not happen in normal flow, but kept as backup)
      
      // Map category to backend enum values
      const categoryMapping = {
        'Agriculture & Farming': 'Agriculture',
        'Construction & Building': 'Construction',
        'Food Service & Hospitality': 'Retail',
        'Manufacturing & Production': 'Manufacturing',
        'Domestic Help & Cleaning': 'Household',
        'Transportation & Delivery': 'Transportation',
        'Retail & Sales': 'Retail',
        'Security & Safety': 'Retail',
        'Handicrafts & Arts': 'Manufacturing',
        'General Labor': 'Construction'
      };

      // Map employment type to backend enum values
      const employmentMapping = {
        'Full-time (Permanent)': 'Full-time',
        'Part-time': 'Part-time',
        'Contract (Fixed duration)': 'Contract',
        'Temporary (Short-term)': 'Temporary',
        'Seasonal Work': 'Temporary',
        'Daily Wage': 'Daily wage',
        'Project-based': 'Contract'
      };

      // Extract salary number from string
      const extractSalary = (salaryString) => {
        if (!salaryString) return 500;
        const matches = salaryString.match(/₹?(\d+)/);
        return matches ? parseInt(matches[1]) : 500;
      };

      // Parse location string into required structure
      const parseLocation = (locationString) => {
        const parts = locationString.split(',').map(s => s.trim());
        return {
          type: 'onsite', // Default to onsite
          street: parts[0] || 'Work location',
          city: parts[1] || user?.location?.city || 'City',
          state: user?.location?.state || 'State',
          pincode: user?.location?.pincode || '000000'
        };
      };

      const jobPostingData = {
        title: jobData.title,
        description: jobData.description,
        category: categoryMapping[jobData.category] || 'Construction',
        location: parseLocation(jobData.location),
        employmentType: employmentMapping[jobData.employmentType] || 'Full-time',
        salary: extractSalary(jobData.salary),
        duration: jobData.duration,
        requirements: jobData.requirements || 'Basic requirements',
        employerName: user?.name || 'Employer',
        companyName: user?.company?.name || user?.businessName || 'Company',
        status: 'active'
      };

      console.log('Posting job with data:', jobPostingData);

      // Get token for authentication
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerProfile = JSON.parse(localStorage.getItem('employerProfile') || '{}');
      
      if (!user.id || user.type !== 'employer') {
        throw new Error('You must be logged in as an employer to post jobs');
      }

      const response = await fetch(buildApiUrl('/jobs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobPostingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Job posting failed:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Job posted successfully:', result);
      
      // Show success message
      setTimeout(() => {
        addBotMessage(
          `🎉 Congratulations! Your job "${jobData.title}" is now live on SINDH! \n\n✅ Workers in your area can now see and apply\n✅ You'll get notifications when someone applies\n✅ You can manage applications from your dashboard\n\nWhat would you like to do next?`,
          ['View My Job Posting', 'Post Another Job', 'Go to Dashboard', 'Manage Applications'],
          '🎊',
          1000
        );
      }, 1000);
      
      toast.success('Job posted successfully!');
      
    } catch (error) {
      console.error('Job posting error:', error);
      
      // More specific error handling
      let errorMessage = "❌ Oops! Something went wrong while posting your job.";
      
      if (error.message.includes('Authentication required')) {
        errorMessage = "❌ Please log in again to post your job.";
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else if (error.message.includes('401')) {
        errorMessage = "❌ Authentication failed. Please log in again.";
      } else if (error.message.includes('400')) {
        errorMessage = "❌ Some job information needs to be corrected. Let me help you fix it.";
      } else if (error.message.includes('500')) {
        errorMessage = "❌ Server error. Our team has been notified. Please try again in a moment.";
      } else if (error.message.includes('fetch')) {
        errorMessage = "❌ Connection error. Please check your internet and try again.";
      }
      
      addBotMessage(
        `${errorMessage}\n\nDon't worry, your information is saved. What would you like to do?`,
        ['Try Again', 'Edit Job Details', 'Contact Support'],
        '😔',
        1000
      );
      toast.error(error.message || 'Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalAction = (action) => {
    if (action === 'View my job posting' || action === 'View My Job Posting' || action === 'Manage Applications') {
      if (createdJobId) {
        navigate(`/employer/posted-jobs/${createdJobId}`);
      } else {
        navigate('/employer/posted-jobs');
      }
    } else if (action === 'Post another job' || action === 'Post Another Job') {
      // Reset and start over
      setCurrentStep(0);
      setJobData({});
      setMessages([]);
      setIsCompleted(false);
      setCreatedJobId(null);
      setIsJobCreated(false);
      setTimeout(() => {
        addBotMessage(
          "🚀 Ready to post another job? Let's create another amazing opportunity!",
          jobQuestions[0].suggestions,
          '💼'
        );
      }, 1000);
    } else if (action === 'Go to dashboard' || action === 'Go to Dashboard') {
      navigate('/employer/dashboard');
    } else if (action === 'Try Again') {
      addBotMessage(
        "🔄 Let me try posting your job again with the correct format...",
        null,
        '⚡',
        500
      );
      setTimeout(() => {
        submitJobPosting();
      }, 1000);
    } else if (action === 'Edit Job Details') {
      // Go back to review job details
      addBotMessage(
        "📝 Let's review your job details. Which field would you like to edit?",
        ['Job Title', 'Description', 'Salary', 'Location', 'Requirements', 'Start Over'],
        '🔧',
        500
      );
    } else if (action === 'Contact Support') {
      addBotMessage(
        "📞 You can reach our support team at:\n\n📧 Email: support@sindh.com\n📱 Phone: +91-XXXX-XXXXXX\n\nWe're here to help! 😊",
        ['Try Again', 'Go to Dashboard'],
        '🤝',
        500
      );
    }
  };

  const currentQuestion = jobQuestions[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-3"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Briefcase className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SINDH Job Assistant</h1>
              <p className="text-sm text-gray-500">Creating your perfect job posting...</p>
            </div>
          </div>
          
          {/* Help tip */}
          <AnimatePresence>
            {showHelpTip && currentQuestion?.helpText && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm max-w-xs"
              >
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{currentQuestion.helpText}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        <div className="bg-white rounded-2xl shadow-xl h-full flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-sm shadow-lg'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-bl-sm shadow-md border'
                  }`}>
                    {message.icon && message.sender === 'bot' && (
                      <div className="text-2xl mb-2">{message.icon}</div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    <p className="text-xs opacity-70 mt-2">
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
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md border">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-green-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-indigo-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">Assistant is typing...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Interactive Suggestions */}
            {showSuggestions && currentSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>💡</span>
                  <span>Quick options (click to select):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (isCompleted) {
                          handleFinalAction(suggestion);
                        } else {
                          handleSuggestionClick(suggestion);
                        }
                      }}
                      className={`p-3 text-left rounded-xl transition-all duration-200 border ${
                        suggestion.includes('Let me') || suggestion.includes('custom')
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100'
                          : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200 text-green-700 hover:from-green-100 hover:to-blue-100'
                      }`}
                    >
                      <div className="text-sm font-medium">{suggestion}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isCompleted && (
            <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-blue-50">
              <form onSubmit={handleInputSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={isWaitingForInput ? "Type your response or choose from options above..." : "Please wait..."}
                  disabled={!isWaitingForInput || isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
                <motion.button
                  type="submit"
                  disabled={!currentInput.trim() || !isWaitingForInput || isSubmitting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Progress Indicator */}
      {!isCompleted && (
        <div className="bg-white border-t p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <div className="flex items-center space-x-2">
                <span>Progress</span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  ⚡
                </motion.div>
              </div>
              <span className="font-semibold">
                {Math.round((currentStep / (jobQuestions.length - 1)) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500 h-3 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / (jobQuestions.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Just started</span>
              <span>Almost done!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobChatPosting;
