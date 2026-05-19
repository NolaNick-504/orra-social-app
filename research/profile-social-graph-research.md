# Profile & Social Graph Research Report

## Platform Research: Instagram, TikTok, Twitter/X, LinkedIn, BeReal

> **Note**: Web search API was rate-limited during research. This report is compiled from expert knowledge of all five platforms as of early 2025, cross-referenced against ORRA's current codebase (`profile.tsx`, `edit-profile-modal.tsx`, `schema.prisma`, API routes).

---

## 1. INSTAGRAM

### 1.1 Profile Layout
- **Cover Image**: No traditional cover image. Instead uses a clean header with avatar centered at top.
- **Avatar**: Large circular avatar (110px on mobile), overlapping a thin colored border ring. No glow effects.
- **Name & Handle**: Display name (bold, larger) above handle (@username, gray, smaller).
- **Bio**: Up to 150 characters. Supports line breaks, hashtags (#), mentions (@), emojis, and one clickable link (or multiple via Linktree-style "link in bio" services). Bio links are blue/underlined.
- **Stats Row**: **Posts** | **Followers** | **Following** — horizontally centered, tappable (followers/following open lists).
- **Action Buttons Row**: Follow/Following + Message + ↓ (more: Add to Close Friends, Notifications, Share, Block, etc.). For own profile: Edit Profile + Share + Settings gear.
- **Category Label**: Optional business/creator category shown below name (e.g., "Digital Creator", "Musician/Band").

### 1.2 Profile Tabs
- **Posts (Grid)**: 3-column photo grid, tappable.
- **Reels**: Vertical video grid, separate tab.
- **Tagged**: Posts where user is tagged.
- For professional accounts: also **Shop** tab.

### 1.3 Profile Stats
- Posts count, Followers count, Following count.
- No "likes total" shown on profile.

### 1.4 Bio/About Section
- 150 char limit.
- Supports: text, line breaks, hashtags (clickable), @mentions (clickable), emojis, one external link.
- **Link sticker** in bio (Instagram's native multi-link feature).
- **Pronouns** field (separate from bio).

### 1.5 Profile Customization
- **Story Highlights**: Circular icons below bio, with custom cover images and names. Up to ~20 visible.
- **Pinned Posts**: Up to 3 posts can be pinned to top of grid.
- **Grid Preview**: Users strategically arrange posts for visual aesthetic.
- **Avatar ring**: On your birthday, Instagram shows a birthday cake ring around your avatar.
- No themes, color schemes, or name effects.

### 1.6 Level/Tier Systems
- **Creator Badges**: "Top Fan" badges in comments (for creator accounts).
- **Subscription Tiers**: Creators can offer paid subscriptions with exclusive content.
- **Professional Account Types**: Business vs Creator account with different analytics.
- No gamified XP/level system.

### 1.7 Follow System
- **Public accounts**: Anyone can follow instantly.
- **Private accounts**: Follow requests must be approved.
- **Mutual follow indicator**: "Follows you" label on other user profiles.
- **Close Friends**: Separate list for story sharing.

### 1.8 Followers/Following Lists
- Tappable from stats row.
- **Searchable**: Search bar at top to filter by name.
- **Sorted**: Default by most recent interaction (algorithmic), not chronologically.
- **Mutual indicators**: "Followed by user1, user2" + "X more" shown.
- **Follow/unfollow** button inline per user.

### 1.9 Block/Mute/Restrict
- **Block**: User cannot see your profile/content; you cannot see theirs.
- **Mute**: Hide their posts/stories from your feed without unfollowing.
- **Restrict**: Shadow-block — their comments are hidden from others, DMs go to Message Requests.
- **Hide Story**: Prevent specific users from seeing your stories.

### 1.10 Profile Verification
- **Meta Verified** (blue checkmark): Paid subscription ($14.99/mo) requiring government ID.
- **Legacy verified** (pre-2023): Blue checkmark retained for some accounts.
- **Notable accounts**: Previously verified based on notability.

### 1.11 Profile Deep Links
- **Custom URL**: `instagram.com/username`
- **QR Code**: Built-in Nametag/QR code for profile sharing.
- **Share Profile**: Native share sheet.
- **Deeplinks**: `instagram://user?username=xxx`

### 1.12 Profile Editing
- **Inline editing**: Edit Profile opens a full-screen form (not modal on mobile).
- Fields: Name, Username, Pronouns, Bio, Links, Profile Photo, Gender (private).
- **Avatar cropping**: Circular crop tool with zoom/pan.
- **Handle validation**: Real-time availability checking.

### 1.13 Guest/Viewing Profile
- **Public accounts**: All posts, reels, bio, stats visible to anyone.
- **Private accounts**: Only followers can see posts/reels. Bio, stats, avatar still visible.
- **Message button** always visible on non-own profiles.
- **Suggested accounts** shown below profile (for non-followers).

### 1.14 Profile Widgets/Highlights
- **Story Highlights**: Circular thumbnails with labels, persistent below bio.
- **Featured/Liked by creator**: Can pin highlights to showcase.
- No intro cards or featured posts section.

### 1.15 Activity Status
- **Online indicator**: Green dot next to avatar in DMs (not on profile).
- **Last active**: Shown in DMs only (can be disabled in settings).
- Not shown on profile page itself.

---

## 2. TIKTOK

### 2.1 Profile Layout
- **Cover Image**: No cover image. Clean dark header area.
- **Avatar**: Large circular avatar with optional verified badge overlay.
- **Name & Handle**: Display name + @handle below.
- **Bio**: Up to 80 characters. No line breaks (single line). Supports emojis.
- **Stats Row**: Following | Followers | Likes (total likes across all videos).
- **Action Buttons**: Follow + Message + ⊕ (follow) / Edit Profile + Share + Settings (own).

### 2.2 Profile Tabs
- **Videos (Grid)**: 3-column video thumbnail grid.
- **Favorites**: Videos the user has favorited (if made public).
- **Liked**: Videos the user has liked (if made public).
- **Reposts**: Reposted videos tab.
- **Pinned**: Pinned videos shown at top of Videos tab (up to 3).

### 2.3 Profile Stats
- Following count, Followers count, Total Likes count.
- Numbers abbreviated: 1.2K, 1.5M, etc.

### 2.4 Bio/About Section
- 80 character limit (single line).
- **Link in bio**: One clickable link (for accounts with 1000+ followers or business accounts).
- **Instagram/YouTube links**: Can link external social accounts (shown as icons).
- Very limited compared to other platforms.

### 2.5 Profile Customization
- **Pinned Videos**: Up to 3 videos pinned to top of grid.
- **Video covers**: Custom thumbnail per video.
- **Profile categories**: Optional labels (e.g., "Gaming", "Comedy").
- No themes, colors, or name effects.

### 2.6 Level/Tier Systems
- **Creator Rewards**: Monetization program based on video views.
- **Creator Fund / Creativity Program Beta**: Earnings based on engagement.
- **Top Creator Badge**: Badges for top commenters in live streams.
- **Subscription**: Creators can offer paid subscriptions.
- No XP or level system.

### 2.7 Follow System
- Public accounts: Instant follow.
- Private accounts: Follow request required.
- **Mutual indicator**: "Follows you" badge on profile.
- **Suggested accounts**: "Similar creators" shown alongside.

### 2.8 Followers/Following Lists
- Tappable from stats.
- **Not searchable** (major UX gap).
- **No mutual indicators** in the list view.
- Limited to ~200 displayed.

### 2.9 Block/Mute/Restrict
- **Block**: Full block with confirmation.
- **Mute**: Available on individual videos (Not Interested).
- **Report**: For reporting profiles.
- Less granular than Instagram's options.

### 2.10 Profile Verification
- **Blue checkmark**: For notable figures, brands, creators (application-based, free).
- **TikTok Verified**: Based on authenticity, notability, activity.
- No paid verification option.

### 2.11 Profile Deep Links
- **Custom URL**: `tiktok.com/@username`
- **QR Code**: Built-in QR code for profile sharing (TikCode).
- **Share**: Native share sheet with copy link.

### 2.12 Profile Editing
- **Modal**: Full-screen edit form.
- Fields: Profile photo, Name, Username, Bio, Link (if eligible).
- **Avatar**: Square crop tool with circular preview.
- **Handle**: Real-time validation.

### 2.13 Guest/Viewing Profile
- **Public**: All content visible to anyone.
- **Private**: Only followers can see videos; bio/stats still visible.
- **DMs**: Anyone can send a message (with privacy settings).

### 2.14 Profile Widgets/Highlights
- **No story highlights** (TikTok Stories are separate, not shown on profile).
- **Pinned videos** serve a similar purpose to highlights.
- **LIVE replay**: Past live streams shown in dedicated section.

### 2.15 Activity Status
- **No online/last-active indicator** on profiles.
- Green dot shown in DMs only.

---

## 3. TWITTER/X

### 3.1 Profile Layout
- **Cover Image**: Wide banner image (1500x500px recommended) at top.
- **Avatar**: Circular, overlapping the banner by ~50%, large (responsive size).
- **Name & Handle**: Display name (bold) + @handle (gray).
- **Bio**: Up to 160 characters. Supports line breaks, hashtags, @mentions, emojis, links (auto-linked).
- **Stats Row**: Posts | Following | Followers (tappable).
- **Action Buttons**: Follow + ⊕ + Message + ⋯ (more: mute, block, share, etc.).

### 3.2 Profile Tabs
- **Posts**: Tweets & replies (can be filtered to "Posts only" or "Posts & Replies").
- **Media**: Photos and videos only.
- **Likes**: Liked posts (public by default).

### 3.3 Profile Stats
- Posts count, Following count, Followers count.
- Numbers formatted: 1.2K, 1.5M.

### 3.4 Bio/About Section
- 160 character limit.
- Supports: text, line breaks, #hashtags (clickable), @mentions (clickable), URLs (auto-linked with t.co wrapper), emojis.
- **Location field**: Separate from bio.
- **Website field**: Separate from bio.
- **Birth date**: Optional, with visibility controls (public, followers, mutuals, only you).
- **Joined date**: Auto-displayed ("Joined March 2020").

### 3.5 Profile Customization
- **Pinned Post**: One post can be pinned to top of profile.
- **Banner image**: Wide customization.
- **Avatar ring**: Colored ring appears on your birthday (Twitter adds birthday cake).
- **Professional Account**: Optional category label (e.g., "Journalist", "Developer").
- **Spaces host**: Shows past Spaces on profile.
- No themes or name effects.

### 3.6 Level/Tier Systems
- **X Premium (Twitter Blue)**: Paid subscription with:
  - Blue checkmark (with "Verified" label if phone-verified).
  - Longer posts, edit button, bookmark folders.
  - Prioritized rankings in replies.
- **X Premium+**: Higher tier with ad-free experience, largest reply boost.
- **Verified Organizations**: Gold checkmark for businesses, gray for government.
- **Super Follows** (legacy): Paid subscriber-only content.

### 3.7 Follow System
- **Public accounts**: Anyone can follow.
- **Protected accounts**: Follow requests must be approved (private mode).
- **Mutual indicator**: "You follow each other" / "Follows you" label.
- **Follow suggestions**: "Who to follow" on sidebar.

### 3.8 Followers/Following Lists
- **Searchable**: Yes, search bar at top.
- **Sortable**: No explicit sort, but algorithmically ordered.
- **Mutual indicators**: "Followed by X, Y" shown for some users.
- **Follow/unfollow** inline per user.

### 3.9 Block/Mute/Restrict
- **Block**: Full block — blocked user cannot see your content, you cannot see theirs.
- **Mute**: Hide user's posts from timeline without unfollowing.
- **Soft block**: Force unfollow by blocking then unblocking.
- **Hide replies**: Collapse replies on your tweets.

### 3.10 Profile Verification
- **Blue checkmark**: X Premium subscribers ($8/mo or $84/yr).
- **Gold checkmark**: Verified Organizations (businesses).
- **Gray checkmark**: Government officials/entities.
- Legacy free verification removed April 2023.

### 3.11 Profile Deep Links
- **Custom URL**: `x.com/username` or `twitter.com/username`.
- **QR Code**: Available via share menu.
- **Share**: Native share sheet with copy link.
- **Profile badge links**: Clickable links to other platforms.

### 3.12 Profile Editing
- **Inline editing**: "Edit profile" button opens full-screen form.
- Fields: Name, Bio, Location, Website, Birth date, Banner, Avatar.
- **Avatar**: Circular crop with zoom/pan.
- **Handle**: Separate edit flow with availability checking.

### 3.13 Guest/Viewing Profile
- **Public**: All posts, likes, media visible (unless user hides likes).
- **Protected**: Only approved followers can see posts.
- **Shadow moderation**: Some profiles may have reduced visibility.
- **Profile preview**: Hover card on desktop shows mini profile.

### 3.14 Profile Widgets/Highlights
- **Pinned tweet**: One post pinned to top.
- **Super Follows tab**: Subscriber-only content (legacy).
- **Professional tools**: Showcases on business profiles.
- **Affiliate/Creator**: Links to shops/brands.
- No story highlights.

### 3.15 Activity Status
- **No online/last-active indicator** on profiles.
- Green dot shown in DMs only (if enabled).

---

## 4. LINKEDIN

### 4.1 Profile Layout
- **Cover Image**: Wide banner image (1584x396px recommended) at top.
- **Avatar**: Circular, overlapping banner, with green ring for "Open to Work" or "Hiring".
- **Name & Headline**: Name (bold) + Headline (gray, single line — job title or custom).
- **Location**: City, State, Country.
- **Connections**: "500+ connections" (capped display).
- **Action Buttons**: Connect + Follow + Message + More (…).

### 4.2 Profile Tabs (Sections)
- **About**: Written summary (rich text).
- **Activity**: Recent posts, articles, comments.
- **Experience**: Job history with company logos.
- **Education**: Schools, degrees.
- **Skills**: Endorsed skills with endorsements count.
- **Recommendations**: Written recommendations from connections.
- **Accomplishments**: Certifications, projects, publications, patents, courses, honors.
- **Interests**: Followed companies, groups, influencers.

### 4.3 Profile Stats
- Connections count (displayed as "500+" if over 500).
- Profile views (last 90 days).
- Post impressions (for creators).
- Search appearances.

### 4.4 Bio/About Section
- **About section**: Rich text, up to 2,600 characters. Supports paragraphs, bullet points.
- **Headline**: 220 characters, single line.
- No hashtags or @mentions in the traditional sense (but company tags work).

### 4.5 Profile Customization
- **Open to Work**: Green border around avatar, job preferences visible.
- **Hiring**: Purple/blue border around avatar.
- **Creator Mode**: "Follow" instead of "Connect", featured section, hashtags.
- **Featured Section**: Pin posts, articles, links, media to top of profile.
- **Custom button**: Add website, portfolio, or other link.
- **Name pronunciation**: Audio recording of name pronunciation.

### 4.6 Level/Tier Systems
- **Premium Career/InMail**: Paid tiers for job seekers and recruiters.
- **LinkedIn Learning**: Course completion badges.
- **Skill Assessments**: Badges for passing skill quizzes (shown on profile).
- **Top Voice**: Badges for active contributors in collaborative articles.
- **SSI (Social Selling Index)**: Hidden internal score.
- **Creator badges**: "Top Voice", "LinkedIn Expert".

### 4.7 Follow System
- **Connect**: Bidirectional connection request (requires approval).
- **Follow**: One-way follow (see public posts without connecting).
- **Connection degrees**: 1st, 2nd, 3rd degree indicators.
- **Mutual connections**: "X mutual connections" shown on profiles.

### 4.8 Followers/Following Lists
- **Connections list**: Searchable, sortable by recent, first name, last name.
- **Followers list**: Available for creator mode profiles.
- **Mutual connections**: Explicitly shown ("3 mutual connections").
- **Tag/label connections**: Can add notes/tags to connections.

### 4.9 Block/Mute/Restrict
- **Block**: User cannot see your profile; you cannot see theirs.
- **Mute**: Hide their posts from feed without removing connection.
- **Unfollow**: Stop seeing their posts while staying connected.
- **Report**: For inappropriate profiles.

### 4.10 Profile Verification
- **Work verification**: Confirm employment via employer (blue checkmark).
- **Government ID verification**: Identity verification badge.
- **Company verification**: Verified organization badge.

### 4.11 Profile Deep Links
- **Custom URL**: `linkedin.com/in/username` (customizable).
- **QR Code**: In-app QR code for profile sharing.
- **Share**: Share via message, post, or copy link.
- **Save to PDF**: Export profile as PDF resume.

### 4.12 Profile Editing
- **Section-by-section editing**: Each section has its own edit button.
- **Rich text editor**: For About section (bold, italic, bullet points).
- **Inline editing**: Change avatar, banner from hover overlay.
- **Profile strength**: Meter showing completeness (Intermediate, Advanced, All-Star).

### 4.13 Guest/Viewing Profile
- **Public**: Limited info visible to non-logged-in users.
- **Logged in**: Full profile visible based on connection degree and privacy settings.
- **Private mode**: Can browse profiles anonymously.
- **Who viewed your profile**: Shown to profile owner.

### 4.14 Profile Widgets/Highlights
- **Featured Section**: Pinned posts, articles, links, media.
- **Creator hashtags**: Followed hashtags shown on profile.
- **Skills section**: With endorsement counts.
- **Recommendations**: Written testimonials.
- **Name pronunciation**: Audio clip.
- **Custom CTA button**: Portfolio, website, etc.

### 4.15 Activity Status
- **Green dot**: "Active now" or "Active X hours ago" shown on profiles.
- Can be toggled off in settings.

---

## 5. BEREAL

### 5.1 Profile Layout
- **No cover image**: Minimal, clean layout.
- **Avatar**: Circular, smaller than other platforms.
- **Name & Handle**: Display name + username.
- **Bio**: Very short text.
- **Stats**: Number of friends (not followers/following — it's mutual).
- **Mojis**: Emoji reactions received from friends.

### 5.2 Profile Tabs
- **Memories**: Calendar-based view of past BeReals.
- **My Friends**: Grid of friend profiles.
- Very minimal compared to other platforms.

### 5.3 Profile Stats
- Friends count (mutual connections only).
- No public follower/following counts.
- Mojis count (total emoji reactions received).

### 5.4 Bio/About Section
- Very short bio (limited characters).
- **RealMojis**: Emojis you've created for reactions.
- No links, hashtags, or rich formatting.

### 5.5 Profile Customization
- **None**: Intentionally minimal. No themes, colors, or customization.
- The lack of customization is a core design philosophy.

### 5.6 Level/Tier Systems
- **None**: No gamification, no levels, no badges.
- BeReal actively avoids gamification mechanics.

### 5.7 Follow System
- **Friends, not followers**: Add friend = mutual connection. Both must accept.
- **No public following**: No one-way follow like Instagram.
- **Discovery**: Add by username, phone contacts, QR code.

### 5.8 Followers/Following Lists
- **Friends list**: Simple grid/list view.
- **Not searchable** (limited feature).
- **Mutual by definition**: All connections are mutual.

### 5.9 Block/Mute/Restrict
- **Block**: Basic blocking.
- **Report**: For inappropriate content.
- Very limited safety features compared to larger platforms.

### 5.10 Profile Verification
- **None**: No verification system. Intentionally egalitarian.

### 5.11 Profile Deep Links
- **Username-based**: `bere.al/username`
- **QR Code**: For adding friends.
- No NFC or advanced sharing.

### 5.12 Profile Editing
- **Minimal**: Name, username, bio, avatar.
- No cover image, no location, no website.

### 5.13 Guest/Viewing Profile
- **Only friends can see** BeReal posts.
- Bio and avatar visible to everyone (within the app).
- No public web profiles.

### 5.14 Profile Widgets/Highlights
- **Memories**: Calendar-based past BeReals (personal, not public highlights).
- No story highlights or featured posts.

### 5.15 Activity Status
- **None**: No online or last-active indicators.
- The "BeReal" notification itself implies activity.

---

## FEATURE COMPARISON MATRIX

| Feature | Instagram | TikTok | Twitter/X | LinkedIn | BeReal | **ORRA** |
|---|---|---|---|---|---|---|
| Cover Image | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Avatar with Ring FX | Minimal | ❌ | Minimal | ✅ (Open to Work) | ❌ | ✅ (Level glow) |
| Bio Length | 150 chars | 80 chars | 160 chars | 2,600 chars | Very short | Unlimited |
| Bio Links | 1 (multi via feature) | 1 (1K+ followers) | Auto-linked | Rich text links | ❌ | ✅ (website field) |
| Pronouns | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Location Field | ❌ (in bio) | ❌ | ✅ | ✅ | ❌ | ✅ |
| Join Date | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ (own only) |
| Post Count | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Follower Count | ✅ | ✅ | ✅ | ❌ (connections) | ❌ | ✅ |
| Likes Total | ❌ | ✅ | ✅ (via likes tab) | ❌ | ❌ | ❌ |
| Level/XP System | ❌ | ❌ | ❌ | ❌ (badges only) | ❌ | ✅ **(UNIQUE)** |
| Token System | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **(UNIQUE)** |
| Generative Art Sig | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **(UNIQUE)** |
| Profile Themes | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **(UNIQUE)** |
| Name Effects | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **(UNIQUE)** |
| Badges | Limited | Limited | ❌ | ✅ | ❌ | ✅ |
| Story Highlights | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pinned Posts | ✅ (3) | ✅ (3) | ✅ (1) | ✅ (Featured) | ❌ | ❌ |
| QR Code | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Private Accounts | ✅ | ✅ | ✅ | ❌ (connections) | ✅ (friends) | ❌ |
| Follow Requests | ✅ | ✅ | ✅ | ✅ (connect) | ✅ | ❌ |
| Mutual Indicator | ✅ | ✅ | ✅ | ✅ (1st/2nd/3rd) | ✅ (by design) | ❌ |
| Block | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mute | ✅ | Limited | ✅ | ✅ (unfollow) | ❌ | ❌ |
| Restrict | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Verification | Paid | Free (notable) | Paid | Employer | ❌ | DB field only |
| Activity Status | DMs only | DMs only | DMs only | ✅ Profile | ❌ | DB field only |
| Searchable Follower List | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Bio Hashtags | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Bio @Mentions | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Bio Line Breaks | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ (textarea but no rendering) |
| Profile Categories | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Close Friends | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Custom Profile URL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (orra.link) |

---

## CRITICAL ANALYSIS: ORRA Profile & Social Graph

### What ORRA is Doing RIGHT

1. **ORRA Signature (Generative Art)**: This is an absolute **killer feature**. No other platform has a unique generative SVG art pattern that evolves with user data (level, tokens, posts). This is a massive differentiator that creates emotional attachment and visual identity. **Keep investing in this.**

2. **Level Tier System (Bronze → Silver/Gold → Diamond → Legend)**: Gamification through XP/levels is completely absent from mainstream social platforms. ORRA's tier system with visual level-glow rings on avatars is unique and addictive. The XP progress bar creates a compelling progression loop.

3. **Token Economy Integration**: Having ORRA tokens visible on the profile with a real shop system creates a micro-economy feel. The stat showing "ORRA Tokens" is novel and creates FOMO.

4. **Profile Themes (Aurora, Neon Nights, Golden Era, Midnight)**: Theming the profile is an exclusive ORRA concept. Instagram and TikTok have zero profile customization. This is a strong differentiator that makes profiles feel personal.

5. **Name Effects (Glow, Rainbow, Fire)**: Another exclusive feature. Making the display name visually distinctive with effects creates a status symbol that other platforms don't offer.

6. **Cover Image**: Instagram and TikTok lack cover images. ORRA having both a cover image AND theme overlays creates a rich visual profile.

7. **Hub Memberships**: Showing community affiliations on the profile creates social proof and belonging.

8. **Deep Link Sharing**: `orra.link/handle` is clean and professional.

### What ORRA is MISSING or Could Improve

#### 🔴 CRITICAL (Must Have)

1. **No Block/Mute/Restrict System**: ORRA has **zero safety features** for social graph management. There's no block, mute, or restrict functionality in the codebase. This is a **fundamental safety gap**. Every major platform has this. Without it, users have no protection from harassment.

2. **No Private Accounts / Follow Requests**: All ORRA profiles are public with instant follow. There's no option for private accounts or follow request approval. This limits user control over their audience.

3. **No Mutual Follow Indicator**: When viewing another user's profile, there's no "Follows you" indicator. This is standard on every platform and helps users understand their relationship.

4. **No QR Code for Profile Sharing**: Every major platform has a built-in QR code for sharing profiles. ORRA only has the link copy. This is a major gap for in-person sharing and growth.

5. **Followers/Following List Not Searchable**: The modal has no search bar to filter connections. For users with many connections, this is unusable.

6. **No Pinned Posts**: Instagram, TikTok, and Twitter all allow pinning content to the top of the profile. ORRA has no equivalent. Users can't showcase their best content.

7. **Other User Profiles Show Only 1 Tab**: When viewing another user, only the "Posts" tab is shown. Their Reels, Challenges are hidden. This severely limits profile exploration.

#### 🟡 IMPORTANT (Should Have)

8. **Bio Formatting Is Missing**: The bio is plain text with no support for:
   - Clickable hashtags (#)
   - Clickable @mentions
   - Clickable links (inline, not just the website field)
   - Line breaks rendered properly
   Instagram, Twitter, and TikTok all support at least some of these.

9. **No Story Highlights**: Instagram's story highlights are a major profile feature for showcasing personality. ORRA has stories but no persistent highlights on profiles.

10. **Verification Is a DB Field with No UI or Process**: The `verified` field exists in the schema but there's no verification badge that looks distinct (the current SVG checkmark is generic), no verification process, and no verification UI/flow.

11. **No Activity Status**: The `online` and `lastSeen` fields exist in the database schema but are never displayed on the profile. This is low-hanging fruit.

12. **No Profile Category/Label**: Instagram, TikTok, and LinkedIn all allow users to categorize themselves (e.g., "Creator", "Gamer", "Musician"). ORRA has hubs but no individual category label.

13. **Follow Button Doesn't Handle Errors Gracefully**: The follow/unfollow on profile uses an optimistic update with `catch(() => {})` — errors are silently swallowed. If the API call fails, the UI shows the wrong state.

14. **No "Close Friends" or Circle System**: Instagram has Close Friends for stories. ORRA has no equivalent for restricting content visibility to a subset of followers.

15. **No "Suggested Accounts" on Profile**: When viewing a profile, platforms show similar accounts. ORRA has no discovery mechanism on the profile page.

#### 🟢 NICE TO HAVE (Could Have)

16. **Avatar Cropping**: The edit profile modal doesn't include a crop tool — images are compressed to 400px max but not cropped. All major platforms offer circular crop with pan/zoom.

17. **No Pronouns Field**: Instagram has this. Simple inclusivity feature.

18. **No Birthday Display**: Twitter and LinkedIn show birthdays with privacy controls. Could integrate with the level system for bonus XP on birthdays.

19. **No Profile Completeness Meter**: LinkedIn's "Profile Strength" encourages users to fill out all fields. ORRA could show this with the level system.

20. **Bio Character Limit**: There's no character limit validation in the edit modal. Should have a counter like Instagram (150) or Twitter (160).

21. **No "Edit Cover" Directly**: The cover edit button says "Edit Cover" but opens the full profile edit modal instead of a direct cover image edit flow.

22. **Theme Banner Is Intrusive**: The "X Theme Active" banner takes up significant vertical space. Should be more subtle (maybe a small indicator dot or icon).

23. **ORRA Signature Is Not Interactive**: The generative art SVG doesn't respond to hover, tap, or interaction. Making it interactive (e.g., animate on hover, expand on tap) would make it more engaging.

24. **Purchased Items Section Is Cluttered**: The "My Shop Items" section with themes, name effects, badges, and premium dance entry takes up a lot of space. Should be collapsible or integrated more elegantly.

### 🐛 Bugs and UX Issues

1. **Level Tier Label Inconsistency**: The tier system description says "Silver/Gold" for 25-49, but the code shows `levelTier` as just "Gold" for 25-49. Silver tier is mentioned in the spec but missing in implementation.

2. **Silver tier missing from code**: `profileLevel >= 25 ? 'Gold'` — there's no Silver tier in the conditional. Should be: Bronze (1-24), Silver (25-49), Gold (50-74), Diamond (75-99), Legend (100+) or similar.

3. **Follower Count Abbreviation Inconsistent**: Followers use `>= 1000 ? K format` but Following and Posts don't use the same formatting.

4. **Join Date Only Shows for Own Profile**: The join date is hidden when viewing other users (`!isViewingOther` condition). Every other platform shows this publicly.

5. **Handle URL Encoding**: `handleShareProfile` uses `profileHandle.replace('@', '')` but doesn't URL-encode special characters.

6. **Other User Theme/Name Effect Shows But Can't Toggle**: When viewing another user's profile, their theme overlay and name effect render, but there's no indicator that it's *their* theme vs yours.

7. **No Loading State for Follow Action**: The follow/unfollow button has no loading spinner. If the API is slow, users can double-tap.

8. **Empty States Are Weak**: "No followers yet" and "Not following anyone yet" are just text. Should have illustrations and CTAs (e.g., "Find people to follow").

9. **The `otherUserTabs` Only Has Posts**: Other users can only see the Posts tab. They should also see Reels and Challenges at minimum.

10. **Bio Rendering Is Plain Text**: Line breaks typed in the bio textarea are not rendered as `<br>` in the profile view.

---

## PRIORITIZED ACTIONABLE RECOMMENDATIONS

### P0 — Safety & Trust (Ship Immediately)
| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | **Add Block functionality** — Block user from profile, prevent viewing content, remove from followers | M | Critical safety |
| 2 | **Add Mute functionality** — Hide user's posts from feed without unfollowing | S | Safety + UX |
| 3 | **Add "Follows you" indicator** on other user profiles | S | Trust + context |
| 4 | **Private account toggle** with follow request approval | L | Trust + safety |

### P1 — Profile Completeness (Ship Next Sprint)
| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 5 | **Add QR code** for profile sharing (generate from handle) | M | Growth + sharing |
| 6 | **Search in Followers/Following modal** | S | Usability |
| 7 | **Pinned Posts** — Allow pinning 1-3 posts to top of profile | M | Content showcase |
| 8 | **Show other user's Reels & Challenges tabs** | S | Profile depth |
| 9 | **Bio formatting** — Render line breaks, clickable #hashtags, @mentions, links | M | Richness |
| 10 | **Fix Silver tier** — Add Silver (25-49) between Bronze and Gold | S | Correctness |

### P2 — Engagement & Polish (Ship Within Month)
| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 11 | **Story Highlights** — Persistent highlight circles on profile | L | Personality |
| 12 | **Activity status** — Show online/last-seen using existing DB fields | S | Engagement |
| 13 | **Avatar crop tool** — Circular crop with pan/zoom in edit modal | M | Polish |
| 14 | **Profile categories** — User-selectable labels (Creator, Gamer, etc.) | S | Discovery |
| 15 | **Verification badge redesign** — Distinctive ORRA-style verification | S | Trust |
| 16 | **Bio character counter** with limit (suggest 200 chars) | S | UX |
| 17 | **Interactive ORRA Signature** — Animate on hover, expandable on tap | M | Differentiation |
| 18 | **Follow button loading state** — Prevent double-tap | S | Bug fix |
| 19 | **Join date visible on all profiles** | S | Trust + consistency |

### P3 — Innovation (Ship When Ready)
| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 20 | **Close Friends circle** for restricted story/content sharing | L | Privacy |
| 21 | **Profile completeness meter** tied to XP bonuses | M | Onboarding + gamification |
| 22 | **Suggested accounts** on other user profiles | M | Discovery |
| 23 | **Birthday bonuses** — Bonus XP/tokens on birthday + special avatar ring | S | Delight |
| 24 | **Pronouns field** | S | Inclusivity |
| 25 | **ORRA Signature as NFT/PFP** — Export signature as shareable image | M | Viral growth |
| 26 | **Profile music** — Like TikTok/Myspace, pin a song to your profile | L | Personality |
| 27 | **Mutual connections** — "Followed by X, Y, and 3 more" on profiles | M | Social proof |

---

## SUMMARY

ORRA has **three genuinely unique features** that no competitor offers:
1. **ORRA Signature** (generative art identity)
2. **Level/Tier system with visual glow rings** (gamified identity)
3. **Profile themes + name effects** (customizable identity)

These are powerful differentiators that create emotional attachment and status signaling. However, ORRA is missing **fundamental social graph safety features** (block, mute, restrict, private accounts, mutual indicators) that every competitor ships as table stakes. The gap between ORRA's innovative features and its missing basics is the most critical issue to address.

The profile page is information-dense but could benefit from better information architecture — the stats, badges, signature, hubs, shop items, and XP bar compete for vertical space. Consider collapsible sections or a tab-based layout for the info area above content tabs.

**Top 3 immediate priorities:**
1. 🚨 **Block/Mute/Safety features** — Without these, the platform cannot protect users
2. 📱 **QR code + searchable follower list** — Core sharing and navigation
3. 🎯 **Mutual indicators + pinned posts + other-user tabs** — Profile completeness basics
