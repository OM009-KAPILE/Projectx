import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '@projectx/db';

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket Auth Middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    if (token) {
      try {
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const decoded = jwt.verify(cleanToken, config.jwtSecret) as any;
        socket.data.user = decoded;
      } catch (err) {
        // Allow connection but user data won't be authenticated
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Join Project Workspace Room (Strictly authorized)
    socket.on('join_project', async (projectId: string) => {
      if (!userId) return;
      try {
        const isMember = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId } },
        });
        const isCreator = await prisma.project.findFirst({
          where: { id: projectId, creatorId: userId },
        });
        if (isMember || isCreator || socket.data.user?.role === 'ADMIN') {
          socket.join(`project:${projectId}`);
        }
      } catch (err) {
        // Silently prevent unauthorized room join
      }
    });

    // Leave Project Workspace Room
    socket.on('leave_project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Join Conversation Room (Strictly authorized)
    socket.on('join_conversation', async (conversationId: string) => {
      if (!userId) return;
      try {
        const isParticipant = await prisma.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
        });
        if (isParticipant || socket.data.user?.role === 'ADMIN') {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        // Silently prevent unauthorized room join
      }
    });

    // Leave Conversation Room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing Indicators
    socket.on('typing_start', ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', { conversationId, userId, userName });
    });

    socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', { conversationId, userId });
    });

    socket.on('disconnect', () => {
      // Clean up on disconnect
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
}

export function emitToProject(projectId: string, event: string, data: any) {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
}

export function emitToConversation(conversationId: string, event: string, data: any) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}
