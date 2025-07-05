const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxLength: [200, 'Job title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxLength: [2000, 'Job description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: {
      values: ['Agriculture', 'Construction', 'Domestic', 'Manufacturing', 'Transportation', 'Retail', 'Food Service', 'General'],
      message: 'Please select a valid category'
    }
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [100, 'Salary must be at least ₹100'],
    max: [100000, 'Salary cannot exceed ₹100,000']
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: [true, 'Employer is required']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      default: 'onsite'
    },
    street: String,
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
    }
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Daily wage'],
    default: 'Full-time'
  },
  skillsRequired: [{
    type: String,
    trim: true
  }],
  requirements: {
    type: String,
    default: 'Basic requirements apply'
  },
  status: {
    type: String,
    enum: ['active', 'in-progress', 'completed', 'cancelled'],
    default: 'active'
  },
  urgency: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  startDate: Date,
  endDate: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Text search index
jobSchema.index({
  title: 'text',
  description: 'text',
  category: 'text'
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;