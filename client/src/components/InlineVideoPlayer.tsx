import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface InlineVideoPlayerProps {
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  onOpenViewer?: () => void;
}

export const InlineVideoPlayer: React.FC<InlineVideoPlayerProps> = ({
  url,
  thumbnailUrl,
  duration: initialDuration,
  onOpenViewer,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const target = pos * duration;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden max-w-sm sm:max-w-md bg-black select-none group shadow-md"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(false)}
      onClick={onOpenViewer}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={url}
        poster={thumbnailUrl}
        playsInline
        muted={isMuted}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current && videoRef.current.duration) {
            setDuration(videoRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        className="w-full max-h-80 object-cover cursor-pointer block"
      />

      {/* Center Big Play Button (shown when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] transition-all group-hover:bg-black/40 pointer-events-none">
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-white/90 dark:bg-black/80 text-zinc-900 dark:text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
          >
            <Play className="w-6 h-6 ml-1 fill-current text-blue-500" />
          </button>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 py-2 flex flex-col gap-1.5 transition-opacity duration-200 ${
          showControls || isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Seekbar */}
        <div
          onClick={handleSeek}
          className="h-1.5 w-full bg-white/30 rounded-full cursor-pointer overflow-hidden relative"
        >
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 rounded-full hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <span className="font-mono text-[11px] opacity-90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 rounded-full hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {onOpenViewer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenViewer();
                }}
                className="p-1 rounded-full hover:bg-white/20 transition-all active:scale-90 cursor-pointer"
                title="To'liq ekranda ochish"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
