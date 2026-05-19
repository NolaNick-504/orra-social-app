# Stories & Short Video Feature Research
## ORRA Platform — Competitive Analysis & Recommendations

**Date**: 2025-03-05  
**Researcher**: Senior Mobile App Researcher  
**Scope**: Snapchat, TikTok, Instagram Reels, YouTube Shorts, BeReal vs. ORRA

---

## 1. SNAPCHAT — Stories & Spotlight

### 1.1 Stories Format
- **Duration**: Photos display for ~6s, videos play their full length (up to 60s)
- **Progress bar**: Thin segmented bars at top — one segment per snap in a story. Completed segments = white, current = animating, upcoming = translucent
- **Navigation**: Tap left/right halves of screen to go back/forward. Swipe down to dismiss. Swipe left/right on a friend's story to jump to next friend's story
- **Auto-advance**: Snaps auto-advance after their duration. After all snaps from one user, auto-transitions to next friend's story (with a brief "Up Next" card showing next user's name/avatar)
- **Grouping**: Stories from same user shown as one continuous sequence. Friend Stories are separated from Discover (publisher) Stories

### 1.2 Story Creation
- **Camera UI**: Full-screen camera as default screen — tap shutter for photo, hold for video
- **Multi-snap**: Can record up to 8 snaps in sequence from camera
- **Editing tools**: Text overlay (with font/color selection), stickers (bitmoji, GIFs, custom), drawing tool (color picker, emoji brush), crop, music (from licensed library), filters (AR lenses, geofilters, time/temp overlays), voice filters, captions (auto-generated)
- **Lens Carousel**: Swipeable lens selector at bottom with AR effects, face swap, background change
- **Camera roll**: Can upload from gallery but it shows "from Camera Roll" badge

### 1.3 Story Viewer UX
- Full-screen vertical viewer, no chrome except progress bars and user info
- **Tap zones**: Left 30% = previous, right 30% = next, center = pause/hold
- **Long press**: Quick preview (peek) of next snap
- **Swipe down**: Exit viewer
- **Swipe left**: Jump to next friend's story (skip remaining snaps from current user)
- **Pull down on story**: Reply via chat (opens chat with snap attached)
- **Sound**: Auto-plays with sound if video has audio (honors device mute toggle)

### 1.4 Story Expiration
- **24h expiration**: Snaps disappear after 24 hours from time of posting
- **Memories**: All snaps auto-saved to private Memories (can re-post)
- **Story Highlights**: No native "highlights" — that's Instagram's feature. Snapchat has "Story Highlights" in public profiles for creators
- **My Story**: Can save entire story as a single video to Memories

### 1.5 Story Groups
- Stories grouped by user — each user is one entry in the story feed
- **Story row order**: Recency-based, with "new" badge on unviewed stories
- **Custom Stories**: Group stories (Geofilter stories, Group stories for specific friend groups)
- **Shared Stories**: Collaborative stories where multiple users can add snaps

### 1.6 Spotlight (Short Video Feed)
- **Structure**: Vertical scroll, full-screen, auto-playing video feed (TikTok clone)
- **Duration**: Up to 60 seconds
- **Auto-play**: Videos auto-play with sound when scrolled into view
- **Navigation**: Swipe up for next, swipe down for previous
- **Sound toggle**: Tap speaker icon or device volume buttons

### 1.7 Spotlight Creation
- Record or upload video (up to 60s)
- Full editing suite: sounds library, AR lenses, trimming, multi-clip, voiceover, speed controls, captions (auto-gen)
- Music library with licensed tracks
- **No draft saving** (unlike TikTok)

### 1.8 Spotlight Categories/Tabs
- **For You** tab (algorithmic feed)
- **Trending** tab
- **Following** tab (from friends)
- No manual category browsing — entirely algorithm-driven

### 1.9 Spotlight Interactions
- Like (heart), comment, share (to chat, story, or external)
- No duet or stitch feature
- No "save/bookmark" feature
- Remix: Can use sounds from other Spotlight snaps

### 1.10 Analytics
- **Personal stories**: View count, viewer list (who viewed each snap), screenshots taken
- **Spotlight**: Views, view time, shares, total views across all spotlights, subscriber count
- **Creator Dashboard**: Detailed analytics for public profiles

---

## 2. TIKTOK — Short Video

### 2.1 Video Feed Structure (N/A — no "stories" in TikTok's sense)
- TikTok doesn't have traditional stories. It introduced "TikTok Stories" briefly (15s videos that expire in 24h) but they appear in the main feed with a "Story" badge
- **Stories row**: Appears at top of For You/Following feed with circular avatars (similar to Instagram)

### 2.2 Feed Structure
- **Full-screen vertical swipe**: Each video takes entire screen
- **Auto-play**: Video auto-plays with sound when visible (respects device mute toggle)
- **Infinite scroll**: Seamless vertical scroll, pre-loads next 3-5 videos
- **Progress bar**: Thin line at bottom of video showing playback position
- **Video duration**: 15s, 60s, 3min, 10min (varies by account level)
- **Loop**: Videos loop by default — progress bar resets at end
- **Pause**: Tap screen to pause/resume. Double-tap to like (heart animation)

### 2.3 Creation Flow
- **Camera**: Full-screen camera with extensive controls
- **Record modes**: 15s, 60s, 3min, 10min timer options
- **Multi-clip**: Record multiple clips, re-order, delete individual clips
- **Speed controls**: 0.1x to 10x speed
- **Timer**: Countdown timer (3s or 10s) for hands-free recording
- **Filters/Effects**: Massive AR effects library, green screen, beauty filters, face tracking
- **Sounds**: Browse trending sounds, search music library, use original audio
- **Text overlay**: Multiple text elements with timing (appear/disappear at specific timestamps)
- **Stickers**: GIFs, emoji, interactive polls, hashtags, mentions
- **Voice effects**: Echo, synth, robot, etc.
- **Auto-captions**: AI-generated captions overlay
- **Drafts**: Save drafts to finish later
- **Upload from gallery**: With trimming and basic editing
- **Duet/Stitch**: Start duet or stitch from creation screen

### 2.4 Categories/Tabs
- **For You** (FYP): Algorithmic feed — the main experience
- **Following**: Content from followed creators
- **Friends**: Content from mutuals
- **LIVE**: Live streaming tab
- **Explore/Discover**: Search, trending hashtags, trending sounds, categories

### 2.5 Interactions
- **Like**: Heart icon (double-tap screen or tap icon) — heart burst animation
- **Comment**: Full comment section with reply threads, likes on comments, pinned comments
- **Share**: To DMs, other apps (WhatsApp, IG, etc.), copy link, embed, repost to friends
- **Save/Bookmark**: Save to collections (organized folders)
- **Duet**: Side-by-side video with original — can use left/right/split layout
- **Stitch**: Use first 5s of original video then your own continuation
- **Remix**: Similar to duet but appears in comments section
- **Repost**: Share to friends' For You feeds (no visible repost on profile)
- **Follow**: From video or profile
- **Sound use**: "Use this sound" to create with same audio
- **Not Interested**: Long-press → "Not interested" to train algorithm

### 2.6 Analytics
- **Creator tools**: Profile views, post views, likes, comments, shares, followers, following
- **Video-level**: Views, likes, comments, shares, saves, average watch time, traffic source, audience demographics
- **Real-time**: Live view count, real-time analytics for new posts
- **Trend alerts**: Notification when video starts trending

---

## 3. INSTAGRAM — Stories & Reels

### 3.1 Stories Format
- **Duration**: Photos 5-7s (varies), videos up to 15s per segment (longer videos auto-segmented)
- **Progress bar**: Segmented bar at top — one segment per story item. Completed = white, current = animating white, upcoming = translucent white
- **Navigation**: Tap left/right halves, swipe left to next user's story, swipe right to previous user, swipe down to exit
- **Auto-advance**: Stories auto-advance after duration. After all stories from a user, auto-advances to next user (brief "Up Next" transition)
- **Story Types**: Photo, video, boomerang, layout (multi-photo), hands-free, dual (front+back camera)

### 3.2 Story Creation
- **Camera**: Swipe right from feed to open story camera
- **Modes**: Normal, Boomerang, Layout, Dual, Hands-Free, Superzoom
- **Music**: Search and add music with lyric overlay, album art sticker
- **Stickers**: Location, hashtag, mention (@), poll, quiz, slider, countdown, GIF, emoji, link sticker (replaces swipe-up), donation, question box, challenge
- **Text**: Multiple text elements, font selection (Classic, Modern, Neon, Typewriter, etc.), color, background highlight, animation (fade, slide, bounce)
- **Drawing**: Pen, marker, highlighter, eraser tools with color picker
- **Filters**: AR effects from Effect Gallery, face filters
- **Camera roll upload**: Supported (from gallery)
- **Multi-capture**: Take multiple photos/videos in sequence
- **Collaborative**: Add others' posts/reels to your story

### 3.3 Story Viewer UX
- Full-screen immersive viewer
- **Tap zones**: Left = back, right = forward, center = pause
- **Long press**: Pause current story
- **Swipe left**: Skip to next user's story
- **Swipe right**: Go to previous user's story  
- **Swipe up**: Open link (if link sticker present) / reply to story
- **Reply**: Type a message or send a quick reaction (emoji hearts)
- **Quick reactions**: Tap and hold to send emoji reaction to story
- **Share**: Forward story via DM

### 3.4 Story Expiration & Persistence
- **24h expiration**: Stories disappear after 24 hours
- **Highlights**: Save stories to profile as permanent "Highlights" — circular icons below bio
  - Custom cover image and name for each highlight
  - No expiration — permanently visible on profile
  - Can add new stories to existing highlights
- **Archive**: Auto-archive of all stories (private, only visible to creator)
  - Can re-share from archive
  - Calendar view of past stories
  - Archive includes story view counts

### 3.5 Story Groups & Display
- **Story ring**: Gradient ring (purple/orange/pink) around avatar for unviewed, gray for viewed
- **Ordering**: Your own story first, then friends' stories (most recent first), then publisher/brand stories
- **Multi-story indicator**: Multiple stories from same user = play animation on ring
- **Story tray**: Horizontal scroll at top of feed

### 3.6 Reels Feed Structure
- **Full-screen vertical swipe**: Immersive vertical video feed
- **Auto-play**: Videos auto-play with sound (tap to toggle sound)
- **Progress bar**: Thin line at bottom showing playback position
- **Duration**: Up to 90 seconds (some accounts up to 3 min)
- **Loop**: Videos loop by default
- **Pre-load**: Next 2-3 videos pre-loaded for seamless scrolling

### 3.7 Reel Creation
- **Record or upload**: From gallery or in-app camera
- **Audio**: Search music library, use original audio, import audio
- **AR Effects**: Effect gallery with thousands of filters
- **Multi-clip**: Record multiple clips with individual trimming
- **Speed**: 0.1x to 10x
- **Timer**: Countdown timer for hands-free
- **Align**: Overlay previous clip for seamless transitions
- **Text**: Timed text overlays (appear/disappear at set timestamps)
- **Stickers**: GIFs, polls, quizzes, hashtag, mention
- **Voiceover**: Record narration over video
- **Captions**: Auto-generated captions
- **Drafts**: Save and resume later
- **Remix**: Create remix directly from any eligible reel

### 3.8 Reels Categories/Tabs
- **Reels tab** (bottom nav): Algorithmic feed
- **Audio**: Browse by trending audio/sounds
- **Explore**: Grid of reels organized by topic/interest
- No manual category tabs — algorithmically personalized

### 3.9 Reels Interactions
- **Like**: Heart (double-tap or tap icon)
- **Comment**: Full comment section with replies, likes, pinned comments
- **Share**: DM, stories, external apps, copy link
- **Save**: Save to collections
- **Remix**: Side-by-side or green-screen remix with original reel
- **Use Audio**: Create with same audio track
- **Follow**: From reel
- **Not Interested**: Mark content to train algorithm
- **QR code**: Share reel via QR

### 3.10 Analytics
- **Insights** (business/creator accounts):
  - Story metrics: Impressions, reach, replies, exits, taps forward/back, swipe-aways, sticker interactions
  - Reel metrics: Plays, likes, comments, shares, saves, reach, impressions, watch time
  - Audience demographics: Age, gender, location, active times
  - Content interactions: How people discovered the reel

---

## 4. YOUTUBE SHORTS

### 4.1 Feed Structure
- **Full-screen vertical swipe**: Immersive vertical video player
- **Auto-play**: Videos auto-play with sound when scrolled to (respects device mute)
- **Duration**: Up to 60 seconds (some up to 3 min for select creators)
- **Progress bar**: Thin red line at bottom showing playback position
- **Loop**: Videos loop by default
- **No stories**: YouTube doesn't have a "Stories" feature (Community posts serve a similar purpose)

### 4.2 Shorts Creation
- **Record or upload**: From camera or gallery
- **Multi-segment**: Record up to 15s per segment, string multiple together
- **Speed**: 0.5x to 2x (limited compared to TikTok)
- **Timer**: Countdown timer (3s, 5s, 10s)
- **Music**: Browse YouTube's massive music library, use audio from other Shorts
- **Text overlay**: Timed text elements
- **Filters**: Basic color filters (limited compared to TikTok/IG)
- **Captions**: Auto-generated with edit capability
- **Green screen**: Replace background with image
- **Align**: Match position from previous clip
- **Remix**: Sound, collab, or green screen remix
- **No stickers/GIFs**: Much more limited than TikTok/IG
- **No AR effects**: No face filters or AR lenses

### 4.3 Categories/Tabs
- **Shorts tab** (bottom nav): Algorithmic feed
- **Subscriptions**: Shorts from subscribed channels
- **Trending**: Trending Shorts
- **Search**: Search by topic/sound
- No manual category browsing — algorithm-driven

### 4.4 Interactions
- **Like/Dislike**: Thumbs up/down
- **Comment**: Full comment section (YouTube-style threaded comments)
- **Share**: Copy link, share to apps, embed
- **Save**: Save to playlist or "Watch Later"
- **Remix**: Sound remix, collab (side-by-side), green screen
- **Subscribe**: From Short
- **Sound use**: "Use this sound" to create Short with same audio
- **Not interested**: Feedback to algorithm

### 4.5 Analytics
- **YouTube Studio**:
  - Views, view duration, likes, dislikes, comments, shares, subscribers gained
  - Traffic source, audience retention curve
  - Reach: Impressions, click-through rate
  - Comparison: How Short performs vs. channel average
  - Real-time: Live view count updates

---

## 5. BEREAL

### 5.1 Stories Format (Unique Model)
- **No traditional stories**: BeReal's core is the daily 2-minute window
- **Once per day**: Notification at random time → 2 minutes to post front + back camera photo
- **No duration/progress bar**: It's a static dual-camera image, not a slideshow
- **No auto-advance**: Browse friends' BeReals at your own pace in a scrollable feed
- **Discovery feed**: "Discovery" tab shows BeReals from people you don't follow

### 5.2 Creation (The BeReal Post)
- **Dual camera**: Simultaneous front + back camera capture
- **2-minute window**: Must post within the window to be "on time"
- **Late post**: Can still post after window, but shows "late" timestamp
- **Retake**: Can retake as many times as you want within the window
- **No filters**: No filters, no editing, no text overlay — intentionally raw
- **Caption**: Can add text caption after capture
- **Location**: Optional location sharing
- **Music**: Can share what you're listening to (Spotify integration)

### 5.3 Viewer UX
- **Feed view**: Vertical scroll, each BeReal shows both cameras
- **Tap to expand**: Full-screen view of both cameras
- **RealMojis**: React with a selfie (takes a selfie of YOUR face as a reaction — not an emoji)
- **Comments**: Simple comment thread on each BeReal
- **Memory**: See your past BeReals in a calendar view
- **Zoom**: Pinch to zoom on BeReal photos

### 5.4 Expiration
- **No 24h expiration**: BeReals don't expire — they remain visible in your "Memory" timeline
- **Daily reset**: New day = new BeReal notification, yesterday's is still visible
- **Memory**: Private calendar view of all past BeReals

### 5.5 Story Groups
- **No grouping**: Each BeReal is a standalone post from a specific day
- **Friends feed**: Shows friends' BeReals for today, then past days
- **Discovery feed**: Global BeReals from today

### 5.6 Short Video
- **No short video feature**: BeReal is intentionally anti-video, anti-filter
- **BeReal with video**: Some users can post short video clips instead of photos, but it's very limited

### 5.7 Interactions
- **RealMoji**: Selfie reaction (unique to BeReal — no emoji, just your face)
- **Comment**: Simple text comments
- **Share**: Screenshot ( notifies the poster)
- **No like button**: BeReal removed the like count to reduce social pressure
- **No share to external**: Intentionally limited sharing

### 5.8 Analytics
- **Very limited**: No creator analytics dashboard
- **Post-level**: Number of RealMojis, number of comments
- **No metrics**: No views, reach, impressions, demographics

---

## 6. ORRA CURRENT IMPLEMENTATION (Detailed Code Analysis)

### 6.1 Stories
- **Story Bar**: Horizontal scroll with gradient rings (violet→fuchsia→pink) for unviewed, white/10 for viewed
- **Your Story**: First item with "+" badge, dashed ring, opens create story form
- **Multi-story badge**: Small gradient pill with count number on avatar
- **8 static fallback groups**: When API returns empty, shows hardcoded FALLBACK_STORIES array
- **Story Viewer**: 
  - Fixed overlay `z-[60]`, `bg-black/95 backdrop-blur-sm`
  - `max-w-lg max-h-[90vh]` container — not truly full-screen on desktop
  - Progress bars: 3px height, one per story in group, white fill with transition
  - Auto-advance: `p + 2` every 100ms = 5 seconds total (0→100 in 50 increments)
  - Navigation: Left/right tap zones (1/3 each), keyboard arrows, Escape to close
  - User info: Avatar, name (clickable → profile), timestamp
  - No reply/reaction feature
  - No pause-on-hold gesture
  - No swipe-down to dismiss
  - No video story support (images only)
  - `markStoryViewed` is client-side only — no server-side view tracking API
- **Story Creation**:
  - Upload photo (file input) or paste URL
  - Client-side compression: Canvas resize to 600x1000 max, JPEG 0.8 quality
  - Base64 encoding of image → sent to `/api/stories` POST
  - No filters, no text overlay, no stickers, no music, no drawing
  - No camera access, no multi-snap
  - No video stories
- **Story Expiration**: Server-side `expiresAt` set to 24h from creation. No archive, no highlights
- **Story Grouping**: Server-side grouping by `authorId`, sorted by: own → followed → others (by recency)
- **Viewed tracking**: Client-side `viewedStories` Set in Zustand store — not synced to server

### 6.2 Reels (Prism Reels)
- **Feed Layout**: Grid (2/3/4 columns depending on screen size) + featured reel on top
  - NOT vertical scroll — it's a grid layout with cards
  - Featured reel: Large card (h-72/h-96) with play button overlay
  - Grid cards: 9:16 aspect ratio with hover interactions
- **Category Tabs**: "For You", "Trending", "Music", "Dance", "Comedy", "Sports", "Art"
- **Reel Viewer Modal** (`ReelViewer`):
  - Fixed overlay `z-[55]`
  - `max-w-lg max-h-[90vh]` container
  - Video: autoPlay, loop, playsInline, controls (native browser controls)
  - Image fallback when no video
  - Side action bar: Like, Comment, Save, Share, Music spinner
  - Comment: "Coming soon" toast — not implemented
  - Share: Copies window.location.href to clipboard (doesn't link to specific reel)
  - No vertical scroll between reels — just a single reel viewer modal
  - No progress bar / playback indicator
  - No pause-on-tap (uses native video controls)
- **Reel Creation**:
  - Title input (required)
  - Category selector (pill buttons: Trending, Dance, Music, Comedy, Art, Lifestyle)
  - Video upload (MP4, WebM, MOV — max 50MB)
  - Song name (optional text input — no music library/search)
  - Base64 video encoding → sent to `/api/reels` POST
  - No trimming, no effects, no text overlay, no stickers, no camera recording
  - No drafts
- **Reel Cards**: 
  - Like, Save, Follow from cards (hover-revealed on grid, always visible on featured)
  - Live/Remix badges
  - Creator info with verified badge
  - View count
- **Data Model**: 
  - Reel: id, title, thumbnail, videoUrl, views, likesCount, commentsCount, category, song, isRemix, isLive, creatorId
  - No comments table for reels
  - No view duration tracking
  - No sound/audio library
- **Token Rewards**: +5 ORRA +10 XP for creating reel, +1 ORRA for liking

### 6.3 Identified Bugs/Issues
1. **`viewed` field on Story model**: The `viewed` boolean in the DB is never updated server-side — only the client-side Set tracks views. When a user reloads, all stories appear unviewed again.
2. **Share URL for reels**: Copies `window.location.href` instead of a link to the specific reel — useless.
3. **Comments on reels**: "Coming soon" toast — the UI shows comment counts but the feature doesn't exist.
4. **Music spinner always spinning**: The Music icon has `animate-spin` even when no audio is playing — visual noise.
5. **Category filtering is client-side only**: All reels fetched from API, then filtered client-side by category. Should be server-side filtering.
6. **Base64 video upload**: 50MB video as base64 = ~67MB request body. This will fail on most servers with default body size limits (Next.js default is 1MB for API routes).
7. **No thumbnail generation**: Thumbnail field is empty string by default — no auto-generation from video frame.
8. **Story creation accepts URL input**: The input field accepts raw URLs but the API just stores whatever string is sent — no URL validation, no image download, no preview verification.
9. **ReelViewer single-reel**: Can only view one reel at a time — no vertical scrolling between reels in the viewer.
10. **No view count increment**: Reel views are never incremented server-side when a reel is watched.

---

## 7. CRITICAL ANALYSIS

### 7.1 What ORRA is Doing RIGHT

| Feature | Why It's Good |
|---------|--------------|
| **Gradient ring for unviewed stories** | Matches Instagram's visual language — users immediately understand |
| **Story grouping by author with per-group progress bars** | Correct implementation matching Instagram/Snapchat pattern |
| **24h expiration with server-side expiresAt** | Standard behavior, correctly implemented |
| **"Your Story" as first item with + badge** | Matches Instagram/Snapchat pattern |
| **Multi-story count badge** | Good UX showing number of stories per user |
| **Category tabs for reels** | More structured than TikTok/IG's pure algorithmic approach — good for a smaller community |
| **Token rewards for engagement** | Unique gamification angle that competitors don't have |
| **Live/Remix badges** | Good visual indicators for content types |
| **Like/Save/Follow from reel cards** | Reduces friction — don't need to open reel to interact |
| **Fallback stories when API is empty** | Ensures the stories section is never blank — good for demo/onboarding |

### 7.2 What ORRA is MISSING or Could Improve

#### STORIES — Critical Gaps

| Gap | Severity | Platform Reference |
|-----|----------|-------------------|
| **No video story support** | 🔴 Critical | Every major platform supports video stories |
| **No story reply/reactions** | 🔴 Critical | Instagram: reply + reactions, Snapchat: chat reply |
| **No story camera** | 🔴 Critical | All platforms open camera first for stories |
| **No text overlay on stories** | 🟡 High | Instagram/Snapchat: rich text with fonts, timing, animation |
| **No stickers on stories** | 🟡 High | Instagram: polls, quizzes, mentions, hashtags, GIFs |
| **No story filters/effects** | 🟡 High | Snapchat/Instagram: AR lenses, face filters, geofilters |
| **No music on stories** | 🟡 High | Instagram/Snapchat: music with lyrics overlay |
| **No story highlights/archive** | 🟡 High | Instagram: permanent highlights on profile, auto-archive |
| **No pause-on-hold gesture** | 🟡 High | All platforms: long press to pause |
| **No swipe-down to dismiss** | 🟡 High | All platforms: swipe down to exit viewer |
| **Viewed state not synced to server** | 🔴 Critical | Story `viewed` boolean never updated server-side |
| **No view tracking (who viewed)** | 🟡 High | Instagram/Snapchat: see list of who viewed each story |
| **No story sharing (to DM)** | 🟡 High | Instagram: forward story to DM |
| **Static 5s duration for all stories** | 🟠 Medium | Instagram/Snapchat: variable by content type, video plays full length |

#### REELS — Critical Gaps

| Gap | Severity | Platform Reference |
|-----|----------|-------------------|
| **No vertical scroll feed** | 🔴 Critical | Every competitor uses vertical swipe — grid layout is fundamentally wrong for short video |
| **No auto-playing video in feed** | 🔴 Critical | TikTok/IG/YouTube: videos auto-play when scrolled into view |
| **No swipe between reels in viewer** | 🔴 Critical | TikTok/IG/YouTube: swipe up to next reel in viewer |
| **Comments not implemented** | 🔴 Critical | UI shows counts but feature is "coming soon" |
| **No sound toggle** | 🔴 Critical | All competitors: explicit sound on/off control |
| **No duet/stitch/remix creation** | 🟡 High | TikTok: duet + stitch, IG: remix, YouTube: collab |
| **No music library/search** | 🟡 High | All competitors: searchable music library with trending sounds |
| **No auto-captions** | 🟡 High | TikTok/IG/YouTube: AI-generated captions |
| **No camera recording in-app** | 🟡 High | All competitors: record directly in reel creation |
| **No trimming/editing tools** | 🟡 High | All competitors: multi-clip trim, re-order |
| **No text overlay with timing** | 🟡 High | TikTok/IG: text appears/disappears at set timestamps |
| **No drafts** | 🟡 High | TikTok/IG: save draft to finish later |
| **No "Use this sound"** | 🟡 High | TikTok/IG/YouTube: create with same audio |
| **Share URL is wrong** | 🔴 Bug | Copies `window.location.href` instead of reel-specific link |
| **Base64 video upload** | 🔴 Bug | Will fail for most videos due to body size limits |
| **No thumbnail auto-generation** | 🟡 High | All competitors: auto-extract thumbnail from video |
| **No view count increment** | 🔴 Bug | Reel views never incremented when watched |
| **No save/bookmark feature in viewer** | 🟠 Medium | Grid has save but viewer doesn't properly persist |
| **Music icon always spinning** | 🟠 Bug | Animation runs even when no audio is playing |
| **No "For You" algorithm** | 🟡 High | All competitors use recommendation algorithms, ORRA just shows newest first |

### 7.3 Specific Actionable Recommendations (Priority Order)

#### P0 — Critical (Must Fix)

1. **Fix story viewed state persistence** (Bug)
   - Add `PATCH /api/stories/[id]/view` endpoint to mark stories as viewed server-side
   - On story viewer open, batch-mark viewed stories via API
   - Sync client `viewedStories` Set with server data on hydrate

2. **Fix reel share URL** (Bug)
   - Change from `window.location.href` to `${window.location.origin}/reels/${reel.id}`
   - Or deep link: `${window.location.origin}?reel=${reel.id}`

3. **Fix video upload approach** (Bug)
   - Replace base64 encoding with multipart/form-data upload
   - Use streaming upload for large files
   - Increase Next.js API body size limit in `next.config.ts`
   - Add chunked upload support for files >10MB

4. **Fix reel view count tracking** (Bug)
   - Add `PATCH /api/reels/[id]/view` endpoint that increments `views` count
   - Call this when reel viewer opens for the first time per session

5. **Implement vertical scroll reel viewer** (Feature)
   - Replace single-reel modal with TikTok-style vertical scroll container
   - Swipe up → next reel, swipe down → previous reel
   - Auto-play video when scrolled into view
   - Show all interaction buttons (like, comment, save, share) overlaid on each reel
   - Pre-load next 2-3 reels for seamless scrolling

6. **Implement reel comments** (Feature)
   - Create `ReelComment` model in schema (similar to `Comment` for posts)
   - Add bottom-sheet comment UI in reel viewer
   - Support threaded replies, likes on comments

7. **Add video story support** (Feature)
   - Accept video uploads in story creation (short clips, 5-15s)
   - Auto-play video stories in viewer with full duration
   - Show video playback progress instead of fixed timer

#### P1 — High Priority

8. **Add story reply/reactions**
   - "Reply to story" input at bottom of story viewer
   - Quick emoji reactions (tap to send)
   - Reactions delivered as DM messages to story author

9. **Add sound toggle for reels**
   - Global mute/unmute toggle in reel viewer
   - Persist preference in localStorage
   - Start muted by default (match industry standard)

10. **Add pause-on-hold for stories**
    - Long press (mousedown/touchstart) pauses progress timer
    - Release resumes — matches Instagram/Snapchat behavior

11. **Add swipe-down to dismiss story viewer**
    - Vertical swipe gesture detection (drag down >100px)
    - Smooth animation to close

12. **Add story highlights/archive**
    - `StoryHighlight` model: id, name, coverImage, userId, stories (ordered list)
    - Highlight creation from archived stories
    - Display highlights on profile page (circles below bio)
    - Auto-archive all stories for creator

13. **Add "Use this sound" for reels**
    - Click song name on any reel → open creation with that audio
    - Sound page showing all reels using that sound

14. **Add story camera with basic tools**
    - Camera access via `navigator.mediaDevices.getUserMedia`
    - Photo capture and short video recording
    - Basic text overlay with font selection
    - Simple filter selection (brightness, contrast, preset filters)

15. **Add reel text overlay with timing**
    - Text elements that can be positioned on video
    - Start time / end time for each text element
    - Font selection, color, background

#### P2 — Medium Priority

16. **Add story stickers** (polls, mentions, hashtags, location)
    - Interactive poll sticker: 2 options, vote tracking
    - Mention sticker: @username linking to profile
    - Hashtag sticker: links to search/explore
    - Location sticker: shows place name

17. **Add story view tracking** (who viewed)
    - `StoryView` model: userId, storyId, viewedAt
    - View list accessible to story author
    - Show viewer count + "Seen by X" on own stories

18. **Add music library for reels**
    - Curated song catalog (licensed or original)
    - Trending sounds section
    - Search by song name or artist
    - Preview before selecting

19. **Add reel trimming/editing tools**
    - Trim start/end of video clips
    - Multi-clip composition (record multiple segments)
    - Speed control (0.5x, 1x, 2x)

20. **Add auto-captions for reels**
    - Speech-to-text for uploaded videos
    - Editable caption overlay
    - Toggle captions on/off in viewer

21. **Add drafts for reel creation**
    - `ReelDraft` model: id, userId, title, videoUrl, category, song, createdAt
    - Save draft button in creation form
    - Drafts list in creation screen
    - Resume editing from draft

22. **Fix music spinner animation**
    - Only animate when audio is actively playing
    - Stop animation when video is paused

23. **Add server-side category filtering for reels**
    - Move filtering to `GET /api/reels?category=X` (already partially supported)
    - Remove client-side filtering in PrismReels component
    - Add pagination (infinite scroll) for reel feed

24. **Add "For You" recommendation algorithm**
    - Track reel interactions (views, likes, completion rate)
    - Score reels based on user engagement patterns
    - Prioritize reels from followed users + similar content
    - Boost new content for discovery

#### P3 — Nice to Have

25. **Add duet/remix for reels**
    - Side-by-side layout (like TikTok duet)
    - Green screen mode (like IG/YT remix)
    - Mark original as "remixed X times"

26. **Add BeReal-style dual camera stories**
    - Option to capture front + back camera simultaneously
    - Display as split-screen in story viewer
    - Unique differentiator from competitors

27. **Add RealMoji-style reactions for stories**
    - Selfie reaction (capture front camera as reaction)
    - More personal than emoji reactions

28. **Add story analytics for creators**
    - View count, viewer list, reply count, reaction count
    - Completion rate (how many watched the full story)
    - Exit rate (at which story viewers left)

29. **Add reel analytics dashboard**
    - Views, likes, comments, shares, saves per reel
    - Average watch time / retention curve
    - Follower conversion rate
    - Traffic source breakdown

30. **Add QR code sharing for reels**
    - Generate QR code for each reel
    - Scan to open reel directly

---

## 8. FEATURE COMPARISON MATRIX

| Feature | Snapchat | TikTok | Instagram | YouTube | BeReal | ORRA |
|---------|----------|--------|-----------|---------|--------|------|
| **Story photo** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Story video** | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| **Story camera** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Story text overlay** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Story stickers** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Story music** | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| **Story filters/AR** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Story reply** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Story reactions** | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Story highlights** | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Story archive** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **24h expiration** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Story view tracking** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Vertical video feed** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Auto-play video** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Sound toggle** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Reel comments** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Duet/Stitch/Remix** | ❌ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Music library** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Auto-captions** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Text with timing** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Drafts** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Creator analytics** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Category tabs** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Token rewards** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Gamification** | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ |

Legend: ✅ Full feature | ⚠️ Partial/Limited | ❌ Not available

---

## 9. KEY TAKEAWAYS

### ORRA's Unique Advantages
1. **Token economy** — No competitor rewards engagement with a spendable currency
2. **Category tabs** — More navigable than pure algorithmic feeds (better for smaller communities)
3. **Gamification layer** — ORRA/XP/streak system adds engagement incentive beyond social validation

### ORRA's Critical Weaknesses
1. **Story system is image-only** — Every competitor supports video stories; ORRA doesn't
2. **Reel viewer is fundamentally wrong** — Grid layout + modal viewer instead of vertical scroll feed
3. **Zero content creation tools** — No camera, no filters, no text overlay, no stickers, no music library
4. **No social features in story viewer** — No reply, no reactions, no sharing
5. **Multiple bugs** — Viewed state not persisted, share URL broken, upload approach broken, view counts not tracked

### The #1 Priority
**Convert the reel viewer from a grid+modal to a TikTok-style vertical scroll feed.** This is the single biggest UX gap. Short video content consumed via grid is fundamentally a different (worse) experience than vertical scroll. Every successful short video platform uses vertical scroll — it's not optional, it's the core interaction pattern.

### The #2 Priority
**Fix the 5 identified bugs** — viewed state, share URL, upload approach, view counts, and music spinner. These are not feature gaps; they're broken functionality that degrades trust.

### The #3 Priority
**Add video story support + story creation tools** — Even basic camera access + text overlay would bring ORRA from "significantly behind" to "competitive" for stories.

---

*End of Research Report*
