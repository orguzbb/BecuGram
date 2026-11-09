import React, { useState, useEffect, useRef } from 'react';
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
  Ban,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { VoicePlayer } from '../../components/VoicePlayer';
import { CallModal } from '../../components/CallModal';
import { ForwardMessageModal } from '../../components/ForwardMessageModal';
import { LottieAnimation } from '../../components/LottieAnimation';
import { TELEGRAM_REACTIONS, getReactionPath } from '../../utils/reactions';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { Message, Conversation, User } from '../../types';
import { useToast } from '../../components/Toast';
import { format } from 'date-fns';

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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Emoji picker & header menu states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      });
      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom(true);
    } catch {
      showToast('Stiker yuborishda xatolik', 'error');
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
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    fetchHistory();
    api.markChatRead(conversation._id).catch(() => {});
    socketService.joinChat(conversation._id);

    const socket = socketService.getSocket();
    if (socket) {
      const handleNewMessage = (msg: Message) => {
        if (msg.conversationId === conversation._id) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          api.markChatRead(conversation._id).catch(() => {});
        }
      };

      const handleReaction = (payload: { messageId: string; reactions: any[] }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === payload.messageId ? { ...m, reactions: payload.reactions } : m))
        );
      };

      const handleDeletedMessage = (payload: { messageId: string; conversationId: string }) => {
        if (payload.conversationId === conversation._id) {
          setMessages((prev) => prev.filter((m) => m._id !== payload.messageId));
        }
      };

      socket.on('message:new', handleNewMessage);
      socket.on('message:reaction', handleReaction);
      socket.on('message:deleted', handleDeletedMessage);

      return () => {
        socket.off('message:new', handleNewMessage);
        socket.off('message:reaction', handleReaction);
        socket.off('message:deleted', handleDeletedMessage);
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

  // Track scroll position
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
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

    try {
      const newMsg = await api.sendMessage(conversation._id, {
        content: textToSend,
        type: 'text',
        replyToId: replyingTo?._id,
      });
      setMessages((prev) => [...prev, newMsg]);
      setReplyingTo(null);
      socketService.sendTypingStop(conversation._id);
      scrollToBottom(true);
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Xabar yuborishda xatolik yuz berdi', 'error');
    }
  };

  // Double tap vs Single tap handler
  const handleMessageClick = (msg: Message, e: React.MouseEvent) => {
    e.stopPropagation();

    if (clickTimeoutRef.current) {
      // Double tap detected!
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setContextMenuMessage(null);

      // Trigger instant animated Heart reaction
      handleHeartReaction(msg._id);
    } else {
      // Single tap -> after 220ms open Context Menu
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickCoords = {
        x: Math.min(Math.max(rect.left + rect.width / 2, 160), window.innerWidth - 160),
        y: Math.min(rect.top + 10, window.innerHeight - 380),
      };

      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        setContextMenuCoords(clickCoords);
        setContextMenuMessage(msg);
      }, 220);
    }
  };

  // Instant Heart Reaction
  const handleHeartReaction = async (messageId: string) => {
    setAnimatingHeartMsgId(messageId);
    setTimeout(() => setAnimatingHeartMsgId(null), 1000);
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

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;
        const isImg = file.type.startsWith('image/');
        const newMsg = await api.sendMessage(conversation._id, {
          content: isImg ? 'Rasm biriktirildi 📷' : `${file.name} 📄`,
          type: isImg ? 'image' : 'file',
          media: {
            url: base64Url,
            name: file.name,
            size: file.size,
            mimeType: file.type,
          },
        });
        setMessages((prev) => [...prev, newMsg]);
        showToast('Fayl muvaffaqiyatli yuborildi!', 'success');
        scrollToBottom(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showToast('Fayl yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const newMsg = await api.sendMessage(conversation._id, {
            content: `Ovozli xabar (${recordingSeconds}s)`,
            type: 'voice',
            media: {
              url: base64Audio,
              duration: recordingSeconds || 3,
            },
          });
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom(true);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      showToast('Mikrofon ruxsati kerak.', 'error');
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      audioChunksRef.current = [];
    }
  };

  const handleEndCall = async (durationSec: number) => {
    setActiveCall(null);
    const durationText = `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, '0')}`;
    const logMsg = await api.sendMessage(conversation._id, {
      content: `📞 Qo'ng'iroq yakunlandi (${durationText})`,
      type: 'text',
    });
    setMessages((prev) => [...prev, logMsg]);
  };

  const isPartnerTyping = isDirect && partner?._id && typingUsers[partner._id];

  return (
    <div
      onClick={() => setContextMenuMessage(null)}
      className="flex flex-col h-full bg-[#ECE8F7] dark:bg-[#0B1311] select-none text-zinc-900 dark:text-white overflow-hidden relative transition-colors"
      style={{
        backgroundImage:
          theme === 'dark'
            ? 'radial-gradient(circle at 50% 50%, rgba(14,23,21,0.95) 0%, rgba(11,19,17,1) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7) 0%, rgba(235,231,248,0.95) 100%)',
      }}
    >
      {/* Active Call Modal */}
      {activeCall && partner && (
        <CallModal
          type={activeCall}
          user={partner}
          onEndCall={handleEndCall}
        />
      )}

      {/* Top Header matching Image 2 & 5 */}
      <div className="h-16 px-4 bg-white/95 dark:bg-[#0E1715]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-[#1C2C27] flex items-center justify-between z-20 shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-zinc-700 hover:text-zinc-950 dark:text-[#8DA39A] dark:hover:text-white rounded-full transition-colors active:scale-95"
            title="Orqaga"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div
            onClick={() => partner && onOpenProfile(partner)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity min-w-0"
          >
            <Avatar
              name={chatTitle}
              src={partner?.avatar || conversation.group?.avatar}
              size="md"
              isOnline={isOnline}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                  {chatTitle}
                </span>
                {isSavedMessages && (
                  <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.2 rounded-full font-semibold">
                    Shaxsiy
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500 dark:text-[#8DA39A] font-medium block leading-none truncate">
                {chatSubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Search, Call, Video, More */}
        <div className="flex items-center gap-1">
          {isDirect && partner && !isSavedMessages && (
            <>
              <button
                onClick={() => setActiveCall('audio')}
                className="w-9 h-9 rounded-full hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 dark:hover:bg-[#15231F] flex items-center justify-center transition-colors"
                title="Ovozli qo'ng'iroq"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveCall('video')}
                className="w-9 h-9 rounded-full hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 dark:hover:bg-[#15231F] flex items-center justify-center transition-colors"
                title="Video qo'ng'iroq"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => {
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isSearching
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 dark:hover:bg-[#15231F]'
            }`}
            title="Qidirish"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHeaderMenu(!showHeaderMenu);
              }}
              className="w-9 h-9 rounded-full hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 dark:hover:bg-[#15231F] flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showHeaderMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-11 w-52 rounded-2xl bg-white dark:bg-[#14231E] border border-zinc-200 dark:border-[#233C33] shadow-2xl py-1.5 z-30 animate-fade-in text-xs"
              >
                {partner && (
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      onOpenProfile(partner);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-[#1A2E26] flex items-center gap-2.5 text-zinc-800 dark:text-white"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-500" />
                    Profilni ko'rish
                  </button>
                )}
                {partner && (
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleToggleBlockPartner();
                    }}
                    className={`w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-[#1A2E26] flex items-center gap-2.5 ${
                      isPartnerBlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    {isPartnerBlocked ? 'Blokdan chiqarish' : 'Foydalanuvchini bloklash'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowHeaderMenu(false);
                    showToast("Xabarnomalar o'chirildi", 'info');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-[#1A2E26] flex items-center gap-2.5 text-zinc-800 dark:text-white"
                >
                  <VolumeX className="w-4 h-4 text-zinc-500 dark:text-[#8DA39A]" />
                  Ovozni o'chirish
                </button>
                <button
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setMessages([]);
                    showToast('Tarix tozalandi', 'info');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2.5"
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
          className="px-4 py-2 bg-white/95 dark:bg-[#14231E]/95 border-b border-zinc-200/60 dark:border-[#1F352E] flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#1C2C27] transition-colors z-10 shrink-0 shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Pin className="w-4 h-4 text-[#2563EB] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#2563EB] block uppercase tracking-wider">
                Qadalgan xabar
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate max-w-xs sm:max-w-md">
                {pinnedMessage.content || (pinnedMessage.type === 'voice' ? 'Ovozli xabar' : 'Media fayl')}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnpinMessage();
            }}
            className="w-6 h-6 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 flex items-center justify-center shrink-0"
            title="Qadashdan chiqarish"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* In-Chat Search Bar */}
      {isSearching && (
        <div className="px-4 py-2 bg-white dark:bg-[#0E1715] border-b border-zinc-200 dark:border-[#1F352E] flex items-center gap-2 z-20 shrink-0 animate-fade-in shadow-xs">
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

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
      >
        {/* Date Divider pill */}
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-[#14231E]/80 backdrop-blur-sm border border-zinc-200/60 dark:border-[#20362E] text-[11px] text-zinc-600 dark:text-[#8DA39A] font-semibold shadow-xs">
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
          messages.map((msg) => {
            const senderIdStr = typeof msg.senderId === 'object' && msg.senderId ? msg.senderId._id : msg.senderId;
            const isMe = senderIdStr === user?._id || senderIdStr === 'user_default' || (msg as any).isMe;
            const replySenderName =
              typeof msg.replyTo?.senderId === 'object' && msg.replyTo?.senderId
                ? (msg.replyTo.senderId as any).displayName
                : 'User';
            const isHeartAnimating = animatingHeartMsgId === msg._id;

            return (
              <div
                key={msg._id}
                id={`msg-${msg._id}`}
                className={`flex flex-col relative group transition-all duration-300 ${isMe ? 'items-end' : 'items-start'} ${
                  msg.reactions && msg.reactions.length > 0 ? 'mb-4' : ''
                }`}
              >
                {/* Animated Lottie Heart Pop Animation on double-click */}
                {isHeartAnimating && (
                  <div className="absolute z-30 pointer-events-none -top-12 left-1/2 -translate-x-1/2 animate-bounce scale-125">
                    <LottieAnimation src="/reactions/006.json" size={54} loop={false} />
                  </div>
                )}

                {/* Bubble Container: Blue for Me, Pure White for Others (Image 2) */}
                <div
                  onClick={(e) => handleMessageClick(msg, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setContextMenuCoords({
                      x: Math.min(Math.max(rect.left + rect.width / 2, 160), window.innerWidth - 160),
                      y: Math.min(rect.top + 10, window.innerHeight - 380),
                    });
                    setContextMenuMessage(msg);
                  }}
                  className={`relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-[14px] shadow-sm cursor-pointer select-none transition-all active:scale-[0.98] ${
                    msg.type === 'sticker'
                      ? 'bg-transparent border-0 shadow-none !p-1'
                      : isMe
                      ? 'bg-[#2563EB] text-white rounded-tr-sm shadow-blue-500/10'
                      : 'bg-white dark:bg-[#15231F] text-zinc-900 dark:text-zinc-100 border border-zinc-200/70 dark:border-[#21372F] rounded-tl-sm'
                  }`}
                >
                  {/* Forwarded Reference Header */}
                  {msg.forwardedFrom && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-300 dark:text-blue-400 mb-1 opacity-95">
                      <Share2 className="w-3 h-3 stroke-[2.2]" />
                      <span>Uzatilgan xabar: {msg.forwardedFrom.displayName}</span>
                    </div>
                  )}

                  {/* Quoted Reply reference block */}
                  {msg.replyTo && (
                    <div
                      className={`mb-1.5 pl-2.5 py-1 border-l-2 rounded-r-lg text-xs ${
                        isMe
                          ? 'border-white/70 bg-black/15 text-white/90'
                          : 'border-blue-500 bg-zinc-100 dark:bg-black/20 text-zinc-700 dark:text-white/80'
                      }`}
                    >
                      <span className={`font-bold block text-[11px] ${isMe ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                        {replySenderName}
                      </span>
                      <span className="truncate block text-[11px] opacity-90">
                        {msg.replyTo.content}
                      </span>
                    </div>
                  )}

                  {/* Image attachment rendering */}
                  {msg.type === 'image' && msg.media?.url && (
                    <div className="mb-2 rounded-xl overflow-hidden max-w-sm">
                      <img src={msg.media.url} alt="Attachment" className="w-full object-cover max-h-64 rounded-xl" />
                    </div>
                  )}

                  {/* Sticker / Voice / Text message rendering */}
                  {msg.type === 'sticker' ? (
                    <div className="p-1 select-none flex items-center justify-center">
                      <span className="text-6xl p-2 select-none filter drop-shadow-md hover:scale-110 active:scale-95 transition-transform">
                        {msg.content}
                      </span>
                    </div>
                  ) : msg.type === 'voice' ? (
                    <VoicePlayer
                      url={msg.media?.url || ''}
                      duration={msg.media?.duration || 45}
                      isMe={isMe}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed break-words">
                      {searchQuery.trim() && msg.content ? (
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
                  )}

                  {/* Metadata: Time and Double Tick */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] font-medium ${
                      isMe ? 'text-blue-100/90' : 'text-zinc-400 dark:text-[#8DA39A]'
                    }`}
                  >
                    {msg.isEdited && <span className="italic mr-0.5 opacity-80">tahrirlangan</span>}
                    <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    {isMe && (
                      msg.isRead ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-100" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-blue-100" />
                      )
                    )}
                  </div>

                  {/* REACTION BADGE: PLACED AT THE BOTTOM-LEFT PER USER SPECIFICATION & IMAGE 2 */}
                  {msg.reactions && msg.reactions.length > 0 && (() => {
                    const activeReactions = msg.reactions;
                    const reactorInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A';
                    return (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -bottom-4 left-2.5 flex items-center gap-2 bg-[#EDE8FA] dark:bg-[#1E293B] border border-[#DDD5F5] dark:border-white/15 px-3 py-1 rounded-full shadow-md cursor-pointer select-none z-10 hover:scale-105 active:scale-95 transition-all"
                      >
                        {Array.from(new Set(activeReactions.map((r) => r.emoji))).map((reactionKey, i) => {
                          const count = activeReactions.filter((r) => r.emoji === reactionKey).length;
                          const hasMyReact = activeReactions.some(
                            (r) => r.emoji === reactionKey && r.userId === (user?._id || 'me')
                          );
                          const lottieSrc = getReactionPath(reactionKey);

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleReaction(msg._id, reactionKey)}
                              className={`flex items-center gap-2 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                                hasMyReact ? 'font-bold' : ''
                              }`}
                              title="Reaksiya"
                            >
                              <LottieAnimation src={lottieSrc} size={28} loop={true} />
                              {/* Round user initial circle matching Image 2 & 3 [ 👍 (A) ] */}
                              <div className="w-5 h-5 rounded-full bg-[#5D5FEF] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
                                {reactorInitial}
                              </div>
                              {count > 1 && (
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
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

      {/* Floating "Oxirlariga" Button matching Image 2 */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#14231E] border border-zinc-200/90 dark:border-[#233830] text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all animate-fade-in"
        >
          <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
          <span>Oxirlariga</span>
        </button>
      )}

      {/* Telegram-style Context Menu Bubble with ANIMATED LOTTIE REACTIONS */}
      {contextMenuMessage && contextMenuCoords && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${contextMenuCoords.y}px`,
            left: `${contextMenuCoords.x}px`,
            transform: 'translate(-50%, 0)',
          }}
          className="z-50 w-[310px] bg-[#FAF8F5] dark:bg-[#15231F] border border-zinc-200 dark:border-[#263C34] rounded-[24px] shadow-2xl p-3 animate-fade-in text-zinc-800 dark:text-zinc-100 select-none"
        >
          {/* Reaction Stickers Grid: Animated Telegram Lottie Reactions! */}
          <div className="grid grid-cols-6 gap-1.5 pb-2.5 max-h-36 overflow-y-auto scrollbar-none">
            {TELEGRAM_REACTIONS.slice(0, 18).map((item) => (
              <button
                key={item.id}
                onClick={() => handleReaction(contextMenuMessage._id, item.id)}
                className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center hover:scale-125 active:scale-95 transition-all"
                title={item.name}
              >
                <LottieAnimation src={item.path} size={30} loop={true} />
              </button>
            ))}
          </div>

          <div className="h-[1px] bg-zinc-200 dark:bg-zinc-800 my-1" />

          {/* Action List matching Image 1 */}
          <div className="space-y-0.5 pt-1 text-sm font-medium">
            {/* Javob berish */}
            <button
              onClick={() => handleReplyMessage(contextMenuMessage)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
            >
              <CornerUpLeft className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
              <span>Javob berish</span>
            </button>

            {/* Tahrirlash (Only for own messages) */}
            {contextMenuMessage.senderId === user?._id || (contextMenuMessage as any).isMe ? (
              <button
                onClick={() => handleStartEditMessage(contextMenuMessage)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
              >
                <Edit2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
                <span>Tahrirlash</span>
              </button>
            ) : null}

            {/* Nusxa olish */}
            <button
              onClick={() => handleCopyMessage(contextMenuMessage)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
            >
              <Copy className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
              <span>Nusxa olish</span>
            </button>

            {/* Uzatish */}
            <button
              onClick={() => handleForwardMessage(contextMenuMessage)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
            >
              <Share2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
              <span>Uzatish</span>
            </button>

            {/* Qadash */}
            <button
              onClick={() => handlePinMessage(contextMenuMessage)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
            >
              <Pin className="w-4 h-4 text-zinc-500 dark:text-zinc-400 stroke-[2.2]" />
              <span>Qadash</span>
            </button>

            {/* O'chirish (Red) */}
            <button
              onClick={() => {
                setDeleteConfirmMsg(contextMenuMessage);
                setContextMenuMessage(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors text-left"
            >
              <Trash2 className="w-4 h-4 stroke-[2.2]" />
              <span>O‘chirish</span>
            </button>
          </div>
        </div>
      )}

      {/* Telegram-style Delete Confirmation Modal */}
      {deleteConfirmMsg && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setDeleteConfirmMsg(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#15231F] border border-zinc-200/80 dark:border-[#233830] rounded-3xl p-6 shadow-2xl text-zinc-900 dark:text-white transition-all scale-100"
          >
            <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-white">Xabarni o‘chirish</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-5 leading-relaxed">
              Haqiqatan ham bu xabarni butunlay o‘chirmoqchimisiz?
            </p>

            {/* Checkbox: [Partner] uchun ham o'chirish */}
            <label className="flex items-center gap-3 p-2.5 -mx-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 mb-5 cursor-pointer select-none group transition-colors">
              <input
                type="checkbox"
                checked={deleteForEveryone}
                onChange={(e) => setDeleteForEveryone(e.target.checked)}
                className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#0E1715] cursor-pointer"
              />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                {partner?.displayName || chatTitle} uchun ham o‘chirish
              </span>
            </label>

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
                    setMessages((prev) => prev.filter((m) => m._id !== targetMsg._id));
                    try {
                      await api.deleteMessage(targetMsg._id);
                      showToast("Xabar o‘chirildi", 'info');
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

      {/* Replying banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-white/90 dark:bg-[#14231E] border-t border-zinc-200 dark:border-[#233832] text-xs">
          <div className="flex items-center gap-2 truncate">
            <CornerUpLeft className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-600">Javob berilmoqda:</span>
            <span className="truncate text-zinc-600 dark:text-[#8DA39A]">{replyingTo.content}</span>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-zinc-400 hover:text-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing banner */}
      {editingMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50/90 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-800 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Edit2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-600">Xabarni tahrirlash:</span>
            <span className="truncate text-zinc-600 dark:text-[#8DA39A]">{editingMessage.content}</span>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setInputText('');
            }}
            className="text-zinc-400 hover:text-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recording Active Bar */}
      {isRecording ? (
        <div className="p-3 bg-white dark:bg-[#0E1715] border-t border-zinc-200 dark:border-[#1C2C27] flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wider">
              {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-xs text-zinc-500 dark:text-[#8DA39A] italic">Ovoz yozilmoqda...</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#162520] dark:hover:bg-[#1E332B] text-rose-600 dark:text-rose-400 text-xs font-semibold"
            >
              Bekor qilish
            </button>
            <button
              onClick={stopAndSendRecording}
              className="px-4 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Yuborish
            </button>
          </div>
        </div>
      ) : isPartnerBlocked ? (
        /* Blocked Banner in Composer area */
        <div className="p-4 bg-zinc-100 dark:bg-[#0E1715] border-t border-zinc-200 dark:border-[#1C2C27] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <Ban className="w-4 h-4 text-red-500 shrink-0" />
            <span>Siz bu foydalanuvchini bloklagansiz. Xabar almashish cheklangan.</span>
          </div>
          <button
            onClick={handleToggleBlockPartner}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            Blokdan chiqarish
          </button>
        </div>
      ) : (
        /* Message Composer matching Image 2 & 5 */
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white/95 dark:bg-[#0E1715]/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-[#1C2C27] flex items-center gap-2 relative shadow-xs"
        >
          {/* Attachment input hidden */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Capsule Input matching Image 2 & 5 */}
          <div className="flex-1 flex items-center bg-zinc-100/90 dark:bg-[#15231F] border border-zinc-200/60 dark:border-[#20362E] rounded-full px-4 py-2 transition-all focus-within:border-blue-500/70 focus-within:bg-white dark:focus-within:bg-[#182823]">
            {/* Smile Icon on left */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors mr-2"
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
              className="w-full bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 outline-none"
            />

            {/* Paperclip Icon on right */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Fayl yoki rasm"
              className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors ml-2"
            >
              <Paperclip className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* Circular Action Button: Send or Mic (Vibrant Blue matching Image 2 & 5) */}
          {inputText.trim() ? (
            <button
              type="submit"
              className="w-11 h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-md shadow-blue-500/25 transition-all shrink-0"
              title={editingMessage ? 'Tahrirni saqlash' : 'Yuborish'}
            >
              {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="w-11 h-11 rounded-full bg-[#2563EB] text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-md shadow-blue-500/25 transition-all shrink-0"
              title="Ovozli xabar yozish"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}

      {/* Emoji & Animated Stickers Picker Popup */}
      {showEmojiPicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-20 left-4 z-40 w-80 max-w-[calc(100vw-32px)] bg-white dark:bg-[#121E1B] border border-zinc-200 dark:border-[#233830] rounded-2xl shadow-2xl p-3 animate-scale-in"
        >
          {/* Tabs: Emojilar | Stikerlar */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-[#0E1715] rounded-xl mb-2.5">
            <button
              type="button"
              onClick={() => setPickerTab('emoji')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                pickerTab === 'emoji'
                  ? 'bg-white dark:bg-[#1A2E26] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              😊 Emojilar
            </button>
            <button
              type="button"
              onClick={() => setPickerTab('stickers')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                pickerTab === 'stickers'
                  ? 'bg-white dark:bg-[#1A2E26] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              ⚡ Stikerlar
            </button>
          </div>

          {/* EMOJIS GRID */}
          {pickerTab === 'emoji' ? (
            <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1">
              {[
                '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘',
                '😋', '😛', '😜', '🤪', '😎', '🥳', '😏', '😒',
                '🤔', '🤫', '🤭', '🫡', '🤐', '🤨', '😐', '😑',
                '👍', '👎', '👏', '🙌', '🫶', '🤝', '🔥', '✨',
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                '💯', '🎉', '🚀', '⭐', '⚡', '🏆', '☕', '💎',
              ].map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    inputRef.current?.focus();
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-lg active:scale-90 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            /* STICKERS GRID */
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
              {[
                { emoji: '🚀', label: 'Uchdik!' },
                { emoji: '🔥', label: 'Qaynoq' },
                { emoji: '❤️', label: 'Muhabbat' },
                { emoji: '🎉', label: 'Tabrik!' },
                { emoji: '😂', label: 'Haha' },
                { emoji: '👍', label: 'Zo‘r' },
                { emoji: '😎', label: 'Salqin' },
                { emoji: '🫡', label: 'Xizmatda' },
                { emoji: '💯', label: 'Aniq 100' },
                { emoji: '✨', label: 'Sehrli' },
                { emoji: '🤝', label: 'Kelishdik' },
                { emoji: '👋', label: 'Salom!' },
              ].map((st, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendSticker(st.emoji, st.label)}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#0E1715] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{st.emoji}</span>
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-blue-500">
                    {st.label}
                  </span>
                </button>
              ))}
            </div>
          )}
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
    </div>
  );
};
