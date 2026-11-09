import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  MessageSquare,
  Ban,
  CheckCircle,
  Search,
  Trash2,
  Send,
  Smartphone,
  Eye,
  RefreshCw,
  X,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'chats' | 'broadcast' | 'sms'>('users');
  const [isLoading, setIsLoading] = useState(true);

  // Stats & Lists
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  // Search filter
  const [userSearch, setUserSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');

  // Selected user chat activity modal ("Kimga yozganlari")
  const [inspectUser, setInspectUser] = useState<any | null>(null);
  const [userChatActivity, setUserChatActivity] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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
      const [statsRes, usersRes, chatsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminConversations(),
      ]);
      setStats(statsRes);
      setUsers(usersRes);
      setConversations(chatsRes);
    } catch (err: any) {
      showToast(err.message || 'Admin ma\'lumotlarini yuklashda xatolik', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleBan = async (user: any) => {
    const nextBanStatus = !user.isBanned;
    const reason = nextBanStatus
      ? prompt('Bloklash sababini kiriting (ixtiyoriy):', 'Qoidalarni buzganlik uchun')
      : undefined;

    try {
      await api.toggleUserBan(user._id, nextBanStatus, reason || undefined);
      showToast(
        nextBanStatus
          ? `${user.displayName} muvaffaqiyatli bloklandi.`
          : `${user.displayName} blokdan chiqarildi.`,
        'success'
      );
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleInspectUser = async (user: any) => {
    setInspectUser(user);
    setSelectedConversation(null);
    setIsLoadingMessages(true);
    try {
      const summary = await api.getUserChatSummary(user._id);
      setUserChatActivity(summary);
      if (summary.length > 0) {
        setSelectedConversation(summary[0]);
      }
    } catch {
      try {
        const msgs = await api.getUserMessages(user._id);
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

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm('Haqiqatan ham bu suhbatni butunlay o\'chirmoqchimisiz?')) return;
    try {
      await api.deleteAdminConversation(convId);
      showToast('Suhbat butunlay o\'chirildi.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'O\'chirishda xatolik', 'error');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await api.deleteAdminMessage(msgId);
      showToast('Xabar o\'chirildi', 'info');
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
      showToast(res.message || 'E\'lon muvaffaqiyatli tarqatildi!', 'success');
      setBroadcastTitle('');
      setBroadcastContent('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'E\'lon tarqatishda xatolik', 'error');
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
    const q = userSearch.toLowerCase();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.includes(q))
    );
  });

  const filteredConversations = conversations.filter((c) => {
    const q = chatSearch.toLowerCase();
    const title = c.type === 'direct' ? c.partner?.displayName || '' : c.group?.name || '';
    return title.toLowerCase().includes(q) || c._id.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#090D16] text-white flex flex-col overflow-hidden animate-fade-in select-none">
      {/* Top Admin Header */}
      <div className="h-16 px-6 bg-[#0E1524] border-b border-zinc-800/80 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">BecuGram Admin Panel</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                FAOL
              </span>
            </div>
            <p className="text-xs text-zinc-400">Foydalanuvchilar, xabarlar nazorati va Eskiz SMS monitoringi</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-xs font-bold text-rose-400 border border-rose-500/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Chiqish
          </button>
        </div>
      </div>

      {/* Main Admin Content Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0E1524] border border-zinc-800/70 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-0.5">Jami Foydalanuvchilar</span>
              <span className="text-2xl font-black text-white">{stats?.totalUsers ?? '...'}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E1524] border border-zinc-800/70 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-0.5">Jami Xabarlar</span>
              <span className="text-2xl font-black text-white">{stats?.totalMessages ?? '...'}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E1524] border border-zinc-800/70 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-0.5">Faol Suhbatlar</span>
              <span className="text-2xl font-black text-white">{stats?.totalChats ?? '...'}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Radio className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E1524] border border-zinc-800/70 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-0.5">Bloklanganlar</span>
              <span className="text-2xl font-black text-rose-400">{stats?.bannedUsers ?? 0}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Ban className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
            }`}
          >
            Foydalanuvchilar ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chats'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
            }`}
          >
            Suhbatlar & Xabarlar ({conversations.length})
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'broadcast'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
            }`}
          >
            Tizimli E'lon (Broadcast)
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sms'
                ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
            }`}
          >
            Eskiz.uz SMS Sozlamalari
          </button>
        </div>

        {/* TAB 1: USERS LIST */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Ism, telefon yoki username bo'yicha qidirish..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0E1524] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-[#0E1524] border border-zinc-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121B2D] text-zinc-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Foydalanuvchi</th>
                      <th className="py-3 px-4">Telefon</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">Xabarlar</th>
                      <th className="py-3 px-4">Holati</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-zinc-500">
                          Foydalanuvchilar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.displayName} src={u.avatar} size="sm" isOnline={u.isOnline} />
                              <div>
                                <span className="font-semibold text-white block">{u.displayName}</span>
                                <span className="text-zinc-400 text-[11px]">@{u.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-cyan-400">
                            <button
                              onClick={() => copyText(u.phoneNumber, 'Telefon')}
                              className="hover:underline flex items-center gap-1"
                              title="Nusxa olish"
                            >
                              <span>{u.phoneNumber || '—'}</span>
                              <Copy className="w-3 h-3 text-zinc-500" />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.role === 'admin'
                                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">{u.messageCount ?? 0}</td>
                          <td className="py-3 px-4">
                            {u.isBanned ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Bloklangan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Faol
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleInspectUser(u)}
                                className="px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                title="Xabarlarini ko'rish"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xabarlari</span>
                              </button>
                              <button
                                onClick={() => handleToggleBan(u)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                  u.isBanned
                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                }`}
                              >
                                {u.isBanned ? 'Blokdan chiqarish' : 'Bloklash'}
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
          </div>
        )}

        {/* TAB 2: CHATS & MESSAGES EXPLORER */}
        {activeTab === 'chats' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Suhbat nomi yoki ID bo'yicha..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0E1524] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredConversations.map((c) => {
                const title = c.type === 'direct' ? c.partner?.displayName || 'Suhbat' : c.group?.name || 'Guruh';
                return (
                  <div key={c._id} className="p-4 rounded-2xl bg-[#0E1524] border border-zinc-800 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          {c.type}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {c.messageCount ?? 0} ta xabar
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white truncate">{title}</h4>
                      <p className="text-xs text-zinc-400 truncate mt-1">ID: {c._id}</p>
                      <p className="text-xs text-zinc-500 truncate mt-1">
                        Oxirgi: {c.lastMessage?.content || '—'}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteConversation(c._id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Suhbatni o'chirish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BROADCAST ANNOUNCEMENT */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-[#0E1524] border border-zinc-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2">Barcha foydalanuvchilarga E'lon yuborish</h3>
            <p className="text-xs text-zinc-400 mb-5">
              Ushbu xabar platformadagi barcha faol suhbatlar va guruhlarga rasmiy admin xabari sifatida darhol yetkaziladi.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Sarlavha (ixtiyoriy)</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Masalan: Tizim yangilanishi"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#121B2D] border border-zinc-800 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Xabar matni</label>
                <textarea
                  rows={4}
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Barcha foydalanuvchilar uchun e'lon matni..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#121B2D] border border-zinc-800 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-3 rounded-2xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                {isBroadcasting ? 'Yuborilmoqda...' : 'E\'lonni barchaga tarqatish'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: ESKIZ.UZ SMS SETTINGS & TEST */}
        {activeTab === 'sms' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-[#0E1524] border border-zinc-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Eskiz.uz SMS Provayderi</h3>
                  <p className="text-xs text-zinc-400">O'zbekiston raqamlariga tezkor SMS jo'natish</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#121B2D] border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Holat:</span>
                  {stats?.smsProvider?.isConfigured ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Ulanishi faol (Real SMS)
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Dev / Simulyatsiya rejimi
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                <h4 className="font-bold text-cyan-400 text-sm">💡 Eskiz.uz dan qanday kalit olinadi?</h4>
                <ol className="list-decimal list-inside space-y-2 text-zinc-400">
                  <li><strong className="text-white">eskiz.uz</strong> saytiga kiring va ro'yxatdan o'ting.</li>
                  <li>Kabinetga kirib, profilingizdagi <strong className="text-white">Email</strong> va <strong className="text-white">Parol</strong> ni oling.</li>
                  <li>Loyiha <strong className="text-white">server/.env</strong> fayliga quyidagilarni yozing:</li>
                </ol>

                <div className="p-3 rounded-xl bg-black/40 font-mono text-xs text-emerald-400 border border-white/5 space-y-1">
                  <div>ESKIZ_EMAIL=sizning_eskiz_email@mail.com</div>
                  <div>ESKIZ_PASSWORD=sizning_eskiz_parolingiz</div>
                  <div>ESKIZ_FROM=4546</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#0E1524] border border-zinc-800 p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white">Jonli SMS yuborishni test qilish</h3>
              <p className="text-xs text-zinc-400">
                Istalgan O'zbekiston raqamini kiritib, SMS yetkazib berilishini tekshiring.
              </p>

              <form onSubmit={handleTestSms} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Telefon raqam</label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+998889008081"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#121B2D] border border-zinc-800 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingSms}
                  className="w-full py-3 rounded-2xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  {isSendingSms ? 'Yuborilmoqda...' : 'Test SMS Yuborish'}
                </button>
              </form>

              {smsTestResult && (
                <div className="p-4 rounded-2xl bg-[#121B2D] border border-blue-500/30 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-400">Natija:</div>
                  <div>Generatsiya qilingan kod: <strong className="text-white font-mono text-sm">{smsTestResult.data?.code}</strong></div>
                  <div>Simulyatsiya rejimi: <span className="text-zinc-400">{smsTestResult.data?.simulated ? 'Ha (Konsolga chiqarildi)' : 'Yo\'q (Haqiqiy SMS yuborildi)'}</span></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* INSPECT USER CHAT ACTIVITY MODAL WITH DIRECT MESSAGE COPY BUTTON! */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-4xl h-[90vh] rounded-3xl bg-[#0E1524] border border-zinc-800 flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Top Modal Header */}
            <div className="p-4 px-6 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#121B2D]">
              <div className="flex items-center gap-3">
                <Avatar name={inspectUser.displayName || 'User'} src={inspectUser.avatar} size="md" />
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{inspectUser.displayName || 'Foydalanuvchi'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">
                      @{inspectUser.username || 'user'}
                    </span>
                    {inspectUser.isBanned && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                        BLOKLANGAN
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {inspectUser.phoneNumber} &bull; Suhbatlar tarixi va kimga yozganlari nazorati
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Two-column layout (Left: Partners List, Right: Chat transcript) */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Partners List (Kimlar bilan yozishgan) */}
              <div className="w-full sm:w-72 border-r border-zinc-800 bg-[#0E1524] flex flex-col shrink-0 overflow-y-auto">
                <div className="p-3 border-b border-zinc-800 bg-[#121B2D]">
                  <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Suhbatdoshlar ({userChatActivity.length})
                  </h5>
                </div>

                {isLoadingMessages ? (
                  <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
                    Yuklanmoqda...
                  </div>
                ) : userChatActivity.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    Hali hech kim bilan yozishmagan
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/40 p-2 space-y-1">
                    {userChatActivity.map((activity) => {
                      const isSelected = selectedConversation?.conversationId === activity.conversationId;
                      return (
                        <div
                          key={activity.conversationId}
                          onClick={() => setSelectedConversation(activity)}
                          className={`p-2.5 rounded-2xl cursor-pointer transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                              : 'hover:bg-zinc-800/40 text-zinc-300 border border-transparent'
                          }`}
                        >
                          <Avatar
                            name={activity.partner.displayName}
                            src={activity.partner.avatar}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h6 className="text-xs font-bold truncate">
                                {activity.partner.displayName}
                              </h6>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-blue-400 font-mono">
                                {activity.messageCount}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate">
                              @{activity.partner.username}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Chat Transcript with Copy Button on every message! */}
              <div className="flex-1 flex flex-col bg-[#090D16] overflow-hidden">
                {selectedConversation ? (
                  <>
                    <div className="p-3.5 px-5 bg-[#0E1524] border-b border-zinc-800 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={selectedConversation.partner.displayName}
                          src={selectedConversation.partner.avatar}
                          size="sm"
                        />
                        <div>
                          <h5 className="text-xs font-bold text-white">
                            {inspectUser.displayName} ↔ {selectedConversation.partner.displayName}
                          </h5>
                          <span className="text-[10px] text-zinc-400">
                            Jami {selectedConversation.messages?.length || 0} ta xabar
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteConversation(selectedConversation.conversationId)}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Suhbatni tozalash
                      </button>
                    </div>

                    {/* Messages Scroll Area with instant COPY button! */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                        selectedConversation.messages.map((m: any) => {
                          const senderId = typeof m.senderId === 'object' ? m.senderId?._id : m.senderId;
                          const isInspectUserSender = senderId === inspectUser._id;

                          return (
                            <div
                              key={m._id}
                              className={`flex flex-col ${
                                isInspectUserSender ? 'items-end' : 'items-start'
                              } group`}
                            >
                              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-400">
                                <span className="font-semibold text-white/90">
                                  {isInspectUserSender ? inspectUser.displayName : selectedConversation.partner.displayName}
                                </span>
                                <span>&bull;</span>
                                <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>

                              <div className="flex items-center gap-2 max-w-[85%]">
                                <div
                                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm select-text ${
                                    isInspectUserSender
                                      ? 'bg-[#2563EB] text-white rounded-tr-sm'
                                      : 'bg-[#121B2D] text-zinc-100 border border-zinc-800 rounded-tl-sm'
                                  }`}
                                >
                                  {m.media?.url && (
                                    <div className="mb-1.5 rounded-lg overflow-hidden max-w-xs">
                                      <img src={m.media.url} alt="Media" className="max-h-48 object-cover rounded-lg" />
                                    </div>
                                  )}
                                  <p>{m.content || '[Fayl/Media biriktirilgan]'}</p>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  {/* ONE-CLICK MESSAGE COPY BUTTON */}
                                  <button
                                    onClick={() => copyText(m.content || '', 'Xabar')}
                                    title="Xabarni nusxalash"
                                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors shadow-xs"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  {/* DELETE MESSAGE BUTTON */}
                                  <button
                                    onClick={() => handleDeleteMessage(m._id)}
                                    title="Ushbu xabarni o'chirish"
                                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors shadow-xs"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-20 text-center text-xs text-zinc-400">
                          Ushbu suhbatda hali xabarlar yo'q
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-zinc-400">
                    <MessageSquare className="w-8 h-8 text-zinc-600 mb-2" />
                    <p>Suhbatdoshlardan birini tanlang</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Ular o'rtasida almashilgan barcha xabarlar shu yerda chiqadi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
