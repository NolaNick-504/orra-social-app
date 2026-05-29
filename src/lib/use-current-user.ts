'use client';

import { useSession } from 'next-auth/react';
import { useAuraStore, type CurrentUser } from '@/store/aura-store';

/**
 * Hook that returns the current user's data.
 * Uses the authenticated user profile from the Zustand store (populated from API),
 * falls back to NextAuth session data. No mock fallback.
 * Also applies profileEdits overrides.
 */
export function useCurrentUser() {
  const { data: session } = useSession();
  const { currentUserProfile, profileEdits } = useAuraStore();

  // Priority: currentUserProfile > session user
  // Never fall back to mock data — only use real authenticated user data.
  const sessionUser: CurrentUser | null = session?.user ? {
    id: (session.user as any).id || '',
    name: session.user.name || '',
    handle: (session.user as any).handle || '',
    email: session.user.email || '',
    avatar: (session.user as any).avatar || '/api/uploads?path=images/orra-logo.png',
    coverImage: '/api/uploads?path=images/profile-cover.png',
    bio: (session.user as any).bio || '',
    location: (session.user as any).location || '',
    website: (session.user as any).website || '',
    verified: false,
    online: true,
    auraTokens: (session.user as any).auraTokens || 100,
    auraLevel: (session.user as any).auraLevel || 1,
    auraXP: 50,
    dailyStreak: 0,
    badges: '[]',
    followers: 0,
    following: 0,
    posts: 0,
    joinDate: '',
    profileSongUrl: '',
    profileSongTitle: '',
    profileSongArtist: '',
    activeTheme: '',
    activeNameEffect: '',
    customTitle: '',
  } : null;

  // Use currentUserProfile (from API) or session data. No mock fallback.
  const base: CurrentUser = currentUserProfile || sessionUser || {
    id: '',
    name: '',
    handle: '',
    email: '',
    avatar: '/api/uploads?path=images/orra-logo.png',
    coverImage: '/api/uploads?path=images/profile-cover.png',
    bio: '',
    location: '',
    website: '',
    verified: false,
    online: true,
    auraTokens: 100,
    auraLevel: 1,
    auraXP: 50,
    dailyStreak: 0,
    badges: '[]',
    followers: 0,
    following: 0,
    posts: 0,
    joinDate: '',
    profileSongUrl: '',
    profileSongTitle: '',
    profileSongArtist: '',
    activeTheme: '',
    activeNameEffect: '',
    customTitle: '',
  };

  // Apply profile edits (user's manual changes in Edit Profile)
  const displayName = profileEdits.name ?? base.name;
  const displayHandle = profileEdits.handle ?? base.handle;
  const displayAvatar = profileEdits.avatar ?? base.avatar;
  const displayBio = profileEdits.bio ?? base.bio;
  const displayLocation = profileEdits.location ?? base.location;
  const displayWebsite = profileEdits.website ?? base.website;
  const displayCoverImage = profileEdits.coverImage ?? base.coverImage;

  return {
    id: base.id,
    name: displayName,
    handle: displayHandle,
    email: base.email,
    avatar: displayAvatar,
    coverImage: displayCoverImage,
    bio: displayBio,
    location: displayLocation,
    website: displayWebsite,
    verified: base.verified,
    online: base.online,
    auraTokens: base.auraTokens,
    auraLevel: base.auraLevel,
    auraXP: base.auraXP,
    dailyStreak: base.dailyStreak,
    badges: base.badges,
    followers: base.followers,
    following: base.following,
    posts: base.posts,
    joinDate: base.joinDate,
    profileSongUrl: base.profileSongUrl || '',
    profileSongTitle: base.profileSongTitle || '',
    profileSongArtist: base.profileSongArtist || '',
    activeTheme: base.activeTheme || '',
    activeNameEffect: base.activeNameEffect || '',
    customTitle: base.customTitle || '',
  };
}
