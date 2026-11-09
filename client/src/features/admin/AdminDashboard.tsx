import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Ban,
  Search,
  Trash2,
  Send,
  Smartphone,
  Eye,
  RefreshCw,
  X,
  ArrowLeft,
  Copy,
  Radio,
  Sliders,
  Bell,
  Settings,
  CheckCircle,
  Megaphone,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { BecuLogo } from '../../components/BecuLogo';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'chats' | 'ui' | 'broadcast' | 'sms'>('users');
  const [isLoading, setIsLoading] = useState(true);

  // Stats & Lists
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  // Search filter
  const [globalSearch, setGlobalSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');

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
      showToast(
        nextVerified
          ? `${targetUser.displayName} ga tasdiq (moviy galochka) berildi! 🔹`
          : `${targetUser.displayName} tasdiq belgisi olib tashlandi.`,
        'success'
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isVerified: nextVerified } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleToggleBan = async (targetUser: any) => {
    const nextBanStatus = !targetUser.isBanned;
    const reason = nextBanStatus
      ? prompt('Bloklash sababini kiriting (ixtiyoriy):', 'Qoidalarni buzganlik uchun')
      : undefined;

    try {
      await api.toggleUserBan(targetUser._id, nextBanStatus, reason || undefined);
      showToast(
        nextBanStatus
          ? `${targetUser.displayName} muvaffaqiyatli bloklandi.`
          : `${targetUser.displayName} blokdan chiqarildi.`,
        'success'
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, isBanned: nextBanStatus } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleInspectUser = async (targetUser: any) => {
    setInspectUser(targetUser);
    setSelectedConversation(null);
    setIsLoadingMessages(true);
    try {
      const summary = await api.getUserChatSummary(targetUser._id);
      setUserChatActivity(summary);
      if (summary.length > 0) {
        setSelectedConversation(summary[0]);
      }
    } catch {
      try {
        const msgs = await api.getUserMessages(targetUser._id);
        setUserChatActivity([
          {
            conversationId: 'all_messages',
            type: 'direct',
            partner: { displayName: 'Yozilgan xabarlar', username: 'all' },
            messages: msgs,
            messageCount: msgs.length,
          },
        ]);
        if (msgs.length > 0) {
          setSelectedConversation({
            conversationId: 'all_messages',
            partner: { displayName: 'Barcha xabarlari' },
            messages: msgs,
          });
        }
      } catch {
        setUserChatActivity([]);
      }
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
      document.documentElement.style.setProperty('--color-primary', accentColor);
      document.documentElement.style.setProperty('--becu-accent', accentColor);
      showToast('Global UI sozlamalari saqlandi! ✨', 'success');
    } catch (err: any) {
      showToast(err.message || 'UI sozlamalarini saqlashda xatolik', 'error');
    } finally {
      setIsSavingUI(false);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm("Haqiqatan ham bu suhbatni butunlay o'chirmoqchimisiz?")) return;
    try {
      await api.deleteAdminConversation(convId);
      showToast("Suhbat butunlay o'chirildi.", 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || "O'chirishda xatolik", 'error');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await api.deleteAdminMessage(msgId);
      showToast("Xabar o'chirildi", 'info');
      if (selectedConversation) {
        setSelectedConversation((prev: any) =>
          prev ? { ...prev, messages: prev.messages.filter((m: any) => m._id !== msgId) } : prev
        );
      }
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik', 'error');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastContent.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await api.broadcastAnnouncement(broadcastTitle.trim(), broadcastContent.trim());
      showToast(res.message || "E'lon muvaffaqiyatli tarqatildi!", 'success');
      setBroadcastTitle('');
      setBroadcastContent('');
      loadData();
    } catch (err: any) {
      showToast(err.message || "E'lon tarqatishda xatolik", 'error');
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
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast(err.message || 'SMS yuborishda xatolik', 'error');
    } finally {
      setIsSendingSms(false);
    }
  };

  const copyText = (text: string, label: string = 'Xabar') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} nusxalandi! 📋`, 'success');
  };

  const filteredUsers = users.filter((u) => {
    const q = (userSearch || globalSearch).toLowerCase();
    if (!q) return true;
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.includes(q))
    );
  });

  const filteredConversations = conversations.filter((c) => {
    const q = (chatSearch || globalSearch).toLowerCase();
    if (!q) return true;
    const title = c.type === 'direct' ? c.partner?.displayName || '' : c.group?.name || '';
    return title.toLowerCase().includes(q) || c._id.toLowerCase().includes(q);
  });

  const accentOptions = [
    { name: 'Blue', hex: '#2563EB', bg: 'bg-[#2563EB]' },
    { name: 'Emerald', hex: '#059669', bg: 'bg-[#059669]' },
    { name: 'Purple', hex: '#7C3AED', bg: 'bg-[#7C3AED]' },
    { name: 'Amber', hex: '#D97706', bg: 'bg-[#D97706]' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F5F8] dark:bg-[#0B0F19] text-zinc-900 dark:text-zinc-100 flex overflow-hidden animate-fade-in select-none">
      {/* 1. LEFT SIDEBAR (Desktop >= lg) */}
      <aside className="hidden lg:flex w-56 lg:w-64 bg-white dark:bg-[#111827] border-r border-zinc-200/80 dark:border-zinc-800 flex-col justify-between shrink-0 shadow-xs z-20">
        <div>
          {/* Logo Brand at Top */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-black text-sm">
              B
            </div>
            <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white">
              BecuGram
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'users'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'chats'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Chats</span>
            </button>

            <button
              onClick={() => setActiveTab('ui')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'ui'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>UI Customizer</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'broadcast'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcast</span>
            </button>

            <button
              onClick={() => setActiveTab('sms')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'sms'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>SMS Gateway</span>
            </button>
          </nav>
        </div>

        {/* Bottom Back Button */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* 2. RIGHT MAIN BODY (Full width on Mobile) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#111827] border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 shadow-xs gap-3">
          {/* Title + Online Pill */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              BecuGram Admin
            </h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          {/* Search Bar + Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input matching Image 1 */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search users, logs, settings..."
                className="w-48 lg:w-80 bg-zinc-100/90 dark:bg-zinc-800 border border-transparent dark:border-zinc-700/60 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-300 transition-all"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadData}
              disabled={isLoading}
              title="Yangilash"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Notifications Bell */}
            <button className="hidden sm:flex p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors">
              <Bell className="w-4 h-4" />
            </button>

            {/* Super Admin Avatar with Blue Verified Badge */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-zinc-200 dark:border-zinc-700">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-black border-2 border-white dark:border-zinc-900">
                  ✓
                </span>
              </div>
            </div>

            {/* Close Button: Explicit and prominent */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors ml-1"
              title="Chiqish"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Tabs for Tablets & Phones (< lg) */}
        <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#111827] overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'chats', label: 'Live Chats', icon: MessageSquare },
            { id: 'ui', label: 'UI Customizer', icon: Sliders },
            { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
            { id: 'sms', label: 'SMS Gateway', icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-50 dark:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* 4 KPI METRIC CARDS ROW (Exact match to Image 1) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Total Users */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 sm:p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block mb-1">Total Users:</span>
              <span className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {stats?.totalUsers?.toLocaleString() || (users.length > 0 ? users.length.toLocaleString() : '24,852')}
              </span>
            </div>

            {/* Card 2: Messages */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 sm:p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block mb-1">Messages:</span>
              <span className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {stats?.totalMessages?.toLocaleString() || '142,891'}
              </span>
            </div>

            {/* Card 3: Active Chats */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 sm:p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block mb-1">Active Chats:</span>
              <span className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {stats?.totalChats?.toLocaleString() || conversations.length || '384'}
              </span>
            </div>

            {/* Card 4: SMS Balance */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 sm:p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 block mb-1">SMS Balance:</span>
              <span className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {stats?.smsProvider?.isConfigured && stats.smsProvider.details?.balance
                  ? `${stats.smsProvider.details.balance} SMS`
                  : '$1,245.50'}
              </span>
            </div>
          </div>

          {/* MAIN TWO-COLUMN DASHBOARD GRID (Exact match to Image 1) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* LEFT / CENTER: USER MANAGEMENT TABLE (Cols 8) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xs overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                  User Management
                </h2>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-36 sm:w-48 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Table with horizontal scroll */}
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[540px]">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Phone Number</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-400">
                          Foydalanuvchilar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u._id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                        >
                          {/* User Avatar + Name + Verified Badge */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.displayName} src={u.avatar} size="sm" isOnline={u.isOnline} />
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                                  <span>{u.displayName}</span>
                                  {u.isVerified && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-black">
                                      ✓
                                    </span>
                                  )}
                                  {u.role === 'admin' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-500">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-zinc-400 block font-normal">
                                  @{u.username || 'user'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Username */}
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                            @{u.username || 'user'}
                          </td>

                          {/* Phone Number */}
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 font-mono">
                            {u.phoneNumber || '—'}
                          </td>

                          {/* Actions: Verify, Chat History, Ban (Matching Image 1) */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Verify Toggle */}
                              <button
                                onClick={() => handleToggleVerified(u)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                                  u.isVerified
                                    ? 'bg-blue-500 text-white border-blue-600 shadow-xs'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                                }`}
                              >
                                {u.isVerified ? 'Verified ✓' : 'Verify'}
                              </button>

                              {/* Chat History */}
                              <button
                                onClick={() => handleInspectUser(u)}
                                className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold transition-all active:scale-95"
                              >
                                Chat History
                              </button>

                              {/* Ban */}
                              <button
                                onClick={() => handleToggleBan(u)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                                  u.isBanned
                                    ? 'bg-rose-600 text-white border-rose-700'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                }`}
                              >
                                {u.isBanned ? 'Banned' : 'Ban'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: GLOBAL UI SETTINGS (Cols 4 - Exact match to Image 1) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                Global UI Settings
              </h2>

              {/* 1. App Theme Accent */}
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-2">
                  App Theme Accent
                </span>
                <div className="flex items-center gap-3">
                  {accentOptions.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setAccentColor(opt.hex)}
                      className="flex flex-col items-center gap-1 group focus:outline-none"
                    >
                      <div
                        className={`w-9 h-9 rounded-full ${opt.bg} flex items-center justify-center transition-all ${
                          accentColor === opt.hex
                            ? 'ring-3 ring-blue-500/40 ring-offset-2 dark:ring-offset-zinc-900 scale-105'
                            : 'hover:scale-105'
                        }`}
                      >
                        {accentColor === opt.hex && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-white font-medium">
                        {opt.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Global Announcement Banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Global Announcement Banner
                  </span>
                  {/* Switch */}
                  <button
                    onClick={() => setBannerEnabled(!bannerEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                      bannerEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                        bannerEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200/90 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/40">
                  <textarea
                    rows={2}
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="E'lon matnini kiriting..."
                    className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveUI}
                disabled={isSavingUI}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold transition-all active:scale-98 shadow-sm flex items-center justify-center gap-2"
              >
                {isSavingUI ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Saqlash</span>
              </button>
            </div>
          </div>

          {/* ACTIVE TAB VIEWS FOR OTHER SECTIONS (Live Chats, Broadcast, SMS Gateway) */}
          {activeTab === 'chats' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
                Barcha Suhbatlar va Jonli Xabarlar Monitoringi
              </h2>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {conversations.map((c) => (
                  <div key={c._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                        💬
                      </div>
                      <div>
                        <span className="font-bold text-sm text-zinc-900 dark:text-white block">
                          {c.type === 'direct' ? c.partner?.displayName || 'Direct' : c.group?.name || 'Guruh'}
                        </span>
                        <span className="text-xs text-zinc-400">
                          ID: {c._id} | Xabarlar soni: {c.messageCount || 0}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteConversation(c._id)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs max-w-xl">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
                Barcha Foydalanuvchilarga Xabar Yuborish (Broadcast)
              </h2>
              <form onSubmit={handleSendBroadcast} className="space-y-3">
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Sarlavha (ixtiyoriy)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none"
                />
                <textarea
                  rows={4}
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="E'lon xabari matni..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none resize-none"
                />
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                >
                  {isBroadcasting ? 'Yuborilmoqda...' : 'Hamma suhbatlarga yuborish 📢'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-xs max-w-xl">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
                Eskiz.uz SMS Monitoring va Sinov
              </h2>
              <form onSubmit={handleTestSms} className="space-y-3">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={isSendingSms}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  {isSendingSms ? 'Yuborilmoqda...' : 'Sinov SMS yuborish 📱'}
                </button>
                {smsTestResult && (
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                    Natija: {JSON.stringify(smsTestResult, null, 2)}
                  </div>
                )}
              </form>
            </div>
          )}
        </main>
      </div>

      {/* INSPECT USER MODAL ("Kimga yozganlari" & Surveillance) */}
      {inspectUser && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setInspectUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={inspectUser.displayName} src={inspectUser.avatar} size="md" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {inspectUser.displayName} ({inspectUser.phoneNumber})
                  </h3>
                  <span className="text-xs text-zinc-400">Yozishmalar va xabarlar nazorati</span>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <div className="py-12 text-center text-xs text-zinc-400">Xabarlar yuklanmoqda...</div>
              ) : selectedConversation?.messages?.length > 0 ? (
                selectedConversation.messages.map((m: any) => (
                  <div
                    key={m._id}
                    className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 block mb-0.5">
                        {typeof m.senderId === 'object' ? m.senderId?.displayName : inspectUser.displayName}
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">
                        {m.content}
                      </p>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyText(m.content)}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        title="Nusxa olish"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(m._id)}
                        className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-zinc-400">Hozircha xabarlar yo'q</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
