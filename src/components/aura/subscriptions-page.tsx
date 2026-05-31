'use client';

import {
  Crown,
  Plus,
  X,
  Loader2,
  Coins,
  Star,
  Users,
  Sparkles,
  Calendar,
  UserMinus,
  TrendingUp,
  Gift,
} from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl, timeAgo } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TierInfo {
  id: string;
  tierName: string;
  price: number;
  description: string;
  perks: string;
  isActive: boolean;
}

interface SubscriptionItem {
  id: string;
  subscriberId: string;
  creatorId: string;
  tierId: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
  subscriber?: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
  tier?: {
    id: string;
    tierName: string;
    price: number;
    perks: string;
  };
}

// ─── Main Subscriptions Page ────────────────────────────────────────────────

export function SubscriptionsPage() {
  const { auraTokens, setAuraTokens } = useAuraStore();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'creator'>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriptionItem[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);

  // Creator studio state
  const [creatorTier, setCreatorTier] = useState<TierInfo | null>(null);
  const [tierForm, setTierForm] = useState({ tierName: 'Exclusive', price: 50, description: '', perks: '' });
  const [savingTier, setSavingTier] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.data?.subscribedTo || []);
        setSubscribers(data.data?.subscribers || []);
        setSubscriberCount(data.data?.subscriberCount || 0);
      } else {
        setError(data.error || 'Failed to load subscriptions');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCreatorTier = useCallback(async () => {
    try {
      const res = await fetch('/api/subscriber-tiers');
      const data = await res.json();
      if (data.success && data.data) {
        setCreatorTier(data.data);
        setTierForm({
          tierName: data.data.tierName || 'Exclusive',
          price: data.data.price || 50,
          description: data.data.description || '',
          perks: Array.isArray(data.data.perks) ? data.data.perks.join(', ') : data.data.perks || '',
        });
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    fetchCreatorTier();
  }, [fetchSubscriptions, fetchCreatorTier]);

  const handleUnsubscribe = async (subscriptionId: string) => {
    setUnsubscribingId(subscriptionId);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === subscriptionId ? { ...s, isActive: false } : s)).filter((s) => s.isActive)
        );
        const refund = data.data?.refundAmount || 0;
        if (refund > 0) {
          setAuraTokens(auraTokens + refund);
        }
        toast.success(data.data?.message || 'Unsubscribed successfully');
      } else {
        toast.error(data.error || 'Failed to unsubscribe');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setUnsubscribingId(null);
    }
  };

  const handleSaveTier = async () => {
    setSavingTier(true);
    try {
      const perksArray = tierForm.perks
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await fetch('/api/subscriber-tiers', {
        method: creatorTier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierName: tierForm.tierName,
          price: tierForm.price,
          description: tierForm.description,
          perks: JSON.stringify(perksArray),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(creatorTier ? 'Tier updated!' : 'Tier created! 🎉');
        fetchCreatorTier();
      } else {
        toast.error(data.error || 'Failed to save tier');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingTier(false);
    }
  };

  const formatExpiry = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = d.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Revenue estimate (simple: subscriberCount * tier price)
  const monthlyRevenue = subscriberCount * (creatorTier?.price || 0);

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Subscribe</h2>
        </div>
        <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
          <Coins className="w-3 h-3" />
          {auraTokens.toLocaleString()} ORRA
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'subscriptions'
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          My Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('creator')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'creator'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          Creator Studio
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-white/5" />
                <div className="h-2 w-16 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Subscriptions Tab */}
      {activeTab === 'subscriptions' && !loading && (
        <>
          {subscriptions.length > 0 ? (
            <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto custom-scrollbar">
              {subscriptions.map((sub) => {
                const creator = sub.creator;
                const tier = sub.tier;
                const daysLeft = getDaysRemaining(sub.expiresAt);

                return (
                  <div
                    key={sub.id}
                    className="glass-panel rounded-2xl p-4 hover:border-violet-500/20 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Creator Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-amber-500/30">
                          <img
                            src={resolveImageUrl(creator?.avatar, true)}
                            alt={creator?.name || 'Creator'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{creator?.name || 'Creator'}</p>
                        <p className="text-xs text-slate-400 truncate">{creator?.handle || ''}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {tier && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                              {tier.tierName}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-400" />
                            {tier?.price || 0} ORRA/mo
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires {formatExpiry(sub.expiresAt)}
                          </span>
                          {daysLeft <= 7 && daysLeft > 0 && (
                            <span className="text-[10px] text-amber-400 font-bold">
                              {daysLeft}d left
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unsubscribe */}
                      <button
                        onClick={() => handleUnsubscribe(sub.id)}
                        disabled={unsubscribingId === sub.id}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40"
                      >
                        {unsubscribingId === sub.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/20">
                <Star className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Subscriptions Yet</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Subscribe to your favorite creators to unlock exclusive content!
              </p>
            </div>
          )}
        </>
      )}

      {/* Creator Studio Tab */}
      {activeTab === 'creator' && !loading && (
        <div className="space-y-4">
          {/* Revenue Stats */}
          {creatorTier && (
            <div className="glass-panel rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Revenue Stats
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{subscriberCount}</p>
                  <p className="text-[10px] text-slate-400">Subscribers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-400">{monthlyRevenue}</p>
                  <p className="text-[10px] text-slate-400">ORRA/mo</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{creatorTier.price}</p>
                  <p className="text-[10px] text-slate-400">Price</p>
                </div>
              </div>
            </div>
          )}

          {/* Create/Edit Tier Form */}
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              {creatorTier ? 'Edit Tier' : 'Create Subscriber Tier'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Tier Name</label>
                  <input
                    type="text"
                    value={tierForm.tierName}
                    onChange={(e) => setTierForm((prev) => ({ ...prev, tierName: e.target.value }))}
                    placeholder="Exclusive"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Price (ORRA/mo)</label>
                  <input
                    type="number"
                    value={tierForm.price}
                    onChange={(e) => setTierForm((prev) => ({ ...prev, price: Math.max(1, parseInt(e.target.value) || 1) }))}
                    min={1}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  value={tierForm.description}
                  onChange={(e) => setTierForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What subscribers get..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">Perks (comma-separated)</label>
                <input
                  type="text"
                  value={tierForm.perks}
                  onChange={(e) => setTierForm((prev) => ({ ...prev, perks: e.target.value }))}
                  placeholder="Exclusive posts, Early access, Badge"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <button
                onClick={handleSaveTier}
                disabled={savingTier}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40"
              >
                {savingTier ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                {creatorTier ? 'Update Tier' : 'Create Tier'}
              </button>
            </div>
          </div>

          {/* Subscribers List */}
          {subscribers.length > 0 && (
            <div className="glass-panel rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-fuchsia-400" />
                Subscribers ({subscriberCount})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {subscribers.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                      <img
                        src={resolveImageUrl(sub.subscriber?.avatar, true)}
                        alt={sub.subscriber?.name || 'Subscriber'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{sub.subscriber?.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{sub.subscriber?.handle}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {timeAgo(sub.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchSubscriptions}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300 transition-all"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
