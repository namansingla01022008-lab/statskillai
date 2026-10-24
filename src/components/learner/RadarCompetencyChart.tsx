import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { DomainType } from '../../types';
import { useApp } from '../../context/AppContext';
import { DOMAINS } from '../../constants/competency';

interface RadarCompetencyChartProps {
  currentScores: Record<DomainType, number>;
  targetScores?: Record<DomainType, number>;
  showTable?: boolean;
}

export const RadarCompetencyChart: React.FC<RadarCompetencyChartProps> = ({
  currentScores,
  targetScores = { Technical: 70, Statistical: 70, Digital: 70, Behavioural: 70 },
  showTable = true,
}) => {
  const { t } = useApp();

  const data = DOMAINS.map((domain) => {
    let domainLabel = domain;
    if (domain === 'Technical') domainLabel = t('technicalDomain') as any;
    if (domain === 'Statistical') domainLabel = t('statisticalDomain') as any;
    if (domain === 'Digital') domainLabel = t('digitalDomain') as any;
    if (domain === 'Behavioural') domainLabel = t('behaviouralDomain') as any;

    return {
      domain: domainLabel,
      domainKey: domain,
      Current: currentScores[domain] || 0,
      Target: targetScores[domain] || 70,
    };
  });

  return (
    <div className="space-y-4">
      {/* Chart container */}
      <div className="w-full h-64 sm:h-72" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="domain"
              tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Radar
              name="Target Benchmark"
              dataKey="Target"
              stroke="#0d9488"
              strokeWidth={2}
              fill="#14b8a6"
              fillOpacity={0.15}
            />
            <Radar
              name="Current Competency"
              dataKey="Current"
              stroke="#0284c7"
              strokeWidth={2}
              fill="#0284c7"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-xs bg-sky-600 inline-block" />
          <span className="font-medium">Current Competency (Blue)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-xs bg-teal-500 inline-block border border-teal-600" />
          <span className="font-medium">Target Benchmark (Teal)</span>
        </div>
      </div>

      {/* Accessible accompanying table */}
      {showTable && (
        <div className="pt-2">
          <table className="w-full text-xs text-left border border-slate-200 rounded-md">
            <caption className="text-left font-semibold text-slate-700 p-2 bg-slate-50 border-b border-slate-200">
              Domain Competency vs Target Benchmarks
            </caption>
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th scope="col" className="p-2">Domain</th>
                <th scope="col" className="p-2 text-right">Current Score</th>
                <th scope="col" className="p-2 text-right">Target Benchmark</th>
                <th scope="col" className="p-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const diff = row.Current - row.Target;
                const meetsTarget = diff >= 0;
                return (
                  <tr key={row.domainKey} className="hover:bg-slate-50">
                    <td className="p-2 font-medium text-slate-800">{row.domain}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{row.Current}/100</td>
                    <td className="p-2 text-right text-slate-600">{row.Target}/100</td>
                    <td className="p-2 text-right">
                      {meetsTarget ? (
                        <span className="text-emerald-700 font-semibold">+ At Target</span>
                      ) : (
                        <span className="text-rose-700 font-semibold">Gap: {Math.abs(diff)} pts</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
