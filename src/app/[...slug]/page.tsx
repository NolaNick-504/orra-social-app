'use client';

// Catch-all route for SPA paths (/explore, /profile, /messages, etc.)
// ORRA is a Single-Page App — all navigation is client-side state.
// This route exists so Next.js recognizes these paths as valid routes,
// preventing the client-side router from showing a 404/not-found page.

// We dynamically import the Home component to avoid module conflicts
// that can cause 307 redirects when using static re-exports.
import dynamic from 'next/dynamic';

const SpaPage = dynamic(
  () => import('../page').then(mod => mod.default),
  { ssr: true }
);

export default function CatchAllPage() {
  return <SpaPage />;
}
