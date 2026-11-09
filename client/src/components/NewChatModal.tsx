import React, { useState } from 'react';
import { X, UserPlus, Users, Bookmark, Search, ArrowRight } from 'lucide-react';
import { Avatar } from './Avatar';
import { Contact } from '../types';

interface NewChatModalProps {
  contacts: Contact[];
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onOpenAddContact: () => void;
  onOpenCreateGroup: () => void;
  onOpenSavedMessages: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  contacts,
  onClose,
  onSelectUser,
  onOpenAddContact,
  onOpenCreateGroup,
  onOpenSavedMessages,
}) => {
  const [search, setSearch] = useState('');

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.customName.toLowerCase().includes(q) ||
      c.user.username.toLowerCase().includes(q) ||
      (c.user.phoneNumber && c.user.phoneNumber.includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0E1715] border border-zinc-200 dark:border-[#20362E] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-zinc-200 dark:border-[#1A2C26]">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Yangi suhbat boshlash</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 dark:bg-[#15231F] dark:text-[#8DA39A] dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-zinc-200 dark:border-[#1A2C26] space-y-1">
          <button
            onClick={() => {
              onClose();
              onOpenSavedMessages();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-[#15231F] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Saqlangan xabarlar</div>
              <div className="text-xs text-zinc-500 dark:text-[#8DA39A]">O'zingiz uchun bulutli xotira</div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-[#5D736A]" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenAddContact();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-[#15231F] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Yangi kontakt qo'shish</div>
              <div className="text-xs text-zinc-500 dark:text-[#8DA39A]">Telefon raqami yoki username orqali</div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-[#5D736A]" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenCreateGroup();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-[#15231F] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Yangi guruh ochish</div>
              <div className="text-xs text-zinc-500 dark:text-[#8DA39A]">Do'stlar va jamoalar uchun suhbat</div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-[#5D736A]" />
          </button>
        </div>

        {/* Search Contacts */}
        <div className="p-3">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] rounded-2xl px-3 py-2">
            <Search className="w-4 h-4 text-zinc-400 dark:text-[#8DA39A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kontaktlarni qidirish..."
              className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#8DA39A] outline-none"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 divide-y divide-zinc-100 dark:divide-[#182B24]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 dark:text-[#8DA39A]">
              {contacts.length === 0 ? (
                <div>
                  <p className="mb-2">Hali kontaktlar yo'q</p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddContact();
                    }}
                    className="text-emerald-600 dark:text-cyan-400 hover:underline font-semibold"
                  >
                    + Birinchi kontaktni qo'shing
                  </button>
                </div>
              ) : (
                'Qidiruv bo\'yicha kontakt topilmadi'
              )}
            </div>
          ) : (
            filtered.map((contact) => (
              <div
                key={contact._id}
                onClick={() => {
                  onClose();
                  onSelectUser(contact.user._id);
                }}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-[#15231F] cursor-pointer transition-colors"
              >
                <Avatar name={contact.customName} src={contact.user.avatar} size="md" isOnline={contact.user.isOnline} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{contact.customName}</div>
                  <div className="text-xs text-zinc-500 dark:text-[#8DA39A] truncate">{contact.user.phoneNumber || `@${contact.user.username}`}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
