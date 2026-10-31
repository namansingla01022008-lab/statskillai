import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Code,
  Terminal,
  Radio,
  Wifi,
  Check,
} from 'lucide-react';

interface ChatEntry {
  id: string;
  sender: 'student' | 'mentor' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const LiveMentorshipSessionPage: React.FC = () => {
  const { sessionId: routeSessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { currentUser, refreshScores } = useApp();

  const [session, setSession] = useState<MentorshipSessionBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Call Controls
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'info'>('chat');

  // Timer: 5 minutes = 300 seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);

  // Chat Log
  const [chatLog, setChatLog] = useState<ChatEntry[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Video Streams
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);

  // WebRTC Peer Connection & Remote Status
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const [isRemoteConnected, setIsRemoteConnected] = useState<boolean>(false);
  const [isPeerInRoom, setIsPeerInRoom] = useState<boolean>(false);
  const [remotePeerSocketId, setRemotePeerSocketId] = useState<string | null>(null);
  const [remotePeerName, setRemotePeerName] = useState<string>('');
  const [socketConnected, setSocketConnected] = useState<boolean>(false);

  const [codeSnippet, setCodeSnippet] = useState<string>(
`// 1-on-1 Mentorship Live Walkthrough
void inorderTraversal(TreeNode* root) {
    if (root == nullptr) return; // Base Case
    inorderTraversal(root->left);  // Traverse Left Subtree
    cout << root->val << " ";     // Process Current Node
    inorderTraversal(root->right); // Traverse Right Subtree
}`
  );

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [completedFeedback, setCompletedFeedback] = useState<MentorshipFeedbackRecord | null>(null);

  // Determine participant roles
  const isMentor = Boolean(
    currentUser.role === 'mentor' ||
    (session && (
      currentUser.id === session.mentorId ||
      currentUser.name.toLowerCase().includes(session.mentorName.toLowerCase()) ||
      session.mentorName.toLowerCase().includes(currentUser.name.toLowerCase())
    ))
  );

  const myName = currentUser.name;
  const myRoleLabel = isMentor ? 'Mentor' : 'Student';

  const remoteName = remotePeerName || (session ? (isMentor ? session.studentName : session.mentorName) : 'Participant');
  const remoteRoleLabel = isMentor ? 'Student / Mentee' : 'Mentor Specialist';
  const remoteTitle = session
    ? (isMentor ? 'Diagnostic Mentee' : (session.mentorTitle || 'Verified Mentor Specialist'))
    : '';

  // 1. Load Session Details
  useEffect(() => {
    if (!routeSessionId) return;

    async function loadSession() {
      setLoading(true);
      let found = await ApiService.getSessionBooking(routeSessionId!);
      if (!found) {
        found = StorageService.getSessionBooking(routeSessionId!);
      }

      if (!found) {
        // Fallback demo session
        found = {
          id: `booking-${Date.now()}`,
          sessionId: routeSessionId!,
          meetingId: `LIVE-STAT-7209`,
          studentId: currentUser.id,
          studentName: currentUser.role === 'mentor' ? 'Learner Student' : currentUser.name,
          mentorId: 'mentor-1',
          mentorName: currentUser.role === 'mentor' ? currentUser.name : 'Dr. Anita Rao',
          mentorTitle: 'Senior Principal Statistician & NEP Educational Advisor',
          skillDomain: 'Digital',
          topic: 'DSA – Binary Trees & Recursive Traversals',
          date: new Date().toISOString().split('T')[0],
          timeSlot: '10:00 AM',
          durationMinutes: 5,
          price: 10,
          paymentStatus: 'Successful',
          sessionStatus: 'Live',
          createdAt: new Date().toISOString(),
        };
        StorageService.saveSessionBooking(found);
      }

      setSession(found);

      const userIsMentor = currentUser.role === 'mentor' ||
        currentUser.id === found.mentorId ||
        currentUser.name.toLowerCase().includes(found.mentorName.toLowerCase());

      const welcomeMsg: ChatEntry = {
        id: 'msg-welcome',
        sender: 'system',
        senderName: 'System Notice',
        text: userIsMentor
          ? `Namaste ${currentUser.name}! You are conducting this live session with ${found.studentName} on "${found.topic}".`
          : `Namaste ${currentUser.name}! Welcome to your 1-on-1 session with ${found.mentorName} on "${found.topic}".`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatLog([welcomeMsg]);
      setLoading(false);
    }

    loadSession();
  }, [routeSessionId, currentUser]);

  // 2. Initialize Local Camera & Microphone
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startLocalMedia() {
      if (!navigator?.mediaDevices?.getUserMedia) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        setWebcamActive(true);

        // Attach tracks to existing peer connection if active
        if (pcRef.current) {
          stream.getTracks().forEach((track) => {
            const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            } else {
              pcRef.current?.addTrack(track, stream!);
            }
          });
        }
      } catch (err) {
        console.warn('[WebRTC] Local media access not granted or unavailable:', err);
        setWebcamActive(false);
      }
    }

    startLocalMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 3. Toggle Local Audio / Video Tracks
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });
    }
  }, [isCameraOn]);

  // 4. WebRTC Peer Connection Factory
  const createPeerConnection = useCallback((targetSocketId: string) => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    iceCandidatesQueue.current = [];

    // Attach local media tracks if ready, otherwise add transceivers
    if (localStreamRef.current && localStreamRef.current.getTracks().length > 0) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    } else {
      pc.addTransceiver('video', { direction: 'sendrecv' });
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    }

    // When remote track arrives from peer
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.streams);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
      setIsRemoteConnected(true);
      setIsPeerInRoom(true);
    };

    // When local ICE candidate is gathered, send to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && session) {
        const socket = ApiService.getSocket();
        socket.emit('live_session_signal', {
          targetSocketId,
          signal: { type: 'candidate', candidate: event.candidate },
          sessionId: session.sessionId,
          meetingId: session.meetingId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state changed:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsRemoteConnected(true);
        setIsPeerInRoom(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setIsRemoteConnected(false);
      }
    };

    return pc;
  }, [session]);

  // Helper to drain queued ICE candidates after remote description is set
  const drainIceCandidates = async (pc: RTCPeerConnection) => {
    while (iceCandidatesQueue.current.length > 0) {
      const cand = iceCandidatesQueue.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (err) {
          console.warn('[WebRTC] Candidate error during drain:', err);
        }
      }
    }
  };

  // 5. Socket.io Signaling & Real-Time Presence Lifecycle
  useEffect(() => {
    if (!session) return;

    const socket = ApiService.getSocket();
    setSocketConnected(socket.connected);

    // Join all session alias keys
    const emitJoin = () => {
      socket.emit('join_live_session', {
        sessionId: session.sessionId,
        meetingId: session.meetingId,
        bookingId: session.id,
        name: myName,
        role: isMentor ? 'mentor' : 'learner',
      });
      setSocketConnected(true);
    };

    emitJoin();

    // Re-join automatically if socket reconnects
    const handleConnect = () => {
      console.log('[Live Session] Socket connected/reconnected. Re-joining room...');
      emitJoin();
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    // Presence Ping/Pong Heartbeat every 3 seconds
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('live_session_ping', {
          sessionId: session.sessionId,
          meetingId: session.meetingId,
          name: myName,
          role: myRoleLabel,
        });
      }
    }, 3000);

    const handlePong = (data: any) => {
      setIsPeerInRoom(true);
      if (data?.socketId) {
        setRemotePeerSocketId(data.socketId);
      }
      if (data?.name) {
        setRemotePeerName(data.name);
      }
    };

    // 1. Existing peers already in the room -> Initiate offer
    const handleExistingPeers = async ({ peers }: { peers: any[] }) => {
      if (peers && peers.length > 0) {
        const target = peers[0];
        setRemotePeerSocketId(target.socketId);
        if (target.name) {
          setRemotePeerName(target.name);
        }
        setIsPeerInRoom(true);
        console.log('[Live Session] Found existing peer in room:', target);

        const pc = createPeerConnection(target.socketId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('live_session_signal', {
            targetSocketId: target.socketId,
            signal: { type: 'offer', sdp: offer },
            sessionId: session.sessionId,
            meetingId: session.meetingId,
          });
        } catch (err) {
          console.error('[WebRTC] Failed to create offer for existing peer:', err);
        }
      }
    };

    // 2. A new peer joined the room
    const handlePeerJoined = (peer: any) => {
      console.log('[Live Session] New peer joined room:', peer);
      setRemotePeerSocketId(peer.socketId);
      if (peer.name) {
        setRemotePeerName(peer.name);
      }
      setIsPeerInRoom(true);

      setChatLog((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          senderName: 'System Notice',
          text: `🟢 ${peer.name || 'Peer'} has entered the room! Establishing direct connection...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Ensure peer connection is initialized to receive offer from the newcomer
      createPeerConnection(peer.socketId);
    };

    // 3. WebRTC Signals Relay
    const handleSignal = async ({ fromSocketId, fromName, signal }: { fromSocketId: string; fromName: string; signal: any }) => {
      setRemotePeerSocketId(fromSocketId);
      if (fromName) {
        setRemotePeerName(fromName);
      }
      setIsPeerInRoom(true);

      if (signal.type === 'offer') {
        console.log('[WebRTC] Handling offer from:', fromName);
        const pc = createPeerConnection(fromSocketId);

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await drainIceCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('live_session_signal', {
            targetSocketId: fromSocketId,
            signal: { type: 'answer', sdp: answer },
            sessionId: session.sessionId,
            meetingId: session.meetingId,
          });
        } catch (err) {
          console.error('[WebRTC] Error handling offer:', err);
        }
      } else if (signal.type === 'answer') {
        console.log('[WebRTC] Handling answer from:', fromName);
        if (pcRef.current) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            await drainIceCandidates(pcRef.current);
          } catch (err) {
            console.error('[WebRTC] Error setting remote answer:', err);
          }
        }
      } else if (signal.type === 'candidate') {
        if (pcRef.current && pcRef.current.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.warn('[WebRTC] Error adding ICE candidate:', err);
          }
        } else {
          iceCandidatesQueue.current.push(signal.candidate);
        }
      }
    };

    // 4. Live Chat
    const handleIncomingChat = (message: ChatEntry) => {
      setChatLog((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setIsPeerInRoom(true);
    };

    // 5. Code Sync
    const handleIncomingCode = ({ code }: { code: string }) => {
      setCodeSnippet(code);
    };

    // 6. Peer Left
    const handlePeerLeft = () => {
      setIsRemoteConnected(false);
      setIsPeerInRoom(false);
      setChatLog((prev) => [
        ...prev,
        {
          id: `sys-left-${Date.now()}`,
          sender: 'system',
          senderName: 'System Notice',
          text: `⚠️ ${remoteName} has disconnected from the room.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('live_session_pong', handlePong);
    socket.on('existing_session_peers', handleExistingPeers);
    socket.on('peer_joined_session', handlePeerJoined);
    socket.on('live_session_signal', handleSignal);
    socket.on('live_session_chat', handleIncomingChat);
    socket.on('live_session_code', handleIncomingCode);
    socket.on('peer_left_session', handlePeerLeft);

    return () => {
      clearInterval(pingInterval);
      socket.emit('leave_live_session', {
        sessionId: session.sessionId,
        meetingId: session.meetingId,
      });

      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('live_session_pong', handlePong);
      socket.off('existing_session_peers', handleExistingPeers);
      socket.off('peer_joined_session', handlePeerJoined);
      socket.off('live_session_signal', handleSignal);
      socket.off('live_session_chat', handleIncomingChat);
      socket.off('live_session_code', handleIncomingCode);
      socket.off('peer_left_session', handlePeerLeft);

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [session, myName, myRoleLabel, remoteName, isMentor, createPeerConnection]);

  // 6. Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 7. Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // 8. Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !session) return;

    const text = chatInput.trim();
    setChatInput('');

    const newMsg: ChatEntry = {
      id: `chat-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      sender: isMentor ? 'mentor' : 'student',
      senderName: myName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Add locally immediately
    setChatLog((prev) => [...prev, newMsg]);

    // Broadcast through socket to other peer across all alias keys
    const socket = ApiService.getSocket();
    socket.emit('live_session_chat', {
      sessionId: session.sessionId,
      meetingId: session.meetingId,
      bookingId: session.id,
      message: newMsg,
    });
  };

  // 9. End Call & Complete Session
  const handleEndCall = async () => {
    if (!session) return;

    try {
      const { feedback } = await ApiService.completeLiveSession(session.sessionId, {
        studentUnderstanding: 'Demonstrated clear conceptual clarity during the 1-on-1 session.',
        strengths: [
          'Effective communication of algorithm invariants',
          'Good dry-run intuition for recursion & tree structures',
          'Active engagement in real-time diagnostic evaluation',
        ],
        weaknesses: [
          'Edge case handling under skewed tree topologies',
          'Memory constraints in extreme auxiliary stack depth',
        ],
        recommendedTopics: [
          'Binary Tree Traversals (Inorder, Preorder, Postorder)',
          'Balanced Binary Search Trees & AVL Rotations',
          'Multi-Stage Statistical Survey Sampling',
        ],
        nextTasks: [
          'Solve 5 practice problems on StatSkillAI',
          'Review recursion call stack diagrams',
          'Complete diagnostic check-in next week',
        ],
        personalMessage: `Great session! Keep practicing these concepts and you will excel in technical and statistical evaluations.`,
        domain: session.skillDomain,
        userId: session.studentId,
      });

      await refreshScores();
      setCompletedFeedback(feedback);
      setShowFeedbackModal(true);
    } catch (err) {
      console.error('Failed to end call:', err);
      const fb = StorageService.getSessionFeedback(session.sessionId);
      if (fb) {
        setCompletedFeedback(fb);
        setShowFeedbackModal(true);
      } else {
        navigate(isMentor ? '/mentor-dashboard' : '/mentorship');
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
              {isMentor ? (
                <>
                  Student: <strong>{session.studentName}</strong> • Mentee Candidate
                </>
              ) : (
                <>
                  Mentor: <strong>{session.mentorName}</strong> • {session.mentorTitle || 'Specialist'}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center Countdown Timer & Meeting ID */}
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
        {/* Left Column: Dual Video Call Canvas */}
        <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between overflow-y-auto bg-slate-950 relative">
          {/* Video Streams Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch min-h-[420px]">
            {/* 1. REMOTE PARTICIPANT VIDEO FEED (Left Box) */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between shadow-2xl group">
              {/* Top status bar in remote video */}
              <div className="p-3 bg-gradient-to-b from-slate-950/80 to-transparent flex items-center justify-between z-10">
                <span className="text-xs font-bold text-white bg-slate-950/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    isRemoteConnected ? 'bg-emerald-400 animate-pulse' : isPeerInRoom ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                  }`} />
                  {remoteName} ({remoteRoleLabel})
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  isRemoteConnected
                    ? 'text-teal-300 bg-teal-950/80 border border-teal-500/30'
                    : isPeerInRoom
                    ? 'text-amber-300 bg-amber-950/80 border border-amber-500/30'
                    : 'text-slate-400 bg-slate-950/80 border border-slate-700'
                }`}>
                  <Radio className="w-3 h-3" />
                  {isRemoteConnected ? '1080p HD Live' : isPeerInRoom ? 'In Room • Connecting' : 'Waiting for Peer...'}
                </span>
              </div>

              {/* Video Element or Screen Share */}
              {isScreenSharing ? (
                <div className="flex-1 p-4 bg-slate-950 font-mono text-[11px] text-slate-300 overflow-hidden flex flex-col justify-center space-y-2">
                  <div className="flex items-center gap-2 text-teal-400 text-xs border-b border-slate-800 pb-2">
                    <Terminal className="w-4 h-4" />
                    <span>Live Interactive Code Sandbox</span>
                  </div>
                  <pre className="text-teal-300/90 leading-relaxed text-[10px] overflow-auto max-h-48">
                    {codeSnippet}
                  </pre>
                  <div className="text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30">
                    💡 Real-time IDE synced across mentor & student.
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                  {/* Remote WebRTC Video */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover rounded-xl ${isRemoteConnected ? 'block' : 'hidden'}`}
                  />

                  {/* Placeholder when remote peer video is establishing or waiting */}
                  {!isRemoteConnected && (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 relative z-0">
                      <div className="w-24 h-24 rounded-full bg-teal-500/20 flex items-center justify-center ring-4 ring-teal-500/40 animate-pulse">
                        <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-teal-700 to-indigo-700 text-white font-black text-2xl flex items-center justify-center shadow-2xl">
                          {remoteName[0] || 'P'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-sm text-white">{remoteName}</p>
                        <p className="text-xs text-slate-400">{remoteTitle}</p>
                      </div>

                      <div className="text-[11px] text-amber-300 bg-amber-950/60 px-3.5 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                        <span>
                          {isPeerInRoom
                            ? `🟢 ${remoteName} is in room • Establishing video link...`
                            : `Signaling active • Waiting for ${remoteName} to enter`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom video overlay */}
              <div className="p-3 bg-gradient-to-t from-slate-950/80 to-transparent flex items-center justify-between text-xs text-slate-400 z-10">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  NEP-2020 Verified Session
                </span>
                <button
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-teal-300 font-bold transition-colors flex items-center gap-1"
                >
                  <Code className="w-3 h-3" />
                  <span>{isScreenSharing ? 'Show Video Feed' : 'Share IDE Screen'}</span>
                </button>
              </div>
            </div>

            {/* 2. LOCAL PARTICIPANT VIDEO FEED (Right Box - You) */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between shadow-2xl">
              {/* Top status bar in local video */}
              <div className="p-3 bg-gradient-to-b from-slate-950/80 to-transparent flex items-center justify-between z-10">
                <span className="text-xs font-bold text-white bg-slate-950/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isCameraOn && webcamActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {myName} (You - {myRoleLabel})
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded">
                  {isMicOn ? '🎙 Mic Live' : '🔇 Muted'}
                </span>
              </div>

              {/* Local Video Element or Avatar */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <video
                  ref={localVideoRef}
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
                      {myName[0]}
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="font-bold text-sm text-white">{myName}</p>
                      <p className="text-[11px] text-slate-400">Camera preview inactive</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom video overlay */}
              <div className="p-3 bg-gradient-to-t from-slate-950/80 to-transparent flex items-center justify-between text-xs text-slate-400 z-10">
                <span className="text-[11px] text-slate-300">Domain: {session.skillDomain}</span>
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

            {/* Code / Screen Share */}
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

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-all ring-4 ring-rose-600/30"
              title="End Live Mentorship Session"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Chat & Session Info Panel */}
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
                  const isMe = msg.senderName === myName;
                  const isSystem = msg.sender === 'system';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSystem ? 'items-center' : isMe ? 'items-end' : 'items-start'}`}
                    >
                      {isSystem ? (
                        <div className="bg-slate-950 text-slate-400 text-[11px] px-3 py-1.5 rounded-lg border border-slate-800 text-center max-w-[90%] my-1 leading-snug">
                          {msg.text}
                        </div>
                      ) : (
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
                          <span className="text-[9px] opacity-60 flex items-center justify-end gap-1 mt-1">
                            <span>{msg.timestamp}</span>
                            {isMe && <Check className="w-3 h-3 text-teal-300" />}
                          </span>
                        </div>
                      )}
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
                  placeholder={isMentor ? 'Message mentee in real-time...' : 'Ask mentor a question...'}
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
                <p><strong>Room Status: </strong>
                  <span className={isPeerInRoom ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {isPeerInRoom ? 'Both Participants Connected' : 'Waiting for Peer'}
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 block">
                  Participants
                </span>
                <p><strong>Mentor: </strong>{session.mentorName}</p>
                <p><strong>Student: </strong>{session.studentName}</p>
                <p className="text-[11px] text-teal-300 font-bold">Fee: ₹{session.price} / 5 minutes</p>
                <p className="text-[10px] text-slate-500">Duration: 5-minute direct video consultation</p>
              </div>

              <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-200 text-[11px] leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 mb-1" />
                Upon ending this call, a verified assessment report will be saved and competency scores will be updated.
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
            navigate(isMentor ? '/mentor-dashboard' : '/dashboard');
          }}
          onReviewSubmitted={() => {
            navigate(isMentor ? '/mentor-dashboard' : '/dashboard');
          }}
        />
      )}
    </div>
  );
};
