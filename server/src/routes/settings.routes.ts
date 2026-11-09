import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get('/', getSettings);
settingsRouter.patch('/', updateSettings);

