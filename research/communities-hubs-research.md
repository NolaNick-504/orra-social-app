# Communities, Groups & Hubs — Competitive Research Report

**Date:** 2025-07-27  
**Author:** Senior Mobile App Researcher  
**Scope:** Discord, Reddit, Facebook Groups, Telegram, Slack vs. ORRA Hubs

---

## Table of Contents

1. [Discord](#1-discord)
2. [Reddit](#2-reddit)
3. [Facebook Groups](#3-facebook-groups)
4. [Telegram Groups/Channels](#4-telegram-groupschannels)
5. [Slack](#5-slack)
6. [ORRA Current Implementation](#6-orra-current-implementation)
7. [Cross-Platform Feature Matrix](#7-cross-platform-feature-matrix)
8. [Critical Analysis](#8-critical-analysis)
9. [Actionable Recommendations](#9-actionable-recommendations)

---

## 1. Discord

### 1.1 Community Discovery
- **Server Discovery page** (`/discover`) with curated categories: Gaming, Education, Science & Tech, Entertainment, Music, Social, etc.
- **Search bar** with autocomplete — search by server name or keyword
- **Featured/trending servers** on the Discovery homepage with cover images, member counts, and short descriptions
- **Category browsing** — users can drill into categories like "Gaming > RPG" or "Education > Language Learning"
- **Direct invite links** — most growth is organic via shareable `discord.gg/xxx` links
- **Server Hub** (for verified servers) — a centralized listing
- **No algorithmic recommendations** based on user behavior (unlike Reddit/FB)

### 1.2 Community Profile (Server Page)
- **Server icon** (square, can be animated for boosted servers) + **Banner image** (wide, top)
- **Server name** and **description** (up to 1,200 chars)
- **Member count** with **online count** breakdown
- **Boost level** indicator (Nitro boosting — Level 1/2/3)
- **Rules/Welcome screen** — shown on first join (configurable)
- **About/Server Description** panel
- **Social links** and **server website** fields
- **NSFW flag** indicator
- **Server creation date** shown in settings

### 1.3 Join/Leave Flow
- **Open servers** (Discovery): Click "Join" — instant join
- **Invite-only servers**: Requires `discord.gg` link — instant join if link valid
- **Verification gates**: Some servers require:
  - Clicking a verification button
  - Agreeing to rules before gaining access
  - Reactions/captcha verification
  - Onboarding questions (customizable via bots)
  - Membership screening (Discord built-in feature)
- **Leave**: Right-click server → Leave Server → Confirm
- **No application/review process** natively (bots add this)
- **Auto-kick for inactivity** (bot-driven, not native)

### 1.4 Community Roles
- **Owner** (crown icon, supreme power, only 1)
- **Administrator** (custom role with full permissions)
- **Moderator** (custom role with limited admin permissions)
- **Custom Roles** — unlimited custom roles with granular permissions:
  - 30+ permission bits (Manage Channels, Kick Members, Ban Members, Manage Messages, etc.)
  - Role hierarchy determines authority
  - Role colors and icons (custom)
  - Role hoisting (show separately in member list)
  - Role mentionability (`@role`)
- **Default roles**: `@everyone` (baseline permissions)
- **Bot roles** — special roles for automated accounts
- **Nitro Booster role** — auto-assigned for boosters

### 1.5 Content Within Community
- **Text messages** in channels (primary content type)
- **Threads** — temporary or permanent sub-conversations from any message
- **Forum channels** — structured topic-based posts with tags
- **Voice channels** — real-time audio/video
- **Stage channels** — auditorium-style audio events with speakers/audience
- **Announcement channels** — one-way broadcasts that can be "followed" by other servers
- **Media channels** — image/video focused layout
- **Embeds** — rich link previews, bot cards
- **Polls** — native poll feature (recently added)
- **Events** — scheduled events with RSVP
- **Reactions/Emojis** on any message
- **Attachments** — images, files up to 500MB (Nitro)

### 1.6 Channels/Categories
- **Categories** — collapsible groups that contain channels
- **Text Channels** — persistent chat rooms (#general, #introductions, etc.)
- **Voice Channels** — real-time audio rooms
- **Stage Channels** — presentation/event style
- **Forum Channels** — structured Q&A/discussion with tags
- **Announcement Channels** — broadcast style
- **Thread organization** within any channel
- **Private channels** — restricted to specific roles
- **Slowmode** — rate limiting per channel (1s to 6h between messages)
- **NSFW channels** — age-gated
- **Channel permissions** — granular per-role/per-member overrides

### 1.7 Member List
- **Sidebar member list** — grouped by role (if hoisted)
- **Online/offline** status with colored dots
- **Status indicators**: Online (green), Idle (yellow), DND (red), Offline (gray)
- **Custom status** text
- **Role-based grouping** — hoisted roles appear separately
- **Search** members by name
- **Member count** at top of list
- **No pagination** — infinite scroll
- **User profiles** viewable on click (avatar, banner, bio, roles, activity)

### 1.8 Community Moderation
- **AutoMod** — AI-powered content filter:
  - Keyword filter (custom word list)
  - Spam detection
  - Mention spam limits
  - Regex patterns
  - Actions: block, alert, timeout, delete
- **Manual moderation**:
  - Delete messages
  - Timeout members (1s to 28 days)
  - Kick members
  - Ban members (with reason)
  - Slowmode per channel
- **Audit Log** — tracks all admin/mod actions
- **Reporting** — users can report messages to Discord Trust & Safety
- **Member screening** — built-in verification gate
- **Verification levels** (None, Low, Medium, High, Highest)
- **Explicit content filter** (scan all, scan from non-friends, none)
- **Rules screen** — configurable welcome/rules page
- **Modmail** (via bots) — ticket-based user→mod communication
- **Log channels** — mod action logs
- **Bots** — infinite extensibility (MEE6, Dyno, Carl-bot, etc.)

### 1.9 Community Notifications
- **Per-server notification settings**:
  - All messages
  - Only @mentions
  - Nothing
- **Per-channel overrides** for notification settings
- **@everyone / @here** pings
- **@role** mentions
- **Push notifications** configurable globally and per-server
- **Mute server** option (with duration: 15min, 1hr, 8hr, 24hr, until turned off)
- **Suppress @everyone and @role** option per server
- **Unread indicator** — bold channel names, dot for mentions
- **Activity Feed** — summarizes what happened while away
- **Mobile badge count** configurable

### 1.10 Community Stats/Analytics
- **Server Insights** (for servers with 500+ members):
  - Member growth/loss over time
  - Retention rates (1-day, 7-day, 30-day)
  - Message activity by channel
  - New member sources (Discovery, Invite, etc.)
  - Top active members
  - Voice channel usage
  - Server health metrics
- **Member count / online count** always visible
- **No analytics for small servers** (<500 members)

### 1.11 Pinned/Featured Content
- **Pinned messages** per channel — up to 50 pins per channel
- **Announcement channels** — featured/pin-boosted content
- **Forum pinned posts** — can be pinned in forum channels
- **Server Guide** — curated list of channels/resources for new members
- **Onboarding** — configurable welcome flow highlighting key channels

### 1.12 Community Events
- **Scheduled Events** — create events with:
  - Title, description, cover image
  - Start/end time
  - Location (voice channel or external link)
  - RSVP/interest tracking
  - Auto-notifies interested members
  - Recurring events supported
- **Stage Events** — live audio events with speaker management
- **Event discovery** in server

### 1.13 Community Currency/Tokens
- **No native currency/tokens**
- **Bot economies** — third-party bots (MEE6, Dyno) implement XP, leveling, and virtual currency
- **Server Boosting** — Nitro members can "boost" a server (real money → perks)
- **Stickers** — custom sticker packs (boosted servers)

### 1.14 Cross-Community Features
- **Announcement channel following** — one server's announcements can be auto-published to another server
- **Server templates** — share server setup as a template
- **User is member of many servers** — DMs work cross-server
- **No direct server-to-server interaction** beyond announcement following
- **Mutual servers** visible on user profiles

---

## 2. Reddit

### 2.1 Community Discovery
- **r/popular** — aggregated trending content across all subreddits
- **r/all** — all public content sorted by engagement
- **Search** — full-text search across subreddits, posts, and comments
- **Category browsing** — topic-based categories (Gaming, News, Entertainment, etc.)
- **Recommendations** — algorithmic suggestions based on:
  - Subscribed subreddits
  - Viewing history
  - Upvote patterns
- **Trending subreddits** bar on homepage
- **r/subredditoftheday** — featured community
- **Related subreddits** sidebar on each subreddit page
- **Multireddits** — custom feeds combining multiple subreddits

### 2.2 Community Profile (Subreddit Page)
- **Banner/cover image** — customizable wide banner
- **Profile picture/icon** — subreddit avatar
- **Name** (r/subredditname)
- **Description** — short description + sidebar/wiki with extended info
- **Member count** (subscribers) + **Online count**
- **Creation date**
- **Rules** — up to 10 rules shown on sidebar, expandable
- **Wiki** — community-maintained knowledge base
- **Sidebar widgets** — custom content blocks (images, text, links, calendar)
- **Post flairs** — color-coded topic tags
- **Over 18 / NSFW** flag
- **Community highlights** — featured posts

### 2.3 Join/Leave Flow
- **Open subreddits**: Click "Join" — instant membership
- **Private subreddits**: Require moderator approval — submit request → mod reviews → accept/decline
- **Restricted subreddits**: Anyone can view, only approved users can post
- **Premium/Gold-only subreddits** (r/lounge) — require Reddit Premium
- **Quarantined subreddits** — require explicit opt-in + email verification
- **Leave**: Click "Joined" → becomes "Join" again
- **No application process** for open subreddits

### 2.4 Community Roles
- **Moderator** — full control over subreddit:
  - Configure settings, appearance, rules
  - Remove/approve posts and comments
  - Ban users
  - Manage flairs, wiki, automod
  - Invite other mods
- **Approved user** — can post in restricted subreddits
- **Member** — joined user, can post/comment (if subreddit allows)
- **Contributor** — approved to post in restricted subreddits
- **Custom user flair** — self-assigned or mod-assigned labels visible on posts
- **Mod log** — tracks all mod actions
- **No built-in hierarchy among mods** (seniority is informal)
- **Reddit Admins** — site-wide employees with global power

### 2.5 Content Within Community
- **Posts** — text, image, link, video, poll
- **Comments** — threaded/nested with upvote/downvote
- **Crossposts** — share a post from one subreddit to another
- **Awards** — community awards (subreddit-specific) and global awards
- **Megathreads** — pinned mega-topics (e.g., weekly discussion)
- **Wiki pages** — community-authored documents
- **Chat rooms** — real-time chat within subreddit (less used)
- **Events/Meetups** — via wiki or posts (no native event feature)
- **Polls** — built-in voting
- **OC (Original Content) tags** — flair indicating original work

### 2.6 Channels/Categories
- **Post flairs** — color-coded topic tags (e.g., "Question", "Meme", "Discussion", "Tutorial")
  - Required or optional per subreddit
  - Can be mod-only or user-selectable
  - Searchable/filterable
- **Sort modes** — Hot, New, Top, Rising, Controversial
- **Wiki pages** — structured content sections
- **Megathreads** — organized by topic
- **No channel/room system** — all content flows as posts in one stream
- **Collections** — mods can group related posts

### 2.7 Member List
- **No public member list** (privacy by design)
- **Moderator list** — publicly visible on sidebar
- **Online member count** shown
- **Total subscriber count** shown
- **Top contributors** — visible via karma in community
- **User search** within subreddit via search bar

### 2.8 Community Moderation
- **AutoModerator (AutoMod)** — powerful rule-based automation:
  - Keyword triggers with regex support
  - Auto-remove, auto-approve, auto-flair
  - Rate limiting per user
  - Domain blacklists/whitelists
  - Age/karma requirements for posting
  - Custom modmail responses
- **Manual moderation**:
  - Remove posts/comments
  - Lock posts (no new comments)
  - Sticky/pin posts
  - Ban users (temporary or permanent, with reason)
  - Mute users in modmail
  - Mark as NSFW/OC/Spam
  - Approve/queue management
- **Mod queue** — centralized review queue for reported/filtered content
- **Report system** — users report content, enters mod queue
- **Crowd control** — auto-collapse comments from low-karma/new users
- **Content tags** — mandatory tagging (spoiler, NSFW, etc.)
- **Mod log** — public log of all mod actions
- **Ban evasion filter** — detects alt accounts
- **Modmail** — ticket-based communication system
- **Reddit Admin enforcement** — site-wide rules, ban evasion detection

### 2.9 Community Notifications
- **Per-subreddit notifications** — limited:
  - Trending posts from joined subreddits
  - Push for popular posts in subscribed communities
- **Inbox notifications** — replies, mentions, mod messages
- **No granular per-subreddit notification controls**
- **Daily digest** — optional email with top posts from subscriptions
- **Push notifications** for:
  - New posts in subscribed subreddits (if enabled)
  - Comment replies
  - Modmail
  - Milestones

### 2.10 Community Stats/Analytics
- **Subreddit traffic stats** (visible to mods):
  - Unique visitors per day/week/month
  - Subscriptions/unsubscriptions over time
  - Pageviews
  - Post/comment counts over time
- **Reddit Premium analytics** — additional data for large subreddits
- **Public stats**: Subscriber count, online count
- **No public-facing analytics dashboard**

### 2.11 Pinned/Featured Content
- **Sticky posts** — up to 2 pinned posts at top of subreddit
- **Sort by Hot** — algorithm naturally surfaces popular content
- **Awards** — premium content highlighted
- **Sidebar highlights** — mods can feature links
- **Collections** — curated groupings of posts
- **Community highlights widget** — featured posts in sidebar

### 2.12 Community Events
- **No native event system**
- **Workarounds**:
  - Megathread posts
  - Wiki events page
  - Calendar widget (custom sidebar widget)
  - Third-party links
- **Reddit Live** — real-time updating threads for events (deprecated/limited)
- **Reddit Talks** — live audio rooms (largely discontinued)

### 2.13 Community Currency/Tokens
- **Community Awards** — subreddit-specific award types (cost Reddit Coins)
- **Reddit Coins** — platform-wide virtual currency for giving awards
- **Reddit Premium** — subscription with benefits
- **Moons/Bricks** — subreddit-specific crypto tokens on r/CryptoCurrency and r/FortNiteBR (Reddit Community Points program — largely sunset)
- **Karma** — aggregate score from upvotes (not spendable, reputation metric)

### 2.14 Cross-Community Features
- **Crossposting** — share any post from one subreddit to another with attribution
- **Multireddits** — combined feeds from multiple subreddits
- **Related subreddits** — shown in sidebar
- **Subreddit links** — easily link to other subreddits in comments
- **r/subredditoftheday** — cross-promotion
- **Shared user base** — same account across all subreddits

---

## 3. Facebook Groups

### 3.1 Community Discovery
- **Groups Discover page** — algorithmic recommendations based on:
  - Friend memberships
  - Interests and activity
  - Location
  - Groups you've visited
- **Search** — full-text search with filters (location, category, public/private)
- **Categories**: Buy & Sell, Entertainment, Hobbies, Parenting, Sports, etc.
- **Suggested Groups** — shown in feed, sidebar, and notifications
- **Friend activity** — "X and 3 other friends are in this group"
- **Group recommendations from friends** — social proof
- **Trending groups** in your area
- **Group invitations** from friends

### 3.2 Community Profile (Group Page)
- **Cover photo** — wide banner image
- **Group icon/logo**
- **Group name**
- **Privacy badge** (Public, Private → Visible/Hidden)
- **About section** — description, rules, tags
- **Member count**
- **Post count** (total posts)
- **Group type tags** (e.g., "Buy & Sell", "Lifestyle")
- **Group badges** for members (New Member, Founding Member, Conversation Starter, etc.)
- **Custom tabs**: Discussion, Featured, Events, Media, Files, About
- **Group admin/mod list**
- **Group quality indicator** (if flagged for violations)

### 3.3 Join/Leave Flow
- **Public Groups**: Click "Join" — instant access
- **Private Visible Groups**: Click "Join" → 
  - Auto-approve (if admin allows)
  - OR Admin review required (application with optional questions, up to 3)
  - Wait for approval notification
- **Private Hidden Groups**: Invite-only — must receive link/invite from member
- **Participation questions** — admins can require answers to join (up to 3 questions)
- **Leave group**: Click "Joined" → "Leave Group" → confirm
- **Group rules acceptance** — may require agreeing to rules on join

### 3.4 Community Roles
- **Admin** — full control:
  - Change group settings, name, privacy
  - Add/remove mods
  - Approve/decline membership requests
  - Remove posts and members
  - Pin posts
  - Create events
- **Moderator** — limited admin powers:
  - Approve/decline membership
  - Remove posts
  - Ban members
  - Pin posts
  - Cannot change group settings
- **Member** — can post, comment, react
- **Specialist roles** — limited to specific tasks
- **Badges** — earned roles visible on posts:
  - New Member, Founding Member, Conversation Starter, Visual Storyteller, etc.
- **Group expert** — admin-designated knowledgeable member (shown with badge)

### 3.5 Content Within Community
- **Posts** — text, image, video, link, poll
- **Comments/Replies** — nested threads
- **Reactions** — Like, Love, Haha, Wow, Sad, Angry
- **Events** — full event creation with RSVP, location, time
- **Polls** — built-in polling
- **Live video** — broadcast to group
- **Files/Documents** — shared files section
- **Photos/Media** — organized media gallery
- **Sale listings** (Buy & Sell groups) — item for sale with price
- **Announcements** — admin broadcasts
- **Stories** — group stories (in some groups)
- **Chat rooms** — real-time group chat
- **Tags** — topic-based organization

### 3.6 Channels/Categories
- **Discussion tab** — all posts, sorted by Top/Recent/New
- **Featured tab** — admin-curated content
- **Topics/Tags** — admins can create post tags (e.g., "Question", "Tips", "Announcement")
- **Media tab** — photos and videos
- **Events tab** — upcoming events
- **Files tab** — shared documents
- **Buy/Sell tab** — for commerce groups
- **No channel/room system** — content is post-based, not room-based

### 3.7 Member List
- **Member list** visible to members (admin can restrict)
- **Admin & Moderators** section at top
- **New members** section
- **Search members** by name
- **Friend members** highlighted
- **Member badges** visible
- **Member count** prominently shown
- **Invite friends** to group from member list

### 3.8 Community Moderation
- **Group Rules** — configurable, shown on join and in sidebar (up to 10)
- **Participation questions** — filter members on join
- **Post approval queue** — admins can require all posts to be approved
- **Keyword alerts** — admins notified when specific words are used
- **Auto-approve/reject** — based on criteria
- **Profanity filter** — automatic content filtering
- **Moderation alerts** — flagged content review queue
- **Member reporting** — report posts to admins
- **Remove posts/comments**
- **Ban members** (temporary or permanent)
- **Mute members** — restrict posting ability
- **Post approval** — require admin approval for posts
- **Pending posts queue** — admin review interface
- **Facebook Group Quality** — system monitors for violations
- **Anonymous posting** — can be enabled

### 3.9 Community Notifications
- **Notification levels per group**:
  - All posts
  - Highlights (friends' posts, popular posts)
  - Off
- **Admin announcements** — push to all members
- **Event reminders** — auto-notifications for upcoming events
- **Post notifications** — from posts you've engaged with
- **Tag notifications** — when someone tags you
- **Group activity summary** — periodic digest
- **Mobile push notifications** configurable per group

### 3.10 Community Stats/Analytics
- **Group Insights** (available to admins):
  - Total members, new members, growth rate
  - Active members (daily, weekly, monthly)
  - Popular posts and top contributors
  - Post engagement metrics
  - Demographics (age, gender, location)
  - Growth trends over time
  - Content breakdown (posts, comments, reactions)
- **Member activity** — who's most active
- **No public analytics** — admin-only

### 3.11 Pinned/Featured Content
- **Pinned posts** — admin can pin up to 1 post to top
- **Featured tab** — admin-curated content collection
- **Announcements** — special admin posts with enhanced visibility
- **Group stories** — temporary highlighted content
- **Post bumping** — popular posts resurface

### 3.12 Community Events
- **Full event system**:
  - Event name, description, cover image
  - Date, time, timezone
  - Location (physical or online)
  - RSVP options (Going, Interested, Can't Go)
  - Guest list/invite
  - Event discussion wall
  - Reminders and notifications
  - Recurring events
  - Event link sharing
- **Events tab** in group
- **Calendar view**
- **Live video** during events

### 3.13 Community Currency/Tokens
- **No native community currency**
- **Fundraisers** — can create charitable fundraisers within groups
- **Facebook Stars** — during live video (platform-wide)
- **Group badges** — reputation markers (not spendable)
- **Buy & Sell** — real commerce, not virtual currency

### 3.14 Cross-Community Features
- **Group sharing** — share group link on timeline, in other groups, via DM
- **Cross-posting** — share posts between groups
- **Linked groups** — admins can suggest related groups
- **User profile shows group memberships** (for public groups)
- **Friend connections** — social graph connects groups
- **No group-to-group interaction** beyond sharing

---

## 4. Telegram Groups/Channels

### 4.1 Community Discovery
- **No built-in discovery** — Telegram has no official group/channel browse page
- **Search** — global search finds public groups/channels by name/username
- **Third-party directories** — Telegram Catalog, TGStat, Telegram Channels
- **Invite links** — primary growth mechanism (`t.me/groupname`)
- **Forwarding** — content shared across groups drives discovery
- **Recommendation bots** — some bots suggest channels
- **Recently joined** — shows in chat list
- **No algorithmic recommendations**

### 4.2 Community Profile
- **Group/Channel name**
- **Profile photo** (circular)
- **Description/bio** — short text with link support
- **Member count** (channels: subscriber count)
- **Pinned message** — one pinned message at top
- **Username** (`@groupname`) for public groups
- **No cover image** — only profile photo
- **No rules page** — typically a pinned message with rules
- **Linked channel** — groups can have an associated channel

### 4.3 Join/Leave Flow
- **Public groups**: Search → click → instant join
- **Private groups**: Invite link required → click → instant join
- **Channels**: Subscribe/unsubscribe instantly
- **No approval process** natively
- **Join limits**: Telegram limits how many groups a user can join (500)
- **Leave**: Delete chat / leave group
- **No application/review system**

### 4.4 Community Roles
- **Creator/Owner** — full control (only 1)
- **Admin** — configurable permissions:
  - Change info, delete messages, ban users, invite users, pin messages, add admins, manage video chats, anonymous messages, manage topics
- **Member** — can send messages (based on group permissions)
- **No custom roles** — admin is the only special role
- **Anonymous admins** — admins can post as the group identity
- **Bots** — with assigned admin permissions
- **Channel roles**: Creator, Admin (post/manage), Subscriber

### 4.5 Content Within Community
- **Messages** — text, media, files, voice messages, video messages
- **Topics** (in topics-enabled supergroups) — thread-like sub-discussions
- **Polls** — native polls with quiz mode
- **Reactions** — emoji reactions on messages
- **Voice chats** — live audio rooms
- **Video chats** — live video calls for the group
- **Forwarded messages** — from other chats
- **Stickers/GIFs**
- **Bots** — automated content, games, utilities
- **Files** — up to 2GB per file
- **No threaded replies** natively (but has reply-to-message)

### 4.6 Channels/Categories
- **Topics** (supergroups with topics enabled):
  - Each topic is like a channel/thread
  - General topic always exists
  - Custom topics created by admins
  - Topic icons (emoji)
  - Separate message streams per topic
- **Forums mode** — turns group into forum-like structure
- **No tags/flairs system**
- **Channel + Group pairing** — channel for announcements, group for discussion
- **Folders** — user-level chat organization, not community-level

### 4.7 Member List
- **Member list** — shows recent/online members
- **Admin list** — separate section at top
- **Bot list** — separate section
- **Member count** shown
- **Search members** by name
- **Online status** — last seen time or "online"
- **No role-based grouping** (beyond admin)
- **Limited member management UI**

### 4.8 Community Moderation
- **Permissions system**:
  - Send messages, media, stickers, polls
  - Add members
  - Pin messages
  - Change group info/photo
  - Invite via link
- **Manual moderation**:
  - Delete messages
  - Ban/kick users
  - Restrict users (read-only, no media, etc.)
  - Mute users
- **Anti-spam bot** — built-in basic spam filter
- **Slow mode** — rate limit messages (1 per 10s to 1 per 1hr)
- **Report** — users can report messages/spam
- **No AutoMod** beyond basic anti-spam
- **Bots** — extend moderation (Anti-Spam, Rose, etc.)
- **Join restrictions** — time-based limits on new members
- **No content filter or keyword blocking natively**

### 4.9 Community Notifications
- **Per-chat notification settings**:
  - All messages
  - Mentions only
  - Muted (with duration: 1hr, 8hr, 2days, forever)
- **@all** mention (admins only)
- **@admin** mention
- **Pinned message notification**
- **No digest/summary**
- **Push notifications** configurable per device
- **Badge count** on app icon

### 4.10 Community Stats/Analytics
- **No native analytics for groups**
- **Channel statistics** (for channels with 500+ subscribers):
  - Subscriber growth/loss
  - Views per post
  - Sources of new subscribers
  - Recent follower demographics (language, location)
  - Message view counts
- **Third-party analytics** — TGStat, Telemetr
- **No group-level analytics natively**

### 4.11 Pinned/Featured Content
- **Pinned message** — one message pinned to top
- **Channel posts** — always visible chronologically
- **No multi-pin support**
- **No featured section**

### 4.12 Community Events
- **No native event system**
- **Voice/Video chats** — can be scheduled:
  - Title and start time
  - Members get notified
  - Screen sharing support
- **Workarounds**: Pinned messages, bots, Google Calendar links
- **No RSVP system**

### 4.13 Community Currency/Tokens
- **No native community currency**
- **TON integration** — Telegram's crypto ecosystem:
  - TON-based mini-apps and payments
  - Stars (virtual currency for in-app purchases)
  - Crypto wallet integration
- **Bot economies** — third-party bots can implement points/tokens
- **Gifts** — Telegram Premium gifting

### 4.14 Cross-Community Features
- **Forwarding** — content can be forwarded between groups/channels
- **Linked channels** — group + channel pairing
- **Bot cross-posting** — bots can relay messages between groups
- **No formal cross-community interaction**
- **Same account** across all groups

---

## 5. Slack

### 5.1 Community Discovery
- **No public discovery mechanism** — Slack workspaces are private by default
- **Slack Discover** — limited beta for finding public Slack communities
- **Slack Atlas** — org chart and profile discovery (enterprise)
- **Invite-based** — primary growth is via email invitations
- **Shared channels** (Slack Connect) — connect with external orgs
- **Custom signup links** — for community workspaces
- **No algorithmic recommendations**
- **Third-party directories** — Standuply, Slofile list public Slacks

### 5.2 Community Profile (Workspace)
- **Workspace name**
- **Logo/icon**
- **No cover image**
- **Description** (short, in settings)
- **Member count**
- **Default channels** (#general, #random)
- **Workspace URL** (`workspace.slack.com`)
- **No public-facing profile page**
- **About page** — limited, admin-configured

### 5.3 Join/Leave Flow
- **Email invitation** — admin/mod sends email invite → user clicks → creates account
- **Custom signup link** — shared URL for open communities
- **Slack Connect** — external users invited to specific channels
- **Domain-based auto-join** — users with @company.com emails can auto-join
- **Approval process** — admins can require approval for new accounts
- **Leave**: Deactivate account or sign out (no "leave workspace" flow for users)
- **No discovery-based joining**

### 5.4 Community Roles
- **Primary Owner** — supreme authority, can transfer ownership
- **Owner** — full admin access
- **Admin** — manage members, channels, settings
- **Moderator** — channel-specific management (newer role):
  - Delete messages
  - Kick from channel
  - Manage channel settings
- **Member** — can post, join channels, DM
- **Guest (Multi-channel)** — limited to specific channels, paid per-user
- **Guest (Single-channel)** — limited to one channel
- **Custom roles** (Enterprise) — granular role creation
- **No user-facing role display** — roles are admin-facing

### 5.5 Content Within Community
- **Messages** — text, rich text, code blocks
- **Threads** — side conversations on any message
- **Files** — upload and share documents
- **Huddles** — live audio/video in any channel
- **Clips** — short video/audio recordings
- **Canvases** — collaborative documents (new)
- **Polls** — built-in (Slack 2024+)
- **Workflows** — automated forms and processes
- **Lists** — task/project tracking
- **Integrations** — 2,000+ apps in Slack marketplace
- **Bookmarks** — pinned links at top of channel
- **Starred items** — personal bookmarks

### 5.6 Channels/Categories
- **Channels** — primary organization unit:
  - Public channels (#name) — discoverable, joinable
  - Private channels (lock icon) — invite-only
- **Sections** — user can organize channels into custom groups
- **Channel purposes** — description at top
- **Channel topics** — editable channel topic
- **Default channels** — auto-joined on workspace entry
- **DMs** — private 1:1 or group conversations
- **Shared channels** (Slack Connect) — cross-workspace channels
- **No tags/flairs** — channel is the organizing principle
- **Channel prefixes** — convention-based (#team-, #proj-, #help-)

### 5.7 Member List
- **Member directory** — searchable, filterable
- **Profile cards** — name, title, status, timezone
- **Custom profile fields** — org-defined (department, manager, etc.)
- **Status emoji/text** — current activity
- **Online/away/offline** indicators
- **No role-based member grouping** in directory
- **Admin can export member lists**

### 5.8 Community Moderation
- **Channel moderation** (Moderator role):
  - Delete messages
  - Manage channel membership
  - Set channel posting permissions
- **Admin controls**:
  - Manage members, deactivate accounts
  - Set retention policies
  - Manage integrations
  - Content moderation (Enterprise)
- **Information barriers** (Enterprise) — prevent communication between groups
- **Data Loss Prevention (DLP)** — automated content scanning
- **Egress prevention** — block sharing outside workspace
- **No built-in AutoMod** (unlike Discord/Reddit)
- **Reporting** — flag messages to admins
- **Audit logs** — track admin actions
- **Emoji moderation** — manage custom emoji
- **Third-party moderation apps** — available in marketplace

### 5.9 Community Notifications
- **Per-channel notification settings**:
  - All new messages
  - Only mentions/direct messages
  - Nothing (mute)
- **Per-workspace notification schedule** — quiet hours
- **@channel / @here** — mention everyone or active members
- **@mention** — individual pings
- **Keyword notifications** — custom trigger words
- **Do Not Disturb** — with automatic exceptions for urgent
- **Notification preferences** — sound, badge, desktop/mobile
- **Activity view** — consolidated notification feed
- **Later** — bookmarked/follow-up items

### 5.10 Community Stats/Analytics
- **Slack Analytics** (Standard+ plans):
  - Active members (daily, weekly, monthly)
  - Messages sent
  - Channel activity
  - App usage
  - Member engagement trends
- **Channel analytics** — post frequency, members
- **Member analytics** — activity per user
- **Export** — message history (compliance)
- **Enterprise analytics** — cross-workspace insights
- **No public-facing analytics**

### 5.11 Pinned/Featured Content
- **Pinned items** per channel — messages, files, links
- **Bookmarks** — link bar at top of channel (new)
- **Channel purpose** — always visible at top
- **Starred channels** — personal quick access
- **No global workspace pin**
- **Canvas** — can be pinned as reference document

### 5.12 Community Events
- **No native event system**
- **Huddles** — can start live audio/video at any time
- **Scheduled huddles** — coming soon/limited
- **Workflow builder** — can create event registration workflows
- **Third-party integrations** — Google Calendar, Outlook
- **Workarounds**: Calendar apps, channel announcements

### 5.13 Community Currency/Tokens
- **No community currency**
- **Slack Marketplace** — paid integrations
- **Premium features** — plan-based, not community-based
- **No gamification/tokens/rewards**

### 5.14 Cross-Community Features
- **Slack Connect** — shared channels between workspaces
- **Shared DMs** — multi-org direct messages
- **Guest accounts** — external users in specific channels
- **No workspace-to-workspace content sharing** beyond Connect
- **Enterprise Grid** — multiple connected workspaces

---

## 6. ORRA Current Implementation

### 6.1 Community Discovery
- **Hub grid view** — card-based layout showing all hubs with cover images, member counts, online counts
- **"Discover Hubs" button** — present but not functional (placeholder)
- **Suggested Hubs section** — list of recommended hubs with join buttons
- **No search functionality** for hubs
- **No category browsing**
- **No trending/featured hubs**
- **No algorithmic recommendations** based on user interests

### 6.2 Community Profile (Hub Detail View)
- **Cover image** (wide, top of detail view)
- **Hub icon** (emoji, overlaid on cover)
- **Hub name**
- **Description** (short, 1 line)
- **Member count** + **Online count**
- **"+5 ORRA to join"** cost indicator
- **No rules page**
- **No admin/mod list**
- **No wiki/about section**
- **No social links**
- **No creation date**
- **No NSFW/privacy indicator**

### 6.3 Join/Leave Flow
- **Open hubs only** — click "Join Hub" → instant membership
- **+5 ORRA +10 XP** awarded on join (with anti-farming: once per hub)
- **Leave**: Click "Joined" button → instant leave, toast "Left hub"
- **No invite-only option**
- **No approval process**
- **No participation questions**
- **No rules acceptance on join**
- **No member cap**

### 6.4 Community Roles
- **No roles system** — all members are equal
- **No admin or moderator role**
- **No custom roles**
- **No permission system**
- **No role badges or indicators**
- **No hub creator/owner concept in UI**

### 6.5 Content Within Community
- **Text posts** — simple text-only posts
- **Like** — heart/like on posts (+1 ORRA per like)
- **Comment count** — shown but **no comment UI** in hub context
- **No image/media posts** within hubs
- **No polls**
- **No events**
- **No announcements**
- **No threads/replies**
- **No rich content** (embeds, links, etc.)
- **No post flair/tags**
- **Create post** — only available to joined members

### 6.6 Channels/Categories
- **No channels or categories** — all posts in a single stream
- **No tags/flairs**
- **No topic organization**
- **No forum/threaded view**
- **No announcement vs discussion separation**
- **Flat chronological feed only**

### 6.7 Member List
- **Stacked avatars** — up to 4 member avatars on hub cards
- **"+X more"** text
- **"You're here!"** indicator for joined hubs
- **No full member list** view
- **No online/offline indicators** per member
- **No role grouping**
- **No member search**
- **No admin/mod distinction**

### 6.8 Community Moderation
- **No moderation tools**
- **No rules system**
- **No content reporting**
- **No post removal**
- **No member banning**
- **No AutoMod**
- **No content filtering**
- **No approval queue**
- **No mod log**
- **No profanity filter**

### 6.9 Community Notifications
- **No hub-specific notifications**
- **No notification settings** for hubs
- **No @mention system** in hubs
- **No digest/summary** of hub activity
- **No new post notifications**
- **Activity tab** exists globally but no hub-specific filtering

### 6.10 Community Stats/Analytics
- **No analytics dashboard**
- **Member count** and **online count** are the only stats
- **No growth tracking**
- **No active member metrics**
- **No top contributors**
- **No engagement metrics**
- **No post performance data**

### 6.11 Pinned/Featured Content
- **No pinned posts**
- **No featured content**
- **No announcements section**
- **No way to highlight important posts**

### 6.12 Community Events
- **No event system**
- **No scheduling**
- **No RSVP**
- **No calendar**
- **No live audio/video**
- **No event notifications**

### 6.13 Community Currency/Tokens
- **+5 ORRA tokens** on hub join (anti-farming enforced)
- **+10 XP** on hub join
- **+1 ORRA** for liking hub posts
- **+5 ORRA +10 XP** for creating hub posts
- **No hub-specific currency**
- **No leaderboard within hub**
- **No hub-specific rewards/badges**
- **ORRA Token Shop** exists but no hub-specific items

### 6.14 Cross-Community Features
- **Hub memberships** displayed on user profiles as pill tags
- **No cross-hub posting**
- **No hub recommendations** beyond "Suggested for You"
- **No hub-to-hub interaction**
- **No shared events**
- **No hub categories/tags for discovery**

---

## 7. Cross-Platform Feature Matrix

| Feature | Discord | Reddit | Facebook | Telegram | Slack | **ORRA** |
|---------|---------|--------|----------|----------|-------|----------|
| **Discovery Search** | ✅ Full | ✅ Full | ✅ Full | ⚠️ Basic | ❌ None | ❌ **None** |
| **Category Browse** | ✅ Rich | ✅ Rich | ✅ Rich | ❌ None | ❌ None | ❌ **None** |
| **Algorithmic Recs** | ❌ | ✅ Strong | ✅ Strong | ❌ | ❌ | ⚠️ **Basic** |
| **Cover Image** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ **Has it** |
| **Rules Page** | ✅ | ✅ (10 rules) | ✅ | ⚠️ Pinned | ❌ | ❌ **Missing** |
| **Member/Online Count** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ **Has it** |
| **Join Approval** | ✅ Screening | ✅ Private | ✅ Questions | ❌ | ✅ Invite | ❌ **Open only** |
| **Custom Roles** | ✅ Unlimited | ❌ | ❌ | ❌ | ✅ Ent. | ❌ **None** |
| **Admin/Mod Roles** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ **None** |
| **Channels/Categories** | ✅ Rich | ⚠️ Flairs | ⚠️ Topics | ✅ Forums | ✅ Rich | ❌ **None** |
| **Threaded Discussion** | ✅ | ✅ | ✅ | ⚠️ Reply | ✅ | ❌ **None** |
| **Image/Media Posts** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ **Text only** |
| **Polls** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ **None** |
| **Events** | ✅ Full | ❌ | ✅ Full | ⚠️ Voice | ❌ | ❌ **None** |
| **Announcements** | ✅ Channel | ⚠️ Sticky | ✅ | ⚠️ Pinned | ⚠️ Pinned | ❌ **None** |
| **Pinned Posts** | ✅ 50/channel | ✅ 2 sticky | ✅ 1 | ✅ 1 msg | ✅ Per-ch | ❌ **None** |
| **Member List** | ✅ Full | ❌ | ✅ Full | ✅ | ✅ | ⚠️ **Avatars only** |
| **AutoMod** | ✅ AI | ✅ Powerful | ✅ | ⚠️ Basic | ❌ | ❌ **None** |
| **Content Reporting** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ **None** |
| **Per-Community Notifs** | ✅ Granular | ⚠️ Limited | ✅ | ✅ | ✅ | ❌ **None** |
| **Analytics** | ✅ 500+ | ✅ Mod only | ✅ Admin | ⚠️ Channel | ✅ Plan | ❌ **None** |
| **Community Currency** | ❌ Bot | ⚠️ Awards | ❌ | ⚠️ TON | ❌ | ✅ **ORRA tokens** |
| **Cross-Community** | ⚠️ Announce | ✅ Xpost | ⚠️ Share | ⚠️ Forward | ✅ Connect | ❌ **None** |

---

## 8. Critical Analysis

### 8.1 What ORRA is Doing RIGHT

1. **Gamified Join Incentive (+5 ORRA +10 XP)** — This is UNIQUE across all platforms. No competitor rewards users for joining communities. This is a strong differentiator that drives engagement and onboarding.

2. **Token Economy Integration** — The ORRA token system tied to community actions (join, post, like) creates a flywheel of engagement that no competitor has natively. Discord relies on bots; Reddit had a failed crypto experiment. ORRA has this built-in.

3. **Visual Design Quality** — The glass-panel UI, cover images, gradient buttons, and emoji icons create a premium, modern aesthetic that rivals Discord's visual appeal and exceeds Reddit/Telegram/Slack.

4. **Online Count Display** — Showing online members alongside total members is a Discord-level feature that signals community vitality. Reddit and Telegram don't emphasize this as well.

5. **Suggested Hubs Section** — While basic, having a recommendation section is a step toward Facebook/Reddit-level discovery.

6. **Hub Memberships on Profile** — Displaying hub memberships as pill tags on user profiles is a strong identity feature that builds belonging. Discord shows mutual servers; Reddit shows post history. ORRA's approach is more prominent.

7. **Anti-Farming Token Protection** — The `TokenAction` dedup system preventing repeat token claims is smart and prevents abuse that most bot economies struggle with.

8. **Hub Post Creation with Membership Gate** — Requiring membership to post is standard and correctly implemented.

### 8.2 What ORRA is MISSING (Critical Gaps)

#### 🔴 P0 — Must Have (Blocks Core Experience)

1. **NO ROLES/ADMIN SYSTEM** — This is the single biggest gap. Every single competitor has admin and moderator roles. Without this:
   - No one can moderate content
   - No one can remove spam
   - No ownership or governance
   - Communities cannot scale
   - **Risk**: Hubs become spam havens

2. **NO MODERATION TOOLS** — Zero ability to:
   - Delete posts
   - Ban/kick members
   - Report content
   - Filter spam
   - **Risk**: Legal liability, brand safety, user trust erosion

3. **NO CHANNELS/CATEGORIES** — All posts in a flat feed means:
   - No topic organization
   - No way to separate announcements from discussion
   - Becomes unusable at scale (50+ posts)
   - Every competitor has some form of content organization

4. **NO SEARCH FOR HUBS** — Users cannot find hubs by keyword, category, or interest. Discovery is limited to the 6 hardcoded hubs and 4 suggested hubs.

5. **NO COMMENT/REPLY SYSTEM IN HUBS** — Comment count is shown but there's no UI to actually comment or view comments on hub posts. This is half-implemented.

#### 🟡 P1 — Should Have (Significant UX Gaps)

6. **No Rules/About Section** — Users join without knowing community norms. Every competitor has rules.

7. **No Pinned Posts** — No way to highlight important information, welcome messages, or community guidelines.

8. **No Image/Media Posts** — Text-only posts are severely limiting. This is a visual-first generation.

9. **No Member List View** — Users can't see who else is in the hub, find friends, or understand community composition.

10. **No Hub-Specific Notifications** — Users get no alerts about new posts, mentions, or activity in their hubs.

11. **No Announcements** — No way for hub leaders to broadcast important updates.

12. **No Join Rules/Acceptance** — Users join with zero friction, which means zero commitment and potential for spam/abuse accounts.

#### 🟢 P2 — Nice to Have (Competitive Differentiation)

13. **No Events System** — Facebook and Discord have robust event systems. ORRA's dance challenge infrastructure could extend to hub events.

14. **No Hub Analytics** — No growth metrics, engagement data, or member insights.

15. **No Hub-Specific Leaderboard** — ORRA has the token economy but no way to showcase top contributors within a hub.

16. **No Cross-Hub Features** — No sharing, cross-posting, or community-to-community interaction.

17. **No Hub Creation by Users** — Only pre-seeded hubs exist. User-generated communities are how Discord and Reddit achieved scale.

18. **No Polls in Hubs** — Platform has poll infrastructure but not connected to hubs.

19. **No Private/Invite-Only Hubs** — All hubs are open.

20. **No Slow Mode or Rate Limiting** — No spam protection for hub posts.

### 8.3 Bugs & UX Issues to Fix

1. **Comment count shown but no comment UI** — `post.comments` is displayed on hub posts but there's no way to actually comment. Either implement commenting or remove the count.

2. **Suggested hubs use same join handler but no detail view** — Clicking a suggested hub doesn't navigate to its detail page, only the hub card grid has that navigation.

3. **"Discover Hubs" button does nothing** — The button is styled but has no `onClick` handler or navigation.

4. **Member avatars are always the same 4 users** — `users.slice(0, 4)` always shows the same faces regardless of actual hub membership.

5. **Leave hub gives no ORRA/XP back** — Joining awards tokens but leaving doesn't reclaim them. This could be exploited (join many hubs, get tokens, leave).

6. **Hub post creation uses global `toggleCreatePost()`** — This opens the general create-post modal, not a hub-specific post creation flow. Posts created this way likely go to Pulse, not the hub.

7. **No loading states** — Hub data loads without skeleton states or loading indicators.

8. **Static data in frontend** — `hubs` and `suggestedHubs` are imported from `data.ts` rather than fetched from the API (`/api/hubs`). The API exists but isn't used by the hub component.

9. **No empty state for "Your Hubs"** — If a user hasn't joined any hubs, the grid shows all hubs (joined + unjoined), not a filtered "your hubs" view. The title says "Your Hubs" but shows all hubs.

10. **Hub description is truncated** — Only a single line description. No expandable about section.

---

## 9. Actionable Recommendations

### Priority 0 — Critical (Week 1-2)

| # | Recommendation | Effort | Impact | Details |
|---|---------------|--------|--------|---------|
| R1 | **Implement Hub Roles (Owner, Admin, Mod, Member)** | M | 🔴 Critical | Add `role` field to `HubMember` model. First member = Owner. Add role badges in UI. |
| R2 | **Add Basic Moderation (delete posts, ban members)** | M | 🔴 Critical | Admin/Mod can delete hub posts, remove/ban members. Add `isBanned` field and mod actions API. |
| R3 | **Add Content Reporting** | S | 🔴 Critical | Report button on hub posts → creates notification for hub admins. Simple flag queue. |
| R4 | **Fix Hub Post Creation** | S | 🔴 Critical | Hub-specific post creation modal that POSTs to `/api/hubs/[hubId]/posts`. Current flow is broken. |
| R5 | **Connect Frontend to Hub API** | M | 🔴 Critical | Replace `data.ts` imports with `fetch('/api/hubs')` calls. API exists but is unused. |
| R6 | **Add Hub Search** | S | 🔴 Critical | Search bar on hub tab. Filter hubs by name. Can use existing `/api/search` pattern. |

### Priority 1 — High (Week 3-4)

| # | Recommendation | Effort | Impact | Details |
|---|---------------|--------|--------|---------|
| R7 | **Add Channels/Categories within Hubs** | L | 🟡 High | Add `HubChannel` model (id, hubId, name, icon). Hub detail view shows channel tabs. Start with: General, Announcements, Off-Topic. |
| R8 | **Add Hub Rules Section** | S | 🟡 High | Add `rules` JSON field to Hub model. Display in hub detail. Require acceptance on join. |
| R9 | **Add Pinned Posts** | S | 🟡 High | Add `isPinned` boolean to HubPost. Pinned posts shown at top. Admin-only action. |
| R10 | **Add Image/Media Posts to Hubs** | M | 🟡 High | Extend HubPost with `images` JSON field. Reuse existing upload infrastructure. |
| R11 | **Add Hub Comment System** | M | 🟡 High | Either extend existing Comment model with `hubPostId` target, or create `HubPostComment`. Fix the broken comment count display. |
| R12 | **Add Full Member List View** | M | 🟡 High | Expandable member list in hub detail. Show online/offline, join date, roles. |
| R13 | **Add Hub Notifications** | M | 🟡 High | New post notification for hub members. Configurable per-hub notification preferences. |

### Priority 2 — Medium (Week 5-8)

| # | Recommendation | Effort | Impact | Details |
|---|---------------|--------|--------|---------|
| R14 | **User-Created Hubs** | L | 🟢 Medium | Allow users to create hubs. Add "Create Hub" flow with name, icon, cover, description, rules. Creator becomes Owner. |
| R15 | **Hub Events** | L | 🟢 Medium | Add `HubEvent` model. RSVP, notifications, calendar integration. Leverage dance challenge infrastructure. |
| R16 | **Hub Leaderboard** | S | 🟢 Medium | Top contributors per hub by posts/likes. ORRA token rewards for top members. |
| R17 | **Hub Discovery with Categories** | M | 🟢 Medium | Add `category` field to Hub model. Browse hubs by category: Art, Dance, Tech, Music, Fitness, Food. |
| R18 | **Private/Invite-Only Hubs** | M | 🟢 Medium | Add `privacy` field (open, invite-only, approval-required). Join request flow for approval hubs. |
| R19 | **Hub Analytics Dashboard** | M | 🟢 Medium | Member growth, post activity, top contributors, engagement metrics. Admin-only view. |
| R20 | **Polls in Hubs** | S | 🟢 Medium | Reuse existing Poll model. Allow polls in hub posts. |
| R21 | **Announcements Channel** | S | 🟢 Medium | Special channel type where only admins can post. All members notified. |

### Priority 3 — Low (Month 3+)

| # | Recommendation | Effort | Impact | Details |
|---|---------------|--------|--------|---------|
| R22 | **AutoMod for Hubs** | L | 🟢 Low | Keyword filtering, spam detection, rate limiting. Start with simple keyword blocklist. |
| R23 | **Cross-Hub Sharing** | M | 🟢 Low | Share hub posts to other hubs. Cross-post like Reddit. |
| R24 | **Hub-Specific Rewards/Shop** | M | 🟢 Low | Hub-exclusive cosmetics, badges, name effects purchasable with ORRA tokens. |
| R25 | **Hub Boosting** | M | 🟢 Low | Like Discord boosting — members spend ORRA tokens to boost hub, unlocking perks. |
| R26 | **Threaded Replies in Hubs** | M | 🟢 Low | Reply chains on hub posts. Thread view like Discord/Slack. |
| R27 | **Hub Badges/Credentials** | S | 🟢 Low | Earn badges for hub participation milestones (first post, 10 posts, 100 likes, etc.). |

---

## Appendix A: Database Schema Additions Needed

```prisma
// Add to Hub model
model Hub {
  // ... existing fields ...
  rules        String   @default("[]")   // JSON array of rule strings
  category     String   @default("general")  // Art, Dance, Tech, Music, etc.
  privacy      String   @default("open")     // open, invite_only, approval
  isFeatured   Boolean  @default(false)      // admin-curated featured hub
  ownerUserId  String?                      // hub creator/owner
  
  channels     HubChannel[]
  events       HubEvent[]
}

// Add role to HubMember
model HubMember {
  // ... existing fields ...
  role       String   @default("member")  // owner, admin, moderator, member
  isBanned   Boolean  @default(false)
  bannedAt   DateTime?
  banReason  String   @default("")
}

// Hub Channels
model HubChannel {
  id          String   @id @default(cuid())
  hubId       String
  hub         Hub      @relation(fields: [hubId], references: [id], onDelete: Cascade)
  name        String
  icon        String   @default("💬")
  type        String   @default("discussion")  // discussion, announcement, media
  position    Int      @default(0)
  
  posts       HubPost[]
  
  @@index([hubId])
}

// Add to HubPost
model HubPost {
  // ... existing fields ...
  channelId   String?
  channel     HubChannel? @relation(fields: [channelId], references: [id])
  isPinned    Boolean  @default(false)
  images      String   @default("[]")    // JSON array of image URLs
  isAnnouncement Boolean @default(false)
}

// Hub Events
model HubEvent {
  id          String   @id @default(cuid())
  hubId       String
  hub         Hub      @relation(fields: [hubId], references: [id], onDelete: Cascade)
  title       String
  description String
  coverImage  String   @default("")
  startTime   DateTime
  endTime     DateTime?
  location    String   @default("")    // physical or "online"
  rsvpCount   Int      @default(0)
  createdBy   String
  
  rsvps       HubEventRSVP[]
  
  @@index([hubId])
  @@index([startTime])
}

model HubEventRSVP {
  id        String   @id @default(cuid())
  eventId   String
  event     HubEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId    String
  status    String   @default("going")  // going, interested, declined
  
  @@unique([eventId, userId])
  @@index([userId])
}
```

---

## Appendix B: Quick-Win Implementation Order

### Day 1: Fix Broken Things
1. Fix hub post creation to use hub-specific modal
2. Connect frontend to `/api/hubs` instead of `data.ts`
3. Remove broken "Discover Hubs" button or wire it up
4. Fix member avatars to show actual hub members
5. Fix "Your Hubs" to filter to joined hubs only

### Day 2-3: Add Critical Missing Features
1. Add `role` field to HubMember
2. Add basic mod actions API (delete post, ban member)
3. Add report button on hub posts
4. Add hub search bar

### Day 4-5: Enhance UX
1. Add rules/about section to hub detail
2. Add pinned posts support
3. Add image upload to hub posts
4. Add comment system for hub posts
5. Add member list view

### Week 2: Scale Features
1. Add hub channels/categories
2. Add hub notifications
3. Add user-created hubs
4. Add hub category browsing

---

## Appendix C: Competitive Advantage Map

```
ORRA's Unique Position:
┌──────────────────────────────────────────────┐
│  ORRA's COMMUNITY TOKEN FLYWHEEL             │
│                                              │
│  Join Hub (+5 ORRA, +10 XP)                  │
│       ↓                                      │
│  Create Post (+5 ORRA, +10 XP)               │
│       ↓                                      │
│  Get Likes → More ORRA → Level Up            │
│       ↓                                      │
│  Unlock Perks → More Engagement              │
│       ↓                                      │
│  Hub Thrives → More Members Join             │
│       ↓                                      │
│  🔄 LOOP                                     │
│                                              │
│  NO COMPETITOR HAS THIS NATIVELY             │
└──────────────────────────────────────────────┘
```

**Key Insight**: ORRA's token economy is its strongest differentiator. The priority should be building community infrastructure AROUND this economy (roles, moderation, channels, events) so the token flywheel operates in a healthy, well-governed community environment rather than an unmoderated free-for-all.

---

*End of Report — Generated 2025-07-27*
