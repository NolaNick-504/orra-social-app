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
import { useEffect, useState, Component, useRef } from 'react';
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
    // JSON parse failed — localStorage is genuinely corrupted.
    // Only remove the aura-storage key, never wipe ALL localStorage.
    console.warn('ORRA: Corrupted aura-storage detected, removing it');
    try { localStorage.removeItem('aura-storage'); } catch {}
  }
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
      msg.includes('loading chunk') ||
      msg.includes('chunk load') ||
      msg.includes('unexpected token') ||
      msg.includes('failed to fetch dynamically imported module')
    );

    // Only clear localStorage if we get repeated crashes (10+ errors)
    // This is a last resort — clearing localStorage wipes the user's session
    if (newCount >= 10) {
      try {
        localStorage.removeItem('aura-storage');
        console.warn('Auto-cleared aura-storage after 10+ repeated errors');
      } catch {}
    }
    // Show the reconnect screen but DON'T auto-reload
    // The user can click the button to manually reload
    // NO automatic reloads — they cause infinite loops and data loss
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-4">ORRA hit a snag. Tap below to refresh.</p>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              Refresh ORRA
            </button>
          </div>
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
  // NOTE: Removed auto-reload on loading screen timeout.
  // The previous 8-second force-reload caused infinite reload loops
  // when combined with the ErrorBoundary and build ID checks.
  // If the app is truly stuck loading, the user can manually refresh.

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

function SkeletonContent() {
  // Lightweight skeleton shown while hydrating — shows the app shell structure immediately
  return (
    <div className="space-y-4 p-4">
      <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
      <div className="space-y-3">
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
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

  // Failsafe hydration timeout: 1 second MAX
  // After 1s, force isHydrated=true so the user is NEVER stuck on a skeleton screen
  useEffect(() => {
    useAuraStore.getState().checkDailyStreak();

    const timeout = setTimeout(() => {
      if (!useAuraStore.getState().isHydrated) {
        console.warn('ORRA: Backup hydration timeout — forcing isHydrated=true');
        useAuraStore.setState({
          isHydrated: true,
          profileSetupComplete: true,
        });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Show profile setup modal ONLY for new users who haven't completed setup
  if (isHydrated && !profileSetupComplete && useAuraStore.getState().currentUserProfile !== null) {
    const profile = useAuraStore.getState().currentUserProfile;
    if (profile && !(profile as any).profileSetupComplete) {
      return <ProfileSetupModal />;
    }
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
          {/* Show skeleton while hydrating, real content once done */}
          {isHydrated ? (
            <ErrorBoundary>
              <MainContent />
            </ErrorBoundary>
          ) : (
            <SkeletonContent />
          )}
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
        duration={2300}
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

  // Determine if the initial session check is done.
  // Key insight: during a session refetch, `status` briefly goes back to 'loading',
  // but `session` retains its previous value. So we check both:
  // - If status is not 'loading', the check is done
  // - If we still have a session from a previous check, the initial check was done
  // This prevents the UI from flickering to a loading screen during refetches.
  const initialCheckDone = status !== 'loading' || !!session || sessionTimedOut;

  // Safety timeout: if session check takes longer than 800ms, proceed anyway.
  // The app should NEVER show a blank screen for more than 800ms.
  // If we have a session cookie, treat as authenticated. If not, show auth page.
  useEffect(() => {
    if (status === 'loading' && !sessionTimedOut) {
      const timeout = setTimeout(() => {
        if (!sessionTimedOut) {
          console.warn('ORRA: Session check timed out — proceeding');
          setSessionTimedOut(true);
        }
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [status, sessionTimedOut]);

  // If the initial session check hasn't completed yet, show the ORRA logo
  // spinner — but ONLY for a maximum of 800ms. After that, we proceed.
  if (!initialCheckDone) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading ORRA...</p>
        </div>
      </div>
    );
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
