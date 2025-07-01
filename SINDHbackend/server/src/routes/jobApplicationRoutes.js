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
      return res.status(400).json({
        success: false,
        message: 'Job ID and Worker ID are required'
      });
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Job is no longer accepting applications'
      });
    }

    // Check if worker exists
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Check if worker already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      worker: workerId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create the application
    const application = new JobApplication({
      job: jobId,
      worker: workerId,
      status: 'pending',
      workerDetails: workerDetails || {},
      appliedAt: new Date()
    });

    await application.save();

    // Populate job and worker details
    await application.populate(['job', 'worker']);

    // Get employer details
    const employer = await Employer.findById(application.job.employer);

    // Send notification to employer about new application
    try {
      await NotificationService.notifyNewApplication(
        application, 
        application.job, 
        application.worker, 
        employer
      );
      console.log('✓ New application notification sent to employer');
    } catch (notificationError) {
      console.error('Error sending new application notification:', notificationError);
    }

    console.log('✓ Job application created successfully');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Error creating job application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Get applications for a specific job (for employers)
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    console.log('Fetching applications for job:', jobId);

    // Validate jobId format
    if (!jobId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const applications = await JobApplication.find({ 
      job: jobId
    })
    .populate('worker', 'name phone email skills experience rating location')
    .populate('job', 'title companyName salary')
    .sort({ appliedAt: -1 });

    console.log(`Found ${applications.length} applications for job ${jobId}`);

    // Format the response to include workerDetails for easier frontend access
    const formattedApplications = applications.map(app => {
      const appObj = app.toObject();
      return {
        ...appObj,
        workerDetails: appObj.workerDetails || {
          name: app.worker?.name,
          phone: app.worker?.phone,
          email: app.worker?.email,
          skills: app.worker?.skills || [],
          experience: app.worker?.experience,
          rating: app.worker?.rating?.average || 0,
          location: app.worker?.location
        }
      };
    });

    // Always return data in consistent format
    res.json({
      success: true,
      data: formattedApplications,
      count: formattedApplications.length
    });

  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      data: [], // Return empty array on error
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

module.exports = router;