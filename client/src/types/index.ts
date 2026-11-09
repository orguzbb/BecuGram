export interface User {
  _id: string;
  phoneNumber?: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  role?: 'user' | 'admin';
  isBanned?: boolean;
  isProfileComplete?: boolean;
  lastSeen?: string;
  privacySettings?: {
    lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
    phoneVisibility: 'everyone' | 'contacts' | 'nobody';
    profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
  };
  notificationSettings?: {
    privateChats: boolean;
    groupChats: boolean;
    soundEnabled: boolean;
    messagePreview: boolean;
  };
  appearanceSettings?: {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface MessageMedia {
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  duration?: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User | string;
  type: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' | 'system';
  content: string;
  media?: MessageMedia;
  replyTo?: Message;
  reactions?: MessageReaction[];
  deliveredTo?: string[];
  readBy?: string[];
  isRead?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  creatorId?: string | User;
  inviteCode?: string;
  memberCount: number;
  isPublic?: boolean;
  conversationId?: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group' | 'channel';
  partner?: User;
  group?: Group;
  participants: (User | string)[];
  lastMessage?: Message;
  lastMessageAt: string;
  isPinned?: boolean;
  isMuted?: boolean;
  unreadCount: number;
  createdAt: string;
}

export interface Contact {
  _id: string;
  user: User;
  customName: string;
  createdAt: string;
}

export interface AuthChallengeResponse {
  challengeId: string;
  pairingToken: string;
  telegramDeepLink: string;
  botUsername: string;
  expiresAt: string;
  requiresPairing: boolean;
  devOtp?: string;
}

export interface AuthVerifyResponse {
  user: User;
  accessToken: string;
  isNewUser: boolean;
}

