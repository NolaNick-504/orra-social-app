---
Task ID: 1
Agent: Main Agent
Task: Fix ORRA app going to 404 after a few minutes of idle

Work Log:
- Diagnosed root cause: Platform (Alibaba Cloud Function Compute) freezes container after ~3-5 min of inactivity
- When container freezes, platform proxy returns 502 with custom Z.ai error page
- The 404 the user sees is from Next.js's not-found page, triggered by stale/cached responses
- Created KeepAliveProvider component that pings /api/health every 10 seconds to keep container alive
- Created /api/health endpoint for keep-alive pings
- Updated not-found.tsx to detect platform proxy 404s and auto-recover instead of showing permanent 404
- Updated app-wrapper.tsx to only sign out on REAL 404 (user not found), not platform proxy 404s
- Updated service worker to v6 — never caches error responses, passes /api/health through
- Added .zscripts/dev.sh for custom startup with auto-restart supervisor
- Added supervisor.sh for standalone process supervision
- Integrated KeepAliveProvider into layout.tsx wrapping all content
- Built, deployed, and tested — all endpoints return 200

Stage Summary:
- Root cause: Container freezes due to platform idle timeout
- Fix: Keep-alive pings prevent freeze + smart recovery when server goes down
- Key insight: Platform proxy returns 502 with Z.ai logo page when Next.js is down
- All changes committed and pushed to GitHub
