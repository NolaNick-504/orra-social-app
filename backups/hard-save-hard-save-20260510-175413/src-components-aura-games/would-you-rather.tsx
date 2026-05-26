'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Zap, Users, ChevronRight } from 'lucide-react';

interface WouldYouRatherProps {
  onBack: () => void;
}

const SCENARIOS = [
  { id: 1, optionA: 'Have rewind power for 10 seconds', optionB: 'Have pause power for 10 seconds', votesA: 62, votesB: 38, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 2, optionA: 'Always know when someone is lying', optionB: 'Always get away with lying', votesA: 55, votesB: 45, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 3, optionA: 'Live in a world with no music', optionB: 'Live in a world with no color', votesA: 30, votesB: 70, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 4, optionA: 'Be able to fly but only 3 feet high', optionB: 'Be invisible but only when no one is looking', votesA: 48, votesB: 52, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 5, optionA: 'Have unlimited money but no friends', optionB: 'Have best friends but always broke', votesA: 25, votesB: 75, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 6, optionA: 'Speak every language fluently', optionB: 'Talk to animals', votesA: 40, votesB: 60, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 7, optionA: 'Only eat pizza forever', optionB: 'Never eat pizza again', votesA: 58, votesB: 42, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 8, optionA: 'Have WiFi everywhere for free', optionB: 'Have free food everywhere', votesA: 35, votesB: 65, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 9, optionA: 'Be famous for something embarrassing', optionB: 'Be unknown but incredibly talented', votesA: 20, votesB: 80, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
  { id: 10, optionA: 'Time travel to the past', optionB: 'Time travel to the future', votesA: 53, votesB: 47, colorA: 'from-violet-600 to-indigo-600', colorB: 'from-cyan-600 to-blue-600' },
];

export function WouldYouRather({ onBack }: WouldYouRatherProps) {
  const { earnTokens } = useAuraStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choice, setChoice] = useState<'A' | 'B' | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());

  const scenario = SCENARIOS[currentIndex];

  const handleChoice = (option: 'A' | 'B') => {
    if (choice) return;
    setChoice(option);

    if (!answered.has(scenario.id)) {
      const newAnswered = new Set(answered);
      newAnswered.add(scenario.id);
      setAnswered(newAnswered);
      earnTokens(3, 'Would You Rather');
      setTotalTokens((prev) => prev + 3);
    }
  };

  const nextScenario = () => {
    if (currentIndex + 1 >= SCENARIOS.length) {
      // Loop back
      setCurrentIndex(0);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
    setChoice(null);
  };

  const getPercentage = (votes: number) => {
    const total = scenario.votesA + scenario.votesB;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">+{totalTokens} ORRA</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-slate-500 mb-1">Question {currentIndex + 1} of {SCENARIOS.length}</p>
        <h2 className="text-lg font-black text-white">Would You Rather?</h2>
      </div>

      {/* Option A */}
      <button
        onClick={() => handleChoice('A')}
        disabled={!!choice}
        className={`w-full glass-panel rounded-2xl p-5 text-center transition-all ${
          choice ? (choice === 'A' ? 'border-violet-500/50 ring-2 ring-violet-500/20' : 'opacity-60') : 'hover:border-violet-500/30'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/20 text-violet-400">A</span>
        </div>
        <h3 className="text-base font-bold text-white">{scenario.optionA}</h3>
        {choice && (
          <div className="mt-3">
            <div className="w-full bg-white/5 rounded-full h-2 mb-1">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-700" style={{ width: `${getPercentage(scenario.votesA)}%` }} />
            </div>
            <div className="flex items-center justify-center gap-1 text-xs">
              <Users className="w-3 h-3 text-slate-500" />
              <span className="text-slate-400">{getPercentage(scenario.votesA)}% chose this</span>
            </div>
          </div>
        )}
      </button>

      {/* VS Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs font-black text-slate-500">VS</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Option B */}
      <button
        onClick={() => handleChoice('B')}
        disabled={!!choice}
        className={`w-full glass-panel rounded-2xl p-5 text-center transition-all ${
          choice ? (choice === 'B' ? 'border-cyan-500/50 ring-2 ring-cyan-500/20' : 'opacity-60') : 'hover:border-cyan-500/30'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-400">B</span>
        </div>
        <h3 className="text-base font-bold text-white">{scenario.optionB}</h3>
        {choice && (
          <div className="mt-3">
            <div className="w-full bg-white/5 rounded-full h-2 mb-1">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 h-2 rounded-full transition-all duration-700" style={{ width: `${getPercentage(scenario.votesB)}%` }} />
            </div>
            <div className="flex items-center justify-center gap-1 text-xs">
              <Users className="w-3 h-3 text-slate-500" />
              <span className="text-slate-400">{getPercentage(scenario.votesB)}% chose this</span>
            </div>
          </div>
        )}
      </button>

      {/* Next button */}
      {choice && (
        <button onClick={nextScenario} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm flex items-center justify-center gap-2">
          Next Question <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
