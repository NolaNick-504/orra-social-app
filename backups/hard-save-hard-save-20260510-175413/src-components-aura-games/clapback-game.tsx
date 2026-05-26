'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameOverlay,
  GameHeader,
  ActionButton,
  ProgressBar,
  ScoreDisplay,
  PlayerAvatar,
} from './game-types';
import {
  CLAPBACK_STATEMENTS,
  type GameProps,
} from './game-types';

// ============================================
// TYPES
// ============================================

type ClapbackPhase = 'intro' | 'statement' | 'typing' | 'reveal' | 'voting' | 'roundResult' | 'final';

interface RoundData {
  statement: string;
  playerClapback: string;
  opponentClapback: string;
  playerVotes: number;
  opponentVotes: number;
  playerWon: boolean;
  quickDraw: boolean;
  statementSource: 'opener' | 'chain';
}

// ============================================
// BOT RESPONSES
// ============================================

const BOT_CLAPBACKS = [
  "I don't need a lane, I AM the road 🛣️",
  "My clapbacks write themselves ✍️",
  "Stay mad, I'll stay fabulous 💅",
  "That's cute but I'm cuter ✨",
  "I'd explain it to you but I left my crayons at home 🖍️",
];

// ============================================
// STATEMENT TIERS (escalating)
// ============================================

const STATEMENT_TIERS = {
  mild: [
    "You think you're all that",
    "That's cute, but watch this",
  ],
  medium: [
    "Nobody asked for your opinion",
    "You're trying too hard",
  ],
  spicy: [
    "You could never pull this off",
    "Who let you in here?",
    "That was barely mediocre",
    "Stay in your lane",
  ],
};

function getStatementForRound(round: number, usedStatements: Set<string>, chainStatement: string | null): string {
  // If there's a chain statement from winning last round, use it
  if (chainStatement) return chainStatement;

  const tier = round === 0 ? 'mild' : round === 1 ? 'medium' : 'spicy';
  const pool = STATEMENT_TIERS[tier].filter((s) => !usedStatements.has(s));

  if (pool.length === 0) {
    // Fallback to any unused statement from CLAPBACK_STATEMENTS
    const fallback = CLAPBACK_STATEMENTS.filter((s) => !usedStatements.has(s));
    return fallback[0] || CLAPBACK_STATEMENTS[round % CLAPBACK_STATEMENTS.length];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================
// DEVASTATING ANIMATION OVERLAY
// ============================================

function DevastatingOverlay({ winner, active }: { winner: 'player' | 'opponent'; active: boolean }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {/* Screen shake effect */}
      <div
        className="absolute inset-0"
        style={{
          animation: active ? 'clapback-shake 0.5s ease-in-out 2' : 'none',
        }}
      />
      {/* Dramatic flash */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-amber-500/10"
        style={{
          animation: active ? 'clapback-flash 1s ease-out forwards' : 'none',
        }}
      />
      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-3xl font-black text-amber-400 tracking-wider"
          style={{
            animation: active ? 'clapback-zoom 0.8s ease-out forwards' : 'none',
            textShadow: '0 0 30px rgba(245,158,11,0.6), 0 0 60px rgba(245,158,11,0.3)',
          }}
        >
          💥 DEVASTATING
        </span>
      </div>
    </div>
  );
}

// ============================================
// QUICK DRAW BADGE
// ============================================

function QuickDrawBadge({ earned }: { earned: boolean }) {
  if (!earned) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 animate-pulse">
      <span className="text-xs">⚡</span>
      <span className="text-[10px] font-bold text-amber-400">QUICK DRAW +5</span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ClapbackGame({
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
  // ---- Phase & Round ----
  const [phase, setPhase] = useState<ClapbackPhase>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [rounds, setRounds] = useState<RoundData[]>([]);

  // ---- Typing state ----
  const [playerInput, setPlayerInput] = useState('');
  const [opponentInput, setOpponentInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(20);
  const [typingStartTime, setTypingStartTime] = useState<number>(0);
  const [playerSubmitted, setPlayerSubmitted] = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [quickDrawEarned, setQuickDrawEarned] = useState(false);

  // ---- Voting state ----
  const [playerVotes, setPlayerVotes] = useState(0);
  const [opponentVotes, setOpponentVotes] = useState(0);
  const [userVote, setUserVote] = useState<'player' | 'opponent' | null>(null);
  const [votingTimer, setVotingTimer] = useState(10);

  // ---- Statement management ----
  const [usedStatements, setUsedStatements] = useState<Set<string>>(new Set());
  const [currentStatement, setCurrentStatement] = useState('');
  const [chainStatement, setChainStatement] = useState<string | null>(null);

  // ---- Scoring ----
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);

  // ---- Animation state ----
  const [showDevastating, setShowDevastating] = useState(false);
  const isCompletingRef = useRef(false);

  const totalRounds = 3;
  const opponentName = opponent?.name || (isVsBot ? 'Guest Bot' : 'Opponent');
  const opponentAvatar = opponent?.avatar || '/images/orra-logo.png';

  // ---- Start round ----
  const startRound = useCallback(() => {
    const statement = getStatementForRound(currentRound, usedStatements, chainStatement);
    setCurrentStatement(statement);
    setUsedStatements((prev) => new Set([...prev, statement]));
    setPlayerInput('');
    setOpponentInput('');
    setTimeLeft(20);
    setPlayerSubmitted(false);
    setOpponentSubmitted(false);
    setQuickDrawEarned(false);
    setPlayerVotes(0);
    setOpponentVotes(0);
    setUserVote(null);
    setVotingTimer(10);
    setShowDevastating(false);
    setPhase('statement');
  }, [currentRound, usedStatements, chainStatement]);

  // ---- Handle player submit ----
  const handleSubmitPlayer = useCallback(() => {
    if (playerSubmitted) return;
    if (!playerInput.trim()) {
      setPlayerInput('(froze under pressure 😬)');
    }
    setPlayerSubmitted(true);

    // Check quick draw bonus
    const elapsed = (Date.now() - typingStartTime) / 1000;
    if (elapsed <= 5 && playerInput.trim().length > 0) {
      setQuickDrawEarned(true);
      setTokensEarned((prev) => prev + 5);
      callbacks.earnTokens(5, 'clapback_quick_draw');
      callbacks.showToast('⚡ Quick Draw! +5 bonus tokens!', { duration: 2000 });
    }

    // Submit to server
    callbacks.submitToServer(currentRound, playerInput.trim() || '(froze under pressure 😬)', isVsBot);

    // If both submitted, go to reveal
    if (opponentSubmitted || isVsBot) {
      setTimeout(() => setPhase('reveal'), 500);
    }
  }, [playerSubmitted, playerInput, typingStartTime, opponentSubmitted, isVsBot, currentRound, callbacks]);

  // ---- Handle voting ----
  const handleVote = useCallback(
    (choice: 'player' | 'opponent') => {
      if (userVote !== null) return;
      setUserVote(choice);

      // Add user's vote
      if (choice === 'player') {
        setPlayerVotes((v) => v + 1);
      } else {
        setOpponentVotes((v) => v + 1);
      }

      // Submit vote to server
      const votedForId = choice === 'player' ? currentUser.id : (opponent?.id || 'bot');
      callbacks.submitVote(votedForId, 'clapback');
    },
    [userVote, currentUser.id, opponent?.id, callbacks]
  );

  // ---- End voting ----
  const handleVotingEnd = useCallback(() => {
    const playerWon = playerVotes > opponentVotes;
    const isDevastating = Math.max(playerVotes, opponentVotes) > 0 &&
      (Math.max(playerVotes, opponentVotes) / (playerVotes + opponentVotes)) >= 0.7;

    const roundData: RoundData = {
      statement: currentStatement,
      playerClapback: playerInput.trim() || '(froze under pressure 😬)',
      opponentClapback: opponentInput,
      playerVotes,
      opponentVotes,
      playerWon,
      quickDraw: quickDrawEarned,
      statementSource: chainStatement ? 'chain' : 'opener',
    };

    setRounds((prev) => [...prev, roundData]);

    // Update scores
    if (playerWon) {
      setPlayerScore((s) => s + 10);
      // Chain clapback: winner's clapback becomes next statement
      setChainStatement(playerInput.trim());
    } else {
      setOpponentScore((s) => s + 10);
      setChainStatement(null); // Reset chain if opponent wins
    }

    // Devastating animation
    if (isDevastating) {
      setShowDevastating(true);
      setTimeout(() => setShowDevastating(false), 2000);
    }

    setTimeout(() => setPhase('roundResult'), isDevastating ? 2000 : 500);
  }, [playerVotes, opponentVotes, currentStatement, playerInput, opponentInput, quickDrawEarned, chainStatement]);

  // ---- Refs for functions accessed in effects ----
  const handleSubmitPlayerRef = useRef(handleSubmitPlayer);
  const handleVotingEndRef = useRef(handleVotingEnd);

  // Keep refs up to date via effects
  useEffect(() => {
    handleSubmitPlayerRef.current = handleSubmitPlayer;
  }, [handleSubmitPlayer]);
  useEffect(() => {
    handleVotingEndRef.current = handleVotingEnd;
  }, [handleVotingEnd]);

  // ---- Timer for typing phase ----
  useEffect(() => {
    if (phase !== 'typing') return;
    if (timeLeft <= 0) {
      if (!playerSubmitted) {
        handleSubmitPlayerRef.current();
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, playerSubmitted]);

  // ---- Bot response simulation ----
  useEffect(() => {
    if (!isVsBot || phase !== 'typing' || opponentSubmitted) return;
    const delay = 3000 + Math.random() * 5000;
    const t = setTimeout(() => {
      const response = BOT_CLAPBACKS[currentRound % BOT_CLAPBACKS.length];
      setOpponentInput(response);
      setOpponentSubmitted(true);
    }, delay);
    return () => clearTimeout(t);
  }, [isVsBot, phase, currentRound, opponentSubmitted]);

  // ---- Voting timer ----
  useEffect(() => {
    if (phase !== 'voting') return;
    if (votingTimer <= 0) {
      handleVotingEndRef.current();
      return;
    }
    const t = setTimeout(() => setVotingTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, votingTimer]);

  // ---- Simulate audience votes during voting phase ----
  useEffect(() => {
    if (phase !== 'voting') return;
    const interval = setInterval(() => {
      const randomVote = Math.random() > 0.45 ? 'player' : 'opponent';
      if (randomVote === 'player') {
        setPlayerVotes((v) => v + 1);
      } else {
        setOpponentVotes((v) => v + 1);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [phase]);

  // ---- Next round ----
  const handleNextRound = useCallback(() => {
    if (currentRound + 1 >= totalRounds) {
      setPhase('final');
    } else {
      setCurrentRound((r) => r + 1);
      startRound();
    }
  }, [currentRound, totalRounds, startRound]);

  // ---- Complete game ----
  const completeGameHandler = useCallback(() => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    const isWinner = playerScore > opponentScore;
    const finalTokens = tokensEarned + (isWinner ? tokenReward : Math.floor(tokenReward / 3));
    const finalXP = isWinner ? xpReward : Math.floor(xpReward / 3);

    callbacks.earnTokens(isWinner ? tokenReward : Math.floor(tokenReward / 3), 'clapback_complete');
    callbacks.addXP(finalXP);
    callbacks.completeGame(finalTokens, isWinner);
  }, [playerScore, opponentScore, tokensEarned, tokenReward, xpReward, callbacks]);

  const hasCompletedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'final' || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    completeGameHandler();
  }, [phase, completeGameHandler]);

  // ---- Start game ----
  const handleStartGame = useCallback(() => {
    setTypingStartTime(Date.now());
    startRound();
  }, [startRound]);

  // ---- Actually begin typing ----
  const handleBeginTyping = useCallback(() => {
    setTypingStartTime(Date.now());
    setPhase('typing');
  }, []);

  // ============================================
  // RENDER: Intro
  // ============================================
  if (phase === 'intro') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 text-center relative overflow-hidden">
          <GameHeader
            icon="💥"
            title="Clapback"
            subtitle="Ready to clap back?"
            onClose={onClose}
          />

          <div className="my-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-600 to-red-500 flex items-center justify-center text-5xl mx-auto mb-4 shadow-lg shadow-amber-500/30 animate-pulse">
              💥
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Clapback Battle</h2>
            <p className="text-sm text-slate-400">3 rounds of rapid-fire comebacks</p>
          </div>

          {/* VS display */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="flex flex-col items-center gap-1.5">
              <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="md" ring="ring-amber-400" />
              <p className="text-xs font-bold text-white max-w-[80px] truncate">{currentUser.name}</p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-600 to-red-500">
              <span className="text-sm font-black text-white">VS</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <PlayerAvatar src={opponentAvatar} name={opponentName} size="md" ring="ring-red-400" />
              <p className="text-xs font-bold text-white max-w-[80px] truncate">{opponentName}</p>
              {isVsBot && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-500/30 text-slate-400">BOT</span>
              )}
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2 mb-5 p-3 rounded-xl bg-white/5 border border-white/10 text-left">
            <p className="text-xs text-slate-300 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">⚔️</span>
              Opponent throws a statement, you clap back
            </p>
            <p className="text-xs text-slate-300 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">⏱️</span>
              20 seconds to type your best response
            </p>
            <p className="text-xs text-slate-300 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">⚡</span>
              Quick Draw: Submit in under 5s for +5 bonus
            </p>
            <p className="text-xs text-slate-300 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">🔗</span>
              Win a round and your clapback becomes the next statement
            </p>
          </div>

          {/* Rewards */}
          <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-white/5 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">{tokenReward}</p>
              <p className="text-[9px] text-slate-500">Winner Tokens</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">3</p>
              <p className="text-[9px] text-slate-500">Rounds</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">20s</p>
              <p className="text-[9px] text-slate-500">Per Round</p>
            </div>
          </div>

          <ActionButton onClick={handleStartGame} color="from-amber-600 to-red-500">
            Ready to Clap Back 💥
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Statement (show opponent's statement)
  // ============================================
  if (phase === 'statement') {
    const tier = currentRound === 0 ? '🔥 Mild' : currentRound === 1 ? '🔥🔥 Medium' : '🔥🔥🔥 Spicy';
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 text-center relative overflow-hidden">
          <GameHeader
            icon="💥"
            title="Clapback"
            subtitle={`Round ${currentRound + 1} of ${totalRounds}`}
            onClose={onClose}
            rightElement={
              <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
            }
          />

          {/* Spice tier */}
          <div className="mb-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {tier}
            </span>
          </div>

          {/* Opponent avatar */}
          <div className="mb-4">
            <PlayerAvatar src={opponentAvatar} name={opponentName} size="lg" ring="ring-red-400" />
            <p className="text-xs font-bold text-white mt-2">{opponentName} says:</p>
          </div>

          {/* The statement */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-red-900/20 to-amber-900/10 border border-red-500/20 mb-5">
            <p className="text-xl font-bold text-white leading-relaxed">
              &ldquo;{currentStatement}&rdquo;
            </p>
          </div>

          {chainStatement && (
            <p className="text-[10px] text-amber-400/60 mb-3">🔗 Chained from your winning clapback</p>
          )}

          <ActionButton onClick={handleBeginTyping} color="from-amber-600 to-red-500">
            Clap Back Now ⚔️
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Typing (20s timer)
  // ============================================
  if (phase === 'typing') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 relative overflow-hidden">
          <GameHeader
            icon="💥"
            title="Clapback"
            subtitle={`Round ${currentRound + 1} — Your Turn`}
            onClose={onClose}
            rightElement={
              <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
            }
          />

          {/* Timer */}
          <div className="mb-4">
            <ProgressBar
              value={timeLeft}
              max={20}
              color="from-amber-500 to-red-500"
              isLow={timeLeft <= 5}
            />
          </div>

          {/* Statement reminder */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
            <p className="text-[10px] text-slate-500 mb-1">They said:</p>
            <p className="text-sm text-white font-semibold">&ldquo;{currentStatement}&rdquo;</p>
          </div>

          {/* Typing area */}
          <div className="relative mb-3">
            <textarea
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              placeholder="Type your clapback..."
              maxLength={200}
              rows={3}
              disabled={playerSubmitted}
              className="w-full p-4 rounded-xl bg-white/5 border border-amber-500/30 text-white placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 disabled:opacity-50"
              autoFocus
            />
            <div className="absolute bottom-2 right-3">
              <span className="text-[10px] text-slate-600">{playerInput.length}/200</span>
            </div>
          </div>

          {/* Quick draw indicator */}
          {quickDrawEarned && <QuickDrawBadge earned={quickDrawEarned} />}

          {/* Submit button */}
          <ActionButton
            onClick={handleSubmitPlayer}
            disabled={playerSubmitted || !playerInput.trim()}
            color="from-amber-600 to-red-500"
          >
            {playerSubmitted ? (
              'Submitted! ✅'
            ) : (
              <>
                Send Clapback 💥
                {timeLeft <= 5 && !playerSubmitted && (
                  <span className="ml-1 animate-pulse">⏰</span>
                )}
              </>
            )}
          </ActionButton>

          {/* Opponent status */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${opponentSubmitted ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-[10px] text-slate-500">
              {opponentSubmitted ? `${opponentName} submitted` : `${opponentName} is typing...`}
            </span>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Reveal (side-by-side)
  // ============================================
  if (phase === 'reveal') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 relative overflow-hidden">
          <GameHeader
            icon="💥"
            title="Clapback"
            subtitle={`Round ${currentRound + 1} — The Reveal`}
            onClose={onClose}
            rightElement={
              <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
            }
          />

          {/* Statement */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4 text-center">
            <p className="text-[10px] text-slate-500 mb-0.5">The statement:</p>
            <p className="text-sm text-white font-semibold">&ldquo;{currentStatement}&rdquo;</p>
          </div>

          {/* Side-by-side reveal */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Player */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="sm" ring="ring-amber-400" />
                <p className="text-[10px] font-bold text-amber-400 truncate">{currentUser.name}</p>
              </div>
              <p className="text-xs text-white leading-relaxed">
                &ldquo;{playerInput.trim() || '(froze under pressure 😬)'}&rdquo;
              </p>
              {quickDrawEarned && <QuickDrawBadge earned={quickDrawEarned} />}
            </div>

            {/* Opponent */}
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <PlayerAvatar src={opponentAvatar} name={opponentName} size="sm" ring="ring-red-400" />
                <p className="text-[10px] font-bold text-red-400 truncate">{opponentName}</p>
              </div>
              <p className="text-xs text-white leading-relaxed">
                &ldquo;{opponentInput || '(no response)'}&rdquo;
              </p>
            </div>
          </div>

          <ActionButton
            onClick={() => {
              setVotingTimer(10);
              setPhase('voting');
            }}
            color="from-amber-600 to-red-500"
          >
            Vote Now 🗳️
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Voting
  // ============================================
  if (phase === 'voting') {
    const totalVotes = playerVotes + opponentVotes;
    const playerPct = totalVotes > 0 ? Math.round((playerVotes / totalVotes) * 100) : 50;
    const opponentPct = totalVotes > 0 ? 100 - playerPct : 50;
    const isDevastating = totalVotes > 0 && (Math.max(playerPct, opponentPct) >= 70);

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 relative overflow-hidden">
          <DevastatingOverlay
            winner={playerPct >= 70 ? 'player' : 'opponent'}
            active={showDevastating}
          />

          <GameHeader
            icon="🗳️"
            title="Audience Vote"
            subtitle={`${votingTimer}s remaining`}
            onClose={onClose}
            rightElement={
              <span className="text-xs text-slate-400">{totalVotes} votes</span>
            }
          />

          {/* Vote bars */}
          <div className="space-y-4 mb-5">
            {/* Player vote bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="sm" ring="ring-amber-400" />
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">{currentUser.name}</span>
                </div>
                <span className="text-sm font-bold font-mono text-amber-400">{playerPct}%</span>
              </div>
              <div className="h-4 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${playerPct}%` }}
                />
              </div>
            </div>

            {/* Opponent vote bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <PlayerAvatar src={opponentAvatar} name={opponentName} size="sm" ring="ring-red-400" />
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">{opponentName}</span>
                </div>
                <span className="text-sm font-bold font-mono text-red-400">{opponentPct}%</span>
              </div>
              <div className="h-4 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-500"
                  style={{ width: `${opponentPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Vote buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handleVote('player')}
              disabled={userVote !== null}
              className={`py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                userVote === 'player'
                  ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-300 scale-105'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-amber-500/10 hover:border-amber-500/30'
              } disabled:opacity-50`}
            >
              <span className="text-lg">W</span> {currentUser.name.split(' ')[0]}
            </button>
            <button
              onClick={() => handleVote('opponent')}
              disabled={userVote !== null}
              className={`py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                userVote === 'opponent'
                  ? 'bg-red-500/30 border-2 border-red-400 text-red-300 scale-105'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/30'
              } disabled:opacity-50`}
            >
              <span className="text-lg">W</span> {opponentName.split(' ')[0]}
            </button>
          </div>

          {/* Timer bar */}
          <ProgressBar
            value={votingTimer}
            max={10}
            color="from-amber-500 to-red-500"
            isLow={votingTimer <= 3}
          />
        </div>

        {/* Animation styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes clapback-shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          @keyframes clapback-flash {
            0% { opacity: 0.8; }
            100% { opacity: 0; }
          }
          @keyframes clapback-zoom {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}} />
      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Round Result
  // ============================================
  if (phase === 'roundResult') {
    const lastRound = rounds[rounds.length - 1];
    if (!lastRound) return null;

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 text-center relative overflow-hidden">
          <GameHeader
            icon="💥"
            title="Round Result"
            subtitle={`Round ${currentRound + 1} of ${totalRounds}`}
            onClose={onClose}
            rightElement={
              <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
            }
          />

          {/* Winner announcement */}
          <div className={`my-4 p-5 rounded-xl ${lastRound.playerWon ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-red-500/15 border border-red-500/30'}`}>
            <p className="text-3xl mb-2">{lastRound.playerWon ? '🏆' : '😤'}</p>
            <p className={`text-xl font-bold ${lastRound.playerWon ? 'text-amber-400' : 'text-red-400'}`}>
              {lastRound.playerWon ? 'You won this round!' : `${opponentName} takes this one!`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {lastRound.playerVotes} - {lastRound.opponentVotes} votes
            </p>
          </div>

          {/* Best clapback highlight */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-900/20 to-amber-900/10 border border-yellow-500/20 mb-4 text-left">
            <p className="text-[10px] text-yellow-400 font-bold mb-1">🔥 Best Clapback</p>
            <p className="text-sm text-white font-medium">
              &ldquo;{lastRound.playerWon ? lastRound.playerClapback : lastRound.opponentClapback}&rdquo;
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              — {lastRound.playerWon ? currentUser.name : opponentName}
            </p>
          </div>

          {/* Chain indicator */}
          {lastRound.playerWon && currentRound + 1 < totalRounds && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
              <p className="text-xs text-amber-300">🔗 Your clapback becomes the next statement!</p>
            </div>
          )}

          {/* Quick draw reminder */}
          {lastRound.quickDraw && (
            <QuickDrawBadge earned={true} />
          )}

          <ActionButton onClick={handleNextRound} color="from-amber-600 to-red-500">
            {currentRound + 1 >= totalRounds ? 'See Final Results 🏆' : 'Next Round →'}
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Final
  // ============================================
  if (phase === 'final') {
    const isWinner = playerScore > opponentScore;
    const winsCount = rounds.filter((r) => r.playerWon).length;

    // Find best clapback across all rounds
    const bestClapback = rounds.reduce<{ text: string; by: string; votes: number } | null>((best, r) => {
      const playerVoteCount = r.playerVotes;
      const opponentVoteCount = r.opponentVotes;
      if (playerVoteCount >= opponentVoteCount && (!best || playerVoteCount > best.votes)) {
        return { text: r.playerClapback, by: currentUser.name, votes: playerVoteCount };
      }
      if (opponentVoteCount > playerVoteCount && (!best || opponentVoteCount > best.votes)) {
        return { text: r.opponentClapback, by: opponentName, votes: opponentVoteCount };
      }
      return best;
    }, null);

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 text-center relative overflow-hidden max-h-[90vh] overflow-y-auto">
          <GameHeader
            icon="🏆"
            title="Battle Over"
            onClose={onClose}
          />

          {/* Winner banner */}
          <div className={`my-4 p-5 rounded-xl ${isWinner ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-red-500/15 border border-red-500/30'}`}>
            <p className="text-4xl mb-2">{isWinner ? '👑' : '💪'}</p>
            <p className={`text-2xl font-black ${isWinner ? 'text-amber-400' : 'text-red-400'}`}>
              {isWinner ? 'YOU WIN!' : `${opponentName} Wins!`}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {playerScore} - {opponentScore}
            </p>
          </div>

          {/* Round breakdown */}
          <div className="space-y-2 mb-4">
            {rounds.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  r.playerWon ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/10'
                }`}
              >
                <span className="text-xs text-slate-500 font-bold min-w-[16px]">R{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">&ldquo;{r.playerClapback}&rdquo;</p>
                </div>
                <span className="text-[10px] text-slate-400">{r.playerVotes}v</span>
                <span className={`text-xs font-bold ${r.playerWon ? 'text-amber-400' : 'text-red-400'}`}>
                  {r.playerWon ? 'W' : 'L'}
                </span>
              </div>
            ))}
          </div>

          {/* Best clapback */}
          {bestClapback && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-900/20 to-amber-900/10 border border-yellow-500/20 mb-4">
              <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider mb-1">🔥 Best Clapback</p>
              <p className="text-sm text-white font-bold">&ldquo;{bestClapback.text}&rdquo;</p>
              <p className="text-[10px] text-slate-500 mt-1">— {bestClapback.by} · {bestClapback.votes} votes</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-lg font-bold text-amber-400">{winsCount}/{totalRounds}</p>
              <p className="text-[9px] text-slate-500">Rounds Won</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-lg font-bold text-emerald-400">+{tokensEarned + (isWinner ? tokenReward : Math.floor(tokenReward / 3))}</p>
              <p className="text-[9px] text-slate-500">Tokens</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-lg font-bold text-violet-400">
                {rounds.filter((r) => r.quickDraw).length}
              </p>
              <p className="text-[9px] text-slate-500">Quick Draws</p>
            </div>
          </div>

          <ActionButton onClick={onClose} color="from-amber-600 to-red-500">
            Done 💥
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  return null;
}
