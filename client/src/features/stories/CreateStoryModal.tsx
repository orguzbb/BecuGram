import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Send, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/Toast';
import { Story } from './StoryViewerModal';

interface CreateStoryModalProps {
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  onClose,
  onStoryCreated,
}) => {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedBg, setSelectedBg] = useState('linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const bgOptions = [
    'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
    'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
    'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
    'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
  ];

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');

    if (isVideo) {
      // Validate video duration max 60 seconds (1 minute per user requirement)
      const videoElem = document.createElement('video');
      videoElem.preload = 'metadata';
      const objUrl = URL.createObjectURL(file);
      videoElem.src = objUrl;

      videoElem.onloadedmetadata = () => {
        window.URL.revokeObjectURL(objUrl);
        if (videoElem.duration > 60) {
          showToast("Video davomiyligi 1 daqiqadan (60 soniya) oshmasligi kerak!", 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          setMediaUrl(reader.result as string);
          setMediaType('video');
          showToast("Video muvaffaqiyatli tanlandi (1 daqiqagacha)", 'info');
        };
        reader.readAsDataURL(file);
      };

      videoElem.onerror = () => {
        window.URL.revokeObjectURL(objUrl);
        showToast("Video formatini o'qib bo'lmadi", 'error');
      };
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaUrl(reader.result as string);
        setMediaType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !mediaUrl) {
      showToast('Iltimos, rasm, video yoki matn kiriting', 'error');
      return;
    }

    const newStory: Story = {
      id: `story_${Date.now()}`,
      userId: user?._id || 'user_default',
      userName: user?.displayName || 'Abdurahim',
      userAvatar: user?.avatar,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaUrl ? mediaType : undefined,
      caption: caption.trim() || undefined,
      bgColor: mediaUrl ? undefined : selectedBg,
      createdAt: new Date().toISOString(),
    };

    onStoryCreated(newStory);
    showToast('Hikoya muvaffaqiyatli joylandi! ✨', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#14231E] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-[#233830] flex flex-col animate-fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">Yangi Hikoya Joylash</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Live Preview Canvas */}
        <div className="p-6">
          <div
            style={{
              background: mediaUrl ? '#0F172A' : selectedBg,
            }}
            className="w-full h-64 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-4 text-center shadow-inner"
          >
            {mediaUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {mediaType === 'video' ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="max-h-full max-w-full rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="max-h-full max-w-full rounded-xl object-contain"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl(null);
                    setMediaType('image');
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-xl font-bold text-white leading-relaxed px-4 break-words max-w-full">
                {caption || 'Fikrlaringiz yoki kuningiz haqida yozing...'}
              </p>
            )}
          </div>

          {/* Color Palettes (if no media) */}
          {!mediaUrl && (
            <div className="flex items-center justify-center gap-2 mt-3.5">
              {bgOptions.map((bg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedBg(bg)}
                  style={{ background: bg }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedBg === bg ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Hikoya sarlavhasi / matni..."
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-[#1A2E26] border border-zinc-200 dark:border-[#233830] text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1A2E26] dark:hover:bg-[#203930] text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <Video className="w-4 h-4 text-cyan-500" />
                <span>Rasm / Video (1 min)</span>
              </button>

              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#2563EB] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                <Send className="w-4 h-4" />
                Hikoyani joylash
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

