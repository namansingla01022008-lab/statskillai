import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Shield,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building2,
  Briefcase,
  AlertCircle,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Role, ProfileType } from '../types';

export const LoginPage: React.FC = () => {
  const { allUsers, switchUser, login, registerUser, t } = useApp();
  const navigate = useNavigate();

  // Mode: 'demo' | 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'demo'>('demo');
  const [selectedDemoRole, setSelectedDemoRole] = useState<Role>('learner');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('learner');
  const [profileType, setProfileType] = useState<ProfileType>('Student');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredDemoUsers = allUsers.filter((u) => u.role === selectedDemoRole);

  const redirectByRole = (userRole: Role) => {
    if (userRole === 'admin') {
      navigate('/admin/analytics');
    } else if (userRole === 'mentor') {
      navigate('/mentor/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSelectDemoUser = async (userId: string, userRole: Role) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await switchUser(userId);
      redirectByRole(userRole);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initialize demo session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength checklist
  const passwordCriteria = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!fullName || !email || !password) {
      setErrorMessage('Please complete all required fields (Name, Email, Password).');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Password must satisfy all security requirements (min 8 characters, uppercase, lowercase, number, symbol).');
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser({
        name: fullName,
        email,
        password,
        role,
        profileType,
        department,
        designation,
      });
      setSuccessMessage('Registration successful! Redirecting to workspace...');
      setTimeout(() => redirectByRole(user.role), 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Banner */}
      <div className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs py-2 px-4 text-center">
        <span>{t('govInitiative')} • Production Authentication Gateway</span>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-3xl w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white shadow-lg mb-1">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              StatSkill<span className="text-teal-400">AI</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              AI-Powered Competency Measurement & Career Development Platform Aligned with NEP-2020
            </p>
          </div>

          {/* Tab Navigation: Demo / Sign In / Register */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('demo'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                authMode === 'demo' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>One-Click Demo</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                authMode === 'signin' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMessage(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                authMode === 'register' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: ONE-CLICK DEMO ACCOUNTS */}
          {authMode === 'demo' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Persona Category
                </span>
                <span className="text-[11px] text-teal-400">JWT Token Auth Enabled</span>
              </div>

              {/* Role Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                {(['learner', 'mentor', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedDemoRole(r)}
                    className={`py-1.5 px-3 rounded-md text-xs font-bold capitalize transition-all ${
                      selectedDemoRole === r ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r === 'learner' ? t('roleLearner') : r === 'mentor' ? t('roleMentor') : t('roleAdmin')}
                  </button>
                ))}
              </div>

              {/* Demo User Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {filteredDemoUsers.map((user) => (
                  <button
                    key={user.id}
                    disabled={loading}
                    onClick={() => handleSelectDemoUser(user.id, user.role)}
                    className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500 text-left transition-all group flex flex-col justify-between disabled:opacity-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm group-hover:text-teal-300">
                          {user.name}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-1" />
                      </div>
                      {user.profileType && (
                        <span className="inline-block text-[10px] uppercase font-bold text-teal-400 bg-teal-950/80 border border-teal-800 px-1.5 py-0.5 rounded">
                          {user.profileType}
                        </span>
                      )}
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {user.designation}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800 truncate">
                      {user.department || user.email}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: REAL SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@ministry.gov.in or email@univ.edu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to StatSkillAI'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: REGISTRATION FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="official.email@org.in"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars with upper, lower, number, symbol"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                    required
                  />
                  {authMode === 'register' && password.length > 0 && (
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] space-y-1 mt-1">
                      <div className="grid grid-cols-2 gap-1">
                        <span className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>
                          {passwordCriteria.length ? '✓' : '○'} Min 8 characters
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasUpper && passwordCriteria.hasLower ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>
                          {passwordCriteria.hasUpper && passwordCriteria.hasLower ? '✓' : '○'} Upper & lower
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>
                          {passwordCriteria.hasNumber ? '✓' : '○'} Number (0-9)
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasSpecial ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>
                          {passwordCriteria.hasSpecial ? '✓' : '○'} Symbol (!@#$)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Platform Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                  >
                    <option value="learner">Learner (Student / Professional)</option>
                    <option value="mentor">Mentor (Statistical & Domain Advisor)</option>
                    <option value="admin">Institutional Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Profile Persona Category *</label>
                  <select
                    value={profileType}
                    onChange={(e) => setProfileType(e.target.value as ProfileType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                  >
                    <option value="Student">Student (Higher Ed / BCA / Data Science)</option>
                    <option value="Government Employee">Government Employee (MoSPI / NIC / PSU)</option>
                    <option value="Private-Sector Professional">Private-Sector Professional</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Institution / Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Ministry of Statistics / Indian Statistical Institute"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Current Role / Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Junior Statistical Investigator / Data Analyst"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Creating Account...' : 'Complete Registration & Access Workspace'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Privacy Notice Box */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-teal-900/60 text-xs text-slate-300 flex items-start gap-3">
            <Lock className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-teal-300 block">
                Official Privacy Assurance
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {t('privacyNotice')} In accordance with the Digital Personal Data Protection (DPDP) Act 2023, credentials are cryptographically hashed and session tokens are strictly scoped.
              </p>
            </div>
          </div>

          {/* Explore About */}
          <div className="text-center pt-1">
            <a
              href="#/about"
              className="text-xs text-teal-400 hover:text-teal-300 hover:underline font-medium"
            >
              Learn about StatSkillAI’s NEP-2020 Architecture & Future Roadmap →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800">
        StatSkillAI • Government & Enterprise Competency Intelligence Framework
      </footer>
    </div>
  );
};
