import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ArrowRight } from 'lucide-react';

const UnifiedRegistration = () => {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState(null);

  const handleUserTypeSelection = (userType) => {
    setSelectedUserType(userType);
    
    // Navigate to the appropriate registration page
    if (userType === 'worker') {
      navigate('/worker/register');
    } else if (userType === 'employer') {
      navigate('/employer/register');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#202124] relative overflow-hidden font-sans select-none flex items-center justify-center p-6">
      {/* Theme Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% 0%, rgba(59, 72, 131, 0.08), transparent 70%)' }} />
        <div className="absolute top-20 right-[10%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 bg-[#E8DFD5]" />
        <div className="absolute bottom-40 left-[10%] w-[250px] h-[250px] rounded-full blur-[100px] opacity-30 bg-[#DBBBA7]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl w-full space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border-2 border-[#3B4883]/5 relative z-10"
      >
        <div className="text-center">
          <h2 className="text-[10px] font-black tracking-[0.3em] text-[#FF7124] uppercase mb-4">Join Platform</h2>
          <h1 className="text-4xl font-black text-[#3B4883] tracking-tighter uppercase mb-2">Welcome to Sindh</h1>
          <p className="text-sm font-bold text-[#3B4883]/40 uppercase tracking-widest">
            Choose your path to get started
          </p>
        </div>

        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleUserTypeSelection('worker')}
            className="relative rounded-3xl border-2 border-[#3B4883]/10 bg-white/50 p-6 flex items-center space-x-6 hover:border-[#FF7124] hover:bg-[#FF7124]/5 cursor-pointer transition-all group"
          >
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-[#FF7124]/10 flex items-center justify-center text-[#FF7124] group-hover:bg-[#FF7124] group-hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-[#3B4883] uppercase tracking-tight">Register as a Worker</h3>
              <p className="text-xs font-bold text-[#3B4883]/40 uppercase tracking-wide">
                Find work & earn daily wages
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#3B4883]/20 group-hover:text-[#FF7124] transition-all" />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleUserTypeSelection('employer')}
            className="relative rounded-3xl border-2 border-[#3B4883]/10 bg-white/50 p-6 flex items-center space-x-6 hover:border-[#3B4883] hover:bg-[#3B4883]/5 cursor-pointer transition-all group"
          >
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-[#3B4883]/10 flex items-center justify-center text-[#3B4883] group-hover:bg-[#3B4883] group-hover:text-white transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-[#3B4883] uppercase tracking-tight">Register as an Employer</h3>
              <p className="text-xs font-bold text-[#3B4883]/40 uppercase tracking-wide">
                Hire skilled workers today
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#3B4883]/20 group-hover:text-[#3B4883] transition-all" />
          </motion.div>
        </div>

        <div className="text-center pt-4">
          <p className="text-[10px] font-black text-[#3B4883]/30 uppercase tracking-[0.2em] mb-4">
            Already have an account?
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-white border-2 border-[#3B4883]/10 rounded-2xl text-[10px] font-black text-[#3B4883] uppercase tracking-widest hover:border-[#FF7124] hover:text-[#FF7124] transition-all shadow-sm active:scale-95"
          >
            Sign In Here
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UnifiedRegistration;
