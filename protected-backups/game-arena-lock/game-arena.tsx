'use client';

import { useAuraStore } from '@/store/aura-store';
import { useState } from 'react';
import {
  Gamepad2, Trophy, Zap, Users, Star, Play, Crown, ArrowLeft, Coins, Sparkles, Flame, Share2
} from 'lucide-react';

// Import real game components
import { TriviaBlast } from './games/trivia-blast';
import { WouldYouRather } from './games/would-you-rather';
import { PrismPersonality } from './games/prism-personality';
import { AuraQuiz } from './games/aura-quiz';
import { HotTake } from './games/hot-take';
import { GuessTheVibe } from './games/guess-the-vibe';
import { EmojiQuest } from './games/emoji-quest';
import { PollParty } from './games/poll-party';
import { MemeLab } from './games/meme-lab';
import { PredictIt } from './games/predict-it';
import { TwoTruthsLie } from './games/two-truths-lie';
// New multiplayer games
import { SongMatch } from './games/song-match';
import { QuickDraw } from './games/quick-draw';
import { ColorWars } from './games/color-wars';
import { RateMyFit } from './games/rate-my-fit';
import { StoryChallenge } from './games/story-challenge';
import { RoastBattle } from './games/roast-battle';

// 17 games (removed Dance Off, added 6 new multiplayer games)
const games = [
  {
    id: 'trivia-blast',
    name: 'Trivia Blast',
    description: 'Test your knowledge across multiple categories',
    cover: '/api/uploads?path=images/game-covers-v2/trivia-blast.png&v=1778871446',
    players: 12400,
    rating: 4.8,
    category: 'Quiz',
    reward: '+5 ORRA',
    color: 'from-violet-600 to-indigo-600',
    accent: 'text-violet-400',
  },
  {
    id: 'would-you-rather',
    name: 'Would You Rather',
    description: 'Make impossible choices & see what others picked',
    cover: '/api/uploads?path=images/game-covers-v2/would-you-rather.png&v=1778871446',
    players: 9800,
    rating: 4.6,
    category: 'Choice',
    reward: '+3 ORRA',
    color: 'from-cyan-600 to-blue-600',
    accent: 'text-cyan-400',
  },
  {
    id: 'prism',
    name: 'PrISM',
    description: 'Discover your personality prism & aura type',
    cover: '/api/uploads?path=images/game-covers-v2/prism.png&v=1778871446',
    players: 15600,
    rating: 4.7,
    category: 'Personality',
    reward: '+4 ORRA',
    color: 'from-emerald-600 to-teal-600',
    accent: 'text-emerald-400',
  },
  {
    id: 'aura-quiz',
    name: 'Aura Quiz',
    description: 'Find out your true aura color and energy',
    cover: '/api/uploads?path=images/game-covers-v2/aura-quiz.png&v=1778871446',
    players: 11200,
    rating: 4.5,
    category: 'Quiz',
    reward: '+4 ORRA',
    color: 'from-amber-600 to-yellow-600',
    accent: 'text-amber-400',
  },
  {
    id: 'hot-take',
    name: 'Hot Take',
    description: 'Drop your hottest takes & see who agrees',
    cover: '/api/uploads?path=images/game-covers-v2/hot-take.png&v=1778871446',
    players: 8700,
    rating: 4.4,
    category: 'Debate',
    reward: '+3 ORRA',
    color: 'from-red-600 to-orange-600',
    accent: 'text-red-400',
  },
  {
    id: 'guess-the-vibe',
    name: 'Guess the Vibe',
    description: 'Can you read the room? Guess the vibe!',
    cover: '/api/uploads?path=images/game-covers-v2/guess-the-vibe.png&v=1778871446',
    players: 7300,
    rating: 4.3,
    category: 'Social',
    reward: '+3 ORRA',
    color: 'from-teal-600 to-cyan-600',
    accent: 'text-teal-400',
  },
  {
    id: 'emoji-quest',
    name: 'Emoji Quest',
    description: 'Decode emoji puzzles & earn rewards',
    cover: '/api/uploads?path=images/game-covers-v2/emoji-quest.png&v=1778871446',
    players: 6500,
    rating: 4.2,
    category: 'Puzzle',
    reward: '+3 ORRA',
    color: 'from-yellow-500 to-amber-600',
    accent: 'text-yellow-400',
  },
  {
    id: 'poll-party',
    name: 'Poll Party',
    description: 'Vote on polls & see real-time results',
    cover: '/api/uploads?path=images/game-covers-v2/poll-party.png&v=1778871446',
    players: 5100,
    rating: 4.1,
    category: 'Social',
    reward: '+2 ORRA',
    color: 'from-indigo-600 to-violet-600',
    accent: 'text-indigo-400',
  },
  {
    id: 'meme-lab',
    name: 'Meme Lab',
    description: 'Create & rate memes in the lab',
    cover: '/api/uploads?path=images/game-covers-v2/meme-lab.png&v=1778871446',
    players: 9200,
    rating: 4.6,
    category: 'Creative',
    reward: '+3 ORRA',
    color: 'from-green-600 to-emerald-600',
    accent: 'text-green-400',
  },
  {
    id: 'predict-it',
    name: 'Predict It',
    description: 'Bet on outcomes & read the crowd to win',
    cover: '/api/uploads?path=images/game-covers-v2/predict-it.png&v=1778871446',
    players: 18700,
    rating: 4.9,
    category: 'Prediction',
    reward: '+6 ORRA',
    color: 'from-violet-600 to-fuchsia-600',
    accent: 'text-violet-400',
    badge: 'NEW',
  },
  {
    id: 'two-truths-lie',
    name: 'Two Truths & A Lie',
    description: "Deceive or detect — who's the better liar?",
    cover: '/api/uploads?path=images/game-covers-v2/two-truths-lie.png&v=1778871446',
    players: 22300,
    rating: 4.8,
    category: 'Deception',
    reward: '+5 ORRA',
    color: 'from-violet-600 to-fuchsia-600',
    accent: 'text-fuchsia-400',
    badge: 'HOT',
  },
  // === 6 NEW MULTIPLAYER GAMES ===
  {
    id: 'song-match',
    name: 'Song Match',
    description: 'Hum the tune, guess the song — music showdown!',
    cover: '/api/uploads?path=images/game-covers-v2/song-match.png&v=1778871446',
    players: 31200,
    rating: 4.9,
    category: 'Music',
    reward: '+5 ORRA',
    color: 'from-purple-600 to-violet-700',
    accent: 'text-purple-400',
    badge: 'MULTI',
  },
  {
    id: 'quick-draw',
    name: 'Quick Draw',
    description: 'Sketch it out fast — can friends guess your art?',
    cover: '/api/uploads?path=images/game-covers-v2/quick-draw.png&v=1778871446',
    players: 25800,
    rating: 4.8,
    category: 'Drawing',
    reward: '+4 ORRA',
    color: 'from-sky-600 to-blue-700',
    accent: 'text-sky-400',
    badge: 'MULTI',
  },
  {
    id: 'color-wars',
    name: 'Color Wars',
    description: 'Pick your color, claim territory, dominate!',
    cover: '/api/uploads?path=images/game-covers-v2/color-wars.png&v=1778871446',
    players: 19400,
    rating: 4.7,
    category: 'Strategy',
    reward: '+4 ORRA',
    color: 'from-rose-600 to-pink-700',
    accent: 'text-rose-400',
    badge: 'MULTI',
  },
  {
    id: 'rate-my-fit',
    name: 'Rate My Fit',
    description: 'Judge fits or show off yours — who got drip?',
    cover: '/api/uploads?path=images/game-covers-v2/rate-my-fit.png&v=1778871446',
    players: 22100,
    rating: 4.8,
    category: 'Fashion',
    reward: '+5 ORRA',
    color: 'from-pink-600 to-rose-600',
    accent: 'text-pink-400',
    badge: 'MULTI',
  },
  {
    id: 'story-challenge',
    name: 'Story Challenge',
    description: 'Build a story together — each friend adds a line!',
    cover: '/api/uploads?path=images/game-covers-v2/story-challenge.png&v=1778871446',
    players: 14600,
    rating: 4.6,
    category: 'Creative',
    reward: '+4 ORRA',
    color: 'from-cyan-600 to-teal-700',
    accent: 'text-cyan-400',
    badge: 'MULTI',
  },
  {
    id: 'roast-battle',
    name: 'Roast Battle',
    description: 'Head-to-head roasts — who can burn the hardest?',
    cover: '/api/uploads?path=images/game-covers-v2/roast-battle.png&v=1778871446',
    players: 28700,
    rating: 4.9,
    category: 'Battle',
    reward: '+6 ORRA',
    color: 'from-orange-600 to-red-700',
    accent: 'text-orange-400',
    badge: 'MULTI',
  },
];

// Real game component renderer
function GameView({ gameId, onBack }: { gameId: string; onBack: () => void }) {
  switch (gameId) {
    case 'trivia-blast':
      return <TriviaBlast onBack={onBack} />;
    case 'would-you-rather':
      return <WouldYouRather onBack={onBack} />;
    case 'prism':
      return <PrismPersonality onBack={onBack} />;
    case 'aura-quiz':
      return <AuraQuiz onBack={onBack} />;
    case 'hot-take':
      return <HotTake onBack={onBack} />;
    case 'guess-the-vibe':
      return <GuessTheVibe onBack={onBack} />;
    case 'emoji-quest':
      return <EmojiQuest onBack={onBack} />;
    case 'poll-party':
      return <PollParty onBack={onBack} />;
    case 'meme-lab':
      return <MemeLab onBack={onBack} />;
    case 'predict-it':
      return <PredictIt onBack={onBack} />;
    case 'two-truths-lie':
      return <TwoTruthsLie onBack={onBack} />;
    // New multiplayer games
    case 'song-match':
      return <SongMatch onBack={onBack} />;
    case 'quick-draw':
      return <QuickDraw onBack={onBack} />;
    case 'color-wars':
      return <ColorWars onBack={onBack} />;
    case 'rate-my-fit':
      return <RateMyFit onBack={onBack} />;
    case 'story-challenge':
      return <StoryChallenge onBack={onBack} />;
    case 'roast-battle':
      return <RoastBattle onBack={onBack} />;
    default:
      return (
        <div className="text-center p-8">
          <p className="text-slate-400">Game not found</p>
          <button onClick={onBack} className="mt-4 text-violet-400 text-sm font-medium">Back to Arena</button>
        </div>
      );
  }
}

// Enhanced 3D Game Cover Card
function GameCoverCard({ game, onSelect }: { game: typeof games[number]; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group relative rounded-2xl overflow-hidden text-left card-3d game-cover-float shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Glow effect behind card using game color gradient */}
      <div className={`absolute -inset-1 bg-gradient-to-br ${game.color} rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500 -z-10`} />

      {/* Game Cover Image — portrait ratio */}
      <div className="relative aspect-[3/4] overflow-hidden cover-3d-shine cover-3d-edge">
        <img
          src={game.cover}
          alt={game.name}
          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
        />
        {/* 3D shine overlay — always visible */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, transparent 50%, rgba(255,255,255,0.03) 70%, rgba(255,255,255,0.06) 100%)' }} />
        {/* 3D depth edge gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
        {/* Badge */}
        {game.badge && (
          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold text-white animate-pulse z-10 ${
            game.badge === 'MULTI' ? 'bg-violet-600/90' :
            game.badge === 'NEW' ? 'bg-emerald-500/90' :
            game.badge === 'HOT' ? 'bg-red-500/90' :
            'bg-red-500/90'
          }`}>
            {game.badge}
          </div>
        )}
        {/* Category tag */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-black/50 backdrop-blur-sm text-slate-300 z-10">
          {game.category}
        </div>
        {/* Game title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="text-base font-black text-white leading-tight drop-shadow-lg">{game.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold ${game.accent}`}>{game.reward}</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 text-yellow-400" />
              {game.rating}
            </span>
          </div>
        </div>
      </div>
      {/* Bottom info bar */}
      <div className="p-2 flex items-center justify-between bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Users className="w-2.5 h-2.5" />
          <span>{(game.players / 1000).toFixed(1)}K</span>
        </div>
        <div className="flex items-center gap-0.5 text-[10px] text-violet-400 font-bold group-hover:text-violet-300 transition-colors">
          <Play className="w-2.5 h-2.5" />
          Play
        </div>
      </div>
    </button>
  );
}

export function GameArena() {
  const { setView, auraTokens, earnTokens } = useAuraStore();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState<string | null>(null);

  // When a game is selected, render the actual game component in a constrained scrollable container
  if (selectedGame) {
    const game = games.find((g) => g.id === selectedGame);
    if (game) {
      return (
        <div className="fade-in max-h-[calc(100vh-120px)] overflow-y-auto overflow-hidden min-h-0">
          <GameView gameId={game.id} onBack={() => setSelectedGame(null)} />
        </div>
      );
    }
  }

  return (
    <div className="fade-in space-y-4 pb-4 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center glow-violet">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Game Arena</h2>
            <p className="text-xs text-slate-500">Play with friends, earn ORRA tokens</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">{auraTokens.toLocaleString()}</span>
        </div>
      </div>

      {/* Featured Game Banner */}
      <button
        onClick={() => setSelectedGame('trivia-blast')}
        className="w-full rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all group"
      >
        <div className="relative h-36 md:h-44">
          <img
            src="/api/uploads?path=images/game-covers-v2/trivia-blast.png&v=1778871446"
            alt="Trivia Blast"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-violet-400 tracking-wider uppercase animate-pulse">Featured</span>
              </div>
              <p className="text-xl font-black text-white leading-tight">TRIVIA BLAST</p>
              <p className="text-[11px] text-slate-300">Test your knowledge across categories +5 ORRA</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold group-hover:opacity-90 transition-all">
              Play →
            </div>
          </div>
        </div>
      </button>

      {/* Daily Reward Banner */}
      <div className="glass-panel rounded-2xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Flame className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Daily Game Streak</p>
          <p className="text-xs text-slate-500">Play any game daily for bonus ORRA tokens</p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 text-xs font-bold">
          <Sparkles className="w-3 h-3" />
          +10 ORRA
        </div>
      </div>

      {/* Multiplayer Games Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Play with Friends</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600/20 text-violet-400 font-bold">6 GAMES</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {games.filter(g => g.badge === 'MULTI').map((game) => (
            <GameCoverCard key={game.id} game={game} onSelect={() => setSelectedGame(game.id)} />
          ))}
        </div>
      </div>

      {/* All Games */}
      <div>
        <h3 className="text-sm font-bold text-white mb-2">All Games</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {games.filter(g => g.badge !== 'MULTI').map((game) => (
            <GameCoverCard key={game.id} game={game} onSelect={() => setSelectedGame(game.id)} />
          ))}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-violet-400">{games.length}</p>
            <p className="text-[10px] text-slate-500">Games</p>
          </div>
          <div>
            <p className="text-lg font-bold text-fuchsia-400">{(games.reduce((a, g) => a + g.players, 0) / 1000).toFixed(0)}K</p>
            <p className="text-[10px] text-slate-500">Players</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-400">{(games.reduce((a, g) => a + g.rating, 0) / games.length).toFixed(2)}</p>
            <p className="text-[10px] text-slate-500">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Social Game Features */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Social Features</span>
        </div>
        
        {/* Share Game Highlight to Pulse */}
        <button
          onClick={() => {
            earnTokens(3, 'Shared game highlight');
            setShowShareToast('highlight');
            setTimeout(() => setShowShareToast(null), 2000);
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-all">
            <Share2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white">Share Highlight to Pulse</p>
            <p className="text-[10px] text-slate-400">Share your game win +3 ORRA</p>
          </div>
        </button>

        {showShareToast && (
          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs text-center fade-in">
            Highlight shared to Pulse! +3 ORRA tokens earned
          </div>
        )}

        {/* Challenge a Friend */}
        <button
          onClick={() => setView('messages')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 hover:bg-fuchsia-500/15 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-fuchsia-500/20 flex items-center justify-center group-hover:bg-fuchsia-500/30 transition-all">
            <Trophy className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white">Challenge a Friend</p>
            <p className="text-[10px] text-slate-400">Send a game challenge via DM</p>
          </div>
        </button>

        {/* Prism AI Game Tips */}
        <button
          onClick={() => useAuraStore.setState({ prismCompanionOpen: true, prismCompanionMode: 'companion' })}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-all">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white">Prism AI Game Tips</p>
            <p className="text-[10px] text-slate-400">Get AI-powered strategies</p>
          </div>
        </button>
      </div>
    </div>
  );
}
