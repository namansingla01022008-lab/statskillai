import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, RotateCcw, Globe, SunMoon, Type, Shield, Check } from 'lucide-react';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const AdminSettingsPage: React.FC = () => {
  const {
    language,
    setLanguage,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    resetDemoData,
    t,
  } = useApp();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleExecuteReset = () => {
    resetDemoData();
    setShowConfirmReset(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            System Preferences & Data Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure accessibility, language dictionaries, and reset prototype factory data.
          </p>
        </div>
      </div>

      {resetSuccess && (
        <NoticeBanner type="success" title="Factory Data Restored">
          All prototype collections under key prefix 'statskillai:' have been restored to their initial baseline.
        </NoticeBanner>
      )}

      {/* Language Section */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-700" />
          <span>Interface Language (Bilingual Support)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-colors ${
              language === 'en'
                ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div>
              <p className="text-sm font-bold">English (UK / India)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Primary administrative default</p>
            </div>
            {language === 'en' && <Check className="w-5 h-5 text-teal-700" />}
          </button>

          <button
            onClick={() => setLanguage('hi')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-colors ${
              language === 'hi'
                ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div>
              <p className="text-sm font-bold">हिन्दी (Hindi)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">राष्ट्रीय शिक्षा नीति त्रि-भाषा अनुपालन</p>
            </div>
            {language === 'hi' && <Check className="w-5 h-5 text-teal-700" />}
          </button>
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <SunMoon className="w-4 h-4 text-teal-700" />
          <span>Accessibility & Contrast Controls (WCAG 2.1 AA)</span>
        </h2>

        <div className="space-y-4 text-xs">
          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block">{t('highContrast')}</span>
              <span className="text-[11px] text-slate-500">
                Enhances border definition and contrast ratios for visually impaired users.
              </span>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                highContrast ? 'bg-teal-700' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={highContrast}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Font Size Scaling */}
          <div className="space-y-2 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block">{t('fontSize')}</span>
            <div className="grid grid-cols-3 gap-3">
              {(['small', 'default', 'large'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`py-2 px-3 rounded-md font-bold text-center border transition-colors ${
                    fontSize === sz
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sz === 'small' ? t('fontSmall') : sz === 'large' ? t('fontLarge') : t('fontDefault')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Factory Reset Section */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-rose-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-rose-950 border-b border-rose-100 pb-2 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rose-700" />
          <span>Factory Data Reinitialization</span>
        </h2>

        <p className="text-xs text-slate-600 leading-relaxed">
          {t('resetConfirmText')} This action will restore 24+ courses, 12+ opportunities, 60+ sample employees, and all default demo user profiles.
        </p>

        <div>
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-5 py-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('resetDemoData')}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmReset}
        title={t('resetDemoData')}
        message={t('resetConfirmText')}
        confirmLabel={t('reset')}
        cancelLabel={t('cancel')}
        isDestructive={true}
        onCancel={() => setShowConfirmReset(false)}
        onConfirm={handleExecuteReset}
      />
    </div>
  );
};
