'use client';

import { useAuraStore, type HomeTab } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { useNotifications, useChats } from '@/lib/api-hooks';
import { Search, Bell, Wand2, X, Coins, Sparkles, Send } from 'lucide-react';
import { useState } from 'react';

export function TopHeader() {
  const { homeTab, setHomeTab, toggleVibeCheck, currentVibe, selectedVibes, currentView, searchQuery, setSearchQuery, customNotifications, auraTokens, addRecentSearch, recentSearches, unreadMessages, setViewingUser, setView } = useAuraStore();
  const currentUser = useCurrentUser();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  // Fetch unread counts from API
  const { data: notifData } = useNotifications();
  const { data: chatsData } = useChats();

  const tabs: { key: HomeTab; label: string }[] = [
    { key: 'pulse', label: 'Pulse' },
    { key: 'prism', label: 'Prism' },
    { key: 'hub', label: 'Hub' },
  ];

  const viewTitle = {
    home: '',
    explore: 'Explore',
    reels: 'Reels',
    dance: 'Game Arena',
    hub: 'Hub',
    messages: 'Messages',
    activity: 'Activity',
    profile: 'Profile',
    wellness: 'Wellness',
    marketplace: 'ORRA Market',
    games: 'Game Arena',
  }[currentView];

  const apiUnreadCount = notifData?.unreadCount || 0;
  const localUnreadCount = customNotifications.filter((n) => !n.read).length;
  const unreadCount = apiUnreadCount + localUnreadCount;
  const totalUnreadMsgs = chatsData ? chatsData.reduce((sum, c) => sum + c.unreadCount, 0) : (unreadMessages ? Object.values(unreadMessages).reduce((a, b) => a + b, 0) : 0);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      addRecentSearch(query.trim());
    }
  };

  const vibeColors: Record<string, string> = {
    hyped: 'from-yellow-600 to-amber-500',
    laughing: 'from-amber-600 to-yellow-500',
    chill: 'from-blue-600 to-cyan-500',
    dramatic: 'from-fuchsia-600 to-pink-500',
    focused: 'from-emerald-600 to-green-500',
    peaceful: 'from-purple-600 to-violet-500',
  };

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10">
      {/* Desktop header row */}
      <div className="hidden lg:flex items-center gap-3 px-4 py-3">
        {/* Desktop Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src="/api/uploads?path=images/orra-globe-icon.jpg" alt="ORRA" className="w-9 h-9 rounded-lg object-cover" />
          <span className="text-lg font-black gradient-text tracking-tight">ORRA</span>
          {viewTitle && <span className="text-slate-500 text-sm">/ {viewTitle}</span>}
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-violet-400' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search ORRA..."
            onFocus={() => { setSearchFocused(true); setShowRecentSearches(true); }}
            onBlur={() => { setSearchFocused(false); setTimeout(() => setShowRecentSearches(false), 200); }}
            className={`w-full bg-white/5 border rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
              searchFocused ? 'border-violet-500/50 ring-1 ring-violet-500/30' : 'border-white/10'
            }`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Recent Searches Dropdown */}
          {showRecentSearches && recentSearches.length > 0 && !searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-xl border border-violet-500/20 p-2 z-50 fade-in">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs text-slate-400 font-medium">Recent Searches</span>
                <button onClick={() => useAuraStore.getState().clearRecentSearches()} className="text-[10px] text-violet-400 hover:text-violet-300">
                  Clear all
                </button>
              </div>
              {recentSearches.slice(0, 5).map((query, i) => (
                <button
                  key={i}
                  onClick={() => { setSearchQuery(query); setShowRecentSearches(false); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-all"
                >
                  {query}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Pills (Desktop - only on home view) */}
        {currentView === 'home' && (
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setHomeTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  homeTab === tab.key
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Token Balance */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">{auraTokens.toLocaleString()}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => useAuraStore.getState().setView('activity')}
          className="relative p-2 rounded-xl hover:bg-white/5 transition-all flex-shrink-0"
        >
          <Bell className="w-5 h-5 text-slate-400" />
          {unreadCount > 0 && (
            <div className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </div>
          )}
        </button>

        {/* Vibe Check Button */}
        <button
          onClick={toggleVibeCheck}
          className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex-shrink-0 ${
            (selectedVibes && selectedVibes.length > 0)
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
              : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white glow-violet'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          {(selectedVibes && selectedVibes.length > 0) ? (
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {selectedVibes.length} vibe{selectedVibes.length > 1 ? 's' : ''}
            </span>
          ) : 'Vibe Check'}
        </button>
      </div>

      {/* Mobile header - two rows: logo + icons on top, search full width below */}
      <div className="lg:hidden">
        {/* Row 1: Logo + Icons */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <img src="/api/uploads?path=images/orra-globe-icon.jpg" alt="ORRA" className="w-9 h-9 rounded-lg object-cover" />
            <span className="text-lg font-black gradient-text tracking-tight">ORRA</span>
            {viewTitle && <span className="text-slate-500 text-sm">/ {viewTitle}</span>}
          </div>
          <div className="flex items-center gap-1">
            {/* Mobile DM Icon */}
            <button
              onClick={() => useAuraStore.getState().setView('messages')}
              className="relative p-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <Send className="w-5 h-5 text-slate-400" />
              {totalUnreadMsgs > 0 && (
                <div className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-violet-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{totalUnreadMsgs > 9 ? '9+' : totalUnreadMsgs}</span>
                </div>
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => useAuraStore.getState().setView('activity')}
              className="relative p-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <Bell className="w-5 h-5 text-slate-400" />
              {unreadCount > 0 && (
                <div className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </div>
              )}
            </button>

            {/* Mobile Vibe Check */}
            <button
              onClick={toggleVibeCheck}
              className={`p-2 rounded-xl transition-all ${
                (selectedVibes && selectedVibes.length > 0)
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                  : 'hover:bg-white/5'
              }`}
            >
              <Wand2 className="w-5 h-5 text-white" />
            </button>

            {/* Profile Avatar - tap to go to profile */}
            <button
              onClick={() => { setViewingUser(null); setView('profile'); }}
              className={`p-0.5 rounded-full transition-all ${
                currentView === 'profile' ? 'ring-2 ring-violet-400' : 'hover:ring-2 hover:ring-white/20'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img src={currentUser.avatar || '/api/uploads?path=images/orra-logo.png'} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </button>
          </div>
        </div>

        {/* Row 2: Search bar full width */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-violet-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search ORRA..."
              onFocus={() => { setSearchFocused(true); setShowRecentSearches(true); }}
              onBlur={() => { setSearchFocused(false); setTimeout(() => setShowRecentSearches(false), 200); }}
              className={`w-full bg-white/5 border rounded-xl pl-10 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                searchFocused ? 'border-violet-500/50 ring-1 ring-violet-500/30' : 'border-white/10'
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Recent Searches Dropdown (Mobile) */}
            {showRecentSearches && recentSearches.length > 0 && !searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-panel rounded-xl border border-violet-500/20 p-2 z-50 fade-in">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs text-slate-400 font-medium">Recent Searches</span>
                  <button onClick={() => useAuraStore.getState().clearRecentSearches()} className="text-[10px] text-violet-400 hover:text-violet-300">
                    Clear all
                  </button>
                </div>
                {recentSearches.slice(0, 5).map((query, i) => (
                  <button
                    key={i}
                    onClick={() => { setSearchQuery(query); setShowRecentSearches(false); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-all"
                  >
                    {query}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Pills (only on home view) */}
      {currentView === 'home' && (
        <div className="lg:hidden flex items-center gap-1 px-4 pb-2">
          <div className="flex items-center gap-1 bg-white/5 w-full rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setHomeTab(tab.key)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  homeTab === tab.key
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
