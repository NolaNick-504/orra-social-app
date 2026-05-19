'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Reaction types with their emoji, label, and color
export const REACTION_TYPES = [
  { key: 'heart', emoji: '❤️', label: 'Like', color: 'text-red-400', bg: 'bg-red-500/20', ring: 'ring-red-500/40' },
  { key: 'wow', emoji: '😮', label: 'Wow', color: 'text-amber-400', bg: 'bg-amber-500/20', ring: 'ring-amber-500/40' },
  { key: 'omg', emoji: '😱', label: 'OMG', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', ring: 'ring-fuchsia-500/40' },
  { key: 'wtf', emoji: '🤯', label: 'WTF', color: 'text-orange-400', bg: 'bg-orange-500/20', ring: 'ring-orange-500/40' },
  { key: 'laugh', emoji: '😂', label: 'Haha', color: 'text-yellow-400', bg: 'bg-yellow-500/20', ring: 'ring-yellow-500/40' },
  { key: 'sad', emoji: '😢', label: 'Sad', color: 'text-blue-400', bg: 'bg-blue-500/20', ring: 'ring-blue-500/40' },
] as const;

export type ReactionKey = typeof REACTION_TYPES[number]['key'];

// Get reaction display data by key
export function getReactionDisplay(key: string) {
  return REACTION_TYPES.find(r => r.key === key) || REACTION_TYPES[0];
}

// Reaction Picker Popup — appears on long-press
interface ReactionPickerPopupProps {
  onSelect: (reaction: string) => void;
  currentReaction?: string | null;
  onClose: () => void;
}

function ReactionPickerPopup({ onSelect, currentReaction, onClose }: ReactionPickerPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay listener to avoid the same press that opened the popup
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-1 p-1.5 rounded-2xl glass-panel border border-white/10 shadow-xl shadow-black/40 reaction-picker-popup"
      onClick={(e) => e.stopPropagation()}
    >
      {REACTION_TYPES.map((reaction, i) => {
        const isActive = currentReaction === reaction.key;
        return (
          <button
            key={reaction.key}
            onClick={() => {
              onSelect(reaction.key);
              onClose();
            }}
            className={`
              relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
              hover:scale-125 hover:-translate-y-1 active:scale-95
              ${isActive ? `${reaction.bg} ring-1 ${reaction.ring}` : 'hover:bg-white/10'}
            `}
            style={{
              animationDelay: `${i * 30}ms`,
              animation: 'reaction-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
            title={reaction.label}
          >
            <span className="text-xl leading-none select-none">{reaction.emoji}</span>
            {isActive && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Main Reaction Button — handles tap (default heart) and long-press (shows picker)
// Works for both posts and comments via targetType prop
interface ReactionButtonProps {
  postId: string;
  isLiked: boolean;
  currentReaction?: string | null;
  onReact: (postId: string, reaction: string) => void;
  onUnreact: (postId: string) => void;
  className?: string;
  targetType?: 'post' | 'comment'; // Used for compact display in comments
  compact?: boolean; // Smaller size for comment rows
}

export function ReactionButton({
  postId,
  isLiked,
  currentReaction,
  onReact,
  onUnreact,
  className = '',
  targetType = 'post',
  compact = false,
}: ReactionButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const [burstEmoji, setBurstEmoji] = useState<string | null>(null);

  const reaction = currentReaction ? getReactionDisplay(currentReaction) : REACTION_TYPES[0];

  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowPicker(true);
      // Haptic feedback if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(10);
      }
    }, 400); // 400ms to trigger long-press
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isLongPress.current) return; // Long press was handled, don't toggle

    // Short tap — toggle default heart reaction
    if (isLiked && currentReaction === 'heart') {
      onUnreact(postId);
    } else {
      onReact(postId, 'heart');
      setBurstEmoji('❤️');
      setTimeout(() => setBurstEmoji(null), 600);
    }
  }, [isLiked, currentReaction, onReact, onUnreact, postId]);

  const handleReactionSelect = useCallback((reactionKey: string) => {
    if (isLiked && currentReaction === reactionKey) {
      // Same reaction — unlike
      onUnreact(postId);
    } else {
      // New or different reaction
      onReact(postId, reactionKey);
      const emoji = getReactionDisplay(reactionKey).emoji;
      setBurstEmoji(emoji);
      setTimeout(() => setBurstEmoji(null), 600);
    }
  }, [isLiked, currentReaction, onReact, onUnreact, postId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Reaction picker popup */}
      {showPicker && (
        <ReactionPickerPopup
          onSelect={handleReactionSelect}
          currentReaction={currentReaction}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Emoji burst animation */}
      {burstEmoji && (
        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none`}>
          <span
            className={`${compact ? 'text-lg' : 'text-2xl'} block reaction-burst-anim`}
            style={{ animation: 'reaction-burst 0.6s ease-out forwards' }}
          >
            {burstEmoji}
          </span>
        </div>
      )}

      {/* The button */}
      <button
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={() => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }}
        onTouchStart={handlePressStart}
        onTouchEnd={(e) => {
          e.preventDefault(); // Prevent duplicate mouse events on mobile
          handlePressEnd();
        }}
        onTouchCancel={() => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }}
        className={`flex items-center gap-1 group transition-all ${
          compact
            ? 'py-0.5 px-1.5 rounded-md hover:bg-white/5'
            : 'flex-1 justify-center py-1.5 rounded-lg hover:bg-white/5'
        }`}
      >
        <span className={`${compact ? 'text-[14px]' : 'text-[18px]'} leading-none transition-all ${isLiked ? 'scale-110' : 'group-hover:scale-110'}`}>
          {isLiked ? reaction.emoji : '🤍'}
        </span>
        {!compact && (
          <span className={`text-xs ${isLiked ? reaction.color : 'text-slate-400'}`}>
            {isLiked ? reaction.label : 'Like'}
          </span>
        )}
      </button>
    </div>
  );
}

// Reaction summary display — shows emoji counts below a post
interface ReactionSummaryProps {
  reactionSummary: Record<string, number>;
  className?: string;
  compact?: boolean; // Smaller size for comments
}

export function ReactionSummary({ reactionSummary, className = '', compact = false }: ReactionSummaryProps) {
  // Filter out zero/empty reactions and sort by count (descending)
  const activeReactions = REACTION_TYPES
    .filter(r => (reactionSummary[r.key] || 0) > 0)
    .sort((a, b) => (reactionSummary[b.key] || 0) - (reactionSummary[a.key] || 0));

  if (activeReactions.length === 0) return null;

  const totalReactions = Object.values(reactionSummary).reduce((a, b) => a + b, 0);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Emoji row */}
      <div className="flex -space-x-0.5">
        {activeReactions.slice(0, compact ? 2 : 3).map((r) => (
          <span key={r.key} className={`${compact ? 'text-[10px]' : 'text-xs'} leading-none`}>{r.emoji}</span>
        ))}
      </div>
      {/* Total count */}
      <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} text-slate-500`}>{totalReactions}</span>
    </div>
  );
}
