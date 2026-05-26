'use client';

import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { useQuery } from '@tanstack/react-query';
import { GameBackground } from '@/components/aura/game-background';
import {
  Coins, Palette, Award, Zap, Trophy, Gift, Lock, Sparkles, Star,
  Flame, Crown, Shield, Heart, Eye, Rocket, Check, Users, TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// ============================================
// SHOP ITEM DEFINITIONS
// ============================================

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ElementType;
  gradient: string;
  category: string;
  oneTime: boolean; // Can only be purchased once
}

const SHOP_ITEMS: ShopItem[] = [
  // 1. Tip Creators
  {
    id: 'tip_5',
    name: 'Tip 5 ORRA',
    description: 'Show appreciation to any creator by sending them 5 ORRA tokens directly. Tips help support the content you love.',
    cost: 5,
    icon: Heart,
    gradient: 'from-pink-600 to-rose-500',
    category: 'Social',
    oneTime: false,
  },
  {
    id: 'tip_10',
    name: 'Tip 10 ORRA',
    description: 'Send a bigger tip to creators whose content really moves you. A great way to say "this is amazing!"',
    cost: 10,
    icon: Heart,
    gradient: 'from-pink-600 to-rose-500',
    category: 'Social',
    oneTime: false,
  },
  {
    id: 'tip_25',
    name: 'Tip 25 ORRA',
    description: 'The ultimate tip for outstanding content. Creators will definitely notice your generosity!',
    cost: 25,
    icon: Crown,
    gradient: 'from-pink-600 to-rose-500',
    category: 'Social',
    oneTime: false,
  },

  // 2. Boost Post
  {
    id: 'boost_small',
    name: 'Boost Post',
    description: 'Push your post to the top of the Pulse feed for 1 hour. Get more eyes on your best content and increase your engagement.',
    cost: 15,
    icon: Rocket,
    gradient: 'from-blue-600 to-cyan-500',
    category: 'Visibility',
    oneTime: false,
  },
  {
    id: 'boost_mega',
    name: 'Mega Boost',
    description: 'Supercharge your post visibility for 6 hours with priority placement. Your content gets seen by everyone on ORRA.',
    cost: 40,
    icon: TrendingUp,
    gradient: 'from-blue-600 to-cyan-500',
    category: 'Visibility',
    oneTime: false,
  },

  // 3. Custom Profile Themes
  {
    id: 'theme_aurora',
    name: 'Aurora Theme',
    description: 'Transform your profile with a stunning aurora borealis color scheme. Northern lights dance across your profile header.',
    cost: 30,
    icon: Palette,
    gradient: 'from-emerald-600 to-teal-400',
    category: 'Themes',
    oneTime: true,
  },
  {
    id: 'theme_neon',
    name: 'Neon Nights Theme',
    description: 'Electric neon glow effects for your profile. Stand out with vibrant pink, blue, and purple neon accents.',
    cost: 30,
    icon: Palette,
    gradient: 'from-violet-600 to-fuchsia-500',
    category: 'Themes',
    oneTime: true,
  },
  {
    id: 'theme_gold',
    name: 'Golden Era Theme',
    description: 'Luxurious gold and amber profile styling. Show everyone you have premium taste with this elegant theme.',
    cost: 50,
    icon: Palette,
    gradient: 'from-amber-500 to-yellow-400',
    category: 'Themes',
    oneTime: true,
  },
  {
    id: 'theme_midnight',
    name: 'Midnight Theme',
    description: 'Deep midnight blue with starlight accents. A dark, sophisticated look for the mysterious ORRA user.',
    cost: 30,
    icon: Palette,
    gradient: 'from-indigo-800 to-slate-900',
    category: 'Themes',
    oneTime: true,
  },

  // 4. Exclusive Badges
  {
    id: 'badge_early',
    name: 'Early Adopter Badge',
    description: 'Show the world you were here from the start. This exclusive badge proves you are an ORRA pioneer.',
    cost: 20,
    icon: Award,
    gradient: 'from-amber-600 to-yellow-500',
    category: 'Badges',
    oneTime: true,
  },
  {
    id: 'badge_supporter',
    name: 'Token Supporter Badge',
    description: 'Display your commitment to the ORRA ecosystem. This badge shows you invest in the community.',
    cost: 35,
    icon: Shield,
    gradient: 'from-blue-600 to-indigo-500',
    category: 'Badges',
    oneTime: true,
  },
  {
    id: 'badge_legend',
    name: 'Legend Badge',
    description: 'The most prestigious badge on ORRA. Only true legends wear this mark of excellence and dedication.',
    cost: 75,
    icon: Crown,
    gradient: 'from-fuchsia-600 to-pink-500',
    category: 'Badges',
    oneTime: true,
  },
  {
    id: 'badge_fire',
    name: 'Fire Starter Badge',
    description: 'For those who bring the heat. This blazing badge shows you always bring energy to the platform.',
    cost: 25,
    icon: Flame,
    gradient: 'from-red-600 to-orange-500',
    category: 'Badges',
    oneTime: true,
  },

  // 5. Dance Off Premium Entry
  {
    id: 'premium_dance',
    name: 'Premium Dance Entry',
    description: 'Enter the Dance Off premium bracket with double voting power and a guaranteed featured spot. Stand out in the competition!',
    cost: 50,
    icon: Trophy,
    gradient: 'from-yellow-600 to-amber-500',
    category: 'Dance Off',
    oneTime: true,
  },

  // 6. Gift Tokens
  {
    id: 'gift_10',
    name: 'Gift 10 ORRA',
    description: 'Send 10 ORRA tokens to a friend through DM. The perfect way to welcome someone new or celebrate together.',
    cost: 10,
    icon: Gift,
    gradient: 'from-emerald-600 to-green-500',
    category: 'Social',
    oneTime: false,
  },
  {
    id: 'gift_25',
    name: 'Gift 25 ORRA',
    description: 'A generous gift of 25 ORRA tokens for a friend. Spread the love and help others earn their way.',
    cost: 25,
    icon: Gift,
    gradient: 'from-emerald-600 to-green-500',
    category: 'Social',
    oneTime: false,
  },

  // 7. Unlock Premium Content
  {
    id: 'unlock_content',
    name: 'Content Unlock Pass',
    description: 'Unlock one piece of premium or exclusive content on ORRA. Access behind-the-scenes posts, exclusive tutorials, and more.',
    cost: 10,
    icon: Lock,
    gradient: 'from-purple-600 to-violet-500',
    category: 'Content',
    oneTime: false,
  },

  // 8. Super Reactions
  {
    id: 'super_reaction',
    name: 'Super Reaction',
    description: 'Leave an animated Super Reaction on any post. Your reaction will glow and stand out with special effects that everyone notices.',
    cost: 5,
    icon: Sparkles,
    gradient: 'from-yellow-500 to-orange-400',
    category: 'Reactions',
    oneTime: false,
  },
  {
    id: 'super_reaction_5',
    name: '5 Super Reactions',
    description: 'A pack of 5 Super Reactions at a discounted price. Spread the love with animated effects on multiple posts.',
    cost: 20,
    icon: Star,
    gradient: 'from-yellow-500 to-orange-400',
    category: 'Reactions',
    oneTime: false,
  },

  // 9. Name Effect
  {
    id: 'name_glow',
    name: 'Glow Name Effect',
    description: 'Make your username glow with a vibrant aura effect. Your name will shine across all of ORRA.',
    cost: 25,
    icon: Zap,
    gradient: 'from-violet-600 to-purple-500',
    category: 'Effects',
    oneTime: true,
  },
  {
    id: 'name_rainbow',
    name: 'Rainbow Name Effect',
    description: 'A stunning rainbow gradient flows across your username. The most eye-catching name effect on ORRA.',
    cost: 40,
    icon: Zap,
    gradient: 'from-pink-500 via-yellow-400 to-cyan-400',
    category: 'Effects',
    oneTime: true,
  },
  {
    id: 'name_fire',
    name: 'Fire Name Effect',
    description: 'Your name burns with an animated fire effect. Show everyone you bring the heat to every conversation.',
    cost: 35,
    icon: Flame,
    gradient: 'from-red-600 to-orange-400',
    category: 'Effects',
    oneTime: true,
  },
];

const CATEGORIES = ['All', 'Social', 'Visibility', 'Themes', 'Badges', 'Dance Off', 'Content', 'Reactions', 'Effects'];

export function TokenShop() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const {
    auraTokens, auraLevel, purchasedThemes, purchasedBadges,
    purchasedNameEffects, premiumDanceEntry, purchaseTheme, purchaseBadge,
    purchaseNameEffect, purchasePremiumDanceEntry, tipUser, giftTokens,
    boostPost, addSuperReaction, unlockContent,
    activeTheme, activeNameEffect, setActiveTheme, setActiveNameEffect
  } = useAuraStore();
  const currentUser = useCurrentUser();

  // Fetch users for tip/gift targets
  const { data: usersData, isError: usersError } = useQuery({
    queryKey: ['shop-users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data as Array<{ id: string; name: string; handle: string; avatar: string }>;
    },
    staleTime: 60000,
  });

  const [tipTarget, setTipTarget] = useState<string | null>(null);
  const [giftTarget, setGiftTarget] = useState<string | null>(null);
  const [boostTargetPost, setBoostTargetPost] = useState<string>('');

  // Filter items by category
  const filteredItems = activeCategory === 'All'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.category === activeCategory);

  // Check if item is already purchased (one-time items)
  const isOwned = (item: ShopItem): boolean => {
    if (!item.oneTime) return false;
    if (item.category === 'Themes') return purchasedThemes.has(item.id);
    if (item.category === 'Badges') return purchasedBadges.has(item.id);
    if (item.category === 'Effects') return purchasedNameEffects.has(item.id);
    if (item.id === 'premium_dance') return premiumDanceEntry;
    return false;
  };

  // Handle purchase
  const handlePurchase = (item: ShopItem) => {
    if (auraTokens < item.cost) {
      toast.error('Not enough ORRA tokens!', { duration: 2000 });
      return;
    }

    setPurchasing(item.id);

    try {
      let success = false;

      switch (item.category) {
        case 'Themes':
          success = purchaseTheme(item.id, item.cost);
          break;
        case 'Badges':
          success = purchaseBadge(item.id, item.name.replace(' Badge', ''), item.cost);
          break;
        case 'Effects':
          success = purchaseNameEffect(item.id, item.cost);
          break;
        case 'Dance Off':
          if (item.id === 'premium_dance') {
            success = purchasePremiumDanceEntry(item.cost);
          }
          break;
        case 'Social': {
          // For tips and gifts, we need a target
          if (item.id.startsWith('tip_')) {
            if (tipTarget) {
              success = tipUser(tipTarget, item.cost);
              if (success) toast.success(`Tipped ${item.cost} ORRA tokens!`, { duration: 2000 });
            } else {
              toast.error('Select a user to tip first', { duration: 2000 });
              setPurchasing(null);
              return;
            }
          } else if (item.id.startsWith('gift_')) {
            if (giftTarget) {
              success = giftTokens(giftTarget, item.cost);
              if (success) toast.success(`Gifted ${item.cost} ORRA tokens!`, { duration: 2000 });
            } else {
              toast.error('Select a friend to gift first', { duration: 2000 });
              setPurchasing(null);
              return;
            }
          }
          break;
        }
        case 'Visibility': {
          const postId = boostTargetPost || `boost-${Date.now()}`;
          success = boostPost(postId, item.cost);
          if (success) toast.success('Post boosted!', { duration: 2000 });
          break;
        }
        case 'Content':
          success = unlockContent(`content-${Date.now()}`, item.cost);
          if (success) toast.success('Premium content unlocked!', { duration: 2000 });
          break;
        case 'Reactions':
          success = addSuperReaction(`reaction-${Date.now()}`, item.cost);
          if (success) toast.success('Super Reaction ready!', { duration: 2000 });
          break;
      }

      if (success) {
        // Only show generic toast for categories that don't have a custom toast already
        if (!['Social', 'Visibility', 'Content', 'Reactions'].includes(item.category)) {
          toast.success(`${item.name} purchased! -${item.cost} ORRA`, { duration: 2500 });
        }
      } else if (item.category !== 'Social') {
        toast.error('Purchase failed. You may already own this item.', { duration: 2000 });
      }
    } catch {
      toast.error('Something went wrong', { duration: 2000 });
    } finally {
      setPurchasing(null);
    }
  };

  const otherUsers = (usersData || []).filter(u => u.id !== currentUser.id).slice(0, 8);

  return (
    <div className="fade-in space-y-6 pb-4 relative game-view overflow-hidden">
      {/* Animated Game Background */}
      <GameBackground accentColor="amber" intensity={0.4} />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-fuchsia-600/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Coins className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">ORRA Shop</h1>
              <p className="text-sm text-slate-400">Spend your tokens on real actions</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-black text-yellow-400">{auraTokens.toLocaleString()}</span>
              <span className="text-xs text-yellow-400/60">ORRA</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Zap className="w-5 h-5 text-violet-400" />
              <span className="text-lg font-black text-violet-400">Lvl {auraLevel}</span>
            </div>
            <div className="flex-1" />
            <div className="text-xs text-slate-500 text-right">
              <p>Earn more by engaging</p>
              <p className="text-slate-600">Like, comment, post, share</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Tip & Gift User Selector */}
      <div className="glass-panel rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" /> Quick Actions
        </h3>
        {usersError ? (
          <p className="text-xs text-red-400 text-center py-2">Failed to load users. Please refresh.</p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tip selector */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Tip a creator</label>
            <select
              value={tipTarget || ''}
              onChange={(e) => setTipTarget(e.target.value || null)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="">Select user...</option>
              {otherUsers.map(u => (
                <option key={u.id} value={u.id} className="bg-[#0a0a0a]">{u.name}</option>
              ))}
            </select>
          </div>
          {/* Gift selector */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">Gift to a friend</label>
            <select
              value={giftTarget || ''}
              onChange={(e) => setGiftTarget(e.target.value || null)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="">Select friend...</option>
              {otherUsers.map(u => (
                <option key={u.id} value={u.id} className="bg-[#0a0a0a]">{u.name}</option>
              ))}
            </select>
          </div>
        </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const owned = isOwned(item);
          const canAfford = auraTokens >= item.cost;
          const isPurchasing = purchasing === item.id;

          return (
            <div
              key={item.id}
              className={`relative glass-panel rounded-2xl overflow-hidden group transition-all hover:border-violet-500/30 ${
                owned ? 'opacity-60' : ''
              }`}
            >
              {/* Gradient top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${item.gradient}`} />

              <div className="p-4">
                {/* Icon + Cost */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-400">{item.cost}</span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-3">{item.description}</p>

                {/* Category tag */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-medium">{item.category}</span>
                  {item.oneTime && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">One-time</span>
                  )}
                </div>

                {/* Buy button */}
                {owned ? (
                  item.category === 'Themes' ? (
                    activeTheme === item.id ? (
                      <button
                        onClick={() => setActiveTheme(null)}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-semibold hover:bg-violet-600/30 transition-all"
                      >
                        <Sparkles className="w-4 h-4" /> Active
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTheme(item.id)}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-600/20 transition-all"
                      >
                        <Check className="w-4 h-4" /> Activate
                      </button>
                    )
                  ) : item.category === 'Effects' ? (
                    activeNameEffect === item.id ? (
                      <button
                        onClick={() => setActiveNameEffect(null)}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-semibold hover:bg-violet-600/30 transition-all"
                      >
                        <Sparkles className="w-4 h-4" /> Active
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveNameEffect(item.id)}
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-600/20 transition-all"
                      >
                        <Check className="w-4 h-4" /> Activate
                      </button>
                    )
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                      <Check className="w-4 h-4" /> Owned
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || isPurchasing}
                    className={`w-full py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      canAfford
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 shadow-md shadow-violet-500/20'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                    } ${isPurchasing ? 'opacity-70' : ''}`}
                  >
                    {isPurchasing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : canAfford ? (
                      <>
                        <Coins className="w-3.5 h-3.5" />
                        Buy for {item.cost} ORRA
                      </>
                    ) : (
                      `Need ${item.cost - auraTokens} more`
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* My Purchases Summary */}
      {(purchasedThemes.size > 0 || purchasedBadges.size > 0 || purchasedNameEffects.size > 0 || premiumDanceEntry) && (
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" /> My Purchases
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(purchasedThemes).map(id => {
              const item = SHOP_ITEMS.find(i => i.id === id);
              return item ? (
                <span key={id} className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${item.gradient} text-white`}>
                  {item.name}
                </span>
              ) : null;
            })}
            {Array.from(purchasedBadges).map(id => {
              const item = SHOP_ITEMS.find(i => i.id === id);
              return item ? (
                <span key={id} className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${item.gradient} text-white`}>
                  {item.name}
                </span>
              ) : null;
            })}
            {Array.from(purchasedNameEffects).map(id => {
              const item = SHOP_ITEMS.find(i => i.id === id);
              return item ? (
                <span key={id} className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${item.gradient} text-white`}>
                  {item.name}
                </span>
              ) : null;
            })}
            {premiumDanceEntry && (
              <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-yellow-600 to-amber-500 text-white">
                Premium Dance Entry
              </span>
            )}
          </div>
        </div>
      )}

      {/* Earn More Tokens */}
      <div className="glass-panel rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" /> Earn More ORRA
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { action: 'Like a post', reward: '+1', icon: Heart },
            { action: 'Like a reel', reward: '+1', icon: Eye },
            { action: 'Comment', reward: '+2', icon: Sparkles },
            { action: 'Follow someone', reward: '+2', icon: Users },
            { action: 'Repost', reward: '+2', icon: Rocket },
            { action: 'Share via DM', reward: '+2', icon: Gift },
            { action: 'Create post', reward: '+5', icon: Zap },
            { action: 'Send a message', reward: '+1', icon: TrendingUp },
            { action: 'Join a hub', reward: '+5', icon: Trophy },
            { action: 'Daily streak', reward: '+5', icon: Flame },
            { action: 'Watch a reel', reward: '+1', icon: Star },
          ].map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                <Icon className="w-4 h-4 text-violet-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">{tip.action}</p>
                  <p className="text-xs font-bold text-yellow-400">{tip.reward}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
