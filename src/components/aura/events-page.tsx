'use client';

import {
  Calendar,
  Plus,
  MapPin,
  Video,
  Users,
  Coins,
  Clock,
  CheckCircle2,
  ChevronDown,
  X,
  Loader2,
  Zap,
  Sparkles,
  Globe,
  CalendarDays,
  Tag,
  UserCircle,
} from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventCreator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  location: string;
  isVirtual: boolean;
  meetLink: string;
  category: string;
  startDate: string;
  endDate: string | null;
  maxAttendees: number;
  tokenCost: number;
  isActive: boolean;
  creatorId: string;
  creator: EventCreator;
  rsvpCount: number;
  userRsvpStatus: 'going' | 'interested' | 'maybe' | null;
  createdAt: string;
  updatedAt: string;
}

type RSVPStatus = 'going' | 'interested' | 'maybe';

interface CreateEventForm {
  title: string;
  description: string;
  location: string;
  isVirtual: boolean;
  meetLink: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  maxAttendees: number;
  tokenCost: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '🔥' },
  { key: 'social', label: 'Social', emoji: '🤝' },
  { key: 'music', label: 'Music', emoji: '🎵' },
  { key: 'art', label: 'Art', emoji: '🎨' },
  { key: 'tech', label: 'Tech', emoji: '💻' },
  { key: 'fitness', label: 'Fitness', emoji: '💪' },
  { key: 'party', label: 'Party', emoji: '🎉' },
  { key: 'meetup', label: 'Meetup', emoji: '☕' },
];

const CATEGORY_OPTIONS = [
  { value: 'social', label: 'Social' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' },
  { value: 'tech', label: 'Tech' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'party', label: 'Party' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'other', label: 'Other' },
];

const RSVP_OPTIONS: { key: RSVPStatus; label: string; color: string }[] = [
  { key: 'going', label: 'Going', color: 'text-emerald-400' },
  { key: 'interested', label: 'Interested', color: 'text-amber-400' },
  { key: 'maybe', label: 'Maybe', color: 'text-slate-400' },
];

const GRADIENT_PLACEHOLDERS = [
  'from-violet-600/40 to-fuchsia-600/40',
  'from-teal-600/40 to-cyan-600/40',
  'from-amber-600/40 to-orange-600/40',
  'from-pink-600/40 to-rose-600/40',
  'from-indigo-600/40 to-purple-600/40',
  'from-emerald-600/40 to-green-600/40',
];

const EMPTY_FORM: CreateEventForm = {
  title: '',
  description: '',
  location: '',
  isVirtual: false,
  meetLink: '',
  category: 'social',
  startDate: '',
  startTime: '18:00',
  endDate: '',
  endTime: '',
  maxAttendees: 0,
  tokenCost: 0,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'TBD';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today @ ${timeStr}`;
  if (isTomorrow) return `Tomorrow @ ${timeStr}`;

  const dateStr2 = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${dateStr2} @ ${timeStr}`;
}

function getRelativeDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 0) return 'Started';
  if (diffHours < 1) return 'Starting soon';
  if (diffHours < 24) return `In ${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays}d`;
  return '';
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

function getCategoryEmoji(category: string): string {
  const found = CATEGORIES.find((c) => c.key === category);
  return found ? found.emoji : '📌';
}

function getCategoryBadgeColor(category: string): string {
  const colors: Record<string, string> = {
    social: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    music: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    art: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    tech: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    fitness: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    party: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    meetup: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  return colors[category] || colors.other;
}

function getGradientForIndex(index: number): string {
  return GRADIENT_PLACEHOLDERS[index % GRADIENT_PLACEHOLDERS.length];
}

// ─── Skeleton Components ────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-pulse">
      <div className="h-36 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded-lg bg-white/5" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-2/3 rounded bg-white/5" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-20 rounded bg-white/5" />
          <div className="h-3 w-16 rounded bg-white/5" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5" />
            <div className="h-3 w-16 rounded bg-white/5" />
          </div>
          <div className="h-8 w-20 rounded-lg bg-white/5" />
        </div>
      </div>
    </div>
  );
}

// ─── RSVP Dropdown ──────────────────────────────────────────────────────────

function RSVPDropdown({
  eventId,
  currentStatus,
  onRsvp,
  onCancelRsvp,
  loading,
  tokenCost,
}: {
  eventId: string;
  currentStatus: RSVPStatus | null;
  onRsvp: (eventId: string, status: RSVPStatus) => void;
  onCancelRsvp: (eventId: string) => void;
  loading: boolean;
  tokenCost: number;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Already RSVPed — show status with cancel option
  if (currentStatus) {
    const rsvpOption = RSVP_OPTIONS.find((o) => o.key === currentStatus);
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentStatus === 'going'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : currentStatus === 'interested'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {rsvpOption?.label}
          <ChevronDown className="w-3 h-3" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-30 glass-panel rounded-xl p-1 min-w-[140px] border border-white/10 fade-in">
            {RSVP_OPTIONS.filter((o) => o.key !== currentStatus).map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onRsvp(eventId, option.key);
                  setOpen(false);
                }}
                disabled={loading}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${option.color} hover:bg-white/5 transition-all`}
              >
                {option.label}
              </button>
            ))}
            <button
              onClick={() => {
                onCancelRsvp(eventId);
                setOpen(false);
              }}
              disabled={loading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all"
            >
              Cancel RSVP
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not yet RSVPed — show RSVP button with dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-all disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
        RSVP
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 glass-panel rounded-xl p-1 min-w-[140px] border border-white/10 fade-in">
          {tokenCost > 0 && (
            <div className="px-3 py-1.5 text-[10px] text-amber-400 flex items-center gap-1 border-b border-white/5 mb-1">
              <Coins className="w-3 h-3" />
              Costs {tokenCost} ORRA
            </div>
          )}
          {RSVP_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => {
                onRsvp(eventId, option.key);
                setOpen(false);
              }}
              disabled={loading}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${option.color} hover:bg-white/5 transition-all`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Event Modal ─────────────────────────────────────────────────────

function CreateEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { earnTokens, addXP } = useAuraStore();
  const [form, setForm] = useState<CreateEventForm>({ ...EMPTY_FORM });
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

  const updateField = <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!form.startDate) {
      toast.error('Start date is required');
      return;
    }

    setCreating(true);
    try {
      const startDateISO = form.startTime
        ? new Date(`${form.startDate}T${form.startTime}`).toISOString()
        : new Date(form.startDate).toISOString();

      let endDateISO: string | null = null;
      if (form.endDate) {
        endDateISO = form.endTime
          ? new Date(`${form.endDate}T${form.endTime}`).toISOString()
          : new Date(form.endDate).toISOString();
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.isVirtual ? '' : form.location.trim(),
          isVirtual: form.isVirtual,
          meetLink: form.isVirtual ? form.meetLink.trim() : '',
          category: form.category,
          startDate: startDateISO,
          endDate: endDateISO,
          maxAttendees: form.maxAttendees,
          tokenCost: form.tokenCost,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const tokensEarned = data.data.tokensEarned || 0;
        earnTokens(tokensEarned, 'created an event');
        addXP(5);
        toast.success(`Event created! +${tokensEarned} ORRA +5 XP 🎉`, { duration: 3000 });
        onCreated();
        onClose();
      } else {
        toast.error(data.error || 'Failed to create event');
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
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Create Event</h2>
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
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Give your event a name"
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="What's this event about?"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          {/* Virtual toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                {form.isVirtual ? <Video className="w-3.5 h-3.5 text-teal-400" /> : <MapPin className="w-3.5 h-3.5 text-violet-400" />}
                {form.isVirtual ? 'Virtual Event' : 'Location'}
              </label>
              <button
                onClick={() => updateField('isVirtual', !form.isVirtual)}
                className={`relative w-10 h-5 rounded-full transition-all ${
                  form.isVirtual ? 'bg-teal-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    form.isVirtual ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            {form.isVirtual ? (
              <input
                type="text"
                value={form.meetLink}
                onChange={(e) => updateField('meetLink', e.target.value)}
                placeholder="Meeting link (Zoom, Google Meet, etc.)"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
              />
            ) : (
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Event location"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
              />
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => updateField('category', cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.category === cat.value
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {getCategoryEmoji(cat.value)} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Start Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Start Time
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* End Date/Time (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                min={form.startDate || undefined}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Max Attendees & Token Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Max Attendees
              </label>
              <input
                type="number"
                value={form.maxAttendees}
                onChange={(e) => updateField('maxAttendees', Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                placeholder="0 = unlimited"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Token Cost
              </label>
              <input
                type="number"
                value={form.tokenCost}
                onChange={(e) => updateField('tokenCost', Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                placeholder="0 = free"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating || !form.title.trim() || !form.startDate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-violet"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Event
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Event Card ─────────────────────────────────────────────────────────────

function EventCard({
  event,
  index,
  onRsvp,
  onCancelRsvp,
  rsvpLoadingId,
}: {
  event: EventItem;
  index: number;
  onRsvp: (eventId: string, status: RSVPStatus) => void;
  onCancelRsvp: (eventId: string) => void;
  rsvpLoadingId: string | null;
}) {
  const coverImage = event.coverImage ? resolveImageUrl(event.coverImage) : null;
  const relativeLabel = getRelativeDateLabel(event.startDate);
  const isPast = new Date(event.startDate) < new Date();

  return (
    <div className={`glass-panel rounded-2xl overflow-hidden group transition-all hover:border-violet-500/20 ${isPast ? 'opacity-60' : ''}`}>
      {/* Cover Image or Gradient Placeholder */}
      <div className="relative h-36 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradientForIndex(index)} flex items-center justify-center`}>
            <Calendar className="w-12 h-12 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Relative date badge */}
        {relativeLabel && !isPast && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
            {relativeLabel}
          </div>
        )}
        {isPast && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] font-bold text-slate-400 border border-white/10">
            Ended
          </div>
        )}

        {/* Category badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-sm ${getCategoryBadgeColor(event.category)}`}>
          {getCategoryEmoji(event.category)} {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
        </div>

        {/* Virtual badge */}
        {event.isVirtual && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-teal-500/20 backdrop-blur-sm text-[10px] font-bold text-teal-300 border border-teal-500/30 flex items-center gap-1">
            <Globe className="w-3 h-3" /> Virtual
          </div>
        )}

        {/* Token cost badge */}
        {event.tokenCost > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-amber-500/20 backdrop-blur-sm text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Coins className="w-3 h-3" /> {event.tokenCost}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-white text-sm mb-1 leading-snug">{event.title}</h3>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            {truncateText(event.description, 120)}
          </p>
        )}

        {/* Date/Time */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-2">
          <Clock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span>{formatEventDate(event.startDate)}</span>
          {event.endDate && (
            <>
              <span className="text-slate-500">→</span>
              <span>{formatEventDate(event.endDate)}</span>
            </>
          )}
        </div>

        {/* Location */}
        {!event.isVirtual && event.location && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
            <MapPin className="w-3.5 h-3.5 text-fuchsia-400 flex-shrink-0" />
            <span className="truncate">{truncateText(event.location, 50)}</span>
          </div>
        )}

        {/* Attendees count */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Users className="w-3.5 h-3.5" />
          <span>
            {event.rsvpCount} {event.rsvpCount === 1 ? 'attendee' : 'attendees'}
            {event.maxAttendees > 0 && ` / ${event.maxAttendees} max`}
          </span>
          {event.tokenCost > 0 && (
            <span className="ml-auto flex items-center gap-1 text-amber-400">
              <Coins className="w-3 h-3" /> {event.tokenCost} ORRA
            </span>
          )}
          {event.tokenCost === 0 && (
            <span className="ml-auto text-emerald-400 text-[10px] font-bold">FREE</span>
          )}
        </div>

        {/* Creator + RSVP row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
              <img
                src={resolveImageUrl(event.creator.avatar)}
                alt={event.creator.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-slate-400 truncate">
              {event.creator.name}
            </span>
          </div>

          <RSVPDropdown
            eventId={event.id}
            currentStatus={event.userRsvpStatus}
            onRsvp={onRsvp}
            onCancelRsvp={onCancelRsvp}
            loading={rsvpLoadingId === event.id}
            tokenCost={event.tokenCost}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyEventsState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
        <CalendarDays className="w-8 h-8 text-violet-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No Events Yet</h3>
      <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
        Be the first to create an event and bring the community together!
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all glow-violet"
      >
        <Plus className="w-4 h-4" />
        Create Event
      </button>
    </div>
  );
}

// ─── Main Events Page ───────────────────────────────────────────────────────

export function EventsPage() {
  const { auraTokens, currentUserId, earnTokens, addXP } = useAuraStore();

  // Data state
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activeCategory, setActiveCategory] = useState('all');

  // Create event modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // RSVP loading state
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      params.set('limit', '50');

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.events || []);
      } else {
        setError(data.error || 'Failed to load events');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle RSVP
  const handleRsvp = async (eventId: string, status: RSVPStatus) => {
    setRsvpLoadingId(eventId);
    try {
      const res = await fetch('/api/events/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, status }),
      });
      const data = await res.json();

      if (data.success) {
        const tokensEarned = data.data.tokensEarned || 0;
        if (tokensEarned > 0) {
          earnTokens(tokensEarned, `RSVPed ${status} to an event`);
          addXP(3);
        }

        // Update the event locally
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  userRsvpStatus: status,
                  rsvpCount: e.userRsvpStatus ? e.rsvpCount : e.rsvpCount + 1,
                }
              : e
          )
        );

        toast.success(
          `You're ${status}!${tokensEarned > 0 ? ` +${tokensEarned} ORRA +3 XP` : ''}`,
          { duration: 2500 }
        );

        // Update local token balance if returned
        if (data.data.newTokenBalance !== undefined) {
          useAuraStore.getState().setAuraTokens(data.data.newTokenBalance);
        }
      } else {
        toast.error(data.error || 'Failed to RSVP');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setRsvpLoadingId(null);
    }
  };

  // Handle cancel RSVP
  const handleCancelRsvp = async (eventId: string) => {
    setRsvpLoadingId(eventId);
    try {
      const res = await fetch('/api/events/rsvps', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();

      if (data.success) {
        const tokenRefund = data.data.tokenRefund || 0;

        // Update the event locally
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  userRsvpStatus: null,
                  rsvpCount: Math.max(0, e.rsvpCount - 1),
                }
              : e
          )
        );

        toast.success(
          `RSVP cancelled${tokenRefund > 0 ? `. ${tokenRefund} ORRA refunded` : ''}`,
          { duration: 2500 }
        );

        // Update local token balance if refund was given
        if (tokenRefund > 0) {
          // Refetch events to get updated balance
          fetchEvents();
        }
      } else {
        toast.error(data.error || 'Failed to cancel RSVP');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setRsvpLoadingId(null);
    }
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Events</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3" />
            {auraTokens.toLocaleString()}
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all glow-violet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* ─── Category Filter Pills ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === cat.key
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── Loading State ─── */}
      {loading && (
        <div className="space-y-3">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      )}

      {/* ─── Error State ─── */}
      {error && !loading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchEvents}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300 transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* ─── Events List ─── */}
      {!loading && !error && events.length > 0 && (
        <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5 custom-scrollbar">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              index={index}
              onRsvp={handleRsvp}
              onCancelRsvp={handleCancelRsvp}
              rsvpLoadingId={rsvpLoadingId}
            />
          ))}
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!loading && !error && events.length === 0 && (
        <EmptyEventsState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {/* ─── Create Event Modal ─── */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchEvents}
        />
      )}
    </div>
  );
}
