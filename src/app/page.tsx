'use client';

import { useSession } from 'next-auth/react';
import { useAuraStore } from '@/store/aura-store';
import { Sidebar } from '@/components/aura/sidebar';
import { TopHeader } from '@/components/aura/top-header';
import { RightSidebar } from '@/components/aura/right-sidebar';
import { PulseFeed } from '@/components/aura/pulse-feed';
import { VibeCheckModal } from '@/components/aura/vibe-check-modal';
import { CreatePostModal } from '@/components/aura/create-post-modal';
import { StoryViewer } from '@/components/aura/story-viewer';
import { ShareModal } from '@/components/aura/share-modal';
import { ReelViewer } from '@/components/aura/reel-viewer';
import { LiveStreamViewer } from '@/components/aura/live-stream-viewer';
import { EditProfileModal } from '@/components/aura/edit-profile-modal';
import { ProfileSetupModal } from '@/components/aura/profile-setup-modal';
import { AuthPage } from '@/components/aura/auth-page';

import { DailyDigest, useDailyDigest } from '@/components/aura/daily-digest';
import { AppWrapper } from '@/components/aura/app-wrapper';

// Lazy-loaded route components — only loaded when user navigates to them
import dynamic from 'next/dynamic';
const PrismReels = dynamic(() => import('@/components/aura/prism-reels').then(m => ({ default: m.PrismReels })), { loading: () => <LoadingScreen /> });
const LiveFeed = dynamic(() => import('@/components/aura/live-feed').then(m => ({ default: m.LiveFeed })), { loading: () => <LoadingScreen /> });
const GameArena = dynamic(() => import('@/components/aura/game-arena').then(m => ({ default: m.GameArena })), { loading: () => <LoadingScreen /> });
const DanceChallenge = dynamic(() => import('@/components/aura/dance-challenge').then(m => ({ default: m.DanceChallenge })), { loading: () => <LoadingScreen /> });
const Explore = dynamic(() => import('@/components/aura/explore').then(m => ({ default: m.Explore })), { loading: () => <LoadingScreen /> });
const Hub = dynamic(() => import('@/components/aura/hub').then(m => ({ default: m.Hub })), { loading: () => <LoadingScreen /> });
const Messages = dynamic(() => import('@/components/aura/messages').then(m => ({ default: m.Messages })), { loading: () => <LoadingScreen /> });
const Activity = dynamic(() => import('@/components/aura/activity').then(m => ({ default: m.Activity })), { loading: () => <LoadingScreen /> });
const PostDetail = dynamic(() => import('@/components/aura/post-detail').then(m => ({ default: m.PostDetail })), { loading: () => <LoadingScreen /> });
const Profile = dynamic(() => import('@/components/aura/profile').then(m => ({ default: m.Profile })), { loading: () => <LoadingScreen /> });
const WellnessDashboard = dynamic(() => import('@/components/aura/wellness-dashboard').then(m => ({ default: m.WellnessDashboard })), { loading: () => <LoadingScreen /> });
const TokenMarketplace = dynamic(() => import('@/components/aura/token-marketplace').then(m => ({ default: m.TokenMarketplace })), { loading: () => <LoadingScreen /> });
const SettingsPage = dynamic(() => import('@/components/aura/settings-page').then(m => ({ default: m.SettingsPage })), { loading: () => <LoadingScreen /> });
const PrismCompanion = dynamic(() => import('@/components/aura/prism-companion').then(m => ({ default: m.PrismCompanion })), { ssr: false });
const PrismCompanionButton = dynamic(() => import('@/components/aura/prism-companion').then(m => ({ default: m.PrismCompanionButton })), { ssr: false });
import { Toaster } from 'sonner';
import { useEffect, useState, Component } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Single QueryClient instance — shared across the entire app.
// Created outside of React to avoid duplication with app-wrapper.tsx.
// This fixes the "friend's posts not showing" issue caused by
// two separate QueryClient instances having separate caches.
let queryClientInstance: QueryClient | null = null;
function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 15, // 15 seconds — avoids unnecessary refetches on mount
          refetchOnWindowFocus: true,
          // No default refetchInterval — let individual hooks control their own polling
          retry: 1, // Only retry once (was 2) for faster failure recovery
        },
      },
    });
  }
  return queryClientInstance;
}

// Pre-render safety: validate localStorage before React mounts.
// IMPORTANT: We do NOT clear localStorage on version changes — the Zustand merge
// function handles migrations gracefully. Clearing wipes the user's auth session,
// profile data, likes, follows, etc. Only clear for truly corrupted data.
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('aura-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only clear for the deleted user-me account — this user no longer exists
      if (parsed?.state?.currentUserId === 'user-me') {
        console.warn('ORRA: Stale user-me found in localStorage, clearing');
        localStorage.removeItem('aura-storage');
      }
      // Only clear if data is genuinely corrupted (can't be parsed at all)
      // The catch block below handles that case.
    }
  } catch (e) {
    // Only clear if localStorage is truly corrupted (unparseable JSON)
    console.warn('ORRA: Corrupted localStorage detected, clearing it');
    try { localStorage.removeItem('aura-storage'); } catch {}
  }

  // Force cache-bust: detect stale JS chunks after a new deploy.
  // When a new build is deployed, the HTML references new chunk filenames,
  // but the browser may have old HTML cached. The old HTML references
  // chunk filenames that no longer exist → 404 → app silently breaks.
  // This check fetches a tiny API endpoint to verify the server is reachable.
  (async () => {
    try {
      const res = await fetch('/api/me', { method: 'HEAD', cache: 'no-store' });
      // We don't force reload on non-200 because the /api/me might legitimately
      // return 401 for unauthenticated users. The inline script in layout.tsx
      // handles stale chunk detection via JS syntax errors instead.
    } catch {
      // Network error — server might be down, don't force reload
    }
  })();
}

// Error Boundary to catch runtime errors and auto-recover instead of showing a permanent error page
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error?: string; errorCount: number }> {
  retryTimer: ReturnType<typeof setTimeout> | null = null;
  state = { hasError: false, error: undefined as string | undefined, errorCount: 0 };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: any, info: any) {
    console.warn('ORRA ErrorBoundary caught:', error?.message || error);
    const newCount = this.state.errorCount + 1;
    this.setState({ errorCount: newCount });

    const msg = (error?.message || '').toLowerCase();
    const isChunkError = (
      msg.includes('chunk') ||
      msg.includes('loading') ||
      msg.includes('unexpected token') ||
      msg.includes('syntax') ||
      msg.includes('failed to fetch') ||
      msg.includes('import')
    );

    // If it's a chunk/stale-cache error, force a cache-bust reload immediately
    if (isChunkError) {
      console.warn('ORRA: Chunk/import error in ErrorBoundary, forcing cache-bust reload');
      setTimeout(() => {
        window.location.replace('/?_cb=' + Date.now());
      }, 1000);
      return;
    }

    // Only clear localStorage if we get repeated crashes (5+ errors)
    // This preserves user data (likes, comments, follows) during one-off errors
    if (newCount >= 5) {
      try {
        localStorage.removeItem('aura-storage');
        console.warn('Auto-cleared aura-storage after 5+ repeated errors');
      } catch {}
    }
    // After 3+ errors, force a hard page reload instead of retrying the broken state
    if (newCount >= 3) {
      console.warn('ORRA: Multiple errors detected — forcing hard reload');
      setTimeout(() => {
        window.location.replace('/?_nocache=' + Date.now());
      }, 2000);
      return;
    }
    // Force a cache-bust reload after 2 seconds — stale chunks after rebuild
    // cause cascading failures that re-rendering can't fix
    this.retryTimer = setTimeout(() => {
      window.location.replace('/?_cb=' + Date.now());
    }, 2000);
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  render() {
    if (this.state.hasError) {
      // Show a brief "Reconnecting..." message that auto-dismisses
      // instead of a permanent error page requiring manual reload
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Reconnecting...</h2>
            <p className="text-slate-400 text-sm mb-3">ORRA is refreshing. Hang tight!</p>
            <div className="w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full reconnect-progress" />
            </div>
            <button
              onClick={() => {
                // Force a hard reload with cache bust
                window.location.replace('/?_nocache=' + Date.now());
              }}
              className="mt-4 text-slate-500 text-xs hover:text-white transition-colors"
            >
              Click here if page doesn&apos;t refresh
            </button>
          </div>
          <style jsx>{`
            .reconnect-progress {
              animation: fillBar 3s linear forwards;
            }
            @keyframes fillBar {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainContent() {
  const { currentView, homeTab } = useAuraStore();

  if (currentView === 'home') {
    if (homeTab === 'prism') return <PrismReels />;
    if (homeTab === 'hub') return <Hub />;
    return <PulseFeed />;
  }

  switch (currentView) {
    case 'explore':
      return <Explore />;
    case 'reels':
      return <PrismReels />;
    case 'live':
      return <LiveFeed />;
    case 'dance':
      return <DanceChallenge />;
    case 'games':
      return <GameArena />;
    case 'hub':
      return <Hub />;
    case 'messages':
      return <Messages />;
    case 'activity':
      return <Activity />;
    case 'postDetail':
      return <PostDetail />;
    case 'profile':
      return <Profile />;
    case 'wellness':
      return <WellnessDashboard />;
    case 'marketplace':
      return <TokenMarketplace />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <PulseFeed />;
  }
}

function LoadingScreen() {
  // Auto-recover: if the app is stuck on this screen for more than 8 seconds,
  // force a cache-bust reload. This handles the case where a new deploy changes
  // JS chunk filenames but the browser has old HTML cached — the old chunks
  // return 404 and the app never loads. A single cache-bust reload fixes it.
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Only force reload if we haven't already tried a cache-bust
      const params = new URLSearchParams(window.location.search);
      if (!params.has('_cb') && !params.has('_nocache') && !params.has('_retry')) {
        window.location.replace('/?_retry=' + Date.now());
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <p className="text-slate-400 text-sm">Loading ORRA...</p>
        <p className="text-slate-600 text-xs mt-1">Echo • Pulse • Vibe</p>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const profileSetupComplete = useAuraStore((s) => s.profileSetupComplete);
  const isHydrated = useAuraStore((s) => s.isHydrated);
  const showLiveViewer = useAuraStore((s) => s.showLiveViewer);
  const currentLiveStreamId = useAuraStore((s) => s.currentLiveStreamId);
  const toggleLiveViewer = useAuraStore((s) => s.toggleLiveViewer);
  const currentView = useAuraStore((s) => s.currentView);

  // Auto-show Daily Digest once per day
  useDailyDigest();

  // Sync URL path to currentView on mount.
  // When the user refreshes on /explore, /profile, /messages, etc.,
  // the catch-all route renders this component but the Zustand store
  // might still have currentView='home'. Read the URL and set the right view.
  useEffect(() => {
    const pathMap: Record<string, string> = {
      '/explore': 'explore',
      '/reels': 'reels',
      '/live': 'live',
      '/dance': 'dance',
      '/games': 'games',
      '/hub': 'hub',
      '/messages': 'messages',
      '/activity': 'activity',
      '/profile': 'profile',
      '/wellness': 'wellness',
      '/marketplace': 'marketplace',
      '/settings': 'settings',
    };
    const path = window.location.pathname;
    const viewFromUrl = pathMap[path];
    if (viewFromUrl) {
      const currentStoreView = useAuraStore.getState().currentView;
      if (currentStoreView !== viewFromUrl) {
        console.log('ORRA: Syncing currentView from URL path:', path, '→', viewFromUrl);
        useAuraStore.getState().setView(viewFromUrl as any);
      }
    }
  }, []);

  // NOTE: User hydration is handled by StoreHydrator (via AppWrapper)
  // which calls /api/me for full user data including avatar, followers, etc.
  // StoreHydrator also has its own 4-second safety timeout.
  //
  // We keep a 3-second backup timeout here as an extra safety net.
  useEffect(() => {
    // Check daily streak on app load
    useAuraStore.getState().checkDailyStreak();

    // Backup safety timeout: if hydration hasn't completed in 2 seconds, force it
    // This ensures users are NEVER stuck on a loading screen
    const timeout = setTimeout(() => {
      if (!useAuraStore.getState().isHydrated) {
        console.warn('ORRA: Backup hydration timeout — forcing isHydrated=true');
        useAuraStore.setState({
          isHydrated: true,
          profileSetupComplete: true, // Always true — never force profile setup screen on timeout
        });
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Show profile setup modal ONLY for new users who haven't completed setup
  // Only show AFTER hydration is complete, so existing users aren't flashed this screen
  // AND only if they actually have a currentUserProfile (meaning API hydration succeeded)
  // This prevents existing users from getting stuck on profile setup if the API is slow
  if (isHydrated && !profileSetupComplete && useAuraStore.getState().currentUserProfile !== null) {
    // Double check: only show if profileSetupComplete is explicitly false in the DB
    const profile = useAuraStore.getState().currentUserProfile;
    if (profile && !(profile as any).profileSetupComplete) {
      return <ProfileSetupModal />;
    }
  }

  // While hydration is in progress, show loading
  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e8f0]">
      {/* Background gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-900/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-900/5 blur-[150px]" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="lg:ml-64 xl:mr-80 relative z-10 min-h-screen pb-20 lg:pb-4">
        <TopHeader />
        <div className={`mx-auto px-4 py-4 ${currentView === 'live' ? 'max-w-2xl' : 'max-w-3xl'}`}>
          <MainContent />
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />

      {/* Modals */}
      <VibeCheckModal />
      <CreatePostModal />
      <StoryViewer />
      <ShareModal />
      <ReelViewer />
      <LiveStreamViewer
        open={showLiveViewer}
        onClose={() => toggleLiveViewer()}
        streamId={currentLiveStreamId}
      />
      <EditProfileModal />

      {/* Daily Digest Popup */}
      <DailyDigest />

      {/* Prism AI Companion */}
      <PrismCompanion />

      {/* Toast Notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'rgba(17, 25, 40, 0.9)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#e2e8f0',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
          },
        }}
        theme="dark"
      />

      {/* Floating Prism AI Button */}
      <PrismCompanionButton />
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const queryClient = getQueryClient();
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

  const isAuthenticated = status === 'authenticated' && session;

  // Safety timeout: if session check takes longer than 3 seconds, check for cookie
  // If a session cookie exists, assume authenticated and proceed — avoids users
  // getting stuck on loading screen if NextAuth API is slow/unreachable
  useEffect(() => {
    if (status === 'loading') {
      const timeout = setTimeout(() => {
        const hasSessionCookie = document.cookie.includes('next-auth.session-token');
        if (hasSessionCookie) {
          console.warn('ORRA: Session check timed out but cookie exists — proceeding as authenticated');
          setSessionTimedOut(true);
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  // Show loading screen while session is being verified.
  // This prevents the login page from flashing for already-authenticated users
  // on every page reload. The session check typically takes <500ms.
  if (status === 'loading' && !sessionTimedOut) {
    return <LoadingScreen />;
  }

  // If session timed out but cookie exists, treat as authenticated
  const shouldShowApp = isAuthenticated || sessionTimedOut;

  if (!shouldShowApp) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthPage />
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppWrapper>
          <AuthenticatedApp />
        </AppWrapper>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Export the Prism companion button for use in sidebar
export { PrismCompanionButton };
