import { useCallback, useState } from "react";
import TrackPlayer, {
  useProgress,
  usePlaybackState,
  State,
  RepeatMode,
} from "react-native-track-player";
import { addTrack, clearNowPlaying } from "../services/trackPlayerService";

export interface TrackPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  position: number;
  progress: number;
  formattedPosition: string;
  formattedDuration: string;
  error: string | null;
  isLooping: boolean;
  playbackRate: number;
}

export interface TrackMetadata {
  id?: string;
  title?: string;
  artist?: string;
  artwork?: string;
  duration?: number;
}

/**
 * Hook for Track Player state and controls.
 * IMPORTANT: Does NOT initialize TrackPlayer - that happens in _layout.tsx (FIX #1)
 */
export function useTrackPlayer() {
  const [error, setError] = useState<string | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);

  const playbackState = usePlaybackState();
  const { position, duration } = useProgress(250); // Update every 250ms

  // NO initialization here - FIX #1
  // TrackPlayer is initialized once in _layout.tsx

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Compute state
  const isPlaying = playbackState.state === State.Playing;
  const isLoading =
    playbackState.state === State.Buffering ||
    playbackState.state === State.Loading ||
    playbackState.state === State.Connecting;

  // Load audio with metadata for Now Playing
  const loadAudio = useCallback(
    async (
      source: string | number,
      metadata?: TrackMetadata,
    ) => {
      try {
        setError(null);
        // Convert source to URL string
        const url = typeof source === "string" ? source : String(source);
        await addTrack({
          id: metadata?.id || url,
          url,
          title: metadata?.title || "Meditation",
          artist: metadata?.artist || "CalmNest",
          artwork: metadata?.artwork,
          duration: metadata?.duration,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audio");
      }
    },
    [],
  );

  // Playback controls
  const play = useCallback(async () => {
    try {
      console.log("TrackPlayer play() called");
      await TrackPlayer.play();
      console.log("TrackPlayer play() succeeded");
    } catch (err) {
      console.warn("Failed to play:", err);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await TrackPlayer.pause();
    } catch (err) {
      console.warn("Failed to pause:", err);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await TrackPlayer.pause();
      await TrackPlayer.seekTo(0);
    } catch (err) {
      console.warn("Failed to stop:", err);
    }
  }, []);

  const seekTo = useCallback(async (pos: number) => {
    try {
      await TrackPlayer.seekTo(pos);
    } catch (err) {
      console.warn("Failed to seek:", err);
    }
  }, []);

  const setVolume = useCallback(async (vol: number) => {
    try {
      await TrackPlayer.setVolume(Math.max(0, Math.min(1, vol)));
    } catch (err) {
      console.warn("Failed to set volume:", err);
    }
  }, []);

  const setLoop = useCallback(async (loop: boolean) => {
    try {
      await TrackPlayer.setRepeatMode(loop ? RepeatMode.Track : RepeatMode.Off);
      setIsLooping(loop);
    } catch (err) {
      console.warn("Failed to set loop:", err);
    }
  }, []);

  const setPlaybackRate = useCallback(async (rate: number) => {
    try {
      const clampedRate =
        Math.round(Math.max(0.5, Math.min(2.0, rate)) * 10) / 10;
      await TrackPlayer.setRate(clampedRate);
      setPlaybackRateState(clampedRate);
    } catch (err) {
      console.warn("Failed to set playback rate:", err);
    }
  }, []);

  const skipForward = useCallback(
    async (seconds = 15) => {
      try {
        const newPos = Math.min(position + seconds, duration);
        await TrackPlayer.seekTo(newPos);
      } catch (err) {
        console.warn("Failed to skip forward:", err);
      }
    },
    [position, duration],
  );

  const skipBackward = useCallback(
    async (seconds = 15) => {
      try {
        const newPos = Math.max(position - seconds, 0);
        await TrackPlayer.seekTo(newPos);
      } catch (err) {
        console.warn("Failed to skip backward:", err);
      }
    },
    [position],
  );

  // Cleanup - clears Now Playing
  const cleanup = useCallback(async () => {
    try {
      await clearNowPlaying();
    } catch (err) {
      // Ignore cleanup errors
    }
  }, []);

  // Create a player-like object for sleep timer compatibility
  const player = {
    get volume() {
      return 1;
    },
    set volume(v: number) {
      TrackPlayer.setVolume(v);
    },
  };

  return {
    // State
    isPlaying,
    isLoading,
    duration,
    position,
    progress: duration > 0 ? position / duration : 0,
    formattedPosition: formatTime(position),
    formattedDuration: formatTime(duration),
    error,
    isLooping,
    playbackRate,

    // Actions
    loadAudio,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    setLoop,
    setPlaybackRate,
    skipForward,
    skipBackward,
    cleanup,

    // For sleep timer compatibility
    player,
  };
}
