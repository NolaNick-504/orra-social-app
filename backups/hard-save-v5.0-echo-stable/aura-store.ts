import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavView = 'home' | 'explore' | 'reels' | 'dance' | 'games' | 'hub' | 'messages' | 'activity' | 'profile' | 'wellness' | 'marketplace' | 'settings';

export interface UserSettings {
  // Notifications
  pushNotifications: boolean;
  emailNotifications: boolean;
  tokenAlerts: boolean;
  newFollowers: boolean;
  echoAlerts: boolean;
  messageAlerts: boolean;
  // Daily Digest
  digestEnabled: boolean;
  digestPushNotification: boolean;
  digestTimes: ('morning' | 'evening' | 'night')[];
  // Appearance
  holographicEffects: boolean;
  hapticFeedback: boolean;
  reducedMotion: boolean;
  compactMode: boolean;
  // Content & Media
  autoPlayReels: boolean;
  showSensitiveContent: boolean;
  language: string;
  // Privacy (legacy compat)
  showOnlineStatus: boolean;
  allowStrangerMessages: boolean;
  nsfwFilter: boolean;
  highContrastText: boolean;
}
export type HomeTab = 'pulse' | 'prism' | 'hub';

export type { CurrentUser };

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
  imageUrl?: string;
  reaction?: string;
}

export interface UserPost {
  id: string;
  text: string;
  images: string[];
  createdAt: number;
  vibeTag?: string;
  type?: string;
}

export interface Notification {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  time: string;
  type: 'like' | 'follow' | 'comment' | 'share' | 'mention' | 'remix' | 'feature' | 'token' | 'levelup' | 'challenge' | 'hub';
  read: boolean;
  thumbnail?: string | null;
}

export interface DanceEntry {
  id: string;
  text: string;
  createdAt: number;
}

export interface PrismChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  mode?: 'companion' | 'remix' | 'coach';
}

interface CurrentUser {
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
  followers: number;
  following: number;
  posts: number;
  joinDate: string;
  profileSetupComplete?: boolean;
}

interface AuraState {
  // Navigation
  currentView: NavView;
  homeTab: HomeTab;

  // Modals
  showVibeCheck: boolean;
  showCreatePost: boolean;
  createPostType: 'text' | 'image' | 'poll' | 'reel';
  showStoryViewer: boolean;
  showShareModal: boolean;
  showReelViewer: boolean;
  showEditProfile: boolean;

  // Selected items
  currentVibe: string | null;
  selectedVibes: string[]; // Multiple vibes for Community Vibe bar
  selectedStoryIndex: number;
  selectedReelId: string | null;
  sharePostId: string | null;

  // Search
  searchQuery: string;

  // Current authenticated user (from API)
  currentUserId: string | null;
  currentUserProfile: CurrentUser | null;
  isHydrated: boolean;
  profileSetupComplete: boolean;

  // Social interactions
  likedPosts: Set<string>;
  likedReels: Set<string>;
  postReactions: Record<string, string>; // postId -> reactionType (like, wow, omg, etc.)
  followedUsers: Set<string>;
  savedPosts: Set<string>;
  savedReels: Set<string>;

  // Token earned tracking (anti-farming: each action only earns tokens once per item)
  likedPostsEarned: Set<string>;
  likedReelsEarned: Set<string>;
  followedUsersEarned: Set<string>;
  repostedEarned: Set<string>;
  sharedViaDMEarned: Set<string>;
  votedEntriesEarned: Set<string>;

  // Comments
  comments: Record<string, Comment[]>;
  expandedComments: Set<string>;
  scrollToPostId: string | null; // Set by notification click to auto-scroll to a post

  // Chat
  chatMessages: Record<string, ChatMessage[]>;
  selectedChatId: string | null;
  chatReactions: Record<string, string>; // messageId -> reaction

  // User posts (newly created)
  userPosts: UserPost[];

  // Profile edits
  profileEdits: {
    name: string | null;
    handle: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    coverImage: string | null;
    avatar: string | null;
  };

  // Notifications
  customNotifications: Notification[];

  // ORRA Sphere - Token & Level System
  auraTokens: number;
  auraLevel: number;
  auraXP: number;
  dailyStreak: number;
  lastActiveDate: string;

  // Hub membership
  joinedHubs: Set<string>;

  // Dance Challenge
  danceEntries: DanceEntry[];
  votedEntries: Set<string>;

  // Stories
  viewedStories: Set<string>;

  // Reposts
  repostIds: Set<string>;

  // Shared via DM
  sharedViaDM: Set<string>;

  // Hub following
  followedHubs: Set<string>;

  // Reel view tracking
  viewedReels: Set<string>;

  // Unread messages per chat
  unreadMessages: Record<string, number>;

  // Recent searches
  recentSearches: string[];

  // AI Prism Companion
  prismCompanionOpen: boolean;
  prismMessages: PrismChatMessage[];
  prismCompanionMode: 'companion' | 'remix' | 'coach';
  prismIsTyping: boolean;
  wellnessScore: number; // 0-100
  lastWellnessTip: string | null;

  // User Settings
  userSettings: UserSettings;
  lastDigestDate: string;
  showDigest: boolean;

  // Viewing other user's profile
  viewingUserId: string | null;
  setViewingUser: (userId: string | null) => void;

  // API Hydration actions
  setCurrentUser: (user: CurrentUser) => void;
  hydrateFromAPI: (data: {
    user: CurrentUser;
    likedPosts?: string[];
    likedReels?: string[];
    postReactions?: Record<string, string>;
    followedUsers?: string[];
    savedPosts?: string[];
    savedReels?: string[];
    joinedHubs?: string[];
    repostIds?: string[];
    viewedStories?: string[];
    viewedReels?: string[];
    votedEntries?: string[];
    followedHubs?: string[];
  }) => void;
  resetStore: () => void;

  // Actions
  setView: (view: NavView) => void;
  setHomeTab: (tab: HomeTab) => void;
  toggleVibeCheck: () => void;
  toggleCreatePost: (type?: 'text' | 'image' | 'poll' | 'reel') => void;
  toggleStoryViewer: () => void;
  toggleShareModal: (postId?: string | null) => void;
  toggleReelViewer: (reelId?: string | null) => void;
  toggleEditProfile: () => void;
  setVibe: (vibe: string) => void;
  setSelectedVibes: (vibes: string[]) => void;
  toggleSelectedVibe: (vibe: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedStoryIndex: (index: number) => void;
  setSelectedChatId: (id: string | null) => void;

  // Social actions
  toggleLike: (postId: string, reactionType?: string) => void;
  setPostReaction: (postId: string, reactionType: string) => void;
  toggleReelLike: (reelId: string) => void;
  toggleFollow: (userId: string) => void;
  toggleSave: (postId: string) => void;
  toggleSaveReel: (reelId: string) => void;
  toggleRepost: (postId: string) => void;
  shareViaDM: (postId: string) => void;

  // Comments
  addComment: (postId: string, userId: string, userName: string, userAvatar: string, text: string) => void;
  toggleComments: (postId: string) => void;
  setScrollToPostId: (postId: string | null) => void;

  // Chat
  sendMessage: (chatId: string, senderId: string, text: string, imageUrl?: string) => void;
  addReaction: (messageId: string, reaction: string) => void;

  // Posts
  addUserPost: (text: string, images: string[], vibeTag?: string, type?: string) => void;
  deleteUserPost: (postId: string) => void;

  // Profile
  updateProfile: (edits: { name?: string; handle?: string; bio?: string; location?: string; website?: string; coverImage?: string; avatar?: string }) => void;

  // Notifications
  addNotification: (notif: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadNotificationCount: () => number;

  // ORRA Sphere
  earnTokens: (amount: number, reason: string) => void;
  addXP: (amount: number) => void;
  checkDailyStreak: () => void;

  // Hub
  joinHub: (hubId: string) => void;
  leaveHub: (hubId: string) => void;

  // Dance
  submitDanceEntry: (text: string) => void;
  voteEntry: (entryId: string) => void;

  // Stories
  markStoryViewed: (storyId: string) => void;

  // Reel tracking
  markReelViewed: (reelId: string) => void;

  // Unread messages
  markChatRead: (chatId: string) => void;

  // Recent searches
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Settings
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  dismissDigest: () => void;
}

/**
 * Helper: Calculate XP level-up results.
 * XP resets at 1000 and level increments each time it crosses 1000.
 * Handles multiple level-ups in a single XP award.
 */
function calculateXPLevelUp(currentXP: number, currentLevel: number, xpToAdd: number): {
  newXP: number;
  newLevel: number;
  levelUps: number;
} {
  let newXP = currentXP + xpToAdd;
  let newLevel = currentLevel;
  let levelUps = 0;
  while (newXP >= 1000) {
    newXP -= 1000;
    newLevel += 1;
    levelUps++;
  }
  return { newXP, newLevel, levelUps };
}

export const useAuraStore = create<AuraState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'home',
      homeTab: 'pulse',

      // Current user
      currentUserId: null,
      currentUserProfile: null,
      isHydrated: false,
      profileSetupComplete: false,

      // Modals
      showVibeCheck: false,
      showCreatePost: false,
      createPostType: 'text' as const,
      showStoryViewer: false,
      showShareModal: false,
      showReelViewer: false,
      showEditProfile: false,

      // Selected items
      currentVibe: null,
      selectedVibes: [],
      selectedStoryIndex: 0,
      selectedReelId: null,
      sharePostId: null,

      // Search
      searchQuery: '',

      // Social interactions
      likedPosts: new Set<string>(),
      likedReels: new Set<string>(),
      postReactions: {},
      followedUsers: new Set<string>(),
      savedPosts: new Set<string>(),
      savedReels: new Set<string>(),

      // Token earned tracking
      likedPostsEarned: new Set<string>(),
      likedReelsEarned: new Set<string>(),
      followedUsersEarned: new Set<string>(),
      repostedEarned: new Set<string>(),
      sharedViaDMEarned: new Set<string>(),
      votedEntriesEarned: new Set<string>(),

      // Comments
      comments: {},
      expandedComments: new Set<string>(),
      scrollToPostId: null,

      // Chat
      chatMessages: {},
      selectedChatId: null,
      chatReactions: {},

      // User posts
      userPosts: [],

      // Profile edits
      profileEdits: {
        name: null,
        handle: null,
        bio: null,
        location: null,
        website: null,
        coverImage: null,
        avatar: null,
      },

      // Notifications
      customNotifications: [],

      // ORRA Sphere
      auraTokens: 100,
      auraLevel: 1,
      auraXP: 50,
      dailyStreak: 0,
      lastActiveDate: '', // Will be set by client-side checkDailyStreak — never use new Date() in defaults to avoid hydration mismatch

      // Hub membership
      joinedHubs: new Set<string>(),

      // Dance Challenge
      danceEntries: [],
      votedEntries: new Set<string>(),

      // Stories
      viewedStories: new Set<string>(),

      // Reposts
      repostIds: new Set<string>(),

      // Shared via DM
      sharedViaDM: new Set<string>(),

      // Hub following
      followedHubs: new Set<string>(),

      // Reel view tracking
      viewedReels: new Set<string>(),

      // Unread messages per chat (initialized from data)
      unreadMessages: {},

      // Recent searches
      recentSearches: [],

      // AI Prism Companion
      prismCompanionOpen: false,
      prismMessages: [],
      prismCompanionMode: 'companion' as const,
      prismIsTyping: false,
      wellnessScore: 50,
      lastWellnessTip: null,

      // User Settings
      userSettings: {
        pushNotifications: true,
        emailNotifications: true,
        tokenAlerts: true,
        newFollowers: true,
        echoAlerts: true,
        messageAlerts: true,
        digestEnabled: true,
        digestPushNotification: true,
        digestTimes: ['morning'],
        holographicEffects: true,
        hapticFeedback: true,
        reducedMotion: false,
        compactMode: false,
        autoPlayReels: true,
        showSensitiveContent: false,
        language: 'English',
        showOnlineStatus: true,
        allowStrangerMessages: false,
        nsfwFilter: true,
        highContrastText: false,
      },
      lastDigestDate: '',
      showDigest: false,

      // Viewing other user's profile
      viewingUserId: null as string | null,

      // API Hydration actions
      setCurrentUser: (user) => set((s) => {
        // Always clear profileEdits when setting user from API — API is source of truth
        // This prevents stale localStorage edits (e.g. old location) from overriding fresh API data
        return {
          currentUserId: user.id,
          currentUserProfile: user,
          profileEdits: { name: null, handle: null, bio: null, location: null, website: null, coverImage: null, avatar: null },
          auraTokens: user.auraTokens,
          auraLevel: user.auraLevel,
          auraXP: user.auraXP,
          dailyStreak: user.dailyStreak,
          profileSetupComplete: (user as any).profileSetupComplete ?? false,
        };
      }),

      hydrateFromAPI: (data) => set((s) => {
        // Always clear ALL profileEdits when hydrating from API — API is source of truth after page load.
        // This prevents stale localStorage edits (e.g. old location "San Francisco, CA") from
        // overriding fresh API data (e.g. "New Orleans, LA").
        return {
          currentUserId: data.user.id,
          currentUserProfile: data.user,
          isHydrated: true,
          profileSetupComplete: (data.user as any).profileSetupComplete ?? false,
          profileEdits: { name: null, handle: null, bio: null, location: null, website: null, coverImage: null, avatar: null },
          auraTokens: data.user.auraTokens,
          auraLevel: data.user.auraLevel,
          auraXP: data.user.auraXP,
          dailyStreak: data.user.dailyStreak,
          likedPosts: data.likedPosts ? new Set([...s.likedPosts, ...data.likedPosts]) : s.likedPosts,
          likedReels: data.likedReels ? new Set([...s.likedReels, ...data.likedReels]) : s.likedReels,
          postReactions: data.postReactions ? { ...s.postReactions, ...data.postReactions } : s.postReactions,
          followedUsers: data.followedUsers ? new Set([...s.followedUsers, ...data.followedUsers]) : s.followedUsers,
          savedPosts: data.savedPosts ? new Set([...s.savedPosts, ...data.savedPosts]) : s.savedPosts,
          savedReels: data.savedReels ? new Set([...s.savedReels, ...data.savedReels]) : s.savedReels,
          joinedHubs: data.joinedHubs ? new Set([...s.joinedHubs, ...data.joinedHubs]) : s.joinedHubs,
          repostIds: data.repostIds ? new Set([...s.repostIds, ...data.repostIds]) : s.repostIds,
          viewedStories: data.viewedStories ? new Set([...s.viewedStories, ...data.viewedStories]) : s.viewedStories,
          viewedReels: data.viewedReels ? new Set([...s.viewedReels, ...data.viewedReels]) : s.viewedReels,
          votedEntries: data.votedEntries ? new Set([...s.votedEntries, ...data.votedEntries]) : s.votedEntries,
          followedHubs: data.followedHubs ? new Set([...s.followedHubs, ...data.followedHubs]) : s.followedHubs,
        };
      }),

      resetStore: () => set({
        currentUserId: null,
        currentUserProfile: null,
        isHydrated: false,
        profileSetupComplete: false,
        currentView: 'home',
        homeTab: 'pulse',
        selectedVibes: [],
        showCreatePost: false,
        createPostType: 'text' as const,
        likedPosts: new Set<string>(),
        likedReels: new Set<string>(),
        postReactions: {},
        followedUsers: new Set<string>(),
        savedPosts: new Set<string>(),
        savedReels: new Set<string>(),
        likedPostsEarned: new Set<string>(),
        likedReelsEarned: new Set<string>(),
        followedUsersEarned: new Set<string>(),
        repostedEarned: new Set<string>(),
        sharedViaDMEarned: new Set<string>(),
        votedEntriesEarned: new Set<string>(),
        comments: {},
        chatMessages: {},
        userPosts: [],
        profileEdits: { name: null, handle: null, bio: null, location: null, website: null, coverImage: null, avatar: null },
        customNotifications: [],
        auraTokens: 100,
        auraLevel: 1,
        auraXP: 50,
        dailyStreak: 0,
        joinedHubs: new Set<string>(),
        danceEntries: [],
        votedEntries: new Set<string>(),
        viewedStories: new Set<string>(),
        repostIds: new Set<string>(),
        sharedViaDM: new Set<string>(),
        followedHubs: new Set<string>(),
        viewedReels: new Set<string>(),
        unreadMessages: {},
        recentSearches: [],
        viewingUserId: null,
      }),

      // Navigation actions
      setView: (view) => set({ currentView: view }),
      setHomeTab: (tab) => set({ homeTab: tab }),

      // Modal toggles
      toggleVibeCheck: () => set((s) => ({ showVibeCheck: !s.showVibeCheck })),
      toggleCreatePost: (type) => set((s) => {
        // If a type is specified and modal is already open, just switch the type (don't close)
        // If no type specified, toggle the modal (open/close)
        if (type) {
          if (s.showCreatePost) {
            // Modal already open — just switch the post type
            return { createPostType: type };
          }
          // Modal closed — open it with the specified type
          return { showCreatePost: true, createPostType: type };
        }
        // No type specified — toggle open/close
        return { showCreatePost: !s.showCreatePost, createPostType: 'text' };
      }),
      toggleStoryViewer: () => set((s) => ({ showStoryViewer: !s.showStoryViewer })),
      toggleShareModal: (postId) => set((s) => ({
        showShareModal: !s.showShareModal,
        sharePostId: postId ?? null,
      })),
      toggleReelViewer: (reelId) => set((s) => ({
        showReelViewer: !s.showReelViewer,
        selectedReelId: reelId ?? null,
      })),
      toggleEditProfile: () => set((s) => ({ showEditProfile: !s.showEditProfile })),
      setVibe: (vibe) => set({ currentVibe: vibe || null, showVibeCheck: false }),
      setSelectedVibes: (vibes) => set({ selectedVibes: vibes }),
      toggleSelectedVibe: (vibe) => set((s) => {
        const current = s.selectedVibes || [];
        if (current.includes(vibe)) {
          return { selectedVibes: current.filter((v) => v !== vibe) };
        }
        return { selectedVibes: [...current, vibe] };
      }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedStoryIndex: (index) => set({ selectedStoryIndex: index }),
      setSelectedChatId: (id) => set({ selectedChatId: id }),

      // Social actions
      toggleLike: (postId, reactionType?) =>
        set((s) => {
          const newLiked = new Set(s.likedPosts);
          const newReactions = { ...s.postReactions };
          const newEarned = new Set(s.likedPostsEarned);
          const wasLiked = newLiked.has(postId);
          const reaction = reactionType || 'like';
          if (wasLiked) {
            // If same reaction, toggle off. If different, just update reaction type
            if (newReactions[postId] === reaction) {
              newLiked.delete(postId);
              delete newReactions[postId];
            } else {
              newReactions[postId] = reaction;
            }
          } else {
            newLiked.add(postId);
            newReactions[postId] = reaction;
          }
          const state: Partial<AuraState> = { likedPosts: newLiked, postReactions: newReactions, likedPostsEarned: newEarned };
          // Only earn tokens on first-ever like for this post
          if (!wasLiked && !newEarned.has(postId)) {
            newEarned.add(postId);
            const { newXP, newLevel, levelUps } = calculateXPLevelUp(s.auraXP, s.auraLevel, 2);
            state.auraTokens = s.auraTokens + 1;
            state.auraXP = newXP;
            state.auraLevel = newLevel;
            if (levelUps > 0) {
              state.customNotifications = [{
                id: `lvl-${Date.now()}`,
                userId: 'system',
                userName: 'ORRA',
                userAvatar: '/api/uploads?path=images/orra-logo.png',
                action: `Level Up! You're now Level ${newLevel}!`,
                time: 'Just now',
                type: 'levelup',
                read: false,
              }, ...s.customNotifications];
            }
          }
          return state;
        }),

      setPostReaction: (postId, reactionType) =>
        set((s) => {
          const newLiked = new Set(s.likedPosts);
          const newReactions = { ...s.postReactions };
          const newEarned = new Set(s.likedPostsEarned);
          const wasLiked = newLiked.has(postId);

          if (wasLiked && newReactions[postId] === reactionType) {
            // Same reaction — toggle off
            newLiked.delete(postId);
            delete newReactions[postId];
          } else {
            // New or different reaction
            newLiked.add(postId);
            newReactions[postId] = reactionType;
          }

          const state: Partial<AuraState> = { likedPosts: newLiked, postReactions: newReactions, likedPostsEarned: newEarned };
          if (!wasLiked && !newEarned.has(postId)) {
            newEarned.add(postId);
            const { newXP, newLevel, levelUps } = calculateXPLevelUp(s.auraXP, s.auraLevel, 2);
            state.auraTokens = s.auraTokens + 1;
            state.auraXP = newXP;
            state.auraLevel = newLevel;
            if (levelUps > 0) {
              state.customNotifications = [{
                id: `lvl-${Date.now()}`,
                userId: 'system',
                userName: 'ORRA',
                userAvatar: '/api/uploads?path=images/orra-logo.png',
                action: `Level Up! You're now Level ${newLevel}!`,
                time: 'Just now',
                type: 'levelup',
                read: false,
              }, ...s.customNotifications];
            }
          }
          return state;
        }),

      toggleReelLike: (reelId) =>
        set((s) => {
          const newLiked = new Set(s.likedReels);
          const newEarned = new Set(s.likedReelsEarned);
          const wasLiked = newLiked.has(reelId);
          if (wasLiked) {
            newLiked.delete(reelId);
          } else {
            newLiked.add(reelId);
          }
          const state: Partial<AuraState> = { likedReels: newLiked, likedReelsEarned: newEarned };
          // Only earn tokens on first-ever like for this reel
          if (!wasLiked && !newEarned.has(reelId)) {
            newEarned.add(reelId);
            const { newXP, newLevel } = calculateXPLevelUp(s.auraXP, s.auraLevel, 2);
            state.auraTokens = s.auraTokens + 1;
            state.auraXP = newXP;
            state.auraLevel = newLevel;
          }
          return state;
        }),

      toggleFollow: (userId) =>
        set((s) => {
          const newFollowed = new Set(s.followedUsers);
          const newEarned = new Set(s.followedUsersEarned);
          const wasFollowed = newFollowed.has(userId);
          if (wasFollowed) {
            newFollowed.delete(userId);
          } else {
            newFollowed.add(userId);
          }
          const state: Partial<AuraState> = { followedUsers: newFollowed, followedUsersEarned: newEarned };
          // Only earn tokens on first-ever follow for this user
          if (!wasFollowed && !newEarned.has(userId)) {
            newEarned.add(userId);
            const { newXP, newLevel } = calculateXPLevelUp(s.auraXP, s.auraLevel, 5);
            state.auraTokens = s.auraTokens + 2;
            state.auraXP = newXP;
            state.auraLevel = newLevel;
          }
          return state;
        }),

      toggleSave: (postId) =>
        set((s) => {
          const newSaved = new Set(s.savedPosts);
          if (newSaved.has(postId)) {
            newSaved.delete(postId);
          } else {
            newSaved.add(postId);
          }
          return { savedPosts: newSaved };
        }),

      toggleSaveReel: (reelId) =>
        set((s) => {
          const newSaved = new Set(s.savedReels);
          if (newSaved.has(reelId)) {
            newSaved.delete(reelId);
          } else {
            newSaved.add(reelId);
          }
          return { savedReels: newSaved };
        }),

      toggleRepost: (postId) =>
        set((s) => {
          const newReposts = new Set(s.repostIds);
          const newEarned = new Set(s.repostedEarned);
          const wasReposted = newReposts.has(postId);
          if (wasReposted) {
            newReposts.delete(postId);
          } else {
            newReposts.add(postId);
          }
          const state: Partial<AuraState> = { repostIds: newReposts, repostedEarned: newEarned };
          // Only earn tokens on first-ever repost for this post
          if (!wasReposted && !newEarned.has(postId)) {
            newEarned.add(postId);
            state.auraTokens = s.auraTokens + 2;
            state.auraXP = s.auraXP + 3;
          }
          return state;
        }),

      shareViaDM: (postId) =>
        set((s) => {
          const newShared = new Set(s.sharedViaDM);
          const newEarned = new Set(s.sharedViaDMEarned);
          newShared.add(postId);
          const state: Partial<AuraState> = { sharedViaDM: newShared, sharedViaDMEarned: newEarned };
          // Only earn tokens on first-ever share for this post
          if (!newEarned.has(postId)) {
            newEarned.add(postId);
            const { newXP, newLevel } = calculateXPLevelUp(s.auraXP, s.auraLevel, 5);
            state.auraTokens = s.auraTokens + 2;
            state.auraXP = newXP;
            state.auraLevel = newLevel;
          }
          return state;
        }),

      // Comments
      addComment: (postId, userId, userName, userAvatar, text) =>
        set((s) => {
          const postComments = s.comments[postId] || [];
          const newComment: Comment = {
            id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId,
            userName,
            userAvatar,
            text,
            createdAt: Date.now(),
          };
          const { newXP, newLevel, levelUps } = calculateXPLevelUp(s.auraXP, s.auraLevel, 5);
          return {
            comments: {
              ...s.comments,
              [postId]: [...postComments, newComment],
            },
            auraTokens: s.auraTokens + 2,
            auraXP: newXP,
            auraLevel: newLevel,
            customNotifications: levelUps > 0 ? [{
              id: `lvl-${Date.now()}`,
              userId: 'system',
              userName: 'ORRA',
              userAvatar: '/api/uploads?path=images/orra-logo.png',
              action: `Level Up! You're now Level ${newLevel}!`,
              time: 'Just now',
              type: 'levelup',
              read: false,
            }, ...s.customNotifications] : s.customNotifications,
          };
        }),

      toggleComments: (postId) =>
        set((s) => {
          const expanded = new Set(s.expandedComments);
          if (expanded.has(postId)) {
            expanded.delete(postId);
          } else {
            expanded.add(postId);
          }
          return { expandedComments: expanded };
        }),

      setScrollToPostId: (postId: string | null) => set({ scrollToPostId: postId }),

      // Chat
      sendMessage: (chatId, senderId, text, imageUrl) =>
        set((s) => {
          const chatMsgs = s.chatMessages[chatId] || [];
          const newMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            senderId,
            text,
            createdAt: Date.now(),
            imageUrl,
          };
          const { newXP, newLevel } = calculateXPLevelUp(s.auraXP, s.auraLevel, 2);
          return {
            chatMessages: {
              ...s.chatMessages,
              [chatId]: [...chatMsgs, newMsg],
            },
            auraTokens: s.auraTokens + 1,
            auraXP: newXP,
            auraLevel: newLevel,
          };
        }),

      addReaction: (messageId, reaction) =>
        set((s) => ({
          chatReactions: { ...s.chatReactions, [messageId]: reaction },
        })),

      // Posts
      addUserPost: (text, images, vibeTag, type) =>
        set((s) => {
          const newPost: UserPost = {
            id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text,
            images,
            createdAt: Date.now(),
            vibeTag,
            type,
          };
          return {
            userPosts: [newPost, ...s.userPosts],
          };
        }),

      deleteUserPost: (postId) =>
        set((s) => ({
          userPosts: s.userPosts.filter((p) => p.id !== postId),
        })),

      // Profile
      updateProfile: (edits) =>
        set((s) => {
          const updatedEdits = { ...s.profileEdits };
          for (const [key, value] of Object.entries(edits)) {
            if (value === undefined) continue;
            // Empty string means "clear this override" → set to null
            if (value === '') {
              (updatedEdits as Record<string, string | null>)[key] = null;
            } else {
              (updatedEdits as Record<string, string | null>)[key] = value;
            }
          }
          return { profileEdits: updatedEdits };
        }),

      // Notifications
      addNotification: (notif) =>
        set((s) => ({
          customNotifications: [notif, ...s.customNotifications],
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          customNotifications: s.customNotifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          customNotifications: s.customNotifications.map((n) => ({ ...n, read: true })),
        })),
      getUnreadNotificationCount: () => {
        return get().customNotifications.filter((n) => !n.read).length;
      },

      // ORRA Sphere
      earnTokens: (amount, reason) =>
        set((s) => {
          const xpGain = Math.floor(amount / 2);
          const { newXP, newLevel, levelUps } = calculateXPLevelUp(s.auraXP, s.auraLevel, xpGain);
          return {
            auraTokens: s.auraTokens + amount,
            auraXP: newXP,
            auraLevel: newLevel,
            customNotifications: [
              {
                id: `token-${Date.now()}`,
                userId: 'system',
                userName: 'ORRA',
                userAvatar: '/api/uploads?path=images/orra-logo.png',
                action: `+${amount} ORRA tokens! ${reason}`,
                time: 'Just now',
                type: 'token' as const,
                read: false,
              },
              ...(levelUps > 0 ? [{
                id: `lvl-${Date.now()}`,
                userId: 'system',
                userName: 'ORRA',
                userAvatar: '/api/uploads?path=images/orra-logo.png',
                action: `Level Up! You're now Level ${newLevel}!`,
                time: 'Just now',
                type: 'levelup' as const,
                read: false,
              }] : []),
              ...s.customNotifications,
            ],
          };
        }),

      addXP: (amount) =>
        set((s) => {
          const { newXP, newLevel, levelUps } = calculateXPLevelUp(s.auraXP, s.auraLevel, amount);
          if (levelUps > 0) {
            return {
              auraXP: newXP,
              auraLevel: newLevel,
              customNotifications: [{
                id: `lvl-${Date.now()}`,
                userId: 'system',
                userName: 'ORRA',
                userAvatar: '/api/uploads?path=images/orra-logo.png',
                action: `Level Up! You're now Level ${newLevel}!`,
                time: 'Just now',
                type: 'levelup',
                read: false,
              }, ...s.customNotifications],
            };
          }
          return { auraXP: newXP };
        }),

      checkDailyStreak: () =>
        set((s) => {
          const today = new Date().toISOString().split('T')[0];
          if (s.lastActiveDate === today) return s;
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const isConsecutive = s.lastActiveDate === yesterday;
          return {
            dailyStreak: isConsecutive ? s.dailyStreak + 1 : 1,
            lastActiveDate: today,
            auraTokens: s.auraTokens + (isConsecutive ? 5 : 2),
            customNotifications: [{
              id: `streak-${Date.now()}`,
              userId: 'system',
              userName: 'ORRA',
              userAvatar: '/api/uploads?path=images/orra-logo.png',
              action: `Daily streak: ${isConsecutive ? s.dailyStreak + 1 : 1} days! +${isConsecutive ? 5 : 2} ORRA`,
              time: 'Just now',
              type: 'token',
              read: false,
            }, ...s.customNotifications],
          };
        }),

      // Hub
      joinHub: (hubId) =>
        set((s) => {
          const newJoined = new Set(s.joinedHubs);
          newJoined.add(hubId);
          const { newXP, newLevel } = calculateXPLevelUp(s.auraXP, s.auraLevel, 10);
          return {
            joinedHubs: newJoined,
            auraTokens: s.auraTokens + 5,
            auraXP: newXP,
            auraLevel: newLevel,
            customNotifications: [{
              id: `hub-${Date.now()}`,
              userId: 'system',
              userName: 'ORRA',
              userAvatar: '/api/uploads?path=images/orra-logo.png',
              action: `You joined a new hub! +5 ORRA tokens`,
              time: 'Just now',
              type: 'hub',
              read: false,
            }, ...s.customNotifications],
          };
        }),

      leaveHub: (hubId) =>
        set((s) => {
          const newJoined = new Set(s.joinedHubs);
          newJoined.delete(hubId);
          return { joinedHubs: newJoined };
        }),

      // Dance
      submitDanceEntry: (text) =>
        set((s) => {
          const newEntry: DanceEntry = {
            id: `de-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text,
            createdAt: Date.now(),
          };
          return {
            danceEntries: [...s.danceEntries, newEntry],
            customNotifications: [{
              id: `dance-${Date.now()}`,
              userId: 'system',
              userName: 'ORRA',
              userAvatar: '/api/uploads?path=images/orra-logo.png',
              action: `Dance entry submitted!`,
              time: 'Just now',
              type: 'challenge',
              read: false,
            }, ...s.customNotifications],
          };
        }),

      voteEntry: (entryId) =>
        set((s) => {
          const newVoted = new Set(s.votedEntries);
          const newEarned = new Set(s.votedEntriesEarned);
          const wasVoted = newVoted.has(entryId);
          if (wasVoted) {
            newVoted.delete(entryId);
            return { votedEntries: newVoted };
          }
          newVoted.add(entryId);
          const state: Partial<AuraState> = { votedEntries: newVoted, votedEntriesEarned: newEarned };
          // Only earn tokens on first-ever vote for this entry
          if (!newEarned.has(entryId)) {
            newEarned.add(entryId);
            const { newXP, newLevel } = calculateXPLevelUp(s.auraXP, s.auraLevel, 2);
            state.auraTokens = s.auraTokens + 1;
            state.auraXP = newXP;
            state.auraLevel = newLevel;
          }
          return state;
        }),

      // Stories
      markStoryViewed: (storyId) =>
        set((s) => {
          const newViewed = new Set(s.viewedStories);
          newViewed.add(storyId);
          return { viewedStories: newViewed };
        }),

      // Reel tracking
      markReelViewed: (reelId) =>
        set((s) => {
          const newViewed = new Set(s.viewedReels);
          if (newViewed.has(reelId)) return s;
          newViewed.add(reelId);
          const { newXP, newLevel } = calculateXPLevelUp(s.auraXP, s.auraLevel, 1);
          return {
            viewedReels: newViewed,
            auraTokens: s.auraTokens + 1,
            auraXP: newXP,
            auraLevel: newLevel,
          };
        }),

      markChatRead: (chatId) =>
        set((s) => ({
          unreadMessages: { ...s.unreadMessages, [chatId]: 0 },
        })),

      addRecentSearch: (query) =>
        set((s) => {
          const filtered = s.recentSearches.filter((q) => q !== query);
          return { recentSearches: [query, ...filtered].slice(0, 10) };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      // Settings actions
      updateUserSettings: (settings) => set((s) => ({
        userSettings: { ...s.userSettings, ...settings },
      })),
      dismissDigest: () => set({
        showDigest: false,
        lastDigestDate: new Date().toISOString().split('T')[0],
      }),

      // Viewing other user
      setViewingUser: (userId) => set({ viewingUserId: userId }),
    }),
    {
      name: 'aura-storage',
      // Custom storage that gracefully handles localStorage quota exceeded errors
      storage: (() => {
        const noopStorage = {
          getItem: (name: string) => {
            try {
              const str = localStorage.getItem(name);
              return str ? JSON.parse(str) : null;
            } catch {
              // Corrupted localStorage data — clear it and return null
              try { localStorage.removeItem(name); } catch {}
              return null;
            }
          },
          setItem: (name: string, value: any) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (e) {
              // localStorage quota exceeded — clear old data and try once more
              console.warn('ORRA: localStorage quota exceeded, clearing old data:', e);
              try {
                localStorage.removeItem(name);
                localStorage.setItem(name, JSON.stringify(value));
              } catch {
                // Still can't write — give up silently (app still works, just won't persist)
                console.warn('ORRA: Could not persist state to localStorage');
              }
            }
          },
          removeItem: (name: string) => {
            try { localStorage.removeItem(name); } catch {}
          },
        };
        return noopStorage as any;
      })(),
      partialize: (state) => {
        // Strip base64 data URLs from currentUserProfile before persisting.
        // Base64 avatar images can be several MB, which causes mobile browsers
        // to crash when writing to localStorage (5MB limit).
        const profile = state.currentUserProfile;
        const safeProfile = profile ? {
          ...profile,
          // Keep base64 avatars in localStorage IF they're small enough (< 200KB as string)
          // The edit-profile-modal compresses to max 400x400 JPEG at 0.8 quality (~20-50KB)
          // Only strip if the base64 is suspiciously large (uncompressed original)
          avatar: (profile.avatar && profile.avatar.startsWith('data:') && profile.avatar.length > 200 * 1024)
            ? '/api/uploads?path=images/orra-logo.png'
            : profile.avatar,
          coverImage: (profile.coverImage && profile.coverImage.startsWith('data:') && profile.coverImage.length > 500 * 1024)
            ? '/api/uploads?path=images/profile-cover.png'
            : profile.coverImage,
        } : null;

        return {
          version: 8, // Storage version — bump when data model changes to force clean state
          currentUserId: state.currentUserId,
          currentUserProfile: safeProfile,
          // DO NOT persist isHydrated — it must be recalculated each session
          profileSetupComplete: state.profileSetupComplete,
          likedPosts: Array.from(state.likedPosts),
          likedReels: Array.from(state.likedReels),
          postReactions: state.postReactions,
          followedUsers: Array.from(state.followedUsers),
          savedPosts: Array.from(state.savedPosts),
          savedReels: Array.from(state.savedReels),
          likedPostsEarned: Array.from(state.likedPostsEarned),
          likedReelsEarned: Array.from(state.likedReelsEarned),
          followedUsersEarned: Array.from(state.followedUsersEarned),
          repostedEarned: Array.from(state.repostedEarned),
          sharedViaDMEarned: Array.from(state.sharedViaDMEarned),
          votedEntriesEarned: Array.from(state.votedEntriesEarned),
          // DO NOT persist comments to localStorage — they're fetched from the API
          // Old local comments with temp IDs caused duplicate display bugs.
          // Comments are now the API's single source of truth.
          // comments: {},
          chatMessages: state.chatMessages,
          chatReactions: state.chatReactions,
          // Limit userPosts to most recent 20 to prevent localStorage bloat
          userPosts: state.userPosts.slice(0, 20),
          // Don't persist profileEdits — they should only exist during an active edit session.
          // Stale edits in localStorage override fresh API data on next page load,
          // causing users to see wrong profile info (old bio, name, location, etc.)
          // profileEdits: safeEdits,
          currentVibe: state.currentVibe,
          selectedVibes: state.selectedVibes || [],
          // Limit customNotifications to most recent 50 to prevent localStorage bloat
          customNotifications: state.customNotifications.slice(0, 50),
          auraTokens: state.auraTokens,
          auraLevel: state.auraLevel,
          auraXP: state.auraXP,
          dailyStreak: state.dailyStreak,
          lastActiveDate: state.lastActiveDate,
          joinedHubs: Array.from(state.joinedHubs),
          danceEntries: state.danceEntries,
          votedEntries: Array.from(state.votedEntries),
          viewedStories: Array.from(state.viewedStories),
          repostIds: Array.from(state.repostIds),
          sharedViaDM: Array.from(state.sharedViaDM),
          followedHubs: Array.from(state.followedHubs),
          viewedReels: Array.from(state.viewedReels),
          unreadMessages: state.unreadMessages,
          recentSearches: state.recentSearches,
          userSettings: state.userSettings,
          lastDigestDate: state.lastDigestDate,
        };
      },
      merge: (persisted: any, current) => {
        // Wrap entire merge in try-catch to prevent corrupted localStorage
        // from crashing the app on startup
        try {
          if (!persisted || typeof persisted !== 'object') return current;

          // Safety: if persisted state contains deleted user-me, skip it entirely
          if (persisted.currentUserId === 'user-me' || persisted.state?.currentUserId === 'user-me') {
            console.warn('ORRA: Stale user-me in persisted state, clearing');
            try { localStorage.removeItem('aura-storage'); } catch {}
            return current;
          }

          // Safety: if persisted state is too large (>2MB), skip it entirely to prevent mobile crashes
          try {
            const persistedSize = JSON.stringify(persisted).length;
            if (persistedSize > 2 * 1024 * 1024) {
              console.warn('ORRA: Persisted state too large (' + Math.round(persistedSize / 1024 / 1024) + 'MB), skipping rehydration');
              try { localStorage.removeItem('aura-storage'); } catch {}
              return current;
            }
          } catch {}

          const merged = { ...current };

          // Helper to safely convert arrays to Sets (handles corrupted data gracefully)
          const safeSet = (arr: any): Set<string> => {
            if (!arr) return new Set<string>();
            if (Array.isArray(arr)) return new Set(arr.filter((v): v is string => typeof v === 'string'));
            // If it's somehow already a Set or other iterable, try to convert
            try { return new Set(Array.from(arr).filter((v: any): v is string => typeof v === 'string')); } catch { return new Set<string>(); }
          };

          if (persisted.currentUserId) merged.currentUserId = persisted.currentUserId;
          if (persisted.currentUserProfile && typeof persisted.currentUserProfile === 'object') {
            merged.currentUserProfile = persisted.currentUserProfile;
          }
          // Don't restore isHydrated from localStorage — it must be determined fresh each session
          // profileSetupComplete can be restored as fallback, but API value takes priority
          if (persisted.profileSetupComplete !== undefined) merged.profileSetupComplete = persisted.profileSetupComplete;
          merged.likedPosts = safeSet(persisted.likedPosts);
          merged.likedReels = safeSet(persisted.likedReels);
          merged.followedUsers = safeSet(persisted.followedUsers);
          merged.savedPosts = safeSet(persisted.savedPosts);
          merged.savedReels = safeSet(persisted.savedReels);
          merged.likedPostsEarned = safeSet(persisted.likedPostsEarned);
          merged.likedReelsEarned = safeSet(persisted.likedReelsEarned);
          merged.followedUsersEarned = safeSet(persisted.followedUsersEarned);
          merged.repostedEarned = safeSet(persisted.repostedEarned);
          merged.sharedViaDMEarned = safeSet(persisted.sharedViaDMEarned);
          merged.votedEntriesEarned = safeSet(persisted.votedEntriesEarned);
          // DO NOT restore comments from localStorage — API is the single source of truth.
          // Old local comments with temp IDs (c-xxx) caused duplicate display bugs.
          // if (persisted.comments && typeof persisted.comments === 'object') merged.comments = persisted.comments;
          if (persisted.chatMessages && typeof persisted.chatMessages === 'object') merged.chatMessages = persisted.chatMessages;
          if (persisted.chatReactions && typeof persisted.chatReactions === 'object') merged.chatReactions = persisted.chatReactions;
          if (Array.isArray(persisted.userPosts)) merged.userPosts = persisted.userPosts;
          // Don't restore profileEdits from localStorage — they can be stale and override fresh API data.
          // profileEdits should only exist during an active edit session and are always cleared on API hydration.
          // Restoring old edits causes the user to see wrong profile data (wrong bio, name, etc.)
          // merged.profileEdits = persisted.profileEdits;
          if (persisted.currentVibe) merged.currentVibe = persisted.currentVibe;
          if (Array.isArray(persisted.customNotifications)) merged.customNotifications = persisted.customNotifications;
          if (persisted.auraTokens !== undefined && typeof persisted.auraTokens === 'number') merged.auraTokens = persisted.auraTokens;
          if (persisted.auraLevel !== undefined && typeof persisted.auraLevel === 'number') merged.auraLevel = persisted.auraLevel;
          if (persisted.auraXP !== undefined && typeof persisted.auraXP === 'number') merged.auraXP = persisted.auraXP;
          if (persisted.dailyStreak !== undefined && typeof persisted.dailyStreak === 'number') merged.dailyStreak = persisted.dailyStreak;
          if (persisted.lastActiveDate) merged.lastActiveDate = persisted.lastActiveDate;
          merged.joinedHubs = safeSet(persisted.joinedHubs);
          if (Array.isArray(persisted.danceEntries)) merged.danceEntries = persisted.danceEntries;
          merged.votedEntries = safeSet(persisted.votedEntries);
          merged.viewedStories = safeSet(persisted.viewedStories);
          merged.repostIds = safeSet(persisted.repostIds);
          merged.sharedViaDM = safeSet(persisted.sharedViaDM);
          merged.followedHubs = safeSet(persisted.followedHubs);
          merged.viewedReels = safeSet(persisted.viewedReels);
          if (persisted.unreadMessages && typeof persisted.unreadMessages === 'object') merged.unreadMessages = persisted.unreadMessages;
          if (Array.isArray(persisted.recentSearches)) merged.recentSearches = persisted.recentSearches;
          // Restore userSettings with safe fallback + migration from digestTime → digestTimes
          if (persisted.userSettings && typeof persisted.userSettings === 'object') {
            const migrated = { ...persisted.userSettings };
            // Migrate old single-value digestTime to array digestTimes
            if (migrated.digestTime && !migrated.digestTimes) {
              migrated.digestTimes = [migrated.digestTime];
              delete migrated.digestTime;
            } else if (!migrated.digestTimes) {
              migrated.digestTimes = ['morning'];
            }
            // Clean up legacy digestTime if it still exists
            delete migrated.digestTime;
            merged.userSettings = { ...current.userSettings, ...migrated };
          }
          if (persisted.lastDigestDate) merged.lastDigestDate = persisted.lastDigestDate;
          return merged;
        } catch (error) {
          // If merge fails for any reason, clear corrupted storage and return defaults
          console.error('ORRA store merge failed — clearing corrupted localStorage:', error);
          try { localStorage.removeItem('aura-storage'); } catch {}
          return current;
        }
      },
    }
  )
);
