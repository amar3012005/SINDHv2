const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const auth = require('../middleware/auth');

// Worker request OTP
router.post('/worker/request-otp', async (req, res) => {
  try {
    let worker = await Worker.findOne({ phone: req.body.phone });
    
    if (!worker) {
      // If worker doesn't exist, create a new one with minimal info
      worker = new Worker({
        phone: req.body.phone,
        name: req.body.name || 'Unknown'  // Name can be updated later
      });
      await worker.save();
    }
    
    const otp = await worker.generateOTP();
    
    // For development, always send OTP in response
    // In production, this should be replaced with actual SMS sending
    res.status(200).json({ 
      message: 'OTP sent successfully',
      otp: otp,  // Remove this in production
      phone: req.body.phone // Include phone in response for development
    });
  } catch (error) {
    console.error('Worker OTP Request Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Worker verify OTP and login
router.post('/worker/verify-otp', async (req, res) => {
  try {
    const worker = await Worker.findOne({ phone: req.body.phone });
    
    if (!worker) {
      throw new Error('Worker not found');
    }
    
    await worker.verifyOTP(req.body.otp);
    const token = await worker.generateAuthToken();
    
    res.status(200).json({ worker, token });
  } catch (error) {
    console.error('Worker OTP Verification Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Employer request OTP
router.post('/employer/request-otp', async (req, res) => {
  try {
    let employer = await Employer.findOne({ phone: req.body.phone });
    
    if (!employer) {
      // If employer doesn't exist, create a new one with minimal info
      employer = new Employer({
        phone: req.body.phone,
        name: req.body.name || 'Unknown',
        company: {
          name: req.body.companyName || 'Unknown Company'
        }
      });
      await employer.save();
    }
    
    const otp = await employer.generateOTP();
    
    // For development, always send OTP in response
    // In production, this should be replaced with actual SMS sending
    res.status(200).json({ 
      message: 'OTP sent successfully',
      otp: otp,  // Remove this in production
      phone: req.body.phone // Include phone in response for development
    });
  } catch (error) {
    console.error('Employer OTP Request Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Employer verify OTP and login
router.post('/employer/verify-otp', async (req, res) => {
  try {
    const employer = await Employer.findOne({ phone: req.body.phone });
    
    if (!employer) {
      throw new Error('Employer not found');
    }
    
    await employer.verifyOTP(req.body.otp);
    const token = await employer.generateAuthToken();
    
    res.status(200).json({ employer, token });
  } catch (error) {
    console.error('Employer OTP Verification Error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Since we're using JWT, we don't need to clear tokens
    // The client should just remove the token from storage
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 