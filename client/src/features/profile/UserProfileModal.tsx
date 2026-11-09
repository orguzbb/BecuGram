import React, { useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  MessageSquare,
  Phone,
  Video,
  BellOff,
  Bell,
  FileText,
  ExternalLink,
  Download,
  X,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { CallModal } from '../../components/CallModal';
import { User } from '../../types';
import { formatPhoneDisplay } from '../../utils/phone';
import { useToast } from '../../components/Toast';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onStartChat,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'files' | 'links'>('photos');
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Sample media matching Screen 06
  const mediaItems = {
    photos: [
      { id: '1', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80', title: 'Workstation' },
      { id: '2', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=80', title: 'Laptop code' },
      { id: '3', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80', title: 'Design review' },
      { id: '4', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80', title: 'Analytics dashboard' },
      { id: '5', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80', title: 'Team sync' },
      { id: '6', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80', title: 'Product wireframes' },
    ],
    videos: [
      { id: 'v1', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500&auto=format&fit=crop&q=80', title: 'Demo recording 0:34' },
      { id: 'v2', url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500&auto=format&fit=crop&q=80', title: 'Tutorial session 2:15' },
    ],
    files: [
      { id: 'f1', name: 'Design_System_Spec.pdf', size: '4.2 MB', ext: 'PDF' },
      { id: 'f2', name: 'BecuGram_Architecture.pdf', size: '2.8 MB', ext: 'PDF' },
      { id: 'f3', name: 'Brand_Assets.zip', size: '14.5 MB', ext: 'ZIP' },
    ],
    links: [
      { id: 'l1', title: 'GitHub Repository', url: 'https://github.com/becugram/platform', icon: 'github' },
      { id: 'l2', title: 'Design Guidelines', url: 'https://becugram.design', icon: 'link' },
    ],
  };

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
        {/* Top Header matching Screen 06 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-[#1C2C27] bg-zinc-50 dark:bg-[#12201B]">
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8DA39A] dark:hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">Profile</span>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-[#8DA39A] dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Profile Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Centered Profile Hero matching Screen 06 */}
          <div className="flex flex-col items-center pt-6 pb-4 px-6 text-center">
            <Avatar
              name={user.displayName}
              src={user.avatar}
              size="2xl"
              className="ring-4 ring-emerald-500/20 dark:ring-cyan-500/20 shadow-xl mb-3"
            />

            <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-snug">{user.displayName}</h2>
            <p className="text-sm text-emerald-600 dark:text-cyan-400 font-medium">@{user.username}</p>
            {user.phoneNumber && (
              <p className="text-xs text-zinc-500 dark:text-[#8DA39A] mt-0.5">
                {formatPhoneDisplay(user.phoneNumber)}
              </p>
            )}

            {/* Quick Action Buttons matching Screen 06 (Chat, Call, Video, Mute) */}
            <div className="flex items-center justify-center gap-3.5 my-5 w-full">
              <button
                onClick={() => {
                  onClose();
                  if (onStartChat) onStartChat(user._id);
                }}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#142620] dark:hover:bg-[#1B352C] border border-zinc-200 dark:border-cyan-500/20 text-emerald-600 dark:text-cyan-400 flex items-center justify-center transition-all shadow-sm"
                title="Suhbat ochish"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveCall('audio')}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#142620] dark:hover:bg-[#1B352C] border border-zinc-200 dark:border-cyan-500/20 text-emerald-600 dark:text-cyan-400 flex items-center justify-center transition-all shadow-sm"
                title="Ovozli qo'ng'iroq"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveCall('video')}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#142620] dark:hover:bg-[#1B352C] border border-zinc-200 dark:border-cyan-500/20 text-emerald-600 dark:text-cyan-400 flex items-center justify-center transition-all shadow-sm"
                title="Video qo'ng'iroq"
              >
                <Video className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  showToast(isMuted ? 'Ovoz yoqildi' : 'Xabarnomalar ovozi o\'chirildi', 'info');
                }}
                className={`w-12 h-12 rounded-2xl border border-zinc-200 dark:border-cyan-500/20 flex items-center justify-center transition-all shadow-sm ${
                  isMuted ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#142620] dark:hover:bg-[#1B352C] text-zinc-500 dark:text-[#8DA39A]'
                }`}
                title="Ovozni o'chirish"
              >
                {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </button>
            </div>

            {/* Bio Card matching Screen 06 */}
            <div className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] text-left">
              <span className="text-xs text-zinc-800 dark:text-[#EDF4F1] leading-relaxed block">
                <span className="text-zinc-500 dark:text-[#8DA39A] font-semibold mr-1">Bio:</span>
                {user.bio || 'UI/UX Designer & Tech Enthusiast 🚀'}
              </span>
            </div>
          </div>

          {/* Media Tabs matching Screen 06 [Photos] [Videos] [Files] [Links] */}
          <div className="border-t border-zinc-200 dark:border-[#1C2C27] px-4 pt-3">
            <div className="flex items-center justify-around pb-2">
              {(['photos', 'videos', 'files', 'links'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-semibold capitalize pb-1 transition-colors relative ${
                    activeTab === tab
                      ? 'text-emerald-600 dark:text-cyan-400'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-[#8DA39A] dark:hover:text-white'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-cyan-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* 3-Column Media Grid matching Screen 06 */}
            <div className="py-3">
              {activeTab === 'photos' && (
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaItems.photos.map((item) => (
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
              )}

              {activeTab === 'videos' && (
                <div className="grid grid-cols-2 gap-2">
                  {mediaItems.videos.map((item) => (
                    <div
                      key={item.id}
                      className="aspect-video bg-zinc-100 dark:bg-[#14231E] rounded-xl overflow-hidden relative group cursor-pointer"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-black/60 px-1.5 py-0.5 rounded text-white">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-2">
                  {mediaItems.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] hover:bg-zinc-100 dark:hover:bg-[#182B25] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-xs">
                          {file.ext}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate max-w-[200px]">
                            {file.name}
                          </p>
                          <span className="text-[10px] text-zinc-500 dark:text-[#8DA39A]">{file.size}</span>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-zinc-400 hover:text-zinc-800 dark:text-[#8DA39A] dark:hover:text-white cursor-pointer" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'links' && (
                <div className="space-y-2">
                  {mediaItems.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] hover:bg-zinc-100 dark:hover:bg-[#182B25] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white">{link.title}</p>
                          <span className="text-[10px] text-emerald-600 dark:text-cyan-400 truncate block max-w-[200px]">
                            {link.url}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
