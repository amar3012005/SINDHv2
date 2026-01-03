const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const JobMatchingService = require('../services/JobMatchingService');
const NotificationService = require('../services/notificationService');
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

  logger.info('📊 Fetching jobs with dual status system', { 
    workerId: workerId || 'none', 
    employerId: employerId || 'none', 
    category: category || 'any', 
    status: status || 'all' 
  });

  let query = {};

  // Filter by category if provided
  if (category && category !== 'undefined') {
    query.category = category;
  }

  // Filter by status if provided
  if (status && status !== 'undefined') {
    if (['active', 'applied', 'accepted', 'got paid'].includes(status)) {
      query.workerStatus = status;
    } else if (['active', 'accepted', 'paid'].includes(status)) {
      query.employerStatus = status;
    } else {
      query.status = status;
    }
  }

  // Filter by employer if provided
  if (employerId && employerId !== 'undefined' && employerId !== 'null' && employerId.match(/^[0-9a-fA-F]{24}$/)) {
    query.employer = employerId;
  }

  const jobs = await Job.find(query)
    .populate('employer', 'name companyName')
    .sort({ createdAt: -1 })
    .limit(50);

  // Enhance jobs with application information if workerId is provided
  let enhancedJobs = [];
  try {
    if (workerId && workerId !== 'null' && workerId !== 'undefined' && workerId.match(/^[0-9a-fA-F]{24}$/)) {
      const jobIds = jobs.map(job => job._id);
      const applications = await JobApplication.find({
        job: { $in: jobIds },
        worker: workerId
      });

      logger.info(`🔍 Found ${applications.length} applications for worker ${workerId} across ${jobIds.length} jobs`);

      const applicationMap = {};
      applications.forEach(app => {
        if (app && app.job) {
          applicationMap[app.job.toString()] = app;
        }
      });

      // Get actual applicant counts for all jobs by counting JobApplication documents
      const applicantCounts = await JobApplication.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: '$job', count: { $sum: 1 } } }
      ]);

      const countMap = {};
      applicantCounts.forEach(item => {
        if (item && item._id) {
          countMap[item._id.toString()] = item.count;
        }
      });

      enhancedJobs = jobs.map(job => {
        if (!job) return null;
        const jobObj = job.toObject();
        const application = applicationMap[job._id.toString()];

        // Get real applicant count from database
        const realApplicantCount = countMap[job._id.toString()] || 0;

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
          applicantCount: realApplicantCount,
          workerStatus,
          employerStatus,
          applicationStatus: application ? application.status : null,
          applicationId: application ? application._id : null,
          appliedAt: application ? application.createdAt : null,
          hasApplied: !!application
        };
      }).filter(Boolean);
    } else {
      // No workerId - still calculate real applicant counts
      const jobIds = jobs.map(job => job._id);
      
      const applicantCounts = jobIds.length > 0 ? await JobApplication.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: '$job', count: { $sum: 1 } } }
      ]) : [];

      const countMap = {};
      applicantCounts.forEach(item => {
        if (item && item._id) {
          countMap[item._id.toString()] = item.count;
        }
      });

      enhancedJobs = jobs.map(job => {
        if (!job) return null;
        const jobObj = job.toObject();
        return {
          ...jobObj,
          applicantCount: countMap[job._id.toString()] || 0
        };
      }).filter(Boolean);
    }
  } catch (error) {
    logger.error('Error enhancing jobs with dual status:', error);
    // Fallback to basic jobs if enhancement fails
    enhancedJobs = jobs.map(j => j ? j.toObject() : null).filter(Boolean);
  }

  logger.info(`📋 Found ${enhancedJobs.length} jobs with dual status`);

  // Check for duplicates in response
  const jobIds = enhancedJobs.map(j => j._id.toString());
  const uniqueIds = new Set(jobIds);
  if (jobIds.length !== uniqueIds.size) {
    logger.warn(`⚠️ DUPLICATE JOBS DETECTED! Total: ${jobIds.length}, Unique: ${uniqueIds.size}`);
  }

  // Log applicant counts for debugging
  enhancedJobs.forEach(job => {
    logger.info(`Job ${job._id}: ${job.applicantCount} applicants`);
  });

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

  // Verify employer exists in Firestore
  const employerDoc = await db.collection('employers').doc(req.body.employer).get();
  if (!employerDoc.exists) {
    logger.error('Employer not found in Firestore', { employerId: req.body.employer });
    throw new NotFoundError('Employer');
  }
  const employer = employerDoc.data();

  // Validate coordinates if present (validation logic skipped for brevity, reuse if needed)
  
  // Create the job with proper defaults and denormalized snippets
  const targetId = (new mongoose.Types.ObjectId()).toString();
  const jobData = {
    title: req.body.title,
    description: req.body.description || 'Job description to be provided',
    category: req.body.category || 'General',
    salary: req.body.baseAmount || req.body.salary || 0,
    baseAmount: req.body.baseAmount || req.body.salary || 0,
    employer: req.body.employer,
    companyName: req.body.companyName || employer.company?.name || employer.name,
    // Denormalized employer snippet
    employerSnippet: {
      name: employer.name,
      companyName: employer.company?.name || employer.name,
      rating: employer.rating?.average || 0,
      profilePicture: employer.profilePicture || ''
    },
    location: {
      type: req.body.location?.type || 'onsite',
      street: req.body.location?.street || '',
      city: req.body.location?.city || '',
      state: req.body.location?.state || '',
      pincode: req.body.location?.pincode || '',
      ...(req.body.location?.coordinates && {
        coordinates: {
          type: 'Point',
          coordinates: req.body.location.coordinates // [lng, lat]
        }
      })
    },
    employmentType: req.body.employmentType || 'Full-time',
    skillsRequired: req.body.skillsRequired || [],
    requirements: req.body.requirements || 'Basic requirements apply',
    status: 'POSTED',
    urgency: req.body.urgency || 'Normal',
    startDate: req.body.startDate || new Date(),
    endDate: req.body.endDate || new Date(Date.now() + 86400000),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  logger.info('Creating job in Firestore:', jobData);

  await db.collection('jobs').doc(targetId).set(jobData);

  // Update employer's posted jobs list in Firestore (Background)
  db.collection('employers').doc(req.body.employer).update({
    postedJobs: admin.firestore.FieldValue.arrayUnion(targetId)
  }).catch(err => logger.warn(`⚠️ Failed to update employer postedJobs in Firestore: ${err.message}`));

  logger.info(`Job posted successfully in Firestore: ${jobData.title}`, { jobId: targetId });

  res.status(201).json(createSuccessResponse({ ...jobData, id: targetId, _id: targetId }, 'Job posted successfully', 201));
}));

// Get all jobs (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, location, workerId, category, minSalary, employmentType } = req.query;
    
    // --- LOGGING ---
    const logColor = '\x1b[36m'; // Cyan
    const resetColor = '\x1b[0m';
    console.log(`${logColor}[API] [GET] /api/jobs (Firestore) [workerId=${workerId || 'N/A'}] [status=${status}] [location=${location}] [category=${category}]${resetColor}`);
    
    const jobsRef = db.collection('jobs');
    
    // Status handling
    let statuses = ['active', 'POSTED', 'APPLIED', 'in-progress'];
    if (status && status !== 'active,in-progress') {
      statuses = [status];
    }
    
    let query = jobsRef.where('status', 'in', statuses);
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.get();
    let jobs = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      _id: doc.id
    }));

    // In-memory filters
    if (location) {
      const locLower = location.toLowerCase();
      jobs = jobs.filter(job => 
        (job.location?.state?.toLowerCase().includes(locLower)) ||
        (job.location?.city?.toLowerCase().includes(locLower)) ||
        (job.location?.village?.toLowerCase().includes(locLower)) ||
        (job.location?.address?.toLowerCase().includes(locLower))
      );
    }

    if (minSalary) {
      jobs = jobs.filter(job => (job.salary || job.baseAmount || 0) >= parseInt(minSalary));
    }

    if (employmentType) {
      jobs = jobs.filter(job => job.employmentType === employmentType);
    }

    // Exclude completed jobs for worker
    if (workerId) {
      const completedAppsSnapshot = await db.collection('applications')
        .where('worker', '==', workerId)
        .where('status', '==', 'completed')
        .get();
      
      const completedJobIds = completedAppsSnapshot.docs.map(doc => doc.data().job);
      jobs = jobs.filter(job => !completedJobIds.includes(job.id));
    }

    // Sort by createdAt descending
    jobs.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    res.status(200).json(jobs);

  } catch (error) {
    logger.error('Error fetching jobs from Firestore:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message,
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

// Get list of unique cities with job counts
router.get('/cities', asyncHandler(async (req, res) => {
  const { status = 'active' } = req.query;

  logger.info(`Getting cities list for status: ${status}`);

  // Aggregate to get unique cities with job counts
  const cities = await Job.aggregate([
    { $match: { status: { $in: [status, 'in-progress'] } } },
    {
      $group: {
        _id: '$location.city',
        count: { $sum: 1 },
        state: { $first: '$location.state' }
      }
    },
    { $match: { _id: { $ne: null, $ne: '' } } },
    { $sort: { count: -1 } },
    {
      $project: {
        city: '$_id',
        state: 1,
        count: 1,
        _id: 0
      }
    }
  ]);

  logger.info(`Found ${cities.length} cities with active jobs`);

  res.json({
    success: true,
    cities: cities,
    count: cities.length
  });
}));

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
      .sort({ createdAt: -1 })
      .lean();

    // Fetch accepted applications for these jobs
    const jobIds = jobs.map(j => j._id);
    const acceptedApplications = await JobApplication.find({
      job: { $in: jobIds },
      status: { $in: ['accepted', 'working', 'WORKING'] }
    }).select('_id job');

    const appMap = {};
    acceptedApplications.forEach(app => {
      appMap[app.job.toString()] = app._id;
    });

    const enhancedJobs = jobs.map(job => ({
      ...job,
      acceptedApplicationId: appMap[job._id.toString()] || null
    }));

    res.json(enhancedJobs);

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

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching job by ID from Firestore: ${id}`);

    const jobDoc = await db.collection('jobs').doc(id).get();

    if (!jobDoc.exists) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const jobData = jobDoc.data();

    // Fetch applications separately from applications collection
    const applicationsSnapshot = await db.collection('applications')
      .where('job', '==', id)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      _id: doc.id
    })).sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    res.json({
      ...jobData,
      id: jobDoc.id,
      _id: jobDoc.id,
      applications: applications
    });
  } catch (error) {
    logger.error(`Error fetching job by ID from Firestore: ${req.params.id}`, error);
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