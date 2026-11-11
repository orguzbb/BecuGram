import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User, Conversation, Message, Story } from '../types';

// Default host: 10.0.2.2 for Android emulator, localhost for iOS simulator, or local IP
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem('@becugram_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${currentBaseUrl}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error?.message || 'Server xatoligi');
  }

  return (data.data !== undefined ? data.data : data) as T;
}

export const mobileApi = {
  // Auth
  requestOtp: (phoneNumber: string) =>
    request<{ success: boolean; isTelegram?: boolean; demoCode?: string }>('/api/v1/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  verifyOtp: (phoneNumber: string, code: string) =>
    request<{ token: string; user: User; isProfileComplete: boolean }>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    }),

  completeProfile: (displayName: string, username: string, bio?: string, avatar?: string) =>
    request<{ token: string; user: User }>('/api/v1/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify({ displayName, username, bio, avatar }),
    }),

  getMe: () => request<User>('/api/v1/users/me'),

  // Chats
  getChats: () => request<Conversation[]>('/api/v1/chats'),

  getOrCreateDirectChat: (targetUserId: string) =>
    request<Conversation>('/api/v1/chats/direct', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),

  // Messages
  getMessages: (conversationId: string) =>
    request<Message[]>(`/api/v1/messages/conversation/${conversationId}`),

  sendMessage: (payload: {
    conversationId: string;
    content: string;
    type?: 'text' | 'image' | 'voice' | 'sticker' | 'file';
    replyToMessageId?: string;
    forwardedFrom?: { _id: string; displayName: string };
  }) =>
    request<Message>('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleReaction: (messageId: string, emoji: string) =>
    request<{ reactions: any[] }>(`/api/v1/messages/${messageId}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  deleteMessage: (messageId: string, deleteForBoth = true) =>
    request<{ success: boolean }>(`/api/v1/messages/${messageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleteForBoth }),
    }),

  // Stories
  getStories: () => request<Story[]>('/api/v1/stories'),

  createStory: (caption: string, bgColor?: string) =>
    request<Story>('/api/v1/stories', {
      method: 'POST',
      body: JSON.stringify({ caption, bgColor }),
    }),

  // Users
  searchUsers: (query: string) => request<User[]>(`/api/v1/users/search?q=${encodeURIComponent(query)}`),

  toggleBlockUser: (userId: string) =>
    request<{ blocked: boolean }>(`/api/v1/users/toggle-block/${userId}`, {
      method: 'POST',
    }),
};
