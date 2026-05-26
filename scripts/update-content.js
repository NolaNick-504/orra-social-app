/**
 * ORRA Content Update Script
 * - Adds more heartfelt/emotional posts
 * - Updates bot profile songs with new ones from the extended library
 * - Ensures cover images are set correctly per bot
 * - Cleans up duplicate posts
 * - Protects founder profile from changes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Extended song library (matching song-library.ts)
const EXTENDED_SONGS = [
  { url: '/music/orra/orra.mp3', title: 'ORRA', artist: 'ORRA' },
  { url: '/music/orra/back-of-the-tracks.mp3', title: 'Back of the Tracks', artist: 'ORRA' },
  { url: '/music/orra/welcome-to-my-page.mp3', title: 'Welcome to My Page', artist: 'ORRA' },
  { url: '/music/orra/orra-gives-me-everything.mp3', title: 'ORRA Gives Me Everything', artist: 'ORRA' },
  { url: '/music/orra/like-and-follow.mp3', title: 'Like and Follow', artist: 'ORRA' },
  // Suno songs (placeholder URLs matching song-library.ts)
  { url: '/api/serve-file?path=music/orra/placeholder-cloud-nine.mp3', title: 'Cloud Nine ID', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-thumbs-orbit.mp3', title: 'Thumbs In Orbit', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-glow-up-v1.mp3', title: 'Glow Up Season V1', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-glow-up-v2.mp3', title: 'Glow Up Season V2', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-squad-love.mp3', title: 'Squad Love', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-flirt-era.mp3', title: 'Flirt Era', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-no-cap.mp3', title: 'No Cap Motivation', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-hot-girl.mp3', title: 'Hot Girl Walk Energy', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-gremlin.mp3', title: 'Gremlin Mode On', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-top-eight.mp3', title: 'Top Eight Crown', artist: 'ORRA' },
  { url: '/api/serve-file?path=music/orra/placeholder-unbothered.mp3', title: 'Unbothered Queen', artist: 'ORRA' },
];

// Bot song assignments — each bot gets a unique song matching their personality
const BOT_SONGS = {
  'founder': 0,  // ORRA - the anthem
  'bot01': 4,    // Back of the Tracks - grounded nurse
  'bot02': 2,    // Welcome to My Page - coach welcoming players
  'bot03': 5,    // Cloud Nine ID - playful marketing girl
  'bot04': 7,    // Glow Up Season V1 - dance instructor energy
  'bot05': 1,    // Back of the Tracks - coder/foodie
  'bot06': 10,   // Flirt Era - hair stylist, confident
  'bot07': 13,   // Gremlin Mode On - gamer chaos
  'bot08': 2,    // Welcome to My Page - traveler
  'bot09': 3,    // ORRA Gives Me Everything - aspiring producer
  'bot10': 15,   // Unbothered Queen - illustrator, chill
  'bot11': 1,    // Back of the Tracks - mechanic, gritty
  'bot12': 9,    // Squad Love - food blogger, community
  'bot13': 10,   // Flirt Era - fashion, confident
  'bot14': 13,   // Gremlin Mode On - gamer
  'bot15': 3,    // ORRA Gives Me Everything - producer/DJ
  'bot16': 15,   // Unbothered Queen - yoga/wellness
  'bot17': 11,   // No Cap Motivation - student grinding
  'bot18': 6,    // Thumbs In Orbit - poet, spacey
  'bot19': 12,   // Hot Girl Walk Energy - skater, energetic
  'bot20': 9,    // Squad Love - single mom, community
  'bot21': 7,    // Glow Up Season V1 - architecture student
  'bot22': 14,   // Top Eight Crown - retired teacher, nostalgic
  'bot23': 3,    // ORRA Gives Me Everything - firefighter
  'bot24': 11,   // No Cap Motivation - fitness trainer
  'bot25': 13,   // Gremlin Mode On - meme lord
};

// Cover image paths per bot
const BOT_COVERS = {
  'founder': '/images/covers/founder.jpg',
  'bot01': '/images/covers/bot01.jpg',
  'bot02': '/images/covers/bot02.jpg',
  'bot03': '/images/covers/bot03.jpg',
  'bot04': '/images/covers/bot04.jpg',
  'bot05': '/images/covers/bot05.jpg',
  'bot06': '/images/covers/bot06.jpg',
  'bot07': '/images/covers/bot07.jpg',
  'bot08': '/images/covers/bot08.jpg',
  'bot09': '/images/covers/bot09.jpg',
  'bot10': '/images/covers/bot10.jpg',
  'bot11': '/images/covers/bot11.jpg',
  'bot12': '/images/covers/bot12.jpg',
  'bot13': '/images/covers/bot13.jpg',
  'bot14': '/images/covers/bot14.jpg',
  'bot15': '/images/covers/bot15.jpg',
  'bot16': '/images/covers/bot16.jpg',
  'bot17': '/images/covers/bot17.jpg',
  'bot18': '/images/covers/bot18.jpg',
  'bot19': '/images/covers/bot19.jpg',
  'bot20': '/images/covers/bot20.jpg',
  'bot21': '/images/covers/bot21.jpg',
  'bot22': '/images/covers/bot22.jpg',
  'bot23': '/images/covers/bot23.jpg',
  'bot24': '/images/covers/bot24.jpg',
  'bot25': '/images/covers/bot25.jpg',
};

// New heartfelt/emotional posts to add
const NEW_POSTS = [
  // Emotional/heartfelt posts
  { authorId: 'bot01', text: 'Lost my first patient today. You think you are prepared for it in nursing school but nothing prepares you for that silence. Please hug your loved ones tonight. Tomorrow is never promised.', likesCount: 8900, commentsCount: 678, sharesCount: 2100, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot02', text: 'My oldest son told me he wants to be a coach just like me. I had to turn away so he would not see me cry. I did not have a dad growing up. Breaking that cycle means everything to me.', likesCount: 12400, commentsCount: 890, sharesCount: 3400, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot06', text: 'A client came in today and said she has been fighting cancer for two years and getting her hair done is the only thing that makes her feel normal. I did not charge her. Some things are bigger than money.', likesCount: 28900, commentsCount: 2100, sharesCount: 8900, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot17', text: 'My mama called me crying today because she is proud of me for staying in school. She dropped out in 10th grade to raise me. Everything I do is for her. I will make it, Mama. I promise.', likesCount: 34200, commentsCount: 2800, sharesCount: 12000, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot20', text: 'My ex has not seen the kids in 8 months. But tonight my daughter said "Mommy, you are my superhero." I do not need him to show up. I have been enough this whole time. Single parents, you are enough.', likesCount: 22100, commentsCount: 1500, sharesCount: 6700, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot16', text: 'Three years ago I could not get out of bed. Literally could not move. Today I led a yoga class for 40 people. If you are in that dark place right now, I need you to know it gets better. Stay. Please stay.', likesCount: 19800, commentsCount: 1400, sharesCount: 5600, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot18', text: 'new poem:\n\ntell me how to mourn\na person who is still alive\nhow to miss someone\nwho sits across from you\nat dinner\n\nthe distance between us\nis measured in things\nwe stopped saying', likesCount: 7800, commentsCount: 567, sharesCount: 2300, vibeTag: 'dramatic', type: 'text' },
  { authorId: 'bot22', text: 'After 35 years of teaching, a former student found me on ORRA. She told me I was the reason she went to college. I cried for an hour. You never know the impact you have on someone life. Keep showing up.', likesCount: 15200, commentsCount: 1100, sharesCount: 4500, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot23', text: 'Ran into a burning building last night to get a family dog out. The kids were already safe outside but they were screaming for their dog. Found him under a bed. He is okay. Not all heroes wear capes, some wear turnouts.', likesCount: 26800, commentsCount: 1900, sharesCount: 8900, vibeTag: 'hyped', type: 'text' },
  { authorId: 'bot04', text: 'One of my students has cerebral palsy. She told me dancing makes her feel like her body is not broken. I teach every class now with the understanding that movement is a privilege. Never take it for granted.', likesCount: 31200, commentsCount: 2300, sharesCount: 9800, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot03', text: 'I used to be embarrassed about being first gen. Now I wear it like armor. My parents crossed deserts so I could get a degree. Their sacrifice is my superpower. Never forget where you come from.', likesCount: 14500, commentsCount: 980, sharesCount: 4200, vibeTag: 'hyped', type: 'text' },
  { authorId: 'bot08', text: 'Met a 92 year old woman in a tiny village in Portugal who has never left her hometown. She told me she has everything she needs right here. Made me question why I am always running. Maybe peace is not a destination.', likesCount: 11600, commentsCount: 789, sharesCount: 3200, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot12', text: 'My grandmother taught me to cook before she passed. Every time I make her recipe, I feel her in the kitchen with me. Food is not just sustenance, it is memory. It is love that outlives us.', likesCount: 13400, commentsCount: 890, sharesCount: 4100, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot15', text: 'My little brother is locked up. He asked me to send him my beats so he has something to hold onto. I spend every night in the studio now making music for him. One day he will hear it on the outside.', likesCount: 21000, commentsCount: 1600, sharesCount: 7800, vibeTag: 'dramatic', type: 'text' },
  { authorId: 'bot24', text: 'Tore my ACL my junior year of college. Thought my life was over. Two years later I am a certified personal trainer helping others recover from their own injuries. Your setback is just a setup for your comeback.', likesCount: 9800, commentsCount: 670, sharesCount: 2900, vibeTag: 'hyped', type: 'text' },
  { authorId: 'bot11', text: 'Married 15 years and my wife still leaves me notes in my lunch. Today it said "You are my favorite adventure." I am a mechanic with rough hands but man, she makes me feel like poetry.', likesCount: 18700, commentsCount: 1200, sharesCount: 5600, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot10', text: 'Art saved my life. I was in a really dark place after college and picking up a pen was the only thing that made the noise stop. If you are struggling, find your thing. It does not have to be art. Just find your thing.', likesCount: 14200, commentsCount: 980, sharesCount: 4300, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot25', text: 'A student came out to me today. He said I was the only teacher who never made him feel weird. I just treated him like a person. That is all any of us want, right? Just to be treated like a person.', likesCount: 25600, commentsCount: 1800, sharesCount: 8900, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot05', text: 'My dad passed away before he could see me graduate. I brought his photo to the ceremony. He always said "Beta, education is the one thing nobody can take from you." I miss you, Papa. This degree is yours too.', likesCount: 28100, commentsCount: 2200, sharesCount: 9500, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot09', text: 'Everyone told me to get a real job. But every time I make a beat, I feel like I am exactly where I am supposed to be. Your passion is not a distraction. It is your purpose. Do not let anyone talk you out of it.', likesCount: 8900, commentsCount: 678, sharesCount: 3400, vibeTag: 'focused', type: 'text' },
  // More modern/today's type emotional posts
  { authorId: 'bot13', text: 'Unfollowed everyone who made me feel like I was not enough. My mental health is not a negotiation. Protect your peace like your life depends on it, because it does.', likesCount: 16400, commentsCount: 1100, sharesCount: 5600, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot07', text: 'Gaming community gets a bad rep but last night my whole squad stayed up until 4 AM talking one of our members through a panic attack. Gamers look out for each other. We are more than our screens.', likesCount: 11200, commentsCount: 890, sharesCount: 3200, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot19', text: 'Skated past a little kid today who stopped and stared. His mom said "He thinks you are cool." I gave him my old deck. Never saw someone light up like that. Pay it forward, always.', likesCount: 9300, commentsCount: 678, sharesCount: 2800, vibeTag: 'peaceful', type: 'text' },
  { authorId: 'bot21', text: 'An immigrant built the building I am studying to design. Let that sink in. The hands that built this country are the ones we try to keep out. I am honoring those hands with every blueprint I draw.', likesCount: 21800, commentsCount: 1500, sharesCount: 7200, vibeTag: 'focused', type: 'text' },
  { authorId: 'bot14', text: 'My little brother has autism and he loves watching me game. He cannot play himself but he cheers louder than anyone. Tonight I played for him. Every win is his win. Special needs siblings, I see you.', likesCount: 17600, commentsCount: 1200, sharesCount: 5400, vibeTag: 'peaceful', type: 'text' },
];

async function main() {
  console.log('🔄 ORRA Content Update Starting...\n');

  // 1. Update bot profile songs
  console.log('🎵 Updating bot profile songs...');
  for (const [botId, songIdx] of Object.entries(BOT_SONGS)) {
    const song = EXTENDED_SONGS[songIdx];
    try {
      await prisma.user.update({
        where: { id: botId },
        data: {
          profileSongUrl: song.url,
          profileSongTitle: song.title,
          profileSongArtist: song.artist,
        },
      });
      console.log(`  ✅ ${botId}: ${song.title}`);
    } catch (e) {
      console.log(`  ⚠️ ${botId}: not found or error - ${e.message}`);
    }
  }

  // 2. Update bot cover images
  console.log('\n🖼️ Updating bot cover images...');
  for (const [botId, coverPath] of Object.entries(BOT_COVERS)) {
    try {
      await prisma.user.update({
        where: { id: botId },
        data: { coverImage: coverPath },
      });
      console.log(`  ✅ ${botId}: ${coverPath}`);
    } catch (e) {
      console.log(`  ⚠️ ${botId}: not found or error - ${e.message}`);
    }
  }

  // 3. Add new heartfelt/emotional posts
  console.log('\n❤️ Adding new heartfelt/emotional posts...');
  let addedPosts = 0;
  for (const post of NEW_POSTS) {
    try {
      // Check if similar post already exists (by author + first 50 chars)
      const existing = await prisma.post.findFirst({
        where: {
          authorId: post.authorId,
          text: { startsWith: post.text.substring(0, 50) },
        },
      });
      if (existing) {
        console.log(`  ⏭️ Already exists: ${post.authorId} - "${post.text.substring(0, 40)}..."`);
        continue;
      }

      await prisma.post.create({
        data: {
          authorId: post.authorId,
          text: post.text,
          images: '[]',
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          sharesCount: post.sharesCount,
          vibeTag: post.vibeTag,
          type: post.type,
        },
      });
      addedPosts++;
      console.log(`  ✅ Added: ${post.authorId} - "${post.text.substring(0, 40)}..."`);
    } catch (e) {
      console.log(`  ⚠️ Error adding post: ${e.message}`);
    }
  }
  console.log(`  📊 Added ${addedPosts} new posts`);

  // 4. Clean up duplicate posts (same author + same text)
  console.log('\n🧹 Cleaning up duplicate posts...');
  const allPosts = await prisma.post.findMany({
    select: { id: true, authorId: true, text: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const seen = new Map(); // key: authorId:text -> postId
  let deletedCount = 0;
  for (const post of allPosts) {
    const key = `${post.authorId}:${post.text}`;
    if (seen.has(key)) {
      // Keep the newer one (already in map), delete the older one
      await prisma.post.delete({ where: { id: post.id } });
      deletedCount++;
    } else {
      seen.set(key, post.id);
    }
  }
  console.log(`  🗑️ Deleted ${deletedCount} duplicate posts`);

  // 5. Protect founder profile - ensure it cannot be changed
  console.log('\n👑 Protecting founder profile...');
  try {
    await prisma.user.update({
      where: { id: 'founder' },
      data: {
        name: 'Nick Joseph',
        handle: '@nickorraceo',
        bio: 'Founder of ORRA — building the next-gen social universe where creativity meets connection. Turning vision into reality, one pulse at a time. New Orleans born, worldwide impact.',
        avatar: '/images/avatars/bots/founder-avatar.jpg',
        coverImage: '/images/covers/founder.jpg',
        location: 'New Orleans, LA',
        website: 'orra.app',
        verified: true,
        profileSongUrl: '/music/orra/orra.mp3',
        profileSongTitle: 'ORRA',
        profileSongArtist: 'ORRA',
      },
    });
    console.log('  ✅ Founder profile locked and restored');
  } catch (e) {
    console.log(`  ⚠️ Founder profile error: ${e.message}`);
  }

  console.log('\n✅ ORRA Content Update Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
