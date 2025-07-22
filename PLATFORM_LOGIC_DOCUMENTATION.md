# SINDH Platform - Complete Logic Documentation

## 🏗️ **PLATFORM ARCHITECTURE**

### **Technology Stack**
- **Frontend**: React.js with Capacitor (Mobile App)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **Authentication**: Phone-based OTP system
- **Deployment**: Render (Backend) + Netlify (Frontend)

### **Core Components**
```
SINDH Platform
├── Frontend (React + Capacitor)
│   ├── User Authentication
│   ├── Worker Management
│   ├── Employer Management
│   ├── Job Management
│   ├── Application System
│   └── Payment System
├── Backend (Node.js + Express)
│   ├── API Routes
│   ├── Database Models
│   ├── Business Logic
│   └── External Integrations
└── Database (MongoDB)
    ├── Users Collection
    ├── Jobs Collection
    ├── Applications Collection
    └── Payments Collection
```

---

## 👥 **USER MANAGEMENT LOGIC**

### **User Types & Roles**
1. **Worker** - Job seekers who apply for positions
2. **Employer** - Job posters who create job listings
3. **Guest** - Unauthenticated users browsing jobs

### **Authentication Flow**
```
1. User selects type (Worker/Employer)
2. Enters phone number
3. Receives OTP (test: 0000)
4. Verifies OTP
5. Account created/authenticated
6. Redirected to appropriate dashboard
```

### **User Data Structure**
```javascript
// Worker Profile
{
  _id: ObjectId,
  name: String,
  phone: String,
  type: "worker",
  location: {
    village: String,
    district: String,
    state: String,
    pincode: String
  },
  skills: [String],
  experience: String,
  shaktiScore: Number,
  rating: {
    average: Number,
    count: Number
  },
  verificationStatus: String,
  isAvailable: Boolean
}

// Employer Profile
{
  _id: ObjectId,
  name: String,
  phone: String,
  type: "employer",
  company: {
    name: String,
    type: String,
    industry: String
  },
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  businessDescription: String,
  rating: {
    average: Number,
    count: Number
  }
}
```

---

## 💼 **JOB MANAGEMENT LOGIC**

### **Job Creation Flow**
```
1. Employer logs in
2. Navigates to "Post Job"
3. Fills job details form
4. System validates required fields
5. Job saved to database
6. Job appears in Available Jobs
7. Workers can view and apply
```

### **Job Data Structure**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  employer: ObjectId (ref: Employer),
  companyName: String,
  location: {
    type: String, // "onsite", "remote"
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  salary: Number,
  category: String,
  employmentType: String, // "Full-time", "Part-time"
  skillsRequired: [String],
  requirements: String,
  status: String, // "active", "in-progress", "completed"
  urgency: String, // "Normal", "Urgent"
  startDate: Date,
  endDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **Job Filtering Logic**
```javascript
// Available Jobs Filtering
const filters = {
  location: String,      // City/State search
  category: String,      // Job category
  minSalary: Number,     // Minimum salary
  employmentType: String, // Full-time/Part-time
  status: "active,in-progress" // Only active jobs
}

// Backend Query Logic
const query = {
  status: { $in: ['active', 'in-progress'] },
  ...(location && { $or: [
    { 'location.state': { $regex: location, $options: 'i' } },
    { 'location.city': { $regex: location, $options: 'i' } }
  ]}),
  ...(category && { category: { $regex: category, $options: 'i' } }),
  ...(minSalary && { salary: { $gte: minSalary } })
}
```

---

## 📝 **APPLICATION SYSTEM LOGIC**

### **Application Flow**
```
1. Worker browses Available Jobs
2. Clicks "Apply" on desired job
3. System checks if already applied
4. Creates application record
5. Notifies employer
6. Employer reviews application
7. Employer accepts/rejects
8. Worker notified of decision
```

### **Application Data Structure**
```javascript
{
  _id: ObjectId,
  job: ObjectId (ref: Job),
  worker: ObjectId (ref: Worker),
  employer: ObjectId (ref: Employer),
  status: String, // "pending", "accepted", "rejected", "in-progress", "completed"
  workerDetails: {
    name: String,
    phone: String,
    skills: [String],
    experience: String
  },
  applicationDetails: {
    appliedAt: Date,
    message: String
  },
  employerResponse: {
    respondedAt: Date,
    message: String
  },
  paymentStatus: String, // "pending", "completed"
  paymentAmount: Number,
  paymentDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **Application Status Workflow**
```
pending → accepted → in-progress → completed
     ↓
  rejected
```

---

## 💰 **PAYMENT SYSTEM LOGIC**

### **Payment Flow**
```
1. Job application accepted
2. Worker completes job
3. Employer marks job as completed
4. System calculates payment amount
5. Payment processed
6. Worker receives payment
7. Payment status updated
```

### **Payment Data Structure**
```javascript
{
  _id: ObjectId,
  application: ObjectId (ref: JobApplication),
  worker: ObjectId (ref: Worker),
  employer: ObjectId (ref: Employer),
  amount: Number,
  status: String, // "pending", "processing", "completed", "failed"
  paymentMethod: String,
  transactionId: String,
  processedAt: Date,
  createdAt: Date
}
```

---

## 🎯 **SHAKTI SCORE SYSTEM**

### **Scoring Logic**
```javascript
const calculateShaktiScore = (workerData) => {
  let score = 0;
  
  // Basic Information (25 points)
  if (workerData.name) score += 5;
  if (workerData.email) score += 5;
  if (workerData.phone) score += 5;
  if (workerData.location?.state) score += 5;
  if (workerData.aadharNumber) score += 5;

  // Skills & Experience (30 points)
  if (workerData.skills?.length > 0) score += 10;
  if (workerData.experience) score += 5;
  if (workerData.preferredCategory) score += 5;
  if (workerData.expectedSalary) score += 5;
  if (workerData.education) score += 5;

  // Languages (15 points)
  if (workerData.languages?.length > 0) score += 15;

  // Location (15 points)
  if (workerData.location?.state) score += 10;
  if (workerData.location?.pincode) score += 5;

  // Work Preferences (10 points)
  if (workerData.availability) score += 5;
  if (workerData.preferredWorkType) score += 5;

  // Verification (5 points)
  if (workerData.verificationStatus === 'verified') score += 5;

  return Math.min(score, 100); // Max 100 points
};
```

### **Score Impact**
- **High Score (80-100)**: Priority in job matching
- **Medium Score (50-79)**: Standard matching
- **Low Score (0-49)**: Limited job opportunities

---

## 🔍 **JOB MATCHING LOGIC**

### **Matching Algorithm**
```javascript
const matchJobToWorker = (job, worker) => {
  let matchScore = 0;
  
  // Location matching (40 points)
  if (job.location.state === worker.location.state) {
    matchScore += 40;
  } else if (job.location.city === worker.location.city) {
    matchScore += 30;
  }
  
  // Skills matching (30 points)
  const skillMatch = job.skillsRequired.filter(skill => 
    worker.skills.includes(skill)
  ).length;
  matchScore += (skillMatch / job.skillsRequired.length) * 30;
  
  // Salary expectation (20 points)
  if (job.salary >= worker.expectedSalary) {
    matchScore += 20;
  }
  
  // Shakti Score bonus (10 points)
  matchScore += (worker.shaktiScore / 100) * 10;
  
  return matchScore;
};
```

---

## 📊 **NOTIFICATION SYSTEM**

### **Notification Types**
1. **Job Application**: Worker applies for job
2. **Application Status**: Employer accepts/rejects application
3. **Job Completion**: Worker marks job as completed
4. **Payment**: Payment processed successfully
5. **New Job**: New job posted in worker's area

### **Notification Logic**
```javascript
const sendNotification = async (type, userId, data) => {
  const notification = {
    type,
    userId,
    data,
    read: false,
    createdAt: new Date()
  };
  
  await Notification.create(notification);
  
  // Real-time notification (if WebSocket available)
  if (io) {
    io.to(userId).emit('notification', notification);
  }
};
```

---

## 🔐 **SECURITY & VALIDATION**

### **Input Validation**
```javascript
// Job Creation Validation
const validateJob = (jobData) => {
  const errors = [];
  
  if (!jobData.title) errors.push('Job title is required');
  if (!jobData.employer) errors.push('Employer ID is required');
  if (!jobData.location?.city) errors.push('Location is required');
  if (!jobData.salary || jobData.salary < 0) errors.push('Valid salary is required');
  
  return errors;
};

// Application Validation
const validateApplication = (applicationData) => {
  const errors = [];
  
  if (!applicationData.job) errors.push('Job ID is required');
  if (!applicationData.worker) errors.push('Worker ID is required');
  
  return errors;
};
```

### **Authentication Middleware**
```javascript
const authenticateUser = async (req, res, next) => {
  const userType = req.headers['user-type'];
  const userId = req.headers['user-id'];
  
  if (!userType || !userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Verify user exists and type matches
  const user = await User.findById(userId);
  if (!user || user.type !== userType) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  req.user = user;
  next();
};
```

---

## 🌐 **API ENDPOINTS LOGIC**

### **Core Endpoints**
```
Authentication:
POST /api/auth/login - User login with OTP
POST /api/auth/verify-otp - Verify OTP
POST /api/auth/register - User registration

Workers:
GET /api/workers - Get all workers
GET /api/workers/:id - Get worker by ID
POST /api/workers - Create worker
PUT /api/workers/:id - Update worker
GET /api/workers/:id/wallet - Get worker wallet
GET /api/workers/:id/stats - Get worker statistics

Employers:
GET /api/employers - Get all employers
GET /api/employers/:id - Get employer by ID
POST /api/employers - Create employer
PUT /api/employers/:id - Update employer
GET /api/employers/:id/stats - Get employer statistics

Jobs:
GET /api/jobs - Get all jobs (with filters)
POST /api/jobs - Create new job
GET /api/jobs/:id - Get job by ID
PUT /api/jobs/:id - Update job
DELETE /api/jobs/:id - Delete job
GET /api/jobs/count - Get job count
GET /api/jobs/recent - Get recent jobs
GET /api/jobs/employer/:id - Get employer's jobs
GET /api/jobs/worker/:id/completed - Get worker's completed jobs

Applications:
POST /api/job-applications - Apply for job
GET /api/job-applications/:id - Get application by ID
PUT /api/job-applications/:id/status - Update application status
GET /api/job-applications/worker/:id/current - Get worker's current applications
GET /api/job-applications/worker/:id/completed - Get worker's completed applications
GET /api/job-applications/job/:id - Get applications for a job

Payments:
POST /api/payments/process - Process payment
GET /api/payments/:id - Get payment by ID
GET /api/payments/worker/:id - Get worker's payments
```

---

## 📱 **MOBILE APP LOGIC**

### **Capacitor Integration**
```javascript
// Mobile-specific logic
const isMobileApp = () => {
  return !!(window.Capacitor || window.cordova);
};

// Platform detection
const getPlatform = () => {
  if (window.Capacitor) {
    return window.Capacitor.getPlatform();
  }
  return 'web';
};

// Push notifications
const setupPushNotifications = async () => {
  if (isMobileApp()) {
    const { PushNotifications } = window.Capacitor.Plugins;
    await PushNotifications.requestPermissions();
    await PushNotifications.register();
  }
};
```

---

## 🔄 **STATE MANAGEMENT LOGIC**

### **Frontend State Structure**
```javascript
// User Context
const UserContext = {
  user: {
    id: String,
    type: String, // "worker" | "employer"
    name: String,
    phone: String,
    location: Object,
    shaktiScore: Number
  },
  isLoading: Boolean,
  isAuthenticated: Boolean
};

// Job Context
const JobContext = {
  jobs: Array,
  filteredJobs: Array,
  loading: Boolean,
  error: String,
  filters: Object
};

// Application Context
const ApplicationContext = {
  applications: Array,
  currentApplication: Object,
  loading: Boolean,
  error: String
};
```

---

## 📈 **ANALYTICS & REPORTING**

### **Key Metrics**
```javascript
const calculatePlatformMetrics = async () => {
  const metrics = {
    totalUsers: await User.countDocuments(),
    totalWorkers: await Worker.countDocuments(),
    totalEmployers: await Employer.countDocuments(),
    totalJobs: await Job.countDocuments(),
    activeJobs: await Job.countDocuments({ status: 'active' }),
    totalApplications: await JobApplication.countDocuments(),
    completedJobs: await JobApplication.countDocuments({ status: 'completed' }),
    totalPayments: await Payment.countDocuments(),
    averageShaktiScore: await Worker.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$shaktiScore' } } }
    ])
  };
  
  return metrics;
};
```

---

## 🚀 **DEPLOYMENT LOGIC**

### **Environment Configuration**
```javascript
// Development
NODE_ENV=development
API_URL=https://sindh-backend.onrender.com/api
MONGODB_URL=mongodb://localhost:27017/sindh

// Production
NODE_ENV=production
API_URL=https://sindh-backend.onrender.com/api
MONGODB_URL=mongodb+srv://...
```

### **Build Process**
```bash
# Frontend Build
npm run build
npx cap sync
npx cap build android
npx cap build ios

# Backend Deployment
npm run start
# Auto-deploys to Render
```

---

## 🔧 **ERROR HANDLING LOGIC**

### **Error Categories**
1. **Validation Errors**: Invalid input data
2. **Authentication Errors**: Unauthorized access
3. **Database Errors**: Connection/query failures
4. **Network Errors**: API communication issues
5. **Business Logic Errors**: Invalid state transitions

### **Error Handling Strategy**
```javascript
const handleError = (error, req, res) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'MongoError') {
    return res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};
```

---

## 📋 **BUSINESS RULES**

### **Job Posting Rules**
1. Only authenticated employers can post jobs
2. Job title and location are required
3. Salary must be positive number
4. Duplicate jobs within 5 minutes are prevented
5. Jobs are active by default

### **Application Rules**
1. Workers can only apply once per job
2. Applications require worker details
3. Employers can accept/reject applications
4. Completed jobs cannot be applied to again

### **Payment Rules**
1. Payments only for completed jobs
2. Payment amount equals job salary
3. Payment status tracked throughout process
4. Failed payments can be retried

### **User Rules**
1. One account per phone number
2. Profile completion increases Shakti score
3. Verified users get priority
4. Inactive users are marked unavailable

---

## 🔮 **FUTURE ENHANCEMENTS**

### **Planned Features**
1. **Real-time Chat**: Worker-Employer communication
2. **Video Calls**: Interview scheduling
3. **Document Upload**: Resume/CV management
4. **Advanced Analytics**: Detailed reporting
5. **Multi-language Support**: Hindi/English
6. **Offline Mode**: Basic functionality without internet
7. **Push Notifications**: Real-time updates
8. **Payment Gateway**: Direct bank transfers

### **Scalability Considerations**
1. **Database Indexing**: Optimize queries
2. **Caching**: Redis for frequent data
3. **Load Balancing**: Multiple server instances
4. **CDN**: Static asset delivery
5. **Monitoring**: Performance tracking
6. **Backup**: Automated data backup

---

This documentation provides a comprehensive overview of the SINDH platform's logic, architecture, and business rules. It serves as a reference for development, maintenance, and future enhancements. 