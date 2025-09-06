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
      'jobs.perMonth': 'per month',

      // Applications
      'applications.title': 'My Applications',
      'applications.subtitle': 'Track your job applications and progress',
      'applications.loading': 'Loading your applications...',
      'applications.emptyTitle': 'No Applications Yet',
      'applications.emptySubtitle': 'Start applying to jobs to see your applications here',
      'applications.totalEarned': 'Total earned',
      'applications.currentBalance': 'Current balance',
      'applications.jobsCompleted': 'Jobs completed',
      'applications.progress': 'Application Progress',
      'applications.refreshTitle': 'Refresh Applications',
      'applications.refreshing': 'Refreshing Applications...',
      'applications.steps.applied': 'Applied',
      'applications.steps.accepted': 'Accepted',
      'applications.steps.working': 'Working',
      'applications.steps.paid': 'Paid',
      'applications.steps.completed': 'Completed',
      'applications.status.workInProgress': 'Work in Progress',
      'applications.status.paymentPending': 'Payment Pending',
      'applications.status.paymentReceived': 'Payment Received!',
      'applications.status.jobCompleted': 'Job Completed!',
      'applications.status.paymentCredited': 'Credited to Wallet',
      'applications.status.keepWorking': 'Keep up the good work! Payment will be processed once employer approves.',
      'applications.status.afterPaid': 'Great! Payment received. Waiting for employer to mark job as complete.',
      'applications.status.congrats': 'Congratulations! Job completed successfully and payment received.'
    }
  },
  hi: {
    translation: {
      // Common
      'loading': 'लोड हो रहा है...',
      'error.retry': 'पुनः प्रयास करें',
      'error.loadFailed': 'लोड करने में विफल। कृपया बाद में पुनः प्रयास करें।',

      // Jobs
      'jobs.title': 'उपलब्ध नौकरियां',
      'jobs.noJobs': 'कोई नौकरी उपलब्ध नहीं',
      'jobs.browseJobs': 'उपलब्ध नौकरियां देखें',
      'jobs.location': 'स्थान',
      'jobs.salary': 'वेतन',
      'jobs.apply': 'आवेदन करें',
      'jobs.details': 'विवरण देखें',
      'jobs.perMonth': 'प्रति माह',

      // Applications
      'applications.title': 'मेरे आवेदन',
      'applications.subtitle': 'अपने नौकरी आवेदनों और प्रगति को ट्रैक करें',
      'applications.loading': 'आपके आवेदन लोड हो रहे हैं...',
      'applications.emptyTitle': 'अभी कोई आवेदन नहीं',
      'applications.emptySubtitle': 'यहाँ आवेदन देखने के लिए नौकरियों के लिए आवेदन करना शुरू करें',
      'applications.totalEarned': 'कुल कमाई',
      'applications.currentBalance': 'वर्तमान शेष',
      'applications.jobsCompleted': 'पूर्ण हुए कार्य',
      'applications.progress': 'आवेदन प्रगति',
      'applications.refreshTitle': 'आवेदन रीफ्रेश करें',
      'applications.refreshing': 'आवेदन रीफ्रेश हो रहे हैं...',
      'applications.steps.applied': 'आवेदन किया',
      'applications.steps.accepted': 'स्वीकृत',
      'applications.steps.working': 'कार्यरत',
      'applications.steps.paid': 'भुगतान',
      'applications.steps.completed': 'पूर्ण',
      'applications.status.workInProgress': 'कार्य प्रगति पर है',
      'applications.status.paymentPending': 'भुगतान लंबित',
      'applications.status.paymentReceived': 'भुगतान प्राप्त!',
      'applications.status.jobCompleted': 'कार्य पूर्ण!',
      'applications.status.paymentCredited': 'वॉलेट में जमा',
      'applications.status.keepWorking': 'अच्छा काम जारी रखें! नियोक्ता की मंजूरी के बाद भुगतान संसाधित होगा।',
      'applications.status.afterPaid': 'बहुत बढ़िया! भुगतान प्राप्त। नियोक्ता द्वारा कार्य पूर्ण चिह्नित करने की प्रतीक्षा है।',
      'applications.status.congrats': 'बधाई हो! कार्य सफलतापूर्वक पूर्ण हुआ और भुगतान प्राप्त हुआ।'
    }
  }
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
