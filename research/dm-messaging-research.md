# DM & Messaging Research Report

## Comparative Analysis: WhatsApp, Telegram, Discord, Instagram DMs, Signal vs ORRA

---

## 1. WHATSAPP

### 1.1 Chat List UX
- **Layout**: Vertical scrollable list with each row showing: circular avatar (48dp), contact name (bold), last message preview (1 line, gray), timestamp (top-right), unread badge (green circle with count), pinned indicator (pin icon)
- **Unread badge**: Small green circle with white number; positioned top-right of the row
- **Pinned chats**: Up to 3 chats can be pinned to top; shown with a pin icon; pinned chats stay above unpinned ones
- **Archived chats**: Separate "Archived" folder at top that auto-hides when empty
- **Swipe actions**: Swipe right to pin/archive; swipe left to archive
- **Timestamp formatting**: "Yesterday", date, or time (e.g., "2:30 PM")
- **Last message preview**: Shows "📷 Photo", "🎤 Voice message", "📍 Location" for non-text types
- **Online indicator**: Green dot on avatar when user is currently online

### 1.2 Message Types
- Text, images, videos, voice messages, documents/files, contacts, location (live + static), polls, stickers, GIFs (via Giphy), video messages (instant video notes), events, channels forwards
- **Voice messages**: Record by holding mic button; can be previewed before sending; waveform visualization; 2x playback speed; continuation from where paused
- **Camera integration**: In-app camera for photos/videos with filters

### 1.3 Message Bubbles
- **Sent**: Right-aligned, light green (#DCF8C6) background, rounded with tail on bottom-right
- **Received**: Left-aligned, white background, rounded with tail on bottom-left
- **Timestamps**: Small gray text below message bubble, shown only for last message in a group; long-press to see exact time
- **Read receipts (✓✓)**: Single gray ✓ = sent, double gray ✓✓ = delivered, double blue ✓✓ = read
- **Grouping**: Consecutive messages from same sender are grouped with only the last showing timestamp
- **Date separators**: "TODAY", "YESTERDAY", or date shown between message groups

### 1.4 Typing Indicators
- Shows "typing..." below contact name in chat list and in chat header
- Animated dots inside the chat thread above the message input area
- Only visible when both users have read receipts enabled

### 1.5 Online/Last Seen
- Shows "online" or "last seen today at 2:30 PM" in chat header
- Users can hide last seen via Settings > Privacy > Last Seen (options: Everyone, My Contacts, Nobody)
- Even when hidden, "online" status is still shown when the user is currently active
- New privacy option: "My Contacts Except..." to exclude specific contacts

### 1.6 Message Reactions
- Long-press a message → 6 emoji reaction bar appears (👍❤️😂😮😢🙏) plus a "+" for full emoji picker
- Reactions shown as small emoji below the message bubble with count
- Multiple people's reactions are aggregated (e.g., "❤️ 3")
- Tap existing reaction to add your own; long-press reaction to see who reacted
- Reacting sends a notification to the message sender

### 1.7 Reply/Quote
- Swipe right on a message to reply/quote it
- Quoted message shown as a compact card above the reply with original sender's name and text preview
- Tapping the quoted card scrolls to the original message
- Works in group chats and 1:1 chats

### 1.8 Search Messages
- Search icon in chat list header → searches across all conversations
- Search icon within a specific chat → searches within that chat only
- Results highlight matching text; can tap to navigate to the message
- Can filter by media type (photos, videos, links, documents, etc.)

### 1.9 Media Gallery
- Tap contact name in chat header → "Media, Links, and Docs" section
- Grid view of all shared media, sortable by type (Media, Links, Docs)
- Can star messages for quick reference
- Storage usage breakdown per chat

### 1.10 Group Chats
- Up to 1024 members per group
- Admin roles: Add/remove members, change group info, restrict who can send messages
- Mention specific users with @name (triggers notification for that user)
- Group description, icon, and disappearing messages setting
- "Only Admins Can Send Messages" mode for announcement groups
- Community feature: Multiple groups under one umbrella

### 1.11 Voice/Video Calls
- Integrated directly; tap phone/video icon in chat header
- Supports 1:1 and group calls (up to 32 participants)
- End-to-end encrypted calls
- Picture-in-picture mode during calls
- Screen sharing in video calls

### 1.12 Message Deletion
- "Delete for Me" (removes from your device only)
- "Delete for Everyone" (removes from both sides, within ~2 days of sending)
- "Keep in Chat" option when deleting from "view once" media
- Deleted messages show "This message was deleted" placeholder

### 1.13 Encryption
- End-to-end encryption by default for all messages, calls, and status
- Lock icon in chat header with "Messages and calls are end-to-end encrypted"
- Security code verification: Scan QR code or compare 60-digit number
- No option to disable encryption

### 1.14 Notification Handling
- Push notifications with sender name and message preview
- Can customize per-chat: show/hide message preview, notification tone, vibration
- Badge count on app icon
- "Custom notifications" per contact/chat
- Notification for reactions, mentions, and forwarded messages
- "Mention only" notification mode for groups

### 1.15 New Chat Creation
- Tap "New chat" floating button (bottom-right)
- Shows: "New group", "New community", contact list (sorted by frequency), "New contact"
- Search by name or phone number at top
- No need to know user IDs; phone number-based discovery

---

## 2. TELEGRAM

### 2.1 Chat List UX
- **Layout**: Similar to WhatsApp but more feature-rich; avatar, name, last message, timestamp, unread badge, pinned indicator, folder tabs
- **Chat folders**: User-created tabs (e.g., "Work", "Personal", "Bots") with custom icons
- **Unread badge**: Round with number (for muted chats, it's a gray badge without number)
- **Pinned chats**: Multiple chats can be pinned; shows pin icon
- **Archive**: Swipe left to archive; archived folder at top
- **Story rings**: Circular stories ring around avatar (like Instagram)
- **Online indicator**: Blue dot on avatar for online users

### 2.2 Message Types
- Everything WhatsApp has PLUS: animated emoji, custom animated stickers, custom sticker packs, video messages (round), voice messages (with waveform), files up to 2GB each, location, contacts, polls (visible/anonymous), quizzes, dice, scheduled messages, silent messages, no-media messages
- **Bot messages**: Rich formatting, inline keyboards, web apps

### 2.3 Message Bubbles
- **Sent**: Right-aligned, green/blue bubble with tail
- **Received**: Left-aligned, white/light bubble with tail
- **Customizable**: Multiple theme options; can change bubble color and shape
- **Timestamps**: Inside bubble on the right side; visible per message group
- **Read receipts**: Single ✓ = sent, double ✓✓ = read (no "delivered" state separate from read)
- **Message grouping**: Consecutive messages grouped; only last shows timestamp
- **Forwarded tag**: Forwarded messages show "Forwarded from [source]" header

### 2.4 Typing Indicators
- Shows "typing..." in chat list and chat header
- Also shows specific activity: "sending a photo", "recording a voice message", "choosing a sticker"
- Animated dots in chat thread

### 2.5 Online/Last Seen
- Shows "online" or "last seen recently/within a week/within a month/long time ago"
- Granular last seen (e.g., "last seen 2 hours ago") for mutual contacts
- Privacy settings: Everyone, My Contacts, Nobody
- "Premium" users can hide their online status while seeing others'
- Bots always show "bot" instead of last seen

### 2.6 Message Reactions
- Tap once on a message → reaction bar appears with available reactions
- Custom reaction sets per chat/group (Telegram Premium: custom animated reactions)
- Reactions shown below message with emoji + count
- Can see who reacted by tapping the reaction
- Available reactions can be restricted by group admins

### 2.7 Reply/Quote
- Swipe right on message to reply
- Quoted message shown as compact card with original sender name and text
- Can also reply to a specific part of text (select text → reply)
- Thread view in groups: tap reply to see full thread
- "Quote" feature: select specific text to quote in reply

### 2.8 Search Messages
- Global search from main screen (searches chats, messages, media, files)
- In-chat search with filters: date, sender, media type
- "Jump to date" feature: calendar picker to navigate to specific date
- Search results with context snippets

### 2.9 Media Gallery
- Tap chat header → "Shared Media" tab
- Categories: Media, Files, Links, Voice, Music, Animated (GIFs)
- Grid/list view toggle
- Can delete multiple items at once
- Profile photos history visible

### 2.10 Group Chats
- Up to 200,000 members in supergroups
- Admin roles: Owner, Admin (with granular permissions), Member
- @mention specific users; @all / @admin for group-wide mentions
- Topics/Forum mode: Threaded conversations within a group
- Slow mode: Rate-limit messages (e.g., 1 per 30 seconds)
- Anonymous admin posting
- Join via invite link, QR code, or direct add
- Voice chats (live audio rooms) in groups

### 2.11 Voice/Video Calls
- 1:1 and group voice/video calls
- Screen sharing
- Voice chats (live audio rooms) in groups
- End-to-end encrypted 1:1 calls (not group calls)
- Up to 1000 viewers for video calls

### 2.12 Message Deletion
- Delete for everyone with NO time limit (unlike WhatsApp's 2-day window)
- Can delete entire conversation for both sides
- "Auto-delete" feature: Messages auto-delete after 1 day, 1 week, 1 month, or custom
- No "message was deleted" placeholder for other user (truly invisible deletion)

### 2.13 Encryption
- Default: Client-server encryption (not E2E by default)
- Secret Chats: Optional E2E encrypted 1:1 chats (separate chat thread)
  - Device-specific (can't access on other devices)
  - Self-destruct timer available
  - Screenshot detection
- E2E encryption indicator: Lock icon in Secret Chat header
- No E2E encryption for group chats (by design)

### 2.14 Notification Handling
- Per-chat notification customization: sound, vibration, preview on/off
- "Preview" shows message content; can be disabled per chat
- Badge count on app icon ( customizable)
- "Priority" notifications for important chats
- "Default" vs "Priority" notification channels on Android
- Silent messages (no notification sent to recipient)
- "Notify about..." settings for groups (all messages, mentions only, off)

### 2.15 New Chat Creation
- Pencil icon (top-right on iOS, bottom-right on Android)
- Shows: contact list with search, "New Group", "New Channel", "New Secret Chat"
- Search by username (global @handle discovery) or name
- Username-based discovery (no phone number needed)
- Can message anyone with a public username

---

## 3. DISCORD

### 3.1 Chat List UX
- **Layout**: Sidebar with list of DM conversations; shows avatar, username, online status indicator, last message preview
- **Status indicators**: Colored dots on avatar — green (online), yellow (idle), red (Do Not Disturb), gray (offline), purple (streaming)
- **Unread badge**: White dot for unread (no count), or number badge for mentions
- **Pinned DMs**: Can't pin DMs, but can "close" them to hide from sidebar
- **Friends tab**: Separate "Friends" tab showing all friends with online status
- **Search**: Search bar at top of DM list filters by username
- **Activity feed**: Shows what friends are playing/listening to

### 3.2 Message Types
- Text (full Markdown support: **bold**, *italic*, `code`, ```code blocks```, > quotes), images, videos, files (up to 25MB free / 500MB Nitro), voice messages (mobile), embedded links with rich previews, stickers, GIFs, polls, slash commands, bot embeds
- **Embeds**: Rich cards for links, bot responses, video players
- **Thread support**: Create threads from any message

### 3.3 Message Bubbles
- **Cozy mode**: Avatar + username on left, message content, timestamp to the right of username; grouped messages from same sender within 7 minutes
- **Compact mode**: Single-line messages with timestamp on left (IRC-style)
- No "sent vs received" color distinction — all messages same style
- **Timestamps**: Shown next to username; hover for exact time; date separators between days
- **Read receipts**: NOT available (by design — privacy philosophy)
- **Edited indicator**: "(edited)" shown after edited messages

### 3.4 Typing Indicators
- Shows "Username is typing..." above message input
- Multiple typers: "User1, User2 are typing..."
- Animated indicator with user avatars in group DMs

### 3.5 Online/Last Seen
- Full status system: Online, Idle, Do Not Disturb, Invisible, Offline
- Custom status message (e.g., "Playing Minecraft", "In a meeting")
- Users can set "Invisible" to appear offline while still using the app
- No "last seen" timestamp shown (privacy)
- Activity status: Shows game being played, Spotify song, etc.

### 3.6 Message Reactions
- Hover message → click emoji icon → add reaction from full picker or recent/defaults
- Default quick reactions: 👍 😄 ❓ 🎉 ❤️ 🚀 👀 💯
- Multiple people can react; shows count + who reacted on hover
- Custom emojis from servers available as reactions
- Reactions are visible in notification if enabled

### 3.7 Reply/Quote
- Hover message → click "Reply" arrow → creates threaded reply
- Reply shows as inline reference above the new message with "Replying to Username"
- Can click the reply reference to scroll to the original message
- Thread support: Create a full thread from any message (separate panel)
- Threads auto-archive after inactivity (1 hour, 24 hours, 3 days, 1 week)

### 3.8 Search Messages
- Powerful search with filters: from:, has:, before:, after:, in:, mentions:
- Search accessible from top-right of every channel/DM
- Can search by file type, link, embed, sound, video
- Filter by date range
- Results with context snippets; click to jump to message

### 3.9 Media Gallery
- Click user/chat header → "Pinned Messages" view
- Search functionality doubles as media browser
- No dedicated media gallery per DM conversation (unlike WhatsApp/Telegram)
- Shared files searchable via search filters

### 3.10 Group Chats (Group DMs)
- Up to 10 members per group DM
- Group DM name and avatar can be customized
- Can add or remove members (any participant can add)
- No admin roles in group DMs (all participants equal)
- @mention works within group DMs
- For larger groups, Discord "Servers" are used instead

### 3.11 Voice/Video Calls
- Integrated; tap phone/video icon in DM header
- Group calls up to 10 people in DMs, unlimited in servers
- Screen sharing, Go Live streaming
- Voice channels (always-on audio rooms) in servers
- Background blur, noise suppression (Krisp), soundboard
- Video up to 1080p (4K with Nitro)

### 3.12 Message Deletion
- Delete for yourself only (hover → delete)
- No "delete for everyone" — message is removed from view for all
- Edited messages show "(edited)" but original content not visible to others
- Bulk delete available to admins in servers
- No time limit on deletion

### 3.13 Encryption
- NOT end-to-end encrypted by default
- Discord can read all messages (server-side moderation)
- No E2E encryption option at all
- Privacy philosophy: Platform relies on server-side trust and moderation tools

### 3.14 Notification Handling
- Per-server/per-DM notification settings: All messages, mentions only, none
- Push notifications with message preview (customizable)
- Badge count on app icon
- @mention notifications are always delivered (unless suppressed)
- "Do Not Disturb" mode suppresses all notifications
- Desktop notifications with sound
- Mobile: Notification priority per conversation

### 3.15 New Chat Creation
- Click "+" button in DM sidebar or click a friend's name
- Friends list: Shows all friends with online status
- Can search by Discord username (e.g., "username#1234" or new "@username" system)
- No phone number required; username-based discovery
- Group DM: Add multiple friends at once

---

## 4. INSTAGRAM DMs

### 4.1 Chat List UX
- **Layout**: Vertical list with avatar, username, last message preview, timestamp, unread indicator
- **Unread badge**: Blue dot (no count number) for unread conversations
- **Story ring**: Active story ring around avatar for users with current stories
- **General vs Primary inbox**: Two-tab inbox system (Primary = priority, General = others)
- **Message requests**: Separate "Requests" folder for non-following senders
- **Online indicator**: Green dot next to username for online users

### 4.2 Message Types
- Text, photos (camera + gallery), videos, voice messages, disappearing photos/videos (like Snap-style), posts/reels sharing, profiles sharing, stickers, GIFs, polls, emoji reactions
- **Shared posts/reels**: Card preview with image and caption that can be opened in-app
- **Vanish mode**: Swipe up for ephemeral messages (auto-delete when chat is closed)
- **Collaborative posts**: Joint post creation in DM

### 4.3 Message Bubbles
- **Sent**: Right-aligned, gradient purple/blue bubble, rounded with subtle tail
- **Received**: Left-aligned, dark gray bubble, rounded
- **Timestamps**: Not shown per message; pull left to reveal timestamps
- **Read receipts**: "Seen" text below last message with tiny avatar; no ✓✓ system
- **Reactions on bubbles**: Heart reaction on message (long-press for more)
- **Link previews**: Rich cards for shared URLs
- **Shared post cards**: Compact card with image + username + caption preview

### 4.4 Typing Indicators
- Shows "typing..." below username in chat list
- Animated dots in the chat thread above the input area
- Only visible for 1:1 conversations, not always in groups

### 4.5 Online/Last Seen
- Green dot next to username in DM list = online
- "Active X min ago" shown in chat header
- Activity status can be hidden in Settings
- When hidden, you also can't see others' activity status
- No "last seen" timestamp (only "Active recently/Active X hours ago")

### 4.6 Message Reactions
- Long-press a message → horizontal emoji strip: ❤️🔥👏😂😮😢
- Custom emoji picker accessible via "+" on the strip
- Reaction appears as small emoji below the message
- Can see who reacted by tapping the reaction
- Double-tap = quick ❤️ reaction (configurable default)

### 4.7 Reply/Quote
- Long-press message → "Reply" → shows quoted message above your reply
- Swipe right on message to quick-reply
- Quoted message shows sender name + preview text/image
- Tapping quoted reference scrolls to original message

### 4.8 Search Messages
- Search bar at top of DM list searches by username/conversation name
- In-chat search NOT available (major gap)
- Can search for shared posts/links in chat details
- No full-text message search within conversations

### 4.9 Media Gallery
- Tap chat header name → "Shared" tab
- Shows: Photos & Videos, Links in a grid
- Can search within shared media
- No files section (Instagram doesn't support file sharing)

### 4.10 Group Chats
- Up to 250 members per group DM
- No admin roles (all members equal)
- @mention works within group
- Can name group chats
- Can leave group or mute it
- Group chat icon: Merged avatars or custom photo

### 4.11 Voice/Video Calls
- Integrated; tap phone/video icon in chat header
- 1:1 and group calls (up to 50 participants)
- No screen sharing in calls
- Fun effects/filters during video calls
- "Rooms" for group video hangouts

### 4.12 Message Deletion
- "Unsend" removes message for everyone (no time limit)
- No "delete for me only" option — unsend removes from both sides
- Unsent messages leave no trace (no "message was deleted" placeholder)
- Vanish mode messages auto-delete

### 4.13 Encryption
- NOT end-to-end encrypted by default (as of current public version)
- Instagram is rolling out E2E encryption for DMs (gradual rollout)
- No visual indicator of encryption status in most conversations
- Vanish mode messages have additional ephemeral security but not E2E
- Meta is working on "encryption-protected" chats (in testing)

### 4.14 Notification Handling
- Push notifications with sender name + message preview
- Message requests get separate, subtle notifications
- Badge count on app icon
- Per-chat notification settings (mute for 1 hour, 24 hours, or until turned back on)
- "Primary" vs "General" inbox affects notification priority
- Story mention notifications linked to DMs

### 4.15 New Chat Creation
- Pencil-in-square icon (top-right)
- Shows: recent contacts, search by username or name
- Can search by Instagram handle (@username)
- Share post directly to DM from any post → opens DM picker
- Can message anyone (unless they have DM restrictions set)
- Message requests folder for non-mutual followers

---

## 5. SIGNAL

### 5.1 Chat List UX
- **Layout**: Minimal, clean vertical list; avatar, name, last message preview, timestamp, unread badge
- **Unread badge**: Blue circle with count number
- **Pinned chats**: Long-press → pin; up to 5 pinned chats
- **Archived chats**: Swipe to archive; archived folder at bottom
- **No stories/online indicators**: Privacy-first, no online status on chat list
- **Timestamp formatting**: Relative ("2m", "1h", "Yesterday", or date)

### 5.2 Message Types
- Text, images, videos, voice messages, files, contacts, location, stickers, GIFs (via Giphy), view-once media, text formatting (bold, italic, strikethrough, monospace, spoiler)
- **View-once media**: Photos/videos that disappear after viewing
- **Voice messages**: Record and send; can lock recording mode
- **Sticker packs**: Can create custom sticker packs
- **Spoiler text**: Text hidden behind a tap-to-reveal overlay

### 5.3 Message Bubbles
- **Sent**: Right-aligned, blue/signal-blue bubble with tail
- **Received**: Left-aligned, white/light gray bubble with tail
- **Timestamps**: Per message group; shown inside bubble
- **Read receipts**: Single ✓ = sent, double ✓✓ = delivered, filled blue ✓✓ = read
- **Message grouping**: Consecutive messages grouped
- **Date separators**: Date shown between message groups
- **Minimal metadata**: No forwarded tags, no reply counts

### 5.4 Typing Indicators
- Shows "typing..." in chat list and chat header
- Animated dots in chat thread
- Privacy-respecting: Only shown when both parties have typing indicators enabled
- Can be disabled in Settings > Privacy

### 5.5 Online/Last Seen
- No online status indicator (by design — privacy-first)
- No "last seen" timestamp shown to other users
- Can see if someone is typing (if enabled)
- Some "is typing" indicator is the only real-time presence signal

### 5.6 Message Reactions
- Long-press message → 6 quick reactions (👍❤️😂😮😢🙏) + full emoji picker
- Reactions shown below message as small emoji with count
- Tap to see who reacted
- Reactions are E2E encrypted (unique to Signal)
- Reactions are not visible in notifications

### 5.7 Reply/Quote
- Long-press message → "Reply" → quoted message appears above reply
- Quoted message shows sender name + text preview
- Tapping quoted reference scrolls to original
- Works in groups and 1:1

### 5.8 Search Messages
- Search bar in chat list: searches conversations and messages
- In-chat search: searches within specific conversation
- Can filter by media type, links, etc.
- Search respects E2E encryption (search happens client-side)

### 5.9 Media Gallery
- Tap chat header → "All Media" section
- Grid view of shared photos, videos, files
- Can sort by type
- File size shown for documents
- Can save media to device

### 5.10 Group Chats
- Up to 1000 members per group
- Admin roles: Add/remove members, change group info, restrict sending
- @mention specific users
- Group link sharing for joining
- Disappearing messages timer (per group)
- "Admin only" sending mode
- No channels/broadcast feature

### 5.11 Voice/Video Calls
- Integrated; tap phone/video icon in chat header
- 1:1 and group calls (up to 40 participants)
- End-to-end encrypted calls
- Screen sharing in beta
- Call relay (hides IP address from other party)
- Call links: Share a link to join a call

### 5.12 Message Deletion
- "Delete for me" (local only)
- "Delete for everyone" (removes from both sides, no time limit in groups)
- In 1:1 chats, can only delete locally after a period
- No "message was deleted" placeholder for other user
- Disappearing messages: Auto-delete after chosen timer

### 5.13 Encryption
- End-to-end encryption by default for ALL messages, calls, and groups
- **Verified by independent security audits**
- Safety number verification: Can verify identity per conversation
- Chat lock: Biometric/PIN lock for specific conversations
- Sealed sender: Server can't see who sent the message
- E2E encryption badge/padlock icon visible in every chat
- Signal Protocol used by WhatsApp, Google Messages (RCS), and others

### 5.14 Notification Handling
- Push notifications with sender name + message preview
- Can hide message preview in notifications (shows "Message")
- Badge count on app icon
- Per-chat notification settings
- Notification for reactions
- Can disable reaction notifications

### 5.15 New Chat Creation
- Pencil icon → shows contact list (from phone contacts who use Signal)
- Search by name or phone number
- Can enter phone number directly to start chat
- "Group" creation option
- Username feature (new): Can share username instead of phone number
- No need to share phone number with new username feature

---

## 6. ORRA CURRENT IMPLEMENTATION (Detailed Code Analysis)

### 6.1 Chat List UX
- ✅ Vertical list with avatar, name, last message preview, relative timestamp
- ✅ Unread count badge (violet circle with number)
- ✅ Online status indicator (green dot on avatar)
- ✅ "Online Now" row showing horizontally scrollable online chat partners
- ✅ Search conversations by name/handle
- ❌ No pinned chats
- ❌ No archived chats
- ❌ No swipe actions
- ❌ No chat folders/tabs
- ❌ No last message type preview (e.g., "📷 Photo")

### 6.2 Message Types
- ✅ Text messages
- ✅ Image URL (paste URL, not upload)
- ❌ No image upload/camera integration
- ❌ No voice messages
- ❌ No video messages
- ❌ No file/document sharing
- ❌ No location sharing
- ❌ No contact sharing
- ❌ No GIFs/stickers
- ❌ No polls in DM
- ❌ No shared post cards (share-modal just fires API call, doesn't render card in chat)

### 6.3 Message Bubbles
- ✅ Sent vs received distinction (violet vs white/10)
- ✅ Rounded bubbles with different corner radius for sent/received
- ✅ Timestamps shown (relative: "Just now", "Xm ago")
- ✅ Read receipts (✓✓ for sent messages)
- ❌ No delivery status differentiation (single ✓ vs double ✓✓ vs blue ✓✓)
- ❌ No message grouping (each message shows timestamp)
- ❌ No date separators
- ❌ Read receipts always show ✓✓ (not tracking actual read state)

### 6.4 Typing Indicators
- ❌ NOT implemented

### 6.5 Online/Last Seen
- ✅ Online/Offline status shown in chat header ("Online" in green, "Offline" in default)
- ✅ Green dot on avatar for online users
- ❌ No "last seen" timestamp
- ❌ No privacy controls to hide online status
- ❌ No idle/DND/invisible status modes

### 6.6 Message Reactions
- ✅ Double-click to react (triggers reaction picker)
- ✅ Quick reaction bar with 5 emojis (❤️👍😂🔥💯)
- ✅ Reaction displayed below message bubble
- ❌ Reactions are CLIENT-ONLY (stored in zustand, not persisted to DB) — see `chatReactions` in aura-store
- ❌ No count or who-reacted display
- ❌ Only one reaction per message (overwrites previous)
- ❌ Reaction not sent to other user

### 6.7 Reply/Quote
- ❌ NOT implemented

### 6.8 Search Messages
- ✅ Search conversations by name/handle in chat list
- ❌ No search within a specific conversation
- ❌ No full-text message search
- ❌ No search by media type

### 6.9 Media Gallery
- ❌ NOT implemented

### 6.10 Group Chats
- ❌ NOT implemented (schema supports multiple ChatMembers but UI only supports 1:1)

### 6.11 Voice/Video Calls
- ❌ Phone/Video icons present in UI but NON-FUNCTIONAL (just buttons, no logic)

### 6.12 Message Deletion
- ❌ NOT implemented

### 6.13 Encryption
- ❌ NOT implemented
- ❌ No encryption indicator

### 6.14 Notification Handling
- ✅ Unread count badge in chat list
- ❌ No push notifications for new messages
- ❌ No notification customization
- ❌ No message preview in notifications

### 6.15 New Chat Creation
- ⚠️ MAJOR ISSUE: Users must enter a raw UUID (e.g., "clx7abc123def456") as the user ID
- ❌ No search by name/handle when creating new chat
- ❌ No contact list to pick from
- ❌ No username-based discovery
- ❌ No recent contacts shown
- The API endpoint (`POST /api/chats`) accepts `otherUserId` as a UUID string
- The search API (`GET /api/search`) CAN search users by name/handle, but the new chat UI doesn't use it

### 6.16 Additional Issues Found in Code
1. **Reactions are client-only**: `chatReactions` is stored in zustand local state (line 129, aura-store.ts) — not persisted to DB. The `DirectMessage` schema has a `reaction` field but it's never read or written from the UI.
2. **Read receipts are fake**: The `✓✓` always shows for sent messages regardless of whether they've been read. No actual delivery/read tracking exists.
3. **Share via DM is broken**: The share-modal sends `POST /api/chats` with `{ postId }` but the API expects `{ otherUserId }` — the postId is ignored and the chat creation fails.
4. **Image URL input is not user-friendly**: Requires pasting a URL instead of uploading a file.
5. **No polling/websocket for real-time messages**: Messages only refresh on explicit query invalidation after sending. No real-time message delivery.
6. **Message area height is fixed**: `max-h-[400px]` may be too small on larger screens and too large on small mobile screens.
7. **Optimistic UI is incomplete**: The `handleSend` clears input but doesn't add a local message before the API response. The message only appears after `refetchMessages` completes.

---

## 7. CRITICAL ANALYSIS

### What ORRA is Doing RIGHT ✅

1. **Dark, stylish UI with glassmorphism** — The aesthetic fits the Gen-Z social media target audience. Violet/fuchsia gradients and dark theme feel modern.
2. **Token rewards for messaging** — +1 ORRA per first message per chat per day is a smart gamification mechanic that encourages engagement without farming.
3. **Online Now row** — A unique touch that shows currently online chat partners as a horizontally scrollable story-ring-style row. This is a creative differentiator.
4. **Quick reactions** — The double-click-to-react with a 5-emoji picker is intuitive (similar to Instagram's double-tap heart).
5. **Auto-mark as read** — Opening a chat automatically marks it as read via API. Clean UX.
6. **Chat list search** — Basic but functional search by name/handle.
7. **Share post to DM** — Concept is right (shared post card in DM), even though execution needs fixing.

### What ORRA is MISSING or Could Improve ❌

#### P0 — CRITICAL (Blocks Core Messaging UX)

| # | Issue | How Others Solve It | Recommendation |
|---|-------|---------------------|----------------|
| 1 | **New chat by raw UUID** — Users must paste a CUID like "clx7abc123" | All platforms use name/handle search with autocomplete. Instagram/Telegram show a contact list + search. | Replace the UUID input with a user search picker that calls `/api/search?q=` and shows results with avatars. When user selects a result, use that user's ID internally. |
| 2 | **No real-time message delivery** — Messages only appear after manual refresh | All platforms use WebSockets or long-polling. WhatsApp/Discord are real-time. | Implement WebSocket or use existing `refetchInterval` on the `useChatMessages` hook (quick fix: add `refetchInterval: 3000` like posts do). |
| 3 | **Reactions are client-only** — Not persisted, other user never sees them | WhatsApp/Telegram/Signal persist reactions to DB and sync to both users. | Write reactions to `DirectMessage.reaction` field (already exists in schema!). Read reactions from API response. |
| 4 | **Share via DM is broken** — Sends `postId` but API expects `otherUserId` | Instagram shows a DM picker with conversation list + search, then sends the shared post as a card message. | Fix the share flow: 1) Show DM picker modal, 2) User selects recipient, 3) Create/get chat, 4) Send message with post card data. |

#### P1 — HIGH (Core Features Users Expect)

| # | Issue | How Others Solve It | Recommendation |
|---|-------|---------------------|----------------|
| 5 | **No reply/quote** | Swipe-right (WhatsApp/Telegram) or long-press→Reply (Instagram). Quoted message shown as compact card above reply. | Add `replyToId` field to DirectMessage schema. Show quoted message as small card above reply. Swipe right gesture to trigger. |
| 6 | **No message deletion** | WhatsApp: "Delete for Me" + "Delete for Everyone". Instagram: "Unsend" (no trace). | Add `deletedAt` and `deletedFor` fields to DirectMessage. Long-press menu with delete options. Show "This message was deleted" for everyone-deletion. |
| 7 | **No image upload** — Only URL paste | All platforms have camera/gallery integration with file upload. | Use the existing `/api/uploads` infrastructure to add image upload. Show camera/gallery icon that triggers file picker. |
| 8 | **No voice messages** | WhatsApp/Telegram/Signal all have hold-to-record with waveform preview. | Add `audioUrl` field to DirectMessage. Implement hold-to-record button (replace send button while recording). Use Web Audio API for recording. |
| 9 | **Fake read receipts** — Always shows ✓✓ | WhatsApp: Single ✓ → double ✓✓ (gray) → double ✓✓ (blue). Signal: Same pattern. | Add `deliveredAt` and `readAt` fields to DirectMessage. Update on delivery/read events. Show progressive check marks. |
| 10 | **No message search within chat** | WhatsApp/Telegram/Signal all support in-chat search. | Add search functionality within chat thread. Call `/api/chats/[chatId]/messages` with text filter. |

#### P2 — MEDIUM (Nice-to-Have / Competitive Parity)

| # | Issue | How Others Solve It | Recommendation |
|---|-------|---------------------|----------------|
| 11 | **No typing indicator** | WhatsApp/Telegram/Signal/Discord all show "typing..." | Use WebSocket to broadcast typing state. Show animated dots in chat header and above input area. |
| 12 | **No last seen** — Only Online/Offline | WhatsApp/Telegram show "last seen X minutes ago". Signal doesn't (privacy). | Add `lastSeen` display in chat header (already in User schema!). Add privacy toggle. |
| 13 | **No pinned chats** | WhatsApp/Telegram allow pinning important chats to top. | Add `pinnedAt` field to ChatMember. Sort pinned chats first. Long-press to pin/unpin. |
| 14 | **No media gallery** | WhatsApp/Telegram/Signal have "Shared Media" view per chat. | Add "Media" tab in chat detail view. Query messages with `imageUrl` or filter by type. |
| 15 | **No date separators** | All platforms show date dividers between messages on different days. | Add date separator component between message groups when date changes. |
| 16 | **No message grouping** | WhatsApp/Telegram group consecutive messages from same sender. | Group messages within 2 minutes from same sender. Only show avatar/timestamp on last in group. |
| 17 | **No message long-press menu** | All platforms have context menu on long-press (reply, react, delete, copy, forward). | Add context menu (use existing `context-menu.tsx` UI component). |
| 18 | **Share modal doesn't show DM picker** | Instagram shows list of conversations to share to. | Build a DM picker modal that shows existing chats + search for new recipients. |

#### P3 — LOW (Differentiation / Future)

| # | Issue | How Others Solve It | Recommendation |
|---|-------|---------------------|----------------|
| 19 | **No group chats UI** | WhatsApp/Telegram support up to 1024/200k members. | Schema already supports multi-member chats. Add group creation UI, group name, avatar, admin controls. |
| 20 | **No encryption** | Signal is fully E2E encrypted. WhatsApp too. | Implement Signal Protocol for E2E encryption. Show lock icon. Long-term goal. |
| 21 | **No voice/video calls** | All 5 platforms have integrated calling. | Phone/Video icons exist but are non-functional. Implement WebRTC-based calling. |
| 22 | **No GIFs/stickers** | Telegram/WhatsApp/Discord have extensive GIF/sticker support. | Integrate Giphy API or Tenor for GIF search. Allow custom sticker packs. |
| 23 | **No disappearing messages** | WhatsApp/Telegram/Signal support auto-delete timers. | Add `expiresAt` field to DirectMessage. Background job to clean expired messages. |
| 24 | **No notification customization** | All platforms allow per-chat notification settings. | Add notification preferences per chat (sound, preview, mute). |
| 25 | **No forwarded messages** | WhatsApp/Telegram show "Forwarded" label. | Add `isForwarded` boolean to DirectMessage. Show "Forwarded" tag. |

### Bugs Found 🐛

1. **Share via DM sends wrong payload** — `share-modal.tsx` line 39-42 sends `{ postId }` but `POST /api/chats` expects `{ otherUserId }`. The share functionality is completely broken.
2. **Reactions never persist** — `messages.tsx` line 321 calls `useAuraStore.getState().addReaction()` which only updates local zustand state. The `DirectMessage.reaction` DB field is never updated.
3. **Read receipts are always double-check** — Line 309: `{isMe && ' ✓✓'}` always shows ✓✓ for all sent messages. No actual read/delivery tracking.
4. **`useChatMessages` doesn't send `imageUrl` to send mutation** — Line 89-92: `sendMessageMutation.mutateAsync` only sends `{ chatId, text }` even when `imageUrl` is set.
5. **Timestamps always show relative minutes** — Line 306-309: `Math.floor((Date.now() - msg.createdAt) / 60000)` shows "0m ago" for messages less than a minute old instead of "Just now" (actually line 306-308 does handle < 1 min case as "Just now" — but the `else` case just shows "Xm ago" even for hours/days old messages).
6. **Chat area height is fixed at 400px** — `max-h-[400px]` doesn't adapt to screen size.

---

## 8. ACTIONABLE RECOMMENDATIONS (Priority-Ordered)

### Immediate (This Sprint)

1. **Fix new chat creation** — Replace UUID input with searchable user picker
   - Create a `UserSearchPicker` component that calls `/api/search?q=` 
   - Show results with avatars, names, handles
   - When user selects a result, use that user's `id` to create chat
   - Also show existing chats / followed users as quick picks

2. **Fix share via DM** — Add proper DM picker to share modal
   - Show list of existing conversations
   - Add search for new recipients
   - Send the shared post as a message with post card data (add `sharedPostId` to message)

3. **Persist reactions** — Save to DB, sync to other user
   - Write reaction to `DirectMessage.reaction` field via new API endpoint
   - Read reactions from API response instead of zustand
   - Other user sees reaction on next message fetch

4. **Fix sendMessage to include imageUrl** — Pass imageUrl in mutation

5. **Add message refetch interval** — `refetchInterval: 3000` on `useChatMessages` for near-real-time

### Short-Term (Next Sprint)

6. **Add reply/quote** — Schema change + UI
   - Add `replyToId` field to `DirectMessage` (nullable, references another DirectMessage)
   - Long-press or swipe-right on message → Reply mode
   - Show quoted message as compact card above reply

7. **Add message deletion** — Delete for me + Delete for everyone
   - Add `deletedAt` and `deletedFor` (array of userIds) fields
   - Long-press menu with delete options
   - Show "This message was deleted" placeholder

8. **Add image upload** — Use existing upload infrastructure
   - File picker → upload to `/api/uploads` → get URL → send as `imageUrl`
   - Show preview before sending

9. **Fix read receipts** — Actual delivery + read tracking
   - Add `deliveredAt` and `readAt` to DirectMessage
   - Show single ✓, double gray ✓✓, double blue ✓✓
   - Update when recipient opens chat (already calling `/read` endpoint)

10. **Add date separators + message grouping** — Better readability

### Medium-Term (Future Sprints)

11. **Typing indicators** — WebSocket or polling-based
12. **Voice messages** — Hold-to-record with waveform
13. **Last seen display** — Show from existing `lastSeen` field
14. **Pinned chats** — Add `pinnedAt` to ChatMember
15. **Media gallery** — Shared media view per conversation
16. **In-chat search** — Full-text search within conversation
17. **Long-press context menu** — Reply, react, delete, copy, forward
18. **Group chats UI** — Schema already supports it

### Long-Term (Roadmap)

19. **E2E encryption** — Signal Protocol integration
20. **Voice/video calls** — WebRTC implementation
21. **GIFs/stickers** — Giphy/Tenor integration
22. **Disappearing messages** — Auto-delete timer
23. **Notification system** — Push notifications with previews
24. **Group admin controls** — Roles, permissions, slow mode
