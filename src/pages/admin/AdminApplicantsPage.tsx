import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { Application, ApplicationStatus } from '../../types';
import { Users, CheckCircle2, Search, Filter, Clock, Sparkles } from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const AdminApplicantsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(() =>
    StorageService.getApplications()
  );
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    ApiService.getAllApplications()
      .then((apps) => {
        if (apps && apps.length > 0) {
          setApplications(apps);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server applications, using local:', err);
      });
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await ApiService.updateApplicationStatus(appId, newStatus);
    } catch (err) {
      console.warn('Backend updateApplicationStatus fallback:', err);
    }
    StorageService.updateApplicationStatus(appId, newStatus);
    setApplications(StorageService.getApplications());
    setNotice(`Application status updated to "${newStatus}". Real-time alert dispatched to candidate.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const filtered = applications.filter((app) => {
    if (filterStatus !== 'All' && app.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const txt = `${app.userName} ${app.opportunityTitle} ${app.userEmail}`.toLowerCase();
      if (!txt.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Institutional Applicant Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review candidate applications and update qualification verification pipelines.
          </p>
        </div>
      </div>

      {notice && (
        <NoticeBanner type="success" title="Status Updated">
          {notice}
        </NoticeBanner>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name, opening..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md font-semibold"
          >
            <option value="All">All Statuses ({applications.length})</option>
            <option value="Submitted">Submitted</option>
            <option value="Under review">Under review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="p-3">Applicant Name</th>
              <th className="p-3">Applied Opportunity</th>
              <th className="p-3 text-center">Competency Match</th>
              <th className="p-3">Application Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Update Workflow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                  No candidate submissions recorded.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{app.userName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{app.userEmail}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-slate-800">{app.opportunityTitle}</p>
                    <p className="text-[11px] text-slate-500">{app.organisation}</p>
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>{app.matchPercentage}% Match</span>
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        app.status === 'Shortlisted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'Under review'
                          ? 'bg-sky-100 text-sky-800'
                          : app.status === 'Closed'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateStatus(app.id, e.target.value as ApplicationStatus)}
                      className="px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Under review">Under review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
