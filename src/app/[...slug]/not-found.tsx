'use client';

// Prevent 404 within the catch-all SPA route.
// If the Next.js client router tries to render not-found for any
// SPA path (/explore, /profile, /messages), we render the app
// instead. The AuthenticatedApp component reads the URL path
// and sets the correct currentView in Zustand.
import Home from '../page';

export default function SlugNotFound() {
  return <Home />;
}
