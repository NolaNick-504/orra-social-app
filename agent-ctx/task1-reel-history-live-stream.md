# Task: Reel History + Live Stream Viewer Features

## Summary
Implemented two major features for the ORRA social media app:

### Task 1: Reel History Feature
1. **Prisma Schema** (`prisma/schema.prisma`): Added `ReelHistory` model with `userId`, `reelId`, `watchProgress`, `watchedAt` fields, plus relations to User and Reel models.

2. **API Route** (`src/app/api/reel-history/route.ts`):
   - `GET`: Returns last 20 watched reels (ordered by watchedAt desc), includes reel + creator data. Requires auth.
   - `POST`: Upserts ReelHistory entry with watch progress. Deletes oldest entries if >20. Requires auth.

3. **Hook** (`src/lib/api-hooks.ts`): Added `useReelHistory()` and `useRecordReelView()` hooks using TanStack Query.

4. **Reel Viewer** (`src/components/aura/reel-viewer.tsx`):
   - Added Clock icon button at top-left to open history panel
   - Added `HistoryPanel` component that slides in from the left showing watch history
   - Each entry shows: thumbnail, title, creator name, watch progress bar, time ago
   - Clicking an entry navigates to that reel and closes the panel
   - Auto-tracks reel views: after 3 seconds of watching, calls POST /api/reel-history
   - Keyboard shortcut 'h' toggles history panel, Escape closes it first

### Task 2: Live Stream Viewer
1. **API Route** (`src/app/api/livestreams/route.ts`):
   - `GET`: Fetch single stream by ID (with `?id=` param) or all live streams
   - `POST`: Create a new live stream reel

2. **Aura Store** (`src/store/aura-store.ts`): Added `showLiveViewer`, `currentLiveStreamId`, and `toggleLiveViewer` action.

3. **LiveStreamViewer** (`src/components/aura/live-stream-viewer.tsx`):
   - Full-screen dark UI with camera preview (getUserMedia for host)
   - LIVE badge, viewer count, stream title, host name/avatar
   - Chat sidebar with simulated messages and real message input
   - Heart button with floating animation
   - Camera/Mic toggle buttons for host
   - End Stream button (host only)
   - Save dialog after ending (Post to Feed / Save to Profile / Discard)
   - Uses lucide-react icons: X, Heart, MessageCircle, Send, Radio, Clock, Gift, Camera, Mic, MonitorUp

4. **Page** (`src/app/page.tsx`): Added LiveStreamViewer component alongside other modals, reading from aura store.

## Files Modified
- `prisma/schema.prisma` - Added ReelHistory model + relations
- `src/store/aura-store.ts` - Added showLiveViewer, currentLiveStreamId, toggleLiveViewer
- `src/lib/api-hooks.ts` - Added useReelHistory, useRecordReelView hooks
- `src/components/aura/reel-viewer.tsx` - Added HistoryPanel + auto-track
- `src/app/page.tsx` - Added LiveStreamViewer component

## Files Created
- `src/app/api/reel-history/route.ts` - GET + POST for reel watch history
- `src/app/api/livestreams/route.ts` - GET + POST for live streams
- `src/components/aura/live-stream-viewer.tsx` - LiveStreamViewer component

## No Lint/TS Errors
All new files pass ESLint and TypeScript checks cleanly.
