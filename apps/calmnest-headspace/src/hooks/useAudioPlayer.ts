import { useState, useEffect, useCallback } from 'react';
import { audioService, AudioState } from '../services/audioService';

export function useAudioPlayer() {
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    duration: 0,
    position: 0,
    error: null,
  });

  useEffect(() => {
    // Set up the callback to receive state updates
    audioService.setUpdateCallback(setAudioState);

    // Cleanup
    return () => {
      audioService.setUpdateCallback(() => {});
    };
  }, []);

  /**
   * Load audio from a URI string or a local asset (require())
   * @param source - Either a URI string or a require() asset number
   */
  const loadAudio = useCallback(async (source: string | number) => {
    // Errors are handled gracefully in audioService
    await audioService.loadAudio(source);
  }, []);

  const play = useCallback(async () => {
    try {
      await audioService.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await audioService.pause();
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await audioService.stop();
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }, []);

  const seekTo = useCallback(async (position: number) => {
    try {
      await audioService.seekTo(position);
    } catch (error) {
      console.error('Failed to seek audio:', error);
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    try {
      await audioService.setVolume(volume);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const cleanup = useCallback(async () => {
    try {
      await audioService.unloadAudio();
    } catch (error) {
      console.error('Failed to cleanup audio:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...audioState,
    loadAudio,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    cleanup,
    formattedPosition: formatTime(audioState.position),
    formattedDuration: formatTime(audioState.duration),
    progress: audioState.duration > 0 ? (audioState.position / audioState.duration) * 100 : 0,
  };
}
