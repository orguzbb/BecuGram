import React, { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Video, Trash2, Smile } from 'lucide-react';

export interface PendingMediaFile {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  sizeFormatted: string;
}

interface MediaSendModalProps {
  files: File[];
  isOpen: boolean;
  isUploading: boolean;
  onClose: () => void;
  onSend: (files: File[], caption: string) => Promise<void>;
}

export const MediaSendModal: React.FC<MediaSendModalProps> = ({
  files,
  isOpen,
  isUploading,
  onClose,
  onSend,
}) => {
  const [items, setItems] = useState<PendingMediaFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState('');

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    if (files.length > 0) {
      const mapped = files.map((f, i) => ({
        id: `pending_${Date.now()}_${i}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        type: (f.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
        sizeFormatted: formatSize(f.size),
      }));
      setItems(mapped);
      setActiveIndex(0);
      setCaption('');
    } else {
      setItems([]);
    }

    return () => {
      // Clean up object URLs
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
  }, [files]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  const activeItem = items[activeIndex];

  const handleRemove = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    if (updated.length === 0) {
      onClose();
    } else {
      setItems(updated);
      setActiveIndex((prev) => (prev >= updated.length ? updated.length - 1 : prev));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isUploading) return;
    await onSend(
      items.map((it) => it.file),
      caption.trim()
    );
  };

  if (!isOpen || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            {activeItem?.type === 'video' ? (
              <Video className="w-5 h-5 text-blue-400" />
            ) : (
              <ImageIcon className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-sm font-semibold text-zinc-100">
              {items.length > 1
                ? `${items.length} ta media fayl tanlandi`
                : activeItem?.type === 'video'
                ? 'Video yuborish'
                : 'Rasm yuborish'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            title="Bekor qilish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Stage Preview */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[260px] max-h-[50vh] p-3 overflow-hidden">
          {activeItem && (
            <>
              {activeItem.type === 'video' ? (
                <video
                  src={activeItem.previewUrl}
                  controls
                  playsInline
                  className="max-h-full max-w-full rounded-2xl object-contain shadow-lg"
                />
              ) : (
                <img
                  src={activeItem.previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full rounded-2xl object-contain shadow-lg"
                />
              )}

              {/* Top-right remove current button */}
              <button
                type="button"
                onClick={() => handleRemove(activeIndex)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-red-600 text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-md"
                title="O'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Bottom metadata pill */}
              <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-zinc-300 font-mono">
                {activeItem.file.name} ({activeItem.sizeFormatted})
              </div>
            </>
          )}
        </div>

        {/* Multi-item Thumbnails Strip */}
        {items.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950/80 border-t border-zinc-800/80 overflow-x-auto">
            {items.map((it, idx) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  idx === activeIndex
                    ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/20'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {it.type === 'video' ? (
                  <video src={it.previewUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={it.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Caption & Send Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Izoh yozing... (ixtiyoriy)"
              disabled={isUploading}
              className="flex-1 bg-zinc-800/80 border border-zinc-700/60 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />

            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-102 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Yuborish</span>
                  <Send className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
