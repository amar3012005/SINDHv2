import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, FileText, User, PlusCircle, ClipboardList, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useUser();

  // Hide on auth pages
  if (['/login', '/register', '/landing'].includes(location.pathname)) return null;

  const isEmployer = user?.type === 'employer';

  const employerNav = [
    { id: 'home', icon: Home, label: t('nav.home', 'Home'), path: '/home' },
    { id: 'post-job', icon: PlusCircle, label: t('nav.postJob', 'Post Job'), path: '/employer/post-job' },
    { id: 'wallet', icon: Wallet, label: t('nav.wallet', 'Wallet'), path: '/wallet' },
    { id: 'posted-jobs', icon: ClipboardList, label: t('nav.postedJobs', 'Posted Jobs'), path: '/employer/posted-jobs' },
    { id: 'profile', icon: User, label: t('nav.profile', 'Profile'), path: '/employer/profile' }
  ];

  const workerNav = [
    { id: 'home', icon: Home, label: t('nav.home', 'Home'), path: '/home' },
    { id: 'jobs', icon: Briefcase, label: t('nav.jobs', 'Jobs'), path: '/jobs' },
    { id: 'wallet', icon: Wallet, label: t('nav.wallet', 'Wallet'), path: '/wallet' },
    { id: 'applications', icon: FileText, label: t('nav.applications', 'My Apps'), path: '/worker/applications' },
    { id: 'profile', icon: User, label: t('nav.profile', 'Profile'), path: '/worker/profile' }
  ];

  const navItems = isEmployer ? employerNav : workerNav;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#FF6D00]' : 'text-gray-400'}`}
            >
              <item.icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
              />
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
