import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Story, User } from '../types';
import { ThemeColors } from '../theme/colors';
import { getMediaUrl } from '../services/api';

interface StoriesBarProps {
  currentUser?: User | null;
  stories: Story[];
  theme: ThemeColors;
  onOpenMyStory: () => void;
  onOpenStory: (story: Story, index: number) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  currentUser,
  stories,
  theme,
  onOpenMyStory,
  onOpenStory,
}) => {
  const initial = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : 'A';

  const defaultStories: Story[] = stories.length > 0 ? stories : [
    {
      id: 'becugram_official_story',
      userId: 'official',
      userName: 'BecuGram',
      caption: 'BecuGram yangi dizayni va animatsiyalari! 🚀',
      createdAt: new Date().toISOString(),
    },
  ];

  return (
    <View style={[styles.container, { borderBottomColor: theme.divider }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User's Own Story Button (Dumaloq) */}
        <TouchableOpacity
          onPress={onOpenMyStory}
          style={styles.storyItem}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={['#00D2FF', '#2563EB', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            >
              <View style={[styles.innerRing, { backgroundColor: '#2563EB', overflow: 'hidden' }]}>
                {currentUser?.avatar ? (
                  <Image source={{ uri: getMediaUrl(currentUser.avatar) }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={styles.initialText}>{initial}</Text>
                )}
              </View>
            </LinearGradient>
            <View style={[styles.plusBadge, { borderColor: theme.background }]}>
              <Ionicons name="add" size={13} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.storyLabel, { color: theme.text }]} numberOfLines={1}>
            Hikoyam
          </Text>
        </TouchableOpacity>

        {/* Other Users' Stories */}
        {defaultStories.map((story, index) => (
          <TouchableOpacity
            key={story.id || index}
            onPress={() => onOpenStory(story, index)}
            style={styles.storyItem}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={['#2EA6FF', '#0088CC', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientRing}
              >
                <View style={[styles.innerRing, { backgroundColor: '#17212B', overflow: 'hidden' }]}>
                  {story.userAvatar ? (
                    <Image source={{ uri: getMediaUrl(story.userAvatar) }} style={{ width: '100%', height: '100%', borderRadius: 28 }} />
                  ) : (
                    <Avatar name={story.userName} size={48} />
                  )}
                </View>
              </LinearGradient>
            </View>
            <Text style={[styles.storyLabel, { color: theme.text }]} numberOfLines={1}>
              {story.userName.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 66,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2.5,
  },
  innerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2563EB',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  storyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});
