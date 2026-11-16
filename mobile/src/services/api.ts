import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, Conversation, Message, Story } from '../types';

// Default host: 10.0.2.2 for Android emulator, localhost for iOS simulator, web or local IP
export const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

let currentBaseUrl = DEFAULT_API_URL;

export const setCustomBaseUrl = (url: string) => {
  currentBaseUrl = url.replace(/\/$/, '');
};

export const getBaseUrl = () => currentBaseUrl;

export const getMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${currentBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem('@becugram_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only add Content-Type: application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${currentBaseUrl}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  
  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const rawText = await response.text().catch(() => '');
    if (!response.ok) {
      throw new Error(`Server xatosi (${response.status}): ${rawText.slice(0, 100) || response.statusText}`);
    }
    data = rawText;
  }

  if (!response.ok) {
    const message = data?.message || data?.error?.message || response.statusText || 'Server xatoligi';
    throw new Error(message);
  }

  return (data?.data !== undefined ? data.data : data) as T;
}

export const mobileApi = {
  // Auth
  startAuth: (phoneNumber: string) =>
    request<{ challengeId: string; phoneNumber: string; devOtp?: string; expiresAt: string }>('/api/auth/start', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  verifyAuth: (challengeId: string, otp: string) =>
    request<{ accessToken: string; token?: string; user: User; isProfileComplete: boolean; isNewUser?: boolean }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, otp }),
    }),

  devPair: (challengeId: string) =>
    request<{ challengeId: string; devOtp: string }>('/api/auth/dev-pair', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    }),

  completeProfile: (displayName: string, username: string, bio?: string, avatar?: string) =>
    request<{ user: User }>('/api/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ displayName, username, bio, avatar }),
    }),

  getMe: () => request<User>('/api/users/me'),

  updateMe: (userData: Partial<User>) =>
    request<User>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),

  // Media upload (Images, Audio, Docs)
  uploadMedia: async (fileOrFormData: any): Promise<{ url: string; name: string; size: number; mimeType: string }> => {
    let body: FormData;
    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('file', fileOrFormData);
    }
    return request<{ url: string; name: string; size: number; mimeType: string }>('/api/media/upload', {
      method: 'POST',
      body,
    });
  },

  // Chats
  getChats: () => request<Conversation[]>('/api/chats'),

  getOrCreateDirectChat: (targetUserId: string) =>
    request<Conversation>('/api/chats', {
      method: 'POST',
      body: JSON.stringify({ recipientId: targetUserId }),
    }),

  // Messages
  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      const res = await request<{ messages: Message[]; nextCursor: string | null }>(`/api/chats/${conversationId}/messages`);
      if (res && Array.isArray(res.messages)) {
        return res.messages;
      }
      if (Array.isArray(res)) {
        return res;
      }
      return [];
    } catch {
      return [];
    }
  },

  sendMessage: (payload: {
    conversationId: string;
    content: string;
    type?: 'text' | 'image' | 'voice' | 'sticker' | 'file';
    media?: any;
    replyToId?: string;
    replyToMessageId?: string;
    forwardedFrom?: { _id?: string; displayName: string; username?: string };
  }) => {
    const { conversationId, content, type = 'text', media, replyToId, replyToMessageId, forwardedFrom } = payload;
    return request<Message>(`/api/chats/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        type,
        media,
        replyToId: replyToId || replyToMessageId,
        forwardedFrom,
      }),
    });
  },

  toggleReaction: (messageId: string, emoji: string) =>
    request<{ reactions: any[] }>(`/api/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  deleteMessage: (messageId: string, deleteForBoth = true) =>
    request<{ success: boolean }>(`/api/messages/${messageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleteForBoth }),
    }),

  // Stories
  getStories: () => request<Story[]>('/api/stories'),

  createStory: (caption: string, bgColor?: string) =>
    request<Story>('/api/stories', {
      method: 'POST',
      body: JSON.stringify({ caption, bgColor }),
    }),

  // Users
  searchUsers: (query: string) => request<User[]>(`/api/users/search?q=${encodeURIComponent(query)}`),

  toggleBlockUser: (userId: string) =>
    request<{ blocked: boolean }>(`/api/users/toggle-block/${userId}`, {
      method: 'POST',
    }),
};
