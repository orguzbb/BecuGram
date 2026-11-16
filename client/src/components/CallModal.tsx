import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Minimize2,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { User } from '../types';
import { socketService } from '../services/socket';

interface CallModalProps {
  type: 'audio' | 'video';
  user: User;
  onEndCall: (durationSec: number) => void;
}

type CallPhase = 'dialing' | 'ringing' | 'connected' | 'no_answer' | 'offline' | 'rejected' | 'ended';

export const CallModal: React.FC<CallModalProps> = ({ type, user, onEndCall }) => {
  const [phase, setPhase] = useState<CallPhase>('dialing');
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(type === 'video');
  const [isMinimized, setIsMinimized] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Microphone stream acquisition
  useEffect(() => {
    if (phase === 'connected') {
      navigator.mediaDevices
        ?.getUserMedia({ audio: true, video: type === 'video' })
        .then((stream) => {
          localStreamRef.current = stream;
        })
        .catch((err) => {
          console.warn('Microphone permission not granted or available:', err);
        });
    }
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [phase, type]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  };

  // Ring tone
  const playRingTone = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(425, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + 1.15);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.25);
    } catch {}
  };

  const stopAudio = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close().catch(() => {});
      } catch {}
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('call:start', { targetUserId: user._id, type });
    }

    const t1 = setTimeout(() => {
      setPhase('ringing');
      playRingTone();
      ringIntervalRef.current = setInterval(playRingTone, 4000);
    }, 1200);

    const t2 = setTimeout(() => {
      stopAudio();
      setPhase('connected');
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      stopAudio();
    };
  }, [user._id, type]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (phase === 'connected') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    stopAudio();
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('call:end', { targetUserId: user._id });
    }
    setPhase('ended');
    setTimeout(() => onEndCall(seconds), 350);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'dialing':
        return 'Ulanmoqda...';
      case 'ringing':
        return 'Gudok ketmoqda...';
      case 'offline':
        return 'Foydalanuvchi tarmoqda emas';
      case 'no_answer':
        return 'Javob berilmadi';
      case 'rejected':
        return 'Qo‘ng‘iroq rad etildi';
      case 'ended':
        return 'Qo‘ng‘iroq yakunlandi';
      case 'connected':
        return formatDuration(seconds);
      default:
        return 'Ulanmoqda...';
    }
  };

  // Minimized floating pill (Telegram Web A style)
  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-50 animate-bounce shadow-2xl">
        <div className="bg-[#212121]/95 text-white backdrop-blur-xl border border-[#303030] rounded-full px-4 py-2 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-bold">{user.displayName}</span>
            <span className="text-[10px] text-emerald-400 font-mono">{formatDuration(seconds)}</span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white cursor-pointer"
            title="Kattalashtirish"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleHangUp}
            className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            title="Yakunlash"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-0 sm:p-4 select-none animate-fade-in text-white">
      {/* Background Dimmed Avatar Blur (Telegram Style) */}
      {user.avatar && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-3xl pointer-events-none"
          style={{ backgroundImage: `url("${user.avatar}")` }}
        />
      )}

      {/* CALL MODAL CONTAINER */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl bg-gradient-to-b from-[#18222d] to-[#0e1621] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between p-6 sm:p-8 text-center">
        {/* Top Telegram Header: E2EE Key + Minimize */}
        <div className="w-full flex items-center justify-between z-10">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Kichraytirish"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          {/* Telegram E2EE Encryption Key: 4 Emojis */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-xs font-mono shadow-xs"
            title="Uchdan-uchgacha shifrlangan xavfsiz qo‘ng‘iroq (E2EE)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm">🍒 🍋 🌲 🔑</span>
          </div>

          <div className="w-9" />
        </div>

        {/* Center: Avatar & Sound Waves */}
        <div className="flex flex-col items-center justify-center my-auto py-6 z-10">
          <div className="relative mb-6">
            {/* Animated Telegram Pulse Waves */}
            {(phase === 'dialing' || phase === 'ringing' || phase === 'connected') && (
              <>
                <div className="absolute -inset-4 rounded-full border border-blue-400/25 animate-ping pointer-events-none" />
                <div className="absolute -inset-8 rounded-full border border-blue-400/15 pointer-events-none animate-pulse" />
              </>
            )}

            <div className="relative p-1 rounded-full ring-4 ring-white/20 shadow-2xl">
              <Avatar
                name={user.displayName}
                src={user.avatar}
                size="xl"
                className="w-28 h-28 sm:w-32 sm:h-32 text-3xl font-black"
              />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1 tracking-tight">
            {user.displayName}
          </h2>
          <span className="text-xs text-[#3390EC] font-medium">
            @{user.username || 'user'}
          </span>

          {/* Call Status Text & Duration */}
          <div className="mt-4">
            {phase === 'connected' ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-mono font-black text-emerald-400 tracking-wider">
                  {formatDuration(seconds)}
                </span>
                {/* Audio Waveform Simulation */}
                <div className="flex items-center gap-1 h-5">
                  {[12, 20, 16, 24, 18, 14, 22, 10, 18, 24, 16].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}px` }}
                      className="w-1 bg-emerald-400/80 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-sm font-semibold text-white/80 animate-pulse">
                {getPhaseText()}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Control Capsule Bar */}
        <div className="flex items-center justify-center gap-4 sm:gap-5 pt-4 z-10">
          {/* Mute */}
          <button
            onClick={handleToggleMute}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o‘chirish'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isVideoOn
                ? 'bg-white/10 hover:bg-white/20 text-white/70'
                : 'bg-blue-500 text-white shadow-lg'
            }`}
            title={isVideoOn ? 'Kamerani o‘chirish' : 'Kamerani yoqish'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Speaker */}
          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isSpeaker ? 'bg-white/10 text-white/50' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Karnay"
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Hang Up Button (Red) */}
          <button
            onClick={handleHangUp}
            className="w-15 h-15 rounded-full bg-[#FF3B30] hover:bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Qo‘ng‘iroqni yakunlash"
          >
            <PhoneOff className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
