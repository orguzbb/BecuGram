import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getGifs, createGif, removeGif } from '../controllers/gif.controller.js';

export const gifRouter = Router();

gifRouter.use(requireAuth);

// Anyone logged in can get GIFs
gifRouter.get('/', getGifs);

// Only admins can add or remove GIFs
gifRouter.post('/', requireAdmin, createGif);
gifRouter.delete('/:id', requireAdmin, removeGif);
