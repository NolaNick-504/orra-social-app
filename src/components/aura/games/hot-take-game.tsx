'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameOverlay,
  GameHeader,
  ActionButton,
  PlayerAvatar,
  HOT_TAKE_CATEGORIES,
  HOT_TAKE_BANK,
} from './game-types';
import type { GameProps } from './game-types';
import { Zap, ThumbsUp, ThumbsDown, Flame, ChevronRight, Star, TrendingUp, ArrowLeft } from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================
type Phase = 'modeSelect' | 'voting' | 'voteResult' | 'submitCategory' | 'submitTake' | 'submitted' | 'results';
type VoteChoice = 'W' | 'L' | null;

interface TakeCard {
  id: string;
  text: string;
  category: string;
  authorName: string;
  authorAvatar: string;
  wVotes: number;
  lVotes: number;
  totalVotes: number;
}

interface SubmittedTake {
  text: string;
  category: string;
  wVotes: number;
  lVotes: number;
}

// ============================================
// GENERATE TAKE CARDS
// ============================================
function generateTakeCards(count: number): TakeCard[] {
  const shuffled = [...HOT_TAKE_BANK].sort(() => Math.random() - 0.5);
  const authorNames = ['sarah_vibes', 'mike_hotakes', 'jenna_uncut', 'alex_raw', 'lily_spice', 'jordan_takes', 'casey_real', 'sam_opinionated'];
  return shuffled.slice(0, count).map((take, i) => ({
    id: `take-${i}-${Date.now()}`,
    text: take.text,
    category: take.category,
    authorName: authorNames[i % authorNames.length],
    authorAvatar: '/images/orra-logo.png',
    wVotes: Math.floor(Math.random() * 60) + 10,
    lVotes: Math.floor(Math.random() * 40) + 5,
    totalVotes: 0,
  }));
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function HotTakeGame({
  onClose,
  currentUser,
  opponent: opponentProp,
  isVsBot,
  gameSessionId,
  tokenReward,
  xpReward,
  callbacks,
  accentColor,
}: GameProps) {
  const [phase, setPhase] = useState<Phase>('modeSelect');
  const [mode, setMode] = useState<'vote' | 'submit' | null>(null);

  // Vote mode state
  const [takeCards, setTakeCards] = useState<TakeCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userVote, setUserVote] = useState<VoteChoice>(null);
  const [voteStreak, setVoteStreak] = useState(0);
  const [votesCast, setVotesCast] = useState(0);
  const [totalTakesToVote] = useState(5);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Vote result state
  const [lastVoteResult, setLastVoteResult] = useState<{
    choice: 'W' | 'L';
    wPercent: number;
    lPercent: number;
    isNuclear: boolean;
    agreed: boolean;
  } | null>(null);

  // Submit mode state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [takeText, setTakeText] = useState('');
  const [submittedTake, setSubmittedTake] = useState<SubmittedTake | null>(null);

  // Results state
  const [isCompleting, setIsCompleting] = useState(false);
  const streakBonusRef = useRef(0);

  const currentCard = takeCards[currentCardIndex];

  // ============================================
  // INITIALIZE VOTE CARDS
  // ============================================
  const startVoteMode = useCallback(() => {
    setMode('vote');
    const cards = generateTakeCards(totalTakesToVote);
    setTakeCards(cards);
    setCurrentCardIndex(0);
    setUserVote(null);
    setVoteStreak(0);
    setVotesCast(0);
    setLastVoteResult(null);
    setPhase('voting');
  }, [totalTakesToVote]);

  // ============================================
  // VOTE HANDLER
  // ============================================
  const handleVote = useCallback((choice: 'W' | 'L') => {
    if (userVote || isAnimating || !currentCard) return;
    setUserVote(choice);
    setIsAnimating(true);
    setSlideDirection(choice === 'W' ? 'right' : 'left');

    // Calculate community response
    const wPercent = Math.round((currentCard.wVotes / (currentCard.wVotes + currentCard.lVotes)) * 100);
    const lPercent = 100 - wPercent;
    const isNuclear = wPercent >= 90 && (currentCard.wVotes + currentCard.lVotes) >= 30;
    const agreed =
      (choice === 'W' && wPercent >= 50) || (choice === 'L' && lPercent >= 50);

    setLastVoteResult({ choice, wPercent, lPercent, isNuclear, agreed });

    // Update streak
    if (agreed) {
      setVoteStreak((prev) => prev + 1);
    } else {
      setVoteStreak(0);
    }

    setVotesCast((prev) => prev + 1);

    // Submit vote to server
    if (gameSessionId) {
      callbacks.submitToServer(currentCardIndex, choice);
      callbacks.submitVote(currentCard.id, choice === 'W' ? 'agree' : 'disagree');
    }

    // Show result after slide animation
    setTimeout(() => {
      setPhase('voteResult');
      setIsAnimating(false);
    }, 600);
  }, [userVote, isAnimating, currentCard, currentCardIndex, gameSessionId, callbacks]);

  // ============================================
  // NEXT CARD
  // ============================================
  const handleNextCard = useCallback(() => {
    if (currentCardIndex + 1 >= totalTakesToVote) {
      setPhase('results');
    } else {
      setCurrentCardIndex((prev) => prev + 1);
      setUserVote(null);
      setLastVoteResult(null);
      setSlideDirection(null);
      setPhase('voting');
    }
  }, [currentCardIndex, totalTakesToVote]);

  // ============================================
  // SUBMIT TAKE
  // ============================================
  const handleSubmitTake = useCallback(() => {
    if (!takeText.trim() || !selectedCategory) return;

    const newTake: SubmittedTake = {
      text: takeText.trim(),
      category: selectedCategory,
      wVotes: 0,
      lVotes: 0,
    };
    setSubmittedTake(newTake);
    setPhase('submitted');

    if (gameSessionId) {
      callbacks.submitToServer(0, takeText.trim());
    }
  }, [takeText, selectedCategory, gameSessionId, callbacks]);

  // Simulate live votes on submitted take
  useEffect(() => {
    if (phase !== 'submitted' || !submittedTake) return;
    const interval = setInterval(() => {
      setSubmittedTake((prev) => {
        if (!prev) return prev;
        const addW = Math.random() > 0.4;
        return {
          ...prev,
          wVotes: prev.wVotes + (addW ? 1 : 0),
          lVotes: prev.lVotes + (addW ? 0 : 1),
        };
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [phase, submittedTake]);

  // ============================================
  // COMPLETE GAME
  // ============================================
  const completeGame = useCallback(() => {
    if (isCompleting) return;
    setIsCompleting(true);

    let earnedTokens = 0;
    let earnedXP = 0;
    let score = 0;

    if (mode === 'vote') {
      // Tokens based on votes cast and streak
      const streakBonus = voteStreak >= 5 ? 5 : 0;
      streakBonusRef.current = streakBonus;
      earnedTokens = votesCast * 2 + streakBonus;
      earnedXP = votesCast * 3 + streakBonus * 2;
      score = votesCast * 10 + voteStreak * 5;
    } else {
      // Submit mode: flat reward for submitting
      earnedTokens = 10;
      earnedXP = 15;
      score = 15;
    }

    // Cap to token reward
    earnedTokens = Math.min(earnedTokens, tokenReward);
    earnedXP = Math.min(earnedXP, xpReward);

    callbacks.earnTokens(earnedTokens, 'hot_take');
    callbacks.addXP(earnedXP);
    callbacks.showToast(
      `+${earnedTokens} ORRA +${earnedXP} XP${streakBonusRef.current > 0 ? ` (incl. ${streakBonusRef.current} streak bonus!)` : ''}`,
      { icon: '🌶️' }
    );
    callbacks.completeGame(score, true);
    // Close the game overlay after collecting rewards
    setTimeout(() => onClose(), 300);
  }, [isCompleting, mode, votesCast, voteStreak, tokenReward, xpReward, callbacks, onClose]);

  // ============================================
  // MODE SELECT PHASE
  // ============================================
  if (phase === 'modeSelect') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-orange-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-orange-600/20 to-yellow-600/20 p-4">
            <GameHeader
              icon="🌶️"
              title="HOT TAKE"
              subtitle="Controversial or facts?"
              onClose={onClose}
            />
          </div>

          <div className="p-4 space-y-4">
            {/* Mode cards */}
            <button
              onClick={startVoteMode}
              className="w-full p-4 rounded-xl bg-gradient-to-br from-orange-600/20 to-yellow-600/10 border-2 border-orange-500/30 hover:border-orange-400/60 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600/40 to-yellow-600/40 flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">Vote on Takes</p>
                  <p className="text-[10px] text-slate-500">Swipe W or L on hot takes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-13">
                <span className="text-[10px] text-amber-400 font-bold">5 takes to vote</span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-emerald-400 font-bold">Streak bonus!</span>
              </div>
            </button>

            <button
              onClick={() => {
                setMode('submit');
                setPhase('submitCategory');
              }}
              className="w-full p-4 rounded-xl bg-gradient-to-br from-red-600/20 to-orange-600/10 border-2 border-red-500/30 hover:border-red-400/60 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/40 to-orange-600/40 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">Drop Your Take</p>
                  <p className="text-[10px] text-slate-500">Submit your own hot take</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-13">
                <span className="text-[10px] text-red-400 font-bold">See live W/L ratio</span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-amber-400 font-bold">+10 ORRA</span>
              </div>
            </button>

            {/* Reward info */}
            <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-white/5">
              <div className="text-center">
                <p className="text-sm font-bold text-amber-400">{tokenReward}</p>
                <p className="text-[9px] text-slate-500">Max ORRA</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <p className="text-sm font-bold text-violet-400">{xpReward}</p>
                <p className="text-[9px] text-slate-500">Max XP</p>
              </div>
            </div>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // VOTING PHASE
  // ============================================
  if (phase === 'voting' && currentCard) {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-orange-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-orange-600/20 to-yellow-600/20 p-4">
            <GameHeader
              icon="🌶️"
              title="HOT TAKE"
              subtitle={`${currentCardIndex + 1}/${totalTakesToVote} • ${currentCard.category}`}
              onClose={onClose}
              rightElement={
                voteStreak >= 2 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {voteStreak}🔥
                  </span>
                ) : undefined
              }
            />
          </div>

          <div className="p-4 space-y-4">
            {/* Take Card */}
            <div
              className={`relative rounded-2xl bg-gradient-to-br from-orange-600/10 to-yellow-600/5 border border-orange-500/20 p-5 min-h-[180px] flex flex-col justify-center transition-all duration-500 ${
                slideDirection === 'right' ? 'translate-x-[120%] rotate-6 opacity-0' :
                slideDirection === 'left' ? '-translate-x-[120%] -rotate-6 opacity-0' :
                'translate-x-0 rotate-0 opacity-100'
              }`}
            >
              <div className="absolute top-2 right-3">
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-[9px] font-bold text-orange-400">
                  {currentCard.category}
                </span>
              </div>
              <p className="text-base font-bold text-white leading-relaxed text-center">
                "{currentCard.text}"
              </p>
              <div className="flex items-center gap-2 mt-4 justify-center">
                <PlayerAvatar src={currentCard.authorAvatar} name={currentCard.authorName} size="sm" ring="ring-orange-400" />
                <span className="text-xs text-slate-500">@{currentCard.authorName}</span>
              </div>
            </div>

            {/* W / L Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleVote('W')}
                disabled={!!userVote}
                className="py-5 rounded-xl bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 border-2 border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-600/40 transition-all flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
              >
                <span className="text-3xl font-black text-emerald-400">W</span>
                <span className="text-[10px] font-bold text-slate-400">AGREE</span>
              </button>
              <button
                onClick={() => handleVote('L')}
                disabled={!!userVote}
                className="py-5 rounded-xl bg-gradient-to-br from-red-600/30 to-red-800/30 border-2 border-red-500/30 hover:border-red-400/60 hover:bg-red-600/40 transition-all flex flex-col items-center gap-1 active:scale-95 disabled:opacity-40"
              >
                <span className="text-3xl font-black text-red-400">L</span>
                <span className="text-[10px] font-bold text-slate-400">DISAGREE</span>
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: totalTakesToVote }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < currentCardIndex ? 'bg-emerald-400' :
                    i === currentCardIndex ? 'bg-orange-400 scale-125' :
                    'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // VOTE RESULT PHASE
  // ============================================
  if (phase === 'voteResult' && lastVoteResult && currentCard) {
    const { wPercent, lPercent, isNuclear, agreed, choice } = lastVoteResult;
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-orange-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-orange-600/20 to-yellow-600/20 p-4">
            <GameHeader
              icon="📊"
              title="COMMUNITY SAYS"
              subtitle={`${currentCardIndex + 1}/${totalTakesToVote}`}
              onClose={onClose}
              rightElement={
                isNuclear ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-[10px] font-bold text-red-400 animate-pulse">
                    ☢️ NUCLEAR
                  </span>
                ) : undefined
              }
            />
          </div>

          <div className="p-4 space-y-4">
            {/* The take */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-xs text-slate-300 text-center italic">"{currentCard.text}"</p>
            </div>

            {/* Your vote indicator */}
            <div className="text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                choice === 'W' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                You voted {choice === 'W' ? 'W ✅' : 'L ❌'}
              </span>
            </div>

            {/* Split bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">W {wPercent}%</span>
                <span className="font-bold text-red-400">{lPercent}% L</span>
              </div>
              <div className="h-4 rounded-full bg-white/10 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out rounded-l-full"
                  style={{ width: `${wPercent}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-out rounded-r-full"
                  style={{ width: `${lPercent}%` }}
                />
              </div>
            </div>

            {/* Agreement text */}
            <div className="text-center">
              {agreed ? (
                <p className="text-xs text-emerald-400 font-medium">
                  {wPercent >= 90 ? '☢️ NUCLEAR TAKE — almost everyone agrees!' :
                   wPercent >= 70 ? '🔥 Strong agreement — you\'re with the majority!' :
                   'You voted with the majority! 👏'}
                </p>
              ) : (
                <p className="text-xs text-amber-400 font-medium">
                  🔥 Controversial! You\'re in the minority on this one
                </p>
              )}
            </div>

            {/* Nuclear badge */}
            {isNuclear && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-center">
                <p className="text-lg">☢️</p>
                <p className="text-xs font-bold text-red-400">NUCLEAR TAKE</p>
                <p className="text-[10px] text-slate-500">90%+ agreement with 30+ votes</p>
              </div>
            )}

            {/* Streak indicator */}
            {voteStreak >= 3 && (
              <div className="flex items-center justify-center gap-2 py-1">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">
                  {voteStreak} streak! {voteStreak >= 5 ? '+5 bonus tokens!' : `${5 - voteStreak} more for bonus`}
                </span>
              </div>
            )}

            <ActionButton onClick={handleNextCard} color="from-orange-600 to-yellow-500">
              {currentCardIndex + 1 >= totalTakesToVote ? (
                <><Star className="w-4 h-4" /> SEE RESULTS</>
              ) : (
                <><ChevronRight className="w-4 h-4" /> NEXT TAKE</>
              )}
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // SUBMIT CATEGORY PHASE
  // ============================================
  if (phase === 'submitCategory') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-orange-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-orange-600/20 to-yellow-600/20 p-4">
            <GameHeader
              icon="🏷️"
              title="PICK A CATEGORY"
              subtitle="What's your take about?"
              onClose={onClose}
            />
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {HOT_TAKE_CATEGORIES.map((cat) => {
                const catIcons: Record<string, string> = {
                  'Food & Drink': '🍕',
                  'Social Media': '📱',
                  'Technology': '💻',
                  'Relationships': '💕',
                  'Pop Culture': '🎤',
                  'Everyday Life': '🏠',
                  'Work & Career': '💼',
                  'Entertainment': '🎬',
                };
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-orange-600/20 border-orange-400/60'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg">{catIcons[cat] || '💬'}</span>
                    <p className={`text-xs font-bold mt-1 ${isSelected ? 'text-orange-300' : 'text-slate-300'}`}>
                      {cat}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPhase('modeSelect')}
                className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold text-xs hover:bg-white/10 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <ActionButton
                onClick={() => setPhase('submitTake')}
                disabled={!selectedCategory}
                color="from-orange-600 to-yellow-500"
              >
                <ChevronRight className="w-4 h-4" /> CONTINUE
              </ActionButton>
            </div>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // SUBMIT TAKE PHASE
  // ============================================
  if (phase === 'submitTake') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-orange-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-orange-600/20 to-yellow-600/20 p-4">
            <GameHeader
              icon="🔥"
              title="DROP YOUR TAKE"
              subtitle={`Category: ${selectedCategory}`}
              onClose={onClose}
            />
          </div>

          <div className="p-4 space-y-3">
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center">
              <p className="text-[10px] text-orange-400 font-bold mb-1">MAKE IT HOT! 🌶️</p>
              <p className="text-[10px] text-slate-500">The more controversial, the more votes you'll get</p>
            </div>

            <div className="relative">
              <textarea
                value={takeText}
                onChange={(e) => setTakeText(e.target.value)}
                placeholder="Pineapple on pizza is..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 resize-none min-h-[100px] leading-relaxed"
                maxLength={150}
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-slate-600">{takeText.length}/150</span>
            </div>

            {/* Hot take tips */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-500 font-bold">PRO TIPS:</p>
              <div className="flex items-start gap-2">
                <span className="text-[10px]">🌶️</span>
                <p className="text-[10px] text-slate-500">Bold claims get more votes</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px]">🔥</span>
                <p className="text-[10px] text-slate-500">Keep it short and punchy</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px]">☢️</span>
                <p className="text-[10px] text-slate-500">Nuclear takes (90%+ agreement) earn bonus tokens</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPhase('submitCategory')}
                className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold text-xs hover:bg-white/10 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <ActionButton
                onClick={handleSubmitTake}
                disabled={!takeText.trim()}
                color="from-red-600 to-orange-500"
              >
                <Flame className="w-4 h-4" /> DROP IT 🔥
              </ActionButton>
            </div>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // SUBMITTED PHASE
  // ============================================
  if (phase === 'submitted' && submittedTake) {
    const totalVotes = submittedTake.wVotes + submittedTake.lVotes;
    const wPct = totalVotes > 0 ? Math.round((submittedTake.wVotes / totalVotes) * 100) : 50;
    const lPct = totalVotes > 0 ? 100 - wPct : 50;
    const isNuclear = wPct >= 90 && totalVotes >= 30;

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-orange-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-orange-600/20 to-yellow-600/20 p-4 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <h2 className="text-lg font-black text-white">YOUR TAKE IS LIVE!</h2>
            <p className="text-xs text-slate-400">Watching the votes roll in...</p>
          </div>

          <div className="p-4 space-y-3">
            {/* Your take */}
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-[9px] font-bold text-orange-400">
                  {submittedTake.category}
                </span>
              </div>
              <p className="text-sm text-white font-medium leading-relaxed">"{submittedTake.text}"</p>
            </div>

            {/* Live W/L ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">W {wPct}%</span>
                <span className="text-[10px] text-slate-500">{totalVotes} votes</span>
                <span className="font-bold text-red-400">{lPct}% L</span>
              </div>
              <div className="h-4 rounded-full bg-white/10 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out rounded-l-full"
                  style={{ width: `${wPct}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700 ease-out rounded-r-full"
                  style={{ width: `${lPct}%` }}
                />
              </div>
            </div>

            {/* Nuclear check */}
            {isNuclear && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-center animate-pulse">
                <p className="text-lg">☢️</p>
                <p className="text-xs font-bold text-red-400">NUCLEAR TAKE!</p>
                <p className="text-[10px] text-slate-500">90%+ W votes — bonus tokens incoming!</p>
              </div>
            )}

            {/* Vote counts */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-black text-emerald-400">{submittedTake.wVotes}</span>
                </div>
                <p className="text-[9px] text-slate-500">W votes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <ThumbsDown className="w-4 h-4 text-red-400" />
                  <span className="text-lg font-black text-red-400">{submittedTake.lVotes}</span>
                </div>
                <p className="text-[9px] text-slate-500">L votes</p>
              </div>
            </div>

            <ActionButton onClick={() => setPhase('results')} color="from-orange-600 to-yellow-500">
              <Star className="w-4 h-4" /> COLLECT REWARDS
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RESULTS PHASE
  // ============================================
  if (phase === 'results') {
    const streakBonus = voteStreak >= 5 ? 5 : 0;
    let earnedTokens = 0;
    let earnedXP = 0;
    let score = 0;

    if (mode === 'vote') {
      earnedTokens = Math.min(votesCast * 2 + streakBonus, tokenReward);
      earnedXP = Math.min(votesCast * 3 + streakBonus * 2, xpReward);
      score = votesCast * 10 + voteStreak * 5;
    } else {
      earnedTokens = 10;
      earnedXP = 15;
      score = 15;
    }

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-orange-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-orange-600/20 to-yellow-600/20 p-5 text-center">
            <div className="text-4xl mb-2">🌶️</div>
            <h2 className="text-xl font-black text-white">
              {mode === 'vote' ? 'VOTING COMPLETE!' : 'TAKE DROPPED!'}
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* Stats */}
            {mode === 'vote' ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-lg font-black text-orange-400">{votesCast}</p>
                  <p className="text-[9px] text-slate-500">Takes Voted</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-lg font-black text-amber-400">{voteStreak}🔥</p>
                  <p className="text-[9px] text-slate-500">Best Streak</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-lg font-black text-emerald-400">{streakBonus > 0 ? `+${streakBonus}` : '—'}</p>
                  <p className="text-[9px] text-slate-500">Streak Bonus</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-lg font-black text-emerald-400">{submittedTake?.wVotes || 0}</p>
                  <p className="text-[9px] text-slate-500">W Votes</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <p className="text-lg font-black text-red-400">{submittedTake?.lVotes || 0}</p>
                  <p className="text-[9px] text-slate-500">L Votes</p>
                </div>
              </div>
            )}

            {/* Reward summary */}
            <div className="flex items-center justify-center gap-6 py-3">
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xl font-black text-amber-400">+{earnedTokens}</span>
                </div>
                <p className="text-[10px] text-slate-500">ORRA Tokens</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Star className="w-4 h-4 text-violet-400" />
                  <span className="text-xl font-black text-violet-400">+{earnedXP}</span>
                </div>
                <p className="text-[10px] text-slate-500">XP Earned</p>
              </div>
            </div>

            {/* Streak bonus callout */}
            {mode === 'vote' && voteStreak >= 5 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-xs font-bold text-amber-400">🔥 5+ VOTE STREAK BONUS!</p>
                <p className="text-[10px] text-slate-500">+5 bonus ORRA tokens for voting consistently</p>
              </div>
            )}

            {mode === 'vote' && voteStreak < 5 && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-[10px] text-slate-400">
                  💡 Vote on 5 takes in a row that match the community to earn a streak bonus!
                </p>
              </div>
            )}

            <ActionButton onClick={completeGame} color="from-orange-600 to-yellow-500">
              <Flame className="w-4 h-4" /> COLLECT & CLOSE
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  return null;
}
