import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { TranslationContext } from '../context/TranslationContext';

const Registration = () => {
  const { registerUser } = useContext(UserContext);
  const { translate, currentLanguage } = useContext(TranslationContext);
  const navigate = useNavigate();
  
  const isHindi = currentLanguage === 'hi';
  const audioInstructionRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    location: '',
    skills: '',
    gender: '',
    age: '',
    aadhaarLinked: false,
    preferredWork: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showVoice, setShowVoice] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Process skills into array
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill !== '');

      // Register the user
      registerUser({
        ...formData,
        skills: skillsArray,
        voiceResume: formData.voiceResume || null,
        shaktiScore: 35, // Default starting score
        workHistory: [],
        avgRating: 0,
        registrationComplete: true,
      });

      // Redirect to profile page
      navigate('/profile');
    } catch (err) {
      setError(translate('register.error') || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.mobile)) {
      setError(translate('register.requiredFields') || 'Please fill all required fields');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  // For voice recording demo
  const handleStartVoiceRecording = () => {
    setShowVoice(true);
  };

  const handleStopVoiceRecording = () => {
    setFormData({
      ...formData,
      voiceResume: "voice_recording.mp3" // Simulated voice recording file
    });
    setShowVoice(false);
  };

  // Audio instructions for low-literacy users
  const playAudioInstructions = () => {
    if (audioInstructionRef.current) {
      if (isAudioPlaying) {
        audioInstructionRef.current.pause();
      } else {
        audioInstructionRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  // Show contextual help
  const toggleHelp = () => {
    setHelpVisible(!helpVisible);
  };

  // Get audio instruction source based on current language and step
  const getAudioSource = () => {
    const language = currentLanguage === 'hi' ? 'hindi' : 'english';
    return `/audio/register_${language}_step${step}.mp3`; // You would need to add these audio files
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto pb-16">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">{translate('register.title')}</h1>
              <span className="bg-green-600 px-3 py-1 rounded-full text-xs">
                {translate('grameenlink.title')}
              </span>
            </div>
            <div className="bg-zinc-800 w-full h-2 rounded-full mb-2">
              <div 
                className="bg-green-500 h-full rounded-full transition-all"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 flex justify-between">
              <span>{translate('register.step') || `Step ${step}/3`}</span>
              <span>
                {step === 1 
                  ? (translate('register.basicInfo') || "Basic Info") 
                  : step === 2 
                  ? (translate('register.locationSkills') || "Location & Skills") 
                  : (translate('register.finalStep') || "Final Step")}
              </span>
            </div>
          </div>

          {/* Audio Instructions Button - Prominent for low-literacy users */}
          <div className="mb-6">
            <button
              type="button"
              onClick={playAudioInstructions}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAudioPlaying ? 
                  "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" : 
                  "M9 19V6l12 6-12 7z"} />
              </svg>
              <span>{isAudioPlaying ? (translate('register.stopAudio') || "Stop Audio") : (translate('register.listenInstructions') || "Listen to Instructions")}</span>
            </button>
            <audio ref={audioInstructionRef} src={getAudioSource()} onEnded={() => setIsAudioPlaying(false)} />
            
            {/* Help/Assistance button */}
            <button
              type="button"
              onClick={toggleHelp}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2 bg-transparent border border-gray-600 hover:border-gray-500 rounded-lg text-gray-300 text-sm transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{translate('register.needHelp') || "Need Help?"}</span>
            </button>
          </div>

          {/* Contextual Help Dialog */}
          {helpVisible && (
            <div className="mb-6 p-4 bg-blue-900/40 border border-blue-500/30 rounded-lg">
              <h3 className="font-medium text-blue-300 mb-2">{translate('register.helpTitle') || "How to Register"}</h3>
              <p className="text-sm text-gray-300 mb-3">{translate(`register.help.step${step}`) || "Fill in the required information and tap Next to continue."}</p>
              <div className="flex space-x-2">
                <a href="tel:1800123456" className="flex items-center justify-center px-3 py-2 bg-blue-600 rounded text-sm text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {translate('register.callForHelp') || "Call for Help"}
                </a>
                <button 
                  className="flex items-center justify-center px-3 py-2 bg-gray-700 rounded text-sm text-white"
                  onClick={() => setHelpVisible(false)}
                >
                  {translate('register.closeHelp') || "Close"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-4 rounded-lg mb-4 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div>
              <h2 className="text-xl mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white mr-2">1</span>
                {translate('profile.personalInfo')}
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-base text-gray-300 mb-2">
                    {translate('register.name')} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg"
                    required
                    placeholder={isHindi ? "अपना नाम यहां लिखें" : "Enter your name here"}
                  />
                </div>
                
                <div>
                  <label className="block text-base text-gray-300 mb-2">
                    {translate('register.mobile')} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-0 inset-y-0 flex items-center pl-4 text-gray-400">+91</span>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-12 pr-4 py-3 text-white text-lg"
                      required
                      pattern="[0-9]{10}"
                      maxLength="10"
                      placeholder={isHindi ? "10 अंकों का मोबाइल नंबर" : "10-digit mobile number"}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-2a1 1 0 112 0v2a1 1 0 01-1 1z" clipRule="evenodd" />
                    </svg>
                    {isHindi ? "इस नंबर पर OTP भेजा जाएगा" : "An OTP will be sent to this number"}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base text-gray-300 mb-2">
                      {translate('register.gender')}
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg"
                    >
                      <option value="">{translate('register.select')}</option>
                      <option value="male">{translate('register.male')}</option>
                      <option value="female">{translate('register.female')}</option>
                      <option value="other">{translate('register.other')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-base text-gray-300 mb-2">
                      {translate('register.age')}
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg"
                      min="18"
                      max="80"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg text-lg font-medium transition-colors mt-6"
                >
                  {translate('register.next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location and Skills */}
          {step === 2 && (
            <div>
              <h2 className="text-xl mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white mr-2">2</span>
                {translate('register.locationSkills')}
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-base text-gray-300 mb-2">
                    {translate('register.location')}
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={isHindi ? "गांव/जिला/राज्य" : "Village/District/State"}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-base text-gray-300 mb-2">
                    {translate('register.skills')}
                  </label>
                  <div className="mb-3">
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder={isHindi ? "कौशल अलग-अलग कॉमा से लिखें" : "Comma-separated skills"}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg"
                    />
                  </div>
                  
                  {/* Skill quick selection buttons for common roles */}
                  <div className="flex flex-wrap gap-2">
                    {['construction', 'agriculture', 'domestic', 'factory'].map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          const skillName = translate(`register.${skill}`);
                          if (formData.skills) {
                            if (!formData.skills.includes(skillName)) {
                              setFormData({...formData, skills: `${formData.skills}, ${skillName}`});
                            }
                          } else {
                            setFormData({...formData, skills: skillName});
                          }
                        }}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm border border-zinc-700"
                      >
                        + {translate(`register.${skill}`)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-base text-gray-300 mb-2">
                    {translate('register.preferredWork')}
                  </label>
                  <select
                    name="preferredWork"
                    value={formData.preferredWork}
                    onChange={handleChange}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg"
                  >
                    <option value="">{translate('register.select')}</option>
                    <option value="construction">{translate('register.construction')}</option>
                    <option value="agriculture">{translate('register.agriculture')}</option>
                    <option value="factory">{translate('register.factory')}</option>
                    <option value="domestic">{translate('register.domestic')}</option>
                    <option value="other">{translate('register.otherWork')}</option>
                  </select>
                </div>
                
                <div className="flex items-center py-2">
                  <input
                    type="checkbox"
                    id="aadhaarLinked"
                    name="aadhaarLinked"
                    checked={formData.aadhaarLinked}
                    onChange={handleChange}
                    className="w-5 h-5 mr-3"
                  />
                  <label htmlFor="aadhaarLinked" className="text-base">
                    {translate('register.aadhaarLinked')}
                  </label>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-4 rounded-lg text-lg transition-colors"
                  >
                    {translate('register.back')}
                  </button>
                  
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-lg transition-colors"
                  >
                    {translate('register.next')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Voice Resume and Finalization */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white mr-2">3</span>
                {translate('grameenlink.voice.title')}
              </h2>
              <p className="text-gray-400 text-base mb-6">
                {translate('register.voiceResumeDesc')}
              </p>
              
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 mb-6">
                {!showVoice && !formData.voiceResume ? (
                  <div className="text-center py-6">
                    <div className="mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartVoiceRecording}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg inline-flex items-center space-x-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      <span>{translate('register.startRecording')}</span>
                    </button>
                    <p className="mt-3 text-sm text-gray-500">
                      {isHindi ? "अपने काम के बारे में 30 सेकंड तक बोलें" : "Speak about your work for up to 30 seconds"}
                    </p>
                  </div>
                ) : showVoice ? (
                  <div className="text-center py-8">
                    <div className="flex justify-center items-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full mb-3">
                      <div className="bg-red-500 h-full rounded-full animate-pulse w-2/3"></div>
                    </div>
                    <p className="text-base text-gray-300 mb-6">
                      {translate('register.recording')}
                    </p>
                    <button
                      type="button"
                      onClick={handleStopVoiceRecording}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg"
                    >
                      {translate('register.stopRecording')}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-500 text-lg font-medium">{translate('register.recordingComplete')}</span>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg mb-4">
                      <div className="flex items-center">
                        <button className="text-white bg-zinc-700 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="flex-1">
                          <div className="bg-zinc-800 h-2 rounded-full">
                            <div className="bg-green-500 h-full rounded-full w-3/4"></div>
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-gray-400">0:22</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartVoiceRecording}
                      className="text-base text-gray-400 underline"
                    >
                      {translate('register.reRecord')}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="border-t border-zinc-800 pt-6 mb-6">
                <p className="text-center text-base text-gray-300 mb-4">
                  {translate('register.finalizeAccount')}
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-4 rounded-lg text-lg transition-colors"
                >
                  {translate('register.back')}
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
                      <span>{translate('register.processing')}</span>
                    </div>
                  ) : translate('register.submit')}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-base text-gray-400">
            {translate('register.alreadyAccount')}{' '}
            <button 
              onClick={() => navigate('/login')} 
              className="text-green-400 hover:underline font-medium"
            >
              {translate('nav.login')}
            </button>
          </p>
          
          {/* Assisted registration option for those who need help */}
          <div className="mt-4">
            <button 
              onClick={() => navigate('/assisted-registration')}
              className="text-sm text-gray-500 hover:underline"
            >
              {translate('register.assistedRegistration') || "Need help? Register with assistance"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;