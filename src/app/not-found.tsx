'use client';

// Root not-found page.
// This should almost never be seen because:
// 1. The catch-all route app/[...slug]/page.tsx handles all SPA paths
// 2. The [..slug]/not-found.tsx renders the app even if the router gets confused
//
// But as a final safety net, if someone lands on a truly unknown path,
// render the full app. The AuthenticatedApp component will sync the URL
// and show the correct view, or default to the home feed.
import Home from './page';

export default function RootNotFound() {
  return <Home />;
}
