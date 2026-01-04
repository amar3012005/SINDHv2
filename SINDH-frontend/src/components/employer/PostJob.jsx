import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader,
  Shield,
  Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { buildApiUrl } from '../../utils/apiUtils';
import { db } from '../../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// --- Theme Constants ---
const COLORS = {
  orange: '#FF7124',
  orangeDark: '#e66420',
  indigo: '#3B4883',
  indigoDark: '#272D4E',
  beige: '#E8DFD5',
  sand: '#DBBBA7',
  text: '#202124',
  textMuted: 'rgba(32, 33, 36, 0.6)',
  border: 'rgba(59, 72, 131, 0.1)'
};

const PostJob = () => {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState(1); // 1=Details, 2=Location&Payment, 3=Review
  const [submitting, setSubmitting] = useState(false);
  const [employerId, setEmployerId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    salary: { amount: '', period: 'total' },
    location: {
      village: '',
      district: '',
      state: '',
      pincode: '',
      street: '',
      type: 'onsite'
    },
    employmentType: 'Full-time',
    skillsRequired: [],
    requirements: [],
    urgency: 'Normal',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
    experience: ''
  });

  const categories = [
    { value: 'Construction', emoji: '🏗️' },
    { value: 'Agriculture', emoji: '🌾' },

    { value: 'Retail', emoji: '🛍️' },
    { value: 'Hospitality', emoji: '🏨' },
    { value: 'Transportation', emoji: '🚚' },
    { value: 'Cleaning', emoji: '🧹' },
    { value: 'Security', emoji: '🛡️' },
    { value: 'Warehouse', emoji: '📦' },
    { value: 'General Labor', emoji: '👷' }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  // Load employer data in real-time
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const empId = localStorage.getItem('employerId') || user.id || user._id;

    if (!empId) {
      toast.error('Please login as an employer');
      navigate('/login?type=employer');
      return;
    }

    setEmployerId(empId);

    console.log('📡 Setting up real-time employer listener for PostJob:', empId);
    const employerRef = doc(db, 'employers', empId);
    
    const unsubscribe = onSnapshot(employerRef, (docSnap) => {
      if (docSnap.exists()) {
        const employerData = docSnap.data();
        console.log('👤 Employer profile updated in PostJob:', employerData);

        const completeEmployerProfile = {
          id: docSnap.id,
          _id: docSnap.id,
          ...employerData,
          type: 'employer'
        };

        localStorage.setItem('employerProfile', JSON.stringify(completeEmployerProfile));
        localStorage.setItem('user', JSON.stringify(completeEmployerProfile));

        // Pre-fill location from fresh employer data
        if (employerData.location) {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              village: employerData.location.village || '',
              district: employerData.location.district || '',
              state: employerData.location.state || '',
              pincode: employerData.location.pincode || ''
            }
          }));
        }
      } else {
        console.warn('⚠️ Employer profile not found in Firestore');
      }
    }, (error) => {
      console.error('❌ Employer listener error:', error);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleNext = () => {
    if (currentPhase === 1) {
      // Validate Job Details
      if (!formData.title.trim() || formData.title.trim().length < 3) {
        toast.error('Enter a valid job title (min 3 characters)');
        return;
      }
      if (!formData.category) {
        toast.error('Please select a job category');
        return;
      }
      if (!formData.description.trim() || formData.description.trim().length < 20) {
        toast.error('Enter a detailed job description (min 20 characters)');
        return;
      }
      setCurrentPhase(2);
    } else if (currentPhase === 2) {
      // Validate Location & Payment
      if (!formData.salary.amount || parseFloat(formData.salary.amount) <= 0) {
        toast.error('Enter a valid salary amount');
        return;
      }
      if (!formData.location.village.trim() && !formData.location.district.trim()) {
        toast.error('Enter the job village/town or district');
        return;
      }
      if (!formData.location.state) {
        toast.error('Select a state');
        return;
      }
      if (!formData.startDate || !formData.endDate) {
        toast.error('Please select both start and end dates');
        return;
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error('End date cannot be before start date');
        return;
      }
      setCurrentPhase(3);
    } else if (currentPhase === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (!employerId) {
      toast.error('Employer ID not found');
      navigate('/login?type=employer');
      return;
    }

    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerProfile = JSON.parse(localStorage.getItem('employerProfile') || '{}');
      const companyName = employerProfile.companyName || user.companyName || user.name || 'Company';

      const jobData = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        salary: parseFloat(formData.salary.amount),
        baseAmount: parseFloat(formData.salary.amount),
        employer: employerId,
        companyName: companyName,
        location: {
          type: formData.location.type,
          village: formData.location.village.trim(),
          district: formData.location.district.trim(),
          state: formData.location.state,
          pincode: formData.location.pincode || '',
          street: formData.location.street.trim() || '',
          // Construct address for backward compatibility
          address: [
            formData.location.village,
            formData.location.district,
            formData.location.state,
            formData.location.pincode
          ].filter(Boolean).join(', ')
        },
        employmentType: formData.employmentType,
        skillsRequired: formData.skillsRequired,
        requirements: Array.isArray(formData.requirements)
          ? formData.requirements.join(', ')
          : (formData.requirements || 'Basic requirements apply'),
        status: 'POSTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        urgency: formData.urgency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      };

      const response = await fetch(buildApiUrl('/jobs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to post job');
      }

      toast.success('Job posted successfully!');
      setTimeout(() => navigate('/employer/posted-jobs', { replace: true }), 1500);
    } catch (error) {
      toast.error(error.message || 'Failed to post job');
      setSubmitting(false);
    }
  };

  const renderPhaseContent = () => {
    if (currentPhase === 1) {
      // JOB DETAILS
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#3B4883]/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[#3B4883]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#272D4E] uppercase">Job Details</h3>
              <p className="text-xs font-bold text-[#3B4883]/50 uppercase tracking-wide">Basic information</p>
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Job Title *</label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Mason, Electrician, General Labor"
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-4 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
            />
          </div>

          {/* Category Grid */}
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Job Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setFormData(p => ({ ...p, category: cat.value }))}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${formData.category === cat.value
                    ? 'border-[#FF7124] bg-[#FF7124]/5'
                    : 'border-[#3B4883]/5 bg-white/50 hover:bg-white hover:border-[#FF7124]/30'
                    }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[9px] font-black text-[#272D4E] text-center uppercase leading-tight">{cat.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Job Description *</label>
            <textarea
              placeholder="Describe duties, requirements, and work environment..."
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-4 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm min-h-[100px] resize-none"
            />
          </div>
        </div>
      );
    } else if (currentPhase === 2) {
      // LOCATION & TIMING
      const renderPaymentFields = () => (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Base Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3B4883]/40 font-bold">₹</span>
              <input
                type="number"
                placeholder="500"
                value={formData.salary.amount}
                onChange={(e) => setFormData(p => ({ ...p, salary: { ...p.salary, amount: e.target.value } }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 pl-8 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Payment Type</label>
            <select
              value={formData.salary.period}
              onChange={(e) => setFormData(p => ({ ...p, salary: { ...p.salary, period: e.target.value } }))}
              className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
            >
              <option value="total">Base Amount</option>
              <option value="daily">Daily Wage</option>
            </select>
          </div>
        </div>
      );

      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#3B4883]/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#3B4883]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#272D4E] uppercase">Location & Timing</h3>
              <p className="text-xs font-bold text-[#3B4883]/50 uppercase tracking-wide">Where and when</p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          {/* Location Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Village / Town</label>
              <input
                type="text"
                placeholder="e.g. Salgi"
                value={formData.location.village}
                onChange={(e) => setFormData(p => ({ ...p, location: { ...p.location, village: e.target.value } }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">District</label>
              <input
                type="text"
                placeholder="e.g. Mandi"
                value={formData.location.district}
                onChange={(e) => setFormData(p => ({ ...p, location: { ...p.location, district: e.target.value } }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          {/* State & Pincode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">State *</label>
              <select
                value={formData.location.state}
                onChange={(e) => setFormData(p => ({ ...p, location: { ...p.location, state: e.target.value } }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              >
                <option value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Pincode</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={formData.location.pincode}
                onChange={(e) => setFormData(p => ({ ...p, location: { ...p.location, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-3 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          {renderPaymentFields()}

          {/* Note */}
          <div className="p-4 bg-[#FF7124]/5 rounded-2xl border border-[#FF7124]/10">
            <p className="text-[10px] text-[#FF7124] font-bold uppercase">
              💡 Clear timing helps workers plan their schedule
            </p>
          </div>
        </div>
      );
    } else if (currentPhase === 3) {
      // REVIEW
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#3B4883]/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#3B4883]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#272D4E] uppercase">Review & Post</h3>
              <p className="text-xs font-bold text-[#3B4883]/50 uppercase tracking-wide">Final job preview</p>
            </div>
          </div>

          {/* Job Card Preview - AvailableJobs Style */}
          <div className="border-2 border-[#3B4883]/10 bg-white rounded-2xl p-5 hover:shadow-lg transition-all">
            {/* Job Title & Price Row */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-[#272D4E] uppercase tracking-wide">
                {formData.title}
              </h3>
              <span className="text-2xl font-black text-[#FF7124]">
                ₹{formData.salary.amount}
              </span>
            </div>

            {/* Category Badge */}
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-[#3B4883]/10 text-[#3B4883] text-xs font-black uppercase tracking-wider border border-[#3B4883]/20">
                {formData.category}
              </span>
            </div>

            {/* Job Description */}
            <p className="text-sm text-[#202124]/70 mb-4 line-clamp-2 font-medium">
              {formData.description}
            </p>

            {/* Job Timing */}
            {(formData.startDate || formData.startTime) && (
              <div className="mb-4 flex items-center gap-2 text-[#FF7124] text-xs font-black uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>
                  {formData.startDate} {formData.startTime} - {formData.endTime}
                </span>
              </div>
            )}

            {/* Bottom Row: Location & Employment Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#3B4883] font-semibold">
                <MapPin className="w-4 h-4" />
                <span>
                  {[formData.location.village, formData.location.district].filter(Boolean).join(', ') || formData.location.state}
                </span>
              </div>

              <span className="text-xs font-bold text-[#202124]/60 uppercase">
                {formData.employmentType}
              </span>
            </div>
          </div>

          {/* Employment Type Selection (Optional) */}
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Employment Type (Optional)</label>
            <div className="grid grid-cols-2 gap-2">
              {['Full-time', 'Part-time', 'Contract', 'Temporary'].map(type => (
                <button
                  key={type}
                  onClick={() => setFormData(p => ({ ...p, employmentType: type }))}
                  className={`p-3 rounded-2xl border-2 transition-all ${formData.employmentType === type
                    ? 'border-[#FF7124] bg-[#FF7124]/5'
                    : 'border-[#3B4883]/5 bg-white/50 hover:border-[#FF7124]/30'
                    }`}
                >
                  <span className="text-[10px] font-black text-[#272D4E] uppercase">{type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col justify-center items-center overflow-hidden font-sans select-none">
      {/* Theme Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E8DFD5 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1200px 600px at 50% 0%, rgba(59, 72, 131, 0.08), transparent 70%)' }} />
        <div className="absolute top-20 right-[10%] w-[300px] h-[300px] rounded-full blur-[80px] opacity-20 bg-[#E8DFD5]" />
        <div className="absolute bottom-40 left-[10%] w-[250px] h-[250px] rounded-full blur-[100px] opacity-30 bg-[#DBBBA7]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-[10px] font-black tracking-[0.2em] text-[#FF7124] uppercase mb-1">
            New Job Posting
          </h2>
          <div className="h-1 w-12 bg-[#FF7124] mx-auto rounded-full" />
        </div>

        {/* 3-Phase Progress Bar */}
        <div className="flex justify-center gap-1.5 mb-10">
          {[1, 2, 3].map((phase) => (
            <div
              key={phase}
              className={`h-1 rounded-full transition-all duration-300 ${phase === currentPhase ? 'w-8 bg-[#FF7124]' :
                phase < currentPhase ? 'w-4 bg-[#3B4883]' : 'w-2 bg-[#3B4883]/10'
                }`}
            />
          ))}
        </div>

        {/* Phase Labels */}
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-8 text-[#3B4883]/40 px-2">
          <span className={currentPhase === 1 ? 'text-[#FF7124]' : ''}>Details</span>
          <span className={currentPhase === 2 ? 'text-[#FF7124]' : ''}>Payment</span>
          <span className={currentPhase === 3 ? 'text-[#FF7124]' : ''}>Review</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-[360px] flex flex-col"
          >
            {renderPhaseContent()}
          </motion.div>
        </AnimatePresence>

        {/* Footer Controls */}
        <div className="flex items-center gap-3 mt-8">
          {currentPhase > 1 && (
            <button
              onClick={handleBack}
              className="w-14 h-14 bg-white border-2 border-[#3B4883]/10 text-[#3B4883] rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <button
            disabled={submitting}
            onClick={handleNext}
            className="flex-1 h-14 bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF7124]/20 disabled:grayscale disabled:opacity-50 transition-all active:scale-95"
          >
            {submitting ? <Loader className="w-5 h-5 animate-spin" /> : (
              <>
                {currentPhase === 3 ? 'Post Job' : 'Next Step'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Cancel Link */}
        <div className="mt-8 text-center">
          <button onClick={() => navigate('/home')} className="text-[10px] font-black text-[#3B4883]/30 uppercase tracking-widest hover:text-[#FF7124] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostJob;