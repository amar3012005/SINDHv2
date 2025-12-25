import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, FileText, Sparkles, Clock, Users, CheckCircle } from 'lucide-react';

const RegistrationChoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber;

  const handleChatRegistration = () => {
    navigate('/worker/chat-register', { state: { phoneNumber } });
  };

  const handleFormRegistration = () => {
    navigate('/worker/form-register', { state: { phoneNumber } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#E8DFD5] to-[#DBBBA7] relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Blur Circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#E8DFD5] rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#DBBBA7] rounded-full blur-3xl opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF7124]/10 rounded-full blur-3xl opacity-40" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-r from-[#FF7124] to-[#e66420] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF7124] to-[#3B4883] bg-clip-text text-transparent mb-4">
            SINDH में आपका स्वागत है! 🎉
          </h1>
          <p className="text-xl text-[#202124] mb-2">
            आइए आपकी प्रोफ़ाइल बनाएं
          </p>
          <p className="text-[#202124]/60">
            रजिस्ट्रेशन पूरा करने का तरीका चुनें
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Chat Registration Option */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-[#FF7124]/20 hover:border-[#FF7124]"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#FF7124] to-[#e66420] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#202124] mb-2">
                चैट रजिस्ट्रेशन ✨
              </h2>
              <p className="text-[#202124]/70">
                WhatsApp जैसी चैट! जल्दी, आसान और मैत्रीपूर्ण
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-[#FF7124]">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm text-[#202124]">प्राकृतिक बातचीत</span>
              </div>
              <div className="flex items-center text-[#FF7124]">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm text-[#202124]">त्वरित सुझाव</span>
              </div>
              <div className="flex items-center text-[#FF7124]">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm text-[#202124]">मोबाइल-फ्रेंडली</span>
              </div>
              <div className="flex items-center text-[#FF7124]">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm text-[#202124]">प्रगति ट्रैकिंग</span>
              </div>
            </div>

            <div className="bg-[#E8DFD5]/50 p-4 rounded-xl mb-6 border border-[#FF7124]/10">
              <div className="flex items-center text-[#202124] mb-2">
                <Clock className="w-4 h-4 mr-2 text-[#FF7124]" />
                <span className="text-sm font-medium">अनुमानित समय: 3-5 मिनट</span>
              </div>
              <div className="flex items-center text-[#202124]">
                <Users className="w-4 h-4 mr-2 text-[#FF7124]" />
                <span className="text-sm">पहली बार उपयोगकर्ताओं के लिए सुझाव</span>
              </div>
            </div>

            <motion.button
              onClick={handleChatRegistration}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              चैट रजिस्ट्रेशन शुरू करें 💬
            </motion.button>
          </motion.div>

          {/* Form Registration Option */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-[#3B4883]/20 hover:border-[#3B4883]"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#3B4883] to-[#272D4E] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#202124] mb-2">
                पारंपरिक फॉर्म 📝
              </h2>
              <p className="text-[#202124]/70">
                विस्तृत फ़ील्ड के साथ चरण-दर-चरण फॉर्म
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-[#3B4883]">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm text-[#202124]">व्यापक फॉर्म फ़ील्ड</span>
              </div>
              <div className="flex items-center text-[#3B4883]">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm text-[#202124]">चरण-दर-चरण प्रगति</span>
              </div>
              <div className="flex items-center text-[#3B4883]">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm text-[#202124]">विस्तृत मान्यता</span>
              </div>
              <div className="flex items-center text-[#3B4883]">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm text-[#202124]">इनपुट पर पूर्ण नियंत्रण</span>
              </div>
            </div>

            <div className="bg-[#E8DFD5]/50 p-4 rounded-xl mb-6 border border-[#3B4883]/10">
              <div className="flex items-center text-[#202124] mb-2">
                <Clock className="w-4 h-4 mr-2 text-[#3B4883]" />
                <span className="text-sm font-medium">अनुमानित समय: 5-8 मिनट</span>
              </div>
              <div className="flex items-center text-[#202124]">
                <FileText className="w-4 h-4 mr-2 text-[#3B4883]" />
                <span className="text-sm">फॉर्म पसंद करने वालों के लिए</span>
              </div>
            </div>

            <motion.button
              onClick={handleFormRegistration}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#3B4883] to-[#272D4E] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              पारंपरिक फॉर्म का उपयोग करें 📋
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#3B4883]/10">
            <h3 className="text-lg font-semibold text-[#202124] mb-3">
              💡 चिंता न करें, दोनों विकल्प एक ही जानकारी कवर करते हैं
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-[#202124]/70">
              <div>
                <span className="font-medium text-[#202124]">✨ व्यक्तिगत विवरण</span>
                <br />नाम, उम्र, संपर्क जानकारी
              </div>
              <div>
                <span className="font-medium text-[#202124]">🛠️ कौशल और अनुभव</span>
                <br />काम के कौशल और पृष्ठभूमि
              </div>
              <div>
                <span className="font-medium text-[#202124]">📍 स्थान और प्राथमिकताएं</span>
                <br />काम का क्षेत्र और उपलब्धता
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
            <p className="text-[#202124]/60 text-sm">
              फ़ोन नंबर से रजिस्टर कर रहे हैं: <span className="font-medium text-[#202124]">{phoneNumber}</span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RegistrationChoice;
