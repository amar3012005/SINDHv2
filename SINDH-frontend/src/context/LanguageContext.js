import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    home: 'Home',
    about: 'About',
    login: 'Login',
    register: 'Register',
    findWork: 'Find Work',
    postJob: 'Post Job',
    workerProfile: 'Worker Profile',
    contact: 'Contact',
    language: 'Language',
    searchWorkers: 'Search Workers',
    categories: 'Categories',
    recentJobs: 'Recent Jobs',
    featuredWorkers: 'Featured Workers',
    howItWorks: 'How It Works',
    testimonials: 'Testimonials',
    footer: {
      aboutUs: 'About Us',
      services: 'Services',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      contact: 'Contact Us'
    }
  },
  hi: {
    home: 'होम',
    about: 'हमारे बारे में',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    findWork: 'काम ढूंढें',
    postJob: 'नौकरी पोस्ट करें',
    workerProfile: 'वर्कर प्रोफाइल',
    contact: 'संपर्क',
    language: 'भाषा',
    searchWorkers: 'वर्कर खोजें',
    categories: 'श्रेणियां',
    recentJobs: 'हाल के काम',
    featuredWorkers: 'विशेष वर्कर',
    howItWorks: 'यह कैसे काम करता है',
    testimonials: 'प्रशंसापत्र',
    footer: {
      aboutUs: 'हमारे बारे में',
      services: 'सेवाएं',
      privacy: 'गोपनीयता नीति',
      terms: 'नियम और शर्तें',
      contact: 'संपर्क करें'
    }
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, translations: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
} 