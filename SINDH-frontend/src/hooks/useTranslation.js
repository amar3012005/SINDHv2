import { useContext } from 'react';
import { TranslationContext } from '../context/TranslationContext';

/**
 * Custom hook to access translation functionality
 * @returns {Object} Translation utilities
 */
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  const { translate, currentLanguage, changeLanguage, availableLanguages } = context;
  
  /**
   * Translate a key to the current language
   * @param {string} key - Translation key
   * @param {Object} params - Optional parameters to replace in the translation
   * @returns {string} Translated text
   */
  const t = (key, params = {}) => {
    let translation = translate(key);
    
    // Replace parameters in the translation
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });
    }
    
    return translation;
  };
  
  return {
    t,
    currentLanguage,
    changeLanguage,
    availableLanguages,
    isRtl: currentLanguage === 'ar', // For future RTL language support
  };
};

export default useTranslation;
