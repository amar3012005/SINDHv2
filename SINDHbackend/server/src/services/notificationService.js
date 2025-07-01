const Notification = require('../models/Notification');

class NotificationService {
  static async createNotification({
    recipient,
    recipientModel,
    sender = null,
    senderModel = 'System',
    type,
    title,
    message,
    data = {}
  }) {
    try {
      const notification = new Notification({
        recipient,
        recipientModel,
        sender,
        senderModel,
        type,
        title,
        message,
        data,
        isRead: false
      });

      await notification.save();
      console.log('✓ Notification created:', { recipient, type, title });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getNotifications(userId, userType, limit = 20, page = 1) {
    try {
      const skip = (page - 1) * limit;
      
      const notifications = await Notification.find({
        recipient: userId,
        recipientModel: userType === 'worker' ? 'Worker' : 'Employer'
      })
      .populate('data.jobId', 'title companyName')
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        recipientModel: userType === 'worker' ? 'Worker' : 'Employer',
        isRead: false
      });

      return {
        notifications,
        unreadCount,
        totalCount: await Notification.countDocuments({
          recipient: userId,
          recipientModel: userType === 'worker' ? 'Worker' : 'Employer'
        })
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId, userType) {
    try {
      await Notification.updateMany(
        { 
          recipient: userId, 
          recipientModel: userType === 'worker' ? 'Worker' : 'Employer',
          isRead: false 
        },
        { isRead: true, readAt: new Date() }
      );

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Specific notification creators
  static async notifyApplicationAccepted(application, job, employer) {
    return this.createNotification({
      recipient: application.worker,
      recipientModel: 'Worker',
      sender: employer._id,
      senderModel: 'Employer',
      type: 'application_accepted',
      title: 'Application Accepted! 🎉',
      message: `Great news! Your application for "${job.title}" at ${employer.company?.name || employer.name} has been accepted. You can now start working on this job.`,
      data: {
        jobId: job._id,
        applicationId: application._id,
        employerId: employer._id
      }
    });
  }

  static async notifyApplicationRejected(application, job, employer) {
    return this.createNotification({
      recipient: application.worker,
      recipientModel: 'Worker',
      sender: employer._id,
      senderModel: 'Employer',
      type: 'application_rejected',
      title: 'Application Update',
      message: `Thank you for your interest in "${job.title}" at ${employer.company?.name || employer.name}. Unfortunately, your application was not selected this time. Keep applying for other opportunities!`,
      data: {
        jobId: job._id,
        applicationId: application._id,
        employerId: employer._id
      }
    });
  }

  static async notifyJobStarted(application, job, employer) {
    return this.createNotification({
      recipient: application.worker,
      recipientModel: 'Worker',
      sender: employer._id,
      senderModel: 'Employer',
      type: 'job_started',
      title: 'Job Started! 🚀',
      message: `Your work on "${job.title}" has been marked as started by ${employer.company?.name || employer.name}. Good luck with your new assignment!`,
      data: {
        jobId: job._id,
        applicationId: application._id,
        employerId: employer._id
      }
    });
  }

  static async notifyJobCompleted(application, job, employer) {
    return this.createNotification({
      recipient: application.worker,
      recipientModel: 'Worker',
      sender: employer._id,
      senderModel: 'Employer',
      type: 'job_completed',
      title: 'Job Completed! ✅',
      message: `Congratulations! Your work on "${job.title}" has been marked as completed by ${employer.company?.name || employer.name}. Great job!`,
      data: {
        jobId: job._id,
        applicationId: application._id,
        employerId: employer._id
      }
    });
  }

  static async notifyNewApplication(application, job, worker, employer) {
    return this.createNotification({
      recipient: employer._id,
      recipientModel: 'Employer',
      sender: worker._id,
      senderModel: 'Worker',
      type: 'new_application',
      title: 'New Job Application 📋',
      message: `${worker.name} has applied for your job "${job.title}". Review their application and decide whether to accept or reject.`,
      data: {
        jobId: job._id,
        applicationId: application._id,
        workerId: worker._id
      }
    });
  }
}

module.exports = NotificationService;
