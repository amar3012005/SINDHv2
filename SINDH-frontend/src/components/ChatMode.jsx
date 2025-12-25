import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getCurrentUser } from '../utils/authUtils';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  MessageCircle,
  LogIn,
  User as UserIcon,
  Briefcase,
  FileText,
  ArrowRight,
  Shield,
  Heart,
  X,
  Home,
  Menu,
  ArrowDown
} from 'lucide-react';

// Enhanced Animated Pattern Components for Chat Interface
const FloatingGeometry = ({ delay = 0 }) => {
  const shapes = ['hexagon', 'diamond', 'star', 'cross', 'ring'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 12 + 6;
  const duration = Math.random() * 12 + 15;
  
  const initialX = Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000);
  const initialY = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000);
  
  return (
    <motion.div
      className="absolute pointer-events-none opacity-5"
      style={{
        width: size,
        height: size,
        left: initialX,
        top: initialY,
      }}
      animate={{
        x: [0, Math.random() * 80 - 40, Math.random() * 80 - 40, 0],
        y: [0, Math.random() * 80 - 40, Math.random() * 80 - 40, 0],
        rotate: [0, 360],
        scale: [1, 1.3, 0.7, 1]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
    >
      {shape === 'hexagon' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,5 85,25 85,75 50,95 15,75 15,25" fill="black" />
        </svg>
      )}
      {shape === 'diamond' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,10 90,50 50,90 10,50" fill="black" />
        </svg>
      )}
      {shape === 'star' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,5 60,35 90,35 70,55 80,85 50,70 20,85 30,55 10,35 40,35" fill="black" />
        </svg>
      )}
      {shape === 'cross' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="40,10 60,10 60,40 90,40 90,60 60,60 60,90 40,90 40,60 10,60 10,40 40,40" fill="black" />
        </svg>
      )}
      {shape === 'ring' && (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="black" strokeWidth="8" />
        </svg>
      )}
    </motion.div>
  );
};

const AnimatedGrid = ({ opacity = 0.03 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {/* Hexagonal Grid Pattern */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, black 1px, transparent 1px),
            linear-gradient(30deg, transparent 24px, black 25px, black 26px, transparent 27px),
            linear-gradient(-30deg, transparent 24px, black 25px, black 26px, transparent 27px)
          `,
          backgroundSize: '50px 43px, 50px 43px, 50px 43px'
        }}
        animate={{
          x: [0, 25, 50, 25, 0],
          y: [0, 21.5, 43, 21.5, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Diagonal Lines */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 48%, black 49%, black 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, black 49%, black 51%, transparent 52%)
          `,
          backgroundSize: '60px 60px'
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -60, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

const ParticleField = ({ count = 20 }) => {
  const particles = Array.from({ length: count }, (_, i) => {
    const particleTypes = ['dot', 'square', 'plus', 'line'];
    const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
    const size = Math.random() * 3 + 1;
    
    return (
      <motion.div
        key={i}
        className="absolute opacity-20"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: size,
          height: size
        }}
        animate={{
          x: [0, Math.random() * 30 - 15, 0],
          y: [0, Math.random() * 30 - 15, 0],
          opacity: [0.1, 0.4, 0.1],
          scale: [0.8, 1.5, 0.8],
          rotate: [0, 360]
        }}
        transition={{
          duration: Math.random() * 6 + 4,
          repeat: Infinity,
          delay: Math.random() * 3,
          ease: "easeInOut"
        }}
      >
        {type === 'dot' && <div className="w-full h-full bg-black rounded-full" />}
        {type === 'square' && <div className="w-full h-full bg-black" />}
        {type === 'plus' && (
          <svg viewBox="0 0 10 10" className="w-full h-full">
            <path d="M4,0 L6,0 L6,4 L10,4 L10,6 L6,6 L6,10 L4,10 L4,6 L0,6 L0,4 L4,4 Z" fill="black" />
          </svg>
        )}
        {type === 'line' && <div className="w-full h-px bg-black transform rotate-45" />}
      </motion.div>
    );
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles}
    </div>
  );
};

const NetworkLines = () => {
  const nodes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 20 + (i % 3) * 30 + Math.random() * 10,
    y: 20 + Math.floor(i / 3) * 25 + Math.random() * 10,
    type: ['circle', 'square', 'diamond'][Math.floor(Math.random() * 3)]
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Animated connecting lines with waves */}
        {nodes.map((node, i) => 
          nodes.slice(i + 1).filter((_, j) => (i + j) % 2 === 0).map((nextNode, j) => (
            <motion.path
              key={`${i}-${j}`}
              d={`M${node.x},${node.y} Q${(node.x + nextNode.x) / 2 + Math.sin(i + j) * 5},${(node.y + nextNode.y) / 2 + Math.cos(i + j) * 5} ${nextNode.x},${nextNode.y}`}
              stroke="black"
              strokeWidth="0.15"
              fill="none"
              animate={{
                opacity: [0.1, 0.4, 0.1],
                strokeDasharray: ["0 10", "5 5", "0 10"]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: (i + j) * 0.4,
                ease: "easeInOut"
              }}
            />
          ))
        )}
        
        {/* Animated nodes */}
        {nodes.map((node, i) => (
          <g key={node.id}>
            {node.type === 'circle' && (
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="0.4"
                fill="black"
                animate={{
                  r: [0.3, 0.6, 0.3],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeInOut"
                }}
              />
            )}
            {node.type === 'square' && (
              <motion.rect
                x={node.x - 0.3}
                y={node.y - 0.3}
                width="0.6"
                height="0.6"
                fill="black"
                animate={{
                  width: ["0.4", "0.8", "0.4"],
                  height: ["0.4", "0.8", "0.4"],
                  x: [node.x - 0.2, node.x - 0.4, node.x - 0.2],
                  y: [node.y - 0.2, node.y - 0.4, node.y - 0.2],
                  opacity: [0.3, 0.7, 0.3],
                  rotate: [0, 45, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: i * 0.7,
                  ease: "easeInOut"
                }}
              />
            )}
            {node.type === 'diamond' && (
              <motion.polygon
                points={`${node.x},${node.y-0.4} ${node.x+0.3},${node.y} ${node.x},${node.y+0.4} ${node.x-0.3},${node.y}`}
                fill="black"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [0.8, 1.3, 0.8]
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: `${node.x}% ${node.y}%` }}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

const GeometricOverlay = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Spiral Geometry */}
      <motion.div
        className="absolute top-16 right-16 w-16 h-16 opacity-5"
        animate={{
          rotate: [0, 360],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path 
            d="M50,50 m0,-40 a40,40 0 1,1 0,80 a30,30 0 1,1 0,-60 a20,20 0 1,1 0,40 a10,10 0 1,1 0,-20"
            fill="none" 
            stroke="black" 
            strokeWidth="2"
          />
        </svg>
      </motion.div>

      {/* Rotating Mandala */}
      <motion.div
        className="absolute top-1/3 left-12 w-14 h-14 opacity-5"
        animate={{
          rotate: [0, -360],
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <g transform="translate(50,50)">
            {Array.from({ length: 8 }, (_, i) => (
              <g key={i} transform={`rotate(${i * 45})`}>
                <ellipse cx="0" cy="-20" rx="3" ry="15" fill="black" />
                <circle cx="0" cy="-30" r="2" fill="black" />
              </g>
            ))}
          </g>
        </svg>
      </motion.div>

      {/* Morphing Polygon */}
      <motion.div
        className="absolute bottom-1/3 right-20 w-12 h-12 opacity-5"
        animate={{
          rotate: [0, 120, 240, 360],
          scale: [1, 1.3, 0.7, 1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.polygon
            points="50,10 85,25 85,75 50,90 15,75 15,25"
            fill="black"
            animate={{
              points: [
                "50,10 85,25 85,75 50,90 15,75 15,25",
                "50,5 90,30 80,85 20,85 10,30",
                "50,15 80,20 90,70 50,95 10,70 20,20",
                "50,10 85,25 85,75 50,90 15,75 15,25"
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </motion.div>

      {/* Concentric Squares */}
      <motion.div
        className="absolute bottom-16 left-16 w-10 h-10 opacity-5"
        animate={{
          rotate: [0, 45, 90, 135, 180],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" strokeWidth="2" />
          <rect x="25" y="25" width="50" height="50" fill="none" stroke="black" strokeWidth="1.5" />
          <rect x="40" y="40" width="20" height="20" fill="black" />
        </svg>
      </motion.div>

      {/* Wave Pattern */}
      <motion.div
        className="absolute top-1/2 right-8 w-20 h-8 opacity-5"
        animate={{
          x: [0, 10, 0],
          scaleY: [1, 1.5, 1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg viewBox="0 0 100 40" className="w-full h-full">
          <path 
            d="M0,20 Q25,5 50,20 T100,20"
            fill="none" 
            stroke="black" 
            strokeWidth="1"
          />
          <path 
            d="M0,20 Q25,35 50,20 T100,20"
            fill="none" 
            stroke="black" 
            strokeWidth="1"
          />
        </svg>
      </motion.div>
    </div>
  );
};

const ChatMode = () => {
  const navigate = useNavigate();
  const { user: contextUser, isLoadingUser } = useUser();
  const user = contextUser || getCurrentUser();
  const isAuthenticated = !!user && !isLoadingUser;
  
  // State management
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showWelcome, setShowWelcome] = useState(true);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-resize input box height for better UX
  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 140; // px
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  // Session storage keys
  const CHAT_MESSAGES_KEY = `chat_messages_${user?.id || 'guest'}`;
  const CHAT_INITIALIZED_KEY = `chat_initialized_${user?.id || 'guest'}`;

  // Load existing chat session on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_MESSAGES_KEY);
      const savedInitialized = localStorage.getItem(CHAT_INITIALIZED_KEY);
      
      if (savedMessages && savedInitialized) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          setHasInitialized(true);
          setShowWelcome(false);
          
          // Add a simple "Welcome back" message if returning to existing session
          const lastMessage = parsedMessages[parsedMessages.length - 1];
          const timeSinceLastMessage = Date.now() - new Date(lastMessage?.timestamp).getTime();
          
          // If last message was more than 5 minutes ago, add welcome back message
          if (timeSinceLastMessage > 5 * 60 * 1000) {
            setTimeout(() => {
              const welcomeBackMessage = {
                id: `welcome-back-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'bot',
                content: `Welcome back! 👋 How can I continue helping you today?`,
                timestamp: new Date(),
                avatar: '🤖'
              };
              setMessages(prev => [...prev, welcomeBackMessage]);
            }, 1000);
          }
        } else {
          // Clear invalid session data
          localStorage.removeItem(CHAT_MESSAGES_KEY);
          localStorage.removeItem(CHAT_INITIALIZED_KEY);
          setHasInitialized(false);
        }
      } else {
        // No saved session, ensure we start fresh
        setHasInitialized(false);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      // Clear corrupted session data
      localStorage.removeItem(CHAT_MESSAGES_KEY);
      localStorage.removeItem(CHAT_INITIALIZED_KEY);
      setHasInitialized(false);
    }
  }, [user?.id]);

  // Save messages to session storage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && hasInitialized) {
      try {
        localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
        localStorage.setItem(CHAT_INITIALIZED_KEY, 'true');
      } catch (error) {
        console.error('Error saving chat session:', error);
      }
    }
  }, [messages, hasInitialized, CHAT_MESSAGES_KEY, CHAT_INITIALIZED_KEY]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Also keep view pinned when typing indicator toggles
  useEffect(() => {
    if (showTypingIndicator) scrollToBottom();
  }, [showTypingIndicator]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mobile: show a floating scroll-to-bottom button when far from bottom
  const [showScrollFab, setShowScrollFab] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 120; // px from bottom
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollFab(distanceFromBottom > threshold);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Initialize messages with natural conversation flow - simplified version
  const getInitialMessageParts = () => {
    try {
      if (!isAuthenticated) {
        return [
          {
            id: `bot-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'bot',
            content: `Hi there! 👋 I'm your AI assistant. I can help you find work opportunities, post jobs, and navigate our platform. To get started, you'll need to log in first. Ready to begin?`,
            timestamp: new Date(),
            avatar: '🤖',
            options: ['login']
          }
        ];
      } else {
        const userName = user?.name || user?.company?.name || 'there';
        const userType = user?.type || 'user';
        
        return [
          {
            id: `bot-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'bot',
            content: `Hey ${userName}! 👋 Great to see you again. I'm here to help you ${userType === 'employer' ? 'manage your job postings and find great workers' : 'find work opportunities and track your applications'}. What would you like to do today?`,
            timestamp: new Date(),
            avatar: '🤖',
            options: userType === 'employer' ? ['post_job', 'view_posted_jobs', 'profile'] : ['find_work', 'my_applications', 'profile']
          }
        ];
      }
    } catch (error) {
      console.error('Error generating initial messages:', error);
      return [
        {
          id: `bot-fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'bot',
          content: `Hello! I'm your AI assistant. How can I help you today?`,
          timestamp: new Date(),
          avatar: '🤖'
        }
      ];
    }
  };

  // Initialize chat on component mount (only if not already initialized)
  useEffect(() => {
    console.log('Chat initialization check:', { hasInitialized, messagesLength: messages.length });
    
    // Only initialize if this is a new session and we don't have messages
    if (!hasInitialized && messages.length === 0) {
      console.log('Starting new chat session initialization');
      
      // Hide welcome screen
      setTimeout(() => setShowWelcome(false), 3000);
      
      // Start posting messages with intervals
      const initialParts = getInitialMessageParts();
      console.log('Generated initial message parts:', initialParts.length);
      
      // Show typing indicator
      setShowTypingIndicator(true);
      
      // Add initial message after typing time
      setTimeout(() => {
        if (initialParts.length > 0) {
          console.log('Adding initial message');
          setMessages(initialParts);
        }
        setShowTypingIndicator(false);
        setHasInitialized(true);
      }, 2000);
    }
  }, [isAuthenticated, user, hasInitialized, messages.length]);

  // Failsafe: Ensure chat is always initialized after a timeout
  useEffect(() => {
    const failsafeTimeout = setTimeout(() => {
      if (!hasInitialized && !initializationAttempted && messages.length === 0) {
        console.log('Failsafe: Force initializing chat');
        setInitializationAttempted(true);
        const initialParts = getInitialMessageParts();
        if (initialParts.length > 0) {
          setMessages(initialParts);
          setHasInitialized(true);
          setShowWelcome(false);
        }
      }
    }, 5000); // 5 second failsafe

    return () => clearTimeout(failsafeTimeout);
  }, [hasInitialized, initializationAttempted, messages.length]);

  // Handle sending new messages with human-like response breakdown
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      avatar: '👤'
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Show thinking indicator
    setShowTypingIndicator(true);

    // Generate response after realistic thinking time
    setTimeout(() => {
      setShowTypingIndicator(false);
      
      const response = generateResponse(userInput);
      
      // Break down long responses into smaller pieces
      const responseParts = [];
      if (response.text.length > 100) {
        // Split by sentences or logical breaks
        const sentences = response.text.split(/[.!?]\s+/);
        let currentPart = '';
        
        sentences.forEach((sentence, index) => {
          if (currentPart.length + sentence.length > 80 && currentPart.length > 0) {
            responseParts.push(currentPart.trim() + (currentPart.includes('.') ? '' : '.'));
            currentPart = sentence;
          } else {
            currentPart += (currentPart ? ' ' : '') + sentence;
          }
          
          if (index === sentences.length - 1 && currentPart) {
            responseParts.push(currentPart.trim());
          }
        });
      } else {
        responseParts.push(response.text);
      }
      
      // Add response parts with typing intervals
      let partIndex = 0;
      const addResponsePart = () => {
        if (partIndex < responseParts.length) {
          setShowTypingIndicator(true);
          
          const typingTime = Math.max(600, responseParts[partIndex].length * 40);
          
          setTimeout(() => {
            const botResponse = {
              id: `bot-${Date.now()}-${partIndex}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'bot',
              content: responseParts[partIndex],
              options: partIndex === responseParts.length - 1 ? response.options : undefined,
              timestamp: new Date(),
              avatar: '🤖'
            };
            
            setMessages(prev => [...prev, botResponse]);
            setShowTypingIndicator(false);
            partIndex++;
            
            if (partIndex < responseParts.length) {
              setTimeout(addResponsePart, 1000 + Math.random() * 500); // Random human-like pause
            } else {
              setIsLoading(false);
            }
          }, typingTime);
        }
      };
      
      addResponsePart();
    }, 1500 + Math.random() * 1000); // Random thinking time
  };

  // Generate contextual responses
  const generateResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('login') || input.includes('log in')) {
      return {
        text: !isAuthenticated 
          ? "Perfect! Let's get you logged in so you can access all the features. Ready to get started?"
          : "You're already logged in! 😊 How else can I help you today?",
        options: !isAuthenticated ? ['login'] : []
      };
    }
    
    if (input.includes('profile')) {
      return {
        text: isAuthenticated
          ? "Great! Let's take a look at your profile. I'll take you there now!"
          : "You'll need to log in first to access your profile. Let me help you with that!",
        options: isAuthenticated ? ['profile'] : ['login']
      };
    }
    
    if (input.includes('job') && user?.type === 'employer') {
      return {
        text: "Excellent! Let's create a new job posting. I'll open the job posting form for you!",
        options: ['post_job']
      };
    }
    
    if (input.includes('work') && user?.type === 'worker') {
      return {
        text: "Great! Let's find you some work opportunities. I'll show you the available jobs!",
        options: ['find_work']
      };
    }
    
    return {
      text: "I understand what you're looking for. How else can I assist you?",
      options: []
    };
  };

  // Generate responses for option clicks - simplified without circular options
  const generateResponseForOption = (option) => {
    const responses = {
      login: {
        text: "Perfect! Let's get you logged in so you can access all the features. Once you're in, you'll be able to post jobs, find work opportunities, manage your profile, and track applications. Ready to get started?",
        options: [] // No circular options
      },
      profile: {
        text: "Great! Let's take a look at your profile. You can view your current information, update your details, and manage your account settings. I'll take you there now!",
        options: [] // No circular options
      },
      post_job: {
        text: "Excellent! Let's create a new job posting. You'll be able to set the job title and description, specify location and salary, choose the job category, and set application requirements. I'll open the job posting form for you!",
        options: [] // No circular options
      },
      view_posted_jobs: {
        text: "Perfect! Let's check out your posted jobs. You'll be able to see all your current listings, manage applications, update job details, and track performance. I'll take you to your job dashboard!",
        options: [] // No circular options
      },
      find_work: {
        text: "Great! Let's find you some work opportunities. You'll be able to browse available jobs in your area, filter by category and location, apply with one click, and track your applications. I'll show you the available jobs!",
        options: [] // No circular options
      },
      my_applications: {
        text: "Let's check on your applications! You'll be able to see all your applied jobs, track application status, view employer responses, and manage your applications. I'll take you to your applications dashboard!",
        options: [] // No circular options
      }
    };

    return responses[option] || {
      text: "I understand what you're looking for. How else can I assist you?",
      options: []
    };
  };

  // Handle option clicks with natural flow and immediate navigation
  const handleOptionClick = async (option) => {
    const userMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: getOptionLabel(option),
      timestamp: new Date(),
      avatar: '👤'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Show typing indicator
    setShowTypingIndicator(true);

    // Generate response after realistic thinking time
    setTimeout(() => {
      setShowTypingIndicator(false);
      
      const response = generateResponseForOption(option);
      
      // Add single response message
      const botResponse = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'bot',
        content: response.text,
        timestamp: new Date(),
        avatar: '🤖'
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
      
      // Navigate immediately after response
      setTimeout(() => {
        handleNavigation(option);
      }, 1500);
    }, 1200 + Math.random() * 800);
  };

  // Navigation handlers
  const handleNavigation = (option) => {
    switch (option) {
      case 'login':
        navigate('/login');
        break;
      case 'profile':
        if (user?.type === 'employer') {
          navigate('/employer/profile');
        } else if (user?.type === 'worker') {
          navigate('/worker/profile');
        }
        break;
      case 'post_job':
        if (user?.type === 'employer') {
          navigate('/employer/post-job');
        }
        break;
      case 'view_posted_jobs':
        if (user?.type === 'employer') {
          navigate('/employer/posted-jobs');
        }
        break;
      case 'find_work':
        if (user?.type === 'worker') {
          navigate('/jobs');
        }
        break;
      case 'my_applications':
        if (user?.type === 'worker') {
          navigate('/worker/applications');
        }
        break;
      default:
        break;
    }
  };

  // Get human-readable labels for options
  const getOptionLabel = (option) => {
    const labels = {
      'login': '💼 Login',
      'profile': '👤 Profile',
      'post_job': '📝 Post Job',
      'view_posted_jobs': '📋 Posted Jobs',
      'find_work': '🔍 Find Work',
      'my_applications': '📄 My Applications'
    };
    return labels[option] || option;
  };

  // Handle keyboard input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy message functionality


  // Clear chat history function (can be called from settings or menu)
  const clearChatHistory = () => {
    try {
      localStorage.removeItem(CHAT_MESSAGES_KEY);
      localStorage.removeItem(CHAT_INITIALIZED_KEY);
      setMessages([]);
      setHasInitialized(false);
      setShowWelcome(true);
      setInitializationAttempted(false);
      
      // Restart the initialization process after a delay
      setTimeout(() => {
        setShowWelcome(false);
        setShowTypingIndicator(true);
        
        setTimeout(() => {
          const initialParts = getInitialMessageParts();
          if (initialParts.length > 0) {
            setMessages(initialParts);
            setHasInitialized(true);
            setShowTypingIndicator(false);
          }
        }, 2000);
      }, 1000);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  // Message bubble component
  const MessageBubble = ({ message }) => {
    if (!message || typeof message !== 'object') return null;
    if (!message.type || !message.content) return null;
    
    // Format timestamp like WhatsApp
    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}
      >
        <div className={`flex max-w-[80%] sm:max-w-[70%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 sm:gap-3`}>
          {/* Avatar */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base shadow-sm ${
              message.type === 'user'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white border border-white/15'
            }`}
          >
            {message.type === 'user' ? (message.avatar || '👤') : '🤖'}
          </motion.div>
          
          <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
            {/* Message Bubble - Dark Theme */}
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`inline-block p-3 sm:p-4 shadow-sm relative ${
                message.type === 'user'
                  ? 'bg-white text-black rounded-2xl rounded-br-md'
                  : message.isThinking
                  ? 'bg-white/5 text-white border border-white/10 rounded-2xl rounded-bl-md'
                  : 'bg-white/5 text-white border border-white/10 rounded-2xl rounded-bl-md'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                {message.isThinking ? (
                  <div className="flex items-center gap-2">
                    <span>🤔</span>
                    <span className="font-light tracking-wide">Thinking...</span>
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="flex space-x-1"
                    >
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    </motion.div>
                  </div>
                ) : (
                  <span className="font-normal leading-relaxed">{message.content}</span>
                )}
              </div>
              
              {/* Timestamp */}
              <div className={`mt-1 text-xs opacity-70 ${message.type === 'user' ? 'text-right text-black/50' : 'text-right text-white/60'}`}>
                {formatTimestamp(message.timestamp)}
              </div>
            </motion.div>
            
            {/* Options for bot messages */}
            {message.type === 'bot' && message.options && message.options.length > 0 && !message.isThinking && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 sm:mt-4 space-y-2 sm:space-y-3"
              >
                <div className="text-xs text-white/70 font-light flex items-center gap-1 sm:gap-2 tracking-wide">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/70" />
                  <span className="text-xs sm:text-xs uppercase tracking-widest">Quick Actions</span>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {message.options.map((option, index) => (
                    <motion.button
                      key={`${option}-${index}`}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: '0 4px 15px rgba(255, 255, 255, 0.08)'
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionClick(option)}
                      className="px-3 py-2 sm:px-4 sm:py-3 bg-white text-black text-xs sm:text-sm hover:opacity-95 transition-all duration-300 font-medium shadow-sm border-0 flex items-center gap-1 sm:gap-2 tracking-wide rounded-full"
                    >
                      <span>{getOptionLabel(option)}</span>
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-300 relative overflow-hidden devanagari">
      {/* Dark background layers (match Homepage) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 600px at 50% -10%, rgba(120,120,255,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(255,120,180,0.05), transparent 70%), radial-gradient(900px 500px at -10% 10%, rgba(120,255,200,0.05), transparent 70%)',
          }}
        />
        <div className="startrails absolute inset-0"></div>
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

      {/* Top-right controls (Home + Menu) */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-30">
        <button
          onClick={() => navigate('/home')}
          className="p-2 md:p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
          title="Home"
        >
          <Home className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </button>
        <button
          onClick={() => setShowMenu(v => !v)}
          className="p-2 md:p-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition-colors"
          title="Menu"
        >
          <Menu className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </button>
      </div>
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 md:right-6 w-56 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 text-sm text-white z-40"
          >
            {hasInitialized && (
              <button onClick={clearChatHistory} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10">Clear Chat</button>
            )}
            {!hasInitialized && messages.length === 0 && (
              <button
                onClick={() => {
                  const initialParts = getInitialMessageParts();
                  setMessages(initialParts);
                  setHasInitialized(true);
                  setShowWelcome(false);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10"
              >
                Start Chat
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome overlay (kept minimal to fit dark theme) */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 flex items-center justify-center"
          >
            <div className="text-center text-white">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl mb-6"
              >
                🤖
              </motion.div>
              <h1 className="text-3xl font-extrabold tracking-tight">SINDH • AI CHAT</h1>
              <div className="w-16 h-px bg-white/60 mx-auto my-4" />
              <p className="text-sm text-white/70">Digital Rozgar Manch</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Interface */}
      <div className="flex h-screen relative z-10">
        <div className="flex-1 flex flex-col relative max-w-3xl md:max-w-4xl mx-auto w-full">
          {/* Built-in header removed; controls are in top-right */}

          {/* Messages */}
          <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain scroll-smooth p-3 sm:p-4 md:p-6 pt-14 sm:pt-16 space-y-3 sm:space-y-4">
            <AnimatePresence>
              {messages && messages.length > 0 && messages.map((message, index) => {
                if (!message) return null;
                return <MessageBubble key={message?.id || `msg-${index}`} message={message} />;
              })}
            </AnimatePresence>

            {showTypingIndicator && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                  <motion.div aria-hidden className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white/10 border border-white/15 text-white flex items-center justify-center shadow-sm text-xs sm:text-sm md:text-base rounded-full">
                    🤖
                  </motion.div>
                  <div className="bg-white/5 px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 shadow-sm border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-white rounded-full" />
                      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-white rounded-full" />
                      <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!isAuthenticated && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-3 sm:p-4 md:p-6 bg-white/5 border-t border-white/10 relative overflow-hidden"
            >
              <div className="text-center relative z-10">
                <div className="text-xs sm:text-sm font-light text-white/80 mb-3 sm:mb-4 flex items-center justify-center gap-1 sm:gap-2 tracking-wide">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  <span className="uppercase tracking-widest">Get Full Access</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 sm:gap-3 mx-auto px-4 py-3 sm:px-6 sm:py-4 md:px-8 bg-white text-black font-medium hover:opacity-95 transition-all duration-300 shadow-sm text-sm sm:text-base tracking-wide rounded-xl"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>LOGIN TO CONTINUE</span>
                </motion.button>
                <p className="text-xs text-white/70 mt-2 sm:mt-3 px-2 font-light tracking-wide">Login to access job posting, applications, and more features</p>
              </div>
            </motion.div>
          )}

          {/* Input Area - dark glass, pinned to bottom */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-neutral-900/70 backdrop-blur-md border-t border-white/10 relative overflow-hidden pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-end gap-2 sm:gap-3 md:gap-4 relative z-10">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); resizeInput(); }}
                  onKeyPress={handleKeyPress}
                  placeholder={isAuthenticated ? 'Type your message...' : 'Ask me anything or login to continue...'}
                  className="w-full p-3 pr-12 sm:p-4 sm:pr-14 md:pr-16 bg-neutral-800/60 border border-white/10 text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-300 shadow-sm text-sm sm:text-base font-light rounded-xl"
                  rows="1"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`absolute right-2 bottom-2 sm:right-3 sm:bottom-3 p-2 sm:p-2.5 md:p-3 rounded-lg transition-all duration-300 ${
                    inputValue.trim() && !isLoading
                      ? 'bg-white text-black hover:opacity-95 shadow-sm'
                      : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                  }`}
                >
                  <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                </motion.button>
              </div>
              {/* Quick action micro-buttons on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/home')} className="p-2 rounded-lg bg-white/10 border border-white/10 text-white sm:hidden">
                  <Home className="w-4 h-4" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowMenu(v=>!v)} className="p-2 rounded-lg bg-white/10 border border-white/10 text-white sm:hidden">
                  <Menu className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="mt-2 sm:mt-3 text-xs text-white/60 text-center flex items-center justify-center gap-1 sm:gap-2 font-light tracking-wide">
              <div className="w-1 h-1 bg-white/60 rounded-full" />
              <span className="text-xs sm:text-xs uppercase tracking-widest">AI Assistant • SINDH</span>
              <div className="w-1 h-1 bg-white/60 rounded-full" />
            </div>
            {/* Mobile FAB: scroll to bottom */}
            <AnimatePresence>
              {showScrollFab && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute -top-5 right-4 sm:right-6 p-2 rounded-full bg-white/90 text-black shadow-lg border border-white/60"
                  aria-label="Scroll to latest"
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Global styles to mirror Homepage theme */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap');
        .devanagari { font-family: 'Noto Sans Devanagari', 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
        .noise-bg { background-image: url('data:image/svg+xml;utf8,\
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">\
            <filter id="noise">\
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>\
              <feColorMatrix type="saturate" values="0"/>\
              <feComponentTransfer>\
                <feFuncA type="table" tableValues="0 0.2"/>\
              </feComponentTransfer>\
            </filter>\
            <rect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/>\
          </svg>'); }
        .aurora-blob { position: absolute; width: 60vmax; height: 60vmax; filter: blur(60px); opacity: 0.2; }
        .aurora-a { background: radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), transparent 60%); left: -20vmax; top: -10vmax; animation: drift 18s ease-in-out infinite; }
        .aurora-b { background: radial-gradient(circle at 70% 40%, rgba(236,72,153,0.5), transparent 60%); right: -25vmax; top: -5vmax; animation: drift 22s ease-in-out infinite reverse; }
        .aurora-c { background: radial-gradient(circle at 40% 70%, rgba(34,197,94,0.5), transparent 60%); left: 10vmax; bottom: -20vmax; animation: drift 26s ease-in-out infinite; }
        @keyframes drift { 0%,100%{ transform: translate3d(0,0,0) rotate(0deg);} 50%{ transform: translate3d(5vmax, -3vmax, 0) rotate(20deg);} }
        .startrails { position:absolute; inset:0; background: radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 60%); overflow:hidden; }
        .startrails::before, .startrails::after { content:""; position:absolute; inset:-20%; background-repeat:repeat; background-size: 300px 300px; mix-blend-mode: screen; opacity:.25; border-radius:50%; filter: blur(0.2px); }
        .startrails::before { background-image:
          radial-gradient(2px 120px at 50% 0%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1.5px 100px at 80% 10%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1.2px 90px at 20% 30%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1.8px 110px at 70% 60%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 60%);
          animation: trails-rotate 140s linear infinite; }
        .startrails::after { background-image:
          radial-gradient(1px 60px at 30% 10%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1px 70px at 60% 40%, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1px 50px at 10% 80%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%),
          radial-gradient(1px 65px at 90% 50%, rgba(255,255,255,.35) 0%, rgba(255,255,255,0) 60%);
          animation: trails-rotate-rev 200s linear infinite; opacity:.18; }
        @keyframes trails-rotate { from{ transform: rotate(0deg);} to{ transform: rotate(360deg);} }
        @keyframes trails-rotate-rev { from{ transform: rotate(360deg);} to{ transform: rotate(0deg);} }
      `}</style>
    </div>
  );
};

export default ChatMode; 