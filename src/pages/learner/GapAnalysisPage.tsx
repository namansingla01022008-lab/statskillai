import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { GeminiService } from '../../services/geminiService';
import { OfflineStorage } from '../../services/offlineStorage';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { GapAnalysis, DomainType } from '../../types';
import { RadarCompetencyChart } from '../../components/learner/RadarCompetencyChart';
import {
  TrendingDown,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  GitBranch,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const GapAnalysisPage: React.FC = () => {
  const { currentUser, activeProfile, domainScores, t, language } = useApp();
  const { isOnline } = useNetworkStatus();

  const [analysis, setAnalysis] = useState<GapAnalysis | null>(() =>
    StorageService.getGapAnalysis(currentUser.id)
  );
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Sync gap analysis from server or IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    async function syncGaps() {
      try {
        const remote = await ApiService.getGapAnalysis();
        if (remote && isMounted) {
          setAnalysis(remote);
          setCachedAt(Date.now());
          StorageService.saveGapAnalysis(remote);
          await OfflineStorage.setCache('gap_analysis', remote, currentUser.id);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch remote gap analysis, checking offline cache:', err);
      }

      const cached = await OfflineStorage.getCache<GapAnalysis>('gap_analysis');
      if (cached && isMounted) {
        setAnalysis(cached.data);
        setCachedAt(cached.cachedAt);
      }
    }
    syncGaps();
    return () => {
      isMounted = false;
    };
  }, [currentUser.id]);

  const targetScores = activeProfile?.targetDomainScores || {
    Technical: 70,
    Statistical: 70,
    Digital: 70,
    Behavioural: 70,
  };

  const handleRunAnalysis = async () => {
    if (!isOnline) {
      setOfflineNotice('AI Gap Analysis regeneration is disabled offline. Scores will automatically recalculate upon syncing completed assessment attempts.');
      setTimeout(() => setOfflineNotice(null), 5000);
      return;
    }
    if (!activeProfile) return;
    setLoading(true);

    try {
      const { analysis: newAnalysis, isAiGenerated: wasAi } =
        await GeminiService.generateSkillGapAnalysis(
          activeProfile,
          domainScores,
          targetScores,
          language
        );

      try {
        await ApiService.saveGapAnalysis(newAnalysis);
      } catch (err) {
        console.warn('Backend saveGapAnalysis fallback to local storage:', err);
      }

      StorageService.saveGapAnalysis(newAnalysis);
      setAnalysis(newAnalysis);
      setIsAiGenerated(wasAi);
    } catch (err) {
      console.error('Gap analysis failure:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              AI Competency Diagnostic
            </span>
            <span className="text-xs text-slate-500">
              Last Updated: {analysis ? new Date(analysis.timestamp).toLocaleDateString() : 'Pending'}
            </span>
            {cachedAt && (
              <span className="text-[11px] text-slate-400 font-medium">
                • Snapshot: {new Date(cachedAt).toLocaleDateString()} {new Date(cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('gapAnalysisTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t('gapSubtitle')}
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={loading || !isOnline}
          title={!isOnline ? 'AI diagnostic recalculation requires internet connection' : undefined}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs disabled:opacity-40 transition-colors shrink-0"
        >
          {loading ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{loading ? 'Analyzing with AI...' : !isOnline ? 'Online Only' : t('recalculateGaps')}</span>
        </button>
      </div>

      {offlineNotice && (
        <NoticeBanner type="info" title="Offline Notice">
          {offlineNotice}
        </NoticeBanner>
      )}

      {isAiGenerated === false && (
        <NoticeBanner type="info" title="Offline Competency Engine Active">
          Analysis generated using deterministic competency rules matching your benchmark thresholds.
        </NoticeBanner>
      )}

      {analysis ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 border border-slate-800 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
              {t('aiSummary')}
            </span>
            <p className="text-sm sm:text-base leading-relaxed text-slate-200 font-medium">
              "{analysis.summary}"
            </p>
          </div>

          {/* Grid: Radar Chart + Priority Sequencing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Radar View (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Competency vs Target Benchmarks
              </h2>
              <RadarCompetencyChart
                currentScores={analysis.domainScores || domainScores}
                targetScores={analysis.targetScores || targetScores}
                showTable={false}
              />
            </div>

            {/* Priority Order (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>Curriculum Priority Order (Recommended Sequence)</span>
                </h2>
                <div className="space-y-2.5 pt-3">
                  {analysis.priorityOrder.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3 text-xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href="#/learning-path"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>Generate Sequenced Learning Path</span>
                </a>
              </div>
            </div>
          </div>

          {/* Identified Critical Gaps Cards */}
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{t('priorityGaps')}</span>
            </h2>

            {analysis.gaps.length === 0 ? (
              <p className="text-xs text-emerald-800 bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                {t('noGapsDetected')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.gaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {gap.skill}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            gap.severity === 'High'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : gap.severity === 'Medium'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {gap.severity} Severity
                        </span>
                      </div>
                      <span className="inline-block text-[11px] font-semibold text-teal-800">
                        Domain: {gap.domain}
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {gap.reason}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Suggested Action:</span>
                      <a
                        href="#/learning-path"
                        className="text-teal-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>View Curated Courses</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Established Strengths Cards */}
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t('keyStrengths')}</span>
            </h2>

            <div className="space-y-2 text-xs">
              {analysis.strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/80 text-emerald-950 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{str}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <p className="text-xs text-slate-500">{t('noAssessmentsYet')}</p>
          <button
            onClick={handleRunAnalysis}
            className="px-5 py-2.5 rounded-lg bg-teal-700 text-white font-bold text-xs"
          >
            Run Initial Gap Analysis
          </button>
        </div>
      )}
    </div>
  );
};
