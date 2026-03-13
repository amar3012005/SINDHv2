import React, { useEffect, useState } from 'react';
import { WifiOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg transition-transform duration-300 translate-y-0"
      >
        <WifiOff className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">No Internet Connection</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[9999] bg-green-600 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg transition-transform duration-300 translate-y-0"
      >
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Back Online</span>
      </div>
    );
  }

  return null;
};

export default NetworkStatusBanner;




