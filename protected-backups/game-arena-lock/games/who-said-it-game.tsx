'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameOverlay,
  GameHeader,
  ActionButton,
  GameProps,
  WHO_SAID_IT_QUOTES,
} from './game-types';

// ============================================
// WHO SAID IT - DATA & TYPES
// ============================================

interface QuoteQuestion {
  quote: string;
  correctPersonality: string;
  options: string[];
}

const PERSONALITY_TYPES = [
  'Foodie', 'Hustler', 'Pet lover', 'Debater',
  'Optimist', 'Sensitive', 'Comfy', 'Organized',
  'Meme lord', 'Dramatic', 'Caffeinated', 'Plant parent',
];

const PERSONALITY_EMOJIS: Record<string, string> = {
  'Foodie': '🍕',
  'Hustler': '💼',
  'Pet lover': '🐕',
  'Debater': '⚔️',
  'Optimist': '☀️',
  'Sensitive': '💧',
  'Comfy': '🛋️',
  'Organized': '📋',
  'Meme lord': '😂',
  'Dramatic': '🎭',
  'Caffeinated': '☕',
  'Plant parent': '🪴',
};

const FUN_FACTS = [
  '68% of people get this wrong!',
  'Only 1 in 4 guess this correctly!',
  '42% of players chose the wrong answer!',
  'Most people think it\'s the Debater!',
  'Surprisingly, this stumps 73% of players!',
  'Over half of players miss this one!',
  'This is the most missed question!',
  'Veteran players still get this wrong!',
  '89% of first-timers pick the wrong type!',
  'Even AI struggles with this one!',
  'Your grandma would probably get this right!',
  'Psych majors actually score lower on this!',
];

function generateQuestions(count: number): QuoteQuestion[] {
  const shuffled = [...WHO_SAID_IT_QUOTES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  return selected.map(q => {
    const wrongOptions = PERSONALITY_TYPES.filter(p => p !== q.personality);
    const shuffledWrong = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [q.personality, ...shuffledWrong].sort(() => Math.random() - 0.5);
    return { quote: q.quote, correctPersonality: q.personality, options };
  });
}

const TOTAL_ROUNDS = 5;
const TIME_PER_QUESTION = 10;
const BASE_POINTS = 10;
const MAX_SPEED_BONUS = 5;
const STREAK_THRESHOLD = 3;
const STREAK_BONUS = 5;

// ============================================
// WHO SAID IT - GAME COMPONENT
// ============================================

type GamePhase = 'intro' | 'question' | 'results';

export default function WhoSaidItGame({ onClose, currentUser, callbacks, accentColor, tokenReward, xpReward }: GameProps) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [questions, setQuestions] = useState<QuoteQuestion[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [timerActive, setTimerActive] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | null>(null);
  const [lastPoints, setLastPoints] = useState(0);
  const [currentFunFact, setCurrentFunFact] = useState('');
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [isOnFire, setIsOnFire] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTime = useRef(0);
  const answeredRef = useRef(false);

  // ============================================
  // ADVANCE TO NEXT
  // ============================================
  const advanceToNext = useCallback((round: number) => {
    if (round + 1 >= TOTAL_ROUNDS) {
      setPhase('results');
    } else {
      setCurrentRound(round + 1);
      setSelectedAnswer(null);
      setFeedbackType(null);
      setFlashColor(null);
      setAnswered(false);
      answeredRef.current = false;
      setTimerActive(true);
      setTimeLeft(TIME_PER_QUESTION);
      setCurrentFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
      questionStartTime.current = Date.now();
    }
  }, []);

  // ============================================
  // HANDLE TIME UP (via ref to avoid stale closures)
  // ============================================
  const handleTimeUpRef = useRef<() => void>(() => {});

  useEffect(() => {
    handleTimeUpRef.current = () => {
      const q = questions[currentRound];
      if (!q) return;

      setStreak(0);
      setIsOnFire(false);
      setFeedbackType('wrong');
      setFlashColor('red');
      setSelectedAnswer(q.correctPersonality);
      setAnswered(true);
      answeredRef.current = true;

      setTimeout(() => setFlashColor(null), 600);
      setTimeout(() => advanceToNext(currentRound), 2500);
    };
  }, [questions, currentRound, advanceToNext]);

  // ============================================
  // TIMER LOGIC
  // ============================================
  useEffect(() => {
    if (phase !== 'question' || !timerActive) return;

    questionStartTime.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerActive(false);
          if (!answeredRef.current) {
            answeredRef.current = true;
            handleTimeUpRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timerActive, currentRound]);

  // ============================================
  // START GAME
  // ============================================
  const startGame = useCallback(() => {
    const qs = generateQuestions(TOTAL_ROUNDS);
    setQuestions(qs);
    setCurrentRound(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setFeedbackType(null);
    setIsOnFire(false);
    setFlashColor(null);
    setAnswered(false);
    answeredRef.current = false;
    setCurrentFunFact(FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);
    setTimerActive(true);
    setTimeLeft(TIME_PER_QUESTION);
    questionStartTime.current = Date.now();
    setPhase('question');
  }, []);

  // ============================================
  // HANDLE ANSWER
  // ============================================
  const handleAnswer = useCallback((answer: string) => {
    if (answeredRef.current || phase !== 'question') return;
    answeredRef.current = true;
    setAnswered(true);
    setTimerActive(false);

    if (timerRef.current) clearInterval(timerRef.current);

    const q = questions[currentRound];
    if (!q) return;

    const isCorrect = answer === q.correctPersonality;
    setSelectedAnswer(answer);
    setFeedbackType(isCorrect ? 'correct' : 'wrong');
    setFlashColor(isCorrect ? 'green' : 'red');

    setTimeout(() => setFlashColor(null), 600);

    if (isCorrect) {
      const elapsed = (Date.now() - questionStartTime.current) / 1000;
      const speedBonus = Math.max(0, Math.round(MAX_SPEED_BONUS * (1 - elapsed / TIME_PER_QUESTION)));
      const newStreak = streak + 1;
      const streakBonus = newStreak >= STREAK_THRESHOLD ? STREAK_BONUS : 0;
      const points = BASE_POINTS + speedBonus + streakBonus;

      setScore(prev => prev + points);
      setLastPoints(points);
      setCorrectCount(prev => prev + 1);
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));

      if (newStreak >= STREAK_THRESHOLD) {
        setIsOnFire(true);
      }
    } else {
      setStreak(0);
      setIsOnFire(false);
      setLastPoints(0);
    }

    setTimeout(() => advanceToNext(currentRound), 2500);
  }, [phase, questions, currentRound, streak, advanceToNext]);

  // ============================================
  // COMPLETE GAME
  // ============================================
  const handleComplete = useCallback(() => {
    const isWinner = correctCount >= 3;
    const bonusTokens = isWinner ? tokenReward + 5 : tokenReward;
    const bonusXP = isWinner ? xpReward + 5 : xpReward;

    callbacks.earnTokens(bonusTokens, 'who_said_it');
    callbacks.addXP(bonusXP);
    callbacks.showToast(
      isWinner
        ? `🧠 People master! +${bonusTokens} ORRA +${bonusXP} XP`
        : `🤔 Nice try! +${bonusTokens} ORRA +${bonusXP} XP`,
      { duration: 3000 }
    );
    callbacks.completeGame(score, isWinner);
    // Close the game overlay after collecting rewards
    setTimeout(() => onClose(), 300);
  }, [correctCount, tokenReward, xpReward, callbacks, score, onClose]);

  const currentQuestion = questions[currentRound];
  const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correctCount / TOTAL_ROUNDS) * 100) : 0;
  const maxPossibleScore = TOTAL_ROUNDS * (BASE_POINTS + MAX_SPEED_BONUS + STREAK_BONUS);
  const scorePercentage = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;

  // ============================================
  // INTRO PHASE
  // ============================================
  if (phase === 'intro') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 text-center fade-in">
          <GameHeader
            icon="🤔"
            title="Who Said It"
            subtitle="Personality quiz"
            onClose={onClose}
          />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
            🤔
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Who Said It?</h2>
          <p className="text-sm text-slate-400 mb-4">Test your people skills!</p>

          <div className="flex items-center justify-center gap-3 mb-4 p-3 rounded-xl bg-white/5">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">{tokenReward}</p>
              <p className="text-[9px] text-slate-500">Tokens</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-violet-400">{xpReward}</p>
              <p className="text-[9px] text-slate-500">XP</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-white">{TOTAL_ROUNDS}</p>
              <p className="text-[9px] text-slate-500">Rounds</p>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2 mb-5 text-left p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs font-bold text-white mb-2">How to play:</p>
            <div className="flex items-start gap-2">
              <span className="text-sm">🎯</span>
              <p className="text-xs text-slate-300">Read the quote, pick who said it</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">⚡</span>
              <p className="text-xs text-slate-300">Answer fast for speed bonus (+{MAX_SPEED_BONUS}pts)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">🔥</span>
              <p className="text-xs text-slate-300">{STREAK_THRESHOLD}+ streak = On Fire +{STREAK_BONUS} bonus</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">⏱️</span>
              <p className="text-xs text-slate-300">{TIME_PER_QUESTION} seconds per question</p>
            </div>
          </div>

          <ActionButton onClick={startGame} color="from-indigo-600 to-violet-600">
            Start Quiz 🧠
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // QUESTION PHASE
  // ============================================
  if (phase === 'question' && currentQuestion) {
    const timePercentage = (timeLeft / TIME_PER_QUESTION) * 100;
    const isLowTime = timeLeft <= 3;

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 fade-in relative overflow-hidden">
          <GameHeader
            icon="🤔"
            title="Who Said It?"
            subtitle={`Round ${currentRound + 1}/${TOTAL_ROUNDS}`}
            onClose={onClose}
            rightElement={
              <span className="text-sm font-black text-amber-400">{score}</span>
            }
          />

          {/* Flash overlay */}
          {flashColor && (
            <div className={`absolute inset-0 rounded-2xl pointer-events-none z-10 ${
              flashColor === 'green' ? 'bg-green-500/20' : 'bg-red-500/20'
            } animate-pulse`} />
          )}

          {/* Timer bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400">⏱️ Time</span>
              <span className={`text-xs font-mono font-bold ${isLowTime ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isLowTime ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                }`}
                style={{ width: `${timePercentage}%` }}
              />
            </div>
          </div>

          {/* Score & Streak bar */}
          <div className="flex items-center justify-between mb-4 p-2 rounded-lg bg-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Score:</span>
              <span className="text-sm font-black text-amber-400">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              {isOnFire && (
                <span className="text-xs font-bold text-orange-400 animate-pulse">
                  🔥 ON FIRE! x{streak}
                </span>
              )}
              {!isOnFire && streak > 0 && (
                <span className="text-xs text-slate-400">
                  Streak: {streak}
                </span>
              )}
            </div>
          </div>

          {/* Quote card */}
          <div className="p-4 rounded-xl bg-white/5 border border-indigo-500/20 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-2xl mt-0.5">💬</span>
              <div>
                <p className="text-[10px] text-indigo-400 font-medium mb-1">Who would say this?</p>
                <p className="text-base font-bold text-white leading-relaxed">
                  &ldquo;{currentQuestion.quote}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Answer options */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctPersonality;
              const showResult = feedbackType !== null;

              let optionStyle = 'bg-white/5 border-white/10 text-white hover:bg-indigo-500/20 hover:border-indigo-500/40';

              if (showResult) {
                if (isCorrect) {
                  optionStyle = 'bg-green-500/20 border-green-500/50 text-green-300';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'bg-red-500/20 border-red-500/50 text-red-300';
                } else {
                  optionStyle = 'bg-white/5 border-white/5 text-slate-500';
                }
              }

              if (isSelected && !showResult) {
                optionStyle = 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300';
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={answered}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all ${optionStyle} flex items-center gap-2 ${
                    !answered ? 'active:scale-95' : ''
                  }`}
                >
                  <span className="text-lg">{PERSONALITY_EMOJIS[option] || '❓'}</span>
                  <span className="truncate">{option}</span>
                  {showResult && isCorrect && <span className="ml-auto text-green-400">✓</span>}
                  {showResult && isSelected && !isCorrect && <span className="ml-auto text-red-400">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Points earned indicator */}
          {feedbackType === 'correct' && lastPoints > 0 && (
            <div className="text-center mb-2 fade-in">
              <span className="text-sm font-black text-green-400">+{lastPoints} pts!</span>
              {lastPoints > BASE_POINTS && (
                <span className="text-[10px] text-amber-400 ml-1">
                  ({lastPoints - BASE_POINTS > STREAK_BONUS ? 'Speed + Streak' : lastPoints - BASE_POINTS > 0 ? 'Speed bonus!' : 'Streak bonus!'})
                </span>
              )}
            </div>
          )}

          {/* Fun fact */}
          {feedbackType && (
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-2 fade-in">
              <p className="text-[10px] text-indigo-300 text-center">
                💡 {currentFunFact}
              </p>
            </div>
          )}
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RESULTS PHASE
  // ============================================
  if (phase === 'results') {
    const isWinner = correctCount >= 3;
    const resultEmoji = isWinner ? '🏆' : correctCount >= 2 ? '👏' : '🤔';
    const resultTitle = isWinner ? 'People Master!' : correctCount >= 2 ? 'Not Bad!' : 'Keep Practicing!';

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 text-center fade-in">
          <GameHeader
            icon="🤔"
            title="Who Said It?"
            subtitle="Final Results"
            onClose={onClose}
          />

          <div className="text-5xl mb-3">{resultEmoji}</div>
          <h2 className="text-xl font-black text-white mb-1">{resultTitle}</h2>

          {/* Score display */}
          <div className="flex items-center justify-center gap-4 mb-4 p-4 rounded-xl bg-white/5">
            <div className="text-center">
              <p className="text-3xl font-black text-amber-400">{score}</p>
              <p className="text-[9px] text-slate-500">Total Points</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-400">{accuracy}%</p>
              <p className="text-[9px] text-slate-500">Accuracy</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400">Score</span>
              <span className="text-[10px] text-slate-400">{score}/{maxPossibleScore}</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  scorePercentage >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                    : scorePercentage >= 40
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-lg font-black text-green-400">{correctCount}</p>
              <p className="text-[9px] text-slate-500">Correct</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-lg font-black text-red-400">{TOTAL_ROUNDS - correctCount}</p>
              <p className="text-[9px] text-slate-500">Wrong</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-lg font-black text-orange-400">🔥 {maxStreak}</p>
              <p className="text-[9px] text-slate-500">Best Streak</p>
            </div>
          </div>

          {/* Per-round breakdown */}
          <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 max-h-40 overflow-y-auto">
            <p className="text-xs font-bold text-slate-400 mb-2">Round Breakdown</p>
            <div className="space-y-1.5">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 truncate max-w-[60%]">&ldquo;{q.quote.substring(0, 28)}...&rdquo;</span>
                  <span className="font-bold text-indigo-300">
                    {PERSONALITY_EMOJIS[q.correctPersonality]} {q.correctPersonality}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div className="flex items-center justify-center gap-3 mb-4 p-3 rounded-xl bg-white/5">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">+{isWinner ? tokenReward + 5 : tokenReward}</p>
              <p className="text-[9px] text-slate-500">ORRA</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-violet-400">+{isWinner ? xpReward + 5 : xpReward}</p>
              <p className="text-[9px] text-slate-500">XP</p>
            </div>
          </div>

          <ActionButton onClick={handleComplete} color="from-indigo-600 to-violet-600">
            Claim Rewards 🎁
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  return null;
}
