'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { GameHeader, ActionButton, ProgressBar, PlayerAvatar, ScoreDisplay } from './game-types';
import { ArrowLeft, Trophy, Zap, ChevronRight, PenLine, Eye, CheckCircle, XCircle, Clock, Bot, Users, Sparkles, RotateCcw } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface TwoTruthsLieProps {
  onBack: () => void;
}

type GamePhase = 'lobby' | 'write' | 'guess' | 'reveal' | 'roundSummary' | 'finalResults';
type GameMode = 'bot' | 'friend';
type Role = 'writer' | 'guesser';

interface StatementSet {
  statements: [string, string, string];
  lieIndex: number;
}

interface RoundResult {
  round: number;
  writerRole: 'player' | 'opponent';
  statements: [string, string, string];
  lieIndex: number;
  guessIndex: number | null;
  guesserCorrect: boolean;
  writerPoints: number;
  guesserPoints: number;
  hesitationBonuses: number;
  timeToGuess: number;
}

// ============================================
// STATEMENT BANK (30+ sets for bot)
// ============================================

const BOT_STATEMENT_BANK: StatementSet[] = [
  { statements: ["I've broken my arm twice", "I can speak 3 languages", "I've never flown on a plane"], lieIndex: 2 },
  { statements: ["I won a spelling bee in 5th grade", "I've met a celebrity", "I'm afraid of heights"], lieIndex: 0 },
  { statements: ["I can solve a Rubik's cube in under a minute", "I've been to Japan", "I've never eaten sushi"], lieIndex: 2 },
  { statements: ["I've run a marathon", "I can play 4 instruments", "I've never broken a bone"], lieIndex: 1 },
  { statements: ["I was on TV as a kid", "I've swum with dolphins", "I've never been camping"], lieIndex: 2 },
  { statements: ["I can cook a 5-course meal", "I've climbed Mount Kilimanjaro", "I'm double-jointed"], lieIndex: 1 },
  { statements: ["I've been skydiving twice", "I can recite the alphabet backwards", "I've never had a cavity"], lieIndex: 0 },
  { statements: ["I've written a published book", "I can hold my breath for 2 minutes", "I'm allergic to cats"], lieIndex: 0 },
  { statements: ["I've been on a game show", "I can do a backflip", "I've never learned to ride a bike"], lieIndex: 2 },
  { statements: ["I speak fluent sign language", "I've met the president", "I've never been to a concert"], lieIndex: 2 },
  { statements: ["I was born in a different country", "I can juggle 5 balls", "I've never had coffee"], lieIndex: 1 },
  { statements: ["I've gone streaking in public", "I can touch my nose with my tongue", "I've never eaten pizza"], lieIndex: 2 },
  { statements: ["I've been stuck in an elevator for 3 hours", "I can type 120 words per minute", "I've never used social media before ORRA"], lieIndex: 2 },
  { statements: ["I won a hot dog eating contest", "I've been a movie extra", "I've never had a pet"], lieIndex: 2 },
  { statements: ["I can name every US president in order", "I've bungee jumped", "I've never eaten chocolate"], lieIndex: 2 },
  { statements: ["I've been inside the White House", "I can beat anyone at chess", "I've never worn jeans"], lieIndex: 2 },
  { statements: ["I accidentally set off a fire alarm at a hotel", "I've been a wedding officiant", "I've never learned to swim"], lieIndex: 2 },
  { statements: ["I've performed stand-up comedy", "I can sew my own clothes", "I've never watched Star Wars"], lieIndex: 2 },
  { statements: ["I've been lost in a foreign country alone", "I can walk on my hands", "I've never owned a smartphone before this one"], lieIndex: 2 },
  { statements: ["I won $500 at a casino on my first try", "I've been on a blimp", "I've never taken a selfie"], lieIndex: 2 },
  { statements: ["I've taught a college class", "I can do a perfect cartwheel", "I've never ridden a rollercoaster"], lieIndex: 2 },
  { statements: ["I've been inside a volcano", "I can predict the weather by smell", "I've never had a haircut at a salon"], lieIndex: 1 },
  { statements: ["I've driven across the country solo", "I can make balloon animals", "I've never eaten ice cream"], lieIndex: 2 },
  { statements: ["I've been on the radio", "I can yodel", "I've never had a surprise party"], lieIndex: 2 },
  { statements: ["I've won a karaoke contest", "I can wiggle my ears", "I've never used an elevator alone without being scared"], lieIndex: 2 },
  { statements: ["I've been a mystery shopper", "I can moonwalk like Michael Jackson", "I've never had a dream about flying"], lieIndex: 2 },
  { statements: ["I've caught a fish with my bare hands", "I can read a 300-page book in a day", "I've never eaten a vegetable I liked"], lieIndex: 2 },
  { statements: ["I've been a background dancer in a music video", "I can solve any crossword puzzle", "I've never been inside a taxi"], lieIndex: 0 },
  { statements: ["I've appeared in a newspaper front page", "I can do a split", "I've never used a public restroom"], lieIndex: 2 },
  { statements: ["I've accidentally walked into a movie set", "I can identify any bird by its song", "I've never received a hand-written letter"], lieIndex: 1 },
];

// ============================================
// TEMPLATE SUGGESTIONS
// ============================================

const TEMPLATE_SUGGESTIONS = [
  "I've been to ___ countries",
  "My favorite food is ___",
  "I can ___",
  "I've never ___",
  "I'm afraid of ___",
  "I once ___ at a party",
  "I've met ___ in real life",
  "I can't live without ___",
  "I secretly ___",
  "My hidden talent is ___",
  "I've traveled to ___ alone",
  "I've never tried ___",
  "I once got lost in ___",
  "I can ___ in under a minute",
  "I've been ___ since I was a kid",
];

// ============================================
// CONSTANTS
// ============================================

const TOTAL_ROUNDS = 5;
const WRITE_TIME_LIMIT = 30;
const GUESS_TIME_LIMIT = 15;
const HESITATION_THRESHOLD = 5;
const CORRECT_GUESS_POINTS = 3;
const GOOD_LIE_POINTS = 3;
const HESITATION_BONUS_POINTS = 1;
const WIN_BONUS_ORRA = 5;

const BOT_AVATAR = '/api/uploads?path=images/orra-logo.png';
const BOT_NAME = 'ORRA Bot';

// ============================================
// HELPER: Shuffle array
// ============================================

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TwoTruthsLie({ onBack }: TwoTruthsLieProps) {
  const { earnTokens } = useAuraStore();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [gameMode, setGameMode] = useState<GameMode>('bot');
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  // Write phase state
  const [statements, setStatements] = useState<string[]>(['', '', '']);
  const [lieIndex, setLieIndex] = useState<number | null>(null);
  const [writeTimeLeft, setWriteTimeLeft] = useState(WRITE_TIME_LIMIT);

  // Guess phase state
  const [currentStatements, setCurrentStatements] = useState<[string, string, string]>(['', '', '']);
  const [currentLieIndex, setCurrentLieIndex] = useState(0);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [guessTimeLeft, setGuessTimeLeft] = useState(GUESS_TIME_LIMIT);
  const [guessStartTime, setGuessStartTime] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  const [viewedStatements, setViewedStatements] = useState<Set<number>>(new Set());

  // Reveal phase state
  const [revealStep, setRevealStep] = useState(0); // 0=none, 1=show guess, 2=show truth, 3=show lie

  // Bot state
  const [usedBotSets, setUsedBotSets] = useState<Set<number>>(new Set());

  // Timer refs
  const writeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const guessTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived
  const isPlayerWriter = currentRound % 2 === 1; // Round 1,3,5: player writes; Round 2,4: bot writes
  const playerRole: Role = isPlayerWriter ? 'writer' : 'guesser';
  const opponentRole: Role = isPlayerWriter ? 'guesser' : 'writer';

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (writeTimerRef.current) clearInterval(writeTimerRef.current);
      if (guessTimerRef.current) clearInterval(guessTimerRef.current);
    };
  }, []);

  // ============================================
  // LOBBY: Start game
  // ============================================

  const startGame = useCallback((mode: GameMode) => {
    setGameMode(mode);
    setCurrentRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundResults([]);
    setUsedBotSets(new Set());
    startRound(1, mode);
  }, []);

  const startRound = useCallback((round: number, mode?: GameMode) => {
    const activeMode = mode || gameMode;
    const playerIsWriter = round % 2 === 1;

    // Reset states
    setStatements(['', '', '']);
    setLieIndex(null);
    setGuessIndex(null);
    setRevealStep(0);
    setViewedStatements(new Set());
    setHesitationCount(0);

    if (playerIsWriter) {
      // Player writes
      setPhase('write');
      setWriteTimeLeft(WRITE_TIME_LIMIT);
    } else {
      // Bot writes, player guesses
      if (activeMode === 'bot') {
        // Pick a random unused bot statement set
        const availableIndices = BOT_STATEMENT_BANK.map((_, i) => i).filter(i => !usedBotSets.has(i));
        const pool = availableIndices.length > 0 ? availableIndices : BOT_STATEMENT_BANK.map((_, i) => i);
        const randomIdx = pool[Math.floor(Math.random() * pool.length)];

        const set = BOT_STATEMENT_BANK[randomIdx];
        // Shuffle the statements but track the lie position
        const indices = [0, 1, 2];
        const shuffledIndices = shuffleArray(indices);
        const shuffledStatements: [string, string, string] = [
          set.statements[shuffledIndices[0]],
          set.statements[shuffledIndices[1]],
          set.statements[shuffledIndices[2]],
        ];
        const newLieIndex = shuffledIndices.indexOf(set.lieIndex);

        setCurrentStatements(shuffledStatements);
        setCurrentLieIndex(newLieIndex);
        setUsedBotSets(prev => new Set([...prev, randomIdx]));

        // Go straight to guess phase
        setPhase('guess');
        setGuessTimeLeft(GUESS_TIME_LIMIT);
        setGuessStartTime(Date.now());
      } else {
        // vs Friend mode - bot acts as friend for now
        const availableIndices = BOT_STATEMENT_BANK.map((_, i) => i).filter(i => !usedBotSets.has(i));
        const pool = availableIndices.length > 0 ? availableIndices : BOT_STATEMENT_BANK.map((_, i) => i);
        const randomIdx = pool[Math.floor(Math.random() * pool.length)];

        const set = BOT_STATEMENT_BANK[randomIdx];
        const indices = [0, 1, 2];
        const shuffledIndices = shuffleArray(indices);
        const shuffledStatements: [string, string, string] = [
          set.statements[shuffledIndices[0]],
          set.statements[shuffledIndices[1]],
          set.statements[shuffledIndices[2]],
        ];
        const newLieIndex = shuffledIndices.indexOf(set.lieIndex);

        setCurrentStatements(shuffledStatements);
        setCurrentLieIndex(newLieIndex);
        setUsedBotSets(prev => new Set([...prev, randomIdx]));

        setPhase('guess');
        setGuessTimeLeft(GUESS_TIME_LIMIT);
        setGuessStartTime(Date.now());
      }
    }
  }, [gameMode, usedBotSets]);

  // ============================================
  // WRITE PHASE: Timer
  // ============================================

  useEffect(() => {
    if (phase !== 'write') return;
    if (writeTimeLeft <= 0) {
      // Time's up - auto-submit with whatever we have
      handleSubmitWrite();
      return;
    }
    writeTimerRef.current = setTimeout(() => {
      setWriteTimeLeft(prev => prev - 1);
    }, 1000);
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
  }, [phase, writeTimeLeft]);

  const handleSubmitWrite = useCallback(() => {
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);

    // Fill empty statements with defaults
    const filledStatements: [string, string, string] = statements.map((s, i) =>
      s.trim() || `Statement ${i + 1}`
    ) as [string, string, string];

    const chosenLieIndex = lieIndex ?? 0; // Default to first if not selected

    setCurrentStatements(filledStatements);
    setCurrentLieIndex(chosenLieIndex);

    // Bot guessing phase
    if (gameMode === 'bot') {
      // 50% chance bot guesses correctly
      const botCorrect = Math.random() < 0.5;
      const botGuess = botCorrect ? chosenLieIndex : [0, 1, 2].filter(i => i !== chosenLieIndex)[Math.floor(Math.random() * 2)];

      // Process result directly (bot guesses instantly)
      processResult(filledStatements, chosenLieIndex, botGuess, 3, 0);
    } else {
      // vs Friend - skip to reveal (friend would guess in real multiplayer)
      // For now, simulate friend guess
      const friendCorrect = Math.random() < 0.5;
      const friendGuess = friendCorrect ? chosenLieIndex : [0, 1, 2].filter(i => i !== chosenLieIndex)[Math.floor(Math.random() * 2)];
      processResult(filledStatements, chosenLieIndex, friendGuess, 5, 1);
    }
  }, [statements, lieIndex, gameMode]);

  // ============================================
  // GUESS PHASE: Timer
  // ============================================

  useEffect(() => {
    if (phase !== 'guess') return;
    if (guessTimeLeft <= 0) {
      // Time's up - no guess
      handleTimeUpGuess();
      return;
    }
    guessTimerRef.current = setTimeout(() => {
      setGuessTimeLeft(prev => prev - 1);
    }, 1000);
    return () => {
      if (guessTimerRef.current) clearTimeout(guessTimerRef.current);
    };
  }, [phase, guessTimeLeft]);

  // Track hesitation (viewing statements for >5 seconds without guessing)
  useEffect(() => {
    if (phase !== 'guess') return;
    const elapsed = Math.floor((Date.now() - guessStartTime) / 1000);
    if (elapsed >= HESITATION_THRESHOLD && guessIndex === null) {
      // Count statements the guesser hesitated on
      const hesitatedOn = viewedStatements.size > 0 ? viewedStatements.size : 3;
      setHesitationCount(hesitatedOn);
    }
  }, [guessTimeLeft, phase, guessIndex, viewedStatements, guessStartTime]);

  const handleTimeUpGuess = useCallback(() => {
    if (guessTimerRef.current) clearTimeout(guessTimerRef.current);
    // No guess made - treat as wrong guess
    processResult(currentStatements, currentLieIndex, -1, Math.floor((Date.now() - guessStartTime) / 1000), 3);
  }, [currentStatements, currentLieIndex, guessStartTime]);

  const handleGuess = useCallback((index: number) => {
    if (guessIndex !== null) return; // Already guessed
    if (guessTimerRef.current) clearTimeout(guessTimerRef.current);

    setGuessIndex(index);

    const timeToGuess = Math.floor((Date.now() - guessStartTime) / 1000);
    const hesitated = timeToGuess >= HESITATION_THRESHOLD;
    const hesitatedOn = hesitated ? Math.min(viewedStatements.size || 3, 2) : 0;

    processResult(currentStatements, currentLieIndex, index, timeToGuess, hesitatedOn);
  }, [guessIndex, currentStatements, currentLieIndex, guessStartTime, viewedStatements]);

  // ============================================
  // PROCESS RESULT
  // ============================================

  const processResult = useCallback((
    stmts: [string, string, string],
    lieIdx: number,
    guessIdx: number,
    timeToGuess: number,
    hesitatedOn: number
  ) => {
    const guesserCorrect = guessIdx === lieIdx;
    let writerPts = 0;
    let guesserPts = 0;

    if (guesserCorrect) {
      // Guesser identified the lie
      guesserPts = CORRECT_GUESS_POINTS;
    } else {
      // Guesser picked a truth - writer gets points for good lie
      writerPts = GOOD_LIE_POINTS;
    }

    // Hesitation bonus for writer
    const hesitationBonus = hesitatedOn * HESITATION_BONUS_POINTS;
    writerPts += hesitationBonus;

    // Determine who is writer and who is guesser
    const playerIsWriter = currentRound % 2 === 1;

    let pScore = 0;
    let oScore = 0;
    if (playerIsWriter) {
      pScore = writerPts;
      oScore = guesserPts;
    } else {
      pScore = guesserPts;
      oScore = writerPts;
    }

    const result: RoundResult = {
      round: currentRound,
      writerRole: playerIsWriter ? 'player' : 'opponent',
      statements: stmts,
      lieIndex: lieIdx,
      guessIndex: guessIdx >= 0 ? guessIdx : null,
      guesserCorrect,
      writerPoints: writerPts,
      guesserPoints: guesserPts,
      hesitationBonuses: hesitationBonus,
      timeToGuess,
    };

    setRoundResults(prev => [...prev, result]);

    // Start reveal animation
    setPhase('reveal');
    setRevealStep(0);

    // Staggered reveal animation
    setTimeout(() => setRevealStep(1), 600);
    setTimeout(() => setRevealStep(2), 1400);
    setTimeout(() => setRevealStep(3), 2200);

    // Show round summary after reveal
    setTimeout(() => {
      setPlayerScore(prev => prev + pScore);
      setOpponentScore(prev => prev + oScore);
      setPhase('roundSummary');
    }, 3500);
  }, [currentRound]);

  // ============================================
  // NEXT ROUND / END GAME
  // ============================================

  const handleNextRound = useCallback(() => {
    if (currentRound >= TOTAL_ROUNDS) {
      setPhase('finalResults');
      // Award tokens
      const isWinner = playerScore > opponentScore;
      if (isWinner) {
        earnTokens(WIN_BONUS_ORRA, 'Two Truths & A Lie - Winner!');
      } else if (playerScore === opponentScore) {
        earnTokens(2, 'Two Truths & A Lie - Draw!');
      }
    } else {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      startRound(nextRound);
    }
  }, [currentRound, playerScore, opponentScore, earnTokens, startRound]);

  // ============================================
  // APPLY TEMPLATE
  // ============================================

  const applyTemplate = (template: string, index: number) => {
    const newStatements = [...statements];
    newStatements[index] = template;
    setStatements(newStatements);
  };

  // ============================================
  // RENDER: Lobby
  // ============================================

  if (phase === 'lobby') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <GameHeader
          icon="🤥"
          title="Two Truths & A Lie"
          subtitle="Deceive or detect — who's the better liar?"
          onClose={onBack}
        />

        {/* Game description card */}
        <div className="glass-panel rounded-2xl p-5 text-center">
          <div className="text-5xl mb-3">🤥</div>
          <h2 className="text-xl font-black text-white mb-1">Two Truths & A Lie</h2>
          <p className="text-sm text-slate-400 mb-4">
            Write 2 truths and 1 lie. Can your opponent spot the fake?
          </p>

          <div className="space-y-2 text-left mb-4">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
              <span className="text-xs mt-0.5">✍️</span>
              <p className="text-xs text-slate-300"><span className="text-violet-400 font-bold">Writer</span> creates 3 statements (2 true, 1 false)</p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
              <span className="text-xs mt-0.5">🔍</span>
              <p className="text-xs text-slate-300"><span className="text-fuchsia-400 font-bold">Guesser</span> picks which one is the lie</p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
              <span className="text-xs mt-0.5">🎯</span>
              <p className="text-xs text-slate-300">Correct guess = <span className="text-emerald-400 font-bold">+3 pts</span> for guesser</p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
              <span className="text-xs mt-0.5">😈</span>
              <p className="text-xs text-slate-300">Good lie = <span className="text-amber-400 font-bold">+3 pts</span> for writer</p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
              <span className="text-xs mt-0.5">⏱️</span>
              <p className="text-xs text-slate-300">Hesitation bonus: <span className="text-yellow-400 font-bold">+1 pt</span> per statement per 5s delay</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">Winner gets +5 ORRA</span>
          </div>
        </div>

        {/* Game mode selection */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold px-1">Choose Mode</p>

          <button
            onClick={() => startGame('bot')}
            className="w-full glass-panel rounded-2xl p-4 flex items-center gap-4 hover:border-violet-500/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold text-white">vs Bot</h3>
              <p className="text-xs text-slate-400">Quick match against ORRA Bot</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
          </button>

          <button
            onClick={() => startGame('friend')}
            className="w-full glass-panel rounded-2xl p-4 flex items-center gap-4 hover:border-fuchsia-500/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-bold text-white">vs Friend</h3>
              <p className="text-xs text-slate-400">Challenge a friend to play</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-fuchsia-400 transition-colors" />
          </button>
        </div>

        {/* Rounds info */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Format</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-black text-violet-400">{TOTAL_ROUNDS}</p>
              <p className="text-[10px] text-slate-500">Rounds</p>
            </div>
            <div>
              <p className="text-lg font-black text-fuchsia-400">30s</p>
              <p className="text-[10px] text-slate-500">Write Time</p>
            </div>
            <div>
              <p className="text-lg font-black text-pink-400">15s</p>
              <p className="text-[10px] text-slate-500">Guess Time</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Write Phase
  // ============================================

  if (phase === 'write') {
    const canSubmit = statements.every(s => s.trim().length > 0) && lieIndex !== null;

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤥</span>
            <div>
              <span className="font-bold text-white text-sm block leading-tight">Round {currentRound}/{TOTAL_ROUNDS}</span>
              <span className="text-[10px] text-slate-500">You're the Writer ✍️</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
            <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Timer */}
        <ProgressBar value={writeTimeLeft} max={WRITE_TIME_LIMIT} isLow={writeTimeLeft <= 10} />

        {/* Role badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-violet-500/10 border border-violet-500/20 mx-auto w-fit">
          <PenLine className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold text-violet-400">Write 2 Truths & 1 Lie</span>
        </div>

        {/* Statement inputs */}
        <div className="space-y-3">
          {statements.map((stmt, i) => (
            <div key={i} className={`glass-panel rounded-xl p-3 transition-all ${lieIndex === i ? 'border-red-500/40 ring-1 ring-red-500/20' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                  lieIndex === i ? 'bg-red-500/20 text-red-400' : 'bg-violet-500/20 text-violet-400'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={`text-xs font-bold ${lieIndex === i ? 'text-red-400' : 'text-slate-400'}`}>
                  {lieIndex === i ? '🤥 THIS IS YOUR LIE' : '✅ TRUTH'}
                </span>
              </div>
              <input
                type="text"
                value={stmt}
                onChange={(e) => {
                  const newStmts = [...statements];
                  newStmts[i] = e.target.value.slice(0, 80);
                  setStatements(newStmts);
                }}
                placeholder={`Statement ${i + 1}...`}
                maxLength={80}
                className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-violet-500/50 border border-white/5"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-slate-600">{stmt.length}/80</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="lieIndex"
                    checked={lieIndex === i}
                    onChange={() => setLieIndex(i)}
                    className="w-3.5 h-3.5 accent-red-500"
                  />
                  <span className="text-[10px] text-red-400 font-bold">This is the lie</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Template suggestions */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2 px-1">Quick Templates</p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_SUGGESTIONS.slice(0, 8).map((template, i) => (
              <button
                key={i}
                onClick={() => {
                  const emptyIdx = statements.findIndex(s => !s.trim());
                  if (emptyIdx !== -1) {
                    applyTemplate(template, emptyIdx);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-400 hover:border-violet-500/30 hover:text-violet-300 transition-all"
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <ActionButton
          onClick={handleSubmitWrite}
          disabled={!canSubmit}
          color="from-violet-600 to-fuchsia-600"
        >
          <PenLine className="w-4 h-4" />
          {canSubmit ? 'Submit Statements' : 'Write 3 statements & mark the lie'}
        </ActionButton>
      </div>
    );
  }

  // ============================================
  // RENDER: Guess Phase
  // ============================================

  if (phase === 'guess') {
    const elapsed = Math.floor((Date.now() - guessStartTime) / 1000);

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤥</span>
            <div>
              <span className="font-bold text-white text-sm block leading-tight">Round {currentRound}/{TOTAL_ROUNDS}</span>
              <span className="text-[10px] text-slate-500">You're the Guesser 🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
            <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Timer */}
        <ProgressBar value={guessTimeLeft} max={GUESS_TIME_LIMIT} isLow={guessTimeLeft <= 5} />

        {/* Role badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 mx-auto w-fit">
          <Eye className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs font-bold text-fuchsia-400">Which one is the LIE?</span>
        </div>

        {/* Opponent info */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <PlayerAvatar src={BOT_AVATAR} name={BOT_NAME} size="sm" ring="ring-fuchsia-400" />
          <div>
            <span className="text-xs font-bold text-white block">{gameMode === 'bot' ? BOT_NAME : 'Friend'}</span>
            <span className="text-[10px] text-slate-500">wrote these statements</span>
          </div>
        </div>

        {/* Statement cards */}
        <div className="space-y-3">
          {currentStatements.map((stmt, i) => {
            const isSelected = guessIndex === i;
            return (
              <button
                key={i}
                onClick={() => {
                  setViewedStatements(prev => new Set([...prev, i]));
                  handleGuess(i);
                }}
                disabled={guessIndex !== null}
                onMouseEnter={() => setViewedStatements(prev => new Set([...prev, i]))}
                className={`w-full text-left glass-panel rounded-xl p-4 transition-all ${
                  isSelected
                    ? 'border-fuchsia-500/50 ring-2 ring-fuchsia-500/20 scale-[0.98]'
                    : guessIndex !== null
                      ? 'opacity-50'
                      : 'hover:border-fuchsia-500/30 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-fuchsia-500/20 text-fuchsia-400 ring-2 ring-fuchsia-500/30'
                      : 'bg-white/5 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm font-medium text-white flex-1">{stmt}</span>
                  {isSelected && (
                    <div className="text-fuchsia-400">
                      <Eye className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        {guessIndex === null && guessTimeLeft <= 10 && (
          <p className="text-center text-xs text-amber-400 animate-pulse">
            ⏱️ Hurry! Pick the lie before time runs out!
          </p>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER: Reveal Phase
  // ============================================

  if (phase === 'reveal') {
    const guesserCorrect = guessIndex === currentLieIndex;

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤥</span>
            <div>
              <span className="font-bold text-white text-sm block leading-tight">Round {currentRound}/{TOTAL_ROUNDS}</span>
              <span className="text-[10px] text-slate-500">Reveal!</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
            <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Result announcement */}
        {revealStep >= 1 && (
          <div className={`text-center py-3 px-4 rounded-xl fade-in ${
            guesserCorrect
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <div className="text-2xl mb-1">{guesserCorrect ? '🎯' : '😈'}</div>
            <p className={`text-sm font-bold ${guesserCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
              {guesserCorrect ? 'Lie Detected!' : 'Good Deception!'}
            </p>
            <p className="text-[10px] text-slate-400">
              {guesserCorrect ? 'The guesser found the lie!' : 'The guesser was fooled!'}
            </p>
          </div>
        )}

        {/* Statement reveal cards */}
        <div className="space-y-3">
          {currentStatements.map((stmt, i) => {
            const isLie = i === currentLieIndex;
            const wasGuessed = i === guessIndex;
            const showResult = revealStep >= 2 && !isLie || revealStep >= 3 && isLie;
            const showLieReveal = revealStep >= 3 && isLie;
            const showTruthReveal = revealStep >= 2 && !isLie;

            return (
              <div
                key={i}
                className={`rounded-xl p-4 transition-all duration-500 border ${
                  showLieReveal
                    ? 'bg-red-500/10 border-red-500/40 ring-1 ring-red-500/20'
                    : showTruthReveal
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : wasGuessed
                        ? 'bg-fuchsia-500/5 border-fuchsia-500/30'
                        : 'glass-panel'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    showLieReveal
                      ? 'bg-red-500/20 text-red-400'
                      : showTruthReveal
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-slate-400'
                  }`}>
                    {showLieReveal ? (
                      <XCircle className="w-5 h-5" />
                    ) : showTruthReveal ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{String.fromCharCode(65 + i)}</span>
                    )}
                  </div>
                  <span className={`text-sm font-medium flex-1 ${
                    showLieReveal ? 'text-red-300' : showTruthReveal ? 'text-emerald-300' : 'text-white'
                  }`}>
                    {stmt}
                  </span>
                  {showLieReveal && (
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse">LIE</span>
                  )}
                  {showTruthReveal && (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">TRUTH</span>
                  )}
                  {wasGuessed && !showLieReveal && !showTruthReveal && (
                    <Eye className="w-4 h-4 text-fuchsia-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Round Summary
  // ============================================

  if (phase === 'roundSummary') {
    const lastResult = roundResults[roundResults.length - 1];
    if (!lastResult) return null;

    const playerIsWriter = lastResult.writerRole === 'player';
    const playerEarned = playerIsWriter ? lastResult.writerPoints : lastResult.guesserPoints;
    const opponentEarned = playerIsWriter ? lastResult.guesserPoints : lastResult.writerPoints;

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤥</span>
            <div>
              <span className="font-bold text-white text-sm block leading-tight">Round {currentRound} Summary</span>
              <span className="text-[10px] text-slate-500">{currentRound}/{TOTAL_ROUNDS} complete</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreDisplay p1Score={playerScore} p2Score={opponentScore} />
            <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Outcome */}
        <div className={`glass-panel rounded-2xl p-5 text-center ${lastResult.guesserCorrect ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <div className="text-3xl mb-2">{lastResult.guesserCorrect ? '🎯' : '😈'}</div>
          <h3 className={`text-lg font-black ${lastResult.guesserCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
            {lastResult.guesserCorrect ? 'Lie Detected!' : 'Deception Wins!'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {lastResult.guesserCorrect
              ? (playerIsWriter ? 'Your lie was caught! Guesser earned +3 pts' : 'You found the lie! +3 pts for you')
              : (playerIsWriter ? 'Your lie fooled them! You earned +3 pts' : 'You were fooled! Writer earned +3 pts')
            }
          </p>
        </div>

        {/* Points breakdown */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Points Breakdown</p>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
            <div className="flex items-center gap-2">
              <PlayerAvatar src="/api/uploads?path=images/orra-logo.png" name="You" size="sm" ring="ring-violet-400" />
              <span className="text-sm font-bold text-white">You</span>
            </div>
            <div className="flex items-center gap-2">
              {playerEarned > 0 && (
                <span className="text-xs text-emerald-400 font-bold">+{playerEarned}</span>
              )}
              <span className="text-sm font-black text-white">{playerScore}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
            <div className="flex items-center gap-2">
              <PlayerAvatar src={BOT_AVATAR} name={gameMode === 'bot' ? BOT_NAME : 'Friend'} size="sm" ring="ring-fuchsia-400" />
              <span className="text-sm font-bold text-white">{gameMode === 'bot' ? BOT_NAME : 'Friend'}</span>
            </div>
            <div className="flex items-center gap-2">
              {opponentEarned > 0 && (
                <span className="text-xs text-emerald-400 font-bold">+{opponentEarned}</span>
              )}
              <span className="text-sm font-black text-white">{opponentScore}</span>
            </div>
          </div>

          {/* Bonus info */}
          {lastResult.hesitationBonuses > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400 font-bold">
                +{lastResult.hesitationBonuses} hesitation bonus pts for writer
              </span>
            </div>
          )}

          {lastResult.guessIndex === null && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <Clock className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-red-400 font-bold">
                Time ran out — no guess made
              </span>
            </div>
          )}
        </div>

        {/* Statements recap */}
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Statements</p>
          {lastResult.statements.map((stmt, i) => {
            const isLie = i === lastResult.lieIndex;
            const wasGuessed = i === lastResult.guessIndex;
            return (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                isLie ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'
              }`}>
                {isLie ? <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="flex-1">{stmt}</span>
                {wasGuessed && <span className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded">GUESSED</span>}
              </div>
            );
          })}
        </div>

        {/* Next round button */}
        <ActionButton onClick={handleNextRound} color="from-violet-600 to-fuchsia-600">
          {currentRound >= TOTAL_ROUNDS ? (
            <>
              <Trophy className="w-4 h-4" /> See Final Results
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" /> Round {currentRound + 1}
            </>
          )}
        </ActionButton>
      </div>
    );
  }

  // ============================================
  // RENDER: Final Results
  // ============================================

  if (phase === 'finalResults') {
    const isWinner = playerScore > opponentScore;
    const isDraw = playerScore === opponentScore;
    const liesDetected = roundResults.filter(r => r.writerRole !== 'player' && r.guesserCorrect).length;
    const goodDeceptions = roundResults.filter(r => r.writerRole === 'player' && !r.guesserCorrect).length;
    const totalHesitationBonuses = roundResults.reduce((sum, r) => sum + r.hesitationBonuses, 0);
    const roundsAsGuesser = roundResults.filter(r => r.writerRole !== 'player');
    const avgGuessTime = roundsAsGuesser.length > 0
      ? Math.round(roundsAsGuesser.reduce((sum, r) => sum + r.timeToGuess, 0) / roundsAsGuesser.length)
      : 0;

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Back button */}
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        {/* Winner banner */}
        <div className={`glass-panel rounded-2xl p-6 text-center ${isWinner ? 'border-amber-500/30' : isDraw ? 'border-violet-500/30' : 'border-slate-500/30'}`}>
          <div className="text-5xl mb-3">
            {isWinner ? '🏆' : isDraw ? '🤝' : '😤'}
          </div>
          <h2 className="text-2xl font-black text-white mb-1">
            {isWinner ? 'You Won!' : isDraw ? "It's a Draw!" : 'You Lost!'}
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            {isWinner ? 'Your deception skills are unmatched!' : isDraw ? 'Evenly matched minds!' : 'Better luck next time!'}
          </p>

          {/* Final Score */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-3xl font-black text-violet-400">{playerScore}</p>
              <p className="text-[10px] text-slate-500">Your Score</p>
            </div>
            <div className="text-xl font-black text-slate-600">vs</div>
            <div className="text-center">
              <p className="text-3xl font-black text-fuchsia-400">{opponentScore}</p>
              <p className="text-[10px] text-slate-500">{gameMode === 'bot' ? BOT_NAME : 'Friend'}</p>
            </div>
          </div>

          {/* Token reward */}
          {isWinner && (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 animate-pulse">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-bold text-yellow-400">+{WIN_BONUS_ORRA} ORRA Earned!</span>
            </div>
          )}
          {isDraw && (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Zap className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-bold text-violet-400">+2 ORRA Earned!</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">Game Stats</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-lg font-black text-emerald-400">{liesDetected}</p>
              <p className="text-[10px] text-slate-500">Lies Detected</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-lg font-black text-red-400">{goodDeceptions}</p>
              <p className="text-[10px] text-slate-500">Good Deceptions</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-lg font-black text-amber-400">{totalHesitationBonuses}</p>
              <p className="text-[10px] text-slate-500">Hesitation Bonus Pts</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <p className="text-lg font-black text-fuchsia-400">{avgGuessTime}s</p>
              <p className="text-[10px] text-slate-500">Avg Guess Time</p>
            </div>
          </div>
        </div>

        {/* Round-by-round breakdown */}
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">Round Breakdown</p>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {roundResults.map((result, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-14">R{result.round}</span>
                  <span className={`text-xs ${result.writerRole === 'player' ? 'text-violet-400' : 'text-fuchsia-400'}`}>
                    {result.writerRole === 'player' ? 'You wrote' : 'You guessed'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {result.guesserCorrect ? (
                    <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">Detected</span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400 px-1.5 py-0.5 rounded bg-red-500/10">Fooled</span>
                  )}
                  <span className="text-xs font-bold text-white">
                    {result.writerRole === 'player' ? result.writerPoints : result.guesserPoints}pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <ActionButton onClick={() => {
            setPhase('lobby');
            setCurrentRound(1);
            setPlayerScore(0);
            setOpponentScore(0);
            setRoundResults([]);
            setUsedBotSets(new Set());
          }} color="from-violet-600 to-fuchsia-600">
            <RotateCcw className="w-4 h-4" /> Play Again
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

  // Fallback
  return null;
}

export default TwoTruthsLie;
