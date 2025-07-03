const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const JobMatchingService = require('../services/JobMatchingService');
const JobApplication = require('../models/JobApplication');
const logger = require('../config/logger');

// Register a new worker
router.post('/register', async (req, res) => {
  logger.info('Worker registration request');
  try {
    const worker = new Worker(req.body);
    await worker.validate();
    await worker.save();
    logger.info(`Worker registered successfully: ${worker.name}`);
    res.status(201).json({ 
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
    });
  } catch (error) {
    logger.error('Worker registration failed', { error: error.message, stack: error.stack });
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Phone number already registered' });
    } else if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: 'Invalid data provided' });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
});

// Get all workers
router.get('/', async (req, res) => {
  try {
    const workers = await Worker.find({});
    res.json(workers);
  } catch (error) {
    logger.error('Error fetching workers', { error: error.message, stack: error.stack });
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
    logger.error(`Error fetching worker by ID: ${req.params.id}`, { error: error.message, stack: error.stack });
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
    logger.info(`Worker profile updated: ${worker.name}`);
    res.json(worker);
  } catch (error) {
    logger.error(`Error updating worker: ${req.params.id}`, { error: error.message, stack: error.stack });
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
    logger.info(`Worker deleted: ${worker.name}`);
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting worker: ${req.params.id}`, { error: error.message, stack: error.stack });
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
    
    logger.info(`Finding matching jobs for worker: ${worker.name}`);
    const matchingJobs = await JobMatchingService.findMatchingJobs(worker);
    res.json(matchingJobs);
  } catch (error) {
    logger.error(`Error finding matching jobs for worker: ${req.params.id}`, { error: error.message, stack: error.stack });
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
    logger.info(`Worker availability updated for ${worker.name}`);
    res.json(worker);
  } catch (error) {
    logger.error(`Error updating worker availability: ${req.params.id}`, { error: error.message, stack: error.stack });
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
    logger.info(`Worker work radius updated for ${worker.name}`);
    res.json(worker);
  } catch (error) {
    logger.error(`Error updating worker work radius: ${req.params.id}`, { error: error.message, stack: error.stack });
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
  } catch (error) {
    logger.error(`Error fetching worker profile: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Worker login
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number is required' 
      });
    }

    const worker = await Worker.findOne({ phone });
    
    if (!worker) {
      return res.status(404).json({ 
        success: false,
        message: 'Worker not found. Please register first.' 
      });
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
  } catch (error) {
    logger.error('Worker login failed', { error: error.message, stack: error.stack });
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
    
    res.json({
      balance: worker.balance || 0,
      earnings: worker.earnings || []
    });
  } catch (error) {
    logger.error(`Error fetching worker balance: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Manually process payment for completed job
router.post('/:workerId/process-payment/:applicationId', async (req, res) => {
  try {
    const { amount } = req.body;
    
    const worker = await Worker.findById(req.params.workerId);
    if (worker) {
      worker.balance += amount;
      worker.earnings.push({
        jobId: application.job._id,
        amount: amount,
        description: `Payment for: ${application.job.title}`,
        date: new Date()
      });
      await worker.save();
    }
    
    application.paymentStatus = 'paid';
    application.paymentAmount = amount;
    application.paymentDate = new Date();
    await application.save();
    logger.info(`Payment processed for worker: ${worker.name}`);
  } catch (error) {
    logger.error('Error processing payment', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Recalculate and sync worker balance based on completed jobs
router.post('/:id/sync-balance', async (req, res) => {
  try {
    const workerId = req.params.id;
    
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
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
    
  } catch (error) {
    logger.error(`Error syncing worker balance: ${req.params.id}`, { error: error.message, stack: error.stack });
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
    
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
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
    
  } catch (error) {
    logger.error(`Error fetching wallet data: ${req.params.id}`, { error: error.message, stack: error.stack });
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
    
  } catch (error) {
    logger.error(`Error processing withdrawal: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;