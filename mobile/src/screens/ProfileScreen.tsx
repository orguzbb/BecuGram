import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Avatar } from '../components/Avatar';
import { User } from '../types';
import { ThemeColors } from '../theme/colors';

interface ProfileScreenProps {
  user: User | null;
  theme: ThemeColors;
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  theme,
  isDark,
  onToggleTheme,
  onBack,
  onLogout,
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.header }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil va Sozlamalar</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={[styles.body, { backgroundColor: theme.background }]}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.card, borderBottomColor: theme.divider }]}>
          <Avatar
            name={user?.displayName || 'User'}
            src={user?.avatar}
            size={80}
            isVerified={user?.isVerified}
          />
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.displayName || 'Foydalanuvchi'}
            </Text>
            {user?.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#2AABEE"
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
          <Text style={[styles.userPhone, { color: theme.subtext }]}>
            {user?.phoneNumber || '+998...'}
          </Text>
          <Text style={[styles.userHandle, { color: theme.primary }]}>
            @{user?.username || 'user'}
          </Text>
        </View>

        {/* Settings Sections */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Dark Mode Switch */}
          <View style={[styles.itemRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.itemLeft}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={22}
                color={isDark ? '#F59E0B' : '#6B7280'}
              />
              <Text style={[styles.itemLabel, { color: theme.text }]}>Tungi mavzu</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={onToggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#2AABEE' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Notifications */}
          <TouchableOpacity style={[styles.itemRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.itemLeft}>
              <Ionicons name="notifications-outline" size={22} color={theme.actionIcon} />
              <Text style={[styles.itemLabel, { color: theme.text }]}>Bildirishnomalar</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={theme.actionIcon} />
              <Text style={[styles.itemLabel, { color: theme.text }]}>Maxfiylik va Xavfsizlik</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
          <TouchableOpacity onPress={onLogout} style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={[styles.itemLabel, { color: '#EF4444' }]}>Chiqish</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backButton: {
    padding: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  userHandle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});
