const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const JobMatchingService = require('../services/JobMatchingService');
const NotificationService = require('../services/NotificationService');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');
const logger = require('../config/logger');
const { 
  asyncHandler, 
  validateRequired, 
  ValidationError, 
  NotFoundError, 
  BusinessLogicError,
  createSuccessResponse,
  createPaginatedResponse
} = require('../middleware/errorHandler');

// Test endpoint to confirm backend connectivity for job creation
router.post('/initiate-creation', async (req, res) => {
  console.log('🎉 Job creation initiated!');
  logger.info('🎉 Job creation initiated!');
  
  res.json({ 
    success: true, 
    message: 'Job creation initiated successfully!' 
  });
});

// Get jobs with dual status system information
router.get('/dual-status', asyncHandler(async (req, res) => {
  const { workerId, employerId, category, status } = req.query;
  
  logger.info('📊 Fetching jobs with dual status system', { workerId, employerId, category, status });
  
  let query = {};
  
  // Filter by category if provided
  if (category) {
    query.category = category;
  }
  
  // Filter by status if provided (can be workerStatus, employerStatus, or legacy status)
  if (status) {
    if (['active', 'applied', 'accepted', 'got paid'].includes(status)) {
      query.workerStatus = status;
    } else if (['active', 'accepted', 'paid'].includes(status)) {
      query.employerStatus = status;
    } else {
      query.status = status; // Legacy status
    }
  }
  
  // Filter by employer if provided
  if (employerId) {
    query.employer = employerId;
  }
  
  const jobs = await Job.find(query)
    .populate('employer', 'name companyName')
    .sort({ createdAt: -1 })
    .limit(50);
  
  // Enhance jobs with application information if workerId is provided
  let enhancedJobs = jobs;
  if (workerId) {
    const jobIds = jobs.map(job => job._id);
    const applications = await JobApplication.find({
      job: { $in: jobIds },
      worker: workerId
    });
    
    const applicationMap = {};
    applications.forEach(app => {
      applicationMap[app.job.toString()] = app;
    });
    
    enhancedJobs = jobs.map(job => {
      const jobObj = job.toObject();
      const application = applicationMap[job._id.toString()];
      
      // Map application status to dual status system
      let workerStatus = jobObj.workerStatus || 'active';
      let employerStatus = jobObj.employerStatus || 'active';
      
      if (application) {
        // Worker has applied, so worker status is 'applied'
        workerStatus = 'applied';
        
        // Map application status to employer status
        switch (application.status) {
          case 'pending':
            employerStatus = 'active'; // Employer reviewing
            break;
          case 'accepted':
          case 'in-progress':
            employerStatus = 'accepted'; // Employer accepted worker
            break;
          case 'completed':
            if (application.paymentStatus === 'paid') {
              workerStatus = 'got paid'; // Worker got paid
              employerStatus = 'paid'; // Employer paid
            } else {
              workerStatus = 'accepted'; // Work completed, waiting for payment
              employerStatus = 'accepted';
            }
            break;
          case 'rejected':
          case 'cancelled':
            workerStatus = 'applied'; // Keep as applied for history
            employerStatus = 'active'; // Back to active for employer
            break;
        }
      }
      
      return {
        ...jobObj,
        // Dual status information
        workerStatus,
        employerStatus,
        // Legacy fields for backward compatibility
        applicationStatus: application ? application.status : null,
        applicationId: application ? application._id : null,
        appliedAt: application ? application.createdAt : null,
        hasApplied: !!application,
        // Include job reference for progress tracking
        job: jobObj
      };
    });
  }
  
  logger.info(`📋 Found ${enhancedJobs.length} jobs with dual status`);
  
  res.json({
    success: true,
    jobs: enhancedJobs,
    count: enhancedJobs.length,
    statusInfo: {
      workerStatuses: ['active', 'applied', 'accepted', 'got paid'],
      employerStatuses: ['active', 'accepted', 'paid'],
      legacyStatuses: ['active', 'in-progress', 'completed', 'cancelled']
    }
  });
}));

// Create a new job
router.post('/', asyncHandler(async (req, res) => {
  logger.info('New job posting attempt', { 
    employer: req.body.employer, 
    title: req.body.title,
    body: req.body 
  });
  
    // Validate required fields
  validateRequired(req.body, ['title', 'employer']);

  // Check for duplicate job posting (relaxed timing)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingJob = await Job.findOne({
    title: req.body.title,
    employer: req.body.employer,
    'location.city': req.body.location?.city,
    createdAt: { $gt: fiveMinutesAgo }
  });
  
  if (existingJob) {
    logger.warn('Duplicate job submission detected', { 
      existingJobId: existingJob._id,
      newJobTitle: req.body.title 
    });
    throw new BusinessLogicError('A similar job was already posted in the last 5 minutes', 'DUPLICATE_JOB');
  }
  
  // Verify employer exists
  const employer = await Employer.findById(req.body.employer);
  if (!employer) {
    logger.error('Employer not found', { employerId: req.body.employer });
    throw new NotFoundError('Employer');
  }
  
  // Create the job with proper defaults
  const jobData = {
    title: req.body.title,
    description: req.body.description || 'Job description to be provided',
    category: req.body.category || 'General',
    salary: req.body.salary || 15000,
    employer: req.body.employer,
    companyName: req.body.companyName || employer.companyName || employer.name,
    location: {
      type: req.body.location?.type || 'onsite',
      street: req.body.location?.street || '',
      city: req.body.location?.city || '',
      state: req.body.location?.state || '',
      pincode: req.body.location?.pincode || ''
    },
    employmentType: req.body.employmentType || 'Full-time',
    skillsRequired: req.body.skillsRequired || [],
    requirements: req.body.requirements || 'Basic requirements apply',
    status: req.body.status || 'active',
    urgency: req.body.urgency || 'Normal',
    startDate: req.body.startDate,
    endDate: req.body.endDate
  };
  
  logger.info('Creating job with data:', jobData);
  
  const job = new Job(jobData);
  await job.save();
  
  // Update employer's posted jobs list
  try {
    await Employer.findByIdAndUpdate(
      req.body.employer,
      { $push: { postedJobs: job._id } },
      { new: true }
    );
    logger.info('Updated employer posted jobs list');
  } catch (employerError) {
    logger.error('Error updating employer after job creation', { 
      error: employerError.message, 
      stack: employerError.stack,
      employerId: req.body.employer,
      jobId: job._id
    });
    // Don't fail the whole request if employer update fails
  }
  
  logger.info(`Job posted successfully: ${job.title}`, { jobId: job._id });
  
  res.status(201).json(createSuccessResponse(job, 'Job posted successfully', 201));
}));

// Get all jobs (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, location, skills, workerId, category, minSalary, employmentType } = req.query;
    const query = {};

    // --- LOGGING ---
    const logColor = '\x1b[36m'; // Cyan
    const resetColor = '\x1b[0m';
    console.log(`${logColor}[API] [GET] /api/jobs [workerId=${workerId || 'N/A'}] [status=${status}] [location=${location}] [category=${category}] [minSalary=${minSalary}] [employmentType=${employmentType}]${resetColor}`);
    // --- END LOGGING ---

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

    // Log the incoming request for debugging
    logger.info('Job count request', { 
      workerId,
      status,
      location,
      category,
      minSalary,
      employmentType 
    });

    // Status handling - ensure it's consistent with the main jobs endpoint
    if (status && status !== 'active,in-progress') {
      query.status = status;
    } else {
      // Default to active and in-progress jobs
      query.status = { $in: ['active', 'in-progress'] };
    }

    // Apply filters
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (employmentType) {
      query.employmentType = { $regex: employmentType, $options: 'i' };
    }

    if (minSalary && !isNaN(minSalary)) {
      query.salary = { $gte: parseInt(minSalary, 10) };
    }

    if (location) {
      query.$or = [
        { 'location.state': { $regex: location, $options: 'i' } },
        { 'location.city': { $regex: location, $options: 'i' } }
      ];
    }

    // If workerId is provided, we need to exclude jobs they've already completed
    if (workerId) {
      try {
        // Find all jobs this worker has completed
        const completedJobs = await JobApplication.aggregate([
          {
            $match: {
              worker: new mongoose.Types.ObjectId(workerId),
              status: 'completed'
            }
          },
          {
            $group: {
              _id: '$job'
            }
          }
        ]);

        const completedJobIds = completedJobs.map(job => job._id);
        
        if (completedJobIds.length > 0) {
          // Exclude completed jobs from the count
          query._id = { $nin: completedJobIds };
        }
      } catch (error) {
        logger.error('Error filtering completed jobs', { 
          error: error.message, 
          stack: error.stack,
          workerId 
        });
        // Continue with the original query if there's an error
      }
    }

    // Get the final count
    const count = await Job.countDocuments(query);
    
    logger.info('Job count result', { 
      count,
      workerId,
      status: query.status,
      filterCount: Object.keys(query).length
    });
    
    res.json({
      success: true,
      count: count,
      filters: req.query,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting job count', { 
      error: error.message, 
      stack: error.stack,
      query: req.query 
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to get job count',
      count: 0,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
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
    if (workerId) {
      try {
        const completedApplications = await JobApplication.find({
          worker: workerId,
          status: 'completed'
        }).select('job');
        
        // Filter and validate job IDs
        const validJobIds = completedApplications
          .map(app => {
            try {
              // Handle corrupted data where job might be a string or object
              if (app.job && typeof app.job === 'object' && app.job._id) {
                return app.job._id;
              } else if (app.job && typeof app.job === 'string' && app.job.match(/^[0-9a-fA-F]{24}$/)) {
                return app.job;
              }
              return null;
            } catch (e) {
              logger.warn(`Invalid job ID in application ${app._id}: ${e.message}`);
              return null;
            }
          })
          .filter(Boolean); // Remove null values
        
        if (validJobIds.length > 0) {
          query._id = { $nin: validJobIds };
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
    
    const applications = await JobApplication.find({ worker: workerId })
      .populate('job')
      .populate('employer', 'name companyName')
      .sort({ createdAt: -1 });

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
    
    const applications = await JobApplication.find({ employer: employerId })
      .populate('job')
      .populate('worker', 'name skills experience_years')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    logger.error('Error fetching job applications', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
});

// Get applications for a specific job - MUST be before /:id route
router.get('/:jobId/applications', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Validate ObjectId format
    if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Find all applications for this job
    const applications = await JobApplication.find({ job: jobId })
      .populate('worker', 'name email phone skills experience_years')
      .populate('employer', 'name companyName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
    
  } catch (error) {
    logger.error('Error fetching job applications', { 
      error: error.message, 
      stack: error.stack,
      jobId: req.params.jobId 
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

// Enhanced job status update endpoint
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updatedBy, timestamp, reason } = req.body;
    
    console.log(`🔄 Updating job ${id} status to: ${status}`);
    
    // Validate status
    const validStatuses = ['active', 'in-progress', 'completed', 'paused', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // Get current job
    const currentJob = await Job.findById(id);
    if (!currentJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Validate status transitions
    const validTransitions = {
      'active': ['in-progress', 'paused', 'cancelled'],
      'in-progress': ['completed', 'paused', 'cancelled'],
      'completed': [], // Terminal state
      'paused': ['active', 'cancelled'],
      'cancelled': [] // Terminal state
    };
    
    const currentStatus = currentJob.status;
    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }
    
    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date(),
      ...(status === 'completed' && { completedAt: new Date() }),
      ...(status === 'paused' && { pausedAt: new Date() })
    };
    
    // Update job
    const updatedJob = await Job.findByIdAndUpdate(id, updateData, { new: true });
    
    console.log(`✅ Job ${id} status updated from ${currentStatus} to ${status}`);
    
    res.json({
      success: true,
      message: `Job status updated to ${status}`,
      data: updatedJob,
      statusTransition: {
        from: currentStatus,
        to: status,
        timestamp: new Date().toISOString(),
        reason: reason || 'Manual update'
      }
    });
  } catch (error) {
    console.error('❌ Error updating job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job status',
      error: error.message
    });
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