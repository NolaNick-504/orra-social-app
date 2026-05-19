# ORRA - Project State Memory
# Last Updated: 2026-05-15
# READ THIS FILE FIRST when starting a new session

## APP OVERVIEW
ORRA is a social media super-platform. Think Instagram + TikTok + Discord + Gaming all in one.

## OWNER ACCOUNT
- Name: Nick Joseph
- Handle: @nickorraceo
- Email: nickjoseph8087@gmail.com
- This is the REAL user's account - DO NOT TOUCH unless asked

## CURRENT DATABASE STATE (as of 2026-05-15)
- Users: 17
- Posts: 164
- Reels: 21
- Comments: 1260
- Stories: 22
- Likes: 23

## 16 SEED USERS (from prisma/seed.ts)
Jessica Art, Marcus Rivera, Luna Sky, Zara Miles, Jay Parker, Maya Chen,
Dre Williams, David Chen, Sarah Kim, Elena Rodriguez, Tech Daily,
Wellness Guru, Cyber Drifter, Music Central, Kai Storm, Nova Blaze

## KEY FEATURES BUILT
- Home feed (Pulse) with posts, likes, comments, reposts, saves
- Reels (vertical swipe, camera capture, Go Live streaming)
- Game Arena (17 games: Trivia Blast, Would You Rather, PrISM, Aura Quiz, Hot Take, Guess the Vibe, Emoji Quest, Poll Party, Meme Lab, Predict It, Two Truths & A Lie, Song Match, Quick Draw, Color Wars, Rate My Fit, Story Challenge, Roast Battle)
- Hub (community/groups)
- Messages (DMs with real-time)
- Activity notifications
- Wellness section
- Marketplace/Token Shop
- Prism AI assistant
- Profile with avatar/cover
- Stories
- Explore/Discover
- Auto-poster bot system
- Daily Digest

## TECH STACK
- Next.js 16 App Router + TypeScript
- Prisma ORM + SQLite (db/custom.db)
- Tailwind CSS + shadcn/ui
- PM2 process manager (pm2 start/stop/restart orra)
- Running on port 3000

## CRITICAL RULES
1. NEVER run prisma migrate reset - it wipes ALL data
2. NEVER delete db/custom.db
3. Always backup db before schema changes: cp db/custom.db backups/
4. When rebuilding: only use `next build` then `pm2 restart orra`
5. The user's data is sacred - never assume seed data replacement is OK
6. PM2 manages the server: pm2 list, pm2 restart orra, pm2 logs orra

## FUTURISTIC DESIGN REQUIREMENTS (from screenshots - MUST MATCH)
The app MUST look and feel futuristic - different from other platforms:
- **Glassmorphism**: All cards/panels use frosted glass effect (semi-transparent, backdrop-blur)
- **Glow effects**: Neon purple/pink glows on interactive elements, profile pics, buttons
- **Color scheme**: Dark navy/black background, neon purple/pink/teal accents, bold red for LIVE
- **Profile pictures**: Glowing purple/pink gradient orbs with cosmic/neon effect
- **Gradients**: Purple-to-pink, violet-to-fuchsia throughout
- **Live stream card**: Pinned to TOP of Pulse feed, full-width, with LIVE badge, viewer count, timer, glassmorphic chat overlay
- **Post cards**: Frosted glass, floating over dark background, subtle borders
- **Navigation**: Minimalist icons, neon highlights on active state

## LOST FEATURES (need to rebuild - were working before data wipe)
1. **LIVE stream pinned to feed top**: A post that stays at the top showing "LIVE NOW" for people to join
2. **Human-like bots**: Bots with emotions, realistic profile pics, meaningful comments about real-world events
3. **No duplicate bot content**: Bots never post the same picture or text twice
4. **Bot posting every 15min**: Real-life meaningful posts about real-world events
5. **Futuristic glow/glass UI**: Enhanced glassmorphism, neon glows, holographic effects across entire app
6. **Photos upright**: Fixed (sharp .rotate() in API) - DO NOT REVISIT

## KNOWN ISSUES / PENDING
- Game covers need to be HD/3D style like real game covers
- Game arena page appears zoomed in on first load, doesn't fit viewport
- User wants game covers to fit inside the cover area properly

## FILE LOCATIONS
- Main app: src/app/page.tsx
- Aura layout: src/components/aura/ (all main components)
- Game Arena: src/components/aura/game-arena.tsx
- Game components: src/components/aura/games/
- Sidebar: src/components/aura/sidebar.tsx
- Store: src/store/aura-store.ts
- API routes: src/app/api/
- Database: db/custom.db
- Backups: backups/
- Env: .env (DATABASE_URL, NEXTAUTH_SECRET)

## USER INSTRUCTIONS FROM OWNER
- "Stop going back to profile - only worry about what I just chatted about"
- Previous issues (photo orientation, livestream feed) are FIXED - don't revisit
- Focus ONLY on the current request, not past ones
