import React, { useContext } from 'react';
import { TranslationContext } from '../../context/TranslationContext';

const LanguageToggle = ({ className }) => {
  const { currentLanguage, changeLanguage, translate } = useContext(TranslationContext);

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'hi' : 'en';
    changeLanguage(newLanguage);
  };

  return (
    <div className={`language-toggle ${className || ''}`}>
      <button 
        onClick={toggleLanguage}
        className="flex items-center px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors duration-200 text-sm font-medium"
        aria-label={`Switch to ${currentLanguage === 'en' ? 'Hindi' : 'English'}`}
      >
        <span className="mr-2">{currentLanguage === 'en' ? 'हिंदी' : 'English'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      </button>
    </div>
  );
};

export default LanguageToggle;
