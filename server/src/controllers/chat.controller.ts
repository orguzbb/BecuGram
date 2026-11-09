import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import {
  getUserConversations,
  addOrUpdateConversation,
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
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (mongoose.connection.readyState !== 1) {
    const chats = getUserConversations(currentUserId);
    const match = chats.find((c) => c._id === id) || chats[0];
    res.status(200).json({ success: true, data: match });
    return;
  }

  try {
    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    })
      .populate('participants', 'displayName username avatar isOnline lastSeen isVerified phoneNumber')
      .populate('groupId')
      .populate('lastMessage');

    if (!conversation) {
      const chats = getUserConversations(currentUserId);
      const match = chats.find((c) => c._id === id) || chats[0];
      res.status(200).json({ success: true, data: match });
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
  } catch {
    const chats = getUserConversations(currentUserId);
    res.status(200).json({ success: true, data: chats[0] });
  }
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
  const currentUserId = req.user?.userId || 'user_default';
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const chats = getUserConversations(currentUserId);
  const updated = chats.filter((c) => c._id !== id);
  getUserConversations(currentUserId); // ensures directory
  const { saveUserConversations } = await import('../utils/dataStore.js');
  saveUserConversations(updated);

  res.status(200).json({ success: true, message: 'Chat deleted successfully.' });
}

export async function pinChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
  const { pinConversationMessage } = await import('../utils/dataStore.js');
  const updated = pinConversationMessage(id, messageId);
  res.status(200).json({ success: true, data: updated });
}

export async function unpinChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { unpinConversationMessage } = await import('../utils/dataStore.js');
  const updated = unpinConversationMessage(id);
  res.status(200).json({ success: true, data: updated });
}
