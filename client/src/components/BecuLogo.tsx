import React from 'react';

interface BecuLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

export const BecuLogo: React.FC<BecuLogoProps> = ({ className = '', size = 32, withText = false }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Paxta/Cotton Blossom Logo matching Screenshot 1 */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0 drop-shadow-sm">
        <defs>
          <linearGradient id="becuCottonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <g fill="url(#becuCottonGrad)">
          {/* Top Petal */}
          <circle cx="50" cy="38" r="18" />
          {/* Left Petal */}
          <circle cx="36" cy="56" r="18" />
          {/* Right Petal */}
          <circle cx="64" cy="56" r="18" />
          {/* Center filling connector */}
          <path d="M 36 50 Q 50 38 64 50 Q 64 64 50 66 Q 36 64 36 50 Z" />
          {/* Bottom pointy stem/calyx matching Screenshot 1 */}
          <path d="M 46 63 L 50 78 L 54 63 Z" />
        </g>
      </svg>
      {withText && (
        <span className="font-extrabold tracking-tight text-xl text-zinc-900 dark:text-white">
          Becu<span className="text-[#2563EB] dark:text-blue-400">Gram</span>
        </span>
      )}
    </div>
  );
};
