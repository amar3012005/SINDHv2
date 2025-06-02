const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-testing';

const employerSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  name: {
    type: String,
    required: true
  },
  company: {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: ''
    },
    industry: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    registrationNumber: {
      type: String,
      default: ''
    }
  },
  location: {
    village: String,
    district: String,
    state: String,
    pincode: String,
    address: String
  },
  businessDescription: String,
  verificationDocuments: {
    aadharNumber: String,
    panNumber: String,
    businessLicense: String
  },
  documents: [{
    type: String,
    url: String
  }],
  preferredLanguages: [String],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker'
    },
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  postedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  isLoggedIn: {
    type: Number,
    default: 0
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a geospatial index on the location field
employerSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-save middleware to update timestamps
employerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// OTP methods
employerSchema.methods.generateOTP = async function() {
  const employer = this;
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set OTP and expiry (5 minutes from now)
  employer.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  };
  
  await employer.save();
  return otp;
};

employerSchema.methods.verifyOTP = async function(otpToVerify) {
  const employer = this;
  
  if (!employer.otp || !employer.otp.code || !employer.otp.expiresAt) {
    throw new Error('No OTP found');
  }
  
  if (Date.now() > employer.otp.expiresAt) {
    // Clear expired OTP
    employer.otp = { code: null, expiresAt: null };
    await employer.save();
    throw new Error('OTP has expired');
  }
  
  if (employer.otp.code !== otpToVerify) {
    throw new Error('Invalid OTP');
  }
  
  // Clear used OTP
  employer.otp = { code: null, expiresAt: null };
  await employer.save();
  return true;
};

employerSchema.methods.generateAuthToken = async function() {
  const employer = this;
  const token = jwt.sign(
    { _id: employer._id.toString(), role: 'employer' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return token;
};

// Remove sensitive data from JSON responses
employerSchema.methods.toJSON = function() {
  const employer = this;
  const employerObject = employer.toObject();
  delete employerObject.otp;
  return employerObject;
};

const Employer = mongoose.model('Employer', employerSchema);

module.exports = Employer; 