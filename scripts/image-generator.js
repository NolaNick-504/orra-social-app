const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Color palettes for different vibes/characters
const palettes = {
  // Warm, celebratory (milestones, achievements)
  celebration: [
    ['#FF6B6B', '#FFC371', '#FFE66D'],
    ['#F7971E', '#FFD200', '#FF6B6B'],
    ['#FC5C7D', '#6A82FB', '#FFC371'],
    ['#FF512F', '#F09819', '#FFE66D'],
  ],
  // Cool, calm (meditation, self-care, poetry)
  calm: [
    ['#667EEA', '#764BA2', '#A8EDEA'],
    ['#6B73FF', '#8DECB9', '#C2E9FB'],
    ['#8EC5FC', '#E0C3FC', '#B4ECFB'],
    ['#5F72BD', '#9B23EA', '#C2E9FB'],
  ],
  // Energy, fitness, sports
  energy: [
    ['#FF416C', '#FF4B2B', '#FFC371'],
    ['#F12711', '#F5AF19', '#FFE66D'],
    ['#ED213A', '#93291E', '#FFC371'],
    ['#FF512F', '#DD2476', '#FFE66D'],
  ],
  // Creative, artistic, music
  creative: [
    ['#DA4453', '#89216B', '#FFC371'],
    ['#8E2DE2', '#4A00E0', '#FF6FD8'],
    ['#FC466B', '#3F5EFB', '#FFC371'],
    ['#A770EF', '#CF8BF3', '#FDB99B'],
  ],
  // Tech, digital, gaming
  tech: [
    ['#00D2FF', '#3A7BD5', '#A8EDEA'],
    ['#7F00FF', '#E100FF', '#00D2FF'],
    ['#00C9FF', '#92FE9D', '#3A7BD5'],
    ['#6A11CB', '#2575FC', '#00D2FF'],
  ],
  // Food, cooking, home
  home: [
    ['#F7971E', '#FFD200', '#FFE66D'],
    ['#FFE259', '#FFA751', '#FFC371'],
    ['#F2C94C', '#F2994A', '#FFE66D'],
    ['#FAD961', '#F76B1C', '#FFE66D'],
  ],
  // Travel, adventure
  travel: [
    ['#2193B0', '#6DD5ED', '#FFC371'],
    ['#1A2980', '#26D0CE', '#A8EDEA'],
    ['#348F50', '#56B4D3', '#FFC371'],
    ['#1D976C', '#93F9B9', '#A8EDEA'],
  ],
  // Fashion, style
  fashion: [
    ['#E44D26', '#F16529', '#FBB03B'],
    ['#C33764', '#1D2671', '#FBB03B'],
    ['#834D9B', '#D04ED6', '#FBB03B'],
    ['#FF6B6B', '#556270', '#FBB03B'],
  ],
  // Nature, garden, outdoors
  nature: [
    ['#134E5E', '#71B280', '#FFE66D'],
    ['#56AB2F', '#A8E063', '#FFC371'],
    ['#11998E', '#38EF7D', '#A8EDEA'],
    ['#0B8793', '#360033', '#71B280'],
  ],
  // Summer, fun
  summer: [
    ['#FF512F', '#F09819', '#FFE66D'],
    ['#FDC830', '#F37335', '#FFE66D'],
    ['#F7971E', '#FFD200', '#FFC371'],
    ['#C6FFDD', '#FBD786', '#F7797D'],
  ],
};

// Emoji/icon overlays for different categories
const categoryEmojis = {
  celebration: '🎉',
  calm: '🧘',
  energy: '💪',
  creative: '🎨',
  tech: '🎮',
  home: '🏠',
  travel: '✈️',
  fashion: '👗',
  nature: '🌿',
  summer: '☀️',
};

function getCategoryForPost(postId, text, authorName) {
  const lower = text.toLowerCase();
  const id = postId.toLowerCase();
  
  if (id.includes('summer') || lower.includes('summer') || lower.includes('heat') || lower.includes('beach') || lower.includes('pool') || lower.includes('sprinkler') || lower.includes('roadtrip') || lower.includes('barbecue') || lower.includes('crawfish') || lower.includes('festival') || lower.includes('firework') || lower.includes('watermelon') || lower.includes('porch')) return 'summer';
  if (lower.includes('meditat') || lower.includes('breathwork') || lower.includes('self-care') || lower.includes('rest') || lower.includes('yoga') || lower.includes('poem') || lower.includes('haiku') || lower.includes('quiet') || lower.includes('peaceful')) return 'calm';
  if (lower.includes('gym') || lower.includes('workout') || lower.includes('running') || lower.includes('trail') || lower.includes('coach') || lower.includes('basketball') || lower.includes('nola strong') || lower.includes('10k') || lower.includes('football')) return 'energy';
  if (lower.includes('game') || lower.includes('gaming') || lower.includes('madden') || lower.includes('diamond') || lower.includes('rank') || lower.includes('wifi') || lower.includes('code') || lower.includes('smart contract') || lower.includes('blockchain') || lower.includes('app') || lower.includes('3d print') || lower.includes('ai ')) return 'tech';
  if (lower.includes('art') || lower.includes('paint') || lower.includes('canvas') || lower.includes('studio') || lower.includes('beat') || lower.includes('music') || lower.includes('producer') || lower.includes('open mic') || lower.includes('dance') || lower.includes('choreograph') || lower.includes('vinyl') || lower.includes('poet') || lower.includes('digital art') || lower.includes('street art') || lower.includes('skate')) return 'creative';
  if (lower.includes('cook') || lower.includes('food') || lower.includes('meal') || lower.includes('recipe') || lower.includes('dishwasher') || lower.includes('repair') || lower.includes('renovat') || lower.includes('engine') || lower.includes('truck') || lower.includes('waffle') || lower.includes('noodle') || lower.includes('ramen') || lower.includes('brunch') || lower.includes('latte') || lower.includes('coffee')) return 'home';
  if (lower.includes('barcelona') || lower.includes('lisbon') || lower.includes('travel') || lower.includes('city night') || lower.includes('backpack') || lower.includes('flight') || lower.includes('road')) return 'travel';
  if (lower.includes('fashion') || lower.includes('style') || lower.includes('outfit') || lower.includes('met gala') || lower.includes('streetwear') || lower.includes('pop-up') || lower.includes('salon') || lower.includes('hair') || lower.includes('wig')) return 'fashion';
  if (lower.includes('garden') || lower.includes('plant') || lower.includes('succulent') || lower.includes('dog') || lower.includes('hike') || lower.includes('mountain') || lower.includes('lake') || lower.includes('outdoor')) return 'nature';
  if (lower.includes('celebrat') || lower.includes('paid off') || lower.includes('loan') || lower.includes('milestone') || lower.includes('acceptance') || lower.includes('placement') || lower.includes('diamond') || lower.includes('achieve') || lower.includes('signing') || lower.includes('internship') || lower.includes('orra') || lower.includes('welcome') || lower.includes('launch')) return 'celebration';
  
  // Default by author
  if (authorName?.includes('Elena') || authorName?.includes('Rosa')) return 'travel';
  if (authorName?.includes('Amira') || authorName?.includes('Nia')) return 'calm';
  if (authorName?.includes('Devin') || authorName?.includes('Jade')) return 'energy';
  if (authorName?.includes('Luna') || authorName?.includes('Donte') || authorName?.includes('Dre') || authorName?.includes('Marcus') || authorName?.includes('Isla') || authorName?.includes('Kai')) return 'creative';
  if (authorName?.includes('Jaylen') || authorName?.includes('Chris') || authorName?.includes('Raj') || authorName?.includes('Omar')) return 'tech';
  if (authorName?.includes('Maya') || authorName?.includes('Tasha') || authorName?.includes('Sofia') || authorName?.includes('Zara') || authorName?.includes('Brianna')) return 'fashion';
  if (authorName?.includes('Liam') || authorName?.includes('Trevon') || authorName?.includes('Ethan')) return 'celebration';
  if (authorName?.includes('Terrence')) return 'home';
  
  return 'celebration';
}

function generateImage(postId, text, authorName, outputPath) {
  const width = 800;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const category = getCategoryForPost(postId, text, authorName);
  const paletteOptions = palettes[category];
  const palette = paletteOptions[Math.abs(hashCode(postId)) % paletteOptions.length];
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.5, palette[1]);
  gradient.addColorStop(1, palette[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add subtle pattern overlay
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 100 + 20;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  // Add geometric overlay shapes
  ctx.globalAlpha = 0.06;
  const shapeCount = 5 + (Math.abs(hashCode(postId)) % 5);
  for (let i = 0; i < shapeCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 200 + 50;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.abs(hashCode(postId + i)) % 360) * Math.PI / 180);
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.rect(-size/2, -size/2, size, size);
      ctx.fillStyle = '#fff';
      ctx.fill();
    } else if (i % 3 === 1) {
      ctx.beginPath();
      ctx.arc(0, 0, size/2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -size/2);
      ctx.lineTo(size/2, size/2);
      ctx.lineTo(-size/2, size/2);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  
  // Add vignette effect
  const vignetteGradient = ctx.createRadialGradient(width/2, height/2, width * 0.3, width/2, height/2, width * 0.7);
  vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
  vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add category emoji/indicator
  ctx.globalAlpha = 0.15;
  ctx.font = '180px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const emoji = categoryEmojis[category];
  // Use a simple shape instead of emoji (more reliable in canvas)
  ctx.beginPath();
  ctx.arc(width/2, height * 0.35, 80, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Add author name
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  if (authorName) {
    ctx.fillText(`@${authorName.split(' ')[0].toLowerCase()}`, width/2, height * 0.65);
  }
  
  // Add short text excerpt
  ctx.font = '24px sans-serif';
  ctx.globalAlpha = 0.7;
  const shortText = text.length > 60 ? text.substring(0, 57) + '...' : text;
  ctx.fillText(shortText, width/2, height * 0.75, width * 0.8);
  
  // Add ORRA watermark
  ctx.globalAlpha = 0.2;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('ORRA', width/2, height * 0.9);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  // Save to file
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
  fs.writeFileSync(outputPath, buffer);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

module.exports = { generateImage, getCategoryForPost };
