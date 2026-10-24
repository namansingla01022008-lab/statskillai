import React, { useState } from 'react';
import { DomainType, OrgEmployee } from '../../types';
import { X, ShieldCheck, UserX } from 'lucide-react';
import { ScoreBadge } from '../common/ScoreBadge';

interface EmployeeDrilldownModalProps {
  isOpen: boolean;
  department: string;
  domain: DomainType;
  avgScore: number;
  employees: OrgEmployee[];
  onClose: () => void;
}

export const EmployeeDrilldownModal: React.FC<EmployeeDrilldownModalProps> = ({
  isOpen,
  department,
  domain,
  avgScore,
  employees,
  onClose,
}) => {
  const [anonymize, setAnonymize] = useState(false);

  if (!isOpen) return null;

  const filtered = employees.filter((e) => e.department === department);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drilldown-title"
    >
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 id="drilldown-title" className="text-sm font-bold tracking-tight">
              Cohort Drilldown: {department}
            </h3>
            <p className="text-xs text-teal-300 mt-0.5">
              Domain: <span className="font-semibold">{domain}</span> (Average Score: {avgScore}/100)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
            aria-label="Close drilldown view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar with Anonymize Toggle */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="text-slate-600 font-medium">
            Showing {filtered.length} employees in this cohort
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 select-none">
            <input
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
              className="rounded border-slate-300 text-teal-700 focus:ring-teal-500 w-4 h-4"
            />
            <div className="flex items-center gap-1.5">
              {anonymize ? (
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              ) : (
                <UserX className="w-4 h-4 text-slate-500" />
              )}
              <span>Anonymise Employee Names (Privacy Mode)</span>
            </div>
          </label>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-xs text-left border border-slate-200 rounded-md">
            <caption className="sr-only">Detailed employee roster for {department}</caption>
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="p-2.5">Employee Identifier</th>
                <th scope="col" className="p-2.5">Designation</th>
                <th scope="col" className="p-2.5 text-right">{domain} Score</th>
                <th scope="col" className="p-2.5 text-center">Proficiency</th>
                <th scope="col" className="p-2.5 text-center">Training Status</th>
                <th scope="col" className="p-2.5 text-right">Critical Gaps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => {
                const score = emp.scores[domain] || 0;
                const displayName = anonymize ? `Subject #${emp.id.replace('emp-2026-', 'ID-')}` : emp.name;
                const displayEmail = anonymize ? 'anonymised@gov.in' : emp.email;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <p className="font-semibold text-slate-900">{displayName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{emp.id} • {displayEmail}</p>
                    </td>
                    <td className="p-2.5 text-slate-700">{emp.designation}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{score}/100</td>
                    <td className="p-2.5 text-center">
                      <ScoreBadge score={score} showScore={false} />
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          emp.trainingStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.trainingStatus === 'In progress'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {emp.trainingStatus}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-medium text-slate-700">
                      {emp.criticalGapsCount > 0 ? (
                        <span className="text-rose-700 font-bold">{emp.criticalGapsCount} Domains</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold hover:bg-slate-700"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
};
