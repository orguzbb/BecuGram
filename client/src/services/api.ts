import { AuthChallengeResponse, AuthVerifyResponse, User, Conversation, Message, Contact, Group } from '../types';

const API_BASE = '/api';

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
    const url = `${API_BASE}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...(options.headers || {}),
      },
      credentials: 'include',
    };

    let response = await fetch(url, config);

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
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (data.data?.accessToken) {
        localStorage.setItem('becugram_token', data.data.accessToken);
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

  async getMessages(conversationId: string, cursor?: string): Promise<{ messages: Message[]; nextCursor: string | null }> {
    const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return this.request<{ messages: Message[]; nextCursor: string | null }>(`/chats/${conversationId}/messages${params}`);
  }

  async sendMessage(conversationId: string, data: {
    type?: string;
    content: string;
    media?: any;
    replyToId?: string;
  }): Promise<Message> {
    return this.request<Message>(`/chats/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async deleteMessage(messageId: string): Promise<void> {
    await this.request(`/messages/${messageId}`, { method: 'DELETE' }).catch(() => {});
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
  async uploadFile(file: File): Promise<{ url: string; name: string; size: number; mimeType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ url: string; name: string; size: number; mimeType: string }>('/media/upload', {
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
}

export const api = new ApiService();

