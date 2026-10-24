import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { Opportunity, Application, OpportunityType, DomainType } from '../../types';
import { DOMAINS } from '../../constants/competency';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  MapPin,
  Building2,
  ExternalLink,
  Sparkles,
  Award,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const OpportunitiesPage: React.FC = () => {
  const { currentUser, activeProfile, domainScores, t } = useApp();

  const opportunities = StorageService.getOpportunities();
  const [userApplications, setUserApplications] = useState<Application[]>(() =>
    StorageService.getUserApplications(currentUser.id)
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterSector, setFilterSector] = useState<string>('All');
  const [minMatchFilter, setMinMatchFilter] = useState<number>(0);

  // Success apply banner
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Compute match percentage & detailed reasons for each opportunity
  const userSkills = activeProfile?.skills || [];

  const oppsWithMatch = opportunities.map((opp) => {
    // 1. Skill overlap
    const matchedSkills = opp.requiredSkills.filter((s) =>
      userSkills.some(
        (us) =>
          us.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(us.toLowerCase())
      )
    );
    const skillRatio =
      opp.requiredSkills.length > 0 ? matchedSkills.length / opp.requiredSkills.length : 0.5;

    // 2. Domain threshold check
    const domainChecks: { domain: DomainType; meets: boolean; userScore: number; req: number }[] = [];
    DOMAINS.forEach((d) => {
      const uScore = domainScores[d] || 0;
      const reqScore = opp.minDomainLevels[d] || 50;
      domainChecks.push({
        domain: d,
        meets: uScore >= reqScore,
        userScore: uScore,
        req: reqScore,
      });
    });

    const domainsMetCount = domainChecks.filter((dc) => dc.meets).length;
    const domainRatio = domainsMetCount / 4;

    // Composite match percentage (45% to 98%)
    const matchPercentage = Math.min(
      98,
      Math.max(45, Math.round((skillRatio * 0.55 + domainRatio * 0.45) * 100))
    );

    return {
      ...opp,
      matchPercentage,
      matchedSkills,
      domainChecks,
    };
  });

  // Unique filter choices
  const uniqueTypes = Array.from(new Set(opportunities.map((o) => o.type)));
  const uniqueSectors = Array.from(new Set(opportunities.map((o) => o.sector)));

  // Filter logic
  const filtered = oppsWithMatch.filter((opp) => {
    if (filterType !== 'All' && opp.type !== filterType) return false;
    if (filterSector !== 'All' && opp.sector !== filterSector) return false;
    if (opp.matchPercentage < minMatchFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${opp.title} ${opp.organisation} ${opp.location} ${opp.requiredSkills.join(' ')}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  // Handle Apply
  const handleApply = (opp: (typeof oppsWithMatch)[0]) => {
    const existing = userApplications.find((a) => a.opportunityId === opp.id);
    if (existing) return;

    const newApp: Application = {
      id: `app-${Date.now()}`,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      organisation: opp.organisation,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      appliedAt: new Date().toISOString(),
      status: 'Submitted',
      matchPercentage: opp.matchPercentage,
      notes: 'Submitted through StatSkillAI competency verified credential gateway.',
    };

    StorageService.saveApplication(newApp);
    setUserApplications([newApp, ...userApplications]);
    setAppliedNotice(`Application for "${opp.title}" submitted successfully.`);
    setTimeout(() => setAppliedNotice(null), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              Verified Openings
            </span>
            <span className="text-xs text-slate-500">
              {opportunities.length} Opportunities Indexed
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('opportunitiesTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t('opportunitiesSubtitle')}
          </p>
        </div>
      </div>

      <NoticeBanner type="info" title="Sample Demonstration Data">
        {t('sampleDataNotice')} External links navigate directly to official government or institutional home portals.
      </NoticeBanner>

      {appliedNotice && (
        <NoticeBanner type="success" title="Application Confirmed">
          {appliedNotice} Track status under your submissions below or in the administrative portal.
        </NoticeBanner>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="sm:col-span-1 relative">
            <label className="block font-semibold text-slate-700 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, skills..."
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Opportunity Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sector</label>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Sectors</option>
              {uniqueSectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Match Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Minimum Match Score: {minMatchFilter}%
            </label>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minMatchFilter}
              onChange={(e) => setMinMatchFilter(parseInt(e.target.value))}
              className="w-full accent-teal-700 mt-2"
            />
          </div>
        </div>
      </div>

      {/* Opportunity Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500 italic">
            No opportunities match your selected filter criteria. Try resetting the filters.
          </div>
        ) : (
          filtered.map((opp) => {
            const isApplied = userApplications.some((a) => a.opportunityId === opp.id);
            const app = userApplications.find((a) => a.opportunityId === opp.id);

            return (
              <div
                key={opp.id}
                className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 hover:border-teal-400 transition-all shadow-2xs space-y-4"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {opp.title}
                      </h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                        {opp.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {opp.organisation}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {opp.location}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-teal-900">{opp.sector}</span>
                    </div>
                  </div>

                  {/* Match Percentage Badge */}
                  <div className="shrink-0 text-left sm:text-right bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-100 text-teal-950 font-black text-xs border border-teal-300">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      <span>{opp.matchPercentage}% Match</span>
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-1">
                      {opp.stipendOrSalary || 'Standard Gov Scale'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {opp.description}
                </p>

                {/* Match Breakdown & Skills Overlap */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">
                    Competency Matching Criteria & Rationale:
                  </span>

                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-slate-500 font-semibold mr-1">Required Skills:</span>
                    {opp.requiredSkills.map((skill) => {
                      const userHasSkill = opp.matchedSkills.includes(skill);
                      return (
                        <span
                          key={skill}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            userHasSkill
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          {skill} {userHasSkill ? '✓' : ''}
                        </span>
                      );
                    })}
                  </div>

                  {/* Domain thresholds */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                    {opp.domainChecks.map((dc) => (
                      <div key={dc.domain} className="flex items-center justify-between p-1 bg-white rounded border border-slate-200">
                        <span className="text-slate-600">{dc.domain}:</span>
                        <span className={dc.meets ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {dc.userScore}/{dc.req} req
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer and Apply Button */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Application Deadline: <strong>{opp.deadline}</strong></span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {isApplied ? (
                      <span className="px-4 py-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Status: {app?.status || 'Submitted'}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(opp)}
                        className="w-full sm:w-auto px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        {t('apply')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
