import React, { useState, useEffect } from 'react';
import { ChatList } from '../features/chats/ChatList';
import { PrivateChatView } from '../features/chats/PrivateChatView';
import { SettingsView } from '../features/settings/SettingsView';
import { ProfileView } from '../features/profile/ProfileView';
import { UserProfileModal } from '../features/profile/UserProfileModal';
import { EditProfileModal } from '../features/profile/EditProfileModal';
import { NewChatModal } from '../components/NewChatModal';
import { AddContactModal } from '../components/AddContactModal';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { PremiumModal } from '../components/PremiumModal';
import { BottomNav, NavTab } from '../components/BottomNav';
import { CallsView } from '../features/calls/CallsView';
import { CallModal } from '../components/CallModal';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useAppearanceStore } from '../stores/appearanceStore';
import { getWallpaperCssStyle, getPatternDataUri } from '../utils/wallpaperPatterns';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { Contact, Message, User } from '../types';

export type ActiveSidebarTab = 'chats' | 'calls' | 'settings' | 'profile';

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const {
    activeConversation,
    setActiveConversation,
    conversations,
    setConversations,
    setLastMessage,
    incrementUnreadCount,
    resetUnreadCount,
    viewingProfileUser,
    setViewingProfileUser,
  } = useChatStore();
  const { getWallpaperForChat } = useAppearanceStore();
  const currentWallpaper = getWallpaperForChat(undefined, theme);

  const [sidebarTab, setSidebarTab] = useState<ActiveSidebarTab>('chats');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callingUser, setCallingUser] = useState<User | null>(null);
  const [callingType, setCallingType] = useState<'audio' | 'video' | null>(null);
  const [announcement, setAnnouncement] = useState<{
    enabled: boolean;
    text: string;
  } | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Sync Global Settings & Announcement live
  useEffect(() => {
    api
      .getGlobalSettings()
      .then((s) => {
        if (s?.announcementBanner) {
          setAnnouncement(s.announcementBanner);
        }
      })
      .catch(() => {});

    const socket = socketService.getSocket();
    if (socket) {
      const handleSettingsUpdated = (settings: any) => {
        if (settings?.announcementBanner) {
          setAnnouncement(settings.announcementBanner);
          setDismissedBanner(false);
        }
      };
      socket.on('settings:updated', handleSettingsUpdated);
      return () => {
        socket.off('settings:updated', handleSettingsUpdated);
      };
    }
  }, []);

  // Global Real-time Message & Read Receipt Syncer
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (msg?.conversationId) {
        setLastMessage(msg.conversationId, msg);
        const senderId =
          typeof msg.senderId === 'object' && msg.senderId ? msg.senderId._id : msg.senderId;
        if (msg.conversationId !== activeConversation?._id && senderId !== user?._id) {
          incrementUnreadCount(msg.conversationId);
        }
      }
    };

    const handleReadReceipt = (payload: { conversationId: string; readerId: string }) => {
      if (payload.readerId === user?._id) {
        resetUnreadCount(payload.conversationId);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read_receipt', handleReadReceipt);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:read_receipt', handleReadReceipt);
    };
  }, [activeConversation?._id, user?._id, setLastMessage, incrementUnreadCount, resetUnreadCount]);

  // Direct chat starter
  const handleSelectUserToChat = async (targetUserId: string) => {
    try {
      const conv = await api.getOrCreateDirectChat(targetUserId);
      setActiveConversation(conv);
      setSidebarTab('chats');
      const chats = await api.getChats();
      setConversations(chats);
    } catch (err) {
      console.error('Failed to create/open direct chat:', err);
    }
  };

  const handleOpenGroupChat = async (conversationId: string) => {
    try {
      const conv = await api.getChatById(conversationId);
      setActiveConversation(conv);
      setSidebarTab('chats');
      const chats = await api.getChats();
      setConversations(chats);
    } catch (err) {
      console.error('Failed to open group chat:', err);
    }
  };

  const handleOpenSavedMessages = async () => {
    if (!user?._id) return;
    try {
      const chats = await api.getChats();
      const savedChat = chats.find((c) => c._id.startsWith('conv_saved_'));
      if (savedChat) {
        setActiveConversation(savedChat);
      } else {
        const conv = await api.getOrCreateDirectChat(user._id);
        setActiveConversation(conv);
      }
      setSidebarTab('chats');
    } catch (err) {
      console.error('Failed to open saved messages:', err);
    }
  };

  const handleOpenNewChat = async () => {
    try {
      const c = await api.getContacts();
      setContacts(c);
      setShowNewChatModal(true);
    } catch {
      setShowNewChatModal(true);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-[#212121] text-zinc-900 dark:text-white select-none transition-colors duration-150 font-sans">
      {/* Global Announcement Banner from Admin Panel */}
      {announcement?.enabled && announcement.text && !dismissedBanner && (
        <div className="bg-[#3390EC] dark:bg-[#8774E1] text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs z-50 animate-fade-in shrink-0">
          <div className="flex items-center gap-2 max-w-4xl mx-auto truncate">
            <span className="text-sm">📢</span>
            <span className="truncate">{announcement.text}</span>
          </div>
          <button
            onClick={() => setDismissedBanner(true)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors ml-2 text-white/80 hover:text-white cursor-pointer"
            title="Yopish"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area - Full-bleed Official Telegram Web A Split View */}
      <div className="flex-1 flex overflow-hidden w-full h-full relative">
        {/* Left Sidebar Pane (Docked full height with 1px Telegram divider) */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] h-full flex flex-col shrink-0 border-r border-[#DADCE0] dark:border-[#303030] bg-white dark:bg-[#212121] overflow-hidden z-20 ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {sidebarTab === 'chats' && (
            <ChatList
              onSelectChat={(conv) => setActiveConversation(conv)}
              onOpenNewChatModal={handleOpenNewChat}
              onOpenProfile={() => setSidebarTab('profile')}
              onOpenSettings={() => setSidebarTab('settings')}
              onOpenAddContact={() => setShowAddContactModal(true)}
              onOpenCreateGroup={() => setShowCreateGroupModal(true)}
              onOpenAdmin={() => setShowAdmin(true)}
              onOpenSavedMessages={handleOpenSavedMessages}
            />
          )}

          {sidebarTab === 'calls' && (
            <CallsView
              onBack={() => setSidebarTab('chats')}
              onStartCall={(targetUser, callType) => {
                setCallingUser(targetUser);
                setCallingType(callType);
              }}
            />
          )}

          {sidebarTab === 'settings' && (
            <SettingsView
              onBack={() => setSidebarTab('chats')}
              onOpenEditProfile={() => setShowEditProfile(true)}
              onOpenAdmin={() => setShowAdmin(true)}
              onOpenFolders={() => setSidebarTab('chats')}
            />
          )}

          {sidebarTab === 'profile' && (
            <ProfileView
              onBack={() => setSidebarTab('chats')}
              onOpenEditProfile={() => setShowEditProfile(true)}
            />
          )}
        </div>

        {/* Right Chat Area (Telegram Web A chat or wallpaper with centered pill) */}
        <div
          className={`flex-1 h-full flex flex-col overflow-hidden bg-[#F4F4F5] dark:bg-[#0F0F0F] relative ${
            !activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <PrivateChatView
              conversation={activeConversation}
              onBack={() => setActiveConversation(null)}
              onOpenProfile={(u) => setViewingProfileUser(u)}
            />
          ) : (
            // Desktop Empty State: Responsive Wallpaper + Centered Telegram Pill
            <div
              className="hidden md:flex flex-col items-center justify-center h-full select-none text-center p-8 relative overflow-hidden transition-all duration-300"
              style={getWallpaperCssStyle(currentWallpaper)}
            >
              {currentWallpaper.pattern && currentWallpaper.pattern !== 'none' && (
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundImage: `url("${getPatternDataUri(currentWallpaper.pattern)}")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: currentWallpaper.patternScale ? `${currentWallpaper.patternScale}px` : undefined,
                    opacity: currentWallpaper.patternOpacity ?? 0.08,
                    filter: `blur(${currentWallpaper.blur ?? 0}px) brightness(${currentWallpaper.brightness ?? 100}%)`,
                  }}
                />
              )}
              <div className="z-10 flex flex-col items-center">
                <span className="px-3.5 py-1.5 rounded-full bg-black/25 dark:bg-black/40 backdrop-blur-md text-white/95 text-[13px] font-medium shadow-sm select-none">
                  Suhbatni boshlash uchun chatni tanlang
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          contacts={contacts}
          onClose={() => setShowNewChatModal(false)}
          onSelectUser={handleSelectUserToChat}
          onOpenAddContact={() => setShowAddContactModal(true)}
          onOpenCreateGroup={() => setShowCreateGroupModal(true)}
          onOpenSavedMessages={handleOpenSavedMessages}
        />
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <AddContactModal
          onClose={() => setShowAddContactModal(false)}
          onSuccess={async () => {
            const chats = await api.getChats();
            setConversations(chats);
          }}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={async (convId) => {
            const chats = await api.getChats();
            setConversations(chats);
            if (convId) handleOpenGroupChat(convId);
          }}
        />
      )}

      {/* User Profile Modal */}
      {viewingProfileUser && (
        <UserProfileModal
          user={viewingProfileUser}
          conversationId={activeConversation?._id}
          onClose={() => setViewingProfileUser(null)}
          onStartChat={(uid) => {
            setViewingProfileUser(null);
            handleSelectUserToChat(uid);
          }}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}

      {/* Full Admin Dashboard Modal (Strictly for Super Admin) */}
      {showAdmin && (user?.role === 'admin' || user?.phoneNumber === '+998889008081') && (
        <AdminDashboard onClose={() => setShowAdmin(false)} />
      )}

      {/* BecuGram Premium & Appearance Modal */}
      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}

      {/* Global Call Modal when called from CallsView */}
      {callingUser && callingType && (
        <CallModal
          type={callingType}
          user={callingUser}
          onEndCall={() => {
            setCallingUser(null);
            setCallingType(null);
          }}
        />
      )}

      {/* Mobile Telegram Bottom Navigation Bar */}
      {!activeConversation && (
        <BottomNav
          activeTab={sidebarTab}
          onTabChange={(tab) => setSidebarTab(tab as ActiveSidebarTab)}
          unreadCount={totalUnreadCount}
        />
      )}
    </div>
  );
};
