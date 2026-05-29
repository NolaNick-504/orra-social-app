'use client';

import { useAuraStore, type HomeTab } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { useNotifications, useChats } from '@/lib/api-hooks';
import { Search, Bell, Wand2, X, Coins, Sparkles, Send, QrCode, Share2, ScanLine } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

// QR Scanner component using html5-qrcode
function TopHeaderQRScanner({ onClose }: { onClose: () => void }) {
  const scannerRef = useRef<any>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const { setViewingUser, setView } = useAuraStore();

  useEffect(() => {
    let scanner: any = null;
    const startScanner = async () => {
      setIsStarting(true);
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('top-header-qr-scanner');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            setScanResult(decodedText);
            scanner.stop();
            // If it's an ORRA profile URL or orra:// protocol, navigate
            if (decodedText.includes('orra://profile/')) {
              const userId = decodedText.replace('orra://profile/', '');
              setViewingUser(userId);
              setView('profile');
              toast.success('Profile found!');
              setTimeout(onClose, 1000);
            } else if (decodedText.includes(window.location.origin) || decodedText.includes('orra.app') || decodedText.includes('orra.link')) {
              const handle = decodedText.split('/').pop();
              if (handle) {
                toast.success('QR code scanned!');
                setTimeout(onClose, 1000);
              }
            }
          },
          () => { /* scan failure - ignore */ }
        );
      } catch (err: any) {
        setError(err?.message || 'Could not access camera. Please allow camera permissions.');
      } finally {
        setIsStarting(false);
      }
    };
    startScanner();
    return () => {
      if (scanner) { try { scanner.stop(); } catch {} }
    };
  }, [onClose, setViewingUser, setView]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {error ? (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <X className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-red-400 text-sm font-medium mb-2">Camera Error</p>
          <p className="text-slate-500 text-xs mb-4 max-w-xs">{error}</p>
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors">
            Close
          </button>
        </div>
      ) : scanResult ? (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <QrCode className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-emerald-400 text-sm font-bold mb-2">QR Code Found!</p>
          <p className="text-slate-400 text-xs break-all max-w-xs">{scanResult}</p>
          <button onClick={onClose} className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
            Done
          </button>
        </div>
      ) : (
        <>
          <div id="top-header-qr-scanner" className="w-full max-w-xs rounded-2xl overflow-hidden" style={{ minHeight: '280px' }} />
          {isStarting && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400 text-xs">Starting camera...</span>
            </div>
          )}
          <p className="text-slate-500 text-[10px] text-center mt-3">Point your camera at an ORRA QR code to scan</p>
        </>
      )}
    </div>
  );
}

export function TopHeader() {
  const { homeTab, setHomeTab, toggleVibeCheck, currentVibe, selectedVibes, currentView, searchQuery, setSearchQuery, customNotifications, auraTokens, addRecentSearch, recentSearches, unreadMessages, setViewingUser, setView } = useAuraStore();
  const currentUser = useCurrentUser();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [showQRView, setShowQRView] = useState(false);
  const [qrTab, setQrTab] = useState<'myqr' | 'scan'>('myqr');
  const lastScrollY = useRef(0);
  const { navVisible, setNavVisible } = useAuraStore();

  // Scroll detection for mobile nav hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const pastThreshold = currentScrollY > 50;
      const atTop = currentScrollY < 10;

      if (atTop) {
        setNavVisible(true);
      } else if (scrollingDown && pastThreshold) {
        setNavVisible(false);
      } else if (!scrollingDown) {
        setNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setNavVisible]);

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
    <>
    <header className={`sticky top-0 z-30 glass-panel border-b border-white/10 transition-transform duration-300 ease-in-out lg:translate-y-0 ${navVisible ? 'translate-y-0' : '-translate-y-full'}`}>
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

        {/* QR Code Icon - Desktop */}
        <button
          onClick={() => setShowQRView(true)}
          className="relative p-2 rounded-xl hover:bg-white/5 transition-all flex-shrink-0"
        >
          <QrCode className="w-5 h-5 text-violet-400" />
        </button>

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
            {/* QR Code Icon - Mobile */}
            <button
              onClick={() => setShowQRView(true)}
              className="relative p-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <QrCode className="w-5 h-5 text-violet-400" />
            </button>

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

    {/* QR Code Modal - Cash App style */}
    {showQRView && (
      <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">QR Code</h2>
          <button onClick={() => { setShowQRView(false); setQrTab('myqr'); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* My QR / Scan Toggle - Cash App style */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3">
          <button
            onClick={() => setQrTab('myqr')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              qrTab === 'myqr'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <QrCode className="w-4 h-4" />
            My QR
          </button>
          <button
            onClick={() => setQrTab('scan')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              qrTab === 'scan'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            Scan
          </button>
        </div>

        {qrTab === 'myqr' ? (
          /* My QR Tab */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {/* Profile Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-violet-500/40 flex-shrink-0">
                <img src={currentUser.avatar || '/api/uploads?path=images/orra-logo.png'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-white truncate">{currentUser.name || 'ORRA User'}</p>
                <p className="text-sm text-slate-400 truncate">{currentUser.handle || '@orrauser'}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="relative bg-white rounded-3xl p-5 shadow-xl shadow-violet-500/20 mb-6">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? `${window.location.origin}/${(currentUser.handle || 'orrauser').replace('@', '')}` : '/'}
                size={220}
                bgColor="#ffffff"
                fgColor="#1a1a2e"
                level="H"
                includeMargin={false}
              />
              {/* ORRA logo overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md border border-violet-200">
                  <span className="text-[9px] font-black text-violet-600 tracking-tight">ORRA</span>
                </div>
              </div>
            </div>

            {/* Help text */}
            <p className="text-center text-xs text-slate-500 mb-6">Have a friend scan this to add you instantly.</p>

            {/* Share Button */}
            <button
              onClick={() => {
                const handleForLink = (currentUser.handle || '@orrauser').replace('@', '');
                const link = `${window.location.origin}/${handleForLink}`;
                if (navigator.share) {
                  navigator.share({
                    title: 'Add me on ORRA',
                    text: `Scan my QR code on ORRA or search ${currentUser.handle || '@orrauser'}`,
                    url: link,
                  }).catch(() => {
                    navigator.clipboard.writeText(link);
                    toast.success('Profile link copied!');
                  });
                } else {
                  navigator.clipboard.writeText(link);
                  toast.success('Profile link copied!');
                }
              }}
              className="w-full max-w-xs flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-md shadow-violet-500/30 hover:from-violet-500 hover:to-purple-500 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        ) : (
          /* Scan Tab - Working camera scanner */
          <TopHeaderQRScanner onClose={() => { setShowQRView(false); setQrTab('myqr'); }} />
        )}
      </div>
    )}
    </>
  );
}
