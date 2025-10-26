import { Audio, AVPlaybackStatus } from 'expo-av';

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  position: number;
  error: string | null;
}

export class AudioService {
  private sound: Audio.Sound | null = null;
  private updateCallback: ((state: AudioState) => void) | null = null;
  private currentState: AudioState = {
    isPlaying: false,
    isLoading: false,
    duration: 0,
    position: 0,
    error: null,
  };

  constructor() {
    this.configureAudioMode();
  }

  private async configureAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Failed to configure audio mode:', error);
    }
  }

  setUpdateCallback(callback: (state: AudioState) => void) {
    this.updateCallback = callback;
  }

  private updateState(updates: Partial<AudioState>) {
    this.currentState = { ...this.currentState, ...updates };
    if (this.updateCallback) {
      this.updateCallback(this.currentState);
    }
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      this.updateState({
        isPlaying: status.isPlaying,
        duration: status.durationMillis ? status.durationMillis / 1000 : 0,
        position: status.positionMillis ? status.positionMillis / 1000 : 0,
        error: null,
      });
    } else if (status.error) {
      this.updateState({
        error: status.error,
        isLoading: false,
      });
    }
  };

  async loadAudio(uri: string) {
    try {
      this.updateState({ isLoading: true, error: null });

      // Unload previous sound if exists
      if (this.sound) {
        await this.unloadAudio();
      }

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.updateState({ isLoading: false });
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to load audio',
        isLoading: false,
      });
      throw error;
    }
  }

  async play() {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.playAsync();
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to play audio',
      });
      throw error;
    }
  }

  async pause() {
    if (!this.sound) return;

    try {
      await this.sound.pauseAsync();
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  }

  async stop() {
    if (!this.sound) return;

    try {
      await this.sound.stopAsync();
      await this.sound.setPositionAsync(0);
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }

  async seekTo(position: number) {
    if (!this.sound) return;

    try {
      await this.sound.setPositionAsync(position * 1000); // Convert to milliseconds
    } catch (error) {
      console.error('Failed to seek audio:', error);
    }
  }

  async setVolume(volume: number) {
    if (!this.sound) return;

    try {
      await this.sound.setVolumeAsync(volume);
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }

  async unloadAudio() {
    if (!this.sound) return;

    try {
      await this.sound.unloadAsync();
      this.sound = null;
      this.updateState({
        isPlaying: false,
        duration: 0,
        position: 0,
      });
    } catch (error) {
      console.error('Failed to unload audio:', error);
    }
  }

  getCurrentState(): AudioState {
    return this.currentState;
  }
}

export const audioService = new AudioService();
