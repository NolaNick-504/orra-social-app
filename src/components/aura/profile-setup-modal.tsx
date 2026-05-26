'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  Camera,
  Upload,
  AtSign,
  RefreshCw,
  Sparkles,
  ArrowRight,
  MapPin,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

// Generate a handle suggestion from a display name
function generateHandle(name: string): string {
  return (
    '@' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .join('')
      .slice(0, 20)
  );
}

export function ProfileSetupModal() {
  const { currentUserProfile, updateProfile } = useAuraStore();
  const currentUser = useCurrentUser();

  // For new users (no currentUserProfile in store), use session data only.
  // Never fall back to mock data — new users should start with empty fields.
  const hasRealProfile = currentUserProfile !== null;

  const [step, setStep] = useState(0); // 0: avatar, 1: name/handle, 2: bio/details
  const [name, setName] = useState(hasRealProfile ? (currentUserProfile.name || '') : (currentUser.name || ''));
  const [handle, setHandle] = useState(hasRealProfile ? (currentUserProfile.handle || '') : (currentUser.handle || ''));
  const [bio, setBio] = useState(hasRealProfile ? (currentUserProfile.bio || '') : '');
  const [location, setLocation] = useState(hasRealProfile ? (currentUserProfile.location || '') : '');
  const [website, setWebsite] = useState(hasRealProfile ? (currentUserProfile.website || '') : '');
  const [avatarPreview, setAvatarPreview] = useState(
    hasRealProfile
      ? (currentUserProfile.avatar || '/api/uploads?path=images/orra-logo.png')
      : '/api/uploads?path=images/orra-logo.png'
  );
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestedHandle = useMemo(() => generateHandle(name), [name]);

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
      if (!handleManuallyEdited) {
        setHandle(generateHandle(newName));
      }
    },
    [handleManuallyEdited]
  );

  const handleHandleChange = useCallback((newHandle: string) => {
    let formatted = newHandle.trim().toLowerCase().replace(/[^a-z0-9@_]/g, '');
    if (!formatted.startsWith('@')) {
      formatted = '@' + formatted;
    }
    setHandle(formatted);
    setHandleManuallyEdited(true);
  }, []);

  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Compress the image to reduce size for API upload and localStorage
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height / width) * MAX_SIZE);
              width = MAX_SIZE;
            } else {
              width = Math.round((width / height) * MAX_SIZE);
              height = MAX_SIZE;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setAvatarDataUrl(compressed);
            setAvatarPreview(compressed);
          } else {
            setAvatarDataUrl(result);
            setAvatarPreview(result);
          }
        };
        img.src = result;
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read image. Please try again.');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImageFile(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [processImageFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processImageFile(file);
    },
    [processImageFile]
  );

  const { update } = useSession();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);

    try {
      const updates: Record<string, string> = {
        name,
        handle,
        bio,
        location,
        website,
      };

      if (avatarDataUrl) {
        updates.avatar = avatarDataUrl;
      }

      // Update the store immediately for responsive UI
      updateProfile(updates);

      // Mark setup as complete IMMEDIATELY so user can proceed
      // This ensures the user is never stuck on this screen
      useAuraStore.setState({
        profileSetupComplete: true,
        isHydrated: true,
      });

      toast.success('Profile created! Welcome to ORRA!');

      // Save to database via API — await to ensure persistence
      try {
        const res = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updates,
            profileSetupComplete: true,
          }),
        });
        if (res.ok) {
          // Update NextAuth session so JWT reflects new avatar/handle
          try { update(); } catch {}
          // Invalidate React Query caches so feed shows updated profile
          queryClient.invalidateQueries({ queryKey: ['posts'] });
          queryClient.invalidateQueries({ queryKey: ['user'] });
          queryClient.invalidateQueries({ queryKey: ['me'] });
        } else {
          console.warn('Profile save to server returned non-OK, but local state is saved');
        }
      } catch (fetchErr) {
        // Network error — local state is still saved, user can proceed
        console.warn('Profile save to server failed, but local state is saved:', fetchErr);
      }
    } catch (e) {
      // Even on error, still let the user proceed
      useAuraStore.setState({
        profileSetupComplete: true,
        isHydrated: true,
      });
      toast.success('Profile saved! Welcome to ORRA!');
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-[#050505] overflow-y-auto">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-fuchsia-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 my-4 sm:my-0">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold gradient-text">Set Up Your Profile</span>
            </div>
            <span className="text-xs text-slate-500">
              {step + 1} of {totalSteps}
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 border border-violet-500/20">
          {/* Step 0: Avatar Upload */}
          {step === 0 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold text-white mb-2">Add Your Profile Picture</h2>
              <p className="text-sm text-slate-400 mb-6">
                This is how others will see you on ORRA. You can always change it later.
              </p>

              <div
                className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                  isDragging
                    ? 'border-violet-400 bg-violet-600/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-violet-500/40'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Avatar Preview */}
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-violet-500/30 aura-glow-ring">
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  {/* Camera Overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-30 blur-md transition-all duration-300" />
                </div>

                <div className="text-center">
                  <p className="text-sm text-slate-300 font-medium">
                    {isDragging ? 'Drop your image here!' : 'Tap the circle or drag & drop'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, GIF, or WebP · Max 5MB</p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/20 text-violet-300 text-sm font-semibold hover:bg-violet-600/30 transition-all border border-violet-500/20"
                >
                  <Upload className="w-4 h-4" /> Upload Photo
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-violet"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-all"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 1: Name & Handle */}
          {step === 1 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold text-white mb-2">Your Name & Handle</h2>
              <p className="text-sm text-slate-400 mb-6">
                This is your identity on ORRA. Choose something that represents you.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username / Handle</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => handleHandleChange(e.target.value)}
                      placeholder="@yourhandle"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                    {handle !== suggestedHandle && (
                      <button
                        type="button"
                        onClick={() => {
                          setHandle(suggestedHandle);
                          setHandleManuallyEdited(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-all"
                        title={`Sync to ${suggestedHandle}`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {handle !== suggestedHandle && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Suggested:{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setHandle(suggestedHandle);
                          setHandleManuallyEdited(false);
                        }}
                        className="text-violet-400 hover:text-violet-300 font-semibold"
                      >
                        {suggestedHandle}
                      </button>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!name.trim() || !handle.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-violet disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Bio & Details */}
          {step === 2 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold text-white mb-2">Tell Us About Yourself</h2>
              <p className="text-sm text-slate-400 mb-6">
                Add a bio and some details to help others connect with you.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="What are you about? What vibes are you bringing to ORRA?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="New Orleans, LA"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Website</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="orra.app/yourname"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-violet disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Start Vibing
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-all disabled:opacity-50"
              >
                Skip & set up later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
