import { Router } from 'express';
import { editMessage, deleteMessage, reactToMessage } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.patch('/:id', editMessage);
messageRouter.delete('/:id', deleteMessage);
messageRouter.post('/:id/react', reactToMessage);

