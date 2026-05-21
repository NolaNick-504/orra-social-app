---
Task ID: 1
Agent: main
Task: Fix 404 on SPA routes and missing profile/ads

Work Log:
- Investigated 404 issue: catch-all route [...slug]/page.tsx is properly built and returns 200 on all SPA paths (/explore, /profile, /messages, /live)
- Root cause of "profile gone": Version bump (13→14) in page.tsx ORRA_STORAGE_VERSION check was wiping ALL localStorage on every version change, destroying the user's NextAuth session and profile data
- Root cause of continued 404 perception: When localStorage was wiped, the user was logged out, so the app showed auth page instead of the main app. This looked like a "404" or broken page to the user.
- Fixed page.tsx: Removed the aggressive version-based localStorage clearing. Only clear for truly corrupted data or stale user-me references.
- Fixed aura-store.ts: Added currentView restoration in the merge function (was persisted but never restored)
- Fixed aura-store.ts: Made setView() update the browser URL via history.pushState() so /explore, /profile, etc. are visible in the address bar
- Fixed page.tsx: Added URL-to-currentView sync on mount so refreshing on /explore shows the explore view
- Rebuilt app and restarted with PM2
- Verified all SPA routes return HTTP 200 through both localhost:3000 and Caddy proxy (port 81)
- User data confirmed intact in database: nickjoseph8087@gmail.com / @nickorraceo / Level 51 / 5065 tokens

Stage Summary:
- 404 fix: Catch-all route [...slug] is working correctly on server side. Client-side URL sync added.
- Profile fix: Stopped localStorage version wipe. User will need to log in once (credentials are valid).
- PM2 process manager set up for auto-restart on crashes.
- Database is intact with all 17 users, 38 posts, 26 follows, etc.
