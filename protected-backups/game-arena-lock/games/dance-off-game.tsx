'use client';

import { useState, useEffect } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { Trophy, Clock, Users, Coins, Zap, Crown, Medal, Award, ExternalLink, Calendar } from 'lucide-react';

interface DanceOffGameProps {
  onBack: () => void;
}

const leaderboardPreview = [
  { rank: 1, name: 'NeonDancer42', handle: '@neondancer42', avatar: '/images/orra-logo.png', score: 15420 },
  { rank: 2, name: 'GrooveMaster', handle: '@groovemaster', avatar: '/images/orra-logo.png', score: 12890 },
  { rank: 3, name: 'VibeQueen', handle: '@vibequeen', avatar: '/images/orra-logo.png', score: 11200 },
];

// Countdown to next Dance Off event (simulated: 3 days from now)
const NEXT_EVENT_TIME = Date.now() + 3 * 24 * 60 * 60 * 1000;

function CountdownTimer({ targetTime }: { targetTime: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, targetTime - now);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-1.5">
      {[
        { val: d, label: 'DAYS' },
        { val: h, label: 'HRS' },
        { val: m, label: 'MIN' },
        { val: s, label: 'SEC' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-b from-fuchsia-600/20 to-pink-600/20 backdrop-blur-sm rounded-lg px-2 py-1.5 min-w-[44px] text-center border border-fuchsia-500/20">
              <span className="text-lg font-black text-white font-mono">
                {String(item.val).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[7px] text-slate-500 mt-0.5 tracking-widest font-medium">{item.label}</span>
          </div>
          {i < 3 && <span className="text-lg font-black text-fuchsia-400 mt-[-12px] animate-pulse">:</span>}
        </div>
      ))}
    </div>
  );
}

export function DanceOffGame({ onBack }: DanceOffGameProps) {
  const { setView, earnTokens, addXP } = useAuraStore();

  const handleGoToDanceChallenge = () => {
    setView('dance');
  };

  const handleSetReminder = () => {
    earnTokens(5, 'Dance Off reminder set!');
    addXP(5);
    onBack();
  };

  return (
    <div className="space-y-4 fade-in">
      {/* Scheduled Banner */}
      <div className="glass-panel rounded-2xl p-6 text-center relative overflow-hidden border border-amber-500/20">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase">Scheduled Event</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-1">
            ORRA DANCE <span className="gradient-text">OFF</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">Next challenge starts in</p>

          <div className="flex justify-center mb-4">
            <CountdownTimer targetTime={NEXT_EVENT_TIME} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Users className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">1.8K waiting</span>
          </div>
        </div>
      </div>

      {/* Prize Info */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Prizes</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <Crown className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-[9px] font-bold text-yellow-300">1st Place</p>
            <p className="text-[8px] text-yellow-400/70">100K ORRA</p>
          </div>
          <div className="p-2 rounded-xl bg-gray-400/10 border border-gray-400/20 text-center">
            <Medal className="w-4 h-4 text-gray-300 mx-auto mb-1" />
            <p className="text-[9px] font-bold text-gray-300">2nd Place</p>
            <p className="text-[8px] text-gray-400/70">50K ORRA</p>
          </div>
          <div className="p-2 rounded-xl bg-amber-600/10 border border-amber-600/20 text-center">
            <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-[9px] font-bold text-amber-500">3rd Place</p>
            <p className="text-[8px] text-amber-500/70">25K ORRA</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-bold text-white">Last Challenge Leaderboard</h3>
        </div>
        <div className="space-y-2">
          {leaderboardPreview.map((entry) => {
            const config = {
              1: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
              2: { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-400/20' },
              3: { icon: Award, color: 'text-amber-500', bg: 'bg-amber-600/20' },
            }[entry.rank]!;
            const Icon = config.icon;
            return (
              <div key={entry.rank} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                  <p className="text-[10px] text-slate-500">{entry.handle}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-400">{(entry.score / 1000).toFixed(1)}K</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleGoToDanceChallenge}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 glow-violet"
        >
          <ExternalLink className="w-4 h-4" /> Go to Dance Challenge
        </button>
        <button
          onClick={handleSetReminder}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" /> Set Reminder (+5 ORRA)
        </button>
      </div>

      {/* Token Reward Info */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Token Rewards</h3>
        </div>
        <ul className="text-xs text-slate-400 space-y-1">
          <li className="flex items-center gap-2"><span className="text-yellow-400">+100</span> Win the Dance Off</li>
          <li className="flex items-center gap-2"><span className="text-yellow-400">+5</span> Submit an entry</li>
          <li className="flex items-center gap-2"><span className="text-yellow-400">+1</span> Vote on entries</li>
          <li className="flex items-center gap-2"><span className="text-yellow-400">+5</span> Set a reminder</li>
        </ul>
      </div>
    </div>
  );
}
