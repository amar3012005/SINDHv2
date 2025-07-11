import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mobile app imports
import mobileService from './services/mobileService';
import './styles/mobile.css';

// Context Providers
import { UserProvider } from './context/UserContext';

// Components
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import Login from './components/Login';
import Registration from './components/auth/Registration';
import AvailableJobs from './components/jobs/AvailableJobs';
import JobDetails from './components/jobs/JobDetails';

// Worker Components
import WorkerProfile from './components/worker/WorkerProfile';
import WorkerRegistration from './components/worker/WorkerRegistration';
import ChatRegistration from './components/worker/ChatRegistration';
import RegistrationChoice from './components/worker/RegistrationChoice';
import MyApplications from './components/jobs/MyApplications';

// Employer Components
import EmployerProfile from './components/employer/EmployerProfile';
import EmployerRegistration from './components/employer/EmployerRegistration';
import EmployerChatRegistration from './components/employer/EmployerChatRegistration';
import EmployerRegistrationChoice from './components/employer/EmployerRegistrationChoice';
import PostJob from './components/employer/PostJob';
import PostedJobs from './components/employer/PostedJobs';
import JobChatPosting from './components/employer/JobChatPosting';
import ChatMode from './components/ChatMode';
import ChatBotPopup from './components/ChatBotPopup';

function App() {
  useEffect(() => {
    // Initialize mobile service when app starts
    if (mobileService.isMobile()) {
      console.log('Running on mobile platform:', mobileService.getPlatform());
      document.body.classList.add('capacitor-app');
    }
  }, []);

  return (
    <UserProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/jobs" element={<AvailableJobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            
            {/* Registration Routes */}
            <Route path="/worker/register" element={<RegistrationChoice />} />
            <Route path="/worker/form-register" element={<WorkerRegistration />} />
            <Route path="/worker/chat-register" element={<ChatRegistration />} />
            <Route path="/employer/register" element={<EmployerRegistrationChoice />} />
            <Route path="/employer/form-register" element={<EmployerRegistration />} />
            <Route path="/employer/chat-register" element={<EmployerChatRegistration />} />
            
            {/* Worker Routes */}
            <Route path="/worker/profile" element={<WorkerProfile />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/worker/applications" element={<MyApplications />} />
            
            {/* Employer Routes */}
            <Route path="/employer/profile" element={<EmployerProfile />} />
            <Route path="/employer/post-job" element={<PostJob />} />
            <Route path="/employer/posted-jobs" element={<PostedJobs />} />
            <Route path="/employer/post-job/chat" element={<JobChatPosting />} />
            
            {/* Chat Mode Route */}
            <Route path="/chat-mode" element={<ChatMode />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Chat Bot Popup - Appears on all pages except chat mode */}
          <ChatBotPopup />
          
          <ToastContainer />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
