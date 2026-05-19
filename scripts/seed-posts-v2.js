const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const POSTS = [
  { authorId: 'u32', text: 'Street style snap from Fashion Week. This look deserves its own editorial spread', vibeTag: 'dramatic' },
  { authorId: 'u33', text: 'Set was INSANE tonight. 3 hours of nonstop bass and the crowd never stopped moving', vibeTag: 'hyped' },
  { authorId: 'u34', text: 'Just observed a neutron star merger simulation and my mind is genuinely blown. The universe is unhinged', vibeTag: 'focused' },
  { authorId: 'u35', text: 'Finished this 12 hour session today. The detail on this sleeve is coming together perfectly', vibeTag: 'focused' },
  { authorId: 'u36', text: 'Morning breathwork session complete. 20 minutes of conscious breathing and the world makes sense again', vibeTag: 'peaceful' },
  { authorId: 'u37', text: 'Day in my life vlog just went live! Spoiler: it involves a lot of coffee and chaotic creativity', vibeTag: 'hyped' },
  { authorId: 'u38', text: '5am gym session before the world wakes up. This is where champions are made', vibeTag: 'focused' },
  { authorId: 'u39', text: 'Living room makeover COMPLETE. The before and after is unreal. Vintage pieces make all the difference', vibeTag: 'dramatic' },
  { authorId: 'u40', text: 'New single origin just arrived from Ethiopia. The tasting notes on this one are extraordinary', vibeTag: 'chill' },
  { authorId: 'u41', text: 'Show night! The energy backstage before stepping out is like nothing else in this world', vibeTag: 'hyped' },
  { authorId: 'u42', text: 'Dawn patrol session was absolutely perfect. Clean waves and offshore wind. This is living', vibeTag: 'peaceful' },
  { authorId: 'u43', text: 'Behind the camera on our latest doc. This story is going to change how people see this community', vibeTag: 'focused' },
  { authorId: 'u44', text: 'New mural going up in the Arts District. 40 feet of color and it is only half done', vibeTag: 'dramatic' },
  { authorId: 'u45', text: 'Croquembouche assembled! 200 cream puffs and a tower of caramel. Pastry architecture at its finest', vibeTag: 'dramatic' },
  { authorId: 'u46', text: 'New podcast episode just dropped and we got HEATED. This weeks topic had me on a soapbox', vibeTag: 'hyped' },
  { authorId: 'u32', text: 'Caught this candid style moment on the subway. Fashion is everywhere if you look', vibeTag: 'chill' },
  { authorId: 'u33', text: 'Festival sunset set just hit different. 50,000 people all moving to the same beat', vibeTag: 'dramatic' },
  { authorId: 'u34', text: 'Black hole fact of the day: time literally slows down near one. Physics is wild yall', vibeTag: 'chill' },
  { authorId: 'u35', text: 'Custom flash sheet just dropped! First come first served this weekend', vibeTag: 'hyped' },
  { authorId: 'u36', text: 'Yoga flow at sunrise. There is something sacred about moving your body while the world wakes up', vibeTag: 'peaceful' },
  { authorId: 'u37', text: 'GRWM for the biggest meeting of my career. Vulnerability is content and I am here for it', vibeTag: 'dramatic' },
  { authorId: 'u38', text: 'Training session went crazy today. Kid just learned a killer crossover in one session', vibeTag: 'hyped' },
  { authorId: 'u39', text: 'Thrift store find of the week. This mid-century lamp is everything and it was 12 dollars', vibeTag: 'chill' },
  { authorId: 'u40', text: 'Latte art progress! Finally nailed the rosetta after 200 attempts. Persistence pays off', vibeTag: 'focused' },
  { authorId: 'u41', text: 'Drag is not just performance it is revolution. Art as activism. Love as resistance', vibeTag: 'dramatic' },
  { authorId: 'u42', text: 'Surf lesson with the groms today. Seeing kids fall in love with the ocean never gets old', vibeTag: 'chill' },
  { authorId: 'u43', text: 'Interview wrapped. Three hours of the most honest conversation I have ever filmed. The truth is powerful', vibeTag: 'dramatic' },
  { authorId: 'u44', text: 'Wall found, spray cans loaded, vision locked. Let us make this city more beautiful', vibeTag: 'hyped' },
  { authorId: 'u45', text: 'Macaron batch number 47 and I finally got the feet right. Baking is patience', vibeTag: 'focused' },
  { authorId: 'u46', text: 'Recording the wildest episode yet. The hot takes are SCORCHING. Do not miss this one', vibeTag: 'hyped' },
];

async function main() {
  console.log(`Creating ${POSTS.length} posts for 15 new bots...\n`);
  let success = 0, failed = 0;

  for (const post of POSTS) {
    try {
      await prisma.post.create({
        data: {
          text: post.text,
          vibeTag: post.vibeTag,
          type: 'text',
          images: '[]',
          authorId: post.authorId,
          likesCount: Math.floor(Math.random() * 40) + 5,
          commentsCount: 0,
          sharesCount: Math.floor(Math.random() * 12),
        }
      });
      console.log(`  ✅ ${post.authorId}: "${post.text.substring(0, 45)}..."`);
      success++;
    } catch (err) {
      console.log(`  ❌ ${post.authorId}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 ${success} success, ${failed} failed`);
  await prisma.$disconnect();
}

main();
