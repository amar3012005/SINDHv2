const express = require('express');
const router = express.Router();
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  AuthenticationError,
  asyncHandler 
} = require('../middleware/errorHandler');

// Test endpoint to confirm backend connectivity for employers
router.post('/initiate-registration', async (req, res) => {
  console.log('🎉 Employer registration initiated!');
  logger.info('🎉 Employer registration initiated!');
  
  res.json({ 
    success: true, 
    message: 'Employer registration initiated successfully!' 
  });
});

// Register a new employer
router.post('/register', asyncHandler(async (req, res) => {
  console.log('🎯 /register endpoint hit');
  logger.info('Employer registration request');
  
  console.log('📝 Request body received:', JSON.stringify(req.body, null, 2));
  const { name, age, phone, email, company, location, businessDescription, workerType, verificationDocuments } = req.body;

  console.log('🔍 Checking for existing employer with phone:', phone);
  let employer = await Employer.findOne({ phone });
  if (employer) {
    console.log('❌ Employer already exists with phone:', phone);
    logger.warn(`Employer already exists with phone: ${phone}`);
    throw new ValidationError('Employer already exists with this phone number');
  }
  console.log('✅ No existing employer found, proceeding with registration');

  const formattedLocationAddress = 
    `${location.village}, ${location.district}, ${location.state} - ${location.pincode}`;

  const formattedCompany = {
    name: company.name || '',
    type: company.type || '',
    industry: company.industry || '',
    description: company.description || '',
    registrationNumber: company.registrationNumber || ''
  };

  employer = new Employer({
    name,
    age,
    phone,
    email,
    company: formattedCompany,
    location: {
      village: location.village || '',
      district: location.district || '',
      state: location.state || '',
      pincode: location.pincode || '',
      address: formattedLocationAddress
    },
    businessDescription,
    workerType,
    verificationDocuments,
    documents: req.body.documents || [],
    preferredLanguages: req.body.preferredLanguages || [],
    rating: req.body.rating || { average: 0, count: 0 },
    reviews: req.body.reviews || [],
    otp: req.body.otp,
    verificationStatus: req.body.verificationStatus || 'pending'
  });

  console.log('🔧 Creating employer object with data:', JSON.stringify(employer, null, 2));
  await employer.validate();
  console.log('✅ Validation passed');
  await employer.save();
  console.log('💾 Employer saved to database');
  logger.info(`Employer registered successfully: ${employer.name}`);
  console.log('🎉 Employer created:', employer);

  const responseData = {
    success: true,
    message: 'Employer registered successfully',
    employer: {
      ...employer.toObject(),
      id: employer._id,
      _id: employer._id,
      type: 'employer',
      isLoggedIn: 1
    }
  };

  res.status(201).json(responseData);
}));

// Get employer by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const isEmployerUser = (req.headers['user-type'] || req.query.userType) === 'employer';
  
  const employer = await Employer.findById(req.params.id);
  
  if (!employer) {
    throw new NotFoundError('Employer not found');
  }
  
  const jobs = await Job.find({ employer: req.params.id });
  
  if (!isEmployerUser) {
    const publicData = {
      _id: employer._id,
      name: employer.name,
      company: {
        name: employer.company?.name,
        industry: employer.company?.industry
      },
      location: employer.location,
      rating: employer.rating,
      jobsCount: jobs.length
    };
    
    return res.json(publicData);
  }
  
  const enrichedEmployer = {
    ...employer.toObject(),
    postedJobs: jobs.map(job => job._id)
  };
  
  res.json(enrichedEmployer);
}));

// Update employer profile by ID
router.put('/:id', asyncHandler(async (req, res) => {
  logger.info(`Update employer request for ID: ${req.params.id}`);
  
  const employer = await Employer.findById(req.params.id);
  if (!employer) {
    throw new NotFoundError('Employer not found');
  }

  if (req.body.location && typeof req.body.location === 'object' && req.body.location.address !== undefined) {
     employer.location.address = req.body.location.address;
  } else if (req.body.location && typeof req.body.location === 'string') {
     employer.location.address = req.body.location;
  }

  if (req.body.company && req.body.company.name !== undefined) {
      employer.company.name = req.body.company.name;
  }
   Object.keys(req.body).forEach(key => {
      if (key !== 'location' && key !== 'company') {
           employer[key] = req.body[key];
      }
   });

  await employer.save();
  logger.info(`Employer updated successfully: ${employer._id}`);
  res.json(employer);
}));

// Get all jobs posted by an employer
router.get('/:id/jobs', asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employer: req.params.id })
    .populate('selectedWorker', 'name phone shaktiScore')
    .populate('applications.worker', 'name phone shaktiScore');
  res.json(jobs);
}));

// Add a review for a worker
router.post('/:id/reviews', asyncHandler(async (req, res) => {
  const employer = await Employer.findById(req.params.id);
  if (!employer) {
    throw new NotFoundError('Employer not found');
  }

  employer.reviews.push(req.body);
  await employer.save();
  logger.info(`Review added for employer: ${employer._id}`);
  res.status(201).json(employer);
}));

// Upload verification documents
router.post('/:id/documents', asyncHandler(async (req, res) => {
  const employer = await Employer.findById(req.params.id);
  if (!employer) {
    throw new NotFoundError('Employer not found');
  }

  const { type, url } = req.body;
  employer.documents.push({ type, url });
  await employer.save();
  logger.info(`Document added for employer: ${employer._id}`);
  res.json(employer);
}));

// Get employer statistics
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employer: req.params.id });
  
  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(job => job.status === 'open' || job.status === 'in-progress').length,
    completedJobs: jobs.filter(job => job.status === 'completed').length,
    totalApplications: jobs.reduce((sum, job) => sum + job.applications.length, 0),
    averageApplicationsPerJob: jobs.length ? 
      jobs.reduce((sum, job) => sum + job.applications.length, 0) / jobs.length : 0
  };
  res.json(stats);
}));

// Example: Get logged-in employer profile (requires auth middleware)
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const employer = await Employer.findById(req.user?.id);
  if (!employer) {
    throw new NotFoundError('Employer not found');
  }
  res.json(employer);
}));

// Post a new job
router.post('/jobs', auth, asyncHandler(async (req, res) => {
  logger.info(`Request to post job from employer: ${req.user._id}`);
  
  const employerId = req.user._id;
  const jobData = { ...req.body, employer: employerId };
  
  const newJob = new Job(jobData);
  await newJob.save();
  
  logger.info(`Job saved successfully: ${newJob._id}`);
  res.status(201).json({ 
    message: 'Job posted successfully', 
    job: newJob 
  });
}));

// Logout employer
router.post('/:id/logout', asyncHandler(async (req, res) => {
  const employer = await Employer.findById(req.params.id);
  if (!employer) {
    throw new NotFoundError('Employer not found');
  }

  employer.isLoggedIn = 0;
  await employer.save();

  logger.info(`Employer logged out: ${employer._id}`);
  res.json({ success: true, message: 'Logged out successfully' });
}));

const checkEmployerAccess = (req, res, next) => {
  const userType = req.headers['user-type'] || req.query.userType;
  const userId = req.headers['user-id'] || req.query.userId;
  const targetEmployerId = req.params.id;
  
  if (userType !== 'employer' && req.method !== 'GET') {
    logger.warn(`Unauthorized access attempt by non-employer to modify employer data`);
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized: Only employers can access this endpoint' 
    });
  }
  
  if (userType === 'employer' && userId !== targetEmployerId && req.method !== 'GET') {
    logger.warn(`Unauthorized access attempt by employer ${userId} to access another employer's data`);
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized: You can only access your own profile' 
    });
  }
  
  next();
};

router.put('/:id', checkEmployerAccess, asyncHandler(async (req, res) => {
  logger.info(`Update employer request for ID: ${req.params.id}`);
  
  const employer = await Employer.findById(req.params.id);
  if (!employer) {
    throw new NotFoundError('Employer not found');
  }

  if (req.body.location && typeof req.body.location === 'object' && req.body.location.address !== undefined) {
     employer.location.address = req.body.location.address;
  } else if (req.body.location && typeof req.body.location === 'string') {
     employer.location.address = req.body.location;
  }

  if (req.body.company && req.body.company.name !== undefined) {
      employer.company.name = req.body.company.name;
  }
   Object.keys(req.body).forEach(key => {
      if (key !== 'location' && key !== 'company') {
           employer[key] = req.body[key];
      }
   });

  await employer.save();
  logger.info(`Employer updated successfully: ${employer._id}`);
  res.json(employer);
}));

module.exports = router;