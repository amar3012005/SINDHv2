import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context providers
import { UserProvider } from './context/UserContext';
import { GlobalStateProvider } from './context/GlobalStateContext';

// Components
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import WorkerRegistration from './components/worker/WorkerRegistration';
import WorkerProfile from './components/worker/WorkerProfile';
import MyApplications from './components/worker/MyApplications';
import AvailableJobs from './components/jobs/AvailableJobs';
import Login from './components/Login';
import PostJob from './components/employer/PostJob';
import PostedJobs from './components/employer/PostedJobs';
import WorkerWallet from './components/worker/WorkerWallet';

function App() {
  return (
    <Router>
      <div className="App">
        <UserProvider>
          <GlobalStateProvider>
            <Navbar />
            <ToastContainer />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/jobs" element={<AvailableJobs />} />
              
              {/* Worker Routes */}
              <Route path="/worker/register" element={<WorkerRegistration />} />
              <Route path="/worker/profile" element={<WorkerProfile />} />
              <Route path="/worker/wallet" element={<WorkerWallet />} />
              <Route path="/my-applications" element={<MyApplications />} />
              <Route path="/worker/applications" element={<MyApplications />} />
              
              {/* Employer Routes */}
              <Route path="/employer/post-job" element={<PostJob />} />
              <Route path="/employer/posted-jobs" element={<PostedJobs />} />
              <Route path="/employer/jobs" element={<PostedJobs />} />
              <Route path="/employer/dashboard" element={<PostedJobs />} />
            </Routes>
          </GlobalStateProvider>
        </UserProvider>
      </div>
    </Router>
  );
}

export default App;
