const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const NotificationService = require('../services/notificationService');
const logger = require('../config/logger');

// Apply for a job
router.post('/apply', async (req, res) => {
  logger.info('Job application request');
  try {
    const { jobId, workerId, workerDetails } = req.body;

    if (!jobId || !workerId) {
      logger.warn('Missing required fields for job application', { jobId: !!jobId, workerId: !!workerId });
      return res.status(400).json({
        success: false,
        message: 'Job ID and Worker ID are required'
      });
    }

    const job = await Job.findById(jobId).populate('employer');
    if (!job) {
      logger.warn(`Job not found for application: ${jobId}`);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'active') {
      logger.warn(`Job not active for application: ${job.status}`);
      return res.status(400).json({
        success: false,
        message: 'Job is no longer accepting applications'
      });
    }

    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      logger.warn(`Worker not found in database for ID: ${workerId}. Proceeding with workerDetails from request.`);
      
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        logger.warn(`Invalid ObjectId format for workerId: ${workerId}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid worker ID format'
        });
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
        appliedAt: new Date()
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
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
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
      status: 'pending',
      workerDetails: sanitizedWorkerDetails,
      appliedAt: new Date()
    };

    const application = new JobApplication(applicationData);
    await application.save();
    logger.info(`Application saved successfully: ${application._id}`);

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
      data: application
    });

  } catch (error) {
    logger.error('Error creating job application:', { message: error.message, stack: error.stack });
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => {
        return `${key}: ${error.errors[key].message}`;
      }).join(', ');
      
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${validationErrors}`,
        error: process.env.NODE_ENV === 'development' ? error.errors : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new job application (simplified, assuming 'apply' is the main one)
router.post('/', async (req, res) => {
  logger.info('Creating new job application (simplified endpoint)');
  try {
    const { job, worker, employer, workerDetails } = req.body;
    
    const existingApplication = await JobApplication.findOne({
      job: job,
      worker: worker
    });
    
    if (existingApplication) {
      logger.warn(`Worker ${worker} already applied for job ${job} via simplified endpoint`);
      return res.status(400).json({ 
        success: false,
        message: 'You have already applied for this job' 
      });
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
    
  } catch (error) {
    logger.error('Error creating job application (simplified):', { message: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get worker's current applications
router.get('/worker/:workerId/current', async (req, res) => {
  try {
    const { workerId } = req.params;

    logger.info(`Fetching current applications for worker: ${workerId}`);

    const applications = await JobApplication.find({ 
      worker: workerId,
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    })
    .populate('job')
    .populate('worker')
    .sort({ appliedAt: -1 });

    logger.info(`Found ${applications.length} current applications for worker ${workerId}`);

    res.json({
      success: true,
      data: applications,
      count: applications.length
    });

  } catch (error) {
    logger.error('Error fetching worker current applications:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get worker's completed applications (Past Jobs)
router.get('/worker/:workerId/completed', async (req, res) => {
  try {
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

  } catch (error) {
    logger.error('Error fetching completed applications for worker:', { 
      message: error.message, 
      stack: error.stack 
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed applications',
      data: []
    });
  }
});

// Get applications for a specific job
router.get('/job/:jobId', async (req, res) => {
  try {
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
    
  } catch (error) {
    logger.error('Error fetching job applications for job:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job applications',
      data: []
    });
  }
});

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

// Update application status (for employers)
router.patch('/:applicationId/status', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    logger.info(`Updating application ${applicationId} status to: ${status}`);

    const validStatuses = ['pending', 'accepted', 'rejected', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      logger.warn(`Invalid status provided for application ${applicationId}: ${status}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      applicationId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate(['job', 'worker']);

    if (!application) {
      logger.warn(`Application not found for status update: ${applicationId}`);
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const employer = await Employer.findById(application.job.employer);
    if (!employer) {
      logger.warn(`Employer not found for job ${application.job.employer} during notification`);
    }

    try {
      switch (status) {
        case 'accepted':
          await NotificationService.notifyApplicationAccepted(application, application.job, employer);
          logger.info('Acceptance notification sent to worker');
          break;
        
        case 'rejected':
          await NotificationService.notifyApplicationRejected(application, application.job, employer);
          logger.info('Rejection notification sent to worker');
          break;
        
        case 'in-progress':
          await NotificationService.notifyJobStarted(application, application.job, employer);
          logger.info('Job started notification sent to worker');
          break;
        
        case 'completed':
          await NotificationService.notifyJobCompleted(application, application.job, employer);
          logger.info('Job completed notification sent to worker');
          break;
      }
    } catch (notificationError) {
      logger.error('Error sending notification:', notificationError);
    }

    logger.info(`Application status updated successfully: ${applicationId}`);

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: application
    });

  } catch (error) {
    logger.error('Error updating application status:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update job application status with improved worker balance sync
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, paymentAmount, notes } = req.body;
    const applicationId = req.params.id;
    
    logger.info(`Updating application ${applicationId} status to: ${status}`);
    
    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('worker');
    
    if (!application) {
      logger.warn(`Application not found for status update: ${applicationId}`);
      return res.status(404).json({ message: 'Application not found' });
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
    
  } catch (error) {
    logger.error('Error updating application status:', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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