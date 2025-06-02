const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');

// Worker login
router.post('/workers/login', async (req, res) => {
  console.log('Worker login attempt:', req.body);
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      console.log('Invalid phone number:', phoneNumber);
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Find worker by phone number
    const worker = await Worker.findOne({ phone: phoneNumber });
    console.log('Result of Worker.findOne:', worker);
    
    if (!worker) {
      console.log('Worker not found for phone number:', phoneNumber);
      return res.status(404).json({ 
        success: false,
        message: 'No worker account found with this phone number.',
        newUser: true
      });
    }

    // Fetch job applications for the worker
    const jobApplications = await JobApplication.find({ worker: worker._id })
      .populate({
        path: 'job',
        select: 'title location salary status description employerId',
        populate: {
          path: 'employerId',
          select: 'name company'
        }
      })
      .sort({ updatedAt: -1 })
      .lean();

    console.log('Job applications found:', JSON.stringify(jobApplications, null, 2));

    // Separate current and past jobs
    const currentJobs = jobApplications.filter(app => app.status === 'active' || app.status === 'pending');
    const pastJobs = jobApplications.filter(app => app.status === 'completed' || app.status === 'rejected');

    // Return worker data with job history
    const workerData = {
      id: worker._id,
      name: worker.name,
      phoneNumber: worker.phone,
      location: worker.location,
      skills: worker.skills,
      preferredCategory: worker.preferredCategory,
      expectedSalary: worker.expectedSalary,
      shaktiScore: worker.shaktiScore,
      jobHistory: {
        current: currentJobs,
        past: pastJobs
      }
    };

    console.log('Worker data with job history:', JSON.stringify(workerData, null, 2));
    res.json({
      success: true,
      message: 'Login successful',
      data: workerData
    });
  } catch (error) {
    console.error('Error in worker login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Employer login
router.post('/employers/login', async (req, res) => {
  console.log('Employer login attempt:', req.body);
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      console.log('Invalid phone number:', phoneNumber);
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Find employer by phone number
    const employer = await Employer.findOne({ phone: phoneNumber });
    console.log('Result of Employer.findOne:', employer);
    
    if (!employer) {
      // User not found, indicate this explicitly
      console.log('Employer not found for phone number:', phoneNumber);
      return res.status(404).json({ 
        success: false,
        message: 'No employer account found with this phone number.', // More specific message
        newUser: true // Indicate that this is likely a new user
      });
    }

    // Return employer data (excluding sensitive information)
    const employerData = {
      id: employer._id,
      name: employer.name,
      phoneNumber: employer.phone,
      company: employer.company,
      location: employer.location,
      businessDescription: employer.businessDescription,
      verificationDocuments: employer.verificationDocuments,
      preferredLanguages: employer.preferredLanguages,
      rating: employer.rating
    };

    console.log('Employer login successful for phone:', phoneNumber);
    res.json({
      success: true,
      message: 'Login successful',
      data: employerData
    });
  } catch (error) {
    console.error('Error in employer login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

module.exports = router;