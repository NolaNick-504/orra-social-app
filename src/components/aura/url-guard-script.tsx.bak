'use client';

import Script from 'next/script';

/**
 * URL Guard Script: Runs BEFORE any Next.js/React code.
 * ORRA is a single-page app — the ONLY valid URL is /.
 *
 * This script does FIVE things:
 * 1. If the browser URL is not /, immediately redirect to /
 * 2. Add a popstate listener that prevents browser navigation away from /
 * 3. Catch chunk loading errors AND SyntaxError from stale chunks
 * 4. Catch unhandled rejections from dynamic imports
 * 5. Periodic URL check — every 5 seconds, ensure URL is still /
 *
 * CRITICAL: When a stale chunk URL is requested (after a deploy), the
 * server now redirects to / instead of returning 404 HTML. But we still
 * need client-side protection for edge cases.
 */
export function UrlGuardScript() {
  return (
    <Script
      id="orra-url-guard"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(){
            // LAYER 1: If URL is not /, hard redirect immediately
            var p = window.location.pathname;
            if (p !== '/') {
              window.location.replace('/' + window.location.search + window.location.hash);
              return;
            }

            // LAYER 2: Intercept browser back/forward button
            window.addEventListener('popstate', function(e) {
              if (window.location.pathname !== '/') {
                window.location.replace('/');
              }
            });

            // Also intercept pushState/replaceState to prevent URL changes
            var origPush = history.pushState;
            var origReplace = history.replaceState;
            history.pushState = function() {
              origPush.apply(this, arguments);
              if (window.location.pathname !== '/') {
                window.location.replace('/');
              }
            };
            history.replaceState = function() {
              origReplace.apply(this, arguments);
              if (window.location.pathname !== '/') {
                window.location.replace('/');
              }
            };

            // LAYER 3: Catch script loading errors
            window.addEventListener('error', function(e) {
              var src = e.filename || (e.target && e.target.src) || '';
              var msg = e.message || '';
              var isChunkError = (
                src.indexOf('_next/static/chunks/') !== -1 ||
                src.indexOf('_next/static/') !== -1 ||
                msg.indexOf('Loading chunk') !== -1 ||
                msg.indexOf('Failed to fetch') !== -1 ||
                msg.indexOf('Unexpected token') !== -1 ||
                msg.indexOf('Unexpected identifier') !== -1 ||
                msg.indexOf('expected expression') !== -1 ||
                (src.indexOf('_next') !== -1 && msg.indexOf('SyntaxError') !== -1)
              );
              if (isChunkError) {
                var retry = window.location.search.indexOf('_retry=') !== -1;
                if (!retry) {
                  window.location.replace('/?_retry=' + Date.now());
                }
              }
            }, true);

            // LAYER 4: Catch unhandled promise rejections from dynamic imports
            window.addEventListener('unhandledrejection', function(e) {
              var msg = String(e.reason || '');
              var isChunkError = (
                msg.indexOf('chunk') !== -1 ||
                msg.indexOf('Failed to fetch') !== -1 ||
                msg.indexOf('404') !== -1 ||
                msg.indexOf('Unexpected token') !== -1 ||
                msg.indexOf('Unexpected identifier') !== -1 ||
                msg.indexOf('expected expression') !== -1 ||
                msg.indexOf('SyntaxError') !== -1
              );
              if (isChunkError) {
                e.preventDefault();
                var retry = window.location.search.indexOf('_retry=') !== -1;
                if (!retry) {
                  window.location.replace('/?_retry=' + Date.now());
                }
              }
            });

            // LAYER 5: Periodic URL check — every 5 seconds verify URL is /
            // This catches any edge case where the URL changed silently
            setInterval(function() {
              if (window.location.pathname !== '/') {
                window.location.replace('/');
              }
            }, 5000);
          })();
        `,
      }}
    />
  );
}
