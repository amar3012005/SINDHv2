const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');

// Worker login
router.post('/workers/login', async (req, res) => {
  try {
    console.log('\n=== Worker Login Attempt ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request Body:', req.body);
    console.log('Headers:', req.headers);

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

    console.log('\nJob Applications Status:');
    console.log('Total Applications:', jobApplications.length);
    jobApplications.forEach((app, index) => {
      console.log(`\nApplication ${index + 1}:`);
      console.log({
        applicationId: app._id,
        jobId: app.job?._id,
        jobTitle: app.job?.title,
        status: app.status,
        appliedAt: app.applicationDetails?.appliedAt,
        employer: app.employer?.name,
        acceptButton: app.status === 'pending' ? 'Shown' : 'Hidden'
      });
    });

    // Log session data
    console.log('\nSession Data:', {
      userId: worker?._id,
      isLoggedIn: true,
      userType: 'worker',
      timestamp: new Date().toISOString()
    });

    // Separate current and past jobs
    const currentJobs = jobApplications.filter(app => 
      app.status === 'pending' || app.status === 'accepted'
    );
    const pastJobs = jobApplications.filter(app => 
      app.status === 'completed' || app.status === 'rejected'
    );

    // Return worker data with job history
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

    console.log('Worker data with job history:', JSON.stringify(workerData, null, 2));
    res.json({
      success: true,
      message: 'Login successful',
      data: workerData
    });
  } catch (error) {
    console.error('\n❌ Worker Login Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
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
      console.log('Employer not found for phone number:', phoneNumber);
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

    console.log('Employer login successful:', {
      id: employerData.id,
      name: employerData.name,
      isLoggedIn: employerData.isLoggedIn
    });

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