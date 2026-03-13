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
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import Registration from './components/Registration';
import UnifiedRegistration from './components/UnifiedRegistration';
import Layout from './components/Layout';
import GreetingPage from './components/GreetingPage';
import NetworkStatusBanner from './components/NetworkStatusBanner';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/common/OfflineBanner';

// Worker Components
import WorkerRegistration from './components/worker/WorkerRegistration';
import ChatRegistration from './components/worker/ChatRegistration';
import RegistrationChoice from './components/worker/RegistrationChoice';
import WorkerProfile from './components/worker/WorkerProfile';
import FindWork from './components/worker/FindWork';
import WorkerSearch from './components/worker/WorkerSearch';

// Employer Components
import EmployerRegistration from './components/employer/EmployerRegistration';
import EmployerChatRegistration from './components/employer/EmployerChatRegistration';
import EmployerRegistrationChoice from './components/employer/EmployerRegistrationChoice';
import EmployerProfile from './components/employer/EmployerProfile';
import PostJob from './components/employer/PostJob';
import JobChatPosting from './components/employer/JobChatPosting';
import PostedJobs from './components/employer/PostedJobs';
import PostedJobDetails from './components/employer/PostedJobDetails';
import Wallet from './components/Wallet';

// Job Components
import JobCategories from './components/jobs/JobCategories';
import AvailableJobs from './components/jobs/AvailableJobs';

// Other
import MyApplications from './components/worker/MyApplications';
import Login from './components/Login';
import TranslationDemo from './components/TranslationDemo';
import ChatMode from './components/ChatMode';

// App Content Component
const AppContent = () => {
  const location = useLocation();
  const isChatModePage = location.pathname === '/chat-mode';
  const isGreetingPage = location.pathname === '/greeting';
  const isHomepage = location.pathname === '/home' || location.pathname === '/';
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner />
      <NetworkStatusBanner />
      {!isGreetingPage && !isChatModePage && !isLoginPage && <Navbar />}
      <main>
        <AnimatePresence mode="wait">
          <ErrorBoundary fallback={({ error }) => (
            <div className="p-4 text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">{error?.message || 'An unexpected error occurred'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          )}>
            <Routes>
              {/* Root route */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/greeting" element={<GreetingPage />} />

              {/* Public Routes */}
              <Route path="/home" element={<Layout><Homepage /></Layout>} />
              <Route path="/register" element={<Layout><UnifiedRegistration /></Layout>} />

              {/* Worker Routes */}
              <Route path="/worker/register" element={<Layout><RegistrationChoice /></Layout>} />
              <Route path="/worker/form-register" element={<Layout><WorkerRegistration /></Layout>} />
              <Route path="/worker/chat-register" element={<Layout><ChatRegistration /></Layout>} />
              <Route path="/worker/profile" element={<Layout><WorkerProfile /></Layout>} />
              <Route path="/worker/find-work" element={<Layout><FindWork /></Layout>} />
              <Route path="/worker/search" element={<Layout><WorkerSearch /></Layout>} />

              {/* Employer Routes */}
              <Route path="/employer/register" element={<Layout><EmployerRegistrationChoice /></Layout>} />
              <Route path="/employer/form-register" element={<Layout><EmployerRegistration /></Layout>} />
              <Route path="/employer/chat-register" element={<Layout><EmployerChatRegistration /></Layout>} />
              <Route path="/employer/profile" element={<Layout><EmployerProfile /></Layout>} />
              <Route path="/employer/post-job" element={<PostJob />} />
              <Route path="/employer/post-job/chat" element={<JobChatPosting />} />
              <Route path="/employer/posted-jobs" element={<Layout><PostedJobs /></Layout>} />
              <Route path="/employer/job/:jobId" element={<Layout><PostedJobDetails /></Layout>} />

              {/* Job Routes */}
              <Route path="/jobs" element={<Layout><AvailableJobs /></Layout>} />
              <Route path="/jobs/:jobId" element={<Layout><AvailableJobs /></Layout>} />
              <Route path="/job-categories" element={<Layout><JobCategories /></Layout>} />

              {/* Apps */}
              <Route path="/worker/applications" element={<Layout><MyApplications /></Layout>} />

              {/* Login */}
              <Route path="/login" element={<Login />} />

              {/* Demo */}
              <Route path="/translation-demo" element={<Layout><TranslationDemo /></Layout>} />

              {/* Wallet Route */}
              <Route path="/wallet" element={<Layout><Wallet /></Layout>} />

              {/* Chat Mode */}
              <Route path="/chat-mode" element={<ChatMode />} />
            </Routes>
          </ErrorBoundary>
        </AnimatePresence>
      </main>
    </div>
  );
};

function App() {
  useEffect(() => {
    // Initialize user state and re-auth Web SDK with stored custom token
    initializeUserState().catch((err) => {
      console.warn('User initialization failed:', err?.message || err);
    });
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
