'use client';

import { useAuraStore, type UserSettings } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { toast } from 'sonner';
import {
  ArrowLeft, Bell, Shield, Palette, Globe, Zap, Eye, MessageSquare, Heart,
  Moon, Volume2, Smartphone, Lock, UserCheck, Radio, Clock, Play, AlertTriangle,
  ChevronRight, Settings as SettingsIcon, Sparkles, LogOut, Crown, Star, Info
} from 'lucide-react';
import { useState } from 'react';

// ====== HOLOGRAPHIC TOGGLE ======
function HoloToggle({ enabled, onToggle, label, description, icon: Icon, color = 'violet' }: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
  icon?: React.ElementType;
  color?: 'violet' | 'amber' | 'cyan' | 'fuchsia' | 'emerald' | 'red';
}) {
  const colorMap = {
    violet: { track: 'from-violet-600 to-violet-500', glow: 'shadow-violet-500/50', shimmer: 'from-violet-400/30 via-white/20 to-violet-400/30' },
    amber: { track: 'from-amber-600 to-amber-500', glow: 'shadow-amber-500/50', shimmer: 'from-amber-400/30 via-white/20 to-amber-400/30' },
    cyan: { track: 'from-cyan-600 to-cyan-500', glow: 'shadow-cyan-500/50', shimmer: 'from-cyan-400/30 via-white/20 to-cyan-400/30' },
    fuchsia: { track: 'from-fuchsia-600 to-fuchsia-500', glow: 'shadow-fuchsia-500/50', shimmer: 'from-fuchsia-400/30 via-white/20 to-fuchsia-400/30' },
    emerald: { track: 'from-emerald-600 to-emerald-500', glow: 'shadow-emerald-500/50', shimmer: 'from-emerald-400/30 via-white/20 to-emerald-400/30' },
    red: { track: 'from-red-600 to-red-500', glow: 'shadow-red-500/50', shimmer: 'from-red-400/30 via-white/20 to-red-400/30' },
  };
  const c = colorMap[color];

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-3 group text-left"
      role="switch"
      aria-checked={enabled}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />}
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        {description && <p className="text-[11px] text-slate-500 mt-0.5 ml-6">{description}</p>}
      </div>

      {/* Holographic Toggle Switch */}
      <div className="relative flex-shrink-0">
        <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
          enabled
            ? `bg-gradient-to-r ${c.track} shadow-lg ${c.glow}`
            : 'bg-white/10 border border-white/10'
        }`}>
          {/* Shimmer sweep when enabled */}
          {enabled && (
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${c.shimmer} holo-toggle-shimmer`} />
          )}

          {/* Knob */}
          <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${
            enabled
              ? 'left-[22px] bg-white shadow-md'
              : 'left-0.5 bg-slate-400 group-hover:bg-slate-300'
          }`}>
            {/* Subtle prism reflection on knob when enabled */}
            {enabled && (
              <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/80 via-transparent to-violet-200/30" />
            )}
          </div>

          {/* Glow pulse dot when enabled */}
          {enabled && (
            <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60 holo-toggle-dot`} />
          )}
        </div>
      </div>
    </button>
  );
}

// ====== SETTINGS SECTION ======
function SettingsSection({ title, icon: Icon, children, accent = 'violet' }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const accentColors: Record<string, string> = {
    violet: 'text-violet-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    fuchsia: 'text-fuchsia-400',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${accentColors[accent] || 'text-violet-400'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-4 border-t border-white/5 fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// ====== ACTION ROW ======
function ActionRow({ label, description, icon: Icon, onClick, danger = false, badge }: {
  label: string;
  description?: string;
  icon: React.ElementType;
  onClick: () => void;
  danger?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-3 group text-left transition-colors ${
        danger ? 'hover:bg-red-500/5 -mx-2 px-2 rounded-lg' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        danger ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-slate-400 group-hover:text-white'
      } transition-colors`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
        {description && <p className="text-[11px] text-slate-500">{description}</p>}
      </div>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-500/20 text-violet-400">{badge}</span>
      )}
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
    </button>
  );
}

// ====== MAIN SETTINGS COMPONENT ======
export function Settings() {
  const { userSettings, updateSettings, setView, auraTokens, auraLevel } = useAuraStore();
  const currentUser = useCurrentUser();

  // Ensure userSettings is always valid (guard against stale localStorage)
  const safeSettings = userSettings || {
    pushNotifications: true, emailNotifications: true, digestNotifications: true,
    tokenAlerts: true, followerAlerts: true, echoAlerts: true, messageAlerts: true,
    privateAccount: false, showOnlineStatus: true, showReadReceipts: true,
    allowTagging: true, dataCollection: false, hapticFeedback: true,
    holographicEffects: true, reducedMotion: false, compactMode: false,
    digestEnabled: true, digestTime: 'morning', autoPlayReels: true,
    showSensitiveContent: false, language: 'en',
  };

  // Founder check - safely handle badges that might be string or array
  const isFounder = (() => {
    try {
      const rawBadges = currentUser?.badges;
      const badges = typeof rawBadges === 'string' ? JSON.parse(rawBadges) : (Array.isArray(rawBadges) ? rawBadges : []);
      return badges.some((b: string) => b === 'Founder');
    } catch { return false; }
  })();

  const handleToggle = (key: keyof UserSettings) => {
    updateSettings({ [key]: !safeSettings[key] });
    toast.success(`${key} ${!safeSettings[key] ? 'enabled' : 'disabled'}`, { duration: 1200 });
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('home')}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-violet-400" />
            Settings
          </h1>
          <p className="text-xs text-slate-500">Customize your ORRA experience</p>
        </div>
      </div>

      {/* Account Overview Card */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-violet-500/50 aura-glow-ring">
            <img src={currentUser.avatar || '/api/uploads?path=images/orra-logo.png'} alt={currentUser.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white truncate">{currentUser.name}</span>
              {isFounder && <Crown className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-xs text-slate-400">{currentUser.handle}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px]">
              <span className="flex items-center gap-1 text-amber-400"><Zap className="w-3 h-3" /> {auraTokens.toLocaleString()} ORRA</span>
              <span className="flex items-center gap-1 text-violet-400"><Star className="w-3 h-3" /> Level {auraLevel}</span>
            </div>
          </div>
          <button
            onClick={() => setView('profile')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-violet-500/30 transition-all"
          >
            View Profile
          </button>
        </div>
      </div>

      {/* ===== NOTIFICATIONS ===== */}
      <SettingsSection title="Notifications" icon={Bell} accent="violet">
        <HoloToggle
          enabled={safeSettings.pushNotifications}
          onToggle={() => handleToggle('pushNotifications')}
          label="Push Notifications"
          description="Get alerts for likes, follows, and echoes"
          icon={Bell}
          color="violet"
        />
        <HoloToggle
          enabled={safeSettings.emailNotifications}
          onToggle={() => handleToggle('emailNotifications')}
          label="Email Notifications"
          description="Weekly digest and important updates via email"
          icon={MessageSquare}
          color="violet"
        />
        <HoloToggle
          enabled={safeSettings.tokenAlerts}
          onToggle={() => handleToggle('tokenAlerts')}
          label="Token Alerts"
          description="Notify when you earn or spend ORRA tokens"
          icon={Zap}
          color="amber"
        />
        <HoloToggle
          enabled={safeSettings.followerAlerts}
          onToggle={() => handleToggle('followerAlerts')}
          label="New Followers"
          description="Alert when someone follows you"
          icon={UserCheck}
          color="cyan"
        />
        <HoloToggle
          enabled={safeSettings.echoAlerts}
          onToggle={() => handleToggle('echoAlerts')}
          label="Echo Alerts"
          description="Notify when someone echoes your post"
          icon={Radio}
          color="fuchsia"
        />
        <HoloToggle
          enabled={safeSettings.messageAlerts}
          onToggle={() => handleToggle('messageAlerts')}
          label="Message Alerts"
          description="Notifications for new direct messages"
          icon={MessageSquare}
          color="emerald"
        />
      </SettingsSection>

      {/* ===== ORRA DIGEST ===== */}
      <SettingsSection title="ORRA Daily Digest" icon={Clock} accent="amber">
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">Personalized Briefing</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Wake up to your ORRA Digest — a curated summary of trending pulses, your token activity,
            new followers, and wellness check-ins. Your daily briefing, delivered fresh.
          </p>
        </div>
        <HoloToggle
          enabled={safeSettings.digestEnabled}
          onToggle={() => handleToggle('digestEnabled')}
          label="Enable Daily Digest"
          description="Show your personalized briefing when you open ORRA"
          icon={Sparkles}
          color="amber"
        />
        <HoloToggle
          enabled={safeSettings.digestNotifications}
          onToggle={() => handleToggle('digestNotifications')}
          label="Digest Push Notification"
          description="Get a push notification when your digest is ready"
          icon={Bell}
          color="amber"
        />
        {/* Digest Time Selector */}
        <div className="flex items-center gap-2 py-3">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Digest Time</span>
          <div className="ml-auto flex items-center gap-1">
            {['morning', 'evening', 'both'].map((time) => (
              <button
                key={time}
                onClick={() => { updateSettings({ digestTime: time }); toast.success(`Digest set to ${time}`, { duration: 1200 }); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  safeSettings.digestTime === time
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* ===== PRIVACY ===== */}
      <SettingsSection title="Privacy & Security" icon={Shield} accent="cyan">
        <HoloToggle
          enabled={safeSettings.privateAccount}
          onToggle={() => handleToggle('privateAccount')}
          label="Private Account"
          description="Only approved followers can see your pulses"
          icon={Lock}
          color="red"
        />
        <HoloToggle
          enabled={safeSettings.showOnlineStatus}
          onToggle={() => handleToggle('showOnlineStatus')}
          label="Show Online Status"
          description="Let others see when you're active on ORRA"
          icon={Eye}
          color="cyan"
        />
        <HoloToggle
          enabled={safeSettings.showReadReceipts}
          onToggle={() => handleToggle('showReadReceipts')}
          label="Read Receipts"
          description="Show when you've read messages"
          icon={MessageSquare}
          color="cyan"
        />
        <HoloToggle
          enabled={safeSettings.allowTagging}
          onToggle={() => handleToggle('allowTagging')}
          label="Allow Tagging"
          description="Let others tag you in their pulses"
          icon={UserCheck}
          color="cyan"
        />
        <HoloToggle
          enabled={safeSettings.dataCollection}
          onToggle={() => handleToggle('dataCollection')}
          label="Analytics Data Collection"
          description="Help improve ORRA by sharing anonymous usage data"
          icon={Info}
          color="violet"
        />
        <div className="border-t border-white/5 mt-2 pt-3">
          <ActionRow
            label="Change Password"
            description="Update your account password"
            icon={Lock}
            onClick={() => toast.info('Password change coming soon', { duration: 1500 })}
          />
          <ActionRow
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
            icon={Shield}
            onClick={() => toast.info('2FA coming soon', { duration: 1500 })}
            badge="SOON"
          />
        </div>
      </SettingsSection>

      {/* ===== APPEARANCE ===== */}
      <SettingsSection title="Appearance & Effects" icon={Palette} accent="fuchsia">
        <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 border border-fuchsia-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="text-xs font-bold text-fuchsia-300">Futuristic UI</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Control ORRA's holographic effects and visual style. These toggles power the
            glowing, shimmering interface elements throughout the app.
          </p>
        </div>
        <HoloToggle
          enabled={safeSettings.holographicEffects}
          onToggle={() => handleToggle('holographicEffects')}
          label="Holographic Effects"
          description="Glowing shimmer on toggles, badges, and cards"
          icon={Sparkles}
          color="fuchsia"
        />
        <HoloToggle
          enabled={safeSettings.hapticFeedback}
          onToggle={() => handleToggle('hapticFeedback')}
          label="Haptic Feedback"
          description="Vibration on interactions (mobile only)"
          icon={Smartphone}
          color="violet"
        />
        <HoloToggle
          enabled={safeSettings.reducedMotion}
          onToggle={() => handleToggle('reducedMotion')}
          label="Reduced Motion"
          description="Minimize animations for accessibility"
          icon={Volume2}
          color="emerald"
        />
        <HoloToggle
          enabled={safeSettings.compactMode}
          onToggle={() => handleToggle('compactMode')}
          label="Compact Mode"
          description="Smaller text and tighter spacing"
          icon={Moon}
          color="violet"
        />
      </SettingsSection>

      {/* ===== CONTENT ===== */}
      <SettingsSection title="Content & Media" icon={Play} accent="emerald">
        <HoloToggle
          enabled={safeSettings.autoPlayReels}
          onToggle={() => handleToggle('autoPlayReels')}
          label="Auto-Play Reels"
          description="Automatically play reels as you scroll"
          icon={Play}
          color="emerald"
        />
        <HoloToggle
          enabled={safeSettings.showSensitiveContent}
          onToggle={() => handleToggle('showSensitiveContent')}
          label="Show Sensitive Content"
          description="Display content flagged as sensitive without warning"
          icon={AlertTriangle}
          color="red"
        />
        <div className="flex items-center gap-2 py-3">
          <Globe className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Language</span>
          <div className="ml-auto flex items-center gap-1">
            {[
              { code: 'en', label: 'English' },
              { code: 'es', label: 'Spanish' },
              { code: 'fr', label: 'French' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => { updateSettings({ language: lang.code }); toast.success(`Language set to ${lang.label}`, { duration: 1200 }); }}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  safeSettings.language === lang.code
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* ===== ACCOUNT ===== */}
      <SettingsSection title="Account" icon={SettingsIcon} accent="red">
        <ActionRow
          label="Download Your Data"
          description="Get a copy of your ORRA data"
          icon={Globe}
          onClick={() => toast.info('Data export coming soon', { duration: 1500 })}
          badge="SOON"
        />
        <ActionRow
          label="Deactivate Account"
          description="Temporarily disable your account"
          icon={AlertTriangle}
          onClick={() => toast.info('Account deactivation coming soon', { duration: 1500 })}
        />
        <div className="border-t border-white/5 mt-2 pt-3">
          <ActionRow
            label="Delete Account"
            description="Permanently delete your account and data"
            icon={AlertTriangle}
            onClick={() => toast.error('This action cannot be undone. Contact support.', { duration: 3000 })}
            danger
          />
        </div>
      </SettingsSection>

      {/* ===== ABOUT ===== */}
      <div className="glass-panel rounded-2xl p-5 text-center">
        <img src="/api/uploads?path=images/orra-globe-icon.jpg" alt="ORRA" className="w-12 h-12 rounded-xl object-cover mx-auto mb-3" />
        <p className="text-sm font-bold text-white">ORRA</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Version 2.5.0</p>
        <p className="text-[10px] text-slate-600 mt-1">The next-gen social universe</p>
        {isFounder && (
          <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Crown className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-bold text-amber-300">Founder Edition</span>
          </div>
        )}
      </div>
    </div>
  );
}
