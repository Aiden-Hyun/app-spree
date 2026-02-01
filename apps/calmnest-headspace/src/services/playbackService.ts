import TrackPlayer, { Event } from "react-native-track-player";

/**
 * Playback service for handling remote control events and background playback.
 * This runs in a separate JS context.
 * 
 * Named export for proper registration (FIX #2)
 */
export async function playbackService() {
  console.log("TrackPlayer playbackService registered");
  
  // Remote control handlers
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log("Remote: Play");
    await TrackPlayer.play();
  });
  
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log("Remote: Pause");
    await TrackPlayer.pause();
  });
  
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log("Remote: Stop");
    await TrackPlayer.stop();
  });
  
  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    console.log("Remote: Next");
    await TrackPlayer.skipToNext();
  });
  
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    console.log("Remote: Previous");
    await TrackPlayer.skipToPrevious();
  });
  
  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    console.log("Remote: Seek to", event.position);
    await TrackPlayer.seekTo(event.position);
  });
  
  // Handle remote toggle (some devices send this instead of play/pause)
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    console.log("Remote: Duck", event);
    if (event.paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });

  // Clear Now Playing when playback naturally ends (FIX #5)
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async (data) => {
    // Only reset if track actually finished (not skipped)
    if (data.position > 0) {
      // Small delay to allow any UI cleanup
      setTimeout(() => {
        TrackPlayer.reset();
      }, 500);
    }
  });

  // Handle playback errors
  TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
    console.error("Playback error:", error);
  });
}
