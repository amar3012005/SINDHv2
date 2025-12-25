const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const NotificationService = require('../services/notificationService');
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

  // PREVENT DUPLICATE APPLICATIONS
  const existingApplication = await JobApplication.findOne({
    job: jobId,
    worker: workerId
  });

  if (existingApplication) {
    logger.warn(`Worker ${workerId} already applied for job ${jobId}`);
    throw new ValidationError('You have already applied for this job');
  }

  logger.info(`Job ${jobId} current status: ${job.status}`);

  // Check if job is available for applications
  // Allow if status is POSTED, APPLIED or active (legacy)
  if (!['POSTED', 'APPLIED', 'active', 'posted'].includes(job.status)) {
    logger.warn(`Job not available for worker application: status=${job.status}, workerStatus=${job.workerStatus}`);
    throw new ValidationError('Job is no longer accepting applications');
  }

  // Update status when worker applies
  logger.info(`Updating job ${jobId} status to APPLIED`);

  // Update status and increment applicant count
  job.status = 'APPLIED';
  job.applicantCount = (job.applicantCount || 0) + 1;

  // Track legacy dual status for compatibility
  job.workerStatus = 'applied';
  job.employerStatus = 'active';

  await job.save();

  logger.info(`Job ${jobId} dual status updated successfully`);
  logger.info(`Job after update:`, {
    id: job._id,
    workerStatus: job.workerStatus,
    employerStatus: job.employerStatus,
    legacyStatus: job.status,
    title: job.title
  });

  // Verify the job was actually updated in the database
  const updatedJob = await Job.findById(jobId);
  logger.info(`Job verification from database:`, {
    id: updatedJob._id,
    workerStatus: updatedJob.workerStatus,
    employerStatus: updatedJob.employerStatus,
    legacyStatus: updatedJob.status,
    title: updatedJob.title
  });

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
      status: 'applied',
      workerDetails: sanitizedWorkerDetails,
      appliedAt: new Date(),
      statusHistory: [{
        status: 'applied',
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
    status: 'applied',
    workerDetails: sanitizedWorkerDetails,
    appliedAt: new Date(),
    statusHistory: [{
      status: 'applied',
      changedAt: new Date(),
      note: 'Application submitted successfully'
    }]
  };

  const application = new JobApplication(applicationData);
  await application.save();
  logger.info(`Application saved successfully: ${application._id}`);

  // Update worker's jobApplications array
  if (worker) {
    try {
      if (!worker.jobApplications) {
        worker.jobApplications = [];
      }
      if (!worker.jobApplications.includes(application._id)) {
        worker.jobApplications.push(application._id);
        await worker.save();
        logger.info(`✅ Added application ${application._id} to worker ${workerId} profile`);
      }
    } catch (err) {
      logger.warn(`⚠️ Could not update worker jobApplications array: ${err.message}`);
    }
  }

  // Update job's applicantCount
  try {
    await Job.findByIdAndUpdate(
      jobId,
      { $inc: { applicantCount: 1 } },
      { new: true }
    );
    logger.info(`✅ Incremented applicantCount for job ${jobId}`);
  } catch (err) {
    logger.warn(`⚠️ Could not increment job applicantCount: ${err.message}`);
  }
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
    status: 'applied',
    paymentStatus: 'pending',
    workerDetails: workerDetails || {},
    applicationDetails: {
      appliedAt: new Date()
    },
    statusHistory: [{
      status: 'applied',
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
  logger.info(`DATABASE_NAME: ${mongoose.connection.name}`);

  const query = {
    worker: workerId,
    status: { $in: ['applied', 'accepted', 'in-progress', 'APPLIED', 'ACCEPTED', 'WORKING'] }
  };

  const applications = await JobApplication.find(query)
    .populate('job')
    .populate('worker')
    .sort({ appliedAt: -1 });

  logger.info(`Found ${applications.length} current applications for worker ${workerId} using query: ${JSON.stringify(query)}`);

  if (applications.length === 0) {
    const allForWorker = await JobApplication.find({ worker: workerId });
    logger.info(`🔍 DEBUG: Total applications for this worker (any status): ${allForWorker.length}`);
    if (allForWorker.length > 0) {
      logger.info(`🔍 DEBUG: Sample application status: ${allForWorker[0].status}`);
    }
  }

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
  logger.info(`DATABASE_NAME: ${mongoose.connection.name}`);

  const completedApplications = await JobApplication.find({
    worker: workerId,
    status: { $in: ['completed', 'paid', 'COMPLETED', 'PAID', 'FINISHED'] }
  })
    .populate('job')
    .populate('employer', 'name company companyName')
    .sort({ updatedAt: -1 });

  logger.info(`Found ${completedApplications.length} completed applications for worker ${workerId}`);

  if (completedApplications.length === 0) {
    const allForWorker = await JobApplication.find({ worker: workerId });
    logger.info(`🔍 DEBUG COMPLETED: Total applications for this worker (any status): ${allForWorker.length}`);
  }

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

    logger.info(`🗑️ Withdrawing application: ${applicationId}`);

    const application = await JobApplication.findById(applicationId).populate('job worker');

    if (!application) {
      logger.warn(`Application not found for cancellation: ${applicationId}`);
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Only allow withdrawal for applied/accepted status
    if (!['applied', 'accepted', 'APPLIED', 'ACCEPTED'].includes(application.status)) {
      logger.warn(`Cannot cancel application ${applicationId} in status: ${application.status}`);
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel application in current status'
      });
    }

    const jobId = application.job._id || application.job;
    const workerId = application.worker._id || application.worker;

    // Delete the application
    await JobApplication.findByIdAndDelete(applicationId);
    logger.info(`✅ Application deleted: ${applicationId}`);

    // Decrement job's applicantCount
    try {
      await Job.findByIdAndUpdate(
        jobId,
        { $inc: { applicantCount: -1 } },
        { new: true }
      );
      logger.info(`✅ Decremented applicantCount for job ${jobId}`);
    } catch (err) {
      logger.warn(`⚠️ Could not decrement job applicantCount: ${err.message}`);
    }

    // Remove from worker's jobApplications array
    try {
      await Worker.findByIdAndUpdate(
        workerId,
        { $pull: { jobApplications: applicationId } },
        { new: true }
      );
      logger.info(`✅ Removed application from worker ${workerId} profile`);
    } catch (err) {
      logger.warn(`⚠️ Could not update worker jobApplications array: ${err.message}`);
    }

    logger.info(`✅ Application withdrawn successfully: ${applicationId}`);

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: {
        applicationId,
        jobId,
        workerId
      }
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
  const validStatuses = ['applied', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled'];
  const validTransitions = {
    'applied': ['accepted', 'rejected'],
    'accepted': ['applied', 'in-progress', 'cancelled'],  // Allow reverting to 'applied' (revoke)
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
  const currentApplication = await JobApplication.findById(applicationId)
    .populate({
      path: 'job',
      populate: {
        path: 'employer',
        model: 'Employer'
      }
    })
    .populate('worker');
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
    updateData.paymentStatus = 'applied';
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

  // PAYMENT ACCEPTANCE FLOW - When employer accepts with payment
  if (status === 'accepted' && currentStatus !== 'accepted') {
    logger.info('🎉 PAYMENT FLOW: Application accepted with payment!');

    const paymentAmt = application.job?.salary || application.job?.baseAmount || 0;
    const employerId = application.job?.employer?._id || application.job?.employer;

    // 1. Update JobApplication with payment info
    await JobApplication.findByIdAndUpdate(applicationId, {
      baseAmount: paymentAmt,
      baseAmountPaid: true,
      baseAmountPaidAt: new Date(),
      basePaymentDetails: {
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        paymentMethod: 'simulated',
        paidBy: employerId
      },
      totalPayment: paymentAmt,
      paymentStatus: 'base_paid',
      acceptedAt: new Date()
    });
    logger.info(`✅ JobApplication ${applicationId} updated with payment info (baseAmountPaid: true)`);

    // 2. Update Worker's wallet
    const workerId = application.worker?._id || application.worker;

    // TWO-TIER WALLET LOGIC:
    // On Acceptance: Credit 'totalBalance' (visible upcoming) but NOT 'withdrawableBalance'.
    const workerUpdate = await Worker.findByIdAndUpdate(
      workerId,
      {
        $inc: {
          'wallet.totalBalance': paymentAmt,
          'wallet.pendingBalance': paymentAmt, // Legacy
          activeJobs: 1
        },
        $set: {
          'wallet.lastUpdated': new Date()
        },
        $push: {
          'wallet.transactionHistory': {
            type: 'credit_pending',
            amount: paymentAmt,
            description: `Base payment (Pending Completion): ${application.job?.title}`,
            jobId: application.job?._id,
            applicationId: application._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (workerUpdate) {
      logger.info(`✅ Worker ${workerId} wallet updated. Pending balance: ₹${workerUpdate.wallet?.pendingBalance || 0}`);
    } else {
      logger.warn(`⚠️ Worker ${workerId} not found for wallet update`);
    }

    // 3. Update Job document with accepted status  
    await Job.findByIdAndUpdate(application.job._id, {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedWorker: workerId
    });
    logger.info(`✅ Job ${application.job._id} status updated to accepted`);
  }
  // REVOKE PAYMENT FLOW - When employer revokes acceptance (authentically or by accident)
  else if (currentStatus === 'accepted' && status !== 'accepted' && status !== 'completed') {
    logger.info('↩️ REVOKE FLOW: Application acceptance revoked! Reversing payment.');

    const paymentAmt = application.totalPayment || application.baseAmount || application.job?.salary || 0;

    // 1. Update JobApplication to remove payment info
    await JobApplication.findByIdAndUpdate(applicationId, {
      baseAmountPaid: false,
      baseAmountPaidAt: null,
      paymentStatus: 'pending', // Reset to pending
      // derived fields might need adjustment depending on your business logic 
      acceptedAt: null
    });
    logger.info(`✅ JobApplication ${applicationId} payment info reverted`);

    // 2. Debit Worker's wallet
    const workerId = application.worker?._id || application.worker;

    // REVERSAL LOGIC: Debit totalBalance (was credited at acceptance).
    const workerUpdate = await Worker.findByIdAndUpdate(
      workerId,
      {
        $inc: {
          'wallet.totalBalance': -paymentAmt,
          'wallet.pendingBalance': -paymentAmt,
          activeJobs: -1
        },
        $set: {
          'wallet.lastUpdated': new Date()
        },
        $push: {
          'wallet.transactionHistory': {
            type: 'debit',
            amount: paymentAmt,
            description: `Revoked acceptance for job: ${application.job?.title}`,
            jobId: application.job?._id,
            applicationId: application._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (workerUpdate) {
      logger.info(`✅ Worker ${workerId} wallet debited. New Total Balance: ₹${workerUpdate.wallet?.totalBalance || 0}`);
    } else {
      logger.warn(`⚠️ Worker ${workerId} not found for wallet debit`);
    }

    // 3. Reset Job document status to 'posted' (so it appears in search again)
    await Job.findByIdAndUpdate(application.job._id, {
      status: 'posted', // Back to posted
      acceptedAt: null,
      acceptedWorker: null
    });
    logger.info(`✅ Job ${application.job._id} status reset to posted`);
  }

  // Get employer for notifications
  // Try to use populated employer first, then fetch by ID, then fall back to job data
  let employer = application.job.employer;

  if (!employer || !employer.name) {
    // If employer not fully populated, try fetching
    const employerId = application.job.employer?._id || application.job.employer;
    if (employerId) {
      employer = await Employer.findById(employerId);
    }
  }

  // Construct a fallback employer object if still null, using Job data
  if (!employer) {
    logger.warn(`⚠️ Employer not found for job ${application.job._id} during notification - constructing fallback`);
    employer = {
      _id: application.job.employer,
      companyName: application.job.companyName || 'Employer',
      name: application.job.companyName || 'Employer',
      phone: 'N/A'
    };
  }

  // Send notifications based on status
  try {
    if (status === 'accepted' && currentStatus !== 'accepted') {
      const paymentAmt = application.job?.salary || application.job?.baseAmount || 0;
      await NotificationService.notifyPaymentSuccess(application, application.job, employer, paymentAmt);
      logger.info(`✅ Payment success notifications sent to worker and employer`);
    } else {
      await sendStatusNotification(status, application, employer);
    }
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
    paymentProcessed: status === 'accepted' && currentStatus !== 'accepted',
    statusTransition: {
      from: currentStatus,
      to: status,
      timestamp: new Date().toISOString(),
      reason: transitionReason
    }
  });
}));

// Helper function to handle dual job status updates (worker + employer perspectives)
async function handleJobStatusUpdate(application, newApplicationStatus, previousApplicationStatus) {
  try {
    const job = application.job;
    // Initialize status fields if they don't exist (for backward compatibility)
    let newWorkerStatus = job.workerStatus || 'applied';
    let newEmployerStatus = job.employerStatus || 'active';
    let newLegacyStatus = job.status || 'active';

    logger.info(`🔄 Dual Status Update - Application: ${previousApplicationStatus} → ${newApplicationStatus}`);
    logger.info(`📊 Current Job Status - Worker: ${newWorkerStatus}, Employer: ${newEmployerStatus}`);

    switch (newApplicationStatus) {
      case 'accepted':
        // When employer accepts worker application
        logger.info('✅ Employer accepted worker - updating dual status');
        newWorkerStatus = 'accepted';     // Worker: applied → accepted
        newEmployerStatus = 'accepted';   // Employer: active → accepted
        newLegacyStatus = 'APPLIED';      // Job has accepted applicants (not yet working)
        break;

      case 'applied':
        // When employer revokes acceptance (accepted → applied)
        if (previousApplicationStatus === 'accepted') {
          logger.info('🔄 Employer revoked acceptance - checking other applications');
          const otherAcceptedApps = await JobApplication.find({
            job: job._id,
            _id: { $ne: applicationId },
            status: 'accepted'
          });
          if (otherAcceptedApps.length === 0) {
            newWorkerStatus = 'applied';
            newEmployerStatus = 'active';
            newLegacyStatus = 'APPLIED';
            logger.info('No other accepted apps - job status reverted to APPLIED');
          }
        }
        break;

      case 'completed':
        // When work is completed, check payment status
        logger.info('🏁 Work completed - checking payment status');
        // Status will be updated in payment processing
        break;

      case 'cancelled':
      case 'rejected':
        // Reset statuses if application is cancelled/rejected
        logger.info('❌ Application cancelled/rejected - resetting status');
        const jobApplications = await JobApplication.find({ job: job._id });
        const activeApplications = jobApplications.filter(app =>
          !['cancelled', 'rejected'].includes(app.status)
        );

        if (activeApplications.length === 0) {
          newWorkerStatus = 'active';   // Revert to active for new applications
          newEmployerStatus = 'active'; // Employer can review new applications
          newLegacyStatus = 'active';   // Legacy compatibility
        }
        break;
    }

    // Update job with dual status system
    if (newWorkerStatus !== job.workerStatus ||
      newEmployerStatus !== job.employerStatus ||
      newLegacyStatus !== job.status) {

      const updateData = {
        workerStatus: newWorkerStatus,
        employerStatus: newEmployerStatus,
        status: newLegacyStatus, // Legacy compatibility
        updatedAt: new Date()
      };

      if (newLegacyStatus === 'completed') {
        updateData.completedAt = new Date();
      }

      await Job.findByIdAndUpdate(job._id, updateData);

      logger.info(`✅ Job ${job._id} dual status updated:`);
      logger.info(`   Worker: ${job.workerStatus} → ${newWorkerStatus}`);
      logger.info(`   Employer: ${job.employerStatus} → ${newEmployerStatus}`);
      logger.info(`   Legacy: ${job.status} → ${newLegacyStatus}`);
    } else {
      logger.info('📝 No status changes needed');
    }
  } catch (error) {
    logger.error('❌ Error updating dual job status:', error);
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

  } else if (status === 'accepted' && oldStatus !== 'accepted') {
    // PAYMENT ACCEPTANCE FLOW
    logger.info('🎉 Application accepted with payment!');

    const paymentAmt = application.job?.salary || application.job?.baseAmount || 0;
    const employerId = application.job?.employer;

    // 1. Update JobApplication with payment info
    application.baseAmount = paymentAmt;
    application.baseAmountPaid = true;
    application.baseAmountPaidAt = new Date();
    application.basePaymentDetails = {
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      paymentMethod: 'simulated',
      paidBy: employerId
    };
    application.totalPayment = paymentAmt;
    application.paymentStatus = 'base_paid';
    application.acceptedAt = new Date();

    await application.save();
    logger.info(`✅ JobApplication ${applicationId} updated with payment info`);

    // 2. Update Worker's wallet
    const workerId = application.worker._id || application.worker;
    const workerUpdate = await Worker.findByIdAndUpdate(
      workerId,
      {
        $inc: {
          'wallet.pendingBalance': paymentAmt,
          'wallet.totalEarnings': paymentAmt,
          activeJobs: 1
        },
        $set: {
          'wallet.lastUpdated': new Date()
        },
        $push: {
          'wallet.transactionHistory': {
            type: 'credit',
            amount: paymentAmt,
            description: `Base payment for job: ${application.job?.title}`,
            jobId: application.job?._id,
            applicationId: application._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (workerUpdate) {
      logger.info(`✅ Worker wallet updated. New pending balance: ₹${workerUpdate.wallet?.pendingBalance}`);
    }

    // 3. Update Job document with accepted status
    await Job.findByIdAndUpdate(application.job._id, {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedWorker: workerId,
      $set: {
        'paymentInfo.baseAmountPaid': true,
        'paymentInfo.paidAt': new Date(),
        'paymentInfo.paidTo': workerId
      }
    });
    logger.info(`✅ Job ${application.job._id} status updated to accepted`);

  } else {
    await application.save();
  }

  // Send notifications based on status change
  try {
    // Get employer for notifications
    const employer = await Employer.findById(application.job.employer);

    if (status === 'accepted' && oldStatus !== 'accepted') {
      // Send payment success notification to both worker and employer
      const paymentAmt = application.job?.salary || application.job?.baseAmount || 0;
      await NotificationService.notifyPaymentSuccess(application, application.job, employer, paymentAmt);
      logger.info(`✅ Payment success notifications sent for application ${applicationId}`);
    } else {
      // Send regular status notifications
      await sendStatusNotification(status, application, employer);
    }
  } catch (notificationError) {
    logger.error('❌ Error sending notifications:', notificationError);
    // Don't throw - notification failures shouldn't break the flow
  }

  res.json({
    success: true,
    message: 'Application status updated successfully',
    application: application,
    paymentProcessed: status === 'accepted' && oldStatus !== 'accepted'
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

// Helper function to update worker balance (Two-Tier Recalculation)
async function updateWorkerBalance(workerId) {
  try {
    const Worker = require('../models/Worker');
    const worker = await Worker.findById(workerId);

    if (!worker) {
      logger.error('Worker not found for ID:', workerId);
      return;
    }

    if (!worker.wallet) worker.wallet = { totalBalance: 0, withdrawableBalance: 0 };

    // 1. Accepted Jobs (Pending Base Amount)
    // Only count baseAmount here.
    const acceptedApps = await JobApplication.find({
      worker: workerId,
      status: 'accepted'
    }).populate('job');

    // 2. Completed Jobs (Fully Earned)
    // These contribute to both Total and Withdrawable
    const completedApps = await JobApplication.find({
      worker: workerId,
      status: 'completed'
    }).populate('job');

    let calculatedTotal = 0;
    let calculatedWithdrawable = 0;

    // Add Pending (Accepted) Amounts
    acceptedApps.forEach(app => {
      // Prefer tracking fields if available, else job salary
      const amount = app.baseAmount || app.job?.salary || 0;
      calculatedTotal += amount;
    });

    // Add Earned (Completed) Amounts
    completedApps.forEach(app => {
      const amount = app.paymentAmount || app.job?.salary || 0;
      calculatedTotal += amount;
      calculatedWithdrawable += amount;
    });

    // Deduct Withdrawals
    const totalWithdrawn = worker.wallet.withdrawnAmount || 0;

    // Final Calculation
    worker.wallet.totalBalance = Math.max(0, calculatedTotal - totalWithdrawn);
    worker.wallet.withdrawableBalance = Math.max(0, calculatedWithdrawable - totalWithdrawn);
    worker.wallet.pendingBalance = worker.wallet.totalBalance; // Legacy sync
    worker.wallet.totalEarnings = calculatedTotal; // Lifetime earnings

    worker.markModified('wallet');
    await worker.save();

    logger.info(`✅ Worker Wallet Recalculated: Total: ₹${worker.wallet.totalBalance}, Withdrawable: ₹${worker.wallet.withdrawableBalance}`);

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
    logger.info('💰 Application payment status updated');

    // Update dual status system for payment processing
    const job = await Job.findById(application.job._id);
    if (job) {
      // When employer processes payment
      job.employerStatus = 'paid';  // Employer: accepted → paid
      // Worker status remains 'accepted' until money is added to wallet

      await job.save();
      logger.info(`💳 Job ${job._id} employer status updated to 'paid'`);
      logger.info(`📊 Current Job Status - Worker: ${job.workerStatus}, Employer: ${job.employerStatus}`);
    }

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

      logger.info(`💰 Worker balance updated: ${correctWorker.name} - New balance: ₹${correctWorker.balance}`);

      // Update job worker status to 'got paid' when money is added to wallet
      const job = await Job.findById(application.job._id);
      if (job && job.workerStatus === 'accepted') {
        job.workerStatus = 'got paid';  // Worker: accepted → got paid
        await job.save();

        logger.info(`💵 Job ${job._id} worker status updated to 'got paid'`);
        logger.info(`🏆 Final Job Status - Worker: ${job.workerStatus}, Employer: ${job.employerStatus}`);
      }
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