import React, { useState, useEffect, useRef } from 'react';
import { BecuLogo } from '../../components/BecuLogo';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/Toast';
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Smartphone,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  User as UserIcon,
  AtSign,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../../types';

export const AuthScreen: React.FC = () => {
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();

  const [step, setStep] = useState<'phone' | 'otp' | 'onboarding'>('phone');

  // Phone form state
  const [countryCode, setCountryCode] = useState('+998');
  const [phoneNumber, setPhoneNumber] = useState('88 900 80 81');
  const [isLoading, setIsLoading] = useState(false);

  // Challenge state
  const [challengeId, setChallengeId] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [authToken, setAuthToken] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // OTP inputs state (6 boxes)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Onboarding form state (Step 3)
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Handle phone submission
  const handleStartAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\s+/g, '');
    if (cleanDigits.length < 7) {
      showToast('Iltimos, telefon raqamingizni to\'liq kiriting.', 'error');
      return;
    }

    const fullNumber = `${countryCode}${cleanDigits}`;
    setFullPhone(fullNumber);
    setIsLoading(true);

    try {
      const data = await api.startAuth(fullNumber);
      setChallengeId(data.challengeId);
      setDevOtp(data.devOtp);
      setStep('otp');
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);

      showToast('SMS tasdiqlash kodi yuborildi!', 'success');

      if (data.devOtp) {
        showToast(`[Eskiz SMS]: Tasdiqlash kodi: ${data.devOtp}`, 'info');
      }

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      showToast(err.message || 'SMS yuborishda xatolik yuz berdi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean && value !== '') return;

    const newDigits = [...otpDigits];

    // Paste multiple digits
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(5, pasted.length);
      inputRefs.current[nextIndex]?.focus();
      if (newDigits.every((d) => d !== '')) {
        handleVerifyOtp(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = clean ? clean[clean.length - 1] : '';
    setOtpDigits(newDigits);

    // Auto advance to next input
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all 6 digits entered
    if (newDigits.every((d) => d !== '')) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Submit OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const finalOtp = codeToVerify || otpDigits.join('');
    if (finalOtp.length !== 6) {
      showToast('6 xonali kodni to\'liq kiriting.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyAuth(challengeId, finalOtp);
      localStorage.setItem('becugram_token', res.accessToken);
      setAuthToken(res.accessToken);

      // Check if user profile is already completed (name + username >= 5 chars)
      const user = res.user;
      const isComplete = Boolean(
        user &&
        user.isProfileComplete &&
        user.displayName &&
        user.displayName.trim().length >= 2 &&
        user.username &&
        user.username.trim().length >= 5
      );

      if (!isComplete || res.isNewUser) {
        // Needs onboarding: Prompt user for Name & Username (min 5 chars)
        setPendingUser(user);
        setDisplayName(user?.displayName || '');
        setUsername(user?.username || '');
        setBio(user?.bio || '');
        setAvatarUrl(user?.avatar || '');
        setStep('onboarding');
        showToast('Iltimos, ismingiz va foydalanuvchi nomingizni kiriting.', 'info');
      } else {
        // Existing user with complete profile -> enter app directly
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        showToast('BecuGram tizimiga xush kelibsiz!', 'success');
        setAuth(user, res.accessToken);
      }
    } catch (err: any) {
      showToast(err.message || 'Kiritilgan tasdiqlash kodi noto\'g\'ri.', 'error');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Avatar Upload Handler for Onboarding
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const res = await api.uploadFile(file);
      setAvatarUrl(res.url);
      showToast('Profil rasmi yuklandi!', 'success');
    } catch {
      // Fallback to base64 preview
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
        showToast('Profil rasmi saqlandi!', 'success');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Clean username helper
  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
  const isUsernameValid = cleanUsername.length >= 5 && /^[a-z0-9_]{5,30}$/.test(cleanUsername);
  const isNameValid = displayName.trim().length >= 2;

  // Submit Profile Onboarding
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      showToast('Ism va familiyangizni kiriting (kamida 2 ta belgi).', 'error');
      return;
    }
    if (!isUsernameValid) {
      showToast('Foydalanuvchi nomi kamida 5 ta harf yoki raqamdan iborat bo\'lishi shart!', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.completeProfile({
        displayName: displayName.trim(),
        username: cleanUsername,
        bio: bio.trim(),
        avatar: avatarUrl || undefined,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast('Profilingiz muvaffaqiyatli yaratildi!', 'success');
      setAuth(res.user, authToken);
    } catch (err: any) {
      showToast(err.message || 'Profilni yaratishda xatolik yuz berdi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#F8FAF7] dark:bg-[#080E0C] text-[#172923] dark:text-[#EDF4F1] p-4 transition-colors duration-300 select-none overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-pink-500/15 blur-[130px] pointer-events-none rounded-full" />

      {/* Main Glassmorphic Card */}
      <div className="relative w-full max-w-[440px] rounded-3xl bg-white dark:bg-[#0E1715] border border-zinc-200 dark:border-[#20362E] shadow-2xl p-7 sm:p-8 backdrop-blur-xl z-10 transition-all">

        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 hover:scale-105 transition-transform">
            <BecuLogo size={56} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mb-1">
            {step === 'onboarding' ? 'Profilingizni yarating' : 'Welcome to BecuGram'}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-cyan-400">
            {step === 'onboarding' ? 'Shaxsiy ma\'lumotlaringizni kiriting' : 'Connect. Communicate. Belong.'}
          </p>
        </div>

        {/* STEP 1: PHONE NUMBER INPUT */}
        {step === 'phone' && (
          <form onSubmit={handleStartAuth} className="space-y-5 animate-fade-in">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-[#8DA39A] block mb-2">
                Telefon raqamingiz
              </label>

              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] focus-within:border-emerald-500 dark:focus-within:border-cyan-500 transition-all">
                {/* Country Pill */}
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1A2E26] text-xs font-bold text-zinc-800 dark:text-white shadow-sm shrink-0">
                  <span>🇺🇿</span>
                  <span>(+998)</span>
                </div>

                {/* Phone Input */}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="90 123 45 67"
                  className="w-full bg-transparent text-sm font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#5D736A] outline-none px-2"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#087F65] via-[#12A082] to-[#35CBA0] hover:from-[#066B55] hover:to-[#2BB58E] text-white font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>SMS yuborilmoqda...</span>
                </>
              ) : (
                <span>Davom etish (Continue)</span>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-center text-[11px] text-zinc-500 dark:text-[#8DA39A] pt-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-cyan-400 shrink-0" />
              <span>Tasdiqlash kodi SMS orqali yuboriladi</span>
            </div>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP INPUT */}
        {step === 'otp' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-[#8DA39A] hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Raqamni o'zgartirish</span>
              </button>
              <span className="text-xs font-bold text-emerald-600 dark:text-cyan-400 font-mono">
                {fullPhone}
              </span>
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                SMS tasdiqlash kodini kiriting
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#8DA39A]">
                Telefoningizga yuborilgan 6 xonali kodni yozing
              </p>
            </div>

            {/* 6 Digit Input Boxes */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 sm:w-12 h-14 rounded-2xl text-center text-xl font-black bg-zinc-100 dark:bg-[#14231E] border transition-all outline-none ${
                    digit
                      ? 'border-emerald-500 dark:border-cyan-400 text-zinc-900 dark:text-white ring-2 ring-emerald-500/20 dark:ring-cyan-400/20'
                      : 'border-zinc-200 dark:border-[#20362E] text-zinc-900 dark:text-white focus:border-emerald-500 dark:focus:border-cyan-400'
                  }`}
                />
              ))}
            </div>

            {/* Dev helper code prefill notification */}
            {devOtp && (
              <div
                onClick={() => {
                  const digits = devOtp.split('');
                  setOtpDigits(digits);
                  handleVerifyOtp(devOtp);
                }}
                className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center cursor-pointer hover:bg-cyan-500/20 transition-colors"
              >
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                  Avto-kod: <strong className="underline tracking-widest">{devOtp}</strong> (bosing)
                </span>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isLoading || otpDigits.some((d) => d === '')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <span>Tasdiqlash (Verify)</span>
              )}
            </button>

            {/* Resend Countdown */}
            <div className="text-center">
              {resendTimer > 0 ? (
                <span className="text-xs text-zinc-500 dark:text-[#8DA39A]">
                  Kodni qayta yuborish:{' '}
                  <strong className="text-zinc-800 dark:text-white font-mono">0:{resendTimer.toString().padStart(2, '0')}</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleStartAuth}
                  disabled={isLoading}
                  className="text-xs font-bold text-emerald-600 dark:text-cyan-400 hover:underline"
                >
                  Kodni qayta yuborish
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: ONBOARDING — PROFILE SETUP (MANDATORY NAME & MIN 5-CHAR USERNAME) */}
        {step === 'onboarding' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4 animate-fade-in">
            {/* Avatar Selector */}
            <div className="flex flex-col items-center mb-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="relative group w-20 h-20 rounded-full bg-zinc-100 dark:bg-[#15231F] border-2 border-dashed border-emerald-500/40 dark:border-cyan-400/40 flex items-center justify-center cursor-pointer overflow-hidden hover:border-emerald-500 transition-colors shadow-inner"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-zinc-400 dark:text-[#8DA39A]">
                    <Camera className="w-6 h-6 mb-0.5 group-hover:scale-110 transition-transform text-emerald-600 dark:text-cyan-400" />
                    <span className="text-[10px] font-semibold">Rasm</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                  O'zgartirish
                </div>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-[#8DA39A] mt-1.5">
                Profil rasmi (ixtiyoriy)
              </span>
            </div>

            {/* Display Name Input */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-cyan-400" />
                Ism va Familiya <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center bg-zinc-100 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] rounded-2xl px-3.5 py-2.5 focus-within:border-emerald-500 transition-colors">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Masalan: Abdurahim"
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#5D736A] outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Username Input with live validation (min 5 chars) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-emerald-600 dark:text-cyan-400" />
                  Foydalanuvchi nomi <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cleanUsername.length >= 5
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {cleanUsername.length}/5 belgi (kamida 5 ta)
                </span>
              </div>

              <div
                className={`flex items-center bg-zinc-100 dark:bg-[#14231E] border rounded-2xl px-3.5 py-2.5 transition-colors ${
                  cleanUsername.length > 0 && !isUsernameValid
                    ? 'border-rose-500/60'
                    : cleanUsername.length >= 5
                    ? 'border-emerald-500'
                    : 'border-zinc-200 dark:border-[#20362E]'
                }`}
              >
                <span className="text-emerald-600 dark:text-cyan-400 font-bold text-sm mr-1">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="abdurahim_dev"
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#5D736A] outline-none"
                  required
                />
                {isUsernameValid ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : cleanUsername.length > 0 ? (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : null}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-[#8DA39A] mt-1 pl-1">
                Lotin harflari (a-z), raqamlar va pastki chiziq (_) ruxsat etiladi.
              </p>
            </div>

            {/* Bio Input (Optional) */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Bio / O'zingiz haqingizda (ixtiyoriy)
              </label>
              <div className="bg-zinc-100 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] rounded-2xl px-3.5 py-2.5 focus-within:border-emerald-500 transition-colors">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="UI/UX Designer & Tech Enthusiast 🚀"
                  rows={2}
                  className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#5D736A] outline-none resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isNameValid || !isUsernameValid}
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#087F65] via-[#12A082] to-[#35CBA0] hover:from-[#066B55] hover:to-[#2BB58E] text-white font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Profil saqlanmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>BecuGram ga kirish</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
