import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield,
  BookOpen,
  Award,
  Globe2,
  Cpu,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { t } = useApp();

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/60 border border-teal-500/40 text-teal-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>National Education Policy (NEP) 2020 Architectural Alignment</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          About StatSkillAI
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
          An AI-powered competency measurement, skill-gap diagnostic, and career development platform
          built for college students, civil servants, and private-sector professionals in India.
        </p>
      </div>

      {/* Problem Statement & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            The Problem Statement
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Students and employees lack tailored, objective guidance to diagnose specific skill deficits
            and choose suitable learning opportunities. Concurrently, government ministries and enterprise
            institutions struggle to monitor, benchmark, and close critical competency gaps across their workforce.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 pt-1">
            <li>Fragmented course catalogs with low completion rates.</li>
            <li>Static multiple-choice assessments that do not adapt to individual capability.</li>
            <li>Lack of portability for skills across academic institutions and employment rosters.</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
            The StatSkillAI Solution
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            StatSkillAI provides psychometrically sound, AI-adaptive competency evaluations across four
            core domains (Technical, Statistical, Digital, and Behavioural), automatically synthesizes
            empirical gaps, curates personalized learning pathways on verified national portals, and connects
            learners with human domain mentors.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 pt-1">
            <li>Dynamic real-time difficulty adaptation (Easy, Medium, Hard).</li>
            <li>Grounded recommendations from SWAYAM, NPTEL, iGOT Karmayogi, and NCS.</li>
            <li>Institutional analytics with departmental heatmaps and AI policy advisories.</li>
          </ul>
        </div>
      </div>

      {/* NEP-2020 Pillars Alignment */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">
            How StatSkillAI Fulfills the Objectives of NEP-2020
          </h2>
          <p className="text-xs text-slate-500">
            Strategic alignment with India’s national blueprint for continuous learning and skill mobility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Personalised Learning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eliminates rigid one-size-fits-all curricula by generating unique sequenced learning paths
              based on individualized gap severities and career aspirations.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-md bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Continuous Skilling</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enables lifelong upskilling across all career stages—from undergraduate seniors to mid-career
              officers under Mission Karmayogi and private professionals.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Multilingual Access</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Offers complete bilingual English and Hindi static interface text and dynamic AI responses,
              removing linguistic barriers in competency development.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Credit & Skill Portability</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maps coursework directly to national platforms (SWAYAM, NPTEL) that qualify for credit transfer
              under the Academic Bank of Credits (ABC).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              5
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Vocational Integration</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seamlessly integrates academic statistics with practical public administration, survey sampling,
              cybersecurity, and Digital Public Infrastructure (DPI) competencies.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              6
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Verified Human Mentorship</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ensures learners are not left to automated algorithms alone; connects them with verified senior
              statisticians, technologists, and public servants.
            </p>
          </div>
        </div>
      </div>

      {/* Target User Personas */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Target User Personas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <span className="font-bold text-teal-800 block text-sm">College Students</span>
            <p className="text-slate-600">
              Undergraduate and postgraduate students in statistics, computer science, and public policy
              preparing for fellowships and entry-level positions.
            </p>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <span className="font-bold text-sky-800 block text-sm">Government Employees</span>
            <p className="text-slate-600">
              Civil servants and statistical investigators modernizing survey operations and digital
              governance under Mission Karmayogi standards.
            </p>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <span className="font-bold text-indigo-800 block text-sm">Private Professionals</span>
            <p className="text-slate-600">
              Data scientists and enterprise consultants seeking civic tech fellowships, regulatory
              compliance certifications, and leadership growth.
            </p>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <span className="font-bold text-amber-800 block text-sm">Institutions & Org Admins</span>
            <p className="text-slate-600">
              Departmental training directors monitoring cohort readiness, diagnosing systemic gaps,
              and issuing targeted upskilling directives.
            </p>
          </div>
        </div>
      </div>

      {/* Strategic Roadmap (Clearly Labelled PLANNED) */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Future Enhancement Roadmap
            </h2>
            <p className="text-xs text-slate-500">
              Planned development milestones (strictly labeled Planned, not yet implemented).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300">
            Version 2.0 Roadmap
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Planned
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  VR / AR Immersive Practical Labs
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Spatial 3D simulations for agricultural crop-cutting experiments, rural household enumeration,
                and physical census sampling trials.
              </p>
            </div>
            <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Planned
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Cryptographic Micro-Credentials Linked to Academic Bank of Credits (ABC)
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Direct API integration with DigiLocker and National Academic Depository (NAD) for automatic
                cryptographic credential deposition upon path completion.
              </p>
            </div>
            <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Planned
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Skill Marketplace & National Career Service (NCS) Live API
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Direct two-way synchronization with Ministry of Labour & Employment NCS portal for instant
                apprenticeship matching and one-click sovereign application dispatch.
              </p>
            </div>
            <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Planned
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Offline-First PWA Mode for Remote District Fieldwork
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Complete offline caching of diagnostic assessment batteries and learning modules for
                enumerators and students in low-connectivity rural zones.
              </p>
            </div>
            <Clock className="w-5 h-5 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};
