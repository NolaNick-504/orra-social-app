'use client';

import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Auto-redirect to home — this page should never actually be seen
    // because the middleware redirects all non-root paths to /
    // This is just a safety net
    window.location.replace('/');
  }, []);

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="0;url=/" />
        <title>Redirecting to ORRA...</title>
      </head>
      <body>
        <noscript>
          <meta httpEquiv="refresh" content="0;url=/" />
        </noscript>
        <p>Redirecting to <a href="/">ORRA</a>...</p>
        <script dangerouslySetInnerHTML={{ __html: 'window.location.replace("/");' }} />
      </body>
    </html>
  );
}
