import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { LearnerProfile, PreviousTraining, ProfileType, DomainType } from '../../types';
import { DOMAINS } from '../../constants/competency';
import {
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  Target,
  X,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const ProfilePage: React.FC = () => {
  const { currentUser, activeProfile, updateProfile, t } = useApp();
  const { isOnline } = useNetworkStatus();

  const [formData, setFormData] = useState<LearnerProfile>(() => {
    return (
      activeProfile || {
        userId: currentUser.id,
        fullName: currentUser.name,
        profileType: currentUser.profileType || 'Student',
        highestEducation: 'B.Tech / Bachelor’s Degree',
        qualifications: 'Secondary & Higher Secondary Certificates',
        currentRoleOrCourse: currentUser.designation || 'Learner',
        yearsOfExperience: 0,
        organisationOrInstitution: currentUser.department || 'National University',
        skills: ['Python', 'SQL', 'Data Analysis'],
        interests: ['Statistical Sampling', 'E-Governance'],
        previousTrainings: [],
        careerGoal: 'Develop verified competencies aligned with public sector data programs.',
        targetDomainScores: { Technical: 70, Statistical: 70, Digital: 70, Behavioural: 70 },
        completeness: 80,
        updatedAt: new Date().toISOString(),
      }
    );
  });

  const [newSkill, setNewSkill] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Available selectable interests
  const availableInterests = [
    'Statistical Sampling',
    'National Household Surveys',
    'Official Statistics & MoSPI Frameworks',
    'Digital Public Infrastructure (India Stack)',
    'Cybersecurity & Information Assurance',
    'Evidence-Based Public Policy',
    'Machine Learning in Governance',
    'e-Office & Digital Administration',
    'Citizen Grievance Redressal (CPGRAMS)',
    'Econometrics & Time Series',
  ];

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const toggleInterest = (interest: string) => {
    const exists = formData.interests.includes(interest);
    setFormData({
      ...formData,
      interests: exists
        ? formData.interests.filter((i) => i !== interest)
        : [...formData.interests, interest],
    });
  };

  const handleAddTraining = () => {
    const newTraining: PreviousTraining = {
      id: `train-${Date.now()}`,
      title: '',
      provider: '',
      year: new Date().getFullYear().toString(),
      certificateId: '',
    };
    setFormData({
      ...formData,
      previousTrainings: [...formData.previousTrainings, newTraining],
    });
  };

  const handleUpdateTraining = (id: string, field: keyof PreviousTraining, val: string) => {
    setFormData({
      ...formData,
      previousTrainings: formData.previousTrainings.map((t) =>
        t.id === id ? { ...t, [field]: val } : t
      ),
    });
  };

  const handleRemoveTraining = (id: string) => {
    setFormData({
      ...formData,
      previousTrainings: formData.previousTrainings.filter((t) => t.id !== id),
    });
  };

  const handleTargetScoreChange = (domain: DomainType, val: number) => {
    setFormData({
      ...formData,
      targetDomainScores: {
        ...formData.targetDomainScores,
        [domain]: Math.max(40, Math.min(95, val)),
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      return;
    }
    updateProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Completeness */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Competency Profile & Background
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official profile used to ground AI gap analysis and learning path generation under NEP-2020.
          </p>
        </div>

        {/* Completeness percentage */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right shrink-0 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs font-semibold text-slate-700">Profile Readiness:</span>
            <span className="text-lg font-black text-teal-700">{formData.completeness}%</span>
          </div>
          <div className="w-full sm:w-36 bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${formData.completeness}%` }}
            />
          </div>
        </div>
      </div>

      {saveSuccess && (
        <NoticeBanner type="success" title="Profile Successfully Updated">
          Your changes have been saved to local storage. AI diagnostics and learning paths will now reflect these updates.
        </NoticeBanner>
      )}

      {!isOnline && (
        <NoticeBanner type="info" title="Offline Mode: Profile Editing Disabled">
          Profile updates are disabled while offline to maintain institutional record integrity. Connect to the internet to update your official profile.
        </NoticeBanner>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identifiers */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-teal-700" />
            <span>Personal & Institutional Background</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Profile Category</label>
              <select
                value={formData.profileType}
                onChange={(e) => setFormData({ ...formData, profileType: e.target.value as ProfileType })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              >
                <option value="Student">Student (College / University)</option>
                <option value="Government Employee">Government Employee (Ministry / Department)</option>
                <option value="Private-Sector Professional">Private-Sector Professional</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Highest Education Level</label>
              <input
                type="text"
                required
                value={formData.highestEducation}
                onChange={(e) => setFormData({ ...formData, highestEducation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. Master of Statistics, B.Tech, Postgraduate"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualifications / Certifications</label>
              <input
                type="text"
                value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. UGC-NET, Subordinate Statistical Service, CDMP"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Role / Programme</label>
              <input
                type="text"
                required
                value={formData.currentRoleOrCourse}
                onChange={(e) => setFormData({ ...formData, currentRoleOrCourse: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. Junior Statistical Officer, Final Year Student"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organisation or Institution</label>
              <input
                type="text"
                required
                value={formData.organisationOrInstitution}
                onChange={(e) => setFormData({ ...formData, organisationOrInstitution: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. Ministry of Statistics & PI, Delhi University"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="45"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                className="w-32 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Skills & Interactive Tag Input */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>Demonstrated Skills & Expertise</span>
          </h2>

          <div className="space-y-3 text-xs">
            <label className="block font-semibold text-slate-700">Interactive Skill Tags</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg min-h-12 items-center">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 font-semibold text-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="p-0.5 hover:text-rose-700"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill (e.g. Sampling Theory, PySpark, CPGRAMS) and press Add"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tag</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Interests (Multi-Select) */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span>Professional Learning Interests (NEP Skilling Tracks)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {availableInterests.map((interest) => {
              const selected = formData.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    selected
                      ? 'bg-teal-50 border-teal-500 text-teal-950 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={selected}
                >
                  <span>{interest}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Previous Trainings (Repeatable Entries) */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              <span>Prior Completed Trainings & Certifications</span>
            </h2>
            <button
              type="button"
              onClick={handleAddTraining}
              className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Training Entry</span>
            </button>
          </div>

          {formData.previousTrainings.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              No prior trainings recorded. Click "Add Training Entry" to record certified courses from SWAYAM, iGOT Karmayogi, or universities.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.previousTrainings.map((tr) => (
                <div
                  key={tr.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end text-xs"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Course / Programme Title
                    </label>
                    <input
                      type="text"
                      required
                      value={tr.title}
                      onChange={(e) => handleUpdateTraining(tr.id, 'title', e.target.value)}
                      placeholder="e.g. National Accounts & Survey Audit"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Provider / Academy
                    </label>
                    <input
                      type="text"
                      required
                      value={tr.provider}
                      onChange={(e) => handleUpdateTraining(tr.id, 'provider', e.target.value)}
                      placeholder="e.g. SWAYAM / NSSTA"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        value={tr.year}
                        onChange={(e) => handleUpdateTraining(tr.id, 'year', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTraining(tr.id)}
                      className="p-2 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                      aria-label="Delete training row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Target Domain Benchmarks */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-700" />
            <span>Target Competency Thresholds (0 - 100)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Set the benchmark score you aim to achieve for your current role or aspiration. Any assessment score below this threshold is flagged as an active skill gap.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {DOMAINS.map((domain) => (
              <div key={domain} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <label className="block font-bold text-slate-800 mb-1">{domain}</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={formData.targetDomainScores[domain] || 70}
                    onChange={(e) => handleTargetScoreChange(domain, parseInt(e.target.value))}
                    className="w-full accent-teal-700"
                  />
                  <span className="font-bold text-teal-900 w-8 text-right">
                    {formData.targetDomainScores[domain] || 70}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Career Goal (Free Text) */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Long-Term Career Goal & Skilling Aspiration
          </h2>
          <div className="text-xs space-y-1">
            <textarea
              rows={3}
              required
              value={formData.careerGoal}
              onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 leading-relaxed"
              placeholder="e.g. Secure a Junior Statistical Officer appointment with MoSPI or transit into sovereign digital public infrastructure leadership."
            />
            <p className="text-[11px] text-slate-500">
              The AI Learning Engine uses this goal to curate sequential learning paths and match open career opportunities.
            </p>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!isOnline}
            title={!isOnline ? 'Profile edits are disabled while offline' : undefined}
            className="px-6 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            <span>{!isOnline ? 'Editing Disabled Offline' : 'Save Profile & Update Diagnostics'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
