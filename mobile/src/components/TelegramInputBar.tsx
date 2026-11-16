import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
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

  const handleMicPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onSendVoice?.();
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
      {/* 1. Reply Banner */}
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

      {/* 2. Main Capsule Input Row (Matching Image 3) */}
      <View style={styles.inputRow}>
        {/* Capsule Input: [ 😊 ] [ Xabar... ] [ 📎 ] */}
        <View style={[styles.inputCapsule, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
          {/* Emoji / Smile Button on Left */}
          <TouchableOpacity
            onPress={onOpenEmojiPicker}
            style={styles.emojiButton}
            activeOpacity={0.7}
          >
            <Ionicons name="happy-outline" size={22} color={theme.subtext} />
          </TouchableOpacity>

          {/* Text Input with "Xabar" placeholder */}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Xabar"
            placeholderTextColor={theme.subtext}
            multiline
            style={[styles.textInput, { color: theme.text }]}
            cursorColor="#2563EB"
          />

          {/* Attachment Paperclip Button on Right */}
          <TouchableOpacity
            onPress={onOpenAttachment}
            style={styles.attachButton}
            activeOpacity={0.7}
          >
            <Ionicons name="attach-outline" size={22} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* Circular Blue Action Button: Send (✈️) or Mic (🎙️) on Far Right */}
        <TouchableOpacity
          onPress={hasText ? handleSend : handleMicPress}
          style={[styles.actionButton, { backgroundColor: '#2563EB' }]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={hasText ? 'send' : 'mic'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    backgroundColor: '#2563EB',
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
    color: '#2563EB',
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
    alignItems: 'center',
    gap: 8,
  },
  inputCapsule: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  emojiButton: {
    padding: 4,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    textAlignVertical: 'center',
  },
  attachButton: {
    padding: 4,
    marginLeft: 4,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
});
