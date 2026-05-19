'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Zap, Eye, ChevronRight } from 'lucide-react';

interface GuessTheVibeProps {
  onBack: () => void;
}

const ROUNDS = [
  {
    description: 'A room full of people silently staring at their phones while a live band plays on stage',
    answer: 'Awkward',
    options: ['Awkward', 'Chill', 'Hype', 'Romantic'],
    hints: ['Think about the disconnect...', 'Nobody is paying attention'],
  },
  {
    description: 'Two strangers sharing an umbrella at a bus stop in the rain, laughing about getting soaked anyway',
    answer: 'Wholesome',
    options: ['Awkward', 'Wholesome', 'Dramatic', 'Mysterious'],
    hints: ['It\'s a sweet moment...', 'Strangers connecting'],
  },
  {
    description: 'A DJ drops the beat and the entire crowd jumps in unison, hands in the air',
    answer: 'Hype',
    options: ['Chill', 'Confusing', 'Hype', 'Cringe'],
    hints: ['Feel the energy...', 'Pure electricity'],
  },
  {
    description: 'Someone gives a 10-minute toast at a wedding that\'s just them reading Wikipedia articles',
    answer: 'Cringe',
    options: ['Romantic', 'Cringe', 'Educational', 'Wholesome'],
    hints: ['Everyone is uncomfortable...', 'Not the right time and place'],
  },
  {
    description: 'Walking into a cozy cafe on a rainy day and finding your favorite book on the shelf',
    answer: 'Chill',
    options: ['Lucky', 'Chill', 'Mysterious', 'Awkward'],
    hints: ['Perfect peace and quiet...', 'This is the life'],
  },
  {
    description: 'You get a text at 2 AM that just says "we need to talk" with no context',
    answer: 'Dramatic',
    options: ['Chill', 'Funny', 'Dramatic', 'Wholesome'],
    hints: ['Your heart just dropped...', 'The suspense is killing you'],
  },
  {
    description: 'A dog wearing sunglasses rides a skateboard past a group of surprised tourists',
    answer: 'Funny',
    options: ['Confusing', 'Hype', 'Funny', 'Cringe'],
    hints: ['You can\'t help but smile...', 'That dog has more style than most people'],
  },
  {
    description: 'Finding a handwritten note from your childhood self hidden inside an old book',
    answer: 'Nostalgic',
    options: ['Scary', 'Nostalgic', 'Chill', 'Awkward'],
    hints: ['Memories flooding back...', 'A message from the past'],
  },
];

export function GuessTheVibe({ onBack }: GuessTheVibeProps) {
  const { earnTokens } = useAuraStore();
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const round = ROUNDS[roundIndex];

  const handleGuess = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);

    if (option === round.answer) {
      const points = showHint ? 1 : 2;
      setScore((prev) => prev + points);
    }
  };

  const nextRound = () => {
    if (roundIndex + 1 >= ROUNDS.length) {
      earnTokens(score * 2, 'Guess the Vibe completed');
      setGameOver(true);
    } else {
      setRoundIndex((prev) => prev + 1);
      setSelected(null);
      setShowResult(false);
      setShowHint(false);
      setHintIndex(0);
    }
  };

  const revealHint = () => {
    setShowHint(true);
    if (hintIndex < round.hints.length - 1) {
      setHintIndex((prev) => prev + 1);
    }
  };

  const resetGame = () => {
    setRoundIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setShowHint(false);
    setHintIndex(0);
    setGameOver(false);
  };

  if (gameOver) {
    const maxScore = ROUNDS.length * 2;
    const pct = Math.round((score / maxScore) * 100);
    const rating = pct >= 80 ? 'Vibe Master!' : pct >= 50 ? 'Good Vibes!' : 'Keep Reading the Room!';
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🔮</div>
          <h2 className="text-2xl font-black text-white mb-1">{rating}</h2>
          <p className="text-sm text-slate-400 mb-2">You scored {score} out of {maxScore}</p>
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">+{score * 2} ORRA</span>
          </div>
          <div className="space-y-2 mt-4">
            <button onClick={resetGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-sm">Play Again</button>
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
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-xs">
            <Eye className="w-3 h-3 text-teal-400" />
            <span className="text-white font-bold">{score}</span>
          </div>
          <span className="text-xs text-slate-500">{roundIndex + 1}/{ROUNDS.length}</span>
        </div>
      </div>

      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 h-1.5 rounded-full transition-all" style={{ width: `${((roundIndex + 1) / ROUNDS.length) * 100}%` }} />
      </div>

      <div className="text-center">
        <h2 className="text-lg font-black text-white">Guess the Vibe</h2>
        <p className="text-xs text-slate-500">Can you read the room?</p>
      </div>

      {/* Scenario */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-teal-400">Read the scene...</span>
        </div>
        <p className="text-sm text-white leading-relaxed">{round.description}</p>
      </div>

      {/* Hint */}
      {!showResult && (
        <button onClick={revealHint} className="w-full py-2 rounded-xl bg-white/5 text-xs text-slate-500 hover:text-slate-300 transition-all">
          {showHint ? `Hint: ${round.hints[hintIndex]}` : 'Need a hint? (-1 point)'}
        </button>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {round.options.map((option) => {
          let btnClass = 'border-white/10 bg-white/5 hover:border-teal-500/30';
          if (showResult) {
            if (option === round.answer) {
              btnClass = 'border-green-500/50 bg-green-500/10';
            } else if (option === selected) {
              btnClass = 'border-red-500/50 bg-red-500/10';
            } else {
              btnClass = 'opacity-40 border-white/5 bg-white/5';
            }
          }
          return (
            <button
              key={option}
              onClick={() => handleGuess(option)}
              disabled={showResult}
              className={`p-3 rounded-xl border text-sm font-bold text-white transition-all ${btnClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <button onClick={nextRound} className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2">
          {roundIndex + 1 >= ROUNDS.length ? 'See Results' : 'Next Scene'} <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
