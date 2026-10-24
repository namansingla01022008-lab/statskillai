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
    if (!token) {
      // Allow unauthenticated connection or reject? We reject for secure real-time messaging
      return next(new Error('Authentication token required for Socket connection.'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token for Socket connection.'));
    }

    (socket as any).user = payload;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthUserPayload;
    if (user) {
      connectedUsers.set(user.userId, socket.id);
      socket.join(`user:${user.userId}`);
      console.log(`[Socket.io] User connected: ${user.name} (${user.role}) - socket ${socket.id}`);
    }

    // Join mentorship room for 1-on-1 real-time messaging
    socket.on('join_mentorship', (mentorshipId: string) => {
      socket.join(`mentorship:${mentorshipId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room mentorship:${mentorshipId}`);
    });

    socket.on('leave_mentorship', (mentorshipId: string) => {
      socket.leave(`mentorship:${mentorshipId}`);
    });

    // Handle typing indicators
    socket.on('typing_start', ({ mentorshipId }: { mentorshipId: string }) => {
      socket.to(`mentorship:${mentorshipId}`).emit('typing_start', {
        senderId: user.userId,
        senderName: user.name,
      });
    });

    socket.on('typing_stop', ({ mentorshipId }: { mentorshipId: string }) => {
      socket.to(`mentorship:${mentorshipId}`).emit('typing_stop', {
        senderId: user.userId,
      });
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
