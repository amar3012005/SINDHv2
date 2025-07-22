const express = require('express');
const router = express.Router();
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

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '7d' }
  );
};

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

  // Find or create worker
  let worker = await Worker.findOne({ phone });
  
  if (!worker) {
    // Create a temporary worker for OTP
    worker = new Worker({
      phone,
      name: 'Temporary',
      age: 25,
      gender: 'Male',
      aadharNumber: '123456789012',
      skills: ['Construction'],
      experience: 'Less than 1 year',
      preferredCategory: 'Construction',
      expectedSalary: '₹500 per day',
      languages: ['Hindi'],
      location: {
        village: '',
        district: '',
        state: '',
        pincode: '000000'
      },
      preferredWorkType: 'Full-time daily work',
      availability: 'Available immediately',
      workRadius: 10,
      bio: ''
    });
  }

  // Generate OTP
  const otp = await worker.generateOTP();
  
  logger.info(`OTP sent to worker phone: ${phone}`);
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

  const worker = await Worker.findOne({ phone });
  
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  // Verify OTP
  await worker.verifyOTP(otp);
  
  // Update login status
  worker.lastLogin = new Date();
  worker.isLoggedIn = 1;
  await worker.save();

  // Generate token
  const token = generateToken(worker._id, 'worker');
  
  logger.info(`Worker OTP verified successfully: ${worker.name}`);
  res.json({
    success: true,
    message: 'OTP verified successfully',
    token,
    data: {
      worker: {
        ...worker.toObject(),
        id: worker._id,
        type: 'worker'
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

  // Find or create employer
  let employer = await Employer.findOne({ phone });
  
  if (!employer) {
    // Create a temporary employer for OTP
    employer = new Employer({
      phone,
      name: 'Temporary',
      email: '',
      company: {
        name: '',
        type: '',
        industry: '',
        description: '',
        registrationNumber: ''
      },
      location: {
        village: '',
        district: '',
        state: '',
        pincode: '',
        address: ''
      },
      businessDescription: '',
      verificationDocuments: [],
      preferredLanguages: [],
      rating: { average: 0, count: 0 },
      reviews: []
    });
  }

  // Generate OTP
  const otp = await employer.generateOTP();
  
  logger.info(`OTP sent to employer phone: ${phone}`);
  res.json({
    success: true,
    message: 'OTP sent successfully',
    otp: otp // In production, this should be sent via SMS
  });
}));

// Employer OTP verification
router.post('/employer/verify-otp', asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  
  if (!phone || !otp) {
    throw new ValidationError('Phone number and OTP are required');
  }

  const employer = await Employer.findOne({ phone });
  
  if (!employer) {
    throw new NotFoundError('Employer not found');
  }

  // Verify OTP
  await employer.verifyOTP(otp);
  
  // Update login status
  employer.lastLogin = new Date();
  employer.isLoggedIn = 1;
  await employer.save();

  // Generate token
  const token = generateToken(employer._id, 'employer');
  
  logger.info(`Employer OTP verified successfully: ${employer.name}`);
  res.json({
    success: true,
    message: 'OTP verified successfully',
    token,
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