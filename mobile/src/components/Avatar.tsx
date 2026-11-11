import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  isOnline?: boolean;
  isVerified?: boolean;
}

// Telegram-style avatar gradients based on name initial
const GRADIENT_PALETTES: [string, string][] = [
  ['#FC5C7D', '#6A82FB'], // Pink - Purple
  ['#11998E', '#38EF7D'], // Green - Mint
  ['#FF8008', '#FFC837'], // Orange - Yellow
  ['#2AABEE', '#229ED9'], // Telegram Blue
  ['#8E2DE2', '#4A00E0'], // Deep Violet
  ['#00C9FF', '#92FE9D'], // Cyan - Lime
  ['#F857A6', '#FF5858'], // Coral
  ['#4776E6', '#8E54E9'], // Royal Blue
];

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  src,
  size = 48,
  isOnline = false,
  isVerified = false,
}) => {
  const initial = (name.trim().charAt(0) || 'U').toUpperCase();

  // Deterministic gradient selection
  const charCode = initial.charCodeAt(0) || 0;
  const gradient = GRADIENT_PALETTES[charCode % GRADIENT_PALETTES.length];

  const fontSize = Math.round(size * 0.42);
  const badgeSize = Math.max(12, Math.round(size * 0.28));

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {src ? (
        <Image
          source={{ uri: src }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#1E293B',
          }}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize,
              fontWeight: 'bold',
              letterSpacing: 0.5,
            }}
          >
            {initial}
          </Text>
        </LinearGradient>
      )}

      {/* Online indicator badge */}
      {isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}

      {/* Telegram Verified Checkmark */}
      {isVerified && !isOnline && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: -1,
              right: -1,
            },
          ]}
        >
          <Ionicons name="checkmark" size={badgeSize * 0.75} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  onlineBadge: {
    position: 'absolute',
    backgroundColor: '#4FAE4E',
    borderWidth: 2,
    borderColor: '#17212B',
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: '#2AABEE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#17212B',
  },
});

