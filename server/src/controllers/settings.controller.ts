import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';

const DEFAULT_SETTINGS = {
  account: {
    phoneNumber: '+998889008081',
    username: 'abdurahim',
    displayName: 'Abdurahim',
    avatar: '',
  },
  privacySettings: {
    lastSeenVisibility: 'everyone',
    phoneVisibility: 'everyone',
    profilePhotoVisibility: 'everyone',
  },
  notificationSettings: {
    privateChats: true,
    groupChats: true,
    soundEnabled: true,
    messagePreview: true,
  },
  appearanceSettings: {
    theme: 'dark',
    accentColor: '#35CBA0',
    fontSize: 'medium',
  },
};

export async function getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId;

  if (mongoose.connection.readyState !== 1) {
    res.status(200).json({ success: true, data: DEFAULT_SETTINGS });
    return;
  }

  try {
    const user = await User.findById(currentUserId).select(
      'privacySettings notificationSettings appearanceSettings phoneNumber username displayName avatar'
    );

    if (!user) {
      res.status(200).json({ success: true, data: DEFAULT_SETTINGS });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        account: {
          phoneNumber: user.phoneNumber,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        },
        privacySettings: user.privacySettings,
        notificationSettings: user.notificationSettings,
        appearanceSettings: user.appearanceSettings,
      },
    });
  } catch {
    res.status(200).json({ success: true, data: DEFAULT_SETTINGS });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: DEFAULT_SETTINGS,
  });
}
