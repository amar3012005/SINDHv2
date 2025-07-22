import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { TranslationProvider } from './context/TranslationContext';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import { initializeUserState } from './utils/userInitializer';
import { GlobalStateProvider } from './context/GlobalStateContext';

// Initialize i18n
import './i18n';

// Components
import Homepage from './components/Homepage';
import Navbar from './components/Navbar';
import Registration from './components/Registration';
import UnifiedRegistration from './components/UnifiedRegistration';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GreetingPage from './components/GreetingPage';
import InitialRoute from './components/InitialRoute';

// Worker Components
import WorkerRegistration from './components/worker/WorkerRegistration';
import ChatRegistration from './components/worker/ChatRegistration';
import RegistrationChoice from './components/worker/RegistrationChoice';
import WorkerProfile from './components/worker/WorkerProfile';
import WorkerProfileSimple from './components/worker/WorkerProfileSimple';
import FindWork from './components/worker/FindWork';
import WorkerSearch from './components/worker/WorkerSearch';

// Employer Components
import EmployerRegistration from './components/employer/EmployerRegistration';
import EmployerChatRegistration from './components/employer/EmployerChatRegistration';
import EmployerRegistrationChoice from './components/employer/EmployerRegistrationChoice';
import EmployerProfile from './components/employer/EmployerProfile';
import EmployerProfilePage from './components/employer/EmployerProfilePage';
import PostJob from './components/employer/PostJob';
import EmployerPostJob from './components/EmployerPostJob';
import JobChatPosting from './components/employer/JobChatPosting';
import PostedJobs from './components/employer/PostedJobs';
import PostedJobDetails from './components/employer/PostedJobDetails';

// Job Components
import JobCategories from './components/jobs/JobCategories';
import AvailableJobs from './components/jobs/AvailableJobs';

// New import for MyApplications
import MyApplications from './components/jobs/MyApplications';
import Login from './components/Login';
import TranslationDemo from './components/TranslationDemo';
import ChatMode from './components/ChatMode';

// Import our custom ErrorBoundary component
import ErrorBoundary from './components/ErrorBoundary';

// Remove the import for react-error-boundary

// Add this fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold text-center mb-4">Something went wrong</h2>
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 overflow-auto max-h-40">
          <pre className="text-red-700 text-sm whitespace-pre-wrap">{error.message}</pre>
        </div>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={resetErrorBoundary}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

// Component to conditionally render navbar
const AppContent = () => {
  const location = useLocation();
  const isChatModePage = location.pathname === '/chat-mode';
  const isGreetingPage = location.pathname === '/greeting';
  
  // Check if user has seen greeting
  const hasSeenGreeting = localStorage.getItem('hasSeenGreeting') === 'true';
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!isChatModePage && !isGreetingPage && <Navbar />}
      <main className={isChatModePage || isGreetingPage ? "" : "pt-16"}>
        <AnimatePresence mode="wait">
          <ErrorBoundary fallback={ErrorFallback}>
            <Routes>
              {/* Root route - Redirect based on greeting status */}
              <Route 
                path="/" 
                element={hasSeenGreeting ? <Navigate to="/home" replace /> : <Navigate to="/greeting" replace />} 
              />
              
              {/* Greeting Page Route */}
              <Route 
                path="/greeting" 
                element={
                  hasSeenGreeting 
                    ? <Navigate to="/home" replace /> 
                    : <GreetingPage />
                } 
              />
              
              {/* Public Routes */}
              <Route path="/home" element={<Layout><Homepage /></Layout>} />
              <Route path="/register" element={<Layout><UnifiedRegistration /></Layout>} />
              
              {/* Worker Routes */}
              <Route path="/worker/register" element={<Layout><RegistrationChoice /></Layout>} />
              <Route path="/worker/form-register" element={<Layout><WorkerRegistration /></Layout>} />
              <Route path="/worker/chat-register" element={<Layout><ChatRegistration /></Layout>} />
              <Route path="/worker/profile" element={<Layout><WorkerProfile /></Layout>} />
              <Route path="/worker/profile-simple" element={<Layout><WorkerProfileSimple /></Layout>} />
              <Route path="/worker/find-work" element={<Layout><FindWork /></Layout>} />
              <Route path="/worker/search" element={<Layout><WorkerSearch /></Layout>} />
              
              {/* Employer Routes */}
              <Route path="/employer/register" element={<Layout><EmployerRegistrationChoice /></Layout>} />
              <Route path="/employer/form-register" element={<Layout><EmployerRegistration /></Layout>} />
              <Route path="/employer/chat-register" element={<Layout><EmployerChatRegistration /></Layout>} />
              <Route path="/employer/profile" element={<Layout><EmployerProfilePage /></Layout>} />
              <Route path="/employer/post-job" element={<PostJob />} />
              <Route path="/employer/post-job/chat" element={<JobChatPosting />} />
              <Route path="/employer/posted-jobs" element={<PostedJobs />} />
              <Route path="/employer/job/:jobId" element={<PostedJobDetails />} />
              
              {/* Job Routes */}
              <Route path="/jobs" element={<Layout><AvailableJobs /></Layout>} />
              <Route path="/jobs/:jobId" element={<Layout><AvailableJobs /></Layout>} />
              <Route path="/job-categories" element={<Layout><JobCategories /></Layout>} />

              {/* New route for MyApplications */}
              <Route path="/my-applications" element={<Layout><MyApplications /></Layout>} />

              {/* Login route */}
              <Route path="/login" element={<Layout><Login /></Layout>} />

              {/* Translation Demo route */}
              <Route path="/translation-demo" element={<Layout><TranslationDemo /></Layout>} />

              {/* Chat Mode route - No Layout wrapper */}
              <Route path="/chat-mode" element={<ChatMode />} />
            </Routes>
          </ErrorBoundary>
        </AnimatePresence>
      </main>
    </div>
  );
};

// Update your routes with the ErrorBoundary
function App() {
  // Initialize user state on app load
  useEffect(() => {
    initializeUserState();
  }, []);
  
  return (
    <GlobalStateProvider>
      <TranslationProvider>
        <LanguageProvider>
          <UserProvider>
            <Router>
              <Toaster position="top-center" />
              <ToastContainer position="top-right" autoClose={3000} />
              <AppContent />
            </Router>
          </UserProvider>
        </LanguageProvider>
      </TranslationProvider>
    </GlobalStateProvider>
  );
}

export default App;
