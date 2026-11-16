import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { logger } from '../utils/logger.js';
import {
  getStoredUser,
  saveStoredUser,
  saveMessage,
  getStoredMessage,
  getAllConversationMessages,
  markStoredMessagesRead,
  markStoredMessageDelivered,
  StoredMessage,
} from '../utils/dataStore.js';
import { resolveConversation } from '../controllers/message.controller.js';

let io: SocketIOServer | null = null;

// Track active connections per user: Map<userId, Set<socketId>>
const userSocketsMap = new Map<string, Set<string>>();

// Sliding window cache for duplicate event suppression (60-second TTL)
const processedTempIds = new Map<string, number>();

function isTempIdDuplicate(tempId: string): boolean {
  const now = Date.now();
  const cachedTime = processedTempIds.get(tempId);
  if (cachedTime && now - cachedTime < 60000) {
    return true;
  }
  processedTempIds.set(tempId, now);
  // Periodic cleanup if map grows
  if (processedTempIds.size > 2000) {
    for (const [id, time] of processedTempIds.entries()) {
      if (now - time > 60000) processedTempIds.delete(id);
    }
  }
  return false;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function getOnlineUserIds(): string[] {
  return Array.from(userSocketsMap.keys());
}

export function initSocketIO(httpServer: HttpServer, _clientUrl: string): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (_origin, callback) => callback(null, true),
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

      if (!token && socket.handshake.headers.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token && socket.handshake.headers.cookie) {
        const match = socket.handshake.headers.cookie.match(/becugram_at=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error('Authentication token required for Socket connection.'));
      }

      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      socket.data.username = decoded.username;
      next();
    } catch (err) {
      return next(new Error('Invalid socket authentication token.'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

    // 1. Track user socket
    const isNewOnlineUser = !userSocketsMap.has(userId) || userSocketsMap.get(userId)!.size === 0;
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId)!.add(socket.id);

    // 2. Join personal user room for direct user notifications & multi-device sync
    socket.join(`user:${userId}`);

    // 3. Update online status & broadcast
    if (isNewOnlineUser) {
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
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
    }

    // 4. Send initial active online users list to this newly connected socket
    socket.emit('presence:initial', {
      onlineUserIds: Array.from(userSocketsMap.keys()),
    });

    // 5. Query online users on-demand
    socket.on('presence:get_online', (callback?: Function) => {
      const activeIds = Array.from(userSocketsMap.keys());
      if (typeof callback === 'function') {
        callback({ success: true, onlineUserIds: activeIds });
      } else {
        socket.emit('presence:initial', { onlineUserIds: activeIds });
      }
    });

    // 6. Join conversation room with membership validation
    socket.on('chat:join', async ({ conversationId }: { conversationId: string }, callback?: Function) => {
      try {
        const resolved = await resolveConversation(conversationId);
        if (!resolved || !resolved.participants.includes(userId)) {
          const err = { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatga kirish huquqi yo'q." };
          socket.emit('error', err);
          if (typeof callback === 'function') callback({ success: false, error: err });
          return;
        }

        socket.join(conversationId);
        socket.join(`chat:${conversationId}`);
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        logger.error(`Error joining chat room: ${conversationId}`, err);
        if (typeof callback === 'function') callback({ success: false, error: err });
      }
    });

    // 7. Leave conversation room
    socket.on('chat:leave', ({ conversationId }: { conversationId: string }) => {
      socket.leave(conversationId);
      socket.leave(`chat:${conversationId}`);
    });

    // 8. Real-time Typing start (membership validated)
    socket.on('typing:start', async ({ conversationId }: { conversationId: string }) => {
      const resolved = await resolveConversation(conversationId);
      if (!resolved || !resolved.participants.includes(userId)) return;

      let displayName = 'Foydalanuvchi';
      const stored = getStoredUser(userId);
      if (stored) {
        displayName = stored.displayName;
      } else if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          const user = await User.findById(userId).select('displayName');
          if (user) displayName = user.displayName;
        } catch {}
      }

      socket.to(conversationId).to(`chat:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        displayName,
        isTyping: true,
      });
    });

    // 9. Real-time Typing stop
    socket.on('typing:stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).to(`chat:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // 10. Direct WebSocket message sending with Acks & Deduplication
    socket.on(
      'message:send',
      async (
        payload: {
          tempId?: string;
          clientTempId?: string;
          conversationId: string;
          content?: string;
          type?: string;
          media?: any;
          replyToId?: string;
          forwardedFrom?: any;
        },
        callback?: Function
      ) => {
        const tempId = payload.tempId || payload.clientTempId;
        const { conversationId, content, type = 'text', media, replyToId, forwardedFrom } = payload;

        // Content check
        if (!content?.trim() && !media && type !== 'sticker') {
          const err = { code: 'EMPTY_MESSAGE', message: 'Xabar matni yoki media talab qilinadi.' };
          socket.emit('message:error', { tempId, error: err });
          if (typeof callback === 'function') callback({ success: false, error: err });
          return;
        }

        // Validate conversation & membership
        const resolved = await resolveConversation(conversationId);
        if (!resolved || !resolved.participants.includes(userId)) {
          const err = { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatga xabar yuborish huquqi yo'q." };
          socket.emit('message:error', { tempId, error: err });
          if (typeof callback === 'function') callback({ success: false, error: err });
          return;
        }

        // Check if message with this tempId is already in DB / dataStore (Deduplication)
        if (tempId) {
          if (resolved.isMongo) {
            try {
              const existing = await Message.findOne({ conversationId, clientTempId: tempId })
                .populate('senderId', 'displayName username avatar phoneNumber')
                .populate({
                  path: 'replyTo',
                  select: 'content senderId type media isDeleted',
                  populate: { path: 'senderId', select: 'displayName username' },
                });
              if (existing) {
                socket.emit('message:ack', { tempId, message: existing, status: 'sent' });
                if (typeof callback === 'function') callback({ success: true, data: existing });
                return;
              }
            } catch {}
          } else {
            const existing = getAllConversationMessages(conversationId).find((m) => m.clientTempId === tempId);
            if (existing) {
              socket.emit('message:ack', { tempId, message: existing, status: 'sent' });
              if (typeof callback === 'function') callback({ success: true, data: existing });
              return;
            }
          }

          // Sliding window suppression for rapid in-flight retries
          if (isTempIdDuplicate(tempId)) {
            logger.info(`Duplicate message:send event in-flight for tempId: ${tempId}`);
            let existing: any = null;
            if (resolved.isMongo) {
              try {
                existing = await Message.findOne({ conversationId, clientTempId: tempId });
              } catch {}
            }
            if (!existing) {
              existing = getAllConversationMessages(conversationId).find((m) => m.clientTempId === tempId);
            }
            if (existing) {
              socket.emit('message:ack', { tempId, message: existing, status: 'sent' });
            }
            if (typeof callback === 'function') {
              callback({ success: true, data: existing || { _id: tempId, clientTempId: tempId, content } });
            }
            return;
          }
        }

        // Sender details
        let senderInfo: any = {
          _id: userId,
          displayName: 'Foydalanuvchi',
          username: 'user',
          avatar: '',
        };
        const storedSender = getStoredUser(userId);
        if (storedSender) {
          senderInfo = {
            _id: storedSender._id,
            displayName: storedSender.displayName,
            username: storedSender.username,
            avatar: storedSender.avatar || '',
          };
        } else if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
          try {
            const mongoUser = await User.findById(userId).select('displayName username avatar');
            if (mongoUser) {
              senderInfo = {
                _id: mongoUser._id.toString(),
                displayName: mongoUser.displayName,
                username: mongoUser.username,
                avatar: mongoUser.avatar || '',
              };
            }
          } catch {}
        }

        // Resolve replyTo
        let replyObj: any = undefined;
        if (replyToId) {
          const prev = getStoredMessage(replyToId);
          if (prev) {
            replyObj = { _id: prev._id, content: prev.content, senderId: prev.senderId };
          } else if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(replyToId)) {
            try {
              const prevMongo = await Message.findById(replyToId).populate('senderId', 'displayName username');
              if (prevMongo) {
                replyObj = { _id: prevMongo._id.toString(), content: prevMongo.content, senderId: prevMongo.senderId };
              }
            } catch {}
          }
        }

        let savedMessage: any = null;

        // Save in MongoDB if active
        if (resolved.isMongo) {
          try {
            const created = await Message.create({
              conversationId,
              senderId: userId,
              type: (type as any) || 'text',
              content: content?.trim() || '',
              media,
              replyTo: replyToId && mongoose.Types.ObjectId.isValid(replyToId) ? replyToId : undefined,
              clientTempId: tempId,
              reactions: [],
              deliveredTo: [userId],
              readBy: [userId],
              isEdited: false,
              isDeleted: false,
            });

            const populated = await Message.findById(created._id)
              .populate('senderId', 'displayName username avatar phoneNumber')
              .populate({
                path: 'replyTo',
                select: 'content senderId type media isDeleted',
                populate: { path: 'senderId', select: 'displayName username' },
              });

            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: created._id,
              lastMessageAt: created.createdAt,
            });

            savedMessage = populated || created;

            // Dual persistence backup to dataStore
            saveMessage({
              _id: created._id.toString(),
              conversationId,
              senderId: senderInfo,
              type: (type as any) || 'text',
              content: content?.trim() || '',
              media,
              replyTo: replyObj,
              clientTempId: tempId,
              reactions: [],
              readBy: [userId],
              createdAt: created.createdAt.toISOString(),
            });
          } catch (err) {
            logger.error('Failed to save socket message to Mongo:', err);
          }
        }

        // Save to dataStore if not Mongo
        if (!savedMessage) {
          const msgDoc: StoredMessage = {
            _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            conversationId,
            senderId: senderInfo,
            type: (type as any) || 'text',
            content: content?.trim() || '',
            media,
            replyTo: replyObj,
            clientTempId: tempId,
            forwardedFrom,
            reactions: [],
            readBy: [userId],
            createdAt: new Date().toISOString(),
          };
          savedMessage = saveMessage(msgDoc);
        }

        // 1. Emit Ack to sender
        socket.emit('message:ack', {
          tempId,
          message: savedMessage,
          status: 'sent',
        });

        if (typeof callback === 'function') {
          callback({ success: true, data: savedMessage });
        }

        // 2. Broadcast to conversation room
        socket.to(conversationId).to(`chat:${conversationId}`).emit('message:new', savedMessage);

        // 3. Multi-device sync: broadcast to other devices of sender and all participants
        for (const p of resolved.participants) {
          socket.to(`user:${p}`).emit('message:new', savedMessage);
        }
      }
    );

    // 11. Read Receipts via WebSocket
    socket.on('message:read', async (payload: { conversationId: string; messageIds?: string[] }, callback?: Function) => {
      const { conversationId, messageIds } = payload;
      const resolved = await resolveConversation(conversationId);
      if (!resolved || !resolved.participants.includes(userId)) {
        if (typeof callback === 'function') {
          callback({ success: false, error: { code: 'FORBIDDEN_NOT_PARTICIPANT' } });
        }
        return;
      }

      const readAt = new Date().toISOString();
      const readMessageIds: string[] = [];

      // Mark in MongoDB
      if (resolved.isMongo) {
        try {
          const query: any = {
            conversationId,
            senderId: { $ne: userId },
            readBy: { $ne: userId },
          };
          if (messageIds && messageIds.length > 0) {
            query._id = { $in: messageIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) };
          }
          const unreadMsgs = await Message.find(query).select('_id');
          readMessageIds.push(...unreadMsgs.map((m) => m._id.toString()));

          if (unreadMsgs.length > 0) {
            await Message.updateMany(
              { _id: { $in: unreadMsgs.map((m) => m._id) } },
              { $addToSet: { readBy: userId } }
            );
          }

          await Conversation.findByIdAndUpdate(conversationId, {
            [`unreadCounts.${userId}`]: 0,
          });
        } catch (err) {
          logger.error('Mongo message:read error:', err);
        }
      }

      // Mark in dataStore
      const dataStoreReadIds = markStoredMessagesRead(conversationId, userId, messageIds);
      for (const id of dataStoreReadIds) {
        if (!readMessageIds.includes(id)) readMessageIds.push(id);
      }

      const receiptPayload = {
        conversationId,
        readerId: userId,
        messageIds: readMessageIds,
        readAt,
      };

      // Broadcast receipt
      io?.to(conversationId).to(`chat:${conversationId}`).emit('message:read_receipt', receiptPayload);
      // Reader other tabs unread badge reset
      io?.to(`user:${userId}`).emit('chat:unread_reset', { conversationId });

      for (const p of resolved.participants) {
        if (p !== userId) {
          io?.to(`user:${p}`).emit('message:read_receipt', receiptPayload);
        }
      }

      if (typeof callback === 'function') {
        callback({ success: true, data: receiptPayload });
      }
    });

    // 12. Message Delivery Confirmation
    socket.on('message:delivered', async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(messageId)) {
        try {
          await Message.findByIdAndUpdate(messageId, { $addToSet: { deliveredTo: userId } });
        } catch {}
      }
      markStoredMessageDelivered(messageId, userId);

      io?.to(conversationId).to(`chat:${conversationId}`).emit('message:status_update', {
        messageId,
        status: 'delivered',
        userId,
      });
    });

    // 13. Real Call Signaling
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

    // 14. Disconnection Handling
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
          const lastSeen = new Date();

          if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
            try {
              await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
            } catch {}
          } else {
            const u = getStoredUser(userId);
            if (u) {
              u.isOnline = false;
              saveStoredUser(u);
            }
          }

          io?.emit('presence:update', {
            userId,
            isOnline: false,
            lastSeen: lastSeen.toISOString(),
          });
        }
      }
    });
  });

  return io;
}
