'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useAuraStore, type CurrentUser } from '@/store/aura-store';
import { messages as messagesData } from '@/lib/data';

// NOTE: React Query provider is now in page.tsx (single source of truth).
// We removed the duplicate QueryClientProvider from here to prevent
// race conditions and cache misses between two separate QueryClient instances.

function StoreHydrator({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const {
    hydrateFromAPI,
    setCurrentUser,
    isHydrated,
    currentUserId,
    checkDailyStreak,
  } = useAuraStore();
  const hasFetched = useRef(false);
  const hydrationAttempted = useRef(false);

  useEffect(() => {
    // Only fetch if authenticated and haven't already hydrated for this user
    if (status !== 'authenticated' || !session?.user) return;
    if (hasFetched.current && isHydrated) return;

    const userId = (session.user as Record<string, unknown>).id as string;

    // If already hydrated for this user, skip
    if (isHydrated && currentUserId === userId) return;

    hasFetched.current = true;
    hydrationAttempted.current = true;

    async function fetchAndHydrate() {
      try {
        // Use the /api/me endpoint for efficient single-request hydration
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const res = await fetch('/api/me', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          console.warn('/api/me returned status:', res.status);
          // If user not found (DB was reset), force sign out so user can re-login
          // BUT: only do this for genuine 404s, not network/proxy timeouts
          // that return non-200 status codes temporarily.
          if (res.status === 404) {
            // Check if this is a real 404 from our API (has JSON body with error)
            // vs a proxy/gateway 404 (has HTML body)
            try {
              const cloned = res.clone();
              const body = await cloned.text();
              if (body.includes('"success"') || body.includes('"error"')) {
                // This is our API returning a proper JSON 404 — user genuinely doesn't exist
                console.warn('ORRA: User not found in DB — forcing sign out for re-login');
                try { await signOut({ redirect: false }); } catch {}
                useAuraStore.setState({ isHydrated: false, profileSetupComplete: false });
                localStorage.removeItem('aura-storage');
                return;
              }
            } catch {}
            // Not our API 404 — probably a proxy timeout. Use fallback instead.
            console.warn('ORRA: 404 from proxy/gateway, using fallback hydration');
            hydrateFromFallback();
            return;
          }
          // 5xx, timeout, etc. — use fallback, don't sign out
          hydrateFromFallback();
          return;
        }

        const result = await res.json();

        if (!result.success) {
          console.warn('Failed to fetch user state:', result.error);
          hydrateFromFallback();
          return;
        }

        const data = result.data;
        const user = data.user;

        // Map API user data to CurrentUser format
        const currentUser: CurrentUser & { profileSetupComplete?: boolean } = {
          id: user.id,
          name: user.name,
          handle: user.handle,
          email: user.email,
          avatar: user.avatar || '/api/uploads?path=images/orra-logo.png',
          coverImage: user.coverImage || '/api/uploads?path=images/profile-cover.png',
          bio: user.bio || '',
          location: user.location || '',
          website: user.website || '',
          verified: user.verified || false,
          online: user.online || false,
          auraTokens: user.auraTokens || 100,
          auraLevel: user.auraLevel || 1,
          auraXP: user.auraXP || 50,
          dailyStreak: user.dailyStreak || 0,
          badges: user.badges || '[]',
          followers: user._count?.followers || 0,
          following: user._count?.follows || 0,
          posts: user._count?.posts || 0,
          joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
          profileSetupComplete: user.profileSetupComplete || false,
          profileSongUrl: user.profileSongUrl || '',
          profileSongTitle: user.profileSongTitle || '',
          profileSongArtist: user.profileSongArtist || '',
        };

        // Hydrate the store with all API data
        hydrateFromAPI({
          user: currentUser,
          likedPosts: data.likedPostIds || [],
          likedReels: data.likedReelIds || [],
          postReactions: data.postReactions || {},
          followedUsers: data.followedUserIds || [],
          savedPosts: data.savedPostIds || [],
          savedReels: data.savedReelIds || [],
          repostIds: data.repostedIds || [],
          joinedHubs: data.joinedHubIds || [],
          votedEntries: data.votedEntryIds || [],
          followedHubs: [],
          viewedStories: [],
          viewedReels: [],
        });

        // Update unread messages
        if (data.unreadMessages && Object.keys(data.unreadMessages).length > 0) {
          useAuraStore.setState({ unreadMessages: data.unreadMessages });
        }

        // Check daily streak
        checkDailyStreak();

      } catch (error: any) {
        console.warn('Failed to hydrate store from API:', error?.message || error);
        hydrateFromFallback();
      }
    }

    function hydrateFromFallback() {
      // ALWAYS set isHydrated=true so the user is NEVER stuck on loading
      if (session?.user) {
        const userId = (session.user as Record<string, unknown>).id as string || '';
        const fallbackUser: CurrentUser = {
          id: userId,
          name: session.user.name || '',
          handle: ((session.user as Record<string, unknown>).handle as string) || '',
          email: session.user.email || '',
          avatar: ((session.user as Record<string, unknown>).avatar as string) || '/api/uploads?path=images/orra-logo.png',
          coverImage: '/api/uploads?path=images/profile-cover.png',
          bio: ((session.user as Record<string, unknown>).bio as string) || '',
          location: ((session.user as Record<string, unknown>).location as string) || '',
          website: ((session.user as Record<string, unknown>).website as string) || '',
          verified: false,
          online: true,
          auraTokens: ((session.user as Record<string, unknown>).auraTokens as number) || 0,
          auraLevel: ((session.user as Record<string, unknown>).auraLevel as number) || 1,
          auraXP: 0,
          dailyStreak: 0,
          badges: '[]',
          followers: 0,
          following: 0,
          posts: 0,
          joinDate: '',
          profileSetupComplete: true, // Don't force profile setup on fallback
        };
        // Use setCurrentUser which also sets isHydrated + profileSetupComplete
        setCurrentUser(fallbackUser);
        // Ensure isHydrated is always set even if setCurrentUser somehow fails
        if (!useAuraStore.getState().isHydrated) {
          useAuraStore.setState({ isHydrated: true, profileSetupComplete: true });
        }
      } else {
        // No session at all — just force hydration so user sees something
        useAuraStore.setState({ isHydrated: true, profileSetupComplete: true });
      }
    }

    fetchAndHydrate();
  }, [status, session, hydrateFromAPI, setCurrentUser, isHydrated, currentUserId, checkDailyStreak]);

  // Initialize unread messages from data on first load (fallback)
  useEffect(() => {
    const store = useAuraStore.getState();
    if (!store.unreadMessages || Object.keys(store.unreadMessages).length === 0) {
      const initial: Record<string, number> = {};
      messagesData.forEach((m) => {
        initial[m.id] = m.unread;
      });
      useAuraStore.setState({ unreadMessages: initial });
    }
  }, []);

  // Reset store when user signs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      const store = useAuraStore.getState();
      if (store.isHydrated) {
        store.resetStore();
        hasFetched.current = false;
        hydrationAttempted.current = false;
      }
    }
  }, [status]);

  // SAFETY NET: If hydration hasn't completed after 1 second, force isHydrated=true
  // so the user is NEVER stuck on a loading screen. The app shows skeleton content
  // while !isHydrated, so we want to transition to real content ASAP.
  // The real API data will arrive shortly after and populate the profile correctly.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const timeout = setTimeout(() => {
      const store = useAuraStore.getState();
      if (!store.isHydrated) {
        console.warn('ORRA: Hydration timeout in StoreHydrator — forcing isHydrated=true without fallback user');
        useAuraStore.setState({ isHydrated: true, profileSetupComplete: true });
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [status]);

  return <>{children}</>;
}

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StoreHydrator>
      {children}
    </StoreHydrator>
  );
}
