'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Zap, RotateCcw, SwitchCamera, Circle, StopCircle, Check } from 'lucide-react';

interface CameraCaptureProps {
  onVideoCaptured: (blob: Blob) => void;
  onClose: () => void;
  maxDuration?: number; // seconds, default 60
  mode?: 'reel' | 'story'; // affects max duration and UI hints
}

type CameraState = 'idle' | 'recording' | 'preview';

export function CameraCapture({
  onVideoCaptured,
  onClose,
  maxDuration: maxDurationProp,
  mode = 'reel',
}: CameraCaptureProps) {
  const maxDuration = maxDurationProp ?? (mode === 'story' ? 30 : 60);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashOn, setFlashOn] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const facingModeRef = useRef<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const mountedRef = useRef(true);

  // Format seconds as MM:SS
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Stop the camera stream and release resources
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start the camera with the given facing mode
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setIsStarting(true);
    setPermissionDenied(false);
    facingModeRef.current = facing;
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStarting(false);
    } catch {
      if (!mountedRef.current) return;
      setPermissionDenied(true);
      setIsStarting(false);
    }
  }, [stopStream]);

  // Initialize camera on mount - use a ref flag to trigger async init outside effect
  const initializedRef = useRef(false);

  // Kick off camera init (called once on mount via effect, but setState happens async)
  const initCamera = useCallback(async () => {
    const facing = facingModeRef.current;
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStarting(false);
    } catch {
      if (!mountedRef.current) return;
      setPermissionDenied(true);
      setIsStarting(false);
    }
  }, [stopStream]);

  useEffect(() => {
    mountedRef.current = true;
    if (!initializedRef.current) {
      initializedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async init, setState only in async callbacks
      initCamera();
    }

    return () => {
      mountedRef.current = false;
      stopStream();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initCamera, stopStream]);

  // Flip camera
  const handleFlipCamera = useCallback(async () => {
    if (cameraState === 'recording' || isFlipping) return;

    setIsFlipping(true);
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    setFlashOn(false); // Reset flash when switching cameras

    await startCamera(newFacing);
    setIsFlipping(false);
  }, [facingMode, cameraState, isFlipping, startCamera]);

  // Toggle flash (only for rear camera)
  const handleToggleFlash = useCallback(() => {
    if (facingMode === 'user' || cameraState === 'recording') return;

    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities?.() as Record<string, any> | undefined;
      if (capabilities?.torch) {
        const newFlashState = !flashOn;
        track.applyConstraints({ advanced: [{ torch: newFlashState } as any] }).then(() => {
          setFlashOn(newFlashState);
        }).catch(() => {
          // Flash not supported on this device
        });
      }
    }
  }, [facingMode, flashOn, cameraState]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current || cameraState !== 'idle') return;

    chunksRef.current = [];
    setElapsedSeconds(0);

    // Determine best supported mime type
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : MediaRecorder.isTypeSupported('video/mp4')
            ? 'video/mp4'
            : '';

    try {
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        recordedBlobRef.current = blob;

        if (mountedRef.current) {
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setCameraState('preview');
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100); // Collect data every 100ms
      setCameraState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDuration) {
            // Auto-stop at max duration
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return maxDuration;
          }
          return next;
        });
      }, 1000);
    } catch {
      // MediaRecorder failed to start
    }
  }, [cameraState, maxDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Toggle recording
  const handleRecordToggle = useCallback(() => {
    if (cameraState === 'idle') {
      startRecording();
    } else if (cameraState === 'recording') {
      stopRecording();
    }
  }, [cameraState, startRecording, stopRecording]);

  // Retake — go back to idle
  const handleRetake = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    recordedBlobRef.current = null;
    setElapsedSeconds(0);
    setCameraState('idle');

    // Restart camera if needed
    if (!streamRef.current || !streamRef.current.active) {
      startCamera(facingMode);
    }
  }, [videoUrl, facingMode, startCamera]);

  // Use the recorded video
  const handleUseVideo = useCallback(() => {
    if (recordedBlobRef.current) {
      onVideoCaptured(recordedBlobRef.current);
    }
  }, [onVideoCaptured]);

  // Close camera
  const handleClose = useCallback(() => {
    if (cameraState === 'recording') {
      stopRecording();
    }
    onClose();
  }, [cameraState, onClose, stopRecording]);

  // Countdown in last 5 seconds
  const showCountdown = cameraState === 'recording' && elapsedSeconds >= maxDuration - 5;
  const countdownNumber = maxDuration - elapsedSeconds;

  // Progress percentage for the ring
  const progressPercent = cameraState === 'recording' ? (elapsedSeconds / maxDuration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">
      {/* Camera Preview / Live Feed */}
      {cameraState !== 'preview' ? (
        <div className="relative flex-1 overflow-hidden">
          {/* Live video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
            }}
          />

          {/* Loading overlay */}
          {isStarting && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white text-sm">Starting camera...</p>
            </div>
          )}

          {/* Permission denied overlay */}
          {permissionDenied && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg">Camera Access Denied</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Please allow camera access in your browser settings to record videos.
                You may need to reload the page after granting permission.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all"
              >
                Go Back
              </button>
            </div>
          )}

          {/* Top bar overlay */}
          {!isStarting && !permissionDenied && (
            <>
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 pb-12">
                <div className="flex items-center justify-between">
                  {/* Close button */}
                  <button
                    onClick={handleClose}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all"
                    aria-label="Close camera"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Timer (visible while recording) */}
                  {cameraState === 'recording' && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                      showCountdown ? 'bg-red-600/80 animate-pulse' : 'bg-black/40 backdrop-blur-sm'
                    } transition-all`}>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className={`text-sm font-mono font-bold ${
                        showCountdown ? 'text-white text-base' : 'text-white'
                      }`}>
                        {showCountdown ? countdownNumber : formatTime(elapsedSeconds)}
                      </span>
                    </div>
                  )}

                  {/* Mode indicator (idle) */}
                  {cameraState === 'idle' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs text-white font-medium capitalize">{mode}</span>
                    </div>
                  )}

                  {/* Flash toggle (rear camera only) */}
                  <button
                    onClick={handleToggleFlash}
                    disabled={facingMode === 'user'}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      facingMode === 'user'
                        ? 'bg-black/20 text-white/30 cursor-not-allowed'
                        : flashOn
                          ? 'bg-yellow-500/80 text-white active:scale-90'
                          : 'bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 active:scale-90'
                    }`}
                    aria-label={flashOn ? 'Turn off flash' : 'Turn on flash'}
                  >
                    <Zap className="w-5 h-5" fill={flashOn ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Recording border effect */}
              {cameraState === 'recording' && (
                <div className="absolute inset-0 pointer-events-none border-4 border-red-500/60 animate-pulse rounded-none" />
              )}

              {/* Max duration hint (bottom) */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                {cameraState === 'idle' && (
                  <p className="text-center text-white/60 text-xs">
                    Tap to record · Max {maxDuration}s
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Preview mode */
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={previewVideoRef}
            src={videoUrl!}
            autoPlay
            loop
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Top bar in preview mode */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 pb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-medium hover:bg-black/60 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                <span className="text-xs text-white/70 font-medium">Preview</span>
              </div>

              <button
                onClick={handleUseVideo}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/80 backdrop-blur-sm text-white text-sm font-bold hover:bg-green-500 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                Use Video
              </button>
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
            <span className="text-xs text-white/70 font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      )}

      {/* Bottom controls (not in preview mode) */}
      {cameraState !== 'preview' && !isStarting && !permissionDenied && (
        <div className="bg-black/90 backdrop-blur-md px-6 py-6 pb-8 safe-area-bottom">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* Camera flip button */}
            <button
              onClick={handleFlipCamera}
              disabled={cameraState === 'recording'}
              className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all ${
                cameraState === 'recording' ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              aria-label="Flip camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>

            {/* Record button */}
            <div className="relative">
              {/* Progress ring around the button */}
              <svg
                className="absolute inset-0 w-[76px] h-[76px] -translate-x-0 -translate-y-0"
                viewBox="0 0 76 76"
              >
                {/* Background ring */}
                <circle
                  cx="38"
                  cy="38"
                  r="35"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="3"
                />
                {/* Progress ring */}
                {cameraState === 'recording' && (
                  <circle
                    cx="38"
                    cy="38"
                    r="35"
                    fill="none"
                    stroke={showCountdown ? '#ef4444' : '#ffffff'}
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - progressPercent / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 38 38)"
                    className="transition-all duration-1000 ease-linear"
                  />
                )}
              </svg>
              <button
                onClick={handleRecordToggle}
                className={`relative w-[76px] h-[76px] rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  cameraState === 'recording'
                    ? 'bg-red-500/30 border-4 border-red-500'
                    : 'bg-white/20 border-4 border-white'
                }`}
                aria-label={cameraState === 'recording' ? 'Stop recording' : 'Start recording'}
              >
                {cameraState === 'recording' ? (
                  <StopCircle className="w-8 h-8 text-red-500" fill="currentColor" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-red-500" />
                )}
              </button>
            </div>

            {/* Placeholder for symmetry */}
            <div className="w-12 h-12" />
          </div>
        </div>
      )}
    </div>
  );
}
