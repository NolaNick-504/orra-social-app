'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Zap, Flame, ThumbsUp, ThumbsDown, ChevronRight, Users } from 'lucide-react';

interface HotTakeProps {
  onBack: () => void;
}

const HOT_TAKES = [
  { id: 1, take: 'Pineapple belongs on pizza', agree: 52, disagree: 48 },
  { id: 2, take: 'Cereal is better with water than milk', agree: 8, disagree: 92 },
  { id: 3, take: 'Star Wars is overrated', agree: 35, disagree: 65 },
  { id: 4, take: 'Dogs are better than cats', agree: 62, disagree: 38 },
  { id: 5, take: 'Morning people have it figured out', agree: 28, disagree: 72 },
  { id: 6, take: 'Social media does more harm than good', agree: 58, disagree: 42 },
  { id: 7, take: 'Aliens definitely exist', agree: 71, disagree: 29 },
  { id: 8, take: 'Music today is better than the 80s', agree: 33, disagree: 67 },
  { id: 9, take: 'Remote work is the future', agree: 74, disagree: 26 },
  { id: 10, take: 'TikTok should be banned', agree: 22, disagree: 78 },
];

export function HotTake({ onBack }: HotTakeProps) {
  const { earnTokens } = useAuraStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [vote, setVote] = useState<'agree' | 'disagree' | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [voted, setVoted] = useState<Set<number>>(new Set());

  const currentTake = HOT_TAKES[currentIndex];

  const handleVote = (choice: 'agree' | 'disagree') => {
    if (vote) return;
    setVote(choice);

    if (!voted.has(currentTake.id)) {
      const newVoted = new Set(voted);
      newVoted.add(currentTake.id);
      setVoted(newVoted);
      earnTokens(3, 'Hot Take vote');
      setTotalTokens((prev) => prev + 3);
    }
  };

  const nextTake = () => {
    setCurrentIndex((prev) => (prev + 1) % HOT_TAKES.length);
    setVote(null);
  };

  const getAgreePct = () => Math.round((currentTake.agree / (currentTake.agree + currentTake.disagree)) * 100);
  const getDisagreePct = () => 100 - getAgreePct();

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
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 mb-2">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-black text-white">Hot Take</h2>
        <p className="text-xs text-slate-500">Drop your hottest opinion</p>
      </div>

      {/* Hot Take Card */}
      <div className="glass-panel rounded-2xl p-6 text-center">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold mb-3">
          <Flame className="w-3 h-3" /> HOT TAKE #{currentIndex + 1}
        </div>
        <p className="text-lg font-bold text-white leading-relaxed">&ldquo;{currentTake.take}&rdquo;</p>
      </div>

      {/* Vote Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleVote('agree')}
          disabled={!!vote}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
            vote === 'agree' ? 'border-green-500/50 bg-green-500/10 ring-2 ring-green-500/20' : 'border-white/10 bg-white/5 hover:border-green-500/30'
          }`}
        >
          <ThumbsUp className={`w-6 h-6 ${vote === 'agree' ? 'text-green-400' : 'text-slate-400'}`} />
          <span className={`text-sm font-bold ${vote === 'agree' ? 'text-green-400' : 'text-white'}`}>Agree</span>
          {vote && (
            <div className="w-full">
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                <div className="bg-green-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${getAgreePct()}%` }} />
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px]">
                <Users className="w-2.5 h-2.5 text-slate-500" />
                <span className="text-slate-400">{getAgreePct()}%</span>
              </div>
            </div>
          )}
        </button>

        <button
          onClick={() => handleVote('disagree')}
          disabled={!!vote}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
            vote === 'disagree' ? 'border-red-500/50 bg-red-500/10 ring-2 ring-red-500/20' : 'border-white/10 bg-white/5 hover:border-red-500/30'
          }`}
        >
          <ThumbsDown className={`w-6 h-6 ${vote === 'disagree' ? 'text-red-400' : 'text-slate-400'}`} />
          <span className={`text-sm font-bold ${vote === 'disagree' ? 'text-red-400' : 'text-white'}`}>Disagree</span>
          {vote && (
            <div className="w-full">
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                <div className="bg-red-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${getDisagreePct()}%` }} />
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px]">
                <Users className="w-2.5 h-2.5 text-slate-500" />
                <span className="text-slate-400">{getDisagreePct()}%</span>
              </div>
            </div>
          )}
        </button>
      </div>

      {vote && (
        <button onClick={nextTake} className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2">
          Next Hot Take <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
