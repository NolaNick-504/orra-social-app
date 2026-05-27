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
// Uses retryDynamicImport which automatically retries failed imports (e.g., when
// the network connection drops after idle time). This prevents the "Something went wrong"
// screen when the proxy times out and the user navigates to a new section.
import dynamic from 'next/dynamic';

// Auto-reloading loading screen for dynamic imports
// If a component takes more than 15 seconds to load (stale chunks, server down),
// force a full page reload to get fresh HTML with correct chunk references.
function LoadingScreen() {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('ORRA: Component still loading after 15s — forcing page reload');
      window.location.replace('/?_cb=' + Date.now());
    }, 15000);
    return () => clearTimeout(timer);
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

// Retry wrapper for dynamic imports — retries up to 3 times with increasing delay
// when the import fails (network timeout, proxy drop, chunk load error, etc.)
// If all retries fail, forces a full page reload to get fresh HTML+chunks.
function retryImport(importFn: () => Promise<any>, retries: number = 3, delayMs: number = 2000): () => Promise<any> {
  return () => new Promise((resolve, _reject) => {
    let attempt = 0;
    function tryImport() {
      attempt++;
      importFn()
        .then(resolve)
        .catch((err: any) => {
          const msg = (err?.message || '').toLowerCase();
          const isRetryable = (
            msg.includes('failed to fetch') ||
            msg.includes('loading chunk') ||
            msg.includes('chunk load') ||
            msg.includes('dynamically imported module') ||
            msg.includes('network') ||
            msg.includes('timeout')
          );
          if (isRetryable && attempt < retries) {
            console.warn(`ORRA: Import failed (attempt ${attempt}/${retries}), retrying...`, err?.message);
            setTimeout(tryImport, delayMs * attempt);
          } else {
            // All retries exhausted — force a full page reload to get fresh HTML+chunks
            console.error('ORRA: All import retries failed, forcing page reload');
            window.location.replace('/?_cb=' + Date.now());
          }
        });
    }
    tryImport();
  });
}

const PrismReels = dynamic(retryImport(() => import('@/components/aura/prism-reels').then(m => ({ default: m.PrismReels }))), { loading: () => <LoadingScreen /> });
const LiveFeed = dynamic(retryImport(() => import('@/components/aura/live-feed').then(m => ({ default: m.LiveFeed }))), { loading: () => <LoadingScreen /> });
const GameArena = dynamic(retryImport(() => import('@/components/aura/game-arena').then(m => ({ default: m.GameArena }))), { loading: () => <LoadingScreen /> });
const DanceChallenge = dynamic(retryImport(() => import('@/components/aura/dance-challenge').then(m => ({ default: m.DanceChallenge }))), { loading: () => <LoadingScreen /> });
const Explore = dynamic(retryImport(() => import('@/components/aura/explore').then(m => ({ default: m.Explore }))), { loading: () => <LoadingScreen /> });
const Hub = dynamic(retryImport(() => import('@/components/aura/hub').then(m => ({ default: m.Hub }))), { loading: () => <LoadingScreen /> });
const Messages = dynamic(retryImport(() => import('@/components/aura/messages').then(m => ({ default: m.Messages }))), { loading: () => <LoadingScreen /> });
const Activity = dynamic(retryImport(() => import('@/components/aura/activity').then(m => ({ default: m.Activity }))), { loading: () => <LoadingScreen /> });
const PostDetail = dynamic(retryImport(() => import('@/components/aura/post-detail').then(m => ({ default: m.PostDetail }))), { loading: () => <LoadingScreen /> });
const Profile = dynamic(retryImport(() => import('@/components/aura/profile').then(m => ({ default: m.Profile }))), { loading: () => <LoadingScreen /> });
const WellnessDashboard = dynamic(retryImport(() => import('@/components/aura/wellness-dashboard').then(m => ({ default: m.WellnessDashboard }))), { loading: () => <LoadingScreen /> });
const TokenMarketplace = dynamic(retryImport(() => import('@/components/aura/token-marketplace').then(m => ({ default: m.TokenMarketplace }))), { loading: () => <LoadingScreen /> });
const SettingsPage = dynamic(retryImport(() => import('@/components/aura/settings-page').then(m => ({ default: m.SettingsPage }))), { loading: () => <LoadingScreen /> });
const PrismCompanion = dynamic(retryImport(() => import('@/components/aura/prism-companion').then(m => ({ default: m.PrismCompanion }))), { ssr: false });
const PrismCompanionButton = dynamic(retryImport(() => import('@/components/aura/prism-companion').then(m => ({ default: m.PrismCompanionButton }))), { ssr: false });
import { Toaster } from 'sonner';
import React, { useEffect, useState, Component, useRef } from 'react';
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

// Error Boundary — auto-recovers from transient errors instead of showing a dead error page
// After 3 seconds, it auto-retries by clearing the error state.
// If errors keep happening (5+ in a row), it shows a manual reload button.
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error?: string; errorCount: number; autoRecovering: boolean }> {
  retryTimer: ReturnType<typeof setTimeout> | null = null;
  state = { hasError: false, error: undefined as string | undefined, errorCount: 0, autoRecovering: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: any, info: any) {
    console.warn('ORRA ErrorBoundary caught:', error?.message || error);
    const newCount = this.state.errorCount + 1;
    this.setState({ errorCount: newCount });

    // Auto-recover after a short delay (unless we've crashed 5+ times in a row)
    if (newCount < 5) {
      this.setState({ autoRecovering: true });
      this.retryTimer = setTimeout(() => {
        console.log('ORRA: Auto-recovering from error (attempt', newCount, ')');
        this.setState({ hasError: false, autoRecovering: false });
      }, 3000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  handleManualRetry = () => {
    this.setState({ hasError: false, errorCount: 0, autoRecovering: false });
  };

  handleFullReload = () => {
    window.location.href = '/?_cb=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      const isTransient = this.state.errorCount < 5;
      const msg = (this.state.error || '').toLowerCase();
      const isNetworkError = (
        msg.includes('failed to fetch') ||
        msg.includes('network') ||
        msg.includes('load') ||
        msg.includes('chunk') ||
        msg.includes('timeout') ||
        msg.includes('abort')
      );

      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            {this.state.autoRecovering ? (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Reconnecting...</h2>
                <p className="text-slate-400 text-sm mb-4">
                  {isNetworkError ? 'Network hiccup — ORRA is auto-recovering' : 'ORRA hit a snag — auto-recovering'}
                </p>
                <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-slate-400 text-sm mb-4">ORRA hit a snag. Tap below to refresh.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={this.handleManualRetry}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/30 transition-all"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-1" /> Try Again
                  </button>
                  <button
                    onClick={this.handleFullReload}
                    className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all"
                  >
                    Reload ORRA
                  </button>
                </div>
              </>
            )}
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
  const [autoReloginAttempted, setAutoReloginAttempted] = useState(false);

  const isAuthenticated = status === 'authenticated' && session;

  // Track if the user was EVER authenticated this session.
  // This prevents NextAuth's update() call from briefly setting status
  // to 'unauthenticated' (during session refresh), which would flash the login page.
  // Once authenticated, we stay showing the app unless the user explicitly signs out
  // OR the session is unauthenticated for more than 15 seconds (handled in app-wrapper.tsx).
  // We also persist this in sessionStorage so it survives page reloads within the same tab.
  const [wasAuthenticated, setWasAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return sessionStorage.getItem('orra-was-auth') === 'true'; } catch { return false; }
    }
    return false;
  });
  useEffect(() => {
    if (isAuthenticated) {
      setWasAuthenticated(true);
      try { sessionStorage.setItem('orra-was-auth', 'true'); } catch {}
    }
  }, [isAuthenticated]);

  // Check if a session cookie exists — this tells us the user might be authenticated
  // even if the session API is slow or times out. This prevents unauthenticated users
  // from being shown the AuthenticatedApp (with skeleton content that never resolves)
  // when the session check times out.
  const [hasSessionCookie, setHasSessionCookie] = useState(false);
  useEffect(() => {
    // Check document.cookie for the NextAuth session token
    // This is only available on the client side
    const cookieExists = document.cookie.includes('next-auth.session-token=');
    if (cookieExists) setHasSessionCookie(true);
  }, []);

  // Determine if the initial session check is done.
  // Key insight: during a session refetch, `status` briefly goes back to 'loading',
  // but `session` retains its previous value. So we check both:
  // - If status is not 'loading', the check is done
  // - If we still have a session from a previous check, the initial check was done
  // This prevents the UI from flickering to a loading screen during refetches.
  const initialCheckDone = status !== 'loading' || !!session || sessionTimedOut;

  // Safety timeout: if session check takes longer than 10 seconds, proceed anyway.
  // Extended from 5s to 10s to accommodate slower container restarts.
  // The app should NEVER show a blank screen for more than 10 seconds.
  // If we have a session cookie, treat as authenticated. If not, show auth page.
  useEffect(() => {
    if (status === 'loading' && !sessionTimedOut) {
      const timeout = setTimeout(() => {
        if (!sessionTimedOut) {
          console.warn('ORRA: Session check timed out — proceeding');
          setSessionTimedOut(true);
        }
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [status, sessionTimedOut]);

  // Auto-re-login: When session becomes unauthenticated (e.g., after container restart),
  // check localStorage for saved credentials and automatically try to re-login.
  // This prevents users from being kicked to the login page when the server restarts.
  useEffect(() => {
    if (status !== 'unauthenticated' || autoReloginAttempted) return;

    const attemptAutoRelogin = async () => {
      try {
        const savedEmail = localStorage.getItem('orra-last-email');
        const savedPassword = localStorage.getItem('orra-last-password');

        if (!savedEmail || !savedPassword) {
          setAutoReloginAttempted(true);
          return;
        }

        console.warn('ORRA: Session lost — attempting auto-re-login for', savedEmail);
        setAutoReloginAttempted(true);

        // Try to re-login with saved credentials
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: savedEmail, password: savedPassword }),
        });

        const data = await res.json();
        if (data.success) {
          console.warn('ORRA: Auto-re-login successful — reloading');
          // Small delay to let the session cookie propagate
          setTimeout(() => window.location.reload(), 300);
        } else {
          console.warn('ORRA: Auto-re-login failed — clearing saved credentials');
          localStorage.removeItem('orra-last-email');
          localStorage.removeItem('orra-last-password');
        }
      } catch (err) {
        console.warn('ORRA: Auto-re-login error:', err);
        // Network error — server might still be waking up, don't clear credentials
        // The user will see the login page and can try again
      }
    };

    attemptAutoRelogin();
  }, [status, autoReloginAttempted]);

  // If the initial session check hasn't completed yet, show the ORRA logo
  // spinner — but ONLY for a maximum of 5 seconds. After that, we proceed.
  // Safety: if stuck for 15 seconds, force a full page reload.
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

  // Show the authenticated app ONLY if:
  // 1. The user is actually authenticated (session exists), OR
  // 2. The user was previously authenticated in this session (prevents flicker during session refresh), OR
  // 3. The session check timed out BUT a session cookie exists (user is likely authenticated, API is just slow)
  //
  // CRITICAL: We do NOT use sessionTimedOut alone to bypass auth. If the session API
  // times out and there's no session cookie, the user is not authenticated and should
  // see the AuthPage (login form), NOT the AuthenticatedApp (which would show skeleton
  // content that never resolves = "just load screen" bug).
  const shouldShowApp = isAuthenticated || wasAuthenticated || (sessionTimedOut && hasSessionCookie);

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
