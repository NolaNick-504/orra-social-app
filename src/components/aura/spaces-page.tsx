'use client';

import {
  Headphones,
  Plus,
  Mic,
  MicOff,
  Hand,
  Users,
  Loader2,
  X,
  Radio,
  MessageCircle,
  Volume2,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SpaceUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

interface SpaceSpeaker {
  id: string;
  userId: string;
  isMuted: boolean;
  joinedAt: string;
  user: SpaceUser;
}

interface SpaceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  isActive: boolean;
  isRecording: boolean;
  maxSpeakers: number;
  listenerCount: number;
  hostId: string;
  host: SpaceUser;
  speakers: SpaceSpeaker[];
  speakerCount: number;
  totalListenerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateSpaceForm {
  title: string;
  description: string;
  category: string;
  maxSpeakers: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SPACE_CATEGORIES = [
  { key: 'all', label: 'All', color: 'from-violet-600 to-fuchsia-600' },
  { key: 'chill', label: 'Chill', color: 'from-teal-500 to-cyan-500' },
  { key: 'music', label: 'Music', color: 'from-fuchsia-500 to-pink-500' },
  { key: 'debate', label: 'Debate', color: 'from-red-500 to-orange-500' },
  { key: 'ama', label: 'AMA', color: 'from-amber-500 to-yellow-500' },
  { key: 'gaming', label: 'Gaming', color: 'from-emerald-500 to-green-500' },
  { key: 'creative', label: 'Creative', color: 'from-violet-500 to-purple-500' },
  { key: 'tech', label: 'Tech', color: 'from-blue-500 to-indigo-500' },
];

const CATEGORY_BADGE_STYLES: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  chill: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30', accent: 'border-l-teal-500' },
  music: { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300', border: 'border-fuchsia-500/30', accent: 'border-l-fuchsia-500' },
  debate: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30', accent: 'border-l-red-500' },
  ama: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', accent: 'border-l-amber-500' },
  gaming: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', accent: 'border-l-emerald-500' },
  creative: { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30', accent: 'border-l-violet-500' },
  tech: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30', accent: 'border-l-cyan-500' },
};

const CATEGORY_SELECTOR_OPTIONS = [
  { value: 'chill', label: 'Chill', emoji: '☕' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'debate', label: 'Debate', emoji: '🔥' },
  { value: 'ama', label: 'AMA', emoji: '💬' },
  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'tech', label: 'Tech', emoji: '💻' },
];

const EMPTY_FORM: CreateSpaceForm = {
  title: '',
  description: '',
  category: 'chill',
  maxSpeakers: 5,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCategoryStyle(category: string) {
  return CATEGORY_BADGE_STYLES[category] || CATEGORY_BADGE_STYLES.chill;
}

function getCategoryEmoji(category: string): string {
  const found = CATEGORY_SELECTOR_OPTIONS.find((c) => c.value === category);
  return found ? found.emoji : '🎧';
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SpaceCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-2 h-full min-h-[80px] rounded-full bg-white/5" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded-lg bg-white/5" />
          <div className="h-3 w-full rounded bg-white/5" />
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-white/5" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-14 rounded bg-white/5" />
              <div className="h-3 w-14 rounded bg-white/5" />
            </div>
            <div className="h-8 w-20 rounded-xl bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Space Modal ─────────────────────────────────────────────────────

function CreateSpaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { earnTokens, addXP } = useAuraStore();
  const [form, setForm] = useState<CreateSpaceForm>({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Space title is required');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          maxSpeakers: form.maxSpeakers,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const tokensEarned = data.data.tokensEarned || 2;
        earnTokens(tokensEarned, 'started a Space');
        addXP(5);
        toast.success(`Space is live! +${tokensEarned} ORRA +5 XP 🎙️`, { duration: 3000 });

        if (data.data.newTokenBalance !== undefined) {
          useAuraStore.getState().setAuraTokens(data.data.newTokenBalance);
        }

        onCreated();
        onClose();
      } else {
        toast.error(data.error || 'Failed to create space');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div
        ref={modalRef}
        className="relative glass-panel rounded-2xl p-6 w-full max-w-lg fade-in border border-violet-500/20 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Start a Space</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="What do you want to talk about?"
              maxLength={200}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Give people a reason to join..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_SELECTOR_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.category === cat.value
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Speakers Slider */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Max Speakers
              </span>
              <span className="text-violet-400 font-bold">{form.maxSpeakers}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={form.maxSpeakers}
              onChange={(e) => setForm((p) => ({ ...p, maxSpeakers: parseInt(e.target.value) }))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
                [&::-webkit-slider-thumb]:from-violet-500 [&::-webkit-slider-thumb]:to-fuchsia-500
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/30
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating || !form.title.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-violet"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Going Live...
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                Go Live
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Space Detail View (joined space) ───────────────────────────────────────

function SpaceDetailView({
  space,
  onLeave,
  currentUserId,
}: {
  space: SpaceItem;
  onLeave: () => void;
  currentUserId: string | null;
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [muting, setMuting] = useState(false);
  const [raisingHand, setRaisingHand] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Determine if current user is a speaker
  useEffect(() => {
    if (currentUserId && space.speakers) {
      const speakerFound = space.speakers.some((s) => s.userId === currentUserId);
      setIsSpeaker(speakerFound);
    }
  }, [currentUserId, space.speakers]);

  // Check if user is the host
  const isHost = currentUserId === space.hostId;

  const catStyle = getCategoryStyle(space.category);

  const handleMuteToggle = async () => {
    if (!isSpeaker) return;
    setMuting(true);
    try {
      const res = await fetch('/api/spaces/speakers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id, isMuted: !isMuted }),
      });
      const data = await res.json();
      if (data.success) {
        setIsMuted(!isMuted);
        toast.success(isMuted ? 'Unmuted' : 'Muted', { duration: 1500 });
      } else {
        toast.error(data.error || 'Failed to toggle mic');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setMuting(false);
    }
  };

  const handleRaiseHand = async () => {
    if (isSpeaker) return;
    setRaisingHand(true);
    try {
      const res = await fetch('/api/spaces/speakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.action === 'hand_raised') {
          setHandRaised(true);
          toast.success('Hand raised! The host can now promote you.', { duration: 2500 });
        } else if (data.data.action === 'promoted_to_speaker') {
          setIsSpeaker(true);
          toast.success('You are now a speaker! 🎙️', { duration: 2500 });
        }
      } else {
        toast.error(data.error || 'Failed to raise hand');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setRaisingHand(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const res = await fetch('/api/spaces/join', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Left the space', { duration: 1500 });
        onLeave();
      } else {
        toast.error(data.error || 'Failed to leave space');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="fade-in space-y-4">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate">{space.title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={catStyle.text}>{getCategoryEmoji(space.category)} {space.category}</span>
            {space.isRecording && (
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                REC
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Host info */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-violet-500/50">
              <img
                src={resolveImageUrl(space.host.avatar)}
                alt={space.host.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              HOST
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{space.host.name}</p>
            <p className="text-xs text-slate-400">@{space.host.handle}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Headphones className="w-3.5 h-3.5 text-violet-400" />
            <span>{space.listenerCount + space.speakerCount} listening</span>
          </div>
        </div>

        {space.description && (
          <p className="text-sm text-slate-300 leading-relaxed">{space.description}</p>
        )}
      </div>

      {/* Speaker Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-violet-400" />
            Speakers ({space.speakers.length}/{space.maxSpeakers})
          </h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {space.speakers.map((speaker) => {
            const isThisHost = speaker.userId === space.hostId;
            const isMe = speaker.userId === currentUserId;
            return (
              <div key={speaker.id} className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full overflow-hidden ${
                    isThisHost ? 'ring-2 ring-violet-500/70' : 'ring-1 ring-white/10'
                  }`}>
                    <img
                      src={resolveImageUrl(speaker.user.avatar)}
                      alt={speaker.user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Mute indicator */}
                  {speaker.isMuted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                      <MicOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {!speaker.isMuted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500/80 flex items-center justify-center">
                      <Mic className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {/* Host badge */}
                  {isThisHost && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md text-[7px] font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white whitespace-nowrap">
                      HOST
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white font-medium truncate max-w-[64px] text-center">
                  {isMe ? 'You' : speaker.user.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Listener count bar */}
      <div className="glass-panel rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {space.listenerCount} listener{space.listenerCount !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-slate-500">
            {space.speakerCount + space.listenerCount} total
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
            style={{ width: `${Math.min(100, ((space.speakerCount) / Math.max(1, space.maxSpeakers)) * 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          {space.speakerCount}/{space.maxSpeakers} speaker slots used
        </p>
      </div>

      {/* Controls */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        {/* Speaker controls */}
        {isSpeaker && (
          <div className="flex items-center justify-center">
            <button
              onClick={handleMuteToggle}
              disabled={muting}
              className={`flex items-center justify-center w-16 h-16 rounded-full transition-all ${
                isMuted
                  ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400'
                  : 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400'
              } ${muting ? 'opacity-40' : 'hover:scale-105'}`}
            >
              {muting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
          </div>
        )}

        {/* Raise Hand (listener only) */}
        {!isSpeaker && (
          <button
            onClick={handleRaiseHand}
            disabled={raisingHand || handRaised}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              handRaised
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-white/5 text-violet-300 border border-violet-500/30 hover:bg-violet-500/10'
            } disabled:opacity-40`}
          >
            {raisingHand ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : handRaised ? (
              <>
                <Hand className="w-4 h-4 animate-bounce" />
                Hand Raised ✋
              </>
            ) : (
              <>
                <Hand className="w-4 h-4" />
                Raise Hand
              </>
            )}
          </button>
        )}

        {/* Chat placeholder */}
        <div className="glass-panel rounded-xl p-4 text-center border border-white/5">
          <MessageCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Space chat coming soon</p>
        </div>

        {/* Leave Space */}
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm hover:bg-red-500/20 transition-all disabled:opacity-40"
        >
          {leaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <X className="w-4 h-4" />
              Leave Space
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Space Card ─────────────────────────────────────────────────────────────

function SpaceCard({
  space,
  currentUserId,
  onJoin,
  joiningId,
}: {
  space: SpaceItem;
  currentUserId: string | null;
  onJoin: (spaceId: string) => void;
  joiningId: string | null;
}) {
  const catStyle = getCategoryStyle(space.category);
  const isJoining = joiningId === space.id;

  // Limit speaker avatars to 5
  const visibleSpeakers = space.speakers.slice(0, 5);
  const extraSpeakerCount = Math.max(0, space.speakers.length - 5);

  return (
    <div className={`glass-panel rounded-2xl overflow-hidden group transition-all hover:border-violet-500/20 border-l-4 ${catStyle.accent}`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${SPACE_CATEGORIES.find(c => c.key === space.category)?.color || 'from-violet-600 to-fuchsia-600'}`} />

      <div className="p-4 space-y-3">
        {/* Title + Recording indicator */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-white text-sm leading-snug flex-1">{space.title}</h3>
          {space.isRecording && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              REC
            </span>
          )}
        </div>

        {/* Description */}
        {space.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{space.description}</p>
        )}

        {/* Host row */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-violet-500/40">
              <img
                src={resolveImageUrl(space.host.avatar)}
                alt={space.host.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -top-1 -right-2 px-1 py-0.5 rounded text-[7px] font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              HOST
            </span>
          </div>
          <span className="text-xs text-slate-300 font-medium truncate">{space.host.name}</span>
          <span className={`ml-auto px-2 py-0.5 rounded-md text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
            {getCategoryEmoji(space.category)} {space.category}
          </span>
        </div>

        {/* Speaker avatars (overlapping row) */}
        {visibleSpeakers.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {visibleSpeakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-[#0a0a12] relative"
                  title={speaker.user.name}
                >
                  <img
                    src={resolveImageUrl(speaker.user.avatar)}
                    alt={speaker.user.name}
                    className="w-full h-full object-cover"
                  />
                  {speaker.isMuted && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <MicOff className="w-3 h-3 text-red-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {extraSpeakerCount > 0 && (
              <span className="ml-2 text-[10px] text-slate-400 font-medium">
                +{extraSpeakerCount} more
              </span>
            )}
          </div>
        )}

        {/* Stats + Join button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-violet-400" />
              {space.listenerCount}
            </span>
            <span className="flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              {space.speakerCount}/{space.maxSpeakers}
            </span>
          </div>

          <button
            onClick={() => onJoin(space.id)}
            disabled={isJoining}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all glow-violet disabled:opacity-40"
          >
            {isJoining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Headphones className="w-3.5 h-3.5" />
            )}
            Join
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptySpacesState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
        <Headphones className="w-8 h-8 text-violet-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No Active Spaces</h3>
      <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
        Start a Space and bring the community together for a live audio conversation!
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all glow-violet"
      >
        <Plus className="w-4 h-4" />
        Start a Space
      </button>
    </div>
  );
}

// ─── Main Spaces Page ───────────────────────────────────────────────────────

export function SpacesPage() {
  const { auraTokens, currentUserId, earnTokens, addXP } = useAuraStore();

  // Data state
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activeCategory, setActiveCategory] = useState('all');

  // Active space (detail view)
  const [activeSpace, setActiveSpace] = useState<SpaceItem | null>(null);

  // Create space modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Join loading
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Fetch spaces
  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      params.set('limit', '50');

      const res = await fetch(`/api/spaces?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSpaces(data.data.spaces || []);
      } else {
        setError(data.error || 'Failed to load spaces');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // Auto-refresh spaces every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeSpace) fetchSpaces();
    }, 15000);
    return () => clearInterval(interval);
  }, [activeSpace, fetchSpaces]);

  // Handle join
  const handleJoin = async (spaceId: string) => {
    setJoiningId(spaceId);
    try {
      const res = await fetch('/api/spaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId }),
      });
      const data = await res.json();

      if (data.success) {
        const tokensAwarded = data.data.tokensAwarded || 0;
        if (tokensAwarded > 0) {
          earnTokens(tokensAwarded, 'joined a Space');
          addXP(2);
        }

        if (data.data.newTokenBalance !== undefined) {
          useAuraStore.getState().setAuraTokens(data.data.newTokenBalance);
        }

        // Find the space and set it as active
        const space = spaces.find((s) => s.id === spaceId);
        if (space) {
          setActiveSpace(space);
        }

        toast.success(
          `Joined the Space!${tokensAwarded > 0 ? ` +${tokensAwarded} ORRA +2 XP` : ''}`,
          { duration: 2500 }
        );
      } else {
        toast.error(data.error || 'Failed to join space');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  // Handle leave
  const handleLeaveSpace = () => {
    setActiveSpace(null);
    fetchSpaces(); // Refresh list
  };

  // ─── Space Detail View ───
  if (activeSpace) {
    return (
      <div className="fade-in space-y-4 pb-4">
        <SpaceDetailView
          space={activeSpace}
          onLeave={handleLeaveSpace}
          currentUserId={currentUserId}
        />
      </div>
    );
  }

  // ─── Spaces List View ───
  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Spaces</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3" />
            {auraTokens.toLocaleString()}
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all glow-violet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start a Space</span>
            <span className="sm:hidden">Start</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {SPACE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === cat.key
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            {cat.key === 'all' ? '🔥' : getCategoryEmoji(cat.key)} {cat.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          <SpaceCardSkeleton />
          <SpaceCardSkeleton />
          <SpaceCardSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchSpaces}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300 transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* Spaces List */}
      {!loading && !error && spaces.length > 0 && (
        <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5 custom-scrollbar">
          {spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              currentUserId={currentUserId}
              onJoin={handleJoin}
              joiningId={joiningId}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && spaces.length === 0 && (
        <EmptySpacesState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {/* Create Space Modal */}
      {showCreateModal && (
        <CreateSpaceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchSpaces}
        />
      )}
    </div>
  );
}
