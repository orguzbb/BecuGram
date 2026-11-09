import { Router } from 'express';
import { startAuth, getAuthStatus, devPair, verifyAuth, refresh, logout, completeProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/start', startAuth);
authRouter.get('/status/:challengeId', getAuthStatus);
authRouter.post('/dev-pair', devPair);
authRouter.post('/verify', verifyAuth);
authRouter.post('/complete-profile', requireAuth, completeProfile);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);

