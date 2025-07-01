import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Define translations
const resources = {
  en: {
    translation: {
      // Common
      'loading': 'Loading...',
      'error.retry': 'Retry',
      'error.loadFailed': 'Failed to load. Please try again later.',
      
      // Jobs
      'jobs.title': 'Available Jobs',
      'jobs.noJobs': 'No jobs available',
      'jobs.browseJobs': 'Browse Available Jobs',
      'jobs.location': 'Location',
      'jobs.salary': 'Salary',
      'jobs.apply': 'Apply',
      'jobs.details': 'View Details',
      
      // Applications
      'applications.title': 'My Applications',
      'applications.current': 'Current Applications',
      'applications.past': 'Past Jobs',
      'applications.noApplications': 'No Current Applications',
      'applications.noPastJobs': 'No past jobs to show',
      'applications.startApplying': 'Start by applying to available jobs',
      'applications.appliedOn': 'Applied on',
      'applications.completedOn': 'Completed on',
      'applications.markCompleted': 'Mark as Completed',
      'applications.cancelApplication': 'Cancel Application',
      'applications.cancelling': 'Cancelling...',
      'applications.pending': 'Request sent to employer',
      'applications.lastUpdated': 'Last updated:',
      'applications.refresh': 'Refresh',
      'applications.refreshing': 'Refreshing...'
    }
  },
  // Add more languages here as needed
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    }
  });

export default i18n;
