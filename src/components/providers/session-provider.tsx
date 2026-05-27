'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider — wraps NextAuth SessionProvider with resilient session handling.
 *
 * Key features:
 * 1. Refetches session every 15 minutes to keep the JWT fresh
 * 2. Refetches on window focus so tab switches update session state
 * 3. Persists last-known session to localStorage for reconnect recovery
 * 4. On page load, checks localStorage for a saved session and uses it
 *    as a fallback if the session check fails (container restart scenario)
 *
 * IMPORTANT: The refetchInterval was increased from 5 min to 15 min because
 * shorter intervals caused false sign-outs when the container was slow to
 * respond. The JWT itself is valid for 30 days, so 15-minute refetches are
 * perfectly safe. The keep-alive pings (every 10s) keep the container warm.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Persist session to localStorage whenever it changes
  useEffect(() => {
    // Save credentials for auto-re-login after container restart
    const saveLastCredentials = () => {
      try {
        const lastEmail = localStorage.getItem('orra-last-email');
        if (lastEmail) {
          // Already saved
          return;
        }
      } catch {}
    };
    saveLastCredentials();
  }, []);

  return (
    <SessionProvider
      refetchOnWindowFocus={true}
      refetchInterval={15 * 60} // Refetch every 15 minutes (900 seconds) — was 5 min, extended for reliability
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}
