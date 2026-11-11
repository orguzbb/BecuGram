import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, LightTheme } from './src/theme/colors';
import { User, Conversation, Story } from './src/types';
import { mobileApi } from './src/services/api';
import { mobileSocket } from './src/services/socket';
import { AuthScreen } from './src/screens/AuthScreen';
import { ChatListScreen } from './src/screens/ChatListScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'chats' | 'chat_view' | 'profile'>('chats');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  const theme = isDark ? DarkTheme : LightTheme;

  // Initialize Auth & Theme
  useEffect(() => {
    const initApp = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@becugram_theme');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }

        const savedUserStr = await AsyncStorage.getItem('@becugram_user');
        const token = await AsyncStorage.getItem('@becugram_token');

        if (token && savedUserStr) {
          const parsedUser = JSON.parse(savedUserStr);
          setCurrentUser(parsedUser);
          await mobileSocket.connect();
          loadData();
        }
      } catch (err) {
        console.log('Init app error:', err);
      } finally {
        setIsReady(true);
      }
    };

    initApp();
  }, []);

  const loadData = async () => {
    try {
      const [chats, userStories] = await Promise.all([
        mobileApi.getChats().catch(() => []),
        mobileApi.getStories().catch(() => []),
      ]);
      if (Array.isArray(chats)) setConversations(chats);
      if (Array.isArray(userStories)) setStories(userStories);
    } catch (err) {
      console.log('Error loading data:', err);
    }
  };

  const handleToggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('@becugram_theme', next ? 'dark' : 'light');
  };

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    await mobileSocket.connect();
    loadData();
    setCurrentScreen('chats');
  };

  const handleLogout = async () => {
    await Promise.all([
      AsyncStorage.removeItem('@becugram_token'),
      AsyncStorage.removeItem('@becugram_user'),
    ]);
    mobileSocket.disconnect();
    setCurrentUser(null);
    setCurrentScreen('chats');
  };

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#0E1621' }]}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>B</Text>
        </View>
        <Text style={styles.appTitle}>BecuGram</Text>
        <ActivityIndicator color="#2AABEE" size="large" style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return <AuthScreen theme={theme} onLoginSuccess={handleLoginSuccess} />;
  }

  // Authenticated Screen Switcher
  if (currentScreen === 'chat_view' && activeConversation) {
    return (
      <ChatScreen
        conversation={activeConversation}
        currentUser={currentUser}
        theme={theme}
        onBack={() => {
          setActiveConversation(null);
          setCurrentScreen('chats');
        }}
        onOpenProfile={() => setCurrentScreen('profile')}
      />
    );
  }

  if (currentScreen === 'profile') {
    return (
      <ProfileScreen
        user={currentUser}
        theme={theme}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onBack={() => setCurrentScreen('chats')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ChatListScreen
      currentUser={currentUser}
      conversations={conversations}
      stories={stories}
      theme={theme}
      onSelectChat={(conv) => {
        setActiveConversation(conv);
        setCurrentScreen('chat_view');
      }}
      onOpenNewChat={() => {}}
      onOpenMenu={() => setCurrentScreen('profile')}
      onOpenSearch={() => {}}
      onOpenMyStory={() => {}}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#2AABEE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2AABEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 14,
    letterSpacing: 0.5,
  },
});
