const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const JobMatchingService = require('../services/JobMatchingService');
const JobApplication = require('../models/JobApplication');

// Register a new worker
router.post('/register', async (req, res) => {
  console.log('\n=== Worker Registration Request ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('\nRequest Body:');
  console.log(JSON.stringify(req.body, null, 2));
  
  try {
    // Create new worker instance
    console.log('\nCreating worker instance...');
    const worker = new Worker(req.body);
    
    // Validate worker data
    console.log('\nValidating worker data...');
    try {
      await worker.validate();
      console.log('✓ Validation successful');
    } catch (validationError) {
      console.error('✗ Validation failed:', {
        errors: validationError.errors,
        message: validationError.message
      });
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: validationError.errors 
      });
    }
    
    // Save worker to database
    console.log('\nSaving worker to database...');
    await worker.save();
    console.log('✓ Worker saved successfully');
    console.log('Worker ID:', worker._id);
    
    // Send response
    console.log('\nSending response...');
    const response = { 
      success: true,
      message: 'Worker registered successfully',
      data: {
        worker: {
          id: worker._id,
          name: worker.name,
          phone: worker.phone,
          rating: worker.rating,
          shaktiScore: worker.shaktiScore,
          profileCompletionPercentage: worker.profileCompletionPercentage
        }
      }
    };
    console.log('Response:', JSON.stringify(response, null, 2));
    
    res.status(201).json(response);
    console.log('\n=== Worker Registration Completed Successfully ===\n');
  } catch (error) {
    console.error('\n=== Worker Registration Failed ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle specific errors
    let statusCode = 500;
    let errorMessage = error.message;
    
    if (error.code === 11000) {
      statusCode = 409;
      if (error.message.includes('phone')) {
        errorMessage = 'Phone number already registered';
      } else if (error.message.includes('aadharNumber')) {
        errorMessage = 'Aadhar number already registered';
      } else {
        errorMessage = 'Account already exists';
      }
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Invalid data provided';
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all workers
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find({});
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get worker by ID
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update worker
router.put('/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete worker
router.delete('/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get matching jobs for a worker
router.get('/:id/jobs', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    // Log worker's ShaktiScore before job matching
    console.log('Job matching - Worker ShaktiScore:', worker.shaktiScore);
    
    const matchingJobs = await JobMatchingService.findMatchingJobs(worker);
    res.json(matchingJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update worker availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    worker.isAvailable = req.body.isAvailable;
    await worker.save();
    
    res.json(worker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update work radius
router.patch('/:id/work-radius', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    worker.workRadius = req.body.workRadius;
    await worker.save();
    
    res.json(worker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get worker profile with job history
router.get('/:id/profile', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Get job applications for the worker
    const jobApplications = await JobApplication.find({ worker: worker._id })
      .populate('job')
      .populate('employer', 'company.name')
      .sort({ updatedAt: -1 });

    // Separate current and past jobs
    const currentJobs = jobApplications.filter(app => 
      ['pending', 'accepted'].includes(app.status)
    );
    const pastJobs = jobApplications.filter(app => 
      app.status === 'completed'
    );

    // Log detailed profile information
    console.log('\n=== Worker Profile ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('\nWorker Details:');
    console.log(JSON.stringify({
      id: worker._id,
      name: worker.name,
      phone: worker.phone,
      skills: worker.skills,
      rating: worker.rating,
      shaktiScore: worker.shaktiScore,
      location: worker.location,
      languages: worker.languages,
      experience: worker.experience
    }, null, 2));

    console.log('\nCurrent Jobs:');
    console.log(JSON.stringify(currentJobs.map(app => ({
      jobId: app.job._id,
      title: app.job.title,
      employer: app.employer.company?.name,
      status: app.status,
      appliedAt: app.appliedAt,
      salary: app.job.salary
    })), null, 2));

    console.log('\nJob History:');
    console.log(JSON.stringify(pastJobs.map(app => ({
      jobId: app.job._id,
      title: app.job.title,
      employer: app.employer.company?.name,
      completedAt: app.completedAt,
      salary: app.job.salary
    })), null, 2));
    console.log('\n=== End Worker Profile ===\n');

    // Send response with full profile data
    res.json({
      worker: {
        ...worker.toObject(),
        jobHistory: {
          current: currentJobs,
          past: pastJobs
        }
      }
    });
  } catch (error) {
    console.error('Error fetching worker profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Worker login
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;

    console.log('\n=== Worker Login Attempt ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Phone:', phone);

    if (!phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number is required' 
      });
    }

    // Find worker by phone number
    const worker = await Worker.findOne({ phone });
    console.log('Worker found:', !!worker);
    
    if (!worker) {
      console.log('✗ Login failed: Worker not found');
      return res.status(404).json({ 
        success: false,
        message: 'Worker not found. Please register first.' 
      });
    }
    
    console.log('✓ Worker found, updating login status...');

    // Update last login
    worker.lastLogin = new Date();
    worker.isLoggedIn = 1;
    await worker.save();

    console.log('✓ Login successful');
    console.log('\nWorker Profile:');
    console.log(JSON.stringify({
      id: worker._id,
      name: worker.name,
      phone: worker.phone,
      skills: worker.skills,
      rating: worker.rating,
      shaktiScore: worker.shaktiScore
    }, null, 2));
    console.log('\n=== End Worker Login ===\n');

    // Send comprehensive response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        worker: {
          ...worker.toObject(),
          id: worker._id, // Ensure id field is present
          type: 'worker' // Explicitly set user type
        }
      }
    });
  } catch (error) {
    console.error('\n=== Worker Login Failed ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get worker balance and earnings
router.get('/:id/balance', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).select('balance earnings name');
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    console.log('Fetching balance for worker:', worker.name, 'Balance:', worker.balance);
    
    res.json({
      balance: worker.balance || 0,
      earnings: worker.earnings || []
    });
  } catch (error) {
    console.error('Error fetching worker balance:', error);
    res.status(500).json({ message: error.message });
  }
});

// Manually process payment for completed job
router.post('/:workerId/process-payment/:applicationId', async (req, res) => {
  try {
    const { amount } = req.body;
    
    const worker = await Worker.findById(workerId);
    if (worker) {
      // Add to balance immediately
      worker.balance += amount;
      worker.earnings.push({
        jobId: application.job._id,
        amount: amount,
        description: `Payment for: ${application.job.title}`,
        date: new Date()
      });
      await worker.save();
    }
    
    // Update application payment status
    application.paymentStatus = 'paid';
    application.paymentAmount = amount;
    application.paymentDate = new Date();
    await application.save();
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Recalculate and sync worker balance based on completed jobs
router.post('/:id/sync-balance', async (req, res) => {
  try {
    const workerId = req.params.id;
    
    console.log('Syncing balance for worker:', workerId);
    
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    // Find all completed paid applications for this worker
    const JobApplication = require('../models/JobApplication');
    const completedApplications = await JobApplication.find({
      worker: workerId,
      status: 'completed',
      paymentStatus: 'paid'
    }).populate('job');
    
    console.log(`Found ${completedApplications.length} completed paid jobs`);
    
    // Calculate total using the same logic as frontend
    const totalEarned = completedApplications.reduce((sum, app) => {
      const amount = app.paymentAmount || app.job?.salary || 0;
      return sum + amount;
    }, 0);
    
    console.log(`Calculated total earnings: ₹${totalEarned}`);
    
    // Update worker balance
    worker.balance = totalEarned;
    
    // Rebuild earnings array from completed applications
    worker.earnings = completedApplications.map(app => ({
      jobId: app.job._id,
      amount: app.paymentAmount || app.job?.salary || 0,
      description: `Payment for: ${app.job?.title || 'Job'}`,
      date: app.paymentDate || app.updatedAt || new Date()
    }));
    
    await worker.save();
    
    console.log(`Balance synced successfully: ₹${worker.balance}`);
    
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
    
  } catch (error) {
    console.error('Error syncing worker balance:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get worker wallet data
router.get('/:id/wallet', async (req, res) => {
  try {
    const workerId = req.params.id;
    
    console.log('Fetching wallet data for worker:', workerId);
    
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    // Get all completed job applications for earnings
    const JobApplication = require('../models/JobApplication');
    const completedApplications = await JobApplication.find({
      worker: workerId,
      status: 'completed',
      paymentStatus: 'paid'
    }).populate('job');
    
    console.log(`Found ${completedApplications.length} completed paid applications`);
    
    // Calculate totals
    const totalEarned = completedApplications.reduce((sum, app) => {
      return sum + (app.paymentAmount || app.job?.salary || 0);
    }, 0);
    
    // Get withdrawal history
    const withdrawals = worker.withdrawals || [];
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    // Create transaction history
    const transactions = [
      // Earnings from completed jobs
      ...completedApplications.map(app => ({
        id: app._id.toString(),
        type: 'earning',
        amount: app.paymentAmount || app.job?.salary || 0,
        description: `Payment for: ${app.job?.title || 'Job'}`,
        date: app.paymentDate || app.updatedAt,
        status: 'completed',
        jobTitle: app.job?.title
      })),
      // Withdrawals
      ...withdrawals.map((w, index) => ({
        id: w._id ? w._id.toString() : `withdrawal_${index}`,
        type: 'withdrawal',
        amount: w.amount,
        description: `Withdrawal to ${w.method || 'bank account'}`,
        date: w.date,
        status: w.status || 'completed'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Ensure worker balance matches calculated balance
    const currentBalance = totalEarned - totalWithdrawn;
    if (worker.balance !== currentBalance) {
      worker.balance = currentBalance;
      await worker.save();
      console.log(`Updated worker balance from ₹${worker.balance} to ₹${currentBalance}`);
    }
    
    res.json({
      balance: currentBalance,
      totalEarned: totalEarned,
      totalSpent: totalWithdrawn,
      transactions: transactions
    });
    
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    res.status(500).json({ 
      message: error.message,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactions: []
    });
  }
});

// Process withdrawal request
router.post('/:id/withdraw', async (req, res) => {
  try {
    const workerId = req.params.id;
    const { amount, method } = req.body;
    
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    if (amount > worker.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Initialize withdrawals array if it doesn't exist
    if (!Array.isArray(worker.withdrawals)) {
      worker.withdrawals = [];
    }
    
    // Add withdrawal record
    const withdrawal = {
      amount: amount,
      method: method || 'bank_transfer',
      date: new Date(),
      status: 'pending'
    };
    
    worker.withdrawals.push(withdrawal);
    worker.balance -= amount;
    
    await worker.save();
    
    console.log(`Withdrawal processed: ${worker.name} - ₹${amount}`);
    
    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      newBalance: worker.balance
    });
    
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;