'use client';

import { useAuraStore } from '@/store/aura-store';
import { vibeLabels } from '@/lib/data';
import { useCurrentUser } from '@/lib/use-current-user';
import { useCreatePost, useCreatePoll } from '@/lib/api-hooks';
import { X, Image as ImageIcon, Video, BarChart3, MapPin, Smile, Music, Hash, AtSign, Coins, Type, Camera, Plus, Trash2, Upload, Loader2, Clock, Mic, MicOff, Play, Pause, Square, RotateCcw, Sparkles, UserPlus, Calendar, Lock, Search, Users } from 'lucide-react';
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

// Helper: convert a Blob to base64 data URL
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Format seconds as M:SS
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Format date for schedule display
function formatScheduleDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface CollabUser {
  id: string;
  name: string;
  handle?: string;
  avatar?: string;
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
  // Voice upload state — audioUrl from /api/voice-post
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

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

  // ─── NEW FEATURE STATE ───────────────────────────────────────

  // 2. AI Content Creation
  const [showAiOverlay, setShowAiOverlay] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // 3. Collab Post
  const [showCollabSearch, setShowCollabSearch] = useState(false);
  const [collabSearchQuery, setCollabSearchQuery] = useState('');
  const [collabSearchResults, setCollabSearchResults] = useState<CollabUser[]>([]);
  const [selectedCoAuthor, setSelectedCoAuthor] = useState<CollabUser | null>(null);
  const [isSearchingCollab, setIsSearchingCollab] = useState(false);
  const collabSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 4. Schedule Post
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // 5. Close Friends Only
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);

  // ─────────────────────────────────────────────────────────────

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

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const localUrl = URL.createObjectURL(blob);
        setRecordedAudioBlob(blob);
        setRecordedAudioUrl(localUrl);
        setIsRecording(false);

        // Upload to /api/voice-post to get audioUrl
        setIsUploadingVoice(true);
        try {
          if (blob.size > MAX_AUDIO_SIZE) {
            toast.error('Voice note exceeds 10MB limit.');
            setIsUploadingVoice(false);
            return;
          }
          const base64 = await blobToBase64(blob);
          const extension = blob.type.includes('webm') ? 'webm' : 'ogg';
          const res = await fetch('/api/voice-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64,
              filename: `voice-note.${extension}`,
              contentType: blob.type,
            }),
          });
          if (!res.ok) throw new Error('Voice upload failed');
          const data = await res.json();
          setVoiceAudioUrl(data.audioUrl || data.url || null);
        } catch (err) {
          console.error('Voice upload to /api/voice-post failed:', err);
          // Fallback — still allow posting with local blob
          setVoiceAudioUrl(null);
        } finally {
          setIsUploadingVoice(false);
        }
      };

      mediaRecorder.start(100); // collect data every 100ms for smoother chunks
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedAudioBlob(null);
      setVoiceAudioUrl(null);
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
    setVoiceAudioUrl(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    setIsPreviewPlaying(false);
    setPreviewProgress(0);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsRecording(false);
    setIsUploadingVoice(false);
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

    // Prefer the server audioUrl for playback if available
    const audioSrc = voiceAudioUrl || recordedAudioUrl;
    const audio = new Audio(audioSrc);
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
  }, [recordedAudioUrl, voiceAudioUrl, isPreviewPlaying]);

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

  // ─── AI Content Creation handler ─────────────────────────────
  const handleAiSuggest = useCallback(async () => {
    setIsLoadingAi(true);
    setShowAiOverlay(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Help me write a creative social media post. Current text: ${text || '(no text yet)'}. Make it engaging, use emojis, keep it under 280 chars.`,
        }),
      });
      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();
      setAiSuggestion(data.message || data.content || data.text || '');
    } catch (err) {
      console.error('AI suggestion failed:', err);
      toast.error('AI suggestion failed. Please try again.');
      setShowAiOverlay(false);
    } finally {
      setIsLoadingAi(false);
    }
  }, [text]);

  const acceptAiSuggestion = () => {
    setText(aiSuggestion);
    setShowAiOverlay(false);
    setAiSuggestion('');
    earnTokens(1, 'AI assist');
    toast.success('AI suggestion applied! +1 ORRA ✨', { icon: <Sparkles className="w-4 h-4 text-violet-400" /> });
  };

  const dismissAiSuggestion = () => {
    setShowAiOverlay(false);
    setAiSuggestion('');
  };

  // ─── Collab Post handlers ────────────────────────────────────
  const handleCollabSearch = useCallback((query: string) => {
    setCollabSearchQuery(query);
    if (collabSearchTimerRef.current) clearTimeout(collabSearchTimerRef.current);

    if (!query.trim()) {
      setCollabSearchResults([]);
      return;
    }

    setIsSearchingCollab(true);
    collabSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setCollabSearchResults(Array.isArray(data) ? data : data.users || data.results || []);
      } catch (err) {
        console.error('Collab search failed:', err);
        setCollabSearchResults([]);
      } finally {
        setIsSearchingCollab(false);
      }
    }, 350);
  }, []);

  const selectCoAuthor = (user: CollabUser) => {
    setSelectedCoAuthor(user);
    setShowCollabSearch(false);
    setCollabSearchQuery('');
    setCollabSearchResults([]);
  };

  const removeCoAuthor = () => {
    setSelectedCoAuthor(null);
  };

  // ─── Schedule Post handler ───────────────────────────────────
  const handleScheduleChange = (value: string) => {
    setScheduledDate(value);
  };

  // ─────────────────────────────────────────────────────────────

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
    // Reset new feature state
    setShowAiOverlay(false);
    setAiSuggestion('');
    setIsLoadingAi(false);
    setShowCollabSearch(false);
    setCollabSearchQuery('');
    setCollabSearchResults([]);
    setSelectedCoAuthor(null);
    setIsSearchingCollab(false);
    setScheduledDate('');
    setShowSchedulePicker(false);
    setCloseFriendsOnly(false);
    setVoiceAudioUrl(null);
    setIsUploadingVoice(false);
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

      // Build the post body with new feature fields
      const postBody: Record<string, unknown> = {
        text: postText,
        images: [],
        vibeTag,
        type: postTypeValue,
        uploadedFiles,
      };

      // 3. Collab: include coAuthorId
      if (selectedCoAuthor) {
        postBody.coAuthorId = selectedCoAuthor.id;
      }

      // 5. Close Friends Only
      if (closeFriendsOnly) {
        postBody.closeFriendsOnly = true;
      }

      // 1. Voice: include audioUrl if we got one from /api/voice-post
      if (postType === 'voice' && voiceAudioUrl) {
        postBody.audioUrl = voiceAudioUrl;
      }

      // 4. Schedule: if scheduled, POST to /api/scheduled-posts instead
      if (scheduledDate) {
        postBody.scheduledAt = new Date(scheduledDate).toISOString();

        setUploadProgress(70);
        const scheduleRes = await fetch('/api/scheduled-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postBody),
        });
        if (!scheduleRes.ok) throw new Error('Schedule post failed');
        setUploadProgress(100);

        toast.success(`Scheduled for ${formatScheduleDate(scheduledDate)} 📅`, {
          icon: <Calendar className="w-4 h-4 text-violet-400" />,
        });
        earnTokens(5, 'scheduled a post');
        addXP(10);

        resetState();
        toggleCreatePost();
        return;
      }

      const post = await createPostMutation.mutateAsync(postBody as Parameters<typeof createPostMutation.mutateAsync>[0]);

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
      if (collabSearchTimerRef.current) {
        clearTimeout(collabSearchTimerRef.current);
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
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">{displayName}</p>
            <p className="text-xs text-slate-400">
              {postType === 'reel' ? 'Posting to Prism' : postType === 'poll' ? 'Creating a poll' : postType === 'voice' ? 'Recording a voice note' : 'Posting to Pulse'}
            </p>
          </div>
          {/* Close Friends Only badge in header */}
          {closeFriendsOnly && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium">
              <Lock className="w-3 h-3" />
              Close Friends
            </div>
          )}
        </div>

        {/* Co-author chip */}
        {selectedCoAuthor && (
          <div className="flex items-center gap-2 mb-3 fade-in">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs">
              <Users className="w-3 h-3" />
              <span>Co-author:</span>
              {selectedCoAuthor.avatar && (
                <img src={selectedCoAuthor.avatar} alt={selectedCoAuthor.name} className="w-4 h-4 rounded-full object-cover" />
              )}
              <span className="font-medium">{selectedCoAuthor.name}</span>
              <button onClick={removeCoAuthor} className="ml-1 hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Scheduled date badge */}
        {scheduledDate && (
          <div className="flex items-center gap-2 mb-3 fade-in">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
              <Calendar className="w-3 h-3" />
              <span>Scheduled: {formatScheduleDate(scheduledDate)}</span>
              <button onClick={() => setScheduledDate('')} className="ml-1 hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

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

        {/* ─── TOOLBAR ROW: AI · Collab · Schedule · Close Friends ─── */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {/* Prism AI button */}
          <button
            onClick={handleAiSuggest}
            disabled={isLoadingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 text-violet-300 text-xs font-medium hover:from-violet-600/30 hover:to-fuchsia-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Prism AI ✨
          </button>

          {/* Collab button */}
          <button
            onClick={() => { setShowCollabSearch(!showCollabSearch); setShowSchedulePicker(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              selectedCoAuthor
                ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Collab
          </button>

          {/* Schedule button */}
          <button
            onClick={() => { setShowSchedulePicker(!showSchedulePicker); setShowCollabSearch(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              scheduledDate
                ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-300'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule
          </button>

          {/* Close Friends Only toggle */}
          <button
            onClick={() => setCloseFriendsOnly(!closeFriendsOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              closeFriendsOnly
                ? 'bg-amber-600/20 border border-amber-500/30 text-amber-300'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Close Friends
          </button>
        </div>

        {/* ─── Collab search panel ─────────────────────────────── */}
        {showCollabSearch && (
          <div className="mb-3 fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={collabSearchQuery}
                onChange={(e) => handleCollabSearch(e.target.value)}
                placeholder="Search for a co-author by name or handle..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all"
                autoFocus
              />
              {isSearchingCollab && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />
              )}
            </div>
            {collabSearchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-white/5 border border-white/10 divide-y divide-white/5 custom-scrollbar">
                {collabSearchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectCoAuthor(user)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-all text-left"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-violet-300 font-bold">{user.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{user.name}</p>
                      {user.handle && <p className="text-xs text-slate-500 truncate">@{user.handle}</p>}
                    </div>
                    <UserPlus className="w-4 h-4 text-violet-400 ml-auto flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {collabSearchQuery.trim() && collabSearchResults.length === 0 && !isSearchingCollab && (
              <p className="text-xs text-slate-500 mt-2 text-center">No users found</p>
            )}
          </div>
        )}

        {/* ─── Schedule date picker ────────────────────────────── */}
        {showSchedulePicker && (
          <div className="mb-3 fade-in">
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => handleScheduleChange(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all [color-scheme:dark]"
              />
              {scheduledDate && (
                <button
                  onClick={() => setScheduledDate('')}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {scheduledDate && new Date(scheduledDate) <= new Date() && (
              <p className="text-xs text-red-400 mt-1">Schedule time must be in the future</p>
            )}
          </div>
        )}

        {/* ─── AI suggestion overlay ───────────────────────────── */}
        {showAiOverlay && (
          <div className="mb-3 fade-in relative">
            <div className="rounded-xl p-4 bg-white/5 backdrop-blur-xl border border-violet-500/20 shadow-lg shadow-violet-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-violet-300">Prism AI Suggestion</span>
              </div>
              {isLoadingAi ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  <span className="text-xs text-slate-400">Generating suggestion...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/90 leading-relaxed mb-3">{aiSuggestion}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={acceptAiSuggestion}
                      className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold hover:opacity-90 transition-all active:scale-95"
                    >
                      Accept & Replace
                    </button>
                    <button
                      onClick={dismissAiSuggestion}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs hover:text-white transition-all active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
                {/* Upload indicator */}
                {isUploadingVoice && (
                  <div className="flex items-center gap-2 px-1">
                    <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                    <span className="text-xs text-slate-400">Processing voice note...</span>
                  </div>
                )}

                {/* Audio player preview */}
                {voiceAudioUrl && !isUploadingVoice && (
                  <div className="fade-in">
                    <audio
                      controls
                      src={voiceAudioUrl}
                      className="w-full h-10 rounded-lg"
                      preload="metadata"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {/* Playback preview (waveform style) */}
                <div className="flex items-center gap-3">
                  {/* Play/Pause button */}
                  <button
                    onClick={togglePreviewPlayback}
                    disabled={isUploadingVoice}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center hover:opacity-90 transition-all active:scale-95 flex-shrink-0 disabled:opacity-50"
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
                        {isUploadingVoice ? 'Processing...' : isPreviewPlaying ? 'Playing...' : 'Voice note ready'}
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

        {/* Post preview badges */}
        {(closeFriendsOnly || selectedCoAuthor || scheduledDate) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {closeFriendsOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium">
                <Lock className="w-2.5 h-2.5" /> Close Friends Only
              </span>
            )}
            {selectedCoAuthor && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-medium">
                <Users className="w-2.5 h-2.5" /> Collab with {selectedCoAuthor.name}
              </span>
            )}
            {scheduledDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-medium">
                <Calendar className="w-2.5 h-2.5" /> Scheduled
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Coins className="w-3 h-3 text-yellow-400" />
            <span>+5 ORRA +10 XP</span>
            {scheduledDate && (
              <span className="ml-1 text-cyan-400">· Scheduled</span>
            )}
          </div>
          <button
            onClick={handlePost}
            disabled={!canPost() || (scheduledDate && new Date(scheduledDate) <= new Date())}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:opacity-90 transition-all glow-violet text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {scheduledDate ? 'Schedule' : 'Post'}
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
