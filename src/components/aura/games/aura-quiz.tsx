'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Zap, Palette } from 'lucide-react';

interface AuraQuizProps {
  onBack: () => void;
}

const ALL_QUESTIONS = [
  { q: 'What time of day do you feel most alive?', options: [
    { text: 'Dawn - Fresh starts 🌅', color: 'rose' },
    { text: 'Midday - Full energy ☀️', color: 'amber' },
    { text: 'Sunset - Golden hour 🌇', color: 'violet' },
    { text: 'Midnight - Quiet power 🌙', color: 'indigo' },
  ]},
  { q: 'Pick the aesthetic that speaks to you...', options: [
    { text: 'Soft pastels & flowers 🌸', color: 'rose' },
    { text: 'Bold neons & street art 🎨', color: 'amber' },
    { text: 'Cosmic & galaxy vibes ✨', color: 'violet' },
    { text: 'Minimal & sleek monochrome ⬛', color: 'indigo' },
  ]},
  { q: 'How do you recharge your energy?', options: [
    { text: 'Being around people 💃', color: 'amber' },
    { text: 'Nature walks & fresh air 🌿', color: 'rose' },
    { text: 'Creative projects & art 🖌️', color: 'violet' },
    { text: 'Solo time & deep thoughts 🧘', color: 'indigo' },
  ]},
  { q: 'What superpower calls to you?', options: [
    { text: 'Healing touch 💚', color: 'rose' },
    { text: 'Super speed & agility ⚡', color: 'amber' },
    { text: 'Shape-shifting 🦋', color: 'violet' },
    { text: 'Telepathy & mind reading 🧠', color: 'indigo' },
  ]},
  { q: 'Choose your dream destination...', options: [
    { text: 'Cherry blossom garden in Japan 🌸', color: 'rose' },
    { text: 'Vibrant carnival in Brazil 🎭', color: 'amber' },
    { text: 'Northern lights in Iceland 🌌', color: 'violet' },
    { text: 'Deep sea exploration 🐋', color: 'indigo' },
  ]},
  { q: 'Your ideal Friday night?', options: [
    { text: 'Cooking dinner for someone special 🕯️', color: 'rose' },
    { text: 'Dancing at a concert 🎶', color: 'amber' },
    { text: 'Stargazing from a rooftop 🌠', color: 'violet' },
    { text: 'Deep conversation over coffee ☕', color: 'indigo' },
  ]},
  { q: 'Pick your spirit animal...', options: [
    { text: 'Gentle deer 🦌', color: 'rose' },
    { text: 'Playful dolphin 🐬', color: 'amber' },
    { text: 'Mysterious owl 🦉', color: 'violet' },
    { text: 'Wise wolf 🐺', color: 'indigo' },
  ]},
  { q: 'What kind of music moves you?', options: [
    { text: 'Acoustic & indie folk 🎸', color: 'rose' },
    { text: 'High-energy pop & EDM 🎧', color: 'amber' },
    { text: 'Electronic & ambient synths 🎹', color: 'violet' },
    { text: 'Jazz & classical 🎻', color: 'indigo' },
  ]},
  { q: 'Your go-to drink?', options: [
    { text: 'Hot cocoa with marshmallows ☕', color: 'rose' },
    { text: 'Sparkling energy drink ⚡', color: 'amber' },
    { text: 'Lavender matcha latte 🍵', color: 'violet' },
    { text: 'Strong black coffee ☕', color: 'indigo' },
  ]},
  { q: 'What would your room look like?', options: [
    { text: 'Cozy, plants everywhere, fairy lights 🌱', color: 'rose' },
    { text: 'Bright, colorful, full of posters 🖼️', color: 'amber' },
    { text: 'Dreamy, galaxy projector, crystals 💎', color: 'violet' },
    { text: 'Clean, minimal, one statement piece 🖤', color: 'indigo' },
  ]},
  { q: 'How do you express love?', options: [
    { text: 'Kind words & encouragement 💕', color: 'rose' },
    { text: 'Planning fun surprises 🎁', color: 'amber' },
    { text: 'Creating something special for them 🎨', color: 'violet' },
    { text: 'Being there in silence when needed 🤫', color: 'indigo' },
  ]},
  { q: 'Your hidden talent?', options: [
    { text: 'Making anyone feel welcome 🤗', color: 'rose' },
    { text: 'Hyping up any room 🔥', color: 'amber' },
    { text: 'Seeing beauty in ordinary things 👁️', color: 'violet' },
    { text: 'Reading between the lines 📖', color: 'indigo' },
  ]},
  { q: 'What season matches your soul?', options: [
    { text: 'Spring — new beginnings 🌷', color: 'rose' },
    { text: 'Summer — endless energy ☀️', color: 'amber' },
    { text: 'Autumn — magical & changing 🍂', color: 'violet' },
    { text: 'Winter — quiet & powerful ❄️', color: 'indigo' },
  ]},
  { q: 'Pick a movie genre...', options: [
    { text: 'Heartfelt romance 💕', color: 'rose' },
    { text: 'Action-packed adventure 💥', color: 'amber' },
    { text: 'Fantasy & sci-fi 🧙', color: 'violet' },
    { text: 'Psychological thriller 🔍', color: 'indigo' },
  ]},
  { q: 'Your communication style?', options: [
    { text: 'Warm, caring, lots of emojis 🥰', color: 'rose' },
    { text: 'Enthusiastic, uses ALL CAPS 🔊', color: 'amber' },
    { text: 'Poetic, uses metaphors & vibes 🌙', color: 'violet' },
    { text: 'Direct, thoughtful, few words 📝', color: 'indigo' },
  ]},
  { q: 'What scares you most?', options: [
    { text: 'People not feeling loved 💔', color: 'rose' },
    { text: 'Being stuck in one place 🚫', color: 'amber' },
    { text: 'Losing my imagination 🌑', color: 'violet' },
    { text: 'Not understanding the truth 🌀', color: 'indigo' },
  ]},
  { q: 'Your dream home?', options: [
    { text: 'Cottage with a flower garden 🏡', color: 'rose' },
    { text: 'Penthouse in a big city 🏙️', color: 'amber' },
    { text: 'Treehouse in an enchanted forest 🌳', color: 'violet' },
    { text: 'Library with floor-to-ceiling shelves 📚', color: 'indigo' },
  ]},
  { q: 'Pick a magical artifact...', options: [
    { text: 'A healing amulet 💎', color: 'rose' },
    { text: 'A flame sword ⚔️', color: 'amber' },
    { text: 'A crystal ball 🔮', color: 'violet' },
    { text: 'An ancient tome of knowledge 📜', color: 'indigo' },
  ]},
  { q: 'What makes you cry?', options: [
    { text: 'Seeing acts of kindness 🥹', color: 'rose' },
    { text: 'Incredible music or performances 🎤', color: 'amber' },
    { text: 'Beautiful art or sunsets 🌅', color: 'violet' },
    { text: 'Profound insights or realizations 💡', color: 'indigo' },
  ]},
  { q: 'Your legacy would be...', options: [
    { text: 'Making the world more compassionate 💗', color: 'rose' },
    { text: 'Inspiring people to live boldly 🔥', color: 'amber' },
    { text: 'Leaving behind beautiful creations 🎨', color: 'violet' },
    { text: 'Discovering truths that change everything 🔬', color: 'indigo' },
  ]},
  { q: 'Pick a weather vibe...', options: [
    { text: 'Gentle rain on flowers 🌧️', color: 'rose' },
    { text: 'Thunderstorm with lightning ⛈️', color: 'amber' },
    { text: 'Foggy morning in the mountains 🌫️', color: 'violet' },
    { text: 'Clear starry night 🌌', color: 'indigo' },
  ]},
  { q: 'Your ideal birthday?', options: [
    { text: 'Intimate dinner with loved ones 🎂', color: 'rose' },
    { text: 'Epic party with all friends 🎉', color: 'amber' },
    { text: 'A creative workshop or retreat 🎭', color: 'violet' },
    { text: 'A quiet day of reflection 🧘', color: 'indigo' },
  ]},
  { q: 'Your social media vibe?', options: [
    { text: 'Uplifting stories & kind comments 💬', color: 'rose' },
    { text: 'Viral dances & trending challenges 🕺', color: 'amber' },
    { text: 'Aesthetic mood boards & edits 📸', color: 'violet' },
    { text: 'Rare posts, but always deep thoughts 🖋️', color: 'indigo' },
  ]},
  { q: 'Pick a breakfast...', options: [
    { text: 'Fluffy pancakes with berries 🥞', color: 'rose' },
    { text: 'Loaded breakfast burrito 🌯', color: 'amber' },
    { text: 'Açaí bowl with edible flowers 🫐', color: 'violet' },
    { text: 'Black coffee, no sugar ☕', color: 'indigo' },
  ]},
  { q: 'How do you handle a bad day?', options: [
    { text: 'Call someone I love 📱', color: 'rose' },
    { text: 'Hit the gym or go for a run 🏃', color: 'amber' },
    { text: 'Write it out or make art 📓', color: 'violet' },
    { text: 'Meditate and process in silence 🧘‍♀️', color: 'indigo' },
  ]},
  { q: 'Your group chat role?', options: [
    { text: 'The caretaker who checks on everyone 💕', color: 'rose' },
    { text: 'The hype person sending voice notes 🎙️', color: 'amber' },
    { text: 'The one sharing weird aesthetic memes 🎭', color: 'violet' },
    { text: 'The lurker who drops one profound message 💎', color: 'indigo' },
  ]},
  { q: 'Pick a hobby...', options: [
    { text: 'Volunteering & community service 🤝', color: 'rose' },
    { text: 'Extreme sports & adventures 🏄', color: 'amber' },
    { text: 'Photography & digital art 📷', color: 'violet' },
    { text: 'Chess, puzzles & strategy games ♟️', color: 'indigo' },
  ]},
  { q: 'What would your aura smell like?', options: [
    { text: 'Fresh roses & vanilla 🌹', color: 'rose' },
    { text: 'Citrus burst & sea salt 🍊', color: 'amber' },
    { text: 'Incense & rain on dry earth 🌧️', color: 'violet' },
    { text: 'Old books & cedarwood 📚', color: 'indigo' },
  ]},
  { q: 'Your perfect pet?', options: [
    { text: 'A rescue cat that purrs on your lap 🐱', color: 'rose' },
    { text: 'An energetic golden retriever 🐕', color: 'amber' },
    { text: 'A colorful betta fish 🐠', color: 'violet' },
    { text: 'A wise old tortoise 🐢', color: 'indigo' },
  ]},
  { q: 'Choose your outfit aesthetic...', options: [
    { text: 'Soft girl — cardigans & pastels 🧶', color: 'rose' },
    { text: 'Streetwear — bold logos & sneakers 👟', color: 'amber' },
    { text: 'Fairycore — flowy layers & crystals 🧚', color: 'violet' },
    { text: 'Dark academia — tailored & vintage 🕴️', color: 'indigo' },
  ]},
  { q: 'What motivates you?', options: [
    { text: 'Helping others succeed 💗', color: 'rose' },
    { text: 'Proving doubters wrong 💪', color: 'amber' },
    { text: 'Creating something nobody\'s seen before 🌈', color: 'violet' },
    { text: 'Understanding how the world really works 🧬', color: 'indigo' },
  ]},
  { q: 'Pick a flavor...', options: [
    { text: 'Sweet strawberry 🍓', color: 'rose' },
    { text: 'Spicy cinnamon 🔥', color: 'amber' },
    { text: 'Mysterious lavender honey 🍯', color: 'violet' },
    { text: 'Rich dark chocolate 🍫', color: 'indigo' },
  ]},
  { q: 'Your ideal vacation length?', options: [
    { text: 'A cozy weekend retreat 🏡', color: 'rose' },
    { text: 'Non-stop week of adventures 🗺️', color: 'amber' },
    { text: 'Open-ended, let the journey unfold 🛤️', color: 'violet' },
    { text: 'However long until I find what I\'m looking for 🔭', color: 'indigo' },
  ]},
  { q: 'What do you value most in a friend?', options: [
    { text: 'Kindness & empathy 🤗', color: 'rose' },
    { text: 'Loyalty & fun energy 🔥', color: 'amber' },
    { text: 'Imagination & authenticity 🦋', color: 'violet' },
    { text: 'Honesty & depth of thought 🪞', color: 'indigo' },
  ]},
  { q: 'Choose a celestial body...', options: [
    { text: 'Venus — planet of love 💫', color: 'rose' },
    { text: 'The Sun — center of everything ☀️', color: 'amber' },
    { text: 'Neptune — dreamy & mysterious 🌊', color: 'violet' },
    { text: 'A black hole — infinite depth 🕳️', color: 'indigo' },
  ]},
  { q: 'Your reaction to a new trend?', options: [
    { text: 'I hope everyone\'s having fun with it 😊', color: 'rose' },
    { text: 'I\'m already on it, probably started it 😎', color: 'amber' },
    { text: 'I\'ll remix it into something weird & cool 🎨', color: 'violet' },
    { text: 'I\'ll observe from a distance first 👁️', color: 'indigo' },
  ]},
  { q: 'Pick a plant...', options: [
    { text: 'Lavender — calming & soothing 💜', color: 'rose' },
    { text: 'Sunflower — tall & radiant 🌻', color: 'amber' },
    { text: 'Monstera — wild & tropical 🌿', color: 'violet' },
    { text: 'Bonsai — patient & precise 🌳', color: 'indigo' },
  ]},
  { q: 'How do you make decisions?', options: [
    { text: 'Follow my heart 💝', color: 'rose' },
    { text: 'Trust my gut instinct 🔥', color: 'amber' },
    { text: 'Go with whatever feels most magical ✨', color: 'violet' },
    { text: 'Analyze every angle carefully 🔍', color: 'indigo' },
  ]},
  { q: 'Your TikTok FYP is full of...', options: [
    { text: 'Wholesome storytimes & rescue videos 🥹', color: 'rose' },
    { text: 'Gym fails & crazy stunts 😂', color: 'amber' },
    { text: 'Art tutorials & aesthetic edits 🖌️', color: 'violet' },
    { text: 'Mini documentaries & explainers 🎬', color: 'indigo' },
  ]},
  { q: 'What makes a day perfect?', options: [
    { text: 'Quality time with people I love 💕', color: 'rose' },
    { text: 'An unexpected adventure 🎢', color: 'amber' },
    { text: 'Getting lost in a creative flow state 🎨', color: 'violet' },
    { text: 'Having a breakthrough realization 💡', color: 'indigo' },
  ]},
  { q: 'Choose a gemstone...', options: [
    { text: 'Rose quartz — love & harmony 💗', color: 'rose' },
    { text: 'Citrine — energy & abundance 🌟', color: 'amber' },
    { text: 'Amethyst — intuition & dreams 💎', color: 'violet' },
    { text: 'Obsidian — protection & truth 🖤', color: 'indigo' },
  ]},
  { q: 'Your comfort show genre?', options: [
    { text: 'Feel-good sitcoms & rom-coms 😊', color: 'rose' },
    { text: 'Competitive reality shows 🏆', color: 'amber' },
    { text: 'Fantasy series & animated worlds 🐉', color: 'violet' },
    { text: 'True crime & docuseries 🔎', color: 'indigo' },
  ]},
  { q: 'How do you celebrate a win?', options: [
    { text: 'Hug everyone who supported me 🤗', color: 'rose' },
    { text: 'Scream, jump, post it everywhere 🎊', color: 'amber' },
    { text: 'Make something beautiful to mark the moment 🖼️', color: 'violet' },
    { text: 'Smile quietly and keep going 🚀', color: 'indigo' },
  ]},
  { q: 'Pick a mythical creature...', options: [
    { text: 'A phoenix rising from ashes 🔥', color: 'amber' },
    { text: 'A unicorn spreading rainbows 🦄', color: 'violet' },
    { text: 'A mermaid singing in the deep 🧜‍♀️', color: 'rose' },
    { text: 'A dragon guarding ancient wisdom 🐉', color: 'indigo' },
  ]},
  { q: 'What\'s your love language?', options: [
    { text: 'Words of affirmation 💌', color: 'rose' },
    { text: 'Quality time & shared adventures 🚀', color: 'amber' },
    { text: 'Receiving/giving handmade gifts 🎁', color: 'violet' },
    { text: 'Deep late-night conversations 🌙', color: 'indigo' },
  ]},
  { q: 'Your energy at a party?', options: [
    { text: 'Making sure everyone feels included 🫂', color: 'rose' },
    { text: 'The life of the dance floor 💃', color: 'amber' },
    { text: 'In the corner having a beautifully weird convo 🎭', color: 'violet' },
    { text: 'Left early — I said hi, that counts 😌', color: 'indigo' },
  ]},
  { q: 'Pick an element...', options: [
    { text: 'Water — nurturing & flowing 💧', color: 'rose' },
    { text: 'Fire — passionate & fierce 🔥', color: 'amber' },
    { text: 'Air — free & ever-changing 🌬️', color: 'violet' },
    { text: 'Earth — grounded & ancient 🏔️', color: 'indigo' },
  ]},
  { q: 'Your emoji usage?', options: [
    { text: 'Lots of hearts & smileys 😍💕🥰', color: 'rose' },
    { text: 'Fire & party emojis 🔥🎉😎', color: 'amber' },
    { text: 'Random aesthetic emojis ✨🦋🍄', color: 'violet' },
    { text: 'Barely any — the text speaks 🧐', color: 'indigo' },
  ]},
  { q: 'What would you do with a free million dollars?', options: [
    { text: 'Start a charity & help communities 💝', color: 'rose' },
    { text: 'Travel the world in style 🌍', color: 'amber' },
    { text: 'Fund an art studio & creative collective 🎨', color: 'violet' },
    { text: 'Invest and build generational knowledge 📊', color: 'indigo' },
  ]},
  { q: 'Choose a texture...', options: [
    { text: 'Soft velvet & plush blankets 🧸', color: 'rose' },
    { text: 'Smooth leather & polished metal ⚡', color: 'amber' },
    { text: 'Shimmering silk & iridescent glass 🪞', color: 'violet' },
    { text: 'Raw stone & aged wood 🪨', color: 'indigo' },
  ]},
  { q: 'Your reaction to a surprise?', options: [
    { text: 'Tears of joy, instant hugs 🥹', color: 'rose' },
    { text: 'Loud screaming, maximum excitement 🙌', color: 'amber' },
    { text: 'Stunned into a poetic silence 🌌', color: 'violet' },
    { text: 'Calm nod, processing internally 🧠', color: 'indigo' },
  ]},
  { q: 'Pick a board game...', options: [
    { text: 'Cooperative games where everyone wins 🤝', color: 'rose' },
    { text: 'Fast-paced party games 🎲', color: 'amber' },
    { text: 'Dixit — surreal & imaginative 🎴', color: 'violet' },
    { text: 'Chess — pure strategy ♟️', color: 'indigo' },
  ]},
  { q: 'Your midnight snack?', options: [
    { text: 'Warm cookies fresh from the oven 🍪', color: 'rose' },
    { text: 'Spicy ramen at 2AM 🍜', color: 'amber' },
    { text: 'Something weird but amazing you invented 🧪', color: 'violet' },
    { text: 'Tea. Just tea. Always tea. 🫖', color: 'indigo' },
  ]},
  { q: 'Choose a superpower drawback...', options: [
    { text: 'Feel everyone\'s emotions — it\'s heavy but beautiful 💫', color: 'rose' },
    { text: 'Can\'t sit still — literally always moving 🏃', color: 'amber' },
    { text: 'See in dimensions others can\'t — reality is wild 👁️', color: 'violet' },
    { text: 'Know too much — ignorance is never bliss 🧠', color: 'indigo' },
  ]},
  { q: 'Your ideal workspace?', options: [
    { text: 'Cozy café with soft music ☕', color: 'rose' },
    { text: 'Buzzing coworking space with energy 💻', color: 'amber' },
    { text: 'An art studio with music & natural light 🎨', color: 'violet' },
    { text: 'A quiet library with zero distractions 📚', color: 'indigo' },
  ]},
  { q: 'Pick a time period to live in...', options: [
    { text: 'A peaceful village in the countryside 🌾', color: 'rose' },
    { text: 'The roaring 1920s — parties & jazz 🎷', color: 'amber' },
    { text: 'A mystical medieval kingdom of magic 🏰', color: 'violet' },
    { text: 'Ancient Greece — philosophy & discovery 🏛️', color: 'indigo' },
  ]},
  { q: 'What would your ORRA profile look like?', options: [
    { text: 'Heart-reacting everyone\'s posts 💕', color: 'rose' },
    { text: 'Going viral every other week 🔥', color: 'amber' },
    { text: 'Curated aesthetic grid, mysterious bio 🌒', color: 'violet' },
    { text: 'Rare but legendary posts only 🏆', color: 'indigo' },
  ]},
  { q: 'Choose a natural wonder...', options: [
    { text: 'Cherry blossoms floating on a river 🌸', color: 'rose' },
    { text: 'A volcanic eruption of power 🌋', color: 'amber' },
    { text: 'Bioluminescent waves at night 🌊', color: 'violet' },
    { text: 'The vast silence of a deep cave 🕳️', color: 'indigo' },
  ]},
  { q: 'Your sleep schedule?', options: [
    { text: 'Early to bed, cozy routine 😴', color: 'rose' },
    { text: 'Sleep? There\'s too much to do! 🦉', color: 'amber' },
    { text: 'Dream journaling at 3AM 📓', color: 'violet' },
    { text: 'Precisely scheduled — 7.5 hours exactly ⏰', color: 'indigo' },
  ]},
  { q: 'Pick a way to travel...', options: [
    { text: 'Road trip with your favorite people 🚗', color: 'rose' },
    { text: 'First-class, fast & flashy ✈️', color: 'amber' },
    { text: 'Wandering with no destination 🗺️', color: 'violet' },
    { text: 'Solo backpacking, off the grid 🎒', color: 'indigo' },
  ]},
  { q: 'Your guilty pleasure?', options: [
    { text: 'Rewatching comfort shows for the 100th time 📺', color: 'rose' },
    { text: 'Karaoke — and I\'m NOT sorry 🎤', color: 'amber' },
    { text: 'Collecting weird crystals & tarot cards 🔮', color: 'violet' },
    { text: 'Reading Wikipedia for fun at 2AM 📖', color: 'indigo' },
  ]},
  { q: 'What do you do when you\'re bored?', options: [
    { text: 'Text someone just to check in 💌', color: 'rose' },
    { text: 'Find something active to do NOW 🏃', color: 'amber' },
    { text: 'Doodle, journal, or daydream 🌈', color: 'violet' },
    { text: 'Rabbit-hole into a random topic 🕳️', color: 'indigo' },
  ]},
  { q: 'Choose a type of rain...', options: [
    { text: 'Gentle drizzle on a window 🌧️', color: 'rose' },
    { text: 'Tropical downpour — run through it! 🌊', color: 'amber' },
    { text: 'Rain with a double rainbow 🌈', color: 'violet' },
    { text: 'Fog that swallows the world in mystery 🌫️', color: 'indigo' },
  ]},
  { q: 'Your texting style?', options: [
    { text: 'Long paragraphs full of warmth 💌', color: 'rose' },
    { text: 'ALL CAPS, voice notes, rapid fire 🎙️', color: 'amber' },
    { text: 'Vague but poetic one-liners 🌙', color: 'violet' },
    { text: 'Short, precise, always grammatically correct 📝', color: 'indigo' },
  ]},
  { q: 'Pick a season activity...', options: [
    { text: 'Spring picnic with homemade food 🧺', color: 'rose' },
    { text: 'Summer beach volleyball 🏐', color: 'amber' },
    { text: 'Fall photoshoot in the golden leaves 📸', color: 'violet' },
    { text: 'Winter reading by the fireplace 🔥', color: 'indigo' },
  ]},
  { q: 'What\'s your aura\'s soundtrack?', options: [
    { text: 'A warm piano melody 🎹', color: 'rose' },
    { text: 'An epic bass drop 🎧', color: 'amber' },
    { text: 'Ethereal synth waves 🌊', color: 'violet' },
    { text: 'A single resonant bell 🎐', color: 'indigo' },
  ]},
  { q: 'Choose an instrument...', options: [
    { text: 'Acoustic guitar by a campfire 🎸', color: 'rose' },
    { text: 'Drums — loud & unstoppable 🥁', color: 'amber' },
    { text: 'Theremin — haunting & otherworldly 🎵', color: 'violet' },
    { text: 'Cello — deep & soulful 🎻', color: 'indigo' },
  ]},
  { q: 'Your relationship with rules?', options: [
    { text: 'I follow them if they protect people 🛡️', color: 'rose' },
    { text: 'Rules? More like suggestions 😏', color: 'amber' },
    { text: 'I create my own rules, my own world 🦋', color: 'violet' },
    { text: 'I study them to understand why they exist 🧐', color: 'indigo' },
  ]},
  { q: 'Pick a light source...', options: [
    { text: 'Candlelight — warm & intimate 🕯️', color: 'rose' },
    { text: 'Neon signs — bright & electric 💡', color: 'amber' },
    { text: 'Bioluminescence — magical & organic 🍄', color: 'violet' },
    { text: 'Moonlight — cool & revealing 🌙', color: 'indigo' },
  ]},
  { q: 'Your ideal ORRA community?', options: [
    { text: 'A support group that lifts each other up 💗', color: 'rose' },
    { text: 'A hype squad that goes hard 🔥', color: 'amber' },
    { text: 'A creative collective pushing boundaries 🎭', color: 'violet' },
    { text: 'A think tank exchanging big ideas 💡', color: 'indigo' },
  ]},
  { q: 'Pick a dessert...', options: [
    { text: 'Strawberry shortcake with extra cream 🍰', color: 'rose' },
    { text: 'Flaming baked Alaska 🔥', color: 'amber' },
    { text: 'Galaxy-glazed donut 🍩', color: 'violet' },
    { text: 'Dark chocolate truffle, 85% cacao 🍫', color: 'indigo' },
  ]},
  { q: 'What would your autobiography be titled?', options: [
    { text: 'Leading with Heart 💕', color: 'rose' },
    { text: 'No Limits: My Story ⚡', color: 'amber' },
    { text: 'Between Dreams & Reality ✨', color: 'violet' },
    { text: 'The Architecture of Thought 🧠', color: 'indigo' },
  ]},
  { q: 'Choose a water feature...', options: [
    { text: 'A babbling brook through a meadow 🏞️', color: 'rose' },
    { text: 'A crashing waterfall with rainbows 🌈', color: 'amber' },
    { text: 'A moonlit lake with fireflies 🪲', color: 'violet' },
    { text: 'The deep ocean trenches — unexplored 🐋', color: 'indigo' },
  ]},
  { q: 'Your morning routine?', options: [
    { text: 'Stretch, gratitude journal, gentle start 🌅', color: 'rose' },
    { text: 'Alarm off, let\'s GO, no time to waste 🚀', color: 'amber' },
    { text: 'Depends on the dream I was having 🌀', color: 'violet' },
    { text: 'Same precise routine, every single day ⏱️', color: 'indigo' },
  ]},
  { q: 'Pick a flower...', options: [
    { text: 'Peony — lush & romantic 🌸', color: 'rose' },
    { text: 'Bird of paradise — bold & exotic 🦜', color: 'amber' },
    { text: 'Night-blooming jasmine — mysterious 🌙', color: 'violet' },
    { text: 'Lotus — rises from the mud 🪷', color: 'indigo' },
  ]},
  { q: 'Your strongest trait?', options: [
    { text: 'Empathy — I feel what others feel 💗', color: 'rose' },
    { text: 'Courage — I leap before I look 🦁', color: 'amber' },
    { text: 'Imagination — I see worlds others can\'t 🌈', color: 'violet' },
    { text: 'Discipline — I master what I focus on 🎯', color: 'indigo' },
  ]},
  { q: 'Choose a fabric...', options: [
    { text: 'Soft cotton flannel — cozy forever 🧸', color: 'rose' },
    { text: 'Performance athletic wear — always moving 🏃', color: 'amber' },
    { text: 'Iridescent organza — dreamy layers 🪄', color: 'violet' },
    { text: 'Cashmere — understated luxury 🧣', color: 'indigo' },
  ]},
  { q: 'What would you name your aura?', options: [
    { text: 'Sunrise Soul 🌅', color: 'rose' },
    { text: 'Electric Storm ⚡', color: 'amber' },
    { text: 'Cosmic Dreamweaver ✨', color: 'violet' },
    { text: 'Abyssal Mind 🌌', color: 'indigo' },
  ]},
  { q: 'Pick a video game genre...', options: [
    { text: 'Cozy farming sims & life games 🌾', color: 'rose' },
    { text: 'Competitive shooters & sports games 🎮', color: 'amber' },
    { text: 'Open-world RPGs with deep lore 🗡️', color: 'violet' },
    { text: 'Puzzle & strategy games 🧩', color: 'indigo' },
  ]},
  { q: 'Your aura\'s power level?', options: [
    { text: 'Gentle glow that warms everyone nearby 🕯️', color: 'rose' },
    { text: 'Explosive burst that can\'t be contained 💥', color: 'amber' },
    { text: 'Shimmering aura that shifts colors 🌈', color: 'violet' },
    { text: 'Invisible force — felt but never seen 🌀', color: 'indigo' },
  ]},
  { q: 'Choose a pattern...', options: [
    { text: 'Delicate floral print 🌺', color: 'rose' },
    { text: 'Bold geometric shapes 🔶', color: 'amber' },
    { text: 'Sacred geometry & mandalas 🔮', color: 'violet' },
    { text: 'Clean parallel lines ⬛', color: 'indigo' },
  ]},
  { q: 'Your ideal weekend?', options: [
    { text: 'Brunch & board games with besties 🥂', color: 'rose' },
    { text: 'Music festival from noon to midnight 🎶', color: 'amber' },
    { text: 'Art gallery hopping & thrift shopping 🖼️', color: 'violet' },
    { text: 'Deep dive into a new book & coffee ☕', color: 'indigo' },
  ]},
  { q: 'Pick a color palette...', options: [
    { text: 'Blush, cream & soft sage 💗', color: 'rose' },
    { text: 'Electric blue, hot pink & gold 💛', color: 'amber' },
    { text: 'Ultraviolet, teal & holographic 🦄', color: 'violet' },
    { text: 'Navy, charcoal & silver 🌑', color: 'indigo' },
  ]},
  { q: 'What makes you instantly like someone?', options: [
    { text: 'They remember the little things 🥰', color: 'rose' },
    { text: 'They match my chaotic energy 🔥', color: 'amber' },
    { text: 'They have a unique perspective on life 🦋', color: 'violet' },
    { text: 'They say something that makes me think 🧠', color: 'indigo' },
  ]},
  { q: 'Choose a way to glow up...', options: [
    { text: 'Inner peace & emotional intelligence 🧘‍♀️', color: 'rose' },
    { text: 'Physical strength & unstoppable confidence 💪', color: 'amber' },
    { text: 'Creative mastery & artistic evolution 🎨', color: 'violet' },
    { text: 'Intellectual depth & wisdom beyond years 🦉', color: 'indigo' },
  ]},
  { q: 'Pick a mythical power...', options: [
    { text: 'The ability to heal any wound 💚', color: 'rose' },
    { text: 'Super speed — never miss a moment ⚡', color: 'amber' },
    { text: 'Walk between dreams & reality 🌙', color: 'violet' },
    { text: 'See through all illusions & lies 👁️', color: 'indigo' },
  ]},
  { q: 'Your aura in one word?', options: [
    { text: 'Warm 💗', color: 'rose' },
    { text: 'Electric ⚡', color: 'amber' },
    { text: 'Ethereal ✨', color: 'violet' },
    { text: 'Profound 🌌', color: 'indigo' },
  ]},
  { q: 'Choose a dance style...', options: [
    { text: 'Slow dance under string lights 💃', color: 'rose' },
    { text: 'Hip-hop & breakdance battles 🕺', color: 'amber' },
    { text: 'Contemporary — flowing & expressive 🩰', color: 'violet' },
    { text: 'I observe the dancing, I don\'t dance 🪑', color: 'indigo' },
  ]},
  { q: 'What\'s your aura trying to tell you?', options: [
    { text: 'Be gentler with yourself 💕', color: 'rose' },
    { text: 'It\'s time to go all in! 🔥', color: 'amber' },
    { text: 'Your creativity needs an outlet 🎨', color: 'violet' },
    { text: 'Trust your intuition more 🌀', color: 'indigo' },
  ]},
  { q: 'Pick a snack for a road trip...', options: [
    { text: 'Homemade cookies wrapped with love 🍪', color: 'rose' },
    { text: 'Energy drinks & spicy chips 🌶️', color: 'amber' },
    { text: 'Exotic fruit & lavender lemonade 🍋', color: 'violet' },
    { text: 'Trail mix & a thermos of green tea 🍵', color: 'indigo' },
  ]},
  { q: 'Choose a moon phase...', options: [
    { text: 'Full moon — warmth & fullness 🌕', color: 'rose' },
    { text: 'New moon — fresh starts & action 🌑', color: 'amber' },
    { text: 'Crescent moon — magic & mystery 🌙', color: 'violet' },
    { text: 'Eclipse — rare & transformative 🌘', color: 'indigo' },
  ]},
  { q: 'What do you collect?', options: [
    { text: 'Letters & notes from loved ones 💌', color: 'rose' },
    { text: 'Tickets from every event I\'ve been to 🎟️', color: 'amber' },
    { text: 'Crystals, oddities & found objects 🔮', color: 'violet' },
    { text: 'Books, data & interesting facts 📚', color: 'indigo' },
  ]},
  { q: 'Your aura\'s best friend aura?', options: [
    { text: 'Another rose — mutual healing 🌹', color: 'rose' },
    { text: 'Another amber — double the energy ⚡', color: 'amber' },
    { text: 'A different aura — opposites attract 🧲', color: 'violet' },
    { text: 'Doesn\'t matter — depth of connection over type 🔗', color: 'indigo' },
  ]},
  { q: 'Pick a room scent...', options: [
    { text: 'Fresh baked cookies & vanilla 🍪', color: 'rose' },
    { text: 'Zesty citrus & sea breeze 🍊', color: 'amber' },
    { text: 'Nag champa & palo santo 🪵', color: 'violet' },
    { text: 'Petrichor — the smell after rain 🌧️', color: 'indigo' },
  ]},
  { q: 'Your phone wallpaper right now?', options: [
    { text: 'A loved one\'s photo or a cute pet 🐱', color: 'rose' },
    { text: 'A motivational quote in bold font 💪', color: 'amber' },
    { text: 'An abstract digital art piece 🎨', color: 'violet' },
    { text: 'Solid dark color, no distractions ⬛', color: 'indigo' },
  ]},
  { q: 'Choose a way to give back...', options: [
    { text: 'Volunteering at shelters & food banks 🤝', color: 'rose' },
    { text: 'Organizing charity events & fundraisers 🎪', color: 'amber' },
    { text: 'Creating art that raises awareness 🖼️', color: 'violet' },
    { text: 'Mentoring & teaching what you know 🎓', color: 'indigo' },
  ]},
  { q: 'Pick a type of magic...', options: [
    { text: 'Healing magic — restoring & nurturing 💚', color: 'rose' },
    { text: 'Fire magic — power & transformation 🔥', color: 'amber' },
    { text: 'Illusion magic — bending reality 🪄', color: 'violet' },
    { text: 'Divination — seeing the unseen 👁️', color: 'indigo' },
  ]},
  { q: 'Your aura when you\'re stressed?', options: [
    { text: 'Flickers softly — needs a hug 🥺', color: 'rose' },
    { text: 'Sparks wildly — fight or flight ⚡', color: 'amber' },
    { text: 'Distorts like a mirage 🏜️', color: 'violet' },
    { text: 'Goes completely still — deep processing 🧊', color: 'indigo' },
  ]},
  { q: 'Choose a gateway to another world...', options: [
    { text: 'A door covered in flowering vines 🌸', color: 'rose' },
    { text: 'A portal crackling with energy ⚡', color: 'amber' },
    { text: 'A mirror reflecting a different reality 🪞', color: 'violet' },
    { text: 'An ancient staircase descending into darkness 🕳️', color: 'indigo' },
  ]},
  { q: 'Pick an ORRA avatar style...', options: [
    { text: 'Soft pastel aura, heart particles 💗', color: 'rose' },
    { text: 'Blazing flame aura, lightning trails ⚡', color: 'amber' },
    { text: 'Cosmic swirl aura, star particles ✨', color: 'violet' },
    { text: 'Void aura, minimal & mysterious 🌑', color: 'indigo' },
  ]},
  { q: 'Your first impression on people?', options: [
    { text: 'So sweet & welcoming 🥰', color: 'rose' },
    { text: 'Wow, they have crazy energy 🔥', color: 'amber' },
    { text: 'Intriguing... I can\'t figure them out 🦋', color: 'violet' },
    { text: 'Intense & quietly impressive 🖤', color: 'indigo' },
  ]},
  { q: 'Choose a tarot card vibe...', options: [
    { text: 'The Star — hope & renewal ⭐', color: 'rose' },
    { text: 'The Tower — shake things up 🌩️', color: 'amber' },
    { text: 'The Moon — dreams & intuition 🌙', color: 'violet' },
    { text: 'The Hermit — wisdom in solitude 🏔️', color: 'indigo' },
  ]},
  { q: 'Pick a way to watch the sunset...', options: [
    { text: 'Holding hands with someone special 🤝', color: 'rose' },
    { text: 'From the top of a mountain I just climbed 🏔️', color: 'amber' },
    { text: 'Through a prism creating rainbows 🌈', color: 'violet' },
    { text: 'Alone, sketching it in a journal ✏️', color: 'indigo' },
  ]},
  { q: 'What makes you feel powerful?', options: [
    { text: 'Knowing I made someone\'s day better 💕', color: 'rose' },
    { text: 'Crushing a goal nobody thought possible 💪', color: 'amber' },
    { text: 'Creating something that blows minds 🤯', color: 'violet' },
    { text: 'Understanding something nobody else gets 🧠', color: 'indigo' },
  ]},
  { q: 'Pick an emoji that is your whole vibe...', options: [
    { text: '🌸', color: 'rose' },
    { text: '🔥', color: 'amber' },
    { text: '✨', color: 'violet' },
    { text: '🌑', color: 'indigo' },
  ]},
  { q: 'Your aura\'s resting state?', options: [
    { text: 'A warm, gentle hum like a purring cat 🐱', color: 'rose' },
    { text: 'Buzzing with potential energy like a storm ⛈️', color: 'amber' },
    { text: 'Shifting colors like an oil slick 🌈', color: 'violet' },
    { text: 'Perfectly still like the surface of a deep lake 🏞️', color: 'indigo' },
  ]},
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const AURA_COLORS: Record<string, { name: string; description: string; emoji: string; gradient: string }> = {
  rose: {
    name: 'Rose Aura',
    description: 'Your aura glows with gentle warmth and compassion. You have a healing presence that makes others feel safe and loved. Your kindness is your greatest power.',
    emoji: '🌸',
    gradient: 'from-pink-500 to-rose-500',
  },
  amber: {
    name: 'Amber Aura',
    description: 'Your aura radiates electric energy and boundless enthusiasm! You light up every space with your dynamic presence and unstoppable drive.',
    emoji: '⚡',
    gradient: 'from-amber-500 to-yellow-500',
  },
  violet: {
    name: 'Violet Aura',
    description: 'Your aura shimmers with mystical creativity and deep intuition. You see the world through a magical lens and transform the ordinary into extraordinary.',
    emoji: '✨',
    gradient: 'from-violet-500 to-purple-500',
  },
  indigo: {
    name: 'Indigo Aura',
    description: 'Your aura pulses with deep wisdom and quiet strength. Like the depths of the ocean, your insight runs far deeper than others realize.',
    emoji: '🌙',
    gradient: 'from-indigo-500 to-blue-500',
  },
};

export function AuraQuiz({ onBack }: AuraQuizProps) {
  const { earnTokens } = useAuraStore();
  const [questions, setQuestions] = useState(() => shuffleArray(ALL_QUESTIONS));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ rose: 0, amber: 0, violet: 0, indigo: 0 });
  const [result, setResult] = useState<string | null>(null);

  const currentQuestion = questions[questionIndex];

  const handleAnswer = (color: string) => {
    const newScores = { ...scores, [color]: scores[color] + 1 };
    setScores(newScores);

    if (questionIndex + 1 >= questions.length) {
      const maxColor = Object.entries(newScores).sort(([, a], [, b]) => b - a)[0][0];
      setResult(maxColor);
      earnTokens(4, 'Aura Quiz completed');
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  const resetGame = () => {
    setQuestions(shuffleArray(ALL_QUESTIONS));
    setQuestionIndex(0);
    setScores({ rose: 0, amber: 0, violet: 0, indigo: 0 });
    setResult(null);
  };

  if (result) {
    const aura = AURA_COLORS[result];
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${aura.gradient} mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg`}>
            {aura.emoji}
          </div>
          <h2 className="text-2xl font-black gradient-text mb-2">{aura.name}</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{aura.description}</p>

          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">+4 ORRA</span>
          </div>

          <div className="space-y-2 mt-4">
            <button onClick={resetGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold text-sm">Retake Quiz</button>
            <button onClick={onBack} className="w-full py-3 rounded-xl bg-white/5 text-slate-300 font-medium text-sm hover:bg-white/10 transition-all">Back to Arena</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-violet-400 text-sm font-medium hover:text-violet-300 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>
        <span className="text-xs text-slate-500">{questionIndex + 1}/{questions.length}</span>
      </div>

      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 h-1.5 rounded-full transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 mb-2">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-black text-white">Aura Quiz</h2>
        <p className="text-xs text-slate-500">Find your true aura color</p>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <h3 className="text-base font-bold text-white text-center">{currentQuestion.q}</h3>
      </div>

      <div className="space-y-2">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(option.color)}
            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all"
          >
            <span className="text-sm font-medium text-white">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
