import React, { createContext, useState, useEffect } from 'react';

// Create and export the context
export const LanguageContext = createContext();

// Translations object
export const translations = {
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.jobs': 'Jobs',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.selectLanguage': 'Select Language',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout'
  },
  hi: {
    'nav.home': 'होम',
    'nav.about': 'हमारे बारे में',
    'nav.jobs': 'नौकरियां',
    'nav.login': 'लॉग इन',
    'nav.register': 'रजिस्टर',
    'nav.selectLanguage': 'भाषा चुनें',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.logout': 'लॉग आउट'
  },
  mr: {
    'nav.home': 'मुख्यपृष्ठ',
    'nav.about': 'आमच्याबद्दल',
    'nav.jobs': 'नोकरी',
    'nav.login': 'लॉगिन',
    'nav.register': 'नोंदणी',
    'nav.selectLanguage': 'भाषा निवडा',
    'nav.profile': 'प्रोफाइल',
    'nav.logout': 'लॉगआउट'
  },
  gu: {
    'nav.home': 'હોમ',
    'nav.about': 'અમારા વિશે',
    'nav.jobs': 'નોકરીઓ',
    'nav.login': 'લોગિન',
    'nav.register': 'રજિસ્ટર',
    'nav.selectLanguage': 'ભાષા પસંદ કરો',
    'nav.profile': 'પ્રોફાઇલ',
    'nav.logout': 'લોગઆઉટ'
  },
  kn: {
    'nav.home': 'ಮುಖಪುಟ',
    'nav.about': 'ನಮ್ಮ ಬಗ್ಗೆ',
    'nav.jobs': 'ಉದ್ಯೋಗಗಳು',
    'nav.login': 'ಲಾಗಿನ್',
    'nav.register': 'ನೋಂದಣಿ',
    'nav.selectLanguage': 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    'nav.profile': 'ಪ್ರೊಫೈಲ್',
    'nav.logout': 'ಲಾಗ್‌ಔಟ್'
  },
  ta: {
    'nav.home': 'முகப்பு',
    'nav.about': 'எங்களை பற்றி',
    'nav.jobs': 'வேலைகள்',
    'nav.login': 'உள்நுழைய',
    'nav.register': 'பதிவு',
    'nav.selectLanguage': 'மொழியைத் தேர்வு செய்க',
    'nav.profile': 'சுயவிவரம்',
    'nav.logout': 'வெளியேறு'
  },
  te: {
    'nav.home': 'హోమ్',
    'nav.about': 'మా గురించి',
    'nav.jobs': 'ఉద్యోగాలు',
    'nav.login': 'లాగిన్',
    'nav.register': 'రిజిస్టర్',
    'nav.selectLanguage': 'భాషను ఎంచుకోండి',
    'nav.profile': 'ప్రొఫైల్',
    'nav.logout': 'లాగ్‌అవుట్'
  },
  ml: {
    'nav.home': 'ഹോം',
    'nav.about': 'ഞങ്ങളെക്കുറിച്ച്',
    'nav.jobs': 'ജോലികൾ',
    'nav.login': 'ലോഗിൻ',
    'nav.register': 'രജിസ്റ്റർ',
    'nav.selectLanguage': 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    'nav.profile': 'പ്രൊഫൈൽ',
    'nav.logout': 'ലോഗ്‌ഔട്ട്'
  },
  bn: {
    'nav.home': 'হোম',
    'nav.about': 'আমাদের সম্পর্কে',
    'nav.jobs': 'চাকরি',
    'nav.login': 'লগইন',
    'nav.register': 'নিবন্ধন',
    'nav.selectLanguage': 'ভাষা নির্বাচন করুন',
    'nav.profile': 'প্রোফাইল',
    'nav.logout': 'লগআউট'
  },
  pa: {
    'nav.home': 'ਹੋਮ',
    'nav.about': 'ਸਾਡੇ ਬਾਰੇ',
    'nav.jobs': 'ਨੌਕਰੀਆਂ',
    'nav.login': 'ਲੌਗਇਨ',
    'nav.register': 'ਰਜਿਸਟਰ',
    'nav.selectLanguage': 'ਭਾਸ਼ਾ ਚੁਣੋ',
    'nav.profile': 'ਪ੍ਰੋਫਾਈਲ',
    'nav.logout': 'ਲੌਗਆਉਟ'
  }
};

// Custom hook for using the language context
export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to English
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    // Save language preference to localStorage whenever it changes
    localStorage.setItem('language', language);
    // Update document language
    document.documentElement.lang = language;
  }, [language]);

  const value = {
    language,
    setLanguage,
    translations: translations[language] || translations.en
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 