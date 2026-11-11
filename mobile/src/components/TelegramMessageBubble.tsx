import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Message, User } from '../types';
import { ThemeColors } from '../theme/colors';

interface TelegramMessageBubbleProps {
  message: Message;
  currentUserId?: string;
  theme: ThemeColors;
  onLongPress: (message: Message) => void;
  onPress: (message: Message) => void;
  onReplyPress?: (replyTo: any) => void;
}

export const TelegramMessageBubble: React.FC<TelegramMessageBubbleProps> = ({
  message,
  currentUserId,
  theme,
  onLongPress,
  onPress,
  onReplyPress,
}) => {
  const isMe =
    typeof message.senderId === 'object'
      ? message.senderId?._id === currentUserId
      : message.senderId === currentUserId;

  const bubbleBg = isMe ? theme.myBubble : theme.theirBubble;
  const textColor = isMe ? theme.myBubbleText : theme.theirBubbleText;
  const timeColor = isMe ? theme.myBubbleTime : theme.theirBubbleTime;

  const timeFormatted = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleLongPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onLongPress(message);
  };

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress(message)}
        onLongPress={handleLongPress}
        delayLongPress={350}
        style={[
          styles.bubble,
          { backgroundColor: bubbleBg },
          isMe ? styles.bubbleMe : styles.bubbleThem,
        ]}
      >
        {/* Forwarded Header */}
        {message.forwardedFrom && (
          <View style={styles.forwardedHeader}>
            <Ionicons name="arrow-redo" size={12} color="#2AABEE" style={{ marginRight: 4 }} />
            <Text style={styles.forwardedText}>
              Uzatilgan xabar: {message.forwardedFrom.displayName}
            </Text>
          </View>
        )}

        {/* Quoted Reply Reference */}
        {message.replyTo && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onReplyPress?.(message.replyTo)}
            style={[
              styles.replyBox,
              {
                borderLeftColor: isMe ? '#FFFFFF' : '#2AABEE',
                backgroundColor: isMe ? 'rgba(0,0,0,0.12)' : 'rgba(42, 171, 238, 0.08)',
              },
            ]}
          >
            <Text style={[styles.replyAuthor, { color: isMe ? '#FFFFFF' : '#2AABEE' }]}>
              {typeof message.replyTo.senderId === 'object'
                ? message.replyTo.senderId.displayName
                : 'Foydalanuvchi'}
            </Text>
            <Text style={[styles.replySnippet, { color: textColor }]} numberOfLines={1}>
              {message.replyTo.content || 'Media'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Message Content: Voice or Text */}
        {message.type === 'voice' ? (
          <View style={styles.voiceContainer}>
            <View style={[styles.voicePlayButton, { backgroundColor: isMe ? '#FFFFFF' : '#2AABEE' }]}>
              <Ionicons
                name="play"
                size={16}
                color={isMe ? '#2B5278' : '#FFFFFF'}
                style={{ marginLeft: 2 }}
              />
            </View>

            {/* Simulated waveform bars */}
            <View style={styles.waveformContainer}>
              {[30, 60, 90, 45, 80, 50, 70, 100, 40, 65, 85, 45, 95, 60, 40, 75].map((h, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.waveformBar,
                    {
                      height: (h / 100) * 22,
                      backgroundColor: isMe ? '#FFFFFF' : theme.primary,
                      opacity: idx < 6 ? 1 : 0.45,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          <Text style={[styles.contentText, { color: textColor }]}>
            {message.content}
          </Text>
        )}

        {/* Footer: Time and Status ticks */}
        <View style={styles.footerRow}>
          {message.isEdited && (
            <Text style={[styles.editedText, { color: timeColor }]}>tahrirlangan </Text>
          )}
          <Text style={[styles.timeText, { color: timeColor }]}>{timeFormatted}</Text>

          {isMe && (
            <Ionicons
              name={message.isRead ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.isRead ? (isMe ? '#60A5FA' : '#2AABEE') : timeColor}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>

        {/* Telegram Reaction Badge (e.g. 👍 (A)) */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={[styles.reactionBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.reactionEmoji}>
              {message.reactions[0].emoji === '006' ? '❤️' : '👍'}
            </Text>
            <View style={styles.reactorCircle}>
              <Text style={styles.reactorLetter}>A</Text>
            </View>
            {message.reactions.length > 1 && (
              <Text style={[styles.reactionCount, { color: theme.text }]}>
                {message.reactions.length}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 2.5,
    paddingHorizontal: 8,
    flexDirection: 'row',
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowThem: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 11,
    paddingTop: 7,
    paddingBottom: 6,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    borderBottomLeftRadius: 4,
  },
  forwardedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  forwardedText: {
    fontSize: 11,
    color: '#2AABEE',
    fontWeight: '600',
  },
  replyBox: {
    borderLeftWidth: 2.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 5,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  replySnippet: {
    fontSize: 11,
    opacity: 0.85,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  voicePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
    flex: 1,
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  editedText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -10,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#5D5FEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactorLetter: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

