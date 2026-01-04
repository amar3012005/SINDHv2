import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import LogoutButton from './LogoutButton';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';


const Navbar = () => {
  const { user } = useUser();
  const location = useLocation();

  // Hide navbar on certain pages
  const hideNavbarPaths = ['/greeting', '/chat-mode'];
  if (hideNavbarPaths.includes(location.pathname)) {
    return null;
  }

  // Determine if we should use a transparent or solid background
  const isHomepage = location.pathname === '/' || location.pathname === '/home';

  return (
    <nav className="sticky top-0 z-50 transition-all duration-300 bg-white border-b border-[#3B4883]/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo / Brand Name */}
          <Link to="/home" className="flex items-center group">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#3B4883] group-hover:text-[#FF7124] transition-colors">
              SINDH
            </span>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 md:space-x-5">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notification Bell - Only for logged-in users */}
            {user && (
              <div className="relative">
                <NotificationBell />
              </div>
            )}

            {/* User Profile / Login */}
            {user ? (
              <Link
                to={user.type === 'employer' ? '/employer/profile' : '/worker/profile'}
                className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-[#FF7124] to-[#e66420] text-white font-bold text-lg shadow-md hover:shadow-lg hover:scale-105 transition-all border border-[#FF7124]/20"
                title="View Profile"
              >
                {user.name?.charAt(0)?.toUpperCase() || user.fullName?.charAt(0)?.toUpperCase()}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 bg-[#3B4883] text-white text-sm font-semibold rounded-xl hover:bg-[#272D4E] transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;