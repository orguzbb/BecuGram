import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  initAuth: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

const sanitizeUser = (user: User | null): User | null => {
  if (!user) return null;
  if (user.avatar && (user.avatar.includes('1794151183673') || user.avatar.includes('unsplash'))) {
    return { ...user, avatar: '' };
  }
  return user;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('becugram_token'),
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  initAuth: async () => {
    const savedToken = localStorage.getItem('becugram_token');
    if (!savedToken) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
      return;
    }

    try {
      const rawUser = await api.getMe();
      const user = sanitizeUser(rawUser);
      socketService.connect(savedToken);
      if (user) {
        localStorage.setItem('becugram_user', JSON.stringify(user));
      }
      set({ user, token: savedToken, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch {
      localStorage.removeItem('becugram_token');
      localStorage.removeItem('becugram_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },

  setAuth: (rawUser: User, token: string) => {
    const user = sanitizeUser(rawUser) || rawUser;
    localStorage.setItem('becugram_token', token);
    localStorage.setItem('becugram_user', JSON.stringify(user));
    socketService.connect(token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  setUser: (rawUser: User) => {
    const user = sanitizeUser(rawUser) || rawUser;
    localStorage.setItem('becugram_user', JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    try {
      await api.logout();
    } finally {
      socketService.disconnect();
      localStorage.removeItem('becugram_token');
      localStorage.removeItem('becugram_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

