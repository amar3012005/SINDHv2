# SINDH Platform - Comprehensive Context Documentation

## 🏗️ Project Overview

**SINDH** (formerly I N D U S) is a digital platform designed to empower rural workforce by connecting workers with employment opportunities. The platform serves as a bridge between rural workers and employers, focusing on daily wage work and local employment opportunities.

**Tagline**: "Empowering Rural Workforce"

## 🏛️ Architecture Overview

### Frontend (React.js)
- **Framework**: React 18 with React Router v7
- **Styling**: Tailwind CSS with Framer Motion animations
- **State Management**: React Context API
- **Internationalization**: react-i18next (English & Hindi)
- **Authentication**: Firebase + JWT
- **Notifications**: Twilio, MessageBird, EmailJS

### Backend (Node.js/Express)
- **Framework**: Express.js with MongoDB
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **Validation**: express-validator
- **Logging**: Winston
- **Deployment**: Render.com

## 🎯 Core Features

### 1. **User Management**
- **Worker Registration**: Multi-step form + Chat-based registration
- **Employer Registration**: Business profile creation
- **Authentication**: Phone-based OTP (test code: 0000)
- **Profile Management**: Complete profiles with verification

### 2. **Job Management**
- **Job Posting**: Employers can post detailed job requirements
- **Job Search**: Location and skill-based job matching
- **Job Applications**: Workers can apply to jobs
- **Application Tracking**: Status tracking for both parties

### 3. **Shakti Score System**
- **Trust Rating**: Worker reliability scoring (0-100 points)
- **Score Components**:
  - Basic Information: 25 points
  - Skills & Experience: 30 points
  - Languages: 15 points
  - Location: 15 points
  - Work Preferences: 10 points
  - Verification: 5 points

### 4. **Advanced Features**
- **Chat Registration**: WhatsApp-like conversational registration
- **Multi-language Support**: English and Hindi
- **Real-time Notifications**: SMS and in-app notifications
- **Location-based Matching**: Geospatial job matching
- **Mobile Responsive**: Works on all devices

## 📁 Project Structure

```
SINDHv2/
├── SINDH-frontend/          # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── worker/     # Worker-specific components
│   │   │   ├── employer/   # Employer-specific components
│   │   │   └── jobs/       # Job-related components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── services/       # API service functions
│   └── public/             # Static assets
├── SINDHbackend/           # Node.js backend application
│   └── server/
│       └── src/
│           ├── controllers/ # Route controllers
│           ├── models/      # MongoDB schemas
│           ├── routes/      # API routes
│           ├── middleware/  # Custom middleware
│           └── services/    # Business logic
└── improvements_journal/   # Development documentation
```

## 🔧 Key Components

### Frontend Components

#### Authentication
- `Login.jsx`: Phone-based OTP authentication
- `Registration.jsx`: Unified registration entry
- `WorkerRegistration.jsx`: Multi-step worker registration
- `EmployerRegistration.jsx`: Employer registration

#### Worker Features
- `ChatRegistration.jsx`: Conversational registration interface
- `WorkerProfile.jsx`: Worker profile management
- `FindWork.jsx`: Job search interface
- `MyApplications.jsx`: Application tracking

#### Employer Features
- `PostJob.jsx`: Job posting interface
- `PostedJobs.jsx`: Employer's posted jobs
- `EmployerProfile.jsx`: Employer profile management

#### Job Management
- `AvailableJobs.jsx`: Job listings with filtering
- `JobDetails.jsx`: Detailed job information
- `JobApplicationStatus.jsx`: Application status tracking

### Backend Models

#### Worker Schema
```javascript
{
  name: String,
  age: Number,
  phone: String,
  aadharNumber: String,
  skills: [String],
  experience: String,
  location: {
    village: String,
    district: String,
    state: String,
    pincode: String
  },
  shaktiScore: Number,
  verificationStatus: String
}
```

#### Job Schema
```javascript
{
  title: String,
  description: String,
  location: {
    address: String,
    coordinates: [Number]
  },
  requiredSkills: [String],
  salary: {
    min: Number,
    max: Number,
    type: String
  },
  employerId: ObjectId,
  status: String
}
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Workers
- `GET /api/workers` - Get all workers
- `GET /api/workers/:id` - Get worker by ID
- `POST /api/workers` - Create worker profile
- `PUT /api/workers/:id` - Update worker profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Job Applications
- `POST /api/job-applications` - Apply for job
- `GET /api/job-applications/:userId` - Get user applications
- `PUT /api/job-applications/:id` - Update application status

## 🔐 Authentication Flow

1. **Login Process**:
   - User selects type (Worker/Employer)
   - Enters phone number
   - Receives OTP (test: 0000)
   - Verifies OTP

2. **Post-Login Routing**:
   - **Existing Users**: Redirect to homepage
   - **New Users**: Redirect to appropriate registration

3. **Registration Flow**:
   - Phone number pre-filled from login
   - Multi-step form or chat-based registration
   - Profile creation with Shakti Score calculation

## 🌍 Internationalization

### Supported Languages
- **English (en)**: Default language
- **Hindi (hi)**: Complete translation set

### Translation Structure
```
translation.json
├── nav.*          # Navigation items
├── login.*        # Login page text
├── home.*         # Homepage content
├── jobs.*         # Job-related text
├── skills.*       # Skills categories
└── common.*       # Common UI elements
```

## 🚀 Development Setup

### Frontend Setup
```bash
cd SINDH-frontend
npm install
npm start
```

### Backend Setup
```bash
cd SINDHbackend
npm install
npm run dev
```

### Environment Variables

#### Frontend (.env)
```env
REACT_APP_API_URL=https://sindh-backend.onrender.com/api
REACT_APP_FIREBASE_CONFIG=your_firebase_config
```

#### Backend (.env)
```env
PORT=10000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 🧪 Testing

### Test Credentials
- **OTP Code**: 0000 (for all phone numbers)
- **Test Phone**: Any valid Indian phone number

### Test Scenarios
1. **New Worker Registration**: Complete registration flow
2. **New Employer Registration**: Business profile creation
3. **Job Posting**: Create and manage job postings
4. **Job Application**: Apply and track applications
5. **Profile Management**: Update worker/employer profiles

## 🔧 Recent Fixes & Improvements

### Authentication Issues
- ✅ Fixed "Accept Job" button visibility
- ✅ Enhanced user context management
- ✅ Improved login-to-registration flow
- ✅ Added robust error handling

### Path Configuration
- ✅ Resolved Node.js PATH issues on Windows
- ✅ Created backup startup scripts
- ✅ Permanent PATH configuration

### Translation System
- ✅ Implemented react-i18next
- ✅ Added Hindi language support
- ✅ Created language switcher component
- ✅ Migrated all components to use translations

## 📋 Current Status

### ✅ Completed Features
- User authentication and registration
- Job posting and application system
- Profile management for workers and employers
- Shakti Score calculation
- Multi-language support
- Chat-based registration
- Real-time notifications
- Mobile responsive design

### 🔄 In Progress
- Enhanced job matching algorithms
- Advanced analytics dashboard
- Performance optimization
- Security improvements

### 📋 Planned Features
- Voice input for registration
- AI-powered job recommendations
- Advanced worker verification
- Payment integration
- Offline support

## 🛠️ Development Guidelines

### Code Organization
- Component-based architecture
- Modular routing
- Context-based state management
- Utility functions for common operations

### Security Best Practices
- JWT authentication
- Input validation with express-validator
- Secure password handling
- XSS protection
- CORS configuration

### Performance Considerations
- Lazy loading for components
- Image optimization
- API response caching
- Database indexing

## 🚨 Known Issues & Solutions

### Common Issues
1. **"Accept Job" button not visible**
   - Solution: Ensure user is logged in as worker
   - Check localStorage for correct user type

2. **npm not recognized**
   - Solution: Use provided startup scripts
   - Run PATH fix script if needed

3. **Translation not working**
   - Solution: Check i18n configuration
   - Verify translation files exist

### Debug Tools
- `AuthDebugger.jsx`: Real-time auth state visualization
- Browser console logs for detailed debugging
- Network tab for API request monitoring

## 📞 Support & Maintenance

### Key Files for Reference
- `CONTEXT.md`: Original project context
- `fix-summary.md`: Recent bug fixes
- `CHAT_REGISTRATION.md`: Chat feature documentation
- `LOGIN-REGISTRATION-FLOW.md`: Auth flow details
- `TRANSLATION_SETUP.md`: i18n implementation

### Development Scripts
- `start-app.bat`: Windows batch startup script
- `start-app.ps1`: PowerShell startup script
- `fix-nodejs-path-clean.ps1`: PATH fix script

This comprehensive context serves as a complete reference for understanding, developing, and maintaining the SINDH platform. All key information has been consolidated for easy access during future development sessions. 