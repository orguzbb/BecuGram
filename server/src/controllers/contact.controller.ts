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

  const cleanIdentifier = identifier.trim();
  const contactName = customName?.trim() || cleanIdentifier;
  const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newContact: StoredContact = {
    _id: `contact_${Date.now()}`,
    userId: currentUserId,
    customName: contactName,
    user: {
      _id: newUserId,
      displayName: contactName,
      username: cleanIdentifier.replace(/[@+]/g, '').toLowerCase(),
      phoneNumber: cleanIdentifier.startsWith('+') ? cleanIdentifier : `+${cleanIdentifier}`,
      avatar: '',
      isOnline: true,
      isVerified: false,
      bio: 'BecuGram foydalanuvchisi',
    },
    createdAt: new Date().toISOString(),
  };

  addStoredContact(newContact);

  // Automatically create a ready direct conversation so user can chat immediately!
  addOrUpdateConversation({
    _id: `conv_${currentUserId}_${newUserId}`,
    type: 'direct',
    participants: [currentUserId, newUserId],
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
