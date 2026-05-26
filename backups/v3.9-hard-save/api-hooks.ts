'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Types
// ============================================

interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  website: string;
  verified: boolean;
  online: boolean;
  auraTokens: number;
  auraLevel: number;
  auraXP: number;
  dailyStreak: number;
  badges: string;
  _count?: {
    posts: number;
    follows: number;
    followers: number;
  };
  isFollowing?: boolean;
  isSelf?: boolean;
  createdAt: string;
}

interface PostAuthor {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
}

interface Post {
  id: string;
  text: string;
  images: string;
  vibeTag: string;
  type: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  author: PostAuthor;
  isLiked: boolean;
  isSaved: boolean;
  isReposted: boolean;
  createdAt: string;
  _count?: {
    comments: number;
    postLikes: number;
    postSaves: number;
    reposts: number;
  };
  poll?: {
    id: string;
    question: string;
    options: { id: string; text: string; voteCount: number; voted: boolean }[];
    totalVotes: number;
    expiresAt: string;
  };
}

interface ChatData {
  id: string;
  otherUser: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    online: boolean;
  } | null;
  lastMessage: {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface NotificationData {
  id: string;
  action: string;
  type: string;
  read: boolean;
  thumbnail: string;
  triggeredByUser: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  } | null;
  createdAt: string;
}

interface ReelData {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  category: string;
  song: string;
  isRemix: boolean;
  isLive: boolean;
  creator: PostAuthor;
  isLiked?: boolean;
  isSaved?: boolean;
}

interface StoryData {
  id: string;
  image: string;
  viewed: boolean;
  author: PostAuthor;
  createdAt: string;
  expiresAt: string;
}

interface StoryGroupData {
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
  stories: {
    id: string;
    image: string;
    viewed: boolean;
    createdAt: string;
    expiresAt: string;
  }[];
}

interface HubData {
  id: string;
  name: string;
  icon: string;
  cover: string;
  description: string;
  membersCount: number;
  onlineCount: number;
  isMember?: boolean;
}

interface DanceChallengeData {
  id: string;
  name: string;
  hashtag: string;
  song: string;
  description: string;
  prize: string;
  secondPrize: string;
  thirdPrize: string;
  bannerImage: string;
  timeRemaining: number;
  active: boolean;
  entries: DanceEntryData[];
  hasSubmitted?: boolean;
}

interface DanceEntryData {
  id: string;
  description: string;
  thumbnail: string;
  likesCount: number;
  author: PostAuthor;
}

// ============================================
// Fetch helper
// ============================================

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data as T;
}

// ============================================
// User Hooks
// ============================================

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiFetch<UserProfile>(`/api/users/${userId}`),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================
// Posts Hooks
// ============================================

export function usePosts(vibeTag?: string, page = 1) {
  const params = new URLSearchParams();
  if (vibeTag) params.set('vibeTag', vibeTag);
  params.set('page', String(page));
  params.set('limit', '20');

  return useQuery({
    queryKey: ['posts', vibeTag, page],
    queryFn: () => apiFetch<{ posts: Post[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/posts?${params.toString()}`),
    staleTime: 1000 * 15, // 15 seconds — don't refetch on every mount
    refetchInterval: 30000, // Auto-poll every 30 seconds for new posts (was 5s — too aggressive)
    refetchOnWindowFocus: true, // Refetch when user switches back to tab
    refetchOnMount: 'always', // Always refetch when component mounts to ensure fresh posts
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { text: string; images?: string[]; vibeTag?: string; type?: string; uploadedFiles?: { data: string; filename: string; contentType: string }[] }) =>
      apiFetch<Post>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ============================================
// Upload Hook (DEPRECATED — files are now sent as base64
// directly in the POST /api/posts body via uploadedFiles.
// The POST /api/upload endpoint does not exist.)
// ============================================

export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      throw new Error('useUploadFile is deprecated. Send files as base64 via createPostMutation instead.');
    },
  });
}

// ============================================
// Poll Hooks
// ============================================

export function useCreatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { postId: string; question: string; options: string[]; duration: number }) =>
      apiFetch<any>('/api/polls/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { optionId: string }) =>
      apiFetch<{ optionId: string; voteCount: number }>('/api/polls/vote', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function usePoll(postId: string | null) {
  return useQuery({
    queryKey: ['poll', postId],
    queryFn: () => apiFetch<any>(`/api/polls/${postId}`),
    enabled: !!postId,
    staleTime: 1000 * 30,
  });
}

// ============================================
// Reel Creation Hook
// ============================================

export function useCreateReel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; thumbnail?: string; videoUrl: string; category?: string; song?: string }) =>
      apiFetch<any>('/api/reels', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}

// ============================================
// Likes Hooks
// ============================================

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: string }) =>
      apiFetch('/api/likes', {
        method: 'POST',
        body: JSON.stringify({ targetId, targetType }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}

// ============================================
// Follows Hooks
// ============================================

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      apiFetch('/api/follows', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// ============================================
// Comments Hooks
// ============================================

export function useComments(postId: string | null) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => apiFetch<{ comments: { id: string; text: string; author: PostAuthor; createdAt: string }[] }>(`/api/comments?postId=${postId}&limit=50`),
    enabled: !!postId,
    staleTime: 1000 * 15,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, text }: { postId: string; text: string }) =>
      apiFetch('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ postId, text }),
      }),
    onSuccess: (_, variables) => {
      // Invalidate both comments and posts so the new comment and count show up
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ============================================
// Chats Hooks
// ============================================

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: () => apiFetch<ChatData[]>('/api/chats'),
    staleTime: 1000 * 15, // 15 seconds
  });
}

export function useChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: () => apiFetch<any[]>(`/api/chats/${chatId}/messages`),
    enabled: !!chatId,
    staleTime: 1000 * 10,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, text }: { chatId: string; text: string }) =>
      apiFetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

// ============================================
// Notifications Hooks
// ============================================

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<{ notifications: NotificationData[]; unreadCount: number }>('/api/notifications'),
    staleTime: 1000 * 30,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, all }: { id?: string; all?: boolean }) =>
      apiFetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ id, all }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ============================================
// Reels Hooks
// ============================================

export function useReels(category?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);

  return useQuery({
    queryKey: ['reels', category],
    queryFn: () => apiFetch<ReelData[]>(`/api/reels?${params.toString()}`),
    staleTime: 1000 * 60,
  });
}

// ============================================
// Stories Hooks
// ============================================

export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: () => apiFetch<StoryGroupData[]>('/api/stories'),
    staleTime: 1000 * 30,
  });
}

// ============================================
// Hubs Hooks
// ============================================

export function useHubs() {
  return useQuery({
    queryKey: ['hubs'],
    queryFn: () => apiFetch<HubData[]>('/api/hubs'),
    staleTime: 1000 * 60,
  });
}

export function useJoinHub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hubId }: { hubId: string }) =>
      apiFetch(`/api/hubs/${hubId}/join`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] });
    },
  });
}

// ============================================
// Dance Challenge Hooks
// ============================================

export function useDanceChallenge() {
  return useQuery({
    queryKey: ['dance'],
    queryFn: () => apiFetch<DanceChallengeData>('/api/dance'),
    staleTime: 1000 * 60,
  });
}

// ============================================
// ORRA (Token/XP) Hooks
// ============================================

export function useAura() {
  return useQuery({
    queryKey: ['aura'],
    queryFn: () => apiFetch<any>('/api/orra'),
    staleTime: 1000 * 60,
  });
}

// ============================================
// Search Hook
// ============================================

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => apiFetch<any>(`/api/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
    staleTime: 1000 * 30,
  });
}

// ============================================
// Saves Hook
// ============================================

export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: string }) =>
      apiFetch('/api/saves', {
        method: 'POST',
        body: JSON.stringify({ targetId, targetType }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}

// ============================================
// Repost Hook
// ============================================

export function useToggleRepost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId }: { postId: string }) =>
      apiFetch('/api/reposts', {
        method: 'POST',
        body: JSON.stringify({ postId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// ============================================
// Export types for use in components
// ============================================

export type {
  UserProfile,
  Post,
  PostAuthor,
  ChatData,
  NotificationData,
  ReelData,
  StoryData,
  StoryGroupData,
  HubData,
  DanceChallengeData,
  DanceEntryData,
};
