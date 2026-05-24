---
Task ID: 1
Agent: Main
Task: Fix ORRA app timing out to 404 after a few minutes

Work Log:
- Diagnosed the root cause: proxy/platform idle connection timeout causing 404s after a few minutes
- Found that generateBuildId used Date.now() creating new BUILD_ID on every rebuild, causing chunk hash mismatches
- Found that error.tsx/global-error.tsx auto-reload loops could make 404 worse
- Found that /api/me 404 handler was signing users out on proxy 404s (not just genuine API 404s)
- Fixed generateBuildId to use stable 'orra-v2-stable' value
- Added keep-alive ping (every 25s to /api/build-id) to prevent proxy idle timeouts
- Added global fetch error recovery - auto-retries failed API requests once before showing error
- Added chunk load error protection - catches chunk errors and reloads once (with loop prevention)
- Fixed error.tsx to try in-place reset() before full reload, and only reload once per session
- Fixed global-error.tsx similarly
- Fixed not-found.tsx to prevent redirect loops with sessionStorage guard
- Fixed /api/me 404 handler to distinguish genuine API 404s from proxy 404s
- Clean rebuilt and restarted server
- Verified all routes return 200, chunks serve correctly, API endpoints work
- Browser tested: login, feed, explore, profile, games, reels, settings, messages all work
- 30-second stability test passed - no 404s

Stage Summary:
- App should no longer time out to 404 after a few minutes thanks to keep-alive ping
- Error recovery is much more resilient - tries in-place recovery before full reload
- Stable BUILD_ID prevents chunk hash mismatches across rebuilds
- Server running on port 3000 with fresh build (BUILD_ID: orra-v2-stable)
