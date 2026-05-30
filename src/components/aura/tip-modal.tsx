'use client';

import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { resolveImageUrl } from '@/lib/utils';
import { X, Coins, Coffee, Pizza, Diamond, Rocket, Crown, Send, Sparkles, Gift } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Gift types with their ORRA token costs and visual config
const GIFT_ITEMS = [
  {
    key: 'coffee',
    label: 'Coffee',
    emoji: '\u2615',
    cost: 10,
    gradient: 'from-amber-600 to-orange-500',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/40',
  },
  {
    key: 'pizza',
    label: 'Pizza',
    emoji: '\uD83C\uDF55',
    cost: 25,
    gradient: 'from-red-600 to-orange-500',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/40',
  },
  {
    key: 'diamond',
    label: 'Diamond',
    emoji: '\uD83D\uDC8E',
    cost: 50,
    gradient: 'from-cyan-500 to-blue-500',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/40',
  },
  {
    key: 'rocket',
    label: 'Rocket',
    emoji: '\uD83D\uDE80',
    cost: 100,
    gradient: 'from-violet-600 to-fuchsia-500',
    bg: 'bg-violet-500/20',
    border: 'border-violet-500/30',
    glow: 'shadow-violet-500/40',
  },
  {
    key: 'crown',
    label: 'Crown',
    emoji: '\uD83D\uDC51',
    cost: 250,
    gradient: 'from-yellow-500 to-amber-500',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/40',
  },
] as const;

interface TipModalProps {
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  postId?: string;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

export function TipModal({ receiverId, receiverName, receiverAvatar, postId, onClose, onSuccess }: TipModalProps) {
  const { auraTokens, setAuraTokens } = useAuraStore();
  const currentUser = useCurrentUser();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate the tip amount based on selected gift or custom
  const tipAmount = selectedGift
    ? GIFT_ITEMS.find(g => g.key === selectedGift)?.cost || 0
    : parseInt(customAmount) || 0;

  const canAfford = tipAmount > 0 && tipAmount <= auraTokens;
  const isCustomMode = !selectedGift;

  const handleSendTip = useCallback(async () => {
    if (!canAfford || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId,
          amount: tipAmount,
          message,
          giftType: selectedGift || 'coins',
          postId: postId || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to send tip');
        return;
      }

      // Update local token balance
      setAuraTokens(data.data.senderBalance);

      // Show celebration
      setShowCelebration(true);
      const giftEmoji = selectedGift
        ? GIFT_ITEMS.find(g => g.key === selectedGift)?.emoji || '\uD83C\uDF81'
        : '\uD83C\uDF81';
      toast.success(`Sent ${giftEmoji} ${tipAmount} ORRA to ${receiverName}!`);

      // Auto-close after celebration
      setTimeout(() => {
        onSuccess?.(tipAmount);
        onClose();
      }, 2000);
    } catch (err) {
      toast.error('Failed to send tip');
    } finally {
      setIsSending(false);
    }
  }, [canAfford, isSending, receiverId, tipAmount, message, selectedGift, postId, receiverName, setAuraTokens, onSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="text-6xl animate-bounce">{selectedGift ? GIFT_ITEMS.find(g => g.key === selectedGift)?.emoji : '\uD83C\uDF81'}</div>
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random() * 2}s`,
                }}
              >
                {['\u2728', '\uD83C\uDF1F', '\uD83D\uDCAB', '\u2728'][i % 4]}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative glass-panel rounded-2xl w-full max-w-sm fade-in border border-violet-500/20 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-violet-600/30 p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Send a Gift</h2>
              <p className="text-xs text-slate-300">Support {receiverName} with ORRA tokens</p>
            </div>
          </div>
        </div>

        {/* Receiver info */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-violet-500/50">
              <img src={resolveImageUrl(receiverAvatar, true)} alt={receiverName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{receiverName}</p>
              <p className="text-[10px] text-slate-500">Creator</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-bold text-yellow-400">{auraTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Gift Selection */}
        <div className="px-5 py-3">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Choose a Gift</p>
          <div className="grid grid-cols-3 gap-2">
            {GIFT_ITEMS.map((gift) => {
              const isSelected = selectedGift === gift.key;
              const canAffordThis = gift.cost <= auraTokens;
              return (
                <button
                  key={gift.key}
                  onClick={() => {
                    setSelectedGift(isSelected ? null : gift.key);
                    setCustomAmount('');
                  }}
                  disabled={!canAffordThis}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? `${gift.bg} ${gift.border} shadow-lg ${gift.glow} scale-105`
                      : canAffordThis
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        : 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl">{gift.emoji}</span>
                  <span className="text-[10px] font-bold text-white">{gift.label}</span>
                  <div className="flex items-center gap-0.5">
                    <Coins className="w-2.5 h-2.5 text-yellow-400" />
                    <span className="text-[9px] font-bold text-yellow-400">{gift.cost}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="px-5 py-2">
          <button
            onClick={() => {
              if (selectedGift) {
                setSelectedGift(null);
              }
            }}
            className={`w-full flex items-center gap-2 p-3 rounded-xl border transition-all ${
              isCustomMode && !selectedGift
                ? 'bg-violet-500/20 border-violet-500/30'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <Coins className={`w-4 h-4 ${isCustomMode ? 'text-violet-400' : 'text-slate-400'}`} />
            <span className={`text-xs font-medium ${isCustomMode ? 'text-violet-300' : 'text-slate-400'}`}>Custom Amount</span>
            {isCustomMode && !selectedGift && (
              <input
                type="number"
                min="1"
                max={auraTokens}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={`1 - ${auraTokens.toLocaleString()}`}
                className="ml-auto w-24 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-violet-500/50 placeholder:text-slate-600"
                autoFocus
              />
            )}
          </button>
        </div>

        {/* Message */}
        <div className="px-5 py-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 100))}
            placeholder="Add a message (optional)"
            maxLength={100}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        {/* Send Button */}
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={handleSendTip}
            disabled={!canAfford || isSending || tipAmount === 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              canAfford && tipAmount > 0
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/30'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send {tipAmount > 0 ? `${tipAmount.toLocaleString()} ORRA` : 'Gift'}</span>
                {selectedGift && (
                  <span className="text-lg">{GIFT_ITEMS.find(g => g.key === selectedGift)?.emoji}</span>
                )}
              </>
            )}
          </button>

          {tipAmount > 0 && !canAfford && (
            <p className="text-[10px] text-red-400 text-center mt-2">
              Not enough ORRA tokens. You need {tipAmount - auraTokens} more.
            </p>
          )}

          <p className="text-[9px] text-slate-600 text-center mt-2">
            Tips are final and non-refundable. The creator receives the full amount.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes particle {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-100px) scale(0.5); }
        }
        .animate-particle {
          animation: particle 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
