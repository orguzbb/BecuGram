import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Story, User } from '../types';
import { ThemeColors } from '../theme/colors';
import { getMediaUrl, mobileApi } from '../services/api';

interface StoryViewerModalProps {
  visible: boolean;
  stories: Story[];
  initialIndex?: number;
  currentUser?: User | null;
  theme: ThemeColors;
  onClose: () => void;
  onReplyToStory?: (story: Story, text: string) => void;
}

const { width, height } = Dimensions.get('window');

const STORY_REACTIONS = ['❤️', '👍', '🔥', '😂', '👏', '🎉', '🚀'];

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  visible,
  stories,
  initialIndex = 0,
  currentUser,
  theme,
  onClose,
  onReplyToStory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [replyText, setReplyText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [sentToast, setSentToast] = useState<string | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentStory = stories[currentIndex] || stories[0];

  useEffect(() => {
    if (visible) {
      setCurrentIndex(Math.min(initialIndex, Math.max(0, stories.length - 1)));
      startProgress();
    } else {
      progressAnim.setValue(0);
    }
  }, [visible, initialIndex]);

  useEffect(() => {
    if (!visible || !currentStory) return;
    progressAnim.setValue(0);
    startProgress();
  }, [currentIndex]);

  const startProgress = () => {
    progressAnim.stopAnimation();
    if (isPaused) return;

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      progressAnim.setValue(0);
      startProgress();
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentStory) return;
    const textToSend = replyText.trim();
    setReplyText('');

    if (onReplyToStory) {
      onReplyToStory(currentStory, textToSend);
    } else if (currentStory.userId && currentStory.userId !== 'official') {
      try {
        const conv = await mobileApi.getOrCreateDirectChat(currentStory.userId);
        if (conv?._id) {
          await mobileApi.sendMessage({
            conversationId: conv._id,
            content: `🌸 Hikoyaga javob: ${textToSend}`,
            type: 'text',
          });
        }
      } catch {}
    }

    setSentToast('Xabar yuborildi! 🚀');
    setTimeout(() => setSentToast(null), 2500);
  };

  const handleQuickReaction = async (emoji: string) => {
    if (!currentStory) return;
    if (onReplyToStory) {
      onReplyToStory(currentStory, emoji);
    } else if (currentStory.userId && currentStory.userId !== 'official') {
      try {
        const conv = await mobileApi.getOrCreateDirectChat(currentStory.userId);
        if (conv?._id) {
          await mobileApi.sendMessage({
            conversationId: conv._id,
            content: emoji,
            type: 'text',
          });
        }
      } catch {}
    }
    setSentToast(`${emoji} Reaksiya yuborildi!`);
    setTimeout(() => setSentToast(null), 2000);
  };

  if (!visible || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Progress bars header */}
        <View style={styles.progressContainer}>
          {stories.map((st, i) => {
            let widthInterpolate = '0%';
            if (i < currentIndex) {
              widthInterpolate = '100%';
            } else if (i === currentIndex) {
              widthInterpolate = progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }) as any;
            }

            return (
              <View key={st.id || i} style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: widthInterpolate,
                      backgroundColor: '#FFFFFF',
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Story Author Header */}
        <View style={styles.header}>
          <View style={styles.authorInfo}>
            {/* Dumaloq Kontakt Rasmi */}
            <View style={styles.avatarRing}>
              {currentStory.userAvatar ? (
                <Image
                  source={{ uri: getMediaUrl(currentStory.userAvatar) }}
                  style={styles.avatarImage}
                />
              ) : (
                <Avatar name={currentStory.userName} size={42} />
              )}
            </View>
            <View style={styles.authorTextCol}>
              <Text style={styles.authorName} numberOfLines={1}>
                {currentStory.userName}
              </Text>
              <Text style={styles.authorTime}>Bugun, 24 soat faol</Text>
            </View>
          </View>

          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Story Middle Content Body */}
        <View style={styles.storyBody}>
          {/* Tap Zones for Prev / Next */}
          <TouchableOpacity
            style={styles.leftTapZone}
            activeOpacity={1}
            onPress={handlePrev}
            onLongPress={() => {
              setIsPaused(true);
              progressAnim.stopAnimation();
            }}
            onPressOut={() => {
              setIsPaused(false);
              startProgress();
            }}
          />

          <TouchableOpacity
            style={styles.rightTapZone}
            activeOpacity={1}
            onPress={handleNext}
            onLongPress={() => {
              setIsPaused(true);
              progressAnim.stopAnimation();
            }}
            onPressOut={() => {
              setIsPaused(false);
              startProgress();
            }}
          />

          {/* Story Card Content */}
          <View style={styles.storyCard}>
            <View style={styles.storyCardHeader}>
              <Ionicons name="sparkles" size={24} color="#60A5FA" />
            </View>
            <Text style={styles.storyCaptionText}>
              {currentStory.caption || 'BecuGram yangi imkoniyatlari bilan tanishing! 🌟'}
            </Text>
          </View>
        </View>

        {/* Sent Confirmation Toast */}
        {sentToast && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{sentToast}</Text>
          </View>
        )}

        {/* Floating Quick Reaction Emojis */}
        <View style={styles.quickReactionsRow}>
          {STORY_REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => handleQuickReaction(emoji)}
              style={styles.reactionPill}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Interactive Reply Input Bar */}
        <View style={styles.replyBar}>
          <View style={styles.replyInputWrap}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Xabar yozing..."
              placeholderTextColor="#94A3B8"
              style={styles.replyInput}
              returnKeyType="send"
              onSubmitEditing={handleSendReply}
            />
          </View>

          <TouchableOpacity
            onPress={handleSendReply}
            style={[
              styles.sendBtn,
              { backgroundColor: replyText.trim() ? '#2563EB' : 'rgba(255,255,255,0.15)' },
            ]}
            disabled={!replyText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={replyText.trim() ? '#FFFFFF' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#091016',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    gap: 4,
    zIndex: 20,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  authorTextCol: {
    flex: 1,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  authorTime: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  storyBody: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  leftTapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '35%',
    zIndex: 10,
  },
  rightTapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '65%',
    zIndex: 10,
  },
  storyCard: {
    width: '100%',
    maxWidth: 420,
    minHeight: 260,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  storyCardHeader: {
    marginBottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCaptionText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 30,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 20,
  },
  reactionPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 20,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 8,
    gap: 10,
    zIndex: 20,
  },
  replyInputWrap: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  replyInput: {
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

