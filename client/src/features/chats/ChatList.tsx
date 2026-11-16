import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Menu,
  Edit,
  User as UserIcon,
  Users,
  Megaphone,
  Bookmark,
  Settings,
  Moon,
  Sun,
  ShieldCheck,
  LogOut,
  Plus,
  Check,
  CheckCheck,
  Pin,
  Archive,
  VolumeX,
  Volume2,
  Trash2,
  Phone,
  X,
  Folder,
  Sparkles,
  ArrowLeft,
  Bot,
  ChevronUp,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { api } from '../../services/api';
import { Conversation, ChatFolder } from '../../types';
import { format, isToday, isYesterday } from 'date-fns';
import { useToast } from '../../components/Toast';
import { Story, StoryViewerModal } from '../stories/StoryViewerModal';
import { CreateStoryModal } from '../stories/CreateStoryModal';
import { CreateFolderModal } from './CreateFolderModal';
import { PremiumModal } from '../../components/PremiumModal';

export interface RecentSearchItem {
  id: string;
  title: string;
  subtitle: string;
  avatar?: string;
  type?: 'bot' | 'user' | 'channel' | 'group';
}

const DEFAULT_STORIES: Story[] = [
  {
    id: 'story_aripov',
    userId: 'user_aripov',
    userName: 'Aripov',
    userAvatar: '',
    caption: 'Toshkentda ajoyib kun! ☀️',
    bgColor: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story_sharq',
    userId: 'user_sharq',
    userName: 'Sharqshunoslik',
    userAvatar: '',
    caption: 'Bugungi dars materiallari 📚',
    bgColor: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story_gulnoza',
    userId: 'user_gulnoza',
    userName: 'Gulnoza',
    userAvatar: '',
    caption: 'Barchaga xayrli kun! 🌸',
    bgColor: 'linear-gradient(135deg, #10B981 0%, #F59E0B 100%)',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story_a',
    userId: 'user_a',
    userName: 'A',
    userAvatar: '',
    caption: 'BecuGram Telegram 2026 🚀',
    bgColor: 'linear-gradient(135deg, #3390EC 0%, #8774E1 100%)',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_FOLDERS: ChatFolder[] = [
  { id: 'all', name: 'Hamma', filter: 'all' },
  { id: 'personal', name: 'Shaxsiy', filter: 'personal', iconName: 'User' },
  { id: 'channels', name: 'Kanal', filter: 'channels', iconName: 'Megaphone' },
  { id: 'groups', name: 'Guruhlar', filter: 'groups', iconName: 'Users' },
];

interface ChatListProps {
  onSelectChat: (conv: Conversation) => void;
  onOpenNewChatModal?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenAddContact?: () => void;
  onOpenCreateGroup?: () => void;
  onOpenAdmin?: () => void;
  onOpenSavedMessages?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  onSelectChat,
  onOpenNewChatModal,
  onOpenProfile,
  onOpenSettings,
  onOpenAddContact,
  onOpenCreateGroup,
  onOpenAdmin,
  onOpenSavedMessages,
}) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { showToast } = useToast();
  const {
    conversations,
    setConversations,
    activeConversationId,
    searchQuery,
    setSearchQuery,
    onlineUserIds,
    typingUsers,
  } = useChatStore();

  const [folders, setFolders] = useState<ChatFolder[]>(() => {
    try {
      const saved = localStorage.getItem('becugram_custom_folders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_FOLDERS;
  });
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ChatFolder | null>(null);

  const handleSaveFolder = (folder: ChatFolder) => {
    setFolders((prev) => {
      const existingIdx = prev.findIndex((f) => f.id === folder.id);
      let updated: ChatFolder[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = folder;
      } else {
        updated = [...prev, folder];
      }
      localStorage.setItem('becugram_custom_folders', JSON.stringify(updated));
      return updated;
    });
    setActiveFolderId(folder.id);
    setEditingFolder(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== folderId);
      localStorage.setItem('becugram_custom_folders', JSON.stringify(updated));
      return updated;
    });
    if (activeFolderId === folderId) {
      setActiveFolderId('all');
    }
    setEditingFolder(null);
  };

  const [showArchivedView, setShowArchivedView] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  // Pinned, Archived, Muted Chat IDs
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('becugram_pinned_chats') || '[]');
    } catch {
      return [];
    }
  });

  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('becugram_archived_chats') || '[]');
    } catch {
      return [];
    }
  });

  const [mutedIds, setMutedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('becugram_muted_chats') || '[]');
    } catch {
      return [];
    }
  });

  // Context Menu for Chat Item
  const [chatContextMenu, setChatContextMenu] = useState<{
    conv: Conversation;
    x: number;
    y: number;
  } | null>(null);

  // Long press timer ref for mobile
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stories state (Images 1, 2, 3, 4)
  const [stories, setStories] = useState<Story[]>(DEFAULT_STORIES);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storiesExpanded, setStoriesExpanded] = useState(false);

  // Dedicated Search mode states (Telegram Web K Style)
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchTab, setSearchTab] = useState<'all' | 'chats' | 'channels' | 'media' | 'files' | 'links'>('all');
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    try {
      const s = localStorage.getItem('becugram_recent_searches');
      if (s) return JSON.parse(s);
    } catch {}
    return [
      { id: 'admin', title: 'Admin', subtitle: '@admin', type: 'user' },
    ];
  });
  const [showClearRecentModal, setShowClearRecentModal] = useState(false);

  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    const match = conversations.find(
      (c) =>
        c._id === item.id ||
        (c.type === 'direct' && c.partner?._id === item.id) ||
        (c.type === 'direct' && c.partner?.username === item.title.replace('@', ''))
    );
    if (match) {
      onSelectChat(match);
      setIsSearchMode(false);
      return;
    }
    setSearchQuery(item.title);
  };

  const handleRemoveRecentSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('becugram_recent_searches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleClearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('becugram_recent_searches');
    } catch {}
    setShowClearRecentModal(false);
  };

  const handleAddRecentSearch = (title: string, subtitle: string, id: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      const updated = [{ id, title, subtitle }, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('becugram_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const getMessageSnippet = (msg?: any, isSaved?: boolean) => {
    if (!msg) return isSaved ? "O'zingiz uchun eslatmalar..." : "Xabar yo'q";
    if (msg.type === 'voice') return '🎤 Ovozli xabar';
    if (msg.type === 'video_note' || msg.media?.type === 'round_video') return '📹 Dumaloq video';
    if (msg.type === 'image' || msg.media?.type === 'image') return '📷 Rasm';
    if (msg.type === 'video' || msg.media?.type === 'video') return '🎬 Video';
    if (msg.type === 'sticker' || (typeof msg.content === 'string' && msg.content.startsWith('icon:'))) return '🌟 Stiker';
    if (msg.type === 'document' || (msg.type as any) === 'file') return `📁 ${(msg as any).fileName || 'Fayl'}`;
    return msg.content || 'Xabar';
  };

  const togglePinChat = (convId: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId];
      localStorage.setItem('becugram_pinned_chats', JSON.stringify(next));
      return next;
    });
    setChatContextMenu(null);
    showToast(pinnedIds.includes(convId) ? 'Chat qadoqdan chiqarildi' : 'Chat qadaldi 📌', 'info');
  };

  const toggleArchiveChat = (convId: string) => {
    setArchivedIds((prev) => {
      const next = prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId];
      localStorage.setItem('becugram_archived_chats', JSON.stringify(next));
      return next;
    });
    setChatContextMenu(null);
    showToast(archivedIds.includes(convId) ? 'Chat arxivdan chiqarildi' : 'Chat arxivlandi 📦', 'info');
  };

  const toggleMuteChat = (convId: string) => {
    setMutedIds((prev) => {
      const next = prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId];
      localStorage.setItem('becugram_muted_chats', JSON.stringify(next));
      return next;
    });
    setChatContextMenu(null);
    showToast(mutedIds.includes(convId) ? 'Ovoz yoqildi' : "Ovoz o'chirildi 🔇", 'info');
  };

  const handleDeleteChat = async (convId: string) => {
    setChatContextMenu(null);
    setConversations(conversations.filter((c) => c._id !== convId));
    try {
      await api.deleteChat(convId);
      showToast("Chat o'chirildi", 'info');
    } catch {
      showToast("Chat o'chirildi", 'info');
    }
  };

  const handleTouchStart = (conv: Conversation, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    touchTimerRef.current = setTimeout(() => {
      setChatContextMenu({
        conv,
        x: Math.min(Math.max(clientX, 120), window.innerWidth - 180),
        y: Math.min(clientY, window.innerHeight - 220),
      });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  // Load conversations and stories
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await api.getChats();
        if (Array.isArray(data) && data.length > 0) {
          setConversations(data);
          try {
            localStorage.setItem('becugram_cached_chats', JSON.stringify(data));
          } catch {}
        } else {
          // Default conversations if server hasn't seeded direct chats yet
          setConversations([
            {
              _id: 'conv_admin_default',
              type: 'direct',
              participants: ['admin'],
              partner: {
                _id: 'admin',
                displayName: 'Admin',
                username: 'admin',
                avatar: '',
                isOnline: true,
                isVerified: true,
              },
              lastMessage: {
                _id: 'msg_admin_1',
                conversationId: 'conv_admin_default',
                senderId: 'admin',
                content: 'Assalomu alaykum! BecuGram Telegram 2026 ga xush kelibsiz.',
                type: 'text',
                createdAt: new Date().toISOString(),
              },
              lastMessageAt: new Date().toISOString(),
              unreadCount: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load chats:', err);
      }
    };
    fetchChats();

    const fetchStories = async () => {
      try {
        const res = await api.getStories();
        if (Array.isArray(res) && res.length > 0) {
          setStories(res);
        }
      } catch {
        // Fallback to local default
      }
    };
    fetchStories();
  }, [setConversations]);

  // Format timestamp Telegram style
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return format(date, 'HH:mm');
      if (isYesterday(date)) return 'Kecha';
      return format(date, 'dd/MM');
    } catch {
      return '';
    }
  };

  // Calculate unread count for a folder
  const getFolderUnreadCount = (folder: ChatFolder) => {
    return conversations.reduce((acc, c) => {
      if (archivedIds.includes(c._id)) return acc;
      if (folder.filter === 'personal' && (c.type === 'channel' || c.type === 'group')) return acc;
      if (folder.filter === 'groups' && c.type !== 'group') return acc;
      if (folder.filter === 'channels' && c.type !== 'channel') return acc;
      if (folder.filter === 'unread' && (!c.unreadCount || c.unreadCount <= 0)) return acc;
      if (folder.filter === 'custom') {
        if (folder.includeTypes && folder.includeTypes.length > 0 && !folder.includeTypes.includes(c.type as any)) return acc;
        if (folder.chatIds && folder.chatIds.length > 0 && !folder.chatIds.includes(c._id)) return acc;
      }
      return acc + (c.unreadCount || 0);
    }, 0);
  };

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter((c) => {
      if (showArchivedView) {
        return archivedIds.includes(c._id);
      }
      if (!searchQuery.trim() && archivedIds.includes(c._id)) {
        return false;
      }

      const currentFolder = folders.find((f) => f.id === activeFolderId);
      if (currentFolder) {
        if (currentFolder.filter === 'personal' && (c.type === 'channel' || c.type === 'group')) return false;
        if (currentFolder.filter === 'groups' && c.type !== 'group') return false;
        if (currentFolder.filter === 'channels' && c.type !== 'channel') return false;
        if (currentFolder.filter === 'unread' && (!c.unreadCount || c.unreadCount <= 0)) return false;
        if (currentFolder.filter === 'custom') {
          if (currentFolder.includeTypes && currentFolder.includeTypes.length > 0) {
            const matchesType = currentFolder.includeTypes.includes(c.type as any);
            const matchesChatId = currentFolder.chatIds?.includes(c._id);
            if (!matchesType && !matchesChatId) return false;
          } else if (currentFolder.chatIds && currentFolder.chatIds.length > 0) {
            if (!currentFolder.chatIds.includes(c._id)) return false;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = c.type === 'direct' ? c.partner?.displayName || '' : c.group?.name || '';
        const username = c.partner?.username || '';
        const lastMsg = c.lastMessage?.content || '';
        return (
          title.toLowerCase().includes(q) ||
          username.toLowerCase().includes(q) ||
          lastMsg.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aPinned = pinnedIds.includes(a._id) || a._id.startsWith('conv_saved_');
      const bPinned = pinnedIds.includes(b._id) || b._id.startsWith('conv_saved_');
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const dateA = new Date(a.lastMessage?.createdAt || (a as any).updatedAt || (a as any).createdAt || 0).getTime();
      const dateB = new Date(b.lastMessage?.createdAt || (b as any).updatedAt || (b as any).createdAt || 0).getTime();
      return dateB - dateA;
    });

  // Dedicated search mode results filtered by active search tab
  const searchResults = conversations.filter((c) => {
    if (searchTab === 'channels' && c.type !== 'channel') return false;
    if (searchTab === 'chats' && c.type === 'channel') return false;
    if (
      searchTab === 'media' &&
      c.lastMessage?.type !== 'image' &&
      c.lastMessage?.type !== 'video' &&
      c.lastMessage?.type !== 'voice' &&
      c.lastMessage?.type !== 'video_note'
    )
      return false;
    if (searchTab === 'files' && c.lastMessage?.type !== 'document') return false;
    if (searchTab === 'links' && (!c.lastMessage?.content || !c.lastMessage.content.includes('http'))) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = c.type === 'direct' ? c.partner?.displayName || '' : c.group?.name || '';
    const username = c.partner?.username || '';
    const lastMsg = c.lastMessage?.content || '';
    return (
      title.toLowerCase().includes(q) ||
      username.toLowerCase().includes(q) ||
      lastMsg.toLowerCase().includes(q)
    );
  });

  const handleStoryCreated = async (newStory: Story) => {
    setStories((prev) => [newStory, ...prev]);
    try {
      await api.createStory({
        caption: newStory.caption,
        mediaUrl: newStory.mediaUrl,
        bgColor: newStory.bgColor,
      });
    } catch {
      // Handled
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    try {
      await api.deleteStory(storyId);
    } catch {
      // Handled
    }
  };

  // Only show real stories from published stories (no dummy contacts)
  const allStories: Story[] = stories.filter(
    (s) => s.userName && s.userName !== 'Foydalanuvchi'
  );

  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A';
  const cleanUsername = user?.username ? `@${user.username.replace('@', '')}` : '@Abdurahim';

  // Total archived unread count
  const archivedUnreadCount = conversations
    .filter((c) => archivedIds.includes(c._id))
    .reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#212121] text-zinc-900 dark:text-white select-none transition-colors duration-150 relative overflow-hidden">
      {/* 1. SLIDE-OUT TELEGRAM NAVIGATION DRAWER */}
      {showHamburgerMenu && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] animate-fade-in"
            onClick={() => setShowHamburgerMenu(false)}
          />

          {/* Drawer container (Slide-in from left) */}
          <div className="relative w-[285px] sm:w-[310px] h-full bg-white dark:bg-[#212121] text-zinc-900 dark:text-white flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200 border-r border-[#DADCE0] dark:border-[#303030]">
            {/* Drawer Header (Telegram Web A Clean Surface Style) */}
            <div className="p-4 pt-6 bg-white dark:bg-[#212121] text-zinc-900 dark:text-white flex flex-col justify-between relative border-b border-[#DADCE0] dark:border-[#303030]">
              <div className="flex items-start justify-between">
                {/* User Avatar */}
                <div
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenProfile?.();
                  }}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Avatar
                    name={user?.displayName || 'Abdurahim'}
                    src={user?.avatar}
                    size="lg"
                    isOnline={true}
                  />
                </div>

                {/* Night mode toggle icon on top right */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#707579] dark:text-[#AAAAAA] transition-colors"
                  title="Mavzuni o'zgartirish"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-[#707579]" />
                  )}
                </button>
              </div>

              {/* User Name & Phone */}
              <div
                onClick={() => {
                  setShowHamburgerMenu(false);
                  onOpenProfile?.();
                }}
                className="mt-4 cursor-pointer"
              >
                <span className="font-bold text-base text-zinc-900 dark:text-white block truncate leading-tight">
                  {user?.displayName || 'Abdurahim'}
                </span>
                <span className="text-xs text-[#707579] dark:text-[#AAAAAA] block mt-0.5 truncate font-mono">
                  {user?.phoneNumber || cleanUsername}
                </span>
              </div>
            </div>

            {/* Drawer Menu Items (Telegram Android Official List) */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-zinc-100 dark:divide-zinc-800/40 text-[14.5px] font-medium">
              <div className="py-1">
                {/* 👥 Yangi guruh */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenCreateGroup?.();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-700 dark:text-[#E4ECF2] transition-colors text-left cursor-pointer"
                >
                  <Users className="w-5 h-5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                  <span>Yangi guruh</span>
                </button>

                {/* 👤 Kontaktlar */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenAddContact?.();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-700 dark:text-[#E4ECF2] transition-colors text-left cursor-pointer"
                >
                  <UserIcon className="w-5 h-5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                  <span>Kontaktlar</span>
                </button>

                {/* 📞 Qo'ng'iroqlar */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    showToast("Qo'ng'iroqlar jurnali", 'info');
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-700 dark:text-[#E4ECF2] transition-colors text-left cursor-pointer"
                >
                  <Phone className="w-5 h-5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                  <span>Qo'ng'iroqlar</span>
                </button>

                {/* 💾 Saqlangan xabarlar */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenSavedMessages?.();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-700 dark:text-[#E4ECF2] transition-colors text-left cursor-pointer"
                >
                  <Bookmark className="w-5 h-5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                  <span>Saqlangan xabarlar</span>
                </button>

                {/* 📁 Chat jildlari */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    setShowFolderModal(true);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-700 dark:text-[#E4ECF2] transition-colors text-left cursor-pointer"
                >
                  <Folder className="w-5 h-5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                  <span>Chat jildlari</span>
                </button>

                {/* ⭐️ BecuGram Premium */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    setShowPremiumModal(true);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Sparkles className="w-5 h-5 text-amber-400 stroke-[2.2]" />
                    <span>BecuGram Premium</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30">
                    25 000 so'm
                  </span>
                </button>

                {/* ⚙️ Sozlamalar */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenSettings?.();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-700 dark:text-[#E4ECF2] transition-colors text-left cursor-pointer"
                >
                  <Settings className="w-5 h-5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                  <span>Sozlamalar</span>
                </button>
              </div>

              <div className="py-1">
                {/* 🌙 Tungi rejim toggle */}
                <div
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-700 dark:text-[#E4ECF2] transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    {theme === 'dark' ? (
                      <Sun className="w-5 h-5 text-amber-400 stroke-[2]" />
                    ) : (
                      <Moon className="w-5 h-5 text-[#707579] stroke-[2]" />
                    )}
                    <span>Tungi rejim</span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      theme === 'dark' ? 'bg-[#8774E1]' : 'bg-zinc-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                {/* 🛡️ Admin Panel */}
                {(user?.role === 'admin' || user?.phoneNumber === '+998889008081') && (
                  <button
                    onClick={() => {
                      setShowHamburgerMenu(false);
                      onOpenAdmin?.();
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 font-bold transition-colors text-left cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                    <span>Admin Panel</span>
                  </button>
                )}

                {/* 🚪 Chiqish */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-5 h-5 stroke-[2]" />
                  <span>Chiqish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TOP HEADER: Telegram Web A Action Bar */}
      <div className="bg-white dark:bg-[#212121] text-zinc-900 dark:text-white px-3 py-2 flex items-center gap-2 shrink-0 border-b border-[#DADCE0]/50 dark:border-[#303030]/50 z-10 transition-colors">
        {/* Hamburger Menu button OR Back button when in Search mode */}
        {isSearchMode ? (
          <button
            onClick={() => {
              setIsSearchMode(false);
              setSearchQuery('');
            }}
            className="w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors active:scale-95 shrink-0 cursor-pointer"
            title="Orqaga"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
        ) : (
          <button
            onClick={() => setShowHamburgerMenu(true)}
            className="w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors active:scale-95 shrink-0 cursor-pointer"
            title="Menyu"
          >
            <Menu className="w-5 h-5 stroke-[2]" />
          </button>
        )}

        {/* Search Pill Bar (Telegram Web A Style) */}
        <div className="flex-1 flex items-center bg-[#F4F4F5] dark:bg-[#181818] border border-transparent focus-within:border-[#3390EC] dark:focus-within:border-[#8774E1] focus-within:bg-white dark:focus-within:bg-[#212121] rounded-full px-3.5 py-1.5 transition-all">
          <Search className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA] mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchMode(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isSearchMode) setIsSearchMode(true);
            }}
            placeholder="Qidiruv"
            className="w-full bg-transparent text-zinc-900 dark:text-white placeholder-[#707579] dark:placeholder-[#AAAAAA] text-sm outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 text-[#707579] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!isSearchMode && (
          <div className="hidden sm:flex items-center gap-0.5">
            {/* Quick Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors active:scale-95 shrink-0 cursor-pointer"
              title={theme === 'dark' ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish"}
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-400 stroke-[2]" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-[#707579] stroke-[2]" />
              )}
            </button>

            {/* Compose new chat button */}
            <button
              onClick={onOpenNewChatModal}
              className="w-9 h-9 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors active:scale-95 shrink-0 cursor-pointer"
              title="Yangi suhbat"
            >
              <Edit className="w-4.5 h-4.5 stroke-[2]" />
            </button>
          </div>
        )}
      </div>

      {/* 2.1 TELEGRAM SEARCH FILTER CHIPS BAR (Only visible in search mode) */}
      {isSearchMode && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#212121] border-b border-[#DADCE0] dark:border-[#303030] overflow-x-auto scrollbar-none shrink-0 transition-colors">
          {[
            { id: 'all', label: 'Hamma' },
            { id: 'chats', label: 'Chatlar' },
            { id: 'channels', label: 'Kanallar' },
            { id: 'media', label: 'Media' },
            { id: 'files', label: 'Fayllar' },
            { id: 'links', label: 'Havolalar' },
          ].map((tab) => {
            const isActive = searchTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchTab(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#3390EC] dark:bg-[#8774E1] text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] hover:bg-zinc-200 dark:hover:bg-[#383838]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. STORIES ROW (Telegram Web A: Expandable / Collapsible) */}
      {!isSearchMode && storiesExpanded && (
        <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-[#212121] border-b border-[#DADCE0] dark:border-[#303030] overflow-x-auto scrollbar-none shrink-0 transition-all animate-fade-in">
          {/* User's Own Story */}
          <div
            onClick={() => setShowCreateStory(true)}
            className="flex flex-col items-center cursor-pointer group shrink-0"
          >
            <div className="relative w-12 h-12 shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#3390EC] via-[#8774E1] to-[#6366F1] p-[2px] shadow-xs group-hover:scale-105 transition-all flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#212121] p-0.5 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Hikoyam" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#3390EC] dark:bg-[#8774E1] text-white font-bold text-sm flex items-center justify-center select-none">
                      {initial}
                    </div>
                  )}
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#3390EC] dark:bg-[#8774E1] text-white flex items-center justify-center ring-1.5 ring-white dark:ring-[#212121] shadow-xs">
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </div>
            <span className="text-[10px] font-medium mt-0.5 text-[#707579] dark:text-[#AAAAAA]">
              Hikoyam
            </span>
          </div>

          {/* Real published stories */}
          {allStories.map((st, idx) => (
            <div
              key={st.id || idx}
              onClick={() => setActiveStoryIndex(idx)}
              className="flex flex-col items-center cursor-pointer group shrink-0"
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-tr from-[#3390EC] via-[#EC4899] to-[#8774E1] p-[2px] shadow-xs group-hover:scale-105 transition-all">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#212121] p-0.5 flex items-center justify-center overflow-hidden">
                  <Avatar name={st.userName} src={st.userAvatar} size="sm" />
                </div>
              </div>
              <span className="text-[10px] font-medium mt-0.5 text-zinc-700 dark:text-[#E4ECF2] truncate max-w-[56px]">
                {st.userName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 4. TELEGRAM FOLDER TABS BAR (Telegram Web A Style) */}
      {!isSearchMode && (
        <div className="relative flex items-center gap-1 px-3 bg-white dark:bg-[#212121] border-b border-[#DADCE0] dark:border-[#303030] overflow-x-auto scrollbar-none shrink-0 transition-colors">
          {folders.map((tab) => {
            const isActive = activeFolderId === tab.id && !showArchivedView;
            const unreadCount = getFolderUnreadCount(tab);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setShowArchivedView(false);
                  setActiveFolderId(tab.id);
                }}
                onContextMenu={(e) => {
                  if (tab.filter === 'custom') {
                    e.preventDefault();
                    setEditingFolder(tab);
                    setShowFolderModal(true);
                  }
                }}
                className={`relative py-3 px-3 text-[14px] font-medium tracking-normal whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer select-none ${
                  isActive
                    ? 'text-[#3390EC] dark:text-[#8774E1] font-semibold'
                    : 'text-[#707579] dark:text-[#AAAAAA] hover:text-[#000000] dark:hover:text-white'
                }`}
                title={tab.filter === 'custom' ? "O'ng tugma orqali tahrirlash" : undefined}
              >
                <span>{tab.name}</span>
                {unreadCount > 0 && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full leading-tight transition-colors ${
                      isActive
                        ? 'bg-[#3390EC] dark:bg-[#8774E1] text-white'
                        : 'bg-[#C4C9CC] dark:bg-[#3B3B3D] text-white'
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#3390EC] dark:bg-[#8774E1] rounded-t-full" />
                )}
              </button>
            );
          })}

          <div className="flex items-center gap-1 ml-auto shrink-0 py-1">
            {/* Stories toggle button */}
            <button
              onClick={() => setStoriesExpanded(!storiesExpanded)}
              className={`px-2.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                storiesExpanded
                  ? 'bg-[#3390EC]/15 text-[#3390EC] dark:text-[#8774E1]'
                  : 'text-zinc-500 dark:text-[#8DA39A] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Hikoyalar"
            >
              <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-[#3390EC] to-[#EC4899]" />
              <span>Hikoyalar</span>
            </button>

            {/* + Yangi jild qo'shish */}
            <button
              onClick={() => {
                setEditingFolder(null);
                setShowFolderModal(true);
              }}
              className="px-2.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap text-zinc-500 dark:text-[#8DA39A] hover:bg-zinc-100 dark:hover:bg-[#202B36] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="Yangi jild qo'shish"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Jild</span>
            </button>
          </div>
        </div>
      )}

      {/* ARCHIVE BANNER IF ACTIVE */}
      {showArchivedView && !isSearchMode && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F4F5] dark:bg-[#181818] border-b border-[#DADCE0] dark:border-[#303030] text-xs font-semibold">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Archive className="w-4 h-4 text-[#3390EC] dark:text-[#8774E1]" />
            <span>Arxivlangan chatlar ({archivedIds.length})</span>
          </div>
          <button
            onClick={() => setShowArchivedView(false)}
            className="text-[#3390EC] dark:text-[#8774E1] hover:underline font-bold cursor-pointer"
          >
            Chiqish
          </button>
        </div>
      )}

      {/* 5. CHAT LIST / SEARCH VIEW */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* DEDICATED SEARCH MODE BODY */}
        {isSearchMode ? (
          !searchQuery.trim() ? (
            <div className="py-2">
              {/* Oxirgi qidiruvlar */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between px-4 py-2 text-xs font-bold text-[#707579] dark:text-[#AAAAAA] uppercase tracking-wider">
                    <span>Oxirgi qidiruvlar</span>
                    <button
                      onClick={() => setShowClearRecentModal(true)}
                      className="text-[#3390EC] dark:text-[#8774E1] hover:underline normal-case font-semibold cursor-pointer"
                    >
                      Tozalash
                    </button>
                  </div>
                  {recentSearches.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectRecentSearch(item)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#3390EC]/15 dark:bg-[#8774E1]/20 text-[#3390EC] dark:text-[#8774E1] flex items-center justify-center font-bold text-sm shrink-0">
                          {item.type === 'bot' ? <Bot className="w-5 h-5" /> : item.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-[#707579] dark:text-[#AAAAAA] truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleRemoveRecentSearch(item.id, e)}
                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full cursor-pointer"
                        title="O'chirish"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tez-tez yozishilganlar */}
              <div className="px-4 py-2">
                <span className="text-xs font-bold text-[#707579] dark:text-[#AAAAAA] uppercase tracking-wider block mb-2">
                  Tez-tez yozishilganlar
                </span>
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2">
                  {conversations.slice(0, 8).map((c) => {
                    const isDirect = c.type === 'direct';
                    const isSaved = c._id.startsWith('conv_saved_');
                    const name = isSaved
                      ? 'Saqlanganlar'
                      : isDirect
                      ? c.partner?.displayName || 'Foydalanuvchi'
                      : c.group?.name || 'Guruh';
                    return (
                      <div
                        key={c._id}
                        onClick={() => {
                          onSelectChat(c);
                          setIsSearchMode(false);
                        }}
                        className="flex flex-col items-center cursor-pointer group shrink-0 w-16 text-center"
                      >
                        <div className="relative w-12 h-12 mb-1">
                          {isSaved ? (
                            <div className="w-12 h-12 rounded-full bg-[#3390EC] text-white flex items-center justify-center shadow-xs">
                              <Bookmark className="w-5 h-5 fill-white" />
                            </div>
                          ) : (
                            <Avatar
                              name={name}
                              src={c.partner?.avatar || c.group?.avatar}
                              size="md"
                              className="!w-12 !h-12"
                            />
                          )}
                          {c.partner?.isOnline && (
                            <span className="w-3 h-3 rounded-full bg-[#00C73E] ring-2 ring-white dark:ring-[#212121] absolute bottom-0 right-0" />
                          )}
                        </div>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate w-full group-hover:text-[#3390EC] dark:group-hover:text-[#8774E1]">
                          {name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Search results list */
            searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 dark:text-zinc-500">
                <span className="text-3xl mb-2">🔍</span>
                <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                  Bunday kontakt yoki xabar topilmadi
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Boshqa nom yoki so'zni qidiring
                </p>
              </div>
            ) : (
              searchResults.map((conv) => {
                const isDirect = conv.type === 'direct';
                const isSaved = conv._id.startsWith('conv_saved_');
                const title = isSaved
                  ? 'Saqlanganlar'
                  : isDirect
                  ? conv.partner?.displayName || 'Foydalanuvchi'
                  : conv.group?.name || 'Guruh';
                const subtitle = isDirect
                  ? `@${conv.partner?.username || 'user'}`
                  : `${(conv.group as any)?.membersCount || conv.group?.memberCount || 0} ta a'zo`;

                return (
                  <div
                    key={conv._id}
                    onClick={() => {
                      handleAddRecentSearch(title, subtitle, conv._id);
                      onSelectChat(conv);
                      setIsSearchMode(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 mx-2 my-0.5 rounded-xl cursor-pointer hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] transition-colors select-none"
                  >
                    <div className="relative shrink-0 w-[54px] h-[54px]">
                      {isSaved ? (
                        <div className="w-[54px] h-[54px] rounded-full bg-[#3390EC] dark:bg-[#8774E1] text-white flex items-center justify-center shadow-xs">
                          <Bookmark className="w-6 h-6 stroke-[2.2] fill-white" />
                        </div>
                      ) : (
                        <Avatar
                          name={title}
                          src={conv.partner?.avatar || conv.group?.avatar}
                          size="md"
                          isOnline={conv.partner?.isOnline}
                          className="!w-[54px] !h-[54px]"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[15px] text-zinc-900 dark:text-white truncate">
                          {title}
                        </span>
                        <span className="text-[12px] text-[#707579] dark:text-[#AAAAAA]">
                          {formatTime(conv.lastMessage?.createdAt || (conv as any).updatedAt)}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#707579] dark:text-[#AAAAAA] truncate">
                        {conv.lastMessage ? getMessageSnippet(conv.lastMessage, isSaved) : subtitle}
                      </p>
                    </div>
                  </div>
                );
              })
            )
          )
        ) : (
          /* NORMAL CHAT LIST VIEW */
          <>
            {/* ARXIV ROW AT TOP */}
            {!showArchivedView && (
              <div
                onClick={() => setShowArchivedView(true)}
                className="flex items-center gap-3 px-3 py-2 mx-2 my-0.5 rounded-xl cursor-pointer hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] transition-colors select-none"
              >
                <div className="relative shrink-0 w-[54px] h-[54px]">
                  <div className="w-[54px] h-[54px] rounded-full bg-[#707579] dark:bg-[#3B3B3D] text-white flex items-center justify-center shadow-xs">
                    <Archive className="w-5 h-5 stroke-[2]" />
                  </div>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[15px] text-zinc-900 dark:text-white">Arxiv</span>
                    {archivedUnreadCount > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#707579] dark:bg-[#3B3B3D] text-white">
                        {archivedUnreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-[#707579] dark:text-[#AAAAAA] truncate">
                    {archivedIds.length > 0 ? `${archivedIds.length} ta arxivlangan chat` : 'BecuGram'}
                  </p>
                </div>
              </div>
            )}

            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 dark:text-zinc-500">
                <p className="text-xs">Suhbatlar topilmadi</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isDirect = conv.type === 'direct';
                const isSaved = conv._id.startsWith('conv_saved_');
                const isPinned = pinnedIds.includes(conv._id) || isSaved;
                const isMuted = mutedIds.includes(conv._id);
                const title = isSaved
                  ? 'Saqlanganlar'
                  : isDirect
                  ? conv.partner?.displayName || 'Foydalanuvchi'
                  : conv.group?.name || 'Guruh';
                const isSelected = conv._id === activeConversationId;
                const lastMsg = conv.lastMessage;
                const sId = typeof lastMsg?.senderId === 'object' && lastMsg?.senderId ? lastMsg.senderId._id : lastMsg?.senderId;
                const isMeLast = sId === user?._id || sId === 'user_default';
                const isOnlineNow = Boolean(
                  conv.partner?._id && (conv.partner.isOnline || onlineUserIds.has(conv.partner._id))
                );
                const isTypingNow = Boolean(
                  typingUsers[conv._id] || (conv.partner?._id && typingUsers[conv.partner._id])
                );

                return (
                  <div
                    key={conv._id}
                    onClick={() => onSelectChat(conv)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setChatContextMenu({
                        conv,
                        x: Math.min(Math.max(e.clientX, 120), window.innerWidth - 180),
                        y: Math.min(e.clientY, window.innerHeight - 220),
                      });
                    }}
                    onTouchStart={(e) => handleTouchStart(conv, e)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    className={`flex items-center gap-3 px-3 py-2 mx-2 my-0.5 rounded-xl cursor-pointer transition-colors duration-100 select-none relative ${
                      isSelected
                        ? 'bg-[#3390EC] dark:bg-[#766AC8] text-white'
                        : 'hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-900 dark:text-white'
                    }`}
                  >
                    {/* 54px Telegram Avatar */}
                    <div className="relative shrink-0 w-[54px] h-[54px]">
                      {isSaved ? (
                        <div className="w-[54px] h-[54px] rounded-full bg-[#3390EC] dark:bg-[#8774E1] text-white flex items-center justify-center shadow-xs">
                          <Bookmark className="w-6 h-6 stroke-[2.2] fill-white" />
                        </div>
                      ) : (
                        <Avatar
                          name={title}
                          src={conv.partner?.avatar || conv.group?.avatar}
                          size="md"
                          isOnline={isOnlineNow}
                          className="!w-[54px] !h-[54px]"
                        />
                      )}
                      {isOnlineNow && !isSaved && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#00C73E] ring-2 ring-white dark:ring-[#212121] absolute bottom-0 right-0" />
                      )}
                    </div>

                    {/* Info & Message Preview */}
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-medium text-[15px] truncate ${isSelected ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                            {title}
                          </span>
                          {conv.partner?.premiumBadge && (
                            <span className="text-xs shrink-0 select-none" title="BecuGram Premium">
                              {conv.partner.premiumBadge}
                            </span>
                          )}
                          {/* Telegram Verified Checkmark SVG */}
                          {(isSaved || conv.partner?.isVerified) && (
                            <svg className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#3390EC] dark:text-[#8774E1]'}`} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
                            </svg>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMeLast && lastMsg && (
                            lastMsg.isRead ? (
                              <CheckCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#3390EC] dark:text-[#8774E1]'}`} />
                            ) : (
                              <Check className={`w-3.5 h-3.5 ${isSelected ? 'text-white/80' : 'text-[#707579] dark:text-[#AAAAAA]'}`} />
                            )
                          )}
                          <span className={`text-[12px] font-normal ${
                            isSelected ? 'text-white/80' : 'text-[#707579] dark:text-[#AAAAAA]'
                          }`}>
                            {formatTime(lastMsg?.createdAt || (conv as any).updatedAt || (conv as any).createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[14px]">
                        <div className={`min-w-0 flex-1 truncate pr-2 ${
                          isSelected ? 'text-white/90' : 'text-[#707579] dark:text-[#AAAAAA]'
                        }`}>
                          {isTypingNow ? (
                            <span className={`font-medium flex items-center gap-1.5 animate-pulse ${isSelected ? 'text-white' : 'text-[#3390EC] dark:text-[#8774E1]'}`}>
                              <span>yozmoqda...</span>
                            </span>
                          ) : (
                            <p className="truncate">
                              {conv.type === 'group' && lastMsg && (
                                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                  {lastMsg.senderId === user?._id ? 'Siz: ' : "A'zo: "}
                                </span>
                              )}
                              {getMessageSnippet(lastMsg, isSaved)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isMuted && <VolumeX className={`w-3.5 h-3.5 ${isSelected ? 'text-white/80' : 'text-[#707579] dark:text-[#AAAAAA]'}`} />}
                          {isPinned && <Pin className={`w-3.5 h-3.5 rotate-45 ${isSelected ? 'text-white/80' : 'text-[#707579] dark:text-[#AAAAAA]'}`} />}

                          {/* Unread badge: White on selected, Telegram primary or gray if muted */}
                          {conv.unreadCount && conv.unreadCount > 0 ? (
                            <span
                              className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-white text-[#3390EC] dark:text-[#766AC8]'
                                  : isMuted
                                  ? 'bg-[#C4C9CC] dark:bg-[#5B5B5A] text-white'
                                  : 'bg-[#3390EC] dark:bg-[#8774E1] text-white'
                              }`}
                            >
                              {conv.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
              </div>
            );
          })
        )}
      </>
    )}
  </div>

      {/* 6. TELEGRAM FLOATING ACTION BUTTON (Pencil FAB on mobile) */}
      <button
        onClick={onOpenNewChatModal}
        className="md:hidden absolute bottom-20 right-5 w-14 h-14 rounded-full bg-[#3390EC] dark:bg-[#8774E1] text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
        title="Yangi xabar"
      >
        <Edit className="w-6 h-6 stroke-[2.2]" />
      </button>

      {/* CHAT ITEM CONTEXT MENU (Right-click PC, long-press mobile) */}
      {chatContextMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px]"
          onClick={() => setChatContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setChatContextMenu(null);
          }}
        >
          <div
            style={{
              top: chatContextMenu.y,
              left: chatContextMenu.x,
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed w-52 bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] rounded-xl shadow-2xl py-1.5 z-50 text-[13px] font-medium animate-fade-in select-none"
          >
            {/* Pin / Unpin */}
            <button
              onClick={() => togglePinChat(chatContextMenu.conv._id)}
              className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors text-left cursor-pointer"
            >
              <Pin className="w-4 h-4 text-zinc-400 stroke-[2.2]" />
              <span>{pinnedIds.includes(chatContextMenu.conv._id) ? 'Qadoqdan chiqarish' : 'Qadash'}</span>
            </button>

            {/* Archive / Unarchive */}
            <button
              onClick={() => toggleArchiveChat(chatContextMenu.conv._id)}
              className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors text-left cursor-pointer"
            >
              <Archive className="w-4 h-4 text-zinc-400 stroke-[2.2]" />
              <span>{archivedIds.includes(chatContextMenu.conv._id) ? 'Arxivdan chiqarish' : 'Arxivlash'}</span>
            </button>

            {/* Mute / Unmute */}
            <button
              onClick={() => toggleMuteChat(chatContextMenu.conv._id)}
              className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 transition-colors text-left cursor-pointer"
            >
              {mutedIds.includes(chatContextMenu.conv._id) ? (
                <>
                  <Volume2 className="w-4 h-4 text-zinc-400 stroke-[2.2]" />
                  <span>Ovozni yoqish</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-zinc-400 stroke-[2.2]" />
                  <span>Ovozni o'chirish</span>
                </>
              )}
            </button>

            <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />

            {/* Delete chat */}
            <button
              onClick={() => handleDeleteChat(chatContextMenu.conv._id)}
              className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer"
            >
              <Trash2 className="w-4 h-4 stroke-[2.2]" />
              <span>O'chirish</span>
            </button>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          stories={allStories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onDeleteStory={handleDeleteStory}
          onReplyToStory={async (story, text) => {
            try {
              const conv = await api.getOrCreateDirectChat(story.userId);
              await api.sendMessage(conv._id, {
                content: `🌸 Hikoyaga javob: "${text}"`,
                type: 'text',
              });
              onSelectChat(conv);
              setActiveStoryIndex(null);
            } catch {}
          }}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {/* Create / Edit Custom Chat Folder Modal */}
      {showFolderModal && (
        <CreateFolderModal
          conversations={conversations}
          existingFolder={editingFolder}
          onClose={() => {
            setShowFolderModal(false);
            setEditingFolder(null);
          }}
          onSave={handleSaveFolder}
          onDelete={handleDeleteFolder}
        />
      )}

      {/* Clear Recent Searches Modal */}
      {showClearRecentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-xs bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] rounded-2xl shadow-2xl p-5 text-center animate-scale-in">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
              Qidiruv tarixini tozalash
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Barcha oxirgi qidiruv yozuvlarini o'chirib tashlamoqchimisiz?
            </p>
            <div className="flex items-center justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setShowClearRecentModal(false)}
                className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleClearAllRecent}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
              >
                Tozalash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Premium Modal */}
      {showPremiumModal && (
        <PremiumModal
          onClose={() => setShowPremiumModal(false)}
        />
      )}
    </div>
  );
};
