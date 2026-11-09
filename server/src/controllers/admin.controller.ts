import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { eskizService } from '../services/eskiz.service.js';
import {
  getAllStoredUsers,
  banStoredUser,
  getAllStoredConversations,
  getAllStoredMessages,
  deleteStoredMessageAdmin,
  deleteStoredConversationAdmin,
  getStoredStats,
  saveMessage,
  StoredMessage,
  getUserChatActivity,
} from '../utils/dataStore.js';
import { getSocketIO } from '../sockets/index.js';

export async function getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const stats = getStoredStats();
  const smsStatus = await eskizService.getStatus();

  res.status(200).json({
    success: true,
    data: {
      ...stats,
      smsProvider: {
        provider: 'Eskiz.uz',
        isConfigured: smsStatus.configured,
        details: smsStatus.balance || null,
        error: smsStatus.error || null,
      },
      systemTime: new Date().toISOString(),
    },
  });
}

export async function getAdminUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const users = getAllStoredUsers();
  const allMessages = getAllStoredMessages();

  // Annotate each user with their message count
  const annotated = users.map((u) => {
    const msgCount = allMessages.filter(
      (m) => (typeof m.senderId === 'object' ? m.senderId?._id === u._id : m.senderId === u._id)
    ).length;

    return {
      ...u,
      messageCount: msgCount,
    };
  });

  res.status(200).json({
    success: true,
    data: annotated,
  });
}

export async function toggleUserBan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const rawId = req.params.userId;
  const userId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { isBanned, reason } = req.body;

  const updated = banStoredUser(userId, Boolean(isBanned), reason);
  if (!updated) {
    res.status(404).json({ success: false, error: { message: 'Foydalanuvchi topilmadi' } });
    return;
  }

  // If user is banned, notify via socket
  if (isBanned) {
    try {
      const io = getSocketIO();
      if (io) {
        io.to(`user:${userId}`).emit('user:banned', { reason: reason || 'Bloklandi' });
      }
    } catch {}
  }

  res.status(200).json({
    success: true,
    data: updated,
    message: isBanned ? 'Foydalanuvchi bloklandi.' : 'Foydalanuvchi blokdan chiqarildi.',
  });
}

export async function getUserMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const rawId = req.params.userId;
  const userId = Array.isArray(rawId) ? rawId[0] : rawId;

  const allMessages = getAllStoredMessages();
  const userMessages = allMessages.filter(
    (m) => (typeof m.senderId === 'object' ? m.senderId?._id === userId : m.senderId === userId)
  );

  res.status(200).json({
    success: true,
    data: userMessages,
  });
}

export async function getUserChatSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const rawId = req.params.userId;
  const userId = Array.isArray(rawId) ? rawId[0] : rawId;

  const activity = getUserChatActivity(userId);
  res.status(200).json({
    success: true,
    data: activity,
  });
}

export async function getAdminConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const chats = getAllStoredConversations();
  const allMessages = getAllStoredMessages();

  const annotated = chats.map((c) => {
    const chatMsgs = allMessages.filter((m) => m.conversationId === c._id);
    return {
      ...c,
      messageCount: chatMsgs.length,
    };
  });

  res.status(200).json({
    success: true,
    data: annotated,
  });
}

export async function deleteAdminConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const rawId = req.params.id;
  const convId = Array.isArray(rawId) ? rawId[0] : rawId;

  const deleted = deleteStoredConversationAdmin(convId);
  res.status(200).json({
    success: true,
    data: { deleted },
    message: 'Suhbat va uning barcha xabarlari o\'chirildi.',
  });
}

export async function deleteAdminMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const rawId = req.params.id;
  const msgId = Array.isArray(rawId) ? rawId[0] : rawId;

  const deleted = deleteStoredMessageAdmin(msgId);
  res.status(200).json({
    success: true,
    data: { deleted },
    message: 'Xabar tizimdan butunlay o\'chirildi.',
  });
}

export async function broadcastAnnouncement(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { title, content } = req.body;

  if (!content) {
    res.status(400).json({ success: false, error: { message: 'Xabar matni kiritilishi shart.' } });
    return;
  }

  const allChats = getAllStoredConversations();
  const io = getSocketIO();

  for (const chat of allChats) {
    const broadcastMsg: StoredMessage = {
      _id: `msg_broadcast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: chat._id,
      senderId: {
        _id: 'system_admin',
        displayName: 'BecuGram Admin ✨',
        username: 'admin',
        avatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
      },
      type: 'text',
      content: `📢 [${title || 'E\'LON'}]:\n${content}`,
      createdAt: new Date().toISOString(),
    };

    saveMessage(broadcastMsg);

    if (io) {
      try {
        io.to(chat._id).emit('message:new', broadcastMsg);
      } catch {}
    }
  }

  res.status(200).json({
    success: true,
    message: `E'lon ${allChats.length} ta suhbatga muvaffaqiyatli yuborildi.`,
  });
}

export async function testSendSms(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber) {
    res.status(400).json({ success: false, error: { message: 'Telefon raqam kiritilishi shart.' } });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const result = await eskizService.sendOtpSms(phoneNumber, code);

  res.status(200).json({
    success: true,
    data: {
      ...result,
      code,
      phoneNumber,
    },
    message: result.simulated
      ? 'SMS simulyatsiya qilindi (Eskiz hisobi ulanmagan, konsolda ko\'rishingiz mumkin).'
      : 'SMS Eskiz.uz orqali haqiqiy raqamga yuborildi!',
  });
}

