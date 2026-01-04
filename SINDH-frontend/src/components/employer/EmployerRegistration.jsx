import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader,
  User,
  MapPin,
  MapPinned,
  ShieldCheck,
  Hash,
  Building2,
  Phone
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { buildApiUrl } from '../../utils/apiUtils';
import { requestAndGetLocation, lookupPincode } from '../../services/locationService';

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

const EmployerRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();

  // Phase state (1 = Basic Info, 2 = Location, 3 = Review)
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [locationMethod, setLocationMethod] = useState(null); // 'gps' or 'manual'
  const [locationSubStep, setLocationSubStep] = useState('choice'); // 'choice', 'pincode', 'village'

  // Extract firebaseUid from navigation state
  const firebaseUid = location.state?.firebaseUid;

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: location.state?.phoneNumber || '',
    firebaseUid: firebaseUid || '', // Store the UID
    companyName: '',
    location: {
      village: '',
      district: '',
      state: '',
      pincode: '',
      coordinates: {
        type: "Point",
        coordinates: [0, 0]
      }
    },
    termsAccepted: false
  });

  const handleNext = async () => {
    if (currentPhase === 1) {
      // Validate Basic Info
      if (!formData.name.trim() || formData.name.trim().length < 3) {
        toast.error('Please enter your full name (min 3 characters)');
        return;
      }
      // Validate phone number (flexible for international numbers with country code)
      if (!formData.phone) {
        toast.error('Phone number is required');
        return;
      }
      // Check if it has country code format (+XX...)
      if (formData.phone.startsWith('+')) {
        // International format: require at least 8 digits after country code
        if (formData.phone.length < 10) {
          toast.error('Please enter a valid phone number');
          return;
        }
      } else {
        // Legacy format without country code: require exactly 10 digits
        if (formData.phone.length !== 10) {
          toast.error('Please enter a valid 10-digit phone number');
          return;
        }
      }
      setCurrentPhase(2);
    } else if (currentPhase === 2) {
      // Handle Location phase sub-steps
      if (locationSubStep === 'choice') {
        // User needs to choose GPS or Manual
        return;
      } else if (locationSubStep === 'pincode' && locationMethod === 'manual') {
        const success = await processPincode(formData.location.pincode);
        if (!success) return;
        setLocationSubStep('village');
      } else if (locationSubStep === 'village') {
        // Validate village
        if (!formData.location.village.trim() || formData.location.village.trim().length < 2) {
          toast.error('Please enter your village/area name');
          return;
        }
        setCurrentPhase(3);
      }
    } else if (currentPhase === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentPhase === 3) {
      setCurrentPhase(2);
      setLocationSubStep('village');
    } else if (currentPhase === 2) {
      if (locationSubStep === 'village') {
        if (locationMethod === 'manual') {
          setLocationSubStep('pincode');
        } else {
          setLocationSubStep('choice');
        }
      } else if (locationSubStep === 'pincode') {
        setLocationSubStep('choice');
      } else {
        setCurrentPhase(1);
      }
    } else if (currentPhase === 1) {
      navigate(-1);
    }
  };

  const processGPS = async () => {
    setLocationLoading(true);
    try {
      const result = await requestAndGetLocation();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            district: result.district || '',
            state: result.state || '',
            pincode: result.pincode || '',
            coordinates: {
              type: 'Point',
              coordinates: result.coordinates
            }
          }
        }));
        setLocationMethod('gps');
        setLocationSubStep('village');
      } else {
        toast.error(result.message || "Failed to get location");
      }
    } catch (err) {
      toast.error("Location error");
    } finally {
      setLocationLoading(false);
    }
  };

  const processPincode = async (code) => {
    if (!/^\d{6}$/.test(code)) {
      setPincodeError('Please enter a valid 6-digit pincode');
      return false;
    }
    setLocationLoading(true);
    setPincodeError('');
    try {
      const result = await lookupPincode(code);
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            district: result.district,
            state: result.state,
            pincode: result.pincode
          }
        }));
        return true;
      } else {
        setPincodeError(result.message || "Invalid pincode");
        return false;
      }
    } catch (err) {
      setPincodeError("Pincode lookup failed");
      return false;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsSubmitting(true);
    try {
      // Capture registration location and time
      let registrationLocation = null;
      try {
        const locResult = await requestAndGetLocation();
        if (locResult.success) {
          registrationLocation = {
            coordinates: locResult.coordinates, // [lng, lat]
            recordedAt: new Date().toISOString()
          };
        }
      } catch (locErr) {
        console.warn('⚠️ Could not capture registration coordinates:', locErr);
      }

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone,
        firebaseUid: formData.firebaseUid, // Explicitly include firebaseUid
        companyName: formData.companyName?.trim() || formData.name.trim(),
        location: formData.location,
        termsAccepted: formData.termsAccepted,
        phase: 1,
        registrationLocation // Add exact coordinates and timestamp
      };

      const response = await fetch(buildApiUrl('/employers/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      // Save employer id in local storage
      const employerId = data.employer._id || data.employer.id;
      if (employerId) {
        localStorage.setItem('employerId', employerId);
        localStorage.setItem('INDUS_employer_id', employerId);
        console.log('✅ Employer ID saved to localStorage:', employerId);
      }

      // Create complete employer profile dictionary with all fields
      const completeEmployerProfile = {
        id: employerId,
        _id: employerId,
        name: data.employer.name,
        phone: data.employer.phone,
        companyName: data.employer.companyName || data.employer.name,
        location: data.employer.location,
        type: 'employer',
        phase: data.employer.phase || 1,
        termsAccepted: data.employer.termsAccepted,
        createdAt: data.employer.createdAt,
        ...data.employer
      };

      // Save to localStorage in a single dictionary
      localStorage.setItem('employerProfile', JSON.stringify(completeEmployerProfile));
      localStorage.setItem('user', JSON.stringify(completeEmployerProfile));
      console.log('✅ Complete employer profile saved to localStorage:', completeEmployerProfile);

      // Ensure data has type and id for loginUser
      const employerData = {
        ...data.employer,
        id: employerId,
        type: 'employer'
      };

      loginUser(employerData);
      toast.success('Registration completed!');
      setTimeout(() => navigate('/employer/post-job'), 1500);
    } catch (error) {
      toast.error(error.message || 'Error occurred');
      setIsSubmitting(false);
    }
  };

  const renderPhaseContent = () => {
    if (currentPhase === 1) {
      // BASIC INFO PHASE
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#3B4883]/10 flex items-center justify-center">
              <User className="w-6 h-6 text-[#3B4883]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#272D4E] uppercase">Basic Information</h3>
              <p className="text-xs font-bold text-[#3B4883]/50 uppercase tracking-wide">Tell us about yourself</p>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Full Name *</label>
            <input
              type="text"
              autoFocus
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-4 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Phone Number * (Verified)</label>
            <input
              type="tel"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
              className="w-full bg-gray-100 border-2 border-[#3B4883]/10 rounded-2xl p-4 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm cursor-not-allowed"
              disabled={true}
              readOnly={true}
            />
            <p className="text-[9px] text-[#3B4883]/40 mt-1 uppercase tracking-wide">✓ Verified via OTP</p>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Company / Business Name (Optional)</label>
            <input
              type="text"
              placeholder="Enter company name"
              value={formData.companyName}
              onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
              className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-4 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
            />
            <p className="text-[9px] text-[#3B4883]/40 mt-1 uppercase tracking-wide">Leave blank if individual employer</p>
          </div>
        </div>
      );
    } else if (currentPhase === 2) {
      // LOCATION PHASE
      if (locationSubStep === 'choice') {
        return (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#3B4883]/10 flex items-center justify-center">
                <MapPinned className="w-6 h-6 text-[#3B4883]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#272D4E] uppercase">Your Location</h3>
                <p className="text-xs font-bold text-[#3B4883]/50 uppercase tracking-wide">Choose how to set location</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={processGPS}
                disabled={locationLoading}
                className="w-full bg-white hover:bg-[#FF7124]/5 border-2 border-[#3B4883]/10 hover:border-[#FF7124] rounded-2xl p-4 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <span className="text-xs font-black text-[#272D4E] uppercase">Use GPS Location</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#3B4883]/30 group-hover:text-[#FF7124] group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => {
                  setLocationMethod('manual');
                  setLocationSubStep('pincode');
                }}
                disabled={locationLoading}
                className="w-full bg-white hover:bg-[#FF7124]/5 border-2 border-[#3B4883]/10 hover:border-[#FF7124] rounded-2xl p-4 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✍️</span>
                  <span className="text-xs font-black text-[#272D4E] uppercase">Enter Pincode Manually</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#3B4883]/30 group-hover:text-[#FF7124] group-hover:translate-x-1 transition-all" />
              </button>

              {locationLoading && <div className="text-center text-[10px] font-bold text-[#FF7124] animate-pulse uppercase tracking-widest mt-2">Accessing location...</div>}
            </div>
          </div>
        );
      } else if (locationSubStep === 'pincode') {
        return (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#3B4883]/10 flex items-center justify-center">
                <Hash className="w-6 h-6 text-[#3B4883]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#272D4E] uppercase">Enter Pincode</h3>
                <p className="text-xs font-bold text-[#3B4883]/50 uppercase tracking-wide">Your 6-digit area pincode</p>
              </div>
            </div>

            <div>
              <input
                type="text"
                autoFocus
                maxLength={6}
                placeholder="000000"
                value={formData.location.pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData(p => ({ ...p, location: { ...p.location, pincode: val } }));
                  setPincodeError('');
                }}
                className={`w-full bg-white/80 border-2 ${pincodeError ? 'border-red-400' : 'border-[#3B4883]/10'} focus:border-[#FF7124] rounded-2xl p-4 text-center text-2xl font-black tracking-[0.5em] text-[#3B4883] transition-all outline-none shadow-sm`}
              />
              {pincodeError && <div className="text-[10px] text-red-500 font-bold uppercase mt-2 text-center">{pincodeError}</div>}
            </div>
          </div>
        );
      } else if (locationSubStep === 'village') {
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#3B4883]/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[#3B4883]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#272D4E] uppercase">Location Details</h3>
                <p className="text-xs font-bold text-[#3B4883]/50 uppercase tracking-wide">
                  {formData.location.district ? `${formData.location.district}, ` : ''}{formData.location.state || 'Complete your address'}
                </p>
              </div>
            </div>

            {/* Village */}
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">Village / Area / City *</label>
              <input
                type="text"
                autoFocus
                placeholder="Enter village, town or city"
                value={formData.location.village}
                onChange={(e) => setFormData(p => ({ ...p, location: { ...p.location, village: e.target.value } }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-4 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>

            {/* District (auto-filled, optional edit) */}
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">District (Optional)</label>
              <input
                type="text"
                placeholder="Auto-filled from pincode"
                value={formData.location.district}
                onChange={(e) => setFormData(p => ({ ...p, location: { ...p.location, district: e.target.value } }))}
                className="w-full bg-white/80 border-2 border-[#3B4883]/10 focus:border-[#FF7124] rounded-2xl p-4 text-sm font-bold text-[#272D4E] transition-all outline-none shadow-sm"
              />
            </div>

            {/* State (read-only) */}
            <div>
              <label className="block text-[10px] font-black text-[#3B4883]/70 uppercase tracking-wider mb-2">State *</label>
              <div className="w-full bg-[#E8DFD5]/30 border-2 border-[#3B4883]/10 rounded-2xl p-4 text-sm font-bold text-[#272D4E]">
                {formData.location.state || 'Auto-filled from pincode'}
              </div>
            </div>
          </div>
        );
      }
    } else if (currentPhase === 3) {
      // REVIEW PHASE
      return (
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-[#3B4883]/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#3B4883]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#272D4E] uppercase">Review & Submit</h3>
              <p className="text-xs font-bold text-[#3B4883]/50 uppercase tracking-wide">Verify your details</p>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-[#F8F5F2] rounded-2xl p-6 mb-6 space-y-4 border border-[#3B4883]/5">
            <div>
              <p className="text-[9px] font-black text-[#3B4883]/50 uppercase tracking-wider mb-1">Full Name</p>
              <p className="font-bold text-[#202124]">{formData.name}</p>
            </div>

            <div>
              <p className="text-[9px] font-black text-[#3B4883]/50 uppercase tracking-wider mb-1">Phone Number</p>
              <p className="font-bold text-[#202124]">{formData.phone}</p>
            </div>

            {formData.companyName && (
              <div>
                <p className="text-[9px] font-black text-[#3B4883]/50 uppercase tracking-wider mb-1">Company Name</p>
                <p className="font-bold text-[#202124]">{formData.companyName}</p>
              </div>
            )}

            <div>
              <p className="text-[9px] font-black text-[#3B4883]/50 uppercase tracking-wider mb-1">Location</p>
              <p className="font-bold text-[#202124]">
                {formData.location.village}
                {formData.location.district && `, ${formData.location.district}`}
                {formData.location.state && `, ${formData.location.state}`}
                {formData.location.pincode && ` - ${formData.location.pincode}`}
              </p>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-white/50 border-2 border-[#3B4883]/5 rounded-2xl p-5">
            <div className="flex gap-4">
              <div
                onClick={() => setFormData(p => ({ ...p, termsAccepted: !p.termsAccepted }))}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${formData.termsAccepted ? 'bg-[#FF7124] border-[#FF7124]' : 'bg-white border-[#3B4883]/20'
                  }`}
              >
                {formData.termsAccepted && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <p className="text-[10px] font-bold text-[#272D4E]/70 leading-relaxed uppercase">
                I agree to the <span className="text-[#FF7124]">Terms of Service</span> & <span className="text-[#FF7124]">Privacy Policy</span> of the SINDH platform.
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  const canProceed = () => {
    if (currentPhase === 2 && locationSubStep === 'choice') return false;
    return true;
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

      <div className="relative z-10 w-full max-w-[400px] px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-[10px] font-black tracking-[0.2em] text-[#FF7124] uppercase mb-1">
            Employer Registration
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
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-8 text-[#3B4883]/40">
          <span className={currentPhase === 1 ? 'text-[#FF7124]' : ''}>Basic Info</span>
          <span className={currentPhase === 2 ? 'text-[#FF7124]' : ''}>Location</span>
          <span className={currentPhase === 3 ? 'text-[#FF7124]' : ''}>Review</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPhase}-${locationSubStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-[320px] flex flex-col"
          >
            {renderPhaseContent()}
          </motion.div>
        </AnimatePresence>

        {/* Footer Controls */}
        <div className="flex items-center gap-3 mt-8">
          {(currentPhase > 1 || (currentPhase === 2 && locationSubStep !== 'choice')) && (
            <button
              onClick={handleBack}
              className="w-14 h-14 bg-white border-2 border-[#3B4883]/10 text-[#3B4883] rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {canProceed() && (
            <button
              disabled={isSubmitting || locationLoading}
              onClick={handleNext}
              className="flex-1 h-14 bg-gradient-to-r from-[#FF7124] to-[#e66420] text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF7124]/20 disabled:grayscale disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : (
                <>
                  {currentPhase === 3 ? 'Complete Registration' : 'Next Step'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Legal Bottom Link */}
        <div className="mt-8 text-center">
          <button onClick={() => navigate('/')} className="text-[10px] font-black text-[#3B4883]/30 uppercase tracking-widest hover:text-[#FF7124] transition-colors">
            Cancel Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployerRegistration;