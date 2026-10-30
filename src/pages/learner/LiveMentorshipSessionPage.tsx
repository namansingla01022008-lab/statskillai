import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { StorageService } from '../../services/storageService';
import { MentorshipSessionBooking, MentorshipFeedbackRecord } from '../../types';
import { MentorFeedbackModal } from '../../components/mentorship/MentorFeedbackModal';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Maximize,
  Minimize,
  MessageSquare,
  Info,
  Send,
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Code,
  Terminal,
} from 'lucide-react';

interface ChatEntry {
  id: string;
  sender: 'student' | 'mentor';
  senderName: string;
  text: string;
  timestamp: string;
}

export const LiveMentorshipSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { currentUser, refreshScores } = useApp();

  const [session, setSession] = useState<MentorshipSessionBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Call Controls
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'info' | 'code'>('chat');

  // Timer: Exactly 5 minutes = 300 seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);

  // Chat Log
  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Student Video Stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [completedFeedback, setCompletedFeedback] = useState<MentorshipFeedbackRecord | null>(null);

  // Load Session
  useEffect(() => {
    if (!sessionId) return;

    async function loadSession() {
      setLoading(true);
      let found = await ApiService.getSessionBooking(sessionId!);
      if (!found) {
        // Fallback default session for direct demonstration
        found = {
          id: `booking-${Date.now()}`,
          sessionId: sessionId!,
          meetingId: `LIVE-DSA-${Math.floor(1000 + Math.random() * 9000)}`,
          studentId: currentUser.id,
          studentName: currentUser.name,
          mentorId: 'mentor-rahul',
          mentorName: 'Rahul Sharma',
          mentorTitle: 'Competitive Programming Specialist & Senior SDE',
          skillDomain: 'Technical',
          topic: 'DSA – Binary Trees & Recursive Traversals',
          date: new Date().toISOString().split('T')[0],
          timeSlot: '06:00 PM',
          durationMinutes: 5,
          price: 10,
          paymentStatus: 'Successful',
          sessionStatus: 'Live',
          createdAt: new Date().toISOString(),
        };
        StorageService.saveSessionBooking(found);
      }
      setSession(found);

      // Initial greeting message from Mentor
      setChatLog([
        {
          id: 'msg-1',
          sender: 'mentor',
          senderName: found.mentorName,
          text: `Namaste ${currentUser.name}! Welcome to our 1-on-1 session. I have your diagnostic test results on "${found.topic}" open. Let's break down recursive tree traversal step-by-step!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      setLoading(false);
    }

    loadSession();
  }, [sessionId, currentUser]);

  // Webcam Setup
  useEffect(() => {
    let localStream: MediaStream | null = null;
    if (isCameraOn && navigator?.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setWebcamActive(true);
        })
        .catch(() => {
          // Graceful fallback to animated avatar feed
          setWebcamActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOn]);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !session) return;

    const studentText = chatInput.trim();
    setChatInput('');

    const newMsg: ChatEntry = {
      id: `chat-${Date.now()}`,
      sender: 'student',
      senderName: currentUser.name,
      text: studentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatLog((prev) => [...prev, newMsg]);

    // Simulated intelligent Mentor reply
    setTimeout(() => {
      let reply = 'Great observation! Notice how in pre-order traversal we process the node before recursing deeper into the left and right subtrees.';
      if (studentText.toLowerCase().includes('base case') || studentText.toLowerCase().includes('recursion')) {
        reply = 'Exactly right. In tree recursion, the base condition is always checking if `root == null`. Without that, you will trigger a stack overflow error!';
      } else if (studentText.toLowerCase().includes('time') || studentText.toLowerCase().includes('complexity')) {
        reply = 'Since we visit each node exactly once, time complexity is O(N). Auxiliary stack space is O(H) where H is the height of the tree.';
      }

      setChatLog((prev) => [
        ...prev,
        {
          id: `chat-reply-${Date.now()}`,
          sender: 'mentor',
          senderName: session.mentorName,
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  // End Call & Complete Session
  const handleEndCall = async () => {
    if (!session) return;

    try {
      const { feedback } = await ApiService.completeLiveSession(session.sessionId, {
        studentUnderstanding: 'High competence in tree traversal logic and recursion mechanics; needs focus on balanced BST rotation cases.',
        strengths: [
          'Solid grasp of base conditions in tree recursion',
          'Good dry-run intuition for depth-first traversals',
          'Clear communication of algorithm constraints',
        ],
        weaknesses: [
          'Edge cases with skewed binary trees',
          'Boundary checking on null left/right child pointers',
        ],
        recommendedTopics: [
          'Binary Tree Traversals (Inorder, Preorder, Postorder)',
          'Breadth-First Search (Level Order Traversal)',
          'Balanced Binary Search Trees (AVL/Red-Black Concepts)',
        ],
        nextTasks: [
          'Solve 5 Binary Tree problems on StatSkillAI',
          'Revise BFS and DFS recursion patterns',
          'Practice calculating maximum tree depth',
        ],
        personalMessage: 'You understand basic recursion well, but need more practice with tree traversal. Keep this momentum and your technical interviews will be seamless!',
        domain: session.skillDomain,
        userId: currentUser.id,
      });

      // Refresh global app scores so dashboard immediately shows boosted skill (+5%)
      await refreshScores();

      setCompletedFeedback(feedback);
      setShowFeedbackModal(true);
    } catch (err) {
      console.error('Failed to end call:', err);
      // Fallback
      const fb = StorageService.getSessionFeedback(session.sessionId);
      if (fb) {
        setCompletedFeedback(fb);
        setShowFeedbackModal(true);
      } else {
        navigate('/mentorship');
      }
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-teal-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-300">Connecting to Live Mentorship Room...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-white flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/50 px-3 py-1 rounded-full text-rose-300 text-xs font-black shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>🔴 LIVE</span>
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-black text-white leading-tight">
              {session.topic}
            </h1>
            <p className="text-[11px] text-teal-400">
              Mentor: <strong>{session.mentorName}</strong> • {session.mentorTitle || 'Specialist'}
            </p>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
              5-Min Live Session
            </span>
            <span className="text-slate-400">Remaining:</span>
            <span className="font-mono font-black text-amber-400 text-sm tracking-widest">
              {formatTimer(secondsRemaining)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded">
            <span className="font-mono text-teal-300 font-bold">{session.meetingId}</span>
          </div>
        </div>
      </div>

      {/* Main Video & Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Column: Dual Video Call Canvas (70% on desktop) */}
        <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between overflow-y-auto bg-slate-950 relative">
          {/* Video Streams Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch min-h-[420px]">
            {/* 1. MENTOR VIDEO FEED */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between shadow-2xl group">
              {/* Top status bar in video */}
              <div className="p-3 bg-gradient-to-b from-slate-950/80 to-transparent flex items-center justify-between z-10">
                <span className="text-xs font-bold text-white bg-slate-950/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {session.mentorName} (Mentor)
                </span>
                <span className="text-[10px] text-teal-300 font-bold bg-teal-950/80 border border-teal-500/30 px-2 py-0.5 rounded">
                  1080p HD • Speaking
                </span>
              </div>

              {/* Realistic Simulated Video / Screen Feed */}
              {isScreenSharing ? (
                <div className="flex-1 p-4 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-hidden flex flex-col justify-center space-y-2">
                  <div className="flex items-center gap-2 text-teal-400 text-xs border-b border-slate-800 pb-2">
                    <Terminal className="w-4 h-4" />
                    <span>Live Code Sandbox – BinaryTree.cpp</span>
                  </div>
                  <pre className="text-teal-300/90 leading-relaxed text-[10px]">
{`// 1-on-1 Mentorship Live Walkthrough
void inorderTraversal(TreeNode* root) {
    if (root == nullptr) return; // Base Case
    inorderTraversal(root->left); // Left
    cout << root->val << " ";    // Root
    inorderTraversal(root->right); // Right
}`}
                  </pre>
                  <div className="text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30">
                    💡 Mentor note: Notice how the call stack mirrors the recursion tree!
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 relative">
                  {/* Video visualizer aura */}
                  <div className="w-28 h-28 rounded-full bg-teal-500/20 flex items-center justify-center ring-4 ring-teal-500/40 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-700 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-2xl">
                      {session.mentorName[0]}
                    </div>
                  </div>

                  <div className="space-y-1 z-10">
                    <p className="font-bold text-sm text-white">{session.mentorName}</p>
                    <p className="text-xs text-slate-400">{session.mentorTitle || 'Verified Mentor Specialist'}</p>
                  </div>

                  {/* Audio Waveform Indicator */}
                  <div className="flex items-center gap-1 pt-2">
                    {[16, 28, 12, 34, 20, 30, 14, 24, 18, 32].map((height, i) => (
                      <span
                        key={i}
                        className="w-1 bg-teal-400 rounded-full animate-pulse"
                        style={{ height: `${height}px`, animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom video overlay */}
              <div className="p-3 bg-gradient-to-t from-slate-950/80 to-transparent flex items-center justify-between text-xs text-slate-400 z-10">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  NEP-2020 Mentor Verified
                </span>
                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-teal-300 font-bold transition-colors flex items-center gap-1"
                >
                  <Code className="w-3 h-3" />
                  <span>{isScreenSharing ? 'Show Mentor Cam' : 'Share IDE Screen'}</span>
                </button>
              </div>
            </div>

            {/* 2. STUDENT VIDEO FEED */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between shadow-2xl">
              {/* Top status bar in student video */}
              <div className="p-3 bg-gradient-to-b from-slate-950/80 to-transparent flex items-center justify-between z-10">
                <span className="text-xs font-bold text-white bg-slate-950/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {currentUser.name} (You)
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded">
                  {isMicOn ? '🎙 Mic Live' : '🔇 Muted'}
                </span>
              </div>

              {/* Student Video Element or Avatar */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover rounded-xl ${
                    isCameraOn && webcamActive ? 'block' : 'hidden'
                  }`}
                />

                {(!isCameraOn || !webcamActive) && (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-24 h-24 rounded-full bg-slate-800 text-teal-400 font-black text-2xl flex items-center justify-center ring-4 ring-slate-700/60 shadow-lg">
                      {currentUser.name[0]}
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="font-bold text-sm text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400">Camera preview inactive</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom video overlay */}
              <div className="p-3 bg-gradient-to-t from-slate-950/80 to-transparent flex items-center justify-between text-xs text-slate-400 z-10">
                <span className="text-[11px] text-slate-300">Target Skill: {session.skillDomain}</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded">
                  Active Participant
                </span>
              </div>
            </div>
          </div>

          {/* CALL CONTROLS DOCK */}
          <div className="mt-4 pt-4 border-t border-slate-900 flex items-center justify-center gap-3 sm:gap-4 shrink-0">
            {/* Mic Toggle */}
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3 sm:p-3.5 rounded-full transition-all ${
                isMicOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-md'
                  : 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/20'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`p-3 sm:p-3.5 rounded-full transition-all ${
                isCameraOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-md'
                  : 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/20'
              }`}
              title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {isCameraOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Screen Share simulation */}
            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`p-3 sm:p-3.5 rounded-full transition-all ${
                isScreenSharing
                  ? 'bg-teal-600 hover:bg-teal-700 text-white ring-4 ring-teal-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Toggle Live Code Sandbox / Screen Share"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-3 sm:p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-all hidden sm:block"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* End Call (Red Button) */}
            <button
              onClick={handleEndCall}
              className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-all ring-4 ring-rose-600/30"
              title="End Live Mentorship Session & Submit Feedback"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Chat & Session Info Panel (30% on desktop) */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 h-80 lg:h-auto">
          {/* Panel Tabs */}
          <div className="p-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat ({chatLog.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'info'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Session Info</span>
            </button>
          </div>

          {/* TAB 1: LIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Message History */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                {chatLog.map((msg) => {
                  const isMe = msg.sender === 'student';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                          isMe
                            ? 'bg-teal-700 text-white rounded-br-none shadow-xs'
                            : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                        }`}
                      >
                        <p className="text-[10px] font-black opacity-80 mb-0.5">
                          {msg.senderName}
                        </p>
                        <p className="text-xs">{msg.text}</p>
                        <span className="text-[9px] opacity-60 block text-right mt-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask mentor a code question..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SESSION INFO */}
          {activeTab === 'info' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 block">
                  Session Credentials
                </span>
                <p><strong>Topic: </strong>{session.topic}</p>
                <p><strong>Domain: </strong>{session.skillDomain}</p>
                <p><strong>Scheduled: </strong>{session.date} at {session.timeSlot}</p>
                <p><strong>Meeting ID: </strong><span className="font-mono text-teal-300">{session.meetingId}</span></p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 block">
                  Mentor Profile
                </span>
                <p className="font-bold text-white text-sm">{session.mentorName}</p>
                <p className="text-[11px] text-slate-400">{session.mentorTitle || 'Verified Mentor Specialist'}</p>
                <p className="text-[11px] text-teal-300 font-bold">Rate: ₹{session.price} / 5 minutes</p>
                <p className="text-[10px] text-slate-500">Duration: Exactly 5 minutes live 1-to-1 session</p>
              </div>

              <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-200 text-[11px] leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 mb-1" />
                Upon ending this call, your mentor will transmit a verified assessment report with recommended tasks, and your competency score will be boosted (+5%).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MENTOR FEEDBACK & SKILL GROWTH MODAL */}
      {showFeedbackModal && completedFeedback && (
        <MentorFeedbackModal
          session={session}
          feedback={completedFeedback}
          onClose={() => {
            setShowFeedbackModal(false);
            navigate('/dashboard');
          }}
          onReviewSubmitted={() => {
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};
