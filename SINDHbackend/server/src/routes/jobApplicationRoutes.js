const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const NotificationService = require('../services/NotificationService');
const logger = require('../config/logger');
const { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  AuthenticationError,
  asyncHandler 
} = require('../middleware/errorHandler');

// Apply for a job
router.post('/apply', asyncHandler(async (req, res) => {
  logger.info('🎯 Job application request received');
  logger.info('📝 Request body:', req.body);
  logger.info('📝 Request headers:', req.headers);
  
  const { jobId, workerId, workerDetails } = req.body;

  if (!jobId || !workerId) {
    logger.warn('Missing required fields for job application', { jobId: !!jobId, workerId: !!workerId });
    throw new ValidationError('Job ID and Worker ID are required');
  }

  const job = await Job.findById(jobId).populate('employer');
  if (!job) {
    logger.warn(`Job not found for application: ${jobId}`);
    throw new NotFoundError('Job not found');
  }

  logger.info(`Job ${jobId} current status: ${job.status}`);

  if (job.status !== 'active') {
    logger.warn(`Job not active for application: ${job.status}`);
    throw new ValidationError('Job is no longer accepting applications');
  }

  // If job is active, set to in-progress on first application
  if (job.status === 'active') {
    logger.info(`Updating job ${jobId} status from 'active' to 'in-progress'`);
    logger.info(`Job before update:`, { id: job._id, status: job.status, title: job.title });
    job.status = 'in-progress';
    await job.save();
    logger.info(`Job ${jobId} status updated successfully to 'in-progress'`);
    logger.info(`Job after update:`, { id: job._id, status: job.status, title: job.title });
    
    // Verify the job was actually updated in the database
    const updatedJob = await Job.findById(jobId);
    logger.info(`Job verification from database:`, { 
      id: updatedJob._id, 
      status: updatedJob.status, 
      title: updatedJob.title 
    });
  } else {
    logger.info(`Job ${jobId} status is already '${job.status}', not updating`);
  }

  // Check if job has reached maximum applications (optional limit)
  const existingApplicationsCount = await JobApplication.countDocuments({ job: jobId });
  if (existingApplicationsCount >= 50) { // Optional: limit applications per job
    logger.warn(`Job ${jobId} has reached maximum applications`);
    throw new ValidationError('This job has received maximum applications');
  }

    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      logger.warn(`Worker not found in database for ID: ${workerId}. Proceeding with workerDetails from request.`);
      
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        logger.warn(`Invalid ObjectId format for workerId: ${workerId}`);
        throw new ValidationError('Invalid worker ID format');
      }
      
      const sanitizedWorkerDetails = {
        name: workerDetails?.name || 'Unknown Worker',
        phone: workerDetails?.phone || '',
        email: workerDetails?.email || '',
        skills: workerDetails?.skills || [],
        experience: workerDetails?.experience || '',
        location: workerDetails?.location || {},
        rating: typeof workerDetails?.rating === 'object' 
          ? (workerDetails.rating.average || 0) 
          : (workerDetails?.rating || 0)
      };

      const employerId = job.employer?._id || job.employer || '000000000000000000000000';

          const applicationData = {
      job: jobId,
      worker: workerId,
      employer: employerId,
      status: 'pending',
      workerDetails: sanitizedWorkerDetails,
      appliedAt: new Date(),
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        note: 'Application submitted successfully'
      }]
    };

      const application = new JobApplication(applicationData);
      await application.save();
      logger.info(`Application saved successfully (worker not in DB): ${application._id}`);

      await application.populate('job');

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application,
        note: 'Worker not found in database but application created with provided details'
      });
    }

    const existingApplication = await JobApplication.findOne({
      job: jobId,
      worker: workerId
    });

    if (existingApplication) {
      logger.warn(`Worker ${workerId} already applied for job ${jobId}`);
      throw new ValidationError('You have already applied for this job');
    }

    const employerId = job.employer?._id || job.employer || '000000000000000000000000';

    const sanitizedWorkerDetails = {
      name: workerDetails?.name || worker.name || 'Unknown',
      phone: workerDetails?.phone || worker.phone || '',
      email: workerDetails?.email || worker.email || '',
      skills: workerDetails?.skills || worker.skills || [],
      experience: workerDetails?.experience || worker.experience || '',
      location: workerDetails?.location || worker.location || {},
      rating: typeof workerDetails?.rating === 'object' 
        ? (workerDetails.rating.average || 0) 
        : (workerDetails?.rating || worker.rating?.average || 0)
    };

    const applicationData = {
      job: jobId,
      worker: workerId,
      employer: employerId,
      status: 'pending',
      workerDetails: sanitizedWorkerDetails,
      appliedAt: new Date(),
      statusHistory: [{
        status: 'pending',
        changedAt: new Date(),
        note: 'Application submitted successfully'
      }]
    };

    const application = new JobApplication(applicationData);
    await application.save();
    logger.info(`Application saved successfully: ${application._id}`);
    logger.info(`Application details:`, {
      id: application._id,
      jobId: application.job,
      workerId: application.worker,
      employerId: application.employer,
      status: application.status,
      createdAt: application.createdAt
    });

    await application.populate(['job', 'worker']);

    let employer = null;
    if (job.employer) {
      try {
        employer = await Employer.findById(job.employer);
      } catch (empError) {
        logger.warn(`Could not fetch employer details for job ${job.employer}: ${empError.message}`);
      }
    }

    if (employer) {
      try {
        await NotificationService.notifyNewApplication(
          application, 
          application.job, 
          application.worker, 
          employer
        );
        logger.info('New application notification sent to employer');
      } catch (notificationError) {
        logger.error('Error sending notification:', notificationError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
      jobStatusUpdated: job.status === 'in-progress',
      jobStatus: job.status
    });
}));

// Create a new job application (simplified, assuming 'apply' is the main one)
router.post('/', asyncHandler(async (req, res) => {
  logger.info('Creating new job application (simplified endpoint)');
  
  const { job, worker, employer, workerDetails } = req.body;
  
  const existingApplication = await JobApplication.findOne({
    job: job,
    worker: worker
  });
  
  if (existingApplication) {
    logger.warn(`Worker ${worker} already applied for job ${job} via simplified endpoint`);
    throw new ValidationError('You have already applied for this job');
  }
  
  const application = new JobApplication({
    job: job,
    worker: worker,
    employer: employer,
    status: 'pending',
    paymentStatus: 'pending',
    workerDetails: workerDetails || {},
    applicationDetails: {
      appliedAt: new Date()
    },
    statusHistory: [{
      status: 'pending',
      changedAt: new Date(),
      note: 'Application submitted'
    }]
  });
  
  await application.save();
  logger.info(`Job application created successfully (simplified): ${application._id}`);
  
  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    application: application
  });
}));

// Get applications by employer ID
router.get('/employer/:employerId', asyncHandler(async (req, res) => {
  const { employerId } = req.params;
  const { status } = req.query;

  console.log(`[API] [GET] /api/job-applications/employer/${employerId} [status=${status}]`);
  logger.info(`Fetching applications for employer: ${employerId}`);

  const query = { employer: employerId };
  if (status) {
    query.status = status;
  }

  const applications = await JobApplication.find(query)
    .populate('worker', 'name phone skills rating')
    .populate('job', 'title description salary location')
    .sort({ createdAt: -1 });

  console.log(`Found ${applications.length} applications for employer ${employerId}`);
  
  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
}));

// Get applications by job ID
router.get('/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { status } = req.query;

  console.log(`[API] [GET] /api/job-applications/job/${jobId} [status=${status}]`);
  logger.info(`Fetching applications for job: ${jobId}`);

  const query = { job: jobId };
  if (status) {
    query.status = status;
  }

  const applications = await JobApplication.find(query)
    .populate('worker', 'name phone skills rating')
    .populate('job', 'title description salary location')
    .sort({ createdAt: -1 });

  console.log(`Found ${applications.length} applications for job ${jobId}`);
  
  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
}));

// Get a specific application by ID
router.get('/:applicationId', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  // --- LOGGING ---
  const logColor = '\x1b[34m'; // Blue
  const resetColor = '\x1b[0m';
  console.log(`${logColor}[API] [GET] /api/job-applications/${applicationId} [applicationId=${applicationId}]${resetColor}`);
  // --- END LOGGING ---

  logger.info(`Fetching application by ID: ${applicationId}`);

  const application = await JobApplication.findById(applicationId)
    .populate('job')
    .populate('worker')
    .populate('employer');

  if (!application) {
    logger.warn(`Application not found: ${applicationId}`);
    throw new NotFoundError('Application not found');
  }

  // Transform the application to a frontend-friendly format
  const transformedApplication = {
    _id: application._id.toString(),
    status: application.status,
    appliedAt: application.appliedAt || application.createdAt || application.applicationDetails?.appliedAt,
    job: application.job ? {
      _id: application.job._id.toString(),
      title: application.job.title || 'Job Title Not Available',
      companyName: application.job.companyName || application.job.company || 'Company Not Available',
      location: application.job.location || { city: 'Not Available', state: 'Not Available' },
      salary: application.job.salary || 'Salary Not Specified',
      category: application.job.category || 'General',
      employmentType: application.job.employmentType || 'Full-time',
      description: application.job.description || 'No description available'
    } : {
      _id: 'unknown',
      title: 'Job Title Not Available',
      companyName: 'Company Not Available',
      location: { city: 'Not Available', state: 'Not Available' },
      salary: 'Salary Not Specified',
      category: 'General',
      employmentType: 'Full-time',
      description: 'No description available'
    },
    worker: application.worker ? {
      _id: application.worker._id.toString(),
      name: application.worker.name || application.workerDetails?.name || 'Unknown Worker',
      phone: application.worker.phone || application.workerDetails?.phone || '',
      skills: application.worker.skills || application.workerDetails?.skills || []
    } : {
      _id: 'unknown',
      name: application.workerDetails?.name || 'Unknown Worker',
      phone: application.workerDetails?.phone || '',
      skills: application.workerDetails?.skills || []
    },
    employer: application.employer ? {
      _id: application.employer._id.toString(),
      name: application.employer.name || 'Unknown Employer',
      companyName: application.employer.companyName || application.employer.company || 'Unknown Company'
    } : {
      _id: 'unknown',
      name: 'Unknown Employer',
      companyName: 'Unknown Company'
    },
    paymentStatus: application.paymentStatus || 'pending',
    paymentAmount: application.paymentAmount || 0,
    statusHistory: application.statusHistory || []
  };

  logger.info(`Successfully fetched application: ${applicationId}`);

  res.json({
    success: true,
    data: transformedApplication
  });
}));

// Get worker's current applications
router.get('/worker/:workerId/current', asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  // --- LOGGING ---
  const logColor = '\x1b[35m'; // Magenta
  const resetColor = '\x1b[0m';
  console.log(`${logColor}[API] [GET] /api/job-applications/worker/${workerId}/current [workerId=${workerId}]${resetColor}`);
  // --- END LOGGING ---

  logger.info(`Fetching current applications for worker: ${workerId}`);

  const applications = await JobApplication.find({ 
    worker: workerId,
    status: { $in: ['pending', 'accepted', 'in-progress'] }
  })
  .populate('job')
  .populate('worker')
  .sort({ appliedAt: -1 });

  logger.info(`Found ${applications.length} current applications for worker ${workerId}`);

  // Transform the applications to a frontend-friendly format
  const transformedApplications = applications.map(app => {
    try {
      logger.info(`Transforming application: ${app._id}`);
      logger.info(`Original app data:`, {
        _id: app._id,
        status: app.status,
        job: app.job ? 'exists' : 'null',
        worker: app.worker ? 'exists' : 'null',
        employer: app.employer ? 'exists' : 'null'
      });
      
      const transformed = {
        _id: app._id.toString(),
        status: app.status,
        appliedAt: app.appliedAt || app.createdAt || app.applicationDetails?.appliedAt,
        job: app.job ? {
          _id: app.job._id.toString(),
          title: app.job.title || 'Job Title Not Available',
          companyName: app.job.companyName || app.job.company || 'Company Not Available',
          location: app.job.location || { city: 'Not Available', state: 'Not Available' },
          salary: app.job.salary || 'Salary Not Specified',
          category: app.job.category || 'General',
          employmentType: app.job.employmentType || 'Full-time',
          description: app.job.description || 'No description available'
        } : {
          _id: 'unknown',
          title: 'Job Title Not Available',
          companyName: 'Company Not Available',
          location: { city: 'Not Available', state: 'Not Available' },
          salary: 'Salary Not Specified',
          category: 'General',
          employmentType: 'Full-time',
          description: 'No description available'
        },
        worker: app.worker ? {
          _id: app.worker._id.toString(),
          name: app.worker.name || app.workerDetails?.name || 'Unknown Worker',
          phone: app.worker.phone || app.workerDetails?.phone || '',
          skills: app.worker.skills || app.workerDetails?.skills || []
        } : {
          _id: 'unknown',
          name: app.workerDetails?.name || 'Unknown Worker',
          phone: app.workerDetails?.phone || '',
          skills: app.workerDetails?.skills || []
        },
        employer: app.employer ? {
          _id: app.employer._id.toString(),
          name: app.employer.name || 'Unknown Employer',
          companyName: app.employer.companyName || app.employer.company || 'Unknown Company'
        } : {
          _id: 'unknown',
          name: 'Unknown Employer',
          companyName: 'Unknown Company'
        },
        paymentStatus: app.paymentStatus || 'pending',
        paymentAmount: app.paymentAmount || 0,
        statusHistory: app.statusHistory || []
      };
      
      logger.info(`Transformed application:`, {
        _id: transformed._id,
        status: transformed.status,
        jobTitle: transformed.job.title,
        jobCompany: transformed.job.companyName
      });
      
      return transformed;
    } catch (transformError) {
      logger.error('Error transforming application data:', { 
        error: transformError.message, 
        applicationId: app._id,
        stack: transformError.stack
      });
      return null;
    }
  }).filter(Boolean); // Remove any null entries

  logger.info(`Successfully processed ${transformedApplications.length} valid current applications`);

  res.json({
    success: true,
    data: transformedApplications,
    count: transformedApplications.length
  });
}));

// Get worker's completed applications (Past Jobs)
router.get('/worker/:workerId/completed', asyncHandler(async (req, res) => {
  const { workerId } = req.params;
  
  logger.info(`Fetching completed applications for worker: ${workerId}`);
  
  const completedApplications = await JobApplication.find({
    worker: workerId,
    status: 'completed'
  })
  .populate('job')
  .populate('employer', 'name company companyName')
  .sort({ updatedAt: -1 });

  logger.info(`Found ${completedApplications.length} completed applications for worker ${workerId}`);

  // Filter out applications with null/invalid jobs and safely transform the data
  const validApplications = completedApplications.filter(app => {
    if (!app.job) {
      logger.warn(`Application ${app._id} has null job reference, skipping`);
      return false;
    }
    
    // Check if job is a valid populated object
    if (typeof app.job === 'object' && app.job._id) {
      return true;
    }
    
    // Check if job is a valid ObjectId string
    if (typeof app.job === 'string' && app.job.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn(`Application ${app._id} has unpopulated job reference: ${app.job}`);
      return false; // Skip unpopulated references for now
    }
    
    logger.warn(`Application ${app._id} has invalid job data type: ${typeof app.job}`);
    return false;
  });

  const transformedData = validApplications.map(app => {
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
    } catch (transformError) {
      logger.error('Error transforming application data:', { 
        error: transformError.message, 
        applicationId: app._id 
      });
      return null;
    }
  }).filter(Boolean); // Remove any null entries

  logger.info(`Successfully processed ${transformedData.length} valid completed applications`);

  res.json({
    success: true,
    count: transformedData.length,
    data: transformedData
  });
}));

// Get applications for a specific job
router.get('/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  
  logger.info(`Fetching applications for job: ${jobId}`);
  
  const applications = await JobApplication.find({
    job: jobId
  })
  .populate('worker', 'name phone email skills experience')
  .populate('employer', 'name companyName')
  .sort({ createdAt: -1 });
  
  logger.info(`Found ${applications.length} applications for job ${jobId}`);
  
  res.json({
    success: true,
    count: applications.length,
    data: applications
  });
}));

// Cancel/Delete application
router.delete('/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    logger.info(`Cancelling application: ${applicationId}`);

    const application = await JobApplication.findById(applicationId);
    
    if (!application) {
      logger.warn(`Application not found for cancellation: ${applicationId}`);
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!['pending', 'accepted'].includes(application.status)) {
      logger.warn(`Cannot cancel application ${applicationId} in status: ${application.status}`);
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel application in current status'
      });
    }

    await JobApplication.findByIdAndDelete(applicationId);

    logger.info(`Application cancelled successfully: ${applicationId}`);

    res.json({
      success: true,
      message: 'Application cancelled successfully'
    });

  } catch (error) {
    logger.error('Error cancelling application:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to cancel application',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Enhanced application status update with comprehensive validation and flow management
router.patch('/:applicationId/status', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status, previousStatus, transitionReason, timestamp, updatedBy, ...additionalData } = req.body;

  // --- ENHANCED LOGGING ---
  const logColor = '\x1b[33m'; // Yellow
  const resetColor = '\x1b[0m';
  console.log(`${logColor}[API] [PATCH] /api/job-applications/${applicationId}/status [applicationId=${applicationId}] [status=${status}] [previousStatus=${previousStatus}]${resetColor}`);
  logger.info(`🔄 Updating application ${applicationId} status from ${previousStatus} to: ${status}`);
  // --- END LOGGING ---

  // Enhanced status validation with transition rules
  const validStatuses = ['pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'];
  const validTransitions = {
    'pending': ['accepted', 'rejected'],
    'accepted': ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'cancelled'],
    'completed': [], // Terminal state
    'rejected': [], // Terminal state
    'cancelled': [] // Terminal state
  };

  if (!validStatuses.includes(status)) {
    logger.warn(`❌ Invalid status provided for application ${applicationId}: ${status}`);
    throw new ValidationError('Invalid status. Must be one of: ' + validStatuses.join(', '));
  }

  // Get current application to validate transition
  const currentApplication = await JobApplication.findById(applicationId).populate(['job', 'worker']);
  if (!currentApplication) {
    logger.warn(`❌ Application not found for status update: ${applicationId}`);
    throw new NotFoundError('Application not found');
  }

  const currentStatus = currentApplication.status;
  
  // Validate status transition
  if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
    logger.warn(`❌ Invalid status transition from ${currentStatus} to ${status} for application ${applicationId}`);
    throw new ValidationError(`Invalid status transition from ${currentStatus} to ${status}`);
  }

  // Prepare update data with enhanced tracking
  const updateData = {
    status,
    updatedAt: new Date(),
    [`${status}At`]: new Date() // Dynamic field like acceptedAt, completedAt, etc.
  };

  // Add status-specific fields
  if (status === 'completed') {
    updateData.completedAt = new Date();
    updateData.paymentStatus = 'pending';
    updateData.paymentAmount = currentApplication.job?.salary || additionalData.paymentAmount || 0;
  }

  // Update status history
  const statusHistoryEntry = {
    status,
    changedAt: new Date(),
    previousStatus: currentStatus,
    note: transitionReason || `Status changed from ${currentStatus} to ${status}`,
    updatedBy: updatedBy || 'system',
    timestamp: timestamp || new Date().toISOString()
  };

  // Perform the update
  const application = await JobApplication.findByIdAndUpdate(
    applicationId,
    {
      ...updateData,
      $push: { statusHistory: statusHistoryEntry }
    },
    { new: true }
  ).populate(['job', 'worker']);

  if (!application) {
    logger.warn(`❌ Failed to update application: ${applicationId}`);
    throw new NotFoundError('Failed to update application');
  }

  // Handle job status updates based on application status
  await handleJobStatusUpdate(application, status, currentStatus);

  // Get employer for notifications
  const employer = await Employer.findById(application.job.employer);
  if (!employer) {
    logger.warn(`⚠️ Employer not found for job ${application.job.employer} during notification`);
  }

  // Send notifications
  try {
    await sendStatusNotification(status, application, employer);
  } catch (notificationError) {
    logger.error('❌ Error sending notification:', notificationError);
  }

  // Handle payment processing for completed jobs
  if (status === 'completed' && currentStatus !== 'completed') {
    try {
      await processJobCompletion(application);
    } catch (paymentError) {
      logger.error('❌ Error processing job completion:', paymentError);
    }
  }

  logger.info(`✅ Application status updated successfully: ${applicationId} (${currentStatus} → ${status})`);

  res.json({
    success: true,
    message: `Application ${status} successfully`,
    data: application,
    statusTransition: {
      from: currentStatus,
      to: status,
      timestamp: new Date().toISOString(),
      reason: transitionReason
    }
  });
}));

// Helper function to handle job status updates
async function handleJobStatusUpdate(application, newApplicationStatus, previousApplicationStatus) {
  try {
    const job = application.job;
    let newJobStatus = null;

    switch (newApplicationStatus) {
      case 'accepted':
        // Update job to in-progress when first application is accepted
        if (job.status === 'active') {
          newJobStatus = 'in-progress';
        }
        break;
        
      case 'completed':
        // Check if all accepted applications are completed
        const allApplications = await JobApplication.find({ job: job._id });
        const acceptedApplications = allApplications.filter(app => 
          ['accepted', 'in-progress', 'completed'].includes(app.status)
        );
        const completedApplications = allApplications.filter(app => app.status === 'completed');
        
        if (acceptedApplications.length > 0 && completedApplications.length === acceptedApplications.length) {
          newJobStatus = 'completed';
        }
        break;
        
      case 'cancelled':
        // Check if all applications are cancelled/rejected
        const jobApplications = await JobApplication.find({ job: job._id });
        const activeApplications = jobApplications.filter(app => 
          !['cancelled', 'rejected'].includes(app.status)
        );
        
        if (activeApplications.length === 0) {
          newJobStatus = 'active'; // Revert to active if no active applications
        }
        break;
    }

    if (newJobStatus && job.status !== newJobStatus) {
      await Job.findByIdAndUpdate(job._id, {
        status: newJobStatus,
        updatedAt: new Date(),
        ...(newJobStatus === 'completed' && { completedAt: new Date() })
      });
      
      logger.info(`✅ Job ${job._id} status updated to ${newJobStatus}`);
    }
  } catch (error) {
    logger.error('❌ Error updating job status:', error);
  }
}

// Helper function to send status notifications
async function sendStatusNotification(status, application, employer) {
  const notificationMap = {
    'accepted': () => NotificationService.notifyApplicationAccepted(application, application.job, employer),
    'rejected': () => NotificationService.notifyApplicationRejected(application, application.job, employer),
    'in-progress': () => NotificationService.notifyJobStarted(application, application.job, employer),
    'completed': () => NotificationService.notifyJobCompleted(application, application.job, employer),
    'cancelled': () => NotificationService.notifyJobCancelled(application, application.job, employer)
  };

  const notificationFunction = notificationMap[status];
  if (notificationFunction) {
    await notificationFunction();
    logger.info(`✅ ${status} notification sent to worker`);
  }
}

// Helper function to process job completion
async function processJobCompletion(application) {
  try {
    // Update payment status
    const paymentAmount = application.job?.salary || application.paymentAmount || 0;
    
    await JobApplication.findByIdAndUpdate(application._id, {
      paymentStatus: 'pending',
      paymentAmount: paymentAmount,
      jobCompletedDate: new Date()
    });
    
    // Update worker balance (if applicable)
    if (application.worker && paymentAmount > 0) {
      await updateWorkerBalance(application.worker._id || application.worker, paymentAmount);
    }
    
    logger.info(`✅ Job completion processed for application ${application._id}`);
  } catch (error) {
    logger.error('❌ Error processing job completion:', error);
    throw error;
  }
}

// Update job application status with improved worker balance sync
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status, paymentAmount, notes } = req.body;
  const applicationId = req.params.id;
  
  logger.info(`Updating application ${applicationId} status to: ${status}`);
  
  const application = await JobApplication.findById(applicationId)
    .populate('job')
    .populate('worker');
  
  if (!application) {
    logger.warn(`Application not found for status update: ${applicationId}`);
    throw new NotFoundError('Application not found');
  }
  
  const oldStatus = application.status;
  application.status = status;
  
  application.statusHistory.push({
    status: status,
    changedAt: new Date(),
    note: notes || `Status changed from ${oldStatus} to ${status}`
  });
  
  if (status === 'completed' && oldStatus !== 'completed') {
    logger.info('Job marked as completed, processing payment...');
    
    const finalPaymentAmount = paymentAmount || application.job?.salary || 15000;
    
    application.paymentStatus = 'paid';
    application.paymentAmount = finalPaymentAmount;
    application.paymentDate = new Date();
    application.jobCompletedDate = new Date();
    
    await application.save();
    
    await updateWorkerBalance(application.worker._id || application.worker);
    
    await updateJobStatusIfCompleted(application.job._id);
    
  } else {
    await application.save();
  }
  
  res.json({
    success: true,
    message: 'Application status updated successfully',
    application: application,
    paymentProcessed: status === 'completed' && oldStatus !== 'completed'
  });
}));

// Helper function to update job status when all applications are completed
async function updateJobStatusIfCompleted(jobId) {
  try {
    const Job = require('../models/Job');
    
    const job = await Job.findById(jobId);
    if (!job) {
      logger.error('Job not found for ID:', jobId);
      return;
    }
    
    const allApplications = await JobApplication.find({ job: jobId });
    
    if (allApplications.length === 0) {
      logger.info('No applications found for job');
      return;
    }
    
    const acceptedApplications = allApplications.filter(app => 
      ['accepted', 'in-progress', 'completed'].includes(app.status)
    );
    
    const completedApplications = allApplications.filter(app => app.status === 'completed');
    
    if (acceptedApplications.length > 0 && 
        completedApplications.length === acceptedApplications.length && 
        job.status !== 'completed') {
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      
      await job.save();
      
      logger.info(`Job ${job.title} marked as completed - all accepted applications are done`);
    } else {
      logger.info(`Job ${job.title} remains ${job.status} - not all applications completed yet`);
    }
    
  } catch (error) {
    logger.error('Error updating job status:', error);
  }
}

// Helper function to update worker balance
async function updateWorkerBalance(workerId) {
  try {
    const Worker = require('../models/Worker');
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      logger.error('Worker not found for ID:', workerId);
      return;
    }
    
    const completedApplications = await JobApplication.find({
      worker: workerId,
      status: 'completed',
      paymentStatus: 'paid'
    }).populate('job');
    
    const totalEarned = completedApplications.reduce((sum, app) => {
      const amount = app.paymentAmount || app.job?.salary || 0;
      return sum + amount;
    }, 0);
    
    const totalWithdrawn = (worker.withdrawals || []).reduce((sum, w) => sum + w.amount, 0);
    
    worker.balance = totalEarned - totalWithdrawn;
    worker.earnings = completedApplications.map(app => ({
      jobId: app.job._id,
      amount: app.paymentAmount || app.job?.salary || 0,
      description: `Payment for: ${app.job?.title || 'Job'}`,
      date: app.paymentDate || app.updatedAt
    }));
    
    await worker.save();
    
    logger.info(`Worker balance updated: ${worker.name} - New balance: ₹${worker.balance}`);
    
  } catch (error) {
    logger.error('Error updating worker balance:', error);
  }
}

// Process payment for existing completed job - ENHANCED
router.patch('/:id/process-payment', async (req, res) => {
  try {
    const { paymentAmount } = req.body;
    const applicationId = req.params.id;
    
    logger.info(`Processing payment for application ${applicationId}`);
    
    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('worker');
    
    if (!application) {
      logger.warn(`Application not found: ${applicationId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }
    
    if (application.status !== 'completed') {
      return res.status(400).json({ 
        success: false,
        message: 'Job must be completed before processing payment' 
      });
    }
    
    if (application.paymentStatus === 'paid') {
      return res.status(400).json({ 
        success: false,
        message: 'Payment already processed' 
      });
    }
    
    const finalPaymentAmount = paymentAmount || application.job?.salary || 300;
    
    application.paymentStatus = 'paid';
    application.paymentAmount = finalPaymentAmount;
    application.paymentDate = new Date();
    
    await application.save();
    logger.info('Application payment status updated');
    
    await updateWorkerBalanceForPayment(application, finalPaymentAmount);
    
    await updateJobStatusIfCompleted(application.job._id);
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      application: application
    });
    
  } catch (error) {
    logger.error('Error processing payment:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: error.message 
    });
  }
});

// Helper function to update worker balance for payment
async function updateWorkerBalanceForPayment(application, finalPaymentAmount) {
  try {
    const Worker = require('../models/Worker');
    let correctWorker = null;
    
    if (application.worker && application.worker._id) {
      correctWorker = await Worker.findById(application.worker._id);
    }
    
    if (!correctWorker || 
        (application.workerDetails?.phone && correctWorker.phone !== application.workerDetails.phone)) {
      
      if (application.workerDetails?.phone) {
        correctWorker = await Worker.findOne({ 
          phone: application.workerDetails.phone 
        });
        
        if (correctWorker) {
          application.worker = correctWorker._id;
          application.workerDetails.name = correctWorker.name;
          await application.save();
        }
      }
    }
    
    if (!correctWorker) {
      logger.error('Could not find worker for payment');
      return;
    }
    
    if (typeof correctWorker.balance !== 'number') {
      correctWorker.balance = 0;
    }
    if (!Array.isArray(correctWorker.earnings)) {
      correctWorker.earnings = [];
    }
    if (!Array.isArray(correctWorker.withdrawals)) {
      correctWorker.withdrawals = [];
    }
    
    const existingEarning = correctWorker.earnings.find(earning => 
      earning.jobId && earning.jobId.toString() === application.job._id.toString()
    );
    
    if (!existingEarning) {
      correctWorker.balance += finalPaymentAmount;
      
      correctWorker.earnings.push({
        jobId: application.job._id,
        amount: finalPaymentAmount,
        description: `Payment for: ${application.job?.title || 'Job'}`,
        date: application.paymentDate || new Date()
      });
      
      await correctWorker.save();
      
      logger.info(`Worker balance updated: ${correctWorker.name} - New balance: ₹${correctWorker.balance}`);
    } else {
      logger.info('Payment already exists in worker earnings');
    }
    
  } catch (error) {
    logger.error('Error updating worker balance for payment:', error);
  }
};

// Manual endpoint to process all pending payments for completed jobs
router.post('/process-all-completed-payments/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    
    logger.info(`Processing all completed payments for worker: ${workerId}`);
    
    const completedApplications = await JobApplication.find({
      worker: workerId,
      status: 'completed',
      paymentStatus: { $in: ['pending', null] }
    }).populate('job');
    
    if (completedApplications.length === 0) {
      return res.json({
        success: true,
        message: 'No pending payments found',
        processed: 0
      });
    }
    
    let totalProcessed = 0;
    let totalAmount = 0;
    
    for (const application of completedApplications) {
      const paymentAmount = application.job?.salary || 300;
      
      application.paymentStatus = 'paid';
      application.paymentAmount = paymentAmount;
      application.paymentDate = new Date();
      
      await application.save();
      
      totalProcessed++;
      totalAmount += paymentAmount;
      
      logger.info(`Processed payment for job: ${application.job?.title} - ₹${paymentAmount}`);
    }
    
    const Worker = require('../models/Worker');
    const worker = await Worker.findById(workerId);
    
    if (worker) {
      const allPaidApplications = await JobApplication.find({
        worker: workerId,
        status: 'completed',
        paymentStatus: 'paid'
      }).populate('job');
      
      const totalBalance = allPaidApplications.reduce((sum, app) => {
        return sum + (app.paymentAmount || app.job?.salary || 0);
      }, 0);
      
      worker.balance = totalBalance;
      worker.earnings = allPaidApplications.map(app => ({
        jobId: app.job._id,
        amount: app.paymentAmount || app.job?.salary || 0,
        description: `Payment for: ${app.job?.title || 'Job'}`,
        date: app.paymentDate || app.updatedAt || new Date()
      }));
      
      await worker.save();
      
      logger.info(`Worker balance updated: ₹${worker.balance}`);
    }
    
    res.json({
      success: true,
      message: 'All payments processed successfully',
      processed: totalProcessed,
      totalAmount: totalAmount,
      newBalance: worker?.balance || 0
    });
    
  } catch (error) {
    logger.error('Error processing payments:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;