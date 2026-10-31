import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Mentorship, MentorshipSessionBooking, MentorAvailabilitySlot } from '../../types';
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Star,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  Video,
  ShieldCheck,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { NoticeBanner } from '../../components/common/NoticeBanner';

export const MentorDashboard: React.FC = () => {
  const { currentUser } = useApp();
  const { isOnline } = useNetworkStatus();

  // Find mentor profile
  const mentors = StorageService.getMentors();
  const myMentorProfile = mentors.find(
    (m) => m.userId === currentUser.id || m.name.toLowerCase() === currentUser.name.toLowerCase()
  ) || mentors[0]; // fallback to primary mentor if logged in as generic mentor

  // Mentorship Bookings State
  const [sessionBookings, setSessionBookings] = useState<MentorshipSessionBooking[]>(() =>
    StorageService.getMentorSessionBookings(myMentorProfile.id)
  );

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Async Requests
  const [mentorships, setMentorships] = useState<Mentorship[]>(() =>
    StorageService.getMentorMentorships(currentUser.id)
  );

  // Availability Slots
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>(
    myMentorProfile.availableSlots && myMentorProfile.availableSlots.length > 0
      ? myMentorProfile.availableSlots
      : [
          { id: 'slot-1', dayOfWeek: 'Monday', time: '10:00 AM' },
          { id: 'slot-2', dayOfWeek: 'Monday', time: '02:00 PM' },
          { id: 'slot-3', dayOfWeek: 'Monday', time: '06:00 PM' },
          { id: 'slot-4', dayOfWeek: 'Tuesday', time: '11:00 AM' },
          { id: 'slot-5', dayOfWeek: 'Tuesday', time: '05:00 PM' },
        ]
  );

  // New slot inputs
  const [newDay, setNewDay] = useState<string>('Monday');
  const [newTime, setNewTime] = useState<string>('10:00 AM');

  const [notice, setNotice] = useState<string | null>(null);

  // 1. Fetch Remote Sessions Function
  const refreshSessions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const remoteBookings = await ApiService.getMySessionBookings(currentUser.id);
      if (remoteBookings && Array.isArray(remoteBookings) && remoteBookings.length > 0) {
        setSessionBookings(remoteBookings);
        remoteBookings.forEach((b) => StorageService.saveSessionBooking(b));
      } else {
        const local = StorageService.getMentorSessionBookings(myMentorProfile.id);
        if (local.length > 0) {
          setSessionBookings(local);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote sessions:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser.id, myMentorProfile.id]);

  // Initial load on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // 2. Real-Time Socket Listener for Instant Live Updates
  useEffect(() => {
    const socket = ApiService.getSocket();

    const handleNewBooking = (payload: any) => {
      const booking: MentorshipSessionBooking | undefined =
        payload?.booking || payload?.data?.booking || (payload?.id ? payload : undefined);

      if (!booking || !booking.id) return;

      const isForMe =
        booking.mentorId === myMentorProfile.id ||
        booking.mentorId === currentUser.id ||
        booking.mentorName?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(booking.mentorName?.toLowerCase() || '') ||
        currentUser.role === 'mentor';

      if (isForMe) {
        setSessionBookings((prev) => {
          const exists = prev.some((b) => b.id === booking.id || b.sessionId === booking.sessionId);
          if (exists) {
            return prev.map((b) => (b.id === booking.id || b.sessionId === booking.sessionId ? booking : b));
          }
          return [booking, ...prev];
        });
        StorageService.saveSessionBooking(booking);
        setNotice(
          `🔴 New Live Session Booked! ${booking.studentName} scheduled "${booking.topic}" for ${booking.date} at ${booking.timeSlot}.`
        );
      }
    };

    socket.on('mentor_session_booked', handleNewBooking);
    socket.on('user_notification', (notif: any) => {
      if (notif.type === 'NEW_SESSION_BOOKING') {
        handleNewBooking(notif);
      }
    });

    return () => {
      socket.off('mentor_session_booked', handleNewBooking);
      socket.off('user_notification', handleNewBooking);
    };
  }, [currentUser, myMentorProfile]);

  // Metrics
  const totalSessionsCompleted = myMentorProfile.totalSessions || 127;
  const upcomingCount = sessionBookings.filter(
    (b) => b.sessionStatus === 'Upcoming' || b.sessionStatus === 'Live'
  ).length;
  const completedCount = sessionBookings.filter((b) => b.sessionStatus === 'Completed').length;
  const totalStudents = totalSessionsCompleted + 12;
  const averageRating = myMentorProfile.rating || 4.8;
  const price = myMentorProfile.price || 10;
  const demoRevenue = totalSessionsCompleted * price;

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDay || !newTime) return;

    const newSlot: MentorAvailabilitySlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: newDay,
      time: newTime,
    };

    const updated = [...slots, newSlot];
    setSlots(updated);
    StorageService.updateMentorAvailability(myMentorProfile.id, updated);
    setNotice(`Added availability slot: ${newDay} at ${newTime}`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleRemoveSlot = (slotId: string) => {
    const updated = slots.filter((s) => s.id !== slotId);
    setSlots(updated);
    StorageService.updateMentorAvailability(myMentorProfile.id, updated);
    setNotice('Availability slot removed.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleUpdateStatus = (mentorshipId: string, status: Mentorship['status']) => {
    if (!isOnline) {
      setNotice('Mentor actions are disabled while offline.');
      setTimeout(() => setNotice(null), 4000);
      return;
    }
    const item = mentorships.find((m) => m.id === mentorshipId);
    if (!item) return;

    item.status = status;
    StorageService.saveMentorship(item);
    setMentorships([...mentorships]);
    setNotice(`Mentorship status updated to ${status}.`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {!isOnline && (
        <NoticeBanner type="warning" title="Mentor Actions Disabled Offline">
          You are currently in offline mode. Reviewing cached mentee profiles is permitted, but updating live slots or statuses requires an active connection.
        </NoticeBanner>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded">
              Verified Mentor Workspace
            </span>
            <span className="text-xs text-slate-500">
              {myMentorProfile.name} • {myMentorProfile.title}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Mentor Command & Availability Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Manage upcoming live video sessions, student feedback reports, slot schedules, and earnings.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-800 text-xs shadow-xs">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Accredited NEP Mentor</span>
        </div>
      </div>

      {notice && (
        <NoticeBanner type="success" title="Real-Time Update">
          {notice}
        </NoticeBanner>
      )}

      {/* OVERVIEW KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {totalStudents}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold mt-2">Direct 1-on-1 Mentees</span>
        </div>

        {/* Total Sessions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sessions</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {totalSessionsCompleted}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-2">{completedCount} Logged in Portal</span>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Sessions</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
            {upcomingCount}
          </div>
          <span className="text-[11px] text-rose-700 font-semibold mt-2">Ready to Conduct</span>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-2 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{averageRating}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Based on {myMentorProfile.totalReviews || 89} reviews</span>
        </div>

        {/* Demo Revenue / Earnings */}
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Demo Revenue</span>
          <div className="text-2xl sm:text-3xl font-black text-teal-300 mt-2">
            ₹{demoRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-teal-300 font-bold mt-2">₹{price} / 5 minutes rate</span>
        </div>
      </div>

      {/* UPCOMING LIVE SESSIONS SECTION */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-teal-700" />
              <span>Upcoming Live Sessions ({upcomingCount})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Students scheduled for 5-minute live one-to-one mentorship calls
            </p>
          </div>

          {/* Real-Time Sync Indicator & Refresh Action */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </span>
            <button
              onClick={() => refreshSessions()}
              disabled={isRefreshing}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Refresh sessions from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {sessionBookings.filter((b) => b.sessionStatus === 'Upcoming' || b.sessionStatus === 'Live').length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            No upcoming sessions booked currently. When a student reserves a slot, it will appear here instantly.
          </div>
        ) : (
          <div className="space-y-3">
            {sessionBookings
              .filter((b) => b.sessionStatus === 'Upcoming' || b.sessionStatus === 'Live')
              .map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                        🔴 READY
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{b.studentName}</h3>
                      <span className="text-[11px] font-mono text-slate-500">({b.meetingId})</span>
                    </div>

                    <p className="text-xs text-slate-700 font-semibold">{b.topic}</p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                      <span>📅 {b.date}</span>
                      <span>⏰ {b.timeSlot}</span>
                      <span>⏱ 5 Mins Live</span>
                      <span className="font-bold text-emerald-700">₹{b.price} / 5 mins Paid</span>
                    </div>
                  </div>

                  <a
                    href={`#/mentorship/session/${b.sessionId}`}
                    className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-black text-xs inline-flex items-center gap-2 shadow-md transition-transform hover:scale-105"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Session (Conduct Live Call)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* AVAILABILITY SLOT MANAGER */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-700" />
            <span>Weekly Availability Slot Manager</span>
          </h2>
          <p className="text-xs text-slate-500">
            Add or remove available time slots for students to book 5-minute sessions
          </p>
        </div>

        {/* Add Slot Form */}
        <form onSubmit={handleAddSlot} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Day of Week</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold bg-white"
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Time Slot (IST)</label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-semibold bg-white"
            >
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="04:00 PM">04:00 PM</option>
              <option value="05:00 PM">05:00 PM</option>
              <option value="06:00 PM">06:00 PM</option>
              <option value="07:00 PM">07:00 PM</option>
              <option value="08:00 PM">08:00 PM</option>
            </select>
          </div>

          <div className="self-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Slot</span>
            </button>
          </div>
        </form>

        {/* Existing Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          {slots.map((s) => (
            <div
              key={s.id}
              className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs hover:border-teal-300 transition-colors"
            >
              <div>
                <span className="font-bold block text-slate-900">{s.dayOfWeek}</span>
                <span className="text-[11px] font-semibold text-teal-800">{s.time}</span>
              </div>
              <button
                onClick={() => handleRemoveSlot(s.id)}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove slot"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ASYNC ADVISORY REQUESTS */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
          Asynchronous Mentorship Inquiries & Directives ({mentorships.length})
        </h2>

        {mentorships.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic text-xs">
            No asynchronous advisory threads currently assigned.
          </div>
        ) : (
          <div className="space-y-3">
            {mentorships.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{m.learnerName}</span>
                    <span className="text-[10px] text-teal-800 bg-teal-100 px-2 py-0.5 rounded ml-2">
                      {m.learnerProfileType}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Status: {m.status}
                  </span>
                </div>
                <p className="text-slate-600 italic">"{m.goalMessage}"</p>
                <div className="flex justify-end gap-2 pt-1">
                  <a
                    href={`#/mentor/mentee/${m.learnerId}`}
                    className="px-3 py-1.5 rounded bg-slate-900 text-white font-bold text-xs inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Learner Profile</span>
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
