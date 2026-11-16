import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  getStickers,
  createStickerPack,
  createSticker,
  removeSticker,
} from '../controllers/sticker.controller.js';

export const stickerRouter = Router();

stickerRouter.use(requireAuth);

stickerRouter.get('/', getStickers);
stickerRouter.post('/pack', requireAdmin, createStickerPack);
stickerRouter.post('/', requireAdmin, createSticker);
stickerRouter.delete('/:id', requireAdmin, removeSticker);
