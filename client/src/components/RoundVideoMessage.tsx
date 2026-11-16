import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface RoundVideoMessageProps {
  url: string;
  isMe?: boolean;
}

export const RoundVideoMessage: React.FC<RoundVideoMessageProps> = ({ url, isMe = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

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

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div
      onClick={togglePlay}
      className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-2xl border-3 border-white/40 dark:border-white/20 bg-black cursor-pointer group select-none transition-transform active:scale-98"
    >
      {/* The Circular Video Element */}
      <video
        ref={videoRef}
        src={url}
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="w-full h-full object-cover rounded-full"
      />

      {/* Circular Animated Progress Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="3"
        />
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="#3390EC"
          strokeWidth="3.5"
          strokeDasharray="301.59"
          strokeDashoffset={301.59 - (301.59 * progress) / 100}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>

      {/* Center Play/Pause Overlay */}
      {(!isPlaying || progress === 0) && (
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center transition-opacity group-hover:bg-black/45">
          <div className="w-13 h-13 rounded-full bg-white/90 dark:bg-black/75 text-zinc-900 dark:text-white flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-all">
            <Play className="w-6 h-6 ml-0.5 fill-current text-[#3390EC]" />
          </div>
        </div>
      )}

      {/* Floating Mute/Unmute toggle button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
          }
        }}
        className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title={isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

