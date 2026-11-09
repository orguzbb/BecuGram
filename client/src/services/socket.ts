import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.isConnecting = true;
    this.socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('⚡ Socket.IO connected with ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      this.isConnecting = false;
      console.warn('Socket connection error:', err.message);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinChat(conversationId: string): void {
    this.socket?.emit('chat:join', { conversationId });
  }

  leaveChat(conversationId: string): void {
    this.socket?.emit('chat:leave', { conversationId });
  }

  sendTypingStart(conversationId: string): void {
    this.socket?.emit('typing:start', { conversationId });
  }

  sendTypingStop(conversationId: string): void {
    this.socket?.emit('typing:stop', { conversationId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();

