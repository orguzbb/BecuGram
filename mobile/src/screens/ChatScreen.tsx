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

const REACTION_PRESETS = ['❤️', '👍', '🔥', '🎉', '👏', '😂'];

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversation,
  currentUser,
  theme,
  onBack,
  onOpenProfile,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const isDirect = conversation.type === 'direct';
  const partner = isDirect ? conversation.partner : null;
  const title = isDirect ? partner?.displayName || 'Foydalanuvchi' : conversation.group?.name || 'Guruh';
  const subtitle = isDirect
    ? partner?.isOnline
      ? 'onlayn'
      : 'oxirgi faollik yaqinda'
    : `${conversation.group?.membersCount || 2} ta a‘zo`;

  // Fetch messages and listen to live events
  useEffect(() => {
    mobileApi
      .getMessages(conversation._id)
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch((err) => console.log('Failed to fetch messages:', err));

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

      socket.on('message:new', handleNewMessage);
      socket.on('message:reaction', handleReaction);

      return () => {
        socket.off('message:new', handleNewMessage);
        socket.off('message:reaction', handleReaction);
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
      senderId: currentUser || 'me',
      content: text,
      type: 'text',
      replyTo: replyMessage
        ? {
            _id: replyMessage._id,
            content: replyMessage.content,
            senderId: replyMessage.senderId,
          }
        : undefined,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [optimisticMessage, ...prev]);
    const replyToSend = replyMessage?._id;
    setReplyMessage(null);

    try {
      const savedMessage = await mobileApi.sendMessage({
        conversationId: conversation._id,
        content: text,
        type: 'text',
        replyToMessageId: replyToSend,
      });

      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? savedMessage : m))
      );
    } catch (err) {
      console.log('Error sending message:', err);
    }
  };

  // Add reaction
  const handleAddReaction = async (emoji: string) => {
    if (!selectedMessage) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await mobileApi.toggleReaction(selectedMessage._id, emoji);
    } catch (err) {
      console.log('Failed to add reaction:', err);
    } finally {
      setIsMenuVisible(false);
      setSelectedMessage(null);
    }
  };

  // Delete message
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    try {
      await mobileApi.deleteMessage(selectedMessage._id, true);
      setMessages((prev) => prev.filter((m) => m._id !== selectedMessage._id));
    } catch (err) {
      console.log('Failed to delete message:', err);
    } finally {
      setIsMenuVisible(false);
      setSelectedMessage(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.header }]}>
      <StatusBar style="light" />

      {/* 1. Telegram Top Chat Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onOpenProfile(partner || undefined)}
            style={styles.headerUserInfo}
            activeOpacity={0.8}
          >
            <Avatar
              name={title}
              src={partner?.avatar || conversation.group?.avatar}
              size={40}
              isOnline={partner?.isOnline}
              isVerified={partner?.isVerified}
            />
            <View style={styles.nameBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </Text>
                {partner?.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#60A5FA"
                    style={{ marginLeft: 3 }}
                  />
                )}
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Top Action Icons: Call, Video, More */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerActionIcon}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionIcon}>
            <Ionicons name="videocam" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionIcon}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Message List with Keyboard Avoidance */}
      <KeyboardAvoidingView
        style={[styles.chatBody, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
              onLongPress={(msg) => {
                setSelectedMessage(msg);
                setIsMenuVisible(true);
              }}
              onReplyPress={(quoted) => {
                // Scroll or jump
              }}
            />
          )}
        />

        {/* 3. Telegram Input Bar */}
        <TelegramInputBar
          theme={theme}
          replyTo={replyMessage}
          onCancelReply={() => setReplyMessage(null)}
          onSendText={handleSendText}
          onSendVoice={() => {
            handleSendText('🎤 Ovozli xabar');
          }}
          onSendVideoNote={() => {
            handleSendText('📹 Dumaloq video xabar');
          }}
          onOpenAttachment={() => {}}
          onOpenEmojiPicker={() => {}}
        />
      </KeyboardAvoidingView>

      {/* 4. Telegram Context Menu Modal */}
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
          <View style={[styles.menuSheet, { backgroundColor: theme.card }]}>
            {/* Reactions Picker */}
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

            {/* Actions */}
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
              onPress={() => {
                setIsMenuVisible(false);
              }}
              style={styles.menuItem}
            >
              <Ionicons name="copy-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Nusxa olish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsMenuVisible(false);
              }}
              style={styles.menuItem}
            >
              <Ionicons name="arrow-redo-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Uzatish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsMenuVisible(false);
              }}
              style={styles.menuItem}
            >
              <Ionicons name="pin-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Qadash</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteMessage}
              style={[styles.menuItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.divider }]}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>O‘chirish</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    paddingHorizontal: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 4,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameBlock: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#A0B4C8',
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionIcon: {
    padding: 6,
  },
  chatBody: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuSheet: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  reactionBtn: {
    padding: 6,
    borderRadius: 12,
  },
  reactionEmojiText: {
    fontSize: 24,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
