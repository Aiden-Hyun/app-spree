import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  IOSCategory,
  IOSCategoryMode,
  IOSCategoryOptions,
} from "react-native-track-player";

// Shared init promise to prevent race conditions (FIX #6)
let initPromise: Promise<boolean> | null = null;

/**
 * Initialize TrackPlayer with iOS category configuration.
 * Uses singleton pattern - safe to call multiple times, only initializes once.
 */
export async function setupTrackPlayer(): Promise<boolean> {
  // If already initializing/initialized, return the same promise
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await TrackPlayer.setupPlayer({
        // iOS audio session configuration
        iosCategory: IOSCategory.Playback,
        iosCategoryMode: IOSCategoryMode.SpokenAudio,
        // Allow mixing so ambient sounds (expo-audio) can play alongside
        // DuckOthers makes ambient sounds quieter when main content plays
        iosCategoryOptions: [
          IOSCategoryOptions.MixWithOthers,
          IOSCategoryOptions.DuckOthers,
          IOSCategoryOptions.AllowBluetooth,
          IOSCategoryOptions.AllowBluetoothA2DP,
        ],
      });

      await TrackPlayer.updateOptions({
        // Capabilities for Lock Screen / Control Center
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SeekTo,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        // What happens when app is killed
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
      });
      
      console.log("TrackPlayer initialized successfully");

      return true;
    } catch (error: any) {
      // Handle "already initialized" gracefully
      if (error?.message?.includes("already been initialized")) {
        console.log("TrackPlayer already initialized");
        return true;
      }
      console.error("Failed to setup Track Player:", error);
      // Reset promise so it can be retried
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

/**
 * Add a track to the player queue (replaces current track)
 */
export async function addTrack(track: {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
}): Promise<void> {
  console.log("TrackPlayer addTrack:", track.title, track.url?.substring(0, 50));
  
  // Ensure player is initialized before adding track
  await setupTrackPlayer();
  
  await TrackPlayer.reset();
  await TrackPlayer.add({
    id: track.id,
    url: track.url,
    title: track.title,
    artist: track.artist || "CalmNest",
    artwork: track.artwork,
    duration: track.duration,
  });
  
  console.log("TrackPlayer track added successfully");
}

/**
 * Clear Now Playing when session ends (FIX #5)
 */
export async function clearNowPlaying(): Promise<void> {
  await TrackPlayer.reset();
}
