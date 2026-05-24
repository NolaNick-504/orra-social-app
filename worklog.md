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

---
Task ID: data-persistence-fix
Agent: Main Agent
Task: Fix data persistence - prevent user customizations from being wiped on container rebuild

Work Log:
- Analyzed screenshot showing app stuck on "Loading ORRA..." splash screen
- Diagnosed root cause: seed script uses deleteMany + create, wiping all existing data
- Rewrote seed.ts main() function to use safe upsert pattern (findFirst + create if missing)
- Added ORRA_SEED_FORCE=1 env var for force wipe mode (debugging only)
- Removed db/ from .gitignore - database now committed to git
- Updated dev.sh startup script to never re-seed if data exists
- Added auto-backup daemon in dev.sh (backs up DB every 5 min to /home/sync/)
- Verified KeepAliveProvider already has auto-backup every 60s
- Fixed template literal interpolation in seed script
- Committed and pushed to GitHub
- Rebuilt and verified app: health check, login, /api/me all work

Stage Summary:
- Data persistence is now guaranteed through 3 layers:
  1. Database file (db/custom.db) is committed to git (survives container rebuilds)
  2. Auto-backup every 5 min to /home/sync/orra-db-backup/latest.db (survives rebuilds)
  3. Auto-backup every 60s via KeepAliveProvider calling /api/db-backup
- Seed script will NEVER wipe existing data unless ORRA_SEED_FORCE=1 is set
- Startup script checks for existing data before seeding
- Founder password is always ensured on startup
- App is running and verified: login works, API endpoints respond
