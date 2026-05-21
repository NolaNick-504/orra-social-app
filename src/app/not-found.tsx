'use client';

import { useEffect } from 'react';

// This page should almost never be seen because:
// 1. The catch-all route app/[...slug]/page.tsx handles all SPA paths
// 2. PM2 auto-restarts the server if it crashes
//
// But as a safety net, if someone somehow lands here,
// redirect them to the root which always works.
export default function NotFound() {
  useEffect(() => {
    // Use replace so the 404 URL doesn't stay in browser history
    window.location.replace('/');
  }, []);

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="0;url=/" />
        <title>Redirecting to ORRA...</title>
      </head>
      <body style={{ background: '#050505', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <p>Redirecting to <a href="/" style={{ color: '#8b5cf6' }}>ORRA</a>...</p>
        </div>
        <script dangerouslySetInnerHTML={{ __html: 'window.location.replace("/");' }} />
      </body>
    </html>
  );
}
