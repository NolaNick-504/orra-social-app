'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuraStore } from '@/store/aura-store';
import {
  GameHeader,
  ActionButton,
  ProgressBar,
  PlayerAvatar,
  ScoreDisplay,
} from './game-types';
import {
  Palette,
  Swords,
  Bot,
  User,
  Clock,
  Trophy,
  Sparkles,
  Shield,
  ChevronRight,
  Zap,
  Target,
  RotateCcw,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ColorWarsProps {
  onBack: () => void;
}

type GamePhase = 'lobby' | 'playing' | 'roundResult' | 'sabotage' | 'results';
type GameMode = 'bot' | 'friend';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface RoundResult {
  round: number;
  targetColor: RGB;
  playerColor: RGB;
  opponentColor: RGB;
  playerScore: number;
  opponentScore: number;
  sabotage?: RGB; // tint applied to opponent's target
}

// ============================================
// CONSTANTS
// ============================================

const TOTAL_ROUNDS = 5;
const ROUND_TIME = 20;
const SABOTAGE_ROUND = 4; // after round 3 (0-indexed: round 3 is the 4th round, sabotage happens between 3 and 4)
const MAX_DISTANCE = 441; // sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
const SABOTAGE_SHIFT = 40;

const TARGET_COLORS: RGB[] = [
  // Easy pastels
  { r: 255, g: 182, b: 193 }, // Light pink
  { r: 173, g: 216, b: 230 }, // Light blue
  { r: 144, g: 238, b: 144 }, // Light green
  // Medium
  { r: 255, g: 165, b: 0 },   // Orange
  { r: 138, g: 43, b: 226 },  // Blue violet
  { r: 0, g: 206, b: 209 },   // Dark turquoise
  // Hard similar shades
  { r: 220, g: 20, b: 60 },   // Crimson
  { r: 199, g: 21, b: 133 },  // Medium violet red
  { r: 255, g: 215, b: 0 },   // Gold
  { r: 218, g: 165, b: 32 },  // Goldenrod (hard: similar to gold)
];

const BOT_NAMES = ['ChromaBot', 'PixelPete', 'HueMaster', 'ShadeShift', 'TintKing'];
const BOT_AVATARS = ['/images/avatars/nova-avatar.jpg', '/images/avatars/kai-avatar.jpg', '/images/avatars/zara-avatar.jpg'];

const SABOTAGE_TINTS: { name: string; color: string; tint: RGB }[] = [
  { name: 'Red Shift', color: 'bg-red-500', tint: { r: SABOTAGE_SHIFT, g: 0, b: 0 } },
  { name: 'Green Haze', color: 'bg-green-500', tint: { r: 0, g: SABOTAGE_SHIFT, b: 0 } },
  { name: 'Blue Wash', color: 'bg-blue-500', tint: { r: 0, g: 0, b: SABOTAGE_SHIFT } },
  { name: 'Cyan Splash', color: 'bg-cyan-400', tint: { r: 0, g: SABOTAGE_SHIFT / 2, b: SABOTAGE_SHIFT } },
  { name: 'Magenta Fog', color: 'bg-fuchsia-500', tint: { r: SABOTAGE_SHIFT, g: 0, b: SABOTAGE_SHIFT } },
  { name: 'Yellow Veil', color: 'bg-yellow-400', tint: { r: SABOTAGE_SHIFT, g: SABOTAGE_SHIFT, b: 0 } },
  { name: 'Purple Mist', color: 'bg-purple-500', tint: { r: SABOTAGE_SHIFT / 2, g: 0, b: SABOTAGE_SHIFT } },
  { name: 'Teal Storm', color: 'bg-teal-400', tint: { r: 0, g: SABOTAGE_SHIFT, b: SABOTAGE_SHIFT / 2 } },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function calculateScore(distance: number): number {
  const raw = 10 - (distance / (MAX_DISTANCE / 10));
  const score = Math.max(0, Math.round(raw));
  return Math.min(10, score);
}

function clampRGB(val: number): number {
  return Math.max(0, Math.min(255, Math.round(val)));
}

function botGuess(target: RGB): RGB {
  // Bot randomly offsets from target by 30-80 RGB units
  const offsetRange = 30 + Math.random() * 50;
  const angle1 = Math.random() * Math.PI * 2;
  const angle2 = Math.random() * Math.PI - Math.PI / 2;
  return {
    r: clampRGB(target.r + Math.round(Math.cos(angle1) * offsetRange)),
    g: clampRGB(target.g + Math.round(Math.sin(angle1) * offsetRange)),
    b: clampRGB(target.b + Math.round(Math.sin(angle2) * offsetRange * 0.7)),
  };
}

function applySabotageTint(target: RGB, tint: RGB): RGB {
  // Randomly apply ±shift on random channels
  const channels: ('r' | 'g' | 'b')[] = ['r', 'g', 'b'];
  const selectedChannels = channels.filter(() => Math.random() > 0.3); // pick 1-3 channels
  if (selectedChannels.length === 0) selectedChannels.push(channels[Math.floor(Math.random() * 3)]);

  const result = { ...target };
  for (const ch of selectedChannels) {
    const sign = Math.random() > 0.5 ? 1 : -1;
    result[ch] = clampRGB(target[ch] + sign * tint[ch]);
  }
  return result;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getScoreLabel(score: number): { text: string; emoji: string; color: string } {
  if (score >= 15) return { text: 'PERFECT!', emoji: '🎯', color: 'text-yellow-300' };
  if (score >= 10) return { text: 'Excellent!', emoji: '🔥', color: 'text-emerald-400' };
  if (score >= 7) return { text: 'Great!', emoji: '✨', color: 'text-violet-400' };
  if (score >= 4) return { text: 'Not Bad', emoji: '👍', color: 'text-blue-400' };
  return { text: 'Try Harder', emoji: '💪', color: 'text-slate-400' };
}

// ============================================
// COLOR WARS GAME COMPONENT
// ============================================

export function ColorWars({ onBack }: ColorWarsProps) {
  const { earnTokens } = useAuraStore();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [gameMode, setGameMode] = useState<GameMode>('bot');
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [timerActive, setTimerActive] = useState(false);

  // Player state
  const [playerRGB, setPlayerRGB] = useState<RGB>({ r: 128, g: 128, b: 128 });
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  // Opponent info (bot)
  const [botName] = useState(() => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const [botAvatar] = useState(() => BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)]);

  // Round data
  const [roundTargets, setRoundTargets] = useState<RGB[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [opponentRGB, setOpponentRGB] = useState<RGB>({ r: 0, g: 0, b: 0 });
  const [lastPlayerScore, setLastPlayerScore] = useState(0);
  const [lastOpponentScore, setLastOpponentScore] = useState(0);

  // Sabotage
  const [playerSabotage, setPlayerSabotage] = useState<RGB | null>(null);
  const [opponentSabotage, setOpponentSabotage] = useState<RGB | null>(null);
  const [selectedSabotageIndex, setSelectedSabotageIndex] = useState<number | null>(null);

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Current target (may include sabotage tint)
  const currentTarget = (() => {
    if (currentRound >= roundTargets.length) return { r: 128, g: 128, b: 128 };
    const base = roundTargets[currentRound];
    if (playerSabotage && currentRound === SABOTAGE_ROUND) {
      return applySabotageTint(base, playerSabotage);
    }
    return base;
  })();

  // Opponent's target (bot gets sabotage from "opponent")
  const opponentTarget = (() => {
    if (currentRound >= roundTargets.length) return { r: 128, g: 128, b: 128 };
    const base = roundTargets[currentRound];
    if (opponentSabotage && currentRound === SABOTAGE_ROUND) {
      return applySabotageTint(base, opponentSabotage);
    }
    return base;
  })();

  // ============================================
  // START GAME
  // ============================================
  const startGame = useCallback((mode: GameMode) => {
    setGameMode(mode);
    // Pick 5 random target colors
    const shuffled = shuffleArray(TARGET_COLORS);
    const targets = shuffled.slice(0, TOTAL_ROUNDS);
    setRoundTargets(targets);
    setCurrentRound(0);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundResults([]);
    setPlayerSabotage(null);
    setOpponentSabotage(null);
    setSelectedSabotageIndex(null);
    setPlayerRGB({ r: 128, g: 128, b: 128 });
    setSubmitted(false);
    setTimeLeft(ROUND_TIME);
    setTimerActive(true);
    setPhase('playing');
  }, []);

  // ============================================
  // TIMER EFFECT
  // ============================================
  useEffect(() => {
    if (!timerActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // ============================================
  // SUBMIT ANSWER
  // ============================================
  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    setTimerActive(false);

    // Calculate player score
    const pDist = colorDistance(playerRGB, currentTarget);
    const pScore = calculateScore(pDist);
    const pBonus = pDist <= 10 ? 5 : 0; // perfect match bonus
    const pTotal = Math.min(15, pScore + pBonus); // cap at 15 (10 + 5 bonus)

    // Bot guess & score
    const botColor = botGuess(opponentTarget);
    setOpponentRGB(botColor);

    const oDist = colorDistance(botColor, opponentTarget);
    const oScore = calculateScore(oDist);
    const oBonus = oDist <= 10 ? 5 : 0;
    const oTotal = Math.min(15, oScore + oBonus);

    setLastPlayerScore(pTotal);
    setLastOpponentScore(oTotal);
    setPlayerScore(prev => prev + pTotal);
    setOpponentScore(prev => prev + oTotal);

    const result: RoundResult = {
      round: currentRound + 1,
      targetColor: currentTarget,
      playerColor: { ...playerRGB },
      opponentColor: botColor,
      playerScore: pTotal,
      opponentScore: oTotal,
      sabotage: playerSabotage && currentRound === SABOTAGE_ROUND ? playerSabotage : undefined,
    };
    setRoundResults(prev => [...prev, result]);

    // Show round result
    setPhase('roundResult');
  }, [submitted, playerRGB, currentTarget, opponentTarget, currentRound, playerSabotage]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && timerActive === false && phase === 'playing' && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, timerActive, phase, submitted, handleSubmit]);

  // ============================================
  // NEXT ROUND
  // ============================================
  const handleNextRound = useCallback(() => {
    const nextRound = currentRound + 1;

    if (nextRound >= TOTAL_ROUNDS) {
      // Game over
      setPhase('results');
      const winner = playerScore > opponentScore;
      if (winner) {
        earnTokens(5, 'Color Wars victory');
      }
      return;
    }

    // Check if sabotage round (between round 3 and 4, i.e., after index 2)
    if (nextRound === SABOTAGE_ROUND - 1 && !playerSabotage) {
      // Enter sabotage phase before round 4
      setPhase('sabotage');
      return;
    }

    // Normal next round
    setCurrentRound(nextRound);
    setPlayerRGB({ r: 128, g: 128, b: 128 });
    setSubmitted(false);
    setTimeLeft(ROUND_TIME);
    setTimerActive(true);
    setPhase('playing');
  }, [currentRound, playerScore, opponentScore, playerSabotage, earnTokens]);

  // ============================================
  // SABOTAGE SUBMIT
  // ============================================
  const handleSabotageSubmit = useCallback(() => {
    if (selectedSabotageIndex === null) return;

    const playerTint = SABOTAGE_TINTS[selectedSabotageIndex].tint;
    setPlayerSabotage(playerTint);

    // Bot picks a random sabotage
    const botSabotageIndex = Math.floor(Math.random() * SABOTAGE_TINTS.length);
    setOpponentSabotage(SABOTAGE_TINTS[botSabotageIndex].tint);

    // Move to the sabotage round
    setCurrentRound(SABOTAGE_ROUND - 1);
    setPlayerRGB({ r: 128, g: 128, b: 128 });
    setSubmitted(false);
    setTimeLeft(ROUND_TIME);
    setTimerActive(true);
    setPhase('playing');
  }, [selectedSabotageIndex]);

  // ============================================
  // LOBBY PHASE
  // ============================================
  if (phase === 'lobby') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Arena
        </button>

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-900/60 via-fuchsia-900/40 to-black p-6 border border-violet-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-3">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Color Wars</h2>
            <p className="text-sm text-slate-400">
              Mix RGB sliders to match target colors. Closest wins!
            </p>
          </div>
        </div>

        {/* Rules */}
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider">How It Works</h3>
          <div className="space-y-1.5">
            {[
              { icon: '🎯', text: 'Match the target color using RGB sliders' },
              { icon: '⏱️', text: `${ROUND_TIME} seconds per round, ${TOTAL_ROUNDS} rounds total` },
              { icon: '💎', text: 'Score based on accuracy, max 10pts + 5 bonus' },
              { icon: '🛡️', text: 'Sabotage round: tint your opponent\'s next target!' },
              { icon: '🏆', text: 'Winner earns +5 ORRA tokens' },
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="shrink-0">{rule.icon}</span>
                <span>{rule.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider px-1">Choose Mode</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => startGame('bot')}
              className="glass-panel rounded-2xl p-4 text-center hover:border-violet-500/30 transition-all group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 mb-2">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-bold text-white">vs Bot</h4>
              <p className="text-[10px] text-slate-500 mt-1">Quick match</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-violet-400 font-bold group-hover:text-violet-300">
                Play <ChevronRight className="w-3 h-3" />
              </div>
            </button>
            <button
              onClick={() => startGame('friend')}
              className="glass-panel rounded-2xl p-4 text-center hover:border-fuchsia-500/30 transition-all group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-600 to-pink-600 mb-2">
                <User className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-bold text-white">vs Friend</h4>
              <p className="text-[10px] text-slate-500 mt-1">Challenge a friend</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-fuchsia-400 font-bold group-hover:text-fuchsia-300">
                Play <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // PLAYING PHASE
  // ============================================
  if (phase === 'playing') {
    const isSabotageRound = currentRound === SABOTAGE_ROUND - 1 && playerSabotage;
    const distance = colorDistance(playerRGB, currentTarget);
    const estimatedScore = calculateScore(distance);
    const isPerfect = distance <= 10;

    return (
      <div className="fade-in space-y-3 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlayerAvatar
              src="/images/avatars/luna-avatar.jpg"
              name="You"
              size="sm"
              ring="ring-violet-400"
            />
            <div>
              <p className="text-xs font-bold text-white">You</p>
              <p className="text-[10px] text-violet-400 font-mono">{playerScore} pts</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-white">
              Round {currentRound + 1}/{TOTAL_ROUNDS}
            </p>
            {isSabotageRound && (
              <p className="text-[9px] text-red-400 font-bold animate-pulse">SABOTAGED!</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-bold text-white">{botName}</p>
              <p className="text-[10px] text-fuchsia-400 font-mono">{opponentScore} pts</p>
            </div>
            <PlayerAvatar
              src={botAvatar}
              name={botName}
              size="sm"
              ring="ring-fuchsia-400"
            />
          </div>
        </div>

        {/* Timer */}
        <ProgressBar
          value={timeLeft}
          max={ROUND_TIME}
          color="from-violet-500 to-fuchsia-500"
          isLow={timeLeft <= 5}
        />

        {/* Color Comparison */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-center gap-4">
            {/* Target */}
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Target</p>
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-white/10 shadow-lg transition-all"
                style={{ backgroundColor: rgbToHex(currentTarget.r, currentTarget.g, currentTarget.b) }}
              />
              <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                {rgbToHex(currentTarget.r, currentTarget.g, currentTarget.b).toUpperCase()}
              </p>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-1">
              <Swords className="w-5 h-5 text-violet-400" />
              <p className="text-[9px] text-slate-500 font-bold">VS</p>
            </div>

            {/* Your Mix */}
            <div className="text-center">
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-2">Your Mix</p>
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-violet-500/30 shadow-lg shadow-violet-500/10 transition-all"
                style={{ backgroundColor: rgbToHex(playerRGB.r, playerRGB.g, playerRGB.b) }}
              />
              <p className="text-[10px] text-violet-400 font-mono mt-1.5">
                {rgbToHex(playerRGB.r, playerRGB.g, playerRGB.b).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Live Score Preview */}
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Distance:</span>
              <span className={`text-xs font-bold ${distance <= 50 ? 'text-emerald-400' : distance <= 150 ? 'text-yellow-400' : 'text-red-400'}`}>
                {Math.round(distance)}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${isPerfect ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
              <Zap className={`w-3.5 h-3.5 ${isPerfect ? 'text-yellow-400' : 'text-slate-400'}`} />
              <span className="text-xs text-slate-400">Est:</span>
              <span className={`text-xs font-bold ${isPerfect ? 'text-yellow-400' : 'text-white'}`}>
                {estimatedScore}{isPerfect ? '+5' : ''} pts
              </span>
            </div>
          </div>
        </div>

        {/* RGB Sliders */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mix Your Color</p>

          {/* R Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400">R</span>
              <span className="text-xs font-mono text-red-300 bg-red-500/10 px-2 py-0.5 rounded-md">
                {playerRGB.r}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-black to-red-500 opacity-30" />
              <input
                type="range"
                min={0}
                max={255}
                value={playerRGB.r}
                onChange={e => setPlayerRGB(prev => ({ ...prev, r: parseInt(e.target.value) }))}
                disabled={submitted}
                className="w-full h-2 appearance-none cursor-pointer relative z-10 accent-red-500"
                style={{
                  background: `linear-gradient(to right, #000 0%, #ef4444 100%)`,
                  height: '8px',
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>

          {/* G Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-green-400">G</span>
              <span className="text-xs font-mono text-green-300 bg-green-500/10 px-2 py-0.5 rounded-md">
                {playerRGB.g}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-black to-green-500 opacity-30" />
              <input
                type="range"
                min={0}
                max={255}
                value={playerRGB.g}
                onChange={e => setPlayerRGB(prev => ({ ...prev, g: parseInt(e.target.value) }))}
                disabled={submitted}
                className="w-full h-2 appearance-none cursor-pointer relative z-10 accent-green-500"
                style={{
                  background: `linear-gradient(to right, #000 0%, #22c55e 100%)`,
                  height: '8px',
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>

          {/* B Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">B</span>
              <span className="text-xs font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md">
                {playerRGB.b}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-black to-blue-500 opacity-30" />
              <input
                type="range"
                min={0}
                max={255}
                value={playerRGB.b}
                onChange={e => setPlayerRGB(prev => ({ ...prev, b: parseInt(e.target.value) }))}
                disabled={submitted}
                className="w-full h-2 appearance-none cursor-pointer relative z-10 accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #000 0%, #3b82f6 100%)`,
                  height: '8px',
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={() => setPlayerRGB({ r: 128, g: 128, b: 128 })}
            disabled={submitted}
            className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-all disabled:opacity-30"
          >
            <RotateCcw className="w-3 h-3" /> Reset to center
          </button>
        </div>

        {/* Submit Button */}
        {!submitted && (
          <ActionButton onClick={handleSubmit} disabled={submitted} color="from-violet-600 to-fuchsia-600">
            <Target className="w-4 h-4" />
            Submit Mix
          </ActionButton>
        )}
      </div>
    );
  }

  // ============================================
  // ROUND RESULT PHASE
  // ============================================
  if (phase === 'roundResult') {
    const result = roundResults[roundResults.length - 1];
    if (!result) return null;

    const playerLabel = getScoreLabel(lastPlayerScore);
    const opponentLabel = getScoreLabel(lastOpponentScore);
    const roundWinner = lastPlayerScore > lastOpponentScore ? 'player' : lastPlayerScore < lastOpponentScore ? 'opponent' : 'tie';

    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">Round {currentRound + 1} Result</p>
          <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
        </div>

        {/* Color comparison */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Target */}
            <div className="text-center">
              <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Target</p>
              <div
                className="w-16 h-16 rounded-xl border border-white/10"
                style={{ backgroundColor: rgbToHex(result.targetColor.r, result.targetColor.g, result.targetColor.b) }}
              />
            </div>

            {/* Player */}
            <div className="text-center">
              <p className="text-[9px] text-violet-400 font-bold uppercase mb-1">You</p>
              <div
                className={`w-16 h-16 rounded-xl border-2 ${roundWinner === 'player' ? 'border-emerald-400 shadow-emerald-400/20 shadow-lg' : 'border-violet-500/30'}`}
                style={{ backgroundColor: rgbToHex(result.playerColor.r, result.playerColor.g, result.playerColor.b) }}
              />
              <p className={`text-xs font-black mt-1 ${playerLabel.color}`}>
                +{lastPlayerScore}
              </p>
            </div>

            {/* Opponent */}
            <div className="text-center">
              <p className="text-[9px] text-fuchsia-400 font-bold uppercase mb-1">{botName}</p>
              <div
                className={`w-16 h-16 rounded-xl border-2 ${roundWinner === 'opponent' ? 'border-emerald-400 shadow-emerald-400/20 shadow-lg' : 'border-fuchsia-500/30'}`}
                style={{ backgroundColor: rgbToHex(result.opponentColor.r, result.opponentColor.g, result.opponentColor.b) }}
              />
              <p className={`text-xs font-black mt-1 ${opponentLabel.color}`}>
                +{lastOpponentScore}
              </p>
            </div>
          </div>

          {/* Round verdict */}
          <div className="text-center">
            {roundWinner === 'player' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">You won this round!</span>
              </div>
            ) : roundWinner === 'opponent' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <Swords className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-bold text-red-400">{botName} won this round!</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">It's a tie!</span>
              </div>
            )}
          </div>

          {result.sabotage && (
            <div className="mt-3 flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
              <Shield className="w-3 h-3 text-red-400" />
              <span className="text-[10px] text-red-300 font-bold">Sabotage was active!</span>
            </div>
          )}
        </div>

        {/* Next / Results button */}
        <ActionButton onClick={handleNextRound} color="from-violet-600 to-fuchsia-600">
          {currentRound + 1 >= TOTAL_ROUNDS ? (
            <>
              <Trophy className="w-4 h-4" /> See Results
            </>
          ) : (
            <>
              Next Round <ChevronRight className="w-4 h-4" />
            </>
          )}
        </ActionButton>
      </div>
    );
  }

  // ============================================
  // SABOTAGE PHASE
  // ============================================
  if (phase === 'sabotage') {
    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-red-900/40 via-fuchsia-900/30 to-black p-5 border border-red-500/20">
          <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/10 rounded-full blur-3xl" />
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-orange-600 shadow-lg shadow-red-500/30 mb-3 animate-pulse">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Sabotage Round!</h2>
            <p className="text-xs text-slate-400">
              Pick a color tint to mess with {botName}&apos;s next target!
            </p>
          </div>
        </div>

        {/* Score display */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <PlayerAvatar
              src="/images/avatars/luna-avatar.jpg"
              name="You"
              size="sm"
              ring="ring-violet-400"
            />
            <span className="text-xs font-bold text-white">{playerScore} pts</span>
          </div>
          <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{opponentScore} pts</span>
            <PlayerAvatar
              src={botAvatar}
              name={botName}
              size="sm"
              ring="ring-fuchsia-400"
            />
          </div>
        </div>

        {/* Tint Selection Grid */}
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
            Choose Your Sabotage Tint
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SABOTAGE_TINTS.map((tint, index) => (
              <button
                key={index}
                onClick={() => setSelectedSabotageIndex(index)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedSabotageIndex === index
                    ? 'border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/10'
                    : 'border-white/10 bg-white/5 hover:border-red-500/30 hover:bg-white/8'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${tint.color} shadow-inner`} />
                  <div>
                    <p className={`text-xs font-bold ${selectedSabotageIndex === index ? 'text-red-300' : 'text-white'}`}>
                      {tint.name}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      ±{SABOTAGE_SHIFT} RGB shift
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected tint preview */}
        {selectedSabotageIndex !== null && (
          <div className="glass-panel rounded-xl p-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Preview Effect</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-[9px] text-slate-500 mb-1">Original</p>
                <div
                  className="w-14 h-14 rounded-lg border border-white/10"
                  style={{ backgroundColor: rgbToHex(roundTargets[SABOTAGE_ROUND - 1]?.r ?? 128, roundTargets[SABOTAGE_ROUND - 1]?.g ?? 128, roundTargets[SABOTAGE_ROUND - 1]?.b ?? 128) }}
                />
              </div>
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="text-center">
                <p className="text-[9px] text-red-400 mb-1">After Tint</p>
                <div
                  className="w-14 h-14 rounded-lg border border-red-500/30"
                  style={{
                    backgroundColor: rgbToHex(
                      ...Object.values(
                        applySabotageTint(
                          roundTargets[SABOTAGE_ROUND - 1] ?? { r: 128, g: 128, b: 128 },
                          SABOTAGE_TINTS[selectedSabotageIndex].tint
                        )
                      ) as [number, number, number]
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Sabotage */}
        <ActionButton
          onClick={handleSabotageSubmit}
          disabled={selectedSabotageIndex === null}
          color="from-red-600 to-orange-600"
        >
          <Shield className="w-4 h-4" />
          {selectedSabotageIndex !== null
            ? `Apply ${SABOTAGE_TINTS[selectedSabotageIndex].name}!`
            : 'Select a Tint First'}
        </ActionButton>
      </div>
    );
  }

  // ============================================
  // RESULTS PHASE
  // ============================================
  if (phase === 'results') {
    const isWinner = playerScore > opponentScore;
    const isTie = playerScore === opponentScore;
    const resultEmoji = isWinner ? '🏆' : isTie ? '🤝' : '😔';
    const resultText = isWinner ? 'Victory!' : isTie ? 'Draw!' : 'Defeated!';

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Result Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-900/60 via-fuchsia-900/40 to-black p-6 border border-violet-500/20">
          <div className="absolute top-0 right-0 w-36 h-36 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="relative text-center">
            <span className="text-5xl block mb-2">{resultEmoji}</span>
            <h2 className="text-2xl font-black text-white mb-1">{resultText}</h2>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">
                <PlayerAvatar
                  src="/images/avatars/luna-avatar.jpg"
                  name="You"
                  size="sm"
                  ring="ring-violet-400"
                />
                <span className="text-lg font-black text-violet-400">{playerScore}</span>
              </div>
              <span className="text-slate-500 text-sm font-bold">vs</span>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-fuchsia-400">{opponentScore}</span>
                <PlayerAvatar
                  src={botAvatar}
                  name={botName}
                  size="sm"
                  ring="ring-fuchsia-400"
                />
              </div>
            </div>
            {isWinner && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">+5 ORRA earned!</span>
              </div>
            )}
          </div>
        </div>

        {/* Round-by-Round Scorecard */}
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
            Round Scorecard
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {roundResults.map((result, i) => {
              const roundWinner = result.playerScore > result.opponentScore ? 'player' : result.playerScore < result.opponentScore ? 'opponent' : 'tie';
              return (
                <div
                  key={i}
                  className={`rounded-xl p-3 border ${
                    roundWinner === 'player'
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : roundWinner === 'opponent'
                      ? 'border-red-500/20 bg-red-500/5'
                      : 'border-yellow-500/20 bg-yellow-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">
                      Round {result.round}
                      {result.sabotage && (
                        <span className="ml-1.5 text-[9px] text-red-400 font-bold">🛡️ SABOTAGED</span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono">
                      <span className={`${roundWinner === 'player' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {result.playerScore}
                      </span>
                      <span className="text-slate-600 mx-1">-</span>
                      <span className={`${roundWinner === 'opponent' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {result.opponentScore}
                      </span>
                    </span>
                  </div>
                  {/* Color swatches */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-md border border-white/10 shrink-0"
                      style={{ backgroundColor: rgbToHex(result.targetColor.r, result.targetColor.g, result.targetColor.b) }}
                      title={`Target: ${rgbToHex(result.targetColor.r, result.targetColor.g, result.targetColor.b)}`}
                    />
                    <div className="w-px h-6 bg-white/10" />
                    <div
                      className="w-8 h-8 rounded-md border border-violet-500/20 shrink-0"
                      style={{ backgroundColor: rgbToHex(result.playerColor.r, result.playerColor.g, result.playerColor.b) }}
                      title={`You: ${rgbToHex(result.playerColor.r, result.playerColor.g, result.playerColor.b)}`}
                    />
                    <div className="w-px h-6 bg-white/10" />
                    <div
                      className="w-8 h-8 rounded-md border border-fuchsia-500/20 shrink-0"
                      style={{ backgroundColor: rgbToHex(result.opponentColor.r, result.opponentColor.g, result.opponentColor.b) }}
                      title={`${botName}: ${rgbToHex(result.opponentColor.r, result.opponentColor.g, result.opponentColor.b)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            style={{ width: `${Math.min(100, (result.playerScore / 15) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <ActionButton
            onClick={() => {
              setPhase('lobby');
              setRoundResults([]);
              setPlayerSabotage(null);
              setOpponentSabotage(null);
            }}
            color="from-violet-600 to-fuchsia-600"
          >
            <Sparkles className="w-4 h-4" />
            Play Again
          </ActionButton>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all"
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default ColorWars;
