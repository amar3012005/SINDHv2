import React from 'react';

const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="pt-24">
      {children}
    </div>
  </div>
);

export default Layout; 