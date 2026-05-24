'use client';

import { notFound } from 'next/navigation';
import Home from '../page';

// Catch-all SPA route — renders the same app as /.
// This prevents 404s when the browser navigates to any path
// that doesn't have a dedicated route file (e.g., /@username,
// /some-deep-link, etc.). The AuthenticatedApp component reads
// window.location.pathname and sets the correct currentView in Zustand.
//
// CRITICAL: We must NOT serve HTML for paths under /_next/ because:
// 1. When a stale/non-existent JS chunk is requested, Next.js static file
//    serving doesn't find it, so it falls through to this catch-all route.
// 2. This route returns HTML with Content-Type: text/html and status 200.
// 3. The browser tries to parse the HTML as JavaScript → crash.
// 4. This is the #1 cause of the "Something went wrong" error cascade.
// Fix: Return 404 for any /_next/ path that reaches this route.
export default function CatchAllPage({ params }: { params: { slug: string[] } }) {
  // If the first segment is _next, this is a non-existent static resource.
  // The real static files are served by Next.js before reaching this route.
  // Anything under /_next/ that reaches here is a 404.
  if (params.slug && params.slug[0] === '_next') {
    notFound();
  }

  return <Home />;
}
