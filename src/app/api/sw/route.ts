// ORRA Self-Destructing Service Worker v200
// Served via API route so we can fully control Cache-Control headers.
// When the browser checks for SW updates on navigation, it installs this
// which immediately clears all caches and unregisters itself.

const SW_CODE = `
// ORRA Service Worker v200 — Self-Destruct Edition
const SW_VERSION = 'orra-v200-self-destruct';

self.addEventListener('install', (event) => {
  console.log('[ORRA SW] Installing self-destruct SW v200');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ORRA SW] Activating self-destruct SW v200 — cleaning up!');
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[ORRA SW] All caches cleared');
      } catch (e) {}

      try {
        await self.registration.unregister();
        console.log('[ORRA SW] Self-unregistered');
      } catch (e) {}

      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => new Response('Offline', { status: 503 }))
  );
});
`;

export async function GET() {
  // Use raw Response instead of NextResponse to avoid Next.js adding default Cache-Control
  return new Response(SW_CODE, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Service-Worker-Allowed': '/',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Force this route to be dynamic — never cached by Next.js itself
export const dynamic = 'force-dynamic';
