'use client';

import { useAuraStore } from '@/store/aura-store';
import { vibeLabels } from '@/lib/data';
import { useCurrentUser } from '@/lib/use-current-user';
import { useCreatePost, useCreatePoll } from '@/lib/api-hooks';
import { X, Image as ImageIcon, Video, BarChart3, MapPin, Smile, Music, Hash, AtSign, Coins, Type, Camera, Plus, Trash2, Upload, Loader2, Clock, Mic, MicOff, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CameraCapture } from '@/components/aura/camera-capture';

const postTypes = [
  { key: 'text', label: 'Text', icon: Type },
  { key: 'image', label: 'Photo', icon: ImageIcon },
  { key: 'voice', label: 'Voice', icon: Mic },
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

// Format seconds as M:SS
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CreatePostModal() {
  const { showCreatePost, createPostType, toggleCreatePost, addUserPost, earnTokens, addXP } = useAuraStore();
  const currentUser = useCurrentUser();
  const [text, setText] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'poll' | 'reel' | 'voice'>('text');
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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [waveformBars] = useState(() => Array.from({ length: 40 }, () => Math.random() * 0.7 + 0.3));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAnimFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : MediaRecorder.isTypeSupported('audio/webm') 
            ? 'audio/webm' 
            : 'audio/ogg',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedAudioBlob(blob);
        setRecordedAudioUrl(url);
        setIsRecording(false);
      };

      mediaRecorder.start(100); // collect data every 100ms for smoother chunks
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedAudioBlob(null);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            // Max 60 seconds - auto-stop
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
            }
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      toast.error('Microphone access denied. Please allow microphone access to record voice notes.');
    }
  }, [recordedAudioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const clearRecording = useCallback(() => {
    stopRecording();
    setRecordingDuration(0);
    setRecordedAudioBlob(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsRecording(false);
  }, [recordedAudioUrl, stopRecording]);

  // Preview playback
  const togglePreviewPlayback = useCallback(() => {
    if (!recordedAudioUrl) return;

    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      if (previewAnimFrameRef.current) cancelAnimationFrame(previewAnimFrameRef.current);
      return;
    }

    const audio = new Audio(recordedAudioUrl);
    previewAudioRef.current = audio;

    audio.onended = () => {
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
      if (previewAnimFrameRef.current) cancelAnimationFrame(previewAnimFrameRef.current);
    };

    const updateProgress = () => {
      if (audio.duration && audio.currentTime) {
        setPreviewProgress((audio.currentTime / audio.duration) * 100);
      }
      previewAnimFrameRef.current = requestAnimationFrame(updateProgress);
    };

    audio.play();
    setIsPreviewPlaying(true);
    updateProgress();
  }, [recordedAudioUrl, isPreviewPlaying]);

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
  const switchPostType = useCallback((type: 'text' | 'image' | 'poll' | 'reel' | 'voice') => {
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
  const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB per audio

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
    clearRecording();
    setPollOptions(['', '']);
    setPollDuration(86400);
    setIsUploading(false);
    setUploadProgress(0);
    setShowVibePicker(false);
    setShowHashtagHint(false);
    setShowMentionHint(false);
  };

  const handlePost = async () => {
    if (!text.trim() && postType !== 'image' && postType !== 'voice') {
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

    if (postType === 'voice' && !recordedAudioBlob) {
      toast.error('Please record a voice note first');
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

      if (postType === 'voice' && recordedAudioBlob) {
        setUploadProgress(20);
        // Validate audio size
        if (recordedAudioBlob.size > MAX_AUDIO_SIZE) {
          toast.error('Voice note exceeds 10MB limit.');
          setIsUploading(false);
          return;
        }
        const extension = recordedAudioBlob.type.includes('webm') ? 'webm' : 'ogg';
        const audioFile = new File([recordedAudioBlob], `voice-note.${extension}`, { type: recordedAudioBlob.type });
        const base64 = await fileToBase64(audioFile);
        uploadedFiles.push({
          data: base64,
          filename: audioFile.name,
          contentType: audioFile.type,
        });
        postTypeValue = 'voice';
      }

      setUploadProgress(60);

      const postText = text.trim() || (postType === 'reel' ? 'Shared a reel' : postType === 'image' ? 'Shared a photo' : postType === 'voice' ? 'Shared a voice note' : '');

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      if (previewAnimFrameRef.current) {
        cancelAnimationFrame(previewAnimFrameRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, []);

  if (!showCreatePost) return null;

  const getPlaceholder = () => {
    switch (postType) {
      case 'poll': return 'Ask a question...';
      case 'reel': return 'Describe your reel...';
      case 'image': return 'Add a caption...';
      case 'voice': return 'Add a caption for your voice note...';
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
    if (postType === 'voice') {
      return recordedAudioBlob !== null; // caption is optional for voice posts
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
              {postType === 'reel' ? 'Posting to Prism' : postType === 'poll' ? 'Creating a poll' : postType === 'voice' ? 'Recording a voice note' : 'Posting to Pulse'}
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
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  postType === type.key
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{type.label}</span>
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

        {/* Voice Recorder UI */}
        {postType === 'voice' && (
          <div className="mt-3 fade-in">
            {!recordedAudioBlob ? (
              <div className="flex flex-col items-center gap-4 py-6">
                {/* Waveform visualization during recording */}
                <div className="flex items-center gap-[2px] h-16 px-2">
                  {waveformBars.map((height, i) => (
                    <div
                      key={i}
                      className={`w-[3px] rounded-full transition-all duration-150 ${
                        isRecording
                          ? 'bg-gradient-to-t from-violet-500 to-fuchsia-400'
                          : 'bg-white/10'
                      }`}
                      style={{
                        height: isRecording
                          ? `${height * 100}%`
                          : `${height * 20}%`,
                        animationDelay: `${i * 50}ms`,
                        animation: isRecording ? `voicebar ${0.3 + Math.random() * 0.4}s ease-in-out infinite alternate` : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center">
                  <span className={`text-2xl font-mono font-bold tabular-nums ${
                    isRecording ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {formatDuration(recordingDuration)}
                  </span>
                  {isRecording && (
                    <span className="text-xs text-red-400/60 block mt-1">Max 60 seconds</span>
                  )}
                </div>

                {/* Record button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    isRecording
                      ? 'bg-red-500/20 hover:bg-red-500/30'
                      : 'bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:opacity-90'
                  }`}
                >
                  {/* Pulsing ring animation when recording */}
                  {isRecording && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30" />
                      <div className="absolute inset-[-4px] rounded-full border border-red-500/40 animate-pulse" />
                    </>
                  )}
                  {isRecording ? (
                    <Square className="w-8 h-8 text-red-400 fill-red-400" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>

                <p className="text-xs text-slate-500">
                  {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-xl p-4 space-y-4 border border-violet-500/20">
                {/* Playback preview */}
                <div className="flex items-center gap-3">
                  {/* Play/Pause button */}
                  <button
                    onClick={togglePreviewPlayback}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center hover:opacity-90 transition-all active:scale-95 flex-shrink-0"
                  >
                    {isPreviewPlaying ? (
                      <Pause className="w-5 h-5 text-white fill-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </button>

                  {/* Waveform + progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[2px] h-10">
                      {waveformBars.map((height, i) => {
                        const progressIndex = Math.floor((previewProgress / 100) * waveformBars.length);
                        return (
                          <div
                            key={i}
                            className={`w-[3px] rounded-full transition-all duration-100 ${
                              i <= progressIndex
                                ? 'bg-gradient-to-t from-violet-500 to-fuchsia-400'
                                : 'bg-white/15'
                            }`}
                            style={{ height: `${height * 100}%` }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500">
                        {isPreviewPlaying ? 'Playing...' : 'Voice note ready'}
                      </span>
                      <span className="text-[10px] text-slate-500">{formatDuration(recordingDuration)}</span>
                    </div>
                  </div>
                </div>

                {/* Re-record button */}
                <button
                  onClick={clearRecording}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-white hover:border-violet-500/30 transition-all active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Re-record
                </button>
              </div>
            )}
          </div>
        )}

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
            <button onClick={() => switchPostType('voice')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-fuchsia-400 text-xs hover:bg-fuchsia-500/10 transition-all active:scale-95">
              <Mic className="w-4 h-4" /> Voice
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

      {/* CSS Keyframes for voice bar animation */}
      <style jsx>{`
        @keyframes voicebar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
