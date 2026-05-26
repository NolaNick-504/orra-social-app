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
  "What's the most unhinged thing you've done at 3am?",
  "Who in this room do you think has the most rizz?",
  "What's the cringiest post you've ever made on social media?",
  "What's a secret you've only told one person?",
  "What's the most toxic trait you're working on?",
  "If your search history was made public, what would be the most embarrassing thing?",
  "What's the pettiest reason you've unfollowed someone?",
  "What's the longest you've gone without checking your phone?",
  "Who was the last person you stalked on social media?",
  "What's the most delusional thing you've convinced yourself of?",
  "What's the worst date you've ever been on?",
  "What's a rumor you heard about yourself that was actually true?",
  "What's the most embarrassing thing in your camera roll right now?",
  "If you had to delete one app from your phone forever, which one?",
  "What's the most clout-chasing thing you've ever done?",
  "What's a controversial food opinion you stand by?",
  "What's the worst advice you've ever taken?",
  "What's something you lied about on social media?",
  "Who's the last person you had a fake conversation with in your head?",
  "What's the most unhinged voice memo you've ever sent?",
  "What's the biggest ick you have that nobody understands?",
  "What's a compliment you've been dying to hear?",
  "What's the most embarrassing thing you've done for a crush?",
  "What's the weirdest thing you've cried over recently?",
  "If you could cancel one trend from existence, what would it be?",
  "What's the most chaotic situation you've caused by accident?",
  "What's the most pathetic excuse you've made to get out of plans?",
  "What's a song you know every word to but would never admit?",
  "What's the biggest flex you have that nobody knows about?",
  "What's the most embarrassing thing you've done in public thinking nobody was watching?",
  "What's the most out-of-character thing you've ever done?",
  "What's the last thing that made you genuinely belly laugh?",
  "What's a hot take you have that would start a debate?",
  "What's the most effort you've put into a social media post?",
  "What's the worst thing you've accidentally liked on someone's profile?",
  "What's the most unhinged thing you've said in a group chat?",
  "What's the most impulsive online purchase you've ever made?",
  "What's something you're secretly really competitive about?",
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
  "Freestyle rap for 20 seconds about the person next to you",
  "Change your ORRA bio to something the group decides",
  "Do your best TikTok dance without music",
  "Send the last meme in your camera roll to your best friend",
  "Hold eye contact with someone for 30 seconds without laughing",
  "Let someone post a story from your account",
  "Do 5 push-ups right now",
  "Share your screen and show your most recent search",
  "Make up a theme song for yourself and sing it",
  "Try to lick your elbow for 15 seconds",
  "Speak only in questions for the next 2 rounds",
  "Do your best impression of a cat for 20 seconds",
  "Share the most embarrassing photo in your phone with the group",
  "Send a voice note rapping the alphabet to the group chat",
  "Let the group pick a random person in your contacts to text 'no cap'",
  "Do a dramatic reading of your last sent text message",
  "Attempt a cartwheel or somersault right now",
  "Let someone style your hair however they want for the next round",
  "Create a new ORRA post with whatever caption the group writes",
  "Talk in third person for the next 3 rounds",
  "Share your most-played song and rate it out of 10 honestly",
  "Do your best news anchor impression and report on what happened today",
  "Hold a funny pose for 15 seconds while someone records it",
  "Say something genuinely nice to everyone in the room",
  "Do your best yoga pose and hold it for 20 seconds",
  "Show the last 5 things in your search history",
  "Walk like a penguin across the room",
  "Pitch a terrible business idea to the group like a startup founder",
  "Let the group pick your phone wallpaper for the day",
  "Act out your favorite movie scene and let everyone guess",
  "Do 10 squats while naming things you're grateful for",
  "Tell the most dramatic story you can in 30 seconds",
  "Let someone draw on your arm with a pen",
  "Speak in a whisper for the next 2 rounds",
  "Show everyone your lock screen and explain it",
  "Do your best DJ impression and 'drop the beat'",
  "Record a voice note telling a terrible joke and send it to a friend",
  "Give a 20-second product pitch for something in the room",
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
