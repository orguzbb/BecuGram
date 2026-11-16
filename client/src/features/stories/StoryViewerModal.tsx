import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, ChevronLeft, ChevronRight, Trash2, Send, MessageSquare } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/Toast';
import confetti from 'canvas-confetti';

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  bgColor?: string;
  createdAt: string;
}

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onDeleteStory?: (storyId: string) => void;
  onReplyToStory?: (story: Story, text: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex = 0,
  onClose,
  onDeleteStory,
  onReplyToStory,
}) => {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [replyText, setReplyText] = useState('');

  const currentStory = stories[currentIndex] || stories[0];
  const isMyStory = currentStory && (currentStory.userId === user?._id || currentStory.userId === 'user_default');

  useEffect(() => {
    setProgress(0);
    setHasLiked(false);
    setReplyText('');
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused || stories.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // ~5 seconds per story
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length, onClose]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else {
      onClose();
    }
  };

  const handleQuickReaction = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    setHasLiked(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
    showToast(`${emoji} reaksiyasi yuborildi!`, 'success');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentStory) return;

    if (onReplyToStory) {
      onReplyToStory(currentStory, replyText.trim());
    }
    showToast(`"${currentStory.userName}" ga javob yuborildi! 🚀`, 'success');
    setReplyText('');
  };

  if (!currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center select-none p-0 sm:p-4 animate-fade-in"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Floating Desktop Previous Button */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white items-center justify-center z-30 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl border border-white/15"
          title="Oldingi hikoya"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Floating Desktop Next Button */}
      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white items-center justify-center z-30 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl border border-white/15"
        title="Keyingi hikoya"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Story Card Container */}
      <div
        style={{ background: currentStory.bgColor || 'linear-gradient(135deg, #101921 0%, #212121 100%)' }}
        className="relative w-full max-w-md h-full sm:h-[92vh] sm:max-h-[840px] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 sm:p-5 border border-white/10"
      >
        {/* 1. Progress Bars at Top */}
        <div className="flex items-center gap-1.5 z-20">
          {stories.map((st, idx) => (
            <div key={st.id || idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
              />
            </div>
          ))}
        </div>

        {/* 2. Top Header: Author Contact Info & Close (Dumaloq kontakt rasmi) */}
        <div className="flex items-center justify-between pt-3 z-20">
          <div className="flex items-center gap-3">
            {/* Dumaloq kontakt rasmi / avatar */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full ring-2 ring-white/80 p-0.5 shadow-md flex items-center justify-center bg-white/10 overflow-hidden">
                <Avatar
                  name={currentStory.userName}
                  src={currentStory.userAvatar}
                  size="md"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10B981] ring-2 ring-black" />
            </div>

            <div>
              <span className="font-bold text-sm text-white block leading-tight drop-shadow-sm">
                {currentStory.userName}
              </span>
              <span className="text-[11px] text-white/70 block mt-0.5">
                Bugun &bull; {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMyStory && onDeleteStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStory(currentStory.id);
                  if (stories.length <= 1) {
                    onClose();
                  } else {
                    handleNext();
                  }
                }}
                className="p-2 rounded-full bg-black/30 hover:bg-rose-500/40 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Hikoyani o'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/30 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Yopish"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* 3. Media / Content Area (Image or Video) */}
        <div className="flex-1 flex flex-col items-center justify-center my-3 z-10 px-2 text-center relative overflow-hidden">
          {currentStory.mediaUrl ? (
            currentStory.mediaType === 'video' ||
            currentStory.mediaUrl.startsWith('data:video') ||
            currentStory.mediaUrl.includes('.mp4') ||
            currentStory.mediaUrl.includes('.webm') ? (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                loop
                playsInline
                className="max-h-[64vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="max-h-[64vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            )
          ) : (
            <div className="p-6">
              <p className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed drop-shadow-lg">
                {currentStory.caption}
              </p>
            </div>
          )}

          {currentStory.mediaUrl && currentStory.caption && (
            <div className="mt-3 px-4 py-2 rounded-2xl bg-black/50 backdrop-blur-md text-white text-sm font-semibold max-w-sm shadow-md">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* 4. Tap Left / Tap Right Navigation Overlay */}
        <div className="absolute inset-0 z-10 flex">
          <div onClick={handlePrev} className="w-1/3 h-full cursor-pointer" />
          <div onClick={handleNext} className="w-2/3 h-full cursor-pointer" />
        </div>

        {/* 5. Bottom Interactive Reply & Reaction Bar */}
        <div className="z-20 space-y-2.5 pt-1">
          {/* Quick Floating Reactions Row */}
          <div className="flex items-center justify-center gap-2">
            {['❤️', '👍', '🔥', '😂', '👏', '🎉'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => handleQuickReaction(e, emoji)}
                className="text-xl p-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md hover:scale-130 active:scale-90 transition-transform cursor-pointer"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Input Bar matching Telegram Stories */}
          <form
            onSubmit={handleSendReply}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            <div className="flex-1 flex items-center bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder="Xabar yozing..."
                className="w-full bg-transparent text-sm text-white placeholder-white/60 outline-none"
              />
            </div>

            {replyText.trim() ? (
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-[#3390EC] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                title="Yuborish"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHasLiked(!hasLiked);
                  if (!hasLiked) {
                    confetti({ particleCount: 40, spread: 50, origin: { y: 0.85 } });
                  }
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shrink-0 cursor-pointer ${
                  hasLiked ? 'bg-rose-500 text-white scale-110' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title="Yoqdi"
              >
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
