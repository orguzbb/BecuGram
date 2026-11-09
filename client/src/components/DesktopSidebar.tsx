import React from 'react';
import { MessageSquare, Settings, LogOut, ShieldCheck, User } from 'lucide-react';
import { BecuLogo } from './BecuLogo';
import { Avatar } from './Avatar';
import { NavTab } from './BottomNav';
import { useAuthStore } from '../stores/authStore';

interface DesktopSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAdmin?: () => void;
  unreadCount?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAdmin,
  unreadCount = 0,
}) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { id: 'inbox' as NavTab, label: 'Chatlar', icon: MessageSquare, badge: unreadCount },
    { id: 'settings' as NavTab, label: 'Sozlamalar', icon: Settings },
    { id: 'profile' as NavTab, label: 'Profil', icon: User },
  ];

  return (
    <aside className="hidden sm:flex flex-col items-center justify-between w-18 lg:w-20 py-5 bg-[#FAF6F0] dark:bg-[#0A1210] border-r border-[#E8DFD3] dark:border-[#1B2A25] select-none z-30 transition-colors">
      {/* Top: Logo */}
      <div className="flex flex-col items-center gap-6">
        <button onClick={() => onTabChange('inbox')} className="hover:scale-105 active:scale-95 transition-transform">
          <BecuLogo size={38} />
        </button>

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center gap-3 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isSettings = item.id === 'settings';
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                  isActive
                    ? item.id === 'profile'
                      ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-[#A65819] text-white shadow-md shadow-[#A65819]/25'
                    : 'text-[#6E5D4E] dark:text-[#8DA39A] hover:text-[#1E1915] dark:hover:text-[#EDF4F1] hover:bg-black/5 dark:hover:bg-[#14231E]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'} ${
                    isSettings ? 'group-hover:rotate-180 group-active:rotate-[360deg] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]' : ''
                  }`}
                />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#A65819] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* Admin Panel Button (Strictly only for Super Admin) */}
          {(user?.role === 'admin' || user?.phoneNumber === '+998889008081') && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="Admin Panel"
              className="flex items-center justify-center w-12 h-12 rounded-2xl text-rose-500 hover:text-white hover:bg-rose-500/20 transition-all border border-rose-500/30"
            >
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}
        </nav>
      </div>

      {/* Bottom: Profile Avatar & Logout */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => onTabChange('profile')}
          title="Mening profilim"
          className="hover:scale-105 active:scale-95 transition-transform"
        >
          <Avatar
            name={user?.displayName || 'Abdurahim'}
            src={user?.avatar}
            size="md"
            isOnline={true}
          />
        </button>

        <button
          onClick={logout}
          title="Chiqish"
          className="text-zinc-400 dark:text-[#8DA39A] hover:text-[#F43F5E] p-2 rounded-xl hover:bg-black/5 dark:hover:bg-[#1A2622] transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
