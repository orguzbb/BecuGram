import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoicePlayerProps {
  url?: string;
  duration?: number;
  isMe?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  url,
  duration = 45,
  isMe = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate synthetic waveform heights for visual effect
  const barHeights = [
    25, 40, 60, 30, 85, 70, 45, 90, 65, 40, 80, 50, 95, 75, 40, 60, 85, 30, 70, 50, 90, 60, 40, 75, 55, 35
  ];

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(true);
        });
    }
  };

  const handleToggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const ratio = index / barHeights.length;
    const seekTime = ratio * (duration || 1);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1 * playbackSpeed;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, playbackSpeed]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 min-w-[210px] select-none">
      {url && (
        <audio
          ref={audioRef}
          src={url}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
        />
      )}

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
          isMe
            ? 'bg-white text-blue-600'
            : 'bg-[#2563EB] text-white shadow-blue-500/20'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Visual Waveform & Timer */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-0.5 h-6 cursor-pointer">
          {barHeights.map((h, i) => {
            const progressRatio = currentTime / (duration || 1);
            const isPlayed = i / barHeights.length <= progressRatio;
            return (
              <span
                key={i}
                onClick={(e) => handleSeek(i, e)}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-all duration-150 hover:opacity-100 ${
                  isPlayed
                    ? isMe
                      ? 'bg-white'
                      : 'bg-[#2563EB]'
                    : isMe
                    ? 'bg-white/40'
                    : 'bg-zinc-400 dark:bg-zinc-600'
                } ${isPlaying && Math.abs(i / barHeights.length - progressRatio) < 0.08 ? 'scale-y-125' : ''}`}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] opacity-80 font-mono">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-2">
            <span>{formatTime(duration)}</span>
            {/* Speed Toggle Badge (1x / 1.5x / 2x) */}
            <button
              type="button"
              onClick={handleToggleSpeed}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight transition-all active:scale-90 ${
                isMe
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
              title="Ovoz tezligini o'zgartirish"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

