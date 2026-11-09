import React, { useState } from 'react';
import { Edit3, AtSign, Hash, Copy, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/Toast';

interface ProfileViewProps {
  onOpenEditProfile: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenEditProfile }) => {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A';
  const username = user?.username || 'Abdurahim';
  const cleanUsername = username.startsWith('@') ? username : `@${username}`;
  const userId = user?.phoneNumber ? user.phoneNumber.replace(/\D/g, '').slice(-4) : '1778';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} nusxalandi!`, 'success');
  };

  const hasValidAvatar = Boolean(
    user?.avatar &&
    user.avatar.trim() !== '' &&
    !user.avatar.includes('1794151183673') &&
    !user.avatar.includes('unsplash')
  );

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] dark:bg-[#0E1715] select-none text-[#1E1915] dark:text-[#EDF4F1] overflow-y-auto pb-28 transition-colors">
      {/* Top Header: "Profil" on left, Edit icon on right */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h1 className="text-2xl font-black tracking-tight text-[#1E1915] dark:text-white">
          Profil
        </h1>
        <button
          onClick={onOpenEditProfile}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-colors"
          title="Profilni tahrirlash"
        >
          <Edit3 className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Hero Avatar & Name matching Image 3 */}
      <div className="flex flex-col items-center pt-4 pb-6 px-4">
        {/* Large Avatar Circle with Online Dot */}
        <div className="relative">
          {hasValidAvatar ? (
            <img
              src={user?.avatar}
              alt={user?.displayName || 'Profil'}
              className="w-28 h-28 rounded-full object-cover shadow-xl ring-4 ring-white dark:ring-[#14231E]"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-[#4F46E5] text-white text-5xl font-extrabold flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-[#14231E]">
              {initial}
            </div>
          )}

          {/* Green Online Dot */}
          <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-[#10B981] border-4 border-[#FAF8F5] dark:border-[#0E1715] shadow-md" />
        </div>

        {/* Display Name */}
        <h2 className="text-2xl font-black text-[#1E1915] dark:text-white mt-3.5 tracking-tight">
          {user?.displayName || 'Abdurahim'}
        </h2>

        {/* Online Status */}
        <span className="text-sm font-semibold text-[#10B981] mt-0.5 tracking-wide">
          onlayn
        </span>
      </div>

      {/* Info Cards: [@username, #ID] */}
      <div className="px-5 space-y-4">
        <div className="bg-white dark:bg-[#15231F] rounded-3xl p-4 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/70 dark:border-[#223830] shadow-sm">
          {/* Card 1: @Username */}
          <div
            onClick={() => copyToClipboard(cleanUsername, 'Foydalanuvchi nomi')}
            className="flex items-center gap-3.5 pb-3.5 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-[#1A2E26] text-[#4F46E5] flex items-center justify-center shadow-xs shrink-0">
              <AtSign className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-base text-[#1E1915] dark:text-white block truncate">
                {cleanUsername}
              </span>
              <span className="text-xs text-zinc-500 dark:text-[#8DA39A] block truncate">
                Foydalanuvchi nomi, nusxalash uchun bosing
              </span>
            </div>
            <Copy className="w-4 h-4 text-zinc-400 shrink-0" />
          </div>

          {/* Card 2: #ID */}
          <div
            onClick={() => copyToClipboard(userId, 'ID')}
            className="flex items-center gap-3.5 pt-3.5 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-[#1A2E26] text-[#4F46E5] flex items-center justify-center shadow-xs shrink-0">
              <Hash className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-base text-[#1E1915] dark:text-white block truncate">
                {userId}
              </span>
              <span className="text-xs text-zinc-500 dark:text-[#8DA39A] block truncate">
                ID, nusxalash uchun bosing
              </span>
            </div>
            <Copy className="w-4 h-4 text-zinc-400 shrink-0" />
          </div>
        </div>

        {/* Postlar Activity Card (Hadyalar/Sovg'alar bo'limi olib tashlandi) */}
        <div className="p-8 text-center bg-white dark:bg-[#15231F] rounded-3xl border border-zinc-200/70 dark:border-[#223830] shadow-sm">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#1E332B] text-[#4F46E5] flex items-center justify-center mb-2.5 shadow-xs">
              <ImageIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <p className="text-sm font-bold text-[#1E1915] dark:text-white mb-1">
              Hozircha postlar yo‘q
            </p>
            <p className="text-xs text-zinc-500 dark:text-[#8DA39A] max-w-xs">
              Yangi rasmlar yoki fikrlaringizni kanalingiz orqali do‘stlaringiz bilan ulashing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
