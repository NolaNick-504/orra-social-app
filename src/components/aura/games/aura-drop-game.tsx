'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameOverlay,
  GameHeader,
  ActionButton,
  ProgressBar,
  AURA_DROP_ITEMS,
  RARITY_COLORS,
  RARITY_BG,
} from './game-types';
import type { GameProps } from './game-types';
import { useAuraStore } from '@/store/aura-store';
import { Coins, Crown, Package, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';

// ============================================
// DROP SCHEDULE DATA
// ============================================
interface DropScheduleItem {
  id: string;
  name: string;
  icon: string;
  startOffset: number; // seconds from now
  legendaryCount: number;
  totalAvailable: number;
  color: string;
}

const DROP_SCHEDULE: DropScheduleItem[] = [
  { id: 'drop-1', name: 'Crown Collection', icon: '👑', startOffset: 0, legendaryCount: 3, totalAvailable: 50, color: 'from-yellow-600 to-amber-400' },
  { id: 'drop-2', name: 'Neon Nights', icon: '⚡', startOffset: 60, legendaryCount: 2, totalAvailable: 40, color: 'from-green-500 to-emerald-400' },
  { id: 'drop-3', name: 'Diamond Rush', icon: '💎', startOffset: 120, legendaryCount: 1, totalAvailable: 30, color: 'from-cyan-500 to-blue-400' },
];

// Rarity determination based on claim speed (ms)
function determineRarity(reactionTimeMs: number, legendaryRemaining: number): 'legendary' | 'epic' | 'rare' | 'common' {
  if (reactionTimeMs < 800 && legendaryRemaining > 0) return 'legendary';
  if (reactionTimeMs < 2000) return 'epic';
  if (reactionTimeMs < 3500) return 'rare';
  return 'common';
}

function getItemForRarity(rarity: string) {
  const matches = AURA_DROP_ITEMS.filter(i => i.rarity === rarity);
  if (matches.length === 0) return AURA_DROP_ITEMS[AURA_DROP_ITEMS.length - 1];
  return matches[Math.floor(Math.random() * matches.length)];
}

// ============================================
// AURA DROP GAME COMPONENT
// ============================================
type Phase = 'lobby' | 'countdown' | 'claim' | 'reveal' | 'collection' | 'results';

interface ClaimedItem {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  color: string;
  reactionTimeMs: number;
}

export default function AuraDropGame({
  onClose,
  currentUser,
  opponent,
  isVsBot,
  gameSessionId,
  tokenReward,
  xpReward,
  callbacks,
  accentColor,
}: GameProps) {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [currentDropIndex, setCurrentDropIndex] = useState(0);
  const [countdownNum, setCountdownNum] = useState(3);
  const [claimWindowTimer, setClaimWindowTimer] = useState(5);
  const [claimedItems, setClaimedItems] = useState<ClaimedItem[]>([]);
  const [currentClaim, setCurrentClaim] = useState<ClaimedItem | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [tokensSpent, setTokensSpent] = useState(0);
  const [legendaryRemaining, setLegendaryRemaining] = useState(3);
  const [isClaiming, setIsClaiming] = useState(false);
  const [dropLiveTimestamp, setDropLiveTimestamp] = useState<number>(0);
  const [hasClaimedThisDrop, setHasClaimedThisDrop] = useState(false);

  const isCompleting = useRef(false);
  const { auraTokens } = useAuraStore();

  const currentDrop = DROP_SCHEDULE[currentDropIndex];

  // ============================================
  // START DROP - Enter countdown
  // ============================================
  const startDrop = useCallback(() => {
    const cost = 10;
    // Check if user has enough tokens before deducting
    if (auraTokens < cost) {
      callbacks.showToast('Not enough ORRA tokens! You need 10 ORRA to enter.', { icon: '❌' });
      return;
    }
    callbacks.earnTokens(-cost, 'aura_drop_entry');
    setTokensSpent(prev => prev + cost);
    setCountdownNum(3);
    setClaimWindowTimer(5);
    setIsCardFlipped(false);
    setCurrentClaim(null);
    setHasClaimedThisDrop(false);
    setIsClaiming(false);
    setLegendaryRemaining(currentDrop.legendaryCount);
    setPhase('countdown');
  }, [tokensSpent, currentDrop, callbacks, auraTokens]);

  // Countdown effect: 3...2...1...
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownNum <= 0) {
      const t = setTimeout(() => {
        setPhase('claim');
        setDropLiveTimestamp(Date.now());
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdownNum(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownNum]);

  // Claim window timer
  useEffect(() => {
    if (phase !== 'claim') return;
    if (claimWindowTimer <= 0) {
      // Time's up - move to results with what we have
      if (!hasClaimedThisDrop) {
        callbacks.showToast('Drop expired! Too slow 😢', { icon: '⏰' });
      }
      setTimeout(() => {
        if (claimedItems.length > 0 || hasClaimedThisDrop) {
          setPhase('collection');
        } else {
          setPhase('results');
        }
      }, 500);
      return;
    }
    const t = setTimeout(() => setClaimWindowTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, claimWindowTimer, hasClaimedThisDrop, claimedItems.length]);

  // ============================================
  // CLAIM ACTION
  // ============================================
  const handleClaim = useCallback(() => {
    if (isClaiming || hasClaimedThisDrop) return;
    setIsClaiming(true);
    setHasClaimedThisDrop(true);

    const reactionTimeMs = Date.now() - dropLiveTimestamp;
    const rarity = determineRarity(reactionTimeMs, legendaryRemaining);

    if (rarity === 'legendary') {
      setLegendaryRemaining(prev => Math.max(0, prev - 1));
    }

    const item = getItemForRarity(rarity);
    const claimed: ClaimedItem = {
      id: `item-${Date.now()}`,
      name: item.name,
      icon: item.icon,
      rarity: item.rarity,
      color: item.color,
      reactionTimeMs,
    };

    setCurrentClaim(claimed);
    callbacks.submitToServer(1, `claimed_${item.rarity}:${item.name}`, isVsBot);

    // Card flip after short delay
    setTimeout(() => {
      setIsCardFlipped(true);
    }, 300);

    // Add to collection after reveal
    setTimeout(() => {
      setClaimedItems(prev => [...prev, claimed]);

      // Award tokens based on rarity
      const rarityRewards: Record<string, number> = { legendary: 50, epic: 25, rare: 10, common: 5 };
      const reward = rarityRewards[rarity] || 5;
      callbacks.earnTokens(reward, `aura_drop_claim_${rarity}`);
      callbacks.addXP(rarity === 'legendary' ? 30 : rarity === 'epic' ? 20 : 10);
      callbacks.showToast(`${rarity.toUpperCase()} drop! +${reward} ORRA`, { icon: item.icon });

      // Move to collection view
      setTimeout(() => setPhase('collection'), 1500);
    }, 1800);
  }, [isClaiming, hasClaimedThisDrop, dropLiveTimestamp, legendaryRemaining, isVsBot, callbacks]);

  // ============================================
  // NEXT DROP / FINISH
  // ============================================
  const handleNextDrop = useCallback(() => {
    const nextIndex = currentDropIndex + 1;
    if (nextIndex >= DROP_SCHEDULE.length) {
      setPhase('results');
    } else {
      setCurrentDropIndex(nextIndex);
      setPhase('lobby');
    }
  }, [currentDropIndex]);

  const handleFinish = useCallback(() => {
    if (isCompleting.current) return;
    isCompleting.current = true;

    const totalTokensEarned = claimedItems.reduce((sum, item) => {
      const rewards: Record<string, number> = { legendary: 50, epic: 25, rare: 10, common: 5 };
      return sum + (rewards[item.rarity] || 5);
    }, 0);
    const netTokens = totalTokensEarned - tokensSpent;
    const hasLegendary = claimedItems.some(i => i.rarity === 'legendary');
    const score = claimedItems.reduce((sum, item) => {
      const pts: Record<string, number> = { legendary: 100, epic: 60, rare: 30, common: 10 };
      return sum + (pts[item.rarity] || 10);
    }, 0);

    callbacks.completeGame(score, hasLegendary);
    // Close the game overlay after collecting rewards
    setTimeout(() => onClose(), 300);
  }, [claimedItems, tokensSpent, callbacks, onClose]);

  // ============================================
  // LOBBY PHASE
  // ============================================
  if (phase === 'lobby') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-yellow-500/30 overflow-hidden">
          <GameHeader
            icon="👑"
            title="Aura Drop"
            subtitle="Limited-time exclusive drops"
            onClose={onClose}
            rightElement={
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                <Coins className="w-3.5 h-3.5" />
                {10}
              </span>
            }
          />

          {/* Current drop hero */}
          <div className={`relative mx-4 rounded-xl overflow-hidden bg-gradient-to-br ${currentDrop.color} p-4 mb-3`}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative text-center">
              <span className="text-5xl block mb-2 drop-shadow-lg">{currentDrop.icon}</span>
              <h3 className="text-lg font-black text-white drop-shadow">{currentDrop.name}</h3>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/30 text-yellow-200 text-[10px] font-bold border border-yellow-500/40">
                  👑 {currentDrop.legendaryCount} Legendary
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white/80 text-[10px] font-bold">
                  {currentDrop.totalAvailable} total
                </span>
              </div>
            </div>
          </div>

          {/* Drop schedule */}
          <div className="px-4 mb-3">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Drop Schedule</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
              {DROP_SCHEDULE.map((drop, i) => (
                <div
                  key={drop.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    i === currentDropIndex
                      ? 'bg-yellow-500/10 border border-yellow-500/20'
                      : 'bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="text-lg">{drop.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${i === currentDropIndex ? 'text-yellow-300' : 'text-white'}`}>
                      {drop.name}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {i === currentDropIndex ? 'LIVE NOW' : i < currentDropIndex ? 'ENDED' : `Starts in ${drop.startOffset - currentDrop.startOffset}s`}
                    </p>
                  </div>
                  {i === currentDropIndex && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/30 text-red-300 animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FOMO banner */}
          <div className="mx-4 mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-[10px] text-red-300 font-medium">
              Only {currentDrop.legendaryCount} Legendary versions available! First to claim gets the rarest drop!
            </p>
          </div>

          {/* Cost & claim button */}
          <div className="px-4 pb-4">
            <ActionButton onClick={startDrop} color="from-yellow-600 to-amber-500">
              <Coins className="w-4 h-4" />
              Enter Drop — 10 ORRA
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // COUNTDOWN PHASE: 3...2...1...
  // ============================================
  if (phase === 'countdown') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-yellow-500/30 overflow-hidden">
          <GameHeader icon="👑" title="Aura Drop" subtitle="Get ready..." onClose={onClose} />

          <div className="flex flex-col items-center justify-center py-12">
            {/* Pulsing countdown number */}
            <div
              key={countdownNum}
              className="relative"
              style={{ animation: 'pulse 0.5s ease-out' }}
            >
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentDrop.color} flex items-center justify-center shadow-2xl`}>
                <span className="text-7xl font-black text-white drop-shadow-lg" key={countdownNum}>
                  {countdownNum > 0 ? countdownNum : 'GO!'}
                </span>
              </div>
              {/* Glow ring */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentDrop.color} opacity-40 animate-ping`} />
            </div>

            <p className="text-sm text-slate-400 mt-6 font-medium">
              {countdownNum > 0 ? 'Drop going live in...' : 'CLAIM NOW!'}
            </p>
            <p className="text-[10px] text-yellow-400 mt-1">
              👑 {legendaryRemaining} Legendary left
            </p>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // CLAIM PHASE
  // ============================================
  if (phase === 'claim') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-yellow-500/30 overflow-hidden">
          <GameHeader icon="👑" title="Aura Drop" subtitle="CLAIM NOW!" onClose={onClose} />

          {/* Timer bar */}
          <div className="px-4 mb-4">
            <ProgressBar
              value={claimWindowTimer}
              max={5}
              color="from-yellow-500 to-amber-400"
              isLow={claimWindowTimer <= 2}
            />
          </div>

          {/* Drop item preview */}
          <div className={`relative mx-4 rounded-xl overflow-hidden bg-gradient-to-br ${currentDrop.color} p-6 mb-4`}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative text-center">
              <span className="text-6xl block mb-3 drop-shadow-lg animate-bounce">{currentDrop.icon}</span>
              <h3 className="text-xl font-black text-white drop-shadow">{currentDrop.name}</h3>
              <p className="text-xs text-white/70 mt-1">Tap CLAIM as fast as possible!</p>
            </div>
          </div>

          {/* Rarity availability */}
          <div className="px-4 mb-4">
            <div className="grid grid-cols-4 gap-2">
              {(['legendary', 'epic', 'rare', 'common'] as const).map(rarity => (
                <div key={rarity} className={`rounded-lg p-2 text-center border ${RARITY_BG[rarity]}`}>
                  <p className={`text-[10px] font-bold ${RARITY_COLORS[rarity]} uppercase`}>{rarity.slice(0, 4)}</p>
                  <p className="text-xs text-white font-bold">
                    {rarity === 'legendary' ? legendaryRemaining : '∞'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Claim button */}
          <div className="px-4 pb-4">
            {hasClaimedThisDrop ? (
              <div className="w-full py-3 rounded-xl bg-white/10 text-center">
                <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-1 animate-spin" />
                <p className="text-sm text-yellow-300 font-bold">Claimed! Revealing...</p>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-yellow-500/30 animate-pulse"
              >
                👆 CLAIM NOW!
              </button>
            )}
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // REVEAL PHASE (card flip)
  // ============================================
  if (phase === 'reveal' || (phase === 'collection' && currentClaim && !isCardFlipped)) {
    const item = currentClaim;
    if (!item) {
      setPhase('collection');
      return null;
    }

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-yellow-500/30 overflow-hidden">
          <GameHeader icon="👑" title="Aura Drop" subtitle="Your drop revealed!" onClose={onClose} />

          <div className="flex flex-col items-center py-8 px-4">
            {/* Card flip container */}
            <div className="perspective-1000 w-48 h-64 mb-6">
              <div
                className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                  isCardFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Card back */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${currentDrop.color} flex items-center justify-center backface-hidden shadow-2xl`}>
                  <div className="text-center">
                    <span className="text-5xl">❓</span>
                    <p className="text-white font-bold mt-2">???</p>
                  </div>
                </div>
                {/* Card front */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center backface-hidden rotate-y-180 shadow-2xl border-2 ${
                  item.rarity === 'legendary' ? 'border-yellow-400' : item.rarity === 'epic' ? 'border-purple-400' : item.rarity === 'rare' ? 'border-blue-400' : 'border-slate-400'
                }`}>
                  <div className="text-center">
                    <span className="text-5xl block mb-2">{item.icon}</span>
                    <p className="text-white font-black text-sm">{item.name}</p>
                    <p className={`text-xs font-bold mt-1 uppercase ${RARITY_COLORS[item.rarity]}`}>
                      {item.rarity}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rarity label */}
            {isCardFlipped && (
              <div className="text-center fade-in">
                <div className={`inline-block px-4 py-1.5 rounded-full border ${RARITY_BG[item.rarity]} mb-2`}>
                  <span className={`text-sm font-black uppercase ${RARITY_COLORS[item.rarity]}`}>
                    {item.rarity === 'legendary' ? '👑 LEGENDARY!' : item.rarity === 'epic' ? '💜 EPIC!' : item.rarity === 'rare' ? '💙 RARE!' : '🩶 COMMON'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Claimed in {(item.reactionTimeMs / 1000).toFixed(2)}s
                </p>
              </div>
            )}
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // COLLECTION PHASE
  // ============================================
  if (phase === 'collection') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-yellow-500/30 overflow-hidden">
          <GameHeader icon="👑" title="Aura Drop" subtitle="Your collection" onClose={onClose} />

          {/* Collection grid */}
          <div className="px-4 mb-4">
            {claimedItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No items claimed yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                {claimedItems.map(item => (
                  <div
                    key={item.id}
                    className={`rounded-xl p-3 text-center border ${RARITY_BG[item.rarity]} transition-all hover:scale-105`}
                  >
                    <span className="text-3xl block mb-1">{item.icon}</span>
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className={`text-[9px] font-bold uppercase ${RARITY_COLORS[item.rarity]}`}>
                      {item.rarity}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="px-4 mb-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-bold text-white">{claimedItems.length}</p>
                <p className="text-[9px] text-slate-500">Items</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-bold text-yellow-400">
                  {claimedItems.filter(i => i.rarity === 'legendary').length}
                </p>
                <p className="text-[9px] text-slate-500">Legendary</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-bold text-amber-400">{tokensSpent}</p>
                <p className="text-[9px] text-slate-500">ORRA Spent</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-4 space-y-2">
            {currentDropIndex < DROP_SCHEDULE.length - 1 ? (
              <>
                <ActionButton onClick={handleNextDrop} color="from-yellow-600 to-amber-500">
                  Next Drop <ChevronRight className="w-4 h-4" />
                </ActionButton>
                <button
                  onClick={() => setPhase('results')}
                  className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  View Results
                </button>
              </>
            ) : (
              <ActionButton onClick={() => setPhase('results')} color="from-yellow-600 to-amber-500">
                View Results <ChevronRight className="w-4 h-4" />
              </ActionButton>
            )}
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RESULTS PHASE
  // ============================================
  if (phase === 'results') {
    const totalTokensEarned = claimedItems.reduce((sum, item) => {
      const rewards: Record<string, number> = { legendary: 50, epic: 25, rare: 10, common: 5 };
      return sum + (rewards[item.rarity] || 5);
    }, 0);
    const netTokens = totalTokensEarned - tokensSpent;
    const rarityBreakdown = {
      legendary: claimedItems.filter(i => i.rarity === 'legendary').length,
      epic: claimedItems.filter(i => i.rarity === 'epic').length,
      rare: claimedItems.filter(i => i.rarity === 'rare').length,
      common: claimedItems.filter(i => i.rarity === 'common').length,
    };

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-yellow-500/30 overflow-hidden">
          <GameHeader icon="👑" title="Aura Drop" subtitle="Session complete!" onClose={onClose} />

          <div className="px-4 py-4">
            {/* Summary hero */}
            <div className="text-center mb-4">
              <span className="text-5xl block mb-2">
                {claimedItems.some(i => i.rarity === 'legendary') ? '👑' : claimedItems.length > 0 ? '✨' : '💨'}
              </span>
              <h3 className="text-xl font-black text-white">
                {claimedItems.some(i => i.rarity === 'legendary')
                  ? 'Legendary Drop!'
                  : claimedItems.length > 0
                  ? 'Nice Haul!'
                  : 'Better Luck Next Time!'}
              </h3>
            </div>

            {/* Rarity breakdown */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(['legendary', 'epic', 'rare', 'common'] as const).map(rarity => (
                <div key={rarity} className={`rounded-lg p-2 text-center border ${RARITY_BG[rarity]}`}>
                  <p className={`text-lg font-black ${RARITY_COLORS[rarity]}`}>{rarityBreakdown[rarity]}</p>
                  <p className={`text-[8px] font-bold uppercase ${RARITY_COLORS[rarity]}`}>{rarity}</p>
                </div>
              ))}
            </div>

            {/* Token summary */}
            <div className="rounded-xl bg-white/5 p-3 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Tokens Earned</span>
                <span className="text-sm font-bold text-emerald-400">+{totalTokensEarned}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Tokens Spent</span>
                <span className="text-sm font-bold text-red-400">-{tokensSpent}</span>
              </div>
              <div className="border-t border-white/10 pt-1 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-bold">Net</span>
                  <span className={`text-sm font-black ${netTokens >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {netTokens >= 0 ? '+' : ''}{netTokens} ORRA
                  </span>
                </div>
              </div>
            </div>

            {/* Items claimed */}
            {claimedItems.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Items Claimed</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {claimedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className={`text-[9px] font-bold uppercase ${RARITY_COLORS[item.rarity]}`}>{item.rarity}</p>
                      </div>
                      <span className="text-[9px] text-slate-500">{(item.reactionTimeMs / 1000).toFixed(2)}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Finish button */}
            <ActionButton onClick={handleFinish} color="from-yellow-600 to-amber-500">
              <Crown className="w-4 h-4" />
              Collect & Exit
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  return null;
}
