import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, LightTheme, ThemeColors } from './src/theme/colors';
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
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const { width } = useWindowDimensions();

  const theme: ThemeColors = isDark ? DarkTheme : LightTheme;
  const isWideWeb = Platform.OS === 'web' && width > 768;

  // Initialize Auth & Theme (with 6s minimum loading duration as requested by user)
  useEffect(() => {
    const initApp = async () => {
      const startTime = Date.now();
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
        const elapsed = Date.now() - startTime;
        if (elapsed < 3000) {
          await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
        }
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
      if (Array.isArray(chats)) {
        setConversations(chats);
        // On wide web desktop, auto-select first conversation if none selected
        if (isWideWeb && chats.length > 0 && !activeConversation) {
          setActiveConversation(chats[0]);
        }
      }
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

  // 1. Loading splash screen (stays 6 seconds per user specification)
  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#070D0B' }]}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>B</Text>
        </View>
        <Text style={styles.appTitle}>BecuGram</Text>
        <Text style={styles.appSubtitle}>Xavfsiz va qulay messenjer</Text>
        <ActivityIndicator color="#2563EB" size="large" style={{ marginTop: 28 }} />
        <Text style={styles.loadingFooterText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  // 2. Unauthenticated: Auth Screen
  if (!currentUser) {
    return (
      <View style={[styles.root, isWideWeb && styles.webDesktopRoot]}>
        <View style={[styles.container, isWideWeb && styles.webAuthFrame]}>
          <AuthScreen theme={theme} onLoginSuccess={handleLoginSuccess} />
        </View>
      </View>
    );
  }

  // 3. Wide Screen / PC Layout: 2-Column Responsive Desktop Layout (Telegram Web Style)
  if (isWideWeb) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={styles.pcLayoutContainer}>
          {/* Left Column: ChatList or Profile */}
          <View style={[styles.pcLeftPane, { borderRightColor: theme.divider, backgroundColor: theme.card }]}>
            {currentScreen === 'profile' ? (
              <ProfileScreen
                user={selectedProfileUser || currentUser}
                theme={theme}
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
                onBack={() => {
                  setSelectedProfileUser(null);
                  setCurrentScreen('chats');
                }}
                onLogout={handleLogout}
                onUpdateUser={(updated) => {
                  setCurrentUser(updated);
                  if (!selectedProfileUser) {
                    setSelectedProfileUser(null);
                  }
                }}
              />
            ) : (
              <ChatListScreen
                currentUser={currentUser}
                conversations={conversations}
                stories={stories}
                theme={theme}
                activeNavTab="inbox"
                onNavTabChange={(tab) => {
                  if (tab === 'profile' || tab === 'settings') {
                    setSelectedProfileUser(null);
                    setCurrentScreen('profile');
                  }
                }}
                onSelectChat={(conv) => {
                  setActiveConversation(conv);
                }}
                onOpenNewChat={() => {}}
                onOpenMenu={() => {
                  setSelectedProfileUser(null);
                  setCurrentScreen('profile');
                }}
                onOpenSearch={() => {}}
                onOpenMyStory={() => {}}
              />
            )}
          </View>

          {/* Right Column: Chat View or Empty State */}
          <View style={[styles.pcRightPane, { backgroundColor: theme.background }]}>
            {activeConversation ? (
              <ChatScreen
                conversation={activeConversation}
                currentUser={currentUser}
                theme={theme}
                onBack={() => {
                  setActiveConversation(null);
                }}
                onOpenProfile={(user) => {
                  setSelectedProfileUser(user || null);
                  setCurrentScreen('profile');
                }}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyLogoCircle, { backgroundColor: '#2563EB' }]}>
                  <Text style={styles.emptyLogoText}>B</Text>
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>BecuGram</Text>
                <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
                  Chapdan chatni tanlang yoki xabar yozishni boshlang
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // 4. Mobile Layout: 1-Column Responsive Mobile Flow
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {currentScreen === 'chat_view' && activeConversation ? (
        <ChatScreen
          conversation={activeConversation}
          currentUser={currentUser}
          theme={theme}
          onBack={() => {
            setActiveConversation(null);
            setCurrentScreen('chats');
          }}
          onOpenProfile={(user) => {
            setSelectedProfileUser(user || null);
            setCurrentScreen('profile');
          }}
        />
      ) : currentScreen === 'profile' ? (
        <ProfileScreen
          user={selectedProfileUser || currentUser}
          theme={theme}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onBack={() => {
            setSelectedProfileUser(null);
            setCurrentScreen(activeConversation ? 'chat_view' : 'chats');
          }}
          onLogout={handleLogout}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            if (!selectedProfileUser) {
              setSelectedProfileUser(null);
            }
          }}
        />
      ) : (
        <ChatListScreen
          currentUser={currentUser}
          conversations={conversations}
          stories={stories}
          theme={theme}
          activeNavTab="inbox"
          onNavTabChange={(tab) => {
            if (tab === 'profile' || tab === 'settings') {
              setSelectedProfileUser(null);
              setCurrentScreen('profile');
            }
          }}
          onSelectChat={(conv) => {
            setActiveConversation(conv);
            setCurrentScreen('chat_view');
          }}
          onOpenNewChat={() => {}}
          onOpenMenu={() => {
            setSelectedProfileUser(null);
            setCurrentScreen('profile');
          }}
          onOpenSearch={() => {}}
          onOpenMyStory={() => {}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  webDesktopRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050908',
  },
  webAuthFrame: {
    maxWidth: 440,
    height: '100%',
    maxHeight: 700,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#15231F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  pcLayoutContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  pcLeftPane: {
    width: 380,
    maxWidth: 420,
    height: '100%',
    borderRightWidth: 1,
  },
  pcRightPane: {
    flex: 1,
    height: '100%',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyLogoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyLogoText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 18,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#8DA39A',
    marginTop: 4,
  },
  loadingFooterText: {
    fontSize: 12,
    color: '#8DA39A',
    marginTop: 14,
    letterSpacing: 0.5,
  },
});
