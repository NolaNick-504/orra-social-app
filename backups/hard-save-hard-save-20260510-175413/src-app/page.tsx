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
import { EditProfileModal } from '@/components/aura/edit-profile-modal';
import { ProfileSetupModal } from '@/components/aura/profile-setup-modal';
import { AuthPage } from '@/components/aura/auth-page';

import { DailyDigest, useDailyDigest } from '@/components/aura/daily-digest';
import { AppWrapper } from '@/components/aura/app-wrapper';

// Lazy-loaded route components — only loaded when user navigates to them
import dynamic from 'next/dynamic';
const PrismReels = dynamic(() => import('@/components/aura/prism-reels').then(m => ({ default: m.PrismReels })), { loading: () => <LoadingScreen /> });
const GameArena = dynamic(() => import('@/components/aura/game-arena').then(m => ({ default: m.GameArena })), { loading: () => <LoadingScreen /> });
const DanceChallenge = dynamic(() => import('@/components/aura/dance-challenge').then(m => ({ default: m.DanceChallenge })), { loading: () => <LoadingScreen /> });
const Explore = dynamic(() => import('@/components/aura/explore').then(m => ({ default: m.Explore })), { loading: () => <LoadingScreen /> });
const Hub = dynamic(() => import('@/components/aura/hub').then(m => ({ default: m.Hub })), { loading: () => <LoadingScreen /> });
const Messages = dynamic(() => import('@/components/aura/messages').then(m => ({ default: m.Messages })), { loading: () => <LoadingScreen /> });
const Activity = dynamic(() => import('@/components/aura/activity').then(m => ({ default: m.Activity })), { loading: () => <LoadingScreen /> });
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

// Pre-render safety: clear corrupted or outdated localStorage before React even mounts
// This prevents crashes on mobile where localStorage data can become corrupted
// OR when the data model changes (e.g. removing user-me, adding new demo accounts)
const ORRA_STORAGE_VERSION = 8; // Must match the version in aura-store.ts partialize function
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('aura-storage');
    if (stored) {
      // Quick validation: if it can't be parsed, clear it
      const parsed = JSON.parse(stored);
      // Version check: if the stored version doesn't match, clear everything
      const storedVersion = parsed?.version ?? 1;
      if (storedVersion < ORRA_STORAGE_VERSION) {
        console.warn('ORRA: Storage version outdated (v' + storedVersion + ' < v' + ORRA_STORAGE_VERSION + '), clearing');
        localStorage.removeItem('aura-storage');
      }
      // Also clear if the stored userId references a deleted user (user-me was removed)
      if (parsed?.state?.currentUserId === 'user-me') {
        console.warn('ORRA: Stale user-me found in localStorage, clearing');
        localStorage.removeItem('aura-storage');
      }
    }
  } catch (e) {
    console.warn('ORRA: Corrupted localStorage detected, clearing it');
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
    // Only clear localStorage if we get repeated crashes (3+ errors)
    // This preserves user data (likes, comments, follows) during one-off errors
    if (newCount >= 3) {
      try {
        localStorage.removeItem('aura-storage');
        console.warn('Auto-cleared aura-storage after 3+ repeated errors');
      } catch {}
    }
    // After 2+ errors, force a hard page reload instead of retrying the broken state
    // This breaks the "Reconnecting..." infinite loop that happens when browser cache is stale
    if (newCount >= 2) {
      console.warn('ORRA: Multiple errors detected — forcing hard reload');
      setTimeout(() => {
        window.location.href = window.location.pathname + '?_nocache=' + Date.now();
      }, 2000);
      return;
    }
    // Auto-retry after 3 seconds for first error — most errors after a rebuild/restart are transient
    this.retryTimer = setTimeout(() => {
      this.setState({ hasError: false });
    }, 3000);
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
                window.location.href = window.location.pathname + '?_nocache=' + Date.now();
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

function AuthenticatedApp() {
  const profileSetupComplete = useAuraStore((s) => s.profileSetupComplete);
  const isHydrated = useAuraStore((s) => s.isHydrated);

  // Auto-show Daily Digest once per day
  useDailyDigest();

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
      <main className="lg:ml-64 xl:mr-80 relative z-10 min-h-screen pb-16 lg:pb-4">
        <TopHeader />
        <div className="max-w-3xl mx-auto px-4 py-4">
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
  const [sessionTimedOut, setSessionTimedOut] = useState(false);
  const queryClient = getQueryClient();

  // Safety: if session takes more than 1.5 seconds to resolve, treat as unauthenticated
  // This prevents a blank screen if NextAuth can't reach the server
  useEffect(() => {
    if (status === 'loading') {
      const timer = setTimeout(() => {
        console.warn('Session loading timed out — showing auth page');
        setSessionTimedOut(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      // Session resolved — reset timeout flag
      setSessionTimedOut(false);
    }
  }, [status]);

  // If session is still loading and hasn't timed out, show loading
  if (status === 'loading' && !sessionTimedOut) {
    return <LoadingScreen />;
  }

  // If session timed out, treat as unauthenticated (show login page)
  const isAuthenticated = status === 'authenticated' && session;

  if (!isAuthenticated) {
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
