'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, X, SkipForward } from 'lucide-react';
import { getSongByUrl } from '@/lib/song-library';

interface ProfileMusicPlayerProps {
  songUrl: string;
  songTitle: string;
  songArtist: string;
  isOwnProfile?: boolean;
  onRemove?: () => void;
}

export function ProfileMusicPlayer({ songUrl, songTitle, songArtist, isOwnProfile, onRemove }: ProfileMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3); // Low volume like MySpace
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Look up cover art from the song library
  const songFromLibrary = getSongByUrl(songUrl);
  const coverArt = songFromLibrary?.coverArt;

  // Auto-play attempt on mount — browsers may block this, so we try and handle gracefully
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !songUrl) return;

    audio.volume = volume;

    const handleCanPlay = () => {
      // Try auto-play — if browser blocks it, we'll show the play button
      audio.play().then(() => {
        setIsPlaying(true);
        setHasInteracted(true);
      }).catch(() => {
        // Browser blocked autoplay — user must click play
        setIsPlaying(false);
      });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Loop the song like MySpace did
      audio.currentTime = 0;
      audio.play().catch(() => setIsPlaying(false));
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
    // Only re-run when songUrl changes (new profile viewed)
  }, [songUrl]);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setHasInteracted(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0) setIsMuted(false);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  }, [duration]);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!songUrl) return null;

  return (
    <>
      <audio ref={audioRef} src={songUrl} preload="auto" loop />

      {/* Minimized floating music note button */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 hover:scale-110 transition-all group"
          title={`${songTitle} by ${songArtist}`}
        >
          <Music className="w-5 h-5 text-white" />
          {isPlaying && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#050505] animate-pulse" />
          )}
          {/* Animated sound waves */}
          {isPlaying && (
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
            </div>
          )}
        </button>
      ) : (
        /* Full player bar */
        <div className="glass-panel rounded-2xl border border-violet-500/20 overflow-hidden fade-in">
          {/* Header with glow */}
          <div className="relative px-4 py-2.5 bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-violet-600/10">
            {/* Animated background shimmer */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
            </div>

            <div className="relative flex items-center gap-3">
              {/* Music icon / cover art with animation */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center border border-violet-500/20 overflow-hidden">
                  {coverArt ? (
                    <img src={coverArt} alt={songTitle} className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                {isPlaying && (
                  <>
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-[#050505]" />
                    {/* Sound wave bars */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-[2px]">
                      <div className="w-[2px] bg-violet-400 rounded-full animate-[sound1_0.4s_ease-in-out_infinite_alternate]" style={{ height: '4px' }} />
                      <div className="w-[2px] bg-fuchsia-400 rounded-full animate-[sound2_0.5s_ease-in-out_infinite_alternate]" style={{ height: '6px' }} />
                      <div className="w-[2px] bg-violet-400 rounded-full animate-[sound1_0.3s_ease-in-out_infinite_alternate]" style={{ height: '3px' }} />
                      <div className="w-[2px] bg-fuchsia-400 rounded-full animate-[sound2_0.6s_ease-in-out_infinite_alternate]" style={{ height: '5px' }} />
                    </div>
                  </>
                )}
              </div>

              {/* Song info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{songTitle}</p>
                <p className="text-[11px] text-slate-400 truncate">{songArtist}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                </button>

                {/* Volume control */}
                <div className="relative">
                  <button
                    onClick={() => { toggleMute(); setShowVolumeSlider(!showVolumeSlider); }}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                    )}
                  </button>
                  {showVolumeSlider && (
                    <div className="absolute bottom-full right-0 mb-2 p-2 glass-panel rounded-xl border border-violet-500/20 shadow-xl">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 accent-violet-500"
                      />
                    </div>
                  )}
                </div>

                {/* Minimize button */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                  title="Minimize player"
                >
                  <SkipForward className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Remove song (own profile only) */}
                {isOwnProfile && onRemove && (
                  <button
                    onClick={onRemove}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-all"
                    title="Remove profile song"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="h-1 bg-white/5 cursor-pointer group/progress relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-100 relative"
              style={{ width: `${progress}%` }}
            >
              {/* Playhead dot */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-lg shadow-violet-500/50 opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
            {/* Hover preview time */}
            <div className="absolute inset-0 opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>

          {/* Time display */}
          <div className="px-4 py-1 flex items-center justify-between">
            <span className="text-[9px] text-slate-600 font-mono">{formatTime(currentTime)}</span>
            <span className="text-[9px] text-slate-600 font-mono">{formatTime(duration)}</span>
          </div>
        </div>
      )}
    </>
  );
}
