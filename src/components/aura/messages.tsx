'use client';

import { useChats, useChatMessages, useSendMessage } from '@/lib/api-hooks';
import { resolveImageUrl, timeAgo } from '@/lib/utils';
import { useAuraStore, type ChatMessage } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { Camera, Search, MoreVertical, Phone, Video, Send, Image as ImageIcon, Smile, Heart, ThumbsUp, Laugh, X, Plus, QrCode, ScanLine, UserPlus, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const quickReactions = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💯', label: '100' },
];

export function Messages() {
  const currentUser = useCurrentUser();
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; handle: string; avatar: string | null; verified: boolean }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTab, setQrTab] = useState<'my' | 'scan'>('my');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API hooks
  const { data: chats, isLoading: chatsLoading, refetch: refetchChats } = useChats();
  const { data: messagesData, refetch: refetchMessages } = useChatMessages(selectedChatId);
  const sendMessageMutation = useSendMessage();

  const chatMessages: ChatMessage[] = (() => {
    if (!messagesData) return [];
    const raw = (messagesData as any)?.messages || messagesData;
    if (!Array.isArray(raw)) return [];
    return raw.map((m: any) => ({
      id: m.id,
      senderId: m.senderId || m.sender?.id,
      text: m.text,
      createdAt: new Date(m.createdAt).getTime(),
      imageUrl: m.imageUrl || undefined,
    }));
  })();

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedChatId]);

  // Mark chat as read via API when opened
  useEffect(() => {
    if (selectedChatId) {
      fetch(`/api/chats/${selectedChatId}/read`, { method: 'POST' }).catch(() => {});
      // Also update local store unread count
      useAuraStore.getState().markChatRead(selectedChatId);
    }
  }, [selectedChatId]);

  // Filter chats by search
  const filteredChats = (() => {
    if (!chats) return [];
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((c) =>
      c.otherUser?.name?.toLowerCase().includes(q) ||
      c.otherUser?.handle?.toLowerCase().includes(q)
    );
  })();

  // Find selected chat data
  const selectedChat = chats?.find((c) => c.id === selectedChatId);

  const handleSend = async () => {
    if ((!inputText.trim() && !imageUrl.trim()) || !selectedChatId) return;

    const textToSend = inputText.trim();
    const imageToSend = imageUrl.trim();

    // Optimistically add to local UI
    setInputText('');
    setImageUrl('');
    setShowImageInput(false);

    try {
      await sendMessageMutation.mutateAsync({
        chatId: selectedChatId,
        text: textToSend,
        imageUrl: imageToSend || undefined,
      } as any);
      toast.success('+1 ORRA token', { duration: 1500 });
    } catch (error) {
      toast.error('Failed to send message');
      // Revert input
      setInputText(textToSend);
      setImageUrl(imageToSend);
    }
  };

  // Debounced user search for new chat
  const handleNewChatSearch = useCallback((query: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success && data.data?.users) {
          setSearchResults(data.data.users);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const handleCreateChat = async (otherUserId: string) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedChatId(data.data.id);
        setShowNewChat(false);
        setNewChatQuery('');
        setSearchResults([]);
        refetchChats();
        toast.success('Chat created!');
      } else {
        toast.error(data.error || 'Failed to create chat');
      }
    } catch {
      toast.error('Failed to create chat');
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    if (!selectedChatId) return;
    setInputText((prev) => prev + emoji);
    setShowEmojis(false);
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Messages</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowQrModal(true); setQrTab('my'); setScanResult(null); }}
            className="p-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all"
            title="QR Code"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="p-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all">
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* New Chat Form */}
      {showNewChat && (
        <div className="glass-panel rounded-2xl p-4 border border-violet-500/20 fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Start a New Chat</h3>
            <button
              onClick={() => { setShowNewChat(false); setNewChatQuery(''); setSearchResults([]); }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={newChatQuery}
              onChange={(e) => { setNewChatQuery(e.target.value); handleNewChatSearch(e.target.value); }}
              placeholder="Search by name or handle..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {searchLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}
          {!searchLoading && newChatQuery.trim() && searchResults.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-3">No users found</p>
          )}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateChat(user.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                    <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-white text-sm truncate">{user.name}</p>
                      {user.verified && (
                        <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{user.handle?.startsWith('@') ? user.handle : `@${user.handle}`}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!newChatQuery.trim() && (
            <p className="text-[10px] text-slate-500">Search for someone by their name or handle to start chatting</p>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
        />
      </div>

      {/* Online Now */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
        {(chats || [])
          .filter((c) => c.otherUser?.online)
          .map((chat) => (
            <button key={chat.id} className="flex-shrink-0 flex flex-col items-center gap-1" onClick={() => setSelectedChatId(chat.id)}>
              <div className="relative">
                <div className={`w-12 h-12 rounded-full overflow-hidden ring-2 ${selectedChatId === chat.id ? 'ring-violet-500' : 'ring-violet-500/30'} transition-all`}>
                  <img src={resolveImageUrl(chat.otherUser?.avatar)} alt={chat.otherUser?.name || ''} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#050505]" />
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-[48px]">{chat.otherUser?.name?.split(' ')[0] || ''}</span>
            </button>
          ))}
      </div>

      {/* Loading state */}
      {chatsLoading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading chats...</p>
        </div>
      )}

      {/* Chat List or Chat View */}
      {!selectedChatId ? (
        <div className="space-y-1">
          {!chatsLoading && filteredChats.length === 0 && (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-sm">No conversations yet</p>
              <p className="text-xs text-slate-600 mt-1">Start a new chat to begin messaging</p>
            </div>
          )}
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-white/10">
                  <img src={resolveImageUrl(chat.otherUser?.avatar)} alt={chat.otherUser?.name || ''} className="w-full h-full object-cover" />
                </div>
                {chat.otherUser?.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#050505]" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white text-sm truncate">{chat.otherUser?.name || 'Unknown User'}</p>
                  {chat.lastMessage && (
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                      {(() => {
                        const diff = Date.now() - new Date(chat.lastMessage.createdAt).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return 'now';
                        if (mins < 60) return `${mins}m`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h`;
                        return `${Math.floor(hrs / 24)}d`;
                      })()}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-slate-400 truncate">{chat.lastMessage?.text || 'No messages yet'}</p>
                  {chat.unreadCount > 0 && (
                    <span className="flex-shrink-0 ml-2 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden fade-in">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/5">
            <button onClick={() => setSelectedChatId(null)} className="text-violet-400 text-sm font-medium hover:text-violet-300">
              Back
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10">
              <img src={resolveImageUrl(selectedChat?.otherUser?.avatar)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{selectedChat?.otherUser?.name || 'Unknown'}</p>
              <p className="text-xs text-emerald-400">{selectedChat?.otherUser?.online ? 'Online' : 'Offline'}</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all">
              <Video className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="min-h-[300px] max-h-[400px] overflow-y-auto no-scrollbar p-4 space-y-3">
            {chatMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const reaction = useAuraStore.getState().chatReactions[msg.id];
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative group`}
                  onDoubleClick={() => setActiveReaction(activeReaction === msg.id ? null : msg.id)}
                >
                  <div className={`max-w-[80%] ${isMe ? 'bg-violet-600/30 rounded-2xl rounded-br-md' : 'bg-white/10 rounded-2xl rounded-bl-md'} px-3 py-2 relative`}>
                    <p className={`text-sm ${isMe ? 'text-white' : 'text-slate-200'}`}>{msg.text}</p>
                    {msg.imageUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden max-h-40">
                        <img src={msg.imageUrl} alt="Shared" className="w-full object-cover max-h-40" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    <p className={`text-[9px] mt-1 ${isMe ? 'text-violet-300/60' : 'text-slate-500'}`}>
                      {timeAgo(msg.createdAt)}
                      {isMe && ' ✓✓'}
                    </p>
                    {reaction && (
                      <span className="absolute -bottom-2 right-2 text-sm bg-white/10 rounded-full px-1.5 py-0.5">{reaction}</span>
                    )}
                  </div>
                  {/* Quick reactions on hover */}
                  {activeReaction === msg.id && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 bg-black/80 backdrop-blur-md rounded-full px-2 py-1 z-10">
                      {quickReactions.map((r) => (
                        <button
                          key={r.emoji}
                          onClick={() => { useAuraStore.getState().addReaction(msg.id, r.emoji); setActiveReaction(null); }}
                          className="text-sm hover:scale-125 transition-transform"
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Image URL Input */}
          {showImageInput && (
            <div className="px-3 py-2 border-t border-white/5 fade-in">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                />
                <button onClick={() => setShowImageInput(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Emoji Bar */}
          {showEmojis && (
            <div className="px-3 py-2 border-t border-white/5 fade-in">
              <div className="flex gap-2 flex-wrap">
                {['😊', '😂', '❤️', '🔥', '👍', '💯', '🎵', '💃', '🎨', '✨', '🎮', '📸', '🌟', '💪', '🚀', '🎸'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickEmoji(emoji)}
                    className="text-xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message input */}
          <div className="flex items-center gap-2 p-3 border-t border-white/5">
            <button onClick={() => setShowImageInput(!showImageInput)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all">
              <ImageIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setShowEmojis(!showEmojis)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all">
              <Smile className="w-4 h-4" />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                autoFocus
              />
            </div>
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !imageUrl.trim()) || sendMessageMutation.isPending}
              className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-all disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal — CashApp-style scan & share */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowQrModal(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm glass-panel rounded-3xl overflow-hidden border border-violet-500/20 fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-base font-bold text-white">QR Code</h3>
              <button onClick={() => setShowQrModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switcher — My QR / Scan */}
            <div className="flex mx-4 mt-4 rounded-xl bg-white/5 p-1">
              <button
                onClick={() => { setQrTab('my'); setScanResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  qrTab === 'my' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                My QR
              </button>
              <button
                onClick={() => { setQrTab('scan'); setScanResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  qrTab === 'scan' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ScanLine className="w-4 h-4" />
                Scan
              </button>
            </div>

            {/* My QR Tab — shows user's QR code for others to scan */}
            {qrTab === 'my' && (
              <div className="p-6 flex flex-col items-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-violet-500/40 cosmic-avatar-glow">
                    <img
                      src={resolveImageUrl(currentUser.avatar || '/api/uploads?path=images/orra-logo.png')}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center ring-2 ring-[#0a0a0f]">
                    <QrCode className="w-3 h-3 text-white" />
                  </div>
                </div>

                <h4 className="text-white font-bold text-sm mb-0.5">{currentUser.name || 'ORRA User'}</h4>
                <p className="text-slate-500 text-xs mb-5">
                  {(currentUser.handle || 'orrauser').startsWith('@') ? (currentUser.handle || 'orrauser') : `@${currentUser.handle || 'orrauser'}`}
                </p>

                {/* QR Code */}
                <div className="p-4 rounded-2xl bg-white shadow-[0_0_30px_rgba(139,92,246,0.3)] mb-5">
                  <QRCodeSVG
                    value={`orra://user/${currentUser.id || 'unknown'}`}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#0a0a0f"
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <p className="text-slate-400 text-xs text-center mb-4">
                  Have a friend scan this to add you instantly
                </p>

                {/* Share button */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Add me on ORRA',
                        text: `Scan my QR code on ORRA or search ${(currentUser.handle || 'orrauser').startsWith('@') ? currentUser.handle : `@${currentUser.handle || 'orrauser'}`}`,
                        url: `${window.location.origin}/profile`,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(`${window.location.origin}/profile`);
                      toast.success('Profile link copied!', { duration: 2000 });
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            )}

            {/* Scan Tab — simulated scanner to add someone */}
            {qrTab === 'scan' && (
              <div className="p-6 flex flex-col items-center">
                {scanResult ? (
                  /* Scan result — found a user */
                  <div className="flex flex-col items-center text-center fade-in">
                    <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-emerald-500/40 mb-4 cosmic-avatar-glow">
                      <img
                        src={resolveImageUrl(scanResult)}
                        alt="Scanned user"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/uploads?path=images/orra-logo.png';
                        }}
                      />
                    </div>
                    <h4 className="text-white font-bold text-base mb-1">User Found!</h4>
                    <p className="text-slate-400 text-xs mb-5">Scan complete — add this person to start chatting</p>
                    <button
                      onClick={() => {
                        setShowQrModal(false);
                        setShowNewChat(true);
                        toast.success('Ready to start a new chat!', { duration: 2000 });
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add & Chat
                    </button>
                    <button
                      onClick={() => setScanResult(null)}
                      className="mt-3 text-slate-500 text-xs hover:text-white transition-colors"
                    >
                      Scan again
                    </button>
                  </div>
                ) : (
                  /* Scanner UI — animated scanning frame */
                  <div className="flex flex-col items-center">
                    <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-2 border-violet-500/30 mb-5 bg-black/40">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-violet-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-violet-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-violet-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-violet-400 rounded-br-lg" />

                      {/* Animated scan line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent qr-scan-line" />

                      {/* Center icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ScanLine className="w-10 h-10 text-violet-500/40" />
                      </div>
                    </div>

                    <p className="text-white font-semibold text-sm mb-1">Scan a QR Code</p>
                    <p className="text-slate-500 text-xs text-center mb-5">
                      Point your camera at someone&apos;s ORRA QR code to add them
                    </p>

                    {/* Simulated scan button — on mobile this would use the camera API */}
                    <button
                      onClick={() => {
                        setScanResult('/api/uploads?path=images/orra-logo.png');
                        toast.success('QR Code detected!', { duration: 1500 });
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold hover:bg-violet-600/30 transition-all"
                    >
                      <ScanLine className="w-4 h-4" />
                      Simulate Scan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
