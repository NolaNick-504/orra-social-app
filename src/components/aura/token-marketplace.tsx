'use client';

import { useAuraStore } from '@/store/aura-store';
import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Crown, Sparkles, Rocket, Shield, Palette, Volume2,
  Megaphone, Gift, Star, Lock, Check, Coins, TrendingUp,
  Flame, Moon, Flower2, Sun, PenLine
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// MARKETPLACE ITEMS DEFINITION
// ============================================

interface ColorOption {
  id: string;
  name: string;
  color: string; // Tailwind gradient or hex
  hex: string;   // For the color dot
}

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ElementType;
  category: 'skin' | 'effect' | 'badge' | 'boost' | 'title';
  apiCategory: string; // Maps to Purchase.category in DB
  gradient: string;
  accentColor: string;
  isFounderOnly?: boolean;
  badge?: string;
  colorOptions?: ColorOption[];
}

const SKIN_ITEMS: MarketplaceItem[] = [
  {
    id: 'skin_aurora',
    name: 'Aurora',
    description: 'Shimmering northern lights gradient across your profile',
    cost: 300,
    icon: Sparkles,
    category: 'skin',
    apiCategory: 'Themes',
    gradient: 'from-purple-600 via-blue-500 to-teal-400',
    accentColor: 'text-purple-400',
    colorOptions: [
      { id: 'purple', name: 'Purple Aurora', color: 'from-purple-600 to-blue-500', hex: '#8b5cf6' },
      { id: 'blue', name: 'Blue Aurora', color: 'from-blue-600 to-cyan-400', hex: '#3b82f6' },
      { id: 'teal', name: 'Teal Aurora', color: 'from-teal-500 to-emerald-400', hex: '#14b8a6' },
    ],
  },
  {
    id: 'skin_neon',
    name: 'Neon',
    description: 'Vibrant neon glow that makes your profile pop',
    cost: 300,
    icon: Zap,
    category: 'skin',
    apiCategory: 'Themes',
    gradient: 'from-pink-500 via-cyan-400 to-yellow-400',
    accentColor: 'text-pink-400',
    colorOptions: [
      { id: 'pink', name: 'Neon Pink', color: 'from-pink-500 to-rose-400', hex: '#ec4899' },
      { id: 'cyan', name: 'Neon Cyan', color: 'from-cyan-400 to-blue-400', hex: '#22d3ee' },
      { id: 'yellow', name: 'Neon Yellow', color: 'from-yellow-400 to-amber-400', hex: '#facc15' },
    ],
  },
  {
    id: 'skin_midnight',
    name: 'Midnight',
    description: 'Deep dark elegance with subtle starlight shimmer',
    cost: 350,
    icon: Moon,
    category: 'skin',
    apiCategory: 'Themes',
    gradient: 'from-indigo-900 via-purple-900 to-slate-900',
    accentColor: 'text-indigo-400',
    colorOptions: [
      { id: 'dark_blue', name: 'Dark Blue', color: 'from-indigo-900 to-blue-900', hex: '#312e81' },
      { id: 'dark_purple', name: 'Dark Purple', color: 'from-purple-900 to-violet-900', hex: '#581c87' },
      { id: 'obsidian', name: 'Obsidian', color: 'from-slate-900 to-gray-900', hex: '#0f172a' },
    ],
  },
  {
    id: 'skin_cherry_blossom',
    name: 'Cherry Blossom',
    description: 'Soft pink petals and gentle spring vibes for your profile',
    cost: 350,
    icon: Flower2,
    category: 'skin',
    apiCategory: 'Themes',
    gradient: 'from-pink-300 via-rose-200 to-purple-200',
    accentColor: 'text-pink-300',
    colorOptions: [
      { id: 'pink', name: 'Sakura Pink', color: 'from-pink-300 to-rose-200', hex: '#f9a8d4' },
      { id: 'white', name: 'Petal White', color: 'from-white to-pink-100', hex: '#ffffff' },
      { id: 'lavender', name: 'Lavender', color: 'from-purple-200 to-pink-200', hex: '#ddd6fe' },
    ],
  },
  {
    id: 'skin_fire',
    name: 'Fire',
    description: 'Blazing hot fire effect that turns up the heat on your profile',
    cost: 400,
    icon: Flame,
    category: 'skin',
    apiCategory: 'Themes',
    gradient: 'from-red-600 via-orange-500 to-yellow-400',
    accentColor: 'text-red-400',
    colorOptions: [
      { id: 'red', name: 'Inferno Red', color: 'from-red-600 to-orange-500', hex: '#dc2626' },
      { id: 'orange', name: 'Blaze Orange', color: 'from-orange-500 to-amber-400', hex: '#f97316' },
      { id: 'yellow', name: 'Solar Yellow', color: 'from-yellow-400 to-orange-300', hex: '#facc15' },
    ],
  },
  {
    id: 'skin_gold_founder',
    name: 'Gold Founder',
    description: 'Exclusive 24K gold skin - only for the ORRA Founder',
    cost: 0,
    icon: Crown,
    category: 'skin',
    apiCategory: 'Themes',
    gradient: 'from-yellow-400 via-amber-400 to-yellow-300',
    accentColor: 'text-yellow-400',
    isFounderOnly: true,
    colorOptions: [
      { id: 'gold', name: '24K Gold', color: 'from-yellow-400 to-amber-400', hex: '#fbbf24' },
      { id: 'platinum', name: 'Platinum', color: 'from-gray-200 to-slate-300', hex: '#e2e8f0' },
    ],
  },
];

const EFFECT_ITEMS: MarketplaceItem[] = [
  {
    id: 'effect_neon_glow',
    name: 'Neon Glow',
    description: 'Your username glows with a neon aura across ORRA',
    cost: 250,
    icon: Sparkles,
    category: 'effect',
    apiCategory: 'Effects',
    gradient: 'from-fuchsia-600 to-purple-600',
    accentColor: 'text-fuchsia-400',
    colorOptions: [
      { id: 'purple', name: 'Purple Glow', color: 'from-purple-500 to-violet-500', hex: '#8b5cf6' },
      { id: 'cyan', name: 'Cyan Glow', color: 'from-cyan-400 to-blue-400', hex: '#22d3ee' },
      { id: 'pink', name: 'Pink Glow', color: 'from-pink-400 to-rose-400', hex: '#f472b6' },
    ],
  },
  {
    id: 'effect_rainbow_wave',
    name: 'Rainbow Wave',
    description: 'Your name cycles through a full rainbow color wave',
    cost: 400,
    icon: Palette,
    category: 'effect',
    apiCategory: 'Effects',
    gradient: 'from-red-500 via-yellow-400 to-blue-500',
    accentColor: 'text-yellow-400',
  },
  {
    id: 'effect_fire_glow',
    name: 'Fire Glow',
    description: 'Your name burns with a fiery orange-red glow effect',
    cost: 300,
    icon: Flame,
    category: 'effect',
    apiCategory: 'Effects',
    gradient: 'from-orange-500 to-red-600',
    accentColor: 'text-orange-400',
    colorOptions: [
      { id: 'red', name: 'Red Fire', color: 'from-red-500 to-orange-500', hex: '#ef4444' },
      { id: 'orange', name: 'Orange Fire', color: 'from-orange-500 to-amber-400', hex: '#f97316' },
    ],
  },
  {
    id: 'effect_gold_glow',
    name: 'Gold Glow',
    description: 'Exclusive golden name glow - only for the ORRA Founder',
    cost: 0,
    icon: Crown,
    category: 'effect',
    apiCategory: 'Effects',
    gradient: 'from-yellow-400 to-amber-500',
    accentColor: 'text-yellow-400',
    isFounderOnly: true,
    colorOptions: [
      { id: 'gold', name: 'Gold Glow', color: 'from-yellow-400 to-amber-400', hex: '#fbbf24' },
    ],
  },
];

const BADGE_ITEMS: MarketplaceItem[] = [
  {
    id: 'holographic-badge',
    name: 'Holographic Badge',
    description: 'A shimmering holographic badge on your profile',
    cost: 500,
    icon: Shield,
    category: 'badge',
    apiCategory: 'Badges',
    gradient: 'from-violet-600 to-fuchsia-600',
    accentColor: 'text-violet-400',
    badge: 'POPULAR',
  },
  {
    id: 'badge_fire',
    name: 'Fire Badge',
    description: 'Show your fire with a blazing hot badge on your profile',
    cost: 400,
    icon: Flame,
    category: 'badge',
    apiCategory: 'Badges',
    gradient: 'from-red-500 to-orange-500',
    accentColor: 'text-red-400',
  },
  {
    id: 'badge_star',
    name: 'Star Badge',
    description: 'Shine bright with a golden star badge on your profile',
    cost: 600,
    icon: Star,
    category: 'badge',
    apiCategory: 'Badges',
    gradient: 'from-yellow-500 to-amber-500',
    accentColor: 'text-yellow-400',
    badge: 'NEW',
  },
  {
    id: 'badge_crown',
    name: 'Crown Badge',
    description: 'Exclusive royal crown badge - only for the ORRA Founder',
    cost: 0,
    icon: Crown,
    category: 'badge',
    apiCategory: 'Badges',
    gradient: 'from-yellow-400 to-amber-400',
    accentColor: 'text-yellow-400',
    isFounderOnly: true,
  },
];

const BOOST_ITEMS: MarketplaceItem[] = [
  {
    id: 'post-boost',
    name: 'Post Boost',
    description: 'Push your next post to the top of the Pulse feed for 1 hour',
    cost: 200,
    icon: Rocket,
    category: 'boost',
    apiCategory: 'Boosts',
    gradient: 'from-cyan-600 to-blue-600',
    accentColor: 'text-cyan-400',
  },
  {
    id: 'reach-amplifier',
    name: 'Reach Amplifier',
    description: 'Triple the reach of your next post for 2x engagement',
    cost: 500,
    icon: Megaphone,
    category: 'boost',
    apiCategory: 'Boosts',
    gradient: 'from-emerald-600 to-teal-600',
    accentColor: 'text-emerald-400',
    badge: 'HOT',
  },
  {
    id: 'hub-spotlight',
    name: 'Hub Spotlight',
    description: 'Feature your post in a hub spotlight for 24 hours',
    cost: 350,
    icon: Sun,
    category: 'boost',
    apiCategory: 'Boosts',
    gradient: 'from-teal-600 to-cyan-600',
    accentColor: 'text-teal-400',
  },
];

const TITLE_ITEMS: MarketplaceItem[] = [
  {
    id: 'custom-title',
    name: 'Custom Title',
    description: 'Create a custom title that appears under your name on your profile',
    cost: 750,
    icon: PenLine,
    category: 'title',
    apiCategory: 'Titles',
    gradient: 'from-yellow-500 to-amber-600',
    accentColor: 'text-yellow-400',
    badge: 'PREMIUM',
  },
];

const ALL_ITEMS = [...SKIN_ITEMS, ...EFFECT_ITEMS, ...BADGE_ITEMS, ...BOOST_ITEMS, ...TITLE_ITEMS];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Coins },
  { id: 'skin', label: 'Skins', icon: Palette },
  { id: 'effect', label: 'Effects', icon: Sparkles },
  { id: 'badge', label: 'Badges', icon: Shield },
  { id: 'boost', label: 'Boosts', icon: Rocket },
  { id: 'title', label: 'Titles', icon: PenLine },
];

// ============================================
// TOGGLE SWITCH COMPONENT
// ============================================

function ToggleSwitch({ 
  isOn, 
  onToggle, 
  disabled, 
  isLoading,
  isOwned,
  cost,
  canAfford,
  isFounderOnly,
  isFounder 
}: {
  isOn: boolean;
  onToggle: () => void;
  disabled: boolean;
  isLoading: boolean;
  isOwned: boolean;
  cost: number;
  canAfford: boolean;
  isFounderOnly?: boolean;
  isFounder: boolean;
}) {
  // Founder-only item locked for non-founders
  if (isFounderOnly && !isFounder) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-yellow-500/20">
        <Lock className="w-3.5 h-3.5 text-yellow-400/60" />
        <span className="text-[10px] font-bold text-yellow-400/60">FOUNDER</span>
      </div>
    );
  }

  // Not owned yet - show buy toggle
  if (!isOwned) {
    return (
      <button
        onClick={onToggle}
        disabled={disabled || !canAfford || isLoading}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          isLoading
            ? 'bg-white/10 text-white/50 cursor-wait'
            : canAfford
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/30 active:scale-95'
              : 'bg-white/5 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Zap className="w-3 h-3" />
            {cost}
          </>
        )}
      </button>
    );
  }

  // Owned - show activate/deactivate toggle
  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={`relative w-12 h-7 rounded-full transition-all duration-200 active:scale-95 ${
        isLoading 
          ? 'bg-white/10 cursor-wait' 
          : isOn 
            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30' 
            : 'bg-white/10 hover:bg-white/15'
      }`}
    >
      <div
        className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-200 ${
          isLoading
            ? 'left-1 bg-white/30'
            : isOn
              ? 'left-6 bg-white shadow-sm'
              : 'left-1 bg-white/40'
        }`}
      />
    </button>
  );
}

// ============================================
// MARKETPLACE ITEM CARD
// ============================================

function MarketplaceItemCard({ 
  item, 
  isOwned, 
  isActive, 
  selectedOption, 
  auraTokens, 
  isFounder,
  onBuy,
  onToggle,
  onChangeOption 
}: {
  item: MarketplaceItem;
  isOwned: boolean;
  isActive: boolean;
  selectedOption: string;
  auraTokens: number;
  isFounder: boolean;
  onBuy: (item: MarketplaceItem, option?: string) => void;
  onToggle: (item: MarketplaceItem, active: boolean, option?: string) => void;
  onChangeOption: (itemId: string, option: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const ItemIcon = item.icon;
  const canAfford = auraTokens >= item.cost;

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (!isOwned) {
        // Buy the item
        await onBuy(item, selectedOption || item.colorOptions?.[0]?.id);
      } else {
        // Toggle activate/deactivate
        await onToggle(item, !isActive, selectedOption);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-4 transition-all ${
      isActive ? 'border border-violet-500/40 bg-violet-500/5' : 
      isOwned ? 'border border-emerald-500/20 bg-emerald-500/5' : 
      'hover:border-white/10'
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 ${
          isFounderOnly && !isFounder ? 'opacity-30' : ''
        }`}>
          {isFounderOnly && !isFounder ? (
            <Lock className="w-6 h-6 text-white/60" />
          ) : isOwned && !isActive ? (
            <ItemIcon className="w-6 h-6 text-white/50" />
          ) : (
            <ItemIcon className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white truncate">{item.name}</p>
            {item.badge && (
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold ${
                item.badge === 'NEW' ? 'bg-emerald-500/20 text-emerald-400' :
                item.badge === 'HOT' ? 'bg-red-500/20 text-red-400' :
                item.badge === 'POPULAR' ? 'bg-violet-500/20 text-violet-400' :
                item.badge === 'PREMIUM' ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {item.badge}
              </span>
            )}
            {isFounderOnly && isFounder && (
              <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-yellow-500/20 text-yellow-400">
                FOUNDER
              </span>
            )}
            {isOwned && (
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold ${
                isActive ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {isActive ? 'ACTIVE' : 'OWNED'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
        </div>

        {/* Toggle */}
        <ToggleSwitch
          isOn={isActive}
          onToggle={handleToggle}
          disabled={isFounderOnly && !isFounder}
          isLoading={isLoading}
          isOwned={isOwned}
          cost={item.cost}
          canAfford={canAfford}
          isFounderOnly={item.isFounderOnly}
          isFounder={isFounder}
        />
      </div>

      {/* Color Options */}
      {item.colorOptions && item.colorOptions.length > 0 && !(item.isFounderOnly && !isFounder) && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Color</span>
            <div className="flex items-center gap-1.5">
              {item.colorOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (isOwned) {
                      onToggle(item, true, option.id);
                    } else {
                      onChangeOption(item.id, option.id);
                    }
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                    selectedOption === option.id
                      ? 'border-white shadow-lg scale-110'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: option.hex }}
                  title={option.name}
                />
              ))}
            </div>
            {selectedOption && item.colorOptions.find(o => o.id === selectedOption) && (
              <span className="text-[10px] text-slate-500 ml-1">
                {item.colorOptions.find(o => o.id === selectedOption)!.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Skin preview bar */}
      {item.category === 'skin' && !(item.isFounderOnly && !isFounder) && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className={`h-2 rounded-full bg-gradient-to-r ${
            selectedOption && item.colorOptions?.find(o => o.id === selectedOption)
              ? item.colorOptions.find(o => o.id === selectedOption)!.color
              : item.gradient
          } opacity-60`} />
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN MARKETPLACE COMPONENT
// ============================================

interface PurchaseData {
  itemId: string;
  category: string;
  name: string;
  cost: number;
  isActive: boolean;
  selectedOption: string;
}

export function TokenMarketplace() {
  const { auraTokens, currentUserId } = useAuraStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [isFounder, setIsFounder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Fetch user's purchases from the API
  const fetchPurchases = useCallback(async () => {
    try {
      const res = await fetch('/api/purchases');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPurchases(data.data.purchases);
          setIsFounder(data.data.isFounder || false);
          // Initialize selected options from purchases
          const opts: Record<string, string> = {};
          data.data.purchases.forEach((p: PurchaseData) => {
            if (p.selectedOption) opts[p.itemId] = p.selectedOption;
          });
          // Default first color option for items with colors
          ALL_ITEMS.forEach(item => {
            if (!opts[item.id] && item.colorOptions?.[0]) {
              opts[item.id] = item.colorOptions[0].id;
            }
          });
          setSelectedOptions(opts);
          // Update local aura tokens from server
          if (typeof data.data.auraTokens === 'number') {
            useAuraStore.setState({ auraTokens: data.data.auraTokens });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const filteredItems = activeCategory === 'all'
    ? ALL_ITEMS
    : ALL_ITEMS.filter(item => item.category === activeCategory);

  const handleBuy = async (item: MarketplaceItem, option?: string) => {
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          category: item.apiCategory,
          name: item.name,
          cost: item.cost,
          selectedOption: option || selectedOptions[item.id] || '',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Purchase failed');
        return;
      }

      toast.success(`Purchased ${item.name}! -${item.cost} ORRA`, { duration: 2000 });
      await fetchPurchases();
    } catch (err) {
      console.error('Buy error:', err);
      toast.error('Purchase failed. Please try again.');
    }
  };

  const handleToggle = async (item: MarketplaceItem, active: boolean, option?: string) => {
    try {
      const res = await fetch('/api/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          isActive: active,
          selectedOption: option || selectedOptions[item.id] || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Toggle failed');
        return;
      }

      if (active) {
        toast.success(`${item.name} activated!`, { duration: 1500 });
      } else {
        toast.info(`${item.name} deactivated`, { duration: 1500 });
      }
      await fetchPurchases();
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Toggle failed. Please try again.');
    }
  };

  const handleChangeOption = (itemId: string, option: string) => {
    setSelectedOptions(prev => ({ ...prev, [itemId]: option }));
  };

  if (isLoading) {
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-40 bg-white/5 rounded animate-pulse mt-1" />
            </div>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-panel rounded-2xl p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

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
            <p className="text-xs text-slate-500">Toggle to buy & activate items</p>
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

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const purchase = purchases.find(p => p.itemId === item.id);
          const isOwned = !!purchase;
          const isActive = purchase?.isActive || false;
          const currentOption = purchase?.selectedOption || selectedOptions[item.id] || item.colorOptions?.[0]?.id || '';

          return (
            <MarketplaceItemCard
              key={item.id}
              item={item}
              isOwned={isOwned}
              isActive={isActive}
              selectedOption={currentOption}
              auraTokens={auraTokens}
              isFounder={isFounder}
              onBuy={handleBuy}
              onToggle={handleToggle}
              onChangeOption={handleChangeOption}
            />
          );
        })}
      </div>

      {/* Founder Items Notice */}
      {!isFounder && (
        <div className="glass-panel rounded-2xl p-4 border border-yellow-500/20 text-center">
          <Crown className="w-6 h-6 text-yellow-400/50 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-300">Founder-Exclusive Items</p>
          <p className="text-xs text-slate-500 mt-1">Gold skins and effects are reserved for the ORRA Founder</p>
        </div>
      )}

      {/* Coming Soon */}
      <div className="glass-panel rounded-2xl p-4 border border-dashed border-white/10 text-center">
        <Lock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-300">More Items Coming Soon</p>
        <p className="text-xs text-slate-500 mt-1">Digital art, beats, AR filters, and more are on the way</p>
      </div>
    </div>
  );
}
