/**
 * Audio file mapping for meditation content
 * 
 * Maps audio_file identifiers (used in Firestore) to audio URLs
 * Using royalty-free meditation music from Pixabay (Pixabay Content License)
 * 
 * Audio categories match meditation content themes for better user experience
 */

export const audioFiles: Record<string, string> = {
  // ========== MEDITATION CATEGORY AUDIO ==========
  
  // Gratitude - Warm, uplifting ambient music for morning gratitude sessions
  meditation_gratitude: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
  
  // Stress Relief - Soothing, calming music for stress release
  meditation_stress: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  
  // Focus - Minimal, clarity-focused ambient for concentration
  meditation_focus: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3',
  
  // Anxiety - Grounding, gentle tones for anxiety relief
  meditation_anxiety: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e5765c1f0d.mp3',
  
  // Sleep - Slow, drowsy ambient for sleep preparation
  meditation_sleep: 'https://cdn.pixabay.com/audio/2022/05/16/audio_460b6818e5.mp3',
  
  // Body Scan - Slow, flowing relaxation music
  meditation_bodyscan: 'https://cdn.pixabay.com/audio/2023/01/16/audio_4d3405d095.mp3',
  
  // Self-Esteem - Warm, encouraging, uplifting music
  meditation_selfesteem: 'https://cdn.pixabay.com/audio/2022/10/30/audio_a683d27efc.mp3',
  
  // Loving Kindness - Heart-opening, soft, compassionate music
  meditation_lovingkindness: 'https://cdn.pixabay.com/audio/2023/03/21/audio_a9bc247c76.mp3',
  
  // ========== SLEEP STORY CATEGORY AUDIO ==========
  
  // Nature - Forest ambiance with birds and gentle wind
  sleep_nature: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3',
  
  // Ocean - Gentle ocean waves for sleep
  sleep_ocean: 'https://cdn.pixabay.com/audio/2022/03/24/audio_92f6c11a8e.mp3',
  
  // Rain - Soft rain sounds for relaxation
  sleep_rain: 'https://cdn.pixabay.com/audio/2022/10/09/audio_d40737daaa.mp3',
  
  // Fantasy/Travel - Dreamy, ethereal ambient for story journeys
  sleep_fantasy: 'https://cdn.pixabay.com/audio/2022/08/23/audio_d8c3c5b7a8.mp3',
  
  // ========== BREATHING EXERCISE AUDIO ==========
  
  // Calm breathing - Soft, minimal background for breathing exercises
  breathing_calm: 'https://cdn.pixabay.com/audio/2022/01/20/audio_dbb0e06c3c.mp3',
  
  // Energizing breathing - Slightly more uplifting for energy exercises
  breathing_energy: 'https://cdn.pixabay.com/audio/2022/11/22/audio_eb08eab5c4.mp3',
  
  // ========== LEGACY KEYS (for backward compatibility) ==========
  // These map to appropriate category audio for existing content
  
  meditation_calm: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
};

// Type for valid audio file keys
export type AudioFileKey = keyof typeof audioFiles;

// Helper to get audio file by key - returns URL string
export function getAudioFile(key: string): string | null {
  return audioFiles[key] || null;
}

// List of all available audio file keys
export const audioFileKeys = Object.keys(audioFiles) as AudioFileKey[];
