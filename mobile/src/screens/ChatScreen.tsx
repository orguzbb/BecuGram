import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../components/Avatar';
import { TelegramMessageBubble } from '../components/TelegramMessageBubble';
import { TelegramInputBar } from '../components/TelegramInputBar';
import { Conversation, Message, User } from '../types';
import { ThemeColors } from '../theme/colors';
import { mobileApi } from '../services/api';
import { mobileSocket } from '../services/socket';

interface ChatScreenProps {
  conversation: Conversation;
  currentUser: User | null;
  theme: ThemeColors;
  onBack: () => void;
  onOpenProfile: (user?: User) => void;
}

const REACTION_PRESETS = ['❤️', '👍', '🔥', '🎉', '👏', '😂', '😊'];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversation,
  currentUser,
  theme,
  onBack,
  onOpenProfile,
}) => {
  const isDirect = conversation.type === 'direct';
  const partner = isDirect ? conversation.partner : null;
  const title = isDirect
    ? partner?.displayName || 'Foydalanuvchi'
    : conversation.group?.name || 'BecuGram Official ✨';
  const isOfficial = title.includes('BecuGram');

  const defaultWelcomeMessages: Message[] = [
    {
      _id: 'welcome_msg_1',
      conversationId: conversation._id,
      senderId: 'official',
      content:
        "✨ Xush kelibsiz! BecuGram — xavfsiz va zamonaviy xabar almashish platformasi.\n\nBu yerda siz do'stlaringizni taklif qilishingiz, guruhlar ochishingiz, ovozli xabarlar va fotosuratlar yuborishingiz mumkin.",
      reactions: [{ emoji: '😊', count: 1 }],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: 'welcome_msg_2',
      conversationId: conversation._id,
      senderId: 'official',
      content: '📢 [salom]:\nsalom',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForBoth, setDeleteForBoth] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  const subtitle = isDirect
    ? partner?.isOnline
      ? 'onlayn'
      : 'oxirgi faollik yaqinda'
    : 'oxirgi faollik yaqinda';

  // Fetch messages and listen to live events
  useEffect(() => {
    mobileApi
      .getMessages(conversation._id)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Sort descending by createdAt because FlatList is inverted!
          const sorted = [...data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setMessages(sorted);
        } else if (isOfficial) {
          setMessages(defaultWelcomeMessages);
        } else {
          setMessages([]);
        }
      })
      .catch(() => {
        if (isOfficial) {
          setMessages(defaultWelcomeMessages);
        }
      });

    mobileSocket.joinChat(conversation._id);

    const socket = mobileSocket.getSocket();
    if (socket) {
      const handleNewMessage = (msg: Message) => {
        if (msg.conversationId === conversation._id) {
          setMessages((prev) => [msg, ...prev]);
        }
      };

      const handleReaction = (payload: { messageId: string; reactions: any[] }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === payload.messageId ? { ...m, reactions: payload.reactions } : m))
        );
      };

      const handleDeleted = (payload: { messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m._id !== payload.messageId));
      };

      socket.on('message:new', handleNewMessage);
      socket.on('message:reaction', handleReaction);
      socket.on('message:deleted', handleDeleted);

      return () => {
        socket.off('message:new', handleNewMessage);
        socket.off('message:reaction', handleReaction);
        socket.off('message:deleted', handleDeleted);
        mobileSocket.leaveChat(conversation._id);
      };
    }
  }, [conversation._id]);

  // Send message
  const handleSendText = async (text: string) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      conversationId: conversation._id,
      senderId: currentUser?._id || 'me',
      content: text,
      replyTo: replyMessage
        ? {
            _id: replyMessage._id,
            content: replyMessage.content,
            senderId: replyMessage.senderId,
          }
        : undefined,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [optimisticMessage, ...prev]);
    setReplyMessage(null);

    try {
      const savedMsg = await mobileApi.sendMessage({
        conversationId: conversation._id,
        content: text,
        type: 'text',
        replyToId: replyMessage?._id,
      });
      setMessages((prev) => prev.map((m) => (m._id === tempId ? savedMsg : m)));
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: 'sent' } : m))
      );
    }
  };

  // Send Image Attachment
  const handleOpenAttachment = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        const tempId = `temp_img_${Date.now()}`;
        const previewUrl = URL.createObjectURL(file);
        const optimisticMessage: Message = {
          _id: tempId,
          conversationId: conversation._id,
          senderId: currentUser?._id || 'me',
          content: '📷 Rasm',
          type: 'image',
          media: {
            url: previewUrl,
            name: file.name,
            size: file.size,
            mimeType: file.type,
          },
          createdAt: new Date().toISOString(),
          status: 'sending',
        };

        setMessages((prev) => [optimisticMessage, ...prev]);

        try {
          const uploadRes = await mobileApi.uploadMedia(file);
          const savedMsg = await mobileApi.sendMessage({
            conversationId: conversation._id,
            content: '📷 Rasm',
            type: 'image',
            media: uploadRes,
          });
          setMessages((prev) => prev.map((m) => (m._id === tempId ? savedMsg : m)));
        } catch (err: any) {
          Alert.alert('Xatolik', 'Rasm yuklashda xatolik: ' + (err.message || ''));
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
        }
      };
      input.click();
    }
  };

  // Send Voice Message
  const handleSendVoice = async () => {
    const tempId = `temp_voice_${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      conversationId: conversation._id,
      senderId: currentUser?._id || 'me',
      content: 'Ovozli xabar (2s)',
      type: 'voice',
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [optimisticMessage, ...prev]);

    try {
      const savedMsg = await mobileApi.sendMessage({
        conversationId: conversation._id,
        content: 'Ovozli xabar (2s)',
        type: 'voice',
      });
      setMessages((prev) => prev.map((m) => (m._id === tempId ? savedMsg : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...m, status: 'sent' } : m)));
    }
  };

  // Double tap to instant heart like without opening modal
  const handleDoubleTap = async (msg: Message) => {
    // Instant optimistic update
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id === msg._id) {
          const existing = m.reactions || [];
          const found = existing.find((r) => r.emoji === '❤️');
          const nextReactions = found
            ? existing.filter((r) => r.emoji !== '❤️')
            : [...existing, { emoji: '❤️', count: 1 }];
          return { ...m, reactions: nextReactions };
        }
        return m;
      })
    );

    try {
      await mobileApi.toggleReaction(msg._id, '❤️');
    } catch {}
  };

  const handleAddReaction = async (emoji: string) => {
    if (!selectedMessage) return;
    const msgId = selectedMessage._id;
    setIsMenuVisible(false);

    try {
      await mobileApi.toggleReaction(msgId, emoji);
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === msgId) {
            const existing = m.reactions || [];
            const found = existing.find((r) => r.emoji === emoji);
            const nextReactions = found
              ? existing.filter((r) => r.emoji !== emoji)
              : [...existing, { emoji, count: 1 }];
            return { ...m, reactions: nextReactions };
          }
          return m;
        })
      );
    } catch {}
  };

  const handleConfirmDelete = async () => {
    if (!selectedMessage) return;
    const msgId = selectedMessage._id;
    setShowDeleteModal(false);
    setSelectedMessage(null);

    setMessages((prev) => prev.filter((m) => m._id !== msgId));
    try {
      await mobileApi.deleteMessage(msgId, deleteForBoth);
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.header }]}>
      <StatusBar style="light" />

      {/* 1. TOP HEADER (Matching Image 3) */}
      <View style={[styles.header, { backgroundColor: theme.header, borderBottomColor: theme.divider }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onOpenProfile(partner || undefined)}
            style={styles.profileRow}
            activeOpacity={0.8}
          >
            {isOfficial ? (
              <View style={[styles.avatarCircle, { backgroundColor: '#0D9488' }]}>
                <Ionicons name="megaphone" size={22} color="#FFFFFF" />
              </View>
            ) : (
              <Avatar
                name={title}
                src={partner?.avatar || conversation.group?.avatar}
                size={42}
                isOnline={partner?.isOnline}
              />
            )}
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitle, { color: '#FFFFFF' }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.headerSubtitle, { color: 'rgba(255, 255, 255, 0.75)' }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Right Action Icons: Search & More (Image 3) */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerActionIcon} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={21} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onOpenProfile(partner || undefined)}
            style={styles.headerActionIcon}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. CHAT BODY WITH DATE PILL ("Bugun") */}
      <KeyboardAvoidingView
        style={[styles.chatBody, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Date Capsule Pill ("Bugun") */}
        <View style={styles.datePillWrapper}>
          <View style={[styles.datePill, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.datePillText, { color: theme.subtext }]}>Bugun</Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          inverted
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <TelegramMessageBubble
              message={item}
              currentUserId={currentUser?._id}
              theme={theme}
              onPress={(msg) => {
                setSelectedMessage(msg);
                setIsMenuVisible(true);
              }}
              onDoubleTap={(msg) => {
                handleDoubleTap(msg);
              }}
              onLongPress={(msg) => {
                setSelectedMessage(msg);
                setIsMenuVisible(true);
              }}
            />
          )}
        />

        {/* 3. INPUT BAR MATCHING IMAGE 3 */}
        <TelegramInputBar
          theme={theme}
          replyTo={replyMessage}
          onCancelReply={() => setReplyMessage(null)}
          onSendText={handleSendText}
          onSendVoice={handleSendVoice}
          onOpenAttachment={handleOpenAttachment}
          onOpenEmojiPicker={() => {}}
        />
      </KeyboardAvoidingView>

      {/* 4. CONTEXT MENU & REACTION PICKER (Matching Image 3) */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={[styles.menuSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Reactions Bar */}
            <View style={styles.reactionsRow}>
              {REACTION_PRESETS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleAddReaction(emoji)}
                  style={styles.reactionBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.menuDivider, { backgroundColor: theme.divider }]} />

            {/* Actions: Javob berish, Nusxa olish, Uzatish, Qadash, O'chirish */}
            <TouchableOpacity
              onPress={() => {
                if (selectedMessage) setReplyMessage(selectedMessage);
                setIsMenuVisible(false);
              }}
              style={styles.menuItem}
            >
              <Ionicons name="arrow-undo-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Javob berish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsMenuVisible(false)}
              style={styles.menuItem}
            >
              <Ionicons name="copy-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Nusxa olish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsMenuVisible(false)}
              style={styles.menuItem}
            >
              <Ionicons name="share-social-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Uzatish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsMenuVisible(false)}
              style={styles.menuItem}
            >
              <Ionicons name="pin-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Qadash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsMenuVisible(false);
                setShowDeleteModal(true);
              }}
              style={[styles.menuItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider }]}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>O‘chirish</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 5. DELETE CONFIRMATION MODAL (Matching Image 4 EXACTLY!) */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalCenterOverlay}>
          <View style={[styles.deleteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.deleteTitle, { color: theme.text }]}>Xabarni o'chirish</Text>
            <Text style={[styles.deleteMessage, { color: theme.subtext }]}>
              Haqiqatan ham bu xabarni o'chirmoqchimisiz?
            </Text>

            {/* Checkbox: [Title] uchun ham o'chirish (Image 4) */}
            <TouchableOpacity
              onPress={() => setDeleteForBoth(!deleteForBoth)}
              style={styles.checkboxRow}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, deleteForBoth && styles.checkboxActive]}>
                {deleteForBoth && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.text }]} numberOfLines={1}>
                {title} uchun ham o'chirish
              </Text>
            </TouchableOpacity>

            {/* Buttons: Bekor qilish & O'chirish (Image 4) */}
            <View style={styles.deleteButtonsRow}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.cancelBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: theme.subtext }]}>Bekor qilish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={styles.confirmDeleteBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmDeleteBtnText}>O'chirish</Text>
              </TouchableOpacity>
            </View>
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
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionIcon: {
    padding: 6,
  },
  chatBody: {
    flex: 1,
  },
  datePillWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  // Context Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuSheet: {
    width: '84%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  reactionBtn: {
    padding: 6,
  },
  reactionEmojiText: {
    fontSize: 22,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Delete Modal (Image 4)
  modalCenterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  deleteCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  deleteButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
  },
  confirmDeleteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
