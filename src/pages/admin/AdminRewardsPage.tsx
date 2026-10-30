import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/apiService';
import {
  Reward,
  Certificate,
  RewardTransaction,
  Redemption,
  RewardRule,
  RewardAuditLog,
} from '../../types';
import {
  Trophy,
  Award,
  ShoppingBag,
  ListOrdered,
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  RotateCcw,
  Sliders,
  DollarSign,
} from 'lucide-react';

export const AdminRewardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'certificates' | 'catalog' | 'ledger' | 'redemptions' | 'rules' | 'audit'
  >('certificates');

  // Tab Data States
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<RewardAuditLog[]>([]);

  // Action / Modal States
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(null);

  // Manual Adjustment State
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Notification state
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    try {
      if (activeTab === 'certificates') {
        const certs = await ApiService.adminGetCertificates();
        setCertificates(certs);
      } else if (activeTab === 'catalog') {
        const rList = await ApiService.adminGetRewards();
        setRewards(rList);
      } else if (activeTab === 'ledger') {
        const txData = await ApiService.adminGetTransactions(1, 50);
        setTransactions(txData.transactions);
      } else if (activeTab === 'redemptions') {
        const reds = await ApiService.adminGetRedemptions();
        setRedemptions(reds);
      } else if (activeTab === 'rules') {
        const rRules = await ApiService.adminGetRewardRules();
        setRules(rRules);
      } else if (activeTab === 'audit') {
        const logs = await ApiService.adminGetAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err: any) {
      console.error('Failed to load tab data:', err);
    }
  };

  // --- CERTIFICATE ACTIONS ---
  const handleApproveCert = async (cert: Certificate) => {
    try {
      await ApiService.adminApproveCertificate(cert.id, 'Verified and approved by admin.');
      setAlert({ type: 'success', text: `Certificate approved! +200 XP awarded to ${cert.user?.name || cert.userId}.` });
      await loadTabData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to approve certificate.' });
    }
  };

  const handleRejectCert = async () => {
    if (!selectedCert || !rejectReason.trim()) return;

    try {
      await ApiService.adminRejectCertificate(selectedCert.id, rejectReason.trim());
      setAlert({ type: 'success', text: 'Certificate rejected.' });
      setIsRejectModalOpen(false);
      setSelectedCert(null);
      setRejectReason('');
      await loadTabData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to reject certificate.' });
    }
  };

  // --- REWARD CATALOG ACTIONS ---
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward?.name || !editingReward?.brand || editingReward?.xpCost === undefined) return;

    try {
      if (editingReward.id) {
        await ApiService.adminUpdateReward(editingReward.id, editingReward);
        setAlert({ type: 'success', text: 'Reward updated successfully.' });
      } else {
        await ApiService.adminCreateReward(editingReward);
        setAlert({ type: 'success', text: 'New reward created.' });
      }
      setIsRewardModalOpen(false);
      setEditingReward(null);
      await loadTabData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to save reward.' });
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Are you sure you want to remove this reward from the catalogue?')) return;
    try {
      await ApiService.adminDeleteReward(id);
      setAlert({ type: 'success', text: 'Reward removed.' });
      await loadTabData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to delete reward.' });
    }
  };

  // --- REDEMPTION REFUND ---
  const handleRefundRedemption = async (redemptionId: string) => {
    const reason = prompt('Please enter the mandatory reason for issuing this refund:');
    if (!reason || reason.trim().length < 5) {
      alert('A valid reason of at least 5 characters is required.');
      return;
    }

    try {
      const res = await ApiService.adminRefundRedemption(redemptionId, reason.trim());
      setAlert({ type: 'success', text: res.message });
      await loadTabData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to issue refund.' });
    }
  };

  // --- MANUAL ADJUSTMENT ---
  const handleManualAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId.trim() || !adjustReason.trim()) return;

    setIsAdjusting(true);
    try {
      const res = await ApiService.adminAdjustXP(adjustUserId.trim(), adjustAmount, adjustReason.trim());
      setAlert({ type: 'success', text: res.message });
      setAdjustUserId('');
      setAdjustReason('');
      setAdjustAmount(50);
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Adjustment failed.' });
    } finally {
      setIsAdjusting(false);
    }
  };

  // --- RULE TOGGLE ---
  const handleToggleRule = async (rule: RewardRule) => {
    try {
      await ApiService.adminUpdateRewardRule(rule.id, { isActive: !rule.isActive });
      await loadTabData();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.message || 'Failed to toggle rule.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reward & Credential Administration</h1>
          <p className="text-slate-400 text-xs mt-1">
            Review student certificate submissions, manage the reward catalog, audit the XP ledger, and configure earning rules.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReward({
              name: '',
              brand: 'Amazon',
              category: 'VOUCHER',
              description: '',
              xpCost: 500,
              stock: 25,
              isActive: true,
            });
            setIsRewardModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reward Item</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'certificates'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certificates Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Reward Catalogue</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ledger'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>XP Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('redemptions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'redemptions'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Redemptions & Refunds</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rules'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Earning Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit & Manual Adjust</span>
        </button>
      </div>

      {/* Alert Notification Toast */}
      {alert && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
            alert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alert.text}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* TAB 1: CERTIFICATES QUEUE */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Certificate Submissions Roster</h3>
              <p className="text-xs text-slate-500">Inspect external validation links and authorize +200 XP awards</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {certificates.length} Submissions
            </span>
          </div>

          {certificates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No certificates submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Learner</th>
                    <th className="py-3 px-4">Course & Provider</th>
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Verification URL</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.user?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400">{c.user?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{c.courseName}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold uppercase text-slate-600">
                          {c.provider}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">{c.certId}</td>
                      <td className="py-3 px-4">
                        <a
                          href={c.verificationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1"
                        >
                          <span>Open Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {c.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApproveCert(c)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all"
                          >
                            Approve (+200 XP)
                          </button>
                        )}
                        {c.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setSelectedCert(c);
                              setIsRejectModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-all border border-rose-200"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REWARD CATALOGUE */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Active Catalogue Items</h3>
              <p className="text-xs text-slate-500">Configure vouchers, price points, and active inventory</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 bg-slate-50/40">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{r.brand}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {r.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{r.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{r.xpCost} XP</span>
                    <span className="text-[10px] text-slate-400 block">{r.stock === -1 ? 'Unlimited stock' : `${r.stock} in stock`}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingReward(r);
                        setIsRewardModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                      title="Edit Reward"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteReward(r.id)}
                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700"
                      title="Delete Reward"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: XP LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Institutional XP Ledger</h3>
            <p className="text-xs text-slate-500">Immutable record of every point earned, deducted, adjusted, or refunded</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Idempotency Key</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{tx.user?.name || tx.userId.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'EARN' ? 'bg-emerald-100 text-emerald-800' :
                        tx.type === 'REFUND' ? 'bg-blue-100 text-blue-800' :
                        tx.type === 'ADJUST' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{tx.description}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[140px]">{tx.idempotencyKey}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {tx.type === 'EARN' || tx.type === 'REFUND' ? '+' : '-'}{tx.xpAmount} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REDEMPTIONS & REFUNDS */}
      {activeTab === 'redemptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Learner Redemptions</h3>
            <p className="text-xs text-slate-500">Track voucher deliveries and initiate manual refunds if delivery failed</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">XP Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Masked Voucher</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.user?.name || r.userId.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.reward?.name || 'Voucher'}</td>
                    <td className="py-3 px-4 font-semibold text-teal-700">{r.xpSpent} XP</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'REFUNDED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{r.voucherCode || 'N/A'}</td>
                    <td className="py-3 px-4 text-right">
                      {r.status !== 'REFUNDED' && (
                        <button
                          onClick={() => handleRefundRedemption(r.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px]"
                        >
                          Manual Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: EARNING RULES CONFIGURATION */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Earning Rules Engine</h3>
            <p className="text-xs text-slate-500">Configure XP awards for learning events across StatSkillAI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900">{rule.label}</h4>
                    <span className="font-mono text-[10px] text-slate-400">({rule.eventType})</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{rule.description}</p>
                  <div className="text-[11px] text-teal-700 font-bold">
                    Reward: +{rule.xpAmount} XP {rule.dailyCap ? `(Daily Cap: ${rule.dailyCap} XP)` : ''}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleRule(rule)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    rule.isActive
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MANUAL ADJUSTMENT & AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Manual XP Adjustment Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span>Manual XP Adjustment</span>
            </h3>
            <p className="text-xs text-slate-500">
              Directly award or deduct XP with a mandatory institutional audit rationale.
            </p>

            <form onSubmit={handleManualAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Learner User ID *</label>
                <input
                  type="text"
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  placeholder="e.g. user-student"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">XP Amount (Positive to add, negative to deduct) *</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Administrative Reason *</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Hackathon winner bonus / Correction of duplicate claim"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isAdjusting}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all disabled:opacity-50"
              >
                {isAdjusting ? 'Processing...' : 'Apply Adjustment'}
              </button>
            </form>
          </div>

          {/* Audit Logs Viewer (2 spans) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Administrative Action Audit Trail</span>
            </h3>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                    <p className="text-slate-600 mt-1 font-mono text-[11px] break-all">{log.detail}</p>
                    <span className="text-[10px] text-slate-400">Actor: {log.actorId}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reject Certificate Modal */}
      {isRejectModalOpen && selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Reject Certificate Submission</h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason for the rejection of &ldquo;{selectedCert.courseName}&rdquo;. This will be shown to the learner.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. The verification URL does not resolve to an official NPTEL domain."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs"
              rows={3}
              required
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedCert(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectCert}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Reward Modal */}
      {isRewardModalOpen && editingReward && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveReward} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900">
              {editingReward.id ? 'Edit Reward Item' : 'Create New Reward Item'}
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reward Name *</label>
              <input
                type="text"
                value={editingReward.name || ''}
                onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand *</label>
                <input
                  type="text"
                  value={editingReward.brand || ''}
                  onChange={(e) => setEditingReward({ ...editingReward, brand: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editingReward.category || 'VOUCHER'}
                  onChange={(e) => setEditingReward({ ...editingReward, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="VOUCHER">Voucher</option>
                  <option value="COURSE_ACCESS">Course Access</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">XP Cost *</label>
                <input
                  type="number"
                  value={editingReward.xpCost || 500}
                  onChange={(e) => setEditingReward({ ...editingReward, xpCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stock (-1 = unlimited)</label>
                <input
                  type="number"
                  value={editingReward.stock !== undefined ? editingReward.stock : -1}
                  onChange={(e) => setEditingReward({ ...editingReward, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={editingReward.description || ''}
                onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
                rows={2}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Image URL (Optional)</label>
              <input
                type="url"
                value={editingReward.imageUrl || ''}
                onChange={(e) => setEditingReward({ ...editingReward, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={editingReward.isActive !== false}
                onChange={(e) => setEditingReward({ ...editingReward, isActive: e.target.checked })}
                className="rounded text-teal-600"
              />
              <label htmlFor="isActive" className="font-semibold text-slate-700">Active in Store Catalogue</label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRewardModalOpen(false);
                  setEditingReward(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white"
              >
                Save Reward
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
