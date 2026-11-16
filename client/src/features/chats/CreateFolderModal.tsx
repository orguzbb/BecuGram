import React, { useState } from 'react';
import { X, Check, Trash2, FolderPlus, Users, Megaphone, User as UserIcon } from 'lucide-react';
import { ChatFolder, Conversation } from '../../types';
import { Avatar } from '../../components/Avatar';
import { useToast } from '../../components/Toast';
import { FOLDER_ICONS, FolderIcon } from '../../components/FolderIcon';

interface CreateFolderModalProps {
  conversations: Conversation[];
  existingFolder?: ChatFolder | null;
  onClose: () => void;
  onSave: (folder: ChatFolder) => void;
  onDelete?: (folderId: string) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  conversations,
  existingFolder,
  onClose,
  onSave,
  onDelete,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState(existingFolder?.name || '');
  const [selectedIcon, setSelectedIcon] = useState<string>(
    existingFolder?.iconName || 'Briefcase'
  );
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>(existingFolder?.chatIds || []);
  const [includeDirect, setIncludeDirect] = useState(existingFolder?.includeTypes?.includes('direct') ?? false);
  const [includeGroups, setIncludeGroups] = useState(existingFolder?.includeTypes?.includes('group') ?? false);
  const [includeChannels, setIncludeChannels] = useState(existingFolder?.includeTypes?.includes('channel') ?? false);

  const toggleChat = (id: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Iltimos, jild nomini kiriting!', 'error');
      return;
    }

    const includeTypes: ('direct' | 'group' | 'channel')[] = [];
    if (includeDirect) includeTypes.push('direct');
    if (includeGroups) includeTypes.push('group');
    if (includeChannels) includeTypes.push('channel');

    const folder: ChatFolder = {
      id: existingFolder?.id || `folder_${Date.now()}`,
      name: name.trim(),
      iconName: selectedIcon,
      filter: 'custom',
      chatIds: selectedChatIds,
      includeTypes: includeTypes.length > 0 ? includeTypes : undefined,
    };

    onSave(folder);
    showToast(existingFolder ? "Jild muvaffaqiyatli yangilandi! 📁" : "Yangi jild yaratildi! 📁", 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#212121] rounded-2xl border border-[#DADCE0] dark:border-[#303030] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-zinc-900 dark:text-white"
      >
        {/* Header (Telegram Web A Clean Action Bar style) */}
        <div className="h-14 px-4 bg-white dark:bg-[#212121] text-zinc-900 dark:text-white border-b border-[#DADCE0] dark:border-[#303030] flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-[#3390EC] dark:text-[#8774E1] stroke-[2.2]" />
            <h2 className="font-bold text-base text-zinc-900 dark:text-white">
              {existingFolder ? "Jildni tahrirlash" : "Yangi jild yaratish"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#707579] dark:text-[#AAAAAA] transition-colors cursor-pointer"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. Jild nomi & Lucide Icon tanlash */}
          <div>
            <label className="block text-xs font-bold text-[#3390EC] dark:text-[#8774E1] uppercase tracking-wider mb-1.5">
              Jild nomi va Ikonkasi
            </label>
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-[#3390EC]/15 dark:bg-[#8774E1]/20 text-[#3390EC] dark:text-[#8774E1] flex items-center justify-center shrink-0 border border-[#3390EC]/30 shadow-xs">
                <FolderIcon iconName={selectedIcon} className="w-6 h-6 stroke-[2.2]" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Ish, Oila, Loyihalar..."
                maxLength={24}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#F4F4F5] dark:bg-[#181818] border border-[#DADCE0] dark:border-[#303030] outline-none text-sm text-zinc-900 dark:text-white placeholder-[#707579] focus:ring-2 focus:ring-[#3390EC] dark:focus:ring-[#8774E1]"
                autoFocus
              />
            </div>

            {/* Lucide Vector Icons Grid */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-[#707579] dark:text-[#AAAAAA] block mb-1.5">
                Ikonkani tanlang:
              </span>
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 p-2 rounded-2xl bg-[#F4F4F5] dark:bg-[#181818] border border-[#DADCE0] dark:border-[#303030] max-h-36 overflow-y-auto">
                {FOLDER_ICONS.map((item) => {
                  const IconComp = item.Icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      title={item.name}
                      className={`h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#3390EC] dark:bg-[#8774E1] text-white shadow-md shadow-blue-500/30 scale-105'
                          : 'bg-white dark:bg-[#212121] text-[#707579] dark:text-[#AAAAAA] hover:text-[#3390EC] hover:bg-blue-50 dark:hover:bg-white/10'
                      }`}
                    >
                      <IconComp className="w-5 h-5 stroke-[2]" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Chat turlarini biriktirish */}
          <div>
            <label className="block text-xs font-bold text-[#3390EC] dark:text-[#8774E1] uppercase tracking-wider mb-1.5">
              Qo'shiladigan chat toifalari
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIncludeDirect(!includeDirect)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  includeDirect
                    ? 'bg-[#3390EC]/15 border-[#3390EC] text-[#3390EC] dark:text-[#8774E1]'
                    : 'bg-[#F4F4F5] dark:bg-[#181818] border-[#DADCE0] dark:border-[#303030] text-[#707579] dark:text-[#AAAAAA]'
                }`}
              >
                <UserIcon className="w-5 h-5 mb-1" />
                <span>Shaxsiy</span>
              </button>

              <button
                type="button"
                onClick={() => setIncludeGroups(!includeGroups)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  includeGroups
                    ? 'bg-[#3390EC]/15 border-[#3390EC] text-[#3390EC] dark:text-[#8774E1]'
                    : 'bg-[#F4F4F5] dark:bg-[#181818] border-[#DADCE0] dark:border-[#303030] text-[#707579] dark:text-[#AAAAAA]'
                }`}
              >
                <Users className="w-5 h-5 mb-1" />
                <span>Guruhlar</span>
              </button>

              <button
                type="button"
                onClick={() => setIncludeChannels(!includeChannels)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  includeChannels
                    ? 'bg-[#3390EC]/15 border-[#3390EC] text-[#3390EC] dark:text-[#8774E1]'
                    : 'bg-[#F4F4F5] dark:bg-[#181818] border-[#DADCE0] dark:border-[#303030] text-[#707579] dark:text-[#AAAAAA]'
                }`}
              >
                <Megaphone className="w-5 h-5 mb-1" />
                <span>Kanallar</span>
              </button>
            </div>
          </div>

          {/* 3. Muayyan chatlarni tanlash */}
          {conversations.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-[#3390EC] dark:text-[#8774E1] uppercase tracking-wider mb-1.5">
                Alohida chatlarni kiritish ({selectedChatIds.length})
              </label>
              <div className="max-h-48 overflow-y-auto divide-y divide-[#DADCE0] dark:divide-[#303030] rounded-2xl bg-[#F4F4F5] dark:bg-[#181818] border border-[#DADCE0] dark:border-[#303030]">
                {conversations.map((c) => {
                  const isChecked = selectedChatIds.includes(c._id);
                  const title = c.type === 'direct' ? c.partner?.displayName || 'Foydalanuvchi' : c.group?.name || 'Guruh';
                  return (
                    <div
                      key={c._id}
                      onClick={() => toggleChat(c._id)}
                      className="flex items-center justify-between p-2.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={title} src={c.partner?.avatar || c.group?.avatar} size="sm" />
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {title}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[#3390EC] dark:bg-[#8774E1] text-white'
                            : 'border-2 border-zinc-400 dark:border-zinc-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Save & Delete actions */}
          <div className="flex items-center justify-between pt-2">
            {existingFolder && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(existingFolder.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>O'chirish</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#3390EC] dark:bg-[#8774E1] text-white hover:opacity-90 active:scale-95 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
