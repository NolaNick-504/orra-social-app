# ORRA App State — Last Updated: May 11, 2026

## What This Is
This file is the permanent record of ORRA's features and state. When the AI conversation resets, it reads THIS file to know exactly where things stand. Every "hard save" should update this file.

## App Overview
ORRA is a futuristic dark-mode social media super-app built with Next.js standalone mode.

## Architecture
- **Framework**: Next.js standalone build (NOT Turbopack, webpack only)
- **Database**: Prisma ORM with SQLite
- **State**: Zustand store (`useAuraStore`) — version 11
- **Server**: aura-daemon.py manages Node on port 3000; Caddy reverse proxy on port 81
- **Build cache**: /tmp/orra-build-cache/ survives container restarts
- **Image serving**: /images/* and /uploads/* routes rewritten to /api/uploads?path=... in next.config. All image URLs must use resolveImageUrl() wrapper.
- **Store property**: currentUserProfile (NOT currentUser)

## Features Implemented

### Feed (Pulse Feed)
- 3 banners in order: 1) Dance Off (LIVE event), 2) Prism Reels, 3) Game Arena (3rd position)
- MoodWaveBar community mood visualization with multi-select filters
- Echo/repost system with green badge and nested card (Repost model, echoOfId)
- Reactions: Like, Wow, OMG, WTF, LOL, Sad, Care, Prayers
- Long-press for reaction picker, tap for like
- Comment section with reaction picker
- Infinite scroll pagination
- Auto-scroll to post from notifications

### Navigation
- Desktop: Left sidebar with all nav items
- Mobile: Bottom nav (Home, Explore, Create+, Wellness, More)
- Mobile drawer menu with full nav
- Top header: FIXED (not sticky) — stays visible on scroll
- Bottom nav: Fixed at bottom — stays visible on scroll
- Header has search bar with recent searches, tab pills (Pulse/Prism/Hub), notification bell, vibe check button

### Game Arena
- 17 games with vibrant AI-illustrated cover art (.jpg format from May 10)
- Game covers stored at /public/images/games/*.jpg
- Game cover paths all use /images/games/ prefix (NOT /images/game-covers/)
- Featured Roast Battle banner
- Daily Game Streak reward
- Social features: Share Highlight, Challenge Friend, Prism AI Game Tips
- Games: Trivia Blast, Would You Rather, PrISM, Aura Quiz, Hot Take, Guess the Vibe, Emoji Quest, Poll Party, Meme Lab, Predict It, Two Truths and A Lie, Song Match, Quick Draw, Color Wars, Rate My Fit, Story Challenge, Roast Battle

### Banners
- /public/images/banners/dance-off-banner.jpg — Dance Off event banner
- /public/images/banners/game-arena-banner.jpg — Game Arena banner
- NO Prism AI banner (removed — not needed)

### AI Features
- Prism AI Companion (floating button and full chat)
- Auto-posting AI agents every 15 minutes

### Other Features
- Profile with edit modal, aura levels, badges
- Prism Reels (short video viewer)
- Dance Challenge
- Hub (groups)
- Messages and DMs
- Activity and Notifications
- Wellness Dashboard
- Token Marketplace
- Settings
- Story viewer with story bar
- Create Post modal with image and video
- Share modal
- Vibe Check modal
- Daily Digest popup
- ORRA token economy (earn and spend)

## Prisma Models
Post, User, Follow, Like, Comment, Story, Reel, Hub, HubMember, Notification, Message, Conversation, Poll, PollOption, PollVote, Repost, Save, Block, GameSession, GameRound, GameVote, HotTake, HotTakeVote

## Important Notes
- Game covers are .jpg files — all references should use .jpg extension
- The resolveImageUrl() function converts /images/... paths to /api/uploads?path=... for standalone mode
- ORRA_STORAGE_VERSION must match between page.tsx and aura-store.ts (currently 11)
- /start.sh wipes /home/z/my-project/ on container restart; build cache in /tmp/orra-build-cache/ survives
- Browser caching requires store version bumps to force localStorage clear
- Backup of May 10 game covers exists at /tmp/my-project/public/images/games/

## Known Issues
- Game covers from May 10 are JPG files — browsers handle them fine
- The orra-logo.png is actually a JPEG file but browsers handle the mismatch
- Some orra-globe-icon images use direct /api/uploads?path= instead of resolveImageUrl()

## Version History
- v5.0: Echo/repost rebuilt, Prayers reaction
- v5.1: All fixes restored
- v5.2: Clean rebuild
- v5.3: Bulletproof deploy
- v10: Store version bump
- v11: Current — fixed scroll behavior, restored May 10 game covers, Game Arena as 3rd banner, removed Prism AI banner
