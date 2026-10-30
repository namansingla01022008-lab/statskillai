import React, { useState } from 'react';
import { Mentor, MentorshipSessionBooking } from '../../types';
import { ApiService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
  Video,
  Check,
} from 'lucide-react';

interface BookingFlowModalProps {
  mentor: Mentor;
  initialTopic?: string;
  onClose: () => void;
  onBookingSuccess: (booking: MentorshipSessionBooking) => void;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  mentor,
  initialTopic,
  onClose,
  onBookingSuccess,
}) => {
  const { currentUser } = useApp();
  const price = mentor.price || 10;

  // 5 Steps: 1: Topic, 2: Date, 3: Slot, 4: Summary, 5: Payment
  const [step, setStep] = useState<number>(1);

  // Form State
  const defaultTopics = [
    'DSA – Binary Trees & Recursive Traversals',
    'DSA – Graphs, BFS, DFS & Shortest Paths',
    'Python – Object-Oriented Design & Clean Code',
    'System Design & Microservices Architecture',
    'Survey Sampling & Variance Estimation',
    'Custom Specific Query',
  ];

  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic || defaultTopics[0]);
  const [customTopic, setCustomTopic] = useState<string>('');

  // Available dates for next 7 days
  const today = new Date();
  const availableDates = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    return {
      dateString: d.toISOString().split('T')[0],
      displayDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0].dateString);

  // Slots
  const mentorSlots = mentor.availableSlots && mentor.availableSlots.length > 0
    ? mentor.availableSlots.map((s) => s.time)
    : ['10:00 AM', '02:00 PM', '06:00 PM', '08:00 PM'];

  const [selectedSlot, setSelectedSlot] = useState<string>(mentorSlots[0]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'demo' | 'upi' | 'card'>('demo');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [bookedSession, setBookedSession] = useState<MentorshipSessionBooking | null>(null);

  const topicToBook = selectedTopic === 'Custom Specific Query' && customTopic.trim()
    ? customTopic.trim()
    : selectedTopic;

  // Handle Payment & Booking Creation
  const handleConfirmAndPay = async () => {
    setIsProcessingPayment(true);

    try {
      // Simulate realistic payment delay
      await new Promise((res) => setTimeout(res, 900));

      const domain = mentor.field.toLowerCase().includes('stat')
        ? 'Statistical'
        : mentor.field.toLowerCase().includes('cyber') || mentor.field.toLowerCase().includes('digital')
        ? 'Digital'
        : mentor.field.toLowerCase().includes('leadership')
        ? 'Behavioural'
        : 'Technical';

      const booking = await ApiService.bookMentorshipSession({
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorTitle: mentor.title,
        skillDomain: domain,
        topic: topicToBook,
        date: selectedDate,
        timeSlot: selectedSlot,
        price,
        studentId: currentUser.id,
        studentName: currentUser.name,
      });

      setBookedSession(booking);
      setIsProcessingPayment(false);
      onBookingSuccess(booking);
    } catch (err) {
      console.error('Booking failed:', err);
      setIsProcessingPayment(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                Live Session Booking
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {bookedSession ? 'Confirmed' : `Step ${step} of 5`}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-1">
              Mentorship with {mentor.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar (if not yet booked) */}
        {!bookedSession && (
          <div className="w-full bg-slate-100 h-1.5">
            <div
              className="bg-teal-600 h-1.5 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Content Area */}
        <div className="p-6">
          {/* SUCCESS SCREEN */}
          {bookedSession ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  Payment Confirmed • ₹{price} / 5 mins Received
                </span>
                <h4 className="text-xl font-black text-slate-900">
                  Session Booked Successfully!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your live 5-minute 1-on-1 mentorship session is locked in with {mentor.name}.
                </p>
              </div>

              {/* Meeting Card */}
              <div className="p-4 rounded-xl bg-slate-900 text-white text-left space-y-3 max-w-md mx-auto shadow-md">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Unique Meeting ID:</span>
                  <span className="font-mono font-black text-teal-300 text-sm">{bookedSession.meetingId}</span>
                </div>
                <div className="text-xs space-y-1 text-slate-300">
                  <p><strong>Topic: </strong>{bookedSession.topic}</p>
                  <p><strong>Date & Time: </strong>{bookedSession.date} at {bookedSession.timeSlot}</p>
                  <p><strong>Duration: </strong>5 Minutes Live (₹{price} / 5 mins)</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <a
                  href={`#/mentorship/session/${bookedSession.sessionId}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                  <span>Join 🔴 LIVE Session Now</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Done (View in Dashboard)
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* STEP 1: SELECT TOPIC */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900">
                      Step 1: Choose Your Mentorship Topic
                    </h4>
                    <p className="text-xs text-slate-500">
                      Select what specific algorithmic problem, concept, or project you want to review.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {defaultTopics.map((topic, idx) => (
                      <label
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-all ${
                          selectedTopic === topic
                            ? 'border-teal-600 bg-teal-50/60 font-bold text-teal-950 ring-1 ring-teal-500'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="topic"
                            value={topic}
                            checked={selectedTopic === topic}
                            onChange={() => setSelectedTopic(topic)}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span>{topic}</span>
                        </div>
                        {selectedTopic === topic && (
                          <Check className="w-4 h-4 text-teal-700" />
                        )}
                      </label>
                    ))}
                  </div>

                  {selectedTopic === 'Custom Specific Query' && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="e.g. Graph Cycle Detection with Disjoint Set Union..."
                        className="w-full px-3 py-2 text-xs border border-teal-400 rounded-lg focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setStep(2)}
                      disabled={selectedTopic === 'Custom Specific Query' && !customTopic.trim()}
                      className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-2"
                    >
                      <span>Next: Select Date</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT DATE */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900">
                      Step 2: Choose Available Date
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pick a day for your 5-minute live one-on-one video session.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {availableDates.map((item) => (
                      <button
                        key={item.dateString}
                        type="button"
                        onClick={() => setSelectedDate(item.dateString)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedDate === item.dateString
                            ? 'border-teal-600 bg-teal-700 text-white font-bold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                        }`}
                      >
                        <span className="block text-[11px] uppercase tracking-wider opacity-80">
                          {item.displayDay}
                        </span>
                        <span className="block text-sm font-black mt-1">
                          {item.displayDate}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Selected Date: <strong>{selectedDate}</strong></span>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs inline-flex items-center gap-2"
                    >
                      <span>Next: Select Time Slot</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SELECT TIME SLOT */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900">
                      Step 3: Select Available Time Slot
                    </h4>
                    <p className="text-xs text-slate-500">
                      All slots are in Indian Standard Time (IST).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {mentorSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                          selectedSlot === slot
                            ? 'border-teal-600 bg-teal-50 text-teal-950 font-black ring-1 ring-teal-500'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3.5 h-3.5 ${selectedSlot === slot ? 'text-teal-700' : 'text-slate-400'}`} />
                          <span>{slot}</span>
                        </div>
                        {selectedSlot === slot && <Check className="w-3.5 h-3.5 text-teal-700" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs inline-flex items-center gap-2"
                    >
                      <span>Next: Review Summary</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: BOOKING SUMMARY */}
              {step === 4 && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900">
                      Step 4: Review Booking Summary
                    </h4>
                    <p className="text-xs text-slate-500">
                      Please confirm the session details before proceeding to payment.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Mentor:</span>
                      <span className="font-bold text-slate-900">{mentor.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Topic:</span>
                      <span className="font-bold text-slate-900 max-w-xs text-right truncate">{topicToBook}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Date & Time:</span>
                      <span className="font-bold text-slate-900">{selectedDate} at {selectedSlot}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Session Duration:</span>
                      <span className="font-bold text-slate-900">5 Minutes (Live 1-to-1 Mentorship Call)</span>
                    </div>
                    <div className="flex justify-between pt-1 text-sm font-black">
                      <span className="text-slate-900">Rate / Price:</span>
                      <span className="text-teal-700 text-base">₹{price} / 5 minutes</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(5)}
                      className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-black text-xs inline-flex items-center gap-2 shadow-xs"
                    >
                      <span>Proceed to Payment – ₹{price} / 5 mins</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: PAYMENT GATEWAY (MOCK) */}
              {step === 5 && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900">
                      Step 5: Payment Confirmation
                    </h4>
                    <p className="text-xs text-slate-500">
                      Time-based Mentorship: ₹{price} for exactly 5 minutes of live guidance.
                    </p>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label
                      onClick={() => setPaymentMethod('demo')}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'demo'
                          ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold">
                          ⚡
                        </div>
                        <div>
                          <span className="font-bold block text-slate-900">
                            1-Click Instant Demo Pay (₹{price} / 5 minutes)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Instant unlock for your 5-minute live session
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'demo'}
                        onChange={() => setPaymentMethod('demo')}
                        className="text-teal-600"
                      />
                    </label>

                    <label
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block text-slate-900">
                            Demo UPI / QR (GPay, PhonePe, Paytm)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Simulated virtual payment address confirmation
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="text-teal-600"
                      />
                    </label>

                    <label
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold block text-slate-900">
                            Demo Card / NetBanking
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Simulated test card ending in 4242
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="text-teal-600"
                      />
                    </label>
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Due</span>
                      <span className="text-lg font-black text-teal-300">₹{price}.00</span>
                      <span className="text-[11px] text-teal-400/90 ml-1">/ 5 minutes</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Encrypted 256-bit Demo SSL</span>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(4)}
                      disabled={isProcessingPayment}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmAndPay}
                      disabled={isProcessingPayment}
                      className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs inline-flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing ₹{price}...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Pay ₹{price} & Confirm 5-Min Session</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
