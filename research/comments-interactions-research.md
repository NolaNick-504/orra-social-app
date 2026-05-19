# Comments, Polls & Social Interactions — Cross-Platform Research Report

**Date:** March 2026  
**Platforms Studied:** Reddit, Twitter/X, Instagram, YouTube, Telegram  
**Purpose:** Benchmark ORRA against industry leaders and identify gaps/opportunities

---

## 1. REDDIT

### COMMENTS

| Feature | Implementation |
|---|---|
| **Comment Section UX** | Deeply threaded/nested tree structure. Comments are collapsible at any depth. Each thread is a conversation tree. Top-level comments shown first; replies indented with connecting lines. |
| **Comment Input** | Appears at top of thread for new comments, or inline below a specific comment for replies. Auto-focuses the input when "Reply" is tapped. Character limit: 10,000 chars. Supports Markdown (bold, italic, links, lists, code, blockquotes). |
| **Reply Threading** | Unlimited nesting depth. After ~3–4 levels, deep threads auto-collapse with "Continue this thread" link that opens a new focused view. Each reply is indented with a vertical line for visual hierarchy. |
| **Comment Actions** | Upvote, Downvote, Reply, Share, Award (Gold/Silver/Helpful/etc.), Report, Save, Follow post, Edit (own), Delete (own). Long-press on mobile reveals action sheet. |
| **Comment Sorting** | **Top** (default, based on upvote ratio + recency), **New**, **Controversial** (high upvote+downvote activity), **Old**, **Q&A** (in AMAs), **Best** (Reddit's algorithm weighing early votes). Sort picker at top of comment section. |
| **Pinned Comments** | "Stickied" comments — mod-pinned comments appear at top of thread with a green pin icon. Only mods can sticky. Max 2 stickied per post. |
| **Comment Likes/Votes** | Upvote/downvote arrows. Score displayed as net total (upvotes minus downvotes). Score may be fuzzied/hidden for anti-spam on new comments. Individual up/down counts visible via some third-party tools but not natively. |
| **Keyboard Behavior** | Tapping "Reply" on a specific comment auto-focuses a reply input below that comment with keyboard up. Tapping the main comment area at top opens a new top-level comment input. |
| **Mentions/Tags** | `u/username` mentions autocomplete. Mentioned users get a notification. Subreddit mentions `r/subreddit` also work. |
| **Media in Comments** | Images (via Reddit's image host), GIFs (via Gfycat/Tenor integration), videos, and rich media embeds. Previously text-only; media support added progressively. |
| **Comment Moderation** | AutoMod (automated moderation bot), keyword filtering, shadow-removal (comment appears to poster but hidden from others), spam detection, content policy enforcement. Mods can lock threads, remove comments, ban users. |

### POLLS

| Feature | Implementation |
|---|---|
| **Poll Creation** | Available as a post type. Question + 2–6 options. No anonymity (votes are public). Cannot add images to poll options. |
| **Poll Voting** | Single choice only. Cannot change vote after submitting. Results visible immediately after voting (or if you created the poll). |
| **Poll Results Display** | Percentage bars with vote counts per option. Color-coded leading option. Total vote count shown. |
| **Poll Duration** | 1 day, 2 days, 3 days, 4 days, 5 days, 6 days, or 1 week. |
| **Poll in Comments** | Polls are post-level only. Cannot embed polls in comments. |

### SOCIAL INTERACTIONS

| Feature | Implementation |
|---|---|
| **Like/Heart** | Upvote (orange up arrow) / Downvote (blue down arrow). Toggle behavior — click again to undo. No "heart" animation. Count shown as net score. |
| **Repost/Share** | **Crosspost** to another subreddit (with attribution). Share button opens system share sheet (copy link, share to apps, share to Reddit chat). No "repost to own profile" concept. |
| **Save/Bookmark** | Save button (bookmark icon). Saved items accessible from profile > Saved. Can save individual comments too. No folders/collections natively. Private by default. |
| **Share Sheet** | Copy link, Share to Reddit Chat, Share to other apps (system share sheet). Crosspost option within Reddit. |
| **Double-tap to Like** | **Not supported** on Reddit mobile. Must tap the upvote arrow. |

---

## 2. TWITTER/X

### COMMENTS

| Feature | Implementation |
|---|---|
| **Comment Section UX** | Flat chronological list for "Latest" replies, or algorithmic for "Most relevant." Threaded: replies to a specific tweet are grouped. "Show more replies" for hidden/guest replies. Quote tweets shown separately. |
| **Comment Input** | "Post your reply" input at top. 280 char limit for standard users, 25,000 for Premium. Supports text, images (up to 4), GIFs, videos, polls in replies. Auto-focus when reply button tapped. |
| **Reply Threading** | 1 level of visible nesting. A reply to a reply shows with a connecting line. After 1 level, further replies flatten into the main conversation. "Show this thread" opens full thread view. |
| **Comment Actions** | Like, Reply, Repost/Quote, Share, View analytics (own), Delete, Pin to profile (own). Bookmark. Report. |
| **Comment Sorting** | **Most relevant** (default, algorithmic — factors in engagement, relationship, verification), **Latest** (chronological). Toggle at top of replies. |
| **Pinned Comments** | Authors can pin a reply to the top of their own tweet's replies. Shown with "Pinned" label. Only 1 pinned reply per tweet. |
| **Comment Likes/Votes** | Heart/like count displayed. No dislike. Only total like count visible (not who liked, unless you click in). |
| **Keyboard Behavior** | Tapping "Reply" icon auto-focuses the reply composer with keyboard. Tapping the main reply area at top also activates. On mobile web, the composer slides up from bottom. |
| **Mentions/Tags** | `@handle` mentions with autocomplete. Mentioned users get notification. Can mention multiple users. |
| **Media in Comments** | Images (up to 4), GIFs (via Tenor), videos, polls. All supported in replies. |
| **Comment Moderation** | Community Notes (crowdsourced fact-checking). Authors can limit who can reply (Everyone, People you follow, People you mention). Hidden replies (author can hide specific replies). Report system. Spam filtering. |

### POLLS

| Feature | Implementation |
|---|---|
| **Poll Creation** | Compose a tweet + poll. 2–4 options. Max 25 chars per option. Not anonymous (your vote is visible to the poll creator). |
| **Poll Voting** | Single choice only. Cannot change vote. Results hidden until you vote (or if poll expires). |
| **Poll Results Display** | Animated percentage bars. Leading option highlighted. Total votes shown. Countdown timer to expiry. |
| **Poll Duration** | 5 min, 30 min, 1 hour, 6 hours, 12 hours, 1 day, 2 days, 3 days, 7 days. |
| **Poll in Comments** | Polls can be embedded in tweet replies (since 2024). Previously post-level only. |

### SOCIAL INTERACTIONS

| Feature | Implementation |
|---|---|
| **Like/Heart** | Heart icon, toggles on/off. Red fill when liked. Micro-animation (heart pulse). Count shown. Liker list viewable. |
| **Repost/Retweet/Share** | **Repost** (direct, no comment) or **Quote** (repost + your comment). Both show on your profile. Repost count displayed. Undo available. |
| **Save/Bookmark** | Bookmark icon (since 2018). Bookmarks are private. Bookmark folders/collections added in 2023 — users can organize into named folders. Accessible from sidebar. |
| **Share Sheet** | Copy link, Share via DM, Share to other apps (system sheet). Bookmark from share menu too. |
| **Double-tap to Like** | **Supported** on mobile app. Double-tap on tweet = like. Haptic feedback. Heart animation burst. |

---

## 3. INSTAGRAM

### COMMENTS

| Feature | Implementation |
|---|---|
| **Comment Section UX** | Flat chronological list. Replies shown indented directly under the parent comment (1 level only). "View all X comments" to expand. Comments hidden behind a threshold on popular posts. |
| **Comment Input** | "Add a comment..." at bottom. No character limit enforced visibly. Supports text + emoji. No rich text. @mentions and #hashtags. Auto-focus when comment field tapped. |
| **Reply Threading** | 1 level of nesting only. Reply to a comment shows as indented below it. No further nesting — replies to replies still appear under the original parent comment. "View replies (X)" to expand collapsed reply threads. |
| **Comment Actions** | Like (heart), Reply, Share, Report. No edit comments. Delete own comments. Pin comment (creators). Restrict/block users. |
| **Comment Sorting** | Default: "Top comments" (algorithmic — based on likes, replies, follower relationship). Can switch to "Newest" on some views. No explicit sort picker on mobile. |
| **Pinned Comments** | Creators can pin up to 3 comments. Shown at top with pin icon and "Pinned by [creator]" label. Very prominent for setting conversation tone. |
| **Comment Likes/Votes** | Heart/like per comment. Like count shown (small number under comment). No dislike. No upvote/downvote. |
| **Keyboard Behavior** | Tapping comment input field activates keyboard. Tapping "Reply" on a specific comment activates keyboard with `@username` pre-filled. Keyboard auto-pops up in both cases. |
| **Mentions/Tags** | `@username` mentions with autocomplete. Notification sent. Can mention in both posts and comments. |
| **Media in Comments** | **No** — Instagram comments are text-only (with emoji). No images, GIFs, or videos in comments. (This is a notable limitation.) |
| **Comment Moderation** | Comment filters (manual keyword filter, hide offensive comments AI filter). Restrict mode (comments from restricted users only visible to them). Bulk delete/manage comments. Turn off comments entirely on a post. Hidden comments feature (creator can hide specific comments). |

### POLLS

| Feature | Implementation |
|---|---|
| **Poll Creation** | **Stories only** (2-option polls on stories). Cannot create polls in feed posts natively. Some third-party workarounds via ads. Instagram tested feed polls but limited rollout. |
| **Poll Voting** | Single choice. Vote by tapping an option. Results visible immediately after voting in stories. |
| **Poll Results Display** | Percentage bars with vote count. Animated. Story poll results visible to creator via story insights. |
| **Poll Duration** | Tied to story duration (24 hours). |
| **Poll in Comments** | Not supported. |

### SOCIAL INTERACTIONS

| Feature | Implementation |
|---|---|
| **Like/Heart** | Heart icon. Toggle on/off. Red fill when liked. Count hidden for posts (only "Liked by X and others"), visible for comments. |
| **Repost/Share** | **Share to Story** (reshare post to your story with sticker), **Share via DM** (send as message), **Share to** other apps. No "repost to feed" feature. |
| **Save/Bookmark** | Bookmark icon. Saved items in "Saved" section. Can organize into **Collections** (named folders). Private. |
| **Share Sheet** | Share to Story, Share via DM, Copy Link, Share to other apps. |
| **Double-tap to Like** | **Yes** — iconic Instagram feature. Double-tap on image/video = like. Large heart animation in center of screen. Haptic feedback. |

---

## 4. YOUTUBE

### COMMENTS

| Feature | Implementation |
|---|---|
| **Comment Section UX** | Located below video. Threaded structure with 1 level of visible nesting. Top comments (algorithmic) shown by default. Pinned comment at top if exists. "X replies" to expand. Comments section can be hidden by creators. |
| **Comment Input** | "Add a comment..." field. 10,000 char limit. Supports basic text formatting (bold, italic, strikethrough via markdown-like syntax). Auto-focus when field tapped. |
| **Reply Threading** | 1 level visible. "View X replies" expandable button under each comment. Replies are indented under the parent. No further nesting — replies to replies are still shown at the same level under the parent. |
| **Comment Actions** | Like (thumbs up), Dislike (thumbs down), Reply, Share, Report. Edit own comments. Delete own comments. |
| **Comment Sorting** | **Top comments** (default, algorithmic based on likes, replies, recency), **Newest first** (chronological). Sort toggle at top. |
| **Pinned Comments** | Creators can pin 1 comment. Shown at very top with "Pinned by [channel]" label and pin icon. Highly visible. Used for context, links, or conversation starters. |
| **Comment Likes/Votes** | Thumbs up / Thumbs down. Only like count displayed publicly (dislike count hidden). Thumbs up count shown as number. |
| **Keyboard Behavior** | Tapping comment input activates keyboard. Tapping "Reply" on a specific comment activates reply input with `@username` prefix. Both auto-focus with keyboard. |
| **Mentions/Tags** | `@channelname` mentions with autocomplete. Notification sent to mentioned channel. |
| **Media in Comments** | **No** — YouTube comments are text-only. No images, GIFs, or videos. Links are shown but not embedded. Emojis supported. |
| **Comment Moderation** | Robust: Hold potentially inappropriate comments for review, blocked words list, auto-approve subscribers, comment moderation AI, hide user from channel. Heart by creator (shown with heart icon). Creator can respond with a "Creator Heart" on comments. |

### POLLS

| Feature | Implementation |
|---|---|
| **Poll Creation** | Available in **Community tab** (for channels with 500+ subscribers). Question + 2–5 options. Option text only (no images in options). |
| **Poll Voting** | Single choice. Cannot change vote. Results shown after voting. |
| **Poll Results Display** | Percentage bars with vote count per option. Total votes shown. |
| **Poll Duration** | No explicit duration — polls remain open until creator deletes or indefinitely. |
| **Poll in Comments** | Not supported. Polls are Community tab posts only. |

### SOCIAL INTERACTIONS

| Feature | Implementation |
|---|---|
| **Like/Heart** | Thumbs up icon. Toggle on/off. Count shown. Animated micro-pulse. |
| **Repost/Share** | **Share** button opens share sheet. No native "repost to own channel." Can share to other platforms, embed, copy link. |
| **Save/Bookmark** | **Watch Later** (for videos), **Save to playlist** (for videos). No general "bookmark" for comments or community posts. Playlists act as folders. |
| **Share Sheet** | Copy link, Embed, Share via email, Share to WhatsApp/X/Facebook/etc., Share via Bluetooth/nearby share. |
| **Double-tap to Like** | **Yes** — double-tap on video = like. Heart animation in center. Also used for 10-second rewind/forward (left/right half). |

---

## 5. TELEGRAM

### COMMENTS

| Feature | Implementation |
|---|---|
| **Comment Section UX** | Available in **Channels** (when discussion group is linked). Comments appear in a threaded discussion group associated with the channel. Also in **Groups** where replies are native. Comments are essentially messages in the linked group. |
| **Comment Input** | Standard message input field. No character limit (effectively unlimited). Supports rich text, mentions, media of all types. Auto-focus on tap. |
| **Reply Threading** | Deeply threaded in groups. Reply to a specific message with visible "Reply to [user]" header. In channel comments, each post gets its own thread in the linked group. Threads can be deeply nested. |
| **Comment Actions** | React (emoji reactions), Reply, Forward, Share, Copy, Report, Delete (own + admin), Pin. Edit own messages. |
| **Comment Sorting** | Chronological only (newest at bottom, like chat). No algorithmic sorting. |
| **Pinned Comments** | Admins can pin messages in groups/channels. Pinned message shown at top with pin icon. Can have 1 pinned message at a time (or multiple in forums). |
| **Comment Likes/Votes** | **Emoji reactions** (thumbs up, heart, fire, etc.). Reaction count per emoji shown. Multiple users can react with different emojis. This replaces simple likes. |
| **Keyboard Behavior** | Tapping input field activates keyboard immediately (it's a chat input). Tapping "Reply" on a message opens input with "Reply to [user]" header and keyboard. |
| **Mentions/Tags** | `@username` mentions with autocomplete. Inline mention linking. Also supports `@channel` mentions. |
| **Media in Comments** | **Full support** — images, videos, GIFs, stickers, voice messages, files, polls, contacts, location. Most media-rich comment system of all platforms. |
| **Comment Moderation** | Admin controls: delete messages, ban/kick users, slow mode (rate limiting), read-only mode, keyword filters via bots, anti-spam bot, restricted permissions per user. |

### POLLS

| Feature | Implementation |
|---|---|
| **Poll Creation** | Available as a message type in any chat/group/channel. Question + up to 10 options. **Anonymous** or **Public** (visible votes) toggle. **Quiz mode** (one correct answer). |
| **Poll Voting** | Single choice (regular poll) or single choice with correct answer (quiz). Cannot change vote in regular polls, can in some quiz modes. |
| **Poll Results Display** | Percentage bars with vote counts. In public polls, you can see who voted for what. Animated bar growth. |
| **Poll Duration** | No fixed duration. Polls stay open indefinitely unless deleted. No auto-expiry. |
| **Poll in Comments** | Yes — polls can be sent in any chat, including comment threads in linked discussion groups. |

### SOCIAL INTERACTIONS

| Feature | Implementation |
|---|---|
| **Like/Heart** | **Emoji reactions** — tap to react with a specific emoji (👍 ❤️ 🔥 🎉 😢 etc.). Multiple people can react. Each emoji shows count. No single "like" — it's reaction-based. |
| **Repost/Share** | **Forward** to another chat/group/channel. Can forward with or without quoting. "Forwarded from [channel]" attribution shown. Can also share externally via system share sheet. |
| **Save/Bookmark** | **Saved Messages** — forward any message to your own "Saved Messages" chat. Acts as personal bookmark. No folders natively (but can use chat folders). Private. |
| **Share Sheet** | Forward to chat, Copy text, Share externally (system sheet), Copy link (for public channels). |
| **Double-tap to Like** | **No** — double-tap on Telegram is not a like gesture. Reactions must be explicitly tapped from the reaction picker. Some custom clients add this. |

---

## ORRA CURRENT IMPLEMENTATION — CODE ANALYSIS

### Comments (from `comment-section.tsx`, `api/comments/route.ts`)

| Feature | ORRA Status | Details |
|---|---|---|
| Display | Flat list, sorted ascending (oldest first) | `mergedComments.sort((a, b) => a.createdAt - b.createdAt)` |
| Input | Single-line `<input>` with `readOnly` + `inputMode="none"` workaround | Prevents auto-keyboard-popup bug |
| Threading | **NONE** — all comments flat | `Comment` model has no `parentId` field |
| Actions | Post comment, View user profile | No like/reply/report/edit/delete on comments |
| Sorting | **NONE** — chronological ascending only | No sort picker |
| Pinned | **NOT SUPPORTED** | No schema field, no UI |
| Likes on comments | **NOT SUPPORTED** | `Like` model supports `targetType: "comment"` in schema, but API route only handles post/reel/danceEntry/hubPost. No UI. |
| Keyboard | Workaround: `readOnly` + `inputMode="none"` + overlay button | Tapping overlay → `activateInput()` → double rAF → `focus()`. Prevents unwanted auto-popup. |
| Mentions | **NOT SUPPORTED** | No `@` autocomplete, no mention parsing |
| Media in comments | **NOT SUPPORTED** | Single-line text input only |
| Moderation | **NOT SUPPORTED** | No keyword filter, no hidden comments, no report |

### Polls (from `create-post-modal.tsx`, `api/polls/`)

| Feature | ORRA Status | Details |
|---|---|---|
| Creation | 2–6 options, 3 duration choices (24h/48h/7d) | Poll is a Post subtype |
| Voting | One vote per option (can vote multiple options) | `@@unique([userId, optionId])` allows voting each option once |
| Results | Percentage bars + vote count + checkmark on voted option | Shown after voting |
| Duration | 24h, 48h, 7d | `pollDurations` array |
| In comments | **NOT SUPPORTED** | Polls are post-level only |

### Social Interactions (from `pulse-feed.tsx`, `share-modal.tsx`, `aura-store.ts`)

| Feature | ORRA Status | Details |
|---|---|---|
| Like | Heart toggle, animation burst, reaction orbs | +1 ORRA +2 XP first time only |
| Echo (Repost) | Toggle repost, ripple animation | +2 ORRA +3 XP first time. No quote echo. |
| Save/Bookmark | Bookmark toggle | No collections/folders. Flat save list. |
| Share | Copy Link, Echo (amplify), Share via DM | 3 options in modal |
| Double-tap to Like | **NOT IMPLEMENTED** | No double-tap gesture on posts |

---

## CRITICAL ANALYSIS

### What ORRA is Doing RIGHT ✅

1. **Gamification with ORRA tokens + XP** — Unique differentiator. No other platform rewards engagement with a currency system. The anti-farming dedup via `TokenAction` model is smart.

2. **Reaction Orbs** — The floating energy orbs animation on like is a delightful micro-interaction that no competitor has. It's on-brand with the "aura" theme.

3. **Echo (Repost) branding** — Clever rebranding of "repost" to "Echo" fits the ORRA brand. The ripple animation is satisfying.

4. **Optimistic UI with real API sync** — Comments, likes, reposts all update instantly locally then sync to API. This is the correct pattern for responsive social apps.

5. **Poll voting UX** — The percentage bar animation, checkmark on voted option, and token reward for voting are all well-executed.

6. **Mood Wave Bar / Vibe filtering** — Entirely unique to ORRA. No competitor has real-time community mood visualization.

7. **Keyboard auto-popup workaround** — The `readOnly`/`inputMode="none"` + overlay button approach is a reasonable fix for the unwanted keyboard popup on mobile. It prevents the jarring experience of the keyboard appearing when just opening a comment section.

8. **AuraGlowAvatar** — Dynamic glow rings based on level is a great visual status indicator, unique to ORRA.

### What ORRA is MISSING or Could Improve ❌

#### PRIORITY 1 — Critical Gaps (Must Have)

1. **COMMENT THREADING / REPLIES** — The single biggest gap. ORRA has flat comments with no reply threading. Every competitor supports at least 1 level of nesting. Users expect to reply to specific comments, not just add top-level comments. This makes conversations impossible to follow.

   **What to do:** Add `parentId` to `Comment` model. Support 1 level of nesting (Instagram-style) as MVP. Show "Reply" button per comment. Pre-fill `@username` when replying.

2. **COMMENT ACTIONS (Like, Delete, Edit, Report)** — Currently you can only post a comment. No way to like a comment, edit your own, delete your own, or report others. The `Like` model already supports `targetType: "comment"` in the schema but it's not wired up.

   **What to do:** Add like button to each comment (the API already partially supports it). Add edit/delete for own comments. Add report button.

3. **DOUBLE-TAP TO LIKE** — Instagram and YouTube both support this. It's an expected gesture on mobile social apps. ORRA doesn't have it.

   **What to do:** Add `onDoubleClick` handler on post content area. Trigger like with heart animation burst.

4. **@MENTIONS IN COMMENTS** — Every competitor supports this. No mention parsing, no autocomplete, no notification for mentioned users.

   **What to do:** Parse `@username` in comment text. Add autocomplete dropdown. Send notification to mentioned user.

#### PRIORITY 2 — Important Enhancements (Should Have)

5. **COMMENT SORTING** — No sort options exist. Users can't view newest or most popular comments first.

   **What to do:** Add sort picker (Top/Newest). Default to "Top" (most liked). Store sort preference.

6. **PINNED COMMENTS** — Creators can't pin comments. YouTube, Instagram, and Reddit all support this.

   **What to do:** Add `isPinned` boolean to `Comment` model. Allow post author to pin one comment. Show pinned comment at top with pin icon.

7. **QUOTE ECHO** — Current Echo is a direct repost with no comment. Twitter/X's Quote Tweet is one of its most popular features. Users want to add their take when resharing.

   **What to do:** Add optional text field to Echo/Repost. Store as a new post type or add `quoteText` to Repost model.

8. **SAVE COLLECTIONS** — Currently a flat bookmark list. Instagram and Twitter both support named folders for saved items.

   **What to do:** Add `Collection` model with `name` and `saveIds`. Add collection picker when saving. Show collections in Saved view.

9. **SHARE SHEET EXPANSION** — Current share modal has 3 options. Competitors offer more: share to specific platforms, share externally, share to specific users.

   **What to do:** Add "Share to WhatsApp/X/etc." options. Add system share sheet option. Add "Share to user" (pick from following list).

#### PRIORITY 3 — Nice to Have

10. **MEDIA IN COMMENTS** — Only Telegram supports this well. Instagram and YouTube are text-only. This would be a differentiator for ORRA.

    **What to do:** Add image upload to comment input. Use the existing upload infrastructure. Store as comment attachment.

11. **GIF IN COMMENTS** — Twitter supports GIF replies. Popular with younger demographics.

    **What to do:** Integrate Tenor/GIPHY API for GIF picker in comment input.

12. **POLL IN COMMENTS** — Only Telegram supports this. Would be a unique feature.

    **What to do:** Allow creating mini-polls as comment attachments (2–3 options, shorter duration).

13. **COMMENT MODERATION** — No keyword filtering, no hidden comments, no auto-mod. Essential as platform scales.

    **What to do:** Add hidden comments, keyword filter settings, report flow, and basic auto-mod (profanity filter).

14. **EMOJI REACTIONS ON COMMENTS** — Telegram's reaction system is more expressive than simple likes. Could align with ORRA's "vibe" system.

    **What to do:** Add vibe-based reactions (🔥 😂 😌 ✨ 🧠) that align with existing vibe tags.

15. **EDIT COMMENTS** — Reddit and Telegram support editing. Twitter (Premium only). YouTube supports it.

    **What to do:** Add edit button on own comments. Store `updatedAt` timestamp.

### Bugs / UX Issues to Fix 🔧

1. **Keyboard auto-popup behavior** — The current workaround (`readOnly` + `inputMode="none"`) works but is hacky. The real issue is that the comment section opens inline within the feed, and the input being in the DOM causes iOS/Android to auto-focus it. A better approach: 
   - Use a **bottom sheet/drawer** for the comment section (like Instagram/Twitter) instead of inline expansion
   - This naturally prevents keyboard issues because the input isn't in the DOM until the user explicitly activates it
   - The drawer approach also gives more screen real estate for comments

2. **Single-line input** — Comment input is `<input type="text">` which is single-line. Should be `<textarea>` for multi-line comments. All competitors support multi-line.

3. **No comment character limit** — No validation on comment length. Could lead to abuse. Consider a limit (e.g., 1000 chars).

4. **Poll "Ends" time display bug** — The `timeAgo()` function is used for poll expiry, but `timeAgo("2026-03-06T...")` would show something like "Ends 7d" which is confusing. Should show a proper countdown or exact date.

5. **Poll voting allows multiple options** — The current implementation allows voting for each option once (one-vote-per-option). This means a user can vote for ALL options, which defeats the purpose of a poll. Should be: vote for ONE option only (like all competitors except Telegram quiz mode).

6. **Echo doesn't have quote text** — The `Repost` model has no text/comment field. When you echo, there's no way to add your thoughts. This makes echoes much less engaging than quote tweets.

7. **No comment count update after adding** — When a new comment is added locally, the comment count in the post header doesn't update until the posts query is invalidated. Should increment locally.

8. **Comments API sorts `desc` but UI sorts `asc`** — The API returns comments in `desc` order (`orderBy: { createdAt: "desc" }`), but the frontend re-sorts them `asc`. This is inconsistent and wastes the API sort. Should align both to the same order.

### Specific Actionable Recommendations (Priority Ordered)

| # | Action | Priority | Effort | Impact |
|---|---|---|---|---|
| 1 | Add `parentId` to Comment model + 1-level reply threading UI | P1 | M | 🔴 Critical — basic social feature |
| 2 | Add Like/Reply buttons per comment + wire up comment likes API | P1 | S | 🔴 Critical — engagement driver |
| 3 | Fix poll voting to single-choice (one option per user per poll) | P1 | S | 🔴 Bug — polls are broken |
| 4 | Add double-tap to like on post content | P1 | S | 🟡 High — expected gesture |
| 5 | Add `@mention` parsing + autocomplete in comments | P1 | M | 🔴 Critical — social connectivity |
| 6 | Change comment input from `<input>` to `<textarea>` | P1 | S | 🟡 High — multi-line support |
| 7 | Move comment section to bottom sheet/drawer pattern | P2 | M | 🟡 High — fixes keyboard UX properly |
| 8 | Add comment sorting (Top/Newest) | P2 | S | 🟢 Medium — content quality |
| 9 | Add pinned comments (isPinned field + UI) | P2 | S | 🟢 Medium — creator tool |
| 10 | Add quote echo (text field on repost) | P2 | M | 🟡 High — engagement multiplier |
| 11 | Add save collections/folders | P2 | M | 🟢 Medium — content organization |
| 12 | Expand share sheet (external platforms) | P2 | S | 🟢 Medium — viral growth |
| 13 | Add edit/delete own comments | P2 | S | 🟢 Medium — user control |
| 14 | Add comment moderation (keyword filter, hidden, report) | P3 | M | 🟢 Medium — platform safety |
| 15 | Add image/GIF in comments | P3 | M | 🟢 Medium — differentiator |
| 16 | Add emoji/vibe reactions on comments | P3 | M | 🟢 Nice — expressiveness |
| 17 | Add comment character limit + counter | P3 | S | 🟢 Nice — abuse prevention |

---

## Feature Matrix Comparison

| Feature | Reddit | Twitter/X | Instagram | YouTube | Telegram | ORRA |
|---|---|---|---|---|---|---|
| **Threaded Comments** | Deep tree | 1-level | 1-level | 1-level | Deep | ❌ Flat |
| **Comment Likes** | Up/downvote | Like | Like | Like/Dislike | Reactions | ❌ |
| **Comment Replies** | Full tree | 1-level | 1-level | 1-level | Full tree | ❌ |
| **Pinned Comments** | Sticky (mod) | Pin (author) | Pin (3 max) | Pin (1) | Pin (admin) | ❌ |
| **Comment Sorting** | 5 options | 2 options | 2 (implicit) | 2 options | Chrono only | ❌ |
| **Media in Comments** | Img/GIF/Vid | Img/GIF/Vid/Poll | Text only | Text only | Full media | ❌ |
| **@Mentions** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Comment Moderation** | AutoMod | Hide/limit | Filter/Restrict | Hold/AI | Bots/Slow mode | ❌ |
| **Polls** | Post-level | In tweets & replies | Stories only | Community tab | Anywhere | Post-level |
| **Poll Options** | 2–6 | 2–4 | 2 | 2–5 | 2–10 | 2–6 |
| **Poll Voting** | Single | Single | Single | Single | Single/Quiz | ❌ Multi-option bug |
| **Double-tap Like** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Quote Repost** | ❌ Crosspost | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Save Collections** | ❌ | ✅ Folders | ✅ Collections | Playlists | Chat folders | ❌ |
| **Reaction System** | Up/downvote | Like | Like | Like/Dislike | Emoji reactions | Like only |
| **Token Rewards** | ❌ Awards(cost) | ❌ | ❌ | ❌ | ❌ | ✅ ORRA+XP |
| **Vibe/Mood System** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Unique |
| **Level System** | Karma | ❌ | ❌ | ❌ | ❌ | ✅ Aura Level |

---

*Report compiled from platform analysis and ORRA codebase review. Web search was attempted but API was rate-limited; findings are based on expert knowledge of current platform implementations (as of early 2026).*
