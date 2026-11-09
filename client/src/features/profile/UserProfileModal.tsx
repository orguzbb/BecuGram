import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Video,
  BellOff,
  Bell,
  FileText,
  ExternalLink,
  Image as ImageIcon,
  Film,
  Link2,
  X,
  Ban,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { CallModal } from '../../components/CallModal';
import { User, Message } from '../../types';
import { formatPhoneDisplay } from '../../utils/phone';
import { useToast } from '../../components/Toast';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

interface UserProfileModalProps {
  user: User;
  conversationId?: string;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  conversationId,
  onClose,
  onStartChat,
}) => {
  const { showToast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [isBlocked, setIsBlocked] = useState(() => {
    return Boolean(currentUser?.blockedUsers?.includes(user._id));
  });
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'files' | 'links'>('photos');
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const handleToggleBlock = async () => {
    try {
      const res = await api.toggleBlockUser(user._id);
      setIsBlocked(res.isBlocked);
      if (currentUser) {
        currentUser.blockedUsers = res.blockedUsers;
      }
      showToast(
        res.isBlocked
          ? `${user.displayName} bloklandi 🚫`
          : `${user.displayName} blokdan chiqarildi ✅`,
        res.isBlocked ? 'warning' : 'success'
      );
    } catch {
      showToast('Xatolik yuz berdi', 'error');
    }
  };

  // Real shared media extracted from actual conversation messages
  const [realMedia, setRealMedia] = useState<{
    photos: { id: string; url: string; title: string }[];
    videos: { id: string; url: string; title: string }[];
    files: { id: string; name: string; size: string; ext: string; url?: string }[];
    links: { id: string; title: string; url: string }[];
  }>({
    photos: [],
    videos: [],
    files: [],
    links: [],
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSharedMedia = async () => {
      let targetConvId = conversationId;

      // If conversationId not directly provided, find existing chat with this user
      if (!targetConvId) {
        try {
          const chats = await api.getChats();
          const directChat = chats.find(
            (c) => c.type === 'direct' && (c.partner?._id === user._id || c.participants?.includes(user._id))
          );
          if (directChat) {
            targetConvId = directChat._id;
          }
        } catch {}
      }

      if (!targetConvId) return;

      setIsLoadingMedia(true);
      try {
        const { messages } = await api.getMessages(targetConvId);
        if (!isMounted) return;

        const photos: { id: string; url: string; title: string }[] = [];
        const videos: { id: string; url: string; title: string }[] = [];
        const files: { id: string; name: string; size: string; ext: string; url?: string }[] = [];
        const links: { id: string; title: string; url: string }[] = [];

        const urlRegex = /(https?:\/\/[^\s]+)/g;

        messages.forEach((m: Message) => {
          // Photos
          if (m.type === 'image' && m.media?.url) {
            photos.push({
              id: m._id,
              url: m.media.url,
              title: m.content || 'Surat',
            });
          }

          // Videos
          if (m.type === 'video' && m.media?.url) {
            videos.push({
              id: m._id,
              url: m.media.url,
              title: m.content || 'Video',
            });
          }

          // Files & Audio
          if ((m.type === 'document' || m.type === 'voice' || m.type === 'audio' || (m.type as string) === 'file') && m.media) {
            const ext = m.media.name ? m.media.name.split('.').pop()?.toUpperCase() || 'FAYL' : 'OVOZ';
            const sizeStr = m.media.size ? `${Math.round(m.media.size / 1024)} KB` : 'Fayl';
            files.push({
              id: m._id,
              name: m.media.name || (m.type === 'voice' ? 'Ovozli xabar' : 'Hujjat'),
              size: sizeStr,
              ext,
              url: m.media.url,
            });
          }

          // Links
          if (m.content) {
            const foundUrls = m.content.match(urlRegex);
            if (foundUrls) {
              foundUrls.forEach((u, idx) => {
                links.push({
                  id: `${m._id}_link_${idx}`,
                  title: u.replace(/^https?:\/\//, '').split('/')[0] || u,
                  url: u,
                });
              });
            }
          }
        });

        setRealMedia({ photos, videos, files, links });
      } catch (err) {
        console.error('Failed to load shared media:', err);
      } finally {
        if (isMounted) setIsLoadingMedia(false);
      }
    };

    fetchSharedMedia();

    return () => {
      isMounted = false;
    };
  }, [user._id, conversationId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      {activeCall && (
        <CallModal
          type={activeCall}
          user={user}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      <div className="w-full sm:max-w-md h-full sm:h-[90vh] bg-white dark:bg-[#0E1715] sm:border border-zinc-200 dark:border-[#1E302A] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden text-zinc-900 dark:text-[#EDF4F1]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-[#1C2C27] bg-zinc-50 dark:bg-[#12201B]">
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8DA39A] dark:hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">Profil</span>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8DA39A] dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Profile Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Centered Profile Hero */}
          <div className="flex flex-col items-center pt-6 pb-4 px-6 text-center">
            <Avatar
              name={user.displayName}
              src={user.avatar}
              size="2xl"
              className="ring-4 ring-blue-500/20 dark:ring-blue-400/20 shadow-xl mb-3"
            />

            <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-snug flex items-center gap-1.5 justify-center">
              {user.displayName}
              {user.isVerified && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black" title="Tasdiqlangan">
                  ✓
                </span>
              )}
            </h2>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">@{user.username || 'user'}</p>
            {user.phoneNumber && (
              <p className="text-xs text-zinc-500 dark:text-[#8DA39A] mt-0.5">
                {formatPhoneDisplay(user.phoneNumber)}
              </p>
            )}

            {/* Quick Action Buttons (Chat, Call, Video, Mute) */}
            <div className="flex items-center justify-center gap-3.5 my-5 w-full">
              <button
                onClick={() => {
                  onClose();
                  if (onStartChat) onStartChat(user._id);
                }}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#142620] dark:hover:bg-[#1B352C] border border-zinc-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all shadow-xs"
                title="Suhbat ochish"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveCall('audio')}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#142620] dark:hover:bg-[#1B352C] border border-zinc-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all shadow-xs"
                title="Ovozli qo'ng'iroq"
              >
                <Phone className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveCall('video')}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#142620] dark:hover:bg-[#1B352C] border border-zinc-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all shadow-xs"
                title="Video qo'ng'iroq"
              >
                <Video className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  showToast(isMuted ? 'Ovoz yoqildi' : 'Xabarnomalar ovozi o‘chirildi', 'info');
                }}
                className={`w-12 h-12 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center transition-all shadow-xs ${
                  isMuted ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#142620] dark:hover:bg-[#1B352C] text-zinc-500 dark:text-[#8DA39A]'
                }`}
                title="Ovozni o‘chirish"
              >
                {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </button>
            </div>

            {/* Real Bio Card */}
            <div className="w-full p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] text-left">
              <span className="text-xs text-zinc-800 dark:text-[#EDF4F1] leading-relaxed block">
                <span className="text-zinc-500 dark:text-[#8DA39A] font-semibold mr-1.5">Bio:</span>
                {user.bio ? (
                  user.bio
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500 italic">Ma‘lumot kiritilmagan</span>
                )}
              </span>
            </div>
          </div>

          {/* Media Tabs: [Suratlar] [Videolar] [Fayllar] [Havolalar] */}
          <div className="border-t border-zinc-200 dark:border-[#1C2C27] px-4 pt-3">
            <div className="flex items-center justify-around pb-2">
              {[
                { id: 'photos', label: 'Suratlar', count: realMedia.photos.length },
                { id: 'videos', label: 'Videolar', count: realMedia.videos.length },
                { id: 'files', label: 'Fayllar', count: realMedia.files.length },
                { id: 'links', label: 'Havolalar', count: realMedia.links.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-xs font-semibold pb-1.5 transition-colors relative flex items-center gap-1 ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-[#8DA39A] dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Media Content Grid - Strictly Real Only */}
            <div className="py-3">
              {isLoadingMedia ? (
                <div className="flex items-center justify-center py-10 text-xs text-zinc-400">
                  Yuklanmoqda...
                </div>
              ) : (
                <>
                  {/* PHOTOS TAB */}
                  {activeTab === 'photos' && (
                    realMedia.photos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5">
                        {realMedia.photos.map((item) => (
                          <div
                            key={item.id}
                            className="aspect-square bg-zinc-100 dark:bg-[#14231E] rounded-xl overflow-hidden hover:opacity-90 cursor-pointer transition-opacity"
                          >
                            <img
                              src={item.url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-500">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-2 text-zinc-400">
                          <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <p className="text-xs font-medium">Hozircha suratlar yo‘q</p>
                      </div>
                    )
                  )}

                  {/* VIDEOS TAB */}
                  {activeTab === 'videos' && (
                    realMedia.videos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {realMedia.videos.map((item) => (
                          <div
                            key={item.id}
                            className="aspect-video bg-zinc-100 dark:bg-[#14231E] rounded-xl overflow-hidden relative group cursor-pointer"
                          >
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-500">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-2 text-zinc-400">
                          <Film className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <p className="text-xs font-medium">Hozircha videolar yo‘q</p>
                      </div>
                    )
                  )}

                  {/* FILES TAB */}
                  {activeTab === 'files' && (
                    realMedia.files.length > 0 ? (
                      <div className="space-y-2">
                        {realMedia.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] hover:bg-zinc-100 dark:hover:bg-[#182B25] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                {file.ext}
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-medium text-zinc-900 dark:text-white truncate max-w-[180px]">
                                  {file.name}
                                </p>
                                <span className="text-[10px] text-zinc-500 dark:text-[#8DA39A]">
                                  {file.size}
                                </span>
                              </div>
                            </div>
                            {file.url && (
                              <a
                                href={file.url}
                                download={file.name}
                                className="p-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-white rounded-lg transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-500">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-2 text-zinc-400">
                          <FileText className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <p className="text-xs font-medium">Hozircha fayllar yo‘q</p>
                      </div>
                    )
                  )}

                  {/* LINKS TAB */}
                  {activeTab === 'links' && (
                    realMedia.links.length > 0 ? (
                      <div className="space-y-2">
                        {realMedia.links.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] hover:bg-zinc-100 dark:hover:bg-[#182B25] transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Link2 className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <span className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors truncate block max-w-[200px]">
                                  {link.title}
                                </span>
                                <span className="text-[10px] text-zinc-500 dark:text-[#8DA39A] truncate block max-w-[200px]">
                                  {link.url}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-white shrink-0" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-500">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mb-2 text-zinc-400">
                          <Link2 className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <p className="text-xs font-medium">Hozircha havolalar yo‘q</p>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>

          {/* Block / Unblock User Action */}
          <div className="p-4 border-t border-zinc-200 dark:border-[#1C2C27] bg-zinc-50/50 dark:bg-[#0E1715]/50">
            <button
              onClick={handleToggleBlock}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs ${
                isBlocked
                  ? 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                  : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40'
              }`}
            >
              <Ban className="w-4 h-4" />
              <span>{isBlocked ? 'Foydalanuvchini blokdan chiqarish' : 'Foydalanuvchini bloklash'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
