const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-testing';

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 70
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{12}$/.test(v);
      },
      message: props => `${props.value} is not a valid Aadhar number! Must be 12 digits.`
    }
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  skills: [{
    type: String,
    required: true
  }],
  location: {
    village: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    }
  },
  language: [{
    type: String,
    required: true
  }],
  experience_years: {
    type: Number,
    default: 0,
    min: 0
  },
  available: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
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

// Create compound index for phone and aadhar
workerSchema.index({ phone: 1, aadharNumber: 1 }, { unique: true });

// Create a geospatial index on the location field
workerSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-save middleware to calculate ShaktiScore
workerSchema.pre('save', function(next) {
  console.log('\nCalculating ShaktiScore for worker:', this.name);

  // Calculate score components
  const skillsScore = this.skills.length * 10;
  const experienceScore = this.experience_years * 5;
  const ageScore = Math.max(0, 50 - Math.abs(this.age - 35)) * 2;
  const languagesScore = this.language.length * 5;
  
  console.log('Score components:', {
    skillsScore,
    experienceScore,
    ageScore,
    languagesScore
  });

  // Calculate total score
  this.rating = skillsScore + experienceScore + ageScore + languagesScore;
  console.log('Final ShaktiScore:', this.rating);
  
  next();
});

// Method to generate auth token
workerSchema.methods.generateAuthToken = async function() {
  console.log('\nGenerating auth token for worker:', this._id);
  const token = jwt.sign(
    { _id: this._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  console.log('Token generated successfully');
  return token;
};

// Validate phone and aadhar uniqueness
workerSchema.pre('save', async function(next) {
  console.log('\nChecking phone and aadhar uniqueness...');
  const existingWorker = await this.constructor.findOne({
    $or: [
      { phone: this.phone },
      { aadharNumber: this.aadharNumber }
    ],
    _id: { $ne: this._id }
  });
  
  if (existingWorker) {
    if (existingWorker.phone === this.phone) {
      console.error('Phone number already exists:', this.phone);
      throw new Error('Phone number already registered');
    }
    if (existingWorker.aadharNumber === this.aadharNumber) {
      console.error('Aadhar number already exists:', this.aadharNumber);
      throw new Error('Aadhar number already registered');
    }
  }
  
  console.log('Phone and Aadhar numbers are unique');
  next();
});

// OTP methods
workerSchema.methods.generateOTP = async function() {
  const worker = this;
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set OTP and expiry (5 minutes from now)
  worker.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  };
  
  await worker.save();
  return otp;
};

workerSchema.methods.verifyOTP = async function(otpToVerify) {
  const worker = this;
  
  if (!worker.otp || !worker.otp.code || !worker.otp.expiresAt) {
    throw new Error('No OTP found');
  }
  
  if (Date.now() > worker.otp.expiresAt) {
    // Clear expired OTP
    worker.otp = { code: null, expiresAt: null };
    await worker.save();
    throw new Error('OTP has expired');
  }
  
  if (worker.otp.code !== otpToVerify) {
    throw new Error('Invalid OTP');
  }
  
  // Clear used OTP
  worker.otp = { code: null, expiresAt: null };
  await worker.save();
  return true;
};

// Remove sensitive data from JSON responses
workerSchema.methods.toJSON = function() {
  const worker = this;
  const workerObject = worker.toObject();
  delete workerObject.otp;
  return workerObject;
};

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker; 