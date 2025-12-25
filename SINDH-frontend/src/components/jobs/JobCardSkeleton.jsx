import React from 'react';
import { motion } from 'framer-motion';

/**
 * JobCardSkeleton Component
 * 
 * Loading skeleton for job cards to improve perceived performance.
 * Shows animated placeholders while jobs are being fetched.
 */
const JobCardSkeleton = ({ count = 6, theme = 'light' }) => {
  // Theme-specific styles
  const cardStyles = theme === 'light'
    ? 'bg-white border-[#3B4883]/10'
    : 'bg-white/5 border-white/10';

  const skeletonStyles = theme === 'light'
    ? 'bg-[#E8DFD5]/50'
    : 'bg-white/10';

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className={`rounded-lg p-6 border ${cardStyles}`}
        >
          {/* Salary skeleton */}
          <motion.div
            className={`h-8 w-32 rounded-lg ${skeletonStyles}`}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Title skeleton */}
          <motion.div
            className={`h-6 w-4/5 mt-4 rounded ${skeletonStyles}`}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.1
            }}
          />

          {/* Company skeleton */}
          <motion.div
            className={`h-4 w-3/5 mt-2 rounded ${skeletonStyles}`}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2
            }}
          />

          {/* Location skeleton */}
          <motion.div
            className={`h-4 w-2/5 mt-1 rounded ${skeletonStyles}`}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          />

          {/* Description skeleton - 2 lines */}
          <div className="mt-4 space-y-2">
            <motion.div
              className={`h-3.5 w-full rounded ${skeletonStyles}`}
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
            />
            <motion.div
              className={`h-3.5 w-4/5 rounded ${skeletonStyles}`}
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </div>

          {/* Badge skeleton */}
          <motion.div
            className={`h-6 w-24 mt-4 rounded-full ${skeletonStyles}`}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6
            }}
          />

          {/* Button skeleton */}
          <motion.div
            className={`h-10 w-full mt-4 rounded-xl ${skeletonStyles}`}
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default JobCardSkeleton;
