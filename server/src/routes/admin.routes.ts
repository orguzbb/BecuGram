import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  toggleUserBan,
  getUserMessages,
  getUserChatSummary,
  getAdminConversations,
  deleteAdminConversation,
  deleteAdminMessage,
  broadcastAnnouncement,
  testSendSms,
} from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const adminRouter = Router();

// Protect ALL admin routes with both JWT auth AND Super Admin role check
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/stats', getAdminStats);
adminRouter.get('/users', getAdminUsers);
adminRouter.post('/users/:userId/ban', toggleUserBan);
adminRouter.get('/users/:userId/messages', getUserMessages);
adminRouter.get('/users/:userId/conversations', getUserChatSummary);

adminRouter.get('/conversations', getAdminConversations);
adminRouter.delete('/conversations/:id', deleteAdminConversation);
adminRouter.delete('/messages/:id', deleteAdminMessage);

adminRouter.post('/broadcast', broadcastAnnouncement);
adminRouter.post('/test-sms', testSendSms);

