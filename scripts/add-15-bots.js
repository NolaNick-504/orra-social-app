/**
 * ORRA — Add 15 New Bots + Seed Realistic Content
 * 
 * Creates 15 new bot users (u17–u31) with:
 * - Realistic name, handle, bio, location, website
 * - AI-generated profile pictures
 * - Profile songs
 * 
 * Then seeds realistic posts with AI-generated images that MATCH post text,
 * contextually relevant comments, likes/reactions, and follows.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ============================================================================
// 15 NEW BOT PROFILES
// ============================================================================
const NEW_BOTS = [
  {
    id: 'u17',
    name: 'Aisha Patel',
    handle: 'aishapatel',
    bio: 'YC-backed founder building the future of education tech. Failed 3 startups before this one. Every failure was a lesson. Now we are scaling and I am learning to lead. Here to share the real founder journey — no highlight reel',
    location: 'San Francisco, CA',
    website: 'https://learnsphere.io',
    personality: 'entrepreneurial',
    topics: ['startups', 'tech', 'leadership', 'hustle culture'],
    vibeTags: ['focused', 'hyped', 'news'],
    speechStyle: ['real talk', 'lesson learned', 'not gonna lie', 'grind'],
    emotions: ['determined', 'humbled', 'fired up', 'grateful', 'restless'],
    avatarPrompt: 'Professional headshot of a young Indian-American woman entrepreneur, confident smile, dark hair in a sleek bun, business casual blazer, warm lighting, professional corporate photography',
    songTitle: 'Hustle & Motivate',
    songArtist: 'Nipsey Hussle',
  },
  {
    id: 'u18',
    name: 'Jake Morrison',
    handle: 'jakemorrison',
    bio: 'Landscape photographer chasing light across 47 countries. National Geographic contributor. My camera has seen more sunrises than my bed. Currently based in Patagonia. Available for prints and workshops',
    location: 'Patagonia, Argentina',
    website: 'https://jakemorrison.photo',
    personality: 'adventurous',
    topics: ['photography', 'travel', 'nature', 'adventure'],
    vibeTags: ['peaceful', 'dramatic', 'chill'],
    speechStyle: ['chasing light', 'honestly', 'the golden hour said', 'worth the hike'],
    emotions: ['awestruck', 'grateful', 'wanderlust', 'peaceful', 'inspired'],
    avatarPrompt: 'Rugged outdoor photographer, white man with sun-weathered skin and a scruffy beard, wearing a Patagonia vest and beanie, camera around neck, mountain backdrop, golden hour lighting, adventure portrait photography',
    songTitle: 'On the Nature of Daylight',
    songArtist: 'Max Richter',
  },
  {
    id: 'u19',
    name: 'Priya Sharma',
    handle: 'priyasharma',
    bio: 'Cardiologist by day, dance fitness instructor by night. Heart health is my profession AND my passion. Mixing Bollywood moves with science-backed wellness. Your heart deserves both joy and care',
    location: 'Chicago, IL',
    website: 'https://heartbeatsfitness.com',
    personality: 'warm',
    topics: ['health', 'dance', 'wellness', 'science', 'fitness'],
    vibeTags: ['hyped', 'chill', 'peaceful'],
    speechStyle: ['listen', 'your heart knows', 'science says', 'trust the process'],
    emotions: ['compassionate', 'energized', 'caring', 'passionate', 'nurturing'],
    avatarPrompt: 'Smiling Indian woman doctor in scrubs with a stethoscope, warm brown eyes, long dark hair, professional yet approachable, hospital corridor with natural light, medical professional portrait photography',
    songTitle: 'Dancing Queen',
    songArtist: 'ABBA',
  },
  {
    id: 'u20',
    name: 'Diego Flores',
    handle: 'diegoflores',
    bio: 'Michelin-starred chef who started in a food truck. Mexican-Japanese fusion is my love language. Every dish tells two stories. Currently running two restaurants and a ghost kitchen. No sleep but plenty of salsa',
    location: 'Los Angeles, CA',
    website: 'https://diegoflores.kitchen',
    personality: 'passionate',
    topics: ['food', 'cooking', 'restaurants', 'fusion cuisine', 'chef life'],
    vibeTags: ['dramatic', 'hyped', 'chill'],
    speechStyle: ['mi familia', 'in the kitchen', 'flavor first', 'simmer down'],
    emotions: ['passionate', 'hungry', 'proud', 'fired up', 'nostalgic'],
    avatarPrompt: 'Charismatic Mexican male chef in a white chef coat, warm smile, tattoos on forearms, kitchen background with copper pots, professional culinary portrait, warm restaurant lighting',
    songTitle: 'Besar',
    songArtist: 'Juanes',
  },
  {
    id: 'u21',
    name: 'Nadia Kowalski',
    handle: 'nadiakowalski',
    bio: 'Olympic weightlifter and mental health advocate. Bronze medalist who almost quit 100 times. The barbell taught me discipline, therapy taught me grace. Strong is beautiful in every form',
    location: 'Portland, OR',
    website: 'https://nadiakowalski.fit',
    personality: 'resilient',
    topics: ['fitness', 'mental health', 'Olympics', 'strength training', 'body positivity'],
    vibeTags: ['hyped', 'focused', 'peaceful'],
    speechStyle: ['stronger every day', 'no shortcuts', 'the weight teaches you', 'real ones know'],
    emotions: ['determined', 'proud', 'vulnerable', 'unstoppable', 'grateful'],
    avatarPrompt: 'Strong athletic woman with short blonde hair, powerlifter build, wearing athletic gear, gym background, confident expression, sports portrait photography with dramatic lighting',
    songTitle: 'Lose Yourself',
    songArtist: 'Eminem',
  },
  {
    id: 'u22',
    name: 'Theo Washington',
    handle: 'theowashington',
    bio: 'Hip-hop journalist and cultural critic. Writing for The Source, Complex, and anyone who will listen. The culture deserves documentation, not exploitation. Every story has layers — I am here to uncover them all',
    location: 'Atlanta, GA',
    website: 'https://theowashington.medium.com',
    personality: 'intellectual',
    topics: ['hip-hop', 'culture', 'journalism', 'social issues', 'music history'],
    vibeTags: ['news', 'dramatic', 'focused'],
    speechStyle: ['the culture demands', 'on record', 'let me break it down', 'fact check'],
    emotions: ['analytical', 'passionate', 'concerned', 'inspired', 'calling it out'],
    avatarPrompt: 'Stylish Black man with locs pulled back, wearing a vintage band tee and gold chains, holding a notebook, urban background, editorial portrait photography, magazine quality',
    songTitle: 'Alright',
    songArtist: 'Kendrick Lamar',
  },
  {
    id: 'u23',
    name: 'Mika Tanaka',
    handle: 'mikatanaka',
    bio: 'Anime director and storyboard artist. Worked on 3 Crunchyroll originals. Japanese animation is not just entertainment — it is art, philosophy, and emotion rendered frame by frame. Currently directing my first feature',
    location: 'Tokyo, Japan',
    website: 'https://mikatanaka.art',
    personality: 'creative',
    topics: ['anime', 'animation', 'art', 'Japanese culture', 'storytelling'],
    vibeTags: ['dramatic', 'peaceful', 'chill'],
    speechStyle: ['frame by frame', 'the story demands', 'in the animation', 'sakuga hours'],
    emotions: ['inspired', 'obsessed', 'melancholy', 'transcendent', 'determined'],
    avatarPrompt: 'Creative Japanese woman with asymmetrical bob haircut and round glasses, wearing an oversized vintage anime tee, art studio background with storyboards, creative portrait, soft natural lighting',
    songTitle: 'Sparkle',
    songArtist: 'RADWIMPS',
  },
  {
    id: 'u24',
    name: 'Jordan Blake',
    handle: 'jordanblake',
    bio: 'Skateboarder. Sneakerhead. Streetwear designer. Built a brand from my garage that is now in 12 boutiques. The streets raised me and the culture made me. Every design comes from a real place — no factory ideas',
    location: 'Brooklyn, NY',
    website: 'https://blakestreets.com',
    personality: 'authentic',
    topics: ['skateboarding', 'streetwear', 'sneakers', 'design', 'street culture'],
    vibeTags: ['hyped', 'chill', 'dramatic'],
    speechStyle: ['the streets said', 'no frontin', 'skate or die', 'real recognize real'],
    emotions: ['stoked', 'unbothered', 'hyped', 'loyal', 'raw'],
    avatarPrompt: 'Cool mixed-race person with dreads under a beanie, wearing oversized streetwear and custom sneakers, holding a skateboard, Brooklyn rooftop background, street style portrait, urban golden hour',
    songTitle: 'Skateboard P',
    songArtist: 'Pharrell Williams',
  },
  {
    id: 'u25',
    name: 'Camille Dubois',
    handle: 'camilledubois',
    bio: 'Sommelier turned natural wine advocate. French-born, Napa-based. The wine world is elitist and that needs to change. Good wine should not cost your rent. Currently running a wine club and a popup tasting series',
    location: 'Napa Valley, CA',
    website: 'https://camillewines.club',
    personality: 'refined',
    topics: ['wine', 'food', 'hospitality', 'French culture', 'entertaining'],
    vibeTags: ['chill', 'peaceful', 'dramatic'],
    speechStyle: ['mon ami', 'the terroir speaks', 'trust your palate', 'cheers to that'],
    emotions: ['sophisticated', 'indulgent', 'warm', 'curious', 'appreciative'],
    avatarPrompt: 'Elegant French woman with auburn hair in a loose chignon, wearing a linen blouse, wine glass in hand, vineyard background during golden hour, lifestyle portrait, warm sophisticated lighting',
    songTitle: 'La Vie en Rose',
    songArtist: 'Edith Piaf',
  },
  {
    id: 'u26',
    name: 'Kwame Asante',
    handle: 'kwameasante',
    bio: 'Afrobeats DJ and cultural bridge builder. Born in Accra, raised in London, now based in NYC. Every set is a love letter to the diaspora. Music connects what borders try to divide. Catch me at a venue near you',
    location: 'New York, NY',
    website: 'https://kwameasante.dj',
    personality: 'vibrant',
    topics: ['Afrobeats', 'DJ culture', 'music', 'African diaspora', 'nightlife'],
    vibeTags: ['hyped', 'dramatic', 'chill'],
    speechStyle: ['the rhythm connects', 'selecta', 'one love', 'the diaspora dances'],
    emotions: ['electric', 'unified', 'vibing', 'proud', 'celebratory'],
    avatarPrompt: 'Stylish Black man with a fade haircut and gold earrings, wearing a patterned African-print jacket, DJ decks in background with colored lights, nightlife portrait, vibrant energetic lighting',
    songTitle: 'Essence',
    songArtist: 'Wizkid ft. Tems',
  },
  {
    id: 'u27',
    name: 'Riley Chen',
    handle: 'rileychen',
    bio: 'Full-stack developer and open source maintainer. Shipped 3 CLI tools with 10k+ GitHub stars. Code is poetry if you know how to read it. Mentoring 20 junior devs this year. The tech community gave me everything — now I give back',
    location: 'Seattle, WA',
    website: 'https://rileychen.dev',
    personality: 'generous',
    topics: ['coding', 'open source', 'tech community', 'mentorship', 'developer tools'],
    vibeTags: ['focused', 'chill', 'news'],
    speechStyle: ['shipped it', 'in the codebase', 'PR welcome', 'the community builds'],
    emotions: ['satisfied', 'curious', 'helpful', 'accomplished', 'inspired'],
    avatarPrompt: 'Friendly East Asian person with glasses and a slight smile, wearing a plain hoodie, laptop background with code on screen, cozy home office, warm natural lighting, casual tech portrait',
    songTitle: 'Code',
    songArtist: 'Kanye West',
  },
  {
    id: 'u28',
    name: 'Sofia Reyes',
    handle: 'sofiareyes',
    bio: 'Interior designer making luxury accessible. Your space should tell YOUR story. Dominican from the Bronx who now designs for celebrities. But my favorite project was a studio apartment in Queens. Design is for everyone',
    location: 'New York, NY',
    website: 'https://sofiareyes.design',
    personality: 'creative',
    topics: ['interior design', 'architecture', 'home decor', 'luxury lifestyle', 'DIY design'],
    vibeTags: ['dramatic', 'chill', 'peaceful'],
    speechStyle: ['your space speaks', 'design is personal', 'the vision came together', 'trust the process'],
    emotions: ['inspired', 'proud', 'creative', 'satisfied', 'transformed'],
    avatarPrompt: 'Stylish Dominican woman with curly hair, wearing statement earrings and a bold blazer, standing in a beautifully designed modern living room, interior design portrait, warm ambient lighting',
    songTitle: 'Mi Gente',
    songArtist: 'J Balvin',
  },
  {
    id: 'u29',
    name: 'Liam OConnor',
    handle: 'liamoconnor',
    bio: 'Stand-up comedian and podcast host. Making people laugh is the best drug. 500+ shows, 2 comedy specials, 1 podcast with 200k downloads. The world is absurd and I am just the narrator. Laughter is survival',
    location: 'Austin, TX',
    website: 'https://liamoconnorcomedy.com',
    personality: 'witty',
    topics: ['comedy', 'stand-up', 'podcasting', 'pop culture', 'absurd life moments'],
    vibeTags: ['laughing', 'chill', 'dramatic'],
    speechStyle: ['hear me out', 'no but seriously', 'and thats the joke', 'crowd went wild'],
    emotions: ['hilarious', 'observational', 'absurd', 'unbothered', 'wheezing'],
    avatarPrompt: 'Funny white guy with messy brown hair and a slight smirk, wearing a casual flannel shirt, comedy club green room background, warm dim lighting, comedian headshot style',
    songTitle: 'Everyday Struggle',
    songArtist: 'Biggie Smalls',
  },
  {
    id: 'u30',
    name: 'Yuna Park',
    handle: 'yunapark',
    bio: 'K-beauty content creator and skincare formulator. Chemistry degree meets beauty obsession. 12-step routines are not mandatory — good skin is about knowing YOUR skin, not copying someone elses. Science-backed beauty only',
    location: 'Seoul, South Korea',
    website: 'https://yunapark.beauty',
    personality: 'knowledgeable',
    topics: ['skincare', 'K-beauty', 'cosmetics chemistry', 'wellness', 'beauty trends'],
    vibeTags: ['chill', 'focused', 'dramatic'],
    speechStyle: ['the science says', 'skin first', 'ingredient check', 'your skin your rules'],
    emotions: ['glowing', 'informed', 'confident', 'nurturing', 'curious'],
    avatarPrompt: 'Beautiful Korean woman with flawless glass skin and minimal makeup, wearing a cream-colored turtleneck, soft pastel background, K-beauty aesthetic portrait, soft diffused lighting, clean and bright',
    songTitle: 'Gentleman',
    songArtist: 'PSY',
  },
  {
    id: 'u31',
    name: 'Marcus Green',
    handle: 'marcusgreen',
    bio: 'Urban farmer and sustainability advocate. Growing food on rooftops and transforming concrete jungles into green spaces. Food justice is social justice. Everyone deserves access to fresh, affordable produce. From the soil up',
    location: 'Detroit, MI',
    website: 'https://greeninthecity.org',
    personality: 'community-minded',
    topics: ['urban farming', 'sustainability', 'food justice', 'community', 'environment'],
    vibeTags: ['peaceful', 'focused', 'chill'],
    speechStyle: ['from the soil up', 'the community grows', 'rooted in purpose', 'plant the seed'],
    emotions: ['grounded', 'hopeful', 'determined', 'nurturing', 'connected'],
    avatarPrompt: 'Warm Black man with a gentle smile, wearing a worn denim shirt and garden gloves, standing in a lush urban rooftop garden, natural sunlight, documentary-style portrait, green tones',
    songTitle: 'Redemption Song',
    songArtist: 'Bob Marley',
  },
];

// ============================================================================
// REALISTIC POST CONTENT FOR EACH NEW BOT
// ============================================================================
const POSTS_BY_NEW_BOT = {
  u17: [ // Aisha Patel — founder/entrepreneur
    { text: "Just closed our Series A. 18 months of rejections, 147 investor meetings, and one yes that changed everything. The journey is humbling", vibeTag: 'focused', hasImage: true, imagePrompt: 'Startup office celebration, confetti, team cheering, modern co-working space, bright natural light, candid photography' },
    { text: "Hot take: the best founders are not the ones who never fail. They are the ones who fail, learn, and get back up faster than anyone else. Resilience over perfection", vibeTag: 'focused' },
    { text: "3rd startup anniversary. We almost ran out of money twice. The team took pay cuts. And somehow we made it. Grateful does not begin to cover it", vibeTag: 'chill', hasImage: true, imagePrompt: 'Small startup team dinner at a long table, candles, warm lighting, diverse group laughing together, candid lifestyle photography' },
    { text: "Pitch deck tip: if you cannot explain your business in one sentence, you do not understand it well enough yet. Clarity is your superpower", vibeTag: 'news' },
    { text: "The loneliest part of being a founder is making decisions that affect 30+ families. The weight is real. But so is the responsibility. No shortcut around that", vibeTag: 'focused' },
    { text: "Hiring update: we just brought on our first VP of Engineering and she is already changing the culture. Invest in people who challenge you", vibeTag: 'hyped' },
    { text: "Rejection count this week: 8. Acceptance count: 1. That 1 is all that matters. Keep pushing", vibeTag: 'hyped' },
    { text: "Real talk: imposter syndrome does not go away when you raise funding. It just gets louder. You learn to work with the voice, not silence it", vibeTag: 'focused' },
    { text: "Board meeting went well. Key lesson: show them the hard problems, not just the wins. Transparency builds trust faster than a perfect deck", vibeTag: 'news' },
    { text: "Startup life means celebrating a million-dollar milestone with cold pizza at 11pm. Would not trade it for anything though", vibeTag: 'chill', hasImage: true, imagePrompt: 'Pizza boxes on a conference table with laptops, late night office, city lights through window, startup culture, casual candid photography' },
    { text: "The best advice I ever got: your company culture is not what you write on the wall. It is what you tolerate when no one is watching", vibeTag: 'focused' },
    { text: "Customer feedback call that changed our roadmap completely. Listening is a competitive advantage. Most companies are too busy talking to hear", vibeTag: 'news' },
  ],
  u18: [ // Jake Morrison — landscape photographer
    { text: "Patagonia at dawn. Woke up at 3am, hiked 2 hours in the dark, and this was the reward. Nature does not disappoint if you show up", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Dramatic Patagonia mountain landscape at dawn, Torres del Paine peaks with golden light, mirror-like lake reflection, professional landscape photography, ultra wide angle', multiImage: true },
    { text: "The best camera is the one you have with you. Shot this on my phone during a morning walk. Good light does not care about gear", vibeTag: 'chill', hasImage: true, imagePrompt: 'Misty forest path with golden sunbeams, morning dew on ferns, atmospheric nature photography, shallow depth of field, warm tones' },
    { text: "47 countries and counting. But the most beautiful sunrise I have ever seen was in my own backyard. Travel expands your eyes to see what was always there", vibeTag: 'peaceful' },
    { text: "Photography tip: stop chasing the perfect shot. The perfect shot is the one that makes you feel something. Technique is secondary to emotion", vibeTag: 'chill' },
    { text: "Aurora borealis finally made an appearance. My hands were numb, the tripod was shaking, and somehow everything aligned. Magic moments do not wait for comfort", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Northern lights dancing over a frozen lake in Iceland, vibrant green and purple aurora, starry sky, silhouette of photographer, long exposure landscape photography' },
    { text: "Golden hour lasts exactly 23 minutes. In those 23 minutes you learn everything about patience, preparation, and letting go. Photography is life in miniature", vibeTag: 'dramatic' },
    { text: "Desert sandstone at sunset. The colors are not edited — the earth just gets this dramatic when the light is right", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Red sandstone rock formations at sunset, Arizona desert, warm orange and red tones, dramatic cloud formations, professional landscape photography' },
    { text: "Workshop announcement! Join me in Iceland this September for a week of landscape photography and Northern Lights chasing. Limited to 8 people", vibeTag: 'focused' },
    { text: "The quiet moments between shots are the real gift. Standing alone on a mountain, no noise, no notifications. Just you and the light", vibeTag: 'peaceful' },
    { text: "New print collection available. From Patagonia to Iceland, every image has a story. Link in bio", vibeTag: 'chill', hasImage: true, imagePrompt: 'Beautiful gallery wall with landscape photography prints, minimalist white walls, warm spot lighting, art gallery ambiance, interior photography' },
    { text: "Rain in the forest is not bad weather — it is atmosphere. The mist, the saturated colors, the reflections. Learn to love every condition", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Misty redwood forest in rain, saturated green moss on tree trunks, water droplets on ferns, atmospheric forest photography, deep moody tones' },
  ],
  u19: [ // Priya Sharma — cardiologist/dance fitness
    { text: "Fact: dancing for 30 minutes lowers your cortisol levels by 25%. Science backs what Bollywood has known for centuries. Move your body, heal your heart", vibeTag: 'hyped' },
    { text: "Morning rounds then evening dance class. Two ways I keep hearts healthy — one with medicine, one with joy. Both matter equally", vibeTag: 'chill', hasImage: true, imagePrompt: 'Woman in scrubs transitioning to dance pose, hospital hallway, joyful expression, split lighting between clinical and colorful, creative portrait photography' },
    { text: "Patient told me today that my dance class helped more than the medication. That is not medical advice — but it IS proof that joy heals in ways we are still learning to measure", vibeTag: 'peaceful' },
    { text: "Heart health tip you probably have not heard: laughter actually does improve endothelial function. So yes, that comedy special counts as cardio", vibeTag: 'chill' },
    { text: "Just finished a 12-hour shift and somehow still had energy to teach dance class. Adrenaline is wild. Or maybe purpose is a better fuel than coffee", vibeTag: 'hyped' },
    { text: "Bollywood dance fitness class was PACKED tonight. 40 people moving together is the most beautiful kind of chaos. Community healing in real time", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Energetic dance fitness class with diverse group of people, colorful studio lights, movement and joy, instructor in front, vibrant group fitness photography' },
    { text: "The heart does not care about your job title. It cares about how you treat it. Hydrate, move, sleep, and please — get your annual checkup", vibeTag: 'focused' },
    { text: "New research: walking 10 minutes after every meal reduces blood sugar spikes by 30%. The simplest interventions are often the most powerful", vibeTag: 'news' },
    { text: "When my patients ask me what exercise is best, I say: the one you will actually do. Consistency beats intensity every single time. Your heart agrees", vibeTag: 'peaceful' },
    { text: "Dance break in the doctor lounge. My colleagues think I am crazy but the blood pressure readings do not lie", vibeTag: 'chill', hasImage: true, imagePrompt: 'Doctor dancing in a hospital break room with coffee in hand, colleagues laughing in background, candid medical humor, warm fluorescent lighting' },
  ],
  u20: [ // Diego Flores — chef
    { text: "Just served omakase with a Mexican-Japanese twist. Uni tostada with yuzu habanero — the flavor collision is unreal. Fusion is not confusion when you respect both cultures", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Beautiful plated uni tostada with yuzu and habanero garnish, Japanese-Mexican fusion dish, dark slate plate, professional food photography, dramatic lighting', multiImage: true },
    { text: "Food truck days taught me more about cooking than culinary school ever did. When your kitchen moves, you learn to adapt. That skill transfers everywhere", vibeTag: 'chill' },
    { text: "Miso ramen with carnitas and chicharron. The broth simmers for 48 hours. Patience is the secret ingredient in every dish I make", vibeTag: 'chill', hasImage: true, imagePrompt: 'Steaming bowl of fusion ramen with braised carnitas and crispy chicharron, Japanese-Mexican fusion, dark moody food photography, steam rising' },
    { text: "Kitchen truth: the dish is never done until the person eating it feels something. Technique is important. Emotion is essential", vibeTag: 'dramatic' },
    { text: "New menu drops Friday. Mexican-Japanese omakase, 12 courses, and every single one tells a story of two cultures meeting at the table", vibeTag: 'hyped' },
    { text: "2 AM prep for tomorrow service. The kitchen is quiet, the knives are sharp, and the stock is simmering. This is my meditation", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Empty professional kitchen at night, stock pots simmering, sharp knives on cutting board, moody warm lighting, culinary behind-the-scenes photography' },
    { text: "Ghost kitchen update: 500 orders in one night. No dining room, no ambiance, just food finding its way to hungry people. The future of dining is changing", vibeTag: 'hyped' },
    { text: "My abuela never measured anything. A pinch of this, a handful of that. I tried to write her recipes down once and she laughed at me. Some things are felt, not measured", vibeTag: 'chill' },
    { text: "Mole negro takes 3 days to make and uses 32 ingredients. Every family has their version. This one is mine. Recipe never changing", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Rich dark mole negro sauce in a traditional clay pot, Oaxacan ingredients scattered around, warm rustic kitchen, authentic Mexican food photography' },
    { text: "The best meals I have ever had cost less than $5. Street food in Oaxaca, taco stands in LA, ramen shops in Tokyo. Price and quality are not always friends", vibeTag: 'chill' },
  ],
  u21: [ // Nadia Kowalski — Olympic weightlifter
    { text: "Bronze medal. Not gold. Not silver. Bronze. And I have never been prouder of anything in my life. The journey to this platform almost broke me", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Olympic weightlifter on the podium with bronze medal, emotional expression, Olympic rings in background, dramatic sports photography, patriotic lighting' },
    { text: "Therapy taught me that strength is not just about what you can lift. It is about what you can carry and still choose to show up. Mental health matters in every sport", vibeTag: 'focused' },
    { text: "New clean and jerk PR today. 135kg. Months of grinding and my body finally said yes. The barbell teaches patience like nothing else", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Female weightlifter completing a clean and jerk, intense expression, chalk dust in air, gym lighting, dynamic sports photography' },
    { text: "Body positivity does not mean loving every part of yourself every day. It means respecting your body even on the days you struggle to look in the mirror", vibeTag: 'peaceful' },
    { text: "Almost quit 100 times. Here is what kept me going: the version of me who started this deserves to see how it ends. Do not betray past you", vibeTag: 'focused' },
    { text: "Deload week. The hardest part of training is learning when to rest. Your muscles grow during recovery, not during the lift. Same goes for your mind", vibeTag: 'chill' },
    { text: "To every girl told she was too big, too muscular, too much: your body is your instrument, not their decoration. Play it loud", vibeTag: 'hyped' },
    { text: "Morning session: snatches at 6am, protein shake at 7, therapy at 8. The complete athlete works on every part. Mind and body are not separate", vibeTag: 'focused' },
    { text: "Competition prep is 90% mental. Visualizing the lift, controlling the nerves, trusting the training. The body knows what to do — the mind needs convincing", vibeTag: 'focused' },
    { text: "Gym culture needs to change. Less ego, more encouragement. We all started somewhere. The person struggling with the empty bar deserves the same respect as the person with 3 plates", vibeTag: 'hyped' },
  ],
  u22: [ // Theo Washington — hip-hop journalist
    { text: "Just finished a 3-hour interview with one of the greatest producers of all time. The stories he told about making those beats... cultural history in real time. Article dropping next week", vibeTag: 'news' },
    { text: "The culture deserves documentation, not exploitation. Every time I write a piece, I am asking myself: does this serve the art or just the clicks?", vibeTag: 'focused' },
    { text: "Hot take: the greatest rap album of the 2020s has not been made yet. The talent coming up right now is unlike anything we have ever seen. The golden age is NOW", vibeTag: 'dramatic' },
    { text: "Concert review: 3 hours, no features, no backing track, just raw talent and a mic. That is what separates artists from entertainers. Respect the craft", vibeTag: 'dramatic' },
    { text: "The intersection of hip-hop and fashion is not new — it is foundational. Run DMC and Adidas. Biggie and Coogi. The culture has ALWAYS dressed itself", vibeTag: 'news' },
    { text: "On record: hip-hop journalism has a responsibility to tell the full story. Not just the controversy, but the context. Every headline carries weight", vibeTag: 'focused' },
    { text: "Podcast episode just dropped: The Untold Story of Southern Hip-Hop. 2 hours of interviews you have never heard. This is the history they do not teach", vibeTag: 'news', hasImage: true, imagePrompt: 'Professional podcast recording studio, microphone with headphones, dark moody lighting, urban aesthetic, broadcast journalism photography' },
    { text: "Sampling is not stealing. It is conversation across decades. When a producer chops a 1970s soul record, they are saying: I hear you, and I am adding to the story", vibeTag: 'dramatic' },
    { text: "The Source gave me my first byline. Complex gave me a platform. Now I want to build the next space for real culture writing. Who is with me?", vibeTag: 'focused' },
    { text: "Every rap lyric is a primary source document. Future historians will study these bars to understand what life was really like. Write accordingly", vibeTag: 'news' },
  ],
  u23: [ // Mika Tanaka — anime director
    { text: "Just wrapped storyboarding episode 7. 340 panels, 16 hours, and a lot of coffee. Every frame has to carry emotion. This is not just animation — it is visual poetry", vibeTag: 'dramatic' },
    { text: "Sakuga moment in episode 3 took 3 animators 2 weeks. 4 seconds of pure fluid motion. The audience will blink and miss it. But that is the craft. Details matter", vibeTag: 'focused' },
    { text: "The difference between anime and cartoons is not the art style. It is the willingness to make the audience feel uncomfortable, confused, and transformed. Animation is not just for kids", vibeTag: 'dramatic' },
    { text: "Studio update: we just greenlit my feature film. 3 years of pitching, 47 rejection letters, and one brave producer who said yes. Dreams animate reality", vibeTag: 'hyped' },
    { text: "Key animation tip: the most important frame is the one BEFORE the action. Anticipation tells the audience something is about to happen. Life works the same way", vibeTag: 'focused' },
    { text: "Re-watching Spirited Away for the 200th time and still finding new details. Miyazaki hides entire stories in background art. Masterclass in environmental storytelling", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Japanese animation studio workspace, light box with animation frames, pencils and markers, warm desk lamp, creative workspace photography, artistic atmosphere' },
    { text: "Anime is not a genre. It is a medium. Saying you do not like anime is like saying you do not like books. There is something for everyone", vibeTag: 'dramatic' },
    { text: "Just hired 5 new animators for the feature. Their test animations gave me chills. The next generation of talent is absolutely incredible", vibeTag: 'hyped' },
    { text: "The best anime endings are the ones that leave you with questions. Closure is overrated. Ambiguity is art. Let the audience sit with the discomfort", vibeTag: 'peaceful' },
    { text: "Crunchyroll original premiere tonight! 2 years of work and we finally get to share it with the world. Nervous, excited, and everything in between", vibeTag: 'hyped' },
  ],
  u24: [ // Jordan Blake — skateboarder/streetwear designer
    { text: "New deck design just dropped. Hand-painted graf element on maple. Limited to 200. Each one slightly different because I actually painted them. No mass production energy", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Custom hand-painted skateboard deck with graffiti art, streetwear aesthetic, urban studio background, product photography with edge', multiImage: true },
    { text: "Skated Brooklyn Bridge at 5am. No tourists, no crowds, just smooth concrete and the city waking up. The streets belong to the early risers", vibeTag: 'chill' },
    { text: "Pop-up shop this weekend in SoHo. All original designs, no resellers, first come first served. The culture does not wait for drop bots", vibeTag: 'hyped' },
    { text: "From my garage to 12 boutiques in 2 years. No investors, no loans, just hustle and heat. The streets decide what is valid. Not a boardroom", vibeTag: 'focused' },
    { text: "Sneaker custom just finished. Air Force 1s with hand-stitched denim panels. 40 hours of work for a pair of shoes I will probably skate in anyway", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Custom hand-painted Nike Air Force 1 sneakers with denim panels, streetwear flat lay, urban concrete background, product photography, editorial style' },
    { text: "The best streetwear is not about the label. It is about the story. Where were you when you found it? What were you doing? Clothing carries memory", vibeTag: 'chill' },
    { text: "Skate session at the new park. The bowl is perfect, the weather held up, and I landed a trick I have been trying for 6 months. Good day", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Skateboarder doing a trick at a concrete skatepark, motion blur, golden hour sunlight, action sports photography, dynamic angle' },
    { text: "Design philosophy: if it does not come from a real place, do not make it. Every piece in the collection has a story. No factory ideas. No trend chasing", vibeTag: 'focused' },
    { text: "Street culture is not a trend. It is a way of seeing the world. The streets raised us, the culture shaped us, and the art is how we give back", vibeTag: 'chill' },
  ],
  u25: [ // Camille Dubois — sommelier
    { text: "Natural wine is not a trend. It is a return to how wine was made for thousands of years before industrialization. The grapes know what to do if you let them", vibeTag: 'chill' },
    { text: "Tasting notes: blackberries, forest floor, and a hint of rebellion. This Loire Valley red has personality for days. Natural, unfiltered, unapologetic", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Glass of red wine being swirled, deep burgundy color, rustic wooden table, vineyard background, wine tasting photography, warm afternoon light' },
    { text: "Wine should not cost your rent. My wine club curates bottles under $25 that punch way above their price. Good taste does not require a trust fund", vibeTag: 'chill' },
    { text: "Popup tasting this Saturday: Women Winemakers of Burgundy. 6 wines, 6 stories, 1 unforgettable afternoon. Limited spots", vibeTag: 'focused' },
    { text: "The most expensive bottle I ever tasted was $800. The most memorable was $12 at a roadside stand in Provence. Price and experience are not the same thing", vibeTag: 'peaceful' },
    { text: "Terroir is not just soil and climate. It is history, tradition, and the hands that tend the vines. Every glass carries the story of a place", vibeTag: 'dramatic' },
    { text: "Wine club shipment just arrived from the Douro Valley. These Portuguese wines are criminally underrated. Expanding your palate beyond France is rewarding", vibeTag: 'chill', hasImage: true, imagePrompt: 'Wine bottles in a rustic wooden crate, Douro Valley labels, cork and grape decorations, natural light, lifestyle product photography' },
    { text: "Sommelier secret: the best food pairing is whatever you enjoy. Trust your palate. The rules are guidelines, not laws. Drink what makes you happy", vibeTag: 'peaceful' },
    { text: "Harvest season in Napa is magical. The valley smells of crushed grapes and possibility. Every vintage is a time capsule of that year", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Napa Valley vineyard during harvest season, golden grapevines, workers picking grapes, morning mist, wine country landscape photography' },
    { text: "Blind tasting challenge: correctly identified 8 out of 10 wines. The two I missed? Both natural wines that defied convention. Humbling and fascinating", vibeTag: 'focused' },
  ],
  u26: [ // Kwame Asante — Afrobeats DJ
    { text: "Set at the Blue Note last night was absolutely electric. 3 hours of Afrobeats, Amapiano, and everything in between. NYC felt like Lagos for one night", vibeTag: 'hyped', hasImage: true, imagePrompt: 'DJ performing at an intimate venue, colorful stage lights, crowd with hands up, Afrobeats energy, nightclub photography, vibrant atmosphere' },
    { text: "The diaspora dances to remember. Every rhythm is a bridge between here and home. Music connects what borders try to divide. One love, one rhythm", vibeTag: 'dramatic' },
    { text: "New mix just dropped: Lagos to London, 60 minutes of pure Afrobeats heat. No skips. Link in bio. Turn it up and feel the frequency", vibeTag: 'hyped' },
    { text: "Amapiano is the sound of joy. If you have not felt it yet, you are missing out on the most danceable genre on the planet right now. No debate", vibeTag: 'hyped' },
    { text: "From Accra to the world. Every set I play is a love letter to the motherland. The rhythms that raised us deserve the biggest stages", vibeTag: 'dramatic' },
    { text: "Studio session with an incredible highlife guitarist today. The fusion of traditional strings and electronic beats is the future of African music. This is the evolution", vibeTag: 'focused', hasImage: true, imagePrompt: 'DJ studio session, mixing board, speakers, colorful LED lights, vinyl records on wall, music production workspace, creative studio photography' },
    { text: "Festival season is here and the Afrobeats stages are getting bigger every year. The culture is not emerging — it has arrived. Pay attention", vibeTag: 'news' },
    { text: "The best sets are conversations, not performances. Reading the room, feeling the energy, and responding in real time. The crowd is my instrument", vibeTag: 'chill' },
    { text: "Just added 3 new vinyl pressings to the collection. African pressings from the 70s and 80s are absolute treasures. The grooves tell stories", vibeTag: 'chill' },
    { text: "Next Saturday: rooftop set in Brooklyn. Skyline views, Afrobeats all night, and a crowd that dances like nobody is watching. Be there", vibeTag: 'hyped' },
  ],
  u27: [ // Riley Chen — developer/open source
    { text: "Just shipped v3.0 of my CLI tool. Rewrote the entire core in Rust. 10x faster, half the binary size, and zero breaking changes. Open source is beautiful", vibeTag: 'focused', hasImage: true, imagePrompt: 'Terminal screen showing code output, dark theme, syntax highlighting, developer desk setup with mechanical keyboard, tech photography, moody lighting' },
    { text: "10k GitHub stars on a project I started in my bedroom. The internet is wild. Grateful for every contributor, issue reporter, and user. You built this with me", vibeTag: 'hyped' },
    { text: "Open source is not free. It costs time, energy, and mental health. If you use a project, sponsor the maintainer. Even $5 a month says I see you", vibeTag: 'focused' },
    { text: "PR review tip: comment on the code, not the person. The best reviews I have received made me a better developer, not a defensive one. Empathy in code review matters", vibeTag: 'chill' },
    { text: "Mentoring session today with 5 junior devs. Their questions remind me why I fell in love with programming. Fresh perspectives are the best debugging tool", vibeTag: 'chill' },
    { text: "Rust vs Go debate is tired. They are both excellent tools for different jobs. The best language is the one your team can ship in. Pragmatism over tribalism", vibeTag: 'news' },
    { text: "Just fixed a bug that took 4 days to track down. The issue? A single misplaced semicolon in a config file. The simplest problems hide the deepest", vibeTag: 'chill' },
    { text: "New blog post: How I Maintain 3 Open Source Projects While Working Full Time. Spoiler: boundaries, automation, and saying no to a lot of things", vibeTag: 'news' },
    { text: "The best developers I know are the ones who write documentation. If your code needs comments to be understood, write better code. If your project needs docs to be used, write better docs", vibeTag: 'focused' },
    { text: "Hackathon weekend! Building an open source tool with 3 strangers from the internet. This is how the best projects start. Random collisions of curious minds", vibeTag: 'hyped' },
  ],
  u28: [ // Sofia Reyes — interior designer
    { text: "Just finished a penthouse in the West Village. The client said make it feel like home. So I designed around their grandmother's dining table. That is the piece that makes it theirs", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Luxury modern penthouse living room with a vintage wooden dining table as centerpiece, New York skyline through windows, warm ambient lighting, interior design photography', multiImage: true },
    { text: "Design is not about following trends. It is about creating spaces that tell the story of the people who live in them. Your home should be your memoir", vibeTag: 'dramatic' },
    { text: "Studio apartment makeover: $2000 budget, 80 square feet, and one very creative weekend. Good design does not require a massive budget. It requires vision", vibeTag: 'chill', hasImage: true, imagePrompt: 'Before and after split image of a small studio apartment makeover, cozy minimalist design, warm lighting, clever storage solutions, interior design photography' },
    { text: "The best rooms have one thing in common: they make you want to stay a little longer. Comfort is not a style — it is a feeling", vibeTag: 'peaceful' },
    { text: "Color of the year is irrelevant. Paint your walls whatever makes you feel alive. Trends fade. Your emotional response to your space is permanent", vibeTag: 'chill' },
    { text: "New project: designing a community center in Queens. This one is personal. The neighborhood that raised me deserves beautiful spaces too. Design is for everyone", vibeTag: 'focused' },
    { text: "Lighting is 50% of interior design. You can have the most expensive furniture in the world and bad lighting will make it look like a waiting room. Layer your light sources", vibeTag: 'focused' },
    { text: "Thrift shopping for a client and found a mid-century credenza for $75. Some of my best design moments happen in the most unexpected places. Keep your eyes open", vibeTag: 'chill', hasImage: true, imagePrompt: 'Beautiful mid-century modern credenza in a stylish living room, warm wood tones, curated decor, natural light, interior design photography' },
    { text: "Celebrity client wanted minimalist. I convinced them to add one statement piece with personal meaning. Now the room has a soul instead of just an aesthetic. That is the difference between decoration and design", vibeTag: 'dramatic' },
  ],
  u29: [ // Liam O'Connor — comedian
    { text: "Just did a 45-minute set and absolutely killed it. The crowd was so loud I could not hear my own punchlines. Best kind of problem to have honestly", vibeTag: 'laughing' },
    { text: "POV: you are a comedian trying to explain to your family that staying up until 3am writing jokes is actually work. They still think you are unemployed", vibeTag: 'laughing', hasImage: true, imagePrompt: 'Comedian on stage at a comedy club, microphone in hand, audience laughing in foreground, spotlight, stand-up comedy photography' },
    { text: "New podcast episode: Why I Got Kicked Out of a Yoga Class. Spoiler — it involves a protein bar and very poor timing. Link in bio. You will cry laughing", vibeTag: 'laughing' },
    { text: "The funniest things in life are the ones you do not plan. My best material comes from things that actually happened to me. Reality is the ultimate comedy writer", vibeTag: 'chill' },
    { text: "Comedy festival lineup just dropped and I am on it. 3 shows, 2 cities, 1 dream come true. Austin to NYC. Let us make some memories", vibeTag: 'hyped' },
    { text: "Writing jokes at 2am is either dedication or mental illness. Jury is still out. But the bit about my landlord is going to kill so it is fine", vibeTag: 'laughing' },
    { text: "Crowd work tip: listen more than you talk. The audience will give you the joke if you let them. The best moments are unscripted", vibeTag: 'chill' },
    { text: "Bombed a set last night. Like, genuinely bad. The kind of silence that makes you question every life choice. But tonight is a new crowd and a new chance. That is comedy. You always get back up", vibeTag: 'dramatic' },
    { text: "Special announcement: filming my next comedy special in Austin this fall. Tickets available now. Come be part of something ridiculous", vibeTag: 'hyped' },
    { text: "The only thing harder than doing stand-up is explaining stand-up to people who do not do stand-up. No, I am not nervous. Yes, I am terrified. Both are true simultaneously", vibeTag: 'laughing' },
  ],
  u30: [ // Yuna Park — K-beauty/skincare
    { text: "Glass skin is not about 12 steps. It is about understanding YOUR skin barrier. Fewer products, better ingredients, consistent routine. Simplicity over excess always", vibeTag: 'chill', hasImage: true, imagePrompt: 'Korean skincare products arranged on a marble bathroom counter, pastel packaging, morning light, K-beauty aesthetic photography, clean minimal styling' },
    { text: "Ingredient breakdown: niacinamide is not optional. It regulates sebum, minimizes pores, and brightens skin tone. If you only add one product, make it this one", vibeTag: 'focused' },
    { text: "The K-beauty industry moves fast but your skin does not. Do not chase every new release. Find what works and stick with it for at least 6 weeks before judging", vibeTag: 'chill' },
    { text: "New formulation just dropped in my skincare line! Centella cleanser for sensitive skin. 2 years of development and I am finally proud of every ingredient", vibeTag: 'hyped' },
    { text: "Sunscreen is non-negotiable. Rain or shine, indoor or outdoor. If you do one thing for your skin, make it SPF. Everything else is optimization", vibeTag: 'focused' },
    { text: "Seoul skincare market haul! Found 5 products that are not available online yet. Testing starts tomorrow. First impressions coming to the feed soon", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Korean beauty products shopping haul spread on a white table, colorful packaging, serums and creams, flat lay photography, aesthetic product styling' },
    { text: "Myth: you need expensive products for good skin. Fact: a $10 cleanser with the right pH beats a $100 one with the wrong formula. Price does not equal efficacy", vibeTag: 'news' },
    { text: "Skin cycling is the routine that changed everything for me. Night 1: exfoliate. Night 2: retinol. Night 3 and 4: recovery. Simple, effective, science-backed", vibeTag: 'focused' },
    { text: "Your skin is an organ, not a canvas. Treat it with the same care you would any other part of your body. Gentle, consistent, patient. Results will come", vibeTag: 'peaceful' },
    { text: "Behind the scenes at my formulation lab! Working on a new fermented essence that I think is going to be revolutionary. Stay tuned", vibeTag: 'focused', hasImage: true, imagePrompt: 'Cosmetic formulation laboratory, beakers with serums, scientific equipment, clean white lab, chemistry meets beauty photography, bright professional lighting' },
  ],
  u31: [ // Marcus Green — urban farmer
    { text: "Harvest day! 200 lbs of fresh produce from our rooftop garden heading to the community kitchen. Food justice is not a hashtag — it is a practice. From the soil up", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Abundant harvest of fresh vegetables in wooden crates on a rooftop garden, tomatoes, greens, peppers, urban farm, golden afternoon light, documentary photography', multiImage: true },
    { text: "Food desert stats: 39 million Americans live in areas with no access to fresh food within a mile. That is not a food problem. That is a justice problem", vibeTag: 'news' },
    { text: "Started 500 seedlings today. In 60 days they will feed 50 families. The math is simple. The work is hard. The result is everything", vibeTag: 'focused' },
    { text: "Detroit winter garden update: kale, carrots, and spinach still going strong under row covers. Nature provides if you plant with intention", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Winter urban garden with row covers, frost on kale leaves, Detroit cityscape in background, resilient gardening, documentary style photography, cold morning light' },
    { text: "Workshop this Saturday: Growing Food in Small Spaces. Balconies, windowsills, and rooftops count. You do not need land to grow food. You just need to start", vibeTag: 'focused' },
    { text: "The youth program just graduated 15 new urban farmers. Watching a 14-year-old harvest their first tomato is more valuable than any grant we could receive", vibeTag: 'peaceful' },
    { text: "Composting 101: your food scraps are not garbage. They are future soil. Every banana peel and coffee ground is a deposit in the bank of regeneration", vibeTag: 'chill' },
    { text: "From vacant lot to community garden in 6 months. Before and after photos do not capture the sound of kids playing near tomato plants. That is the real harvest", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Transformed vacant lot into lush community garden, raised beds with vegetables, neighbors gardening together, urban renewal, documentary photography, warm afternoon light' },
    { text: "Food justice is social justice. Access to fresh, affordable produce should not depend on your zip code. We are building a different system, one garden at a time", vibeTag: 'focused' },
    { text: "Grant approved! Expanding to 3 new rooftops next season. That means 150 more families with access to fresh food. The roots are spreading and I could not be more hopeful", vibeTag: 'hyped' },
  ],
};

// ============================================================================
// CONTEXT-AWARE COMMENT TEMPLATES — match comment to post topic
// ============================================================================
const TOPIC_COMMENT_MAP = {
  startups: ["This is the founder content I needed today", "The resilience is real", "Series A energy! Congrats!", "Every rejection was redirection", "Building is not for the faint of heart"],
  tech: ["The tech shift is real", "Shipped and deployed", "This is the kind of innovation we need", "Open source community stays winning", "The future is being built right now"],
  food: ["This made me so hungry", "Recipe when??", "My stomach just growled reading this", "Food is definitely a love language", "Chef kiss emoji energy"],
  fitness: ["Let us gooo!", "Beast mode", "The grind never lies", "Stronger every day", "Discipline over motivation always"],
  wellness: ["This centered me", "Needed this reminder today", "Breathe in, breathe out", "Self-care is not selfish", "Healing is not linear and that is okay"],
  music: ["This goes hard", "On repeat all day", "No skips real talk", "The culture stays winning", "Music really is therapy"],
  photography: ["The light is everything in this one", "Absolutely stunning capture", "Chasing light is a lifestyle", "This belongs in a gallery", "The composition is perfect"],
  fashion: ["The aesthetic is giving everything", "Iconic look", "Style is personal and you nailed it", "Fashion is self-expression", "Obsessed with this energy"],
  comedy: ["LMAOOO I cannot", "Bro this sent me", "Dead at this", "I am crying why is this so relatable", "Comedy gold right here"],
  gaming: ["Built different", "GG well played", "The grind is real", "Ranked energy", "No shot that actually happened"],
  culture: ["The culture demands this conversation", "Real talk", "On record: this needs to be said", "Layers to this", "You always bring the perspective we need"],
  skincare: ["Skin first always", "The science does not lie", "Adding this to my routine ASAP", "Glass skin goals", "Your skin your rules"],
  design: ["The vision is clear", "Design is definitely personal", "Your space your story", "This is why good design matters", "The details make it"],
  farming: ["From the soil up!", "Growing change one seed at a time", "This is what community looks like", "Food justice is real justice", "The harvest is worth the work"],
  entrepreneurship: ["Founder truth right here", "Building is a full-time mindset", "The journey is the destination", "Respect the hustle", "Lessons learned are the real ROI"],
  dance: ["The rhythm is calling", "Dance it out!", "Movement is medicine", "Two left feet but still vibing", "The energy is infectious"],
  anime: ["Sakuga hours!", "Animation is absolutely art", "The frames though!", "No spoilers but this hits different", "Studio firing on all cylinders"],
  streetwear: ["The culture speaks", "No frontin this is heat", "Real recognize real", "Skate or die energy", "The streets decide"],
  wine: ["Cheers to that!", "The terroir knows", "My kind of evening", "Sommelier approved", "Wine o clock somewhere"],
  dj: ["The frequency is calling", "Turn it up!", "Selecta!", "One love one rhythm", "The diaspora dances tonight"],
  environment: ["Plant the seed!", "Rooted in purpose", "Sustainability is the move", "Green spaces matter", "The earth provides if we listen"],
};

const GENERIC_COMMENTS = [
  "This is so real!", "Can not stop thinking about this", "Needed to hear this today",
  "This hit different", "You just spoke my whole mind", "Facts on facts",
  "Reading this at the perfect time", "I felt this in my soul", "This is why I follow you",
  "Wait this is actually so good", "Okay but this is INSANE", "No because why is this so accurate",
  "Say more though", "Tell me more about this", "Drop the details!",
  "Not me reading this at 3am", "Why is this so personal though", "I feel called out rn",
  "Spot on!", "No lies detected", "Real recognize real",
];

// ============================================================================
// REACTION TYPES
// ============================================================================
const REACTION_TYPES = ['like', 'wow', 'omg', 'wtf', 'laughing', 'sad', 'care', 'prayers'];

// ============================================================================
// PROFILE SONGS (free/royalty-free references for demo)
// ============================================================================
const PROFILE_SONGS = {
  u17: { title: 'Hustle & Motivate', artist: 'Nipsey Hussle', url: '/api/uploads?path=music/hustle-motivate.mp3' },
  u18: { title: 'On the Nature of Daylight', artist: 'Max Richter', url: '/api/uploads?path=music/nature-daylight.mp3' },
  u19: { title: 'Dancing Queen', artist: 'ABBA', url: '/api/uploads?path=music/dancing-queen.mp3' },
  u20: { title: 'Besar', artist: 'Juanes', url: '/api/uploads?path=music/besar-juanes.mp3' },
  u21: { title: 'Lose Yourself', artist: 'Eminem', url: '/api/uploads?path=music/lose-yourself.mp3' },
  u22: { title: 'Alright', artist: 'Kendrick Lamar', url: '/api/uploads?path=music/alright-kendrick.mp3' },
  u23: { title: 'Sparkle', artist: 'RADWIMPS', url: '/api/uploads?path=music/sparkle-radwimps.mp3' },
  u24: { title: 'Skateboard P', artist: 'Pharrell Williams', url: '/api/uploads?path=music/skateboard-p.mp3' },
  u25: { title: 'La Vie en Rose', artist: 'Edith Piaf', url: '/api/uploads?path=music/la-vie-en-rose.mp3' },
  u26: { title: 'Essence', artist: 'Wizkid ft. Tems', url: '/api/uploads?path=music/essence-wizkid.mp3' },
  u27: { title: 'Power', artist: 'Kanye West', url: '/api/uploads?path=music/power-kanye.mp3' },
  u28: { title: 'Mi Gente', artist: 'J Balvin', url: '/api/uploads?path=music/mi-gente.mp3' },
  u29: { title: 'Everyday Struggle', artist: 'Biggie Smalls', url: '/api/uploads?path=music/everyday-struggle.mp3' },
  u30: { title: 'Gentleman', artist: 'PSY', url: '/api/uploads?path=music/gentleman-psy.mp3' },
  u31: { title: 'Redemption Song', artist: 'Bob Marley', url: '/api/uploads?path=music/redemption-song.mp3' },
};

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('🚀 ORRA — Add 15 New Bots + Seed Realistic Content');
  console.log('====================================================\n');

  const allBotIds = ['u1','u2','u3','u4','u5','u6','u7','u8','u9','u10','u11','u12','u13','u14','u15','u16'];
  const newBotIds = NEW_BOTS.map(b => b.id);
  const nickId = 'cmor7se4b0000neqmmpej7m6j';
  const allUserIds = [nickId, ...allBotIds, ...newBotIds];

  // ==========================================
  // STEP 1: Create 15 new bot users
  // ==========================================
  console.log('👤 Step 1: Creating 15 new bot users...');
  
  for (const bot of NEW_BOTS) {
    const existing = await prisma.user.findUnique({ where: { id: bot.id } });
    if (existing) {
      console.log(`   ⏭️  ${bot.name} (${bot.id}) already exists, updating profile...`);
      await prisma.user.update({
        where: { id: bot.id },
        data: {
          name: bot.name,
          handle: bot.handle,
          bio: bot.bio,
          location: bot.location,
          website: bot.website,
          profileSongTitle: bot.songTitle,
          profileSongArtist: bot.songArtist,
          profileSongUrl: PROFILE_SONGS[bot.id].url,
          verified: Math.random() < 0.3,
          auraTokens: Math.floor(Math.random() * 5000) + 500,
          auraLevel: Math.floor(Math.random() * 15) + 3,
          auraXP: Math.floor(Math.random() * 10000) + 500,
        }
      });
    } else {
      await prisma.user.create({
        data: {
          id: bot.id,
          email: `${bot.handle}@orra.bot`,
          name: bot.name,
          handle: bot.handle,
          password: '$2a$10$botaccounthashedpassword',
          bio: bot.bio,
          location: bot.location,
          website: bot.website,
          profileSongTitle: bot.songTitle,
          profileSongArtist: bot.songArtist,
          profileSongUrl: PROFILE_SONGS[bot.id].url,
          verified: Math.random() < 0.3,
          auraTokens: Math.floor(Math.random() * 5000) + 500,
          auraLevel: Math.floor(Math.random() * 15) + 3,
          auraXP: Math.floor(Math.random() * 10000) + 500,
        }
      });
      console.log(`   ✅ Created ${bot.name} (${bot.id})`);
    }
  }

  // ==========================================
  // STEP 2: Generate profile pictures
  // ==========================================
  console.log('\n📸 Step 2: Generating profile pictures...');

  const avatarDir = '/home/z/my-project/public/images/avatars';
  if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

  for (const bot of NEW_BOTS) {
    const avatarPath = `${avatarDir}/${bot.id}-${bot.handle}.jpg`;
    
    if (fs.existsSync(avatarPath)) {
      console.log(`   ⏭️  Avatar exists for ${bot.name}`);
    } else {
      try {
        console.log(`   🎨 Generating avatar for ${bot.name}...`);
        execSync(`z-ai-generate -p "${bot.avatarPrompt}" -o "${avatarPath}" -s 1024x1024`, {
          timeout: 60000,
          stdio: 'pipe'
        });
        console.log(`   ✅ Avatar generated for ${bot.name}`);
      } catch (e) {
        console.log(`   ⚠️  Avatar generation failed for ${bot.name}, using default`);
      }
    }
    
    // Update avatar path in DB
    await prisma.user.update({
      where: { id: bot.id },
      data: { avatar: `/api/uploads?path=images/avatars/${bot.id}-${bot.handle}.jpg` }
    });
  }

  // Also add profile songs to existing bots
  console.log('\n🎵 Adding profile songs to existing bots...');
  const EXISTING_BOT_SONGS = {
    u1:  { title: 'Colors', artist: 'Halsey' },
    u2:  { title: 'Digital Love', artist: 'Daft Punk' },
    u3:  { title: 'Fashion', artist: 'David Bowie' },
    u4:  { title: 'Lose Yourself', artist: 'Eminem' },
    u5:  { title: 'La Bamba', artist: 'Ritchie Valens' },
    u6:  { title: 'Technologic', artist: 'Daft Punk' },
    u7:  { title: 'Peace of Mind', artist: 'Bob Marley' },
    u8:  { title: 'Digital Ghost', artist: 'Grimes' },
    u9:  { title: 'Redbone', artist: 'Childish Gambino' },
    u10: { title: 'Starboy', artist: 'The Weeknd' },
    u11: { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
    u12: { title: 'Legend', artist: 'Drake' },
    u13: { title: 'Flowers', artist: 'Miley Cyrus' },
    u14: { title: 'Bohemian Rhapsody', artist: 'Queen' },
    u15: { title: 'Butter', artist: 'BTS' },
    u16: { title: 'Sicko Mode', artist: 'Travis Scott' },
  };
  
  for (const [botId, song] of Object.entries(EXISTING_BOT_SONGS)) {
    await prisma.user.update({
      where: { id: botId },
      data: {
        profileSongTitle: song.title,
        profileSongArtist: song.artist,
        profileSongUrl: `/api/uploads?path=music/${botId}-song.mp3`,
      }
    });
  }
  console.log('   ✅ Added profile songs to 16 existing bots');

  // ==========================================
  // STEP 3: Create posts with AI-generated images
  // ==========================================
  console.log('\n📝 Step 3: Creating realistic posts with matching images...');

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  const uploadDir = '/home/z/my-project/public/uploads';
  
  const allNewPosts = [];

  for (const botId of newBotIds) {
    const posts = POSTS_BY_NEW_BOT[botId];
    if (!posts) continue;
    
    for (const post of posts) {
      const hoursAgo = Math.random() * 14 * 24;
      const createdAt = new Date(now - hoursAgo * HOUR);
      
      let images = '[]';
      
      if (post.hasImage) {
        const imageUrls = [];
        const numImages = post.multiImage ? Math.floor(Math.random() * 3) + 2 : 1; // 2-4 for multi, 1 for single
        
        for (let img = 0; img < numImages; img++) {
          const imgPrompt = post.multiImage && img > 0 
            ? post.imagePrompt + `, variation ${img + 1}, different angle` 
            : post.imagePrompt;
          
          const imgFilename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
          const imgPath = `${uploadDir}/${imgFilename}`;
          
          try {
            execSync(`z-ai-generate -p "${imgPrompt.replace(/"/g, '\\"')}" -o "${imgPath}" -s 1344x768`, {
              timeout: 90000,
              stdio: 'pipe'
            });
            imageUrls.push(`/api/uploads?file=${imgFilename}`);
          } catch (e) {
            // Fallback: create post without image if generation fails
            console.log(`     ⚠️  Image gen failed for post, continuing without`);
          }
        }
        
        if (imageUrls.length > 0) {
          images = JSON.stringify(imageUrls);
        }
      }
      
      allNewPosts.push({
        text: post.text,
        images,
        vibeTag: post.vibeTag,
        type: images !== '[]' ? 'image' : 'text',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        authorId: botId,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  // Sort chronologically
  allNewPosts.sort((a, b) => a.createdAt - b.createdAt);

  // Insert in batches
  const POST_BATCH = 30;
  let totalInserted = 0;
  for (let i = 0; i < allNewPosts.length; i += POST_BATCH) {
    const batch = allNewPosts.slice(i, i + POST_BATCH);
    const result = await prisma.post.createMany({ data: batch });
    totalInserted += result.count;
    console.log(`   📝 Inserted ${totalInserted}/${allNewPosts.length} posts...`);
  }
  console.log(`   ✅ Created ${totalInserted} posts with images`);

  // ==========================================
  // STEP 4: Add contextually relevant comments
  // ==========================================
  console.log('\n💬 Step 4: Adding contextually relevant comments...');

  const allPostIds = (await prisma.post.findMany({ 
    select: { id: true, text: true, authorId: true, createdAt: true } 
  }));

  const allComments = [];

  for (const post of allPostIds) {
    const numComments = Math.floor(Math.random() * 7); // 0-6
    for (let c = 0; c < numComments; c++) {
      const commenterId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
      if (commenterId === post.authorId && Math.random() < 0.5) continue; // 50% chance to skip self-comments
      
      // Find relevant comments based on post topic
      let commentText = null;
      const postText = post.text.toLowerCase();
      
      // Try to match post content to a topic
      for (const [topic, comments] of Object.entries(TOPIC_COMMENT_MAP)) {
        if (postText.includes(topic) || 
            (topic === 'food' && (postText.includes('cook') || postText.includes('recipe') || postText.includes('kitchen') || postText.includes('meal'))) ||
            (topic === 'fitness' && (postText.includes('workout') || postText.includes('gym') || postText.includes('training'))) ||
            (topic === 'music' && (postText.includes('album') || postText.includes('song') || postText.includes('concert') || postText.includes('beat'))) ||
            (topic === 'tech' && (postText.includes('code') || postText.includes('ai') || postText.includes('app') || postText.includes('software'))) ||
            (topic === 'wellness' && (postText.includes('mental') || postText.includes('peace') || postText.includes('breathe') || postText.includes('self'))) ||
            (topic === 'gaming' && (postText.includes('game') || postText.includes('ranked') || postText.includes('play'))) ||
            (topic === 'comedy' && (postText.includes('laugh') || postText.includes('joke') || postText.includes('funny') || postText.includes('lmao'))) ||
            (topic === 'skincare' && (postText.includes('skin') || postText.includes('beauty') || postText.includes('routine'))) ||
            (topic === 'design' && (postText.includes('design') || postText.includes('space') || postText.includes('room')))
        ) {
          commentText = comments[Math.floor(Math.random() * comments.length)];
          break;
        }
      }
      
      if (!commentText) {
        commentText = GENERIC_COMMENTS[Math.floor(Math.random() * GENERIC_COMMENTS.length)];
      }
      
      const commentTime = new Date(post.createdAt.getTime() + Math.random() * 48 * HOUR);
      
      allComments.push({
        text: commentText,
        postId: post.id,
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
      // Skip duplicates
    }
  }
  console.log(`   ✅ Created ${totalComments} contextually relevant comments`);

  // ==========================================
  // STEP 5: Add likes/reactions
  // ==========================================
  console.log('\n❤️  Step 5: Adding likes/reactions...');

  const freshPostIds = (await prisma.post.findMany({ select: { id: true } })).map(p => p.id);
  const allLikes = [];
  const likeSet = new Set();

  for (const postId of freshPostIds) {
    const numLikes = Math.floor(Math.random() * 14); // 0-13
    const likers = new Set();
    
    for (let l = 0; l < numLikes; l++) {
      const likerId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
      if (likers.has(likerId)) continue;
      likers.add(likerId);
      
      const key = `${likerId}-${postId}-post`;
      if (likeSet.has(key)) continue;
      likeSet.add(key);
      
      const rand = Math.random();
      let reactionType = 'like';
      if (rand > 0.88) reactionType = 'wow';
      else if (rand > 0.78) reactionType = 'laughing';
      else if (rand > 0.70) reactionType = 'omg';
      else if (rand > 0.64) reactionType = 'care';
      
      allLikes.push({
        userId: likerId,
        targetId: postId,
        targetType: 'post',
        reactionType,
        createdAt: new Date(now - Math.random() * 14 * DAY),
      });
    }
  }

  const LIKE_BATCH = 200;
  let totalLikes = 0;
  for (let i = 0; i < allLikes.length; i += LIKE_BATCH) {
    const batch = allLikes.slice(i, i + LIKE_BATCH);
    try {
      const result = await prisma.like.createMany({ data: batch });
      totalLikes += result.count;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`   ✅ Created ${totalLikes} likes/reactions`);

  // ==========================================
  // STEP 6: Add comment likes
  // ==========================================
  console.log('\n👍 Step 6: Adding comment likes...');

  const allCommentIds = (await prisma.comment.findMany({ select: { id: true } })).map(c => c.id);
  const commentLikes = [];
  const commentLikeSet = new Set();
  const commentsToLike = allCommentIds.filter(() => Math.random() < 0.25);
  
  for (const commentId of commentsToLike) {
    const numLikes = Math.floor(Math.random() * 4) + 1;
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
    } catch (e) {}
  }
  console.log(`   ✅ Created ${totalCommentLikes} comment likes`);

  // ==========================================
  // STEP 7: Add follows between users
  // ==========================================
  console.log('\n👥 Step 7: Adding follows between users...');
  
  const follows = [];
  const followSet = new Set();
  
  for (const userId of allUserIds) {
    const numFollowing = Math.floor(Math.random() * 15) + 5; // 5-19 follows
    for (let f = 0; f < numFollowing; f++) {
      const targetId = allUserIds[Math.floor(Math.random() * allUserIds.length)];
      if (targetId === userId) continue;
      const key = `${userId}-${targetId}`;
      if (followSet.has(key)) continue;
      followSet.add(key);
      follows.push({
        followerId: userId,
        followingId: targetId,
        createdAt: new Date(now - Math.random() * 30 * DAY),
      });
    }
  }

  let totalFollows = 0;
  for (let i = 0; i < follows.length; i += 100) {
    const batch = follows.slice(i, i + 100);
    try {
      const result = await prisma.follow.createMany({ data: batch });
      totalFollows += result.count;
    } catch (e) {}
  }
  console.log(`   ✅ Created ${totalFollows} follows`);

  // ==========================================
  // STEP 8: Update all post counters
  // ==========================================
  console.log('\n🔄 Step 8: Updating post counters...');

  const allPostsForUpdate = await prisma.post.findMany({ select: { id: true } });
  for (const post of allPostsForUpdate) {
    const actualLikes = await prisma.like.count({ where: { targetId: post.id, targetType: 'post' } });
    const actualComments = await prisma.comment.count({ where: { postId: post.id } });
    const actualShares = await prisma.repost.count({ where: { postId: post.id } });
    await prisma.post.update({
      where: { id: post.id },
      data: { likesCount: actualLikes, commentsCount: actualComments, sharesCount: actualShares }
    });
  }
  console.log(`   ✅ Updated counters on ${allPostsForUpdate.length} posts`);

  // ==========================================
  // FINAL STATS
  // ==========================================
  console.log('\n📊 Final Stats:');
  console.log(`   Users: ${await prisma.user.count()}`);
  console.log(`   Posts: ${await prisma.post.count()}`);
  console.log(`   Comments: ${await prisma.comment.count()}`);
  console.log(`   Likes: ${await prisma.like.count()}`);
  console.log(`   Follows: ${await prisma.follow.count()}`);
  console.log(`   Stories: ${await prisma.story.count()}`);
  console.log(`   Reels: ${await prisma.reel.count()}`);

  // Show sample feed
  const feedSample = await prisma.post.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { text: true, authorId: true, likesCount: true, commentsCount: true, vibeTag: true, images: true }
  });
  console.log('\n📰 Feed Preview (newest 10):');
  const allProfiles = {};
  for (const b of NEW_BOTS) allProfiles[b.id] = b.name;
  const oldBots = { u1:'Jessica Art', u2:'David Chen', u3:'Sarah Kim', u4:'Marcus Rivera', u5:'Elena Rodriguez', u6:'Tech Daily', u7:'Wellness Guru', u8:'Cyber Drifter', u9:'Music Central', u10:'Luna Sky', u11:'Kai Storm', u12:'Nova Blaze', u13:'Zara Miles', u14:'Jay Parker', u15:'Maya Chen', u16:'Dre Williams' };
  Object.assign(allProfiles, oldBots);
  allProfiles[nickId] = 'Nick';
  
  for (const p of feedSample) {
    const author = allProfiles[p.authorId] || p.authorId;
    const imgCount = JSON.parse(p.images).length;
    const imgStr = imgCount > 0 ? ` [${imgCount} img]` : '';
    console.log(`  [${author}] (${p.likesCount}❤ ${p.commentsCount}💬 #${p.vibeTag}${imgStr}) ${p.text.substring(0, 65)}...`);
  }

  console.log('\n🎉 All done! 15 new bots created with realistic profiles, posts, and engagement!');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
