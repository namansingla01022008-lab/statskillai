import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { Mentorship } from '../../types';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  MessageSquare,
  Award,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const MentorDashboard: React.FC = () => {
  const { currentUser } = useApp();

  const [mentorships, setMentorships] = useState<Mentorship[]>(() =>
    StorageService.getMentorMentorships(currentUser.id)
  );

  const [notice, setNotice] = useState<string | null>(null);

  const handleUpdateStatus = (mentorshipId: string, status: Mentorship['status']) => {
    const item = mentorships.find((m) => m.id === mentorshipId);
    if (!item) return;

    item.status = status;
    StorageService.saveMentorship(item);
    setMentorships([...mentorships]);
    setNotice(`Mentorship status updated to ${status}.`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              Verified Mentor Workspace
            </span>
            <span className="text-xs text-slate-500">
              {currentUser.department || currentUser.designation}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Assigned Mentees & Advisory Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Review applicant goals, inspect competency profiles, issue directives, and recommend courses.
          </p>
        </div>
      </div>

      {notice && (
        <NoticeBanner type="success" title="Action Completed">
          {notice}
        </NoticeBanner>
      )}

      {/* Mentees Table / Card Roster */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>Active & Pending Mentee Requests ({mentorships.length})</span>
        </h2>

        {mentorships.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic text-xs">
            No mentees currently assigned to your profile.
          </div>
        ) : (
          <div className="space-y-4">
            {mentorships.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{m.learnerName}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                        {m.learnerProfileType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                      <strong>Stated Goal: </strong>"{m.goalMessage}"
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Requested Date: {new Date(m.requestedAt).toLocaleDateString()} • Schedule: {m.meetingSchedule || 'Async thread'}
                    </p>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="shrink-0 flex sm:flex-col items-end gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        m.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : m.status === 'Completed'
                          ? 'bg-sky-100 text-sky-800'
                          : m.status === 'Declined'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      Status: {m.status}
                    </span>
                  </div>
                </div>

                {/* Directive Notes Preview if any */}
                {m.feedbackNotes && m.feedbackNotes.length > 0 && (
                  <div className="text-xs text-slate-600 bg-teal-50/50 p-2.5 rounded border border-teal-100">
                    <strong className="text-teal-900 block">Your Last Directive: </strong>
                    <span className="italic">{m.feedbackNotes[m.feedbackNotes.length - 1]}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {m.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(m.id, 'Accepted')}
                          className="px-3.5 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors"
                        >
                          Accept Mentorship
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(m.id, 'Declined')}
                          className="px-3.5 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {m.status === 'Accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(m.id, 'Completed')}
                        className="px-3.5 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-bold transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>

                  <a
                    href={`#/mentor/mentee/${m.learnerId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Read-Only Competency Profile</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
