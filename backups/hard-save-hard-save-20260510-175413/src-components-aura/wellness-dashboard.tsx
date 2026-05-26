'use client';

import { useAuraStore } from '@/store/aura-store';
import { useState, useEffect } from 'react';
import {
  Heart, Clock, TrendingUp, Sparkles, Shield, Eye, Moon, Sun,
  Activity, Brain, Zap, ChevronRight, BarChart3, Leaf, Flame
} from 'lucide-react';
import { toast } from 'sonner';

// Session time tracker — persists across page reloads using localStorage
const WELLNESS_STORAGE_KEY = 'orra-wellness-session';

interface WellnessSessionData {
  sessionStart: number;     // timestamp when current session started
  totalAppTimeToday: number; // accumulated minutes from previous sessions today
  lastDate: string;         // date string (YYYY-MM-DD) to detect day changes
}

function loadSessionData(): WellnessSessionData {
  try {
    const stored = localStorage.getItem(WELLNESS_STORAGE_KEY);
    if (stored) {
      const data: WellnessSessionData = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      if (data.lastDate === today) {
        return data;
      }
      // New day — reset
    }
  } catch {}
  // Fresh start
  const fresh: WellnessSessionData = {
    sessionStart: Date.now(),
    totalAppTimeToday: 0,
    lastDate: new Date().toISOString().split('T')[0],
  };
  try { localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(fresh)); } catch {}
  return fresh;
}

function saveSessionData(data: WellnessSessionData) {
  try { localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function getSessionMinutes(): number {
  const data = loadSessionData();
  const today = new Date().toISOString().split('T')[0];
  if (today !== data.lastDate) {
    const fresh: WellnessSessionData = {
      sessionStart: Date.now(),
      totalAppTimeToday: 0,
      lastDate: today,
    };
    saveSessionData(fresh);
    return 0;
  }
  return data.totalAppTimeToday + Math.floor((Date.now() - data.sessionStart) / 60000);
}

// Periodically save accumulated time so we don't lose too much on reload
if (typeof window !== 'undefined') {
  setInterval(() => {
    const data = loadSessionData();
    const today = new Date().toISOString().split('T')[0];
    if (today !== data.lastDate) return; // will be reset on next getSessionMinutes call
    const elapsed = Math.floor((Date.now() - data.sessionStart) / 60000);
    saveSessionData({
      sessionStart: Date.now(),
      totalAppTimeToday: data.totalAppTimeToday + elapsed,
      lastDate: today,
    });
  }, 60000); // save every minute
}

function getWellnessScore(minutes: number): { score: number; label: string; color: string } {
  if (minutes <= 30) return { score: 95, label: 'Excellent', color: 'text-emerald-400' };
  if (minutes <= 60) return { score: 85, label: 'Great', color: 'text-green-400' };
  if (minutes <= 120) return { score: 70, label: 'Good', color: 'text-yellow-400' };
  if (minutes <= 180) return { score: 55, label: 'Moderate', color: 'text-orange-400' };
  if (minutes <= 300) return { score: 35, label: 'Take a Break', color: 'text-red-400' };
  return { score: 20, label: 'Rest Needed', color: 'text-red-500' };
}

const WELLNESS_TIPS = [
  { icon: Eye, title: '20-20-20 Rule', tip: 'Every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain.' },
  { icon: Moon, title: 'Screen Curfew', tip: 'Try to stop scrolling 30 minutes before bed for better sleep quality.' },
  { icon: Activity, title: 'Move & Groove', tip: 'Stand up and stretch for 5 minutes after every hour of scrolling.' },
  { icon: Brain, title: 'Mindful Scrolling', tip: 'Before opening ORRA, set an intention. What are you looking for today?' },
  { icon: Heart, title: 'Real Connections', tip: 'For every 10 posts you scroll, send one genuine message to a friend.' },
  { icon: Sun, title: 'Sunlight First', tip: 'Get 10 minutes of natural sunlight before your first scroll of the day.' },
  { icon: Shield, title: 'Notification Diet', tip: 'Turn off non-essential notifications. Keep only DMs and mentions.' },
  { icon: Leaf, title: 'Creative Breaks', tip: 'Alternate between consuming content and creating something of your own.' },
];

export function WellnessDashboard() {
  const { auraTokens, auraLevel, dailyStreak } = useAuraStore();
  const [sessionMinutes, setSessionMinutes] = useState(getSessionMinutes());
  const [currentTip, setCurrentTip] = useState(0);

  // Update session time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionMinutes(getSessionMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Rotate tips every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % WELLNESS_TIPS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const wellness = getWellnessScore(sessionMinutes);
  const tip = WELLNESS_TIPS[currentTip];
  const TipIcon = tip.icon;

  // Calculate time breakdown
  const creativePercent = Math.min(40, 15 + dailyStreak * 2);
  const socialPercent = Math.min(35, 20 + Math.min(sessionMinutes, 30));
  const browsePercent = 100 - creativePercent - socialPercent;

  const handleTakeBreak = () => {
    toast.success('Great choice! Take a 5-minute break and come back refreshed.', { duration: 5000 });
    useAuraStore.setState((s) => ({
      auraTokens: s.auraTokens + 5,
      wellnessScore: Math.min(100, (s.wellnessScore || 50) + 10),
    }));
    toast.success('+5 ORRA for taking a wellness break!', { duration: 3000 });
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Wellness</h2>
            <p className="text-xs text-slate-500">Balance your digital life</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400">{wellness.score}</span>
        </div>
      </div>

      {/* Wellness Score Ring */}
      <div className="glass-panel rounded-2xl p-6 text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke="url(#wellnessGrad)" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(wellness.score / 100) * 327} 327`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="wellnessGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-black ${wellness.color}`}>{wellness.score}</span>
            <span className="text-[10px] text-slate-400 font-medium">{wellness.label}</span>
          </div>
        </div>
        <p className="text-sm text-slate-300 font-medium">Your ORRA Wellness Score</p>
        <p className="text-xs text-slate-500 mt-1">
          {sessionMinutes < 30
            ? "You're doing great! Keep a healthy balance."
            : sessionMinutes < 120
              ? "Good session! Remember to take breaks."
              : "Consider taking a break to recharge your creativity."}
        </p>
      </div>

      {/* Session Time */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-bold text-white">Today&apos;s Session</span>
          </div>
          <span className="text-sm font-bold text-white">{sessionMinutes}m</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (sessionMinutes / 300) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-slate-500">
          <span>0m</span>
          <span className="text-yellow-400/60">1h</span>
          <span className="text-orange-400/60">2h</span>
          <span className="text-red-400/60">5h</span>
        </div>
      </div>

      {/* Time Breakdown */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white">Time Breakdown</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${creativePercent}%` }} />
          <div className="bg-violet-500 h-full transition-all duration-500" style={{ width: `${socialPercent}%` }} />
          <div className="bg-slate-500 h-full transition-all duration-500" style={{ width: `${browsePercent}%` }} />
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Creating {creativePercent}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-slate-300">Social {socialPercent}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-300">Browsing {browsePercent}%</span>
          </div>
        </div>
      </div>

      {/* Daily Wellness Tip */}
      <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TipIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{tip.title}</p>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{tip.tip}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mt-3">
          {WELLNESS_TIPS.map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full transition-all ${i === currentTip ? 'bg-emerald-400 w-3' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>

      {/* Wellness Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-2xl p-4 text-center">
          <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{dailyStreak}</p>
          <p className="text-[10px] text-slate-500">Day Streak</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 text-center">
          <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{auraTokens.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500">ORRA Tokens</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{auraLevel}</p>
          <p className="text-[10px] text-slate-500">Aura Level</p>
        </div>
        <div className="glass-panel rounded-2xl p-4 text-center">
          <Brain className="w-5 h-5 text-fuchsia-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{creativePercent}%</p>
          <p className="text-[10px] text-slate-500">Creative Time</p>
        </div>
      </div>

      {/* Take a Break Button */}
      <button
        onClick={handleTakeBreak}
        className="w-full glass-panel rounded-2xl p-4 flex items-center gap-3 hover:border-emerald-500/30 transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all">
          <Leaf className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Take a Wellness Break</p>
          <p className="text-xs text-slate-400">Earn +5 ORRA for stepping away</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-all" />
      </button>

      {/* Privacy & Data */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-white">Your Privacy</span>
        </div>
        <div className="space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Wellness data stays on your device</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>No tracking across other apps</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Break reminders are suggestions, not requirements</span>
          </div>
        </div>
      </div>
    </div>
  );
}
