const { admin, db } = require('../config/firebase');
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

  console.log('🔍 Checking for existing employer with phone in Firestore:', phone);

  // PRIMARY CHECK: Check Firestore first
  const firestoreUserRef = db.collection('users').where('phone', '==', phone).limit(1);
  const firestoreSnapshot = await firestoreUserRef.get();

  if (!firestoreSnapshot.empty) {
    console.log('❌ Employer already exists in Firestore with phone:', phone);
    logger.warn(`Employer already exists in Firestore: ${phone}`);
    throw new ValidationError('Employer already exists with this phone number');
  }

  console.log('✅ Proceeding with registration/update in Firestore');

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

  console.log('🔧 Creating employer object data');
  const formattedCompany = {
    name: company?.name || company || '',
    type: company?.type || '',
    industry: company?.industry || [],
    primaryIndustry: company?.primaryIndustry || '',
    description: company?.description || '',
    registrationNumber: company?.registrationNumber || ''
  };

  const employerDataRaw = {
    name: name.trim(),
    email: email || '',
    phone: phone,
    age: age || 25,
    company: formattedCompany,
    location: {
      village: location.village || '',
      district: location.district || '',
      state: location.state || '',
      pincode: location.pincode || '',
      address: formattedLocationAddress,
      ...(validatedCoordinates && { coordinates: validatedCoordinates })
    },
    businessDescription: businessDescription || '',
    workerType: workerType || 'Daily wage workers',
    verificationDocuments: {
      aadharNumber: verificationDocuments?.aadharNumber || 'not provided',
      panNumber: verificationDocuments?.panNumber || '',
      businessLicense: verificationDocuments?.businessLicense || ''
    },
    phase: 1,
    termsAccepted: true,
    termsAcceptedAt: new Date(),
    type: 'employer',
    isLoggedIn: 1,
    lastLogin: new Date()
  };

  // Extract firebaseUid if provided by frontend
  const { firebaseUid } = req.body;

  // STEP 2: SAVE TO FIRESTORE (Primary)
  // Use Firebase UID as document ID in 'employers' collection (Phase 1 Strategy)
  const targetId = firebaseUid || (new mongoose.Types.ObjectId()).toString();

  try {
    const firestoreRef = db.collection('employers').doc(targetId);

    const firestoreData = {
      ...employerDataRaw,
      _id: targetId,
      id: targetId,
      firebaseUid: firebaseUid || null,
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      registrationDate: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    };

    await firestoreRef.set(firestoreData);
    console.log('💾 Employer profile saved to Firestore root collection (employers):', targetId);

    // Also update legacy tracking in 'users' collection for backward compatibility
    await db.collection('users').doc(targetId).set({
      phone: employerDataRaw.phone,
      mongoId: targetId,
      type: 'employer',
      firebaseUid: firebaseUid || null
    });
  } catch (fsError) {
    console.error('❌ CRITICAL: Failed to save employer to Firestore:', fsError.message);
    throw new AppError('Profile creation failed. Please try again.', 500);
  }

  // STEP 3: MONGODB SHADOW WRITE (DEPRECATED - Removed)
  /*
  try {
    // Attempt to update existing (if temporary created during job post) or create new
    await Employer.findOneAndUpdate(
      { phone },
      { $set: employerDataRaw },
      { upsert: true, timeout: 3000 }
    );
    console.log('💾 Employer also saved to MongoDB');
  } catch (mongoError) {
    console.warn('⚠️ MongoDB save failed (timed out), but profile exists in Firestore:', mongoError.message);
  }
  */

  logger.info(`Employer registered successfully in Firestore: ${name}`);

  const responseData = {
    success: true,
    message: 'Employer registered successfully',
    employer: {
      ...employerDataRaw,
      id: targetId,
      _id: targetId,
      isLoggedIn: 1
    }
  };

  res.status(201).json(responseData);
}));

// Get employer by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const isEmployerUser = (req.headers['user-type'] || req.query.userType) === 'employer';
  const employerId = req.params.id;

  logger.info(`Fetching employer by ID from Firestore: ${employerId}`);
  
  const employerDoc = await db.collection('employers').doc(employerId).get();

  if (!employerDoc.exists) {
    throw new NotFoundError('Employer not found');
  }

  const employer = employerDoc.data();

  // Fetch jobs from Firestore 'jobs' collection
  const jobsSnapshot = await db.collection('jobs').where('employer', '==', employerId).get();
  const jobs = jobsSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    _id: doc.id
  }));

  if (!isEmployerUser) {
    const publicData = {
      _id: employerId,
      id: employerId,
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
    ...employer,
    id: employerId,
    _id: employerId,
    postedJobs: jobs.map(job => job.id)
  };

  res.json(enrichedEmployer);
}));

// Get all jobs posted by an employer
router.get('/:id/jobs', asyncHandler(async (req, res) => {
  const employerId = req.params.id;
  logger.info(`Fetching jobs for employer from Firestore: ${employerId}`);
  
  const jobsSnapshot = await db.collection('jobs').where('employer', '==', employerId).get();
  const jobs = jobsSnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    _id: doc.id
  })).sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  res.json(jobs);
}));

// Add a review for an employer (typically from a worker)
router.post('/:id/reviews', asyncHandler(async (req, res) => {
  const employerId = req.params.id;
  const reviewData = {
    ...req.body,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const employerDoc = await db.collection('employers').doc(employerId).get();
  if (!employerDoc.exists) {
    throw new NotFoundError('Employer not found');
  }

  // Add review to sub-collection
  await db.collection('employers').doc(employerId).collection('reviews').add(reviewData);
  
  // Update average rating (simplified)
  const employer = employerDoc.data();
  const currentAvg = employer.rating?.average || 0;
  const currentCount = employer.rating?.count || 0;
  const newCount = currentCount + 1;
  const newAvg = (currentAvg * currentCount + (req.body.rating || 5)) / newCount;

  await db.collection('employers').doc(employerId).update({
    'rating.average': newAvg,
    'rating.count': newCount,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  logger.info(`Review added for employer: ${employerId}`);
  res.status(201).json({
    success: true,
    message: 'Review added successfully'
  });
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
  const employerId = req.params.id;
  logger.info(`Fetching stats for employer from Firestore: ${employerId}`);
  
  const jobsSnapshot = await db.collection('jobs').where('employer', '==', employerId).get();
  const jobs = jobsSnapshot.docs.map(doc => doc.data());

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(job => ['POSTED', 'APPLIED', 'active', 'in-progress'].includes(job.status)).length,
    completedJobs: jobs.filter(job => ['COMPLETED', 'completed', 'finished'].includes(job.status)).length,
    totalApplications: jobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0),
    averageApplicationsPerJob: jobs.length ?
      jobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0) / jobs.length : 0
  };
  res.json(stats);
}));

// Example: Get logged-in employer profile (requires auth middleware)
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const employerId = req.user?.id || req.user?._id;
  logger.info(`Fetching logged-in employer profile from Firestore: ${employerId}`);
  
  const employerDoc = await db.collection('employers').doc(employerId).get();
  if (!employerDoc.exists) {
    throw new NotFoundError('Employer not found');
  }
  res.json({
    ...employerDoc.data(),
    id: employerDoc.id,
    _id: employerDoc.id
  });
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
  const employerId = req.params.id;
  logger.info(`Update employer request for ID: ${employerId}`);

  const employerRef = db.collection('employers').doc(employerId);
  const employerDoc = await employerRef.get();
  
  if (!employerDoc.exists) {
    throw new NotFoundError('Employer not found');
  }

  const updateData = {
    ...req.body,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Special handling for nested fields if needed (omitted for brevity, assume simple replace for now or handle appropriately)
  await employerRef.update(updateData);

  const updatedDoc = await employerRef.get();
  logger.info(`Employer updated successfully in Firestore: ${employerId}`);
  res.json({
    ...updatedDoc.data(),
    id: updatedDoc.id,
    _id: updatedDoc.id
  });
}));

module.exports = router;