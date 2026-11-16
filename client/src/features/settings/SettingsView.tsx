import React, { useState } from 'react';
import {
  User as UserIcon,
  Users,
  Eye,
  Laptop,
  Key,
  HardDrive,
  Languages,
  ShieldCheck,
  Palette,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Check,
  CheckCircle2,
  Trash2,
  X,
  ArrowLeft,
  Folder,
  Star,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useToast } from '../../components/Toast';
import { PremiumModal } from '../../components/PremiumModal';
import { ChatBackgroundGalleryModal } from '../../components/chat-background/ChatBackgroundGalleryModal';

interface SettingsViewProps {
  onBack?: () => void;
  onOpenEditProfile?: () => void;
  onOpenAdmin?: () => void;
  onOpenContacts?: () => void;
  onOpenFolders?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  onOpenEditProfile,
  onOpenAdmin,
  onOpenContacts,
  onOpenFolders,
}) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, accentColor, setAccentColor } = useThemeStore();
  const { showToast } = useToast();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showWallpaperGallery, setShowWallpaperGallery] = useState(false);

  const userPhone = user?.phoneNumber || '+998889008081';

  // Active sub-modal states for "imagedan better qil"
  const [activeModal, setActiveModal] = useState<
    'none' | 'sessions' | 'security' | 'storage' | 'language' | 'privacy' | 'appearance'
  >('none');

  const [language, setLanguage] = useState<'O‘zbekcha' | 'English' | 'Русский'>('O‘zbekcha');
  const [twoStepPin, setTwoStepPin] = useState<string>(() => {
    return localStorage.getItem(`becugram_2step_pin_${userPhone}`) || '';
  });
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('becugram_animations') !== 'disabled';
  });

  const toggleAnimations = () => {
    const next = !animationsEnabled;
    setAnimationsEnabled(next);
    if (next) {
      document.documentElement.classList.remove('no-animations');
      localStorage.setItem('becugram_animations', 'enabled');
      showToast('Animatsiyalar yoqildi ✨', 'success');
    } else {
      document.documentElement.classList.add('no-animations');
      localStorage.setItem('becugram_animations', 'disabled');
      showToast("Animatsiyalar o'chirildi", 'info');
    }
  };

  const handleSavePin = () => {
    if (!pinInput.trim() || pinInput.length < 4) {
      showToast('PIN kod kamida 4 xonali bo‘lishi kerak.', 'error');
      return;
    }
    localStorage.setItem(`becugram_2step_pin_${userPhone}`, pinInput.trim());
    setTwoStepPin(pinInput.trim());
    setIsEditingPin(false);
    setPinInput('');
    showToast('Ikki bosqichli PIN kod o‘rnatildi! 🔐', 'success');
  };

  const handleRemovePin = () => {
    localStorage.removeItem(`becugram_2step_pin_${userPhone}`);
    setTwoStepPin('');
    setIsEditingPin(false);
    setPinInput('');
    showToast('Ikki bosqichli PIN kod o‘chirildi.', 'info');
  };

  const [autoMediaDownload, setAutoMediaDownload] = useState(true);
  const [cacheSize, setCacheSize] = useState('14.2 MB');

  const accentColors = [
    { name: 'Siyohrang (Purple)', hex: '#4F46E5' },
    { name: 'To‘q sariq (Amber)', hex: '#9D5215' },
    { name: 'Zumrad (Emerald)', hex: '#087F65' },
    { name: 'Moviy (Blue)', hex: '#0284C7' },
    { name: 'Pushti (Magenta)', hex: '#EC4899' },
    { name: 'Koral (Rose)', hex: '#F43F5E' },
  ];

  const isAdmin = user?.role === 'admin' || user?.phoneNumber === '+998889008081';

  const hasValidUserAvatar = Boolean(
    user?.avatar &&
    user.avatar.trim() !== '' &&
    !user.avatar.includes('1794151183673')
  );

  const handleClearCache = () => {
    setCacheSize('0.0 KB');
    showToast('Kesh tozalandi: Xotira bo‘shatildi!', 'success');
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F4F5] dark:bg-[#0F0F0F] select-none text-zinc-900 dark:text-white overflow-y-auto pb-24 transition-colors">
      {/* 1. TELEGRAM WEB A ACTION BAR */}
      <div className="h-14 px-3 sm:px-4 bg-white dark:bg-[#212121] text-zinc-900 dark:text-white flex items-center justify-between z-20 shrink-0 border-b border-[#DADCE0] dark:border-[#303030] sticky top-0 transition-colors">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors cursor-pointer"
              title="Orqaga"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2]" />
            </button>
          )}
          <h1 className="text-[16px] font-medium tracking-tight text-zinc-900 dark:text-white">
            Sozlamalar
          </h1>
        </div>
      </div>

      {/* 2. TELEGRAM WEB A PROFILE HERO */}
      <div
        onClick={onOpenEditProfile}
        className="px-4 py-5 bg-white dark:bg-[#212121] border-b border-[#DADCE0] dark:border-[#303030] cursor-pointer group transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              name={user?.displayName || 'Abdurahim'}
              src={hasValidUserAvatar ? user?.avatar : undefined}
              size="xl"
              className="!w-16 !h-16"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-white truncate">
              {user?.displayName || 'Abdurahim'}
            </h2>
            <p className="text-sm font-medium text-[#3390EC] dark:text-[#8774E1]">
              {userPhone}
            </p>
            <p className="text-xs text-[#707579] dark:text-[#AAAAAA] truncate mt-0.5">
              @{user?.username || 'Abdurahim'} &bull; {user?.bio || 'Bio kiritilmagan'}
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-[#707579] dark:text-[#AAAAAA] group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 3. HISOB (ACCOUNT) SECTION */}
      <div className="mt-3 bg-white dark:bg-[#212121] border-y border-[#DADCE0] dark:border-[#303030]">
        <div className="px-4 pt-3 pb-1 text-[12px] font-semibold text-[#3390EC] dark:text-[#8774E1] uppercase tracking-wider">
          Hisob
        </div>
        <div className="divide-y divide-[#DADCE0]/50 dark:divide-[#303030]/50">
          <div
            onClick={onOpenEditProfile}
            className="px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-white block truncate">
              {userPhone}
            </span>
            <span className="text-xs text-[#707579] dark:text-[#AAAAAA]">
              Telefon raqamini o‘zgartirish uchun bosing
            </span>
          </div>

          <div
            onClick={onOpenEditProfile}
            className="px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-white block truncate">
              @{user?.username || 'Abdurahim'}
            </span>
            <span className="text-xs text-[#707579] dark:text-[#AAAAAA]">
              Foydalanuvchi nomi
            </span>
          </div>

          <div
            onClick={onOpenEditProfile}
            className="px-4 py-3 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-white block truncate">
              {user?.bio || 'O‘zingiz haqingizda bir necha so‘z yozing'}
            </span>
            <span className="text-xs text-[#707579] dark:text-[#AAAAAA]">
              Bio
            </span>
          </div>
        </div>
      </div>

      {/* ⭐️ BecuGram Premium Section */}
      <div
        onClick={() => setShowPremiumModal(true)}
        className="mt-3 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-transparent border-y border-purple-500/30 p-4 flex items-center justify-between cursor-pointer hover:bg-purple-900/40 transition-colors shadow-xs"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Star className="w-5 h-5 fill-white stroke-0" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900 dark:text-white">
              <span>BecuGram Premium</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-black">
                25 000 so'm
              </span>
            </div>
            <span className="text-xs text-zinc-500 dark:text-purple-300">
              {user?.isPremium ? "Obuna faol • Sozlash uchun bosing" : "Profil foni, status ikonkalari va cheksiz tezlik"}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-purple-400" />
      </div>

      {/* 4. SOZLAMALAR SECTION */}
      <div className="mt-3 bg-white dark:bg-[#212121] border-y border-[#DADCE0] dark:border-[#303030]">
        <div className="px-4 pt-3 pb-1 text-[12px] font-semibold text-[#3390EC] dark:text-[#8774E1] uppercase tracking-wider">
          Sozlamalar
        </div>
        <div className="divide-y divide-[#DADCE0]/50 dark:divide-[#303030]/50">
          {/* Chat orqa foni va mavzular */}
          <div
            onClick={() => setShowWallpaperGallery(true)}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <Palette className="w-5 h-5 text-[#3390EC] dark:text-[#8774E1]" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Chat orqa foni va mavzular
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#3390EC] dark:text-[#8774E1] font-medium">Galereya &rsaquo;</span>
              <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
            </div>
          </div>

          {/* Chat jildlari */}
          <div
            onClick={onOpenFolders}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <Folder className="w-5 h-5 text-[#3390EC] dark:text-[#8774E1]" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Chat jildlari
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
          </div>

          {/* Maxfiylik va xavfsizlik */}
          <div
            onClick={() => setActiveModal('privacy')}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <Eye className="w-5 h-5 text-[#3390EC] dark:text-[#8774E1]" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Maxfiylik va xavfsizlik
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
          </div>

          {/* Qurilmalar va seanslar */}
          <div
            onClick={() => setActiveModal('sessions')}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <Laptop className="w-5 h-5 text-[#3390EC] dark:text-[#8774E1]" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Qurilmalar va seanslar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-500">1 faol</span>
              <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
            </div>
          </div>

          {/* Ikki bosqichli tasdiqlash */}
          <div
            onClick={() => setActiveModal('security')}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <Key className="w-5 h-5 text-[#3390EC] dark:text-[#8774E1]" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Ikki bosqichli tasdiqlash
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#707579] dark:text-[#AAAAAA]">
                {twoStepPin ? 'Yoqilgan' : 'O‘chirilgan'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
            </div>
          </div>

          {/* Ma‘lumotlar va xotira */}
          <div
            onClick={() => setActiveModal('storage')}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <HardDrive className="w-5 h-5 text-[#3390EC] dark:text-[#8774E1]" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Ma‘lumotlar va xotira
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#707579] dark:text-[#AAAAAA] font-mono">{cacheSize}</span>
              <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
            </div>
          </div>

          {/* Til */}
          <div
            onClick={() => setActiveModal('language')}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <Languages className="w-5 h-5 text-[#3390EC] dark:text-[#8774E1]" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                Til
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#3390EC] dark:text-[#8774E1]">{language}</span>
              <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. YORDAM (SUPPORT) SECTION */}
      <div className="mt-3 bg-white dark:bg-[#212121] border-y border-[#DADCE0] dark:border-[#303030]">
        <div className="px-4 pt-3 pb-1 text-[12px] font-semibold text-[#3390EC] dark:text-[#8774E1] uppercase tracking-wider">
          Yordam
        </div>
        <div className="divide-y divide-[#DADCE0]/50 dark:divide-[#303030]/50">
          <div
            onClick={() => showToast('Telegram qo‘llab-quvvatlash xizmati', 'info')}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              Savol berish
            </span>
            <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
          </div>

          <div
            onClick={() => showToast('Telegram tez-tez so‘raladigan savollar', 'info')}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] cursor-pointer transition-colors"
          >
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              Telegram FAQ
            </span>
            <ChevronRight className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
          </div>

          {/* SUPER ADMIN (Exclusive for admin) */}
          {isAdmin && onOpenAdmin && (
            <div
              onClick={onOpenAdmin}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-5 h-5 stroke-[2.2] text-rose-500" />
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  Super Admin Paneli
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-500" />
            </div>
          )}

          {/* Chiqish (Log out) */}
          <div
            onClick={() => {
              logout();
              showToast('Tizimdan chiqildi', 'info');
            }}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <LogOut className="w-5 h-5 stroke-[2] text-rose-500" />
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                Chiqish
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SUB-MODALS ("IMAGEDAN BETTER QIL") ==================== */}

      {/* 1. FAOL SEANSLAR MODALI */}
      {activeModal === 'sessions' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#14231E] rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-[#20362E] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-[#9D5215]" />
                Faol seanslar
              </h3>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Ushbu qurilma (Windows PC)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  Faol
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-[#8DA39A]">
                BecuGram Web &bull; O‘zbekiston, Toshkent &bull; IP: 192.168.1.110
              </p>
            </div>
            <button
              onClick={() => {
                showToast('Barcha boshqa seanslar yakunlandi!', 'success');
                setActiveModal('none');
              }}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1A2E26] text-xs font-bold text-zinc-800 dark:text-white transition-colors"
            >
              Boshqa seanslarni yakunlash
            </button>
          </div>
        </div>
      )}

      {/* 2. XOTIRA VA KESH MODALI */}
      {activeModal === 'storage' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#14231E] rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-[#20362E] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#9D5215]" />
                Xotira sozlamalari
              </h3>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-[#182C25] mb-4 text-center">
              <span className="text-xs text-zinc-500 dark:text-[#8DA39A] block mb-1">
                Band qilingan kesh hajmi
              </span>
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                {cacheSize}
              </span>
            </div>
            <button
              onClick={handleClearCache}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 active:scale-95 transition-all mb-2"
            >
              <Trash2 className="w-4 h-4" />
              Keshni tozalash
            </button>
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#1A2E26]">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Rasmlarni avtomatik yuklash
              </span>
              <input
                type="checkbox"
                checked={autoMediaDownload}
                onChange={(e) => setAutoMediaDownload(e.target.checked)}
                className="accent-[#9D5215] w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. TILNI TANLASH MODALI (Faqat O'zbekcha) */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white dark:bg-[#14231E] rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-[#20362E] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-600" />
                Ilova tili
              </h3>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div
                className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-blue-900 dark:text-blue-100 font-semibold"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇺🇿</span>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white">O‘zbekcha</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Asosiy tizim tili</div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-[#0E1715] rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                ✨ BecuGram to‘liq o‘zbek tiliga moslashtirilgan. Barcha bo‘limlar, bildirishnomalar va sozlamalar ona tilimizda ishlaydi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. XAVFSIZLIK VA MAXFIYLIK MODALI */}
      {(activeModal === 'security' || activeModal === 'privacy') && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#14231E] rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-[#20362E] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-[#9D5215]" />
                Xavfsizlik va Maxfiylik
              </h3>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {/* Ikki bosqichli autentifikatsiya PIN sozlamasi */}
              <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-[#182C25] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                      Ikki bosqichli autentifikatsiya
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-[#8DA39A]">
                      {twoStepPin ? 'Maxfiy PIN faollashtirilgan 🔐' : 'PIN parol orqali himoya'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (twoStepPin) {
                        handleRemovePin();
                      } else {
                        setIsEditingPin(true);
                      }
                    }}
                    className={`w-10 h-6 rounded-full p-1 transition-colors ${
                      twoStepPin ? 'bg-[#9D5215]' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full transition-transform ${
                        twoStepPin ? 'translate-x-4' : ''
                      }`}
                    />
                  </button>
                </div>

                {isEditingPin && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700/60 space-y-2 animate-fade-in">
                    <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block">
                      Yangi PIN kodni kiriting (kamida 4 xonali):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="flex-1 bg-white dark:bg-[#12201B] border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-white font-mono tracking-widest outline-none focus:border-amber-600"
                        autoFocus
                      />
                      <button
                        onClick={handleSavePin}
                        className="px-3 py-1.5 rounded-xl bg-[#9D5215] text-white text-xs font-bold shadow-xs hover:bg-[#834507] transition-colors"
                      >
                        Saqlash
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingPin(false);
                          setPinInput('');
                        }}
                        className="px-2 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                      >
                        Bekor
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                onClick={() => {
                  showToast('Telefon raqami faqat kontaktlaringizga ko‘rinadi', 'info');
                  setActiveModal('none');
                }}
                className="p-3 rounded-2xl bg-zinc-100 dark:bg-[#182C25] cursor-pointer hover:bg-zinc-200 dark:hover:bg-[#1F382E] transition-colors"
              >
                <span className="text-xs font-bold text-zinc-900 dark:text-white block mb-0.5">
                  Telefon raqam ko‘rinishi
                </span>
                <span className="text-xs text-[#9D5215] dark:text-[#E8BE8E] font-medium">
                  Faqat kontaktlarim &rsaquo;
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. KO'RINISH VA RANG PALITRASI MODALI */}
      {activeModal === 'appearance' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#14231E] rounded-3xl p-6 max-w-sm w-full border border-zinc-200 dark:border-[#20362E] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#9D5215]" />
                Mavzular va Ranglar
              </h3>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dark / Light Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-100 dark:bg-[#182C25] mb-2.5">
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {theme === 'dark' ? 'Qorong‘i mavzu' : 'Yorug‘ mavzu'}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3 py-1 rounded-full bg-[#9D5215] text-white text-xs font-bold shadow-sm"
              >
                Almashtirish
              </button>
            </div>

            {/* Animations Toggle (User requirement: settingsdan animatsiya avto yoniq va o'chiq tanlash) */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-100 dark:bg-[#182C25] mb-4">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                  Animatsiyalar (Harakatlar)
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-[#8DA39A]">
                  {animationsEnabled ? 'Yoqilgan (Faol silliq o‘tishlar)' : 'O‘chirilgan'}
                </span>
              </div>
              <button
                onClick={toggleAnimations}
                className={`w-10 h-6 rounded-full p-1 transition-colors ${
                  animationsEnabled ? 'bg-[#9D5215]' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full transition-transform ${
                    animationsEnabled ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </div>

            {/* Accent Palette */}
            <div>
              <span className="text-xs font-bold text-zinc-600 dark:text-[#8DA39A] block mb-2">
                Asosiy urg‘u rangi (Accent Color)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {accentColors.map((c) => {
                  const isSelected = accentColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      onClick={() => {
                        setAccentColor(c.hex);
                        showToast(`${c.name} faollashtirildi`, 'success');
                      }}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-[#9D5215] bg-[#9D5215]/10 shadow-sm'
                          : 'border-zinc-200 dark:border-[#20362E] hover:border-zinc-400'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center text-white"
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] font-bold truncate max-w-full text-zinc-800 dark:text-white">
                        {c.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Telegram Premium & Profile Appearance Studio Modal */}
      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}

      {/* Chat Background Gallery & Studio Modal */}
      {showWallpaperGallery && (
        <ChatBackgroundGalleryModal onClose={() => setShowWallpaperGallery(false)} />
      )}
    </div>
  );
};
