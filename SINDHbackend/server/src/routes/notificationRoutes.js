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

// Get notifications for user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType = 'worker', limit = 20, page = 1 } = req.query;

    const result = await NotificationService.getNotifications(
      userId, 
      userType, 
      parseInt(limit), 
      parseInt(page)
    );

    res.json({
      success: true,
      data: result.notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.totalCount,
        unreadCount: result.unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const notification = await NotificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType = 'worker' } = req.body;

    await NotificationService.markAllAsRead(userId, userType);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Get unread count
router.get('/unread-count/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType = 'worker' } = req.query;

    const result = await NotificationService.getNotifications(userId, userType, 1);

    res.json({
      success: true,
      unreadCount: result.unreadCount
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

module.exports = router;