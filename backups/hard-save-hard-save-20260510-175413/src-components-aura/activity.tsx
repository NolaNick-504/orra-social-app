'use client';

import { useNotifications, useMarkNotificationsRead } from '@/lib/api-hooks';
import { UserPlus, Heart, MessageCircle, Share2, Repeat2, Star, Check, Coins, Zap, Trophy, Shield, RefreshCw } from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { useState } from 'react';
import { toast } from 'sonner';

const typeIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  like: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/20' },
  follow: { icon: UserPlus, color: 'text-violet-400', bg: 'bg-violet-500/20' },
  comment: { icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  share: { icon: Share2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  mention: { icon: MessageCircle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  remix: { icon: Repeat2, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20' },
  feature: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  tokens: { icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  token: { icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  levelup: { icon: Zap, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20' },
  hub: { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  challenge: { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/20' },
};

interface NotificationItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  time: string;
  type: string;
  read: boolean;
  thumbnail?: string | null;
  postId?: string | null;
  isDynamic: boolean;
}

export function Activity() {
  const { followedUsers, toggleFollow, customNotifications, markNotificationRead, markAllNotificationsRead, setViewingUser, setView } = useAuraStore();
  const [filter, setFilter] = useState<'all' | 'likes' | 'follows' | 'earnings'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API hooks for notifications
  const { data: notificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = useNotifications();
  const markReadMutation = useMarkNotificationsRead();

  // Combine API notifications with local custom notifications
  const apiNotifications: NotificationItem[] = (() => {
    if (!notificationsData) return [];
    const raw = notificationsData.notifications || [];
    return raw.map((n: any) => ({
      id: n.id,
      userId: n.triggeredByUser?.id || 'system',
      userName: n.triggeredByUser?.name || 'ORRA',
      userAvatar: n.triggeredByUser?.avatar || '/api/uploads?path=images/orra-logo.png',
      action: n.action,
      time: timeAgo(n.createdAt),
      type: n.type,
      read: n.read,
      thumbnail: n.thumbnail || null,
      postId: n.postId || null,
      isDynamic: true,
    }));
  })();

  const localNotifications: NotificationItem[] = customNotifications.map((n) => ({
    ...n,
    postId: n.postId || null,
    isDynamic: false,
  }));

  const allNotifications = [
    ...apiNotifications,
    ...localNotifications,
  ];

  const filtered = filter === 'all'
    ? allNotifications
    : filter === 'likes'
    ? allNotifications.filter((n) => n.type === 'like')
    : filter === 'follows'
    ? allNotifications.filter((n) => n.type === 'follow')
    : allNotifications.filter((n) => n.type === 'tokens' || n.type === 'token' || n.type === 'levelup' || n.type === 'hub');

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchNotifications();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Notifications refreshed');
    }, 400);
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    // Mark as read
    if (notif.isDynamic && !notif.read) {
      markNotificationRead(notif.id);
      try {
        await markReadMutation.mutateAsync({ id: notif.id });
      } catch {}
    }

    // Navigate to the post if postId exists
    if (notif.postId) {
      // Switch to home/pulse feed view FIRST so PulseFeed mounts
      // Then set scroll target AFTER mount so the useEffect catches it
      const store = useAuraStore.getState();
      store.setHomeTab('pulse'); // Ensure we show PulseFeed, not Prism/Hub
      store.setView('home');
      store.toggleComments(notif.postId);
      // Delay setting scrollToPostId until after PulseFeed mounts
      // Without this delay, the value is set before mount and the useEffect never fires
      requestAnimationFrame(() => {
        useAuraStore.getState().setScrollToPostId(notif.postId);
      });
    } else if (notif.type === 'follow' && notif.userId !== 'system') {
      // Navigate to user profile for follow notifications
      setViewingUser(notif.userId);
      setView('profile');
    }
  };

  const handleMarkAllRead = async () => {
    markAllNotificationsRead();
    try {
      await markReadMutation.mutateAsync({ all: true });
    } catch {}
    toast.success('All notifications marked as read');
  };

  const handleFollow = async (userId: string, userName: string) => {
    const isFollowed = followedUsers.has(userId);
    toggleFollow(userId);
    try {
      await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch {}
    toast.success(isFollowed ? `Unfollowed ${userName}` : `Following ${userName}`);
  };

  return (
    <div className="fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Activity
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 text-xs font-bold">{unreadCount}</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 text-xs font-semibold hover:bg-violet-600/30 transition-all flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
        {(['all', 'likes', 'follows', 'earnings'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {notificationsLoading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading notifications...</p>
        </div>
      )}

      <div className="space-y-1">
        {filtered.map((notif) => {
          const typeConfig = typeIcons[notif.type] || typeIcons.like;
          const TypeIcon = typeConfig.icon;
          const isFollowed = followedUsers.has(notif.userId);
          const isNew = !notif.read;

          return (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all group cursor-pointer relative ${
                isNew ? 'bg-violet-600/10 hover:bg-violet-600/15' : 'hover:bg-white/5'
              }`}
            >
              {/* New indicator */}
              {isNew && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet-500 dot-pulse" />
              )}

              {/* Avatar with type indicator */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => { if (notif.userId !== 'system') { setViewingUser(notif.userId); setView('profile'); } }}
                  className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 hover:opacity-80 transition-opacity"
                >
                  {notif.userAvatar ? (
                    <img src={notif.userAvatar} alt={notif.userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-violet-600/20 flex items-center justify-center">
                      <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                    </div>
                  )}
                </button>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${typeConfig.bg} flex items-center justify-center ring-2 ring-[#050505]`}>
                  <TypeIcon className={`w-2.5 h-2.5 ${typeConfig.color}`} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-relaxed">
                  {notif.userId !== 'system' && (
                    <button
                      onClick={() => { setViewingUser(notif.userId); setView('profile'); }}
                      className="font-semibold text-white hover:text-violet-300 transition-colors"
                    >
                      {notif.userName}
                    </button>
                  )}
                  {notif.userId !== 'system' && ' '}
                  {notif.action}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500">{notif.time} ago</p>
                  {isNew && <span className="text-[9px] text-violet-400 font-bold">NEW</span>}
                </div>
              </div>

              {/* Thumbnail, Follow Button, or View Post indicator */}
              {notif.type === 'follow' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleFollow(notif.userId, notif.userName); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                    isFollowed
                      ? 'bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                      : 'bg-violet-600/20 text-violet-400 hover:bg-violet-600/30'
                  }`}
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
              ) : notif.postId ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600/10 text-violet-400 text-[10px] font-medium flex-shrink-0 group-hover:bg-violet-600/20 transition-all">
                  <span>View</span>
                </div>
              ) : notif.thumbnail ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden ring-1 ring-white/10 flex-shrink-0 group-hover:ring-violet-500/30 transition-all">
                  <img src={notif.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !notificationsLoading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-400">No notifications in this category.</p>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}
