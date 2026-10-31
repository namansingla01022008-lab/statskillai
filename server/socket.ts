import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken, AuthUserPayload } from './middleware/auth';

let io: SocketIOServer | null = null;
const connectedUsers = new Map<string, string>(); // userId -> socketId

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        (socket as any).user = payload;
      }
    }
    // Allow connection for signaling even if token is absent/guest
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthUserPayload | undefined;
    if (user) {
      connectedUsers.set(user.userId, socket.id);
      socket.join(`user:${user.userId}`);
      console.log(`[Socket.io] User connected: ${user.name} (${user.role}) - socket ${socket.id}`);
    } else {
      console.log(`[Socket.io] Guest/unauthenticated socket connected: ${socket.id}`);
    }

    // Join mentorship room for 1-on-1 real-time messaging
    socket.on('join_mentorship', (mentorshipId: string) => {
      socket.join(`mentorship:${mentorshipId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room mentorship:${mentorshipId}`);
    });

    socket.on('leave_mentorship', (mentorshipId: string) => {
      socket.leave(`mentorship:${mentorshipId}`);
    });

    // -------------------------------------------------------------------
    // LIVE MENTORSHIP VIDEO CALL & WEBRTC SIGNALING
    // -------------------------------------------------------------------
    socket.on('join_live_session', ({ sessionId, meetingId, bookingId, name, role }: { sessionId: string; meetingId?: string; bookingId?: string; name?: string; role?: string }) => {
      // Remember participant info on socket
      (socket as any).participantName = user?.name || name || 'Participant';
      (socket as any).participantRole = user?.role || role || 'learner';

      const participantInfo = {
        socketId: socket.id,
        userId: user?.userId || socket.id,
        name: (socket as any).participantName,
        role: (socket as any).participantRole,
      };

      // Join all alias keys for this session (sessionId, meetingId, bookingId) to prevent room divergence
      const roomKeys = [sessionId, meetingId, bookingId].filter(Boolean) as string[];
      for (const key of roomKeys) {
        socket.join(`room:live_session:${key}`);
      }

      // Collect existing peers across all alias rooms
      const existingInRoom: any[] = [];
      const seenSocketIds = new Set<string>();

      for (const key of roomKeys) {
        const room = `room:live_session:${key}`;
        const socketsInRoom = io?.sockets.adapter.rooms.get(room);
        if (socketsInRoom) {
          for (const sId of socketsInRoom) {
            if (sId !== socket.id && !seenSocketIds.has(sId)) {
              seenSocketIds.add(sId);
              const otherSocket = io?.sockets.sockets.get(sId);
              const otherUser = (otherSocket as any)?.user;
              existingInRoom.push({
                socketId: sId,
                userId: otherUser?.userId || sId,
                name: (otherSocket as any)?.participantName || otherUser?.name || 'Peer Participant',
                role: (otherSocket as any)?.participantRole || otherUser?.role || 'mentor',
              });
            }
          }
        }
      }

      console.log(`[Live Session] Socket ${socket.id} (${participantInfo.name}) joined rooms [${roomKeys.join(', ')}]. Peers count: ${existingInRoom.length}`);

      // Send existing peers to newly joined participant
      socket.emit('existing_session_peers', { peers: existingInRoom });

      // Notify other peers across all alias rooms that someone joined
      for (const key of roomKeys) {
        socket.to(`room:live_session:${key}`).emit('peer_joined_session', participantInfo);
      }
    });

    // Presence Heartbeat Ping & Pong
    socket.on('live_session_ping', ({ sessionId, meetingId, name, role }: any) => {
      const roomKeys = [sessionId, meetingId].filter(Boolean) as string[];
      const pongData = {
        socketId: socket.id,
        name: name || (socket as any).participantName || 'Peer',
        role: role || (socket as any).participantRole || 'participant',
        timestamp: Date.now(),
      };
      for (const key of roomKeys) {
        socket.to(`room:live_session:${key}`).emit('live_session_pong', pongData);
      }
    });

    // WebRTC Offer/Answer/ICE Candidate Signaling relay
    socket.on('live_session_signal', ({ targetSocketId, signal, sessionId, meetingId }: { targetSocketId?: string; signal: any; sessionId: string; meetingId?: string }) => {
      if (targetSocketId) {
        io?.to(targetSocketId).emit('live_session_signal', {
          fromSocketId: socket.id,
          fromName: (socket as any)?.participantName || user?.name || 'Peer',
          signal,
        });
      } else {
        const roomKeys = [sessionId, meetingId].filter(Boolean) as string[];
        for (const key of roomKeys) {
          socket.to(`room:live_session:${key}`).emit('live_session_signal', {
            fromSocketId: socket.id,
            fromName: (socket as any)?.participantName || user?.name || 'Peer',
            signal,
          });
        }
      }
    });

    // Live session chat message broadcast
    socket.on('live_session_chat', ({ sessionId, meetingId, bookingId, message }: { sessionId: string; meetingId?: string; bookingId?: string; message: any }) => {
      const roomKeys = [sessionId, meetingId, bookingId].filter(Boolean) as string[];
      const broadcasted = new Set<string>();
      for (const key of roomKeys) {
        const room = `room:live_session:${key}`;
        if (!broadcasted.has(room)) {
          broadcasted.add(room);
          io?.to(room).emit('live_session_chat', message);
        }
      }
    });

    // Live session interactive code share
    socket.on('live_session_code', ({ sessionId, meetingId, code, senderName }: { sessionId: string; meetingId?: string; code: string; senderName: string }) => {
      const roomKeys = [sessionId, meetingId].filter(Boolean) as string[];
      for (const key of roomKeys) {
        socket.to(`room:live_session:${key}`).emit('live_session_code', { code, senderName });
      }
    });

    // Live session booking real-time relay
    socket.on('mentor_session_booked', (data: any) => {
      io?.emit('mentor_session_booked', data);
    });

    // Real-time user registration relay
    socket.on('user_registered', (data: any) => {
      io?.emit('user_registered', data);
    });

    // Leave live session
    socket.on('leave_live_session', ({ sessionId, meetingId }: { sessionId: string; meetingId?: string }) => {
      const roomKeys = [sessionId, meetingId].filter(Boolean) as string[];
      for (const key of roomKeys) {
        const room = `room:live_session:${key}`;
        socket.leave(room);
        socket.to(room).emit('peer_left_session', { socketId: socket.id, userId: user?.userId });
      }
      console.log(`[Live Session] Socket ${socket.id} left rooms [${roomKeys.join(', ')}]`);
    });

    // Handle typing indicators
    socket.on('typing_start', ({ mentorshipId }: { mentorshipId: string }) => {
      socket.to(`mentorship:${mentorshipId}`).emit('typing_start', {
        senderId: user?.userId,
        senderName: user?.name,
      });
    });

    socket.on('typing_stop', ({ mentorshipId }: { mentorshipId: string }) => {
      socket.to(`mentorship:${mentorshipId}`).emit('typing_stop', {
        senderId: user?.userId,
      });
    });

    socket.on('disconnecting', () => {
      // Notify any live session rooms that this peer disconnected
      for (const room of socket.rooms) {
        if (room.startsWith('room:live_session:')) {
          socket.to(room).emit('peer_left_session', { socketId: socket.id, userId: user?.userId });
        }
      }
    });

    socket.on('disconnect', () => {
      if (user) {
        connectedUsers.delete(user.userId);
        console.log(`[Socket.io] User disconnected: ${user.name}`);
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Helper to broadcast new messages
export function emitDirectMessage(mentorshipId: string, message: any) {
  if (io) {
    io.to(`mentorship:${mentorshipId}`).emit('new_message', message);
  }
}

// Helper to notify a specific user of application status updates
export function notifyUser(userId: string, notification: { type: string; title: string; message: string; data?: any }) {
  if (io) {
    io.to(`user:${userId}`).emit('user_notification', notification);
  }
}

export const sendUserNotification = notifyUser;
