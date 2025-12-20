/**
 * Audio file mapping for meditation content
 * 
 * Maps audio_file identifiers (used in Firestore) to audio URLs
 * Using royalty-free meditation music from Pixabay
 */

export const audioFiles: Record<string, string> = {
  // Calm meditation - soothing, relaxation focused (peaceful ambient)
  meditation_calm: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  
  // Focus meditation - concentration, alertness (gentle focus music)
  meditation_focus: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3',
};

// Type for valid audio file keys
export type AudioFileKey = keyof typeof audioFiles;

// Helper to get audio file by key - returns URL string
export function getAudioFile(key: string): string | null {
  return audioFiles[key] || null;
}

// List of all available audio file keys
export const audioFileKeys = Object.keys(audioFiles) as AudioFileKey[];
