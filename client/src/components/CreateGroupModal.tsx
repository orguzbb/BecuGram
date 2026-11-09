import React, { useState } from 'react';
import { X, Users, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: (conversationId?: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Guruh nomini kiriting', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.createGroup({
        name: name.trim(),
        description: description.trim(),
        isPublic: false,
      });
      showToast('Guruh muvaffaqiyatli yaratildi!', 'success');
      onSuccess(res.conversationId);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Guruh yaratishda xatolik yuz berdi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0E1715] border border-zinc-200 dark:border-[#20362E] shadow-2xl p-6 text-zinc-900 dark:text-white">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Yangi guruh ochish</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 dark:bg-[#15231F] dark:text-[#8DA39A] dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-[#8DA39A] block mb-1.5">
              Guruh nomi
            </label>
            <div className="flex items-center gap-2.5 bg-zinc-100 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] rounded-2xl px-3.5 py-2.5 focus-within:border-pink-500 transition-colors">
              <Users className="w-4 h-4 text-zinc-400 dark:text-[#8DA39A]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Dasturchilar Jamoasi"
                className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#8DA39A] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-[#8DA39A] block mb-1.5">
              Tavsifi (ixtiyoriy)
            </label>
            <div className="flex items-center gap-2.5 bg-zinc-100 dark:bg-[#14231E] border border-zinc-200 dark:border-[#20362E] rounded-2xl px-3.5 py-2.5 focus-within:border-pink-500 transition-colors">
              <MessageSquare className="w-4 h-4 text-zinc-400 dark:text-[#8DA39A]" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Guruh nima haqida?"
                className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#8DA39A] outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#162520] dark:hover:bg-[#1C3029] text-zinc-600 dark:text-[#8DA39A] hover:text-zinc-900 dark:hover:text-white text-sm font-semibold transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-sm font-bold shadow-md shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Yaratilmoqda...' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
