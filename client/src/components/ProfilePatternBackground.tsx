import React from 'react';

interface ProfilePatternBackgroundProps {
  pattern?: string;
  isPremium?: boolean;
  gradient?: string;
  coverImage?: string | null;
}

export const ProfilePatternBackground: React.FC<ProfilePatternBackgroundProps> = ({
  pattern = 'stars',
  isPremium = false,
  gradient,
  coverImage,
}) => {
  if (!isPremium && !gradient && !coverImage) return null;

  const iconsMap: Record<string, string> = {
    stars: `<polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' fill='%23F59E0B' fill-opacity='0.12' />`,
    crowns: `<path d='m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14' stroke='%23EAB308' stroke-width='2' fill='none' opacity='0.14' />`,
    diamonds: `<path d='M6 3h12l4 6-10 13L2 9Z' stroke='%2306B6D4' stroke-width='1.8' fill='none' opacity='0.15' />`,
    sparkles: `<path d='m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z' fill='%23A855F7' fill-opacity='0.14' />`,
    flames: `<path d='M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' fill='%23F43F5E' fill-opacity='0.12' />`,
    zap: `<polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' fill='%238B5CF6' fill-opacity='0.12' />`,
  };

  const svgContent = iconsMap[pattern] || iconsMap['stars'];
  const svgDataUri = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24'>${encodeURIComponent(
    svgContent
  )}</svg>`;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Base Gradient or Cover Image */}
      {coverImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url("${coverImage}")` }}
        />
      ) : gradient ? (
        <div className={`absolute inset-0 bg-gradient-to-b ${gradient} opacity-25`} />
      ) : null}

      {/* Repeating Pattern Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: `url("${svgDataUri}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '54px 54px',
        }}
      />
    </div>
  );
};
