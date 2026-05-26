'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameOverlay,
  GameHeader,
  ActionButton,
} from './game-types';
import {
  VIBE_CHECK_QUESTIONS,
  type GameProps,
} from './game-types';

// ============================================
// TYPES
// ============================================

type VibePhase = 'intro' | 'question' | 'reveal' | 'final';

interface CommunityData {
  percentages: number[];
  totalResponses: number;
}

// ============================================
// HELPER: Simulate community response data
// ============================================

function generateCommunityData(optionCount: number, playerIndex: number): CommunityData {
  // Generate realistic-looking community percentages
  const raw = Array.from({ length: optionCount }, () => 10 + Math.random() * 40);
  // Bias slightly toward the player's choice to make matching feel possible
  raw[playerIndex] += 15 + Math.random() * 10;
  const total = raw.reduce((a, b) => a + b, 0);
  const percentages = raw.map((v) => Math.round((v / total) * 100));
  // Fix rounding to sum to 100
  const diff = 100 - percentages.reduce((a, b) => a + b, 0);
  percentages[playerIndex] += diff;
  const totalResponses = 120 + Math.floor(Math.random() * 880);
  return { percentages, totalResponses };
}

// ============================================
// EMOJI RAIN COMPONENT
// ============================================

const RAIN_EMOJIS = ['✨', '🌟', '💫', '⭐', '🪩', '🔮', '💜', '💗', '🌈', '🎭', '🎵', '🌙'];

function EmojiRain({ active }: { active: boolean }) {
  const [emojis, setEmojis] = useState<{ id: number; emoji: string; x: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const id = setInterval(() => {
      setEmojis((prev) => {
        const next = [
          ...prev,
          {
            id: Date.now() + Math.random(),
            emoji: RAIN_EMOJIS[Math.floor(Math.random() * RAIN_EMOJIS.length)],
            x: Math.random() * 100,
            delay: 0,
            duration: 2 + Math.random() * 3,
          },
        ];
        return next.slice(-25);
      });
    }, 200);
    return () => clearInterval(id);
  }, [active]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vibe-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          100% { transform: translateY(600px) rotate(360deg); opacity: 0; }
        }
      `}} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {emojis.map((e) => (
          <span
            key={e.id}
            className="absolute text-xl"
            style={{
              left: `${e.x}%`,
              top: '-10%',
              animation: `vibe-fall ${e.duration}s linear forwards`,
              opacity: 0.6,
            }}
          >
            {e.emoji}
          </span>
        ))}
      </div>
    </>
  );
}

// ============================================
// ANIMATED BAR CHART
// ============================================

function CommunityBarChart({
  options,
  communityData,
  playerChoice,
  revealed,
}: {
  options: string[];
  communityData: CommunityData;
  playerChoice: number;
  revealed: boolean;
}) {
  const majorityIndex = communityData.percentages.indexOf(Math.max(...communityData.percentages));
  const isMatch = playerChoice === majorityIndex;

  return (
    <div className="space-y-2.5 mt-3">
      {options.map((opt, i) => {
        const pct = communityData.percentages[i];
        const isPlayerChoice = i === playerChoice;
        const isMajority = i === majorityIndex;
        return (
          <div key={i} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold truncate max-w-[70%] ${isPlayerChoice ? 'text-fuchsia-300' : 'text-slate-300'}`}>
                {opt}
                {isPlayerChoice && <span className="ml-1 text-[9px] text-fuchsia-400">(you)</span>}
              </span>
              <span className={`text-xs font-bold font-mono ${isMajority ? 'text-amber-400' : 'text-slate-500'}`}>
                {revealed ? `${pct}%` : '??'}
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isMajority
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : isPlayerChoice
                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-400'
                    : 'bg-white/20'
                }`}
                style={{ width: revealed ? `${pct}%` : '0%' }}
              />
            </div>
          </div>
        );
      })}

      {revealed && (
        <div className={`mt-3 p-3 rounded-xl text-center ${isMatch ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/5 border border-white/10'}`}>
          <p className={`text-sm font-bold ${isMatch ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isMatch ? '🎯 You match the majority!' : '🦄 Unique vibes!'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            You match with {communityData.percentages[playerChoice]}% of the community
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// VIBE PROFILE CARD (Final Screen)
// ============================================

function VibeProfileCard({
  answers,
  questions,
  vibeScore,
  tokensEarned,
  matchCount,
}: {
  answers: number[];
  questions: typeof VIBE_CHECK_QUESTIONS;
  vibeScore: number;
  tokensEarned: number;
  matchCount: number;
}) {
  const profileEmojis = answers.map((ansIdx, qIdx) => {
    const opt = questions[qIdx % questions.length].options[ansIdx];
    const emojiMatch = opt.match(/^(\S+)/);
    return emojiMatch ? emojiMatch[1] : '✨';
  });

  return (
    <div className="space-y-4">
      {/* Emoji summary */}
      <div className="text-center">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Your Vibe Profile</p>
        <div className="flex items-center justify-center gap-2">
          {profileEmojis.map((emoji, i) => (
            <span
              key={i}
              className="text-3xl animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Vibe Score */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-fuchsia-900/20 to-pink-900/10 border border-fuchsia-500/20 text-center">
        <p className="text-[10px] text-fuchsia-400 uppercase tracking-wider font-bold mb-1">Vibe Score</p>
        <p className="text-4xl font-black text-white">
          {vibeScore}
          <span className="text-lg text-fuchsia-400">%</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {vibeScore >= 70
            ? 'Mainstream vibes — you fit right in! 🌊'
            : vibeScore >= 40
            ? 'Balanced vibe — best of both worlds! ⚖️'
            : 'Unique vibes — one of a kind! 🦄'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-lg font-bold text-amber-400">+{tokensEarned}</p>
          <p className="text-[9px] text-slate-500">Tokens Earned</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <p className="text-lg font-bold text-emerald-400">{matchCount}/5</p>
          <p className="text-[9px] text-slate-500">Majority Matches</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function VibeCheckGame({
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
  const [phase, setPhase] = useState<VibePhase>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [communityDataMap, setCommunityDataMap] = useState<Map<number, CommunityData>>(new Map());
  const [revealReady, setRevealReady] = useState(false);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [introTimer, setIntroTimer] = useState(3);

  const totalRounds = 5;
  const questions = VIBE_CHECK_QUESTIONS;

  // ---- Pick 5 random questions (deterministic for session) ----
  const [selectedQuestions] = useState(() => {
    const shuffled = [...questions].sort(() => {
      const seed = Date.now() % 1000;
      return (seed * 0.001 - 0.5);
    });
    return shuffled.slice(0, totalRounds);
  });

  const currentQuestion = selectedQuestions[currentRound];

  // ---- Intro countdown ----
  useEffect(() => {
    if (phase !== 'intro') return;
    if (introTimer <= 0) return;
    const t = setTimeout(() => setIntroTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, introTimer]);

  // ---- Handle answer selection ----
  const handleSelectAnswer = useCallback(
    (optionIndex: number) => {
      if (selectedOption !== null) return;
      setSelectedOption(optionIndex);
    },
    [selectedOption]
  );

  // ---- Confirm answer & generate community data ----
  const handleConfirmAnswer = useCallback(() => {
    if (selectedOption === null) return;

    // Generate community data for this question
    const data = generateCommunityData(currentQuestion.options.length, selectedOption);
    const newMap = new Map(communityDataMap);
    newMap.set(currentRound, data);
    setCommunityDataMap(newMap);

    // Submit to server
    callbacks.submitToServer(currentRound, String(selectedOption), isVsBot);

    // Transition to reveal
    setPhase('reveal');
    setTimeout(() => setRevealReady(true), 300);
  }, [selectedOption, currentRound, currentQuestion, communityDataMap, callbacks, isVsBot]);

  // ---- Next round after reveal ----
  const handleNextRound = useCallback(() => {
    const data = communityDataMap.get(currentRound);
    const playerAnswer = selectedOption!;

    // Check if player matched majority
    let roundMatch = false;
    if (data) {
      const majorityIdx = data.percentages.indexOf(Math.max(...data.percentages));
      roundMatch = playerAnswer === majorityIdx;
    }

    const newAnswers = [...answers, playerAnswer];
    setAnswers(newAnswers);
    const newMatchCount = matchCount + (roundMatch ? 1 : 0);
    setMatchCount(newMatchCount);

    if (roundMatch) {
      const bonus = 5;
      setTokensEarned((prev) => prev + bonus);
      callbacks.earnTokens(bonus, `vibe_check_match_r${currentRound}`);
      callbacks.showToast(`🎯 Majority match! +${bonus} tokens`, { duration: 2000 });
    } else {
      callbacks.showToast('🦄 Unique choice!', { duration: 1500 });
    }

    callbacks.addXP(3);

    // Reset round state
    setSelectedOption(null);
    setRevealReady(false);

    if (currentRound + 1 >= totalRounds) {
      setPhase('final');
    } else {
      setCurrentRound((r) => r + 1);
      setPhase('question');
    }
  }, [currentRound, selectedOption, answers, communityDataMap, matchCount, totalRounds, callbacks]);

  // ---- Calculate vibe score ----
  const calculateVibeScore = useCallback(() => {
    // Percentage of how mainstream your vibes are
    let totalMatchPct = 0;
    answers.forEach((ansIdx, qIdx) => {
      const data = communityDataMap.get(qIdx);
      if (data) {
        totalMatchPct += data.percentages[ansIdx];
      }
    });
    return Math.round(totalMatchPct / answers.length);
  }, [answers, communityDataMap]);

  // ---- Complete game ----
  const hasCompletedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'final' || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    const vibeScore = calculateVibeScore();
    const isWinner = vibeScore >= 50;
    const finalTokens = tokensEarned + (isWinner ? tokenReward : Math.floor(tokenReward / 3));
    const finalXP = isWinner ? xpReward : Math.floor(xpReward / 3);
    callbacks.earnTokens(isWinner ? tokenReward : Math.floor(tokenReward / 3), 'vibe_check_complete');
    callbacks.addXP(finalXP);
    callbacks.completeGame(finalTokens, isWinner);
  }, [phase]);

  // ============================================
  // RENDER: Intro
  // ============================================
  if (phase === 'intro') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-fuchsia-500/30 text-center relative overflow-hidden">
          <EmojiRain active={true} />
          <div className="relative z-10">
            <GameHeader
              icon="✨"
              title="Vibe Check"
              subtitle="What's your vibe?"
              onClose={onClose}
            />

            <div className="my-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-fuchsia-600 to-pink-400 flex items-center justify-center text-5xl mx-auto mb-4 shadow-lg shadow-fuchsia-500/30 animate-pulse">
                🔮
              </div>
              <h2 className="text-3xl font-black text-white mb-2">What&apos;s your vibe?</h2>
              <p className="text-sm text-slate-400">5 questions to reveal your true vibe</p>
              <p className="text-xs text-slate-500 mt-2">Match the majority for bonus tokens!</p>
            </div>

            <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-white/5 mb-4">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">5</p>
                <p className="text-[9px] text-slate-500">Rounds</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-fuchsia-400">+5</p>
                <p className="text-[9px] text-slate-500">Per Match</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-400">{tokenReward}</p>
                <p className="text-[9px] text-slate-500">Completion</p>
              </div>
            </div>

            {introTimer > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-400 flex items-center justify-center text-2xl font-black text-white animate-pulse">
                  {introTimer}
                </div>
              </div>
            ) : (
              <ActionButton onClick={() => setPhase('question')} color="from-fuchsia-600 to-pink-500">
                Let&apos;s Go ✨
              </ActionButton>
            )}
          </div>
        </div>


      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Question
  // ============================================
  if (phase === 'question') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-fuchsia-500/30 relative overflow-hidden">
          <GameHeader
            icon="✨"
            title="Vibe Check"
            subtitle={`Round ${currentRound + 1} of ${totalRounds}`}
            onClose={onClose}
            rightElement={
              <span className="text-xs text-amber-400 font-bold font-mono">
                +{tokensEarned} 🪙
              </span>
            }
          />

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < currentRound
                    ? 'w-6 bg-fuchsia-500'
                    : i === currentRound
                    ? 'w-8 bg-gradient-to-r from-fuchsia-500 to-pink-400'
                    : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Question */}
          <div className="text-center mb-5">
            <h3 className="text-xl font-bold text-white">{currentQuestion.question}</h3>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = selectedOption === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectAnswer(i)}
                  className={`w-full p-3.5 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-fuchsia-500/20 border-2 border-fuchsia-400 ring-1 ring-fuchsia-400/50 scale-[1.02]'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-xl min-w-[28px]">{opt.split(' ')[0]}</span>
                  <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {opt.slice(opt.indexOf(' ') + 1)}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-fuchsia-400 text-xs font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Confirm button */}
          <div className="mt-5">
            <ActionButton
              onClick={handleConfirmAnswer}
              disabled={selectedOption === null}
              color="from-fuchsia-600 to-pink-500"
            >
              {selectedOption !== null ? 'Lock It In 🔒' : 'Pick Your Vibe'}
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Reveal (Community Breakdown)
  // ============================================
  if (phase === 'reveal') {
    const data = communityDataMap.get(currentRound);
    const majorityIndex = data ? data.percentages.indexOf(Math.max(...data.percentages)) : -1;
    const isMatch = selectedOption === majorityIndex;

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-fuchsia-500/30 relative overflow-hidden">
          <GameHeader
            icon="✨"
            title="Vibe Check"
            subtitle={`Round ${currentRound + 1} — Community Reveal`}
            onClose={onClose}
            rightElement={
              <span className="text-xs text-amber-400 font-bold font-mono">
                +{tokensEarned} 🪙
              </span>
            }
          />

          {/* Question recap */}
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold text-white">{currentQuestion.question}</h3>
            <p className="text-sm text-fuchsia-300 mt-1">
              You picked: <span className="font-bold">{currentQuestion.options[selectedOption!]}</span>
            </p>
          </div>

          {/* Community breakdown */}
          {data && (
            <CommunityBarChart
              options={currentQuestion.options}
              communityData={data}
              playerChoice={selectedOption!}
              revealed={revealReady}
            />
          )}

          {/* Match info */}
          {revealReady && (
            <div className="mt-3 text-center">
              <p className="text-xs text-slate-500">
                {data?.totalResponses.toLocaleString()} community responses
              </p>
            </div>
          )}

          {/* Next round / Final */}
          <div className="mt-5">
            <ActionButton
              onClick={handleNextRound}
              color={isMatch ? 'from-emerald-600 to-green-500' : 'from-fuchsia-600 to-pink-500'}
            >
              {currentRound + 1 >= totalRounds
                ? 'See Your Vibe Profile 🔮'
                : 'Next Vibe →'}
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RENDER: Final
  // ============================================
  if (phase === 'final') {
    const vibeScore = calculateVibeScore();
    const isWinner = vibeScore >= 50;

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-fuchsia-500/30 relative overflow-hidden max-h-[90vh] overflow-y-auto">
          <GameHeader
            icon="🔮"
            title="Vibe Check Complete"
            subtitle="Your vibe profile"
            onClose={onClose}
          />

          {/* Winner banner */}
          <div className={`text-center p-4 rounded-xl mb-4 ${isWinner ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-fuchsia-500/15 border border-fuchsia-500/30'}`}>
            <p className="text-2xl mb-1">{isWinner ? '🏆' : '✨'}</p>
            <p className={`text-lg font-bold ${isWinner ? 'text-amber-400' : 'text-fuchsia-400'}`}>
              {isWinner ? 'Vibe Master!' : 'Unique Soul!'}
            </p>
          </div>

          <VibeProfileCard
            answers={answers}
            questions={selectedQuestions}
            vibeScore={vibeScore}
            tokensEarned={tokensEarned + (isWinner ? tokenReward : Math.floor(tokenReward / 3))}
            matchCount={matchCount}
          />

          {/* Share hint */}
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-xs text-slate-400">📸 Share your vibe profile to your feed!</p>
          </div>

          {/* Close */}
          <div className="mt-4">
            <ActionButton onClick={onClose} color="from-fuchsia-600 to-pink-500">
              Done ✨
            </ActionButton>
          </div>
        </div>
      </GameOverlay>
    );
  }

  return null;
}
