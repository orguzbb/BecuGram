import React, { useRef } from 'react';
import {
  Palette,
  Sliders,
  Sparkles,
  Upload,
  RefreshCw,
  Sun,
  Eye,
  Layers,
  Compass,
  Check,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { WallpaperConfig } from '../../stores/appearanceStore';
import { WALLPAPER_PATTERNS } from '../../utils/wallpaperPatterns';

interface BackgroundCustomizerProps {
  config: WallpaperConfig;
  onChange: (updated: WallpaperConfig) => void;
  onReset: () => void;
}

const PRESET_COLORS = [
  '#0F0F0F',
  '#212121',
  '#090D10',
  '#0B121C',
  '#06281E',
  '#041B2D',
  '#1E1B4B',
  '#2E1065',
  '#43122B',
  '#1F1B3E',
  '#12161A',
  '#000000',
  '#F8FAFC',
  '#EFE9E0',
  '#FBF7F0',
  '#0284C7',
  '#2563EB',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
];

const PRESET_GRADIENTS = [
  { name: 'Telegram Celestial', colors: ['#0F0F0F', '#1B2C3F', '#3390EC'], angle: 155 },
  { name: 'Becu Mint Glow', colors: ['#051512', '#0A3328', '#10B981'], angle: 135 },
  { name: 'Deep Space', colors: ['#050810', '#1E1B4B', '#4C1D95'], angle: 160 },
  { name: 'Sunset Royale', colors: ['#180920', '#701A75', '#F43F5E'], angle: 140 },
  { name: 'Midnight Emerald', colors: ['#02120E', '#064E3B', '#34D399'], angle: 130 },
  { name: 'Imperial Sapphire', colors: ['#060A18', '#1E3A8A', '#D97706'], angle: 145 },
  { name: 'Neon Cyber', colors: ['#020A10', '#0284C7', '#F43F5E'], angle: 135 },
  { name: 'Monochrome Slate', colors: ['#0A0F17', '#1E293B', '#334155'], angle: 180 },
];

export const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({
  config,
  onChange,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle custom image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        ...config,
        type: 'image',
        customImageUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const currentGradientColors = config.gradient?.colors || ['#0F0F0F', '#212121'];
  const currentAngle = config.gradient?.angle ?? 135;

  const updateGradientColor = (index: number, newColor: string) => {
    const nextColors = [...currentGradientColors];
    nextColors[index] = newColor;
    onChange({
      ...config,
      type: 'gradient',
      customImageUrl: undefined,
      gradient: {
        type: config.gradient?.type || 'linear',
        colors: nextColors,
        angle: currentAngle,
      },
    });
  };

  const updateGradientAngle = (newAngle: number) => {
    onChange({
      ...config,
      type: 'gradient',
      gradient: {
        type: config.gradient?.type || 'linear',
        colors: currentGradientColors,
        angle: newAngle,
      },
    });
  };

  return (
    <div className="space-y-6 text-zinc-900 dark:text-white select-none">
      {/* 1. SECTION: BACKGROUND TYPE SELECTOR */}
      <div className="p-1 bg-zinc-100 dark:bg-[#111A24] rounded-2xl flex items-center gap-1 border border-black/5 dark:border-white/5">
        <button
          type="button"
          onClick={() =>
            onChange({
              ...config,
              type: 'gradient',
              customImageUrl: undefined,
              gradient: { type: 'linear', colors: currentGradientColors, angle: currentAngle },
            })
          }
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            config.type === 'gradient'
              ? 'bg-[#3390EC] text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Gradient</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onChange({
              ...config,
              type: 'solid',
              customImageUrl: undefined,
              backgroundColor: config.backgroundColor || '#0F0F0F',
            })
          }
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            config.type === 'solid'
              ? 'bg-[#3390EC] text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Yagona rang (Solid)</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            config.type === 'image' || Boolean(config.customImageUrl)
              ? 'bg-[#3390EC] text-white shadow-md shadow-blue-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Rasm yuklash</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* 2. GRADIENT / COLOR DESIGNER */}
      {config.type === 'gradient' && (
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#15202B] border border-black/5 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#3390EC]" />
              Gradient Ranglari & Yo'nalishi
            </span>
            <span className="text-xs font-bold font-mono text-[#3390EC]">
              {currentAngle}°
            </span>
          </div>

          {/* Color stops (Start, Middle, End) */}
          <div className="grid grid-cols-3 gap-2.5">
            {currentGradientColors.slice(0, 3).map((col, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1C2836] border border-black/5 dark:border-white/10 shadow-xs"
              >
                <input
                  type="color"
                  value={col}
                  onChange={(e) => updateGradientColor(idx, e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block font-semibold">
                    {idx === 0 ? 'Boshlanish' : idx === 1 ? 'O‘rtasi' : 'Oxiri'}
                  </span>
                  <span className="text-xs font-bold font-mono uppercase text-zinc-800 dark:text-white truncate">
                    {col}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Angle Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Burchak darajasi</span>
              <span className="font-mono">{currentAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={currentAngle}
              onChange={(e) => updateGradientAngle(Number(e.target.value))}
              className="w-full accent-[#3390EC] cursor-pointer"
            />
          </div>

          {/* Quick Gradient Presets */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-400 block mb-2">
              Tayyor shablon gradientlar:
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESET_GRADIENTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  title={p.name}
                  onClick={() =>
                    onChange({
                      ...config,
                      gradient: {
                        type: 'linear',
                        colors: p.colors,
                        angle: p.angle,
                      },
                    })
                  }
                  className="h-8 rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all border border-white/20 relative group"
                  style={{
                    background: `linear-gradient(${p.angle}deg, ${p.colors.join(', ')})`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOLID COLOR PICKER */}
      {config.type === 'solid' && (
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#15202B] border border-black/5 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Yagona Rang Tanlash
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.backgroundColor || '#0F0F0F'}
                onChange={(e) =>
                  onChange({
                    ...config,
                    backgroundColor: e.target.value,
                  })
                }
                className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-xs font-bold font-mono uppercase text-[#3390EC]">
                {config.backgroundColor || '#0F0F0F'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {PRESET_COLORS.map((col) => {
              const isSelected =
                config.backgroundColor?.toLowerCase() === col.toLowerCase();
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => onChange({ ...config, backgroundColor: col })}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110 active:scale-95 shadow-xs flex items-center justify-center border border-white/10"
                  style={{ backgroundColor: col }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PATTERN SELECTOR & CONTROLS */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#15202B] border border-black/5 dark:border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Vektor Naqsh (Pattern Overlay)
          </span>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...config,
                pattern: undefined,
              })
            }
            className={`text-xs font-semibold ${
              !config.pattern
                ? 'text-zinc-400'
                : 'text-rose-500 hover:underline cursor-pointer'
            }`}
          >
            Naqshsiz
          </button>
        </div>

        {/* Pattern Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.values(WALLPAPER_PATTERNS).map((pat) => {
            const isSelected = config.pattern === pat.id;
            return (
              <button
                key={pat.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    pattern: pat.id,
                    patternOpacity: config.patternOpacity || pat.defaultOpacity,
                    patternScale: config.patternScale || pat.defaultScale,
                  })
                }
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#3390EC] bg-[#3390EC]/15 text-[#3390EC] shadow-sm scale-102 font-bold'
                    : 'border-black/5 dark:border-white/5 bg-white dark:bg-[#1C2836] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20'
                }`}
              >
                <span className="text-xs truncate max-w-full">{pat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Pattern Opacity & Scale Sliders (if pattern selected) */}
        {config.pattern && (
          <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Naqsh shaffofligi (Opacity)</span>
                <span className="font-mono">
                  {Math.round((config.patternOpacity ?? 0.08) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.4"
                step="0.01"
                value={config.patternOpacity ?? 0.08}
                onChange={(e) =>
                  onChange({
                    ...config,
                    patternOpacity: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-[#3390EC] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Naqsh o‘lchami (Scale)</span>
                <span className="font-mono">{config.patternScale ?? 85}px</span>
              </div>
              <input
                type="range"
                min="35"
                max="180"
                step="5"
                value={config.patternScale ?? 85}
                onChange={(e) =>
                  onChange({
                    ...config,
                    patternScale: parseInt(e.target.value),
                  })
                }
                className="w-full accent-[#3390EC] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. OPTICAL FILTERS: BLUR & BRIGHTNESS */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#15202B] border border-black/5 dark:border-white/5 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Sun className="w-4 h-4 text-amber-400" />
          Vizual Effektlar (Blur & Yorug‘lik)
        </span>

        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Yorug‘lik (Brightness)</span>
            <span className="font-mono">{config.brightness ?? 100}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            step="5"
            value={config.brightness ?? 100}
            onChange={(e) =>
              onChange({
                ...config,
                brightness: parseInt(e.target.value),
              })
            }
            className="w-full accent-[#3390EC] cursor-pointer"
          />
        </div>

        {/* Blur */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Xiralashtirish (Blur)</span>
            <span className="font-mono">{config.blur ?? 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="16"
            step="1"
            value={config.blur ?? 0}
            onChange={(e) =>
              onChange({
                ...config,
                blur: parseInt(e.target.value),
              })
            }
            className="w-full accent-[#3390EC] cursor-pointer"
          />
        </div>
      </div>

      {/* 5. RESET BUTTON */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-[#1C2836] hover:bg-zinc-300 dark:hover:bg-[#253648] text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Barcha sozlamalarni tiklash</span>
        </button>
      </div>
    </div>
  );
};

