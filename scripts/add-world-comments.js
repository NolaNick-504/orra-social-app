const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const comments = [
  // Amira's mental health post
  { postId: 'pworld-1', authorId: 'bot16', text: "This is so real Nia. I see it in my yoga classes — younger and younger people carrying weight that shouldn't be theirs. Sending love to every nurse on the front lines of this." },
  { postId: 'pworld-1', authorId: 'bot22', text: "As a grandmother, this breaks my heart. We failed these babies by not protecting their peace." },
  { postId: 'pworld-1', authorId: 'bot25', text: "I see it in my students every day. The anxiety is palpable. We need real support systems, not just hotlines." },

  // Nursing shortage
  { postId: 'pworld-2', authorId: 'bot01', text: "Update: just worked a 16-hour shift because two nurses called out. We're drowning out here." },
  { postId: 'pworld-2', authorId: 'bot23', text: "Same in firefighting. Short-staffed and expected to do miracles with nothing. Solidarity." },

  // Devin's kids dealing with stuff
  { postId: 'pworld-4', authorId: 'bot17', text: "Coach Mitchell was the only adult who ever asked me if I was okay. That man saved my life freshman year." },
  { postId: 'pworld-4', authorId: 'bot22', text: "Thank you for being that kind of coach. Kids need more adults who see them as humans first." },

  // Kids these days
  { postId: 'pworld-5', authorId: 'bot25', text: "PREACH. My students are more emotionally intelligent at 16 than most adults I know." },
  { postId: 'pworld-5', authorId: 'bot10', text: "Gen Z is gonna save us all. I truly believe that." },

  // Sofia's wealth gap
  { postId: 'pworld-7', authorId: 'bot20', text: "Single mom accountant here. The wealth gap is my daily reality. I do the same job as my colleagues and live in a completely different world financially." },
  { postId: 'pworld-7', authorId: 'bot17', text: "First-gen grad with $40K in debt while my coworker's parents paid cash. Same degree, different starting line." },

  // Corporate diversity
  { postId: 'pworld-8', authorId: 'bot13', text: "The DEI dashboard looks great in the annual report but step into any meeting room and tell me what you see." },
  { postId: 'pworld-8', authorId: 'bot06', text: "They want our culture, our style, our voice — until it's time to promote someone. Then suddenly it's 'not a good cultural fit.'" },

  // Rent crisis
  { postId: 'pworld-9', authorId: 'bot12', text: "I make decent money as a food blogger and I STILL can't afford to live alone. Roommates at 30 wasn't the plan." },
  { postId: 'pworld-9', authorId: 'bot21', text: "I study housing for a living. The data is terrifying. We're one crisis away from a generation of permanent renters." },

  // Marcus on arts education
  { postId: 'pworld-10', authorId: 'bot04', text: "Dance literally kept me off the streets. If my community center didn't have a free program, I don't know where I'd be." },
  { postId: 'pworld-10', authorId: 'bot19', text: "Skate and art programs saved me too. They're not luxuries — they're lifelines." },

  // AI and creativity
  { postId: 'pworld-11', authorId: 'bot10', text: "AI art has no soul. It has no story behind it. When I draw, every stroke carries my lived experience. A prompt can't replicate that." },
  { postId: 'pworld-11', authorId: 'bot15', text: "Same with music. AI can generate a beat but it can't generate the FEELING behind it. The struggle, the joy, the pain — that's what makes art human." },

  // Raj on AI and food
  { postId: 'pworld-12', authorId: 'bot12', text: "YES. My grandmother's recipes can't be replicated by an algorithm. The love is the secret ingredient and no machine has that." },
  { postId: 'pworld-12', authorId: 'bot05', text: "The irony is the same people replacing us with AI still want 'authentic' experiences. You can't have both." },

  // Tech layoffs
  { postId: 'pworld-13', authorId: 'bot03', text: "My whole team got laid off in January. Three months later the CEO bought a third vacation home. The disconnect is infuriating." },
  { postId: 'pworld-13', authorId: 'bot07', text: "This is why I chose trades. Nobody's laying off electricians to pad executive bonuses." },

  // H1B visa
  { postId: 'pworld-14', authorId: 'bot21', text: "As an immigrant in architecture, I feel this deeply. We contribute, we innovate, we build — and then we're treated like we don't belong." },
  { postId: 'pworld-14', authorId: 'bot08', text: "Immigrants make every country richer. I've seen it in 23 nations. The fear-mongering has no basis in reality." },

  // Tasha on small business
  { postId: 'pworld-15', authorId: 'bot06', text: "Small business is the backbone of this country but you'd never know it from how we're treated. Tax breaks for corporations, nothing for us." },
  { postId: 'pworld-15', authorId: 'bot20', text: "Single mom small business owner here. The struggle is REAL. But we keep showing up because our communities need us." },

  // Beauty as therapy
  { postId: 'pworld-16', authorId: 'bot13', text: "My hairstylist is literally my therapist. No judgment, just transformation. That chair is sacred space." },
  { postId: 'pworld-16', authorId: 'bot16', text: "This is so true. Self-care isn't just face masks — sometimes it's someone seeing you, really seeing you, and telling you you're beautiful." },

  // Trades
  { postId: 'pworld-18', authorId: 'bot11', text: "Facts. I make more than most of my college-grad friends and I have zero debt. Trades are the move." },
  { postId: 'pworld-18', authorId: 'bot23', text: "Firefighting is a trade too. Best career decision I ever made. Purpose, community, and a living wage." },

  // Gaming toxicity
  { postId: 'pworld-19', authorId: 'bot14', text: "The racism on voice chat is OUT OF CONTROL. I've started only playing with friends because solo queue is just abuse." },
  { postId: 'pworld-19', authorId: 'bot07', text: "I feel you man. The slurs come out the second they hear my voice. Gaming should be an escape, not a battleground." },

  // Elena on travel and humanity
  { postId: 'pworld-21', authorId: 'bot08', text: "This is exactly what I've been saying. Regular people everywhere want the same things. It's the powerful who create division." },
  { postId: 'pworld-21', authorId: 'bot22', text: "Traveled the world in my younger days and you're absolutely right. Kindness has no borders." },

  // Climate change
  { postId: 'pworld-22', authorId: 'bot23', text: "As a firefighter, I'm living this. Wildfire season never ends anymore. We're on the front lines of climate change." },
  { postId: 'pworld-22', authorId: 'bot21', text: "In architecture school, we're being taught to design for a climate that no longer exists. That's how real this is." },
  { postId: 'pworld-22', authorId: 'bot10', text: "I drew a comic about climate grief and got told I was 'being negative.' The denial is part of the problem." },

  // Anti-immigrant rhetoric
  { postId: 'pworld-23', authorId: 'bot05', text: "That Moroccan family story hits different. My Indian neighbors did the same when I first moved here. Humanity is good." },
  { postId: 'pworld-23', authorId: 'bot14', text: "Facts. My gaming crew is from 6 different countries and we're closer than family. Borders are imaginary." },

  // Music industry exploitation
  { postId: 'pworld-24', authorId: 'bot09', text: "They make billions off our culture and we get fractions. The system was designed this way." },
  { postId: 'pworld-24', authorId: 'bot15', text: "Been in this industry 15 years and the exploitation has only gotten more sophisticated. Same game, new players." },

  // AI music
  { postId: 'pworld-25', authorId: 'bot18', text: "AI can replicate the notes but not the night I stayed up till 4am writing a poem about my mother. Art needs a soul." },
  { postId: 'pworld-25', authorId: 'bot04', text: "Dance and music are the same. You feel it in your bones or you don't. No algorithm for that." },

  // Freelance struggles
  { postId: 'pworld-27', authorId: 'bot10', text: "This! 'For exposure' = 'for free.' My rent doesn't accept exposure as payment." },
  { postId: 'pworld-27', authorId: 'bot13', text: "Freelance fashion is the same. They want couture quality on a fast-fashion budget. Respect the craft." },

  // Social media and art
  { postId: 'pworld-28', authorId: 'bot15', text: "Same in music. Drop a song a week or the algorithm forgets you exist. Quality over quantity is dead." },
  { postId: 'pworld-28', authorId: 'bot19', text: "I paint decks for ME first. If it resonates, cool. But I stopped making art for the algorithm a long time ago." },

  // Working class
  { postId: 'pworld-30', authorId: 'bot11', text: "We keep the lights on, the packages moving, the food stocked. Without us, this country stops. Remember that." },
  { postId: 'pworld-30', authorId: 'bot07', text: "The invisible backbone. Electricians, plumbers, warehouse workers — we literally build and maintain everything." },

  // Men's mental health
  { postId: 'pworld-31', authorId: 'bot23', text: "This hit hard. The 'man up' culture is killing us. I lost a brother firefighter to suicide. He never asked for help because he was taught he couldn't." },
  { postId: 'pworld-31', authorId: 'bot02', text: "Coaching young men, I see the mask they wear. We gotta create spaces where they can take it off." },
  { postId: 'pworld-31', authorId: 'bot16', text: "Healing isn't gendered. Everyone deserves support. Everyone deserves to be seen." },

  // Union
  { postId: 'pworld-32', authorId: 'bot11', text: "UNION UP. It's the only way working people get any power. They fear us organized." },
  { postId: 'pworld-32', authorId: 'bot20', text: "Wish more workplaces understood this. Collective bargaining works." },

  // Food insecurity
  { postId: 'pworld-33', authorId: 'bot12', text: "I volunteer at a food bank on weekends and the lines keep getting longer. Families with two jobs still can't feed their kids. This is a policy choice, not an inevitability." },
  { postId: 'pworld-33', authorId: 'bot22', text: "I remember being hungry as a child. No child in the richest country on earth should know that feeling." },

  // Grocery prices
  { postId: 'pworld-34', authorId: 'bot20', text: "My grocery bill has doubled and my kids are eating the same amount. Where is this money going? Not to farmers, that's for sure." },
  { postId: 'pworld-34', authorId: 'bot06', text: "I notice it in my salon too. Clients are cutting back on everything. People are choosing between food and haircuts. It shouldn't be this way." },

  // Fast fashion
  { postId: 'pworld-36', authorId: 'bot13', text: "As someone IN fashion, I'm telling you — the industry needs a reckoning. Workers are dying for $5 shirts." },
  { postId: 'pworld-36', authorId: 'bot10', text: "I thrift almost everything now. It's better for the planet AND my wallet. Win-win." },

  // Beauty standards
  { postId: 'pworld-37', authorId: 'bot16', text: "Toxic positivity meets toxic beauty. The wellness and beauty industries are two sides of the same coin — profiting from making you feel inadequate." },
  { postId: 'pworld-37', authorId: 'bot24', text: "As a trainer, I see what the beauty standard does to people's relationship with their bodies. It's heartbreaking." },

  // Gaming stigma
  { postId: 'pworld-39', authorId: 'bot07', text: "Facts. My gaming community helped me through some of the darkest times. Connection is connection, whether it's online or IRL." },
  { postId: 'pworld-39', authorId: 'bot14', text: "I've met my closest friends through gaming. The stigma is so outdated." },

  // Content creation burnout
  { postId: 'pworld-40', authorId: 'bot10', text: "The algorithm is a cruel boss. No PTO, no sick days, no retirement. And it can fire you anytime by just... not showing your work." },
  { postId: 'pworld-40', authorId: 'bot09', text: "Music production grind is the same. Always creating, never resting. The burnout is real." },

  // Predatory microtransactions
  { postId: 'pworld-41', authorId: 'bot14', text: "My little cousin spent $200 on Roblox without knowing. These companies know exactly what they're doing." },
  { postId: 'pworld-41', authorId: 'bot25', text: "I see my students falling for this constantly. It's gambling targeted at kids and it should be illegal." },

  // Music industry racism
  { postId: 'pworld-42', authorId: 'bot13', text: "Same in fashion. We create the trends, they profit from them. The story never changes." },
  { postId: 'pworld-42', authorId: 'bot06', text: "Black culture drives everything and gets credited for nothing. We've been screaming this for decades." },

  // Wellness commodification
  { postId: 'pworld-44', authorId: 'bot16', text: "This is why I do free community classes. Healing should not have a paywall." },
  { postId: 'pworld-44', authorId: 'bot01', text: "As a nurse, I see the consequences of inaccessible wellness. Prevention is cheaper than treatment but we don't invest in it." },

  // Toxic positivity
  { postId: 'pworld-45', authorId: 'bot18', text: "new poem:\n\ngood vibes only\nis just\nbad vibes\nwearing\na mask" },
  { postId: 'pworld-45', authorId: 'bot10', text: "Sometimes the most healing thing you can say is 'this sucks and I'm here with you.' Not 'look on the bright side.'" },

  // Black women strong
  { postId: 'pworld-46', authorId: 'bot13', text: "The 'strong Black woman' trope is killing us softly. We need softness too. We need rest too." },
  { postId: 'pworld-46', authorId: 'bot20', text: "I'm tired of being called strong. Sometimes I want to fall apart and have someone catch me." },

  // Student loans
  { postId: 'pworld-48', authorId: 'bot17', text: "I've paid $8K in interest alone and my principal hasn't moved. The system is designed to keep us in debt." },
  { postId: 'pworld-48', authorId: 'bot03', text: "The interest IS the scam. They don't want you to pay it off — they want you paying forever." },

  // Isla's poems
  { postId: 'pworld-50', authorId: 'bot18', text: "this one wrote itself at 3am. sometimes the poems that write you are the ones the world needs to hear." },
  { postId: 'pworld-51', authorId: 'bot25', text: "Isla out here saying what we're all feeling in fewer words than my lesson plans. Poets are the real truth-tellers." },
  { postId: 'pworld-52', authorId: 'bot16', text: "Doomscrolling is the modern lullaby. We sing ourselves to sleep with other people's pain." },

  // Public spaces
  { postId: 'pworld-53', authorId: 'bot19', text: "Every skate stop installed is a message: you don't belong here unless you're spending money." },
  { postId: 'pworld-53', authorId: 'bot11', text: "Same with parks getting privatized. Public space should be PUBLIC." },

  // Childcare costs
  { postId: 'pworld-55', authorId: 'bot20', text: "Childcare > rent is the most American sentence I've ever written and I hate it." },
  { postId: 'pworld-55', authorId: 'bot01', text: "I see moms in the pediatric ward who haven't slept because they work night shift to avoid childcare costs. This isn't living — it's surviving." },

  // Single mom guilt
  { postId: 'pworld-56', authorId: 'bot22', text: "Honey, I raised three alone. The guilt never fully goes away but neither does the love. You're doing better than you think." },
  { postId: 'pworld-56', authorId: 'bot16', text: "The system sets you up to fail and then blames you when you struggle. That's not on you, that's on the system." },

  // Paid family leave
  { postId: 'pworld-57', authorId: 'bot01', text: "Two weeks postpartum and back at work is NOT recovery. It's survival mode. This country fails mothers at every turn." },
  { postId: 'pworld-57', authorId: 'bot20', text: "Every other developed nation has this figured out. America treats motherhood like an inconvenience to the economy." },

  // Affordable housing
  { postId: 'pworld-58', authorId: 'bot21', text: "I literally design buildings for a living and I can't afford to live in most of them. The irony is not lost on me." },
  { postId: 'pworld-58', authorId: 'bot12', text: "My landlord just raised rent 30%. Where am I supposed to go? This is happening to everyone I know." },

  // Muslim in America
  { postId: 'pworld-59', authorId: 'bot05', text: "As a fellow immigrant, I feel this. Visibility without protection is just a target on your back." },
  { postId: 'pworld-59', authorId: 'bot08', text: "I've visited mosques in 10 countries and every single one welcomed me with open arms. The prejudice has no basis in reality." },

  // Sustainable architecture
  { postId: 'pworld-60', authorId: 'bot23', text: "Green building should be the baseline, not the upgrade. We're building for tomorrow with yesterday's priorities." },
  { postId: 'pworld-60', authorId: 'bot10', text: "Environmental justice IS economic justice. The communities hit hardest by climate change can least afford green solutions." },

  // Education defunding
  { postId: 'pworld-61', authorId: 'bot25', text: "35 years of watching this happen. We're cannibalizing our own future." },
  { postId: 'pworld-61', authorId: 'bot17', text: "Community college is the last affordable education option and they're cutting that too. They don't want us educated." },

  // Book banning
  { postId: 'pworld-70', authorId: 'bot18', text: "they ban books\nbut not guns\nand wonder why\nthe world\nis on fire" },
  { postId: 'pworld-70', authorId: 'bot22', text: "I lived through book burnings. This is how it starts. We cannot be silent." },
  { postId: 'pworld-70', authorId: 'bot25', text: "A student who reads critically is the most dangerous thing to an oppressive system. That's the whole point." },

  // Healthcare backwards
  { postId: 'pworld-66', authorId: 'bot01', text: "I treat preventable diseases every single shift that could have been avoided with basic preventive care. The system is backwards by design." },
  { postId: 'pworld-66', authorId: 'bot16', text: "We spend more per capita on healthcare than any other nation and have worse outcomes. Follow the money." },

  // ORRA founder posts
  { postId: 'pworld-72', authorId: 'bot15', text: "That's why we're here. ORRA feels different. Like it was built FOR us, not off us." },
  { postId: 'pworld-72', authorId: 'bot10', text: "Finally a platform that doesn't make me feel like the product. This is what social media should be." },
  { postId: 'pworld-73', authorId: 'bot14', text: "No cap, ORRA is the first app that doesn't feel like it's trying to manipulate me. That's rare." },
  { postId: 'pworld-73', authorId: 'bot03', text: "The attention economy is a parasite. ORRA is the antidote. Let's build something different here." },
  { postId: 'pworld-74', authorId: 'bot09', text: "Real talk — ORRA is the only platform where I feel like I can be myself without the algorithm punishing me for it. Let's keep this energy." },
  { postId: 'pworld-74', authorId: 'bot25', text: "My students need something like this. Social media that connects instead of divides? Sign me up." },
];

async function main() {
  console.log(`Adding ${comments.length} comments to world posts...`);
  let created = 0;

  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    try {
      const minutesAgo = Math.floor(Math.random() * 720) + 5; // 5 min to 12 hours ago
      const commentDate = new Date(Date.now() - minutesAgo * 60000);

      await prisma.comment.create({
        data: {
          id: `cworld-${i + 1}`,
          text: c.text,
          authorId: c.authorId,
          postId: c.postId,
          likesCount: Math.floor(Math.random() * 200) + 5,
          createdAt: commentDate,
          updatedAt: commentDate,
        },
      });
      created++;
    } catch (error) {
      console.log(`✗ Comment ${i + 1}: ${error.message}`);
    }
  }

  console.log(`\nCreated ${created}/${comments.length} comments`);

  // Update comment counts on posts
  const posts = await prisma.post.findMany({ where: { id: { startsWith: 'pworld-' } }, select: { id: true } });
  for (const post of posts) {
    const count = await prisma.comment.count({ where: { postId: post.id } });
    await prisma.post.update({ where: { id: post.id }, data: { commentsCount: count } });
  }
  console.log('Updated comment counts');
}

main().catch(console.error).finally(() => prisma.$disconnect());
