import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';

const HomepageCard = ({ 
  variant = 'debit-card', 
  user: propUser, 
  stats = {}, 
  className = '',
  theme = 'dark'
}) => {
  const { user: contextUser } = useUser();
  const user = propUser || contextUser;

  // Floating circles configuration
  const floatingCircles = [
    { size: 8, top: '10%', left: '5%', delay: 0 },
    { size: 12, top: '20%', right: '10%', delay: 0.5 },
    { size: 16, bottom: '15%', left: '8%', delay: 1 },
    { size: 10, bottom: '25%', right: '15%', delay: 1.5 },
    { size: 14, top: '50%', right: '5%', delay: 2 }
  ];

  // Debit Card Variant
  if (variant === 'debit-card') {
    return (
      <motion.div
        className={`dark-card ${className}`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Floating decorative circles */}
        {floatingCircles.map((circle, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              width: circle.size,
              height: circle.size,
              backgroundColor: theme === 'light' ? '#FF7124' : '#ff6b35',
              opacity: theme === 'light' ? (0.4 + (index * 0.05)) : (0.6 + (index * 0.05)),
              top: circle.top,
              bottom: circle.bottom,
              left: circle.left,
              right: circle.right,
            }}
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: circle.delay
            }}
          />
        ))}

        {/* Card inner */}
        <motion.div
          className="dark-card-inner relative"
          style={{
            background: theme === 'light' 
              ? 'linear-gradient(135deg, #FFFFFF 0%, #E8DFD5 100%)' 
              : undefined,
            boxShadow: theme === 'light' 
              ? '0 20px 60px rgba(59, 72, 131, 0.15), 0 10px 30px rgba(0, 0, 0, 0.08)' 
              : undefined,
            border: theme === 'light' 
              ? '2px solid rgba(59, 72, 131, 0.1)' 
              : undefined
          }}
          whileHover={{ y: -10, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: theme === 'light'
                ? 'repeating-linear-gradient(0deg, rgba(59, 72, 131, 0.1) 0px, transparent 1px, transparent 20px, rgba(59, 72, 131, 0.1) 21px), repeating-linear-gradient(90deg, rgba(59, 72, 131, 0.1) 0px, transparent 1px, transparent 20px, rgba(59, 72, 131, 0.1) 21px)'
                : 'repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05) 0px, transparent 1px, transparent 20px, rgba(255, 255, 255, 0.05) 21px), repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0px, transparent 1px, transparent 20px, rgba(255, 255, 255, 0.05) 21px)',
              opacity: theme === 'light' ? 0.03 : 0.05,
              borderRadius: '20px'
            }}
          />

          {/* Card content */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Top row - Chip and Contactless */}
            <div className="flex justify-between items-start">
              <div className="text-4xl">💳</div>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={theme === 'light' ? 'text-[#3B4883] opacity-60' : 'opacity-60'}>
                <path d="M8 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="currentColor" opacity="0.3"/>
                <path d="M14 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="currentColor" opacity="0.5"/>
                <path d="M20 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="currentColor" opacity="0.7"/>
              </svg>
            </div>

            {/* Middle section - Card type */}
            <div className="text-center mt-20">
              <p className={`text-sm uppercase tracking-widest ${theme === 'light' ? 'text-[#202124]/60' : 'text-white/60'}`}>
                DEBIT CARD
              </p>
            </div>

            {/* Bottom row - Name and Logo */}
            <div className="flex justify-between items-end mt-16">
              <div>
                <p className={`text-lg font-medium ${theme === 'light' ? 'text-[#272D4E]' : 'text-white'}`}>
                  {user?.name || 'SINDH Jobs'}
                </p>
              </div>
              <div className="flex items-center">
                {/* Two overlapping circles for card logo */}
                <div 
                  className="w-8 h-8 rounded-full bg-white opacity-80"
                  style={{ zIndex: 1 }}
                />
                <div 
                  className="w-8 h-8 rounded-full opacity-80"
                  style={{ 
                    backgroundColor: '#FF7124',
                    marginLeft: '-12px',
                    zIndex: 2
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Stats Variant
  if (variant === 'stats') {
    return (
      <motion.div
        className={`dark-card-glass ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* Available Jobs */}
          {stats.jobCount !== undefined && (
            <div className="text-center">
              <p className="text-sm uppercase tracking-wider opacity-60 mb-2">
                Available Jobs
              </p>
              <motion.p 
                className="text-3xl font-bold orange-text"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {stats.jobCount}
              </motion.p>
            </div>
          )}

          {/* Applications */}
          {stats.applications !== undefined && (
            <div className="text-center">
              <p className="text-sm uppercase tracking-wider opacity-60 mb-2">
                Applications
              </p>
              <motion.p 
                className="text-3xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {stats.applications}
              </motion.p>
            </div>
          )}

          {/* Wallet Balance */}
          {stats.balance !== undefined && (
            <div className="text-center">
              <p className="text-sm uppercase tracking-wider opacity-60 mb-2">
                Wallet Balance
              </p>
              <motion.p 
                className="text-3xl font-bold orange-text"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                ₹{stats.balance}
              </motion.p>
            </div>
          )}

          {/* Trust Score (if available) */}
          {stats.trustScore !== undefined && (
            <div className="text-center">
              <p className="text-sm uppercase tracking-wider opacity-60 mb-2">
                Trust Score
              </p>
              <motion.p 
                className="text-3xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {stats.trustScore}%
              </motion.p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Illustration Variant (Logo with glow)
  if (variant === 'illustration') {
    return (
      <motion.div
        className={`relative flex items-center justify-center ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '400px', height: '400px', margin: '0 auto' }}
      >
        {/* Glow effect behind logo */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle, rgba(255, 107, 53, 0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Logo */}
        <motion.img
          src="/sindh.svg"
          alt="SINDH Jobs"
          className="relative z-10"
          style={{
            width: '100%',
            height: 'auto',
            filter: 'drop-shadow(0 0 30px rgba(255, 107, 53, 0.6))'
          }}
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Floating circles around logo */}
        {floatingCircles.map((circle, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              width: circle.size,
              height: circle.size,
              backgroundColor: '#FF7124',
              opacity: 0.7,
              top: circle.top,
              bottom: circle.bottom,
              left: circle.left,
              right: circle.right,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: circle.delay
            }}
          />
        ))}
      </motion.div>
    );
  }

  return null;
};

export default HomepageCard;
