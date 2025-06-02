const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Employer = require('../models/Employer');
const NotificationService = require('../services/NotificationService');

// Apply for a job
router.post('/apply', async (req, res) => {
  try {
    const { jobId, workerId } = req.body;

    // Check if application already exists
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      worker: workerId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Get job details to get employer ID
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = new JobApplication({
      job: jobId,
      worker: workerId,
      employer: job.employer,
      status: 'pending'
    });

    await application.save();

    // Send notification to employer
    await NotificationService.sendNotification({
      recipient: job.employer,
      type: 'new_application',
      message: 'New job application received',
      data: {
        jobId,
        workerId,
        applicationId: application._id
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get applications for a worker
router.get('/worker/:workerId', async (req, res) => {
  try {
    const applications = await JobApplication.find({ worker: req.params.workerId })
      .populate('job')
      .populate('employer', 'company.name')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching worker applications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get applications for an employer
router.get('/employer/:employerId', async (req, res) => {
  try {
    const applications = await JobApplication.find({ employer: req.params.employerId })
      .populate('job')
      .populate('worker', 'name skills')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching employer applications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update application status
router.patch('/:applicationId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const application = await JobApplication.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Validate status transition
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Handle special status transitions
    if (status === 'completed' && application.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted jobs can be marked as completed' });
    }

    // Update status and related fields
    application.status = status;
    application.updatedAt = new Date();
    
    if (status === 'completed') {
      application.completedAt = new Date();
    }
    
    await application.save();

    // Send notification to worker
    await NotificationService.sendNotification({
      recipient: application.worker,
      type: 'application_update',
      message: `Your job application has been ${status}`,
      data: {
        jobId: application.job,
        applicationId: application._id
      }
    });

    res.json(application);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current (active) jobs for a worker
router.get('/worker/:workerId/current', async (req, res) => {
  try {
    const applications = await JobApplication.find({
      worker: req.params.workerId,
      status: { $in: ['pending', 'accepted'] }
    })
      .populate('job')
      .populate('employer', 'company.name')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching current jobs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get past (completed) jobs for a worker
router.get('/worker/:workerId/past', async (req, res) => {
  try {
    const applications = await JobApplication.find({
      worker: req.params.workerId,
      status: 'completed'
    })
      .populate('job')
      .populate('employer', 'company.name')
      .sort({ updatedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching past jobs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark job as completed
router.patch('/:applicationId/complete', async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted jobs can be marked as completed' });
    }

    application.status = 'completed';
    application.completedAt = new Date();
    await application.save();

    // Send notification to employer
    await NotificationService.sendNotification({
      recipient: application.employer,
      type: 'job_completed',
      message: 'A worker has marked a job as completed',
      data: {
        jobId: application.job,
        applicationId: application._id,
        completedAt: application.completedAt
      }
    });

    res.json(application);
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;