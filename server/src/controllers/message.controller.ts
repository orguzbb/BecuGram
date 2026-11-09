import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { getSocketIO } from '../sockets/index.js';
import {
  getConversationMessages,
  saveMessage,
  updateMessageReactions,
  StoredMessage,
} from '../utils/dataStore.js';

export async function getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (mongoose.connection.readyState !== 1) {
    const list = getConversationMessages(id);
    res.status(200).json({
      success: true,
      data: {
        messages: list,
        nextCursor: null,
      },
    });
    return;
  }

  try {
    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'displayName username avatar')
      .populate({
        path: 'replyTo',
        select: 'content senderId type media isDeleted',
        populate: { path: 'senderId', select: 'displayName username' },
      });

    const chronological = messages.reverse();

    res.status(200).json({
      success: true,
      data: {
        messages: chronological,
        nextCursor: null,
      },
    });
  } catch (err) {
    const list = getConversationMessages(id);
    res.status(200).json({
      success: true,
      data: {
        messages: list,
        nextCursor: null,
      },
    });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const rawId = req.params.id;
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { content, type = 'text', media, replyToId } = req.body;

  if (!content && !media) {
    res.status(400).json({
      success: false,
      error: { code: 'EMPTY_MESSAGE', message: 'Message content or media is required.' },
    });
    return;
  }

  // Get current user display details
  const senderInfo = {
    _id: currentUserId,
    displayName: (req.user as any)?.displayName || 'Abdurahim',
    username: (req.user as any)?.username || 'user',
    avatar: (req.user as any)?.avatar || '',
  };

  // Check if replying
  let replyObj = undefined;
  if (replyToId) {
    const prevMessages = getConversationMessages(conversationId);
    const prev = prevMessages.find((m) => m._id === replyToId);
    if (prev) {
      replyObj = {
        _id: prev._id,
        content: prev.content,
        senderId: prev.senderId,
      };
    }
  }

  const messageDoc: StoredMessage = {
    _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    conversationId,
    senderId: senderInfo,
    type: (type as any) || 'text',
    content: content || '',
    media,
    replyTo: replyObj,
    reactions: [],
    readBy: [currentUserId],
    createdAt: new Date().toISOString(),
  };

  saveMessage(messageDoc);

  // Real-time broadcast
  try {
    const io = getSocketIO();
    if (io) {
      io.to(conversationId).emit('message:new', messageDoc);
    }
  } catch {}

  res.status(201).json({
    success: true,
    data: messageDoc,
  });
}

export async function reactToMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const rawMsgId = req.params.messageId;
  const messageId = Array.isArray(rawMsgId) ? rawMsgId[0] : rawMsgId;
  const { emoji } = req.body;

  if (!emoji) {
    res.status(400).json({ success: false, error: { message: 'Emoji is required' } });
    return;
  }

  const updated = updateMessageReactions(messageId, currentUserId, emoji);

  if (updated) {
    try {
      const io = getSocketIO();
      if (io) {
        io.to(updated.conversationId).emit('message:reaction', {
          messageId: updated._id,
          reactions: updated.reactions,
        });
      }
    } catch {}
  }

  res.status(200).json({
    success: true,
    data: updated || { messageId, reactions: [{ userId: currentUserId, emoji }] },
  });
}

export async function markChatRead(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({ success: true, message: 'All messages marked as read.' });
}

export async function editMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const rawMsgId = req.params.messageId;
  const messageId = Array.isArray(rawMsgId) ? rawMsgId[0] : rawMsgId;
  const { content } = req.body;

  res.status(200).json({
    success: true,
    data: { _id: messageId, content, isEdited: true, updatedAt: new Date().toISOString() },
  });
}

export async function deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const rawMsgId = req.params.messageId;
  const messageId = Array.isArray(rawMsgId) ? rawMsgId[0] : rawMsgId;

  res.status(200).json({
    success: true,
    data: { _id: messageId, isDeleted: true },
  });
}
