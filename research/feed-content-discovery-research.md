# Feed & Content Discovery Research Report

## ORRA Competitive Analysis — March 2026

---

# 1. INSTAGRAM

## 1.1 Feed Algorithm
- **Type**: Heavily algorithmic (since 2022, moved away from chronological)
- **Ranking Signals** (in order of weight):
  1. **User Activity**: What posts you've liked, saved, shared, commented on recently
  2. **Information about the post**: Engagement velocity (likes/comments/shares per hour), content type (reels get priority), recency
  3. **Information about the author**: How often you interact with this person, direct messages exchanged, searches for their profile
  4. **User history**: Your past interactions with similar content, time spent on similar posts
- **Personalization**: AI-driven "interest prediction" — scores each post 0-100 based on predicted likelihood of engagement
- **Content Types Prioritized**: Reels > Carousels > Single images > Text posts
- **Timeliness**: Recent posts get a boost, but popular older posts can resurface

## 1.2 Feed Types
- **Home Feed** — Default algorithmic feed mixing Following + Suggested
- **Following** — Pure chronological feed of accounts you follow (accessible via dropdown)
- **Favorites** — Chronological feed of up to 50 favorited accounts
- **Explore** — Grid of algorithmically recommended content (masonry layout)
- **Reels Tab** — Full-screen vertical video feed (TikTok clone)
- **Search** — Unified search for people, tags, places, audio

## 1.3 Content Cards
- **Image sizing**: Square (1:1), Portrait (4:5), Landscape (1.91:1) — adaptive cropping
- **Carousel**: Up to 10 images/videos, horizontal swipe, dot indicators
- **Text truncation**: Caption truncated at ~2 lines with "more" button
- **Interaction buttons**: Like (heart), Comment, Share, Save — positioned below image in a row
- **Engagement preview**: "Liked by X and 234 others" above action buttons
- **Author info**: Avatar + name + location tag above the image

## 1.4 Pull to Refresh
- **Animation**: Custom circular spinner with gradient (Instagram's orange-pink-purple)
- **New content indicator**: "New Posts" button appears at top when new content is available (avoids jarring feed shift)
- **Haptic feedback**: Subtle on supported devices
- **No "new posts" banner** in the Following tab — just refreshes in place

## 1.5 Infinite Scroll
- **Lazy loading**: Images load progressively with blur-up placeholder
- **Skeleton screens**: Shimmering gray rectangles for loading content
- **Preloading**: Next batch of posts pre-fetched when user is 2-3 posts from bottom
- **Batch size**: ~15 posts per fetch
- **No explicit "Load More" button** — seamless infinite scroll

## 1.6 Content Filtering
- **Explore categories**: Auto-generated based on user interests (Food, Art, Travel, etc.)
- **Keyword search**: Search bar filters by accounts, hashtags, places, audio
- **Following/Favorites toggle**: Effectively filters to specific user subsets
- **No mood/emotion filtering** — purely engagement-based

## 1.7 Vibe/Mood Tags
- **None** — Instagram has no mood or emotion tagging system
- Closest equivalent: Hashtags that users add manually (#mood #vibes)
- Music tags on Reels provide some ambient mood context

## 1.8 Boosted/Promoted Content
- **Sponsored posts**: "Sponsored" label + advertiser name below author info
- **In-feed ads**: Seamlessly integrated, look identical to regular posts but with "Sponsored" tag
- **Story ads**: Full-screen between organic stories
- **Explore ads**: Appear in the Explore grid
- **Reels ads**: Short video ads between organic Reels

## 1.9 Empty States
- **New user**: "Follow accounts to see posts here" + suggested accounts carousel
- **No search results**: "No results found" with alternative search suggestions
- **Empty following**: "Discover People" section with recommendations

## 1.10 Feed Performance
- **Load time**: <200ms for cached feed, <1s for fresh content
- **Image optimization**: Adaptive quality based on connection, WebP format, lazy loading
- **Caching**: Aggressive client-side caching of viewed content
- **Prefetching**: Next 3-5 posts preloaded based on scroll velocity
- **CDN**: Global edge network for media delivery

---

# 2. TIKTOK

## 2.1 Feed Algorithm
- **Type**: Fully algorithmic — the gold standard of content recommendation
- **Core System**: "For You" page powered by deep learning recommendation engine
- **Ranking Signals**:
  1. **Watch time & completion rate** (highest weight): Did you watch the whole video? Rewatch?
  2. **Engagement**: Likes, comments, shares, saves — weighted by timing (quick engagement = higher signal)
  3. **Content interaction**: Whether you "not interested" similar content
  4. **Creator interaction**: Do you follow, message, or visit this creator's profile?
  5. **Content metadata**: Audio, hashtags, effects, captions — used to classify content
  6. **Device/account info**: Language, country, device type
- **Cold Start**: New videos shown to small test group (200-500 users), then scaled based on performance
- **Exploration vs Exploitation**: ~20% of feed is "exploratory" content outside your usual interests
- **Session-based**: Algorithm adapts within a single session — what you watch in the first 5 minutes influences the next 30

## 2.2 Feed Types
- **For You** — Default, fully algorithmic (main experience)
- **Following** — Chronological from followed accounts
- **Friends** — Content from mutual connections
- **Live** — Currently-live broadcasts from followed/related creators
- **Explore/Search** — Trending content, hashtags, sounds, effects

## 2.3 Content Cards
- **Full-screen vertical video** — 9:16 aspect ratio, immersive
- **Overlay UI**: Creator info (avatar, name, follow button) on right side
- **Interaction buttons**: Like, Comment, Save, Share — vertical stack on right side
- **Text overlay**: Caption at bottom, truncated with "See more"
- **Music info**: Scrolling song name at bottom
- **Progress bar**: Thin line at top showing video progress

## 2.4 Pull to Refresh
- **Pull down**: Refreshes the entire For You feed with new content
- **Animation**: TikTok logo spinner with bounce effect
- **No partial refresh**: Full new batch of recommended content
- **Haptic**: Light haptic on successful refresh

## 2.5 Infinite Scroll
- **Vertical swipe**: Full-screen swipe between videos (not gradual scroll)
- **Preloading**: Next video auto-preloads when current is 50%+ watched
- **Buffering indicator**: Minimal — video pauses briefly with subtle loading animation
- **Smart caching**: Previously viewed videos cached for instant rewatch
- **No pagination UI** — feels infinite and seamless

## 2.6 Content Filtering
- **Content preferences**: "Filter keywords" to exclude topics, "Not Interested" on individual videos
- **Search**: Filter by videos, users, sounds, hashtags, effects
- **Category tabs** in Explore: Trending, Food, Comedy, Sports, etc.
- **Restrict mode**: Limits content to general audience

## 2.7 Vibe/Mood Tags
- **None** — TikTok relies on its algorithm to infer mood preferences from behavior
- No explicit mood/emotion tagging
- Sounds/music serve as implicit mood indicators

## 2.8 Boosted/Promoted Content
- **In-feed ads**: Full-screen video ads, "Sponsored" label, skip after 3-5 seconds
- **Spark Ads**: Boost organic creator content (looks native, labeled "Sponsored")
- **TopView**: First thing user sees when opening app (full-screen takeover)
- **Branded effects/h hashtags**: Paid branded content tools

## 2.9 Empty States
- **New user**: Interest selection onboarding ("Pick 3+ categories you like")
- **No Following content**: "Follow creators to see their videos here" + suggestions
- **Search empty**: "No results" + trending suggestions

## 2.10 Feed Performance
- **Load time**: <300ms for next video, near-instant with preloading
- **Video optimization**: Adaptive bitrate streaming, thumbnail-based preloading
- **Data saver mode**: Lower resolution option for limited data plans
- **CDN**: TikTok's own global CDN with edge computing for video delivery
- **Cache strategy**: Videos cached locally for 24-48 hours

---

# 3. TWITTER/X

## 3.1 Feed Algorithm
- **Type**: Hybrid — default algorithmic, optional chronological
- **Algorithm (For You)**: X's "For You" uses a neural network ranking system
- **Ranking Signals**:
  1. **Engagement prediction**: Like/retweet/reply probability scored per tweet
  2. **Recency**: Time decay factor — newer tweets get boost
  3. **Author relationship**: Do you follow them? How often do you interact?
  4. **Tweet features**: Media attached (images/video get boost), threads, polls
  5. **Social proof**: How many of your mutuals engaged with this tweet
  6. **Negative signals**: "Show less often" feedback, blocks, mutes
- **Content mixing**: ~50% from followed accounts, ~50% recommended/suggested
- **Community Notes**: Crowd-sourced context attached to misleading tweets

## 3.2 Feed Types
- **For You** — Algorithmic, mixes followed + recommended
- **Following** — Pure reverse-chronological from followed accounts
- **Lists** — Curated feeds from list members (chronological)
- **Communities** — Topic-based group feeds
- **Spaces** — Live audio/video conversations
- **Trending** — Sidebar with trending topics tailored to user

## 3.3 Content Cards
- **Text-first design**: 280-char text, expandable for longer posts (X Premium)
- **Media**: Images (up to 4, grid layout), videos (16:9), GIFs
- **Interaction buttons**: Reply, Repost, Like, View count, Share/Bookmark — horizontal row
- **Quote tweets**: Shown as embedded card within the tweet
- **Author info**: Avatar, display name, @handle, verification badge, timestamp
- **Engagement stats**: View count, retweet count, like count, bookmark count

## 3.4 Pull to Refresh
- **Animation**: X logo spinner with smooth rotation
- **New content indicator**: "See X new posts" banner at top of feed (non-intrusive)
- **Timeline gap**: When refreshing, new posts inserted at top without shifting current scroll position
- **Auto-refresh**: Timeline silently updates when idle

## 3.5 Infinite Scroll
- **Lazy loading**: Posts load as you scroll, seamless pagination
- **Skeleton screens**: Gray placeholder cards while loading
- **Prefetching**: Next batch loaded when user is near bottom
- **"Show more" for threads**: Long threads collapsed with expand button

## 3.6 Content Filtering
- **Muted words**: Users can mute specific words/phrases from feed
- **Muted accounts**: Hide specific accounts without unfollowing
- **Content warnings**: Sensitive content hidden behind warning overlay
- **Topic following**: Follow specific topics for tailored content
- **Circle**: Share only with selected group of people

## 3.7 Vibe/Mood Tags
- **None** — Twitter/X has no mood tagging
- Closest: Topic following (Technology, Sports, Gaming, etc.)
- Hashtags serve as informal topic/mood markers

## 3.8 Boosted/Promoted Content
- **Promoted posts**: "Ad" label + "Promoted" text, appear in For You feed
- **Promoted trends**: Sponsored trending topics in sidebar
- **Promoted accounts**: "Follow" suggestions in sidebar with "Promoted" label
- **Pre-roll ads**: Video ads before/within video content

## 3.9 Empty States
- **New user**: "Start by following some accounts" + category-based suggestions
- **Empty search**: "No results for [query]" + suggestions to try different terms
- **Empty list**: "No tweets yet" with option to add members

## 3.10 Feed Performance
- **Load time**: <500ms for initial feed, <200ms for pagination
- **Optimization**: Tweet text served first, media lazy-loaded
- **Caching**: Aggressive HTTP caching, service worker for offline
- **Image optimization**: WebP/AVIF with responsive sizing
- **Infinite scroll**: Cursor-based pagination for consistent ordering

---

# 4. THREADS

## 4.1 Feed Algorithm
- **Type**: Heavily algorithmic with recent shifts toward engagement-based ranking
- **Ranking Signals**:
  1. **Engagement likelihood**: Predicted probability of like, reply, repost
  2. **Recency**: Strong time-decay factor — fresh content prioritized
  3. **Author relationship**: Followed accounts weighted heavily
  4. **Content type**: Threads with media (images) get slight boost
  5. **Conversation quality**: Reply chains and engagement depth signal quality
- **Feed composition**: Mix of followed accounts + suggested content (suggested content percentage has been increasing)
- **No explicit chronological option** — only "Following" feed is chronological

## 4.2 Feed Types
- **For You** — Default algorithmic feed
- **Following** — Chronological feed from followed accounts
- **Search/Explore** — Trending topics and suggested content
- **Activity Feed** — Who liked, replied, followed you

## 4.3 Content Cards
- **Text-first** design (similar to Twitter/X)
- **500 character limit** per post
- **Media**: Up to 10 images in carousel, videos up to 5 minutes
- **Interaction buttons**: Like (heart), Comment, Repost, Share — horizontal row
- **Thread indicator**: Connected posts shown with line + number indicator
- **Quote threads**: Embedded thread preview within a post

## 4.4 Pull to Refresh
- **Animation**: @ symbol spinner (Threads branding)
- **New content indicator**: No persistent banner — feed refreshes in place
- **Smooth transition**: New posts slide in from top without jarring jump

## 4.5 Infinite Scroll
- **Seamless**: No pagination indicators, continuous scroll
- **Loading indicator**: Small spinning @ symbol between batches
- **Media lazy loading**: Images load as they enter viewport

## 4.6 Content Filtering
- **Following tab**: Filters to followed accounts only
- **Search**: Keyword search for people and topics
- **Hidden words**: Auto-hide posts with offensive words
- **Followed topics**: Limited — Threads relies more on algorithmic curation
- **No content type filters** — can't filter by images-only, etc.

## 4.7 Vibe/Mood Tags
- **None** — No mood or emotion tagging
- Custom voice/poll features add some interaction variety
- No topic-tagging system beyond mentions and hashtags

## 4.8 Boosted/Promoted Content
- **Ads started rolling out** in early 2025
- **"Sponsored" label** on promoted posts in-feed
- **Limited ad formats** compared to Instagram/Facebook
- **No story ads or reels ads** (yet)

## 4.9 Empty States
- **New user**: "Follow profiles to get started" + Instagram cross-platform suggestions
- **Empty search**: "No results" with trending topics as alternatives
- **No posts yet**: Profile shows "No threads yet" with create prompt

## 4.10 Feed Performance
- **Load time**: <300ms, backed by Meta infrastructure
- **Optimization**: Inherits Meta's image pipeline (blurhash placeholders, progressive loading)
- **CDN**: Meta's global edge network
- **Caching**: Aggressive client-side with service workers

---

# 5. FACEBOOK

## 5.1 Feed Algorithm
- **Type**: Heavily algorithmic — the original social feed algorithm
- **Ranking Signals** (Meaningful Social Interactions framework):
  1. **Inventory**: All available posts from friends, groups, pages you follow
  2. **Signals**:
     - **Who posted**: Relationship strength (frequency of interactions)
     - **Post type**: Video, photo, link, status — weighted by your past engagement
     - **Post activity**: Comments, likes, shares velocity
     - **Creator's history**: How often people engage with this creator
     - **Recency**: Time since posting
     - **Content quality**: Clickbait downranked, original content upranked
  3. **Predictions**: Probability you'll like, comment, share, click, spend time
  4. **Relevance score**: Final composite score determines position
- **Feed composition**: ~60% from friends/groups, ~40% suggested/recommended
- **Time spent**: Strong signal — how long you spend viewing a post matters

## 5.2 Feed Types
- **Home Feed** — Default algorithmic (Friends + Suggested + Groups)
- **Feeds tab** — Sub-tabs: Favorites, Friends, Groups, Pages
- **Reels** — Short-form video feed
- **Stories** — Ephemeral content from friends and pages
- **Watch** — Long-form video feed
- **Marketplace** — Local buying/selling feed
- **Groups Feed** — Content from groups you've joined

## 5.3 Content Cards
- **Variable height**: Adaptive based on content type
- **Images**: Full-width, aspect-ratio preserved
- **Text truncation**: "See more" after 3-4 lines
- **Interaction buttons**: Like (with reactions), Comment, Share — horizontal row
- **Engagement preview**: "X and Y others" with reaction emojis
- **Shared posts**: Nested card showing original post
- **Link previews**: Rich card with image, title, domain

## 5.4 Pull to Refresh
- **Animation**: Facebook blue spinner with smooth rotation
- **New content indicator**: "New stories" count badge at top
- **Memory feature**: "On This Day" occasionally appears after refresh
- **Auto-refresh**: Feed silently updates when returning to app

## 5.5 Infinite Scroll
- **Seamless infinite scroll** with cursor-based pagination
- **Skeleton screens**: Gray rectangles with subtle shimmer animation
- **Adaptive preloading**: Preloads more content on fast connections
- **Video autoplay**: Videos autoplay (muted) as they enter viewport
- **Batch loading**: ~10-15 posts per batch

## 5.6 Content Filtering
- **Feeds tab**: Filter by Favorites, Friends, Groups, Pages
- **Content preferences**: "Why am I seeing this?" + adjust per-topic
- **Snooze**: Temporarily hide someone for 30 days
- **Unfollow**: Hide without unfriending
- **Keyword snooze**: Temporarily hide topics (e.g., "spoilers")
- **Reaction-based**: Reacting with Angry reduces similar content

## 5.7 Vibe/Mood Tags
- **None** — No mood/emotion tagging system
- **Reactions** (Like, Love, Haha, Wow, Sad, Angry) provide implicit mood data
- Facebook uses reaction data to inform feed algorithm

## 5.8 Boosted/Promoted Content
- **Sponsored posts**: "Sponsored" label with advertiser disclosure
- **In-feed ads**: Seamlessly integrated, multiple formats (image, video, carousel)
- **Story ads**: Between organic stories
- **Reels ads**: Video ads in Reels feed
- **Marketplace ads**: Product listings
- **Event ads**: Local event promotions

## 5.9 Empty States
- **New user**: "Add friends to see their posts here" + suggestions from contacts
- **Empty search**: "No results" with popular alternatives
- **Empty group**: "Be the first to post!" with create button

## 5.10 Feed Performance
- **Load time**: <300ms with GraphQL-based data fetching
- **Optimization**: Relay framework for declarative data fetching
- **Image pipeline**: Blurhash placeholders → progressive JPEG → full quality
- **Video**: Adaptive bitrate streaming with thumbnail preload
- **CDN**: Meta's global edge network (one of the world's largest)

---

# ORRA'S CURRENT IMPLEMENTATION (Detailed Code Analysis)

## Feed Architecture
Based on deep analysis of the ORRA codebase (`pulse-feed.tsx`, `api-hooks.ts`, `aura-store.ts`, `/api/posts/route.ts`, `schema.prisma`):

### Feed Algorithm
- **Pure reverse-chronological**: `orderBy: { createdAt: "desc" }` — no algorithmic ranking
- **No personalization**: Every user sees the same feed order
- **No engagement-based ranking**: Posts with 0 likes and 1000 likes appear in same chronological order
- **Vibe tag filtering**: Only first selected vibe tag is sent to API; rest filtered client-side
- **Boosted posts**: Sorted to top via client-side `sort()` — `boostedPosts.has(post.id) ? 1 : 0`

### Feed Types
- **Pulse** — Main text/image/poll feed (the only real "feed")
- **Prism** — Reels/video viewer (separate view, not integrated)
- **Hub** — Community-specific posts (separate view)
- **Explore** — Discovery/search (separate view with static data + search API)
- **No "Following" vs "For You" distinction** — everyone sees everything chronologically

### Content Cards
- **Post layout**: Glass-panel rounded card with header (avatar + name + time + vibe tag), content, actions
- **Image sizing**: Grid layout for multi-image (2-col), max-h-[400px] for single image
- **Text**: No truncation — full text always displayed
- **Videos**: `<video>` element with controls, max-h-[400px], 16:9 aspect ratio
- **Interaction buttons**: Like, Comment, Echo (repost), Share — horizontal row + Bookmark separately
- **Vibe tag**: Color-coded pill badge on each post
- **Type indicators**: "Pulse", "Poll", "Reel", "Photo" labels

### Pull to Refresh
- **No pull-to-refresh gesture implemented**
- **Auto-polling**: `refetchInterval: 5000` (5 seconds) via React Query
- **Refetch on focus**: `refetchOnWindowFocus: true`
- **No "new posts" indicator/banner**
- **No refresh animation**
- **Loading state**: Simple spinner + "Loading posts..."

### Infinite Scroll
- **No infinite scroll implemented** — all posts load at once (limit: 20, page: 1)
- **No pagination UI** — only first 20 posts visible, no way to load more
- **No skeleton screens** — just a single spinner while loading
- **No lazy loading** for images (all images load immediately)

### Content Filtering
- **Vibe tags**: 8 mood tags (Hyped, Laughing, Chill, Dramatic, Focused, Peaceful, News, Sports)
- **Search**: Filters by post text and author name (client-side for vibe, API for text/name)
- **No content type filter**: Can't filter by image-only, text-only, polls-only
- **No following filter**: No way to see only posts from followed users
- **No trending/discover filter**: No "hot" or "trending" sorting

### Vibe/Mood Tags
- **Community Vibe Bar**: 8 mood tags with "LIVE" indicator and animated gradient bar
- **Multi-select**: Users can select multiple vibes simultaneously
- **Filter banner**: Shows active vibe filters with clear button
- **Vibe tag on posts**: Color-coded pill showing post's vibe category
- **Mood Wave visualization**: Animated gradient bar (mood-wave-bar class)
- **Limitation**: Only primary vibe sent to API; multi-vibe filtering is client-side only

### Boosted/Promoted Content
- **Boosted posts**: "BOOSTED" badge with rocket icon at top of post
- **Token cost**: Users spend ORRA tokens to boost their posts
- **Client-side only**: Boosted status stored in Zustand/localStorage — NOT in database
- **No "Sponsored" equivalent**: No paid advertising system
- **No external ads**: No ad network integration

### Empty States
- **No posts**: "No posts found [for X vibe]." + "Clear filter" button
- **Loading**: Spinner + "Loading posts..."
- **Error**: "Failed to load posts" + "Retry" button (page reload)
- **No onboarding suggestions**: No "suggested accounts" or "follow people" prompt

### Feed Performance
- **API polling**: Every 5 seconds — **extremely aggressive**, causes unnecessary server load
- **staleTime: 0**: Always refetch, never use cache
- **No image optimization beyond sharp**: Resized to 1200px wide, JPEG quality 80
- **No blurhash/placeholder**: Images just pop in or show broken placeholder
- **No CDN**: Images served directly from Next.js public/uploads
- **No cursor-based pagination**: Offset-based pagination (skip/take) — degrades with scale
- **Bulk queries**: Efficiently fetches likes/saves/reposts in bulk (one query each) instead of per-post sub-queries
- **Serialized transactions**: Write queue prevents concurrent write conflicts
- **Database indexes**: Has indexes on createdAt, vibeTag, authorId

---

# CRITICAL ANALYSIS

## What ORRA is Doing RIGHT

1. **Vibe/Mood Tag System** ⭐ UNIQUE SELLING POINT
   - No major platform has explicit mood-based content filtering
   - The Community Vibe Bar with "LIVE" indicator and animated gradient is visually striking
   - Multi-select vibes is more flexible than single-category assignment
   - This is a genuine differentiator that could become ORRA's signature feature

2. **Token Economy Integration**
   - Earning tokens for engagement (likes, comments, reposts) creates a gamified loop
   - Anti-farming tracking (TokenAction with unique constraint) prevents exploitation
   - Boosted posts via token spend is a clever monetization path
   - Aura glow avatar based on level is a unique visual reward system

3. **Reaction Orbs Animation**
   - The floating energy orbs on like are a distinctive, delightful micro-interaction
   - Echo ripple animation on repost is memorable
   - These small animations create brand identity

4. **Bulk Query Optimization**
   - Fetching likes/saves/reposts in bulk (Set-based) instead of per-post sub-queries is smart
   - O(1) lookup with Set.has() instead of array scanning

5. **Content Type Diversity**
   - Supporting text, images (up to 4), polls, and video/reels in one feed is good coverage
   - Poll integration with real-time voting is well-implemented

6. **Glass-panel Aesthetic**
   - The dark glass-morphism design language is visually cohesive and modern
   - Distinctive compared to the white/blue of most platforms

---

## What ORRA is MISSING or Could Improve

### 🔴 CRITICAL / HIGH PRIORITY

#### 1. Algorithmic Feed Ranking (HIGH)
**Current**: Pure chronological — every user sees the same order
**Problem**: Boring feed, low engagement. Users see irrelevant content mixed with relevant.
**Recommendation**: Implement a hybrid scoring system:
- **Engagement score**: likes * 3 + comments * 5 + shares * 4 + saves * 2
- **Recency decay**: Score *= (1 / (1 + hours_since_post * 0.1))
- **Following boost**: Posts from followed users get 2x multiplier
- **Vibe match**: Posts matching user's active vibe preference get 1.5x multiplier
- Start simple, add ML later

#### 2. Pull-to-Refresh & New Content Indicator (HIGH)
**Current**: 5-second auto-polling with no visual feedback
**Problem**: 
- 5-second polling is EXTREMELY wasteful — makes a full API call every 5s even when nothing changed
- No "new posts" indicator means users don't know content is fresh
- No pull-to-refresh gesture — users expect to pull down to refresh on mobile
**Recommendation**:
- Replace 5s polling with: initial load + refetch on window focus + manual pull-to-refresh
- Add "X new posts" banner at top when new content is detected
- Add pull-to-refresh gesture with ORRA-branded animation
- Use WebSocket or Server-Sent Events for real-time new-post notifications instead of polling

#### 3. Infinite Scroll / Load More (HIGH)
**Current**: Only loads first 20 posts with no way to see more
**Problem**: Users hit a hard wall after 20 posts — can't browse older content
**Recommendation**:
- Implement intersection-observer-based infinite scroll
- Load next batch when user is 3-4 posts from bottom
- Add cursor-based pagination (use last post's createdAt as cursor — more reliable than offset)
- Show skeleton cards while loading

#### 4. "Following" Feed Tab (HIGH)
**Current**: No way to see only posts from people you follow
**Problem**: As user base grows, global chronological feed becomes noise
**Recommendation**:
- Add "Following" tab alongside current feed (rename current to "For You" or "Trending")
- Following tab: chronological posts from followed users only
- Requires API support: filter posts by `authorId IN (followed user IDs)`

#### 5. Image Loading Optimization (HIGH)
**Current**: Images load all at once, no placeholders, broken image fallback only
**Problem**: Slow perceived performance, images pop in jarringly
**Recommendation**:
- Add blurhash/blur-up placeholder for images (generate on upload)
- Implement Intersection Observer lazy loading for images below fold
- Add progressive JPEG loading
- Consider CDN for image delivery (Cloudflare, etc.)

### 🟡 MEDIUM PRIORITY

#### 6. Text Truncation with "Read More" (MEDIUM)
**Current**: Full post text always displayed — no truncation
**Problem**: Long posts dominate the feed, pushing other content down
**Recommendation**:
- Truncate after 3-4 lines (~280 chars), show "Read more" button
- Expand inline without navigation
- This is standard on every major platform for good reason

#### 7. Boosted Posts → Server-Side Persistence (MEDIUM)
**Current**: Boosted posts tracked in Zustand/localStorage only — NOT in database
**Problem**: Boosted status is per-device, not shared across sessions or visible to other users
**Recommendation**:
- Add `isBoosted` and `boostedAt` fields to Post model in Prisma
- Persist boost action via `/api/orra/spend` with `action: 'boost_post'`
- Other users should see "BOOSTED" badge on boosted posts

#### 8. Explore Page: Replace Static Data with API-Driven Content (MEDIUM)
**Current**: Explore uses hardcoded `exploreItems` from data.ts
**Problem**: Stale, never-changing content — not discoverable
**Recommendation**:
- "Trending" = posts with highest engagement in last 24h
- "For You" = algorithmically recommended based on user's vibe preferences
- "New" = recent posts with low engagement (give them a chance)

#### 9. Content Type Filters (MEDIUM)
**Current**: No way to filter by content type (text-only, images-only, polls-only)
**Problem**: Users who prefer visual content can't filter out text posts and vice versa
**Recommendation**:
- Add filter chips: "All", "Photos", "Text", "Polls", "Reels"
- Pass type filter to API as query parameter

#### 10. "New Posts" Toast/Notification (MEDIUM)
**Current**: Posts silently appear due to 5s polling — no awareness of new content
**Problem**: Users don't realize the feed is live/updating
**Recommendation**:
- Track last-seen timestamp
- When new posts appear, show "3 new posts" banner with tap-to-scroll-to-top
- Remove the 5s polling — only show banner when there's actually new content

### 🟢 LOW PRIORITY

#### 11. Skeleton Loading Screens (LOW)
**Current**: Single spinner for entire feed
**Recommendation**: Show 3-5 skeleton cards matching post card layout while loading

#### 12. Haptic Feedback on Interactions (LOW)
**Current**: None
**Recommendation**: Subtle haptic on like, echo, and pull-to-refresh (mobile)

#### 13. Video Autoplay (LOW)
**Current**: Videos require manual play
**Recommendation**: Autoplay muted when video enters viewport (like Instagram/TikTok)

#### 14. Swipe Gestures for Reels (LOW)
**Current**: Grid-based reel browsing
**Recommendation**: Full-screen vertical swipe for Reels (like TikTok/Instagram Reels)

#### 15. Engagement Velocity Display (LOW)
**Current**: Static like/comment counts
**Recommendation**: Show "Trending" badge on posts with high engagement velocity (e.g., 50+ likes/hour)

---

## Priority-Ordered Action Items

| # | Action | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| 1 | Replace 5s polling with smart refresh (pull-to-refresh + focus + SSE) | HIGH | Medium | Critical — reduces server load 95%+ |
| 2 | Add infinite scroll with cursor-based pagination | HIGH | Medium | Critical — users can't browse past 20 posts |
| 3 | Implement basic algorithmic feed ranking | HIGH | High | High — engagement will increase significantly |
| 4 | Add "Following" feed tab | HIGH | Medium | High — essential for content relevance |
| 5 | Add image lazy loading + blurhash placeholders | HIGH | Low | High — perceived performance |
| 6 | Add "X new posts" banner indicator | HIGH | Low | Medium — freshness awareness |
| 7 | Persist boosted posts to database | MEDIUM | Low | Medium — currently broken for other users |
| 8 | Add text truncation with "Read more" | MEDIUM | Low | Medium — feed density improvement |
| 9 | Replace static Explore data with API-driven trending | MEDIUM | Medium | Medium — real discovery |
| 10 | Add content type filter chips | MEDIUM | Low | Low-Medium — content preference |
| 11 | Add skeleton loading cards | LOW | Low | Low — polish |
| 12 | Video autoplay (muted) | LOW | Low | Low — engagement |
| 13 | Haptic feedback | LOW | Low | Low — polish |

---

## Bugs & UX Issues Found

1. **Boosted posts are client-only**: `boostedPosts: Set<string>` in Zustand store — other users NEVER see the "BOOSTED" badge on your boosted posts. This completely defeats the purpose of boosting.

2. **5-second polling is catastrophic for scale**: With 100 concurrent users, that's 20 requests/second just for feed polling. At 1000 users, it's 200 req/s. This will crash the server.

3. **Multi-vibe filtering is broken for API**: Only the first selected vibe is sent to the API (`primaryVibe`). If user selects "Hyped" + "Laughing", they only get "Hyped" posts from the API, then client-side filters for "Laughing" — meaning they miss posts tagged "Laughing" that aren't also tagged "Hyped".

4. **Vibe tag on post avatar is wrong**: `AuraGlowAvatar` uses `activeVibes.size > 0 ? Array.from(activeVibes)[0] : undefined` for the vibeTag on EVERY post's avatar — this means ALL post avatars glow the same color as the user's currently selected vibe filter, not the post author's level or the post's own vibe tag.

5. **No pagination UI**: The API supports `page` and `limit` parameters, but the frontend never uses them — it always fetches page 1 with limit 20.

6. **`staleTime: 0` + `refetchOnMount: 'always'`**: Combined with 5s polling, this means the feed is refetched on EVERY component mount AND every 5 seconds. If user switches tabs back and forth, they get triple-fetching.

7. **`timeAgo` shows "Just now" for sub-minute posts but says "ago" after**: The time display is `2h` without "ago" but `Just now` — inconsistent (some places say "2h ago" in the UI, some just "2h").

8. **Delete post is fire-and-forget**: `fetch('/api/posts/${post.id}', { method: 'DELETE' }).catch(() => {})` — errors are silently swallowed. User might think post is deleted but it's still on the server.

9. **No optimistic updates for post creation**: When a user creates a post, they must wait for the API response before it appears. Major platforms show the post immediately (optimistic) then sync.

10. **Dance Off promo card has hardcoded date**: `new Date('2026-07-27T00:00:00')` — after July 27, 2026, this will show "Ended" permanently. Should be managed from the database or admin panel.

---

## Competitive Differentiation Summary

| Feature | Instagram | TikTok | Twitter/X | Threads | Facebook | ORRA |
|---------|-----------|--------|-----------|---------|----------|------|
| Algorithmic feed | ✅ Advanced | ✅ Best-in-class | ✅ Hybrid | ✅ Emerging | ✅ Mature | ❌ Chrono-only |
| Chronological option | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (default) |
| Mood/Vibe filtering | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** |
| Token economy | ❌ | ❌ (coins) | ❌ | ❌ | ❌ | ✅ **UNIQUE** |
| Level/gamification | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** |
| Infinite scroll | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pull-to-refresh | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| New posts indicator | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Skeleton loading | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Image lazy loading | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Following tab | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Content type filter | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Text truncation | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Boosted/paid content | ✅ Mature | ✅ Mature | ✅ Mature | ✅ New | ✅ Mature | ⚠️ Client-only |

**Bottom line**: ORRA has 3 genuinely unique features (Vibe filtering, Token economy, Level/gamification) but is missing every standard feed UX pattern that users expect from a modern social app.
