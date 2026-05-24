---
Task ID: 1
Agent: main
Task: Fix "sandbox is inactive" cold-start error and data persistence

Work Log:
- Analyzed screenshot showing `{"error":"sandbox is inactive"}` — platform sandbox went cold, browser shows raw JSON instead of HTML
- Identified root cause: When the hosting sandbox/container goes inactive, ALL requests return JSON error. Since no HTML page loads, none of the existing React error boundaries or bootstrap scripts run
- Created Service Worker v7 (`public/sw.js`) that:
  - Intercepts navigation requests and detects "sandbox is inactive" / platform error JSON responses
  - Returns a branded "Waking Up ORRA" HTML page with auto-retry logic instead of raw JSON
  - Detects platform errors in API calls (403 FCCommonError, "sandbox is inactive" JSON)
  - Uses cache-first for static chunks and images
  - Cleans up old cache versions on activation
- Updated bootstrap script in `layout.tsx`:
  - Registers SW v7 for cold-start protection (instead of killing all SWs)
  - Clears only OLD cache versions (preserves v7 caches)
  - Added `showSandboxOverlay()` / `hideSandboxOverlay()` for in-app "Waking Up" overlay
  - Enhanced fetch wrapper to detect "sandbox is inactive" responses and X-ORRA-Sandbox header
  - Keep-alive pings now detect sandbox errors and show overlay
  - Auto-retry with increasing delays (3s, 6s, 9s) when sandbox is cold
- Verified seed script (`prisma/seed.ts`) is already in safe mode:
  - Only deletes data when `ORRA_SEED_FORCE=1` env var is set
  - Otherwise uses findFirst + create pattern (skip if exists)
  - Always ensures founder password is correct
- Verified `.gitignore` already has correct DB persistence (only ignores .db-wal, .db-shm, custom-seed-backup.db)
- Updated `clear-cache.html` to properly unregister old SWs and clear caches

Stage Summary:
- Service Worker v7 provides cold-start resilience — users see "Waking Up ORRA" instead of raw JSON
- In-app sandbox overlay shows when keep-alive or API calls detect sandbox inactive
- Seed script already safe — data persists across container rebuilds
- DB file (custom.db) already committed to git and not ignored
