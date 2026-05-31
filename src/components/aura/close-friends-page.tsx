'use client';

import {
  Users,
  Plus,
  X,
  Loader2,
  Search,
  UserMinus,
  UserPlus,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CloseFriend {
  closeFriendId: string;
  createdAt: string;
  friend: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    online: boolean;
  };
}

interface FollowedUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  online: boolean;
}

// ─── Main Close Friends Page ────────────────────────────────────────────────

export function CloseFriendsPage() {
  const [closeFriends, setCloseFriends] = useState<CloseFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchCloseFriends = useCallback(async () => {
    try {
      const res = await fetch('/api/close-friends');
      const data = await res.json();
      if (data.success) {
        setCloseFriends(data.data || []);
      } else {
        setError(data.error || 'Failed to load close friends');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFollowedUsers = useCallback(async () => {
    setLoadingFollowed(true);
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) {
        setFollowedUsers(data.data?.following || data.data || []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoadingFollowed(false);
    }
  }, []);

  useEffect(() => {
    fetchCloseFriends();
    fetchFollowedUsers();
  }, [fetchCloseFriends, fetchFollowedUsers]);

  const handleRemoveFriend = async (friendId: string) => {
    setActioningId(friendId);
    try {
      const res = await fetch('/api/close-friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (data.success) {
        setCloseFriends((prev) => prev.filter((cf) => cf.friend.id !== friendId));
        toast.success('Removed from inner circle');
      } else {
        toast.error(data.error || 'Failed to remove');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActioningId(null);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    setActioningId(friendId);
    try {
      const res = await fetch('/api/close-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (data.success) {
        // Re-fetch to get proper shape with friend data
        fetchCloseFriends();
        toast.success('Added to inner circle! 🤝');
      } else {
        toast.error(data.error || 'Failed to add');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActioningId(null);
    }
  };

  // Get IDs of current close friends for filtering
  const closeFriendIds = new Set(closeFriends.map((cf) => cf.friend.id));

  // Filter followed users to show only those NOT in close friends
  const availableUsers = followedUsers.filter(
    (u) => !closeFriendIds.has(u.id)
  );

  // Apply search filter
  const filteredAvailable = searchQuery
    ? availableUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.handle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableUsers;

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-white">Inner Circle</h2>
        {closeFriends.length > 0 && (
          <span className="text-xs text-slate-400 ml-1">({closeFriends.length})</span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
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

      {/* Error */}
      {error && !loading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchCloseFriends}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300 transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* Close Friends List */}
      {!loading && !error && closeFriends.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            Your Inner Circle
          </h3>
          {closeFriends.map((cf) => (
            <div
              key={cf.closeFriendId}
              className="glass-panel rounded-xl p-3 flex items-center gap-3 group hover:border-violet-500/20 transition-all"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-violet-500/30">
                  <img
                    src={resolveImageUrl(cf.friend.avatar, true)}
                    alt={cf.friend.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {cf.friend.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#050505]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{cf.friend.name}</p>
                <p className="text-xs text-slate-400 truncate">{cf.friend.handle}</p>
              </div>
              <button
                onClick={() => handleRemoveFriend(cf.friend.id)}
                disabled={actioningId === cf.friend.id}
                className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40"
              >
                {actioningId === cf.friend.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserMinus className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Close Friends Section */}
      {!loading && !error && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-fuchsia-400" />
            Add to Inner Circle
          </h3>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search followed users..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Available Users */}
          {loadingFollowed ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="glass-panel rounded-xl p-3 animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-white/5" />
                    <div className="h-2 w-16 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAvailable.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {filteredAvailable.map((user) => (
                <div
                  key={user.id}
                  className="glass-panel rounded-xl p-3 flex items-center gap-3 hover:border-fuchsia-500/20 transition-all"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
                      <img
                        src={resolveImageUrl(user.avatar, true)}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {user.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#050505]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.handle}</p>
                  </div>
                  <button
                    onClick={() => handleAddFriend(user.id)}
                    disabled={actioningId === user.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40"
                  >
                    {actioningId === user.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-6 text-center">
              <p className="text-sm text-slate-400">
                {searchQuery
                  ? 'No matching users found'
                  : 'All your followed users are already in your inner circle!'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && closeFriends.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
            <Users className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Inner Circle Yet</h3>
          <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
            Add your closest friends to share exclusive content with them.
          </p>
        </div>
      )}
    </div>
  );
}
