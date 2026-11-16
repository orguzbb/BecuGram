import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { getSocketIO } from '../sockets/index.js';
import { storageProvider } from '../storage/index.js';
import {
  getStoredConversation,
  getConversationMessages,
  getAllConversationMessages,
  getStoredMessage,
  saveMessage,
  updateStoredMessage,
  updateMessageReactions,
  deleteStoredMessage,
  markStoredMessagesRead,
  getStoredUser,
  StoredMessage,
} from '../utils/dataStore.js';

/**
 * Helper to resolve conversation by ID and check membership across both MongoDB and dataStore
 */
export async function resolveConversation(conversationId: string): Promise<{
  conversation: any;
  isMongo: boolean;
  participants: string[];
} | null> {
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(conversationId)) {
    try {
      const conv = await Conversation.findById(conversationId);
      if (conv) {
        const participants = (conv.participants || []).map((p: any) =>
          typeof p === 'object' && p?._id ? p._id.toString() : p.toString()
        );
        return { conversation: conv, isMongo: true, participants };
      }
    } catch {}
  }

  const storedConv = getStoredConversation(conversationId);
  if (storedConv) {
    const participants = (storedConv.participants || []).map((p: any) =>
      typeof p === 'object' && p?._id ? p._id.toString() : p.toString()
    );
    return { conversation: storedConv, isMongo: false, participants };
  }

  return null;
}

/**
 * GET /api/chats/:id/messages
 * Retrieves paginated messages for a conversation
 */
export async function getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." },
    });
    return;
  }

  const rawId = req.params.id;
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;

  // 1. Validate Conversation Existence & Membership
  const resolved = await resolveConversation(conversationId);
  if (!resolved) {
    res.status(404).json({
      success: false,
      error: { code: 'CHAT_NOT_FOUND', message: 'Chat topilmadi.' },
    });
    return;
  }

  if (!resolved.participants.includes(currentUserId)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chat xabarlarini ko'rish huquqi yo'q." },
    });
    return;
  }

  // 2. Parse Cursor Pagination Options
  const rawLimit = Number(req.query.limit);
  const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 100);
  const before = (req.query.before || req.query.cursor) as string | undefined;

  // 3. Fetch from MongoDB if Mongo Chat
  if (resolved.isMongo) {
    try {
      const query: any = {
        conversationId,
        isDeleted: { $ne: true },
        deletedFor: { $ne: currentUserId },
      };

      if (before) {
        if (mongoose.Types.ObjectId.isValid(before)) {
          const cursorMsg = await Message.findById(before).select('createdAt');
          if (cursorMsg) {
            query.createdAt = { $lt: cursorMsg.createdAt };
          }
        } else {
          const parsedDate = new Date(before);
          if (!isNaN(parsedDate.getTime())) {
            query.createdAt = { $lt: parsedDate };
          }
        }
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .populate('senderId', 'displayName username avatar phoneNumber')
        .populate({
          path: 'replyTo',
          select: 'content senderId type media isDeleted',
          populate: { path: 'senderId', select: 'displayName username' },
        });

      const hasMore = messages.length > limit;
      const sliced = hasMore ? messages.slice(0, limit) : messages;
      const chronological = sliced.reverse();
      const nextCursor = hasMore && chronological.length > 0 ? chronological[0].createdAt.toISOString() : null;

      res.status(200).json({
        success: true,
        data: {
          messages: chronological,
          nextCursor,
        },
      });
      return;
    } catch (err) {
      console.error('Mongo getMessages error, falling back to dataStore:', err);
    }
  }

  // 4. Fetch from dataStore
  const { messages, nextCursor } = getConversationMessages(conversationId, {
    before,
    limit,
    userId: currentUserId,
  });
  res.status(200).json({
    success: true,
    data: {
      messages,
      nextCursor,
    },
  });
}

/**
 * POST /api/chats/:id/messages
 * Sends a new message with deduplication & validation
 */
export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." },
    });
    return;
  }

  const rawId = req.params.id;
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { content, type = 'text', media, replyToId, clientTempId, forwardedFrom } = req.body;

  // 1. Content validation
  if (!content?.trim() && !media && type !== 'sticker') {
    res.status(400).json({
      success: false,
      error: { code: 'EMPTY_MESSAGE', message: 'Xabar matni yoki media fayli talab qilinadi.' },
    });
    return;
  }

  // 2. Validate Conversation Existence & Membership
  const resolved = await resolveConversation(conversationId);
  if (!resolved) {
    res.status(404).json({
      success: false,
      error: { code: 'CHAT_NOT_FOUND', message: 'Chat topilmadi.' },
    });
    return;
  }

  if (!resolved.participants.includes(currentUserId)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatga xabar yuborish huquqi yo'q." },
    });
    return;
  }

  // 3. Check Block List in Direct Chats
  const currentChat = resolved.conversation;
  if (currentChat && currentChat.type === 'direct') {
    const partnerId = resolved.participants.find((p) => p !== currentUserId);
    if (partnerId) {
      const senderUser = getStoredUser(currentUserId);
      const partnerUser = getStoredUser(partnerId);

      if (partnerUser?.blockedUsers?.includes(currentUserId)) {
        res.status(403).json({
          success: false,
          error: { code: 'USER_BLOCKED', message: "Siz ushbu foydalanuvchi tomonidan bloklangansiz." },
        });
        return;
      }
      if (senderUser?.blockedUsers?.includes(partnerId)) {
        res.status(403).json({
          success: false,
          error: { code: 'YOU_BLOCKED_USER', message: "Siz bu foydalanuvchini bloklagansiz. Xabar yuborish uchun avval blokdan chiqaring." },
        });
        return;
      }
    }
  }

  // 4. Duplicate Message Prevention using clientTempId
  if (clientTempId) {
    if (resolved.isMongo) {
      try {
        const existing = await Message.findOne({
          conversationId,
          clientTempId,
        })
          .populate('senderId', 'displayName username avatar phoneNumber')
          .populate({
            path: 'replyTo',
            select: 'content senderId type media isDeleted',
            populate: { path: 'senderId', select: 'displayName username' },
          });

        if (existing) {
          res.status(200).json({
            success: true,
            data: existing,
          });
          return;
        }
      } catch {}
    } else {
      const existing = getAllConversationMessages(conversationId).find(
        (m) => m.clientTempId === clientTempId
      );
      if (existing) {
        res.status(200).json({
          success: true,
          data: existing,
        });
        return;
      }
    }
  }

  // 5. Resolve Sender Profile Details
  let senderInfo: any = {
    _id: currentUserId,
    displayName: (req.user as any)?.displayName || 'Foydalanuvchi',
    username: (req.user as any)?.username || 'user',
    avatar: (req.user as any)?.avatar || '',
  };
  const storedSender = getStoredUser(currentUserId);
  if (storedSender) {
    senderInfo = {
      _id: storedSender._id,
      displayName: storedSender.displayName,
      username: storedSender.username,
      avatar: storedSender.avatar || '',
    };
  } else if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(currentUserId)) {
    try {
      const mongoUser = await User.findById(currentUserId).select('displayName username avatar');
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

  // 6. Resolve replyTo
  let replyObj: any = undefined;
  if (replyToId) {
    const prev = getStoredMessage(replyToId);
    if (prev) {
      replyObj = {
        _id: prev._id,
        content: prev.content,
        senderId: prev.senderId,
      };
    } else if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(replyToId)) {
      try {
        const prevMongo = await Message.findById(replyToId).populate('senderId', 'displayName username');
        if (prevMongo) {
          replyObj = {
            _id: prevMongo._id.toString(),
            content: prevMongo.content,
            senderId: prevMongo.senderId,
          };
        }
      } catch {}
    }
  }

  let finalMessage: any = null;

  // 7. Persist to MongoDB if active
  if (resolved.isMongo) {
    try {
      const created = await Message.create({
        conversationId,
        senderId: currentUserId,
        type: (type as any) || 'text',
        content: content?.trim() || '',
        media,
        replyTo: replyToId && mongoose.Types.ObjectId.isValid(replyToId) ? replyToId : undefined,
        clientTempId,
        reactions: [],
        deliveredTo: [currentUserId],
        readBy: [currentUserId],
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

      finalMessage = populated || created;

      // Dual-persistence: backup to dataStore
      saveMessage({
        _id: created._id.toString(),
        conversationId,
        senderId: senderInfo,
        type: (type as any) || 'text',
        content: content?.trim() || '',
        media,
        replyTo: replyObj,
        clientTempId,
        reactions: [],
        readBy: [currentUserId],
        createdAt: created.createdAt.toISOString(),
      });
    } catch (err) {
      console.error('Failed to save to Mongo, saving to dataStore:', err);
    }
  }

  // 8. If not Mongo or Mongo save didn't run, save to dataStore
  if (!finalMessage) {
    const messageDoc: StoredMessage = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      senderId: senderInfo,
      type: (type as any) || 'text',
      content: content?.trim() || '',
      media,
      replyTo: replyObj,
      clientTempId,
      forwardedFrom,
      reactions: [],
      readBy: [currentUserId],
      createdAt: new Date().toISOString(),
    };

    finalMessage = saveMessage(messageDoc);
  }

  // 9. Real-time Broadcast
  try {
    const io = getSocketIO();
    if (io) {
      io.to(conversationId).to(`chat:${conversationId}`).emit('message:new', finalMessage);
      // Multi-device sync: emit to all participants' personal rooms
      for (const p of resolved.participants) {
        io.to(`user:${p}`).emit('message:new', finalMessage);
      }
    }
  } catch {}

  res.status(201).json({
    success: true,
    data: finalMessage,
  });
}

/**
 * PATCH /api/messages/:id
 * Edits an existing message (validates ownership)
 */
export async function editMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." } });
    return;
  }

  const rawMsgId = req.params.id || req.params.messageId;
  const messageId = Array.isArray(rawMsgId) ? rawMsgId[0] : rawMsgId;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ success: false, error: { code: 'EMPTY_CONTENT', message: 'Yangi matn kiritilishi shart.' } });
    return;
  }

  let conversationId: string | undefined;
  let updatedMessage: any = null;

  // 1. Check MongoDB if active
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(messageId)) {
    try {
      const msg = await Message.findById(messageId);
      if (msg) {
        if (msg.senderId.toString() !== currentUserId) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN_NOT_OWNER', message: "Faqat o'zingiz yuborgan xabarni tahrirlashingiz mumkin." },
          });
          return;
        }

        msg.content = content.trim();
        msg.isEdited = true;
        msg.editedAt = new Date();
        await msg.save();

        conversationId = msg.conversationId.toString();
        updatedMessage = {
          _id: msg._id.toString(),
          conversationId,
          content: msg.content,
          isEdited: true,
          editedAt: msg.editedAt.toISOString(),
          updatedAt: msg.updatedAt.toISOString(),
        };

        // Sync with dataStore
        updateStoredMessage(messageId, {
          content: content.trim(),
          isEdited: true,
          editedAt: msg.editedAt.toISOString(),
        });
      }
    } catch {}
  }

  // 2. Check dataStore if not found in Mongo
  if (!updatedMessage) {
    const stored = getStoredMessage(messageId);
    if (!stored) {
      res.status(404).json({
        success: false,
        error: { code: 'MESSAGE_NOT_FOUND', message: 'Xabar topilmadi.' },
      });
      return;
    }

    const senderId = typeof stored.senderId === 'object' && stored.senderId?._id
      ? stored.senderId._id
      : stored.senderId;

    if (senderId !== currentUserId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_NOT_OWNER', message: "Faqat o'zingiz yuborgan xabarni tahrirlashingiz mumkin." },
      });
      return;
    }

    const now = new Date().toISOString();
    const updated = updateStoredMessage(messageId, {
      content: content.trim(),
      isEdited: true,
      editedAt: now,
      updatedAt: now,
    });

    conversationId = stored.conversationId;
    updatedMessage = updated;
  }

  // 3. Real-time emit
  try {
    const io = getSocketIO();
    if (io && conversationId) {
      io.to(conversationId).to(`chat:${conversationId}`).emit('message:edited', updatedMessage);
      const resolved = await resolveConversation(conversationId);
      if (resolved) {
        for (const p of resolved.participants) {
          io.to(`user:${p}`).emit('message:edited', updatedMessage);
        }
      }
    }
  } catch {}

  res.status(200).json({
    success: true,
    data: updatedMessage,
  });
}

/**
 * DELETE /api/messages/:id
 * Deletes an existing message (validates ownership for everyone, or soft deletes for me)
 */
export async function deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." } });
    return;
  }

  const rawMsgId = req.params.id || req.params.messageId;
  const messageId = Array.isArray(rawMsgId) ? rawMsgId[0] : rawMsgId;
  const forEveryone = req.body?.forEveryone !== false && req.query?.forEveryone !== 'false';

  // 1. Locate message in Mongo or dataStore
  let msgDoc: any = null;
  let isMongo = false;
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(messageId)) {
    try {
      msgDoc = await Message.findById(messageId);
      if (msgDoc) isMongo = true;
    } catch {}
  }
  if (!msgDoc) {
    msgDoc = getStoredMessage(messageId);
  }

  if (!msgDoc) {
    res.status(404).json({
      success: false,
      error: { code: 'MESSAGE_NOT_FOUND', message: 'Xabar topilmadi.' },
    });
    return;
  }

  const conversationId = (msgDoc.conversationId?.toString() || msgDoc.conversationId) as string;
  const senderId = typeof msgDoc.senderId === 'object' && msgDoc.senderId?._id
    ? msgDoc.senderId._id.toString()
    : msgDoc.senderId?.toString();

  // Validate conversation membership
  const resolved = await resolveConversation(conversationId);
  if (resolved && !resolved.participants.includes(currentUserId)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatdagi xabarni o'chirish huquqi yo'q." },
    });
    return;
  }

  if (forEveryone) {
    // Delete for everyone requires ownership
    if (senderId !== currentUserId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_NOT_OWNER', message: "Faqat o'zingiz yuborgan xabarni hammaga o'chirishingiz mumkin." },
      });
      return;
    }

    // Purge underlying media file from storage if present
    if (msgDoc.media?.url && typeof msgDoc.media.url === 'string' && msgDoc.media.url.startsWith('/uploads/')) {
      const storageKey = msgDoc.media.url.replace(/^\/uploads\//, '');
      storageProvider.deleteFile(storageKey).catch(() => {});
    }

    if (isMongo) {
      try {
        await Message.findByIdAndUpdate(messageId, {
          isDeleted: true,
          deletedAt: new Date(),
          content: "Xabar o'chirildi",
          $unset: { media: 1 },
        });

        // Update conversation lastMessage
        const latest = await Message.findOne({ conversationId, isDeleted: { $ne: true } })
          .sort({ createdAt: -1 });
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: latest ? latest._id : undefined,
          lastMessageAt: latest ? latest.createdAt : new Date(),
        });
      } catch (err) {
        console.error('Mongo soft-delete error:', err);
      }
    }
    deleteStoredMessage(messageId, currentUserId, true);

    // Broadcast deletion to all participants
    try {
      const io = getSocketIO();
      if (io) {
        io.to(conversationId).to(`chat:${conversationId}`).emit('message:deleted', {
          messageId,
          conversationId,
          forEveryone: true,
        });
        if (resolved) {
          for (const p of resolved.participants) {
            io.to(`user:${p}`).emit('message:deleted', {
              messageId,
              conversationId,
              forEveryone: true,
            });
          }
        }
      }
    } catch {}
  } else {
    // Delete for myself: allowed for any conversation participant
    if (isMongo) {
      try {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deletedFor: currentUserId },
        });
      } catch (err) {
        console.error('Mongo delete-for-me error:', err);
      }
    }
    deleteStoredMessage(messageId, currentUserId, false);

    // Emit deletion only to current user's personal rooms
    try {
      const io = getSocketIO();
      if (io) {
        io.to(`user:${currentUserId}`).emit('message:deleted', {
          messageId,
          conversationId,
          forEveryone: false,
          deletedForUser: currentUserId,
        });
      }
    } catch {}
  }

  res.status(200).json({
    success: true,
    data: { _id: messageId, isDeleted: forEveryone, deletedForMe: !forEveryone },
  });
}

/**
 * POST /api/messages/:id/react
 * Reacts to a message (toggles emoji)
 */
export async function reactToMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." } });
    return;
  }

  const rawMsgId = req.params.id || req.params.messageId;
  const messageId = Array.isArray(rawMsgId) ? rawMsgId[0] : rawMsgId;
  const { emoji } = req.body;

  if (!emoji) {
    res.status(400).json({ success: false, error: { code: 'EMPTY_EMOJI', message: 'Emoji talab qilinadi.' } });
    return;
  }

  // Verify message existence
  let conversationId: string | undefined;
  let isMongo = false;
  let mongoMsg: any = null;
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(messageId)) {
    try {
      mongoMsg = await Message.findById(messageId);
      if (mongoMsg) {
        conversationId = mongoMsg.conversationId.toString();
        isMongo = true;
      }
    } catch {}
  }

  if (!conversationId) {
    const stored = getStoredMessage(messageId);
    if (stored) {
      conversationId = stored.conversationId;
    }
  }

  if (!conversationId) {
    res.status(404).json({
      success: false,
      error: { code: 'MESSAGE_NOT_FOUND', message: 'Xabar topilmadi.' },
    });
    return;
  }

  // Verify membership in conversation
  const resolved = await resolveConversation(conversationId);
  if (resolved && !resolved.participants.includes(currentUserId)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chat xabariga reaksiya bildirish huquqi yo'q." },
    });
    return;
  }

  // Update MongoDB if active
  if (isMongo && mongoMsg) {
    try {
      const reactions = mongoMsg.reactions || [];
      const existingIdx = reactions.findIndex((r: any) => r.userId?.toString() === currentUserId && r.emoji === emoji);
      if (existingIdx >= 0) {
        reactions.splice(existingIdx, 1);
      } else {
        const withoutUser = reactions.filter((r: any) => r.userId?.toString() !== currentUserId);
        withoutUser.push({ userId: currentUserId, emoji });
        mongoMsg.reactions = withoutUser;
      }
      await mongoMsg.save();
    } catch (err) {
      console.error('Mongo reaction save error:', err);
    }
  }

  const updated = updateMessageReactions(messageId, currentUserId, emoji);
  const finalReactions = updated?.reactions || (mongoMsg ? mongoMsg.reactions : [{ userId: currentUserId, emoji }]);

  try {
    const io = getSocketIO();
    if (io) {
      io.to(conversationId).to(`chat:${conversationId}`).emit('message:reaction', {
        messageId,
        reactions: finalReactions,
      });
      if (resolved) {
        for (const p of resolved.participants) {
          io.to(`user:${p}`).emit('message:reaction', {
            messageId,
            reactions: finalReactions,
          });
        }
      }
    }
  } catch {}

  res.status(200).json({
    success: true,
    data: { messageId, reactions: finalReactions },
  });
}

/**
 * POST /api/messages/forward
 * Forwards one or more messages to one or more conversations
 */
export async function forwardMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." } });
    return;
  }

  const { messageIds, targetConversationIds } = req.body;
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    res.status(400).json({ success: false, error: { code: 'INVALID_MESSAGES', message: 'Kamida bitta xabar tanlanishi kerak.' } });
    return;
  }
  if (!Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
    res.status(400).json({ success: false, error: { code: 'INVALID_TARGETS', message: 'Kamida bitta maqsadli chat tanlanishi kerak.' } });
    return;
  }

  // 1. Validate that current user is participant in all target conversations
  for (const targetConvId of targetConversationIds) {
    const resolvedTarget = await resolveConversation(targetConvId);
    if (!resolvedTarget) {
      res.status(404).json({ success: false, error: { code: 'CHAT_NOT_FOUND', message: `Chat topilmadi: ${targetConvId}` } });
      return;
    }
    if (!resolvedTarget.participants.includes(currentUserId)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: `Ushbu chatga xabar uzatish huquqi yo'q: ${targetConvId}` },
      });
      return;
    }
  }

  // 2. Fetch sender user profile
  let senderInfo: any = { _id: currentUserId, displayName: 'Becu User', username: 'user' };
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(currentUserId)) {
    try {
      const u = await User.findById(currentUserId).select('displayName username avatar phoneNumber');
      if (u) senderInfo = u;
    } catch {}
  }
  if (senderInfo.displayName === 'Becu User') {
    const stored = getStoredUser(currentUserId);
    if (stored) {
      senderInfo = {
        _id: stored._id,
        displayName: stored.displayName,
        username: stored.username,
        avatar: stored.avatar,
        phoneNumber: stored.phoneNumber,
      };
    }
  }

  const forwardedResults: any[] = [];

  for (const targetConvId of targetConversationIds) {
    const resolvedTarget = await resolveConversation(targetConvId);
    if (!resolvedTarget) continue;

    for (const msgId of messageIds) {
      // Find source message
      let srcMsg: any = null;
      if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(msgId)) {
        try {
          srcMsg = await Message.findById(msgId).populate('senderId', 'displayName username');
        } catch {}
      }
      if (!srcMsg) {
        srcMsg = getStoredMessage(msgId);
      }
      if (!srcMsg || srcMsg.isDeleted) continue;

      // Validate user can read source message
      const srcConvId = srcMsg.conversationId?.toString() || srcMsg.conversationId;
      const resolvedSrc = await resolveConversation(srcConvId);
      if (resolvedSrc && !resolvedSrc.participants.includes(currentUserId)) {
        continue; // Prevent unauthorized forwarding from chats user is not member of
      }

      // Determine forwardedFrom
      let forwardedFrom = srcMsg.forwardedFrom;
      if (!forwardedFrom) {
        const origSender = srcMsg.senderId;
        forwardedFrom = {
          _id: origSender?._id?.toString() || (typeof origSender === 'string' ? origSender : undefined),
          displayName: origSender?.displayName || 'Foydalanuvchi',
          username: origSender?.username,
        };
      }

      const clientTempId = crypto.randomUUID();
      let created: any = null;

      if (resolvedTarget.isMongo) {
        try {
          const doc = await Message.create({
            conversationId: targetConvId,
            senderId: currentUserId,
            type: srcMsg.type || 'text',
            content: srcMsg.content || '',
            media: srcMsg.media,
            forwardedFrom,
            clientTempId,
            reactions: [],
            readBy: [currentUserId],
          });
          created = await Message.findById(doc._id).populate('senderId', 'displayName username avatar phoneNumber');
        } catch {}
      }

      if (!created) {
        const messageDoc: StoredMessage = {
          _id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          conversationId: targetConvId,
          senderId: senderInfo,
          type: srcMsg.type || 'text',
          content: srcMsg.content || '',
          media: srcMsg.media,
          forwardedFrom,
          clientTempId,
          reactions: [],
          readBy: [currentUserId],
          createdAt: new Date().toISOString(),
        };
        created = saveMessage(messageDoc);
      }

      forwardedResults.push(created);

      // Real-time broadcast
      try {
        const io = getSocketIO();
        if (io) {
          io.to(targetConvId).to(`chat:${targetConvId}`).emit('message:new', created);
          for (const p of resolvedTarget.participants) {
            io.to(`user:${p}`).emit('message:new', created);
          }
        }
      } catch {}
    }
  }

  res.status(201).json({
    success: true,
    data: forwardedResults,
  });
}

/**
 * POST /api/chats/:id/read
 * Marks messages in conversation as read and broadcasts read receipts
 */
export async function markChatRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;
  if (!currentUserId) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: "Avtorizatsiyadan o'ting." } });
    return;
  }

  const rawId = req.params.id;
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const messageIds = req.body?.messageIds as string[] | undefined;

  const resolved = await resolveConversation(conversationId);
  if (!resolved) {
    res.status(404).json({ success: false, error: { code: 'CHAT_NOT_FOUND', message: 'Chat topilmadi.' } });
    return;
  }

  if (!resolved.participants.includes(currentUserId)) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN_NOT_PARTICIPANT', message: "Ushbu chatga kirish huquqi yo'q." } });
    return;
  }

  const readAt = new Date().toISOString();
  const readMessageIds: string[] = [];

  // 1. Mark in MongoDB if active
  if (resolved.isMongo) {
    try {
      const query: any = {
        conversationId,
        senderId: { $ne: currentUserId },
        readBy: { $ne: currentUserId },
      };
      if (messageIds && messageIds.length > 0) {
        query._id = { $in: messageIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) };
      }

      const unreadMsgs = await Message.find(query).select('_id');
      readMessageIds.push(...unreadMsgs.map((m) => m._id.toString()));

      if (unreadMsgs.length > 0) {
        await Message.updateMany(
          { _id: { $in: unreadMsgs.map((m) => m._id) } },
          { $addToSet: { readBy: currentUserId } }
        );
      }

      await Conversation.findByIdAndUpdate(conversationId, {
        [`unreadCounts.${currentUserId}`]: 0,
      });
    } catch (err) {
      console.error('Mongo markChatRead error:', err);
    }
  }

  // 2. Mark in dataStore
  const dataStoreReadIds = markStoredMessagesRead(conversationId, currentUserId, messageIds);
  for (const id of dataStoreReadIds) {
    if (!readMessageIds.includes(id)) readMessageIds.push(id);
  }

  // 3. Real-time broadcast
  try {
    const io = getSocketIO();
    if (io) {
      const receiptPayload = {
        conversationId,
        readerId: currentUserId,
        messageIds: readMessageIds,
        readAt,
      };

      io.to(conversationId).to(`chat:${conversationId}`).emit('message:read_receipt', receiptPayload);
      io.to(`user:${currentUserId}`).emit('chat:unread_reset', { conversationId });

      for (const p of resolved.participants) {
        if (p !== currentUserId) {
          io.to(`user:${p}`).emit('message:read_receipt', receiptPayload);
        }
      }
    }
  } catch {}

  res.status(200).json({
    success: true,
    data: {
      conversationId,
      readerId: currentUserId,
      messageIds: readMessageIds,
      readAt,
    },
  });
}
