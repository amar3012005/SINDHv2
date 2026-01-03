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

// Helper function: Calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Apply for a job
router.post('/apply', asyncHandler(async (req, res) => {
  logger.info('🎯 Job application request received for Firestore');
  const { jobId, workerId, workerDetails } = req.body;

  if (!jobId || !workerId) {
    throw new ValidationError('Job ID and Worker ID are required');
  }

  // 1. Check job status in Firestore
  const jobDoc = await db.collection('jobs').doc(jobId).get();
  if (!jobDoc.exists) {
    throw new NotFoundError('Job not found');
  }
  const job = jobDoc.data();

  // 2. Prevent duplicate applications
  const existingAppSnapshot = await db.collection('applications')
    .where('job', '==', jobId)
    .where('worker', '==', workerId)
    .limit(1)
    .get();

  if (!existingAppSnapshot.empty) {
    throw new ValidationError('You have already applied for this job');
  }

  // 3. Fetch worker data for denormalization
  const workerDoc = await db.collection('workers').doc(workerId).get();
  if (!workerDoc.exists) {
    throw new NotFoundError('Worker not found');
  }
  const worker = workerDoc.data();

  // 4. Create application in Firestore with denormalized snippets
  const targetId = (new mongoose.Types.ObjectId()).toString();
  const applicationData = {
    job: jobId,
    worker: workerId,
    employer: job.employer,
    status: 'applied',
    workerDetails: workerDetails || {},
    
    // Denormalized snippets
    workerSnippet: {
      name: worker.name,
      rating: worker.rating?.average || 0,
      phone: worker.phone,
      profilePicture: worker.profilePicture || '',
      preferredCategory: worker.preferredCategory || ''
    },
    jobSnippet: {
      title: job.title,
      salary: job.salary || job.baseAmount || 0,
      location: job.location,
      companyName: job.companyName || ''
    },

    appliedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('applications').doc(targetId).set(applicationData);

  // 5. Create first status history entry in sub-collection
  await db.collection('applications').doc(targetId).collection('statusHistory').add({
    status: 'applied',
    changedAt: admin.firestore.FieldValue.serverTimestamp(),
    note: 'Application submitted via Firestore'
  });

  // 6. Update job applicant count in Firestore (Background)
  db.collection('jobs').doc(jobId).update({
    applicantCount: admin.firestore.FieldValue.increment(1),
    status: 'APPLIED' // Update status if it was just posted
  }).catch(err => logger.warn(`⚠️ Failed to update job applicant count in Firestore: ${err.message}`));

  logger.info(`Application saved successfully in Firestore: ${targetId}`);

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { ...applicationData, id: targetId, _id: targetId }
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

  logger.info(`Fetching applications from Firestore for employer: ${employerId}`);

  let query = db.collection('applications').where('employer', '==', employerId);
  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  const applications = snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    _id: doc.id
  })).sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

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

  logger.info(`Fetching applications from Firestore for job: ${jobId}`);

  let query = db.collection('applications').where('job', '==', jobId);
  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  const applications = snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    _id: doc.id
  })).sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
}));

// Get a specific application by ID
router.get('/:applicationId', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  logger.info(`Fetching application by ID from Firestore: ${applicationId}`);

  const applicationDoc = await db.collection('applications').doc(applicationId).get();

  if (!applicationDoc.exists) {
    logger.warn(`Application not found: ${applicationId}`);
    throw new NotFoundError('Application not found');
  }

  const application = applicationDoc.data();

  // Return formatted application
  res.json({
    success: true,
    data: {
      ...application,
      id: applicationDoc.id,
      _id: applicationDoc.id
    }
  });
}));

// Get worker's current applications
router.get('/worker/:workerId/current', asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  logger.info(`Fetching current applications from Firestore for worker: ${workerId}`);

  const snapshot = await db.collection('applications')
    .where('worker', '==', workerId)
    .where('status', 'in', ['applied', 'accepted', 'working', 'in-progress', 'APPLIED', 'ACCEPTED', 'WORKING', 'pending'])
    .get();

  const applications = snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    _id: doc.id
  })).sort((a, b) => {
    const dateA = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(a.appliedAt || 0);
    const dateB = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(b.appliedAt || 0);
    return dateB - dateA;
  });

  res.json({
    success: true,
    data: applications,
    count: applications.length
  });
}));

// Get worker's completed applications (Past Jobs)
router.get('/worker/:workerId/completed', asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  logger.info(`Fetching completed applications from Firestore for worker: ${workerId}`);

  const snapshot = await db.collection('applications')
    .where('worker', '==', workerId)
    .where('status', 'in', ['completed', 'paid', 'COMPLETED', 'PAID', 'FINISHED'])
    .get();

  const applications = snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    _id: doc.id
  })).sort((a, b) => {
    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
    return dateB - dateA;
  });

  res.json({
    success: true,
    data: applications,
    count: applications.length
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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/f37aaaad-37c4-46aa-b65b-61479aa84b1f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'jobApplicationRoutes.js:386',message:'Entering status update',data:{applicationId:req.params.applicationId,status:req.body.status},timestamp:Date.now(),sessionId:'robustness-check',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  const { applicationId } = req.params;
  const { status, previousStatus, transitionReason, timestamp, updatedBy, ...additionalData } = req.body;

  // --- ENHANCED LOGGING ---
  const logColor = '\x1b[33m'; // Yellow
  const resetColor = '\x1b[0m';
  console.log(`${logColor}[API] [PATCH] /api/job-applications/${applicationId}/status [applicationId=${applicationId}] [status=${status}] [previousStatus=${previousStatus}]${resetColor}`);
  logger.info(`🔄 Updating application ${applicationId} status from ${previousStatus} to: ${status}`);
  // --- END LOGGING ---

  // Enhanced status validation with transition rules
  const validStatuses = ['applied', 'accepted', 'working', 'completed', 'paid', 'finished', 'rejected', 'cancelled'];
  const validTransitions = {
    'applied': ['accepted', 'rejected'],
    'accepted': ['working', 'cancelled'],
    'working': ['completed', 'cancelled'],
    'completed': ['paid'],
    'paid': ['finished'],
    'finished': [], // Terminal state
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

  // Update status history in sub-collection
  const statusHistoryEntry = {
    status,
    changedAt: admin.firestore.FieldValue.serverTimestamp(),
    previousStatus: currentStatus,
    note: transitionReason || `Status changed from ${currentStatus} to ${status}`,
    updatedBy: updatedBy || 'system',
    timestamp: timestamp || new Date().toISOString()
  };

  // Perform the update in Firestore
  const applicationRef = db.collection('applications').doc(applicationId);
  await applicationRef.update(updateData);
  await applicationRef.collection('statusHistory').add(statusHistoryEntry);

  const updatedDoc = await applicationRef.get();
  const application = {
    ...updatedDoc.data(),
    id: updatedDoc.id,
    _id: updatedDoc.id
  };

  if (!updatedDoc.exists) {
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

    // TWO-TIER WALLET LOGIC:
    // 1. Update Worker's wallet
    const workerId = application.worker?._id || application.worker;

    // On Acceptance: Credit 'totalBalance' (visible upcoming) but NOT 'withdrawableBalance'.
    const workerUpdate = await Worker.findByIdAndUpdate(
      workerId,
      {
        $inc: {
          'wallet.totalBalance': paymentAmt,
          'wallet.pendingBalance': paymentAmt, // Legacy
          'balance': paymentAmt, // SYNC ROOT LEGACY FIELD (Global Truth)
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

    // 2. Update Employer's wallet (Deduction/Hold)
    const employerUpdate = await Employer.findByIdAndUpdate(
      employerId,
      {
        $inc: {
          'wallet.totalBalance': -paymentAmt,
          'wallet.spentAmount': paymentAmt
        },
        $push: {
          'wallet.transactionHistory': {
            type: 'escrow_hold',
            amount: paymentAmt,
            description: `Payment held for job: ${application.job?.title}`,
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
    }
    if (employerUpdate) {
      logger.info(`✅ Employer ${employerId} wallet updated. New balance: ₹${employerUpdate.wallet?.totalBalance || 0}`);
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
          'balance': -paymentAmt, // SYNC LEGACY FIELD
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

    // 3. Refund Employer's wallet
    let employerIdRevoke = application.job?.employer?._id || application.job?.employer;
    await Employer.findByIdAndUpdate(
      employerIdRevoke,
      {
        $inc: {
          'wallet.totalBalance': paymentAmt,
          'wallet.spentAmount': -paymentAmt
        },
        $push: {
          'wallet.transactionHistory': {
            type: 'credit',
            amount: paymentAmt,
            description: `Refund for revoked job: ${application.job?.title}`,
            jobId: application.job?._id,
            applicationId: application._id,
            createdAt: new Date()
          }
        }
      }
    );

    if (workerUpdate) {
      logger.info(`✅ Worker ${workerId} wallet debited. New Total Balance: ₹${workerUpdate.wallet?.totalBalance || 0}`);
    }

    // 4. Reset Job document status to 'posted' (so it appears in search again)
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
    let empIdForNotify = application.job.employer?._id || application.job.employer;
    if (empIdForNotify) {
      employer = await Employer.findById(empIdForNotify);
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

  // Handle job lifecycle stages
  if (status === 'completed' && currentStatus !== 'completed') {
    logger.info(`✅ Job ${applicationId} marked as COMPLETED. Moving to Work-Done state.`);
  }

  if (status === 'paid' && currentStatus !== 'paid') {
    logger.info(`💰 Job ${applicationId} marked as PAID. Releasing funds to worker.`);
    try {
      await processJobPayment(application);
    } catch (paymentError) {
      logger.error('❌ Error processing final payment:', paymentError);
    }
  }

  if (status === 'finished' && currentStatus !== 'finished') {
    logger.info(`🏁 Job ${applicationId} marked as FINISHED.`);
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

// Helper function to process final payment (Stage 2)
async function processJobPayment(application) {
  try {
    const paymentAmount = application.totalPayment || application.job?.salary || 0;
    const workerId = application.worker?._id || application.worker;
    const employerId = application.job?.employer?._id || application.job?.employer;

    // 1. Update JobApplication status
    await JobApplication.findByIdAndUpdate(application._id, {
      paymentStatus: 'paid',
      paymentDate: new Date()
    });

    // 2. Update Worker - Convert Pending to Withdrawable
    await updateWorkerBalance(workerId);

    // 3. Update Employer - Confirm release
    await Employer.findByIdAndUpdate(employerId, {
      $push: {
        'wallet.transactionHistory': {
          type: 'escrow_release',
          amount: paymentAmount,
          description: `Payment released for job: ${application.job?.title}`,
          jobId: application.job?._id,
          applicationId: application._id,
          createdAt: new Date()
        }
      }
    });

    logger.info(`✅ Final payment processed for application ${application._id}`);
  } catch (error) {
    logger.error('❌ Error in processJobPayment:', error);
    throw error;
  }
}

// Status update logic consolidated in the main PATCH route above

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
    const acceptedApps = await JobApplication.find({
      worker: workerId,
      status: 'accepted'
    }).populate('job');

    // 2. Completed Jobs (Fully Earned)
    const completedApps = await JobApplication.find({
      worker: workerId,
      status: { $in: ['completed', 'paid', 'COMPLETED', 'PAID', 'FINISHED'] }
    }).populate('job');

    let calculatedTotal = 0;
    let calculatedWithdrawable = 0;

    // Add Pending (Accepted) Amounts
    acceptedApps.forEach(app => {
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
    worker.wallet.pendingBalance = worker.wallet.totalBalance - worker.wallet.withdrawableBalance;
    worker.wallet.totalEarnings = calculatedTotal;

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

// ============================================
// JOB WORKFLOW LIFECYCLE ENDPOINTS
// ============================================

// Start Work - ACCEPTED → WORKING
// Either worker or employer can trigger this
router.post('/:applicationId/start-work', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  logger.info(`🚀 Start Work request for application: ${applicationId}`);

  const application = await JobApplication.findById(applicationId)
    .populate('job')
    .populate('worker')
    .populate('employer');

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  if (application.status !== 'accepted') {
    throw new ValidationError(`Cannot start work. Current status: ${application.status}. Must be 'accepted'.`);
  }

  // Update application status to working
  application.status = 'working';
  application.startedAt = new Date();
  
  const statusHistoryEntry = {
    status: 'working',
    changedAt: admin.firestore.FieldValue.serverTimestamp(),
    note: 'Work started'
  };

  await db.collection('applications').doc(applicationId).update({
    status: 'working',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await db.collection('applications').doc(applicationId).collection('statusHistory').add(statusHistoryEntry);

  // Update job status in Firestore
  const jobId = application.job._id || application.job;
  if (jobId) {
    await db.collection('jobs').doc(jobId).update({
      status: 'WORKING',
      workerStatus: 'working',
      employerStatus: 'working',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    logger.info(`✅ Job ${jobId} status updated to WORKING in Firestore`);
  }

  // Send notifications to both parties
  const Notification = require('../models/Notification');

  // Notify worker
  try {
    await Notification.create({
      recipient: application.worker._id || application.worker,
      recipientModel: 'Worker',
      sender: application.employer._id || application.employer,
      senderModel: 'Employer',
      type: 'work_started',
      title: '🚀 Work Started!',
      message: `Work has started for "${job?.title || 'Job'}"`,
      data: {
        jobId: job?._id,
        applicationId: application._id
      }
    });
  } catch (e) {
    logger.warn('Could not create worker notification:', e.message);
  }

  // Notify employer
  try {
    await Notification.create({
      recipient: application.employer._id || application.employer,
      recipientModel: 'Employer',
      sender: application.worker._id || application.worker,
      senderModel: 'Worker',
      type: 'work_started',
      title: '🚀 Work Started!',
      message: `Work has started for "${job?.title || 'Job'}"`,
      data: {
        jobId: job?._id,
        applicationId: application._id
      }
    });
  } catch (e) {
    logger.warn('Could not create employer notification:', e.message);
  }

  logger.info(`✅ Application ${applicationId} status updated to WORKING`);

  res.json({
    success: true,
    message: 'Work started successfully',
    data: application
  });
}));

// Worker Finish - Worker confirms work is done
router.post('/:applicationId/worker-finish', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  logger.info(`✅ Worker Finish request for application: ${applicationId}`);

  const application = await JobApplication.findById(applicationId)
    .populate('job')
    .populate('worker')
    .populate('employer');

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  if (application.status !== 'working') {
    throw new ValidationError(`Cannot finish work. Current status: ${application.status}. Must be 'working'.`);
  }

  // Mark worker as confirmed finish and set status to PAYMENT_PENDING in Firestore
  const statusHistoryEntry = {
    status: 'PAYMENT_PENDING',
    changedAt: admin.firestore.FieldValue.serverTimestamp(),
    note: 'Worker confirmed work is complete'
  };

  await db.collection('applications').doc(applicationId).update({
    status: 'PAYMENT_PENDING',
    workerConfirmedFinish: true,
    workerConfirmedFinishAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await db.collection('applications').doc(applicationId).collection('statusHistory').add(statusHistoryEntry);

  // Also update the associated Job's status to PAYMENT_PENDING in Firestore
  const jobId = application.job._id || application.job;
  if (jobId) {
    await db.collection('jobs').doc(jobId).update({
      status: 'PAYMENT_PENDING',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    logger.info(`✅ Job ${jobId} status updated to PAYMENT_PENDING in Firestore`);
  }

  // Notify employer that worker finished
  const Notification = require('../models/Notification');
  const job = application.job;

  try {
    await Notification.create({
      recipient: application.employer._id || application.employer,
      recipientModel: 'Employer',
      sender: application.worker._id || application.worker,
      senderModel: 'Worker',
      type: 'work_finished_worker',
      title: '✅ Work Completed!',
      message: `${application.worker?.name || 'Worker'} marked work as complete for "${job?.title || 'Job'}"`,
      data: {
        jobId: job?._id,
        applicationId: application._id,
        workerId: application.worker._id || application.worker
      }
    });
    logger.info('Notification sent to employer about worker finish');
  } catch (e) {
    logger.warn('Could not create employer notification:', e.message);
  }

  logger.info(`✅ Worker confirmed finish for application ${applicationId}`);

  res.json({
    success: true,
    message: 'Work marked as complete. Waiting for employer confirmation.',
    data: application
  });
}));

// Employer Finish - Employer confirms + pays additional charges
router.post('/:applicationId/employer-finish', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { additionalCharges = 0 } = req.body;

  logger.info(`💰 Employer Finish request for application: ${applicationId}, additionalCharges: ${additionalCharges}`);

  const application = await JobApplication.findById(applicationId)
    .populate('job')
    .populate('worker')
    .populate('employer');

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  if (application.status !== 'PAYMENT_PENDING') {
    throw new ValidationError(`Cannot complete work. Current status: ${application.status}. Must be 'PAYMENT_PENDING'.`);
  }

  if (!application.workerConfirmedFinish) {
    throw new ValidationError('Worker has not confirmed work completion yet.');
  }

  // Update application in Firestore
  const statusHistoryEntry = {
    status: 'completed',
    changedAt: admin.firestore.FieldValue.serverTimestamp(),
    note: `Job completed. Additional charges: ₹${additionalCharges}`
  };

  await db.collection('applications').doc(applicationId).update({
    status: 'completed',
    employerConfirmedFinish: true,
    employerConfirmedFinishAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    additionalCharges: additionalCharges,
    totalPayment: (application.baseAmount || 0) + additionalCharges,
    ...(additionalCharges > 0 && {
      additionalChargesPaid: true,
      additionalChargesPaidAt: admin.firestore.FieldValue.serverTimestamp()
    }),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await db.collection('applications').doc(applicationId).collection('statusHistory').add(statusHistoryEntry);

  // Update job status in Firestore
  const jobId = application.job._id || application.job;
  if (jobId) {
    await db.collection('jobs').doc(jobId).update({
      status: 'COMPLETED',
      workerStatus: 'completed',
      employerStatus: 'completed',
      additionalCharges: additionalCharges,
      totalPayment: (application.baseAmount || 0) + additionalCharges,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    logger.info(`✅ Job ${jobId} status updated to COMPLETED in Firestore`);
  }

  // Credit additional charges to worker wallet
  if (additionalCharges > 0) {
    try {
      const worker = await Worker.findById(application.worker._id || application.worker);
      if (worker) {
        worker.balance = (worker.balance || 0) + additionalCharges;
        worker.pendingBalance = (worker.pendingBalance || 0) + additionalCharges;
        await worker.save();
        logger.info(`✅ Worker wallet credited with ₹${additionalCharges}. New balance: ₹${worker.balance}`);
      }
    } catch (e) {
      logger.error('Error updating worker wallet:', e.message);
    }
  }

  // Send notifications
  const Notification = require('../models/Notification');

  // Notify worker about completion and additional payment
  try {
    await Notification.create({
      recipient: application.worker._id || application.worker,
      recipientModel: 'Worker',
      sender: application.employer._id || application.employer,
      senderModel: 'Employer',
      type: additionalCharges > 0 ? 'additional_payment' : 'job_completed',
      title: additionalCharges > 0 ? '💰 Additional Payment Received!' : '🎉 Job Completed!',
      message: additionalCharges > 0
        ? `Received ₹${additionalCharges} additional payment for "${job?.title || 'Job'}"`
        : `Job "${job?.title || 'Job'}" is now complete!`,
      data: {
        jobId: job?._id,
        applicationId: application._id,
        additionalCharges: additionalCharges
      }
    });
  } catch (e) {
    logger.warn('Could not create worker notification:', e.message);
  }

  // Notify employer about completion
  try {
    await Notification.create({
      recipient: application.employer._id || application.employer,
      recipientModel: 'Employer',
      type: 'job_completed',
      title: '🎉 Job Completed!',
      message: `Job "${job?.title || 'Job'}" is now complete!${additionalCharges > 0 ? ` Additional payment: ₹${additionalCharges}` : ''}`,
      data: {
        jobId: job?._id,
        applicationId: application._id,
        additionalCharges: additionalCharges
      }
    });
  } catch (e) {
    logger.warn('Could not create employer notification:', e.message);
  }

  logger.info(`✅ Application ${applicationId} COMPLETED with ₹${additionalCharges} additional charges`);

  res.json({
    success: true,
    message: 'Job completed successfully',
    data: {
      application,
      additionalCharges,
      totalPayment: application.totalPayment
    }
  });
}));

module.exports = router;