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
  isMuted?: boolean;
  createdAt: string;
}

export interface StoredMessage {
  _id: string;
  conversationId: string;
  senderId: any;
  type: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file';
  content?: string;
  media?: any;
  replyTo?: any;
  reactions?: { userId: string; emoji: string }[];
  readBy?: string[];
  isDeleted?: boolean;
  createdAt: string;
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

// Message methods
export function getConversationMessages(conversationId: string): StoredMessage[] {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const list = allMessages.filter((m) => m.conversationId === conversationId);
  return list;
}

export function saveMessage(msg: StoredMessage): void {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
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
}

export function deleteStoredMessage(messageId: string): StoredMessage | null {
  const allMessages = loadJson<StoredMessage[]>('messages.json', []);
  const index = allMessages.findIndex((m) => m._id === messageId);
  if (index === -1) return null;

  const [deletedMsg] = allMessages.splice(index, 1);
  saveJson('messages.json', allMessages);

  // Update conversation's lastMessage
  const allChats = loadJson<StoredConversation[]>('chats.json', []);
  const conv = allChats.find((c) => c._id === deletedMsg.conversationId);
  if (conv) {
    const remaining = allMessages.filter((m) => m.conversationId === deletedMsg.conversationId);
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

  return deletedMsg;
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

