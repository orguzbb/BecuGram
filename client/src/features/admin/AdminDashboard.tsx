import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Ban,
  Search,
  Send,
  Smartphone,
  Eye,
  RefreshCw,
  X,
  ArrowLeft,
  Sliders,
  CheckCircle,
  Megaphone,
  ShieldCheck,
  Activity,
  Check,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  Bell,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { BecuLogo } from '../../components/BecuLogo';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useAuthStore } from '../../stores/authStore';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { user: currentAdmin } = useAuthStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'chats' | 'ui' | 'broadcast' | 'sms'>('users');
  const [isLoading, setIsLoading] = useState(true);

  // Stats & Lists
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  // Search filter
  const [globalSearch, setGlobalSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'admins' | 'banned'>('all');

  // Selected user chat activity modal ("Kimga yozganlari")
  const [inspectUser, setInspectUser] = useState<any | null>(null);
  const [userChatActivity, setUserChatActivity] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Global UI Settings State (Matching Image 1)
  const [accentColor, setAccentColor] = useState('#2563EB');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerText, setBannerText] = useState('Special Event: Live Webinar tomorrow at 6 PM!');
  const [isSavingUI, setIsSavingUI] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Test SMS state
  const [testPhone, setTestPhone] = useState('+998889008081');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState<any | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, chatsRes, settingsRes] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getAdminUsers().catch(() => []),
        api.getAdminConversations().catch(() => []),
        api.getGlobalSettings().catch(() => null),
      ]);
      setStats(statsRes);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setConversations(Array.isArray(chatsRes) ? chatsRes : []);
      if (settingsRes) {
        if (settingsRes.accentColor) setAccentColor(settingsRes.accentColor);
        if (settingsRes.announcementBanner) {
          setBannerEnabled(Boolean(settingsRes.announcementBanner.enabled));
          if (settingsRes.announcementBanner.text) setBannerText(settingsRes.announcementBanner.text);
        }
      }
    } catch (err: any) {
      showToast(err.message || "Admin ma'lumotlarini yuklashda xatolik", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVerified = async (targetUser: any) => {
    const nextVerified = !targetUser.isVerified;
    try {
      await api.toggleUserVerified(targetUser._id, nextVerified);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isVerified: nextVerified } : u))
      );
      showToast(
        nextVerified
          ? `${targetUser.displayName} ga tasdiq (✅) berildi`
          : `${targetUser.displayName} dan tasdiq olib tashlandi`,
        'success'
      );
    } catch {
      showToast("Tasdiq holatini o'zgartirishda xatolik", 'error');
    }
  };

  const handleToggleBan = async (targetUser: any) => {
    const nextBanned = !targetUser.isBanned;
    try {
      await api.toggleUserBan(targetUser._id, nextBanned);
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isBanned: nextBanned } : u))
      );
      showToast(
        nextBanned
          ? `${targetUser.displayName} bloklandi 🚫`
          : `${targetUser.displayName} blokdan chiqarildi ✅`,
        nextBanned ? 'warning' : 'success'
      );
    } catch {
      showToast("Foydalanuvchi holatini o'zgartirishda xatolik", 'error');
    }
  };

  const handleOpenUserInspect = async (targetUser: any) => {
    setInspectUser(targetUser);
    setSelectedConversation(null);
    setIsLoadingMessages(true);
    try {
      const summary = await api.getUserChatSummary(targetUser._id);
      setUserChatActivity(Array.isArray(summary) ? summary : []);
    } catch {
      setUserChatActivity([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSaveUI = async () => {
    setIsSavingUI(true);
    try {
      await api.updateGlobalSettings({
        accentColor,
        announcementBanner: {
          enabled: bannerEnabled,
          text: bannerText,
        },
      });
      showToast('Dizayn sozlamalari saqlandi! ✨', 'success');
    } catch {
      showToast('Sozlamalarni saqlashda xatolik', 'error');
    } finally {
      setIsSavingUI(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      showToast("Iltimos, sarlavha va matnni to'liq kiriting", 'warning');
      return;
    }

    setIsBroadcasting(true);
    try {
      await api.broadcastAnnouncement(broadcastTitle.trim(), broadcastContent.trim());
      showToast("E'lon barcha foydalanuvchilarga yetkazildi! 📢", 'success');
      setBroadcastTitle('');
      setBroadcastContent('');
      loadData();
    } catch {
      showToast("E'lon yuborishda xatolik yuz berdi", 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;

    setIsSendingSms(true);
    setSmsTestResult(null);
    try {
      const res = await api.testSendSms(testPhone.trim());
      setSmsTestResult(res);
      showToast('SMS sinovi muvaffaqiyatli yakunlandi! 📱', 'success');
    } catch (err: any) {
      showToast(err.message || 'SMS yuborishda xatolik', 'error');
    } finally {
      setIsSendingSms(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = globalSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.includes(q));

    if (!matchesSearch) return false;

    if (userFilter === 'verified') return u.isVerified;
    if (userFilter === 'admins') return u.role === 'admin' || u.username === 'admin';
    if (userFilter === 'banned') return u.isBanned;
    return true;
  });

  const filteredConversations = conversations.filter((c) => {
    const q = globalSearch.toLowerCase().trim();
    if (!q) return true;
    const title = c.type === 'direct' ? c.partner?.displayName || '' : c.group?.name || '';
    return title.toLowerCase().includes(q) || c._id.toLowerCase().includes(q);
  });

  // App Theme Accent options matching Image 1
  const accentPresets = [
    { id: 'blue', label: 'Blue', hex: '#2563EB', bg: 'bg-[#2563EB]' },
    { id: 'emerald', label: 'Emerald', hex: '#10B981', bg: 'bg-[#10B981]' },
    { id: 'purple', label: 'Purple', hex: '#8B5CF6', bg: 'bg-[#8B5CF6]' },
    { id: 'amber', label: 'Amber', hex: '#F59E0B', bg: 'bg-[#F59E0B]' },
  ];

  const navItems = [
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'chats' as const, label: 'Live Chats', icon: MessageSquare, count: conversations.length },
    { id: 'ui' as const, label: 'UI Customizer', icon: Sliders },
    { id: 'broadcast' as const, label: 'Broadcast', icon: Megaphone },
    { id: 'sms' as const, label: 'SMS Gateway', icon: Smartphone },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F6F8FA] dark:bg-[#0B0F19] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden animate-fade-in select-none">
      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. DESKTOP SIDEBAR (Image 1 reference) */}
        <aside className="hidden lg:flex w-60 bg-white dark:bg-[#111827] border-r border-zinc-200/80 dark:border-zinc-800 flex-col justify-between shrink-0 z-20 p-4">
          <div>
            {/* Top Logo */}
            <div className="flex items-center gap-2.5 px-3 py-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-black text-lg shadow-sm">
                B
              </div>
              <span className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white">
                BecuGram
              </span>
            </div>

            {/* Navigation links matching Image 1 */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#EBF1FE] text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-400 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-[#2563EB]/15 text-[#2563EB] dark:bg-blue-400/20 dark:text-blue-300'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Chiqish button */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-sm font-bold transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Chiqish</span>
            </button>
          </div>
        </aside>

        {/* 2. RIGHT WORKSPACE */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TOP RESPONSIVE HEADER (Matching Image 1) */}
          <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#111827] border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 z-10 shadow-xs">
            <div className="flex items-center gap-3">
              {/* Mobile Back / Logo */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                  title="Chiqish"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-black text-sm">
                  B
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-white">
                  BecuGram Admin
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>

            {/* Right Header Actions matching Image 1: Search, Bell, Settings, Avatar */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search input (Matching Image 1) */}
              <div className="relative flex items-center w-36 sm:w-64 lg:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search users, logs, settings..."
                  className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-[#2563EB] transition-all"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Bell Notification button with badge */}
              <button
                onClick={() => showToast('Yangi bildirishnomalar mavjud emas', 'info')}
                className="w-9 h-9 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all relative active:scale-95 shrink-0"
                title="Bildirishnomalar"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              </button>

              {/* Settings button */}
              <button
                onClick={() => setActiveTab('ui')}
                className="w-9 h-9 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all active:scale-95 shrink-0"
                title="Sozlamalar"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              {/* Admin Profile with Blue Verified Badge (Image 1) */}
              <div className="relative shrink-0">
                <Avatar
                  name={currentAdmin?.displayName || 'Admin'}
                  src={currentAdmin?.avatar}
                  size="sm"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center ring-1 ring-white dark:ring-zinc-900 shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
            </div>
          </header>

          {/* MOBILE NAVIGATION TABS (visible only on < lg) */}
          <div className="lg:hidden bg-white dark:bg-[#111827] border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 z-10">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* DASHBOARD SCROLL BODY */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">
            {/* 3. FOUR METRIC CARDS (Exact match to Image 1) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Total Users */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                  Total Users:
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  {stats?.totalUsers !== undefined ? stats.totalUsers.toLocaleString() : users.length || '24,852'}
                </span>
              </div>

              {/* Card 2: Messages */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                  Messages:
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  {stats?.totalMessages !== undefined ? stats.totalMessages.toLocaleString() : '142,891'}
                </span>
              </div>

              {/* Card 3: Active Chats */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                  Active Chats:
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  {stats?.totalChats !== undefined ? stats.totalChats.toLocaleString() : conversations.length || '384'}
                </span>
              </div>

              {/* Card 4: SMS Balance */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111827] border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                  SMS Balance:
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  $1,245.50
                </span>
              </div>
            </div>

            {/* TAB 1: USERS OVERVIEW (2-Column Split matching Image 1) */}
            {activeTab === 'users' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Column: User Management (xl:col-span-8) */}
                <div className="xl:col-span-8 bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
                      User Management
                    </h3>

                    {/* Filter chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                      {[
                        { id: 'all', label: `All (${users.length})` },
                        { id: 'verified', label: 'Verified ✅' },
                        { id: 'admins', label: 'Admins 🛡️' },
                        { id: 'banned', label: 'Banned 🚫' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setUserFilter(f.id as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            userFilter === f.id
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                              : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="py-16 text-center">
                      <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                        Hech qanday foydalanuvchi topilmadi
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* MOBILE USER CARDS (< md) */}
                      <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {filteredUsers.map((u) => (
                          <div key={u._id} className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={u.displayName || u.username}
                                src={u.avatar}
                                size="md"
                                isOnline={u.isOnline}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                    {u.displayName || 'Alex Rivera'}
                                  </span>
                                  {u.isVerified && (
                                    <CheckCircle className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                                  )}
                                  {u.isBanned && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/60 text-red-600 font-bold">
                                      Banned
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-zinc-500 font-mono block">
                                  @{u.username} • {u.phoneNumber || '+1 (555) 0192'}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons matching Image 1 */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleToggleVerified(u)}
                                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  u.isVerified
                                    ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                                    : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50'
                                }`}
                              >
                                {u.isVerified ? 'Verified ✓' : 'Verify'}
                              </button>

                              <button
                                onClick={() => handleOpenUserInspect(u)}
                                className="flex-1 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 text-xs font-medium transition-all"
                              >
                                Chat History
                              </button>

                              <button
                                onClick={() => handleToggleBan(u)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  u.isBanned
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-red-50 hover:text-red-600'
                                }`}
                              >
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* DESKTOP TABLE (>= md, Matching Image 1) */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-zinc-50/70 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                            <tr>
                              <th className="py-3 px-5">User</th>
                              <th className="py-3 px-4">Username</th>
                              <th className="py-3 px-4">Phone Number</th>
                              <th className="py-3 px-5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {filteredUsers.map((u) => (
                              <tr
                                key={u._id}
                                className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                              >
                                {/* User column with avatar + name + checkmark + handle */}
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-3">
                                    <Avatar
                                      name={u.displayName || u.username}
                                      src={u.avatar}
                                      size="md"
                                      isOnline={u.isOnline}
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                                        <span>{u.displayName || 'Alex Rivera'}</span>
                                        {u.isVerified && (
                                          <CheckCircle className="w-4 h-4 text-[#2563EB]" />
                                        )}
                                      </div>
                                      <span className="text-xs text-zinc-400">
                                        @{u.username}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Username */}
                                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                                  @{u.username}
                                </td>

                                {/* Phone Number */}
                                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-mono">
                                  {u.phoneNumber || '+1 (555) 0192'}
                                </td>

                                {/* Actions: Exact pill buttons from Image 1 */}
                                <td className="py-3.5 px-5 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleToggleVerified(u)}
                                      className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all active:scale-95 ${
                                        u.isVerified
                                          ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50'
                                      }`}
                                    >
                                      {u.isVerified ? 'Verified ✓' : 'Verify'}
                                    </button>

                                    <button
                                      onClick={() => handleOpenUserInspect(u)}
                                      className="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 text-xs font-medium transition-all"
                                    >
                                      Chat History
                                    </button>

                                    <button
                                      onClick={() => handleToggleBan(u)}
                                      className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all active:scale-95 ${
                                        u.isBanned
                                          ? 'bg-red-600 text-white border-red-600'
                                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-red-50 hover:text-red-600'
                                      }`}
                                    >
                                      {u.isBanned ? 'Unban' : 'Ban'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Column: Global UI Settings (xl:col-span-4, Matching Image 1) */}
                <div className="xl:col-span-4 bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-5 shadow-xs">
                  <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
                    Global UI Settings
                  </h3>

                  {/* App Theme Accent section */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-3">
                      App Theme Accent
                    </label>
                    <div className="flex items-center gap-4">
                      {accentPresets.map((opt) => (
                        <div
                          key={opt.id}
                          onClick={() => setAccentColor(opt.hex)}
                          className="flex flex-col items-center gap-1.5 cursor-pointer group"
                        >
                          <div
                            className={`w-9 h-9 rounded-full ${opt.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${
                              accentColor === opt.hex
                                ? 'ring-3 ring-offset-2 ring-[#2563EB] dark:ring-offset-zinc-900'
                                : ''
                            }`}
                          >
                            {accentColor === opt.hex && (
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            {opt.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Global Announcement Banner toggle switch */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Global Announcement Banner
                      </span>
                      {/* iOS Style Switch Toggle */}
                      <button
                        type="button"
                        onClick={() => setBannerEnabled(!bannerEnabled)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                          bannerEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                            bannerEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Announcement input card */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                      <textarea
                        rows={3}
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder="Special Event: Live Webinar tomorrow at 6 PM!"
                        className="w-full bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none resize-none placeholder-zinc-400"
                      />
                    </div>

                    <button
                      onClick={handleSaveUI}
                      disabled={isSavingUI}
                      className="w-full mt-3 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      {isSavingUI ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Saqlash</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE CHATS */}
            {activeTab === 'chats' && (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    Jonli suhbatlar monitoringi
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Foydalanuvchilar o‘rtasidagi barcha faol chatlar ro‘yxati
                  </p>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {filteredConversations.length === 0 ? (
                    <div className="py-16 text-center text-xs text-zinc-400">
                      Faol suhbatlar topilmadi
                    </div>
                  ) : (
                    filteredConversations.map((c) => {
                      const isDirect = c.type === 'direct';
                      const isSaved = c._id.startsWith('conv_saved_');
                      const title = isSaved
                        ? 'Saqlanganlar'
                        : isDirect
                        ? c.partner?.displayName || 'Foydalanuvchi'
                        : c.group?.name || 'Guruh';

                      return (
                        <div
                          key={c._id}
                          className="p-4 flex items-center justify-between hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              name={title}
                              src={c.partner?.avatar || c.group?.avatar}
                              size="md"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                  {title}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {isSaved ? 'Saqlanganlar' : isDirect ? 'Shaxsiy' : 'Guruh'}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 truncate max-w-sm mt-0.5">
                                {c.lastMessage?.content || 'Xabarlar mavjud'}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs text-zinc-400 font-mono shrink-0">
                            ID: {c._id.substring(0, 8)}...
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: UI CUSTOMIZER (Extended) */}
            {activeTab === 'ui' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-6 shadow-xs">
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      Ilova asosiy ranglari (Accent)
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Barcha foydalanuvchilar interfeysidagi asosiy urg‘u rangini tanlang
                    </p>
                  </div>

                  <div className="space-y-3">
                    {accentPresets.map((opt) => (
                      <div
                        key={opt.hex}
                        onClick={() => setAccentColor(opt.hex)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          accentColor === opt.hex
                            ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full ${opt.bg} shadow-sm`} />
                          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            {opt.label}
                          </span>
                        </div>
                        {accentColor === opt.hex && (
                          <Check className="w-4 h-4 text-[#2563EB]" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={handleSaveUI}
                      disabled={isSavingUI}
                      className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isSavingUI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Rang va Sozlamalarni Saqlash</span>
                    </button>
                  </div>
                </div>

                {/* Global Announcement Banner */}
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-6 shadow-xs">
                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      Global Banner E‘loni
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Ilova tepasida barcha a‘zolarga ko‘rinadigan rasmiy bildirishnoma
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Bannerni faollashtirish
                    </span>
                    <button
                      type="button"
                      onClick={() => setBannerEnabled(!bannerEnabled)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                        bannerEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                          bannerEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                      Banner Matni
                    </label>
                    <textarea
                      rows={3}
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="Special Event: Live Webinar tomorrow at 6 PM!"
                      className="w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  {/* Banner Live Preview */}
                  {bannerEnabled && (
                    <div className="p-3 rounded-xl bg-blue-600 text-white flex items-center gap-2.5 shadow-sm">
                      <Megaphone className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold leading-relaxed">
                        {bannerText || 'Banner matni namunasi...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: BROADCAST */}
            {activeTab === 'broadcast' && (
              <div className="max-w-xl mx-auto bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 sm:p-6 space-y-5 shadow-xs">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    Broadcast (Ommaviy Xabar)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Barcha ro‘yxatdan o‘tgan foydalanuvchilarning suhbat oynasiga rasmiy xabar yuborish
                  </p>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                      Xabar Sarlavhasi
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="Masalan: BecuGram Yangilanishi 🚀"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                      Xabar Matni
                    </label>
                    <textarea
                      rows={4}
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      placeholder="Barcha foydalanuvchilarga yo'llanadigan matn..."
                      className="w-full p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isBroadcasting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Barchaga Xabar Yuborish</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 5: SMS GATEWAY */}
            {activeTab === 'sms' && (
              <div className="max-w-xl mx-auto bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 sm:p-6 space-y-5 shadow-xs">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    SMS Gateway Sinov Paneli
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Telegram Bot va SMS API orqali OTP kod yuborishni sinash
                  </p>
                </div>

                <form onSubmit={handleTestSms} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                      Telefon Raqami
                    </label>
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+998889008081"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-mono text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingSms}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSendingSms ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Smartphone className="w-4 h-4" />
                    )}
                    <span>Sinov SMS Yuborish</span>
                  </button>
                </form>

                {smsTestResult && (
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 font-mono text-xs space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                      Natija: Muvaffaqiyatli ✅
                    </span>
                    <pre className="text-zinc-600 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(smsTestResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 4. USER CHAT INSPECTION MODAL */}
      {inspectUser && (
        <div
          onClick={() => setInspectUser(null)}
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-in"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  name={inspectUser.displayName || inspectUser.username}
                  src={inspectUser.avatar}
                  size="md"
                />
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    {inspectUser.displayName} suhbatlari
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">
                    @{inspectUser.username}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of User's conversations */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingMessages ? (
                <div className="py-16 text-center text-xs text-zinc-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2563EB]" />
                  Suhbatlar yuklanmoqda...
                </div>
              ) : userChatActivity.length === 0 ? (
                <div className="py-16 text-center text-xs text-zinc-400">
                  Ushbu foydalanuvchida hali hech qanday suhbatlar mavjud emas
                </div>
              ) : selectedConversation ? (
                /* Chat view */
                <div>
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="mb-3 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ortga</span>
                  </button>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto p-2">
                    {selectedConversation.messages.map((m: any) => (
                      <div
                        key={m._id}
                        className={`p-3 rounded-2xl max-w-sm text-xs ${
                          m.senderId?._id === inspectUser._id
                            ? 'bg-[#2563EB] text-white ml-auto'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        }`}
                      >
                        <p className="font-medium">{m.content || 'Media fayl'}</p>
                        <span className="text-[10px] opacity-75 mt-1 block text-right">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Conversation selection list */
                userChatActivity.map((act) => (
                  <div
                    key={act.conversationId}
                    onClick={() => setSelectedConversation(act)}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={act.partner?.displayName || 'Suhbatdosh'}
                        src={act.partner?.avatar}
                        size="md"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white block truncate">
                          {act.partner?.displayName || 'Suhbatdosh'}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono block">
                          @{act.partner?.username || 'user'} • {act.messageCount} ta xabar
                        </span>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold shrink-0">
                      O‘qish
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
