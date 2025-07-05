import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { UserProvider } from './context/UserContext';

// Components
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import Login from './components/Login'; // Use the OTP-based login
import Registration from './components/auth/Registration';
import AvailableJobs from './components/jobs/AvailableJobs';
import JobDetails from './components/jobs/JobDetails';

// Worker Components
import WorkerProfile from './components/worker/WorkerProfile';
import MyApplications from './components/worker/MyApplications';

// Employer Components
import EmployerProfile from './components/employer/EmployerProfile';
import PostJob from './components/employer/PostJob';
import PostedJobs from './components/employer/PostedJobs';

function App() {
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
            
            {/* Worker Routes */}
            <Route path="/worker/profile" element={<WorkerProfile />} />
            <Route path="/worker/applications" element={<MyApplications />} />
            
            {/* Employer Routes */}
            <Route path="/employer/profile" element={<EmployerProfile />} />
            <Route path="/employer/post-job" element={<PostJob />} />
            <Route path="/employer/posted-jobs" element={<PostedJobs />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
