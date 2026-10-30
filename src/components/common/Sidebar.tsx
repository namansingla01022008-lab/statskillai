import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  UserCheck,
  BrainCircuit,
  TrendingDown,
  GitBranch,
  FileQuestion,
  Briefcase,
  Users,
  BarChart3,
  BookOpenCheck,
  UserPlus,
  ShieldCheck,
  Settings,
  HelpCircle,
  X,
  Sparkles,
  Trophy,
  ShoppingBag,
  Award,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeProfile, t } = useApp();
  const location = useLocation();
  const currentPath = location.pathname;

  // Learner nav items
  const learnerNav = [
    { label: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: 'Rewards & XP', path: '/rewards', icon: Trophy },
    { label: 'Rewards Store', path: '/store', icon: ShoppingBag },
    { label: 'Certificates', path: '/certificates', icon: Award },
    { label: t('profile'), path: '/profile', icon: UserCheck },
    { label: t('assessment'), path: '/assessment', icon: BrainCircuit },
    { label: t('gapAnalysis'), path: '/gap-analysis', icon: TrendingDown },
    { label: t('learningPath'), path: '/learning-path', icon: GitBranch },
    { label: t('aiQuiz'), path: '/quiz-generator', icon: FileQuestion },
    { label: t('opportunities'), path: '/opportunities', icon: Briefcase },
    { label: t('mentorship'), path: '/mentorship', icon: Users },
  ];

  // Mentor nav items
  const mentorNav = [
    { label: t('mentees'), path: '/mentor/dashboard', icon: Users },
  ];

  // Admin nav items
  const adminNav = [
    { label: t('adminAnalytics'), path: '/admin/analytics', icon: BarChart3 },
    { label: 'Certificates Queue', path: '/admin/certificates', icon: Award },
    { label: 'Rewards Mgmt', path: '/admin/rewards', icon: Trophy },
    { label: t('adminCatalog'), path: '/admin/catalog', icon: BookOpenCheck },
    { label: t('adminApplicants'), path: '/admin/applicants', icon: UserPlus },
    { label: t('adminMentors'), path: '/admin/mentors', icon: ShieldCheck },
    { label: t('adminSettings'), path: '/admin/settings', icon: Settings },
  ];

  const items =
    currentUser.role === 'admin'
      ? adminNav
      : currentUser.role === 'mentor'
      ? mentorNav
      : learnerNav;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Mobile Header in drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-white text-sm">StatSkillAI Menu</span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Banner */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                currentUser.role === 'admin'
                  ? 'bg-amber-400'
                  : currentUser.role === 'mentor'
                  ? 'bg-indigo-400'
                  : 'bg-teal-400'
              }`}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {currentUser.role === 'admin'
                ? t('roleAdmin')
                : currentUser.role === 'mentor'
                ? t('roleMentor')
                : t('roleLearner')}
            </span>
          </div>
          <p className="font-semibold text-white text-sm mt-1 truncate">{currentUser.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{currentUser.department || currentUser.designation}</p>

          {/* Profile completeness meter for learners */}
          {currentUser.role === 'learner' && activeProfile && (
            <div className="mt-3 pt-2.5 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-slate-300">
                <span>Profile Readiness</span>
                <span className="text-teal-400 font-bold">{activeProfile.completeness}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${activeProfile.completeness}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={`#${item.path}`}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}

          <div className="pt-3 my-2 border-t border-slate-800" />

          {/* Static About / NEP Page Link available to all */}
          <a
            href="#/about"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
              currentPath === '/about'
                ? 'bg-slate-800 text-teal-300'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>{t('about')}</span>
          </a>
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>NEP-2020 Aligned</span>
          </div>
          <p className="text-[10px] leading-snug text-slate-400">
            Personalised skilling, credit portability & multi-disciplinary assessment.
          </p>
        </div>
      </aside>
    </>
  );
};
