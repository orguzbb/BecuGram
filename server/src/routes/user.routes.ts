import { Router } from 'express';
import {
  getMe,
  updateMe,
  searchUsers,
  getUserByUsername,
  toggleBlockUserHandler,
  getBlockedUsersHandler,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', getMe);
userRouter.patch('/me', updateMe);
userRouter.get('/search', searchUsers);
userRouter.get('/blocked', getBlockedUsersHandler);
userRouter.post('/toggle-block/:userId', toggleBlockUserHandler);
userRouter.get('/:username', getUserByUsername);

