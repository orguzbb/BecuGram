import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { ThemeColors } from '../theme/colors';
import { getMediaUrl } from '../services/api';

export type NavTab = 'inbox' | 'settings' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadCount?: number;
  currentUser: User | null;
  theme: ThemeColors;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
  currentUser,
  theme,
}) => {
  const initial = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : 'A';

  const isDark = theme.background.includes('#07') || theme.background.includes('#0E');

  return (
    <View pointerEvents="box-none" style={styles.dockWrapper}>
      <View
        style={[
          styles.dockPill,
          {
            backgroundColor: isDark ? 'rgba(20, 35, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? '#233830' : 'rgba(226, 232, 240, 0.9)',
          },
        ]}
      >
        {/* 1. CHATLAR (CIRCULAR BUTTON WITH BADGE) */}
        <TouchableOpacity
          onPress={() => onTabChange('inbox')}
          activeOpacity={0.8}
          style={[
            styles.roundButton,
            activeTab === 'inbox'
              ? [styles.activeButton, { backgroundColor: '#2563EB' }]
              : { backgroundColor: 'transparent' },
          ]}
        >
          <Ionicons
            name="chatbubble"
            size={20}
            color={activeTab === 'inbox' ? '#FFFFFF' : theme.subtext}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 2. SOZLAMALAR (CIRCULAR BUTTON) */}
        <TouchableOpacity
          onPress={() => onTabChange('settings')}
          activeOpacity={0.8}
          style={[
            styles.roundButton,
            activeTab === 'settings'
              ? [styles.activeButton, { backgroundColor: '#2563EB' }]
              : { backgroundColor: 'transparent' },
          ]}
        >
          <Ionicons
            name="settings-sharp"
            size={20}
            color={activeTab === 'settings' ? '#FFFFFF' : theme.subtext}
          />
        </TouchableOpacity>

        {/* 3. PROFIL (CIRCULAR BUTTON WITH AVATAR / INITIAL) */}
        <TouchableOpacity
          onPress={() => onTabChange('profile')}
          activeOpacity={0.8}
          style={[
            styles.roundButton,
            activeTab === 'profile'
              ? [styles.activeButton, { backgroundColor: '#2563EB' }]
              : { backgroundColor: 'transparent' },
          ]}
        >
          {currentUser?.avatar ? (
            <Image
              source={{ uri: getMediaUrl(currentUser.avatar) }}
              style={{ width: 26, height: 26, borderRadius: 13 }}
            />
          ) : (
            <View style={styles.avatarMini}>
              <Text style={[styles.avatarInitial, { color: activeTab === 'profile' ? '#FFFFFF' : '#10B981' }]}>
                {initial}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  dockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  roundButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeButton: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '900',
  },
});

