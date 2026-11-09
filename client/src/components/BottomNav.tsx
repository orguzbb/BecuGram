import React from 'react';
import { MessageSquare, Settings } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export type NavTab = 'inbox' | 'settings' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
}) => {
  const { user } = useAuthStore();
  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A';
  const hasValidAvatar = Boolean(
    user?.avatar &&
    user.avatar.trim() !== '' &&
    !user.avatar.includes('1794151183673') &&
    !user.avatar.includes('unsplash')
  );

  return (
    <div className="fixed bottom-4 left-0 right-0 px-4 pointer-events-none z-40 select-none flex justify-center">
      <nav className="pointer-events-auto bg-white/95 dark:bg-[#14231E]/95 backdrop-blur-xl border border-zinc-200/80 dark:border-[#233830] rounded-full p-2 shadow-2xl shadow-black/10 flex items-center justify-center gap-3 transition-all">
        {/* 1. CHATLAR - CIRCULAR BUTTON */}
        <button
          onClick={() => onTabChange('inbox')}
          title="Chatlar"
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            activeTab === 'inbox'
              ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 scale-105'
              : 'text-zinc-600 dark:text-[#8DA39A] hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1A2E26]'
          }`}
        >
          <MessageSquare className="w-5 h-5 stroke-[2.2]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-black flex items-center justify-center shadow-md">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* 2. SOZLAMALAR - CIRCULAR BUTTON WITH GEAR ANIMATION */}
        <button
          onClick={() => onTabChange('settings')}
          title="Sozlamalar"
          className={`group w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            activeTab === 'settings'
              ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 scale-105'
              : 'text-zinc-600 dark:text-[#8DA39A] hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1A2E26]'
          }`}
        >
          <Settings className="w-5 h-5 stroke-[2.2] group-hover:rotate-180 group-active:rotate-[360deg] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" />
        </button>

        {/* 3. PROFIL - CIRCULAR BUTTON */}
        <button
          onClick={() => onTabChange('profile')}
          title="Profil"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            activeTab === 'profile'
              ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400 scale-105'
              : 'text-zinc-600 dark:text-[#8DA39A] hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1A2E26]'
          }`}
        >
          {hasValidAvatar ? (
            <img
              src={user?.avatar}
              alt="Profil"
              className="w-7 h-7 rounded-full object-cover ring-1 ring-white/50"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 text-current text-xs font-black flex items-center justify-center">
              {initial}
            </div>
          )}
        </button>
      </nav>
    </div>
  );
};
