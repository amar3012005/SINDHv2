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