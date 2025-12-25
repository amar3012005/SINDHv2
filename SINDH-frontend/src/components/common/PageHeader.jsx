import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Menu } from 'lucide-react';
import { useUser } from '../../context/UserContext';

/**
 * PageHeader Component
 * 
 * Reusable page header with back button, language toggle, and menu dropdown.
 * Provides consistent navigation across all pages.
 */
const PageHeader = ({
  onBack = null,
  showBackButton = true,
  showLanguageToggle = true,
  showMenu = true,
  menuItems = null,
  theme = 'light',
  className = ''
}) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const [isHindi, setIsHindi] = useState(localStorage.getItem('language') === 'hi');
  const [showPageMenu, setShowPageMenu] = useState(false);

  // Sync language state with i18n
  useEffect(() => {
    setIsHindi(i18n.language === 'hi');
  }, [i18n.language]);

  // Toggle language between English and Hindi
  const toggleLang = () => {
    const newLang = isHindi ? 'en' : 'hi';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    setIsHindi(!isHindi);
  };

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Toggle menu dropdown
  const toggleMenu = () => {
    setShowPageMenu(!showPageMenu);
  };

  // Default menu items based on user type
  const defaultMenuItems = [
    { 
      label: 'Profile', 
      path: `/${user?.type}/profile`, 
      icon: '👤',
      show: true
    },
    { 
      label: 'My Applications', 
      path: '/worker/applications', 
      icon: '📋',
      show: user?.type === 'worker'
    },
    { 
      label: 'Posted Jobs', 
      path: '/employer/posted-jobs', 
      icon: '💼',
      show: user?.type === 'employer'
    },
    { 
      label: 'Home', 
      path: '/', 
      icon: '🏠',
      show: true
    }
  ].filter(item => item.show);

  const items = menuItems || defaultMenuItems;

  // Theme-specific styles
  const buttonStyles = theme === 'light' 
    ? 'bg-white border-[#3B4883]/20 text-[#202124] hover:border-[#FF7124] hover:bg-[#FF7124]/10 shadow-sm'
    : 'bg-white/10 border-white/15 text-white hover:bg-white/15';

  const menuStyles = theme === 'light'
    ? 'bg-white border-[#3B4883]/10 text-[#202124] shadow-xl'
    : 'bg-white/10 border-white/15 text-white backdrop-blur-md';

  const menuItemHoverStyles = theme === 'light'
    ? 'hover:bg-[#FF7124]/10 hover:text-[#FF7124]'
    : 'hover:bg-white/10';

  return (
    <>
      <div 
        className={`absolute top-0 left-0 right-0 z-30 flex justify-between items-center px-4 md:px-6 ${className}`}
        style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
      >
        {/* Left Section - Back Button */}
        {showBackButton && (
          <button
            onClick={handleBack}
            className={`p-3 rounded-xl border transition-all duration-200 ${buttonStyles}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Section - Language Toggle + Menu */}
        <div className="flex gap-2">
          {showLanguageToggle && (
            <button
              onClick={toggleLang}
              className={`px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 ${buttonStyles}`}
            >
              {isHindi ? 'EN' : 'HI'}
            </button>
          )}

          {showMenu && (
            <button
              onClick={toggleMenu}
              className={`p-3 rounded-xl border transition-all duration-200 ${buttonStyles}`}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {showPageMenu && (
          <>
            {/* Backdrop to close menu */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-35"
              onClick={() => setShowPageMenu(false)}
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`absolute right-4 md:right-6 w-56 rounded-xl p-3 text-sm z-40 border ${menuStyles}`}
              style={{ top: 'calc(72px + env(safe-area-inset-top, 0px))' }}
            >
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    setShowPageMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 ${menuItemHoverStyles}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PageHeader;
