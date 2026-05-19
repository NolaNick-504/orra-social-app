'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import { X, Heart, MessageCircle, Send, Radio, Clock, Gift, Camera, Mic, MonitorUp, Eye, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StreamData {
  id: string;
  title: string;
  thumbnail: string;
  isLive: boolean;
  viewerCount: number;
  likesCount: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
  isHost: boolean;
}

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  isSystem?: boolean;
}

interface FloatingHeart {
  id: number;
  x: number;
}

// ─── Simulated chat messages ──────────────────────────────────────────────────

const SIMULATED_USERS = [
  { name: 'Luna Sky', avatar: '/api/uploads?path=images/avatars/luna-avatar.jpg' },
  { name: 'Kai Storm', avatar: '/api/uploads?path=images/avatars/kai-avatar.jpg' },
  { name: 'Nova Blaze', avatar: '/api/uploads?path=images/avatars/nova-avatar.jpg' },
  { name: 'Zara Miles', avatar: '/api/uploads?path=images/avatars/zara-avatar.jpg' },
  { name: 'Jay Parker', avatar: '/api/uploads?path=images/avatars/jay-avatar.jpg' },
  { name: 'Maya Chen', avatar: '/api/uploads?path=images/avatars/maya-avatar.jpg' },
  { name: 'Dre Williams', avatar: '/api/uploads?path=images/avatars/dre-avatar.jpg' },
  { name: 'Sarah Kim', avatar: '/api/uploads?path=images/avatars/sarah-avatar.jpg' },
  { name: 'Marcus Rivera', avatar: '/api/uploads?path=images/avatars/marcus-avatar.jpg' },
  { name: 'Elena Rodriguez', avatar: '/api/uploads?path=images/avatars/elena-avatar.jpg' },
  { name: 'Cyber Drifter', avatar: '/api/uploads?path=images/avatars/cyber-avatar.jpg' },
  { name: 'Music Central', avatar: '/api/uploads?path=images/avatars/music-avatar.jpg' },
];

const SIMULATED_MESSAGES = [
  'Hey everyone! 🔥',
  'This is amazing!',
  'Love this stream 💜',
  'First time here!',
  'Can you do a shoutout?',
  'Vibes are immaculate ✨',
  'How long have you been streaming?',
  'That was so cool!',
  '🙌🙌🙌',
  'Love the energy!',
  'You rock!',
  "Let's gooo 🔥🔥",
  'Where are you from?',
  'This made my day',
  'ORRA fam! 💯',
  'yo this is fire',
  'how do I get the badge?',
  'can you follow me back?',
  'the quality is insane',
  'been watching for 20 mins straight',
  'dropped a gift for you 💝',
  'lmao 😂😂',
  'anyone else from Texas?',
  'turn the mic up!',
  'chat is poppin tonight',
  'brb grabbing snacks',
  'this beat goes hard 🎵',
  'youre so real for this',
  'happy to be here 🙏',
];

// ─── Main LiveStreamViewer Component ──────────────────────────────────────────

interface LiveStreamViewerProps {
  open: boolean;
  onClose: () => void;
  streamId: string | null;
}

export function LiveStreamViewer({ open, onClose, streamId }: LiveStreamViewerProps) {
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      user: 'ORRA',
      avatar: '/api/uploads?path=images/orra-logo.png',
      text: 'Welcome to the live stream! 🎉',
      isSystem: true,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showChat, setShowChat] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const heartIdRef = useRef(0);

  // Fetch stream data
  useEffect(() => {
    if (!open || !streamId) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/livestreams?id=${streamId}`, { signal: controller.signal });
        const data = await res.json();
        if (!cancelled && data.success) {
          setStreamData(data.data);
          setViewerCount(data.data.viewerCount || 0);
        }
      } catch {
        if (!cancelled) toast.error('Failed to load stream');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, streamId]);

  // Camera access for host
  useEffect(() => {
    if (!open || !streamData?.isHost) return;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn,
          audio: isMicOn,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera access denied:', err);
        toast.error('Camera access denied');
      }
    }

    startCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [open, streamData?.isHost, isCameraOn, isMicOn]);

  // Simulated chat messages
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      const user = SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)];
      const text = SIMULATED_MESSAGES[Math.floor(Math.random() * SIMULATED_MESSAGES.length)];
      setChatMessages((prev) => [
        ...prev.slice(-50),
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user: user.name,
          avatar: user.avatar,
          text,
        },
      ]);
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [open]);

  // Simulated viewer count changes
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(1, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [open]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Heart animation
  const sendHeart = useCallback(() => {
    const id = heartIdRef.current++;
    const x = 20 + Math.random() * 60;
    setFloatingHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
  }, []);

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return;

    const currentUser = useAuraStore.getState().currentUserProfile;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `my-${Date.now()}`,
        user: currentUser?.name || 'You',
        avatar: currentUser?.avatar || '/api/uploads?path=images/orra-logo.png',
        text: chatInput.trim(),
      },
    ]);
    setChatInput('');
  }, [chatInput]);

  // End stream
  const handleEndStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setShowSaveDialog(true);
  }, []);

  // Save dialog actions
  const handlePostToFeed = useCallback(() => {
    toast.success('Stream posted to your feed!');
    setShowSaveDialog(false);
    onClose();
  }, [onClose]);

  const handleSaveToProfile = useCallback(() => {
    toast.success('Stream saved to your profile!');
    setShowSaveDialog(false);
    onClose();
  }, [onClose]);

  const handleDiscard = useCallback(() => {
    setShowSaveDialog(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Main Stream Area - full screen */}
      <div className="flex-1 relative">
        {/* Camera / Stream Preview */}
        {streamData?.isHost ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
            {isLoading ? (
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Loading stream...</p>
              </div>
            ) : streamData ? (
              <div className="text-center px-4">
                {/* Large streamer avatar */}
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-violet-500/30 mx-auto mb-4 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                  <img
                    src={resolveImageUrl(streamData.creator?.avatar)}
                    alt={streamData.creator?.name || 'Host'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-white text-xl font-bold mb-1">{streamData.title}</h2>
                <p className="text-slate-400 text-sm">{streamData.creator?.name} is live</p>
              </div>
            ) : (
              <div className="text-center px-4">
                <Radio className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">Stream not available</p>
              </div>
            )}
          </div>
        )}

        {/* ── TOP BAR: LIVE badge + viewer + close ── */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 safe-area-top">
          <div className="flex items-center justify-between">
            {/* Left: LIVE badge + viewer count + duration */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-black uppercase tracking-widest">LIVE</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                <Eye className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white text-xs font-medium tabular-nums">{viewerCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white text-xs font-medium tabular-nums">
                  {formatStreamTime(streamData)}
                </span>
              </div>
            </div>

            {/* Right: Close button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 active:scale-95 transition-all"
              aria-label="Close live stream viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Streamer info row */}
          {streamData && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={resolveImageUrl(streamData.creator?.avatar)}
                alt={streamData.creator?.name || 'Host'}
                className="w-10 h-10 rounded-full ring-2 ring-white/20 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm truncate">
                    {streamData.creator?.name || 'Host'}
                  </span>
                  {streamData.creator?.verified && (
                    <BadgeCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20 flex-shrink-0" />
                  )}
                </div>
                <p className="text-white/50 text-xs truncate">{streamData.title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Floating hearts */}
        <div className="absolute bottom-32 right-4 z-20 pointer-events-none">
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute animate-[floatUp_2s_ease-out_forwards]"
              style={{ left: `${heart.x}%`, bottom: 0 }}
            >
              <Heart className="w-8 h-8 text-red-500 fill-red-500 drop-shadow-lg" />
            </div>
          ))}
        </div>

        {/* ── BOTTOM: Action buttons + Chat overlay ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Action buttons on right side */}
          {!showSaveDialog && (
            <div className="absolute right-3 bottom-48 z-20 flex flex-col gap-3 items-center">
              {/* Heart button */}
              <button
                onClick={sendHeart}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/20 active:scale-90 transition-all">
                  <Heart className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-[10px] text-white/70 font-medium">Like</span>
              </button>

              {/* Chat toggle */}
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex flex-col items-center gap-0.5"
              >
                <div className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                  showChat ? 'bg-violet-500/30' : 'bg-black/30 hover:bg-violet-500/20'
                }`}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-white/70 font-medium">Chat</span>
              </button>

              {/* Gift button */}
              <button
                onClick={() => toast.success('Gifts coming soon!')}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-amber-500/20 active:scale-90 transition-all">
                  <Gift className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-[10px] text-white/70 font-medium">Gift</span>
              </button>
            </div>
          )}

          {/* Host controls */}
          {streamData?.isHost && !showSaveDialog && (
            <div className="flex items-center justify-center gap-3 pb-4 px-4">
              <button
                onClick={() => setIsCameraOn((prev) => !prev)}
                className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                  isCameraOn ? 'bg-white/10 text-white' : 'bg-red-500/30 text-red-400'
                }`}
              >
                <Camera className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMicOn((prev) => !prev)}
                className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                  isMicOn ? 'bg-white/10 text-white' : 'bg-red-500/30 text-red-400'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={handleEndStream}
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all active:scale-95"
              >
                End Stream
              </button>
            </div>
          )}

          {/* Chat overlay - Instagram style */}
          {showChat && !showSaveDialog && !streamData?.isHost && (
            <div className="fade-in">
              {/* Chat messages overlay */}
              <div
                className="mx-3 mb-2 max-h-48 overflow-y-auto no-scrollbar space-y-1.5"
                style={{ scrollbarWidth: 'none' }}
              >
                {chatMessages.slice(-8).map((msg) => (
                  <div key={msg.id} className="inline-flex items-start gap-1.5 max-w-[85%]">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 backdrop-blur-sm">
                      <img
                        src={resolveImageUrl(msg.avatar)}
                        alt={msg.user}
                        className="w-5 h-5 rounded-full shrink-0 object-cover bg-violet-500/30"
                        onError={(e) => { const img = e.currentTarget; img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user)}&background=7c3aed&color=fff&size=32&bold=true&font-size=0.4`; }}
                      />
                      <span className={`text-[10px] font-bold ${msg.isSystem ? 'text-violet-400' : 'text-violet-300'} whitespace-nowrap`}>
                        {msg.user}
                      </span>
                      <span className="text-white/80 text-[11px] break-words">{msg.text}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="flex items-center gap-2 px-3 pb-4 pt-2 safe-area-bottom">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Say something..."
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim()}
                    className="p-1.5 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog (after ending stream) */}
      {showSaveDialog && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-violet-500/10">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-violet-600/20 flex items-center justify-center mx-auto mb-3">
                <MonitorUp className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Stream Ended</h3>
              <p className="text-slate-400 text-sm">What would you like to do with your stream?</p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handlePostToFeed}
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all active:scale-[0.98]"
              >
                Post to Feed
              </button>
              <button
                onClick={handleSaveToProfile}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all active:scale-[0.98]"
              >
                Save to Profile
              </button>
              <button
                onClick={handleDiscard}
                className="w-full py-3 px-4 rounded-xl hover:bg-red-500/10 text-red-400 font-semibold text-sm transition-all active:scale-[0.98]"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating heart animation keyframes */}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-80px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-160px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatStreamTime(stream: StreamData | null): string {
  if (!stream) return '00:00';
  const elapsed = Math.floor((Date.now() - new Date(stream.id.slice(0, 8)).getTime()) / 1000);
  if (isNaN(elapsed) || elapsed < 0) return '00:00';
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
