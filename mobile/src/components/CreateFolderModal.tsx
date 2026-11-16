import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Conversation, User } from '../types';
import { ThemeColors } from '../theme/colors';

export interface MobileChatFolder {
  id: string;
  name: string;
  emoji?: string;
  iconName?: string;
  filter: 'all' | 'personal' | 'groups' | 'channels' | 'unread' | 'custom';
  chatIds?: string[];
  includeTypes?: ('direct' | 'group' | 'channel')[];
}

interface CreateFolderModalProps {
  visible: boolean;
  editingFolder?: MobileChatFolder | null;
  conversations: Conversation[];
  theme: ThemeColors;
  onClose: () => void;
  onSave: (folder: MobileChatFolder) => void;
  onDelete?: (folderId: string) => void;
}

export const FOLDER_ICON_OPTIONS = [
  { name: 'briefcase-outline', label: 'Ish' },
  { name: 'home-outline', label: 'Uy' },
  { name: 'book-outline', label: "Ta'lim" },
  { name: 'rocket-outline', label: 'Loyiha' },
  { name: 'star-outline', label: 'Muhim' },
  { name: 'megaphone-outline', label: 'Kanal' },
  { name: 'people-outline', label: 'Guruh' },
  { name: 'chatbubbles-outline', label: 'Chat' },
  { name: 'flash-outline', label: 'Tezkor' },
  { name: 'heart-outline', label: 'Yaqinlar' },
  { name: 'game-controller-outline', label: "O'yin" },
  { name: 'code-slash-outline', label: 'Dasturlash' },
  { name: 'musical-notes-outline', label: 'Musiqa' },
  { name: 'cafe-outline', label: 'Dam' },
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  visible,
  editingFolder,
  conversations,
  theme,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(editingFolder?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(editingFolder?.iconName || 'briefcase-outline');
  const [includeTypes, setIncludeTypes] = useState<('direct' | 'group' | 'channel')[]>(
    editingFolder?.includeTypes || ['direct']
  );
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>(
    editingFolder?.chatIds || []
  );

  React.useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setSelectedIcon(editingFolder.iconName || 'briefcase-outline');
      setIncludeTypes(editingFolder.includeTypes || ['direct']);
      setSelectedChatIds(editingFolder.chatIds || []);
    } else {
      setName('');
      setSelectedIcon('briefcase-outline');
      setIncludeTypes(['direct']);
      setSelectedChatIds([]);
    }
  }, [editingFolder, visible]);

  const toggleType = (type: 'direct' | 'group' | 'channel') => {
    setIncludeTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleChat = (chatId: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const folder: MobileChatFolder = {
      id: editingFolder?.id || `folder_${Date.now()}`,
      name: name.trim(),
      iconName: selectedIcon,
      emoji: '📁',
      filter: 'custom',
      includeTypes,
      chatIds: selectedChatIds,
    };
    onSave(folder);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {editingFolder ? 'Jildni tahrirlash' : 'Yangi jild yaratish'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Folder Name & Vector Icon */}
            <Text style={[styles.sectionLabel, { color: theme.subtext }]}>JILD NOMI VA IKONKASI</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
              <View style={styles.iconBadgeSelected}>
                <Ionicons name={selectedIcon as any} size={20} color="#2563EB" />
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Masalan: Ish, Oila, Loyihalar..."
                placeholderTextColor={theme.subtext}
                style={[styles.input, { color: theme.text }]}
              />
            </View>

            {/* Vector Icons Selector (Matching user requirement: Lucide/Vector icons instead of stickers/emojis) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {FOLDER_ICON_OPTIONS.map((item) => {
                const isSelected = selectedIcon === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => setSelectedIcon(item.name)}
                    style={[
                      styles.iconBtn,
                      isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.name as any}
                      size={20}
                      color={isSelected ? '#FFFFFF' : theme.text}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Included Categories */}
            <Text style={[styles.sectionLabel, { color: theme.subtext, marginTop: 20 }]}>
              QO'SHILADIGAN CHAT TURLARI
            </Text>
            <View style={styles.typeRow}>
              {[
                { type: 'direct' as const, label: 'Shaxsiy', icon: 'person-outline' },
                { type: 'group' as const, label: 'Guruhlar', icon: 'people-outline' },
                { type: 'channel' as const, label: 'Kanallar', icon: 'megaphone-outline' },
              ].map((item) => {
                const isSelected = includeTypes.includes(item.type);
                return (
                  <TouchableOpacity
                    key={item.type}
                    onPress={() => toggleType(item.type)}
                    style={[
                      styles.typeChip,
                      { borderColor: isSelected ? '#2563EB' : theme.divider },
                      isSelected && { backgroundColor: 'rgba(37, 99, 235, 0.15)' },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={16}
                      color={isSelected ? '#2563EB' : theme.subtext}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: isSelected ? '#2563EB' : theme.text },
                        isSelected && { fontWeight: 'bold' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Specific Chats Selector */}
            {conversations.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: theme.subtext, marginTop: 20 }]}>
                  ALOHIDA CHATLARNI TANLASH ({selectedChatIds.length})
                </Text>
                <View style={styles.chatListWrap}>
                  {conversations.slice(0, 15).map((conv) => {
                    const isSelected = selectedChatIds.includes(conv._id);
                    const title =
                      conv.type === 'direct'
                        ? conv.partner?.displayName || 'Foydalanuvchi'
                        : conv.group?.name || 'Guruh';

                    return (
                      <TouchableOpacity
                        key={conv._id}
                        onPress={() => toggleChat(conv._id)}
                        style={[
                          styles.chatItem,
                          { borderBottomColor: theme.divider },
                          isSelected && { backgroundColor: 'rgba(37, 99, 235, 0.08)' },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={isSelected ? '#2563EB' : theme.subtext}
                        />
                        <Text style={[styles.chatItemTitle, { color: theme.text }]} numberOfLines={1}>
                          {title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: theme.divider }]}>
            {editingFolder && onDelete && (
              <TouchableOpacity
                onPress={() => {
                  onDelete(editingFolder.id);
                  onClose();
                }}
                style={styles.deleteBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.deleteBtnText}>O'chirish</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveBtn,
                { backgroundColor: name.trim() ? '#2563EB' : 'rgba(37, 99, 235, 0.4)' },
              ]}
              disabled={!name.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Jildni saqlash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  emojiCurrent: {
    fontSize: 22,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  emojiScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBadgeSelected: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emojiText: {
    fontSize: 20,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  typeChipText: {
    fontSize: 13,
  },
  chatListWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  chatItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

