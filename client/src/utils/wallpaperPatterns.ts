/**
 * High-performance vector SVG pattern generators for BecuGram Chat Wallpapers
 */

export interface PatternDefinition {
  id: string;
  name: string;
  iconName: string;
  defaultScale: number;
  defaultOpacity: number;
  getSvg: (fillColor?: string) => string;
}

export const WALLPAPER_PATTERNS: Record<string, PatternDefinition> = {
  'telegram-doodle': {
    id: 'telegram-doodle',
    name: 'Telegram Doodles',
    iconName: 'MessageCircle',
    defaultScale: 90,
    defaultOpacity: 0.06,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'>
        <g fill='${fillColor}' fill-rule='evenodd'>
          <!-- Paper plane -->
          <path d='M25 15l15 6-15 6v-5l9-1-9-1v-5z' />
          <!-- Star -->
          <polygon points='70,22 72,28 78,28 73,32 75,38 70,34 65,38 67,32 62,28 68,28' />
          <!-- Heart -->
          <path d='M32 70c-2.5-3-6-2.5-7.5 0-1.5 2.5 0 6 7.5 11 7.5-5 9-8.5 7.5-11-1.5-2.5-5-3-7.5 0z' />
          <!-- Diamond -->
          <path d='M82 85l6 7 6-7-6-7-6 7zm1-4h10l-5 5-5-5z' />
          <!-- Coffee mug -->
          <path d='M18 42h8v7c0 2-2 4-4 4s-4-2-4-4v-7zm8 2h2c1 0 2 1 2 2s-1 2-2 2h-2v-4z' />
          <!-- Music note -->
          <path d='M85 15v10l-8 2v-8l8-4zm-8 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm8-2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' />
          <!-- Chat bubble -->
          <path d='M55 50h12c2 0 4 2 4 4v5c0 2-2 4-4 4h-4l-4 3v-3h-4c-2 0-4-2-4-4v-5c0-2 2-4 4-4z' />
          <!-- Smiley -->
          <circle cx='24' cy='105' r='6' stroke='${fillColor}' stroke-width='1.2' fill='none' />
          <circle cx='22' cy='103.5' r='0.8' />
          <circle cx='26' cy='103.5' r='0.8' />
          <path d='M22 106.5c0.8 1 3.2 1 4 0' stroke='${fillColor}' stroke-width='1' fill='none' />
          <!-- Sparkles -->
          <path d='M95 55l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z' />
        </g>
      </svg>
    `,
  },

  circuits: {
    id: 'circuits',
    name: 'Cyber Circuits',
    iconName: 'Cpu',
    defaultScale: 80,
    defaultOpacity: 0.08,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'>
        <g stroke='${fillColor}' stroke-width='1.2' fill='none'>
          <path d='M0 20h25l10 10h15l10-10h20M25 60h15l10-10h10' />
          <path d='M40 0v15l-10 10v20l10 10v25' />
          <circle cx='25' cy='20' r='2.5' fill='${fillColor}' />
          <circle cx='60' cy='20' r='2.5' fill='${fillColor}' />
          <circle cx='50' cy='50' r='2.5' fill='${fillColor}' />
          <circle cx='40' cy='45' r='2.5' fill='${fillColor}' />
          <rect x='34' y='28' width='12' height='12' rx='2' fill='none' stroke='${fillColor}' stroke-width='1.2' />
        </g>
      </svg>
    `,
  },

  stars: {
    id: 'stars',
    name: 'Yulduzlar (Stars)',
    iconName: 'Star',
    defaultScale: 70,
    defaultOpacity: 0.09,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='70' height='70' viewBox='0 0 70 70' xmlns='http://www.w3.org/2000/svg'>
        <g fill='${fillColor}'>
          <polygon points='35,10 37,20 47,22 39,28 41,38 35,32 29,38 31,28 23,22 33,20' />
          <circle cx='12' cy='15' r='1.2' />
          <circle cx='58' cy='25' r='1.5' />
          <circle cx='20' cy='52' r='1.8' />
          <circle cx='52' cy='58' r='1' />
          <path d='M15 40l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z' />
          <path d='M50 10l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z' />
        </g>
      </svg>
    `,
  },

  hexagons: {
    id: 'hexagons',
    name: 'Hexagon Matrix',
    iconName: 'Hexagon',
    defaultScale: 60,
    defaultOpacity: 0.07,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'>
        <g stroke='${fillColor}' stroke-width='1.2' fill='none'>
          <path d='M30 0l30 17.3v34.6L30 69.3 0 52V17.3zM30 52l30 17.3v34.6L30 121.3 0 104V69.3z' />
          <circle cx='30' cy='17.3' r='2' fill='${fillColor}' />
          <circle cx='30' cy='69.3' r='2' fill='${fillColor}' />
        </g>
      </svg>
    `,
  },

  waves: {
    id: 'waves',
    name: 'Topographic Waves',
    iconName: 'Activity',
    defaultScale: 90,
    defaultOpacity: 0.08,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='90' height='90' viewBox='0 0 90 90' xmlns='http://www.w3.org/2000/svg'>
        <g stroke='${fillColor}' stroke-width='1.2' fill='none'>
          <path d='M0 15c20-10 25 15 45 5s25-10 45 0' />
          <path d='M0 35c20-10 25 15 45 5s25-10 45 0' />
          <path d='M0 55c20-10 25 15 45 5s25-10 45 0' />
          <path d='M0 75c20-10 25 15 45 5s25-10 45 0' />
        </g>
      </svg>
    `,
  },

  diamonds: {
    id: 'diamonds',
    name: 'Brilliant & Facets',
    iconName: 'Gem',
    defaultScale: 64,
    defaultOpacity: 0.07,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'>
        <g stroke='${fillColor}' stroke-width='1' fill='none'>
          <polygon points='32,4 56,20 32,60 8,20' />
          <polyline points='8,20 32,26 56,20' />
          <line x1='32' y1='4' x2='32' y2='60' />
          <line x1='20' y1='4' x2='24' y2='24' />
          <line x1='44' y1='4' x2='40' y2='24' />
        </g>
      </svg>
    `,
  },

  constellation: {
    id: 'constellation',
    name: 'Constellation Grid',
    iconName: 'Compass',
    defaultScale: 85,
    defaultOpacity: 0.07,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='85' height='85' viewBox='0 0 85 85' xmlns='http://www.w3.org/2000/svg'>
        <g stroke='${fillColor}' stroke-width='0.8' fill='none'>
          <line x1='15' y1='20' x2='40' y2='30' />
          <line x1='40' y1='30' x2='70' y2='15' />
          <line x1='40' y1='30' x2='50' y2='65' />
          <line x1='50' y1='65' x2='25' y2='70' />
          <line x1='25' y1='70' x2='15' y2='20' />
          <circle cx='15' cy='20' r='2.5' fill='${fillColor}' stroke='none' />
          <circle cx='40' cy='30' r='2' fill='${fillColor}' stroke='none' />
          <circle cx='70' cy='15' r='3' fill='${fillColor}' stroke='none' />
          <circle cx='50' cy='65' r='2.5' fill='${fillColor}' stroke='none' />
          <circle cx='25' cy='70' r='1.8' fill='${fillColor}' stroke='none' />
        </g>
      </svg>
    `,
  },

  hearts: {
    id: 'hearts',
    name: 'Floating Hearts',
    iconName: 'Heart',
    defaultScale: 60,
    defaultOpacity: 0.08,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'>
        <g fill='${fillColor}'>
          <path d='M25 15c-3-4-8-3-10 0-2 3 0 7 10 13 10-6 12-10 10-13-2-3-7-4-10 0z' />
          <path d='M48 40c-2-3-5-2-6.5 0-1.5 2 0 5 6.5 9 6.5-4 8-7 6.5-9-1.5-2-4.5-3-6.5 0z' opacity='0.7' />
          <circle cx='15' cy='45' r='1.2' />
          <circle cx='42' cy='18' r='1.5' />
        </g>
      </svg>
    `,
  },

  'cyber-grid': {
    id: 'cyber-grid',
    name: 'Cyber Matrix Grid',
    iconName: 'Grid',
    defaultScale: 40,
    defaultOpacity: 0.06,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'>
        <g stroke='${fillColor}' stroke-width='0.75' fill='none'>
          <path d='M0 20h40M20 0v40' />
          <circle cx='20' cy='20' r='1.5' fill='${fillColor}' />
        </g>
      </svg>
    `,
  },

  dots: {
    id: 'dots',
    name: 'Minimalist Dots',
    iconName: 'Circle',
    defaultScale: 32,
    defaultOpacity: 0.09,
    getSvg: (fillColor = '%23ffffff') => `
      <svg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
        <g fill='${fillColor}'>
          <circle cx='16' cy='16' r='1.6' />
          <circle cx='0' cy='0' r='1' />
          <circle cx='32' cy='0' r='1' />
          <circle cx='0' cy='32' r='1' />
          <circle cx='32' cy='32' r='1' />
        </g>
      </svg>
    `,
  },
};

/**
 * Returns a complete CSS background style object for any WallpaperConfig
 */
export function getWallpaperCssStyle(config: {
  backgroundColor?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  pattern?: string;
  patternOpacity?: number;
  patternScale?: number;
  customImageUrl?: string;
  blur?: number;
  brightness?: number;
  opacity?: number;
}): React.CSSProperties {
  const styles: React.CSSProperties = {};

  // 1. Background image / gradient base
  if (config.customImageUrl) {
    styles.backgroundImage = `url("${config.customImageUrl}")`;
    styles.backgroundSize = 'cover';
    styles.backgroundPosition = 'center';
    styles.backgroundRepeat = 'no-repeat';
  } else if (config.gradient && config.gradient.colors && config.gradient.colors.length > 0) {
    const angle = config.gradient.angle ?? 135;
    const colors = config.gradient.colors.join(', ');
    if (config.gradient.type === 'radial') {
      styles.backgroundImage = `radial-gradient(circle at center, ${colors})`;
    } else {
      styles.backgroundImage = `linear-gradient(${angle}deg, ${colors})`;
    }
  } else if (config.backgroundColor) {
    styles.backgroundColor = config.backgroundColor;
  } else {
    styles.backgroundColor = '#0F0F0F';
  }

  // 2. Brightness filter if adjusted
  if (config.brightness && config.brightness !== 100) {
    styles.filter = `brightness(${config.brightness}%)`;
  }

  return styles;
}

/**
 * Returns the SVG pattern Data URI for a pattern ID and tint
 */
export function getPatternDataUri(patternId?: string, tintHex = '#ffffff'): string | null {
  if (!patternId || !WALLPAPER_PATTERNS[patternId]) return null;
  const def = WALLPAPER_PATTERNS[patternId];
  const encodedColor = encodeURIComponent(tintHex);
  const rawSvg = def.getSvg(encodedColor).replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
}

