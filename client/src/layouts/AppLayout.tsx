import React, { useState } from 'react';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { BottomNav, NavTab } from '../components/BottomNav';
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
import { BecuLogo } from '../components/BecuLogo';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { api } from '../services/api';
import { Conversation, User, Contact } from '../types';

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const {
    activeConversation,
    setActiveConversation,
    conversations,
    setConversations,
    viewingProfileUser,
    setViewingProfileUser,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<NavTab>('inbox');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Direct chat starter
  const handleSelectUserToChat = async (targetUserId: string) => {
    try {
      const conv = await api.getOrCreateDirectChat(targetUserId);
      setActiveConversation(conv);
      setActiveTab('inbox');
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
      setActiveTab('inbox');
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
      setActiveTab('inbox');
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
    <div
      className="flex h-screen w-screen overflow-hidden bg-[#ECE8F7] dark:bg-[#070D0B] text-zinc-900 dark:text-white transition-colors duration-200"
      style={{
        backgroundImage:
          theme === 'dark'
            ? 'radial-gradient(circle at 50% 50%, rgba(14,23,21,0.95) 0%, rgba(7,13,11,1) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7) 0%, rgba(234,228,248,0.95) 100%)',
      }}
    >
      {/* Main Content Area (Tablet/Desktop Floating Cards layout matching Image 2 & 5) */}
      <div className="flex-1 flex overflow-hidden sm:p-3 sm:gap-3">
        {/* Left List Pane (Floating rounded card on tablets & desktop, full on mobile) */}
        <div
          className={`w-full sm:w-[380px] lg:w-[420px] h-full flex flex-col shrink-0 sm:rounded-3xl sm:border sm:border-white/80 dark:sm:border-white/10 sm:shadow-2xl overflow-hidden bg-white dark:bg-[#0E1715] z-10 ${
            activeConversation ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeTab === 'inbox' && (
            <ChatList
              onSelectChat={(conv) => setActiveConversation(conv)}
              onOpenNewChatModal={handleOpenNewChat}
              onOpenProfile={() => setActiveTab('profile')}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenAddContact={() => setShowAddContactModal(true)}
              onOpenCreateGroup={() => setShowCreateGroupModal(true)}
              onOpenAdmin={() => setShowAdmin(true)}
              onOpenSavedMessages={handleOpenSavedMessages}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onOpenEditProfile={() => setShowEditProfile(true)}
              onOpenAdmin={() => setShowAdmin(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              onOpenEditProfile={() => setShowEditProfile(true)}
            />
          )}
        </div>

        {/* Right Chat Area (Floating rounded card on tablets & desktop) */}
        <div
          className={`flex-1 h-full flex flex-col sm:rounded-3xl sm:border sm:border-white/80 dark:sm:border-white/10 sm:shadow-2xl overflow-hidden ${
            !activeConversation ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <PrivateChatView
              conversation={activeConversation}
              onBack={() => setActiveConversation(null)}
              onOpenProfile={(u) => setViewingProfileUser(u)}
            />
          ) : (
            // Tablet & Desktop Empty State with official BecuGram logo
            <div className="hidden sm:flex flex-col items-center justify-center h-full select-none text-center p-8 transition-colors">
              {/* BecuGram Official Logo */}
              <div className="mb-4 hover:scale-110 transition-transform cursor-pointer">
                <BecuLogo size={72} />
              </div>

              {/* Subtitle: "Chapdan chatni tanlang yoki yangisini boshlang" */}
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Chapdan chatni tanlang yoki yangisini boshlang
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar: SIMPLE CIRCULAR BUTTONS (Image 2 Paxta style) */}
      {!activeConversation && (
        <div className="sm:hidden">
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            unreadCount={totalUnread}
          />
        </div>
      )}

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
    </div>
  );
};
