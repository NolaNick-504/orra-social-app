# ORRA Worklog

---
Task ID: 1
Agent: Main Agent
Task: Diagnose and fix ORRA app stuck on "Loading ORRA..." screen

Work Log:
- Audited full codebase: layout.tsx, sw.js, keep-alive-provider.tsx, server.js, dev.sh, next.config.ts
- Discovered ROOT CAUSE: next.config.ts had /sw.js → /api/sw rewrite that served a "self-destruct" SW v200 instead of the useful v8 SW
- The self-destruct SW cleared all caches and unregistered itself, leaving no SW for cold-start resilience
- Without an active SW, the 15s watchdog in layout.tsx triggered redirect to /clear-cache.html → infinite loop
- Also found: dev.sh never rebuilt after code changes because BUILD_ID was hardcoded

Stage Summary:
- Removed /sw.js → /api/sw rewrite from next.config.ts (v8 SW now served directly from public/)
- Simplified /api/sw/route.ts to redirect to /sw.js
- Fixed v8 SW: don't convert legitimate API 404s to 503s
- Removed 15s watchdog from layout.tsx (was creating redirect loops)
- Increased LoadingScreen timeout 8s → 30s
- Added BUILD_VERSION check to dev.sh (forces rebuild when version changes)
- Nuked stale build cache at /home/sync/orra-build-cache/
- Ran fresh `next build` on the container
- Started server via supervisor-daemon.sh
- Verified all endpoints: / (200), /sw.js (v8 SW, 200), /api/health (200), JS chunks (200)
