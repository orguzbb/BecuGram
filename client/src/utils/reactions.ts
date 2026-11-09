export interface ReactionItem {
  id: string;
  name: string;
  emoji: string;
  path: string;
}

export const TELEGRAM_REACTIONS: ReactionItem[] = [
  { id: '006', name: 'Yurak', emoji: '❤️', path: '/reactions/006.json' },
  { id: '002', name: 'Zo‘r (Like)', emoji: '👍', path: '/reactions/002.json' },
  { id: '007', name: 'Olov', emoji: '🔥', path: '/reactions/007.json' },
  { id: '020', name: 'Kulgi', emoji: '😂', path: '/reactions/020.json' },
  { id: '010', name: 'Bayram', emoji: '🎉', path: '/reactions/010.json' },
  { id: '004', name: 'Rahmat', emoji: '🙏', path: '/reactions/004.json' },
  { id: '008', name: 'O‘ychan', emoji: '🤔', path: '/reactions/008.json' },
  { id: '009', name: 'Qarsaklar', emoji: '👏', path: '/reactions/009.json' },
  { id: '011', name: 'Yulduzcha', emoji: '🤩', path: '/reactions/011.json' },
  { id: '012', name: 'Qo‘rquv', emoji: '😱', path: '/reactions/012.json' },
  { id: '014', name: 'Yig‘i', emoji: '😭', path: '/reactions/014.json' },
  { id: '015', name: 'Jahl', emoji: '😡', path: '/reactions/015.json' },
  { id: '001', name: 'Salomlashish', emoji: '🤝', path: '/reactions/001.json' },
  { id: '005', name: 'OK', emoji: '👌', path: '/reactions/005.json' },
  { id: '017', name: 'Tabassum', emoji: '😊', path: '/reactions/017.json' },
  { id: '018', name: 'Chaqmoq', emoji: '⚡', path: '/reactions/018.json' },
  { id: '019', name: '100 ball', emoji: '💯', path: '/reactions/019.json' },
  { id: '003', name: 'Musht', emoji: '✊', path: '/reactions/003.json' },
  { id: '013', name: 'Hayron', emoji: '😳', path: '/reactions/013.json' },
  { id: '016', name: 'Zerikarli', emoji: '😒', path: '/reactions/016.json' },
  { id: '021', name: 'Kulgili', emoji: '💩', path: '/reactions/021.json' },
];

export const getReactionPath = (reactionKey: string): string => {
  // If it's directly an id like "002"
  if (/^\d{3}$/.test(reactionKey)) {
    return `/reactions/${reactionKey}.json`;
  }

  // If it's an emoji, find matching reaction
  const found = TELEGRAM_REACTIONS.find((r) => r.emoji === reactionKey);
  if (found) return found.path;

  // Fallback to 006 (heart) if heart-related
  if (reactionKey === '❤️' || reactionKey === 'heart') return '/reactions/006.json';
  if (reactionKey === '👍' || reactionKey === 'like') return '/reactions/002.json';
  if (reactionKey === '🔥' || reactionKey === 'fire') return '/reactions/007.json';

  // Default to 002 (like)
  return '/reactions/002.json';
};

