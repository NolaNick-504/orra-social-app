---
Task ID: 1
Agent: Main Agent
Task: Fix all data persistence and white screen issues in ORRA app

Work Log:
- Found project at /home/z/my-project/ (Next.js + Prisma + SQLite)
- Conducted full audit identifying 16 issues across critical, high, medium, and low categories
- Fixed NEXTAUTH_SECRET mismatch across 3 files (aura-daemon.py, auth.ts, .env)
- Changed /api/db-backup and /api/db-restore from GET to POST with admin authentication
- Fixed auth check to use founder email/ID instead of missing 'role' field
- Removed hardcoded fallback secret in auth.ts
- Fixed build.sh to stop embedding database in build artifacts
- Fixed startup-v3.sh to use 'node server.js' instead of 'npx next start'
- Removed dangerous 'next dev' fallback from startup-v3.sh
- Fixed build-preserver.py to cache non-standalone .next/ directory
- Fixed all 7 script files using 'npx next start' to use 'node server.js'
- Fixed dev.sh to detect stale builds (source files newer than BUILD_ID)
- Fixed dev.sh founder password to only set on first-time (not every startup)
- Fixed db.ts PrismaClient to always use global singleton
- Fixed db.ts PRAGMA statements to be awaited instead of fire-and-forget
- Removed client-side /api/db-backup calls from keep-alive-provider
- Added build cache restore/sync to dev.sh
- Fixed build-id/route.ts to cache BUILD_ID in memory
- Fixed auto-poster-daemon.py NEXTAUTH_SECRET
- Added AUTOPOST_KEY to .env and aura-daemon.py
- Rebuilt Next.js app successfully
- Pushed all changes to GitHub

Stage Summary:
- 18 files modified, pushed to GitHub as commit 041ebc3
- All critical data loss issues fixed (auth, DB embedding, secret mismatch)
- All white screen causes fixed (server.js instead of next start, chunk 404 protection)
- Build verified successful, server returns 200 with 41KB HTML
- Database persistence relies on /home/sync/orra-db-backup/ which survives container rebuilds
