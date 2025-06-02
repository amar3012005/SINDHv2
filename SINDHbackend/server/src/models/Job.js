const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Construction', 'Agriculture', 'Household', 'Transportation', 'Manufacturing', 'Retail']
  },
  location: {
    type: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    }
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  requirements: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  employerName: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for text search
jobSchema.index({
  title: 'text',
  description: 'text',
  category: 'text'
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job; 