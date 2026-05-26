#!/usr/bin/env node
/**
 * ORRA — Fast seed for 15 new bots (u32-u46)
 * Creates posts, comments, likes, and follows without image generation.
 * Images will be generated separately.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Post content for each bot - imagePrompt used for matching but images added later
const BOT_POSTS = {
  u32: [ // Zoe Castillo - Travel vlogger
    { text: "Woke up to roosters and monks chanting at 5am in Chiang Mai. This is the alarm clock I chose. The road teaches you to love mornings", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Golden dawn light over Chiang Mai temple rooftops with mist rising between them, monks in orange robes walking, peaceful Thailand morning, travel photography, warm golden tones' },
    { text: "Street food discovery: grilled squid on a stick at the Bangkok night market. 40 baht. That is $1.15. Better than any $30 appetizer I ever had in corporate life", vibeTag: 'chill', hasImage: true, imagePrompt: 'Sizzling grilled squid on wooden sticks at a vibrant Bangkok night market stall, smoke rising, colorful market lights, Thai street food photography, warm amber lighting' },
    { text: "Slow travel means staying long enough to become a regular at the corner cafe. The owner saves me a table and practices English while I practice Thai. This is the real exchange rate", vibeTag: 'chill', hasImage: false },
    { text: "Island hopping in the Philippines. El Nido looks like someone photoshopped reality. Wanderlust is real and I am never curing it", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Turquoise lagoon surrounded by towering limestone karst cliffs in El Nido Philippines, wooden boat in crystal clear water, tropical paradise, aerial drone travel photography' },
    { text: "Digital nomad truth: sometimes the wifi is just a guy named Dave in a coconut hut. But the view from my office today makes up for the 3MB download speed", vibeTag: 'chill', hasImage: true, imagePrompt: 'Laptop on a bamboo table with ocean view from a tropical beach hut, coconut drink beside it, white sand beach, remote work lifestyle photography, bright natural daylight' },
    { text: "Quit my job 18 months ago. Since then 12 countries, learned to cook pad thai from a grandmother, and cried at 4 sunrises. Your 9-5 is not the only way to live", vibeTag: 'dramatic', hasImage: false },
    { text: "Vietnam by motorbike day 7: my butt hurts, my heart is full, and I accidentally joined a wedding in a village nobody has heard of. This view tho", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Solo traveler on a motorbike winding through lush Vietnamese rice terraces, mountains in background, adventure travel photography, wide angle scenic view' },
  ],
  u33: [ // Dex Murphy - Cybersecurity
    { text: "Just found a critical RCE in a Fortune 500 company. Responsible disclosure filed. Patch your systems people. The vulnerability is real and it only takes one unpatched server", vibeTag: 'news', hasImage: false },
    { text: "Won our CTF qualifier this weekend! 12 hours, 47 challenges, and way too much caffeine. Trust me on this - the next generation of security researchers is absolutely terrifying in the best way", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Computer screen showing terminal with CTF challenge flags captured, green text on black background, energy drinks on desk, dark room with blue LED lighting, hacker workspace photography' },
    { text: "Your password is still Password123 and you reuse it everywhere. I am not even surprised anymore. 0-day vibes but your credential stuffing is a 365-day problem", vibeTag: 'focused', hasImage: false },
    { text: "New blog post: Why your smart home is a security nightmare. That Ring doorbell you love? It is a perimeter breach waiting to happen. The vulnerability is real", vibeTag: 'news', hasImage: true, imagePrompt: 'Smart home devices on a desk with red warning overlay, cybersecurity concept photography, moody dark background with red accent lighting' },
    { text: "DEF CON 2025 was insane. Met the 15-year-old who social-engineered a multi-factor auth system. The kids are not just alright, they are ahead of us. Patch your systems", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Crowded hacker convention floor at DEF CON, people with laptops, colorful LED badges, cybersecurity conference photography, energetic atmosphere with dim lighting' },
    { text: "Zero-day in a popular VPN client discovered this morning. If you are using it, disconnect NOW and check the vendor advisory. I will share details after the patch drops", vibeTag: 'news', hasImage: false },
    { text: "My threat model does not include nation states because I am not that interesting. But yours might. Know your adversary. Know your surface area. Trust me on this", vibeTag: 'focused', hasImage: false },
  ],
  u34: [ // Amara Okafor - Fashion designer
    { text: "Just showed my new collection at Lagos Fashion Week. Ankara meets brutalist architecture. Fabric tells stories and this one is about building new worlds from old patterns. Runway ready", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Model walking the runway in African-print modern architectural fashion, bold Ankara fabric structured like brutalist buildings, Lagos Fashion Week runway, dramatic stage lighting' },
    { text: "My grandmother taught me to sew on a treadle machine in Enugu. Now my pieces are in Vogue. The culture wears it best - every stitch carries her hands", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Vintage treadle sewing machine with colorful African fabric draped over it, warm village interior, Nigerian heritage photography, nostalgic warm lighting' },
    { text: "New fabric shipment from Accra. Kente cloth that took 3 weavers 2 weeks to produce by hand. Sew what you believe - and I believe in paying artisans what their time is worth", vibeTag: 'focused', hasImage: true, imagePrompt: 'Handwoven Kente cloth in vibrant gold, green, and red patterns, displayed on a wooden loom, Ghanaian artisan workshop, textile photography, rich warm natural lighting' },
    { text: "Streetwear collab with a Lagos skate crew dropping next month. African prints on oversized hoodies. The culture wears it best and the streets will prove it", vibeTag: 'hyped', hasImage: false },
    { text: "Design process: start with the fabric, not the sketch. Let the textile speak first. Fabric tells stories if you listen before you cut", vibeTag: 'chill', hasImage: true, imagePrompt: 'Fashion designer hands working with vibrant African fabric on a cutting table, sketches pinned to mood board above, Lagos design studio, creative workspace photography' },
    { text: "London meeting went incredible. A major retailer wants to stock our collection. But only if we mass-produce overseas. Answer: absolutely not. Sew what you believe. Handmade or nothing", vibeTag: 'dramatic', hasImage: false },
    { text: "Mood board for the next collection: Yoruba mythology meets cyberpunk. Orishas in neon. Fabric tells stories and this one is going to be loud. Runway ready", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Fashion mood board with Yoruba art and cyberpunk neon imagery side by side, fabric swatches in bright colors, design studio wall, creative process photography' },
  ],
  u35: [ // Sam Nakamura - Pastry chef
    { text: "72-hour croissant dough: 27 folds, 3 lamination turns, and a 3am alarm. The dough knows when you rush it. Laminated perfection is a discipline, not a recipe", vibeTag: 'focused', hasImage: true, imagePrompt: 'Hands performing lamination folds on croissant dough, visible butter layers between pastry, flour-dusted wooden board, bakery kitchen, professional pastry photography' },
    { text: "New recipe testing: matcha black sesame danish. 4 attempts, 2 disasters, and 1 absolute winner. Bake it till you make it", vibeTag: 'chill', hasImage: true, imagePrompt: 'Beautiful matcha black sesame danish pastry on a ceramic plate, green and black swirl pattern, flaky layers visible, professional food photography' },
    { text: "Cookbook update: 80 recipes tested, 65 finalized. The sugar rush of holding my own printed pages is unreal. Every bake tells a story and this book is my whole story", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Pastry chef holding a mockup cookbook manuscript surrounded by plated desserts and recipe notes, bakery kitchen, warm ambient lighting, creative food photography' },
    { text: "Sunday morning kouign-amann. 14 hours from start to finish. Sugar rush is not just about eating - it is about the caramelization of pure dedication. The dough knows", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Golden caramelized kouign-amann pastry with visible sugar crust layers on rustic French baking paper, morning light, artisan bakery photography, warm golden tones' },
    { text: "People ask me if the 3am alarm ever gets easier. It does not. But watching the oven transform dough into something beautiful never gets old either. Bake it till you make it", vibeTag: 'chill', hasImage: false },
    { text: "Just taught my first baking workshop. 12 students, 120 croissants, and zero tears. Laminated perfection is achievable if you trust the process", vibeTag: 'focused', hasImage: true, imagePrompt: 'Baking workshop class with students shaping croissants, flour on tables, instructor demonstrating, warm bakery classroom, culinary education photography' },
  ],
  u36: [ // Rio Santos - Surf instructor
    { text: "Dawn patrol session. Perfect 4-foot swell, offshore wind, and only 3 of us out. The ocean knows when you show up early. Stay salty", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Surfer walking toward the ocean at dawn with surfboard under arm, empty beach, pink and orange sunrise over calm Pacific waves, golden hour surf photography' },
    { text: "Beach cleanup this morning: 47 pounds of trash in 2 hours. Protect what you love. The ocean gives us waves, fish, and oxygen. We owe it more than our garbage", vibeTag: 'focused', hasImage: true, imagePrompt: 'Group of volunteers collecting trash on a sandy beach at low tide, filled bags in foreground, ocean background, community conservation photography, bright morning daylight' },
    { text: "Taught a 7-year-old to stand up on her first wave today. Her scream of joy was louder than the surf. Wave rider for life now. Protect what you love", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Young girl standing up on a surfboard riding a small wave, instructor running alongside in shallow water, joyful expression, surf lesson photography, sunny beach' },
    { text: "The ocean knows your mood before you do. Bad day? Paddle out. Good day? Paddle out. The salt water is therapy you cannot bottle. Stay salty", vibeTag: 'chill', hasImage: false },
    { text: "New wetsuit made from recycled ocean plastics. Finally gear that aligns with the mission. Protect what you love - including what you wear in the water", vibeTag: 'chill', hasImage: true, imagePrompt: 'Eco-friendly recycled wetsuit displayed on a surfboard at the beach, ocean background, sustainable surf product photography, bright natural daylight' },
    { text: "Sunset session with the crew. 6 waves, 1 barrel, and a dolphin that surfed alongside us for 30 seconds. The ocean knows how to throw a party. Stay salty", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Silhouettes of surfers on waves at sunset, dolphin visible in the wave alongside surfer, orange and purple sky, golden hour surf photography, dramatic backlit scene' },
  ],
  u37: [ // Imani Williams - Therapist
    { text: "Gentle reminder: you do not have to earn rest. Your worth is not tied to your productivity. Healing takes time and rest IS the work sometimes. Your feelings are valid", vibeTag: 'peaceful', hasImage: false },
    { text: "Just facilitated my first intergenerational healing circle. Grandmothers, mothers, and daughters in the same room, finally talking. You deserve peace - and sometimes it starts with a single honest sentence", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Intimate circle of Black women of different ages sitting together in a warmly lit room, candles and tissues on a table between them, therapy group photography, warm soft lighting' },
    { text: "Therapy is not just for crises. It is for the Tuesday afternoon when everything is fine but something still feels off. Let us process this - you deserve peace even on ordinary days", vibeTag: 'chill', hasImage: true, imagePrompt: 'Cozy therapy office with two comfortable chairs, warm light through curtains, plant on windowsill, peaceful counseling room, interior photography, soft diffused natural light' },
    { text: "Hot take: generational trauma is not your fault but healing it IS your responsibility. The cycle breaks with you. Your feelings are valid AND you have the power to choose differently", vibeTag: 'focused', hasImage: false },
    { text: "Self-care is not always bubble baths and face masks. Sometimes it is setting a boundary that makes everyone uncomfortable. Healing takes time and boundaries are the medicine nobody wants to swallow", vibeTag: 'focused', hasImage: false },
    { text: "To the person reading this who needed permission: you are allowed to start over. As many times as it takes. Your feelings are valid. You deserve peace", vibeTag: 'peaceful', hasImage: false },
  ],
  u38: [ // Felix Andersen - Architect
    { text: "Just won our second AIA award for the Copenhagen Living Tower. 14 stories of mass timber, zero concrete structure. Sustainable by design. The building breathes and the planet thanks it", vibeTag: 'focused', hasImage: true, imagePrompt: 'Modern 14-story mass timber residential tower in Copenhagen with green terraces, sustainable architecture, dramatic architectural photography, overcast Nordic sky' },
    { text: "Design with purpose: every material in our new school project is either recycled or biodegradable. Form follows planet. The building breathes because the earth demands it", vibeTag: 'focused', hasImage: true, imagePrompt: 'Sustainable school building with recycled timber facade, green roof, solar panels, modern eco-architecture photography, bright natural daylight' },
    { text: "Sketching at 6am with coffee and silence. This is where the ideas come from. Not the meetings. Not the emails. The quiet. Design with purpose", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Architectural hand sketches on trace paper with coffee cup, drafting tools, morning light on desk, Scandinavian minimalist studio, creative process photography' },
    { text: "Concrete can be beautiful AND kind to the planet. Our new bio-concrete mix uses 40% less CO2. Sustainable by design is not a compromise - it is an evolution", vibeTag: 'news', hasImage: false },
    { text: "Visited a building I designed 5 years ago. The tenants turned the green roof into a community garden. The building breathes because the people inside give it life", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Lush community garden on a green rooftop of a modern sustainable building, residents tending vegetables, Copenhagen skyline, urban green living photography' },
    { text: "Keynote at the Venice Biennale next month: Architecture After Carbon. Design with purpose means designing for the world we want, not the one we inherited. Form follows planet", vibeTag: 'hyped', hasImage: false },
  ],
  u39: [ // Lex Rivera - Tattoo artist
    { text: "Just finished a 14-hour back piece. Japanese koi swimming upstream through scar tissue. Every line tells a story and this one is about transformation. The ink speaks", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Intricate Japanese koi tattoo on a back, vibrant orange and blue ink, traditional tattoo style, close-up tattoo photography, studio lighting showing skin detail' },
    { text: "Flash day this Saturday! $100 flat rate, first come first served. 20 original designs, no repeats. Skin is canvas and this weekend we paint. No regrets just art", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Tattoo flash art sheets pinned to a studio wall, traditional and neo-traditional designs, colorful tattoo flash sheets, tattoo studio photography, dramatic wall display lighting' },
    { text: "Client brought in their grandmother handwriting for a tattoo. Translating love into ink. Every line tells a story and some stories deserve to be carried forever. The ink speaks", vibeTag: 'chill', hasImage: true, imagePrompt: 'Tattoo artist hands carefully inking handwriting script on a client arm, close-up of tattoo machine and skin, emotional tattoo session, intimate studio photography' },
    { text: "8 years of ink and the best part is still the moment someone sees their finished piece in the mirror for the first time. That look is everything. No regrets just art", vibeTag: 'chill', hasImage: false },
    { text: "New flash sheet inspired by Day of the Dead and Texas wildflowers. Because why choose between heritage and home when you can have both. Skin is canvas", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Tattoo flash art combining Day of the Dead sugar skull imagery with Texas bluebonnet wildflowers, colorful illustration, tattoo studio wall, creative process photography' },
    { text: "Booking for custom work through March. Send me your story and I will send you a design. The ink speaks - let me help you say something worth wearing", vibeTag: 'focused', hasImage: false },
  ],
  u40: [ // Nadia Hassan - Journalist
    { text: "Just published my investigation into water privatization in the Sahel. 3 months of on-the-ground reporting. The story demands to be told even when the powerful want it buried. Beyond the headlines", vibeTag: 'news', hasImage: true, imagePrompt: 'African women carrying water containers across a dry Sahel landscape, drought conditions, documentary journalism photography, harsh sunlight' },
    { text: "Reporting from the ground in Khartoum. Internet is spotty but the stories are not. Unreported truth: the civilian toll is far higher than any official number suggests", vibeTag: 'focused', hasImage: true, imagePrompt: 'Journalist in press vest taking notes in a Middle Eastern urban conflict zone, damaged buildings in background, documentary war journalism photography, dramatic natural lighting' },
    { text: "Award announcement: I won the International Press Freedom Award. I would trade it for a world where journalists are not imprisoned for doing their jobs. Beyond the headlines", vibeTag: 'dramatic', hasImage: false },
    { text: "Mainstream media missed the story in Yemen again. I have been reporting there for 6 months. On the ground means being there when the cameras leave. Unreported truth", vibeTag: 'news', hasImage: false },
    { text: "New podcast episode: The Women Smugglers of the Sinai. They control a border no government can. Their stories are more complex than any headline. The story demands nuance", vibeTag: 'focused', hasImage: true, imagePrompt: 'Recording studio with microphone and headphones, podcast setup with notes from field reporting, journalism workspace photography, warm intimate lighting' },
    { text: "To every journalist working in dangerous conditions right now: your safety matters. Dead journalists cannot tell stories. Take the helmet. Take the fixer. Come home", vibeTag: 'focused', hasImage: false },
  ],
  u41: [ // Kai Tan - Mixologist
    { text: "New cocktail on the menu: The Midnight Garden. Gin, butterfly pea flower, yuzu, and a whisper of lavender. The drink speaks in colors. Stirred not shaken", vibeTag: 'chill', hasImage: true, imagePrompt: 'Deep purple-blue cocktail in a crystal coupe glass with lavender garnish, dark moody bar counter, professional cocktail photography, dramatic backlit bar lighting' },
    { text: "Friday night at the speakeasy. The door is unmarked, the cocktails are unforgettable, and the jazz is live. Pour with intention. The bar is open", vibeTag: 'chill', hasImage: true, imagePrompt: 'Intimate speakeasy bar interior with amber lighting, bartender shaking a cocktail, small tables with candles, jazz trio in corner, moody nightlife photography' },
    { text: "Bon Appetit just featured our bar. The cocktail that caught their attention: Smoked Rosemary Old Fashioned. The drink speaks and apparently the critics are listening. Stirred not shaken", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Smoked rosemary old fashioned cocktail in a rocks glass with rosemary sprig on fire, wisps of smoke rising, dark walnut bar top, professional cocktail photography' },
    { text: "Bartending philosophy: the best drink you will ever make is the one you make for someone who really needs it. Pour with intention. The bar is open", vibeTag: 'chill', hasImage: false },
    { text: "Tasting menu pairing night: 7 courses, 7 cocktails. Each drink designed to unlock a different flavor in the food. The drink speaks when the food listens", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Elegant tasting menu with paired cocktails on a dark restaurant table, multiple courses and drinks in sequence, fine dining cocktail pairing photography' },
    { text: "Home bar essentials: a good shaker, fresh citrus, and the willingness to fail. Every great cocktail started as a mistake someone decided to try again. Stirred not shaken", vibeTag: 'chill', hasImage: false },
  ],
  u42: [ // Bella Thompson - Plus-size model
    { text: "Just walked for Savage X Fenty. Every body is a runway body and Rihanna proved it before any of us had the words. Period. No shrink zone", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Curvy model walking a fashion runway in bold lingerie, confident powerful stride, dramatic stage lighting, fashion show photography, audience in background' },
    { text: "Photoshoot today and the photographer asked me to suck in my stomach. I asked him to expand his perspective. Own your beauty. No shrink zone. Period", vibeTag: 'dramatic', hasImage: false },
    { text: "Every body is a runway body. I do not say this as a motivational quote. I say this as someone who has walked runways in a size 18 and made them look good. Period", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Plus-size model posing confidently in high fashion editorial outfit, studio lighting, powerful pose, fashion photography, bold confident energy' },
    { text: "Brand reached out wanting to feature me in their inclusive campaign. Then asked if I could wear a corset for the shoot. That is not inclusion, that is decoration. Own your beauty. No shrink zone", vibeTag: 'focused', hasImage: false },
    { text: "To the girl staring at her closet thinking nothing will look good on her: the problem is never your body. The problem is an industry that forgot you exist. Every body is a runway body", vibeTag: 'peaceful', hasImage: false },
    { text: "New campaign shot just dropped. No retouching. No slimming. No apologies. This is what owning your beauty looks like. Period", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Stunning unretouched fashion campaign photo of a curvy woman in a designer outfit, natural beauty, powerful confident gaze, editorial fashion photography, bright studio lighting' },
  ],
  u43: [ // Omar Farouk - Documentary filmmaker
    { text: "Just wrapped filming in rural Kenya. The story is about water access and it will break your heart. The camera sees what the world chooses to ignore. Stories that matter", vibeTag: 'focused', hasImage: true, imagePrompt: 'Documentary filmmaker operating a camera in a rural African village, children gathered around, dry landscape, documentary photography, warm natural light' },
    { text: "3 films, 12 countries, infinite stories. My next project is about female rangers in Kenya protecting elephants from poachers. The camera sees their courage. Every frame a truth", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Female wildlife ranger standing guard in an African savanna, elephant herd in background, golden hour light, wildlife conservation documentary photography' },
    { text: "Editing bay at 2am. Watching footage of a grandmother teaching her granddaughter to carry water. 3 miles each way. The camera sees the love in every step. Rolling", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Editing bay with video timeline on screen showing documentary footage, coffee cups and hard drives, dark room with screen glow, filmmaking workspace photography' },
    { text: "Documentary filmmaking is not about having the best camera. It is about being in the right place at the right time with your eyes open. Stories that matter find you if you stay present", vibeTag: 'focused', hasImage: false },
    { text: "Grant rejected for the 4th time. The film about water access is too political they say. The camera sees what they want to keep invisible. Every frame a truth. We are making this film anyway", vibeTag: 'dramatic', hasImage: false },
    { text: "Film festival acceptance! Our documentary on East African water access will premiere at Tribeca. Stories that matter DO find their audience. Rolling", vibeTag: 'hyped', hasImage: false },
  ],
  u44: [ // Chloe Park - VR/AR developer
    { text: "Just shipped our first AR experience for medical training. Surgeons can now practice procedures in spatial computing before touching a patient. The future is spatial. Beyond the screen", vibeTag: 'focused', hasImage: true, imagePrompt: 'Person wearing AR headset in a medical training simulation, holographic surgical overlay visible, futuristic medical tech, XR development photography, clean lab lighting' },
    { text: "Built a virtual art gallery in 48 hours. Walked through it in VR and felt something I never expected: genuine emotion from a space that does not physically exist. Immersion is everything", vibeTag: 'dramatic', hasImage: true, imagePrompt: 'Virtual reality art gallery with floating digital art pieces, person in VR headset experiencing the space, neon-lit VR environment, XR photography, colorful immersive lighting' },
    { text: "Hot take: the metaverse is not dead. It just was not ready. Spatial computing is the actual future and it looks nothing like what Meta showed you. Rendering reality. Beyond the screen", vibeTag: 'news', hasImage: false },
    { text: "Prototyped a haptic feedback glove that lets you feel virtual textures. Silk, wood grain, water. Immersion is everything. The future is spatial and it has a sense of touch", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Haptic VR glove prototype on a tech workbench, electronic components visible, XR lab background, tech product photography, dramatic blue-purple lighting' },
    { text: "Our XR startup just closed seed funding. Building immersive worlds that feel real is now my actual job. Rendering reality one frame at a time. Beyond the screen", vibeTag: 'hyped', hasImage: false },
    { text: "If you have not tried the latest Quest update, the passthrough AR is genuinely impressive. Coffee on my real desk next to a virtual dashboard. The future is spatial and it is already here", vibeTag: 'chill', hasImage: false },
  ],
  u45: [ // Marcus Hayes - Basketball coach
    { text: "State championship game tonight. 15 years coaching and I still get butterflies. The gym teaches you that preparation meets opportunity. Team first. Built in the gym", vibeTag: 'hyped', hasImage: true, imagePrompt: 'High school basketball team huddle before a championship game, coach in center with clipboard, gymnasium background, sports photography, dramatic indoor lighting' },
    { text: "One of my players just got his first college scholarship offer. He came to me as a freshman who could not make a layup. The gym teaches patience and patience builds men. No excuses", vibeTag: 'hyped', hasImage: true, imagePrompt: 'High school basketball player signing a letter of intent, coach standing proudly behind him, family watching, gymnasium setting, emotional sports photography' },
    { text: "Practice today was 90 percent character building and 10 percent basketball. The gym teaches more than jump shots. It teaches accountability. Team first. No excuses", vibeTag: 'focused', hasImage: false },
    { text: "3 state championships in 15 years. But the real stat: 47 of my players went to college. The gym teaches you that the scoreboard is temporary and character is permanent. Built in the gym", vibeTag: 'focused', hasImage: true, imagePrompt: 'Basketball coach standing in an empty gymnasium looking at championship banners on the wall, morning light through gym windows, sports documentary photography, warm dramatic lighting' },
    { text: "Lost tonight. The kids are hurting. But the gym teaches you that defeat is just data for the next game. We learn, we adjust, we come back. Team first. No excuses", vibeTag: 'chill', hasImage: false },
    { text: "Former player just became a coach himself. That is the real championship. The gym teaches and the lessons multiply. Built in the gym", vibeTag: 'peaceful', hasImage: false },
  ],
  u46: [ // Ava Sterling - Botanist/plant influencer
    { text: "Plant parent milestone: 200 houseplants and counting. The roots know when you give them love. Green thumb vibes. Plants are therapy you can water", vibeTag: 'chill', hasImage: true, imagePrompt: 'Lush indoor jungle with hundreds of houseplants on shelves, hanging plants, and window displays, green botanical paradise, botanical photography, bright natural daylight' },
    { text: "Your fern is dying because you are loving it wrong. Not too little water - too much. The roots know. Water with intention, not with guilt. Plants are therapy but they need boundaries too", vibeTag: 'focused', hasImage: true, imagePrompt: 'Overwatered fern with yellowing fronds next to a properly cared for fern, comparison plant care, botanical photography, soft natural daylight, educational style' },
    { text: "Rare Monstera Thai Constellation just unfurled a new leaf. The variegation is stunning. The roots know when the conditions are right. Green thumb vibes", vibeTag: 'hyped', hasImage: true, imagePrompt: 'Rare Monstera Thai Constellation with stunning white variegation on a new leaf, close-up botanical photography, soft diffused natural light, plant collector aesthetic' },
    { text: "Science-backed plant tip: misting your tropical plants does almost nothing for humidity. Get a humidifier instead. The roots know what they actually need vs what looks aesthetic on Instagram. Water with intention", vibeTag: 'focused', hasImage: false },
    { text: "Greenhouse tour this weekend! Come see 200+ plants and learn their stories. Plants are therapy you can water and sometimes they water you back. Green thumb vibes", vibeTag: 'chill', hasImage: true, imagePrompt: 'Beautiful home greenhouse filled with lush tropical plants, person tending plants inside, botanical lifestyle photography, warm filtered sunlight through glass' },
    { text: "Repotting day. There is something meditative about getting your hands in the soil. The roots know and so does your nervous system. Plants are therapy. Water with intention", vibeTag: 'peaceful', hasImage: true, imagePrompt: 'Hands repotting a plant with fresh soil on a potting bench, gardening tools, warm greenhouse light, botanical hobby photography, earthy natural tones' },
  ],
};

// Contextual comment templates per topic
const COMMENT_TEMPLATES = {
  travel: [
    "This is giving me serious wanderlust! How long did you stay there?",
    "That view is unreal! Did you have any language barrier issues?",
    "Living the dream! What made you choose that destination?",
    "The food in SE Asia is unbeatable. Best meal you had so far?",
    "Slow travel is the way to go. How long do you usually stay in one place?",
  ],
  cybersecurity: [
    "This is why I use a password manager and 2FA on everything. Great work on the disclosure!",
    "CTF sounds intense. What was the hardest challenge you solved?",
    "Smart home security is so overlooked. People just connect everything without thinking",
    "DEF CON is on my bucket list! Was the social engineering contest as wild as they say?",
    "Zero-day discoveries like this are exactly why bug bounty programs exist. Respect the responsible disclosure",
  ],
  fashion: [
    "Ankara and brutalist architecture? That combo sounds incredible. Where can I see the collection?",
    "Your grandmother would be so proud. Handmade always hits different",
    "The culture definitely wears it best! Fast fashion could never compete with real artisanship",
    "That Kente cloth is absolutely stunning. The colors are everything",
    "Yoruba mythology meets cyberpunk? I need to see this mood board!",
  ],
  baking: [
    "72-hour croissants?! The dedication is real. How many layers do you end up with?",
    "Matcha and black sesame is such a perfect combo. Can you share the recipe?",
    "A cookbook! That is amazing. When does it drop?",
    "Kouign-amann is my absolute weakness. That caramelized sugar crust is heaven",
    "Your students are so lucky! I would kill for a croissant workshop in my area",
  ],
  ocean: [
    "Dawn patrol is the best. Nothing beats that empty lineup feeling",
    "47 pounds of trash is incredible. We do a monthly cleanup here too",
    "That 7-year-old is going to remember this forever! What a moment",
    "Recycled wetsuits are the future. Which brand did you go with?",
    "A dolphin riding a wave with you? That is peak ocean magic right there",
  ],
  therapy: [
    "This hit different today. Thank you for the reminder about rest",
    "Intergenerational healing circles are so powerful. Three generations in one room is brave",
    "Needed to hear this. Therapy should not just be for when things fall apart",
    "Setting boundaries IS self-care. It took me too long to learn that",
    "Starting over is allowed. Reading this at the exact right time. Thank you",
  ],
  architecture: [
    "Mass timber is the future! That building looks incredible. Zero concrete is huge",
    "Form follows planet. Love that reframing. Sustainability should be the baseline not the selling point",
    "6am sketching sessions are where the magic happens. The quiet is the best studio",
    "Bio-concrete with 40 percent less CO2? That is a game changer. What is the cost comparison?",
    "Community garden on the roof! That is architecture serving its actual purpose",
  ],
  tattoo: [
    "14 hours of koi work! The dedication from both artist and client is incredible",
    "Flash day deals are the best. Wish I could make it to Austin this Saturday",
    "Grandmother handwriting tattoos always make me tear up. Such a beautiful way to carry someone with you",
    "Day of the Dead and Texas wildflowers? That flash sheet sounds amazing. Any sneak peeks?",
    "8 years and still passionate. That look in the mirror moment really is everything",
  ],
  journalism: [
    "Water privatization is such an underreported crisis. Thank you for being on the ground",
    "Stay safe out there. The world needs journalists like you more than ever",
    "Press Freedom Award well deserved. The work you do matters beyond measure",
    "Yemen coverage is so rare. Thank you for staying when others leave",
    "The Women Smugglers podcast sounds fascinating. Dropping a follow right now",
  ],
  cocktails: [
    "Butterfly pea flower cocktails are magic. The color change is mesmerizing",
    "Speakeasy vibes with live jazz? That is my dream Friday night. Where is this?",
    "Smoked rosemary old fashioneds are elite. Bon Appetit has good taste!",
    "7 course pairing sounds incredible. What was the standout combination?",
    "The best drinks ARE the ones made with intention. That philosophy applies to everything",
  ],
  bodyPositivity: [
    "Savage X Fenty changed the entire game. Walking that runway is iconic!",
    "Expand your perspective. Love that response! The photographer needed to hear that",
    "A size 18 on a runway and looking flawless. This is the representation we needed",
    "Not decoration but inclusion. Brands need to understand the difference",
    "No retouching and no apologies. This is the energy I needed today",
  ],
  documentary: [
    "Water access stories need to be told. When does the film come out?",
    "Female rangers protecting elephants! That is a story that needs to be heard worldwide",
    "2am editing sessions are where documentaries actually come together. Respect the grind",
    "Keep making the film. The right funding will come. Stories like this find a way",
    "Tribeca premiere! That is massive. Congratulations!",
  ],
  VR: [
    "AR for medical training is such a game changer. Surgeons practicing before real patients is the future",
    "Feeling genuine emotion in VR is that moment when you know spatial computing is real",
    "Spatial computing is definitely the real metaverse. Meta just sold the wrong version of it",
    "Haptic gloves! Being able to FEEL virtual textures is next level. When can consumers get this?",
    "Seed funding secured! The XR space is about to get very exciting",
  ],
  basketball: [
    "Good luck tonight coach! 15 years and still butterflies means you still care. That matters",
    "From can not make a layup to college scholarship. That is coaching done right",
    "Character building over basketball. That is how you build men. Respect",
    "47 players to college is the real championship. The banners are great but that stat is legendary",
    "Former players becoming coaches is the ultimate compliment. You built something that multiplies",
  ],
  plants: [
    "200 plants?! My 12 are already taking over my apartment. How do you manage them all?",
    "Overwatering is the number one plant killer! People love their plants to death literally",
    "That Thai Constellation variegation is stunning. Where did you find it?",
    "The misting myth needs to die. Humidifiers all the way. Science-backed plant care for the win",
    "Repotting is genuinely therapeutic. Getting hands in soil resets my whole nervous system",
  ],
};

// Map post keywords to topic categories
function getPostTopic(text) {
  const lower = text.toLowerCase();
  if (lower.match(/travel|thailand|vietnam|philippines|bangkok|nomad|island|motorbike/)) return 'travel';
  if (lower.match(/cyber|hack|ctf|password|security|vpn|zero.day|def.con/)) return 'cybersecurity';
  if (lower.match(/fashion|runway|ankara|kente|sew|fabric|textile|vogue/)) return 'fashion';
  if (lower.match(/bake|pastry|croissant|dough|cookbook|lamination|danish/)) return 'baking';
  if (lower.match(/surf|ocean|beach|wave|wetsuit|dolphin/)) return 'ocean';
  if (lower.match(/therapy|healing|trauma|feelings|rest|boundary|mental/)) return 'therapy';
  if (lower.match(/architect|building|timber|concrete|sustain|green.roof|design/)) return 'architecture';
  if (lower.match(/tattoo|ink|flash|skin|canvas/)) return 'tattoo';
  if (lower.match(/journalist|report|investigat|press|yemen|sudan/)) return 'journalism';
  if (lower.match(/cocktail|bar|speakeasy|mixolog|drink|bartend/)) return 'cocktails';
  if (lower.match(/model|body|runway|size|plus|represent|beauty/)) return 'bodyPositivity';
  if (lower.match(/film|document|camera|footage|editing|premiere/)) return 'documentary';
  if (lower.match(/vr|ar|spatial|immersive|xr|meta|haptic/)) return 'VR';
  if (lower.match(/basketball|coach|gym|champion|player|team/)) return 'basketball';
  if (lower.match(/plant|fern|monstera|green|root|garden|botan/)) return 'plants';
  return 'travel'; // default
}

async function main() {
  console.log('🚀 ORRA — Fast seed for new bots (u32-u46)');
  console.log('================================================\n');

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  // Get all existing user IDs for comments/likes
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const allUserIds = allUsers.map(u => u.id);
  const newBotIds = Object.keys(BOT_POSTS);
  const existingBotIds = allUserIds.filter(id => !newBotIds.includes(id) && id !== 'cmor7se4b0000neqmmpej7m6j');

  // Get existing posts for commenting
  const existingPosts = await prisma.post.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    select: { id: true, text: true, authorId: true }
  });

  let totalPosts = 0;
  let totalComments = 0;
  let totalLikes = 0;

  // Create posts for each new bot
  for (const [botId, posts] of Object.entries(BOT_POSTS)) {
    console.log(`\n📝 Creating posts for ${botId}...`);

    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      const createdAt = new Date(now - (posts.length - i) * (2 * HOUR + Math.random() * 6 * HOUR));

      // For now, create posts without images. We'll add images in a separate step.
      const post = await prisma.post.create({
        data: {
          text: p.text,
          vibeTag: p.vibeTag,
          type: p.hasImage ? 'image' : 'text',
          images: '[]', // Will be updated when images are generated
          authorId: botId,
          createdAt,
        }
      });
      totalPosts++;

      // Add 1-3 comments from other bots on each post
      const numComments = 1 + Math.floor(Math.random() * 3);
      const topic = getPostTopic(p.text);
      const templates = COMMENT_TEMPLATES[topic] || COMMENT_TEMPLATES.travel;

      for (let c = 0; c < numComments; c++) {
        const commenterPool = existingBotIds.filter(id => id !== botId);
        const commenterId = commenterPool[Math.floor(Math.random() * commenterPool.length)];
        const commentText = templates[Math.floor(Math.random() * templates.length)];

        try {
          await prisma.comment.create({
            data: {
              text: commentText,
              postId: post.id,
              authorId: commenterId,
              createdAt: new Date(createdAt.getTime() + (c + 1) * 15 * 60 * 1000 + Math.random() * 30 * 60 * 1000),
            }
          });
          totalComments++;
        } catch (e) {
          // Skip duplicate comments
        }
      }

      // Update commentsCount
      await prisma.post.update({
        where: { id: post.id },
        data: { commentsCount: numComments }
      });

      // Add 2-5 likes
      const numLikes = 2 + Math.floor(Math.random() * 4);
      const reactionTypes = ['like', 'like', 'like', 'wow', 'laughing', 'omg', 'care'];
      const likerPool = [...existingBotIds].filter(id => id !== botId);
      const usedLikers = new Set();

      for (let l = 0; l < numLikes && l < likerPool.length; l++) {
        const availableLikers = likerPool.filter(id => !usedLikers.has(id));
        if (availableLikers.length === 0) break;
        const likerId = availableLikers[Math.floor(Math.random() * availableLikers.length)];
        usedLikers.add(likerId);
        const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];

        try {
          await prisma.like.create({
            data: {
              userId: likerId,
              targetId: post.id,
              targetType: 'post',
              reactionType,
            }
          });
          totalLikes++;
        } catch (e) {
          // Skip duplicates
        }
      }

      // Update likesCount
      await prisma.post.update({
        where: { id: post.id },
        data: { likesCount: numLikes }
      });
    }
  }

  // New bots also comment on existing posts (contextual)
  console.log('\n💬 Adding contextual comments from new bots on existing posts...');
  for (const postId of existingPosts.slice(0, 60).map(p => p.id)) {
    const post = existingPosts.find(p => p.id === postId);
    if (!post) continue;

    // Pick 1-2 new bots to comment
    const numNewComments = Math.random() < 0.4 ? 1 : (Math.random() < 0.6 ? 2 : 0);
    for (let c = 0; c < numNewComments; c++) {
      const botId = newBotIds[Math.floor(Math.random() * newBotIds.length)];
      if (botId === post.authorId) continue;

      const topic = getPostTopic(post.text);
      const templates = COMMENT_TEMPLATES[topic] || COMMENT_TEMPLATES.travel;
      const commentText = templates[Math.floor(Math.random() * templates.length)];

      try {
        await prisma.comment.create({
          data: {
            text: commentText,
            postId: post.id,
            authorId: botId,
          }
        });
        totalComments++;

        // Increment commentsCount
        await prisma.post.update({
          where: { id: post.id },
          data: { commentsCount: { increment: 1 } }
        });
      } catch (e) {
        // Skip
      }
    }
  }

  // Add likes from new bots on existing posts
  console.log('❤️ Adding likes from new bots on existing posts...');
  for (const post of existingPosts.slice(0, 80)) {
    const numNewLikes = Math.random() < 0.5 ? 1 : (Math.random() < 0.7 ? 2 : 0);
    const reactionTypes = ['like', 'like', 'like', 'wow', 'laughing', 'omg', 'care'];

    for (let l = 0; l < numNewLikes; l++) {
      const botId = newBotIds[Math.floor(Math.random() * newBotIds.length)];
      const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];

      try {
        await prisma.like.create({
          data: {
            userId: botId,
            targetId: post.id,
            targetType: 'post',
            reactionType,
          }
        });
        totalLikes++;
        await prisma.post.update({
          where: { id: post.id },
          data: { likesCount: { increment: 1 } }
        });
      } catch (e) {
        // Skip duplicates
      }
    }
  }

  // Create some follows between new bots and existing users
  console.log('👥 Creating follows...');
  let totalFollows = 0;
  for (const botId of newBotIds) {
    // Each new bot follows 5-10 existing users
    const numFollows = 5 + Math.floor(Math.random() * 6);
    const shuffledExisting = [...existingBotIds].sort(() => Math.random() - 0.5);
    for (let f = 0; f < numFollows && f < shuffledExisting.length; f++) {
      try {
        await prisma.follow.create({
          data: { followerId: botId, followingId: shuffledExisting[f] }
        });
        totalFollows++;
      } catch (e) { /* skip dupes */ }
    }
    // Some existing users follow back
    const numFollowBacks = 3 + Math.floor(Math.random() * 5);
    const backPool = shuffledExisting.slice(0, numFollowBacks);
    for (const backId of backPool) {
      try {
        await prisma.follow.create({
          data: { followerId: backId, followingId: botId }
        });
        totalFollows++;
      } catch (e) { /* skip dupes */ }
    }
  }

  console.log('\n================================================');
  console.log('✅ Fast seed complete!');
  console.log(`   Posts created: ${totalPosts}`);
  console.log(`   Comments created: ${totalComments}`);
  console.log(`   Likes created: ${totalLikes}`);
  console.log(`   Follows created: ${totalFollows}`);
  console.log('   Next step: Run image generation separately');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
