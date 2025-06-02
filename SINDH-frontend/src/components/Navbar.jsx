import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LogoutButton from './LogoutButton';
import { getCurrentUser, getUserType } from '../utils/authUtils';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: contextUser, logoutUser, isLoadingUser, loginUser } = useUser();
  const { /* language, setLanguage, translations */ } = useLanguage();
  
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Move user and authentication checks to the top
  const hasValidUser = contextUser || getCurrentUser();
  const user = hasValidUser ? (contextUser || getCurrentUser()) : null;
  const userType = user?.type || (hasValidUser ? getUserType() : null);
  const isAuthenticated = user && contextUser;

  useEffect(() => {
    // Set active section based on current path
    const path = location.pathname;
    if (path === '/') setActiveSection('home');
    else if (path === '/about') setActiveSection('about');
    else if (path === '/news') setActiveSection('news');
    else if (path.includes('/profile')) setActiveSection('profile');
    else if (path.includes('/jobs/available') || path.includes('/worker/register')) setActiveSection('find-work');
    else if (path.includes('/my-applications')) setActiveSection('applications');
  }, [location]);

  // Now useEffect with isAuthenticated
  useEffect(() => {
    const syncUserData = async () => {
      if (!isAuthenticated) return;

      const storedUser = JSON.parse(localStorage.getItem('user'));
      const currentUser = contextUser;

      // Check if data is different
      if (storedUser && currentUser && 
          (storedUser.name !== currentUser.name || 
           storedUser.rating !== currentUser.rating ||
           JSON.stringify(storedUser.skills) !== JSON.stringify(currentUser.skills))) {
        
        try {
          const endpoint = userType === 'worker' ? '/workers' : '/employers';
          const response = await fetch(`http://localhost:5000/api${endpoint}/${currentUser.id}`);
          
          if (!response.ok) throw new Error('Failed to fetch user data');
          
          const freshData = await response.json();
          
          const updatedUserData = {
            ...currentUser,
            ...freshData,
            id: freshData._id || currentUser.id,
            type: userType,
            rating: freshData.rating || 0,
            skills: freshData.skills || [],
            location: freshData.location || {},
            language: freshData.language || [],
            experience_years: freshData.experience_years,
            aadharNumber: freshData.aadharNumber,
            age: freshData.age
          };

          localStorage.setItem('user', JSON.stringify(updatedUserData));
          loginUser(updatedUserData);
        } catch (error) {
          console.error('Error syncing user data:', error);
        }
      }
    };

    syncUserData();
  }, [contextUser, userType, loginUser]);

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsSideMenuOpen(false);   // Close mobile menu when navigating
    setShowProfileMenu(false);  // Close profile dropdown when navigating
  };

  const handleLogout = () => {
    // This function is no longer needed since we're using the LogoutButton component
    // but we'll keep it for any legacy code that might still reference it
    logoutUser();
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleProfileClick = () => {
    if (userType === 'worker') {
      navigate('/worker/profile');
      setActiveSection('profile');
    } else if (userType === 'employer') {
      navigate('/employer/profile');
      setActiveSection('profile');
    } else {
      navigate('/login');
    }
    setShowProfileMenu(false); // Close profile dropdown
    setIsSideMenuOpen(false);  // Close side menu if open
  };

  const handleFindWork = () => {
    if (!isAuthenticated) {
      toast.info('Please login first to continue');
      navigate('/login');
      return;
    }
    navigate('/jobs');
    setIsSideMenuOpen(false);
  };

  const handlePostJob = () => {
    if (!isAuthenticated) {
      toast.info('Please login as an employer to post jobs');
      navigate('/login');
      return;
    }
    
    if (userType !== 'employer') {
      toast.error('Only employers can post jobs');
      return;
    }
    
    navigate('/employer/post-job');
    setIsSideMenuOpen(false);
  };

  const renderDesktopNav = () => (
    <div className="hidden md:flex items-center space-x-4">
      <Link to="/" className="nav-link">HOME</Link>
      <button onClick={handleFindWork} className="nav-link">Find Jobs</button>
      <button onClick={handlePostJob} className="nav-link">Post Job</button>
      
      {/* Show job-specific links based on user type */}
      {isAuthenticated && (
        <>
          {userType === 'worker' && (
            <Link
              to="/my-applications"
              className="nav-link"
              onClick={() => handleNavigation('applications')}
            >
              My Jobs
            </Link>
          )}
          {userType === 'employer' && (
            <Link
              to="/employer/posted-jobs"
              className="nav-link"
              onClick={() => handleNavigation('posted-jobs')}
            >
              Posted Jobs
            </Link>
          )}
        </>
      )}

      {/* User Profile Menu */}
      {isAuthenticated ? (
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-gray-700">{user?.name}</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                {userType}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <Link
                to={`/${userType}/profile`}
                onClick={() => {
                  setShowProfileMenu(false);
                  handleNavigation('profile');
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                My Profile
              </Link>
              {userType === 'employer' && (
                <button
                  onClick={handlePostJob}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Post Job
                </button>
              )}
              <button
                onClick={handleFindWork}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Find Jobs
              </button>
              <LogoutButton
                variant="text"
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                onLogoutComplete={() => {
                  setShowProfileMenu(false);
                  navigate('/login');
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex space-x-4">
          <Link to="/login" className="auth-button">Login</Link>
          <Link to="/register" className="auth-button-primary">Register</Link>
        </div>
      )}
    </div>
  );

  const renderMobileNav = () => (
    <div className="p-4">
      <Link to="/" className="mobile-nav-link">HOME</Link>
      
      {isAuthenticated && (
        <div className="flex items-center space-x-3 px-3 py-3 border-b">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-lg">{user?.name?.charAt(0)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-medium">{user?.name}</span>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block w-fit capitalize">
              {userType}
            </span>
          </div>
        </div>
      )}

      <button onClick={handleFindWork} className="mobile-nav-link">Find Jobs</button>
      <button onClick={handlePostJob} className="mobile-nav-link">Post Job</button>
      
      {/* Show job-specific links based on user type */}
      {isAuthenticated && (
        <>
          {userType === 'worker' && (
            <Link
              to="/my-applications"
              className="mobile-nav-link"
              onClick={() => handleNavigation('applications')}
            >
              My Jobs
            </Link>
          )}
          {userType === 'employer' && (
            <Link
              to="/employer/posted-jobs"
              className="mobile-nav-link"
              onClick={() => handleNavigation('posted-jobs')}
            >
              Posted Jobs
            </Link>
          )}
        </>
      )}

      {/* Rest of mobile navigation */}
      {isAuthenticated ? (
        <>
          {userType === 'employer' && (
            <button onClick={handlePostJob} className="mobile-nav-link">
              Post Job
            </button>
          )}
          <button onClick={handleFindWork} className="mobile-nav-link">
            Find Jobs
          </button>
          <LogoutButton
            variant="text"
            className="mobile-nav-link text-red-600"
            onLogoutComplete={() => {
              setIsSideMenuOpen(false);
              navigate('/login');
            }}
          />
        </>
      ) : (
        <div className="space-y-2 mt-4">
          <Link to="/login" className="mobile-auth-button">Login</Link>
          <Link to="/register" className="mobile-auth-button-primary">Register</Link>
        </div>
      )}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-blue-600">S I N D H</span>
                <span className="text-xs text-gray-500">Empowering Rural Workforce</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          {renderDesktopNav()}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsSideMenuOpen(true)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isSideMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
          <div className="absolute inset-y-0 right-0 w-64 bg-white">
            {renderMobileNav()}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;