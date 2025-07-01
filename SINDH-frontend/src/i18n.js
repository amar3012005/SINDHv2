import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // Load translation using http -> see /public/locales
  .use(HttpApi)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage',
    },

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Backend options for loading translations from public folder
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // React i18next options
    react: {
      useSuspense: false, // Set to false to avoid suspense issues
    },
  });

export default i18n;
