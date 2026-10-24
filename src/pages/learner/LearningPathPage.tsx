import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { GeminiService } from '../../services/geminiService';
import { LearningPath, LearningStep, StepStatus } from '../../types';
import {
  GitBranch,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const LearningPathPage: React.FC = () => {
  const { currentUser, activeProfile, refreshScores, t, language } = useApp();

  const [learningPath, setLearningPath] = useState<LearningPath | null>(() =>
    StorageService.getLearningPath(currentUser.id)
  );
  const [loading, setLoading] = useState(false);
  const [filterDomain, setFilterDomain] = useState<string>('All');
  const courses = StorageService.getCourses();

  const handleRegeneratePath = async () => {
    if (!activeProfile) return;
    setLoading(true);

    try {
      const gapAnalysis = StorageService.getGapAnalysis(currentUser.id);
      const gaps = gapAnalysis ? gapAnalysis.gaps : [];

      const { learningPath: newPath } = await GeminiService.generateLearningPath(
        activeProfile,
        gaps,
        courses,
        language
      );

      // Check if there are mentor recommended steps to preserve
      const existingMentorships = StorageService.getLearnerMentorships(currentUser.id);
      const mentorSteps = existingMentorships.flatMap((m) => m.recommendedSteps || []);
      if (mentorSteps.length > 0) {
        newPath.steps.push(...mentorSteps);
      }

      try {
        await ApiService.saveLearningPath(newPath);
      } catch (err) {
        console.warn('Backend saveLearningPath fallback to local storage:', err);
      }

      StorageService.saveLearningPath(newPath);
      setLearningPath(newPath);
    } catch (err) {
      console.error('Failed generating path:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (stepId: string, newStatus: StepStatus) => {
    try {
      await ApiService.updateStepStatus(stepId, newStatus);
      await refreshScores();
    } catch (err) {
      console.warn('Backend step status update fallback to local storage:', err);
    }

    const updated = StorageService.updateLearningStepStatus(currentUser.id, stepId, newStatus);
    if (updated) {
      setLearningPath({ ...updated });
    }
  };

  const steps = learningPath?.steps || [];
  const filteredSteps =
    filterDomain === 'All' ? steps : steps.filter((s) => s.domain === filterDomain);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              NEP-2020 Curated Framework
            </span>
            <span className="text-xs text-slate-500">
              {steps.length} Sequenced Modules
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('learningPathTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t('learningPathSubtitle')}
          </p>
        </div>

        <button
          onClick={handleRegeneratePath}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors shrink-0"
        >
          {loading ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{loading ? 'Synthesizing Path...' : 'Regenerate Learning Path'}</span>
        </button>
      </div>

      {learningPath ? (
        <div className="space-y-6">
          {/* Progress Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 border border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                  Curriculum Advancement Target
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
                  {learningPath.title}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-teal-400">
                  {learningPath.progressPercent}%
                </span>
                <span className="text-xs text-slate-400 block">Path Completed</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${learningPath.progressPercent}%` }}
              />
            </div>

            {/* Prompt for reassessment when 100% completed */}
            {learningPath.isCompleted && (
              <div className="p-4 rounded-lg bg-teal-950/80 border border-teal-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mt-3">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-teal-300 shrink-0" />
                  <span className="font-semibold text-teal-200">
                    {t('congratsCompleted')}
                  </span>
                </div>
                <a
                  href="#/assessment"
                  className="px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors shrink-0"
                >
                  {t('retakeAssessmentPrompt')}
                </a>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-slate-500 mr-1">Filter Domain:</span>
            {['All', 'Statistical', 'Technical', 'Digital', 'Behavioural'].map((dom) => (
              <button
                key={dom}
                onClick={() => setFilterDomain(dom)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-colors shrink-0 ${
                  filterDomain === dom
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          {/* Sequenced Steps List */}
          <div className="space-y-4">
            {filteredSteps.map((step, idx) => {
              const matchedCourse = step.courseId ? courses.find((c) => c.id === step.courseId) : null;

              return (
                <div
                  key={step.id}
                  className={`bg-white rounded-xl p-5 border transition-all shadow-2xs space-y-3 ${
                    step.status === 'Completed'
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : step.status === 'In progress'
                      ? 'border-teal-500 shadow-md ring-1 ring-teal-500/30'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Step Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                            {step.title}
                          </h3>
                          {step.isAiSuggested && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                              {t('aiSuggestedBadge')}
                            </span>
                          )}
                          {step.isMentorRecommended && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              {t('mentorRecommendedBadge')}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Domain: {step.domain}
                          </span>
                          <span>•</span>
                          <span>Format: {step.type}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {step.estimatedDuration}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-teal-800">
                            Source: {step.source}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Dropdown Controller */}
                    <div className="shrink-0 flex items-center gap-2">
                      <select
                        value={step.status}
                        onChange={(e) => handleStatusChange(step.id, e.target.value as StepStatus)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:ring-2 focus:ring-teal-500 ${
                          step.status === 'Completed'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                            : step.status === 'In progress'
                            ? 'bg-sky-100 border-sky-300 text-sky-900'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                        aria-label={`Update status for ${step.title}`}
                      >
                        <option value="Not started">{t('stepNotStarted')}</option>
                        <option value="In progress">{t('stepInProgress')}</option>
                        <option value="Completed">{t('stepCompleted')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Rationale */}
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    <strong className="text-slate-800">Pedagogical Rationale: </strong>
                    {step.rationale}
                  </p>

                  {/* Matched Course details & Portal Link if applicable */}
                  {matchedCourse && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Official Provider: <strong className="text-slate-700">{matchedCourse.provider}</strong>
                      </span>
                      <a
                        href={matchedCourse.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                      >
                        <span>Open on {matchedCourse.source} Home</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <p className="text-xs text-slate-500">No learning path active yet.</p>
          <button
            onClick={handleRegeneratePath}
            className="px-5 py-2.5 rounded-lg bg-teal-700 text-white font-bold text-xs"
          >
            Generate Learning Path Now
          </button>
        </div>
      )}
    </div>
  );
};
