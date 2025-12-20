/**
 * Audio file mapping for local meditation content
 * 
 * Maps audio_file identifiers (used in Firestore) to local require() statements
 * This allows us to reference audio files by string ID in the database
 * while loading them locally from the app bundle.
 */

export const audioFiles: Record<string, any> = {
  // Calm meditation - soothing, relaxation focused
  meditation_calm: require('../../assets/audio/meditation_calm.wav'),
  
  // Focus meditation - concentration, alertness
  meditation_focus: require('../../assets/audio/meditation_focus.wav'),
};

// Type for valid audio file keys
export type AudioFileKey = keyof typeof audioFiles;

// Helper to get audio file by key
export function getAudioFile(key: string): any | null {
  return audioFiles[key] || null;
}

// List of all available audio file keys
export const audioFileKeys = Object.keys(audioFiles) as AudioFileKey[];

