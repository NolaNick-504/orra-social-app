'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Zap, Palette } from 'lucide-react';

interface AuraQuizProps {
  onBack: () => void;
}

const QUESTIONS = [
  { q: 'What time of day do you feel most alive?', options: [
    { text: 'Dawn - Fresh starts 🌅', color: 'rose' },
    { text: 'Midday - Full energy ☀️', color: 'amber' },
    { text: 'Sunset - Golden hour 🌇', color: 'violet' },
    { text: 'Midnight - Quiet power 🌙', color: 'indigo' },
  ]},
  { q: 'Pick the aesthetic that speaks to you...', options: [
    { text: 'Soft pastels & flowers 🌸', color: 'rose' },
    { text: 'Bold neons & street art 🎨', color: 'amber' },
    { text: 'Cosmic & galaxy vibes ✨', color: 'violet' },
    { text: 'Minimal & sleek monochrome ⬛', color: 'indigo' },
  ]},
  { q: 'How do you recharge your energy?', options: [
    { text: 'Being around people 💃', color: 'amber' },
    { text: 'Nature walks & fresh air 🌿', color: 'rose' },
    { text: 'Creative projects & art 🖌️', color: 'violet' },
    { text: 'Solo time & deep thoughts 🧘', color: 'indigo' },
  ]},
  { q: 'What superpower calls to you?', options: [
    { text: 'Healing touch 💚', color: 'rose' },
    { text: 'Super speed & agility ⚡', color: 'amber' },
    { text: 'Shape-shifting 🦋', color: 'violet' },
    { text: 'Telepathy & mind reading 🧠', color: 'indigo' },
  ]},
  { q: 'Choose your dream destination...', options: [
    { text: 'Cherry blossom garden in Japan 🌸', color: 'rose' },
    { text: 'Vibrant carnival in Brazil 🎭', color: 'amber' },
    { text: 'Northern lights in Iceland 🌌', color: 'violet' },
    { text: 'Deep sea exploration 🐋', color: 'indigo' },
  ]},
];

const AURA_COLORS: Record<string, { name: string; description: string; emoji: string; gradient: string }> = {
  rose: {
    name: 'Rose Aura',
    description: 'Your aura glows with gentle warmth and compassion. You have a healing presence that makes others feel safe and loved. Your kindness is your greatest power.',
    emoji: '🌸',
    gradient: 'from-pink-500 to-rose-500',
  },
  amber: {
    name: 'Amber Aura',
    description: 'Your aura radiates electric energy and boundless enthusiasm! You light up every space with your dynamic presence and unstoppable drive.',
    emoji: '⚡',
    gradient: 'from-amber-500 to-yellow-500',
  },
  violet: {
    name: 'Violet Aura',
    description: 'Your aura shimmers with mystical creativity and deep intuition. You see the world through a magical lens and transform the ordinary into extraordinary.',
    emoji: '✨',
    gradient: 'from-violet-500 to-purple-500',
  },
  indigo: {
    name: 'Indigo Aura',
    description: 'Your aura pulses with deep wisdom and quiet strength. Like the depths of the ocean, your insight runs far deeper than others realize.',
    emoji: '🌙',
    gradient: 'from-indigo-500 to-blue-500',
  },
};

export function AuraQuiz({ onBack }: AuraQuizProps) {
  const { earnTokens } = useAuraStore();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ rose: 0, amber: 0, violet: 0, indigo: 0 });
  const [result, setResult] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];

  const handleAnswer = (color: string) => {
    const newScores = { ...scores, [color]: scores[color] + 1 };
    setScores(newScores);

    if (questionIndex + 1 >= QUESTIONS.length) {
      const maxColor = Object.entries(newScores).sort(([, a], [, b]) => b - a)[0][0];
      setResult(maxColor);
      earnTokens(4, 'Aura Quiz completed');
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  const resetGame = () => {
    setQuestionIndex(0);
    setScores({ rose: 0, amber: 0, violet: 0, indigo: 0 });
    setResult(null);
  };

  if (result) {
    const aura = AURA_COLORS[result];
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${aura.gradient} mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg`}>
            {aura.emoji}
          </div>
          <h2 className="text-2xl font-black gradient-text mb-2">{aura.name}</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{aura.description}</p>

          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">+4 ORRA</span>
          </div>

          <div className="space-y-2 mt-4">
            <button onClick={resetGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold text-sm">Retake Quiz</button>
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
        <span className="text-xs text-slate-500">{questionIndex + 1}/{QUESTIONS.length}</span>
      </div>

      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 h-1.5 rounded-full transition-all" style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} />
      </div>

      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 mb-2">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-black text-white">Aura Quiz</h2>
        <p className="text-xs text-slate-500">Find your true aura color</p>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <h3 className="text-base font-bold text-white text-center">{currentQuestion.q}</h3>
      </div>

      <div className="space-y-2">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(option.color)}
            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all"
          >
            <span className="text-sm font-medium text-white">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
