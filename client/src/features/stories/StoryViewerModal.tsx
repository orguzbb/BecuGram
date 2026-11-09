import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { useAuthStore } from '../../stores/authStore';

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
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex = 0,
  onClose,
  onDeleteStory,
}) => {
  const { user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  const currentStory = stories[currentIndex] || stories[0];
  const isMyStory = currentStory && (currentStory.userId === user?._id || currentStory.userId === 'user_default');

  useEffect(() => {
    setProgress(0);
    setHasLiked(false);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused || stories.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // ~5 seconds total
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else {
      onClose();
    }
  };

  if (!currentStory) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Story Card Container */}
      <div
        style={{ background: currentStory.bgColor || 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)' }}
        className="relative w-full max-w-md h-[92vh] max-h-[820px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4 sm:p-6 border border-white/10"
      >
        {/* Progress Bars at Top */}
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
                className="h-full bg-white transition-all duration-100 ease-linear"
              />
            </div>
          ))}
        </div>

        {/* Top Header: Author & Close */}
        <div className="flex items-center justify-between pt-3 z-20">
          <div className="flex items-center gap-3">
            <Avatar name={currentStory.userName} src={currentStory.userAvatar} size="sm" isOnline={true} />
            <div>
              <span className="font-bold text-sm text-white block leading-tight">{currentStory.userName}</span>
              <span className="text-[11px] text-white/70">Bugun</span>
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
                className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/30 text-white/80 hover:text-rose-300 transition-colors"
                title="Hikoyani o'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media / Content Area (Image or Video up to 1-min) */}
        <div className="flex-1 flex flex-col items-center justify-center my-4 z-10 px-4 text-center">
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
                className="max-h-[60vh] w-auto max-w-full rounded-2xl object-contain shadow-lg"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="max-h-[60vh] w-auto max-w-full rounded-2xl object-contain shadow-lg"
              />
            )
          ) : (
            <div className="p-6">
              <p className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed drop-shadow-md">
                {currentStory.caption}
              </p>
            </div>
          )}

          {currentStory.mediaUrl && currentStory.caption && (
            <div className="mt-4 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md text-white text-sm font-semibold max-w-xs">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Tap Left / Tap Right Navigation Overlay */}
        <div className="absolute inset-0 z-10 flex">
          <div onClick={handlePrev} className="w-1/3 h-full cursor-pointer" />
          <div onClick={handleNext} className="w-2/3 h-full cursor-pointer" />
        </div>

        {/* Bottom Reaction Bar */}
        <div className="z-20 flex items-center justify-between pt-2">
          <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
            BecuGram Hikoyalari 🌸
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasLiked(!hasLiked);
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
              hasLiked ? 'bg-rose-500 text-white scale-110' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

