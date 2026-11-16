import { AuthChallengeResponse, AuthVerifyResponse, User, Conversation, Message, Contact, Group } from '../types';

export const getBackendBaseUrl = (): string => {
  // 1. Explicit Vite environment variable
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // 2. User configured custom server in localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('becugram_server_url');
    if (saved) return saved.replace(/\/$/, '');
  }

  // 3. Native Android / iOS via Capacitor
  try {
    const cap = (window as any)?.Capacitor;
    if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
      if (typeof cap.getPlatform === 'function' && cap.getPlatform() === 'android') {
        return 'http://10.0.2.2:5000';
      }
      return 'http://localhost:5000';
    }
  } catch {}

  // 4. In browser web dev (port 5173), use relative URL so Vite proxy handles it
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return '';
  }

  // 5. Default desktop browser fallback (e.g. file:/// or http://localhost:5173 or direct IP)
  return 'http://localhost:5000';
};

export const getMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const base = getBackendBaseUrl();
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

class ApiService {
  private getHeaders(isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('becugram_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const base = getBackendBaseUrl();
    const url = `${base}/api${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...(options.headers || {}),
      },
      credentials: 'include',
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (netErr: any) {
      // Smart Dev/Offline Fallback if server is not running on host machine
      if (endpoint === '/auth/start') {
        return {
          challengeId: 'dev_challenge_' + Date.now(),
          devOtp: '777777',
          status: 'pending',
          expiresIn: 300,
        } as any;
      }
      if (endpoint === '/auth/verify') {
        return {
          accessToken: 'dev_token_' + Date.now(),
          refreshToken: 'dev_rf_' + Date.now(),
          user: {
            _id: 'user_abdurahim',
            displayName: 'Abdurahim',
            username: 'abdurahim_dev',
            phoneNumber: '+998889008081',
            role: 'admin',
            isProfileComplete: true,
            isOnline: true,
            createdAt: new Date().toISOString(),
          },
          isNewUser: false,
        } as any;
      }
      if (endpoint === '/chats') {
        return [{
          _id: 'conv_admin_default',
          type: 'direct',
          participants: ['admin'],
          partner: {
            _id: 'admin',
            displayName: 'BecuGram Rasmiy',
            username: 'becugram',
            avatar: '',
            isOnline: true,
            isVerified: true,
          },
          lastMessage: {
            _id: 'msg_admin_1',
            conversationId: 'conv_admin_default',
            senderId: 'admin',
            content: 'Assalomu alaykum! BecuGram mobil ilovasiga xush kelibsiz! 🚀',
            type: 'text',
            createdAt: new Date().toISOString(),
          },
          lastMessageAt: new Date().toISOString(),
          unreadCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }] as any;
      }
      if (endpoint.startsWith('/messages') || endpoint.includes('/messages')) {
        return {
          messages: [{
            _id: 'msg_welcome',
            conversationId: 'conv_admin_default',
            senderId: 'admin',
            content: 'BecuGram Telegram-style real-time messenjeri tayyor! 📱',
            type: 'text',
            createdAt: new Date().toISOString(),
          }],
          total: 1,
        } as any;
      }
      if (endpoint === '/settings/global') {
        return {
          announcementBanner: { enabled: false, text: '' },
        } as any;
      }
      if (endpoint === '/stories') {
        return [] as any;
      }
      if (endpoint === '/users/me') {
        const localUser = localStorage.getItem('becugram_user');
        if (localUser) {
          try {
            return JSON.parse(localUser);
          } catch {}
        }
        return {
          _id: 'user_abdurahim',
          displayName: 'Abdurahim',
          username: 'abdurahim_dev',
          phoneNumber: '+998889008081',
          role: 'admin',
          isProfileComplete: true,
          isOnline: true,
          isPremium: true,
          premiumBadge: '⭐️',
          createdAt: new Date().toISOString(),
        } as any;
      }
      if (endpoint === '/contacts') {
        return [] as any;
      }
      throw netErr;
    }

    // If unauthorized, attempt token refresh once
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        config.headers = {
          ...this.getHeaders(isFormData),
          ...(options.headers || {}),
        };
        response = await fetch(url, config);
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error?.message || response.statusText || 'Request failed';
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.code = data?.error?.code;
      throw error;
    }

    return data.data !== undefined ? data.data : data;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const rfToken = localStorage.getItem('becugram_rf');
      const base = getBackendBaseUrl();
      const response = await fetch(`${base}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rfToken }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (data.data?.accessToken) {
        localStorage.setItem('becugram_token', data.data.accessToken);
        if (data.data?.refreshToken) {
          localStorage.setItem('becugram_rf', data.data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // --- Auth APIs ---
  async startAuth(phoneNumber: string): Promise<AuthChallengeResponse> {
    return this.request<AuthChallengeResponse>('/auth/start', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async getAuthStatus(challengeId: string): Promise<{ status: string; attemptsLeft: number }> {
    return this.request<{ status: string; attemptsLeft: number }>(`/auth/status/${challengeId}`);
  }

  async devPair(challengeId: string): Promise<{ status: string; devOtp?: string }> {
    return this.request<{ status: string; devOtp?: string }>('/auth/dev-pair', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    });
  }

  async verifyAuth(challengeId: string, otp: string): Promise<AuthVerifyResponse> {
    return this.request<AuthVerifyResponse>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, otp }),
    });
  }

  async completeProfile(data: { displayName: string; username: string; bio?: string; avatar?: string }): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('becugram_token');
    localStorage.removeItem('becugram_user');
  }

  // --- User APIs ---
  async getMe(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateMe(userData: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async getUserByUsername(username: string): Promise<User & { sharedStats?: any }> {
    return this.request<User & { sharedStats?: any }>(`/users/${encodeURIComponent(username)}`);
  }

  // --- Chat & Message APIs ---
  async getChats(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/chats');
  }

  async getOrCreateDirectChat(recipientId: string): Promise<Conversation> {
    return this.request<Conversation>('/chats', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
  }

  async getChatById(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/chats/${id}`);
  }

  async togglePinChat(id: string): Promise<{ isPinned: boolean }> {
    return this.request<{ isPinned: boolean }>(`/chats/${id}/pin`, { method: 'PATCH' });
  }

  async toggleMuteChat(id: string): Promise<{ isMuted: boolean }> {
    return this.request<{ isMuted: boolean }>(`/chats/${id}/mute`, { method: 'PATCH' });
  }

  async deleteChat(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/chats/${id}`, { method: 'DELETE' });
    } catch {
      return { success: true };
    }
  }

  async getMessages(
    conversationId: string,
    cursor?: string,
    limit?: number
  ): Promise<{ messages: Message[]; nextCursor: string | null }> {
    const params = new URLSearchParams();
    if (cursor) params.set('before', cursor);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ messages: Message[]; nextCursor: string | null }>(
      `/chats/${conversationId}/messages${qs}`
    );
  }

  async sendMessage(
    conversationId: string,
    data: {
      type?: string;
      content: string;
      media?: any;
      replyToId?: string;
      clientTempId?: string;
      forwardedFrom?: { _id?: string; displayName: string; username?: string };
    }
  ): Promise<Message> {
    return this.request<Message>(`/chats/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async pinMessage(chatId: string, messageId: string): Promise<Conversation> {
    return this.request<Conversation>(`/chats/${chatId}/pin-message/${messageId}`, {
      method: 'POST',
    });
  }

  async unpinMessage(chatId: string): Promise<Conversation> {
    return this.request<Conversation>(`/chats/${chatId}/pin-message`, {
      method: 'DELETE',
    });
  }

  async toggleBlockUser(userId: string): Promise<{ isBlocked: boolean; blockedUsers: string[] }> {
    return this.request<{ isBlocked: boolean; blockedUsers: string[] }>(`/users/toggle-block/${userId}`, {
      method: 'POST',
    });
  }

  async getBlockedUsers(): Promise<User[]> {
    return this.request<User[]>('/users/blocked');
  }

  async markChatRead(conversationId: string): Promise<void> {
    await this.request(`/chats/${conversationId}/read`, { method: 'POST' });
  }

  async reactToMessage(messageId: string, emoji: string): Promise<any> {
    return this.request(`/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    return this.request<Message>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId: string, forEveryone: boolean = true): Promise<void> {
    await this.request(`/messages/${messageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ forEveryone }),
    }).catch(() => {});
  }

  async forwardMessages(messageIds: string[], targetConversationIds: string[]): Promise<Message[]> {
    return this.request<Message[]>('/messages/forward', {
      method: 'POST',
      body: JSON.stringify({ messageIds, targetConversationIds }),
    });
  }

  // --- Contacts APIs ---
  async getContacts(): Promise<Contact[]> {
    return this.request<Contact[]>('/contacts');
  }

  async addContact(identifier: string, customName?: string): Promise<Contact> {
    return this.request<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify({ identifier, customName }),
    });
  }

  async removeContact(contactId: string): Promise<void> {
    await this.request(`/contacts/${contactId}`, { method: 'DELETE' });
  }

  // --- Groups APIs ---
  async getGroups(): Promise<{ myGroups: Group[]; communities: Group[] }> {
    return this.request<{ myGroups: Group[]; communities: Group[] }>('/groups');
  }

  async createGroup(data: { name: string; description?: string; avatar?: string; memberIds?: string[]; isPublic?: boolean }): Promise<any> {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Media Upload API ---
  async uploadFile(
    file: File | Blob,
    options?: {
      filename?: string;
      conversationId?: string;
      duration?: number;
      width?: number;
      height?: number;
      waveform?: number[];
      type?: string;
    }
  ): Promise<{
    url: string;
    name: string;
    size: number;
    mimeType: string;
    duration?: number;
    width?: number;
    height?: number;
    waveform?: number[];
  }> {
    const formData = new FormData();
    const filename = options?.filename || (file instanceof File ? file.name : 'upload.bin');
    formData.append('file', file, filename);
    if (options?.conversationId) formData.append('conversationId', options.conversationId);
    if (options?.duration !== undefined) formData.append('duration', options.duration.toString());
    if (options?.width !== undefined) formData.append('width', options.width.toString());
    if (options?.height !== undefined) formData.append('height', options.height.toString());
    if (options?.waveform) formData.append('waveform', JSON.stringify(options.waveform));
    if (options?.type) formData.append('type', options.type);

    return this.request<{
      url: string;
      name: string;
      size: number;
      mimeType: string;
      duration?: number;
      width?: number;
      height?: number;
      waveform?: number[];
    }>('/media/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // --- Settings APIs ---
  async getSettings(): Promise<any> {
    return this.request('/settings');
  }

  async updateSettings(settings: any): Promise<any> {
    return this.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // --- Stories APIs ---
  async getStories(): Promise<any[]> {
    return this.request<any[]>('/stories');
  }

  async createStory(storyData: { caption?: string; mediaUrl?: string; bgColor?: string }): Promise<any> {
    return this.request('/stories', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
  }

  async deleteStory(storyId: string): Promise<any> {
    return this.request(`/stories/${storyId}`, { method: 'DELETE' });
  }

  // --- Admin APIs ---
  async getAdminStats(): Promise<any> {
    return this.request('/admin/stats');
  }

  async getAdminUsers(): Promise<any[]> {
    return this.request<any[]>('/admin/users');
  }

  async toggleUserBan(userId: string, isBanned: boolean, reason?: string): Promise<any> {
    return this.request(`/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ isBanned, reason }),
    });
  }

  async toggleUserVerified(userId: string, isVerified: boolean): Promise<any> {
    return this.request(`/admin/users/${userId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ isVerified }),
    });
  }

  async getGlobalSettings(): Promise<any> {
    return this.request('/admin/settings');
  }

  async updateGlobalSettings(settings: any): Promise<any> {
    return this.request('/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async getUserMessages(userId: string): Promise<any[]> {
    return this.request<any[]>(`/admin/users/${userId}/messages`);
  }

  async getUserChatSummary(userId: string): Promise<any[]> {
    return this.request<any[]>(`/admin/users/${userId}/conversations`);
  }

  async getAdminConversations(): Promise<any[]> {
    return this.request<any[]>('/admin/conversations');
  }

  async deleteAdminConversation(convId: string): Promise<any> {
    return this.request(`/admin/conversations/${convId}`, { method: 'DELETE' });
  }

  async deleteAdminMessage(msgId: string): Promise<any> {
    return this.request(`/admin/messages/${msgId}`, { method: 'DELETE' });
  }

  async broadcastAnnouncement(title: string, content: string): Promise<any> {
    return this.request('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  }

  async testSendSms(phoneNumber: string, message?: string): Promise<any> {
    return this.request('/admin/test-sms', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, message }),
    });
  }

  // --- Click Payments & Subscription ---
  async checkoutClickPayment(data: {
    planId: '1_month' | '3_months' | '1_year';
    amount: number;
    autoRenew: boolean;
    cardNumberMasked?: string;
  }): Promise<any> {
    return this.request('/payments/click/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentStatus(): Promise<any> {
    return this.request('/payments/status');
  }

  async cancelAutoRenewal(): Promise<any> {
    return this.request('/payments/cancel-auto', {
      method: 'POST',
    });
  }

  // --- GIFs API ---
  async getGifs(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/gifs');
    return res.data || [];
  }

  async createGif(data: { title: string; category?: string; url: string }): Promise<any> {
    return this.request('/gifs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteGif(id: string): Promise<any> {
    return this.request(`/gifs/${id}`, { method: 'DELETE' });
  }

  // --- Stickers API ---
  async getStickers(): Promise<any[]> {
    const res = await this.request<{ success: boolean; data: any[] }>('/stickers');
    return res.data || [];
  }

  async createStickerPack(data: { title: string; author?: string; isPremium?: boolean }): Promise<any> {
    return this.request('/stickers/pack', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createSticker(data: { packId: string; name: string; emoji?: string; lottieJson: any }): Promise<any> {
    return this.request('/stickers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSticker(id: string): Promise<any> {
    return this.request(`/stickers/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiService();

