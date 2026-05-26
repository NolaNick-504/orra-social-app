'use client';

import { useAuraStore, type NavView } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { useNotifications, useChats } from '@/lib/api-hooks';
// Server-side logout that properly clears Secure cookies
// Client-side document.cookie deletion fails for Secure cookies behind HTTPS proxy
async function fastLogout() {
  try {
    // Step 1: Call server-side logout to clear cookies with correct Secure flag
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // If server call fails, fall back to client-side cookie clearing
    document.cookie = 'next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
  // Step 2: Clear ORRA localStorage
  try { localStorage.removeItem('aura-storage'); } catch {}
  // Step 3: Navigate to root — cookies are now properly cleared server-side
  window.location.href = '/';
}
import {
  Home,
  Compass,
  Clapperboard,
  Trophy,
  Users,
  Send,
  Heart,
  Plus,
  Flame,
  Coins,
  LogOut,
  Gamepad2,
  Sparkles,
  Leaf,
  ShoppingBag,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const desktopNavItems: { view: NavView; label: string; icon: React.ElementType; badge?: string }[] = [
  { view: 'home', label: 'Home', icon: Home },
  { view: 'explore', label: 'Explore', icon: Compass },
  { view: 'reels', label: 'Reels', icon: Clapperboard },
  { view: 'games', label: 'Game Arena', icon: Gamepad2 },
  { view: 'hub', label: 'Hub', icon: Users },
  { view: 'messages', label: 'Messages', icon: Send },
  { view: 'activity', label: 'Activity', icon: Heart },
  { view: 'wellness', label: 'Wellness', icon: Leaf },
  { view: 'marketplace', label: 'Market', icon: ShoppingBag },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { currentView, setView, toggleCreatePost, auraTokens, customNotifications, unreadMessages, setViewingUser } = useAuraStore();
  const currentUser = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch unread counts from API
  const { data: notifData } = useNotifications();
  const { data: chatsData } = useChats();

  const displayName = currentUser.name;
  const displayAvatar = currentUser.avatar;
  // Combine API unread count with local custom notifications
  const apiUnreadCount = notifData?.unreadCount || 0;
  const localUnreadCount = customNotifications.filter((n) => !n.read).length;
  const unreadNotifs = apiUnreadCount + localUnreadCount;
  // Calculate total unread messages from API chats data
  const totalUnreadMsgs = chatsData ? chatsData.reduce((sum, c) => sum + c.unreadCount, 0) : (unreadMessages ? Object.values(unreadMessages).reduce((a, b) => a + b, 0) : 0);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 glass-panel border-r border-white/10">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <img src="/api/uploads?path=images/orra-globe-icon-lg.jpg" alt="ORRA" className="w-12 h-12 rounded-xl object-cover" />
          <span className="text-2xl font-black gradient-text tracking-tight">ORRA</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            const badge = item.view === 'messages' ? (totalUnreadMsgs > 0 ? String(totalUnreadMsgs) : undefined) : item.badge;
            const notifCount = item.view === 'activity' ? unreadNotifs : 0;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-violet-500 transition-all" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : ''} transition-all`} />
                <span className="font-medium">{item.label}</span>
                {badge && (
                  <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                    badge === 'LIVE' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-violet-500/20 text-violet-400'
                  }`}>
                    {badge}
                  </span>
                )}
                {notifCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-500/20 text-violet-400">
                    {notifCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Create Button + Prism AI */}
        <div className="px-3 pb-3 space-y-2">
          <button
            onClick={() => toggleCreatePost()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition-all glow-violet text-sm relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 opacity-0 group-hover:opacity-20 transition-opacity" />
            <Plus className="w-5 h-5" />
            Create
          </button>
          <button
            onClick={() => useAuraStore.setState({ prismCompanionOpen: true })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-violet-500/30 text-violet-300 font-medium hover:bg-violet-500/10 hover:border-violet-500/50 transition-all text-sm relative overflow-hidden group"
          >
            <Sparkles className="w-4 h-4" />
            Prism AI
            <span className="absolute right-3 text-[8px] font-bold text-amber-400">+1 ORRA</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => { setViewingUser(null); setView('profile'); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
              currentView === 'profile' ? 'bg-white/5' : 'hover:bg-white/5'
            }`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-violet-500/50 aura-glow-ring">
              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-400" />
                <p className="text-xs text-yellow-400 font-medium">{auraTokens.toLocaleString()}</p>
              </div>
            </div>
            <Flame className="w-4 h-4 text-violet-400" />
          </button>
          <button
            onClick={fastLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav - 5 items + Menu */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {/* Home */}
          <button
            onClick={() => setView('home')}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
              currentView === 'home' ? 'text-violet-400' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-medium">Home</span>
          </button>

          {/* Explore */}
          <button
            onClick={() => setView('explore')}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
              currentView === 'explore' ? 'text-violet-400' : 'text-slate-500'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[9px] font-medium">Explore</span>
          </button>

          {/* Create (+) center button */}
          <button
            onClick={() => toggleCreatePost()}
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 -mt-3 transition-all hover:opacity-90"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Wellness */}
          <button
            onClick={() => setView('wellness')}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
              currentView === 'wellness' ? 'text-violet-400' : 'text-slate-500'
            }`}
          >
            <Leaf className="w-5 h-5" />
            <span className="text-[9px] font-medium">Wellness</span>
          </button>

          {/* Menu (hamburger) - opens full nav drawer */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all text-slate-500 hover:text-violet-400"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Out Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-[#0a0a12] border-l border-white/10 flex flex-col fade-in overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <img src="/api/uploads?path=images/orra-globe-icon-lg.jpg" alt="ORRA" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-lg font-black gradient-text tracking-tight">ORRA</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Mini */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-violet-500/50">
                  <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <p className="text-xs text-yellow-400 font-medium">{auraTokens.toLocaleString()} ORRA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Nav Items */}
            <nav className="flex-1 p-3 space-y-1">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                const badge = item.view === 'messages' ? (totalUnreadMsgs > 0 ? String(totalUnreadMsgs) : undefined) : item.badge;
                const notifCount = item.view === 'activity' ? unreadNotifs : 0;
                return (
                  <button
                    key={item.view}
                    onClick={() => { setView(item.view); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : ''} transition-all`} />
                    <span className="font-medium">{item.label}</span>
                    {badge && (
                      <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                        badge === 'LIVE' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-violet-500/20 text-violet-400'
                      }`}>
                        {badge}
                      </span>
                    )}
                    {notifCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-500/20 text-violet-400">
                        {notifCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Prism AI + Create */}
            <div className="p-3 space-y-2 border-t border-white/10">
              <button
                onClick={() => toggleCreatePost()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition-all text-sm"
              >
                <Plus className="w-5 h-5" />
                Create
              </button>
              <button
                onClick={() => { useAuraStore.setState({ prismCompanionOpen: true }); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-violet-500/30 text-violet-300 font-medium hover:bg-violet-500/10 hover:border-violet-500/50 transition-all text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Prism AI
                <span className="ml-auto text-[8px] font-bold text-amber-400">+1 ORRA</span>
              </button>
            </div>

            {/* Sign Out */}
            <div className="p-3 border-t border-white/10">
              <button
                onClick={fastLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
