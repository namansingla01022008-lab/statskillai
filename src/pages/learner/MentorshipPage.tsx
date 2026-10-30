import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { ApiService } from '../../services/apiService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Mentor, Mentorship, DirectMessage, MentorshipSessionBooking, MentorshipFeedbackRecord } from '../../types';
import { MentorProfileModal } from '../../components/mentorship/MentorProfileModal';
import { BookingFlowModal } from '../../components/mentorship/BookingFlowModal';
import { MentorFeedbackModal } from '../../components/mentorship/MentorFeedbackModal';
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
  Calendar,
  Sparkles,
  ArrowRight,
  Video,
  CreditCard,
  Search,
  ExternalLink,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const MentorshipPage: React.FC = () => {
  const { currentUser, activeProfile, t, refreshScores } = useApp();
  const { isOnline } = useNetworkStatus();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Tab State: 'discover' | 'my-sessions' | 'threads'
  const [activeTab, setActiveTab] = useState<'discover' | 'my-sessions' | 'threads'>('discover');

  // Mentors List
  const [mentors, setMentors] = useState<Mentor[]>(() => StorageService.getMentors());

  // Live Session Bookings
  const [sessionBookings, setSessionBookings] = useState<MentorshipSessionBooking[]>(() =>
    StorageService.getLearnerSessionBookings(currentUser.id)
  );

  // Async Mentorships (legacy threads)
  const [mentorships, setMentorships] = useState<Mentorship[]>(() =>
    StorageService.getLearnerMentorships(currentUser.id)
  );
  const [activeMentorshipId, setActiveMentorshipId] = useState<string | null>(
    mentorships.length > 0 ? mentorships[0].id : null
  );

  // Filters for mentor directory
  const querySkill = searchParams.get('skill') || '';
  const [filterSkill, setFilterSkill] = useState<string>(querySkill ? 'DSA' : 'All');
  const [filterRating, setFilterRating] = useState<string>('All');
  const [filterExperience, setFilterExperience] = useState<string>('All');
  const [filterPrice, setFilterPrice] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>(querySkill || '');

  // Modals State
  const [profileModalMentor, setProfileModalMentor] = useState<Mentor | null>(null);
  const [bookingModalMentor, setBookingModalMentor] = useState<Mentor | null>(null);
  const [bookingInitialTopic, setBookingInitialTopic] = useState<string | undefined>(querySkill || undefined);

  // Feedback Modal State
  const [viewFeedbackSession, setViewFeedbackSession] = useState<{
    session: MentorshipSessionBooking;
    feedback: MentorshipFeedbackRecord;
  } | null>(null);

  // Async Request Modal
  const [asyncRequestMentor, setAsyncRequestMentor] = useState<Mentor | null>(null);
  const [requestGoal, setRequestGoal] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Async Direct Messaging State
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const currentMentorship = mentorships.find((m) => m.id === activeMentorshipId);

  // Fetch updated sessions on mount
  useEffect(() => {
    ApiService.getMySessionBookings(currentUser.id)
      .then((b) => {
        if (b && b.length > 0) setSessionBookings(b);
      })
      .catch(() => {});
  }, [currentUser.id]);

  // Synchronize messages & subscribe to Socket.io room for async thread
  useEffect(() => {
    if (!currentMentorship) {
      setMessages([]);
      return;
    }

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

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.emit('leave_mentorship', currentMentorship.id);
        socket.off('new_message', handleNewMessage);
      };
    } catch (err) {
      console.warn('Socket connection deferred in MentorshipPage:', err);
    }
  }, [currentMentorship?.id, currentUser.id]);

  // Filter logic
  const filteredMentors = mentors.filter((m) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchField = m.field.toLowerCase().includes(q);
      const matchOrg = m.organisation.toLowerCase().includes(q);
      const matchExp = m.expertise?.some((e) => e.toLowerCase().includes(q));
      if (!matchName && !matchField && !matchOrg && !matchExp) return false;
    }

    // Skill category filter
    if (filterSkill !== 'All') {
      const q = filterSkill.toLowerCase();
      const matchField = m.field.toLowerCase().includes(q);
      const matchExp = m.expertise?.some((e) => e.toLowerCase().includes(q));
      if (!matchField && !matchExp) return false;
    }

    // Rating filter
    if (filterRating === '4.8+' && m.rating < 4.8) return false;
    if (filterRating === '4.5+' && m.rating < 4.5) return false;

    // Experience filter
    if (filterExperience === '3+' && m.experienceYears < 3) return false;
    if (filterExperience === '5+' && m.experienceYears < 5) return false;
    if (filterExperience === '10+' && m.experienceYears < 10) return false;

    // Price filter
    const price = m.price || 10;
    if (filterPrice === '₹5' && price !== 5) return false;
    if (filterPrice === '₹8' && price !== 8) return false;
    if (filterPrice === '₹10' && price !== 10) return false;
    if (filterPrice === '₹15' && price !== 15) return false;

    return true;
  });

  // Handle successful session booking
  const handleBookingSuccess = (newBooking: MentorshipSessionBooking) => {
    setSessionBookings((prev) => [newBooking, ...prev.filter((b) => b.id !== newBooking.id)]);
    setSuccessBanner(
      `Live session confirmed with ${newBooking.mentorName} for ${newBooking.date} at ${newBooking.timeSlot} (Meeting ID: ${newBooking.meetingId})`
    );
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  // Open feedback modal for a completed session
  const handleOpenFeedback = (booking: MentorshipSessionBooking) => {
    let fb = StorageService.getSessionFeedback(booking.sessionId);
    if (!fb) {
      fb = {
        id: `fb-${booking.sessionId}`,
        bookingId: booking.id,
        sessionId: booking.sessionId,
        mentorId: booking.mentorId,
        studentId: booking.studentId,
        studentUnderstanding: 'Sound algorithmic comprehension with strong problem-solving dedication.',
        strengths: ['Clear recursive logic', 'Attentive code reviewer', 'Good complexity awareness'],
        weaknesses: ['Corner case validation on empty subtrees'],
        recommendedTopics: ['Balanced Trees', 'Graph Traversals'],
        nextTasks: ['Solve 5 tree problems', 'Revise recursion stacks'],
        personalMessage: 'You made tremendous progress in this 45-minute live session. Keep up the high standard!',
        skillBoostPoints: 5,
        skillBoostDomain: booking.skillDomain,
        previousScore: 62,
        updatedScore: 67,
        createdAt: new Date().toISOString(),
      };
      StorageService.saveSessionFeedback(fb);
    }
    setViewFeedbackSession({ session: booking, feedback: fb });
  };

  // Handle Send Direct Message in legacy async thread
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMentorship || !replyText.trim()) return;

    const textToSend = replyText.trim();
    setReplyText('');

    try {
      const serverMsg = await ApiService.sendMessage(currentMentorship.id, textToSend);
      setMessages((prev) => [...prev, serverMsg]);
      StorageService.sendMessage(serverMsg);
    } catch {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner with Concept Tagline */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 border border-teal-500/30 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 bg-teal-900/60 border border-teal-400/40 px-2.5 py-0.5 rounded-full">
                Mentor Connect • Live 1-on-1 Sessions
              </span>
              <span className="text-xs text-teal-300/90 font-semibold">
                Live 1-on-1 Mentorship (₹5 – ₹15 / 5 minutes)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Human Mentorship & Skill Verification
            </h1>

            <p className="text-xs sm:text-sm text-teal-200/90 italic font-medium">
              “AI tells you what to improve. Human mentors show you how to improve. StatSkillAI tracks your growth.”
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveTab('discover');
                setFilterSkill('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-transform hover:scale-105 shadow-sm flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Browse All Mentors</span>
            </button>
          </div>
        </div>
      </div>

      {successBanner && (
        <NoticeBanner type="success" title="Success">
          {successBanner}
        </NoticeBanner>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'discover'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Find a Mentor ({filteredMentors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my-sessions')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 relative ${
            activeTab === 'my-sessions'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>My Mentorships ({sessionBookings.length})</span>
          {sessionBookings.some((b) => b.sessionStatus === 'Upcoming' || b.sessionStatus === 'Live') && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('threads')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'threads'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Advisory Message Threads ({mentorships.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MENTOR DISCOVERY
          ========================================================================= */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by mentor name, skill (C++, Python, DSA, Web Dev), or topic..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Clear filters if set */}
              {(filterSkill !== 'All' || filterRating !== 'All' || filterPrice !== 'All' || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterSkill('All');
                    setFilterRating('All');
                    setFilterExperience('All');
                    setFilterPrice('All');
                    setSearchQuery('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Skill Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Domain / Skill</label>
                <select
                  value={filterSkill}
                  onChange={(e) => setFilterSkill(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  <option value="All">All Disciplines</option>
                  <option value="DSA">C++ / DSA</option>
                  <option value="Python">Python / AI/ML</option>
                  <option value="Web">Web Development</option>
                  <option value="Cyber">Cybersecurity</option>
                  <option value="Competitive">Competitive Coding</option>
                  <option value="Stat">Survey & Statistics</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Minimum Rating</label>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  <option value="All">Any Rating</option>
                  <option value="4.8+">★ 4.8 & Above</option>
                  <option value="4.5+">★ 4.5 & Above</option>
                </select>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Experience</label>
                <select
                  value={filterExperience}
                  onChange={(e) => setFilterExperience(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  <option value="All">Any Experience</option>
                  <option value="3+">3+ Years</option>
                  <option value="5+">5+ Years</option>
                  <option value="10+">10+ Years</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Session Price</label>
                <select
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  <option value="All">All Rates</option>
                  <option value="₹5">₹5 / 5 minutes</option>
                  <option value="₹8">₹8 / 5 minutes</option>
                  <option value="₹10">₹10 / 5 minutes</option>
                  <option value="₹15">₹15 / 5 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mentors Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMentors.map((mentor) => {
              const price = mentor.price || 10;
              const expertise = mentor.expertise || [mentor.field];

              return (
                <div
                  key={mentor.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar + Verification + Price */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-teal-700 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                          {mentor.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-slate-900 leading-tight">
                              {mentor.name}
                            </h3>
                          </div>
                          <p className="text-[11px] text-teal-800 font-semibold mt-0.5">
                            {mentor.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{mentor.organisation}</p>
                        </div>
                      </div>

                      {/* Prominent Price Tag */}
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-xs shrink-0">
                        ₹{price} / 5 mins
                      </span>
                    </div>

                    {/* Verification & Metrics */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{mentor.rating}</span>
                        <span className="text-slate-400 font-normal">({mentor.totalReviews})</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        {mentor.totalSessions || 120}+ Sessions Done
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {mentor.experienceYears}y exp
                      </span>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {mentor.bio}
                    </p>

                    {/* Skills Badges */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {expertise.slice(0, 3).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                        >
                          {sk}
                        </span>
                      ))}
                      {expertise.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px]">
                          +{expertise.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Availability line */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{mentor.availability}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setProfileModalMentor(mentor)}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setBookingModalMentor(mentor);
                        setBookingInitialTopic(querySkill || undefined);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-black text-xs transition-transform hover:scale-[1.02] shadow-xs flex items-center justify-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Book – ₹{price} / 5 mins</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: STUDENT MENTORSHIP DASHBOARD ("MY MENTORSHIPS")
          ========================================================================= */}
      {activeTab === 'my-sessions' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-teal-700" />
                <span>My Mentorship Sessions ({sessionBookings.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Live 1-on-1 consultations, meeting access, and feedback reports
              </p>
            </div>

            <button
              onClick={() => setActiveTab('discover')}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs"
            >
              + Book Another Session
            </button>
          </div>

          {sessionBookings.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Video className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                You have not booked any live human mentorship sessions yet.
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-5 py-2.5 bg-teal-700 text-white font-bold text-xs rounded-lg"
              >
                Find a Mentor (from ₹5 / 5 mins)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            b.sessionStatus === 'Upcoming' || b.sessionStatus === 'Live'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : b.sessionStatus === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {b.sessionStatus === 'Upcoming' || b.sessionStatus === 'Live' ? '🔴 LIVE / Ready' : b.sessionStatus}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">ID: {b.meetingId}</span>
                      </div>

                       <h3 className="text-sm font-black text-slate-900">{b.topic}</h3>
                      <p className="text-xs text-slate-600">
                        Mentor: <strong>{b.mentorName}</strong> ({b.mentorTitle || 'Specialist'})
                      </p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                        <span>📅 {b.date}</span>
                        <span>⏰ {b.timeSlot}</span>
                        <span>⏱ 5 Mins Live</span>
                        <span>💰 Paid ₹{b.price} / 5 mins</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0">
                      {b.sessionStatus === 'Upcoming' || b.sessionStatus === 'Live' ? (
                        <a
                          href={`#/mentorship/session/${b.sessionId}`}
                          className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs inline-flex items-center gap-2 shadow-md transition-transform hover:scale-105"
                        >
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span>Join Live Session</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      ) : b.sessionStatus === 'Completed' ? (
                        <button
                          onClick={() => handleOpenFeedback(b)}
                          className="px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                          <span>View Feedback & Skill Progress</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Cancelled</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: ASYNC ADVISORY THREADS (PRESERVED)
          ========================================================================= */}
      {activeTab === 'threads' && (
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-700" />
                <span>Asynchronous Messaging Threads ({mentorships.length})</span>
              </h2>
              <p className="text-xs text-slate-500">
                Text-based mentorship inquiries, syllabus advice, and mentor directives
              </p>
            </div>

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

          {currentMentorship ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 text-sm block">{currentMentorship.mentorName}</span>
                  <p className="text-slate-600"><strong>Goal: </strong>"{currentMentorship.goalMessage}"</p>
                  <p className="text-slate-500">Schedule: {currentMentorship.meetingSchedule || 'Async thread'}</p>
                </div>

                <div className="p-4 rounded-lg border border-teal-200 bg-teal-50/50 space-y-2 text-xs">
                  <span className="font-bold text-teal-950 block">Mentor Feedback Directives:</span>
                  {currentMentorship.feedbackNotes && currentMentorship.feedbackNotes.length > 0 ? (
                    <ul className="space-y-1.5">
                      {currentMentorship.feedbackNotes.map((note, idx) => (
                        <li key={idx} className="p-2 rounded bg-white border border-teal-100 text-slate-800 leading-snug">
                          {note}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">No notes yet.</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 border border-slate-200 rounded-lg flex flex-col h-96 overflow-hidden">
                <div className="p-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-800">
                  Direct Messages with {currentMentorship.mentorName}
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs bg-slate-50/40">
                  {messages.length === 0 ? (
                    <p className="text-center text-slate-400 italic py-8">No messages yet.</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-2.5 rounded-lg text-xs leading-relaxed ${
                            msg.senderId === currentUser.id
                              ? 'bg-teal-700 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-2xs'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <span className="text-[9px] opacity-70 block text-right mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type progress update or question for mentor..."
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-md text-xs font-bold"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-8 text-center">
              No active asynchronous advisory threads found.
            </p>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      {/* 1. MENTOR PROFILE MODAL */}
      {profileModalMentor && (
        <MentorProfileModal
          mentor={profileModalMentor}
          onClose={() => setProfileModalMentor(null)}
          onBookSession={(m) => {
            setProfileModalMentor(null);
            setBookingModalMentor(m);
            setBookingInitialTopic(querySkill || undefined);
          }}
        />
      )}

      {/* 2. 5-STEP BOOKING FLOW MODAL */}
      {bookingModalMentor && (
        <BookingFlowModal
          mentor={bookingModalMentor}
          initialTopic={bookingInitialTopic}
          onClose={() => setBookingModalMentor(null)}
          onBookingSuccess={(booking) => {
            handleBookingSuccess(booking);
          }}
        />
      )}

      {/* 3. POST-SESSION FEEDBACK & SKILL GROWTH MODAL */}
      {viewFeedbackSession && (
        <MentorFeedbackModal
          session={viewFeedbackSession.session}
          feedback={viewFeedbackSession.feedback}
          onClose={() => setViewFeedbackSession(null)}
          onReviewSubmitted={() => {
            setViewFeedbackSession(null);
            refreshScores();
          }}
        />
      )}
    </div>
  );
};
