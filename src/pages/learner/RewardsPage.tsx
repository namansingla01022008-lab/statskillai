import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import {
  RewardBalance,
  RewardTransaction,
  Badge,
  LearnerStreak,
  LeaderboardEntry,
} from '../../types';
import {
  Trophy,
  Flame,
  Award,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  Footprints,
  GraduationCap,
  BrainCircuit,
  Compass,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Footprints,
  GraduationCap,
  BrainCircuit,
  Award,
  Compass,
  Flame,
  Trophy,
};

export const RewardsPage: React.FC = () => {
  const { currentUser } = useApp();
  const [balance, setBalance] = useState<RewardBalance>({ balance: 0, totalEarned: 0, totalRedeemed: 0 });
  const [streak, setStreak] = useState<LearnerStreak>({ currentStreak: 0, longestStreak: 0, totalActiveDays: 0 });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'alltime' | 'weekly' | 'monthly'>('alltime');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [balData, streakData, badgesData, txData, lbData] = await Promise.allSettled([
        ApiService.getRewardBalance(),
        ApiService.getStreak(),
        ApiService.getBadges(),
        ApiService.getRewardHistory(1, 10),
        ApiService.getLeaderboard(period, 10),
      ]);

      if (balData.status === 'fulfilled') setBalance(balData.value);
      if (streakData.status === 'fulfilled') setStreak(streakData.value);
      if (badgesData.status === 'fulfilled') setBadges(badgesData.value.badges);
      if (txData.status === 'fulfilled') setTransactions(txData.value.transactions);
      if (lbData.status === 'fulfilled') setLeaderboard(lbData.value.leaderboard);
    } catch (err) {
      console.error('Failed to load rewards dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'GOLD':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SILVER':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 rounded-2xl text-white shadow-lg border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gamified Skill Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Rewards & Achievement Center
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Earn verifiable XP by passing competency assessments, completing courses, and maintaining learning streaks. Redeem accumulated points for genuine vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Rewards Store</span>
          </Link>
          <Link
            to="/certificates"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-xs transition-all"
          >
            <Award className="w-4 h-4 text-teal-400" />
            <span>Submit Cert</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available XP */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available XP</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{balance.balance}</span>
            <span className="text-xs font-semibold text-teal-600">Points</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Available to redeem in Store</p>
        </div>

        {/* Total Earned */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lifetime Earned</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{balance.totalEarned}</span>
            <span className="text-xs font-semibold text-indigo-600">XP</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Total competency development</p>
        </div>

        {/* Total Redeemed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Redeemed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{balance.totalRedeemed}</span>
            <span className="text-xs font-semibold text-amber-600">XP</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Exchanged for vouchers</p>
        </div>

        {/* Learning Streak */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Streak</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{streak.currentStreak}</span>
            <span className="text-xs font-semibold text-orange-600">Days</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Longest: <span className="font-semibold text-slate-600">{streak.longestStreak} days</span> · Total: {streak.totalActiveDays}
          </p>
        </div>
      </div>

      {/* Main Grid: Badges (2 cols) + Leaderboard & Activity (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Badges & Milestones (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Badges Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-600" />
                  <span>Achievement Badges</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unlock permanent badges and bonus XP by hitting major skilling milestones
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {badges.filter((b) => b.isEarned).length} / {badges.length} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {badges.map((b) => {
                const IconComponent = ICON_MAP[b.iconName] || Award;
                const isEarned = b.isEarned;

                return (
                  <div
                    key={b.key}
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isEarned
                        ? 'bg-slate-50/70 border-slate-200 hover:border-teal-300'
                        : 'bg-slate-50/30 border-slate-100 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isEarned
                          ? 'bg-gradient-to-br from-teal-500 to-teal-700 text-white'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isEarned ? (
                        <IconComponent className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{b.name}</h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getTierColor(b.tier)}`}>
                          {b.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                        {b.description}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-teal-700">
                          +{b.xpBonus} XP Bonus
                        </span>
                        {isEarned ? (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Earned</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Locked</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Reward Activity Ledger */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Recent Reward Ledger Activity</span>
                </h3>
                <p className="text-xs text-slate-500">Immutable ledger tracking your XP earnings and redemptions</p>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No reward activity recorded yet. Take an assessment or complete a milestone to earn your first XP!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const isEarn = tx.type === 'EARN' || tx.type === 'REFUND';
                  return (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isEarn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{tx.description}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold shrink-0 ${
                          isEarn ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isEarn ? '+' : '-'}{tx.xpAmount} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leaderboard & Quick Actions */}
        <div className="space-y-6">
          {/* Leaderboard Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Learner Leaderboard</span>
                </h3>
                <p className="text-[11px] text-slate-400">Top performers by verified XP</p>
              </div>

              {/* Period Selector Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  onClick={() => setPeriod('alltime')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    period === 'alltime' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  All-Time
                </button>
                <button
                  onClick={() => setPeriod('weekly')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    period === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setPeriod('monthly')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    period === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No rankings recorded for this timeframe.
              </div>
            ) : (
              <div className="space-y-2 mt-3">
                {leaderboard.map((entry) => {
                  const isCurrent = entry.userId === currentUser.id;
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? 'bg-teal-50/80 border-teal-200 font-bold text-teal-950'
                          : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            entry.rank === 1
                              ? 'bg-amber-400 text-amber-950'
                              : entry.rank === 2
                              ? 'bg-slate-300 text-slate-800'
                              : entry.rank === 3
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-1">
                            <span>{entry.displayName}</span>
                            {isCurrent && <span className="text-[10px] text-teal-600 font-bold">(You)</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            {entry.department}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900">{entry.xp}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Ways to Earn XP */}
          <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-5 rounded-xl shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-teal-300">
              Accelerate Your XP
            </h4>
            <div className="space-y-2 text-xs">
              <Link
                to="/assessment"
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span>Take Domain Assessment</span>
                <span className="text-teal-300 font-bold">+10 XP</span>
              </Link>
              <Link
                to="/quiz-generator"
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span>Pass an AI Document Quiz</span>
                <span className="text-teal-300 font-bold">+10 XP</span>
              </Link>
              <Link
                to="/learning-path"
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span>Complete Pathway Milestones</span>
                <span className="text-teal-300 font-bold">+10 to +150 XP</span>
              </Link>
              <Link
                to="/certificates"
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span>Submit Verified Certificate</span>
                <span className="text-teal-300 font-bold">+200 XP</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
