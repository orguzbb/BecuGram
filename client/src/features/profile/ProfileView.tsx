import React, { useState, useRef } from 'react';
import {
  Edit3,
  AtSign,
  Hash,
  Copy,
  Image as ImageIcon,
  FileText,
  Phone,
  ArrowLeft,
  Camera,
  Plus,
  Star,
  Sparkles,
  Palette,
  Sun,
  Moon,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppearanceStore } from '../../stores/appearanceStore';
import { useThemeStore, DESIGN_THEMES, DesignStyleId } from '../../stores/themeStore';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { ProfilePatternBackground } from '../../components/ProfilePatternBackground';
import { PremiumModal } from '../../components/PremiumModal';

interface ProfileViewProps {
  onBack?: () => void;
  onOpenEditProfile: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack, onOpenEditProfile }) => {
  const { user, setUser } = useAuthStore();
  const { profileAppearance } = useAppearanceStore();
  const { theme, toggleTheme, designStyle, setDesignStyle } = useThemeStore();
  const { showToast } = useToast();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A';
  const username = user?.username || 'Abdurahim';
  const cleanUsername = username.startsWith('@') ? username : `@${username}`;
  const userId = user?.phoneNumber ? user.phoneNumber.replace(/\D/g, '').slice(-4) : '1778';
  const phone = user?.phoneNumber || '+998889008081';

  const isPremium = Boolean(user?.isPremium || profileAppearance.badge);
  const badgeIcon = user?.premiumBadge || profileAppearance.badge || '⭐️';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} nusxalandi!`, 'success');
  };

  const hasValidAvatar = Boolean(user?.avatar && user.avatar.trim() !== '');

  const handleDirectAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Avatar yuklanmoqda...', 'info');
      const uploadRes = await api.uploadFile(file);
      const updatedUser = await api.updateMe({ avatar: uploadRes.url });
      setUser(updatedUser);
      showToast('Avatar muvaffaqiyatli o\'rnatildi! ✨', 'success');
    } catch (err: any) {
      showToast(err.message || 'Avatar yuklashda xatolik yuz berdi.', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F4F5] dark:bg-[#0F0F0F] select-none text-zinc-900 dark:text-white overflow-y-auto pb-44 transition-colors">
      
      {/* 1. TOP HEADER: Telegram Web A Action Bar with Quick Theme Toggle */}
      <div className="h-14 flex items-center justify-between px-4 bg-white dark:bg-[#212121] text-zinc-900 dark:text-white shrink-0 border-b border-[#DADCE0] dark:border-[#303030] sticky top-0 z-20 transition-colors">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
              title="Orqaga"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
            </button>
          )}
          <h1 className="text-[16px] font-medium tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
            Mening profilim
            {isPremium && (
              <span className="text-sm select-none" title="BecuGram VIP">
                {badgeIcon}
              </span>
            )}
          </h1>
        </div>

        {/* Header Right Actions: Dark/Light Mode Switcher & Edit Profile */}
        <div className="flex items-center gap-1">
          {/* Quick 1-Tap Dark/Light Switcher */}
          <button
            onClick={() => {
              toggleTheme();
              showToast(theme === 'dark' ? "Yorug' rejim (Light) yoqildi ☀️" : "Tungi rejim (Dark) yoqildi 🌙", 'info');
            }}
            className="w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title={theme === 'dark' ? "Yorug' rejimga o'tish" : "Tungi rejimga o'tish"}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 stroke-[2]" />
            ) : (
              <Moon className="w-5 h-5 text-[#707579] stroke-[2]" />
            )}
          </button>

          {/* Edit Profile Button */}
          <button
            onClick={onOpenEditProfile}
            className="w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            title="Profilni tahrirlash"
          >
            <Edit3 className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* 2. COVER BANNER (Full-width with VIP pattern) */}
      <div className={`relative w-full h-36 sm:h-44 overflow-hidden shrink-0 shadow-inner ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-[#181818] via-[#212121] to-[#2A2A2A]'
          : 'bg-gradient-to-r from-[#3390EC] via-[#4FA3F0] to-[#6BB5F4]'
      }`}>
        <ProfilePatternBackground
          pattern={user?.profilePattern || profileAppearance.pattern || 'stars'}
          isPremium={true}
          gradient={user?.profileBackground || (theme === 'dark' ? 'from-[#181818] via-[#212121] to-[#2A2A2A]' : 'from-[#3390EC] via-[#4FA3F0] to-[#6BB5F4]')}
          coverImage={profileAppearance.coverImage}
        />

        {/* Change Banner & VIP Appearance Button */}
        <button
          onClick={() => setShowPremiumModal(true)}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all z-10 cursor-pointer"
          title="VIP Fon & Bannerni sozlash"
        >
          <Palette className="w-3.5 h-3.5 text-amber-300" />
          <span>VIP Fon & Banner</span>
        </button>
      </div>

      {/* 3. HERO AVATAR & NAME IDENTITY CARD (Clean Unclipped Telegram Centered Hero) */}
      <div className="relative px-4 pb-4 pt-0 -mt-14 sm:-mt-16 z-20 flex flex-col items-center text-center">
        {/* Large Avatar Circle with Camera badge and VIP Star */}
        <div className="relative group">
          {hasValidAvatar ? (
            <img
              src={user?.avatar}
              alt={user?.displayName || 'Profil'}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-2xl ring-4 ring-white dark:ring-[#212121] bg-white dark:bg-[#212121]"
            />
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#E06D53] dark:bg-[#8774E1] text-white text-5xl font-extrabold flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-[#212121] select-none">
              {initial}
            </div>
          )}

          {/* Quick Change Camera Overlay / Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Rasmni almashtirish"
          >
            <Camera className="w-7 h-7 mb-0.5" />
            <span className="text-[10px] font-bold">O'zgartirish</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleDirectAvatarUpload}
            className="hidden"
          />

          {/* Small Camera badge button at bottom-left */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 left-0 w-8 h-8 rounded-full bg-[#3390EC] dark:bg-[#8774E1] text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-transform active:scale-90 border-2 border-white dark:border-[#212121] cursor-pointer"
            title="Rasm yuklash"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Green Online Dot Indicator */}
          <span className="absolute bottom-1.5 right-1 w-6 h-6 rounded-full bg-[#00C73E] border-3 border-white dark:border-[#212121] shadow-md animate-pulse" />

          {/* VIP Badge Anchored on Avatar */}
          {isPremium && (
            <div
              onClick={() => setShowPremiumModal(true)}
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-[#212121] cursor-pointer hover:scale-110 active:scale-90 transition-transform"
              title="BecuGram VIP Status"
            >
              <span className="text-base leading-none select-none drop-shadow">{badgeIcon}</span>
            </div>
          )}
        </div>

        {/* Display Name with Sparkle & VIP Icon */}
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            {user?.displayName || 'Abdurahim'}
          </h2>
          {isPremium && (
            <span
              onClick={() => setShowPremiumModal(true)}
              className="text-xl select-none cursor-pointer animate-bounce hover:scale-125 transition-transform"
              title="BecuGram VIP a'zosi"
            >
              {badgeIcon}
            </span>
          )}
        </div>

        {/* Clean Username & Online Status */}
        <p className="text-xs sm:text-sm font-semibold text-[#707579] dark:text-[#AAAAAA] mt-0.5">
          {cleanUsername}
        </p>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00C73E] animate-ping" />
          <span className="text-xs font-semibold text-[#00C73E]">
            onlayn • BecuGram a'zosi
          </span>
        </div>

        {/* Premium Badges & Appearance Action Pills */}
        <div className="flex items-center gap-2 mt-3.5 flex-wrap justify-center">
          <button
            onClick={() => setShowPremiumModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-purple-400/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{isPremium ? "BecuGram VIP Faol" : "VIP Premium olish"}</span>
          </button>

          <button
            onClick={() => setShowPremiumModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#3390EC]/10 border border-[#3390EC]/30 text-[#3390EC] dark:text-[#8774E1] text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#3390EC]/20 active:scale-95 transition-all"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Profil ko‘rinishi & Banner</span>
          </button>
        </div>
      </div>

      {/* 4. UI MODELLAR & MAVZULAR: 1-Tap Theme Switcher */}
      <div className="mx-4 mb-4 p-4 rounded-2xl bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#3390EC] dark:text-[#8774E1]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#AAAAAA]">
              UI Modellar & Rang Mavzulari
            </h3>
          </div>
          <span className="text-[11px] text-[#707579] dark:text-[#AAAAAA]">
            1-bosish bilan o'zgartiring
          </span>
        </div>

        {/* 5 Theme Preset Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DESIGN_THEMES.map((t) => {
            const isSelected = designStyle === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setDesignStyle(t.id);
                  showToast(`${t.nameUz} mavzusi faollashtirildi! ✨`, 'success');
                }}
                className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#3390EC] dark:border-[#8774E1] bg-blue-50/50 dark:bg-purple-500/10 shadow-sm scale-102 ring-2 ring-[#3390EC]/30'
                    : 'border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-[#181818] hover:bg-zinc-100 dark:hover:bg-[#262626]'
                }`}
              >
                <div
                  className={`w-10 h-7 rounded-xl bg-gradient-to-r ${t.previewGradient} shadow-xs flex items-center justify-center mb-1.5 relative`}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 text-white drop-shadow stroke-[3]" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate w-full text-center">
                  {t.nameUz}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. USER DETAILS CARDS: Phone, Username, Bio, ID */}
      <div className="mx-4 bg-white dark:bg-[#212121] rounded-2xl border border-[#DADCE0] dark:border-[#303030] shadow-sm overflow-hidden divide-y divide-[#DADCE0] dark:divide-[#303030]">
        
        {/* Card 1: Telefon raqami */}
        <div
          onClick={() => copyToClipboard(phone, 'Telefon raqami')}
          className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] transition-colors"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#3390EC]/10 text-[#3390EC] dark:bg-[#8774E1]/15 dark:text-[#8774E1] flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white block truncate">
              {phone}
            </span>
            <span className="text-xs text-[#707579] dark:text-[#AAAAAA] block truncate">
              Telefon raqami, nusxalash uchun bosing
            </span>
          </div>
          <Copy className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA] shrink-0" />
        </div>

        {/* Card 2: @Username */}
        <div
          onClick={() => copyToClipboard(cleanUsername, 'Foydalanuvchi nomi')}
          className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] transition-colors"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#3390EC]/10 text-[#3390EC] dark:bg-[#8774E1]/15 dark:text-[#8774E1] flex items-center justify-center shrink-0">
            <AtSign className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white block truncate">
              {cleanUsername}
            </span>
            <span className="text-xs text-[#707579] dark:text-[#AAAAAA] block truncate">
              Foydalanuvchi nomi, nusxalash uchun bosing
            </span>
          </div>
          <Copy className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA] shrink-0" />
        </div>

        {/* Card 3: Bio (Ma'lumot) */}
        <div
          onClick={() => {
            if (user?.bio) {
              copyToClipboard(user.bio, 'Bio');
            } else {
              onOpenEditProfile();
            }
          }}
          className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] transition-colors"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#3390EC]/10 text-[#3390EC] dark:bg-[#8774E1]/15 dark:text-[#8774E1] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            {user?.bio ? (
              <>
                <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white block break-words">
                  {user.bio}
                </span>
                <span className="text-xs text-[#707579] dark:text-[#AAAAAA] block mt-0.5">
                  Bio (ma'lumot), nusxalash uchun bosing
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold text-sm text-[#3390EC] dark:text-[#8774E1] block flex items-center gap-1">
                  <Plus className="w-4 h-4 inline" /> Bio qo'shish...
                </span>
                <span className="text-xs text-[#707579] dark:text-[#AAAAAA] block mt-0.5">
                  O'zingiz haqingizda bir necha so'z yozing
                </span>
              </>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenEditProfile();
            }}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-[#3390EC] dark:hover:text-[#8774E1] shrink-0"
            title="Bio tahrirlash"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Card 4: #ID */}
        <div
          onClick={() => copyToClipboard(userId, 'ID')}
          className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] transition-colors"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#3390EC]/10 text-[#3390EC] dark:bg-[#8774E1]/15 dark:text-[#8774E1] flex items-center justify-center shrink-0">
            <Hash className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white block truncate">
              {userId}
            </span>
            <span className="text-xs text-[#707579] dark:text-[#AAAAAA] block truncate">
              ID raqami, nusxalash uchun bosing
            </span>
          </div>
          <Copy className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA] shrink-0" />
        </div>
      </div>

      {/* 6. PROFILNI TAHRIRLASH ACTION BUTTON */}
      <div className="mx-4 mt-4">
        <button
          onClick={onOpenEditProfile}
          className="w-full py-3.5 px-5 bg-[#3390EC] dark:bg-[#8774E1] hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Edit3 className="w-4 h-4 stroke-[2.5]" />
          <span>Profilni tahrirlash</span>
        </button>
      </div>

      {/* 7. POSTLAR ACTIVITY CARD */}
      <div className="mx-4 mt-4 p-6 text-center bg-white dark:bg-[#212121] rounded-2xl border border-[#DADCE0] dark:border-[#303030] shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#3390EC]/10 text-[#3390EC] dark:bg-[#8774E1]/15 dark:text-[#8774E1] flex items-center justify-center mb-2 shadow-xs">
            <ImageIcon className="w-6 h-6 stroke-[2]" />
          </div>
          <p className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">
            Hozircha postlar yo‘q
          </p>
          <p className="text-xs text-[#707579] dark:text-[#AAAAAA] max-w-xs">
            Yangi rasmlar yoki fikrlaringizni kanalingiz orqali do‘stlaringiz bilan ulashing.
          </p>
        </div>
      </div>

      {/* Profile Appearance Modal */}
      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}
    </div>
  );
};
