'use client';

import { useState, useCallback } from 'react';
import {
  GameOverlay,
  GameHeader,
  ActionButton,
  PlayerAvatar,
} from './game-types';
import type { GameProps } from './game-types';

// ============================================
// TYPES
// ============================================

type GamePhase = 'mode-select' | 'rate' | 'rate-reveal' | 'submit' | 'submit-success' | 'leaderboard' | 'results';

interface FitItem {
  id: string;
  userName: string;
  userAvatar: string;
  userHandle: string;
  theme: string;
  caption: string;
  imageUrl: string;
  communityAvg: number;
  totalRatings: number;
}

interface RatingRecord {
  fitId: string;
  yourRating: number;
  communityAvg: number;
  diff: number;
}

// ============================================
// DATA
// ============================================

const FIT_THEMES = [
  'Casual Friday',
  'Night Out',
  'Streetwear',
  'Office Chic',
  'Festival Vibes',
  'Date Night',
  'Gym Flex',
  'Lazy Sunday',
  'Vintage Drip',
  'Y2K Revival',
];

const MOCK_FITS: FitItem[] = [
  {
    id: 'fit1',
    userName: 'Zara',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara&backgroundColor=b6e3f4',
    userHandle: '@zara_style',
    theme: 'Streetwear',
    caption: 'Oversized everything + chunky kicks 👟',
    imageUrl: '',
    communityAvg: 7.4,
    totalRatings: 234,
  },
  {
    id: 'fit2',
    userName: 'Marcus',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede',
    userHandle: '@marc_fit',
    theme: 'Night Out',
    caption: 'All black everything. You already know 🖤',
    imageUrl: '',
    communityAvg: 8.1,
    totalRatings: 189,
  },
  {
    id: 'fit3',
    userName: 'Luna',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffd5dc',
    userHandle: '@luna_drip',
    theme: 'Vintage Drip',
    caption: 'Thrifting is my cardio 🎀',
    imageUrl: '',
    communityAvg: 6.8,
    totalRatings: 312,
  },
  {
    id: 'fit4',
    userName: 'Kai',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai&backgroundColor=d1f4d1',
    userHandle: '@kai_closet',
    theme: 'Casual Friday',
    caption: 'Business on top, party on the bottom 😎',
    imageUrl: '',
    communityAvg: 7.9,
    totalRatings: 156,
  },
  {
    id: 'fit5',
    userName: 'Nia',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nia&backgroundColor=ffd5dc',
    userHandle: '@nia_vibes',
    theme: 'Festival Vibes',
    caption: 'Sequins and cowboy boots ✨🤠',
    imageUrl: '',
    communityAvg: 9.2,
    totalRatings: 428,
  },
];

const LEADERBOARD_DATA = [
  { rank: 1, name: 'Nia', handle: '@nia_vibes', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nia&backgroundColor=ffd5dc', avgScore: 9.2, theme: 'Festival Vibes', badge: '👑 Fit God' },
  { rank: 2, name: 'Marcus', handle: '@marc_fit', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede', avgScore: 8.1, theme: 'Night Out', badge: '🔥 Hot Fit' },
  { rank: 3, name: 'Kai', handle: '@kai_closet', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai&backgroundColor=d1f4d1', avgScore: 7.9, theme: 'Casual Friday', badge: '✨ Stylish' },
  { rank: 4, name: 'Zara', handle: '@zara_style', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara&backgroundColor=b6e3f4', avgScore: 7.4, theme: 'Streetwear', badge: '👀 Solid' },
  { rank: 5, name: 'Luna', handle: '@luna_drip', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffd5dc', avgScore: 6.8, theme: 'Vintage Drip', badge: '💫 Unique' },
];

const TOTAL_FITS_TO_RATE = 5;

// ============================================
// STAR RATING COMPONENT
// ============================================

function StarRating({ value, onChange, readonly = false, size = 'md' }: {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-9 h-9' };
  const displayValue = Math.round(value * 2) / 2; // round to nearest 0.5

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
        const filled = star <= displayValue;
        const halfFilled = !filled && star - 0.5 <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform disabled:opacity-100`}
          >
            <svg
              className={`${sizeClasses[size]} transition-colors ${
                filled
                  ? 'text-amber-400 fill-amber-400'
                  : halfFilled
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-slate-600 fill-transparent'
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// RATING SLIDER COMPONENT
// ============================================

function RatingSlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  return (
    <div className="w-full px-1">
      <div className="relative w-full h-3 rounded-full bg-white/10 mb-2">
        {/* Gradient track */}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-150"
          style={{ width: `${(value / 10) * 100}%` }}
        />
        {/* Thumb */}
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {/* Visible thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-lg shadow-amber-500/30 border-2 border-amber-400 transition-all duration-150 pointer-events-none flex items-center justify-center"
          style={{ left: `${(value / 10) * 100}%` }}
        >
          <span className="text-[8px] font-black text-amber-600">{value}</span>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 px-0.5">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

// ============================================
// FIT CARD COMPONENT
// ============================================

function FitCard({ fit, isPlaceholder }: { fit: FitItem; isPlaceholder?: boolean }) {
  return (
    <div className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Photo area */}
      <div className="aspect-[4/5] bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center">
        {isPlaceholder ? (
          <div className="text-center">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-xs text-slate-600">Fit Photo</span>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-5xl mb-2 block">👗</span>
            <span className="text-xs text-slate-500">{fit.theme}</span>
          </div>
        )}

        {/* Theme tag */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-bold text-white">
            {fit.theme}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <PlayerAvatar src={fit.userAvatar} name={fit.userName} size="sm" ring="ring-slate-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{fit.userName}</p>
            <p className="text-[10px] text-slate-500">{fit.userHandle}</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{fit.caption}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function RateMyFitGame({
  onClose,
  currentUser,
  opponent,
  isVsBot,
  gameSessionId,
  tokenReward,
  xpReward,
  callbacks,
  accentColor,
}: GameProps) {
  // ---- State ----
  const [phase, setPhase] = useState<GamePhase>('mode-select');
  const [currentFitIndex, setCurrentFitIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState(5);
  const [ratingRecords, setRatingRecords] = useState<RatingRecord[]>([]);
  const [submitTheme, setSubmitTheme] = useState('');
  const [submitCaption, setSubmitCaption] = useState('');
  const [submittedFits, setSubmittedFits] = useState<Array<{ theme: string; caption: string }>>([]);

  // Fits to rate (use mock data)
  const [fits] = useState<FitItem[]>(() => {
    const shuffled = [...MOCK_FITS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_FITS_TO_RATE);
  });

  const currentFit = fits[currentFitIndex];

  // ---- Handlers ----
  const handleSelectRateMode = () => {
    setPhase('rate');
    setCurrentRating(5);
  };

  const handleSelectSubmitMode = () => {
    setPhase('submit');
  };

  const handleSubmitRating = () => {
    if (!currentFit) return;

    const diff = Math.round((currentRating - currentFit.communityAvg) * 10) / 10;
    const record: RatingRecord = {
      fitId: currentFit.id,
      yourRating: currentRating,
      communityAvg: currentFit.communityAvg,
      diff,
    };

    setRatingRecords((prev) => [...prev, record]);
    callbacks.submitToServer(currentFitIndex + 1, String(currentRating), isVsBot);
    setPhase('rate-reveal');
  };

  const handleNextFit = () => {
    if (currentFitIndex + 1 >= TOTAL_FITS_TO_RATE) {
      setPhase('results');
      return;
    }
    setCurrentFitIndex((prev) => prev + 1);
    setCurrentRating(5);
    setPhase('rate');
  };

  const handleSubmitFit = () => {
    if (!submitTheme || !submitCaption.trim()) {
      callbacks.showToast('Pick a theme and write a caption!', { duration: 2000 });
      return;
    }

    setSubmittedFits((prev) => [...prev, { theme: submitTheme, caption: submitCaption.trim() }]);
    callbacks.earnTokens(3, 'Rate My Fit - Submit');
    callbacks.addXP(5);
    callbacks.showToast('Your fit is live! +3 ORRA +5 XP 🔥', { duration: 2500 });
    setSubmitTheme('');
    setSubmitCaption('');
    setPhase('submit-success');
  };

  const handleFinish = () => {
    const tokensEarned = ratingRecords.length * 2 + submittedFits.length * 3;
    callbacks.earnTokens(tokenReward, 'Rate My Fit Game');
    callbacks.addXP(xpReward);
    callbacks.completeGame(tokensEarned, true);
    onClose();
  };

  // ---- Computed ----
  const getComparisonText = (diff: number): string => {
    if (Math.abs(diff) < 0.5) return "You're spot on with the community!";
    if (diff > 0) return `You rated ${Math.abs(diff).toFixed(1)} higher — you're generous! 🤗`;
    return `You rated ${Math.abs(diff).toFixed(1)} lower — you're harsh! 😤`;
  };

  const getComparisonEmoji = (diff: number): string => {
    if (Math.abs(diff) < 0.5) return '🎯';
    if (diff > 0) return '🤗';
    return '😤';
  };

  // ---- Render ----
  return (
    <GameOverlay onClose={onClose}>
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <GameHeader
          icon="👗"
          title="Rate My Fit"
          subtitle={phase === 'rate' || phase === 'rate-reveal' ? `Fit ${currentFitIndex + 1}/${TOTAL_FITS_TO_RATE}` : undefined}
          onClose={onClose}
        />

        {/* ========== MODE SELECT ========== */}
        {phase === 'mode-select' && (
          <div className="p-4 sm:p-6 fade-in">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-600 to-rose-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-pink-500/30">
                <span className="text-3xl">👗</span>
              </div>
              <h2 className="text-xl font-black text-white mb-1">Rate My Fit</h2>
              <p className="text-sm text-slate-400">Judge fits or show off yours!</p>
            </div>

            <div className="space-y-3">
              {/* Rate mode card */}
              <button
                onClick={handleSelectRateMode}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 hover:border-violet-500/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Rate Fits</h3>
                    <p className="text-xs text-slate-400">Judge 5 fits and see how you compare to the community</p>
                  </div>
                </div>
              </button>

              {/* Submit mode card */}
              <button
                onClick={handleSelectSubmitMode}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-pink-600/20 to-rose-600/20 border border-pink-500/30 hover:border-pink-500/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Post Your Fit</h3>
                    <p className="text-xs text-slate-400">Show off your style and get rated by the community</p>
                  </div>
                </div>
              </button>

              {/* Leaderboard card */}
              <button
                onClick={() => setPhase('leaderboard')}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 hover:border-amber-500/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Top Fits Today</h3>
                    <p className="text-xs text-slate-400">See who&apos;s leading the daily leaderboard</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ========== RATE PHASE ========== */}
        {phase === 'rate' && currentFit && (
          <div className="p-4 sm:p-6 fade-in">
            {/* Fit Card */}
            <div className="mb-4">
              <FitCard fit={currentFit} />
            </div>

            {/* Rating Section */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-400 text-center mb-3">How would you rate this fit?</p>

              {/* Slider */}
              <RatingSlider value={currentRating} onChange={setCurrentRating} />

              {/* Large rating display */}
              <div className="text-center mt-3 mb-3">
                <span className="text-4xl font-black text-white">{currentRating.toFixed(1)}</span>
                <span className="text-lg text-slate-500">/10</span>
              </div>

              {/* Quick star rating */}
              <div className="flex justify-center">
                <StarRating value={Math.round(currentRating)} onChange={(val) => setCurrentRating(val)} size="sm" />
              </div>
            </div>

            <ActionButton onClick={handleSubmitRating} disabled={currentRating < 1} color="from-pink-600 to-rose-600">
              <span>Submit Rating</span>
              <span>⭐</span>
            </ActionButton>
          </div>
        )}

        {/* ========== RATE REVEAL PHASE ========== */}
        {phase === 'rate-reveal' && currentFit && ratingRecords.length > 0 && (
          <div className="p-4 sm:p-6 fade-in">
            {/* Last rating result */}
            {(() => {
              const lastRecord = ratingRecords[ratingRecords.length - 1];
              const isFitGod = lastRecord.communityAvg >= 9.0;
              return (
                <>
                  {/* Comparison card */}
                  <div className="text-center mb-4">
                    <span className="text-4xl block mb-2">{getComparisonEmoji(lastRecord.diff)}</span>
                    <h3 className="text-lg font-bold text-white mb-1">{getComparisonText(lastRecord.diff)}</h3>
                  </div>

                  {/* Score comparison */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Your Rating</p>
                        <p className={`text-3xl font-black ${
                          lastRecord.diff > 0 ? 'text-emerald-400' : lastRecord.diff < -0.5 ? 'text-red-400' : 'text-white'
                        }`}>
                          {lastRecord.yourRating.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Community Avg</p>
                        <p className="text-3xl font-black text-amber-400">
                          {lastRecord.communityAvg.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Community count */}
                    <div className="text-center mt-3">
                      <span className="text-[10px] text-slate-500">
                        Based on {currentFit.totalRatings} ratings
                      </span>
                    </div>
                  </div>

                  {/* Fit God badge */}
                  {isFitGod && (
                    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-3 mb-4 text-center">
                      <span className="text-2xl block mb-1">👑</span>
                      <span className="text-sm font-bold text-amber-400">Fit God Badge Earned!</span>
                      <p className="text-[10px] text-amber-400/70">This fit scored 9.0+ from the community</p>
                    </div>
                  )}

                  {/* Harsh vs generous indicator */}
                  {Math.abs(lastRecord.diff) >= 1 && (
                    <div className={`p-3 rounded-xl mb-4 text-center ${
                      lastRecord.diff < 0
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-emerald-500/10 border border-emerald-500/20'
                    }`}>
                      <p className={`text-xs font-bold ${
                        lastRecord.diff < 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {lastRecord.diff < 0
                          ? `You rated ${Math.abs(lastRecord.diff).toFixed(1)} lower — you're harsh! 😤`
                          : `You rated ${lastRecord.diff.toFixed(1)} higher — you're generous! 🤗`
                        }
                      </p>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Progress */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {Array.from({ length: TOTAL_FITS_TO_RATE }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i < ratingRecords.length
                      ? 'bg-amber-400'
                      : i === currentFitIndex
                        ? 'bg-white'
                        : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            <ActionButton
              onClick={handleNextFit}
              color="from-pink-600 to-rose-600"
            >
              {currentFitIndex + 1 >= TOTAL_FITS_TO_RATE ? (
                <>
                  <span>See Results</span>
                  <span>🏆</span>
                </>
              ) : (
                <>
                  <span>Next Fit</span>
                  <span>→</span>
                </>
              )}
            </ActionButton>
          </div>
        )}

        {/* ========== SUBMIT PHASE ========== */}
        {phase === 'submit' && (
          <div className="p-4 sm:p-6 fade-in">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white">Post Your Fit</h3>
              <p className="text-xs text-slate-400">Show off your style and earn tokens!</p>
            </div>

            {/* Theme selection */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Choose a Theme</label>
              <div className="flex flex-wrap gap-2">
                {FIT_THEMES.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSubmitTheme(theme)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      submitTheme === theme
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-500/20'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload area */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Your Fit Photo</label>
              <div className="aspect-[4/3] bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center hover:border-pink-500/40 transition-all cursor-pointer">
                <svg className="w-10 h-10 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m-4 4h8m5 4.5V7.5a2.5 2.5 0 00-2.5-2.5h-13A2.5 2.5 0 003 7.5v9a2.5 2.5 0 002.5 2.5h13a2.5 2.5 0 002.5-2.5z" />
                </svg>
                <span className="text-xs text-slate-500">Tap to upload your fit</span>
                <span className="text-[10px] text-slate-600 mt-1">JPG, PNG up to 10MB</span>
              </div>
            </div>

            {/* Caption */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Caption</label>
              <textarea
                value={submitCaption}
                onChange={(e) => setSubmitCaption(e.target.value)}
                placeholder="Describe your fit... what's the vibe? ✨"
                maxLength={120}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 resize-none min-h-[80px] leading-relaxed"
              />
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-slate-600">{submitCaption.length}/120</span>
              </div>
            </div>

            {/* Rewards info */}
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-2.5 mb-4 flex items-center gap-2">
              <span className="text-sm">🪙</span>
              <span className="text-xs text-pink-400 font-medium">Earn 3 ORRA + 5 XP per submitted fit</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPhase('mode-select')}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <ActionButton onClick={handleSubmitFit} color="from-pink-600 to-rose-600" className="flex-1">
                <span>Post Fit</span>
                <span>🔥</span>
              </ActionButton>
            </div>
          </div>
        )}

        {/* ========== SUBMIT SUCCESS ========== */}
        {phase === 'submit-success' && (
          <div className="p-4 sm:p-6 fade-in">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Your Fit is Live!</h3>
              <p className="text-xs text-slate-400">The community will rate your style</p>
            </div>

            {/* Preview of submitted fit */}
            {submittedFits.length > 0 && (() => {
              const lastFit = submittedFits[submittedFits.length - 1];
              return (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PlayerAvatar src={currentUser.avatar} name={currentUser.name} size="sm" ring="ring-pink-400" />
                    <div>
                      <p className="text-sm font-bold text-white">{currentUser.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-medium">
                        {lastFit.theme}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">{lastFit.caption}</p>
                </div>
              );
            })()}

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm font-bold text-emerald-400">+3 ORRA +5 XP earned!</p>
            </div>

            <div className="space-y-2">
              <ActionButton onClick={() => { setPhase('submit'); setSubmitTheme(''); setSubmitCaption(''); }} color="from-pink-600 to-rose-600">
                <span>Post Another Fit</span>
                <span>📸</span>
              </ActionButton>
              <button
                onClick={() => setPhase('mode-select')}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all"
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}

        {/* ========== LEADERBOARD ========== */}
        {phase === 'leaderboard' && (
          <div className="p-4 sm:p-6 fade-in max-h-[70vh] overflow-y-auto">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-white">Top Fits Today</h3>
              <p className="text-xs text-slate-400">Daily leaderboard — updated in real time</p>
            </div>

            <div className="space-y-2.5 mb-4">
              {LEADERBOARD_DATA.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const rankColors = {
                  1: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
                  2: 'from-slate-400/10 to-slate-500/10 border-slate-400/30',
                  3: 'from-orange-600/10 to-amber-700/10 border-orange-600/30',
                } as Record<number, string>;
                const bgClass = isTop3
                  ? `bg-gradient-to-r ${rankColors[entry.rank] || 'bg-white/5 border-white/10'} border`
                  : 'bg-white/5 border border-white/10';

                return (
                  <div key={entry.rank} className={`${bgClass} rounded-xl p-3 flex items-center gap-3`}>
                    <span className={`w-8 text-center font-black text-sm ${
                      entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-slate-300' : entry.rank === 3 ? 'text-orange-500' : 'text-slate-500'
                    }`}>
                      {entry.rank <= 3 ? ['👑', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <PlayerAvatar
                      src={entry.avatar}
                      name={entry.name}
                      size="md"
                      ring={entry.rank === 1 ? 'ring-amber-400' : entry.rank === 2 ? 'ring-slate-300' : 'ring-slate-600'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{entry.handle}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">{entry.theme}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-amber-400">{entry.avgScore.toFixed(1)}</p>
                      <span className="text-[10px] text-slate-500">{entry.badge}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setPhase('mode-select')}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all"
            >
              Back to Menu
            </button>
          </div>
        )}

        {/* ========== RESULTS ========== */}
        {phase === 'results' && (
          <div className="p-4 sm:p-6 fade-in max-h-[80vh] overflow-y-auto">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30">
                <span className="text-3xl">🏆</span>
              </div>
              <h2 className="text-xl font-black text-white mb-1">Rating Complete!</h2>
              <p className="text-sm text-slate-400">Here&apos;s how your ratings compared</p>
            </div>

            {/* Rating summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Fits Rated</p>
                  <p className="text-2xl font-black text-white">{ratingRecords.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Avg Rating</p>
                  <p className="text-2xl font-black text-amber-400">
                    {ratingRecords.length > 0
                      ? (ratingRecords.reduce((sum, r) => sum + r.yourRating, 0) / ratingRecords.length).toFixed(1)
                      : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Deviation</p>
                  <p className={`text-2xl font-black ${
                    (() => {
                      const avgDiff = ratingRecords.length > 0
                        ? Math.abs(ratingRecords.reduce((sum, r) => sum + r.diff, 0) / ratingRecords.length)
                        : 0;
                      return avgDiff < 0.5 ? 'text-emerald-400' : avgDiff < 1.5 ? 'text-amber-400' : 'text-red-400';
                    })()
                  }`}>
                    {(() => {
                      const avgDiff = ratingRecords.length > 0
                        ? ratingRecords.reduce((sum, r) => sum + r.diff, 0) / ratingRecords.length
                        : 0;
                      return avgDiff > 0 ? '+' : '';
                    })()}{ratingRecords.length > 0
                      ? (ratingRecords.reduce((sum, r) => sum + r.diff, 0) / ratingRecords.length).toFixed(1)
                      : '0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Rating style verdict */}
            {(() => {
              const avgDiff = ratingRecords.length > 0
                ? ratingRecords.reduce((sum, r) => sum + r.diff, 0) / ratingRecords.length
                : 0;
              let verdict = '';
              let emoji = '';
              let color = '';
              if (Math.abs(avgDiff) < 0.5) {
                verdict = 'Perfect Calibrator';
                emoji = '🎯';
                color = 'text-emerald-400';
              } else if (avgDiff > 0) {
                verdict = 'Generous Rater';
                emoji = '🤗';
                color = 'text-pink-400';
              } else {
                verdict = 'Tough Critic';
                emoji = '😤';
                color = 'text-red-400';
              }
              return (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-center">
                  <span className="text-2xl block mb-1">{emoji}</span>
                  <p className={`text-sm font-bold ${color}`}>{verdict}</p>
                  <p className="text-[10px] text-slate-500">
                    {Math.abs(avgDiff) < 0.5
                      ? 'Your ratings perfectly match the community!'
                      : avgDiff > 0
                        ? `You tend to rate ${Math.abs(avgDiff).toFixed(1)} points higher than average`
                        : `You tend to rate ${Math.abs(avgDiff).toFixed(1)} points lower than average`
                    }
                  </p>
                </div>
              );
            })()}

            {/* Individual ratings */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Ratings</h4>
              <div className="space-y-2">
                {ratingRecords.map((record, idx) => {
                  const fit = fits.find((f) => f.id === record.fitId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600/20 to-rose-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">👗</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{fit?.caption || 'Fit'}</p>
                        <p className="text-[10px] text-slate-500">
                          You: {record.yourRating.toFixed(1)} | Avg: {record.communityAvg.toFixed(1)}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${
                        Math.abs(record.diff) < 0.5
                          ? 'text-emerald-400'
                          : record.diff > 0
                            ? 'text-pink-400'
                            : 'text-red-400'
                      }`}>
                        {record.diff > 0 ? '+' : ''}{record.diff.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submitted fits */}
            {submittedFits.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Submitted Fits</h4>
                <div className="space-y-2">
                  {submittedFits.map((fit, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600/30 to-rose-600/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">📸</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{fit.caption}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-medium">
                          {fit.theme}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-bold text-amber-400">+{tokenReward} ORRA</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm font-bold text-violet-400">+{xpReward} XP</span>
                </div>
              </div>
            </div>

            <ActionButton onClick={handleFinish} color="from-amber-500 to-orange-600">
              <span>Claim Rewards</span>
              <span>🎉</span>
            </ActionButton>
          </div>
        )}
      </div>
    </GameOverlay>
  );
}
