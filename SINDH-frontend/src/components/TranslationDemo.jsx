import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const TranslationDemo = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Language Switcher */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('nav.selectLanguage')} - Translation Demo
          </h1>
          <LanguageSwitcher />
        </div>

        {/* Current Language Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Language: {i18n.language}</h2>
          <p className="text-gray-600">
            This demo shows how react-i18next works with your I N D U S application.
          </p>
        </div>

        {/* Navigation Translations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('nav.menu')} - Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <strong>{t('nav.home')}</strong>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>{t('nav.jobs')}</strong>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>{t('nav.profile')}</strong>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>{t('nav.login')}</strong>
            </div>
          </div>
        </div>

        {/* Login Form Translations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('login.welcome')}</h2>
          <p className="text-gray-600 mb-4">{t('login.enterPhone')}</p>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">
                {t('login.worker')}
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded">
                {t('login.employer')}
              </button>
            </div>
            
            <input 
              type="tel" 
              placeholder={t('login.phonePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md">
              {t('login.sendOtp')}
            </button>
          </div>
        </div>

        {/* Job-related Translations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('jobs.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded">
              <h3 className="font-medium">{t('jobs.location')}</h3>
              <p className="text-sm text-gray-600">{t('jobs.findInLocation')}</p>
            </div>
            <div className="p-4 border border-gray-200 rounded">
              <h3 className="font-medium">{t('jobs.wage')}</h3>
              <p className="text-sm text-gray-600">{t('jobs.findPerfectJob')}</p>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded">
              {t('jobs.apply')}
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded">
              {t('jobs.filter')}
            </button>
          </div>
        </div>

        {/* Skills Translations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('profile.skills')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {t('skills.construction.mason')}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {t('skills.agriculture.farm_labor')}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {t('skills.domestic.cook')}
            </span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              {t('skills.factory.machine_operator')}
            </span>
          </div>
        </div>

        {/* Common Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{t('common.loading')}</h2>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded">
              {t('common.save')}
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded">
              {t('common.cancel')}
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded">
              {t('common.submit')}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">How to use react-i18next:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Use <code>const {`{ t }`} = useTranslation();</code> in your components</li>
            <li>• Call <code>t('key.path')</code> to get translated text</li>
            <li>• Use nested keys like <code>t('login.welcome')</code></li>
            <li>• Language switching is automatic with the LanguageSwitcher component</li>
            <li>• Translations are stored in <code>/public/locales/[lang]/translation.json</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TranslationDemo;
