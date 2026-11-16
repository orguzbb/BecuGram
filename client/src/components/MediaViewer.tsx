import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Message } from '../types';
import { getMediaUrl } from '../services/api';

interface MediaViewerProps {
  mediaMessages: Message[];
  initialMessageId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  mediaMessages,
  initialMessageId,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch gesture state
  const touchStartXRef = useRef<number | null>(null);

  // Sync initial index
  useEffect(() => {
    if (initialMessageId && mediaMessages.length > 0) {
      const idx = mediaMessages.findIndex((m) => m._id === initialMessageId);
      if (idx !== -1) {
        setCurrentIndex(idx);
      } else {
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex(0);
    }
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [initialMessageId, mediaMessages, isOpen]);

  const currentMsg = mediaMessages[currentIndex];
  const totalCount = mediaMessages.length;

  const handleNext = useCallback(() => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => prev + 1);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [currentIndex, totalCount]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [currentIndex]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === '+' || e.key === '=') handleZoomIn();
      else if (e.key === '-' || e.key === '_') handleZoomOut();
      else if (e.key === '0') handleResetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Touch gestures for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom === 1) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && zoom === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchEndX - touchStartXRef.current;
      if (diffX < -50) {
        handleNext();
      } else if (diffX > 50) {
        handlePrev();
      }
      touchStartXRef.current = null;
    }
  };

  // Mouse pan handling when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // File Download
  const handleDownload = () => {
    if (!currentMsg?.media?.url) return;
    const link = document.createElement('a');
    link.href = getMediaUrl(currentMsg.media.url);
    link.download = currentMsg.media.name || `becugram_media_${Date.now()}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !currentMsg) return null;

  const isVideo = currentMsg.type === 'video' || currentMsg.type === 'round_video' || currentMsg.type === 'video_note';
  const senderName =
    typeof currentMsg.senderId === 'object' && currentMsg.senderId
      ? currentMsg.senderId.displayName || currentMsg.senderId.username
      : 'BecuGram Foydalanuvchisi';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 text-white">
        {/* Left: Sender & Date */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white/95">{senderName}</span>
            <span className="text-xs text-white/60">
              {new Date(currentMsg.createdAt).toLocaleString('uz-UZ', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Center: Counter */}
        {totalCount > 1 && (
          <div className="text-xs sm:text-sm font-medium tracking-wide text-white/80 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {totalCount}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!isVideo && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-90"
                title="Yaqinlashtirish (+)"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-90"
                title="Uzoqlashtirish (-)"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              {zoom !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-90"
                  title="Asliga qaytarish"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-90"
            title="Yuklab olish"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-90 ml-1"
            title="Yopish (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Media Stage */}
      <div
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        {/* Navigation Arrow Left */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-4 z-20 p-3 sm:p-3.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            title="Oldingi (Chap strelka)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Media Content */}
        <div
          className={`flex items-center justify-center max-w-full max-h-full ${
            zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {isVideo ? (
            <video
              src={getMediaUrl(currentMsg.media?.url || currentMsg.content)}
              controls
              autoPlay
              playsInline
              className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black"
            />
          ) : (
            <img
              src={getMediaUrl(currentMsg.media?.url || currentMsg.content)}
              alt={currentMsg.media?.name || 'Full view'}
              className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl object-contain select-none pointer-events-auto"
              draggable={false}
            />
          )}
        </div>

        {/* Navigation Arrow Right */}
        {currentIndex < totalCount - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-4 z-20 p-3 sm:p-3.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            title="Keyingi (O'ng strelka)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Bar: Caption */}
      {currentMsg.content && (
        <div className="px-6 py-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10 text-center">
          <p className="text-sm sm:text-base text-white/95 max-w-2xl mx-auto leading-relaxed">
            {currentMsg.content}
          </p>
        </div>
      )}
    </div>
  );
};
