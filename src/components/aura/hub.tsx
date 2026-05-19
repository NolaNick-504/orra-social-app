'use client';

import { Users, Globe, Sparkles, MessageCircle, Heart, ArrowLeft, Send, Zap, Loader2 } from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface HubItem {
  id: string;
  name: string;
  icon: string;
  cover: string;
  description: string;
  membersCount: number;
  onlineCount: number;
  postsCount: number;
  isMember: boolean;
}

interface HubPostItem {
  id: string;
  text: string;
  likesCount: number;
  commentsCount: number;
  authorId: string;
  hubId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
}

interface HubDetail extends HubItem {
  members: Array<{
    id: string;
    userId: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      handle: string;
      avatar: string;
      online: boolean;
      verified: boolean;
    };
  }>;
  posts: HubPostItem[];
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

export function Hub() {
  const { likedPosts, toggleLike, auraTokens } = useAuraStore();
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);

  // API-driven state
  const [hubs, setHubs] = useState<HubItem[]>([]);
  const [hubsLoading, setHubsLoading] = useState(true);
  const [hubsError, setHubsError] = useState<string | null>(null);

  const [selectedHub, setSelectedHub] = useState<HubDetail | null>(null);
  const [hubDetailLoading, setHubDetailLoading] = useState(false);

  const [hubPosts, setHubPosts] = useState<HubPostItem[]>([]);
  const [hubPostsLoading, setHubPostsLoading] = useState(false);

  const [joiningHubId, setJoiningHubId] = useState<string | null>(null);
  const [postingHubId, setPostingHubId] = useState<string | null>(null);
  const [newPostText, setNewPostText] = useState('');

  // Fetch all hubs on mount
  const fetchHubs = useCallback(async () => {
    setHubsLoading(true);
    setHubsError(null);
    try {
      const res = await fetch('/api/hubs');
      const data = await res.json();
      if (data.success) {
        setHubs(data.data);
      } else {
        setHubsError(data.error || 'Failed to load hubs');
      }
    } catch {
      setHubsError('Network error');
    } finally {
      setHubsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubs();
  }, [fetchHubs]);

  // Fetch hub detail when selected
  useEffect(() => {
    if (!selectedHubId) {
      setSelectedHub(null);
      setHubPosts([]);
      return;
    }

    const fetchHubDetail = async () => {
      setHubDetailLoading(true);
      try {
        const res = await fetch(`/api/hubs/${selectedHubId}`);
        const data = await res.json();
        if (data.success) {
          setSelectedHub(data.data);
          setHubPosts(data.data.posts || []);
        }
      } catch {
        toast.error('Failed to load hub detail');
      } finally {
        setHubDetailLoading(false);
      }
    };

    fetchHubDetail();
  }, [selectedHubId]);

  // Join/Leave hub via API
  const handleJoinHub = async (hubId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setJoiningHubId(hubId);
    try {
      const res = await fetch(`/api/hubs/${hubId}/join`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const action = data.data.action;
        // Update local hubs state
        setHubs((prev) =>
          prev.map((h) =>
            h.id === hubId
              ? {
                  ...h,
                  isMember: action === 'joined',
                  membersCount: action === 'joined' ? h.membersCount + 1 : h.membersCount - 1,
                }
              : h
          )
        );
        // Update selected hub if viewing
        if (selectedHubId === hubId && selectedHub) {
          setSelectedHub({
            ...selectedHub,
            isMember: action === 'joined',
            membersCount: action === 'joined' ? selectedHub.membersCount + 1 : selectedHub.membersCount - 1,
          });
        }
        if (action === 'joined') {
          const tokensAwarded = data.data.tokensAwarded || 0;
          const xpAwarded = data.data.xpAwarded || 0;
          toast.success(`Joined hub!${tokensAwarded > 0 ? ` +${tokensAwarded} ORRA +${xpAwarded} XP` : ''}`, { duration: 2000 });
        } else {
          toast.success('Left hub');
        }
      } else {
        toast.error(data.error || 'Failed to update membership');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setJoiningHubId(null);
    }
  };

  // Like a hub post
  const handleLikeHubPost = (postId: string) => {
    toggleLike(postId);
    const isLiked = likedPosts.has(postId);
    if (!isLiked) toast.success('+1 ORRA', { duration: 1500 });
  };

  // Create a hub post
  const handleCreatePost = async () => {
    if (!selectedHubId || !newPostText.trim()) return;
    setPostingHubId(selectedHubId);
    try {
      const res = await fetch(`/api/hubs/${selectedHubId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newPostText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setHubPosts((prev) => [data.data, ...prev]);
        setNewPostText('');
        toast.success('Post created! +5 ORRA +10 XP', { duration: 2000 });
      } else {
        toast.error(data.error || 'Failed to create post');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setPostingHubId(null);
    }
  };

  // Derive suggested hubs from API data (non-joined hubs)
  const suggestedHubs = hubs.filter((h) => !h.isMember);
  // Derive joined hubs from API data
  const joinedHubsList = hubs.filter((h) => h.isMember);

  // Hub Detail View
  if (selectedHubId) {
    if (hubDetailLoading) {
      return (
        <div className="fade-in flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      );
    }

    if (selectedHub) {
      return (
        <div className="fade-in space-y-4 pb-4">
          {/* Back button */}
          <button
            onClick={() => setSelectedHubId(null)}
            className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Hubs
          </button>

          {/* Hub Header */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="relative h-32 overflow-hidden">
              <img src={selectedHub.cover} alt={selectedHub.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-3 left-3 w-12 h-12 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/10">
                {selectedHub.icon}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white">{selectedHub.name}</h2>
                <button
                  onClick={() => handleJoinHub(selectedHub.id)}
                  disabled={joiningHubId === selectedHub.id}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedHub.isMember
                      ? 'bg-violet-600/20 text-violet-400 hover:bg-red-500/20 hover:text-red-400'
                      : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 glow-violet'
                  } ${joiningHubId === selectedHub.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {joiningHubId === selectedHub.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : selectedHub.isMember ? 'Joined' : 'Join Hub'}
                </button>
              </div>
              <p className="text-sm text-slate-400 mb-3">{selectedHub.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {selectedHub.membersCount.toLocaleString()} members</div>
                <div className="flex items-center gap-1"><Globe className="w-3 h-3 text-emerald-400" /> {selectedHub.onlineCount} online</div>
                <div className="flex items-center gap-1 text-amber-400"><Zap className="w-3 h-3" /> +5 ORRA to join</div>
              </div>
            </div>
          </div>

          {/* Create Post in Hub */}
          {selectedHub.isMember && (
            <div className="glass-panel rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-lg">
                  {selectedHub.icon}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`Post in ${selectedHub.name}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPostText.trim()) handleCreatePost();
                    }}
                    disabled={postingHubId === selectedHubId}
                  />
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostText.trim() || postingHubId === selectedHubId}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {postingHubId === selectedHubId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hub Posts */}
          <div className="space-y-3">
            {hubPosts.length > 0 ? hubPosts.map((post) => {
              const isLiked = likedPosts.has(post.id);
              return (
                <div key={post.id} className="glass-panel rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                      <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{post.author.name}</p>
                      <p className="text-[10px] text-slate-500">{formatTimeAgo(post.createdAt)} ago in {selectedHub.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 mb-3">{post.text}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <button onClick={() => handleLikeHubPost(post.id)} className="flex items-center gap-1 hover:text-red-400 transition-all">
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      {post.likesCount + (isLiked ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-400 transition-all">
                      <MessageCircle className="w-3.5 h-3.5" /> {post.commentsCount}
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <p className="text-sm text-slate-400">No posts yet in this hub.</p>
                {selectedHub.isMember && (
                  <button onClick={() => setNewPostText(' ')} className="mt-2 text-violet-400 text-sm font-semibold hover:text-violet-300">
                    Be the first to post!
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Selected hub not found
    return (
      <div className="fade-in space-y-4 pb-4">
        <button
          onClick={() => setSelectedHubId(null)}
          className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hubs
        </button>
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-400">Hub not found.</p>
        </div>
      </div>
    );
  }

  // Main Hubs List View
  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Your Hubs</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-400 flex items-center gap-1"><Zap className="w-3 h-3" />{auraTokens.toLocaleString()}</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 text-xs font-semibold hover:bg-violet-600/30 transition-all">
            <Sparkles className="w-3.5 h-3.5" />
            Discover Hubs
          </button>
        </div>
      </div>

      {/* Loading State */}
      {hubsLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {hubsError && !hubsLoading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-red-400 mb-2">{hubsError}</p>
          <button onClick={fetchHubs} className="text-violet-400 text-sm font-semibold hover:text-violet-300">
            Try again
          </button>
        </div>
      )}

      {/* Hub Cards Grid */}
      {!hubsLoading && !hubsError && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(joinedHubsList.length > 0 ? joinedHubsList : hubs).map((hub) => {
            return (
              <div key={hub.id} className="glass-card rounded-2xl overflow-hidden cursor-pointer group" onClick={() => setSelectedHubId(hub.id)}>
                {/* Cover Image */}
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={hub.cover}
                    alt={hub.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-xl border border-white/10">
                    {hub.icon}
                  </div>
                  <button
                    onClick={(e) => handleJoinHub(hub.id, e)}
                    disabled={joiningHubId === hub.id}
                    className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      hub.isMember
                        ? 'bg-violet-600/40 text-violet-300 backdrop-blur-sm'
                        : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white backdrop-blur-sm'
                    } ${joiningHubId === hub.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {joiningHubId === hub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : hub.isMember ? 'Joined' : 'Join'}
                  </button>
                </div>

                {/* Hub Info */}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-0.5">{hub.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{hub.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{hub.membersCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">{hub.onlineCount} online</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{hub.postsCount} posts</span>
                    </div>
                  </div>

                  {/* Member indicator */}
                  <div className="flex items-center">
                    <span className="text-xs text-slate-500">{hub.membersCount.toLocaleString()} members</span>
                    {hub.isMember && <span className="ml-auto text-[10px] text-violet-400 font-bold">You&apos;re here!</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggested Hubs */}
      {!hubsLoading && !hubsError && suggestedHubs.length > 0 && (
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="font-bold text-white mb-3">Suggested for You</h3>
          <div className="space-y-3">
            {suggestedHubs.map((hub) => {
              return (
                <div key={hub.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer" onClick={() => setSelectedHubId(hub.id)}>
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    {hub.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{hub.name}</p>
                    <p className="text-xs text-slate-500">{hub.membersCount.toLocaleString()} members • {hub.description}</p>
                  </div>
                  <button
                    onClick={(e) => handleJoinHub(hub.id, e)}
                    disabled={joiningHubId === hub.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      hub.isMember
                        ? 'bg-violet-600/20 text-violet-400'
                        : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
                    } ${joiningHubId === hub.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {joiningHubId === hub.id ? <Loader2 className="w-3 h-3 animate-spin" /> : hub.isMember ? 'Joined' : 'Join'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No hubs found */}
      {!hubsLoading && !hubsError && hubs.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-400">No hubs available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
