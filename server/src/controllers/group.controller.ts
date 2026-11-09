import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Group } from '../models/Group.js';
import { GroupMember } from '../models/GroupMember.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';
import {
  getUserGroups,
  createStoredGroup,
  addOrUpdateConversation,
  StoredGroup,
  StoredConversation,
} from '../utils/dataStore.js';

export async function getGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';

  if (mongoose.connection.readyState !== 1) {
    const data = getUserGroups(currentUserId);
    res.status(200).json({ success: true, data });
    return;
  }

  try {
    const userMemberships = await GroupMember.find({ userId: currentUserId }).select('groupId');
    const groupIds = userMemberships.map((m) => m.groupId);

    const myGroups = await Group.find({ _id: { $in: groupIds } })
      .populate('creatorId', 'displayName username avatar');

    const communities = await Group.find({ isPublic: true, _id: { $nin: groupIds } })
      .limit(20)
      .populate('creatorId', 'displayName username avatar');

    res.status(200).json({
      success: true,
      data: {
        myGroups,
        communities,
      },
    });
  } catch {
    const data = getUserGroups(currentUserId);
    res.status(200).json({ success: true, data });
  }
}

export async function createGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const { name, description = '', isPublic = false, memberIds = [] } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Guruh nomi kiritilishi shart.' },
    });
    return;
  }

  const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const convId = `conv_${groupId}`;

  const newGroup: StoredGroup = {
    _id: groupId,
    creatorId: currentUserId,
    name: name.trim(),
    description: description.trim(),
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
    memberCount: (memberIds.length || 0) + 1,
    isPublic: Boolean(isPublic),
    createdAt: new Date().toISOString(),
  };

  createStoredGroup(newGroup);

  const groupConv: StoredConversation = {
    _id: convId,
    type: 'group',
    participants: [currentUserId, ...memberIds],
    group: newGroup,
    lastMessage: {
      type: 'text',
      content: `Guruh "${name}" yaratildi 🎉`,
      createdAt: new Date().toISOString(),
    },
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    createdAt: new Date().toISOString(),
  };

  addOrUpdateConversation(groupConv);

  res.status(201).json({
    success: true,
    data: {
      group: newGroup,
      conversationId: convId,
    },
  });
}

export async function getGroupById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const data = getUserGroups(currentUserId);
  const match = [...data.myGroups, ...data.communities].find((g) => g._id === id);

  res.status(200).json({
    success: true,
    data: match || { _id: id, name: 'Guruh', memberCount: 1 },
  });
}

export async function addMemberToGroup(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({ success: true, message: 'A\'zo qo\'shildi.' });
}

export async function removeMemberFromGroup(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({ success: true, message: 'A\'zo o\'chirildi.' });
}

export async function leaveGroup(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({ success: true, message: 'Guruhdan chiqildi.' });
}
