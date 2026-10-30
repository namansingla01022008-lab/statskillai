import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { Course, LearningStep } from '../../types';
import { DOMAINS } from '../../constants/competency';
import { ScoreBadge } from '../../components/common/ScoreBadge';
import { RadarCompetencyChart } from '../../components/learner/RadarCompetencyChart';
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  Plus,
  BookOpen,
  Award,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const MenteeDetailPage: React.FC = () => {
  const { id: menteeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { isOnline } = useNetworkStatus();

  const profile = menteeId ? StorageService.getProfile(menteeId) : null;
  const user = menteeId ? StorageService.getUser(menteeId) : null;
  const domainScores = menteeId ? StorageService.getLatestDomainScores(menteeId) : {
    Technical: 0,
    Statistical: 0,
    Digital: 0,
    Behavioural: 0,
  };
  const gapAnalysis = menteeId ? StorageService.getGapAnalysis(menteeId) : null;
  const learningPath = menteeId ? StorageService.getLearningPath(menteeId) : null;
  const courses = StorageService.getCourses();

  // Find mentorship between this mentor and mentee
  const mentorships = menteeId ? StorageService.getLearnerMentorships(menteeId) : [];
  const mentorship = mentorships.find((m) => m.mentorUserId === currentUser.id);

  // Mentor tools state
  const [newNote, setNewNote] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [customRationale, setCustomRationale] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!menteeId || !profile || !user) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-500">Mentee record not found.</p>
        <button
          onClick={() => navigate('/mentor/dashboard')}
          className="text-xs text-teal-700 font-bold underline"
        >
          Return to Mentor Dashboard
        </button>
      </div>
    );
  }

  // Handle Add Feedback Note -> Transmits via ApiService + Socket.io notification
  const handleAddFeedbackNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setActionSuccess('Mentor actions are disabled offline.');
      setTimeout(() => setActionSuccess(null), 3000);
      return;
    }
    if (!mentorship || !newNote.trim()) return;

    try {
      await ApiService.addDirective(mentorship.id, newNote.trim());
    } catch (err) {
      console.warn('Backend addDirective fallback:', err);
    }

    const currentNotes = mentorship.feedbackNotes || [];
    mentorship.feedbackNotes = [...currentNotes, newNote.trim()];
    StorageService.saveMentorship(mentorship);

    setNewNote('');
    setActionSuccess('Feedback directive transmitted to learner.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Handle Recommend Learning Step
  const handleRecommendCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setActionSuccess('Curriculum recommendations are disabled offline.');
      setTimeout(() => setActionSuccess(null), 3000);
      return;
    }
    if (!mentorship || !selectedCourseId || !learningPath) return;

    const course = courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    const newStep: LearningStep = {
      id: `step-rec-${Date.now()}`,
      title: course.title,
      domain: course.domain,
      type: 'Course',
      estimatedDuration: course.duration || '8 Weeks',
      source: course.source,
      rationale: customRationale.trim() || `Recommended directly by your mentor, ${currentUser.name}.`,
      status: 'Not started',
      isMentorRecommended: true,
      courseId: course.id,
    };

    // Add to learning path
    learningPath.steps.push(newStep);
    StorageService.saveLearningPath(learningPath);

    // Also add to mentorship record
    const recSteps = mentorship.recommendedSteps || [];
    mentorship.recommendedSteps = [...recSteps, newStep];
    StorageService.saveMentorship(mentorship);

    setSelectedCourseId('');
    setCustomRationale('');
    setActionSuccess(`Course "${course.title}" added to mentee's learning path as Mentor-Recommended.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {!isOnline && (
        <NoticeBanner type="warning" title="Mentor Modification Actions Disabled">
          You are offline. Mentee profiles and existing paths are viewable, but submitting directives or recommending curriculum steps requires internet connectivity.
        </NoticeBanner>
      )}

      {/* Back button & Read-Only Banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/mentor/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Mentees</span>
        </button>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300">
          Read-Only Evaluator Mode
        </span>
      </div>

      {actionSuccess && (
        <NoticeBanner type="success" title="Advisory Directive Saved">
          {actionSuccess}
        </NoticeBanner>
      )}

      {/* Profile Overview Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                {profile.profileType}
              </span>
              <span className="text-xs text-slate-500">{profile.organisationOrInstitution}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {profile.fullName}
            </h1>
            <p className="text-xs text-slate-600">
              Role: <strong>{profile.currentRoleOrCourse}</strong> • Education: <strong>{profile.highestEducation}</strong>
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-right shrink-0">
            <span className="text-xs text-slate-500 block">Readiness Meter</span>
            <span className="text-xl font-black text-teal-800">{profile.completeness}%</span>
          </div>
        </div>

        {/* Career Goal */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
          <strong className="text-slate-900 block">Stated Career Goal & Aspiration:</strong>
          <p className="italic leading-relaxed">"{profile.careerGoal}"</p>
        </div>

        {/* Skills Tag Roster */}
        <div className="space-y-1.5 text-xs">
          <strong className="text-slate-800">Learner Skills Tags:</strong>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.skills.map((s) => (
              <span
                key={s}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-300 text-[11px]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Domain Scores & Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Domain Scores Cards (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Domain Competency Scores
          </h2>
          <div className="space-y-2.5">
            {DOMAINS.map((domain) => {
              const score = domainScores[domain] || 0;
              const target = profile.targetDomainScores[domain] || 70;
              return (
                <div
                  key={domain}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{domain}</span>
                    <span className="text-[11px] text-slate-500">Target: {target}/100</span>
                  </div>
                  <div className="text-right">
                    <ScoreBadge score={score} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar View (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Competency Radar Map
          </h2>
          <RadarCompetencyChart
            currentScores={domainScores}
            targetScores={profile.targetDomainScores}
            showTable={false}
          />
        </div>
      </div>

      {/* Active Skill Gaps Breakdown */}
      {gapAnalysis && (
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Empirical Skill-Gap Diagnostic for this Mentee</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gapAnalysis.gaps.map((gap, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{gap.skill}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      gap.severity === 'High'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {gap.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{gap.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Learning Path Steps */}
      {learningPath && (
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-teal-700" />
              <span>Mentee's Prescribed Learning Path ({learningPath.progressPercent}% Completed)</span>
            </h2>
          </div>

          <div className="space-y-2">
            {learningPath.steps.map((step, idx) => (
              <div
                key={step.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Step {idx + 1}: {step.title}</span>
                    {step.isMentorRecommended && (
                      <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                        Mentor-Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Domain: {step.domain} • Source: {step.source} • {step.estimatedDuration}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    step.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : step.status === 'In progress'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MENTOR ACTION TOOLS: ISSUE FEEDBACK & RECOMMEND STEP */}
      {mentorship && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tool 1: Add Directive / Feedback Note */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              <span>Issue Mentor Feedback Directive</span>
            </h3>
            <p className="text-slate-500">
              Provide formal academic or methodological instructions for {profile.fullName}.
            </p>

            <form onSubmit={handleAddFeedbackNote} className="space-y-3">
              <textarea
                rows={3}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Please practice calculating Design Effects (DEFF) on household survey microdata before advancing to timeseries..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!isOnline}
                className="w-full py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-md"
              >
                Transmit Directive Note
              </button>
            </form>
          </div>

          {/* Tool 2: Recommend Module from Catalog */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>Recommend Verified Module to Path</span>
            </h3>
            <p className="text-slate-500">
              Select a verified course to insert into {profile.fullName}’s curriculum labeled "Mentor-recommended".
            </p>

            <form onSubmit={handleRecommendCourse} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Course</label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                >
                  <option value="">-- Choose Course from Catalogue --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.domain}] {c.title} ({c.source})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mentor Rationale</label>
                <input
                  type="text"
                  value={customRationale}
                  onChange={(e) => setCustomRationale(e.target.value)}
                  placeholder="e.g. Crucial for understanding DPI citizen consent standards."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={!isOnline || !selectedCourseId}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-md"
              >
                Insert Course into Learning Path
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
