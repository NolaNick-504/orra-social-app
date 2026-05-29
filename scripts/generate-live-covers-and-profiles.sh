#!/bin/bash
# Generate personalized live stream thumbnails + profile cover images for ORRA
# Each image is tailored to match the person's personality and stream category

set -e

LIVE_DIR="/home/z/my-project/public/images/live-thumbnails"
COVER_DIR="/home/z/my-project/public/images/profile-covers"

# ─── LIVE STREAM THUMBNAILS (12 streams) ────────────────────────────────
# These are personalized thumbnails that match each streamer's style + category

echo "=== Generating 12 Live Stream Thumbnails ==="

# 1. Luna Sky → Art stream - "Painting session pt.2"
echo "[1/12] Luna Sky - Art stream..."
z-ai-generate -p "A cozy art studio livestream thumbnail, watercolor paintings on an easel, art supplies on wooden desk, fairy lights, dreamy aesthetic with soft purple and blue ambient lighting, warm inviting atmosphere, professional livestream overlay style, 16:9 widescreen format" -o "$LIVE_DIR/luna-art.jpg" -s 1344x768 &

# 2. Kai Storm → Gaming stream - "Ranked grind"
echo "[2/12] Kai Storm - Gaming stream..."
z-ai-generate -p "An intense competitive gaming livestream thumbnail, dual monitor setup with FPS game, RGB neon lighting in electric blue and purple, gaming headset on desk, mechanical keyboard, dark room with colorful LED strips, action-packed atmosphere, 16:9 widescreen" -o "$LIVE_DIR/kai-gaming.jpg" -s 1344x768 &

# 3. Nova Blaze → Trending stream - "Just chatting"
echo "[3/12] Nova Blaze - Trending/Chatting stream..."
z-ai-generate -p "A trendy just chatting livestream thumbnail, stylish content creator desk setup, ring light, modern minimalist room, phone on stand, urban loft apartment background, neon accent lights in warm orange and cool blue, social media aesthetic, 16:9 widescreen" -o "$LIVE_DIR/nova-trending.jpg" -s 1344x768 &

# 4. Zara Miles → Fashion stream - "OOTD try-on"
echo "[4/12] Zara Miles - Fashion stream..."
z-ai-generate -p "A fashion and style livestream thumbnail, elegant clothing rack with designer pieces, full-length mirror, trendy closet room, soft pink and warm golden lighting, luxury fashion aesthetic, handbags and shoes visible, chic glamorous atmosphere, 16:9 widescreen" -o "$LIVE_DIR/zara-fashion.jpg" -s 1344x768 &

# 5. Jay Parker → Gaming stream - "COD marathon"
echo "[5/12] Jay Parker - COD Gaming stream..."
z-ai-generate -p "An action-packed Call of Duty gaming marathon livestream thumbnail, large gaming monitor with FPS gameplay, gaming chair, snacks and energy drinks on desk, green and red LED lighting, intense gaming battle atmosphere, dark room, 16:9 widescreen" -o "$LIVE_DIR/jay-gaming.jpg" -s 1344x768 &

# 6. Maya Chen → Cooking/Food stream
echo "[6/12] Maya Chen - Cooking stream..."
z-ai-generate -p "A home kitchen cooking livestream thumbnail, overhead view of fresh ingredients on marble countertop, pots and pans, herbs and spices, warm kitchen lighting, cozy home chef aesthetic, delicious food being prepared, inviting atmosphere, 16:9 widescreen" -o "$LIVE_DIR/maya-cooking.jpg" -s 1344x768 &

# 7. Dre Williams → Music stream - "Beat making"
echo "[7/12] Dre Williams - Beat making stream..."
z-ai-generate -p "A music producer beat making livestream thumbnail, home studio with MIDI keyboard and studio monitors, music production software on screen, warm amber and deep blue lighting, professional headphones, drum machine, creative music atmosphere, 16:9 widescreen" -o "$LIVE_DIR/dre-music.jpg" -s 1344x768 &

# 8. Sarah Kim → Music stream - "Late night vibes"
echo "[8/12] Sarah Kim - Late night music stream..."
z-ai-generate -p "A chill late night music vibes livestream thumbnail, lo-fi aesthetic setup with vinyl records, warm lamp light, cozy bedroom with string lights, soft purple ambient glow, relaxed dreamy atmosphere, headphones and laptop, 16:9 widescreen" -o "$LIVE_DIR/sarah-music.jpg" -s 1344x768 &

# 9. Marcus Rivera → Dance stream
echo "[9/12] Marcus Rivera - Dance stream..."
z-ai-generate -p "A dance challenge livestream thumbnail from an urban dance studio, large mirror wall, wooden dance floor, LED strip lights in red and blue, energetic movement atmosphere, boombox, sneakers, dynamic and fun vibe, 16:9 widescreen" -o "$LIVE_DIR/marcus-dance.jpg" -s 1344x768 &

# 10. Elena Rodriguez → Lifestyle/Yoga stream
echo "[10/12] Elena Rodriguez - Yoga stream..."
z-ai-generate -p "A morning yoga livestream thumbnail, serene living room with yoga mat, green plants, soft morning sunlight streaming through large windows, peaceful minimalist space, bamboo and natural wood elements, calming wellness aesthetic, 16:9 widescreen" -o "$LIVE_DIR/elena-yoga.jpg" -s 1344x768 &

# 11. Cyber Drifter → Tech stream - "Building a PC"
echo "[11/12] Cyber Drifter - Tech/PC build stream..."
z-ai-generate -p "A tech PC building livestream thumbnail, computer parts spread on workbench, motherboard GPU and RAM visible, RGB components glowing, dark workshop with blue and cyan LED lighting, cyberpunk aesthetic, circuit board patterns, 16:9 widescreen" -o "$LIVE_DIR/cyber-tech.jpg" -s 1344x768 &

# 12. Music Central → Music stream - "Live performance"
echo "[12/12] Music Central - Live performance stream..."
z-ai-generate -p "A live music performance livestream thumbnail, microphone on stand, acoustic guitar nearby, small intimate stage with colored spotlights in red and amber, venue atmosphere, sound equipment, warm musical ambiance, 16:9 widescreen" -o "$LIVE_DIR/music-live.jpg" -s 1344x768 &

wait
echo "=== Live stream thumbnails complete ==="

# ─── PROFILE COVER IMAGES (16 users) ─────────────────────────────────────
echo ""
echo "=== Generating 16 Profile Cover Images ==="

# 1. Nick Joseph - CEO/Founder
echo "[1/16] Nick Joseph - CEO/Founder cover..."
z-ai-generate -p "Sleek modern tech startup office with glass walls and city skyline view, dark blue and gold color scheme, professional yet innovative atmosphere, abstract digital patterns, luxury entrepreneurship aesthetic, panoramic banner format" -o "$COVER_DIR/nick-ceo.jpg" -s 1440x720 &

# 2. Jessica Art - Art/Creative
echo "[2/16] Jessica Art - Art cover..."
z-ai-generate -p "Vibrant artist workspace with colorful paint splashes and canvases, warm creative studio lighting, rainbow gradient aesthetic, abstract art on walls, paintbrushes and palette, artistic and expressive atmosphere, panoramic banner format" -o "$COVER_DIR/jessica-art.jpg" -s 1440x720 &

# 3. David Chen - Sports/Basketball
echo "[3/16] David Chen - Sports cover..."
z-ai-generate -p "Basketball court at golden hour sunset, urban outdoor court with chain net hoop, warm orange and brown tones, athletic energy, dramatic sky, basketball on court surface, sports motivation aesthetic, panoramic banner format" -o "$COVER_DIR/david-sports.jpg" -s 1440x720 &

# 4. Sarah Kim - Music/Chill
echo "[4/16] Sarah Kim - Music/Chill cover..."
z-ai-generate -p "Lo-fi chill music aesthetic, vinyl records and turntable, warm lamp lighting, cozy Korean-inspired room with plush pillows, soft purple and amber tones, music notes, relaxed dreamy atmosphere, panoramic banner format" -o "$COVER_DIR/sarah-music.jpg" -s 1440x720 &

# 5. Marcus Rivera - Dance
echo "[5/16] Marcus Rivera - Dance cover..."
z-ai-generate -p "Dynamic dance studio with dramatic stage lighting, red and blue spotlights creating shadows, wooden floor and mirror wall, urban choreography energy, movement and rhythm, passionate artistic atmosphere, panoramic banner format" -o "$COVER_DIR/marcus-dance.jpg" -s 1440x720 &

# 6. Elena Rodriguez - Lifestyle/Wellness
echo "[6/16] Elena Rodriguez - Wellness cover..."
z-ai-generate -p "Serene wellness and yoga space with natural wood and lush green plants, soft morning light, earth tones, peaceful meditation cushions, zen garden elements, calming nature aesthetic, panoramic banner format" -o "$COVER_DIR/elena-wellness.jpg" -s 1440x720 &

# 7. Tech Daily - Tech
echo "[7/16] Tech Daily - Tech cover..."
z-ai-generate -p "Futuristic tech workspace with multiple monitors and holographic displays, circuit board patterns, blue and cyan LED lighting, digital innovation, server racks, cutting edge technology aesthetic, panoramic banner format" -o "$COVER_DIR/tech-daily.jpg" -s 1440x720 &

# 8. Wellness Guru - Wellness/Spa
echo "[8/16] Wellness Guru - Spa/Wellness cover..."
z-ai-generate -p "Zen wellness spa space with amethyst crystals and candles, soft pink and gold lighting, lavender and eucalyptus, calming atmosphere, meditation bowl, spiritual healing aesthetic, panoramic banner format" -o "$COVER_DIR/wellness-guru.jpg" -s 1440x720 &

# 9. Cyber Drifter - Cyberpunk
echo "[9/16] Cyber Drifter - Cyberpunk cover..."
z-ai-generate -p "Cyberpunk neon cityscape at night, rain-slicked streets reflecting neon pink and blue lights, futuristic urban skyline, digital grid patterns, dark moody atmosphere with vivid neon accents, panoramic banner format" -o "$COVER_DIR/cyber-drifter.jpg" -s 1440x720 &

# 10. Luna Sky - Art/Illustration/Dreamy
echo "[10/16] Luna Sky - Dreamy/Art cover..."
z-ai-generate -p "Dreamy starry night sky with aurora borealis, moon and stars, soft purple and blue cosmic clouds, ethereal otherworldly atmosphere, magical constellation patterns, celestial beauty, panoramic banner format" -o "$COVER_DIR/luna-sky.jpg" -s 1440x720 &

# 11. Kai Storm - Skater/Chaos
echo "[11/16] Kai Storm - Skater/Urban cover..."
z-ai-generate -p "Urban skatepark at dusk with graffiti art on concrete walls, skate ramps, orange sunset sky, rebellious youthful energy, worn skateboard, street culture aesthetic, panoramic banner format" -o "$COVER_DIR/kai-storm.jpg" -s 1440x720 &

# 12. Nova Blaze - Fire/Energetic
echo "[12/16] Nova Blaze - Fire/Energetic cover..."
z-ai-generate -p "Dramatic fiery sunset with bold red and orange clouds, volcanic energy, powerful intense atmosphere, blazing fire and smoke, dramatic lighting, bold and fearless aesthetic, panoramic banner format" -o "$COVER_DIR/nova-blaze.jpg" -s 1440x720 &

# 13. Zara Miles - Fashion/Lifestyle
echo "[13/16] Zara Miles - Fashion cover..."
z-ai-generate -p "Fashion magazine editorial aesthetic, elegant pink and gold color palette, designer items and luxury accessories, glamorous closet with chandelier, chic and trendy fashion atmosphere, panoramic banner format" -o "$COVER_DIR/zara-fashion.jpg" -s 1440x720 &

# 14. Jay Parker - Gaming
echo "[14/16] Jay Parker - Gaming cover..."
z-ai-generate -p "Epic gaming battle station with RGB lighting in rainbow colors, multiple curved screens, gaming peripherals, dark room with colorful neon reflections, energy drinks, gaming chair, immersive gaming aesthetic, panoramic banner format" -o "$COVER_DIR/jay-gaming.jpg" -s 1440x720 &

# 15. Maya Chen - Food/Cooking
echo "[15/16] Maya Chen - Food/Cooking cover..."
z-ai-generate -p "Beautiful kitchen scene with fresh ingredients artfully arranged, warm golden lighting, culinary aesthetic, herbs and spices, wooden cutting board, home cooking warmth, inviting delicious atmosphere, panoramic banner format" -o "$COVER_DIR/maya-cooking.jpg" -s 1440x720 &

# 16. Dre Williams - Music/DJ
echo "[16/16] Dre Williams - DJ/Music cover..."
z-ai-generate -p "Music recording studio interior with mixing console and studio monitors, red and blue mood lighting, professional audio equipment, turntables and headphones, creative music production atmosphere, panoramic banner format" -o "$COVER_DIR/dre-music.jpg" -s 1440x720 &

wait
echo "=== Profile cover images complete ==="

echo ""
echo "=== All images generated! ==="
ls -la "$LIVE_DIR"
echo ""
ls -la "$COVER_DIR"
