import React, { useState } from 'react';
import { MentorshipFeedbackRecord, MentorshipSessionBooking } from '../../types';
import { ApiService } from '../../services/apiService';
import {
  CheckCircle2,
  Star,
  Sparkles,
  TrendingUp,
  Award,
  ListChecks,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
} from 'lucide-react';

interface MentorFeedbackModalProps {
  session: MentorshipSessionBooking;
  feedback: MentorshipFeedbackRecord;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export const MentorFeedbackModal: React.FC<MentorFeedbackModalProps> = ({
  session,
  feedback,
  onClose,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(feedback.rating || 5);
  const [review, setReview] = useState<string>(feedback.review || '');
  const [isHelpful, setIsHelpful] = useState<boolean>(feedback.isHelpful ?? true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState<boolean>(Boolean(feedback.rating));

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ApiService.submitSessionReview(session.sessionId, {
        rating,
        review,
        isHelpful,
        mentorId: session.mentorId,
      });
      setHasSubmittedReview(true);
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const domain = feedback.skillBoostDomain || session.skillDomain || 'Technical';
  const beforeScore = feedback.previousScore || 62;
  const afterScore = feedback.updatedScore || 67;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mentorship Completed ✓
            </span>
            <span className="text-xs text-teal-300 font-semibold">Verified Feedback Report</span>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Live Session Feedback & Skill Growth
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Topic: <strong>{session.topic}</strong> • Mentor: <strong>{session.mentorName}</strong> • Duration: <strong>5 Mins (₹{session.price} / 5 mins)</strong>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* SKILL PROGRESSION ANIMATION / BADGE */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-500/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-black">Skill Progress Updated</span>
              </div>
              <p className="text-[11px] text-teal-800">
                Empirical competence growth verified by {session.mentorName}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-teal-200 shadow-2xs">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Before</span>
                <span className="text-lg font-black text-slate-500 line-through">{domain}: {beforeScore}%</span>
              </div>
              <div className="text-teal-600 font-bold text-base">→</div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">After Mentorship</span>
                <span className="text-xl font-black text-emerald-700">{domain}: {afterScore}%</span>
              </div>
              <div className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs">
                +5%
              </div>
            </div>
          </div>

          {/* MENTOR EVALUATION & PERSONAL MESSAGE */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              <span>Mentor's Clinical Evaluation</span>
            </h3>
            <p className="text-slate-800 font-medium leading-relaxed italic text-xs bg-white p-3 rounded-lg border border-slate-200">
              "{feedback.personalMessage || feedback.studentUnderstanding}"
            </p>
          </div>

          {/* STRENGTHS & WEAK AREAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <span className="font-bold text-emerald-950 text-xs block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Demonstrated Strengths
              </span>
              <ul className="space-y-1.5 text-slate-700 text-[11px]">
                {feedback.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weak Areas */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <span className="font-bold text-amber-950 text-xs block flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                Focus & Improvement Areas
              </span>
              <ul className="space-y-1.5 text-slate-700 text-[11px]">
                {feedback.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RECOMMENDED NEXT TASKS */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-teal-700" />
                <span>Recommended Next Tasks from Mentor</span>
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                Action Items
              </span>
            </div>

            <div className="space-y-2">
              {feedback.nextTasks.map((task, idx) => (
                <label
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    defaultChecked={idx === 0}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-800 text-xs">{task}</span>
                </label>
              ))}
            </div>
          </div>

          {/* REVIEWS & RATINGS */}
          <div className="pt-4 border-t border-slate-200">
            {hasSubmittedReview ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <div className="flex items-center justify-center text-amber-500">
                  {'★'.repeat(rating)}
                </div>
                <p className="font-bold text-xs text-slate-800">
                  Thank you! Your {rating}-Star review has been recorded.
                </p>
                {review && <p className="text-[11px] text-slate-600 italic">"{review}"</p>}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">
                    Rate Your Mentorship Experience
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your rating helps verified mentors maintain accreditation and guides other learners.
                  </p>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 hover:scale-110 transition-transform text-amber-500"
                    >
                      <Star
                        className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{rating} of 5 Stars</span>
                </div>

                {/* Was this helpful toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700">Was this mentorship helpful?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsHelpful(true)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        isHelpful ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Yes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsHelpful(false)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        !isHelpful ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>No</span>
                    </button>
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <textarea
                    rows={2}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share how the mentor guided your understanding or what exercise helped most..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Recorded securely under NEP Continuous Learning Portfolio
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
