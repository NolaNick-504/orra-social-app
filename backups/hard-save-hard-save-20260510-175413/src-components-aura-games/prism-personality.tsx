'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Sparkles, Zap } from 'lucide-react';

interface PrismPersonalityProps {
  onBack: () => void;
}

const QUESTIONS = [
  { q: 'At a party, you are most likely...', options: [
    { text: 'The center of attention 🎤', type: 'flame' },
    { text: 'Chilling in a small group 🛋️', type: 'ocean' },
    { text: 'Observing from the corner 👀', type: 'crystal' },
    { text: 'Making everyone laugh 😂', type: 'sun' },
  ]},
  { q: 'Your ideal weekend is...', options: [
    { text: 'Adventure & exploring 🏔️', type: 'flame' },
    { text: 'Cozy movie marathon 🍿', type: 'ocean' },
    { text: 'Creating something new 🎨', type: 'crystal' },
    { text: 'Hanging with friends 🤗', type: 'sun' },
  ]},
  { q: 'When faced with a problem, you...', options: [
    { text: 'Charge in head first 💪', type: 'flame' },
    { text: 'Think it through carefully 🧠', type: 'crystal' },
    { text: 'Ask friends for help 🫂', type: 'sun' },
    { text: 'Trust your gut feeling ✨', type: 'ocean' },
  ]},
  { q: 'Your vibe check song is...', options: [
    { text: 'Something hype & energetic 🔊', type: 'flame' },
    { text: 'Chill lo-fi beats 🎧', type: 'ocean' },
    { text: 'Something unique & indie 🎸', type: 'crystal' },
    { text: 'Feel-good pop anthem 🎶', type: 'sun' },
  ]},
  { q: 'Pick your spirit color...', options: [
    { text: 'Red / Orange 🔥', type: 'flame' },
    { text: 'Blue / Teal 🌊', type: 'ocean' },
    { text: 'Purple / Violet 💎', type: 'crystal' },
    { text: 'Yellow / Gold ☀️', type: 'sun' },
  ]},
  { q: 'Your social media style is...', options: [
    { text: 'Bold & unfiltered posts 💥', type: 'flame' },
    { text: 'Aesthetic & curated feed 📸', type: 'crystal' },
    { text: 'Sharing memes & jokes 😜', type: 'sun' },
    { text: 'Rare but meaningful posts 🌊', type: 'ocean' },
  ]},
];

const PERSONALITY_TYPES: Record<string, { name: string; description: string; emoji: string; color: string; traits: string[] }> = {
  flame: {
    name: 'Inferno Spirit',
    description: 'You burn bright and lead with passion! Your energy is contagious and you light up every room you enter. People are drawn to your fierce confidence.',
    emoji: '🔥',
    color: 'from-red-500 to-orange-500',
    traits: ['Bold', 'Passionate', 'Leader', 'Adventurous'],
  },
  ocean: {
    name: 'Deep Tide',
    description: 'You move with calm wisdom and deep understanding. Like the ocean, you have hidden depths that surprise people. Your intuition is your superpower.',
    emoji: '🌊',
    color: 'from-blue-500 to-cyan-500',
    traits: ['Intuitive', 'Calm', 'Wise', 'Empathetic'],
  },
  crystal: {
    name: 'Prism Mind',
    description: 'You see the world through a unique lens, refracting ordinary moments into extraordinary ideas. Your creativity and originality set you apart.',
    emoji: '💎',
    color: 'from-purple-500 to-violet-500',
    traits: ['Creative', 'Analytical', 'Unique', 'Visionary'],
  },
  sun: {
    name: 'Solar Heart',
    description: 'You radiate warmth and positivity wherever you go! Your social energy and genuine care for others makes everyone feel welcome and loved.',
    emoji: '☀️',
    color: 'from-yellow-500 to-amber-500',
    traits: ['Friendly', 'Optimistic', 'Social', 'Generous'],
  },
};

export function PrismPersonality({ onBack }: PrismPersonalityProps) {
  const { earnTokens } = useAuraStore();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ flame: 0, ocean: 0, crystal: 0, sun: 0 });
  const [result, setResult] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[questionIndex];

  const handleAnswer = (type: string) => {
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);

    if (questionIndex + 1 >= QUESTIONS.length) {
      // Calculate result
      const maxType = Object.entries(newScores).sort(([, a], [, b]) => b - a)[0][0];
      setResult(maxType);
      earnTokens(4, 'PrISM Personality completed');
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  const resetGame = () => {
    setQuestionIndex(0);
    setScores({ flame: 0, ocean: 0, crystal: 0, sun: 0 });
    setResult(null);
  };

  if (result) {
    const personality = PERSONALITY_TYPES[result];
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">{personality.emoji}</div>
          <h2 className="text-2xl font-black gradient-text mb-2">{personality.name}</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{personality.description}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {personality.traits.map((trait) => (
              <span key={trait} className={`px-3 py-1 rounded-full bg-gradient-to-r ${personality.color} text-white text-xs font-bold`}>{trait}</span>
            ))}
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">+4 ORRA</span>
          </div>

          <div className="space-y-2 mt-4">
            <button onClick={resetGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm">Discover Again</button>
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

      {/* Progress */}
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%` }} />
      </div>

      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 mb-2">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-black text-white">PrISM Personality</h2>
        <p className="text-xs text-slate-500">Discover your true aura type</p>
      </div>

      {/* Question */}
      <div className="glass-panel rounded-2xl p-4">
        <h3 className="text-base font-bold text-white text-center">{currentQuestion.q}</h3>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(option.type)}
            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all"
          >
            <span className="text-sm font-medium text-white">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
