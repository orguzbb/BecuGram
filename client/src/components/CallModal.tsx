import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff } from 'lucide-react';
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

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio Ringback Tone Generator (425Hz standard ringback tone)
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

      // 1.2s tone, fade out
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

  const playBusyTone = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(425, ctx.currentTime + i * 0.4);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.4);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.4 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.4);
        osc.stop(ctx.currentTime + i * 0.4 + 0.2);
      }
    } catch {}
  };

  const stopAudio = () => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  useEffect(() => {
    // 1. Start Dialing
    setPhase('dialing');

    // Emit real call initiation to Socket.IO signaling
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('call:start', { targetUserId: user._id, type });

      socket.on('call:accepted', () => {
        stopAudio();
        setPhase('connected');
      });

      socket.on('call:rejected', () => {
        stopAudio();
        setPhase('rejected');
        setTimeout(() => onEndCall(0), 2000);
      });
    }

    // Check if the user is offline
    if (user.isOnline === false) {
      const offlineTimer = setTimeout(() => {
        playBusyTone();
        setPhase('offline');
        callTimeoutRef.current = setTimeout(() => {
          stopAudio();
          onEndCall(0);
        }, 3000);
      }, 1500);

      return () => {
        clearTimeout(offlineTimer);
        stopAudio();
      };
    }

    // 2. Switch to Ringing after 1.2 seconds of dialing
    const dialTimer = setTimeout(() => {
      setPhase('ringing');
      playRingTone();

      // Repeat ringback tone every 4 seconds
      ringIntervalRef.current = setInterval(() => {
        playRingTone();
      }, 4000);

      // If remote user doesn't answer after 24 seconds, mark as no answer
      callTimeoutRef.current = setTimeout(() => {
        stopAudio();
        playBusyTone();
        setPhase('no_answer');
        setTimeout(() => onEndCall(0), 3000);
      }, 24000);
    }, 1200);

    return () => {
      clearTimeout(dialTimer);
      stopAudio();
      if (socket) {
        socket.off('call:accepted');
        socket.off('call:rejected');
        socket.emit('call:cancel', { targetUserId: user._id });
      }
    };
  }, [user._id, user.isOnline]);

  // Duration timer when strictly connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 'connected') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
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
    setTimeout(() => onEndCall(seconds), 400);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'dialing':
        return 'Ulanmoqda...';
      case 'ringing':
        return 'Gudok ketmoqda...';
      case 'offline':
        return 'Foydalanuvchi hozir tarmoqda emas';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F1B17] border border-[#233C33] shadow-2xl overflow-hidden flex flex-col items-center p-6 text-white text-center">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="w-full flex items-center justify-between text-xs text-[#8DA39A] mb-8 z-10">
          <span className="flex items-center gap-1.5 font-medium">
            {type === 'video' ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <Phone className="w-3.5 h-3.5 text-blue-400" />}
            BecuGram Xavfsiz Qo‘ng‘iroq
          </span>
          <span className={`w-2 h-2 rounded-full ${phase === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400 animate-ping'}`} />
        </div>

        {/* Avatar with pulse ring */}
        <div className="relative mb-6 z-10">
          <div className="relative flex items-center justify-center">
            {(phase === 'dialing' || phase === 'ringing') && (
              <div className="absolute w-28 h-28 rounded-full border-2 border-blue-400/40 animate-ping pointer-events-none" />
            )}
            <Avatar name={user.displayName} src={user.avatar} size="xl" className="w-24 h-24 ring-4 ring-blue-500/30" />
          </div>
        </div>

        {/* User Info & Live Status */}
        <div className="z-10 mb-8">
          <h3 className="text-xl font-bold text-white mb-1">{user.displayName}</h3>
          <p className="text-xs text-blue-400 font-medium">@{user.username || 'user'}</p>
          <div className="mt-3 text-sm font-semibold tracking-wide">
            {phase === 'connected' ? (
              <span className="text-emerald-400 font-mono text-base">{formatDuration(seconds)}</span>
            ) : phase === 'offline' || phase === 'no_answer' || phase === 'rejected' ? (
              <span className="text-rose-400">{getPhaseText()}</span>
            ) : (
              <span className="text-blue-300 animate-pulse">{getPhaseText()}</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 z-10 w-full pt-4 border-t border-[#1C3028]">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-[#182B24] text-white hover:bg-[#20382F]'
            }`}
            title={isMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o‘chirish'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle (if video call) */}
          {type === 'video' && (
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !isVideoOn ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-[#182B24] text-white hover:bg-[#20382F]'
              }`}
              title={isVideoOn ? 'Kamerani o‘chirish' : 'Kamerani yoqish'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          {/* Speaker Button */}
          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              !isSpeaker ? 'bg-zinc-700/50 text-zinc-400' : 'bg-[#182B24] text-blue-400 hover:bg-[#20382F]'
            }`}
            title="Karnay"
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Hangup Button (Red) */}
          <button
            onClick={handleHangUp}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/30 transition-transform"
            title="Qo‘ng‘iroqni yakunlash"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
