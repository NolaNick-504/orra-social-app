'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Trophy, Flame, Zap, Star } from 'lucide-react';


interface DanceOffProps {
  onBack: () => void;
}

const DANCE_MOVES = [
  { id: 'floss', name: 'Floss', emoji: '💃', points: 10, difficulty: 'Easy' },
  { id: 'dab', name: 'Dab', emoji: '🙌', points: 10, difficulty: 'Easy' },
  { id: 'naenae', name: 'Nae Nae', emoji: '🎵', points: 15, difficulty: 'Medium' },
  { id: 'shuffling', name: 'Shuffle', emoji: '👟', points: 20, difficulty: 'Hard' },
  { id: 'robot', name: 'Robot', emoji: '🤖', points: 15, difficulty: 'Medium' },
  { id: 'moonwalk', name: 'Moonwalk', emoji: '🌙', points: 25, difficulty: 'Expert' },
  { id: 'spin', name: 'Spin', emoji: '🌀', points: 15, difficulty: 'Medium' },
  { id: 'breakdance', name: 'Breakdance', emoji: '🔥', points: 30, difficulty: 'Expert' },
  { id: 'vogue', name: 'Vogue', emoji: '💅', points: 20, difficulty: 'Hard' },
  { id: 'worm', name: 'Worm', emoji: '🪱', points: 25, difficulty: 'Expert' },
];

type GamePhase = 'ready' | 'showing' | 'input' | 'feedback' | 'gameover';

export function DanceOff({ onBack }: DanceOffProps) {
  const { earnTokens } = useAuraStore();
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [showIndex, setShowIndex] = useState(0);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | null>(null);
  const [totalRounds] = useState(5);
  const [availableMoves, setAvailableMoves] = useState(DANCE_MOVES.slice(0, 4));

  const generateSequence = useCallback(() => {
    const moveCount = Math.min(3 + Math.floor(round / 2), 6);
    const seq: string[] = [];
    for (let i = 0; i < moveCount; i++) {
      const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      seq.push(move.id);
    }
    return seq;
  }, [round, availableMoves]);

  const startRound = useCallback(() => {
    // Add harder moves as rounds progress
    if (round >= 2) setAvailableMoves(DANCE_MOVES.slice(0, 6));
    if (round >= 4) setAvailableMoves(DANCE_MOVES);

    const seq = generateSequence();
    setSequence(seq);
    setPlayerInput([]);
    setShowIndex(0);
    setPhase('showing');
  }, [round, generateSequence]);

  // Show sequence animation
  useEffect(() => {
    if (phase !== 'showing') return;
    if (showIndex >= sequence.length) {
      setPhase('input');
      return;
    }
    const timer = setTimeout(() => {
      setShowIndex((prev) => prev + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, showIndex, sequence.length]);

  const handleMoveClick = (moveId: string) => {
    if (phase !== 'input') return;

    const newIndex = playerInput.length;
    const newInput = [...playerInput, moveId];
    setPlayerInput(newInput);

    if (moveId === sequence[newIndex]) {
      // Correct move
      const move = DANCE_MOVES.find(m => m.id === moveId);
      const points = (move?.points || 10) * (1 + combo * 0.5);
      setScore((prev) => prev + Math.round(points));
      setCombo((prev) => {
        const newCombo = prev + 1;
        setMaxCombo((m) => Math.max(m, newCombo));
        return newCombo;
      });
      setFeedback('hit');

      if (newInput.length === sequence.length) {
        // Completed the sequence!
        setTimeout(() => {
          if (round + 1 >= totalRounds) {
            const tokenReward = Math.round(score / 10) + 5;
            earnTokens(tokenReward, 'Dance Off completed');
            setPhase('gameover');
          } else {
            setRound((prev) => prev + 1);
            setPhase('ready');
          }
        }, 500);
      }
    } else {
      // Wrong move
      setCombo(0);
      setFeedback('miss');
      setTimeout(() => {
        if (round + 1 >= totalRounds) {
          const tokenReward = Math.round(score / 10) + 3;
          earnTokens(tokenReward, 'Dance Off completed');
          setPhase('gameover');
        } else {
          setRound((prev) => prev + 1);
          setPhase('ready');
        }
      }, 800);
    }

    setTimeout(() => setFeedback(null), 400);
  };

  const startGame = () => {
    setRound(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAvailableMoves(DANCE_MOVES.slice(0, 4));
    startRound();
  };

  // Ready screen
  if (phase === 'ready') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-xl font-black text-white">Round {round + 1}</h2>
          </div>
          <p className="text-sm text-slate-400 mb-1">Watch the dance moves, then repeat them!</p>
          <p className="text-xs text-slate-500 mb-4">Sequence length: {Math.min(3 + Math.floor(round / 2), 6)} moves</p>

          <div className="flex items-center justify-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1"><Trophy className="w-4 h-4 text-yellow-400" /> <span className="text-white font-bold">{score}</span></div>
            <div className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-400" /> <span className="text-white font-bold">{combo}x</span></div>
          </div>

          <button onClick={startRound} className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold text-sm">
            Ready!
          </button>
        </div>
      </div>
    );
  }

  // Game over
  if (phase === 'gameover') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h2 className="text-2xl font-black text-white mb-1">Dance Complete!</h2>
          <div className="text-4xl font-black text-white mb-2">{score}</div>
          <p className="text-sm text-slate-400 mb-1">Total Score</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-sm"><span className="text-orange-400 font-bold">{maxCombo}x</span> <span className="text-slate-500">Max Combo</span></div>
            <div className="text-sm"><span className="text-yellow-400 font-bold">{totalRounds}</span> <span className="text-slate-500">Rounds</span></div>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">+{Math.round(score / 10) + 5} ORRA</span>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <button onClick={startGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold text-sm">Play Again</button>
            <button onClick={onBack} className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all">Back to Arena</button>
          </div>
        </div>
      </div>
    );
  }

  // Showing sequence
  if (phase === 'showing') {
    const currentMove = DANCE_MOVES.find(m => m.id === sequence[showIndex]);
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-fuchsia-400 font-bold">Round {round + 1}</span>
          <div className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" /><span className="text-xs text-white font-bold">{score}</span></div>
        </div>

        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-xs text-slate-500 mb-4">Watch the sequence... ({showIndex + 1}/{sequence.length})</p>
          <div className="flex items-center justify-center gap-2 mb-4">
            {sequence.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i < showIndex ? 'bg-fuchsia-400' : i === showIndex ? 'bg-white animate-pulse' : 'bg-white/20'}`} />
            ))}
          </div>
          {currentMove && (
            <div className="animate-bounce">
              <div className="text-6xl mb-2">{currentMove.emoji}</div>
              <h3 className="text-xl font-black text-white">{currentMove.name}</h3>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Player input phase
  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-fuchsia-400 font-bold">Round {round + 1}</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /><span className="text-xs text-white font-bold">{combo}x</span></div>
          <div className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-400" /><span className="text-xs text-white font-bold">{score}</span></div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="glass-panel rounded-2xl p-3">
        <div className="flex items-center justify-center gap-2">
          {sequence.map((moveId, i) => {
            const move = DANCE_MOVES.find(m => m.id === moveId);
            return (
              <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                i < playerInput.length
                  ? playerInput[i] === moveId ? 'bg-green-500/20' : 'bg-red-500/20'
                  : 'bg-white/5'
              }`}>
                {i < playerInput.length ? (playerInput[i] === moveId ? '✓' : '✗') : (move?.emoji || '?')}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback overlay */}
      {feedback && (
        <div className={`text-center py-2 rounded-xl ${feedback === 'hit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          <span className="text-lg font-bold">{feedback === 'hit' ? 'Nice! 🔥' : 'Miss! 💨'}</span>
        </div>
      )}

      {/* Move buttons */}
      <div className="grid grid-cols-2 gap-3">
        {availableMoves.map((move) => (
          <button
            key={move.id}
            onClick={() => handleMoveClick(move.id)}
            className={`glass-panel rounded-2xl p-4 text-center hover:border-fuchsia-500/30 transition-all active:scale-95`}
          >
            <div className="text-3xl mb-1">{move.emoji}</div>
            <h4 className="text-sm font-bold text-white">{move.name}</h4>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="w-2.5 h-2.5 text-yellow-400" />
              <span className="text-[10px] text-slate-500">{move.points} pts</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
