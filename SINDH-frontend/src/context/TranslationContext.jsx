import React, { createContext, useState, useEffect } from 'react';

// Translation context to manage language across the application
export const TranslationContext = createContext();

// Translations for English and Hindi
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.jobs': 'Jobs',
    'nav.profile': 'Profile',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.menu': 'Menu',
    'nav.selectLanguage': 'Select Language',
    'nav.myJobs': 'My Jobs',
    'nav.postedJobs': 'Posted Jobs',
    'nav.viewProfile': 'View Profile',
    
    // Grameenlink
    'grameenlink.title': 'GrameenLink',
    'grameenlink.slogan': 'Rural LinkedIn for Daily Wage Workers',
    'grameenlink.voice.title': 'Voice Resume',
    
    // Registration
    'register.title': 'Worker Registration',
    'register.personalInfo': 'Personal Information',
    'register.locationSkills': 'Location & Skills',
    'register.voiceResume': 'Voice Resume',
    'register.name': 'Full Name',
    'register.nameHint': 'Enter your full name as it appears on your ID',
    'register.mobile': 'Mobile Number',
    'register.mobileHint': '10-digit number without country code',
    'register.mobileError': 'Please enter a valid 10-digit mobile number',
    'register.mobileHelp': 'Enter your 10-digit number like:',
    'register.gender': 'Gender',
    'register.male': 'Male',
    'register.female': 'Female',
    'register.other': 'Other',
    'register.age': 'Age',
    'register.location': 'Village/Town',
    'register.locationPlaceholder': 'Search for your village or town',
    'register.preferredWork': 'Work Type',
    'register.construction': 'Construction',
    'register.agriculture': 'Agriculture',
    'register.domestic': 'Domestic',
    'register.factory': 'Factory',
    'register.other': 'Other',
    'register.specificSkills': 'Select Skills (you can pick multiple)',
    'register.aadhaarLinked': 'Link my Aadhaar (optional)',
    'register.aadhaarHelp': 'Linking Aadhaar increases your trust score',
    'register.voiceInstructions': 'Record a short introduction about your work experience and skills (30-60 seconds)',
    'register.recording': 'Recording in progress...',
    'register.stopRecording': 'Stop Recording',
    'register.recordingSuccess': 'Your voice recording was successful!',
    'register.reRecord': 'Record again',
    'register.voiceTipsTitle': 'Tips for a good recording',
    'register.voiceTip1': 'Mention your name, skills and experience',
    'register.voiceTip2': 'Speak clearly in your local language',
    'register.voiceTip3': 'Mention which districts you can work in',
    'register.privacyTitle': 'Your information is secure',
    'register.privacyDescription': 'Your personal details are protected and only shared with verified employers',
    'register.back': 'Back',
    'register.next': 'Next',
    'register.submit': 'Complete Registration',
    'register.processing': 'Processing...',
    'register.requiredFields': 'Please fill out all required fields',
    'register.invalidMobile': 'Please enter a valid 10-digit mobile number',
    'register.step1Required': 'Please enter your name and valid mobile number',
    'register.alreadyAccount': 'Already have an account?',
    'register.needHelp': 'Need help registering?',
    'register.callUs': 'Call us',
    'register.videoHelp': 'Video help',
    'register.findCenter': 'Find center',
    'register.step1Title': 'Personal',
    'register.step2Title': 'Skills',
    'register.step3Title': 'Voice',
    
    // Skills categories
    'skills.construction.mason': 'Mason',
    'skills.construction.helper': 'Helper',
    'skills.construction.carpenter': 'Carpenter',
    'skills.construction.plumber': 'Plumber', 
    'skills.construction.painter': 'Painter',
    'skills.construction.electrician': 'Electrician',
    
    'skills.agriculture.farm_labor': 'Farm Labor',
    'skills.agriculture.harvester': 'Harvester',
    'skills.agriculture.tractor_driver': 'Tractor Driver',
    'skills.agriculture.crop_sower': 'Crop Sower',
    'skills.agriculture.vegetable_picker': 'Vegetable Picker',
    
    'skills.domestic.house_help': 'House Help',
    'skills.domestic.cook': 'Cook',
    'skills.domestic.gardener': 'Gardener',
    'skills.domestic.security': 'Security Guard',
    'skills.domestic.driver': 'Driver',
    
    'skills.factory.machine_operator': 'Machine Operator',
    'skills.factory.packer': 'Packer',
    'skills.factory.loader': 'Loader',
    'skills.factory.cleaner': 'Cleaner',
    'skills.factory.quality_checker': 'Quality Checker',
    
    'skills.other.delivery': 'Delivery',
    'skills.other.retail': 'Retail Helper',
    'skills.other.market_labor': 'Market Labor',
    'skills.other.roadwork': 'Road Work',
    'skills.other.sanitation': 'Sanitation Worker',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.edit': 'Edit Profile',
    'profile.rating': 'Work Rating',
    'profile.shaktiScore': 'ShaktiScore',
    'profile.workHistory': 'Work History',
    'profile.noWorkHistory': 'No work history yet',
    'profile.skills': 'Skills',
    'profile.contact': 'Contact',
    'profile.availability': 'Availability',
    'profile.available': 'Available for Work',
    'profile.unavailable': 'Not Available',
    
    // Jobs
    'jobs.title': 'Available Jobs',
    'jobs.search': 'Search jobs',
    'jobs.filter': 'Filter',
    'jobs.noJobs': 'No jobs found',
    'jobs.apply': 'Apply Now',
    'jobs.applying': 'Applying...',
    'jobs.applied': 'Applied',
    'jobs.location': 'Location',
    'jobs.category': 'Category',
    'jobs.wage': 'Daily Wage',
    'jobs.duration': 'Duration',
    'jobs.startDate': 'Start Date',
    'jobs.requirements': 'Requirements',
    'jobs.postedBy': 'Posted by',
    'jobs.postedOn': 'Posted on',
    'jobs.findInLocation': 'Find jobs in',
    'jobs.findPerfectJob': 'Find the perfect job opportunity for you',
    'jobs.requestSuccess': 'Job request sent successfully!',
    'jobs.cancel': 'Cancel',
    'jobs.cancelling': 'Cancelling...',
    'jobs.recently': 'Recently',
    
    // Home
    'home.welcome': 'Welcome to S I N D H!',
    'home.welcomeBack': 'Welcome back',
    'home.loginFirst': 'Please login first to continue',
    'home.loginAsEmployer': 'Please login as an employer to post jobs',
    'home.onlyEmployers': 'Only employers can post jobs',
    'home.shaktiScore': 'Shakti Score',
    'home.viewProfile': 'View Profile',
    'home.workerMessage': 'Build your work history and improve your Shakti Score',
    'home.employerMessage': 'Post jobs and find skilled workers in your area',
    'home.loginRegister': 'Login / Register',
    'home.tagline': 'Empowering Rural Workforce',
    'home.description': 'Connect with employers and find daily wage work opportunities in your area. Building a stronger rural economy, one job at a time.',
    'home.findWork': 'Find Work',
    'home.postJob': 'Post Job',
    'home.findJobs': 'Find Jobs',
    'home.hireWorkers': 'Hire Workers',
    'home.yourShaktiScore': 'Your Shakti Score',
    'home.yourTrustScore': 'Your Trust Score',
    'home.higherScoreMessage': 'Higher score means better job opportunities!',
    'home.jobPriority': 'Job Priority',
    'home.jobPriorityDesc': 'Get priority access to new job postings',
    'home.trustBadge': 'Trust Badge',
    'home.trustBadgeDesc': 'Earn employer trust with your score',
    'home.betterPay': 'Better Pay',
    'home.betterPayDesc': 'Access to higher-paying opportunities',

    // Login
    'login.welcome': 'Welcome to S I N D H',
    'login.enterPhone': 'Enter your phone number to continue',
    'login.worker': 'Worker',
    'login.employer': 'Employer',
    'login.phonePlaceholder': 'Enter your phone number',
    'login.button': 'Login',
    'login.validPhoneRequired': 'Please enter a valid 10-digit phone number',
    'login.success': 'Login successful!',
    'login.failed': 'Failed to login. Please try again.',
    'login.sendOtp': 'Send OTP',
    'login.enterOtp': 'Enter the OTP sent to your phone',
    'login.otpSentTo': 'OTP sent to +91',
    'login.changePhone': '← Change phone number',
    'login.otpPlaceholder': 'Enter 4-digit OTP',
    'login.verifyOtp': 'Verify OTP',
    'login.resendOtp': 'Resend OTP',
    'login.resendOtpIn': 'Resend OTP in',
    'login.invalidOtp': 'Invalid OTP. Use 0000 for testing.',
    'login.otpRequired': 'Please enter a valid 4-digit OTP',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.submit': 'Submit',
  },
  
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.jobs': 'नौकरियां',
    'nav.profile': 'प्रोफाइल',
    'nav.about': 'हमारे बारे में',
    'nav.contact': 'संपर्क',
    'nav.login': 'लॉगिन',
    'nav.register': 'रजिस्टर करें',
    'nav.logout': 'लॉगआउट',
    'nav.menu': 'मेनू',
    'nav.selectLanguage': 'भाषा चुनें',
    'nav.myJobs': 'मेरे काम',
    'nav.postedJobs': 'पोस्ट किए गए काम',
    'nav.viewProfile': 'प्रोफाइल देखें',
    
    // Grameenlink
    'grameenlink.title': 'ग्रामीणलिंक',
    'grameenlink.slogan': 'दैनिक वेतन श्रमिकों के लिए ग्रामीण लिंक्डइन',
    'grameenlink.voice.title': 'आवाज़ रिज्यूमे',
    
    // Registration
    'register.title': 'कामगार पंजीकरण',
    'register.personalInfo': 'व्यक्तिगत जानकारी',
    'register.locationSkills': 'स्थान और कौशल',
    'register.voiceResume': 'आवाज़ रिज्यूमे',
    'register.name': 'पूरा नाम',
    'register.nameHint': 'अपना नाम वैसे ही लिखें जैसा आपके ID पर है',
    'register.mobile': 'मोबाइल नंबर',
    'register.mobileHint': 'देश कोड के बिना 10 अंकों का नंबर',
    'register.mobileError': 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें',
    'register.mobileHelp': '10 अंकों का नंबर इस तरह दर्ज करें:',
    'register.gender': 'लिंग',
    'register.male': 'पुरुष',
    'register.female': 'महिला',
    'register.other': 'अन्य',
    'register.age': 'उम्र',
    'register.location': 'गांव/शहर',
    'register.locationPlaceholder': 'अपने गांव या शहर को खोजें',
    'register.preferredWork': 'काम का प्रकार',
    'register.construction': 'निर्माण कार्य',
    'register.agriculture': 'कृषि कार्य',
    'register.domestic': 'घरेलू कार्य',
    'register.factory': 'फैक्ट्री कार्य',
    'register.other': 'अन्य कार्य',
    'register.specificSkills': 'कौशल चुनें (आप कई चुन सकते हैं)',
    'register.aadhaarLinked': 'मेरा आधार लिंक करें (वैकल्पिक)',
    'register.aadhaarHelp': 'आधार लिंक करने से आपका ट्रस्ट स्कोर बढ़ता है',
    'register.voiceInstructions': 'अपने काम के अनुभव और कौशल के बारे में एक छोटा परिचय रिकॉर्ड करें (30-60 सेकंड)',
    'register.recording': 'रिकॉर्डिंग जारी है...',
    'register.stopRecording': 'रिकॉर्डिंग रोकें',
    'register.recordingSuccess': 'आपकी आवाज़ रिकॉर्डिंग सफल रही!',
    'register.reRecord': 'फिर से रिकॉर्ड करें',
    'register.voiceTipsTitle': 'अच्छी रिकॉर्डिंग के लिए सुझाव',
    'register.voiceTip1': 'अपना नाम, कौशल और अनुभव बताएं',
    'register.voiceTip2': 'अपनी स्थानीय भाषा में स्पष्ट बोलें',
    'register.voiceTip3': 'बताएं कि आप किन जिलों में काम कर सकते हैं',
    'register.privacyTitle': 'आपकी जानकारी सुरक्षित है',
    'register.privacyDescription': 'आपका व्यक्तिगत विवरण सुरक्षित है और केवल प्रमाणित नियोक्ताओं के साथ साझा किया जाएगा',
    'register.back': 'वापस',
    'register.next': 'अगला',
    'register.submit': 'पंजीकरण पूरा करें',
    'register.processing': 'प्रोसेसिंग...',
    'register.requiredFields': 'कृपया सभी आवश्यक फ़ील्ड भरें',
    'register.invalidMobile': 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें',
    'register.step1Required': 'कृपया अपना नाम और सही मोबाइल नंबर दर्ज करें',
    'register.alreadyAccount': 'पहले से ही खाता है?',
    'register.needHelp': 'पंजीकरण में मदद चाहिए?',
    'register.callUs': 'हमें कॉल करें',
    'register.videoHelp': 'वीडियो सहायता',
    'register.findCenter': 'केंद्र ढूंढें',
    'register.step1Title': 'व्यक्तिगत',
    'register.step2Title': 'कौशल',
    'register.step3Title': 'आवाज़',
    
    // Skills categories
    'skills.construction.mason': 'राजमिस्त्री',
    'skills.construction.helper': 'हेल्पर',
    'skills.construction.carpenter': 'बढ़ई',
    'skills.construction.plumber': 'प्लंबर',
    'skills.construction.painter': 'पेंटर',
    'skills.construction.electrician': 'बिजली मिस्त्री',
    
    'skills.agriculture.farm_labor': 'खेत मजदूर',
    'skills.agriculture.harvester': 'फसल काटने वाला',
    'skills.agriculture.tractor_driver': 'ट्रैक्टर चालक',
    'skills.agriculture.crop_sower': 'बीज बोने वाला',
    'skills.agriculture.vegetable_picker': 'सब्ज़ी तोड़ने वाला',
    
    'skills.domestic.house_help': 'घरेलू मदद',
    'skills.domestic.cook': 'रसोइया',
    'skills.domestic.gardener': 'माली',
    'skills.domestic.security': 'सुरक्षा गार्ड',
    'skills.domestic.driver': 'ड्राइवर',
    
    'skills.factory.machine_operator': 'मशीन ऑपरेटर',
    'skills.factory.packer': 'पैकर',
    'skills.factory.loader': 'लोडर',
    'skills.factory.cleaner': 'सफाई कर्मचारी',
    'skills.factory.quality_checker': 'गुणवत्ता जांचकर्ता',
    
    'skills.other.delivery': 'डिलीवरी',
    'skills.other.retail': 'दुकान सहायक',
    'skills.other.market_labor': 'बाज़ार मजदूर',
    'skills.other.roadwork': 'सड़क निर्माण',
    'skills.other.sanitation': 'सफाई कर्मचारी',
    
    // Profile
    'profile.title': 'मेरी प्रोफाइल',
    'profile.edit': 'प्रोफाइल संपादित करें',
    'profile.rating': 'कार्य रेटिंग',
    'profile.shaktiScore': 'शक्तिस्कोर',
    'profile.workHistory': 'कार्य इतिहास',
    'profile.noWorkHistory': 'अभी तक कोई कार्य इतिहास नहीं',
    'profile.skills': 'कौशल',
    'profile.contact': 'संपर्क',
    'profile.availability': 'उपलब्धता',
    'profile.available': 'काम के लिए उपलब्ध',
    'profile.unavailable': 'उपलब्ध नहीं',
    
    // Jobs
    'jobs.title': 'उपलब्ध नौकरियां',
    'jobs.search': 'नौकरियां खोजें',
    'jobs.filter': 'फ़िल्टर',
    'jobs.noJobs': 'कोई नौकरी नहीं मिली',
    'jobs.apply': 'अभी आवेदन करें',
    'jobs.applying': 'आवेदन हो रहा है...',
    'jobs.applied': 'आवेदन किया',
    'jobs.location': 'स्थान',
    'jobs.category': 'श्रेणी',
    'jobs.wage': 'दैनिक वेतन',
    'jobs.duration': 'अवधि',
    'jobs.startDate': 'शुरू तिथि',
    'jobs.requirements': 'आवश्यकताएँ',
    'jobs.postedBy': 'पोस्ट किया गया',
    'jobs.postedOn': 'पोस्ट तिथि',
    'jobs.findInLocation': 'इस स्थान पर नौकरियां खोजें',
    'jobs.findPerfectJob': 'अपने लिए सही नौकरी का अवसर खोजें',
    'jobs.requestSuccess': 'नौकरी के लिए आवेदन सफलतापूर्वक भेजा गया!',
    'jobs.cancel': 'रद्द करें',
    'jobs.cancelling': 'रद्द कर रहा है...',
    'jobs.recently': 'हाल ही में',
    
    // Login
    'login.welcome': 'सिंध में आपका स्वागत है',
    'login.enterPhone': 'जारी रखने के लिए अपना फोन नंबर दर्ज करें',
    'login.worker': 'कार्यकर्ता',
    'login.employer': 'नियोक्ता',
    'login.phonePlaceholder': 'अपना फोन नंबर दर्ज करें',
    'login.button': 'लॉगिन',
    'login.validPhoneRequired': 'कृपया एक वैध 10-अंक का फोन नंबर दर्ज करें',
    'login.success': 'लॉगिन सफल!',
    'login.failed': 'लॉगिन विफल। कृपया पुनः प्रयास करें।',
    'login.sendOtp': 'ओटीपी भेजें',
    'login.enterOtp': 'आपके फोन पर भेजा गया ओटीपी दर्ज करें',
    'login.otpSentTo': 'ओटीपी भेजा गया +91',
    'login.changePhone': '← फोन नंबर बदलें',
    'login.otpPlaceholder': '4-अंकीय ओटीपी दर्ज करें',
    'login.verifyOtp': 'ओटीपी सत्यापित करें',
    'login.resendOtp': 'ओटीपी पुनः भेजें',
    'login.resendOtpIn': 'ओटीपी पुनः भेजें',
    'login.invalidOtp': 'अमान्य ओटीपी। परीक्षण के लिए 0000 का उपयोग करें।',
    'login.otpRequired': 'कृपया एक वैध 4-अंकीय ओटीपी दर्ज करें',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'एक त्रुटि हुई',
    'common.retry': 'पुन: प्रयास करें',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.success': 'सफल',
    'common.noResults': 'कोई परिणाम नहीं मिला',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.submit': 'जमा करें',
  }
};

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  useEffect(() => {
    // Set the language attribute on HTML for proper font handling
    document.documentElement.setAttribute('lang', currentLanguage);
    document.documentElement.setAttribute('data-language', currentLanguage);
    
    // Store the language preference
    localStorage.setItem('preferredLanguage', currentLanguage);
  }, [currentLanguage]);
  
  // Function to translate a key
  const translate = (key) => {
    if (!translations[currentLanguage][key]) {
      console.warn(`Translation key not found: ${key}`);
      return translations.en[key] || key;
    }
    return translations[currentLanguage][key];
  };
  
  // Function to change the language
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setCurrentLanguage(lang);
    }
  };
  
  useEffect(() => {
    // On mount, check if there's a stored language preference
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang && translations[storedLang]) {
      setCurrentLanguage(storedLang);
    }
  }, []);
  
  return (
    <TranslationContext.Provider value={{ 
      currentLanguage,
      changeLanguage,
      translate,
      availableLanguages: Object.keys(translations)
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationProvider;