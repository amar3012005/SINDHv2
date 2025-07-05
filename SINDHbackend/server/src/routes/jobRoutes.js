const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobMatchingService = require('../services/JobMatchingService');
const NotificationService = require('../services/NotificationService');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');
const logger = require('../config/logger');

// Create a new job
router.post('/', async (req, res) => {
  logger.info('New job posting');
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingJob = await Job.findOne({
      title: req.body.title,
      employer: req.body.employer,
      'location.city': req.body.location?.city,
      createdAt: { $gt: fiveMinutesAgo }
    });
    
    if (existingJob) {
      logger.warn('Duplicate job submission detected');
      return res.status(400).json({ 
        success: false, 
        message: 'A similar job was already posted in the last 5 minutes'
      });
    }
    
    const job = new Job(req.body);
    await job.save();
    
    if (req.body.employer) {
      try {
        await Employer.findByIdAndUpdate(
          req.body.employer,
          { $push: { postedJobs: job._id } },
          { new: true }
        );
      } catch (employerError) {
        logger.error('Error updating employer after job creation', { error: employerError.message, stack: employerError.stack });
      }
    }
    
    logger.info(`Job posted successfully: ${job.title}`);
    res.status(201).json({ 
      success: true, 
      message: 'Job posted successfully',
      job: job 
    });
  } catch (error) {
    logger.error('Error posting job', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message });
  }
});

// Get all jobs (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, location, skills, workerId, category, minSalary, employmentType } = req.query;
    const query = {};

    if (status && status !== 'active,in-progress') {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'in-progress'] };
    }

    if (skills) {
      query.requiredSkills = {
        $in: skills.split(',')
      };
    }

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
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.street': { $regex: location, $options: 'i' } }
      ];
    }

    let workerApplications = [];
    let completedJobIds = [];
    
    if (workerId) {
      try {
        const allApplications = await JobApplication.find({ 
          worker: workerId
        }).populate('job');
        
        const completedApplications = allApplications.filter(app => app.status === 'completed');
        completedJobIds = completedApplications.map(app => app.job?._id?.toString()).filter(Boolean);
        
        workerApplications = allApplications.filter(app => 
          app.status && ['pending', 'accepted', 'in-progress'].includes(app.status)
        );
      } catch (appError) {
        logger.error('Error fetching applications for worker', { error: appError.message, stack: appError.stack });
      }
    }

    let jobs = await Job.find(query)
      .populate({
        path: 'employer',
        model: 'Employer',
        select: 'name company companyName rating contact'
      })
      .sort({ createdAt: -1 })
      .lean();
      
    if (completedJobIds.length > 0) {
      jobs = jobs.filter(job => !completedJobIds.includes(job._id.toString()));
    }
    
    const processedJobs = jobs.map((job, index) => {
      const workerApplication = workerApplications.find(app => 
        app.job && app.job._id.toString() === job._id.toString()
      );

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
               15000,
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
        hasApplied: !!workerApplication,
        application: workerApplication || null,
        applicationStatus: workerApplication?.status || null
      };

      return processedJob;
    });
    
    res.status(200).json(processedJobs);
    
  } catch (error) {
    logger.error('Error fetching available jobs', { error: error.message, stack: error.stack });
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
    const { location, category, minSalary, employmentType, workerId, status } = req.query;
    let query = {};

    if (status && status !== 'active,in-progress') {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'in-progress'] };
    }

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

    let count = await Job.countDocuments(query);

    if (workerId) {
      try {
        const completedApplications = await JobApplication.find({
          worker: workerId,
          status: 'completed'
        }).select('job');
        
        const completedJobIds = completedApplications.map(app => app.job.toString());
        
        if (completedJobIds.length > 0) {
          const excludeCompletedQuery = {
            ...query,
            _id: { $nin: completedJobIds }
          };
          count = await Job.countDocuments(excludeCompletedQuery);
        }
      } catch (error) {
        logger.error('Error filtering completed jobs from count', { error: error.message, stack: error.stack });
      }
    }
    
    res.json({
      success: true,
      count: count,
      filters: req.query
    });
    
  } catch (error) {
    logger.error('Error getting job count', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false,
      message: 'Failed to get job count',
      count: 0,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get completed jobs for a worker (Past Jobs) - MUST be before /:id route
router.get('/worker/:workerId/completed', async (req, res) => {
  try {
    const { workerId } = req.params;
    
    let completedApplications = await JobApplication.find({
      worker: workerId,
      status: 'completed'
    })
    .populate('job')
    .populate('employer', 'name company companyName')
    .sort({ updatedAt: -1 });
    
    if (completedApplications.length === 0) {
      const worker = await Worker.findById(workerId);
      if (worker && worker.phone) {
        completedApplications = await JobApplication.find({
          'workerDetails.phone': worker.phone,
          status: 'completed'
        })
        .populate('job')
        .populate('employer', 'name company companyName')
        .sort({ updatedAt: -1 });
        
        for (const app of completedApplications) {
          if (app.worker.toString() !== workerId) {
            app.worker = workerId;
            app.workerDetails.name = worker.name;
            await app.save();
          }
        }
      }
    }
    
    // Filter out applications with null jobs and safely map the data
    const validApplications = completedApplications.filter(app => app.job && app.job._id);
    
    const completedJobs = validApplications.map(app => {
      try {
        return {
          _id: app._id,
          job: {
            _id: app.job._id,
            title: app.job.title || 'Job Title Not Available',
            companyName: app.job.companyName || 'Company Not Available',
            location: app.job.location || { city: 'Not specified', state: 'Not specified' },
            salary: app.job.salary || 0,
            category: app.job.category || 'General',
            description: app.job.description || 'No description available'
          },
          application: {
            status: app.status,
            appliedAt: app.applicationDetails?.appliedAt || app.createdAt,
            completedAt: app.jobCompletedDate || app.updatedAt,
            paymentStatus: app.paymentStatus || 'pending',
            paymentAmount: app.paymentAmount || app.job.salary || 0,
            paymentDate: app.paymentDate
          },
          employer: app.employer || { name: 'Unknown Employer' }
        };
      } catch (mapError) {
        logger.error('Error mapping completed job:', { 
          error: mapError.message, 
          applicationId: app._id 
        });
        return null;
      }
    }).filter(Boolean); // Remove any null entries
    
    logger.info(`Successfully processed ${completedJobs.length} completed jobs for worker ${workerId}`);
    
    res.json({
      success: true,
      count: completedJobs.length,
      data: completedJobs
    });
    
  } catch (error) {
    logger.error('Error fetching completed jobs', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed jobs',
      data: []
    });
  }
});

// Get recent jobs - MUST be before /:id route
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10, workerId } = req.query;
    
    logger.info(`Fetching recent jobs, limit: ${limit}, workerId: ${workerId}`);
    
    const query = {
      status: { $in: ['active', 'in-progress'] }
    };

    // If workerId provided, exclude completed jobs for that worker
    let excludeJobIds = [];
    if (workerId) {
      try {
        const completedApplications = await JobApplication.find({
          worker: workerId,
          status: 'completed'
        }).select('job');
        
        excludeJobIds = completedApplications.map(app => app.job);
        
        if (excludeJobIds.length > 0) {
          query._id = { $nin: excludeJobIds };
        }
      } catch (appError) {
        logger.error('Error fetching worker completed jobs for recent filter', { error: appError.message });
      }
    }

    const recentJobs = await Job.find(query)
      .populate({
        path: 'employer',
        model: 'Employer',
        select: 'name company companyName rating contact'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    logger.info(`Found ${recentJobs.length} recent jobs`);

    res.json({
      success: true,
      count: recentJobs.length,
      data: recentJobs
    });
    
  } catch (error) {
    logger.error('Error fetching recent jobs', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get jobs posted by an employer - MUST be before /:id route
router.get('/employer/:employerId', async (req, res) => {
  try {
    const { employerId } = req.params;
    
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
    
    res.json(jobs || []);
    
  } catch (error) {
    logger.error('Error fetching employer jobs', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      data: [],
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get accepted jobs for a worker - MUST be before /:id route
router.get('/worker/:workerId/accepted-jobs', async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const applications = await JobApplication.find({ workerId })
      .populate('jobId')
      .populate('employerId', 'company.name')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    logger.error('Error fetching accepted jobs', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Get job applications for an employer - MUST be before /:id route
router.get('/employer/:employerId/applications', async (req, res) => {
  try {
    const { employerId } = req.params;
    
    const applications = await JobApplication.find({ employerId })
      .populate('jobId')
      .populate('workerId', 'name skills experience_years')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    logger.error('Error fetching job applications', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Get job by ID - MUST be after all specific routes
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    const job = await Job.findById(id)
      .populate('employer');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Fetch applications separately from JobApplication collection
    const applications = await JobApplication.find({ job: id })
      .populate('worker', 'name phone email skills experience')
      .populate('employer', 'name companyName')
      .sort({ createdAt: -1 });

    // Add applications to the job object
    const jobWithApplications = {
      ...job.toObject(),
      applications: applications
    };

    res.json(jobWithApplications);
  } catch (error) {
    logger.error(`Error fetching job by ID: ${req.params.id}`, { error: error.message, stack: error.stack });
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
    logger.info(`Job updated successfully: ${job.title}`);
    res.json(job);
  } catch (error) {
    logger.error(`Error updating job: ${req.params.id}`, { error: error.message, stack: error.stack });
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

    // Check if application already exists in JobApplication collection
    const existingApplication = await JobApplication.findOne({
      job: req.params.id,
      worker: req.body.workerId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    // Create new application in JobApplication collection
    const newApplication = new JobApplication({
      job: req.params.id,
      worker: req.body.workerId,
      employer: job.employer,
      status: 'pending',
      workerDetails: {
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        skills: worker.skills || [],
        experience: worker.experience || ''
      }
    });

    await newApplication.save();
    
    // Return the job with updated applications
    const updatedJob = await Job.findById(job._id).populate('employer');
    const applications = await JobApplication.find({ job: job._id })
      .populate('worker', 'name phone email skills experience');
    
    logger.info(`Worker ${worker.name} applied for job: ${job.title}`);
    res.status(201).json({
      ...updatedJob.toObject(),
      applications: applications
    });
  } catch (error) {
    logger.error('Error applying for job', { error: error.message, stack: error.stack });
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

    // Update application in JobApplication collection
    const application = await JobApplication.findByIdAndUpdate(
      req.params.applicationId,
      { status: req.body.status },
      { new: true }
    ).populate('worker', 'name phone email skills experience');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    logger.info(`Application status updated for job: ${job.title}`);
    
    // Return updated job with applications
    const applications = await JobApplication.find({ job: req.params.id })
      .populate('worker', 'name phone email skills experience');
    
    res.json({
      ...job.toObject(),
      applications: applications
    });
  } catch (error) {
    logger.error('Error updating application status', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message });
  }
});

// Complete a job - Enhanced
router.patch('/:id/complete', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = 'completed';
    job.completedAt = new Date();
    job.updatedAt = new Date();
    
    await job.save();
    
    logger.info(`Job ${job.title} manually marked as completed`);

    res.json({
      success: true,
      message: 'Job marked as completed',
      job: job
    });
  } catch (error) {
    logger.error('Error completing job', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message });
  }
});

// Accept a job (worker applies for a job)
router.post('/accept', async (req, res) => {
  try {
    const { jobId, workerId } = req.body;

    if (!jobId || !workerId) {
      return res.status(400).json({ message: 'Job ID and Worker ID are required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const jobApplication = new JobApplication({
      jobId,
      workerId,
      employerId: job.employer,
      status: 'pending'
    });

    await jobApplication.save();

    logger.info(`Worker ${worker.name} accepted job: ${job.title}`);
    res.status(201).json({ message: 'Job application submitted successfully' });
  } catch (error) {
    logger.error('Error accepting job', { error: error.message, stack: error.stack });
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }
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
    job.workerDetails = workerDetails;
    job.updatedAt = new Date();

    await job.save();

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

    logger.info(`Job status updated: ${job.title}`);
    res.json(job);
  } catch (error) {
    logger.error('Error updating job status', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const applications = await JobApplication.find({ job: jobId });
    
    if (applications.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete job with existing applications. Please contact workers first.' 
      });
    }
    
    if (job.employer) {
      await Employer.findByIdAndUpdate(
        job.employer,
        { $pull: { postedJobs: jobId } }
      );
    }
    
    await Job.findByIdAndDelete(jobId);
    
    logger.info(`Job deleted successfully: ${jobId}`);
    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
    
  } catch (error) {
    logger.error('Error deleting job', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;