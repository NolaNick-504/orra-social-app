'use client';

// Catch-all SPA route — renders the same app as /.
// This prevents 404s when the browser navigates to any path
// that doesn't have a dedicated route file (e.g., /@username,
// /some-deep-link, etc.). The AuthenticatedApp component reads
// window.location.pathname and sets the correct currentView in Zustand.
import Home from '../page';

export default function CatchAllPage() {
  return <Home />;
}
