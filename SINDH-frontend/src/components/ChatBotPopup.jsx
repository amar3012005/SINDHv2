import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Bot } from 'lucide-react';
import LogoSVG from '../assets/logo.svg';

// Animated Pattern Components for ChatBot Popup
const PopupFloatingGeometry = ({ delay = 0 }) => {
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 4 + 2;
  const duration = Math.random() * 6 + 8;
  
  return (
    <motion.div
      className="absolute pointer-events-none opacity-10"
      style={{
        width: size,
        height: size,
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80 + 10}%`,
      }}
      animate={{
        x: [0, Math.random() * 20 - 10, Math.random() * 20 - 10, 0],
        y: [0, Math.random() * 20 - 10, Math.random() * 20 - 10, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.2, 0.8, 1]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
    >
      {shape === 'square' && <div className="w-full h-full bg-black" />}
      {shape === 'circle' && <div className="w-full h-full bg-black rounded-full" />}
      {shape === 'triangle' && (
        <div 
          className="w-0 h-0 border-l-[2px] border-r-[2px] border-b-[4px] border-l-transparent border-r-transparent border-b-black"
        />
      )}
    </motion.div>
  );
};

const PopupAnimatedGrid = ({ opacity = 0.05 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, black 0.3px, transparent 0.3px),
            linear-gradient(black 0.3px, transparent 0.3px)
          `,
          backgroundSize: '12px 12px'
        }}
        animate={{
          x: [0, 12, 0],
          y: [0, 12, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

const PopupParticleField = ({ count = 4 }) => {
  const particles = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-0.5 h-0.5 bg-black rounded-full opacity-20"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -5, 0],
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.2, 1]
      }}
      transition={{
        duration: Math.random() * 2 + 3,
        repeat: Infinity,
        delay: Math.random() * 2,
        ease: "easeInOut"
      }}
    />
  ));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles}
    </div>
  );
};

const ChatBotPopup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't show on chat mode page itself
  const isChatModePage = location.pathname === '/chat-mode';

  useEffect(() => {
    if (!isChatModePage) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isChatModePage]);

  const handleClick = () => {
    navigate('/chat-mode');
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  if (isChatModePage || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 100 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: 100 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-20 right-6 z-50"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Main Chat Bot Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative cursor-pointer"
        >
          {/* Glass-morphism Background */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-2xl">
            <PopupAnimatedGrid />
            <PopupParticleField />
            {Array.from({ length: 3 }, (_, i) => (
              <PopupFloatingGeometry key={i} delay={i * 0.3} />
            ))}
          </div>
          
          {/* Main Button */}
          <div className="relative w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-gray-200/30 shadow-lg hover:bg-white/20 transition-all duration-300">
            <motion.div
              animate={{
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-6 h-6 flex items-center justify-center"
            >
              <img 
                src={LogoSVG} 
                alt="INDUS AI" 
                className="w-full h-full object-contain opacity-80"
              />
            </motion.div>
            
            {/* Animated Ring */}
            <motion.div
              animate={{ 
                scale: isHovered ? 1.2 : 1,
                opacity: isHovered ? 0.3 : 0
              }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 border border-gray-400 rounded-full"
            />
            
            {/* Pulse Animation */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 border border-gray-400 rounded-full"
            />
          </div>

          {/* Close Button */}
          <motion.button
            onClick={handleClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-all duration-200 shadow-lg border border-gray-200/30"
          >
            <X className="w-2.5 h-2.5" />
          </motion.button>

          {/* Notification Badge */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gray-800/90 backdrop-blur-md text-white text-xs rounded-full flex items-center justify-center border border-gray-200/30"
          >
            <span className="text-[7px] font-light">AI</span>
          </motion.div>
        </motion.div>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-3 w-44 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 p-3 relative overflow-hidden"
            >
              {/* Tooltip background patterns */}
              <div className="absolute inset-0 opacity-3">
                <PopupAnimatedGrid />
                <PopupParticleField count={2} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <img 
                      src={LogoSVG} 
                      alt="INDUS AI" 
                      className="w-full h-full object-contain opacity-70"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-800 tracking-wide">
                    INDUS AI Assistant
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-light leading-relaxed">
                  Click to chat with our AI assistant for help with jobs, applications, and more!
                </div>
              </div>
              
              {/* Arrow */}
              <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-full right-0 mb-4 w-44 bg-black/90 backdrop-blur-md text-white rounded-xl shadow-xl p-3 border border-gray-200/20 relative overflow-hidden"
        >
          {/* Message background patterns */}
          <div className="absolute inset-0 opacity-5">
            <PopupAnimatedGrid />
            <PopupParticleField count={3} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
              <span className="text-xs font-medium tracking-wide">INDUS AI</span>
            </div>
            <div className="text-xs font-light leading-relaxed">
              Need help? I'm here to assist you! 🚀
            </div>
          </div>
          
          {/* Arrow */}
          <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatBotPopup; 