import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Video, VideoOff, Minimize2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { User } from '../types';

interface CallModalProps {
  type: 'audio' | 'video';
  user: User;
  onEndCall: (durationSec: number) => void;
}

export const CallModal: React.FC<CallModalProps> = ({ type, user, onEndCall }) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected'>('calling');
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(type === 'video');

  // Simulate connection after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F1B17] border border-[#233C33] shadow-2xl overflow-hidden flex flex-col items-center p-6 text-white text-center">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Call Type Header */}
        <div className="w-full flex items-center justify-between text-xs text-[#8DA39A] mb-8 z-10">
          <span className="flex items-center gap-1.5 font-medium">
            {type === 'video' ? <Video className="w-3.5 h-3.5 text-cyan-400" /> : <Phone className="w-3.5 h-3.5 text-cyan-400" />}
            BecuGram End-to-End Encrypted Call
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Caller Avatar with Pulse Animation */}
        <div className="relative mb-6 z-10">
          <div className="relative flex items-center justify-center">
            {callStatus === 'calling' && (
              <div className="absolute w-28 h-28 rounded-full border-2 border-cyan-400/30 animate-ping pointer-events-none" />
            )}
            <Avatar name={user.displayName} src={user.avatar} size="xl" className="w-24 h-24 ring-4 ring-cyan-500/20" />
          </div>
        </div>

        {/* User Info */}
        <div className="z-10 mb-8">
          <h3 className="text-xl font-bold text-white mb-1">{user.displayName}</h3>
          <p className="text-xs text-cyan-400 font-medium">@{user.username || 'user'}</p>
          <div className="mt-2 text-sm font-semibold tracking-wider text-[#8DA39A]">
            {callStatus === 'calling' ? (
              <span className="animate-pulse">Calling...</span>
            ) : (
              <span className="text-emerald-400">{formatDuration(seconds)}</span>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-center gap-4 z-10 w-full pt-4 border-t border-[#1C3028]">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#182B24] text-white hover:bg-[#20382F]'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle (if video call) */}
          {type === 'video' && (
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                !isVideoOn ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#182B24] text-white hover:bg-[#20382F]'
              }`}
              title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          {/* Speaker Button */}
          <button
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              !isSpeaker ? 'bg-zinc-700/50 text-zinc-400' : 'bg-[#182B24] text-cyan-400 hover:bg-[#20382F]'
            }`}
            title="Speaker"
          >
            {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* End Call Button (Red) */}
          <button
            onClick={() => onEndCall(seconds)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30 transition-transform"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

