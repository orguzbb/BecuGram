import React, { useState } from 'react';
import {
  X,
  Star,
  Crown,
  Gem,
  Zap,
  Flame,
  Sparkles,
  Rocket,
  ShieldCheck,
  Check,
  Palette,
  Upload,
  Camera,
  MessageSquare,
  Phone,
  Share2,
  Award,
  Moon,
  CreditCard,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppearanceStore } from '../../stores/appearanceStore';
import { useToast } from '../Toast';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import { Avatar } from '../Avatar';

interface ProfileAppearanceModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const PROFILE_BADGES = [
  { id: '⭐️', label: 'Oltin Yulduz', icon: Star, color: 'text-amber-400' },
  { id: '👑', label: 'Qirollik Toji', icon: Crown, color: 'text-yellow-400' },
  { id: '💎', label: 'Brilliant', icon: Gem, color: 'text-cyan-400' },
  { id: '⚡️', label: 'Neon Chaqmoq', icon: Zap, color: 'text-violet-400' },
  { id: '🔥', label: 'Qaynoq Olov', icon: Flame, color: 'text-rose-500' },
  { id: '🚀', label: 'Kosmik Raketa', icon: Rocket, color: 'text-blue-400' },
  { id: '✨', label: 'Sehrli Nur', icon: Sparkles, color: 'text-emerald-400' },
  { id: '🛡️', label: 'Oltin Qalqon', icon: ShieldCheck, color: 'text-teal-400' },
  { id: '🌙', label: 'Yarim Oy', icon: Moon, color: 'text-indigo-400' },
  { id: '🎖️', label: 'Faxriy Medal', icon: Award, color: 'text-amber-500' },
];

export const PROFILE_BANNER_PRESETS = [
  { id: 'celestial', name: 'Celestial Purple', gradient: 'from-[#1E1B4B] via-[#0F172A] to-[#0A0F1D]', accent: '#8B5CF6' },
  { id: 'emerald', name: 'Cyber Mint', gradient: 'from-[#022C22] via-[#064E3B] to-[#0B1713]', accent: '#10B981' },
  { id: 'sapphire', name: 'Telegram Sky', gradient: 'from-[#0B1E3B] via-[#1E3A8A] to-[#0F172A]', accent: '#3390EC' },
  { id: 'imperial-gold', name: 'Imperial Gold', gradient: 'from-[#2A1608] via-[#78350F] to-[#140D05]', accent: '#F59E0B' },
  { id: 'rose-royale', name: 'Rose Royale', gradient: 'from-[#3B0724] via-[#831843] to-[#120710]', accent: '#EC4899' },
  { id: 'midnight-oled', name: 'Midnight OLED', gradient: 'from-[#090D14] via-[#212121] to-[#0F0F0F]', accent: '#0284C7' },
];

export const PROFILE_ACCENT_COLORS = [
  '#3390EC', // Telegram Blue
  '#10B981', // Becu Mint
  '#8B5CF6', // Royal Purple
  '#EC4899', // Hot Pink
  '#F59E0B', // Amber Gold
  '#F43F5E', // Ruby Rose
  '#06B6D4', // Cyan Glow
  '#6366F1', // Indigo
];

export const PROFILE_PATTERNS = [
  { id: 'stars', label: 'Yulduzlar', icon: Star },
  { id: 'crowns', label: 'Tojlar', icon: Crown },
  { id: 'diamonds', label: 'Brilliantlar', icon: Gem },
  { id: 'sparkles', label: 'Sehrli nur', icon: Sparkles },
  { id: 'flames', label: 'Olov', icon: Flame },
  { id: 'zap', label: 'Chaqmoqlar', icon: Zap },
];

export const ProfileAppearanceModal: React.FC<ProfileAppearanceModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { user, setUser } = useAuthStore();
  const { profileAppearance, setProfileAppearance } = useAppearanceStore();
  const { showToast } = useToast();

  const [mobileTab, setMobileTab] = useState<'controls' | 'preview' | 'click_pay'>('controls');

  const [selectedBadge, setSelectedBadge] = useState<string>(
    user?.premiumBadge || profileAppearance.badge || '⭐️'
  );
  const [selectedGradient, setSelectedGradient] = useState<string>(
    profileAppearance.gradient || PROFILE_BANNER_PRESETS[0].gradient
  );
  const [selectedAccent, setSelectedAccent] = useState<string>(
    profileAppearance.color || PROFILE_ACCENT_COLORS[0]
  );
  const [selectedPattern, setSelectedPattern] = useState<string>(
    user?.profilePattern || profileAppearance.pattern || 'stars'
  );
  const [coverImage, setCoverImage] = useState<string | null>(
    profileAppearance.coverImage || null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Click Payment State
  const [selectedPlan, setSelectedPlan] = useState<'1_month' | '3_months' | '1_year'>('1_month');
  const [autoRenew, setAutoRenew] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [isPayingClick, setIsPayingClick] = useState(false);

  const getPlanPrice = (plan: '1_month' | '3_months' | '1_year') => {
    switch (plan) {
      case '1_month':
        return 25000;
      case '3_months':
        return 65000;
      case '1_year':
        return 220000;
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result as string);
      showToast('Muqova rasmi yuklandi! ✨', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAppearance = async () => {
    setIsProcessing(true);
    try {
      const updatedConfig = {
        badge: selectedBadge,
        gradient: selectedGradient,
        color: selectedAccent,
        pattern: selectedPattern,
        coverImage,
      };

      setProfileAppearance(updatedConfig);

      if (user) {
        const updatedUser = {
          ...user,
          isPremium: true,
          premiumBadge: selectedBadge,
          profilePattern: selectedPattern,
          profileBackground: selectedGradient,
          profileColor: selectedAccent,
        };

        localStorage.setItem(`becugram_badge_${user._id}`, selectedBadge);
        localStorage.setItem(`becugram_pattern_${user._id}`, selectedPattern);
        localStorage.setItem(`becugram_premium_${user._id}`, 'true');

        setUser(updatedUser);

        try {
          await api.updateMe({
            bio: user.bio,
            displayName: user.displayName,
          });
        } catch {}
      }

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: [selectedAccent, '#F59E0B', '#3390EC', '#8B5CF6'],
      });

      showToast('Profil ko‘rinishi muvaffaqiyatli saqlandi! ⭐️', 'success');
      onSuccess?.();
      onClose();
    } catch {
      showToast('Sozlamalarni saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClickCheckout = async () => {
    setIsPayingClick(true);
    try {
      const amount = getPlanPrice(selectedPlan);
      await api.checkoutClickPayment({
        planId: selectedPlan,
        amount,
        autoRenew,
        cardNumberMasked: cardNumber ? `${cardNumber.slice(0, 4)} **** **** ${cardNumber.slice(-4)}` : '8600 **** **** 8888',
      });

      if (user) {
        setUser({
          ...user,
          isPremium: true,
          premiumBadge: selectedBadge,
        });
      }

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });

      showToast('Click orqali to‘lov amalga oshirildi! Premium faollashtirildi! ⭐️', 'success');
    } catch (err: any) {
      showToast(err.message || 'Click to‘lovida xatolik yuz berdi', 'error');
    } finally {
      setIsPayingClick(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in text-zinc-900 dark:text-white"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white dark:bg-[#181818] rounded-3xl border border-[#DADCE0] dark:border-[#303030] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] relative"
      >
        {/* 1. HEADER */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#3390EC] dark:bg-[#212121] text-white flex items-center justify-between shrink-0 shadow-xs border-b border-white/10 z-20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center shadow-md shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                  BecuGram Premium Studiya
                </h2>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase shrink-0">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-white/80 hidden sm:block truncate">
                Telegram Premium kabi zamonaviy, jozibali va betakror profil
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MOBILE SEGMENTED TABS SWITCHER (Visible only on <lg) */}
        <div className="lg:hidden flex items-center bg-[#F4F4F5] dark:bg-[#212121] p-1.5 border-b border-[#DADCE0] dark:border-[#303030] gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('controls')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'controls'
                ? 'bg-white dark:bg-[#2C2C2C] text-[#3390EC] dark:text-[#8774E1] shadow-xs'
                : 'text-[#707579] dark:text-[#AAAAAA]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Sozlamalar</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'preview'
                ? 'bg-white dark:bg-[#2C2C2C] text-[#3390EC] dark:text-[#8774E1] shadow-xs'
                : 'text-[#707579] dark:text-[#AAAAAA]'
            }`}
          >
            <EyeIcon className="w-3.5 h-3.5" />
            <span>Ko‘rinish</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('click_pay')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'click_pay'
                ? 'bg-[#0073FF] text-white shadow-xs'
                : 'text-[#0073FF] hover:bg-[#0073FF]/10'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Click To‘lov</span>
          </button>
        </div>

        {/* 2. BODY SPLIT (RESPONSIVE: COLUMN ON MOBILE, ROW ON DESKTOP) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* LEFT: CONTROLS & CLICK PAYMENT */}
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* CLICK TO'LOV SECTION (IF CLICK TAB ACTIVE OR EMBEDDED) */}
            {mobileTab === 'click_pay' ? (
              <div className="space-y-4 animate-fade-in">
                {/* Click Header Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#002B49] via-[#0055A5] to-[#0073FF] text-white space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center">
                        <span className="text-[#0073FF] font-black text-sm tracking-tighter">CLICK</span>
                      </div>
                      <span className="font-extrabold text-sm sm:text-base">Click Avto-to‘lov</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-black text-[10px] font-black uppercase">
                      Rasmiy Hamkor
                    </span>
                  </div>
                  <p className="text-xs text-white/90">
                    BecuGram Premium obunasini Click orqali xavfsiz va bir zumda faollashtiring.
                  </p>
                </div>

                {/* Subscription Plans */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Obuna muddatini tanlang:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: '1_month', title: '1 Oy', price: '25,000 UZS', perMonth: '25,000/oy', discount: null },
                      { id: '3_months', title: '3 Oy', price: '65,000 UZS', perMonth: '21,600/oy', discount: '-15%' },
                      { id: '1_year', title: '1 Yil', price: '220,000 UZS', perMonth: '18,300/oy', discount: '-30% VIP' },
                    ].map((plan) => {
                      const isSel = selectedPlan === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id as any)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 ${
                            isSel
                              ? 'border-[#0073FF] bg-[#0073FF]/10 dark:bg-[#0073FF]/20 shadow-md scale-[1.02]'
                              : 'border-[#DADCE0] dark:border-[#303030] hover:border-zinc-400 bg-zinc-50 dark:bg-[#212121]'
                          }`}
                        >
                          {plan.discount && (
                            <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                              {plan.discount}
                            </span>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{plan.title}</span>
                            {isSel && <CheckCircle2 className="w-4 h-4 text-[#0073FF]" />}
                          </div>
                          <span className="text-base font-black text-[#0073FF] dark:text-[#38BDF8]">
                            {plan.price}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {plan.perMonth}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Number Input & Auto-Renew Toggle */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#0073FF]" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      Click Karta ma‘lumotlari (Uzcard / Humo)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                        setCardNumber(val);
                      }}
                      placeholder="8600 0000 0000 0000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DADCE0] dark:border-[#383838] bg-white dark:bg-[#181818] text-sm font-mono tracking-wider text-zinc-900 dark:text-white outline-none focus:border-[#0073FF]"
                    />
                    <Lock className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  </div>

                  {/* Auto-renew toggle switch */}
                  <label className="flex items-center justify-between cursor-pointer pt-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">Click Avto-to‘lov</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Muddat tugagach xizmat uzluksiz yangilanadi (istalgan payt bekor qilinadi)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      className="w-4 h-4 accent-[#0073FF] cursor-pointer"
                    />
                  </label>
                </div>

                {/* Click Action Button */}
                <button
                  type="button"
                  onClick={handleClickCheckout}
                  disabled={isPayingClick}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0055A5] to-[#0073FF] hover:brightness-110 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isPayingClick
                      ? 'Click to‘lovi amalga oshirilmoqda...'
                      : `Click orqali to‘lash (${getPlanPrice(selectedPlan).toLocaleString()} UZS)`}
                  </span>
                </button>
              </div>
            ) : (
              <>
                {/* QUICK CLICK PAYMENT BANNER ON TOP OF SETTINGS */}
                <div
                  onClick={() => setMobileTab('click_pay')}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-[#002B49] via-[#0055A5] to-[#0073FF] text-white flex items-center justify-between cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                      <span className="text-[#0073FF] font-black text-xs">CLICK</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold">Click Avto-to‘lov bilan faollashtirish</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black">
                          25,000 UZS
                        </span>
                      </div>
                      <p className="text-[10px] text-white/80">
                        Oltin yulduz, Lottie reaksiyalar va cheksiz tezlikka ega bo‘ling
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold underline shrink-0">To‘lash →</span>
                </div>

                {/* FEATURE 1: STATUS BADGE (ICON) */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Status Nishoni (Badge)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Bu nishon ismingiz yonida barcha chatlarda va profilingizda jilvalanadi:
                  </p>
                  <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {PROFILE_BADGES.map((b) => {
                      const isSelected = selectedBadge === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBadge(b.id)}
                          className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#3390EC]/20 border-2 border-[#3390EC] shadow-sm scale-105'
                              : 'bg-white dark:bg-[#2C2C2C] border border-[#DADCE0] dark:border-[#383838] hover:border-zinc-400'
                          }`}
                        >
                          <span className="text-lg">{b.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FEATURE 2: COVER BANNER & GRADIENT */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#3390EC]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Profil Muqovasi (Banner)
                      </span>
                    </div>

                    <label className="text-[11px] font-semibold text-[#3390EC] dark:text-[#8774E1] hover:underline flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>Rasm yuklash</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROFILE_BANNER_PRESETS.map((p) => {
                      const isSel = selectedGradient === p.gradient;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedGradient(p.gradient);
                            setSelectedAccent(p.accent);
                            setCoverImage(null);
                          }}
                          className={`h-12 rounded-xl bg-gradient-to-r ${p.gradient} p-2 flex items-center justify-between border-2 transition-all cursor-pointer text-left ${
                            isSel ? 'border-[#3390EC] scale-[1.02] shadow-sm' : 'border-transparent'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-white drop-shadow truncate">
                            {p.name}
                          </span>
                          {isSel && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FEATURE 3: ACCENT COLOR */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                    Aksent Rangi
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PROFILE_ACCENT_COLORS.map((col) => {
                      const isSel = selectedAccent === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedAccent(col)}
                          style={{ backgroundColor: col }}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                            isSel ? 'ring-2 ring-offset-2 ring-[#3390EC] scale-110' : 'hover:scale-105'
                          }`}
                        >
                          {isSel && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: LIVE PROFILE CARD PREVIEW */}
          <div
            className={`w-full lg:w-[360px] xl:w-[400px] p-4 sm:p-6 bg-[#F4F4F5] dark:bg-[#131C26] border-t lg:border-t-0 lg:border-l border-[#DADCE0] dark:border-[#303030] flex flex-col justify-center shrink-0 overflow-y-auto ${
              mobileTab === 'controls' || mobileTab === 'click_pay' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-3 text-center">
              Jonli Profil Ko‘rinishi (Live Preview)
            </span>

            {/* THE PROFILE CARD */}
            <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] shadow-xl relative">
              {/* HERO BANNER */}
              <div
                className={`h-32 sm:h-36 relative overflow-hidden flex items-end justify-center ${
                  coverImage ? 'bg-cover bg-center' : `bg-gradient-to-r ${selectedGradient}`
                }`}
                style={coverImage ? { backgroundImage: `url("${coverImage}")` } : undefined}
              >
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='20,4 23,14 34,14 25,20 28,30 20,24 12,30 15,20 6,14 17,14' fill='%23ffffff' /%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
              </div>

              {/* AVATAR OVERLAY & NAME */}
              <div className="px-4 pb-5 pt-0 flex flex-col items-center -mt-12 relative z-10">
                <div
                  className="relative p-1 rounded-full shadow-2xl ring-4 ring-white dark:ring-[#212121]"
                  style={{ backgroundColor: selectedAccent }}
                >
                  <Avatar
                    name={user?.displayName || 'Admin'}
                    src={user?.avatar}
                    size="xl"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white dark:border-[#212121]" />
                </div>

                {/* Name & Badge */}
                <div className="flex items-center gap-1.5 mt-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                    {user?.displayName || 'Admin'}
                  </h3>
                  <span className="text-lg animate-bounce">{selectedBadge}</span>
                </div>

                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  @{user?.username || 'admin'}
                </span>

                {/* Premium Member Pill */}
                <div
                  className="mt-2 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-xs text-white"
                  style={{ backgroundColor: selectedAccent }}
                >
                  <Star className="w-3 h-3 fill-white" />
                  <span>BecuGram Premium</span>
                </div>

                {/* Bio text */}
                <p className="text-xs text-zinc-600 dark:text-zinc-300 text-center mt-2.5 px-2 line-clamp-2">
                  {user?.bio || 'BecuGram a‘zosi 🚀'}
                </p>

                {/* Action Buttons Mockup */}
                <div className="grid grid-cols-3 gap-2 w-full mt-3.5 pt-3 border-t border-[#DADCE0] dark:border-[#303030]">
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-[#2C2C2C] flex flex-col items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    <MessageSquare className="w-3.5 h-3.5 text-[#3390EC]" />
                    <span>Xabar</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-[#2C2C2C] flex flex-col items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Qo‘ng‘iroq</span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-[#2C2C2C] flex flex-col items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ulashish</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. RESPONSIVE FOOTER */}
        <div className="p-3 sm:px-6 sm:py-3.5 bg-white dark:bg-[#212121] border-t border-[#DADCE0] dark:border-[#303030] flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 z-20">
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[#707579] dark:text-[#AAAAAA]">Status:</span>
            <span className="font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1">
              {user?.isPremium ? 'Premium Faol ⭐️' : 'Oddiy a‘zo'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2C2C2C] transition-colors"
            >
              Bekor qilish
            </button>

            <button
              type="button"
              onClick={handleSaveAppearance}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isProcessing ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function EyeIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
