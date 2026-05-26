'use client';

import { useState, useMemo } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { ArrowLeft, Sparkles, Zap } from 'lucide-react';

interface PrismPersonalityProps {
  onBack: () => void;
}

const ALL_QUESTIONS = [
  { q: 'At a party, you are most likely...', options: [
    { text: 'The center of attention 🎤', type: 'flame' },
    { text: 'Chilling in a small group 🛋️', type: 'ocean' },
    { text: 'Observing from the corner 👀', type: 'crystal' },
    { text: 'Making everyone laugh 😂', type: 'sun' },
  ]},
  { q: 'Your ideal weekend is...', options: [
    { text: 'Adventure & exploring 🏔️', type: 'flame' },
    { text: 'Cozy movie marathon 🍿', type: 'ocean' },
    { text: 'Creating something new 🎨', type: 'crystal' },
    { text: 'Hanging with friends 🤗', type: 'sun' },
  ]},
  { q: 'When faced with a problem, you...', options: [
    { text: 'Charge in head first 💪', type: 'flame' },
    { text: 'Think it through carefully 🧠', type: 'crystal' },
    { text: 'Ask friends for help 🫂', type: 'sun' },
    { text: 'Trust your gut feeling ✨', type: 'ocean' },
  ]},
  { q: 'Your vibe check song is...', options: [
    { text: 'Something hype & energetic 🔊', type: 'flame' },
    { text: 'Chill lo-fi beats 🎧', type: 'ocean' },
    { text: 'Something unique & indie 🎸', type: 'crystal' },
    { text: 'Feel-good pop anthem 🎶', type: 'sun' },
  ]},
  { q: 'Pick your spirit color...', options: [
    { text: 'Red / Orange 🔥', type: 'flame' },
    { text: 'Blue / Teal 🌊', type: 'ocean' },
    { text: 'Purple / Violet 💎', type: 'crystal' },
    { text: 'Yellow / Gold ☀️', type: 'sun' },
  ]},
  { q: 'Your social media style is...', options: [
    { text: 'Bold & unfiltered posts 💥', type: 'flame' },
    { text: 'Aesthetic & curated feed 📸', type: 'crystal' },
    { text: 'Sharing memes & jokes 😜', type: 'sun' },
    { text: 'Rare but meaningful posts 🌊', type: 'ocean' },
  ]},
  { q: 'Your go-to comfort food is...', options: [
    { text: 'Spicy & bold flavors 🌶️', type: 'flame' },
    { text: 'Warm soup or stew 🍲', type: 'ocean' },
    { text: 'Something I cooked myself 🍳', type: 'crystal' },
    { text: 'Pizza with friends 🍕', type: 'sun' },
  ]},
  { q: 'How do you handle stress?', options: [
    { text: 'Hit the gym or run it out 🏃', type: 'flame' },
    { text: 'Meditate or deep breathe 🧘', type: 'ocean' },
    { text: 'Organize & plan everything 📋', type: 'crystal' },
    { text: 'Call a friend to vent 📱', type: 'sun' },
  ]},
  { q: 'Your dream job involves...', options: [
    { text: 'Leading a team to victory 🏆', type: 'flame' },
    { text: 'Helping people heal & grow 💚', type: 'ocean' },
    { text: 'Designing or inventing things 💡', type: 'crystal' },
    { text: 'Entertaining & making people smile 🎭', type: 'sun' },
  ]},
  { q: 'Pick your ideal pet...', options: [
    { text: 'An energetic husky 🐕', type: 'flame' },
    { text: 'A calm, wise cat 🐈', type: 'ocean' },
    { text: 'An exotic reptile or fish 🦎', type: 'crystal' },
    { text: 'A golden retriever — best friend forever 🐶', type: 'sun' },
  ]},
  { q: 'Your texting style is...', options: [
    { text: 'ALL CAPS, lots of exclamation marks!!!', type: 'flame' },
    { text: 'Thoughtful, long paragraphs 📝', type: 'ocean' },
    { text: 'Precise, minimal, emoji-free ✉️', type: 'crystal' },
    { text: 'Memes, GIFs, and voice notes 😄', type: 'sun' },
  ]},
  { q: 'What motivates you most?', options: [
    { text: 'Competition & winning 🥇', type: 'flame' },
    { text: 'Inner peace & fulfillment ☮️', type: 'ocean' },
    { text: 'Curiosity & learning 📚', type: 'crystal' },
    { text: 'Connection & belonging 💕', type: 'sun' },
  ]},
  { q: 'Your morning routine is...', options: [
    { text: 'Up at dawn, ready to conquer ☀️', type: 'flame' },
    { text: 'Slow & peaceful, coffee first ☕', type: 'ocean' },
    { text: 'Same exact schedule every day ⏰', type: 'crystal' },
    { text: 'Whatever vibes I wake up with 🌈', type: 'sun' },
  ]},
  { q: 'In a group project, you are...', options: [
    { text: 'The leader who takes charge 👑', type: 'flame' },
    { text: 'The peacemaker who keeps harmony 🕊️', type: 'ocean' },
    { text: 'The researcher with all the facts 🔍', type: 'crystal' },
    { text: 'The motivator who keeps morale up 🎉', type: 'sun' },
  ]},
  { q: 'Your fashion sense is...', options: [
    { text: 'Bold, bright, statement pieces 👗', type: 'flame' },
    { text: 'Cozy, layered, comfortable 🧣', type: 'ocean' },
    { text: 'Unique, thrifted, one-of-a-kind 🕶️', type: 'crystal' },
    { text: 'Casual & friendly, always approachable 👟', type: 'sun' },
  ]},
  { q: 'Pick a vacation...', options: [
    { text: 'Thrilling adventure in the jungle 🌴', type: 'flame' },
    { text: 'Quiet cabin by a lake 🏕️', type: 'ocean' },
    { text: 'Museum hopping in a new city 🏛️', type: 'crystal' },
    { text: 'Beach trip with the whole squad 🏖️', type: 'sun' },
  ]},
  { q: 'When you disagree with someone, you...', options: [
    { text: 'Argue your point passionately 🗣️', type: 'flame' },
    { text: 'Try to understand their perspective 🤝', type: 'ocean' },
    { text: 'Present data and logic 📊', type: 'crystal' },
    { text: 'Find common ground with humor 😊', type: 'sun' },
  ]},
  { q: 'Your hidden talent is...', options: [
    { text: 'I can hype up any room 🔥', type: 'flame' },
    { text: 'I can read people really well 👁️', type: 'ocean' },
    { text: 'I notice details others miss 🔎', type: 'crystal' },
    { text: 'I can make anyone laugh 😆', type: 'sun' },
  ]},
  { q: 'Pick a superpower...', options: [
    { text: 'Super strength & speed ⚡', type: 'flame' },
    { text: 'Healing & empathy 💚', type: 'ocean' },
    { text: 'Time manipulation ⏳', type: 'crystal' },
    { text: 'Telepathy — knowing what people feel 🧠', type: 'sun' },
  ]},
  { q: 'Your biggest fear is...', options: [
    { text: 'Being average or forgotten 😤', type: 'flame' },
    { text: 'Losing the people I love 💔', type: 'ocean' },
    { text: 'Making a foolish mistake 🫣', type: 'crystal' },
    { text: 'Being alone or excluded 😢', type: 'sun' },
  ]},
  { q: 'How do you celebrate a win?', options: [
    { text: 'Scream, jump, post about it! 🎊', type: 'flame' },
    { text: 'Quiet gratitude & reflection 🙏', type: 'ocean' },
    { text: 'Analyze what went right 📈', type: 'crystal' },
    { text: 'Celebrate with my people! 🥂', type: 'sun' },
  ]},
  { q: 'Your phone wallpaper is probably...', options: [
    { text: 'An epic action shot 📸', type: 'flame' },
    { text: 'A serene nature scene 🌅', type: 'ocean' },
    { text: 'Abstract art or minimal design 🎨', type: 'crystal' },
    { text: 'A photo with my besties 👯', type: 'sun' },
  ]},
  { q: 'What describes your room?', options: [
    { text: 'Bold posters & bright colors 🖼️', type: 'flame' },
    { text: 'Soft lighting & cozy blankets 🕯️', type: 'ocean' },
    { text: 'Organized, clean, minimal ✨', type: 'crystal' },
    { text: 'Fun, messy, full of memories 📸', type: 'sun' },
  ]},
  { q: 'Your ideal date is...', options: [
    { text: 'An adrenaline-pumping adventure 🎢', type: 'flame' },
    { text: 'Stargazing on a quiet rooftop 🌌', type: 'ocean' },
    { text: 'An escape room challenge 🧩', type: 'crystal' },
    { text: 'A fun cooking class together 🍳', type: 'sun' },
  ]},
  { q: 'Your reaction to a surprise test...', options: [
    { text: 'Bring it on, I got this 💪', type: 'flame' },
    { text: 'Take a deep breath and start 🧘', type: 'ocean' },
    { text: 'Quickly analyze what I know 📊', type: 'crystal' },
    { text: 'Whisper to a friend for help 😅', type: 'sun' },
  ]},
  { q: 'Your go-to hobby is...', options: [
    { text: 'Extreme sports or hiking 🧗', type: 'flame' },
    { text: 'Journaling or meditation 📓', type: 'ocean' },
    { text: 'Coding or building things 💻', type: 'crystal' },
    { text: 'Board games or karaoke 🎤', type: 'sun' },
  ]},
  { q: 'How do you start a conversation?', options: [
    { text: 'Bold compliment or hot take 🔥', type: 'flame' },
    { text: 'A thoughtful question 🤔', type: 'ocean' },
    { text: 'An interesting fact 📖', type: 'crystal' },
    { text: 'A funny meme or GIF 😂', type: 'sun' },
  ]},
  { q: 'Your study style is...', options: [
    { text: 'Cram the night before, pure adrenaline ⚡', type: 'flame' },
    { text: 'Calm review with tea and lo-fi 🍵', type: 'ocean' },
    { text: 'Color-coded notes and schedule 📅', type: 'crystal' },
    { text: 'Group study with snacks 🍕', type: 'sun' },
  ]},
  { q: 'Pick a season...', options: [
    { text: 'Summer — energy and heat ☀️', type: 'flame' },
    { text: 'Autumn — cozy and reflective 🍂', type: 'ocean' },
    { text: 'Winter — crisp and clear ❄️', type: 'crystal' },
    { text: 'Spring — fresh and social 🌸', type: 'sun' },
  ]},
  { q: 'Your snack of choice is...', options: [
    { text: 'Something spicy and bold 🌶️', type: 'flame' },
    { text: 'Warm tea and cookies 🍪', type: 'ocean' },
    { text: 'Something I meal-prepped myself 🥗', type: 'crystal' },
    { text: 'Sharing fries with friends 🍟', type: 'sun' },
  ]},
  { q: 'Your reaction to drama...', options: [
    { text: 'Jump right in, let me handle this 💥', type: 'flame' },
    { text: 'Stay calm, observe from a distance 👁️', type: 'ocean' },
    { text: 'Analyze both sides objectively 📋', type: 'crystal' },
    { text: 'Try to make everyone laugh and move on 😄', type: 'sun' },
  ]},
  { q: 'Your ideal ORRA post is...', options: [
    { text: 'A bold take that gets people talking 🔥', type: 'flame' },
    { text: 'A deep reflection on life 🌊', type: 'ocean' },
    { text: 'A well-curated aesthetic photo dump 📸', type: 'crystal' },
    { text: 'A silly meme or fun poll 😜', type: 'sun' },
  ]},
  { q: 'When your phone dies...', options: [
    { text: 'I feel unstoppable, no distractions! 🚀', type: 'flame' },
    { text: 'Finally, some peace and quiet 🧘', type: 'ocean' },
    { text: 'I grab my backup charger immediately 🔌', type: 'crystal' },
    { text: 'I panic — how do I reach my friends?! 😱', type: 'sun' },
  ]},
  { q: 'Your dream concert is...', options: [
    { text: 'Mosh pit at a rock show 🎸', type: 'flame' },
    { text: 'Intimate acoustic set under stars 🌙', type: 'ocean' },
    { text: 'An immersive audio-visual experience 🎭', type: 'crystal' },
    { text: 'Dancing with friends at a pop show 🎶', type: 'sun' },
  ]},
  { q: 'How do you handle a creative block?', options: [
    { text: 'Power through with brute force 💪', type: 'flame' },
    { text: 'Take a walk and let ideas flow 🚶', type: 'ocean' },
    { text: 'Research and gather inspiration 📚', type: 'crystal' },
    { text: 'Brainstorm with friends 💬', type: 'sun' },
  ]},
  { q: 'Your ideal work environment is...', options: [
    { text: 'Fast-paced, high-energy startup 🚀', type: 'flame' },
    { text: 'Quiet home office with plants 🌱', type: 'ocean' },
    { text: 'Sleek modern office, no distractions 🏢', type: 'crystal' },
    { text: 'Collaborative co-working space 🤝', type: 'sun' },
  ]},
  { q: 'Your guilty pleasure show is...', options: [
    { text: 'Action or thriller — keeps me on edge 🎬', type: 'flame' },
    { text: 'Emotional drama — I love a good cry 😢', type: 'ocean' },
    { text: 'True crime or documentary — I need facts 🔍', type: 'crystal' },
    { text: 'Reality TV — pure entertainment 📺', type: 'sun' },
  ]},
  { q: 'Your sleep schedule is...', options: [
    { text: 'I will sleep when I am dead — too much to do 🌃', type: 'flame' },
    { text: 'Early to bed, early to rise — I love mornings 🌅', type: 'ocean' },
    { text: 'Strict 11 PM to 7 AM, no exceptions ⏰', type: 'crystal' },
    { text: 'Whenever I crash — usually after late-night chats 🌙', type: 'sun' },
  ]},
  { q: 'Your travel style is...', options: [
    { text: 'Backpacking and going off the grid 🏕️', type: 'flame' },
    { text: 'Slow travel, really soaking it in 🧳', type: 'ocean' },
    { text: 'Detailed itinerary, every hour planned 📋', type: 'crystal' },
    { text: 'Group trip with all the squad 🚌', type: 'sun' },
  ]},
  { q: 'Your emotional state right now is...', options: [
    { text: 'Fired up and ready to go 🔥', type: 'flame' },
    { text: 'Calm and reflective 🌊', type: 'ocean' },
    { text: 'Curious and analytical 🧠', type: 'crystal' },
    { text: 'Happy and social 🥳', type: 'sun' },
  ]},
  { q: 'Your favorite type of content is...', options: [
    { text: 'Motivational and hype content 💥', type: 'flame' },
    { text: 'Poetry and deep storytelling 📖', type: 'ocean' },
    { text: 'Educational and how-to content 🎓', type: 'crystal' },
    { text: 'Memes and comedy skits 😂', type: 'sun' },
  ]},
  { q: 'How do you handle change?', options: [
    { text: 'I embrace it — change is exciting! 🎉', type: 'flame' },
    { text: 'I adapt slowly and mindfully 🧘', type: 'ocean' },
    { text: 'I plan for every possible outcome 📊', type: 'crystal' },
    { text: 'I lean on my support system 💕', type: 'sun' },
  ]},
  { q: 'Your playlist vibe is...', options: [
    { text: 'Rap, EDM, anything with energy 🔊', type: 'flame' },
    { text: 'R&B, soul, chill vibes 🎧', type: 'ocean' },
    { text: 'Indie, alternative, unique sounds 🎸', type: 'crystal' },
    { text: 'Pop hits, throwbacks, singalongs 🎤', type: 'sun' },
  ]},
  { q: 'Your favorite ORRA game is...', options: [
    { text: 'Hot Take — I love controversy 🔥', type: 'flame' },
    { text: 'Guess the Vibe — reading the room 🔮', type: 'ocean' },
    { text: 'Emoji Quest — decoding puzzles 🧩', type: 'crystal' },
    { text: 'Two Truths & A Lie — tricking friends 🤥', type: 'sun' },
  ]},
  { q: 'Your love language is...', options: [
    { text: 'Words of affirmation — big declarations 💬', type: 'flame' },
    { text: 'Quality time — deep, meaningful moments 🕰️', type: 'ocean' },
    { text: 'Acts of service — solving problems for you 🛠️', type: 'crystal' },
    { text: 'Physical touch — hugs and high fives 🤗', type: 'sun' },
  ]},
  { q: 'Your online persona vs real life is...', options: [
    { text: 'Exactly the same — what you see is what you get 💯', type: 'flame' },
    { text: 'More reserved online, deep in person 🌊', type: 'ocean' },
    { text: 'More polished online, casual in person 💎', type: 'crystal' },
    { text: 'Goofier online, warm and real in person ☀️', type: 'sun' },
  ]},
  { q: 'Your approach to New Year resolutions...', options: [
    { text: 'Set massive goals and chase them hard 🎯', type: 'flame' },
    { text: 'Gentle intentions, no pressure 🕊️', type: 'ocean' },
    { text: 'Detailed tracker with milestones 📊', type: 'crystal' },
    { text: 'Make it a group challenge with friends 👯', type: 'sun' },
  ]},
  { q: 'Pick a late-night activity...', options: [
    { text: 'Midnight run or workout 🏃', type: 'flame' },
    { text: 'Stargazing or journaling 📓', type: 'ocean' },
    { text: 'Deep diving into Wikipedia rabbit holes 🕵️', type: 'crystal' },
    { text: 'Group chat going off until 3 AM 💬', type: 'sun' },
  ]},
  { q: 'Your camera roll is mostly...', options: [
    { text: 'Action shots and adventures 📸', type: 'flame' },
    { text: 'Nature, sunsets, and quiet moments 🌅', type: 'ocean' },
    { text: 'Screenshots of useful info and notes 📱', type: 'crystal' },
    { text: 'Selfies with friends and memes 😜', type: 'sun' },
  ]},
  { q: 'How do you make big decisions?', options: [
    { text: 'Trust my gut and go for it 🎲', type: 'flame' },
    { text: 'Meditate on it until it feels right 🧘', type: 'ocean' },
    { text: 'Make a pros and cons list 📝', type: 'crystal' },
    { text: 'Ask everyone I know for advice 🗣️', type: 'sun' },
  ]},
  { q: 'Your relationship with rules is...', options: [
    { text: 'Rules were made to be broken 😎', type: 'flame' },
    { text: 'I follow the ones that make sense 🤷', type: 'ocean' },
    { text: 'I appreciate structure and order 📐', type: 'crystal' },
    { text: 'I go along to get along ✌️', type: 'sun' },
  ]},
  { q: 'Your response to a compliment is...', options: [
    { text: 'Thanks, I know! Confidence is key 😏', type: 'flame' },
    { text: 'A humble, genuine thank you 🙏', type: 'ocean' },
    { text: 'I analyze whether they meant it 🤔', type: 'crystal' },
    { text: 'I get flustered and return the compliment 🥰', type: 'sun' },
  ]},
  { q: 'Pick a workout...', options: [
    { text: 'HIIT or boxing — maximum intensity 🥊', type: 'flame' },
    { text: 'Yoga or swimming — flowing movement 🏊', type: 'ocean' },
    { text: 'Solo weight training with a plan 🏋️', type: 'crystal' },
    { text: 'Group fitness or dance class 💃', type: 'sun' },
  ]},
  { q: 'Your friendship style is...', options: [
    { text: 'I collect people — the more the merrier 🎉', type: 'flame' },
    { text: 'Deep bonds with a chosen few 💙', type: 'ocean' },
    { text: 'I keep a tight, organized circle 📋', type: 'crystal' },
    { text: 'Everyone is my best friend 🤗', type: 'sun' },
  ]},
  { q: 'Your fridge looks like...', options: [
    { text: 'Energy drinks and hot sauce — essentials only 🌶️', type: 'flame' },
    { text: 'Fresh ingredients and herbal tea 🍵', type: 'ocean' },
    { text: 'Meal prep containers, all labeled 🏷️', type: 'crystal' },
    { text: 'Leftovers from group dinners and snacks 🍕', type: 'sun' },
  ]},
  { q: 'Your birthday tradition is...', options: [
    { text: 'Epic party, all eyes on me 🎊', type: 'flame' },
    { text: 'Quiet reflection and gratitude 🙏', type: 'ocean' },
    { text: 'Treat myself to something I planned 🎁', type: 'crystal' },
    { text: 'Surrounded by everyone I love 🥳', type: 'sun' },
  ]},
  { q: 'How do you recharge?', options: [
    { text: 'Doing something thrilling and new 🎢', type: 'flame' },
    { text: 'Quiet time alone with my thoughts 🧘', type: 'ocean' },
    { text: 'Learning something interesting 📚', type: 'crystal' },
    { text: 'Hanging out with my favorite people 💕', type: 'sun' },
  ]},
  { q: 'Your relationship with time is...', options: [
    { text: 'Every second counts — move fast! ⏱️', type: 'flame' },
    { text: 'Time flows, no need to rush 🌊', type: 'ocean' },
    { text: 'I schedule everything down to the minute ⏰', type: 'crystal' },
    { text: 'What time is it? I lost track chatting 😅', type: 'sun' },
  ]},
  { q: 'Pick an element...', options: [
    { text: 'Fire 🔥', type: 'flame' },
    { text: 'Water 🌊', type: 'ocean' },
    { text: 'Earth 🌍', type: 'crystal' },
    { text: 'Air 🌬️', type: 'sun' },
  ]},
  { q: 'Your ice cream choice is...', options: [
    { text: 'Something wild like chili chocolate 🌶️🍫', type: 'flame' },
    { text: 'Lavender honey or matcha 🍵', type: 'ocean' },
    { text: 'Classic vanilla bean, perfectly crafted 🍦', type: 'crystal' },
    { text: 'Shareable sundae with all the toppings 🍨', type: 'sun' },
  ]},
  { q: 'Your browser tabs right now...', options: [
    { text: '20+ tabs, all active projects 💥', type: 'flame' },
    { text: '5 tabs, all calming and intentional 🧘', type: 'ocean' },
    { text: 'Organized into groups, color coded 🎨', type: 'crystal' },
    { text: 'Memes, chats, and online shopping 🛒', type: 'sun' },
  ]},
  { q: 'Your ideal Saturday morning...', options: [
    { text: 'Up early for an adventure run 🏃', type: 'flame' },
    { text: 'Slow wake-up, coffee in bed ☕', type: 'ocean' },
    { text: 'Following my weekend routine perfectly ✅', type: 'crystal' },
    { text: 'Brunch with the group 🥞', type: 'sun' },
  ]},
  { q: 'Your reaction to a new trend...', options: [
    { text: 'I start it, everyone else follows 😎', type: 'flame' },
    { text: 'I observe first, then decide if it is me 🤔', type: 'ocean' },
    { text: 'I analyze whether it makes logical sense 🧠', type: 'crystal' },
    { text: 'I try it immediately with friends 😂', type: 'sun' },
  ]},
  { q: 'Your WiFi goes down for an hour...', options: [
    { text: 'Go outside and do something physical 🏃', type: 'flame' },
    { text: 'Read a book or meditate — it is a sign 📖', type: 'ocean' },
    { text: 'Tether to my phone instantly — contingency plan 📱', type: 'crystal' },
    { text: 'Go find my roommates or neighbors 👋', type: 'sun' },
  ]},
  { q: 'Your default emoji is...', options: [
    { text: '🔥 or 💪', type: 'flame' },
    { text: '🌊 or 🌙', type: 'ocean' },
    { text: '🧠 or ✨', type: 'crystal' },
    { text: '😂 or 🥰', type: 'sun' },
  ]},
  { q: 'Your approach to self-care is...', options: [
    { text: 'Intense workout then a power nap 💪', type: 'flame' },
    { text: 'Bubble bath, candles, journaling 🕯️', type: 'ocean' },
    { text: 'Following my optimized wellness routine 📋', type: 'crystal' },
    { text: 'Movie night in with my besties 🍿', type: 'sun' },
  ]},
  { q: 'Pick a movie genre...', options: [
    { text: 'Action or thriller — keep me on edge 🎬', type: 'flame' },
    { text: 'Drama or romance — make me feel 💕', type: 'ocean' },
    { text: 'Sci-fi or mystery — make me think 🧩', type: 'crystal' },
    { text: 'Comedy or animation — make me laugh 😂', type: 'sun' },
  ]},
  { q: 'Your desk setup is...', options: [
    { text: 'Gaming rig with RGB lights everywhere 🎮', type: 'flame' },
    { text: 'Minimal with a plant and soft lamp 🌱', type: 'ocean' },
    { text: 'Perfectly organized, label maker deployed 🏷️', type: 'crystal' },
    { text: 'Covered in sticky notes and snacks 🍫', type: 'sun' },
  ]},
  { q: 'How do you handle failure?', options: [
    { text: 'Get mad, then come back stronger 💥', type: 'flame' },
    { text: 'Process the feelings and grow from it 🌱', type: 'ocean' },
    { text: 'Analyze what went wrong and fix it 🔍', type: 'crystal' },
    { text: 'Laugh it off with friends and try again 😄', type: 'sun' },
  ]},
  { q: 'Your go-to drink order is...', options: [
    { text: 'Espresso shot — maximum caffeine ☕', type: 'flame' },
    { text: 'Herbal tea — calm and soothing 🍵', type: 'ocean' },
    { text: 'Matcha latte — precise and trendy 🍵', type: 'crystal' },
    { text: 'Smoothie — fun and shareable 🥤', type: 'sun' },
  ]},
  { q: 'Your ringtone is probably...', options: [
    { text: 'Loud and obnoxious — I need to hear it 🔊', type: 'flame' },
    { text: 'Soft chime or nature sound 🎐', type: 'ocean' },
    { text: 'Silent — I check my phone on schedule 🔇', type: 'crystal' },
    { text: 'The latest TikTok sound 📱', type: 'sun' },
  ]},
  { q: 'Your favorite way to learn is...', options: [
    { text: 'Hands-on, trial by fire 🔥', type: 'flame' },
    { text: 'Reflective reading and discussion 📖', type: 'ocean' },
    { text: 'Structured courses and tutorials 🎓', type: 'crystal' },
    { text: 'Study groups and teaching others 👩‍🏫', type: 'sun' },
  ]},
  { q: 'Your attitude toward risk is...', options: [
    { text: 'No risk, no reward — I am all in 🎰', type: 'flame' },
    { text: 'Calculated risks after deep reflection 🌊', type: 'ocean' },
    { text: 'I prefer safe, proven strategies 📊', type: 'crystal' },
    { text: 'Depends if my friends are doing it too 😅', type: 'sun' },
  ]},
  { q: 'Your social energy is...', options: [
    { text: 'I walk in and own the room 🔥', type: 'flame' },
    { text: 'I recharge alone, then give deep attention 🌊', type: 'ocean' },
    { text: 'I prefer one-on-one meaningful talks 💎', type: 'crystal' },
    { text: 'I get energy FROM being around people ☀️', type: 'sun' },
  ]},
  { q: 'Pick a board game...', options: [
    { text: 'Risk — I play to dominate 🎯', type: 'flame' },
    { text: 'Dixit — beautiful and interpretive 🎨', type: 'ocean' },
    { text: 'Chess — pure strategy and skill ♟️', type: 'crystal' },
    { text: 'Codenames — team fun and laughs 🕵️', type: 'sun' },
  ]},
  { q: 'Your relationship with social media is...', options: [
    { text: 'I post fearlessly and often 📱', type: 'flame' },
    { text: 'I scroll quietly and reflect 🌊', type: 'ocean' },
    { text: 'I curate everything perfectly 💎', type: 'crystal' },
    { text: 'I am there for the memes and DMs 😂', type: 'sun' },
  ]},
  { q: 'Pick a mythological creature...', options: [
    { text: 'Dragon — fierce and powerful 🐉', type: 'flame' },
    { text: 'Mermaid — mysterious and graceful 🧜', type: 'ocean' },
    { text: 'Phoenix — reborn from the ashes 🔥', type: 'crystal' },
    { text: 'Unicorn — magical and loved by all 🦄', type: 'sun' },
  ]},
  { q: 'Your airport vibe is...', options: [
    { text: 'Running to the gate at the last second 🏃', type: 'flame' },
    { text: 'Early, relaxed, with a good book 📖', type: 'ocean' },
    { text: 'Perfectly planned itinerary in hand 📋', type: 'crystal' },
    { text: 'Chatting with strangers at the bar 🍻', type: 'sun' },
  ]},
  { q: 'Your karaoke song is...', options: [
    { text: 'Something loud and hype 🔊', type: 'flame' },
    { text: 'A soulful ballad that makes everyone cry 😢', type: 'ocean' },
    { text: 'Something obscure nobody knows 🎸', type: 'crystal' },
    { text: 'A duet with my best friend 🎤', type: 'sun' },
  ]},
  { q: 'Your first thought in the morning is...', options: [
    { text: 'Let us conquer today! 🚀', type: 'flame' },
    { text: 'Five more minutes of peace 😌', type: 'ocean' },
    { text: 'What is on my schedule? 📅', type: 'crystal' },
    { text: 'I need to check my group chats 📱', type: 'sun' },
  ]},
  { q: 'Your commitment level to plans is...', options: [
    { text: 'Spontaneous — plans change and I love it 🎲', type: 'flame' },
    { text: 'Selective — I commit to what feels right 🌊', type: 'ocean' },
    { text: 'Once I commit, I show up no matter what 📌', type: 'crystal' },
    { text: 'I am down for whatever my friends want 🤙', type: 'sun' },
  ]},
  { q: 'Your ideal gift to receive is...', options: [
    { text: 'An experience — skydiving, concert tickets 🎸', type: 'flame' },
    { text: 'Something handmade and heartfelt 🎁', type: 'ocean' },
    { text: 'Something useful and high-quality 🔧', type: 'crystal' },
    { text: 'Something fun we can do together 🎮', type: 'sun' },
  ]},
  { q: 'Your favorite season to post on ORRA is...', options: [
    { text: 'Summer vibes — beach and energy ☀️', type: 'flame' },
    { text: 'Fall aesthetics — cozy and moody 🍂', type: 'ocean' },
    { text: 'Winter minimalism — clean and crisp ❄️', type: 'crystal' },
    { text: 'Spring fun — flowers and friends 🌸', type: 'sun' },
  ]},
  { q: 'How do you end a phone call?', options: [
    { text: 'Gotta go, bye! — click 💥', type: 'flame' },
    { text: 'It was so nice talking, take care 💙', type: 'ocean' },
    { text: 'To summarize, action items are... 📋', type: 'crystal' },
    { text: 'Wait one more thing! — 30 more minutes 😂', type: 'sun' },
  ]},
  { q: 'Your decorating style is...', options: [
    { text: 'Statement pieces — bold and loud 🖼️', type: 'flame' },
    { text: 'Boho and cozy — textures and warmth 🏡', type: 'ocean' },
    { text: 'Modern and minimal — less is more ✨', type: 'crystal' },
    { text: 'Eclectic — full of memories and color 🌈', type: 'sun' },
  ]},
  { q: 'Your reaction to a cancelled plan is...', options: [
    { text: 'Frustrated — I was ready to go! 😤', type: 'flame' },
    { text: 'Relieved — more me time 🧘', type: 'ocean' },
    { text: 'Reschedule immediately — efficiency matters 📅', type: 'crystal' },
    { text: 'Bummed — I was excited to see everyone 😢', type: 'sun' },
  ]},
  { q: 'Your approach to oversharing is...', options: [
    { text: 'My life is an open book, read it! 📖', type: 'flame' },
    { text: 'I share deeply but only with trusted people 🤫', type: 'ocean' },
    { text: 'I share facts, not feelings 📊', type: 'crystal' },
    { text: 'I share everything with my close friends 💬', type: 'sun' },
  ]},
  { q: 'Your favorite way to celebrate a friend is...', options: [
    { text: 'Throw them a surprise party with all the hype 🎉', type: 'flame' },
    { text: 'Write them a heartfelt letter 💌', type: 'ocean' },
    { text: 'Get them exactly what they need 🎯', type: 'crystal' },
    { text: 'Take them out for a fun day together 🥳', type: 'sun' },
  ]},
  { q: 'Your Spotify listening habit is...', options: [
    { text: 'Same hype playlist on repeat 🔁', type: 'flame' },
    { text: 'Mood-based playlists for every feeling 🎧', type: 'ocean' },
    { text: 'Discover weekly — always finding new music 🔍', type: 'crystal' },
    { text: 'Whatever is trending — keep up with the group 📈', type: 'sun' },
  ]},
  { q: 'Your superpower would be...', options: [
    { text: 'Fearlessness — nothing can stop me 🦸', type: 'flame' },
    { text: 'Empathy — feeling what others feel 💚', type: 'ocean' },
    { text: 'Perfect memory — never forget anything 🧠', type: 'crystal' },
    { text: 'Making anyone smile — spreading joy 😊', type: 'sun' },
  ]},
  { q: 'Your reaction to a rainy day is...', options: [
    { text: 'Still going out, rain is not stopping me 🌧️💪', type: 'flame' },
    { text: 'Perfect — cozy indoor day 🕯️', type: 'ocean' },
    { text: 'Productivity day — no distractions 📋', type: 'crystal' },
    { text: 'Movie marathon with friends 🍿', type: 'sun' },
  ]},
  { q: 'Your favorite ORRA feature is...', options: [
    { text: 'Going viral on the explore page 🚀', type: 'flame' },
    { text: 'Deep conversations in DMs 💬', type: 'ocean' },
    { text: 'Aura analytics and insights 📊', type: 'crystal' },
    { text: 'Playing games with friends 🎮', type: 'sun' },
  ]},
  { q: 'Your ideal pet personality would be...', options: [
    { text: 'An adventure dog that hikes with me 🐕🏔️', type: 'flame' },
    { text: 'A calm cat that cuddles while I read 🐈📚', type: 'ocean' },
    { text: 'An independent fish in a beautifully designed tank 🐠', type: 'crystal' },
    { text: 'A friendly golden that loves everyone 🐶💕', type: 'sun' },
  ]},
  { q: 'Your approach to networking is...', options: [
    { text: 'Walk up, introduce myself, own the room 🤝', type: 'flame' },
    { text: 'Build one genuine connection at a time 💙', type: 'ocean' },
    { text: 'Research people beforehand, have a plan 📋', type: 'crystal' },
    { text: 'Just be friendly and see what happens 😊', type: 'sun' },
  ]},
  { q: 'Your go-to emoji combo is...', options: [
    { text: '🔥💪✨', type: 'flame' },
    { text: '🌊🌙🙏', type: 'ocean' },
    { text: '🧠📊💡', type: 'crystal' },
    { text: '😂🥰🎉', type: 'sun' },
  ]},
  { q: 'Your ideal weekend night is...', options: [
    { text: 'Out clubbing till dawn 💃', type: 'flame' },
    { text: 'Home with a good book and candle 🕯️', type: 'ocean' },
    { text: 'Working on a personal project 💻', type: 'crystal' },
    { text: 'Game night with friends 🎲', type: 'sun' },
  ]},
  { q: 'Your reaction to a group project...', options: [
    { text: 'I am taking charge immediately 👑', type: 'flame' },
    { text: 'I will help wherever needed 🤝', type: 'ocean' },
    { text: 'Let me create the timeline and plan 📅', type: 'crystal' },
    { text: 'Group projects mean group fun! 🎉', type: 'sun' },
  ]},
  { q: 'Your shower thoughts are about...', options: [
    { text: 'How to dominate my next challenge 💪', type: 'flame' },
    { text: 'The meaning of life and existence 🌌', type: 'ocean' },
    { text: 'That problem I have not solved yet 🧩', type: 'crystal' },
    { text: 'That funny thing my friend said 😂', type: 'sun' },
  ]},
  { q: 'Your emotional recovery speed is...', options: [
    { text: 'Fast — I bounce back instantly ⚡', type: 'flame' },
    { text: 'Slow and gentle — I take my time 🐌', type: 'ocean' },
    { text: 'I process analytically and move on 📊', type: 'crystal' },
    { text: 'I call a friend and feel better right away 📱', type: 'sun' },
  ]},
  { q: 'Your leadership style is...', options: [
    { text: 'Lead from the front, inspire by example 🏆', type: 'flame' },
    { text: 'Lead with empathy and understanding 💙', type: 'ocean' },
    { text: 'Lead with strategy and clear plans 📋', type: 'crystal' },
    { text: 'Lead by building consensus and keeping morale up 🎉', type: 'sun' },
  ]},
  { q: 'Your favorite smell is...', options: [
    { text: 'Bonfire or gasoline — bold scents 🔥', type: 'flame' },
    { text: 'Rain or fresh lavender 🌧️', type: 'ocean' },
    { text: 'New books or fresh coffee ☕', type: 'crystal' },
    { text: 'Fresh baked cookies — reminds me of home 🍪', type: 'sun' },
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

const PERSONALITY_TYPES: Record<string, { name: string; description: string; emoji: string; color: string; traits: string[] }> = {
  flame: {
    name: 'Inferno Spirit',
    description: 'You burn bright and lead with passion! Your energy is contagious and you light up every room you enter. People are drawn to your fierce confidence.',
    emoji: '🔥',
    color: 'from-red-500 to-orange-500',
    traits: ['Bold', 'Passionate', 'Leader', 'Adventurous'],
  },
  ocean: {
    name: 'Deep Tide',
    description: 'You move with calm wisdom and deep understanding. Like the ocean, you have hidden depths that surprise people. Your intuition is your superpower.',
    emoji: '🌊',
    color: 'from-blue-500 to-cyan-500',
    traits: ['Intuitive', 'Calm', 'Wise', 'Empathetic'],
  },
  crystal: {
    name: 'Prism Mind',
    description: 'You see the world through a unique lens, refracting ordinary moments into extraordinary ideas. Your creativity and originality set you apart.',
    emoji: '💎',
    color: 'from-purple-500 to-violet-500',
    traits: ['Creative', 'Analytical', 'Unique', 'Visionary'],
  },
  sun: {
    name: 'Solar Heart',
    description: 'You radiate warmth and positivity wherever you go! Your social energy and genuine care for others makes everyone feel welcome and loved.',
    emoji: '☀️',
    color: 'from-yellow-500 to-amber-500',
    traits: ['Friendly', 'Optimistic', 'Social', 'Generous'],
  },
};

export function PrismPersonality({ onBack }: PrismPersonalityProps) {
  const { earnTokens } = useAuraStore();
  const [questions, setQuestions] = useState(() => shuffleArray(ALL_QUESTIONS));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ flame: 0, ocean: 0, crystal: 0, sun: 0 });
  const [result, setResult] = useState<string | null>(null);

  const currentQuestion = questions[questionIndex];

  const handleAnswer = (type: string) => {
    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);

    if (questionIndex + 1 >= questions.length) {
      // Calculate result
      const maxType = Object.entries(newScores).sort(([, a], [, b]) => b - a)[0][0];
      setResult(maxType);
      earnTokens(4, 'PrISM Personality completed');
    } else {
      setQuestionIndex((prev) => prev + 1);
    }
  };

  const resetGame = () => {
    setQuestions(shuffleArray(ALL_QUESTIONS));
    setQuestionIndex(0);
    setScores({ flame: 0, ocean: 0, crystal: 0, sun: 0 });
    setResult(null);
  };

  if (result) {
    const personality = PERSONALITY_TYPES[result];
    return (
      <div className="fade-in space-y-4 pb-4">
        <div className="glass-panel rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">{personality.emoji}</div>
          <h2 className="text-2xl font-black gradient-text mb-2">{personality.name}</h2>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{personality.description}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {personality.traits.map((trait) => (
              <span key={trait} className={`px-3 py-1 rounded-full bg-gradient-to-r ${personality.color} text-white text-xs font-bold`}>{trait}</span>
            ))}
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">+4 ORRA</span>
          </div>

          <div className="space-y-2 mt-4">
            <button onClick={resetGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm">Discover Again</button>
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

      {/* Progress */}
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 mb-2">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-black text-white">PrISM Personality</h2>
        <p className="text-xs text-slate-500">Discover your true aura type</p>
      </div>

      {/* Question */}
      <div className="glass-panel rounded-2xl p-4">
        <h3 className="text-base font-bold text-white text-center">{currentQuestion.q}</h3>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(option.type)}
            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all"
          >
            <span className="text-sm font-medium text-white">{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
