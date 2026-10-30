import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Reward, Redemption, RewardBalance } from '../../types';
import {
  ShoppingBag,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Gift,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const RewardStorePage: React.FC = () => {
  const { currentUser } = useApp();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [balance, setBalance] = useState<RewardBalance>({ balance: 0, totalEarned: 0, totalRedeemed: 0 });
  const [activeTab, setActiveTab] = useState<'store' | 'redemptions'>('store');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      const [rewardList, userBal, userReds] = await Promise.all([
        ApiService.getRewardStore(),
        ApiService.getRewardBalance(),
        ApiService.getMyRedemptions(),
      ]);
      setRewards(rewardList);
      setBalance(userBal);
      setRedemptions(userReds);
    } catch (err) {
      console.error('Failed to load store data:', err);
    }
  };

  const handleRedeemConfirm = async () => {
    if (!selectedReward) return;

    setIsRedeeming(true);
    setMessage(null);

    try {
      const idempotencyKey = `client-redeem-${currentUser.id}-${selectedReward.id}-${Date.now()}`;
      const res = await ApiService.redeemReward(selectedReward.id, idempotencyKey);

      setMessage({ type: 'success', text: res.message });
      setSelectedReward(null);
      await loadStoreData();
      setActiveTab('redemptions');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Redemption failed. Please try again.' });
    } finally {
      setIsRedeeming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Success</span>;
      case 'REFUNDED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Refunded to XP</span>;
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Processing</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Banner with XP Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">StatSkill Rewards Store</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Exchange your verified competency XP for gift cards, educational subscriptions, and learning resources.
          </p>
        </div>

        {/* Balance Badge */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Your Balance</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{balance.balance}</span>
              <span className="text-xs font-bold text-teal-600">XP</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-[11px] text-slate-500">
            <span className="block font-semibold text-slate-700">{balance.totalEarned} Lifetime</span>
            <span>{balance.totalRedeemed} Redeemed</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'store'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Available Rewards ({rewards.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('redemptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'redemptions'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Redemptions ({redemptions.length})</span>
        </button>
      </div>

      {/* Alert Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border animate-slide-in ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* TAB 1: Rewards Catalogue Grid */}
      {activeTab === 'store' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((r) => {
            const canAfford = balance.balance >= r.xpCost;
            const inStock = r.stock === -1 || r.stock > 0;

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Media Header */}
                  <div className="h-40 bg-gradient-to-br from-slate-900 to-slate-800 relative p-4 flex flex-col justify-between overflow-hidden">
                    {r.imageUrl && (
                      <img
                        src={r.imageUrl}
                        alt={r.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                      />
                    )}
                    <div className="flex items-center justify-between relative z-10">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-slate-900 backdrop-blur-xs">
                        {r.brand}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/90 text-white backdrop-blur-xs">
                        {r.category.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{r.xpCost}</span>
                      <span className="text-xs font-bold text-teal-300">XP</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{r.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {r.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer & Action */}
                <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                  <div className="text-[11px] text-slate-400">
                    {r.stock === -1 ? (
                      <span className="text-emerald-600 font-semibold">Available</span>
                    ) : r.stock > 0 ? (
                      <span>{r.stock} in stock</span>
                    ) : (
                      <span className="text-rose-600 font-bold">Out of stock</span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedReward(r)}
                    disabled={!canAfford || !inStock}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      canAfford && inStock
                        ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-xs active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {!inStock ? 'Out of Stock' : !canAfford ? 'Need More XP' : 'Redeem Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: My Redemptions Table & Voucher Display */}
      {activeTab === 'redemptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {redemptions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Gift className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No redemptions yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once you redeem a reward from the store, your digital voucher codes will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {redemptions.map((red) => (
                <div key={red.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{red.reward?.name || 'Voucher Reward'}</h4>
                      {getStatusBadge(red.status)}
                    </div>
                    <p className="text-xs text-slate-400">
                      Redeemed for <strong className="text-slate-700">{red.xpSpent} XP</strong> on{' '}
                      {new Date(red.createdAt).toLocaleDateString()}
                    </p>
                    {red.failureReason && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md inline-block">
                        Note: {red.failureReason}
                      </p>
                    )}
                  </div>

                  {/* Voucher Code Reveal Box */}
                  {red.status === 'SUCCESS' && red.voucherCode && (
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Voucher Code</span>
                        <code className="text-xs font-mono font-bold text-teal-800 tracking-wider">
                          {red.voucherCode}
                        </code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(red.voucherCode!)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                        title="Copy voucher code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Confirm Redemption</h3>
                <p className="text-xs text-slate-500">Atomic deduction from your reward ledger</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Reward:</span>
                <span className="font-bold text-slate-900">{selectedReward.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Required XP:</span>
                <span className="font-bold text-teal-700">{selectedReward.xpCost} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-bold text-slate-900">{balance.balance} XP</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-bold text-slate-900">{balance.balance - selectedReward.xpCost} XP</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Digital voucher codes are generated instantly. If delivery fails for any reason, your points are automatically and safely refunded back to your balance.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReward(null)}
                disabled={isRedeeming}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemConfirm}
                disabled={isRedeeming}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isRedeeming ? 'Processing...' : 'Confirm & Redeem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
