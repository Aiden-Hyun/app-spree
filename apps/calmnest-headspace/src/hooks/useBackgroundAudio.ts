import { useCallback, useState, useEffect, useRef } from "react";
import {
  useAudioPlayer as useExpoAudioPlayer,
  useAudioPlayerStatus,
  AudioSource,
} from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  SELECTED_SOUND: "bg_audio_selected_sound",
  VOLUME: "bg_audio_volume",
  ENABLED: "bg_audio_enabled",
};

export interface BackgroundAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  selectedSoundId: string | null;
  volume: number;
  isEnabled: boolean;
}

/**
 * Hook for managing background ambient audio that plays alongside main content
 */
export function useBackgroundAudio() {
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.3); // Default 30% volume
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Create audio player instance
  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // Load saved preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const [savedSoundId, savedVolume, savedEnabled] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SOUND),
          AsyncStorage.getItem(STORAGE_KEYS.VOLUME),
          AsyncStorage.getItem(STORAGE_KEYS.ENABLED),
        ]);

        if (savedSoundId) {
          setSelectedSoundId(savedSoundId);
        }
        if (savedVolume) {
          setVolumeState(parseFloat(savedVolume));
        }
        if (savedEnabled !== null) {
          setIsEnabled(savedEnabled === "true");
        }
        setIsInitialized(true);
      } catch (err) {
        console.warn("Failed to load background audio preferences:", err);
        setIsInitialized(true);
      }
    }
    loadPreferences();
  }, []);

  // Load audio when URL changes
  useEffect(() => {
    if (currentAudioUrl && isEnabled) {
      try {
        const source: AudioSource = { uri: currentAudioUrl };
        player.replace(source);
        player.loop = true;
        player.volume = volume;
      } catch (err) {
        console.warn("Failed to load background audio:", err);
      }
    }
  }, [currentAudioUrl, isEnabled]);

  // Update volume when it changes
  useEffect(() => {
    try {
      player.volume = volume;
    } catch (err) {
      // Ignore
    }
  }, [volume, player]);

  // Load audio by URL
  const loadAudio = useCallback(
    (url: string) => {
      setCurrentAudioUrl(url);
    },
    []
  );

  // Select a sound and persist choice (without loading audio yet)
  const selectSound = useCallback(
    async (soundId: string | null) => {
      setSelectedSoundId(soundId);
      if (!soundId) {
        setCurrentAudioUrl(null);
      }

      try {
        if (soundId) {
          await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_SOUND, soundId);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_SOUND);
        }
      } catch (err) {
        console.warn("Failed to save sound preference:", err);
      }
    },
    []
  );

  // Set volume and persist
  const setVolume = useCallback(async (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    try {
      player.volume = clampedVolume;
      await AsyncStorage.setItem(STORAGE_KEYS.VOLUME, clampedVolume.toString());
    } catch (err) {
      console.warn("Failed to save volume preference:", err);
    }
  }, [player]);

  // Toggle enabled state and persist
  const setEnabled = useCallback(async (enabled: boolean) => {
    setIsEnabled(enabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, enabled.toString());
      if (!enabled) {
        player.pause();
      }
    } catch (err) {
      console.warn("Failed to save enabled preference:", err);
    }
  }, [player]);

  // Play background audio
  const play = useCallback(() => {
    if (!isEnabled || !currentAudioUrl) return;
    try {
      player.loop = true;
      player.volume = volume;
      player.play();
    } catch (err) {
      console.warn("Failed to play background audio:", err);
    }
  }, [player, isEnabled, currentAudioUrl, volume]);

  // Pause background audio
  const pause = useCallback(() => {
    try {
      player.pause();
    } catch (err) {
      console.warn("Failed to pause background audio:", err);
    }
  }, [player]);

  // Stop and reset
  const stop = useCallback(() => {
    try {
      player.pause();
      player.seekTo(0);
    } catch (err) {
      console.warn("Failed to stop background audio:", err);
    }
  }, [player]);

  // Cleanup
  const cleanup = useCallback(() => {
    try {
      player.pause();
    } catch (err) {
      // Ignore cleanup errors
    }
  }, [player]);

  const state: BackgroundAudioState = {
    isPlaying: status.playing,
    isLoading: !status.isLoaded || status.isBuffering,
    selectedSoundId,
    volume,
    isEnabled,
  };

  return {
    // State
    ...state,
    isInitialized,
    hasAudioLoaded: !!currentAudioUrl,

    // Actions
    selectSound,
    loadAudio,
    setVolume,
    setEnabled,
    play,
    pause,
    stop,
    cleanup,
  };
}
