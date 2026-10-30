import React from 'react';
import { WifiOff, BookOpen, BrainCircuit, Activity, RefreshCw } from 'lucide-react';

export const OfflinePage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
        <WifiOff className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          You are currently in Offline Mode
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          No internet connection was detected. You can still access your preloaded content, mark learning milestones, and attempt offline assessments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <a
          href="#/learning-path"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500 transition-all shadow-xs space-y-2 block"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Learning Path</h3>
          <p className="text-xs text-slate-500">
            View cached milestones and mark completed steps.
          </p>
        </a>

        <a
          href="#/assessment"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500 transition-all shadow-xs space-y-2 block"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Offline Assessment</h3>
          <p className="text-xs text-slate-500">
            Take preloaded competency questions without network.
          </p>
        </a>

        <a
          href="#/gap-analysis"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500 transition-all shadow-xs space-y-2 block"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Diagnostic Summary</h3>
          <p className="text-xs text-slate-500">
            Review your latest verified competency ratings.
          </p>
        </a>
      </div>

      <div className="pt-4">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
};

