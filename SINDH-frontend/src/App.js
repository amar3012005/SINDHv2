import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mobile app imports
import mobileService from './services/mobileService';
import './styles/mobile.css';

// Context Providers
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';

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
import MyApplications from './components/worker/MyApplications';

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
import GreetingPage from './components/GreetingPage';
import Walkthrough from './components/Walkthrough';

// Main App Wrapper to handle routing and providers

function AppWrapper() {
  const location = useLocation();
  const isGreetingPage = location.pathname === '/greeting';
  // Use a single login_status state for all routing logic
  // 1 = logged in, 0 = not logged in (default)
  // Initialize login_status to 0 if not set
  if (!localStorage.getItem('login_status')) {
    localStorage.setItem('login_status', '0');
  }
  const login_status = parseInt(localStorage.getItem('login_status'), 10);
  const hasSeenGreeting = localStorage.getItem('hasSeenGreeting') === 'true';
  const hasCompletedWalkthrough = localStorage.getItem('hasCompletedWalkthrough') === 'true';

  // Set body class based on route
  useEffect(() => {
    if (mobileService.isMobile()) {
      console.log('Running on mobile platform:', mobileService.getPlatform());
      document.body.classList.add('capacitor-app');
    }
  }, []);



  return (
    <div className="App">
      {!isGreetingPage && <Navbar />}
      <Routes>
        {/* Root route - If user is logged in, go to homepage. If not, check greeting/walkthrough */}
        <Route 
          path="/" 
          element={
            login_status === 1
              ? <Homepage />
              : !hasSeenGreeting
                ? <Navigate to="/greeting" replace />
                : !hasCompletedWalkthrough
                  ? <Navigate to="/walkthrough" replace />
                  : <Homepage />
          } 
        />
        {/* Greeting Page Route - Only for not logged in users */}
        <Route 
          path="/greeting" 
          element={
            login_status === 1
              ? <Navigate to="/" replace />
              : hasSeenGreeting
                ? <Navigate to="/" replace />
                : <GreetingPage />
          } 
        />
        {/* Walkthrough Route - Only for not logged in users */}
        <Route 
          path="/walkthrough" 
          element={
            login_status === 1
              ? <Navigate to="/" replace />
              : !hasSeenGreeting
                ? <Navigate to="/greeting" replace />
                : hasCompletedWalkthrough
                  ? <Navigate to="/" replace />
                  : <Walkthrough />
          } 
        />
        
        {/* Public Routes */}
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
        <Route path="/worker/applications" element={<MyApplications />} />
        
        {/* Employer Routes */}
        <Route path="/employer/profile" element={<EmployerProfile />} />
        <Route path="/employer/post-job" element={<PostJob />} />
        <Route path="/employer/posted-jobs" element={<PostedJobs />} />
        <Route path="/employer/post-job/chat" element={<JobChatPosting />} />
        
        {/* Chat Mode Route */}
        <Route path="/chat-mode" element={<ChatMode />} />
        
        {/* Catch all route - Defensive: use user/isLoadingUser/flags */}
        <Route 
          path="*" 
          element={
            login_status === 1
              ? <Navigate to="/" replace />
              : !hasSeenGreeting
                ? <Navigate to="/greeting" replace />
                : !hasCompletedWalkthrough
                  ? <Navigate to="/walkthrough" replace />
                  : <Navigate to="/" replace />
          } 
        />
      </Routes>
      
      {/* Chat Bot Popup - Appears on all pages except chat mode and greeting page */}
      {!isGreetingPage && (
        <>
          <ChatBotPopup />
          <ToastContainer />
        </>
      )}
    </div>
  );
}

// Main App component with providers
function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <Router>
          <AppWrapper />
        </Router>
      </LanguageProvider>
    </UserProvider>
  );
}

export default App;
