import React from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  Send,
  Star,
  Sparkles,
  Rocket,
  Heart,
  Flame,
} from 'lucide-react';
import { WallpaperConfig } from '../../stores/appearanceStore';
import { getWallpaperCssStyle, getPatternDataUri } from '../../utils/wallpaperPatterns';

interface LiveChatPreviewProps {
  wallpaper: WallpaperConfig;
  className?: string;
  isCompact?: boolean;
}

export const LiveChatPreview: React.FC<LiveChatPreviewProps> = ({
  wallpaper,
  className = '',
  isCompact = false,
}) => {
  const bgStyle = getWallpaperCssStyle(wallpaper);
  const patternUri = getPatternDataUri(wallpaper.pattern, '#ffffff');

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col select-none transition-all duration-300 ${className}`}
      style={{ minHeight: isCompact ? '380px' : '540px' }}
    >
      {/* 1. LAYER 1: BASE WALLPAPER (COLOR / GRADIENT / IMAGE) */}
      <div
        className="absolute inset-0 transition-all duration-500 z-0"
        style={{
          ...bgStyle,
          filter: `blur(${wallpaper.blur || 0}px) brightness(${wallpaper.brightness || 100}%)`,
          transform: wallpaper.blur ? 'scale(1.05)' : 'none', // Prevents blur edge clipping
        }}
      />

      {/* 2. LAYER 2: VECTOR SVG PATTERN OVERLAY */}
      {patternUri && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-1"
          style={{
            backgroundImage: `url("${patternUri}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${wallpaper.patternScale || 85}px ${wallpaper.patternScale || 85}px`,
            opacity: wallpaper.patternOpacity ?? 0.08,
          }}
        />
      )}

      {/* 3. LAYER 3: AMBIENT VIGNETTE / DEPTH SHADOW */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none z-2" />

      {/* 4. CHAT HEADER - TELEGRAM WEB A STYLE */}
      <div className="relative z-10 h-14 px-3.5 bg-white/95 dark:bg-[#212121]/95 backdrop-blur-md text-zinc-900 dark:text-white flex items-center justify-between shrink-0 shadow-sm border-b border-[#DADCE0] dark:border-[#303030]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button className="p-1 rounded-full text-[#707579] dark:text-[#AAAAAA] hover:text-[#3390EC]">
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Avatar with Glow & Online Status */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3390EC] to-[#8774E1] p-[1.5px] shadow-sm">
              <div className="w-full h-full rounded-full bg-[#212121] flex items-center justify-center font-black text-xs text-white">
                B
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00C73E] border-2 border-white dark:border-[#212121]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                BecuGram Premium
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#3390EC] text-white text-[9px] font-black uppercase tracking-wider">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-[#3390EC] dark:text-[#8774E1] font-medium block leading-none">
              onlayn
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-[#707579] dark:text-[#AAAAAA]">
          <button className="p-1.5 rounded-full hover:bg-white/10">
            <Phone className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-full hover:bg-white/10">
            <Video className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-full hover:bg-white/10">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. MESSAGES SCROLL AREA */}
      <div className="relative z-10 flex-1 p-3.5 sm:p-4 space-y-3 overflow-y-auto">
        {/* Date Divider Pill */}
        <div className="flex justify-center my-1">
          <span className="px-3 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-[10px] font-semibold shadow-xs">
            Bugun
          </span>
        </div>

        {/* Incoming Message 1 */}
        <div className="flex items-end gap-2 max-w-[85%]">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mb-1">
            B
          </div>
          <div className="p-3 rounded-2xl rounded-bl-[4px] bg-white/95 dark:bg-[#212121]/95 text-zinc-900 dark:text-white shadow-md border border-[#DADCE0] dark:border-[#303030] backdrop-blur-sm text-xs leading-relaxed relative">
            <p className="font-normal">
              Assalomu alaykum! Yangi BecuGram Chat orqa foni va gradient naqshlar sizga yoqdimi? ✨
            </p>
            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-zinc-400 dark:text-white/60">
              <span>12:40</span>
              <Check className="w-3 h-3 text-[#3390EC] dark:text-[#8774E1]" />
            </div>
          </div>
        </div>

        {/* Outgoing Message 1 */}
        <div className="flex justify-end">
          <div className="max-w-[85%] p-3 rounded-2xl rounded-br-[4px] bg-[#E1FFC7] dark:bg-[#766AC8] text-zinc-900 dark:text-white shadow-xs text-xs leading-relaxed relative">
            <p className="font-normal">
              Albatta! Ranglar, silliq gradientlar va naqshlar aqlbovar qilmas darajada chiroyli chiqibdi! 🚀
            </p>
            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#3f8c00] dark:text-white">
              <span>12:41</span>
              <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Incoming Message 2: Premium Animated Sticker */}
        <div className="flex items-end gap-2 max-w-[85%]">
          <div className="w-6 h-6 rounded-full bg-[#3390EC] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mb-1">
            B
          </div>
          <div className="relative group">
            <div className="p-3 rounded-3xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 shadow-xl shadow-purple-500/25 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform">
              <Rocket className="w-14 h-14 text-white drop-shadow-lg animate-pulse-subtle stroke-[2.2]" />
              <span className="mt-1 text-[9px] font-black uppercase text-amber-200 tracking-wider">
                BecuGram Exclusive
              </span>
            </div>

            {/* Reaction Badges */}
            <div className="flex items-center gap-1.5 mt-1 ml-1">
              <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <span>❤️</span>
                <span className="text-white/80">3</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <span>🔥</span>
                <span className="text-white/80">5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Outgoing Message 2 */}
        <div className="flex justify-end">
          <div className="max-w-[85%] p-3 rounded-2xl rounded-br-[4px] bg-[#E1FFC7] dark:bg-[#766AC8] text-zinc-900 dark:text-white shadow-xs text-xs leading-relaxed">
            <p className="font-normal">
              Telegram Web A talqinidagi eng so‘nggi dizayn! ⭐️
            </p>
            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#3f8c00] dark:text-white">
              <span>12:42</span>
              <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM MESSAGE COMPOSER - TELEGRAM CAPSULE */}
      <div className="relative z-10 p-2.5 bg-white/95 dark:bg-[#212121]/95 backdrop-blur-md border-t border-[#DADCE0] dark:border-[#303030] flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center bg-[#F4F4F5] dark:bg-[#181818] border border-[#DADCE0] dark:border-[#303030] rounded-full px-3 py-1.5">
          <Smile className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA] mr-2" />
          <span className="text-xs text-[#707579] dark:text-[#AAAAAA] flex-1">Xabar...</span>
          <Paperclip className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA] ml-2" />
        </div>
        <div className="w-9 h-9 rounded-full bg-[#3390EC] dark:bg-[#8774E1] text-white flex items-center justify-center shadow-md shadow-blue-500/30">
          <Send className="w-4 h-4 ml-0.5" />
        </div>
      </div>
    </div>
  );
};

