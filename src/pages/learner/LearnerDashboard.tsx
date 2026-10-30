import React from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { DOMAINS, getProficiencyLevel } from '../../constants/competency';
import { ScoreBadge } from '../../components/common/ScoreBadge';
import { RadarCompetencyChart } from '../../components/learner/RadarCompetencyChart';
import { AssessmentHistoryChart } from '../../components/learner/AssessmentHistoryChart';
import {
  BrainCircuit,
  TrendingDown,
  GitBranch,
  Briefcase,
  Users,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const LearnerDashboard: React.FC = () => {
  const { currentUser, activeProfile, domainScores, t } = useApp();

  const attempts = StorageService.getAttempts(currentUser.id);
  const gapAnalysis = StorageService.getGapAnalysis(currentUser.id);
  const learningPath = StorageService.getLearningPath(currentUser.id);
  const courses = StorageService.getCourses();
  const opportunities = StorageService.getOpportunities();
  const mentorships = StorageService.getLearnerMentorships(currentUser.id);

  // Calculate overall score
  const overallScore = Math.round(
    (domainScores.Technical +
      domainScores.Statistical +
      domainScores.Digital +
      domainScores.Behavioural) /
      4
  );

  // Target scores
  const targetScores = activeProfile?.targetDomainScores || {
    Technical: 70,
    Statistical: 70,
    Digital: 70,
    Behavioural: 70,
  };

  // Top recommended courses: match courses for domains where score < target
  const lowDomains = DOMAINS.filter((d) => (domainScores[d] || 0) < (targetScores[d] || 70));
  const recommendedCourses = courses
    .filter((c) => lowDomains.length === 0 || lowDomains.includes(c.domain))
    .slice(0, 4);

  // Top recommended opportunities with match scores
  const userSkills = activeProfile?.skills || [];
  const oppWithMatch = opportunities.map((opp) => {
    // compute match percentage based on skills overlap and meeting domain levels
    const matchedSkills = opp.requiredSkills.filter((s) =>
      userSkills.some((us) => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
    ).length;
    const skillRatio = opp.requiredSkills.length > 0 ? matchedSkills / opp.requiredSkills.length : 0.5;

    let domainMet = 0;
    DOMAINS.forEach((d) => {
      if ((domainScores[d] || 0) >= (opp.minDomainLevels[d] || 50)) {
        domainMet += 1;
      }
    });
    const domainRatio = domainMet / 4;

    const matchPercent = Math.min(98, Math.max(45, Math.round((skillRatio * 0.55 + domainRatio * 0.45) * 100)));

    return { ...opp, matchPercent };
  }).sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              {currentUser.profileType || t('roleLearner')}
            </span>
            <span className="text-xs text-slate-500">
              {activeProfile?.organisationOrInstitution}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-1">
            Career Goal: {activeProfile?.careerGoal || 'Advance professional competencies under NEP-2020.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href="#/assessment"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Take Assessment</span>
          </a>
          <a
            href="#/learning-path"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            <span>Learning Path</span>
          </a>
        </div>
      </div>

      {/* KPI Cards: Overall Score & 4 Domains */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall Score */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
              {t('overallCompetency')}
            </span>
            <div className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
              {overallScore}
              <span className="text-xs text-slate-400 font-normal"> / 100</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Benchmark: 70</span>
            <span className="text-teal-300 font-bold">{getProficiencyLevel(overallScore)}</span>
          </div>
        </div>

        {/* 4 Domains */}
        {DOMAINS.map((domain) => {
          const score = domainScores[domain] || 0;
          const target = targetScores[domain] || 70;
          const isDeficit = score < target;

          return (
            <div
              key={domain}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800">{domain}</span>
                  <ScoreBadge score={score} showScore={false} />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {score}
                  <span className="text-xs text-slate-400 font-normal"> / 100</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Target: {target}</span>
                {isDeficit ? (
                  <span className="text-rose-700 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Gap: {target - score} pts
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    At Target
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI + HUMAN MENTORSHIP CONNECTION BANNER */}
      {(() => {
        const sessionBookings = StorageService.getLearnerSessionBookings(currentUser.id);
        const upcomingSession = sessionBookings.find(
          (b) => b.sessionStatus === 'Upcoming' || b.sessionStatus === 'Live'
        );

        // Detect weak skill from gap analysis or low domain
        const primaryGap = gapAnalysis?.gaps && gapAnalysis.gaps.length > 0 ? gapAnalysis.gaps[0] : null;
        const weakTopicName = primaryGap
          ? primaryGap.skill
          : domainScores.Technical < 70
          ? 'Binary Trees & Graphs'
          : domainScores.Statistical < 70
          ? 'Survey Sampling & Variance Estimation'
          : 'Data Structures & Algorithms';
        const weakDomain = primaryGap?.domain || 'Technical';

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* AI-Driven Weak Area Mentorship Recommendation */}
            <div className={`${upcomingSession ? 'lg:col-span-7' : 'lg:col-span-12'} bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-xl p-5 sm:p-6 border border-teal-500/30 shadow-md relative overflow-hidden flex flex-col justify-between`}>
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                    <Sparkles className="w-3 h-3 text-teal-300 animate-pulse" />
                    AI Diagnostics + Human Mentorship
                  </span>
                  <span className="text-xs text-slate-400">Personalized Live Intervention</span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Need help with {weakTopicName}?
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Your diagnostic assessment indicates that <strong className="text-teal-300">{weakTopicName}</strong> in{' '}
                  <span className="font-semibold text-white">{weakDomain}</span> needs improvement. Connect 1-on-1 with a verified practitioner for a live code review and personalized problem-solving.
                </p>

                <div className="pt-2 italic text-[11px] text-teal-200/80">
                  “AI tells you what to improve. Human mentors show you how to improve. StatSkillAI tracks your growth.”
                </div>
              </div>

              <div className="relative z-10 pt-4 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Verified Mentors available from ₹5 / 5 minutes (₹5, ₹8, ₹10, ₹15)</span>
                </div>
                <a
                  href={`#/mentors?skill=${encodeURIComponent(weakTopicName)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-transform hover:scale-[1.02] shadow-sm"
                >
                  <Users className="w-4 h-4 text-slate-950" />
                  <span>Find a {weakTopicName.split(' ')[0]} Mentor</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                </a>
              </div>
            </div>

            {/* Upcoming Live Session Card if student has one */}
            {upcomingSession && (
              <div className="lg:col-span-5 bg-white rounded-xl p-5 border-2 border-rose-500/40 shadow-md flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                      🔴 LIVE Mentorship Ready
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      ID: {upcomingSession.meetingId}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-slate-900 leading-tight">
                    {upcomingSession.topic}
                  </h3>

                  <p className="text-xs text-slate-600">
                    With <strong>{upcomingSession.mentorName}</strong> ({upcomingSession.mentorTitle || 'Mentor'})
                  </p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                    <span>📅 {upcomingSession.date}</span>
                    <span>⏰ {upcomingSession.timeSlot}</span>
                    <span>⏱ 5 Mins Live (₹{upcomingSession.price} / 5 mins)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={`#/mentorship/session/${upcomingSession.sessionId}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all hover:shadow-lg"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Join Live Mentorship Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Grid: Radar Chart + Skill Gap Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {t('radarView')}
              </h2>
              <p className="text-xs text-slate-500">
                Empirical domain measurement mapped against target proficiency thresholds
              </p>
            </div>
            <a
              href="#/assessment"
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold hover:underline"
            >
              Retake Tests →
            </a>
          </div>

          <RadarCompetencyChart
            currentScores={domainScores}
            targetScores={targetScores}
            showTable={true}
          />
        </div>

        {/* Skill Gap & Action Priority Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Skill Gaps Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>{t('activeGaps')}</span>
              </h2>
              <a
                href="#/gap-analysis"
                className="text-xs text-teal-700 hover:underline font-semibold"
              >
                Full Diagnostic →
              </a>
            </div>

            {gapAnalysis && gapAnalysis.gaps.length > 0 ? (
              <div className="space-y-2.5">
                {gapAnalysis.gaps.slice(0, 3).map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{gap.skill}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          gap.severity === 'High'
                            ? 'bg-rose-100 text-rose-800'
                            : gap.severity === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {gap.severity} Severity
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {gap.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                {t('noGapsDetected')}
              </div>
            )}
          </div>

          {/* Learning Path Progress Widget */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-teal-600" />
                <span>{t('learningProgress')}</span>
              </h2>
              <a
                href="#/learning-path"
                className="text-xs text-teal-700 hover:underline font-semibold"
              >
                View Curriculum →
              </a>
            </div>

            {learningPath ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-700 font-semibold">
                    <span>Curriculum Completion</span>
                    <span className="text-teal-700">{learningPath.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${learningPath.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Active Module:
                  </span>
                  {learningPath.steps
                    .filter((s) => s.status === 'In progress')
                    .slice(0, 1)
                    .map((step) => (
                      <div
                        key={step.id}
                        className="p-2.5 rounded-md bg-teal-50 border border-teal-200 text-xs text-teal-950"
                      >
                        <p className="font-bold">{step.title}</p>
                        <p className="text-[11px] text-teal-800 mt-0.5">
                          Source: {step.source} • {step.estimatedDuration}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No active learning path generated yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Assessment History Trend (Line Chart) */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {t('recentAttempts')}
            </h2>
            <p className="text-xs text-slate-500">
              Chronological progress across adaptive assessment testing dates
            </p>
          </div>
          <a
            href="#/assessment"
            className="text-xs text-teal-700 hover:text-teal-900 font-semibold hover:underline"
          >
            Launch Assessment →
          </a>
        </div>
        <AssessmentHistoryChart attempts={attempts} />
      </div>

      {/* Bottom 2 Columns: Top Recommended Modules & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Courses */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('topCourses')}
              </h2>
              <p className="text-[11px] text-slate-500">
                Curated modules from SWAYAM, NPTEL & iGOT Karmayogi
              </p>
            </div>
            <a href="#/learning-path" className="text-xs text-teal-700 hover:underline font-semibold">
              Browse All →
            </a>
          </div>

          <div className="space-y-2.5">
            {recommendedCourses.map((course) => (
              <div
                key={course.id}
                className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-xs text-slate-900 leading-tight">
                    {course.title}
                  </h3>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded shrink-0">
                    {course.source}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-1">
                  {course.description}
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500 font-medium">
                    {course.duration} • {course.level}
                  </span>
                  <a
                    href={course.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold hover:underline"
                  >
                    <span>Visit Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Matched Opportunities */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t('topOpportunities')}
              </h2>
              <p className="text-[11px] text-slate-500">
                Public sector fellowships & enterprise internships
              </p>
            </div>
            <a href="#/opportunities" className="text-xs text-teal-700 hover:underline font-semibold">
              View All 12+ →
            </a>
          </div>

          <div className="space-y-2.5">
            {oppWithMatch.map((opp) => (
              <div
                key={opp.id}
                className="p-3 rounded-lg border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 leading-tight">
                      {opp.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opp.organisation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-xs font-black text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                      {opp.matchPercent}% Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500">
                    {opp.location} • {opp.type}
                  </span>
                  <a
                    href="#/opportunities"
                    className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold hover:underline"
                  >
                    <span>View & Apply</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
