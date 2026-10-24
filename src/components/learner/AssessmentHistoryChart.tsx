import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AssessmentAttempt } from '../../types';

interface AssessmentHistoryChartProps {
  attempts: AssessmentAttempt[];
}

export const AssessmentHistoryChart: React.FC<AssessmentHistoryChartProps> = ({ attempts }) => {
  if (attempts.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 italic border border-dashed border-slate-200 rounded-md">
        No assessment attempts recorded yet.
      </div>
    );
  }

  // Format data chronological order
  const sorted = [...attempts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data = sorted.map((att, idx) => ({
    date: att.date ? att.date.split('T')[0] : `Attempt ${idx + 1}`,
    domain: att.domain,
    score: att.score,
    earnedWeight: att.earnedWeight,
  }));

  return (
    <div className="space-y-4">
      <div className="w-full h-56 sm:h-64" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any, props: any) => [
                `${value}/100 (${props.payload.domain})`,
                'Score',
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Line
              type="monotone"
              dataKey="score"
              name="Assessment Score"
              stroke="#0f766e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#0f766e' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full text-xs text-left">
          <caption className="sr-only">Assessment History Logs</caption>
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th scope="col" className="p-2">Date</th>
              <th scope="col" className="p-2">Domain</th>
              <th scope="col" className="p-2 text-right">Score</th>
              <th scope="col" className="p-2 text-right">Weight Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.slice(-5).map((att) => (
              <tr key={att.id} className="hover:bg-slate-50">
                <td className="p-2 text-slate-600">{att.date.split('T')[0]}</td>
                <td className="p-2 font-medium text-slate-800">{att.domain}</td>
                <td className="p-2 text-right font-bold text-teal-800">{att.score}/100</td>
                <td className="p-2 text-right text-slate-500">{att.earnedWeight}/{att.maxWeight || 15} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
