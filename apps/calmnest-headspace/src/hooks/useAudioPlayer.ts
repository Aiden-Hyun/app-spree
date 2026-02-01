/**
 * Re-export useTrackPlayer as useAudioPlayer for backwards compatibility.
 * 
 * This allows all existing player screens to automatically use the new
 * react-native-track-player implementation without code changes.
 * 
 * The original expo-audio implementation is preserved in useAudioPlayer.expo.ts
 * for rollback if needed.
 */
export { useTrackPlayer as useAudioPlayer } from "./useTrackPlayer";
export type { TrackPlayerState as AudioPlayerState, TrackMetadata } from "./useTrackPlayer";
