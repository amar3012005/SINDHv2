import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, FileText, Sparkles, Clock, Users, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RegistrationChoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const phoneNumber = location.state?.phoneNumber;

  const handleChatRegistration = () => {
    navigate('/worker/chat-register', { state: { phoneNumber } });
  };

  const handleFormRegistration = () => {
    navigate('/worker/form-register', { state: { phoneNumber } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Welcome to SINDH! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Let's create your worker profile
          </p>
          <p className="text-gray-500">
            Choose how you'd like to complete your registration
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Chat Registration Option */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-green-100 hover:border-green-300"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Chat Registration ✨
              </h2>
              <p className="text-gray-600">
                Like chatting on WhatsApp! Quick, easy, and friendly
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Natural conversation flow</span>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Quick suggestions for answers</span>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Mobile-friendly interface</span>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Progress tracking</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl mb-6">
              <div className="flex items-center text-green-700 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Estimated time: 3-5 minutes</span>
              </div>
              <div className="flex items-center text-green-700">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-sm">Recommended for first-time users</span>
              </div>
            </div>

            <motion.button
              onClick={handleChatRegistration}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Start Chat Registration 💬
            </motion.button>
          </motion.div>

          {/* Form Registration Option */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Traditional Form 📝
              </h2>
              <p className="text-gray-600">
                Complete step-by-step form with detailed fields
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-blue-600">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Comprehensive form fields</span>
              </div>
              <div className="flex items-center text-blue-600">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Step-by-step progress</span>
              </div>
              <div className="flex items-center text-blue-600">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Detailed validation</span>
              </div>
              <div className="flex items-center text-blue-600">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">Full control over inputs</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl mb-6">
              <div className="flex items-center text-blue-700 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Estimated time: 5-8 minutes</span>
              </div>
              <div className="flex items-center text-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                <span className="text-sm">For users who prefer forms</span>
              </div>
            </div>

            <motion.button
              onClick={handleFormRegistration}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Use Traditional Form 📋
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              💡 Don't worry, both options cover the same information
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">✨ Personal Details</span>
                <br />Name, age, contact info
              </div>
              <div>
                <span className="font-medium">🛠️ Skills & Experience</span>
                <br />Work skills and background
              </div>
              <div>
                <span className="font-medium">📍 Location & Preferences</span>
                <br />Work area and availability
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        {phoneNumber && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-500 text-sm">
              Registering with phone number: <span className="font-medium">{phoneNumber}</span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RegistrationChoice;
