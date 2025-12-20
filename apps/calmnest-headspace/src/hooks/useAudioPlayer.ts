import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { getAudioFile } from '../constants/audioFiles';

export interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  position: number;
  progress: number;
  formattedPosition: string;
  formattedDuration: string;
  error: string | null;
}

/**
 * Custom hook that wraps expo-audio's useAudioPlayer with additional utilities
 */
export function useAudioPlayer(initialSource?: string | number | null) {
  const [currentSource, setCurrentSource] = useState<string | number | null>(initialSource ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isAudioConfigured, setIsAudioConfigured] = useState(false);

  // Configure audio mode on mount
  useEffect(() => {
    async function configureAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          shouldRouteThroughEarpiece: false,
        });
        setIsAudioConfigured(true);
      } catch (err) {
        console.warn('Failed to configure audio mode:', err);
        setIsAudioConfigured(true); // Continue anyway
      }
    }
    configureAudio();
  }, []);

  // Resolve the audio source
  const resolvedSource = useMemo(() => {
    if (!currentSource) return null;
    
    // If it's a string that matches an audio file key, resolve it
    if (typeof currentSource === 'string') {
      const localFile = getAudioFile(currentSource);
      if (localFile) return localFile;
      // Otherwise treat as URL
      return { uri: currentSource };
    }
    
    // Already a require() result (number)
    return currentSource;
  }, [currentSource]);

  // Use expo-audio's hook
  const player = useExpoAudioPlayer(resolvedSource, {
    updateInterval: 250,
  });

  // Get status from player
  const status = useAudioPlayerStatus(player);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Compute derived state
  const audioState: AudioPlayerState = useMemo(() => ({
    isPlaying: status.playing,
    isLoading: !status.isLoaded || status.isBuffering,
    duration: status.duration,
    position: status.currentTime,
    progress: status.duration > 0 ? status.currentTime / status.duration : 0,
    formattedPosition: formatTime(status.currentTime),
    formattedDuration: formatTime(status.duration),
    error,
  }), [status, error, formatTime]);

  // Load a new audio source
  const loadAudio = useCallback(async (source: string | number) => {
    try {
      setError(null);
      setCurrentSource(source);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio';
      setError(errorMessage);
      console.warn('Audio loading error:', errorMessage);
    }
  }, []);

  // Playback controls
  const play = useCallback(async () => {
    try {
      player.play();
    } catch (err) {
      console.warn('Failed to play:', err);
    }
  }, [player]);

  const pause = useCallback(async () => {
    try {
      player.pause();
    } catch (err) {
      console.warn('Failed to pause:', err);
    }
  }, [player]);

  const stop = useCallback(async () => {
    try {
      player.pause();
      player.seekTo(0);
    } catch (err) {
      console.warn('Failed to stop:', err);
    }
  }, [player]);

  const seekTo = useCallback(async (position: number) => {
    try {
      player.seekTo(position);
    } catch (err) {
      console.warn('Failed to seek:', err);
    }
  }, [player]);

  const setVolume = useCallback((volume: number) => {
    try {
      player.volume = Math.max(0, Math.min(1, volume));
    } catch (err) {
      console.warn('Failed to set volume:', err);
    }
  }, [player]);

  const cleanup = useCallback(() => {
    try {
      player.pause();
    } catch (err) {
      // Ignore cleanup errors
    }
  }, [player]);

  return {
    // State
    ...audioState,
    
    // Actions
    loadAudio,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    cleanup,
    
    // Raw player access if needed
    player,
  };
}
