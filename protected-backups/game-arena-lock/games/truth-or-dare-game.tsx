'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameOverlay,
  GameHeader,
  ActionButton,
  ProgressBar,
  PlayerAvatar,
  ScoreDisplay,
  TRUTH_PROMPTS,
  DARE_PROMPTS,
} from './game-types';
import type { GameProps } from './game-types';
import { Coins, Zap, Target, Eye, Flame, ThumbsUp, Award, Star, ChevronRight } from 'lucide-react';

// ============================================
// INTENSITY CATEGORIES
// ============================================
type Intensity = 'mild' | 'medium' | 'spicy' | 'fire';

const INTENSITY_CONFIG: Record<Intensity, { label: string; emoji: string; color: string; bgColor: string; points: number }> = {
  mild: { label: 'Mild', emoji: '🧊', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/20', points: 5 },
  medium: { label: 'Medium', emoji: '🌶️', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20', points: 10 },
  spicy: { label: 'Spicy', emoji: '🔥', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20', points: 15 },
  fire: { label: 'FIRE', emoji: '💥', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/20', points: 25 },
};

function getIntensityForRound(round: number, totalRounds: number): Intensity {
  const ratio = round / (totalRounds - 1);
  if (ratio <= 0.25) return 'mild';
  if (ratio <= 0.5) return 'medium';
  if (ratio <= 0.75) return 'spicy';
  return 'fire';
}

// ============================================
// BADGE DATA
// ============================================
interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const BADGE_CALLED_OUT: Badge = { id: 'called-out', name: 'Called Out', icon: '🎯', description: 'Shockingly honest truth answer' };
const BADGE_DARE_DEVIL: Badge = { id: 'dare-devil', name: 'Dare Devil', icon: '😈', description: 'Completed a dare' };
const BADGE_DOUBLE_DARE: Badge = { id: 'double-dare', name: 'Double Dare', icon: '💥', description: 'Survived a Double Dare' };

// ============================================
// BOT RESPONSES
// ============================================
const BOT_TRUTH_RESPONSES = [
  "I still sleep with a nightlight 😅",
  "I once liked a 3-year-old post at 2am",
  "My last search was 'how to be cool' 💀",
  "I still sleep with my childhood blanket 🥺",
];

const BOT_DARE_RESPONSES = [
  "I'll do my best robot dance! *beep boop*",
  "Challenge accepted! Here goes nothing... 🎭",
  "Okay fine... *does the worm* 🪱",
  "Watch this! *attempts cartwheel* 🤸",
];

// ============================================
// GAME TYPES
// ============================================
type Phase = 'intro' | 'choose' | 'prompt' | 'respond' | 'reveal' | 'voting' | 'roundResult' | 'final';
type Choice = 'truth' | 'dare' | 'double-dare';

interface RoundResult {
  round: number;
  choice: Choice;
  prompt: string;
  playerResponse: string;
  opponentResponse: string;
  intensity: Intensity;
  playerVotes: number;
  opponentVotes: number;
  winner: 'player' | 'opponent' | 'tie';
  badge?: Badge;
}

// ============================================
// TRUTH OR DARE GAME COMPONENT
// ============================================
export default function TruthOrDareGame({
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
  const TOTAL_ROUNDS = 4;
  const RESPONSE_TIMER = 20;

  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [playerInput, setPlayerInput] = useState('');
  const [opponentInput, setOpponentInput] = useState('');
  const [playerSubmitted, setPlayerSubmitted] = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [timer, setTimer] = useState(RESPONSE_TIMER);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [playerVote, setPlayerVote] = useState<'player' | 'opponent' | null>(null);
  const [playerVotes, setPlayerVotes] = useState(0);
  const [opponentVotes, setOpponentVotes] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  const isCompleting = useRef(false);
  const usedTruthIndices = useRef<Set<number>>(new Set());
  const usedDareIndices = useRef<Set<number>>(new Set());

  const intensity = getIntensityForRound(round, TOTAL_ROUNDS);
  const intensityConfig = INTENSITY_CONFIG[intensity];
  const isFinalRound = round === TOTAL_ROUNDS - 1;
  const opponentData = opponent || { id: 'bot', name: isVsBot ? 'Guest Bot' : 'Opponent', avatar: '/images/orra-logo.png' };

  // ============================================
  // START GAME
  // ============================================
  const startGame = useCallback(() => {
    if (isStarting) return;
    setIsStarting(true);
    setRound(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundResults([]);
    setBadges([]);
    usedTruthIndices.current = new Set();
    usedDareIndices.current = new Set();
    callbacks.submitToServer(0, 'game_start', isVsBot);
    setPhase('choose');
    setIsStarting(false);
  }, [isStarting, isVsBot, callbacks]);

  // ============================================
  // PICK PROMPT
  // ============================================
  const pickPrompt = useCallback((type: 'truth' | 'dare') => {
    const prompts = type === 'truth' ? TRUTH_PROMPTS : DARE_PROMPTS;
    const usedSet = type === 'truth' ? usedTruthIndices.current : usedDareIndices.current;

    let idx: number;
    const availableIndices = prompts.map((_, i) => i).filter(i => !usedSet.has(i));
    if (availableIndices.length === 0) {
      // Reset if all used
      usedSet.clear();
      idx = Math.floor(Math.random() * prompts.length);
    } else {
      idx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
    usedSet.add(idx);
    return prompts[idx];
  }, []);

  // ============================================
  // CHOOSE TRUTH/DARE/DOUBLE-DARE
  // ============================================
  const handleChoice = useCallback((c: Choice) => {
    setChoice(c);
    const type = c === 'double-dare' ? 'dare' : c;
    const prompt = pickPrompt(type);
    setCurrentPrompt(prompt);
    setPlayerInput('');
    setOpponentInput('');
    setPlayerSubmitted(false);
    setOpponentSubmitted(false);
    setTimer(RESPONSE_TIMER);
    setPlayerVote(null);
    setPlayerVotes(0);
    setOpponentVotes(0);
    setPhase('prompt');

    // Brief delay then move to respond
    setTimeout(() => setPhase('respond'), 1500);
  }, [pickPrompt]);

  // ============================================
  // RESPONSE TIMER
  // ============================================
  useEffect(() => {
    if (phase !== 'respond') return;
    if (timer <= 0) {
      if (!playerSubmitted) {
        const t = setTimeout(() => {
          setPlayerInput(prev => prev || '(ran out of time)');
          setPlayerSubmitted(true);
        }, 0);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timer, playerSubmitted]);

  // ============================================
  // BOT OPPONENT
  // ============================================
  useEffect(() => {
    if (!isVsBot || phase !== 'respond' || opponentSubmitted) return;
    const delay = 2000 + Math.random() * 4000;
    const t = setTimeout(() => {
      const isTruth = choice === 'truth';
      const responses = isTruth ? BOT_TRUTH_RESPONSES : BOT_DARE_RESPONSES;
      const response = responses[round % responses.length];
      setOpponentInput(response);
      setOpponentSubmitted(true);
      callbacks.submitToServer(round + 1, response, true);
    }, delay);
    return () => clearTimeout(t);
  }, [isVsBot, phase, opponentSubmitted, choice, round, callbacks]);

  // ============================================
  // SUBMIT PLAYER RESPONSE
  // ============================================
  const handleSubmitResponse = useCallback(() => {
    if (playerSubmitted || !playerInput.trim()) return;
    setPlayerSubmitted(true);
    callbacks.submitToServer(round + 1, playerInput, false);

    // Check for badges
    if (choice === 'truth') {
      // Random chance of "Called Out" badge for honest answers
      if (playerInput.length > 20 && Math.random() > 0.5) {
        if (!badges.find(b => b.id === BADGE_CALLED_OUT.id)) {
          setBadges(prev => [...prev, BADGE_CALLED_OUT]);
          callbacks.showToast('Badge earned: Called Out! 🎯', { icon: '🏆' });
        }
      }
    } else if (choice === 'dare' || choice === 'double-dare') {
      if (!badges.find(b => b.id === BADGE_DARE_DEVIL.id)) {
        setBadges(prev => [...prev, BADGE_DARE_DEVIL]);
      }
      if (choice === 'double-dare' && !badges.find(b => b.id === BADGE_DOUBLE_DARE.id)) {
        setBadges(prev => [...prev, BADGE_DOUBLE_DARE]);
        callbacks.showToast('Badge earned: Double Dare! 💥', { icon: '🏆' });
      }
    }

    // Move to reveal once both submitted
    if (opponentSubmitted || isVsBot) {
      setTimeout(() => setPhase('reveal'), 500);
    }
  }, [playerSubmitted, playerInput, choice, opponentSubmitted, isVsBot, round, badges, callbacks]);

  // Auto-move to reveal when both are done
  useEffect(() => {
    if (phase === 'respond' && playerSubmitted && opponentSubmitted) {
      setTimeout(() => setPhase('reveal'), 500);
    }
  }, [phase, playerSubmitted, opponentSubmitted]);

  // ============================================
  // VOTING
  // ============================================
  const handleVote = useCallback((votedFor: 'player' | 'opponent') => {
    if (playerVote) return;
    setPlayerVote(votedFor);

    // Simulate community votes (skewed toward better response)
    const pVotes = 3 + Math.floor(Math.random() * 8);
    const oVotes = 2 + Math.floor(Math.random() * 7);
    setPlayerVotes(pVotes + (votedFor === 'player' ? 2 : 0));
    setOpponentVotes(oVotes + (votedFor === 'opponent' ? 2 : 0));

    // Submit vote to server
    if (gameSessionId) {
      const votedForId = votedFor === 'player' ? currentUser.id : (opponent?.id || 'bot');
      callbacks.submitVote(votedForId, 'truth_or_dare_pick');
    }

    setTimeout(() => setPhase('roundResult'), 1500);
  }, [playerVote, gameSessionId, currentUser.id, opponent, callbacks]);

  // ============================================
  // NEXT ROUND / FINISH
  // ============================================
  const handleNextRound = useCallback(() => {
    const winner: 'player' | 'opponent' | 'tie' = playerVotes > opponentVotes ? 'player' : opponentVotes > playerVotes ? 'opponent' : 'tie';
    const multiplier = choice === 'double-dare' ? 2 : 1;
    const points = intensityConfig.points * multiplier;

    if (winner === 'player') {
      setPlayerScore(prev => prev + points);
    } else if (winner === 'opponent') {
      setOpponentScore(prev => prev + points);
    } else {
      setPlayerScore(prev => prev + Math.floor(points / 2));
      setOpponentScore(prev => prev + Math.floor(points / 2));
    }

    const result: RoundResult = {
      round: round + 1,
      choice: choice!,
      prompt: currentPrompt,
      playerResponse: playerInput,
      opponentResponse: opponentInput,
      intensity,
      playerVotes,
      opponentVotes,
      winner,
    };
    setRoundResults(prev => [...prev, result]);

    if (round + 1 >= TOTAL_ROUNDS) {
      setPhase('final');
    } else {
      setRound(prev => prev + 1);
      setChoice(null);
      setPhase('choose');
    }
  }, [playerVotes, opponentVotes, choice, intensityConfig, intensity, round, currentPrompt, playerInput, opponentInput]);

  // ============================================
  // FINISH GAME
  // ============================================
  const handleFinish = useCallback(() => {
    if (isCompleting.current) return;
    isCompleting.current = true;

    const isWinner = playerScore >= opponentScore;
    const score = playerScore;
    callbacks.earnTokens(isWinner ? tokenReward : Math.floor(tokenReward / 3), 'truth_or_dare_complete');
    callbacks.addXP(isWinner ? xpReward : Math.floor(xpReward / 3));
    callbacks.completeGame(score, isWinner);
    // Close the game overlay after collecting rewards
    setTimeout(() => onClose(), 300);
  }, [playerScore, opponentScore, tokenReward, xpReward, callbacks, onClose]);

  // ============================================
  // INTRO PHASE
  // ============================================
  if (phase === 'intro') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-rose-500/30 overflow-hidden">
          <GameHeader icon="🎯" title="Truth or Dare" subtitle="Choose your fate!" onClose={onClose} />

          <div className="px-4 py-4 text-center">
            {/* Hero */}
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-600 to-red-500 flex items-center justify-center text-5xl mx-auto mb-4 shadow-lg">
              🎯
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Truth or Dare</h2>
            <p className="text-sm text-slate-400 mb-4">Pick your poison. Answer honestly or prove yourself!</p>

            {/* Preview cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Eye className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-cyan-400">Truth</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Answer honestly</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <Flame className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-red-400">Dare</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Prove yourself</p>
              </div>
            </div>

            {/* Game info */}
            <div className="flex items-center justify-center gap-4 mb-4 p-3 rounded-xl bg-white/5">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
                  <Coins className="w-3.5 h-3.5" />{tokenReward}
                </p>
                <p className="text-[9px] text-slate-500">Winner</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-violet-400 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5" />{xpReward}
                </p>
                <p className="text-[9px] text-slate-500">XP</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{TOTAL_ROUNDS}</p>
                <p className="text-[9px] text-slate-500">Rounds</p>
              </div>
            </div>

            {/* Intensity escalation preview */}
            <div className="flex items-center justify-center gap-1 mb-4">
              {(['mild', 'medium', 'spicy', 'fire'] as Intensity[]).map((int, i) => (
                <div key={int} className="flex items-center">
                  <span className="text-sm">{INTENSITY_CONFIG[int].emoji}</span>
                  {i < 3 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mb-4">Intensity escalates each round!</p>

            {/* Start button */}
            <ActionButton onClick={startGame} color="from-rose-600 to-red-500">
              <Target className="w-4 h-4" />
              {isVsBot ? 'Play vs Bot' : 'Choose Your Fate!'}
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // CHOOSE PHASE
  // ============================================
  if (phase === 'choose') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-rose-500/30 overflow-hidden">
          <GameHeader
            icon="🎯"
            title="Truth or Dare"
            subtitle={`Round ${round + 1} of ${TOTAL_ROUNDS}`}
            onClose={onClose}
            rightElement={<ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />}
          />

          {/* Intensity badge */}
          <div className="mx-4 mb-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${intensityConfig.bgColor}`}>
              <span className="text-sm">{intensityConfig.emoji}</span>
              <span className={`text-xs font-bold ${intensityConfig.color}`}>{intensityConfig.label}</span>
              <span className="text-[9px] text-slate-500">• {intensityConfig.points} pts</span>
            </div>
          </div>

          {/* Players */}
          <div className="flex gap-3 mx-4 mb-4">
            <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-violet-600/10 border border-violet-500/20">
              <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[9px] text-slate-500">{playerScore} pts</p>
              </div>
            </div>
            <div className="flex items-center text-sm font-black text-slate-600">VS</div>
            <div className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
              <PlayerAvatar src={opponentData.avatar} name={opponentData.name} size="sm" ring="ring-white/20" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{opponentData.name}</p>
                <p className="text-[9px] text-slate-500">{opponentScore} pts</p>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 text-center">
            <p className="text-lg font-black text-white mb-3">Choose your fate!</p>

            {/* Truth / Dare buttons */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => handleChoice('truth')}
                className="py-4 rounded-xl bg-gradient-to-br from-cyan-600/30 to-cyan-500/10 border-2 border-cyan-500/40 hover:border-cyan-400 transition-all hover:scale-105 active:scale-95"
              >
                <Eye className="w-7 h-7 text-cyan-400 mx-auto mb-1" />
                <p className="text-sm font-black text-cyan-300">Truth</p>
                <p className="text-[9px] text-cyan-400/60">Answer honestly</p>
              </button>
              <button
                onClick={() => handleChoice('dare')}
                className="py-4 rounded-xl bg-gradient-to-br from-red-600/30 to-red-500/10 border-2 border-red-500/40 hover:border-red-400 transition-all hover:scale-105 active:scale-95"
              >
                <Flame className="w-7 h-7 text-red-400 mx-auto mb-1" />
                <p className="text-sm font-black text-red-300">Dare</p>
                <p className="text-[9px] text-red-400/60">Prove yourself</p>
              </button>
            </div>

            {/* Double Dare option in final round */}
            {isFinalRound && (
              <button
                onClick={() => handleChoice('double-dare')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600/30 to-amber-500/10 border-2 border-yellow-500/40 hover:border-yellow-400 transition-all hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">💥</span>
                  <div className="text-left">
                    <p className="text-sm font-black text-yellow-300">Double Dare</p>
                    <p className="text-[9px] text-yellow-400/60">Final round only • 2x points!</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // PROMPT PHASE (brief reveal of the prompt)
  // ============================================
  if (phase === 'prompt') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-rose-500/30 overflow-hidden">
          <GameHeader
            icon="🎯"
            title="Truth or Dare"
            subtitle={`Round ${round + 1}`}
            onClose={onClose}
          />

          <div className="flex flex-col items-center justify-center py-8 px-4">
            {/* Choice badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-4 ${
              choice === 'truth' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-red-500/10 border-red-500/20'
            }`}>
              <span className="text-sm">{choice === 'truth' ? '👁️' : choice === 'double-dare' ? '💥' : '🔥'}</span>
              <span className={`text-xs font-bold ${choice === 'truth' ? 'text-cyan-400' : 'text-red-400'}`}>
                {choice === 'truth' ? 'TRUTH' : choice === 'double-dare' ? 'DOUBLE DARE' : 'DARE'}
              </span>
            </div>

            {/* Prompt reveal */}
            <div className={`w-full rounded-xl p-6 text-center border ${
              choice === 'truth' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-red-500/10 border-red-500/20'
            }`}>
              <p className="text-lg font-bold text-white leading-relaxed">
                "{currentPrompt}"
              </p>
            </div>

            {/* Intensity indicator */}
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-sm">{intensityConfig.emoji}</span>
              <span className={`text-xs font-bold ${intensityConfig.color}`}>{intensityConfig.label}</span>
              {choice === 'double-dare' && (
                <span className="text-xs font-bold text-yellow-400 ml-1">• 2x POINTS</span>
              )}
            </div>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RESPOND PHASE
  // ============================================
  if (phase === 'respond') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-rose-500/30 overflow-hidden">
          <GameHeader
            icon="🎯"
            title={choice === 'truth' ? 'Truth' : choice === 'double-dare' ? 'Double Dare' : 'Dare'}
            subtitle={`Round ${round + 1} of ${TOTAL_ROUNDS}`}
            onClose={onClose}
            rightElement={
              <span className={`text-xs font-bold ${intensityConfig.color}`}>
                {intensityConfig.emoji} {intensityConfig.label}
              </span>
            }
          />

          {/* Timer */}
          <div className="px-4 mb-3">
            <ProgressBar
              value={timer}
              max={RESPONSE_TIMER}
              color={choice === 'truth' ? 'from-cyan-500 to-blue-500' : 'from-red-500 to-orange-500'}
              isLow={timer <= 5}
            />
          </div>

          {/* Prompt */}
          <div className="mx-4 mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">"{currentPrompt}"</p>
          </div>

          {/* Player response input */}
          <div className="mx-4 mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="sm" />
              <span className="text-xs font-bold text-white">{currentUser.name}</span>
              {playerSubmitted && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400">SUBMITTED</span>
              )}
            </div>
            <textarea
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              disabled={playerSubmitted}
              placeholder={choice === 'truth' ? 'Type your honest answer...' : 'Describe what you did/will do...'}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 resize-none focus:outline-none focus:border-violet-500/40 disabled:opacity-50 h-20"
              maxLength={200}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-slate-600">{playerInput.length}/200</span>
              {!playerSubmitted && (
                <button
                  onClick={handleSubmitResponse}
                  disabled={!playerInput.trim()}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 ${
                    choice === 'truth'
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  Submit
                </button>
              )}
            </div>
          </div>

          {/* Opponent status */}
          <div className="mx-4 mb-4">
            <div className="flex items-center gap-2">
              <PlayerAvatar src={opponentData.avatar} name={opponentData.name} size="sm" ring="ring-white/20" />
              <span className="text-xs font-bold text-white">{opponentData.name}</span>
              {opponentSubmitted ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400">SUBMITTED</span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/10 text-slate-400 animate-pulse">TYPING...</span>
              )}
            </div>
          </div>

          {/* Auto-submit on timeout */}
          {timer <= 0 && !playerSubmitted && (
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  setPlayerInput(prev => prev || '(ran out of time)');
                  setPlayerSubmitted(true);
                }}
                className="w-full py-2 rounded-xl bg-white/5 text-slate-400 text-xs"
              >
                Time&apos;s up! Tap to continue
              </button>
            </div>
          )}
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
        <div className="glass-panel rounded-2xl border border-rose-500/30 overflow-hidden">
          <GameHeader
            icon="🎯"
            title="Responses Revealed!"
            subtitle={`Round ${round + 1}`}
            onClose={onClose}
          />

          {/* Prompt */}
          <div className="mx-4 mb-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-slate-300 font-medium leading-relaxed">"{currentPrompt}"</p>
          </div>

          {/* Player response */}
          <div className="mx-4 mb-2 p-3 rounded-xl bg-violet-600/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="sm" />
              <span className="text-xs font-bold text-white">{currentUser.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                choice === 'truth' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {choice === 'truth' ? 'TRUTH' : choice === 'double-dare' ? '2X DARE' : 'DARE'}
              </span>
            </div>
            <p className="text-sm text-white leading-relaxed">{playerInput || '(no response)'}</p>
          </div>

          {/* Opponent response */}
          <div className="mx-4 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <PlayerAvatar src={opponentData.avatar} name={opponentData.name} size="sm" ring="ring-white/20" />
              <span className="text-xs font-bold text-white">{opponentData.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                choice === 'truth' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {choice === 'truth' ? 'TRUTH' : choice === 'double-dare' ? '2X DARE' : 'DARE'}
              </span>
            </div>
            <p className="text-sm text-white leading-relaxed">{opponentInput || '(no response)'}</p>
          </div>

          {/* Vote prompt */}
          <div className="px-4 pb-4">
            <p className="text-xs text-slate-400 text-center mb-2 font-medium">Who had the better response?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleVote('player')}
                disabled={!!playerVote}
                className={`py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  playerVote === 'player'
                    ? 'border-yellow-400 bg-yellow-500/10'
                    : 'border-violet-500/30 bg-violet-600/10 hover:border-violet-400'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 mx-auto mb-1 ${playerVote === 'player' ? 'text-yellow-400' : 'text-violet-400'}`} />
                <p className="text-xs font-bold text-white">{currentUser.name}</p>
              </button>
              <button
                onClick={() => handleVote('opponent')}
                disabled={!!playerVote}
                className={`py-3 rounded-xl border-2 transition-all active:scale-95 ${
                  playerVote === 'opponent'
                    ? 'border-yellow-400 bg-yellow-500/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 mx-auto mb-1 ${playerVote === 'opponent' ? 'text-yellow-400' : 'text-slate-400'}`} />
                <p className="text-xs font-bold text-white">{opponentData.name}</p>
              </button>
            </div>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // ROUND RESULT PHASE
  // ============================================
  if (phase === 'roundResult') {
    const winner = playerVotes > opponentVotes ? 'player' : opponentVotes > playerVotes ? 'opponent' : 'tie';
    const multiplier = choice === 'double-dare' ? 2 : 1;
    const points = intensityConfig.points * multiplier;

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-rose-500/30 overflow-hidden">
          <GameHeader
            icon="🎯"
            title="Round Result"
            subtitle={`Round ${round + 1} of ${TOTAL_ROUNDS}`}
            onClose={onClose}
            rightElement={<ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />}
          />

          <div className="px-4 py-4 text-center">
            {/* Winner announcement */}
            <div className="mb-4">
              <span className="text-5xl block mb-2">
                {winner === 'player' ? '🏆' : winner === 'opponent' ? '😬' : '🤝'}
              </span>
              <h3 className="text-xl font-black text-white">
                {winner === 'player'
                  ? 'You Won This Round!'
                  : winner === 'opponent'
                  ? `${opponentData.name} Wins!`
                  : 'It\'s a Tie!'}
              </h3>
            </div>

            {/* Vote breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-xl border ${winner === 'player' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/10'}`}>
                <p className="text-xs text-slate-400 mb-1">{currentUser.name}</p>
                <p className="text-2xl font-black text-white">{playerVotes}</p>
                <p className="text-[9px] text-slate-500">votes</p>
              </div>
              <div className={`p-3 rounded-xl border ${winner === 'opponent' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-white/10'}`}>
                <p className="text-xs text-slate-400 mb-1">{opponentData.name}</p>
                <p className="text-2xl font-black text-white">{opponentVotes}</p>
                <p className="text-[9px] text-slate-500">votes</p>
              </div>
            </div>

            {/* Points awarded */}
            <div className="mb-4 p-2 rounded-lg bg-white/5">
              <p className="text-xs text-slate-400">
                {intensityConfig.emoji} {intensityConfig.label} • {intensityConfig.points} pts
                {choice === 'double-dare' && ' • 2x multiplier'}
                {' = '}<span className="text-white font-bold">{points} pts</span>
              </p>
            </div>

            {/* Badges earned this round */}
            {choice !== 'truth' && badges.find(b => b.id === BADGE_DARE_DEVIL.id) && round === 0 && (
              <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2">
                <span className="text-lg">😈</span>
                <span className="text-xs font-bold text-red-300">Dare Devil Badge Earned!</span>
              </div>
            )}

            <ActionButton onClick={handleNextRound} color="from-rose-600 to-red-500">
              {round + 1 >= TOTAL_ROUNDS ? 'See Final Results' : 'Next Round'}
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // FINAL RESULTS PHASE
  // ============================================
  if (phase === 'final') {
    const isWinner = playerScore >= opponentScore;
    const bestPlayerMoment = roundResults
      .filter(r => r.winner === 'player')
      .sort((a, b) => b.playerVotes - a.playerVotes)[0];
    const bestOpponentMoment = roundResults
      .filter(r => r.winner === 'opponent')
      .sort((a, b) => b.opponentVotes - a.opponentVotes)[0];

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl border border-rose-500/30 overflow-hidden">
          <GameHeader icon="🎯" title="Game Over!" subtitle="Truth or Dare" onClose={onClose} />

          <div className="px-4 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Winner hero */}
            <div className="text-center mb-4">
              <span className="text-5xl block mb-2">{isWinner ? '🏆' : '👏'}</span>
              <h3 className="text-xl font-black text-white">
                {isWinner ? 'You Win!' : `${opponentData.name} Wins!`}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {playerScore} - {opponentScore}
              </p>
            </div>

            {/* Badges earned */}
            {badges.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Badges Earned</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {badges.map(badge => (
                    <div key={badge.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <span className="text-sm">{badge.icon}</span>
                      <div>
                        <p className="text-[10px] font-bold text-white">{badge.name}</p>
                        <p className="text-[8px] text-slate-500">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best moments */}
            <div className="mb-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Best Moments</p>
              <div className="space-y-2">
                {bestPlayerMoment && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-yellow-900/20 to-amber-900/10 border border-yellow-500/20">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-[9px] font-bold text-yellow-400">YOUR BEST</span>
                    </div>
                    <p className="text-xs text-white font-medium truncate">"{bestPlayerMoment.playerResponse}"</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {bestPlayerMoment.choice === 'truth' ? '👁️ Truth' : '🔥 Dare'} • {bestPlayerMoment.playerVotes} votes
                    </p>
                  </div>
                )}
                {bestOpponentMoment && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-3 h-3 text-slate-500" />
                      <span className="text-[9px] font-bold text-slate-500">THEIR BEST</span>
                    </div>
                    <p className="text-xs text-white font-medium truncate">"{bestOpponentMoment.opponentResponse}"</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {bestOpponentMoment.choice === 'truth' ? '👁️ Truth' : '🔥 Dare'} • {bestOpponentMoment.opponentVotes} votes
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Round-by-round summary */}
            <div className="mb-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Round Summary</p>
              <div className="space-y-1.5">
                {roundResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <span className="text-sm">{INTENSITY_CONFIG[r.intensity].emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-400 truncate">
                        R{r.round}: {r.choice === 'truth' ? 'Truth' : r.choice === 'double-dare' ? '2x Dare' : 'Dare'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold ${
                      r.winner === 'player' ? 'text-emerald-400' : r.winner === 'opponent' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {r.winner === 'player' ? 'WIN' : r.winner === 'opponent' ? 'LOSS' : 'TIE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Token reward */}
            <div className="mb-4 p-3 rounded-xl bg-white/5 text-center">
              <p className="text-xs text-slate-400">Reward</p>
              <p className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                <Coins className="w-4 h-4" />
                {isWinner ? tokenReward : Math.floor(tokenReward / 3)} ORRA
              </p>
              <p className="text-xs text-violet-400 flex items-center justify-center gap-1 mt-1">
                <Zap className="w-3.5 h-3.5" />
                {isWinner ? xpReward : Math.floor(xpReward / 3)} XP
              </p>
            </div>

            {/* Finish button */}
            <ActionButton onClick={handleFinish} color="from-rose-600 to-red-500">
              <Award className="w-4 h-4" />
              Collect & Exit
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  return null;
}

// ============================================
// HELPER: Small chevron for intensity indicator
// ============================================
function ChevronSmall() {
  return (
    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
