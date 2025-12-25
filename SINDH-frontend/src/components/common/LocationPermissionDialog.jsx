import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Navigation, CheckCircle } from 'lucide-react';

const LocationPermissionDialog = ({ 
  isOpen, 
  onAllow, 
  onDeny, 
  onClose, 
  language = 'en' 
}) => {
  // Bilingual text content
  const text = {
    en: {
      title: 'We need your location',
      benefits: [
        'Find nearby workers',
        'Show accurate distance',
        'Get local pricing'
      ],
      note: 'Your location is only used to match you with workers in your area',
      allowButton: 'Allow Location',
      denyButton: 'Enter Pincode Instead'
    },
    hi: {
      title: 'हमें आपका स्थान चाहिए',
      benefits: [
        'नज़दीकी मज़दूर ढूंढने के लिए',
        'सही दूरी दिखाने के लिए',
        'स्थानीय कीमत देने के लिए'
      ],
      note: 'आपका स्थान केवल आपके क्षेत्र में मज़दूरों से मिलान करने के लिए उपयोग किया जाता है',
      allowButton: 'Location Allow करें',
      denyButton: 'पिनकोड डालें'
    }
  };

  const content = text[language] || text.en;

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-dialog-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-gradient-to-br from-neutral-900 to-neutral-950 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-1"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <h2 
                id="location-dialog-title"
                className="text-2xl font-bold text-white text-center"
              >
                {content.title}
              </h2>
            </div>
            
            {/* Benefits List */}
            <div className="space-y-3 mb-6">
              {content.benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
            
            {/* Note */}
            <p className="text-xs text-gray-400 text-center mb-6 px-2">
              {content.note}
            </p>
            
            {/* Buttons */}
            <div className="space-y-3">
              {/* Primary Button - Allow */}
              <motion.button
                onClick={onAllow}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-base font-bold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200 shadow-lg shadow-orange-500/30"
              >
                <MapPin className="w-5 h-5" />
                {content.allowButton}
              </motion.button>
              
              {/* Secondary Button - Deny */}
              <motion.button
                onClick={onDeny}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 bg-transparent border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
              >
                {content.denyButton}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LocationPermissionDialog;
