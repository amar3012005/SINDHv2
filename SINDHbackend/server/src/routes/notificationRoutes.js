const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const Worker = require('../models/Worker');
const Job = require('../models/Job');
const Employer = require('../models/Employer');

// Send SMS notification
router.post('/sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    const response = await NotificationService.sendSMS(to, message);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Make a missed call
router.post('/missed-call', async (req, res) => {
  try {
    const { to } = req.body;
    const response = await NotificationService.makeMissedCall(to);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notify worker about new job
router.post('/worker/job-alert', async (req, res) => {
  try {
    const { workerId, jobId } = req.body;
    
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await NotificationService.notifyWorkerAboutJob(worker, job);
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notify employer about worker application
router.post('/employer/application-alert', async (req, res) => {
  try {
    const { employerId, workerId, jobId } = req.body;
    
    const employer = await Employer.findById(employerId);
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await NotificationService.notifyEmployerAboutApplication(employer, worker, job);
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notify worker about application status
router.post('/worker/status-update', async (req, res) => {
  try {
    const { workerId, jobId, status } = req.body;
    
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await NotificationService.notifyWorkerAboutStatus(worker, job, status);
    res.json({ message: 'Status notification sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send job reminder to worker
router.post('/worker/job-reminder', async (req, res) => {
  try {
    const { workerId, jobId } = req.body;
    
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await NotificationService.sendJobReminder(worker, job);
    res.json({ message: 'Reminder sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 