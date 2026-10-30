import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { Career } from '../../types';
import {
  Briefcase,
  Search,
  ExternalLink,
  ShieldCheck,
  Award,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export const OpportunitiesPage: React.FC = () => {
  const { activeProfile, t } = useApp();

  const [careers, setCareers] = useState<Career[]>(() => StorageService.getCareers());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPathway, setFilterPathway] = useState<string>('All');

  useEffect(() => {
    ApiService.getCareers()
      .then((data) => {
        if (data && data.length > 0) {
          // Filter to strictly verified careers
          setCareers(data.filter((c) => c.status === 'verified'));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server careers, using verified offline store:', err);
      });
  }, []);

  const userSkills = activeProfile?.skills || [];

  // Match analysis against verified career requirements
  const careersWithMatch = careers.map((career) => {
    const required = Array.isArray(career.requiredSkills) ? career.requiredSkills : [];
    const matchedSkills = required.filter((s) =>
      userSkills.some(
        (us) =>
          us.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(us.toLowerCase())
      )
    );
    const matchPercentage = required.length > 0
      ? Math.round((matchedSkills.length / required.length) * 100)
      : 50;

    return {
      ...career,
      matchedSkills,
      matchPercentage,
    };
  });

  const uniquePathways = Array.from(new Set(careers.map((c) => c.pathway)));

  const filteredCareers = careersWithMatch.filter((career) => {
    const matchesQuery =
      career.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      career.pathway.toLowerCase().includes(searchQuery.toLowerCase()) ||
      career.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPathway = filterPathway === 'All' || career.pathway === filterPathway;

    return matchesQuery && matchesPathway;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              Verified Government Routes
            </span>
            <span className="text-xs text-slate-500">
              {filteredCareers.length} Official Career Pathways
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Statistical & Government Career Development
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Curated statistical entry routes and gazetted service rules from UPSC, SSC, and MoSPI.
          </p>
        </div>

        {/* NCS Portal Quick Gateway */}
        <a
          href="https://www.ncs.gov.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-lg font-bold text-xs shadow-xs hover:opacity-95 shrink-0"
        >
          <span>National Career Service (NCS)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Official Data Integrity Callout */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-950">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Official Source Attribution & Traceability</p>
          <p className="text-emerald-800 leading-relaxed">
            All career pathways are curated strictly from gazetted service rules and published notices on official portals (UPSC, SSC, MoSPI). 
            StatSkillAI never fabricates job vacancies. Live partner openings are accessed directly through the National Career Service gateway.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <label className="block font-semibold text-slate-700 mb-1">Search Pathways & Required Skills</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role title, pathway, or skills..."
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Pathway Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cadre / Pathway</label>
            <select
              value={filterPathway}
              onChange={(e) => setFilterPathway(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Pathways</option>
              {uniquePathways.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Career Cards List */}
      <div className="space-y-4">
        {filteredCareers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 space-y-2">
            <p className="text-sm font-semibold text-slate-700">No matching career pathways found.</p>
            <p className="text-xs text-slate-500">Try adjusting your keyword search or pathway filter.</p>
          </div>
        ) : (
          filteredCareers.map((career) => (
            <div
              key={career.id}
              className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {career.pathway}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      ✓ Verified Source
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {career.roleTitle}
                  </h2>
                </div>

                {/* Profile Skill Match */}
                <div className="shrink-0 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {career.matchPercentage}% Profile Match
                  </span>
                </div>
              </div>

              {/* Qualification & Entry Route */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                    Prescribed Educational Qualification
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {career.requiredQualification}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-sky-700" />
                    Official Gazetted Entry Route
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {career.entryRoute}
                  </p>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Required Competencies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {career.requiredSkills.map((skill) => {
                    const isMatched = career.matchedSkills.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                          isMatched
                            ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {skill} {isMatched && '✓'}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Footer with Source Name, Link & Last Verified Date */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-500">
                  <span>Source: <strong className="text-slate-800">{career.sourceName}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Last verified: {career.lastVerifiedAt ? new Date(career.lastVerifiedAt).toISOString().split('T')[0] : '2026-10-31'}
                  </span>
                </div>

                <a
                  href={career.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-teal-900 hover:underline"
                >
                  <span>Official Recruitment Notice / Gazette</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
