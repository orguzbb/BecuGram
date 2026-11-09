import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  accentColor: string;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const savedTheme = (localStorage.getItem('becugram_theme') as 'dark' | 'light') || 'dark';
  const savedAccent = localStorage.getItem('becugram_accent') || '#35CBA0';

  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  const applyAccent = (color: string) => {
    document.documentElement.style.setProperty('--becu-accent', color);
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-mint', color);
  };

  applyAccent(savedAccent);

  return {
    theme: savedTheme,
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
    setAccentColor: (color) => {
      localStorage.setItem('becugram_accent', color);
      applyAccent(color);
      set({ accentColor: color });
    },
  };
});

