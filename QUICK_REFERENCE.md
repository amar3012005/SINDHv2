# SINDH Platform - Quick Reference

## 🚀 Quick Start

### Frontend
```bash
cd SINDH-frontend
npm start
# Runs on http://localhost:3000
```

### Backend
```bash
cd SINDHbackend
npm run dev
# Runs on http://localhost:10000
```

## 🔑 Test Credentials
- **OTP Code**: `0000` (for all phone numbers)
- **Test Phone**: Any valid Indian phone number (e.g., 9876543210)

## 📱 Key Routes

### Public Routes
- `/` - Homepage
- `/login` - Authentication
- `/register` - Registration choice

### Worker Routes
- `/worker/register` - Registration choice (form vs chat)
- `/worker/form-register` - Traditional registration
- `/worker/chat-register` - Chat-based registration
- `/worker/profile` - Worker profile
- `/my-applications` - Job applications

### Employer Routes
- `/employer/register` - Employer registration
- `/employer/post-job` - Post new job
- `/employer/posted-jobs` - View posted jobs

### Job Routes
- `/jobs` - Available jobs
- `/job-categories` - Job categories

## 🔧 Environment Variables

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:10000/api
REACT_APP_FIREBASE_CONFIG=your_firebase_config
```

### Backend (.env)
```env
PORT=10000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 🛠️ Common Issues & Solutions

### 1. "Accept Job" button not visible
- **Check**: User logged in as worker
- **Fix**: Verify localStorage has `userType: 'worker'`

### 2. npm not recognized
- **Fix**: Use `start-app.bat` or `start-app.ps1`
- **Alternative**: Run PATH fix script

### 3. Translation not working
- **Check**: i18n configuration in `src/i18n.js`
- **Verify**: Translation files in `public/locales/`

## 📋 Key Components

### Authentication
- `Login.jsx` - Phone OTP authentication
- `WorkerRegistration.jsx` - Worker registration
- `EmployerRegistration.jsx` - Employer registration

### Job Management
- `AvailableJobs.jsx` - Job listings
- `PostJob.jsx` - Job posting
- `MyApplications.jsx` - Application tracking

### Profile Management
- `WorkerProfile.jsx` - Worker profile
- `EmployerProfile.jsx` - Employer profile

## 🔗 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - Login
- `GET /api/jobs` - Get jobs
- `POST /api/jobs` - Create job
- `GET /api/workers` - Get workers
- `POST /api/workers` - Create worker

## 🎯 Shakti Score Components
- Basic Information: 25 points
- Skills & Experience: 30 points
- Languages: 15 points
- Location: 15 points
- Work Preferences: 10 points
- Verification: 5 points
- **Total**: Up to 100 points

## 🌍 Languages
- **English (en)** - Default
- **Hindi (hi)** - Complete translation

## 📞 Support Files
- `COMPREHENSIVE_CONTEXT.md` - Complete documentation
- `CONTEXT.md` - Original project context
- `fix-summary.md` - Recent bug fixes
- `CHAT_REGISTRATION.md` - Chat feature docs
- `TRANSLATION_SETUP.md` - i18n implementation

## 🚨 Emergency Scripts
```bash
# Start frontend with PATH fix
SINDH-frontend/start-app.bat

# Fix Node.js PATH issues
powershell -ExecutionPolicy Bypass -File "SINDH-frontend/fix-nodejs-path-clean.ps1"
``` 