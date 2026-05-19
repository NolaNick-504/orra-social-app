# Task: Rewrite GameplayEngine for Real Multiplayer

## Task ID: multiplayer-gameplay-engine

## Changes Made

### 1. Frontend: `src/components/aura/orra-challenges.tsx` (complete rewrite of GameplayEngine)

**Major changes:**

- **Added `flowCategory` field to `GameDef`** with values: `'head_to_head' | 'asynchronous' | 'quiz' | 'solo'`
  - head_to_head: Roast Battle, Clapback, Truth or Dare, First Impression (need real opponent)
  - asynchronous: Hot Take, Rate My Fit, Story Challenge (community votes later)
  - quiz: Who Said It, Vibe Check (single player quiz)
  - solo: Aura Drop (no opponent, just claim)

- **Replaced bot simulation with real matchmaking flow:**
  - Removed the `useEffect` that auto-simulated opponent responses (old lines 397-419)
  - Added `matching` phase with animated searching UI (spinning ring, timer, "Finding opponent...")
  - Calls `POST /api/games/matchmake` with `{ gameType }` 
  - Polls `GET /api/games/session/[id]` every 2 seconds until player2Id is set
  - After 30 seconds shows "Keep Searching" / "Play vs Bot" buttons (bot clearly labeled)
  - Once matched, shows real opponent's avatar and name from session data

- **Replaced auto-generated votes with real spectator voting:**
  - Removed the `useEffect` that auto-generated fake votes (old lines 421-436)
  - Added `reveal` phase between playing and voting for head-to-head games
  - Added "Share to Feed for Votes" button 
  - Polls `GET /api/games/vote?sessionId=X` every 3 seconds for real vote counts
  - Added 15-second minimum voting window before tally can proceed
  - Players cannot vote on their own game (enforced server-side too)

- **Game-type-specific phase flows:**
  - Head-to-head: `intro → matching → playing → reveal → voting → roundResult → (loop) → bestmoments → final`
  - Asynchronous: `intro → creating → submitted → checking → bestmoments → final`
  - Quiz: `intro → question → feedback → (loop) → bestmoments → final`
  - Solo: `intro → dropping → claimed → bestmoments → final`

- **Game-specific mechanics implemented:**
  - Hot Take: Single text submission → goes to board → community votes W/L
  - Rate My Fit: Photo upload placeholder + caption → community rates 1-10
  - Story Challenge: Text submission → community votes 🔥
  - Who Said It: Multiple choice quiz → correct/wrong feedback per question
  - Vibe Check: Multiple choice vibe questions → match majority scoring
  - First Impression: Head-to-head text input about opponent's profile
  - Aura Drop: Solo cosmetic claim with supply counter animation

- **Updated intro screen:**
  - "Find Opponent" button for head-to-head games
  - "Open Battle" / "Play vs Bot" options
  - Mode badges: SOLO, 1 VS 1, QUIZ, COMMUNITY on game cards

### 2. Backend API Routes (pre-existing, verified working)

- `POST /api/games/matchmake` - Real matchmaking with waiting session pool
- `GET /api/games/session/[id]` - Session state polling
- `POST /api/games/vote` - Real spectator voting with duplicate prevention
- `POST /api/games/submit` - Submit player inputs
- `POST /api/games/complete` - Complete and reward

### 3. Prisma Schema (pre-existing, verified in sync)

- `GameSession` model with player1Id/player2Id for matchmaking
- `GameRound` model for round-by-round data  
- `GameVote` model for real voting with voter tracking
- Game-specific models: HotTake, FitSubmission, StoryChallenge, VibeCheckResponse, AuraDrop

## Visual Design Preserved

All glass-panel, gradient, and animation styles are preserved. Only the game logic was changed.
