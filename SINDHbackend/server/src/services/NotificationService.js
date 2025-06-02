class NotificationService {
  constructor() {
    // Always use development mode for now
    this.isDevelopment = true;
  }

  // Send SMS notification
  async sendSMS(to, message) {
    if (!to || !message) {
      throw new Error('Phone number and message are required for SMS notification');
    }

    console.log('\n=== SMS Notification ===');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('========================');
    return { status: 'success', development: true };
  }

  // Make a missed call
  async makeMissedCall(to) {
    if (!to) {
      throw new Error('Phone number is required for missed call notification');
    }

    console.log('\n=== Missed Call Notification ===');
    console.log(`To: ${to}`);
    console.log('==============================');
    return { status: 'success', development: true };
  }

  // Notify worker about new job
  async notifyWorkerAboutJob(worker, job) {
    if (!worker || !job) {
      throw new Error('Worker and job details are required for job notification');
    }

    console.log('\n=== Job Alert Notification ===');
    console.log(`To: ${worker.name} (${worker.phone})`);
    console.log(`Type: New Job Opportunity`);
    console.log(`Job: ${job.title}`);
    console.log(`Location: ${job.location.city}, ${job.location.state}`);
    console.log(`Salary: ₹${job.salary} per day`);
    console.log(`Duration: ${job.duration}`);
    console.log('============================');
    
    // Send SMS
    await this.sendSMS(
      worker.phone, 
      `New job alert! ${job.title} in ${job.location.city}. Salary: ₹${job.salary} per day. Duration: ${job.duration}. Reply YES to apply.`
    );
    
    // In development mode, send missed call immediately
    if (this.isDevelopment) {
      await this.makeMissedCall(worker.phone);
    } else {
      // In production, we would handle this differently
      setTimeout(async () => {
        await this.makeMissedCall(worker.phone);
      }, 1000);
    }

    return { status: 'success', notifications: ['sms', 'missed-call'] };
  }

  // Notify employer about worker application
  async notifyEmployerAboutApplication(employer, worker, job) {
    if (!employer || !worker || !job) {
      throw new Error('Employer, worker, and job details are required for application notification');
    }

    console.log('\n=== Application Alert Notification ===');
    console.log(`To: ${employer.name} (${employer.phone})`);
    console.log(`Type: New Job Application`);
    console.log(`Job: ${job.title}`);
    console.log(`Applicant: ${worker.name}`);
    console.log(`Skills: ${worker.skills.join(', ')}`);
    console.log(`Experience: ${worker.experience_years} years`);
    console.log('====================================');
    
    await this.sendSMS(
      employer.phone,
      `New application! ${worker.name} has applied for your job: ${job.title}. Check your dashboard for details.`
    );

    return { status: 'success', notifications: ['sms'] };
  }

  // Notify worker about application status
  async notifyWorkerAboutStatus(worker, job, status) {
    if (!worker || !job || !status) {
      throw new Error('Worker, job, and status details are required for status notification');
    }

    console.log('\n=== Application Status Notification ===');
    console.log(`To: ${worker.name} (${worker.phone})`);
    console.log(`Type: Application Status Update`);
    console.log(`Job: ${job.title}`);
    console.log(`Status: ${status}`);
    console.log('=====================================');

    const message = status === 'accepted'
      ? `Congratulations! You've been selected for the job: ${job.title}. Please check your dashboard for details.`
      : `Update on your application for ${job.title}: Your application was not selected this time. Keep applying!`;

    await this.sendSMS(worker.phone, message);
    return { status: 'success', notifications: ['sms'] };
  }

  // Remind worker about upcoming job
  async sendJobReminder(worker, job) {
    if (!worker || !job) {
      throw new Error('Worker and job details are required for job reminder');
    }

    console.log('\n=== Job Reminder Notification ===');
    console.log(`To: ${worker.name} (${worker.phone})`);
    console.log(`Type: Job Start Reminder`);
    console.log(`Job: ${job.title}`);
    console.log(`Location: ${job.location.city}, ${job.location.state}`);
    console.log(`Duration: ${job.duration}`);
    console.log('================================');

    await this.sendSMS(
      worker.phone,
      `Reminder: Your job ${job.title} starts tomorrow at ${job.location.city}. Don't forget!`
    );

    return { status: 'success', notifications: ['sms'] };
  }
}

module.exports = new NotificationService(); 