import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { logger } from '../utils/logger.js';
import { getStoredUser, saveStoredUser } from '../utils/dataStore.js';

let io: SocketIOServer | null = null;

// Track active connections per user: Map<userId, Set<socketId>>
const userSocketsMap = new Map<string, Set<string>>();

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function initSocketIO(httpServer: HttpServer, clientUrl: string): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Authentication Middleware for Sockets
  io.use(async (socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        // Parse cookie if present
        const match = socket.handshake.headers.cookie.match(/becugram_at=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error('Authentication token required for Socket connection.'));
      }

      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      return next(new Error('Invalid socket authentication token.'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

    // Track user socket
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId)!.add(socket.id);

    // Join personal user room for direct user notifications
    socket.join(`user:${userId}`);

    // Update online status
    if (mongoose.connection.readyState === 1) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      } catch {}
    } else {
      const u = getStoredUser(userId);
      if (u) {
        u.isOnline = true;
        saveStoredUser(u);
      }
    }
    io?.emit('presence:update', { userId, isOnline: true });

    // Join a conversation room
    socket.on('chat:join', async ({ conversationId }: { conversationId: string }) => {
      try {
        if (mongoose.connection.readyState === 1) {
          const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
          if (conv) socket.join(`chat:${conversationId}`);
        } else {
          socket.join(`chat:${conversationId}`);
        }
      } catch (err) {
        logger.error(`Error joining chat room: ${conversationId}`, err);
      }
    });

    // Leave a conversation room
    socket.on('chat:leave', ({ conversationId }: { conversationId: string }) => {
      socket.leave(`chat:${conversationId}`);
    });

    // Typing start
    socket.on('typing:start', async ({ conversationId }: { conversationId: string }) => {
      let displayName = 'User';
      if (mongoose.connection.readyState === 1) {
        try {
          const user = await User.findById(userId).select('displayName username');
          if (user) displayName = user.displayName;
        } catch {}
      } else {
        const u = getStoredUser(userId);
        if (u) displayName = u.displayName;
      }
      socket.to(`chat:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        displayName,
        isTyping: true,
      });
    });

    // Typing stop
    socket.on('typing:stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`chat:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // Real Call Signaling
    socket.on('call:start', ({ targetUserId, type }: { targetUserId: string; type: 'audio' | 'video' }) => {
      socket.to(`user:${targetUserId}`).emit('call:incoming', {
        callerId: userId,
        type,
      });
    });

    socket.on('call:accepted', ({ targetUserId }: { targetUserId: string }) => {
      socket.to(`user:${targetUserId}`).emit('call:accepted', {
        acceptedBy: userId,
      });
    });

    socket.on('call:rejected', ({ targetUserId }: { targetUserId: string }) => {
      socket.to(`user:${targetUserId}`).emit('call:rejected', {
        rejectedBy: userId,
      });
    });

    socket.on('call:cancel', ({ targetUserId }: { targetUserId: string }) => {
      socket.to(`user:${targetUserId}`).emit('call:cancelled', {
        cancelledBy: userId,
      });
    });

    socket.on('call:end', ({ targetUserId }: { targetUserId: string }) => {
      socket.to(`user:${targetUserId}`).emit('call:ended', {
        endedBy: userId,
      });
    });

    // Handle Disconnect
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
          const lastSeen = new Date();
          if (mongoose.connection.readyState === 1) {
            try {
              await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
            } catch {}
          }
          io?.emit('presence:update', { userId, isOnline: false, lastSeen });
        }
      }
    });
  });

  return io;
}

