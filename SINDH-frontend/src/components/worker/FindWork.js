import React, { useState /*, useEffect */ } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
// import { useTranslation } from '../../context/TranslationContext';
// import { useUser } from '../../context/UserContext';

const jobCategories = [
  { id: 1, name: 'Construction', icon: '🏗️' },
  { id: 2, name: 'Agriculture', icon: '🌾' },
  { id: 3, name: 'Household', icon: '🏠' },
  { id: 4, name: 'Transportation', icon: '🚚' },
  { id: 5, name: 'Manufacturing', icon: '🏭' },
  { id: 6, name: 'Retail', icon: '🛍️' },
];

const sampleJobs = [
  {
    id: 1,
    title: 'Construction Worker Needed',
    location: 'Mumbai, Maharashtra',
    salary: '₹800/day',
    duration: '3 days',
    category: 'Construction',
    posted: '2 hours ago'
  },
  {
    id: 2,
    title: 'Farm Labor Required',
    location: 'Punjab',
    salary: '₹1000/day',
    duration: '1 week',
    category: 'Agriculture',
    posted: '5 hours ago'
  },
  {
    id: 3,
    title: 'House Cleaning Service',
    location: 'Delhi',
    salary: '₹500/day',
    duration: '1 day',
    category: 'Household',
    posted: '1 hour ago'
  }
];

export default function FindWork() {
  const { translations } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = sampleJobs.filter(job => {
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {translations.findWork || 'Find Work'}
          </h1>
          <p className="text-xl text-gray-600">
            {translations.findWorkDescription || 'Discover daily work opportunities in your area'}
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder={translations.searchPlaceholder || "Search jobs..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">{translations.allCategories || 'All Categories'}</option>
              {jobCategories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {translations.categories || 'Categories'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {jobCategories.map(category => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.name)}
                className={`p-4 rounded-lg text-center ${
                  selectedCategory === category.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="font-medium">{category.name}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Job Listings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {translations.availableJobs || 'Available Jobs'}
          </h2>
          <div className="grid gap-6">
            {filteredJobs.map(job => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <span className="mr-4">📍 {job.location}</span>
                      <span>💰 {job.salary}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <span className="mr-4">⏱️ {job.duration}</span>
                      <span>🕒 {job.posted}</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 md:mt-0 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {translations.applyNow || 'Apply Now'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 