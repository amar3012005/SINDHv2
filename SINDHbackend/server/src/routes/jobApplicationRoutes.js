const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const NotificationService = require('../services/notificationService');

// Apply for a job
router.post('/apply', async (req, res) => {
  console.log('\n=== Job Application Request ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Body:', JSON.stringify(req.body, null, 2));

  try {
    const { jobId, workerId, workerDetails } = req.body;

    // Validate required fields
    if (!jobId || !workerId) {
      console.log('❌ Missing required fields:', { jobId: !!jobId, workerId: !!workerId });
      return res.status(400).json({
        success: false,
        message: 'Job ID and Worker ID are required'
      });
    }

    console.log('✅ Required fields validated');

    // Check if job exists and is active
    const job = await Job.findById(jobId).populate('employer');
    if (!job) {
      console.log('❌ Job not found:', jobId);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    console.log('✅ Job found:', {
      id: job._id,
      title: job.title,
      status: job.status,
      employer: job.employer?._id || 'No employer'
    });

    if (job.status !== 'active') {
      console.log('❌ Job not active:', job.status);
      return res.status(400).json({
        success: false,
        message: 'Job is no longer accepting applications'
      });
    }

    // Check if worker exists - with more debugging
    console.log('Looking for worker with ID:', workerId);
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      console.log('❌ Worker not found in database. Checking if workerId is valid ObjectId...');
      
      // Check if the workerId is a valid ObjectId format
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(workerId)) {
        console.log('❌ Invalid ObjectId format for workerId:', workerId);
        return res.status(400).json({
          success: false,
          message: 'Invalid worker ID format'
        });
      }
      
      // Try to find any worker to see if collection exists
      const anyWorker = await Worker.findOne({});
      console.log('Total workers in database:', await Worker.countDocuments());
      console.log('Sample worker (if any):', anyWorker ? { id: anyWorker._id, name: anyWorker.name } : 'No workers found');
      
      // Since worker doesn't exist, let's create application without strict worker validation
      console.log('⚠️ Worker not found but proceeding with application using workerDetails from request');
      
      // Use workerDetails from request since worker doesn't exist in DB
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

      // Get employer ID
      const employerId = job.employer?._id || job.employer || '000000000000000000000000';
      console.log('Using employer ID:', employerId);

      // Create application data
      const applicationData = {
        job: jobId,
        worker: workerId, // Keep the workerId even if worker doesn't exist
        employer: employerId,
        status: 'pending',
        workerDetails: sanitizedWorkerDetails,
        appliedAt: new Date()
      };

      console.log('Creating application with data:', JSON.stringify(applicationData, null, 2));

      const application = new JobApplication(applicationData);
      
      console.log('Attempting to save application...');
      await application.save();
      console.log('✅ Application saved successfully:', application._id);

      // Populate job details for response (worker might not exist)
      await application.populate('job');
      console.log('✅ Application populated with job details');

      console.log('✅ Job application process completed successfully (worker not in DB but using workerDetails)');

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application,
        note: 'Worker not found in database but application created with provided details'
      });
    }

    console.log('✅ Worker found:', {
      id: worker._id,
      name: worker.name
    });

    // Check if worker already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      worker: workerId
    });

    if (existingApplication) {
      console.log('❌ Worker already applied:', existingApplication._id);
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    console.log('✅ No existing application found');

    // Get employer ID
    const employerId = job.employer?._id || job.employer || '000000000000000000000000';
    console.log('Using employer ID:', employerId);

    // Sanitize workerDetails using both worker from DB and request
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

    console.log('Sanitized worker details:', sanitizedWorkerDetails);

    // Create application data
    const applicationData = {
      job: jobId,
      worker: workerId,
      employer: employerId,
      status: 'pending',
      workerDetails: sanitizedWorkerDetails,
      appliedAt: new Date()
    };

    console.log('Creating application with data:', JSON.stringify(applicationData, null, 2));

    const application = new JobApplication(applicationData);
    
    console.log('Attempting to save application...');
    await application.save();
    console.log('✅ Application saved successfully:', application._id);

    // Populate job and worker details for response
    await application.populate(['job', 'worker']);
    console.log('✅ Application populated with job and worker details');

    // Try to get employer details
    let employer = null;
    if (job.employer) {
      try {
        employer = await Employer.findById(job.employer);
        console.log('✅ Employer details fetched:', employer?.name || 'No name');
      } catch (empError) {
        console.log('⚠️ Could not fetch employer details:', empError.message);
      }
    }

    // Send notification to employer (if employer exists)
    if (employer) {
      try {
        await NotificationService.notifyNewApplication(
          application, 
          application.job, 
          application.worker, 
          employer
        );
        console.log('✅ New application notification sent to employer');
      } catch (notificationError) {
        console.error('⚠️ Error sending notification:', notificationError);
      }
    }

    console.log('✅ Job application process completed successfully');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('❌ Error creating job application:', error);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.log('❌ Validation error details:', error.errors);
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

// Create a new job application
router.post('/', async (req, res) => {
  try {
    const { job, worker, employer, workerDetails } = req.body;
    
    console.log('Creating new job application:', { job, worker, employer });
    
    // Check if application already exists
    const existingApplication = await JobApplication.findOne({
      job: job,
      worker: worker
    });
    
    if (existingApplication) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already applied for this job' 
      });
    }
    
    // Create new application
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
    
    console.log('Job application created successfully:', application._id);
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: application
    });
    
  } catch (error) {
    console.error('Error creating job application:', error);
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

    console.log('Fetching applications for worker:', workerId);

    const applications = await JobApplication.find({ 
      worker: workerId,
      status: { $in: ['pending', 'accepted', 'in-progress'] }
    })
    .populate('job')
    .populate('worker')
    .sort({ appliedAt: -1 });

    console.log(`Found ${applications.length} current applications`);

    res.json({
      success: true,
      data: applications,
      count: applications.length
    });

  } catch (error) {
    console.error('Error fetching worker applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get applications for a specific job
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log('Fetching applications for job:', jobId);
    
    const applications = await JobApplication.find({
      job: jobId
    })
    .populate('worker', 'name phone email skills experience')
    .populate('employer', 'name companyName')
    .sort({ createdAt: -1 });
    
    console.log(`Found ${applications.length} applications for job ${jobId}`);
    
    res.json({
      success: true,
      count: applications.length,
      data: applications
    });
    
  } catch (error) {
    console.error('Error fetching job applications:', error);
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

    console.log('Cancelling application:', applicationId);

    const application = await JobApplication.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Only allow cancellation if status is pending or accepted
    if (!['pending', 'accepted'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel application in current status'
      });
    }

    await JobApplication.findByIdAndDelete(applicationId);

    console.log('✓ Application cancelled successfully');

    res.json({
      success: true,
      message: 'Application cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling application:', error);
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

    console.log('Updating application status:', { applicationId, status });

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
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
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get employer details
    const employer = await Employer.findById(application.job.employer);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Employer not found'
      });
    }

    // Send notifications based on status change
    try {
      switch (status) {
        case 'accepted':
          await NotificationService.notifyApplicationAccepted(application, application.job, employer);
          console.log('✓ Acceptance notification sent to worker');
          break;
        
        case 'rejected':
          await NotificationService.notifyApplicationRejected(application, application.job, employer);
          console.log('✓ Rejection notification sent to worker');
          break;
        
        case 'in-progress':
          await NotificationService.notifyJobStarted(application, application.job, employer);
          console.log('✓ Job started notification sent to worker');
          break;
        
        case 'completed':
          await NotificationService.notifyJobCompleted(application, application.job, employer);
          console.log('✓ Job completed notification sent to worker');
          break;
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }

    console.log('✓ Application status updated successfully');

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: application
    });

  } catch (error) {
    console.error('Error updating application status:', error);
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
    
    console.log(`Updating application ${applicationId} status to: ${status}`);
    
    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('worker');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    console.log('Application details:', {
      id: application._id,
      currentStatus: application.status,
      worker: application.worker?._id || 'No worker populated',
      job: application.job?._id || 'No job populated'
    });
    
    // Update application status
    const oldStatus = application.status;
    application.status = status;
    
    // Add to status history
    application.statusHistory.push({
      status: status,
      changedAt: new Date(),
      note: notes || `Status changed from ${oldStatus} to ${status}`
    });
    
    // If job is being marked as completed, process payment automatically
    if (status === 'completed' && oldStatus !== 'completed') {
      console.log('Job marked as completed, processing payment...');
      
      const finalPaymentAmount = paymentAmount || application.job?.salary || 15000;
      
      // Update payment fields
      application.paymentAmount = finalPaymentAmount;
      application.paymentStatus = 'paid';
      application.paymentDate = new Date();
      application.jobCompletedDate = new Date();
      
      console.log(`Setting payment amount to: ₹${finalPaymentAmount}`);
      
      await application.save();
      
      // Update worker balance using improved logic
      await updateWorkerBalance(application.worker._id || application.worker);
      
      // Check if this job should be marked as completed
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
    console.error('Error updating application status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper function to update job status when all applications are completed
async function updateJobStatusIfCompleted(jobId) {
  try {
    const Job = require('../models/Job');
    
    // Get the job
    const job = await Job.findById(jobId);
    if (!job) {
      console.error('Job not found for ID:', jobId);
      return;
    }
    
    console.log(`Checking if job ${job.title} should be marked as completed`);
    
    // Get all applications for this job
    const allApplications = await JobApplication.find({ job: jobId });
    
    if (allApplications.length === 0) {
      console.log('No applications found for job');
      return;
    }
    
    // Check application statuses
    const acceptedApplications = allApplications.filter(app => 
      ['accepted', 'in-progress', 'completed'].includes(app.status)
    );
    
    const completedApplications = allApplications.filter(app => app.status === 'completed');
    
    console.log(`Job ${job.title} status check:`, {
      totalApplications: allApplications.length,
      acceptedApplications: acceptedApplications.length,
      completedApplications: completedApplications.length,
      currentJobStatus: job.status
    });
    
    // If there are accepted applications and all of them are completed, mark job as completed
    if (acceptedApplications.length > 0 && 
        completedApplications.length === acceptedApplications.length && 
        job.status !== 'completed') {
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.updatedAt = new Date();
      
      await job.save();
      
      console.log(`✅ Job ${job.title} marked as completed - all accepted applications are done`);
    } else {
      console.log(`Job ${job.title} remains ${job.status} - not all applications completed yet`);
    }
    
  } catch (error) {
    console.error('Error updating job status:', error);
  }
}

// Helper function to update worker balance
async function updateWorkerBalance(workerId) {
  try {
    const Worker = require('../models/Worker');
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      console.error('Worker not found for ID:', workerId);
      return;
    }
    
    // Get all completed paid applications for this worker
    const completedApplications = await JobApplication.find({
      worker: workerId,
      status: 'completed',
      paymentStatus: 'paid'
    }).populate('job');
    
    console.log(`Found ${completedApplications.length} completed paid applications for worker`);
    
    // Calculate total earnings
    const totalEarned = completedApplications.reduce((sum, app) => {
      const amount = app.paymentAmount || app.job?.salary || 0;
      console.log(`  - ${app.job?.title}: ₹${amount}`);
      return sum + amount;
    }, 0);
    
    // Calculate total withdrawn
    const totalWithdrawn = (worker.withdrawals || []).reduce((sum, w) => sum + w.amount, 0);
    
    // Update worker balance and earnings
    worker.balance = totalEarned - totalWithdrawn;
    worker.earnings = completedApplications.map(app => ({
      jobId: app.job._id,
      amount: app.paymentAmount || app.job?.salary || 0,
      description: `Payment for: ${app.job?.title || 'Job'}`,
      date: app.paymentDate || app.updatedAt
    }));
    
    await worker.save();
    
    console.log(`✅ Worker balance updated: ${worker.name} - ₹${worker.balance}`);
    
  } catch (error) {
    console.error('Error updating worker balance:', error);
  }
}

// Process payment for existing completed job - ENHANCED
router.patch('/:id/process-payment', async (req, res) => {
  try {
    const { paymentAmount } = req.body;
    const applicationId = req.params.id;
    
    console.log(`Processing payment for application ${applicationId}`);
    console.log('Request body:', req.body);
    
    const application = await JobApplication.findById(applicationId)
      .populate('job')
      .populate('worker');
    
    if (!application) {
      console.log('Application not found:', applicationId);
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
    console.log('Processing payment amount:', finalPaymentAmount);
    
    // Update application payment status
    application.paymentStatus = 'paid';
    application.paymentAmount = finalPaymentAmount;
    application.paymentDate = new Date();
    
    await application.save();
    console.log('Application payment status updated');
    
    // Find and update worker balance
    await updateWorkerBalanceForPayment(application, finalPaymentAmount);
    
    // Check if job should be marked as completed after payment
    await updateJobStatusIfCompleted(application.job._id);
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      application: application
    });
    
  } catch (error) {
    console.error('Error processing payment:', error);
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
    
    // First try the worker field
    if (application.worker && application.worker._id) {
      correctWorker = await Worker.findById(application.worker._id);
      console.log('Found worker by ID:', correctWorker?.name);
    }
    
    // If not found or if worker phone doesn't match, find by phone
    if (!correctWorker || 
        (application.workerDetails?.phone && correctWorker.phone !== application.workerDetails.phone)) {
      
      console.log('Looking for worker by phone number:', application.workerDetails?.phone);
      
      if (application.workerDetails?.phone) {
        correctWorker = await Worker.findOne({ 
          phone: application.workerDetails.phone 
        });
        
        if (correctWorker) {
          console.log(`Found correct worker by phone: ${correctWorker.name} (${correctWorker._id})`);
          
          // Update the application with correct worker ID
          application.worker = correctWorker._id;
          application.workerDetails.name = correctWorker.name;
          await application.save();
          console.log('Updated application with correct worker ID');
        }
      }
    }
    
    if (!correctWorker) {
      console.error('Could not find worker for payment');
      return;
    }
    
    // Update worker balance immediately
    console.log(`Updating balance for worker: ${correctWorker.name}`);
    console.log(`Current balance: ₹${correctWorker.balance || 0}`);
    
    // Initialize fields if needed
    if (typeof correctWorker.balance !== 'number') {
      correctWorker.balance = 0;
    }
    if (!Array.isArray(correctWorker.earnings)) {
      correctWorker.earnings = [];
    }
    if (!Array.isArray(correctWorker.withdrawals)) {
      correctWorker.withdrawals = [];
    }
    
    // Check if this payment already exists
    const existingEarning = correctWorker.earnings.find(earning => 
      earning.jobId && earning.jobId.toString() === application.job._id.toString()
    );
    
    if (!existingEarning) {
      // Add to balance
      correctWorker.balance += finalPaymentAmount;
      
      // Add to earnings
      correctWorker.earnings.push({
        jobId: application.job._id,
        amount: finalPaymentAmount,
        description: `Payment for: ${application.job?.title || 'Job'}`,
        date: application.paymentDate || new Date()
      });
      
      await correctWorker.save();
      
      console.log(`✅ Worker balance updated: ${correctWorker.name} - New balance: ₹${correctWorker.balance}`);
    } else {
      console.log('Payment already exists in worker earnings');
    }
    
  } catch (error) {
    console.error('Error updating worker balance for payment:', error);
  }
}

// Manual endpoint to process all pending payments for completed jobs
router.post('/process-all-completed-payments/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    
    console.log('Processing all completed payments for worker:', workerId);
    
    // Find all completed applications with pending payments
    const completedApplications = await JobApplication.find({
      worker: workerId,
      status: 'completed',
      paymentStatus: { $in: ['pending', null] }
    }).populate('job');
    
    console.log(`Found ${completedApplications.length} completed jobs with pending payments`);
    
    if (completedApplications.length === 0) {
      return res.json({
        success: true,
        message: 'No pending payments found',
        processed: 0
      });
    }
    
    let totalProcessed = 0;
    let totalAmount = 0;
    
    // Process each application
    for (const application of completedApplications) {
      const paymentAmount = application.job?.salary || 300; // Default to job salary or 300
      
      // Update payment status
      application.paymentStatus = 'paid';
      application.paymentAmount = paymentAmount;
      application.paymentDate = new Date();
      
      await application.save();
      
      totalProcessed++;
      totalAmount += paymentAmount;
      
      console.log(`Processed payment for job: ${application.job?.title} - ₹${paymentAmount}`);
    }
    
    // Now sync the worker balance
    const Worker = require('../models/Worker');
    const worker = await Worker.findById(workerId);
    
    if (worker) {
      // Recalculate total balance from all paid completed jobs
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
      
      console.log(`Worker balance updated to: ₹${worker.balance}`);
    }
    
    res.json({
      success: true,
      message: 'All payments processed successfully',
      processed: totalProcessed,
      totalAmount: totalAmount,
      newBalance: worker?.balance || 0
    });
    
  } catch (error) {
    console.error('Error processing payments:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;