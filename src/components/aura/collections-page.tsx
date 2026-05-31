'use client';

import {
  Bookmark,
  Plus,
  ChevronLeft,
  Lock,
  Globe,
  Trash2,
  X,
  Loader2,
  Search,
  Image as ImageIcon,
  Clock,
  FolderOpen,
  MoreVertical,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useAuraStore } from '@/store/aura-store';
import { resolveImageUrl, timeAgo } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CollectionPost {
  id: string;
  text: string;
  images: string[];
  createdAt: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
  };
}

interface CollectionItem {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  postsCount: number;
  posts: CollectionPost[];
  createdAt: string;
  updatedAt: string;
}

interface CreateCollectionForm {
  name: string;
  description: string;
  isPrivate: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GRADIENT_PLACEHOLDERS = [
  'from-violet-600/40 to-fuchsia-600/40',
  'from-teal-600/40 to-cyan-600/40',
  'from-amber-600/40 to-orange-600/40',
  'from-pink-600/40 to-rose-600/40',
  'from-indigo-600/40 to-purple-600/40',
  'from-emerald-600/40 to-green-600/40',
  'from-rose-600/40 to-red-600/40',
  'from-cyan-600/40 to-blue-600/40',
];

const EMPTY_FORM: CreateCollectionForm = {
  name: '',
  description: '',
  isPrivate: true,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGradientForIndex(index: number): string {
  return GRADIENT_PLACEHOLDERS[index % GRADIENT_PLACEHOLDERS.length];
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function CollectionCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-pulse">
      <div className="h-36 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded-lg bg-white/5" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-white/5" />
          <div className="h-3 w-12 rounded bg-white/5" />
        </div>
        <div className="h-3 w-1/2 rounded bg-white/5" />
      </div>
    </div>
  );
}

// ─── Mosaic Cover ───────────────────────────────────────────────────────────

function MosaicCover({ images, index }: { images: string[]; index: number }) {
  if (images.length === 0) {
    return (
      <div className={`w-full h-full bg-gradient-to-br ${getGradientForIndex(index)} flex items-center justify-center`}>
        <Bookmark className="w-10 h-10 text-white/20" />
      </div>
    );
  }

  const displayImages = images.slice(0, 4);

  if (displayImages.length === 1) {
    return (
      <img
        src={resolveImageUrl(displayImages[0])}
        alt=""
        className="w-full h-full object-cover"
      />
    );
  }

  if (displayImages.length === 2) {
    return (
      <div className="grid grid-cols-2 h-full w-full gap-0.5">
        {displayImages.map((img, i) => (
          <img key={i} src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }

  if (displayImages.length === 3) {
    return (
      <div className="grid grid-cols-2 h-full w-full gap-0.5">
        <img src={resolveImageUrl(displayImages[0])} alt="" className="w-full h-full object-cover row-span-2" />
        <img src={resolveImageUrl(displayImages[1])} alt="" className="w-full h-full object-cover" />
        <img src={resolveImageUrl(displayImages[2])} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 4 images — 2x2 grid
  return (
    <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5">
      {displayImages.map((img, i) => (
        <img key={i} src={resolveImageUrl(img)} alt="" className="w-full h-full object-cover" />
      ))}
    </div>
  );
}

// ─── Create Collection Modal ────────────────────────────────────────────────

function CreateCollectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateCollectionForm>({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          isPrivate: form.isPrivate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Collection "${form.name.trim()}" created! 📌`, { duration: 2500 });
        onCreated();
        onClose();
      } else {
        toast.error(data.error || 'Failed to create collection');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div
        ref={modalRef}
        className="relative glass-panel rounded-2xl p-6 w-full max-w-lg fade-in border border-violet-500/20 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">New Collection</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Inspo, Travel, Fits"
              maxLength={100}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What's this collection about?"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          {/* Privacy Toggle */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {form.isPrivate ? (
                  <Lock className="w-4 h-4 text-violet-400" />
                ) : (
                  <Globe className="w-4 h-4 text-emerald-400" />
                )}
                <div>
                  <p className="text-sm text-white font-medium">
                    {form.isPrivate ? 'Private' : 'Public'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {form.isPrivate ? 'Only you can see this collection' : 'Anyone can discover this collection'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForm((p) => ({ ...p, isPrivate: !p.isPrivate }))}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  form.isPrivate ? 'bg-violet-600' : 'bg-emerald-500'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                    form.isPrivate ? 'left-0.5' : 'left-[22px]'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating || !form.name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-violet"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Collection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Post Modal ─────────────────────────────────────────────────────────

function AddPostModal({
  onClose,
  onAdded,
  collectionId,
}: {
  onClose: () => void;
  onAdded: () => void;
  collectionId: string;
}) {
  const [postId, setPostId] = useState('');
  const [adding, setAdding] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAdd = async () => {
    if (!postId.trim()) {
      toast.error('Please enter a post ID');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/collections/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId, postId: postId.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Post added to collection! 📌', { duration: 2000 });
        onAdded();
        onClose();
      } else {
        toast.error(data.error || 'Failed to add post');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div
        ref={modalRef}
        className="relative glass-panel rounded-2xl p-6 w-full max-w-md fade-in border border-violet-500/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Add Post</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Post ID <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                placeholder="Enter the post ID"
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 hover:bg-white/10 transition-all focus:outline-none focus:border-violet-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && postId.trim()) handleAdd();
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              You can find the post ID in the post details or share menu
            </p>
          </div>

          <button
            onClick={handleAdd}
            disabled={adding || !postId.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-violet"
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Add to Collection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Collection Detail View ─────────────────────────────────────────────────

function CollectionDetailView({
  collection,
  onBack,
  onRefresh,
}: {
  collection: CollectionItem;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [showAddPost, setShowAddPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingCollection, setDeletingCollection] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleRemovePost = async (postId: string) => {
    setDeletingPostId(postId);
    try {
      const res = await fetch('/api/collections/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: collection.id, postId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Post removed from collection', { duration: 2000 });
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to remove post');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleDeleteCollection = async () => {
    setDeletingCollection(true);
    try {
      const res = await fetch(`/api/collections?collectionId=${collection.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Collection deleted', { duration: 2000 });
        onBack();
      } else {
        toast.error(data.error || 'Failed to delete collection');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setDeletingCollection(false);
    }
  };

  const coverImages = collection.posts
    .filter((p) => p.images && p.images.length > 0)
    .flatMap((p) => p.images)
    .slice(0, 4);

  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white truncate">{collection.name}</h2>
            {collection.isPrivate ? (
              <Lock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{collection.postsCount} post{collection.postsCount !== 1 ? 's' : ''}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(collection.updatedAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddPost(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all glow-violet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Post</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-30 glass-panel rounded-xl p-1 min-w-[160px] border border-white/10 fade-in">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDeleteCollection();
                  }}
                  disabled={deletingCollection}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  {deletingCollection ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete Collection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collection cover banner */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="relative h-32 overflow-hidden">
          <MosaicCover images={coverImages} index={0} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {collection.description && (
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-sm text-white/80 line-clamp-2">{collection.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      {collection.posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {collection.posts.map((post) => (
            <div
              key={post.id}
              className="glass-panel rounded-2xl overflow-hidden group transition-all hover:border-violet-500/20"
            >
              {/* Post image */}
              {post.images && post.images.length > 0 && (
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={resolveImageUrl(post.images[0])}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {post.images.length > 1 && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {post.images.length}
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemovePost(post.id)}
                    disabled={deletingPostId === post.id}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white/70 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from collection"
                  >
                    {deletingPostId === post.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Post content */}
              <div className="p-4">
                {/* Author */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                    <img
                      src={resolveImageUrl(post.author.avatar)}
                      alt={post.author.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs text-slate-400 truncate">{post.author.name}</span>
                  <span className="text-[10px] text-slate-600 ml-auto flex-shrink-0">{timeAgo(post.createdAt)}</span>
                </div>

                {/* Text preview */}
                {post.text && (
                  <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
                    {truncateText(post.text, 150)}
                  </p>
                )}

                {/* No-image posts: remove button inline */}
                {(!post.images || post.images.length === 0) && (
                  <div className="flex items-center justify-end mt-2">
                    <button
                      onClick={() => handleRemovePost(post.id)}
                      disabled={deletingPostId === post.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      {deletingPostId === post.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
            <FolderOpen className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Posts Yet</h3>
          <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
            Start adding posts to this collection!
          </p>
          <button
            onClick={() => setShowAddPost(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all glow-violet"
          >
            <Plus className="w-4 h-4" />
            Add Post
          </button>
        </div>
      )}

      {/* Add Post Modal */}
      {showAddPost && (
        <AddPostModal
          onClose={() => setShowAddPost(false)}
          onAdded={onRefresh}
          collectionId={collection.id}
        />
      )}
    </div>
  );
}

// ─── Collection Card ────────────────────────────────────────────────────────

function CollectionCard({
  collection,
  index,
  onClick,
}: {
  collection: CollectionItem;
  index: number;
  onClick: () => void;
}) {
  const coverImages = collection.posts
    .filter((p) => p.images && p.images.length > 0)
    .flatMap((p) => p.images)
    .slice(0, 4);

  return (
    <div
      onClick={onClick}
      className="glass-panel rounded-2xl overflow-hidden group cursor-pointer transition-all hover:border-violet-500/20"
    >
      {/* Mosaic cover */}
      <div className="relative h-36 overflow-hidden">
        <MosaicCover images={coverImages} index={index} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Privacy badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
          {collection.isPrivate ? (
            <>
              <Lock className="w-3 h-3 text-violet-300" /> Private
            </>
          ) : (
            <>
              <Globe className="w-3 h-3 text-emerald-300" /> Public
            </>
          )}
        </div>

        {/* Post count overlay */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
          {collection.postsCount} post{collection.postsCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-white text-sm leading-snug mb-1 truncate">
          {collection.name}
        </h3>

        {collection.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-2">
            {truncateText(collection.description, 80)}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-violet-400" />
            {collection.postsCount} post{collection.postsCount !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(collection.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyCollectionsState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-violet-500/20">
        <Bookmark className="w-8 h-8 text-violet-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No Collections Yet</h3>
      <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">
        Organize your saved posts into Pinterest-like boards. Create your first collection!
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold hover:opacity-90 transition-all glow-violet"
      >
        <Plus className="w-4 h-4" />
        Create Collection
      </button>
    </div>
  );
}

// ─── Main Collections Page ──────────────────────────────────────────────────

export function CollectionsPage() {
  const { currentUserId } = useAuraStore();

  // Data state
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active collection (detail view)
  const [activeCollection, setActiveCollection] = useState<CollectionItem | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create collection modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      if (data.success) {
        setCollections(data.data.collections || []);
      } else {
        setError(data.error || 'Failed to load collections');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Fetch collection detail when selected
  const openCollection = useCallback(async (collectionId: string) => {
    setActiveCollectionId(collectionId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/collections?collectionId=${collectionId}`);
      const data = await res.json();
      if (data.success && data.data.collection) {
        setActiveCollection(data.data.collection);
      } else {
        toast.error(data.error || 'Failed to load collection');
        setActiveCollectionId(null);
      }
    } catch {
      toast.error('Network error');
      setActiveCollectionId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Refresh active collection detail
  const refreshActiveCollection = useCallback(async () => {
    if (!activeCollectionId) return;
    try {
      const res = await fetch(`/api/collections?collectionId=${activeCollectionId}`);
      const data = await res.json();
      if (data.success && data.data.collection) {
        setActiveCollection(data.data.collection);
      }
    } catch {
      // silently fail
    }
    // Also refresh the list
    fetchCollections();
  }, [activeCollectionId, fetchCollections]);

  // Back to collections list
  const handleBack = useCallback(() => {
    setActiveCollection(null);
    setActiveCollectionId(null);
    fetchCollections();
  }, [fetchCollections]);

  // ─── Detail Loading ───
  if (activeCollectionId && !activeCollection) {
    return (
      <div className="fade-in flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  // ─── Collection Detail View ───
  if (activeCollection) {
    return (
      <CollectionDetailView
        collection={activeCollection}
        onBack={handleBack}
        onRefresh={refreshActiveCollection}
      />
    );
  }

  // ─── Collections List View ───
  return (
    <div className="fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Bookmark className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Collections</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all glow-violet"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Collection</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchCollections}
            className="text-violet-400 text-sm font-semibold hover:text-violet-300 transition-all"
          >
            Try again
          </button>
        </div>
      )}

      {/* Collections Grid */}
      {!loading && !error && collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {collections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              index={index}
              onClick={() => openCollection(collection.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && collections.length === 0 && (
        <EmptyCollectionsState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchCollections}
        />
      )}
    </div>
  );
}
