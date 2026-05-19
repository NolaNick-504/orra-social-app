# 10 Social Game Mechanics: Deep-Dive Research Report

> Research Date: March 2026  
> Purpose: Detailed game mechanic blueprints for ORRA's 10 social games  
> Methodology: Analysis of real platforms (Gas, TBH, Yik Yak, BeReal, Sendit, NGL, LMK, Poparazzi, Dispo, Reddit r/RoastMe, Hot or Not, Hoop, Wink, Polly, TikTok)  
> Author: Senior Game Design Researcher

---

## GAME 1: ROAST BATTLE

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **Reddit r/RoastMe** | Users post a photo of themselves holding a handwritten sign reading "r/RoastMe" (verification). Community roasts in comments. Best roasts rise via upvotes. No head-to-head format—it's crowd-vs-one. |
| **Comedy Roast Battle (IRL/App)** | Live events where comedians go 1v1, audience votes via Comedy Knockout App. Bracket tournament format (16→8→4→2→1). |
| **Yik Yak** | Pseudonymous posting with upvote/downvote. Users roast each other in threads. No formal battle structure, but the culture naturally creates roast threads. Community votes via upvotes. |
| **TikTok LIVE Battles** | Two creators go live simultaneously. Viewers vote by sending gifts/engagement. Progress bar shows real-time vote count. Closest real analog to head-to-head roast. |

### 2. Complete Game Flow

```
PHASE 1: MATCHING
  Player opens Roast Battle → Sees "Finding Opponent..." 
  → Matched with random opponent (or friend challenge)
  → Both players see each other's profile card (avatar, username, roast record)

PHASE 2: ROUND STRUCTURE (Best of 3 rounds)
  Round starts → Both players receive a PROMPT (e.g., "Roast their bio", "Roast their vibe")
  → 30-second timer starts → Each player types their roast (max 200 chars)
  → Both roasts revealed simultaneously on split screen
  → Audience (spectators + other players in queue) votes for winner
  → Vote window: 15 seconds → Winner of round gets a point

PHASE 3: SCORING
  After 3 rounds → Best of 3 wins
  → If tied 1-1, sudden death round with random prompt
  → Final score displayed: "Player A: 2 | Player B: 1"

PHASE 4: REWARDS
  Winner: 50 ORRA tokens + 25 XP + "Roast Champion" badge progress
  Loser: 15 ORRA tokens + 10 XP (consolation)
  "Best Roast" (highest-voted individual roast): Bonus 20 tokens + featured in Best Moments
```

### 3. Opponent/Player System

- **Primary: Random Matchmaking** — Player enters queue, matched with someone of similar ELO rating (±100 points). Queue timeout: if no match in 30s, offer to play against a "guest" (bot clearly labeled as such).
- **Secondary: Friend Challenge** — Player selects friend → sends challenge invite → friend has 5 min to accept → battle begins.
- **Community-wide: Open Battle** — Player posts "Open Battle" to feed. Anyone can accept within 10 min. First accepter gets the match.
- **Tournament: Bracket Mode** — 8 players seeded by ELO. Quarter-finals → Semi-finals → Final. Spectators vote on each match.

### 4. Scoring Mechanism

- **Per-round voting**: Each spectator gets ONE vote per round. Vote is binary (Player A or Player B).
- **Vote weight**: All votes equal weight (1 vote = 1 point). No weighted voting to prevent whale dominance.
- **Minimum vote threshold**: Round requires at least 3 votes to be valid. If fewer spectators, the system uses a hybrid: 50% audience vote + 50% random community panel (pre-selected trusted voters).
- **Tiebreaker**: If votes are exactly tied, round is replayed with a new prompt.
- **Fairness**: Players cannot see opponent's roast before submitting their own (simultaneous reveal).

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Simultaneous submit** | Both players submit roast BEFORE either is revealed. Server validates timestamps. |
| **Rate limit** | Max 10 Roast Battles per hour per user. |
| **Vote bot detection** | Accounts <24h old cannot vote. Accounts must have completed onboarding. |
| **IP fingerprinting** | One vote per IP per round. Prevents multi-account voting. |
| **Collusion detection** | If Player A and Player B play each other repeatedly (>3x/day), flag for review. |
| **Content filtering** | AI toxicity filter blocks hate speech, doxxing, threats. Roasts must be humorous, not harmful. |
| **Cooldown on voting** | 2-second minimum between votes to prevent bot-speed clicking. |
| **Shadow mode** | Known bot accounts see UI but votes don't count. |

### 6. Engagement Hooks

- **Win Streaks**: 3-win streak → "On Fire" badge. 10-win streak → "Roast Legend" badge. Streaks visible on profile.
- **Daily/Weekly Leaderboard**: Top roasters by win rate (min 5 games). Resets weekly.
- **Roast of the Day**: Highest-voted individual roast gets featured on feed → drives FOMO.
- **ELO Rating**: Visible MMR-style rating. Climb from "Rookie" → "Amateur" → "Pro" → "Legend".
- **Rematch**: After battle, option to rematch (opponent must accept).
- **Shareable result card**: "I won 2-1! 🔥" with animated graphic → share to feed/story.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  POST /api/games/roast-battle/queue          — Enter matchmaking queue
  POST /api/games/roast-battle/challenge       — Challenge a friend
  POST /api/games/roast-battle/submit-roast    — Submit roast for current round
  POST /api/games/roast-battle/vote             — Vote on a round
  GET  /api/games/roast-battle/session/:id      — Get battle state
  GET  /api/games/roast-battle/leaderboard      — Get rankings
  POST /api/games/roast-battle/rematch          — Request rematch

DB MODELS:
  RoastBattleSession {
    id, player1Id, player2Id, 
    currentRound, status (matching/active/voting/complete),
    player1Score, player2Score,
    promptIds[], createdAt, completedAt
  }
  RoastBattleRound {
    id, sessionId, roundNumber,
    promptId, promptText,
    player1Roast, player2Roast,
    player1SubmittedAt, player2SubmittedAt,
    player1Votes, player2Votes,
    winnerId
  }
  RoastBattleVote {
    id, roundId, voterId, votedForId, createdAt
  }

REAL-TIME FEATURES (WebSocket):
  - Match found notification → both clients open battle UI
  - Round start → both clients receive prompt simultaneously
  - Roast submitted → opponent sees "waiting for opponent..."
  - Both submitted → simultaneous reveal animation
  - Vote tally → real-time vote counter update
  - Round result → winner animation + score update
  - Battle complete → final result + reward distribution

PROMPT SYSTEM:
  - Curated pool of 200+ roast prompts (rotated weekly)
  - Categories: "Roast their bio", "Roast their vibe", "Roast their aesthetic", "Roast their hobbies"
  - AI-generated prompts approved by moderators
  - Custom prompts for friend challenges (player can suggest prompt)
```

---

## GAME 2: HOT TAKE

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **Reddit r/unpopularopinion** | Users post controversial takes. Community upvotes/downvotes. Top posts = most agreed-with "unpopular" takes. No formal W/L voting. |
| **TBH** | Poll-based format: "Who is most likely to..." with 4 friend options. Positive-only by design. Structural ancestor of Hot Take. |
| **Gas** | Poll format with anonymous voting. "Should [name] every..." → pick a friend. Compliment-oriented. |
| **Yik Yak** | Post hot takes pseudonymously. Upvote/downvote determines visibility. No formal W/L binary. |
| **TikTok** | "Tell me without telling me" trend. Comment-based voting. No structured game. |

### 2. Complete Game Flow

```
PHASE 1: TAKE SUBMISSION
  Player receives a CATEGORY (Food, Pop Culture, Campus Life, Tech, Relationships)
  → Player writes their hot take (max 150 chars) OR selects from pre-written takes
  → Take is posted to the Hot Take board anonymously (username hidden during voting)

PHASE 2: COMMUNITY VOTING (W or L)
  Take appears in other players' feeds with two buttons: W (win/take is valid) or L (loss/take is wrong)
  → Players swipe through takes and vote W/L
  → Each take gets 30 votes (or 2 hours, whichever comes first)
  → Real-time W/L ratio displayed as a progress bar

PHASE 3: SCORING
  If W ratio ≥ 70% → "Hot Take Certified W" → Player earns 30 tokens + 20 XP
  If W ratio 50-69% → "Controversial Take" → Player earns 15 tokens + 10 XP
  If W ratio < 50% → "L Take" → Player earns 5 tokens + 5 XP (participation)
  Bonus: If take gets 90%+ W → "Nuclear Take" → 50 bonus tokens + featured on feed

PHASE 4: VOTER REWARDS
  Voters earn 2 tokens per vote (max 20 votes/day for tokens)
  → "Taste Maker" badge for voters whose W/L votes align with majority 80%+ of the time
```

### 3. Opponent/Player System

- **No direct opponents** — This is a crowd-sourced game. Your "take" is evaluated by the community.
- **Asynchronous play** — Submit takes anytime. Votes accumulate over time.
- **Social proof layer** — Takes from friends appear first in your voting queue ("Friends' Takes" tab).
- **Community-wide** — All takes visible to all players within the same geographic/community scope.
- **Friend challenge variant** — "Challenge a friend to a take battle": both submit takes on same category, community votes which is better (W for Take A or Take B).

### 4. Scoring Mechanism

- **W/L ratio**: Simple percentage. 30 votes minimum for final score.
- **Confidence interval**: For takes with <30 votes, score shows "Pending..." to avoid premature judgments.
- **Weighted by voter reputation**: Voters with "Taste Maker" badge have 1.5x vote weight. This rewards consistent voters and reduces random voting impact.
- **Anti-brigading**: If >50% of votes on a take come from accounts created in the same 24h period, those votes are flagged and don't count toward final score.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Anonymous during voting** | Take author hidden until voting closes. Prevents popularity bias. |
| **Vote rate limit** | Max 1 vote per 3 seconds. Max 100 votes per day. |
| **Take rate limit** | Max 5 takes per day per user. Prevents spam. |
| **Brigade detection** | If >10 votes come from same IP range within 5 minutes, flag for review. |
| **Content filter** | AI detects hate speech, doxxing, threats. Takes must be opinion-based, not personal attacks. |
| **Minimum account age** | Must be 48h+ old to submit takes or vote. |
| **Deduplication** | AI checks if take is too similar to existing takes (prevents copy-paste). |
| **Random vote order** | Takes shown in random order, not chronological. Prevents first-poster advantage. |

### 6. Engagement Hooks

- **Daily Hot Take prompt**: New category every day at noon. "Today's category: FOOD. Drop your spiciest take."
- **Leaderboard**: "Hottest Takes This Week" — ranked by W ratio (min 30 votes).
- **Streak**: Submit a take every day → "7-Day Streak" badge. Break = reset.
- **"Nuclear Take" alert**: When a take hits 90%+ W, push notification: "🔥 Nuclear Take alert!"
- **Take battle**: Weekly event where top take-makers go head-to-head.
- **Share card**: "My take got 87% W 🔥" shareable graphic.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  POST /api/games/hot-take/submit              — Submit a hot take
  POST /api/games/hot-take/vote                 — Vote W or L on a take
  GET  /api/games/hot-take/feed                 — Get takes to vote on (paginated)
  GET  /api/games/hot-take/my-takes             — Get your submitted takes + results
  GET  /api/games/hot-take/leaderboard          — Top takes this week
  GET  /api/games/hot-take/daily-prompt         — Today's category
  POST /api/games/hot-take/battle/create        — Create a take battle with friend
  POST /api/games/hot-take/battle/vote          — Vote on take battle

DB MODELS:
  HotTake {
    id, authorId, text, category,
    wVotes, lVotes, totalVotes,
    status (active/finalized/expired),
    wRatio, finalScore, createdAt, finalizedAt
  }
  HotTakeVote {
    id, takeId, voterId, vote (W/L), createdAt
  }
  HotTakeBattle {
    id, player1Id, player2Id, category,
    player1TakeId, player2TakeId,
    player1Votes, player2Votes,
    status, winnerId
  }

REAL-TIME FEATURES:
  - Live vote counter update (WebSocket: vote_count_changed event)
  - "Nuclear Take" push notification when W ratio hits 90%+
  - Take battle: live vote progress bar
  - New take notification for friends' takes

CATEGORIZATION SYSTEM:
  - 10 categories: Food, Pop Culture, Campus Life, Tech, Relationships, 
    Sports, Fashion, Entertainment, Life Hacks, Wild Card
  - Daily rotation: Each day highlights 2 categories
  - AI-generated prompt suggestions per category
```

---

## GAME 3: FIRST IMPRESSION

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **TBH** | Present 4 friends' names → "Who is most likely to [blank]?" → Pick one. The selected friend receives an anonymous compliment notification. Core game loop: 12 polls/hour, earn gems for answering. |
| **Gas** | Same mechanic as TBH (same creator, Nikita Bier). Present friends' names → vote in polls → selected friend receives "Flame" notification (blue=picked by boy, pink=girl, purple=non-binary). God Mode ($6.99/mo) reveals hints about who voted. |
| **BFF Test / Friendship Quiz** | Answer questions about a friend → compare answers → see compatibility score. Share link on socials. |
| **Guess To Know Me** | 2-player game. Answer questions about partner. Score = how many you got right. |
| **Hoop / Wink** | Swipe on profiles → make friends. "First impression" is the core mechanic: judge someone based on their profile. |

### 2. Complete Game Flow

```
PHASE 1: PROFILE PRESENTATION
  Player A enters game → Sees Player B's profile card
  → Profile shows: avatar, bio, 3 tags, 3 "recent activity" items, mutual friends count
  → Profile is REAL data from Player B's ORRA profile

PHASE 2: GUESSING ROUNDS (5 rounds)
  Each round presents a question about Player B:
  Round 1: "What's their most used emoji?" → 4 options (1 correct from real data)
  Round 2: "What time do they usually post?" → 4 time ranges
  Round 3: "What's their vibe?" → Pick from vibe tags
  Round 4: "Which game do they play most?" → 4 game options
  Round 5: "What would they choose: beach or mountains?" → AI prediction based on profile

  Player A selects their answer → Immediate feedback: correct/wrong
  → If correct: "+10 points" with green highlight
  → If wrong: Show correct answer with Player B's real data

PHASE 3: MUTUAL IMPRESSION
  After Player A guesses, roles swap:
  → Player B guesses about Player A (same 5 questions)
  → Both scores tallied

PHASE 4: COMPATIBILITY SCORE
  Combined accuracy → Compatibility percentage
  → 80-100%: "Soulmates 👯" 
  → 60-79%: "Good Vibes 🤝"
  → 40-59%: "Getting There 🤔"
  → 0-39%: "Strangers 😅"
  → Both players see results simultaneously
```

### 3. Opponent/Player System

- **Friend-first**: Default mode shows friends list. Pick a friend → play their profile.
- **Random match**: If no friends online, match with a random player who's opted into "First Impression" discovery.
- **Community profiles**: Browse profiles in the "Discover" feed → guess about someone you find interesting.
- **Asymmetric play**: Player A can guess about Player B even if B is offline. B gets notified: "Someone guessed about you!" and can play back later.
- **Opt-in**: Profile data is only used in the game if user has "First Impression" enabled in privacy settings.

### 4. Scoring Mechanism

- **Per-question scoring**: +10 points per correct answer, +5 for "close" answers (adjacent option).
- **Speed bonus**: Answer within 5 seconds → +3 bonus points.
- **Final score**: Sum of 5 rounds (max 65 points per player).
- **Compatibility**: Average of both players' accuracy scores as a percentage.
- **ELO adjustment**: Winning against a highly-rated player yields more ELO points.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Profile data from server** | Questions generated from REAL profile data server-side. Client never sees answers. |
| **Answer randomization** | 4 options shuffled per session. Correct answer position randomized. |
| **Time limit per question** | 15-second max. Prevents Googling/stalking profile. |
| **No re-plays against same person** | 24h cooldown before guessing about same person again. |
| **Question pool rotation** | 50+ question templates. 5 selected randomly per game. |
| **Profile privacy opt-in** | User must explicitly enable First Impression data usage. Can disable anytime. |
| **Answer validation server-side** | Correct answers stored server-side. Client cannot tamper. |

### 6. Engagement Hooks

- **"Who knows you best?" leaderboard**: Rank by how many people guessed correctly about you. High rank = popular profile.
- **Compatibility streak**: Play First Impression daily → track compatibility with different friends.
- **"Perfect Score" badge**: Get 5/5 correct → earn rare badge.
- **Weekly challenge**: "Guess 10 profiles this week" → bonus tokens.
- **Mutual discovery**: When both players score >60%, unlock "Mutual Vibe" badge + option to DM.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  POST /api/games/first-impression/start          — Start a game (friend or random)
  POST /api/games/first-impression/answer          — Submit answer for a round
  GET  /api/games/first-impression/profile/:userId — Get profile data for questions
  GET  /api/games/first-impression/results/:id     — Get game results
  GET  /api/games/first-impression/leaderboard     — "Who knows you best" rankings
  POST /api/games/first-impression/play-back       — Play back after someone guessed you

DB MODELS:
  FirstImpressionGame {
    id, player1Id, player2Id,
    player1Score, player2Score,
    compatibilityScore,
    status (active/completed),
    createdAt, completedAt
  }
  FirstImpressionRound {
    id, gameId, roundNumber,
    questionTemplateId, questionText,
    correctAnswer, options[],
    player1Answer, player1Correct,
    player2Answer, player2Correct,
    timeTakenMs
  }
  FirstImpressionProfile {
    id, userId,
    mostUsedEmoji, usualPostTime, vibeTag,
    favoriteGame, preferenceData (JSON),
    updatedAt
  }

QUESTION GENERATION ENGINE:
  - Cron job runs daily to compute profile stats from user activity
  - mostUsedEmoji: aggregate from posts/comments
  - usualPostTime: mode of post timestamps (morning/afternoon/evening/night)
  - vibeTag: most received vibe tag
  - favoriteGame: most played ORRA game
  - preferenceData: AI-generated from profile text (beach vs mountains, etc.)
  - Store computed values in FirstImpressionProfile table
  - Questions generated server-side from these values + 3 random distractor options

REAL-TIME FEATURES:
  - Live game state sync between two players (WebSocket)
  - "Someone guessed about you!" push notification
  - Real-time score comparison during mutual play
  - Compatibility reveal animation (both players see at same time)
```

---

## GAME 4: RATE MY FIT

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **Hot or Not** (original, 2000) | Users submit photos → rated 1-10 by other users. Side-by-side comparison mode: two photos, pick which is more attractive. Score = average of all ratings. 165M+ users at peak. |
| **Rate My Outfit** (Google Play) | Upload full-length photo → AI rates outfit + gives style tips. Not community-driven. |
| **OutfitScore** | AI analyzer gives 0-100 fashion score. Individual scoring, not social. |
| **Poparazzi** | Friends take photos of you → your profile is built by others. "Pop Score" gamification. Top Poparazzi = who tags you most. Feature Pop = most popular photo. |
| **BeReal** | No rating, but the "authenticity" of unfiltered dual-camera creates implicit social judgment. |
| **Instagram Polls** | "This or That" outfit polls in Stories. Binary choice, friend-only voting. |

### 2. Complete Game Flow

```
PHASE 1: FIT SUBMISSION
  Player takes/uploads photo of their outfit (full body preferred)
  → Add caption (optional, max 50 chars): "Date night fit", "Just vibes", etc.
  → Add tags: #streetwear #formal #casual #gym #party
  → Photo posted to Rate My Fit board with 2-hour voting window

PHASE 2: COMMUNITY RATING
  Other players see the fit in their feed → Rate 1-10 using slider
  → Voters also pick a vibe tag: 🔥 Fire, 😎 Clean, 🤡 Mid, 💅 Slay, 😴 Basic
  → Minimum 10 ratings required for final score
  → Real-time average displayed: "Current Rating: 7.2 🔥"

PHASE 3: RESULTS
  After voting window closes → Final score calculated
  → Score = trimmed mean (drop top/bottom 10% to remove outliers)
  → Vibe distribution shown: "40% Fire, 30% Clean, 20% Slay, 10% Mid"
  → Percentile: "Your fit is better than 72% of fits today"
  → Comparison: "Similar rated fits" → shows fits with same score

PHASE 4: REWARDS
  Score 8+: 30 tokens + " certified baddie" badge progress
  Score 6-7.9: 15 tokens + 10 XP
  Score <6: 5 tokens (consolation) + style tip suggestion
  Top voter badge for rating 20+ fits/day
```

### 3. Opponent/Player System

- **No direct opponent** — Community-wide rating. Your fit vs. the community's standards.
- **Fit Battle variant**: Two players submit fits → community picks winner (A or B). Side-by-side comparison, inspired by Hot or Not's original dual-photo mode.
- **Friend rate**: Share fit to friends only → friends rate 1-10. More intimate, less pressure.
- **Themed challenges**: "Rate My Fit: Formal Friday" → all fits in same category → fair comparison.

### 4. Scoring Mechanism

- **Trimmed mean**: Remove top 10% and bottom 10% of ratings, then average. Eliminates troll 1s and friend-bias 10s.
- **Minimum threshold**: At least 10 ratings required. If <10 after 2 hours, extend window or mark as "Not enough ratings."
- **Rating distribution**: Not just average—show the spread. Bimodal distribution (lots of 1s and 10s) = controversial fit.
- **Percentile ranking**: Score compared against all fits rated that day. "Top 15% today" is more meaningful than "7.8/10."
- **Confidence score**: With 10 ratings, show "±0.5" confidence interval. More ratings = tighter interval.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Trimmed mean** | Remove top/bottom 10% of ratings. Eliminates outlier manipulation. |
| **Rate limit** | Max 1 fit submission per day. Max 50 ratings per day. |
| **Rating velocity check** | If 5+ ratings arrive within 10 seconds from similar IPs, flag as suspicious. |
| **Friend bias detection** | If >30% of ratings come from friends (vs. strangers), show "Rated mostly by friends" tag. |
| **Photo verification** | Must be a real photo (AI detects stock images, screenshots, non-clothing images). |
| **Minimum account age** | Must be 48h+ old to rate. Prevents bot account creation. |
| **No re-rating** | Each user can only rate a fit once. Vote is immutable. |
| **Shadow banning** | Accounts that consistently rate 1 or 10 on every fit have their votes silently discounted. |

### 6. Engagement Hooks

- **Daily fit leaderboard**: "Best Fits Today" — top 10 by score.
- **Weekly themes**: "Formal Friday", "Streetwear Saturday", "Athleisure Sunday" → themed submissions.
- **Fit streak**: Submit a fit every day for 7 days → "Consistent Drip" badge.
- **Voter badges**: Rate 100 fits → "Fashion Critic" badge.
- **"Fit of the Week"**: Highest-rated fit each week featured on main feed.
- **Style evolution**: Track your average rating over time on profile.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  POST /api/games/rate-my-fit/submit            — Submit a fit photo
  POST /api/games/rate-my-fit/rate/:fitId       — Rate a fit (1-10 + vibe tag)
  GET  /api/games/rate-my-fit/feed              — Get fits to rate (paginated, random order)
  GET  /api/games/rate-my-fit/my-fits           — Get your submitted fits + results
  GET  /api/games/rate-my-fit/leaderboard       — Top fits this week
  GET  /api/games/rate-my-fit/fit-battle/create — Create fit battle with friend
  POST /api/games/rate-my-fit/fit-battle/vote   — Vote on fit battle

DB MODELS:
  RateMyFitSubmission {
    id, userId, imageUrl, caption,
    tags[], status (active/finalized/expired),
    ratingSum, ratingCount, trimmedMean,
    percentile, vibeDistribution (JSON),
    votingDeadline, createdAt, finalizedAt
  }
  RateMyFitRating {
    id, fitId, raterId, rating (1-10),
    vibeTag, createdAt
  }
  FitBattle {
    id, player1Id, player2Id,
    player1FitId, player2FitId,
    player1Votes, player2Votes,
    theme, status, winnerId
  }

IMAGE HANDLING:
  - Upload to CDN (S3/Cloudflare R2)
  - AI content moderation: reject non-clothing, inappropriate, stock images
  - Resize to standard dimensions (400x600 fit card)
  - Add watermark for sharing
  - EXIF data stripped for privacy

REAL-TIME FEATURES:
  - Live rating counter update (WebSocket)
  - Vibe tag distribution live chart
  - Fit battle: real-time vote progress bar
  - "Your fit just hit 8.0!" push notification
```

---

## GAME 5: STORY CHALLENGE

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **Daily Prompt (app)** | Daily writing prompts. Set daily word goal (25-500). Community reads and likes stories. No formal competition, but "loved" stories get visibility. |
| **BeReal** | Daily prompt at random time → 2 minutes to capture → community views. No "best story" voting, but most-reacted posts get visibility. |
| **TikTok Challenges** | Hashtag-based challenges. "Tell me without telling me" → create video → best ones go viral via algorithm. Implicit voting (likes = votes). |
| **Dispo** | Take photos → wait until 9 AM next day for "development" → share to feed. Delayed gratification creates narrative. "Developing parties" at 9 PM where friends view developed photos together. |
| **Reddit r/WritingPrompts** | Community submits prompts → writers write stories → upvotes determine best stories. [WP] = writing prompt, [PI] = prompt inspired, [CCW] = constructive criticism welcome. |

### 2. Complete Game Flow

```
PHASE 1: DAILY PROMPT
  At noon local time, a new prompt drops:
  "Tell us about the most embarrassing thing that happened to you this week"
  "What's a secret you've never told anyone?"
  "Describe your last night out in exactly 3 sentences"
  → Players have 24 hours to submit their story (max 500 chars)

PHASE 2: COMMUNITY READING & VOTING
  After submitting, player can read other stories from the same prompt
  → Swipe through stories (TikTok-style vertical feed)
  → Vote: 🔥 Fire (great story), 😂 Relatable, 😮 Wild, 😴 Pass
  → Each player must submit their own story before voting (BeReal-style gate)

PHASE 3: FEATURED STORIES
  After 24 hours, top 3 stories by 🔥 votes get "Featured" status
  → Featured stories appear on main feed with "🏆 Story of the Day" badge
  → Author gets bonus tokens + profile badge
  → Honorable mentions (4th-10th) get "Rising Story" recognition

PHASE 4: REWARDS
  Featured (#1-3): 50 tokens + 30 XP + "Storyteller" badge
  Rising (4-10): 20 tokens + 15 XP
  Participation: 10 tokens + 5 XP
  Voter: 2 tokens per vote (max 30 votes/day)
```

### 3. Opponent/Player System

- **No direct opponents** — Everyone responds to the same prompt. Community votes determine best stories.
- **Friend circle variant**: "Friend Story Challenge" — 3-5 friends respond to prompt → only friends vote → friend with most 🔥 wins.
- **Community-wide**: Default mode. All responses visible to all players who've submitted.
- **Themed weeks**: "True Confessions Week" → all prompts are confession-themed. Creates narrative arcs across days.

### 4. Scoring Mechanism

- **🔥 Fire count**: Primary metric. Each player can give one 🔥 per story.
- **Engagement score**: (🔥 × 3 + 😂 × 2 + 😮 × 1) / total votes. Weighted by reaction type.
- **Minimum votes**: Story must receive at least 5 votes to be eligible for Featured.
- **Bayesian average**: To prevent a story with 3 🔥/3 votes from beating one with 50 🔥/60 votes, use Bayesian smoothing: (vote_count / (vote_count + min_votes)) × raw_score + (min_votes / (vote_count + min_votes)) × global_average.
- **No downvotes**: Only positive reactions. "Pass" (😴) is neutral, not negative. Prevents toxicity.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Submit-before-vote gate** | Must submit your own story before seeing/voting on others. Prevents drive-by downvoting. |
| **Vote rate limit** | Max 30 votes per day. 3-second minimum between votes. |
| **Story originality check** | AI detects copy-pasted stories from internet. Must be original content. |
| **Length requirement** | Min 20 characters, max 500. Prevents low-effort spam. |
| **One submission per prompt** | Can only submit one story per daily prompt. |
| **Friend voting transparency** | If >50% of a story's 🔥 come from friends, show "Mostly friend-voted" tag. Doesn't disqualify, but provides context. |
| **Time-gated** | No early voting. Voting opens after you submit. No late submissions after 24h window. |

### 6. Engagement Hooks

- **Daily habit**: New prompt every day at noon → creates daily check-in behavior.
- **Streak**: Submit stories 7 days in a row → "Story Streak" badge with fire counter.
- **Archive**: All your past stories saved in "My Stories" → personal journal.
- **Best Of**: Monthly "Best Stories" compilation → featured in app and shareable.
- **Writer level**: "Novice" → "Storyteller" → "Bard" → "Legend" based on total 🔥 earned.
- **Prompt suggestions**: Users can submit prompt ideas → community votes on best prompts → winner's prompt becomes tomorrow's daily.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  GET  /api/games/story-challenge/daily-prompt    — Get today's prompt
  POST /api/games/story-challenge/submit          — Submit story for today
  GET  /api/games/story-challenge/stories         — Get stories to read/vote (after submitting)
  POST /api/games/story-challenge/vote/:storyId   — React to a story
  GET  /api/games/story-challenge/featured        — Get featured stories (past days)
  GET  /api/games/story-challenge/my-stories      — Get your story archive
  GET  /api/games/story-challenge/leaderboard     — Top storytellers this month
  POST /api/games/story-challenge/suggest-prompt  — Suggest a future prompt

DB MODELS:
  StoryPrompt {
    id, text, category, date,
    submissionCount, source (curated/community_suggested),
    suggestedById, createdAt
  }
  StorySubmission {
    id, authorId, promptId, text,
    fireCount, relatableCount, wildCount, passCount,
    engagementScore, bayesianScore,
    isFeatured, featuredRank,
    status (active/featured/regular),
    createdAt
  }
  StoryVote {
    id, storyId, voterId, reaction (fire/relatable/wild/pass),
    createdAt
  }

CRON JOBS:
  - Daily at 00:00 UTC: Generate new prompt, close previous day's voting
  - Daily at 00:30 UTC: Calculate Bayesian scores, determine featured stories
  - Weekly: Reset weekly leaderboard, calculate writer levels
  - Monthly: Generate "Best Of" compilation

REAL-TIME FEATURES:
  - Push notification when daily prompt drops
  - Live vote counter on your story
  - "Your story was just featured!" push notification
  - Friend submission notifications: "3 friends submitted stories today"
```

---

## GAME 6: WHO SAID IT

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **TBH** | Present 4 friends' names → "Who said: [compliment]?" → Pick one. Selected friend gets anonymous notification. Core loop: 12 polls/hour. |
| **Gas** | Same mechanic: "Who has the best smile?" → 4 friend options → anonymous vote. Winner gets "Flame" notification with gender hint. God Mode reveals more. |
| **LMK** | Anonymous polls on Snapchat: "Who is most likely to...?" → friends vote → results shown to poll creator. Integration via Snapchat sticker. |
| **Polly** | Anonymous polling app on Snapchat. Create poll → share to story → friends vote → see results. Similar to LMK but more customizable. |
| **Who Said That?** (App Store) | Social guessing game: friend says a quote, you guess who said it. Direct implementation of the concept. |

### 2. Complete Game Flow

```
PHASE 1: QUOTE COLLECTION
  System collects real quotes from players' recent activity:
  → Posts, comments, story captions, bio text, vibe tags
  → Each player's recent quotes stored in a quote pool (refreshed daily)
  → Players can also submit custom quotes: "Something I actually said: ___"

PHASE 2: GUESSING ROUNDS (5 rounds)
  Player sees a quote: "I literally can't even right now 😭"
  → 4 profile avatars shown (1 correct + 3 distractors from friend group)
  → Player picks who they think said it
  → Immediate feedback: correct/wrong + reveal source (post/comment/bio)

PHASE 3: DIFFICULTY SCALING
  Round 1-2: Easy (quotes from close friends, recent posts)
  Round 3-4: Medium (quotes from extended network, older posts)  
  Round 5: Hard (anonymous quote, only vibe/context as clues)

PHASE 4: SCORING
  Correct guess: +10 points
  Speed bonus: +3 if answered in <5 seconds
  Streak bonus: +2 per consecutive correct answer
  Wrong guess: 0 points, streak resets
  Final score: Sum of 5 rounds (max 65)

PHASE 5: SOCIAL REVEAL
  After game, share results: "I got 4/5 on Who Said It! Can you beat me?"
  → Friends can challenge your score
  → "I actually said that!" reactions from quote sources
```

### 3. Opponent/Player System

- **Friend group**: Default mode. Quotes from your friend group. 4 options are always people you know.
- **Community mode**: Quotes from your broader community/school. Mix of known and unknown people.
- **Head-to-head**: Two players compete simultaneously. Same 5 quotes. Higher score wins.
- **Asynchronous challenge**: Player A plays → shares score → Player B plays same set → compare.
- **Opt-in required**: Players must enable "My quotes can be used in Who Said It" in privacy settings.

### 4. Scoring Mechanism

- **Accuracy-based**: +10 per correct, +3 speed bonus, +2 streak bonus.
- **Fairness**: Distractors are selected from the same friend group as the correct answer. No obvious mismatches.
- **Difficulty balancing**: Easy rounds use close friends' recent posts. Hard rounds use extended network + older content.
- **ELO rating**: Head-to-head mode uses ELO. Winning against higher-rated player = bigger rating gain.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Server-side answers** | Correct answer stored server-side. Client never sees it until after guessing. |
| **Randomized options** | 4 options shuffled every game. Position of correct answer randomized. |
| **Time limit** | 10 seconds per question. Prevents stalking profiles. |
| **Unique question sets** | Each game generates unique set of 5 questions. No replay value. |
| **Quote deduplication** | Same quote won't appear twice within 30 days. |
| **Privacy gating** | Only opted-in users' quotes appear. Can disable anytime. |
| **Content moderation** | AI filters inappropriate quotes before they enter the pool. |
| **No search during game** | Full-screen mode. App switching detected = question forfeited. |

### 6. Engagement Hooks

- **Daily challenge**: New set of 5 quotes every day at noon.
- **"I Know My Friends" streak**: Play daily, maintain accuracy streak.
- **Leaderboard**: "Best at reading their friends" — highest accuracy over 30 days.
- **Quote reactions**: When your quote is correctly guessed, you get notified: "3 people knew you said that!"
- **"Stump your friends"**: Submit a quote specifically designed to be hard to guess.
- **Weekly stats**: "You were guessed correctly 12 times this week. Your most recognizable quote: ___"

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  POST /api/games/who-said-it/start              — Start a game session
  POST /api/games/who-said-it/guess               — Submit guess for a round
  GET  /api/games/who-said-it/daily               — Get daily challenge
  GET  /api/games/who-said-it/leaderboard         — Accuracy leaderboard
  POST /api/games/who-said-it/submit-quote        — Submit a custom quote
  GET  /api/games/who-said-it/my-quotes           — See your quotes being used
  POST /api/games/who-said-it/challenge           — Challenge a friend

DB MODELS:
  WhoSaidItQuote {
    id, userId, text, source (post/comment/bio/custom),
    sourceId, difficulty, usageCount,
    lastUsedAt, createdAt
  }
  WhoSaidItGame {
    id, playerId, score, correctCount,
    difficulty, status,
    createdAt, completedAt
  }
  WhoSaidItRound {
    id, gameId, roundNumber,
    quoteId, quoteText,
    correctUserId, options[] (4 userIds),
    playerGuess, isCorrect,
    timeTakenMs
  }

QUOTE COLLECTION CRON:
  - Daily at 02:00 UTC: Scan recent posts/comments for quotable text
  - AI filters: min 5 words, max 50 words, no URLs, no @mentions
  - Score difficulty: common phrases = easy, unique expressions = hard
  - Store in WhoSaidItQuote pool
  - Prune quotes older than 30 days

REAL-TIME FEATURES:
  - Head-to-head: WebSocket sync for simultaneous play
  - "Someone guessed your quote!" push notification
  - Live accuracy counter on profile
```

---

## GAME 7: VIBE CHECK

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **Vibe Check (Google Play)** | "Social prediction game where reading the room wins. Get close to the most popular answer and match the community vibes to score big." Answer 5 daily questions → discover how others voted → match majority = score. |
| **Vibe Check: Opinion Quiz Game** | Answer 5 quick questions → instantly see how others voted. Match the majority opinion = score points. Daily quiz format. |
| **vibecheck (App Store)** | Share link on Instagram/Snapchat → people answer "what do people really think of you?" → see anonymous vibe tags from friends. |
| **TikTok Vibe Check** | Hand gesture game: do a gesture → friends pass/fail the vibe check. Viral trend format. |
| **Gas** | Implicit vibe check: polls like "Who has the best energy?" → community tags your vibe via vote selection. |
| **Yik Yak** | Upvote/downvote is essentially a community vibe check on your post. |

### 2. Complete Game Flow

```
PHASE 1: DAILY VIBE QUESTIONS (5 questions)
  Player opens Vibe Check → Sees 5 rapid-fire questions:
  Q1: "What's the vibe right now?" → Options: 🌊 Chill, 🔥 Lit, 😴 Sleepy, 🎯 Focused
  Q2: "Best weekend activity?" → Options: 🎮 Gaming, 🍕 Food run, 🎬 Movie, 🏃 Workout
  Q3: "Energy level today?" → Options: 🔋 Full, 🔋 Half, 🔋 Low, 💀 Dead
  Q4: "Pick your mood color" → 🔴 Red, 🔵 Blue, 🟢 Green, 🟡 Yellow
  Q5: "Current aura?" → ✨ Main character, 🌿 Side quest, 🎭 NPC, 🦋 Butterfly

  Player answers all 5 → Hits "Submit Vibe"

PHASE 2: COMMUNITY MATCH
  After answering, see how community voted on each question:
  → "47% said Chill, 30% Lit, 15% Sleepy, 8% Focused"
  → Your answer highlighted: "You matched the majority! 🔥" or "You're in the 15% 😴"
  → Score per question: Match majority = +10 points. Match 2nd place = +5. Other = +0.

PHASE 3: PERSONAL VIBE PROFILE
  Your 5 answers combine into a daily vibe card:
  → "Today's Vibe: 🌊 Chill Gamer | 🟢 Green Aura | 🔋 Half Battery"
  → Vibe card posted to profile (if opted in)
  → Friends can see your vibe card and react

PHASE 4: VIBE TAGS FROM FRIENDS
  Friends can tag your vibe in real-time: "🏷️ Chill", "🏷️ Funny", "🏷️ Mysterious"
  → Tags appear on your profile as a word cloud
  → Most common tag = your "current vibe"
  → Tags refresh weekly

PHASE 5: REWARDS
  Daily quiz: Match majority on 3+/5 → 20 tokens + "In Tune" badge
  Weekly: Top vibe matcher → 50 tokens + "Vibe Master" badge
  Vibe tags: Every 10 tags received → 10 tokens
```

### 3. Opponent/Player System

- **Community-wide (default)**: Everyone answers the same 5 questions. Results show community distribution.
- **Friend circle**: See how your specific friends voted (anonymized unless they opt in to reveal).
- **Vibe taggers**: Any friend can tag your vibe. No explicit "opponent" — it's collaborative.
- **Asynchronous**: Answer anytime within the 24-hour window. No need for simultaneous play.

### 4. Scoring Mechanism

- **Majority match**: +10 for matching the most popular answer, +5 for 2nd most popular, +0 otherwise.
- **Vibe accuracy score**: Over time, track how often you match the majority. "85% vibe accuracy" shown on profile.
- **Vibe tag consensus**: When 5+ friends tag you with the same vibe, it becomes your "confirmed vibe." More confirmations = higher vibe score.
- **Weekly vibe ranking**: "Most in tune with the community" — highest accuracy over 7 days.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Answer before seeing results** | Must submit all 5 answers before seeing community distribution. BeReal-style gate. |
| **One submission per day** | Can only answer daily quiz once. No retakes. |
| **Randomized option order** | Options shuffled per user. Prevents "always pick first" bots. |
| **Minimum community size** | Results shown only when 20+ people have answered. Prevents small-sample manipulation. |
| **Tag rate limit** | Max 10 vibe tags per day per user. Max 3 tags per friend per week. |
| **Tag abuse filter** | AI blocks offensive/inappropriate tags. Custom tags require approval. |
| **Vote integrity** | Only one vote per question per user. Server-enforced. |

### 6. Engagement Hooks

- **Daily habit**: 5 quick questions → <1 minute to play → daily check-in.
- **Vibe card collection**: Daily vibe card is shareable. Collect all vibes.
- **Streak**: Answer 7 days in a row → "Consistent Vibe" badge.
- **Leaderboard**: Weekly vibe accuracy ranking.
- **Vibe tag FOMO**: See who tagged you → "3 friends tagged your vibe" → curiosity hook.
- **Vibe comparison**: "You and [friend] have 80% vibe overlap!" → shareable.
- **Trending vibes**: See the community's collective vibe shift over time.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  GET  /api/games/vibe-check/daily               — Get today's 5 questions
  POST /api/games/vibe-check/submit               — Submit your 5 answers
  GET  /api/games/vibe-check/results              — Get community results (after submitting)
  POST /api/games/vibe-check/tag/:userId          — Tag a friend's vibe
  GET  /api/games/vibe-check/my-tags              — See your received vibe tags
  GET  /api/games/vibe-check/vibe-card            — Get your daily vibe card
  GET  /api/games/vibe-check/leaderboard          — Weekly vibe accuracy ranking
  GET  /api/games/vibe-check/compare/:friendId    — Compare vibes with a friend

DB MODELS:
  VibeCheckQuestion {
    id, text, options[] (emoji + label),
    category, date, isActive,
    createdAt
  }
  VibeCheckAnswer {
    id, userId, questionId, selectedOption,
    createdAt
  }
  VibeCheckResult {
    id, questionId, date,
    optionDistribution (JSON: {option: count}),
    totalResponses, updatedAt
  }
  VibeTag {
    id, targetUserId, taggerUserId,
    tag (emoji + text),
    createdAt
  }
  VibeCard {
    id, userId, date,
    answers (JSON), vibeLabel, auraColor,
    createdAt
  }

CRON JOBS:
  - Daily at 06:00 UTC: Generate new 5 questions, reset daily quiz
  - Hourly: Recalculate community distributions
  - Weekly: Calculate vibe accuracy rankings, reset tag counts

REAL-TIME FEATURES:
  - Push notification when daily quiz is available
  - Live community result distribution update as more people answer
  - "Someone just tagged your vibe!" push notification
  - Vibe card generation animation when submitting answers
```

---

## GAME 8: CLAPBACK

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **Clapback - Win Every Debate (App Store)** | Upload text/screenshot → pick your side → get fact-based rebuttal. Not social game; more like an AI debate tool. |
| **TikTok LIVE Battles** | Two creators go live → viewers vote by sending gifts → real-time progress bar → most votes wins. Closest analog to clapback voting. |
| **Reddit** | Post a statement → comment your clapback → upvotes determine best comeback. r/RoastMe, r/Comebacks, r/MurderedByWords. |
| **Twitter/X Quote Tweets** | Quote tweet with your clapback → likes/retweets = community vote. Organic, not gamified. |
| **DebateVote (Google Play)** | "Your Voice Matters!" Participate, vote, and share in debates. Formalized debate voting app. |

### 2. Complete Game Flow

```
PHASE 1: STATEMENT VS CLAPBACK
  Player A posts a statement (provocative opinion or claim)
  → " pineapple belongs on pizza"
  → "texting > calling"
  → "sweatpants are formal wear if you're confident enough"
  
  Player B sees the statement → writes a clapback (counter-argument or witty response)
  → OR Player A can submit both statement AND clapback, then community 
     submits ALTERNATIVE clapbacks

  FORMAT A (1v1): Player A posts statement → Player B writes clapback → community votes winner
  FORMAT B (open): Player A posts statement → community submits clapbacks → best clapback wins

PHASE 2: COMMUNITY VOTING (Using FORMAT A - 1v1 as primary)
  Statement vs Clapback shown side-by-side
  → Voters pick: "Statement W" or "Clapback W"
  → 15-second voting window per round
  → Real-time vote bar: 55% Statement | 45% Clapback

PHASE 3: BEST OF 3
  Three statement-clapback rounds
  → Win 2+ rounds = match winner
  → Each round has new statement from alternating players

PHASE 4: REWARDS
  Match winner: 40 tokens + 25 XP
  Round winner (even if lost match): 10 tokens
  "Clapback of the Day" (highest-voted clapback): 30 bonus tokens + featured
```

### 3. Opponent/Player System

- **1v1 (primary)**: Matched with random opponent or friend challenge. Alternate who posts statements vs. clapbacks.
- **Open mode (secondary)**: One player posts statement → anyone can submit clapback → best clapback (by votes) wins → clapback author gets tokens.
- **Tournament**: 8 players. Bracket format. Each match is best-of-3.
- **Friend challenge**: Challenge specific friend → they must accept within 5 min → battle begins.

### 4. Scoring Mechanism

- **Simple majority per round**: More votes = round winner.
- **Minimum 5 votes per round**: If fewer spectators, extend voting window.
- **Vote weight**: All equal (1 vote per user per round).
- **Best-of-3 match**: First to 2 round wins takes the match.
- **Clapback quality score**: Separate from winning, each clapback gets a quality score (percentage of voters who picked it). Tracked over time for leaderboard.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Simultaneous submission** | In 1v1, clapback must be submitted before seeing the statement (reactive mode: statement shown → both type simultaneously → clapback player types counter while statement player types follow-up). Actually: Statement player posts first → Clapback player sees it and responds → but both are timed (30s for clapback). |
| **Character limit** | Max 200 chars for statement, 200 for clapback. Prevents essay-length responses. |
| **Rate limit** | Max 8 Clapback matches per day. |
| **Vote integrity** | One vote per user per round. IP + account verification. |
| **Content filter** | AI blocks hate speech, personal attacks, doxxing. Must be witty, not cruel. |
| **Replay cooldown** | Same matchup can't happen within 1 hour. |
| **Collusion detection** | If two players only play each other repeatedly, flag for review. |

### 6. Engagement Hooks

- **"Clapback of the Day"**: Highest-voted clapback featured on main feed → FOMO.
- **Win streak**: 3+ wins → "Quick Tongue" badge. 10+ → "Clapback King/Queen".
- **Daily/Weekly leaderboard**: Best clapback win rate (min 5 matches).
- **"Open Mic" mode**: Drop a statement → see how the community claps back → best clapback highlighted.
- **Share card**: "My clapback got 87% of votes 💅" shareable graphic.
- **Rematch**: After match, option to rematch.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  POST /api/games/clapback/queue                  — Enter matchmaking queue
  POST /api/games/clapback/challenge              — Challenge a friend
  POST /api/games/clapback/submit-statement       — Submit statement for current round
  POST /api/games/clapback/submit-clapback        — Submit clapback for current round
  POST /api/games/clapback/vote                    — Vote on a round
  GET  /api/games/clapback/session/:id            — Get match state
  GET  /api/games/clapback/leaderboard            — Rankings
  GET  /api/games/clapback/best-of-day            — Clapback of the day
  POST /api/games/clapback/open-mic/create        — Create open mic statement
  POST /api/games/clapback/open-mic/respond       — Submit clapback to open mic

DB MODELS:
  ClapbackMatch {
    id, player1Id, player2Id,
    currentRound, status,
    player1Score, player2Score,
    createdAt, completedAt
  }
  ClapbackRound {
    id, matchId, roundNumber,
    statementText, statementAuthorId,
    clapbackText, clapbackAuthorId,
    statementVotes, clapbackVotes,
    winnerId, votingDeadline
  }
  ClapbackVote {
    id, roundId, voterId, votedFor (statement/clapback),
    createdAt
  }
  OpenMicStatement {
    id, authorId, text,
    clapbacks[] (references),
    bestClapbackId,
    status, createdAt
  }

REAL-TIME FEATURES (WebSocket):
  - Match found notification
  - Statement reveal to clapback player
  - Simultaneous typing indicator
  - Live vote counter per round
  - Round result animation
  - Match complete + reward distribution
  - Open mic: new clapback notification for statement author
```

---

## GAME 9: AURA DROP

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **Discord** | Nitro subscribers get exclusive profile badges, animated avatars, custom emoji. Status signaling through premium cosmetics. Time-limited badges for events (e.g., Snowsgiving badge). |
| **Snapchat** | Streaks (🔥 emoji + day count). Bitmoji outfits. Premium lenses. Trophy case (achievement badges, mostly inactive). Streaks are the #1 engagement hook — users fear losing streaks. |
| **Fortnite/Destiny** (gaming) | Limited-time skins, battle pass rewards, seasonal exclusives. FOMO-driven: "This skin will NEVER be available again." Creates massive demand. |
| **TikTok** | Creator badges, LIVE subscriber badges (tiered by months subscribed). Profile badges for achievements. |
| **Gas** | God Mode ($6.99/mo) → hints about who voted for you + double coins. Premium status signaling. |
| **Dispo** | Limited "film rolls" — different camera effects available for limited time. FOMO on special rolls. |
| **Poparazzi** | Pop Score (gamification metric). Feature Pop (most popular photo). Top Poparazzi badge (who tags you most). |

### 2. Complete Game Flow

```
PHASE 1: AURA DROP EVENT
  At random times (or scheduled), an "Aura Drop" occurs:
  → Push notification: "✨ AURA DROP: [Name] is live for 2 hours only!"
  → Drop contains exclusive avatar effects, badges, or profile cosmetics
  → Examples: "Neon Glow Aura", "Fire Crown Badge", "Pixel Frame", "Rainbow Border"
  → Each drop has limited quantity (e.g., only 500 available)

PHASE 2: CLAIMING
  Players rush to claim the aura:
  → Open the app → Navigate to Aura Drop → Tap "Claim"
  → Some drops are FREE (first-come, first-served)
  → Some drops cost ORRA tokens (e.g., 100 tokens)
  → Some drops require completing a mini-challenge (e.g., "Win a Roast Battle to claim")

PHASE 3: EQUIPPING
  Claimed auras appear in player's inventory
  → Equip on profile: avatar effect, border, badge, title
  → Equipped aura visible to all users on profile and in games
  → Auras have a "mint number" (e.g., #042/500) → lower = rarer = more status

PHASE 4: SECONDARY STATUS
  Auras that are no longer available become "vaulted"
  → Vaulted auras show "🔒 Season 1" tag → signals you're an OG user
  → Trading? No direct trading (prevents pay-to-win). But "aura showcase" on profile signals status.
  → End-of-season: All unclaimed auras are destroyed. Total scarcity.

PHASE 5: REWARDS FOR CREATORS
  Players who design popular auras (via submission) earn 10% of token revenue from their drops
```

### 3. Opponent/Player System

- **No opponents** — Aura Drop is an individual collection game. But it's inherently SOCIAL because:
  - Auras are visible to everyone → status signaling
  - Limited quantity creates competition (FOMO)
  - "Who has the rarest aura?" implicit competition
- **Community collaboration**: Some auras require GROUP effort: "If 100 people claim this aura, everyone gets a bonus variant"
- **Friend gifting**: Premium feature — gift an aura to a friend (costs 2x the normal price).

### 4. Scoring Mechanism

- **Not score-based** — This is a collection/status game. "Score" = rarity and prestige of your aura collection.
- **Aura Portfolio Score**: Based on number of auras owned × rarity multiplier. Rare vaulted auras = higher score.
- **Season ranking**: End-of-season ranking by portfolio score → top 10 get exclusive "Season Champion" aura.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Account verification** | Must complete onboarding + 48h old to claim drops. Prevents bot farming. |
| **One claim per account** | Each aura can only be claimed once per account. |
| **IP fingerprinting** | One claim per device per drop. Prevents multi-account farming. |
| **Rate limit** | Max 1 claim per 10 seconds. Prevents bot-speed claiming. |
| **Challenge verification** | For challenge-gated drops, verify the challenge was actually completed server-side. |
| **No trading** | Auras are soulbound (bound to account). Cannot transfer. Prevents black market. |
| **Randomized timing** | Some drops happen at random times. Prevents bot preparation. |
| **Captcha for high-demand drops** | If >1000 people are waiting, add captcha verification before claim. |

### 6. Engagement Hooks

- **FOMO**: "Only 500 available" + "2-hour window" = urgency.
- **Status signaling**: Vaulted auras show you were there early. OG status.
- **Season system**: New season = new auras every 3 months. Old ones vaulted. Collect them all.
- **Daily login reward**: Login daily → earn "Aura Shards" → collect 10 shards → redeem for a common aura.
- **Mystery drops**: "Something is dropping at 8 PM... 👀" — teaser without revealing what it is.
- **Collection showcase**: Profile page shows your rarest auras. "Aura Gallery" flex.
- **Social proof**: "3 of your friends just claimed the Fire Crown!" → FOMO trigger.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  GET  /api/games/aura-drop/active                — Get currently active drops
  POST /api/games/aura-drop/claim/:dropId         — Claim an aura drop
  GET  /api/games/aura-drop/inventory             — Get your aura inventory
  POST /api/games/aura-drop/equip/:auraId         — Equip an aura on profile
  GET  /api/games/aura-drop/portfolio             — Get your portfolio score + collection
  GET  /api/games/aura-drop/showcase/:userId      — See someone's aura showcase
  POST /api/games/aura-drop/gift                  — Gift an aura to a friend (premium)
  GET  /api/games/aura-drop/schedule              — Upcoming drop schedule
  POST /api/games/aura-drop/submit-design         — Submit an aura design for community vote

DB MODELS:
  AuraDrop {
    id, name, description,
    imageUrl, animationUrl,
    rarity (common/rare/epic/legendary),
    type (border/badge/effect/title),
    totalQuantity, claimedCount,
    price (tokens), challengeRequired,
    season, dropStartsAt, dropEndsAt,
    status (upcoming/active/vaulted),
    createdAt
  }
  AuraOwnership {
    id, userId, dropId,
    mintNumber, isEquipped,
    equippedAt, claimedAt
  }
  AuraSeason {
    id, name, number,
    startDate, endDate,
    totalDrops, status
  }
  AuraClaimLog {
    id, userId, dropId,
    claimMethod (free/purchase/challenge/gift),
    ipAddress, deviceId,
    claimedAt
  }

CRON JOBS:
  - Check for drop start times → push notifications
  - Check for drop end times → vault unclaimed auras
  - Daily: Award aura shards for daily login
  - Seasonal: Calculate portfolio scores, award season champion auras

REAL-TIME FEATURES:
  - Push notification when a drop goes live
  - Live claimed count: "423/500 claimed" counter updating in real-time
  - "Your friend just claimed [aura]!" social proof notifications
  - Equip animation when putting on an aura
  - Mystery drop countdown timer

AURA ASSET PIPELINE:
  - Designers submit PNG/SVG + Lottie animation
  - Auto-generate: border overlay, badge icon, avatar particle effect
  - Preview system before drop goes live
  - CDN hosting for fast loading
  - Fallback: static image for low-bandwidth devices
```

---

## GAME 10: TRUTH OR DARE

### 1. Real Platform Examples

| Platform | How It Works |
|----------|-------------|
| **Sendit** | Q&A app for Snapchat. Post sticker on story → friends ask anonymous questions → answer on story. Game modes include "Truth or Dare", "Never Have I Ever", "Would You Rather". Premium ($1.99) for more game modes + reveal who sent messages. |
| **NGL** | Similar to Sendit. Anonymous Q&A on Instagram/Snapchat. Share link → receive anonymous messages → answer publicly. Premium reveals hints about sender. |
| **LMK** | Anonymous polls for Snapchat. Create poll → share sticker → friends vote → see results. "Truth or Dare" mode available. |
| **Truth or Dare apps** (many on app stores) | Traditional format: spin the bottle / random selection → truth question or dare challenge → 5 difficulty levels (Fun → Soft Hot → Hard → Extreme). Multiplayer via device passing or online rooms. |
| **Truth and Dare Roulette** (App Store) | Spin the bottle, flip a coin, reveal secrets. Online multiplayer with random people. |

### 2. Complete Game Flow

```
PHASE 1: GAME SETUP
  Player opens Truth or Dare → Creates a game room (or joins existing)
  → Sets parameters: 
    - Mode: Friends Only / Open (random players can join)
    - Intensity: Mild 🌶️ / Medium 🌶️🌶️ / Spicy 🌶️🌶️🌶️
    - Max players: 2-8
  → Shares room link or invites friends

PHASE 2: TURN ROTATION
  Players take turns in order:
  → Current player selects: "Truth 🤔" or "Dare 🔥"
  → If TRUTH: Community/audience submits truth questions → most upvoted question is asked
  → If DARE: Community/audience submits dares → most upvoted dare is assigned
  → Player has 60 seconds to complete the truth/dare
  → After completing: other players vote "Did they do it?" (✅ Completed / ❌ Chickened Out)

PHASE 3: COMMUNITY SUBMISSION
  While it's someone's turn, spectators and other players can submit:
  → Truth questions: "What's the last lie you told?"
  → Dares: "Post 'I love Justin Bieber' on your story for 5 minutes"
  → Submissions are visible to all → upvote/downvote determines which is asked
  → Top-voted submission at the 15-second mark becomes the official question/dare

PHASE 4: SCORING
  Completed truth: +5 points
  Completed dare: +10 points (dares are harder)
  Chickened out: -3 points
  Best submission (your submitted question/dare gets picked): +5 points
  Game ends after X rounds (default: 3 rounds per player)
  → Highest score wins

PHASE 5: REWARDS
  Winner: 40 tokens + 25 XP + "Bold" badge progress
  Every player: 10 tokens + 5 XP for participation
  "Best Dare Idea" (most upvoted dare submission): 20 bonus tokens
```

### 3. Opponent/Player System

- **Friend room (primary)**: Create room → invite 2-8 friends → turn-based play.
- **Random matchmaking**: Join a public room with random players (2-8 per room).
- **Audience mode**: Even non-players can watch and submit questions/dares + vote on completion.
- **Pass-the-phone mode**: Local multiplayer. Pass device between turns. No network needed.
- **Asynchronous variant**: Post a truth/dare sticker to your story → friends submit questions → you answer on story → they vote if you completed it.

### 4. Scoring Mechanism

- **Completion-based**: +5 for truth, +10 for dare. -3 for chickening out.
- **Community vote on completion**: Other players + audience vote whether the response satisfies the truth/dare. Majority rules.
- **Submission bonus**: +5 if your submitted question/dare is selected (most upvoted).
- **Boldness multiplier**: Selecting dare on 🌶️🌶️🌶️ mode gives 1.5x points.
- **End condition**: After 3 rounds per player, highest score wins.

### 5. Anti-Cheat Measures

| Measure | Implementation |
|---------|---------------|
| **Content moderation** | AI filters inappropriate dares/truths per intensity level. 🌶️ mild = no sexual content. 🌶️🌶️🌶️ = more permissive but still no harassment. |
| **Submission rate limit** | Max 5 submissions per turn. Prevents spam. |
| **Completion verification** | For dares: photo/video evidence required. For truths: no verification (honor system + community vote). |
| **Vote integrity** | One vote per user per completion check. Can't vote on your own completion. |
| **Intensity lock** | Can't change intensity mid-game. Prevents bait-and-switch. |
| **Reporting** | Players can report inappropriate dares/truths. 3 reports = auto-removed. |
| **Room moderation** | Room creator can kick players and remove inappropriate submissions. |
| **Consent mechanism** | Before game starts, all players agree to the intensity level. Anyone can leave anytime. |

### 6. Engagement Hooks

- **Daily dare**: "Today's dare: Send your best friend a random compliment" → 10 tokens for completing.
- **Room streak**: Play with the same group 3 days in a row → "Squad" badge.
- **Best submission leaderboard**: "Most creative dare ideas" weekly ranking.
- **Story integration**: Answer truths/dares directly on your ORRA story → friends see your answers.
- **Dare challenge**: Challenge a specific friend to a dare → they must complete within 24h or lose points.
- **Spicy mode unlocks**: Complete 10 mild games → unlock medium. 10 medium → unlock spicy.

### 7. Implementation Blueprint for ORRA

```
API ENDPOINTS:
  POST /api/games/truth-dare/create-room          — Create a game room
  POST /api/games/truth-dare/join-room/:code      — Join a room with code
  POST /api/games/truth-dare/select               — Choose truth or dare
  POST /api/games/truth-dare/submit-question      — Submit a truth/dare question
  POST /api/games/truth-dare/vote-submission      — Upvote/downvote a submission
  POST /api/games/truth-dare/complete             — Mark truth/dare as completed
  POST /api/games/truth-dare/vote-completion      — Vote if someone completed their dare
  GET  /api/games/truth-dare/room/:id             — Get room state
  GET  /api/games/truth-dare/daily-dare           — Get today's dare
  POST /api/games/truth-dare/challenge-friend     — Challenge a friend to a specific dare

DB MODELS:
  TruthOrDareRoom {
    id, creatorId, code,
    intensity (mild/medium/spicy),
    maxPlayers, currentPlayers,
    currentTurnIndex, currentRound,
    totalRounds, status (waiting/active/complete),
    createdAt, completedAt
  }
  TruthOrDarePlayer {
    id, roomId, userId,
    score, truthCount, dareCount,
    chickenOutCount, joinOrder
  }
  TruthOrDareSubmission {
    id, roomId, submitterId,
    type (truth/dare), text,
    upvotes, downvotes,
    isSelected, createdAt
  }
  TruthOrDareTurn {
    id, roomId, playerId,
    choice (truth/dare),
    selectedSubmissionId,
    completed, completionVotesYes,
    completionVotesNo,
    evidenceUrl, timeTakenMs,
    createdAt
  }

REAL-TIME FEATURES (WebSocket):
  - Room state sync (who's in, whose turn, current scores)
  - Live submission feed (questions/dares being submitted)
  - Live upvote/downvote on submissions
  - "Selection!" animation when top submission is chosen
  - Timer countdown for completion
  - Live completion voting
  - Turn rotation notification
  - "It's your turn!" push notification

INTENSITY CONTENT POLICY:
  Mild 🌶️: No sexual content, no illegal activity suggestions, no personal attacks
  Medium 🌶️🌶️: Mild romantic content OK, no explicit content, no dangerous dares
  Spicy 🌶️🌶️🌶️: Romantic content OK, no explicit content, no dangerous/illegal dares
  ALL levels: AI moderation + user reporting. Immediate removal for policy violations.
```

---

## CROSS-CUTTING: SHARED INFRASTRUCTURE FOR ORRA

### Shared API Patterns

All 10 games share these common endpoints:

```
POST /api/games/:gameType/complete    — Complete a game session (server validates + distributes rewards)
GET  /api/games/:gameType/history     — Get player's game history
GET  /api/games/:gameType/stats       — Get player's stats for this game
GET  /api/games/notifications         — Get game-related notifications
GET  /api/games/leaderboard/global    — Global XP leaderboard across all games
```

### Shared DB Models

```
GameSession {
  id, gameType (enum of 10 games),
  status, createdAt, completedAt
}

GameParticipant {
  id, sessionId, userId,
  score, placement, rewardTokens, rewardXP,
  joinedAt
}

GameReward {
  id, userId, gameType, sessionId,
  tokens, xp, badgeId,
  createdAt
}

GameLeaderboard {
  id, gameType, period (daily/weekly/alltime),
  userId, rank, score, gamesPlayed, winRate,
  updatedAt
}
```

### Shared Anti-Cheat Layer

```
GameAntiCheat {
  // Applied to ALL games universally:
  - Rate limiting: 10 game completions/hour per user
  - Minimum duration: 5s solo, 15s multiplayer per game
  - Account age: 24h+ to play, 48h+ to vote
  - IP fingerprinting: one vote per IP per round/fit/take
  - Device fingerprinting: prevent multi-account farming
  - Token action unique constraint: [userId, action, targetId]
  - Score validation: max reasonable bounds per game type
  - Shadow banning: suspicious accounts see UI but actions don't count
  - Bot detection: behavioral analysis (too-fast actions, repetitive patterns)
}
```

### Shared Real-Time Infrastructure

```
WebSocket Events (Socket.IO):
  - game:matched          — Match found for competitive games
  - game:round:start      — New round begins
  - game:submit           — Player submitted their response
  - game:reveal           — Responses revealed
  - game:vote:update      — Vote count changed
  - game:round:result     — Round winner determined
  - game:complete         — Game session complete
  - game:notification     — Push notification trigger
  
WebSocket Rooms:
  - game:{sessionId}              — Players in a specific game
  - game:{sessionId}:spectate     — Spectators watching a game
  - user:{userId}                 — Personal notification channel
  - leaderboard:{gameType}        — Live leaderboard updates
```

### Engagement Hooks Matrix

| Hook | Roast Battle | Hot Take | First Impression | Rate My Fit | Story Challenge | Who Said It | Vibe Check | Clapback | Aura Drop | Truth or Dare |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Daily streak | ✓ | ✓ | | | ✓ | ✓ | ✓ | | ✓ | ✓ |
| Win streak | ✓ | | | | | | | ✓ | | |
| Leaderboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Badges | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Featured content | ✓ | ✓ | | ✓ | ✓ | | | ✓ | | ✓ |
| Shareable card | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ |
| FOMO/limited | | | | | | | | | ✓ | |
| Social proof | ✓ | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |

---

## SUMMARY: KEY DESIGN PRINCIPLES FROM REAL PLATFORMS

1. **TBH/Gas (Nikita Bier)** proved: **Positive-only + anonymous + polls = viral**. The 12-polls/hour limit created scarcity. Gems/coins rewarded participation. God Mode monetized curiosity. **ORRA should adopt**: Limited daily plays + curiosity-driven monetization + positive vibes default.

2. **Yik Yak** proved: **Pseudonymous + local + upvote/downvote = community**. Yakarma points rewarded participation. 5-mile radius created locality. **ORRA should adopt**: Community-scoped content + karma-style points + local discovery.

3. **Reddit r/RoastMe** proved: **Verification + consent + community votes = safe roasting**. The handwritten sign requirement is genius. **ORRA should adopt**: Explicit opt-in for roasting + visual consent signal + community moderation.

4. **Hot or Not** proved: **1-10 rating + trimmed mean + percentiles = fair rating**. The original had 165M+ users. Side-by-side comparison mode was more engaging than solo rating. **ORRA should adopt**: Trimmed means + percentile rankings + side-by-side comparison for Fit Battle.

5. **BeReal** proved: **Submit-before-view + time pressure + authenticity = engagement**. The 2-minute window + "posted late" tag created urgency and authenticity. **ORRA should adopt**: Submit-before-vote gates across games where applicable.

6. **Sendit/NGL** proved: **Anonymous Q&A + story integration + premium reveal = monetization**. The "who sent this?" curiosity is the #1 monetization driver. **ORRA should adopt**: Anonymity by default + premium reveal features + story sticker integration.

7. **Poparazzi** proved: **Others create your profile + Pop Score + no selfies = social creativity**. Your profile isn't curated by you — it's made by friends. **ORRA should adopt**: Friend-sourced profile content where possible (vibe tags, first impression data).

8. **Dispo** proved: **Delayed gratification + communal viewing = emotional investment**. The 9 AM "development" created a daily communal moment. **ORRA should adopt**: Scheduled reveals + communal viewing moments (e.g., Vibe Check results at 8 PM, Aura Drop at specific times).

9. **Snapchat Streaks** proved: **Daily commitment + visible counter + fear of loss = retention**. Streaks are the #1 reason teens open Snapchat daily. **ORRA should adopt**: Visible daily streaks across all games with fear-of-loss mechanics.

10. **Discord Nitro** proved: **Premium cosmetics + status signaling + limited badges = monetization**. Exclusive profile effects and badges create perceived value. **ORRA should adopt**: Aura Drop premium cosmetics + seasonal exclusivity + visible status signals.
