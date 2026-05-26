'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuraStore } from '@/store/aura-store';
import {
  GameHeader, ActionButton, ProgressBar, PlayerAvatar, ScoreDisplay,
} from './game-types';
import {
  ArrowLeft, Trophy, Zap, Coins, Minus, Plus, Eye, Sparkles,
  Users, Bot, ChevronRight, Star, Crown, Target, CircleDot,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface PredictItProps {
  onBack: () => void;
}

interface Outcome {
  label: string;
  odds: number; // multiplier e.g. 2x, 3x, 5x
  emoji: string;
}

interface Scenario {
  question: string;
  outcomes: Outcome[];
  category: string;
}

interface BetRecord {
  scenarioIndex: number;
  outcomeIndex: number;
  amount: number;
}

interface BotBetRecord {
  scenarioIndex: number;
  outcomeIndex: number;
  amount: number;
}

type GamePhase = 'lobby' | 'playing' | 'betting' | 'resolution' | 'roundSummary' | 'results';

// ============================================
// SCENARIO BANK (12+ scenarios)
// ============================================

const SCENARIO_BANK: Scenario[] = [
  {
    question: "What's the most used app on your phone?",
    category: 'Tech',
    outcomes: [
      { label: 'Social Media', odds: 2, emoji: '📱' },
      { label: 'Messaging', odds: 3, emoji: '💬' },
      { label: 'Gaming', odds: 4, emoji: '🎮' },
      { label: 'Camera', odds: 5, emoji: '📸' },
    ],
  },
  {
    question: 'You find $100, what do you do?',
    category: 'Money',
    outcomes: [
      { label: 'Save it', odds: 3, emoji: '🏦' },
      { label: 'Spend it now', odds: 2, emoji: '🛍️' },
      { label: 'Give it away', odds: 5, emoji: '🎁' },
      { label: 'Invest it', odds: 4, emoji: '📈' },
    ],
  },
  {
    question: 'Zombie apocalypse weapon?',
    category: 'Survival',
    outcomes: [
      { label: 'Bat', odds: 2, emoji: '🏏' },
      { label: 'Gun', odds: 3, emoji: '🔫' },
      { label: 'Sword', odds: 4, emoji: '⚔️' },
      { label: 'Run', odds: 5, emoji: '🏃' },
    ],
  },
  {
    question: 'Best pizza topping?',
    category: 'Food',
    outcomes: [
      { label: 'Pepperoni', odds: 2, emoji: '🍕' },
      { label: 'Cheese', odds: 3, emoji: '🧀' },
      { label: 'Hawaiian', odds: 5, emoji: '🍍' },
      { label: 'Veggies', odds: 4, emoji: '🥦' },
    ],
  },
  {
    question: 'If you could have a superpower?',
    category: 'Fantasy',
    outcomes: [
      { label: 'Flying', odds: 3, emoji: '🦅' },
      { label: 'Invisibility', odds: 2, emoji: '👻' },
      { label: 'Telepathy', odds: 4, emoji: '🧠' },
      { label: 'Super strength', odds: 5, emoji: '💪' },
    ],
  },
  {
    question: 'Dream vacation destination?',
    category: 'Travel',
    outcomes: [
      { label: 'Beach', odds: 2, emoji: '🏖️' },
      { label: 'Mountains', odds: 3, emoji: '🏔️' },
      { label: 'City', odds: 4, emoji: '🌃' },
      { label: 'Space', odds: 5, emoji: '🚀' },
    ],
  },
  {
    question: 'Most annoying habit?',
    category: 'Social',
    outcomes: [
      { label: 'Talking loud', odds: 3, emoji: '🗣️' },
      { label: 'Being late', odds: 2, emoji: '⏰' },
      { label: 'Phone addiction', odds: 2, emoji: '📱' },
      { label: 'Interrupting', odds: 4, emoji: '✋' },
    ],
  },
  {
    question: "You're on a reality show, what's your strategy?",
    category: 'Strategy',
    outcomes: [
      { label: 'Alliance', odds: 3, emoji: '🤝' },
      { label: 'Solo', odds: 4, emoji: '🧍' },
      { label: 'Drama', odds: 5, emoji: '🎭' },
      { label: 'Laying low', odds: 2, emoji: '🤫' },
    ],
  },
  {
    question: 'What would you eat for the rest of your life?',
    category: 'Food',
    outcomes: [
      { label: 'Pizza', odds: 2, emoji: '🍕' },
      { label: 'Tacos', odds: 3, emoji: '🌮' },
      { label: 'Sushi', odds: 4, emoji: '🍣' },
      { label: 'Burgers', odds: 3, emoji: '🍔' },
    ],
  },
  {
    question: 'Your last meal?',
    category: 'Food',
    outcomes: [
      { label: 'Steak', odds: 2, emoji: '🥩' },
      { label: 'Pasta', odds: 3, emoji: '🍝' },
      { label: 'Seafood', odds: 4, emoji: '🦞' },
      { label: 'Dessert', odds: 5, emoji: '🍰' },
    ],
  },
  {
    question: 'Pick a decade to live in',
    category: 'History',
    outcomes: [
      { label: '80s', odds: 3, emoji: '🕺' },
      { label: '90s', odds: 2, emoji: '👾' },
      { label: '2000s', odds: 4, emoji: '💿' },
      { label: 'Future', odds: 5, emoji: '🔮' },
    ],
  },
  {
    question: 'Which pet would you choose?',
    category: 'Lifestyle',
    outcomes: [
      { label: 'Dog', odds: 2, emoji: '🐕' },
      { label: 'Cat', odds: 3, emoji: '🐱' },
      { label: 'Fish', odds: 5, emoji: '🐠' },
      { label: 'Hamster', odds: 4, emoji: '🐹' },
    ],
  },
  {
    question: 'If you were stranded on an island, what would you want most?',
    category: 'Survival',
    outcomes: [
      { label: 'Water', odds: 2, emoji: '💧' },
      { label: 'Food', odds: 3, emoji: '🍎' },
      { label: 'Phone', odds: 5, emoji: '📱' },
      { label: 'Friend', odds: 4, emoji: '🤗' },
    ],
  },
  {
    question: "What's your ideal Friday night?",
    category: 'Lifestyle',
    outcomes: [
      { label: 'Party', odds: 3, emoji: '🎉' },
      { label: 'Movie night', odds: 2, emoji: '🎬' },
      { label: 'Gaming', odds: 4, emoji: '🎮' },
      { label: 'Sleep', odds: 5, emoji: '😴' },
    ],
  },
];

// ============================================
// CONSTANTS
// ============================================

const STARTING_BALANCE = 20;
const MAX_BET = 5;
const MIN_BET = 1;
const TOTAL_ROUNDS = 5;
const WIN_REWARD = 6; // Real ORRA tokens for winning
const BOT_NAMES = ['CrystalBot', 'Oracle AI', 'Prophet-X', 'Seer-7', 'MysticBot', 'Fortune AI'];
const BOT_AVATARS = ['/api/uploads?path=images/avatars/nova-avatar.jpg', '/api/uploads?path=images/avatars/zara-avatar.jpg', '/api/uploads?path=images/avatars/luna-avatar.jpg'];

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Weighted random selection — lower odds = higher probability */
function weightedRandomOutcome(outcomes: Outcome[]): number {
  // Weight is inversely proportional to odds: 1/odds
  const weights = outcomes.map((o) => 1 / o.odds);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  return outcomes.length - 1;
}

/** Shuffle array (Fisher-Yates) */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Bot makes a bet: random outcome, 1-3 tokens */
function botMakeBet(outcomes: Outcome[]): { outcomeIndex: number; amount: number } {
  const outcomeIndex = Math.floor(Math.random() * outcomes.length);
  const amount = Math.floor(Math.random() * 3) + 1; // 1-3
  return { outcomeIndex, amount };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PredictIt({ onBack }: PredictItProps) {
  const { earnTokens, currentUserProfile } = useAuraStore();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [isVsBot, setIsVsBot] = useState(true);
  const [round, setRound] = useState(0);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [playerBalance, setPlayerBalance] = useState(STARTING_BALANCE);
  const [botBalance, setBotBalance] = useState(STARTING_BALANCE);

  // Current round state
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(MIN_BET);
  const [playerBets, setPlayerBets] = useState<BetRecord[]>([]);
  const [botBets, setBotBets] = useState<BotBetRecord[]>([]);
  const [winningOutcome, setWinningOutcome] = useState<number | null>(null);
  const [playerEarnings, setPlayerEarnings] = useState(0);
  const [botEarnings, setBotEarnings] = useState(0);

  // Animation
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealStep, setRevealStep] = useState(0); // 0=none, 1=showing crystal ball, 2=showing winner

  // Bot identity
  const [botName] = useState(() => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const [botAvatar] = useState(() => BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)]);

  // Player identity
  const playerName = currentUserProfile?.name || 'You';
  const playerAvatar = currentUserProfile?.avatar || '/api/uploads?path=images/avatars/founder-avatar.jpg';

  // Select 5 random scenarios
  const selectScenarios = useCallback(() => {
    const shuffled = shuffleArray(SCENARIO_BANK);
    return shuffled.slice(0, TOTAL_ROUNDS);
  }, []);

  // Start game
  const startGame = useCallback((vsBot: boolean) => {
    setIsVsBot(vsBot);
    setScenarios(selectScenarios());
    setPlayerBalance(STARTING_BALANCE);
    setBotBalance(STARTING_BALANCE);
    setRound(0);
    setPlayerBets([]);
    setBotBets([]);
    setPhase('playing');
    setSelectedOutcome(null);
    setBetAmount(MIN_BET);
    setWinningOutcome(null);
    setPlayerEarnings(0);
    setBotEarnings(0);
  }, [selectScenarios]);

  // Current scenario
  const currentScenario = scenarios[round] || null;

  // Handle outcome selection
  const handleSelectOutcome = (index: number) => {
    if (phase !== 'playing') return;
    setSelectedOutcome(index);
    setBetAmount(MIN_BET);
  };

  // Confirm bet
  const confirmBet = useCallback(() => {
    if (selectedOutcome === null || !currentScenario) return;
    if (betAmount > playerBalance) return;

    // Record player bet
    const playerBet: BetRecord = {
      scenarioIndex: round,
      outcomeIndex: selectedOutcome,
      amount: betAmount,
    };
    setPlayerBets((prev) => [...prev, playerBet]);

    // Bot makes bet
    const botBetResult = botMakeBet(currentScenario.outcomes);
    const botBetAmount = Math.min(botBetResult.amount, botBalance);
    const botBet: BotBetRecord = {
      scenarioIndex: round,
      outcomeIndex: botBetResult.outcomeIndex,
      amount: botBetAmount,
    };
    setBotBets((prev) => [...prev, botBet]);

    // Move to resolution phase with animation
    setPhase('resolution');
    setIsRevealing(true);
    setRevealStep(0);

    // Step 1: Crystal ball animation (1s)
    setTimeout(() => setRevealStep(1), 800);
    // Step 2: Reveal winning outcome (1.5s)
    setTimeout(() => {
      const winner = weightedRandomOutcome(currentScenario.outcomes);
      setWinningOutcome(winner);
      setRevealStep(2);

      // Calculate earnings
      const pBet = playerBet;
      const bBet = botBet;
      const winningOdds = currentScenario.outcomes[winner].odds;

      let pEarnings = 0;
      let bEarnings = 0;

      if (pBet.outcomeIndex === winner) {
        pEarnings = pBet.amount * winningOdds;
      }
      if (bBet.outcomeIndex === winner) {
        bEarnings = bBet.amount * winningOdds;
      }

      setPlayerEarnings(pEarnings);
      setBotEarnings(bEarnings);

      // Update balances
      setPlayerBalance((prev) => {
        const deducted = prev - pBet.amount;
        return Math.max(0, deducted + pEarnings);
      });
      setBotBalance((prev) => {
        const deducted = prev - bBet.amount;
        return Math.max(0, deducted + bEarnings);
      });

      setIsRevealing(false);
    }, 2000);
  }, [selectedOutcome, betAmount, playerBalance, botBalance, currentScenario, round]);

  // Next round
  const nextRound = useCallback(() => {
    if (round + 1 >= TOTAL_ROUNDS) {
      setPhase('results');
    } else {
      setRound((prev) => prev + 1);
      setSelectedOutcome(null);
      setBetAmount(MIN_BET);
      setWinningOutcome(null);
      setPlayerEarnings(0);
      setBotEarnings(0);
      setRevealStep(0);
      setPhase('playing');
    }
  }, [round]);

  // Award real ORRA on game end
  useEffect(() => {
    if (phase === 'results' && playerBalance > botBalance) {
      earnTokens(WIN_REWARD, 'Predict It: Won the prediction game!');
    }
  }, [phase, playerBalance, botBalance, earnTokens]);

  // Max bet based on balance
  const maxBetForBalance = Math.min(MAX_BET, playerBalance);

  // ============================================
  // LOBBY SCREEN
  // ============================================
  if (phase === 'lobby') {
    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        {/* Title & Crystal Ball */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-violet-500/20 mb-3 relative">
            <span className="text-4xl">🔮</span>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-violet-500" />
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Predict It
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Bet on outcomes. Read the crowd. Win ORRA.
          </p>
        </div>

        {/* How It Works */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" /> How It Works
          </h3>
          <div className="space-y-2">
            {[
              { step: '1', text: '5 rounds of fun predictions', icon: '🎯' },
              { step: '2', text: 'Pick an outcome & bet 1-5 tokens', icon: '💰' },
              { step: '3', text: 'Community answer is revealed', icon: '🔮' },
              { step: '4', text: 'Win = bet × odds. Lose = bet gone', icon: '⚡' },
              { step: '5', text: 'Most virtual ORRA wins +6 real ORRA!', icon: '🏆' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{item.icon}</span>
                <span className="text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-400" />
              Starting balance: {STARTING_BALANCE} virtual ORRA (separate from real tokens)
            </p>
          </div>
        </div>

        {/* Choose Opponent */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white text-center">Choose Opponent</h3>

          {/* vs Bot */}
          <button
            onClick={() => startGame(true)}
            className="w-full glass-panel rounded-2xl p-4 hover:border-violet-500/30 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center border border-violet-500/20">
                <Bot className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">vs Bot</h4>
                <p className="text-xs text-slate-400">Quick match against AI predictor</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
            </div>
          </button>

          {/* vs Friend */}
          <button
            onClick={() => startGame(false)}
            className="w-full glass-panel rounded-2xl p-4 hover:border-fuchsia-500/30 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-600/30 to-pink-600/30 flex items-center justify-center border border-fuchsia-500/20">
                <Users className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">vs Friend</h4>
                <p className="text-xs text-slate-400">Challenge a friend (simulated)</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-fuchsia-400 transition-colors" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RESULTS SCREEN
  // ============================================
  if (phase === 'results') {
    const isWinner = playerBalance > botBalance;
    const isTie = playerBalance === botBalance;
    const netGain = playerBalance - STARTING_BALANCE;
    const botNetGain = botBalance - STARTING_BALANCE;

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Winner Announcement */}
        <div className="glass-panel rounded-2xl p-6 text-center relative overflow-hidden">
          {/* Background glow */}
          {isWinner && (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10" />
          )}

          <div className="relative">
            {/* Trophy or Crystal Ball */}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              isWinner
                ? 'bg-gradient-to-br from-yellow-500/30 to-amber-500/30 border border-yellow-500/30'
                : isTie
                ? 'bg-gradient-to-br from-slate-500/30 to-slate-600/30 border border-slate-500/20'
                : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20'
            }`}>
              <span className="text-4xl">{isWinner ? '🏆' : isTie ? '🤝' : '🔮'}</span>
            </div>

            <h2 className={`text-2xl font-black mb-1 ${
              isWinner ? 'text-yellow-400' : isTie ? 'text-slate-300' : 'text-red-400'
            }`}>
              {isWinner ? 'You Won!' : isTie ? "It's a Tie!" : 'Better Luck Next Time!'}
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              {isWinner
                ? 'Your predictions were on point!'
                : isTie
                ? 'Evenly matched predictors!'
                : `${botName} outpredicted you this time`}
            </p>

            {/* Final Balances */}
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* Player */}
              <div className="text-center">
                <PlayerAvatar src={playerAvatar} name={playerName} size="md" ring="ring-violet-400" />
                <p className="text-xs font-bold text-white mt-2">{playerName}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-lg font-black text-white">{playerBalance}</span>
                </div>
                <p className={`text-[10px] font-bold ${netGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netGain >= 0 ? '+' : ''}{netGain} ORRA
                </p>
              </div>

              {/* VS */}
              <div className="text-slate-600 font-black text-xl">VS</div>

              {/* Bot */}
              <div className="text-center">
                <PlayerAvatar src={botAvatar} name={botName} size="md" ring="ring-fuchsia-400" />
                <p className="text-xs font-bold text-white mt-2">{botName}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-lg font-black text-white">{botBalance}</span>
                </div>
                <p className={`text-[10px] font-bold ${botNetGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {botNetGain >= 0 ? '+' : ''}{botNetGain} ORRA
                </p>
              </div>
            </div>

            {/* Real ORRA Reward */}
            {isWinner && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">+{WIN_REWARD} Real ORRA Earned!</span>
              </div>
            )}
          </div>
        </div>

        {/* Round-by-Round Recap */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" /> Round Recap
          </h3>
          <div className="space-y-2">
            {scenarios.map((scenario, i) => {
              const pBet = playerBets[i];
              const bBet = botBets[i];
              const pOutcome = pBet ? scenario.outcomes[pBet.outcomeIndex] : null;
              const bOutcome = bBet ? scenario.outcomes[bBet.outcomeIndex] : null;
              const winner = weightedRandomOutcome(scenario.outcomes);
              const winningLabel = scenario.outcomes[winner].label;

              return (
                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                      Round {i + 1}
                    </span>
                    <span className="text-xs text-slate-400 truncate">{scenario.question}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-slate-500">You: </span>
                      <span className={pBet?.outcomeIndex === winner ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                        {pOutcome ? `${pOutcome.emoji} ${pOutcome.label} (${pBet.amount}🪙)` : '—'}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-fuchsia-400 font-bold">🏆 {winningLabel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Bot: </span>
                      <span className={bBet?.outcomeIndex === winner ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                        {bOutcome ? `${bOutcome.emoji} ${bOutcome.label} (${bBet.amount}🪙)` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <ActionButton
            onClick={() => startGame(true)}
            color="from-violet-600 to-fuchsia-600"
          >
            <Sparkles className="w-4 h-4" /> Play Again
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

  // ============================================
  // RESOLUTION PHASE
  // ============================================
  if (phase === 'resolution' && currentScenario) {
    const playerBet = playerBets[round];
    const botBet = botBets[round];

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <div>
              <span className="font-bold text-white text-sm block leading-tight">Predict It</span>
              <span className="text-[10px] text-slate-500">Round {round + 1}/{TOTAL_ROUNDS}</span>
            </div>
          </div>
          <ScoreDisplay p1Score={playerBalance} p2Score={botBalance} />
        </div>

        {/* Progress */}
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((round + 1) / TOTAL_ROUNDS) * 100}%` }}
          />
        </div>

        {/* Crystal Ball Reveal Area */}
        <div className="glass-panel rounded-2xl p-6 text-center relative overflow-hidden">
          {/* Animated background */}
          <div className={`absolute inset-0 transition-all duration-1000 ${
            revealStep >= 2 ? 'bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10' : ''
          }`} />

          <div className="relative">
            {/* Question */}
            <p className="text-xs text-violet-400 font-bold mb-2">{currentScenario.category}</p>
            <h3 className="text-lg font-bold text-white mb-4">{currentScenario.question}</h3>

            {/* Crystal Ball Animation */}
            {revealStep < 2 ? (
              <div className="flex flex-col items-center py-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600/40 to-fuchsia-600/40 flex items-center justify-center border-2 border-violet-500/30 animate-pulse">
                    <span className="text-5xl">🔮</span>
                  </div>
                  {/* Orbiting dots */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full bg-violet-400" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 rounded-full bg-fuchsia-400" />
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-4 animate-pulse">The crystal ball sees all...</p>
              </div>
            ) : (
              /* Winner Revealed */
              <div className="fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-600/30 to-pink-600/30 border border-fuchsia-500/20 mb-3">
                  <span className="text-3xl">{currentScenario.outcomes[winningOutcome!].emoji}</span>
                </div>
                <p className="text-xs text-fuchsia-400 font-bold mb-1">Community Answer</p>
                <h3 className="text-xl font-black text-white mb-1">
                  {currentScenario.outcomes[winningOutcome!].label}
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  {currentScenario.outcomes[winningOutcome!].odds}× odds
                </p>

                {/* Earnings Display */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Player Earnings */}
                  <div className={`p-3 rounded-xl border ${
                    playerBet?.outcomeIndex === winningOutcome
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <p className="text-[10px] text-slate-400 mb-1">{playerName}</p>
                    <p className="text-xs text-slate-400">
                      Bet: {currentScenario.outcomes[playerBet?.outcomeIndex ?? 0].emoji} {currentScenario.outcomes[playerBet?.outcomeIndex ?? 0].label} ({playerBet?.amount}🪙)
                    </p>
                    <p className={`text-sm font-bold mt-1 ${
                      playerBet?.outcomeIndex === winningOutcome ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {playerBet?.outcomeIndex === winningOutcome
                        ? `+${playerEarnings} 🪙`
                        : `-${playerBet?.amount ?? 0} 🪙`
                      }
                    </p>
                  </div>

                  {/* Bot Earnings */}
                  <div className={`p-3 rounded-xl border ${
                    botBet?.outcomeIndex === winningOutcome
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <p className="text-[10px] text-slate-400 mb-1">{botName}</p>
                    <p className="text-xs text-slate-400">
                      Bet: {currentScenario.outcomes[botBet?.outcomeIndex ?? 0].emoji} {currentScenario.outcomes[botBet?.outcomeIndex ?? 0].label} ({botBet?.amount}🪙)
                    </p>
                    <p className={`text-sm font-bold mt-1 ${
                      botBet?.outcomeIndex === winningOutcome ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {botBet?.outcomeIndex === winningOutcome
                        ? `+${botEarnings} 🪙`
                        : `-${botBet?.amount ?? 0} 🪙`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Outcome Cards (reveal which won) */}
        <div className="grid grid-cols-2 gap-2">
          {currentScenario.outcomes.map((outcome, i) => {
            const isWinner = winningOutcome === i;
            const isPlayerChoice = playerBet?.outcomeIndex === i;
            const isBotChoice = botBet?.outcomeIndex === i;
            const revealed = revealStep >= 2;

            return (
              <div
                key={i}
                className={`relative p-3 rounded-xl border transition-all duration-500 ${
                  revealed && isWinner
                    ? 'bg-fuchsia-500/15 border-fuchsia-500/40 ring-1 ring-fuchsia-500/30'
                    : revealed && !isWinner
                    ? 'bg-white/[0.02] border-white/5 opacity-40'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{outcome.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${
                      revealed && isWinner ? 'text-fuchsia-300' : 'text-white'
                    }`}>
                      {outcome.label}
                    </p>
                    <p className="text-[10px] text-slate-500">{outcome.odds}×</p>
                  </div>
                </div>
                {/* Badges */}
                {revealed && isPlayerChoice && (
                  <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold bg-violet-500/20 text-violet-300">
                    YOU
                  </div>
                )}
                {revealed && isBotChoice && (
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold bg-fuchsia-500/20 text-fuchsia-300">
                    BOT
                  </div>
                )}
                {revealed && isWinner && (
                  <div className="absolute -top-1 -right-1">
                    <Crown className="w-4 h-4 text-yellow-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        {!isRevealing && revealStep >= 2 && (
          <ActionButton onClick={nextRound} color="from-violet-600 to-fuchsia-600">
            {round + 1 >= TOTAL_ROUNDS ? 'See Final Results' : 'Next Round'}
            <ChevronRight className="w-4 h-4" />
          </ActionButton>
        )}
      </div>
    );
  }

  // ============================================
  // PLAYING / BETTING PHASE
  // ============================================
  if ((phase === 'playing' || phase === 'betting') && currentScenario) {
    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <div>
              <span className="font-bold text-white text-sm block leading-tight">Predict It</span>
              <span className="text-[10px] text-slate-500">Round {round + 1}/{TOTAL_ROUNDS}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ScoreDisplay p1Score={playerBalance} p2Score={botBalance} />
            <button
              onClick={onBack}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((round + 1) / TOTAL_ROUNDS) * 100}%` }}
          />
        </div>

        {/* Balance Display */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <PlayerAvatar src={playerAvatar} name={playerName} size="sm" ring="ring-violet-400" />
            <div>
              <p className="text-xs font-bold text-white">{playerName}</p>
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">{playerBalance} ORRA</span>
              </div>
            </div>
          </div>
          <div className="text-slate-600 font-black text-sm">VS</div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-bold text-white">{botName}</p>
              <div className="flex items-center gap-1 justify-end">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">{botBalance} ORRA</span>
              </div>
            </div>
            <PlayerAvatar src={botAvatar} name={botName} size="sm" ring="ring-fuchsia-400" />
          </div>
        </div>

        {/* Scenario Card */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
          {/* Decorative crystal ball */}
          <div className="absolute top-2 right-2 opacity-10 text-5xl">🔮</div>

          <div className="relative">
            <p className="text-xs text-violet-400 font-bold mb-1 flex items-center gap-1">
              <Eye className="w-3 h-3" /> {currentScenario.category}
            </p>
            <h3 className="text-lg font-bold text-white leading-snug">{currentScenario.question}</h3>
            <p className="text-[11px] text-slate-500 mt-2">Tap an outcome to bet on it</p>
          </div>
        </div>

        {/* Outcome Cards */}
        <div className="grid grid-cols-2 gap-2">
          {currentScenario.outcomes.map((outcome, i) => {
            const isSelected = selectedOutcome === i;
            return (
              <button
                key={i}
                onClick={() => handleSelectOutcome(i)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                  isSelected
                    ? 'bg-violet-500/15 border-violet-500/50 ring-2 ring-violet-500/20 shadow-lg shadow-violet-500/10'
                    : 'bg-white/[0.03] border-white/10 hover:border-violet-500/30 hover:bg-white/[0.05]'
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                <span className="text-2xl block mb-2">{outcome.emoji}</span>
                <p className="text-sm font-bold text-white leading-tight">{outcome.label}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5">
                  <Zap className="w-3 h-3 text-fuchsia-400" />
                  <span className="text-xs font-bold text-fuchsia-400">{outcome.odds}×</span>
                </div>
                {isSelected && betAmount > 0 && (
                  <p className="text-[10px] text-emerald-400 mt-1 font-bold">
                    Win: +{betAmount * outcome.odds} ORRA
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Bet Controls */}
        {selectedOutcome !== null && (
          <div className="glass-panel rounded-2xl p-4 fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">Your Bet</p>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{playerBalance} available</span>
              </div>
            </div>

            {/* Bet Amount Controls */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <button
                onClick={() => setBetAmount((prev) => Math.max(MIN_BET, prev - 1))}
                disabled={betAmount <= MIN_BET}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-30"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-black text-white">{betAmount}</span>
              </div>

              <button
                onClick={() => setBetAmount((prev) => Math.min(maxBetForBalance, prev + 1))}
                disabled={betAmount >= maxBetForBalance}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick bet buttons */}
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((amount) => (
                <button
                  key={amount}
                  onClick={() => amount <= maxBetForBalance && setBetAmount(amount)}
                  disabled={amount > maxBetForBalance}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    betAmount === amount
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : amount > maxBetForBalance
                      ? 'bg-white/[0.02] text-slate-600 border border-white/5'
                      : 'bg-white/[0.03] text-slate-400 border border-white/5 hover:bg-white/[0.06]'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* Potential win */}
            <p className="text-center text-xs text-slate-400 mb-3">
              Potential win: <span className="text-emerald-400 font-bold">
                +{betAmount * currentScenario.outcomes[selectedOutcome].odds} ORRA
              </span>{' '}
              ({currentScenario.outcomes[selectedOutcome].odds}× odds)
            </p>

            {/* Confirm Button */}
            <ActionButton
              onClick={confirmBet}
              disabled={betAmount > playerBalance || betAmount < MIN_BET}
              color="from-violet-600 to-fuchsia-600"
            >
              <CircleDot className="w-4 h-4" />
              Place Bet — {betAmount} ORRA
            </ActionButton>
          </div>
        )}

        {/* No outcome selected hint */}
        {selectedOutcome === null && (
          <div className="text-center py-2">
            <p className="text-xs text-slate-500 animate-pulse">👆 Select an outcome to place your bet</p>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center p-8">
      <p className="text-slate-400">Loading...</p>
      <button onClick={onBack} className="mt-4 text-violet-400 text-sm font-medium">Back to Arena</button>
    </div>
  );
}

export default PredictIt;
