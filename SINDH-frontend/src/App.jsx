import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { TranslationProvider } from './context/TranslationContext';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import { initializeUserState } from './utils/userInitializer';

// Components
import Homepage from './components/Homepage';
import Navbar from './components/Navbar';
import Registration from './components/Registration';
import UnifiedRegistration from './components/UnifiedRegistration';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Worker Components
import WorkerRegistration from './components/worker/WorkerRegistration';
import WorkerProfile from './components/worker/WorkerProfile';
import WorkerProfileSimple from './components/worker/WorkerProfileSimple';
import FindWork from './components/worker/FindWork';
import WorkerSearch from './components/worker/WorkerSearch';

// Employer Components
import EmployerRegistration from './components/employer/EmployerRegistration';
import EmployerProfile from './components/employer/EmployerProfile';
import PostJob from './components/employer/PostJob';
import EmployerPostJob from './components/EmployerPostJob';

// Job Components
import JobCategories from './components/jobs/JobCategories';
import AvailableJobs from './components/jobs/AvailableJobs';

// New import for MyApplications
import MyApplications from './pages/MyApplications';
import Login from './components/Login';

function App() {
  // Initialize user state on app load
  useEffect(() => {
    initializeUserState();
  }, []);
  
  return (
    <TranslationProvider>
      <LanguageProvider>
        <UserProvider>
      <Router>
            <Toaster position="top-center" />
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="pt-16">
                <AnimatePresence mode="wait">
        <Routes>
                    {/* Public Routes */}
          <Route path="/" element={<Layout><Homepage /></Layout>} />
                    <Route path="/register" element={<Layout><UnifiedRegistration /></Layout>} />
                    
                    {/* Worker Routes */}
                    <Route path="/worker/register" element={<Layout><WorkerRegistration /></Layout>} />
                    <Route path="/worker/profile" element={<Layout><WorkerProfile /></Layout>} />
                    <Route path="/worker/profile-simple" element={<Layout><WorkerProfileSimple /></Layout>} />
                    <Route path="/worker/find-work" element={<Layout><FindWork /></Layout>} />
                    <Route path="/worker/search" element={<Layout><WorkerSearch /></Layout>} />
                    
                    {/* Employer Routes */}
                    <Route path="/employer/register" element={<Layout><EmployerRegistration /></Layout>} />
                    <Route path="/employer/profile" element={<PrivateRoute><Layout><EmployerProfile /></Layout></PrivateRoute>} />
                    <Route path="/employer/post-job" element={
        <ProtectedRoute allowedTypes={['employer']}>
          <PostJob />
        </ProtectedRoute>
      } />
                    
                    {/* Job Routes */}
                    <Route path="/jobs" element={<Layout><AvailableJobs /></Layout>} />
                    <Route path="/jobs/:jobId" element={<Layout><AvailableJobs /></Layout>} />
                    <Route path="/job-categories" element={<Layout><JobCategories /></Layout>} />

                    {/* New route for MyApplications */}
                    <Route path="/my-applications" element={<Layout><MyApplications /></Layout>} />

                    {/* Login route */}
                    <Route path="/login" element={<Layout><Login /></Layout>} />
        </Routes>
                </AnimatePresence>
              </main>
            </div>
      </Router>
        </UserProvider>
      </LanguageProvider>
    </TranslationProvider>
  );
}

export default App;
