import React, { useState } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/Toast';
import { api } from '../../services/api';
import { Avatar } from '../../components/Avatar';
import { validateUsername } from '../../utils/validators';

interface EditProfileModalProps {
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { user, setUser } = useAuthStore();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await api.uploadFile(file);
      setAvatar(res.url);
      showToast('Avatar muvaffaqiyatli yuklandi!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Avatar yuklashda xatolik yuz berdi.', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const validation = validateUsername(cleanUsername);
    if (!validation.isValid) {
      showToast(validation.error || "Foydalanuvchi nomi noto'g'ri", 'error');
      return;
    }

    setIsLoading(true);

    try {
      const updated = await api.updateMe({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        avatar,
      });

      setUser(updated);
      showToast('Profil muvaffaqiyatli yangilandi!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Profilni yangilashda xatolik yuz berdi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <form
        onSubmit={handleSave}
        className="w-full max-w-sm bg-white dark:bg-[#12201B] border border-zinc-200 dark:border-[#233832] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-900 dark:text-[#EDF4F1]"
      >
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-[#1C2C27]">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Profilni tahrirlash</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:text-[#8DA39A] dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center my-1">
          <div className="relative group cursor-pointer">
            <Avatar name={displayName || 'User'} src={avatar} size="xl" />
            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-cyan-400 mt-2 font-medium">Rasmni o'zgartirish</span>
        </div>

        {/* Display Name */}
        <div>
          <label className="text-xs text-zinc-500 dark:text-[#8DA39A] font-medium block mb-1">Ism va Familiya</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full p-2.5 bg-zinc-100 dark:bg-[#172A24] border border-zinc-200 dark:border-[#263D34] rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-cyan-400"
          />
        </div>

        {/* Username */}
        <div>
          <label className="text-xs text-zinc-500 dark:text-[#8DA39A] font-medium block mb-1">Foydalanuvchi nomi</label>
          <div className="flex items-center bg-zinc-100 dark:bg-[#172A24] border border-zinc-200 dark:border-[#263D34] rounded-xl px-3 focus-within:border-emerald-500 dark:focus-within:border-cyan-400">
            <span className="text-emerald-600 dark:text-cyan-400 font-semibold text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              className="w-full p-2.5 bg-transparent text-sm text-zinc-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs text-zinc-500 dark:text-[#8DA39A] font-medium block mb-1">Bio (Ma'lumot)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full p-2.5 bg-zinc-100 dark:bg-[#172A24] border border-zinc-200 dark:border-[#263D34] rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-cyan-400 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-[#8DA39A] dark:hover:text-white"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-xs font-semibold hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
};