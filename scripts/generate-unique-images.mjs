import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Image prompts based on post content and author personality
const imagePrompts = {
  // No-image posts
  'p20c': { prompt: 'Single mom accountant working late at desk with calculator and tax documents, warm lighting, realistic photo', filename: 'tax-mom-late-night.jpg' },
  'p25b': { prompt: 'Awkward funny moment waving back at someone who was waving behind you, relatable comedy scene, realistic photo', filename: 'awkward-wave.jpg' },
  'psummer25': { prompt: 'Ice cream truck on a summer street, kids running excitedly, bright sunny day, nostalgic neighborhood scene, realistic photo', filename: 'ice-cream-truck.jpg' },
  'p11b': { prompt: 'Proud husband next to fixed dishwasher in clean kitchen, toolbox nearby, satisfied smile, realistic photo', filename: 'dishwasher-fixed.jpg' },
  'p18a': { prompt: 'Poet writing in coffee-stained journal at a wooden desk, crumpled papers around, moody lighting, realistic photo', filename: 'poet-writing.jpg' },
  'p03c': { prompt: 'AI music generation on laptop screen, futuristic digital interface creating album art, neon glow, realistic photo', filename: 'ai-music-laptop.jpg' },
  'psummer22': { prompt: 'Nurse suffering with summer cold at home, tissues everywhere, miserable but smiling, realistic photo', filename: 'summer-cold-nurse.jpg' },
  'p15c': { prompt: 'Phone screen showing dance competition app ORRA Dance Off, excited person watching, vibrant colors, realistic photo', filename: 'dance-app-screen.jpg' },
  'p14b': { prompt: 'Gamer celebrating Diamond rank in two games, dual monitors showing victory screens, LED lighting, realistic photo', filename: 'diamond-dual-games.jpg' },
  'psummer07': { prompt: 'Summer night stoop hangout with portable speaker playing music, warm evening atmosphere, urban neighborhood, realistic photo', filename: 'stoop-speaker-night.jpg' },
  'p18d': { prompt: 'Summer poem writing, fan blowing papers on desk, handwritten verses, warm lazy afternoon, realistic photo', filename: 'summer-poem-fan.jpg' },
  'psummer32': { prompt: 'Sudden summer thunderstorm, dramatic lightning over city skyline, rain pouring down, dark clouds, realistic photo', filename: 'summer-thunderstorm.jpg' },
  'psummer31': { prompt: 'Peaceful morning sleeping in, no alarm clock, sun through curtains, cozy bedroom summer vibes, realistic photo', filename: 'summer-no-alarm.jpg' },
  'p0founder': { prompt: 'Social media app launch celebration, futuristic ORRA logo on screen, confetti, excited team, realistic photo', filename: 'orra-launch.jpg' },
  'p25d': { prompt: 'Relief when AC turns on in hot room, person standing in front of AC vent with arms spread, blissful expression, realistic photo', filename: 'ac-relief.jpg' },
  'p01f': { prompt: 'Pediatric nurse bringing popsicles to children in hospital ward, kids smiling happily, heartwarming scene, realistic photo', filename: 'popsicles-ward.jpg' },
  'p04c': { prompt: 'Dance choreography notes and sketches on paper, movement diagrams, creative process, studio setting, realistic photo', filename: 'choreography-notes.jpg' },
  'psummer17': { prompt: 'Young person working summer warehouse job, boxes and pallets, determined expression, realistic photo', filename: 'summer-warehouse.jpg' },
  'p07a': { prompt: 'Frustrated gamer staring at disconnected WiFi router, controller dropped, mid-game disconnect, realistic photo', filename: 'wifi-died-midgame.jpg' },
  'psummer11': { prompt: 'Broken AC unit in hot apartment, person fanning themselves miserably, melting ice cubes, realistic photo', filename: 'broken-ac-summer.jpg' },
  'p25c': { prompt: 'Student telling teacher they matter, emotional classroom moment, teacher touched, heartwarming, realistic photo', filename: 'student-teacher-moment.jpg' },
  'psummer39': { prompt: 'Summer heat wave survival, AC on full blast, curtains drawn, person bundled in blanket near AC, realistic photo', filename: 'heat-wave-survival.jpg' },
  'psummer28': { prompt: 'Late night Waffle House meal after skatepark, scattered waffles and hashbrowns, neon sign glow, realistic photo', filename: 'waffle-house-late.jpg' },
  'psummer12': { prompt: 'Sleeping with fan on full blast, one leg out of blanket, classic summer night pose, cozy bedroom, realistic photo', filename: 'fan-one-leg-out.jpg' },
  'p22a': { prompt: 'Grandmother learning to use social media app on phone, grandkids teaching her, warm family moment, realistic photo', filename: 'grandma-learning-phone.jpg' },
  'psummer20': { prompt: 'Friend group at summer cookout, one person bringing all the energy and laughs, BBQ smoke, fun vibes, realistic photo', filename: 'cookout-energy-friend.jpg' },

  // Duplicate image posts - Thursday posts that need unique images
  'pthu-trevon1': { prompt: 'Student loan debt freedom celebration, person holding ZERO balance statement, confetti falling, joyful moment, realistic photo', filename: 'student-loan-zero.jpg' },
  'pthu-founder1': { prompt: 'ORRA social media app milestone celebration on phone screen, community growth chart, inspiring tech workspace, realistic photo', filename: 'orra-thursday-motivation.jpg' },
  'pthu-elena1': { prompt: 'Barcelona narrow street golden hour, warm light on brick walls, traveler exploring, European charm, realistic photo', filename: 'barcelona-golden.jpg' },
  'pthu-marcus1': { prompt: 'Dance student nailing a difficult sequence, mid-air jump, studio mirrors reflecting victory, realistic photo', filename: 'dance-victory-jump.jpg' },
  'pthu-rosa1': { prompt: 'Retired teacher reading heartfelt email from former student, tears of joy at kitchen table, realistic photo', filename: 'teacher-email-tears.jpg' },
  'pthu-bri1': { prompt: 'Single mom holding handmade card from child that says you are the strongest, emotional tender moment, realistic photo', filename: 'mom-strongest-card.jpg' },
  'pthu-dre1': { prompt: 'Open mic night performer surprising crowd, spotlight on stage, audience amazed, intimate venue, realistic photo', filename: 'open-mic-surprise.jpg' },
  'pthu-maya1': { prompt: 'Meal prep containers organized in fridge, healthy colorful food, Thursday cooking session, realistic photo', filename: 'meal-prep-thursday.jpg' },
  'pthu-tasha1': { prompt: 'Hair stylist fitting wig for chemo patient with care and compassion, salon mirror, emotional moment, realistic photo', filename: 'salon-wig-fitting.jpg' },
  'pthu-amira1': { prompt: 'Night shift nurse end of 12 hours, tired but fulfilled, hospital hallway, stethoscope, realistic photo', filename: 'nurse-12hr-done.jpg' },
  'pthu-sofia1': { prompt: 'Fashion pop-up shop collaboration announcement, stylish display, excited designer, SoHo vibe, realistic photo', filename: 'popup-collab-announce.jpg' },
  'pthu-ethan1': { prompt: 'Students making memes about their teacher, classroom laughter, funny board, relatable school moment, realistic photo', filename: 'student-memes.jpg' },
  'pthu-liam1': { prompt: 'Firefighter returning from call, station crew cheering welcome back, fire truck, brotherhood, realistic photo', filename: 'firefighter-welcome-back.jpg' },
  'pthu-kai1': { prompt: 'Hand-painted skateboard deck artwork, cyberpunk design, colorful street art style, close-up detail, realistic photo', filename: 'skate-deck-cyberpunk.jpg' },
  'pthu-nia1': { prompt: 'Morning breathwork meditation session, candles lit, peaceful atmosphere, wellness practice, realistic photo', filename: 'morning-breathwork.jpg' },
  'pthu-zara1': { prompt: 'Bold street fashion outfit, confidence and attitude, urban backdrop, editorial style, realistic photo', filename: 'street-style-attitude.jpg' },
  'pthu-donte1': { prompt: 'Music producer creating 6 beats in one night, studio screens, creativity flowing, multiple tracks, realistic photo', filename: 'six-beats-night.jpg' },
  'pthu-devin1': { prompt: 'Youth football coaching at 6am, kids running drills on field, sunrise, dedication, realistic photo', filename: 'coaching-6am.jpg' },
  'pthu-raj1': { prompt: 'Smart contract deployment at 2am, laptop screen with code, then celebrating with butter chicken, realistic photo', filename: 'smart-contract-2am.jpg' },
  'pthu-jade1': { prompt: 'NOLA Strong early morning workout crew, New Orleans backdrop, no excuses energy, realistic photo', filename: 'nola-morning-crew.jpg' },
  'pthu-isla1': { prompt: 'Poet writing haiku in coffee shop, steam rising from cup, ink pen on paper, quiet focus, realistic photo', filename: 'haiku-coffee-shop.jpg' },
  'pthu-jaylen1': { prompt: 'Gamer rage at WiFi disconnect during ranked match, controller mid-air, dramatic lighting, realistic photo', filename: 'wifi-rage-ranked.jpg' },
  'pthu-luna1': { prompt: 'Artist breaking through creative block, colorful paint on canvas, transformation from blank to vibrant, realistic photo', filename: 'art-breakthrough.jpg' },
  'pthu-chris1': { prompt: 'Repair job before and after, dishwasher fixed with just a reset button, funny handyman moment, realistic photo', filename: 'repair-reset-button.jpg' },
  'pthu-omar1': { prompt: '3D printer creating architectural scale model, layers building up, futuristic design process, realistic photo', filename: '3d-print-arch-model.jpg' },
  'pthu-terry1': { prompt: 'Mechanic reassembling truck engine like a puzzle, grease on hands, satisfied focus, garage, realistic photo', filename: 'engine-puzzle.jpg' },
  'pthu-stock1': { prompt: 'Met Gala inspired high fashion look on model, glamorous red carpet moment, couture detail, realistic photo', filename: 'met-gala-look.jpg' },
  'pthu-stock2': { prompt: 'Latte art rosetta being poured, barista focus, creamy milk patterns, coffee shop aesthetic, realistic photo', filename: 'latte-rosetta.jpg' },
  'pthu-stock3': { prompt: 'Gaming setup with new LED strips, purple and blue glow, dual monitors, immersive battlestation, realistic photo', filename: 'led-gaming-setup.jpg' },
  'pthu-stock4': { prompt: 'Sunrise yoga session, peaceful meditation pose, morning light through window, wellness, realistic photo', filename: 'sunrise-yoga.jpg' },
  'pthu-stock5': { prompt: 'City at night from a traveler perspective, lit windows and streets, sense of adventure, realistic photo', filename: 'city-night-traveler.jpg' },
  'pthu-stock6': { prompt: 'Blockchain smart contract code on screen, deploy button being clicked, tech milestone, realistic photo', filename: 'blockchain-deploy.jpg' },
  'pthu-stock7': { prompt: 'Thriving succulent garden collection, each plant unique, organized display, plant parent, realistic photo', filename: 'succulent-garden.jpg' },
  'pthu-stock8': { prompt: 'Vinyl record crate at flea market, flipping through albums, crate digging, nostalgic music, realistic photo', filename: 'vinyl-crate-dig.jpg' },
  'pthu-stock9': { prompt: 'Toddler arranging dinosaur nuggets on plate by size, cute childhood moment, kitchen, realistic photo', filename: 'dino-nuggets-sorting.jpg' },
  'pthu-stock10': { prompt: 'Dog carrying oversized stick on hiking trail, happy golden retriever, mountain path, realistic photo', filename: 'dog-big-stick.jpg' },
  'pthu-stock11': { prompt: 'Fire station quiet day, firefighter reading in common area, fire truck in background, calm moment, realistic photo', filename: 'fire-station-quiet.jpg' },
  'pthu-stock12': { prompt: 'Gym session complete, person wiping sweat, water bottle, determination, fitness journey, realistic photo', filename: 'gym-sweat-done.jpg' },
  'pthu-stock13': { prompt: 'Street art mural in Bywater neighborhood New Orleans, vibrant colors, cultural expression, realistic photo', filename: 'bywater-mural.jpg' },
  'pthu-stock14': { prompt: 'Dance studio at sunset, golden light through tall windows, wooden floor, empty but magical, realistic photo', filename: 'studio-sunset-light.jpg' },
  'pthu-stock15': { prompt: 'Architecture internship acceptance letter, student celebrating, drafting tools on desk, realistic photo', filename: 'architecture-acceptance.jpg' },
  'pthu-trevon2': { prompt: 'Calculus textbook open with colorful notes, study grind, highlighter marks, determination, realistic photo', filename: 'calculus-grind.jpg' },
  'pthu-founder2': { prompt: 'Late night coding session for ORRA app, multiple screens, coffee cups, tech founder working, realistic photo', filename: 'late-night-coding.jpg' },
  'pthu-elena2': { prompt: 'Underground music venue in Lisbon, intimate crowd, dim red lighting, live performance, realistic photo', filename: 'lisbon-underground-music.jpg' },
  'pthu-marcus2': { prompt: 'Electric dance rehearsal, dancers in motion, practice room energy, movement and passion, realistic photo', filename: 'dance-rehearsal-energy.jpg' },
  'pthu-rosa2': { prompt: 'Community garden in full bloom, tomatoes and sunflowers, hands in soil, gardening joy, realistic photo', filename: 'garden-bloom-rosa.jpg' },
  'pthu-bri2': { prompt: 'Tax refund celebration, mom treating kids, shopping bags, financial relief joy, realistic photo', filename: 'tax-refund-joy.jpg' },
  'pthu-dre2': { prompt: 'Late night music studio session, beats on screen, city sleeping outside window, creative flow, realistic photo', filename: 'late-night-beats.jpg' },
  'pthu-maya2': { prompt: 'Food truck Friday prep, cooking in food truck, steam and flavors, street food energy, realistic photo', filename: 'food-truck-prep.jpg' },
  'pthu-tasha2': { prompt: 'Signing lease for own salon, woman at desk with pen, business owner moment, realistic photo', filename: 'salon-lease-sign.jpg' },
  'pthu-amira2': { prompt: 'Quiet 3AM hospital ward, nurse sitting at station, peaceful moment, dim hallway, realistic photo', filename: 'nurse-3am-quiet.jpg' },
  'pthu-sofia2': { prompt: 'Thursday brunch creative meeting, coffee and pastries, fashion mood board, collaborative energy, realistic photo', filename: 'brunch-creative.jpg' },
  'pthu-ethan2': { prompt: 'Professor giving encouraging words to student, office hours, academic mentorship, hopeful moment, realistic photo', filename: 'professor-encourage.jpg' },
  'pthu-liam2': { prompt: 'Firefighters cooking competition at station, kitchen chaos, multiple dishes, brotherhood fun, realistic photo', filename: 'fire-cooking-comp.jpg' },
  'pthu-kai2': { prompt: 'Skatepark tre flip landing, action shot, wheels on concrete, victory stance, realistic photo', filename: 'tre-flip-landed.jpg' },
  'pthu-nia2': { prompt: 'Rest and self-care reminder, cozy blanket, herbal tea, peaceful self-care moment, wellness, realistic photo', filename: 'self-care-rest-nia.jpg' },
  'pthu-zara1-alt': { prompt: 'Bold street fashion outfit, confidence and attitude, urban backdrop, editorial style, realistic photo', filename: 'zara-street-bold.jpg' },
  'pthu-donte2': { prompt: 'First music placement celebration, producer getting the call, studio excitement, milestone moment, realistic photo', filename: 'first-placement-call.jpg' },
  'pthu-devin2': { prompt: 'Coach having heart-to-heart with player on sideline, mentorship moment, football field, realistic photo', filename: 'coach-heart-talk.jpg' },
  'pthu-raj2': { prompt: 'Hand-pulled noodle making from scratch, dough stretching, flour dusted hands, cooking mastery, realistic photo', filename: 'noodle-pulling.jpg' },
  'pthu-jade2': { prompt: '10K trail run finish line, exhausted but triumphant, scenic trail view, running achievement, realistic photo', filename: 'trail-10k-finish.jpg' },
  'pthu-isla2': { prompt: 'Open mic poetry reading, nervous poet at microphone, supportive crowd, brave moment, realistic photo', filename: 'poetry-open-mic.jpg' },
  'pthu-jaylen2': { prompt: 'Madden tournament at community center, gamers competing, crowd watching, competitive energy, realistic photo', filename: 'madden-tournament.jpg' },
  'pthu-luna2': { prompt: 'Digital art blending Japanese and modern styles, Wacom tablet, colorful screen, creative process, realistic photo', filename: 'digital-japanese-art.jpg' },
  'pthu-chris2': { prompt: 'Diamond rank achievement screen, gamer celebration, ranked victory, competitive gaming milestone, realistic photo', filename: 'diamond-rank-screen.jpg' },
  'pthu-omar2': { prompt: 'Home renovation reveal, before and after transformation, stunning interior, remodeling success, realistic photo', filename: 'reno-reveal.jpg' },
};

// Map post IDs that need fixing (some Thursday posts share the same prompt)
const postIdToKey = {
  'pthu-zara1': 'pthu-zara1', // will use fashion-streetwear prompt but different filename
};

async function generateImage(prompt, outputPath) {
  try {
    const cmd = `z-ai-generate -p "${prompt.replace(/"/g, '\\"')}" -o "${outputPath}" -s 1024x1024`;
    execSync(cmd, { timeout: 60000 });
    return true;
  } catch (error) {
    console.error(`  Failed to generate: ${error.message.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  const postsData = JSON.parse(fs.readFileSync('/home/z/my-project/posts-needing-images-full.json', 'utf-8'));
  
  console.log(`Processing ${postsData.length} posts needing unique images...`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < postsData.length; i++) {
    const post = postsData[i];
    const key = post.id;
    const promptData = imagePrompts[key];
    
    if (!promptData) {
      console.log(`[${i+1}/${postsData.length}] SKIP ${key} - no prompt defined`);
      failed++;
      continue;
    }
    
    const outputPath = `/home/z/my-project/public/images/posts/${promptData.filename}`;
    
    // Skip if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`[${i+1}/${postsData.length}] EXISTS ${key} -> ${promptData.filename}`);
      success++;
      continue;
    }
    
    console.log(`[${i+1}/${postsData.length}] Generating ${key}: ${promptData.filename}`);
    console.log(`  Prompt: ${promptData.prompt.substring(0, 80)}...`);
    
    const ok = await generateImage(promptData.prompt, outputPath);
    if (ok) {
      console.log(`  ✓ Generated successfully`);
      success++;
    } else {
      console.log(`  ✗ Generation failed`);
      failed++;
    }
  }
  
  console.log(`\n=== Generation Complete ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${postsData.length}`);
}

main().catch(console.error);
