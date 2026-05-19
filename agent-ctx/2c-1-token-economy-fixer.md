# Task 2c-1: Token Economy Tester & Fixer

## Summary
Fixed 8 critical issues in the ORRA token economy system. The main problem was that token earning was completely client-side with no server persistence, and the spend API had an incomplete whitelist blocking 5 of 9 shop categories.

## Files Modified
1. `/src/store/aura-store.ts` — Major changes to sync tokens with server
2. `/src/app/api/orra/spend/route.ts` — Expanded validActions whitelist
3. `/src/components/aura/token-shop.tsx` — Expanded earn actions display

## Issues Fixed

### CRITICAL
1. **Token earning never synced to server** — Added `syncEarnToServer()` helper that calls `/api/orra/earn` after every token-earning action. Added `scheduleBalanceSync()` for periodic reconciliation.
2. **Daily streak not synced to server** — Rewrote `checkDailyStreak()` to call `/api/orra/streak`.
3. **Spend API rejected 5 of 9 shop categories** — Expanded `validActions` from 4 to 9.

### HIGH
4. **addUserPost didn't earn tokens** — Added +5 tokens, +10 XP, server sync.
5. **Tip/Gift dedup prevented repeatable transactions** — Changed to unique itemIds per transaction.
6. **Spend API calls were fire-and-forget** — Added error handling with state revert on failure.

### MEDIUM/LOW
7. **Token shop showed only 6 of 11 earn actions** — Expanded to 11.
8. **joinHub allowed re-joining for token farming** — Added dedup check.

## Architecture Notes
- `syncEarnToServer(action, targetId, tokens, xp)` — Fire-and-forget POST to `/api/orra/earn`
- `scheduleBalanceSync()` — Debounced (3s) GET to `/api/orra` for balance reconciliation
- Server-side dedup via `TokenAction` unique constraint `(userId, action, targetId)`
- All spend functions now save previous state and revert on API failure
