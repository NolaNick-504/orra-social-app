'use client';

import { ReactNode } from 'react';

// ============================================
// SHARED GAME TYPES & INTERFACES
// ============================================

export interface OpponentData {
  id: string;
  name: string;
  handle?: string;
  avatar: string;
  bio?: string;
}

export interface GameCallbacks {
  earnTokens: (amount: number, source: string) => void;
  addXP: (amount: number) => void;
  showToast: (msg: string, opts?: any) => void;
  submitToServer: (roundNumber: number, playerInput: string, isBot?: boolean) => void;
  submitVote: (votedForId: string, voteType: string) => void;
  completeGame: (score: number, isWinner: boolean) => void;
}

export interface CurrentUserData {
  id: string;
  name: string;
  avatar: string;
  handle?: string;
  bio?: string;
}

export interface GameProps {
  onClose: () => void;
  currentUser: CurrentUserData;
  opponent: OpponentData | null;
  isVsBot: boolean;
  gameSessionId: string | null;
  tokenReward: number;
  xpReward: number;
  callbacks: GameCallbacks;
  accentColor: string;
}

// ============================================
// SHARED UI COMPONENTS
// ============================================

export function GameOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-lg" onClick={onClose} />
      <div className="relative w-full max-w-lg fade-in">{children}</div>
    </div>
  );
}

export function GameHeader({ icon, title, subtitle, onClose, rightElement }: {
  icon: string; title: string; subtitle?: string; onClose: () => void; rightElement?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <span className="font-bold text-white text-sm block leading-tight">{title}</span>
          {subtitle && <span className="text-[10px] text-slate-500">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

export function ScoreDisplay({ p1Score, p2Score }: { p1Score: number; p2Score: number }) {
  return (
    <span className="text-xs text-amber-400 font-bold font-mono">{p1Score} - {p2Score}</span>
  );
}

export function ProgressBar({ value, max, color = 'from-violet-500 to-fuchsia-500', isLow = false }: {
  value: number; max: number; color?: string; isLow?: boolean;
}) {
  const pct = (value / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <svg className={`w-3.5 h-3.5 ${isLow ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-red-500' : `bg-gradient-to-r ${color}`}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold min-w-[24px] text-right ${isLow ? 'text-red-400' : 'text-white'}`}>{value}s</span>
    </div>
  );
}

export function ActionButton({ onClick, disabled, children, color = 'from-violet-600 to-fuchsia-600', className = '' }: {
  onClick: () => void; disabled?: boolean; children: ReactNode; color?: string; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl bg-gradient-to-r ${color} text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );
}

export function PlayerAvatar({ src, name, size = 'sm', ring = 'ring-violet-400' }: {
  src: string; name: string; size?: 'sm' | 'md' | 'lg'; ring?: string;
}) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' };
  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden ring-2 ${ring}`}>
      <img src={src} alt={name} className="w-full h-full object-cover" />
    </div>
  );
}

// Prompt data for each game - curated from real-world game research

export const ROAST_PROMPTS = [
  { category: 'Profile Pic', prompt: "Roast their profile picture - make it sting! 🔥" },
  { category: 'Bio Burn', prompt: "Roast their bio - what does it really say about them?" },
  { category: 'Whole Vibe', prompt: "Final round: Roast their ENTIRE vibe! 🔥🔥🔥" },
  { category: 'Fashion', prompt: "Roast their style choices - what were they thinking?" },
  { category: 'Energy', prompt: "Roast the energy they give off - be brutal!" },
  { category: 'Aesthetic', prompt: "Their whole aesthetic is... roast it!" },
];

export const HOT_TAKE_CATEGORIES = [
  'Food & Drink', 'Social Media', 'Technology', 'Relationships', 'Pop Culture', 'Everyday Life', 'Work & Career', 'Entertainment'
];

export const HOT_TAKE_BANK = [
  { text: 'Pineapple on pizza is elite', category: 'Food & Drink' },
  { text: 'Social media is making us lonely', category: 'Social Media' },
  { text: 'AI will replace most jobs in 5 years', category: 'Technology' },
  { text: 'Money CAN buy happiness', category: 'Everyday Life' },
  { text: 'Cancel culture went too far', category: 'Social Media' },
  { text: 'Anime is better than live action', category: 'Entertainment' },
  { text: 'Cereal is a soup', category: 'Food & Drink' },
  { text: 'Dogs are overrated, cats are superior', category: 'Everyday Life' },
  { text: 'Remote work is less productive', category: 'Work & Career' },
  { text: 'Marvel movies are mid', category: 'Pop Culture' },
  { text: 'TikTok is better than YouTube', category: 'Social Media' },
  { text: 'Pizza rolls > pizza', category: 'Food & Drink' },
  { text: 'Night owls are more creative than early birds', category: 'Everyday Life' },
  { text: 'Texting > calling always', category: 'Relationships' },
  { text: 'Reboots never live up to the original', category: 'Entertainment' },
  { text: 'Mondays are actually the best day', category: 'Work & Career' },
  { text: 'Instagram is just ads now', category: 'Social Media' },
  { text: 'Fast food breakfast is top tier', category: 'Food & Drink' },
  { text: 'Streaming made TV worse', category: 'Entertainment' },
  { text: 'Being single > being in a relationship', category: 'Relationships' },
];

export const FIRST_IMPRESSION_QUESTIONS = [
  { question: "What's their dream vacation?", options: ['Beach resort', 'Mountain cabin', 'City exploration', 'Staycation'] },
  { question: "What's their guilty pleasure?", options: ['Reality TV', 'Junk food', 'Shopping', 'Napping'] },
  { question: "What job would they have in another life?", options: ['DJ', 'Chef', 'Astronaut', 'Therapist'] },
  { question: "What's their go-to karaoke song?", options: ['Pop banger', '90s throwback', 'Emo anthem', 'Rap classic'] },
  { question: "What's their spirit animal?", options: ['Cat', 'Dog', 'Eagle', 'Dolphin'] },
  { question: "What's their weekend vibe?", options: ['Clubbing', 'Netflix binge', 'Hiking', 'Brunch'] },
  { question: "What would they spend $1000 on?", options: ['Clothes', 'Tech', 'Travel', 'Food'] },
  { question: "What's their dating app bio say?", options: ['"Looking for my person"', '"Here for a good time"', '"Not like other girls/guys"', '"6ft since it matters"'] },
];

export const VIBE_CHECK_QUESTIONS = [
  { question: "Morning energy?", options: ['🌅 Zen master', '⚡ Chaotic gremlin', '😴 Walking zombie', '🧘 Slow & steady'] },
  { question: "Weekend mood?", options: ['🎉 Party animal', '🛋️ Couch potato', '🌲 Nature lover', '🎨 Creative mode'] },
  { question: "Your aesthetic?", options: ['✨ Clean & minimal', '🎨 Color explosion', '🖤 Dark & moody', '🌈 Maximalist chaos'] },
  { question: "Spirit animal?", options: ['🐱 Independent cat', '🐶 Loyal dog', '🦋 Free butterfly', '🦊 Clever fox'] },
  { question: "Go-to snack?", options: ['🍕 Greasy goodness', '🥗 Healthy queen/king', '🍫 Sweet tooth', '🧂 Salty crunch'] },
  { question: "Communication style?", options: ['📱 Text novelist', '😂 Meme responder', '📞 Caller (rare)', '👻 Ghost then reply'] },
  { question: "Biggest flex?", options: ['💪 Fitness', '🧠 Knowledge', '🎨 Creativity', '😂 Humor'] },
  { question: "Love language?", options: ['💌 Words', '🤗 Physical touch', '🎁 Gifts', '⭐ Acts of service'] },
];

export const WHO_SAID_IT_QUOTES = [
  { quote: "I could eat pizza every day and not get tired of it", personality: 'Foodie' },
  { quote: "I don't need sleep, I need results", personality: 'Hustler' },
  { quote: "My dog is literally my best friend", personality: 'Pet lover' },
  { quote: "I've never lost an argument in my life", personality: 'Debater' },
  { quote: "Monday is the best day of the week", personality: 'Optimist' },
  { quote: "I cry at every movie and I'm proud", personality: 'Sensitive' },
  { quote: "If I could live in sweatpants I would", personality: 'Comfy' },
  { quote: "I have a spreadsheet for everything", personality: 'Organized' },
  { quote: "My camera roll is 90% memes", personality: 'Meme lord' },
  { quote: "I've been plotting my revenge since 2019", personality: 'Dramatic' },
  { quote: "Coffee is not a drink, it's a lifestyle", personality: 'Caffeinated' },
  { quote: "I treat my plants like my children", personality: 'Plant parent' },
];

export const CLAPBACK_STATEMENTS = [
  "You think you're all that",
  "Nobody asked for your opinion",
  "You could never pull this off",
  "Stay in your lane",
  "That's cute, but watch this",
  "You're trying too hard",
  "Who let you in here?",
  "That was barely mediocre",
];

export const TRUTH_PROMPTS = [
  "What's the last thing you searched on your phone?",
  "Have you ever stalked someone's profile?",
  "What's the most embarrassing song on your playlist?",
  "What's the weirdest DM you've ever received?",
  "What's a secret you've never told anyone?",
  "What's the last lie you told?",
  "What's the most childish thing you still do?",
  "Have you ever pretended to not see someone to avoid talking?",
  "What's the pettiest thing you've ever done?",
  "What's a red flag you ignore in people?",
];

export const DARE_PROMPTS = [
  "Do your best impression of your opponent",
  "Show us your most used emoji",
  "Text the last person you messaged 'I love you'",
  "Do your best robot dance",
  "Send a voice note singing the chorus of any song",
  "Share the last photo in your camera roll",
  "Type your last Google search out loud",
  "Do your best model walk",
  "Tell us your worst pickup line",
  "Make the ugliest face you can and screenshot it",
];

export const AURA_DROP_ITEMS = [
  { name: 'Golden Crown Effect', icon: '👑', rarity: 'legendary', color: 'from-yellow-400 to-amber-600' },
  { name: 'Rainbow Name Glow', icon: '🌈', rarity: 'epic', color: 'from-violet-400 to-pink-500' },
  { name: 'Diamond Badge', icon: '💎', rarity: 'epic', color: 'from-cyan-400 to-blue-600' },
  { name: 'Neon Border Frame', icon: '⚡', rarity: 'rare', color: 'from-green-400 to-emerald-600' },
  { name: 'Fire Avatar Ring', icon: '🔥', rarity: 'rare', color: 'from-red-400 to-orange-600' },
  { name: 'Star Dust Trail', icon: '✨', rarity: 'rare', color: 'from-amber-300 to-yellow-500' },
  { name: 'Silver Halo', icon: '😇', rarity: 'common', color: 'from-slate-300 to-slate-500' },
  { name: 'Basic Glow', icon: '💫', rarity: 'common', color: 'from-slate-400 to-slate-600' },
];

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

export const RARITY_BG: Record<string, string> = {
  common: 'bg-slate-500/20 border-slate-500/30',
  rare: 'bg-blue-500/20 border-blue-500/30',
  epic: 'bg-purple-500/20 border-purple-500/30',
  legendary: 'bg-yellow-500/20 border-yellow-500/30',
};
