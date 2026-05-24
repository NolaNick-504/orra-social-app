# ORRA Stop-Gap Restore Instructions

If anything happens (server loss, DB corruption, etc.), follow these steps to restore:

## Quick DB File Restore (Fastest)

1. `cd /home/z/my-project`
2. `npx prisma db push` (create empty schema)
3. `cp backup/orra-db-final-20260524.db db/custom.db`
4. `npx next build --webpack`
5. `npx next start -p 3000`
6. Reset founder password:
   ```
   node -e "const bcrypt=require('bcryptjs'); const p=new(require('@prisma/client').PrismaClient)(); (async()=>{ await p.user.update({where:{email:'nickjoseph8087@gmail.com'},data:{password:await bcrypt.hash('Weareone504',10)}}); console.log('Done!'); await p.\$disconnect();})()"
   ```

## Full JSON Restore (If DB file is corrupted)

1. `cd /home/z/my-project`
2. `npx prisma db push` (create empty schema)
3. `node backup/restore-from-export.js`
4. `npx next build --webpack`
5. `npx next start -p 3000`
6. Reset founder password (same command as above)

## What's in this backup

- **full-state-export.json** — Complete database as JSON (users, posts, comments, likes, follows, hubs, stories, reels, dance entries)
- **orra-db-final-20260524.db** — Exact SQLite database file copy
- **restore-from-export.js** — Script to rebuild from JSON export

## Saved State (as of 2025-05-24)

- 26 users (1 founder + 25 bots)
- 71 posts with comments
- 110 likes
- 6 hubs
- 26 stories
- 12 reels
- 10 dance entries
- All bot cover photos match their bios
- All avatar images in /public/images/avatars/bots/
- All cover images in /public/images/covers/
- Founder cover: /public/images/covers/founder-orra.jpg

## Key Files That Must Be Preserved

- `/public/images/avatars/bots/` — Bot profile avatars (bot01-bot25)
- `/public/images/covers/` — Profile cover photos (bot01-bot25 + founder-orra)
- `/public/images/posts/` — Post images
- `/public/images/ads/` — Ad images
- `/public/images/game-covers/` — Game cover images
- `/public/images/stories/` — Story images
- `/public/music/orra/` — Profile songs
- `/public/sw.js` — Service worker (v100)
- `/.env` — Environment variables (NEXTAUTH_SECRET, DATABASE_URL)
