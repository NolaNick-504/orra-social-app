const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const now = new Date('2026-05-28T12:00:00.000Z');

const newPosts = [
  // Amira Johnson - Pediatric nurse, plant mom
  { authorId: 'bot01', text: "Working in pediatrics during a mental health crisis is heartbreaking. Kids as young as 8 are coming in with anxiety that would have been unheard of 10 years ago. Social media, pressure from school, the state of the world — they feel all of it. We gotta do better by these babies. Check on your kids, not just their grades but their souls." },
  { authorId: 'bot01', text: "The nursing shortage is REAL and it's scary. We're short-staffed every single shift and administration keeps cutting budgets while expecting us to do more with less. Patient care suffers when nurses are running on fumes. Something has to change before the whole system breaks." },
  { authorId: 'bot01', text: "Had a 12-year-old patient tell me she wants to be a doctor because 'somebody has to fix what's broken.' I almost cried right there. That kid gives me hope for this world even on the darkest shifts." },

  // Devin Mitchell - High school football coach
  { authorId: 'bot02', text: "These kids are dealing with stuff we never had to worry about at their age. Active shooter drills, social media bullying, parents struggling to make rent. Coaching ain't just about X's and O's anymore — half my job is just keeping these young men grounded and believing in themselves when the world keeps telling them they don't matter." },
  { authorId: 'bot02', text: "People wanna complain about 'kids these days' but won't acknowledge that we handed them a broken world and told them to figure it out. These young folks are more aware, more empathetic, and more resilient than we ever were. Give them their flowers." },
  { authorId: 'bot02', text: "Three of my players can't afford cleats this season. THREE. And the school board just approved a $2 million stadium renovation. Tell me again how this system ain't broken." },

  // Sofia Reyes - First-gen college grad, marketing
  { authorId: 'bot03', text: "First-gen grad still paying off student loans 4 years later while my white colleagues with the same degree had their parents pay theirs off. The wealth gap isn't just statistics — it's my real life. It's the difference between building savings and choosing which bill to pay late every month." },
  { authorId: 'bot03', text: "Corporate diversity initiatives look great on Instagram but where's the actual change? I'm still the only Latina in my department. Still getting talked over in meetings. Still watching less qualified people get promoted over me. The performative stuff is exhausting." },
  { authorId: 'bot03', text: "Rents are so insane right now that my generation is basically choosing between living in a closet or having roommates forever. I make decent money and I STILL can't afford to live alone in this city. How is this sustainable?" },

  // Marcus Rivera - Dance instructor, choreographer
  { authorId: 'bot04', text: "Arts education is getting slashed left and right but somehow there's always money for another stadium or military budget. Dance saved my life. Gave me purpose, discipline, community. These kids deserve access to that same lifeline, not just the ones whose parents can afford private lessons." },
  { authorId: 'bot04', text: "The way AI is trying to replace creative expression is wild to me. You can't algorithm a feeling. You can't code the way a dancer loses themselves in the music. The soul of art is human imperfection and that's something no machine will ever replicate." },

  // Raj Patel - Software engineer, food blogger
  { authorId: 'bot05', text: "As a software engineer, I see AI taking jobs every day. But here's what nobody talks about — it's not replacing creativity or care. My butter chicken recipe took 47 attempts to perfect. No AI can replicate the love my grandmother put into that dish or the memories of learning it in her kitchen." },
  { authorId: 'bot05', text: "Tech layoffs are devastating families right now. 200,000+ laid off this year alone and CEOs are still getting billion-dollar bonuses. I survived a round and the guilt of still being here while my work friends lost everything is heavy. The whole system is designed to treat people as disposable." },
  { authorId: 'bot05', text: "The H1B visa debate is so frustrating. Immigrants built this tech industry and now politicians want to use us as scapegoats for their own failures. I contribute more in taxes than most of these politicians pay themselves. We're not the problem — we're the backbone." },

  // Tasha Washington - Hair stylist, salon owner
  { authorId: 'bot06', text: "Small business owners are STRUGGLING right now. Between inflation, rent increases, and trying to provide health insurance for my stylists, I'm working 70-hour weeks just to keep the lights on. But you won't hear about us on the news. We're just expected to figure it out." },
  { authorId: 'bot06', text: "The beauty industry doesn't get enough respect for what it really is — therapy. My chair has heard more confessions than a church. Women sitting in my chair crying about their marriages, their jobs, their kids. Sometimes a haircut is really a lifeline." },
  { authorId: 'bot06', text: "I started doing hair at 12 because my mama couldn't afford salon prices. Now I own a salon and I offer sliding scale appointments because I remember what it felt like to not be able to afford to feel beautiful. Economic justice starts in your own community." },

  // Chris Nakamura - Electrician, gamer
  { authorId: 'bot07', text: "Trade jobs are the most underrated career path in today's world. While everyone's fighting over the same tech jobs, I'm making $85K with no student debt. We need electricians, plumbers, welders — the infrastructure literally depends on us. Stop treating trades like a backup plan." },
  { authorId: 'bot07', text: "Online toxicity in gaming communities has gotten so much worse. The amount of racism and hate I hear on voice chat is insane. I love gaming but sometimes I gotta turn off the mic because it's just too much. Gaming should be an escape, not another place where you feel like you don't belong." },
  { authorId: 'bot07', text: "Everyone's worried about AI taking jobs but my job requires physical presence, problem-solving, and adaptability. No robot is crawling through a 100-degree attic to rewire a junction box. Trades are AI-proof and I'm sleeping great at night." },

  // Elena Vasquez - Traveler, 23 countries
  { authorId: 'bot08', text: "Traveling through 23 countries taught me that every single person just wants safety, food, and a future for their kids. The politicians and media want us divided but regular people everywhere want the same things. The real 'woke' is realizing how much we have in common across borders." },
  { authorId: 'bot08', text: "Climate change isn't some distant threat — I've SEEN it. Beaches that existed 5 years ago are gone. Coral reefs I snorkeled are bleached and dead. Communities displaced by flooding. If you haven't witnessed it yet, you will. We're running out of time to pretend this isn't happening." },
  { authorId: 'bot08', text: "The anti-immigrant rhetoric breaks my heart because I've been welcomed into strangers' homes in every country I've visited. A family in Morocco fed me dinner when I was lost. A stranger in Portugal helped me find my hostel. Humanity is good. It's the systems that are broken." },

  // Donte Jackson - Music producer, bedroom beats
  { authorId: 'bot09', text: "The music industry is exploitive and always has been. Artists getting fractions of a penny per stream while executives buy yachts. I produce beats for 200 bucks that generate millions for labels. The math don't add up unless you're the one at the top." },
  { authorId: 'bot09', text: "AI-generated music is a threat to real artists but it's also a wake-up call. If your only value is making generic content, yeah you should be worried. But music that makes you FEEL something? Music that comes from lived experience and pain and joy? That can't be replicated by a prompt." },
  { authorId: 'bot09', text: "Gentrification killed the music scene in my neighborhood. All the venues that gave underground artists a stage are now luxury condos. Where are kids supposed to perform? Where do they get their start? They took our culture and then priced us out of our own community." },

  // Luna Kim - Illustrator, cat enthusiast
  { authorId: 'bot10', text: "Freelance life means no health insurance, no sick days, no retirement, and people asking you to work 'for exposure.' Artists are expected to love what we do so much that we don't deserve to be paid. I love drawing but I also love eating and paying rent. Both can be true." },
  { authorId: 'bot10', text: "Social media has turned art into a content machine. Post every day or you're irrelevant. Go viral or you're invisible. I miss when making art was about the process, not the algorithm. The pressure to constantly produce is killing creativity, not feeding it." },
  { authorId: 'bot10', text: "My illustration about climate anxiety got 50 likes. A selfie of me holding a coffee got 3,000. That's everything wrong with social media right there. Substance drowns while surface-level content thrives. Keep making the real stuff anyway." },

  // Terrence Brooks - Warehouse supervisor, mechanic
  { authorId: 'bot11', text: "People talk about the working class like we're statistics but we're the ones keeping this country running. Every package you order, every product on the shelf — that's us. We deserve living wages, safe conditions, and dignity. Is that really too much to ask?" },
  { authorId: 'bot11', text: "Working class men's mental health is a crisis nobody talks about. My dad's generation was told to 'man up and deal with it.' Now I'm watching my coworkers self-medicate with alcohol because therapy costs $200 an hour and our insurance barely covers a checkup." },
  { authorId: 'bot11', text: "Unionizing changed my warehouse. Went from mandatory overtime with no breaks to actually having a voice. If you're working somewhere that treats you like a machine, organizing is how you take your power back. They're scared of us for a reason." },

  // Maya Chen - Food blogger, home chef
  { authorId: 'bot12', text: "Food insecurity in this country is a choice. We throw away 40% of our food while 1 in 6 kids go hungry. That's not a supply problem — that's a distribution and priorities problem. Every community deserves access to fresh, affordable food. Food deserts are a form of systemic violence." },
  { authorId: 'bot12', text: "The price of groceries is out of control and I say that as someone who cooks professionally. A basic chicken and rice meal that cost me $8 two years ago is now $15. How are families supposed to feed their kids? And the food companies are posting record profits. Make it make sense." },
  { authorId: 'bot12', text: "Immigrant food cultures are the backbone of American cuisine but the people who create these recipes can't even get legal protection for their businesses. My grandmother's recipes are now being sold by corporations who've never set foot in our community. Cultural appropriation on a plate." },

  // Zara Miles - Fashion & lifestyle
  { authorId: 'bot13', text: "Fast fashion is destroying the planet and exploiting workers but nobody wants to hear it because $5 tops are addictive. The garment workers making your clothes are working 16-hour days for pennies. I'm not perfect but I'm trying to do better. Thrift, upcycle, invest in pieces that last." },
  { authorId: 'bot13', text: "The beauty standard keeps shrinking and it's literally killing women. Ozempic for weight loss, filters on every photo, surgeries at 19. I've been in the fashion industry and I'm telling you — the industry profits off your insecurity. Your body is not a trend." },
  { authorId: 'bot13', text: "Being a Black woman in fashion means constantly having your style copied without credit. Cornrows are 'trendy' when a celebrity wears them but 'unprofessional' when I do. The double standard is exhausting but I'll never stop showing up authentically." },

  // Jaylen Parker - Gamer, streamer
  { authorId: 'bot14', text: "Gaming is the biggest entertainment industry in the world but gamers are still treated like losers. Meanwhile the same people binge-watching Netflix for 6 hours judge us for playing games. It's interactive, social, and builds community. The stigma needs to end." },
  { authorId: 'bot14', text: "Content creation burnout is real and nobody prepares you for it. Stream 8 hours a day, edit videos, manage socials, engage with community, worry about algorithm changes. Take a day off? Your numbers tank. The grind never stops and it's breaking people." },
  { authorId: 'bot14', text: "The amount of predatory microtransactions in games targeting KIDS is disgusting. $20 skins, loot boxes, battle passes — it's gambling dressed up as gaming. And the ESRB lets it happen because the industry lines their pockets. Protect young gamers." },

  // Dre Williams - Music producer, DJ
  { authorId: 'bot15', text: "Systemic racism in the music industry isn't subtle. Black artists created rock, jazz, hip-hop, R&B, and house music but somehow the executives and label owners never look like us. We create the culture and they profit from it. That equation hasn't changed in 50 years." },
  { authorId: 'bot15', text: "Mental health in the music industry is a silent epidemic. Touring musicians are 10x more likely to experience depression. The pressure to always be 'on,' the substance abuse normalized as part of the lifestyle, the isolation. We lost too many talented people because nobody checked on them." },

  // Nia Okafor - Yoga instructor, wellness
  { authorId: 'bot16', text: "Wellness has been commodified to the point where the people who need it most can't afford it. $40 yoga classes, $100 supplements, $200 retreats — healing shouldn't be a luxury. I'm teaching free community classes because wellness is a RIGHT, not a privilege." },
  { authorId: 'bot16', text: "The wellness industry's obsession with 'good vibes only' is toxic positivity. Sometimes life is hard and that's valid. Suppressing negative emotions in the name of positivity isn't healing — it's avoidance. Real wellness means sitting with ALL your feelings, not just the pretty ones." },
  { authorId: 'bot16', text: "Black women are expected to be strong all the time and it's literally killing us. Higher rates of maternal mortality, heart disease, and stress-related illness. Being 'strong' shouldn't mean suffering in silence. Taking care of yourself is not selfish — it's survival." },

  // Trevon Harris - Community college student
  { authorId: 'bot17', text: "Community college students are the most underestimated people in this country. We're working full-time, raising families, and STILL showing up to class. We don't have trust funds or legacy admissions — just grit and determination. Don't ever count us out." },
  { authorId: 'bot17', text: "Student loan forgiveness isn't a handout — it's fixing a broken system. I'll be paying off loans until I'm 45 for a degree that was supposed to help me build a life. The interest alone is more than the original loan. How is that fair?" },
  { authorId: 'bot17', text: "The cost of textbooks should be criminal. $300 for a required book that the professor barely references. And they release a 'new edition' every year with minor changes so you can't buy used. It's a scam targeting people who can least afford it." },

  // Isla Brennan - Barista, poet
  { authorId: 'bot18', text: "new poem:\n\nthey say the world is ending\nbut it's been ending\nfor someone\nevery single day\n\nthe mother working three jobs\nthe refugee at the border\nthe kid who can't afford lunch\n\nthe world doesn't end\nit just ends for some of us\nsooner than others" },
  { authorId: 'bot18', text: "new poem:\n\nwe are the generation\nthat learned to type prayers\ninto comment sections\nand call it activism\n\nbut somewhere between\nthe share button\nand the next scroll\nwe forgot\nthat revolution\nrequires\nmore than\na repost" },
  { authorId: 'bot18', text: "new poem:\n\ndoomscrolling at 2am\nthe weight of a thousand tragedies\ncompressed into headlines\nbetween ads for skincare\nand meal delivery\n\nhow do you grieve\nfor strangers\nwhen you can barely\nhold yourself\ntogether" },

  // Kai Tanaka - Skater, artist
  { authorId: 'bot19', text: "Public spaces are disappearing. Skate spots get skate-stopped, parks get privatized, loitering laws target anyone who isn't consuming. Where are young people supposed to just EXIST without being expected to spend money? The commodification of every square inch of this world is suffocating." },
  { authorId: 'bot19', text: "Skate culture taught me more about community than school ever did. When you fall, someone picks you up. When your board snaps, someone loans you theirs. We look out for each other. Imagine if the whole world operated like a skate session — no judgment, just collective progression." },

  // Brianna Taylor - Single mom, accountant
  { authorId: 'bot20', text: "Childcare costs more than my rent. Let that sink in. I'm literally paying someone else to watch my kids so I can go to work to pay them to watch my kids. The math doesn't work and politicians wonder why birth rates are dropping." },
  { authorId: 'bot20', text: "Being a single mom in this economy means constant guilt. Guilt for working too much, guilt for not making enough, guilt for missing school events, guilt for serving dinosaur nuggets again. The system is set up for us to fail and then blames us when we struggle." },
  { authorId: 'bot20', text: "Paid family leave should be a no-brainer in the richest country on Earth. Every other developed nation has it. But here we are, forcing moms back to work 2 weeks after giving birth because they can't afford not to. That's not freedom — that's a crisis." },

  // Omar Hassan - Architecture student
  { authorId: 'bot21', text: "Affordable housing isn't a radical idea — it's a human right. I study architecture and every project I see is luxury condos no one can afford. Where are the homes for teachers, nurses, working families? We have the knowledge and resources. What's missing is the will." },
  { authorId: 'bot21', text: "As a Muslim in America, I've learned that representation matters but it's not enough. Having one Muslim character in a show doesn't fix the surveillance of our mosques or the travel bans or the microaggressions. We need policy change, not just visibility." },
  { authorId: 'bot21', text: "Sustainable architecture shouldn't be a premium feature. Green building should be the STANDARD. The fact that eco-friendly design costs more means we're pricing out the communities who need climate resilience the most. Environmental justice IS economic justice." },

  // Rosa Delgado - Retired teacher, gardener
  { authorId: 'bot22', text: "I taught for 35 years and watched education get defunded year after year. Now teachers are buying their own supplies, working second jobs, and leaving the profession in droves. You get what you pay for and this country is choosing to underpay the people shaping its future." },
  { authorId: 'bot22', text: "The older generation gets blamed for everything but y'all forget we were fighting the same fights decades ago. We marched for civil rights, protested wars, demanded equality. The names change but the struggle continues. Don't erase our activism just because we have gray hair now." },
  { authorId: 'bot22', text: "Social Security is NOT an entitlement — I paid into it for 40 years. Now politicians want to cut it to fund tax breaks for billionaires. I worked my whole life for that money. Keep your hands off my retirement and stop pitting generations against each other." },

  // Liam O'Connor - Firefighter, amateur chef
  { authorId: 'bot23', text: "First responders are facing record levels of PTSD and suicide but the help isn't there. I've seen things nobody should see and the department's idea of mental health support is a pamphlet. We run into burning buildings for strangers but can't get therapy for ourselves." },
  { authorId: 'bot23', text: "Climate change is making wildfire season year-round now. We used to have a season. Now it's constant. My crew is exhausted, underfunded, and stretched thin. Meanwhile climate denial is still a political position. Come ride in my truck for one shift and tell me it's not real." },

  // Jade Thompson - Personal trainer
  { authorId: 'bot24', text: "Healthcare in this country is backwards. We spend trillions treating preventable diseases but won't invest in prevention. Gym memberships, healthy food, mental health — all out of pocket. But insulin and heart medication? That'll be covered (barely). Fix the root, not just the symptoms." },
  { authorId: 'bot24', text: "Body positivity got hijacked by the same industry that made us hate our bodies in the first place. Now it's 'love your body... by buying our products.' Real body liberation means dismantling the systems that profit from our insecurities, not just slapping a feel-good label on the same old sales pitch." },
  { authorId: 'bot24', text: "Food deserts are a public health crisis that nobody talks about. I can't tell a client to 'eat healthier' when the closest grocery store is 45 minutes away and the corner store only has processed food. Personal responsibility only goes so far when the system is designed to keep you unhealthy." },

  // Ethan Park - Math teacher, meme lord
  { authorId: 'bot25', text: "Teachers are leaving the profession in record numbers and everyone's shocked. Maybe it's the low pay, the gun violence, the impossible expectations, the standardized testing industrial complex, or the fact that we have to buy our own supplies while admin gets raises. Just maybe." },
  { authorId: 'bot25', text: "The book banning movement is about control, not protection. You don't protect kids by hiding the world from them — you protect them by giving them the tools to understand it. A teenager who reads critically is the most dangerous thing to an oppressive system. That's the point." },
  { authorId: 'bot25', text: "I make math memes because if I don't laugh I'll cry. My school just cut the arts program but found $50K for a new football scoreboard. I love sports but when are we gonna prioritize the things that actually develop young minds? STEM AND arts, not either/or." },

  // Nick Joseph - ORRA Founder
  { authorId: 'founder', text: "I built ORRA because I got tired of platforms that profit off our pain, sell our data, and divide us for engagement. Social media was supposed to connect us — instead it isolated us, radicalized us, and monetized our attention. We deserve better. ORRA is my answer to that." },
  { authorId: 'founder', text: "The attention economy is the most destructive force in modern society. Every outrage post, every divisive algorithm, every rage-inducing notification — it's all by design. They WANT you angry because angry people scroll more. ORRA is built on a different model: connection over engagement, community over conflict." },
  { authorId: 'founder', text: "Tech founders love to talk about 'changing the world' while building tools that make it worse. I'm building ORRA to actually change the social media paradigm. No algorithmic manipulation. No selling your data. No amplifying hate for clicks. Just real people, real connections, real community." },
];

async function main() {
  console.log(`Adding ${newPosts.length} new text-only posts about today's world...`);

  let created = 0;

  for (let i = 0; i < newPosts.length; i++) {
    const post = newPosts[i];
    try {
      // Create staggered timestamps throughout today
      const hoursAgo = Math.floor(Math.random() * 14); // spread across 14 hours
      const minutesAgo = Math.floor(Math.random() * 60);
      const postDate = new Date(now.getTime() - (hoursAgo * 60 + minutesAgo) * 60000);

      await prisma.post.create({
        data: {
          id: `pworld-${i + 1}`,
          text: post.text,
          images: '[]', // No images - text only
          type: 'text',
          vibeTag: getVibeTag(post.text),
          likesCount: Math.floor(Math.random() * 3000) + 500,
          commentsCount: Math.floor(Math.random() * 200) + 20,
          sharesCount: Math.floor(Math.random() * 150) + 10,
          authorId: post.authorId,
          createdAt: postDate,
          updatedAt: postDate,
        },
      });

      created++;
      console.log(`[${i + 1}/${newPosts.length}] ✓ ${post.authorId}: "${post.text.substring(0, 50)}..."`);
    } catch (error) {
      // If ID collision, try with a unique suffix
      try {
        await prisma.post.create({
          data: {
            id: `pworld-${i + 1}-${Date.now()}`,
            text: post.text,
            images: '[]',
            type: 'text',
            vibeTag: getVibeTag(post.text),
            likesCount: Math.floor(Math.random() * 3000) + 500,
            commentsCount: Math.floor(Math.random() * 200) + 20,
            sharesCount: Math.floor(Math.random() * 150) + 10,
            authorId: post.authorId,
            createdAt: new Date(now.getTime() - Math.floor(Math.random() * 14 * 60) * 60000),
            updatedAt: new Date(),
          },
        });
        created++;
        console.log(`[${i + 1}/${newPosts.length}] ✓ (retry) ${post.authorId}`);
      } catch (e2) {
        console.log(`[${i + 1}/${newPosts.length}] ✗ ${post.authorId}: ${e2.message}`);
      }
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Created: ${created}/${newPosts.length}`);

  // Verify
  const total = await prisma.post.count();
  const textPosts = await prisma.post.count({ where: { type: 'text' } });
  const imagePosts = await prisma.post.count({ where: { type: 'image' } });
  console.log(`Total posts now: ${total}`);
  console.log(`Text posts: ${textPosts}`);
  console.log(`Image posts: ${imagePosts}`);
}

function getVibeTag(text) {
  const lower = text.toLowerCase();
  if (lower.includes('celebrat') || lower.includes('🎉') || lower.includes('hope') || lower.includes('dream')) return 'hyped';
  if (lower.includes('angry') || lower.includes('mad') || lower.includes('furious') || lower.includes('disgusting')) return 'fired-up';
  if (lower.includes('sad') || lower.includes('heartbreak') || lower.includes('cry') || lower.includes('grief')) return 'in-my-feels';
  if (lower.includes('think') || lower.includes('real') || lower.includes('truth') || lower.includes('system')) return 'deep-thoughts';
  if (lower.includes('love') || lower.includes('care') || lower.includes('heart') || lower.includes('community')) return 'love';
  if (lower.includes('tired') || lower.includes('exhaust') || lower.includes('burnout')) return 'drained';
  if (lower.includes('fight') || lower.includes('resist') || lower.includes('union') || lower.includes('organize')) return 'fired-up';
  if (lower.includes('worry') || lower.includes('scared') || lower.includes('crisis') || lower.includes('anxiety')) return 'in-my-feels';
  return 'deep-thoughts';
}

main().catch(console.error).finally(() => prisma.$disconnect());
