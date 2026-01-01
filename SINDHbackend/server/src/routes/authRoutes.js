
const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  asyncHandler
} = require('../middleware/errorHandler');

// Initialize Firebase Admin SDK
// Admin is initialized in ../config/firebase.js

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '7d' }
  );
};

router.post('/firebase-login', asyncHandler(async (req, res) => {
  const { token, userType } = req.body;

  if (!token || !userType) {
    throw new ValidationError('Firebase ID token and user type are required.');
  }

  logger.info(`🔐 Firebase login attempt for userType: ${userType}`);

  // Verify the ID token with Firebase Admin SDK
  const decodedToken = await admin.auth().verifyIdToken(token);
  const fullPhoneNumber = decodedToken.phone_number; // Full number with country code (e.g., +49176...)
  
  // Extract phone without country code for backward compatibility
  // Try to match common country code patterns
  let phoneWithoutCode = fullPhoneNumber;
  const countryCodeMatch = fullPhoneNumber.match(/^\+(\d{1,4})/);
  if (countryCodeMatch) {
    phoneWithoutCode = fullPhoneNumber.substring(countryCodeMatch[0].length);
  }
  
  logger.info(`📱 Verified phone number: ${fullPhoneNumber} (without code: ${phoneWithoutCode})`);

  // Check Firestore for existing user mapping
  // Try full phone number first (with country code), then without for backward compatibility
  let snapshot = await db.collection('users').where('phone', '==', fullPhoneNumber).limit(1).get();
  
  if (snapshot.empty) {
    // Try without country code for backward compatibility with old Indian numbers
    snapshot = await db.collection('users').where('phone', '==', phoneWithoutCode).limit(1).get();
  }

  if (snapshot.empty) {
    logger.info(`🆕 New user detected - phone ${fullPhoneNumber} not found in Firestore`);
    return res.status(200).json({
      success: true,
      requiresRegistration: true,
      message: 'Please complete your registration.',
      phoneNumber: phoneWithoutCode, // Send without country code for registration form
      userType
    });
  }

  // User exists in Firestore - get their MongoDB ID and type
  const firestoreDoc = snapshot.docs[0];
  const firestoreData = firestoreDoc.data();
  const mongoId = firestoreData.mongoId;
  const userTypeFromFirestore = firestoreData.type || userType;

  logger.info(`✅ User found in Firestore - mongoId: ${mongoId}, type: ${userTypeFromFirestore}`);

  // Fetch full profile from MongoDB based on user type
  let userProfile;
  if (userTypeFromFirestore === 'worker') {
    const worker = await Worker.findById(mongoId);
    if (!worker) {
      logger.warn(`⚠️ Worker mongoId ${mongoId} not found in MongoDB, treating as new user`);
      return res.status(200).json({
        success: true,
        requiresRegistration: true,
        message: 'Please complete your registration.',
        phoneNumber: phoneWithoutCode,
        userType
      });
    }
    
    // Update login timestamp
    worker.lastLogin = new Date();
    worker.isLoggedIn = 1;
    await worker.save();

    userProfile = {
      id: worker._id.toString(),
      _id: worker._id.toString(),
      name: worker.name,
      phone: worker.phone,
      phoneNumber: worker.phone,
      location: worker.location,
      preferredCategory: worker.preferredCategory,
      expectedSalary: worker.expectedSalary,
      skills: worker.skills,
      experience: worker.experience,
      languages: worker.languages,
      age: worker.age,
      gender: worker.gender,
      type: 'worker',
      phase: worker.phase || 1
    };
  } else if (userTypeFromFirestore === 'employer') {
    const employer = await Employer.findById(mongoId);
    if (!employer) {
      logger.warn(`⚠️ Employer mongoId ${mongoId} not found in MongoDB, treating as new user`);
      return res.status(200).json({
        success: true,
        requiresRegistration: true,
        message: 'Please complete your registration.',
        phoneNumber: phoneWithoutCode,
        userType
      });
    }
    
    // Update login timestamp
    employer.lastLogin = new Date();
    employer.isLoggedIn = 1;
    await employer.save();

    userProfile = {
      id: employer._id.toString(),
      _id: employer._id.toString(),
      name: employer.name,
      phone: employer.phone,
      phoneNumber: employer.phone,
      companyName: employer.companyName,
      location: employer.location,
      type: 'employer',
      phase: employer.phase || 1
    };
  } else {
    throw new ValidationError('Invalid user type');
  }

  // Update Firestore last login
  await db.collection('users').doc(firestoreDoc.id).update({
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    isLoggedIn: 1
  });

  // Generate JWT token with MongoDB ID
  const sessionToken = generateToken(mongoId, userTypeFromFirestore);

  logger.info(`✅ Firebase login successful for ${userProfile.name} (${userTypeFromFirestore})`);

  res.json({
    success: true,
    message: 'Login successful',
    token: sessionToken,
    requiresRegistration: false,
    data: userProfile
  });

}));


// Worker login
router.post('/workers/login', asyncHandler(async (req, res) => {
  logger.info('Worker login attempt');

  const { phoneNumber } = req.body;

  if (!phoneNumber || phoneNumber.length !== 10) {
    logger.warn('Invalid phone number provided for worker login');
    throw new ValidationError('Please provide a valid 10-digit phone number');
  }

  // Find worker by phone number
  const worker = await Worker.findOne({ phone: phoneNumber });

  if (!worker) {
    logger.info(`Worker not found with phone number: ${phoneNumber}, redirecting to registration`);
    return res.status(200).json({
      success: true,
      newUser: true,
      message: 'Please complete your registration',
      phoneNumber
    });
  }

  // Fetch job applications with proper population
  const jobApplications = await JobApplication.find({ worker: worker._id })
    .populate({
      path: 'job',
      select: 'title location salary status description'
    })
    .populate({
      path: 'employer',
      select: 'name company'
    })
    .sort({ updatedAt: -1 });

  // Separate current and past jobs
  const currentJobs = jobApplications.filter(app =>
    app.status === 'pending' || app.status === 'accepted'
  );
  const pastJobs = jobApplications.filter(app =>
    app.status === 'completed' || app.status === 'rejected'
  );

  // Generate JWT token
  const token = generateToken(worker._id, 'worker');

  // Return worker data with job history and token
  const workerData = {
    id: worker._id,
    name: worker.name,
    phoneNumber: worker.phone,
    location: worker.location,
    skills: worker.skills,
    language: worker.language,
    experience_years: worker.experience_years,
    available: worker.available,
    rating: worker.rating,
    jobHistory: {
      current: currentJobs,
      past: pastJobs
    }
  };

  logger.info(`Worker login successful for ${worker.name}`);
  res.json({
    success: true,
    message: 'Login successful',
    token,
    data: workerData
  });
}));

// Employer login
router.post('/employers/login', asyncHandler(async (req, res) => {
  logger.info('Employer login attempt');

  const { phoneNumber } = req.body;

  if (!phoneNumber || phoneNumber.length !== 10) {
    logger.warn('Invalid phone number provided for employer login');
    throw new ValidationError('Please provide a valid 10-digit phone number');
  }

  // Find employer by phone number
  const employer = await Employer.findOne({ phone: phoneNumber });

  if (!employer) {
    logger.info(`Employer not found with phone number: ${phoneNumber}, redirecting to registration`);
    return res.status(200).json({
      success: true,
      newUser: true,
      message: 'Please complete your registration',
      phoneNumber
    });
  }

  // Update employer login status
  employer.isLoggedIn = 1;
  employer.lastLogin = new Date();

  // Check if employer has all required fields before saving
  if (!employer.age) {
    logger.warn(`Employer ${employer.phone} missing required age field, redirecting to complete registration`);
    return res.status(200).json({
      success: true,
      incompleteProfile: true,
      message: 'Please complete your profile by adding missing information',
      phoneNumber: employer.phone,
      missingFields: ['age']
    });
  }

  await employer.save();

  // Generate JWT token
  const token = generateToken(employer._id, 'employer');

  // Format the employer data correctly
  const employerData = {
    id: employer._id.toString(),
    _id: employer._id.toString(),
    name: employer.name,
    phoneNumber: employer.phone,
    phone: employer.phone,
    email: employer.email,
    company: employer.company,
    location: employer.location,
    businessDescription: employer.businessDescription,
    verificationDocuments: employer.verificationDocuments,
    preferredLanguages: employer.preferredLanguages,
    rating: employer.rating,
    type: 'employer',
    isLoggedIn: 1,
    lastLogin: employer.lastLogin
  };

  logger.info(`Employer login successful for ${employer.name}`);
  res.json({
    success: true,
    message: 'Login successful',
    token,
    data: employerData
  });
}));

// Generate token endpoint for newly registered employers
router.post('/generate-token', asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    throw new ValidationError('User ID and role are required');
  }

  // Generate JWT token
  const token = generateToken(userId, role);

  res.json({
    success: true,
    token
  });
}));

// Worker OTP request
router.post('/worker/request-otp', asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.length !== 10) {
    throw new ValidationError('Please provide a valid 10-digit phone number');
  }

  // Check if worker exists
  const existingWorker = await Worker.findOne({ phone });

  if (!existingWorker) {
    logger.info(`New worker phone number: ${phone}, will create during registration`);
  } else {
    logger.info(`Existing worker found: ${existingWorker.name} (Phase: ${existingWorker.phase})`);
  }

  // For OTP request, we don't create temporary workers anymore
  // The form-based registration will handle worker creation

  // Generate a dummy OTP response for development
  // In production, this should send actual SMS
  const otp = '0000'; // Fixed OTP for development

  logger.info(`OTP request processed for worker phone: ${phone}`);
  res.json({
    success: true,
    message: 'OTP sent successfully',
    otp: otp // In production, this should be sent via SMS
  });
}));

// Worker OTP verification
router.post('/worker/verify-otp', asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ValidationError('Phone number and OTP are required');
  }

  // For development, accept '0000' as valid OTP
  if (otp !== '0000') {
    throw new ValidationError('Invalid OTP');
  }

  const worker = await Worker.findOne({ phone });

  // Check if this is a new user (worker doesn't exist)
  const isNewUser = !worker;

  // Check if existing worker needs to complete registration
  let requiresRegistration = false;
  if (worker) {
    // Worker exists but might be incomplete Phase-1
    requiresRegistration = !worker.name ||
      worker.name === 'Temporary' ||
      !worker.preferredCategory ||
      !worker.expectedSalary ||
      !worker.location?.pincode;
  }

  logger.info(`Worker OTP verification: phone=${phone}, isNewUser=${isNewUser}, requiresRegistration=${requiresRegistration}`);

  if (isNewUser) {
    // New user - redirect to registration
    logger.info(`New worker detected, redirecting to registration: ${phone}`);
    return res.json({
      success: true,
      message: 'Please complete your registration',
      isNewUser: true,
      requiresRegistration: true,
      phoneNumber: phone
    });
  }

  if (requiresRegistration) {
    // Existing worker but incomplete registration
    logger.info(`Worker exists but incomplete registration, redirecting: ${worker.name}`);
    return res.json({
      success: true,
      message: 'Please complete your registration',
      isNewUser: false,
      requiresRegistration: true,
      phoneNumber: phone
    });
  }

  // Existing worker with complete registration - allow login
  worker.lastLogin = new Date();
  worker.isLoggedIn = 1;
  await worker.save();

  // Generate token
  const token = generateToken(worker._id, 'worker');

  logger.info(`Worker login successful: ${worker.name}`);
  res.json({
    success: true,
    message: 'Login successful',
    token,
    isNewUser: false,
    requiresRegistration: false,
    data: {
      worker: {
        ...worker.toObject(),
        id: worker._id,
        type: 'worker',
        phase: worker.phase || 1
      }
    }
  });
}));

// Employer OTP request
router.post('/employer/request-otp', asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.length !== 10) {
    throw new ValidationError('Please provide a valid 10-digit phone number');
  }

  console.log(`📞 Employer OTP request for phone: \"${phone}\" (type: ${typeof phone}, length: ${phone.length})`);

  // Find or create employer (minimal data for Phase-1)
  let employer = await Employer.findOne({ phone });

  if (!employer) {
    console.log(`🆕 Creating temporary employer for phone: \"${phone}\"`);
    // Create a minimal temporary employer for OTP (Phase-1)
    employer = new Employer({
      phone,
      name: 'Temporary', // Will be updated during registration
      email: '',
      location: {
        village: '',
        district: '',
        state: '',
        pincode: ''
      },
      phase: 1,
      termsAccepted: false
    });
    await employer.save();
    console.log(`💾 Temporary employer saved with ID: ${employer._id}`);
  } else {
    console.log(`✅ Found existing employer: ${employer.name} (ID: ${employer._id})`);
  }

  // Generate OTP
  const otp = await employer.generateOTP();

  // Log OTP for development (remove in production)
  console.log(`📱 OTP for ${phone}: ${otp}`);
  logger.info(`OTP sent to employer phone: ${phone}`);
  res.json({
    success: true,
    message: 'OTP sent successfully',
    otp: otp // In production, this should be sent via SMS
  });
}));

// Employer OTP verification
// Employer OTP verification
router.post('/employer/verify-otp', asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ValidationError('Phone number and OTP are required');
  }

  console.log(`🔍 Searching for employer with phone: \"${phone}\" (type: ${typeof phone}, length: ${phone.length})`);
  const employer = await Employer.findOne({ phone });

  if (!employer) {
    console.log(`❌ Employer not found with phone: \"${phone}\"`);
    // Let's see what employers exist
    const allEmployers = await Employer.find({}, 'phone name').limit(5);
    console.log('📋 Existing employers:', allEmployers.map(e => ({ phone: e.phone, name: e.name })));
    throw new NotFoundError('Employer not found');
  }

  console.log(`✅ Found employer: ${employer.name} (phone: ${employer.phone})`);

  // Verify OTP
  await employer.verifyOTP(otp);

  // Update login status
  employer.lastLogin = new Date();
  employer.isLoggedIn = 1;
  await employer.save();

  // Check if employer has completed registration (Phase-1 fields)
  // An employer is considered \"new\" only if they have the temporary name
  const isNewUser = employer.name === 'Temporary';

  // An employer requires registration if:
  // 1. They have a temporary name (never completed registration), OR
  // 2. They don't have required Phase-1 fields (name, location, termsAccepted)
  const requiresRegistration =
    employer.name === 'Temporary' ||
    !employer.location?.state ||
    !employer.location?.village;

  console.log(`📊 Registration status check:`, {
    name: employer.name,
    hasLocation: !!(employer.location?.state && employer.location?.village),
    termsAccepted: employer.termsAccepted,
    isNewUser,
    requiresRegistration
  });

  // Generate token
  const token = generateToken(employer._id, 'employer');

  logger.info(`Employer OTP verified successfully: ${employer.name} | New User: ${isNewUser} | Requires Registration: ${requiresRegistration} | Phase: ${employer.phase}`);
  res.json({
    success: true,
    message: 'OTP verified successfully',
    token,
    isNewUser,
    requiresRegistration,
    phase: employer.phase,
    data: {
      employer: {
        ...employer.toObject(),
        id: employer._id,
        type: 'employer'
      }
    }
  });
}));

module.exports = router;