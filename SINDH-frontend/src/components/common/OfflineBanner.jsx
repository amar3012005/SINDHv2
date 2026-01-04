import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertCircle } from 'lucide-react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[#3B4883] text-white overflow-hidden z-[9999] relative"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
            <WifiOff className="w-4 h-4 text-[#FF7124]" />
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2">
              You are offline – showing cached data
              <span className="hidden sm:inline opacity-50">|</span>
              <span className="hidden sm:flex items-center gap-1 opacity-70">
                <AlertCircle className="w-3 h-3" />
                Connectivity will restore automatically
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;


