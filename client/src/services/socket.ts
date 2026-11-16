import { io, Socket } from 'socket.io-client';
import { getBackendBaseUrl } from './api';
import { Message } from '../types';
import { useChatStore } from '../stores/chatStore';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private currentChatId: string | null = null;
  private lastToken: string | null = null;

  connect(token: string): Socket {
    this.lastToken = token;

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.isConnecting = true;
    const host = getBackendBaseUrl() || window.location.origin;

    this.socket = io(host, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('⚡ Socket.IO connected with ID:', this.socket?.id);

      // Re-join active chat if reconnecting
      if (this.currentChatId) {
        this.socket?.emit('chat:join', { conversationId: this.currentChatId });
      }

      // Query online users upon connect/reconnect
      this.queryOnlineUsers();
    });

    this.socket.on('reconnect', (attempt) => {
      console.log(`⚡ Socket.IO reconnected successfully (attempt ${attempt})`);
      if (this.currentChatId) {
        this.socket?.emit('chat:join', { conversationId: this.currentChatId });
      }
      this.queryOnlineUsers();
    });

    this.socket.on('connect_error', (err) => {
      this.isConnecting = false;
      console.warn('Socket connection error:', err.message);
    });

    // Global Presence Update Listener
    this.socket.on('presence:update', (payload: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      useChatStore.getState().setUserOnline(payload.userId, payload.isOnline);
    });

    // Global Initial Online Users Listener
    this.socket.on('presence:initial', (payload: { onlineUserIds: string[] }) => {
      if (Array.isArray(payload.onlineUserIds)) {
        useChatStore.getState().setAllOnlineUsers(payload.onlineUserIds);
      }
    });

    // Global Typing Indicator Listener
    this.socket.on('typing:update', (payload: { conversationId: string; userId: string; displayName: string; isTyping: boolean }) => {
      useChatStore.getState().setTypingUser(
        payload.conversationId,
        payload.isTyping ? payload.displayName : null,
        payload.userId
      );
    });

    // Global Read Reset for Multi-device Sync
    this.socket.on('chat:unread_reset', (payload: { conversationId: string }) => {
      useChatStore.getState().resetUnreadCount(payload.conversationId);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinChat(conversationId: string): void {
    this.currentChatId = conversationId;
    this.socket?.emit('chat:join', { conversationId });
  }

  leaveChat(conversationId: string): void {
    if (this.currentChatId === conversationId) {
      this.currentChatId = null;
    }
    this.socket?.emit('chat:leave', { conversationId });
  }

  sendTypingStart(conversationId: string): void {
    this.socket?.emit('typing:start', { conversationId });
  }

  sendTypingStop(conversationId: string): void {
    this.socket?.emit('typing:stop', { conversationId });
  }

  queryOnlineUsers(): void {
    this.socket?.emit('presence:get_online', (res?: { success: boolean; onlineUserIds: string[] }) => {
      if (res?.success && Array.isArray(res.onlineUserIds)) {
        useChatStore.getState().setAllOnlineUsers(res.onlineUserIds);
      }
    });
  }

  markMessagesRead(conversationId: string, messageIds?: string[]): void {
    this.socket?.emit('message:read', { conversationId, messageIds });
    useChatStore.getState().resetUnreadCount(conversationId);
  }

  sendMessage(data: {
    tempId: string;
    conversationId: string;
    content: string;
    type?: string;
    media?: any;
    replyToId?: string;
    forwardedFrom?: any;
  }): Promise<Message> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Socket message acknowledgement timeout'));
      }, 10000);

      this.socket.emit('message:send', data, (res: { success: boolean; data?: Message; error?: any }) => {
        clearTimeout(timer);
        if (res?.success && res.data) {
          resolve(res.data);
        } else {
          reject(new Error(res?.error?.message || 'Failed to send message via socket'));
        }
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentChatId = null;
      this.isConnecting = false;
    }
  }
}

export const socketService = new SocketService();
