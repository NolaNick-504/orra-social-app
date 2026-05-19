# Task: Create Two Playable Game Components for ORRA

## Summary
Created two fully playable game components for the ORRA social media app's Game Arena:
1. **Guess the Vibe** (`src/components/aura/games/guess-the-vibe.tsx`)
2. **Emoji Quest** (`src/components/aura/games/emoji-quest.tsx`)

Both are integrated into the Game Arena and accessible from the game grid.

## Files Created/Modified

### Created
- `src/components/aura/games/guess-the-vibe.tsx` - Full social guessing game
- `src/components/aura/games/emoji-quest.tsx` - Full emoji puzzle decoding game

### Modified
- `src/components/aura/game-arena.tsx` - Added routing for both new game components (imports already existed)

## Game 1: Guess the Vibe
- **15 social scenarios** with correct vibe + 3 wrong options each
- 8 scenarios per round (randomly selected)
- Scoring: +10 pts correct + streak bonuses (up to +10)
- +3 ORRA tokens for completing a round
- 4 phases: intro → playing → reveal → results
- Vibe IQ score (out of 160) and personality insight on results
- Answer review with correct/wrong feedback
- Dark neon ORRA theme with teal/cyan gradient accents
- Responsive design (2-column grid for options)

## Game 2: Emoji Quest  
- **20 emoji puzzles** across 5 categories (Movies, Songs, Phrases, Food, Places)
- 10 puzzles per round (mix of difficulty levels)
- Scoring: +10 pts + difficulty bonus (5 pts per star)
- Hint system: costs 5 points per hint
- +3 ORRA tokens for completing a round
- 4 phases: intro → playing → reveal → results
- Emoji Master rank based on performance
- Category badges, difficulty stars, animated emoji display
- Dark neon ORRA theme with yellow/amber gradient accents
- Responsive design

## Technical Details
- Both components use `'use client'` directive
- Use `useAuraStore` for `earnTokens()`, `addXP()`, and `auraTokens`
- Use `toast` from `sonner` for notifications
- Use `useMemo` for shuffled options (avoiding lint issues with setState in useEffect)
- Use `useCallback` for round start functions
- All game data hardcoded inside components
- Glass-panel dark theme consistent with ORRA aesthetic
- Responsive layouts with mobile-first design

## Lint Status
- No new lint errors introduced (pre-existing errors in other files remain)
