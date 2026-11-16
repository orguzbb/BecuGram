import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Heart,
  Palette,
  Sliders,
  Check,
  Star,
  Sparkles,
  RotateCcw,
  Eye,
  Layers,
  Crown,
} from 'lucide-react';
import {
  WallpaperConfig,
  useAppearanceStore,
  DEFAULT_WALLPAPER,
} from '../../stores/appearanceStore';
import {
  WALLPAPER_CATEGORIES,
  WALLPAPER_PRESETS,
} from '../../data/wallpapers';
import { LiveChatPreview } from './LiveChatPreview';
import { BackgroundCustomizer } from './BackgroundCustomizer';
import { useToast } from '../Toast';
import confetti from 'canvas-confetti';
import { getWallpaperCssStyle, getPatternDataUri } from '../../utils/wallpaperPatterns';

interface ChatBackgroundGalleryModalProps {
  conversationId?: string;
  chatName?: string;
  onClose: () => void;
}

export const ChatBackgroundGalleryModal: React.FC<ChatBackgroundGalleryModalProps> = ({
  conversationId,
  chatName,
  onClose,
}) => {
  const {
    globalWallpaper,
    chatWallpapers,
    favorites,
    recentlyUsed,
    setGlobalWallpaper,
    setChatWallpaper,
    removeChatWallpaper,
    toggleFavorite,
    resetAllWallpapers,
  } = useAppearanceStore();
  const { showToast } = useToast();

  // Currently active wallpaper for this chat context
  const activeCurrentWallpaper = useMemo(() => {
    if (conversationId && chatWallpapers[conversationId]) {
      return chatWallpapers[conversationId];
    }
    return globalWallpaper || DEFAULT_WALLPAPER;
  }, [conversationId, chatWallpapers, globalWallpaper]);

  // Selected wallpaper in the studio/editor (previewing live)
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperConfig>(activeCurrentWallpaper);

  // Active top tab ('gallery' | 'custom' | 'favorites' | 'recents')
  const [activeTab, setActiveTab] = useState<'gallery' | 'custom' | 'favorites' | 'recents'>('gallery');

  // Selected category in gallery
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile live preview full screen toggle
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Filtered wallpapers based on category & search query
  const displayedWallpapers = useMemo(() => {
    let list: WallpaperConfig[] = [];

    if (activeTab === 'favorites') {
      list = WALLPAPER_PRESETS.filter((w) => favorites.includes(w.id));
    } else if (activeTab === 'recents') {
      list = recentlyUsed;
    } else {
      list = WALLPAPER_PRESETS;
    }

    if (activeTab === 'gallery' && selectedCategory !== 'all') {
      list = list.filter((w) => w.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeTab, selectedCategory, searchQuery, favorites, recentlyUsed]);

  // Apply Actions
  const handleApplyGlobal = () => {
    setGlobalWallpaper(selectedWallpaper);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3390EC', '#10B981', '#F59E0B', '#8B5CF6'],
    });
    showToast('Fon barcha chatlar uchun o‘rnatildi! ✨', 'success');
    onClose();
  };

  const handleApplyChatOnly = () => {
    if (!conversationId) return;
    setChatWallpaper(conversationId, selectedWallpaper);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3390EC', '#10B981', '#F59E0B'],
    });
    showToast(
      `${chatName || 'Ushbu chat'} uchun maxsus fon o‘rnatildi! ✨`,
      'success'
    );
    onClose();
  };

  const handleReset = () => {
    if (conversationId && chatWallpapers[conversationId]) {
      removeChatWallpaper(conversationId);
      setSelectedWallpaper(globalWallpaper || DEFAULT_WALLPAPER);
      showToast('Ushbu chat uchun fon umumiy standartga qaytarildi', 'info');
    } else {
      resetAllWallpapers();
      setSelectedWallpaper(DEFAULT_WALLPAPER);
      showToast('Barcha fonlar standartga qaytarildi', 'info');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white rounded-3xl border border-black/10 dark:border-[#202B36] shadow-2xl overflow-hidden flex flex-col h-[94vh] max-h-[920px] relative"
      >
        {/* 1. TOP HEADER BAR */}
        <div className="h-16 px-4 sm:px-6 bg-[#3390EC] dark:bg-[#212121] text-white flex items-center justify-between shrink-0 shadow-sm border-b border-white/10 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
              <Palette className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Chat Orqa Foni & Galereya
                {conversationId && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/30 text-cyan-200">
                    {chatName ? `Chat: ${chatName}` : 'Maxsus chat'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-white/70">
                Telegram Premium uslubidagi silliq gradientlar, naqshlar va jonli preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile preview toggle button */}
            <button
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="lg:hidden px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{showMobilePreview ? 'Sozlash' : 'Preview'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. NAVIGATION TABS */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-100 dark:bg-[#131C26] border-b border-black/5 dark:border-white/5 flex items-center justify-between gap-2 overflow-x-auto shrink-0 z-10">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-[#3390EC] text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-[#1C2836] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Galereya (Gallery)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[#3390EC] text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-[#1C2836] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Maxsus Studiya (Custom Studio)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-[#3390EC] text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-[#1C2836] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Tanlanganlar ({favorites.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recents')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'recents'
                  ? 'bg-[#3390EC] text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-[#1C2836] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Oxirgilari</span>
            </button>
          </div>

          {/* Search bar inside tabs */}
          {activeTab === 'gallery' && (
            <div className="relative min-w-[160px] sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Fonlarni qidirish..."
                className="w-full pl-8 pr-3 py-1 bg-white dark:bg-[#1C2836] border border-black/5 dark:border-white/10 rounded-xl text-xs text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[#3390EC]"
              />
            </div>
          )}
        </div>

        {/* 3. CATEGORY PILLS BAR (when in Gallery mode) */}
        {activeTab === 'gallery' && (
          <div className="px-4 sm:px-6 py-2 bg-zinc-50 dark:bg-[#0F0F0F] border-b border-black/5 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto shrink-0 z-10 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-200 dark:bg-[#1C2836] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Barchasi ({WALLPAPER_PRESETS.length})
            </button>

            {WALLPAPER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                    : 'bg-zinc-200 dark:bg-[#1C2836] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 4. MAIN BODY SPLIT VIEW (LEFT: SELECTOR/STUDIO, RIGHT: LIVE CHAT PREVIEW) */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN: Gallery Grid OR Custom Studio Controls */}
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-6 transition-all ${
              showMobilePreview ? 'hidden lg:block' : 'block'
            }`}
          >
            {activeTab === 'custom' ? (
              <div className="max-w-2xl mx-auto">
                <BackgroundCustomizer
                  config={selectedWallpaper}
                  onChange={(updated) => setSelectedWallpaper(updated)}
                  onReset={() => setSelectedWallpaper(DEFAULT_WALLPAPER)}
                />
              </div>
            ) : displayedWallpapers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-[#212121] flex items-center justify-center text-zinc-400 mb-3">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-800 dark:text-white mb-1">
                  Fonlar topilmadi
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                  Qidiruv so‘zini o‘zgartirib ko‘ring yoki "Maxsus Studiya" bo‘limida o‘zingiz yarating.
                </p>
              </div>
            ) : (
              /* WALLPAPER CARDS GRID */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {displayedWallpapers.map((item) => {
                  const isSelected = selectedWallpaper.id === item.id;
                  const isFav = favorites.includes(item.id);
                  const cardBgStyle = getWallpaperCssStyle(item);
                  const cardPatternUri = getPatternDataUri(item.pattern, '#ffffff');

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedWallpaper(item)}
                      className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 cursor-pointer transition-all duration-300 flex flex-col ${
                        isSelected
                          ? 'border-[#3390EC] ring-4 ring-[#3390EC]/20 scale-102 shadow-xl'
                          : 'border-black/5 dark:border-white/5 hover:border-zinc-400 dark:hover:border-white/20 hover:scale-101 shadow-sm'
                      }`}
                      style={{ height: '220px' }}
                    >
                      {/* CARD BACKGROUND */}
                      <div
                        className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105"
                        style={cardBgStyle}
                      />

                      {/* CARD PATTERN */}
                      {cardPatternUri && (
                        <div
                          className="absolute inset-0 pointer-events-none z-1"
                          style={{
                            backgroundImage: `url("${cardPatternUri}")`,
                            backgroundRepeat: 'repeat',
                            backgroundSize: `${item.patternScale || 75}px ${item.patternScale || 75}px`,
                            opacity: item.patternOpacity ?? 0.08,
                          }}
                        />
                      )}

                      {/* CARD AMBIENT SHADOW */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 z-2" />

                      {/* TOP BADGES ROW */}
                      <div className="relative z-10 p-2.5 flex items-center justify-between">
                        {item.isPremium ? (
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Crown className="w-2.5 h-2.5" /> PRO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white/80 text-[9px] font-semibold uppercase tracking-wider">
                            {item.category}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className={`p-1.5 rounded-full transition-transform active:scale-75 ${
                            isFav
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-black/40 text-white/70 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                        </button>
                      </div>

                      {/* CARD CENTER: MINI CHAT BUBBLE PREVIEW */}
                      <div className="relative z-10 flex-1 flex flex-col justify-center px-3 space-y-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <div className="self-start max-w-[80%] px-2.5 py-1 rounded-xl rounded-bl-xs bg-white/95 dark:bg-[#212121]/95 text-zinc-900 dark:text-white text-[10px] shadow-sm truncate">
                          Salom BecuGram! 👋
                        </div>
                        <div className="self-end max-w-[80%] px-2.5 py-1 rounded-xl rounded-br-xs bg-[#3390EC] text-white text-[10px] shadow-sm truncate">
                          Ajoyib fon! ✨
                        </div>
                      </div>

                      {/* BOTTOM NAME & SELECTION INDICATOR */}
                      <div className="relative z-10 p-2.5 flex items-center justify-between bg-black/40 backdrop-blur-md border-t border-white/10">
                        <span className="font-bold text-xs text-white truncate max-w-[80%]">
                          {item.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#3390EC] text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: INTERACTIVE LIVE CHAT PREVIEW (DESKTOP DOCKED, MOBILE OVERLAY) */}
          <div
            className={`w-full lg:w-[420px] xl:w-[460px] h-full p-4 sm:p-6 bg-zinc-100 dark:bg-[#131C26] border-l border-black/10 dark:border-white/5 flex flex-col shrink-0 overflow-y-auto ${
              showMobilePreview ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#3390EC]" />
                Jonli Chat Ko'rinishi (Live Preview)
              </span>
              <span className="text-[11px] font-bold text-[#3390EC] truncate max-w-[180px]">
                {selectedWallpaper.name}
              </span>
            </div>

            {/* LIVE PREVIEW COMPONENT */}
            <div className="flex-1 flex flex-col justify-center">
              <LiveChatPreview wallpaper={selectedWallpaper} />
            </div>

            {/* Quick Quick-adjust sliders on preview pane */}
            <div className="mt-3 p-3 rounded-2xl bg-white dark:bg-[#1C2836] border border-black/5 dark:border-white/5 space-y-2 shrink-0 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                <span>Xiralik (Blur)</span>
                <span className="font-mono">{selectedWallpaper.blur || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="1"
                value={selectedWallpaper.blur || 0}
                onChange={(e) =>
                  setSelectedWallpaper({
                    ...selectedWallpaper,
                    blur: parseInt(e.target.value),
                  })
                }
                className="w-full accent-[#3390EC] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 5. FOOTER ACTION CONTROLS */}
        <div className="h-20 px-4 sm:px-6 bg-white dark:bg-[#212121] border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0 z-20">
          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-[#202B36] hover:bg-zinc-200 dark:hover:bg-[#2A3847] text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Standart holatga qaytarish"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Standartga qaytarish</span>
          </button>

          {/* Apply buttons */}
          <div className="flex items-center gap-2.5">
            {conversationId && (
              <button
                type="button"
                onClick={handleApplyChatOnly}
                className="px-4 py-2.5 rounded-2xl bg-zinc-200 dark:bg-[#253648] hover:bg-zinc-300 dark:hover:bg-[#2E4258] text-zinc-900 dark:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
              >
                <span>Faqat ushbu chat uchun</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleApplyGlobal}
              className="px-5 sm:px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#3390EC] to-[#1E88E5] hover:from-[#1E88E5] hover:to-[#1565C0] text-white text-xs font-extrabold shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Barcha chatlar uchun qo‘llash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

