import React from 'react';

interface BecuLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

export const BecuLogo: React.FC<BecuLogoProps> = ({ className = '', size = 32, withText = false }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0 drop-shadow-sm">
        <defs>
          <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="pinkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        {/* Left vertical stem: Dark in light mode, white in dark mode */}
        <rect x="22" y="16" width="16" height="68" rx="8" className="fill-[#1E1915] dark:fill-white" />
        {/* Top cyan lobe */}
        <circle cx="58" cy="35" r="19" fill="url(#cyanGrad)" />
        {/* Bottom pink lobe */}
        <circle cx="58" cy="65" r="19" fill="url(#pinkGrad)" />
      </svg>
      {withText && (
        <span className="font-extrabold tracking-tight text-xl text-[#1E1915] dark:text-white">
          Becu<span className="text-[#9D5215] dark:text-cyan-400">Gram</span>
        </span>
      )}
    </div>
  );
};
