import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/Avatar';
import { StoriesBar } from '../components/StoriesBar';
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
}

const CATEGORIES = [
  { id: 'all', label: 'Hamma' },
  { id: 'personal', label: 'Shaxsiy' },
  { id: 'groups', label: 'Guruhlar' },
  { id: 'channels', label: 'Kanallar' },
  { id: 'unread', label: "O'qilmagan" },
];

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
}) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredConversations = conversations.filter((c) => {
    if (activeCategory === 'personal') return c.type === 'direct';
    if (activeCategory === 'groups') return c.type === 'group';
    if (activeCategory === 'channels') return c.type === 'channel';
    if (activeCategory === 'unread') return (c.unreadCount || 0) > 0;
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.header }]}>
      <StatusBar style="light" />

      {/* 1. Telegram Top Header Bar */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onOpenMenu} style={styles.headerIconButton}>
            <Ionicons name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.brandTitle}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <Text style={styles.headerTitle}>BecuGram</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onOpenSearch} style={styles.headerIconButton}>
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Body with Theme Background */}
      <View style={[styles.body, { backgroundColor: theme.background }]}>
        {/* Stories Bar */}
        <StoriesBar
          currentUser={currentUser}
          stories={stories}
          theme={theme}
          onOpenMyStory={onOpenMyStory}
          onOpenStory={() => {}}
        />

        {/* Category Pills (Hamma, Shaxsiy, Guruhlar, Kanallar) */}
        <View style={[styles.categoriesContainer, { borderBottomColor: theme.divider }]}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => {
              const isActive = activeCategory === item.id;
              return (
                <TouchableOpacity
                  onPress={() => setActiveCategory(item.id)}
                  style={[
                    styles.categoryPill,
                    isActive && { backgroundColor: theme.primary },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: isActive ? '#FFFFFF' : theme.subtext },
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Chat List */}
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            /* Arxiv Row (Telegram Style) */
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.chatRow, { borderBottomColor: theme.divider }]}
            >
              <View style={[styles.archiveIconWrapper, { backgroundColor: '#525C76' }]}>
                <Ionicons name="archive" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={[styles.chatTitle, { color: theme.text }]}>Arxiv</Text>
                  <Text style={[styles.chatTime, { color: theme.subtext }]}>BecuGram</Text>
                </View>
                <Text style={[styles.lastMessageText, { color: theme.subtext }]} numberOfLines={1}>
                  Arxivlangan yozishmalar to‘plami
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
            const isVerified = isDirect ? item.partner?.isVerified : false;
            const time = item.updatedAt
              ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <TouchableOpacity
                onPress={() => onSelectChat(item)}
                activeOpacity={0.7}
                style={[styles.chatRow, { borderBottomColor: theme.divider }]}
              >
                <Avatar
                  name={title}
                  src={avatar}
                  size={52}
                  isOnline={isOnline}
                  isVerified={isVerified}
                />

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
                          color="#2AABEE"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    <Text style={[styles.chatTime, { color: theme.subtext }]}>{time}</Text>
                  </View>

                  <View style={styles.lastMessageRow}>
                    <Text
                      style={[styles.lastMessageText, { color: theme.subtext }]}
                      numberOfLines={1}
                    >
                      {item.lastMessage?.content || 'Yangi suhbat'}
                    </Text>

                    {item.unreadCount !== undefined && item.unreadCount > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Telegram Floating Action Button (FAB) */}
        <TouchableOpacity
          onPress={onOpenNewChat}
          style={[styles.fab, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="pencil" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 6,
  },
  brandTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0E1621',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  archiveIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    marginBottom: 3,
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
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
