import React from 'react';
import {
  Rocket,
  Flame,
  Heart,
  Sparkles,
  PartyPopper,
  ThumbsUp,
  Trophy,
  Zap,
  ShieldCheck,
  Crown,
  Gem,
  Coffee,
  Smile,
  Target,
  Ghost,
  Star,
  CheckCircle,
  Award,
  Bell,
  Compass,
  Music,
  Moon,
  Sun,
  Cpu,
  Bot,
  Radio,
  Wifi,
  Gift,
  Feather,
  HeartHandshake,
  Key,
} from 'lucide-react';

export const STICKER_ICONS: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  color: string;
}[] = [
  { id: 'Rocket', label: 'Uchdik! 🚀', icon: Rocket, gradient: 'from-blue-600 via-indigo-600 to-purple-700', color: 'text-cyan-200' },
  { id: 'Flame', label: 'Qaynoq 🔥', icon: Flame, gradient: 'from-orange-500 via-red-600 to-rose-700', color: 'text-amber-100' },
  { id: 'Heart', label: 'Sevgi ❤️', icon: Heart, gradient: 'from-rose-500 via-pink-600 to-red-600', color: 'text-rose-100' },
  { id: 'Sparkles', label: 'Sehrli ✨', icon: Sparkles, gradient: 'from-purple-600 via-fuchsia-600 to-pink-600', color: 'text-yellow-200' },
  { id: 'PartyPopper', label: 'Tabrik 🎉', icon: PartyPopper, gradient: 'from-emerald-500 via-teal-600 to-blue-600', color: 'text-emerald-100' },
  { id: 'ThumbsUp', label: 'Zo‘r 👍', icon: ThumbsUp, gradient: 'from-blue-500 to-indigo-600', color: 'text-blue-100' },
  { id: 'Crown', label: 'Qirol 👑', icon: Crown, gradient: 'from-amber-400 via-yellow-500 to-amber-600', color: 'text-yellow-950' },
  { id: 'Gem', label: 'Brilliant 💎', icon: Gem, gradient: 'from-cyan-500 via-blue-600 to-indigo-700', color: 'text-cyan-100' },
  { id: 'Trophy', label: 'G‘alaba 🏆', icon: Trophy, gradient: 'from-yellow-400 via-amber-500 to-orange-600', color: 'text-amber-950' },
  { id: 'Zap', label: 'Tezkor ⚡️', icon: Zap, gradient: 'from-violet-600 via-purple-600 to-indigo-800', color: 'text-violet-100' },
  { id: 'ShieldCheck', label: 'Xavfsiz 🛡️', icon: ShieldCheck, gradient: 'from-emerald-600 to-teal-700', color: 'text-emerald-100' },
  { id: 'Ghost', label: 'Kutilmagan 👻', icon: Ghost, gradient: 'from-indigo-600 to-purple-800', color: 'text-purple-100' },
  { id: 'Target', label: 'Nishon 🎯', icon: Target, gradient: 'from-red-600 to-rose-700', color: 'text-red-100' },
  { id: 'Coffee', label: 'Dam olish ☕️', icon: Coffee, gradient: 'from-amber-700 to-stone-800', color: 'text-amber-100' },
  { id: 'Star', label: 'Yulduz ⭐️', icon: Star, gradient: 'from-yellow-400 via-amber-500 to-orange-500', color: 'text-amber-950' },
  { id: 'Smile', label: 'Tabassum 😊', icon: Smile, gradient: 'from-amber-400 to-yellow-500', color: 'text-yellow-950' },
  
  // Cyber & Tech Pack
  { id: 'Cpu', label: 'Protsessor 💻', icon: Cpu, gradient: 'from-cyan-600 to-blue-800', color: 'text-cyan-200' },
  { id: 'Bot', label: 'Robot AI 🤖', icon: Bot, gradient: 'from-emerald-600 to-cyan-800', color: 'text-emerald-100' },
  { id: 'Radio', label: 'Signal 📡', icon: Radio, gradient: 'from-violet-600 to-purple-900', color: 'text-violet-200' },
  { id: 'Wifi', label: 'Ulanish 📶', icon: Wifi, gradient: 'from-blue-600 to-teal-700', color: 'text-cyan-100' },
  { id: 'Gift', label: 'Sovg‘a 🎁', icon: Gift, gradient: 'from-pink-600 to-rose-700', color: 'text-pink-100' },
  { id: 'Compass', label: 'Kompas 🧭', icon: Compass, gradient: 'from-sky-600 to-indigo-800', color: 'text-sky-100' },
  { id: 'Award', label: 'Medal 🎖️', icon: Award, gradient: 'from-amber-500 to-yellow-600', color: 'text-yellow-950' },
  { id: 'Key', label: 'Kalit 🔑', icon: Key, gradient: 'from-amber-600 to-orange-700', color: 'text-yellow-100' },

  // Warm Feelings Pack
  { id: 'Music', label: 'Musiqa 🎵', icon: Music, gradient: 'from-violet-600 via-pink-600 to-rose-500', color: 'text-pink-100' },
  { id: 'Moon', label: 'Oydin Tun 🌙', icon: Moon, gradient: 'from-slate-800 via-indigo-900 to-blue-950', color: 'text-indigo-200' },
  { id: 'Sun', label: 'Quyosh ☀️', icon: Sun, gradient: 'from-amber-400 via-orange-500 to-yellow-500', color: 'text-yellow-950' },
  { id: 'Feather', label: 'Yengil Par 🪶', icon: Feather, gradient: 'from-teal-600 to-cyan-700', color: 'text-cyan-100' },
  { id: 'HeartHandshake', label: 'Do‘stlik 🤝', icon: HeartHandshake, gradient: 'from-blue-600 to-indigo-700', color: 'text-blue-100' },
];

export const LucideSticker: React.FC<{
  stickerId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ stickerId, size = 'lg', className = '' }) => {
  const cleanId = (stickerId || '').replace(/^icon:/, '').trim();
  const found = STICKER_ICONS.find((s) => s.id.toLowerCase() === cleanId.toLowerCase());

  if (!found) {
    // If it's an emoji or regular character
    if (!cleanId.startsWith('icon') && cleanId.length <= 4) {
      return (
        <span className="text-6xl select-none filter drop-shadow-md animate-scale-in">
          {cleanId}
        </span>
      );
    }
    // Fallback: stylish modern badge
    return (
      <div className={`p-4 rounded-3xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex flex-col items-center justify-center shadow-xl ${className}`}>
        <Sparkles className="w-12 h-12 text-yellow-300 animate-spin-slow mb-1" />
        <span className="text-xs font-bold">{cleanId || 'Stiker'}</span>
      </div>
    );
  }

  const IconComp = found.icon;

  if (size === 'sm') {
    return (
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${found.gradient} p-0.5 flex items-center justify-center shadow-md ${className}`}
      >
        <IconComp className={`w-5 h-5 ${found.color} stroke-[2.4]`} />
      </div>
    );
  }

  return (
    <div
      className={`relative group p-3.5 rounded-3xl bg-gradient-to-tr ${found.gradient} shadow-2xl shadow-black/25 flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer select-none ${className}`}
      style={{ minWidth: '110px', minHeight: '110px' }}
    >
      <div className="absolute inset-0 rounded-3xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <IconComp className={`w-16 h-16 ${found.color} stroke-[2.2] drop-shadow-xl animate-float`} />
      <span className="mt-2 text-[11px] font-black text-white tracking-wider drop-shadow uppercase text-center">
        {found.label}
      </span>
    </div>
  );
};
