import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { Story, User } from '../types';
import { ThemeColors } from '../theme/colors';

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
              colors={['#00C9FF', '#92FE9D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            >
              <View style={[styles.innerRing, { backgroundColor: theme.card }]}>
                <Avatar
                  name={currentUser?.displayName || 'Men'}
                  src={currentUser?.avatar}
                  size={52}
                />
              </View>
            </LinearGradient>
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={14} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.storyLabel, { color: theme.text }]} numberOfLines={1}>
            Hikoyam
          </Text>
        </TouchableOpacity>

        {/* Other Users' Stories */}
        {stories.map((story, index) => (
          <TouchableOpacity
            key={story.id || index}
            onPress={() => onOpenStory(story, index)}
            style={styles.storyItem}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientRing}
              >
                <View style={[styles.innerRing, { backgroundColor: theme.card }]}>
                  <Avatar
                    name={story.userName}
                    src={story.userAvatar}
                    size={52}
                  />
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
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  innerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#2AABEE',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#17212B',
  },
  storyLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
