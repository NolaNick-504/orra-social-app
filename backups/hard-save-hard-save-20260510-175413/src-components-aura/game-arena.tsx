'use client';

import { useAuraStore } from '@/store/aura-store';
import { useState, useCallback } from 'react';
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

// Cache-bust version to force browser refresh of all images (increment when images change)
const IMG_V = '?v=20260511a';

// === SOLO GAMES (11) ===
const soloGames = [
  {
    id: 'trivia-blast',
    name: 'Trivia Blast',
    description: 'Test your knowledge across multiple categories',
    cover: `/images/games/trivia-blast.png${IMG_V}`,
    icon: '\u2728',
    players: 12400,
    rating: 4.8,
    category: 'Quiz',
    reward: '+5 ORRA',
    color: 'from-violet-600 to-indigo-600',
    accent: 'text-violet-400',
    bgAccent: 'bg-violet-500',
  },
  {
    id: 'would-you-rather',
    name: 'Would You Rather',
    description: 'Make impossible choices & see what others picked',
    cover: `/images/games/would-you-rather.png${IMG_V}`,
    icon: '\ud83e\uddf9',
    players: 9800,
    rating: 4.6,
    category: 'Choice',
    reward: '+3 ORRA',
    color: 'from-cyan-600 to-blue-600',
    accent: 'text-cyan-400',
    bgAccent: 'bg-cyan-500',
  },
  {
    id: 'prism',
    name: 'PrISM',
    description: 'Discover your personality prism & aura type',
    cover: `/images/games/prism.png${IMG_V}`,
    icon: '\ud83d\udd2e',
    players: 15600,
    rating: 4.7,
    category: 'Personality',
    reward: '+4 ORRA',
    color: 'from-emerald-600 to-teal-600',
    accent: 'text-emerald-400',
    bgAccent: 'bg-emerald-500',
  },
  {
    id: 'aura-quiz',
    name: 'Aura Quiz',
    description: 'Find out your true aura color and energy',
    cover: `/images/games/aura-quiz.png${IMG_V}`,
    icon: '\ud83c\udf1f',
    players: 11200,
    rating: 4.5,
    category: 'Quiz',
    reward: '+4 ORRA',
    color: 'from-amber-600 to-yellow-600',
    accent: 'text-amber-400',
    bgAccent: 'bg-amber-500',
  },
  {
    id: 'hot-take',
    name: 'Hot Take',
    description: 'Drop your hottest takes & see who agrees',
    cover: `/images/games/hot-take.png${IMG_V}`,
    icon: '\ud83d\udd25',
    players: 8700,
    rating: 4.4,
    category: 'Debate',
    reward: '+3 ORRA',
    color: 'from-red-600 to-orange-600',
    accent: 'text-red-400',
    bgAccent: 'bg-red-500',
  },
  {
    id: 'guess-the-vibe',
    name: 'Guess the Vibe',
    description: 'Can you read the room? Guess the vibe!',
    cover: `/images/games/guess-the-vibe.png${IMG_V}`,
    icon: '\ud83c\udfb5',
    players: 7300,
    rating: 4.3,
    category: 'Social',
    reward: '+3 ORRA',
    color: 'from-teal-600 to-cyan-600',
    accent: 'text-teal-400',
    bgAccent: 'bg-teal-500',
  },
  {
    id: 'emoji-quest',
    name: 'Emoji Quest',
    description: 'Decode emoji puzzles & earn rewards',
    cover: `/images/games/emoji-quest.png${IMG_V}`,
    icon: '\ud83e\udd47',
    players: 6500,
    rating: 4.2,
    category: 'Puzzle',
    reward: '+3 ORRA',
    color: 'from-yellow-500 to-amber-600',
    accent: 'text-yellow-400',
    bgAccent: 'bg-yellow-500',
  },
  {
    id: 'poll-party',
    name: 'Poll Party',
    description: 'Vote on polls & see real-time results',
    cover: `/images/games/poll-party.png${IMG_V}`,
    icon: '\ud83d\uddf3\ufe0f',
    players: 5100,
    rating: 4.1,
    category: 'Social',
    reward: '+2 ORRA',
    color: 'from-indigo-600 to-violet-600',
    accent: 'text-indigo-400',
    bgAccent: 'bg-indigo-500',
  },
  {
    id: 'meme-lab',
    name: 'Meme Lab',
    description: 'Create & rate memes in the lab',
    cover: `/images/games/meme-lab.png${IMG_V}`,
    icon: '\ud83d\udc68\u200d\ud83d\udd2c',
    players: 9200,
    rating: 4.6,
    category: 'Creative',
    reward: '+3 ORRA',
    color: 'from-green-600 to-emerald-600',
    accent: 'text-green-400',
    bgAccent: 'bg-green-500',
  },
  {
    id: 'predict-it',
    name: 'Predict It',
    description: 'Bet on outcomes & read the crowd to win',
    cover: `/images/games/predict-it.png${IMG_V}`,
    icon: '\ud83d\udd2e',
    players: 18700,
    rating: 4.9,
    category: 'Prediction',
    reward: '+6 ORRA',
    color: 'from-violet-600 to-fuchsia-600',
    accent: 'text-violet-400',
    bgAccent: 'bg-violet-500',
    badge: 'NEW',
  },
  {
    id: 'two-truths-lie',
    name: 'Two Truths & A Lie',
    description: "Deceive or detect — who's the better liar?",
    cover: `/images/games/two-truths-lie.png${IMG_V}`,
    icon: '\ud83e\udd25',
    players: 22300,
    rating: 4.8,
    category: 'Deception',
    reward: '+5 ORRA',
    color: 'from-violet-600 to-fuchsia-600',
    accent: 'text-fuchsia-400',
    bgAccent: 'bg-fuchsia-500',
    badge: 'HOT',
  },
];

// === MULTIPLAYER GAMES (6) ===
const multiGames = [
  {
    id: 'song-match',
    name: 'Song Match',
    description: 'Hum the tune, guess the song — music showdown!',
    cover: `/images/games/song-match.png${IMG_V}`,
    icon: '\ud83c\udfb6',
    players: 31200,
    rating: 4.9,
    category: 'Music',
    reward: '+5 ORRA',
    color: 'from-purple-600 to-violet-700',
    accent: 'text-purple-400',
    bgAccent: 'bg-purple-500',
  },
  {
    id: 'quick-draw',
    name: 'Quick Draw',
    description: 'Sketch it out fast — can friends guess your art?',
    cover: `/images/games/quick-draw.png${IMG_V}`,
    icon: '\ud83c\udfa8',
    players: 25800,
    rating: 4.8,
    category: 'Drawing',
    reward: '+4 ORRA',
    color: 'from-sky-600 to-blue-700',
    accent: 'text-sky-400',
    bgAccent: 'bg-sky-500',
  },
  {
    id: 'color-wars',
    name: 'Color Wars',
    description: 'Pick your color, claim territory, dominate!',
    cover: `/images/games/color-wars.png${IMG_V}`,
    icon: '\ud83c\udfa8',
    players: 19400,
    rating: 4.7,
    category: 'Strategy',
    reward: '+4 ORRA',
    color: 'from-rose-600 to-pink-700',
    accent: 'text-rose-400',
    bgAccent: 'bg-rose-500',
  },
  {
    id: 'rate-my-fit',
    name: 'Rate My Fit',
    description: 'Judge fits or show off yours — who got drip?',
    cover: `/images/games/rate-my-fit.png${IMG_V}`,
    icon: '\ud83d\udc57',
    players: 22100,
    rating: 4.8,
    category: 'Fashion',
    reward: '+5 ORRA',
    color: 'from-pink-600 to-rose-600',
    accent: 'text-pink-400',
    bgAccent: 'bg-pink-500',
  },
  {
    id: 'story-challenge',
    name: 'Story Challenge',
    description: 'Build a story together — each friend adds a line!',
    cover: `/images/games/story-challenge.png${IMG_V}`,
    icon: '\ud83d\udcdc',
    players: 14600,
    rating: 4.6,
    category: 'Creative',
    reward: '+4 ORRA',
    color: 'from-cyan-600 to-teal-700',
    accent: 'text-cyan-400',
    bgAccent: 'bg-cyan-500',
  },
  {
    id: 'roast-battle',
    name: 'Roast Battle',
    description: 'Head-to-head roasts — who can burn the hardest?',
    cover: `/images/games/roast-battle.png${IMG_V}`,
    icon: '\ud83d\udd25',
    players: 28700,
    rating: 4.9,
    category: 'Battle',
    reward: '+6 ORRA',
    color: 'from-orange-600 to-red-700',
    accent: 'text-orange-400',
    bgAccent: 'bg-orange-500',
  },
];

// Combined for stats
const allGames = [...multiGames, ...soloGames];

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

// Game card component - professional game cover art as primary visual
function GameCard({ game, onClick, isMultiplayer }: {
  game: typeof soloGames[0] & { bgAccent?: string };
  onClick: () => void;
  isMultiplayer?: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden hover:ring-2 hover:ring-violet-500/40 transition-all text-left shadow-lg shadow-black/30 hover:shadow-violet-500/20 hover:shadow-xl"
    >
      {/* Game Cover Area */}
      <div className={`relative aspect-[4/3] overflow-hidden ${imageLoaded || !imageError ? '' : 'bg-gradient-to-br ' + game.color}`}>
        {/* Cover image - PRIMARY visual, full bleed */}
        {!imageError ? (
          <img
            src={game.cover}
            alt={game.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          /* Fallback only if image fails - gradient + icon */
          <>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%),
                               radial-gradient(circle at 70% 80%, rgba(255,255,255,0.15) 0%, transparent 40%)`,
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl drop-shadow-lg" style={{
                textShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.1)',
              }}>{game.icon}</span>
            </div>
          </>
        )}

        {/* Shimmer loading placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        )}

        {/* Gradient overlay for text readability - subtle */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
          <div className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-black/60 backdrop-blur-sm text-slate-200">
            {game.category}
          </div>
          {isMultiplayer ? (
            <div className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-violet-600/90 text-white animate-pulse">
              MULTI
            </div>
          ) : game.badge ? (
            <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold text-white animate-pulse ${
              game.badge === 'NEW' ? 'bg-emerald-500/90' :
              game.badge === 'HOT' ? 'bg-red-500/90' :
              'bg-red-500/90'
            }`}>
              {game.badge}
            </div>
          ) : null}
        </div>

        {/* Game title & info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="text-sm font-black text-white leading-tight drop-shadow-lg">{game.name}</h3>
          <p className="text-[9px] text-slate-300 mt-0.5 line-clamp-1 drop-shadow">{game.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-bold ${game.accent} drop-shadow`}>{game.reward}</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
              {game.rating.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="p-2 flex items-center justify-between bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Users className="w-2.5 h-2.5" />
          <span>{(game.players / 1000).toFixed(1)}K</span>
        </div>
        <div className="flex items-center gap-0.5 text-[10px] text-violet-400 font-bold group-hover:text-violet-300 transition-colors">
          <Play className="w-2.5 h-2.5 fill-violet-400" />
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

  // When a game is selected, render the actual game component
  if (selectedGame) {
    const game = allGames.find((g) => g.id === selectedGame);
    if (game) {
      return <GameView gameId={game.id} onBack={() => setSelectedGame(null)} />;
    }
  }

  return (
    <div className="fade-in space-y-4 pb-4">
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

      {/* Featured Multiplayer Banner */}
      <button
        onClick={() => setSelectedGame('roast-battle')}
        className="w-full rounded-2xl overflow-hidden hover:ring-2 hover:ring-orange-500/30 transition-all group shadow-lg shadow-black/20"
      >
        <div className="relative h-36 md:h-44">
          {/* Digital artwork background */}
          <img
            src={`/api/uploads?path=images/roast-battle-banner.png&v=20260511a`}
            alt="Roast Battle"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-orange-400 tracking-wider uppercase animate-pulse">Multiplayer</span>
              </div>
              <p className="text-xl font-black text-white leading-tight drop-shadow-lg">ROAST BATTLE</p>
              <p className="text-[11px] text-slate-300 drop-shadow">Head-to-head burns with friends +6 ORRA</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-bold group-hover:opacity-90 transition-all shadow-lg shadow-orange-900/40">
              Play &rarr;
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
          {multiGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => setSelectedGame(game.id)}
              isMultiplayer
            />
          ))}
        </div>
      </div>

      {/* Solo Games */}
      <div>
        <h3 className="text-sm font-bold text-white mb-2">Solo Games</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {soloGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => setSelectedGame(game.id)}
            />
          ))}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-violet-400">{allGames.length}</p>
            <p className="text-[10px] text-slate-500">Games</p>
          </div>
          <div>
            <p className="text-lg font-bold text-fuchsia-400">{(allGames.reduce((a, g) => a + g.players, 0) / 1000).toFixed(0)}K</p>
            <p className="text-[10px] text-slate-500">Players</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-400">{(allGames.reduce((a, g) => a + g.rating, 0) / allGames.length).toFixed(2)}</p>
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
