import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, X, Bot } from 'lucide-react';
import LogoSVG from '../assets/logo.svg';

// Simplified Animated Pattern Components
const PopupFloatingGeometry = ({ delay = 0 }) => {
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 3 + 1;
  const duration = Math.random() * 4 + 6;
  
  return (
    <motion.div
      className="absolute pointer-events-none opacity-5"
      style={{
        width: size,
        height: size,
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80 + 10}%`,
      }}
      animate={{
        x: [0, Math.random() * 10 - 5, Math.random() * 10 - 5, 0],
        y: [0, Math.random() * 10 - 5, Math.random() * 10 - 5, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.1, 0.9, 1]
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
          className="w-0 h-0 border-l-[1px] border-r-[1px] border-b-[2px] border-l-transparent border-r-transparent border-b-black"
        />
      )}
    </motion.div>
  );
};

const PopupAnimatedGrid = ({ opacity = 0.03 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, black 0.2px, transparent 0.2px),
            linear-gradient(black 0.2px, transparent 0.2px)
          `,
          backgroundSize: '8px 8px'
        }}
        animate={{
          x: [0, 8, 0],
          y: [0, 8, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

const PopupParticleField = ({ count = 2 }) => {
  const particles = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-0.5 h-0.5 bg-black rounded-full opacity-15"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -3, 0],
        opacity: [0.1, 0.2, 0.1],
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration: Math.random() * 2 + 2,
        repeat: Infinity,
        delay: Math.random() * 1,
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
        className="fixed bottom-20 right-4 z-50"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Main Chat Bot Button - Entirely Clickable */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative cursor-pointer"
        >
          {/* Glass-morphism Background */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-xl">
            <PopupAnimatedGrid />
            <PopupParticleField />
            {Array.from({ length: 2 }, (_, i) => (
              <PopupFloatingGeometry key={i} delay={i * 0.3} />
            ))}
          </div>
          
          {/* Main Button - Smaller and Cleaner */}
          <div className="relative w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-gray-200/30 shadow-lg hover:bg-white/20 transition-all duration-300">
            <motion.div
              animate={{
                rotate: [0, 3, 0, -3, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-5 h-5 flex items-center justify-center"
            >
              <img 
                src={LogoSVG} 
                alt="INDUS AI" 
                className="w-full h-full object-contain opacity-80"
              />
            </motion.div>
            
            {/* Subtle Animated Ring */}
            <motion.div
              animate={{ 
                scale: isHovered ? 1.15 : 1,
                opacity: isHovered ? 0.2 : 0
              }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 border border-gray-400 rounded-full"
            />
            
            {/* Subtle Pulse Animation */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0, 0.2]
              }}
              transition={{ 
                duration: 4,
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
            className="absolute -top-1 -right-1 w-4 h-4 bg-black/80 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-all duration-200 shadow-lg border border-gray-200/30"
          >
            <X className="w-2 h-2" />
          </motion.button>

          {/* Smaller Notification Badge */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 3, 0, -3, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gray-800/90 backdrop-blur-md text-white text-xs rounded-full flex items-center justify-center border border-gray-200/30"
          >
            <span className="text-[6px] font-light">AI</span>
          </motion.div>
        </motion.div>

        {/* Cleaner Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-2 w-36 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 p-2.5 relative overflow-hidden"
            >
              {/* Tooltip background patterns */}
              <div className="absolute inset-0 opacity-3">
                <PopupAnimatedGrid />
                <PopupParticleField count={1} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <img 
                      src={LogoSVG} 
                      alt="INDUS AI" 
                      className="w-full h-full object-contain opacity-70"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-800 tracking-wide">
                    AI Assistant
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-light leading-relaxed">
                  Click to chat for help!
                </div>
              </div>
              
              {/* Arrow */}
              <div className="absolute top-full right-4 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-white/95"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cleaner Floating Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-full right-0 mb-3 w-32 bg-black/90 backdrop-blur-md text-white rounded-lg shadow-xl p-2.5 border border-gray-200/20 relative overflow-hidden"
        >
          {/* Message background patterns */}
          <div className="absolute inset-0 opacity-5">
            <PopupAnimatedGrid />
            <PopupParticleField count={2} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-1 h-1 bg-white rounded-full"
              />
              <span className="text-xs font-medium tracking-wide">INDUS AI</span>
            </div>
            <div className="text-xs font-light leading-relaxed">
              Need help? 🚀
            </div>
          </div>
          
          {/* Arrow */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-black/90"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatBotPopup; 