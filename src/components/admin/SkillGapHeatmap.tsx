import React from 'react';
import { DomainType, OrgEmployee } from '../../types';
import { DOMAINS } from '../../constants/competency';

interface SkillGapHeatmapProps {
  employees: OrgEmployee[];
  onSelectCell: (department: string, domain: DomainType, avgScore: number) => void;
}

export const SkillGapHeatmap: React.FC<SkillGapHeatmapProps> = ({
  employees,
  onSelectCell,
}) => {
  // Extract unique departments
  const departments = Array.from(new Set(employees.map((e) => e.department)));

  // Calculate average scores for each department & domain
  const matrix: Record<string, Record<DomainType, { avg: number; count: number }>> = {};

  departments.forEach((dept) => {
    matrix[dept] = {
      Technical: { avg: 0, count: 0 },
      Statistical: { avg: 0, count: 0 },
      Digital: { avg: 0, count: 0 },
      Behavioural: { avg: 0, count: 0 },
    };
  });

  employees.forEach((emp) => {
    if (matrix[emp.department]) {
      DOMAINS.forEach((domain) => {
        matrix[emp.department][domain].avg += emp.scores[domain] || 0;
        matrix[emp.department][domain].count += 1;
      });
    }
  });

  // Compute final averages
  departments.forEach((dept) => {
    DOMAINS.forEach((domain) => {
      const item = matrix[dept][domain];
      item.avg = item.count > 0 ? Math.round(item.avg / item.count) : 0;
    });
  });

  // Cell style logic with high contrast & non-color dependent cues
  const getCellDetails = (score: number) => {
    if (score < 50) {
      return {
        bg: 'bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200',
        badge: 'Critical Gap',
      };
    }
    if (score < 70) {
      return {
        bg: 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200',
        badge: 'Moderate Deficit',
      };
    }
    if (score < 85) {
      return {
        bg: 'bg-teal-100 text-teal-950 border-teal-300 hover:bg-teal-200',
        badge: 'Target Met',
      };
    }
    return {
      bg: 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200',
      badge: 'Advanced Mastery',
    };
  };

  return (
    <div className="space-y-4">
      {/* Matrix Table */}
      <div className="overflow-x-auto border border-slate-300 rounded-lg bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">
            Departmental Skill-Gap Matrix with Domain Average Scores
          </caption>
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
              <th scope="col" className="p-3 w-1/3">
                Department / Division
              </th>
              {DOMAINS.map((domain) => (
                <th key={domain} scope="col" className="p-3 text-center">
                  {domain}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {departments.map((dept) => (
              <tr key={dept} className="hover:bg-slate-50 transition-colors">
                <th scope="row" className="p-3 font-semibold text-slate-900 text-xs">
                  {dept}
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                    ({employees.filter((e) => e.department === dept).length} audited employees)
                  </span>
                </th>
                {DOMAINS.map((domain) => {
                  const score = matrix[dept]?.[domain]?.avg || 0;
                  const { bg, badge } = getCellDetails(score);

                  return (
                    <td key={domain} className="p-2 text-center">
                      <button
                        onClick={() => onSelectCell(dept, domain, score)}
                        className={`w-full py-2.5 px-2 rounded border font-bold text-xs transition-all shadow-2xs focus:ring-2 focus:ring-teal-600 ${bg}`}
                        aria-label={`${dept}, ${domain}: Average score ${score} out of 100, status ${badge}. Click to view employee breakdown.`}
                      >
                        <span className="block text-sm leading-tight">{score}</span>
                        <span className="block text-[9px] font-medium tracking-tight opacity-80">
                          {badge}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Non-colour-dependent Accessible Legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
        <p className="text-xs font-bold text-slate-800 mb-2">
          Heatmap Scoring & Accessibility Legend (Click any cell to drill down into cohort members):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-900">
            <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
            <div>
              <span className="font-bold block">Score &lt; 50</span>
              <span className="text-[10px] text-rose-800">Critical Gap (Priority 1)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
            <div>
              <span className="font-bold block">Score 50 - 69</span>
              <span className="text-[10px] text-amber-800">Moderate Gap</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-teal-50 border border-teal-200 text-teal-900">
            <span className="w-3 h-3 rounded-full bg-teal-600 shrink-0" />
            <div>
              <span className="font-bold block">Score 70 - 84</span>
              <span className="text-[10px] text-teal-800">Benchmark Met</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
            <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Score 85 - 100</span>
              <span className="text-[10px] text-emerald-800">Advanced Mastery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
