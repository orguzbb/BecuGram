import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { AuthChallenge } from '../models/AuthChallenge.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { normalizePhoneNumber, isValidPhoneNumber } from '../utils/phone.js';
import { generatePairingToken, generateSixDigitOtp, hashOtp, verifyOtpHash } from '../utils/otp.js';
import { signAccessToken, signRefreshToken, setRefreshTokenCookie, clearRefreshTokenCookie, verifyRefreshToken } from '../utils/jwt.js';
import { getSavedTelegramChatId, sendTelegramOtp } from '../utils/telegramSend.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

import { eskizService } from '../services/eskiz.service.js';
import { getStoredUser, saveStoredUser, getAllStoredUsers } from '../utils/dataStore.js';

// In-memory fallback stores when MongoDB is not connected
export const memoryChallenges = new Map<string, any>();
export const memoryUsers = new Map<string, any>();

function getBotSavedOtp(phoneNumber: string): string | undefined {
  try {
    // Check both cwd and root for bot_otps.json
    const paths = [
      path.resolve(process.cwd(), 'bot_otps.json'),
      path.resolve(process.cwd(), '..', 'bot_otps.json'),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        const store = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (store[phoneNumber]) {
          return store[phoneNumber].otp;
        }
      }
    }
  } catch { }
  return undefined;
}

export async function startAuth(req: Request, res: Response): Promise<void> {
  const { phoneNumber } = req.body;

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PHONE', message: 'Phone number is required.' },
    });
    return;
  }

  const normalized = normalizePhoneNumber(phoneNumber);
  if (!isValidPhoneNumber(normalized)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PHONE_FORMAT', message: 'Please provide a valid E.164 phone number (e.g. +998901234567).' },
    });
    return;
  }

  // Generate OTP
  const activeOtp = generateSixDigitOtp();
  const otpHash = hashOtp(activeOtp);

  // Dispatch OTP via Eskiz.uz SMS Service
  eskizService.sendOtpSms(normalized, activeOtp).catch((e) => {
    logger.error('Failed to dispatch Eskiz SMS OTP:', e);
  });

  // Save to bot_otps.json so verifyAuth can check it
  try {
    const otpsPath = path.resolve(process.cwd(), 'bot_otps.json');
    let store: any = {};
    if (fs.existsSync(otpsPath)) store = JSON.parse(fs.readFileSync(otpsPath, 'utf8'));
    store[normalized] = { otp: activeOtp, updatedAt: new Date().toISOString() };
    fs.writeFileSync(otpsPath, JSON.stringify(store, null, 2));
  } catch { }

  // Generate pairing token & OTP
  const pairingToken = generatePairingToken();
  const challengeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  let challengeId: string = crypto.randomUUID();

  // If MongoDB is connected, save in Mongo; otherwise save in memory
  if (mongoose.connection.readyState === 1) {
    try {
      const challenge = await AuthChallenge.create({
        phoneNumber: normalized,
        pairingToken,
        otpHash,
        status: 'PAIRED',
        expiresAt: challengeExpiresAt,
      });
      challengeId = challenge._id.toString();
    } catch {
      // Fallback to memory
    }
  }

  memoryChallenges.set(challengeId, {
    _id: challengeId,
    phoneNumber: normalized,
    pairingToken,
    otpHash,
    status: 'PAIRED',
    expiresAt: challengeExpiresAt,
    attempts: 0,
    pairedAt: new Date(),
  });

  logger.info(`Auth challenge created for ${normalized} (OTP: ${activeOtp}, SMS Sent via Eskiz)`);

  res.status(200).json({
    success: true,
    data: {
      challengeId,
      phoneNumber: normalized,
      expiresAt: challengeExpiresAt.toISOString(),
      devOtp: activeOtp,
      requiresPairing: false,
    },
  });
}

export async function getAuthStatus(req: Request, res: Response): Promise<void> {
  const challengeId = Array.isArray(req.params.challengeId) ? req.params.challengeId[0] : req.params.challengeId;

  let challenge: any = memoryChallenges.get(challengeId);
  if (!challenge && mongoose.connection.readyState === 1) {
    challenge = await AuthChallenge.findById(challengeId);
  }

  if (!challenge) {
    res.status(404).json({
      success: false,
      error: { code: 'CHALLENGE_NOT_FOUND', message: 'Authentication challenge not found.' },
    });
    return;
  }

  // Check bot file for updates
  const botOtp = getBotSavedOtp(challenge.phoneNumber);
  if (botOtp && challenge.status === 'PENDING_PAIRING') {
    challenge.status = 'PAIRED';
    challenge.otpHash = hashOtp(botOtp);
    challenge.pairedAt = new Date();
  }

  res.status(200).json({
    success: true,
    data: {
      challengeId,
      status: challenge.status,
      attemptsLeft: Math.max(0, 5 - (challenge.attempts || 0)),
      pairedAt: challenge.pairedAt,
    },
  });
}

export async function devPair(req: Request, res: Response): Promise<void> {
  const { challengeId } = req.body;
  let challenge: any = memoryChallenges.get(challengeId);

  if (!challenge && mongoose.connection.readyState === 1) {
    challenge = await AuthChallenge.findById(challengeId);
  }

  if (!challenge) {
    res.status(404).json({ success: false, error: { code: 'CHALLENGE_NOT_FOUND', message: 'Challenge not found.' } });
    return;
  }

  const otp = generateSixDigitOtp();
  challenge.otpHash = hashOtp(otp);
  challenge.status = 'PAIRED';
  challenge.pairedAt = new Date();
  challenge.expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  if (challenge.save) await challenge.save();

  logger.info(`[DEV PAIR] Challenge ${challengeId} paired. Generated OTP: ${otp}`);

  res.status(200).json({
    success: true,
    data: {
      challengeId,
      status: 'PAIRED',
      devOtp: otp,
    },
  });
}

export async function verifyAuth(req: Request, res: Response): Promise<void> {
  const { challengeId, otp } = req.body;

  if (!challengeId || !otp || typeof otp !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Challenge ID and 6-digit OTP code are required.' },
    });
    return;
  }

  const cleanOtp = otp.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanOtp)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_OTP_FORMAT', message: 'OTP must be a 6-digit number.' },
    });
    return;
  }

  let challenge: any = memoryChallenges.get(challengeId);
  if (!challenge && mongoose.connection.readyState === 1) {
    challenge = await AuthChallenge.findById(challengeId);
  }

  if (!challenge) {
    res.status(404).json({
      success: false,
      error: { code: 'CHALLENGE_NOT_FOUND', message: 'Challenge expired or not found. Please start over.' },
    });
    return;
  }

  // Check bot saved OTP or hash
  const botOtp = getBotSavedOtp(challenge.phoneNumber);
  let isValid = false;

  if (botOtp && cleanOtp === botOtp) {
    isValid = true;
  } else if (challenge.otpHash) {
    isValid = verifyOtpHash(cleanOtp, challenge.otpHash);
  }

  if (!isValid) {
    challenge.attempts = (challenge.attempts || 0) + 1;
    if (challenge.save) await challenge.save();
    res.status(400).json({
      success: false,
      error: {
        code: 'INCORRECT_OTP',
        message: 'The verification code entered is incorrect.',
        attemptsLeft: Math.max(0, 5 - challenge.attempts),
      },
    });
    return;
  }

  challenge.status = 'VERIFIED';
  if (challenge.save) await challenge.save();

  // Find or create User
  let user: any = null;
  if (mongoose.connection.readyState === 1) {
    user = await User.findOne({ phoneNumber: challenge.phoneNumber });
  }

  if (!user) {
    user = getStoredUser(challenge.phoneNumber) || memoryUsers.get(challenge.phoneNumber);
  }

  // Check if banned
  if (user && user.isBanned) {
    res.status(403).json({
      success: false,
      error: {
        code: 'USER_BANNED',
        message: `Sizning profilingiz administrator tomonidan bloklangan. Sabab: ${user.bannedReason || 'Qoidalarni buzganlik uchun'}`,
      },
    });
    return;
  }

  let isNewUser = false;
  let isProfileComplete = false;

  if (!user) {
    isNewUser = true;
    isProfileComplete = false;
    const userData = {
      _id: new mongoose.Types.ObjectId().toString(),
      phoneNumber: challenge.phoneNumber,
      username: '',
      displayName: '',
      avatar: '',
      bio: '',
      isVerified: true,
      isOnline: true,
      role: challenge.phoneNumber === '+998889008081' ? 'admin' : 'user',
      isBanned: false,
      isProfileComplete: false,
      lastSeen: new Date(),
      privacySettings: { lastSeenVisibility: 'everyone', phoneVisibility: 'everyone', profilePhotoVisibility: 'everyone' },
      notificationSettings: { privateChats: true, groupChats: true, soundEnabled: true, messagePreview: true },
      appearanceSettings: { theme: 'dark', accentColor: '#35CBA0', fontSize: 'medium' },
      createdAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.create(userData);
      } catch {
        user = userData;
      }
    } else {
      user = userData;
    }
    memoryUsers.set(challenge.phoneNumber, user);
  } else {
    // Check if user has already completed profile
    isProfileComplete = Boolean(user.isProfileComplete && user.displayName && user.username && user.username.length >= 5);
  }

  // Ensure admin role for user's primary number
  if (challenge.phoneNumber === '+998889008081') {
    user.role = 'admin';
  }

  saveStoredUser({
    _id: user._id.toString(),
    phoneNumber: user.phoneNumber,
    displayName: user.displayName || '',
    username: user.username || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    isOnline: true,
    isVerified: user.isVerified ?? true,
    role: user.role || 'user',
    isBanned: Boolean(user.isBanned),
    isProfileComplete,
    createdAt: user.createdAt || new Date().toISOString(),
  });

  const payload = { userId: user._id.toString(), phoneNumber: user.phoneNumber, username: user.username || '' };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        username: user.username || '',
        displayName: user.displayName || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        role: user.role || (user.phoneNumber === '+998889008081' ? 'admin' : 'user'),
        isBanned: Boolean(user.isBanned),
        isProfileComplete,
        isVerified: user.isVerified,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        privacySettings: user.privacySettings,
        notificationSettings: user.notificationSettings,
        appearanceSettings: user.appearanceSettings,
      },
      accessToken,
      isNewUser: isNewUser || !isProfileComplete,
      isProfileComplete,
    },
  });
}

export async function completeProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: { message: 'Avtorizatsiyadan o\'ting.' } });
    return;
  }

  const { displayName, username, bio, avatar } = req.body;

  const cleanName = (displayName || '').trim();
  if (!cleanName || cleanName.length < 2) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_NAME', message: 'Ism va familiya kamida 2 ta harfdan iborat bo\'lishi kerak.' },
    });
    return;
  }

  const cleanUsername = (username || '').trim().toLowerCase().replace(/^@/, '');
  if (!cleanUsername || cleanUsername.length < 5) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_USERNAME', message: 'Foydalanuvchi nomi kamida 5 ta belgidan iborat bo\'lishi shart.' },
    });
    return;
  }

  if (!/^[a-z0-9_]{5,30}$/.test(cleanUsername)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_USERNAME_FORMAT', message: 'Foydalanuvchi nomida faqat kichik lotin harflari, raqamlar va pastki chiziq (_) ruxsat etiladi.' },
    });
    return;
  }

  // Check uniqueness of username across all registered users
  const allUsers = getAllStoredUsers();
  const taken = allUsers.some((u) => u.username && u.username.toLowerCase() === cleanUsername && u._id !== userId);
  if (taken) {
    res.status(400).json({
      success: false,
      error: { code: 'USERNAME_TAKEN', message: `@${cleanUsername} nomi allaqachon band. Iltimos, boshqa nom tanlang.` },
    });
    return;
  }

  let user = getStoredUser(userId);
  if (!user) {
    res.status(404).json({ success: false, error: { message: 'Foydalanuvchi topilmadi.' } });
    return;
  }

  user.displayName = cleanName;
  user.username = cleanUsername;
  user.bio = (bio || '').trim() || 'BecuGram a\'zosi 🚀';
  if (avatar) user.avatar = avatar;
  user.isProfileComplete = true;

  if (user.phoneNumber === '+998889008081') {
    user.role = 'admin';
  }

  saveStoredUser(user);

  if (mongoose.connection.readyState === 1) {
    try {
      await User.findByIdAndUpdate(userId, {
        displayName: user.displayName,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        isProfileComplete: true,
      });
    } catch {}
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        isProfileComplete: true,
        isVerified: user.isVerified,
        isOnline: user.isOnline,
      },
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.becugram_rf || req.body?.refreshToken;
  if (!token) {
    res.status(401).json({ success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided.' } });
    return;
  }

  try {
    const decoded = verifyRefreshToken(token);
    const payload = { userId: decoded.userId, phoneNumber: decoded.phoneNumber, username: decoded.username };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({ success: true, data: { accessToken: newAccessToken } });
  } catch {
    clearRefreshTokenCookie(res);
    res.status(401).json({ success: false, error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired.' } });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearRefreshTokenCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
}
