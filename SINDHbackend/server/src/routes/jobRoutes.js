const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobMatchingService = require('../services/JobMatchingService');
const NotificationService = require('../services/NotificationService');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');

// Create a new job
router.post('/', async (req, res) => {
  try {
    console.log('=== New Job Posting ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('\nJob Details:', JSON.stringify(req.body, null, 2));
    
    console.log('Validating job data...');
    
    // Check for duplicate job submission (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingJob = await Job.findOne({
      title: req.body.title,
      employer: req.body.employer,
      'location.city': req.body.location?.city,
      createdAt: { $gt: fiveMinutesAgo }
    });
    
    if (existingJob) {
      console.log('⚠️ Duplicate job submission detected');
      return res.status(400).json({ 
        success: false, 
        message: 'A similar job was already posted in the last 5 minutes'
      });
    }
    
    // Create and save the job
    const job = new Job(req.body);
    console.log('✅ Job validation successful');
    await job.save();
    
    console.log('✅ Job saved successfully:', {
      jobId: job._id,
      title: job.title,
      employer: job.employerName,
      company: job.companyName,
      location: job.location,
      salary: job.salary,
      status: job.status
    });
    
    // Update the employer's postedJobs array with ONLY the job ID
    if (req.body.employer) {
      try {
        // IMPORTANT: Only push the job ID (not a complex object)
        await Employer.findByIdAndUpdate(
          req.body.employer,
          { $push: { postedJobs: job._id } }, // Use the ObjectId directly
          { new: true }
        );
        console.log('✅ Updated employer postedJobs with job ID');
      } catch (employerError) {
        console.error('❌ Error updating employer:', employerError);
        // Don't fail the whole request if the employer update fails
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Job posted successfully',
      job: job 
    });
  } catch (error) {
    console.error('❌ Error posting job:', error);
    res.status(400).json({ message: error.message });
  }
});

// Create a job without immediately updating the employer
router.post('/create', async (req, res) => {
  try {
    console.log('=== New Job Creation Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('\nJob Details:', JSON.stringify(req.body, null, 2));
    
    // Create and save the job
    const job = new Job(req.body);
    console.log('✅ Job validation successful');
    await job.save();
    
    console.log('✅ Job saved successfully:', {
      jobId: job._id,
      title: job.title,
      employer: job.employerName,
      company: job.companyName,
      location: job.location,
      salary: job.salary,
      status: job.status
    });
    
    // After job is created, update the employer's postedJobs array
    if (req.body.employer) {
      try {
        // IMPORTANT: Only use the job ID as string to avoid ObjectId casting issues
        const updateResult = await Employer.findByIdAndUpdate(
          req.body.employer,
          { $push: { postedJobs: job._id.toString() } },
          { new: true }
        );
        
        console.log('✅ Updated employer postedJobs array:', updateResult ? 'Success' : 'Failed');
      } catch (employerError) {
        console.error('❌ Error updating employer:', employerError);
        // Don't fail the whole request if employer update fails
      }
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Job posted successfully',
      job: job 
    });
  } catch (error) {
    console.error('❌ Error posting job:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all jobs (with filters)
router.get('/', async (req, res) => {
  console.log('=== Available Jobs Page Accessed ===');
  console.log('Query Parameters:', req.query);
  console.log('Request Headers:', req.headers);
  
  try {
    const { status, location, skills } = req.query;
    const query = {};

    if (status) query.status = status;
    if (skills) {
      query.requiredSkills = {
        $in: skills.split(',')
      };
    }

    if (location) {
      // Assume location is a text string (e.g., state or city name)
      // Perform a case-insensitive text search on location.state or location.city
      query.$or = [
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.city': { $regex: location, $options: 'i' } }
      ];
    }

    console.log('MongoDB Query:', JSON.stringify(query, null, 2));

    const jobs = await Job.find(query)
      .populate({
        path: 'employer',
        model: 'Employer',
        select: 'company.name rating'
      });
      
    console.log(`Found ${jobs.length} jobs matching the criteria`);
    console.log('First job sample:', jobs.length > 0 ? {
      id: jobs[0]._id,
      title: jobs[0].title,
      status: jobs[0].status,
      location: jobs[0].location,
      employer: jobs[0].employer ? {
        companyName: jobs[0].employer.company.name,
        rating: jobs[0].employer.rating
      } : null
    } : 'No jobs found');

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching available jobs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer')
      .populate('applications.worker');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update job
router.put('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    Object.assign(job, req.body);
    await job.save();
    
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Apply for a job
router.post('/:id/apply', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const worker = await Worker.findById(req.body.workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Check if worker has already applied
    const existingApplication = job.applications.find(
      app => app.worker.toString() === worker._id.toString()
    );

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    job.applications.push({
      worker: worker._id,
      status: 'pending'
    });

    await job.save();
    
    // Populate the worker details in the response
    const updatedJob = await Job.findById(job._id)
      .populate('employer')
      .populate('applications.worker');
    
    res.status(201).json(updatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update application status
router.patch('/:id/applications/:applicationId', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = job.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = req.body.status;
    await job.save();
    
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Complete a job
router.patch('/:id/complete', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = 'completed';
    await job.save();

    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Accept a job (worker applies for a job)
router.post('/accept', async (req, res) => {
  try {
    const { jobId, workerId } = req.body;

    // Validate input
    if (!jobId || !workerId) {
      return res.status(400).json({ message: 'Job ID and Worker ID are required' });
    }

    // Get job details to get employer ID
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Create job application
    const jobApplication = new JobApplication({
      jobId,
      workerId,
      employerId: job.employer,
      status: 'pending'
    });

    await jobApplication.save();

    // Send notification to employer (you can implement this later)
    // await NotificationService.sendJobApplicationNotification(job.employer, workerId, jobId);

    res.status(201).json({ message: 'Job application submitted successfully' });
  } catch (error) {
    console.error('Error accepting job:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get accepted jobs for a worker
router.get('/worker/:workerId/accepted-jobs', async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const applications = await JobApplication.find({ workerId })
      .populate('jobId')
      .populate('employerId', 'company.name')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching accepted jobs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get job applications for an employer
router.get('/employer/:employerId/applications', async (req, res) => {
  try {
    const { employerId } = req.params;
    
    const applications = await JobApplication.find({ employerId })
      .populate('jobId')
      .populate('workerId', 'name skills experience_years')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update application status (employer accepts/rejects application)
router.patch('/applications/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    if (notes) application.notes = notes;
    await application.save();

    // Send notification to worker (you can implement this later)
    // await NotificationService.sendApplicationStatusNotification(application.workerId, status);

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update job status
router.patch('/:jobId/update-status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, applicantId, workerDetails, applicationId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = status;
    job.assignedWorker = applicantId;
    job.workerDetails = workerDetails; // Save worker details
    job.updatedAt = new Date();

    await job.save();

    // Send notification to employer
    await NotificationService.sendNotification({
      recipient: job.employer,
      type: 'worker_applied',
      message: `${workerDetails.name} has applied for your job: ${job.title}`,
      data: {
        jobId,
        workerId: applicantId,
        applicationId,
        workerDetails
      }
    });

    res.json(job);
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get jobs posted by an employer
router.get('/employer/:employerId', async (req, res) => {
  try {
    const { employerId } = req.params;
    
    console.log('Fetching jobs for employer:', employerId);

    // Validate employerId format
    if (!employerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employer ID format',
        data: []
      });
    }

    const jobs = await Job.find({ 
      employer: employerId 
    })
    .populate('employer', 'name company')
    .sort({ createdAt: -1 });
    
    console.log(`Found ${jobs.length} jobs for employer ${employerId}`);
    
    // Always return array, even if empty
    res.json(jobs || []);
    
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      data: [], // Return empty array on error
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;