import { Router } from 'express';
import {
  getChats,
  getOrCreateDirectChat,
  getChatById,
  togglePinChat,
  toggleMuteChat,
  deleteChat,
  pinChatMessage,
  unpinChatMessage,
} from '../controllers/chat.controller.js';
import { getMessages, sendMessage, markChatRead } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get('/', getChats);
chatRouter.post('/', getOrCreateDirectChat);
chatRouter.get('/:id', getChatById);
chatRouter.delete('/:id', deleteChat);
chatRouter.patch('/:id/pin', togglePinChat);
chatRouter.patch('/:id/mute', toggleMuteChat);

// Pinned message routes
chatRouter.post('/:id/pin-message/:messageId', pinChatMessage);
chatRouter.delete('/:id/pin-message', unpinChatMessage);

// Chat messages sub-routes
chatRouter.get('/:id/messages', getMessages);
chatRouter.post('/:id/messages', sendMessage);
chatRouter.post('/:id/read', markChatRead);

