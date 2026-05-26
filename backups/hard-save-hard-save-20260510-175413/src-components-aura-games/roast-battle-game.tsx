'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameOverlay,
  GameHeader,
  ScoreDisplay,
  ProgressBar,
  ActionButton,
  PlayerAvatar,
} from './game-types';
import type { GameProps, OpponentData } from './game-types';
import { Flame, Swords, Sparkles, Crown, ChevronRight, Star, Zap } from 'lucide-react';

// ============================================
// ROUND CONFIG
// ============================================
const ROUNDS = [
  { label: 'LIGHT HEAT', sub: 'Roast their profile pic', intensity: '🔥', pointValue: 10, target: 'avatar' as const },
  { label: 'MEDIUM RARE', sub: 'Roast their bio', intensity: '🔥🔥', pointValue: 10, target: 'bio' as const },
  { label: 'WELL DONE', sub: 'Roast their WHOLE vibe', intensity: '🔥🔥🔥', pointValue: 20, target: 'both' as const },
];

const BOT_ROASTS = [
  "Your profile pic looks like it was taken on a potato 🥔",
  "Your bio reads like a ransom note - nobody's claiming you 😂",
  "Your whole vibe screams 'I peaked in middle school' 📉",
];

const ROAST_ASSISTS: Record<number, string[]> = {
  0: [
    "Your profile pic looks like a...",
    "That angle says a lot about you...",
    "Who told you that was a good photo?",
    "I've seen better profile pics on a...",
  ],
  1: [
    "Your bio reads like...",
    "Who wrote your bio? Because...",
    "That bio is giving...",
    "I read your bio and now I know why...",
  ],
  2: [
    "Your whole vibe is giving...",
    "If your vibe was a song it'd be...",
    "Everything about you screams...",
    "You walk into a room and everyone thinks...",
  ],
};

// ============================================
// TYPE DEFINITIONS
// ============================================
type Phase = 'intro' | 'playing' | 'reveal' | 'voting' | 'roundResult' | 'bestMoments' | 'final';

interface RoundResult {
  p1Roast: string;
  p2Roast: string;
  winner: 'p1' | 'p2' | 'tie';
  p1Votes: number;
  p2Votes: number;
  pointValue: number;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function RoastBattleGame({
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
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Input, setP1Input] = useState('');
  const [p2Input, setP2Input] = useState('');
  const [p1Submitted, setP1Submitted] = useState(false);
  const [p2Submitted, setP2Submitted] = useState(false);
  const [timer, setTimer] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [userVote, setUserVote] = useState<'p1' | 'p2' | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [showAssist, setShowAssist] = useState(false);
  const [assistIndex, setAssistIndex] = useState(0);
  const [reactionEmojis, setReactionEmojis] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentRound = ROUNDS[roundIndex];
  const opponent: OpponentData = opponentProp || {
    id: 'bot',
    name: isVsBot ? 'Guest Bot' : 'Opponent',
    avatar: '/images/orra-logo.png',
    bio: 'No bio set — probably too cool for one 😎',
  };

  // Track whether timer has fired the end event
  const timerEndedRef = useRef(false);

  // ============================================
  // TIMER — handles countdown and end-of-timer logic
  // ============================================
  useEffect(() => {
    if (!timerActive) return;
    timerEndedRef.current = false;
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // When timer reaches 0 during playing phase, trigger end logic
  // Using setTimeout to avoid synchronous setState in effect
  useEffect(() => {
    if (timer === 0 && timerActive && phase === 'playing') {
      setTimeout(() => {
        setTimerActive(false);
        timerEndedRef.current = true;
        setP1Input((prev) => prev.trim() || '(ran out of time 😬)');
        setP2Input((prev) => prev.trim() || '(ran out of time 😬)');
        setP1Submitted(true);
        setP2Submitted(true);
        setTimeout(() => setPhase('reveal'), 500);
      }, 0);
    }
  }, [timer, timerActive, phase]);

  // ============================================
  // HANDLE TIMER END
  // ============================================
  const handleTimerEnd = useCallback(() => {
    setP1Input((prev) => prev.trim() || '(ran out of time 😬)');
    setP2Input((prev) => prev.trim() || '(ran out of time 😬)');
    setP1Submitted(true);
    setP2Submitted(true);
    setTimeout(() => setPhase('reveal'), 500);
  }, []);

  // ============================================
  // BOT RESPONSE
  // ============================================
  useEffect(() => {
    if (!isVsBot || phase !== 'playing' || p2Submitted) return;
    const delay = 3000 + Math.random() * 4000;
    botTimeoutRef.current = setTimeout(() => {
      const roast = BOT_ROASTS[roundIndex % BOT_ROASTS.length];
      setP2Input(roast);
      setP2Submitted(true);
      if (gameSessionId) {
        callbacks.submitToServer(roundIndex, roast, true);
      }
    }, delay);
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [isVsBot, phase, p2Submitted, roundIndex, gameSessionId]);

  // Both submitted → go to reveal (scheduled outside effect)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const checkBothSubmitted = useCallback(() => {
    if (phase === 'playing' && p1Submitted && p2Submitted) {
      setTimerActive(false);
      revealTimeoutRef.current = setTimeout(() => setPhase('reveal'), 800);
    }
  }, [phase, p1Submitted, p2Submitted]);

  // ============================================
  // START ROUND
  // ============================================
  const startRound = useCallback(() => {
    setP1Input('');
    setP2Input('');
    setP1Submitted(false);
    setP2Submitted(false);
    setTimer(30);
    setTimerActive(true);
    setUserVote(null);
    setShowAssist(false);
    setAssistIndex(0);
    setReactionEmojis([]);
    setPhase('playing');
  }, []);

  // ============================================
  // SUBMIT P1 ROAST
  // ============================================
  const handleSubmitP1 = useCallback(() => {
    if (p1Submitted || !p1Input.trim()) return;
    setP1Submitted(true);
    if (gameSessionId) {
      callbacks.submitToServer(roundIndex, p1Input);
    }
    // Check if both submitted after setting P1
    if (p2Submitted) {
      setTimerActive(false);
      revealTimeoutRef.current = setTimeout(() => setPhase('reveal'), 800);
    }
  }, [p1Submitted, p1Input, gameSessionId, roundIndex, callbacks, p2Submitted]);

  // ============================================
  // VOTE
  // ============================================
  const handleVote = useCallback((vote: 'p1' | 'p2') => {
    if (userVote) return;
    setUserVote(vote);
    const votedForId = vote === 'p1' ? currentUser.id : opponent.id;
    callbacks.submitVote(votedForId, 'pick');

    // Add reaction
    const emojis = ['🔥', '💀', '😂', '👑', '⚡', '🎯'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setReactionEmojis((prev) => [...prev.slice(-4), randomEmoji]);
  }, [userVote, currentUser.id, opponent.id, callbacks]);

  // Move from reveal to voting
  useEffect(() => {
    if (phase === 'reveal') {
      const t = setTimeout(() => setPhase('voting'), 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // ============================================
  // NEXT ROUND / END
  // ============================================
  const handleNextRound = useCallback(() => {
    const p1Votes = userVote === 'p1' ? 1 : 0;
    const p2Votes = userVote === 'p2' ? 1 : 0;
    // Simulate some audience votes for flavor
    const simP1 = p1Votes + Math.floor(Math.random() * 5) + 1;
    const simP2 = p2Votes + Math.floor(Math.random() * 5) + 1;
    const winner: 'p1' | 'p2' | 'tie' = simP1 >= simP2 ? 'p1' : 'p2';
    const pts = currentRound.pointValue;

    const result: RoundResult = {
      p1Roast: p1Input || '(no roast)',
      p2Roast: p2Input || '(no roast)',
      winner,
      p1Votes: simP1,
      p2Votes: simP2,
      pointValue: pts,
    };
    setRoundResults((prev) => [...prev, result]);

    const newP1 = p1Score + (winner === 'p1' ? pts : 0);
    const newP2 = p2Score + (winner === 'p2' ? pts : 0);
    setP1Score(newP1);
    setP2Score(newP2);

    if (roundIndex + 1 >= 3) {
      setPhase('bestMoments');
    } else {
      setRoundIndex(roundIndex + 1);
      setPhase('roundResult');
    }
  }, [userVote, currentRound, p1Input, p2Input, p1Score, p2Score, roundIndex]);

  // ============================================
  // COMPLETE GAME
  // ============================================
  const completeGame = useCallback(() => {
    if (isCompleting) return;
    setIsCompleting(true);

    const isWinner = p1Score >= p2Score;
    const earnedTokens = isWinner ? tokenReward : Math.floor(tokenReward / 3);
    const earnedXP = isWinner ? xpReward : Math.floor(xpReward / 3);

    callbacks.earnTokens(earnedTokens, 'roast_battle');
    callbacks.addXP(earnedXP);
    callbacks.showToast(
      isWinner
        ? `You won the roast battle! +${earnedTokens} ORRA +${earnedXP} XP`
        : `Good battle! +${earnedTokens} ORRA +${earnedXP} XP`,
      { icon: isWinner ? '🏆' : '👏' }
    );
    callbacks.completeGame(p1Score, isWinner);
    // Close the game overlay after collecting rewards
    setTimeout(() => onClose(), 300);
  }, [isCompleting, p1Score, p2Score, tokenReward, xpReward, callbacks, onClose]);

  // ============================================
  // ROAST ASSIST
  // ============================================
  const handleRoastAssist = useCallback(() => {
    setShowAssist(true);
    const assists = ROAST_ASSISTS[roundIndex] || ROAST_ASSISTS[0];
    setAssistIndex(Math.floor(Math.random() * assists.length));
  }, [roundIndex]);

  // ============================================
  // INTRO PHASE
  // ============================================
  if (phase === 'intro') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-red-500/30 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-red-600/20 to-orange-600/20 p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-orange-900/10" />
            <GameHeader
              icon="🔥"
              title="ROAST BATTLE"
              subtitle="3 rounds of pure fire"
              onClose={onClose}
              rightElement={<ScoreDisplay p1Score={0} p2Score={0} />}
            />
          </div>

          <div className="p-4 space-y-4">
            {/* Opponent Preview */}
            <div className="text-center">
              <p className="text-[10px] text-red-400 font-bold tracking-widest mb-3">YOUR TARGET</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="lg" ring="ring-red-400" />
                  <p className="text-xs font-bold text-white mt-2">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500">ROASTER</p>
                </div>
                <div className="flex flex-col items-center">
                  <Swords className="w-6 h-6 text-red-400" />
                  <span className="text-[10px] text-red-400 font-bold mt-1">VS</span>
                </div>
                <div className="text-center">
                  <PlayerAvatar src={opponent.avatar} name={opponent.name} size="lg" ring="ring-orange-400" />
                  <p className="text-xs font-bold text-white mt-2">{opponent.name}</p>
                  <p className="text-[10px] text-slate-500">TARGET</p>
                </div>
              </div>
            </div>

            {/* Round Preview */}
            <div className="space-y-2">
              {ROUNDS.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/30 to-orange-600/30 flex items-center justify-center text-xs font-black text-red-400">
                    R{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">{r.label} {r.intensity}</p>
                    <p className="text-[10px] text-slate-500">{r.sub}</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400">{r.pointValue} pts</span>
                </div>
              ))}
            </div>

            {/* Reward info */}
            <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-white/5">
              <div className="text-center">
                <p className="text-sm font-bold text-amber-400">{tokenReward}</p>
                <p className="text-[9px] text-slate-500">Winner ORRA</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <p className="text-sm font-bold text-violet-400">{xpReward}</p>
                <p className="text-[9px] text-slate-500">XP</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <p className="text-sm font-bold text-red-400">3</p>
                <p className="text-[9px] text-slate-500">Rounds</p>
              </div>
            </div>

            <ActionButton onClick={startRound} color="from-red-600 to-orange-500">
              <Flame className="w-4 h-4" /> START BATTLE
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // PLAYING PHASE
  // ============================================
  if (phase === 'playing') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-red-500/30 overflow-hidden">
          {/* Round Header */}
          <div className="relative bg-gradient-to-r from-red-600/20 to-orange-600/20 p-4">
            <GameHeader
              icon={currentRound.intensity}
              title={`R${roundIndex + 1}: ${currentRound.label}`}
              subtitle={currentRound.sub}
              onClose={onClose}
              rightElement={<ScoreDisplay p1Score={p1Score} p2Score={p2Score} />}
            />
            <div className="mt-2">
              <ProgressBar value={timer} max={30} color="from-red-500 to-orange-500" isLow={timer <= 5} />
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Target Material */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] text-red-400 font-bold tracking-widest mb-2">ROAST MATERIAL</p>
              {(currentRound.target === 'avatar' || currentRound.target === 'both') && (
                <div className="flex items-center gap-3 mb-2">
                  <PlayerAvatar src={opponent.avatar} name={opponent.name} size="md" ring="ring-orange-400" />
                  <div>
                    <p className="text-xs font-bold text-white">{opponent.name}</p>
                    <p className="text-[10px] text-slate-500">{opponent.handle || '@opponent'}</p>
                  </div>
                </div>
              )}
              {(currentRound.target === 'bio' || currentRound.target === 'both') && (
                <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-[10px] text-slate-500 mb-1">Their bio:</p>
                  <p className="text-xs text-slate-300 italic">"{opponent.bio || 'No bio — roast that emptiness!'}"</p>
                </div>
              )}
            </div>

            {/* Roast Input */}
            <div className="relative">
              <textarea
                value={p1Input}
                onChange={(e) => !p1Submitted && setP1Input(e.target.value)}
                placeholder={p1Submitted ? 'Roast submitted! 🔥' : 'Drop your roast here...'}
                disabled={p1Submitted}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none min-h-[80px] disabled:opacity-60"
                maxLength={200}
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-slate-600">{p1Input.length}/200</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {!p1Submitted ? (
                <>
                  <button
                    onClick={handleRoastAssist}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-amber-400 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Roast Assist
                  </button>
                  <button
                    onClick={handleSubmitP1}
                    disabled={!p1Input.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-xs hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5" /> SEND ROAST
                  </button>
                </>
              ) : (
                <div className="flex-1 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-center">
                  <span className="text-xs font-bold text-red-400">🔥 Roast submitted! Waiting for opponent...</span>
                </div>
              )}
            </div>

            {/* Roast Assist suggestions */}
            {showAssist && !p1Submitted && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-2">
                <p className="text-[10px] text-amber-400 font-bold">STARTER IDEAS 💡</p>
                {(ROAST_ASSISTS[roundIndex] || ROAST_ASSISTS[0]).map((assist, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setP1Input(assist);
                      setShowAssist(false);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-xs text-slate-300"
                  >
                    {assist}
                  </button>
                ))}
              </div>
            )}

            {/* Opponent status */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
              <PlayerAvatar src={opponent.avatar} name={opponent.name} size="sm" ring="ring-white/20" />
              <p className="text-xs text-slate-400">
                {p2Submitted ? '🔥 Roast submitted!' : '⏳ Typing their roast...'}
              </p>
            </div>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // REVEAL PHASE
  // ============================================
  if (phase === 'reveal') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-red-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-red-600/20 to-orange-600/20 p-4">
            <GameHeader
              icon="👀"
              title="THE ROASTS"
              subtitle={`Round ${roundIndex + 1} reveal`}
              onClose={onClose}
              rightElement={<ScoreDisplay p1Score={p1Score} p2Score={p2Score} />}
            />
          </div>

          <div className="p-4 space-y-3">
            {/* P1 Roast */}
            <div className="rounded-xl bg-red-600/10 border border-red-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="sm" ring="ring-red-400" />
                <span className="text-xs font-bold text-white">{currentUser.name}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{p1Input}</p>
            </div>

            {/* P2 Roast */}
            <div className="rounded-xl bg-orange-600/10 border border-orange-500/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <PlayerAvatar src={opponent.avatar} name={opponent.name} size="sm" ring="ring-orange-400" />
                <span className="text-xs font-bold text-white">{opponent.name}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{p2Input}</p>
            </div>

            {/* Floating reactions */}
            {reactionEmojis.length > 0 && (
              <div className="flex items-center justify-center gap-1 py-1">
                {reactionEmojis.map((e, i) => (
                  <span key={i} className="text-lg animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
                    {e}
                  </span>
                ))}
              </div>
            )}

            <div className="text-center">
              <p className="text-[10px] text-slate-500 animate-pulse">Revealing roasts...</p>
            </div>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // VOTING PHASE
  // ============================================
  if (phase === 'voting') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-red-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-red-600/20 to-orange-600/20 p-4">
            <GameHeader
              icon="🗳️"
              title="WHO WON?"
              subtitle={`Round ${roundIndex + 1} — ${currentRound.label}`}
              onClose={onClose}
              rightElement={<ScoreDisplay p1Score={p1Score} p2Score={p2Score} />}
            />
          </div>

          <div className="p-4 space-y-3">
            {/* Both roasts side-by-side for reference */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-red-600/10 border border-red-500/20 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="sm" ring="ring-red-400" />
                  <span className="text-[10px] font-bold text-white truncate">{currentUser.name}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">{p1Input}</p>
              </div>
              <div className="rounded-xl bg-orange-600/10 border border-orange-500/20 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <PlayerAvatar src={opponent.avatar} name={opponent.name} size="sm" ring="ring-orange-400" />
                  <span className="text-[10px] font-bold text-white truncate">{opponent.name}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">{p2Input}</p>
              </div>
            </div>

            {/* Vote buttons */}
            {!userVote ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleVote('p1')}
                  className="py-4 rounded-xl bg-gradient-to-br from-red-600/30 to-red-800/30 border-2 border-red-500/30 hover:border-red-400/60 hover:bg-red-600/40 transition-all flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <span className="text-2xl font-black text-red-400">W</span>
                  <span className="text-[10px] font-bold text-slate-400">{currentUser.name}</span>
                  <span className="text-[9px] text-slate-500">won this round</span>
                </button>
                <button
                  onClick={() => handleVote('p2')}
                  className="py-4 rounded-xl bg-gradient-to-br from-orange-600/30 to-orange-800/30 border-2 border-orange-500/30 hover:border-orange-400/60 hover:bg-orange-600/40 transition-all flex flex-col items-center gap-1.5 active:scale-95"
                >
                  <span className="text-2xl font-black text-orange-400">W</span>
                  <span className="text-[10px] font-bold text-slate-400">{opponent.name}</span>
                  <span className="text-[9px] text-slate-500">won this round</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm font-bold text-amber-400 mb-2">
                  You voted for {userVote === 'p1' ? currentUser.name : opponent.name}! 🔥
                </p>
                <p className="text-[10px] text-slate-500">
                  {currentRound.pointValue === 20 ? '⚠️ DOUBLE POINTS ROUND!' : `+${currentRound.pointValue} pts to the winner`}
                </p>
              </div>
            )}

            {/* Continue */}
            {userVote && (
              <ActionButton onClick={handleNextRound} color="from-red-600 to-orange-500">
                {roundIndex + 1 >= 3 ? (
                  <><Star className="w-4 h-4" /> SEE RESULTS</>
                ) : (
                  <><ChevronRight className="w-4 h-4" /> NEXT ROUND</>
                )}
              </ActionButton>
            )}
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // ROUND RESULT PHASE
  // ============================================
  if (phase === 'roundResult') {
    const lastResult = roundResults[roundResults.length - 1];
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-red-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-red-600/20 to-orange-600/20 p-4 text-center">
            <p className="text-[10px] text-red-400 font-bold tracking-widest mb-1">ROUND {roundIndex} COMPLETE</p>
            <GameHeader
              icon={lastResult?.winner === 'p1' ? '🏆' : '😬'}
              title={lastResult?.winner === 'p1' ? 'YOU WON THIS ROUND!' : 'OPPONENT TOOK THIS ONE'}
              subtitle={`+${lastResult?.pointValue || 10} pts to ${lastResult?.winner === 'p1' ? 'you' : 'them'}`}
              onClose={onClose}
              rightElement={<ScoreDisplay p1Score={p1Score} p2Score={p2Score} />}
            />
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-red-400">{p1Score}</p>
                <p className="text-[10px] text-slate-500">Your pts</p>
              </div>
              <div className="text-slate-600">—</div>
              <div className="text-center">
                <p className="text-2xl font-black text-orange-400">{p2Score}</p>
                <p className="text-[10px] text-slate-500">Their pts</p>
              </div>
            </div>

            {/* Next round preview */}
            {roundIndex < 3 && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-[10px] text-red-400 font-bold tracking-widest mb-1">UP NEXT</p>
                <p className="text-sm font-bold text-white">{ROUNDS[roundIndex].label} {ROUNDS[roundIndex].intensity}</p>
                <p className="text-[10px] text-slate-500">{ROUNDS[roundIndex].sub}</p>
                {ROUNDS[roundIndex].pointValue === 20 && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                    DOUBLE POINTS!
                  </span>
                )}
              </div>
            )}

            <ActionButton onClick={startRound} color="from-red-600 to-orange-500">
              <Flame className="w-4 h-4" /> ROUND {roundIndex + 1} — FIGHT!
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // BEST MOMENTS PHASE
  // ============================================
  if (phase === 'bestMoments') {
    const isWinner = p1Score >= p2Score;
    const bestMoments = roundResults
      .filter((r) => r.p1Roast !== '(no roast)' && r.p1Roast !== '(ran out of time 😬)')
      .map((r, i) => ({
        roast: r.winner === 'p1' ? r.p1Roast : r.p2Roast,
        reaction: r.winner === 'p1' ? '🏆 WON' : '💀 LOST',
        round: i + 1,
      }));

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-red-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-red-600/20 to-orange-600/20 p-4 text-center">
            <div className="text-4xl mb-2">{isWinner ? '👑' : '🤝'}</div>
            <h2 className="text-xl font-black text-white">{isWinner ? 'YOU WON!' : 'GOOD BATTLE!'}</h2>
            <p className="text-sm text-slate-400">
              {p1Score} - {p2Score}
            </p>
          </div>

          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            <p className="text-[10px] text-amber-400 font-bold tracking-widest text-center">BEST MOMENTS ⭐</p>
            {bestMoments.map((moment, i) => (
              <div
                key={i}
                className="rounded-xl bg-gradient-to-r from-yellow-900/20 to-amber-900/10 border border-yellow-500/20 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-yellow-400">Round {moment.round}</span>
                  <span className="text-[10px] font-bold text-amber-400">{moment.reaction}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">"{moment.roast}"</p>
              </div>
            ))}
            {bestMoments.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500">No memorable roasts this time 😅</p>
              </div>
            )}
          </div>

          <div className="p-4 pt-0">
            <ActionButton onClick={() => setPhase('final')} color="from-red-600 to-orange-500">
              <Crown className="w-4 h-4" /> CLAIM REWARDS
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // FINAL PHASE
  // ============================================
  if (phase === 'final') {
    const isWinner = p1Score >= p2Score;
    const earnedTokens = isWinner ? tokenReward : Math.floor(tokenReward / 3);
    const earnedXP = isWinner ? xpReward : Math.floor(xpReward / 3);

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-red-500/30 overflow-hidden">
          <div className="relative bg-gradient-to-r from-red-600/20 to-orange-600/20 p-6 text-center">
            <div className="text-5xl mb-3">{isWinner ? '🏆' : '👏'}</div>
            <h2 className="text-2xl font-black text-white mb-1">
              {isWinner ? 'ROAST CHAMPION!' : 'WELL FOUGHT!'}
            </h2>
            <p className="text-sm text-slate-400">
              Final score: {p1Score} - {p2Score}
            </p>
          </div>

          <div className="p-4 space-y-3">
            {/* Reward summary */}
            <div className="flex items-center justify-center gap-6 py-4">
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

            {/* Round breakdown */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-500 font-bold tracking-widest">ROUND BREAKDOWN</p>
              {roundResults.map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] font-bold text-slate-500">R{i + 1}</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 truncate block">{r.p1Roast}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${r.winner === 'p1' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.winner === 'p1' ? 'WIN' : 'LOSS'} +{r.winner === 'p1' ? r.pointValue : 0}
                  </span>
                </div>
              ))}
            </div>

            <ActionButton onClick={completeGame} color="from-red-600 to-orange-500">
              <Flame className="w-4 h-4" /> COLLECT & CLOSE
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  return null;
}
