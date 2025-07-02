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
  console.log('=== BACKEND: Available Jobs Page Accessed ===');
  console.log('BACKEND: Query Parameters:', req.query);
  
  try {
    const { status, location, skills, workerId, category, minSalary, employmentType } = req.query;
    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    } else {
      // Default to active jobs only
      query.status = 'active';
    }

    // Skills filter
    if (skills) {
      query.requiredSkills = {
        $in: skills.split(',')
      };
    }

    // Category filter
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // Employment type filter
    if (employmentType) {
      query.employmentType = { $regex: employmentType, $options: 'i' };
    }

    // Salary filter
    if (minSalary) {
      query.salary = { $gte: parseInt(minSalary) };
    }

    // Location filter - enhanced for better matching
    if (location) {
      console.log('BACKEND: Applying location filter for:', location);
      query.$or = [
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.street': { $regex: location, $options: 'i' } }
      ];
    }

    console.log('BACKEND: MongoDB Query:', JSON.stringify(query, null, 2));

    // Fetch worker applications if workerId is provided
    let workerApplications = [];
    if (workerId) {
      console.log('BACKEND: Fetching applications for worker:', workerId);
      try {
        const applications = await JobApplication.find({ 
          worker: workerId,
          status: { $in: ['pending', 'accepted', 'in-progress'] }
        }).populate('job');
        
        workerApplications = applications;
        console.log(`BACKEND: Found ${workerApplications.length} current applications`);
      } catch (appError) {
        console.error('BACKEND: Error fetching applications:', appError);
      }
    }

    // Fetch jobs with sorting by creation date (newest first)
    let jobs = await Job.find(query)
      .populate({
        path: 'employer',
        model: 'Employer',
        select: 'name company companyName rating contact'
      })
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();
      
    console.log(`BACKEND: Found ${jobs.length} jobs matching the criteria`);
    
    if (jobs.length > 0) {
      console.log('BACKEND: First job raw data:', jobs[0]);
      
      // Log location distribution for debugging
      const locationStats = jobs.reduce((acc, job) => {
        const state = job.location?.state || 'Unknown';
        const city = job.location?.city || 'Unknown';
        const key = `${state} - ${city}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      console.log('BACKEND: Job location distribution:', locationStats);
    }
    
    // Process jobs to ensure all required fields are present
    const processedJobs = jobs.map((job, index) => {
      console.log(`BACKEND: Processing job ${index + 1}: ${job.title}`);
      
      // Find if worker has applied for this job
      const workerApplication = workerApplications.find(app => 
        app.job && app.job._id.toString() === job._id.toString()
      );

      // Create a properly formatted job object
      const processedJob = {
        _id: job._id,
        id: job._id,
        title: job.title || `Job Opportunity ${index + 1}`,
        companyName: job.companyName || 
                    job.company?.name || 
                    job.employer?.company?.name || 
                    job.employer?.companyName ||
                    job.employer?.name ||
                    'Local Employer',
        description: job.description || 
                    job.jobDescription || 
                    `Work opportunity available in ${job.location?.city || 'the area'}. Contact employer for more details about this position.`,
        salary: job.salary || 
               job.pay || 
               job.wage || 
               15000, // Default numeric value for better filtering
        location: {
          city: job.location?.city || 'Not specified',
          state: job.location?.state || 'Not specified',
          street: job.location?.street || '',
          pincode: job.location?.pincode || '',
          type: job.location?.type || 'onsite'
        },
        category: job.category || 'General Work',
        employmentType: job.employmentType || 'Full-time',
        skillsRequired: job.skillsRequired || [],
        requirements: job.requirements || 'Basic requirements apply',
        status: job.status || 'active',
        urgency: job.urgency || 'Normal',
        createdAt: job.createdAt || new Date().toISOString(),
        updatedAt: job.updatedAt || new Date().toISOString(),
        employer: job.employer || null,
        // Application status if worker has applied
        hasApplied: !!workerApplication,
        application: workerApplication || null,
        applicationStatus: workerApplication?.status || null
      };

      return processedJob;
    });
    
    console.log('BACKEND: Sending response with', processedJobs.length, 'processed jobs');
    
    // Send clean response
    res.status(200).json(processedJobs);
    
  } catch (error) {
    console.error('BACKEND: Error fetching available jobs:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      data: []
    });
  }
});

// Get job count (lightweight endpoint) - MUST be before /:id route
router.get('/count', async (req, res) => {
  try {
    const { location, category, minSalary, employmentType } = req.query;
    const query = { status: 'active' }; // Only count active jobs

    console.log('BACKEND: Job count request with filters:', req.query);

    // Apply filters
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (employmentType) {
      query.employmentType = { $regex: employmentType, $options: 'i' };
    }

    if (minSalary) {
      query.salary = { $gte: parseInt(minSalary) };
    }

    if (location) {
      query.$or = [
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.city': { $regex: location, $options: 'i' } }
      ];
    }

    const count = await Job.countDocuments(query);
    
    console.log('BACKEND: Job count result:', { query, count });
    
    res.json({
      success: true,
      count: count,
      filters: req.query
    });
    
  } catch (error) {
    console.error('BACKEND: Error getting job count:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get job count',
      count: 0,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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