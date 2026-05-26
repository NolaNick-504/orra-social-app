'use client';

import { exploreCategories, exploreItems, users } from '@/lib/data';
import { useSearch } from '@/lib/api-hooks';
import { Search, UserPlus, MapPin, Heart, Play, Bookmark, Share2, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

export function Explore() {
  const [activeCategory, setActiveCategory] = useState('Trending');
  const { followedUsers, toggleFollow, searchQuery, earnTokens, addXP, toggleSave, savedPosts, likedPosts, toggleLike } = useAuraStore();
  const [showMore, setShowMore] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  // Use the search API when there's a query
  const { data: searchResults, isLoading: searchLoading } = useSearch(localSearch.trim());
  const searchUsers = searchResults?.users || [];
  const searchPosts = searchResults?.posts || [];

  // Sync local search with store
  useEffect(() => {
    const { setSearchQuery } = useAuraStore.getState();
    setSearchQuery(localSearch);
  }, [localSearch]);

  let filtered = activeCategory === 'Trending'
    ? exploreItems
    : exploreItems.filter((item) => item.category === activeCategory);

  // If there's a search query, show API results instead of static items
  const hasSearchResults = localSearch.trim().length > 0;

  const displayItems = showMore ? filtered : filtered.slice(0, 8);

  const handleExploreLike = (itemId: string) => {
    const isLiked = likedPosts.has(itemId);
    toggleLike(itemId);
    if (!isLiked) {
      earnTokens(1, 'liked explore item');
      addXP(3);
      toast.success('+1 ORRA', { duration: 1500, icon: <Coins className="w-4 h-4 text-yellow-400" /> });
    }
  };

  const handleFollow = async (userId: string, name: string) => {
    const isFollowed = followedUsers.has(userId);
    toggleFollow(userId);
    try {
      await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch {}
    if (!isFollowed) {
      earnTokens(5, 'followed a creator');
      addXP(10);
      toast.success(`Following ${name}! +5 ORRA`, { duration: 1500, icon: <Coins className="w-4 h-4 text-yellow-400" /> });
    } else {
      toast.success(`Unfollowed ${name}`);
    }
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Discover something amazing..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
      </div>

      {/* Search Results */}
      {hasSearchResults && (
        <div className="space-y-4">
          {/* Users from search */}
          {searchUsers.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">People</h3>
              <div className="space-y-2">
                {searchUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl glass-panel hover:border-violet-500/20 transition-all">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
                      <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-white text-sm truncate">{user.name}</p>
                        {user.verified && (
                          <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{user.handle} · {user._count?.followers || 0} followers</p>
                    </div>
                    <button
                      onClick={() => handleFollow(user.id, user.name)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        followedUsers.has(user.id)
                          ? 'bg-white/10 text-slate-300'
                          : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      {followedUsers.has(user.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts from search */}
          {searchPosts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Posts</h3>
              <div className="space-y-2">
                {searchPosts.map((post: any) => (
                  <div key={post.id} className="glass-panel rounded-xl p-4 hover:border-violet-500/20 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10">
                        <img src={resolveImageUrl(post.author?.avatar)} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{post.author?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500">{post.author?.handle}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{post.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likesCount}</span>
                      <span className="flex items-center gap-1">💬 {post.commentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {searchUsers.length === 0 && searchPosts.length === 0 && !searchLoading && (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-400">No results found for &quot;{localSearch}&quot;</p>
            </div>
          )}

          {/* Loading */}
          {searchLoading && (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Searching...</p>
            </div>
          )}
        </div>
      )}

      {/* Category Pills (only show when no search) */}
      {!hasSearchResults && (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {exploreCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Masonry Grid */}
          <div className="columns-2 md:columns-3 gap-3 space-y-3">
            {displayItems.map((item, i) => {
              const isSaved = savedPosts.has(item.id);
              const isLiked = likedPosts.has(item.id);
              return (
                <div
                  key={item.id}
                  className="break-inside-avoid relative rounded-xl overflow-hidden group cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ height: `${180 + (i % 4) * 60}px` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <img src={item.creator.avatar} alt="" className="w-4 h-4 rounded-full ring-1 ring-white/20" />
                        <span className="text-[10px] text-slate-300">{item.creator.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleExploreLike(item.id); }} className="flex items-center gap-1 text-white text-xs">
                          <Heart className={`w-3 h-3 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                          {item.likes}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleSave(item.id); toast.success(isSaved ? 'Unsaved' : 'Saved!'); }} className="text-white">
                          <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-violet-400 text-violet-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Quick actions always visible */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }} className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-violet-400 text-violet-400' : 'text-white'}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Share2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-400">No items found for this category.</p>
            </div>
          )}

          {/* Load More */}
          {filtered.length > 8 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-full py-3 rounded-xl bg-white/5 text-sm text-violet-400 font-semibold hover:bg-white/10 transition-all"
            >
              {showMore ? 'Show Less' : `Load More (${filtered.length - 8} more)`}
            </button>
          )}

          {/* Rising Creators */}
          <div className="glass-panel rounded-2xl p-4">
            <h2 className="text-lg font-bold text-white mb-4">Rising Creators</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {users.slice(0, 4).map((user) => {
                const isFollowed = followedUsers.has(user.id);
                return (
                  <div key={user.id} className="flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-violet-500/30 mb-2">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-semibold text-white text-center truncate w-full">{user.name}</p>
                    <p className="text-xs text-slate-500 mb-2">{user.handle}</p>
                    <button
                      onClick={() => handleFollow(user.id, user.name)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isFollowed
                          ? 'bg-white/10 text-slate-300'
                          : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location-based content */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-bold text-white">Near You</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { title: 'Coffee Shop Vibes', image: 'https://picsum.photos/seed/near1/300/200', dist: '0.3 mi' },
                { title: 'Street Art Walk', image: 'https://picsum.photos/seed/near2/300/200', dist: '0.5 mi' },
                { title: 'Rooftop Sunsets', image: 'https://picsum.photos/seed/near3/300/200', dist: '1.2 mi' },
                { title: 'Dance Studio', image: 'https://picsum.photos/seed/near4/300/200', dist: '0.8 mi' },
              ].map((place, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-[3/2] group cursor-pointer">
                  <img src={place.image} alt={place.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-bold text-white">{place.title}</p>
                    <p className="text-[10px] text-emerald-400">{place.dist} away</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
