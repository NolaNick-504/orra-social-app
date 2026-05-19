const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Realistic conversation comments for each seed post
// Each conversation flows naturally — people reply to each other, react, joke
const postComments = {
  'p0a': {
    count: 42,
    comments: [
      { authorId: 'u4', text: 'This app is insane! The vibe here is unlike anything else', minutesAgo: 58 },
      { authorId: 'u10', text: 'Just joined and already hooked. The design is so clean!' , minutesAgo: 55 },
      { authorId: 'u1', text: 'Right?? The neon aesthetic is everything I didn\'t know I needed', minutesAgo: 53 },
      { authorId: 'u14', text: 'Yo this platform actually feels fresh for once', minutesAgo: 50 },
      { authorId: 'u15', text: 'The ORRA tokens system is so clever, earning while posting? Sign me up', minutesAgo: 47 },
      { authorId: 'u4', text: '@mayachen fr! I already made like 50 tokens just vibing today', minutesAgo: 44 },
      { authorId: 'u7', text: 'Love that there\'s a wellness community here already', minutesAgo: 40 },
      { authorId: 'u16', text: 'The dance challenges are where it\'s at though', minutesAgo: 37 },
      { authorId: 'u13', text: 'Moved here from Insta and I\'m never going back. This is the future.', minutesAgo: 34 },
      { authorId: 'u8', text: 'The dark mode is perfect. No eye strain at 3am scrolling lol', minutesAgo: 30 },
      { authorId: 'u5', text: 'The travel section is beautiful! Barcelona photos are stunning', minutesAgo: 28 },
      { authorId: 'u3', text: 'Can we talk about how smooth the UI is? No lag at all', minutesAgo: 25 },
      { authorId: 'u9', text: 'The music integration is fire, dropped my first track here yesterday', minutesAgo: 22 },
      { authorId: 'u1', text: '@musiccentral I saw that! The beat was wild', minutesAgo: 20 },
      { authorId: 'u12', text: 'About to drop a remix on the dance challenge, stay tuned', minutesAgo: 18 },
      { authorId: 'u6', text: 'From a tech perspective, this app is really well built. Rare for social media.', minutesAgo: 15 },
      { authorId: 'u14', text: '@techdaily true, most new apps crash on day one but this one\'s solid', minutesAgo: 13 },
      { authorId: 'u11', text: 'The community here actually feels real, not just bots and ads', minutesAgo: 10 },
      { authorId: 'u15', text: 'Okay but who else is addicted to the Prism reels? Can\'t stop watching', minutesAgo: 8 },
      { authorId: 'u4', text: '@mayachen ME. I\'ve watched the dance battle reel like 20 times', minutesAgo: 7 },
      { authorId: 'u13', text: 'The fact that we earn tokens for being active is such a game changer', minutesAgo: 5 },
      { authorId: 'u10', text: 'Welcome to everyone joining! You\'re gonna love it here', minutesAgo: 4 },
      { authorId: 'u16', text: 'ORRA gang rise up', minutesAgo: 3 },
      { authorId: 'u7', text: 'Remember to take breaks and stretch while scrolling haha', minutesAgo: 2 },
      { authorId: 'u3', text: 'This is what social media should\'ve been from the start', minutesAgo: 1 },
    ]
  },
  'p0b': {
    count: 38,
    comments: [
      { authorId: 'u10', text: 'Absolutely! Style is an attitude, not a price tag', minutesAgo: 120 },
      { authorId: 'u13', text: 'My summer lookbook just dropped and I stand by this 100%', minutesAgo: 115 },
      { authorId: 'u5', text: 'The Barcelona street style changed my whole perspective on fashion', minutesAgo: 110 },
      { authorId: 'u1', text: 'Fashion is art you wear. That\'s what I always say!', minutesAgo: 105 },
      { authorId: 'u15', text: 'Who else thrifts most of their fits? Best finds always hidden', minutesAgo: 100 },
      { authorId: 'u10', text: '@mayachen thrifting is an art form! I found a vintage jacket for $8 last week', minutesAgo: 95 },
      { authorId: 'u4', text: 'Style tip: confidence is the best accessory you can wear', minutesAgo: 88 },
      { authorId: 'u14', text: 'Real talk, I used to try so hard. Now I just wear what feels right', minutesAgo: 82 },
      { authorId: 'u3', text: 'The neon aesthetic on ORRA is influencing my whole wardrobe rn', minutesAgo: 75 },
      { authorId: 'u16', text: 'Streetwear and dance culture go hand in hand fr', minutesAgo: 68 },
      { authorId: 'u9', text: 'Stage outfits are my favorite thing to design. Music x fashion = perfection', minutesAgo: 60 },
      { authorId: 'u1', text: '@musiccentral the fits in your last performance video were incredible!', minutesAgo: 55 },
      { authorId: 'u13', text: 'Reminder: you don\'t need designer labels to have style', minutesAgo: 48 },
      { authorId: 'u7', text: 'Comfort > everything. If you\'re not comfortable, it shows', minutesAgo: 40 },
      { authorId: 'u5', text: 'This is why I love ORRA — everyone has their own unique style here', minutesAgo: 32 },
      { authorId: 'u14', text: 'No two people dress the same on this app and I love that', minutesAgo: 25 },
      { authorId: 'u6', text: 'The digital fashion NFTs are gonna be huge on this platform', minutesAgo: 18 },
      { authorId: 'u10', text: 'Wear what makes YOU feel amazing. That\'s the whole secret', minutesAgo: 10 },
      { authorId: 'u3', text: 'Facts. Style can\'t be bought, it\'s cultivated', minutesAgo: 5 },
    ]
  },
  'p1': {
    count: 35,
    comments: [
      { authorId: 'u13', text: 'Jessica this is absolutely stunning! The neon palette is incredible', minutesAgo: 200 },
      { authorId: 'u5', text: 'The color transitions are so smooth! What software do you use?', minutesAgo: 195 },
      { authorId: 'u1', text: '@elenarod I use a mix of Procreate and Blender! The 3D elements are Blender', minutesAgo: 190 },
      { authorId: 'u15', text: 'Blender gang! I need to learn 3D, my 2D art feels limited sometimes', minutesAgo: 185 },
      { authorId: 'u10', text: 'This belongs in a gallery not on social media honestly', minutesAgo: 180 },
      { authorId: 'u1', text: '@lunasky that\'s the sweetest thing ever, thank you!', minutesAgo: 175 },
      { authorId: 'u4', text: 'The way the light hits in this piece is unreal', minutesAgo: 168 },
      { authorId: 'u9', text: 'Would love to use this as album artwork! DM me?', minutesAgo: 160 },
      { authorId: 'u1', text: '@musiccentral absolutely! Sliding into your DMs now', minutesAgo: 155 },
      { authorId: 'u3', text: 'The detail in the background though, I keep finding new things', minutesAgo: 148 },
      { authorId: 'u8', text: 'This is giving major cyberpunk vibes and I\'m here for it', minutesAgo: 140 },
      { authorId: 'u14', text: 'How long did this take you? The complexity is wild', minutesAgo: 132 },
      { authorId: 'u1', text: '@jayparker about 3 weeks on and off! The glow effects took forever to get right', minutesAgo: 128 },
      { authorId: 'u7', text: 'Art is therapy. This piece makes me feel calm somehow despite the neon', minutesAgo: 120 },
      { authorId: 'u16', text: 'We need an ORRA art gallery feature where we can showcase pieces like this', minutesAgo: 110 },
      { authorId: 'u6', text: 'AI could never replicate this kind of soul in art', minutesAgo: 100 },
      { authorId: 'u1', text: '@techdaily exactly! The human touch is what makes art art', minutesAgo: 95 },
      { authorId: 'u11', text: 'This inspired my next dance routine fr, the energy is matching', minutesAgo: 80 },
      { authorId: 'u13', text: 'Jessica always delivering masterpieces, never change', minutesAgo: 60 },
      { authorId: 'u12', text: 'The remix potential of this visual is huge, mind if I use it in a beat video?', minutesAgo: 45 },
    ]
  },
  'p2': {
    count: 47,
    comments: [
      { authorId: 'u6', text: 'This is a huge leap forward! The paper breaks down 3 key innovations', minutesAgo: 300 },
      { authorId: 'u8', text: 'AI in creative fields is always controversial but the progress is undeniable', minutesAgo: 295 },
      { authorId: 'u3', text: 'As long as it assists artists instead of replacing them, I\'m here for it', minutesAgo: 290 },
      { authorId: 'u1', text: '@sarahkim exactly! AI as a tool, not a replacement. That\'s the sweet spot', minutesAgo: 285 },
      { authorId: 'u15', text: 'I used AI to help brainstorm color palettes and it was actually super helpful', minutesAgo: 278 },
      { authorId: 'u4', text: 'AI choreography suggestions are getting scary good too', minutesAgo: 270 },
      { authorId: 'u9', text: 'The music AI stuff is interesting but nothing beats human creativity in sound', minutesAgo: 262 },
      { authorId: 'u16', text: '@musiccentral agreed. AI can help compose but the soul comes from the artist', minutesAgo: 258 },
      { authorId: 'u6', text: 'The key stat: 73% of creatives in the survey said AI improved their workflow', minutesAgo: 250 },
      { authorId: 'u14', text: 'That stat surprises me honestly, I thought most creatives would be against it', minutesAgo: 245 },
      { authorId: 'u6', text: '@jayparker the tide is turning as tools get better and less intrusive', minutesAgo: 240 },
      { authorId: 'u5', text: 'AI helped me plan my entire travel itinerary last month, it\'s so useful', minutesAgo: 232 },
      { authorId: 'u7', text: 'Even in wellness, AI meditation apps have come a long way', minutesAgo: 225 },
      { authorId: 'u10', text: 'I think ORRA\'s approach of blending AI with community is the right one', minutesAgo: 218 },
      { authorId: 'u11', text: 'The AI recommendations on here for reels are spot on, ngl', minutesAgo: 210 },
      { authorId: 'u3', text: 'Just don\'t let AI take over the conversation. Real connections matter', minutesAgo: 200 },
      { authorId: 'u8', text: '@sarahkim preach. Technology should enhance humanity, not replace it', minutesAgo: 195 },
      { authorId: 'u12', text: 'I sampled some AI-generated beats and mixed them with live instruments. Fire results', minutesAgo: 185 },
      { authorId: 'u1', text: '@novablaze that\'s the perfect hybrid approach! Best of both worlds', minutesAgo: 180 },
      { authorId: 'u13', text: 'AI is a tool like any other. It\'s how you use it that matters', minutesAgo: 160 },
      { authorId: 'u9', text: 'Hot take: AI will never create a hit song on its own. Needs the human touch', minutesAgo: 140 },
      { authorId: 'u6', text: 'Data backs that up — top charts are still 100% human made', minutesAgo: 135 },
      { authorId: 'u4', text: 'Same with dance. AI can analyze movement but can\'t feel the music', minutesAgo: 120 },
      { authorId: 'u14', text: 'This thread is the most nuanced AI discussion I\'ve seen on social media', minutesAgo: 100 },
      { authorId: 'u15', text: 'ORRA community always keeps it real', minutesAgo: 80 },
    ]
  },
  'p3': {
    count: 28,
    comments: [
      { authorId: 'u16', text: 'That choreo was CLEAN! When\'s the full drop?', minutesAgo: 150 },
      { authorId: 'u11', text: 'Marcus the moves are insane! I need to learn this', minutesAgo: 145 },
      { authorId: 'u4', text: '@kaistorm tutorial coming this weekend! Stay tuned', minutesAgo: 140 },
      { authorId: 'u13', text: 'The energy in your practice videos is always unmatched', minutesAgo: 135 },
      { authorId: 'u10', text: 'How do you make it look so effortless?? I\'d be falling over lol', minutesAgo: 130 },
      { authorId: 'u4', text: '@lunasky years of practice and a LOT of falling over first', minutesAgo: 126 },
      { authorId: 'u1', text: 'The way you hit those isolations is perfect', minutesAgo: 120 },
      { authorId: 'u9', text: 'If you need a track for the full routine, I got you!', minutesAgo: 115 },
      { authorId: 'u4', text: '@musiccentral yes please! Your beats always match my style perfectly', minutesAgo: 110 },
      { authorId: 'u7', text: 'Dance is such great cardio too, people underestimate the fitness aspect', minutesAgo: 100 },
      { authorId: 'u15', text: 'I tried following along and nearly pulled something, respect to dancers', minutesAgo: 90 },
      { authorId: 'u16', text: '@mayachen same! But we gotta start somewhere right?', minutesAgo: 85 },
      { authorId: 'u5', text: 'The dance challenge feature on ORRA is perfect for stuff like this', minutesAgo: 75 },
      { authorId: 'u12', text: 'About to remix this routine with some popping, watch out', minutesAgo: 60 },
      { authorId: 'u4', text: '@novablaze a remix battle?? I\'m so down for that!', minutesAgo: 55 },
      { authorId: 'u3', text: 'This is why ORRA > other apps. The dance community here actually engages', minutesAgo: 40 },
    ]
  },
  'p4': {
    count: 22,
    comments: [
      { authorId: 'u13', text: 'Barcelona is DREAMY! I was there last summer', minutesAgo: 250 },
      { authorId: 'u1', text: 'The golden hour in Spain hits different, incredible shot!', minutesAgo: 245 },
      { authorId: 'u5', text: '@jessart right?! The light at Sagrada Familia is unreal', minutesAgo: 240 },
      { authorId: 'u3', text: 'Travel is the only thing you buy that makes you richer', minutesAgo: 235 },
      { authorId: 'u10', text: 'What camera did you use? The colors are so vibrant', minutesAgo: 228 },
      { authorId: 'u5', text: '@lunasky just my iPhone! Barcelona does all the work honestly', minutesAgo: 224 },
      { authorId: 'u15', text: 'Adding Barcelona to my bucket list right now', minutesAgo: 218 },
      { authorId: 'u7', text: 'Travel is the best medicine for the soul. That view proves it', minutesAgo: 210 },
      { authorId: 'u8', text: 'Gothic Quarter at night is even more stunning if you get the chance', minutesAgo: 200 },
      { authorId: 'u4', text: 'Spanish culture has the best energy, the dancing, the food, everything', minutesAgo: 190 },
      { authorId: 'u5', text: '@marcusr the street dancers in Placa Reial were AMAZING', minutesAgo: 185 },
      { authorId: 'u16', text: 'Was that near the beach? Barceloneta sunsets are top tier', minutesAgo: 170 },
      { authorId: 'u14', text: 'My favorite city in Europe, no contest', minutesAgo: 155 },
    ]
  },
  'p5': {
    count: 19,
    comments: [
      { authorId: 'u7', text: '5 minutes of breathing changed my whole morning routine!', minutesAgo: 180 },
      { authorId: 'u15', text: 'I tried this today and was so much calmer at work', minutesAgo: 175 },
      { authorId: 'u3', text: 'Box breathing for the win: 4 in, 4 hold, 4 out, 4 hold', minutesAgo: 170 },
      { authorId: 'u10', text: '@sarahkim that technique literally saved my anxiety during presentations', minutesAgo: 165 },
      { authorId: 'u5', text: 'I do this before every travel day, helps so much with flight anxiety', minutesAgo: 158 },
      { authorId: 'u7', text: 'Pro tip: pair it with a cold splash of water on your face. Game changer.', minutesAgo: 150 },
      { authorId: 'u4', text: 'Even as a dancer, breathing exercises help my performance so much', minutesAgo: 142 },
      { authorId: 'u14', text: 'I used to think this was woo woo but it actually works', minutesAgo: 135 },
      { authorId: 'u7', text: '@jayparker science backs it up! It activates your parasympathetic nervous system', minutesAgo: 130 },
      { authorId: 'u1', text: 'Adding this to my creative warmup before painting sessions', minutesAgo: 120 },
      { authorId: 'u13', text: 'Morning routines are everything. Mine starts with breathing + gratitude journal', minutesAgo: 110 },
    ]
  },
  'p6': {
    count: 33,
    comments: [
      { authorId: 'u12', text: 'This track goes HARD! That drop at 1:24 is insane', minutesAgo: 220 },
      { authorId: 'u4', text: 'Already choreographing to this, the beat is perfect for dance', minutesAgo: 215 },
      { authorId: 'u1', text: 'The synths in this are gorgeous, what synth are you using?', minutesAgo: 210 },
      { authorId: 'u9', text: '@jessart it\'s a mix of Serum and some analog gear I picked up!', minutesAgo: 206 },
      { authorId: 'u3', text: 'This is on repeat all day, no skips', minutesAgo: 200 },
      { authorId: 'u8', text: 'The production quality is professional. This could chart fr', minutesAgo: 195 },
      { authorId: 'u11', text: 'Can I get permission to use this in my next skate edit?', minutesAgo: 188 },
      { authorId: 'u9', text: '@kaistorm absolutely! Just tag me', minutesAgo: 184 },
      { authorId: 'u13', text: 'The way the bass hits with headphones is next level', minutesAgo: 178 },
      { authorId: 'u16', text: 'This would be perfect for the next dance challenge on ORRA', minutesAgo: 170 },
      { authorId: 'u15', text: 'Music Central never misses! Every track is a banger', minutesAgo: 162 },
      { authorId: 'u6', text: 'The mixing on this is incredibly clean, what DAW?', minutesAgo: 155 },
      { authorId: 'u9', text: '@techdaily Ableton Live! It\'s my go-to for electronic production', minutesAgo: 150 },
      { authorId: 'u10', text: 'Neon Dreams is literally the soundtrack of the summer', minutesAgo: 140 },
      { authorId: 'u5', text: 'Listening to this while watching the sunset in Barcelona = perfection', minutesAgo: 132 },
      { authorId: 'u14', text: 'The vocal chops at 2:30 are chef\'s kiss', minutesAgo: 120 },
      { authorId: 'u9', text: '@jayparker those took me FOREVER to get right, glad they hit!', minutesAgo: 116 },
      { authorId: 'u7', text: 'Even my yoga students love this track, it\'s got that perfect energy', minutesAgo: 100 },
      { authorId: 'u4', text: 'Dance video dropping to this track tomorrow, get ready!', minutesAgo: 80 },
      { authorId: 'u9', text: '@marcusr LETS GO! Can\'t wait to see the choreo!', minutesAgo: 75 },
    ]
  },
  'p7': {
    count: 44,
    comments: [
      { authorId: 'u14', text: 'LMAO this is literally me every single night', minutesAgo: 350 },
      { authorId: 'u8', text: 'The slow-mo reaction is killing me', minutesAgo: 345 },
      { authorId: 'u3', text: 'When you\'re mid-boss fight and the lag hits... pure betrayal', minutesAgo: 340 },
      { authorId: 'u11', text: 'That face when the loading icon appears and you know it\'s over', minutesAgo: 335 },
      { authorId: 'u16', text: '@kaistorm the loading circle of doom', minutesAgo: 330 },
      { authorId: 'u4', text: 'This happens to me before every dance stream, the timing is always perfect', minutesAgo: 325 },
      { authorId: 'u6', text: 'Fun fact: the average person experiences 4 WiFi outages per week', minutesAgo: 318 },
      { authorId: 'u15', text: '@techdaily those are rookie numbers, my WiFi hates me personally', minutesAgo: 313 },
      { authorId: 'u13', text: 'I literally yelled at my router last night, no shame', minutesAgo: 308 },
      { authorId: 'u10', text: 'The dramatic zoom at the end had me rolling', minutesAgo: 302 },
      { authorId: 'u1', text: 'You should do a whole series on tech fails, this is gold', minutesAgo: 295 },
      { authorId: 'u9', text: 'When your DAW crashes and you forgot to save... same energy', minutesAgo: 288 },
      { authorId: 'u5', text: 'Happened during my Barcelona vlog upload, I almost cried', minutesAgo: 280 },
      { authorId: 'u7', text: 'This is why I practice patience. WiFi always comes back... eventually', minutesAgo: 272 },
      { authorId: 'u14', text: '@wellnessg not all heroes meditate, some just rage at their ISP', minutesAgo: 266 },
      { authorId: 'u8', text: '@jayparker facts', minutesAgo: 262 },
      { authorId: 'u12', text: 'The sound effect at 0:03 is the most relatable thing ever', minutesAgo: 255 },
      { authorId: 'u3', text: 'Petition to make "WiFi died" a valid excuse for everything', minutesAgo: 245 },
      { authorId: 'u11', text: '@sarahkim seconded, I\'m writing my congressperson', minutesAgo: 240 },
      { authorId: 'u4', text: 'Cyber Drifter never disappoints with the comedy content', minutesAgo: 230 },
      { authorId: 'u6', text: 'This post has the highest engagement I\'ve seen today lol', minutesAgo: 220 },
      { authorId: 'u15', text: 'Relatable content always wins', minutesAgo: 210 },
    ]
  },
  'p8': {
    count: 30,
    comments: [
      { authorId: 'u13', text: 'Congrats!! That\'s incredible! What was your strategy?', minutesAgo: 180 },
      { authorId: 'u15', text: 'Teach us your ways! I\'m only at 50k', minutesAgo: 175 },
      { authorId: 'u4', text: 'Daily streaks + dance challenges + consistent posting = token machine', minutesAgo: 170 },
      { authorId: 'u10', text: 'The hustle is real! Grats on the milestone', minutesAgo: 165 },
      { authorId: 'u6', text: 'From a data standpoint, consistent daily activity earns 3x more than sporadic posting', minutesAgo: 158 },
      { authorId: 'u14', text: '@techdaily that explains why my tokens barely grow, I\'m too inconsistent', minutesAgo: 153 },
      { authorId: 'u7', text: 'Remember: tokens are great but the real value is the community!', minutesAgo: 145 },
      { authorId: 'u3', text: '@wellnessg both can be true! Earning while vibing is the ORRA way', minutesAgo: 140 },
      { authorId: 'u5', text: 'The token shop has some cool stuff, what did you buy first?', minutesAgo: 132 },
      { authorId: 'u1', text: 'I\'m saving up for the premium name effect, it looks so cool', minutesAgo: 125 },
      { authorId: 'u9', text: 'Used some tokens to boost my latest track, totally worth it', minutesAgo: 118 },
      { authorId: 'u12', text: 'The token economy on ORRA actually makes sense, unlike some other platforms', minutesAgo: 110 },
      { authorId: 'u16', text: '@novablaze facts, it feels earned not just given', minutesAgo: 105 },
      { authorId: 'u11', text: 'Dance challenge tokens are where the real gains are at', minutesAgo: 95 },
      { authorId: 'u8', text: 'Grinding for tokens is the new side quest and I\'m here for it', minutesAgo: 80 },
    ]
  },
  'p9': {
    count: 25,
    comments: [
      { authorId: 'u1', text: 'Luna your style is EVERYTHING! That first outfit is stunning', minutesAgo: 200 },
      { authorId: 'u5', text: 'The color coordination is perfect! Where\'s that top from?', minutesAgo: 195 },
      { authorId: 'u10', text: '@elenarod it\'s thrifted! Can you believe it was $5??', minutesAgo: 190 },
      { authorId: 'u15', text: '$5?? Okay I need to go thrifting ASAP', minutesAgo: 186 },
      { authorId: 'u3', text: 'That sun hat with the dress is giving summer goddess vibes', minutesAgo: 180 },
      { authorId: 'u13', text: 'The accessories elevate every single outfit, great eye!', minutesAgo: 172 },
      { authorId: 'u4', text: 'Even the casual fits look styled, that\'s talent', minutesAgo: 165 },
      { authorId: 'u7', text: 'Fashion tip: comfortable shoes can still be stylish! Love the sneakers combo', minutesAgo: 155 },
      { authorId: 'u14', text: 'The layering in outfit 3 is something I\'d never think of but it works perfectly', minutesAgo: 145 },
      { authorId: 'u10', text: '@jayparker layering is my secret weapon! Mix textures for the best effect', minutesAgo: 140 },
      { authorId: 'u9', text: 'These looks would be perfect for a music video shoot', minutesAgo: 130 },
      { authorId: 'u8', text: 'Street style + high fashion = the Luna Sky formula', minutesAgo: 118 },
      { authorId: 'u6', text: 'Your lookbook posts always get insane engagement, the ORRA community loves fashion', minutesAgo: 100 },
    ]
  },
  'p10': {
    count: 40,
    comments: [
      { authorId: 'u11', text: 'A 1v5 CLUTCH?? That\'s insane! What game?', minutesAgo: 280 },
      { authorId: 'u8', text: 'The comms must have been wild after that play', minutesAgo: 275 },
      { authorId: 'u3', text: 'I would\'ve panicked and whiffed so fast lol', minutesAgo: 270 },
      { authorId: 'u6', text: 'Statistically, the odds of winning a 1v5 are less than 3%, that\'s legendary', minutesAgo: 265 },
      { authorId: 'u14', text: '@techdaily Kai makes the impossible look routine at this point', minutesAgo: 260 },
      { authorId: 'u11', text: 'It was Valorant! Jett clutch on Ascent, my hands were SHAKING', minutesAgo: 255 },
      { authorId: 'u16', text: 'Jett diff, the movement on that character is unmatched', minutesAgo: 250 },
      { authorId: 'u4', text: 'The clutch mindset is the same as dance — stay calm under pressure', minutesAgo: 244 },
      { authorId: 'u11', text: '@marcusr facts! The amount of times dance helped my gaming composure is unreal', minutesAgo: 239 },
      { authorId: 'u15', text: 'Clip it and post it on Prism! That deserves views', minutesAgo: 232 },
      { authorId: 'u9', text: 'We need gaming music on ORRA — hype tracks for clutch moments', minutesAgo: 225 },
      { authorId: 'u12', text: '@musiccentral I\'ll make a "Clutch Mode" playlist, bet', minutesAgo: 220 },
      { authorId: 'u13', text: 'This is why I don\'t play ranked, I\'d never top this', minutesAgo: 212 },
      { authorId: 'u5', text: 'Even my cat jumped when I yelled at that clutch play lmao', minutesAgo: 200 },
      { authorId: 'u1', text: 'The gaming community on ORRA is growing so fast, love seeing it', minutesAgo: 190 },
      { authorId: 'u7', text: 'Remember to stretch those wrists after gaming sessions! Carpal tunnel is real', minutesAgo: 175 },
      { authorId: 'u14', text: '@wellnessg okay gamer mom, but fr thanks for the reminder', minutesAgo: 170 },
      { authorId: 'u3', text: 'Gaming + ORRA = perfect match. The engagement here is so much better than Twitch', minutesAgo: 155 },
      { authorId: 'u11', text: 'Next stream going live tonight, who\'s tuning in?', minutesAgo: 140 },
    ]
  },
  'p11': {
    count: 20,
    comments: [
      { authorId: 'u5', text: 'Hand-pulled noodles from scratch?? The dedication! How did they turn out?', minutesAgo: 160 },
      { authorId: 'u3', text: 'Elena always making us hungry with these food posts', minutesAgo: 155 },
      { authorId: 'u14', text: 'I tried making noodles once... let\'s just say takeout was ordered shortly after', minutesAgo: 150 },
      { authorId: 'u7', text: 'Cooking is such a mindful activity, love seeing people make things from scratch', minutesAgo: 144 },
      { authorId: 'u1', text: 'The technique for pulling noodles is an art form honestly', minutesAgo: 138 },
      { authorId: 'u13', text: 'What flour did you use? I heard high gluten is key', minutesAgo: 130 },
      { authorId: 'u5', text: '@zaramiles yes! High gluten flour + lots of resting time for the dough', minutesAgo: 125 },
      { authorId: 'u10', text: 'The texture of fresh noodles is incomparable to store-bought', minutesAgo: 118 },
      { authorId: 'u9', text: 'Nothing beats homemade food. My grandma\'s pasta recipe is sacred in our family', minutesAgo: 108 },
      { authorId: 'u15', text: 'Food content on ORRA makes me hungry every single time', minutesAgo: 95 },
      { authorId: 'u8', text: 'The process of making noodles from scratch is oddly satisfying to watch', minutesAgo: 80 },
    ]
  },
  'p12': {
    count: 26,
    comments: [
      { authorId: 'u9', text: '4 different cultures in one beat? That\'s the kind of fusion I live for!', minutesAgo: 240 },
      { authorId: 'u12', text: '@musiccentral the blend was natural, not forced! Each sample complements the others', minutesAgo: 235 },
      { authorId: 'u4', text: 'This is what music should be — bringing cultures together through sound', minutesAgo: 230 },
      { authorId: 'u1', text: 'The way the tabla rhythms mix with the 808s is genius', minutesAgo: 224 },
      { authorId: 'u3', text: 'Music is the universal language and this beat proves it', minutesAgo: 218 },
      { authorId: 'u6', text: 'Cross-cultural sampling is trending up 40% in music production this year', minutesAgo: 212 },
      { authorId: 'u15', text: '@techdaily that stat makes me so happy, music bringing the world together', minutesAgo: 207 },
      { authorId: 'u8', text: 'The Afrobeat section at 1:45 is my favorite part, the groove is undeniable', minutesAgo: 200 },
      { authorId: 'u5', text: 'Heard this while traveling and it was the perfect soundtrack', minutesAgo: 192 },
      { authorId: 'u10', text: 'Can this be used for a fashion show runway? The energy is perfect', minutesAgo: 184 },
      { authorId: 'u12', text: '@lunasky absolutely! I actually designed it with that energy in mind', minutesAgo: 179 },
      { authorId: 'u14', text: 'Nova always cooking up something special, never disappoints', minutesAgo: 170 },
      { authorId: 'u7', text: 'The meditative quality of the middle section is so calming', minutesAgo: 155 },
      { authorId: 'u11', text: 'I could skate to this all day, the tempo is perfect', minutesAgo: 140 },
      { authorId: 'u9', text: 'We should collab on a remix! I have some vocal ideas that would fit perfectly', minutesAgo: 125 },
    ]
  },
  'cp1': {
    count: 32,
    comments: [
      { authorId: 'u14', text: 'LMAO this is me every time the router blinks', minutesAgo: 90 },
      { authorId: 'u3', text: 'The panic when you see the WiFi icon disappear... unmatched', minutesAgo: 87 },
      { authorId: 'u8', text: 'That stare into the void while the page tries to load', minutesAgo: 83 },
      { authorId: 'u11', text: 'Mid-game lag is the worst feeling in the world, I\'m convinced', minutesAgo: 78 },
      { authorId: 'u6', text: 'I measured my reaction time to WiFi drops: 0.3 seconds to panic', minutesAgo: 74 },
      { authorId: 'u15', text: '@techdaily your brain processes WiFi loss faster than actual danger lmao', minutesAgo: 70 },
      { authorId: 'u4', text: 'This happened during my dance stream last week, the timing was tragic', minutesAgo: 65 },
      { authorId: 'u13', text: 'I literally have a backup hotspot now, never again', minutesAgo: 60 },
      { authorId: 'u9', text: 'When your DAW needs cloud verification and the WiFi dies... nightmare fuel', minutesAgo: 54 },
      { authorId: 'u1', text: 'Digital art + no internet + unsaved changes = character building', minutesAgo: 48 },
      { authorId: 'u7', text: 'This is why I practice being present offline too, WiFi is temporary', minutesAgo: 42 },
      { authorId: 'u5', text: 'Happened mid-photo upload in Barcelona, nearly threw my phone in the Mediterranean', minutesAgo: 36 },
      { authorId: 'u14', text: '@elenarod dramatic but valid', minutesAgo: 33 },
      { authorId: 'u10', text: 'The ORRA community relating over WiFi trauma is peak internet culture', minutesAgo: 25 },
    ]
  },
  'cp2': {
    count: 36,
    comments: [
      { authorId: 'u3', text: 'The most relatable programmer meme in existence', minutesAgo: 200 },
      { authorId: 'u6', text: 'This is literally every deployment I\'ve ever done', minutesAgo: 196 },
      { authorId: 'u8', text: 'Code works -> touch nothing -> code breaks -> "I changed nothing" -> angry boss', minutesAgo: 190 },
      { authorId: 'u14', text: 'The amount of times I\'ve said "but it worked on my machine"', minutesAgo: 185 },
      { authorId: 'u1', text: 'This applies to creative work too, one tiny adjustment and suddenly everything is different', minutesAgo: 179 },
      { authorId: 'u9', text: 'Music production version: mix sounds great, export it, suddenly sounds different', minutesAgo: 173 },
      { authorId: 'u15', text: '@musiccentral THE EXPORT DIFFERENCES ARE REAL, I thought I was crazy', minutesAgo: 168 },
      { authorId: 'u11', text: 'Tech ORRA needs more memes like this', minutesAgo: 162 },
      { authorId: 'u6', text: 'Fun fact: 67% of software bugs are introduced while fixing other bugs', minutesAgo: 155 },
      { authorId: 'u3', text: '@techdaily that stat hurts my soul but I believe it completely', minutesAgo: 150 },
      { authorId: 'u4', text: 'Dance version: nail it in practice, mess it up on stage', minutesAgo: 143 },
      { authorId: 'u12', text: 'Version control exists for a reason but do I use it properly? No', minutesAgo: 136 },
      { authorId: 'u5', text: 'This is why I save 47 copies of everything with different names', minutesAgo: 128 },
      { authorId: 'u7', text: 'Take a deep breath and remember: you can always revert. Probably.', minutesAgo: 120 },
      { authorId: 'u13', text: 'The "I changed nothing" defense has a 0% success rate but we keep using it', minutesAgo: 110 },
      { authorId: 'u8', text: 'Me screenshotting working code "just in case" like it\'s 2005', minutesAgo: 95 },
      { authorId: 'u10', text: 'This thread is therapy for tech people lmao', minutesAgo: 80 },
    ]
  },
  'cp3': {
    count: 41,
    comments: [
      { authorId: 'u15', text: '4 hours?? Amateur. I went a full season of a show last weekend', minutesAgo: 150 },
      { authorId: 'u14', text: '"Just one more episode" is the biggest lie in human history', minutesAgo: 146 },
      { authorId: 'u3', text: 'The 3am "I should sleep but the next episode is right there" moment', minutesAgo: 141 },
      { authorId: 'u10', text: 'I said this at 10pm. It\'s now 3am. I have 2 episodes left. No regrets.', minutesAgo: 136 },
      { authorId: 'u7', text: 'Screen time and sleep are important! But... I understand the struggle', minutesAgo: 130 },
      { authorId: 'u1', text: '@wellnessg your wellness advice vs your binge watching habits, let\'s see', minutesAgo: 125 },
      { authorId: 'u7', text: '@jessart okay fair point, we all have our weaknesses', minutesAgo: 121 },
      { authorId: 'u4', text: 'I don\'t binge shows, I binge dance videos. Same energy though', minutesAgo: 115 },
      { authorId: 'u9', text: 'Music documentaries are my weakness, watched 5 in a row last week', minutesAgo: 108 },
      { authorId: 'u13', text: 'The cliffhanger at the end of every episode is designed to trap us!', minutesAgo: 100 },
      { authorId: 'u6', text: 'Streaming services specifically engineer episode endings to reduce sleep probability by 80%', minutesAgo: 92 },
      { authorId: 'u8', text: '@techdaily they\'re using science against us and it\'s working', minutesAgo: 87 },
      { authorId: 'u5', text: 'Watched a whole series on a flight once, the person next to me was judging hard', minutesAgo: 80 },
      { authorId: 'u11', text: 'Gaming or shows? The eternal late night debate', minutesAgo: 72 },
      { authorId: 'u16', text: '@kaistorm why not both? Multi-tasking is the way', minutesAgo: 67 },
      { authorId: 'u12', text: 'The real POV: you when the sun comes up and you realize your life choices', minutesAgo: 58 },
      { authorId: 'u3', text: '@novablaze the sunrise hit different when you\'ve been awake all night', minutesAgo: 52 },
      { authorId: 'u14', text: 'No judgment zone, we\'ve all been there', minutesAgo: 40 },
    ]
  },
  'cp4': {
    count: 29,
    comments: [
      { authorId: 'u13', text: 'The secondhand embarrassment is REAL', minutesAgo: 120 },
      { authorId: 'u14', text: 'This happened to me at the mall. I still think about it at 3am.', minutesAgo: 116 },
      { authorId: 'u3', text: 'The wave back and then the slow realization... pure horror', minutesAgo: 111 },
      { authorId: 'u8', text: 'And then you have to pretend you were waving at someone behind them', minutesAgo: 106 },
      { authorId: 'u15', text: '@cyberdrift the recovery wave to an imaginary person is the universal move', minutesAgo: 101 },
      { authorId: 'u5', text: 'This happened to me in Barcelona! The guy next to me was so confused', minutesAgo: 95 },
      { authorId: 'u10', text: 'The 3 stages: wave, confusion, pretend to check your phone', minutesAgo: 88 },
      { authorId: 'u7', text: 'Embrace the awkward! It builds character and makes great stories', minutesAgo: 82 },
      { authorId: 'u4', text: 'Dance version: doing a move and nobody was filming', minutesAgo: 75 },
      { authorId: 'u9', text: '@marcusr the pain of an unwitnessed perfect move is immeasurable', minutesAgo: 70 },
      { authorId: 'u1', text: 'I just own it now. I wave at everyone. I\'m the friendly waver.', minutesAgo: 62 },
      { authorId: 'u11', text: '@jessart that\'s the confidence we all need', minutesAgo: 57 },
      { authorId: 'u6', text: 'Studies show this is the 3rd most common socially awkward moment worldwide', minutesAgo: 48 },
      { authorId: 'u16', text: '@techdaily what are the top 2?? I need to prepare myself', minutesAgo: 43 },
      { authorId: 'u6', text: '@drewilliams 1) forgetting names 2) responding to "how are you" with "you too"', minutesAgo: 38 },
      { authorId: 'u3', text: '@techdaily I\'ve done both TODAY', minutesAgo: 33 },
    ]
  }
};

async function main() {
  console.log('Seeding realistic comments...');

  const seedPostIds = Object.keys(postComments);

  // Delete existing seed comments
  for (const postId of seedPostIds) {
    const deleted = await prisma.comment.deleteMany({ where: { postId } });
    console.log(`Deleted ${deleted.count} old comments for post ${postId}`);
  }

  let totalCreated = 0;

  for (const [postId, data] of Object.entries(postComments)) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      console.log(`Post ${postId} not found, skipping`);
      continue;
    }

    for (const comment of data.comments) {
      const author = await prisma.user.findUnique({ where: { id: comment.authorId } });
      if (!author) continue;

      const createdAt = new Date(Date.now() - comment.minutesAgo * 60 * 1000);

      await prisma.comment.create({
        data: {
          text: comment.text,
          postId: postId,
          authorId: comment.authorId,
          createdAt: createdAt,
        }
      });
      totalCreated++;
    }

    // Update the commentsCount to match realistic number
    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: data.count }
    });
    console.log(`Post ${postId}: created ${data.comments.length} visible comments, set count to ${data.count}`);
  }

  // Fix user-created posts to have accurate counts
  const userPosts = await prisma.post.findMany({
    where: { id: { notIn: seedPostIds } },
    select: { id: true }
  });
  for (const post of userPosts) {
    const actual = await prisma.comment.count({ where: { postId: post.id } });
    await prisma.post.update({
      where: { id: post.id },
      data: { commentsCount: actual }
    });
    console.log(`User post ${post.id}: fixed count to ${actual}`);
  }

  console.log(`\nDone! Created ${totalCreated} comments total.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
