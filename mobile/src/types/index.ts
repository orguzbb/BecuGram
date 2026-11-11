export interface User {
  _id: string;
  phoneNumber: string;
  displayName: string;
  username: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
  isVerified?: boolean;
  role?: 'user' | 'admin';
  blockedUsers?: string[];
  createdAt?: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | User;
  content: string;
  type: 'text' | 'image' | 'voice' | 'sticker' | 'file';
  media?: {
    url: string;
    filename?: string;
    size?: number;
    duration?: number;
    mimeType?: string;
  };
  replyTo?: {
    _id: string;
    content: string;
    senderId: string | User;
  };
  forwardedFrom?: {
    _id: string;
    displayName: string;
  };
  reactions?: MessageReaction[];
  isPinned?: boolean;
  isRead?: boolean;
  isEdited?: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group' | 'channel';
  participants: (string | User)[];
  partner?: User;
  group?: {
    name: string;
    avatar?: string;
    description?: string;
    membersCount?: number;
  };
  lastMessage?: Message;
  pinnedMessageId?: string;
  pinnedMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  caption?: string;
  mediaUrl?: string;
  bgColor?: string;
  createdAt: string;
}

