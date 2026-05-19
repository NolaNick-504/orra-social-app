'use client';

import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { GameBackground } from '@/components/aura/game-background';
import dynamic from 'next/dynamic';
import {
  Flame, Trophy, Users, Send, X, Check, Clock, Zap,
  Swords, MessageCircle, Star, Eye, Shirt,
  BookOpen, HelpCircle, Sparkles, Crown, Target,
  ArrowRight, UserPlus, AlertCircle, Loader2, Coins,
  ThumbsUp, ThumbsDown, Heart, RotateCcw, Play,
  Volume2, VolumeX, TrendingUp, Medal, Award, ShieldCheck,
  Search, Bot, Share2
} from 'lucide-react';

// Lazy-load individual game components for code splitting
const RoastBattleGame = dynamic(() => import('@/components/aura/games/roast-battle-game'), { ssr: false });
const HotTakeGame = dynamic(() => import('@/components/aura/games/hot-take-game'), { ssr: false });
const FirstImpressionGame = dynamic(() => import('@/components/aura/games/first-impression-game'), { ssr: false });
const RateMyFitGame = dynamic(() => import('@/components/aura/games/rate-my-fit-game'), { ssr: false });
const StoryChallengeGame = dynamic(() => import('@/components/aura/games/story-challenge-game'), { ssr: false });
const WhoSaidItGame = dynamic(() => import('@/components/aura/games/who-said-it-game'), { ssr: false });
const VibeCheckGame = dynamic(() => import('@/components/aura/games/vibe-check-game'), { ssr: false });
const ClapbackGame = dynamic(() => import('@/components/aura/games/clapback-game'), { ssr: false });
const AuraDropGame = dynamic(() => import('@/components/aura/games/aura-drop-game'), { ssr: false });
const TruthOrDareGame = dynamic(() => import('@/components/aura/games/truth-or-dare-game'), { ssr: false });

// ============================================
// GAME DATA - Best of the best for each mode
// ============================================

interface GameDef {
  type: string;
  name: string;
  icon: string;
  lucideIcon: string;
  color: string;
  accentFrom: string;
  accentTo: string;
  coverImage: string;
  tagline: string;
  tokenReward: number;
  xpReward: number;
  tokenCost: number;
  players: number;
  description: string;
  prompts?: string[];
  rounds?: number;
  timerSec?: number;
  // New: game flow category
  flowCategory: 'head_to_head' | 'asynchronous' | 'quiz' | 'solo';
}

const GAMES: GameDef[] = [
  {
    type: 'roast_battle', name: 'Roast Battle', icon: '🔥', lucideIcon: 'Flame', color: 'from-red-600 to-orange-500',
    accentFrom: 'from-red-500', accentTo: 'to-orange-400', coverImage: '/images/game-covers/roast-battle.png',
    tagline: 'Who can roast the hardest?', tokenReward: 25, xpReward: 30, tokenCost: 5, players: 2,
    description: 'Head-to-head roasting! Audience votes on the best burns. 3 rounds of pure fire!',
    prompts: [
      'Roast your opponent\'s profile picture',
      'Roast their bio - make it hurt',
      'Final round: Roast their whole vibe',
    ],
    rounds: 3, timerSec: 30, flowCategory: 'head_to_head',
  },
  {
    type: 'hot_take', name: 'Hot Take', icon: '🌶️', lucideIcon: 'Zap', color: 'from-orange-600 to-yellow-500',
    accentFrom: 'from-orange-500', accentTo: 'to-yellow-400', coverImage: '/images/game-covers/hot-take.png',
    tagline: 'Controversial or facts?', tokenReward: 15, xpReward: 20, tokenCost: 0, players: 1,
    description: 'Drop your hottest take. W or L? The community decides!',
    prompts: [
      'Pineapple on pizza is elite',
      'Social media is making us lonely',
      'AI will replace most jobs in 5 years',
      'Money CAN buy happiness',
      'Cancel culture went too far',
      'Anime is better than live action',
    ],
    rounds: 1, timerSec: 15, flowCategory: 'asynchronous',
  },
  {
    type: 'first_impression', name: 'First Impression', icon: '👀', lucideIcon: 'Eye', color: 'from-blue-600 to-cyan-500',
    accentFrom: 'from-blue-500', accentTo: 'to-cyan-400', coverImage: '/images/game-covers/first-impression.png',
    tagline: 'What do you see?', tokenReward: 20, xpReward: 25, tokenCost: 3, players: 2,
    description: 'Answer questions about your opponent\'s profile. The reveal is always hilarious!',
    prompts: [
      'What\'s their dream vacation?',
      'What\'s their guilty pleasure?',
      'What job would they have in another life?',
      'What\'s their go-to karaoke song?',
    ],
    rounds: 4, timerSec: 20, flowCategory: 'head_to_head',
  },
  {
    type: 'rate_my_fit', name: 'Rate My Fit', icon: '👔', lucideIcon: 'Shirt', color: 'from-purple-600 to-pink-500',
    accentFrom: 'from-purple-500', accentTo: 'to-pink-400', coverImage: '/images/game-covers/rate-my-fit.png',
    tagline: 'Fit check time!', tokenReward: 20, xpReward: 25, tokenCost: 0, players: 1,
    description: 'Post your outfit, the community rates 1-10 in real-time. Best fit wins!',
    prompts: ['Casual Friday', 'Night Out', 'Cozy Sunday', 'Main Character Energy'],
    rounds: 1, timerSec: 20, flowCategory: 'asynchronous',
  },
  {
    type: 'story_challenge', name: 'Story Challenge', icon: '📖', lucideIcon: 'BookOpen', color: 'from-emerald-600 to-green-500',
    accentFrom: 'from-emerald-500', accentTo: 'to-green-400', coverImage: '/images/game-covers/story-challenge.png',
    tagline: 'Show your story!', tokenReward: 15, xpReward: 20, tokenCost: 0, players: 1,
    description: 'Daily challenge prompt. Best stories get featured and earn tokens!',
    prompts: [
      'Tell us your most embarrassing moment',
      'What\'s the craziest thing a stranger said to you?',
      'Show us the weirdest thing in your room',
      'Reveal your hidden talent',
    ],
    rounds: 1, timerSec: 30, flowCategory: 'asynchronous',
  },
  {
    type: 'who_said_it', name: 'Who Said It', icon: '🤔', lucideIcon: 'HelpCircle', color: 'from-indigo-600 to-violet-500',
    accentFrom: 'from-indigo-500', accentTo: 'to-violet-400', coverImage: '/images/game-covers/who-said-it.png',
    tagline: 'Can you guess?', tokenReward: 20, xpReward: 25, tokenCost: 2, players: 1,
    description: 'Guess which friend said a quote. The more you guess right, the more you earn!',
    prompts: [
      '"I could eat pizza every day and not get tired of it"',
      '"I don\'t need sleep, I need results"',
      '"My dog is literally my best friend"',
      '"I\'ve never lost an argument in my life"',
      '"Monday is the best day of the week"',
      '"I cry at every movie and I\'m proud"',
    ],
    rounds: 5, timerSec: 10, flowCategory: 'quiz',
  },
  {
    type: 'vibe_check_game', name: 'Vibe Check', icon: '✨', lucideIcon: 'Sparkles', color: 'from-fuchsia-600 to-pink-400',
    accentFrom: 'from-fuchsia-500', accentTo: 'to-pink-400', coverImage: '/images/game-covers/vibe-check.png',
    tagline: 'What\'s the vibe?', tokenReward: 10, xpReward: 15, tokenCost: 0, players: 1,
    description: 'Answer daily vibe questions and see if you match the community!',
    prompts: ['Vibe Check: Morning energy?', 'Vibe Check: Weekend mood?', 'Vibe Check: Your aesthetic?', 'Vibe Check: Spirit animal?', 'Vibe Check: Go-to snack?'],
    rounds: 5, timerSec: 15, flowCategory: 'quiz',
  },
  {
    type: 'clapback', name: 'Clapback', icon: '💥', lucideIcon: 'Swords', color: 'from-amber-600 to-red-500',
    accentFrom: 'from-amber-500', accentTo: 'to-red-400', coverImage: '/images/game-covers/clapback.png',
    tagline: 'Clap back harder!', tokenReward: 30, xpReward: 35, tokenCost: 5, players: 2,
    description: 'Someone posts a statement, you post a clapback. People vote who won!',
    prompts: [
      'Statement: "You think you\'re all that"',
      'Statement: "Nobody asked for your opinion"',
      'Statement: "You could never pull this off"',
      'Statement: "Stay in your lane"',
    ],
    rounds: 3, timerSec: 20, flowCategory: 'head_to_head',
  },
  {
    type: 'aura_drop', name: 'Aura Drop', icon: '👑', lucideIcon: 'Crown', color: 'from-yellow-600 to-amber-400',
    accentFrom: 'from-yellow-500', accentTo: 'to-amber-400', coverImage: '/images/game-covers/aura-drop.png',
    tagline: 'Limited drop alert!', tokenReward: 50, xpReward: 50, tokenCost: 10, players: 1,
    description: 'Exclusive limited-time avatar effects & badges. Drops at random like sneaker drops!',
    prompts: ['Golden Crown Effect', 'Rainbow Name Glow', 'Diamond Badge', 'Neon Border Frame', 'Fire Avatar Ring'],
    rounds: 1, timerSec: 15, flowCategory: 'solo',
  },
  {
    type: 'truth_or_dare', name: 'Truth or Dare', icon: '🎯', lucideIcon: 'Target', color: 'from-rose-600 to-red-500',
    accentFrom: 'from-rose-500', accentTo: 'to-red-400', coverImage: '/images/game-covers/truth-or-dare.png',
    tagline: 'Truth or Dare?', tokenReward: 25, xpReward: 30, tokenCost: 3, players: 2,
    description: 'Pick Truth or Dare, respond, and the audience votes on the best response!',
    prompts: [
      'Truth: What\'s the last thing you searched?',
      'Dare: Do your best impression of your opponent',
      'Truth: Have you ever stalked someone\'s profile?',
      'Dare: Show us your most used emoji',
      'Truth: What\'s the most embarrassing song on your playlist?',
      'Dare: Text the last person you messaged "I love you"',
    ],
    rounds: 4, timerSec: 20, flowCategory: 'head_to_head',
  },
];

// ============================================
// Dynamic Lucide Icon Renderer
// ============================================
function GameIcon({ name, className }: { name: string; className?: string }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Flame, Zap, Eye, Shirt, BookOpen, HelpCircle, Sparkles, Swords, Crown, Target,
  };
  const Icon = iconMap[name];
  if (!Icon) return <span className={className}>{name}</span>;
  return <Icon className={className} />;
}

// Demo players for side-by-side
const DEMO_PLAYERS = [
  { id: 'p1', name: 'You', avatar: '/images/orra-logo.png', score: 0 },
  { id: 'p2', name: 'Opponent', avatar: '/images/orra-logo.png', score: 0 },
];

// Best moments data for each game type
const BEST_MOMENTS: Record<string, { highlight: string; reaction: string; player: string }[]> = {
  roast_battle: [
    { highlight: '"Your profile pic looks like a stock photo for disappointment"', reaction: '🔥🔥🔥 OHHH', player: 'p1' },
    { highlight: '"I\'d roast you but my mom said not to burn trash"', reaction: '💀 DEAD', player: 'p2' },
    { highlight: '"You\'re the reason they put instructions on shampoo"', reaction: '🏆 LEGENDARY', player: 'p1' },
  ],
  hot_take: [
    { highlight: '"Cereal is soup" → 87% voted L', reaction: 'CONTROVERSIAL', player: 'p1' },
    { highlight: '"Nap > Clubbing" → 92% voted W', reaction: 'FAXXX', player: 'p2' },
  ],
  first_impression: [
    { highlight: 'Guessed "works in crypto" → Actually: kindergarten teacher', reaction: '😂 WRONG', player: 'p1' },
    { highlight: 'Guessed "cat person" → Has 4 cats', reaction: '🎯 NAILED IT', player: 'p2' },
  ],
  rate_my_fit: [
    { highlight: 'Casual Friday fit → 9.2/10 average', reaction: '🔥 FIT GOD', player: 'p1' },
    { highlight: 'Night Out fit → 8.8/10 average', reaction: '✨ CLEAN', player: 'p2' },
  ],
  story_challenge: [
    { highlight: '"I accidentally sent a voice note to my boss at 2am"', reaction: '💀💀💀', player: 'p1' },
    { highlight: '"A stranger told me I look like their dead cat"', reaction: '😭 I CAN\'T', player: 'p2' },
  ],
  who_said_it: [
    { highlight: '"I could eat pizza every day" → Wrong guess!', reaction: '❌ OOF', player: 'p1' },
    { highlight: '"My dog is my best friend" → Correct! +5 tokens', reaction: '✅ SMART', player: 'p2' },
  ],
  vibe_check_game: [
    { highlight: 'Morning energy: "Chaotic Gremlin" (47 votes)', reaction: '🤣 ACCURATE', player: 'p1' },
    { highlight: 'Weekend mood: "Couch Potato King" (38 votes)', reaction: '😂 REAL', player: 'p2' },
  ],
  clapback: [
    { highlight: '"You think you\'re all that" → "I\'m more than that, I\'m all THIS"', reaction: '💥 DEVASTATING', player: 'p1' },
    { highlight: '"Stay in your lane" → "I don\'t have a lane, I own the road"', reaction: '🔥 UNSTOPPABLE', player: 'p2' },
  ],
  aura_drop: [
    { highlight: 'GOLDEN CROWN EFFECT claimed in 0.3s!', reaction: '👑 RARE DROP', player: 'p1' },
  ],
  truth_or_dare: [
    { highlight: 'Dare accepted: Did impression of opponent', reaction: '🤣 ICONIC', player: 'p1' },
    { highlight: 'Truth: "Last search was \'how to be cool\'"', reaction: '💀 EXPOSED', player: 'p2' },
  ],
};

// Audience reaction emojis
const REACTION_EMOJIS = ['🔥', '💀', '😂', '👑', '⚡', '🎯', '💯', '🤯'];

// Bot responses for "Play vs Bot" fallback
const BOT_RESPONSES: Record<string, string[]> = {
  roast_battle: ['Nice try but your roast was medium rare at best 😂', 'I would respond but I dont engage with amateurs 💅', 'That was cute. Want me to go easy on you? 🥺'],
  clapback: ['I don\'t need a lane, I AM the road 🛣️', 'My clapbacks write themselves ✍️', 'Stay mad, I\'ll stay fabulous 💅'],
  truth_or_dare: ['Truth: I still sleep with a nightlight 😅', 'Dare: I\'ll do my best robot dance!', 'Truth: I once liked a 3-year-old post at 2am'],
  first_impression: ['They look like they binge Netflix at 3am', 'Definitely has 50+ browser tabs open', 'Speaks to their plants I bet'],
};

// ============================================
// Live Countdown Timer
// ============================================
function LiveTimer({ seconds, onEnd, isActive }: { seconds: number; onEnd: () => void; isActive: boolean }) {
  const [time, setTime] = useState(seconds);

  useEffect(() => {
    if (!isActive) return;
    if (time <= 0) { onEnd(); return; }
    const t = setTimeout(() => setTime((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [time, isActive, onEnd]);

  const pct = (time / seconds) * 100;
  const isLow = time <= 5;
  return (
    <div className="flex items-center gap-2">
      <Clock className={`w-3.5 h-3.5 ${isLow ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-bold min-w-[24px] text-right ${isLow ? 'text-red-400' : 'text-white'}`}>
        {time}s
      </span>
    </div>
  );
}

// ============================================
// Side-by-Side Player Panel
// ============================================
function PlayerPanel({
  player, score, isActive, children, isWinner, isBot
}: {
  player: { id: string; name: string; avatar: string; score: number };
  score: number;
  isActive: boolean;
  children: React.ReactNode;
  isWinner?: boolean;
  isBot?: boolean;
}) {
  return (
    <div className={`relative rounded-xl overflow-hidden flex-1 min-w-0 ${
      isWinner ? 'ring-2 ring-yellow-400/60' : isActive ? 'ring-1 ring-violet-500/40' : 'ring-1 ring-white/10'
    }`}>
      {isWinner && (
        <div className="absolute top-2 right-2 z-10">
          <Crown className="w-5 h-5 text-yellow-400 animate-bounce" />
        </div>
      )}
      <div className={`p-3 ${isActive ? 'bg-violet-600/10' : 'bg-white/5'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-full overflow-hidden ring-2 ${isActive ? 'ring-violet-400' : 'ring-white/20'}`}>
            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{player.name}</p>
            <p className="text-[9px] text-slate-500">{score} pts</p>
          </div>
          {isActive && (
            <span className="px-1.5 py-0 rounded text-[8px] font-bold bg-violet-500/30 text-violet-300 animate-pulse">YOUR TURN</span>
          )}
          {isBot && (
            <span className="px-1.5 py-0 rounded text-[8px] font-bold bg-slate-500/30 text-slate-400">BOT</span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================
// Audience Reaction Bar (no tokens - purely visual)
// ============================================
function ReactionBar({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 py-2 justify-center">
      {REACTION_EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onReact(e)}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 transition-all text-lg hover:scale-125 active:scale-90"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Floating Reaction Effect
// ============================================
function FloatingReactions({ reactions }: { reactions: string[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {reactions.map((r, i) => (
        <span
          key={i}
          className="absolute text-lg animate-bounce"
          style={{
            left: `${10 + Math.random() * 80}%`,
            bottom: `${10 + Math.random() * 40}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: '1.5s',
          }}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

// ============================================
// Best Moment Card
// ============================================
function BestMomentCard({ moment }: { moment: { highlight: string; reaction: string; player: string } }) {
  return (
    <div className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-r from-yellow-900/20 to-amber-900/10 border border-yellow-500/20">
      <div className="absolute top-1 right-1">
        <Star className="w-3.5 h-3.5 text-yellow-400" />
      </div>
      <p className="text-xs text-white font-medium leading-relaxed pr-5">{moment.highlight}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] font-bold text-yellow-400">{moment.reaction}</span>
      </div>
    </div>
  );
}

// ============================================
// Opponent data type
// ============================================
interface OpponentData {
  id: string;
  name: string;
  handle?: string;
  avatar: string;
  bio?: string;
}

// ============================================
// GAMEPLAY ENGINE - Real Multiplayer
// ============================================
function GameplayEngine({ game, onClose, sessionId: externalSessionId }: { game: GameDef; onClose: () => void; sessionId?: string }) {
  const { earnTokens, addXP, auraTokens } = useAuraStore();
  const currentUser = useCurrentUser();

  // ---- Specialized Game Component Routing ----
  // When true, we delegate to the game-specific component instead of the generic engine
  const [useSpecializedGame, setUseSpecializedGame] = useState(false);

  // ---- All state must be declared before any conditional returns (React hooks rule) ----
  type Phase = 
    | 'intro' | 'matching' 
    | 'playing' | 'reveal' | 'voting' | 'roundResult'
    | 'creating' | 'submitted' | 'checking'
    | 'question' | 'feedback'
    | 'dropping' | 'claimed'
    | 'bestmoments' | 'final';

  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [p1Input, setP1Input] = useState('');
  const [p2Input, setP2Input] = useState('');
  const [p1Submitted, setP1Submitted] = useState(false);
  const [p2Submitted, setP2Submitted] = useState(false);
  const [votes, setVotes] = useState({ p1: 0, p2: 0 });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [reactions, setReactions] = useState<string[]>([]);
  const [showReactions, setShowReactions] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionResult, setCompletionResult] = useState<{ tokensEarned: number; xpEarned: number; isWinner: boolean } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(externalSessionId || null);
  const [opponent, setOpponent] = useState<OpponentData | null>(null);
  const [isVsBot, setIsVsBot] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState<'idle' | 'searching' | 'matched' | 'timeout'>('idle');
  const [matchmakingTimer, setMatchmakingTimer] = useState(0);
  const [matchmakingMode, setMatchmakingMode] = useState<'random' | 'friend' | 'open'>('random');
  const [asyncSubmissionId, setAsyncSubmissionId] = useState<string | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [votingTimer, setVotingTimer] = useState(0);
  const [votingMinElapsed, setVotingMinElapsed] = useState(false);
  const gameStartTime = useRef<number>(0);
  const roundInputs = useRef<string[]>([]);

  const totalRounds = game.rounds || 3;
  const currentPrompt = game.prompts?.[round % (game.prompts?.length || 1)] || '';
  const isSinglePlayer = game.flowCategory === 'solo' || game.flowCategory === 'asynchronous' || game.flowCategory === 'quiz';
  const flowCategory = game.flowCategory;
  const opponentDisplay: OpponentData = opponent || { id: 'bot', name: isVsBot ? 'Guest Bot' : 'Opponent', avatar: '/images/orra-logo.png' };

  // Build GameProps for specialized components
  const gameProps = {
    onClose,
    currentUser: {
      id: (currentUser as any).id || 'user',
      name: currentUser.name || 'You',
      avatar: currentUser.avatar || '/images/orra-logo.png',
      handle: (currentUser as any).handle,
      bio: (currentUser as any).bio,
    },
    opponent: null as any, // Will be populated from state below
    isVsBot: false, // Will be populated from state below
    gameSessionId: externalSessionId || null,
    tokenReward: game.tokenReward,
    xpReward: game.xpReward,
    callbacks: {
      earnTokens: (amount: number, source: string) => earnTokens(amount, source),
      addXP: (amount: number) => addXP(amount),
      showToast: (msg: string) => toast.success(msg),
      submitToServer: (roundNumber: number, playerInput: string, isBot?: boolean) => {
        if (externalSessionId) {
          fetch(`/api/games/session/${externalSessionId}?XTransformPort=3000`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'submit_input', roundNumber, playerInput, isBot }),
          }).catch(() => {});
        }
      },
      submitVote: (votedForId: string, voteType: string) => {
        if (externalSessionId) {
          fetch('/api/games/vote?XTransformPort=3000', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: externalSessionId, votedForId, voteType }),
          }).catch(() => {});
        }
      },
      completeGame: (score: number, isWinner: boolean) => {
        // Update local store immediately for responsive UI
        earnTokens(isWinner ? game.tokenReward : Math.floor(game.tokenReward / 3), `challenge_${game.type}`);
        addXP(isWinner ? game.xpReward : Math.floor(game.xpReward / 3));
        toast.success(isWinner ? `You won! +${game.tokenReward} ORRA` : `Good game! +${Math.floor(game.tokenReward / 3)} ORRA`);
        // Also persist to server for reward tracking
        if (externalSessionId) {
          fetch('/api/games/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: externalSessionId }),
          }).catch(() => {});
        }
      },
    },
    accentColor: game.color,
  };

  // ============================================
  // MATCHMAKING - Real API calls
  // ============================================
  const startMatchmaking = useCallback(async (mode: 'random' | 'friend' | 'open' = 'random') => {
    if (isStarting) return;
    setIsStarting(true);
    setMatchmakingMode(mode);
    gameStartTime.current = Date.now();

    // Solo/async/quiz games skip matchmaking - go directly to specialized component
    if (isSinglePlayer) {
      try {
        const res = await fetch('/api/games/matchmake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameType: game.type }),
        });
        const data = await res.json();
        if (data.success) {
          setGameSessionId(data.data.id);
        }
      } catch {
        // Allow play without session
      }
      setIsStarting(false);
      setUseSpecializedGame(true);
      return;
    }

    // Head-to-head: start matchmaking
    setPhase('matching');
    setMatchmakingStatus('searching');
    setMatchmakingTimer(0);

    try {
      const res = await fetch('/api/games/matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: game.type, matchMode: mode }),
      });
      const data = await res.json();
      if (data.success) {
        setGameSessionId(data.data.id);
        if (data.data.status === 'active' && data.data.player2) {
          // Opponent found immediately — session is active with both players
          setOpponent({
            id: data.data.player2.id,
            name: data.data.player2.name,
            handle: data.data.player2.handle,
            avatar: data.data.player2.avatar,
          });
          setMatchmakingStatus('matched');
          setTimeout(() => {
            setUseSpecializedGame(true);
            setMatchmakingStatus('idle');
          }, 1500);
        } else {
          // Waiting for opponent - will poll
          setMatchmakingStatus('searching');
        }
      } else {
        toast.error(data.error || 'Matchmaking failed');
        setPhase('intro');
        setMatchmakingStatus('idle');
      }
    } catch {
      toast.error('Connection error');
      setPhase('intro');
      setMatchmakingStatus('idle');
    }
    setIsStarting(false);
  }, [isStarting, game.type, isSinglePlayer, flowCategory]);

  // Poll for opponent during matching phase
  useEffect(() => {
    if (phase !== 'matching' || matchmakingStatus !== 'searching' || !gameSessionId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/session/${gameSessionId}?XTransformPort=3000`);
        const data = await res.json();
        if (data.success && data.data.status === 'active' && data.data.player2) {
          setOpponent({
            id: data.data.player2.id,
            name: data.data.player2.name,
            handle: data.data.player2.handle,
            avatar: data.data.player2.avatar,
            bio: data.data.player2.bio || '',
          });
          setMatchmakingStatus('matched');
          setTimeout(() => {
            setUseSpecializedGame(true);
            setMatchmakingStatus('idle');
          }, 1500);
        }
      } catch {
        // Silently retry
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, matchmakingStatus, gameSessionId]);

  // Matchmaking timer (count up)
  useEffect(() => {
    if (phase !== 'matching' || matchmakingStatus !== 'searching') return;
    const interval = setInterval(() => {
      setMatchmakingTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, matchmakingStatus]);

  // Timeout after 30 seconds
  useEffect(() => {
    if (phase === 'matching' && matchmakingTimer >= 30 && matchmakingStatus === 'searching') {
      setMatchmakingStatus('timeout');
    }
  }, [phase, matchmakingTimer, matchmakingStatus]);

  // ---- Bot opponent simulation (only when explicitly chosen) ----
  useEffect(() => {
    if (!isVsBot || phase !== 'playing' || p2Submitted) return;
    const delay = 2000 + Math.random() * 3000;
    const t = setTimeout(() => {
      const responses = BOT_RESPONSES[game.type] || ['Nice one!', 'I see you!', 'Let\'s go!'];
      setP2Input(responses[round % responses.length]);
      setP2Submitted(true);
      // Submit bot input to server
      if (gameSessionId) {
        fetch(`/api/games/session/${gameSessionId}?XTransformPort=3000`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit_input', roundNumber: round, playerInput: responses[round % responses.length], isBot: true }),
        }).catch(() => {});
      }
    }, delay);
    return () => clearTimeout(t);
  }, [isVsBot, phase, round, p2Submitted, game.type, gameSessionId]);

  // ============================================
  // REAL VOTE POLLING - Replace auto-generated votes
  // ============================================
  useEffect(() => {
    if (phase !== 'voting' || !gameSessionId) return;
    // Poll every 3 seconds for real vote counts
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/vote?sessionId=${gameSessionId}&roundNumber=${round}&XTransformPort=3000`);
        const data = await res.json();
        if (data.success) {
          setVotes({ p1: data.data.player1Votes, p2: data.data.player2Votes });
        }
      } catch {
        // Silently retry
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, gameSessionId, round]);

  // Voting timer (minimum 15 seconds)
  useEffect(() => {
    if (phase !== 'voting') return;
    setVotingTimer(0);
    setVotingMinElapsed(false);
    const interval = setInterval(() => {
      setVotingTimer((t) => {
        if (t >= 15) setVotingMinElapsed(true);
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // ============================================
  // SUBMIT P1 - ONE CLICK ONLY
  // ============================================
  const handleSubmitP1 = useCallback(() => {
    if (p1Submitted) return;
    if (!p1Input.trim()) return;
    setP1Submitted(true);
    roundInputs.current = [...roundInputs.current, p1Input];
    // Submit to server
    if (gameSessionId) {
      fetch(`/api/games/session/${gameSessionId}?XTransformPort=3000`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_input', roundNumber: round, playerInput: p1Input }),
      }).catch(() => {});
    }
  }, [p1Submitted, p1Input, gameSessionId, round]);

  // ============================================
  // VOTE - ONE CLICK ONLY (real API call)
  // ============================================
  const handleVote = useCallback(async (player: 'p1' | 'p2') => {
    if (userVote) return;
    setUserVote(player);
    // Submit vote to server
    if (gameSessionId) {
      try {
        const votedForId = player === 'p1' ? (currentUser.id || 'p1') : (opponent?.id || 'p2');
        await fetch('/api/games/vote?XTransformPort=3000', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: gameSessionId,
            votedForId,
            voteType: 'pick',
          }),
        });
      } catch {
        // Fallback: local count only
      }
    }
    setVotes((v) => ({ ...v, [player]: v[player as keyof typeof v] + 1 }));
  }, [userVote, gameSessionId, currentUser.id, opponent?.id]);

  const handleReact = (emoji: string) => {
    setReactions((prev) => [...prev.slice(-6), emoji]);
    setShowReactions(true);
    setTimeout(() => setShowReactions(false), 1500);
  };

  const nextRound = () => {
    const roundWinner = votes.p1 >= votes.p2 ? 0 : 1;
    const newScores = [...scores];
    newScores[roundWinner] += 10;
    if (userVote === (roundWinner === 0 ? 'p1' : 'p2')) {
      newScores[0] += 5;
    }
    setScores(newScores);
    setVotes({ p1: 0, p2: 0 });
    setUserVote(null);
    setP1Input('');
    setP2Input('');
    setP1Submitted(false);
    setP2Submitted(false);
    setReactions([]);

    if (round + 1 >= totalRounds) {
      setPhase('bestmoments');
    } else {
      setRound(round + 1);
      setPhase('playing');
    }
  };

  const handleTimerEnd = () => {
    if (phase === 'playing') {
      if (p1Submitted && (p2Submitted || isVsBot || isSinglePlayer)) {
        // For head-to-head: go to reveal, then voting
        if (flowCategory === 'head_to_head') setPhase('reveal');
        else setPhase('voting');
      } else {
        if (!p1Input) setP1Input('(ran out of time)');
        if (!p2Input) setP2Input('(ran out of time)');
        setP1Submitted(true);
        setP2Submitted(true);
        if (flowCategory === 'head_to_head') setPhase('reveal');
        else setTimeout(() => setPhase('voting'), 500);
      }
    }
  };

  // ============================================
  // COMPLETE CHALLENGE - Server-side reward
  // ============================================
  const completeChallenge = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    const winner = scores[0] >= scores[1] ? 0 : 1;
    const finalScore = scores[0];
    const isWinner = winner === 0;

    try {
      if (gameSessionId) {
        const res = await fetch('/api/games/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: gameSessionId,
            score: finalScore,
            gameType: game.type,
            result: { rounds: roundInputs.current, scores, winner: isWinner ? 'p1' : 'p2' },
          }),
        });
        const data = await res.json();
        if (data.success) {
          earnTokens(data.data.tokensEarned, `challenge_complete_${game.type}`);
          addXP(data.data.xpEarned);
          setCompletionResult(data.data);
          toast.success(`+${data.data.tokensEarned} ORRA +${data.data.xpEarned} XP`, { icon: '🏆', duration: 3000 });
        } else {
          toast.error(data.error || 'Could not claim rewards');
          setCompletionResult({ tokensEarned: 0, xpEarned: 0, isWinner: false });
        }
      } else {
        earnTokens(isWinner ? game.tokenReward : Math.floor(game.tokenReward / 3), `challenge_${game.type}`);
        addXP(isWinner ? game.xpReward : Math.floor(game.xpReward / 3));
        setCompletionResult({
          tokensEarned: isWinner ? game.tokenReward : Math.floor(game.tokenReward / 3),
          xpEarned: isWinner ? game.xpReward : Math.floor(game.xpReward / 3),
          isWinner,
        });
        toast.success(isWinner ? `You won! +${game.tokenReward} ORRA` : `Good game! +${Math.floor(game.tokenReward / 3)} ORRA`);
      }
    } catch (err) {
      console.error('Challenge completion error:', err);
      toast.error('Failed to claim rewards. Try again.');
      setCompletionResult({ tokensEarned: 0, xpEarned: 0, isWinner: false });
    }
  }, [isCompleting, gameSessionId, scores, game, earnTokens, addXP]);

  // ============================================
  // Reset game state
  // ============================================
  const resetGame = () => {
    setRound(0);
    setPhase('intro');
    setScores([0, 0]);
    setP1Input('');
    setP2Input('');
    setP1Submitted(false);
    setP2Submitted(false);
    setVotes({ p1: 0, p2: 0 });
    setUserVote(null);
    setReactions([]);
    setIsCompleting(false);
    setCompletionResult(null);
    setIsStarting(false);
    setOpponent(null);
    setIsVsBot(false);
    setMatchmakingStatus('idle');
    setMatchmakingTimer(0);
    setQuizCorrect(0);
    setQuizFeedback(null);
    setVotingTimer(0);
    setVotingMinElapsed(false);
    setAsyncSubmissionId(null);
    roundInputs.current = [];
  };

  // ============================================
  // SPECIALIZED GAME COMPONENT ROUTING
  // Must be after all hooks (React rules of hooks)
  // ============================================
  if (useSpecializedGame) {
    const finalProps = {
      ...gameProps,
      opponent: opponent || { id: 'bot', name: 'Guest Bot', avatar: '/images/orra-logo.png' },
      isVsBot,
      gameSessionId,
    };
    const gameComponentMap: Record<string, React.ComponentType<any>> = {
      roast_battle: RoastBattleGame,
      hot_take: HotTakeGame,
      first_impression: FirstImpressionGame,
      rate_my_fit: RateMyFitGame,
      story_challenge: StoryChallengeGame,
      who_said_it: WhoSaidItGame,
      vibe_check_game: VibeCheckGame,
      clapback: ClapbackGame,
      aura_drop: AuraDropGame,
      truth_or_dare: TruthOrDareGame,
    };
    const GameComponent = gameComponentMap[game.type];
    if (GameComponent) {
      return <GameComponent {...finalProps} />;
    }
    // Fallback: if no specialized component, continue with generic engine
  }

  // ============================================
  // INTRO PHASE - Updated with matchmaking options
  // ============================================
  if (phase === 'intro') {
    const needsOpponent = flowCategory === 'head_to_head';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={onClose} />
        <div className="relative glass-panel rounded-2xl p-6 w-full max-w-lg fade-in border border-violet-500/30 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg`}>
            {game.icon}
          </div>
          <h2 className="text-2xl font-black text-white mb-1">{game.name}</h2>
          <p className="text-sm text-slate-400 mb-4">{game.tagline}</p>
          <div className="flex items-center justify-center gap-4 mb-4 p-3 rounded-xl bg-white/5">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1"><Coins className="w-4 h-4" />{game.tokenReward}</p>
              <p className="text-[9px] text-slate-500">Winner</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-violet-400 flex items-center justify-center gap-1"><Zap className="w-4 h-4" />{game.xpReward}</p>
              <p className="text-[9px] text-slate-500">XP</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{totalRounds}</p>
              <p className="text-[9px] text-slate-500">{flowCategory === 'asynchronous' ? 'Sub' : flowCategory === 'quiz' ? 'Qs' : 'Rounds'}</p>
            </div>
          </div>

          {/* Game mode badge */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">
              {flowCategory === 'head_to_head' ? '1v1 Real Opponent' 
                : flowCategory === 'asynchronous' ? 'Community Voting' 
                : flowCategory === 'quiz' ? 'Quiz Mode' 
                : 'Solo Drop'}
            </span>
          </div>

          {/* Player preview */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 p-3 rounded-xl bg-violet-600/10 border border-violet-500/20">
              <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-1 ring-2 ring-violet-400">
                <img src={currentUser.avatar || DEMO_PLAYERS[0].avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-bold text-white">{currentUser.name || 'You'}</p>
            </div>
            {needsOpponent ? (
              <div className="flex items-center text-2xl font-black text-violet-400">VS</div>
            ) : (
              <div className="flex items-center text-sm font-bold text-slate-500">
                {flowCategory === 'asynchronous' ? '👥' : flowCategory === 'quiz' ? '🧠' : '👑'}
              </div>
            )}
            <div className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10">
              {needsOpponent ? (
                <>
                  <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-1 ring-2 ring-white/20 bg-white/10 flex items-center justify-center">
                    <Search className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-xs font-bold text-white">???</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-1 ring-2 ring-white/20 bg-white/10 flex items-center justify-center">
                    <span className="text-lg">{flowCategory === 'asynchronous' ? '👥' : flowCategory === 'quiz' ? '🧠' : '👑'}</span>
                  </div>
                  <p className="text-xs font-bold text-white">
                    {flowCategory === 'asynchronous' ? 'Community' : flowCategory === 'quiz' ? 'Quiz' : 'Drop'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Start buttons */}
          {needsOpponent ? (
            <div className="space-y-2">
              <button
                onClick={() => startMatchmaking('random')}
                disabled={isStarting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all glow-violet flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isStarting ? 'Finding...' : 'Find Opponent'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => startMatchmaking('open')}
                  disabled={isStarting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Users className="w-3.5 h-3.5" /> Open Battle
                </button>
                <button
                  onClick={() => {
                    // Play vs Bot - clearly labeled
                    setIsVsBot(true);
                    setOpponent({ id: 'bot', name: 'Guest Bot', avatar: '/images/orra-logo.png' });
                    gameStartTime.current = Date.now();
                    setUseSpecializedGame(true);
                  }}
                  disabled={isStarting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Bot className="w-3.5 h-3.5" /> Play vs Bot
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => startMatchmaking('random')}
              disabled={isStarting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all glow-violet flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {isStarting ? 'Starting...' : `Start ${flowCategory === 'solo' ? 'Drop' : flowCategory === 'quiz' ? 'Quiz' : 'Challenge'}`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // MATCHING PHASE - Animated searching UI
  // ============================================
  if (phase === 'matching') {
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-8 w-full max-w-md fade-in border border-violet-500/30 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>

          {/* Spinning ring animation */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 border-r-fuchsia-500 animate-spin`} style={{ animationDuration: '1.5s' }} />
            <div className={`absolute inset-2 rounded-full border-4 border-transparent border-b-violet-400 border-l-fuchsia-400 animate-spin`} style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
              {matchmakingStatus === 'matched' ? (
                <Check className="w-10 h-10 text-emerald-400" />
              ) : (
                <span className="text-3xl">{game.icon}</span>
              )}
            </div>
          </div>

          {matchmakingStatus === 'searching' && (
            <>
              <h3 className="text-xl font-black text-white mb-2 animate-pulse">Finding Opponent...</h3>
              <p className="text-sm text-slate-400 mb-4">Searching for a {game.name} player</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-lg font-mono font-bold text-slate-300">{formatTime(matchmakingTimer)}</span>
              </div>

              {/* Your info */}
              <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-violet-400">
                  <img src={currentUser.avatar || DEMO_PLAYERS[0].avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-bold text-white">{currentUser.name || 'You'}</span>
                <span className="text-slate-500">vs</span>
                <div className="w-10 h-10 rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-slate-500 animate-pulse" />
                </div>
                <span className="text-sm font-bold text-slate-500">???</span>
              </div>

              {matchmakingTimer >= 15 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Keep searching - reset timer
                      setMatchmakingTimer(0);
                      setMatchmakingStatus('searching');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" /> Keep Searching
                  </button>
                  <button
                    onClick={() => {
                      setIsVsBot(true);
                      setOpponent({ id: 'bot', name: 'Guest Bot', avatar: '/images/orra-logo.png' });
                      setMatchmakingStatus('idle');
                      setUseSpecializedGame(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Bot className="w-3.5 h-3.5" /> Play vs Bot
                  </button>
                </div>
              )}
            </>
          )}

          {matchmakingStatus === 'matched' && opponent && (
            <>
              <h3 className="text-xl font-black text-emerald-400 mb-2">Opponent Found!</h3>
              <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-400">
                  <img src={opponent.avatar} alt={opponent.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{opponent.name}</p>
                  {opponent.handle && <p className="text-xs text-slate-400">@{opponent.handle}</p>}
                </div>
              </div>
            </>
          )}

          {matchmakingStatus === 'timeout' && (
            <>
              <h3 className="text-xl font-black text-amber-400 mb-2">No Opponent Found</h3>
              <p className="text-sm text-slate-400 mb-4">Nobody is playing {game.name} right now. Try again or play vs bot!</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMatchmakingTimer(0);
                    setMatchmakingStatus('searching');
                    startMatchmaking(matchmakingMode);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> Try Again
                </button>
                <button
                  onClick={() => {
                    setIsVsBot(true);
                    setOpponent({ id: 'bot', name: 'Guest Bot', avatar: '/images/orra-logo.png' });
                    setMatchmakingStatus('idle');
                    setUseSpecializedGame(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5" /> Play vs Bot
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // PLAYING PHASE - Head-to-Head (side-by-side)
  // ============================================
  if (phase === 'playing' && flowCategory === 'head_to_head') {
    const isHotTake = game.type === 'hot_take';
    const isFirstImpression = game.type === 'first_impression';
    const isTruthOrDare = game.type === 'truth_or_dare';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" />
        <div className="relative w-full max-w-2xl fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{game.icon}</span>
              <span className="font-bold text-white text-sm">{game.name}</span>
              <span className="text-xs text-slate-500">Round {round + 1}/{totalRounds}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-amber-400 font-bold">{scores[0]} - {scores[1]}</span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Timer */}
          <div className="mb-3 px-1">
            <LiveTimer key={`h2h-${round}-${phase}`} seconds={game.timerSec || 20} onEnd={handleTimerEnd} isActive={phase === 'playing'} />
          </div>

          {/* Prompt */}
          <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 text-center">
            <p className="text-sm font-bold text-white">{currentPrompt}</p>
          </div>

          {/* Side-by-side */}
          <div className="flex gap-2 relative">
            {showReactions && <FloatingReactions reactions={reactions} />}

            {/* Player 1 (You) */}
            <PlayerPanel player={{ ...DEMO_PLAYERS[0], name: currentUser.name || 'You', avatar: currentUser.avatar || DEMO_PLAYERS[0].avatar }} score={scores[0]} isActive={!p1Submitted}>
              <div>
                <textarea
                  value={p1Input}
                  onChange={(e) => setP1Input(e.target.value)}
                  placeholder={isHotTake ? 'Drop your hottest take...' : isFirstImpression ? 'Your guess...' : isTruthOrDare ? 'Your response...' : 'Type your response...'}
                  disabled={p1Submitted}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none min-h-[60px] disabled:opacity-50"
                  maxLength={200}
                />
                {!p1Submitted && (
                  <button
                    onClick={handleSubmitP1}
                    disabled={!p1Input.trim()}
                    className="w-full mt-1.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold disabled:opacity-30"
                  >
                    Submit
                  </button>
                )}
              </div>
            </PlayerPanel>

            {/* VS Divider */}
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-violet-500/20">
                VS
              </div>
            </div>

            {/* Player 2 (Real Opponent or Bot) */}
            <PlayerPanel player={{ id: opponentDisplay.id, name: opponentDisplay.name, avatar: opponentDisplay.avatar, score: scores[1] }} score={scores[1]} isActive={false} isBot={isVsBot}>
              {!p2Submitted ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                  <span className="ml-2 text-xs text-slate-500">Typing...</span>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-200">{p2Input}</p>
                  {p2Submitted && <Check className="w-3 h-3 text-emerald-400 mt-1" />}
                </div>
              )}
            </PlayerPanel>
          </div>

          <ReactionBar onReact={handleReact} />

          {/* Both submitted - move to reveal/voting */}
          {p1Submitted && (p2Submitted || isVsBot) && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setPhase('reveal')}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all"
              >
                Reveal Answers <ArrowRight className="w-3 h-3 inline" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // REVEAL PHASE - Show both answers side by side
  // ============================================
  if (phase === 'reveal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" />
        <div className="relative w-full max-w-2xl fade-in">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{game.icon}</span>
              <span className="font-bold text-white text-sm">{game.name} - Reveal!</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex gap-2 relative">
            {showReactions && <FloatingReactions reactions={reactions} />}
            <div className="flex-1 rounded-xl p-4 bg-violet-600/10 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-violet-400">
                  <img src={currentUser.avatar || DEMO_PLAYERS[0].avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-white">{currentUser.name || 'You'}</span>
              </div>
              <p className="text-sm text-white font-medium p-2 rounded-lg bg-white/5">{p1Input || '(no response)'}</p>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-[10px] font-black text-white">
                VS
              </div>
            </div>

            <div className="flex-1 rounded-xl p-4 bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20">
                  <img src={opponentDisplay.avatar} alt={opponentDisplay.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-white">{opponentDisplay.name}</span>
                {isVsBot && <span className="text-[8px] bg-slate-500/30 text-slate-400 px-1 rounded">BOT</span>}
              </div>
              <p className="text-sm text-white font-medium p-2 rounded-lg bg-white/5">{p2Input || '(no response)'}</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setPhase('voting')}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Users className="w-4 h-4" /> Let the Community Vote!
            </button>
            <p className="text-[10px] text-slate-500 mt-2">Share this battle for more votes</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // VOTING PHASE - Real spectator voting
  // ============================================
  if (phase === 'voting') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" />
        <div className="relative w-full max-w-2xl fade-in">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{game.icon}</span>
              <span className="font-bold text-white text-sm">VOTE: {game.name}</span>
              <span className="px-1.5 py-0 rounded text-[8px] font-bold bg-red-500/30 text-red-400 animate-pulse">LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{votingTimer}s</span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex gap-2 relative">
            {showReactions && <FloatingReactions reactions={reactions} />}
            <div className="flex-1 rounded-xl p-3 bg-violet-600/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-violet-400">
                  <img src={currentUser.avatar || DEMO_PLAYERS[0].avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-white">{currentUser.name || 'You'}</span>
              </div>
              <p className="text-sm text-slate-200 mb-3 p-2 rounded-lg bg-white/5">{p1Input}</p>
              <div className="relative h-8 rounded-lg bg-white/5 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg transition-all duration-500"
                  style={{ width: `${votes.p1 + votes.p2 > 0 ? (votes.p1 / (votes.p1 + votes.p2)) * 100 : 50}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {votes.p1} votes
                </span>
              </div>
              <button
                onClick={() => handleVote('p1')}
                className={`w-full mt-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  userVote === 'p1' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-violet-600/20'
                }`}
                disabled={!!userVote}
              >
                {userVote === 'p1' ? '✓ Voted' : 'Vote W'}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-slate-400">
                VS
              </div>
            </div>

            <div className="flex-1 rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20">
                  <img src={opponentDisplay.avatar} alt={opponentDisplay.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-white">{opponentDisplay.name}</span>
                {isVsBot && <span className="text-[8px] bg-slate-500/30 text-slate-400 px-1 rounded">BOT</span>}
              </div>
              <p className="text-sm text-slate-200 mb-3 p-2 rounded-lg bg-white/5">{p2Input}</p>
              <div className="relative h-8 rounded-lg bg-white/5 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-600 to-orange-600 rounded-lg transition-all duration-500"
                  style={{ width: `${votes.p1 + votes.p2 > 0 ? (votes.p2 / (votes.p1 + votes.p2)) * 100 : 50}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {votes.p2} votes
                </span>
              </div>
              <button
                onClick={() => handleVote('p2')}
                className={`w-full mt-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  userVote === 'p2' ? 'bg-rose-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-rose-600/20'
                }`}
                disabled={!!userVote}
              >
                {userVote === 'p2' ? '✓ Voted' : 'Vote W'}
              </button>
            </div>
          </div>

          <ReactionBar onReact={handleReact} />

          {/* Share for votes button */}
          <div className="text-center mt-2 mb-2">
            <button
              onClick={() => {
                toast.success('Battle shared to feed! Others can vote now.');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
            >
              <Share2 className="w-3 h-3" /> Share to Feed for Votes
            </button>
          </div>

          <div className="text-center mt-1">
            <span className="text-[10px] text-slate-500">
              <Users className="w-3 h-3 inline" /> {votes.p1 + votes.p2 + Math.floor(Math.random() * 5 + 3)} watching
            </span>
            {!votingMinElapsed && (
              <span className="text-[10px] text-amber-400 ml-2">Min 15s voting window ({15 - votingTimer}s left)</span>
            )}
          </div>

          <div className="mt-3 text-center">
            <button
              onClick={nextRound}
              disabled={!votingMinElapsed && votes.p1 + votes.p2 < 3}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40"
            >
              {round + 1 >= totalRounds ? 'See Results' : 'Next Round'} <ArrowRight className="w-3 h-3 inline" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // CREATING PHASE - Asynchronous games (Hot Take, Rate My Fit, Story Challenge)
  // ============================================
  if (phase === 'creating' && flowCategory === 'asynchronous') {
    const isHotTake = game.type === 'hot_take';
    const isRateMyFit = game.type === 'rate_my_fit';
    const isStoryChallenge = game.type === 'story_challenge';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-6 w-full max-w-lg fade-in border border-violet-500/30">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg`}>
              {game.icon}
            </div>
            <h2 className="text-xl font-black text-white">{game.name}</h2>
            <p className="text-sm text-slate-400">{currentPrompt}</p>
          </div>

          {/* Hot Take: text input */}
          {isHotTake && (
            <div>
              <textarea
                value={p1Input}
                onChange={(e) => setP1Input(e.target.value)}
                placeholder="Drop your hottest take..."
                disabled={p1Submitted}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none min-h-[80px] disabled:opacity-50"
                maxLength={200}
              />
              {!p1Submitted && (
                <button
                  onClick={() => {
                    if (!p1Input.trim()) return;
                    setP1Submitted(true);
                    roundInputs.current = [...roundInputs.current, p1Input];
                    setPhase('submitted');
                    toast.success('Hot take submitted! Community will vote W or L.');
                  }}
                  disabled={!p1Input.trim()}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-yellow-500 text-white font-bold text-sm disabled:opacity-30"
                >
                  Submit Take
                </button>
              )}
            </div>
          )}

          {/* Rate My Fit: photo upload placeholder + caption */}
          {isRateMyFit && (
            <div>
              <div className="w-full h-48 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center mb-3">
                <div className="text-center">
                  <Shirt className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Photo upload placeholder</p>
                  <p className="text-[10px] text-slate-600">Fit photo would go here</p>
                </div>
              </div>
              <textarea
                value={p1Input}
                onChange={(e) => setP1Input(e.target.value)}
                placeholder="Caption your fit..."
                disabled={p1Submitted}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none min-h-[60px] disabled:opacity-50"
                maxLength={150}
              />
              {!p1Submitted && (
                <button
                  onClick={() => {
                    if (!p1Input.trim()) return;
                    setP1Submitted(true);
                    roundInputs.current = [...roundInputs.current, p1Input];
                    setPhase('submitted');
                    toast.success('Fit submitted! Community will rate it 1-10.');
                  }}
                  disabled={!p1Input.trim()}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm disabled:opacity-30"
                >
                  Submit Fit
                </button>
              )}
            </div>
          )}

          {/* Story Challenge: text input */}
          {isStoryChallenge && (
            <div>
              <textarea
                value={p1Input}
                onChange={(e) => setP1Input(e.target.value)}
                placeholder="Tell your story..."
                disabled={p1Submitted}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none min-h-[100px] disabled:opacity-50"
                maxLength={500}
              />
              {!p1Submitted && (
                <button
                  onClick={() => {
                    if (!p1Input.trim()) return;
                    setP1Submitted(true);
                    roundInputs.current = [...roundInputs.current, p1Input];
                    setPhase('submitted');
                    toast.success('Story submitted! Community will vote 🔥');
                  }}
                  disabled={!p1Input.trim()}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold text-sm disabled:opacity-30"
                >
                  Submit Story
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // SUBMITTED PHASE - Async game waiting for votes
  // ============================================
  if (phase === 'submitted' && flowCategory === 'asynchronous') {
    const isHotTake = game.type === 'hot_take';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-emerald-500/20 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-xl font-black text-white mb-2">Submitted!</h2>
          <p className="text-sm text-slate-400 mb-4">
            {isHotTake
              ? 'Your take is now on the Hot Take board. Others will vote W or L!'
              : game.type === 'rate_my_fit'
              ? 'Your fit is live! Others will rate it 1-10.'
              : 'Your story is live! Others will vote 🔥'}
          </p>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
            <p className="text-sm text-white">{p1Input}</p>
          </div>

          <button
            onClick={() => {
              // Simulate checking results after some time
              setPhase('checking');
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all mb-2"
          >
            Check Results
          </button>

          <button
            onClick={() => {
              toast.success('Shared to feed!');
            }}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" /> Share for More Votes
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // CHECKING PHASE - Async results
  // ============================================
  if (phase === 'checking' && flowCategory === 'asynchronous') {
    const isHotTake = game.type === 'hot_take';
    const fakeVotes = Math.floor(Math.random() * 30 + 10);
    const wPercent = isHotTake ? Math.floor(Math.random() * 60 + 30) : 0;
    const avgRating = game.type === 'rate_my_fit' ? (Math.random() * 4 + 5).toFixed(1) : '0';
    const fireCount = game.type === 'story_challenge' ? Math.floor(Math.random() * 40 + 10) : 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-violet-500/20 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>

          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl mx-auto mb-4`}>
            {game.icon}
          </div>
          <h2 className="text-xl font-black text-white mb-4">Results</h2>

          {isHotTake && (
            <div className="space-y-3 mb-4">
              <div className="p-3 rounded-xl bg-white/5">
                <p className="text-sm text-white mb-2">{p1Input}</p>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-lg font-black text-emerald-400">{wPercent}%</p>
                    <p className="text-[10px] text-emerald-400">W Votes</p>
                  </div>
                  <div className="flex-1 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-lg font-black text-red-400">{100 - wPercent}%</p>
                    <p className="text-[10px] text-red-400">L Votes</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400">{fakeVotes} total votes • {wPercent >= 70 ? '🔥 NUCLEAR TAKE!' : wPercent >= 50 ? '✅ Community agrees' : '💀 Controversial'}</p>
            </div>
          )}

          {game.type === 'rate_my_fit' && (
            <div className="space-y-3 mb-4">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-4xl font-black text-yellow-400 mb-1">{avgRating}/10</p>
                <p className="text-xs text-slate-400">Average rating from {fakeVotes} raters</p>
              </div>
              <p className="text-xs text-slate-400">{parseFloat(avgRating) >= 8 ? '🔥 Fit God status!' : parseFloat(avgRating) >= 6 ? '✨ Clean fit' : '💪 Keep improving'}</p>
            </div>
          )}

          {game.type === 'story_challenge' && (
            <div className="space-y-3 mb-4">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-4xl font-black text-emerald-400 mb-1">🔥 {fireCount}</p>
                <p className="text-xs text-slate-400">Fire reactions from {fakeVotes} viewers</p>
              </div>
              <p className="text-xs text-slate-400">{fireCount >= 30 ? '🏆 Featured story!' : fireCount >= 15 ? '⭐ Great story!' : '📖 Keep sharing!'}</p>
            </div>
          )}

          <button
            onClick={() => {
              setPhase('final');
              completeChallenge();
            }}
            disabled={isCompleting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isCompleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming...</> : <>Claim Rewards <ArrowRight className="w-4 h-4 inline" /></>}
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // QUESTION PHASE - Quiz games (Who Said It, Vibe Check)
  // ============================================
  if (phase === 'question' && flowCategory === 'quiz') {
    const isWhoSaidIt = game.type === 'who_said_it';
    const isVibeCheck = game.type === 'vibe_check_game';

    // Quiz options
    const whoSaidItOptions = ['You 😏', 'A Random User 🤷', 'Your Opponent 🎭', 'ORRA Bot 🤖'];
    const vibeOptions = ['Chaotic Gremlin ☠️', 'Main Character ✨', 'Cozy Vibes 🌿', 'Unhinged 🔥', 'Zen Master 🧘'];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-violet-500/30">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{game.icon}</span>
              <span className="font-bold text-white">{game.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Q{round + 1}/{totalRounds}</span>
              <span className="text-xs font-bold text-emerald-400">{quizCorrect} ✓</span>
            </div>
          </div>

          {/* Timer */}
          <div className="mb-3">
            <LiveTimer key={`quiz-${round}`} seconds={game.timerSec || 10} onEnd={() => {
              if (!p1Submitted) {
                setP1Input('(ran out of time)');
                setP1Submitted(true);
                setQuizFeedback('wrong');
                setTimeout(() => {
                  if (round + 1 >= totalRounds) setPhase('bestmoments');
                  else { setRound(round + 1); setP1Input(''); setP1Submitted(false); setQuizFeedback(null); }
                }, 1500);
              }
            }} isActive={!p1Submitted} />
          </div>

          {/* Question */}
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 text-center">
            <p className="text-sm font-bold text-white">{currentPrompt}</p>
          </div>

          {/* Options */}
          {!p1Submitted ? (
            <div className="space-y-2">
              {isWhoSaidIt && whoSaidItOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setP1Input(option);
                    setP1Submitted(true);
                    roundInputs.current = [...roundInputs.current, option];
                    // Simulate correct answer ~40% of the time
                    const isCorrect = Math.random() < 0.4;
                    if (isCorrect) setQuizCorrect(qc => qc + 1);
                    setQuizFeedback(isCorrect ? 'correct' : 'wrong');
                    setTimeout(() => {
                      if (round + 1 >= totalRounds) setPhase('bestmoments');
                      else { setRound(round + 1); setP1Input(''); setP1Submitted(false); setQuizFeedback(null); }
                    }, 1500);
                  }}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-violet-600/20 hover:border-violet-500/30 transition-all text-left"
                >
                  {option}
                </button>
              ))}
              {isVibeCheck && vibeOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setP1Input(option);
                    setP1Submitted(true);
                    roundInputs.current = [...roundInputs.current, option];
                    // Simulate matching majority ~50% of the time
                    const matched = Math.random() < 0.5;
                    if (matched) setQuizCorrect(qc => qc + 1);
                    setQuizFeedback(matched ? 'correct' : 'wrong');
                    setTimeout(() => {
                      if (round + 1 >= totalRounds) setPhase('bestmoments');
                      else { setRound(round + 1); setP1Input(''); setP1Submitted(false); setQuizFeedback(null); }
                    }, 1500);
                  }}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-fuchsia-600/20 hover:border-fuchsia-500/30 transition-all text-left"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              {quizFeedback === 'correct' ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-400">Correct! 🎯</p>
                  <p className="text-xs text-slate-400 mt-1">Your answer: {p1Input}</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-red-400">Wrong! ❌</p>
                  <p className="text-xs text-slate-400 mt-1">Your answer: {p1Input}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // DROPPING PHASE - Aura Drop (solo)
  // ============================================
  if (phase === 'dropping' && flowCategory === 'solo') {
    const dropItem = game.prompts?.[round % game.prompts.length] || 'Mystery Drop';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-yellow-500/30 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>

          <div className="mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 mx-auto mb-4 flex items-center justify-center text-5xl animate-pulse shadow-lg shadow-yellow-500/30">
              {dropItem.split(' ')[0] === 'Golden' ? '👑' : dropItem.split(' ')[0] === 'Rainbow' ? '🌈' : dropItem.split(' ')[0] === 'Diamond' ? '💎' : dropItem.split(' ')[0] === 'Neon' ? '⚡' : '🔥'}
            </div>
            <h2 className="text-xl font-black text-white mb-1">Aura Drop!</h2>
            <p className="text-sm text-yellow-400 font-bold">{dropItem}</p>
          </div>

          {/* Supply counter */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Supply Remaining</span>
              <span className="text-xs font-bold text-amber-400">{Math.floor(Math.random() * 30 + 5)} / 100</span>
            </div>
            <div className="h-2 mt-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
            </div>
          </div>

          {!p1Submitted ? (
            <button
              onClick={() => {
                setP1Submitted(true);
                roundInputs.current = [...roundInputs.current, dropItem];
                toast.success('Drop claimed!');
                setPhase('claimed');
              }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-black text-lg hover:opacity-90 transition-all animate-pulse shadow-lg shadow-yellow-500/30"
            >
              CLAIM NOW!
            </button>
          ) : (
            <button disabled className="w-full py-4 rounded-xl bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-bold text-lg cursor-default">
              ✓ Claimed
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // CLAIMED PHASE - Aura Drop result
  // ============================================
  if (phase === 'claimed' && flowCategory === 'solo') {
    const dropItem = game.prompts?.[round % game.prompts.length] || 'Mystery Drop';
    const claimTime = (Math.random() * 2 + 0.1).toFixed(1);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-yellow-500/30 text-center">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400">
            <X className="w-5 h-5" />
          </button>

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg shadow-yellow-500/30">
            👑
          </div>
          <h2 className="text-2xl font-black text-white mb-1">DROP CLAIMED!</h2>
          <p className="text-sm text-yellow-400 font-bold mb-2">{dropItem}</p>
          <p className="text-xs text-slate-400 mb-4">Claimed in {claimTime}s</p>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
            <p className="text-xs text-slate-400">This cosmetic has been added to your collection</p>
          </div>

          <button
            onClick={() => {
              setPhase('final');
              completeChallenge();
            }}
            disabled={isCompleting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isCompleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming Rewards...</> : <>Claim Rewards <ArrowRight className="w-4 h-4 inline" /></>}
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // BEST MOMENTS PHASE
  // ============================================
  if (phase === 'bestmoments') {
    const moments = BEST_MOMENTS[game.type] || [];
    // For quiz games, show score instead of moments
    const isQuizGame = flowCategory === 'quiz';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-5 w-full max-w-md fade-in border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-black text-white">{isQuizGame ? 'Quiz Results' : 'Best Moments'}</h2>
            <span className="text-xl">{game.icon}</span>
          </div>

          {isQuizGame ? (
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              <p className="text-4xl font-black text-white mb-1">{quizCorrect}/{totalRounds}</p>
              <p className="text-sm text-slate-400">Correct Answers</p>
              <p className="text-xs text-slate-500 mt-2">
                {quizCorrect === totalRounds ? '🏆 PERFECT SCORE!' : quizCorrect >= totalRounds * 0.7 ? '⭐ Great job!' : quizCorrect >= totalRounds * 0.5 ? '👍 Not bad!' : '💪 Keep practicing!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {moments.map((m, i) => (
                <BestMomentCard key={i} moment={m} />
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setPhase('final');
              completeChallenge();
            }}
            disabled={isCompleting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isCompleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Claiming Rewards...</> : <>Claim Rewards <ArrowRight className="w-4 h-4 inline" /></>}
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // FINAL RESULTS
  // ============================================
  if (phase === 'final') {
    const winner = scores[0] >= scores[1] ? 0 : 1;
    const isYouWin = winner === 0;
    const tokensEarned = completionResult?.tokensEarned ?? (isYouWin ? game.tokenReward : Math.floor(game.tokenReward / 3));
    const xpEarned = completionResult?.xpEarned ?? (isYouWin ? game.xpReward : Math.floor(game.xpReward / 3));

    // For quiz/async games, determine win based on score thresholds
    const isQuizWin = flowCategory === 'quiz' ? quizCorrect >= Math.ceil(totalRounds * 0.5) : isYouWin;
    const displayWin = flowCategory === 'quiz' || flowCategory === 'asynchronous' || flowCategory === 'solo' ? true : isYouWin;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
        <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-yellow-500/30 text-center">
          <div className="mb-4">
            {displayWin ? (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-yellow-500/30">
                <Crown className="w-10 h-10 text-white" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 mx-auto flex items-center justify-center mb-3">
                <Medal className="w-10 h-10 text-slate-300" />
              </div>
            )}
            <h2 className="text-2xl font-black text-white mb-1">
              {flowCategory === 'solo' ? 'DROP COMPLETE!' : flowCategory === 'quiz' ? (isQuizWin ? 'GREAT QUIZ!' : 'KEEP TRYING!') : flowCategory === 'asynchronous' ? 'SUBMITTED!' : (displayWin ? 'YOU WON!' : 'Close Game!')}
            </h2>
            <p className="text-sm text-slate-400">{game.name} Challenge Complete</p>
          </div>

          {/* Score comparison - only for head-to-head */}
          {flowCategory === 'head_to_head' && (
            <div className="flex items-center justify-center gap-6 mb-4 p-3 rounded-xl bg-white/5">
              <div className="text-center">
                <p className={`text-2xl font-black ${isYouWin ? 'text-yellow-400' : 'text-slate-400'}`}>{scores[0]}</p>
                <p className="text-[9px] text-slate-500">Your Score</p>
              </div>
              <div className="text-slate-600 font-black">VS</div>
              <div className="text-center">
                <p className={`text-2xl font-black ${!isYouWin ? 'text-rose-400' : 'text-slate-400'}`}>{scores[1]}</p>
                <p className="text-[9px] text-slate-500">{isVsBot ? 'Bot' : 'Opponent'}</p>
              </div>
            </div>
          )}

          {/* Quiz score display */}
          {flowCategory === 'quiz' && (
            <div className="p-3 rounded-xl bg-white/5 mb-4">
              <p className="text-2xl font-black text-violet-400">{quizCorrect}/{totalRounds}</p>
              <p className="text-xs text-slate-400">Correct Answers</p>
            </div>
          )}

          {/* Rewards earned */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-lg font-black text-amber-400">+{tokensEarned}</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-lg font-black text-violet-400">+{xpEarned} XP</span>
            </div>
          </div>

          {/* Verified badge */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-emerald-400">Rewards verified server-side</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all"
            >
              Done
            </button>
            <button
              onClick={resetGame}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================
// MAIN ORRA CHALLENGES PAGE
// ============================================
export function ORRAChallenges() {
  const { auraTokens } = useAuraStore();
  const currentUser = useCurrentUser();
  const [activeGame, setActiveGame] = useState<GameDef | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [tab, setTab] = useState<'games' | 'nowplaying'>('games');
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteGame, setInviteGame] = useState<GameDef | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const startGame = async (game: GameDef) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: game.type }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveSessionId(data.data.id);
        setActiveGame(game);
      } else {
        toast.error(data.error || 'Failed to start challenge');
      }
    } catch {
      setActiveSessionId(undefined);
      setActiveGame(game);
    }
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen pb-20 relative game-view overflow-hidden">
      {/* Animated Game Background */}
      <GameBackground accentColor="violet" intensity={0.5} />

      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-violet-400" />
            <h1 className="text-lg font-black text-white">ORRA Challenges</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{auraTokens}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          {(['games', 'nowplaying'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'games' ? '🎮 Games' : '⚔️ Now Playing'}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      {tab === 'games' && (
        <div className="max-w-2xl mx-auto px-3 mt-3">
          <div className="grid grid-cols-2 gap-2.5">
            {GAMES.map((game) => (
              <button
                key={game.type}
                onClick={() => startGame(game)}
                disabled={isCreating}
                className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 aspect-[3/4]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {/* Cover art background image */}
                <picture>
                  <source srcSet={game.coverImage.replace('.png', '.webp')} type="image/webp" />
                  <img
                    src={game.coverImage}
                    alt={game.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                </picture>

                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                {/* Color tint overlay matching game theme */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-[0.15] group-hover:opacity-[0.25] transition-opacity duration-500`} />

                {/* Bottom gradient for text area */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

                {/* Animated glow pulse */}
                <div className={`absolute -top-4 -right-4 w-28 h-28 bg-gradient-to-br ${game.color} opacity-[0.15] blur-[40px] group-hover:opacity-[0.35] transition-all duration-700 rounded-full group-hover:scale-125`} />

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s ease-in-out infinite',
                }} />

                {/* Animated gradient border on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                  background: `linear-gradient(145deg, rgba(139,92,246,0.4), transparent 40%, transparent 60%, rgba(217,70,239,0.3))`,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  padding: '1.5px',
                }} />

                <div className="relative p-3.5 flex flex-col h-full">
                  {/* Top row: mode badge */}
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-lg backdrop-blur-md ${
                      game.flowCategory === 'solo'
                        ? 'bg-amber-400/20 text-amber-200 border border-amber-400/25'
                        : game.flowCategory === 'head_to_head'
                        ? 'bg-white/10 text-white/80 border border-white/15'
                        : game.flowCategory === 'quiz'
                        ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/25'
                        : 'bg-fuchsia-400/20 text-fuchsia-200 border border-fuchsia-400/25'
                    }`}>
                      {game.flowCategory === 'solo' ? 'SOLO' : game.flowCategory === 'head_to_head' ? '1 VS 1' : game.flowCategory === 'quiz' ? 'QUIZ' : 'COMMUNITY'}
                    </span>
                  </div>

                  {/* Spacer to push content to bottom */}
                  <div className="flex-1" />

                  {/* Icon with glow */}
                  <div className="relative mb-2">
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${game.color} opacity-50 blur-lg`} />
                    <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-lg leading-none">{game.icon}</span>
                    </div>
                  </div>

                  {/* Game name */}
                  <h3 className="text-[13px] font-black text-white mb-0.5 leading-tight tracking-tight drop-shadow-lg">{game.name}</h3>

                  {/* Tagline */}
                  <p className="text-[9px] text-white/50 line-clamp-1 mb-1 leading-relaxed">{game.tagline}</p>

                  {/* Description */}
                  <p className="text-[8px] text-white/35 line-clamp-2 mb-2 leading-relaxed">{game.description}</p>

                  {/* Reward row */}
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[8px] font-bold text-amber-200 bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm border border-amber-400/15">
                      <Coins className="w-2.5 h-2.5" />{game.tokenReward}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[8px] font-bold text-violet-200 bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm border border-violet-400/15">
                      <Zap className="w-2.5 h-2.5" />{game.xpReward}xp
                    </span>
                    {game.tokenCost > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-rose-300/70 bg-black/30 px-1.5 py-0.5 rounded-md">
                        -{game.tokenCost}
                      </span>
                    )}
                  </div>

                  {/* Play button on hover */}
                  <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-white/20">
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Now Playing */}
      {tab === 'nowplaying' && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="text-center py-12">
            <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No active challenges</p>
            <p className="text-xs text-slate-600 mt-1">Start a game from the Games tab!</p>
          </div>
        </div>
      )}

      {/* Active Game Modal */}
      {activeGame && (
        <GameplayEngine
          game={activeGame}
          sessionId={activeSessionId}
          onClose={() => {
            setActiveGame(null);
            setActiveSessionId(undefined);
          }}
        />
      )}
    </div>
  );
}
