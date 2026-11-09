import React from 'react';

interface BadgeProps {
  count: number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-bold text-white rounded-full bg-[#F43F5E] shadow-sm shadow-rose-500/30 ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

