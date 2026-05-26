'use client';

import { useState, useCallback } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { toast } from 'sonner';
import {
  ArrowLeft, Sparkles, ChevronRight, Triangle, Coins, RotateCcw
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

type Dimension = 'energy' | 'thinking' | 'social' | 'style';
type GamePhase = 'start' | 'playing' | 'results';

interface Question {
  id: number;
  text: string;
  dimension: Dimension;
  optionA: { label: string; shift: number }; // shift: positive = toward right pole
  optionB: { label: string; shift: number };
}

interface PersonalityType {
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  gradient: string;
  glowClass: string;
}

// ── Dimensions ─────────────────────────────────────────────────────────────

const DIMENSIONS: Record<Dimension, { label: string; left: string; right: string; color: string }> = {
  energy: { label: 'Energy', left: 'Introvert', right: 'Extrovert', color: '#8b5cf6' },
  thinking: { label: 'Thinking', left: 'Logic', right: 'Creative', color: '#d946ef' },
  social: { label: 'Social', left: 'Independent', right: 'Collaborative', color: '#06b6d4' },
  style: { label: 'Style', left: 'Planned', right: 'Spontaneous', color: '#f59e0b' },
};

// ── Questions (12) ─────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  { id: 1, text: 'Friday night rolls around — what sounds ideal?', dimension: 'energy', optionA: { label: 'Cozy night in with a good show', shift: -2 }, optionB: { label: 'Hitting up friends for a night out', shift: 2 } },
  { id: 2, text: 'When solving a tough problem, you lean toward…', dimension: 'thinking', optionA: { label: 'Analyzing data and finding patterns', shift: -2 }, optionB: { label: 'Trusting your gut and brainstorming wild ideas', shift: 2 } },
  { id: 3, text: 'Group project time! Your instinct is to…', dimension: 'social', optionA: { label: 'Take a section and crush it solo', shift: -2 }, optionB: { label: 'Jump on a call and riff together', shift: 2 } },
  { id: 4, text: 'Your ideal vacation is…', dimension: 'style', optionA: { label: 'A fully planned itinerary with reservations', shift: -2 }, optionB: { label: 'Showing up and figuring it out on the fly', shift: 2 } },
  { id: 5, text: 'At a party, people usually find you…', dimension: 'energy', optionA: { label: 'Deep in conversation with one person', shift: -2 }, optionB: { label: 'Working the room and mingling', shift: 2 } },
  { id: 6, text: 'When creating something new, you prefer…', dimension: 'thinking', optionA: { label: 'Structured frameworks and proven methods', shift: -1 }, optionB: { label: 'Free-form experimentation', shift: 2 } },
  { id: 7, text: 'Your friend group is more like…', dimension: 'social', optionA: { label: 'A tight circle of 2-3 ride-or-dies', shift: -2 }, optionB: { label: 'A wide web of connections', shift: 2 } },
  { id: 8, text: 'When plans get canceled last minute, you feel…', dimension: 'style', optionA: { label: 'Frustrated — I had everything mapped out', shift: -2 }, optionB: { label: 'Excited — now I can do something spontaneous!', shift: 2 } },
  { id: 9, text: 'Your energy recharges by…', dimension: 'energy', optionA: { label: 'Quiet alone time with music or a book', shift: -2 }, optionB: { label: 'Surrounding yourself with people and activity', shift: 2 } },
  { id: 10, text: 'In an argument, you value…', dimension: 'thinking', optionA: { label: 'Clear evidence and logical reasoning', shift: -2 }, optionB: { label: 'Understanding feelings and finding creative compromise', shift: 2 } },
  { id: 11, text: 'Success tastes sweetest when…', dimension: 'social', optionA: { label: 'You earned it through your own grind', shift: -2 }, optionB: { label: 'Your team crushed it together', shift: 2 } },
  { id: 12, text: 'Your desk / workspace is usually…', dimension: 'style', optionA: { label: 'Organized, everything in its place', shift: -2 }, optionB: { label: 'Creative chaos — you know where everything is', shift: 2 } },
];

// ── Personality Types (8 based on dimension combos) ────────────────────────

function getPersonalityType(scores: Record<Dimension, number>): PersonalityType {
  const e = scores.energy > 0 ? 'E' : 'I';
  const t = scores.thinking > 0 ? 'C' : 'L';
  const s = scores.social > 0 ? 'B' : 'A';
  const st = scores.style > 0 ? 'S' : 'P';

  const key = `${e}${t}${s}${st}`;

  const types: Record<string, PersonalityType> = {
    // Extrovert + Creative + Collaborative + Spontaneous
    ECBS: {
      name: 'Neon Dreamer',
      tagline: 'Radiant. Unstoppable. Electric.',
      description: 'You light up every room with your boundless creative energy. A social butterfly with an artist\'s soul, you thrive on spontaneous adventures and collaborative magic. Your vibe is magnetic — people are drawn to your infectious enthusiasm and wild ideas.',
      emoji: '🌟',
      gradient: 'from-violet-600 via-fuchsia-500 to-pink-500',
      glowClass: 'glow-violet',
    },
    // Extrovert + Creative + Collaborative + Planned
    ECBP: {
      name: 'Cosmic Architect',
      tagline: 'Visionary Builder. Master Planner.',
      description: 'You dream big and build bigger. Your creative vision combined with strategic planning means you don\'t just imagine the future — you construct it. A natural leader who brings people together around bold, structured visions.',
      emoji: '🏗️',
      gradient: 'from-violet-600 via-indigo-500 to-cyan-500',
      glowClass: 'glow-violet',
    },
    // Extrovert + Creative + Independent + Spontaneous
    ECAS: {
      name: 'Electric Rebel',
      tagline: 'Rule Breaker. Trend Maker.',
      description: 'You forge your own path with explosive creative energy. An independent spirit who thrives on spontaneity and breaking conventions. Your fearless self-expression inspires others to embrace their authentic selves.',
      emoji: '⚡',
      gradient: 'from-red-500 via-fuchsia-500 to-violet-500',
      glowClass: 'glow-fuchsia',
    },
    // Extrovert + Creative + Independent + Planned
    ECAP: {
      name: 'Quantum Explorer',
      tagline: 'Strategic Genius. Bold Pioneer.',
      description: 'You\'re a rare blend of creative vision and meticulous planning. An independent thinker who ventures into uncharted territory with a map you drew yourself. You chase breakthroughs with both imagination and precision.',
      emoji: '🔬',
      gradient: 'from-cyan-500 via-violet-500 to-fuchsia-500',
      glowClass: 'glow-violet',
    },
    // Extrovert + Logic + Collaborative + Spontaneous
    ELBS: {
      name: 'Flux Navigator',
      tagline: 'Adaptive Leader. Quick Thinker.',
      description: 'You\'re the one who keeps cool when everything\'s in motion. Your logical mind thrives in collaborative chaos, making quick decisions that guide the group forward. A natural problem-solver who brings order to spontaneity.',
      emoji: '🧭',
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      glowClass: 'glow-gold',
    },
    // Extrovert + Logic + Collaborative + Planned
    ELBP: {
      name: 'Solar Commander',
      tagline: 'Bright. Bold. In Control.',
      description: 'You lead with clarity and confidence. Your logical approach combined with collaborative spirit makes you the person everyone turns to when things need to get done right. A powerhouse organizer with a warm, commanding presence.',
      emoji: '☀️',
      gradient: 'from-amber-500 via-yellow-500 to-orange-500',
      glowClass: 'glow-gold',
    },
    // Introvert + Creative + ...
    ICBS: {
      name: 'Phantom Artist',
      tagline: 'Deep Soul. Silent Force.',
      description: 'Your creative depths are an ocean few get to explore. In your solitude, you craft breathtaking ideas that reshape how others see the world. When you share your art, it resonates on a soul level — profound, unexpected, unforgettable.',
      emoji: '🎨',
      gradient: 'from-purple-600 via-violet-600 to-indigo-600',
      glowClass: 'glow-violet',
    },
    ICBP: {
      name: 'Crystal Sage',
      tagline: 'Quiet Wisdom. Crystal Vision.',
      description: 'A methodical creative who turns introspection into art. Your carefully planned creative process produces work of stunning clarity and depth. Others marvel at how your quiet observation translates into such powerful expression.',
      emoji: '💎',
      gradient: 'from-teal-500 via-cyan-500 to-blue-500',
      glowClass: 'glow-violet',
    },
    ICAS: {
      name: 'Shadow Alchemist',
      tagline: 'Hidden Fire. Wild Magic.',
      description: 'You\'re a creative volcano in quiet disguise. Behind your calm exterior roams a fierce, spontaneous imagination that strikes like lightning. Your independent, untamed creativity transforms ordinary moments into extraordinary experiences.',
      emoji: '🔮',
      gradient: 'from-purple-700 via-fuchsia-600 to-pink-600',
      glowClass: 'glow-fuchsia',
    },
    ICAP: {
      name: 'Midnight Scholar',
      tagline: 'Deep Thinker. Methodical Maker.',
      description: 'Your mind is a well-organized library of brilliant ideas. A logical introvert who channels creativity through structured thinking, you produce work that is both innovative and airtight. Your quiet precision speaks volumes.',
      emoji: '📚',
      gradient: 'from-slate-600 via-purple-600 to-violet-600',
      glowClass: 'glow-violet',
    },
    ILBS: {
      name: 'Silent Current',
      tagline: 'Calm Power. Hidden Depth.',
      description: 'Like an undercurrent, your influence is felt more than seen. Your logical mind and collaborative spirit work beneath the surface, guiding outcomes with quiet precision. When spontaneity calls, you adapt with surprising agility.',
      emoji: '🌊',
      gradient: 'from-blue-600 via-cyan-500 to-teal-500',
      glowClass: 'glow-violet',
    },
    ILBP: {
      name: 'Iron Strategist',
      tagline: 'Quiet Architect. Unshakeable Plan.',
      description: 'You\'re the mastermind who sees ten moves ahead. Your logical precision and methodical planning mean your collaborative efforts always hit the mark. An introvert whose structured influence shapes everything from the background.',
      emoji: '♟️',
      gradient: 'from-gray-600 via-slate-500 to-blue-600',
      glowClass: 'glow-silver',
    },
    ILAS: {
      name: 'Lone Wolf Hacker',
      tagline: 'Solo Operator. System Breaker.',
      description: 'You operate at peak efficiency on your own terms. Your logical mind cuts through noise with surgical precision, and your spontaneous nature means you\'re always finding unexpected shortcuts. Independent, sharp, unstoppable.',
      emoji: '🐺',
      gradient: 'from-green-600 via-emerald-500 to-teal-500',
      glowClass: 'glow-violet',
    },
    ILAP: {
      name: 'Steel Oracle',
      tagline: 'Methodical Mind. Unbreakable Logic.',
      description: 'Your disciplined, analytical approach makes you a fortress of reliability. A logical introvert who plans every detail and executes with machine-like precision. Your independent strategies are so well-crafted they seem prophetic.',
      emoji: '⚙️',
      gradient: 'from-gray-500 via-blue-600 to-indigo-600',
      glowClass: 'glow-silver',
    },
    ELAS: {
      name: 'Blaze Mercenary',
      tagline: 'Fast Mind. Solo Fire.',
      description: 'You\'re a rapid-fire logical mind in a social package. Independent and spontaneous, you solve problems faster than anyone and aren\'t afraid to go it alone. Your extroverted energy fuels your solo missions with explosive charisma.',
      emoji: '🔥',
      gradient: 'from-red-500 via-orange-500 to-amber-500',
      glowClass: 'glow-gold',
    },
    ELAP: {
      name: 'Titan Director',
      tagline: 'Commanding Intellect. Flawless Execution.',
      description: 'You run the show with a blend of social energy and razor-sharp logic. Your meticulously planned solo strategies are executed with the confidence of a natural leader. When you speak, people listen — because you\'re always right.',
      emoji: '🏛️',
      gradient: 'from-blue-600 via-indigo-500 to-violet-500',
      glowClass: 'glow-violet',
    },
  };

  return types[key] || types['ECBS'];
}

// ── Radar Chart SVG Component ──────────────────────────────────────────────

function RadarChart({ scores, animated }: { scores: Record<Dimension, number>; animated: boolean }) {
  const dims: Dimension[] = ['energy', 'thinking', 'social', 'style'];
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 85;
  const angleStep = (2 * Math.PI) / 4;
  const startAngle = -Math.PI / 2;

  const getPoint = (dim: Dimension, value: number) => {
    const idx = dims.indexOf(dim);
    const angle = startAngle + idx * angleStep;
    const normalized = (value + 3) / 6; // scores range -3 to +3, map to 0..1
    const r = maxR * Math.max(0.08, Math.min(1, normalized));
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const points = dims.map(d => getPoint(d, scores[d]));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Grid levels
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid lines */}
      {gridLevels.map((level, li) => {
        const gridPts = dims.map((_, idx) => {
          const angle = startAngle + idx * angleStep;
          const r = maxR * level;
          return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
        });
        const gridPath = gridPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return (
          <path key={li} d={gridPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        );
      })}

      {/* Axis lines */}
      {dims.map((_, idx) => {
        const angle = startAngle + idx * angleStep;
        return (
          <line
            key={idx}
            x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(angle)}
            y2={cy + maxR * Math.sin(angle)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon - glow */}
      <path
        d={pathD}
        fill="rgba(139, 92, 246, 0.15)"
        stroke="rgba(139, 92, 246, 0.6)"
        strokeWidth="2"
        style={{
          transition: animated ? 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))',
        }}
      />

      {/* Data polygon - fill gradient */}
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(217, 70, 239, 0.3)" />
          <stop offset="100%" stopColor="rgba(139, 92, 246, 0.05)" />
        </radialGradient>
      </defs>
      <path
        d={pathD}
        fill="url(#radarGrad)"
        stroke="url(#radarGrad)"
        strokeWidth="0"
        style={{
          transition: animated ? 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      />

      {/* Data points */}
      {points.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x} cy={p.y}
          r="5"
          fill={DIMENSIONS[dims[idx]].color}
          stroke="white"
          strokeWidth="2"
          style={{
            transition: animated ? 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            filter: `drop-shadow(0 0 6px ${DIMENSIONS[dims[idx]].color})`,
          }}
        />
      ))}

      {/* Labels */}
      {dims.map((dim, idx) => {
        const angle = startAngle + idx * angleStep;
        const labelR = maxR + 22;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text
            key={dim}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={DIMENSIONS[dim].color}
            fontSize="11"
            fontWeight="bold"
            style={{ textShadow: `0 0 8px ${DIMENSIONS[dim].color}` }}
          >
            {DIMENSIONS[dim].label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Prism Visual Effect ────────────────────────────────────────────────────

function PrismVisual() {
  return (
    <div className="relative w-full h-48 md:h-56 flex items-center justify-center overflow-hidden">
      {/* Rainbow rays */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <div
            key={deg}
            className="absolute w-1 h-32 opacity-20"
            style={{
              transform: `rotate(${deg}deg) translateY(-40px)`,
              background: `linear-gradient(to bottom, ${deg % 2 === 0 ? '#8b5cf6' : '#d946ef'}, transparent)`,
            }}
          />
        ))}
      </div>
      {/* Prism triangle */}
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="prismGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon
            points="60,10 110,100 10,100"
            fill="none"
            stroke="url(#prismGrad)"
            strokeWidth="2.5"
            filter="url(#prismGlow)"
          />
          {/* Rainbow output from prism */}
          <line x1="85" y1="55" x2="120" y2="30" stroke="#ef4444" strokeWidth="1.5" opacity="0.7" />
          <line x1="88" y1="60" x2="120" y2="42" stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
          <line x1="90" y1="65" x2="120" y2="55" stroke="#10b981" strokeWidth="1.5" opacity="0.7" />
          <line x1="91" y1="70" x2="120" y2="68" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7" />
          <line x1="90" y1="75" x2="120" y2="80" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.7" />
          <line x1="88" y1="80" x2="120" y2="92" stroke="#d946ef" strokeWidth="1.5" opacity="0.7" />
          {/* Incoming light */}
          <line x1="0" y1="60" x2="40" y2="58" stroke="white" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-pulse"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              background: ['#8b5cf6', '#d946ef', '#06b6d4', '#f59e0b', '#10b981'][i % 5],
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

interface PrismGameProps {
  onBack: () => void;
}

export function PrismGame({ onBack }: PrismGameProps) {
  const { earnTokens, auraTokens } = useAuraStore();
  const [phase, setPhase] = useState<GamePhase>('start');
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<Dimension, number>>({
    energy: 0,
    thinking: 0,
    social: 0,
    style: 0,
  });
  const [animatingChoice, setAnimatingChoice] = useState<'A' | 'B' | null>(null);
  const [showRadar, setShowRadar] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const handleAnswer = useCallback((choice: 'A' | 'B') => {
    if (animatingChoice) return;
    const q = QUESTIONS[currentQ];
    const shift = choice === 'A' ? q.optionA.shift : q.optionB.shift;

    setAnimatingChoice(choice);
    setScores(prev => ({
      ...prev,
      [q.dimension]: Math.max(-3, Math.min(3, prev[q.dimension] + shift)),
    }));

    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(prev => prev + 1);
      } else {
        setPhase('results');
        earnTokens(4, 'Completed PrISM Personality Game');
        toast.success('+4 ORRA tokens! Personality decoded!', { duration: 1500 });
        setRewarded(true);
        setTimeout(() => setShowRadar(true), 300);
      }
      setAnimatingChoice(null);
    }, 400);
  }, [animatingChoice, currentQ, earnTokens]);

  const personality = getPersonalityType(scores);

  const handleRestart = () => {
    setPhase('start');
    setCurrentQ(0);
    setScores({ energy: 0, thinking: 0, social: 0, style: 0 });
    setShowRadar(false);
    setRewarded(false);
    setAnimatingChoice(null);
  };

  // ── Start Screen ───────────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="fade-in space-y-4 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <PrismVisual />
          <div className="p-6 text-center -mt-4">
            <h2 className="text-3xl md:text-4xl font-black gradient-text mb-2">PrISM</h2>
            <p className="text-lg font-semibold text-white mb-1">Discover Your Personality Prism</p>
            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
              Answer 12 questions to map your traits across 4 dimensions and reveal your unique personality type
            </p>

            {/* Dimension previews */}
            <div className="grid grid-cols-2 gap-2 mb-6 max-w-xs mx-auto">
              {Object.entries(DIMENSIONS).map(([key, dim]) => (
                <div key={key} className="glass-card rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5">{dim.label}</p>
                  <p className="text-xs font-semibold" style={{ color: dim.color }}>
                    {dim.left} ↔ {dim.right}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase('playing')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all glow-violet"
            >
              <Sparkles className="w-5 h-5" />
              Begin Discovery
            </button>
          </div>
        </div>

        {/* Reward info */}
        <div className="glass-panel rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
            <Coins className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Complete to earn +4 ORRA</p>
            <p className="text-xs text-slate-500">Unlock your personality profile</p>
          </div>
          <div className="text-xs font-bold text-violet-400">{auraTokens} ORRA</div>
        </div>
      </div>
    );
  }

  // ── Playing Screen ─────────────────────────────────────────────────────
  if (phase === 'playing') {
    const q = QUESTIONS[currentQ];
    const dim = DIMENSIONS[q.dimension];
    const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

    return (
      <div className="fade-in space-y-4 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        {/* Progress bar */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              Question {currentQ + 1} of {QUESTIONS.length}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ color: dim.color, background: `${dim.color}15` }}
            >
              {dim.label}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${dim.color}, #d946ef)`,
              }}
            />
          </div>
        </div>

        {/* Live mini radar */}
        <div className="glass-panel rounded-2xl p-4 flex justify-center">
          <RadarChart scores={scores} animated={true} />
        </div>

        {/* Question */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${dim.color}20` }}
            >
              <Triangle className="w-4 h-4" style={{ color: dim.color }} />
            </div>
            <p className="text-lg font-semibold text-white leading-relaxed">{q.text}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleAnswer('A')}
              disabled={!!animatingChoice}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                animatingChoice === 'A'
                  ? 'border-violet-500/60 bg-violet-600/20 scale-[0.98]'
                  : 'border-white/10 bg-white/5 hover:border-violet-500/40 hover:bg-violet-600/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{q.optionA.label}</span>
                <ChevronRight className={`w-4 h-4 transition-all ${animatingChoice === 'A' ? 'text-violet-400' : 'text-slate-500'}`} />
              </div>
            </button>

            <button
              onClick={() => handleAnswer('B')}
              disabled={!!animatingChoice}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                animatingChoice === 'B'
                  ? 'border-fuchsia-500/60 bg-fuchsia-600/20 scale-[0.98]'
                  : 'border-white/10 bg-white/5 hover:border-fuchsia-500/40 hover:bg-fuchsia-600/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{q.optionB.label}</span>
                <ChevronRight className={`w-4 h-4 transition-all ${animatingChoice === 'B' ? 'text-fuchsia-400' : 'text-slate-500'}`} />
              </div>
            </button>
          </div>

          {/* Dimension poles */}
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-[10px] font-semibold" style={{ color: dim.color, opacity: 0.7 }}>{dim.left}</span>
            <div className="flex-1 mx-3 h-1 rounded-full bg-white/5 relative overflow-hidden">
              <div
                className="absolute top-0 h-full w-3 rounded-full transition-all duration-500"
                style={{
                  left: `${((scores[q.dimension] + 3) / 6) * 100 - 6}%`,
                  background: dim.color,
                  boxShadow: `0 0 8px ${dim.color}`,
                }}
              />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: dim.color, opacity: 0.7 }}>{dim.right}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Results Screen ─────────────────────────────────────────────────────
  return (
    <div className="fade-in space-y-4 pb-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Arena
      </button>

      {/* Personality Type Badge */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className={`relative h-32 bg-gradient-to-r ${personality.gradient} flex items-center justify-center`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative text-center">
            <span className="text-5xl">{personality.emoji}</span>
          </div>
        </div>
        <div className="p-6 text-center -mt-6 relative">
          <div className={`inline-block px-5 py-2.5 rounded-2xl bg-gradient-to-r ${personality.gradient} ${personality.glowClass} mb-3`}>
            <h2 className="text-2xl font-black text-white drop-shadow-lg">{personality.name}</h2>
          </div>
          <p className="text-sm font-semibold text-slate-300 mb-3 italic">&ldquo;{personality.tagline}&rdquo;</p>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">{personality.description}</p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 text-center">Your Personality Prism</h3>
        {showRadar && <RadarChart scores={scores} animated={true} />}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {Object.entries(DIMENSIONS).map(([key, dim]) => {
            const val = scores[key as Dimension];
            const pct = ((val + 3) / 6) * 100;
            return (
              <div key={key} className="glass-card rounded-xl p-3">
                <p className="text-[10px] text-slate-500 mb-1">{dim.label}</p>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: showRadar ? `${pct}%` : '0%',
                      background: dim.color,
                      boxShadow: `0 0 6px ${dim.color}`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px]">
                  <span style={{ color: val < 0 ? dim.color : 'rgba(255,255,255,0.3)' }}>{dim.left}</span>
                  <span style={{ color: val > 0 ? dim.color : 'rgba(255,255,255,0.3)' }}>{dim.right}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reward */}
      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center glow-violet flex-shrink-0">
          <Coins className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">+4 ORRA Tokens Earned!</p>
          <p className="text-xs text-slate-500">Personality decoded successfully</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleRestart}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 transition-all glow-violet"
        >
          <Sparkles className="w-4 h-4" /> Back to Arena
        </button>
      </div>
    </div>
  );
}

export default PrismGame;
