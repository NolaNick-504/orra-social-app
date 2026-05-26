'use client';

// Catch-all not-found — if Next.js somehow reaches this,
// redirect to the root URL where the SPA lives.
import { useEffect } from 'react';
import Home from '../page';

export default function CatchAllNotFound() {
  useEffect(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  return <Home />;
}
