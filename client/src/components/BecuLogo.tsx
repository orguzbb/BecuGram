import React from 'react';

interface BecuLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

export const BecuLogo: React.FC<BecuLogoProps> = ({ className = '', size = 32, withText = false }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official BecuGram "B" Brand Icon */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0 drop-shadow-md">
        <defs>
          <linearGradient id="becuBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <linearGradient id="becuLobeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>
        {/* Rounded Modern Squircle Container */}
        <rect x="6" y="6" width="88" height="88" rx="26" fill="url(#becuBgGrad)" />
        {/* Stylized Modern Letter "B" */}
        <path
          d="M34 26 H52 C62 26 68 31 68 39 C68 45 64 49 58 51 C66 53 71 58 71 67 C71 76 63 82 52 82 H34 V26 Z M44 36 V49 H52 C56 49 60 46 60 42.5 C60 39 56 36 52 36 H44 Z M44 58 V72 H53 C58 72 62 69 62 65 C62 61 58 58 53 58 H44 Z"
          fill="#FFFFFF"
        />
        {/* Subtle dynamic accent dot */}
        <circle cx="75" cy="27" r="4.5" fill="#38BDF8" />
      </svg>
      {withText && (
        <span className="font-extrabold tracking-tight text-xl text-zinc-900 dark:text-white">
          Becu<span className="text-[#2563EB] dark:text-blue-400">Gram</span>
        </span>
      )}
    </div>
  );
};
