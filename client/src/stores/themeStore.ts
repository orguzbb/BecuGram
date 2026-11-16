import { create } from 'zustand';

export type DesignStyleId = 'classic' | 'emerald' | 'oled' | 'royal' | 'amber';

export interface DesignThemePreset {
  id: DesignStyleId;
  name: string;
  nameUz: string;
  accent: string;
  previewGradient: string;
  headerBgLight: string;
  headerBgDark: string;
  chatBgLight: string;
  chatBgDark: string;
}

export const DESIGN_THEMES: DesignThemePreset[] = [
  {
    id: 'classic',
    name: 'Telegram Classic',
    nameUz: 'Telegram Klassik',
    accent: '#3390EC',
    previewGradient: 'from-[#3390EC] to-[#8774E1]',
    headerBgLight: '#FFFFFF',
    headerBgDark: '#212121',
    chatBgLight: '#F4F4F5',
    chatBgDark: '#0F0F0F',
  },
  {
    id: 'emerald',
    name: 'Cyber Emerald',
    nameUz: 'Kiber Zangori',
    accent: '#10B981',
    previewGradient: 'from-[#064E3B] to-[#10B981]',
    headerBgLight: '#059669',
    headerBgDark: '#0F2922',
    chatBgLight: '#E8F5E9',
    chatBgDark: '#0B1713',
  },
  {
    id: 'oled',
    name: 'Midnight OLED',
    nameUz: 'Qop-qora OLED',
    accent: '#38BDF8',
    previewGradient: 'from-[#000000] via-[#111827] to-[#38BDF8]',
    headerBgLight: '#1E293B',
    headerBgDark: '#000000',
    chatBgLight: '#F1F5F9',
    chatBgDark: '#000000',
  },
  {
    id: 'royal',
    name: 'Imperial Purple',
    nameUz: 'Qirollik Binafsha',
    accent: '#8B5CF6',
    previewGradient: 'from-[#581C87] to-[#8B5CF6]',
    headerBgLight: '#7C3AED',
    headerBgDark: '#1E1435',
    chatBgLight: '#F3E8FF',
    chatBgDark: '#120A21',
  },
  {
    id: 'amber',
    name: 'Sunset Gold',
    nameUz: 'Oltin Quyosh',
    accent: '#F59E0B',
    previewGradient: 'from-[#78350F] to-[#F59E0B]',
    headerBgLight: '#D97706',
    headerBgDark: '#291809',
    chatBgLight: '#FEF3C7',
    chatBgDark: '#170E05',
  },
];

interface ThemeState {
  theme: 'dark' | 'light';
  designStyle: DesignStyleId;
  accentColor: string;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setDesignStyle: (style: DesignStyleId) => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const savedTheme = (localStorage.getItem('becugram_theme') as 'dark' | 'light') || 'dark';
  const savedStyle = (localStorage.getItem('becugram_design_style') as DesignStyleId) || 'classic';
  const savedAccent = localStorage.getItem('becugram_accent') || '#3390EC';

  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const applyThemeStyle = (styleId: DesignStyleId, accent: string) => {
    const preset = DESIGN_THEMES.find((t) => t.id === styleId) || DESIGN_THEMES[0];
    document.documentElement.setAttribute('data-design-style', styleId);
    document.documentElement.style.setProperty('--becu-accent', accent || preset.accent);
    if (styleId === 'classic' && (!accent || accent === '#2EA6FF' || accent === '#3390EC' || accent === '#8774E1')) {
      document.documentElement.style.removeProperty('--color-primary');
      document.documentElement.style.removeProperty('--color-mint');
    } else {
      document.documentElement.style.setProperty('--color-primary', accent || preset.accent);
      document.documentElement.style.setProperty('--color-mint', accent || preset.accent);
    }
  };

  applyThemeStyle(savedStyle, savedAccent);

  return {
    theme: savedTheme,
    designStyle: savedStyle,
    accentColor: savedAccent,
    setTheme: (theme) => {
      localStorage.setItem('becugram_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme });
    },
    toggleTheme: () => {
      set((state) => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('becugram_theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: nextTheme };
      });
    },
    setDesignStyle: (styleId) => {
      const preset = DESIGN_THEMES.find((t) => t.id === styleId) || DESIGN_THEMES[0];
      localStorage.setItem('becugram_design_style', styleId);
      localStorage.setItem('becugram_accent', preset.accent);
      applyThemeStyle(styleId, preset.accent);
      set({ designStyle: styleId, accentColor: preset.accent });
    },
    setAccentColor: (color) => {
      localStorage.setItem('becugram_accent', color);
      applyThemeStyle(get().designStyle, color);
      set({ accentColor: color });
    },
  };
});
