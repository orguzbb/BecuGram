import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from './api';

class MobileSocketService {
  private socket: Socket | null = null;

  async connect(): Promise<Socket> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const token = await AsyncStorage.getItem('@becugram_token');
    const url = getBaseUrl();

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Mobile Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Mobile Socket disconnected');
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(conversationId: string) {
    if (this.socket) {
      this.socket.emit('chat:join', conversationId);
    }
  }

  leaveChat(conversationId: string) {
    if (this.socket) {
      this.socket.emit('chat:leave', conversationId);
    }
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('chat:typing', { conversationId, isTyping });
    }
  }
}

export const mobileSocket = new MobileSocketService();
