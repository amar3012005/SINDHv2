import React from 'react';
import BottomNavigation from './layout/BottomNavigation';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
    <div className="pt-0 safe-pb">
      {children}
    </div>
    <BottomNavigation />
  </div>
);

export default Layout; 