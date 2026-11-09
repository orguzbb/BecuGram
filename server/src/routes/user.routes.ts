import { Router } from 'express';
import { getMe, updateMe, searchUsers, getUserByUsername } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', getMe);
userRouter.patch('/me', updateMe);
userRouter.get('/search', searchUsers);
userRouter.get('/:username', getUserByUsername);

