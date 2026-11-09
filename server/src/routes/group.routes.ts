import { Router } from 'express';
import { getGroups, createGroup, getGroupById, addMemberToGroup, removeMemberFromGroup } from '../controllers/group.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const groupRouter = Router();

groupRouter.use(requireAuth);

groupRouter.get('/', getGroups);
groupRouter.post('/', createGroup);
groupRouter.get('/:id', getGroupById);
groupRouter.post('/:id/members', addMemberToGroup);
groupRouter.delete('/:id/members/:userId', removeMemberFromGroup);

