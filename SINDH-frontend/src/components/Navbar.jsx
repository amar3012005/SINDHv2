import React, { useState, useEffect } from 'react';
import { Menu, X, DollarSign, Wallet, MessageCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LogoutButton from './LogoutButton';
import LanguageSwitcher from './LanguageSwitcher';
import { getApiUrl } from '../utils/apiUtils';

// Import the logo SVG
import LogoSVG from '../assets/logo.svg';

// Animated Pattern Components for Navbar
const NavFloatingGeometry = ({ delay = 0 }) => {
  const shapes = ['square', 'circle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 8 + 4; // Smaller for navbar
  const duration = Math.random() * 8 + 12;
  
  const initialX = Math.random() * 100;
  const initialY = Math.random() * 20;
  
  return (
    <motion.div
      className="absolute pointer-events-none opacity-5"
      style={{
        width: size,
        height: size,
        left: `${initialX}%`,
        top: `${initialY}px`,
      }}
      animate={{
        x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
        y: [0, Math.random() * 10 - 5, Math.random() * 10 - 5, 0],
        rotate: [0, 180, 360],
        scale: [1, 1.2, 0.8, 1]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
    >
      {shape === 'square' && <div className="w-full h-full bg-black" />}
      {shape === 'circle' && <div className="w-full h-full bg-black rounded-full" />}
      {shape === 'triangle' && (
        <div 
          className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-black"
        />
      )}
    </motion.div>
  );
};

const NavAnimatedGrid = ({ opacity = 0.03 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, black 0.5px, transparent 0.5px),
            linear-gradient(black 0.5px, transparent 0.5px)
          `,
          backgroundSize: '25px 25px'
        }}
        animate={{
          x: [0, 25, 0],
          y: [0, 25, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

const NavParticleField = ({ count = 8 }) => {
  const particles = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-0.5 h-0.5 bg-black rounded-full opacity-20"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [0, -8, 0],
        opacity: [0.1, 0.3, 0.1],
        scale: [1, 1.3, 1]
      }}
      transition={{
        duration: Math.random() * 2 + 3,
        repeat: Infinity,
        delay: Math.random() * 2,
        ease: "easeInOut"
      }}
    />
  ));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles}
    </div>
  );
};

const NavGeometricOverlay = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated mini triangles */}
      <motion.div
        className="absolute top-2 right-20 w-3 h-3 opacity-10"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,10 90,80 10,80" fill="black" />
        </svg>
      </motion.div>

      {/* Animated mini squares */}
      <motion.div
        className="absolute top-2 left-32 w-2 h-2 opacity-10"
        animate={{
          rotate: [0, 45, 0],
          x: [0, 8, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-black transform rotate-45" />
      </motion.div>

      {/* Animated mini circles */}
      <motion.div
        className="absolute top-1 right-40 opacity-10"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-2 h-2 border border-black rounded-full" />
      </motion.div>
    </div>
  );
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logoutUser, isLoadingUser } = useUser();
  const { t } = useTranslation();
  
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [workerBalance, setWorkerBalance] = useState(0);
  
  const isAuthenticated = !!user && !isLoadingUser;
  const userType = user?.type;
  
  // Don't render navbar on chat mode page
  const isChatModePage = location.pathname === '/chat-mode';

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveSection('home');
    else if (path === '/about') setActiveSection('about');
    else if (path === '/news') setActiveSection('news');
    else if (path.includes('/profile')) setActiveSection('profile');
    else if (path.includes('/jobs') || path.includes('/worker/register')) setActiveSection('find-work');
    else if (path.includes('/my-applications')) setActiveSection('applications');
  }, [location]);

  useEffect(() => {
    const fetchWorkerBalance = async () => {
      if (user?.type === 'worker' && user?.id) {
        try {
          const response = await fetch(getApiUrl(`/api/workers/${user.id}/balance`));
          if (response.ok) {
            const data = await response.json();
            setWorkerBalance(data.balance || 0);
          }
        } catch (error) {
          console.error('Error fetching worker balance:', error);
        }
      }
    };

    if (!isLoadingUser && user?.type === 'worker') {
      fetchWorkerBalance();
      const interval = setInterval(fetchWorkerBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isLoadingUser]);

  if (isChatModePage) {
    return null;
  }

  const handleNavigation = (section) => {
    setActiveSection(section);
    setIsSideMenuOpen(false);
    setShowProfileMenu(false);
  };

  const handleLogoutComplete = () => {
    setShowProfileMenu(false);
    setIsSideMenuOpen(false);
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
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
    setShowProfileMenu(false);
    setIsSideMenuOpen(false);
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

  const handleShowProfile = () => {
    if (!isAuthenticated) {
      toast.info('Please login to view profile');
      navigate('/login');
      return;
    }

    console.log('Showing profile for user type:', userType);
    
    if (userType === 'employer') {
      navigate('/employer/profile');
    } else if (userType === 'worker') {
      navigate('/worker/profile');
    }
    
    setShowProfileMenu(false);
    setIsSideMenuOpen(false);
  };

  const renderDesktopNav = () => (
    <div className="hidden md:flex items-center space-x-8">
      <Link 
        to="/" 
        className="nav-link group relative px-3 py-2 text-sm font-light tracking-wide text-gray-800 hover:text-black transition-all duration-300"
        onClick={() => handleNavigation('home')}
      >
        <span className="relative z-10">{t('nav.home')}</span>
        <motion.div
          className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          whileHover={{ scale: 1.05 }}
        />
      </Link>
      
      {/* Chat Mode Link */}
      <Link 
        to="/chat-mode" 
        className="nav-link group relative px-3 py-2 text-sm font-medium tracking-wide text-gray-800 hover:text-black transition-all duration-300 flex items-center"
        onClick={() => handleNavigation('chat-mode')}
      >
        <MessageCircle className="w-4 h-4 mr-1.5" />
        <span className="relative z-10">Chat Mode</span>
        <motion.span 
          className="ml-2 px-2 py-0.5 bg-black text-white text-xs rounded-full font-normal"
          animate={{ 
            opacity: [1, 0.7, 1],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          NEW
        </motion.span>
        <motion.div
          className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          whileHover={{ scale: 1.05 }}
        />
      </Link>
      
      {isAuthenticated && (
        <>
          {userType === 'worker' && (
            <>
              <Link
                to="/my-applications"
                className="nav-link group relative px-3 py-2 text-sm font-light tracking-wide text-gray-800 hover:text-black transition-all duration-300"
                onClick={() => handleNavigation('applications')}
              >
                <span className="relative z-10">{t('nav.myJobs')}</span>
                <motion.div
                  className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.05 }}
                />
              </Link>
              <Link
                to="/worker/wallet"
                className="nav-link group relative px-3 py-2 text-sm font-light tracking-wide text-gray-800 hover:text-black transition-all duration-300 flex items-center"
                onClick={() => handleNavigation('wallet')}
              >
                <Wallet className="w-4 h-4 mr-1.5" />
                <span className="relative z-10">{t('common.wallet')}: ₹{workerBalance.toLocaleString()}</span>
                <motion.div
                  className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.05 }}
                />
              </Link>
            </>
          )}
          {userType === 'employer' && (
            <Link
              to="/employer/posted-jobs"
              className="nav-link group relative px-3 py-2 text-sm font-light tracking-wide text-gray-800 hover:text-black transition-all duration-300"
              onClick={() => handleNavigation('posted-jobs')}
            >
              <span className="relative z-10">{t('nav.postedJobs')}</span>
              <motion.div
                className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileHover={{ scale: 1.05 }}
              />
            </Link>
          )}
        </>
      )}
      
      <LanguageSwitcher className="ml-2" />

      {isAuthenticated ? (
        <div className="relative">
          <motion.button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-black/5 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
              <span className="text-gray-700 font-medium text-sm">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-gray-800 font-medium text-sm">{user?.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize font-light">
                {userType}
              </span>
            </div>
          </motion.button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 py-2 z-50"
              >
                <button
                  onClick={() => {
                    navigate(`/${userType}/profile`);
                    setShowProfileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-black/5 transition-colors duration-200"
                >
                  {t('nav.profile')}
                </button>
                <LogoutButton
                  variant="text"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-black/5 transition-colors duration-200"
                  onLogoutComplete={handleLogoutComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex space-x-3">
          <Link 
            to="/login" 
            className="px-4 py-2 text-sm font-light tracking-wide text-gray-800 hover:text-black transition-all duration-300 rounded-lg hover:bg-black/5"
            onClick={() => setIsSideMenuOpen(false)}
          >
            {t('nav.login')}
          </Link>
          <Link 
            to="/register" 
            className="px-4 py-2 text-sm font-medium tracking-wide bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-300"
            onClick={() => setIsSideMenuOpen(false)}
          >
            {t('nav.register')}
          </Link>
        </div>
      )}
    </div>
  );

  const renderMobileNav = () => (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="p-6 relative"
    >
      {/* Mobile nav animated background */}
      <NavAnimatedGrid opacity={0.02} />
      <NavParticleField count={5} />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light tracking-wide text-gray-800">{t('nav.menu')}</h2>
        <motion.button 
          onClick={() => setIsSideMenuOpen(false)} 
          className="p-2 rounded-lg hover:bg-black/5 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="h-6 w-6 text-gray-700" />
        </motion.button>
      </div>

      <Link 
        to="/" 
        className="block py-3 px-4 text-gray-800 hover:text-black hover:bg-black/5 rounded-lg transition-all duration-300 font-light tracking-wide"
        onClick={() => setIsSideMenuOpen(false)}
      >
        {t('nav.home')}
      </Link>
      
      <Link 
        to="/chat-mode" 
        className="flex items-center py-3 px-4 text-gray-800 hover:text-black hover:bg-black/5 rounded-lg transition-all duration-300 font-medium tracking-wide"
        onClick={() => setIsSideMenuOpen(false)}
      >
        <MessageCircle className="w-5 h-5 mr-3" />
        Chat Mode
        <motion.span 
          className="ml-2 px-2 py-0.5 bg-black text-white text-xs rounded-full font-normal"
          animate={{ 
            opacity: [1, 0.7, 1],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          NEW
        </motion.span>
      </Link>
      
      {isAuthenticated && (
        <>
          <div className="flex items-center space-x-4 px-4 py-4 border-b border-gray-200 my-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
              <span className="text-gray-700 font-medium text-lg">
                {user?.name?.charAt(0)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-800 font-medium">{user?.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block w-fit capitalize font-light">
                {userType}
              </span>
            </div>
          </div>

          {userType === 'worker' && (
            <>
              <Link
                to="/my-applications"
                className="block py-3 px-4 text-gray-800 hover:text-black hover:bg-black/5 rounded-lg transition-all duration-300 font-light tracking-wide"
                onClick={() => {
                  handleNavigation('applications');
                  setIsSideMenuOpen(false);
                }}
              >
                {t('nav.myJobs')}
              </Link>
              <Link
                to="/worker/wallet"
                className="flex items-center py-3 px-4 text-gray-800 hover:text-black hover:bg-black/5 rounded-lg transition-all duration-300 font-light tracking-wide"
                onClick={() => {
                  handleNavigation('wallet');
                  setIsSideMenuOpen(false);
                }}
              >
                <Wallet className="w-5 h-5 mr-3" /> {t('common.wallet')}: ₹{workerBalance.toLocaleString()}
              </Link>
            </>
          )}
          
          {userType === 'employer' && (
            <Link
              to="/employer/posted-jobs"
              className="block py-3 px-4 text-gray-800 hover:text-black hover:bg-black/5 rounded-lg transition-all duration-300 font-light tracking-wide"
              onClick={() => {
                handleNavigation('posted-jobs');
                setIsSideMenuOpen(false);
              }}
            >
              {t('nav.postedJobs')}
            </Link>
          )}

          <Link
            to={`/${userType}/profile`}
            className="block py-3 px-4 text-gray-800 hover:text-black hover:bg-black/5 rounded-lg transition-all duration-300 font-light tracking-wide"
            onClick={() => setIsSideMenuOpen(false)}
          >
            {t('nav.profile')}
          </Link>

          <LogoutButton
            variant="text"
            className="block w-full text-left py-3 px-4 text-gray-600 hover:text-black hover:bg-black/5 rounded-lg transition-all duration-300 font-light tracking-wide"
            onLogoutComplete={() => {
              setIsSideMenuOpen(false);
              navigate('/');
            }}
          />
        </>
      )}

      {!isAuthenticated && (
        <div className="space-y-3 mt-6">
          <Link 
            to="/login" 
            className="block w-full py-3 px-4 text-center text-gray-800 hover:text-black hover:bg-black/5 rounded-lg transition-all duration-300 font-light tracking-wide"
            onClick={() => setIsSideMenuOpen(false)}
          >
            {t('nav.login')}
          </Link>
          <Link 
            to="/register" 
            className="block w-full py-3 px-4 text-center bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-medium tracking-wide"
            onClick={() => setIsSideMenuOpen(false)}
          >
            {t('nav.register')}
          </Link>
        </div>
      )}
      
      <div className="pt-6 border-t border-gray-200 mt-6">
        <p className="text-sm text-gray-500 mb-3 font-light">{t('nav.selectLanguage')}</p>
        <LanguageSwitcher />
      </div>
    </motion.div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 relative overflow-hidden">
      {/* Animated background patterns */}
      <NavAnimatedGrid />
      <NavParticleField />
      <NavGeometricOverlay />
      
      {/* Floating geometry elements */}
      {Array.from({ length: 6 }, (_, i) => (
        <NavFloatingGeometry key={i} delay={i * 0.5} />
      ))}
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <motion.div
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Logo SVG */}
                <motion.div
                  className="w-8 h-8 flex items-center justify-center"
                  animate={{ 
                    rotate: [0, 5, 0, -5, 0]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img 
                    src={LogoSVG} 
                    alt="INDUS Logo" 
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                <div className="flex flex-col">
                  <motion.span 
                    className="text-xl font-light tracking-[0.2em] text-gray-800 group-hover:text-black transition-colors duration-300"
                    animate={{ 
                      opacity: [1, 0.9, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    I N D U S
                  </motion.span>
                  <span className="text-[10px] text-gray-500 tracking-wide font-light">
                    Empowering Rural Workforce
                  </span>
                </div>
              </motion.div>
            </Link>
          </div>
          
          {renderDesktopNav()}

          <div className="md:hidden flex items-center">
            <motion.button
              onClick={() => setIsSideMenuOpen(true)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-black hover:bg-black/5 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-6 w-6" />
            </motion.button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isSideMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          >
            <div className="absolute inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-md border-l border-gray-200 relative overflow-hidden">
              <NavAnimatedGrid opacity={0.02} />
              <NavParticleField count={5} />
              {renderMobileNav()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;