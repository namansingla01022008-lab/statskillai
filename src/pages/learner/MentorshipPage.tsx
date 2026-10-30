import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Mentor, Mentorship, DirectMessage } from '../../types';
import {
  Users,
  ShieldCheck,
  Star,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  Filter,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const MentorshipPage: React.FC = () => {
  const { currentUser, activeProfile, t } = useApp();
  const { isOnline } = useNetworkStatus();
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const mentors = StorageService.getMentors();
  const [mentorships, setMentorships] = useState<Mentorship[]>(() =>
    StorageService.getLearnerMentorships(currentUser.id)
  );

  // Active selected mentorship for message thread
  const [activeMentorshipId, setActiveMentorshipId] = useState<string | null>(
    mentorships.length > 0 ? mentorships[0].id : null
  );

  // Filters for mentor directory
  const [filterField, setFilterField] = useState('All');
  const [filterLanguage, setFilterLanguage] = useState('All');

  // Request modal state
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [requestGoal, setRequestGoal] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Messaging state
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // Rating modal state
  const [ratingMentorshipId, setRatingMentorshipId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');

  const currentMentorship = mentorships.find((m) => m.id === activeMentorshipId);

  // Synchronize messages & subscribe to Socket.io room
  useEffect(() => {
    if (!currentMentorship) {
      setMessages([]);
      return;
    }

    // 1. Initial fetch from API or Storage
    ApiService.getMessages(currentMentorship.id)
      .then((serverMsgs) => {
        if (serverMsgs && serverMsgs.length > 0) {
          setMessages(serverMsgs);
        } else {
          setMessages(StorageService.getMessages(currentMentorship.id));
        }
      })
      .catch(() => {
        setMessages(StorageService.getMessages(currentMentorship.id));
      });

    // 2. Real-time Socket.io listeners
    try {
      const socket = ApiService.getSocket();
      setIsSocketConnected(socket.connected);

      const onConnect = () => setIsSocketConnected(true);
      const onDisconnect = () => setIsSocketConnected(false);
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      socket.emit('join_mentorship', currentMentorship.id);

      const handleNewMessage = (newMsg: DirectMessage) => {
        if (newMsg.mentorshipId === currentMentorship.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          StorageService.sendMessage(newMsg);
        }
      };

      const handleTypingStart = (data: { senderId: string; senderName: string }) => {
        if (data.senderId !== currentUser.id) {
          setTypingUser(data.senderName);
        }
      };

      const handleTypingStop = (data: { senderId: string }) => {
        if (data.senderId !== currentUser.id) {
          setTypingUser(null);
        }
      };

      socket.on('new_message', handleNewMessage);
      socket.on('typing_start', handleTypingStart);
      socket.on('typing_stop', handleTypingStop);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.emit('leave_mentorship', currentMentorship.id);
        socket.off('new_message', handleNewMessage);
        socket.off('typing_start', handleTypingStart);
        socket.off('typing_stop', handleTypingStop);
      };
    } catch (err) {
      console.warn('Socket connection deferred in MentorshipPage:', err);
    }
  }, [currentMentorship?.id, currentUser.id]);

  // Filter lists
  const uniqueLanguages = Array.from(new Set(mentors.flatMap((m) => m.languages)));
  const filteredMentors = mentors.filter((m) => {
    if (filterField !== 'All' && !m.field.toLowerCase().includes(filterField.toLowerCase())) {
      return false;
    }
    if (filterLanguage !== 'All' && !m.languages.includes(filterLanguage)) {
      return false;
    }
    return true;
  });

  // Handle send request
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor || !requestGoal.trim()) return;

    let newMentorship: Mentorship;
    try {
      newMentorship = await ApiService.requestMentorship(selectedMentor.id, requestGoal.trim());
    } catch (err) {
      console.warn('Backend requestMentorship fallback to local storage:', err);
      newMentorship = {
        id: `mentorship-${Date.now()}`,
        mentorId: selectedMentor.id,
        mentorName: selectedMentor.name,
        mentorUserId: selectedMentor.userId,
        learnerId: currentUser.id,
        learnerName: currentUser.name,
        learnerProfileType: currentUser.profileType || 'Student',
        goalMessage: requestGoal.trim(),
        status: 'Pending',
        requestedAt: new Date().toISOString(),
        meetingSchedule: 'Awaiting mentor schedule proposal',
        feedbackNotes: [],
        recommendedSteps: [],
      };
    }

    StorageService.saveMentorship(newMentorship);
    const updated = [newMentorship, ...mentorships];
    setMentorships(updated);
    setActiveMentorshipId(newMentorship.id);
    setSelectedMentor(null);
    setRequestGoal('');
    setSuccessBanner(`Mentorship request successfully sent to ${selectedMentor.name}.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Handle Send Direct Message with real-time Socket broadcast
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMentorship || !replyText.trim()) return;

    const textToSend = replyText.trim();
    setReplyText('');

    // Stop typing notification
    try {
      ApiService.getSocket().emit('typing_stop', { mentorshipId: currentMentorship.id });
    } catch {}

    try {
      const serverMsg = await ApiService.sendMessage(currentMentorship.id, textToSend);
      setMessages((prev) => {
        if (prev.some((m) => m.id === serverMsg.id)) return prev;
        return [...prev, serverMsg];
      });
      StorageService.sendMessage(serverMsg);
    } catch (err) {
      console.warn('Backend sendMessage fallback:', err);
      const fallbackMsg: DirectMessage = {
        id: `msg-${Date.now()}`,
        mentorshipId: currentMentorship.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'learner',
        text: textToSend,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      StorageService.sendMessage(fallbackMsg);
    }
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
    if (!currentMentorship) return;
    try {
      const socket = ApiService.getSocket();
      if (e.target.value.length > 0) {
        socket.emit('typing_start', { mentorshipId: currentMentorship.id });
      } else {
        socket.emit('typing_stop', { mentorshipId: currentMentorship.id });
      }
    } catch {}
  };

  // Handle Submit Rating
  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingMentorshipId) return;

    const m = mentorships.find((item) => item.id === ratingMentorshipId);
    if (m) {
      m.rating = ratingScore;
      m.ratingComment = ratingComment;
      StorageService.saveMentorship(m);
      setMentorships([...mentorships]);
    }
    setRatingMentorshipId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
              Verified Practitioners
            </span>
            <span className="text-xs text-slate-500">
              {mentors.length} Verified Domain Specialists
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {t('mentorshipTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t('mentorshipSubtitle')}
          </p>
        </div>
      </div>

      {successBanner && (
        <NoticeBanner type="success" title="Request Transmitted">
          {successBanner}
        </NoticeBanner>
      )}

      {/* ACTIVE MENTORSHIP THREAD (If any exist) */}
      {mentorships.length > 0 && (
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-700" />
                <span>{t('activeMentorships')} ({mentorships.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Asynchronous communication thread and directive reviews
              </p>
            </div>

            {/* Select between multiple mentorships */}
            {mentorships.length > 1 && (
              <select
                value={activeMentorshipId || ''}
                onChange={(e) => setActiveMentorshipId(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-md font-semibold"
              >
                {mentorships.map((m) => (
                  <option key={m.id} value={m.id}>
                    With {m.mentorName} ({m.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {currentMentorship && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Mentorship Details & Notes (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {currentMentorship.mentorName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentMentorship.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentMentorship.status === 'Completed'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {currentMentorship.status}
                    </span>
                  </div>

                  <p className="text-slate-600">
                    <strong>Initial Goal: </strong>
                    "{currentMentorship.goalMessage}"
                  </p>

                  <p className="text-slate-500">
                    Schedule: {currentMentorship.meetingSchedule || 'Async advisory'}
                  </p>

                  {/* Rating control if completed */}
                  {currentMentorship.status === 'Completed' && (
                    <div className="pt-2 border-t border-slate-200">
                      {currentMentorship.rating ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span>Rated {currentMentorship.rating} / 5 Stars</span>
                          </div>
                          {currentMentorship.ratingComment && (
                            <p className="text-slate-600 italic">"{currentMentorship.ratingComment}"</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setRatingMentorshipId(currentMentorship.id)}
                          className="w-full py-1.5 px-3 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                        >
                          {t('rateMentorship')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Mentor Directives & Feedback Notes */}
                <div className="p-4 rounded-lg border border-teal-200 bg-teal-50/50 space-y-2 text-xs">
                  <span className="font-bold text-teal-950 block">
                    {t('feedbackNotes')}:
                  </span>
                  {currentMentorship.feedbackNotes && currentMentorship.feedbackNotes.length > 0 ? (
                    <ul className="space-y-2">
                      {currentMentorship.feedbackNotes.map((note, idx) => (
                        <li key={idx} className="p-2 rounded bg-white border border-teal-100 text-slate-800 leading-snug">
                          {note}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic">
                      No feedback notes added by mentor yet. Send an update in the thread below.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Async Message Thread (7 cols) */}
              <div className="lg:col-span-7 border border-slate-200 rounded-lg flex flex-col h-96 overflow-hidden">
                <div className="p-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Asynchronous Advisory Thread</span>
                  <span className="text-[10px] text-slate-500 font-normal">No video calling required</span>
                </div>

                {/* Message Log */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs bg-slate-50/40">
                  {messages.length === 0 ? (
                    <p className="text-center text-slate-400 italic py-8">
                      No messages exchanged yet. Send a question or progress update below.
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-lg leading-relaxed ${
                              isMe
                                ? 'bg-teal-700 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-2xs'
                            }`}
                          >
                            <p className="text-[10px] font-bold opacity-80 mb-0.5">
                              {msg.senderName} ({msg.senderRole})
                            </p>
                            <p>{msg.text}</p>
                            <span className="text-[9px] opacity-70 block text-right mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Real-Time Typing Indicator */}
                {typingUser && (
                  <div className="px-3 py-1 text-[11px] text-teal-700 italic bg-teal-50/60 border-t border-teal-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                    <span>{typingUser} is typing...</span>
                  </div>
                )}

                {/* Connection Status Bar */}
                <div className="px-3 py-1 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Connection Status:</span>
                  {isOnline && isSocketConnected ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Live WebSocket
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      Disconnected (Offline)
                    </span>
                  )}
                </div>

                {/* Message Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={handleReplyChange}
                    disabled={!isOnline}
                    placeholder={!isOnline ? "Chat is disabled while offline..." : "Type progress update or question for mentor..."}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!isOnline || !replyText.trim()}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
                {!isOnline && (
                  <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-200/50 text-[11px] text-amber-800">
                    Live chat is paused while offline. Messages are not queued to avoid stale or duplicated transmissions.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MENTOR DIRECTORY */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Verified Mentor Directory
            </h2>
            <p className="text-xs text-slate-500">
              Senior statisticians, public sector leaders, and chief technologists
            </p>
          </div>

          {/* Directory Filters */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-700"
            >
              <option value="All">All Languages</option>
              {uniqueLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white transition-all shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {mentor.name[0]}
                  </div>
                  {mentor.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                      <span>Verified ({mentor.verifiedDate.split('-')[0]})</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {mentor.name}
                  </h3>
                  <p className="text-[11px] text-teal-800 font-semibold mt-0.5">
                    {mentor.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{mentor.organisation}</p>
                </div>

                <div className="text-xs space-y-1 text-slate-600 pt-1 border-t border-slate-200/80">
                  <p className="text-[11px]">
                    <strong>Specialization: </strong>
                    {mentor.field}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Experience: {mentor.experienceYears} Years • Languages: {mentor.languages.join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Availability: {mentor.availability}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{mentor.rating} ({mentor.totalReviews} reviews)</span>
                </div>

                <button
                  onClick={() => setSelectedMentor(mentor)}
                  className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors"
                >
                  {t('requestMentorship')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REQUEST MENTORSHIP MODAL */}
      {selectedMentor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Request Mentorship with {selectedMentor.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedMentor.title}</p>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  State Your Learning Goal & Question for the Mentor
                </label>
                <textarea
                  rows={4}
                  required
                  value={requestGoal}
                  onChange={(e) => setRequestGoal(e.target.value)}
                  placeholder="e.g. I am seeking advice on mastering survey variance estimation and preparing for MoSPI research fellowship interviews..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                Upon submission, {selectedMentor.name} will review your read-only competency profile, latest assessment scores, and proposed goal to propose an advisory schedule.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-md font-bold"
                >
                  Transmit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      {ratingMentorshipId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900">
              Rate Your Mentorship Experience
            </h3>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRatingScore(st)}
                      className="p-1 text-amber-500"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          st <= ratingScore ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Optional Feedback Comment
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share how the mentor guided your competency progression..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRatingMentorshipId(null)}
                  className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-teal-700 text-white font-bold"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
