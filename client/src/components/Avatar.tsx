import React from 'react';
import { Bookmark, Megaphone } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
  badge?: React.ReactNode;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const badgeSizes = {
  xs: 'w-2 h-2 bottom-0 right-0 border',
  sm: 'w-2.5 h-2.5 bottom-0 right-0 border-2',
  md: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
  lg: 'w-4 h-4 bottom-0.5 right-0.5 border-2',
  xl: 'w-5 h-5 bottom-1 right-1 border-3',
  '2xl': 'w-6 h-6 bottom-1.5 right-1.5 border-4',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline = false,
  className = '',
  onClick,
  badge,
}) => {
  const cleanName = (name || '').trim();
  const isSaved = cleanName.toLowerCase().includes('saqlangan') || cleanName.toLowerCase().includes('saved');
  const isOfficial = cleanName.toLowerCase().includes('rasmiy') || cleanName.toLowerCase().includes('official');

  // Single bold uppercase initial (like Image 1 & 2 "A")
  const initial = cleanName ? cleanName.charAt(0).toUpperCase() : '?';

  // Palette matching modern Telegram & reference screenshots
  const bgColors = [
    'bg-[#4F46E5]', // Vibrant purple-blue (matches reference screen "A")
    'bg-[#0D9488]', // Teal
    'bg-[#0284C7]', // Sky Blue
    'bg-[#9333EA]', // Purple
    'bg-[#E11D48]', // Rose
    'bg-[#D97706]', // Amber
  ];
  const charSum = cleanName.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const colorClass = bgColors[charSum % bgColors.length];

  const isValidSrc = Boolean(
    src &&
    src.trim() !== '' &&
    !src.includes('1794151183673') &&
    !src.includes('unsplash')
  );

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:opacity-90' : ''
      } ${className}`}
    >
      {/* If explicit image URL is provided, render image; otherwise clean initial / icon */}
      {isValidSrc ? (
        <img
          src={src}
          alt={cleanName}
          className="w-full h-full object-cover rounded-full ring-1 ring-black/5 dark:ring-white/10"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : isSaved ? (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4A3E3D] via-[#654321] to-[#3B2F2F] flex items-center justify-center text-white shadow-sm ring-1 ring-black/10">
          <Bookmark className="w-1/2 h-1/2 stroke-[2.2] fill-white/20" />
        </div>
      ) : isOfficial ? (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-sm ring-1 ring-black/10">
          <Megaphone className="w-1/2 h-1/2 stroke-[2.2]" />
        </div>
      ) : (
        <div
          className={`w-full h-full rounded-full ${colorClass} flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 select-none`}
        >
          {initial}
        </div>
      )}

      {/* Online green indicator */}
      {isOnline && !badge && (
        <span
          className={`absolute rounded-full bg-[#10B981] border-white dark:border-[#0E1715] ${badgeSizes[size]} ring-1 ring-[#10B981]/50 shadow-sm`}
          title="Online"
        />
      )}

      {/* Custom badge (e.g. story plus icon) */}
      {badge && <div className="absolute -bottom-0.5 -right-0.5">{badge}</div>}
    </div>
  );
};
