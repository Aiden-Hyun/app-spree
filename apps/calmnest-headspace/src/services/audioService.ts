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
  private isAudioModeConfigured: boolean = false;
  private audioModePromise: Promise<void> | null = null;
  private currentState: AudioState = {
    isPlaying: false,
    isLoading: false,
    duration: 0,
    position: 0,
    error: null,
  };

  constructor() {
    this.audioModePromise = this.configureAudioMode();
  }

  private async configureAudioMode(): Promise<void> {
    if (this.isAudioModeConfigured) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      this.isAudioModeConfigured = true;
    } catch (error) {
      console.warn('Failed to configure audio mode:', error);
      // Don't throw - audio may still work with default settings
    }
  }
  
  private async ensureAudioModeConfigured(): Promise<void> {
    if (this.audioModePromise) {
      await this.audioModePromise;
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
    } else if ('error' in status && status.error) {
      this.updateState({
        error: String(status.error),
        isLoading: false,
      });
    }
  };

  /**
   * Load audio from a URI string or a local asset (require())
   * @param source - Either a URI string or a require() asset number
   */
  async loadAudio(source: string | number) {
    try {
      this.updateState({ isLoading: true, error: null });

      // Ensure audio mode is configured before loading
      await this.ensureAudioModeConfigured();

      // Unload previous sound if exists
      if (this.sound) {
        await this.unloadAudio();
      }

      // Determine if source is a local asset (number) or remote URI (string)
      const audioSource = typeof source === 'number' 
        ? source  // Local asset from require()
        : { uri: source };  // Remote URI

      // Create and load new sound with error handling
      try {
        const { sound } = await Audio.Sound.createAsync(
          audioSource,
          { shouldPlay: false },
          this.onPlaybackStatusUpdate
        );

        this.sound = sound;
        this.updateState({ isLoading: false });
      } catch (loadError) {
        // Handle Android-specific audio decoding errors gracefully
        const errorMessage = loadError instanceof Error ? loadError.message : 'Unknown audio error';
        console.warn('Audio loading error (may be unsupported format):', errorMessage);
        
        this.updateState({
          error: 'Audio unavailable for this session',
          isLoading: false,
        });
        // Don't rethrow - allow the app to continue without audio
      }
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to load audio',
        isLoading: false,
      });
      // Don't rethrow - allow the app to continue
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
