import { create } from 'zustand';

export interface WallpaperConfig {
  id: string;
  name: string;
  category:
    | 'minimal'
    | 'abstract'
    | 'nature'
    | 'gradient'
    | 'dark'
    | 'light'
    | 'patterns'
    | 'premium'
    | 'artistic'
    | 'custom';
  type: 'solid' | 'gradient' | 'pattern' | 'image' | 'custom';
  backgroundColor?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  pattern?: string;
  patternOpacity?: number; // 0 to 1
  patternScale?: number; // px, e.g. 70
  blur?: number; // 0 to 20 px
  brightness?: number; // 50 to 150 %
  opacity?: number; // 0.1 to 1.0
  customImageUrl?: string;
  thumbnailUrl?: string;
  isPremium?: boolean;
}

export interface ProfileAppearanceConfig {
  color: string;
  gradient: string;
  pattern: string;
  badge: string;
  coverImage: string | null;
  bioStyle?: string;
}

interface AppearanceState {
  globalWallpaper: WallpaperConfig;
  chatWallpapers: Record<string, WallpaperConfig>;
  favorites: string[];
  recentlyUsed: WallpaperConfig[];
  profileAppearance: ProfileAppearanceConfig;

  // Wallpaper Actions
  setGlobalWallpaper: (wallpaper: WallpaperConfig) => void;
  setChatWallpaper: (conversationId: string, wallpaper: WallpaperConfig) => void;
  removeChatWallpaper: (conversationId: string) => void;
  getWallpaperForChat: (conversationId?: string, themeMode?: 'dark' | 'light') => WallpaperConfig;
  toggleFavorite: (wallpaperId: string) => void;
  addRecentlyUsed: (wallpaper: WallpaperConfig) => void;

  // Profile Appearance Actions
  setProfileAppearance: (updates: Partial<ProfileAppearanceConfig>) => void;
  resetAllWallpapers: () => void;
}

export const DEFAULT_DARK_WALLPAPER: WallpaperConfig = {
  id: 'default-telegram-dark',
  name: 'Telegram Dark',
  category: 'dark',
  type: 'pattern',
  backgroundColor: '#0e1621',
  gradient: {
    type: 'linear',
    colors: ['#0e1621', '#17212b'],
    angle: 180,
  },
  pattern: 'telegram-doodle',
  patternOpacity: 0.08,
  patternScale: 90,
  blur: 0,
  brightness: 100,
  opacity: 1,
};

export const DEFAULT_LIGHT_WALLPAPER: WallpaperConfig = {
  id: 'default-telegram-light',
  name: 'Telegram Light',
  category: 'light',
  type: 'pattern',
  backgroundColor: '#BBD59B',
  gradient: {
    type: 'linear',
    colors: ['#BBD59B', '#98B582'],
    angle: 180,
  },
  pattern: 'telegram-doodle',
  patternOpacity: 0.08,
  patternScale: 90,
  blur: 0,
  brightness: 100,
  opacity: 1,
};

export const DEFAULT_WALLPAPER: WallpaperConfig = DEFAULT_DARK_WALLPAPER;

export const DEFAULT_PROFILE_APPEARANCE: ProfileAppearanceConfig = {
  color: '#3390EC',
  gradient: 'from-[#1E1B4B] via-[#0F172A] to-[#0A0F1D]',
  pattern: 'stars',
  badge: '⭐️',
  coverImage: null,
};

export const useAppearanceStore = create<AppearanceState>((set, get) => {
  // Load saved state from localStorage safely
  const savedGlobal = (() => {
    try {
      const raw = localStorage.getItem('becugram_global_wallpaper');
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_WALLPAPER;
  })();

  const savedChatWallpapers = (() => {
    try {
      const raw = localStorage.getItem('becugram_chat_wallpapers');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  })();

  const savedFavorites = (() => {
    try {
      const raw = localStorage.getItem('becugram_wallpaper_favorites');
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['default-telegram-dark', 'gradient-becu-mint', 'premium-celestial'];
  })();

  const savedRecentlyUsed = (() => {
    try {
      const raw = localStorage.getItem('becugram_wallpaper_recents');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [DEFAULT_WALLPAPER];
  })();

  const savedProfileAppearance = (() => {
    try {
      const raw = localStorage.getItem('becugram_profile_appearance');
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_PROFILE_APPEARANCE;
  })();

  return {
    globalWallpaper: savedGlobal,
    chatWallpapers: savedChatWallpapers,
    favorites: savedFavorites,
    recentlyUsed: savedRecentlyUsed,
    profileAppearance: savedProfileAppearance,

    setGlobalWallpaper: (wallpaper) => {
      localStorage.setItem('becugram_global_wallpaper', JSON.stringify(wallpaper));
      get().addRecentlyUsed(wallpaper);
      set({ globalWallpaper: wallpaper });
    },

    setChatWallpaper: (conversationId, wallpaper) => {
      set((state) => {
        const next = { ...state.chatWallpapers, [conversationId]: wallpaper };
        localStorage.setItem('becugram_chat_wallpapers', JSON.stringify(next));
        get().addRecentlyUsed(wallpaper);
        return { chatWallpapers: next };
      });
    },

    removeChatWallpaper: (conversationId) => {
      set((state) => {
        const next = { ...state.chatWallpapers };
        delete next[conversationId];
        localStorage.setItem('becugram_chat_wallpapers', JSON.stringify(next));
        return { chatWallpapers: next };
      });
    },

    getWallpaperForChat: (conversationId?: string, themeMode?: 'dark' | 'light') => {
      const state = get();
      if (conversationId && state.chatWallpapers[conversationId]) {
        return state.chatWallpapers[conversationId];
      }

      // If user configured a custom global wallpaper (different from auto-defaults)
      if (
        state.globalWallpaper &&
        state.globalWallpaper.id !== 'default-telegram-dark' &&
        state.globalWallpaper.id !== 'default-telegram-light'
      ) {
        return state.globalWallpaper;
      }

      // Automatically choose according to Light / Dark mode
      const isLight =
        themeMode === 'light' ||
        (typeof document !== 'undefined' && !document.documentElement.classList.contains('dark'));

      return isLight ? DEFAULT_LIGHT_WALLPAPER : DEFAULT_DARK_WALLPAPER;
    },

    toggleFavorite: (wallpaperId) => {
      set((state) => {
        const next = state.favorites.includes(wallpaperId)
          ? state.favorites.filter((id) => id !== wallpaperId)
          : [...state.favorites, wallpaperId];
        localStorage.setItem('becugram_wallpaper_favorites', JSON.stringify(next));
        return { favorites: next };
      });
    },

    addRecentlyUsed: (wallpaper) => {
      set((state) => {
        const filtered = state.recentlyUsed.filter((w) => w.id !== wallpaper.id);
        const next = [wallpaper, ...filtered].slice(0, 12);
        localStorage.setItem('becugram_wallpaper_recents', JSON.stringify(next));
        return { recentlyUsed: next };
      });
    },

    setProfileAppearance: (updates) => {
      set((state) => {
        const next = { ...state.profileAppearance, ...updates };
        localStorage.setItem('becugram_profile_appearance', JSON.stringify(next));
        return { profileAppearance: next };
      });
    },

    resetAllWallpapers: () => {
      localStorage.removeItem('becugram_global_wallpaper');
      localStorage.removeItem('becugram_chat_wallpapers');
      set({
        globalWallpaper: DEFAULT_WALLPAPER,
        chatWallpapers: {},
      });
    },
  };
});

