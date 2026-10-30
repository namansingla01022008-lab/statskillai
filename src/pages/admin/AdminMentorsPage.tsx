import React, { useState } from 'react';
import { StorageService } from '../../services/storageService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Mentor } from '../../types';
import { ShieldCheck, ShieldAlert, Star, Users, Check, X } from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const AdminMentorsPage: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const [mentors, setMentors] = useState<Mentor[]>(() => StorageService.getMentors());
  const [notice, setNotice] = useState<string | null>(null);

  const handleToggleVerification = (mentorId: string) => {
    if (!isOnline) {
      setNotice('Mentor verification actions are disabled while offline.');
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    StorageService.toggleMentorVerification(mentorId);
    const updated = StorageService.getMentors();
    setMentors(updated);
    const m = updated.find((item) => item.id === mentorId);
    setNotice(
      `Verification status for ${m?.name} updated to ${m?.isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`
    );
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {!isOnline && (
        <NoticeBanner type="warning" title="Mentor Verification Disabled Offline">
          You are offline. Reviewing mentor credentials is allowed, but modifying verification statuses requires an active network connection.
        </NoticeBanner>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Human Mentor Verification Authority
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grant or revoke official verification status for statistical advisors and domain mentors.
          </p>
        </div>
      </div>

      {notice && (
        <NoticeBanner type="success" title="Authority Update Executed">
          {notice}
        </NoticeBanner>
      )}

      {/* Mentors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="p-3">Mentor Specialist</th>
              <th className="p-3">Designation & Institution</th>
              <th className="p-3">Specialization Field</th>
              <th className="p-3">Verification State</th>
              <th className="p-3">Rating & Reviews</th>
              <th className="p-3 text-right">Verification Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mentors.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {m.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-slate-500">{m.experienceYears} Years Exp.</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <p className="font-semibold text-slate-800">{m.title}</p>
                  <p className="text-[11px] text-slate-500">{m.organisation}</p>
                </td>
                <td className="p-3 text-slate-700 max-w-xs truncate">
                  {m.field}
                </td>
                <td className="p-3">
                  {m.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                      <span>Verified ({m.verifiedDate})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pending Verification</span>
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{m.rating} ({m.totalReviews} reviews)</span>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <button
                    disabled={!isOnline}
                    onClick={() => handleToggleVerification(m.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      m.isVerified
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-teal-700 hover:bg-teal-800 text-white'
                    }`}
                  >
                    {m.isVerified ? 'Revoke Verification' : 'Verify Mentor'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
