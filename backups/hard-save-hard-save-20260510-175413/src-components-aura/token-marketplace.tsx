'use client';

import { useAuraStore } from '@/store/aura-store';
import { useState } from 'react';
import {
  Zap, Crown, Sparkles, Rocket, Shield, Palette, Volume2,
  Megaphone, Gift, Star, Lock, Check, ChevronRight, Coins, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ElementType;
  category: 'filter' | 'boost' | 'profile' | 'content' | 'social';
  color: string;
  accentColor: string;
  badge?: string;
  purchased?: boolean;
}

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  // Profile Enhancements
  {
    id: 'holographic-badge',
    name: 'Holographic Badge',
    description: 'A shimmering holographic badge on your profile that catches the eye',
    cost: 500,
    icon: Crown,
    category: 'profile',
    color: 'from-violet-600 to-fuchsia-600',
    accentColor: 'text-violet-400',
    badge: 'POPULAR',
  },
  {
    id: 'neon-name-glow',
    name: 'Neon Name Glow',
    description: 'Your username glows with a neon purple aura across ORRA',
    cost: 300,
    icon: Sparkles,
    category: 'profile',
    color: 'from-fuchsia-600 to-pink-600',
    accentColor: 'text-fuchsia-400',
  },
  {
    id: 'animated-cover',
    name: 'Animated Cover',
    description: 'Set an animated gradient as your profile cover image',
    cost: 400,
    icon: Palette,
    category: 'profile',
    color: 'from-amber-600 to-orange-600',
    accentColor: 'text-amber-400',
  },
  {
    id: 'custom-title',
    name: 'Custom Title',
    description: 'Create a custom title that appears under your name (e.g., "Vibe Architect")',
    cost: 750,
    icon: Star,
    category: 'profile',
    color: 'from-yellow-500 to-amber-600',
    accentColor: 'text-yellow-400',
    badge: 'NEW',
  },
  // Content Boosts
  {
    id: 'post-boost',
    name: 'Post Boost',
    description: 'Push your next post to the top of the Pulse feed for 1 hour',
    cost: 200,
    icon: Rocket,
    category: 'boost',
    color: 'from-cyan-600 to-blue-600',
    accentColor: 'text-cyan-400',
  },
  {
    id: 'reach-amplifier',
    name: 'Reach Amplifier',
    description: 'Triple the reach of your next post for 2x engagement',
    cost: 500,
    icon: Megaphone,
    category: 'boost',
    color: 'from-emerald-600 to-teal-600',
    accentColor: 'text-emerald-400',
    badge: 'HOT',
  },
  {
    id: 'hub-spotlight',
    name: 'Hub Spotlight',
    description: 'Feature your post in a hub spotlight for 24 hours',
    cost: 350,
    icon: Shield,
    category: 'boost',
    color: 'from-teal-600 to-cyan-600',
    accentColor: 'text-teal-400',
  },
  // Premium Filters
  {
    id: 'synthwave-filter',
    name: 'Synthwave Filter',
    description: 'Apply retro synthwave aesthetics to your photos and reels',
    cost: 150,
    icon: Palette,
    category: 'filter',
    color: 'from-pink-600 to-rose-600',
    accentColor: 'text-pink-400',
  },
  {
    id: 'holographic-filter',
    name: 'Holographic FX',
    description: 'Add holographic rainbow shimmer to your content',
    cost: 200,
    icon: Sparkles,
    category: 'filter',
    color: 'from-violet-600 to-indigo-600',
    accentColor: 'text-violet-400',
  },
  {
    id: 'glitch-filter',
    name: 'Glitch Art',
    description: 'Cyberpunk glitch distortion for your photos and videos',
    cost: 150,
    icon: Zap,
    category: 'filter',
    color: 'from-red-600 to-orange-600',
    accentColor: 'text-red-400',
  },
  // Social Powers
  {
    id: 'super-echo',
    name: 'Super Echo',
    description: 'Your next Echo (repost) includes a custom comment and reaches 2x people',
    cost: 100,
    icon: Volume2,
    category: 'social',
    color: 'from-indigo-600 to-violet-600',
    accentColor: 'text-indigo-400',
  },
  {
    id: 'gift-tokens',
    name: 'Gift Tokens',
    description: 'Send 50 ORRA tokens to a friend as a gift with a custom message',
    cost: 60,
    icon: Gift,
    category: 'social',
    color: 'from-rose-600 to-pink-600',
    accentColor: 'text-rose-400',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: Coins },
  { id: 'profile', label: 'Profile', icon: Crown },
  { id: 'boost', label: 'Boosts', icon: Rocket },
  { id: 'filter', label: 'Filters', icon: Palette },
  { id: 'social', label: 'Social', icon: Gift },
];

export function TokenMarketplace() {
  const { auraTokens } = useAuraStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());

  const filteredItems = activeCategory === 'all'
    ? MARKETPLACE_ITEMS
    : MARKETPLACE_ITEMS.filter((item) => item.category === activeCategory);

  const handlePurchase = (item: MarketplaceItem) => {
    if (purchasedItems.has(item.id)) {
      toast.info('You already own this item!');
      return;
    }

    if (auraTokens < item.cost) {
      toast.error(`Not enough ORRA tokens! You need ${item.cost - auraTokens} more.`);
      return;
    }

    // Deduct tokens
    useAuraStore.setState((s) => ({ auraTokens: s.auraTokens - item.cost }));
    setPurchasedItems((prev) => new Set([...prev, item.id]));
    toast.success(`Purchased ${item.name}! -${item.cost} ORRA`, { duration: 3000 });
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ORRA Market</h2>
            <p className="text-xs text-slate-500">Spend tokens on premium features</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">{auraTokens.toLocaleString()}</span>
        </div>
      </div>

      {/* Token Earning Guide */}
      <div className="glass-panel rounded-2xl p-4 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white">How to Earn More</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Like a post: <strong className="text-yellow-400">+1</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Comment: <strong className="text-yellow-400">+2</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Follow someone: <strong className="text-yellow-400">+2</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Daily streak: <strong className="text-yellow-400">+5</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Play games: <strong className="text-yellow-400">+3-5</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Chat with Prism: <strong className="text-yellow-400">+1</strong></span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <CatIcon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const ItemIcon = item.icon;
          const owned = purchasedItems.has(item.id);
          const canAfford = auraTokens >= item.cost;

          return (
            <div
              key={item.id}
              className={`glass-panel rounded-2xl p-4 flex items-center gap-3 transition-all ${
                owned ? 'border border-emerald-500/30 bg-emerald-500/5' : 'hover:border-violet-500/20'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 ${
                owned ? 'opacity-50' : ''
              }`}>
                {owned ? <Check className="w-6 h-6 text-white" /> : <ItemIcon className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">{item.name}</p>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold ${
                      item.badge === 'NEW' ? 'bg-emerald-500/20 text-emerald-400' :
                      item.badge === 'HOT' ? 'bg-red-500/20 text-red-400' :
                      'bg-violet-500/20 text-violet-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
              </div>
              <button
                onClick={() => handlePurchase(item)}
                disabled={owned || !canAfford}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  owned
                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                    : canAfford
                      ? `bg-gradient-to-r ${item.color} text-white hover:opacity-90`
                      : 'bg-white/5 text-slate-500 cursor-not-allowed'
                }`}
              >
                {owned ? (
                  'Owned'
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    {item.cost}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Coming Soon */}
      <div className="glass-panel rounded-2xl p-4 border border-dashed border-white/10 text-center">
        <Lock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-300">More Items Coming Soon</p>
        <p className="text-xs text-slate-500 mt-1">Digital art, beats, AR filters, and more are on the way</p>
      </div>
    </div>
  );
}
