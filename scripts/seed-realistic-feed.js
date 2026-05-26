/**
 * ORRA Realistic Feed Seeder
 * Generates personality-driven posts, comments, likes, and interactions
 * to make the feed look alive and natural — no test/generic content.
 * 
 * Creates ~400 realistic posts spread across all 16 bots with proper
 * time spacing, comments, reactions, and engagement.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================================
// BOT PROFILES (same as auto-poster)
// ============================================================================
const BOT_PROFILES = {
  u1:  { name: 'Jessica Art',     personality: 'creative',    topics: ['art', 'design', 'creativity', 'culture'],              vibeTags: ['dramatic', 'peaceful', 'chill'],   speechStyle: ['fr', 'ngl', 'literally', 'obsessed'] },
  u2:  { name: 'David Chen',      personality: 'analytical',  topics: ['tech', 'AI', 'coding', 'gadgets'],                    vibeTags: ['focused', 'news', 'chill'],        speechStyle: ['honestly', 'think about it', 'the data says', 'interesting'] },
  u3:  { name: 'Sarah Kim',       personality: 'trendy',      topics: ['fashion', 'beauty', 'trends', 'pop culture'],         vibeTags: ['dramatic', 'hyped', 'chill'],      speechStyle: ['period', 'no cap', 'bestie', 'slay'] },
  u4:  { name: 'Marcus Rivera',   personality: 'athletic',    topics: ['sports', 'fitness', 'competition', 'NBA'],            vibeTags: ['hyped', 'sports', 'focused'],      speechStyle: ['lets go', 'no excuses', 'grind', 'real talk'] },
  u5:  { name: 'Elena Rodriguez', personality: 'adventurous', topics: ['food', 'travel', 'cooking', 'culture'],               vibeTags: ['chill', 'peaceful', 'dramatic'],   speechStyle: ['mi gente', 'listen', 'trust me', 'beloved'] },
  u6:  { name: 'Tech Daily',      personality: 'informative', topics: ['tech news', 'AI', 'startups', 'apps'],                vibeTags: ['news', 'focused', 'chill'],        speechStyle: ['reporting', 'sources say', 'update', 'breaking'] },
  u7:  { name: 'Wellness Guru',   personality: 'mindful',     topics: ['wellness', 'meditation', 'mental health', 'yoga'],    vibeTags: ['peaceful', 'chill', 'focused'],    speechStyle: ['remember', 'breathe', 'you deserve', 'gentle reminder'] },
  u8:  { name: 'Cyber Drifter',   personality: 'edgy',        topics: ['cyberpunk', 'hacking', 'digital culture', 'memes'],   vibeTags: ['dramatic', 'chill', 'hyped'],      speechStyle: ['lol', 'imagine', 'anyway', 'we live in a society'] },
  u9:  { name: 'Music Central',   personality: 'musical',     topics: ['music', 'albums', 'concerts', 'hip-hop'],             vibeTags: ['chill', 'hyped', 'dramatic'],      speechStyle: ['this goes hard', 'on repeat', 'no skip', 'real music'] },
  u10: { name: 'Luna Sky',        personality: 'philosophical',topics: ['philosophy', 'art', 'poetry', 'nature'],             vibeTags: ['peaceful', 'dramatic', 'chill'],   speechStyle: ['what if', 'think about', 'imagine', 'have you ever'] },
  u11: { name: 'Kai Storm',       personality: 'bold',        topics: ['culture', 'opinions', 'trends', 'social issues'],     vibeTags: ['dramatic', 'hyped', 'news'],       speechStyle: ['hot take', 'fight me', 'I said what I said', 'period'] },
  u12: { name: 'Nova Blaze',      personality: 'competitive', topics: ['gaming', 'esports', 'ranked', 'competitions'],        vibeTags: ['hyped', 'sports', 'focused'],      speechStyle: ['gg', 'ez', 'no shot', 'built different'] },
  u13: { name: 'Zara Miles',      personality: 'social',      topics: ['fashion', 'events', 'social life', 'beauty'],         vibeTags: ['dramatic', 'hyped', 'chill'],      speechStyle: ['obsessed', 'literally', 'iconic', 'can we talk about'] },
  u14: { name: 'Jay Parker',      personality: 'humorous',    topics: ['gaming', 'memes', 'anime', 'comedy'],                 vibeTags: ['laughing', 'chill', 'dramatic'],   speechStyle: ['lmao', 'im dead', 'no way', 'bro'] },
  u15: { name: 'Maya Chen',       personality: 'warm',        topics: ['food blogging', 'recipes', 'baking', 'home cooking'], vibeTags: ['chill', 'peaceful', 'dramatic'],   speechStyle: ['you guys', 'trust me on this', 'recipe drop', 'comfort food'] },
  u16: { name: 'Dre Williams',    personality: 'innovative',  topics: ['music production', 'beats', 'studio', 'hip-hop'],     vibeTags: ['hyped', 'focused', 'chill'],       speechStyle: ['cooking up', 'in the lab', 'no cap', 'fire'] },
};

const BOT_IDS = Object.keys(BOT_PROFILES);

// ============================================================================
// REALISTIC POST CONTENT — Organized by bot personality
// ============================================================================
const POSTS_BY_BOT = {
  u1: [ // Jessica Art - creative/artistic
    "Just spent 6 hours on this digital piece and the neon gradients are absolutely hitting. Every layer tells a story",
    "Thrift store art haul! Found 3 original paintings for $15 total. The universe rewards the patient",
    "Color theory tip: complementary colors create tension, analogous colors create harmony. Play with both",
    "My studio is finally organized and suddenly the creative block is gone. Environment matters more than we think",
    "New mural concept sketched out. This one's going to cover an entire wall — biggest project yet",
    "The difference between good art and great art is the willingness to start over. Learned that the hard way today",
    "Art supply haul! These new alcohol markers blend like a dream. My illustration game just leveled up",
    "Finished the portrait series I've been working on for 2 months. Each face tells a completely different story",
    "Procreate brush settings are a rabbit hole but once you find your perfect combo, magic happens",
    "Gallery opening tonight! Nervous but excited to see my work on actual walls with actual lighting",
    "The best creativity happens when you stop trying to be perfect and just let your hands move",
    "Mixed media experiment went surprisingly well. Watercolor and digital is an underrated combination",
    "Inspiration board update. Sometimes you need to surround yourself with beauty to create beauty",
    "Client revision number 47... but honestly the final product is so much better than the original concept",
    "Teaching my first art workshop next month. Nervous? Yes. Excited? Absolutely. Let's do this",
  ],
  u2: [ // David Chen - analytical/tech
    "Just deployed a Rust microservice that handles 50k requests per second. The performance gains are unreal",
    "Hot take: most startups don't need microservices. A well-architected monolith will serve you better for years",
    "Spent the weekend building an AI agent that automates my entire morning routine. Productivity hack of the century",
    "The new Claude model just solved a coding problem I've been stuck on for 3 days in literally 30 seconds",
    "WebAssembly is quietly becoming the most important technology nobody talks about enough",
    "If your code doesn't have tests, it's just a collection of coincidences that happen to work. For now",
    "Finally migrated our database from PostgreSQL to SQLite with better results. Simplicity wins again",
    "The best engineering decision is often the one that lets you delete code instead of writing more",
    "Been exploring local-first software architecture and it completely changes how you think about apps",
    "Open source contribution #100 just got merged. Consistency beats intensity every single time",
    "AI coding assistants are getting scary good. Not replacing developers, but definitely changing the job",
    "Technical debt is like credit card debt. Easy to accumulate, painful to pay off, and it compounds",
    "The documentation nobody writes is the documentation everyone needs. Be the change you want to see",
    "Just optimized a query from 8 seconds to 12 milliseconds. Database indexing is basically magic",
    "The gap between prototype and production is where 90% of engineering actually happens",
  ],
  u3: [ // Sarah Kim - trendy/fashion
    "Quiet luxury is out, bold statements are in. This season is all about making them look twice",
    "Just styled the same blazer 5 different ways and every look could be a magazine cover honestly",
    "Skin care routine update: added retinol and my skin has never been smoother. Game changer period",
    "The best fashion advice I ever got: dress for yourself first. Everything else falls into place",
    "Y2K revival is hitting different this year. The low-rise debate can stay in the past though",
    "Found the perfect vintage bag at a flea market in Paris. Some things are just meant to be",
    "Minimalist makeup but maximalist accessories is the move. Let the jewelry do the talking",
    "My capsule wardrobe experiment is going on month 3 and I've never gotten more compliments",
    "Sustainable fashion doesn't mean boring. These upcycled pieces are genuinely incredible",
    "Hair transformation complete! Went from brunette to copper and I feel like a whole new person",
    "The right pair of boots can change your entire mood. I stand by this completely",
    "Fashion week street style is genuinely more inspiring than the runway shows sometimes",
    "Perfume is the invisible accessory that completes every outfit. What's your signature scent?",
    "Thrifted a designer coat for $20 and the tag was still on it. The thrill of the find never gets old",
    "Getting ready is my favorite part of going out. The process, the music, the transformation",
  ],
  u4: [ // Marcus Rivera - athletic/sports
    "4:30 AM alarm for 5 AM training. The discipline isn't sexy but the results definitely are",
    "Just hit a new deadlift PR — 405lbs. Months of grinding and it finally paid off",
    "The offseason is where championships are won. Nobody sees the work, everyone sees the results",
    "Basketball pickup games at the park > fancy gym workouts. Real movement, real competition",
    "Recovery is not optional. Ice bath, stretch, sleep. Repeat. Your body will thank you",
    "Training alone builds mental toughness that no team practice can replicate. Embrace the solitude",
    "Just finished a 12-week program and the before/after photos are insane. Consistency is everything",
    "The best athletes aren't the most talented. They're the most disciplined. Prove me wrong",
    "Game day energy is unmatched. There's nothing like the feeling before tipoff",
    "Meal prep for the week done in 90 minutes. Fuel your body right and everything else follows",
    "That soreness after leg day is a reminder that you showed up. Wear it like a badge",
    "Sports teach you more about life than any classroom. Resilience, teamwork, grace under pressure",
    "Morning run through the city while everyone's still asleep. These are the moments that define you",
    "Watching game film is the most underrated part of getting better. Study the craft",
    "The grind doesn't stop because you're tired. It stops when you're done. Let's work",
  ],
  u5: [ // Elena Rodriguez - adventurous/food/travel
    "Lisbon at sunset is something no photo can capture. Some moments you just have to live",
    "Made paella from scratch and it took 4 hours but every minute was worth it. Recipe in bio",
    "The best meals of my life have been at tiny restaurants with no English menu. Trust the locals",
    "Just got back from 2 weeks in Portugal and I'm already planning the next trip. Wanderlust is real",
    "Morning market runs in a new city are my favorite way to experience local culture. The energy is electric",
    "Homemade empanadas recipe passed down from my abuela. Some traditions are worth preserving exactly as they are",
    "Street food in Bangkok changed my entire understanding of flavor. Spicy, sweet, sour, umami — all at once",
    "Travel tip: skip the tourist restaurants. Walk 3 blocks in any direction and eat where the locals eat",
    "Cooking for friends is my love language. Tonight's menu: tapas, wine, and 4 hours of conversation",
    "Found a family-owned vineyard in Tuscany that's been making wine for 6 generations. The stories in every bottle",
    "The secret to perfect rice is not lifting the lid. Patience in cooking, patience in life",
    "Sunrise hike to Machu Picchu was the most physically demanding and rewarding experience of my life",
    "Every culture has a comfort food that tastes like home. Mine is arroz con pollo. What's yours?",
    "Spice markets in Marrakech are a sensory overload in the best possible way. Colors, smells, flavors",
    "Cooking class in Oaxaca taught me more about mole than any cookbook ever could. Hands-on learning hits different",
  ],
  u6: [ // Tech Daily - informative/tech news
    "Breaking: Apple just announced their new AI framework and it's going to reshape how apps are built",
    "The AI regulation debate is heating up and both sides make valid points. Here's what you need to know",
    "GitHub Copilot just helped me ship a feature in 2 hours that would've taken 2 days. The productivity shift is real",
    "Startup funding is down 40% this quarter but the companies that survive will be the strongest ones",
    "The shift to local AI models is happening faster than expected. Privacy and performance without the cloud",
    "Electric vehicle sales just hit a new record. The infrastructure is finally catching up to demand",
    "New cybersecurity report: 80% of breaches could be prevented with basic hygiene. The fundamentals still matter",
    "The creator economy is now worth $250 billion and it's still just getting started",
    "Quantum computing just passed a major milestone. We're closer to practical applications than most people think",
    "Open source AI models are catching up to proprietary ones. The democratization of tech is accelerating",
    "The remote work debate is over. Hybrid won. Now the question is how to do it right",
    "SpaceX just landed another booster and it barely made news. We've normalized rocket science and that's wild",
    "The next big thing in tech isn't a product — it's how existing tools connect to create new workflows",
    "AI art tools are getting so good that the question isn't can AI be creative — it's what does creativity even mean",
    "Smart home devices finally work together seamlessly. The connected home era is actually here",
  ],
  u7: [ // Wellness Guru - mindful
    "Morning breathwork: 4 counts in, 7 counts hold, 8 counts out. 3 rounds. Notice the difference",
    "The most radical act of self-care is setting boundaries with people who drain your energy",
    "You can't pour from an empty cup. Today's reminder that rest is productive too",
    "5 minutes of meditation before checking your phone changes the entire trajectory of your day",
    "Your body keeps the score. If something feels off, it probably is. Listen before it screams",
    "Gratitude journal entry: 3 things I'm thankful for today. This practice rewires your brain over time",
    "Digital detox day 3: the anxiety is gone and I can actually hear my own thoughts again",
    "Walking meditation is underrated. No phone, no podcast, just you and your steps. Try it for 10 minutes",
    "The pressure to be constantly productive is the most toxic wellness trend. Sometimes doing nothing is the work",
    "Nervous system regulation tip: cold water on your wrists resets your stress response in seconds",
    "Sleep is the foundation of every other wellness practice. Fix your sleep before fixing anything else",
    "The relationship you have with yourself sets the tone for every other relationship in your life",
    "Unpopular opinion: burnout isn't a badge of honor. It's a warning sign that something needs to change",
    "Yoga isn't about touching your toes. It's about what you learn on the way down. Every practice is different",
    "Therapy check-in: showing up for yourself even when it's hard is the bravest thing you can do",
  ],
  u8: [ // Cyber Drifter - edgy/cyberpunk
    "The internet was supposed to be the frontier of freedom and somehow we built digital panopticons",
    "Imagine explaining 2026 internet culture to someone from 2005. They'd think we're in a dystopia",
    "Anyway the simulation glitched again today. Just another Tuesday in the timeline",
    "We live in a society where your data is worth more than your attention. Think about that",
    "Just spent 3 hours in a rabbit hole about abandoned websites from the 90s. The internet has ghosts",
    "The aesthetic of technology has shifted from hopeful to ominous and honestly I'm here for the vibes",
    "Neon signs, rain-slicked streets, and lo-fi beats. Some aesthetics just hit different at 2am",
    "Hot take: social media is just a really elaborate MMORPG where the NPCs think they're players",
    "The line between cyberpunk fiction and reality is getting thinner by the day and nobody's talking about it",
    "Found an ARG that's been running since 2019 and the community around it is absolutely fascinating",
    "Remember when the internet felt like an adventure instead of a shopping mall? I miss that",
    "Digital minimalism is the new counterculture. Logging off is the new logging on",
    "The most cyberpunk thing about 2026 is that we have the technology for utopia but choose dystopia",
    "Every platform is just a different themed room in the same digital casino. House always wins",
    "Retro computing is the new vintage. There's something beautiful about technology with visible constraints",
  ],
  u9: [ // Music Central - musical
    "This album dropped at midnight and I've already listened 7 times. No skips. Not one",
    "The way a perfect bridge can completely transform a song is something non-musicians don't appreciate enough",
    "Vinyl hunting in a new city is my favorite way to explore. Found a first press today that made my whole trip",
    "Live music energy is irreplaceable. The crowd, the bass, the moment — it's a spiritual experience",
    "Producer tip: sometimes the best move is removing elements instead of adding them. Space is music too",
    "The evolution of hip-hop over the last decade is the most fascinating story in music. Subgenres on subgenres",
    "Music festival lineup just dropped and I'm already budgeting for tickets. Priorities are priorities",
    "That feeling when you discover an artist and they already have 4 albums to binge? Best kind of overwhelm",
    "The relationship between producer and artist is underrated. The right beat can unlock something magical",
    "Studio session went until 4am but we made something genuinely special. Sleep is temporary, music is forever",
    "Unpopular opinion: albums should be listened to in order, start to finish. The sequencing matters",
    "Just discovered a genre I never knew existed and now my entire playlist sounds different. Music does that",
    "The art of the sample is underrated. Taking something familiar and making it entirely new is pure creativity",
    "Open mic night energy is different. Raw, unfiltered, unpredictable. That's where real music lives",
    "Sound engineering is the invisible art. The best mixes are the ones you don't notice — you just feel",
  ],
  u10: [ // Luna Sky - philosophical
    "What if the questions we're afraid to ask are exactly the ones that would set us free?",
    "Sat by the river for an hour today and realized how rarely we let ourselves just exist without purpose",
    "The spaces between words carry as much meaning as the words themselves. Listen to the silence",
    "We spend so much time becoming who we think we should be that we forget to discover who we actually are",
    "Have you ever noticed that the most profound moments happen when you stop trying to make them happen?",
    "The night sky is the oldest story ever told. Every civilization has looked up and wondered the same things",
    "Perhaps the purpose of art is not to answer questions but to help us ask better ones",
    "Time doesn't heal everything. But it does give you the perspective to carry things differently",
    "The ocean doesn't try to be powerful. It just is. There's a lesson in that somewhere",
    "What we call chaos is often just a pattern we haven't learned to see yet",
    "Growing older is just trading certainty for nuance. And that's not a loss, it's a liberation",
    "The most interesting people I've met are the ones who are comfortable with not having all the answers",
    "Stillness isn't emptiness. It's the space where clarity lives. We just rarely give ourselves permission to find it",
    "Every ending is a beginning wearing a different mask. The cycle is the point, not the destination",
    "We don't see the world as it is. We see it as we are. Change yourself, change everything",
  ],
  u11: [ // Kai Storm - bold/opinionated
    "Hot take: consistency is more impressive than talent. Show up every day and watch what happens",
    "I said what I said — comfort zones are where dreams go to die slowly. Get uncomfortable",
    "Stop asking for permission to be great. Nobody who ever changed the world waited for an invitation",
    "The people who judge you for being ambitious are the same ones who'll ask how you did it later",
    "Unpopular opinion: not every opinion deserves a platform. Some takes are just wrong and that's fine",
    "If your first response to someone else's success is jealousy, that's a you problem. Fix it",
    "Real talk: the difference between where you are and where you want to be is the work you're avoiding",
    "Everyone wants the result but nobody wants the process. The process IS the point",
    "The loudest critics are always the ones doing the least. Facts. Focus on the builders, not the talkers",
    "Having standards isn't being picky. It's knowing your worth. Never apologize for that",
    "Controversial take: reading books without applying them is just expensive entertainment. Execute",
    "The same people who say it can't be done are always watching when someone does it. Keep going",
    "Confidence isn't knowing you'll succeed. It's knowing you'll be fine either way. That's the difference",
    "If you're the smartest person in the room, you're in the wrong room. Surround yourself with greatness",
    "Stop waiting for the right moment. Create it. Period.",
  ],
  u12: [ // Nova Blaze - competitive/gaming
    "Just hit Grandmaster rank after 600 hours of grinding. Built different. The stats don't lie",
    "GG to everyone in that tournament. Some of the best matches I've ever played. This community is elite",
    "That clutch 1v5 play literally made my whole week. Clip is going viral and I'm here for it",
    "Ranked grind update: 8 win streak and counting. The zone is real. Everything is clicking",
    "Esports career update: just signed with a new team. This season is going to be absolutely insane",
    "The difference between good and great players isn't mechanics — it's decision making under pressure",
    "New setup complete. 240Hz monitor and the gameplay feels completely different now. Every frame matters",
    "The gaming community on ORRA is actually so supportive. No toxicity, just good competition. Rare find",
    "Speed run PB broken by 3 seconds. Those 3 seconds took 200 attempts. That's the grind",
    "Game review: this one actually lives up to the hype. 9/10, would recommend to anyone who loves a challenge",
    "Late night gaming session turned into the best clutch of my life. My squad lost their minds",
    "The meta shift is wild this patch. Had to completely relearn my main but adaptation is the game",
    "Training regimen: 2 hours aim practice, 3 hours ranked, 1 hour VOD review. Champions are made in the lab",
    "Co-stream event tonight! Dropping gameplay and commentary. Come through and let's get some Ws",
    "Retro gaming night with the squad. Sometimes you need to go back to the classics to remember why you started",
  ],
  u13: [ // Zara Miles - social/fashion/lifestyle
    "Brunch outfit check and the lighting in this cafe is doing all the work honestly",
    "Can we talk about how this event was the most iconic night of the year? Still not over it",
    "Outfit repeater and proud. If it's a good look, it deserves a second appearance",
    "The best nights are the unplanned ones. Ended up at a rooftop party and it was everything",
    "Getting ready with the girls is the event. Whatever happens after is just a bonus",
    "Style inspo update: just organized my entire Pinterest board by season and I'm feeling inspired",
    "Pop-up market finds! Supporting local designers is the move. Unique pieces > mass production",
    "The right accessory can take a basic outfit to a whole new level. It's all in the details",
    "Event season is here and my calendar is booked. Every weekend through next month. Let's go",
    "Self-care Sunday: face mask, iced matcha, and reorganizing my closet. Productive relaxation",
    "Can we normalize being the friend who takes cute photos of everyone? It's a service honestly",
    "Fashion hack: belt everything. A good belt completely transforms a silhouette. Trust me on this",
    "The art of getting ready is underrated. The playlist, the outfit selection, the transformation",
    "Just discovered the best nail artist and my nails are a literal masterpiece. Book them immediately",
    "Sunday reset complete. Meal prep, laundry, skincare, and planning the week. Ready to dominate",
  ],
  u14: [ // Jay Parker - humorous/gaming/memes
    "Me: I'll play just one more match. Also me at 3am: just one more match",
    "The way my brain forgets everything important but remembers every meme from 2016 is concerning",
    "No because why did my WiFi choose the exact moment of the final boss to disconnect",
    "POV: You said you'd go to bed 3 hours ago but now you're watching speedrun documentaries",
    "Just spent 45 minutes looking at my phone to pick a show and then went to bed without watching anything",
    "My search history would either make me look like a genius or an absolute menace. No in between",
    "The transition from 'I'm going to sleep early tonight' to 3am deep dives is seamless at this point",
    "Ranked matchmaking really said 'you're doing too well, here's some teammates from the shadow realm'",
    "Anime recommendation list for anyone who needs to feel something: I've got you covered",
    "The amount of times I've laughed at my own jokes is embarrassing but also I'm hilarious so",
    "Tried to explain my job to my family and now they think I hack the mainframe. Close enough",
    "Hot pocket at 2am hits different than a hot pocket at any other time. Science can't explain this",
    "When the loading screen takes longer than your attention span so you start scrolling and forget you were playing",
    "My cat just judged me for missing that easy shot and honestly she's right. Unacceptable gameplay",
    "The duality of man: confident in ranked, anxious about making a phone call",
  ],
  u15: [ // Maya Chen - warm/food blogging
    "Made my grandmother's soup recipe today and the whole house smells like home. Some recipes are time travel",
    "Sunday baking: cinnamon rolls from scratch. The dough needs 2 rises but patience makes them perfect",
    "Recipe drop! One-pan lemon garlic chicken that takes 30 minutes and tastes like a restaurant meal",
    "The secret to the best chocolate chip cookies: brown butter and sea salt on top. You're welcome",
    "Farmers market haul! Seasonal cooking is the best way to eat. Let the ingredients lead",
    "Comfort food season is here and I've already made 4 batches of mac and cheese. No regrets",
    "Kitchen tip: toast your spices before using them. It takes 30 seconds and changes everything",
    "Made ramen from scratch — 48 hour broth, handmade noodles. This is what weekend projects are for",
    "Food is love made visible. Every meal I cook for someone carries more than just flavor",
    "Bread baking update: finally nailed the crumb structure after 15 attempts. Persistence pays off in baking",
    "The best meals are the ones shared with people you love. The food is almost secondary",
    "Homemade pasta > dried pasta and I will die on this hill. The texture difference is massive",
    "Breakfast for dinner is the most underrated meal concept. Pancakes at 8pm are elite",
    "Just discovered the perfect cookie recipe and I've made it 6 times this month. My friends are concerned",
    "Slow cooker meals for busy weekdays. Set it in the morning, come home to dinner. Life changing",
  ],
  u16: [ // Dre Williams - innovative/music production
    "In the lab cooking up something special. 4 new beats today and they're all fire",
    "Just finished a collab track that blends jazz samples with 808s. The contrast is everything",
    "Studio session update: 12 hours in and we finally found the sound. The creative process can't be rushed",
    "Beat making live stream tonight! Building a track from scratch with audience suggestions. Come vibe",
    "The art of sampling is finding the 2 seconds of a song that contain an entire universe of emotion",
    "New plugin alert: this synth is creating sounds I've never heard before. Inspiration overload",
    "Hip-hop production tip: the kick and bass relationship is everything. Get that right and the track breathes",
    "Just signed a sync deal! My music is going to be in a TV show. Dreams really do come true",
    "The difference between a beat and a production is arrangement. Anyone can make a loop. Tell a story",
    "6 beats this week. No cap, this is the most productive I've been all year. The zone is real",
    "Music theory is not the enemy of creativity. It's a tool that opens doors you didn't know existed",
    "Late night studio sessions hit different. No distractions, just you and the sound",
    "Every great album has a track that almost didn't make it. Trust the process, not the doubt",
    "Sound design exploration: making drums from everyday objects. The kitchen is an underrated studio",
    "The best producers are the ones who serve the song, not their ego. Less is more",
  ],
};

// ============================================================================
// REALISTIC COMMENT TEMPLATES
// ============================================================================
const COMMENT_POOL = {
  supportive: [
    "This is so real!", "Can't stop thinking about this", "You always post the best stuff",
    "Needed to hear this today", "This hit different", "You just spoke my whole mind",
    "Facts on facts on facts", "You never miss with these", "This resonates so deeply",
    "Reading this at the perfect time", "This deserves way more attention", "I felt this in my soul",
    "You put into words what I couldn't", "This is why I follow you",
  ],
  reactive: [
    "Wait this is actually so good", "Okay but this is INSANE", "No because why is this so accurate",
    "I'm not okay after reading this", "I literally just gasped", "This broke something in me",
    "This sent chills down my spine", "I had to sit with this for a minute", "My jaw actually dropped",
    "Stop I was literally just thinking about this",
  ],
  casual: [
    "Say more though", "Tell me more about this", "Okay but elaborate?",
    "Drop the details!", "Wait I need the full story", "This needs a part 2",
    "I'm invested now. Continue.", "More of this energy please",
  ],
  funny: [
    "Not me reading this at 3am", "Why is this so personal though", "The way this attacked me specifically",
    "I feel called out rn", "Who gave you permission to read my mind", "Blink twice if you're okay",
    "The accuracy is physically painful", "I'm crying why is this so relatable",
  ],
  personalitySpecific: {
    u1: ["The aesthetics of this are everything", "Your creative vision is unmatched", "This is pure art"],
    u2: ["The data backs this up too", "Interesting analysis", "From a technical standpoint, this checks out"],
    u4: ["Let's gooo", "That's the grind mindset", "Beast mode activated"],
    u5: ["This made me so hungry", "Now I need to try this"],
    u7: ["Such a grounding post", "Breathe in, breathe out", "This centered me"],
    u8: ["Chaos reigns", "This is the timeline we deserve", "Absolutely unhinged and I respect it"],
    u9: ["The rhythm of this though", "This is music to my ears", "No skips"],
    u10: ["Deep thoughts only", "Philosophically speaking, this hits", "The layers to this"],
    u11: ["Bold take and I respect it", "No cap this is real", "You always say what everyone's thinking"],
    u12: ["Built different post", "GG well said", "Elite content right here"],
    u13: ["The aesthetic is giving", "Iconic energy", "Can we appreciate this more"],
    u14: ["LMAOOO I can't", "Bro this sent me", "Dead at this"],
    u15: ["Recipe when??", "This looks incredible", "Food content never misses"],
    u16: ["This goes hard", "Cooking with fire", "The production quality is insane"],
  },
};

// ============================================================================
// REACTION TYPES
// ============================================================================
const REACTION_TYPES = ['like', 'wow', 'omg', 'wtf', 'laughing', 'sad', 'care', 'prayers'];

// ============================================================================
// MAIN SEEDER
// ============================================================================
async function main() {
  console.log('🌱 ORRA Realistic Feed Seeder');
  console.log('=============================\n');

  const nickId = 'cmor7se4b0000neqmmpej7m6j';
  const allUserIds = [nickId, ...BOT_IDS];

  // Track current post count
  const postsBefore = await prisma.post.count();
  console.log(`📊 Posts before seeding: ${postsBefore}`);

  // Get existing post IDs for commenting/liking
  const existingPostIds = (await prisma.post.findMany({ select: { id: true } })).map(p => p.id);

  // ============================================================================
  // STEP 1: Create realistic posts with time-staggered dates
  // ============================================================================
  console.log('\n📝 Step 1: Creating realistic bot posts...');
  
  const allNewPosts = [];
  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  for (const botId of BOT_IDS) {
    const posts = POSTS_BY_BOT[botId];
    const profile = BOT_PROFILES[botId];
    
    for (let i = 0; i < posts.length; i++) {
      // Stagger posts over the last 14 days
      const hoursAgo = Math.random() * 14 * 24; // 0-14 days ago
      const createdAt = new Date(now - hoursAgo * HOUR);
      
      const vibeTag = profile.vibeTags[Math.floor(Math.random() * profile.vibeTags.length)];
      
      allNewPosts.push({
        text: posts[i],
        images: '[]',
        vibeTag,
        type: 'text',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        authorId: botId,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  // Sort by createdAt so feed is chronological
  allNewPosts.sort((a, b) => a.createdAt - b.createdAt);

  // Insert in batches
  const POST_BATCH = 50;
  let totalInserted = 0;
  for (let i = 0; i < allNewPosts.length; i += POST_BATCH) {
    const batch = allNewPosts.slice(i, i + POST_BATCH);
    const result = await prisma.post.createMany({ data: batch });
    totalInserted += result.count;
  }
  console.log(`   ✅ Created ${totalInserted} realistic posts`);

  // ============================================================================
  // STEP 2: Add comments to posts (both old and new)
  // ============================================================================
  console.log('\n💬 Step 2: Adding realistic comments...');

  const allPostIds = (await prisma.post.findMany({ select: { id: true } })).map(p => p.id);
  const allComments = [];
  const commentCategories = Object.keys(COMMENT_POOL);

  // Each post gets 0-6 comments
  for (const postId of allPostIds) {
    const numComments = Math.floor(Math.random() * 7); // 0-6
    for (let c = 0; c < numComments; c++) {
      const commenterId = BOT_IDS[Math.floor(Math.random() * BOT_IDS.length)];
      
      // Pick comment type with weights
      let commentPool;
      const rand = Math.random();
      if (rand < 0.3) {
        commentPool = COMMENT_POOL.supportive;
      } else if (rand < 0.5) {
        commentPool = COMMENT_POOL.reactive;
      } else if (rand < 0.65) {
        commentPool = COMMENT_POOL.casual;
      } else if (rand < 0.8) {
        commentPool = COMMENT_POOL.funny;
      } else {
        // Personality specific
        const specificPool = COMMENT_POOL.personalitySpecific[commenterId];
        commentPool = specificPool || COMMENT_POOL.supportive;
      }
      
      const commentText = commentPool[Math.floor(Math.random() * commentPool.length)];
      
      // Comment timestamp should be after post creation
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { createdAt: true } });
      const commentTime = new Date(post.createdAt.getTime() + Math.random() * 48 * HOUR);
      
      allComments.push({
        text: commentText,
        postId,
        authorId: commenterId,
        createdAt: commentTime,
      });
    }
  }

  // Insert comments in batches
  const COMMENT_BATCH = 100;
  let totalComments = 0;
  for (let i = 0; i < allComments.length; i += COMMENT_BATCH) {
    const batch = allComments.slice(i, i + COMMENT_BATCH);
    try {
      const result = await prisma.comment.createMany({ data: batch });
      totalComments += result.count;
    } catch (e) {
      // Skip batches that fail (e.g., if postId reference is stale)
    }
  }
  console.log(`   ✅ Created ${totalComments} comments`);

  // ============================================================================
  // STEP 3: Add likes/reactions to posts
  // ============================================================================
  console.log('\n❤️  Step 3: Adding realistic likes/reactions...');

  const allLikes = [];
  const likeSet = new Set(); // Prevent duplicates

  // Each post gets 0-12 likes from random users
  for (const postId of allPostIds) {
    const numLikes = Math.floor(Math.random() * 13); // 0-12
    const likers = new Set();
    
    for (let l = 0; l < numLikes; l++) {
      const likerId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
      if (likers.has(likerId)) continue; // No duplicate likes
      likers.add(likerId);
      
      const key = `${likerId}-${postId}-post`;
      if (likeSet.has(key)) continue;
      likeSet.add(key);
      
      // Most reactions are "like", with occasional other types
      const reactionRand = Math.random();
      let reactionType = 'like';
      if (reactionRand > 0.85) reactionType = 'wow';
      else if (reactionRand > 0.75) reactionType = 'laughing';
      else if (reactionRand > 0.68) reactionType = 'omg';
      else if (reactionRand > 0.62) reactionType = 'care';
      
      allLikes.push({
        userId: likerId,
        targetId: postId,
        targetType: 'post',
        reactionType,
        createdAt: new Date(now - Math.random() * 14 * DAY),
      });
    }
  }

  // Insert likes in batches
  const LIKE_BATCH = 100;
  let totalLikes = 0;
  for (let i = 0; i < allLikes.length; i += LIKE_BATCH) {
    const batch = allLikes.slice(i, i + LIKE_BATCH);
    try {
      const result = await prisma.like.createMany({ data: batch });
      totalLikes += result.count;
    } catch (e) {
      // Skip duplicate key errors
    }
  }
  console.log(`   ✅ Created ${totalLikes} likes/reactions`);

  // ============================================================================
  // STEP 4: Add some comment likes
  // ============================================================================
  console.log('\n👍 Step 4: Adding comment likes...');

  const allCommentIds = (await prisma.comment.findMany({ select: { id: true } })).map(c => c.id);
  const commentLikes = [];
  const commentLikeSet = new Set();

  // Sample comments to like (not all)
  const commentsToLike = allCommentIds.filter(() => Math.random() < 0.3); // 30% of comments get likes
  
  for (const commentId of commentsToLike) {
    const numLikes = Math.floor(Math.random() * 5) + 1; // 1-5 likes
    const likers = new Set();
    
    for (let l = 0; l < numLikes; l++) {
      const likerId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
      if (likers.has(likerId)) continue;
      likers.add(likerId);
      
      const key = `${likerId}-${commentId}-comment`;
      if (commentLikeSet.has(key)) continue;
      commentLikeSet.add(key);
      
      commentLikes.push({
        userId: likerId,
        targetId: commentId,
        targetType: 'comment',
        reactionType: 'like',
        createdAt: new Date(now - Math.random() * 7 * DAY),
      });
    }
  }

  let totalCommentLikes = 0;
  for (let i = 0; i < commentLikes.length; i += LIKE_BATCH) {
    const batch = commentLikes.slice(i, i + LIKE_BATCH);
    try {
      const result = await prisma.like.createMany({ data: batch });
      totalCommentLikes += result.count;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`   ✅ Created ${totalCommentLikes} comment likes`);

  // ============================================================================
  // STEP 5: Update post counters to reflect actual engagement
  // ============================================================================
  console.log('\n🔄 Step 5: Updating post counters...');

  const allPostsForUpdate = await prisma.post.findMany({ select: { id: true } });
  for (const post of allPostsForUpdate) {
    const actualLikes = await prisma.like.count({
      where: { targetId: post.id, targetType: 'post' }
    });
    const actualComments = await prisma.comment.count({
      where: { postId: post.id }
    });
    const actualShares = await prisma.repost.count({
      where: { postId: post.id }
    });
    await prisma.post.update({
      where: { id: post.id },
      data: {
        likesCount: actualLikes,
        commentsCount: actualComments,
        sharesCount: actualShares,
      }
    });
  }
  console.log(`   ✅ Updated counters on ${allPostsForUpdate.length} posts`);

  // ============================================================================
  // FINAL STATS
  // ============================================================================
  console.log('\n📊 Final Stats:');
  console.log(`   Posts: ${await prisma.post.count()}`);
  console.log(`   Comments: ${await prisma.comment.count()}`);
  console.log(`   Likes: ${await prisma.like.count()}`);
  console.log(`   Reposts: ${await prisma.repost.count()}`);
  console.log(`   Stories: ${await prisma.story.count()}`);
  console.log(`   Reels: ${await prisma.reel.count()}`);
  console.log(`   Notifications: ${await prisma.notification.count()}`);

  // Show sample feed
  const feedSample = await prisma.post.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { text: true, authorId: true, likesCount: true, commentsCount: true, vibeTag: true, createdAt: true }
  });
  console.log('\n📰 Feed Preview (top 10):');
  for (const p of feedSample) {
    const author = p.authorId === nickId ? 'Nick' : BOT_PROFILES[p.authorId]?.name || p.authorId;
    console.log(`  [${author}] (${p.likesCount}❤ ${p.commentsCount}💬 #${p.vibeTag}) ${p.text.substring(0, 70)}...`);
  }

  console.log('\n🎉 Realistic feed seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
