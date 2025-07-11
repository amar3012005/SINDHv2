const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '7d' }
  );
};

// Worker login
router.post('/workers/login', async (req, res) => {
  try {
    logger.info('Worker login attempt');

    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      logger.warn('Invalid phone number provided for worker login');
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Find worker by phone number
    const worker = await Worker.findOne({ phone: phoneNumber });
    
    if (!worker) {
      logger.info(`Worker not found with phone number: ${phoneNumber}`);
      return res.status(404).json({ 
        success: false,
        message: 'No worker account found with this phone number.',
        newUser: true
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
  } catch (error) {
    logger.error('Worker login error', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Employer login
router.post('/employers/login', async (req, res) => {
  logger.info('Employer login attempt');
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      logger.warn('Invalid phone number provided for employer login');
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Find employer by phone number
    const employer = await Employer.findOne({ phone: phoneNumber });
    
    if (!employer) {
      logger.info(`Employer not found with phone number: ${phoneNumber}`);
      return res.status(404).json({ 
        success: false,
        message: 'No employer account found with this phone number.',
        newUser: true
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
  } catch (error) {
    logger.error('Error in employer login', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Generate token endpoint for newly registered employers
router.post('/generate-token', async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role are required'
      });
    }

    // Generate JWT token
    const token = generateToken(userId, role);
    
    res.json({
      success: true,
      token
    });
  } catch (error) {
    logger.error('Error generating token', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;