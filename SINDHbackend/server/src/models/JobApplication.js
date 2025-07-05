const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  rating: {
    worker: {
      score: { type: Number, min: 0, max: 5 },
      feedback: String,
      givenAt: Date
    },
    employer: {
      score: { type: Number, min: 0, max: 5 },
      feedback: String,
      givenAt: Date
    }
  },
  notes: {
    type: String
  },
  paymentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  jobCompletedDate: {
    type: Date
  },
  workerDetails: {
    name: String,
    phone: String,
    skills: [String],
    rating: Number
  },
  applicationDetails: {
    appliedAt: {
      type: Date,
      default: Date.now
    },
    notes: String,
    expectedSalary: Number,
    availability: {
      startDate: Date,
      preferredTime: String
    }
  },
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
}, {
  timestamps: true
});

// Update the updatedAt timestamp before saving
jobApplicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set appropriate timestamps based on status changes
  if (this.isModified('status')) {
    switch (this.status) {
      case 'accepted':
        this.acceptedAt = Date.now();
        break;
      case 'completed':
        this.completedAt = Date.now();
        break;
    }
  }
  
  next();
});

// Add pre-save middleware to track status changes
jobApplicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      note: `Status changed to ${this.status}`
    });
  }
  next();
});

// Create compound index to prevent duplicate applications
jobApplicationSchema.index({ job: 1, worker: 1 }, { unique: true });

// Add a pre-find middleware to automatically populate and filter out null jobs
jobApplicationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'job',
    select: 'title companyName location salary category description status'
  });
  next();
});

// Add a method to clean up orphaned applications
jobApplicationSchema.statics.cleanupOrphanedApplications = async function() {
  try {
    const orphanedApps = await this.find({ job: null });
    if (orphanedApps.length > 0) {
      console.log(`Found ${orphanedApps.length} orphaned applications, cleaning up...`);
      await this.deleteMany({ job: null });
      console.log('Orphaned applications cleaned up successfully');
    }
  } catch (error) {
    console.error('Error cleaning up orphaned applications:', error);
  }
};

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;