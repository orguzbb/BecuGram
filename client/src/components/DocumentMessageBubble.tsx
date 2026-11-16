import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, FileArchive, FileSpreadsheet, FileCode, File } from 'lucide-react';
import { getMediaUrl } from '../services/api';

interface DocumentMessageBubbleProps {
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  isMe?: boolean;
}

export const DocumentMessageBubble: React.FC<DocumentMessageBubbleProps> = ({
  url,
  name = 'Hujjat',
  size,
  mimeType,
  isMe = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // File extension detection
  const ext = name.split('.').pop()?.toLowerCase() || '';

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Determine icon & color theme based on file extension
  const getTheme = () => {
    if (ext === 'pdf') {
      return {
        bg: 'bg-red-500/15 text-red-600 dark:text-red-400',
        badge: 'bg-red-600 text-white',
        icon: FileText,
        label: 'PDF',
      };
    }
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
      return {
        bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-600 text-white',
        icon: FileText,
        label: 'DOC',
      };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return {
        bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-600 text-white',
        icon: FileSpreadsheet,
        label: 'XLS',
      };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return {
        bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-600 text-white',
        icon: FileArchive,
        label: 'ZIP',
      };
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'html', 'css', 'json', 'c', 'cpp'].includes(ext)) {
      return {
        bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-600 text-white',
        icon: FileCode,
        label: ext.toUpperCase(),
      };
    }
    return {
      bg: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
      badge: 'bg-zinc-600 text-white',
      icon: File,
      label: ext ? ext.toUpperCase() : 'FILE',
    };
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = getMediaUrl(url);
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
      setDownloaded(true);
    }, 1200);
  };

  return (
    <div
      onClick={handleDownload}
      className={`flex items-center gap-3 p-2 sm:p-2.5 rounded-2xl cursor-pointer transition-all active:scale-[0.99] select-none ${
        isMe
          ? 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15'
          : 'bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80'
      }`}
    >
      {/* Left Icon with extension badge */}
      <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${theme.bg}`}>
        {isDownloading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : downloaded ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : (
          <IconComponent className="w-6 h-6" />
        )}

        {/* Small extension badge pill */}
        <span
          className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] font-bold tracking-tight shadow-sm ${theme.badge}`}
        >
          {theme.label}
        </span>
      </div>

      {/* Middle info */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs sm:text-sm font-semibold truncate leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
          {name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
          <span>{formatSize(size) || ext.toUpperCase()}</span>
          {downloaded && <span className="text-emerald-500 font-sans font-medium text-[10px]">Yuklandi</span>}
        </div>
      </div>

      {/* Right Download Arrow Button */}
      <button
        type="button"
        onClick={handleDownload}
        className={`p-2 rounded-full shrink-0 transition-transform active:scale-90 ${
          isMe
            ? 'text-zinc-700 dark:text-zinc-200 hover:bg-black/10 dark:hover:bg-white/10'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
        }`}
        title="Faylni yuklab olish"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
};
