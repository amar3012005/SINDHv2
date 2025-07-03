const express = require('express');
const router = express.Router();
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Register a new employer
router.post('/register', async (req, res) => {
  logger.info('Employer registration request');
  try {
    const { name, phone, email, company, location, businessDescription, verificationDocuments } = req.body;

    let employer = await Employer.findOne({ phone });
    if (employer) {
      logger.warn(`Employer already exists with phone: ${phone}`);
      return res.status(400).json({ message: 'Employer already exists with this phone number' });
    }

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
      verificationDocuments,
      documents: req.body.documents || [],
      preferredLanguages: req.body.preferredLanguages || [],
      rating: req.body.rating || { average: 0, count: 0 },
      reviews: req.body.reviews || [],
      otp: req.body.otp,
      verificationStatus: req.body.verificationStatus || 'pending'
    });

    await employer.validate();
    await employer.save();
    logger.info(`Employer registered successfully: ${employer.name}`);

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
  } catch (error) {
    logger.error('Employer registration error', { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employer by ID
router.get('/:id', async (req, res) => {
  try {
    const isEmployerUser = (req.headers['user-type'] || req.query.userType) === 'employer';
    
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      return res.status(404).json({ 
        success: false,
        message: 'Employer not found' 
      });
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
  } catch (error) {
    logger.error(`Error fetching employer: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update employer profile by ID
router.put('/:id', async (req, res) => {
  logger.info(`Update employer request for ID: ${req.params.id}`);
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
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
  } catch (error) {
    logger.error(`Error updating employer profile: ${req.params.id}`, { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
});

// Get all jobs posted by an employer
router.get('/:id/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.params.id })
      .populate('selectedWorker', 'name phone shaktiScore')
      .populate('applications.worker', 'name phone shaktiScore');
    res.json(jobs);
  } catch (error) {
    logger.error(`Error fetching jobs for employer: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Add a review for a worker
router.post('/:id/reviews', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    employer.reviews.push(req.body);
    await employer.save();
    logger.info(`Review added for employer: ${employer._id}`);
    res.status(201).json(employer);
  } catch (error) {
    logger.error(`Error adding review for employer: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message });
  }
});

// Upload verification documents
router.post('/:id/documents', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    const { type, url } = req.body;
    employer.documents.push({ type, url });
    await employer.save();
    logger.info(`Document added for employer: ${employer._id}`);
    res.json(employer);
  } catch (error) {
    logger.error(`Error uploading document for employer: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message });
  }
});

// Get employer statistics
router.get('/:id/stats', async (req, res) => {
  try {
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
  } catch (error) {
    logger.error(`Error fetching employer stats: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Example: Get logged-in employer profile (requires auth middleware)
router.get('/profile', auth, async (req, res) => {
  try {
    const employer = await Employer.findById(req.user?.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }
    res.json(employer);
  } catch (error) {
    logger.error('Error fetching employer profile', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Post a new job
router.post('/jobs', auth, async (req, res) => {
  logger.info(`Request to post job from employer: ${req.user._id}`);
  try {
    const employerId = req.user._id;
    const jobData = { ...req.body, employer: employerId };
    
    const newJob = new Job(jobData);
    await newJob.save();
    
    await Employer.findByIdAndUpdate(
      employerId,
      { $push: { postedJobs: newJob._id } }
    );
    
    logger.info(`Job saved successfully: ${newJob._id}`);
    res.status(201).json({ 
      message: 'Job posted successfully', 
      job: newJob 
    });
  } catch (error) {
    logger.error('Error posting job', { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employer's job status
router.patch('/:employerId/update-job', async (req, res) => {
  try {
    const { employerId } = req.params;
    const { jobId, status, applicantId, applicationId } = req.body;

    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    if (!employer.postedJobs) {
      employer.postedJobs = [];
    }

    const jobIndex = employer.postedJobs.findIndex(job => job.jobId.toString() === jobId);
    if (jobIndex > -1) {
      employer.postedJobs[jobIndex].status = status;
      employer.postedJobs[jobIndex].applicantId = applicantId;
      employer.postedJobs[jobIndex].applicationId = applicationId;
    }

    await employer.save();
    logger.info(`Employer job status updated for employer: ${employerId}`);
    res.json(employer);
  } catch (error) {
    logger.error(`Error updating employer job: ${employerId}`, { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Logout employer
router.post('/:id/logout', async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    employer.isLoggedIn = 0;
    await employer.save();

    logger.info(`Employer logged out: ${employer._id}`);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Logout error for employer: ${req.params.id}`, { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Add job to employer's postedJobs array - separate endpoint for better error handling
router.post('/:employerId/addJob/:jobId', async (req, res) => {
  try {
    const { employerId, jobId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employerId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer or job ID format'
      });
    }
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }
    
    if (employer.postedJobs.includes(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Job already linked to this employer'
      });
    }
    
    employer.postedJobs.push(jobId);
    await employer.save();
    
    logger.info(`Successfully added job ${jobId} to employer ${employerId}`);
    return res.status(200).json({
      success: true,
      message: 'Job added to employer successfully'
    });
  } catch (error) {
    logger.error(`Error adding job to employer: ${employerId}`, { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Failed to add job to employer',
      error: error.message
    });
  }
});

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

router.put('/:id', checkEmployerAccess, async (req, res) => {
  logger.info(`Update employer request for ID: ${req.params.id}`);
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
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
  } catch (error) {
    logger.error(`Error updating employer profile: ${req.params.id}`, { error: error.message, stack: error.stack });
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;