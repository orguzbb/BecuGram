import { Router } from 'express';
import { uploadMedia } from '../controllers/media.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

export const mediaRouter = Router();

mediaRouter.use(requireAuth);

mediaRouter.post('/upload', upload.single('file'), uploadMedia);

