import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

function getFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

function loadJson<T>(filename: string, defaultValue: T): T {
  try {
    const file = getFilePath(filename);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch {}
  return defaultValue;
}

function saveJson<T>(filename: string, data: T): void {
  try {
    const file = getFilePath(filename);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to save ${filename}:`, err);
  }
}

export interface StoredUser {
  _id: string;
  phoneNumber: string;
  displayName: string;
  username: string;
  bio?: string;
  avatar?: string;
  isOnline: boolean;
  isVerified: boolean;
  role?: 'user' | 'admin';
  isBanned?: boolean;
  bannedAt?: string;
  bannedReason?: string;
  isProfileComplete?: boolean;
  blockedUsers?: string[];
  createdAt: string;
}

export interface StoredConversation {
  _id: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[];
  partner?: any;
  group?: any;
  lastMessage?: any;
  lastMessageAt?: string;
  unreadCount?: number;
  isPinned?: boolean;
  pinnedMessageId?: string;
  pinnedMessage?: any;
  isMuted?: boolean;
  createdAt: string;
}

export interface StoredMessage {
  _id: string;
  conversationId: string;
  senderId: any;
  type:
    | 'text'
    | 'image'
    | 'video'
    | 'audio'
    | 'voice'
    | 'round_video'
    | 'video_note'
    | 'file'
    | 'sticker'
    | 'gif'
    | 'document'
    | 'system';
  content?: string;
  media?: any;
  replyTo?: any;
  clientTempId?: string;
  forwardedFrom?: {
    _id?: string;
    displayName: string;
    username?: string;
  };
  reactions?: { userId: string; emoji: string }[];
  deliveredTo?: string[];
  readBy?: string[];
  deletedFor?: string[];
  isRead?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StoredContact {
  _id: string;
  userId: string;
  customName: string;
  user: {
    _id: string;
    displayName: string;
    username: string;
    phoneNumber?: string;
    avatar?: string;
    isOnline: boolean;
    isVerified: boolean;
    bio?: string;
  };
  createdAt: string;
}

export interface StoredGroup {
  _id: string;
  creatorId: string;
  name: string;
  description: string;
  avatar?: string;
  memberCount: number;
  isPublic: boolean;
  createdAt: string;
}

export interface GlobalSettings {
  accentColor: string;
  announcementBanner: {
    enabled: boolean;
    text: string;
  };
  theme: 'dark' | 'light';
  maintenanceMode: boolean;
}

export function getStoredGlobalSettings(): GlobalSettings {
  return loadJson<GlobalSettings>('settings.json', {
    accentColor: '#2563EB',
    announcementBanner: {
      enabled: false,
      text: 'BecuGram yangi versiyasi ishga tushdi!',
    },
    theme: 'dark',
    maintenanceMode: false,
  });
}

export function saveStoredGlobalSettings(settings: GlobalSettings): void {
  saveJson('settings.json', settings);
}

// User methods
export function getStoredUser(userIdOrPhone: string): StoredUser | null {
  const users = loadJson<Record<string, StoredUser>>('users.json', {});
  return users[userIdOrPhone] || Object.values(users).find((u) => u.phoneNumber === userIdOrPhone || u._id === userIdOrPhone) || null;
}

export function saveStoredUser(user: StoredUser): void {
  const users = loadJson<Record<string, StoredUser>>('users.json', {});
  users[user._id] = user;
  users[user.phoneNumber] = user;
  saveJson('users.json', users);
}

// Ensure initial clean conversations for a user
export function getUserConversations(userId: string): StoredConversation[] {
  const allChats = loadJson<StoredConversation[]>('chats.json', []);
  const userChats = allChats.filter((c) => c.participants.includes(userId));

  if (userChats.length === 0) {
    // Create initial authentic chats: "Saqlanganlar" and "BecuGram Rasmiy Kanal"
    const savedMessagesChat: StoredConversation = {
      _id: `conv_saved_${userId}`,
      type: 'direct',
      participants: [userId],
      partner: {
        _id: userId,
        displayName: 'Saqlanganlar',
        username: 'saved',
        avatar: '',
        isOnline: true,
        isVerified: true,
      },
      lastMessage: {
        type: 'text',
        content: "O'zingiz uchun eslatmalar, rasmlar va xabarlar",
        createdAt: new Date().toISOString(),
      },
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      isPinned: true,
      isMuted: false,
      createdAt: new Date().toISOString(),
    };

    const initial = [savedMessagesChat];
    saveUserConversations([...allChats, ...initial]);
    return initial;
  }

  return userChats;
}

export function saveUserConversations(chats: StoredConversation[]): void {
  saveJson('chats.json', chats);
}

export function addOrUpdateConversation(conv: StoredConversation): void {
  const allChats = loadJson<StoredConversation[]>('chats.json', []);
  const index = allChats.findIndex((c) => c._id === conv._id);
  if (index >= 0) {
    allChats[index] = { ...allChats[index], ...conv };
  } else {
    allChats.unshift(conv);
  }
  saveJson('chats.json', allChats);
}

// Conversation lookup helper
export function getStoredConversation(conversationId: string): StoredConversation | null {
  const allChats = loadJson<StoredConversation[]>('chats.json', []);
  return allChats.find((c) => c._id === conversationId) || null;
}

// Message methods
export function getAllConversationMessages(conversationId: string, userId?: string): StoredMessage[] {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  return allMessages.filter((m) => {
    if (m.conversationId !== conversationId) return false;
    if (m.isDeleted) return false;
    if (userId && m.deletedFor && m.deletedFor.includes(userId)) return false;
    return true;
  });
}

export function getStoredMessage(messageId: string): StoredMessage | null {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  return allMessages.find((m) => m._id === messageId) || null;
}

export function getConversationMessages(
  conversationId: string,
  options?: { before?: string; limit?: number; userId?: string }
): { messages: StoredMessage[]; nextCursor: string | null; total: number } {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  let list = allMessages.filter((m) => {
    if (m.conversationId !== conversationId) return false;
    if (m.isDeleted) return false;
    if (options?.userId && m.deletedFor && m.deletedFor.includes(options.userId)) return false;
    return true;
  });

  // Sort chronologically (oldest to newest)
  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const total = list.length;
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);

  if (options?.before) {
    const beforeDate = new Date(options.before).getTime();
    if (!isNaN(beforeDate)) {
      list = list.filter((m) => new Date(m.createdAt).getTime() < beforeDate);
    } else {
      const idx = list.findIndex((m) => m._id === options.before);
      if (idx >= 0) {
        list = list.slice(0, idx);
      }
    }
  }

  const hasMore = list.length > limit;
  const paged = hasMore ? list.slice(list.length - limit) : list;
  const nextCursor = hasMore && paged.length > 0 ? paged[0].createdAt : null;

  return {
    messages: paged,
    nextCursor,
    total,
  };
}

export function saveMessage(msg: StoredMessage): StoredMessage {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);

  // Duplicate prevention using clientTempId
  if (msg.clientTempId) {
    const existing = allMessages.find(
      (m) => m.conversationId === msg.conversationId && m.clientTempId === msg.clientTempId
    );
    if (existing) {
      return existing;
    }
  }

  allMessages.push(msg);
  saveJson('messages.json', allMessages);

  // Update conversation's lastMessage
  const allChats = loadJson<StoredConversation[]>('chats.json', []);
  const conv = allChats.find((c) => c._id === msg.conversationId);
  if (conv) {
    conv.lastMessage = msg;
    conv.lastMessageAt = msg.createdAt;
    saveJson('chats.json', allChats);
  }

  return msg;
}

export function updateStoredMessage(messageId: string, updates: Partial<StoredMessage>): StoredMessage | null {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const index = allMessages.findIndex((m) => m._id === messageId);
  if (index === -1) return null;

  allMessages[index] = { ...allMessages[index], ...updates };
  saveJson('messages.json', allMessages);
  return allMessages[index];
}

export function deleteStoredMessage(
  messageId: string,
  userId?: string,
  forEveryone: boolean = true
): StoredMessage | null {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const index = allMessages.findIndex((m) => m._id === messageId);
  if (index === -1) return null;

  const targetMsg = allMessages[index];
  if (forEveryone) {
    targetMsg.isDeleted = true;
    targetMsg.content = "Xabar o'chirildi";
    targetMsg.updatedAt = new Date().toISOString();
    delete targetMsg.media;
  } else {
    if (userId) {
      if (!targetMsg.deletedFor) targetMsg.deletedFor = [];
      if (!targetMsg.deletedFor.includes(userId)) {
        targetMsg.deletedFor.push(userId);
      }
    }
  }

  saveJson('messages.json', allMessages);

  // Update conversation's lastMessage
  const allChats = loadJson<StoredConversation[]>('chats.json', []);
  const conv = allChats.find((c) => c._id === targetMsg.conversationId);
  if (conv) {
    const remaining = allMessages.filter(
      (m) => m.conversationId === targetMsg.conversationId && !m.isDeleted
    );
    if (remaining.length > 0) {
      const latest = remaining[remaining.length - 1];
      conv.lastMessage = latest;
      conv.lastMessageAt = latest.createdAt;
    } else {
      conv.lastMessage = undefined;
      conv.lastMessageAt = undefined;
    }
    saveJson('chats.json', allChats);
  }

  return targetMsg;
}

export function updateMessageReactions(messageId: string, userId: string, emoji: string): StoredMessage | null {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const msg = allMessages.find((m) => m._id === messageId);
  if (!msg) return null;

  if (!msg.reactions) msg.reactions = [];
  const existingIndex = msg.reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);

  if (existingIndex >= 0) {
    msg.reactions.splice(existingIndex, 1);
  } else {
    // Remove any previous reaction from this user if single reaction
    msg.reactions = msg.reactions.filter((r) => r.userId !== userId);
    msg.reactions.push({ userId, emoji });
  }

  saveJson('messages.json', allMessages);
  return msg;
}

export function markStoredMessagesRead(conversationId: string, userId: string, messageIds?: string[]): string[] {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const readIds: string[] = [];
  let updated = false;

  for (const m of allMessages) {
    if (m.conversationId === conversationId) {
      const senderId = typeof m.senderId === 'object' && m.senderId ? m.senderId._id : m.senderId;
      if (senderId !== userId) {
        if (!messageIds || messageIds.includes(m._id)) {
          if (!m.readBy) m.readBy = [];
          if (!m.readBy.includes(userId)) {
            m.readBy.push(userId);
            m.isRead = true;
            readIds.push(m._id);
            updated = true;
          }
        }
      }
    }
  }

  if (updated) {
    saveJson('messages.json', allMessages);
  }

  // Reset conversation unreadCount
  const allChats = loadJson<StoredConversation[]>('chats.json', []);
  const conv = allChats.find((c) => c._id === conversationId);
  if (conv) {
    conv.unreadCount = 0;
    saveJson('chats.json', allChats);
  }

  return readIds;
}

export function markStoredMessageDelivered(messageId: string, userId: string): StoredMessage | null {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const msg = allMessages.find((m) => m._id === messageId);
  if (!msg) return null;

  if (!msg.deliveredTo) msg.deliveredTo = [];
  if (!msg.deliveredTo.includes(userId)) {
    msg.deliveredTo.push(userId);
    saveJson('messages.json', allMessages);
  }
  return msg;
}

// Contacts methods
export function getUserContacts(userId: string): StoredContact[] {
  const allContacts = loadJson<StoredContact[]>('contacts.json', []);
  return allContacts.filter((c) => c.userId === userId);
}

export function addStoredContact(contact: StoredContact): void {
  const allContacts = loadJson<StoredContact[]>('contacts.json', []);
  // Prevent duplicate
  const exists = allContacts.find((c) => c.userId === contact.userId && c.user.phoneNumber === contact.user.phoneNumber);
  if (!exists) {
    allContacts.push(contact);
    saveJson('contacts.json', allContacts);
  }
}

export function deleteStoredContact(userId: string, contactId: string): void {
  const allContacts = loadJson<StoredContact[]>('contacts.json', []);
  const filtered = allContacts.filter((c) => !(c.userId === userId && c._id === contactId));
  saveJson('contacts.json', filtered);
}

// Groups methods
export function getUserGroups(userId: string): { myGroups: StoredGroup[]; communities: StoredGroup[] } {
  const allGroups = loadJson<StoredGroup[]>('groups.json', []);
  const myGroups = allGroups.filter((g) => g.creatorId === userId || !g.isPublic);
  const communities = allGroups.filter((g) => g.isPublic);

  return {
    myGroups,
    communities,
  };
}

export function createStoredGroup(group: StoredGroup): void {
  const allGroups = loadJson<StoredGroup[]>('groups.json', []);
  allGroups.unshift(group);
  saveJson('groups.json', allGroups);
}

// Admin Panel Methods
export function getAllStoredUsers(): StoredUser[] {
  const usersMap = loadJson<Record<string, StoredUser>>('users.json', {});
  const uniqueUsers = new Map<string, StoredUser>();
  for (const u of Object.values(usersMap)) {
    if (u && u._id) {
      uniqueUsers.set(u._id, u);
    }
  }
  return Array.from(uniqueUsers.values());
}

export function banStoredUser(userId: string, isBanned: boolean, reason?: string): StoredUser | null {
  const usersMap = loadJson<Record<string, StoredUser>>('users.json', {});
  let target: StoredUser | null = null;

  for (const key of Object.keys(usersMap)) {
    if (usersMap[key]._id === userId) {
      usersMap[key].isBanned = isBanned;
      if (isBanned) {
        usersMap[key].bannedAt = new Date().toISOString();
        usersMap[key].bannedReason = reason || 'Qoidalarni buzganlik uchun';
      } else {
        delete usersMap[key].bannedAt;
        delete usersMap[key].bannedReason;
      }
      target = usersMap[key];
    }
  }

  if (target) {
    saveJson('users.json', usersMap);
  }
  return target;
}

export function getAllStoredConversations(): StoredConversation[] {
  return loadJson<StoredConversation[]>('chats.json', []);
}

export function getAllStoredMessages(): StoredMessage[] {
  return loadJson<StoredMessage[]>('messages.json', []);
}

export function deleteStoredMessageAdmin(messageId: string): boolean {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const filtered = allMessages.filter((m) => m._id !== messageId);
  saveJson('messages.json', filtered);
  return filtered.length !== allMessages.length;
}

export function deleteStoredConversationAdmin(conversationId: string): boolean {
  const allChats = loadJson<StoredConversation[]>('chats.json', []);
  const filtered = allChats.filter((c) => c._id !== conversationId);
  saveJson('chats.json', filtered);

  // Also remove its messages
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const filteredMessages = allMessages.filter((m) => m.conversationId !== conversationId);
  saveJson('messages.json', filteredMessages);

  return filtered.length !== allChats.length;
}

export const deleteStoredConversation = deleteStoredConversationAdmin;

export interface UserChatPartnerSummary {
  conversationId: string;
  type: string;
  partner: {
    _id: string;
    displayName: string;
    username: string;
    phoneNumber?: string;
    avatar?: string;
  };
  messages: StoredMessage[];
  messageCount: number;
  lastMessageAt?: string;
}

export function getUserChatActivity(userId: string): UserChatPartnerSummary[] {
  const allChats = getAllStoredConversations();
  const allMessages = getAllStoredMessages();
  const usersMap = loadJson<Record<string, StoredUser>>('users.json', {});

  const userChats = allChats.filter((c) => c.participants && c.participants.includes(userId));
  const results: UserChatPartnerSummary[] = [];

  for (const chat of userChats) {
    const partnerId = chat.participants.find((p) => p !== userId) || userId;
    const partnerUser = usersMap[partnerId] || (typeof chat.partner === 'object' ? chat.partner : null) || {
      _id: partnerId,
      displayName: chat.group?.name || 'Suhbatdosh',
      username: 'user',
    };

    const messages = allMessages.filter((m) => m.conversationId === chat._id);

    results.push({
      conversationId: chat._id,
      type: chat.type,
      partner: {
        _id: partnerUser._id || partnerId,
        displayName: partnerUser.displayName || 'Foydalanuvchi',
        username: partnerUser.username || 'user',
        phoneNumber: partnerUser.phoneNumber,
        avatar: partnerUser.avatar,
      },
      messages,
      messageCount: messages.length,
      lastMessageAt: chat.lastMessageAt || (messages.length > 0 ? messages[messages.length - 1].createdAt : undefined),
    });
  }

  return results.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
}

export function getStoredStats() {
  const users = getAllStoredUsers();
  const chats = getAllStoredConversations();
  const messages = getAllStoredMessages();
  const banned = users.filter((u) => u.isBanned).length;

  return {
    totalUsers: users.length,
    totalChats: chats.length,
    totalMessages: messages.length,
    bannedUsers: banned,
  };
}

export function pinConversationMessage(conversationId: string, messageId: string): StoredConversation | null {
  const allChats = getAllStoredConversations();
  const allMessages = getAllStoredMessages();
  const chatIndex = allChats.findIndex((c) => c._id === conversationId);
  if (chatIndex < 0) return null;

  const targetMsg = allMessages.find((m) => m._id === messageId);
  allChats[chatIndex].pinnedMessageId = messageId;
  allChats[chatIndex].pinnedMessage = targetMsg || null;
  saveUserConversations(allChats);
  return allChats[chatIndex];
}

export function unpinConversationMessage(conversationId: string): StoredConversation | null {
  const allChats = getAllStoredConversations();
  const chatIndex = allChats.findIndex((c) => c._id === conversationId);
  if (chatIndex < 0) return null;

  delete allChats[chatIndex].pinnedMessageId;
  delete allChats[chatIndex].pinnedMessage;
  saveUserConversations(allChats);
  return allChats[chatIndex];
}

export function toggleBlockUser(userId: string, targetUserId: string): { isBlocked: boolean; blockedUsers: string[] } {
  const user = getStoredUser(userId);
  if (!user) return { isBlocked: false, blockedUsers: [] };

  const currentBlocked = user.blockedUsers || [];
  const exists = currentBlocked.includes(targetUserId);
  let updated: string[];

  if (exists) {
    updated = currentBlocked.filter((id) => id !== targetUserId);
  } else {
    updated = [...currentBlocked, targetUserId];
  }

  user.blockedUsers = updated;
  saveStoredUser(user);
  return { isBlocked: !exists, blockedUsers: updated };
}

// -------------------------------------------------------------
// GIF MANAGEMENT
// -------------------------------------------------------------
export interface StoredGif {
  id: string;
  title: string;
  category: string;
  url: string;
  createdAt: string;
}

const DEFAULT_GIFS: StoredGif[] = [
  { id: 'gif-1', title: 'Bayram 🎉', category: 'Celebration', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', createdAt: new Date().toISOString() },
  { id: 'gif-2', title: 'Qarsaklar 👏', category: 'Reactions', url: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif', createdAt: new Date().toISOString() },
  { id: 'gif-3', title: 'Ajoyib 👍', category: 'Reactions', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', createdAt: new Date().toISOString() },
  { id: 'gif-4', title: 'Raqs 🕺', category: 'Funny', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif', createdAt: new Date().toISOString() },
  { id: 'gif-5', title: 'Muhabbat ❤️', category: 'Love', url: 'https://media.giphy.com/media/26BRv0ThflsDTjDUs/giphy.gif', createdAt: new Date().toISOString() },
  { id: 'gif-6', title: 'Aqlbovar qilmas 🤯', category: 'Trending', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', createdAt: new Date().toISOString() },
  { id: 'gif-7', title: 'Kulgi 😂', category: 'Funny', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif', createdAt: new Date().toISOString() },
  { id: 'gif-8', title: 'Olov 🔥', category: 'Trending', url: 'https://media.giphy.com/media/nrXif9YjgW9EI/giphy.gif', createdAt: new Date().toISOString() },
];

export function getAllGifs(): StoredGif[] {
  return loadJson<StoredGif[]>('gifs.json', DEFAULT_GIFS);
}

export function saveGifs(gifs: StoredGif[]): void {
  saveJson('gifs.json', gifs);
}

export function addStoredGif(gif: Omit<StoredGif, 'id' | 'createdAt'>): StoredGif {
  const list = getAllGifs();
  const newGif: StoredGif = {
    ...gif,
    id: `gif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newGif);
  saveGifs(list);
  return newGif;
}

export function deleteStoredGif(id: string): boolean {
  const list = getAllGifs();
  const filtered = list.filter((g) => g.id !== id);
  if (filtered.length !== list.length) {
    saveGifs(filtered);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// STICKER PACKS & LOTTIE STICKERS MANAGEMENT
// -------------------------------------------------------------
export interface StoredStickerItem {
  id: string;
  name: string;
  emoji: string;
  lottieJson: any; // Can be parsed JSON object or JSON string
  createdAt: string;
}

export interface StoredStickerPack {
  id: string;
  title: string;
  author: string;
  isPremium?: boolean;
  stickers: StoredStickerItem[];
  createdAt: string;
}

const DEFAULT_STICKER_PACKS: StoredStickerPack[] = [
  {
    id: 'pack_duck_lottie',
    title: 'Telegram Dux (Lottie)',
    author: 'Telegram',
    isPremium: false,
    createdAt: new Date().toISOString(),
    stickers: [
      {
        id: 'stk_duck_hello',
        name: 'Salom Dux',
        emoji: '👋',
        lottieJson: '/reactions/001.json',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'stk_duck_like',
        name: 'Like Dux',
        emoji: '👍',
        lottieJson: '/reactions/002.json',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'stk_duck_fire',
        name: 'Olov Dux',
        emoji: '🔥',
        lottieJson: '/reactions/007.json',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'stk_duck_party',
        name: 'Bayram Dux',
        emoji: '🎉',
        lottieJson: '/reactions/010.json',
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

export function getAllStickerPacks(): StoredStickerPack[] {
  return loadJson<StoredStickerPack[]>('stickers.json', DEFAULT_STICKER_PACKS);
}

export function saveStickerPacks(packs: StoredStickerPack[]): void {
  saveJson('stickers.json', packs);
}

export function addStoredStickerPack(title: string, author: string, isPremium: boolean = false): StoredStickerPack {
  const packs = getAllStickerPacks();
  const newPack: StoredStickerPack = {
    id: `pack_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    title,
    author: author || 'Admin',
    isPremium,
    stickers: [],
    createdAt: new Date().toISOString(),
  };
  packs.push(newPack);
  saveStickerPacks(packs);
  return newPack;
}

export function addStickerToPack(
  packId: string,
  name: string,
  emoji: string,
  lottieJson: any
): StoredStickerItem | null {
  const packs = getAllStickerPacks();
  const pack = packs.find((p) => p.id === packId);
  if (!pack) return null;

  const newSticker: StoredStickerItem = {
    id: `stk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name,
    emoji: emoji || '⭐️',
    lottieJson,
    createdAt: new Date().toISOString(),
  };

  pack.stickers.push(newSticker);
  saveStickerPacks(packs);
  return newSticker;
}

export function deleteStoredSticker(stickerId: string): boolean {
  const packs = getAllStickerPacks();
  let modified = false;

  for (const pack of packs) {
    const before = pack.stickers.length;
    pack.stickers = pack.stickers.filter((s) => s.id !== stickerId);
    if (pack.stickers.length !== before) {
      modified = true;
    }
  }

  if (modified) {
    saveStickerPacks(packs);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// CLICK AUTO-PAYMENT & PREMIUM SUBSCRIPTIONS
// -------------------------------------------------------------
export interface StoredPayment {
  id: string;
  userId: string;
  provider: 'click';
  planId: '1_month' | '3_months' | '1_year';
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  autoRenew: boolean;
  clickTransId?: string;
  cardNumberMasked?: string;
  createdAt: string;
}

export function getAllPayments(): StoredPayment[] {
  return loadJson<StoredPayment[]>('payments.json', []);
}

export function savePayments(payments: StoredPayment[]): void {
  saveJson('payments.json', payments);
}

export function createStoredPayment(data: {
  userId: string;
  planId: '1_month' | '3_months' | '1_year';
  amount: number;
  autoRenew: boolean;
  cardNumberMasked?: string;
}): StoredPayment {
  const payments = getAllPayments();
  const newPayment: StoredPayment = {
    id: `pay_click_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: data.userId,
    provider: 'click',
    planId: data.planId,
    amount: data.amount,
    status: 'completed', // Auto-completed for Click instant checkout
    autoRenew: data.autoRenew,
    clickTransId: `CLICK_${Math.floor(100000000 + Math.random() * 900000000)}`,
    cardNumberMasked: data.cardNumberMasked || '8600 **** **** 1234',
    createdAt: new Date().toISOString(),
  };

  payments.unshift(newPayment);
  savePayments(payments);

  // Update user in dataStore to give Premium!
  const user = getStoredUser(data.userId);
  if (user) {
    (user as any).isPremium = true;
    (user as any).premiumBadge = '⭐️';
    (user as any).autoRenewPremium = data.autoRenew;
    const durationDays = data.planId === '1_year' ? 365 : data.planId === '3_months' ? 90 : 30;
    (user as any).premiumUntil = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
    saveStoredUser(user);
  }

  return newPayment;
}

export function cancelAutoRenewal(userId: string): boolean {
  const user = getStoredUser(userId);
  if (!user) return false;
  (user as any).autoRenewPremium = false;
  saveStoredUser(user);

  const payments = getAllPayments();
  payments.forEach((p) => {
    if (p.userId === userId) {
      p.autoRenew = false;
    }
  });
  savePayments(payments);
  return true;
}


