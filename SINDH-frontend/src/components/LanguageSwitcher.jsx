import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from 'lucide-react';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className={`relative group ${className}`}>
      <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md">
        <span>{currentLanguage.nativeName}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>
      
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              i18n.language === language.code 
                ? 'bg-indigo-50 text-indigo-700 font-medium' 
                : 'text-gray-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{language.name}</span>
              <span className="text-xs text-gray-500">{language.nativeName}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
