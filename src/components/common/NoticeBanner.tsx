import React from 'react';
import { AlertCircle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';

interface NoticeBannerProps {
  type?: 'info' | 'warning' | 'success' | 'privacy';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  type = 'info',
  title,
  children,
  className = '',
}) => {
  let border = 'border-slate-300 bg-slate-50 text-slate-800';
  let Icon = Info;

  if (type === 'warning') {
    border = 'border-amber-300 bg-amber-50 text-amber-900';
    Icon = AlertCircle;
  } else if (type === 'success') {
    border = 'border-emerald-300 bg-emerald-50 text-emerald-900';
    Icon = CheckCircle2;
  } else if (type === 'privacy') {
    border = 'border-teal-300 bg-teal-50 text-teal-950';
    Icon = ShieldCheck;
  }

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-md border ${border} text-xs md:text-sm ${className}`}
      role="region"
      aria-label={title || 'Notice'}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5 text-current" aria-hidden="true" />
      <div className="space-y-0.5">
        {title && <p className="font-semibold text-current">{title}</p>}
        <div className="text-current opacity-90">{children}</div>
      </div>
    </div>
  );
};
