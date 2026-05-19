'use client';

import { useAuraStore } from '@/store/aura-store';
import { vibeLabels } from '@/lib/data';
import { useCurrentUser } from '@/lib/use-current-user';
import { useCreatePost, useCreatePoll } from '@/lib/api-hooks';
import { X, Image as ImageIcon, Video, BarChart3, MapPin, Smile, Music, Hash, AtSign, Coins, Type, Camera, Plus, Trash2, Upload, Loader2, Clock } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CameraCapture } from '@/components/aura/camera-capture';

const postTypes = [
  { key: 'text', label: 'Text', icon: Type },
  { key: 'image', label: 'Photo', icon: ImageIcon },
  { key: 'poll', label: 'Poll', icon: BarChart3 },
  { key: 'reel', label: 'Reel', icon: Video },
] as const;

const vibeTags = [
  { key: 'hyped', label: '🔥 Hyped' },
  { key: 'laughing', label: '😂 Laughing' },
  { key: 'chill', label: '😌 Chill' },
  { key: 'dramatic', label: '✨ Dramatic' },
  { key: 'focused', label: '🧠 Focused' },
  { key: 'peaceful', label: '☮️ Peaceful' },
];

const pollDurations = [
  { label: '24 hours', value: 86400 },
  { label: '48 hours', value: 172800 },
  { label: '7 days', value: 604800 },
];

// Helper: convert a File to base64 data URL
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CreatePostModal() {
  const { showCreatePost, createPostType, toggleCreatePost, addUserPost, earnTokens, addXP } = useAuraStore();
  const currentUser = useCurrentUser();
  const [text, setText] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'poll' | 'reel'>('text');
  const [vibeTag, setVibeTag] = useState('hyped');
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [showHashtagHint, setShowHashtagHint] = useState(false);
  const [showMentionHint, setShowMentionHint] = useState(false);

  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Video upload state
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Poll state
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState(86400);

  // Upload progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Camera recording state
  const [showCamera, setShowCamera] = useState(false);

  const displayName = currentUser.name;
  const displayAvatar = currentUser.avatar;

  const createPostMutation = useCreatePost();
  const createPollMutation = useCreatePoll();

  // Trigger the image file picker
  const openImagePicker = useCallback(() => {
    // Reset the input value so the same file can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
      imageInputRef.current.click();
    }
  }, []);

  // Trigger the video file picker
  const openVideoPicker = useCallback(() => {
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
      videoInputRef.current.click();
    }
  }, []);

  // Switch to a post type and auto-trigger file picker for image/reel
  const switchPostType = useCallback((type: 'text' | 'image' | 'poll' | 'reel') => {
    setPostType(type);
    if (type === 'image') {
      // Use requestAnimationFrame to ensure DOM is updated before clicking
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          openImagePicker();
        });
      });
    } else if (type === 'reel') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          openVideoPicker();
        });
      });
    }
  }, [openImagePicker, openVideoPicker]);

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB per video

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = 4 - selectedImages.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    // Validate file sizes
    const oversized = toAdd.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (oversized.length > 0) {
      toast.error(`${oversized.length} image(s) exceed 10MB limit. Please choose smaller files.`);
      return;
    }
    setSelectedImages((prev) => [...prev, ...toAdd]);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    const url = imagePreviews[index];
    if (url) URL.revokeObjectURL(url);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error('Video exceeds 50MB limit. Please choose a smaller file.');
      return;
    }
    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  const handleCameraVideoCaptured = (blob: Blob) => {
    if (blob.size > MAX_VIDEO_SIZE) {
      toast.error('Recorded video exceeds 50MB limit. Please record a shorter video.');
      setShowCamera(false);
      return;
    }
    const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([blob], `camera-video.${extension}`, { type: blob.type });
    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(blob));
    setShowCamera(false);
  };

  const addPollOption = () => {
    if (pollOptions.length >= 6) {
      toast.error('Maximum 6 poll options');
      return;
    }
    setPollOptions((prev) => [...prev, '']);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const resetState = () => {
    setText('');
    setPostType('text');
    setVibeTag('hyped');
    setSelectedImages([]);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setSelectedVideo(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setPollOptions(['', '']);
    setPollDuration(86400);
    setIsUploading(false);
    setUploadProgress(0);
    setShowVibePicker(false);
    setShowHashtagHint(false);
    setShowMentionHint(false);
  };

  const handlePost = async () => {
    if (!text.trim() && postType !== 'image') {
      toast.error('Post cannot be empty!');
      return;
    }

    if (postType === 'poll') {
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length < 2) {
        toast.error('At least 2 poll options are required');
        return;
      }
      if (!text.trim()) {
        toast.error('Please enter a question');
        return;
      }
    }

    if (postType === 'image' && selectedImages.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    if (postType === 'reel' && !selectedVideo) {
      toast.error('Please select a video');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      let postTypeValue: string = postType;

      // Convert selected files to base64 and send directly with post creation
      const uploadedFiles: { data: string; filename: string; contentType: string }[] = [];

      if (postType === 'image' && selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          setUploadProgress(10 + ((i / selectedImages.length) * 40));
          const base64 = await fileToBase64(selectedImages[i]);
          uploadedFiles.push({
            data: base64,
            filename: selectedImages[i].name,
            contentType: selectedImages[i].type,
          });
        }
        postTypeValue = 'image';
      }

      if (postType === 'reel' && selectedVideo) {
        setUploadProgress(30);
        const base64 = await fileToBase64(selectedVideo);
        uploadedFiles.push({
          data: base64,
          filename: selectedVideo.name,
          contentType: selectedVideo.type,
        });
        postTypeValue = 'video';
      }

      setUploadProgress(60);

      const postText = text.trim() || (postType === 'reel' ? 'Shared a reel' : postType === 'image' ? 'Shared a photo' : '');

      const post = await createPostMutation.mutateAsync({
        text: postText,
        images: [],
        vibeTag,
        type: postTypeValue,
        uploadedFiles,
      });

      setUploadProgress(85);

      // Create poll if needed
      if (postType === 'poll') {
        const validOptions = pollOptions.filter((o) => o.trim());
        await createPollMutation.mutateAsync({
          postId: post.id,
          question: text.trim(),
          options: validOptions,
          duration: pollDuration,
        });
      }

      setUploadProgress(100);

      // Parse image URLs from the API response so local post shows images immediately
      const postImages: string[] = (() => {
        try {
          const parsed = JSON.parse((post as any).images || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })();

      // Don't add to local store — useCreatePost invalidates queries and triggers refetch,
      // so the API post will appear automatically. Adding a local copy with a different ID
      // causes duplicate posts in the profile feed.
      earnTokens(5, 'created a post');
      addXP(10);
      toast.success('Post published! +5 ORRA +10 XP 🎉', { icon: <Coins className="w-4 h-4 text-yellow-400" /> });

      resetState();
      toggleCreatePost();
    } catch (error) {
      console.error('Post creation failed:', error);
      // Fallback: save locally
      addUserPost(text.trim() || 'Shared content', [], vibeTag, postType);
      earnTokens(5, 'created a post');
      addXP(10);
      toast.error('Post saved locally but failed to sync. Other users may not see it.', { duration: 5000 });
      resetState();
      toggleCreatePost();
    }
  };

  const isSubmitting = createPostMutation.isPending || isUploading;

  // Sync postType with the store's createPostType whenever the modal opens
  useEffect(() => {
    if (showCreatePost) {
      setPostType(createPostType);
      // Auto-trigger file picker when opened directly with image or reel type
      if (createPostType === 'image') {
        // Use double rAF for reliable DOM readiness
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            openImagePicker();
          });
        });
      } else if (createPostType === 'reel') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            openVideoPicker();
          });
        });
      }
    }
  }, [showCreatePost, createPostType, openImagePicker, openVideoPicker]);

  if (!showCreatePost) return null;

  const getPlaceholder = () => {
    switch (postType) {
      case 'poll': return 'Ask a question...';
      case 'reel': return 'Describe your reel...';
      case 'image': return 'Add a caption...';
      default: return "What's happening in your ORRA?";
    }
  };

  const canPost = () => {
    if (isSubmitting) return false;
    if (postType === 'poll') {
      return text.trim() && pollOptions.filter((o) => o.trim()).length >= 2;
    }
    if (postType === 'image') {
      return selectedImages.length > 0; // caption is optional for image posts
    }
    if (postType === 'reel') {
      return selectedVideo !== null;
    }
    return text.trim().length > 0 && text.length <= 280;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => toggleCreatePost()} />
      <div className="relative glass-panel rounded-2xl p-6 w-full max-w-lg fade-in border border-violet-500/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Create Post</h2>
          <button onClick={() => toggleCreatePost()} className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-violet-500/30">
            <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{displayName}</p>
            <p className="text-xs text-slate-400">
              {postType === 'reel' ? 'Posting to Prism' : postType === 'poll' ? 'Creating a poll' : 'Posting to Pulse'}
            </p>
          </div>
        </div>

        {/* Post Type Selector */}
        <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
          {postTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.key}
                onClick={() => switchPostType(type.key)}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  postType === type.key
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Vibe Tag Selector */}
        <div className="mb-4">
          <button
            onClick={() => setShowVibePicker(!showVibePicker)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all"
          >
            <span className="text-slate-300">
              Vibe: {vibeTags.find((v) => v.key === vibeTag)?.label || 'Select'}
            </span>
            <span className="text-[10px] text-slate-500">Change</span>
          </button>
          {showVibePicker && (
            <div className="mt-2 grid grid-cols-3 gap-1 fade-in">
              {vibeTags.map((vibe) => (
                <button
                  key={vibe.key}
                  onClick={() => { setVibeTag(vibe.key); setShowVibePicker(false); }}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                    vibeTag === vibe.key
                      ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {vibe.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setShowHashtagHint(e.target.value.includes('#'));
            setShowMentionHint(e.target.value.includes('@'));
          }}
          placeholder={getPlaceholder()}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none min-h-[100px] leading-relaxed"
          autoFocus
        />

        {/* Hashtag/Mention hints */}
        {showHashtagHint && (
          <div className="mt-1 px-3 py-1.5 rounded-lg bg-violet-600/10 text-xs text-violet-300 fade-in">
            <Hash className="w-3 h-3 inline mr-1" />Try: #OrraDanceOff2027 #Vibes #Dance
          </div>
        )}
        {showMentionHint && (
          <div className="mt-1 px-3 py-1.5 rounded-lg bg-fuchsia-600/10 text-xs text-fuchsia-300 fade-in">
            <AtSign className="w-3 h-3 inline mr-1" />Try: @jessart @marcusr @lunasky
          </div>
        )}

        <div className="flex items-center justify-end mt-1">
          <span className={`text-xs ${text.length > 280 ? 'text-red-400' : 'text-slate-500'}`}>
            {text.length}/280
          </span>
        </div>

        {/* Image Upload UI (for image type) - LARGE PROMINENT AREA */}
        {postType === 'image' && (
          <div className="mt-3 fade-in">
            {/* Hidden file input - always present and accessible */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Large upload dropzone when no images selected */}
            {imagePreviews.length === 0 ? (
              <button
                type="button"
                onClick={openImagePicker}
                className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl bg-white/5 border-2 border-dashed border-white/20 text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Tap to add photos</p>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, WebP — up to 4 images</p>
                </div>
              </button>
            ) : (
              <>
                {/* Image previews grid */}
                <div className="grid grid-cols-2 gap-2">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square group">
                      <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-500/80 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Add more images button */}
                {selectedImages.length < 4 && (
                  <button
                    type="button"
                    onClick={openImagePicker}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-dashed border-white/20 text-sm text-slate-400 hover:text-white hover:border-violet-500/50 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    Add more photos ({selectedImages.length}/4)
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Video Upload UI (for reel type) - LARGE PROMINENT AREA */}
        {postType === 'reel' && (
          <div className="mt-3 fade-in">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoSelect}
              className="hidden"
            />
            {videoPreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <video src={videoPreview} className="w-full max-h-48 object-cover rounded-xl" controls playsInline />
                <button
                  onClick={removeVideo}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-500/80 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={openVideoPicker}
                  className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl bg-white/5 border-2 border-dashed border-white/20 text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Video className="w-7 h-7 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Tap to add a video</p>
                    <p className="text-xs text-slate-500 mt-1">MP4, WebM, MOV — max 50MB</p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-slate-500">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 text-violet-300 text-sm font-medium hover:from-violet-600/30 hover:to-fuchsia-600/30 transition-all active:scale-[0.98]"
                >
                  <Camera className="w-5 h-5" />
                  Record Video
                </button>
              </div>
            )}
          </div>
        )}

        {/* Poll UI (for poll type) */}
        {postType === 'poll' && (
          <div className="mt-3 fade-in space-y-2">
            {pollOptions.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all pr-10"
                    maxLength={80}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(i)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button
                onClick={addPollOption}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-violet-400 text-xs hover:bg-violet-500/10 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add option
              </button>
            )}
            {/* Duration selector */}
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">Duration:</span>
              <div className="flex gap-1">
                {pollDurations.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setPollDuration(d.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      pollDuration === d.value
                        ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-3 fade-in">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
              <span className="text-xs text-slate-400">
                {uploadProgress < 70 ? 'Uploading media...' : uploadProgress < 100 ? 'Creating post...' : 'Done!'}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick action buttons for text posts */}
        {postType === 'text' && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button onClick={() => switchPostType('image')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-emerald-400 text-xs hover:bg-emerald-500/10 transition-all active:scale-95">
              <ImageIcon className="w-4 h-4" /> Photo
            </button>
            <button onClick={() => switchPostType('reel')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-red-400 text-xs hover:bg-red-500/10 transition-all active:scale-95">
              <Video className="w-4 h-4" /> Video
            </button>
            <button onClick={() => switchPostType('poll')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-violet-400 text-xs hover:bg-violet-500/10 transition-all active:scale-95">
              <BarChart3 className="w-4 h-4" /> Poll
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-slate-500 text-xs cursor-not-allowed opacity-50" title="Coming soon">
              <Smile className="w-4 h-4" /> GIF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-slate-500 text-xs cursor-not-allowed opacity-50" title="Coming soon">
              <Music className="w-4 h-4" /> Sound
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-slate-500 text-xs cursor-not-allowed opacity-50" title="Coming soon">
              <MapPin className="w-4 h-4" /> Location
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Coins className="w-3 h-3 text-yellow-400" />
            <span>+5 ORRA +10 XP</span>
          </div>
          <button
            onClick={handlePost}
            disabled={!canPost()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition-all glow-violet text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Post
          </button>
        </div>
      </div>

      {/* Camera Capture Overlay */}
      {showCamera && (
        <CameraCapture
          onVideoCaptured={handleCameraVideoCaptured}
          onClose={() => setShowCamera(false)}
          mode="reel"
          maxDuration={60}
        />
      )}
    </div>
  );
}
