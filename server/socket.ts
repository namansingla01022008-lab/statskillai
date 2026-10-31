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
    socket.on('join_live_session', ({ sessionId, name, role }: { sessionId: string; name?: string; role?: string }) => {
      const room = `room:live_session:${sessionId}`;
      socket.join(room);

      const participantInfo = {
        socketId: socket.id,
        userId: user?.userId || socket.id,
        name: user?.name || name || 'Participant',
        role: user?.role || role || 'learner',
      };

      // Collect existing peers in this room
      const existingInRoom: any[] = [];
      const socketsInRoom = io?.sockets.adapter.rooms.get(room);
      if (socketsInRoom) {
        for (const sId of socketsInRoom) {
          if (sId !== socket.id) {
            const otherSocket = io?.sockets.sockets.get(sId);
            const otherUser = (otherSocket as any)?.user;
            existingInRoom.push({
              socketId: sId,
              userId: otherUser?.userId || sId,
              name: otherUser?.name || 'Peer Participant',
              role: otherUser?.role || 'mentor',
            });
          }
        }
      }

      console.log(`[Live Session] Socket ${socket.id} (${participantInfo.name}) joined ${room}. Peers count: ${existingInRoom.length}`);

      // Send existing peers to newly joined participant
      socket.emit('existing_session_peers', { peers: existingInRoom });

      // Notify other peers in room that someone joined
      socket.to(room).emit('peer_joined_session', participantInfo);
    });

    // WebRTC Offer/Answer/ICE Candidate Signaling relay
    socket.on('live_session_signal', ({ targetSocketId, signal, sessionId }: { targetSocketId?: string; signal: any; sessionId: string }) => {
      const room = `room:live_session:${sessionId}`;
      if (targetSocketId) {
        io?.to(targetSocketId).emit('live_session_signal', {
          fromSocketId: socket.id,
          fromName: user?.name || 'Peer',
          signal,
        });
      } else {
        socket.to(room).emit('live_session_signal', {
          fromSocketId: socket.id,
          fromName: user?.name || 'Peer',
          signal,
        });
      }
    });

    // Live session chat message broadcast
    socket.on('live_session_chat', ({ sessionId, message }: { sessionId: string; message: any }) => {
      const room = `room:live_session:${sessionId}`;
      io?.to(room).emit('live_session_chat', message);
    });

    // Live session interactive code share
    socket.on('live_session_code', ({ sessionId, code, senderName }: { sessionId: string; code: string; senderName: string }) => {
      const room = `room:live_session:${sessionId}`;
      socket.to(room).emit('live_session_code', { code, senderName });
    });

    // Leave live session
    socket.on('leave_live_session', ({ sessionId }: { sessionId: string }) => {
      const room = `room:live_session:${sessionId}`;
      socket.leave(room);
      socket.to(room).emit('peer_left_session', { socketId: socket.id, userId: user?.userId });
      console.log(`[Live Session] Socket ${socket.id} left ${room}`);
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
