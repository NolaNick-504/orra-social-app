'use client';

// SPA route — renders the same app as /.
// The AuthenticatedApp component reads window.location.pathname
// and sets the correct currentView in Zustand.
import Home from '../page';

export default function SpaPage() {
  return <Home />;
}
