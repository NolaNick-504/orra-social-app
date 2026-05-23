'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0} // Disable automatic refetch — prevents mid-session flicker
      // When refetch fails (network blip), status briefly becomes 'loading' or 'unauthenticated',
      // which triggers the loading screen or auth page. This is disorienting for users.
      // Session will still be validated on page refresh and navigation.
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}
