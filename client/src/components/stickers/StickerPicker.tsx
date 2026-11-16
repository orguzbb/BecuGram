import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Star,
  Crown,
  Flame,
  Heart,
  Smile,
  Sparkles,
  Zap,
  Rocket,
  Gem,
  Trophy,
  PartyPopper,
  ThumbsUp,
  Ghost,
  Target,
  Coffee,
  ShieldCheck,
  Cpu,
  Bot,
  Radio,
  Wifi,
  Gift,
  Music,
  Compass,
  Award,
  Sun,
  Moon,
  Feather,
  HeartHandshake,
  Key,
  X,
} from 'lucide-react';
import { LottieAnimation } from '../LottieAnimation';
import { api } from '../../services/api';

export interface StickerItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
  color?: string;
  packId: string;
  isPremium?: boolean;
  lottieJson?: any;
}

export interface StickerPack {
  id: string;
  name: string;
  author: string;
  isPremium?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  stickers: StickerItem[];
}

export const STICKER_PACKS: StickerPack[] = [
  {
    id: 'pack-exclusives',
    name: 'BecuGram Exclusives',
    author: 'BecuGram Studio',
    isPremium: true,
    icon: Crown,
    stickers: [
      { id: 'Rocket', label: 'Uchdik! 🚀', icon: Rocket, gradient: 'from-blue-600 via-indigo-600 to-purple-700', color: 'text-cyan-200', packId: 'pack-exclusives', isPremium: true },
      { id: 'Flame', label: 'Qaynoq 🔥', icon: Flame, gradient: 'from-orange-500 via-red-600 to-rose-700', color: 'text-amber-100', packId: 'pack-exclusives', isPremium: true },
      { id: 'Gem', label: 'Brilliant 💎', icon: Gem, gradient: 'from-cyan-500 via-blue-600 to-indigo-700', color: 'text-cyan-100', packId: 'pack-exclusives', isPremium: true },
      { id: 'Crown', label: 'Qirol 👑', icon: Crown, gradient: 'from-amber-400 via-yellow-500 to-amber-600', color: 'text-yellow-950', packId: 'pack-exclusives', isPremium: true },
      { id: 'Sparkles', label: 'Sehrli ✨', icon: Sparkles, gradient: 'from-purple-600 via-fuchsia-600 to-pink-600', color: 'text-yellow-200', packId: 'pack-exclusives', isPremium: true },
      { id: 'Zap', label: 'Tezkor ⚡️', icon: Zap, gradient: 'from-violet-600 via-purple-600 to-indigo-800', color: 'text-violet-100', packId: 'pack-exclusives', isPremium: true },
      { id: 'Trophy', label: 'G‘alaba 🏆', icon: Trophy, gradient: 'from-yellow-400 via-amber-500 to-orange-600', color: 'text-amber-950', packId: 'pack-exclusives', isPremium: true },
      { id: 'PartyPopper', label: 'Tabrik 🎉', icon: PartyPopper, gradient: 'from-emerald-500 via-teal-600 to-blue-600', color: 'text-emerald-100', packId: 'pack-exclusives', isPremium: true },
    ],
  },
  {
    id: 'pack-emotions',
    name: 'Reaksiyalar & Emoitsiyalar',
    author: 'Telegram Style',
    isPremium: false,
    icon: Flame,
    stickers: [
      { id: 'Heart', label: 'Sevgi ❤️', icon: Heart, gradient: 'from-rose-500 via-pink-600 to-red-600', color: 'text-rose-100', packId: 'pack-emotions' },
      { id: 'ThumbsUp', label: 'Zo‘r 👍', icon: ThumbsUp, gradient: 'from-blue-500 to-indigo-600', color: 'text-blue-100', packId: 'pack-emotions' },
      { id: 'Smile', label: 'Tabassum 😊', icon: Smile, gradient: 'from-amber-400 to-yellow-500', color: 'text-yellow-950', packId: 'pack-emotions' },
      { id: 'Star', label: 'Yulduz ⭐️', icon: Star, gradient: 'from-yellow-400 via-amber-500 to-orange-500', color: 'text-amber-950', packId: 'pack-emotions' },
      { id: 'Ghost', label: 'Kutilmagan 👻', icon: Ghost, gradient: 'from-indigo-600 to-purple-800', color: 'text-purple-100', packId: 'pack-emotions' },
      { id: 'Target', label: 'Nishon 🎯', icon: Target, gradient: 'from-red-600 to-rose-700', color: 'text-red-100', packId: 'pack-emotions' },
      { id: 'Coffee', label: 'Dam olish ☕️', icon: Coffee, gradient: 'from-amber-700 to-stone-800', color: 'text-amber-100', packId: 'pack-emotions' },
      { id: 'ShieldCheck', label: 'Xavfsiz 🛡️', icon: ShieldCheck, gradient: 'from-emerald-600 to-teal-700', color: 'text-emerald-100', packId: 'pack-emotions' },
    ],
  },
  {
    id: 'pack-cyber',
    name: 'Cyber & Tech Future',
    author: 'Dev Core',
    isPremium: true,
    icon: Cpu,
    stickers: [
      { id: 'Cpu', label: 'Protsessor 💻', icon: Cpu, gradient: 'from-cyan-600 to-blue-800', color: 'text-cyan-200', packId: 'pack-cyber', isPremium: true },
      { id: 'Bot', label: 'Robot AI 🤖', icon: Bot, gradient: 'from-emerald-600 to-cyan-800', color: 'text-emerald-100', packId: 'pack-cyber', isPremium: true },
      { id: 'Radio', label: 'Signal 📡', icon: Radio, gradient: 'from-violet-600 to-purple-900', color: 'text-violet-200', packId: 'pack-cyber', isPremium: true },
      { id: 'Wifi', label: 'Ulanish 📶', icon: Wifi, gradient: 'from-blue-600 to-teal-700', color: 'text-cyan-100', packId: 'pack-cyber', isPremium: true },
      { id: 'Key', label: 'Shifr 🔑', icon: Key, gradient: 'from-amber-500 to-yellow-700', color: 'text-yellow-100', packId: 'pack-cyber', isPremium: true },
      { id: 'Award', label: 'Mukofot 🎖️', icon: Award, gradient: 'from-purple-600 to-indigo-800', color: 'text-purple-100', packId: 'pack-cyber', isPremium: true },
    ],
  },
  {
    id: 'pack-moods',
    name: 'Issiq Hislar & Kayfiyat',
    author: 'Warm Studio',
    isPremium: false,
    icon: Heart,
    stickers: [
      { id: 'HeartHandshake', label: 'Do‘stlik 🤝', icon: HeartHandshake, gradient: 'from-pink-500 to-rose-600', color: 'text-pink-100', packId: 'pack-moods' },
      { id: 'Sun', label: 'Quyosh ☀️', icon: Sun, gradient: 'from-amber-400 to-orange-500', color: 'text-yellow-950', packId: 'pack-moods' },
      { id: 'Moon', label: 'Tun 🌙', icon: Moon, gradient: 'from-indigo-600 to-slate-800', color: 'text-indigo-200', packId: 'pack-moods' },
      { id: 'Gift', label: 'Sovg‘a 🎁', icon: Gift, gradient: 'from-rose-500 to-red-600', color: 'text-rose-100', packId: 'pack-moods' },
      { id: 'Music', label: 'Musiqa 🎵', icon: Music, gradient: 'from-purple-600 to-violet-800', color: 'text-purple-100', packId: 'pack-moods' },
      { id: 'Compass', label: 'Sayohat 🧭', icon: Compass, gradient: 'from-teal-600 to-blue-700', color: 'text-teal-100', packId: 'pack-moods' },
    ],
  },
];

export const CURATED_GIFS = [
  { id: 'gif-party', title: 'Bayram 🎉', category: 'Celebration', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
  { id: 'gif-clap', title: 'Qarsaklar 👏', category: 'Reactions', url: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif' },
  { id: 'gif-thumbs', title: 'Ajoyib 👍', category: 'Reactions', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: 'gif-dance', title: 'Raqs 🕺', category: 'Funny', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: 'gif-heart', title: 'Muhabbat ❤️', category: 'Love', url: 'https://media.giphy.com/media/26BRv0ThflsDTjDUs/giphy.gif' },
  { id: 'gif-mindblown', title: 'Aqlbovar qilmas 🤯', category: 'Trending', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'gif-laugh', title: 'Kulgi 😂', category: 'Funny', url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif' },
  { id: 'gif-fire', title: 'Olov 🔥', category: 'Trending', url: 'https://media.giphy.com/media/nrXif9YjgW9EI/giphy.gif' },
];

interface StickerPickerProps {
  onSelectSticker: (stickerId: string, label: string) => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectGif?: (gifUrl: string, title?: string) => void;
  onClose?: () => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  onSelectSticker,
  onSelectEmoji,
  onSelectGif,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stickers' | 'emoji' | 'gifs'>('stickers');
  const [selectedPackId, setSelectedPackId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredSticker, setHoveredSticker] = useState<StickerItem | null>(null);

  // Live GIFs and Sticker packs from server
  const [allGifs, setAllGifs] = useState(CURATED_GIFS);
  const [customPacks, setCustomPacks] = useState<any[]>([]);

  useEffect(() => {
    api
      .getGifs()
      .then((g) => {
        if (Array.isArray(g) && g.length > 0) {
          const map = new Map<string, any>();
          CURATED_GIFS.forEach((item) => map.set(item.id, item));
          g.forEach((item) => map.set(item.id, item));
          setAllGifs(Array.from(map.values()));
        }
      })
      .catch(() => {});

    api
      .getStickers()
      .then((packs) => {
        if (Array.isArray(packs) && packs.length > 0) {
          setCustomPacks(packs);
        }
      })
      .catch(() => {});
  }, []);

  // Favorites & Recents in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('becugram_fav_stickers');
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['Rocket', 'Flame', 'Crown', 'Heart'];
  });

  const [recents, setRecents] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('becugram_recent_stickers');
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['Rocket', 'Flame', 'Gem'];
  });

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('becugram_fav_stickers', JSON.stringify(next));
  };

  const handleStickerClick = (sticker: StickerItem) => {
    const nextRecents = [sticker.id, ...recents.filter((id) => id !== sticker.id)].slice(0, 10);
    setRecents(nextRecents);
    localStorage.setItem('becugram_recent_stickers', JSON.stringify(nextRecents));
    const stickerPayload = sticker.lottieJson
      ? `lottie:${typeof sticker.lottieJson === 'object' ? JSON.stringify(sticker.lottieJson) : sticker.lottieJson}`
      : `icon:${sticker.id}`;
    onSelectSticker(stickerPayload, sticker.label);
  };

  const allStickers = useMemo(() => {
    const builtIn = STICKER_PACKS.flatMap((p) => p.stickers);
    const custom = customPacks.flatMap((p) =>
      (p.stickers || []).map((st: any) => ({
        id: st.id,
        label: `${st.name} ${st.emoji}`,
        gradient: 'from-blue-600 to-indigo-700',
        color: 'text-white',
        packId: p.id,
        isPremium: p.isPremium,
        lottieJson: st.lottieJson,
      }))
    );
    return [...builtIn, ...custom];
  }, [customPacks]);

  const filteredStickers = useMemo(() => {
    let list = allStickers;
    if (selectedPackId === 'favorites') {
      list = allStickers.filter((s) => favorites.includes(s.id));
    } else if (selectedPackId === 'recents') {
      list = recents
        .map((rId) => allStickers.find((s) => s.id === rId))
        .filter(Boolean) as StickerItem[];
    } else if (selectedPackId !== 'all') {
      list = allStickers.filter((s) => s.packId === selectedPackId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }

    return list;
  }, [allStickers, selectedPackId, searchQuery, favorites, recents]);

  const EMOJI_LIST = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘',
    '😋', '😛', '😜', '🤪', '😎', '🥳', '😏', '😒',
    '🤔', '🤫', '🤭', '🫡', '🤐', '🤨', '😐', '😑',
    '👍', '👎', '👏', '🙌', '🫶', '🤝', '🔥', '✨',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '💯', '🎉', '🚀', '⭐', '⚡', '🏆', '☕', '💎',
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] rounded-2xl shadow-2xl overflow-hidden flex flex-col select-none animate-scale-in z-50 text-zinc-900 dark:text-white"
      style={{ height: '440px' }}
    >
      {/* 1. TOP HEADER: TABS & CLOSE */}
      <div className="px-3 py-2 bg-white dark:bg-[#212121] border-b border-[#DADCE0] dark:border-[#303030] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={`py-1 text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'emoji'
                ? 'text-[#3390EC] dark:text-[#8774E1] font-semibold after:content-[\'\'] after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#3390EC] dark:after:bg-[#8774E1] after:rounded-full'
                : 'text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Emojilar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`py-1 text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'stickers'
                ? 'text-[#3390EC] dark:text-[#8774E1] font-semibold after:content-[\'\'] after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#3390EC] dark:after:bg-[#8774E1] after:rounded-full'
                : 'text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Stikerlar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gifs')}
            className={`py-1 text-[13px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'gifs'
                ? 'text-[#3390EC] dark:text-[#8774E1] font-semibold after:content-[\'\'] after:absolute after:bottom-[-9px] after:left-0 after:right-0 after:h-[2.5px] after:bg-[#3390EC] dark:after:bg-[#8774E1] after:rounded-full'
                : 'text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>GIF</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. SEARCH BAR */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#707579] dark:text-[#AAAAAA]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'stickers' ? 'Stikerlarni qidirish...' : 'Emojilarni qidirish...'}
            className="w-full pl-8 pr-3 py-1.5 bg-[#F4F4F5] dark:bg-[#181818] border border-transparent focus:border-[#3390EC] dark:focus:border-[#8774E1] rounded-full text-xs text-zinc-900 dark:text-white placeholder-[#707579] dark:placeholder-[#AAAAAA] outline-none"
          />
        </div>
      </div>

      {/* 3. STICKER PACK SELECTOR PILLS (IF IN STICKER TAB) */}
      {activeTab === 'stickers' && (
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none border-b border-[#DADCE0]/50 dark:border-[#303030]/50">
          <button
            type="button"
            onClick={() => setSelectedPackId('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
              selectedPackId === 'all'
                ? 'bg-[#3390EC] dark:bg-[#8774E1] text-white shadow-xs'
                : 'bg-[#F4F4F5] dark:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
            }`}
          >
            Barchasi
          </button>

          <button
            type="button"
            onClick={() => setSelectedPackId('favorites')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              selectedPackId === 'favorites'
                ? 'bg-[#3390EC] dark:bg-[#8774E1] text-white shadow-xs'
                : 'bg-[#F4F4F5] dark:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
            }`}
          >
            <Heart className="w-3 h-3 text-rose-500" />
            <span>Tanlangan</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPackId('recents')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
              selectedPackId === 'recents'
                ? 'bg-[#3390EC] dark:bg-[#8774E1] text-white shadow-xs'
                : 'bg-[#F4F4F5] dark:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
            }`}
          >
            Oxirgilari
          </button>

          {STICKER_PACKS.map((pack) => {
            const PackIcon = pack.icon;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelectedPackId(pack.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                  selectedPackId === pack.id
                    ? 'bg-[#3390EC] dark:bg-[#8774E1] text-white shadow-xs'
                    : 'bg-[#F4F4F5] dark:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
                }`}
              >
                <PackIcon className="w-3 h-3" />
                <span>{pack.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'emoji' ? (
          /* EMOJI GRID */
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJI_LIST.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectEmoji(emoji)}
                className="w-9 h-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#1C2836] flex items-center justify-center text-xl active:scale-90 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : activeTab === 'gifs' ? (
          /* GIFS GRID */
          <div className="grid grid-cols-2 gap-2">
            {allGifs.filter(
              (g) =>
                !searchQuery.trim() ||
                g.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                g.category.toLowerCase().includes(searchQuery.toLowerCase().trim())
            ).map((gif) => (
              <div
                key={gif.id}
                onClick={() => onSelectGif && onSelectGif(gif.url, gif.title)}
                className="relative h-28 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-all bg-zinc-900 shadow-xs"
              >
                <img src={gif.url} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-white text-[10px] font-semibold">
                  <span className="truncate">{gif.title}</span>
                  <span className="text-[8px] px-1 py-0.2 rounded bg-black/60 font-mono">GIF</span>
                </div>
              </div>
            ))}
          </div>
        ) : filteredStickers.length === 0 ? (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
            <Zap className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-semibold">Stikerlar topilmadi</span>
          </div>
        ) : (
          /* STICKERS GRID */
          <div className="grid grid-cols-4 gap-2.5">
            {filteredStickers.map((st) => {
              const IconComp = st.icon;
              const isFav = favorites.includes(st.id);

              return (
                <div
                  key={st.id}
                  onClick={() => handleStickerClick(st)}
                  onMouseEnter={() => setHoveredSticker(st)}
                  onMouseLeave={() => setHoveredSticker(null)}
                  className="group relative p-2.5 rounded-2xl bg-zinc-50 dark:bg-[#131C26] hover:bg-blue-50 dark:hover:bg-[#1C2836] border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-1.5 active:scale-95 hover:scale-105 transition-all cursor-pointer shadow-xs"
                >
                  {/* Large Sticker Icon or Lottie Animation */}
                  {st.lottieJson ? (
                    <div className="w-12 h-12 flex items-center justify-center pointer-events-none">
                      {typeof st.lottieJson === 'string' && st.lottieJson.startsWith('/') ? (
                        <LottieAnimation src={st.lottieJson} size={44} loop={true} />
                      ) : (
                        <LottieAnimation animationData={st.lottieJson} size={44} loop={true} />
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${st.gradient || 'from-blue-600 to-indigo-700'} p-0.5 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all`}
                    >
                      {IconComp && <IconComp className={`w-7 h-7 ${st.color || 'text-white'} stroke-[2.2] drop-shadow-sm`} />}
                    </div>
                  )}

                  <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 truncate max-w-full text-center">
                    {st.label.split(' ')[0]}
                  </span>

                  {/* Favorite toggle button on hover */}
                  <button
                    type="button"
                    onClick={(e) => toggleFav(st.id, e)}
                    className={`absolute top-1 right-1 p-1 rounded-full transition-opacity ${
                      isFav ? 'opacity-100 text-rose-500' : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isFav ? 'fill-rose-500' : ''}`} />
                  </button>

                  {/* Premium badge indicator */}
                  {st.isPremium && (
                    <span className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-amber-400 shadow-xs" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. LARGE PREVIEW BAR AT BOTTOM (WHEN HOVERED) */}
      {hoveredSticker && (
        <div className="h-10 px-3 bg-zinc-100 dark:bg-[#131C26] border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">⭐️</span>
            <span className="font-bold text-zinc-900 dark:text-white truncate">
              {hoveredSticker.label}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#3390EC]">
            Yuborish uchun bosing
          </span>
        </div>
      )}
    </div>
  );
};

