# ORRA Bug Fixes - Work Record

## Task ID: orra-bug-fixes
## Agent: Main Agent
## Date: 2026-03-04

## Summary of Changes

### Fix 1: StoreHydrator - Profile data not persisting after page refresh
**File**: `src/components/aura/app-wrapper.tsx`
**Root Cause**: The `useEffect` guard at lines 27/32 checked both `hasFetched.current && isHydrated` and `isHydrated && currentUserId === userId`. When the 4-second timeout set `isHydrated=true` before the API response arrived, these guards prevented the fresh API data from being written to the store.

**Fix**: Changed the guard to only check `hasFetched.current && currentUserId === userId` — removing `isHydrated` from the condition entirely. This ensures API data ALWAYS gets written to the store regardless of the isHydrated flag. The isHydrated flag is purely for the loading screen UX and should never block data writes.

### Fix 2: Merge function - isHydrated/profileSetupComplete never from localStorage
**File**: `src/store/aura-store.ts`

**Changes**:
1. **partialize function** (line 1052+): Removed `profileSetupComplete: state.profileSetupComplete` from the persisted fields. It was previously persisted even though the comment said isHydrated shouldn't be. Now both are excluded.

2. **merge function** (line 1135+): Explicitly set `merged.isHydrated = false` and `merged.profileSetupComplete = false` instead of conditionally restoring `profileSetupComplete` from persisted data. This ensures these flags are ALWAYS recalculated from the API each session.

### Fix 3: ORRA Globe Logo - Image file verification
**Result**: All globe image files already exist in `public/images/`:
- `orra-globe-icon.jpg` (134KB) - referenced by top-header.tsx
- `orra-globe-icon-lg.jpg` (133KB) - referenced by sidebar.tsx and auth-page.tsx
- `orra-globe.png` (822KB) - available but not directly referenced

All three API endpoints return HTTP 200. No code changes were needed.

### Fix 4: Build/Deploy verification
- `pm2` is not available in this environment
- The project runs via the auto dev server (`bun run dev`)
- Verified the dev server is running and serving pages (HTTP 200 for `/`)
- All API endpoints working correctly
- Lint passes with only pre-existing errors (not introduced by these changes)

## Verification
- Homepage: HTTP 200
- Session API: HTTP 200
- Globe icon endpoints: All HTTP 200
- /api/me: Correctly returns auth error for unauthenticated requests
