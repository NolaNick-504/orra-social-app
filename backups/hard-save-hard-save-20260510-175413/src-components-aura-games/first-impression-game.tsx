'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameOverlay,
  GameHeader,
  ProgressBar,
  ActionButton,
  PlayerAvatar,
  ScoreDisplay,
  FIRST_IMPRESSION_QUESTIONS,
} from './game-types';
import type { GameProps } from './game-types';

// ============================================
// TYPES
// ============================================

type GamePhase = 'intro' | 'question' | 'reveal' | 'final';

interface RoundResult {
  questionIndex: number;
  playerAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  speedBonus: number;
  hotStreakBonus: number;
  timeRemaining: number;
}

interface BotProfile {
  name: string;
  avatar: string;
  bio: string;
  answers: number[]; // index of the correct answer for each question
}

// ============================================
// BOT DATA
// ============================================

const BOT_PROFILES: BotProfile[] = [
  {
    name: 'Mia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=b6e3f4',
    bio: 'Coffee addict, sunset chaser, and professional overthinker ☕',
    answers: [1, 0, 0, 2, 0, 1, 2, 1],
  },
  {
    name: 'Jordan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&backgroundColor=c0aede',
    bio: 'Gym rat by day, gamer by night. Pizza is my love language 🍕',
    answers: [0, 1, 3, 3, 1, 0, 1, 3],
  },
  {
    name: 'Aria',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria&backgroundColor=ffd5dc',
    bio: 'Wanderlust soul. Make music, not war 🎵✈️',
    answers: [2, 0, 0, 0, 2, 3, 2, 0],
  },
  {
    name: 'Kai',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai&backgroundColor=d1f4d1',
    bio: 'Tech nerd with a sneaker obsession. Can cook a mean ramen 🍜',
    answers: [1, 2, 1, 3, 3, 2, 1, 2],
  },
];

const FUN_FACTS = [
  '73% of people guess wrong on this one!',
  'Only 1 in 4 people get this right!',
  'Most people pick the first option here!',
  'Psychology says you probably picked wrong 😏',
  'Statistically, the answer surprises most people!',
  'Fun fact: your gut instinct is usually wrong here!',
  'The majority always picks the wrong one for this!',
  'Only 27% of people nail this question!',
];

const REVEAL_MESSAGES_WRONG = [
  'Nope! Not even close! 😂',
  'Way off! Better luck next time!',
  'Oops! That was NOT it! 🤣',
  'You really thought?! 😭',
  'Nahhh, that ain\'t it chief!',
  'Swing and a miss! ⚾',
  'The audacity of that guess! 😤😂',
  'Be so fr right now 💀',
];

const REVEAL_MESSAGES_CORRECT = [
  'Nailed it! 🎯',
  'You read them like a book! 📖',
  'Spot on! Are you psychic?! 🔮',
  'You really know people! 🧠',
  'That\'s impressive! 👏',
  'Big brain energy! 🧠✨',
  'You should be a mind reader!',
  'Called it! You\'re good! 🔥',
];

const TOTAL_ROUNDS = 4;
const TIMER_SECONDS = 10;

// ============================================
// COMPONENT
// ============================================

export default function FirstImpressionGame({
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
  // ---- State ----
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [hotStreak, setHotStreak] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [revealMessage, setRevealMessage] = useState('');
  const [funFact, setFunFact] = useState('');
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [scorePopupText, setScorePopupText] = useState('');
  const [shakeWrong, setShakeWrong] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAnsweredRef = useRef(false);

  // Pick questions for this session (shuffle and take TOTAL_ROUNDS)
  const [questions] = useState(() => {
    const shuffled = [...FIRST_IMPRESSION_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_ROUNDS);
  });

  // Pick bot profile if bot mode
  const [botProfile] = useState<BotProfile>(() => {
    if (!isVsBot) return BOT_PROFILES[0];
    const idx = Math.floor(Math.random() * BOT_PROFILES.length);
    return BOT_PROFILES[idx];
  });

  // Determine the opponent's "real" answer for a given question
  const getCorrectAnswer = useCallback(
    (questionIndex: number): number => {
      if (isVsBot) {
        const originalIdx = FIRST_IMPRESSION_QUESTIONS.findIndex(
          (q) => q.question === questions[questionIndex].question
        );
        if (originalIdx >= 0 && originalIdx < botProfile.answers.length) {
          return botProfile.answers[originalIdx] % questions[questionIndex].options.length;
        }
      }
      // For non-bot, use seeded random based on opponent id
      const seed = opponent?.id || 'default';
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
      }
      return Math.abs(hash + questionIndex * 17) % questions[questionIndex].options.length;
    },
    [isVsBot, botProfile, questions, opponent]
  );

  const opponentName = isVsBot ? botProfile.name : opponent?.name || 'Mystery';
  const opponentAvatar = isVsBot ? botProfile.avatar : opponent?.avatar || '';
  const opponentBio = isVsBot ? botProfile.bio : opponent?.bio || 'No bio available';

  // ---- Timer Helpers ----
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle time out (no answer selected)
  const handleTimeOut = useCallback(() => {
    stopTimer();
    const correctAnswer = getCorrectAnswer(currentRound);
    const isCorrect = false;
    const speedBonus = 0;
    const hotStreakBonus = 0;
    setHotStreak(0);

    const result: RoundResult = {
      questionIndex: currentRound,
      playerAnswer: -1,
      correctAnswer,
      isCorrect,
      speedBonus,
      hotStreakBonus,
      timeRemaining: 0,
    };

    setRoundResults((prev) => [...prev, result]);
    setRevealMessage(REVEAL_MESSAGES_WRONG[Math.floor(Math.random() * REVEAL_MESSAGES_WRONG.length)]);
    setFunFact(FUN_FACTS[currentRound % FUN_FACTS.length]);
    setShakeWrong(true);
    setTimeout(() => setShakeWrong(false), 600);

    // Bot guesses for its own round (random)
    const botGuess = Math.random() > 0.5;
    if (botGuess) setBotScore((prev) => prev + 10);

    setPhase('reveal');
  }, [currentRound, getCorrectAnswer, stopTimer]);

  // Ref to the latest handleTimeOut so the timer callback always calls the fresh version
  const handleTimeOutRef = useRef(handleTimeOut);
  handleTimeOutRef.current = handleTimeOut;

  // ---- Timer ----
  const startTimer = useCallback(() => {
    setTimeLeft(TIMER_SECONDS);
    hasAnsweredRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Time ran out — auto-submit with no answer
          if (!hasAnsweredRef.current) {
            hasAnsweredRef.current = true;
            handleTimeOutRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ---- Handlers ----
  const handleStart = () => {
    setPhase('question');
    startTimer();
  };

  const handleSelectAnswer = (answerIndex: number) => {
    if (hasAnsweredRef.current) return;
    hasAnsweredRef.current = true;
    stopTimer();
    setSelectedAnswer(answerIndex);

    const correctAnswer = getCorrectAnswer(currentRound);
    const isCorrect = answerIndex === correctAnswer;
    const timeRemaining = timeLeft;
    const speedBonus = isCorrect ? Math.round((timeRemaining / TIMER_SECONDS) * 5) : 0;
    const newHotStreak = isCorrect ? hotStreak + 1 : 0;
    const hotStreakBonus = isCorrect && newHotStreak >= 2 ? 5 : 0;
    const pointsEarned = isCorrect ? 10 + speedBonus + hotStreakBonus : 0;

    if (isCorrect) {
      setScore((prev) => prev + pointsEarned);
      setHotStreak(newHotStreak);
      setScorePopupText(`+${pointsEarned}`);
      setShowScorePopup(true);
      setTimeout(() => setShowScorePopup(false), 1500);
    } else {
      setHotStreak(0);
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 600);
    }

    const result: RoundResult = {
      questionIndex: currentRound,
      playerAnswer: answerIndex,
      correctAnswer,
      isCorrect,
      speedBonus,
      hotStreakBonus,
      timeRemaining,
    };
    setRoundResults((prev) => [...prev, result]);

    setRevealMessage(
      isCorrect
        ? REVEAL_MESSAGES_CORRECT[Math.floor(Math.random() * REVEAL_MESSAGES_CORRECT.length)]
        : REVEAL_MESSAGES_WRONG[Math.floor(Math.random() * REVEAL_MESSAGES_WRONG.length)]
    );
    setFunFact(FUN_FACTS[currentRound % FUN_FACTS.length]);

    // Bot also gets a chance to score
    if (Math.random() > 0.4) {
      setBotScore((prev) => prev + 10 + Math.floor(Math.random() * 6));
    }

    setPhase('reveal');
  };

  const handleNextQuestion = () => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setPhase('final');
      return;
    }
    setCurrentRound((prev) => prev + 1);
    setSelectedAnswer(null);
    setPhase('question');
    startTimer();
  };

  const handleFinish = () => {
    const correctCount = roundResults.filter((r) => r.isCorrect).length;
    const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correctCount / TOTAL_ROUNDS) * 100) : 0;
    const isWinner = score > botScore;
    const earnedTokens = isWinner ? tokenReward : Math.floor(tokenReward / 3);
    const earnedXP = isWinner ? xpReward : Math.floor(xpReward / 3);

    callbacks.earnTokens(earnedTokens, 'First Impression Game');
    callbacks.addXP(earnedXP);
    callbacks.completeGame(score, isWinner);

    if (accuracy >= 75) {
      callbacks.showToast(`Amazing! ${accuracy}% accuracy! You really know people! 🔮`, { duration: 3000 });
    } else if (accuracy >= 50) {
      callbacks.showToast(`Not bad! ${accuracy}% accuracy. Keep reading people! 👀`, { duration: 3000 });
    } else {
      callbacks.showToast(`${accuracy}% accuracy. Maybe stick to being mysterious? 😏`, { duration: 3000 });
    }

    onClose();
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ---- Computed ----
  const correctCount = roundResults.filter((r) => r.isCorrect).length;
  const accuracy = roundResults.length > 0 ? Math.round((correctCount / roundResults.length) * 100) : 0;
  const currentQuestion = questions[currentRound];
  const currentCorrectAnswer = currentQuestion ? getCorrectAnswer(currentRound) : 0;

  // ---- Render ----
  return (
    <GameOverlay onClose={onClose}>
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <GameHeader
          icon="🧠"
          title="First Impression"
          subtitle={`Round ${Math.min(currentRound + 1, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}`}
          onClose={onClose}
          rightElement={<ScoreDisplay p1Score={score} p2Score={botScore} />}
        />

        {/* ========== INTRO PHASE ========== */}
        {phase === 'intro' && (
          <div className="p-4 sm:p-6 fade-in">
            {/* Decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-violet-500/30">
                <span className="text-3xl">🧠</span>
              </div>
              <h2 className="text-xl font-black text-white mb-1">First Impression</h2>
              <p className="text-sm text-slate-400">Can you guess things about someone you barely know?</p>
            </div>

            {/* Opponent Profile Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <PlayerAvatar src={opponentAvatar} name={opponentName} size="lg" ring="ring-fuchsia-400" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg truncate">{opponentName}</h3>
                  <p className="text-xs text-slate-500">Your opponent</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{opponentBio}</p>
            </div>

            {/* Rules */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400">4</span>
                <span>Multiple-choice questions about your opponent</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400">⚡</span>
                <span>10 pts for correct + speed bonus up to 5</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-5 h-5 rounded-md bg-red-500/20 flex items-center justify-center text-[10px] font-bold text-red-400">🔥</span>
                <span>Hot Streak: +5 bonus for consecutive correct answers</span>
              </div>
            </div>

            <ActionButton onClick={handleStart} color="from-violet-600 to-fuchsia-600">
              <span>Let&apos;s Go!</span>
              <span className="text-lg">🧠</span>
            </ActionButton>
          </div>
        )}

        {/* ========== QUESTION PHASE ========== */}
        {phase === 'question' && currentQuestion && (
          <div className="p-4 sm:p-6 fade-in">
            {/* Timer */}
            <div className="mb-4">
              <ProgressBar
                value={timeLeft}
                max={TIMER_SECONDS}
                isLow={timeLeft <= 3}
                color="from-violet-500 to-fuchsia-500"
              />
            </div>

            {/* Hot Streak indicator */}
            {hotStreak >= 1 && (
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold text-amber-400">
                  Hot Streak x{hotStreak}
                </span>
                {hotStreak >= 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                    +5 BONUS
                  </span>
                )}
              </div>
            )}

            {/* Question */}
            <div className="text-center mb-4">
              <p className="text-xs text-slate-500 mb-1">About {opponentName}...</p>
              <h3 className="text-lg font-bold text-white">{currentQuestion.question}</h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5 mb-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={hasAnsweredRef.current}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                    hasAnsweredRef.current
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white hover:bg-violet-600/20 hover:border-violet-500/40 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Opponent mini avatar */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <PlayerAvatar src={opponentAvatar} name={opponentName} size="sm" ring="ring-slate-600" />
              <span>What would {opponentName} pick?</span>
            </div>
          </div>
        )}

        {/* ========== REVEAL PHASE ========== */}
        {phase === 'reveal' && currentQuestion && (
          <div className={`p-4 sm:p-6 fade-in ${shakeWrong ? 'animate-shake' : ''}`}>
            {/* Score popup */}
            {showScorePopup && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <span className="text-4xl font-black text-amber-400 animate-bounce drop-shadow-lg">
                  {scorePopupText}
                </span>
              </div>
            )}

            {/* Reveal message */}
            <div className="text-center mb-4">
              <span className="text-3xl mb-2 block">
                {roundResults[roundResults.length - 1]?.isCorrect ? '🎯' : '💀'}
              </span>
              <h3 className="text-lg font-bold text-white mb-1">{revealMessage}</h3>
              <p className="text-xs text-slate-400">{funFact}</p>
            </div>

            {/* Answer reveal */}
            <div className="space-y-2 mb-4">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = idx === currentCorrectAnswer;
                const wasPicked = idx === selectedAnswer;
                const isWrongPick = wasPicked && !isCorrect;

                return (
                  <div
                    key={idx}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      isCorrect
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : isWrongPick
                          ? 'bg-red-500/20 border-red-500/40 text-red-300'
                          : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : isWrongPick
                              ? 'bg-red-500/30 text-red-300'
                              : 'bg-white/10 text-slate-500'
                        }`}
                      >
                        {isCorrect ? '✓' : isWrongPick ? '✗' : String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isCorrect && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          THEIR PICK
                        </span>
                      )}
                      {isWrongPick && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                          YOUR PICK
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Round score summary */}
            {roundResults.length > 0 && (() => {
              const lastResult = roundResults[roundResults.length - 1];
              return (
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Round {currentRound + 1} Score</span>
                    <div className="flex items-center gap-3">
                      {lastResult.isCorrect && (
                        <>
                          <span className="text-emerald-400 font-bold">+10 correct</span>
                          {lastResult.speedBonus > 0 && (
                            <span className="text-amber-400 font-bold">+{lastResult.speedBonus} speed</span>
                          )}
                          {lastResult.hotStreakBonus > 0 && (
                            <span className="text-red-400 font-bold">+{lastResult.hotStreakBonus} streak</span>
                          )}
                        </>
                      )}
                      {!lastResult.isCorrect && (
                        <span className="text-red-400 font-bold">+0</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Hot Streak indicator */}
            {hotStreak >= 2 && (
              <div className="flex items-center justify-center gap-1.5 mb-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-bold text-amber-400">Hot Streak x{hotStreak}!</span>
                <span className="text-xs text-amber-400/70">+5 bonus active</span>
              </div>
            )}

            <ActionButton onClick={handleNextQuestion} color="from-violet-600 to-fuchsia-600">
              {currentRound + 1 >= TOTAL_ROUNDS ? (
                <>
                  <span>See Results</span>
                  <span>🏆</span>
                </>
              ) : (
                <>
                  <span>Next Question</span>
                  <span>→</span>
                </>
              )}
            </ActionButton>
          </div>
        )}

        {/* ========== FINAL PHASE ========== */}
        {phase === 'final' && (
          <div className="p-4 sm:p-6 fade-in max-h-[80vh] overflow-y-auto">
            {/* Decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30">
                <span className="text-3xl">🏆</span>
              </div>
              <h2 className="text-xl font-black text-white mb-1">Game Over!</h2>
              <p className="text-sm text-slate-400">
                {score > botScore ? 'You crushed it!' : score < botScore ? 'Better luck next time!' : 'It\'s a tie!'}
              </p>
            </div>

            {/* Score Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Your Score</p>
                  <p className="text-2xl font-black text-white">{score}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Accuracy</p>
                  <p className={`text-2xl font-black ${accuracy >= 75 ? 'text-emerald-400' : accuracy >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {accuracy}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Opponent</p>
                  <p className="text-2xl font-black text-slate-300">{botScore}</p>
                </div>
              </div>
            </div>

            {/* Best Moments */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Best Moments</h4>
              <div className="space-y-2">
                {roundResults.map((result, idx) => {
                  const q = questions[idx];
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl ${
                        result.isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
                      }`}
                    >
                      <span className="text-lg">{result.isCorrect ? '✅' : '❌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{q?.question}</p>
                        <p className="text-[10px] text-slate-500">
                          {result.isCorrect
                            ? `Correct! +10${result.speedBonus > 0 ? ` +${result.speedBonus} speed` : ''}${result.hotStreakBonus > 0 ? ` +${result.hotStreakBonus} streak` : ''}`
                            : `Wrong — the answer was "${q?.options[result.correctAnswer]}"`}
                        </p>
                      </div>
                      {result.isCorrect && (
                        <span className="text-xs font-bold text-emerald-400">
                          +{10 + result.speedBonus + result.hotStreakBonus}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rewards */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-bold text-amber-400">+{tokenReward} ORRA</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm font-bold text-violet-400">+{xpReward} XP</span>
                </div>
              </div>
            </div>

            <ActionButton onClick={handleFinish} color="from-amber-500 to-orange-600">
              <span>Claim Rewards</span>
              <span>🎉</span>
            </ActionButton>
          </div>
        )}
      </div>
    </GameOverlay>
  );
}
