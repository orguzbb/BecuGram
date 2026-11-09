import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { getStoredUser, saveStoredUser, getAllStoredUsers, StoredUser } from '../utils/dataStore.js';
import { validateUsername } from '../utils/validators.js';

function getMemoryDefaultUser(userId: string, username?: string, phoneNumber?: string): StoredUser {
  const existing = getStoredUser(userId);
  if (existing) return existing;

  const newUser: StoredUser = {
    _id: userId,
    displayName: username || 'Abdurahim',
    username: username || 'abdurahim',
    phoneNumber: phoneNumber || '+998889008081',
    avatar: '',
    bio: 'BecuGram a\'zosi 🚀',
    isVerified: true,
    isOnline: true,
    createdAt: new Date().toISOString(),
  };

  saveStoredUser(newUser);
  return newUser;
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId || 'user_1';

  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findById(userId);
      if (user) {
        res.status(200).json({ success: true, data: user });
        return;
      }
    } catch {}
  }

  const memoryUser = getMemoryDefaultUser(userId, req.user?.username, req.user?.phoneNumber);
  res.status(200).json({
    success: true,
    data: {
      ...memoryUser,
      privacySettings: { lastSeenVisibility: 'everyone', phoneVisibility: 'everyone', profilePhotoVisibility: 'everyone' },
      notificationSettings: { privateChats: true, groupChats: true, soundEnabled: true, messagePreview: true },
      appearanceSettings: { theme: 'dark', accentColor: '#35CBA0', fontSize: 'medium' },
    },
  });
}

export async function updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId || 'user_1';
  const { displayName, username, bio, avatar, privacySettings, notificationSettings, appearanceSettings } = req.body;

  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findById(userId);
      if (user) {
        if (username && username.toLowerCase() !== user.username) {
          const cleanUsername = username.toLowerCase().trim().replace(/^@/, '');
          const check = validateUsername(cleanUsername);
          if (!check.isValid) {
            res.status(400).json({
              success: false,
              error: { code: 'INVALID_USERNAME', message: check.error || 'Noto‘g‘ri foydalanuvchi nomi' },
            });
            return;
          }
          const existing = await User.findOne({ username: cleanUsername });
          if (existing) {
            res.status(409).json({
              success: false,
              error: { code: 'USERNAME_TAKEN', message: 'This username is already taken. Please choose another.' },
            });
            return;
          }
          user.username = cleanUsername;
        }

        if (displayName) user.displayName = displayName.trim();
        if (bio !== undefined) user.bio = bio.trim();
        if (avatar !== undefined) user.avatar = avatar;
        if (privacySettings) user.privacySettings = { ...user.privacySettings, ...privacySettings };
        if (notificationSettings) user.notificationSettings = { ...user.notificationSettings, ...notificationSettings };
        if (appearanceSettings) user.appearanceSettings = { ...user.appearanceSettings, ...appearanceSettings };

        await user.save();
        res.status(200).json({ success: true, data: user });
        return;
      }
    } catch {}
  }

  // Fallback to memory/JSON persistence
  const memoryUser = getMemoryDefaultUser(userId, req.user?.username, req.user?.phoneNumber);
  if (displayName) memoryUser.displayName = displayName.trim();
  if (username) memoryUser.username = username.toLowerCase().trim();
  if (bio !== undefined) memoryUser.bio = bio.trim();
  if (avatar !== undefined) memoryUser.avatar = avatar;

  saveStoredUser(memoryUser);

  res.status(200).json({
    success: true,
    data: {
      ...memoryUser,
      privacySettings: privacySettings || { lastSeenVisibility: 'everyone', phoneVisibility: 'everyone' },
      notificationSettings: notificationSettings || { privateChats: true, groupChats: true },
      appearanceSettings: appearanceSettings || { theme: 'dark', accentColor: '#35CBA0' },
    },
  });
}

export async function searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = (req.query.q as string)?.trim() || '';
  const currentUserId = req.user?.userId;

  if (!query) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');

      const users = await User.find({
        _id: { $ne: currentUserId },
        $or: [
          { username: searchRegex },
          { displayName: searchRegex },
          { phoneNumber: searchRegex },
        ],
      })
        .select('displayName username avatar bio isOnline lastSeen isVerified phoneNumber privacySettings')
        .limit(20);

      const sanitized = users.map((u) => {
        const obj = u.toObject();
        if (obj.privacySettings?.phoneVisibility === 'nobody') {
          delete (obj as any).phoneNumber;
        }
        return obj;
      });

      res.status(200).json({ success: true, data: sanitized });
      return;
    } catch {}
  }

  // Fallback in-memory
  const allUsers = getAllStoredUsers();
  const qLower = query.toLowerCase();
  const matched = allUsers
    .filter((u) => u._id !== currentUserId)
    .filter((u) =>
      (u.username && u.username.toLowerCase().includes(qLower)) ||
      (u.displayName && u.displayName.toLowerCase().includes(qLower)) ||
      (u.phoneNumber && u.phoneNumber.includes(query))
    );
  res.status(200).json({ success: true, data: matched });
}

export async function getUserByUsername(req: AuthenticatedRequest, res: Response): Promise<void> {
  const username = (Array.isArray(req.params.username) ? req.params.username[0] : req.params.username) || '';
  const currentUserId = req.user?.userId;

  if (mongoose.connection.readyState === 1) {
    try {
      const targetUser = await User.findOne({ username: username.toLowerCase() });
      if (targetUser) {
        let sharedStats = { photos: 0, videos: 0, files: 0, links: 0 };
        const result = targetUser.toObject();
        if (result.privacySettings?.phoneVisibility === 'nobody' && currentUserId !== targetUser._id.toString()) {
          delete (result as any).phoneNumber;
        }

        res.status(200).json({
          success: true,
          data: {
            ...result,
            sharedStats,
          },
        });
        return;
      }
    } catch {}
  }

  // Memory fallback - look up strictly registered users
  const allUsers = getAllStoredUsers();
  const found = allUsers.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() ||
      u._id === username ||
      u.phoneNumber === username
  );

  if (found) {
    res.status(200).json({
      success: true,
      data: {
        ...found,
        sharedStats: { photos: 0, videos: 0, files: 0, links: 0 },
      },
    });
    return;
  }

  res.status(404).json({
    success: false,
    error: {
      code: 'USER_NOT_FOUND',
      message: "Bunday foydalanuvchi topilmadi.",
    },
  });
}
