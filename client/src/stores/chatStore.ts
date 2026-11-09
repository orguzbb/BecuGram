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
  setActiveFilter: (filter: ChatFilter) => void;
  setSearchQuery: (query: string) => void;
  setTypingUser: (conversationId: string, typingName: string | null) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  setViewingProfileUser: (user: User | null) => void;
}

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
  setActiveConversation: (conv) => set({ activeConversation: conv, activeConversationId: conv?._id || null }),
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
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypingUser: (conversationId, typingName) =>
    set((state) => {
      const next = { ...state.typingUsers };
      if (typingName) {
        next[conversationId] = typingName;
      } else {
        delete next[conversationId];
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
  setViewingProfileUser: (user) => set({ viewingProfileUser: user }),
}));

