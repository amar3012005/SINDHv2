const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Worker = require('../models/Worker');
const JobMatchingService = require('../services/JobMatchingService');
const JobApplication = require('../models/JobApplication');
const logger = require('../config/logger');
const {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  asyncHandler
} = require('../middleware/errorHandler');

// Test endpoint to confirm backend connectivity
router.post('/initiate-registration', async (req, res) => {
  console.log('🎉 Worker registration initiated!');
  logger.info('🎉 Worker registration initiated!');

  res.json({
    success: true,
    message: 'Worker registration initiated successfully!'
  });
});

// Register a new worker
router.post('/register', asyncHandler(async (req, res) => {
  console.log('🎯 /register endpoint hit');
  logger.info('Worker registration request');

  console.log('📝 Request body received:', JSON.stringify(req.body, null, 2));
  const {
    name,
    age,
    phone,
    email,
    gender,
    aadharNumber,
    skills,
    experience,
    preferredCategory,
    expectedSalary,
    languages,
    location,
    preferredWorkType,
    availability,
    workRadius,
    bio,
    phase = 1 // Default to Phase-1
  } = req.body;

  console.log('🔍 Checking for existing worker with phone:', phone);
  let worker = await Worker.findOne({ phone });
  if (worker) {
    console.log('❌ Worker already exists with phone:', phone);
    logger.warn(`Worker already exists with phone: ${phone}`);
    throw new ValidationError('Worker already exists with this phone number');
  }
  console.log('✅ No existing worker found, proceeding with registration');

  // Enhanced Phase-1 validation
  if (phase === 1) {
    // Phase-1 requires: name, age, phone, preferredCategory, expectedSalary, location
    if (!name || !name.trim()) {
      throw new ValidationError('Name is required for Phase-1 registration');
    }
    if (!age || age < 18 || age > 70) {
      throw new ValidationError('Valid age (18-70) is required for Phase-1 registration');
    }
    if (!phone || phone.length !== 10) {
      throw new ValidationError('Valid 10-digit phone number is required');
    }
    if (!preferredCategory) {
      throw new ValidationError('Preferred work category is required for Phase-1 registration');
    }
    if (!expectedSalary) {
      throw new ValidationError('Expected salary is required for Phase-1 registration');
    }
    if (!location) {
      throw new ValidationError('Location information is required for Phase-1 registration');
    }
  }

  // Validate location - must have either pincode or coordinates
  if (!location?.pincode && (!location?.coordinates || !Array.isArray(location.coordinates))) {
    throw new ValidationError('Location must include either pincode or GPS coordinates');
  }

  // Format location data - handle nested coordinates from frontend
  const formattedLocation = {
    address: location?.address || '',
    village: location?.village || '',
    district: location?.district || '',
    state: location?.state || '',
    pincode: location?.pincode || '',
    coordinates: {
      type: "Point",
      coordinates: (
        Array.isArray(location?.coordinates?.coordinates)
          ? location.coordinates.coordinates
          : Array.isArray(location?.coordinates)
            ? location.coordinates
            : [0, 0]
      )
    }
  };

  // Phase-1: Minimal required fields with defaults
  // Phase-2: All fields
  worker = new Worker({
    name: name.trim(),
    age: parseInt(age) || 25,
    phone,
    email: email || '',
    gender: gender || 'Male',
    aadharNumber: aadharNumber || null,
    skills: skills || [],
    experience: experience || 'Less than 1 year',
    preferredCategory: preferredCategory || 'Construction',
    expectedSalary: expectedSalary || '₹500 per day',
    languages: languages || ['Hindi'],
    location: formattedLocation,
    preferredWorkType: preferredWorkType || 'Full-time daily work',
    availability: availability || 'Available immediately',
    workRadius: parseInt(workRadius) || 10,
    bio: bio || '',
    phase: parseInt(phase) || 1,
    verificationStatus: 'pending',
    isAvailable: true,
    rating: { average: 0, count: 0, reviews: [] },
    registrationDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isLoggedIn: 1,
    documents: [],
    workHistory: [],
    activeJobs: 0,
    completedJobs: 0,
    emailNotifications: true,
    smsNotifications: true,
    profilePicture: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },
    type: 'worker'
  });

  console.log('🔧 Creating worker object with phase:', phase);
  await worker.validate();
  console.log('✅ Validation passed');
  await worker.save();
  console.log('💾 Worker saved to database');
  logger.info(`Worker registered successfully: ${worker.name}`);
  console.log('🎉 Worker created:', worker);

  const responseData = {
    success: true,
    message: 'Worker registered successfully',
    worker: {
      ...worker.toObject(),
      id: worker._id,
      _id: worker._id,
      type: 'worker',
      isLoggedIn: 1
    }
  };

  res.status(201).json(responseData);
}));

// Get all workers
router.get('/', asyncHandler(async (req, res) => {
  const workers = await Worker.find({});
  res.json(workers);
}));

// Get worker by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.info(`Fetching worker by ID: ${id}`);
  console.log(`🔍 [GET /api/workers/${id}] Looking for worker...`);
  console.log(`   Database: ${mongoose.connection.name}, State: ${mongoose.connection.readyState}`);

  const worker = await Worker.findById(id);
  if (!worker) {
    console.error(`❌ [GET /api/workers/${id}] Worker NOT FOUND in database`);
    // List all IDs to see if there's a mismatch
    const allWorkers = await Worker.find({}, '_id name').limit(5);
    console.log(`   Recent workers in DB:`, allWorkers.map(w => w._id.toString()));

    throw new NotFoundError('Worker not found');
  }

  console.log(`✅ [GET /api/workers/${id}] Worker found: ${worker.name}`);
  res.json(worker);
}));

// Update worker
router.put('/:id', asyncHandler(async (req, res) => {
  const worker = await Worker.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }
  logger.info(`Worker profile updated: ${worker.name}`);
  res.json(worker);
}));

// Delete worker
router.delete('/:id', asyncHandler(async (req, res) => {
  const worker = await Worker.findByIdAndDelete(req.params.id);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }
  logger.info(`Worker deleted: ${worker.name}`);
  res.json({ message: 'Worker deleted successfully' });
}));

// Get matching jobs for a worker
router.get('/:id/jobs', asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  logger.info(`Finding matching jobs for worker: ${worker.name}`);
  const matchingJobs = await JobMatchingService.findMatchingJobs(worker);
  res.json(matchingJobs);
}));

// Update worker availability
router.patch('/:id/availability', asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  worker.isAvailable = req.body.isAvailable;
  await worker.save();
  logger.info(`Worker availability updated for ${worker.name}`);
  res.json(worker);
}));

// Update work radius
router.patch('/:id/work-radius', asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  worker.workRadius = req.body.workRadius;
  await worker.save();
  logger.info(`Worker work radius updated for ${worker.name}`);
  res.json(worker);
}));

// Get worker profile with job history
router.get('/:id/profile', asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  const jobApplications = await JobApplication.find({ worker: worker._id })
    .populate('job')
    .populate('employer', 'company.name')
    .sort({ updatedAt: -1 });

  const currentJobs = jobApplications.filter(app =>
    ['pending', 'accepted'].includes(app.status)
  );
  const pastJobs = jobApplications.filter(app =>
    app.status === 'completed'
  );

  res.json({
    worker: {
      ...worker.toObject(),
      jobHistory: {
        current: currentJobs,
        past: pastJobs
      }
    }
  });
}));

// Worker login
router.post('/login', asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ValidationError('Phone number is required');
  }

  const worker = await Worker.findOne({ phone });

  if (!worker) {
    throw new NotFoundError('Worker not found. Please register first.');
  }

  worker.lastLogin = new Date();
  worker.isLoggedIn = 1;
  await worker.save();

  logger.info(`Worker login successful: ${worker.name}`);
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      worker: {
        ...worker.toObject(),
        id: worker._id,
        type: 'worker'
      }
    }
  });
}));

// Get worker balance and earnings
router.get('/:id/balance', asyncHandler(async (req, res) => {
  const worker = await Worker.findById(req.params.id).select('balance earnings name');
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  res.json({
    balance: worker.balance || 0,
    earnings: worker.earnings || []
  });
}));

// Manually process payment for completed job
router.post('/:workerId/process-payment/:applicationId', asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const worker = await Worker.findById(req.params.workerId);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  const application = await JobApplication.findById(req.params.applicationId);
  if (!application) {
    throw new NotFoundError('Job application not found');
  }

  worker.balance += amount;
  worker.earnings.push({
    jobId: application.job._id,
    amount: amount,
    description: `Payment for: ${application.job.title}`,
    date: new Date()
  });
  await worker.save();

  application.paymentStatus = 'paid';
  application.paymentAmount = amount;
  application.paymentDate = new Date();
  await application.save();

  logger.info(`Payment processed for worker: ${worker.name}`);
  res.json({
    success: true,
    message: 'Payment processed successfully',
    newBalance: worker.balance
  });
}));

// Recalculate and sync worker balance based on completed jobs
router.post('/:id/sync-balance', asyncHandler(async (req, res) => {
  const workerId = req.params.id;

  const worker = await Worker.findById(workerId);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  const JobApplication = require('../models/JobApplication');
  const completedApplications = await JobApplication.find({
    worker: workerId,
    status: 'completed',
    paymentStatus: 'paid'
  }).populate('job');

  const totalEarned = completedApplications.reduce((sum, app) => {
    const amount = app.paymentAmount || app.job?.salary || 0;
    return sum + amount;
  }, 0);

  worker.balance = totalEarned;

  worker.earnings = completedApplications.map(app => ({
    jobId: app.job._id,
    amount: app.paymentAmount || app.job?.salary || 0,
    description: `Payment for: ${app.job?.title || 'Job'}`,
    date: app.paymentDate || app.updatedAt || new Date()
  }));

  await worker.save();

  logger.info(`Balance synced successfully for worker: ${worker.name}`);
  res.json({
    success: true,
    message: 'Balance synchronized successfully',
    worker: {
      name: worker.name,
      balance: worker.balance,
      earningsCount: worker.earnings.length,
      totalEarned: totalEarned
    }
  });
}));

// Get worker wallet data
router.get('/:id/wallet', asyncHandler(async (req, res) => {
  const workerId = req.params.id;

  const worker = await Worker.findById(workerId);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  const JobApplication = require('../models/JobApplication');
  const completedApplications = await JobApplication.find({
    worker: workerId,
    status: 'completed',
    paymentStatus: 'paid'
  }).populate('job');

  const totalEarned = completedApplications.reduce((sum, app) => {
    return sum + (app.paymentAmount || app.job?.salary || 0);
  }, 0);

  const withdrawals = worker.withdrawals || [];
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  const transactions = [
    ...completedApplications.map(app => ({
      id: app._id.toString(),
      type: 'earning',
      amount: app.paymentAmount || app.job?.salary || 0,
      description: `Payment for: ${app.job?.title || 'Job'}`,
      date: app.paymentDate || app.updatedAt,
      status: 'completed',
      jobTitle: app.job?.title
    })),
    ...withdrawals.map((w, index) => ({
      id: w._id ? w._id.toString() : `withdrawal_${index}`,
      type: 'withdrawal',
      amount: w.amount,
      description: `Withdrawal to ${w.method || 'bank account'}`,
      date: w.date,
      status: w.status || 'completed'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const currentBalance = totalEarned - totalWithdrawn;
  if (worker.balance !== currentBalance) {
    worker.balance = currentBalance;
    await worker.save();
    logger.info(`Updated worker balance from ${worker.balance} to ${currentBalance}`);
  }

  res.json({
    balance: currentBalance,
    totalEarned: totalEarned,
    totalSpent: totalWithdrawn,
    transactions: transactions
  });
}));

// Process withdrawal request
router.post('/:id/withdraw', asyncHandler(async (req, res) => {
  const workerId = req.params.id;
  const { amount, method } = req.body;

  const worker = await Worker.findById(workerId);
  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  if (amount > worker.balance) {
    throw new ValidationError('Insufficient balance');
  }

  if (!Array.isArray(worker.withdrawals)) {
    worker.withdrawals = [];
  }

  const withdrawal = {
    amount: amount,
    method: method || 'bank_transfer',
    date: new Date(),
    status: 'pending'
  };

  worker.withdrawals.push(withdrawal);
  worker.balance -= amount;

  await worker.save();

  logger.info(`Withdrawal processed: ${worker.name} - ₹${amount}`);
  res.json({
    success: true,
    message: 'Withdrawal request submitted successfully',
    newBalance: worker.balance
  });
}));

module.exports = router;