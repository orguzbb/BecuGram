import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Contact } from '../models/Contact.js';
import { User } from '../models/User.js';
import { normalizePhoneNumber } from '../utils/phone.js';
import {
  getUserContacts,
  addStoredContact,
  deleteStoredContact,
  StoredContact,
  addOrUpdateConversation,
  getAllStoredUsers,
} from '../utils/dataStore.js';

export async function getContacts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';

  if (mongoose.connection.readyState !== 1) {
    const contacts = getUserContacts(currentUserId);
    contacts.sort((a, b) => a.customName.localeCompare(b.customName));
    res.status(200).json({ success: true, data: contacts });
    return;
  }

  try {
    const contacts = await Contact.find({ userId: currentUserId })
      .populate({
        path: 'contactUserId',
        select: 'displayName username avatar isOnline lastSeen isVerified phoneNumber bio privacySettings',
      })
      .sort({ createdAt: -1 });

    if (contacts.length === 0) {
      const list = getUserContacts(currentUserId);
      res.status(200).json({ success: true, data: list });
      return;
    }

    const sanitized = contacts
      .filter((c) => c.contactUserId)
      .map((c) => {
        const u = (c.contactUserId as any).toObject ? (c.contactUserId as any).toObject() : c.contactUserId;
        return {
          _id: c._id,
          user: u,
          customName: c.customName || u.displayName,
          createdAt: c.createdAt,
        };
      });

    sanitized.sort((a, b) => a.customName.localeCompare(b.customName));
    res.status(200).json({ success: true, data: sanitized });
  } catch {
    const list = getUserContacts(currentUserId);
    res.status(200).json({ success: true, data: list });
  }
}

export async function addContact(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const { identifier, customName } = req.body;

  if (!identifier) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Telefon raqam yoki foydalanuvchi nomi kiritilishi shart.' },
    });
    return;
  }

  const raw = String(identifier).trim();
  const digitsOnly = raw.replace(/\D/g, '');
  let normalizedPhone = '';
  if (digitsOnly.length === 9) {
    normalizedPhone = '+998' + digitsOnly;
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('998')) {
    normalizedPhone = '+' + digitsOnly;
  } else if (digitsOnly.length > 5) {
    normalizedPhone = '+' + digitsOnly;
  }

  const cleanUsername = raw.replace(/^@/, '').toLowerCase();

  let foundUser: any = null;

  // 1. Search in MongoDB if active
  if (mongoose.connection.readyState === 1) {
    try {
      foundUser = await User.findOne({
        $or: [
          ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : []),
          { username: cleanUsername },
          { _id: mongoose.isValidObjectId(raw) ? raw : undefined },
        ],
      });
    } catch (err) {
      console.error('Mongo search contact user error:', err);
    }
  }

  // 2. Search in file storage (users.json)
  if (!foundUser) {
    const allUsers = getAllStoredUsers();
    foundUser = allUsers.find(
      (u) =>
        (normalizedPhone && u.phoneNumber === normalizedPhone) ||
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        u._id === raw ||
        u.phoneNumber === raw
    );
  }

  // CRITICAL: If the user is NOT registered in BecuGram, reject with 404!
  if (!foundUser) {
    res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: "Bunday foydalanuvchi BecuGram platformasida ro'yxatdan o'tmagan.",
      },
    });
    return;
  }

  // Cannot add oneself as contact
  if (foundUser._id === currentUserId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CANNOT_ADD_SELF',
        message: "O'zingizni kontakt sifatida qo'sha olmaysiz.",
      },
    });
    return;
  }

  // Check if contact already exists
  const existingContacts = getUserContacts(currentUserId);
  const alreadyAdded = existingContacts.find(
    (c) => c.user._id === foundUser._id || (c.user.phoneNumber && c.user.phoneNumber === foundUser.phoneNumber)
  );
  if (alreadyAdded) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CONTACT_ALREADY_EXISTS',
        message: "Bu kontakt allaqachon ro'yxatingizda mavjud.",
      },
    });
    return;
  }

  const contactName = customName?.trim() || foundUser.displayName || foundUser.username;

  const newContact: StoredContact = {
    _id: `contact_${Date.now()}`,
    userId: currentUserId,
    customName: contactName,
    user: {
      _id: foundUser._id,
      displayName: foundUser.displayName || contactName,
      username: foundUser.username || '',
      phoneNumber: foundUser.phoneNumber || '',
      avatar: foundUser.avatar || '',
      isOnline: Boolean(foundUser.isOnline),
      isVerified: Boolean(foundUser.isVerified),
      bio: foundUser.bio || '',
    },
    createdAt: new Date().toISOString(),
  };

  addStoredContact(newContact);

  // If in MongoDB, also save to Contact collection
  if (mongoose.connection.readyState === 1) {
    try {
      await Contact.create({
        userId: currentUserId,
        contactUserId: foundUser._id,
        customName: contactName,
      });
    } catch {}
  }

  // Create direct conversation with real user
  const convId = [currentUserId, foundUser._id].sort().join('_');
  addOrUpdateConversation({
    _id: `conv_${convId}`,
    type: 'direct',
    participants: [currentUserId, foundUser._id],
    partner: newContact.user,
    lastMessage: {
      type: 'text',
      content: `${contactName} kontaktlarga qo'shildi`,
      createdAt: new Date().toISOString(),
    },
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, data: newContact });
}

export async function removeContact(req: AuthenticatedRequest, res: Response): Promise<void> {
  const currentUserId = req.user?.userId || 'user_default';
  const rawId = req.params.contactId || req.params.id;
  const contactId = Array.isArray(rawId) ? rawId[0] : rawId;

  deleteStoredContact(currentUserId, contactId);
  res.status(200).json({ success: true, message: 'Kontakt muvaffaqiyatli o\'chirildi.' });
}

export async function toggleBlockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { isBlocked: true } });
}
