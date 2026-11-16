import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors } from '../theme/colors';
import { User } from '../types';
import { mobileApi, getBaseUrl, setCustomBaseUrl } from '../services/api';

interface AuthScreenProps {
  theme: ThemeColors;
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ theme, onLoginSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+998889008081');
  const [challengeId, setChallengeId] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [otpCode, setOtpCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [serverUrl, setServerUrl] = useState(getBaseUrl());
  const [showServerConfig, setShowServerConfig] = useState(false);

  // 1. Send OTP (calls POST /api/v1/auth/start)
  const handleStartAuth = async () => {
    const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
    if (cleanPhone.length < 9) {
      setErrorMsg('Iltimos, telefon raqamingizni to‘liq kiriting (+998...)');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await mobileApi.startAuth(cleanPhone);
      setChallengeId(res.challengeId);
      setDevOtp(res.devOtp);
      setStep('otp');
      if (res.devOtp) {
        setOtpCode(res.devOtp); // Auto-fill for ultra-convenient dev testing!
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Serverga ulanishda xatolik. Server ishga tushganligini tekshiring.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP (calls POST /api/v1/auth/verify)
  const handleVerifyOtp = async () => {
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('6 xonali tasdiqlash kodini to‘liq kiriting');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await mobileApi.verifyAuth(challengeId, cleanOtp);
      const token = res.accessToken || res.token || '';
      if (token) {
        await AsyncStorage.setItem('@becugram_token', token);
      }
      await AsyncStorage.setItem('@becugram_user', JSON.stringify(res.user));

      if (res.isProfileComplete && !res.isNewUser) {
        onLoginSuccess(res.user);
      } else {
        setStep('profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Tasdiqlash kodi noto‘g‘ri');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Complete Profile (Minimum 5 chars username, validation for '_')
  const handleCompleteProfile = async () => {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!displayName.trim()) {
      setErrorMsg('Ismingizni kiriting');
      return;
    }
    if (cleanUsername.length < 5) {
      setErrorMsg('Foydalanuvchi nomi kamida 5 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    if (cleanUsername.startsWith('_') || cleanUsername.endsWith('_')) {
      setErrorMsg("Foydalanuvchi nomi '_' bilan boshlanishi yoki tugashi mumkin emas");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setErrorMsg("Faqat lotin harflari, raqamlar va '_' ruxsat etiladi");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await mobileApi.completeProfile(displayName.trim(), cleanUsername);
      await AsyncStorage.setItem('@becugram_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Profilni yaratishda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contentWrapper}>
          {/* Top Logo */}
          <View style={styles.topLogoContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <Text style={[styles.appTitle, { color: theme.text }]}>BecuGram</Text>
            <Text style={[styles.appSubtitle, { color: theme.subtext }]}>
              Xavfsiz va zamonaviy mobil messenjer
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* STEP 1: Phone input */}
            {step === 'phone' && (
              <View style={styles.form}>
                <Text style={[styles.stepLabel, { color: theme.text }]}>
                  Telefon raqamingiz
                </Text>
                <Text style={[styles.stepHelp, { color: theme.subtext }]}>
                  Tasdiqlash kodi SMS yoki Telegram bot orqali yuboriladi
                </Text>

                <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <Text style={styles.flag}>🇺🇿</Text>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="+998 90 123 45 67"
                    placeholderTextColor={theme.subtext}
                    style={[styles.input, { color: theme.text }]}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  onPress={handleStartAuth}
                  disabled={isLoading}
                  style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Davom etish</Text>
                  )}
                </TouchableOpacity>

                {/* Server URL Config Link */}
                <TouchableOpacity
                  onPress={() => setShowServerConfig(!showServerConfig)}
                  style={{ marginTop: 16, alignItems: 'center' }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 11, color: theme.subtext }}>
                    Server: {serverUrl} ⚙️
                  </Text>
                </TouchableOpacity>

                {showServerConfig && (
                  <View style={{ marginTop: 10, width: '100%' }}>
                    <Text style={{ fontSize: 10, color: theme.subtext, marginBottom: 4 }}>
                      Backend server manzili (Emulyator: http://10.0.2.2:5000, Wi-Fi: http://192.168.x.x:5000)
                    </Text>
                    <TextInput
                      value={serverUrl}
                      onChangeText={(val) => {
                        setServerUrl(val);
                        setCustomBaseUrl(val);
                      }}
                      style={{
                        padding: 8,
                        fontSize: 12,
                        borderRadius: 10,
                        backgroundColor: theme.inputBackground,
                        color: theme.text,
                        borderWidth: 1,
                        borderColor: theme.inputBorder,
                      }}
                      placeholder="http://10.0.2.2:5000"
                    />
                  </View>
                )}
              </View>
            )}

            {/* STEP 2: OTP input */}
            {step === 'otp' && (
              <View style={styles.form}>
                <Text style={[styles.stepLabel, { color: theme.text }]}>Kodni kiriting</Text>
                <Text style={[styles.stepHelp, { color: theme.subtext }]}>
                  {phoneNumber} raqamiga yuborilgan 6 xonali tasdiq kodini kiriting
                </Text>

                {devOtp && (
                  <TouchableOpacity
                    onPress={() => setOtpCode(devOtp)}
                    style={styles.devOtpBadge}
                  >
                    <Ionicons name="flash" size={14} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={styles.devOtpText}>
                      Dev Kod: <Text style={{ fontWeight: 'bold' }}>{devOtp}</Text> (Bosing)
                    </Text>
                  </TouchableOpacity>
                )}

                <TextInput
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  placeholder="------"
                  placeholderTextColor={theme.subtext}
                  maxLength={6}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.primary,
                      color: theme.text,
                    },
                  ]}
                  autoFocus
                />

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                  style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Tasdiqlash</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep('phone')} style={styles.backLink}>
                  <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>
                    ← Telefon raqamni o‘zgartirish
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: Complete profile */}
            {step === 'profile' && (
              <View style={styles.form}>
                <Text style={[styles.stepLabel, { color: theme.text }]}>Profilni sozlang</Text>
                <Text style={[styles.stepHelp, { color: theme.subtext }]}>
                  Ismingiz va kamida 5 ta belgili foydalanuvchi nomini tanlang
                </Text>

                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="To‘liq ismingiz"
                  placeholderTextColor={theme.subtext}
                  style={[
                    styles.simpleInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  autoFocus
                />

                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username (masalan: abdurahim)"
                  placeholderTextColor={theme.subtext}
                  autoCapitalize="none"
                  style={[
                    styles.simpleInput,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={handleCompleteProfile}
                  disabled={isLoading}
                  style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Boshlash 🚀</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  topLogoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#2AABEE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2AABEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  form: {
    gap: 12,
  },
  stepLabel: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  stepHelp: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  devOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  devOtpText: {
    color: '#10B981',
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  otpInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginVertical: 6,
  },
  simpleInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#2AABEE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  backLink: {
    alignItems: 'center',
    marginTop: 6,
  },
});
