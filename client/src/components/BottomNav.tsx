import React from 'react';
import { MessageSquare, Phone, Settings, Sparkles } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAppearanceStore } from '../stores/appearanceStore';

export type NavTab = 'chats' | 'calls' | 'settings' | 'profile';

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
  const { profileAppearance } = useAppearanceStore();

  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A';
  const hasValidAvatar = Boolean(
    user?.avatar &&
    user.avatar.trim() !== '' &&
    !user.avatar.includes('1794151183673') &&
    !user.avatar.includes('unsplash')
  );

  const isPremium = Boolean(user?.isPremium || profileAppearance.badge);
  const badgeIcon = user?.premiumBadge || profileAppearance.badge || '⭐️';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#212121]/95 backdrop-blur-xl border-t border-[#DADCE0] dark:border-[#303030] z-30 select-none px-2 shadow-2xl flex items-center justify-around">
      {/* 1. CHATLAR TAB */}
      <button
        onClick={() => onTabChange('chats')}
        className={`group relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-300 active:scale-90 ${activeTab === 'chats'
            ? 'text-[#3390EC] dark:text-[#8774E1]'
            : 'text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
          }`}
      >
        <div className="relative">
          <MessageSquare
            className={`w-6 h-6 stroke-[2.1] transition-transform duration-300 ${activeTab === 'chats' ? 'scale-110 -rotate-3' : 'group-hover:scale-105'
              }`}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className={`text-[11px] mt-0.5 font-medium transition-all ${activeTab === 'chats' ? 'font-bold scale-105' : ''}`}>
          Chatlar
        </span>
      </button>

      {/* 2. QO'NG'IROQLAR TAB */}
      <button
        onClick={() => onTabChange('calls')}
        className={`group flex-1 flex flex-col items-center justify-center py-1 transition-all duration-300 active:scale-90 ${activeTab === 'calls'
            ? 'text-[#3390EC] dark:text-[#8774E1]'
            : 'text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
          }`}
      >
        <div className="relative">
          <Phone
            className={`w-6 h-6 stroke-[2.1] transition-transform duration-300 ${activeTab === 'calls' ? 'scale-110 rotate-12' : 'group-hover:scale-105'
              }`}
          />
        </div>
        <span className={`text-[11px] mt-0.5 font-medium transition-all ${activeTab === 'calls' ? 'font-bold scale-105' : ''}`}>
          Qo‘ng‘iroqlar
        </span>
      </button>

      {/* 3. SOZLAMALAR TAB */}
      <button
        onClick={() => onTabChange('settings')}
        className={`group flex-1 flex flex-col items-center justify-center py-1 transition-all duration-300 active:scale-90 ${activeTab === 'settings'
            ? 'text-[#3390EC] dark:text-[#8774E1]'
            : 'text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
          }`}
      >
        <div className="relative">
          <Settings
            className={`w-6 h-6 stroke-[2.1] transition-transform duration-500 ease-out ${activeTab === 'settings' ? 'rotate-90 scale-110' : 'group-hover:rotate-45'
              }`}
          />
        </div>
        <span className={`text-[11px] mt-0.5 font-medium transition-all ${activeTab === 'settings' ? 'font-bold scale-105' : ''}`}>
          Sozlamalar
        </span>
      </button>

      {/* 4. PROFIL TAB */}
      <button
        onClick={() => onTabChange('profile')}
        className={`group relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-300 active:scale-90 ${activeTab === 'profile'
            ? 'text-[#3390EC] dark:text-[#8774E1]'
            : 'text-[#707579] dark:text-[#AAAAAA] hover:text-black dark:hover:text-white'
          }`}
      >
        <div className="relative">
          <div
            className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center ring-2 transition-all ${activeTab === 'profile'
                ? 'ring-[#3390EC] dark:ring-[#8774E1] scale-110 shadow-sm'
                : 'ring-transparent group-hover:scale-105'
              }`}
          >
            {hasValidAvatar ? (
              <img
                src={user?.avatar}
                alt="Profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#3390EC] dark:bg-[#8774E1] text-white text-[10px] font-black flex items-center justify-center">
                {initial}
              </div>
            )}
          </div>
          {isPremium && (
            <span className="absolute -top-1 -right-1.5 text-[9px] select-none leading-none animate-bounce">
              {badgeIcon}
            </span>
          )}
        </div>
        <span className={`text-[11px] mt-0.5 font-medium transition-all ${activeTab === 'profile' ? 'font-bold scale-105' : ''}`}>
          Profil
        </span>
      </button>
    </div>
  );
};
