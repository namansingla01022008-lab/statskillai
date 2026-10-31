import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { GeminiService } from '../../services/geminiService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { DomainType, OrgEmployee, AdminAnalyticsInsight } from '../../types';
import { DOMAINS, calculateOverallScore } from '../../constants/competency';
import { SkillGapHeatmap } from '../../components/admin/SkillGapHeatmap';
import { EmployeeDrilldownModal } from '../../components/admin/EmployeeDrilldownModal';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  ArrowRight,
  Award,
  TrendingDown,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const AdminAnalyticsPage: React.FC = () => {
  const { t, language } = useApp();
  const { isOnline } = useNetworkStatus();

  const [employees, setEmployees] = useState<OrgEmployee[]>(() =>
    StorageService.getOrgEmployees()
  );
  const [isLoadingWorkforce, setIsLoadingWorkforce] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Heatmap drill-down state
  const [drilldownData, setDrilldownData] = useState<{
    isOpen: boolean;
    department: string;
    domain: DomainType;
    avgScore: number;
  }>({
    isOpen: false,
    department: '',
    domain: 'Statistical',
    avgScore: 0,
  });

  // AI Insights State with Session Storage Caching
  const [aiInsights, setAiInsights] = useState<AdminAnalyticsInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Load real registered users and workforce data from server on mount
  useEffect(() => {
    setIsLoadingWorkforce(true);
    ApiService.getWorkforceAnalytics()
      .then((data) => {
        if (data && data.employees && data.employees.length > 0) {
          setEmployees(data.employees);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch workforce analytics from API, using local roster:', err);
      })
      .finally(() => {
        setIsLoadingWorkforce(false);
      });
  }, []);

  // Real-time listener: instant workforce telemetry update when any user registers
  useEffect(() => {
    const socket = ApiService.getSocket();
    const handleNewUser = (payload: any) => {
      const newUser = payload?.user || payload;
      if (!newUser || !newUser.id) return;
      const newEmp: OrgEmployee = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        department: newUser.department || 'General Administration',
        designation: newUser.designation || 'Learner',
        profileType: (newUser.profileType as any) || 'Student',
        scores: { Technical: 65, Statistical: 65, Digital: 65, Behavioural: 65 },
        participationStatus: 'Active',
        trainingStatus: 'In progress',
        criticalGapsCount: 2,
        lastAssessmentDate: new Date().toISOString().split('T')[0],
      };
      setEmployees((prev) => {
        const exists = prev.some((e) => e.id === newEmp.id || (e.email && newEmp.email && e.email.toLowerCase() === newEmp.email.toLowerCase()));
        if (exists) return prev;
        return [newEmp, ...prev];
      });
    };

    socket.on('user_registered', handleNewUser);
    return () => {
      socket.off('user_registered', handleNewUser);
    };
  }, []);

  // Restore cached AI insights
  useEffect(() => {
    const cached = sessionStorage.getItem('statskill_analytics_insights_cache');
    if (cached) {
      try {
        setAiInsights(JSON.parse(cached));
      } catch {}
    }
  }, []);

  // Departments
  const uniqueDepartments = Array.from(new Set(employees.map((e) => e.department)));

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    if (selectedDept !== 'All' && emp.department !== selectedDept) return false;
    if (selectedStatus !== 'All' && emp.trainingStatus !== selectedStatus) return false;
    return true;
  });

  // KPI Calculations
  const totalEmployees = filteredEmployees.length;
  const activeCount = filteredEmployees.filter((e) => e.participationStatus === 'Active').length;
  const participationRate = totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0;

  const completedCount = filteredEmployees.filter((e) => e.trainingStatus === 'Completed').length;
  const completionRate = totalEmployees > 0 ? Math.round((completedCount / totalEmployees) * 100) : 0;

  const totalScoresSum = filteredEmployees.reduce((acc, emp) => {
    return acc + calculateOverallScore(emp.scores);
  }, 0);
  const workforceAverageScore = totalEmployees > 0 ? Math.round(totalScoresSum / totalEmployees) : 0;

  const totalCriticalGaps = filteredEmployees.reduce((acc, emp) => acc + emp.criticalGapsCount, 0);

  // Department-wise average scores for BarChart
  const deptChartData = uniqueDepartments.map((dept) => {
    const deptEmps = employees.filter((e) => e.department === dept);
    const avgScores: Record<string, any> = { department: dept.replace('Department of ', '').replace('Division', '').replace('Strategic ', '').slice(0, 18) };
    DOMAINS.forEach((domain) => {
      const sum = deptEmps.reduce((acc, e) => acc + (e.scores[domain] || 0), 0);
      avgScores[domain] = deptEmps.length > 0 ? Math.round(sum / deptEmps.length) : 0;
    });
    return avgScores;
  });

  // Score distribution histogram data
  const scoreBuckets = [
    { range: '0-39 (Beginner)', count: 0 },
    { range: '40-59 (Low Interm.)', count: 0 },
    { range: '60-74 (High Interm.)', count: 0 },
    { range: '75-89 (Advanced)', count: 0 },
    { range: '90-100 (Mastery)', count: 0 },
  ];

  filteredEmployees.forEach((emp) => {
    const overall = calculateOverallScore(emp.scores);
    if (overall < 40) scoreBuckets[0].count += 1;
    else if (overall < 60) scoreBuckets[1].count += 1;
    else if (overall < 75) scoreBuckets[2].count += 1;
    else if (overall < 90) scoreBuckets[3].count += 1;
    else scoreBuckets[4].count += 1;
  });

  // Monthly progress trend
  const monthlyTrendData = [
    { month: 'May 2026', avgScore: 61, completion: 42 },
    { month: 'Jun 2026', avgScore: 63, completion: 48 },
    { month: 'Jul 2026', avgScore: 65, completion: 54 },
    { month: 'Aug 2026', avgScore: 67, completion: 60 },
    { month: 'Sep 2026', avgScore: workforceAverageScore, completion: completionRate },
  ];

  // Top 10 Skill Gaps
  const topGapsData = [
    { skill: 'Survey Sampling & NSSO Standards', count: 34, domain: 'Statistical' },
    { skill: 'Distributed Pipelines (PySpark)', count: 28, domain: 'Technical' },
    { skill: 'DPDP Act Consent Frameworks', count: 24, domain: 'Digital' },
    { skill: 'Non-Sampling Error Imputation', count: 22, domain: 'Statistical' },
    { skill: 'Microservices & REST Security', count: 19, domain: 'Technical' },
    { skill: 'Evidence-Based Policy Briefings', count: 18, domain: 'Behavioural' },
    { skill: 'Time Series ARIMA Modeling', count: 16, domain: 'Statistical' },
    { skill: 'India Stack & DigiLocker Standards', count: 15, domain: 'Digital' },
    { skill: 'CPGRAMS Root-Cause Resolution', count: 12, domain: 'Behavioural' },
    { skill: 'SQL Indexing & Query Tuning', count: 11, domain: 'Technical' },
  ];

  // Export CSV
  const handleExportCSV = () => {
    let csv = `Employee ID,Name,Department,Designation,Profile Type,Technical Score,Statistical Score,Digital Score,Behavioural Score,Overall Score,Training Status,Critical Gaps Count\n`;
    filteredEmployees.forEach((emp) => {
      const overall = calculateOverallScore(emp.scores);
      csv += `"${emp.id}","${emp.name}","${emp.department}","${emp.designation}","${emp.profileType}",${emp.scores.Technical},${emp.scores.Statistical},${emp.scores.Digital},${emp.scores.Behavioural},${overall},"${emp.trainingStatus}",${emp.criticalGapsCount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StatSkillAI_Workforce_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Generate AI Insights
  const handleGenerateAiInsights = async () => {
    setLoadingInsights(true);

    const aggregateStats = {
      totalEmployees,
      workforceAverageScore,
      participationRate,
      completionRate,
      criticalGapsTotal: totalCriticalGaps,
      departmentAverages: deptChartData,
    };

    try {
      const { insights } = await GeminiService.generateAdminInsights(aggregateStats, language);
      setAiInsights(insights);
      sessionStorage.setItem('statskill_analytics_insights_cache', JSON.stringify(insights));
    } catch (err) {
      console.error('Failed generating AI insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              Institutional Oversight
            </span>
            <span className="text-xs text-slate-500">
              {employees.length} Audited Personnel across {uniqueDepartments.length} Departments
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('adminDashboardTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t('adminDashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={handleGenerateAiInsights}
            disabled={loadingInsights || !isOnline}
            title={!isOnline ? 'AI workforce analytics requires an online connection' : undefined}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs disabled:opacity-40 transition-colors"
          >
            {loadingInsights ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{loadingInsights ? 'Analyzing...' : !isOnline ? 'Online Only' : t('aiInsightsBtn')}</span>
          </button>
        </div>
      </div>

      {!isOnline && (
        <NoticeBanner type="warning" title="Offline Mode: Live Workforce Telemetry Paused">
          Institutional analytics and multi-tenant telemetry are paused while offline to preserve confidential workforce records. Reconnect to sync latest institutional statistics.
        </NoticeBanner>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('workforceScore')}
          </span>
          <div className="text-3xl font-black text-slate-900">
            {workforceAverageScore}
            <span className="text-xs font-normal text-slate-500"> / 100</span>
          </div>
          <p className="text-[11px] text-teal-700 font-semibold pt-1">
            Baseline Standard: 70 Benchmark
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('participationRate')}
          </span>
          <div className="text-3xl font-black text-slate-900">
            {participationRate}%
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {activeCount} of {totalEmployees} Active Tested
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('completionRate')}
          </span>
          <div className="text-3xl font-black text-slate-900">
            {completionRate}%
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold pt-1">
            {completedCount} Curricula Certified
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('criticalGapsCount')}
          </span>
          <div className="text-3xl font-black text-rose-700">
            {totalCriticalGaps}
          </div>
          <p className="text-[11px] text-rose-600 font-semibold pt-1">
            Domains Below 70 Threshold
          </p>
        </div>
      </div>

      {/* QUICK LINK TO REGISTERED MEMBERS DIRECTORY */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-5 border border-teal-800/60 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-black text-white">Registered Members & User Directory</h2>
            <span className="text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full">
              LIVE SYNC
            </span>
          </div>
          <p className="text-xs text-slate-300">
            View all authenticated institutional learners, verified mentors, and administrative accounts. New registrations update in real time.
          </p>
        </div>
        <a
          href="#/admin/members"
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-lg transition-transform hover:scale-105 shrink-0"
        >
          <span>Open Member Directory</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* AI INSIGHTS REPORT BANNER IF GENERATED */}
      {aiInsights && (
        <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-lg space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold text-slate-100">{t('aiInsightsTitle')}</h2>
            </div>
            <span className="text-[11px] text-teal-400 font-mono">
              Grounded in MoSPI / Mission Karmayogi Framework
            </span>
          </div>

          <div className="space-y-2">
            <strong className="text-xs text-teal-300 uppercase tracking-wider block">
              Executive Strategic Overview:
            </strong>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              "{aiInsights.executiveSummary}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="font-bold text-teal-400 block">Key Telemetry Findings:</span>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                {aiInsights.keyFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="font-bold text-rose-400 block">Identified Institutional Risks:</span>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                {aiInsights.criticalRisks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 block">Recommended Action Directives:</span>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                {aiInsights.recommendedActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-bold text-slate-700">Filter Segment:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800"
          >
            <option value="All">All Departments ({employees.length})</option>
            {uniqueDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-800"
          >
            <option value="All">All Training Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In progress">In progress</option>
            <option value="Not started">Not started</option>
          </select>
        </div>
      </div>

      {/* HEATMAP SECTION (Feature 10 Requirement) */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t('heatmapTitle')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('heatmapDesc')}
            </p>
          </div>
        </div>

        <SkillGapHeatmap
          employees={filteredEmployees}
          onSelectCell={(dept, domain, avgScore) => {
            setDrilldownData({
              isOpen: true,
              department: dept,
              domain,
              avgScore,
            });
          }}
        />
      </div>

      {/* CHARTS ROW 1: Department-wise averages & Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Average Scores */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Department-Wise Average Scores by Domain
          </h2>
          <div className="h-64" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', fontSize: '11px', borderRadius: '6px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Statistical" fill="#0f766e" name="Statistical" />
                <Bar dataKey="Technical" fill="#0284c7" name="Technical" />
                <Bar dataKey="Digital" fill="#8b5cf6" name="Digital" />
                <Bar dataKey="Behavioural" fill="#f59e0b" name="Behavioural" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution Histogram */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Score Distribution Frequency Histogram
          </h2>
          <div className="h-64" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', fontSize: '11px', borderRadius: '6px' }} />
                <Bar dataKey="count" fill="#334155" name="Employee Headcount" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Top 10 Skill Gaps & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Gaps */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Top 10 Institutional Skill Gaps
          </h2>
          <div className="space-y-2 text-xs">
            {topGapsData.map((item, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{item.skill}</span>
                  <span className="text-[10px] text-slate-400">({item.domain})</span>
                </div>
                <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                  {item.count} affected
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Progress Trend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Monthly Competency & Training Progress Trend
          </h2>
          <div className="h-64" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', fontSize: '11px', borderRadius: '6px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="avgScore" name="Workforce Avg Score" stroke="#0f766e" strokeWidth={2.5} />
                <Line type="monotone" dataKey="completion" name="Training Completion %" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DRILLDOWN MODAL */}
      <EmployeeDrilldownModal
        isOpen={drilldownData.isOpen}
        department={drilldownData.department}
        domain={drilldownData.domain}
        avgScore={drilldownData.avgScore}
        employees={employees}
        onClose={() => setDrilldownData({ ...drilldownData, isOpen: false })}
      />
    </div>
  );
};
