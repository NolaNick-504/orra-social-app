'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameOverlay,
  GameHeader,
  ActionButton,
  GameProps,
} from './game-types';

// ============================================
// STORY CHALLENGE - DATA & TYPES
// ============================================

type StoryCategory = 'Embarrassing' | 'Wild' | 'Talent' | 'Weird';

interface StoryPrompt {
  category: StoryCategory;
  prompt: string;
  emoji: string;
}

interface CommunityStory {
  id: string;
  author: string;
  avatar: string;
  text: string;
  votes: number;
  isFeatured: boolean;
  voted: boolean;
}

const STORY_PROMPTS: StoryPrompt[] = [
  { category: 'Embarrassing', prompt: "What's the most embarrassing text you've sent to the wrong person?", emoji: '😳' },
  { category: 'Embarrassing', prompt: "Tell us about a time you waved at someone who wasn't waving at you", emoji: '🙈' },
  { category: 'Embarrassing', prompt: "What's the most cringe thing you did to impress a crush?", emoji: '😅' },
  { category: 'Wild', prompt: "What's the craziest thing a stranger has ever said to you?", emoji: '🤯' },
  { category: 'Wild', prompt: "Tell us about your most unhinged late-night decision", emoji: '🌙' },
  { category: 'Wild', prompt: "What's the most surreal situation you've ever found yourself in?", emoji: '🌀' },
  { category: 'Talent', prompt: "What's your weirdest hidden talent?", emoji: '🎯' },
  { category: 'Talent', prompt: "What can you do that nobody would guess from looking at you?", emoji: '✨' },
  { category: 'Talent', prompt: "What's a useless skill you're weirdly proud of?", emoji: '🎪' },
  { category: 'Weird', prompt: "What's the weirdest thing you've googled at 3am?", emoji: '🔍' },
  { category: 'Weird', prompt: "Tell us about your most bizarre food combination that actually slaps", emoji: '🍔' },
  { category: 'Weird', prompt: "What's the strangest habit you have that nobody knows about?", emoji: '🤫' },
];

const CATEGORY_COLORS: Record<StoryCategory, string> = {
  Embarrassing: 'from-pink-500 to-rose-600',
  Wild: 'from-orange-500 to-red-600',
  Talent: 'from-emerald-500 to-green-600',
  Weird: 'from-purple-500 to-violet-600',
};

const CATEGORY_ICONS: Record<StoryCategory, string> = {
  Embarrassing: '😳',
  Wild: '🔥',
  Talent: '⭐',
  Weird: '👁️',
};

// Simulated community stories
const SIMULATED_STORIES: Record<StoryCategory, CommunityStory[]> = {
  Embarrassing: [
    { id: 'cs1', author: 'midnight_scribbler', avatar: '', text: 'Sent "love you babe" to my boss. He replied "thanks, you too" and we never spoke of it again.', votes: 47, isFeatured: false, voted: false },
    { id: 'cs2', author: 'chaos_coordinator', avatar: '', text: 'Waved back at someone who was waving at the person behind me. Just kept waving and walked away.', votes: 32, isFeatured: false, voted: false },
    { id: 'cs3', author: 'awkward_penguin', avatar: '', text: 'Practiced my wedding speech in the car. My Bluetooth was connected to the speaker at work.', votes: 58, isFeatured: true, voted: false },
    { id: 'cs4', author: 'professional_mistake', avatar: '', text: 'Called my teacher "mom" in front of the entire class. I was 22.', votes: 25, isFeatured: false, voted: false },
    { id: 'cs5', author: 'oops_my_bad', avatar: '', text: 'Accidentally liked my ex\'s photo from 3 years ago at 2am. The notification was instant.', votes: 41, isFeatured: false, voted: false },
  ],
  Wild: [
    { id: 'cs6', author: 'adventure_awaits', avatar: '', text: 'A homeless man told me I looked like I needed a hug. He was right. Best hug of my life.', votes: 63, isFeatured: true, voted: false },
    { id: 'cs7', author: 'unfiltered_reality', avatar: '', text: 'A stranger at the airport asked me to hold their baby and then just... left for 20 minutes.', votes: 44, isFeatured: false, voted: false },
    { id: 'cs8', author: 'plot_twist_queen', avatar: '', text: 'Got pulled over. The cop turned out to be my middle school crush. Got a ticket AND embarrassed.', votes: 38, isFeatured: false, voted: false },
    { id: 'cs9', author: 'seriously_though', avatar: '', text: 'A guy at Walmart proposed to his girlfriend in the checkout line. She said no. The line clapped.', votes: 55, isFeatured: false, voted: false },
    { id: 'cs10', author: 'wild_card_99', avatar: '', text: 'Uber driver invited me to their family BBQ. Went. It was amazing. Still talk to them.', votes: 29, isFeatured: false, voted: false },
  ],
  Talent: [
    { id: 'cs11', author: 'flex_zone', avatar: '', text: 'I can recite the entire script of Shrek from memory. Every single line. Yes, including Donkey.', votes: 51, isFeatured: false, voted: false },
    { id: 'cs12', author: 'hidden_gem', avatar: '', text: 'I can solve a Rubik\'s cube in under a minute. With my eyes closed. Yes, really.', votes: 67, isFeatured: true, voted: false },
    { id: 'cs13', author: 'party_trick_pro', avatar: '', text: 'I can make any animal sound so realistic that actual animals respond. Dogs go CRAZY.', votes: 43, isFeatured: false, voted: false },
    { id: 'cs14', author: 'unlikely_skill', avatar: '', text: 'I can type 120 WPM but only if I\'m arguing with someone online. Motivation is key.', votes: 59, isFeatured: false, voted: false },
    { id: 'cs15', author: 'secret_weapon', avatar: '', text: 'I can fold a fitted sheet perfectly. That\'s right. The myth is real.', votes: 35, isFeatured: false, voted: false },
  ],
  Weird: [
    { id: 'cs16', author: '3am_researcher', avatar: '', text: '"Can you be allergic to a specific person" "Why does my cat judge me" "Is cereal a soup"', votes: 52, isFeatured: false, voted: false },
    { id: 'cs17', author: 'snack_scientist', avatar: '', text: 'Peanut butter and pickle sandwich. Trust me. Life-changing. Don\'t knock it till you try it.', votes: 46, isFeatured: false, voted: false },
    { id: 'cs18', author: 'strange_habits', avatar: '', text: 'I narrate my cooking like a nature documentary. "And here we see the rare spaghetti in its natural habitat"', votes: 71, isFeatured: true, voted: false },
    { id: 'cs19', author: 'weirdly_specific', avatar: '', text: 'I organize my bookshelf by the color of the covers. It looks beautiful. Finding anything is impossible.', votes: 33, isFeatured: false, voted: false },
    { id: 'cs20', author: 'no_shame_game', avatar: '', text: 'I talk to my houseplants by name. Gerald is thriving but Linda is going through something.', votes: 48, isFeatured: false, voted: false },
  ],
};

// Word cloud data for popular themes
const WORD_CLOUD_DATA = [
  { word: 'embarrassing', size: 28, color: 'text-pink-400' },
  { word: 'cringe', size: 22, color: 'text-rose-400' },
  { word: 'awkward', size: 24, color: 'text-fuchsia-400' },
  { word: 'mistake', size: 18, color: 'text-violet-400' },
  { word: '2am', size: 20, color: 'text-purple-400' },
  { word: 'oops', size: 16, color: 'text-indigo-400' },
  { word: 'stranger', size: 19, color: 'text-emerald-400' },
  { word: 'wild', size: 21, color: 'text-green-400' },
  { word: 'hidden', size: 17, color: 'text-teal-400' },
  { word: 'secret', size: 15, color: 'text-cyan-400' },
  { word: 'weird', size: 23, color: 'text-amber-400' },
  { word: 'never again', size: 14, color: 'text-orange-400' },
];

// Helper: pick a random prompt
function pickRandomPrompt(): StoryPrompt {
  return STORY_PROMPTS[Math.floor(Math.random() * STORY_PROMPTS.length)];
}

// Helper: build community stories list
function buildCommunityStories(category: StoryCategory, userName: string, userAvatar: string, userStoryText: string): CommunityStory[] {
  const stories = SIMULATED_STORIES[category] || [];
  const userStory: CommunityStory = {
    id: 'user_story',
    author: userName,
    avatar: userAvatar,
    text: userStoryText,
    votes: Math.floor(Math.random() * 30) + 10,
    isFeatured: false,
    voted: false,
  };
  return [...stories, userStory].sort(() => Math.random() - 0.5);
}

// ============================================
// STORY CHALLENGE - GAME COMPONENT
// ============================================

type GamePhase = 'intro' | 'prompt_reveal' | 'writing' | 'submitted' | 'reading' | 'results';

export default function StoryChallengeGame({ onClose, currentUser, callbacks, accentColor, tokenReward, xpReward }: GameProps) {
  // Use lazy initializer for random prompt to avoid effect-based setState
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [todayPrompt, setTodayPrompt] = useState<StoryPrompt>(pickRandomPrompt);
  const [storyText, setStoryText] = useState('');
  const [communityStories, setCommunityStories] = useState<CommunityStory[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [userStoryVotes, setUserStoryVotes] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promptRevealed, setPromptRevealed] = useState(false);

  const maxChars = 280;
  const hasSubmitted = useRef(false);
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated prompt reveal - triggered by entering prompt_reveal phase
  const startPromptReveal = useCallback(() => {
    setRevealProgress(0);
    setPromptRevealed(false);

    if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);

    revealIntervalRef.current = setInterval(() => {
      setRevealProgress(prev => {
        if (prev >= 100) {
          if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
          setPromptRevealed(true);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
  }, []);

  // After prompt is revealed, auto-advance to writing
  useEffect(() => {
    if (promptRevealed && phase === 'prompt_reveal') {
      const t = setTimeout(() => setPhase('writing'), 800);
      return () => clearTimeout(t);
    }
  }, [promptRevealed, phase]);

  // Load community stories when entering reading phase
  const enterReadingPhase = useCallback(() => {
    const stories = buildCommunityStories(todayPrompt.category, currentUser.name, currentUser.avatar, storyText);
    setCommunityStories(stories);
    setCurrentStoryIndex(0);
    setPhase('reading');
  }, [todayPrompt.category, currentUser.name, currentUser.avatar, storyText]);

  const handleSubmitStory = useCallback(() => {
    if (hasSubmitted.current || !storyText.trim()) return;
    hasSubmitted.current = true;
    setIsSubmitting(true);

    callbacks.submitToServer(1, storyText);

    setTimeout(() => {
      setIsSubmitting(false);
      enterReadingPhase();
    }, 1200);
  }, [storyText, callbacks, enterReadingPhase]);

  const handleVote = useCallback((storyId: string) => {
    setCommunityStories(prev =>
      prev.map(s => {
        if (s.id === storyId && !s.voted) {
          return { ...s, votes: s.votes + 1, voted: true };
        }
        return s;
      })
    );
    callbacks.submitVote(storyId, 'upvote');
  }, [callbacks]);

  const handleFinishReading = useCallback(() => {
    // Calculate user's story results
    const userStory = communityStories.find(s => s.id === 'user_story');
    const userVotes = userStory?.votes || 0;
    setUserStoryVotes(userVotes);

    // Check if featured (top voted)
    const maxVotes = Math.max(...communityStories.map(s => s.votes));
    const featured = userVotes >= maxVotes;
    setIsFeatured(featured);

    setPhase('results');
  }, [communityStories]);

  const handleComplete = useCallback(() => {
    const bonusTokens = isFeatured ? tokenReward + 10 : tokenReward;
    const bonusXP = isFeatured ? xpReward + 5 : xpReward;

    callbacks.earnTokens(bonusTokens, 'story_challenge');
    callbacks.addXP(bonusXP);
    callbacks.showToast(
      isFeatured
        ? `🌟 Story of the Day! +${bonusTokens} ORRA +${bonusXP} XP`
        : `📖 Great story! +${bonusTokens} ORRA +${bonusXP} XP`,
      { duration: 1500 }
    );
    callbacks.completeGame(userStoryVotes, isFeatured);
    // Close the game overlay after collecting rewards
    setTimeout(() => onClose(), 300);
  }, [isFeatured, tokenReward, xpReward, callbacks, userStoryVotes, onClose]);

  const handleEnterPromptReveal = useCallback(() => {
    // Re-roll prompt for variety
    setTodayPrompt(pickRandomPrompt());
    setPromptRevealed(false);
    setPhase('prompt_reveal');
    startPromptReveal();
  }, [startPromptReveal]);

  const charCount = storyText.length;
  const charPercentage = (charCount / maxChars) * 100;
  const charColor = charPercentage > 90 ? 'text-red-400' : charPercentage > 75 ? 'text-amber-400' : 'text-emerald-400';
  const charBarColor = charPercentage > 90 ? 'bg-red-500' : charPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500';

  const currentReadingStory = communityStories[currentStoryIndex];

  // ============================================
  // INTRO PHASE
  // ============================================
  if (phase === 'intro') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 text-center fade-in">
          <GameHeader
            icon="📖"
            title="Story Challenge"
            subtitle="Daily writing prompt"
            onClose={onClose}
          />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
            📖
          </div>
          <h2 className="text-2xl font-black text-white mb-1">Story Challenge</h2>
          <p className="text-sm text-slate-400 mb-4">Write your story. Get votes. Earn glory.</p>

          <div className="flex items-center justify-center gap-3 mb-4 p-3 rounded-xl bg-white/5">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">{tokenReward}</p>
              <p className="text-[9px] text-slate-500">Tokens</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-violet-400">{xpReward}</p>
              <p className="text-[9px] text-slate-500">XP</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">280</p>
              <p className="text-[9px] text-slate-500">Max chars</p>
            </div>
          </div>

          {/* Category badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {(['Embarrassing', 'Wild', 'Talent', 'Weird'] as StoryCategory[]).map(cat => (
              <span
                key={cat}
                className={`px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${CATEGORY_COLORS[cat]} text-white`}
              >
                {CATEGORY_ICONS[cat]} {cat}
              </span>
            ))}
          </div>

          <ActionButton onClick={handleEnterPromptReveal} color="from-emerald-600 to-green-600">
            🎲 Today&apos;s Prompt
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // PROMPT REVEAL PHASE (animated)
  // ============================================
  if (phase === 'prompt_reveal') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 text-center fade-in">
          <GameHeader
            icon="📖"
            title="Story Challenge"
            subtitle="Today's prompt"
            onClose={onClose}
          />

          <div className="my-6">
            {/* Category badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[todayPrompt.category]} text-white text-sm font-bold mb-4`}>
              {CATEGORY_ICONS[todayPrompt.category]} {todayPrompt.category}
            </div>

            {/* Prompt text with animated reveal */}
            <div className="relative p-6 rounded-xl bg-white/5 border border-white/10 min-h-[120px] flex items-center justify-center overflow-hidden">
              {/* Progress bar at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                <div
                  className={`h-full bg-gradient-to-r ${CATEGORY_COLORS[todayPrompt.category]} transition-all duration-100`}
                  style={{ width: `${revealProgress}%` }}
                />
              </div>

              {/* Emoji */}
              <div className="absolute top-3 left-3 text-2xl opacity-30">
                {todayPrompt.emoji}
              </div>

              {/* Prompt text */}
              <p
                className="text-lg font-bold text-white leading-relaxed px-4 transition-opacity duration-500"
                style={{ opacity: revealProgress > 50 ? 1 : 0.3 }}
              >
                {todayPrompt.prompt}
              </p>
            </div>

            {/* Decorative floating elements */}
            {promptRevealed && (
              <div className="mt-4 flex justify-center gap-2 animate-bounce">
                <span className="text-2xl">✍️</span>
                <span className="text-sm text-emerald-400 font-medium self-center">Your turn!</span>
                <span className="text-2xl">✨</span>
              </div>
            )}
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // WRITING PHASE
  // ============================================
  if (phase === 'writing') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 fade-in">
          <GameHeader
            icon="📖"
            title="Story Challenge"
            subtitle={`${todayPrompt.emoji} ${todayPrompt.category}`}
            onClose={onClose}
            rightElement={
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                WRITING
              </span>
            }
          />

          {/* Today's prompt */}
          <div className={`p-3 rounded-xl bg-gradient-to-r ${CATEGORY_COLORS[todayPrompt.category]} bg-opacity-20 border border-white/10 mb-4`}>
            <p className="text-sm font-bold text-white text-center">{todayPrompt.prompt}</p>
          </div>

          {/* Text area */}
          <div className="relative mb-3">
            <textarea
              value={storyText}
              onChange={e => {
                if (e.target.value.length <= maxChars) {
                  setStoryText(e.target.value);
                }
              }}
              placeholder="Write your story here... make it count!"
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              maxLength={maxChars}
            />

            {/* Character counter */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {/* Mini progress bar */}
              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${charBarColor}`}
                  style={{ width: `${Math.min(charPercentage, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono font-bold ${charColor}`}>
                {maxChars - charCount}
              </span>
            </div>
          </div>

          {/* Character counter visual ring */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke={charPercentage > 90 ? '#ef4444' : charPercentage > 75 ? '#f59e0b' : '#10b981'}
                  strokeWidth="3"
                  strokeDasharray={`${charPercentage * 0.974} 97.4`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="transition-all duration-200"
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <span className="text-xs text-slate-400">{charCount}/{maxChars}</span>
            </div>
            <span className="text-[10px] text-slate-500">Keep it short & punchy!</span>
          </div>

          <ActionButton
            onClick={handleSubmitStory}
            disabled={!storyText.trim() || isSubmitting}
            color="from-emerald-600 to-green-600"
          >
            {isSubmitting ? (
              <>Submitting... ✨</>
            ) : (
              <>Submit Story 📝</>
            )}
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // SUBMITTED PHASE (brief transition)
  // ============================================
  if (phase === 'submitted') {
    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 text-center fade-in">
          <GameHeader
            icon="📖"
            title="Story Challenge"
            onClose={onClose}
          />
          <div className="my-8">
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-xl font-black text-white mb-2">Story Submitted!</h3>
            <p className="text-sm text-slate-400">Now read and vote on other stories</p>
          </div>
          <ActionButton onClick={enterReadingPhase} color="from-emerald-600 to-green-600">
            Read Stories 👀
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // READING & VOTING PHASE
  // ============================================
  if (phase === 'reading') {
    const totalStories = communityStories.length;
    const story = currentReadingStory;

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 fade-in">
          <GameHeader
            icon="📖"
            title="Story Challenge"
            subtitle={`${todayPrompt.emoji} Community Stories`}
            onClose={onClose}
            rightElement={
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                {currentStoryIndex + 1}/{totalStories}
              </span>
            }
          />

          {/* Story progress dots */}
          <div className="flex justify-center gap-1.5 mb-4">
            {communityStories.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === currentStoryIndex
                    ? 'bg-emerald-400 w-6'
                    : i < currentStoryIndex
                      ? 'bg-emerald-400/40'
                      : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {story && (
            <div
              className={`relative p-4 rounded-xl border transition-all duration-300 mb-4 ${
                story.id === 'user_story'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {/* Featured badge */}
              {story.isFeatured && (
                <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-[9px] font-black text-white">
                  ⭐ FEATURED
                </div>
              )}

              {/* Your story indicator */}
              {story.id === 'user_story' && (
                <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-500/40 text-[9px] font-bold text-emerald-400">
                  YOUR STORY
                </div>
              )}

              {/* Author info */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full overflow-hidden ring-2 ${
                  story.id === 'user_story' ? 'ring-emerald-400' : 'ring-white/20'
                } bg-white/10 flex items-center justify-center`}>
                  {story.avatar ? (
                    <img src={story.avatar} alt={story.author} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      {story.author.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-white">@{story.author}</span>
                {story.isFeatured && <span className="text-yellow-400 text-xs">⭐</span>}
              </div>

              {/* Story text */}
              <p className="text-sm text-white/90 leading-relaxed mb-3">{story.text}</p>

              {/* Vote section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">{story.votes}</span>
                  <span className="text-[10px] text-slate-400">votes</span>
                </div>
                <button
                  onClick={() => handleVote(story.id)}
                  disabled={story.voted}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    story.voted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/10 text-white hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10'
                  }`}
                >
                  {story.voted ? '✓ Voted' : '👍 Upvote'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2">
            {currentStoryIndex > 0 ? (
              <button
                onClick={() => setCurrentStoryIndex(prev => prev - 1)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition-all"
              >
                ← Prev
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {currentStoryIndex < totalStories - 1 ? (
              <button
                onClick={() => setCurrentStoryIndex(prev => prev + 1)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-sm hover:opacity-90 transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleFinishReading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-sm hover:opacity-90 transition-all"
              >
                See Results 🏆
              </button>
            )}
          </div>
        </div>
      </GameOverlay>
    );
  }

  // ============================================
  // RESULTS PHASE
  // ============================================
  if (phase === 'results') {
    // Find the top story for "Story of the Day"
    const sortedStories = [...communityStories].sort((a, b) => b.votes - a.votes);
    const storyOfTheDay = sortedStories[0];
    const userRank = sortedStories.findIndex(s => s.id === 'user_story') + 1;

    return (
      <GameOverlay onClose={onClose}>
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 text-center fade-in">
          <GameHeader
            icon="📖"
            title="Story Challenge"
            subtitle="Results"
            onClose={onClose}
          />

          {/* Featured badge */}
          {isFeatured && (
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-sm font-black text-white animate-pulse">
              ⭐ STORY OF THE DAY ⭐
            </div>
          )}

          {/* User's story result */}
          <div className={`p-4 rounded-xl border mb-4 ${isFeatured ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
            <p className="text-xs text-slate-400 mb-1">Your Story</p>
            <p className="text-sm text-white font-medium mb-2 line-clamp-3">{storyText}</p>
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-2xl font-black text-emerald-400">{userStoryVotes}</p>
                <p className="text-[9px] text-slate-500">Votes</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-black text-amber-400">#{userRank}</p>
                <p className="text-[9px] text-slate-500">Rank</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-black text-violet-400">{isFeatured ? '⭐' : '📖'}</p>
                <p className="text-[9px] text-slate-500">{isFeatured ? 'Featured' : 'Submitted'}</p>
              </div>
            </div>
          </div>

          {/* Word cloud */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
            <p className="text-xs text-slate-400 mb-3 font-medium">Popular Themes</p>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
              {WORD_CLOUD_DATA.map((item, i) => (
                <span
                  key={i}
                  className={`${item.color} font-bold leading-tight`}
                  style={{ fontSize: `${item.size * 0.55}px` }}
                >
                  {item.word}
                </span>
              ))}
            </div>
          </div>

          {/* Story of the Day */}
          {storyOfTheDay && storyOfTheDay.id !== 'user_story' && (
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
              <p className="text-[10px] text-yellow-400 font-bold mb-1">🏆 STORY OF THE DAY</p>
              <p className="text-xs text-white">{storyOfTheDay.text}</p>
              <p className="text-[10px] text-slate-400 mt-1">by @{storyOfTheDay.author} • {storyOfTheDay.votes} votes</p>
            </div>
          )}

          {/* Rewards */}
          <div className="flex items-center justify-center gap-3 mb-4 p-3 rounded-xl bg-white/5">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">+{isFeatured ? tokenReward + 10 : tokenReward}</p>
              <p className="text-[9px] text-slate-500">ORRA</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-bold text-violet-400">+{isFeatured ? xpReward + 5 : xpReward}</p>
              <p className="text-[9px] text-slate-500">XP</p>
            </div>
          </div>

          <ActionButton onClick={handleComplete} color="from-emerald-600 to-green-600">
            Claim Rewards 🎁
          </ActionButton>
        </div>
      </GameOverlay>
    );
  }

  return null;
}
