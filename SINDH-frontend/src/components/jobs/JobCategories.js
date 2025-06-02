import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const categories = [
  {
    id: 1,
    name: 'Construction',
    icon: '🏗️',
    description: 'Building, renovation, and construction work',
    jobCount: 150,
    avgSalary: '₹800-1200/day'
  },
  {
    id: 2,
    name: 'Agriculture',
    icon: '🌾',
    description: 'Farming, harvesting, and agricultural labor',
    jobCount: 200,
    avgSalary: '₹500-800/day'
  },
  {
    id: 3,
    name: 'Household',
    icon: '🏠',
    description: 'Cleaning, cooking, and household maintenance',
    jobCount: 180,
    avgSalary: '₹400-700/day'
  },
  {
    id: 4,
    name: 'Transportation',
    icon: '🚚',
    description: 'Delivery, transportation, and logistics',
    jobCount: 120,
    avgSalary: '₹600-1000/day'
  },
  {
    id: 5,
    name: 'Manufacturing',
    icon: '🏭',
    description: 'Factory work and production',
    jobCount: 90,
    avgSalary: '₹700-1100/day'
  },
  {
    id: 6,
    name: 'Retail',
    icon: '🛍️',
    description: 'Shop work and sales',
    jobCount: 160,
    avgSalary: '₹500-900/day'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function JobCategories() {
  const { translations } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {translations.categories || 'Job Categories'}
          </h1>
          <p className="text-xl text-gray-600">
            {translations.categoriesDescription || 'Explore different types of work opportunities'}
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {categories.map(category => (
            <motion.div
              key={category.id}
              variants={item}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <Link to={`/find-work?category=${category.name}`}>
                <div className="p-6">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>📊 {category.jobCount} active jobs</span>
                    <span>💰 {category.avgSalary}</span>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-600 font-medium">
                      {translations.viewJobs || 'View Jobs'}
                    </span>
                    <span className="text-indigo-600">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="bg-indigo-600 rounded-lg p-6 text-white text-center">
            <div className="text-3xl font-bold mb-2">1000+</div>
            <div className="text-indigo-100">Daily Job Postings</div>
          </div>
          <div className="bg-indigo-600 rounded-lg p-6 text-white text-center">
            <div className="text-3xl font-bold mb-2">50+</div>
            <div className="text-indigo-100">Job Categories</div>
          </div>
          <div className="bg-indigo-600 rounded-lg p-6 text-white text-center">
            <div className="text-3xl font-bold mb-2">10K+</div>
            <div className="text-indigo-100">Registered Workers</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 