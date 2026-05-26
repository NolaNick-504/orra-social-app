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
  ArrowLeft,
  Zap,
  ChevronRight,
  Trophy,
  Music,
  Mic2,
  Disc3,
  Clock,
  Star,
  Users,
  Bot,
  Sparkles,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SongMatchProps {
  onBack: () => void;
}

type RoundType = 'fill-blank' | 'who-sang' | 'finish-lyric';
type Phase = 'lobby' | 'playing' | 'roundResult' | 'results';

interface FillBlankQuestion {
  type: 'fill-blank';
  lyric: string;
  answer: string;
  song: string;
  artist: string;
  hint: string;
}

interface WhoSangQuestion {
  type: 'who-sang';
  lyric: string;
  options: string[];
  correctIndex: number;
  song: string;
}

interface FinishLyricQuestion {
  type: 'finish-lyric';
  startLyric: string;
  options: string[];
  correctIndex: number;
  song: string;
  artist: string;
}

type Question = FillBlankQuestion | WhoSangQuestion | FinishLyricQuestion;

interface RoundResult {
  question: Question;
  playerCorrect: boolean;
  botCorrect: boolean;
  playerPoints: number;
  botPoints: number;
  playerSpeedBonus: boolean;
  botSpeedBonus: boolean;
  playerAnswer: string;
  botAnswer: string;
  timeElapsed: number;
}

// ============================================
// QUESTION BANK
// ============================================

const FILL_BLANK_QUESTIONS: FillBlankQuestion[] = [
  { type: 'fill-blank', lyric: 'Is this the real life? Is this just ___?', answer: 'fantasy', song: 'Bohemian Rhapsody', artist: 'Queen', hint: 'Starts with "f"' },
  { type: 'fill-blank', lyric: "I got a feeling that tonight's gonna be a ___ night", answer: 'good', song: 'I Gotta Feeling', artist: 'Black Eyed Peas', hint: 'Starts with "g"' },
  { type: 'fill-blank', lyric: "Cause baby you're a ___", answer: 'firework', song: 'Firework', artist: 'Katy Perry', hint: 'Starts with "f"' },
  { type: 'fill-blank', lyric: 'We will, we will ___ you!', answer: 'rock', song: 'We Will Rock You', artist: 'Queen', hint: 'Starts with "r"' },
  { type: 'fill-blank', lyric: "Don't stop ___", answer: "believin'", song: "Don't Stop Believin'", artist: 'Journey', hint: 'Starts with "b"' },
  { type: 'fill-blank', lyric: 'Rolling in the ___', answer: 'deep', song: 'Rolling in the Deep', artist: 'Adele', hint: 'Starts with "d"' },
  { type: 'fill-blank', lyric: 'I wanna dance with ___', answer: 'somebody', song: 'I Wanna Dance with Somebody', artist: 'Whitney Houston', hint: 'Starts with "s"' },
  { type: 'fill-blank', lyric: 'Hello from the ___', answer: 'other side', song: 'Hello', artist: 'Adele', hint: 'Two words' },
];

const WHO_SANG_QUESTIONS: WhoSangQuestion[] = [
  { type: 'who-sang', lyric: 'Just a small town girl, living in a lonely world', options: ['Journey', 'Bon Jovi', 'Queen', 'Eagles'], correctIndex: 0, song: 'Don\'t Stop Believin\'' },
  { type: 'who-sang', lyric: "I'm never gonna give you up, never gonna let you down", options: ['Rick Astley', 'George Michael', 'Prince', 'Wham!'], correctIndex: 0, song: 'Never Gonna Give You Up' },
  { type: 'who-sang', lyric: 'My loneliness is killing me', options: ['Britney Spears', 'Christina Aguilera', 'Madonna', 'Janet Jackson'], correctIndex: 0, song: '...Baby One More Time' },
  { type: 'who-sang', lyric: 'I see the bad moon rising', options: ['CCR', 'The Doors', 'Led Zeppelin', 'The Rolling Stones'], correctIndex: 0, song: 'Bad Moon Rising' },
  { type: 'who-sang', lyric: 'Sweet dreams are made of this', options: ['Eurythmics', 'Depeche Mode', 'Pet Shop Boys', 'Duran Duran'], correctIndex: 0, song: 'Sweet Dreams' },
  { type: 'who-sang', lyric: 'Is this the real life? Is this just fantasy?', options: ['Queen', 'David Bowie', 'The Beatles', 'Pink Floyd'], correctIndex: 0, song: 'Bohemian Rhapsody' },
  { type: 'who-sang', lyric: "I'm blue da ba dee da ba di", options: ['Eiffel 65', 'Daft Punk', 'Gorillaz', 'Moby'], correctIndex: 0, song: 'Blue' },
];

const FINISH_LYRIC_QUESTIONS: FinishLyricQuestion[] = [
  { type: 'finish-lyric', startLyric: "Don't stop believin', hold on to...", options: ['that feeling', 'the rhythm', 'your dreams', 'the night'], correctIndex: 0, song: "Don't Stop Believin'", artist: 'Journey' },
  { type: 'finish-lyric', startLyric: 'I will always...', options: ['love you', 'be there', 'stay true', 'find you'], correctIndex: 0, song: 'I Will Always Love You', artist: 'Whitney Houston' },
  { type: 'finish-lyric', startLyric: "We're all in this...", options: ['together', 'alone', 'forever', 'game'], correctIndex: 0, song: 'High School Musical', artist: 'Cast' },
  { type: 'finish-lyric', startLyric: 'Living on a...', options: ['prayer', 'dream', 'edge', 'highway'], correctIndex: 0, song: 'Livin\' on a Prayer', artist: 'Bon Jovi' },
  { type: 'finish-lyric', startLyric: 'Hit me baby...', options: ['one more time', 'with your best shot', 'tonight', 'again'], correctIndex: 0, song: '...Baby One More Time', artist: 'Britney Spears' },
  { type: 'finish-lyric', startLyric: 'I want it that...', options: ['way', 'badly', 'much', 'far'], correctIndex: 0, song: 'I Want It That Way', artist: 'Backstreet Boys' },
  { type: 'finish-lyric', startLyric: "We found love in a...", options: ['hopeless place', 'crowded room', 'broken world', 'dark night'], correctIndex: 0, song: 'We Found Love', artist: 'Rihanna' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRoundTypes(count: number): RoundType[] {
  const types: RoundType[] = ['fill-blank', 'who-sang', 'finish-lyric'];
  const result: RoundType[] = [];
  for (let i = 0; i < count; i++) {
    result.push(types[i % types.length]);
  }
  return result;
}

function pickQuestions(roundTypes: RoundType[]): Question[] {
  const fb = shuffleArray(FILL_BLANK_QUESTIONS);
  const ws = shuffleArray(WHO_SANG_QUESTIONS);
  const fl = shuffleArray(FINISH_LYRIC_QUESTIONS);

  let fbIdx = 0;
  let wsIdx = 0;
  let flIdx = 0;

  return roundTypes.map((type) => {
    if (type === 'fill-blank') return fb[fbIdx++ % fb.length];
    if (type === 'who-sang') return ws[wsIdx++ % ws.length];
    return fl[flIdx++ % fl.length];
  });
}

function getBotAnswer(question: Question): { correct: boolean; answer: string; timeTaken: number } {
  // Bot answers correctly 50-70% of the time
  const accuracy = 0.5 + Math.random() * 0.2;
  const isCorrect = Math.random() < accuracy;
  const timeTaken = 1.5 + Math.random() * 6; // 1.5-7.5 seconds

  if (question.type === 'fill-blank') {
    if (isCorrect) {
      return { correct: true, answer: question.answer, timeTaken };
    }
    const wrongAnswers = ['love', 'dreams', 'heart', 'night', 'fire', 'light', 'soul', 'rain', 'baby'];
    const filtered = wrongAnswers.filter((a) => a !== question.answer.toLowerCase());
    return { correct: false, answer: filtered[Math.floor(Math.random() * filtered.length)], timeTaken };
  }

  if (question.type === 'who-sang') {
    if (isCorrect) {
      return { correct: true, answer: question.options[question.correctIndex], timeTaken };
    }
    const wrongOptions = question.options.filter((_, i) => i !== question.correctIndex);
    return { correct: false, answer: wrongOptions[Math.floor(Math.random() * wrongOptions.length)], timeTaken };
  }

  // finish-lyric
  if (isCorrect) {
    return { correct: true, answer: question.options[question.correctIndex], timeTaken };
  }
  const wrongOptions = question.options.filter((_, i) => i !== question.correctIndex);
  return { correct: false, answer: wrongOptions[Math.floor(Math.random() * wrongOptions.length)], timeTaken };
}

function getTimerForType(type: RoundType): number {
  return type === 'fill-blank' ? 10 : 8;
}

function getRoundTypeLabel(type: RoundType): string {
  if (type === 'fill-blank') return 'Fill the Blank';
  if (type === 'who-sang') return 'Who Sang It?';
  return 'Finish the Lyric';
}

function getRoundTypeIcon(type: RoundType): string {
  if (type === 'fill-blank') return '✏️';
  if (type === 'who-sang') return '🎤';
  return '🎵';
}

function getRoundTypeColor(type: RoundType): string {
  if (type === 'fill-blank') return 'from-fuchsia-600 to-pink-600';
  if (type === 'who-sang') return 'from-violet-600 to-purple-600';
  return 'from-violet-600 to-fuchsia-600';
}

function getRoundTypeBadgeBg(type: RoundType): string {
  if (type === 'fill-blank') return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30';
  if (type === 'who-sang') return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
  return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SongMatch({ onBack }: SongMatchProps) {
  const { earnTokens } = useAuraStore();

  // Game state
  const [phase, setPhase] = useState<Phase>('lobby');
  const [isVsBot, setIsVsBot] = useState(true);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roundTypes, setRoundTypes] = useState<RoundType[]>([]);

  // Playing state
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [playerAnswer, setPlayerAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Scores
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  // Round results
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResult | null>(null);

  // Bot state
  const [botAnswered, setBotAnswered] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const botAnswerRef = useRef<{ correct: boolean; answer: string; timeTaken: number } | null>(null);

  // Music stats
  const [speedRecord, setSpeedRecord] = useState(Infinity);
  const [fillBlankCorrect, setFillBlankCorrect] = useState(0);
  const [whoSangCorrect, setWhoSangCorrect] = useState(0);
  const [finishLyricCorrect, setFinishLyricCorrect] = useState(0);
  const [fillBlankTotal, setFillBlankTotal] = useState(0);
  const [whoSangTotal, setWhoSangTotal] = useState(0);
  const [finishLyricTotal, setFinishLyricTotal] = useState(0);

  const currentQuestion = questions[currentRound];
  const currentRoundType = roundTypes[currentRound];

  // ============================================
  // START GAME
  // ============================================

  const startGame = useCallback((vsBot: boolean) => {
    setIsVsBot(vsBot);
    const types = generateRoundTypes(totalRounds);
    const qs = pickQuestions(types);
    setRoundTypes(types);
    setQuestions(qs);
    setCurrentRound(0);
    setPlayerScore(0);
    setBotScore(0);
    setRoundResults([]);
    setCurrentRoundResult(null);
    setSpeedRecord(Infinity);
    setFillBlankCorrect(0);
    setWhoSangCorrect(0);
    setFinishLyricCorrect(0);
    setFillBlankTotal(0);
    setWhoSangTotal(0);
    setFinishLyricTotal(0);
    setPlayerAnswer('');
    setSelectedOption(null);
    setAnswered(false);
    setBotAnswered(false);
    setBotThinking(false);
    setPhase('playing');
  }, [totalRounds]);

  // ============================================
  // START ROUND
  // ============================================

  const startRound = useCallback(() => {
    if (!currentQuestion) return;
    const timer = getTimerForType(currentQuestion.type);
    setTimeLeft(timer);
    setTimerActive(true);
    setQuestionStartTime(Date.now());
    setPlayerAnswer('');
    setSelectedOption(null);
    setAnswered(false);
    setBotAnswered(false);
    setBotThinking(false);
    botAnswerRef.current = null;
  }, [currentQuestion]);

  // Start round when entering playing phase or advancing
  useEffect(() => {
    if (phase === 'playing' && currentQuestion) {
      startRound();
    }
  }, [phase, currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // TIMER
  // ============================================

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          // Time's up — auto-submit wrong
          if (!answered) {
            handlePlayerTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // BOT LOGIC
  // ============================================

  useEffect(() => {
    if (phase !== 'playing' || !isVsBot || botAnswered || !currentQuestion) return;
    const botResult = getBotAnswer(currentQuestion);
    botAnswerRef.current = botResult;

    // Show bot thinking after a delay
    const thinkDelay = 500 + Math.random() * 1000;
    const thinkTimer = setTimeout(() => setBotThinking(true), thinkDelay);

    // Bot "answers" at its random time
    const answerTimer = setTimeout(() => {
      setBotThinking(false);
      setBotAnswered(true);
    }, botResult.timeTaken * 1000);

    return () => {
      clearTimeout(thinkTimer);
      clearTimeout(answerTimer);
    };
  }, [phase, currentRound, isVsBot, currentQuestion, botAnswered]);

  // ============================================
  // PLAYER ANSWER HANDLING
  // ============================================

  // Use a ref for speedRecord to avoid dependency cycles
  const speedRecordRef = useRef(speedRecord);
  speedRecordRef.current = speedRecord;

  const processAnswer = useCallback((correct: boolean, answer: string, timeElapsed: number) => {
    if (!currentQuestion) return;
    const speedBonus = correct && timeElapsed < 3;
    const points = correct ? 3 + (speedBonus ? 2 : 0) : 0;

    // Get bot result
    const botResult = botAnswerRef.current || getBotAnswer(currentQuestion);
    const botSpeedBonus = botResult.correct && botResult.timeTaken < 3;
    const botPoints = botResult.correct ? 3 + (botSpeedBonus ? 2 : 0) : 0;

    // Update scores
    setPlayerScore((prev) => prev + points);
    setBotScore((prev) => prev + botPoints);

    // Track stats
    if (correct && timeElapsed < speedRecordRef.current) {
      setSpeedRecord(timeElapsed);
    }
    if (currentQuestion.type === 'fill-blank') {
      setFillBlankTotal((prev) => prev + 1);
      if (correct) setFillBlankCorrect((prev) => prev + 1);
    } else if (currentQuestion.type === 'who-sang') {
      setWhoSangTotal((prev) => prev + 1);
      if (correct) setWhoSangCorrect((prev) => prev + 1);
    } else {
      setFinishLyricTotal((prev) => prev + 1);
      if (correct) setFinishLyricCorrect((prev) => prev + 1);
    }

    const result: RoundResult = {
      question: currentQuestion,
      playerCorrect: correct,
      botCorrect: botResult.correct,
      playerPoints: points,
      botPoints,
      playerSpeedBonus: speedBonus,
      botSpeedBonus,
      playerAnswer: answer,
      botAnswer: botResult.answer,
      timeElapsed,
    };

    setCurrentRoundResult(result);
    setRoundResults((prev) => [...prev, result]);
  }, [currentQuestion]);

  const handlePlayerTimeout = useCallback(() => {
    if (answered) return;
    setAnswered(true);
    setTimerActive(false);

    const elapsed = getTimerForType(currentQuestion?.type || 'fill-blank');
    processAnswer(false, 'No answer', elapsed);
  }, [answered, currentQuestion, processAnswer]);

  // Fill the Blank: submit typed answer
  const submitFillBlank = useCallback(() => {
    if (answered) return;
    setAnswered(true);
    setTimerActive(false);

    const elapsed = (Date.now() - questionStartTime) / 1000;
    const q = currentQuestion as FillBlankQuestion;
    const normalized = playerAnswer.trim().toLowerCase();
    const correctAnswer = q.answer.toLowerCase();
    const isCorrect = normalized === correctAnswer ||
      normalized.includes(correctAnswer) ||
      correctAnswer.includes(normalized);

    processAnswer(isCorrect, playerAnswer.trim(), elapsed);
  }, [answered, questionStartTime, playerAnswer, currentQuestion, processAnswer]);

  // Multiple choice: pick an option
  const selectOption = useCallback((index: number) => {
    if (answered) return;
    setSelectedOption(index);
    setAnswered(true);
    setTimerActive(false);

    const elapsed = (Date.now() - questionStartTime) / 1000;
    const q = currentQuestion as WhoSangQuestion | FinishLyricQuestion;
    const isCorrect = index === q.correctIndex;

    processAnswer(isCorrect, q.options[index], elapsed);
  }, [answered, questionStartTime, currentQuestion, processAnswer]);

  // ============================================
  // NEXT ROUND / RESULTS
  // ============================================

  const handleNextRound = useCallback(() => {
    if (currentRound + 1 >= totalRounds) {
      setPhase('results');
      // Award tokens
      const isWinner = playerScore > botScore;
      const tokens = isWinner ? 5 : Math.max(1, Math.floor(playerScore / 3));
      earnTokens(tokens, `Song Match: ${playerScore} pts`);
    } else {
      setCurrentRound((prev) => prev + 1);
      setPhase('playing');
    }
  }, [currentRound, totalRounds, playerScore, botScore, earnTokens]);

  // Show round result after answering
  useEffect(() => {
    if (answered && currentRoundResult) {
      // Small delay then show round result
      const timer = setTimeout(() => setPhase('roundResult'), 800);
      return () => clearTimeout(timer);
    }
  }, [answered, currentRoundResult]);

  // ============================================
  // RESTART
  // ============================================

  const handleRestart = useCallback(() => {
    setPhase('lobby');
  }, []);

  // ============================================
  // BOT/OPPONENT DATA
  // ============================================

  const botName = 'MelodyBot';
  const botAvatar = '/images/orra-logo.png';
  const playerName = 'You';

  // ============================================
  // RENDER: LOBBY
  // ============================================

  if (phase === 'lobby') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        {/* Game Title */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-3">
            <Music className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Song Match</h2>
          <p className="text-sm text-slate-400 mt-1">Test your music knowledge!</p>
        </div>

        {/* Decorative music notes */}
        <div className="flex items-center justify-center gap-4 text-2xl opacity-30">
          <span>🎵</span>
          <span>🎶</span>
          <span>🎤</span>
          <span>🎶</span>
          <span>🎵</span>
        </div>

        {/* Game Rules */}
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">How to Play</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-fuchsia-400 mt-0.5">✏️</span>
              <p className="text-xs text-slate-300"><span className="text-white font-semibold">Fill the Blank</span> — Type the missing word(s)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">🎤</span>
              <p className="text-xs text-slate-300"><span className="text-white font-semibold">Who Sang It?</span> — Pick the right artist</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-pink-400 mt-0.5">🎵</span>
              <p className="text-xs text-slate-300"><span className="text-white font-semibold">Finish the Lyric</span> — Pick the correct ending</p>
            </div>
          </div>
          <div className="h-px bg-white/10" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-400" />
              <p className="text-[10px] text-slate-400">Correct = +3 pts · Speed bonus (&lt;3s) = +2 extra</p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-3 h-3 text-amber-400" />
              <p className="text-[10px] text-slate-400">5 rounds · Most points wins +5 ORRA</p>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-white text-center uppercase tracking-wider">Choose Opponent</p>

          <button
            onClick={() => startGame(true)}
            className="w-full p-4 rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border-2 border-violet-500/30 hover:border-violet-400/60 transition-all text-left group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/40 to-fuchsia-600/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">vs Bot</p>
                <p className="text-[10px] text-slate-500">Quick match against MelodyBot</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => startGame(false)}
            className="w-full p-4 rounded-xl bg-gradient-to-br from-fuchsia-600/20 to-pink-600/10 border-2 border-fuchsia-500/30 hover:border-fuchsia-400/60 transition-all text-left group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-600/40 to-pink-600/40 flex items-center justify-center">
                <Users className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white group-hover:text-fuchsia-300 transition-colors">vs Friend</p>
                <p className="text-[10px] text-slate-500">Challenge a friend to a music duel</p>
              </div>
            </div>
          </button>
        </div>

        {/* Reward Preview */}
        <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-center">
            <p className="text-sm font-bold text-amber-400">5</p>
            <p className="text-[9px] text-slate-500">Rounds</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-bold text-violet-400">3</p>
            <p className="text-[9px] text-slate-500">Question Types</p>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-bold text-fuchsia-400">+5</p>
            <p className="text-[9px] text-slate-500">ORRA Prize</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: PLAYING
  // ============================================

  if (phase === 'playing' && currentQuestion) {
    const roundType = currentQuestion.type;
    const timerMax = getTimerForType(roundType);

    return (
      <div className="fade-in space-y-3 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-violet-400 text-xs font-medium hover:text-violet-300 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Exit
          </button>
          <div className="flex items-center gap-2">
            {/* Round type badge */}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRoundTypeBadgeBg(roundType)}`}>
              {getRoundTypeIcon(roundType)} {getRoundTypeLabel(roundType)}
            </span>
            <ScoreDisplay p1Score={playerScore} p2Score={botScore} />
          </div>
        </div>

        {/* Timer */}
        <ProgressBar
          value={timeLeft}
          max={timerMax}
          color={getRoundTypeColor(roundType)}
          isLow={timeLeft <= 3}
        />

        {/* Score Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
              Y
            </div>
            <div>
              <p className="text-[10px] text-white font-bold">{playerName}</p>
              <p className="text-sm font-black text-violet-400">{playerScore}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold">Round {currentRound + 1}/{totalRounds}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] text-white font-bold">{botName}</p>
              <p className="text-sm font-black text-fuchsia-400">{botScore}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
              🤖
            </div>
          </div>
        </div>

        {/* Question Card - Neon glow styling */}
        <div className="relative">
          {/* Neon glow background */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-pink-600/20 blur-xl" />

          <div className="relative glass-panel rounded-2xl p-5 border border-violet-500/20">
            {/* Song info */}
            <div className="flex items-center gap-2 mb-3">
              <Disc3 className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-[10px] text-slate-500">
                {currentQuestion.type === 'fill-blank' && `${(currentQuestion as FillBlankQuestion).song} — ${(currentQuestion as FillBlankQuestion).artist}`}
                {currentQuestion.type === 'who-sang' && `${(currentQuestion as WhoSangQuestion).song}`}
                {currentQuestion.type === 'finish-lyric' && `${(currentQuestion as FinishLyricQuestion).song} — ${(currentQuestion as FinishLyricQuestion).artist}`}
              </span>
            </div>

            {/* Lyric text - large, stylized */}
            {currentQuestion.type === 'fill-blank' && (() => {
              const fbq = currentQuestion as FillBlankQuestion;
              const parts = fbq.lyric.split('___');
              return (
                <div className="text-center py-4">
                  <p className="text-lg sm:text-xl font-bold text-white leading-relaxed" style={{ textShadow: '0 0 20px rgba(168,85,247,0.3)' }}>
                    &ldquo;{parts[0]}<span className="inline-block min-w-[80px] border-b-2 border-dashed border-fuchsia-400 mx-1">&nbsp;</span>{parts[1] || ''}&rdquo;
                  </p>
                  <p className="text-xs text-fuchsia-400 mt-3 animate-pulse">Type the missing word(s) ✏️</p>
                </div>
              );
            })()}

            {currentQuestion.type === 'who-sang' && (
              <div className="text-center py-4">
                <p className="text-lg sm:text-xl font-bold text-white leading-relaxed" style={{ textShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
                  &ldquo;{(currentQuestion as WhoSangQuestion).lyric}&rdquo;
                </p>
                <p className="text-xs text-violet-400 mt-3">Who performed this? 🎤</p>
              </div>
            )}

            {currentQuestion.type === 'finish-lyric' && (
              <div className="text-center py-4">
                <p className="text-lg sm:text-xl font-bold text-white leading-relaxed" style={{ textShadow: '0 0 20px rgba(236,72,153,0.3)' }}>
                  &ldquo;{(currentQuestion as FinishLyricQuestion).startLyric}&rdquo;
                </p>
                <p className="text-xs text-pink-400 mt-3">Finish the lyric! 🎵</p>
              </div>
            )}
          </div>
        </div>

        {/* Answer Area */}
        {currentQuestion.type === 'fill-blank' ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={playerAnswer}
              onChange={(e) => setPlayerAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && playerAnswer.trim()) submitFillBlank(); }}
              placeholder="Type the missing word..."
              disabled={answered}
              className="flex-1 bg-white/5 border border-fuchsia-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/60 focus:ring-1 focus:ring-fuchsia-500/30 transition-all disabled:opacity-50"
              autoFocus
            />
            {!answered && (
              <button
                onClick={submitFillBlank}
                disabled={!playerAnswer.trim()}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-all"
              >
                Go
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {(currentQuestion as WhoSangQuestion | FinishLyricQuestion).options.map((option, index) => {
              const q = currentQuestion as WhoSangQuestion | FinishLyricQuestion;
              let btnClass = 'glass-panel hover:border-violet-500/30';
              if (answered) {
                if (index === q.correctIndex) {
                  btnClass = 'border-emerald-500/50 bg-emerald-500/10';
                } else if (index === selectedOption && index !== q.correctIndex) {
                  btnClass = 'border-red-500/50 bg-red-500/10';
                } else {
                  btnClass = 'opacity-40';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => selectOption(index)}
                  disabled={answered}
                  className={`w-full text-left p-3 rounded-xl border border-white/10 transition-all ${btnClass} active:scale-[0.98]`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        answered && index === q.correctIndex
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : answered && index === selectedOption
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-sm font-medium text-white">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Speed Bonus Indicator */}
        {answered && currentRoundResult && (
          <div className="text-center fade-in">
            {currentRoundResult.playerCorrect && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                {currentRoundResult.playerSpeedBonus && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                <span className="text-xs font-bold text-emerald-400">
                  +{currentRoundResult.playerPoints} pts
                  {currentRoundResult.playerSpeedBonus && ' ⚡ Speed Bonus!'}
                </span>
              </div>
            )}
            {!currentRoundResult.playerCorrect && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-xs font-bold text-red-400">+0 pts</span>
              </div>
            )}
          </div>
        )}

        {/* Bot status */}
        {isVsBot && (
          <div className="flex items-center justify-center gap-2 py-1">
            <div className={`w-2 h-2 rounded-full ${botThinking ? 'bg-fuchsia-400 animate-pulse' : botAnswered ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="text-[10px] text-slate-500">
              {botThinking ? `${botName} is thinking...` : botAnswered ? `${botName} answered!` : `Waiting for ${botName}...`}
            </span>
          </div>
        )}

        {/* Round Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < currentRound
                  ? 'bg-emerald-400'
                  : i === currentRound
                  ? 'bg-fuchsia-400 scale-125'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: ROUND RESULT
  // ============================================

  if (phase === 'roundResult' && currentRoundResult) {
    const result = currentRoundResult;
    const q = result.question;

    const correctAnswerText =
      q.type === 'fill-blank'
        ? (q as FillBlankQuestion).answer
        : (q as WhoSangQuestion | FinishLyricQuestion).options[(q as WhoSangQuestion | FinishLyricQuestion).correctIndex];

    return (
      <div className="fade-in space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-violet-400 text-xs font-medium hover:text-violet-300 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Exit
          </button>
          <ScoreDisplay p1Score={playerScore} p2Score={botScore} />
        </div>

        {/* Round Title */}
        <div className="text-center">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoundTypeBadgeBg(q.type)}`}>
            Round {currentRound + 1} · {getRoundTypeLabel(q.type)}
          </span>
        </div>

        {/* Who Got It Right / Wrong */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          {/* Correct Answer */}
          <div className="text-center mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Correct Answer</p>
            <p className="text-base font-bold text-emerald-400" style={{ textShadow: '0 0 15px rgba(52,211,153,0.3)' }}>
              {correctAnswerText}
            </p>
          </div>

          {/* Player vs Bot Result */}
          <div className="grid grid-cols-2 gap-3">
            {/* Player */}
            <div className={`p-3 rounded-xl text-center ${result.playerCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white mx-auto mb-2">
                Y
              </div>
              <p className="text-xs font-bold text-white mb-1">{playerName}</p>
              <p className={`text-lg font-black ${result.playerCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.playerCorrect ? '✓' : '✗'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                +{result.playerPoints} pts
              </p>
              {result.playerSpeedBonus && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[8px] font-bold text-amber-400 mt-1">
                  ⚡ SPEED
                </span>
              )}
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                &ldquo;{result.playerAnswer}&rdquo;
              </p>
            </div>

            {/* Bot */}
            <div className={`p-3 rounded-xl text-center ${result.botCorrect ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white mx-auto mb-2">
                🤖
              </div>
              <p className="text-xs font-bold text-white mb-1">{botName}</p>
              <p className={`text-lg font-black ${result.botCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.botCorrect ? '✓' : '✗'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                +{result.botPoints} pts
              </p>
              {result.botSpeedBonus && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[8px] font-bold text-amber-400 mt-1">
                  ⚡ SPEED
                </span>
              )}
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                &ldquo;{result.botAnswer}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Point Comparison Bar */}
        <div className="glass-panel rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-violet-400">{playerScore} pts</span>
            <span className="text-slate-500">Score</span>
            <span className="font-bold text-fuchsia-400">{botScore} pts</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 rounded-l-full"
              style={{
                width: `${playerScore + botScore > 0 ? (playerScore / (playerScore + botScore)) * 100 : 50}%`,
              }}
            />
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-all duration-700 rounded-r-full"
              style={{
                width: `${playerScore + botScore > 0 ? (botScore / (playerScore + botScore)) * 100 : 50}%`,
              }}
            />
          </div>
        </div>

        {/* Next Round Button */}
        <ActionButton
          onClick={handleNextRound}
          color={getRoundTypeColor(currentRoundType || 'fill-blank')}
        >
          {currentRound + 1 >= totalRounds ? (
            <>
              <Trophy className="w-4 h-4" /> See Final Results
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
  // RENDER: RESULTS
  // ============================================

  if (phase === 'results') {
    const isWinner = playerScore > botScore;
    const isTie = playerScore === botScore;
    const correctCount = roundResults.filter((r) => r.playerCorrect).length;
    const speedBonuses = roundResults.filter((r) => r.playerSpeedBonus).length;
    const bestSpeed = speedRecord < Infinity ? speedRecord.toFixed(1) : '—';

    // Genre analysis (based on question types as proxy)
    const fillBlankPct = fillBlankTotal > 0 ? Math.round((fillBlankCorrect / fillBlankTotal) * 100) : 0;
    const whoSangPct = whoSangTotal > 0 ? Math.round((whoSangCorrect / whoSangTotal) * 100) : 0;
    const finishLyricPct = finishLyricTotal > 0 ? Math.round((finishLyricCorrect / finishLyricTotal) * 100) : 0;

    const musicIQ = Math.round(
      ((fillBlankPct * 0.3 + whoSangPct * 0.4 + finishLyricPct * 0.3) * correctCount) / totalRounds
    );

    const tokenReward = isWinner ? 5 : Math.max(1, Math.floor(playerScore / 3));

    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-5 text-center border border-violet-500/20">
          {/* Winner Banner */}
          <div className="mb-4">
            <div className="text-4xl mb-2">
              {isWinner ? '🏆' : isTie ? '🤝' : '🎵'}
            </div>
            <h2 className={`text-2xl font-black ${isWinner ? 'text-amber-400' : isTie ? 'text-slate-300' : 'text-fuchsia-400'}`}>
              {isWinner ? 'YOU WIN!' : isTie ? "IT'S A TIE!" : `${botName} WINS!`}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Song Match Complete</p>
          </div>

          {/* Final Score */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white mx-auto mb-1">
                Y
              </div>
              <p className="text-2xl font-black text-violet-400">{playerScore}</p>
              <p className="text-[9px] text-slate-500">{playerName}</p>
            </div>
            <div className="text-xl font-black text-slate-600">vs</div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center text-lg mx-auto mb-1">
                🤖
              </div>
              <p className="text-2xl font-black text-fuchsia-400">{botScore}</p>
              <p className="text-[9px] text-slate-500">{botName}</p>
            </div>
          </div>

          {/* Token Reward */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">+{tokenReward} ORRA</span>
          </div>

          {/* Music IQ */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Your Music IQ</p>
            <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
              {musicIQ}
            </p>
            <p className="text-[10px] text-violet-400">
              {musicIQ >= 90 ? 'Music Genius 🧠' : musicIQ >= 70 ? 'Melody Master 🎵' : musicIQ >= 50 ? 'Rising Star ⭐' : 'Keep Listening 🎧'}
            </p>
          </div>
        </div>

        {/* Music Stats */}
        <div className="glass-panel rounded-2xl p-4 border border-violet-500/20">
          <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-3">Music Stats</p>

          <div className="space-y-3">
            {/* Fill the Blank */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <span>✏️</span> Fill the Blank
                </span>
                <span className="font-bold text-fuchsia-400">{fillBlankPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all duration-700"
                  style={{ width: `${fillBlankPct}%` }}
                />
              </div>
            </div>

            {/* Who Sang It */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <span>🎤</span> Who Sang It
                </span>
                <span className="font-bold text-violet-400">{whoSangPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${whoSangPct}%` }}
                />
              </div>
            </div>

            {/* Finish the Lyric */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <span>🎵</span> Finish the Lyric
                </span>
                <span className="font-bold text-pink-400">{finishLyricPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-all duration-700"
                  style={{ width: `${finishLyricPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="h-px bg-white/10 my-3" />
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-bold text-emerald-400">{correctCount}/{totalRounds}</p>
              <p className="text-[9px] text-slate-500">Correct</p>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-400">{speedBonuses}</p>
              <p className="text-[9px] text-slate-500">Speed Bonus</p>
            </div>
            <div>
              <p className="text-sm font-bold text-violet-400">{bestSpeed}s</p>
              <p className="text-[9px] text-slate-500">Speed Record</p>
            </div>
          </div>
        </div>

        {/* Round Breakdown */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Round Breakdown</p>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {roundResults.map((r, i) => {
              const q = r.question;
              const songInfo =
                q.type === 'fill-blank'
                  ? `${(q as FillBlankQuestion).song}`
                  : q.type === 'who-sang'
                  ? `${(q as WhoSangQuestion).song}`
                  : `${(q as FinishLyricQuestion).song}`;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2.5 rounded-xl ${
                    r.playerCorrect ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-red-500/5 border border-red-500/10'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 font-bold min-w-[18px]">R{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 truncate">{songInfo}</p>
                    <p className="text-xs text-white font-medium truncate">
                      {getRoundTypeIcon(q.type)} {getRoundTypeLabel(q.type)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-bold ${r.playerCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.playerCorrect ? '✓' : '✗'}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5">+{r.playerPoints}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <ActionButton onClick={() => startGame(isVsBot)} color="from-violet-600 to-fuchsia-600">
            <Music className="w-4 h-4" /> Play Again
          </ActionButton>
          <button
            onClick={handleRestart}
            className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all"
          >
            Change Mode
          </button>
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
