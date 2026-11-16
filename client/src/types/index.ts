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
  blockedUsers?: string[];
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
  isPremium?: boolean;
  premiumBadge?: string;
  profilePattern?: string;
  profileBackground?: string;
  profileColor?: string;
  profileGradient?: string;
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
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  waveform?: number[];
  type?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User | string;
  type:
    | 'text'
    | 'image'
    | 'video'
    | 'audio'
    | 'voice'
    | 'round_video'
    | 'video_note'
    | 'document'
    | 'file'
    | 'sticker'
    | 'gif'
    | 'system';
  content: string;
  media?: MessageMedia;
  replyTo?: Message;
  clientTempId?: string;
  forwardedFrom?: {
    _id?: string;
    displayName: string;
    username?: string;
  };
  reactions?: MessageReaction[];
  deliveredTo?: string[];
  readBy?: string[];
  isRead?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  isPinned?: boolean;
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
  pinnedMessageId?: string;
  pinnedMessage?: Message;
  isMuted?: boolean;
  unreadCount: number;
  createdAt: string;
  updatedAt?: string;
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
  refreshToken?: string;
  isNewUser: boolean;
}

export interface ChatFolder {
  id: string;
  name: string;
  emoji?: string;
  iconName?: string;
  filter: 'all' | 'personal' | 'groups' | 'channels' | 'unread' | 'custom';
  chatIds?: string[];
  includeTypes?: ('direct' | 'group' | 'channel')[];
}

