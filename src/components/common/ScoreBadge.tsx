import React from 'react';
import { ProficiencyLevel } from '../../types';
import { getProficiencyLevel, getProficiencyLevelLabel } from '../../constants/competency';
import { useApp } from '../../context/AppContext';

interface ScoreBadgeProps {
  score?: number;
  level?: ProficiencyLevel;
  showScore?: boolean;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  level: inputLevel,
  showScore = true,
  className = '',
}) => {
  const { language } = useApp();
  const effectiveLevel = inputLevel || (typeof score === 'number' ? getProficiencyLevel(score) : 'Beginner');

  let style = 'bg-amber-100 text-amber-900 border-amber-300';
  let dotColor = 'bg-amber-500';

  if (effectiveLevel === 'Advanced') {
    style = 'bg-emerald-100 text-emerald-900 border-emerald-300';
    dotColor = 'bg-emerald-600';
  } else if (effectiveLevel === 'Intermediate') {
    style = 'bg-sky-100 text-sky-900 border-sky-300';
    dotColor = 'bg-sky-600';
  }

  const label = getProficiencyLevelLabel(effectiveLevel, language);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{label}</span>
      {showScore && typeof score === 'number' && (
        <span className="opacity-80">({score}/100)</span>
      )}
    </span>
  );
};
