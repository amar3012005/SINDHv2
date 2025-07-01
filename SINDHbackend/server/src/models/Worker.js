const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-testing';

const workerSchema = new mongoose.Schema({
  // Personal Information (Step 1)
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
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Accept both formats: +919876543210 or 9876543210
        return /^(\+91)?[6-9]\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  
  // Identity Verification (Step 2)
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
  
  // Skills & Experience (Step 3)
  skills: [{
    type: String,
    required: true
  }],
  experience: {
    type: String,
    required: true,
    enum: ['Less than 1 year', '1-2 years', '3-5 years', '6-10 years', 'More than 10 years']
  },
  preferredCategory: {
    type: String,
    required: true,
    enum: ['Construction', 'Agriculture', 'Household', 'Transportation', 'Manufacturing', 'Retail', 'Other']
  },
  expectedSalary: {
    type: String,
    required: true
  },
  
  // Languages (Step 4)
  languages: [{
    type: String,
    required: true
  }],
  
  // Location Details (Step 5)
  location: {
    address: {
      type: String,
      trim: true
    },
    village: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{6}$/.test(v);
        },
        message: 'Pincode must be 6 digits'
      }
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  
  // Work Preferences (Step 6)
  preferredWorkType: {
    type: String,
    required: true,
    enum: ['Full-time daily work', 'Part-time work', 'Contract work', 'Seasonal work', 'Flexible hours']
  },
  availability: {
    type: String,
    required: true,
    enum: ['Available immediately', 'Available within a week', 'Available within a month', 'Seasonal availability']
  },
  workRadius: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // System fields
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  shaktiScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
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
    },
    reviews: [{
      employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Timestamps
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isLoggedIn: {
    type: Number,
    default: 0
  },
  
  // Profile tracking
  profileCompletionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Work tracking
  activeJobs: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  workHistory: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer'
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'cancelled']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  }],
  
  // Additional fields
  profilePicture: {
    type: String,
    default: ''
  },
  documents: [{
    type: {
      type: String,
      enum: ['aadhar', 'pan', 'license', 'certificate', 'other']
    },
    url: String,
    verified: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  
  // Contact preferences
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: true
  },
  
  // Emergency contact
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },

  // OTP for verification
  otp: {
    code: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
workerSchema.index({ phone: 1 });
workerSchema.index({ aadharNumber: 1 });
workerSchema.index({ 'location.state': 1, 'location.district': 1 });
workerSchema.index({ skills: 1 });
workerSchema.index({ preferredCategory: 1 });
workerSchema.index({ shaktiScore: -1 });
workerSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-save middleware to calculate ShaktiScore and profile completion
workerSchema.pre('save', function(next) {
  console.log('\nCalculating ShaktiScore and profile completion for worker:', this.name);

  let score = 0;
  let completedFields = 0;
  const totalFields = 15; // Total number of profile fields to track
  
  // Personal Information (25 points)
  if (this.name) { score += 5; completedFields++; }
  if (this.age && this.age >= 18) { score += 5; completedFields++; }
  if (this.phone) { score += 5; completedFields++; }
  if (this.email) { score += 3; completedFields++; }
  if (this.gender) { score += 3; completedFields++; }
  if (this.aadharNumber) { score += 4; completedFields++; }

  // Professional Information (30 points)
  if (this.skills && this.skills.length > 0) { score += 10; completedFields++; }
  if (this.skills && this.skills.length >= 3) score += 3; // Bonus for multiple skills
  if (this.experience) { score += 7; completedFields++; }
  if (this.preferredCategory) { score += 5; completedFields++; }
  if (this.expectedSalary) { score += 5; completedFields++; }

  // Communication (15 points)
  if (this.languages && this.languages.length > 0) { score += 8; completedFields++; }
  if (this.languages && this.languages.length >= 2) score += 4; // Bonus for multilingual
  if (this.languages && this.languages.includes('English')) score += 3; // English bonus

  // Location (10 points)
  if (this.location && this.location.village) { score += 3; completedFields++; }
  if (this.location && this.location.district) score += 3;
  if (this.location && this.location.state) score += 2;
  if (this.location && this.location.pincode) score += 2;

  // Work Preferences (10 points)
  if (this.availability) { score += 3; completedFields++; }
  if (this.preferredWorkType) { score += 3; completedFields++; }
  if (this.workRadius) score += 2;
  if (this.bio && this.bio.length > 50) { score += 2; completedFields++; }

  // Additional Information (5 points)
  if (this.documents && this.documents.length > 0) score += 3;
  if (this.emergencyContact && this.emergencyContact.name) score += 2;

  // Performance & Verification (5 points)
  if (this.verificationStatus === 'verified') score += 3;
  if (this.rating && this.rating.average > 0) score += 2;

  this.shaktiScore = Math.min(score, 100); // Cap at 100
  this.profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);
  
  console.log('Score components calculated:', {
    personalInfo: 25,
    professionalInfo: 30,
    communication: 15,
    location: 10,
    workPreferences: 10,
    additional: 5,
    performance: 5
  });
  console.log('Final ShaktiScore:', this.shaktiScore);
  console.log('Profile Completion:', this.profileCompletionPercentage, '%');
  
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