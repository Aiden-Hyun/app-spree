import TrackPlayer from "react-native-track-player";

// Register playback service BEFORE app starts
// Must use require() for background service registration
TrackPlayer.registerPlaybackService(() => require("./src/services/playbackService").playbackService);

// Import expo-router entry point - this must come after TrackPlayer registration
import "expo-router/entry";
