import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  SunMoon,
  Type,
  Users,
  Menu,
  Shield,
  ChevronDown,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    switchUser,
    allUsers,
    logout,
    language,
    setLanguage,
    t,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    resetDemoData,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showA11yMenu, setShowA11yMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-sm">
        {/* Top official banner */}
        <div className="bg-slate-950 text-slate-400 text-[11px] px-4 py-1 flex items-center justify-between border-b border-slate-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500" aria-hidden="true" />
            <span className="tracking-wide uppercase font-semibold text-slate-300">
              {t('govInitiative')}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-slate-400">{t('privacyNotice')}</span>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-slate-800 text-slate-200"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <a href="#/" className="flex items-center gap-3 group focus:outline-hidden focus:ring-2 focus:ring-teal-400 rounded-md p-1">
              <div className="w-9 h-9 rounded-md bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-inner">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  StatSkill<span className="text-teal-400">AI</span>
                </span>
                <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium leading-none">
                  {t('appTagline')}
                </p>
              </div>
            </a>
          </div>

          {/* Right Action Tools: Language, Accessibility, User Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle */}
            <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  language === 'en'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={language === 'en'}
                aria-label="Switch language to English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  language === 'hi'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-pressed={language === 'hi'}
                aria-label="Switch language to Hindi"
              >
                हिन्दी
              </button>
            </div>

            {/* Accessibility dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowA11yMenu(!showA11yMenu)}
                className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 text-xs font-medium focus:ring-2 focus:ring-teal-400"
                aria-label={t('accessibility')}
                aria-expanded={showA11yMenu}
              >
                <SunMoon className="w-4 h-4 text-teal-400" />
                <span className="hidden md:inline">{t('accessibility')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showA11yMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 p-4 space-y-3 z-50 text-xs"
                  role="menu"
                >
                  <div className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <SunMoon className="w-4 h-4 text-teal-700" />
                    <span>{t('accessibility')}</span>
                  </div>

                  {/* High Contrast */}
                  <div className="flex items-center justify-between py-1">
                    <span className="font-medium text-slate-700">{t('highContrast')}</span>
                    <button
                      onClick={() => setHighContrast(!highContrast)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                        highContrast ? 'bg-teal-700' : 'bg-slate-300'
                      }`}
                      aria-checked={highContrast}
                      role="switch"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          highContrast ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Font Size Toggle */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <span className="font-medium text-slate-700 block">{t('fontSize')}</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['small', 'default', 'large'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setFontSize(sz)}
                          className={`py-1 px-1.5 rounded border text-center font-medium capitalize ${
                            fontSize === sz
                              ? 'bg-teal-100 border-teal-500 text-teal-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {sz === 'small' ? t('fontSmall') : sz === 'large' ? t('fontLarge') : t('fontDefault')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset demo data */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowA11yMenu(false);
                        setShowResetConfirm(true);
                      }}
                      className="w-full text-left flex items-center gap-2 text-rose-700 hover:text-rose-900 font-medium py-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t('resetDemoData')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Demo User Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-medium focus:ring-2 focus:ring-teal-400"
                aria-expanded={showUserMenu}
                aria-label="Switch active demo account"
              >
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-teal-400 uppercase leading-none font-semibold">
                    {currentUser.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 p-2 z-50 text-xs divide-y divide-slate-100"
                  role="menu"
                >
                  <div className="p-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Demo Accounts (NEP-2020 Personas)
                    </p>
                  </div>

                  <div className="py-1 space-y-1">
                    {allUsers.map((u) => {
                      const isActive = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setShowUserMenu(false);
                            // navigate to home hash based on role
                            window.location.hash = u.role === 'admin' ? '#/admin/analytics' : u.role === 'mentor' ? '#/mentor/dashboard' : '#/dashboard';
                          }}
                          className={`w-full text-left p-2 rounded-md flex items-start gap-2.5 transition-colors ${
                            isActive
                              ? 'bg-teal-50 border border-teal-200 text-teal-950 font-medium'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0 ${
                            u.role === 'admin' ? 'bg-amber-600 text-white' : u.role === 'mentor' ? 'bg-indigo-600 text-white' : 'bg-teal-700 text-white'
                          }`}>
                            {u.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold truncate text-slate-900">{u.name}</span>
                              {isActive && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                            </div>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded mt-0.5">
                              {u.profileType || u.role}
                            </span>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{u.designation}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 pt-2">
                    <button
                      onClick={async () => {
                        await logout();
                        setShowUserMenu(false);
                        window.location.hash = '#/login';
                      }}
                      className="w-full text-center py-1.5 text-slate-600 hover:text-rose-700 font-semibold hover:underline text-xs"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Dialog */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title={t('resetDemoData')}
        message={t('resetConfirmText')}
        confirmLabel={t('reset')}
        cancelLabel={t('cancel')}
        isDestructive={true}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetDemoData();
          setShowResetConfirm(false);
          window.location.hash = '#/dashboard';
        }}
      />
    </>
  );
};
