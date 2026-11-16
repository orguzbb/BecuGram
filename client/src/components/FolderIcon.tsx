import React from 'react';
import {
  Folder,
  Briefcase,
  Home,
  BookOpen,
  Rocket,
  Star,
  Heart,
  Megaphone,
  Users,
  MessageSquare,
  Sparkles,
  Shield,
  Gamepad2,
  Flame,
  Code,
  Music,
  Coffee,
  Zap,
  Archive,
  Compass,
  Crown,
  Gem,
  Bell,
  CheckCircle,
} from 'lucide-react';

export const FOLDER_ICONS: { id: string; name: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'Briefcase', name: 'Ish', Icon: Briefcase },
  { id: 'Home', name: 'Oila / Uy', Icon: Home },
  { id: 'BookOpen', name: "O'qish", Icon: BookOpen },
  { id: 'Rocket', name: 'Loyihalar', Icon: Rocket },
  { id: 'Star', name: 'Tanlangan', Icon: Star },
  { id: 'Heart', name: 'Yaqinlar', Icon: Heart },
  { id: 'Crown', name: 'VIP', Icon: Crown },
  { id: 'Gem', name: 'Maxsus', Icon: Gem },
  { id: 'Flame', name: 'Trend', Icon: Flame },
  { id: 'Zap', name: 'Tezkor', Icon: Zap },
  { id: 'Megaphone', name: 'Kanallar', Icon: Megaphone },
  { id: 'Users', name: 'Guruhlar', Icon: Users },
  { id: 'MessageSquare', name: 'Xabarlar', Icon: MessageSquare },
  { id: 'Sparkles', name: 'Sehrli', Icon: Sparkles },
  { id: 'Shield', name: 'Xavfsiz', Icon: Shield },
  { id: 'Gamepad2', name: "O'yinlar", Icon: Gamepad2 },
  { id: 'Code', name: 'IT / Kod', Icon: Code },
  { id: 'Music', name: 'Musiqa', Icon: Music },
  { id: 'Coffee', name: 'Dam olish', Icon: Coffee },
  { id: 'Compass', name: 'Sayohat', Icon: Compass },
  { id: 'Archive', name: 'Arxiv', Icon: Archive },
  { id: 'Folder', name: 'Jild', Icon: Folder },
];

interface FolderIconProps {
  iconName?: string;
  className?: string;
  fallbackEmoji?: string;
}

export const FolderIcon: React.FC<FolderIconProps> = ({
  iconName,
  className = 'w-4 h-4',
  fallbackEmoji,
}) => {
  if (iconName) {
    const found = FOLDER_ICONS.find((i) => i.id === iconName);
    if (found) {
      const Comp = found.Icon;
      return <Comp className={className} />;
    }
  }

  // Fallback map if old emoji was saved
  const emojiMap: Record<string, React.ComponentType<{ className?: string }>> = {
    '💼': Briefcase,
    '🏠': Home,
    '📚': BookOpen,
    '🚀': Rocket,
    '⭐️': Star,
    '❤️': Heart,
    '📢': Megaphone,
    '👥': Users,
    '💬': MessageSquare,
    '⚡️': Zap,
    '🎯': Flame,
    '🎮': Gamepad2,
    '🎨': Sparkles,
    '📌': Shield,
    '💡': Gem,
  };

  if (fallbackEmoji && emojiMap[fallbackEmoji]) {
    const Comp = emojiMap[fallbackEmoji];
    return <Comp className={className} />;
  }

  if (fallbackEmoji) {
    return <span className="text-xs">{fallbackEmoji}</span>;
  }

  return <Folder className={className} />;
};

