# Task 2a-5: Notifications Tester & Fixer

## Summary
Tested and fixed the ORRA social media app's notification system. Found 11 issues, fixed all of them.

## Key Findings
1. Reposts never created notifications for post authors (CRITICAL)
2. No @mention detection - typing @handle in posts/comments didn't notify mentioned users (CRITICAL)  
3. Mark-as-read had visual delay - optimistic update was missing (HIGH)
4. Notification polling at 60s was too slow for social media (MEDIUM-HIGH)
5. Missing game_invite notification type (MEDIUM)
6. Activity filter tabs only had 3 generic categories (MEDIUM)
7. No browser push notification support (MEDIUM)
8. No proper empty state for zero notifications (LOW-MEDIUM)
9. Notification API missing type filter and delete endpoint (MEDIUM)
10. No useDeleteNotification client hook (LOW)
11. Challenge/game invite notifications had no action button (LOW)

## Files Changed
- `/src/app/api/reposts/route.ts` — Added notification creation on repost
- `/src/lib/notify.ts` — NEW: Mention detection and notification helper
- `/src/app/api/posts/route.ts` — Added @mention notification integration
- `/src/app/api/comments/route.ts` — Added @mention notification integration
- `/src/lib/api-hooks.ts` — Optimistic mark-as-read, faster polling (20s), useDeleteNotification hook
- `/src/components/aura/activity.tsx` — Complete overhaul: 5-category filters, push notifications, game_invite icon, empty state, action buttons
- `/src/store/aura-store.ts` — Added game_invite to Notification type union
- `/src/app/api/notifications/route.ts` — Added type filter, DELETE endpoint, improved mark-all response
- `/prisma/schema.prisma` — Updated Notification type comment

## Verification
- curl GET /api/notifications → 200 OK with correct structure
- curl GET /api/notifications?type=like → 200 OK with type filter
- curl PATCH /api/notifications → 401 (unauth, correct)
- curl DELETE /api/notifications → 401 (unauth, correct)
- Dev server running, no compile errors
- Lint: 11 pre-existing errors, 0 new errors
