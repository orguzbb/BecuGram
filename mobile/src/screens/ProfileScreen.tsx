import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { ThemeColors } from '../theme/colors';
import { mobileApi, getMediaUrl } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileScreenProps {
  user: User | null;
  theme: ThemeColors;
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onLogout: () => void;
  onUpdateUser?: (updated: User) => void;
}

const MEDIA_PHOTOS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&q=80',
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  theme,
  isDark,
  onToggleTheme,
  onBack,
  onLogout,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'files' | 'links'>('photos');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
  const [editUsername, setEditUsername] = useState(user?.username?.replace(/^@/, '') || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initial = (user?.displayName?.trim()?.charAt(0) || user?.username?.trim()?.charAt(0) || 'U').toUpperCase();
  const cleanUsername = user?.username ? `@${user.username.replace(/^@/, '')}` : '@foydalanuvchi';

  // Handle Edit Profile Open
  const handleOpenEdit = () => {
    setEditDisplayName(user?.displayName || '');
    setEditUsername(user?.username?.replace(/^@/, '') || '');
    setEditBio(user?.bio || '');
    setEditAvatar(user?.avatar || '');
    setSaveSuccessMsg('');
    setIsEditModalVisible(true);
  };

  // Handle File Upload from Device / Web
  const handleTriggerUpload = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        try {
          setIsUploading(true);
          const res = await mobileApi.uploadMedia(file);
          if (res?.url) {
            setEditAvatar(res.url);
            // Also directly update if modal not open
            if (!isEditModalVisible) {
              const updated = await mobileApi.updateMe({ avatar: res.url });
              await AsyncStorage.setItem('@becugram_user', JSON.stringify(updated));
              onUpdateUser?.(updated);
            }
          }
        } catch (err: any) {
          Alert.alert('Xatolik', err.message || 'Rasm yuklashda xatolik yuz berdi');
        } finally {
          setIsUploading(false);
        }
      };
      input.click();
    }
  };

  // Save updated profile
  const handleSaveProfile = async () => {
    if (!editDisplayName.trim()) {
      Alert.alert('Xatolik', 'Ism kiritilishi shart');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await mobileApi.updateMe({
        displayName: editDisplayName.trim(),
        username: editUsername.trim().toLowerCase().replace(/^@/, ''),
        bio: editBio.trim(),
        avatar: editAvatar,
      });

      await AsyncStorage.setItem('@becugram_user', JSON.stringify(updated));
      onUpdateUser?.(updated);
      setSaveSuccessMsg('Profil muvaffaqiyatli yangilandi!');
      setTimeout(() => {
        setIsEditModalVisible(false);
        setSaveSuccessMsg('');
      }, 900);
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Profilni saqlashda xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = user?.avatar ? getMediaUrl(user.avatar) : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.card }]}>
      <StatusBar style="light" />

      {/* TOP HEADER: ← Profile ✕ (Matching Image 6) */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profil va Sozlamalar</Text>
        <TouchableOpacity onPress={handleOpenEdit} style={styles.headerIconButton} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={22} color="#0D9488" />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.body, { backgroundColor: theme.background }]}>
        {/* AVATAR & USER INFO (Matching Image 6) */}
        <View style={styles.profileHero}>
          <View style={styles.avatarBorderBox}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: '#D97706' }]}>
                <Text style={styles.avatarLetter}>{initial}</Text>
              </View>
            )}

            {/* Camera badge to change photo */}
            <TouchableOpacity
              onPress={handleTriggerUpload}
              style={[styles.cameraBadge, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.displayName, { color: theme.text }]}>
            {user?.displayName || 'Foydalanuvchi'}
          </Text>
          <Text style={styles.usernameText}>{cleanUsername}</Text>
          <Text style={[styles.phoneText, { color: theme.subtext }]}>
            {user?.phoneNumber || '+998...'}
          </Text>

          {/* 4 ROUND ACTION BUTTONS (Matching Image 6) */}
          <View style={styles.actionButtonsRow}>
            {/* 1. Message */}
            <TouchableOpacity
              onPress={onBack}
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#0D9488" />
              <Text style={[styles.actionCardLabel, { color: theme.subtext }]}>Xabar</Text>
            </TouchableOpacity>

            {/* 2. Call */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={22} color="#0D9488" />
              <Text style={[styles.actionCardLabel, { color: theme.subtext }]}>Qo'ng'iroq</Text>
            </TouchableOpacity>

            {/* 3. Edit */}
            <TouchableOpacity
              onPress={handleOpenEdit}
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={22} color="#0D9488" />
              <Text style={[styles.actionCardLabel, { color: theme.subtext }]}>Tahrirlash</Text>
            </TouchableOpacity>

            {/* 4. Bell */}
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.subtext} />
              <Text style={[styles.actionCardLabel, { color: theme.subtext }]}>Ovoz</Text>
            </TouchableOpacity>
          </View>

          {/* BIO CARD (Matching Image 6) */}
          <TouchableOpacity
            onPress={handleOpenEdit}
            style={[styles.bioCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.8}
          >
            <View style={styles.bioHeaderRow}>
              <Ionicons name="information-circle-outline" size={16} color="#0D9488" style={{ marginRight: 6 }} />
              <Text style={[styles.bioTitle, { color: theme.subtext }]}>Haqida (Bio)</Text>
            </View>
            <Text style={[styles.bioText, { color: theme.text }]}>
              {user?.bio ? user.bio : 'BecuGram a\'zosi 🚀 (Bio kiritish uchun bosing)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MEDIA TABS: Photos | Videos | Files | Links (Matching Image 6) */}
        <View style={[styles.tabsRow, { borderBottomColor: theme.divider }]}>
          {(['photos', 'videos', 'files', 'links'] as const).map((tab) => {
            const labels = {
              photos: 'Photos',
              videos: 'Videos',
              files: 'Files',
              links: 'Links',
            };
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isActive && styles.activeTabButton]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    { color: isActive ? '#0D9488' : theme.subtext },
                    isActive && styles.activeTabButtonText,
                  ]}
                >
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* MEDIA GRID (3x2 Photos matching Image 5 & 6) */}
        {activeTab === 'photos' && (
          <View style={styles.mediaGrid}>
            {MEDIA_PHOTOS.map((uri, idx) => (
              <View key={idx} style={styles.mediaItem}>
                <Image source={{ uri }} style={styles.mediaImage} />
              </View>
            ))}
          </View>
        )}

        {/* SETTINGS: Dark Mode Switch & Logout */}
        <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.settingsRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.settingsLeft}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={22}
                color={isDark ? '#F59E0B' : '#6B7280'}
              />
              <Text style={[styles.settingsLabel, { color: theme.text }]}>Tungi mavzu</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={onToggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity onPress={handleOpenEdit} style={[styles.settingsRow, { borderBottomColor: theme.divider }]}>
            <View style={styles.settingsLeft}>
              <Ionicons name="person-outline" size={22} color="#0D9488" />
              <Text style={[styles.settingsLabel, { color: theme.text }]}>Profilni tahrirlash</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onLogout} style={styles.logoutRow} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutLabel}>Hisobdan chiqish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.editModalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Profilni tahrirlash</Text>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSaving}
                style={[styles.savePillButton, { backgroundColor: '#2563EB' }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.savePillButtonText}>Saqlash</Text>
                )}
              </TouchableOpacity>
            </View>

            {saveSuccessMsg ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.successBannerText}>{saveSuccessMsg}</Text>
              </View>
            ) : null}

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Avatar Selector Section */}
              <View style={styles.avatarEditSection}>
                <View style={styles.avatarEditPreview}>
                  {editAvatar ? (
                    <Image source={{ uri: getMediaUrl(editAvatar) }} style={styles.avatarEditImage} />
                  ) : (
                    <View style={[styles.avatarCircle, { backgroundColor: '#D97706', width: 80, height: 80, borderRadius: 40 }]}>
                      <Text style={[styles.avatarLetter, { fontSize: 32 }]}>{initial}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={handleTriggerUpload}
                    style={[styles.cameraBadgeLarge, { backgroundColor: '#2563EB' }]}
                  >
                    <Ionicons name="camera" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleTriggerUpload} style={styles.uploadTextBtn}>
                  <Text style={styles.uploadTextBtnLabel}>Yangi rasm yuklash 📷</Text>
                </TouchableOpacity>

                {/* Preset Avatars Row */}
                <Text style={[styles.fieldLabel, { color: theme.subtext, marginTop: 12, marginBottom: 8 }]}>
                  Yoki tayyor avatarlardan tanlang:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                  {AVATAR_PRESETS.map((presetUrl, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setEditAvatar(presetUrl)}
                      style={[
                        styles.presetAvatarItem,
                        editAvatar === presetUrl && { borderColor: '#2563EB', borderWidth: 2.5 },
                      ]}
                    >
                      <Image source={{ uri: presetUrl }} style={styles.presetAvatarImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Display Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.subtext }]}>Ismingiz (Display Name)</Text>
                <TextInput
                  value={editDisplayName}
                  onChangeText={setEditDisplayName}
                  placeholder="Ismingiz"
                  placeholderTextColor={theme.subtext}
                  style={[styles.textInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder }]}
                />
              </View>

              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.subtext }]}>Foydalanuvchi nomi (Username)</Text>
                <View style={[styles.usernameInputRow, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <Text style={styles.usernamePrefix}>@</Text>
                  <TextInput
                    value={editUsername}
                    onChangeText={(val) => setEditUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    placeholderTextColor={theme.subtext}
                    style={[styles.usernameInnerInput, { color: theme.text }]}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Bio Input */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={[styles.inputLabel, { color: theme.subtext }]}>Haqida (Bio)</Text>
                  <Text style={[styles.charCount, { color: theme.subtext }]}>{editBio.length}/120</Text>
                </View>
                <TextInput
                  value={editBio}
                  onChangeText={(val) => val.length <= 120 && setEditBio(val)}
                  placeholder="O'zingiz haqingizda bir oz ma'lumot yozing..."
                  placeholderTextColor={theme.subtext}
                  multiline
                  numberOfLines={3}
                  style={[styles.bioTextInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder }]}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isSaving}
                style={[styles.bottomSaveButton, { backgroundColor: '#2563EB' }]}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.bottomSaveButtonText}>O'zgarishlarni saqlash</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
  },
  profileHero: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarBorderBox: {
    width: 90,
    height: 90,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 148, 136, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    borderRadius: 16,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#070D0B',
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  usernameText: {
    color: '#0D9488',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 13,
    marginTop: 3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 16,
    width: '100%',
  },
  actionCard: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionCardLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  bioCard: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  bioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bioTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#0D9488',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabButtonText: {
    fontWeight: 'bold',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    gap: 4,
  },
  mediaItem: {
    width: '32.5%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  settingsCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  editModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  savePillButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  savePillButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  successBannerText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
  modalContent: {
    padding: 16,
  },
  avatarEditSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarEditPreview: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarEditImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraBadgeLarge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#070D0B',
  },
  uploadTextBtn: {
    paddingVertical: 6,
  },
  uploadTextBtnLabel: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  presetAvatarItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetAvatarImage: {
    width: '100%',
    height: '100%',
  },
  fieldLabel: {
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  usernameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  usernamePrefix: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0D9488',
    marginRight: 2,
  },
  usernameInnerInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  charCount: {
    fontSize: 11,
  },
  bioTextInput: {
    minHeight: 74,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  bottomSaveButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  bottomSaveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
