import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { getSocketIO } from '../sockets/index.js';
import { resolveConversation } from './message.controller.js';
import {
  getUserConversations,
  addOrUpdateConversation,
  getStoredMessage,
  StoredConversation,
} from '../utils/dataStore.js';

export async function getChats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';

  if (mongoose.connection.readyState !== 1) {
    const list = getUserConversations(currentUserId);
    res.status(200).json({ success: true, data: list });
    return;
  }

  try {
    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate({
        path: 'participants',
        select: 'displayName username avatar isOnline lastSeen isVerified phoneNumber',
      })
      .populate({
        path: 'groupId',
        select: 'name description avatar memberCount',
      })
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: 'displayName username',
        },
      })
      .sort({ lastMessageAt: -1 });

    if (conversations.length === 0) {
      const list = getUserConversations(currentUserId);
      res.status(200).json({ success: true, data: list });
      return;
    }

    const formatted = conversations.map((conv) => {
      const isPinned = conv.pinnedFor?.some((id) => id.toString() === currentUserId);
      const isMuted = conv.mutedFor?.some((id) => id.toString() === currentUserId);
      const unreadCount = conv.unreadCounts?.get(currentUserId!) || 0;

      let partner = null;
      if (conv.type === 'direct') {
        partner = conv.participants.find((p: any) => p._id.toString() !== currentUserId);
      }

      return {
        _id: conv._id,
        type: conv.type,
        partner,
        group: conv.groupId,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        isPinned,
        isMuted,
        unreadCount,
        createdAt: conv.createdAt,
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    const list = getUserConversations(currentUserId);
    res.status(200).json({ success: true, data: list });
  }
}

export async function getOrCreateDirectChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const { recipientId } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const chats = getUserConversations(currentUserId);
    const existing = chats.find(
      (c) => c.type === 'direct' && (c.partner?._id === recipientId || (c.participants.includes(recipientId) && c.participants.includes(currentUserId)))
    );

    if (existing) {
      res.status(200).json({ success: true, data: existing });
      return;
    }

    // Create fresh real direct chat
    const newChat: StoredConversation = {
      _id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'direct',
      participants: [currentUserId, recipientId],
      partner: {
        _id: recipientId,
        displayName: req.body.displayName || 'Becu Contact',
        username: req.body.username || 'user',
        avatar: req.body.avatar || '',
        isOnline: true,
        isVerified: false,
      },
      lastMessage: {
        type: 'text',
        content: 'Yangi suhbat boshlandi',
        createdAt: new Date().toISOString(),
      },
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    addOrUpdateConversation(newChat);
    res.status(200).json({ success: true, data: newChat });
    return;
  }

  try {
    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [currentUserId, recipientId], $size: 2 },
    })
      .populate('participants', 'displayName username avatar isOnline lastSeen isVerified')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [currentUserId, recipientId],
        lastMessageAt: new Date(),
        unreadCounts: new Map([[recipientId, 0], [currentUserId!, 0]]),
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'displayName username avatar isOnline lastSeen isVerified');
    }

    res.status(200).json({ success: true, data: conversation });
  } catch {
    const chats = getUserConversations(currentUserId);
    res.status(200).json({ success: true, data: chats[0] });
  }
}

export async function getChatById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  // 1. Try to find in MongoDB if active
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
    try {
      const conversation = await Conversation.findById(id)
        .populate('participants', 'displayName username avatar isOnline lastSeen isVerified phoneNumber')
        .populate('groupId')
        .populate('lastMessage');

      if (conversation) {
        const isParticipant = conversation.participants.some(
          (p: any) => p._id.toString() === currentUserId || p.toString() === currentUserId
        );
        if (!isParticipant) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatga kirish huquqi yo'q." },
          });
          return;
        }

        const partner = conversation.type === 'direct'
          ? conversation.participants.find((p: any) => p._id.toString() !== currentUserId)
          : null;

        res.status(200).json({
          success: true,
          data: {
            ...conversation.toObject(),
            partner,
            isPinned: conversation.pinnedFor?.some((uid) => uid.toString() === currentUserId),
            isMuted: conversation.mutedFor?.some((uid) => uid.toString() === currentUserId),
            unreadCount: conversation.unreadCounts?.get(currentUserId!) || 0,
          },
        });
        return;
      }
    } catch {}
  }

  // 2. Try to find in dataStore
  const chats = getUserConversations(currentUserId);
  const match = chats.find((c) => c._id === id);

  if (match) {
    res.status(200).json({ success: true, data: match });
    return;
  }

  // Check if it exists for someone else in dataStore to distinguish 403 from 404
  const { getStoredConversation } = await import('../utils/dataStore.js');
  const otherChat = getStoredConversation(id);
  if (otherChat) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatga kirish huquqi yo'q." },
    });
    return;
  }

  res.status(404).json({
    success: false,
    error: { code: 'CHAT_NOT_FOUND', message: 'Chat topilmadi.' },
  });
}

export async function togglePinChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const chats = getUserConversations(currentUserId);
  const target = chats.find((c) => c._id === id);
  if (target) {
    target.isPinned = !target.isPinned;
    addOrUpdateConversation(target);
  }

  res.status(200).json({ success: true, data: { isPinned: target?.isPinned ?? true } });
}

export async function toggleMuteChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const chats = getUserConversations(currentUserId);
  const target = chats.find((c) => c._id === id);
  if (target) {
    target.isMuted = !target.isMuted;
    addOrUpdateConversation(target);
  }

  res.status(200).json({ success: true, data: { isMuted: target?.isMuted ?? true } });
}

export async function deleteChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const { deleteStoredConversation } = await import('../utils/dataStore.js');
  deleteStoredConversation(id);

  res.status(200).json({ success: true, message: 'Chat deleted successfully.' });
}

export async function pinChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." } });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;

  // 1. Validate conversation exists and current user is participant
  const resolved = await resolveConversation(id);
  if (!resolved) {
    res.status(404).json({ success: false, error: { code: 'CHAT_NOT_FOUND', message: 'Chat topilmadi.' } });
    return;
  }
  if (!resolved.participants.includes(currentUserId)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatda xabarni qadash huquqi yo'q." },
    });
    return;
  }

  // 2. Validate message exists in this conversation
  let targetMsg: any = null;
  if (resolved.isMongo && mongoose.Types.ObjectId.isValid(messageId)) {
    try {
      targetMsg = await Message.findOne({ _id: messageId, conversationId: id, isDeleted: { $ne: true } })
        .populate('senderId', 'displayName username avatar phoneNumber');
    } catch {}
  }
  if (!targetMsg) {
    const stored = getStoredMessage(messageId);
    if (stored && stored.conversationId === id && !stored.isDeleted) {
      targetMsg = stored;
    }
  }

  if (!targetMsg) {
    res.status(404).json({
      success: false,
      error: { code: 'MESSAGE_NOT_FOUND', message: 'Qadaladigan xabar topilmadi.' },
    });
    return;
  }

  // 3. Update in MongoDB if Mongo chat
  if (resolved.isMongo) {
    try {
      await Conversation.findByIdAndUpdate(id, { pinnedMessage: messageId });
    } catch (err) {
      console.error('Mongo pinMessage error:', err);
    }
  }

  // 4. Update dataStore
  const { pinConversationMessage } = await import('../utils/dataStore.js');
  const updated = pinConversationMessage(id, messageId);

  // 5. Emit real-time Socket.IO event
  try {
    const io = getSocketIO();
    if (io) {
      const payload = {
        conversationId: id,
        pinnedMessage: targetMsg,
        pinnedMessageId: messageId,
      };
      io.to(id).to(`chat:${id}`).emit('chat:pinned_message', payload);
      for (const p of resolved.participants) {
        io.to(`user:${p}`).emit('chat:pinned_message', payload);
      }
    }
  } catch {}

  res.status(200).json({ success: true, data: updated || { pinnedMessage: targetMsg, pinnedMessageId: messageId } });
}

export async function unpinChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." } });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  // 1. Validate conversation exists and current user is participant
  const resolved = await resolveConversation(id);
  if (!resolved) {
    res.status(404).json({ success: false, error: { code: 'CHAT_NOT_FOUND', message: 'Chat topilmadi.' } });
    return;
  }
  if (!resolved.participants.includes(currentUserId)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatda xabarni qadashdan chiqarish huquqi yo'q." },
    });
    return;
  }

  // 2. Update MongoDB if active
  if (resolved.isMongo) {
    try {
      await Conversation.findByIdAndUpdate(id, { $unset: { pinnedMessage: 1 } });
    } catch (err) {
      console.error('Mongo unpinMessage error:', err);
    }
  }

  // 3. Update dataStore
  const { unpinConversationMessage } = await import('../utils/dataStore.js');
  const updated = unpinConversationMessage(id);

  // 4. Emit real-time Socket.IO event
  try {
    const io = getSocketIO();
    if (io) {
      const payload = {
        conversationId: id,
        pinnedMessage: null,
        pinnedMessageId: null,
      };
      io.to(id).to(`chat:${id}`).emit('chat:pinned_message', payload);
      for (const p of resolved.participants) {
        io.to(`user:${p}`).emit('chat:pinned_message', payload);
      }
    }
  } catch {}

  res.status(200).json({ success: true, data: updated || { pinnedMessage: null, pinnedMessageId: null } });
}
