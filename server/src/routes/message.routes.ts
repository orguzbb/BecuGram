import { Router } from 'express';
import { editMessage, deleteMessage, reactToMessage, forwardMessages } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.post('/forward', forwardMessages);
messageRouter.patch('/:id', editMessage);
messageRouter.delete('/:id', deleteMessage);
messageRouter.post('/:id/react', reactToMessage);


