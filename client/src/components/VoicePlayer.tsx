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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate synthetic waveform heights for visual effect
  const barHeights = [
    25, 40, 60, 30, 85, 70, 45, 90, 65, 40, 80, 50, 95, 75, 40, 60, 85, 30, 70, 50, 90, 60, 40, 75, 55, 35
  ];

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If playback fails (e.g. invalid url), simulate playback
          setIsPlaying(true);
        });
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
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px] select-none">
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
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
          isMe
            ? 'bg-white text-blue-600 shadow-sm'
            : 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
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
        <div className="flex items-center gap-0.5 h-6">
          {barHeights.map((h, i) => {
            const progressRatio = currentTime / (duration || 1);
            const isPlayed = i / barHeights.length <= progressRatio;
            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? isMe
                      ? 'bg-white'
                      : 'bg-cyan-400'
                    : isMe
                    ? 'bg-white/40'
                    : 'bg-[#5D736A]'
                }`}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] opacity-80 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

