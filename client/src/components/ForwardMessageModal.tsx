import React, { useState } from 'react';
import { Search, X, Check, Share2, Bookmark } from 'lucide-react';
import { Avatar } from './Avatar';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { Message, Conversation } from '../types';

interface ForwardMessageModalProps {
  message: Message;
  onClose: () => void;
  onForward: (targetConversation: Conversation) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  message,
  onClose,
  onForward,
}) => {
  const { conversations } = useChatStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const isDirect = c.type === 'direct';
    const isSaved = c._id.startsWith('conv_saved_');
    const title = isSaved
      ? 'Saqlanganlar'
      : isDirect
      ? c.partner?.displayName || ''
      : c.group?.name || '';
    const username = c.partner?.username || '';
    return title.toLowerCase().includes(q) || username.toLowerCase().includes(q);
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#121E1B] border border-zinc-200 dark:border-[#233830] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                Xabarni uzatish
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Qaysi suhbatga yubormoqchisiz?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1A2E26] text-zinc-500 dark:text-zinc-400 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview of message being forwarded */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-[#0E1715] border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="pl-3 py-1 border-l-2 border-blue-500 text-xs">
            <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
              Uzatilayotgan xabar:
            </span>
            <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2">
              {message.content}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chat yoki kontaktni qidirish..."
              className="w-full bg-zinc-100 dark:bg-[#1A2E26] border border-transparent dark:border-[#233830] rounded-full pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/40 p-2">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              Hech qanday suhbat topilmadi
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isDirect = conv.type === 'direct';
              const isSaved = conv._id.startsWith('conv_saved_');
              const title = isSaved
                ? 'Saqlanganlar'
                : isDirect
                ? conv.partner?.displayName || 'Foydalanuvchi'
                : conv.group?.name || 'Guruh';
              const username = conv.partner?.username ? `@${conv.partner.username.replace('@', '')}` : '';

              return (
                <div
                  key={conv._id}
                  onClick={() => onForward(conv)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-[#1A2E26] cursor-pointer transition-colors"
                >
                  <div className="relative shrink-0">
                    {isSaved ? (
                      <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                        <Bookmark className="w-4 h-4 fill-current" />
                      </div>
                    ) : (
                      <Avatar
                        name={title}
                        src={conv.partner?.avatar || conv.group?.avatar}
                        size="md"
                        isOnline={conv.partner?.isOnline}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                        {title}
                      </span>
                      {(isSaved || conv.partner?.isVerified) && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {isSaved ? "O'zingiz uchun saqlang" : username || (isDirect ? 'Shaxsiy suhbat' : 'Guruh')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

