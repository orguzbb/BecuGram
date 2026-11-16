import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Message } from '../types';
import { ThemeColors } from '../theme/colors';
import { getMediaUrl } from '../services/api';

interface TelegramMessageBubbleProps {
  message: Message;
  currentUserId?: string;
  theme: ThemeColors;
  onLongPress: (message: Message) => void;
  onPress: (message: Message) => void;
  onDoubleTap?: (message: Message) => void;
  onReplyPress?: (replyTo: any) => void;
}

export const TelegramMessageBubble: React.FC<TelegramMessageBubbleProps> = ({
  message,
  currentUserId,
  theme,
  onLongPress,
  onPress,
  onDoubleTap,
  onReplyPress,
}) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const audioElementRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const senderIdStr = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
  const isMe =
    senderIdStr === currentUserId ||
    (currentUserId && String(senderIdStr).toLowerCase() === String(currentUserId).toLowerCase()) ||
    (currentUserId === '6af0a01a7d27b76a8fee65f8' && senderIdStr === 'admin');

  const bubbleBg = isMe ? theme.myBubble : theme.theirBubble;
  const textColor = isMe ? theme.myBubbleText : theme.theirBubbleText;
  const timeColor = isMe ? theme.myBubbleTime : theme.theirBubbleTime;

  const timeFormatted = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      if (onDoubleTap) {
        onDoubleTap(message);
      } else {
        onPress(message);
      }
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        onPress(message);
        tapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  const handleLongPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onLongPress(message);
  };

  // Toggle voice playback if audio URL exists
  const handleToggleVoice = () => {
    const audioUrl = message.media?.url;
    if (!audioUrl) {
      setIsPlayingVoice(!isPlayingVoice);
      return;
    }

    if (Platform.OS === 'web') {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(getMediaUrl(audioUrl));
        audioElementRef.current.onended = () => setIsPlayingVoice(false);
      }
      if (isPlayingVoice) {
        audioElementRef.current.pause();
        setIsPlayingVoice(false);
      } else {
        audioElementRef.current.play().catch(() => {});
        setIsPlayingVoice(true);
      }
    } else {
      setIsPlayingVoice(!isPlayingVoice);
    }
  };

  const isImage = message.type === 'image' || (message.media?.url && (message.media.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(message.media.url)));
  const isVoice = message.type === 'voice' || message.type === 'audio';

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleTap}
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={[
          styles.bubble,
          { backgroundColor: bubbleBg },
          isMe ? styles.bubbleMe : styles.bubbleThem,
          isImage && !message.content ? styles.bubbleImageOnly : null,
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

        {/* 1. IMAGE MESSAGE */}
        {isImage && (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: getMediaUrl(message.media?.url || message.content) }}
              style={styles.bubbleImage}
              resizeMode="cover"
            />
            {message.content && message.content !== '📷 Rasm' && (
              <Text style={[styles.contentText, styles.imageCaption, { color: textColor }]}>
                {message.content}
              </Text>
            )}
          </View>
        )}

        {/* 2. VOICE MESSAGE */}
        {isVoice && !isImage && (
          <View style={styles.voiceContainer}>
            <TouchableOpacity
              onPress={handleToggleVoice}
              style={[styles.voicePlayButton, { backgroundColor: isMe ? '#FFFFFF' : '#2AABEE' }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlayingVoice ? 'pause' : 'play'}
                size={16}
                color={isMe ? '#2563EB' : '#FFFFFF'}
                style={!isPlayingVoice ? { marginLeft: 2 } : undefined}
              />
            </TouchableOpacity>

            {/* Waveform graphic */}
            <View style={styles.waveformContainer}>
              {[30, 60, 90, 45, 80, 50, 70, 100, 40, 65, 85, 45, 95, 60, 40, 75].map((h, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.waveformBar,
                    {
                      height: (h / 100) * 22,
                      backgroundColor: isMe ? '#FFFFFF' : '#2AABEE',
                      opacity: isPlayingVoice ? (idx % 2 === 0 ? 1 : 0.6) : idx < 6 ? 1 : 0.45,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.voiceDurationText, { color: timeColor }]}>0:05</Text>
          </View>
        )}

        {/* 3. TEXT MESSAGE */}
        {!isImage && !isVoice && (
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
              color={message.isRead ? '#93C5FD' : timeColor}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>

        {/* Telegram Reaction Badges (e.g. ❤️, 👍) */}
        {message.reactions && message.reactions.length > 0 && (
          <View
            style={[
              styles.reactionBadge,
              isMe ? styles.reactionBadgeMe : styles.reactionBadgeThem,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={styles.reactionEmoji}>
              {message.reactions[0].emoji || '❤️'}
            </Text>
            {message.reactions.length > 1 && (
              <Text style={[styles.reactionCount, { color: theme.text }]}>
                {message.reactions.length}
              </Text>
            )}
          </View>
        )}

        {/* Animated Double-tap Heart Pop */}
        {showHeartPop && (
          <View style={styles.heartPopContainer} pointerEvents="none">
            <Text style={styles.heartPopEmoji}>❤️</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 3,
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
    maxWidth: '82%',
    paddingHorizontal: 11,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 1,
  },
  bubbleImageOnly: {
    paddingHorizontal: 4,
    paddingTop: 4,
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
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bubbleImage: {
    width: 240,
    height: 190,
    borderRadius: 12,
  },
  imageCaption: {
    marginTop: 6,
    paddingHorizontal: 4,
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
    minWidth: 190,
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
  voiceDurationText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
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
  reactionBadgeMe: {
    right: 8,
  },
  reactionBadgeThem: {
    left: 8,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  heartPopContainer: {
    position: 'absolute',
    top: -18,
    left: '42%',
    zIndex: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartPopEmoji: {
    fontSize: 42,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
