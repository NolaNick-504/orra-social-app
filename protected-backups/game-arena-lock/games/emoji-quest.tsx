'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Zap, ChevronRight } from 'lucide-react';

interface EmojiQuestProps {
  onBack: () => void;
}

const PUZZLES = [
  { emojis: '🍎📱💻', answer: 'Apple', hint: 'Think tech company' },
  { emojis: '🦁👑', answer: 'Lion King', hint: 'Disney classic' },
  { emojis: '☀️🌻', answer: 'Sunflower', hint: 'A tall yellow plant' },
  { emojis: '🌊🏠', answer: 'Beach House', hint: 'Where you live by the sea' },
  { emojis: '📚🐛', answer: 'Bookworm', hint: 'Someone who loves reading' },
  { emojis: '🎵🎤', answer: 'Karaoke', hint: 'Singing for fun' },
  { emojis: '👁️❤️🍕', answer: 'I love pizza', hint: 'Express your feelings about food' },
  { emojis: '🌙💤', answer: 'Goodnight', hint: 'Bedtime greeting' },
  { emojis: '🔥🎵', answer: 'Firework', hint: 'Katy Perry song' },
  { emojis: '🌧️🌈', answer: 'Rainbow', hint: 'After the storm' },
  { emojis: '🎬🍿', answer: 'Movie Night', hint: 'A cozy evening activity' },
  { emojis: '⭐💫🌟', answer: 'Stargazing', hint: 'Looking up at night' },
];

export function EmojiQuest({ onBack }: EmojiQuestProps) {
  const { earnTokens } = useAuraStore();
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);

  const puzzle = PUZZLES[puzzleIndex];

  const checkAnswer = () => {
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedAnswer = puzzle.answer.toLowerCase();
    const correct = normalizedGuess === normalizedAnswer || normalizedGuess.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedGuess);

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      const points = showHint ? 1 : 2;
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const nextPuzzle = () => {
    if (puzzleIndex + 1 >= PUZZLES.length) {
      earnTokens(score * 2, 'Emoji Quest completed');
      setGameOver(true);
    } else {
      setPuzzleIndex((prev) => prev + 1);
      setGuess('');
      setShowHint(false);
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  const resetGame = () => {
    setPuzzleIndex(0);
    setGuess('');
    setShowHint(false);
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setStreak(0);
    setGameOver(false);
  };

  if (gameOver) {
    const maxScore = PUZZLES.length * 2;
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🧩</div>
          <h2 className="text-2xl font-black text-white mb-1">Quest Complete!</h2>
          <div className="text-4xl font-black text-white mb-2">{score}/{maxScore}</div>
          <p className="text-sm text-slate-400 mb-2">Emoji Master Score</p>
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">+{score * 2} ORRA</span>
          </div>
          <div className="space-y-2 mt-4">
            <button onClick={resetGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-sm">Play Again</button>
            <button onClick={onBack} className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all">Back to Arena</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>
        <div className="flex items-center gap-2">
          {streak > 1 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 text-xs">
              🔥 <span className="text-orange-400 font-bold">{streak}x</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-xs">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{score}</span>
          </div>
          <span className="text-xs text-slate-500">{puzzleIndex + 1}/{PUZZLES.length}</span>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-black text-white">Emoji Quest</h2>
        <p className="text-xs text-slate-500">Decode the emoji puzzle!</p>
      </div>

      {/* Emoji Display */}
      <div className="glass-panel rounded-2xl p-6 text-center">
        <div className="text-5xl mb-2 tracking-wider">{puzzle.emojis}</div>
        <p className="text-xs text-slate-500">What does this mean?</p>
      </div>

      {/* Hint */}
      {!showResult && (
        <button onClick={() => setShowHint(true)} className="w-full py-2 rounded-xl bg-white/5 text-xs text-slate-500 hover:text-slate-300 transition-all">
          {showHint ? `💡 ${puzzle.hint}` : 'Need a hint? (-1 point)'}
        </button>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && guess.trim()) checkAnswer(); }}
          placeholder="Type your answer..."
          disabled={showResult}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/50 transition-all disabled:opacity-50"
        />
        {!showResult && (
          <button
            onClick={checkAnswer}
            disabled={!guess.trim()}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-sm disabled:opacity-50"
          >
            Go
          </button>
        )}
      </div>

      {/* Result */}
      {showResult && (
        <div className={`glass-panel rounded-2xl p-4 text-center ${isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <p className={`text-lg font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? 'Correct! 🎉' : 'Not quite! 😅'}
          </p>
          {!isCorrect && (
            <p className="text-sm text-slate-400">The answer was: <span className="text-white font-bold">{puzzle.answer}</span></p>
          )}
          <button onClick={nextPuzzle} className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2">
            {puzzleIndex + 1 >= PUZZLES.length ? 'See Results' : 'Next Puzzle'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
