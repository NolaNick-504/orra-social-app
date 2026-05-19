'use client';

import { useAuraStore, UserSettings } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import {
  ArrowLeft, Settings, Sparkles, Bell, Mail, Zap, Users, MessageCircle,
  Clock, Shield, Lock, Smartphone, EyeOff, Play, AlertTriangle,
  Globe, Download, UserX, Trash2, ChevronUp, ChevronDown, ChevronRight,
  Crown, Star, Waves, Moon, Monitor, Music
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

// Color-coded toggle component
function ColorToggle({ enabled, onToggle, label, description, icon: Icon, color = 'violet' }: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description: string;
  icon: any;
  color?: 'violet' | 'orange' | 'blue' | 'pink' | 'green' | 'red' | 'gray';
}) {
  const colorMap = {
    violet: { bg: 'bg-gradient-to-r from-violet-600 to-fuchsia-600', shadow: 'shadow-violet-500/20', iconBg: 'bg-violet-600/20', iconBorder: 'border-violet-500/20', iconText: 'text-violet-400' },
    orange: { bg: 'bg-gradient-to-r from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20', iconBg: 'bg-orange-500/20', iconBorder: 'border-orange-500/20', iconText: 'text-orange-400' },
    blue: { bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20', iconBg: 'bg-blue-500/20', iconBorder: 'border-blue-500/20', iconText: 'text-blue-400' },
    pink: { bg: 'bg-gradient-to-r from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20', iconBg: 'bg-pink-500/20', iconBorder: 'border-pink-500/20', iconText: 'text-pink-400' },
    green: { bg: 'bg-gradient-to-r from-green-500 to-emerald-500', shadow: 'shadow-green-500/20', iconBg: 'bg-green-500/20', iconBorder: 'border-green-500/20', iconText: 'text-green-400' },
    red: { bg: 'bg-gradient-to-r from-red-500 to-rose-600', shadow: 'shadow-red-500/20', iconBg: 'bg-red-500/20', iconBorder: 'border-red-500/20', iconText: 'text-red-400' },
    gray: { bg: 'bg-white/10 border border-white/5', shadow: '', iconBg: 'bg-white/5', iconBorder: 'border-white/5', iconText: 'text-slate-500' },
  };
  const c = colorMap[enabled ? color : 'gray'];

  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-all">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${c.iconBg} border ${c.iconBorder}`}>
          <Icon className={`w-4 h-4 transition-all ${c.iconText}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ml-3 ${c.bg} ${enabled ? `shadow-lg ${c.shadow}` : ''}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center ${
          enabled ? 'left-[22px] bg-white shadow-md' : 'left-0.5 bg-slate-400'
        }`}>
          {enabled && <Sparkles className="w-2.5 h-2.5 text-violet-600" />}
        </div>
        {enabled && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
          </div>
        )}
      </button>
    </div>
  );
}

// Collapsible section
function SettingsSection({ title, icon: Icon, color = 'violet', children, defaultOpen = true }: {
  title: string;
  icon: any;
  color?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const colorClasses: Record<string, string> = {
    violet: 'text-violet-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    pink: 'text-pink-400',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${colorClasses[color] || 'text-violet-400'}`} />
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="divide-y divide-white/5">{children}</div>}
    </div>
  );
}

// Navigation row (for Security/Account items)
function NavRow({ icon: Icon, label, description, badge, danger }: {
  icon: any; label: string; description: string; badge?: string; danger?: boolean;
}) {
  return (
    <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-all text-left">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          danger ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/5'
        }`}>
          <Icon className={`w-4 h-4 ${danger ? 'text-red-400' : 'text-slate-400'}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {badge && (
          <span className="px-2 py-0.5 rounded-md bg-violet-600/20 text-violet-300 text-[8px] font-bold uppercase tracking-wider border border-violet-500/30">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-slate-600" />
      </div>
    </button>
  );
}

export function SettingsPage() {
  const { userSettings, updateUserSettings, auraLevel, auraTokens, dailyStreak, setView } = useAuraStore();
  const currentUser = useCurrentUser();

  // Safe settings with fallback
  const s: UserSettings = {
    pushNotifications: userSettings?.pushNotifications ?? true,
    emailNotifications: userSettings?.emailNotifications ?? true,
    tokenAlerts: userSettings?.tokenAlerts ?? true,
    newFollowers: userSettings?.newFollowers ?? true,
    echoAlerts: userSettings?.echoAlerts ?? true,
    messageAlerts: userSettings?.messageAlerts ?? true,
    digestEnabled: userSettings?.digestEnabled ?? true,
    digestPushNotification: userSettings?.digestPushNotification ?? true,
    digestTimes: userSettings?.digestTimes ?? ['morning'],
    holographicEffects: userSettings?.holographicEffects ?? true,
    hapticFeedback: userSettings?.hapticFeedback ?? true,
    reducedMotion: userSettings?.reducedMotion ?? false,
    compactMode: userSettings?.compactMode ?? false,
    autoPlayReels: userSettings?.autoPlayReels ?? true,
    showSensitiveContent: userSettings?.showSensitiveContent ?? false,
    language: userSettings?.language ?? 'English',
    showOnlineStatus: userSettings?.showOnlineStatus ?? true,
    allowStrangerMessages: userSettings?.allowStrangerMessages ?? false,
    nsfwFilter: userSettings?.nsfwFilter ?? true,
    highContrastText: userSettings?.highContrastText ?? false,
  };

  const toggle = (key: keyof UserSettings) => {
    const newVal = !(s[key] as boolean);
    updateUserSettings({ [key]: newVal } as Partial<UserSettings>);
  };

  const allTimes = ['morning', 'evening', 'night'] as const;
  type DigestTime = typeof allTimes[number];

  const toggleDigestTime = (time: DigestTime) => {
    const current = s.digestTimes as DigestTime[];
    if (current.includes(time)) {
      // Don't allow deselecting if it's the only one selected
      if (current.length <= 1) return;
      updateUserSettings({ digestTimes: current.filter(t => t !== time) });
    } else {
      updateUserSettings({ digestTimes: [...current, time] });
    }
  };

  const toggleAllDay = () => {
    const allSelected = allTimes.every(t => s.digestTimes.includes(t));
    if (allSelected) {
      // Deselect all back to just morning
      updateUserSettings({ digestTimes: ['morning'] });
    } else {
      // Select all times
      updateUserSettings({ digestTimes: [...allTimes] });
    }
  };

  const setLanguage = (lang: string) => {
    updateUserSettings({ language: lang });
    toast.success(`Language set to ${lang}`);
  };

  const isFounder = (() => {
    try {
      const badges = typeof currentUser.badges === 'string' ? JSON.parse(currentUser.badges) : currentUser.badges;
      return Array.isArray(badges) && badges.some((b: string) => b === 'Founder');
    } catch { return false; }
  })();

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('home')}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
            <Settings className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Settings</h1>
            <p className="text-[10px] text-slate-500">Customize your ORRA experience</p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-violet-500/30">
              <img src={currentUser.avatar || '/api/uploads?path=images/orra-logo.png'} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            {isFounder && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center border border-amber-400">
                <Crown className="w-3 h-3 text-black" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              {isFounder && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
            </div>
            <p className="text-xs text-slate-500">{currentUser.handle}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                <Zap className="w-3 h-3" /> {auraTokens.toLocaleString()} ORRA
              </span>
              <span className="flex items-center gap-1 text-[10px] text-violet-400 font-semibold">
                <Star className="w-3 h-3" /> Level {auraLevel}
              </span>
            </div>
          </div>
          <button
            onClick={() => setView('profile')}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Profile Song Section */}
      <SettingsSection title="Profile Song" icon={Music} color="violet">
        <div className="p-4 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
              <Music className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-300">MySpace Vibes</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Add a song that plays when someone visits your profile — bringing back the classic MySpace era. Music sets the mood for your whole vibe.
              </p>
            </div>
          </div>
        </div>
        <div className="p-3">
          {currentUser.profileSongUrl ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-600/10 border border-violet-500/20">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center flex-shrink-0">
                <Music className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentUser.profileSongTitle}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.profileSongArtist}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-2">No profile song set. Edit your profile to add one!</p>
          )}
          <button
            onClick={() => {
              const store = useAuraStore.getState();
              store.toggleEditProfile();
              store.setView('profile');
            }}
            className="w-full mt-2 py-2 rounded-xl bg-violet-600/20 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-all border border-violet-500/20"
          >
            {currentUser.profileSongUrl ? 'Change Profile Song' : 'Add Profile Song'}
          </button>
        </div>
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection title="Notifications" icon={Bell} color="violet">
        <ColorToggle
          enabled={s.pushNotifications} onToggle={() => toggle('pushNotifications')}
          label="Push Notifications" description="Get alerts for likes, follows, and echoes"
          icon={Bell} color="violet"
        />
        <ColorToggle
          enabled={s.emailNotifications} onToggle={() => toggle('emailNotifications')}
          label="Email Notifications" description="Weekly digest and important updates via email"
          icon={Mail} color="violet"
        />
        <ColorToggle
          enabled={s.tokenAlerts} onToggle={() => toggle('tokenAlerts')}
          label="Token Alerts" description="Notify when you earn or spend ORRA tokens"
          icon={Zap} color="orange"
        />
        <ColorToggle
          enabled={s.newFollowers} onToggle={() => toggle('newFollowers')}
          label="New Followers" description="Alert when someone follows you"
          icon={Users} color="blue"
        />
        <ColorToggle
          enabled={s.echoAlerts} onToggle={() => toggle('echoAlerts')}
          label="Echo Alerts" description="Notify when someone echoes your post"
          icon={Waves} color="pink"
        />
        <ColorToggle
          enabled={s.messageAlerts} onToggle={() => toggle('messageAlerts')}
          label="Message Alerts" description="Notifications for new direct messages"
          icon={MessageCircle} color="green"
        />
      </SettingsSection>

      {/* ORRA Daily Digest Section */}
      <SettingsSection title="ORRA Daily Digest" icon={Clock} color="orange">
        {/* Personalized Briefing description */}
        <div className="p-4 bg-gradient-to-r from-orange-500/5 to-amber-500/5 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300">Personalized Briefing</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Wake up to your ORRA Digest — a curated summary of trending pulses, your token activity, new followers, and wellness check-ins. Your daily briefing, delivered fresh.
              </p>
            </div>
          </div>
        </div>
        <ColorToggle
          enabled={s.digestEnabled} onToggle={() => toggle('digestEnabled')}
          label="Enable Daily Digest" description="Show your personalized briefing when you open ORRA"
          icon={Star} color="orange"
        />
        <ColorToggle
          enabled={s.digestPushNotification} onToggle={() => toggle('digestPushNotification')}
          label="Digest Push Notification" description="Get a push notification when your digest is ready"
          icon={Bell} color="orange"
        />
        {/* Digest Time Picker */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-medium text-white">Digest Time</p>
            <span className="text-[9px] text-slate-500">Select one or more</span>
          </div>
          {/* All Day button */}
          <button
            onClick={toggleAllDay}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border transition-all mb-2 ${
              allTimes.every(t => s.digestTimes.includes(t))
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/30 shadow-lg shadow-orange-500/10'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/[0.08]'
            }`}
          >
            All Day
          </button>
          <div className="flex gap-2">
            {allTimes.map((time) => {
              const active = (s.digestTimes as DigestTime[]).includes(time);
              const timeIcons: Record<string, string> = { morning: '\u2600', evening: '\uD83C\uDF05', night: '\uD83C\uDF19' };
              return (
                <button
                  key={time}
                  onClick={() => toggleDigestTime(time)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30 shadow-lg shadow-orange-500/10'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  {time.charAt(0).toUpperCase() + time.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      {/* Security Section */}
      <SettingsSection title="Security" icon={Shield} color="blue">
        <NavRow icon={Lock} label="Change Password" description="Update your account password" />
        <NavRow icon={Shield} label="Two-Factor Authentication" description="Add an extra layer of security" badge="SOON" />
      </SettingsSection>

      {/* Appearance & Effects Section */}
      <SettingsSection title="Appearance & Effects" icon={Sparkles} color="pink">
        {/* Futuristic UI sub-header */}
        <div className="p-4 bg-gradient-to-r from-pink-500/5 to-violet-500/5 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 border border-pink-500/20">
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-pink-300">Futuristic UI</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Control ORRA&apos;s holographic effects and visual style throughout the app.
              </p>
            </div>
          </div>
        </div>
        <ColorToggle
          enabled={s.holographicEffects} onToggle={() => toggle('holographicEffects')}
          label="Holographic Effects" description="Glowing shimmer on toggles, badges, and cards"
          icon={Sparkles} color="violet"
        />
        <ColorToggle
          enabled={s.hapticFeedback} onToggle={() => toggle('hapticFeedback')}
          label="Haptic Feedback" description="Vibration on interactions (mobile only)"
          icon={Smartphone} color="violet"
        />
        <ColorToggle
          enabled={s.reducedMotion} onToggle={() => toggle('reducedMotion')}
          label="Reduced Motion" description="Minimize animations for accessibility"
          icon={EyeOff} color="gray"
        />
        <ColorToggle
          enabled={s.compactMode} onToggle={() => toggle('compactMode')}
          label="Compact Mode" description="Smaller text and tighter spacing"
          icon={Moon} color="gray"
        />
      </SettingsSection>

      {/* Content & Media Section */}
      <SettingsSection title="Content & Media" icon={Play} color="green">
        <ColorToggle
          enabled={s.autoPlayReels} onToggle={() => toggle('autoPlayReels')}
          label="Auto-Play Reels" description="Automatically play reels as you scroll"
          icon={Play} color="green"
        />
        <ColorToggle
          enabled={s.showSensitiveContent} onToggle={() => toggle('showSensitiveContent')}
          label="Show Sensitive Content" description="Display content flagged as sensitive without warning"
          icon={AlertTriangle} color="red"
        />
        {/* Language selector */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Globe className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-medium text-white">Language</p>
          </div>
          <div className="flex gap-2">
            {['English', 'Spanish', 'French'].map((lang) => {
              const active = s.language === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-green-500/20 text-green-300 border-green-500/30 shadow-lg shadow-green-500/10'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      {/* Account Section */}
      <SettingsSection title="Account" icon={Settings} color="red">
        <NavRow icon={Download} label="Download Your Data" description="Get a copy of your ORRA data" badge="SOON" />
        <NavRow icon={UserX} label="Deactivate Account" description="Temporarily disable your account" />
        <NavRow icon={Trash2} label="Delete Account" description="Permanently delete your account and data" danger />
      </SettingsSection>

      {/* App Info Footer */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-bold text-white">ORRA</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Version 3.5</p>
          <p className="text-[10px] text-slate-600 mt-0.5">The next-gen social universe</p>
          {isFounder && (
            <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-violet-500/20 border border-amber-500/30">
              <Crown className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-300">Founder Edition</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
