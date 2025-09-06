import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';

function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Language and menu controls
  const [isHindi, setIsHindi] = useState(localStorage.getItem('language') === 'hi');
  const [showPageMenu, setShowPageMenu] = useState(false);

  const toggleLang = () => {
    const newLang = isHindi ? 'en' : 'hi';
    setIsHindi(!isHindi);
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const navigateToPage = (path) => {
    navigate(path);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50 relative">
      {/* Top navigation controls */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-30">
        <button 
          onClick={() => navigateToPage('/')}
          className="p-2 md:p-3 rounded-xl bg-white/20 border border-orange-200 hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 md:w-6 h-5 md:h-6 text-gray-700" />
        </button>
      </div>
      
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3 z-30">
        <button 
          onClick={toggleLang} 
          className="px-2.5 py-1 rounded-full text-xs md:text-sm bg-white/20 border border-orange-200 text-gray-700 hover:bg-white/30"
        >
          {isHindi ? 'HI' : 'EN'}
        </button>
        <button 
          onClick={() => setShowPageMenu(v=>!v)} 
          className="p-2 md:p-3 rounded-xl bg-white/20 border border-orange-200 hover:bg-white/30 transition-colors"
        >
          <Menu className="w-5 md:w-6 h-5 md:h-6 text-gray-700" />
        </button>
      </div>

      <div className="w-full max-w-md p-8 bg-white/90 rounded-2xl shadow-xl border-2 border-orange-100">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
          {t('auth.loginTitle')}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            {t('auth.login')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <a
            href="/forgot-password"
            className="text-sm text-blue-600 hover:underline"
          >
            {t('auth.forgotPassword')}
          </a>
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">
            {t('auth.dontHaveAccount')}{' '}
            <a
              href="/register"
              className="text-blue-600 hover:underline"
            >
              {t('auth.register')}
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;