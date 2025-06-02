import React, { useState /*, useEffect */ } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
// import { useTranslation } from '../../context/TranslationContext';
// import { useUser } from '../../context/UserContext';

const skillCategories = [
  'Construction',
  'Carpentry',
  'Plumbing',
  'Electrical',
  'Painting',
  'Agriculture',
  'Farming',
  'Household',
  'Cleaning',
  'Cooking',
  'Transportation',
  'Manufacturing'
];

const sampleWorkers = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    skills: ['Construction', 'Carpentry'],
    location: 'Mumbai, Maharashtra',
    experience: '5 years',
    rating: 4.8,
    completedJobs: 124
  },
  {
    id: 2,
    name: 'Priya Singh',
    skills: ['Household', 'Cleaning'],
    location: 'Delhi',
    experience: '3 years',
    rating: 4.9,
    completedJobs: 89
  },
  {
    id: 3,
    name: 'Mohammed Ali',
    skills: ['Agriculture', 'Farming'],
    location: 'Punjab',
    experience: '8 years',
    rating: 4.7,
    completedJobs: 256
  }
];

export default function WorkerSearch() {
  const { translations } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [location, setLocation] = useState('');

  const filteredWorkers = sampleWorkers.filter(worker => {
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !location || worker.location.toLowerCase().includes(location.toLowerCase());
    const matchesSkills = selectedSkills.length === 0 || 
      selectedSkills.some(skill => worker.skills.includes(skill));
    return matchesSearch && matchesLocation && matchesSkills;
  });

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {translations.searchWorkers || 'Search Workers'}
          </h1>
          <p className="text-xl text-gray-600">
            {translations.searchWorkersDescription || 'Find skilled and verified workers in your area'}
          </p>
        </motion.div>

        {/* Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                {translations.searchByName || 'Search by Name'}
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translations.searchPlaceholder || "Enter worker's name..."}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                {translations.location || 'Location'}
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={translations.locationPlaceholder || "Enter location..."}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translations.skills || 'Skills'}
            </label>
            <div className="flex flex-wrap gap-2">
              {skillCategories.map(skill => (
                <motion.button
                  key={skill}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedSkills.includes(skill)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {skill}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Worker List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {filteredWorkers.map(worker => (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-lg p-6 transition-shadow duration-200 hover:shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{worker.name}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <span className="mr-4">📍 {worker.location}</span>
                    <span className="flex items-center">⭐ {worker.rating}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {worker.skills.map(skill => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="text-gray-500 text-sm">
                    <span className="mr-4">✓ {worker.completedJobs} jobs completed</span>
                    <span>🕒 {worker.experience} experience</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 md:mt-0 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors duration-200 font-medium"
                >
                  {translations.contact || 'Contact Worker'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
} 