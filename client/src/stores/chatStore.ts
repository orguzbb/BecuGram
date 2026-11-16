import { create } from 'zustand';
import { Conversation, Message, User } from '../types';

export type ChatFilter = 'all' | 'personal' | 'groups' | 'unread';

interface ChatState {
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  conversations: Conversation[];
  activeFilter: ChatFilter;
  searchQuery: string;
  typingUsers: Record<string, string>; // conversationId -> typing string
  onlineUserIds: Set<string>;
  viewingProfileUser: User | null;

  setActiveConversationId: (id: string | null) => void;
  setActiveConversation: (conv: Conversation | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  updateConversationInList: (conversationId: string, updates: Partial<Conversation>) => void;
  setLastMessage: (conversationId: string, message: Message) => void;
  incrementUnreadCount: (conversationId: string) => void;
  resetUnreadCount: (conversationId: string) => void;
  setActiveFilter: (filter: ChatFilter) => void;
  setSearchQuery: (query: string) => void;
  setTypingUser: (conversationId: string, typingName: string | null, userId?: string) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setAllOnlineUsers: (userIds: string[]) => void;
  setViewingProfileUser: (user: User | null) => void;
}

const typingTimers = new Map<string, any>();

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  activeConversation: null,
  conversations: [],
  activeFilter: 'all',
  searchQuery: '',
  typingUsers: {},
  onlineUserIds: new Set(),
  viewingProfileUser: null,

  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setActiveConversation: (conv) =>
    set({ activeConversation: conv, activeConversationId: conv?._id || null }),
  setConversations: (conversations) => set({ conversations }),
  updateConversationInList: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, ...updates } : c
      ),
      activeConversation:
        state.activeConversation?._id === conversationId
          ? { ...state.activeConversation, ...updates }
          : state.activeConversation,
    })),
  setLastMessage: (conversationId, message) =>
    set((state) => {
      const convIndex = state.conversations.findIndex((c) => c._id === conversationId);
      if (convIndex === -1) return state;

      const updatedConv = {
        ...state.conversations[convIndex],
        lastMessage: message,
        lastMessageAt: message.createdAt,
      };

      // Move to top of chat list (Telegram style)
      const newConversations = [
        updatedConv,
        ...state.conversations.filter((c) => c._id !== conversationId),
      ];

      return {
        conversations: newConversations,
        activeConversation:
          state.activeConversation?._id === conversationId
            ? updatedConv
            : state.activeConversation,
      };
    }),
  incrementUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
      ),
    })),
  resetUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
      activeConversation:
        state.activeConversation?._id === conversationId
          ? { ...state.activeConversation, unreadCount: 0 }
          : state.activeConversation,
    })),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypingUser: (conversationId, typingName, userId) =>
    set((state) => {
      const next = { ...state.typingUsers };
      if (typingName) {
        next[conversationId] = typingName;
        if (userId) next[userId] = typingName;

        // Auto-clear typing indicator after 5 seconds of silence
        const existingTimer = typingTimers.get(conversationId);
        if (existingTimer) clearTimeout(existingTimer);
        const timer = setTimeout(() => {
          useChatStore.getState().setTypingUser(conversationId, null, userId);
        }, 5000);
        typingTimers.set(conversationId, timer);
      } else {
        delete next[conversationId];
        if (userId) delete next[userId];
        const existingTimer = typingTimers.get(conversationId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          typingTimers.delete(conversationId);
        }
      }
      return { typingUsers: next };
    }),
  setUserOnline: (userId, isOnline) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      if (isOnline) next.add(userId);
      else next.delete(userId);
      return { onlineUserIds: next };
    }),
  setAllOnlineUsers: (userIds) =>
    set(() => ({
      onlineUserIds: new Set(userIds),
    })),
  setViewingProfileUser: (user) => set({ viewingProfileUser: user }),
}));
