import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Smile,
  Mic,
  Send,
  CheckCheck,
  X,
  MoreVertical,
  Trash2,
  VolumeX,
  User as UserIcon,
  Paperclip,
  Search,
  ChevronDown,
  ChevronUp,
  CornerUpLeft,
  Edit2,
  Copy,
  Share2,
  Pin,
  Check,
  Clock,
  Ban,
  Sparkles,
  Palette,
  Lock,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { VoicePlayer } from '../../components/VoicePlayer';
import { RoundVideoMessage } from '../../components/RoundVideoMessage';
import { MediaViewer } from '../../components/MediaViewer';
import { MediaSendModal } from '../../components/MediaSendModal';
import { InlineVideoPlayer } from '../../components/InlineVideoPlayer';
import { DocumentMessageBubble } from '../../components/DocumentMessageBubble';
import { CallModal } from '../../components/CallModal';
import { ForwardMessageModal } from '../../components/ForwardMessageModal';
import { LottieAnimation } from '../../components/LottieAnimation';
import { TELEGRAM_REACTIONS, getReactionPath } from '../../utils/reactions';
import { playSentSound, playReceivedSound, playLockSound, playPopSound } from '../../utils/soundEffects';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useAppearanceStore } from '../../stores/appearanceStore';
import { getWallpaperCssStyle, getPatternDataUri } from '../../utils/wallpaperPatterns';
import { ChatBackgroundGalleryModal } from '../../components/chat-background/ChatBackgroundGalleryModal';
import { StickerPicker } from '../../components/stickers/StickerPicker';
import { api, getMediaUrl } from '../../services/api';
import { socketService } from '../../services/socket';
import { Message, Conversation, User } from '../../types';
import { useToast } from '../../components/Toast';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';
import { LucideSticker, STICKER_ICONS } from '../../components/LucideSticker';

interface PrivateChatViewProps {
  conversation: Conversation;
  onBack: () => void;
  onOpenProfile: (user: User) => void;
}

export const PrivateChatView: React.FC<PrivateChatViewProps> = ({
  conversation,
  onBack,
  onOpenProfile,
}) => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const { typingUsers, onlineUserIds } = useChatStore();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Telegram-style Delete confirmation modal state
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<Message | null>(null);
  const [deleteForEveryone, setDeleteForEveryone] = useState(true);

  // Context Menu State (Image 1)
  const [contextMenuMessage, setContextMenuMessage] = useState<Message | null>(null);
  const [contextMenuCoords, setContextMenuCoords] = useState<{ x: number; y: number } | null>(null);
  const [animatingHeartMsgId, setAnimatingHeartMsgId] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  // Scroll to bottom indicator (Image 2: "Oxirlariga")
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Voice & Round Video recording state (Telegram style)
  const [recordMode, setRecordMode] = useState<'voice' | 'video'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingLocked, setIsRecordingLocked] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const dragStartYRef = useRef<number | null>(null);

  // Call Modal state
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);

  // In-Chat Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Pinned Message State
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(
    conversation.pinnedMessage || null
  );

  // Picker Tab ('emoji' | 'stickers')
  const [pickerTab, setPickerTab] = useState<'emoji' | 'stickers'>('emoji');

  // Emoji picker, wallpaper modal & header menu states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const { getWallpaperForChat } = useAppearanceStore();
  const currentWallpaper = getWallpaperForChat(conversation._id, theme);
  const bgStyle = getWallpaperCssStyle(currentWallpaper);
  const patternTint = theme === 'light' ? '#374151' : '#ffffff';
  const patternUri = getPatternDataUri(currentWallpaper.pattern, patternTint);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Phase 4 Media Engine: Viewer & Pre-Send Modal states
  const [selectedMediaMessageId, setSelectedMediaMessageId] = useState<string | null>(null);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([]);
  const [isMediaSendModalOpen, setIsMediaSendModalOpen] = useState(false);

  // Real-time AudioContext Waveform Analyzer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformSamplesRef = useRef<number[]>([]);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derived list of media messages in this conversation for MediaViewer carousel
  const mediaMessages = useMemo(() => {
    return messages.filter(
      (m) =>
        m.type === 'image' ||
        m.type === 'video' ||
        m.type === 'round_video' ||
        m.type === 'video_note' ||
        m.type === 'gif'
    );
  }, [messages]);

  const openMediaViewer = (messageId: string) => {
    setSelectedMediaMessageId(messageId);
    setIsMediaViewerOpen(true);
  };

  const isDirect = conversation.type === 'direct';
  const partner = isDirect ? conversation.partner : null;
  const isOnline = partner?._id
    ? partner.isOnline || onlineUserIds.has(partner._id)
    : false;
  const isSavedMessages = conversation._id.startsWith('conv_saved_');
  const chatTitle = isSavedMessages
    ? 'Saqlanganlar'
    : isDirect
    ? partner?.displayName || 'Foydalanuvchi'
    : conversation.group?.name || 'Guruh';
  const chatSubtitle = isSavedMessages
    ? "o'zim uchun eslatma..."
    : isOnline
    ? 'onlayn'
    : 'oxirgi faollik yaqinda';

  const isPartnerBlocked = Boolean(partner && user?.blockedUsers?.includes(partner._id));

  // Compute matched message ids for in-chat search
  const matchedMessageIds = messages
    .filter(
      (m) =>
        searchQuery.trim() &&
        m.content &&
        m.content.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
    .map((m) => m._id);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-400', 'ring-offset-2', 'rounded-2xl');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-amber-400', 'ring-offset-2', 'rounded-2xl');
      }, 2000);
    }
  };

  const handleToggleBlockPartner = async () => {
    if (!partner) return;
    try {
      const res = await api.toggleBlockUser(partner._id);
      if (user) {
        user.blockedUsers = res.blockedUsers;
      }
      showToast(
        res.isBlocked
          ? `${partner.displayName} bloklandi 🚫`
          : `${partner.displayName} blokdan chiqarildi ✅`,
        res.isBlocked ? 'warning' : 'success'
      );
    } catch {
      showToast('Xatolik yuz berdi', 'error');
    }
  };

  const handleSendSticker = async (stickerEmoji: string, _label: string) => {
    setShowEmojiPicker(false);
    try {
      const newMsg = await api.sendMessage(conversation._id, {
        content: stickerEmoji,
        type: 'sticker',
        clientTempId: crypto.randomUUID(),
      });
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom(true);
    } catch {
      showToast('Stiker yuborishda xatolik', 'error');
    }
  };

  const handleSendGif = async (gifUrl: string, title?: string) => {
    setShowEmojiPicker(false);
    try {
      const newMsg = await api.sendMessage(conversation._id, {
        content: title || '',
        type: 'gif',
        clientTempId: crypto.randomUUID(),
        media: {
          url: gifUrl,
          name: title || 'reaction.gif',
          mimeType: 'image/gif',
        },
      });
      setMessages((prev) => [...prev, newMsg]);
      playSentSound();
      scrollToBottom(true);
    } catch {
      showToast('GIF yuborishda xatolik', 'error');
    }
  };

  // Load message history
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setIsLoadingMessages(true);
        const data = await api.getMessages(conversation._id);
        if (isMounted) {
          setMessages(data.messages || []);
          setNextCursor(data.nextCursor || null);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    fetchHistory();
    socketService.joinChat(conversation._id);
    socketService.markMessagesRead(conversation._id);

    const socket = socketService.getSocket();
    if (socket) {
      const handleNewMessage = (msg: Message) => {
        if (msg.conversationId === conversation._id) {
          setMessages((prev) => {
            const existingIdx = prev.findIndex(
              (m) => (msg.clientTempId && m.clientTempId === msg.clientTempId) || m._id === msg._id
            );
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = { ...updated[existingIdx], ...msg, status: 'sent' };
              return updated;
            }
            return [...prev, { ...msg, status: 'sent' }];
          });

          const sId = typeof msg.senderId === 'object' && msg.senderId ? msg.senderId._id : msg.senderId;
          if (sId !== user?._id && sId !== 'user_default') {
            playReceivedSound();
            socketService.markMessagesRead(conversation._id, [msg._id]);
          }
        }
      };

      const handleAck = (payload: { tempId: string; message: Message; status?: string }) => {
        if (payload.tempId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.clientTempId === payload.tempId || m._id === `temp_${payload.tempId}`
                ? { ...m, ...payload.message, status: (payload.status as any) || 'sent' }
                : m
            )
          );
        }
      };

      const handleReadReceipt = (payload: { conversationId: string; readerId: string; messageIds?: string[] }) => {
        if (payload.conversationId === conversation._id) {
          setMessages((prev) =>
            prev.map((m) => {
              const sId = typeof m.senderId === 'object' && m.senderId ? m.senderId._id : m.senderId;
              const isMine = sId === (user?._id || 'user_default');
              if (
                isMine &&
                (!payload.messageIds || payload.messageIds.length === 0 || payload.messageIds.includes(m._id))
              ) {
                const updatedReadBy = m.readBy?.includes(payload.readerId)
                  ? m.readBy
                  : [...(m.readBy || []), payload.readerId];
                return { ...m, isRead: true, status: 'read', readBy: updatedReadBy };
              }
              return m;
            })
          );
        }
      };

      const handleStatusUpdate = (payload: { messageId: string; status: 'delivered' | 'read' }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === payload.messageId ? { ...m, status: payload.status } : m))
        );
      };

      const handleReaction = (payload: { messageId: string; reactions: any[] }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === payload.messageId ? { ...m, reactions: payload.reactions } : m))
        );
      };

      const handleDeletedMessage = (payload: { messageId: string; conversationId: string }) => {
        if (payload.conversationId === conversation._id) {
          setMessages((prev) => prev.filter((m) => m._id !== payload.messageId));
          setPinnedMessage((currentPin) => (currentPin?._id === payload.messageId ? null : currentPin));
        }
      };

      const handleMessageEdited = (editedMsg: Message) => {
        if (editedMsg.conversationId === conversation._id) {
          setMessages((prev) =>
            prev.map((m) => (m._id === editedMsg._id ? { ...m, ...editedMsg, isEdited: true } : m))
          );
          setPinnedMessage((currentPin) =>
            currentPin?._id === editedMsg._id ? { ...currentPin, ...editedMsg, isEdited: true } : currentPin
          );
        }
      };

      const handlePinnedMessage = (payload: { conversationId: string; pinnedMessage?: Message | null }) => {
        if (payload.conversationId === conversation._id) {
          setPinnedMessage(payload.pinnedMessage || null);
        }
      };

      socket.on('message:new', handleNewMessage);
      socket.on('message:ack', handleAck);
      socket.on('message:read_receipt', handleReadReceipt);
      socket.on('message:status_update', handleStatusUpdate);
      socket.on('message:reaction', handleReaction);
      socket.on('message:deleted', handleDeletedMessage);
      socket.on('message:edited', handleMessageEdited);
      socket.on('chat:pinned_message', handlePinnedMessage);

      return () => {
        socket.off('message:new', handleNewMessage);
        socket.off('message:ack', handleAck);
        socket.off('message:read_receipt', handleReadReceipt);
        socket.off('message:status_update', handleStatusUpdate);
        socket.off('message:reaction', handleReaction);
        socket.off('message:deleted', handleDeletedMessage);
        socket.off('message:edited', handleMessageEdited);
        socket.off('chat:pinned_message', handlePinnedMessage);
        socketService.leaveChat(conversation._id);
      };
    }
  }, [conversation._id]);

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setShowScrollBottom(false);
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation._id]);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(true);
    }
  }, [messages, isRecording]);

  // Handle Escape key to close menus and cancel active modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (contextMenuMessage) {
          setContextMenuMessage(null);
          setContextMenuCoords(null);
        } else if (deleteConfirmMsg) {
          setDeleteConfirmMsg(null);
        } else if (replyingTo) {
          setReplyingTo(null);
        } else if (editingMessage) {
          setEditingMessage(null);
          setInputText('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenuMessage, deleteConfirmMsg, replyingTo, editingMessage]);

  // Track scroll position & handle infinite scroll pagination to top
  const handleScroll = async () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);

    // If scrolled near top and nextCursor exists, fetch older messages
    if (scrollTop < 40 && nextCursor && !isLoadingMore && !isLoadingMessages) {
      setIsLoadingMore(true);
      const prevScrollHeight = messagesContainerRef.current.scrollHeight;
      try {
        const data = await api.getMessages(conversation._id, nextCursor);
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const newOldMessages = data.messages.filter((m) => !existingIds.has(m._id));
            return [...newOldMessages, ...prev];
          });
          setNextCursor(data.nextCursor || null);

          // Preserve exact scroll position
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              const newScrollHeight = messagesContainerRef.current.scrollHeight;
              messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
            }
          });
        } else {
          setNextCursor(null);
        }
      } catch (err) {
        console.error('Failed to load older messages:', err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    socketService.sendTypingStart(conversation._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTypingStop(conversation._id);
    }, 2000);
  };

  // Send or Edit message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');
    setShowEmojiPicker(false);

    if (editingMessage) {
      const msgId = editingMessage._id;
      setEditingMessage(null);
      setMessages((prev) =>
        prev.map((m) => (m._id === msgId ? { ...m, content: textToSend, isEdited: true } : m))
      );
      try {
        await api.editMessage(msgId, textToSend);
        showToast('Xabar tahrirlandi!', 'success');
      } catch (err) {
        showToast('Tahrirlashda xatolik yuz berdi', 'error');
      }
      return;
    }

    const tempId = crypto.randomUUID();
    const optimisticMsg: Message = {
      _id: `temp_${tempId}`,
      clientTempId: tempId,
      conversationId: conversation._id,
      senderId: user ? user : 'user_default',
      content: textToSend,
      type: 'text',
      replyTo: replyingTo || undefined,
      createdAt: new Date().toISOString(),
      status: 'pending',
      reactions: [],
      readBy: [user?._id || 'user_default'],
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    playSentSound();
    setReplyingTo(null);
    socketService.sendTypingStop(conversation._id);
    scrollToBottom(true);

    try {
      const newMsg = await api.sendMessage(conversation._id, {
        content: textToSend,
        type: 'text',
        replyToId: replyingTo?._id,
        clientTempId: tempId,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.clientTempId === tempId || m._id === `temp_${tempId}`
            ? { ...m, ...newMsg, status: 'sent' }
            : m
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.clientTempId === tempId || m._id === `temp_${tempId}`
            ? { ...m, status: 'error' }
            : m
        )
      );
      showToast('Xabar yuborishda xatolik yuz berdi', 'error');
    }
  };

  const lastMenuOpenTimeRef = useRef<number>(0);

  // Open Context Menu reliably for both own and other messages
  const openMessageMenu = (msg: Message, targetEl: HTMLElement, clientX?: number, clientY?: number) => {
    const now = Date.now();
    // If clicking the same message that is already open, only toggle off if more than 450ms elapsed (prevents double-click auto-close bug)
    if (contextMenuMessage?._id === msg._id) {
      if (now - lastMenuOpenTimeRef.current > 450) {
        setContextMenuMessage(null);
        setContextMenuCoords(null);
      }
      return;
    }
    lastMenuOpenTimeRef.current = now;

    const rect = targetEl.getBoundingClientRect();
    const screenW = window.innerWidth;
    const menuWidth = Math.min(280, screenW - 24);
    const menuHeight = 380;

    const sId = typeof msg.senderId === 'object' && msg.senderId ? msg.senderId._id : msg.senderId;
    const msgIsMe = sId === user?._id || sId === 'user_default' || (msg as any).isMe;

    // Direct left coordinate clamped safely inside viewport (no transform offset bugs)
    let left = clientX !== undefined ? clientX - menuWidth / 2 : (msgIsMe ? rect.right - menuWidth : rect.left);
    left = Math.max(12, Math.min(screenW - menuWidth - 12, left));

    // For vertical position:
    // If message is in lower half of the screen, place menu ABOVE the message bubble
    let y = rect.top - menuHeight - 10;
    if (y < 65) {
      // If not enough room above, place BELOW the message bubble
      y = rect.bottom + 10;
    }
    // Final clamp to ensure 100% visible on screen
    if (y + menuHeight > window.innerHeight - 15) {
      y = Math.max(65, window.innerHeight - menuHeight - 15);
    }

    setContextMenuCoords({ x: left, y });
    setContextMenuMessage(msg);
  };

  // Click & Double click handler
  const handleMessageClick = (msg: Message, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openMessageMenu(msg, e.currentTarget as HTMLElement, e.clientX, e.clientY);
  };

  // Double click handler for instant heart reaction
  const handleMessageDoubleClick = (msg: Message, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuMessage(null);
    handleHeartReaction(msg._id);
  };

  // Touch long press handlers for mobile
  const handleTouchStart = (msg: Message, e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    const touch = e.touches[0];
    const clientX = touch?.clientX;
    const clientY = touch?.clientY;

    handleTouchEnd();
    longPressTimerRef.current = setTimeout(() => {
      openMessageMenu(msg, target, clientX, clientY);
    }, 380);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Quick Hover / Instant Reaction Handler
  const handleQuickEmojiReaction = async (messageId: string, emojiChar: string) => {
    const found = TELEGRAM_REACTIONS.find((r) => r.emoji === emojiChar);
    const reactKey = found ? found.id : emojiChar;
    if (emojiChar === '❤️') {
      setAnimatingHeartMsgId(messageId);
      setTimeout(() => setAnimatingHeartMsgId(null), 1000);
    }
    try {
      confetti({
        particleCount: 22,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
      });
    } catch {}
    await handleReaction(messageId, reactKey);
  };

  // Instant Heart Reaction
  const handleHeartReaction = async (messageId: string) => {
    setAnimatingHeartMsgId(messageId);
    setTimeout(() => setAnimatingHeartMsgId(null), 1000);
    try {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#EF4444', '#F43F5E', '#FB7185', '#FDA4AF'],
      });
    } catch {}
    await handleReaction(messageId, '006'); // 006 is Heart Lottie
  };

  // General Reaction handler
  const handleReaction = async (messageId: string, reactionKey: string) => {
    setContextMenuMessage(null);
    const currentUserId = user?._id || 'me';

    // 1. Instant 0ms optimistic local update
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id === messageId) {
          const reacts = m.reactions ? [...m.reactions] : [];
          const idx = reacts.findIndex((r) => r.userId === currentUserId && r.emoji === reactionKey);
          if (idx >= 0) {
            reacts.splice(idx, 1);
          } else {
            reacts.push({ userId: currentUserId, emoji: reactionKey });
          }
          return { ...m, reactions: reacts };
        }
        return m;
      })
    );

    // 2. Background sync with backend
    try {
      const res = await api.reactToMessage(messageId, reactionKey);
      if (res && res.reactions) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: res.reactions } : m))
        );
      }
    } catch (err) {
      console.error('Reaction sync background error:', err);
    }
  };

  // Context Menu Actions
  const handleReplyMessage = (msg: Message) => {
    setContextMenuMessage(null);
    setEditingMessage(null);
    setReplyingTo(msg);
    inputRef.current?.focus();
  };

  const handleStartEditMessage = (msg: Message) => {
    setContextMenuMessage(null);
    setReplyingTo(null);
    setEditingMessage(msg);
    setInputText(msg.content);
    inputRef.current?.focus();
  };

  const handleCopyMessage = (msg: Message) => {
    setContextMenuMessage(null);
    navigator.clipboard.writeText(msg.content);
    showToast('Xabar nusxalandi!', 'success');
  };

  const handleForwardMessage = (msg: Message) => {
    setContextMenuMessage(null);
    setForwardingMessage(msg);
  };

  const handleCompleteForward = async (targetConv: Conversation) => {
    if (!forwardingMessage) return;
    const msgToForward = forwardingMessage;
    setForwardingMessage(null);
    try {
      const senderName =
        typeof msgToForward.senderId === 'object' && msgToForward.senderId
          ? msgToForward.senderId.displayName
          : 'Foydalanuvchi';

      await api.sendMessage(targetConv._id, {
        content: msgToForward.content,
        type: msgToForward.type,
        media: msgToForward.media,
        clientTempId: crypto.randomUUID(),
        forwardedFrom: {
          displayName: senderName,
        },
      });
      const targetName = targetConv._id.startsWith('conv_saved_')
        ? 'Saqlanganlar'
        : targetConv.type === 'direct'
        ? targetConv.partner?.displayName || 'Foydalanuvchi'
        : targetConv.group?.name || 'Guruh';
      showToast(`Xabar "${targetName}" suhbatiga uzatildi! 🚀`, 'success');
    } catch {
      showToast('Xabarni uzatishda xatolik yuz berdi.', 'error');
    }
  };

  const handlePinMessage = async (msg: Message) => {
    setContextMenuMessage(null);
    try {
      await api.pinMessage(conversation._id, msg._id);
      setPinnedMessage(msg);
      showToast('Xabar suhbat tepasiga qadaldi 📌', 'success');
    } catch {
      setPinnedMessage(msg);
      showToast('Xabar qadab qo‘yildi 📌', 'success');
    }
  };

  const handleUnpinMessage = async () => {
    try {
      await api.unpinMessage(conversation._id);
      setPinnedMessage(null);
      showToast('Qadash bekor qilindi', 'info');
    } catch {
      setPinnedMessage(null);
    }
  };

  const handleDeleteMessage = async (msg: Message) => {
    setContextMenuMessage(null);
    const msgId = msg._id;
    setMessages((prev) => prev.filter((m) => m._id !== msgId));
    try {
      await api.deleteMessage(msgId);
      showToast("Xabar o'chirildi", 'info');
    } catch (err) {
      showToast("Xabarni o'chirishda xatolik", 'error');
    }
  };

  // File Upload with Multi-selection & Pre-send Preview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const areAllVisual = files.every((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));

    if (areAllVisual) {
      // Trigger Telegram-style pre-send modal for images and videos
      setPendingMediaFiles(files);
      setIsMediaSendModalOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Direct upload for documents and arbitrary files
    setIsUploading(true);
    try {
      for (const file of files) {
        const uploadRes = await api.uploadFile(file, {
          conversationId: conversation._id,
          filename: file.name,
          type: 'document',
        });

        const newMsg = await api.sendMessage(conversation._id, {
          content: '',
          type: 'document',
          clientTempId: crypto.randomUUID(),
          media: {
            url: uploadRes.url,
            name: uploadRes.name || file.name,
            size: uploadRes.size || file.size,
            mimeType: uploadRes.mimeType || file.type,
          },
        });
        setMessages((prev) => [...prev, newMsg]);
      }
      playSentSound();
      showToast('Fayl muvaffaqiyatli yuborildi!', 'success');
      scrollToBottom(true);
    } catch {
      showToast('Faylni yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Pre-send media modal submission
  const handleSendMediaFiles = async (files: File[], caption: string) => {
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVid = file.type.startsWith('video/');
        const uploadRes = await api.uploadFile(file, {
          conversationId: conversation._id,
          filename: file.name,
          type: isVid ? 'video' : 'image',
        });

        const newMsg = await api.sendMessage(conversation._id, {
          content: i === 0 ? caption : '',
          type: isVid ? 'video' : 'image',
          clientTempId: crypto.randomUUID(),
          media: {
            url: uploadRes.url,
            name: uploadRes.name || file.name,
            size: uploadRes.size || file.size,
            mimeType: uploadRes.mimeType || file.type,
          },
        });
        setMessages((prev) => [...prev, newMsg]);
      }
      playSentSound();
      setIsMediaSendModalOpen(false);
      setPendingMediaFiles([]);
      scrollToBottom(true);
    } catch {
      showToast('Media fayllarni yuborishda xatolik yuz berdi', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Voice & Round Video Note Recording Engine with Real Waveform Analysis
  const startRecording = async () => {
    try {
      const isVideo = recordMode === 'video';
      const constraints: MediaStreamConstraints = isVideo
        ? { audio: true, video: { width: 480, height: 480, facingMode: 'user' } }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStreamRef.current = stream;
      audioChunksRef.current = [];
      waveformSamplesRef.current = [];

      // Initialize Web Audio API Analyser for real-time voice amplitude measurements
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          waveformIntervalRef.current = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.max(15, Math.min(95, Math.round((avg / 255) * 100)));
            waveformSamplesRef.current.push(normalized);
          }, 120);
        }
      } catch {}

      if (isVideo && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      }

      const mimeType = isVideo
        ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/mp4')
            ? 'video/mp4'
            : 'video/webm')
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg');

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }

        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: isVideo ? 'video/webm' : 'audio/webm' });

        // Sample down waveform samples to exactly 26-30 bars
        const rawWaveform = waveformSamplesRef.current;
        let finalWaveform: number[] = [];
        if (rawWaveform.length > 0) {
          const targetBars = 28;
          const step = rawWaveform.length / targetBars;
          for (let i = 0; i < targetBars; i++) {
            const idx = Math.floor(i * step);
            finalWaveform.push(rawWaveform[idx] || 25);
          }
        } else {
          finalWaveform = [25, 40, 60, 30, 85, 70, 45, 90, 65, 40, 80, 50, 95, 75, 40, 60, 85, 30, 70, 50];
        }

        try {
          setIsUploading(true);
          const uploadRes = await api.uploadFile(blob, {
            filename: isVideo ? 'round_video.webm' : 'voice_message.webm',
            type: isVideo ? 'round_video' : 'voice',
            conversationId: conversation._id,
            duration: recordingSeconds || (isVideo ? 5 : 3),
            waveform: finalWaveform,
          });

          playSentSound();
          const newMsg = await api.sendMessage(conversation._id, {
            content: '',
            type: isVideo ? 'round_video' : 'voice',
            clientTempId: crypto.randomUUID(),
            media: {
              url: uploadRes.url,
              duration: recordingSeconds || (isVideo ? 5 : 3),
              waveform: finalWaveform,
              mimeType: uploadRes.mimeType || (isVideo ? 'video/webm' : 'audio/webm'),
              type: isVideo ? 'round_video' : 'voice',
            },
          });
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom(true);
        } catch {
          showToast('Xabarni yuborishda xatolik yuz berdi', 'error');
        } finally {
          setIsUploading(false);
        }

        stream.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      };

      recorder.start(100);
      setIsRecording(true);
      setIsRecordingLocked(false);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      showToast(recordMode === 'video' ? 'Kamera yoki mikrofon ruxsati kerak.' : 'Mikrofon ruxsati kerak.', 'error');
    }
  };

  const stopAndSendRecording = () => {
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingLocked(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingLocked(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      audioChunksRef.current = [];
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      showToast('Yozish bekor qilindi', 'info');
    }
  };

  const handleEndCall = async (durationSec: number) => {
    setActiveCall(null);
    const durationText = `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, '0')}`;
    const logMsg = await api.sendMessage(conversation._id, {
      content: `📞 Qo'ng'iroq yakunlandi (${durationText})`,
      type: 'text',
      clientTempId: crypto.randomUUID(),
    });
    setMessages((prev) => [...prev, logMsg]);
  };

  const isPartnerTyping = isDirect && partner?._id && typingUsers[partner._id];

  return (
    <div
      onClick={() => {
        if (Date.now() - lastMenuOpenTimeRef.current > 450) {
          setContextMenuMessage(null);
          setContextMenuCoords(null);
        }
      }}
      className="flex flex-col h-full bg-[#F4F4F5] dark:bg-[#0F0F0F] select-none text-zinc-900 dark:text-white overflow-hidden relative transition-colors"
    >
      {/* 1. DYNAMIC CHAT WALLPAPER BASE LAYER */}
      <div
        className="absolute inset-0 transition-all duration-500 z-0 pointer-events-none"
        style={{
          ...bgStyle,
          filter: `blur(${currentWallpaper.blur || 0}px) brightness(${currentWallpaper.brightness || 100}%)`,
          transform: currentWallpaper.blur ? 'scale(1.05)' : 'none',
        }}
      />

      {/* 2. DYNAMIC VECTOR SVG PATTERN OVERLAY */}
      {patternUri && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
          style={{
            backgroundImage: `url("${patternUri}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${currentWallpaper.patternScale || 85}px ${currentWallpaper.patternScale || 85}px`,
            opacity: theme === 'light' ? 0.05 : (currentWallpaper.patternOpacity ?? 0.08),
          }}
        />
      )}
      {/* Active Call Modal */}
      {activeCall && partner && (
        <CallModal
          type={activeCall}
          user={partner}
          onEndCall={handleEndCall}
        />
      )}

      {/* Top Header - Telegram Web A Action Bar */}
      <div className="h-14 px-3 sm:px-4 bg-white dark:bg-[#212121] text-zinc-900 dark:text-white flex items-center justify-between z-20 shrink-0 border-b border-[#DADCE0] dark:border-[#303030] transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-1 text-[#707579] dark:text-[#AAAAAA] hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] rounded-full transition-colors active:scale-95 cursor-pointer"
            title="Orqaga"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>

          <div
            onClick={() => {
              if (isSavedMessages) {
                onOpenProfile({
                  _id: 'conv_saved_me',
                  displayName: 'Saqlanganlar',
                  username: 'saved',
                  avatar: '',
                  isVerified: true,
                  bio: "Shaxsiy xabarlar, rasmlar, videolar va eslatmalarni saqlash uchun bulutli joy.",
                } as any);
              } else if (partner) {
                onOpenProfile(partner);
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
          >
            <Avatar
              name={chatTitle}
              src={partner?.avatar || conversation.group?.avatar}
              size="md"
              isOnline={isOnline}
              className="!w-10 !h-10 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[16px] text-zinc-900 dark:text-white truncate">
                  {chatTitle}
                </span>
                {partner?.premiumBadge && (
                  <span className="text-xs shrink-0 select-none" title="BecuGram Premium">
                    {partner.premiumBadge}
                  </span>
                )}
                {isSavedMessages && (
                  <span className="text-[10px] bg-[#3390EC]/10 text-[#3390EC] dark:text-[#8774E1] px-1.5 py-0.2 rounded-full font-semibold">
                    Shaxsiy
                  </span>
                )}
              </div>
              <span className={`text-[13px] font-normal block leading-tight truncate ${
                isOnline ? 'text-[#3390EC] dark:text-[#8774E1]' : 'text-[#707579] dark:text-[#AAAAAA]'
              }`}>
                {chatSubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Search, Call, Video, More */}
        <div className="flex items-center gap-0.5">
          {isDirect && partner && !isSavedMessages && (
            <>
              <button
                onClick={() => setActiveCall('audio')}
                className="w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors cursor-pointer"
                title="Ovozli qo'ng'iroq"
              >
                <Phone className="w-4.5 h-4.5 stroke-[2]" />
              </button>
              <button
                onClick={() => setActiveCall('video')}
                className="hidden sm:flex w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] items-center justify-center transition-colors cursor-pointer"
                title="Video qo'ng'iroq"
              >
                <Video className="w-4.5 h-4.5 stroke-[2]" />
              </button>
            </>
          )}

          <button
            onClick={() => {
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isSearching
                ? 'bg-[#3390EC]/15 text-[#3390EC] dark:text-[#8774E1]'
                : 'hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA]'
            }`}
            title="Qidirish"
          >
            <Search className="w-4.5 h-4.5 stroke-[2]" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHeaderMenu(!showHeaderMenu);
              }}
              className="w-10 h-10 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4.5 h-4.5 stroke-[2]" />
            </button>

            {showHeaderMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-12 w-56 rounded-2xl bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] shadow-xl py-1.5 z-30 animate-fade-in text-[13.5px] font-medium"
              >
                {(partner || isSavedMessages) && (
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      if (isSavedMessages) {
                        onOpenProfile({
                          _id: 'conv_saved_me',
                          displayName: 'Saqlanganlar',
                          username: 'saved',
                          avatar: '',
                          isVerified: true,
                          bio: "Shaxsiy xabarlar, rasmlar, videolar va eslatmalarni saqlash uchun bulutli joy.",
                        } as any);
                      } else if (partner) {
                        onOpenProfile(partner);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] flex items-center gap-2.5 text-zinc-900 dark:text-white transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#3390EC] dark:text-[#8774E1]" />
                    {isSavedMessages ? "Saqlanganlar ma'lumoti" : "Profilni ko'rish"}
                  </button>
                )}
                {partner && !isSavedMessages && (
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleToggleBlockPartner();
                    }}
                    className={`w-full px-3.5 py-2 text-left hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] flex items-center gap-2.5 transition-colors ${
                      isPartnerBlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    {isPartnerBlocked ? 'Blokdan chiqarish' : 'Foydalanuvchini bloklash'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowWallpaperModal(true);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] flex items-center gap-2.5 text-zinc-900 dark:text-white transition-colors"
                >
                  <Palette className="w-4 h-4 text-amber-500" />
                  Chat fonini o‘zgartirish
                </button>
                <button
                  onClick={() => {
                    setShowHeaderMenu(false);
                    useThemeStore.getState().toggleTheme();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] flex items-center gap-2.5 text-zinc-900 dark:text-white transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  {theme === 'dark' ? "Yorug' rejim (Light)" : "Qorong'i rejim (Dark)"}
                </button>
                <button
                  onClick={() => {
                    setShowHeaderMenu(false);
                    showToast("Xabarnomalar o'chirildi", 'info');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] flex items-center gap-2.5 text-zinc-900 dark:text-white transition-colors"
                >
                  <VolumeX className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA]" />
                  Ovozni o'chirish
                </button>
                <button
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setMessages([]);
                    showToast('Tarix tozalandi', 'info');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 flex items-center gap-2.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Tarixni tozalash
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          onClick={() => scrollToMessage(pinnedMessage._id)}
          className="px-4 py-2 bg-white/95 dark:bg-[#212121]/95 border-b border-[#DADCE0] dark:border-[#303030] flex items-center justify-between cursor-pointer hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] transition-colors z-10 shrink-0 shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-[3px] h-8 bg-[#3390EC] dark:bg-[#8774E1] rounded-full shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[11.5px] font-semibold text-[#3390EC] dark:text-[#8774E1] block leading-tight">
                Qadalgan xabar
              </span>
              <p className="text-[13px] text-zinc-700 dark:text-zinc-200 truncate">
                {pinnedMessage.content || (pinnedMessage.type === 'voice' ? 'Ovozli xabar' : 'Media fayl')}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnpinMessage();
            }}
            className="w-7 h-7 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center shrink-0 ml-2 transition-colors cursor-pointer"
            title="Qadashdan chiqarish"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      )}

      {/* In-Chat Search Bar */}
      {isSearching && (
        <div className="px-4 py-2 bg-white dark:bg-[#212121] border-b border-[#DADCE0] dark:border-[#303030] flex items-center gap-2 z-20 shrink-0 animate-fade-in shadow-xs">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentMatchIdx(0);
            }}
            placeholder="Xabarlardan qidirish..."
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
            autoFocus
          />
          {searchQuery && (
            <span className="text-xs text-zinc-400 font-mono shrink-0">
              {matchedMessageIds.length > 0
                ? `${currentMatchIdx + 1} / ${matchedMessageIds.length}`
                : '0 / 0'}
            </span>
          )}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              disabled={matchedMessageIds.length === 0}
              onClick={() => {
                if (matchedMessageIds.length === 0) return;
                const nextIdx =
                  (currentMatchIdx - 1 + matchedMessageIds.length) % matchedMessageIds.length;
                setCurrentMatchIdx(nextIdx);
                scrollToMessage(matchedMessageIds[nextIdx]);
              }}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30"
              title="Oldingi"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              disabled={matchedMessageIds.length === 0}
              onClick={() => {
                if (matchedMessageIds.length === 0) return;
                const nextIdx = (currentMatchIdx + 1) % matchedMessageIds.length;
                setCurrentMatchIdx(nextIdx);
                scrollToMessage(matchedMessageIds[nextIdx]);
              }}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30"
              title="Keyingi"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 ml-1"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area - Telegram Web A Clamped Middle Panel */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 custom-scroll"
      >
        <div className="w-full max-w-[760px] mx-auto flex flex-col justify-end min-h-full">
        {isLoadingMore && (
          <div className="flex justify-center my-1 animate-pulse">
            <span className="px-3.5 py-1 rounded-full bg-black/40 dark:bg-black/50 backdrop-blur-md text-white text-[11px] font-medium shadow-xs">
              Eski xabarlar yuklanmoqda...
            </span>
          </div>
        )}

        {/* Date Divider pill */}
        <div className="flex justify-center my-2">
          <span className="px-3.5 py-0.5 rounded-full bg-black/35 dark:bg-black/45 backdrop-blur-md text-white text-[11px] font-semibold shadow-xs border border-white/10 select-none">
            Bugun
          </span>
        </div>

        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-20 text-xs text-zinc-400 dark:text-[#8DA39A] animate-pulse">
            Xabarlar yuklanmoqda...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-zinc-400 dark:text-[#8DA39A]">
            <p className="mb-1 font-semibold">Hozircha xabarlar yo'q</p>
            <p className="text-[11px] text-zinc-400 dark:text-[#5D736A]">Birinchi xabaringizni yozing!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderIdStr = typeof msg.senderId === 'object' && msg.senderId ? msg.senderId._id : msg.senderId;
            const isMe = senderIdStr === user?._id || senderIdStr === 'user_default' || (msg as any).isMe;
            const replySenderName =
              typeof msg.replyTo?.senderId === 'object' && msg.replyTo?.senderId
                ? (msg.replyTo.senderId as any).displayName
                : 'User';
            const isHeartAnimating = animatingHeartMsgId === msg._id;

            const isSticker =
              msg.type === 'sticker' ||
              (typeof msg.content === 'string' &&
                (msg.content.startsWith('icon:') || msg.content.startsWith('lottie:')));
            const isVideoNote = msg.type === 'video_note' || (msg.media as any)?.type === 'round_video';

            // Telegram Web A Contiguous Message Grouping Logic
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;

            const prevSenderId = prevMsg ? (typeof prevMsg.senderId === 'object' && prevMsg.senderId ? prevMsg.senderId._id : prevMsg.senderId) : null;
            const nextSenderId = nextMsg ? (typeof nextMsg.senderId === 'object' && nextMsg.senderId ? nextMsg.senderId._id : nextMsg.senderId) : null;

            const isPrevMe = prevSenderId === user?._id || prevSenderId === 'user_default' || (prevMsg as any)?.isMe;
            const isNextMe = nextSenderId === user?._id || nextSenderId === 'user_default' || (nextMsg as any)?.isMe;

            const isClosePrev = prevMsg && Math.abs(new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 5 * 60 * 1000;
            const isCloseNext = nextMsg && Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5 * 60 * 1000;

            const isSameGroupPrev = prevMsg && isMe === isPrevMe && isClosePrev;
            const isSameGroupNext = nextMsg && isMe === isNextMe && isCloseNext;

            const isFirstInGroup = !isSameGroupPrev;
            const isLastInGroup = !isSameGroupNext;
            const isSingle = isFirstInGroup && isLastInGroup;

            // Telegram Web A Corner Radii for Grouped Bubbles
            const bubbleCorners = isMe
              ? isSingle
                ? 'rounded-2xl rounded-br-[4px]'
                : isFirstInGroup
                ? 'rounded-2xl rounded-br-[6px]'
                : isLastInGroup
                ? 'rounded-2xl rounded-tr-[6px] rounded-br-[4px]'
                : 'rounded-2xl rounded-r-[6px]'
              : isSingle
              ? 'rounded-2xl rounded-bl-[4px]'
              : isFirstInGroup
              ? 'rounded-2xl rounded-bl-[6px]'
              : isLastInGroup
              ? 'rounded-2xl rounded-tl-[6px] rounded-bl-[4px]'
              : 'rounded-2xl rounded-l-[6px]';

            return (
              <div
                key={msg._id}
                id={`msg-${msg._id}`}
                className={`flex flex-col relative group transition-all duration-150 ${
                  isMe ? 'items-end mr-2 sm:mr-3' : 'items-start ml-2 sm:ml-3'
                } ${isLastInGroup || isSingle ? 'mb-2.5' : 'mb-1'}`}
              >
                {/* Animated Lottie Heart Pop Animation on double-click */}
                {isHeartAnimating && (
                  <div className="absolute z-30 pointer-events-none -top-12 left-1/2 -translate-x-1/2 animate-bounce scale-125">
                    <LottieAnimation src="/reactions/006.json" size={54} loop={false} />
                  </div>
                )}

                {/* Bubble Container: Telegram Web A Style */}
                <div
                  onClick={(e) => handleMessageClick(msg, e)}
                  onDoubleClick={(e) => handleMessageDoubleClick(msg, e)}
                  onTouchStart={(e) => handleTouchStart(msg, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openMessageMenu(msg, e.currentTarget, e.clientX, e.clientY);
                  }}
                  className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[58%] min-w-[82px] select-none transition-all active:scale-[0.99] cursor-pointer ${
                    isSticker || isVideoNote
                      ? 'bg-transparent border-0 shadow-none !p-0'
                      : isMe
                      ? `bg-[#E1FFC7] dark:bg-[#766AC8] text-zinc-950 dark:text-white ${bubbleCorners} shadow-[0_1px_2px_rgba(0,0,0,0.08)] px-3.5 py-1.5 text-[14.5px]`
                      : `bg-white dark:bg-[#212121] text-zinc-950 dark:text-white ${bubbleCorners} shadow-[0_1px_2px_rgba(0,0,0,0.08)] px-3.5 py-1.5 text-[14.5px]`
                  }`}
                >
                  {/* Authentic Telegram Tail for outgoing (isMe) - Only on last in group or single */}
                  {isMe && !isSticker && !isVideoNote && (isLastInGroup || isSingle) && (
                    <svg
                      className="absolute -right-[7px] bottom-0 w-[9px] h-[16px] pointer-events-none fill-[#E1FFC7] dark:fill-[#766AC8]"
                      viewBox="0 0 9 16"
                    >
                      <path d="M0,0 C0,7 2,13 9,16 C4.5,16 0,14 0,9 L0,0 Z" />
                    </svg>
                  )}

                  {/* Authentic Telegram Tail for incoming (!isMe) - Only on last in group or single */}
                  {!isMe && !isSticker && !isVideoNote && (isLastInGroup || isSingle) && (
                    <svg
                      className="absolute -left-[7px] bottom-0 w-[9px] h-[16px] pointer-events-none fill-white dark:fill-[#212121] scale-x-[-1]"
                      viewBox="0 0 9 16"
                    >
                      <path d="M0,0 C0,7 2,13 9,16 C4.5,16 0,14 0,9 L0,0 Z" />
                    </svg>
                  )}
                  {/* Forwarded Reference Header */}
                  {msg.forwardedFrom && (
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold mb-1 opacity-95 ${
                      isMe ? 'text-[#3f8c00] dark:text-white' : 'text-[#3390EC] dark:text-[#8774E1]'
                    }`}>
                      <Share2 className="w-3 h-3 stroke-[2.2]" />
                      <span>Uzatilgan xabar: {msg.forwardedFrom.displayName}</span>
                    </div>
                  )}

                  {/* Quoted Reply reference block */}
                  {msg.replyTo && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (msg.replyTo?._id) scrollToMessage(msg.replyTo._id);
                      }}
                      className={`mb-1.5 pl-2.5 py-1 border-l-2 rounded-r-lg text-xs cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all select-none ${
                        isMe
                          ? 'border-[#3f8c00] bg-black/5 dark:border-white/40 dark:bg-black/25 text-zinc-900 dark:text-white'
                          : 'border-[#3390EC] dark:border-[#8774E1] bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-white'
                      }`}
                      title="Xabarga o'tish"
                    >
                      <span className={`font-bold block text-[11px] ${isMe ? 'text-[#3f8c00] dark:text-white' : 'text-[#3390EC] dark:text-[#8774E1]'}`}>
                        {replySenderName}
                      </span>
                      <span className="truncate block text-[11px] opacity-90">
                        {msg.replyTo.isDeleted ? (
                          <span className="italic opacity-70">O‘chirilgan xabar</span>
                        ) : msg.replyTo.content ? (
                          msg.replyTo.content
                        ) : msg.replyTo.type === 'image' ? (
                          '📷 Rasm'
                        ) : msg.replyTo.type === 'voice' ? (
                          '🎤 Ovozli xabar'
                        ) : msg.replyTo.type === 'video' || msg.replyTo.type === 'video_note' ? (
                          '📹 Video'
                        ) : msg.replyTo.type === 'sticker' ? (
                          '✨ Stiker'
                        ) : msg.replyTo.type === 'document' || (msg.replyTo.type as any) === 'file' ? (
                          '📁 Fayl'
                        ) : (
                          'Xabar'
                        )}
                      </span>
                    </div>
                  )}

                  {/* 1. Image message */}
                  {msg.type === 'image' && msg.media?.url && (
                    <div
                      onClick={() => openMediaViewer(msg._id)}
                      className="mb-2 rounded-2xl overflow-hidden max-w-sm cursor-pointer group hover:opacity-95 transition-all shadow-xs"
                    >
                      <img
                        src={getMediaUrl(msg.media.url)}
                        alt={msg.media.name || 'Image'}
                        className="w-full object-cover max-h-80 rounded-2xl group-hover:scale-101 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* 2. Inline Video message */}
                  {msg.type === 'video' && msg.media?.url && (
                    <div className="mb-2">
                      <InlineVideoPlayer
                        url={getMediaUrl(msg.media.url)}
                        thumbnailUrl={msg.media.thumbnailUrl ? getMediaUrl(msg.media.thumbnailUrl) : undefined}
                        duration={msg.media.duration}
                        onOpenViewer={() => openMediaViewer(msg._id)}
                      />
                    </div>
                  )}

                  {/* 3. Document / Arbitrary File message */}
                  {(msg.type === 'document' || (msg.type as any) === 'file') && msg.media?.url && (
                    <div className="mb-2">
                      <DocumentMessageBubble
                        url={msg.media.url}
                        name={msg.media.name}
                        size={msg.media.size}
                        mimeType={msg.media.mimeType}
                        isMe={isMe}
                      />
                    </div>
                  )}

                  {/* 4. Animated GIF message */}
                  {msg.type === 'gif' && (msg.media?.url || msg.content) && (
                    <div
                      onClick={() => openMediaViewer(msg._id)}
                      className="relative mb-2 rounded-2xl overflow-hidden max-w-xs cursor-pointer group shadow-sm bg-black"
                    >
                      <img
                        src={getMediaUrl(msg.media?.url || msg.content)}
                        alt="GIF"
                        className="w-full max-h-72 object-cover rounded-2xl"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white uppercase tracking-wider font-mono">
                        GIF
                      </span>
                    </div>
                  )}

                  {/* 5. Round Video Note / Sticker / Voice / Text message rendering */}
                  {isVideoNote ? (
                    <div className="p-0.5">
                      <RoundVideoMessage url={getMediaUrl(msg.media?.url || msg.content)} isMe={isMe} />
                    </div>
                  ) : isSticker ? (
                    <div className="p-1 select-none flex items-center justify-center">
                      {msg.content?.startsWith('lottie:') ? (
                        (() => {
                          const raw = msg.content.replace('lottie:', '');
                          if (raw.startsWith('/')) {
                            return <LottieAnimation src={raw} size={140} loop={true} />;
                          }
                          try {
                            const parsed = JSON.parse(raw);
                            return <LottieAnimation animationData={parsed} size={140} loop={true} />;
                          } catch {
                            return <LottieAnimation src={raw} size={140} loop={true} />;
                          }
                        })()
                      ) : (
                        <LucideSticker stickerId={msg.content} />
                      )}
                    </div>
                  ) : msg.type === 'voice' ? (
                    <VoicePlayer
                      url={getMediaUrl(msg.media?.url || '')}
                      duration={msg.media?.duration || 45}
                      waveform={msg.media?.waveform}
                      isMe={isMe}
                    />
                  ) : (
                    msg.content && (
                      <p className="whitespace-pre-wrap leading-relaxed break-words">
                        {searchQuery.trim() ? (
                          (() => {
                            const query = searchQuery.trim();
                            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                            const parts = msg.content.split(regex);
                            return parts.map((part, i) =>
                              part.toLowerCase() === query.toLowerCase() ? (
                                <mark key={i} className="bg-amber-300 text-black px-0.5 rounded font-bold">
                                  {part}
                                </mark>
                              ) : (
                                part
                              )
                            );
                          })()
                        ) : (
                          msg.content
                        )}
                      </p>
                    )
                  )}

                  {/* BOTTOM ROW: REACTION CAPSULE & TIMESTAMP (TELEGRAM FIDELITY - MATCHING REFERENCE IMAGE 10) */}
                  {msg.reactions && msg.reactions.length > 0 ? (
                    <div className="flex flex-wrap items-end justify-between gap-2.5 mt-2 pt-0.5 select-none">
                      {/* Telegram Reaction Capsule (Inside bubble, expanding naturally) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((reactionKey, i) => {
                          const count = msg.reactions!.filter((r) => r.emoji === reactionKey).length;
                          const hasMyReact = msg.reactions!.some(
                            (r) => r.emoji === reactionKey && r.userId === (user?._id || 'me')
                          );
                          const lottieSrc = getReactionPath(reactionKey);
                          const reactorInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A';

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReaction(msg._id, reactionKey);
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-all text-xs font-semibold select-none cursor-pointer active:scale-95 ${
                                isMe
                                  ? 'bg-black/10 hover:bg-black/15 text-zinc-900 dark:bg-white/15 dark:hover:bg-white/20 dark:text-white border border-black/5 dark:border-white/10'
                                  : 'bg-black/5 hover:bg-black/10 text-zinc-900 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white border border-black/5 dark:border-white/10'
                              } ${hasMyReact ? 'ring-1.5 ring-blue-400' : ''}`}
                              title="Reaksiya"
                            >
                              <LottieAnimation src={lottieSrc} size={18} loop={true} />
                              <div className="w-4 h-4 rounded-full bg-[#E06D53] dark:bg-[#C2583F] text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-xs">
                                {reactorInitial}
                              </div>
                              {count > 1 && (
                                <span className="text-[10.5px] font-bold">
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Time and Checkmarks aligned on right */}
                      <div
                        className={`flex items-center gap-1 ml-auto shrink-0 text-[11px] font-normal pb-0.5 select-none ${
                          isMe ? 'text-[#3f8c00] dark:text-white/80' : 'text-[#707579] dark:text-[#AAAAAA]'
                        }`}
                      >
                        {msg.isEdited && <span className="italic mr-0.5 opacity-80 text-[10px]">tahrirlangan</span>}
                        <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                        {isMe && (
                          msg.status === 'pending' || msg._id.startsWith('temp_') ? (
                            <Clock className="w-3.5 h-3.5 opacity-60 animate-spin-slow" />
                          ) : msg.isRead || msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#3f8c00] dark:text-white" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-[#3f8c00]/80 dark:text-white/80" />
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Metadata: Time and Double Tick when no reactions */
                    <div
                      className={`flex items-center justify-end gap-1 mt-0.5 text-[11px] font-normal ml-auto select-none ${
                        isMe ? 'text-[#3f8c00cc] dark:text-white/70' : 'text-[#707579] dark:text-[#AAAAAA]'
                      }`}
                    >
                      {msg.isEdited && <span className="italic mr-0.5 opacity-80 text-[10px]">tahrirlangan</span>}
                      <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                      {isMe && (
                        msg.status === 'pending' || msg._id.startsWith('temp_') ? (
                          <Clock className="w-3.5 h-3.5 opacity-60 animate-spin-slow" />
                        ) : msg.isRead || msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#3f8c00] dark:text-white" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[#3f8c00] dark:text-white" />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Real-time Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-[#8DA39A] italic py-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-150" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-300" />
            <span>{chatTitle} yozmoqda...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating "Oxirlariga" Button matching Image 2 */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all animate-fade-in"
        >
          <ChevronDown className="w-4 h-4 text-[#707579] dark:text-[#AAAAAA] stroke-[2.2]" />
          <span>Oxirlariga</span>
        </button>
      )}

      {/* Telegram-style Context Menu Bubble with ANIMATED LOTTIE REACTIONS */}
      {contextMenuMessage && contextMenuCoords && (
        <>
          {/* Transparent Backdrop to close menu reliably when clicking outside */}
          <div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] animate-fade-in"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Prevent fast double-clicks from immediately dismissing the newly opened menu!
              if (Date.now() - lastMenuOpenTimeRef.current < 450) {
                return;
              }
              setContextMenuMessage(null);
              setContextMenuCoords(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenuMessage(null);
              setContextMenuCoords(null);
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${contextMenuCoords.y}px`,
              left: `${contextMenuCoords.x}px`,
              width: `${Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 24 : 280)}px`,
            }}
            className="z-50 max-h-[85vh] overflow-y-auto bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] rounded-2xl shadow-2xl p-2.5 animate-fade-in text-zinc-900 dark:text-white select-none"
          >
            {/* Reaction Stickers Grid: Animated Telegram Lottie Reactions */}
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[11px] font-medium text-[#707579] dark:text-[#AAAAAA] uppercase tracking-wider">
                Reaksiyalar
              </span>
              <span className="text-[10px] text-[#707579] dark:text-[#AAAAAA]">Telegram ✨</span>
            </div>
            <div className="grid grid-cols-6 gap-1 pb-2">
              {TELEGRAM_REACTIONS.slice(0, 18).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    try {
                      confetti({
                        particleCount: 20,
                        spread: 50,
                        origin: { y: 0.6 },
                      });
                    } catch {}
                    handleReaction(contextMenuMessage._id, item.id);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] flex items-center justify-center hover:scale-130 active:scale-90 transition-transform cursor-pointer"
                >
                  <LottieAnimation src={item.path} size={28} loop={true} />
                </button>
              ))}
            </div>

            <div className="h-[1px] bg-[#DADCE0] dark:bg-[#303030] my-1" />

            {/* Action List */}
            <div className="space-y-0.5 pt-0.5 text-[14px] font-normal">
              {/* Javob berish */}
              <button
                onClick={() => handleReplyMessage(contextMenuMessage)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-900 dark:text-white transition-colors text-left cursor-pointer"
              >
                <CornerUpLeft className="w-4.5 h-4.5 text-[#3390EC] dark:text-[#8774E1] stroke-[2]" />
                <span>Javob berish</span>
              </button>

              {/* Tahrirlash (Only for own messages) */}
              {(() => {
                const sId = typeof contextMenuMessage.senderId === 'object' && contextMenuMessage.senderId
                  ? contextMenuMessage.senderId._id
                  : contextMenuMessage.senderId;
                const isMe = sId === user?._id || sId === 'user_default' || (contextMenuMessage as any).isMe;
                if (!isMe) return null;
                return (
                  <button
                    onClick={() => handleStartEditMessage(contextMenuMessage)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-900 dark:text-white transition-colors text-left cursor-pointer"
                  >
                    <Edit2 className="w-4.5 h-4.5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                    <span>Tahrirlash</span>
                  </button>
                );
              })()}

              {/* Nusxa olish */}
              <button
                onClick={() => handleCopyMessage(contextMenuMessage)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-900 dark:text-white transition-colors text-left cursor-pointer"
              >
                <Copy className="w-4.5 h-4.5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                <span>Nusxa olish</span>
              </button>

              {/* Uzatish */}
              <button
                onClick={() => handleForwardMessage(contextMenuMessage)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-900 dark:text-white transition-colors text-left cursor-pointer"
              >
                <Share2 className="w-4.5 h-4.5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                <span>Uzatish</span>
              </button>

              {/* Qadash / Qadashdan chiqarish */}
              <button
                onClick={() => {
                  if (pinnedMessage?._id === contextMenuMessage._id) {
                    handleUnpinMessage();
                  } else {
                    handlePinMessage(contextMenuMessage);
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-zinc-900 dark:text-white transition-colors text-left cursor-pointer"
              >
                <Pin className="w-4.5 h-4.5 text-[#707579] dark:text-[#AAAAAA] stroke-[2]" />
                <span>{pinnedMessage?._id === contextMenuMessage._id ? 'Qadashdan chiqarish' : 'Qadash'}</span>
              </button>

              <div className="h-[1px] bg-[#DADCE0] dark:bg-[#303030] my-1" />

              {/* O'chirish (Red) */}
              <button
                onClick={() => {
                  setDeleteConfirmMsg(contextMenuMessage);
                  setContextMenuMessage(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-4.5 h-4.5 stroke-[2]" />
                <span>O‘chirish</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Telegram-style Delete Confirmation Modal */}
      {deleteConfirmMsg && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setDeleteConfirmMsg(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] rounded-2xl p-6 shadow-2xl text-zinc-900 dark:text-white transition-all scale-100"
          >
            <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">Xabarni o‘chirish</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-5 leading-relaxed">
              Haqiqatan ham bu xabarni butunlay o‘chirmoqchimisiz?
            </p>

            {/* Checkbox: [Partner] uchun ham o'chirish (only shown if sender is me) */}
            {(() => {
              const sId = typeof deleteConfirmMsg.senderId === 'object' && deleteConfirmMsg.senderId
                ? deleteConfirmMsg.senderId._id
                : deleteConfirmMsg.senderId;
              const isMe = sId === user?._id || sId === 'user_default' || (deleteConfirmMsg as any).isMe;
              if (isMe) {
                return (
                  <label className="flex items-center gap-3 p-2.5 -mx-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 mb-5 cursor-pointer select-none group transition-colors">
                    <input
                      type="checkbox"
                      checked={deleteForEveryone}
                      onChange={(e) => setDeleteForEveryone(e.target.checked)}
                      className="w-4 h-4 rounded-md text-[#3390EC] dark:text-[#8774E1] focus:ring-[#3390EC] border-zinc-300 dark:border-white/20 bg-white dark:bg-[#212121] cursor-pointer"
                    />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                      {partner?.displayName || chatTitle} uchun ham o‘chirish
                    </span>
                  </label>
                );
              }
              return (
                <div className="p-3 mb-5 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-zinc-600 dark:text-zinc-400">
                  ℹ️ Bu xabar faqat sizning chat tarixingizdan o‘chiriladi.
                </div>
              );
            })()}

            {/* Buttons: Bekor qilish & O'chirish */}
            <div className="flex items-center justify-end gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setDeleteConfirmMsg(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetMsg = deleteConfirmMsg;
                  setDeleteConfirmMsg(null);
                  if (targetMsg) {
                    const sId = typeof targetMsg.senderId === 'object' && targetMsg.senderId
                      ? targetMsg.senderId._id
                      : targetMsg.senderId;
                    const isMe = sId === user?._id || sId === 'user_default' || (targetMsg as any).isMe;
                    const shouldDeleteForEveryone = isMe ? deleteForEveryone : false;

                    setMessages((prev) => prev.filter((m) => m._id !== targetMsg._id));
                    setPinnedMessage((currentPin) => (currentPin?._id === targetMsg._id ? null : currentPin));

                    try {
                      await api.deleteMessage(targetMsg._id, shouldDeleteForEveryone);
                      showToast(
                        shouldDeleteForEveryone ? "Xabar hamma uchun o‘chirildi" : "Xabar siz uchun o‘chirildi",
                        'info'
                      );
                    } catch (err) {
                      console.error('Delete error:', err);
                    }
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-95 text-white shadow-md shadow-rose-500/20 transition-all"
              >
                O‘chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Web A Floating Composer Container - Clamped to 760px */}
      <div className="w-full max-w-[760px] mx-auto px-2 sm:px-4 pb-3 sm:pb-4 z-20 shrink-0">
        {/* Replying banner */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-white dark:bg-[#212121] border border-b-0 border-[#DADCE0] dark:border-[#303030] rounded-t-2xl text-xs shadow-xs">
            <div className="flex items-center gap-2 truncate border-l-2 border-[#3390EC] dark:border-[#8774E1] pl-2">
              <CornerUpLeft className="w-3.5 h-3.5 text-[#3390EC] dark:text-[#8774E1] shrink-0" />
              <span className="font-semibold text-[#3390EC] dark:text-[#8774E1]">Javob berilmoqda:</span>
              <span className="truncate text-[#707579] dark:text-[#AAAAAA]">{replyingTo.content || 'Media'}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="text-[#707579] hover:text-zinc-900 dark:hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editing banner */}
        {editingMessage && (
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-white dark:bg-[#212121] border border-b-0 border-[#DADCE0] dark:border-[#303030] rounded-t-2xl text-xs shadow-xs">
            <div className="flex items-center gap-2 truncate border-l-2 border-[#3390EC] dark:border-[#8774E1] pl-2">
              <Edit2 className="w-3.5 h-3.5 text-[#3390EC] dark:text-[#8774E1] shrink-0" />
              <span className="font-semibold text-[#3390EC] dark:text-[#8774E1]">Xabarni tahrirlash:</span>
              <span className="truncate text-[#707579] dark:text-[#AAAAAA]">{editingMessage.content}</span>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setInputText('');
              }}
              className="text-[#707579] hover:text-zinc-900 dark:hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Voice & Video Note Recording Active Bar */}
        {isRecording ? (
          <div className="p-3 bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] rounded-3xl flex items-center justify-between gap-3 animate-fade-in shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-wider">
                {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-xs text-[#707579] dark:text-[#AAAAAA] font-medium flex items-center gap-1.5">
                {recordMode === 'video' ? 'Dumaloq video yozilmoqda...' : 'Ovoz yozilmoqda...'}
                {isRecordingLocked ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 inline" /> Qulflangan
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400">↑ Qulflash</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-rose-500 text-xs font-medium cursor-pointer active:scale-95 transition-all"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={stopAndSendRecording}
                className="px-4 py-1.5 rounded-full bg-[#3390EC] dark:bg-[#8774E1] hover:opacity-90 text-white text-xs font-semibold shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Yuborish</span>
              </button>
            </div>
          </div>
        ) : isPartnerBlocked ? (
          /* Blocked Banner in Composer area */
          <div className="p-3.5 bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-sm">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <Ban className="w-4 h-4 text-red-500 shrink-0" />
              <span>Siz bu foydalanuvchini bloklagansiz. Xabar almashish cheklangan.</span>
            </div>
            <button
              onClick={handleToggleBlockPartner}
              className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all active:scale-95 shadow-xs"
            >
              Blokdan chiqarish
            </button>
          </div>
        ) : (
          /* Telegram Web A Floating Composer Form */
          <form
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 relative"
          >
            {/* Attachment input hidden (supports multi-file selection) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Telegram Web A Capsule Input Bar */}
            <div className={`flex-1 flex items-center bg-white dark:bg-[#212121] border border-[#DADCE0] dark:border-[#303030] rounded-3xl px-3 py-1.5 shadow-md focus-within:border-[#3390EC] dark:focus-within:border-[#8774E1] transition-all min-h-[48px] ${
              replyingTo || editingMessage ? '!rounded-t-none' : ''
            }`}>
              {/* Smile Icon on left */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="w-9 h-9 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center shrink-0 mr-1 cursor-pointer transition-colors"
                title="Reaksiyalar va stikerlar"
              >
                <Smile className="w-5 h-5 stroke-[2]" />
              </button>

              {/* Text Input with "Xabar" placeholder */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Xabar"
                className="w-full bg-transparent text-[15px] text-zinc-900 dark:text-white placeholder-[#707579] dark:placeholder-[#AAAAAA] outline-none py-1.5 px-1"
              />

              {/* Paperclip Icon on right */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Fayl yoki rasm biriktirish"
                className="w-9 h-9 rounded-full hover:bg-[#F4F4F5] dark:hover:bg-[#2C2C2C] text-[#707579] dark:text-[#AAAAAA] flex items-center justify-center shrink-0 ml-1 cursor-pointer transition-colors"
              >
                <Paperclip className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Telegram Web A Circular Action Button: Send or Mic/Video Toggle */}
            {inputText.trim() ? (
              <button
                type="submit"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#3390EC] dark:bg-[#8774E1] text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-md transition-all shrink-0 cursor-pointer"
                title={editingMessage ? 'Tahrirni saqlash' : 'Yuborish'}
              >
                {editingMessage ? <Check className="w-5 h-5 stroke-[2.2]" /> : <Send className="w-5 h-5 ml-0.5 stroke-[2.2]" />}
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setRecordMode((prev) => {
                      const next = prev === 'voice' ? 'video' : 'voice';
                      showToast(next === 'video' ? 'Dumaloq video rejimiga o‘tildi 📹 (bosing va ushlab turing)' : 'Ovozli xabar rejimiga o‘tildi 🎙️', 'info');
                      playPopSound();
                      return next;
                    });
                  }}
                  onMouseDown={(e) => {
                    dragStartYRef.current = e.clientY;
                    startRecording();
                  }}
                  onMouseMove={(e) => {
                    if (isRecording && !isRecordingLocked && dragStartYRef.current !== null) {
                      const deltaY = dragStartYRef.current - e.clientY;
                      if (deltaY >= 35) {
                        setIsRecordingLocked(true);
                        playLockSound();
                        showToast('Yozish qulflandi 🔒', 'info');
                      }
                    }
                  }}
                  onMouseUp={() => {
                    if (isRecording && !isRecordingLocked) {
                      stopAndSendRecording();
                    }
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    dragStartYRef.current = touch.clientY;
                    startRecording();
                  }}
                  onTouchMove={(e) => {
                    if (isRecording && !isRecordingLocked && dragStartYRef.current !== null) {
                      const touch = e.touches[0];
                      const deltaY = dragStartYRef.current - touch.clientY;
                      if (deltaY >= 35) {
                        setIsRecordingLocked(true);
                        playLockSound();
                        showToast('Yozish qulflandi 🔒', 'info');
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    if (isRecording && !isRecordingLocked) {
                      stopAndSendRecording();
                    }
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-md transition-all shrink-0 cursor-pointer ${
                    recordMode === 'video' ? 'bg-[#EC4899] hover:bg-[#DB2777]' : 'bg-[#3390EC] dark:bg-[#8774E1]'
                  }`}
                  title={recordMode === 'video' ? "Dumaloq video (1-bosish: ovozga o'tish, ushlab turish: yozish)" : "Ovozli xabar (1-bosish: videoga o'tish, ushlab turish: yozish)"}
                >
                  {recordMode === 'video' ? (
                    <Video className="w-5 h-5 stroke-[2.2]" />
                  ) : (
                    <Mic className="w-5 h-5 stroke-[2.2]" />
                  )}
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Reimagined Telegram Premium Sticker & Emoji Picker */}
      {showEmojiPicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-16 sm:bottom-20 left-2 sm:left-4 z-40 animate-scale-in"
        >
          <StickerPicker
            onSelectSticker={(id, label) => handleSendSticker(id, label)}
            onSelectEmoji={(emoji) => {
              setInputText((prev) => prev + emoji);
              inputRef.current?.focus();
            }}
            onSelectGif={handleSendGif}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Forward Message Selection Modal */}
      {forwardingMessage && (
        <ForwardMessageModal
          message={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
          onForward={handleCompleteForward}
        />
      )}

      {/* Chat Background Gallery Modal */}
      {showWallpaperModal && (
        <ChatBackgroundGalleryModal
          conversationId={conversation._id}
          chatName={chatTitle}
          onClose={() => setShowWallpaperModal(false)}
        />
      )}

      {/* Fullscreen Media Viewer */}
      <MediaViewer
        mediaMessages={mediaMessages}
        initialMessageId={selectedMediaMessageId || undefined}
        isOpen={isMediaViewerOpen}
        onClose={() => setIsMediaViewerOpen(false)}
      />

      {/* Telegram Pre-Send Media Modal */}
      <MediaSendModal
        files={pendingMediaFiles}
        isOpen={isMediaSendModalOpen}
        isUploading={isUploading}
        onClose={() => {
          setIsMediaSendModalOpen(false);
          setPendingMediaFiles([]);
        }}
        onSend={handleSendMediaFiles}
      />
    </div>
  );
};
