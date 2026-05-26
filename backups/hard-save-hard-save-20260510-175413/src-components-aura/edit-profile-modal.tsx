'use client';

import { useAuraStore } from '@/store/aura-store';
import { useCurrentUser } from '@/lib/use-current-user';
import { X, Camera, Upload, Trash2, Image as ImageIcon, AtSign, RefreshCw } from 'lucide-react';
import { useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

// Generate a handle suggestion from a display name
function generateHandle(name: string): string {
  return '@' + name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // remove special chars
    .split(/\s+/)
    .join('')
    .slice(0, 20);
}

export function EditProfileModal() {
  const { showEditProfile, toggleEditProfile, profileEdits, updateProfile } = useAuraStore();
  const currentUser = useCurrentUser();
  const { update } = useSession();

  const [name, setName] = useState(profileEdits.name ?? currentUser.name);
  const [handle, setHandle] = useState(profileEdits.handle ?? currentUser.handle);
  const [bio, setBio] = useState(profileEdits.bio ?? currentUser.bio);
  const [location, setLocation] = useState(profileEdits.location ?? currentUser.location);
  const [website, setWebsite] = useState(profileEdits.website ?? currentUser.website);
  const [coverImage, setCoverImage] = useState(profileEdits.coverImage ?? currentUser.coverImage);
  const [avatarPreview, setAvatarPreview] = useState(profileEdits.avatar ?? currentUser.avatar);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Track whether the user has manually edited the handle
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);

  // Compute auto-suggested handle based on current name
  const suggestedHandle = useMemo(() => generateHandle(name), [name]);

  // Reset form fields when modal opens (using key pattern to avoid setState-in-effect)
  const [lastOpenState, setLastOpenState] = useState(false);
  if (showEditProfile !== lastOpenState) {
    setLastOpenState(showEditProfile);
    if (showEditProfile) {
      setName(profileEdits.name ?? currentUser.name);
      setHandle(profileEdits.handle ?? currentUser.handle);
      setBio(profileEdits.bio ?? currentUser.bio);
      setLocation(profileEdits.location ?? currentUser.location);
      setWebsite(profileEdits.website ?? currentUser.website);
      setCoverImage(profileEdits.coverImage ?? currentUser.coverImage);
      setAvatarPreview(profileEdits.avatar ?? currentUser.avatar);
      setAvatarDataUrl(null);
      setHandleManuallyEdited(false);
    }
  }

  // Auto-update handle when name changes (unless user manually edited handle)
  const handleNameChange = useCallback((newName: string) => {
    setName(newName);
    if (!handleManuallyEdited) {
      setHandle(generateHandle(newName));
    }
  }, [handleManuallyEdited]);

  const handleHandleChange = useCallback((newHandle: string) => {
    // Ensure handle always starts with @
    let formatted = newHandle.trim().toLowerCase().replace(/[^a-z0-9@_]/g, '');
    if (!formatted.startsWith('@')) {
      formatted = '@' + formatted;
    }
    setHandle(formatted);
    setHandleManuallyEdited(true);
  }, []);

  const applySuggestedHandle = useCallback(() => {
    setHandle(suggestedHandle);
    setHandleManuallyEdited(false);
    toast.success('Handle updated from your name!');
  }, [suggestedHandle]);

  const processImageFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Compress the image to reduce size for API upload and localStorage
        // This prevents mobile crashes from large base64 strings
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 400; // Max avatar dimension
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
            // Fallback: use original
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

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processImageFile]);

  const handleCoverFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) setCoverImage(result);
    };
    reader.readAsDataURL(file);
    if (coverInputRef.current) coverInputRef.current.value = '';
  }, []);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  }, [processImageFile]);

  const handleRemoveAvatar = useCallback(() => {
    setAvatarDataUrl(null);
    // Set preview to default logo to indicate removal
    setAvatarPreview('/api/uploads?path=images/orra-logo.png');
    toast.success('Profile picture removed');
  }, []);

  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, any> = {};

    // Only include fields that have actually changed
    // This prevents accidentally resetting fields like avatar when they weren't modified
    if (name !== (profileEdits.name ?? currentUser.name)) updates.name = name;
    if (handle !== (profileEdits.handle ?? currentUser.handle)) updates.handle = handle;
    if (bio !== (profileEdits.bio ?? currentUser.bio)) updates.bio = bio;
    if (location !== (profileEdits.location ?? currentUser.location)) updates.location = location;
    if (website !== (profileEdits.website ?? currentUser.website)) updates.website = website;

    // Avatar handling: only send if explicitly changed
    if (avatarDataUrl) {
      // User uploaded a NEW avatar (has base64 data)
      updates.avatar = avatarDataUrl;
    } else if ((avatarPreview === '/images/orra-logo.png' || avatarPreview === '/api/uploads?path=images/orra-logo.png') && currentUser.avatar !== '/images/orra-logo.png' && currentUser.avatar !== '/api/uploads?path=images/orra-logo.png') {
      // User explicitly removed their custom avatar (clicked Remove button)
      updates.avatar = '';
    }
    // Otherwise: avatar wasn't changed, don't include it in the update

    // Cover image: only send if changed
    const originalCoverImage = profileEdits.coverImage ?? currentUser.coverImage;
    if (coverImage !== originalCoverImage) {
      updates.coverImage = coverImage;
    }

    // Update the Zustand store immediately for responsive UI
    updateProfile(updates);

    try {
      // Save to database via API so changes persist across page refreshes
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        // CRITICAL FIX: Re-fetch the complete user data from /api/me instead of
        // relying on the profile API response. This ensures ALL fields (avatar URL
        // from file save, follower counts, etc.) are fresh and consistent.
        try {
          const meRes = await fetch('/api/me');
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.success && meData.data?.user) {
              const user = meData.data.user;
              const store = useAuraStore.getState();
              if (store.currentUserProfile) {
                store.setCurrentUser({
                  ...store.currentUserProfile,
                  id: user.id,
                  name: user.name || store.currentUserProfile.name,
                  handle: user.handle || store.currentUserProfile.handle,
                  email: user.email || store.currentUserProfile.email,
                  avatar: user.avatar || '/api/uploads?path=images/orra-logo.png',
                  coverImage: user.coverImage || '/api/uploads?path=images/profile-cover.png',
                  bio: user.bio ?? store.currentUserProfile.bio,
                  location: user.location ?? store.currentUserProfile.location,
                  website: user.website ?? store.currentUserProfile.website,
                  auraTokens: user.auraTokens ?? store.currentUserProfile.auraTokens,
                  auraLevel: user.auraLevel ?? store.currentUserProfile.auraLevel,
                  auraXP: user.auraXP ?? store.currentUserProfile.auraXP,
                  dailyStreak: user.dailyStreak ?? store.currentUserProfile.dailyStreak,
                  verified: user.verified ?? store.currentUserProfile.verified,
                  online: user.online ?? store.currentUserProfile.online,
                  badges: user.badges ?? store.currentUserProfile.badges,
                  followers: user._count?.followers ?? store.currentUserProfile.followers,
                  following: user._count?.follows ?? store.currentUserProfile.following,
                  posts: user._count?.posts ?? store.currentUserProfile.posts,
                  joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : store.currentUserProfile.joinDate,
                  profileSetupComplete: user.profileSetupComplete ?? true,
                } as any);
              }
            }
          }
        } catch (meErr) {
          console.warn('Failed to re-fetch /api/me after profile save:', meErr);
          // Fall back to using the profile API response data
          const data = await res.json().catch(() => null);
          if (data?.success && data?.data) {
            const store = useAuraStore.getState();
            if (store.currentUserProfile) {
              store.setCurrentUser({
                ...store.currentUserProfile,
                name: data.data.name ?? store.currentUserProfile.name,
                handle: data.data.handle ?? store.currentUserProfile.handle,
                avatar: data.data.avatar ?? store.currentUserProfile.avatar,
                coverImage: data.data.coverImage ?? store.currentUserProfile.coverImage,
                bio: data.data.bio ?? store.currentUserProfile.bio,
                location: data.data.location ?? store.currentUserProfile.location,
                website: data.data.website ?? store.currentUserProfile.website,
              });
            }
          }
        }

        // CRITICAL: Invalidate React Query caches so the feed and other components
        // refetch with the updated avatar/profile. Without this, posts still show
        // the old cached avatar even though the DB has been updated.
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['me'] });
        queryClient.invalidateQueries({ queryKey: ['stories'] });
        queryClient.invalidateQueries({ queryKey: ['reels'] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['hubs'] });

        // Update NextAuth session so JWT reflects the new avatar/handle
        // This prevents stale session data from showing old avatar on refresh
        try { await update(); } catch {}

        // Clear ALL profileEdits since the full profile is now fresh from the API
        // This prevents stale profileEdits from overriding the fresh DB data on next render
        useAuraStore.setState({
          profileEdits: { name: null, handle: null, bio: null, location: null, website: null, coverImage: null, avatar: null },
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('Profile save to server returned non-OK:', res.status, errData);
        toast.error('Failed to save to server. Your changes are local only — they may not persist after refresh.');
      }
    } catch (fetchErr) {
      // Network error — local state is still saved, but warn the user
      console.warn('Profile save to server failed, but local state is saved:', fetchErr);
      toast.error('Network error — changes saved locally but may not persist after refresh.');
    } finally {
      setSaving(false);
    }

    toggleEditProfile();
    toast.success('Profile updated!');
  };

  if (!showEditProfile) return null;

  const isCustomAvatar = avatarPreview !== currentUser.avatar
    && avatarPreview !== '/images/orra-logo.png'
    && avatarPreview !== '/api/uploads?path=images/orra-logo.png';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={toggleEditProfile} />
      <div className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-violet-500/20 max-h-[90vh] overflow-y-auto">
        <button onClick={toggleEditProfile} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-5">Edit Profile</h2>

        {/* Profile Picture Upload */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-400 mb-2">Profile Sphere</label>
          <div
            className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-dashed transition-all duration-300 ${
              isDragging
                ? 'border-violet-400 bg-violet-600/10'
                : 'border-white/10 bg-white/[0.02] hover:border-violet-500/40'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Avatar Preview with Camera Overlay */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden ring-3 ring-violet-500/40 aura-glow-ring">
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Camera Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
              {/* Animated Ring Pulse */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-30 blur-md transition-all duration-300" />
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-300 font-medium">
                {isDragging ? 'Drop your image here!' : 'Click the sphere or drag & drop'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, GIF, or WebP • Max 5MB</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-all border border-violet-500/20"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Photo
              </button>
              {isCustomAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/10 text-red-400 text-xs font-semibold hover:bg-red-600/20 transition-all border border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Cover Image Upload */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cover Image</label>
          <div className="flex items-center gap-2">
            {coverImage && (
              <div className="w-16 h-10 rounded-lg overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={coverImage.startsWith('data:') ? '(Uploaded image)' : coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all"
                title="Upload cover image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleCoverFileSelect}
            className="hidden"
          />
        </div>

        {/* Text Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
              />
              {handle !== suggestedHandle && (
                <button
                  type="button"
                  onClick={applySuggestedHandle}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-all"
                  title={`Sync to ${suggestedHandle}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {handle !== suggestedHandle && (
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Suggested from name:</span>
                <button
                  type="button"
                  onClick={applySuggestedHandle}
                  className="text-violet-400 hover:text-violet-300 font-semibold"
                >
                  {suggestedHandle}
                </button>
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={toggleEditProfile}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all glow-violet disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
