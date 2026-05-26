#!/usr/bin/env node
/**
 * ORRA Bulk Seed — Creates 100 diverse posts with AI-generated images and comments.
 *
 * Usage:
 *   node scripts/bulk-seed.js              # Create 100 posts with images
 *   node scripts/bulk-seed.js --count 50   # Create 50 posts
 *   node scripts/bulk-seed.js --skip-images # Create posts without generating images (fast)
 *
 * This script:
 * 1. Wipes existing posts/comments/likes (keeps users)
 * 2. Generates AI images for each post using z-ai-generate
 * 3. Creates posts with diverse content via Prisma directly
 * 4. Adds 2-6 comments per post from bot users
 * 5. Adds random likes/reactions to posts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..');
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'public', 'uploads');
const STANDALONE_UPLOAD_DIR = path.join(PROJECT_ROOT, '.next', 'standalone', 'public', 'uploads');
const IMAGE_SIZE = '1344x768';
const TOTAL_POSTS = parseInt(process.argv.includes('--count') ? process.argv[process.argv.indexOf('--count') + 1] : '100', 10);
const SKIP_IMAGES = process.argv.includes('--skip-images');

// ─── Bot Users ──────────────────────────────────────────────────────
const BOT_USERS = [
  { id: 'u1',  name: 'Jessica Art',     handle: '@jessart' },
  { id: 'u2',  name: 'David Chen',      handle: '@davchen' },
  { id: 'u3',  name: 'Sarah Kim',       handle: '@sarahkim' },
  { id: 'u4',  name: 'Marcus Rivera',   handle: '@marcusr' },
  { id: 'u5',  name: 'Elena Rodriguez', handle: '@elenarod' },
  { id: 'u6',  name: 'Tech Daily',      handle: '@techdaily' },
  { id: 'u7',  name: 'Wellness Guru',   handle: '@wellnessg' },
  { id: 'u8',  name: 'Cyber Drifter',   handle: '@cyberdrift' },
  { id: 'u9',  name: 'Music Central',   handle: '@musiccentral' },
  { id: 'u10', name: 'Luna Sky',        handle: '@lunasky' },
  { id: 'u11', name: 'Kai Storm',       handle: '@kaistorm' },
  { id: 'u12', name: 'Nova Blaze',      handle: '@novablaze' },
  { id: 'u13', name: 'Zara Miles',      handle: '@zaramiles' },
  { id: 'u14', name: 'Jay Parker',      handle: '@jayparker' },
  { id: 'u15', name: 'Maya Chen',       handle: '@mayachen' },
  { id: 'u16', name: 'Dre Williams',    handle: '@drewilliams' },
];

// ─── 100 Diverse Post Templates ─────────────────────────────────────
const POST_TEMPLATES = [
  // === FOOD & DRINK (15) ===
  { text: "Made this from scratch and I'm not even sorry for the food spam. Best thing I've eaten all year", vibeTag: 'chill', prompt: 'A steaming bowl of homemade ramen with soft boiled egg, chashu pork, nori, and green onions, top-down view, warm lighting, food photography, high quality' },
  { text: "Brunch is served! Who's coming over? Made enough for the whole crew", vibeTag: 'chill', prompt: 'A beautiful brunch spread with pancakes, fresh berries, avocado toast, and orange juice on a white table, morning sunlight, food photography' },
  { text: "Late night cooking hits different. This pasta took 2 hours and I regret nothing", vibeTag: 'chill', prompt: 'A plate of homemade pasta with rich tomato sauce, fresh basil, and parmesan cheese, candlelight dinner setting, cozy atmosphere' },
  { text: "My abuela's secret recipe. She'd kill me for sharing but y'all deserve to know", vibeTag: 'chill', prompt: 'Fresh homemade tacos with cilantro, lime, and salsa on a colorful ceramic plate, Mexican restaurant setting, vibrant colors' },
  { text: "Coffee art level: finally not embarrassing. What's your go-to order?", vibeTag: 'chill', prompt: 'A beautiful latte art heart in a ceramic cup on a wooden table, coffee shop atmosphere, warm tones, professional photography' },
  { text: "Sushi night at home! Rolled these myself and honestly? Not bad for a first try", vibeTag: 'chill', prompt: 'A plate of homemade sushi rolls with salmon, avocado, and cucumber, chopsticks, soy sauce, professional food photography' },
  { text: "Sunday morning pancakes are a whole mood. Stack em high", vibeTag: 'chill', prompt: 'Tall stack of fluffy pancakes with maple syrup dripping down, fresh blueberries and butter on top, morning light, food photography' },
  { text: "Smoothie bowl game on point today. Eating the rainbow fr", vibeTag: 'chill', prompt: 'A colorful acai smoothie bowl topped with granola, fresh berries, banana slices, and coconut flakes, food photography, bright lighting' },
  { text: "BBQ season is officially here. These ribs took 8 hours and disappeared in 8 minutes", vibeTag: 'hyped', prompt: 'Smoky BBQ ribs on a grill with glaze dripping, outdoor cooking setting, summer afternoon, food photography' },
  { text: "Found the best pizza spot in the city. This is what heaven looks like", vibeTag: 'hyped', prompt: 'A wood-fired pizza with bubbling cheese, fresh basil, and tomato sauce, rustic Italian restaurant setting, close-up food photography' },
  { text: "Baking therapy is real. Made croissants from scratch and my kitchen smells amazing", vibeTag: 'peaceful', prompt: 'Golden flaky croissants fresh from the oven on a baking sheet, flour dusted kitchen counter, warm morning light, food photography' },
  { text: "Matcha everything. This latte is giving me life today", vibeTag: 'chill', prompt: 'A vibrant green matcha latte in a clear glass with oat milk swirl, minimal cafe setting, food photography' },
  { text: "Tried making dumplings for the first time. Some look questionable but they taste incredible", vibeTag: 'laughing', prompt: 'Homemade dumplings steaming in a bamboo basket, various shapes and folds, kitchen setting, food photography' },
  { text: "This chocolate lava cake is the reason I can't stick to a diet. Zero regrets", vibeTag: 'dramatic', prompt: 'A chocolate lava cake with molten center flowing out, vanilla ice cream on the side, dark moody lighting, food photography' },
  { text: "Mango sticky rice from the night market. The best $3 I ever spent", vibeTag: 'chill', prompt: 'Mango sticky rice with coconut milk drizzle on a banana leaf, Thai night market setting, food photography' },

  // === TRAVEL & VIEWS (15) ===
  { text: "Golden hour never disappoints. This view was worth the 6am hike", vibeTag: 'peaceful', prompt: 'A breathtaking mountain viewpoint at golden hour with rolling hills, mist, and warm sunset colors, landscape photography, cinematic' },
  { text: "Found this hidden beach and I'm not telling anyone where it is... okay maybe you guys", vibeTag: 'chill', prompt: 'A hidden tropical beach with crystal clear turquoise water, white sand, palm trees, and no people, paradise, aerial view' },
  { text: "City lights hit different at 2am. Who else is a night owl?", vibeTag: 'dramatic', prompt: 'A stunning nighttime cityscape with illuminated skyscrapers, neon lights reflecting in water, cyberpunk atmosphere, long exposure photography' },
  { text: "This sunset literally stopped me in my tracks. Nature stays winning", vibeTag: 'peaceful', prompt: 'An incredible sunset with dramatic orange and purple clouds over a calm lake, silhouette of trees, professional landscape photography' },
  { text: "Street art just hits different in Berlin. Every corner is a gallery", vibeTag: 'dramatic', prompt: 'Colorful street art and graffiti on a brick wall in an urban alley, vibrant colors, artistic, city culture photography' },
  { text: "Road trip vibes! 12 hours in and the views keep getting better", vibeTag: 'chill', prompt: 'A scenic desert highway stretching to the horizon with mesas and big sky, road trip photography, golden hour' },
  { text: "Cherry blossoms in full bloom. Spring in Japan is unreal", vibeTag: 'peaceful', prompt: 'Cherry blossom trees in full bloom lining a path in a Japanese garden, pink petals falling, serene atmosphere, travel photography' },
  { text: "This ancient temple gave me chills. 1000 years of history in one shot", vibeTag: 'dramatic', prompt: 'An ancient stone temple with intricate carvings, overgrown with moss, jungle setting, dramatic lighting, travel photography' },
  { text: "Northern lights finally on my bucket list checked off. Unreal experience", vibeTag: 'hyped', prompt: 'Vibrant green and purple aurora borealis over a snow-covered landscape, night sky full of stars, landscape photography' },
  { text: "Santorini sunset. Some places just live up to the hype and then some", vibeTag: 'peaceful', prompt: 'White-washed buildings with blue domes in Santorini Greece at sunset, Mediterranean sea, travel photography, warm golden light' },
  { text: "Hot air balloons at sunrise. Cappadocia is literally a dream", vibeTag: 'peaceful', prompt: 'Colorful hot air balloons floating over Cappadocia fairy chimneys at sunrise, dozens of balloons, landscape photography' },
  { text: "Rain in the city has its own kind of beauty. Reflections everywhere", vibeTag: 'dramatic', prompt: 'Rainy city street at night with neon reflections in puddles, people with umbrellas, cinematic urban photography' },
  { text: "Hiking above the clouds. This is what 14000 feet looks like", vibeTag: 'hyped', prompt: 'A hiker standing on a mountain peak above the clouds, dramatic landscape, sunrise, adventure photography' },
  { text: "This hidden waterfall was worth every mosquito bite to get there", vibeTag: 'chill', prompt: 'A secluded waterfall in a lush tropical forest, moss-covered rocks, mist, nature photography' },
  { text: "Sunrise over the desert. Silence so loud you can hear your own heartbeat", vibeTag: 'peaceful', prompt: 'Desert landscape at sunrise with sand dunes and warm orange light, vast empty horizon, landscape photography' },

  // === FASHION & STYLE (10) ===
  { text: "New fit check! This look took 3 stores and 47 changing rooms to find", vibeTag: 'dramatic', prompt: 'A stylish streetwear outfit displayed on a mannequin or flat lay, trendy sneakers, oversized hoodie, accessories, fashion photography, clean background' },
  { text: "When the outfit just works and you can't stop looking in the mirror", vibeTag: 'dramatic', prompt: 'A stylish fashion flat lay with designer sunglasses, watch, sneakers, and accessories on a marble surface, luxury aesthetic' },
  { text: "Thrift store find of the CENTURY. $8 for this vintage jacket?! Steal of the year", vibeTag: 'laughing', prompt: 'A cool vintage denim jacket with patches and pins on a brick wall background, thrift store aesthetic, casual fashion photography' },
  { text: "Minimalist wardrobe check. Less is more when every piece is fire", vibeTag: 'focused', prompt: 'A curated minimalist wardrobe on clean hangers, neutral tones, organized closet, fashion editorial photography' },
  { text: "Sneaker collection growing! Just copped these and they are BEAUTIFUL", vibeTag: 'hyped', prompt: 'A pair of limited edition sneakers in a display box, clean white background, sneakerhead collection photography' },
  { text: "Vintage shopping is my therapy. Found a 70s leather bag in perfect condition", vibeTag: 'chill', prompt: 'A vintage leather handbag on a velvet surface, retro aesthetic, warm lighting, fashion photography' },
  { text: "Sweater weather is the best weather. Layer game strong this season", vibeTag: 'chill', prompt: 'A cozy knitted sweater flat lay with autumn leaves, coffee cup, and book, warm autumn aesthetic, fashion lifestyle photography' },
  { text: "Suit day. Sometimes you gotta dress up and remind everyone who you are", vibeTag: 'focused', prompt: 'A sharp tailored suit on a hanger with silk tie and pocket square, luxury menswear photography, dramatic lighting' },
  { text: "Jewelry that tells a story. Each piece has a meaning", vibeTag: 'peaceful', prompt: 'Handmade artisan jewelry displayed on a dark velvet surface, rings and necklaces with gemstones, macro photography' },
  { text: "Festival outfit ready. Three days of music and zero cares", vibeTag: 'hyped', prompt: 'Festival fashion with bohemian accessories, flower crown, fringe vest, and boots, outdoor music festival, fashion photography' },

  // === FITNESS & SPORTS (10) ===
  { text: "Post-workout glow is real! 6 months of consistency and I finally see the change", vibeTag: 'hyped', prompt: 'A modern gym interior with weights, morning light streaming through windows, motivational atmosphere, fitness photography' },
  { text: "Basketball pickup game went CRAZY today. Hit the game winner!", vibeTag: 'hyped', prompt: 'An outdoor basketball court at sunset with a ball near the hoop, urban setting, golden light, sports photography' },
  { text: "Yoga at sunrise. Finding peace before the chaos of the day begins", vibeTag: 'peaceful', prompt: 'A person practicing yoga on a mat at sunrise on a wooden deck overlooking mountains, peaceful atmosphere, wellness photography' },
  { text: "Marathon training week 12. The finish line is getting closer", vibeTag: 'focused', prompt: 'Running shoes on a trail at dawn, misty morning, determination, sports photography, cinematic' },
  { text: "Swimming laps before the world wakes up. Best way to start the day", vibeTag: 'chill', prompt: 'An infinity pool with calm blue water at dawn, lane lines visible, resort or athletic club setting, sports photography' },
  { text: "Rock climbing sends are the best feeling in the world. Just sent my first V6!", vibeTag: 'hyped', prompt: 'A rock climber on an indoor climbing wall reaching for the next hold, dramatic angle, sports photography' },
  { text: "Morning run through the park. The leaves are changing and it's gorgeous", vibeTag: 'peaceful', prompt: 'A jogging path through an autumn park with golden and red leaves, morning mist, nature and fitness photography' },
  { text: "Boxing class kicked my butt today but I feel alive. Who else fights?", vibeTag: 'hyped', prompt: 'Boxing gloves hanging on a heavy bag in a boxing gym, dramatic lighting, sweat and determination, sports photography' },
  { text: "Surf session before work. Waves were perfect today", vibeTag: 'chill', prompt: 'A surfer carrying a surfboard walking toward the ocean at sunrise, peaceful beach, sports lifestyle photography' },
  { text: "Cycling 50 miles on a Sunday because sitting on the couch is boring", vibeTag: 'focused', prompt: 'A road cyclist on a scenic mountain road, dramatic landscape, cycling photography, motion blur' },

  // === PETS & ANIMALS (10) ===
  { text: "My cat just did the funniest thing and I happened to catch it on camera", vibeTag: 'laughing', prompt: 'A cute cat looking surprised with wide eyes, funny expression, soft lighting, pet photography' },
  { text: "This good boy followed me on my morning walk. Best hiking buddy ever", vibeTag: 'peaceful', prompt: 'A happy dog sitting on a hiking trail in a forest, tongue out, beautiful nature background, golden hour lighting, pet photography' },
  { text: "Adopted this little one yesterday. My heart is so full right now", vibeTag: 'peaceful', prompt: 'An adorable rescue puppy looking at camera with big eyes, soft blanket, warm lighting, pet adoption photography' },
  { text: "My parrot said something so inappropriate today. I can't even repeat it", vibeTag: 'laughing', prompt: 'A colorful parrot on a perch looking mischievous, vibrant feathers, pet photography' },
  { text: "Cat vs cardboard box. The box wins every single time", vibeTag: 'laughing', prompt: 'A cat squeezed into a small cardboard box looking content, funny pet photography, home setting' },
  { text: "Meet my new kitten. Yes I am now that person who won't stop posting cat pics", vibeTag: 'chill', prompt: 'A tiny kitten sleeping curled up in a ball, soft pastel blanket, dreamy lighting, pet photography' },
  { text: "Dog park adventures. Made 4 new friends today (the dogs, not the owners)", vibeTag: 'laughing', prompt: 'Dogs playing and running at a dog park, happy and energetic, sunny day, pet photography' },
  { text: "This turtle has more chill than anyone I've ever met. Living the dream", vibeTag: 'chill', prompt: 'A small turtle on a rock by a pond, serene nature setting, macro pet photography' },
  { text: "Fish tank upgrade complete! The ecosystem is thriving and it's so satisfying", vibeTag: 'focused', prompt: 'A beautiful planted aquarium with colorful tropical fish, aquascaping, nature aquarium photography' },
  { text: "Bunny cuddles on a rainy day. This is the life", vibeTag: 'peaceful', prompt: 'A fluffy rabbit being petted, soft indoor lighting, cozy atmosphere, pet photography' },

  // === ART & CREATIVITY (10) ===
  { text: "12 hours of painting later... is it done? I genuinely can't tell anymore", vibeTag: 'dramatic', prompt: 'An abstract colorful painting on canvas with vibrant acrylic paints, splatter technique, art studio setting, creative atmosphere' },
  { text: "Digital art process! Still can't believe this started as a blank canvas", vibeTag: 'dramatic', prompt: 'A stunning digital art piece showing a futuristic cyberpunk cityscape with neon lights, holographic elements, digital art style' },
  { text: "New mural in progress! This one's dedicated to the ORRA community", vibeTag: 'dramatic', prompt: 'A colorful street art mural being painted on a large wall, spray paint cans, artistic process, urban art photography' },
  { text: "Pottery class was way harder than I expected but I love how this turned out", vibeTag: 'chill', prompt: 'A handmade ceramic bowl on a potters wheel, clay covered hands, pottery studio, craft photography' },
  { text: "Watercolor experiment. Sometimes the mistakes make the best art", vibeTag: 'peaceful', prompt: 'A delicate watercolor painting of flowers with soft bleeding colors, art supplies nearby, art studio, natural light' },
  { text: "Calligraphy practice paying off. Patience really is a virtue", vibeTag: 'focused', prompt: 'Beautiful hand lettering and calligraphy on thick paper, ink and pen, art desk, close-up photography' },
  { text: "Sculpture finished! Took 3 weeks but this clay figure finally has a soul", vibeTag: 'dramatic', prompt: 'A detailed clay sculpture on a pedestal, art studio with dramatic lighting, fine art photography' },
  { text: "Collage art is underrated. This one is about dreams and memory", vibeTag: 'peaceful', prompt: 'An artistic collage with magazine cutouts, paint, and textures on canvas, mixed media art, creative photography' },
  { text: "Photography walk through the old district. Found beauty in the decay", vibeTag: 'dramatic', prompt: 'A beautiful photograph of an abandoned building with light streaming through broken windows, urban exploration photography' },
  { text: "Oil painting in progress. The smell of turpentine means I'm in the zone", vibeTag: 'focused', prompt: 'An oil painting on an easel with rich colors, paint palette with mixed colors, art studio, warm lighting' },

  // === TECH & GAMING (10) ===
  { text: "New setup is FINALLY complete! Took 3 months of saving but worth every penny", vibeTag: 'focused', prompt: 'A clean gaming setup with RGB lighting, dual monitors, mechanical keyboard, and gaming chair, desk setup photography, cyberpunk aesthetic' },
  { text: "Retro gaming night! Some games just hit different on the original console", vibeTag: 'chill', prompt: 'A retro gaming setup with an old CRT TV, vintage game controllers, and classic game cartridges, nostalgic atmosphere, warm lighting' },
  { text: "Just built my first mechanical keyboard. The click-clack is music to my ears", vibeTag: 'focused', prompt: 'A custom mechanical keyboard with colorful keycaps on a desk, close-up photography, tech aesthetic' },
  { text: "Coding at 3am because the bug won't fix itself. Coffee count: 5", vibeTag: 'focused', prompt: 'A laptop screen showing code in a dark room with blue light, coffee cup nearby, programmer aesthetic, moody lighting' },
  { text: "VR is getting insane. Spent 3 hours in virtual reality and forgot what year it is", vibeTag: 'hyped', prompt: 'A person wearing a VR headset in a modern room with colorful lights, virtual reality experience, tech photography' },
  { text: "Just got the new headphones and the noise cancelling is another level", vibeTag: 'chill', prompt: 'Premium over-ear headphones on a desk, sleek design, tech product photography, dark background' },
  { text: "3D printing my own desk accessories now. The future is DIY", vibeTag: 'focused', prompt: 'A 3D printer creating a small object, tech workspace, maker culture, photography' },
  { text: "Smart home setup complete. I can control everything from my phone now", vibeTag: 'focused', prompt: 'A smart home control panel and devices, modern living room, tech lifestyle photography' },
  { text: "This monitor setup is giving me superpowers. Productivity through the roof", vibeTag: 'hyped', prompt: 'An ultrawide monitor displaying multiple windows, clean desk setup, productivity workspace, tech photography' },
  { text: "Retro computing vibes. This 90s Mac still works perfectly", vibeTag: 'chill', prompt: 'A vintage Macintosh computer on a desk, retro tech aesthetic, nostalgic photography, warm tones' },

  // === MUSIC & VIBES (10) ===
  { text: "Studio session going crazy tonight! New track is almost done and it's a banger", vibeTag: 'hyped', prompt: 'A music production studio with mixing board, studio monitors, and ambient purple lighting, professional recording studio, moody atmosphere' },
  { text: "Vinyl collection growing! Found a first press of my favorite album at the flea market", vibeTag: 'chill', prompt: 'A collection of vinyl records displayed on a wooden shelf, warm vintage lighting, record player nearby, music lover aesthetic' },
  { text: "Guitar practice paying off. Finally nailed that solo after 200 attempts", vibeTag: 'focused', prompt: 'An electric guitar on a stand with amplifier, practice room, dramatic lighting, music photography' },
  { text: "Concert last night was LIFE CHANGING. My ears are still ringing and I don't care", vibeTag: 'hyped', prompt: 'A live concert with stage lights and crowd, energetic atmosphere, music event photography' },
  { text: "Making beats at 2am because inspiration doesn't follow a schedule", vibeTag: 'dramatic', prompt: 'Music production software on a laptop screen with MIDI controller, late night creative session, moody blue lighting' },
  { text: "Piano practice before the world wakes up. There's something magical about morning music", vibeTag: 'peaceful', prompt: 'A grand piano in a room with morning light streaming through windows, elegant setting, music photography' },
  { text: "Just dropped my first EP! Two years of work finally out in the world", vibeTag: 'hyped', prompt: 'Album artwork displayed on a phone screen with streaming app, music release celebration, modern aesthetic' },
  { text: "Drum circle at the beach. Community music is the best kind of music", vibeTag: 'peaceful', prompt: 'A group drum circle on a beach at sunset, people playing djembe drums, community and music, warm lighting' },
  { text: "Record store digging. Found 3 gems I've been searching for forever", vibeTag: 'chill', prompt: 'Rows of vinyl records in a record store, browsing through crates, music store atmosphere, photography' },
  { text: "Saxophone on the street corner. Made $47 and a stranger cried. Music is powerful", vibeTag: 'dramatic', prompt: 'A saxophone player performing on a city street at dusk, passersby, urban music scene, street photography' },

  // === TEXT-ONLY POSTS (10) ===
  { text: "Just tried the new AI coding assistant and it wrote my entire app in 10 minutes. We're living in the future fr", vibeTag: 'focused' },
  { text: "Anyone else feel like we're on the verge of something massive with AI? The pace is insane right now", vibeTag: 'focused' },
  { text: "Woke up today and chose peace. No drama, just vibes", vibeTag: 'peaceful' },
  { text: "That post-workout feeling hits different when you actually stick to the routine", vibeTag: 'hyped' },
  { text: "Late night drives with the windows down >>>>", vibeTag: 'chill' },
  { text: "Sometimes you just need to disconnect and touch grass fr", vibeTag: 'peaceful' },
  { text: "3am thoughts hit different when the whole world is asleep", vibeTag: 'dramatic' },
  { text: "My cat just knocked my coffee off the table and looked at me like it was MY fault", vibeTag: 'laughing' },
  { text: "If you say 'I'm fine' 3 times in the mirror, a therapist appears", vibeTag: 'laughing' },
  { text: "Me: I'll go to bed early tonight. Also me at 3am: just one more video", vibeTag: 'laughing' },
];

// ─── Comment Templates (per vibe) ───────────────────────────────────
const COMMENT_TEMPLATES = {
  food: [
    "That looks absolutely incredible! Need the recipe ASAP",
    "My stomach just growled looking at this",
    "Okay you NEED to open a restaurant",
    "The plating is chef's kiss",
    "Save me a plate! I'm on my way",
    "This is the content I'm here for",
  ],
  travel: [
    "Adding this to my bucket list right now",
    "The colors in this are unreal",
    "Take me there! Living vicariously through your posts",
    "This is straight out of a movie",
    "How do you find these places?!",
    "Okay I'm booking flights right now",
  ],
  fashion: [
    "The vibes are immaculate",
    "Need links immediately",
    "Style icon behavior",
    "This whole look is everything",
    "Where did you get that?!",
    "You always come through with the fits",
  ],
  fitness: [
    "Dedication is inspiring! Keep going",
    "Goals right there",
    "The consistency is showing! Proud of you",
    "What's your routine? Need to step up my game",
    "Beast mode activated",
    "This motivated me to get off the couch",
  ],
  pets: [
    "I'm obsessed. Need 100 more pics",
    "THE CUTEST THING I'VE SEEN ALL DAY",
    "My heart just exploded",
    "Tell them I love them",
    "This should be illegal levels of cute",
    "Pet tax: accepted",
  ],
  art: [
    "The talent is unreal. How long did this take?",
    "This belongs in a museum",
    "Your creativity inspires me so much",
    "The colors are giving me life",
    "I need prints of this immediately",
    "Okay you're literally a genius",
  ],
  tech: [
    "My wallet is crying but my setup would be crying too if I didn't buy this",
    "RGB everything! Love the setup",
    "The cable management alone deserves an award",
    "What monitor is that? Looks incredible",
    "Dream setup right there",
    "This is peak productivity vibes",
  ],
  music: [
    "The taste! Drop the playlist link",
    "Need that vinyl in my collection",
    "Music is the universal language fr",
    "When's the album dropping??",
    "This gives me chills every time",
    "The dedication is real. Keep creating",
  ],
  general: [
    "This is why I love this app",
    "Real talk, this made my day",
    "ORRA community is unmatched",
    "Facts! Couldn't agree more",
    "You dropped this: crown emoji",
    "Say it louder for the people in the back",
    "Big mood",
    "This is the energy I needed today",
    "Preach! More people need to hear this",
    "Living for this content",
    "The way I felt this in my soul",
    "Valid. So valid.",
    "This is the kind of content that keeps me coming back",
    "You spoke nothing but facts here",
    "Needed to hear this today fr",
  ],
};

// ─── Reaction types ─────────────────────────────────────────────────
const REACTION_TYPES = ['heart', 'wow', 'omg', 'wtf', 'laugh', 'sad'];

// ─── Helpers ────────────────────────────────────────────────────────
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffleArray(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/**
 * Generate AI image using z-ai-generate CLI
 */
function generateAiImage(prompt, outputPath) {
  try {
    const cmd = `z-ai-generate -p "${prompt.replace(/"/g, '\\"')}" -o "${outputPath}" -s ${IMAGE_SIZE}`;
    execSync(cmd, { timeout: 90000, stdio: 'pipe' });
    return fs.existsSync(outputPath);
  } catch (err) {
    console.error(`  [IMG] Generation failed: ${err.message?.substring(0, 80)}`);
    return false;
  }
}

/**
 * Copy file to both upload directories (project root + standalone)
 */
function copyToBothDirs(srcFile, filename) {
  const dirs = [UPLOAD_DIR, STANDALONE_UPLOAD_DIR];
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const dest = path.join(dir, filename);
      fs.copyFileSync(srcFile, dest);
    } catch (err) {
      // Non-fatal — standalone dir might not exist yet
    }
  }
}

/**
 * Get comment category based on post vibe/text
 */
function getCommentCategory(template) {
  const text = template.text.toLowerCase();
  const prompt = template.prompt || '';
  if (prompt.includes('food') || prompt.includes('ramen') || prompt.includes('pizza') || text.includes('cook') || text.includes('recipe') || text.includes('brunch') || text.includes('coffee') || text.includes('sushi') || text.includes('bbq') || text.includes('baking') || text.includes('dumpling') || text.includes('smoothie') || text.includes('matcha') || text.includes('chocolate') || text.includes('mango') || text.includes('pancake') || text.includes('croissant')) return 'food';
  if (prompt.includes('beach') || prompt.includes('mountain') || prompt.includes('city') || prompt.includes('sunset') || prompt.includes('street art') || prompt.includes('road') || prompt.includes('cherry') || prompt.includes('temple') || prompt.includes('aurora') || prompt.includes('santorini') || prompt.includes('balloon') || prompt.includes('rain') || prompt.includes('hiker') || prompt.includes('waterfall') || prompt.includes('desert')) return 'travel';
  if (prompt.includes('fashion') || prompt.includes('streetwear') || prompt.includes('sneaker') || prompt.includes('vintage') || prompt.includes('wardrobe') || prompt.includes('suit') || prompt.includes('jewelry') || prompt.includes('sweater') || prompt.includes('festival')) return 'fashion';
  if (prompt.includes('gym') || prompt.includes('basketball') || prompt.includes('yoga') || prompt.includes('running') || prompt.includes('swimming') || prompt.includes('climbing') || prompt.includes('boxing') || prompt.includes('surf') || prompt.includes('cycling') || prompt.includes('marathon')) return 'fitness';
  if (prompt.includes('cat') || prompt.includes('dog') || prompt.includes('puppy') || prompt.includes('parrot') || prompt.includes('kitten') || prompt.includes('turtle') || prompt.includes('aquarium') || prompt.includes('bunny') || prompt.includes('pet')) return 'pets';
  if (prompt.includes('painting') || prompt.includes('art') || prompt.includes('mural') || prompt.includes('pottery') || prompt.includes('watercolor') || prompt.includes('calligraphy') || prompt.includes('sculpture') || prompt.includes('collage') || prompt.includes('photography walk') || prompt.includes('oil painting')) return 'art';
  if (prompt.includes('gaming') || prompt.includes('keyboard') || prompt.includes('coding') || prompt.includes('VR') || prompt.includes('headphones') || prompt.includes('3D print') || prompt.includes('smart home') || prompt.includes('monitor') || prompt.includes('retro computing') || prompt.includes('mechanical')) return 'tech';
  if (prompt.includes('studio') || prompt.includes('vinyl') || prompt.includes('guitar') || prompt.includes('concert') || prompt.includes('beats') || prompt.includes('piano') || prompt.includes('EP') || prompt.includes('drum') || prompt.includes('record store') || prompt.includes('saxophone')) return 'music';
  return 'general';
}

// ─── Main Seed Function ─────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   ORRA Bulk Seed — 100 Posts + Photos    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log();
  console.log(`Target: ${TOTAL_POSTS} posts`);
  console.log(`Skip images: ${SKIP_IMAGES}`);
  console.log();

  // Load Prisma dynamically
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();

  // Step 1: Clean slate — wipe existing posts, comments, likes
  console.log('[1/5] Cleaning existing data...');
  try {
    await db.like.deleteMany({ where: { targetType: 'comment' } });
    await db.like.deleteMany({ where: { targetType: 'post' } });
    await db.comment.deleteMany();
    await db.repost.deleteMany();
    await db.save.deleteMany({ where: { targetType: 'post' } });
    await db.sharedPost.deleteMany();
    await db.pollVote.deleteMany();
    await db.pollOption.deleteMany();
    await db.poll.deleteMany();
    await db.post.deleteMany();
    console.log('  ✓ Cleared posts, comments, likes, reposts, saves');
  } catch (err) {
    console.error('  ✗ Clean failed:', err.message);
  }

  // Ensure upload directories exist
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(STANDALONE_UPLOAD_DIR)) fs.mkdirSync(STANDALONE_UPLOAD_DIR, { recursive: true });

  // Step 2: Generate images and create posts
  console.log(`[2/5] Creating ${TOTAL_POSTS} posts with images...`);

  // Shuffle templates and take what we need, cycling if necessary
  let templates = [];
  const shuffled = shuffleArray(POST_TEMPLATES);
  for (let i = 0; i < TOTAL_POSTS; i++) {
    templates.push(shuffled[i % shuffled.length]);
  }
  // Re-shuffle so duplicates are spread out
  templates = shuffleArray(templates);

  const createdPosts = [];
  const batchSize = 5;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const author = randomItem(BOT_USERS);
    const hasImage = !!template.prompt && !SKIP_IMAGES;
    let imageUrl = '';
    let imageFilename = '';

    // Generate AI image
    if (hasImage) {
      imageFilename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
      const imagePath = path.join(UPLOAD_DIR, imageFilename);

      console.log(`  [${i + 1}/${TOTAL_POSTS}] Generating image: "${template.prompt.substring(0, 50)}..."`);
      const success = generateAiImage(template.prompt, imagePath);
      if (success) {
        copyToBothDirs(imagePath, imageFilename);
        imageUrl = `/uploads/${imageFilename}`;
        console.log(`  ✓ Image generated: ${imageFilename}`);
      } else {
        console.log(`  ✗ Image failed, creating text-only post`);
      }
    }

    // Create random timestamps spread over the past 7 days
    const daysAgo = Math.random() * 7;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const postType = imageUrl ? 'image' : 'text';
    const likesCount = randomInt(3, 120);
    const commentsCount = randomInt(1, 25);
    const sharesCount = randomInt(0, 30);

    try {
      const post = await db.post.create({
        data: {
          text: template.text,
          images: imageUrl ? JSON.stringify([imageUrl]) : '[]',
          vibeTag: template.vibeTag,
          type: postType,
          authorId: author.id,
          likesCount,
          commentsCount,
          sharesCount,
          createdAt,
        },
      });
      createdPosts.push({ post, template, author });

      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${TOTAL_POSTS} posts created`);
      }
    } catch (err) {
      console.error(`  ✗ Post creation failed: ${err.message}`);
    }
  }

  console.log(`  ✓ Created ${createdPosts.length} posts`);

  // Step 3: Add comments to each post
  console.log(`[3/5] Adding comments to posts...`);
  let totalComments = 0;

  for (const { post, template } of createdPosts) {
    const category = getCommentCategory(template);
    const commentPool = COMMENT_TEMPLATES[category] || COMMENT_TEMPLATES.general;
    const numComments = randomInt(2, 6);
    const commentAuthors = shuffleArray(BOT_USERS).slice(0, numComments);

    for (let j = 0; j < numComments; j++) {
      try {
        // Spread comment times between post creation and now
        const postTime = new Date(post.createdAt).getTime();
        const now = Date.now();
        const commentTime = new Date(postTime + Math.random() * (now - postTime));

        await db.comment.create({
          data: {
            text: randomItem(commentPool),
            postId: post.id,
            authorId: commentAuthors[j % commentAuthors.length].id,
            // likesCount is not a direct field on Comment
            createdAt: commentTime,
          },
        });
        totalComments++;
      } catch (err) {
        // Skip individual comment failures
      }
    }
  }

  console.log(`  ✓ Created ${totalComments} comments`);

  // Step 4: Add random likes/reactions
  console.log(`[4/5] Adding random reactions...`);
  let totalReactions = 0;

  for (const { post } of createdPosts) {
    const numReactions = randomInt(2, 10);
    const reactors = shuffleArray(BOT_USERS).slice(0, numReactions);

    for (const reactor of reactors) {
      try {
        await db.like.create({
          data: {
            userId: reactor.id,
            targetId: post.id,
            targetType: 'post',
            reactionType: randomItem(REACTION_TYPES),
          },
        });
        totalReactions++;
      } catch (err) {
        // Skip duplicates
      }
    }
  }

  // Also add some comment reactions
  const allComments = await db.comment.findMany({ take: 200 });
  for (const comment of allComments) {
    if (Math.random() < 0.4) { // 40% of comments get reactions
      const reactor = randomItem(BOT_USERS);
      try {
        await db.like.create({
          data: {
            userId: reactor.id,
            targetId: comment.id,
            targetType: 'comment',
            reactionType: randomItem(REACTION_TYPES),
          },
        });
        totalReactions++;
      } catch (err) {
        // Skip duplicates
      }
    }
  }

  console.log(`  ✓ Created ${totalReactions} reactions`);

  // Step 5: Update counts to reflect actual data
  console.log(`[5/5] Updating post counts...`);

  for (const { post } of createdPosts) {
    try {
      const [actualLikes, actualComments] = await Promise.all([
        db.like.count({ where: { targetId: post.id, targetType: 'post' } }),
        db.comment.count({ where: { postId: post.id } }),
      ]);

      await db.post.update({
        where: { id: post.id },
        data: {
          likesCount: actualLikes + randomInt(5, 50), // Add organic-looking padding
          commentsCount: actualComments,
        },
      });
    } catch (err) {
      // Skip individual update failures
    }
  }

  console.log('  ✓ Counts updated');

  // Final stats
  const finalStats = await Promise.all([
    db.post.count(),
    db.comment.count(),
    db.like.count(),
    db.post.count({ where: { type: 'image' } }),
  ]);

  console.log();
  console.log('╔══════════════════════════════════════════╗');
  console.log('║          SEED COMPLETE ✓                 ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Posts:     ${String(finalStats[0]).padEnd(27)}║`);
  console.log(`║  Comments:  ${String(finalStats[1]).padEnd(27)}║`);
  console.log(`║  Reactions: ${String(finalStats[2]).padEnd(27)}║`);
  console.log(`║  Photo:     ${String(finalStats[3]).padEnd(27)}║`);
  console.log('╚══════════════════════════════════════════╝');

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
