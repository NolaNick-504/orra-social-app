# Notifications & Search Feature Research
## Competitive Analysis: Instagram, Twitter/X, Reddit, Pinterest, LinkedIn vs ORRA

**Date:** 2025-03-04  
**Author:** Senior Mobile App Researcher  
**Scope:** Notification systems, Search & Explore features across 5 major social platforms  

---

# PART 1: PLATFORM-BY-PLATFORM ANALYSIS

---

## 1. INSTAGRAM

### NOTIFICATIONS

#### 1.1 Notification Types
- **Core Social:** Likes (post & comment), Follows, Comments, Comment mentions, @mentions in captions/bio, Tagged in photos, Tagged in Reels
- **Content:** Reel likes, Reel comments, Story mentions, Story reactions (with emoji)
- **Messaging:** DM requests, DM messages, Group chat activity
- **Growth:** Follow requests (private accounts), Follower milestones ("You reached 1K followers!")
- **System/Recommendation:** Suggested posts, "X and N others" liked your post, Birthday reminders, Live video notifications, Product/restock alerts (shopping)
- **Creator/Professional:** Insights milestones, Brand collaboration requests, Comment hidden by keyword filter, Community chat activity

#### 1.2 Notification Center UX
- **Two tabs:** "Following" (notifications from people you follow) and "You" (all notifications about you)
- **Following tab** shows a curated chronological feed of activity from followed accounts (liked posts, new posts, new Reels)
- **You tab** is strictly chronological with newest first — no grouping by type
- **Read/unread:** New notifications have a subtle blue dot indicator on the left. No explicit "NEW" text badge
- **Visual layout:** Avatar on left, action text in middle, content thumbnail on right. Type icon overlaid on avatar (heart for likes, speech bubble for comments)

#### 1.3 Notification Badges
- **Tab badge:** Heart icon in bottom nav shows red badge with unread count (max 99+, then "99+")
- **App icon badge:** iOS/Android push notification count synced with in-app unread
- **No badge on individual notification items** — just the blue dot for unread
- **Badge auto-clears** when you open the notification tab (not individual items)

#### 1.4 Notification Actions
- **Follow back:** Yes — follow button appears inline on follow notifications
- **Like back:** No direct inline like, but tapping the notification navigates to the post
- **Reply to comment:** Tapping comment notifications opens the post scrolled to that comment with reply field ready
- **Accept/Decline:** Follow requests show Accept/Decline buttons inline
- **Message reply:** DM notifications open the conversation
- **Story reaction:** Opens the story with reaction overlay, can react back

#### 1.5 Notification Filtering
- **Two-tab system** is the primary filter: "Following" vs "You"
- **No granular type filters** within the notification center (can't filter to just "likes" or just "comments")
- **Settings-level control** for push only, not in-app display

#### 1.6 Push vs In-App
- **Push notifications:** Fully customizable per type (likes, comments, follows, DMs, live videos, etc.) in Settings > Notifications
- **In-app notifications:** Always show everything regardless of push settings — push and in-app are independent
- **Quiet mode:** Pauses all push notifications during set hours, auto-replies to DMs
- **Pause all:** Option to pause all push notifications for a set duration (up to 8 hours)

#### 1.7 Notification Settings
- **Extremely granular:** Separate toggles for each type (likes, comments, comment likes, followers, following, DMs, group chats, live videos, reels, reminders, product announcements, etc.)
- **Per-account settings** for professional/creator accounts
- **Quiet Mode** with scheduled hours
- **Email notification settings** separately configurable
- **SMS notification settings** for security

#### 1.8 Mark as Read
- **Auto on view:** All notifications are marked as seen when you open the notification tab — no individual mark-as-read
- **No "Mark all read" button** — it's automatic
- **No undo** — once you view the tab, the badge clears

#### 1.9 Notification Grouping
- **Aggregated:** "X and 5 others liked your post" — shows the first person's avatar + text
- **"X and 3 others started following you"** — grouped follows
- **"X and 2 others commented on your post"** — grouped comments (but tapping shows all individual comments)
- **Max 3 avatars shown** in a stacked group with count overlay
- **Grouped by target:** All actions on the same post are grouped together, not by action type

#### 1.10 Notification Threading
- **No explicit threading** — each notification is its own row
- **Tapping grouped notifications** expands to show all individual actors
- **Comment reply chains** show as individual notifications, not threaded
- **Story reactions** are grouped per story

### SEARCH & EXPLORE

#### 2.1 Search UI
- **Search bar** at top of Explore page, persistent on home feed (magnifying glass icon)
- **Autocomplete:** Real-time suggestions as you type (users, hashtags, places)
- **Recent searches:** Show below search bar, clearable individually or all at once
- **Suggested accounts:** Based on connections and interests, shown below recent searches
- **No trending topics** in search suggestions (trending is on Explore page)

#### 2.2 Search Scope
- **Users/Accounts:** By name, handle, verified status
- **Hashtags:** With post count displayed
- **Places/locations:** With photo count
- **Audio/Sounds:** For Reels discovery
- **Tags:** Tagged locations and topics
- **No search for individual posts by text content** (only hashtags/places/users)

#### 2.3 Search Results
- **Tabs:** Top, Accounts, Audio, Tags, Places
- **"Top" tab:** Algorithmic mix of all types ranked by relevance and popularity
- **Accounts tab:** Grid of user cards with follow button
- **Tags tab:** Hashtag cards with post count
- **Places tab:** Location cards with photo preview

#### 2.4 Explore Page
- **Masonry grid** of photos/videos — Instagram pioneered this layout
- **Category pills** at top: For You, Art, Food, Travel, Style, Music, etc. (personalized)
- **Algorithmic "For You"** based on engagement patterns, followed accounts, time of day
- **Reels row** prominently featured
- **Shopping section** with product tags
- **Story ring** at the top for discoverable stories
- **Infinite scroll** with lazy loading

#### 2.5 Content Discovery
- **Heavily algorithm-driven** — ML models rank content by predicted engagement
- **Interest graph:** Based on accounts you follow, posts you like, save, comment on
- **Session-based:** Different content at different times of day
- **Fresh content bias:** Newer posts weighted higher
- **Diversity:** Ensures mix of content types (photos, Reels, carousels)

#### 2.6 Hashtag System
- **Followable hashtags:** Users can follow hashtags like accounts
- **Clickable hashtags** in captions and comments
- **Hashtag pages** show top posts and recent posts
- **Trending hashtags** shown on Explore
- **Related hashtags** suggested on hashtag pages
- **Hashtag analytics** for business/creator accounts

#### 2.7 People Discovery
- **Suggested users** in Explore and Feed
- **Based on:** Mutual connections, similar interests, contacts sync, Facebook friends
- **Verified badges** prominently shown
- **"Suggested for you"** section between feed posts
- **Follow chain:** "Followed by X, Y, and 3 others you follow"

#### 2.8 Search Filters
- **Minimal in-app filters** — no date range, no location filter, no content type filter in main search
- **Advanced filters** only in Professional Dashboard for insights
- **No Boolean search** or search operators

#### 2.9 Voice Search
- **Not supported** (as of 2025)

#### 2.10 Visual Search
- **Not natively in search** — no reverse image search
- **Google Lens integration:** On Android, can trigger Google Lens from Instagram images
- **No Pinterest-style camera search**

---

## 2. TWITTER/X

### NOTIFICATIONS

#### 1.1 Notification Types
- **Core Social:** Likes, Retweets/Reposts, Follows, Mentions (@username), Replies, Quote tweets
- **Content:** Bookmarks on your posts (if enabled), Community invites, Space invitations
- **Advanced:** Verified-related (blue check notifications), "New follower" with follower count milestone
- **System:** Security alerts, policy violations, feature announcements, Twitter Blue upsell, Trending topic alerts, "X has something to tell you"
- **Spaces:** Scheduled Space reminders, Space started notifications
- **Communities:** Community posts, invites, moderator actions
- **Grok:** AI-generated notifications, trend digests

#### 1.2 Notification Center UX
- **Three filter tabs:** "All", "Verified" (blue checkmark users only), "Mentions" (@username)
- **Chronological** within each tab, newest first
- **Verified tab** is X Premium feature — filters out non-verified noise
- **Visual layout:** Avatar left, action text center, inline preview right (tweet text or image preview)
- **Three-dot menu** on each notification for quick actions

#### 1.3 Notification Badges
- **Tab badge:** Bell icon in bottom nav with red/orange unread count
- **App icon badge:** Synced with notification tab
- **Golden badge** for Premium subscribers' notifications
- **Animated notification bell** when new notifications arrive

#### 1.4 Notification Actions
- **Follow back:** Yes, inline follow button on follow notifications
- **Like back:** Quick like heart icon on like/retweet notifications
- **Retweet back:** Quick retweet button on retweet notifications
- **Reply:** Inline reply box on mention/reply notifications
- **Mute/Block:** Accessible via three-dot menu on notification
- **Quote tweet:** Quick action on retweet notifications

#### 1.5 Notification Filtering
- **Three-tab system:** All, Verified, Mentions
- **Filters icon** with granular options: Show/hide specific types (likes, retweets, replies, mentions, new followers, etc.)
- **Quality filter:** AI-powered to hide low-quality notifications (toggles on/off)
- **Muted words** apply to notifications too
- **Priority notifications** for Premium users

#### 1.6 Push vs In-App
- **Push notifications:** Per-type toggles (likes, retweets, replies, mentions, follows, spaces, etc.)
- **In-app notifications:** Show everything by default, filterable
- **Push is customizable** independently from in-app display
- **Schedule:** Can set "Do not disturb" hours
- **Digest mode:** Option for periodic notification summaries instead of individual pushes

#### 1.7 Notification Settings
- **Very granular:** Individual toggles for each notification type for push, SMS, email
- **Quality filter toggle** (AI-powered spam/low-quality filter)
- **Muted words** for notification filtering
- **Conversation controls:** Limit who can reply (affects who triggers notifications)
- **Per-conversation mute:** Mute specific tweet threads

#### 1.8 Mark as Read
- **Auto on view:** Opening the notification tab marks everything as seen
- **No "Mark all read" button** — badge clears on view
- **Individual mark:** Can dismiss individual notifications via swipe or three-dot menu
- **No "unread" state persistence** — once seen, it's read

#### 1.9 Notification Grouping
- **"X and N others liked your post"** — grouped by action type on same post
- **"X and N others retweeted your post"**
- **"X and N others mentioned you"**
- **Avatar stack** showing up to 3 user avatars
- **Time-bound grouping:** Only groups recent actions (within ~24 hours)
- **Follow grouping:** "X, Y, and 5 others followed you" — grouped by time window

#### 1.10 Notification Threading
- **Reply threading:** Reply notifications show context — the original tweet + the reply
- **Conversation thread:** Tapping takes you into the full thread
- **Quote tweet:** Shows quoted tweet inline in the notification
- **No inline expansion** — must tap to see full conversation

### SEARCH & EXPLORE

#### 2.1 Search UI
- **Persistent search bar** at top of all tabs
- **Autocomplete:** Real-time suggestions with trending, recent, and saved searches
- **Recent searches:** Clearable list
- **Saved searches:** Users can save search queries
- **Trending section:** Below search bar with topic tags and tweet counts

#### 2.2 Search Scope
- **Users:** By name, handle, bio text
- **Tweets/Posts:** Full-text search of tweet content
- **Hashtags:** With tweet count
- **Media:** Filter for photos, videos
- **Spaces:** Live and recorded audio spaces
- **Communities:** Community names and descriptions
- **Lists:** Public lists by name

#### 2.3 Search Results
- **Tabs:** Top, Latest, People, Media, Lists (context-sensitive)
- **Top tab:** Algorithmic ranking by engagement, recency, relevance
- **Latest tab:** Strict reverse-chronological
- **People tab:** User cards with follow button
- **Media tab:** Grid of photos/videos from matching tweets
- **Lists tab:** Public lists matching the query

#### 2.4 Explore Page
- **Trending topics** with categories (For You, Trending, News, Sports, Entertainment)
- **Trending sidebar** on desktop
- **"For You"** section: Personalized based on interests and follows
- **Moment cards:** Curated topic collections
- **Live video/Spaces** section
- **Category pills** for topic browsing

#### 2.5 Content Discovery
- **Hybrid algorithm:** Combines following-graph with interest-graph
- **"For You" timeline:** ML-ranked content from outside your follows
- **Trending algorithm:** Geo-based + interest-based trending detection
- **Topic following:** Users can follow specific topics (AI, Gaming, etc.)
- **Engagement signals:** Likes, retweets, replies, time spent all factor in

#### 2.6 Hashtag System
- **Clickable hashtags** in tweets
- **Hashtag pages** show top and latest tweets
- **Trending hashtags** with context descriptions
- **Hashtag analytics** for advertisers
- **No "follow hashtag"** feature (unlike Instagram)

#### 2.7 People Discovery
- **"Who to follow"** sidebar suggestions
- **Based on:** Follow graph (followed by people you follow), similar interests, trending accounts
- **Verified badges** prominently shown
- **Follower/following counts** visible
- **"Followed by X and Y"** social proof

#### 2.8 Search Filters
- **Advanced search** with operators:
  - Date range (since/until)
  - From specific user (from:)
  - To specific user (to:)
  - Mentioning user (@)
  - Hashtag (#)
  - Minimum replies/likes/retweets (min_faves:, min_retweets:)
  - Keyword inclusion/exclusion (+/- operators)
  - Language filter
  - Geolocation (near:, geocode:)
- **Most powerful search filters** of any social platform

#### 2.9 Voice Search
- **Not natively supported** (as of 2025)
- **X/Twitter relies on text-based search**

#### 2.10 Visual Search
- **Not supported** — no reverse image search or visual discovery in search
- **Media tab** filters for image/video results but doesn't do visual matching

---

## 3. REDDIT

### NOTIFICATIONS

#### 1.1 Notification Types
- **Core Social:** Upvotes (on posts and comments), Replies, Mentions (u/username), Follows
- **Content:** Post saved, Post shared, Crosspost notifications, Award received, New posts in followed subreddits
- **Moderation:** Mod queue items, User reports, Mod mail, AutoMod actions, Subreddit settings changes
- **System:** Trending posts, Recommended communities, Cake day (birthday), Reddit Premium reminders, Safety/report updates, Chat messages/requests
- **Community:** Subreddit you moderate trending, Subreddit milestone notifications
- **Chat:** Chat messages, Chat requests, Group chat invites

#### 1.2 Notification Center UX
- **Two sections:** "Notifications" tab (bell icon) and "Messages" tab (envelope icon)
- **Notifications tab:** Chronological list with newest first
- **Messages tab:** PM-style inbox with conversation threads
- **Visual layout:** Subreddit icon or user avatar left, action text center, content preview right
- **Swipe actions** on mobile for quick dismiss

#### 1.3 Notification Badges
- **Bell icon badge:** Red dot or count for notification tab
- **Message icon badge:** Red count for unread messages
- **App icon badge:** Combined count (notifications + messages)
- **Orange-red color scheme** for badges (Reddit brand color)

#### 1.4 Notification Actions
- **Reply inline:** Yes, on reply notifications — opens comment reply field
- **Upvote back:** No direct upvote on notification
- **Follow back:** No inline follow (must visit profile)
- **Save notification:** Can save for later
- **Share:** Can share the linked content
- **Mute subreddit:** Can mute a subreddit from sending notifications

#### 1.5 Notification Filtering
- **Tab separation:** Notifications vs Messages is the primary filter
- **No granular type filters** within the notification tab
- **Settings-level filtering:** Can disable specific notification types in settings
- **Per-subreddit mute:** Can mute specific subreddit notifications

#### 1.6 Push vs In-App
- **Push notifications:** Per-category toggles (trending, recommendations, chat, etc.)
- **In-app notifications:** Show everything not explicitly disabled
- **Email digest:** Daily/weekly digest option
- **Push and in-app** can be configured independently

#### 1.7 Notification Settings
- **Category-level:** Toggle entire categories (chat, trending, recommendations, new followers, cake day, etc.)
- **Per-subreddit:** Follow/mute individual subreddit notifications
- **Quiet hours** not available
- **Email notifications** separately configurable
- **Moderator notifications** have separate settings panel

#### 1.8 Mark as Read
- **Manual tap:** Tap to mark as read (navigates to content)
- **"Mark all read"** button available at top of notification list
- **Swipe to dismiss** marks as read on mobile
- **Auto-expire:** Old notifications (7+ days) auto-clear

#### 1.9 Notification Grouping
- **"X and N others upvoted your post"** — grouped upvotes
- **"X and N others replied to your comment"** — grouped replies
- **Subreddit grouping:** New posts from same subreddit grouped
- **Award grouping:** "X gave you 3 awards"
- **Less aggressive grouping** than Instagram/Twitter

#### 1.10 Notification Threading
- **Reply threading in Messages tab:** Conversations are threaded like email
- **Reply notifications** show parent comment context
- **No inline expansion** — must tap to see full thread
- **Mod mail** has full conversation threading

### SEARCH & EXPLORE

#### 2.1 Search UI
- **Search bar** at top of all pages
- **Autocomplete:** Subreddit suggestions, username suggestions
- **Recent searches:** Stored and clearable
- **Trending searches** shown below search bar
- **Community suggestions** while typing

#### 2.2 Search Scope
- **Posts:** Full-text search of post titles and body text
- **Comments:** Search within comments (separate toggle)
- **Communities/Subreddits:** By name and description
- **Users:** By username
- **Images/Links:** Filter by content type

#### 2.3 Search Results
- **Tabs:** Posts, Comments, Communities, People
- **Sort options:** Relevance, Hot, Top, New, Comments
- **Time filter:** Hour, Day, Week, Month, Year, All Time
- **Community filter:** Search within specific subreddit
- **Mixed results** on the main "Posts" tab

#### 2.4 Explore Page
- **Home feed** doubles as explore — algorithmic "Best" and "Hot" feeds
- **Popular feed:** Aggregated trending across all of Reddit
- **Topic categories** for browsing (Gaming, Sports, Aww, etc.)
- **Trending communities** section
- **r/trendingreddits** and discovery sidebar

#### 2.5 Content Discovery
- **Subreddit-based:** Discovery is primarily about finding communities, not individual posts
- **"Popular" feed:** Cross-Reddit trending
- **"Best" algorithm:** Personalized based on karma patterns and subscriptions
- **Community recommendations:** Based on similar subscriptions
- **r/all:** Everything on Reddit sorted by popularity

#### 2.6 Hashtag System
- **No traditional hashtag system** — Reddit uses subreddit subscriptions instead
- **Flair system:** Post flairs serve as category tags within subreddits
- **Searchable flairs:** Can search by flair within a subreddit
- **No followable hashtags**

#### 2.7 People Discovery
- **Limited:** Reddit is community-centric, not people-centric
- **User profiles** exist but are secondary
- **"Who to follow"** suggestions based on subreddit overlap
- **Follow feature** exists but is underused
- **No "mutual connections"** display

#### 2.8 Search Filters
- **Subreddit filter:** Search within a specific subreddit
- **Time range:** Hour/Day/Week/Month/Year/All
- **Sort:** Relevance/Hot/Top/New/Comments
- **Content type:** Posts/Comments/Communities/Users
- **NSFW toggle:** Include/exclude NSFW content
- **No location filter** (Reddit is not geo-focused)

#### 2.9 Voice Search
- **Not supported** (as of 2025)

#### 2.10 Visual Search
- **Not supported** — no reverse image search
- **Image tab** in search results filters for posts with images but doesn't match visually

---

## 4. PINTEREST

### NOTIFICATIONS

#### 1.1 Notification Types
- **Core Social:** Pin saves (repins), Comments, Comment mentions, Follows
- **Content:** Idea pins reactions, Pin saved to board, Pin tried ("I tried this")
- **Recommendation:** Board suggestions, Pin ideas based on interests, Trending topics, Seasonal content
- **Shopping:** Price drops on saved pins, Product restocks, Shopping deal alerts
- **Creator:** Idea pin views milestones, Board invite accepted, Group board activity
- **System:** Account alerts, Security, Policy, Pinterest Academy

#### 1.2 Notification Center UX
- **Single list view** — all notifications chronologically
- **No tabs or filters** in the notification center
- **Visual layout:** Pin thumbnail on left, action text center, user avatar right
- **Board context** shown (which board a pin was saved to)
- **Less social, more content-focused** than other platforms

#### 1.3 Notification Badges
- **Bell icon badge:** Red dot indicator for new notifications
- **App icon badge:** Count of unread notifications
- **No numeric badge** in the tab — just a dot
- **Badge clears on view**

#### 1.4 Notification Actions
- **Save pin:** Inline save button on "Pin saved" notifications
- **Follow back:** Follow button on follow notifications
- **Reply to comment:** Inline reply on comment notifications
- **Try pin:** "I tried this" button on relevant pin notifications
- **View board:** Tap to view the board a pin was saved to

#### 1.5 Notification Filtering
- **No in-app filtering** — single chronological list
- **Settings-level only:** Can toggle specific categories for push
- **No "mentions only" or "follows only" view**

#### 1.6 Push vs In-App
- **Push notifications:** Per-category toggles in settings
- **In-app notifications:** All types shown by default
- **Email notifications:** Separate settings for email digests
- **Push categories:** Pin ideas, recommendations, price drops, comments, follows, etc.

#### 1.7 Notification Settings
- **Category toggles:** Ideas/recommendations, Your pins & boards, People & conversations, Shopping
- **Less granular** than Instagram/Twitter — groups related types
- **Email frequency:** Individual, daily, or weekly digest
- **No quiet mode** or DND scheduling

#### 1.8 Mark as Read
- **Auto on view:** Opening the notification tab marks all as read
- **No "Mark all read" button** — automatic clearing
- **No individual mark** — tap to view, which auto-marks

#### 1.9 Notification Grouping
- **"X and N others saved your pin"** — grouped saves
- **"X saved 3 of your pins"** — grouped saves by same user
- **Board-level grouping:** "X saved pins to [Board Name]"
- **Less aggressive grouping** overall due to lower notification volume

#### 1.10 Notification Threading
- **No threading** — each notification is independent
- **Comment conversations** not threaded in notifications
- **Board activity** grouped per board

### SEARCH & EXPLORE

#### 2.1 Search UI
- **Prominent search bar** — Pinterest's primary interaction is search
- **Autocomplete:** Real-time suggestions with visual pin previews
- **Recent searches:** Clearable list
- **Trending searches** with visual cards
- **Guided search:** Suggested refinements after initial search (e.g., search "living room" → suggest "modern", "cozy", "small")

#### 2.2 Search Scope
- **Pins:** By title, description, alt text
- **Boards:** By name and description
- **Users:** By name
- **Products:** Shopping search with price filters
- **Visual search:** Pinterest Lens (camera search)
- **Idea pins:** Short video content

#### 2.3 Search Results
- **Masonry grid** of pins — visual-first results
- **Filter pills** below search bar for refinement
- **Shopping tab** with product-specific results
- **Boards tab** showing matching boards
- **People tab** showing matching users
- **No text-heavy results** — everything is visual

#### 2.4 Explore Page
- **Category-based:** Broad categories (Home, Food, Style, Travel, etc.)
- **Trending section** with trending pins
- **"Picked for you"** algorithmic recommendations
- **Idea pin carousel** for video content
- **Seasonal content** prominently featured
- **Shopping spotlights**

#### 2.5 Content Discovery
- **Visual-first algorithm:** Recommendations based on pin aesthetics and content
- **Interest graph:** Based on boards, saves, clicks, and time spent viewing
- **Related pins:** "More like this" on every pin
- **Board-based:** Recommendations based on what you save and to which boards
- **Taste graph:** Pinterest's ML model connecting visual similarity

#### 2.6 Hashtag System
- **Hashtags exist** but are secondary to the search/visual system
- **Not followable** — no hashtag pages
- **Used primarily for discoverability** in pin descriptions
- **No trending hashtags** feature
- **Search-driven** discovery dominates over hashtag-driven

#### 2.7 People Discovery
- **"People to follow"** suggestions based on board overlap
- **Creator spotlights** for idea pin creators
- **Group board members** as discovery vector
- **Less emphasis on people** — Pinterest is content/board-centric
- **No "mutual connections"** display

#### 2.8 Search Filters
- **Board filter:** Search within your own boards
- **Product type:** Shop/All pins toggle
- **Color filter:** Filter pins by dominant color
- **Price range:** For shopping results
- **Sort:** Newest/Best match
- **Most visual filters** of any platform (color, style)

#### 2.9 Voice Search
- **Not supported** natively (as of 2025)

#### 2.10 Visual Search
- **Pinterest Lens:** Camera-based visual search — the industry leader
  - Point camera at any object → find similar pins
  - Works with photos, real-world objects, fashion, home decor, food
  - Auto-categorizes what it sees
- **Visual search on pins:** Tap a pin → "Search visually" → find similar-looking pins
- **Shop the look:** Tap on items in a pin to find similar products
- **Most advanced visual search** of any social platform
- **Crop and search:** Select a region of a pin to search visually within that region

---

## 5. LINKEDIN

### NOTIFICATIONS

#### 1.1 Notification Types
- **Core Social:** Post likes, Comments, Reposts, Follows, Mentions, Name pronunciations viewed
- **Professional:** Profile views, Job application updates, Connection requests, Connection milestones
- **Content:** Newsletter subscriptions, Article reactions, Document views, Event invites
- **Network:** Work anniversaries, Job changes, Birthdays, New positions
- **Recruiting:** Job recommendations, Application status, Interview invitations, Salary insights
- **Learning:** LinkedIn Learning course suggestions, Course completions
- **System:** Security alerts, Premium upsell, Feature announcements, Policy updates
- **Groups:** Group posts, Group mentions, Group invitations

#### 1.2 Notification Center UX
- **Two tabs:** "All" and "My posts" (activity on your own content)
- **Chronological** within each tab
- **"My posts" tab** filters to only show engagement on your content (likes, comments, reposts)
- **Visual layout:** User avatar left, action text center, content thumbnail right
- **Notification cards** with rich preview (article headline, post excerpt)
- **Categorized headers** ("Earlier today", "This week", "Earlier")

#### 1.3 Notification Badges
- **Tab badge:** Red numeric badge on the bell icon
- **App icon badge:** Synced with notification center
- **Desktop menu bar badge** on web
- **Badge doesn't auto-clear** — must visit notification center

#### 1.4 Notification Actions
- **Connect/Follow:** Accept connection request or follow back inline
- **Reply to comment:** Inline reply on comment notifications
- **React to comment:** Quick reaction (like, celebrate, etc.) on comment notifications
- **View profile:** Quick link to profile viewer
- **Share post:** Reshare from notification
- **Job apply:** Direct apply button on job notifications

#### 1.5 Notification Filtering
- **Two-tab system:** All vs My Posts
- **Settings-level** category toggles for push notifications
- **No in-app type filters** beyond the two tabs
- **Desktop notifications** separately configurable

#### 1.6 Push vs In-App
- **Push notifications:** Per-category toggles (mentions, comments, reactions, connections, jobs, etc.)
- **In-app notifications:** Show everything unless disabled in settings
- **Email notifications:** Highly configurable with daily/weekly digest options
- **Desktop push:** Browser notification support
- **Quiet hours** not available

#### 1.7 Notification Settings
- **Very granular categories:** 
  - Notifications > Posts & Activity (likes, comments, reposts, mentions)
  - Notifications > Network (connections, follow suggestions, profile views)
  - Notifications > Jobs (recommendations, application updates, alerts)
  - Notifications > News & Learning (trending, newsletter, courses)
  - Notifications > Other (groups, events, premium)
- **Per-channel:** Push, Email, and In-app can each be configured
- **Email frequency:** Individual, daily, weekly digest
- **Group notifications** separately configurable

#### 1.8 Mark as Read
- **Semi-auto:** Notifications are marked as seen when you scroll past them
- **No explicit "Mark all read"** button
- **Badge clears** when you visit and scroll through the notification tab
- **Individual dismiss** via three-dot menu ("Delete this notification")

#### 1.9 Notification Grouping
- **"X and N others liked your post"** — grouped likes
- **"X and N others commented on your post"** — grouped comments
- **"X and N others viewed your profile"** — grouped profile views
- **Work anniversary grouping:** Multiple connections with work anniversaries grouped
- **Job change grouping:** "X, Y, and 3 others started new positions"
- **Less aggressive grouping** than Instagram

#### 1.10 Notification Threading
- **No inline threading** — each notification is a separate row
- **Comment reply context** shown in the notification text
- **Tapping takes you** to the full conversation
- **Group notifications** have threaded views

### SEARCH & EXPLORE

#### 2.1 Search UI
- **Persistent search bar** at top of all pages
- **Autocomplete:** People, companies, jobs, groups, posts, courses
- **Recent searches:** Clearable
- **Search by category icons** (People, Jobs, Companies, etc.)

#### 2.2 Search Scope
- **People:** By name, title, company, skill, location
- **Jobs:** By title, company, location, skill
- **Companies:** By name, industry, size
- **Groups:** By name, industry
- **Posts/Content:** Full-text search of posts and articles
- **Courses:** LinkedIn Learning by topic
- **Events:** By topic and location
- **Schools:** Universities and educational institutions

#### 2.3 Search Results
- **Category tabs:** People, Posts, Companies, Groups, Jobs, Events, Courses, Schools
- **"See all results"** for each category
- **People results** with connection degree (1st, 2nd, 3rd+), current role, mutual connections
- **Job results** with salary, location, posting date
- **Rich card layouts** with contextual info per type

#### 2.4 Explore Page
- **LinkedIn Feed** doubles as explore — algorithmic content suggestions
- **"My Network" page:** Connection suggestions, follow suggestions, group suggestions
- **LinkedIn News:** Curated news stories and analysis
- **Trending topics** in sidebar
- **"Discover more"** sections between feed posts
- **Learning recommendations** for courses

#### 2.5 Content Discovery
- **Professional interest graph:** Based on industry, role, connections, engagement
- **Connection-based:** Content from 1st and 2nd degree connections prioritized
- **Creator mode:** Follows topics and hashtags from creators
- **Collaborative articles:** AI-generated with expert contributions
- **Newsletter discovery:** Based on industry and topics

#### 2.6 Hashtag System
- **Followable hashtags:** Users can follow industry/topic hashtags
- **Clickable hashtags** in posts and articles
- **Hashtag pages** show posts using that hashtag
- **Recommended hashtags** when creating posts
- **Hashtag analytics** for page admins
- **Three hashtag limit** recommended per post

#### 2.7 People Discovery
- **"People you may know"** — the most robust people discovery of any platform
  - Based on: Email contacts, phone contacts, shared connections, shared companies, shared schools, shared groups
  - Connection degree display (1st, 2nd, 3rd+)
  - Mutual connections count
  - "Also viewed" profiles
- **Alumni discovery:** Find people from same school/company
- **Colleague discovery:** Current and former coworkers
- **Group member discovery:** People in same groups

#### 2.8 Search Filters
- **People filters:** Connection degree, Location, Current company, Past company, Industry, Profile language, School
- **Job filters:** Location, Experience level, Company, Job type, Date posted, Salary, On-site/remote/hybrid
- **Content filters:** Date range, Content type (posts, articles, documents), Author, Sort by
- **Company filters:** Industry, Size, Location, Type
- **Most comprehensive search filters** for professional context

#### 2.9 Voice Search
- **Not supported** natively (as of 2025)

#### 2.10 Visual Search
- **Not supported** — no visual or reverse image search
- **LinkedIn is text/professional-content driven**, not visual

---

# PART 2: COMPARATIVE FEATURE MATRIX

## NOTIFICATIONS FEATURE MATRIX

| Feature | Instagram | Twitter/X | Reddit | Pinterest | LinkedIn | **ORRA** |
|---------|-----------|-----------|--------|-----------|----------|---------|
| **Notification Types** | 15+ types | 12+ types | 10+ types | 8 types | 12+ types | 12 types |
| **Notification Tabs** | 2 (Following/You) | 3 (All/Verified/Mentions) | 2 (Notif/Messages) | 1 (All) | 2 (All/My Posts) | 3 (All/Spending/Giving) |
| **Grouped Notifications** | ✅ "X and N others" | ✅ "X and N others" | ✅ Grouped upvotes | ✅ Grouped saves | ✅ "X and N others" | ❌ No grouping |
| **Inline Actions** | ✅ Follow back, Accept | ✅ Like, RT, Reply, Follow | ⚠️ Reply only | ✅ Save, Follow, Reply | ✅ Connect, React, Reply | ⚠️ Follow back only |
| **Notification Filtering** | 2-tab | 3-tab + Quality filter | 2-tab | None | 2-tab | 3-tab (token-centric) |
| **Mark All Read** | Auto on view | Auto on view | ✅ Manual button | Auto on view | Semi-auto | ✅ Manual button |
| **Read/Unread Indicator** | Blue dot | No indicator | Badge color | No indicator | Badge | Blue dot + "NEW" |
| **Push Customization** | Per-type toggles | Per-type toggles | Category toggles | Category toggles | Per-type toggles | ❌ No push settings |
| **Quiet Mode/DND** | ✅ Scheduled | ✅ DND hours | ❌ | ❌ | ❌ | ❌ |
| **Notification Threading** | ❌ | ⚠️ Reply context | ✅ Messages threaded | ❌ | ❌ | ❌ |
| **Notification Settings** | Very granular | Very granular | Category-level | Category-level | Very granular | ❌ No settings UI |
| **Quality/Spam Filter** | ❌ | ✅ AI quality filter | ❌ | ❌ | ❌ | ❌ |

## SEARCH & EXPLORE FEATURE MATRIX

| Feature | Instagram | Twitter/X | Reddit | Pinterest | LinkedIn | **ORRA** |
|---------|-----------|-----------|--------|-----------|----------|---------|
| **Autocomplete** | ✅ Real-time | ✅ Real-time | ✅ Subreddits | ✅ Visual | ✅ Multi-type | ❌ None |
| **Recent Searches** | ✅ Clearable | ✅ Clearable + Saved | ✅ Clearable | ✅ Clearable | ✅ Clearable | ⚠️ Store only (not displayed) |
| **Search Scope** | Users, Tags, Places, Audio | Posts, Users, Hashtags, Media, Lists | Posts, Comments, Communities, Users | Pins, Boards, Users, Products, Visual | People, Jobs, Companies, Groups, Posts, Courses | Users, Posts |
| **Result Tabs** | 5 (Top, Accounts, Audio, Tags, Places) | 5 (Top, Latest, People, Media, Lists) | 4 (Posts, Comments, Communities, People) | 4 (Pins, Shopping, Boards, People) | 8 (People, Posts, Companies, Groups, Jobs, Events, Courses, Schools) | 2 (People, Posts - implicit) |
| **Advanced Search Filters** | ❌ | ✅ Most powerful | ✅ Time, Sort, Subreddit | ✅ Color, Price, Board | ✅ Per-type filters | ❌ |
| **Explore Page** | ✅ Masonry + Categories | ✅ Trending + Categories | ✅ Popular + r/all | ✅ Categories + Trending | ✅ Feed + Network | ✅ Masonry + Categories |
| **Hashtag System** | ✅ Followable, Clickable | ✅ Trending, Clickable | ❌ (Uses subreddits) | ⚠️ Basic only | ✅ Followable, Clickable | ❌ No hashtags |
| **People Discovery** | ✅ Mutual + Interests | ✅ Follow graph | ⚠️ Limited | ⚠️ Limited | ✅ Best in class | ✅ All users browse |
| **Visual Search** | ❌ | ❌ | ❌ | ✅ Pinterest Lens | ❌ | ❌ |
| **Voice Search** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Trending Topics** | ✅ In Explore | ✅ Prominent | ✅ r/popular | ✅ In categories | ✅ LinkedIn News | ⚠️ Category pill only |
| **Content Recommendations** | ✅ Heavy algorithm | ✅ Hybrid algorithm | ✅ Subreddit-based | ✅ Visual algorithm | ✅ Professional algorithm | ⚠️ Static explore items |
| **Guided Search/Refinement** | ❌ | ❌ | ⚠️ Sort/Time | ✅ Color/Style | ✅ Per-type filters | ❌ |

---

# PART 3: CRITICAL ANALYSIS — ORRA vs THE FIELD

## What ORRA is Doing RIGHT ✅

1. **Token-centric notification filtering** — The "Spending" / "Giving" filter is unique and differentiated. No other platform groups notifications by economic activity. This is a strong brand differentiator for ORRA's token economy.

2. **Rich notification type ecosystem** — 12 notification types including platform-specific ones (token, levelup, challenge, hub, shop) that no other platform has. These reinforce ORRA's gamification loop.

3. **Follow-back inline action** — Basic but essential. Instagram, Twitter, LinkedIn all do this.

4. **Post thumbnails on notifications** — Shows the content that triggered the notification. Instagram and Twitter do this well; ORRA matches them.

5. **Avatar tap → profile navigation** — Quick user context access. Good UX pattern.

6. **Manual "Mark all read" button** — Reddit does this; Instagram/Twitter don't (they auto-clear). ORRA's approach gives users more control.

7. **Unread count badge + "NEW" indicator** — Dual visual indicators (badge count + dot pulse + "NEW" text) is more prominent than most platforms.

8. **API + local notification merging** — Combines server-persisted notifications with local-only ones (shop purchases, token spends). Smart for offline-first.

9. **Masonry grid explore** — Instagram-validated pattern. Correct choice.

10. **Category pills on explore** — Instagram-like category browsing. Proven pattern.

11. **People tab with online status** — Real-time online indicator is a nice touch that Twitter and Instagram don't show in search results.

12. **Token rewards on search interactions** — Earning tokens for following from search/explore is unique to ORRA and reinforces the token economy.

---

## What ORRA is MISSING or Could Improve ❌

### HIGH PRIORITY (Critical Gaps)

1. **NO notification grouping** — Every platform groups "X and 5 others liked your post." ORRA shows every like individually, which creates notification spam. This is the single biggest missing feature.

2. **NO autocomplete in search** — Every major platform offers real-time search suggestions. ORRA's search is a blank input until you submit.

3. **NO recent searches displayed** — The store has `recentSearches` array (up to 10) but the Explore component doesn't show them. Dead code.

4. **NO notification settings UI** — Users cannot control which notification types they receive or how. No push notification configuration at all.

5. **NO push notifications** — No service worker, no Web Push API integration, no mobile push. Notifications are purely in-app (pull, not push).

6. **Static explore content** — The masonry grid uses hardcoded `exploreItems` from `data.ts`. Not API-driven. Not personalized. Not algorithmic.

7. **NO hashtag system** — No hashtag creation, following, clicking, or discovery. This is fundamental to content discovery on every other platform.

### MEDIUM PRIORITY (UX Improvements)

8. **Limited inline notification actions** — Only "Follow back" on follow notifications. No like-back, no inline reply to comments, no accept/decline on requests.

9. **NO notification tabs matching platform patterns** — ORRA has All/Spending/Giving which is unique but misses the common "Mentions" or "Following" tabs that help users find specific notification types.

10. **Search has no result tabs** — Results show as "People" and "Posts" sections in a single scroll. No tab-based filtering.

11. **NO search filters** — No date range, no content type, no sort order, no advanced search.

12. **NO trending topics** — "Trending" is a category pill but doesn't show actual trending hashtags, topics, or posts.

13. **NO content recommendation algorithm** — Explore page is static. No "For You" or personalized content based on engagement history.

14. **NO followable topics/hashtags** — Users can't follow content categories for personalized feed/experience.

15. **Manual refresh for notifications** — Instagram/Twitter auto-poll. ORRA requires a manual refresh button. The API has 30s staleTime but no auto-refetch interval like posts do.

16. **NO notification swipe actions** — Mobile notifications don't support swipe-to-dismiss, swipe-to-mark-read, or swipe actions.

17. **NO "Suggested for you" people section** — No mutual connections, interest-based, or algorithmic people suggestions on the Explore page.

### LOW PRIORITY (Nice-to-Haves)

18. **NO visual search** — Pinterest Lens is industry-leading but very expensive to build. Could be a future differentiator for a creative/dance platform.

19. **NO voice search** — No platform does this well yet. Low priority.

20. **NO notification threading** — No platform does this perfectly. ORRA's notification volume is likely low enough that this isn't critical.

21. **NO notification sound customization** — No custom sounds per notification type.

22. **NO "My Posts" activity tab** — LinkedIn's "My Posts" tab showing engagement on your own content is a useful pattern.

23. **Search doesn't search Reels or Challenges** — Only users and posts. Missing major content types.

24. **"Near You" section uses hardcoded static data** — Not actual geo-located content.

25. **NO saved searches** — Twitter allows saving search queries for re-use.

---

## Bugs & UX Issues to Fix 🐛

1. **`recentSearches` never displayed** — The store tracks `addRecentSearch()` and `clearRecentSearches()` but the Explore component never renders recent searches. The `localSearch` state is used but never persisted back via `addRecentSearch()`.

2. **`addRecentSearch` never called** — In `explore.tsx`, the search query is synced to the store (`setSearchQuery`) but `addRecentSearch` is never called. Search history is dead code.

3. **`typeIcons` map is incomplete** — Only maps 6 types (shop, token, tokens, levelup, like, follow, comment) but the `Notification` type defines 12 types (like, follow, comment, share, mention, remix, feature, token, levelup, challenge, hub, shop). Missing: share, mention, remix, feature, challenge, hub — these all fall back to the "like" icon which is confusing.

4. **Notification filter doesn't cover all types** — The "Spending" filter only catches `shop`, "Giving" catches `token`/`tokens`. Types like `share`, `mention`, `remix`, `feature`, `challenge`, `hub` are not filterable at all. The filter should either expand or use more intuitive categories.

5. **Double notification system drift** — API notifications and local `customNotifications` can drift out of sync. Marking all read locally (`markAllNotificationsRead()`) only affects local notifications. API notifications are marked via a separate API call. If either fails, they're out of sync.

6. **`getUnreadNotificationCount()` only counts local** — The store method only checks `customNotifications`, not API notifications. The Activity component correctly combines both, but the store method is misleading.

7. **No pagination for notifications** — The API supports pagination (page, limit, total) but the UI fetches only page 1 with limit 20. Users with more than 20 notifications can't see older ones.

8. **Search queries don't trigger `addRecentSearch`** — When a user searches, the query should be saved to recent searches but it's not.

9. **`useAllUsers` fetches 100 users** — Hardcoded limit of 100. Will break at scale. Should use infinite scroll or server-side pagination.

10. **No debouncing on search input** — The `useSearch(localSearch.trim())` query fires on every keystroke. Should debounce 300ms to avoid API spam.

---

# PART 4: ACTIONABLE RECOMMENDATIONS (Priority-Ranked)

## 🔴 P0 — Ship Now (Critical UX Gaps)

### R1: Implement Notification Grouping
**What:** Group similar notifications like "X and 5 others liked your post"  
**How:** 
- Add a `groupId` field to notifications (e.g., `like-post-{postId}`)
- On the backend, when creating a notification, check for existing unread notifications with the same type+target, and increment a `count` field instead of creating duplicates
- Display grouped notifications with stacked avatars (max 3) and count overlay
- Tapping expands to show all actors
**Impact:** Massive reduction in notification spam. Every competitor does this.  
**Effort:** Medium (backend schema change + frontend grouping logic)

### R2: Add Search Autocomplete + Recent Searches
**What:** Show suggestions and recent searches when the search bar is focused  
**How:**
- When search input is focused with no query, show recent searches (call `addRecentSearch` properly)
- As user types, show autocomplete suggestions from `/api/search?q=...` with debounce
- Display results as dropdown: Recent Searches, Suggested Users, Trending
- Clear individual recent searches with X button
**Impact:** Search is the #1 content discovery tool. Without autocomplete, it feels broken.  
**Effort:** Medium (new autocomplete component + debounce + dropdown UI)

### R3: Fix Missing Type Icons
**What:** Add icons for all 12 notification types  
**How:**
- `share` → Share2 icon (blue)
- `mention` → AtSign icon (cyan)
- `remix` → Repeat2 icon (fuchsia)
- `feature` → Star icon (amber)
- `challenge` → Trophy icon (orange)
- `hub` → Shield icon (emerald)
**Impact:** Quick fix, prevents confusion from wrong icons  
**Effort:** Small (just add to the `typeIcons` map)

### R4: Connect Recent Searches (Bug Fix)
**What:** Actually call `addRecentSearch()` when user searches  
**How:**
- In `explore.tsx`, when `localSearch` changes and is non-empty, call `addRecentSearch(localSearch.trim())`
- Render recent searches in a dropdown when the search bar is focused with empty input
**Impact:** Fixes dead code, enables basic search UX  
**Effort:** Small

### R5: Add Search Debouncing
**What:** Debounce search API calls by 300ms  
**How:**
- Use React Query's `enabled` flag with a debounced query value
- Or use a `useDeferredValue` / custom debounce hook
**Impact:** Prevents API spam, improves performance  
**Effort:** Small

## 🟡 P1 — Next Sprint (Important UX Improvements)

### R6: Build Notification Settings Page
**What:** Let users control which notifications they receive  
**How:**
- New settings page with per-type toggles (likes, comments, follows, mentions, tokens, challenges, etc.)
- Push notification opt-in (service worker + Web Push API)
- "Quiet hours" scheduling
- Store preferences in user DB record
**Impact:** Essential for user retention. Notification fatigue is the #1 reason users mute apps.  
**Effort:** Large (new page + backend + service worker)

### R7: Add "Mentions" Notification Tab
**What:** Add a "Mentions" tab alongside All/Spending/Giving  
**How:**
- Reconsider the tab structure: All | Mentions | Activity (token/challenge/hub/shop)
- "Mentions" filters to type === 'mention' || type === 'comment'
- "Activity" covers the token economy notifications
**Impact:** Following the Instagram/Twitter pattern of "mentions" tab is expected behavior.  
**Effort:** Small (filter logic change only)

### R8: More Inline Notification Actions
**What:** Add like-back and inline reply  
**How:**
- Like notifications: Show a heart icon that toggles like on the post
- Comment notifications: Show a quick reply input that expands on tap
- Mention notifications: Tap to navigate to the post
**Impact:** Reduces friction, increases engagement  
**Effort:** Medium

### R9: Make Explore API-Driven
**What:** Replace static `exploreItems` with API-sourced, personalized content  
**How:**
- New `/api/explore` endpoint returning posts ranked by algorithm (recency + engagement + user interests)
- Support category filtering server-side
- Infinite scroll with pagination
- Cache aggressively on the client
**Impact:** Static content feels dead. Every competitor has algorithmic explore.  
**Effort:** Large (new endpoint + recommendation engine)

### R10: Add Notification Auto-Refetch
**What:** Poll for new notifications automatically (like posts do)  
**How:**
- Add `refetchInterval: 30000` to `useNotifications()` hook (matching the staleTime)
- Or implement WebSocket/SSE for real-time notifications
- Show a "New notifications" banner when new ones arrive while viewing
**Impact:** Users shouldn't have to manually refresh. Every competitor auto-updates.  
**Effort:** Small (one config change) to Medium (WebSocket)

## 🟢 P2 — Future Sprints (Differentiators & Nice-to-Haves)

### R11: Hashtag System
**What:** Add hashtags to posts, make them clickable, followable, searchable  
**Impact:** Fundamental content discovery mechanism. Critical for content platforms.  
**Effort:** Large (schema + UI + search integration)

### R12: Search Result Tabs
**What:** Add proper tab-based search results (Users | Posts | Reels | Challenges)  
**Impact:** Better result navigation, matches user expectations  
**Effort:** Medium

### R13: Advanced Search Filters
**What:** Date range, content type, sort order filters  
**Impact:** Power user feature, enables content rediscovery  
**Effort:** Medium

### R14: "Suggested People" Section
**What:** Algorithmic people suggestions based on mutual follows and interests  
**Impact:** Improves network growth, increases engagement  
**Effort:** Medium (needs recommendation algorithm)

### R15: Visual Search (Pinterest Lens equivalent)
**What:** Camera-based or image-based search for similar content  
**Impact:** Massive differentiator for a creative/dance platform. Could be THE feature.  
**Effort:** Very Large (ML model + camera integration + similarity search)

### R16: Notification Swipe Actions (Mobile)
**What:** Swipe left to dismiss, swipe right to mark read, swipe actions  
**Impact:** Mobile-native UX pattern, improves management  
**Effort:** Medium

### R17: Search Across All Content Types
**What:** Extend search to include Reels, Challenges, Hubs, Dance entries  
**Impact:** ORRA has rich content types but search only finds users and posts  
**Effort:** Medium (extend search API + add result sections)

---

# PART 5: IMPLEMENTATION PRIORITY SUMMARY

| Rank | Recommendation | Priority | Effort | Impact |
|------|---------------|----------|--------|--------|
| 1 | Notification Grouping | P0 | Medium | 🔥 Critical |
| 2 | Search Autocomplete + Recent | P0 | Medium | 🔥 Critical |
| 3 | Fix Missing Type Icons | P0 | Small | 🟢 Quick win |
| 4 | Connect Recent Searches (bug) | P0 | Small | 🟢 Quick win |
| 5 | Search Debouncing | P0 | Small | 🟢 Quick win |
| 6 | Notification Settings | P1 | Large | 🟡 Important |
| 7 | "Mentions" Tab | P1 | Small | 🟡 Important |
| 8 | Inline Notification Actions | P1 | Medium | 🟡 Important |
| 9 | API-Driven Explore | P1 | Large | 🟡 Important |
| 10 | Notification Auto-Refetch | P1 | Small | 🟡 Important |
| 11 | Hashtag System | P2 | Large | 🟠 Differentiator |
| 12 | Search Result Tabs | P2 | Medium | 🟠 Better UX |
| 13 | Advanced Search Filters | P2 | Medium | 🟠 Power users |
| 14 | Suggested People | P2 | Medium | 🟠 Growth |
| 15 | Visual Search | P2 | Very Large | 🔵 Moonshot |
| 16 | Notification Swipe Actions | P2 | Medium | 🔵 Nice-to-have |
| 17 | Search All Content Types | P2 | Medium | 🟠 Completeness |

---

# APPENDIX: ORRA Current Implementation Summary

**Files analyzed:**
- `src/components/aura/activity.tsx` — Notification center UI
- `src/components/aura/explore.tsx` — Search & Explore UI
- `src/components/aura/sidebar.tsx` — Navigation with badge counts
- `src/store/aura-store.ts` — State management for notifications, search, recent searches
- `src/lib/api-hooks.ts` — API hooks for notifications and search
- `src/app/api/notifications/route.ts` — Notification API (GET + POST mark-read)
- `src/app/api/search/route.ts` — Search API (users + posts by text)

**Notification Architecture:**
- Dual system: API notifications (server-persisted) + local `customNotifications` (client-side only)
- Combined on render with no deduplication
- No notification grouping/aggregation
- No push notifications (no service worker, no Web Push)
- No notification creation on the backend for social actions (likes, follows, comments create notifications via direct DB writes in API routes)
- Mark-as-read: Individual or "all" via POST endpoint
- No pagination UI despite API support
- Stale time: 30s, no auto-refetch interval

**Search Architecture:**
- Simple text matching: `name.contains(q)` or `handle.contains(q)` for users, `text.contains(q)` for posts
- No full-text search, no ranking, no relevance scoring
- No autocomplete, no suggestions, no trending
- Recent searches tracked in Zustand store but never rendered
- No debouncing (fires API on every keystroke)
- Explore page uses hardcoded static data (`exploreItems` from `data.ts`)
- People tab fetches ALL users via `useAllUsers()` (limit 100)
