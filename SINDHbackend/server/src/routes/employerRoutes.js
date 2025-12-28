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
  console.log('🎯 POST /register endpoint hit');
  console.log('📋 Request headers:', req.headers);
  console.log('📋 Request method:', req.method);
  console.log('📋 Request URL:', req.url);
  logger.info('Employer registration request received');

  console.log('📝 Request body received:', JSON.stringify(req.body, null, 2));
  const {
    name,
    phone,
    email,
    location,
    termsAccepted,
    // Phase-2 optional fields
    age,
    company,
    businessDescription,
    workerType,
    verificationDocuments
  } = req.body;

  console.log('✅ Parsed fields:', { name, phone, location: location?.pincode, termsAccepted });

  // Validate Phase-1 required fields
  if (!name || !phone || !location) {
    throw new ValidationError('Name, phone, and location are required for registration');
  }

  // Validate terms acceptance
  if (!termsAccepted) {
    throw new ValidationError('You must accept the Terms of Service to register');
  }

  console.log('🔍 Checking for existing employer with phone:', phone);
  let employer = await Employer.findOne({ phone });

  if (employer && employer.name !== 'Temporary' && employer.location?.pincode) {
    console.log('❌ Employer already exists and is fully registered with phone:', phone);
    logger.warn(`Employer already exists with phone: ${phone}`);
    throw new ValidationError('Employer already exists with this phone number');
  }

  if (employer) {
    console.log('🔄 Updating existing temporary employer found with phone:', phone);
  } else {
    console.log('✅ No existing employer found, proceeding with creating new registration');
    employer = new Employer({ phone });
  }

  // Format location address
  const formattedLocationAddress =
    `${location.village || ''}, ${location.district || ''}, ${location.state || ''} - ${location.pincode || ''}`.trim();

  // Validate GPS coordinates if provided
  let validatedCoordinates = null;
  if (location.coordinates) {
    try {
      const coords = location.coordinates.coordinates || location.coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        const [lng, lat] = coords;
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          validatedCoordinates = {
            type: 'Point',
            coordinates: [lng, lat]
          };
          console.log('📍 GPS coordinates validated:', validatedCoordinates);
        } else {
          console.warn('⚠️ Invalid GPS coordinates (out of range):', coords);
        }
      } else {
        console.warn('⚠️ Invalid GPS coordinates format:', location.coordinates);
      }
    } catch (error) {
      console.warn('⚠️ Error processing GPS coordinates:', error.message);
    }
  }

  // Format company data with Phase-1 defaults
  // Handle both company.name and top-level companyName from frontend
  const companyNameValue = req.body.companyName || company?.name || '';
  const formattedCompany = {
    name: companyNameValue,
    type: company?.type || '',
    industry: company?.industry || [],
    description: company?.description || '',
    registrationNumber: company?.registrationNumber || ''
  };

  // Update employer fields with Phase-1 data
  employer.name = name;
  employer.email = email || '';
  employer.age = age || 25;
  employer.company = formattedCompany;
  employer.location = {
    village: location.village || '',
    district: location.district || '',
    state: location.state || '',
    pincode: location.pincode || '',
    address: formattedLocationAddress,
    ...(validatedCoordinates && { coordinates: validatedCoordinates })
  };
  employer.businessDescription = businessDescription || '';
  employer.workerType = workerType || 'Daily wage workers';
  employer.verificationDocuments = {
    aadharNumber: verificationDocuments?.aadharNumber || 'not provided',
    panNumber: verificationDocuments?.panNumber || '',
    businessLicense: verificationDocuments?.businessLicense || ''
  };
  employer.phase = 1;
  employer.termsAccepted = true;
  employer.termsAcceptedAt = new Date();

  // Update other optional fields
  if (req.body.documents) employer.documents = req.body.documents;
  if (req.body.preferredLanguages) employer.preferredLanguages = req.body.preferredLanguages;
  if (req.body.rating) employer.rating = req.body.rating;
  if (req.body.reviews) employer.reviews = req.body.reviews;
  if (req.body.verificationStatus) employer.verificationStatus = req.body.verificationStatus;

  console.log('🔧 Saving Phase-1 employer with data:', JSON.stringify({
    name: employer.name,
    phone: employer.phone,
    email: employer.email,
    phase: employer.phase,
    shaktiScore: employer.shaktiScore,
    profileCompleteness: employer.profileCompleteness
  }, null, 2));

  await employer.validate();
  console.log('✅ Validation passed');
  await employer.save();
  console.log('💾 Employer saved to database');

  // Comment 6: Explicit logging of saved employer details for diagnostics
  console.log('📋 Saved Employer Details:');
  console.log('  - ID:', employer._id);
  console.log('  - Phone:', employer.phone);
  console.log('  - Coordinates:', employer.location?.coordinates);
  logger.info(`Phase-1 Employer registered successfully: ${employer.name} | ID: ${employer._id} | Phone: ${employer.phone} | GPS: ${employer.location?.coordinates ? 'Yes' : 'No'} | ShaktiScore: ${employer.shaktiScore} | Profile: ${employer.profileCompleteness}%`);
  console.log('🎉 Employer created:', employer);

  const responseData = {
    success: true,
    message: 'Employer registered successfully',
    employer: {
      ...employer.toObject(),
      id: employer._id,
      _id: employer._id,
      type: 'employer',
      isLoggedIn: 1,
      phase: employer.phase,
      shaktiScore: employer.shaktiScore,
      profileCompleteness: employer.profileCompleteness
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

// Get all jobs posted by an employer

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