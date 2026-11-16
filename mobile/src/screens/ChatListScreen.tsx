import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from '../components/Avatar';
import { StoriesBar } from '../components/StoriesBar';
import { BottomNav, NavTab } from '../components/BottomNav';
import { StoryViewerModal } from '../components/StoryViewerModal';
import { CreateFolderModal, MobileChatFolder } from '../components/CreateFolderModal';
import { Conversation, Story, User } from '../types';
import { ThemeColors } from '../theme/colors';

interface ChatListScreenProps {
  currentUser: User | null;
  conversations: Conversation[];
  stories: Story[];
  theme: ThemeColors;
  onSelectChat: (conv: Conversation) => void;
  onOpenNewChat: () => void;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onOpenMyStory: () => void;
  activeNavTab?: NavTab;
  onNavTabChange?: (tab: NavTab) => void;
}

const DEFAULT_FOLDERS: MobileChatFolder[] = [
  { id: 'all', name: 'Hamma', filter: 'all' },
  { id: 'personal', name: 'Shaxsiy', filter: 'personal' },
  { id: 'channels', name: 'Kanal', filter: 'channels' },
  { id: 'groups', name: 'Guruhlar', filter: 'groups' },
  { id: 'unread', name: "O'qilmagan", filter: 'unread' },
];

const formatChatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
};

export const ChatListScreen: React.FC<ChatListScreenProps> = ({
  currentUser,
  conversations,
  stories,
  theme,
  onSelectChat,
  onOpenNewChat,
  onOpenMenu,
  onOpenSearch,
  onOpenMyStory,
  activeNavTab = 'inbox',
  onNavTabChange,
}) => {
  const [folders, setFolders] = useState<MobileChatFolder[]>(DEFAULT_FOLDERS);
  const [activeFolderId, setActiveFolderId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<MobileChatFolder | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  // Load custom folders from storage
  useEffect(() => {
    AsyncStorage.getItem('@becugram_custom_folders')
      .then((saved) => {
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFolders(parsed);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveFolder = (folder: MobileChatFolder) => {
    setFolders((prev) => {
      const idx = prev.findIndex((f) => f.id === folder.id);
      let updated: MobileChatFolder[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = folder;
      } else {
        updated = [...prev, folder];
      }
      AsyncStorage.setItem('@becugram_custom_folders', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setActiveFolderId(folder.id);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== folderId);
      AsyncStorage.setItem('@becugram_custom_folders', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (activeFolderId === folderId) {
      setActiveFolderId('all');
    }
  };

  // Synthesize contacts' stories so real contact photos appear in circular frames (Matching Image 1)
  const contactStories: Story[] = conversations
    .filter((c) => c.type === 'direct' && c.partner && c.partner._id !== currentUser?._id)
    .map((c) => ({
      id: `story_partner_${c.partner!._id}`,
      userId: c.partner!._id,
      userName: c.partner!.displayName,
      userAvatar: c.partner!.avatar,
      caption: `${c.partner!.displayName} bilan BecuGram suhbati 🌸`,
      createdAt: c.lastMessage?.createdAt || (c as any).updatedAt || new Date().toISOString(),
    }));

  const fallbackContactStory: Story[] = [
    {
      id: 'story_foydalanuvchi',
      userId: 'user_foydalanuvchi',
      userName: 'Foydalanuvchi',
      userAvatar: '',
      caption: 'BecuGram yangi imkoniyatlari 🌸',
      createdAt: new Date().toISOString(),
    },
  ];

  const allStories: Story[] = [
    ...stories,
    ...(contactStories.length > 0 ? contactStories : fallbackContactStory),
  ];

  // Default demo chats matching Image 1 if server hasn't seeded direct chats yet
  const displayConversations: Conversation[] = conversations.length > 0 ? conversations : [
    {
      _id: 'conv_admin_default',
      type: 'direct',
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
        content: 'alik',
        createdAt: '2026-11-09T18:44:00.000Z',
      },
      unreadCount: 1,
      updatedAt: '2026-11-09T18:44:00.000Z',
    },
  ];

  const currentFolder = folders.find((f) => f.id === activeFolderId) || folders[0];

  const filteredConversations = displayConversations.filter((c) => {
    if (searchQuery.trim()) {
      const title = (c.type === 'direct' ? c.partner?.displayName : c.group?.name) || '';
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    }

    if (!currentFolder || currentFolder.filter === 'all') return true;
    if (currentFolder.filter === 'personal') return c.type === 'direct';
    if (currentFolder.filter === 'groups') return c.type === 'group';
    if (currentFolder.filter === 'channels') return c.type === 'channel';
    if (currentFolder.filter === 'unread') return (c.unreadCount || 0) > 0;

    if (currentFolder.filter === 'custom') {
      const typeMatch = currentFolder.includeTypes && currentFolder.includeTypes.includes(c.type as any);
      const idMatch = currentFolder.chatIds && currentFolder.chatIds.includes(c._id);
      return Boolean(typeMatch || idMatch);
    }

    return true;
  });

  const totalUnread = displayConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.header }]}>
      <StatusBar style="light" />

      {/* 1. TOP HEADER: ☰ Hamburger + Search Input Pill + ⊕ Stories + ✏️ Compose */}
      <View style={[styles.header, { backgroundColor: theme.header, borderBottomColor: theme.divider }]}>
        {/* Hamburger Menu button */}
        <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Search Pill Bar with "Qidiruv" placeholder */}
        <View style={[styles.searchPill, { backgroundColor: theme.searchBar }]}>
          <Ionicons name="search" size={17} color={theme.subtext} style={{ marginRight: 6 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Qidiruv"
            placeholderTextColor={theme.subtext}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        {/* Stories crosshair-plus button */}
        <TouchableOpacity onPress={onOpenMyStory} style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Compose button */}
        <TouchableOpacity onPress={onOpenNewChat} style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. MAIN BODY */}
      <View style={[styles.body, { backgroundColor: theme.background }]}>
        {/* STORIES AVATAR ROW */}
        <StoriesBar
          currentUser={currentUser}
          stories={allStories}
          theme={theme}
          onOpenMyStory={onOpenMyStory}
          onOpenStory={(st, idx) => setActiveStoryIndex(idx)}
        />

        {/* CATEGORY SWITCHER PILLS & CUSTOM FOLDERS WITH (+) */}
        <View style={[styles.categoriesContainer, { borderBottomColor: theme.divider }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {folders.map((item) => {
              const isActive = activeFolderId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveFolderId(item.id)}
                  onLongPress={() => {
                    if (item.filter === 'custom') {
                      setEditingFolder(item);
                      setShowFolderModal(true);
                    }
                  }}
                  style={[
                    styles.categoryPill,
                    isActive && { backgroundColor: '#2563EB' },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.iconName ? (
                      <Ionicons
                        name={item.iconName as any}
                        size={13}
                        color={isActive ? '#FFFFFF' : theme.subtext}
                        style={{ marginRight: 5 }}
                      />
                    ) : item.emoji && item.emoji !== '📁' ? (
                      <Text style={{ marginRight: 4 }}>{item.emoji}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.categoryText,
                        { color: isActive ? '#FFFFFF' : theme.subtext },
                        isActive && styles.categoryTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* + Yangi jild qo'shish tugmasi */}
            <TouchableOpacity
              onPress={() => {
                setEditingFolder(null);
                setShowFolderModal(true);
              }}
              style={[styles.categoryPill, styles.addFolderBtn, { borderColor: theme.divider }]}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={theme.subtext} />
              <Text style={[styles.categoryText, { color: theme.subtext, marginLeft: 2 }]}>
                Jild
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* CHAT LIST */}
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 90 }}
          ListHeaderComponent={
            /* ARXIV ROW (Matching Image 2) */
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.chatRow, { borderBottomColor: theme.divider }]}
            >
              <View style={[styles.archiveIconWrapper, { backgroundColor: '#334155' }]}>
                <Ionicons name="archive-outline" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={[styles.chatTitle, { color: theme.text }]}>Arxiv</Text>
                  <Text style={[styles.archiveBadge, { backgroundColor: theme.divider, color: theme.subtext }]}>
                    1
                  </Text>
                </View>
                <Text style={[styles.lastMessageText, { color: theme.subtext }]} numberOfLines={1}>
                  BecuGram
                </Text>
              </View>
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const isDirect = item.type === 'direct';
            const title = isDirect
              ? item.partner?.displayName || 'Foydalanuvchi'
              : item.group?.name || 'Guruh';
            const avatar = isDirect ? item.partner?.avatar : item.group?.avatar;
            const isOnline = isDirect ? item.partner?.isOnline : false;
            const isVerified = true;
            const isOfficial = title.includes('BecuGram');

            return (
              <TouchableOpacity
                onPress={() => onSelectChat(item)}
                activeOpacity={0.7}
                style={[styles.chatRow, { borderBottomColor: theme.divider }]}
              >
                {isOfficial ? (
                  <View style={[styles.avatarWrapper, { backgroundColor: '#0D9488' }]}>
                    <Ionicons name="megaphone" size={24} color="#FFFFFF" />
                  </View>
                ) : (
                  <Avatar
                    name={title}
                    src={avatar}
                    size={52}
                    isOnline={isOnline}
                    isVerified={isVerified}
                  />
                )}

                <View style={styles.chatInfo}>
                  <View style={styles.chatHeaderRow}>
                    <View style={styles.nameVerifiedRow}>
                      <Text style={[styles.chatTitle, { color: theme.text }]} numberOfLines={1}>
                        {title}
                      </Text>
                      {isVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={15}
                          color="#2563EB"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    <Text style={[styles.chatTime, { color: theme.subtext }]}>
                      {formatChatTime(item.lastMessageAt || item.lastMessage?.createdAt || item.updatedAt)}
                    </Text>
                  </View>

                  <View style={styles.lastMessageRow}>
                    <Text
                      style={[styles.lastMessageText, { color: theme.subtext }]}
                      numberOfLines={1}
                    >
                      {item.lastMessage?.type === 'voice'
                        ? '🎤 Ovozli xabar'
                        : item.lastMessage?.type === 'image'
                        ? '📷 Rasm'
                        : item.lastMessage?.content || 'Yangi suhbat'}
                    </Text>

                    {item.unreadCount !== undefined && item.unreadCount > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: '#2563EB' }]}>
                        <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Telegram Android Floating Action Button (Pencil FAB) */}
        <TouchableOpacity
          onPress={onOpenNewChat}
          style={[styles.fab, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="pencil" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 3. FLOATING BOTTOM NAV DOCK (Matching Image 2) */}
        <BottomNav
          activeTab={activeNavTab}
          onTabChange={(tab) => onNavTabChange?.(tab)}
          unreadCount={totalUnread}
          currentUser={currentUser}
          theme={theme}
        />

        {/* 4. STORY VIEWER MODAL */}
        <StoryViewerModal
          visible={activeStoryIndex !== null}
          stories={allStories}
          initialIndex={activeStoryIndex || 0}
          currentUser={currentUser}
          theme={theme}
          onClose={() => setActiveStoryIndex(null)}
          onReplyToStory={(story, text) => {
            if (story.userId && story.userId !== 'official') {
              const targetConv = displayConversations.find(
                (c) => c.type === 'direct' && c.partner?._id === story.userId
              );
              if (targetConv) {
                onSelectChat(targetConv);
              }
            }
          }}
        />

        {/* 5. CREATE / EDIT FOLDER MODAL */}
        <CreateFolderModal
          visible={showFolderModal}
          editingFolder={editingFolder}
          conversations={displayConversations}
          theme={theme}
          onClose={() => {
            setShowFolderModal(false);
            setEditingFolder(null);
          }}
          onSave={handleSaveFolder}
          onDelete={handleDeleteFolder}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  categoriesContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  categoriesList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    fontWeight: 'bold',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  archiveBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chatTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 20,
  },
});
