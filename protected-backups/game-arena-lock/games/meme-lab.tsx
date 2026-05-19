'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Zap, Image, Star, ChevronRight, Shuffle } from 'lucide-react';

interface MemeLabProps {
  onBack: () => void;
}

const MEME_TEMPLATES = [
  { id: 1, emoji: '🤔💡', topText: 'When you finally understand', bgColor: 'from-yellow-500 to-amber-600' },
  { id: 2, emoji: '😤💻', topText: 'Code works on my machine', bgColor: 'from-blue-500 to-indigo-600' },
  { id: 3, emoji: '🎉😭', topText: 'When the test passes but you don\'t know why', bgColor: 'from-green-500 to-emerald-600' },
  { id: 4, emoji: '👀🤫', topText: 'Me reading the chat', bgColor: 'from-purple-500 to-violet-600' },
  { id: 5, emoji: '🔥💯', topText: 'Nobody:', bgColor: 'from-red-500 to-rose-600' },
  { id: 6, emoji: '🧠❌', topText: 'My brain at 3am', bgColor: 'from-cyan-500 to-teal-600' },
];

const RATING_MEMES = [
  { id: 'r1', emoji: '😱💀', caption: 'When the WiFi drops during a video call', rating: 4.2, votes: 892 },
  { id: 'r2', emoji: '🤡🌍', caption: 'Me: I\'ll sleep early tonight. Also me at 4am:', rating: 4.7, votes: 1203 },
  { id: 'r3', emoji: '😎✈️', caption: 'Monday mood: anywhere but here', rating: 3.9, votes: 567 },
  { id: 'r4', emoji: '🥲📱', caption: 'Checking my bank account after ordering food', rating: 4.5, votes: 1456 },
  { id: 'r5', emoji: '🧛‍♂️☕', caption: 'Before coffee vs After coffee', rating: 4.8, votes: 2341 },
];

export function MemeLab({ onBack }: MemeLabProps) {
  const { earnTokens } = useAuraStore();
  const [mode, setMode] = useState<'menu' | 'create' | 'rate'>('menu');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [createdMemes, setCreatedMemes] = useState<Array<{ emoji: string; topText: string; caption: string }>>([]);
  const [rateIndex, setRateIndex] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  const handleCreateMeme = () => {
    if (!caption.trim() || selectedTemplate === null) return;

    const template = MEME_TEMPLATES[selectedTemplate];
    setCreatedMemes((prev) => [{
      emoji: template.emoji,
      topText: template.topText,
      caption: caption.trim(),
    }, ...prev]);

    earnTokens(3, 'Created a meme');
    setTotalTokens((prev) => prev + 3);
    setCaption('');
    setSelectedTemplate(null);
  };

  const handleRate = (stars: number) => {
    setUserRating(stars);
    earnTokens(2, 'Rated a meme');
    setTotalTokens((prev) => prev + 2);

    setTimeout(() => {
      if (rateIndex + 1 >= RATING_MEMES.length) {
        setRateIndex(0);
      } else {
        setRateIndex((prev) => prev + 1);
      }
      setUserRating(0);
    }, 800);
  };

  const randomTemplate = () => {
    setSelectedTemplate(Math.floor(Math.random() * MEME_TEMPLATES.length));
  };

  if (mode === 'menu') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        <div className="text-center">
          <h2 className="text-lg font-black text-white">Meme Lab</h2>
          <p className="text-xs text-slate-500">Create & rate memes</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('create')}
            className="glass-panel rounded-2xl p-5 text-center hover:border-green-500/30 transition-all"
          >
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="text-sm font-bold text-white">Create</h3>
            <p className="text-[10px] text-slate-500 mt-1">Make your own meme</p>
          </button>
          <button
            onClick={() => setMode('rate')}
            className="glass-panel rounded-2xl p-5 text-center hover:border-green-500/30 transition-all"
          >
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="text-sm font-bold text-white">Rate</h3>
            <p className="text-[10px] text-slate-500 mt-1">Judge other memes</p>
          </button>
        </div>

        {/* Recently Created */}
        {createdMemes.length > 0 && (
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="font-bold text-white mb-3 text-sm">Your Memes</h3>
            <div className="space-y-2">
              {createdMemes.slice(0, 3).map((meme, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                  <span className="text-2xl">{meme.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{meme.topText}</p>
                    <p className="text-[10px] text-slate-400 truncate">{meme.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10 w-fit mx-auto">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">+{totalTokens} ORRA earned</span>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    const template = selectedTemplate !== null ? MEME_TEMPLATES[selectedTemplate] : null;

    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('menu')} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={randomTemplate} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-600/20 text-green-400 text-xs font-bold hover:bg-green-600/30 transition-all">
            <Shuffle className="w-3 h-3" /> Random
          </button>
        </div>

        <h3 className="text-base font-bold text-white">Choose a Template</h3>
        <div className="grid grid-cols-3 gap-2">
          {MEME_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id - 1)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedTemplate === t.id - 1 ? 'border-green-500/50 ring-2 ring-green-500/20' : 'border-white/10 bg-white/5 hover:border-green-500/30'
              }`}
            >
              <div className="text-xl">{t.emoji}</div>
              <p className="text-[8px] text-slate-400 mt-1 line-clamp-2">{t.topText}</p>
            </button>
          ))}
        </div>

        {/* Preview */}
        {template && (
          <div className={`rounded-2xl p-5 text-center bg-gradient-to-br ${template.bgColor}`}>
            <div className="text-4xl mb-2">{template.emoji}</div>
            <p className="text-sm font-bold text-white mb-1">{template.topText}</p>
            {caption && <p className="text-xs text-white/80 italic">&ldquo;{caption}&rdquo;</p>}
          </div>
        )}

        {/* Caption input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add your caption..."
            maxLength={100}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
          />
          <button
            onClick={handleCreateMeme}
            disabled={!caption.trim() || selectedTemplate === null}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    );
  }

  // Rate mode
  const meme = RATING_MEMES[rateIndex];
  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setMode('menu')} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">+{totalTokens}</span>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-base font-bold text-white">Rate This Meme</h3>
        <p className="text-xs text-slate-500">How funny is it? ({rateIndex + 1}/{RATING_MEMES.length})</p>
      </div>

      {/* Meme Card */}
      <div className="glass-panel rounded-2xl p-5 text-center">
        <div className="text-4xl mb-2">{meme.emoji}</div>
        <p className="text-sm font-bold text-white mb-3">{meme.caption}</p>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Star className="w-3 h-3 text-yellow-400" /> {meme.rating} avg
          <span className="text-slate-600">|</span>
          {meme.votes.toLocaleString()} votes
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            className={`text-3xl transition-all ${star <= userRating ? 'scale-110' : 'hover:scale-105'}`}
          >
            {star <= userRating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    </div>
  );
}
