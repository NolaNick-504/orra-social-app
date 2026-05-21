// Catch-all route for SPA paths (/explore, /profile, /messages, etc.)
// ORRA is a Single-Page App — all navigation is client-side state.
// This route exists so Next.js recognizes these paths as valid routes,
// preventing the client-side router from showing a 404/not-found page.
//
// IMPORTANT: This MUST NOT be a 'use client' component. If it is,
// the RSC flight data includes the URL path segment ("explore", "profile"),
// and the client-side router tries to resolve it as a static route,
// failing and showing 404. By keeping this as a server component that
// re-renders the Home page, the client receives the same HTML as /,
// and the AuthenticatedApp component reads the URL to set currentView.
import Home from '../page';

export default function CatchAllPage() {
  return <Home />;
}
