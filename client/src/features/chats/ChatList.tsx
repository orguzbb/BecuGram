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
  Pin,
  Archive,
  VolumeX,
  Volume2,
  Trash2,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { api } from '../../services/api';
import { Conversation } from '../../types';
import { format, isToday, isYesterday } from 'date-fns';
import { useToast } from '../../components/Toast';
import { Story, StoryViewerModal } from '../stories/StoryViewerModal';
import { CreateStoryModal } from '../stories/CreateStoryModal';

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
  } = useChatStore();

  const [activeCategory, setActiveCategory] = useState<'all' | 'personal' | 'channels' | 'unread'>('all');
  const [showArchivedView, setShowArchivedView] = useState(false);

  // Popover menus state
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showComposeMenu, setShowComposeMenu] = useState(false);

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

  // Stories state
  const [stories, setStories] = useState<Story[]>([
    {
      id: 'story_default_1',
      userId: 'official',
      userName: 'BecuGram News',
      caption: 'Yangi BecuGram 2.0 yangilanishi va animatsiyali reaksiyalar! 🚀',
      bgColor: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);

  const hamburgerRef = useRef<HTMLDivElement | null>(null);
  const composeRef = useRef<HTMLDivElement | null>(null);

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
        setConversations(data);
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hamburgerRef.current && !hamburgerRef.current.contains(e.target as Node)) {
        setShowHamburgerMenu(false);
      }
      if (composeRef.current && !composeRef.current.contains(e.target as Node)) {
        setShowComposeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format timestamp
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

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter((c) => {
      // If viewing archived folder
      if (showArchivedView) {
        return archivedIds.includes(c._id);
      }
      // In main list, hide archived chats unless explicitly searching
      if (!searchQuery.trim() && archivedIds.includes(c._id)) {
        return false;
      }

      if (activeCategory === 'personal' && (c.type === 'channel' || c.type === 'group')) return false;
      if (activeCategory === 'channels' && c.type !== 'channel') return false;
      if (activeCategory === 'unread' && (!c.unreadCount || c.unreadCount <= 0)) return false;

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
      // Pinned chats appear first (including Saved Messages)
      const aPinned = pinnedIds.includes(a._id) || a._id.startsWith('conv_saved_');
      const bPinned = pinnedIds.includes(b._id) || b._id.startsWith('conv_saved_');
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const dateA = new Date(a.lastMessage?.createdAt || (a as any).updatedAt || (a as any).createdAt || 0).getTime();
      const dateB = new Date(b.lastMessage?.createdAt || (b as any).updatedAt || (b as any).createdAt || 0).getTime();
      return dateB - dateA;
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
      // Local addition already persisted
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

  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A';
  const cleanUsername = user?.username ? `@${user.username.replace('@', '')}` : '@Abdurahim';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0E1715] text-zinc-900 dark:text-zinc-100 select-none transition-colors duration-200 relative overflow-hidden">
      {/* TOP HEADER: ☰ Hamburger + Search Input + ⊕ Stories + ✏️ Compose (Matching Image 2, 3, 4, 5) */}
      <div className="p-3.5 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 relative">
          {/* 1. ☰ HAMBURGER BUTTON (Image 3) */}
          <div ref={hamburgerRef} className="relative">
            <button
              onClick={() => {
                setShowHamburgerMenu(!showHamburgerMenu);
                setShowComposeMenu(false);
              }}
              className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-[#15231F] text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-colors active:scale-95"
              title="Menyu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Hamburger Dropdown Popover (Image 3) */}
            {showHamburgerMenu && (
              <div className="absolute left-0 top-12 w-64 bg-white dark:bg-[#15231F] border border-zinc-200 dark:border-[#233830] rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-sm select-none">
                {/* Header: User name & Username */}
                <div
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenProfile?.();
                  }}
                  className="px-4 py-2.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-base text-zinc-900 dark:text-white block leading-tight truncate">
                    {user?.displayName || 'Abdurahim'}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-[#8DA39A] block mt-0.5 truncate">
                    {cleanUsername}
                  </span>
                </div>

                <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />

                {/* 💾 Saqlanganlar */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenSavedMessages?.();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-700 dark:text-zinc-200 font-medium transition-colors text-left"
                >
                  <Bookmark className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                  <span>Saqlanganlar</span>
                </button>

                {/* 👤 Kontaktlar */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenAddContact?.();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-700 dark:text-zinc-200 font-medium transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                  <span>Kontaktlar</span>
                </button>

                {/* 📦 Arxiv */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    setShowArchivedView(!showArchivedView);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-700 dark:text-zinc-200 font-medium transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <Archive className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                    <span>Arxiv</span>
                  </div>
                  {archivedIds.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {archivedIds.length}
                    </span>
                  )}
                </button>

                {/* ⚙️ Sozlamalar */}
                <button
                  onClick={() => {
                    setShowHamburgerMenu(false);
                    onOpenSettings?.();
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-700 dark:text-zinc-200 font-medium transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                  <span>Sozlamalar</span>
                </button>

                {/* 🌙 Tungi mavzu (Dark mode toggle switch) */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-700 dark:text-zinc-200 font-medium transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
                    ) : (
                      <Moon className="w-4 h-4 text-zinc-500 stroke-[2.2]" />
                    )}
                    <span>Tungi mavzu</span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      theme === 'dark' ? 'bg-[#2563EB]' : 'bg-zinc-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>

                {/* 🛡️ Admin Panel (Only for super admin) */}
                {(user?.role === 'admin' || user?.phoneNumber === '+998889008081') && (
                  <button
                    onClick={() => {
                      setShowHamburgerMenu(false);
                      onOpenAdmin?.();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 font-bold transition-colors text-left"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                    <span>Admin Panel</span>
                  </button>
                )}

                <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />

                {/* 🚪 Chiqish */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 font-medium transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 stroke-[2]" />
                  <span>Chiqish</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. SEARCH INPUT PILL */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4 stroke-[2.2]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidiruv"
              className="w-full bg-zinc-100 dark:bg-[#15231F] border border-transparent dark:border-[#20362E] rounded-full pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-[#1A2E26] focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* 3. ⊕ STORIES BUTTON: DIRECTLY OPEN CREATE STORY (Per user specification) */}
          <button
            onClick={() => setShowCreateStory(true)}
            className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-[#15231F] text-[#2563EB] flex items-center justify-center transition-colors active:scale-95 shrink-0"
            title="Hikoya joylash"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current fill-none stroke-[2.4]">
              <circle cx="12" cy="12" r="9" strokeDasharray="5 3" />
              <path d="M12 8v8M8 12h8" strokeLinecap="round" />
            </svg>
          </button>

          {/* 4. ✏️ COMPOSE / NEW CHAT BUTTON (Matching Image 5) */}
          <div ref={composeRef} className="relative">
            <button
              onClick={() => {
                setShowComposeMenu(!showComposeMenu);
                setShowHamburgerMenu(false);
              }}
              className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-[#15231F] text-zinc-700 dark:text-zinc-200 flex items-center justify-center transition-colors active:scale-95 shrink-0"
              title="Yangi suhbat"
            >
              <Edit className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Compose Dropdown Menu (Image 5) */}
            {showComposeMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-[#15231F] border border-zinc-200 dark:border-[#233830] rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-sm select-none">
                <button
                  onClick={() => {
                    setShowComposeMenu(false);
                    onOpenNewChatModal?.();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-800 dark:text-zinc-200 font-medium transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                  <span>Yangi chat</span>
                </button>
                <button
                  onClick={() => {
                    setShowComposeMenu(false);
                    onOpenCreateGroup?.();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-800 dark:text-zinc-200 font-medium transition-colors text-left"
                >
                  <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                  <span>Yangi guruh</span>
                </button>
                <button
                  onClick={() => {
                    setShowComposeMenu(false);
                    onOpenCreateGroup?.();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-800 dark:text-zinc-200 font-medium transition-colors text-left"
                >
                  <Megaphone className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                  <span>Yangi kanal</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STORIES AVATAR ROW (Matching Image 2: Dumaloq Hikoyalar) */}
        <div className="flex items-center gap-4 pt-3 pb-1 overflow-x-auto scrollbar-none">
          {/* User's Own Story Button (Dumaloq - Circular) */}
          <div
            onClick={() => setShowCreateStory(true)}
            className="flex flex-col items-center cursor-pointer group shrink-0"
          >
            <div className="relative">
              <div className="w-14 h-14 min-w-[56px] min-h-[56px] aspect-square rounded-full bg-gradient-to-tr from-[#00D2FF] via-[#2563EB] to-[#7C3AED] p-[2.5px] shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#14231E] p-0.5 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#2563EB] text-white font-black text-xl flex items-center justify-center select-none shadow-inner">
                    {initial}
                  </div>
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#0E1715] shadow-sm">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </div>
            <span className="text-[11px] font-semibold mt-1 text-zinc-700 dark:text-zinc-300">
              Hikoyam
            </span>
          </div>

          {/* Active Stories List */}
          {stories.map((st, idx) => (
            <div
              key={st.id || idx}
              onClick={() => setActiveStoryIndex(idx)}
              className="flex flex-col items-center cursor-pointer group shrink-0"
            >
              <div className="w-14 h-14 min-w-[56px] min-h-[56px] aspect-square rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#14231E] p-0.5">
                  <Avatar name={st.userName} src={st.userAvatar} size="md" />
                </div>
              </div>
              <span className="text-[11px] font-semibold mt-1 text-zinc-700 dark:text-zinc-300 truncate max-w-[65px]">
                {st.userName.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* CATEGORY SWITCHER PILLS: TEXT ONLY (Hamma | Shaxsiy | Kanal | O'qilmagan - Botlar removed, no icons) */}
        <div className="flex items-center gap-1.5 pt-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'Hamma' },
            { id: 'personal', label: 'Shaxsiy' },
            { id: 'channels', label: 'Kanal' },
            { id: 'unread', label: "O'qilmagan" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setShowArchivedView(false);
                setActiveCategory(tab.id as any);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === tab.id && !showArchivedView
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#15231F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ARCHIVE BANNER IF ACTIVE */}
      {showArchivedView && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-[#14231E] border-b border-zinc-200 dark:border-[#233830] text-xs font-semibold">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Archive className="w-4 h-4 text-blue-500" />
            <span>Arxivlangan chatlar ({archivedIds.length})</span>
          </div>
          <button
            onClick={() => setShowArchivedView(false)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Chiqish
          </button>
        </div>
      )}

      {/* CHAT LIST SCROLL AREA */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/40">
        {/* ARXIV ROW AT TOP (Matching Image 2: BecuGram style Arxiv) */}
        {!showArchivedView && !searchQuery.trim() && (
          <div
            onClick={() => setShowArchivedView(true)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#14231E]/60 transition-colors select-none border-b border-zinc-100/60 dark:border-zinc-800/40"
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-[#525C76] dark:bg-[#3D4860] text-white flex items-center justify-center shadow-xs">
                <Archive className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold text-sm text-zinc-900 dark:text-white">Arxiv</span>
                {archivedIds.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {archivedIds.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                BecuGram
              </p>
            </div>
          </div>
        )}

        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 dark:text-zinc-500">
            {searchQuery.trim() ? (
              <>
                <span className="text-3xl mb-2">🔍</span>
                <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">Bunday kontakt topilmadi</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Boshqa nom yoki foydalanuvchi nomini qidiring</p>
              </>
            ) : (
              <p className="text-xs">Suhbatlar topilmadi</p>
            )}
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
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-[#15231F]'
                    : 'hover:bg-zinc-50 dark:hover:bg-[#14231E]/60'
                }`}
              >
                {/* Avatar with optional bookmark badge */}
                <div className="relative shrink-0">
                  {isSaved ? (
                    <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-sm">
                      <Bookmark className="w-5 h-5 fill-current" />
                    </div>
                  ) : (
                    <Avatar
                      name={title}
                      src={conv.partner?.avatar || conv.group?.avatar}
                      size="md"
                      isOnline={conv.partner?.isOnline}
                    />
                  )}
                </div>

                {/* Info & Last message */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                        {title}
                      </span>
                      {/* Blue verified dot badge matching Image 2 */}
                      {(isSaved || conv.partner?.isVerified) && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isMuted && <VolumeX className="w-3 h-3 text-zinc-400" />}
                      {isPinned && <Pin className="w-3 h-3 text-zinc-400 rotate-45" />}
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {formatTime(lastMsg?.createdAt || (conv as any).updatedAt || (conv as any).createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <p className="truncate pr-2">
                      {lastMsg ? lastMsg.content : isSaved ? "O'zingiz uchun eslatmalar..." : 'Xabar yo\'q'}
                    </p>

                    {/* Unread badge */}
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CHAT ITEM CONTEXT MENU (Right-click on PC, long-press on mobile) */}
      {chatContextMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/20"
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
            className="fixed w-48 bg-white dark:bg-[#15231F] border border-zinc-200 dark:border-[#233830] rounded-2xl shadow-2xl py-1.5 z-50 text-xs font-semibold animate-fade-in select-none"
          >
            {/* Pin / Unpin */}
            <button
              onClick={() => togglePinChat(chatContextMenu.conv._id)}
              className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-700 dark:text-zinc-200 transition-colors text-left"
            >
              <Pin className="w-4 h-4 text-zinc-400 stroke-[2.2]" />
              <span>{pinnedIds.includes(chatContextMenu.conv._id) ? 'Qadoqdan chiqarish' : 'Qadash'}</span>
            </button>

            {/* Archive / Unarchive */}
            <button
              onClick={() => toggleArchiveChat(chatContextMenu.conv._id)}
              className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-700 dark:text-zinc-200 transition-colors text-left"
            >
              <Archive className="w-4 h-4 text-zinc-400 stroke-[2.2]" />
              <span>{archivedIds.includes(chatContextMenu.conv._id) ? 'Arxivdan chiqarish' : 'Arxivlash'}</span>
            </button>

            {/* Mute / Unmute */}
            <button
              onClick={() => toggleMuteChat(chatContextMenu.conv._id)}
              className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-700 dark:text-zinc-200 transition-colors text-left"
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
              className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors text-left"
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
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onDeleteStory={handleDeleteStory}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </div>
  );
};
