import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { Message } from '../types';

interface TelegramInputBarProps {
  theme: ThemeColors;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  onSendText: (text: string) => void;
  onSendVoice?: () => void;
  onSendVideoNote?: () => void;
  onOpenAttachment?: () => void;
  onOpenEmojiPicker?: () => void;
}

export const TelegramInputBar: React.FC<TelegramInputBarProps> = ({
  theme,
  replyTo,
  onCancelReply,
  onSendText,
  onSendVoice,
  onSendVideoNote,
  onOpenAttachment,
  onOpenEmojiPicker,
}) => {
  const [text, setText] = useState('');
  const [mediaMode, setMediaMode] = useState<'voice' | 'video'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const hasText = text.trim().length > 0;

  const handleSend = async () => {
    if (!hasText) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const toSend = text.trim();
    setText('');
    onSendText(toSend);
  };

  const handleToggleMediaMode = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    setMediaMode((prev) => (prev === 'voice' ? 'video' : 'voice'));
  };

  const handleMediaPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (mediaMode === 'voice') {
      onSendVoice?.();
    } else {
      onSendVideoNote?.();
    }
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.card }]}>
      {/* 1. Reply Banner (Telegram style preview bar) */}
      {replyTo && (
        <View style={[styles.replyContainer, { borderBottomColor: theme.divider }]}>
          <View style={styles.replyAccentBar} />
          <View style={styles.replyContent}>
            <Text style={styles.replyAuthor} numberOfLines={1}>
              {typeof replyTo.senderId === 'object'
                ? replyTo.senderId.displayName
                : 'Javob berilmoqda'}
            </Text>
            <Text style={[styles.replySnippet, { color: theme.subtext }]} numberOfLines={1}>
              {replyTo.content || (replyTo.type === 'voice' ? 'Ovozli xabar' : 'Media fayl')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onCancelReply}
            style={styles.replyCloseButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={18} color={theme.subtext} />
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Main Telegram Input Bar */}
      <View style={styles.inputRow}>
        {/* Attachment Paperclip Button */}
        <TouchableOpacity
          onPress={onOpenAttachment}
          style={styles.iconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="attach-outline" size={24} color={theme.actionIcon} />
        </TouchableOpacity>

        {/* Input Capsule (Telegram rounded input pill) */}
        <View style={[styles.inputCapsule, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Xabar yozing..."
            placeholderTextColor={theme.subtext}
            multiline
            style={[styles.textInput, { color: theme.text }]}
            cursorColor={theme.primary}
          />

          {/* Emoji / Sticker Toggle Button */}
          <TouchableOpacity
            onPress={onOpenEmojiPicker}
            style={styles.emojiButton}
            activeOpacity={0.7}
          >
            <Ionicons name="happy-outline" size={22} color={theme.actionIcon} />
          </TouchableOpacity>
        </View>

        {/* Action Button: Send Airplane (✈️) or Voice/Krujok (🎙️ / 🎥) */}
        {hasText ? (
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleMediaPress}
            onLongPress={handleToggleMediaMode}
            style={styles.mediaButton}
            activeOpacity={0.7}
            delayLongPress={400}
          >
            <Ionicons
              name={mediaMode === 'voice' ? 'mic' : 'videocam'}
              size={24}
              color={theme.actionIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  replyAccentBar: {
    width: 2.5,
    height: 32,
    backgroundColor: '#2AABEE',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2AABEE',
  },
  replySnippet: {
    fontSize: 11,
    marginTop: 1,
  },
  replyCloseButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCapsule: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    textAlignVertical: 'center',
  },
  emojiButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2AABEE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaButton: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
