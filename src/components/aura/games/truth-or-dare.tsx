'use client';

import { useState } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { Dices, Coins, Zap, RotateCcw, Shield, Sword, SkipForward, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const truths = [
  "What's the most embarrassing song on your playlist?",
  "What's the last thing you searched on your phone?",
  "What's a secret skill nobody knows you have?",
  "What's the weirdest dream you've had this week?",
  "If you could read one person's mind for a day, who would it be?",
  "What's the most childish thing you still do?",
  "What's a compliment you got that you still think about?",
  "What's the most spontaneous thing you've ever done?",
  "What's your guilty pleasure TV show?",
  "If you could swap lives with someone for a day, who?",
  "What's the most irrational fear you have?",
  "What's the best lie you've ever told?",
  "What's something you pretend to like but actually hate?",
  "What's the most embarrassing thing your parents caught you doing?",
  "Who was your first celebrity crush?",
  "What's the most money you've wasted on something stupid?",
  "What's a trend you secretly think is ridiculous?",
  "What's the longest you've gone without showering?",
  "What's the most awkward text you've sent to the wrong person?",
  "What's something you'd do if you knew no one would judge you?",
];

const dares = [
  "Post 'I love broccoli' on your social media right now",
  "Do your best robot dance for 15 seconds",
  "Send a voice note saying 'I believe in unicorns' to the last person you texted",
  "Let the other players choose your profile pic for 10 minutes",
  "Speak in an accent for the next 3 rounds",
  "Do 10 jumping jacks right now",
  "Text your crush 'What's up?' right now",
  "Sing the chorus of the last song you listened to",
  "Let someone go through your camera roll for 30 seconds",
  "Post an unfiltered selfie on ORRA",
  "Do your best impression of a famous person",
  "Call the 5th contact in your phone and sing happy birthday",
  "Write a haiku about the person to your left",
  "Do your best model walk across the room",
  "Hold a plank for 20 seconds while saying the alphabet",
  "Make the ugliest face you can and hold it for 10 seconds",
  "Let the group create a hashtag for you to use all day",
  "Record a 10-second video of you doing something silly",
  "Tell everyone your most used emoji and why",
  "Give a 30-second motivational speech about snacks",
];

interface TruthOrDareProps {
  onBack: () => void;
}

export function TruthOrDare({ onBack }: TruthOrDareProps) {
  const [gameMode, setGameMode] = useState<'select' | 'playing' | 'result'>('select');
  const [currentType, setCurrentType] = useState<'truth' | 'dare'>('truth');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [usedTruths, setUsedTruths] = useState<Set<number>>(new Set());
  const [usedDares, setUsedDares] = useState<Set<number>>(new Set());
  const [completedCount, setCompletedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [actionTaken, setActionTaken] = useState(false);
  const { earnTokens, addXP, auraTokens } = useAuraStore();

  const getRandomPrompt = (type: 'truth' | 'dare') => {
    const list = type === 'truth' ? truths : dares;
    const used = type === 'truth' ? usedTruths : usedDares;

    // Find unused indices
    const availableIndices = list.map((_, i) => i).filter((i) => !used.has(i));
    if (availableIndices.length === 0) {
      // Reset if all used
      if (type === 'truth') setUsedTruths(new Set());
      else setUsedDares(new Set());
      const randomIdx = Math.floor(Math.random() * list.length);
      return list[randomIdx];
    }

    const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newUsed = new Set(used);
    newUsed.add(randomIdx);
    if (type === 'truth') setUsedTruths(newUsed);
    else setUsedDares(newUsed);
    return list[randomIdx];
  };

  const handleSelectType = (type: 'truth' | 'dare') => {
    setCurrentType(type);
    const prompt = getRandomPrompt(type);
    setCurrentPrompt(prompt || 'Tell us something interesting!');
    setGameMode('playing');
    setActionTaken(false);
  };

  const handleComplete = () => {
    if (actionTaken) return;
    setActionTaken(true);
    const reward = currentType === 'dare' ? 7 : 5;
    earnTokens(reward, `Truth or Dare ${currentType} completed!`);
    addXP(8);
    setTotalTokens((t) => t + reward);
    setCompletedCount((c) => c + 1);
    toast.success(`+${reward} ORRA for completing!`, { duration: 1500 });
  };

  const handleSkip = () => {
    if (actionTaken) return;
    if (auraTokens < 3) {
      toast.error('Not enough tokens to skip! (3 required)');
      return;
    }
    setActionTaken(true);
    earnTokens(-3, 'Truth or Dare skip');
    setSkippedCount((c) => c + 1);
    setTotalTokens((t) => t - 3);
    toast.success('Skipped! -3 ORRA', { duration: 1500 });
  };

  const handleNewRound = () => {
    setGameMode('select');
    setActionTaken(false);
  };

  const handleEndGame = () => {
    setGameMode('result');
  };

  const handleRestart = () => {
    setGameMode('select');
    setCompletedCount(0);
    setSkippedCount(0);
    setTotalTokens(0);
    setUsedTruths(new Set());
    setUsedDares(new Set());
    setActionTaken(false);
  };

  if (gameMode === 'result') {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-4">
          <Dices className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Game Over!</h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-sm text-emerald-400 font-semibold">{completedCount} completed</span>
          <span className="text-sm text-red-400 font-semibold">{skippedCount} skipped</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-lg font-bold text-yellow-400">{totalTokens >= 0 ? '+' : ''}{totalTokens}</span>
            </div>
            <p className="text-[10px] text-yellow-400/70">Net Tokens</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all">Back to Arena</button>
          <button onClick={handleRestart} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
        </div>
      </div>
    );
  }

  if (gameMode === 'playing') {
    return (
      <div className="space-y-4 fade-in">
        {/* Stats */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dices className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-medium text-slate-400">Round {completedCount + skippedCount + 1}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-400">{completedCount} ✓</span>
              <span className="text-xs font-bold text-red-400">{skippedCount} ✗</span>
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                <Coins className="w-3 h-3" />{totalTokens}
              </span>
            </div>
          </div>
        </div>

        {/* Prompt Card */}
        <div className={`glass-panel rounded-2xl p-6 text-center relative overflow-hidden ${
          currentType === 'truth' ? 'border-blue-500/20' : 'border-red-500/20'
        }`}>
          <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl ${
            currentType === 'truth' ? 'bg-blue-500/10' : 'bg-red-500/10'
          }`} />
          <div className="flex items-center justify-center gap-2 mb-3">
            {currentType === 'truth' ? (
              <Shield className="w-5 h-5 text-blue-400" />
            ) : (
              <Sword className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-[10px] font-bold tracking-wider uppercase ${
              currentType === 'truth' ? 'text-blue-400' : 'text-red-400'
            }`}>
              {currentType === 'truth' ? 'Truth' : 'Dare'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white leading-relaxed">{currentPrompt || 'Loading...'}</h3>
        </div>

        {/* Action Buttons */}
        {!actionTaken ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSkip}
              className="p-4 rounded-xl glass-panel hover:border-red-500/30 transition-all flex flex-col items-center gap-2"
            >
              <SkipForward className="w-5 h-5 text-red-400" />
              <span className="text-sm font-bold text-red-400">Skip</span>
              <span className="text-[10px] text-slate-500">-3 ORRA</span>
            </button>
            <button
              onClick={handleComplete}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-all flex flex-col items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Done!</span>
              <span className="text-[10px] text-emerald-400/70">+{currentType === 'dare' ? 7 : 5} ORRA</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-slate-400 mb-3">
              {actionTaken && completedCount > skippedCount ? 'Nice! 👏' : 'Maybe next time!'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleNewRound}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all"
              >
                Next Round
              </button>
              <button
                onClick={handleEndGame}
                className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all"
              >
                End Game
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Select screen
  return (
    <div className="space-y-4 fade-in">
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-medium text-slate-400">Choose your fate!</span>
          </div>
          <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
            <Coins className="w-3 h-3" />{totalTokens}
          </span>
        </div>
      </div>

      <div className="text-center py-4">
        <h3 className="text-xl font-bold text-white mb-2">Truth or Dare?</h3>
        <p className="text-xs text-slate-400">Complete for tokens, skip costs 3 ORRA</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSelectType('truth')}
          className="p-6 rounded-2xl glass-panel hover:border-blue-500/30 transition-all text-center group"
        >
          <Shield className="w-10 h-10 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-white mb-1">Truth</h4>
          <p className="text-[10px] text-slate-500">+5 ORRA</p>
        </button>

        <button
          onClick={() => handleSelectType('dare')}
          className="p-6 rounded-2xl glass-panel hover:border-red-500/30 transition-all text-center group"
        >
          <Sword className="w-10 h-10 text-red-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-white mb-1">Dare</h4>
          <p className="text-[10px] text-slate-500">+7 ORRA</p>
        </button>
      </div>

      {completedCount > 0 && (
        <button
          onClick={handleEndGame}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all"
        >
          End Game
        </button>
      )}
    </div>
  );
}
