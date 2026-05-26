#!/usr/bin/env node
/**
 * Update all ORRA users with realistic names, handles, and bios
 */
const { PrismaClient } = require('../node_modules/.prisma/client');
const p = new PrismaClient();

async function updateUsers() {
  // AI AGENT updates — realistic names instead of bot names
  const agentUpdates = [
    {
      id: 'cmozvtdoj0000i1tqnvha1lkx',
      name: 'Jordan Mitchell',
      handle: '@jordanmitch',
      bio: 'Stand-up comedian by night, software engineer by day. I think cereal with water is valid and I will die on this hill. Atlanta born, Houston living.'
    },
    {
      id: 'cmozvtdox0001i1tqew288gkk',
      name: 'Tasha Williams',
      handle: '@tashawill',
      bio: 'Life coach & mom of 3. Went from homeless to homeowner in 5 years. Every day above ground is a win. Southside Chicago forever.'
    },
    {
      id: 'cmozvtdp20002i1tqlbrda2q8',
      name: 'Marcus Chen',
      handle: '@marcuschen',
      bio: 'Breaking news junkie and former journalist. Now I just report on what actually matters — culture, tech, and community. D.C. via Brooklyn.'
    },
    {
      id: 'cmozvtdp40003i1tqiz6ddvob',
      name: 'Derek Washington',
      handle: '@derekwash',
      bio: 'Competitive gamer since 2012. Coached my little brother to regionals in esports. PS5 > Xbox, fight me. Detroit stand up.'
    },
    {
      id: 'cmozvtdp60004i1tq6h92tz6d',
      name: 'Camille Laurent',
      handle: '@camillelaurent',
      bio: 'Fashion stylist and thrift queen. I can put together a full outfit for under $30 that looks like it cost $300. Miami vibes, Paris dreams.'
    },
    {
      id: 'cmozvtdp70005i1tq1ecvqn7z',
      name: 'DeShawn Carter',
      handle: '@deshawncarter',
      bio: 'Music producer and DJ. Produced my first beat on a cracked copy of FL Studio at 14. Now I work with real artists. Nashville to LA.'
    },
    {
      id: 'cmozvtdp90006i1tqj8x9ar69',
      name: 'Aaliyah Brooks',
      handle: '@aaliyahbrooks',
      bio: 'Personal trainer and former college athlete. Tore my ACL junior year and found a whole new purpose helping others rebuild. Philly strong.'
    },
    {
      id: 'cmozvtdpb0007i1tq6fuy5ilh',
      name: 'Priya Sharma',
      handle: '@priyasharma',
      bio: 'Full-stack developer and open source contributor. Left corporate to build tools for underserved communities. Bangalore to Seattle to Austin.'
    },
  ];

  // SEED USER updates — realistic names with real-life stories
  const seedUpdates = [
    {
      id: 'u1',
      name: 'Jessica Rivera',
      handle: '@jessicarivera',
      bio: 'Digital artist and muralist. My abuela taught me to paint when I was 6 — now I paint murals all over the Bay Area. Art is how I pray.'
    },
    {
      id: 'u2',
      name: 'David Park',
      handle: '@davidpark',
      bio: 'High school math teacher by day, amateur chef by night. My kimchi jigae recipe has been passed down 4 generations. Seoul to Queens.'
    },
    {
      id: 'u3',
      name: 'Sarah Mitchell',
      handle: '@sarahmitchell',
      bio: 'Pediatric nurse and plant mom with 47 houseplants. Working night shift taught me to find joy in the quiet moments. Cleveland born.'
    },
    {
      id: 'u4',
      name: 'Marcus Rivera',
      handle: '@marcusr',
      bio: 'Community organizer and youth mentor. Started a free coding bootcamp in my neighborhood. Every kid deserves a shot at tech. Southside Chicago.'
    },
    {
      id: 'u5',
      name: 'Elena Vasquez',
      handle: '@elenavasquez',
      bio: 'UX designer and first-gen college grad. My parents crossed the border so I could cross the stage. Mexico City to San Antonio to SF.'
    },
    {
      id: 'u6',
      name: 'Tyler Morrison',
      handle: '@tylermorrison',
      bio: 'Tech startup founder. Failed twice before 25, third one is actually working. Building tools for gig workers. Portland, OR.'
    },
    {
      id: 'u7',
      name: 'Naomi Jackson',
      handle: '@naomijackson',
      bio: 'Yoga instructor and mental health advocate. Anxiety tried to take me out but I learned to breathe through it. Healing out loud. Denver.'
    },
    {
      id: 'u8',
      name: 'Chris Taylor',
      handle: '@christaylor',
      bio: 'Cybersecurity analyst and auto mechanic. Yes I fix both cars and code. Grew up in my dad garage in Memphis. Trust but verify.'
    },
    {
      id: 'u9',
      name: 'Malik Johnson',
      handle: '@malikjohnson',
      bio: 'Music teacher at an inner-city school. My students taught me more about resilience than any book. Jazz saxophone is my therapy. New Orleans.'
    },
    {
      id: 'u10',
      name: 'Luna Reyes',
      handle: '@lunareyes',
      bio: 'Photographer and world traveler. 23 countries and counting. My mom said I would never make a living taking pictures — here we are. Manila to LA.'
    },
    {
      id: 'u11',
      name: 'Kai Nakamura',
      handle: '@kainakamura',
      bio: 'Surf instructor and ocean conservationist. The ocean saved my life, now I am trying to save it back. Oahu born and raised. Protect the reefs.'
    },
    {
      id: 'u12',
      name: 'Nadia Okafor',
      handle: '@nadiaokafor',
      bio: 'Data scientist and spoken word poet. Numbers tell stories and so do I. Nigerian-American, proud daughter of immigrants. Houston, TX.'
    },
    {
      id: 'u13',
      name: 'Zara Ahmed',
      handle: '@zaraahmed',
      bio: 'Fashion & lifestyle content creator. Pakistani-American bridging cultures through style. My grandmother sarees are my biggest inspiration. NYC.'
    },
    {
      id: 'u14',
      name: 'Jay Thompson',
      handle: '@jaythompson',
      bio: 'Streamer and competitive FPS player. Went from playing in my dorm to 50K followers. My mom still thinks I should get a real job lol. Atlanta.'
    },
    {
      id: 'u15',
      name: 'Maya Patel',
      handle: '@mayapatel',
      bio: 'Food blogger and home chef. Sharing recipes that bring people together around the table. My dadi chai recipe is my most requested. Jersey City.'
    },
    {
      id: 'u16',
      name: 'Dre Washington',
      handle: '@drewashington',
      bio: 'Music producer & DJ. Beats that move the culture. Started making beats in my college dorm, now I produce for real artists. Chicago to LA.'
    },
  ];

  let updated = 0;

  for (const u of [...agentUpdates, ...seedUpdates]) {
    try {
      await p.user.update({
        where: { id: u.id },
        data: {
          name: u.name,
          handle: u.handle,
          bio: u.bio,
        }
      });
      updated++;
      console.log(`✅ ${u.name} (@${u.handle.replace('@','')})`);
    } catch(e) {
      console.error(`❌ Failed for ${u.id} ${u.name}: ${e.message}`);
    }
  }

  console.log(`\n🎉 Updated ${updated} users with realistic names and bios`);
  await p.$disconnect();
}

updateUsers();
