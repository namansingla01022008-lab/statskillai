import React from 'react';
import { Mentor } from '../../types';
import {
  ShieldCheck,
  Star,
  Clock,
  X,
  Award,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

interface MentorProfileModalProps {
  mentor: Mentor;
  onClose: () => void;
  onBookSession: (mentor: Mentor) => void;
}

export const MentorProfileModal: React.FC<MentorProfileModalProps> = ({
  mentor,
  onClose,
  onBookSession,
}) => {
  const price = mentor.price || 10;
  const expertise = mentor.expertise || [mentor.field];
  const slots = mentor.availableSlots || [
    { id: '1', dayOfWeek: 'Monday', time: '10:00 AM' },
    { id: '2', dayOfWeek: 'Wednesday', time: '02:00 PM' },
    { id: '3', dayOfWeek: 'Friday', time: '06:00 PM' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white/20">
              {mentor.name[0]}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{mentor.name}</h2>
                {mentor.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-400 text-slate-950 border border-teal-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Specialist
                  </span>
                )}
              </div>
              <p className="text-xs text-teal-300 font-semibold">{mentor.title}</p>
              <p className="text-xs text-slate-400">{mentor.organisation}</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Experience</span>
              <span className="text-sm font-black text-white">{mentor.experienceYears} Years</span>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Rating</span>
              <span className="text-sm font-black text-amber-400 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {mentor.rating} ({mentor.totalReviews})
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Sessions</span>
              <span className="text-sm font-black text-teal-300">{mentor.totalSessions || 120}+</span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* About */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>About the Mentor</span>
            </h3>
            <p className="text-slate-600 leading-relaxed text-xs">
              {mentor.bio}
            </p>
          </div>

          {/* Skills & Expertise */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-700" />
              <span>Expertise & Teaching Domains</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {expertise.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 font-semibold border border-teal-200 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Available Time Slots */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>Available Live Slots (5-Minute Sessions)</span>
              </h3>
              <span className="text-[11px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                ₹{price} / 5 minutes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold block text-slate-900">{slot.dayOfWeek}</span>
                    <span className="text-[11px] text-teal-800 font-semibold">{slot.time}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Open
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Student Feedback */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <span>Recent Learner Reviews</span>
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">Aarav S. • Final Year B.Tech</span>
                  <div className="flex items-center text-amber-500">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-slate-600 text-xs italic">
                  “The 1-on-1 walkthrough cleared my doubts about recursive tree balancing immediately. Best ₹{price} spent on a focused 5-minute deep dive!”
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">Neha P. • Junior Analyst</span>
                  <div className="flex items-center text-amber-500">
                    {'★'.repeat(5)}
                  </div>
                </div>
                <p className="text-slate-600 text-xs italic">
                  “Super helpful code review and clear next steps to practice for my technical interview.”
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Session Fee</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-950">₹{price}</span>
              <span className="text-xs text-slate-600 font-bold">/ 5 minutes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookSession(mentor);
              }}
              className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-black text-xs transition-all shadow-md hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>Book Live Session – ₹{price} / 5 mins</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
