'use client';

import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Safety net: redirect to home — this page should almost never be seen
    // because the middleware rewrites all non-root paths to the root page
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
