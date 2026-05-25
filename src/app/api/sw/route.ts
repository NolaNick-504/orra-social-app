// This route is NO LONGER used to serve the service worker.
// The /sw.js rewrite was removed from next.config.ts because it was replacing
// the useful v8 SW (public/sw.js) with a self-destruct SW that cleared all
// caches and unregistered itself, causing loading screen freezes.
//
// The v8 SW in public/sw.js is now served directly with no-cache headers
// configured in next.config.ts headers().
//
// This route redirects any direct /api/sw requests to /sw.js for safety.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect(new URL('/sw.js', 'http://localhost:3000'));
}
