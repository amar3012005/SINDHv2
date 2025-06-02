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
      message: 'Worker registered successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        phone: worker.phone,
        rating: worker.rating
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
    
    res.status(400).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    // Find worker by phone number
    const worker = await Worker.findOne({ phone });
    console.log('Result of Worker.findOne:', JSON.stringify(worker, null, 2));
    
    if (!worker) {
      console.log('✗ Login failed: Worker not found');
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    console.log('✓ Worker found, fetching job applications...');

    // Get job applications with full details
    const jobApplications = await JobApplication.find({ worker: worker._id })
      .populate({
        path: 'job',
        select: 'title salary location status employer description'
      })
      .populate({
        path: 'employer',
        select: 'name company'
      })
      .sort({ updatedAt: -1 });
    
    console.log('\nFetched job applications:', jobApplications.length);

    // Separate current and past jobs
    const currentJobs = jobApplications.filter(app => 
      ['pending', 'accepted'].includes(app.status)
    );
    const pastJobs = jobApplications.filter(app => 
      app.status === 'completed'
    );

    // Log login success and profile information
    console.log('✓ Login successful');
    console.log('\nWorker Profile:');
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

    console.log('\n=== Current Active Jobs ===');
    console.log(`Total current jobs: ${currentJobs.length}`);
    if (currentJobs.length > 0) {
      currentJobs.forEach((app, index) => {
        console.log(`\nJob ${index + 1}:`);
        console.log(JSON.stringify({
          jobId: app.job?._id,
          title: app.job?.title || 'No title',
          status: app.status,
          employer: app.employer?.company?.name || app.employer?.name || 'Unknown employer',
          salary: app.job?.salary || 'Not specified',
          appliedAt: app.appliedAt,
          location: app.job?.location || 'Location not specified'
        }, null, 2));
      });
    } else {
      console.log('No current active jobs found');
    }

    console.log('\n=== Completed Jobs History ===');
    console.log(`Total completed jobs: ${pastJobs.length}`);
    if (pastJobs.length > 0) {
      pastJobs.forEach((app, index) => {
        console.log(`\nCompleted Job ${index + 1}:`);
        console.log(JSON.stringify({
          jobId: app.job?._id,
          title: app.job?.title || 'No title',
          employer: app.employer?.company?.name || app.employer?.name || 'Unknown employer',
          salary: app.job?.salary || 'Not specified',
          completedAt: app.completedAt,
          location: app.job?.location || 'Location not specified'
        }, null, 2));
      });
    } else {
      console.log('No completed jobs found');
    }
    console.log('\n=== End Worker Login ===\n');

    // Send response with full profile data
    res.json({
      message: 'Login successful',
      worker: {
        ...worker.toObject(),
        jobHistory: {
          current: currentJobs,
          past: pastJobs
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
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;